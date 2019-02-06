const readJSON = require('../read-json')

module.exports = {
  mockFiles
}

function mockFiles(files) {
  readJSON.mockImplementation(path => {
    if (path in files) {
      return files[path]
    }
  })
}
