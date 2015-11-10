'use strict'

var ajax = require('component-ajax')

// get community board data after scraping the site.
var MANHATTAN_SCRAPE_API = 'https://www.kimonolabs.com/api/7d69jowa?apikey=k1MWSQDQssA3gjPVpJov571Lv4fdGO4O'
var BRONX_SCRAPE_API = 'https://www.kimonolabs.com/api/aaacwz8s?apikey=k1MWSQDQssA3gjPVpJov571Lv4fdGO4O'
var BROOKLYN_SCRAPE_API = 'https://www.kimonolabs.com/api/897hsqhs?apikey=k1MWSQDQssA3gjPVpJov571Lv4fdGO4O'
var QUEENS_SCRAPE_API = 'https://www.kimonolabs.com/api/95v22a6a?apikey=k1MWSQDQssA3gjPVpJov571Lv4fdGO4O'
var STATEN_ISLAND_SCRAPE_API = 'https://www.kimonolabs.com/api/8fzz99xg?apikey=k1MWSQDQssA3gjPVpJov571Lv4fdGO4O'

var SCRAPE_API = [
  MANHATTAN_SCRAPE_API,
  BRONX_SCRAPE_API,
  BROOKLYN_SCRAPE_API,
  QUEENS_SCRAPE_API,
  STATEN_ISLAND_SCRAPE_API
]

// data stored locally
var MANHATTAN_DATA_FILE = 'data/manhattan.json'
var BRONX_DATA_FILE = 'data/bronx.json'
var BROOKLYN_DATA_FILE = 'data/brooklyn.json'
var QUEENS_DATA_FILE = 'data/queens.json'
var STATEN_ISLAND_DATA_FILE = 'data/staten-island.json'

var DATA_FILES = [
  MANHATTAN_DATA_FILE,
  BRONX_DATA_FILE,
  BROOKLYN_DATA_FILE,
  QUEENS_DATA_FILE,
  STATEN_ISLAND_DATA_FILE
]

// 1 - Manhattan
// 2 - Bronx
// 3 - Brooklyn
// 4 - Queens
// 5 - Staten Island

// Just load everything right away
// TODO: optimize later

var data = []
var loaded = 0

for (var i = 0; i < DATA_FILES.length; i++) {
  ajax({
    url: DATA_FILES[i],
    success: function (response) {
      // This is a string in local, but object on server
      var raw = (typeof response === 'string') ? JSON.parse(response) : response
      var boards = raw.results.community_boards
      var boroughId = getBoroughId(raw.results.borough[0].label)
      var edited = boards.map(function (board) {
        board.boroughId = boroughId
        return board
      })
      data = data.concat(edited)
      loaded += 1
    },
    error: function (filename) {
      console.log('error getting ' + filename)
    }.bind(this, DATA_FILES[i])
  })
}

// Given a community board ID in the format of YXX where Y is
// between 1 - 5 and corresponds to a NYC borough, and XX is the
// community board number, return a bunch of information about it
function getById (id) {
  // If the data hasn't been loaded yet, send back an error
  if (loaded !== 5) {
    return {
      error: true,
      message: 'Error loading borough information, please try again later.'
    }
  }

  var borough = getBoroughName(id)
  var boardNumber = normalizeBoardNumber(id)
  var scraped = getScrapedData(getBoroughId(borough), boardNumber)

  // Return all the data
  if (scraped) {
    return {
      id: id,
      borough: borough,
      boardNumber: boardNumber,
      label: borough + ' Community Board ' + boardNumber.toString(),
      data: scraped
    }
  } else {
    return {
      error: true,
      message: 'There is no community board at that address.'
    }
  }
}

// Given the community board ID in the format YXX (as above)
// return a one- or two-digit integer (of type 'number')
function normalizeBoardNumber (id) {
  var boardId = id.toString().substr(1)
  return window.parseInt(boardId, 10)
}

function getBoroughName (id) {
  var str = id.toString()
  var boroughId = window.parseInt(str.charAt(0), 10)
  var name
  switch (boroughId) {
    case 1:
      name = 'Manhattan'
      break
    case 2:
      name = 'Bronx'
      break
    case 3:
      name = 'Brooklyn'
      break
    case 4:
      name = 'Queens'
      break
    case 5:
      name = 'Staten Island'
      break
    default:
      return null
  }
  return name
}

function getBoroughId (string) {
  if (string.match('Manhattan')) return 1
  else if (string.match('Bronx')) return 2
  else if (string.match('Brooklyn')) return 3
  else if (string.match('Queens')) return 4
  else if (string.match('Staten')) return 5
}

function getScrapedData (boroughId, boardNumber) {
  for (var i = 0; i < data.length; i++) {
    if (data[i].boroughId === boroughId && data[i].index === boardNumber) {
      return data[i]
    }
  }
  return null
}

module.exports = {
  getById: getById
}
