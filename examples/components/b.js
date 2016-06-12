var superviews = require('../../client')
var view = require('./b.html')

class Component {
  constructor (el, data) {
    this.data = data
  }

  onChange (e) {
    this.data.name = e.target.value
    this.update(this.data)
  }

  shouldUpdate (data) {
    // if (data.name !== this.data.name) {
      // this.data.name = data.name
    return true
    // }
  }
}

module.exports = superviews(Component, view)
