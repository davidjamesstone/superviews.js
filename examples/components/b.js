var IncrementalDOM = require('incremental-dom')
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var view = require('./b.html')

function Component (el, data) {
  this.el = el
  this.data = data
  this.patch = view

  function onChange (e) {
    window.alert('Hi there')
  }

  this.onChange = onChange.bind(this)

  var curr = data.name
  this.shouldUpdate = function (data) {
    if (data.name !== curr) {
      curr = data.name
      return true
    }
  }
}

module.exports = superviews(Component)
