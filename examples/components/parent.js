var superviews = require('../../client')
var view = require('./parent.html')
var child = require('./child')

class Parent {
  constructor (el, data) {
    this.data = data
  }

  onClick () {
    window.alert('Click')
  }

  addItem () {
    var count = this.data.list.length
    this.data.list.push({
      name: 'My name ' + (++count)
    })
    this.update(this.data, child)
  }

  update (data) {
    this.view(data, child)
  }

  shouldUpdate (data) {
    // if (data.name !== this.data.name) {
      // this.data.name = data.name
    return true
    // }
  }
}

module.exports = superviews(Parent, view)
