// Community districts data scraped via Kimono
// (which is no longer available - TODO: get another
// source of info)
// The Kimono scrapes are imported here
import MANHATTAN_DATA_FILE from '../data/manhattan.json'
import BRONX_DATA_FILE from '../data/bronx.json'
import BROOKLYN_DATA_FILE from '../data/brooklyn.json'
import QUEENS_DATA_FILE from '../data/queens.json'
import STATEN_ISLAND_DATA_FILE from '../data/staten-island.json'

const DATA_FILES = [
  MANHATTAN_DATA_FILE,
  BRONX_DATA_FILE,
  BROOKLYN_DATA_FILE,
  QUEENS_DATA_FILE,
  STATEN_ISLAND_DATA_FILE
]

// And, then for each data file, we combine them into one
const districts = DATA_FILES.reduce((previous, current, index, all) => {
  const boards = current.results.community_boards
  const boroughId = getBoroughId(current.results.borough[0].label)
  const edited = boards.map(board => {
    board.boroughId = boroughId
    return board
  })
  const added = previous.concat(edited)
  return added
}, [])

// Given a community board ID in the format of YXX where Y is
// between 1 - 5 and corresponds to a NYC borough, and XX is the
// community board number, return a bunch of information about it

// 1 - Manhattan
// 2 - Bronx
// 3 - Brooklyn
// 4 - Queens
// 5 - Staten Island

export function getDistrictById (id) {
  const borough = getBoroughName(id)
  const boardNumber = normalizeBoardNumber(id)
  const scraped = getScrapedData(districts, getBoroughId(borough), boardNumber)

  // Return all the data
  if (scraped) {
    return {
      id,
      borough,
      boardNumber,
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
  return districts.filter(district => {
    return district.boroughId === boroughId && district.index === boardNumber
  }).shift()
}
