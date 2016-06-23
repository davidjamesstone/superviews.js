var superviews = require('../../client')
var view = require('./parent.html')
var child = require('./child')

class Parent {
  constructor (el, data1, data2) {
    this.el = el
    this.data1 = data1
    this.data2 = data2
    this.view = view
  }

  shouldUpdate () {
    return true
  }

  render () {
    this.view(this.data1, this.data2, child)
  }

  onChange (e) {
    this.data1.name = e.target.value
    this.patch()
  }
}

Parent.tagName = 'my-parent'

module.exports = superviews(Parent)
