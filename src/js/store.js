import { createStore, combineReducers, applyMiddleware } from 'redux'
import { createLogger } from 'redux-logger'

const LATLNG_PRECISION = 5
const INITIAL_MAP_CENTER = {
  lng: -73.9805,
  lat: 40.7259
}
const INITIAL_MAP_ZOOM = 12

const defaultMapState = {
  leaflet: false,
  lng: INITIAL_MAP_CENTER.lng,
  lat: INITIAL_MAP_CENTER.lat,
  zoom: INITIAL_MAP_ZOOM
}

const logger = createLogger()

const mapView = (state = defaultMapState, action) => {
  switch (action.type) {
    case 'SET_MAP_CENTER':
      return Object.assign({}, state, {
        leaflet: action.leaflet,
        lng: coerceToFixed(action.lng),
        lat: coerceToFixed(action.lat)
      })
    case 'SET_MAP_ZOOM':
      return Object.assign({}, state, {
        leaflet: action.leaflet,
        zoom: action.zoom
      })
    case 'SET_MAP_VIEW':
      return Object.assign({}, state, {
        leaflet: action.leaflet,
        lng: coerceToFixed(action.lng),
        lat: coerceToFixed(action.lat),
        zoom: action.zoom
      })
    default:
      return state
  }
}

const search = (state = null, action) => {
  switch (action.type) {
    case 'SET_SEARCH_QUERY':
      return action.query
    case 'CLEAR_QUERY':
      return null
    default:
      return state
  }
}

const reducer = combineReducers({
  search,
  mapView
})

const coerceToFixed = (value) => {
  return Number(value).toFixed(LATLNG_PRECISION)
}

export const store = createStore(reducer, applyMiddleware(logger))
