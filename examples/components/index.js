var patch = require('../../client/patch')
var parent = require('./parent')
var el = document.getElementById('mount')

var data1 = {
  name: 'Foo',
  childData: [{
    name: 'liz'
  }, {
    name: 'john'
  }, {
    name: 'jeff'
  }]
}

var todos = [{
  text: 'x'
}, {
  text: 'y'
}, {
  text: 'z'
}]

function run () {
  patch(el, parent, data1, todos)
}

run()

window.run = run
window.data1 = data1
window.todos = todos
