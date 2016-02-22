'use strict'

import L from 'leaflet'
import Tangram from 'tangram' // via browserify-shim
import 'leaflet-hash'
import 'leaflet-geocoder-mapzen'

import ajax from 'component-ajax'
import extent from 'turf-extent'

const turf = {
  extent
}

import { store } from './store'
import { feature } from './feature'
import { findDistricts } from './search'
import { getDistrictById } from './districts'

// Query string parsing
let queryparams = getQueryParams()

// Create a basic Leaflet map
let map = L.map('map', {
  zoomControl: false,
  minZoom: 10,
  // If iframed, disable scroll wheel
  scrollWheelZoom: (window.self === window.top) ? true : false,
  // If iframed & touchscreen, disable dragging & tap to prevent Leaflet
  // from hijacking the page scroll.
  dragging: (window.self !== window.top && L.Browser.touch) ? false : true,
  tap: (window.self !== window.top && L.Browser.touch) ? false : true,
}).setView([40.7114, -73.9716], 11)

// Set this manually for bundled Leaflet
L.Icon.Default.imagePath = 'images'

// Add zoom control back on upper right to
// get out of the way of the search UI
map.addControl(L.control.zoom({
  position: 'topright'
}))

let hash = new L.Hash(map)

// Add Tangram scene layer if webgl present.
// For debug reasons you can also just pass webgl=false in the params
if (feature.webgl && !(queryparams.webgl)) {
  var layer = Tangram.leafletLayer({
    leaflet: L,
    scene: 'https://cdn.rawgit.com/tangrams/refill-style/6785c8c8d87edfde9e9b2e63b7a9807882b20076/refill-style.yaml',
    attribution: '&copy; OpenStreetMap contributors | <a href="https://mapzen.com/">Mapzen</a>'
  }).addTo(map)

  // Debug
  window.layer = layer
} else {
  // No WebGL fallback
  var tileUrl = '//tile.stamen.com/toner/{z}/{x}/{y}.png'
  // Retina tiles
  if (window.devicePixelRatio >= 2) {
    tileUrl = '//tile.stamen.com/toner/{z}/{x}/{y}@2x.png'
  }
  L.tileLayer(tileUrl, {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.',
  }).addTo(map)
}

var style = {
  color: '#bbb',
  fillColor: 'transparent',
  weight: 4,
  opacity: 0.5
}

var districtStyle = {
  color: '#ff4444',
  fillColor: 'transparent',
  weight: 4,
  opacity: 0.7
}

var boundaryLayer
var districtLayer

// var createObjectURL = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL)

// layer.on('init', function () {
//   ajax({
//     url: 'site/data/boundaries.geojson',
//     success: function (response) {
//       // What if we injected this into Tangram
//       var content = JSON.stringify(response)
//       layer.scene.config.sources['city'] = {
//         url: createObjectURL(new Blob([content]))
//       }
//       var layerStyle = {
//         data: { source: 'city' },
//         draw: {
//           polygons: {
//             order: 10,
//             color: 'red',
//             width: '10px'
//           }
//         }
//       }
//       layer.scene.config.layers['city'] = layerStyle
//       layer.scene.rebuild()
//     },
//     error: function () {
//       console.log('error getting boundary geojson')
//     }
//   })
// })

ajax({
  url: 'site/data/boundaries.geojson',
  success: function (response) {
    // This is a string in local, but object on server
    var geo = (typeof response === 'string') ? JSON.parse(response) : response
    boundaryLayer = L.geoJson(geo, {
      style: style
    }).addTo(map)
  },
  error: function () {
    console.log('error getting boundary geojson')
  }
})

// Add Pelias geocoding plugin
var geocoder = new L.Control.Geocoder('search-pRNNjzA', {
  markers: {
    icon: L.divIcon({ className: 'point-marker' }),
    clickable: false,
    keyboard: false
  },
  // TODO: update geocoder & fix this
  pointIcon: false,
  polygonIcon: false,
  expanded: true,
  fullWidth: false,
  panToPoint: false,
  autocomplete: false,
  bounds: L.latLngBounds([[40.9260, -74.2212], [40.4924, -73.6911]]),
  attribution: ''
}).addTo(map);

geocoder.focus = function () {
  // If not expanded, expand this first
  if (!L.DomUtil.hasClass(this._container, 'leaflet-pelias-expanded')) {
    this.expand();
  }
  this._input.focus();
}

geocoder.focus();

// debug
window.geocoder = geocoder

