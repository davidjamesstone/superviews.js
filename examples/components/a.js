var superviews = require('../../client')
var view = require('./a.html')
var b = require('./b')

function Component (el, data) {
  this.onClick = function () {
    window.alert('yo')
  }
}

module.exports = superviews(Component, view)
