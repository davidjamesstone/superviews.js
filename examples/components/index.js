var patch = require('../../client/patch')
var el = document.getElementById('mount')
var a = require('./a')

var data = {
  aData: {
    title: 'My title'
  },
  bData: {
    name: 'My name'
  },
  list: [{
      name: 'My name 1'
    }, {
      name: 'My name 2'
    }, {
      name: 'My name 3'
    }
  ]
}

// patch
patch(el, a, data)

window.data = data
window.patch = function () {
  patch(el, a, data)
}

