var IncrementalDOM = require('incremental-dom')
var skip = IncrementalDOM.skip
var elementOpen = IncrementalDOM.elementOpen
var elementClose = IncrementalDOM.elementClose
var currentElement = IncrementalDOM.currentElement
var patch = require('./patch')
var slice = Array.prototype.slice

// Fix up the element `value` attribute
IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value
}

function superviews (Component, view) {
  var fn = function () {
    var currentEl = currentElement()
    var name = Component.name
    var close = false
    var isFirstUpdate = false
    var el, ctx

    if (currentEl) {
      if (currentEl.tagName !== name.toUpperCase()) {
        el = elementOpen(name)
        close = true
        isFirstUpdate = true
      } else {
        el = currentEl
        ctx = el.__superviews
      }
    }

    var args = slice.call(arguments)

    args.unshift(el)
    args.unshift(null)

    if (!ctx) {
      ctx = new (Function.prototype.bind.apply(Component, args))

      // var updateFn = ctx.update
      ctx.update = function () {
        var args = slice.call(arguments)
        args.unshift(fn)
        args.unshift(el)
        patch.apply(this, args)
      }
      el.__superviews = ctx
    }

    if (!isFirstUpdate && !(ctx.shouldUpdate && ctx.shouldUpdate.apply(ctx, slice.call(arguments)))) {
      skip()
    } else {
      ctx.view.apply(ctx, slice.call(arguments))
    }

    if (close) {
      elementClose(name)
    }
  }

  return fn
}

module.exports = superviews