// Custom behavior on selecting a result
geocoder.on('select', function (e) {
  var label = e.feature.properties.label
  var latlng = e.latlng

  store.dispatch({
    type: 'SET_SEARCH_QUERY',
    query: label
  })
  console.log(store.getState())

  displayCommunityBoard(latlng)

  // Set url
  var querystring = '?query=' + encodeURIComponent(label)
    + '&lat=' + encodeURIComponent(latlng.lat)
    + '&lng=' + encodeURIComponent(latlng.lng)
  window.history.pushState({
    lat: latlng.lat,
    lng: latlng.lng,
    query: label
  }, null, querystring)
})

// If geocoder is reset, also clear everything else
geocoder.on('reset', function (e) {
  clearData()
  if (districtLayer) {
    map.removeLayer(districtLayer)
  }
})

// Do not show any popups at all
// This augments geocoder functionality by rewiring internal
// showMarker() to do custom stuff. There is no guarantee that these
// internal methods will continue to be supported as is forever!
geocoder.origShowMarker = geocoder.showMarker
geocoder.showMarker = function (text, latlng) {
  this.removeMarkers()

  var markerOptions = (typeof this.options.markers === 'object') ? this.options.markers : {}

  if (this.options.markers) {
    this.marker = new L.marker(latlng, markerOptions)
    this._map.addLayer(this.marker)
    this.markers.push(this.marker)
  }
}

// Prepopulate the geocoder input if there is something in query params
window.setTimeout(function () {
  if (queryparams.query) {
    geocoder._input.value = queryparams.query
    geocoder._input.focus()
    // Fire an event to hide the search box, which is empty
    // at this point so it looks weird
    geocoder._input.dispatchEvent(new KeyboardEvent('keyup', {
      'cancelable': true
    }))
  }
  if (queryparams.lat && queryparams.lng) {
    queryparams.lat = window.parseFloat(queryparams.lat)
    queryparams.lng = window.parseFloat(queryparams.lng)
    var latlng = { lat: queryparams.lat, lng: queryparams.lng }
    geocoder.showMarker(null, latlng)
    displayCommunityBoard(latlng)
  }
}, 0)

// Render the community board view
// TODO: Cache & share references to elements.
function fillOutData (data) {
  clearData()

  var dataEl = document.getElementById('board-info')
  dataEl.style.display = 'block'

  dataEl.querySelector('.community-board-label').textContent = data.label
  dataEl.querySelector('.data.neighborhoods').textContent = data.data.neighborhoods
  dataEl.querySelector('.data.address').innerHTML = data.data.address.replace(/\n/g, '<br>')
  dataEl.querySelector('.data.phone').textContent = data.data.phone
  dataEl.querySelector('.data.email').textContent = data.data.email
  dataEl.querySelector('.data.website').textContent = data.data.website.href
  dataEl.querySelector('.data.website').href = data.data.website.href

  document.getElementById('intro').style.display = 'none'
}

// Clear the community board view
function clearData () {
  var dataEl = document.getElementById('board-info')
  var contents = dataEl.querySelectorAll('.data')
  for (var i = 0, j = contents.length; i < j; i++) {
    contents[i].textContent = ''
  }
  dataEl.querySelector('.data.website').href = ''
  dataEl.style.display = 'none'
  document.getElementById('message').textContent = ''
  document.getElementById('message').style.display = 'none'
  document.getElementById('intro').style.display = 'block'
}

function showMessage (msg) {
  clearData()
  document.getElementById('message').textContent = msg
  document.getElementById('message').style.display = 'block'
  document.getElementById('intro').style.display = 'none'
}

function getDistrictGeo (latlng) {
  // Clear previous district if any
  if (districtLayer) {
    map.removeLayer(districtLayer)
  }

  // Find and add district
  var districtGeo = findDistricts(latlng)

  // Exit now if there's no geo
  if (!districtGeo) {
    // zoom to the geo point anyway
    map.setView(latlng, 14, {
      animate: true
    })
    return null
  }

  districtLayer = L.geoJson(districtGeo, {
    style: districtStyle
  }).addTo(map)

  // Zoom to bounds
  // WSEN order (west, south, east, north)
  var bbox = turf.extent(districtGeo)
  // southwest latlng, northeast latlng
  map.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]], {
    paddingTopLeft: [250, 0],
    animate: true
  })

  return districtGeo
}

function displayCommunityBoard (latlng) {
  var districtGeo = getDistrictGeo(latlng)

  if (districtGeo && districtGeo.features.length > 0) {
    var id = districtGeo.features[0].properties.communityDistrict
    var data = getDistrictById(id)
    if (data.error === true) {
      showMessage(data.message)
    } else {
      fillOutData(data)
    }
  } else {
    showMessage('This site only has results for New York City.')
  }
}

// Returns empty object if no params
function getQueryParams () {
  var string = window.location.search.substr(1)
  var units = string.split('&')
  var params = {}

  for (var i = 0; i < units.length; i++) {
    var pair = units[i].split('=')
    params[pair[0]] = window.decodeURIComponent(pair[1])
  }

  return params
}
