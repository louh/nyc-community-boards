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
  var coords = document.querySelector('.leaflet-pelias-selected').coords
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

  var textEl = document.querySelector('.community-district-title')

  if (districtGeo.features.length > 0) {
    var districtNum = districtGeo.features[0].properties.communityDistrict
    textEl.textContent = getDistrictName(districtNum)
  } else {
    textEl.textContent = ''
  }
}

// Do not show any popups at all
// showMarker() is rewritten to do custom stuff
geocoder.origShowMarker = geocoder.showMarker
geocoder.showMarker = function (text, coords) {
  this.removeMarkers();

  var geo = [coords[1], coords[0]];
  var markerOptions = (typeof this.options.markers === 'object') ? this.options.markers : {};

  if (this.options.markers) {
    this.marker = new L.marker(geo, markerOptions);
    this._map.addLayer(this.marker);
    this.markers.push(this.marker);
  }
}

function getDistrictName(id) {
  var str = id.toString()
  var boroId = window.parseInt(str.charAt(0), 10)
  var boardId = str.substr(1)
  var boro
  switch (boroId) {
    case 1:
      boro = 'Manhattan'
      break
    case 2:
      boro = 'Bronx'
      break
    case 3:
      boro = 'Brooklyn'
      break
    case 4:
      boro = 'Queens'
      break
    case 5:
      boro = 'Staten Islamd'
      break
    default:
      return null
  }
  if (boardId.charAt(0) === '0') {
    boardId = boardId.slice(1)
  }
  return boro + ' Community Board ' + boardId
}
