'use strict'

// get community board data after scraping the site.

var MANHATTAN_SCRAPE_API = ''
var BRONX_SCRAPE_API = 'https://www.kimonolabs.com/api/aaacwz8s?apikey=k1MWSQDQssA3gjPVpJov571Lv4fdGO4O'
var BROOKLYN_SCRAPE_API = ''
var QUEENS_SCRAPE_API = ''
var STATEN_ISLAND_SCRAPE_API = ''

var SCRAPE_API = [
  MANHATTAN_SCRAPE_API,
  BRONX_SCRAPE_API,
  BROOKLYN_SCRAPE_API,
  QUEENS_SCRAPE_API,
  STATEN_ISLAND_SCRAPE_API
]

// 1 - Manhattan
// 2 - Bronx
// 3 - Brooklyn
// 4 - Queens
// 5 - Staten Island

// Given a community board ID in the format of YXX where Y is
// between 1 - 5 and corresponds to a NYC borough, and XX is the
// community board number, return a bunch of information about it
function getById (id) {
  var borough = getBoroughName(id)
  var boardNumber = normalizeBoardNumber(id)

  var scraped = getScrapedData(borough, boardNumber)

  // Return all the data
  return {
    id: id,
    borough: borough,
    boardNumber: boardNumber,
    label: borough + ' Community Board ' + boardNumber.toString()
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

function getScrapedData (borough, boardNumber) {
  return {}
}

module.exports = {
  getById: getById
}