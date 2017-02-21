const view = require('./todo.html')
const superviews = require('./superviews')

class Todo extends superviews(window.HTMLLIElement, view) {
  constructor () {
    super()
    console.log('ctor')
  }
  get todo () {
    return this.state.todos
  }

  set todo (value) {
    this.state.set('todo', value)
  }
}

window.customElements.define('x-todo', Todo, { extends: 'li' })
