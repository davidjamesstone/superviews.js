# superviews client

Work in Progress

In addition to being a template language that compiles to [incremental-dom](https://github.com/google/incremental-dom), superviews is a clientside library with a set of helpful classes and methods for building web applications based on the Web Components spec, specifically [Custom Elements V1](https://www.w3.org/TR/custom-elements/).

Custom Elements V1 gives the ability to extend by simply defining classes.

E.g.

```js
// Create a class with custom methods
// overrides, special behavior
class Greetings extends HTMLElement {
  show() {
    alert(this.textContent);
  }
}

// Define it in the CustomElementRegistry
window.customElements.define('x-greeting', Greetings);
```

This can then be used in HTML like so:

```html
<x-greeting></x-greeting>
```

`superviews.js` provides a thin wrapper around this pattern that includes events, event delegation and property and attribute validation.

The idea is that by describing what your components inputs (property/attributes) and outputs (events) are, you document the component and can also use the information to validate the state of the component.

JSON Schema is used to describe the properties and attributes.

While you'll probably be using `incremental-dom` to build the internal html of the component, there's no necessity to.

## Example

All the examples are CJS/browserify.

Say you want to build a Todo List Web Component.

It's to have a `theme` that can be either `light` or `dark` but defaults to `dark`.
It also needs to be supplied a list of items called `todos`. 
Both these inputs are required.

The list of `todo` items should be an array of objects with a required integer `id`, required `text` string and a boolean flag to indicate if the task `isCompleted`.

A third optional input is a `title` for the todo list and has a max length of 10. 

The Todos component can emit 3 events - `change`, `add` and `remove`.

Using `superviews.js`, it looks like this:

```js
const superviews = require('superviews.js')

// `options` should be an object.
// `options.schema` should be a JSON Schema describing the component inputs
// `options.events` should be an array describing the events the component can emit
const options = {
  schema: {
    properties: {
      title: { type: 'string', maxlength: 10 }
      theme: { type: 'string', enum: ['light', 'dark'], default: 'dark' }
      todos: {
        type: 'array',
        items: {
          properties: {
            id: { type: 'integer' },
            text: { type: 'string' },
            isCompleted: { type: 'boolean', default: false }
          },
          required: ['id', 'text']
        }
      }
    },
    required: ['todos']
  },
  events: {
    add: 'add',
    remove: 'remove',
  }
}

class Todos extends superviews(options) {
  constructor () {
    super()
    // Any initialisation code goes here
  }

  // Fires when the element is inserted into the DOM
  connectedCallback () {}

  // Fires when a property is changed
  propertyChangedCallback (name, oldValue, newValue) {
  }

  // Fires when an attribute is changed
  attributeChangedCallback (name, oldValue, newValue) {
  }

  // Fires when the element should re-render. This can be
  // as a consequence of an update to a prop or attr or from a 
  // call to `this.render()`.
  renderCallback () {}

  // Fires when the element is removed from the DOM
  disconnectedCallback () {}
}

window.customElements.define('x-todos', Todos)
```

This can then be used in HTML like this:

```html
<x-todos theme="light" title="My Todos">
</x-todos>

<script>
  const myList = document.querySelector('x-todos')

  // Set the initial todos
  myList.todos = [{
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
</script>
```

## superviews(options[, Base = HTMLElement])

Creates a reusable Custom Element class using the provided `options`.

`Base` defaults to HTMLElement, use this to provide a different base class e.g. `HTMLButtonElement` if you want to inherit from a different base class. See [here](https://developers.google.com/web/fundamentals/getting-started/primers/customelements#extendhtml) for more information

## Options

The `options` object provided to superviews can contain 2 keys, `schema` and `events`.

### Schema

The component attributes and properties are defined with a JSON Schema specified as  `options.schema`.

All top level properties of the root schema are defined as properties on the element. 

Primitive properties (`string`, `boolean`, `number`, `integer` etc.) are stored as attributes, while `array`s and `object`s are stored as properties on the element.

Only these registered properties and attributes will cause the `attributeChangedCallback` or `propertyChangedCallback` to fire.

### Events

Events defined in `options.events` can be subscribed to is the usual way:

```js
// Listeners can be handled in the usual way
myList.addEventListener('add', function (e) {})
myList.addEventListener('remove', function (e) {})
```

DOM Level 0 events are supported

```html
<x-todos theme="light" title="My Todos" onremove="{myHandler()}">
</x-todos>
```

as are DOM Level 1:

```js
myList.onremove = function (e) {}
```

`emit(name, detail)` is used to emit an event. 

## Event Delegation

Use `on` and `off` to add/remove events. This is usually done in the constructor:

```js
constructor () {
  super()
  this
    .on('click', (e) => {})
    .on('click', 'button.update', (e) => {})
    .on('change', 'input[type=checkbox]', (e) => {})
}

addTodo () {
  // const newTodo = ...
  this.emit('add', newTodo)
}
```

Internally this uses [ftlabs/ftdomdelegate](https://github.com/ftlabs/ftdomdelegate) which is available independently if you have a need for it here.

```js
const delegator = require('superviews.js/delegator')
```


## Rendering

`renderCallback` is called when a property or attribute has changed. You should update the UI at this point. Using incremental-dom this might look like this:

```js
renderCallback () {
  patch(this, fn, data)
}
```

To trigger a render callback manually `this.render()`. This will happen on the next event loop. If you want to update immediately use `this.render(true)`.

## Validation

You can call `validate()` on the element to check the properties and attributes are valid. This uses [is-my-json-valid](https://www.npmjs.com/package/is-my-json-valid).

```js
const result = this.validate()
if (!result.ok) {
  console.log(result.errors)
}
```

```js
const validator = require('superviews.js/validator')
```

The validator can be `require`d from `superviews.js/validator` if you find a need to use it for other purposes.

## Store

```js
const Store = require('superviews.js/store')
```
[Freezer.js](https://github.com/arqex/freezer) is a tree data structure that emits events on updates, even if the modification is triggered by one of the leaves, making it easier to think in a reactive way. Freezer uses real immutable structures. It is the perfect store for you application.

## Incremental DOM

You can import `incremental-dom`

```js
const idom = require('superviews.js/incremental-dom')
```

## W3C Custom Elements polyfill

[WebReflection/document-register-element](https://github.com/WebReflection/document-register-element) is a stand-alone working lightweight version of the W3C Custom Elements specification. Use this if you need to support browsers that don't yet support Custom Elements V1.

You can use it via `superviews.js` if you like:

```js
require('superviews.js/dre')
```

For more info see the [examples](../examples) folder or open [todos](../examples/client/x-todos/test.html) or [widget](../examples/client/x-widget/test.html)
