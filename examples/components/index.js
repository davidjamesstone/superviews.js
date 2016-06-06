var a = require('./a')
var el = document.getElementById('mount')
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch

var data = {
  aData: {
    title: 'My title'
  },
  bData: {
    name: 'My name'
  }
}

window.doPatch = function () {
  patch(el, a, data)
}

window.doPatch()
