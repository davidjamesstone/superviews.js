var IncrementalDOM = require('incremental-dom')
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
// var patch = require('./patch')
var slice = Array.prototype.slice

// Fix up the element `value` attribute
IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value
}

function superviews (Component, view) {
  // if (Component instanceof window.HTMLElement) {
  //   var patchArgs = slice.call(arguments)
  //   return patch.apply(window, patchArgs)
  // }

  return function (data) {
    var el = currentElement()
    var isFirstUpdate = false
    var ctx = el.__superviews
    var args = slice.call(arguments)

    args.unshift(el)
    args.unshift(null)
    if (!ctx) {
      isFirstUpdate = true
      ctx = new (Function.prototype.bind.apply(Component, args))
      if (!ctx.update) {
        ctx.update = function () {
          view.apply(ctx, slice.call(arguments))
        }
      }
      el.__superviews = ctx
    }

    if (!isFirstUpdate && !(ctx.shouldUpdate && ctx.shouldUpdate(data))) {
      skip()
    } else {
      ctx.update.apply(ctx, slice.call(arguments))
    }
  }
}

module.exports = superviews
