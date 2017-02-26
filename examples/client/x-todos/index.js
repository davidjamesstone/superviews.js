require('../../../dre')
require('./todos')

window.onload = function () {
  // Get reference to the todo element
  const todos = document.getElementById('todos')

  // Initialise some todos
  todos.todos = [{
    id: 1,
    text: 'Walk dog'
  }, {
    id: 2,
    text: 'Buy milk'
  }, {
    id: 3,
    text: 'Send birthday card to Liz',
    isCompleted: true
  }]
}
