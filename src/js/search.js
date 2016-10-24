import topojson from 'topojson'
import inside from '@turf/inside'

const turf = {
  inside
}

const DISTRICTS_URL = 'site/data/districts.topojson'

// Load
let districtsPromise = window.fetch(DISTRICTS_URL)
  .then(response => {
    if (!response.ok) {
      throw new Error(`status code: ${response.status}`)
    }

    return response.json()
  })
  .then(json => {
    console.log(json)
    // Convert to GeoJSON
    if (json.type === 'Topology') {
      return topojson.feature(json, json.objects['districts'])
    } else {
      return json
    }
  })
  .catch(error => {
    console.log('error getting district boundaries: ' + error.message)
  })

// Given a lat-lng location, find the district it's inside
// This is a continuation of the promise returned by the fetch above
// to ensure that findDistricts() can only be called after the
// fetch has resolved. As a result, this returns a promise as well
export function findDistricts (latlng) {
  return districtsPromise.then(districts => {
    const features = districts.features
    const location = {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [latlng.lng, latlng.lat]
      }
    }

    // Test all the districts to find the geometry that the latlng point
    // is located in
    for (let feature of features) {
      if (turf.inside(location, feature)) {
        return feature
      }
    }

    return null
  })
}
