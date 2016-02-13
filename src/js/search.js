'use strict'

import ajax from 'component-ajax'
import inside from 'turf-inside'

const turf = {
  inside
}

const DISTRICTS_URL = 'site/data/districts.geojson'
let DISTRICTS

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
export function findDistricts (latlng) {
  var results = []
  var foundNum
  var origId

  var location = {
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [latlng.lng, latlng.lat]
    }
  }

  // Test all the districts
  for (var i = 0; i < DISTRICTS.features.length; i++) {
    var feature = DISTRICTS.features[i]
    if (turf.inside(location, feature)) {
      foundNum = feature.properties.communityDistrict
      origId = feature.id
      results.push(feature)
      break
    }
  }

  // "multi-polygon" support
  // start over to capture districts it missed the first time
  // TODO: optimize source geojson
  for (var i = 0; i < DISTRICTS.features.length; i++) {
    var feature = DISTRICTS.features[i]
    if (feature.properties.communityDistrict === foundNum && feature.id !== origId) {
      results.push(feature)
    }
  }

  // Wrap in GeoJSON
  if (results.length > 0) {
    return {
      'type': 'FeatureCollection',
      'features': results
    }
  } else {
    return null
  }
}
