var superviews = require('../../client')
var view = require('./child.html')

class Child {
  constructor (el, data) {
    this.el = el
    this.data = data
    this.view = view
  }

  shouldUpdate () {
    return true
  }

  render () {
    this.view(this.data)
  }

  onChange (e) {
    this.data.name = e.target.value
    this.patch()
  }
}

Child.tagName = 'div'

module.exports = superviews(function (el, data) {
  this.el = el
  this.data = data
  this.view = view
  this.shouldUpdate = function () {
    return true
  }

  this.render = function () {
    this.view(this.data)
  }

  this.onChange = function (e) {
    this.data.name = e.target.value
    this.patch()
  }
})
