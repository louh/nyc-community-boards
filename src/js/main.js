'use strict'

var L = require('leaflet')
var Tangram = require('tangram') // via browserify-shim
var LHash = require('leaflet-hash')
var geocoder = require('pelias-leaflet-geocoder')
var ajax = require('component-ajax')
var extent = require('turf-extent')
var turf = {
  extent: extent
}

var search = require('./search')
var districts = require('./districts')

// Query string parsing
var queryparams = getQueryParams()

// Create a basic Leaflet map
var accessToken = 'pk.eyJ1IjoibG91IiwiYSI6IkJDYlg3REEifQ.9BLp9eUdT11kUy1jgujSsQ'
var map = L.map('map', {
  zoomControl: false,
  minZoom: 10,
}).setView([40.7114, -73.9716], 11)

// Set this manually for bundled Leaflet
L.Icon.Default.imagePath = 'images'

map.addControl(L.control.zoom({
  position: 'topright'
}))

// If iframed, disable scroll wheel
if (window.self !== window.top) {
  map.scrollWheelZoom.disable()
}

// var tileUrl = 'https://api.mapbox.com/v4/lou.n26nngnj/{z}/{x}/{y}.png'
// if (window.devicePixelRatio >= 2) {
//   tileUrl = 'https://api.mapbox.com/v4/lou.n26nngnj/{z}/{x}/{y}@2x.png'
// }
// L.tileLayer(tileUrl + '?access_token=' + accessToken, {
//   attribution: 'Map imagery © <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>, Emoji by <a href="http://emojione.com/">Emoji One</a>'
// }).addTo(map)

var hash = new L.Hash(map)

// Add Tangram scene layer
var layer = Tangram.leafletLayer({
  leaflet: L,
  scene: 'https://raw.githubusercontent.com/tangrams/refill/gh-pages/refill.yaml',
  attribution: '&copy; OpenStreetMap contributors | <a href="https://mapzen.com/">Mapzen</a>'
}).addTo(map);

window.layer = layer

var style = {
  color: '#ff9999',
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
//     url: 'data/boundaries.geojson',
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
  url: 'data/boundaries.geojson',
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

// This augments geocoder functionality by rewiring internal
// methods to do other stuff. There is no guarantee that these
// internal methods will continue to be supported as is forever!

geocoder.origSetSelectedResult = geocoder.setSelectedResult
geocoder.setSelectedResult = function () {
  this.origSetSelectedResult()

  // Need to get the coords off of selected result.
  var selected = document.querySelector('.leaflet-pelias-selected')
  var query = selected.innerText || selected.textContent
  var coords = selected.coords

  displayCommunityBoard(coords)

  // Set url
  var querystring = '?query=' + encodeURIComponent(query)
    + '&lat=' + encodeURIComponent(coords[1])
    + '&lng=' + encodeURIComponent(coords[0])
  window.history.pushState({
    lat: coords[1],
    lng: coords[0],
    query: query
  }, null, querystring)
}

// Do not show any popups at all
// showMarker() is rewritten to do custom stuff
geocoder.origShowMarker = geocoder.showMarker
geocoder.showMarker = function (text, coords) {
  this.removeMarkers()

  var geo = [coords[1], coords[0]]
  var markerOptions = (typeof this.options.markers === 'object') ? this.options.markers : {}

  if (this.options.markers) {
    this.marker = new L.marker(geo, markerOptions)
    this._map.addLayer(this.marker)
    this.markers.push(this.marker)
  }
}

// Prepopulate the geocoder input if there is something in query params
window.setTimeout(function () {
  if (queryparams) {
    if (queryparams.query) {
      geocoder._input.value = queryparams.query
    }
    if (queryparams.lat && queryparams.lng) {
      queryparams.lat = window.parseFloat(queryparams.lat)
      queryparams.lng = window.parseFloat(queryparams.lng)
      var coords = [queryparams.lng, queryparams.lat]
      var districtGeo = getDistrictGeo(coords)
      geocoder.showMarker(null, coords)
      displayCommunityBoard(coords)
    }
  }
}, 0)

// Render the community board view
// TODO: Cache & share references to elements.
function fillOutData (data) {
  var textEl = document.querySelector('.community-district-title')
  textEl.textContent = data.label
}

// Clear the community board view
function clearData () {
  var textEl = document.querySelector('.community-district-title')
  textEl.textContent = ''
}

function getDistrictGeo (coords) {
  var feature = {
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': coords
    }
  }

  // Clear previous district if any
  if (districtLayer) {
    map.removeLayer(districtLayer)
  }

  // Find and add district
  var districtGeo = search.findDistricts(feature)
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

function displayCommunityBoard (coords) {
  var districtGeo = getDistrictGeo(coords)

  if (districtGeo.features.length > 0) {
    var id = districtGeo.features[0].properties.communityDistrict
    var data = districts.getById(id)
    fillOutData(data)
  } else {
    clearData()
  }
}

function getQueryParams () {
  var string = window.location.search.substr(1)
  if (!string || string.length === 0) {
    return undefined
  }
  var units = string.split('&')
  var params = {}

  for (var i = 0; i < units.length; i++) {
    var pair = units[i].split('=')
    params[pair[0]] = window.decodeURIComponent(pair[1])
  }

  return params
}
