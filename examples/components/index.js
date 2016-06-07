var superviews = require('../../client')
var el = document.getElementById('mount')
var a = require('./a')
// var b = require('./b.html')
// var IncrementalDOM = require('incremental-dom')

var data = {
  aData: {
    title: 'My title'
  },
  bData: {
    name: 'My name'
  }
}

superviews(el, a, data)
