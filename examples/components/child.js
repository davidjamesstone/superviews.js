var superviews = require('../../client')
var view = require('./parent.html')

class Parent {
  constructor (el, data) {
    this.el = el
    this.data = data
    this.view = view
  }

  shouldUpdate () {
    return true
  }

  onChange (e) {
    this.data.name = e.target.value
    this.update(this.data)
  }
}

module.exports = superviews(Parent)
