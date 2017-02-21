const superviews = require('./superviews')
const view = require('./todos.html')

require('./todo')

class Todos extends superviews(window.HTMLElement, view) {
  // Called when the element is created or upgraded
  // constructor () {}

  // Called when the element is inserted into a document, including into a shadow tree
  // connectedCallback () {}

  // Called when the element is removed from a document
  // disconnectedCallback () {}

  // Called when an attribute is changed, appended, removed, or replaced on the element. Only called for observed attributes.
  attributeChangedCallback (attributeName, oldValue, newValue, namespace) {
    console.log(attributeName, oldValue, newValue, namespace)
  }

  // Called when the element is adopted into a new document
  // adoptedCallback (oldDocument, newDocument) {}

  // Monitor the 'name' attribute for changes.
  static get observedAttributes () {
    return ['name']
  }

  get todos () {
    return this.state.todos
  }

  set todos (value) {
    this.state.set('todos', value)
  }

  get completed () {
    return this.todos.filter(t => t.isCompleted)
  }

  addTodo (e) {
    e.preventDefault()
    const text = this.state.newTodoText

    this.todos.push({
      id: Date.now(),
      text: text
    })
    this.state.set('newTodoText', '')
  }

  clear () {
    this.todos = this.todos.filter(item => !item.isCompleted)
  }
}

window.customElements.define('x-todos', Todos)

