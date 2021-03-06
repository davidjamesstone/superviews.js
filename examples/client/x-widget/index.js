require('../../../dre')

const superviews = require('../../../client')
const patch = require('../../../incremental-dom').patch
// const validator = require('../../../validator')
// const Store = require('../../../store')
const view = require('./index.html')
const schema = require('./schema')
const Symbols = {
  CONTROLLER: Symbol('controller')
}
const ageSchema = {
  type: 'integer',
  min: 0,
  max: 130
}

const validatorOptions = {
  greedy: true,
  formats: {
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
    objectid: /^[a-f\d]{24}$/i
  }
}

const options = {
  schema: schema,
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

const validate = validator(schema, validatorOptions)

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
