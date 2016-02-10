'use strict'

// Influenced by https://github.com/viljamis/feature.js/
module.exports = {
  webgl: (function () {
    try {
      var canvas = document.createElement('canvas')
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
    } catch (x) {
      return false
    }
  })()
}
