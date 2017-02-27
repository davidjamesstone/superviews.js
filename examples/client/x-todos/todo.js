const superviews = require('../../../client')
const view = require('./todo.html')
const patch = require('../../../incremental-dom').patch
const schema = require('./todo.json')

const options = {
  schema: {
    properties: {
      todo: schema,
      mode: { type: 'string', enum: ['', 'edit'], default: '' }
    }
  },
  events: {
    change: 'change'
  }
}

class Todo extends superviews(options) {
  constructor () {
    super()
    this
      // .on('change', 'input[type=text]', (e) => {
      //   this.todo.text = e.target.value.trim()
      //   this.render(true)
      // })
      // .on('change', 'input[type=checkbox]', (e) => {
      //   this.todo.isCompleted = e.target.checked
      //   this.render(true)
      // })
      .on('click', 'a.edit', (e) => {
        this.mode = 'edit'
      })
      .on('click', 'button.update', (e) => {
        this.mode = ''
      })
  }

  renderCallback () {
    patch(this, () => {
      view.call(this, this, this.state)
    })
  }

  // get todo () {
  //   return this.state.todo
  // }

  // set todo (value) {
  //   this.state.set('todo', value)
  // }
}

window.customElements.define('x-todo', Todo)

module.exports = Todo
