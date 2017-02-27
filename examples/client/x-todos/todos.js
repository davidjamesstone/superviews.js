const superviews = require('../../../client')
const patch = require('../../../incremental-dom').patch
const Store = require('../../../store')
const view = require('./todos.html')
const Todo = require('./todo')
const Symbols = {
  STATE: Symbol('state')
}

const options = {
  schema: {
    properties: {
      todos: { type: 'array', items: Todo.schema.properties.todo }
    },
    required: ['todos']
  },
  events: {
    change: 'change'
  }
}

class Todos extends superviews(options) {
  constructor () {
    super()

    const store = new Store({
      newTodoText: ''
    })

    store.on('update', (currentState, prevState) => {
      this.render()
    })

    Object.defineProperty(this, Symbols.STATE, {
      get: function () {
        return store.get()
      }
    })

    this.render()
  }

  propertyChangedCallback (name, oldValue, newValue) {
    if (name === 'todos') {
      const state = this[Symbols.STATE]
      state.set('todos', newValue)
      // super.propertyChangedCallback(name, oldValue, newValue)
    }
  }

  renderCallback () {
    patch(this, () => {
      view.call(this, this, this[Symbols.STATE])
    })
  }

  getCompleted () {
    return this[Symbols.STATE].todos.filter(t => t.isCompleted)
  }

  addTodo (e) {
    e.preventDefault()
    const state = this[Symbols.STATE]
    const text = state.newTodoText

    state.set('newTodoText', '')
    state.todos.push({ id: Date.now(), text: text })
  }

  clear () {
    const state = this[Symbols.STATE]
    state.set('todos', state.todos.filter(item => !item.isCompleted))
  }
}

window.customElements.define('x-todos', Todos)

module.exports = Todos
