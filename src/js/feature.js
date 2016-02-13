'use strict'

// Influenced by https://github.com/viljamis/feature.js/
export const feature = {
  webgl: (function () {
    try {
      let canvas = document.createElement('canvas')
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
    } catch (x) {
      return false
    }
  })()
}
