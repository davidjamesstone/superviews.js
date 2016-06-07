var IncrementalDOM = require('incremental-dom')
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var patch = require('./patch')
var slice = Array.prototype.slice

// Fix up the element `value` attribute
IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value
}

function superviews (Component, view) {
  if (Component instanceof window.HTMLElement) {
    var patchArgs = slice.call(arguments)
    return patch.apply(window, patchArgs)
  }

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
      var viewArgs = slice.call(arguments)
      view.apply(ctx, viewArgs)
    }
  }
}

module.exports = superviews
