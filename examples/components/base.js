var patch = require('../../client/patch')

class Base {
  constructor (el, view) {
    this.el = el
    this.view = view
  }

  patch (data) {
    patch(this.view(data))
  }

  shouldUpdate () {
    return false
  }
}

module.exports = Base
