const superviews = require('../../../client')
const view = require('./todo.html')
const patch = require('../../../patch')
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
      // .on('change', 'input[type=text]', function (e) {
      //   this.todo.text = e.target.value.trim()
      //   this.render(true)
      // })
      // .on('change', 'input[type=checkbox]', function (e) {
      //   this.todo.isCompleted = e.target.checked
      //   this.render(true)
      // })
      .on('click', 'a.edit', function (e) {
        this.mode = 'edit'
      })
      .on('click', 'button.update', function (e) {
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
