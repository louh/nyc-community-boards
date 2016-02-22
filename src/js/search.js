'use strict'

import inside from 'turf-inside'

const turf = {
  inside
}

const DISTRICTS_URL = 'site/data/districts.geojson'
let DISTRICTS

// Load
window.fetch(DISTRICTS_URL)
  .then(function (response) {
    if (response.status !== 200) {
      console.log('error getting boundary geojson. status code: ' + response.status)
      return
    }

    return response.json()
  })
  .then(function (json) {
    DISTRICTS = json
  })
  .catch(function (error) {
    console.log('error getting districts geojson: ' + error)
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
