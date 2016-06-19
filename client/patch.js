var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
// var currentElement = IncrementalDOM.currentElement
var slice = Array.prototype.slice

module.exports = function (el, view, data) {
  var args = slice.call(arguments)
  // if (currentElement()) {
  //   view.apply(this, args.slice(2))
  // } else {
  if (args.length <= 3) {
    patch(el, view, data)
  } else {
    patch(el, function () {
      view.apply(this, args.slice(2))
    })
  }
  // }
}
