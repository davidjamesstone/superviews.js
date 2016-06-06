var IncrementalDOM = require('incremental-dom')
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var patch = IncrementalDOM.patch

// Fix up the element `value` attribute
IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value
}

function patcher (el, view, data) {
  var args = Array.prototype.slice.call(arguments)
  if (args.length <= 3) {
    patch(el, view, data)
  } else {
    patch(el, function () {
      view.apply(this, args.slice(2))
    })
  }
}

function superviews (Component) {
  return function (data) {
    var el = currentElement()
    var isFirstUpdate = false
    var ctx = el.__superviews

    if (!ctx) {
      isFirstUpdate = true
      ctx = new Component(el, data)
      el.__superviews = ctx
    }

    if (!isFirstUpdate && !(ctx.shouldUpdate && ctx.shouldUpdate(data))) {
      skip()
    } else {
      ctx.patch(data)
    }
  }
}

module.exports = superviews
