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
  var fn = function (data) {
    var el = currentElement()
    var name = Component.name
    var isFirstUpdate = false
    var close = false

    if (el.tagName !== name.toUpperCase()) {
      el = elementOpen(name)
      close = true
    }

    var ctx = el.__superviews
    var args = slice.call(arguments)

    args.unshift(el)
    args.unshift(null)

    if (!ctx) {
      isFirstUpdate = true
      ctx = new (Function.prototype.bind.apply(Component, args))

      if (!ctx.update) {
        ctx.update = function () {
          var isInPatch = !!currentElement()
          var args = slice.call(arguments)
          if (isInPatch) {
            view.apply(ctx, args)
          } else {
            args.unshift(fn)
            args.unshift(el)
            patch.apply(this, args)
          }
        }
      }
      el.__superviews = ctx
    }

    if (!isFirstUpdate && !(ctx.shouldUpdate && ctx.shouldUpdate(data))) {
      skip()
    } else {
      ctx.update.apply(ctx, slice.call(arguments))
    }

    if (close) {
      elementClose(name)
    }
  }

  return fn
}

module.exports = superviews
