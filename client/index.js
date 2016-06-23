var IncrementalDOM = require('incremental-dom')
var skip = IncrementalDOM.skip
var elementOpen = IncrementalDOM.elementOpen
var elementClose = IncrementalDOM.elementClose
var patch = require('./patch-outer')
var slice = Array.prototype.slice

// Fix up the element `value` attribute
IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value
}

function superviews (Component, view) {
  var fn = function () {
    var name = Component.tagName || Component.name || 'div'
    var isFirstUpdate, el, ctx

    el = elementOpen(name)

    ctx = el.__superviews

    if (!ctx) {
      // Instantiate a new component context
      var args = slice.call(arguments)
      args.unshift(el)
      args.unshift(null)
      ctx = new (Function.prototype.bind.apply(Component, args))

      // Add a `patch` function to the context
      ctx.patch = function () {
        var args = slice.call(arguments)
        args.unshift(fn)
        args.unshift(el)
        patch.apply(this, args)
      }

      // Fix up the binding context of `on` event handlers
      var ctxProto = Object.getPrototypeOf(ctx)
      var keys = Object.getOwnPropertyNames(ctxProto)

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        if (key.startsWith('on')) {
          ctx[key] = ctx[key].bind(ctx)
        }
      }

      // Store the context on the element
      el.__superviews = ctx
      isFirstUpdate = true
    }

    if (!isFirstUpdate && !(ctx.shouldUpdate && ctx.shouldUpdate.apply(ctx, slice.call(arguments)))) {
      skip()
    } else {
      ctx.render()
    }

    elementClose(name)
  }

  return fn
}

module.exports = superviews
