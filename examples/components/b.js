var superviews = require('../../client')
var view = require('./b.html')

function Component (el, data) {
  this.onClick = function () {
    window.alert('Yo')
  }

  this.render = function (data) {
    this.patch(data)
  }

  var curr = data.name
  this.shouldUpdate = function (data) {
    if (data.name !== curr) {
      curr = data.name
      return true
    }
  }
}

module.exports = superviews(Component, view)
