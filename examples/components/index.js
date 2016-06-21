var patch = require('../../client/patch')
var parent = require('./parent.js')
var el = document.getElementById('mount')

var data = {
  name: 'Foo'
}

patch(el, parent, data)
