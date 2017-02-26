const IncrementalDOM = require('incremental-dom')
// TODO:
// SKIP
// EXTEND HTML
// No more checked={isChecked ? 'checked': null} => checked={isChecked} for boolean attributes
// Scope/this/data/model (spread?) between the view and customelement.
// Also event handlers need should not have to be redefined each patch
//   - In fact, dom level 1 events will *always* be redefined with superviews handler wrapper. Fix this.

IncrementalDOM.attributes.checked = function (el, name, value) {
  el.checked = !!value
}

IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value === null || typeof (value) === 'undefined' ? '' : value
}

const superviews = (Base, view, Controller, propsSchema, attrsSchema) => class extends Base {
  constructor () {
    super()
    const controller = new Controller(this, view, propsSchema, attrsSchema)
    this.controller = controller

    // Pass through props onto the controller
    if (propsSchema) {
      for (let prop in propsSchema) {
        Object.defineProperty(this, prop, {
          get: function () {
            return controller.props[prop]
          },
          set: function (value) {
            controller.props[prop] = value
          }
        })
      }
    }
  }

  static get observedAttributes () {
    return attrsSchema ? Object.keys(attrsSchema) : []
  }

  attributeChangedCallback (name, oldValue, newValue) {
    // react to changes on all observed attributes
    this.controller.render()
  }
}

superviews.patch = require('./patch')
superviews.Freezer = require('./freezer')
superviews.Controller = require('./BaseController')

module.exports = superviews


/*
  attributes
  properties
  view: this => element, access to private property/functions
*/
