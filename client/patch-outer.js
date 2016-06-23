var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patchOuter
var slice = Array.prototype.slice

module.exports = function (el, fn, data) {
  var args = slice.call(arguments)
  if (args.length <= 3) {
    patch(el, fn, data)
  } else {
    patch(el, function () {
      fn.apply(window, args.slice(2))
    })
  }
}
