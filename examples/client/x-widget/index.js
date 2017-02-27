require('../../../dre')

const superviews = require('../../../client')
const patch = require('../../../incremental-dom').patch
const Store = require('../../../store')
const view = require('./index.html')
const schema = require('./schema')

const options = {
  schema: schema,
  events: {
    change: 'change'
  }
}

class Controller {
  // constructor () {}
  onClick (e) {
    e.stopImmediatePropagation()
    window.alert('1')
  }
}

class Widget extends superviews(options) {
  constructor () {
    super({ a: 1 })
    const controller = new Controller()
    this
      .on('click', controller.onClick)
      .on('click', 'b', function (e) {
        console.log('hey')
      })

    const store = new Store({
      newTodoText: ''
    })

    store.on('update', (currentState, prevState) => {
      this.render()
    })

    Object.defineProperty(this, 'state', {
      get: function () {
        return store.get()
      }
    })

    this.controller = controller
  }

  connectedCallback () {
    this.render(true)
  }

  renderCallback () {
    patch(this, () => {
      view.call(this, this, this.state)
    })
  }

  removeH1 () {
    this.off()
  }
}

window.customElements.define('x-widget', Widget)

module.export = Widget
