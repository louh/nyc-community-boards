import 'babel-polyfill'
import 'whatwg-fetch' // Polyfills window.fetch

import L from 'leaflet'
import Tangram from 'tangram' // via browserify-shim
import Geocoder from 'leaflet-geocoder-mapzen'
import 'leaflet-hash'

import bbox from '@turf/bbox'

const turf = {
  bbox
}

import { store } from './store'
import { detects } from './detects'
import { findDistricts } from './search'
import { getDistrictById } from './districts'

const BOUNDARY_GEOJSON = 'data/boundaries.geojson'
const SEARCH_API_KEY = 'search-pRNNjzA'

// Query string parsing
let queryparams = getQueryParams()

// Create a basic Leaflet map
let initialZoom = (window.innerWidth < 700) ? 10 : 11
let map = L.map('map', {
  zoomControl: false,
  minZoom: 10,
  // Allows fractional zoom on fitBounds() (future Leaflets)
  zoomSnap: 0.25,
  // If iframed, disable scroll wheel
  scrollWheelZoom: (window.self === window.top),
  // If iframed & touchscreen, disable dragging & tap to prevent Leaflet
  // from hijacking the page scroll.
  dragging: !(window.self !== window.top && L.Browser.touch),
  tap: !(window.self !== window.top && L.Browser.touch)
}).setView([40.7114, -73.9716], initialZoom)

// Set this manually for bundled Leaflet
L.Icon.Default.imagePath = 'images'

// Add zoom control back on upper right to
// get out of the way of the search UI
map.addControl(L.control.zoom({
  position: 'topright'
}))

map.on('click', function (e) {
  const latlng = e.latlng
  const reverse = `https://search.mapzen.com/v1/reverse?point.lat=${latlng.lat}&point.lon=${latlng.lng}&size=1&layers=address&api_key=${SEARCH_API_KEY}`

  // Show marker on clicked location immediately
  geocoder.showMarker(null, latlng)

  // Reverse geocode and then display things based on it
  window.fetch(reverse)
    .then(function (response) {
      if (response.status !== 200) {
        throw new Error(`status code: ${response.status}`)
      }

      return response.json()
    })
    .then(function (response) {
      const label = response.features[0].properties.label

      geocoder._input.value = label
      // Show reset button
      if (geocoder._input.value.length > 0) {
        geocoder._reset.classList.remove('leaflet-pelias-hidden')
      }
      selectLocation(latlng, label)
    })
    .catch(function (error) {
      console.log('error getting reverse geocode. ' + error)
    })
})

let hash = new L.Hash(map) // eslint-disable-line no-unused-vars

// Add Tangram scene layer if webgl present.
// For debug reasons you can also just pass webgl=false in the params
if (detects.webgl && !(queryparams.webgl)) {
  const layer = Tangram.leafletLayer({
    leaflet: L,
    scene: 'scene.yaml',
    attribution: '&copy; OpenStreetMap contributors | <a href="https://mapzen.com/">Mapzen</a>'
  }).addTo(map)

  // Debug
  window.layer = layer
} else {
  // No WebGL fallback
  let tileUrl = '//tile.stamen.com/toner/{z}/{x}/{y}.png'

  // Retina tiles
  if (window.devicePixelRatio >= 2) {
    tileUrl = '//tile.stamen.com/toner/{z}/{x}/{y}@2x.png'
  }

  L.tileLayer(tileUrl, {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.'
  }).addTo(map)

  // GeoJSON boundary
  const style = {
    color: '#bbb',
    fillColor: 'transparent',
    weight: 4,
    opacity: 0.5
  }

  window.fetch(BOUNDARY_GEOJSON)
    .then(function (response) {
      if (response.status !== 200) {
        throw new Error(`status code: ${response.status}`)
      }

      return response.json()
    })
    .then(function (geojson) {
      L.geoJson(geojson, {
        style: style
      }).addTo(map)
    })
    .catch(function (error) {
      console.log('error getting boundary geojson: ' + error)
    })
}

const districtStyle = {
  color: '#ff4444',
  fillColor: 'transparent',
  weight: 4,
  opacity: 0.7
}

let districtLayer

// Add Pelias geocoding plugin
let geocoderOptions = {
  markers: {
    icon: L.divIcon({ className: 'point-marker' }),
    clickable: false,
    keyboard: false
  },
  pointIcon: false,
  polygonIcon: false,
  expanded: true,
  fullWidth: false,
  panToPoint: false,
  autocomplete: true,
  layers: ['venue', 'address'],
  bounds: L.latLngBounds([[40.9260, -74.2212], [40.4924, -73.6911]]),
  attribution: ''
}
// Instructions are hidden on mobile screens to save room, so put it in the placeholder
if (window.matchMedia('only screen and (max-width: 480px) and (orientation: portrait)')) {
  geocoderOptions.placeholder = 'Search by your address'
}
const geocoder = new Geocoder(SEARCH_API_KEY, geocoderOptions).addTo(map)
document.getElementById('geocoder').appendChild(geocoder.getContainer())
geocoder.focus()

// debug
window.geocoder = geocoder

// Custom behavior on selecting a result
geocoder.on('select', function (e) {
  var label = e.feature.properties.label
  var latlng = e.latlng

  selectLocation(latlng, label)
})

