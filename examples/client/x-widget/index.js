require('../../../dre')

const superviews = require('../../../client')
const patch = require('../../../incremental-dom').patch
const Store = require('../../../store')
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
}

class Widget extends superviews(options) {
  constructor () {
    super()
    const controller = new Controller(this)

    this
      .on('click', controller.onClick)
      .on('click', 'b', (e) => { console.log('hey') })
      .on('change', 'input[name=age]', (e) => {
        const age = +e.target.value
        this.state.set('age', age)
        this.emit('changeage', age)
      })

    const store = new Store({
      age: 42
    })

    store.on('update', (currentState, prevState) => {
      this.render()
    })

    // for the purposes of this example
    // `state` is exposed here to allow
    // it to be modified in the browsers console
    // - you generally wont want to do this though
    Object.defineProperty(this, 'state', {
      get: function () {
        return store.get()
      }
    })

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
