'use strict'

var inside = require('turf-inside')
var ajax = require('component-ajax')

var turf = {
  inside: inside
}

var DISTRICTS_URL = 'data/districts.geojson'
var DISTRICTS

// Load
ajax({
  url: DISTRICTS_URL,
  success: function (response) {
    // This is a string in local, but object on server
    DISTRICTS = (typeof response === 'string') ? JSON.parse(response) : response
  },
  error: function () {
    console.log('error getting districts geojson')
  }
})

// Given a lat-lng location, find the
// districts they're inside
// There is more than one because the borders
// might be weird and overlap at edges
// location - GeoJSON point from Pelias
// districts - community boards GeoJSON
function findDistricts (location, districts) {
  var results = []
  districts = districts || DISTRICTS

  // Test all the districts
  for (var i = 0; i < districts.features.length; i++) {
    var polygon = districts.features[i]
    if (turf.inside(location, polygon)) {
      results.push(polygon)
    }
  }

  // Wrap in GeoJSON
  return {
    'type': 'FeatureCollection',
    'features': results
  }
}

module.exports = {
  findDistricts: findDistricts
}
