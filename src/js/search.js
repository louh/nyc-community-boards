'use strict'

import inside from 'turf-inside'

const turf = {
  inside
}

const DISTRICTS_URL = 'site/data/districts.geojson'

// Load
let districtsPromise = window.fetch(DISTRICTS_URL)
  .then(function (response) {
    if (response.status !== 200) {
      throw new Error(`status code: ${response.status}`)
    }

    return response.json()
  })
  .catch(function (error) {
    console.log('error getting districts geojson: ' + error)
  })

// Given a lat-lng location, find the district it's inside
// This is a continuation of the promise returned by the fetch above
// to ensure that findDistricts() can only be called after the
// fetch has resolved. As a result, this returns a promise as well
export function findDistricts (latlng) {
  return districtsPromise.then((districts) => {
    const features = districts.features
    const location = {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [latlng.lng, latlng.lat]
      }
    }

    let results = []
    let foundNum
    let origId

    // Test all the districts to find the geometry that the latlng point
    // is located in
    features.forEach((feature) => {
      if (turf.inside(location, feature)) {
        foundNum = feature.properties.communityDistrict
        origId = feature.id
        results.push(feature)
      }
    })

    // "multi-polygon" support
    // start over to capture districts it missed the first time
    // TODO: optimize source geojson as feature collections
    features.forEach((feature) => {
      if (feature.properties.communityDistrict === foundNum && feature.id !== origId) {
        results.push(feature)
      }
    })

    // Wrap in GeoJSON
    if (results.length > 0) {
      return {
        'type': 'FeatureCollection',
        'features': results
      }
    } else {
      return null
    }
  })
}
