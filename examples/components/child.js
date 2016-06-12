var Base = require('./base')
var view = require('./child.html')

class Child extends Base {
  constructor (el) {
    super(el, view)
  }
  
  onClick () {
    
  }
  
  doSomeAction () {
    
  }
}

module.exports = Child
