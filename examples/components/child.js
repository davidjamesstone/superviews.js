var superviews = require('../../client')
var view = require('./child.html')

class Child {
  constructor (el, data) {
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

Child.tagName = 'my-child'

module.exports = superviews(Child)
