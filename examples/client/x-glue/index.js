require('../../../dre')

const superviews = require('../../../client')
const patch = require('../../../incremental-dom').patch
const prop = require('supermodels.js/lib/prop')()
const view = require('./index.html')
const Symbols = {
  CONTROLLER: Symbol('controller')
}
const ageSchema = {
  type: 'integer',
  min: 0,
  max: 130
}

const options = {
  schema: 'schema',
  events: {
    changeage: ageSchema,
    message: {
      properties: {
        name: { type: 'string' },
        timestamp: { type: 'date' }
      },
      required: ['name', 'timestamp']
    }
  }
}

// Let's register 4 simple validators. Registering validators
// makes them part of the fluent interface when using `prop`.
prop.prototype.attribute = function (value) {
  this.__attribute = !!value
  return this
}


prop.register('required', function () {
  return function (val, name) {
    if (!val) {
      return name + ' is required'
    }
  }
})

prop.register('min', function (min) {
  return function (val, name) {
    if (val < min) {
      return name + ' is less than ' + min
    }
  }
})

prop.register('max', function (max) {
  return function (val, name) {
    if (val > max) {
      return name + ' is greater than ' + max
    }
  }
})

var props = {
  str: prop(String).attribute(true),
  num: prop(Number).attribute(true).min(2).max(10).required()
}

// Sometimes a simple `controller` class can be a useful way
// of keeping internal code separate from the component class
class Controller {
  constructor (el) {
    this.el = el
    this.minAge = ageSchema.min
    this.maxAge = ageSchema.max
  }

  onClick (e) {
    e.stopImmediatePropagation()
    console.log('Bonjour')
  }

  removeAllHandlers (e) {
    this.el.off()
  }

  validate () {
    // Get the schema and validate function
    const data = this.el.props

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

class Widget extends superviews(options) {
  init () {
    const controller = new Controller(this)

    this.str = prop(String).required()
    this.num = prop(Number).required()

    this
      .on('click', controller.onClick)
      .on('click', 'b', (e) => { console.log('hey') })
      .on('change', 'input[name=age]', (e) => {
        const age = +e.target.value
        // this.state.set('age', age)
        this.emit('changeage', {
          detail: {
            age: age
          }
        })
      })

    // const store = new Store({
    //   age: 42
    // })

    // store.on('update', (currentState, prevState) => {
    //   this.render()
    // })

    // // for the purposes of this example
    // // `state` is exposed here to allow
    // // it to be modified in the browsers console
    // // - you generally wont want to do this though
    // Object.defineProperty(this, 'state', {
    //   get: function () {
    //     return store.get()
    //   }
    // })

    this[Symbols.CONTROLLER] = controller
  }

  get str1 () {
    return
  }

  set str1 (value) {

  }

  connectedCallback () {
    this.render(true)
  }

  renderCallback () {
    patch(this, () => {
      view.call(this, this, this.state, this[Symbols.CONTROLLER])
    })
  }
}

window.customElements.define('x-widget', Widget)

module.export = Widget
