// const Store = require('../store')
const delegator = require('../delegator')
const validator = require('../validator')

const validatorOptions = {
  greedy: true,
  formats: {
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i
  }
}

const convertValue = function (value, type) {
  if (typeof (value) !== 'string' || type === 'string') {
    return value
  }
  if (type === 'integer' || type === 'number') {
    // fastest (and more reliable) way to convert strings to numbers
    var convertedVal = 1 * value
    // make sure that if our schema calls for an integer, that there is no decimal
    if (convertedVal || convertedVal === 0 && (type === 'number' || (value.indexOf('.') === -1))) {
      return convertedVal
    }
  } else if (type === 'boolean') {
    if (value === 'true') {
      return true
    } else if (value === 'false') {
      return false
    }
  }
  return value
}

function isSimple (item) {
  return item.type !== 'object' && item.type !== 'array'
}

const superviews = (options, Base = window.HTMLElement) => class Superviews extends Base {
  constructor () {
    super()

    const cache = {
      // initialState: initialState,
      options: options
    }

    /**
     * Deferred renderer
     */
    let renderTimeoutId = 0
    const render = function () {
      if (!renderTimeoutId) {
        renderTimeoutId = setTimeout(() => {
          renderTimeoutId = 0
          this.renderCallback()
        })
      }
    }.bind(this)

    cache.render = render

    /**
     * State
     */
    // const store = new Store(initialState)

    // store.on('update', function (currentState, prevState) {
    //   render()
    // })

    // cache.store = store
    // cache.initialFrozenState = store.get()

    /**
     * Input props/attrs & validation
     */
    const schema = options.schema
    if (schema) {
      const validate = validator(schema, validatorOptions)
      const props = schema.properties
      // const attrs = options.attributes
      const keys = Object.keys(props)

      keys.forEach((key) => {
        let item = props[key]
        let isAttr = isSimple(item)
        let dflt

        if ('default' in item) {
          dflt = item.default
        }

        if (isAttr) {
          Object.defineProperty(this, key, {
            get () {
              return this.hasAttribute(key)
                ? convertValue(this.getAttribute(key), item.type)
                : dflt
            },
            set (value) {
              return this.setAttribute(key, value)
            }
          })
        } else {
          let val

          Object.defineProperty(this, key, {
            get () {
              return typeof val === 'undefined' ? dflt : val
            },
            set (value) {
              const old = val
              val = convertValue(value, item.type)
              this.propertyChangedCallback(key, old, val)
            }
          })
        }
      })

      cache.validate = validate
    }

    /**
     * Event Delegation
     */

    // Hold a map of bound handers to the original handler
    const handlers = new Map()

    // Initialise the delegator
    const del = delegator(this)

    cache.delegate = del
    cache.handlers = handlers
    cache.events = options.events

    this.__superviews = cache
  }

  static get observedAttributes () {
    const properties = options.schema && options.schema.properties

    if (properties) {
      return Object.keys(properties)
        .filter(key => isSimple(properties[key]))
        .map(key => key.toLowerCase())
    }
  }

  renderCallback () {
    console.log('Not implemented!')
  }

  propertyChangedCallback (name, oldValue, newValue) {
    console.log('Property changed', name, oldValue, newValue)
    this.render()
  }

  attributeChangedCallback (name, oldValue, newValue) {
    // Render on any change to observed attributes
    this.render()
  }

  // get state () {
  //   return this.__superviews.store.get()
  // }

  render (immediatley) {
    if (immediatley) {
      this.renderCallback()
    } else {
      this.__superviews.render()
    }
  }

  on (eventType, selector, handler, useCapture) {
    const del = this.__superviews.delegate
    const handlers = this.__superviews.handlers

    // handler can be passed as
    // the second or third argument
    let bound
    if (typeof selector === 'function') {
      bound = selector.bind(this)
      handlers.set(selector, bound)
      selector = bound
    } else {
      bound = handler.bind(this)
      handlers.set(handler, bound)
      handler = bound
    }

    del.on(eventType, selector, handler, useCapture)

    return this
  }

  off (eventType, selector, handler, useCapture) {
    const del = this.__superviews.delegate
    const handlers = this.__superviews.handlers

    if (arguments.length === 0) {
      // Remove all
      handlers.clear()
    } else {
      // handler can be passed as
      // the second or third argument
      let bound
      if (typeof selector === 'function') {
        bound = handlers.get(selector)
        handlers.delete(selector)
        selector = bound
      } else {
        bound = handlers.get(handler)
        handlers.delete(handler)
        handler = bound
      }
    }

    del.off(eventType, selector, handler, useCapture)

    return this
  }

  emit (name, detail) {
    // Only emit registered events
    const events = this.__superviews.events

    if (!events || !(name in events)) {
      return
    }

    // Create custom event
    const event = new window.CustomEvent(name, {
      detail: detail
    })

    // Call the DOM Level 1 handler if one exists
    if (this['on' + name]) {
      this['on' + name](event)
    }

    // Dispatch the event
    this.dispatchEvent(event)
  }

  validate () {
    // Get the schema and validate function
    const schema = options && options.schema
    const validate = this.__superviews.validate
    if (schema && validate) {
      const props = schema.properties
      const keys = Object.keys(props)

      // Build the input data
      const data = {}
      keys.forEach((key) => {
        data[key] = this[key]
      })

      // Call the validator
      const result = {
        ok: validate(data)
      }

      // Get the errors if in an invalid state
      if (!result.ok) {
        result.errors = validate.errors
      }

      return result
    }
  }

  static get schema () {
    return options.schema
  }
}

module.exports = superviews

// TODO:
// SKIP
// Extend other HTML elements - "is"// TODO:
// SKIP
// EXTEND HTML
// No more checked={isChecked ? 'checked': null} => checked={isChecked} for boolean attributes
// Scope/this/data/model (spread?) between the view and customelement.
// Also event handlers need should not have to be redefined each patch
//   - In fact, dom level 1 events will *always* be redefined with superviews handler wrapper. Fix this.
// state from props. need to know when a property changes (to possibly update state). or mark properties e.g.
// opts = {
//   schema: {
//     properties: {
//       todo: {
//         text: { type: 'string' },
//         isCompleted: { type: 'boolean' }
//       }
//     },
//     required: ['id', 'text']
//   },
      // now mark certain properties as stores that when set, will be frozen
      // Maybe freeze everything?
//   stores: ['todo', ...]
// }
// Alternatively, have a onPropertyChanged callback.
// Need a strategy for internal state or props
