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

// Given a lat-lng location, find the district it's inside
function findDistricts (location) {
  var results = []
  var foundNum
  var origId

  // Test all the districts
  for (var i = 0; i < DISTRICTS.features.length; i++) {
    var feature = DISTRICTS.features[i]
    if (turf.inside(location, feature)) {
      foundNum = feature.properties.communityDistrict
      origId = feature.id
      results.push(feature)
    }
  }

  // "multi-polygon" support
  // start over to capture districts it missed the
  // first time
  // TODO: optimize source geojson
  for (var i = 0; i < DISTRICTS.features.length; i++) {
    var feature = DISTRICTS.features[i]
    if (feature.properties.communityDistrict === foundNum && feature.id !== origId) {
      results.push(feature)
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
