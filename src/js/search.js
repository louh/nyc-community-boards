'use strict'

var inside = require('turf-inside')
var ajax = require('component-ajax')

var turf = {
  inside: inside
}

var DISTRICTS_URL = '/data/districts.geojson'

// Load

ajax(DISTRICTS_URL, {
  success: function (x) {
    console.log(x)
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
