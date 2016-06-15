var superviews = require('../../client')
var view = require('./a.html')
var b = require('./b')

class ATag {
  onClick () {
    window.alert('Click')
  }

  update (data) {
    view.call(this, data, b)
  }
}

module.exports = superviews(ATag, view)
