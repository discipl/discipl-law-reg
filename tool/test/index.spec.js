/* eslint-env mocha */
var ExcelJson = require('../src/index')

describe('excel to json test', function () {
  it('log json file in terminal with array of filenames', async () => {
    let arr = ['handeling2', 'feit2', 'plicht2']
    let json = await ExcelJson.getArr(arr)
    console.log(json)
  })
})
