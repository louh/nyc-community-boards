'use strict'

import { createStore } from 'redux'

const LATLNG_PRECISION = 5
const INITIAL_MAP_CENTER = {
  lng: -73.9805,
  lat: 40.7259
}
const INITIAL_MAP_ZOOM = 12

const defaultState = {
  source: 'default',
  lng: INITIAL_MAP_CENTER.lng,
  lat: INITIAL_MAP_CENTER.lat,
  zoom: INITIAL_MAP_ZOOM,
  query: null
}

const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_MAP_CENTER':
      return {
        source: action.source,
        lng: coerceToFixed(action.lng),
        lat: coerceToFixed(action.lat),
        zoom: state.zoom,
        query: state.query
      }
    case 'SET_MAP_ZOOM':
      return {
        source: action.source,
        lng: state.lng,
        lat: state.lat,
        zoom: action.zoom,
        query: state.query
      }
    case 'SET_MAP_VIEW':
      return {
        source: action.source,
        lng: coerceToFixed(action.lng),
        lat: coerceToFixed(action.lat),
        zoom: action.zoom,
        query: state.query
      }
    case 'SET_SEARCH_QUERY':
      return {
        source: action.source,
        lng: state.lng,
        lat: state.lat,
        zoom: state.zoom,
        query: action.query
      }
    default:
      return state
  }
}

const coerceToFixed = (value) => {
  return Number(value).toFixed(LATLNG_PRECISION)
}

const store = createStore(reducer)
export default store