// If geocoder is reset, also clear everything else
geocoder.on('reset', function (e) {
  clearData()
  clearUrl()
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

  const markerOptions = (typeof this.options.markers === 'object') ? this.options.markers : {}

  if (this.options.markers) {
    this.marker = new L.Marker(latlng, markerOptions)
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
    geocoder._input.dispatchEvent(new window.KeyboardEvent('keyup', {
      'cancelable': true
    }))
  }
  if (queryparams.lat && queryparams.lng) {
    queryparams.lat = window.parseFloat(queryparams.lat)
    queryparams.lng = window.parseFloat(queryparams.lng)
    const latlng = { lat: queryparams.lat, lng: queryparams.lng }
    geocoder.showMarker(null, latlng)
    displayCommunityBoard(latlng)
  }
}, 0)

function selectLocation (latlng, label) {
  store.dispatch({
    type: 'SET_SEARCH_QUERY',
    query: label
  })

  displayCommunityBoard(latlng)

  // Set url
  var querystring = '?query=' + encodeURIComponent(label) +
    '&lat=' + encodeURIComponent(latlng.lat) +
    '&lng=' + encodeURIComponent(latlng.lng)
  window.history.pushState({
    lat: latlng.lat,
    lng: latlng.lng,
    query: label
  }, null, querystring)
}

// Render the community board view
// TODO: Cache & share references to elements.
function fillOutData (data) {
  clearData()

  const dataEl = document.getElementById('board-info')
  dataEl.style.display = 'block'

  dataEl.querySelector('.community-board-label').textContent = data.label
  dataEl.querySelector('.data.neighborhoods').textContent = data.data.neighborhoods
  dataEl.querySelector('.data.address').innerHTML = data.data.address.replace(/\n/g, '<br>')
  dataEl.querySelector('.data.phone').textContent = data.data.phone

  let email = data.data.email
  if (email) {
    dataEl.querySelector('.data.email').textContent = data.data.email
  } else {
    dataEl.querySelector('.data.email').textContent = 'None provided'
  }

  // HACK: some scraped website URLs have this prefix: http://www.nyc.gov/cgi-bin/exit.pl?url=
  // and that needs to go away
  const goAway = 'http://www.nyc.gov/cgi-bin/exit.pl?url='
  const websiteEl = document.querySelector('.data.website')
  if (data.data.website.href) {
    let href = data.data.website.href.replace(goAway, '')
    let anchorEl = document.createElement('a')
    anchorEl.href = href
    anchorEl.appendChild(document.createTextNode(href))
    websiteEl.appendChild(anchorEl)
  } else {
    websiteEl.appendChild(document.createTextNode('None provided'))
  }

  document.getElementById('intro').style.display = 'none'
}

// Clear the community board view
function clearData () {
  const dataEl = document.getElementById('board-info')
  const contents = dataEl.querySelectorAll('.data')
  for (let i = 0, j = contents.length; i < j; i++) {
    contents[i].textContent = ''
  }
  dataEl.style.display = 'none'
  document.querySelector('.data.website').innerHTML = ''
  document.getElementById('message').textContent = ''
  document.getElementById('message').style.display = 'none'
  document.getElementById('intro').style.display = 'block'
}

function clearUrl () {
  window.history.pushState({}, null, window.location.origin + window.location.pathname + window.location.hash)
}

function showMessage (msg) {
  clearData()
  document.getElementById('message').textContent = msg
  document.getElementById('message').style.display = 'block'
  document.getElementById('intro').style.display = 'none'
}

function addDistrictGeoToMap (geojson) {
  districtLayer = L.geoJson(geojson, {
    style: districtStyle
  }).addTo(map)

  // Zoom to bounds
  // WSEN order (west, south, east, north)
  const bbox = turf.bbox(geojson)
  let fitOptions = {
    paddingTopLeft: [250, 10],
    paddingBottomRight: [10, 10],
    animate: false
  }
  // For portrait mobile size screens that match the CSS breakpoint,
  // no side padding, but use top and bottom padding
  if (window.matchMedia('(max-width: 480px) and (orientation: portrait)').matches === true) {
    fitOptions.paddingTopLeft = [0, 100]
    fitOptions.paddingBottomRight = [0, 200]
  }
  // On landscape mobile size screens, use left side padding only
  if (window.matchMedia('(max-width: 736px) and (orientation: landscape)').matches === true) {
    fitOptions.paddingTopLeft = [0, 0]
    fitOptions.paddingBottomRight = [0, 0]
  }
  // southwest latlng, northeast latlng
  map.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]], fitOptions)
}

function displayCommunityBoard (latlng) {
  // Clear previous district if any
  if (districtLayer) {
    map.removeLayer(districtLayer)
  }

  // Find and add district
  const districtGeo = findDistricts(latlng)

  districtGeo.then(geo => {
    if (geo) {
      addDistrictGeoToMap(geo)

      const data = getDistrictById(geo.id)

      if (data.error === true) {
        showMessage(data.message)
      } else {
        fillOutData(data)
      }
    } else {
      showMessage('This site only has results for New York City.')

      // zoom to the geo point anyway
      map.setView(latlng, 14, {
        animate: true
      })
    }
  })
}

// Returns empty object if no params
function getQueryParams () {
  const string = window.location.search.substr(1)
  const units = string.split('&')
  const params = {}

  units.forEach(unit => {
    const pair = unit.split('=')
    params[pair[0]] = window.decodeURIComponent(pair[1])
  })

  return params
}
