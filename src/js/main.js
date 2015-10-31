'use strict'

var L = require('leaflet')
var Tangram = require('tangram') // via browserify-shim
var LHash = require('leaflet-hash')
var geocoder = require('pelias-leaflet-geocoder')

// Create a basic Leaflet map
var accessToken = 'pk.eyJ1IjoibG91IiwiYSI6IkJDYlg3REEifQ.9BLp9eUdT11kUy1jgujSsQ'
var map = L.map('map').setView([51.4700, 0.2592], 12)

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
  attribution: '&copy; OSM contributors | <a href="https://mapzen.com/">Mapzen</a>'
}).addTo(map);

// Add Pelias geocoding plugin
var geocoder = new L.Control.Geocoder('search-pRNNjzA', {
  markers: false,
  // TODO: update geocoder & fix this
  pointIcon: false,
  polygonIcon: false,
  expanded: true,
  fullWidth: false,
}).addTo(map);
