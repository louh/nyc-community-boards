'use strict'

var L = require('leaflet')
var Tangram = require('tangram') // via browserify-shim
var LHash = require('leaflet-hash')
var geocoder = require('pelias-leaflet-geocoder')
var ajax = require('component-ajax')

// Create a basic Leaflet map
var accessToken = 'pk.eyJ1IjoibG91IiwiYSI6IkJDYlg3REEifQ.9BLp9eUdT11kUy1jgujSsQ'
var map = L.map('map', {
  zoomControl: false,
  minZoom: 10,
}).setView([40.7223, -73.9692], 11)

// Set this manually for bundled Leaflet
L.Icon.Default.imagePath = 'images/'

map.addControl(L.control.zoom({
  position: 'topright'
}))

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
  modifyScrollWheel: false,
  scene: 'https://raw.githubusercontent.com/tangrams/refill/gh-pages/refill.yaml',
  attribution: '&copy; OSM contributors | <a href="https://mapzen.com/">Mapzen</a>'
}).addTo(map);

ajax({
  url: 'data/boundaries.geojson',
  success: function (response) {
    // This is a string in local, but object on server
    if (typeof response === 'string') {
      response = JSON.parse(response)
    }
    L.geoJson(response, {
        style: {
          color: '#ff9999',
          fillColor: 'transparent',
          weight: 4,
          opacity: 0.5
        }
    }).addTo(map)
  },
  error: function () {
    console.log('error getting boundary geojson')
  }
})

// Add Pelias geocoding plugin
var geocoder = new L.Control.Geocoder('search-pRNNjzA', {
  markers: false,
  // TODO: update geocoder & fix this
  pointIcon: false,
  polygonIcon: false,
  expanded: true,
  fullWidth: false,
  bounds: L.latLngBounds([[40.9260, -74.2212], [40.4924, -73.6911]]),
  markers: true,
  attribution: ''
}).addTo(map);
