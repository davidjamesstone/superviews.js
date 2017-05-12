// const Store = require('../store')
const delegator = require('../delegator')
const validator = require('../validator')

const validatorOptions = {
  greedy: true,
  formats: {
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
    objectid: /^[a-f\d]{24}$/i
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
  return item.type === 'number' || item.type === 'string' || item.type === 'boolean'
}

const superviews = (options, Base = window.HTMLElement) => class Superviews extends Base {
  constructor () {
    super()

    const cache = {
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
     * Input props/attrs & validation
     */
    const schema = options.schema
    if (schema && schema.properties) {
      const opts = options.validatorOptions || validatorOptions
      const validate = validator(schema, opts)
      const props = schema.properties
      const keys = Object.keys(props)

      // For every key in the root schemas properties
      // set up an attribute or property on the element
      keys.forEach((key) => {
        const item = props[key]
        const isAttr = isSimple(item)
        let dflt

        if ('default' in item) {
          dflt = item.default
        }

        if (isAttr) {
          // Store primitive types as attributes and cast on `get`
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
          // Store objects/arrays types as attributes and cast on `get`
          let val

          Object.defineProperty(this, key, {
            get () {
              return typeof val === 'undefined' ? dflt : val
            },
            set (value) {
              const oldval = val
              const newval = convertValue(value, item.type)

              if (newval !== oldval) {
                val = newval
                this.propertyChangedCallback(key, oldval, newval)
              }
            }
          })
        }
      })

      cache.validate = validate
    }

    /**
     * Event Delegation
     */
    const del = delegator(this)
    this.on = del.on.bind(del)
    this.off = del.off.bind(del)
    cache.delegate = del

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
    // Render on any change to observed properties
    // This can be overriden in a subclass.
    // To call this from the subclass use
    // super.propertyChangedCallback(name, oldValue, newValue)
    this.render()
  }

  attributeChangedCallback (name, oldValue, newValue) {
    // Render on any change to observed attributes
    // This can be overriden in a subclass.
    // To call this from the subclass use
    // super.propertyChangedCallback(name, oldValue, newValue)
    this.render()
  }

  render (immediatley) {
    if (immediatley) {
      this.renderCallback()
    } else {
      this.__superviews.render()
    }
  }

  emit (name, customEventInit) {
    // Only emit registered events
    const events = this.__superviews.events

    if (!events || !(name in events)) {
      return
    }

    // Create custom event
    const event = new window.CustomEvent(name, customEventInit)

    // Call the DOM Level 1 handler if it exists
    const eventName = 'on' + name
    if (this[eventName]) {
      this[eventName](event)
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

  static get events () {
    return options.events
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
