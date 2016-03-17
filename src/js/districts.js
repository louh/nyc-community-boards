'use strict'

// get community board data after scraping the site.
const MANHATTAN_SCRAPE_API = 'https://www.kimonolabs.com/api/7d69jowa?apikey=k1MWSQDQssA3gjPVpJov571Lv4fdGO4O'
const BRONX_SCRAPE_API = 'https://www.kimonolabs.com/api/aaacwz8s?apikey=k1MWSQDQssA3gjPVpJov571Lv4fdGO4O'
const BROOKLYN_SCRAPE_API = 'https://www.kimonolabs.com/api/897hsqhs?apikey=k1MWSQDQssA3gjPVpJov571Lv4fdGO4O'
const QUEENS_SCRAPE_API = 'https://www.kimonolabs.com/api/95v22a6a?apikey=k1MWSQDQssA3gjPVpJov571Lv4fdGO4O'
const STATEN_ISLAND_SCRAPE_API = 'https://www.kimonolabs.com/api/8fzz99xg?apikey=k1MWSQDQssA3gjPVpJov571Lv4fdGO4O'

const SCRAPE_API = [
  MANHATTAN_SCRAPE_API,
  BRONX_SCRAPE_API,
  BROOKLYN_SCRAPE_API,
  QUEENS_SCRAPE_API,
  STATEN_ISLAND_SCRAPE_API
]

// data stored locally
const MANHATTAN_DATA_FILE = 'site/data/manhattan.json'
const BRONX_DATA_FILE = 'site/data/bronx.json'
const BROOKLYN_DATA_FILE = 'site/data/brooklyn.json'
const QUEENS_DATA_FILE = 'site/data/queens.json'
const STATEN_ISLAND_DATA_FILE = 'site/data/staten-island.json'

const DATA_FILES = [
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

let data = []
let loaded = 0

DATA_FILES.forEach((file) => {
  let response = window.fetch(file)
    .then(function (response) {
      if (response.status !== 200) {
        throw new Error(`status code: ${response.status}`)
        return
      }

      return response.json()
    })
    .catch(function (error) {
      console.log(`error getting ${file}: ${error}`)
    })

  data.push(response)
})

let districts = Promise.all(data)
  .then(function (values) {
    let districts = values.reduce(function (previous, current, index, all) {
      let boards = current.results.community_boards
      let boroughId = getBoroughId(current.results.borough[0].label)
      let edited = boards.map(function (board) {
        board.boroughId = boroughId
        return board
      })
      let added = previous.concat(edited)
      return added
    }, [])
    return districts
  })

// Given a community board ID in the format of YXX where Y is
// between 1 - 5 and corresponds to a NYC borough, and XX is the
// community board number, return a bunch of information about it
export function getDistrictById (id) {
  return districts.then(function (data) {
    const borough = getBoroughName(id)
    const boardNumber = normalizeBoardNumber(id)
    const scraped = getScrapedData(data, getBoroughId(borough), boardNumber)

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
  })
  .catch(function (error) {
    console.log(error)
    return {
      error: true,
      message: 'Error loading borough information, please try again later.'
    }
  })
}

// Given the community board ID in the format YXX (as above)
// return a one- or two-digit integer (of type 'number')
function normalizeBoardNumber (id) {
  const boardId = id.toString().substr(1)
  return window.parseInt(boardId, 10)
}

function getBoroughName (id) {
  const str = id.toString()
  const boroughId = window.parseInt(str.charAt(0), 10)
  let name
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

function getScrapedData (districts, boroughId, boardNumber) {
  // Filter returns an array, but there should only be one match
  // shift() converts the first item of the array into a standalone object
  return districts.filter((district) => {
    return district.boroughId === boroughId && district.index === boardNumber
  }).shift()
}
