(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// const Store = require('../store')
const delegator = require('../delegator')
const validator = require('../validator')

const validatorOptions = {
  greedy: true,
  formats: {
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i
  }
}

const convertValue = function (value, type) {
  if (typeof (value) !== 'string' || type === 'string') {
    return value
  }
  if (type === 'integer' || type === 'number') {
    // fastest (and more reliable) way to convert strings to numbers
    var convertedVal = 1 * value
    // make sure that if our schema calls for an integer, that there is no decimal
    if (convertedVal || convertedVal === 0 && (type === 'number' || (value.indexOf('.') === -1))) {
      return convertedVal
    }
  } else if (type === 'boolean') {
    if (value === 'true') {
      return true
    } else if (value === 'false') {
      return false
    }
  }
  return value
}

function isSimple (item) {
  return item.type !== 'object' && item.type !== 'array'
}

const superviews = (options, Base = window.HTMLElement) => class Superviews extends Base {
  constructor () {
    super()

    const cache = {
      options: options
    }

    /**
     * Deferred renderer
     */
    let renderTimeoutId = 0
    const render = function () {
      if (!renderTimeoutId) {
        renderTimeoutId = setTimeout(() => {
          renderTimeoutId = 0
          this.renderCallback()
        })
      }
    }.bind(this)

    cache.render = render

    /**
     * Input props/attrs & validation
     */
    const schema = options.schema
    if (schema && schema.properties) {
      const validate = validator(schema, validatorOptions)
      const props = schema.properties
      const keys = Object.keys(props)

      // For every key in the root schemas properties
      // set up an attribute or property on the element
      keys.forEach((key) => {
        const item = props[key]
        const isAttr = isSimple(item)
        let dflt

        if ('default' in item) {
          dflt = item.default
        }

        if (isAttr) {
          // Store primitive types as attributes and cast on `get`
          Object.defineProperty(this, key, {
            get () {
              return this.hasAttribute(key)
                ? convertValue(this.getAttribute(key), item.type)
                : dflt
            },
            set (value) {
              return this.setAttribute(key, value)
            }
          })
        } else {
          // Store objects/arrays types as attributes and cast on `get`
          let val

          Object.defineProperty(this, key, {
            get () {
              return typeof val === 'undefined' ? dflt : val
            },
            set (value) {
              const old = val
              val = convertValue(value, item.type)
              this.propertyChangedCallback(key, old, val)
            }
          })
        }
      })

      cache.validate = validate
    }

    /**
     * Event Delegation
     */
    const del = delegator(this)
    this.on = del.on.bind(del)
    this.off = del.off.bind(del)
    cache.delegate = del

    cache.events = options.events

    this.__superviews = cache
  }

  static get observedAttributes () {
    const properties = options.schema && options.schema.properties

    if (properties) {
      return Object.keys(properties)
        .filter(key => isSimple(properties[key]))
        .map(key => key.toLowerCase())
    }
  }

  renderCallback () {
    console.log('Not implemented!')
  }

  propertyChangedCallback (name, oldValue, newValue) {
    // Render on any change to observed properties
    // This can be overriden in a subclass.
    // To call this from the subclass use
    // super.propertyChangedCallback(name, oldValue, newValue)
    this.render()
  }

  attributeChangedCallback (name, oldValue, newValue) {
    // Render on any change to observed attributes
    // This can be overriden in a subclass.
    // To call this from the subclass use
    // super.propertyChangedCallback(name, oldValue, newValue)
    this.render()
  }

  render (immediatley) {
    if (immediatley) {
      this.renderCallback()
    } else {
      this.__superviews.render()
    }
  }

  emit (name, detail) {
    // Only emit registered events
    const events = this.__superviews.events

    if (!events || !(name in events)) {
      return
    }

    // Create custom event
    const event = new window.CustomEvent(name, {
      detail: detail
    })

    // Call the DOM Level 1 handler if one exists
    if (this['on' + name]) {
      this['on' + name](event)
    }

    // Dispatch the event
    this.dispatchEvent(event)
  }

  validate () {
    // Get the schema and validate function
    const schema = options && options.schema
    const validate = this.__superviews.validate
    if (schema && validate) {
      const props = schema.properties
      const keys = Object.keys(props)

      // Build the input data
      const data = {}
      keys.forEach((key) => {
        data[key] = this[key]
      })

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

  static get schema () {
    return options.schema
  }

  static get events () {
    return options.events
  }
}

module.exports = superviews

// TODO:
// SKIP
// Extend other HTML elements - "is"// TODO:
// SKIP
// EXTEND HTML
// No more checked={isChecked ? 'checked': null} => checked={isChecked} for boolean attributes
// Scope/this/data/model (spread?) between the view and customelement.
// Also event handlers need should not have to be redefined each patch
//   - In fact, dom level 1 events will *always* be redefined with superviews handler wrapper. Fix this.
// state from props. need to know when a property changes (to possibly update state). or mark properties e.g.
// opts = {
//   schema: {
//     properties: {
//       todo: {
//         text: { type: 'string' },
//         isCompleted: { type: 'boolean' }
//       }
//     },
//     required: ['id', 'text']
//   },
      // now mark certain properties as stores that when set, will be frozen
      // Maybe freeze everything?
//   stores: ['todo', ...]
// }
// Alternatively, have a onPropertyChanged callback.
// Need a strategy for internal state or props

},{"../delegator":2,"../validator":33}],2:[function(require,module,exports){
module.exports = require('dom-delegate')

},{"dom-delegate":17}],3:[function(require,module,exports){
module.exports = require('document-register-element')

},{"document-register-element":15}],4:[function(require,module,exports){
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

},{"../../../dre":3,"./todos":9}],5:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementClose = IncrementalDOM.elementClose
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var text = IncrementalDOM.text

var hoisted1 = ["style", "background: red; padding: 10px;"]
var hoisted2 = ["type", "text"]
var hoisted3 = ["type", "checkbox"]
var hoisted4 = ["class", "update"]
var hoisted5 = ["class", "edit", "href", "#"]
var __target

module.exports = function description (el, state) {
const result = this.validate()
if (!result.ok) {
  elementOpen("div", "8cf18947-8d46-40bd-b19b-67671396144f", hoisted1)
    elementOpen("pre")
      text("" + (JSON.stringify(result.errors, null, 2)) + "")
    elementClose("pre")
  elementClose("div")
} else {
  elementOpen("div")
    if (el.mode === 'edit') {
      elementOpen("input", "a5debfcd-3701-40e8-aedf-91a1882e05ab", hoisted2, "value", el.todo.text, "onchange", function ($event) {
        var $element = this;
      el.todo.set('text', this.value)})
      elementClose("input")
      elementOpen("input", "17c61fe1-cb0e-4437-bc1f-08d0edc1dcdb", hoisted3, "checked", el.todo.isCompleted, "onchange", function ($event) {
        var $element = this;
      el.todo.set('isCompleted', this.checked)})
      elementClose("input")
      elementOpen("button", "c953bc9d-f0e4-4b27-8e12-23c5fed55bf8", hoisted4)
        text("Update")
      elementClose("button")
    } else {
      if (!el.mode) {
        elementOpen("span", null, null, "style", "text-decoration: " + ( el.todo.isCompleted ? 'line-through' : 'none') + "")
          text("" + (el.todo.text) + "")
        elementClose("span")
      }
      elementOpen("a", "19e384d9-0311-4651-b8a4-94e9b2fd349c", hoisted5)
        text("Edit")
      elementClose("a")
    }
  elementClose("div")
}
}

},{"incremental-dom":26}],6:[function(require,module,exports){
module.exports={
  "type": "object",
  "properties": {
    "id": { "type": "integer" },
    "text": { "type": "string" },
    "isCompleted": { "type": "boolean", "default": false }
  },
  "required": ["id", "text"]
}

},{}],7:[function(require,module,exports){
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

},{"../../../client":1,"../../../incremental-dom":10,"./todo.html":5,"./todo.json":6}],8:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementClose = IncrementalDOM.elementClose
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var text = IncrementalDOM.text

var hoisted1 = ["style", "background: red; padding: 10px;"]
var hoisted2 = ["type", "text"]
var __target

module.exports = function description (el, state) {
const result = this.validate()
if (!result.ok) {
  elementOpen("div", "83881b6b-1105-44df-8fe3-fd29bd44c766", hoisted1)
    elementOpen("pre")
      text("" + (JSON.stringify(result.errors, null, 2)) + "")
    elementClose("pre")
  elementClose("div")
} else {
  let todos = state.todos
  if (Array.isArray(todos) && todos.length) {
    let completed = this.getCompleted()
    elementOpen("section")
      __target = todos
      if (__target) {
        ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
          var todo = $value
          var $key = "49786567-4353-4702-8f57-425023135ce4_" + todo.id
          elementOpen("x-todo", $key, null, "todo", todo)
            if (true) {
              skip()
            } else {
            }
          elementClose("x-todo")
        }, this)
      }
      elementOpen("footer")
        elementOpen("dl")
          elementOpen("dt")
            text("Total")
          elementClose("dt")
          elementOpen("dd")
            text("" + (todos.length) + "")
          elementClose("dd")
          elementOpen("dt")
            text("Total completed")
          elementClose("dt")
          elementOpen("dd")
            text("" + (completed.length) + "")
          elementClose("dd")
          elementOpen("dt")
            text("Rendered")
          elementClose("dt")
          elementOpen("dd")
            text("" + (new Date()) + "")
          elementClose("dd")
        elementClose("dl")
        elementOpen("button", null, null, "disabled", completed.length ? undefined : 'disabled', "onclick", function ($event) {
          var $element = this;
        el.clear()})
          text("Clear completed")
        elementClose("button")
      elementClose("footer")
    elementClose("section")
  } else {
    text(" \
        No Todos Found \
      ")
  }
  elementOpen("form", null, null, "onsubmit", function ($event) {
    var $element = this;
  el.addTodo($event)})
    elementOpen("input", "0ff4582e-e065-4487-9cea-480c9c7fadc4", hoisted2, "value", state.newTodoText, "onkeyup", function ($event) {
      var $element = this;
    state.set('newTodoText', this.value.trim())})
    elementClose("input")
    elementOpen("button", null, null, "disabled", state.newTodoText ? undefined : 'disabled')
      text("Add Todo")
    elementClose("button")
  elementClose("form")
  elementOpen("button", null, null, "onclick", function ($event) {
    var $element = this;
  todos[0].set('isCompleted', !todos[0].isCompleted)})
    text("Toggle completed of Item 1")
  elementClose("button")
  elementOpen("button", null, null, "onclick", function ($event) {
    var $element = this;
  todos[0].set('text', 'foo')})
    text("Set Item 1 name to 'foo'")
  elementClose("button")
}
}

},{"incremental-dom":26}],9:[function(require,module,exports){
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

},{"../../../client":1,"../../../incremental-dom":10,"../../../store":32,"./todo":7,"./todos.html":8}],10:[function(require,module,exports){
const IncrementalDOM = require('incremental-dom')

IncrementalDOM.attributes.checked = function (el, name, value) {
  el.checked = !!value
}

IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value === null || typeof (value) === 'undefined' ? '' : value
}

module.exports = IncrementalDOM

},{"incremental-dom":26}],11:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],12:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],13:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],14:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":13,"_process":11,"inherits":12}],15:[function(require,module,exports){
(function (global){
/*!

Copyright (C) 2014-2016 by Andrea Giammarchi - @WebReflection

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
// global window Object
// optional polyfill info
//    'auto' used by default, everything is feature detected
//    'force' use the polyfill even if not fully needed
function installCustomElements(window, polyfill) {'use strict';

  // DO NOT USE THIS FILE DIRECTLY, IT WON'T WORK
  // THIS IS A PROJECT BASED ON A BUILD SYSTEM
  // THIS FILE IS JUST WRAPPED UP RESULTING IN
  // build/document-register-element.node.js

  var
    document = window.document,
    Object = window.Object
  ;

  var htmlClass = (function (info) {
    // (C) Andrea Giammarchi - @WebReflection - MIT Style
    var
      catchClass = /^[A-Z]+[a-z]/,
      filterBy = function (re) {
        var arr = [], tag;
        for (tag in register) {
          if (re.test(tag)) arr.push(tag);
        }
        return arr;
      },
      add = function (Class, tag) {
        tag = tag.toLowerCase();
        if (!(tag in register)) {
          register[Class] = (register[Class] || []).concat(tag);
          register[tag] = (register[tag.toUpperCase()] = Class);
        }
      },
      register = (Object.create || Object)(null),
      htmlClass = {},
      i, section, tags, Class
    ;
    for (section in info) {
      for (Class in info[section]) {
        tags = info[section][Class];
        register[Class] = tags;
        for (i = 0; i < tags.length; i++) {
          register[tags[i].toLowerCase()] =
          register[tags[i].toUpperCase()] = Class;
        }
      }
    }
    htmlClass.get = function get(tagOrClass) {
      return typeof tagOrClass === 'string' ?
        (register[tagOrClass] || (catchClass.test(tagOrClass) ? [] : '')) :
        filterBy(tagOrClass);
    };
    htmlClass.set = function set(tag, Class) {
      return (catchClass.test(tag) ?
        add(tag, Class) :
        add(Class, tag)
      ), htmlClass;
    };
    return htmlClass;
  }({
    "collections": {
      "HTMLAllCollection": [
        "all"
      ],
      "HTMLCollection": [
        "forms"
      ],
      "HTMLFormControlsCollection": [
        "elements"
      ],
      "HTMLOptionsCollection": [
        "options"
      ]
    },
    "elements": {
      "Element": [
        "element"
      ],
      "HTMLAnchorElement": [
        "a"
      ],
      "HTMLAppletElement": [
        "applet"
      ],
      "HTMLAreaElement": [
        "area"
      ],
      "HTMLAttachmentElement": [
        "attachment"
      ],
      "HTMLAudioElement": [
        "audio"
      ],
      "HTMLBRElement": [
        "br"
      ],
      "HTMLBaseElement": [
        "base"
      ],
      "HTMLBodyElement": [
        "body"
      ],
      "HTMLButtonElement": [
        "button"
      ],
      "HTMLCanvasElement": [
        "canvas"
      ],
      "HTMLContentElement": [
        "content"
      ],
      "HTMLDListElement": [
        "dl"
      ],
      "HTMLDataElement": [
        "data"
      ],
      "HTMLDataListElement": [
        "datalist"
      ],
      "HTMLDetailsElement": [
        "details"
      ],
      "HTMLDialogElement": [
        "dialog"
      ],
      "HTMLDirectoryElement": [
        "dir"
      ],
      "HTMLDivElement": [
        "div"
      ],
      "HTMLDocument": [
        "document"
      ],
      "HTMLElement": [
        "element",
        "abbr",
        "address",
        "article",
        "aside",
        "b",
        "bdi",
        "bdo",
        "cite",
        "code",
        "command",
        "dd",
        "dfn",
        "dt",
        "em",
        "figcaption",
        "figure",
        "footer",
        "header",
        "i",
        "kbd",
        "mark",
        "nav",
        "noscript",
        "rp",
        "rt",
        "ruby",
        "s",
        "samp",
        "section",
        "small",
        "strong",
        "sub",
        "summary",
        "sup",
        "u",
        "var",
        "wbr"
      ],
      "HTMLEmbedElement": [
        "embed"
      ],
      "HTMLFieldSetElement": [
        "fieldset"
      ],
      "HTMLFontElement": [
        "font"
      ],
      "HTMLFormElement": [
        "form"
      ],
      "HTMLFrameElement": [
        "frame"
      ],
      "HTMLFrameSetElement": [
        "frameset"
      ],
      "HTMLHRElement": [
        "hr"
      ],
      "HTMLHeadElement": [
        "head"
      ],
      "HTMLHeadingElement": [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6"
      ],
      "HTMLHtmlElement": [
        "html"
      ],
      "HTMLIFrameElement": [
        "iframe"
      ],
      "HTMLImageElement": [
        "img"
      ],
      "HTMLInputElement": [
        "input"
      ],
      "HTMLKeygenElement": [
        "keygen"
      ],
      "HTMLLIElement": [
        "li"
      ],
      "HTMLLabelElement": [
        "label"
      ],
      "HTMLLegendElement": [
        "legend"
      ],
      "HTMLLinkElement": [
        "link"
      ],
      "HTMLMapElement": [
        "map"
      ],
      "HTMLMarqueeElement": [
        "marquee"
      ],
      "HTMLMediaElement": [
        "media"
      ],
      "HTMLMenuElement": [
        "menu"
      ],
      "HTMLMenuItemElement": [
        "menuitem"
      ],
      "HTMLMetaElement": [
        "meta"
      ],
      "HTMLMeterElement": [
        "meter"
      ],
      "HTMLModElement": [
        "del",
        "ins"
      ],
      "HTMLOListElement": [
        "ol"
      ],
      "HTMLObjectElement": [
        "object"
      ],
      "HTMLOptGroupElement": [
        "optgroup"
      ],
      "HTMLOptionElement": [
        "option"
      ],
      "HTMLOutputElement": [
        "output"
      ],
      "HTMLParagraphElement": [
        "p"
      ],
      "HTMLParamElement": [
        "param"
      ],
      "HTMLPictureElement": [
        "picture"
      ],
      "HTMLPreElement": [
        "pre"
      ],
      "HTMLProgressElement": [
        "progress"
      ],
      "HTMLQuoteElement": [
        "blockquote",
        "q",
        "quote"
      ],
      "HTMLScriptElement": [
        "script"
      ],
      "HTMLSelectElement": [
        "select"
      ],
      "HTMLShadowElement": [
        "shadow"
      ],
      "HTMLSlotElement": [
        "slot"
      ],
      "HTMLSourceElement": [
        "source"
      ],
      "HTMLSpanElement": [
        "span"
      ],
      "HTMLStyleElement": [
        "style"
      ],
      "HTMLTableCaptionElement": [
        "caption"
      ],
      "HTMLTableCellElement": [
        "td",
        "th"
      ],
      "HTMLTableColElement": [
        "col",
        "colgroup"
      ],
      "HTMLTableElement": [
        "table"
      ],
      "HTMLTableRowElement": [
        "tr"
      ],
      "HTMLTableSectionElement": [
        "thead",
        "tbody",
        "tfoot"
      ],
      "HTMLTemplateElement": [
        "template"
      ],
      "HTMLTextAreaElement": [
        "textarea"
      ],
      "HTMLTimeElement": [
        "time"
      ],
      "HTMLTitleElement": [
        "title"
      ],
      "HTMLTrackElement": [
        "track"
      ],
      "HTMLUListElement": [
        "ul"
      ],
      "HTMLUnknownElement": [
        "unknown",
        "vhgroupv",
        "vkeygen"
      ],
      "HTMLVideoElement": [
        "video"
      ]
    },
    "nodes": {
      "Attr": [
        "node"
      ],
      "Audio": [
        "audio"
      ],
      "CDATASection": [
        "node"
      ],
      "CharacterData": [
        "node"
      ],
      "Comment": [
        "#comment"
      ],
      "Document": [
        "#document"
      ],
      "DocumentFragment": [
        "#document-fragment"
      ],
      "DocumentType": [
        "node"
      ],
      "HTMLDocument": [
        "#document"
      ],
      "Image": [
        "img"
      ],
      "Option": [
        "option"
      ],
      "ProcessingInstruction": [
        "node"
      ],
      "ShadowRoot": [
        "#shadow-root"
      ],
      "Text": [
        "#text"
      ],
      "XMLDocument": [
        "xml"
      ]
    }
  }));
  
  
    
  // passed at runtime, configurable
  // via nodejs module
  if (!polyfill) polyfill = 'auto';
  
  var
    // V0 polyfill entry
    REGISTER_ELEMENT = 'registerElement',
  
    // IE < 11 only + old WebKit for attributes + feature detection
    EXPANDO_UID = '__' + REGISTER_ELEMENT + (window.Math.random() * 10e4 >> 0),
  
    // shortcuts and costants
    ADD_EVENT_LISTENER = 'addEventListener',
    ATTACHED = 'attached',
    CALLBACK = 'Callback',
    DETACHED = 'detached',
    EXTENDS = 'extends',
  
    ATTRIBUTE_CHANGED_CALLBACK = 'attributeChanged' + CALLBACK,
    ATTACHED_CALLBACK = ATTACHED + CALLBACK,
    CONNECTED_CALLBACK = 'connected' + CALLBACK,
    DISCONNECTED_CALLBACK = 'disconnected' + CALLBACK,
    CREATED_CALLBACK = 'created' + CALLBACK,
    DETACHED_CALLBACK = DETACHED + CALLBACK,
  
    ADDITION = 'ADDITION',
    MODIFICATION = 'MODIFICATION',
    REMOVAL = 'REMOVAL',
  
    DOM_ATTR_MODIFIED = 'DOMAttrModified',
    DOM_CONTENT_LOADED = 'DOMContentLoaded',
    DOM_SUBTREE_MODIFIED = 'DOMSubtreeModified',
  
    PREFIX_TAG = '<',
    PREFIX_IS = '=',
  
    // valid and invalid node names
    validName = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/,
    invalidNames = [
      'ANNOTATION-XML',
      'COLOR-PROFILE',
      'FONT-FACE',
      'FONT-FACE-SRC',
      'FONT-FACE-URI',
      'FONT-FACE-FORMAT',
      'FONT-FACE-NAME',
      'MISSING-GLYPH'
    ],
  
    // registered types and their prototypes
    types = [],
    protos = [],
  
    // to query subnodes
    query = '',
  
    // html shortcut used to feature detect
    documentElement = document.documentElement,
  
    // ES5 inline helpers || basic patches
    indexOf = types.indexOf || function (v) {
      for(var i = this.length; i-- && this[i] !== v;){}
      return i;
    },
  
    // other helpers / shortcuts
    OP = Object.prototype,
    hOP = OP.hasOwnProperty,
    iPO = OP.isPrototypeOf,
  
    defineProperty = Object.defineProperty,
    empty = [],
    gOPD = Object.getOwnPropertyDescriptor,
    gOPN = Object.getOwnPropertyNames,
    gPO = Object.getPrototypeOf,
    sPO = Object.setPrototypeOf,
  
    // jshint proto: true
    hasProto = !!Object.__proto__,
  
    // V1 helpers
    fixGetClass = false,
    DRECEV1 = '__dreCEv1',
    customElements = window.customElements,
    usableCustomElements = polyfill !== 'force' && !!(
      customElements &&
      customElements.define &&
      customElements.get &&
      customElements.whenDefined
    ),
    Dict = Object.create || Object,
    Map = window.Map || function Map() {
      var K = [], V = [], i;
      return {
        get: function (k) {
          return V[indexOf.call(K, k)];
        },
        set: function (k, v) {
          i = indexOf.call(K, k);
          if (i < 0) V[K.push(k) - 1] = v;
          else V[i] = v;
        }
      };
    },
    Promise = window.Promise || function (fn) {
      var
        notify = [],
        done = false,
        p = {
          'catch': function () {
            return p;
          },
          'then': function (cb) {
            notify.push(cb);
            if (done) setTimeout(resolve, 1);
            return p;
          }
        }
      ;
      function resolve(value) {
        done = true;
        while (notify.length) notify.shift()(value);
      }
      fn(resolve);
      return p;
    },
    justCreated = false,
    constructors = Dict(null),
    waitingList = Dict(null),
    nodeNames = new Map(),
    secondArgument = String,
  
    // used to create unique instances
    create = Object.create || function Bridge(proto) {
      // silly broken polyfill probably ever used but short enough to work
      return proto ? ((Bridge.prototype = proto), new Bridge()) : this;
    },
  
    // will set the prototype if possible
    // or copy over all properties
    setPrototype = sPO || (
      hasProto ?
        function (o, p) {
          o.__proto__ = p;
          return o;
        } : (
      (gOPN && gOPD) ?
        (function(){
          function setProperties(o, p) {
            for (var
              key,
              names = gOPN(p),
              i = 0, length = names.length;
              i < length; i++
            ) {
              key = names[i];
              if (!hOP.call(o, key)) {
                defineProperty(o, key, gOPD(p, key));
              }
            }
          }
          return function (o, p) {
            do {
              setProperties(o, p);
            } while ((p = gPO(p)) && !iPO.call(p, o));
            return o;
          };
        }()) :
        function (o, p) {
          for (var key in p) {
            o[key] = p[key];
          }
          return o;
        }
    )),
  
    // DOM shortcuts and helpers, if any
  
    MutationObserver = window.MutationObserver ||
                       window.WebKitMutationObserver,
  
    HTMLElementPrototype = (
      window.HTMLElement ||
      window.Element ||
      window.Node
    ).prototype,
  
    IE8 = !iPO.call(HTMLElementPrototype, documentElement),
  
    safeProperty = IE8 ? function (o, k, d) {
      o[k] = d.value;
      return o;
    } : defineProperty,
  
    isValidNode = IE8 ?
      function (node) {
        return node.nodeType === 1;
      } :
      function (node) {
        return iPO.call(HTMLElementPrototype, node);
      },
  
    targets = IE8 && [],
  
    attachShadow = HTMLElementPrototype.attachShadow,
    cloneNode = HTMLElementPrototype.cloneNode,
    dispatchEvent = HTMLElementPrototype.dispatchEvent,
    getAttribute = HTMLElementPrototype.getAttribute,
    hasAttribute = HTMLElementPrototype.hasAttribute,
    removeAttribute = HTMLElementPrototype.removeAttribute,
    setAttribute = HTMLElementPrototype.setAttribute,
  
    // replaced later on
    createElement = document.createElement,
    patchedCreateElement = createElement,
  
    // shared observer for all attributes
    attributesObserver = MutationObserver && {
      attributes: true,
      characterData: true,
      attributeOldValue: true
    },
  
    // useful to detect only if there's no MutationObserver
    DOMAttrModified = MutationObserver || function(e) {
      doesNotSupportDOMAttrModified = false;
      documentElement.removeEventListener(
        DOM_ATTR_MODIFIED,
        DOMAttrModified
      );
    },
  
    // will both be used to make DOMNodeInserted asynchronous
    asapQueue,
    asapTimer = 0,
  
    // internal flags
    setListener = false,
    doesNotSupportDOMAttrModified = true,
    dropDomContentLoaded = true,
  
    // needed for the innerHTML helper
    notFromInnerHTMLHelper = true,
  
    // optionally defined later on
    onSubtreeModified,
    callDOMAttrModified,
    getAttributesMirror,
    observer,
    observe,
  
    // based on setting prototype capability
    // will check proto or the expando attribute
    // in order to setup the node once
    patchIfNotAlready,
    patch
  ;
  
  // only if needed
  if (!(REGISTER_ELEMENT in document)) {
  
    if (sPO || hasProto) {
        patchIfNotAlready = function (node, proto) {
          if (!iPO.call(proto, node)) {
            setupNode(node, proto);
          }
        };
        patch = setupNode;
    } else {
        patchIfNotAlready = function (node, proto) {
          if (!node[EXPANDO_UID]) {
            node[EXPANDO_UID] = Object(true);
            setupNode(node, proto);
          }
        };
        patch = patchIfNotAlready;
    }
  
    if (IE8) {
      doesNotSupportDOMAttrModified = false;
      (function (){
        var
          descriptor = gOPD(HTMLElementPrototype, ADD_EVENT_LISTENER),
          addEventListener = descriptor.value,
          patchedRemoveAttribute = function (name) {
            var e = new CustomEvent(DOM_ATTR_MODIFIED, {bubbles: true});
            e.attrName = name;
            e.prevValue = getAttribute.call(this, name);
            e.newValue = null;
            e[REMOVAL] = e.attrChange = 2;
            removeAttribute.call(this, name);
            dispatchEvent.call(this, e);
          },
          patchedSetAttribute = function (name, value) {
            var
              had = hasAttribute.call(this, name),
              old = had && getAttribute.call(this, name),
              e = new CustomEvent(DOM_ATTR_MODIFIED, {bubbles: true})
            ;
            setAttribute.call(this, name, value);
            e.attrName = name;
            e.prevValue = had ? old : null;
            e.newValue = value;
            if (had) {
              e[MODIFICATION] = e.attrChange = 1;
            } else {
              e[ADDITION] = e.attrChange = 0;
            }
            dispatchEvent.call(this, e);
          },
          onPropertyChange = function (e) {
            // jshint eqnull:true
            var
              node = e.currentTarget,
              superSecret = node[EXPANDO_UID],
              propertyName = e.propertyName,
              event
            ;
            if (superSecret.hasOwnProperty(propertyName)) {
              superSecret = superSecret[propertyName];
              event = new CustomEvent(DOM_ATTR_MODIFIED, {bubbles: true});
              event.attrName = superSecret.name;
              event.prevValue = superSecret.value || null;
              event.newValue = (superSecret.value = node[propertyName] || null);
              if (event.prevValue == null) {
                event[ADDITION] = event.attrChange = 0;
              } else {
                event[MODIFICATION] = event.attrChange = 1;
              }
              dispatchEvent.call(node, event);
            }
          }
        ;
        descriptor.value = function (type, handler, capture) {
          if (
            type === DOM_ATTR_MODIFIED &&
            this[ATTRIBUTE_CHANGED_CALLBACK] &&
            this.setAttribute !== patchedSetAttribute
          ) {
            this[EXPANDO_UID] = {
              className: {
                name: 'class',
                value: this.className
              }
            };
            this.setAttribute = patchedSetAttribute;
            this.removeAttribute = patchedRemoveAttribute;
            addEventListener.call(this, 'propertychange', onPropertyChange);
          }
          addEventListener.call(this, type, handler, capture);
        };
        defineProperty(HTMLElementPrototype, ADD_EVENT_LISTENER, descriptor);
      }());
    } else if (!MutationObserver) {
      documentElement[ADD_EVENT_LISTENER](DOM_ATTR_MODIFIED, DOMAttrModified);
      documentElement.setAttribute(EXPANDO_UID, 1);
      documentElement.removeAttribute(EXPANDO_UID);
      if (doesNotSupportDOMAttrModified) {
        onSubtreeModified = function (e) {
          var
            node = this,
            oldAttributes,
            newAttributes,
            key
          ;
          if (node === e.target) {
            oldAttributes = node[EXPANDO_UID];
            node[EXPANDO_UID] = (newAttributes = getAttributesMirror(node));
            for (key in newAttributes) {
              if (!(key in oldAttributes)) {
                // attribute was added
                return callDOMAttrModified(
                  0,
                  node,
                  key,
                  oldAttributes[key],
                  newAttributes[key],
                  ADDITION
                );
              } else if (newAttributes[key] !== oldAttributes[key]) {
                // attribute was changed
                return callDOMAttrModified(
                  1,
                  node,
                  key,
                  oldAttributes[key],
                  newAttributes[key],
                  MODIFICATION
                );
              }
            }
            // checking if it has been removed
            for (key in oldAttributes) {
              if (!(key in newAttributes)) {
                // attribute removed
                return callDOMAttrModified(
                  2,
                  node,
                  key,
                  oldAttributes[key],
                  newAttributes[key],
                  REMOVAL
                );
              }
            }
          }
        };
        callDOMAttrModified = function (
          attrChange,
          currentTarget,
          attrName,
          prevValue,
          newValue,
          action
        ) {
          var e = {
            attrChange: attrChange,
            currentTarget: currentTarget,
            attrName: attrName,
            prevValue: prevValue,
            newValue: newValue
          };
          e[action] = attrChange;
          onDOMAttrModified(e);
        };
        getAttributesMirror = function (node) {
          for (var
            attr, name,
            result = {},
            attributes = node.attributes,
            i = 0, length = attributes.length;
            i < length; i++
          ) {
            attr = attributes[i];
            name = attr.name;
            if (name !== 'setAttribute') {
              result[name] = attr.value;
            }
          }
          return result;
        };
      }
    }
  
    // set as enumerable, writable and configurable
    document[REGISTER_ELEMENT] = function registerElement(type, options) {
      upperType = type.toUpperCase();
      if (!setListener) {
        // only first time document.registerElement is used
        // we need to set this listener
        // setting it by default might slow down for no reason
        setListener = true;
        if (MutationObserver) {
          observer = (function(attached, detached){
            function checkEmAll(list, callback) {
              for (var i = 0, length = list.length; i < length; callback(list[i++])){}
            }
            return new MutationObserver(function (records) {
              for (var
                current, node, newValue,
                i = 0, length = records.length; i < length; i++
              ) {
                current = records[i];
                if (current.type === 'childList') {
                  checkEmAll(current.addedNodes, attached);
                  checkEmAll(current.removedNodes, detached);
                } else {
                  node = current.target;
                  if (notFromInnerHTMLHelper &&
                      node[ATTRIBUTE_CHANGED_CALLBACK] &&
                      current.attributeName !== 'style') {
                    newValue = getAttribute.call(node, current.attributeName);
                    if (newValue !== current.oldValue) {
                      node[ATTRIBUTE_CHANGED_CALLBACK](
                        current.attributeName,
                        current.oldValue,
                        newValue
                      );
                    }
                  }
                }
              }
            });
          }(executeAction(ATTACHED), executeAction(DETACHED)));
          observe = function (node) {
            observer.observe(
              node,
              {
                childList: true,
                subtree: true
              }
            );
            return node;
          };
          observe(document);
          if (attachShadow) {
            HTMLElementPrototype.attachShadow = function () {
              return observe(attachShadow.apply(this, arguments));
            };
          }
        } else {
          asapQueue = [];
          document[ADD_EVENT_LISTENER]('DOMNodeInserted', onDOMNode(ATTACHED));
          document[ADD_EVENT_LISTENER]('DOMNodeRemoved', onDOMNode(DETACHED));
        }
  
        document[ADD_EVENT_LISTENER](DOM_CONTENT_LOADED, onReadyStateChange);
        document[ADD_EVENT_LISTENER]('readystatechange', onReadyStateChange);
  
        HTMLElementPrototype.cloneNode = function (deep) {
          var
            node = cloneNode.call(this, !!deep),
            i = getTypeIndex(node)
          ;
          if (-1 < i) patch(node, protos[i]);
          if (deep) loopAndSetup(node.querySelectorAll(query));
          return node;
        };
      }
  
      if (-2 < (
        indexOf.call(types, PREFIX_IS + upperType) +
        indexOf.call(types, PREFIX_TAG + upperType)
      )) {
        throwTypeError(type);
      }
  
      if (!validName.test(upperType) || -1 < indexOf.call(invalidNames, upperType)) {
        throw new Error('The type ' + type + ' is invalid');
      }
  
      var
        constructor = function () {
          return extending ?
            document.createElement(nodeName, upperType) :
            document.createElement(nodeName);
        },
        opt = options || OP,
        extending = hOP.call(opt, EXTENDS),
        nodeName = extending ? options[EXTENDS].toUpperCase() : upperType,
        upperType,
        i
      ;
  
      if (extending && -1 < (
        indexOf.call(types, PREFIX_TAG + nodeName)
      )) {
        throwTypeError(nodeName);
      }
  
      i = types.push((extending ? PREFIX_IS : PREFIX_TAG) + upperType) - 1;
  
      query = query.concat(
        query.length ? ',' : '',
        extending ? nodeName + '[is="' + type.toLowerCase() + '"]' : nodeName
      );
  
      constructor.prototype = (
        protos[i] = hOP.call(opt, 'prototype') ?
          opt.prototype :
          create(HTMLElementPrototype)
      );
  
      loopAndVerify(
        document.querySelectorAll(query),
        ATTACHED
      );
  
      return constructor;
    };
  
    document.createElement = (patchedCreateElement = function (localName, typeExtension) {
      var
        is = getIs(typeExtension),
        node = is ?
          createElement.call(document, localName, secondArgument(is)) :
          createElement.call(document, localName),
        name = '' + localName,
        i = indexOf.call(
          types,
          (is ? PREFIX_IS : PREFIX_TAG) +
          (is || name).toUpperCase()
        ),
        setup = -1 < i
      ;
      if (is) {
        node.setAttribute('is', is = is.toLowerCase());
        if (setup) {
          setup = isInQSA(name.toUpperCase(), is);
        }
      }
      notFromInnerHTMLHelper = !document.createElement.innerHTMLHelper;
      if (setup) patch(node, protos[i]);
      return node;
    });
  
  }
  
  function ASAP() {
    var queue = asapQueue.splice(0, asapQueue.length);
    asapTimer = 0;
    while (queue.length) {
      queue.shift().call(
        null, queue.shift()
      );
    }
  }
  
  function loopAndVerify(list, action) {
    for (var i = 0, length = list.length; i < length; i++) {
      verifyAndSetupAndAction(list[i], action);
    }
  }
  
  function loopAndSetup(list) {
    for (var i = 0, length = list.length, node; i < length; i++) {
      node = list[i];
      patch(node, protos[getTypeIndex(node)]);
    }
  }
  
  function executeAction(action) {
    return function (node) {
      if (isValidNode(node)) {
        verifyAndSetupAndAction(node, action);
        loopAndVerify(
          node.querySelectorAll(query),
          action
        );
      }
    };
  }
  
  function getTypeIndex(target) {
    var
      is = getAttribute.call(target, 'is'),
      nodeName = target.nodeName.toUpperCase(),
      i = indexOf.call(
        types,
        is ?
            PREFIX_IS + is.toUpperCase() :
            PREFIX_TAG + nodeName
      )
    ;
    return is && -1 < i && !isInQSA(nodeName, is) ? -1 : i;
  }
  
  function isInQSA(name, type) {
    return -1 < query.indexOf(name + '[is="' + type + '"]');
  }
  
  function onDOMAttrModified(e) {
    var
      node = e.currentTarget,
      attrChange = e.attrChange,
      attrName = e.attrName,
      target = e.target,
      addition = e[ADDITION] || 2,
      removal = e[REMOVAL] || 3
    ;
    if (notFromInnerHTMLHelper &&
        (!target || target === node) &&
        node[ATTRIBUTE_CHANGED_CALLBACK] &&
        attrName !== 'style' && (
          e.prevValue !== e.newValue ||
          // IE9, IE10, and Opera 12 gotcha
          e.newValue === '' && (
            attrChange === addition ||
            attrChange === removal
          )
    )) {
      node[ATTRIBUTE_CHANGED_CALLBACK](
        attrName,
        attrChange === addition ? null : e.prevValue,
        attrChange === removal ? null : e.newValue
      );
    }
  }
  
  function onDOMNode(action) {
    var executor = executeAction(action);
    return function (e) {
      asapQueue.push(executor, e.target);
      if (asapTimer) clearTimeout(asapTimer);
      asapTimer = setTimeout(ASAP, 1);
    };
  }
  
  function onReadyStateChange(e) {
    if (dropDomContentLoaded) {
      dropDomContentLoaded = false;
      e.currentTarget.removeEventListener(DOM_CONTENT_LOADED, onReadyStateChange);
    }
    loopAndVerify(
      (e.target || document).querySelectorAll(query),
      e.detail === DETACHED ? DETACHED : ATTACHED
    );
    if (IE8) purge();
  }
  
  function patchedSetAttribute(name, value) {
    // jshint validthis:true
    var self = this;
    setAttribute.call(self, name, value);
    onSubtreeModified.call(self, {target: self});
  }
  
  function setupNode(node, proto) {
    setPrototype(node, proto);
    if (observer) {
      observer.observe(node, attributesObserver);
    } else {
      if (doesNotSupportDOMAttrModified) {
        node.setAttribute = patchedSetAttribute;
        node[EXPANDO_UID] = getAttributesMirror(node);
        node[ADD_EVENT_LISTENER](DOM_SUBTREE_MODIFIED, onSubtreeModified);
      }
      node[ADD_EVENT_LISTENER](DOM_ATTR_MODIFIED, onDOMAttrModified);
    }
    if (node[CREATED_CALLBACK] && notFromInnerHTMLHelper) {
      node.created = true;
      node[CREATED_CALLBACK]();
      node.created = false;
    }
  }
  
  function purge() {
    for (var
      node,
      i = 0,
      length = targets.length;
      i < length; i++
    ) {
      node = targets[i];
      if (!documentElement.contains(node)) {
        length--;
        targets.splice(i--, 1);
        verifyAndSetupAndAction(node, DETACHED);
      }
    }
  }
  
  function throwTypeError(type) {
    throw new Error('A ' + type + ' type is already registered');
  }
  
  function verifyAndSetupAndAction(node, action) {
    var
      fn,
      i = getTypeIndex(node)
    ;
    if (-1 < i) {
      patchIfNotAlready(node, protos[i]);
      i = 0;
      if (action === ATTACHED && !node[ATTACHED]) {
        node[DETACHED] = false;
        node[ATTACHED] = true;
        i = 1;
        if (IE8 && indexOf.call(targets, node) < 0) {
          targets.push(node);
        }
      } else if (action === DETACHED && !node[DETACHED]) {
        node[ATTACHED] = false;
        node[DETACHED] = true;
        i = 1;
      }
      if (i && (fn = node[action + CALLBACK])) fn.call(node);
    }
  }
  
  
  
  // V1 in da House!
  function CustomElementRegistry() {}
  
  CustomElementRegistry.prototype = {
    constructor: CustomElementRegistry,
    // a workaround for the stubborn WebKit
    define: usableCustomElements ?
      function (name, Class, options) {
        if (options) {
          CERDefine(name, Class, options);
        } else {
          var NAME = name.toUpperCase();
          constructors[NAME] = {
            constructor: Class,
            create: [NAME]
          };
          nodeNames.set(Class, NAME);
          customElements.define(name, Class);
        }
      } :
      CERDefine,
    get: usableCustomElements ?
      function (name) {
        return customElements.get(name) || get(name);
      } :
      get,
    whenDefined: usableCustomElements ?
      function (name) {
        return Promise.race([
          customElements.whenDefined(name),
          whenDefined(name)
        ]);
      } :
      whenDefined
  };
  
  function CERDefine(name, Class, options) {
    var
      is = options && options[EXTENDS] || '',
      CProto = Class.prototype,
      proto = create(CProto),
      attributes = Class.observedAttributes || empty,
      definition = {prototype: proto}
    ;
    // TODO: is this needed at all since it's inherited?
    // defineProperty(proto, 'constructor', {value: Class});
    safeProperty(proto, CREATED_CALLBACK, {
        value: function () {
          if (justCreated) justCreated = false;
          else if (!this[DRECEV1]) {
            this[DRECEV1] = true;
            new Class(this);
            if (CProto[CREATED_CALLBACK])
              CProto[CREATED_CALLBACK].call(this);
            var info = constructors[nodeNames.get(Class)];
            if (!usableCustomElements || info.create.length > 1) {
              notifyAttributes(this);
            }
          }
      }
    });
    safeProperty(proto, ATTRIBUTE_CHANGED_CALLBACK, {
      value: function (name) {
        if (-1 < indexOf.call(attributes, name))
          CProto[ATTRIBUTE_CHANGED_CALLBACK].apply(this, arguments);
      }
    });
    if (CProto[CONNECTED_CALLBACK]) {
      safeProperty(proto, ATTACHED_CALLBACK, {
        value: CProto[CONNECTED_CALLBACK]
      });
    }
    if (CProto[DISCONNECTED_CALLBACK]) {
      safeProperty(proto, DETACHED_CALLBACK, {
        value: CProto[DISCONNECTED_CALLBACK]
      });
    }
    if (is) definition[EXTENDS] = is;
    name = name.toUpperCase();
    constructors[name] = {
      constructor: Class,
      create: is ? [is, secondArgument(name)] : [name]
    };
    nodeNames.set(Class, name);
    document[REGISTER_ELEMENT](name.toLowerCase(), definition);
    whenDefined(name);
    waitingList[name].r();
  }
  
  function get(name) {
    var info = constructors[name.toUpperCase()];
    return info && info.constructor;
  }
  
  function getIs(options) {
    return typeof options === 'string' ?
        options : (options && options.is || '');
  }
  
  function notifyAttributes(self) {
    var
      callback = self[ATTRIBUTE_CHANGED_CALLBACK],
      attributes = callback ? self.attributes : empty,
      i = attributes.length,
      attribute
    ;
    while (i--) {
      attribute =  attributes[i]; // || attributes.item(i);
      callback.call(
        self,
        attribute.name || attribute.nodeName,
        null,
        attribute.value || attribute.nodeValue
      );
    }
  }
  
  function whenDefined(name) {
    name = name.toUpperCase();
    if (!(name in waitingList)) {
      waitingList[name] = {};
      waitingList[name].p = new Promise(function (resolve) {
        waitingList[name].r = resolve;
      });
    }
    return waitingList[name].p;
  }
  
  function polyfillV1() {
    if (customElements) delete window.customElements;
    defineProperty(window, 'customElements', {
      configurable: true,
      value: new CustomElementRegistry()
    });
    defineProperty(window, 'CustomElementRegistry', {
      configurable: true,
      value: CustomElementRegistry
    });
    for (var
      patchClass = function (name) {
        var Class = window[name];
        if (Class) {
          window[name] = function CustomElementsV1(self) {
            var info, isNative;
            if (!self) self = this;
            if (!self[DRECEV1]) {
              justCreated = true;
              info = constructors[nodeNames.get(self.constructor)];
              isNative = usableCustomElements && info.create.length === 1;
              self = isNative ?
                Reflect.construct(Class, empty, info.constructor) :
                document.createElement.apply(document, info.create);
              self[DRECEV1] = true;
              justCreated = false;
              if (!isNative) notifyAttributes(self);
            }
            return self;
          };
          window[name].prototype = Class.prototype;
          try {
            Class.prototype.constructor = window[name];
          } catch(WebKit) {
            fixGetClass = true;
            defineProperty(Class, DRECEV1, {value: window[name]});
          }
        }
      },
      Classes = htmlClass.get(/^HTML[A-Z]*[a-z]/),
      i = Classes.length;
      i--;
      patchClass(Classes[i])
    ) {}
    (document.createElement = function (name, options) {
      var is = getIs(options);
      return is ?
        patchedCreateElement.call(this, name, secondArgument(is)) :
        patchedCreateElement.call(this, name);
    });
  }
  
  // if customElements is not there at all
  if (!customElements || polyfill === 'force') polyfillV1();
  else {
    // if available test extends work as expected
    try {
      (function (DRE, options, name) {
        options[EXTENDS] = 'a';
        DRE.prototype = create(HTMLAnchorElement.prototype);
        DRE.prototype.constructor = DRE;
        window.customElements.define(name, DRE, options);
        if (
          getAttribute.call(document.createElement('a', {is: name}), 'is') !== name ||
          (usableCustomElements && getAttribute.call(new DRE(), 'is') !== name)
        ) {
          throw options;
        }
      }(
        function DRE() {
          return Reflect.construct(HTMLAnchorElement, [], DRE);
        },
        {},
        'document-register-element-a'
      ));
    } catch(o_O) {
      // or force the polyfill if not
      // and keep internal original reference
      polyfillV1();
    }
  }
  
  try {
    createElement.call(document, 'a', 'a');
  } catch(FireFox) {
    secondArgument = function (is) {
      return {is: is};
    };
  }
  
}

module.exports = installCustomElements;
installCustomElements(global);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],16:[function(require,module,exports){
/*jshint browser:true, node:true*/

'use strict';

module.exports = Delegate;

/**
 * DOM event delegator
 *
 * The delegator will listen
 * for events that bubble up
 * to the root node.
 *
 * @constructor
 * @param {Node|string} [root] The root node or a selector string matching the root node
 */
function Delegate(root) {

  /**
   * Maintain a map of listener
   * lists, keyed by event name.
   *
   * @type Object
   */
  this.listenerMap = [{}, {}];
  if (root) {
    this.root(root);
  }

  /** @type function() */
  this.handle = Delegate.prototype.handle.bind(this);
}

/**
 * Start listening for events
 * on the provided DOM element
 *
 * @param  {Node|string} [root] The root node or a selector string matching the root node
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.root = function(root) {
  var listenerMap = this.listenerMap;
  var eventType;

  // Remove master event listeners
  if (this.rootElement) {
    for (eventType in listenerMap[1]) {
      if (listenerMap[1].hasOwnProperty(eventType)) {
        this.rootElement.removeEventListener(eventType, this.handle, true);
      }
    }
    for (eventType in listenerMap[0]) {
      if (listenerMap[0].hasOwnProperty(eventType)) {
        this.rootElement.removeEventListener(eventType, this.handle, false);
      }
    }
  }

  // If no root or root is not
  // a dom node, then remove internal
  // root reference and exit here
  if (!root || !root.addEventListener) {
    if (this.rootElement) {
      delete this.rootElement;
    }
    return this;
  }

  /**
   * The root node at which
   * listeners are attached.
   *
   * @type Node
   */
  this.rootElement = root;

  // Set up master event listeners
  for (eventType in listenerMap[1]) {
    if (listenerMap[1].hasOwnProperty(eventType)) {
      this.rootElement.addEventListener(eventType, this.handle, true);
    }
  }
  for (eventType in listenerMap[0]) {
    if (listenerMap[0].hasOwnProperty(eventType)) {
      this.rootElement.addEventListener(eventType, this.handle, false);
    }
  }

  return this;
};

/**
 * @param {string} eventType
 * @returns boolean
 */
Delegate.prototype.captureForType = function(eventType) {
  return ['blur', 'error', 'focus', 'load', 'resize', 'scroll'].indexOf(eventType) !== -1;
};

/**
 * Attach a handler to one
 * event for all elements
 * that match the selector,
 * now or in the future
 *
 * The handler function receives
 * three arguments: the DOM event
 * object, the node that matched
 * the selector while the event
 * was bubbling and a reference
 * to itself. Within the handler,
 * 'this' is equal to the second
 * argument.
 *
 * The node that actually received
 * the event can be accessed via
 * 'event.target'.
 *
 * @param {string} eventType Listen for these events
 * @param {string|undefined} selector Only handle events on elements matching this selector, if undefined match root element
 * @param {function()} handler Handler function - event data passed here will be in event.data
 * @param {Object} [eventData] Data to pass in event.data
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.on = function(eventType, selector, handler, useCapture) {
  var root, listenerMap, matcher, matcherParam;

  if (!eventType) {
    throw new TypeError('Invalid event type: ' + eventType);
  }

  // handler can be passed as
  // the second or third argument
  if (typeof selector === 'function') {
    useCapture = handler;
    handler = selector;
    selector = null;
  }

  // Fallback to sensible defaults
  // if useCapture not set
  if (useCapture === undefined) {
    useCapture = this.captureForType(eventType);
  }

  if (typeof handler !== 'function') {
    throw new TypeError('Handler must be a type of Function');
  }

  root = this.rootElement;
  listenerMap = this.listenerMap[useCapture ? 1 : 0];

  // Add master handler for type if not created yet
  if (!listenerMap[eventType]) {
    if (root) {
      root.addEventListener(eventType, this.handle, useCapture);
    }
    listenerMap[eventType] = [];
  }

  if (!selector) {
    matcherParam = null;

    // COMPLEX - matchesRoot needs to have access to
    // this.rootElement, so bind the function to this.
    matcher = matchesRoot.bind(this);

  // Compile a matcher for the given selector
  } else if (/^[a-z]+$/i.test(selector)) {
    matcherParam = selector;
    matcher = matchesTag;
  } else if (/^#[a-z0-9\-_]+$/i.test(selector)) {
    matcherParam = selector.slice(1);
    matcher = matchesId;
  } else {
    matcherParam = selector;
    matcher = matches;
  }

  // Add to the list of listeners
  listenerMap[eventType].push({
    selector: selector,
    handler: handler,
    matcher: matcher,
    matcherParam: matcherParam
  });

  return this;
};

/**
 * Remove an event handler
 * for elements that match
 * the selector, forever
 *
 * @param {string} [eventType] Remove handlers for events matching this type, considering the other parameters
 * @param {string} [selector] If this parameter is omitted, only handlers which match the other two will be removed
 * @param {function()} [handler] If this parameter is omitted, only handlers which match the previous two will be removed
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.off = function(eventType, selector, handler, useCapture) {
  var i, listener, listenerMap, listenerList, singleEventType;

  // Handler can be passed as
  // the second or third argument
  if (typeof selector === 'function') {
    useCapture = handler;
    handler = selector;
    selector = null;
  }

  // If useCapture not set, remove
  // all event listeners
  if (useCapture === undefined) {
    this.off(eventType, selector, handler, true);
    this.off(eventType, selector, handler, false);
    return this;
  }

  listenerMap = this.listenerMap[useCapture ? 1 : 0];
  if (!eventType) {
    for (singleEventType in listenerMap) {
      if (listenerMap.hasOwnProperty(singleEventType)) {
        this.off(singleEventType, selector, handler);
      }
    }

    return this;
  }

  listenerList = listenerMap[eventType];
  if (!listenerList || !listenerList.length) {
    return this;
  }

  // Remove only parameter matches
  // if specified
  for (i = listenerList.length - 1; i >= 0; i--) {
    listener = listenerList[i];

    if ((!selector || selector === listener.selector) && (!handler || handler === listener.handler)) {
      listenerList.splice(i, 1);
    }
  }

  // All listeners removed
  if (!listenerList.length) {
    delete listenerMap[eventType];

    // Remove the main handler
    if (this.rootElement) {
      this.rootElement.removeEventListener(eventType, this.handle, useCapture);
    }
  }

  return this;
};


/**
 * Handle an arbitrary event.
 *
 * @param {Event} event
 */
Delegate.prototype.handle = function(event) {
  var i, l, type = event.type, root, phase, listener, returned, listenerList = [], target, /** @const */ EVENTIGNORE = 'ftLabsDelegateIgnore';

  if (event[EVENTIGNORE] === true) {
    return;
  }

  target = event.target;

  // Hardcode value of Node.TEXT_NODE
  // as not defined in IE8
  if (target.nodeType === 3) {
    target = target.parentNode;
  }

  root = this.rootElement;

  phase = event.eventPhase || ( event.target !== event.currentTarget ? 3 : 2 );
  
  switch (phase) {
    case 1: //Event.CAPTURING_PHASE:
      listenerList = this.listenerMap[1][type];
    break;
    case 2: //Event.AT_TARGET:
      if (this.listenerMap[0] && this.listenerMap[0][type]) listenerList = listenerList.concat(this.listenerMap[0][type]);
      if (this.listenerMap[1] && this.listenerMap[1][type]) listenerList = listenerList.concat(this.listenerMap[1][type]);
    break;
    case 3: //Event.BUBBLING_PHASE:
      listenerList = this.listenerMap[0][type];
    break;
  }

  // Need to continuously check
  // that the specific list is
  // still populated in case one
  // of the callbacks actually
  // causes the list to be destroyed.
  l = listenerList.length;
  while (target && l) {
    for (i = 0; i < l; i++) {
      listener = listenerList[i];

      // Bail from this loop if
      // the length changed and
      // no more listeners are
      // defined between i and l.
      if (!listener) {
        break;
      }

      // Check for match and fire
      // the event if there's one
      //
      // TODO:MCG:20120117: Need a way
      // to check if event#stopImmediatePropagation
      // was called. If so, break both loops.
      if (listener.matcher.call(target, listener.matcherParam, target)) {
        returned = this.fire(event, target, listener);
      }

      // Stop propagation to subsequent
      // callbacks if the callback returned
      // false
      if (returned === false) {
        event[EVENTIGNORE] = true;
        event.preventDefault();
        return;
      }
    }

    // TODO:MCG:20120117: Need a way to
    // check if event#stopPropagation
    // was called. If so, break looping
    // through the DOM. Stop if the
    // delegation root has been reached
    if (target === root) {
      break;
    }

    l = listenerList.length;
    target = target.parentElement;
  }
};

/**
 * Fire a listener on a target.
 *
 * @param {Event} event
 * @param {Node} target
 * @param {Object} listener
 * @returns {boolean}
 */
Delegate.prototype.fire = function(event, target, listener) {
  return listener.handler.call(target, event, target);
};

/**
 * Check whether an element
 * matches a generic selector.
 *
 * @type function()
 * @param {string} selector A CSS selector
 */
var matches = (function(el) {
  if (!el) return;
  var p = el.prototype;
  return (p.matches || p.matchesSelector || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector);
}(Element));

/**
 * Check whether an element
 * matches a tag selector.
 *
 * Tags are NOT case-sensitive,
 * except in XML (and XML-based
 * languages such as XHTML).
 *
 * @param {string} tagName The tag name to test against
 * @param {Element} element The element to test with
 * @returns boolean
 */
function matchesTag(tagName, element) {
  return tagName.toLowerCase() === element.tagName.toLowerCase();
}

/**
 * Check whether an element
 * matches the root.
 *
 * @param {?String} selector In this case this is always passed through as null and not used
 * @param {Element} element The element to test with
 * @returns boolean
 */
function matchesRoot(selector, element) {
  /*jshint validthis:true*/
  if (this.rootElement === window) return element === document;
  return this.rootElement === element;
}

/**
 * Check whether the ID of
 * the element in 'this'
 * matches the given ID.
 *
 * IDs are case-sensitive.
 *
 * @param {string} id The ID to test against
 * @param {Element} element The element to test with
 * @returns boolean
 */
function matchesId(id, element) {
  return id === element.id;
}

/**
 * Short hand for off()
 * and root(), ie both
 * with no parameters
 *
 * @return void
 */
Delegate.prototype.destroy = function() {
  this.off();
  this.root();
};

},{}],17:[function(require,module,exports){
/*jshint browser:true, node:true*/

'use strict';

/**
 * @preserve Create and manage a DOM event delegator.
 *
 * @version 0.3.0
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */
var Delegate = require('./delegate');

module.exports = function(root) {
  return new Delegate(root);
};

module.exports.Delegate = Delegate;

},{"./delegate":16}],18:[function(require,module,exports){
var Freezer = require('./src/freezer');
module.exports = Freezer;
},{"./src/freezer":20}],19:[function(require,module,exports){
'use strict';

var Utils = require( './utils' );



//#build


var BEFOREALL = 'beforeAll',
	AFTERALL = 'afterAll'
;
var specialEvents = [BEFOREALL, AFTERALL];

// The prototype methods are stored in a different object
// and applied as non enumerable properties later
var emitterProto = {
	on: function( eventName, listener, once ){
		var listeners = this._events[ eventName ] || [];

		listeners.push({ callback: listener, once: once});
		this._events[ eventName ] =  listeners;

		return this;
	},

	once: function( eventName, listener ){
		return this.on( eventName, listener, true );
	},

	off: function( eventName, listener ){
		if( typeof eventName == 'undefined' ){
			this._events = {};
		}
		else if( typeof listener == 'undefined' ) {
			this._events[ eventName ] = [];
		}
		else {
			var listeners = this._events[ eventName ] || [],
				i
			;

			for (i = listeners.length - 1; i >= 0; i--) {
				if( listeners[i].callback === listener )
					listeners.splice( i, 1 );
			}
		}

		return this;
	},

	trigger: function( eventName ){
		var args = [].slice.call( arguments, 1 ),
			listeners = this._events[ eventName ] || [],
			onceListeners = [],
			special = specialEvents.indexOf( eventName ) != -1,
			i, listener, returnValue, lastValue
		;

		special || this.trigger.apply( this, [BEFOREALL, eventName].concat( args ) );

		// Call listeners
		for (i = 0; i < listeners.length; i++) {
			listener = listeners[i];

			if( listener.callback )
				lastValue = listener.callback.apply( this, args );
			else {
				// If there is not a callback, remove!
				listener.once = true;
			}

			if( listener.once )
				onceListeners.push( i );

			if( lastValue !== undefined ){
				returnValue = lastValue;
			}
		}

		// Remove listeners marked as once
		for( i = onceListeners.length - 1; i >= 0; i-- ){
			listeners.splice( onceListeners[i], 1 );
		}

		special || this.trigger.apply( this, [AFTERALL, eventName].concat( args ) );

		return returnValue;
	}
};

// Methods are not enumerable so, when the stores are
// extended with the emitter, they can be iterated as
// hashmaps
var Emitter = Utils.createNonEnumerable( emitterProto );
//#build

module.exports = Emitter;

},{"./utils":23}],20:[function(require,module,exports){
'use strict';

var Utils = require( './utils.js' ),
	Emitter = require( './emitter' ),
	Frozen = require( './frozen' )
;

//#build
var Freezer = function( initialValue, options ) {
	var me = this,
		ops = options || {},
		store = {
			live: ops.live || false,
			freezeInstances: ops.freezeInstances || false
		}
	;

	// Immutable data
	var frozen;
	var pivotTriggers = [], pivotTicking = 0;
	var triggerNow = function( node ){
		var _ = node.__,
			i
		;

		if( _.listener ){
			var prevState = _.listener.prevState || node;
			_.listener.prevState = 0;
			Frozen.trigger( prevState, 'update', node, true );
		}

		for (i = 0; i < _.parents.length; i++) {
			_.store.notify( 'now', _.parents[i] );
		}
	};

	var addToPivotTriggers = function( node ){
		pivotTriggers.push( node );
		if( !pivotTicking ){
			pivotTicking = 1;
			Utils.nextTick( function(){
				pivotTriggers = [];
				pivotTicking = 0;
			});
		}
	};

	store.notify = function notify( eventName, node, options ){
		if( eventName == 'now' ){
			if( pivotTriggers.length ){
				while( pivotTriggers.length ){
					triggerNow( pivotTriggers.shift() );
				}
			}
			else {
				triggerNow( node );
			}

			return node;
		}

		var update = Frozen[eventName]( node, options );

		if( eventName != 'pivot' ){
			var pivot = Utils.findPivot( update );
			if( pivot ) {
				addToPivotTriggers( update );
	  		return pivot;
			}
		}

		return update;
	};

	store.freezeFn = ops.mutable === true ?
		function(){} :
		function( obj ){ Object.freeze( obj ); }
	;

	// Create the frozen object
	frozen = Frozen.freeze( initialValue, store );
	frozen.__.updateRoot = function( prevNode, updated ){
		if( prevNode === frozen ){
			frozen = updated;
		}
	}

	// Listen to its changes immediately
	var listener = frozen.getListener(),
		hub = {}
	;

	Utils.each(['on', 'off', 'once', 'trigger'], function( method ){
		var attrs = {};
		attrs[ method ] = listener[method].bind(listener);
		Utils.addNE( me, attrs );
		Utils.addNE( hub, attrs );
	});

	Utils.addNE( this, {
		get: function(){
			return frozen;
		},
		set: function( node ){
			frozen.reset( node );
		},
		getEventHub: function(){
			return hub;
		}
	});

	Utils.addNE( this, { getData: this.get, setData: this.set } );
};

//#build

module.exports = Freezer;

},{"./emitter":19,"./frozen":21,"./utils.js":23}],21:[function(require,module,exports){
'use strict';

var Utils = require( './utils' ),
	nodeCreator = require( './nodeCreator'),
	Emitter = require('./emitter')
;

//#build
var Frozen = {
	freeze: function( node, store ){
		if( node && node.__ ){
			return node;
		}

		var me = this,
			frozen = nodeCreator.clone(node)
		;

		Utils.addNE( frozen, { __: {
			listener: false,
			parents: [],
			store: store
		}});

		// Freeze children
		Utils.each( node, function( child, key ){
			if( !Utils.isLeaf( child, store.freezeInstances ) ){
				child = me.freeze( child, store );
			}

			if( child && child.__ ){
				me.addParent( child, frozen );
			}

			frozen[ key ] = child;
		});

		store.freezeFn( frozen );

		return frozen;
	},

	merge: function( node, attrs ){
		var _ = node.__,
			trans = _.trans,

			// Clone the attrs to not modify the argument
			attrs = Utils.extend( {}, attrs)
		;

		if( trans ){
			for( var attr in attrs )
				trans[ attr ] = attrs[ attr ];
			return node;
		}

		var me = this,
			frozen = this.copyMeta( node ),
			store = _.store,
			val, key, isFrozen
		;

		Utils.each( node, function( child, key ){
			isFrozen = child && child.__;

			if( isFrozen ){
				me.removeParent( child, node );
			}

			val = attrs[ key ];
			if( !val ){
				if( isFrozen )
					me.addParent( child, frozen );
				return frozen[ key ] = child;
			}

			if( !Utils.isLeaf( val, store.freezeInstances ) )
				val = me.freeze( val, store );

			if( val && val.__ )
				me.addParent( val, frozen );

			delete attrs[ key ];

			frozen[ key ] = val;
		});


		for( key in attrs ) {
			val = attrs[ key ];

			if( !Utils.isLeaf( val, store.freezeInstances ) )
				val = me.freeze( val, store );

			if( val && val.__ )
				me.addParent( val, frozen );

			frozen[ key ] = val;
		}

		_.store.freezeFn( frozen );

		this.refreshParents( node, frozen );

		return frozen;
	},

	replace: function( node, replacement ) {
		var me = this,
			_ = node.__,
			frozen = replacement
		;

		if( !Utils.isLeaf( replacement, _.store.freezeInstances ) ) {

			frozen = me.freeze( replacement, _.store );
			frozen.__.parents = _.parents;
			frozen.__.updateRoot = _.updateRoot;

			// Add the current listener if exists, replacing a
			// previous listener in the frozen if existed
			if( _.listener )
				frozen.__.listener = _.listener;
		}
		if( frozen ){
			this.fixChildren( frozen, node );
		}
		this.refreshParents( node, frozen );

		return frozen;
	},

	remove: function( node, attrs ){
		var trans = node.__.trans;
		if( trans ){
			for( var l = attrs.length - 1; l >= 0; l-- )
				delete trans[ attrs[l] ];
			return node;
		}

		var me = this,
			frozen = this.copyMeta( node ),
			isFrozen
		;

		Utils.each( node, function( child, key ){
			isFrozen = child && child.__;

			if( isFrozen ){
				me.removeParent( child, node );
			}

			if( attrs.indexOf( key ) != -1 ){
				return;
			}

			if( isFrozen )
				me.addParent( child, frozen );

			frozen[ key ] = child;
		});

		node.__.store.freezeFn( frozen );
		this.refreshParents( node, frozen );

		return frozen;
	},

	splice: function( node, args ){
		var _ = node.__,
			trans = _.trans
		;

		if( trans ){
			trans.splice.apply( trans, args );
			return node;
		}

		var me = this,
			frozen = this.copyMeta( node ),
			index = args[0],
			deleteIndex = index + args[1],
			child
		;

		// Clone the array
		Utils.each( node, function( child, i ){

			if( child && child.__ ){
				me.removeParent( child, node );

				// Skip the nodes to delete
				if( i < index || i>= deleteIndex )
					me.addParent( child, frozen );
			}

			frozen[i] = child;
		});

		// Prepare the new nodes
		if( args.length > 1 ){
			for (var i = args.length - 1; i >= 2; i--) {
				child = args[i];

				if( !Utils.isLeaf( child, _.store.freezeInstances ) )
					child = this.freeze( child, _.store );

				if( child && child.__ )
					this.addParent( child, frozen );

				args[i] = child;
			}
		}

		// splice
		Array.prototype.splice.apply( frozen, args );

		_.store.freezeFn( frozen );
		this.refreshParents( node, frozen );

		return frozen;
	},

	transact: function( node ) {
		var me = this,
			transacting = node.__.trans,
			trans
		;

		if( transacting )
			return transacting;

		trans = node.constructor == Array ? [] : {};

		Utils.each( node, function( child, key ){
			trans[ key ] = child;
		});

		node.__.trans = trans;

		// Call run automatically in case
		// the user forgot about it
		Utils.nextTick( function(){
			if( node.__.trans )
				me.run( node );
		});

		return trans;
	},

	run: function( node ) {
		var me = this,
			trans = node.__.trans
		;

		if( !trans )
			return node;

		// Remove the node as a parent
		Utils.each( trans, function( child, key ){
			if( child && child.__ ){
				me.removeParent( child, node );
			}
		});

		delete node.__.trans;

		var result = this.replace( node, trans );
		return result;
	},

	pivot: function( node ){
		node.__.pivot = 1;
		this.unpivot( node );
		return node;
	},

	unpivot: function( node ){
		Utils.nextTick( function(){
			node.__.pivot = 0;
		});
	},

	refresh: function( node, oldChild, newChild ){
		var me = this,
			trans = node.__.trans,
			found = 0
		;

		if( trans ){

			Utils.each( trans, function( child, key ){
				if( found ) return;

				if( child === oldChild ){

					trans[ key ] = newChild;
					found = 1;

					if( newChild && newChild.__ )
						me.addParent( newChild, node );
				}
			});

			return node;
		}

		var frozen = this.copyMeta( node ),
			replacement, __
		;

		Utils.each( node, function( child, key ){
			if( child === oldChild ){
				child = newChild;
			}

			if( child && (__ = child.__) ){
				me.removeParent( child, node );
				me.addParent( child, frozen );
			}

			frozen[ key ] = child;
		});

		node.__.store.freezeFn( frozen );

		this.refreshParents( node, frozen );
	},

	fixChildren: function( node, oldNode ){
		var me = this;
		Utils.each( node, function( child ){
			if( !child || !child.__ )
				return;

			// Update parents in all children no matter the child
			// is linked to the node or not.
			me.fixChildren( child );

			if( child.__.parents.length == 1 )
				return child.__.parents = [ node ];

			if( oldNode )
				me.removeParent( child, oldNode );

			me.addParent( child, node );
		});
	},

	copyMeta: function( node ){
		var me = this,
			frozen = nodeCreator.clone( node ),
			_ = node.__
		;

		Utils.addNE( frozen, {__: {
			store: _.store,
			updateRoot: _.updateRoot,
			listener: _.listener,
			parents: _.parents.slice( 0 ),
			trans: _.trans,
			pivot: _.pivot,
		}});

		if( _.pivot )
			this.unpivot( frozen );

		return frozen;
	},

	refreshParents: function( oldChild, newChild ){
		var _ = oldChild.__,
			parents = _.parents.length,
			i
		;

		if( oldChild.__.updateRoot ){
			oldChild.__.updateRoot( oldChild, newChild );
		}
		if( newChild ){
			this.trigger( oldChild, 'update', newChild, _.store.live );
		}
		if( parents ){
			for (i = parents - 1; i >= 0; i--) {
				this.refresh( _.parents[i], oldChild, newChild );
			}
		}
	},

	removeParent: function( node, parent ){
		var parents = node.__.parents,
			index = parents.indexOf( parent )
		;

		if( index != -1 ){
			parents.splice( index, 1 );
		}
	},

	addParent: function( node, parent ){
		var parents = node.__.parents,
			index = parents.indexOf( parent )
		;

		if( index == -1 ){
			parents[ parents.length ] = parent;
		}
	},

	trigger: function( node, eventName, param, now ){
		var listener = node.__.listener;
		if( !listener )
			return;

		var ticking = listener.ticking;

		if( now ){
			if( ticking || param ){
				listener.ticking = 0;
				listener.trigger( eventName, ticking || param, node );
			}
			return;
		}

		listener.ticking = param;
		if( !listener.prevState ){
			listener.prevState = node;
		}

		if( !ticking ){
			Utils.nextTick( function(){
				if( listener.ticking ){
					var updated = listener.ticking,
						prevState = listener.prevState
					;

					listener.ticking = 0;
					listener.prevState = 0;

					listener.trigger( eventName, updated, node );
				}
			});
		}
	},

	createListener: function( frozen ){
		var l = frozen.__.listener;

		if( !l ) {
			l = Object.create(Emitter, {
				_events: {
					value: {},
					writable: true
				}
			});

			frozen.__.listener = l;
		}

		return l;
	}
};

nodeCreator.init( Frozen );
//#build

module.exports = Frozen;

},{"./emitter":19,"./nodeCreator":22,"./utils":23}],22:[function(require,module,exports){
'use strict';

var Utils = require( './utils.js' );

//#build
var nodeCreator = {
	init: function( Frozen ){

		var commonMethods = {
			set: function( attr, value ){
				var attrs = attr,
					update = this.__.trans
				;

				if( typeof attr != 'object' ){
					attrs = {};
					attrs[ attr ] = value;
				}

				if( !update ){
					for( var key in attrs ){
						update = update || this[ key ] !== attrs[ key ];
					}

					// No changes, just return the node
					if( !update )
						return Utils.findPivot( this ) || this;
				}

				return this.__.store.notify( 'merge', this, attrs );
			},

			reset: function( attrs ) {
				return this.__.store.notify( 'replace', this, attrs );
			},

			getListener: function(){
				return Frozen.createListener( this );
			},

			toJS: function(){
				var js;
				if( this.constructor == Array ){
					js = new Array( this.length );
				}
				else {
					js = {};
				}

				Utils.each( this, function( child, i ){
					if( child && child.__ )
						js[ i ] = child.toJS();
					else
						js[ i ] = child;
				});

				return js;
			},

			transact: function(){
				return this.__.store.notify( 'transact', this );
			},

			run: function(){
				return this.__.store.notify( 'run', this );
			},

			now: function(){
				return this.__.store.notify( 'now', this );
			},

			pivot: function(){
				return this.__.store.notify( 'pivot', this );
			}
		};

		var arrayMethods = Utils.extend({
			push: function( el ){
				return this.append( [el] );
			},

			append: function( els ){
				if( els && els.length )
					return this.__.store.notify( 'splice', this, [this.length, 0].concat( els ) );
				return this;
			},

			pop: function(){
				if( !this.length )
					return this;

				return this.__.store.notify( 'splice', this, [this.length -1, 1] );
			},

			unshift: function( el ){
				return this.prepend( [el] );
			},

			prepend: function( els ){
				if( els && els.length )
					return this.__.store.notify( 'splice', this, [0, 0].concat( els ) );
				return this;
			},

			shift: function(){
				if( !this.length )
					return this;

				return this.__.store.notify( 'splice', this, [0, 1] );
			},

			splice: function( index, toRemove, toAdd ){
				return this.__.store.notify( 'splice', this, arguments );
			}
		}, commonMethods );

		var FrozenArray = Object.create( Array.prototype, Utils.createNE( arrayMethods ) );

		var objectMethods = Utils.createNE( Utils.extend({
			remove: function( keys ){
				var filtered = [],
					k = keys
				;

				if( keys.constructor != Array )
					k = [ keys ];

				for( var i = 0, l = k.length; i<l; i++ ){
					if( this.hasOwnProperty( k[i] ) )
						filtered.push( k[i] );
				}

				if( filtered.length )
					return this.__.store.notify( 'remove', this, filtered );
				return this;
			}
		}, commonMethods));

		var FrozenObject = Object.create( Object.prototype, objectMethods );

		var createArray = (function(){
			// fast version
			if( [].__proto__ )
				return function( length ){
					var arr = new Array( length );
					arr.__proto__ = FrozenArray;
					return arr;
				}

			// slow version for older browsers
			return function( length ){
				var arr = new Array( length );

				for( var m in arrayMethods ){
					arr[ m ] = arrayMethods[ m ];
				}

				return arr;
			}
		})();

		this.clone = function( node ){
			var cons = node.constructor;
			if( cons == Array ){
				return createArray( node.length );
			}
			else {
				if( cons === Object ){
					return Object.create( FrozenObject );
				}
				// Class instances
				else {
					return Object.create( cons.prototype, objectMethods );
				}
			}
		}
	}
}
//#build

module.exports = nodeCreator;

},{"./utils.js":23}],23:[function(require,module,exports){
'use strict';

//#build
var global = (new Function("return this")());

var Utils = {
	extend: function( ob, props ){
		for( var p in props ){
			ob[p] = props[p];
		}
		return ob;
	},

	createNonEnumerable: function( obj, proto ){
		var ne = {};
		for( var key in obj )
			ne[key] = {value: obj[key] };
		return Object.create( proto || {}, ne );
	},

	error: function( message ){
		var err = new Error( message );
		if( console )
			return console.error( err );
		else
			throw err;
	},

	each: function( o, clbk ){
		var i,l,keys;
		if( o && o.constructor == Array ){
			for (i = 0, l = o.length; i < l; i++)
				clbk( o[i], i );
		}
		else {
			keys = Object.keys( o );
			for( i = 0, l = keys.length; i < l; i++ )
				clbk( o[ keys[i] ], keys[i] );
		}
	},

	addNE: function( node, attrs ){
		for( var key in attrs ){
			Object.defineProperty( node, key, {
				enumerable: false,
				configurable: true,
				writable: true,
				value: attrs[ key ]
			});
		}
	},

	/**
	 * Creates non-enumerable property descriptors, to be used by Object.create.
	 * @param  {Object} attrs Properties to create descriptors
	 * @return {Object}       A hash with the descriptors.
	 */
	createNE: function( attrs ){
		var ne = {};

		for( var key in attrs ){
			ne[ key ] = {
				writable: true,
				configurable: true,
				enumerable: false,
				value: attrs[ key ]
			}
		}

		return ne;
	},

	// nextTick - by stagas / public domain
	nextTick: (function () {
    var queue = [],
		dirty = false,
		fn,
		hasPostMessage = !!global.postMessage && (typeof Window != 'undefined') && (global instanceof Window),
		messageName = 'nexttick',
		trigger = (function () {
			return hasPostMessage
				? function trigger () {
				global.postMessage(messageName, '*');
			}
			: function trigger () {
				setTimeout(function () { processQueue() }, 0);
			};
		}()),
		processQueue = (function () {
			return hasPostMessage
				? function processQueue (event) {
					if (event.source === global && event.data === messageName) {
						event.stopPropagation();
						flushQueue();
					}
				}
				: flushQueue;
    	})()
    ;

    function flushQueue () {
        while (fn = queue.shift()) {
            fn();
        }
        dirty = false;
    }

    function nextTick (fn) {
        queue.push(fn);
        if (dirty) return;
        dirty = true;
        trigger();
    }

    if (hasPostMessage) global.addEventListener('message', processQueue, true);

    nextTick.removeListener = function () {
        global.removeEventListener('message', processQueue, true);
    }

    return nextTick;
  })(),

  findPivot: function( node ){
  		if( !node || !node.__ )
  			return;

  		if( node.__.pivot )
  			return node;

  		var found = 0,
  			parents = node.__.parents,
  			i = 0,
  			parent
  		;

  		// Look up for the pivot in the parents
  		while( !found && i < parents.length ){
  			parent = parents[i];
  			if( parent.__.pivot )
  				found = parent;
  			i++;
  		}

  		if( found ){
  			return found;
  		}

  		// If not found, try with the parent's parents
  		i=0;
  		while( !found && i < parents.length ){
	  		found = this.findPivot( parents[i] );
	  		i++;
	  	}

  		return found;
  },

	isLeaf: function( node, freezeInstances ){
		var cons;
		return !node || !(cons = node.constructor) || (freezeInstances ?
			(cons === String || cons === Number || cons === Boolean) :
			(cons != Object && cons != Array)
		);
	}
};
//#build


module.exports = Utils;

},{}],24:[function(require,module,exports){
var util = require('util')

var INDENT_START = /[\{\[]/
var INDENT_END = /[\}\]]/

module.exports = function() {
  var lines = []
  var indent = 0

  var push = function(str) {
    var spaces = ''
    while (spaces.length < indent*2) spaces += '  '
    lines.push(spaces+str)
  }

  var line = function(fmt) {
    if (!fmt) return line

    if (INDENT_END.test(fmt.trim()[0]) && INDENT_START.test(fmt[fmt.length-1])) {
      indent--
      push(util.format.apply(util, arguments))
      indent++
      return line
    }
    if (INDENT_START.test(fmt[fmt.length-1])) {
      push(util.format.apply(util, arguments))
      indent++
      return line
    }
    if (INDENT_END.test(fmt.trim()[0])) {
      indent--
      push(util.format.apply(util, arguments))
      return line
    }

    push(util.format.apply(util, arguments))
    return line
  }

  line.toString = function() {
    return lines.join('\n')
  }

  line.toFunction = function(scope) {
    var src = 'return ('+line.toString()+')'

    var keys = Object.keys(scope || {}).map(function(key) {
      return key
    })

    var vals = keys.map(function(key) {
      return scope[key]
    })

    return Function.apply(null, keys.concat(src)).apply(null, vals)
  }

  if (arguments.length) line.apply(null, arguments)

  return line
}

},{"util":14}],25:[function(require,module,exports){
var isProperty = require('is-property')

var gen = function(obj, prop) {
  return isProperty(prop) ? obj+'.'+prop : obj+'['+JSON.stringify(prop)+']'
}

gen.valid = isProperty
gen.property = function (prop) {
 return isProperty(prop) ? prop : JSON.stringify(prop)
}

module.exports = gen

},{"is-property":29}],26:[function(require,module,exports){
(function (process){

/**
 * @license
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A cached reference to the hasOwnProperty function.
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * A constructor function that will create blank objects.
 * @constructor
 */
function Blank() {}

Blank.prototype = Object.create(null);

/**
 * Used to prevent property collisions between our "map" and its prototype.
 * @param {!Object<string, *>} map The map to check.
 * @param {string} property The property to check.
 * @return {boolean} Whether map has property.
 */
var has = function (map, property) {
  return hasOwnProperty.call(map, property);
};

/**
 * Creates an map object without a prototype.
 * @return {!Object}
 */
var createMap = function () {
  return new Blank();
};

/**
 * Keeps track of information needed to perform diffs for a given DOM node.
 * @param {!string} nodeName
 * @param {?string=} key
 * @constructor
 */
function NodeData(nodeName, key) {
  /**
   * The attributes and their values.
   * @const {!Object<string, *>}
   */
  this.attrs = createMap();

  /**
   * An array of attribute name/value pairs, used for quickly diffing the
   * incomming attributes to see if the DOM node's attributes need to be
   * updated.
   * @const {Array<*>}
   */
  this.attrsArr = [];

  /**
   * The incoming attributes for this Node, before they are updated.
   * @const {!Object<string, *>}
   */
  this.newAttrs = createMap();

  /**
   * Whether or not the statics have been applied for the node yet.
   * {boolean}
   */
  this.staticsApplied = false;

  /**
   * The key used to identify this node, used to preserve DOM nodes when they
   * move within their parent.
   * @const
   */
  this.key = key;

  /**
   * Keeps track of children within this node by their key.
   * {!Object<string, !Element>}
   */
  this.keyMap = createMap();

  /**
   * Whether or not the keyMap is currently valid.
   * @type {boolean}
   */
  this.keyMapValid = true;

  /**
   * Whether or the associated node is, or contains, a focused Element.
   * @type {boolean}
   */
  this.focused = false;

  /**
   * The node name for this node.
   * @const {string}
   */
  this.nodeName = nodeName;

  /**
   * @type {?string}
   */
  this.text = null;
}

/**
 * Initializes a NodeData object for a Node.
 *
 * @param {Node} node The node to initialize data for.
 * @param {string} nodeName The node name of node.
 * @param {?string=} key The key that identifies the node.
 * @return {!NodeData} The newly initialized data object
 */
var initData = function (node, nodeName, key) {
  var data = new NodeData(nodeName, key);
  node['__incrementalDOMData'] = data;
  return data;
};

/**
 * Retrieves the NodeData object for a Node, creating it if necessary.
 *
 * @param {?Node} node The Node to retrieve the data for.
 * @return {!NodeData} The NodeData for this Node.
 */
var getData = function (node) {
  importNode(node);
  return node['__incrementalDOMData'];
};

/**
 * Imports node and its subtree, initializing caches.
 *
 * @param {?Node} node The Node to import.
 */
var importNode = function (node) {
  if (node['__incrementalDOMData']) {
    return;
  }

  var isElement = node instanceof Element;
  var nodeName = isElement ? node.localName : node.nodeName;
  var key = isElement ? node.getAttribute('key') : null;
  var data = initData(node, nodeName, key);

  if (key) {
    getData(node.parentNode).keyMap[key] = node;
  }

  if (isElement) {
    var attributes = node.attributes;
    var attrs = data.attrs;
    var newAttrs = data.newAttrs;
    var attrsArr = data.attrsArr;

    for (var i = 0; i < attributes.length; i += 1) {
      var attr = attributes[i];
      var name = attr.name;
      var value = attr.value;

      attrs[name] = value;
      newAttrs[name] = undefined;
      attrsArr.push(name);
      attrsArr.push(value);
    }
  }

  for (var child = node.firstChild; child; child = child.nextSibling) {
    importNode(child);
  }
};

/**
 * Gets the namespace to create an element (of a given tag) in.
 * @param {string} tag The tag to get the namespace for.
 * @param {?Node} parent
 * @return {?string} The namespace to create the tag in.
 */
var getNamespaceForTag = function (tag, parent) {
  if (tag === 'svg') {
    return 'http://www.w3.org/2000/svg';
  }

  if (getData(parent).nodeName === 'foreignObject') {
    return null;
  }

  return parent.namespaceURI;
};

/**
 * Creates an Element.
 * @param {Document} doc The document with which to create the Element.
 * @param {?Node} parent
 * @param {string} tag The tag for the Element.
 * @param {?string=} key A key to identify the Element.
 * @return {!Element}
 */
var createElement = function (doc, parent, tag, key) {
  var namespace = getNamespaceForTag(tag, parent);
  var el = undefined;

  if (namespace) {
    el = doc.createElementNS(namespace, tag);
  } else {
    el = doc.createElement(tag);
  }

  initData(el, tag, key);

  return el;
};

/**
 * Creates a Text Node.
 * @param {Document} doc The document with which to create the Element.
 * @return {!Text}
 */
var createText = function (doc) {
  var node = doc.createTextNode('');
  initData(node, '#text', null);
  return node;
};

/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @const */
var notifications = {
  /**
   * Called after patch has compleated with any Nodes that have been created
   * and added to the DOM.
   * @type {?function(Array<!Node>)}
   */
  nodesCreated: null,

  /**
   * Called after patch has compleated with any Nodes that have been removed
   * from the DOM.
   * Note it's an applications responsibility to handle any childNodes.
   * @type {?function(Array<!Node>)}
   */
  nodesDeleted: null
};

/**
 * Keeps track of the state of a patch.
 * @constructor
 */
function Context() {
  /**
   * @type {(Array<!Node>|undefined)}
   */
  this.created = notifications.nodesCreated && [];

  /**
   * @type {(Array<!Node>|undefined)}
   */
  this.deleted = notifications.nodesDeleted && [];
}

/**
 * @param {!Node} node
 */
Context.prototype.markCreated = function (node) {
  if (this.created) {
    this.created.push(node);
  }
};

/**
 * @param {!Node} node
 */
Context.prototype.markDeleted = function (node) {
  if (this.deleted) {
    this.deleted.push(node);
  }
};

/**
 * Notifies about nodes that were created during the patch opearation.
 */
Context.prototype.notifyChanges = function () {
  if (this.created && this.created.length > 0) {
    notifications.nodesCreated(this.created);
  }

  if (this.deleted && this.deleted.length > 0) {
    notifications.nodesDeleted(this.deleted);
  }
};

/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
  * Keeps track whether or not we are in an attributes declaration (after
  * elementOpenStart, but before elementOpenEnd).
  * @type {boolean}
  */
var inAttributes = false;

/**
  * Keeps track whether or not we are in an element that should not have its
  * children cleared.
  * @type {boolean}
  */
var inSkip = false;

/**
 * Makes sure that there is a current patch context.
 * @param {string} functionName
 * @param {*} context
 */
var assertInPatch = function (functionName, context) {
  if (!context) {
    throw new Error('Cannot call ' + functionName + '() unless in patch.');
  }
};

/**
 * Makes sure that a patch closes every node that it opened.
 * @param {?Node} openElement
 * @param {!Node|!DocumentFragment} root
 */
var assertNoUnclosedTags = function (openElement, root) {
  if (openElement === root) {
    return;
  }

  var currentElement = openElement;
  var openTags = [];
  while (currentElement && currentElement !== root) {
    openTags.push(currentElement.nodeName.toLowerCase());
    currentElement = currentElement.parentNode;
  }

  throw new Error('One or more tags were not closed:\n' + openTags.join('\n'));
};

/**
 * Makes sure that the caller is not where attributes are expected.
 * @param {string} functionName
 */
var assertNotInAttributes = function (functionName) {
  if (inAttributes) {
    throw new Error(functionName + '() can not be called between ' + 'elementOpenStart() and elementOpenEnd().');
  }
};

/**
 * Makes sure that the caller is not inside an element that has declared skip.
 * @param {string} functionName
 */
var assertNotInSkip = function (functionName) {
  if (inSkip) {
    throw new Error(functionName + '() may not be called inside an element ' + 'that has called skip().');
  }
};

/**
 * Makes sure that the caller is where attributes are expected.
 * @param {string} functionName
 */
var assertInAttributes = function (functionName) {
  if (!inAttributes) {
    throw new Error(functionName + '() can only be called after calling ' + 'elementOpenStart().');
  }
};

/**
 * Makes sure the patch closes virtual attributes call
 */
var assertVirtualAttributesClosed = function () {
  if (inAttributes) {
    throw new Error('elementOpenEnd() must be called after calling ' + 'elementOpenStart().');
  }
};

/**
  * Makes sure that tags are correctly nested.
  * @param {string} nodeName
  * @param {string} tag
  */
var assertCloseMatchesOpenTag = function (nodeName, tag) {
  if (nodeName !== tag) {
    throw new Error('Received a call to close "' + tag + '" but "' + nodeName + '" was open.');
  }
};

/**
 * Makes sure that no children elements have been declared yet in the current
 * element.
 * @param {string} functionName
 * @param {?Node} previousNode
 */
var assertNoChildrenDeclaredYet = function (functionName, previousNode) {
  if (previousNode !== null) {
    throw new Error(functionName + '() must come before any child ' + 'declarations inside the current element.');
  }
};

/**
 * Checks that a call to patchOuter actually patched the element.
 * @param {?Node} startNode The value for the currentNode when the patch
 *     started.
 * @param {?Node} currentNode The currentNode when the patch finished.
 * @param {?Node} expectedNextNode The Node that is expected to follow the
 *    currentNode after the patch;
 * @param {?Node} expectedPrevNode The Node that is expected to preceed the
 *    currentNode after the patch.
 */
var assertPatchElementNoExtras = function (startNode, currentNode, expectedNextNode, expectedPrevNode) {
  var wasUpdated = currentNode.nextSibling === expectedNextNode && currentNode.previousSibling === expectedPrevNode;
  var wasChanged = currentNode.nextSibling === startNode.nextSibling && currentNode.previousSibling === expectedPrevNode;
  var wasRemoved = currentNode === startNode;

  if (!wasUpdated && !wasChanged && !wasRemoved) {
    throw new Error('There must be exactly one top level call corresponding ' + 'to the patched element.');
  }
};

/**
 * Updates the state of being in an attribute declaration.
 * @param {boolean} value
 * @return {boolean} the previous value.
 */
var setInAttributes = function (value) {
  var previous = inAttributes;
  inAttributes = value;
  return previous;
};

/**
 * Updates the state of being in a skip element.
 * @param {boolean} value
 * @return {boolean} the previous value.
 */
var setInSkip = function (value) {
  var previous = inSkip;
  inSkip = value;
  return previous;
};

/**
 * Copyright 2016 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @param {!Node} node
 * @return {boolean} True if the node the root of a document, false otherwise.
 */
var isDocumentRoot = function (node) {
  // For ShadowRoots, check if they are a DocumentFragment instead of if they
  // are a ShadowRoot so that this can work in 'use strict' if ShadowRoots are
  // not supported.
  return node instanceof Document || node instanceof DocumentFragment;
};

/**
 * @param {!Node} node The node to start at, inclusive.
 * @param {?Node} root The root ancestor to get until, exclusive.
 * @return {!Array<!Node>} The ancestry of DOM nodes.
 */
var getAncestry = function (node, root) {
  var ancestry = [];
  var cur = node;

  while (cur !== root) {
    ancestry.push(cur);
    cur = cur.parentNode;
  }

  return ancestry;
};

/**
 * @param {!Node} node
 * @return {!Node} The root node of the DOM tree that contains node.
 */
var getRoot = function (node) {
  var cur = node;
  var prev = cur;

  while (cur) {
    prev = cur;
    cur = cur.parentNode;
  }

  return prev;
};

/**
 * @param {!Node} node The node to get the activeElement for.
 * @return {?Element} The activeElement in the Document or ShadowRoot
 *     corresponding to node, if present.
 */
var getActiveElement = function (node) {
  var root = getRoot(node);
  return isDocumentRoot(root) ? root.activeElement : null;
};

/**
 * Gets the path of nodes that contain the focused node in the same document as
 * a reference node, up until the root.
 * @param {!Node} node The reference node to get the activeElement for.
 * @param {?Node} root The root to get the focused path until.
 * @return {!Array<Node>}
 */
var getFocusedPath = function (node, root) {
  var activeElement = getActiveElement(node);

  if (!activeElement || !node.contains(activeElement)) {
    return [];
  }

  return getAncestry(activeElement, root);
};

/**
 * Like insertBefore, but instead instead of moving the desired node, instead
 * moves all the other nodes after.
 * @param {?Node} parentNode
 * @param {!Node} node
 * @param {?Node} referenceNode
 */
var moveBefore = function (parentNode, node, referenceNode) {
  var insertReferenceNode = node.nextSibling;
  var cur = referenceNode;

  while (cur !== node) {
    var next = cur.nextSibling;
    parentNode.insertBefore(cur, insertReferenceNode);
    cur = next;
  }
};

/** @type {?Context} */
var context = null;

/** @type {?Node} */
var currentNode = null;

/** @type {?Node} */
var currentParent = null;

/** @type {?Document} */
var doc = null;

/**
 * @param {!Array<Node>} focusPath The nodes to mark.
 * @param {boolean} focused Whether or not they are focused.
 */
var markFocused = function (focusPath, focused) {
  for (var i = 0; i < focusPath.length; i += 1) {
    getData(focusPath[i]).focused = focused;
  }
};

/**
 * Returns a patcher function that sets up and restores a patch context,
 * running the run function with the provided data.
 * @param {function((!Element|!DocumentFragment),!function(T),T=): ?Node} run
 * @return {function((!Element|!DocumentFragment),!function(T),T=): ?Node}
 * @template T
 */
var patchFactory = function (run) {
  /**
   * TODO(moz): These annotations won't be necessary once we switch to Closure
   * Compiler's new type inference. Remove these once the switch is done.
   *
   * @param {(!Element|!DocumentFragment)} node
   * @param {!function(T)} fn
   * @param {T=} data
   * @return {?Node} node
   * @template T
   */
  var f = function (node, fn, data) {
    var prevContext = context;
    var prevDoc = doc;
    var prevCurrentNode = currentNode;
    var prevCurrentParent = currentParent;
    var previousInAttributes = false;
    var previousInSkip = false;

    context = new Context();
    doc = node.ownerDocument;
    currentParent = node.parentNode;

    if (process.env.NODE_ENV !== 'production') {
      previousInAttributes = setInAttributes(false);
      previousInSkip = setInSkip(false);
    }

    var focusPath = getFocusedPath(node, currentParent);
    markFocused(focusPath, true);
    var retVal = run(node, fn, data);
    markFocused(focusPath, false);

    if (process.env.NODE_ENV !== 'production') {
      assertVirtualAttributesClosed();
      setInAttributes(previousInAttributes);
      setInSkip(previousInSkip);
    }

    context.notifyChanges();

    context = prevContext;
    doc = prevDoc;
    currentNode = prevCurrentNode;
    currentParent = prevCurrentParent;

    return retVal;
  };
  return f;
};

/**
 * Patches the document starting at node with the provided function. This
 * function may be called during an existing patch operation.
 * @param {!Element|!DocumentFragment} node The Element or Document
 *     to patch.
 * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
 *     calls that describe the DOM.
 * @param {T=} data An argument passed to fn to represent DOM state.
 * @return {!Node} The patched node.
 * @template T
 */
var patchInner = patchFactory(function (node, fn, data) {
  currentNode = node;

  enterNode();
  fn(data);
  exitNode();

  if (process.env.NODE_ENV !== 'production') {
    assertNoUnclosedTags(currentNode, node);
  }

  return node;
});

/**
 * Patches an Element with the the provided function. Exactly one top level
 * element call should be made corresponding to `node`.
 * @param {!Element} node The Element where the patch should start.
 * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
 *     calls that describe the DOM. This should have at most one top level
 *     element call.
 * @param {T=} data An argument passed to fn to represent DOM state.
 * @return {?Node} The node if it was updated, its replacedment or null if it
 *     was removed.
 * @template T
 */
var patchOuter = patchFactory(function (node, fn, data) {
  var startNode = /** @type {!Element} */{ nextSibling: node };
  var expectedNextNode = null;
  var expectedPrevNode = null;

  if (process.env.NODE_ENV !== 'production') {
    expectedNextNode = node.nextSibling;
    expectedPrevNode = node.previousSibling;
  }

  currentNode = startNode;
  fn(data);

  if (process.env.NODE_ENV !== 'production') {
    assertPatchElementNoExtras(startNode, currentNode, expectedNextNode, expectedPrevNode);
  }

  if (node !== currentNode && node.parentNode) {
    removeChild(currentParent, node, getData(currentParent).keyMap);
  }

  return startNode === currentNode ? null : currentNode;
});

/**
 * Checks whether or not the current node matches the specified nodeName and
 * key.
 *
 * @param {!Node} matchNode A node to match the data to.
 * @param {?string} nodeName The nodeName for this node.
 * @param {?string=} key An optional key that identifies a node.
 * @return {boolean} True if the node matches, false otherwise.
 */
var matches = function (matchNode, nodeName, key) {
  var data = getData(matchNode);

  // Key check is done using double equals as we want to treat a null key the
  // same as undefined. This should be okay as the only values allowed are
  // strings, null and undefined so the == semantics are not too weird.
  return nodeName === data.nodeName && key == data.key;
};

/**
 * Aligns the virtual Element definition with the actual DOM, moving the
 * corresponding DOM node to the correct location or creating it if necessary.
 * @param {string} nodeName For an Element, this should be a valid tag string.
 *     For a Text, this should be #text.
 * @param {?string=} key The key used to identify this element.
 */
var alignWithDOM = function (nodeName, key) {
  if (currentNode && matches(currentNode, nodeName, key)) {
    return;
  }

  var parentData = getData(currentParent);
  var currentNodeData = currentNode && getData(currentNode);
  var keyMap = parentData.keyMap;
  var node = undefined;

  // Check to see if the node has moved within the parent.
  if (key) {
    var keyNode = keyMap[key];
    if (keyNode) {
      if (matches(keyNode, nodeName, key)) {
        node = keyNode;
      } else if (keyNode === currentNode) {
        context.markDeleted(keyNode);
      } else {
        removeChild(currentParent, keyNode, keyMap);
      }
    }
  }

  // Create the node if it doesn't exist.
  if (!node) {
    if (nodeName === '#text') {
      node = createText(doc);
    } else {
      node = createElement(doc, currentParent, nodeName, key);
    }

    if (key) {
      keyMap[key] = node;
    }

    context.markCreated(node);
  }

  // Re-order the node into the right position, preserving focus if either
  // node or currentNode are focused by making sure that they are not detached
  // from the DOM.
  if (getData(node).focused) {
    // Move everything else before the node.
    moveBefore(currentParent, node, currentNode);
  } else if (currentNodeData && currentNodeData.key && !currentNodeData.focused) {
    // Remove the currentNode, which can always be added back since we hold a
    // reference through the keyMap. This prevents a large number of moves when
    // a keyed item is removed or moved backwards in the DOM.
    currentParent.replaceChild(node, currentNode);
    parentData.keyMapValid = false;
  } else {
    currentParent.insertBefore(node, currentNode);
  }

  currentNode = node;
};

/**
 * @param {?Node} node
 * @param {?Node} child
 * @param {?Object<string, !Element>} keyMap
 */
var removeChild = function (node, child, keyMap) {
  node.removeChild(child);
  context.markDeleted( /** @type {!Node}*/child);

  var key = getData(child).key;
  if (key) {
    delete keyMap[key];
  }
};

/**
 * Clears out any unvisited Nodes, as the corresponding virtual element
 * functions were never called for them.
 */
var clearUnvisitedDOM = function () {
  var node = currentParent;
  var data = getData(node);
  var keyMap = data.keyMap;
  var keyMapValid = data.keyMapValid;
  var child = node.lastChild;
  var key = undefined;

  if (child === currentNode && keyMapValid) {
    return;
  }

  while (child !== currentNode) {
    removeChild(node, child, keyMap);
    child = node.lastChild;
  }

  // Clean the keyMap, removing any unusued keys.
  if (!keyMapValid) {
    for (key in keyMap) {
      child = keyMap[key];
      if (child.parentNode !== node) {
        context.markDeleted(child);
        delete keyMap[key];
      }
    }

    data.keyMapValid = true;
  }
};

/**
 * Changes to the first child of the current node.
 */
var enterNode = function () {
  currentParent = currentNode;
  currentNode = null;
};

/**
 * @return {?Node} The next Node to be patched.
 */
var getNextNode = function () {
  if (currentNode) {
    return currentNode.nextSibling;
  } else {
    return currentParent.firstChild;
  }
};

/**
 * Changes to the next sibling of the current node.
 */
var nextNode = function () {
  currentNode = getNextNode();
};

/**
 * Changes to the parent of the current node, removing any unvisited children.
 */
var exitNode = function () {
  clearUnvisitedDOM();

  currentNode = currentParent;
  currentParent = currentParent.parentNode;
};

/**
 * Makes sure that the current node is an Element with a matching tagName and
 * key.
 *
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @return {!Element} The corresponding Element.
 */
var coreElementOpen = function (tag, key) {
  nextNode();
  alignWithDOM(tag, key);
  enterNode();
  return (/** @type {!Element} */currentParent
  );
};

/**
 * Closes the currently open Element, removing any unvisited children if
 * necessary.
 *
 * @return {!Element} The corresponding Element.
 */
var coreElementClose = function () {
  if (process.env.NODE_ENV !== 'production') {
    setInSkip(false);
  }

  exitNode();
  return (/** @type {!Element} */currentNode
  );
};

/**
 * Makes sure the current node is a Text node and creates a Text node if it is
 * not.
 *
 * @return {!Text} The corresponding Text Node.
 */
var coreText = function () {
  nextNode();
  alignWithDOM('#text', null);
  return (/** @type {!Text} */currentNode
  );
};

/**
 * Gets the current Element being patched.
 * @return {!Element}
 */
var currentElement = function () {
  if (process.env.NODE_ENV !== 'production') {
    assertInPatch('currentElement', context);
    assertNotInAttributes('currentElement');
  }
  return (/** @type {!Element} */currentParent
  );
};

/**
 * @return {Node} The Node that will be evaluated for the next instruction.
 */
var currentPointer = function () {
  if (process.env.NODE_ENV !== 'production') {
    assertInPatch('currentPointer', context);
    assertNotInAttributes('currentPointer');
  }
  return getNextNode();
};

/**
 * Skips the children in a subtree, allowing an Element to be closed without
 * clearing out the children.
 */
var skip = function () {
  if (process.env.NODE_ENV !== 'production') {
    assertNoChildrenDeclaredYet('skip', currentNode);
    setInSkip(true);
  }
  currentNode = currentParent.lastChild;
};

/**
 * Skips the next Node to be patched, moving the pointer forward to the next
 * sibling of the current pointer.
 */
var skipNode = nextNode;

/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @const */
var symbols = {
  default: '__default'
};

/**
 * @param {string} name
 * @return {string|undefined} The namespace to use for the attribute.
 */
var getNamespace = function (name) {
  if (name.lastIndexOf('xml:', 0) === 0) {
    return 'http://www.w3.org/XML/1998/namespace';
  }

  if (name.lastIndexOf('xlink:', 0) === 0) {
    return 'http://www.w3.org/1999/xlink';
  }
};

/**
 * Applies an attribute or property to a given Element. If the value is null
 * or undefined, it is removed from the Element. Otherwise, the value is set
 * as an attribute.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {?(boolean|number|string)=} value The attribute's value.
 */
var applyAttr = function (el, name, value) {
  if (value == null) {
    el.removeAttribute(name);
  } else {
    var attrNS = getNamespace(name);
    if (attrNS) {
      el.setAttributeNS(attrNS, name, value);
    } else {
      el.setAttribute(name, value);
    }
  }
};

/**
 * Applies a property to a given Element.
 * @param {!Element} el
 * @param {string} name The property's name.
 * @param {*} value The property's value.
 */
var applyProp = function (el, name, value) {
  el[name] = value;
};

/**
 * Applies a value to a style declaration. Supports CSS custom properties by
 * setting properties containing a dash using CSSStyleDeclaration.setProperty.
 * @param {CSSStyleDeclaration} style
 * @param {!string} prop
 * @param {*} value
 */
var setStyleValue = function (style, prop, value) {
  if (prop.indexOf('-') >= 0) {
    style.setProperty(prop, /** @type {string} */value);
  } else {
    style[prop] = value;
  }
};

/**
 * Applies a style to an Element. No vendor prefix expansion is done for
 * property names/values.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} style The style to set. Either a string of css or an object
 *     containing property-value pairs.
 */
var applyStyle = function (el, name, style) {
  if (typeof style === 'string') {
    el.style.cssText = style;
  } else {
    el.style.cssText = '';
    var elStyle = el.style;
    var obj = /** @type {!Object<string,string>} */style;

    for (var prop in obj) {
      if (has(obj, prop)) {
        setStyleValue(elStyle, prop, obj[prop]);
      }
    }
  }
};

/**
 * Updates a single attribute on an Element.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} value The attribute's value. If the value is an object or
 *     function it is set on the Element, otherwise, it is set as an HTML
 *     attribute.
 */
var applyAttributeTyped = function (el, name, value) {
  var type = typeof value;

  if (type === 'object' || type === 'function') {
    applyProp(el, name, value);
  } else {
    applyAttr(el, name, /** @type {?(boolean|number|string)} */value);
  }
};

/**
 * Calls the appropriate attribute mutator for this attribute.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} value The attribute's value.
 */
var updateAttribute = function (el, name, value) {
  var data = getData(el);
  var attrs = data.attrs;

  if (attrs[name] === value) {
    return;
  }

  var mutator = attributes[name] || attributes[symbols.default];
  mutator(el, name, value);

  attrs[name] = value;
};

/**
 * A publicly mutable object to provide custom mutators for attributes.
 * @const {!Object<string, function(!Element, string, *)>}
 */
var attributes = createMap();

// Special generic mutator that's called for any attribute that does not
// have a specific mutator.
attributes[symbols.default] = applyAttributeTyped;

attributes['style'] = applyStyle;

/**
 * The offset in the virtual element declaration where the attributes are
 * specified.
 * @const
 */
var ATTRIBUTES_OFFSET = 3;

/**
 * Builds an array of arguments for use with elementOpenStart, attr and
 * elementOpenEnd.
 * @const {Array<*>}
 */
var argsBuilder = [];

/**
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} var_args, Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
var elementOpen = function (tag, key, statics, var_args) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes('elementOpen');
    assertNotInSkip('elementOpen');
  }

  var node = coreElementOpen(tag, key);
  var data = getData(node);

  if (!data.staticsApplied) {
    if (statics) {
      for (var _i = 0; _i < statics.length; _i += 2) {
        var name = /** @type {string} */statics[_i];
        var value = statics[_i + 1];
        updateAttribute(node, name, value);
      }
    }
    // Down the road, we may want to keep track of the statics array to use it
    // as an additional signal about whether a node matches or not. For now,
    // just use a marker so that we do not reapply statics.
    data.staticsApplied = true;
  }

  /*
   * Checks to see if one or more attributes have changed for a given Element.
   * When no attributes have changed, this is much faster than checking each
   * individual argument. When attributes have changed, the overhead of this is
   * minimal.
   */
  var attrsArr = data.attrsArr;
  var newAttrs = data.newAttrs;
  var isNew = !attrsArr.length;
  var i = ATTRIBUTES_OFFSET;
  var j = 0;

  for (; i < arguments.length; i += 2, j += 2) {
    var _attr = arguments[i];
    if (isNew) {
      attrsArr[j] = _attr;
      newAttrs[_attr] = undefined;
    } else if (attrsArr[j] !== _attr) {
      break;
    }

    var value = arguments[i + 1];
    if (isNew || attrsArr[j + 1] !== value) {
      attrsArr[j + 1] = value;
      updateAttribute(node, _attr, value);
    }
  }

  if (i < arguments.length || j < attrsArr.length) {
    for (; i < arguments.length; i += 1, j += 1) {
      attrsArr[j] = arguments[i];
    }

    if (j < attrsArr.length) {
      attrsArr.length = j;
    }

    /*
     * Actually perform the attribute update.
     */
    for (i = 0; i < attrsArr.length; i += 2) {
      var name = /** @type {string} */attrsArr[i];
      var value = attrsArr[i + 1];
      newAttrs[name] = value;
    }

    for (var _attr2 in newAttrs) {
      updateAttribute(node, _attr2, newAttrs[_attr2]);
      newAttrs[_attr2] = undefined;
    }
  }

  return node;
};

/**
 * Declares a virtual Element at the current location in the document. This
 * corresponds to an opening tag and a elementClose tag is required. This is
 * like elementOpen, but the attributes are defined using the attr function
 * rather than being passed as arguments. Must be folllowed by 0 or more calls
 * to attr, then a call to elementOpenEnd.
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 */
var elementOpenStart = function (tag, key, statics) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes('elementOpenStart');
    setInAttributes(true);
  }

  argsBuilder[0] = tag;
  argsBuilder[1] = key;
  argsBuilder[2] = statics;
};

/***
 * Defines a virtual attribute at this point of the DOM. This is only valid
 * when called between elementOpenStart and elementOpenEnd.
 *
 * @param {string} name
 * @param {*} value
 */
var attr = function (name, value) {
  if (process.env.NODE_ENV !== 'production') {
    assertInAttributes('attr');
  }

  argsBuilder.push(name);
  argsBuilder.push(value);
};

/**
 * Closes an open tag started with elementOpenStart.
 * @return {!Element} The corresponding Element.
 */
var elementOpenEnd = function () {
  if (process.env.NODE_ENV !== 'production') {
    assertInAttributes('elementOpenEnd');
    setInAttributes(false);
  }

  var node = elementOpen.apply(null, argsBuilder);
  argsBuilder.length = 0;
  return node;
};

/**
 * Closes an open virtual Element.
 *
 * @param {string} tag The element's tag.
 * @return {!Element} The corresponding Element.
 */
var elementClose = function (tag) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes('elementClose');
  }

  var node = coreElementClose();

  if (process.env.NODE_ENV !== 'production') {
    assertCloseMatchesOpenTag(getData(node).nodeName, tag);
  }

  return node;
};

/**
 * Declares a virtual Element at the current location in the document that has
 * no children.
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
var elementVoid = function (tag, key, statics, var_args) {
  elementOpen.apply(null, arguments);
  return elementClose(tag);
};

/**
 * Declares a virtual Text at this point in the document.
 *
 * @param {string|number|boolean} value The value of the Text.
 * @param {...(function((string|number|boolean)):string)} var_args
 *     Functions to format the value which are called only when the value has
 *     changed.
 * @return {!Text} The corresponding text node.
 */
var text = function (value, var_args) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes('text');
    assertNotInSkip('text');
  }

  var node = coreText();
  var data = getData(node);

  if (data.text !== value) {
    data.text = /** @type {string} */value;

    var formatted = value;
    for (var i = 1; i < arguments.length; i += 1) {
      /*
       * Call the formatter function directly to prevent leaking arguments.
       * https://github.com/google/incremental-dom/pull/204#issuecomment-178223574
       */
      var fn = arguments[i];
      formatted = fn(formatted);
    }

    node.data = formatted;
  }

  return node;
};

exports.patch = patchInner;
exports.patchInner = patchInner;
exports.patchOuter = patchOuter;
exports.currentElement = currentElement;
exports.currentPointer = currentPointer;
exports.skip = skip;
exports.skipNode = skipNode;
exports.elementVoid = elementVoid;
exports.elementOpenStart = elementOpenStart;
exports.elementOpenEnd = elementOpenEnd;
exports.elementOpen = elementOpen;
exports.elementClose = elementClose;
exports.text = text;
exports.attr = attr;
exports.symbols = symbols;
exports.attributes = attributes;
exports.applyAttr = applyAttr;
exports.applyProp = applyProp;
exports.notifications = notifications;
exports.importNode = importNode;


}).call(this,require('_process'))

},{"_process":11}],27:[function(require,module,exports){
exports['date-time'] = /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-[0-9]{2}[tT ]\d{2}:\d{2}:\d{2}(\.\d+)?([zZ]|[+-]\d{2}:\d{2})$/
exports['date'] = /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-[0-9]{2}$/
exports['time'] = /^\d{2}:\d{2}:\d{2}$/
exports['email'] = /^\S+@\S+$/
exports['ip-address'] = exports['ipv4'] = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
exports['ipv6'] = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/
exports['uri'] = /^[a-zA-Z][a-zA-Z0-9+-.]*:[^\s]*$/
exports['color'] = /(#?([0-9A-Fa-f]{3,6})\b)|(aqua)|(black)|(blue)|(fuchsia)|(gray)|(green)|(lime)|(maroon)|(navy)|(olive)|(orange)|(purple)|(red)|(silver)|(teal)|(white)|(yellow)|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\))/
exports['hostname'] = /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9]))*$/
exports['alpha'] = /^[a-zA-Z]+$/
exports['alphanumeric'] = /^[a-zA-Z0-9]+$/
exports['style'] = /\s*(.+?):\s*([^;]+);?/g
exports['phone'] = /^\+(?:[0-9] ?){6,14}[0-9]$/
exports['utc-millisec'] = /^[0-9]{1,15}\.?[0-9]{0,15}$/

},{}],28:[function(require,module,exports){
var genobj = require('generate-object-property')
var genfun = require('generate-function')
var jsonpointer = require('jsonpointer')
var xtend = require('xtend')
var formats = require('./formats')

var get = function(obj, additionalSchemas, ptr) {

  var visit = function(sub) {
    if (sub && sub.id === ptr) return sub
    if (typeof sub !== 'object' || !sub) return null
    return Object.keys(sub).reduce(function(res, k) {
      return res || visit(sub[k])
    }, null)
  }

  var res = visit(obj)
  if (res) return res

  ptr = ptr.replace(/^#/, '')
  ptr = ptr.replace(/\/$/, '')

  try {
    return jsonpointer.get(obj, decodeURI(ptr))
  } catch (err) {
    var end = ptr.indexOf('#')
    var other
    // external reference
    if (end !== 0) {
      // fragment doesn't exist.
      if (end === -1) {
        other = additionalSchemas[ptr]
      } else {
        var ext = ptr.slice(0, end)
        other = additionalSchemas[ext]
        var fragment = ptr.slice(end).replace(/^#/, '')
        try {
          return jsonpointer.get(other, fragment)
        } catch (err) {}
      }
    } else {
      other = additionalSchemas[ptr]
    }
    return other || null
  }
}

var formatName = function(field) {
  field = JSON.stringify(field)
  var pattern = /\[([^\[\]"]+)\]/
  while (pattern.test(field)) field = field.replace(pattern, '."+$1+"')
  return field
}

var types = {}

types.any = function() {
  return 'true'
}

types.null = function(name) {
  return name+' === null'
}

types.boolean = function(name) {
  return 'typeof '+name+' === "boolean"'
}

types.array = function(name) {
  return 'Array.isArray('+name+')'
}

types.object = function(name) {
  return 'typeof '+name+' === "object" && '+name+' && !Array.isArray('+name+')'
}

types.number = function(name) {
  return 'typeof '+name+' === "number"'
}

types.integer = function(name) {
  return 'typeof '+name+' === "number" && (Math.floor('+name+') === '+name+' || '+name+' > 9007199254740992 || '+name+' < -9007199254740992)'
}

types.string = function(name) {
  return 'typeof '+name+' === "string"'
}

var unique = function(array) {
  var list = []
  for (var i = 0; i < array.length; i++) {
    list.push(typeof array[i] === 'object' ? JSON.stringify(array[i]) : array[i])
  }
  for (var i = 1; i < list.length; i++) {
    if (list.indexOf(list[i]) !== i) return false
  }
  return true
}

var isMultipleOf = function(name, multipleOf) {
  var res;
  var factor = ((multipleOf | 0) !== multipleOf) ? Math.pow(10, multipleOf.toString().split('.').pop().length) : 1
  if (factor > 1) {
    var factorName = ((name | 0) !== name) ? Math.pow(10, name.toString().split('.').pop().length) : 1
    if (factorName > factor) res = true
    else res = Math.round(factor * name) % (factor * multipleOf)
  }
  else res = name % multipleOf;
  return !res;
}

var toType = function(node) {
  return node.type
}

var compile = function(schema, cache, root, reporter, opts) {
  var fmts = opts ? xtend(formats, opts.formats) : formats
  var scope = {unique:unique, formats:fmts, isMultipleOf:isMultipleOf}
  var verbose = opts ? !!opts.verbose : false;
  var greedy = opts && opts.greedy !== undefined ?
    opts.greedy : false;

  var syms = {}
  var gensym = function(name) {
    return name+(syms[name] = (syms[name] || 0)+1)
  }

  var reversePatterns = {}
  var patterns = function(p) {
    if (reversePatterns[p]) return reversePatterns[p]
    var n = gensym('pattern')
    scope[n] = new RegExp(p)
    reversePatterns[p] = n
    return n
  }

  var vars = ['i','j','k','l','m','n','o','p','q','r','s','t','u','v','x','y','z']
  var genloop = function() {
    var v = vars.shift()
    vars.push(v+v[0])
    return v
  }

  var visit = function(name, node, reporter, filter) {
    var properties = node.properties
    var type = node.type
    var tuple = false

    if (Array.isArray(node.items)) { // tuple type
      properties = {}
      node.items.forEach(function(item, i) {
        properties[i] = item
      })
      type = 'array'
      tuple = true
    }

    var indent = 0
    var error = function(msg, prop, value) {
      validate('errors++')
      if (reporter === true) {
        validate('if (validate.errors === null) validate.errors = []')
        if (verbose) {
          validate('validate.errors.push({field:%s,message:%s,value:%s,type:%s})', formatName(prop || name), JSON.stringify(msg), value || name, JSON.stringify(type))
        } else {
          validate('validate.errors.push({field:%s,message:%s})', formatName(prop || name), JSON.stringify(msg))
        }
      }
    }

    if (node.required === true) {
      indent++
      validate('if (%s === undefined) {', name)
      error('is required')
      validate('} else {')
    } else {
      indent++
      validate('if (%s !== undefined) {', name)
    }

    var valid = [].concat(type)
      .map(function(t) {
        return types[t || 'any'](name)
      })
      .join(' || ') || 'true'

    if (valid !== 'true') {
      indent++
      validate('if (!(%s)) {', valid)
      error('is the wrong type')
      validate('} else {')
    }

    if (tuple) {
      if (node.additionalItems === false) {
        validate('if (%s.length > %d) {', name, node.items.length)
        error('has additional items')
        validate('}')
      } else if (node.additionalItems) {
        var i = genloop()
        validate('for (var %s = %d; %s < %s.length; %s++) {', i, node.items.length, i, name, i)
        visit(name+'['+i+']', node.additionalItems, reporter, filter)
        validate('}')
      }
    }

    if (node.format && fmts[node.format]) {
      if (type !== 'string' && formats[node.format]) validate('if (%s) {', types.string(name))
      var n = gensym('format')
      scope[n] = fmts[node.format]

      if (typeof scope[n] === 'function') validate('if (!%s(%s)) {', n, name)
      else validate('if (!%s.test(%s)) {', n, name)
      error('must be '+node.format+' format')
      validate('}')
      if (type !== 'string' && formats[node.format]) validate('}')
    }

    if (Array.isArray(node.required)) {
      var isUndefined = function(req) {
        return genobj(name, req) + ' === undefined'
      }

      var checkRequired = function (req) {
        var prop = genobj(name, req);
        validate('if (%s === undefined) {', prop)
        error('is required', prop)
        validate('missing++')
        validate('}')
      }
      validate('if ((%s)) {', type !== 'object' ? types.object(name) : 'true')
      validate('var missing = 0')
      node.required.map(checkRequired)
      validate('}');
      if (!greedy) {
        validate('if (missing === 0) {')
        indent++
      }
    }

    if (node.uniqueItems) {
      if (type !== 'array') validate('if (%s) {', types.array(name))
      validate('if (!(unique(%s))) {', name)
      error('must be unique')
      validate('}')
      if (type !== 'array') validate('}')
    }

    if (node.enum) {
      var complex = node.enum.some(function(e) {
        return typeof e === 'object'
      })

      var compare = complex ?
        function(e) {
          return 'JSON.stringify('+name+')'+' !== JSON.stringify('+JSON.stringify(e)+')'
        } :
        function(e) {
          return name+' !== '+JSON.stringify(e)
        }

      validate('if (%s) {', node.enum.map(compare).join(' && ') || 'false')
      error('must be an enum value')
      validate('}')
    }

    if (node.dependencies) {
      if (type !== 'object') validate('if (%s) {', types.object(name))

      Object.keys(node.dependencies).forEach(function(key) {
        var deps = node.dependencies[key]
        if (typeof deps === 'string') deps = [deps]

        var exists = function(k) {
          return genobj(name, k) + ' !== undefined'
        }

        if (Array.isArray(deps)) {
          validate('if (%s !== undefined && !(%s)) {', genobj(name, key), deps.map(exists).join(' && ') || 'true')
          error('dependencies not set')
          validate('}')
        }
        if (typeof deps === 'object') {
          validate('if (%s !== undefined) {', genobj(name, key))
          visit(name, deps, reporter, filter)
          validate('}')
        }
      })

      if (type !== 'object') validate('}')
    }

    if (node.additionalProperties || node.additionalProperties === false) {
      if (type !== 'object') validate('if (%s) {', types.object(name))

      var i = genloop()
      var keys = gensym('keys')

      var toCompare = function(p) {
        return keys+'['+i+'] !== '+JSON.stringify(p)
      }

      var toTest = function(p) {
        return '!'+patterns(p)+'.test('+keys+'['+i+'])'
      }

      var additionalProp = Object.keys(properties || {}).map(toCompare)
        .concat(Object.keys(node.patternProperties || {}).map(toTest))
        .join(' && ') || 'true'

      validate('var %s = Object.keys(%s)', keys, name)
        ('for (var %s = 0; %s < %s.length; %s++) {', i, i, keys, i)
          ('if (%s) {', additionalProp)

      if (node.additionalProperties === false) {
        if (filter) validate('delete %s', name+'['+keys+'['+i+']]')
        error('has additional properties', null, JSON.stringify(name+'.') + ' + ' + keys + '['+i+']')
      } else {
        visit(name+'['+keys+'['+i+']]', node.additionalProperties, reporter, filter)
      }

      validate
          ('}')
        ('}')

      if (type !== 'object') validate('}')
    }

    if (node.$ref) {
      var sub = get(root, opts && opts.schemas || {}, node.$ref)
      if (sub) {
        var fn = cache[node.$ref]
        if (!fn) {
          cache[node.$ref] = function proxy(data) {
            return fn(data)
          }
          fn = compile(sub, cache, root, false, opts)
        }
        var n = gensym('ref')
        scope[n] = fn
        validate('if (!(%s(%s))) {', n, name)
        error('referenced schema does not match')
        validate('}')
      }
    }

    if (node.not) {
      var prev = gensym('prev')
      validate('var %s = errors', prev)
      visit(name, node.not, false, filter)
      validate('if (%s === errors) {', prev)
      error('negative schema matches')
      validate('} else {')
        ('errors = %s', prev)
      ('}')
    }

    if (node.items && !tuple) {
      if (type !== 'array') validate('if (%s) {', types.array(name))

      var i = genloop()
      validate('for (var %s = 0; %s < %s.length; %s++) {', i, i, name, i)
      visit(name+'['+i+']', node.items, reporter, filter)
      validate('}')

      if (type !== 'array') validate('}')
    }

    if (node.patternProperties) {
      if (type !== 'object') validate('if (%s) {', types.object(name))
      var keys = gensym('keys')
      var i = genloop()
      validate
        ('var %s = Object.keys(%s)', keys, name)
        ('for (var %s = 0; %s < %s.length; %s++) {', i, i, keys, i)

      Object.keys(node.patternProperties).forEach(function(key) {
        var p = patterns(key)
        validate('if (%s.test(%s)) {', p, keys+'['+i+']')
        visit(name+'['+keys+'['+i+']]', node.patternProperties[key], reporter, filter)
        validate('}')
      })

      validate('}')
      if (type !== 'object') validate('}')
    }

    if (node.pattern) {
      var p = patterns(node.pattern)
      if (type !== 'string') validate('if (%s) {', types.string(name))
      validate('if (!(%s.test(%s))) {', p, name)
      error('pattern mismatch')
      validate('}')
      if (type !== 'string') validate('}')
    }

    if (node.allOf) {
      node.allOf.forEach(function(sch) {
        visit(name, sch, reporter, filter)
      })
    }

    if (node.anyOf && node.anyOf.length) {
      var prev = gensym('prev')

      node.anyOf.forEach(function(sch, i) {
        if (i === 0) {
          validate('var %s = errors', prev)
        } else {
          validate('if (errors !== %s) {', prev)
            ('errors = %s', prev)
        }
        visit(name, sch, false, false)
      })
      node.anyOf.forEach(function(sch, i) {
        if (i) validate('}')
      })
      validate('if (%s !== errors) {', prev)
      error('no schemas match')
      validate('}')
    }

    if (node.oneOf && node.oneOf.length) {
      var prev = gensym('prev')
      var passes = gensym('passes')

      validate
        ('var %s = errors', prev)
        ('var %s = 0', passes)

      node.oneOf.forEach(function(sch, i) {
        visit(name, sch, false, false)
        validate('if (%s === errors) {', prev)
          ('%s++', passes)
        ('} else {')
          ('errors = %s', prev)
        ('}')
      })

      validate('if (%s !== 1) {', passes)
      error('no (or more than one) schemas match')
      validate('}')
    }

    if (node.multipleOf !== undefined) {
      if (type !== 'number' && type !== 'integer') validate('if (%s) {', types.number(name))

      validate('if (!isMultipleOf(%s, %d)) {', name, node.multipleOf)

      error('has a remainder')
      validate('}')

      if (type !== 'number' && type !== 'integer') validate('}')
    }

    if (node.maxProperties !== undefined) {
      if (type !== 'object') validate('if (%s) {', types.object(name))

      validate('if (Object.keys(%s).length > %d) {', name, node.maxProperties)
      error('has more properties than allowed')
      validate('}')

      if (type !== 'object') validate('}')
    }

    if (node.minProperties !== undefined) {
      if (type !== 'object') validate('if (%s) {', types.object(name))

      validate('if (Object.keys(%s).length < %d) {', name, node.minProperties)
      error('has less properties than allowed')
      validate('}')

      if (type !== 'object') validate('}')
    }

    if (node.maxItems !== undefined) {
      if (type !== 'array') validate('if (%s) {', types.array(name))

      validate('if (%s.length > %d) {', name, node.maxItems)
      error('has more items than allowed')
      validate('}')

      if (type !== 'array') validate('}')
    }

    if (node.minItems !== undefined) {
      if (type !== 'array') validate('if (%s) {', types.array(name))

      validate('if (%s.length < %d) {', name, node.minItems)
      error('has less items than allowed')
      validate('}')

      if (type !== 'array') validate('}')
    }

    if (node.maxLength !== undefined) {
      if (type !== 'string') validate('if (%s) {', types.string(name))

      validate('if (%s.length > %d) {', name, node.maxLength)
      error('has longer length than allowed')
      validate('}')

      if (type !== 'string') validate('}')
    }

    if (node.minLength !== undefined) {
      if (type !== 'string') validate('if (%s) {', types.string(name))

      validate('if (%s.length < %d) {', name, node.minLength)
      error('has less length than allowed')
      validate('}')

      if (type !== 'string') validate('}')
    }

    if (node.minimum !== undefined) {
      if (type !== 'number' && type !== 'integer') validate('if (%s) {', types.number(name))

      validate('if (%s %s %d) {', name, node.exclusiveMinimum ? '<=' : '<', node.minimum)
      error('is less than minimum')
      validate('}')

      if (type !== 'number' && type !== 'integer') validate('}')
    }

    if (node.maximum !== undefined) {
      if (type !== 'number' && type !== 'integer') validate('if (%s) {', types.number(name))

      validate('if (%s %s %d) {', name, node.exclusiveMaximum ? '>=' : '>', node.maximum)
      error('is more than maximum')
      validate('}')

      if (type !== 'number' && type !== 'integer') validate('}')
    }

    if (properties) {
      Object.keys(properties).forEach(function(p) {
        if (Array.isArray(type) && type.indexOf('null') !== -1) validate('if (%s !== null) {', name)

        visit(genobj(name, p), properties[p], reporter, filter)

        if (Array.isArray(type) && type.indexOf('null') !== -1) validate('}')
      })
    }

    while (indent--) validate('}')
  }

  var validate = genfun
    ('function validate(data) {')
      // Since undefined is not a valid JSON value, we coerce to null and other checks will catch this
      ('if (data === undefined) data = null')
      ('validate.errors = null')
      ('var errors = 0')

  visit('data', schema, reporter, opts && opts.filter)

  validate
      ('return errors === 0')
    ('}')

  validate = validate.toFunction(scope)
  validate.errors = null

  if (Object.defineProperty) {
    Object.defineProperty(validate, 'error', {
      get: function() {
        if (!validate.errors) return ''
        return validate.errors.map(function(err) {
          return err.field + ' ' + err.message;
        }).join('\n')
      }
    })
  }

  validate.toJSON = function() {
    return schema
  }

  return validate
}

module.exports = function(schema, opts) {
  if (typeof schema === 'string') schema = JSON.parse(schema)
  return compile(schema, {}, schema, true, opts)
}

module.exports.filter = function(schema, opts) {
  var validate = module.exports(schema, xtend(opts, {filter: true}))
  return function(sch) {
    validate(sch)
    return sch
  }
}

},{"./formats":27,"generate-function":24,"generate-object-property":25,"jsonpointer":30,"xtend":31}],29:[function(require,module,exports){
"use strict"
function isProperty(str) {
  return /^[$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc0-9\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19d9\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1dc0-\u1de6\u1dfc-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f]*$/.test(str)
}
module.exports = isProperty
},{}],30:[function(require,module,exports){
var hasExcape = /~/
var escapeMatcher = /~[01]/g
function escapeReplacer (m) {
  switch (m) {
    case '~1': return '/'
    case '~0': return '~'
  }
  throw new Error('Invalid tilde escape: ' + m)
}

function untilde (str) {
  if (!hasExcape.test(str)) return str
  return str.replace(escapeMatcher, escapeReplacer)
}

function setter (obj, pointer, value) {
  var part
  var hasNextPart

  for (var p = 1, len = pointer.length; p < len;) {
    part = untilde(pointer[p++])
    hasNextPart = len > p

    if (typeof obj[part] === 'undefined') {
      // support setting of /-
      if (Array.isArray(obj) && part === '-') {
        part = obj.length
      }

      // support nested objects/array when setting values
      if (hasNextPart) {
        if ((pointer[p] !== '' && pointer[p] < Infinity) || pointer[p] === '-') obj[part] = []
        else obj[part] = {}
      }
    }

    if (!hasNextPart) break
    obj = obj[part]
  }

  var oldValue = obj[part]
  if (value === undefined) delete obj[part]
  else obj[part] = value
  return oldValue
}

function compilePointer (pointer) {
  if (typeof pointer === 'string') {
    pointer = pointer.split('/')
    if (pointer[0] === '') return pointer
    throw new Error('Invalid JSON pointer.')
  } else if (Array.isArray(pointer)) {
    return pointer
  }

  throw new Error('Invalid JSON pointer.')
}

function get (obj, pointer) {
  if (typeof obj !== 'object') throw new Error('Invalid input object.')
  pointer = compilePointer(pointer)
  var len = pointer.length
  if (len === 1) return obj

  for (var p = 1; p < len;) {
    obj = obj[untilde(pointer[p++])]
    if (len === p) return obj
    if (typeof obj !== 'object') return undefined
  }
}

function set (obj, pointer, value) {
  if (typeof obj !== 'object') throw new Error('Invalid input object.')
  pointer = compilePointer(pointer)
  if (pointer.length === 0) throw new Error('Invalid JSON pointer for set.')
  return setter(obj, pointer, value)
}

function compile (pointer) {
  var compiled = compilePointer(pointer)
  return {
    get: function (object) {
      return get(object, compiled)
    },
    set: function (object, value) {
      return set(object, compiled, value)
    }
  }
}

exports.get = get
exports.set = set
exports.compile = compile

},{}],31:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],32:[function(require,module,exports){
module.exports = require('freezer-js')

},{"freezer-js":18}],33:[function(require,module,exports){
module.exports = require('is-my-json-valid')

},{"is-my-json-valid":28}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvaW5kZXguanMiLCJkZWxlZ2F0b3IuanMiLCJkcmUuanMiLCJleGFtcGxlcy9jbGllbnQveC10b2Rvcy9pbmRleC5qcyIsImV4YW1wbGVzL2NsaWVudC94LXRvZG9zL3RvZG8uaHRtbCIsImV4YW1wbGVzL2NsaWVudC94LXRvZG9zL3RvZG8uanNvbiIsImV4YW1wbGVzL2NsaWVudC94LXRvZG9zL3RvZG8uanMiLCJleGFtcGxlcy9jbGllbnQveC10b2Rvcy90b2Rvcy5odG1sIiwiZXhhbXBsZXMvY2xpZW50L3gtdG9kb3MvdG9kb3MuanMiLCJpbmNyZW1lbnRhbC1kb20uanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJub2RlX21vZHVsZXMvZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudC9idWlsZC9kb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50Lm5vZGUuanMiLCJub2RlX21vZHVsZXMvZG9tLWRlbGVnYXRlL2xpYi9kZWxlZ2F0ZS5qcyIsIm5vZGVfbW9kdWxlcy9kb20tZGVsZWdhdGUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZyZWV6ZXItanMvZnJlZXplci5qcyIsIm5vZGVfbW9kdWxlcy9mcmVlemVyLWpzL3NyYy9lbWl0dGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZyZWV6ZXItanMvc3JjL2ZyZWV6ZXIuanMiLCJub2RlX21vZHVsZXMvZnJlZXplci1qcy9zcmMvZnJvemVuLmpzIiwibm9kZV9tb2R1bGVzL2ZyZWV6ZXItanMvc3JjL25vZGVDcmVhdG9yLmpzIiwibm9kZV9tb2R1bGVzL2ZyZWV6ZXItanMvc3JjL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL2dlbmVyYXRlLWZ1bmN0aW9uL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dlbmVyYXRlLW9iamVjdC1wcm9wZXJ0eS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pbmNyZW1lbnRhbC1kb20vZGlzdC9pbmNyZW1lbnRhbC1kb20tY2pzLmpzIiwibm9kZV9tb2R1bGVzL2lzLW15LWpzb24tdmFsaWQvZm9ybWF0cy5qcyIsIm5vZGVfbW9kdWxlcy9pcy1teS1qc29uLXZhbGlkL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2lzLXByb3BlcnR5L2lzLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL2pzb25wb2ludGVyL2pzb25wb2ludGVyLmpzIiwibm9kZV9tb2R1bGVzL3h0ZW5kL2ltbXV0YWJsZS5qcyIsInN0b3JlLmpzIiwidmFsaWRhdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelBBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDMWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6NUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMTRDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGxCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBOztBQ0RBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gY29uc3QgU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZScpXG5jb25zdCBkZWxlZ2F0b3IgPSByZXF1aXJlKCcuLi9kZWxlZ2F0b3InKVxuY29uc3QgdmFsaWRhdG9yID0gcmVxdWlyZSgnLi4vdmFsaWRhdG9yJylcblxuY29uc3QgdmFsaWRhdG9yT3B0aW9ucyA9IHtcbiAgZ3JlZWR5OiB0cnVlLFxuICBmb3JtYXRzOiB7XG4gICAgdXVpZDogL14oPzp1cm46dXVpZDopP1swLTlhLWZdezh9LSg/OlswLTlhLWZdezR9LSl7M31bMC05YS1mXXsxMn0kL2lcbiAgfVxufVxuXG5jb25zdCBjb252ZXJ0VmFsdWUgPSBmdW5jdGlvbiAodmFsdWUsIHR5cGUpIHtcbiAgaWYgKHR5cGVvZiAodmFsdWUpICE9PSAnc3RyaW5nJyB8fCB0eXBlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB2YWx1ZVxuICB9XG4gIGlmICh0eXBlID09PSAnaW50ZWdlcicgfHwgdHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAvLyBmYXN0ZXN0IChhbmQgbW9yZSByZWxpYWJsZSkgd2F5IHRvIGNvbnZlcnQgc3RyaW5ncyB0byBudW1iZXJzXG4gICAgdmFyIGNvbnZlcnRlZFZhbCA9IDEgKiB2YWx1ZVxuICAgIC8vIG1ha2Ugc3VyZSB0aGF0IGlmIG91ciBzY2hlbWEgY2FsbHMgZm9yIGFuIGludGVnZXIsIHRoYXQgdGhlcmUgaXMgbm8gZGVjaW1hbFxuICAgIGlmIChjb252ZXJ0ZWRWYWwgfHwgY29udmVydGVkVmFsID09PSAwICYmICh0eXBlID09PSAnbnVtYmVyJyB8fCAodmFsdWUuaW5kZXhPZignLicpID09PSAtMSkpKSB7XG4gICAgICByZXR1cm4gY29udmVydGVkVmFsXG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdib29sZWFuJykge1xuICAgIGlmICh2YWx1ZSA9PT0gJ3RydWUnKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSBpZiAodmFsdWUgPT09ICdmYWxzZScpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWVcbn1cblxuZnVuY3Rpb24gaXNTaW1wbGUgKGl0ZW0pIHtcbiAgcmV0dXJuIGl0ZW0udHlwZSAhPT0gJ29iamVjdCcgJiYgaXRlbS50eXBlICE9PSAnYXJyYXknXG59XG5cbmNvbnN0IHN1cGVydmlld3MgPSAob3B0aW9ucywgQmFzZSA9IHdpbmRvdy5IVE1MRWxlbWVudCkgPT4gY2xhc3MgU3VwZXJ2aWV3cyBleHRlbmRzIEJhc2Uge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKVxuXG4gICAgY29uc3QgY2FjaGUgPSB7XG4gICAgICBvcHRpb25zOiBvcHRpb25zXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVmZXJyZWQgcmVuZGVyZXJcbiAgICAgKi9cbiAgICBsZXQgcmVuZGVyVGltZW91dElkID0gMFxuICAgIGNvbnN0IHJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghcmVuZGVyVGltZW91dElkKSB7XG4gICAgICAgIHJlbmRlclRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHJlbmRlclRpbWVvdXRJZCA9IDBcbiAgICAgICAgICB0aGlzLnJlbmRlckNhbGxiYWNrKClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9LmJpbmQodGhpcylcblxuICAgIGNhY2hlLnJlbmRlciA9IHJlbmRlclxuXG4gICAgLyoqXG4gICAgICogSW5wdXQgcHJvcHMvYXR0cnMgJiB2YWxpZGF0aW9uXG4gICAgICovXG4gICAgY29uc3Qgc2NoZW1hID0gb3B0aW9ucy5zY2hlbWFcbiAgICBpZiAoc2NoZW1hICYmIHNjaGVtYS5wcm9wZXJ0aWVzKSB7XG4gICAgICBjb25zdCB2YWxpZGF0ZSA9IHZhbGlkYXRvcihzY2hlbWEsIHZhbGlkYXRvck9wdGlvbnMpXG4gICAgICBjb25zdCBwcm9wcyA9IHNjaGVtYS5wcm9wZXJ0aWVzXG4gICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocHJvcHMpXG5cbiAgICAgIC8vIEZvciBldmVyeSBrZXkgaW4gdGhlIHJvb3Qgc2NoZW1hcyBwcm9wZXJ0aWVzXG4gICAgICAvLyBzZXQgdXAgYW4gYXR0cmlidXRlIG9yIHByb3BlcnR5IG9uIHRoZSBlbGVtZW50XG4gICAgICBrZXlzLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICBjb25zdCBpdGVtID0gcHJvcHNba2V5XVxuICAgICAgICBjb25zdCBpc0F0dHIgPSBpc1NpbXBsZShpdGVtKVxuICAgICAgICBsZXQgZGZsdFxuXG4gICAgICAgIGlmICgnZGVmYXVsdCcgaW4gaXRlbSkge1xuICAgICAgICAgIGRmbHQgPSBpdGVtLmRlZmF1bHRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0F0dHIpIHtcbiAgICAgICAgICAvLyBTdG9yZSBwcmltaXRpdmUgdHlwZXMgYXMgYXR0cmlidXRlcyBhbmQgY2FzdCBvbiBgZ2V0YFxuICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBrZXksIHtcbiAgICAgICAgICAgIGdldCAoKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhc0F0dHJpYnV0ZShrZXkpXG4gICAgICAgICAgICAgICAgPyBjb252ZXJ0VmFsdWUodGhpcy5nZXRBdHRyaWJ1dGUoa2V5KSwgaXRlbS50eXBlKVxuICAgICAgICAgICAgICAgIDogZGZsdFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCAodmFsdWUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBTdG9yZSBvYmplY3RzL2FycmF5cyB0eXBlcyBhcyBhdHRyaWJ1dGVzIGFuZCBjYXN0IG9uIGBnZXRgXG4gICAgICAgICAgbGV0IHZhbFxuXG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIGtleSwge1xuICAgICAgICAgICAgZ2V0ICgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWwgPT09ICd1bmRlZmluZWQnID8gZGZsdCA6IHZhbFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCAodmFsdWUpIHtcbiAgICAgICAgICAgICAgY29uc3Qgb2xkID0gdmFsXG4gICAgICAgICAgICAgIHZhbCA9IGNvbnZlcnRWYWx1ZSh2YWx1ZSwgaXRlbS50eXBlKVxuICAgICAgICAgICAgICB0aGlzLnByb3BlcnR5Q2hhbmdlZENhbGxiYWNrKGtleSwgb2xkLCB2YWwpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgY2FjaGUudmFsaWRhdGUgPSB2YWxpZGF0ZVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV2ZW50IERlbGVnYXRpb25cbiAgICAgKi9cbiAgICBjb25zdCBkZWwgPSBkZWxlZ2F0b3IodGhpcylcbiAgICB0aGlzLm9uID0gZGVsLm9uLmJpbmQoZGVsKVxuICAgIHRoaXMub2ZmID0gZGVsLm9mZi5iaW5kKGRlbClcbiAgICBjYWNoZS5kZWxlZ2F0ZSA9IGRlbFxuXG4gICAgY2FjaGUuZXZlbnRzID0gb3B0aW9ucy5ldmVudHNcblxuICAgIHRoaXMuX19zdXBlcnZpZXdzID0gY2FjaGVcbiAgfVxuXG4gIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzICgpIHtcbiAgICBjb25zdCBwcm9wZXJ0aWVzID0gb3B0aW9ucy5zY2hlbWEgJiYgb3B0aW9ucy5zY2hlbWEucHJvcGVydGllc1xuXG4gICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgIHJldHVybiBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKVxuICAgICAgICAuZmlsdGVyKGtleSA9PiBpc1NpbXBsZShwcm9wZXJ0aWVzW2tleV0pKVxuICAgICAgICAubWFwKGtleSA9PiBrZXkudG9Mb3dlckNhc2UoKSlcbiAgICB9XG4gIH1cblxuICByZW5kZXJDYWxsYmFjayAoKSB7XG4gICAgY29uc29sZS5sb2coJ05vdCBpbXBsZW1lbnRlZCEnKVxuICB9XG5cbiAgcHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2sgKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgIC8vIFJlbmRlciBvbiBhbnkgY2hhbmdlIHRvIG9ic2VydmVkIHByb3BlcnRpZXNcbiAgICAvLyBUaGlzIGNhbiBiZSBvdmVycmlkZW4gaW4gYSBzdWJjbGFzcy5cbiAgICAvLyBUbyBjYWxsIHRoaXMgZnJvbSB0aGUgc3ViY2xhc3MgdXNlXG4gICAgLy8gc3VwZXIucHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKVxuICAgIHRoaXMucmVuZGVyKClcbiAgfVxuXG4gIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayAobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgLy8gUmVuZGVyIG9uIGFueSBjaGFuZ2UgdG8gb2JzZXJ2ZWQgYXR0cmlidXRlc1xuICAgIC8vIFRoaXMgY2FuIGJlIG92ZXJyaWRlbiBpbiBhIHN1YmNsYXNzLlxuICAgIC8vIFRvIGNhbGwgdGhpcyBmcm9tIHRoZSBzdWJjbGFzcyB1c2VcbiAgICAvLyBzdXBlci5wcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpXG4gICAgdGhpcy5yZW5kZXIoKVxuICB9XG5cbiAgcmVuZGVyIChpbW1lZGlhdGxleSkge1xuICAgIGlmIChpbW1lZGlhdGxleSkge1xuICAgICAgdGhpcy5yZW5kZXJDYWxsYmFjaygpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX19zdXBlcnZpZXdzLnJlbmRlcigpXG4gICAgfVxuICB9XG5cbiAgZW1pdCAobmFtZSwgZGV0YWlsKSB7XG4gICAgLy8gT25seSBlbWl0IHJlZ2lzdGVyZWQgZXZlbnRzXG4gICAgY29uc3QgZXZlbnRzID0gdGhpcy5fX3N1cGVydmlld3MuZXZlbnRzXG5cbiAgICBpZiAoIWV2ZW50cyB8fCAhKG5hbWUgaW4gZXZlbnRzKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGN1c3RvbSBldmVudFxuICAgIGNvbnN0IGV2ZW50ID0gbmV3IHdpbmRvdy5DdXN0b21FdmVudChuYW1lLCB7XG4gICAgICBkZXRhaWw6IGRldGFpbFxuICAgIH0pXG5cbiAgICAvLyBDYWxsIHRoZSBET00gTGV2ZWwgMSBoYW5kbGVyIGlmIG9uZSBleGlzdHNcbiAgICBpZiAodGhpc1snb24nICsgbmFtZV0pIHtcbiAgICAgIHRoaXNbJ29uJyArIG5hbWVdKGV2ZW50KVxuICAgIH1cblxuICAgIC8vIERpc3BhdGNoIHRoZSBldmVudFxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChldmVudClcbiAgfVxuXG4gIHZhbGlkYXRlICgpIHtcbiAgICAvLyBHZXQgdGhlIHNjaGVtYSBhbmQgdmFsaWRhdGUgZnVuY3Rpb25cbiAgICBjb25zdCBzY2hlbWEgPSBvcHRpb25zICYmIG9wdGlvbnMuc2NoZW1hXG4gICAgY29uc3QgdmFsaWRhdGUgPSB0aGlzLl9fc3VwZXJ2aWV3cy52YWxpZGF0ZVxuICAgIGlmIChzY2hlbWEgJiYgdmFsaWRhdGUpIHtcbiAgICAgIGNvbnN0IHByb3BzID0gc2NoZW1hLnByb3BlcnRpZXNcbiAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9wcylcblxuICAgICAgLy8gQnVpbGQgdGhlIGlucHV0IGRhdGFcbiAgICAgIGNvbnN0IGRhdGEgPSB7fVxuICAgICAga2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgZGF0YVtrZXldID0gdGhpc1trZXldXG4gICAgICB9KVxuXG4gICAgICAvLyBDYWxsIHRoZSB2YWxpZGF0b3JcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgICAgICAgb2s6IHZhbGlkYXRlKGRhdGEpXG4gICAgICB9XG5cbiAgICAgIC8vIEdldCB0aGUgZXJyb3JzIGlmIGluIGFuIGludmFsaWQgc3RhdGVcbiAgICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICAgIHJlc3VsdC5lcnJvcnMgPSB2YWxpZGF0ZS5lcnJvcnNcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBnZXQgc2NoZW1hICgpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5zY2hlbWFcbiAgfVxuXG4gIHN0YXRpYyBnZXQgZXZlbnRzICgpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5ldmVudHNcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cGVydmlld3NcblxuLy8gVE9ETzpcbi8vIFNLSVBcbi8vIEV4dGVuZCBvdGhlciBIVE1MIGVsZW1lbnRzIC0gXCJpc1wiLy8gVE9ETzpcbi8vIFNLSVBcbi8vIEVYVEVORCBIVE1MXG4vLyBObyBtb3JlIGNoZWNrZWQ9e2lzQ2hlY2tlZCA/ICdjaGVja2VkJzogbnVsbH0gPT4gY2hlY2tlZD17aXNDaGVja2VkfSBmb3IgYm9vbGVhbiBhdHRyaWJ1dGVzXG4vLyBTY29wZS90aGlzL2RhdGEvbW9kZWwgKHNwcmVhZD8pIGJldHdlZW4gdGhlIHZpZXcgYW5kIGN1c3RvbWVsZW1lbnQuXG4vLyBBbHNvIGV2ZW50IGhhbmRsZXJzIG5lZWQgc2hvdWxkIG5vdCBoYXZlIHRvIGJlIHJlZGVmaW5lZCBlYWNoIHBhdGNoXG4vLyAgIC0gSW4gZmFjdCwgZG9tIGxldmVsIDEgZXZlbnRzIHdpbGwgKmFsd2F5cyogYmUgcmVkZWZpbmVkIHdpdGggc3VwZXJ2aWV3cyBoYW5kbGVyIHdyYXBwZXIuIEZpeCB0aGlzLlxuLy8gc3RhdGUgZnJvbSBwcm9wcy4gbmVlZCB0byBrbm93IHdoZW4gYSBwcm9wZXJ0eSBjaGFuZ2VzICh0byBwb3NzaWJseSB1cGRhdGUgc3RhdGUpLiBvciBtYXJrIHByb3BlcnRpZXMgZS5nLlxuLy8gb3B0cyA9IHtcbi8vICAgc2NoZW1hOiB7XG4vLyAgICAgcHJvcGVydGllczoge1xuLy8gICAgICAgdG9kbzoge1xuLy8gICAgICAgICB0ZXh0OiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4vLyAgICAgICAgIGlzQ29tcGxldGVkOiB7IHR5cGU6ICdib29sZWFuJyB9XG4vLyAgICAgICB9XG4vLyAgICAgfSxcbi8vICAgICByZXF1aXJlZDogWydpZCcsICd0ZXh0J11cbi8vICAgfSxcbiAgICAgIC8vIG5vdyBtYXJrIGNlcnRhaW4gcHJvcGVydGllcyBhcyBzdG9yZXMgdGhhdCB3aGVuIHNldCwgd2lsbCBiZSBmcm96ZW5cbiAgICAgIC8vIE1heWJlIGZyZWV6ZSBldmVyeXRoaW5nP1xuLy8gICBzdG9yZXM6IFsndG9kbycsIC4uLl1cbi8vIH1cbi8vIEFsdGVybmF0aXZlbHksIGhhdmUgYSBvblByb3BlcnR5Q2hhbmdlZCBjYWxsYmFjay5cbi8vIE5lZWQgYSBzdHJhdGVneSBmb3IgaW50ZXJuYWwgc3RhdGUgb3IgcHJvcHNcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnZG9tLWRlbGVnYXRlJylcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudCcpXG4iLCJyZXF1aXJlKCcuLi8uLi8uLi9kcmUnKVxucmVxdWlyZSgnLi90b2RvcycpXG5cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIC8vIEdldCByZWZlcmVuY2UgdG8gdGhlIHRvZG8gZWxlbWVudFxuICBjb25zdCB0b2RvcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2RvcycpXG5cbiAgLy8gSW5pdGlhbGlzZSBzb21lIHRvZG9zXG4gIHRvZG9zLnRvZG9zID0gW3tcbiAgICBpZDogMSxcbiAgICB0ZXh0OiAnV2FsayBkb2cnXG4gIH0sIHtcbiAgICBpZDogMixcbiAgICB0ZXh0OiAnQnV5IG1pbGsnXG4gIH0sIHtcbiAgICBpZDogMyxcbiAgICB0ZXh0OiAnU2VuZCBiaXJ0aGRheSBjYXJkIHRvIExpeicsXG4gICAgaXNDb21wbGV0ZWQ6IHRydWVcbiAgfV1cbn1cbiIsInZhciBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpXG52YXIgcGF0Y2ggPSBJbmNyZW1lbnRhbERPTS5wYXRjaFxudmFyIGVsZW1lbnRPcGVuID0gSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5cbnZhciBlbGVtZW50Q2xvc2UgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Q2xvc2VcbnZhciBza2lwID0gSW5jcmVtZW50YWxET00uc2tpcFxudmFyIGN1cnJlbnRFbGVtZW50ID0gSW5jcmVtZW50YWxET00uY3VycmVudEVsZW1lbnRcbnZhciB0ZXh0ID0gSW5jcmVtZW50YWxET00udGV4dFxuXG52YXIgaG9pc3RlZDEgPSBbXCJzdHlsZVwiLCBcImJhY2tncm91bmQ6IHJlZDsgcGFkZGluZzogMTBweDtcIl1cbnZhciBob2lzdGVkMiA9IFtcInR5cGVcIiwgXCJ0ZXh0XCJdXG52YXIgaG9pc3RlZDMgPSBbXCJ0eXBlXCIsIFwiY2hlY2tib3hcIl1cbnZhciBob2lzdGVkNCA9IFtcImNsYXNzXCIsIFwidXBkYXRlXCJdXG52YXIgaG9pc3RlZDUgPSBbXCJjbGFzc1wiLCBcImVkaXRcIiwgXCJocmVmXCIsIFwiI1wiXVxudmFyIF9fdGFyZ2V0XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVzY3JpcHRpb24gKGVsLCBzdGF0ZSkge1xuY29uc3QgcmVzdWx0ID0gdGhpcy52YWxpZGF0ZSgpXG5pZiAoIXJlc3VsdC5vaykge1xuICBlbGVtZW50T3BlbihcImRpdlwiLCBcIjhjZjE4OTQ3LThkNDYtNDBiZC1iMTliLTY3NjcxMzk2MTQ0ZlwiLCBob2lzdGVkMSlcbiAgICBlbGVtZW50T3BlbihcInByZVwiKVxuICAgICAgdGV4dChcIlwiICsgKEpTT04uc3RyaW5naWZ5KHJlc3VsdC5lcnJvcnMsIG51bGwsIDIpKSArIFwiXCIpXG4gICAgZWxlbWVudENsb3NlKFwicHJlXCIpXG4gIGVsZW1lbnRDbG9zZShcImRpdlwiKVxufSBlbHNlIHtcbiAgZWxlbWVudE9wZW4oXCJkaXZcIilcbiAgICBpZiAoZWwubW9kZSA9PT0gJ2VkaXQnKSB7XG4gICAgICBlbGVtZW50T3BlbihcImlucHV0XCIsIFwiYTVkZWJmY2QtMzcwMS00MGU4LWFlZGYtOTFhMTg4MmUwNWFiXCIsIGhvaXN0ZWQyLCBcInZhbHVlXCIsIGVsLnRvZG8udGV4dCwgXCJvbmNoYW5nZVwiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICBlbC50b2RvLnNldCgndGV4dCcsIHRoaXMudmFsdWUpfSlcbiAgICAgIGVsZW1lbnRDbG9zZShcImlucHV0XCIpXG4gICAgICBlbGVtZW50T3BlbihcImlucHV0XCIsIFwiMTdjNjFmZTEtY2IwZS00NDM3LWJjMWYtMDhkMGVkYzFkY2RiXCIsIGhvaXN0ZWQzLCBcImNoZWNrZWRcIiwgZWwudG9kby5pc0NvbXBsZXRlZCwgXCJvbmNoYW5nZVwiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICBlbC50b2RvLnNldCgnaXNDb21wbGV0ZWQnLCB0aGlzLmNoZWNrZWQpfSlcbiAgICAgIGVsZW1lbnRDbG9zZShcImlucHV0XCIpXG4gICAgICBlbGVtZW50T3BlbihcImJ1dHRvblwiLCBcImM5NTNiYzlkLWYwZTQtNGIyNy04ZTEyLTIzYzVmZWQ1NWJmOFwiLCBob2lzdGVkNClcbiAgICAgICAgdGV4dChcIlVwZGF0ZVwiKVxuICAgICAgZWxlbWVudENsb3NlKFwiYnV0dG9uXCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghZWwubW9kZSkge1xuICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgbnVsbCwgXCJzdHlsZVwiLCBcInRleHQtZGVjb3JhdGlvbjogXCIgKyAoIGVsLnRvZG8uaXNDb21wbGV0ZWQgPyAnbGluZS10aHJvdWdoJyA6ICdub25lJykgKyBcIlwiKVxuICAgICAgICAgIHRleHQoXCJcIiArIChlbC50b2RvLnRleHQpICsgXCJcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgfVxuICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIFwiMTllMzg0ZDktMDMxMS00NjUxLWI4YTQtOTRlOWIyZmQzNDljXCIsIGhvaXN0ZWQ1KVxuICAgICAgICB0ZXh0KFwiRWRpdFwiKVxuICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgIH1cbiAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG59XG59XG4iLCJtb2R1bGUuZXhwb3J0cz17XG4gIFwidHlwZVwiOiBcIm9iamVjdFwiLFxuICBcInByb3BlcnRpZXNcIjoge1xuICAgIFwiaWRcIjogeyBcInR5cGVcIjogXCJpbnRlZ2VyXCIgfSxcbiAgICBcInRleHRcIjogeyBcInR5cGVcIjogXCJzdHJpbmdcIiB9LFxuICAgIFwiaXNDb21wbGV0ZWRcIjogeyBcInR5cGVcIjogXCJib29sZWFuXCIsIFwiZGVmYXVsdFwiOiBmYWxzZSB9XG4gIH0sXG4gIFwicmVxdWlyZWRcIjogW1wiaWRcIiwgXCJ0ZXh0XCJdXG59XG4iLCJjb25zdCBzdXBlcnZpZXdzID0gcmVxdWlyZSgnLi4vLi4vLi4vY2xpZW50JylcbmNvbnN0IHZpZXcgPSByZXF1aXJlKCcuL3RvZG8uaHRtbCcpXG5jb25zdCBwYXRjaCA9IHJlcXVpcmUoJy4uLy4uLy4uL2luY3JlbWVudGFsLWRvbScpLnBhdGNoXG5jb25zdCBzY2hlbWEgPSByZXF1aXJlKCcuL3RvZG8uanNvbicpXG5cbmNvbnN0IG9wdGlvbnMgPSB7XG4gIHNjaGVtYToge1xuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIHRvZG86IHNjaGVtYSxcbiAgICAgIG1vZGU6IHsgdHlwZTogJ3N0cmluZycsIGVudW06IFsnJywgJ2VkaXQnXSwgZGVmYXVsdDogJycgfVxuICAgIH1cbiAgfSxcbiAgZXZlbnRzOiB7XG4gICAgY2hhbmdlOiAnY2hhbmdlJ1xuICB9XG59XG5cbmNsYXNzIFRvZG8gZXh0ZW5kcyBzdXBlcnZpZXdzKG9wdGlvbnMpIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHN1cGVyKClcbiAgICB0aGlzXG4gICAgICAvLyAub24oJ2NoYW5nZScsICdpbnB1dFt0eXBlPXRleHRdJywgKGUpID0+IHtcbiAgICAgIC8vICAgdGhpcy50b2RvLnRleHQgPSBlLnRhcmdldC52YWx1ZS50cmltKClcbiAgICAgIC8vICAgdGhpcy5yZW5kZXIodHJ1ZSlcbiAgICAgIC8vIH0pXG4gICAgICAvLyAub24oJ2NoYW5nZScsICdpbnB1dFt0eXBlPWNoZWNrYm94XScsIChlKSA9PiB7XG4gICAgICAvLyAgIHRoaXMudG9kby5pc0NvbXBsZXRlZCA9IGUudGFyZ2V0LmNoZWNrZWRcbiAgICAgIC8vICAgdGhpcy5yZW5kZXIodHJ1ZSlcbiAgICAgIC8vIH0pXG4gICAgICAub24oJ2NsaWNrJywgJ2EuZWRpdCcsIChlKSA9PiB7XG4gICAgICAgIHRoaXMubW9kZSA9ICdlZGl0J1xuICAgICAgfSlcbiAgICAgIC5vbignY2xpY2snLCAnYnV0dG9uLnVwZGF0ZScsIChlKSA9PiB7XG4gICAgICAgIHRoaXMubW9kZSA9ICcnXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyQ2FsbGJhY2sgKCkge1xuICAgIHBhdGNoKHRoaXMsICgpID0+IHtcbiAgICAgIHZpZXcuY2FsbCh0aGlzLCB0aGlzLCB0aGlzLnN0YXRlKVxuICAgIH0pXG4gIH1cblxuICAvLyBnZXQgdG9kbyAoKSB7XG4gIC8vICAgcmV0dXJuIHRoaXMuc3RhdGUudG9kb1xuICAvLyB9XG5cbiAgLy8gc2V0IHRvZG8gKHZhbHVlKSB7XG4gIC8vICAgdGhpcy5zdGF0ZS5zZXQoJ3RvZG8nLCB2YWx1ZSlcbiAgLy8gfVxufVxuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCd4LXRvZG8nLCBUb2RvKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRvZG9cbiIsInZhciBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpXG52YXIgcGF0Y2ggPSBJbmNyZW1lbnRhbERPTS5wYXRjaFxudmFyIGVsZW1lbnRPcGVuID0gSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5cbnZhciBlbGVtZW50Q2xvc2UgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Q2xvc2VcbnZhciBza2lwID0gSW5jcmVtZW50YWxET00uc2tpcFxudmFyIGN1cnJlbnRFbGVtZW50ID0gSW5jcmVtZW50YWxET00uY3VycmVudEVsZW1lbnRcbnZhciB0ZXh0ID0gSW5jcmVtZW50YWxET00udGV4dFxuXG52YXIgaG9pc3RlZDEgPSBbXCJzdHlsZVwiLCBcImJhY2tncm91bmQ6IHJlZDsgcGFkZGluZzogMTBweDtcIl1cbnZhciBob2lzdGVkMiA9IFtcInR5cGVcIiwgXCJ0ZXh0XCJdXG52YXIgX190YXJnZXRcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZXNjcmlwdGlvbiAoZWwsIHN0YXRlKSB7XG5jb25zdCByZXN1bHQgPSB0aGlzLnZhbGlkYXRlKClcbmlmICghcmVzdWx0Lm9rKSB7XG4gIGVsZW1lbnRPcGVuKFwiZGl2XCIsIFwiODM4ODFiNmItMTEwNS00NGRmLThmZTMtZmQyOWJkNDRjNzY2XCIsIGhvaXN0ZWQxKVxuICAgIGVsZW1lbnRPcGVuKFwicHJlXCIpXG4gICAgICB0ZXh0KFwiXCIgKyAoSlNPTi5zdHJpbmdpZnkocmVzdWx0LmVycm9ycywgbnVsbCwgMikpICsgXCJcIilcbiAgICBlbGVtZW50Q2xvc2UoXCJwcmVcIilcbiAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG59IGVsc2Uge1xuICBsZXQgdG9kb3MgPSBzdGF0ZS50b2Rvc1xuICBpZiAoQXJyYXkuaXNBcnJheSh0b2RvcykgJiYgdG9kb3MubGVuZ3RoKSB7XG4gICAgbGV0IGNvbXBsZXRlZCA9IHRoaXMuZ2V0Q29tcGxldGVkKClcbiAgICBlbGVtZW50T3BlbihcInNlY3Rpb25cIilcbiAgICAgIF9fdGFyZ2V0ID0gdG9kb3NcbiAgICAgIGlmIChfX3RhcmdldCkge1xuICAgICAgICA7KF9fdGFyZ2V0LmZvckVhY2ggPyBfX3RhcmdldCA6IE9iamVjdC5rZXlzKF9fdGFyZ2V0KSkuZm9yRWFjaChmdW5jdGlvbigkdmFsdWUsICRpdGVtLCAkdGFyZ2V0KSB7XG4gICAgICAgICAgdmFyIHRvZG8gPSAkdmFsdWVcbiAgICAgICAgICB2YXIgJGtleSA9IFwiNDk3ODY1NjctNDM1My00NzAyLThmNTctNDI1MDIzMTM1Y2U0X1wiICsgdG9kby5pZFxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwieC10b2RvXCIsICRrZXksIG51bGwsIFwidG9kb1wiLCB0b2RvKVxuICAgICAgICAgICAgaWYgKHRydWUpIHtcbiAgICAgICAgICAgICAgc2tpcCgpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgfVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcIngtdG9kb1wiKVxuICAgICAgICB9LCB0aGlzKVxuICAgICAgfVxuICAgICAgZWxlbWVudE9wZW4oXCJmb290ZXJcIilcbiAgICAgICAgZWxlbWVudE9wZW4oXCJkbFwiKVxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiZHRcIilcbiAgICAgICAgICAgIHRleHQoXCJUb3RhbFwiKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcImR0XCIpXG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJkZFwiKVxuICAgICAgICAgICAgdGV4dChcIlwiICsgKHRvZG9zLmxlbmd0aCkgKyBcIlwiKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcImRkXCIpXG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJkdFwiKVxuICAgICAgICAgICAgdGV4dChcIlRvdGFsIGNvbXBsZXRlZFwiKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcImR0XCIpXG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJkZFwiKVxuICAgICAgICAgICAgdGV4dChcIlwiICsgKGNvbXBsZXRlZC5sZW5ndGgpICsgXCJcIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJkZFwiKVxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiZHRcIilcbiAgICAgICAgICAgIHRleHQoXCJSZW5kZXJlZFwiKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcImR0XCIpXG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJkZFwiKVxuICAgICAgICAgICAgdGV4dChcIlwiICsgKG5ldyBEYXRlKCkpICsgXCJcIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJkZFwiKVxuICAgICAgICBlbGVtZW50Q2xvc2UoXCJkbFwiKVxuICAgICAgICBlbGVtZW50T3BlbihcImJ1dHRvblwiLCBudWxsLCBudWxsLCBcImRpc2FibGVkXCIsIGNvbXBsZXRlZC5sZW5ndGggPyB1bmRlZmluZWQgOiAnZGlzYWJsZWQnLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICAgIGVsLmNsZWFyKCl9KVxuICAgICAgICAgIHRleHQoXCJDbGVhciBjb21wbGV0ZWRcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwiYnV0dG9uXCIpXG4gICAgICBlbGVtZW50Q2xvc2UoXCJmb290ZXJcIilcbiAgICBlbGVtZW50Q2xvc2UoXCJzZWN0aW9uXCIpXG4gIH0gZWxzZSB7XG4gICAgdGV4dChcIiBcXFxuICAgICAgICBObyBUb2RvcyBGb3VuZCBcXFxuICAgICAgXCIpXG4gIH1cbiAgZWxlbWVudE9wZW4oXCJmb3JtXCIsIG51bGwsIG51bGwsIFwib25zdWJtaXRcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gIGVsLmFkZFRvZG8oJGV2ZW50KX0pXG4gICAgZWxlbWVudE9wZW4oXCJpbnB1dFwiLCBcIjBmZjQ1ODJlLWUwNjUtNDQ4Ny05Y2VhLTQ4MGM5YzdmYWRjNFwiLCBob2lzdGVkMiwgXCJ2YWx1ZVwiLCBzdGF0ZS5uZXdUb2RvVGV4dCwgXCJvbmtleXVwXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgc3RhdGUuc2V0KCduZXdUb2RvVGV4dCcsIHRoaXMudmFsdWUudHJpbSgpKX0pXG4gICAgZWxlbWVudENsb3NlKFwiaW5wdXRcIilcbiAgICBlbGVtZW50T3BlbihcImJ1dHRvblwiLCBudWxsLCBudWxsLCBcImRpc2FibGVkXCIsIHN0YXRlLm5ld1RvZG9UZXh0ID8gdW5kZWZpbmVkIDogJ2Rpc2FibGVkJylcbiAgICAgIHRleHQoXCJBZGQgVG9kb1wiKVxuICAgIGVsZW1lbnRDbG9zZShcImJ1dHRvblwiKVxuICBlbGVtZW50Q2xvc2UoXCJmb3JtXCIpXG4gIGVsZW1lbnRPcGVuKFwiYnV0dG9uXCIsIG51bGwsIG51bGwsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgdG9kb3NbMF0uc2V0KCdpc0NvbXBsZXRlZCcsICF0b2Rvc1swXS5pc0NvbXBsZXRlZCl9KVxuICAgIHRleHQoXCJUb2dnbGUgY29tcGxldGVkIG9mIEl0ZW0gMVwiKVxuICBlbGVtZW50Q2xvc2UoXCJidXR0b25cIilcbiAgZWxlbWVudE9wZW4oXCJidXR0b25cIiwgbnVsbCwgbnVsbCwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICB0b2Rvc1swXS5zZXQoJ3RleHQnLCAnZm9vJyl9KVxuICAgIHRleHQoXCJTZXQgSXRlbSAxIG5hbWUgdG8gJ2ZvbydcIilcbiAgZWxlbWVudENsb3NlKFwiYnV0dG9uXCIpXG59XG59XG4iLCJjb25zdCBzdXBlcnZpZXdzID0gcmVxdWlyZSgnLi4vLi4vLi4vY2xpZW50JylcbmNvbnN0IHBhdGNoID0gcmVxdWlyZSgnLi4vLi4vLi4vaW5jcmVtZW50YWwtZG9tJykucGF0Y2hcbmNvbnN0IFN0b3JlID0gcmVxdWlyZSgnLi4vLi4vLi4vc3RvcmUnKVxuY29uc3QgdmlldyA9IHJlcXVpcmUoJy4vdG9kb3MuaHRtbCcpXG5jb25zdCBUb2RvID0gcmVxdWlyZSgnLi90b2RvJylcbmNvbnN0IFN5bWJvbHMgPSB7XG4gIFNUQVRFOiBTeW1ib2woJ3N0YXRlJylcbn1cblxuY29uc3Qgb3B0aW9ucyA9IHtcbiAgc2NoZW1hOiB7XG4gICAgcHJvcGVydGllczoge1xuICAgICAgdG9kb3M6IHsgdHlwZTogJ2FycmF5JywgaXRlbXM6IFRvZG8uc2NoZW1hLnByb3BlcnRpZXMudG9kbyB9XG4gICAgfSxcbiAgICByZXF1aXJlZDogWyd0b2RvcyddXG4gIH0sXG4gIGV2ZW50czoge1xuICAgIGNoYW5nZTogJ2NoYW5nZSdcbiAgfVxufVxuXG5jbGFzcyBUb2RvcyBleHRlbmRzIHN1cGVydmlld3Mob3B0aW9ucykge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKVxuXG4gICAgY29uc3Qgc3RvcmUgPSBuZXcgU3RvcmUoe1xuICAgICAgbmV3VG9kb1RleHQ6ICcnXG4gICAgfSlcblxuICAgIHN0b3JlLm9uKCd1cGRhdGUnLCAoY3VycmVudFN0YXRlLCBwcmV2U3RhdGUpID0+IHtcbiAgICAgIHRoaXMucmVuZGVyKClcbiAgICB9KVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFN5bWJvbHMuU1RBVEUsIHtcbiAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc3RvcmUuZ2V0KClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgdGhpcy5yZW5kZXIoKVxuICB9XG5cbiAgcHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2sgKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgIGlmIChuYW1lID09PSAndG9kb3MnKSB7XG4gICAgICBjb25zdCBzdGF0ZSA9IHRoaXNbU3ltYm9scy5TVEFURV1cbiAgICAgIHN0YXRlLnNldCgndG9kb3MnLCBuZXdWYWx1ZSlcbiAgICAgIC8vIHN1cGVyLnByb3BlcnR5Q2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSlcbiAgICB9XG4gIH1cblxuICByZW5kZXJDYWxsYmFjayAoKSB7XG4gICAgcGF0Y2godGhpcywgKCkgPT4ge1xuICAgICAgdmlldy5jYWxsKHRoaXMsIHRoaXMsIHRoaXNbU3ltYm9scy5TVEFURV0pXG4gICAgfSlcbiAgfVxuXG4gIGdldENvbXBsZXRlZCAoKSB7XG4gICAgcmV0dXJuIHRoaXNbU3ltYm9scy5TVEFURV0udG9kb3MuZmlsdGVyKHQgPT4gdC5pc0NvbXBsZXRlZClcbiAgfVxuXG4gIGFkZFRvZG8gKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXNbU3ltYm9scy5TVEFURV1cbiAgICBjb25zdCB0ZXh0ID0gc3RhdGUubmV3VG9kb1RleHRcblxuICAgIHN0YXRlLnNldCgnbmV3VG9kb1RleHQnLCAnJylcbiAgICBzdGF0ZS50b2Rvcy5wdXNoKHsgaWQ6IERhdGUubm93KCksIHRleHQ6IHRleHQgfSlcbiAgfVxuXG4gIGNsZWFyICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXNbU3ltYm9scy5TVEFURV1cbiAgICBzdGF0ZS5zZXQoJ3RvZG9zJywgc3RhdGUudG9kb3MuZmlsdGVyKGl0ZW0gPT4gIWl0ZW0uaXNDb21wbGV0ZWQpKVxuICB9XG59XG5cbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ3gtdG9kb3MnLCBUb2RvcylcblxubW9kdWxlLmV4cG9ydHMgPSBUb2Rvc1xuIiwiY29uc3QgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20nKVxuXG5JbmNyZW1lbnRhbERPTS5hdHRyaWJ1dGVzLmNoZWNrZWQgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIGVsLmNoZWNrZWQgPSAhIXZhbHVlXG59XG5cbkluY3JlbWVudGFsRE9NLmF0dHJpYnV0ZXMudmFsdWUgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIGVsLnZhbHVlID0gdmFsdWUgPT09IG51bGwgfHwgdHlwZW9mICh2YWx1ZSkgPT09ICd1bmRlZmluZWQnID8gJycgOiB2YWx1ZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEluY3JlbWVudGFsRE9NXG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwiLyohXG5cbkNvcHlyaWdodCAoQykgMjAxNC0yMDE2IGJ5IEFuZHJlYSBHaWFtbWFyY2hpIC0gQFdlYlJlZmxlY3Rpb25cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLlxuXG4qL1xuLy8gZ2xvYmFsIHdpbmRvdyBPYmplY3Rcbi8vIG9wdGlvbmFsIHBvbHlmaWxsIGluZm9cbi8vICAgICdhdXRvJyB1c2VkIGJ5IGRlZmF1bHQsIGV2ZXJ5dGhpbmcgaXMgZmVhdHVyZSBkZXRlY3RlZFxuLy8gICAgJ2ZvcmNlJyB1c2UgdGhlIHBvbHlmaWxsIGV2ZW4gaWYgbm90IGZ1bGx5IG5lZWRlZFxuZnVuY3Rpb24gaW5zdGFsbEN1c3RvbUVsZW1lbnRzKHdpbmRvdywgcG9seWZpbGwpIHsndXNlIHN0cmljdCc7XG5cbiAgLy8gRE8gTk9UIFVTRSBUSElTIEZJTEUgRElSRUNUTFksIElUIFdPTidUIFdPUktcbiAgLy8gVEhJUyBJUyBBIFBST0pFQ1QgQkFTRUQgT04gQSBCVUlMRCBTWVNURU1cbiAgLy8gVEhJUyBGSUxFIElTIEpVU1QgV1JBUFBFRCBVUCBSRVNVTFRJTkcgSU5cbiAgLy8gYnVpbGQvZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudC5ub2RlLmpzXG5cbiAgdmFyXG4gICAgZG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQsXG4gICAgT2JqZWN0ID0gd2luZG93Lk9iamVjdFxuICA7XG5cbiAgdmFyIGh0bWxDbGFzcyA9IChmdW5jdGlvbiAoaW5mbykge1xuICAgIC8vIChDKSBBbmRyZWEgR2lhbW1hcmNoaSAtIEBXZWJSZWZsZWN0aW9uIC0gTUlUIFN0eWxlXG4gICAgdmFyXG4gICAgICBjYXRjaENsYXNzID0gL15bQS1aXStbYS16XS8sXG4gICAgICBmaWx0ZXJCeSA9IGZ1bmN0aW9uIChyZSkge1xuICAgICAgICB2YXIgYXJyID0gW10sIHRhZztcbiAgICAgICAgZm9yICh0YWcgaW4gcmVnaXN0ZXIpIHtcbiAgICAgICAgICBpZiAocmUudGVzdCh0YWcpKSBhcnIucHVzaCh0YWcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgICB9LFxuICAgICAgYWRkID0gZnVuY3Rpb24gKENsYXNzLCB0YWcpIHtcbiAgICAgICAgdGFnID0gdGFnLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmICghKHRhZyBpbiByZWdpc3RlcikpIHtcbiAgICAgICAgICByZWdpc3RlcltDbGFzc10gPSAocmVnaXN0ZXJbQ2xhc3NdIHx8IFtdKS5jb25jYXQodGFnKTtcbiAgICAgICAgICByZWdpc3Rlclt0YWddID0gKHJlZ2lzdGVyW3RhZy50b1VwcGVyQ2FzZSgpXSA9IENsYXNzKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHJlZ2lzdGVyID0gKE9iamVjdC5jcmVhdGUgfHwgT2JqZWN0KShudWxsKSxcbiAgICAgIGh0bWxDbGFzcyA9IHt9LFxuICAgICAgaSwgc2VjdGlvbiwgdGFncywgQ2xhc3NcbiAgICA7XG4gICAgZm9yIChzZWN0aW9uIGluIGluZm8pIHtcbiAgICAgIGZvciAoQ2xhc3MgaW4gaW5mb1tzZWN0aW9uXSkge1xuICAgICAgICB0YWdzID0gaW5mb1tzZWN0aW9uXVtDbGFzc107XG4gICAgICAgIHJlZ2lzdGVyW0NsYXNzXSA9IHRhZ3M7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgcmVnaXN0ZXJbdGFnc1tpXS50b0xvd2VyQ2FzZSgpXSA9XG4gICAgICAgICAgcmVnaXN0ZXJbdGFnc1tpXS50b1VwcGVyQ2FzZSgpXSA9IENsYXNzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGh0bWxDbGFzcy5nZXQgPSBmdW5jdGlvbiBnZXQodGFnT3JDbGFzcykge1xuICAgICAgcmV0dXJuIHR5cGVvZiB0YWdPckNsYXNzID09PSAnc3RyaW5nJyA/XG4gICAgICAgIChyZWdpc3Rlclt0YWdPckNsYXNzXSB8fCAoY2F0Y2hDbGFzcy50ZXN0KHRhZ09yQ2xhc3MpID8gW10gOiAnJykpIDpcbiAgICAgICAgZmlsdGVyQnkodGFnT3JDbGFzcyk7XG4gICAgfTtcbiAgICBodG1sQ2xhc3Muc2V0ID0gZnVuY3Rpb24gc2V0KHRhZywgQ2xhc3MpIHtcbiAgICAgIHJldHVybiAoY2F0Y2hDbGFzcy50ZXN0KHRhZykgP1xuICAgICAgICBhZGQodGFnLCBDbGFzcykgOlxuICAgICAgICBhZGQoQ2xhc3MsIHRhZylcbiAgICAgICksIGh0bWxDbGFzcztcbiAgICB9O1xuICAgIHJldHVybiBodG1sQ2xhc3M7XG4gIH0oe1xuICAgIFwiY29sbGVjdGlvbnNcIjoge1xuICAgICAgXCJIVE1MQWxsQ29sbGVjdGlvblwiOiBbXG4gICAgICAgIFwiYWxsXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxDb2xsZWN0aW9uXCI6IFtcbiAgICAgICAgXCJmb3Jtc1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRm9ybUNvbnRyb2xzQ29sbGVjdGlvblwiOiBbXG4gICAgICAgIFwiZWxlbWVudHNcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE9wdGlvbnNDb2xsZWN0aW9uXCI6IFtcbiAgICAgICAgXCJvcHRpb25zXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIFwiZWxlbWVudHNcIjoge1xuICAgICAgXCJFbGVtZW50XCI6IFtcbiAgICAgICAgXCJlbGVtZW50XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxBbmNob3JFbGVtZW50XCI6IFtcbiAgICAgICAgXCJhXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxBcHBsZXRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJhcHBsZXRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEFyZWFFbGVtZW50XCI6IFtcbiAgICAgICAgXCJhcmVhXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxBdHRhY2htZW50RWxlbWVudFwiOiBbXG4gICAgICAgIFwiYXR0YWNobWVudFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQXVkaW9FbGVtZW50XCI6IFtcbiAgICAgICAgXCJhdWRpb1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQlJFbGVtZW50XCI6IFtcbiAgICAgICAgXCJiclwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQmFzZUVsZW1lbnRcIjogW1xuICAgICAgICBcImJhc2VcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEJvZHlFbGVtZW50XCI6IFtcbiAgICAgICAgXCJib2R5XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxCdXR0b25FbGVtZW50XCI6IFtcbiAgICAgICAgXCJidXR0b25cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTENhbnZhc0VsZW1lbnRcIjogW1xuICAgICAgICBcImNhbnZhc1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQ29udGVudEVsZW1lbnRcIjogW1xuICAgICAgICBcImNvbnRlbnRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTERMaXN0RWxlbWVudFwiOiBbXG4gICAgICAgIFwiZGxcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTERhdGFFbGVtZW50XCI6IFtcbiAgICAgICAgXCJkYXRhXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxEYXRhTGlzdEVsZW1lbnRcIjogW1xuICAgICAgICBcImRhdGFsaXN0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxEZXRhaWxzRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZGV0YWlsc1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRGlhbG9nRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZGlhbG9nXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxEaXJlY3RvcnlFbGVtZW50XCI6IFtcbiAgICAgICAgXCJkaXJcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTERpdkVsZW1lbnRcIjogW1xuICAgICAgICBcImRpdlwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRG9jdW1lbnRcIjogW1xuICAgICAgICBcImRvY3VtZW50XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxFbGVtZW50XCI6IFtcbiAgICAgICAgXCJlbGVtZW50XCIsXG4gICAgICAgIFwiYWJiclwiLFxuICAgICAgICBcImFkZHJlc3NcIixcbiAgICAgICAgXCJhcnRpY2xlXCIsXG4gICAgICAgIFwiYXNpZGVcIixcbiAgICAgICAgXCJiXCIsXG4gICAgICAgIFwiYmRpXCIsXG4gICAgICAgIFwiYmRvXCIsXG4gICAgICAgIFwiY2l0ZVwiLFxuICAgICAgICBcImNvZGVcIixcbiAgICAgICAgXCJjb21tYW5kXCIsXG4gICAgICAgIFwiZGRcIixcbiAgICAgICAgXCJkZm5cIixcbiAgICAgICAgXCJkdFwiLFxuICAgICAgICBcImVtXCIsXG4gICAgICAgIFwiZmlnY2FwdGlvblwiLFxuICAgICAgICBcImZpZ3VyZVwiLFxuICAgICAgICBcImZvb3RlclwiLFxuICAgICAgICBcImhlYWRlclwiLFxuICAgICAgICBcImlcIixcbiAgICAgICAgXCJrYmRcIixcbiAgICAgICAgXCJtYXJrXCIsXG4gICAgICAgIFwibmF2XCIsXG4gICAgICAgIFwibm9zY3JpcHRcIixcbiAgICAgICAgXCJycFwiLFxuICAgICAgICBcInJ0XCIsXG4gICAgICAgIFwicnVieVwiLFxuICAgICAgICBcInNcIixcbiAgICAgICAgXCJzYW1wXCIsXG4gICAgICAgIFwic2VjdGlvblwiLFxuICAgICAgICBcInNtYWxsXCIsXG4gICAgICAgIFwic3Ryb25nXCIsXG4gICAgICAgIFwic3ViXCIsXG4gICAgICAgIFwic3VtbWFyeVwiLFxuICAgICAgICBcInN1cFwiLFxuICAgICAgICBcInVcIixcbiAgICAgICAgXCJ2YXJcIixcbiAgICAgICAgXCJ3YnJcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEVtYmVkRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZW1iZWRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEZpZWxkU2V0RWxlbWVudFwiOiBbXG4gICAgICAgIFwiZmllbGRzZXRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEZvbnRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJmb250XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxGb3JtRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZm9ybVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRnJhbWVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJmcmFtZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRnJhbWVTZXRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJmcmFtZXNldFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MSFJFbGVtZW50XCI6IFtcbiAgICAgICAgXCJoclwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MSGVhZEVsZW1lbnRcIjogW1xuICAgICAgICBcImhlYWRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEhlYWRpbmdFbGVtZW50XCI6IFtcbiAgICAgICAgXCJoMVwiLFxuICAgICAgICBcImgyXCIsXG4gICAgICAgIFwiaDNcIixcbiAgICAgICAgXCJoNFwiLFxuICAgICAgICBcImg1XCIsXG4gICAgICAgIFwiaDZcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEh0bWxFbGVtZW50XCI6IFtcbiAgICAgICAgXCJodG1sXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxJRnJhbWVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJpZnJhbWVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEltYWdlRWxlbWVudFwiOiBbXG4gICAgICAgIFwiaW1nXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxJbnB1dEVsZW1lbnRcIjogW1xuICAgICAgICBcImlucHV0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxLZXlnZW5FbGVtZW50XCI6IFtcbiAgICAgICAgXCJrZXlnZW5cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTExJRWxlbWVudFwiOiBbXG4gICAgICAgIFwibGlcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTExhYmVsRWxlbWVudFwiOiBbXG4gICAgICAgIFwibGFiZWxcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTExlZ2VuZEVsZW1lbnRcIjogW1xuICAgICAgICBcImxlZ2VuZFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTGlua0VsZW1lbnRcIjogW1xuICAgICAgICBcImxpbmtcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE1hcEVsZW1lbnRcIjogW1xuICAgICAgICBcIm1hcFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTWFycXVlZUVsZW1lbnRcIjogW1xuICAgICAgICBcIm1hcnF1ZWVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE1lZGlhRWxlbWVudFwiOiBbXG4gICAgICAgIFwibWVkaWFcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE1lbnVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJtZW51XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxNZW51SXRlbUVsZW1lbnRcIjogW1xuICAgICAgICBcIm1lbnVpdGVtXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxNZXRhRWxlbWVudFwiOiBbXG4gICAgICAgIFwibWV0YVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTWV0ZXJFbGVtZW50XCI6IFtcbiAgICAgICAgXCJtZXRlclwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTW9kRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZGVsXCIsXG4gICAgICAgIFwiaW5zXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxPTGlzdEVsZW1lbnRcIjogW1xuICAgICAgICBcIm9sXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxPYmplY3RFbGVtZW50XCI6IFtcbiAgICAgICAgXCJvYmplY3RcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE9wdEdyb3VwRWxlbWVudFwiOiBbXG4gICAgICAgIFwib3B0Z3JvdXBcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE9wdGlvbkVsZW1lbnRcIjogW1xuICAgICAgICBcIm9wdGlvblwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MT3V0cHV0RWxlbWVudFwiOiBbXG4gICAgICAgIFwib3V0cHV0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxQYXJhZ3JhcGhFbGVtZW50XCI6IFtcbiAgICAgICAgXCJwXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxQYXJhbUVsZW1lbnRcIjogW1xuICAgICAgICBcInBhcmFtXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxQaWN0dXJlRWxlbWVudFwiOiBbXG4gICAgICAgIFwicGljdHVyZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MUHJlRWxlbWVudFwiOiBbXG4gICAgICAgIFwicHJlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxQcm9ncmVzc0VsZW1lbnRcIjogW1xuICAgICAgICBcInByb2dyZXNzXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxRdW90ZUVsZW1lbnRcIjogW1xuICAgICAgICBcImJsb2NrcXVvdGVcIixcbiAgICAgICAgXCJxXCIsXG4gICAgICAgIFwicXVvdGVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFNjcmlwdEVsZW1lbnRcIjogW1xuICAgICAgICBcInNjcmlwdFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MU2VsZWN0RWxlbWVudFwiOiBbXG4gICAgICAgIFwic2VsZWN0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxTaGFkb3dFbGVtZW50XCI6IFtcbiAgICAgICAgXCJzaGFkb3dcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFNsb3RFbGVtZW50XCI6IFtcbiAgICAgICAgXCJzbG90XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxTb3VyY2VFbGVtZW50XCI6IFtcbiAgICAgICAgXCJzb3VyY2VcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFNwYW5FbGVtZW50XCI6IFtcbiAgICAgICAgXCJzcGFuXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxTdHlsZUVsZW1lbnRcIjogW1xuICAgICAgICBcInN0eWxlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUYWJsZUNhcHRpb25FbGVtZW50XCI6IFtcbiAgICAgICAgXCJjYXB0aW9uXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUYWJsZUNlbGxFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0ZFwiLFxuICAgICAgICBcInRoXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUYWJsZUNvbEVsZW1lbnRcIjogW1xuICAgICAgICBcImNvbFwiLFxuICAgICAgICBcImNvbGdyb3VwXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUYWJsZUVsZW1lbnRcIjogW1xuICAgICAgICBcInRhYmxlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUYWJsZVJvd0VsZW1lbnRcIjogW1xuICAgICAgICBcInRyXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUYWJsZVNlY3Rpb25FbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0aGVhZFwiLFxuICAgICAgICBcInRib2R5XCIsXG4gICAgICAgIFwidGZvb3RcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFRlbXBsYXRlRWxlbWVudFwiOiBbXG4gICAgICAgIFwidGVtcGxhdGVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFRleHRBcmVhRWxlbWVudFwiOiBbXG4gICAgICAgIFwidGV4dGFyZWFcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFRpbWVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0aW1lXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUaXRsZUVsZW1lbnRcIjogW1xuICAgICAgICBcInRpdGxlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUcmFja0VsZW1lbnRcIjogW1xuICAgICAgICBcInRyYWNrXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxVTGlzdEVsZW1lbnRcIjogW1xuICAgICAgICBcInVsXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxVbmtub3duRWxlbWVudFwiOiBbXG4gICAgICAgIFwidW5rbm93blwiLFxuICAgICAgICBcInZoZ3JvdXB2XCIsXG4gICAgICAgIFwidmtleWdlblwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVmlkZW9FbGVtZW50XCI6IFtcbiAgICAgICAgXCJ2aWRlb1wiXG4gICAgICBdXG4gICAgfSxcbiAgICBcIm5vZGVzXCI6IHtcbiAgICAgIFwiQXR0clwiOiBbXG4gICAgICAgIFwibm9kZVwiXG4gICAgICBdLFxuICAgICAgXCJBdWRpb1wiOiBbXG4gICAgICAgIFwiYXVkaW9cIlxuICAgICAgXSxcbiAgICAgIFwiQ0RBVEFTZWN0aW9uXCI6IFtcbiAgICAgICAgXCJub2RlXCJcbiAgICAgIF0sXG4gICAgICBcIkNoYXJhY3RlckRhdGFcIjogW1xuICAgICAgICBcIm5vZGVcIlxuICAgICAgXSxcbiAgICAgIFwiQ29tbWVudFwiOiBbXG4gICAgICAgIFwiI2NvbW1lbnRcIlxuICAgICAgXSxcbiAgICAgIFwiRG9jdW1lbnRcIjogW1xuICAgICAgICBcIiNkb2N1bWVudFwiXG4gICAgICBdLFxuICAgICAgXCJEb2N1bWVudEZyYWdtZW50XCI6IFtcbiAgICAgICAgXCIjZG9jdW1lbnQtZnJhZ21lbnRcIlxuICAgICAgXSxcbiAgICAgIFwiRG9jdW1lbnRUeXBlXCI6IFtcbiAgICAgICAgXCJub2RlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxEb2N1bWVudFwiOiBbXG4gICAgICAgIFwiI2RvY3VtZW50XCJcbiAgICAgIF0sXG4gICAgICBcIkltYWdlXCI6IFtcbiAgICAgICAgXCJpbWdcIlxuICAgICAgXSxcbiAgICAgIFwiT3B0aW9uXCI6IFtcbiAgICAgICAgXCJvcHRpb25cIlxuICAgICAgXSxcbiAgICAgIFwiUHJvY2Vzc2luZ0luc3RydWN0aW9uXCI6IFtcbiAgICAgICAgXCJub2RlXCJcbiAgICAgIF0sXG4gICAgICBcIlNoYWRvd1Jvb3RcIjogW1xuICAgICAgICBcIiNzaGFkb3ctcm9vdFwiXG4gICAgICBdLFxuICAgICAgXCJUZXh0XCI6IFtcbiAgICAgICAgXCIjdGV4dFwiXG4gICAgICBdLFxuICAgICAgXCJYTUxEb2N1bWVudFwiOiBbXG4gICAgICAgIFwieG1sXCJcbiAgICAgIF1cbiAgICB9XG4gIH0pKTtcbiAgXG4gIFxuICAgIFxuICAvLyBwYXNzZWQgYXQgcnVudGltZSwgY29uZmlndXJhYmxlXG4gIC8vIHZpYSBub2RlanMgbW9kdWxlXG4gIGlmICghcG9seWZpbGwpIHBvbHlmaWxsID0gJ2F1dG8nO1xuICBcbiAgdmFyXG4gICAgLy8gVjAgcG9seWZpbGwgZW50cnlcbiAgICBSRUdJU1RFUl9FTEVNRU5UID0gJ3JlZ2lzdGVyRWxlbWVudCcsXG4gIFxuICAgIC8vIElFIDwgMTEgb25seSArIG9sZCBXZWJLaXQgZm9yIGF0dHJpYnV0ZXMgKyBmZWF0dXJlIGRldGVjdGlvblxuICAgIEVYUEFORE9fVUlEID0gJ19fJyArIFJFR0lTVEVSX0VMRU1FTlQgKyAod2luZG93Lk1hdGgucmFuZG9tKCkgKiAxMGU0ID4+IDApLFxuICBcbiAgICAvLyBzaG9ydGN1dHMgYW5kIGNvc3RhbnRzXG4gICAgQUREX0VWRU5UX0xJU1RFTkVSID0gJ2FkZEV2ZW50TGlzdGVuZXInLFxuICAgIEFUVEFDSEVEID0gJ2F0dGFjaGVkJyxcbiAgICBDQUxMQkFDSyA9ICdDYWxsYmFjaycsXG4gICAgREVUQUNIRUQgPSAnZGV0YWNoZWQnLFxuICAgIEVYVEVORFMgPSAnZXh0ZW5kcycsXG4gIFxuICAgIEFUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLID0gJ2F0dHJpYnV0ZUNoYW5nZWQnICsgQ0FMTEJBQ0ssXG4gICAgQVRUQUNIRURfQ0FMTEJBQ0sgPSBBVFRBQ0hFRCArIENBTExCQUNLLFxuICAgIENPTk5FQ1RFRF9DQUxMQkFDSyA9ICdjb25uZWN0ZWQnICsgQ0FMTEJBQ0ssXG4gICAgRElTQ09OTkVDVEVEX0NBTExCQUNLID0gJ2Rpc2Nvbm5lY3RlZCcgKyBDQUxMQkFDSyxcbiAgICBDUkVBVEVEX0NBTExCQUNLID0gJ2NyZWF0ZWQnICsgQ0FMTEJBQ0ssXG4gICAgREVUQUNIRURfQ0FMTEJBQ0sgPSBERVRBQ0hFRCArIENBTExCQUNLLFxuICBcbiAgICBBRERJVElPTiA9ICdBRERJVElPTicsXG4gICAgTU9ESUZJQ0FUSU9OID0gJ01PRElGSUNBVElPTicsXG4gICAgUkVNT1ZBTCA9ICdSRU1PVkFMJyxcbiAgXG4gICAgRE9NX0FUVFJfTU9ESUZJRUQgPSAnRE9NQXR0ck1vZGlmaWVkJyxcbiAgICBET01fQ09OVEVOVF9MT0FERUQgPSAnRE9NQ29udGVudExvYWRlZCcsXG4gICAgRE9NX1NVQlRSRUVfTU9ESUZJRUQgPSAnRE9NU3VidHJlZU1vZGlmaWVkJyxcbiAgXG4gICAgUFJFRklYX1RBRyA9ICc8JyxcbiAgICBQUkVGSVhfSVMgPSAnPScsXG4gIFxuICAgIC8vIHZhbGlkIGFuZCBpbnZhbGlkIG5vZGUgbmFtZXNcbiAgICB2YWxpZE5hbWUgPSAvXltBLVpdW0EtWjAtOV0qKD86LVtBLVowLTldKykrJC8sXG4gICAgaW52YWxpZE5hbWVzID0gW1xuICAgICAgJ0FOTk9UQVRJT04tWE1MJyxcbiAgICAgICdDT0xPUi1QUk9GSUxFJyxcbiAgICAgICdGT05ULUZBQ0UnLFxuICAgICAgJ0ZPTlQtRkFDRS1TUkMnLFxuICAgICAgJ0ZPTlQtRkFDRS1VUkknLFxuICAgICAgJ0ZPTlQtRkFDRS1GT1JNQVQnLFxuICAgICAgJ0ZPTlQtRkFDRS1OQU1FJyxcbiAgICAgICdNSVNTSU5HLUdMWVBIJ1xuICAgIF0sXG4gIFxuICAgIC8vIHJlZ2lzdGVyZWQgdHlwZXMgYW5kIHRoZWlyIHByb3RvdHlwZXNcbiAgICB0eXBlcyA9IFtdLFxuICAgIHByb3RvcyA9IFtdLFxuICBcbiAgICAvLyB0byBxdWVyeSBzdWJub2Rlc1xuICAgIHF1ZXJ5ID0gJycsXG4gIFxuICAgIC8vIGh0bWwgc2hvcnRjdXQgdXNlZCB0byBmZWF0dXJlIGRldGVjdFxuICAgIGRvY3VtZW50RWxlbWVudCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgXG4gICAgLy8gRVM1IGlubGluZSBoZWxwZXJzIHx8IGJhc2ljIHBhdGNoZXNcbiAgICBpbmRleE9mID0gdHlwZXMuaW5kZXhPZiB8fCBmdW5jdGlvbiAodikge1xuICAgICAgZm9yKHZhciBpID0gdGhpcy5sZW5ndGg7IGktLSAmJiB0aGlzW2ldICE9PSB2Oyl7fVxuICAgICAgcmV0dXJuIGk7XG4gICAgfSxcbiAgXG4gICAgLy8gb3RoZXIgaGVscGVycyAvIHNob3J0Y3V0c1xuICAgIE9QID0gT2JqZWN0LnByb3RvdHlwZSxcbiAgICBoT1AgPSBPUC5oYXNPd25Qcm9wZXJ0eSxcbiAgICBpUE8gPSBPUC5pc1Byb3RvdHlwZU9mLFxuICBcbiAgICBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSxcbiAgICBlbXB0eSA9IFtdLFxuICAgIGdPUEQgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLFxuICAgIGdPUE4gPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyxcbiAgICBnUE8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YsXG4gICAgc1BPID0gT2JqZWN0LnNldFByb3RvdHlwZU9mLFxuICBcbiAgICAvLyBqc2hpbnQgcHJvdG86IHRydWVcbiAgICBoYXNQcm90byA9ICEhT2JqZWN0Ll9fcHJvdG9fXyxcbiAgXG4gICAgLy8gVjEgaGVscGVyc1xuICAgIGZpeEdldENsYXNzID0gZmFsc2UsXG4gICAgRFJFQ0VWMSA9ICdfX2RyZUNFdjEnLFxuICAgIGN1c3RvbUVsZW1lbnRzID0gd2luZG93LmN1c3RvbUVsZW1lbnRzLFxuICAgIHVzYWJsZUN1c3RvbUVsZW1lbnRzID0gcG9seWZpbGwgIT09ICdmb3JjZScgJiYgISEoXG4gICAgICBjdXN0b21FbGVtZW50cyAmJlxuICAgICAgY3VzdG9tRWxlbWVudHMuZGVmaW5lICYmXG4gICAgICBjdXN0b21FbGVtZW50cy5nZXQgJiZcbiAgICAgIGN1c3RvbUVsZW1lbnRzLndoZW5EZWZpbmVkXG4gICAgKSxcbiAgICBEaWN0ID0gT2JqZWN0LmNyZWF0ZSB8fCBPYmplY3QsXG4gICAgTWFwID0gd2luZG93Lk1hcCB8fCBmdW5jdGlvbiBNYXAoKSB7XG4gICAgICB2YXIgSyA9IFtdLCBWID0gW10sIGk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgcmV0dXJuIFZbaW5kZXhPZi5jYWxsKEssIGspXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoaywgdikge1xuICAgICAgICAgIGkgPSBpbmRleE9mLmNhbGwoSywgayk7XG4gICAgICAgICAgaWYgKGkgPCAwKSBWW0sucHVzaChrKSAtIDFdID0gdjtcbiAgICAgICAgICBlbHNlIFZbaV0gPSB2O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG4gICAgUHJvbWlzZSA9IHdpbmRvdy5Qcm9taXNlIHx8IGZ1bmN0aW9uIChmbikge1xuICAgICAgdmFyXG4gICAgICAgIG5vdGlmeSA9IFtdLFxuICAgICAgICBkb25lID0gZmFsc2UsXG4gICAgICAgIHAgPSB7XG4gICAgICAgICAgJ2NhdGNoJzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAndGhlbic6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgbm90aWZ5LnB1c2goY2IpO1xuICAgICAgICAgICAgaWYgKGRvbmUpIHNldFRpbWVvdXQocmVzb2x2ZSwgMSk7XG4gICAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIDtcbiAgICAgIGZ1bmN0aW9uIHJlc29sdmUodmFsdWUpIHtcbiAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgIHdoaWxlIChub3RpZnkubGVuZ3RoKSBub3RpZnkuc2hpZnQoKSh2YWx1ZSk7XG4gICAgICB9XG4gICAgICBmbihyZXNvbHZlKTtcbiAgICAgIHJldHVybiBwO1xuICAgIH0sXG4gICAganVzdENyZWF0ZWQgPSBmYWxzZSxcbiAgICBjb25zdHJ1Y3RvcnMgPSBEaWN0KG51bGwpLFxuICAgIHdhaXRpbmdMaXN0ID0gRGljdChudWxsKSxcbiAgICBub2RlTmFtZXMgPSBuZXcgTWFwKCksXG4gICAgc2Vjb25kQXJndW1lbnQgPSBTdHJpbmcsXG4gIFxuICAgIC8vIHVzZWQgdG8gY3JlYXRlIHVuaXF1ZSBpbnN0YW5jZXNcbiAgICBjcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uIEJyaWRnZShwcm90bykge1xuICAgICAgLy8gc2lsbHkgYnJva2VuIHBvbHlmaWxsIHByb2JhYmx5IGV2ZXIgdXNlZCBidXQgc2hvcnQgZW5vdWdoIHRvIHdvcmtcbiAgICAgIHJldHVybiBwcm90byA/ICgoQnJpZGdlLnByb3RvdHlwZSA9IHByb3RvKSwgbmV3IEJyaWRnZSgpKSA6IHRoaXM7XG4gICAgfSxcbiAgXG4gICAgLy8gd2lsbCBzZXQgdGhlIHByb3RvdHlwZSBpZiBwb3NzaWJsZVxuICAgIC8vIG9yIGNvcHkgb3ZlciBhbGwgcHJvcGVydGllc1xuICAgIHNldFByb3RvdHlwZSA9IHNQTyB8fCAoXG4gICAgICBoYXNQcm90byA/XG4gICAgICAgIGZ1bmN0aW9uIChvLCBwKSB7XG4gICAgICAgICAgby5fX3Byb3RvX18gPSBwO1xuICAgICAgICAgIHJldHVybiBvO1xuICAgICAgICB9IDogKFxuICAgICAgKGdPUE4gJiYgZ09QRCkgP1xuICAgICAgICAoZnVuY3Rpb24oKXtcbiAgICAgICAgICBmdW5jdGlvbiBzZXRQcm9wZXJ0aWVzKG8sIHApIHtcbiAgICAgICAgICAgIGZvciAodmFyXG4gICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgbmFtZXMgPSBnT1BOKHApLFxuICAgICAgICAgICAgICBpID0gMCwgbGVuZ3RoID0gbmFtZXMubGVuZ3RoO1xuICAgICAgICAgICAgICBpIDwgbGVuZ3RoOyBpKytcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBrZXkgPSBuYW1lc1tpXTtcbiAgICAgICAgICAgICAgaWYgKCFoT1AuY2FsbChvLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkobywga2V5LCBnT1BEKHAsIGtleSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAobywgcCkge1xuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICBzZXRQcm9wZXJ0aWVzKG8sIHApO1xuICAgICAgICAgICAgfSB3aGlsZSAoKHAgPSBnUE8ocCkpICYmICFpUE8uY2FsbChwLCBvKSk7XG4gICAgICAgICAgICByZXR1cm4gbztcbiAgICAgICAgICB9O1xuICAgICAgICB9KCkpIDpcbiAgICAgICAgZnVuY3Rpb24gKG8sIHApIHtcbiAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gcCkge1xuICAgICAgICAgICAgb1trZXldID0gcFtrZXldO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbztcbiAgICAgICAgfVxuICAgICkpLFxuICBcbiAgICAvLyBET00gc2hvcnRjdXRzIGFuZCBoZWxwZXJzLCBpZiBhbnlcbiAgXG4gICAgTXV0YXRpb25PYnNlcnZlciA9IHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5XZWJLaXRNdXRhdGlvbk9ic2VydmVyLFxuICBcbiAgICBIVE1MRWxlbWVudFByb3RvdHlwZSA9IChcbiAgICAgIHdpbmRvdy5IVE1MRWxlbWVudCB8fFxuICAgICAgd2luZG93LkVsZW1lbnQgfHxcbiAgICAgIHdpbmRvdy5Ob2RlXG4gICAgKS5wcm90b3R5cGUsXG4gIFxuICAgIElFOCA9ICFpUE8uY2FsbChIVE1MRWxlbWVudFByb3RvdHlwZSwgZG9jdW1lbnRFbGVtZW50KSxcbiAgXG4gICAgc2FmZVByb3BlcnR5ID0gSUU4ID8gZnVuY3Rpb24gKG8sIGssIGQpIHtcbiAgICAgIG9ba10gPSBkLnZhbHVlO1xuICAgICAgcmV0dXJuIG87XG4gICAgfSA6IGRlZmluZVByb3BlcnR5LFxuICBcbiAgICBpc1ZhbGlkTm9kZSA9IElFOCA/XG4gICAgICBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMTtcbiAgICAgIH0gOlxuICAgICAgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGlQTy5jYWxsKEhUTUxFbGVtZW50UHJvdG90eXBlLCBub2RlKTtcbiAgICAgIH0sXG4gIFxuICAgIHRhcmdldHMgPSBJRTggJiYgW10sXG4gIFxuICAgIGF0dGFjaFNoYWRvdyA9IEhUTUxFbGVtZW50UHJvdG90eXBlLmF0dGFjaFNoYWRvdyxcbiAgICBjbG9uZU5vZGUgPSBIVE1MRWxlbWVudFByb3RvdHlwZS5jbG9uZU5vZGUsXG4gICAgZGlzcGF0Y2hFdmVudCA9IEhUTUxFbGVtZW50UHJvdG90eXBlLmRpc3BhdGNoRXZlbnQsXG4gICAgZ2V0QXR0cmlidXRlID0gSFRNTEVsZW1lbnRQcm90b3R5cGUuZ2V0QXR0cmlidXRlLFxuICAgIGhhc0F0dHJpYnV0ZSA9IEhUTUxFbGVtZW50UHJvdG90eXBlLmhhc0F0dHJpYnV0ZSxcbiAgICByZW1vdmVBdHRyaWJ1dGUgPSBIVE1MRWxlbWVudFByb3RvdHlwZS5yZW1vdmVBdHRyaWJ1dGUsXG4gICAgc2V0QXR0cmlidXRlID0gSFRNTEVsZW1lbnRQcm90b3R5cGUuc2V0QXR0cmlidXRlLFxuICBcbiAgICAvLyByZXBsYWNlZCBsYXRlciBvblxuICAgIGNyZWF0ZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50LFxuICAgIHBhdGNoZWRDcmVhdGVFbGVtZW50ID0gY3JlYXRlRWxlbWVudCxcbiAgXG4gICAgLy8gc2hhcmVkIG9ic2VydmVyIGZvciBhbGwgYXR0cmlidXRlc1xuICAgIGF0dHJpYnV0ZXNPYnNlcnZlciA9IE11dGF0aW9uT2JzZXJ2ZXIgJiYge1xuICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgIGNoYXJhY3RlckRhdGE6IHRydWUsXG4gICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogdHJ1ZVxuICAgIH0sXG4gIFxuICAgIC8vIHVzZWZ1bCB0byBkZXRlY3Qgb25seSBpZiB0aGVyZSdzIG5vIE11dGF0aW9uT2JzZXJ2ZXJcbiAgICBET01BdHRyTW9kaWZpZWQgPSBNdXRhdGlvbk9ic2VydmVyIHx8IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGRvZXNOb3RTdXBwb3J0RE9NQXR0ck1vZGlmaWVkID0gZmFsc2U7XG4gICAgICBkb2N1bWVudEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgRE9NX0FUVFJfTU9ESUZJRUQsXG4gICAgICAgIERPTUF0dHJNb2RpZmllZFxuICAgICAgKTtcbiAgICB9LFxuICBcbiAgICAvLyB3aWxsIGJvdGggYmUgdXNlZCB0byBtYWtlIERPTU5vZGVJbnNlcnRlZCBhc3luY2hyb25vdXNcbiAgICBhc2FwUXVldWUsXG4gICAgYXNhcFRpbWVyID0gMCxcbiAgXG4gICAgLy8gaW50ZXJuYWwgZmxhZ3NcbiAgICBzZXRMaXN0ZW5lciA9IGZhbHNlLFxuICAgIGRvZXNOb3RTdXBwb3J0RE9NQXR0ck1vZGlmaWVkID0gdHJ1ZSxcbiAgICBkcm9wRG9tQ29udGVudExvYWRlZCA9IHRydWUsXG4gIFxuICAgIC8vIG5lZWRlZCBmb3IgdGhlIGlubmVySFRNTCBoZWxwZXJcbiAgICBub3RGcm9tSW5uZXJIVE1MSGVscGVyID0gdHJ1ZSxcbiAgXG4gICAgLy8gb3B0aW9uYWxseSBkZWZpbmVkIGxhdGVyIG9uXG4gICAgb25TdWJ0cmVlTW9kaWZpZWQsXG4gICAgY2FsbERPTUF0dHJNb2RpZmllZCxcbiAgICBnZXRBdHRyaWJ1dGVzTWlycm9yLFxuICAgIG9ic2VydmVyLFxuICAgIG9ic2VydmUsXG4gIFxuICAgIC8vIGJhc2VkIG9uIHNldHRpbmcgcHJvdG90eXBlIGNhcGFiaWxpdHlcbiAgICAvLyB3aWxsIGNoZWNrIHByb3RvIG9yIHRoZSBleHBhbmRvIGF0dHJpYnV0ZVxuICAgIC8vIGluIG9yZGVyIHRvIHNldHVwIHRoZSBub2RlIG9uY2VcbiAgICBwYXRjaElmTm90QWxyZWFkeSxcbiAgICBwYXRjaFxuICA7XG4gIFxuICAvLyBvbmx5IGlmIG5lZWRlZFxuICBpZiAoIShSRUdJU1RFUl9FTEVNRU5UIGluIGRvY3VtZW50KSkge1xuICBcbiAgICBpZiAoc1BPIHx8IGhhc1Byb3RvKSB7XG4gICAgICAgIHBhdGNoSWZOb3RBbHJlYWR5ID0gZnVuY3Rpb24gKG5vZGUsIHByb3RvKSB7XG4gICAgICAgICAgaWYgKCFpUE8uY2FsbChwcm90bywgbm9kZSkpIHtcbiAgICAgICAgICAgIHNldHVwTm9kZShub2RlLCBwcm90byk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBwYXRjaCA9IHNldHVwTm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXRjaElmTm90QWxyZWFkeSA9IGZ1bmN0aW9uIChub2RlLCBwcm90bykge1xuICAgICAgICAgIGlmICghbm9kZVtFWFBBTkRPX1VJRF0pIHtcbiAgICAgICAgICAgIG5vZGVbRVhQQU5ET19VSURdID0gT2JqZWN0KHRydWUpO1xuICAgICAgICAgICAgc2V0dXBOb2RlKG5vZGUsIHByb3RvKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHBhdGNoID0gcGF0Y2hJZk5vdEFscmVhZHk7XG4gICAgfVxuICBcbiAgICBpZiAoSUU4KSB7XG4gICAgICBkb2VzTm90U3VwcG9ydERPTUF0dHJNb2RpZmllZCA9IGZhbHNlO1xuICAgICAgKGZ1bmN0aW9uICgpe1xuICAgICAgICB2YXJcbiAgICAgICAgICBkZXNjcmlwdG9yID0gZ09QRChIVE1MRWxlbWVudFByb3RvdHlwZSwgQUREX0VWRU5UX0xJU1RFTkVSKSxcbiAgICAgICAgICBhZGRFdmVudExpc3RlbmVyID0gZGVzY3JpcHRvci52YWx1ZSxcbiAgICAgICAgICBwYXRjaGVkUmVtb3ZlQXR0cmlidXRlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHZhciBlID0gbmV3IEN1c3RvbUV2ZW50KERPTV9BVFRSX01PRElGSUVELCB7YnViYmxlczogdHJ1ZX0pO1xuICAgICAgICAgICAgZS5hdHRyTmFtZSA9IG5hbWU7XG4gICAgICAgICAgICBlLnByZXZWYWx1ZSA9IGdldEF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUpO1xuICAgICAgICAgICAgZS5uZXdWYWx1ZSA9IG51bGw7XG4gICAgICAgICAgICBlW1JFTU9WQUxdID0gZS5hdHRyQ2hhbmdlID0gMjtcbiAgICAgICAgICAgIHJlbW92ZUF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUpO1xuICAgICAgICAgICAgZGlzcGF0Y2hFdmVudC5jYWxsKHRoaXMsIGUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcGF0Y2hlZFNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgIGhhZCA9IGhhc0F0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUpLFxuICAgICAgICAgICAgICBvbGQgPSBoYWQgJiYgZ2V0QXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSksXG4gICAgICAgICAgICAgIGUgPSBuZXcgQ3VzdG9tRXZlbnQoRE9NX0FUVFJfTU9ESUZJRUQsIHtidWJibGVzOiB0cnVlfSlcbiAgICAgICAgICAgIDtcbiAgICAgICAgICAgIHNldEF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICAgIGUuYXR0ck5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgZS5wcmV2VmFsdWUgPSBoYWQgPyBvbGQgOiBudWxsO1xuICAgICAgICAgICAgZS5uZXdWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgaWYgKGhhZCkge1xuICAgICAgICAgICAgICBlW01PRElGSUNBVElPTl0gPSBlLmF0dHJDaGFuZ2UgPSAxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZVtBRERJVElPTl0gPSBlLmF0dHJDaGFuZ2UgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlzcGF0Y2hFdmVudC5jYWxsKHRoaXMsIGUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Qcm9wZXJ0eUNoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyBqc2hpbnQgZXFudWxsOnRydWVcbiAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICBub2RlID0gZS5jdXJyZW50VGFyZ2V0LFxuICAgICAgICAgICAgICBzdXBlclNlY3JldCA9IG5vZGVbRVhQQU5ET19VSURdLFxuICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBlLnByb3BlcnR5TmFtZSxcbiAgICAgICAgICAgICAgZXZlbnRcbiAgICAgICAgICAgIDtcbiAgICAgICAgICAgIGlmIChzdXBlclNlY3JldC5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eU5hbWUpKSB7XG4gICAgICAgICAgICAgIHN1cGVyU2VjcmV0ID0gc3VwZXJTZWNyZXRbcHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgICAgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoRE9NX0FUVFJfTU9ESUZJRUQsIHtidWJibGVzOiB0cnVlfSk7XG4gICAgICAgICAgICAgIGV2ZW50LmF0dHJOYW1lID0gc3VwZXJTZWNyZXQubmFtZTtcbiAgICAgICAgICAgICAgZXZlbnQucHJldlZhbHVlID0gc3VwZXJTZWNyZXQudmFsdWUgfHwgbnVsbDtcbiAgICAgICAgICAgICAgZXZlbnQubmV3VmFsdWUgPSAoc3VwZXJTZWNyZXQudmFsdWUgPSBub2RlW3Byb3BlcnR5TmFtZV0gfHwgbnVsbCk7XG4gICAgICAgICAgICAgIGlmIChldmVudC5wcmV2VmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGV2ZW50W0FERElUSU9OXSA9IGV2ZW50LmF0dHJDaGFuZ2UgPSAwO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV2ZW50W01PRElGSUNBVElPTl0gPSBldmVudC5hdHRyQ2hhbmdlID0gMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBkaXNwYXRjaEV2ZW50LmNhbGwobm9kZSwgZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgO1xuICAgICAgICBkZXNjcmlwdG9yLnZhbHVlID0gZnVuY3Rpb24gKHR5cGUsIGhhbmRsZXIsIGNhcHR1cmUpIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlID09PSBET01fQVRUUl9NT0RJRklFRCAmJlxuICAgICAgICAgICAgdGhpc1tBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDS10gJiZcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlICE9PSBwYXRjaGVkU2V0QXR0cmlidXRlXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzW0VYUEFORE9fVUlEXSA9IHtcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2NsYXNzJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5jbGFzc05hbWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlID0gcGF0Y2hlZFNldEF0dHJpYnV0ZTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlID0gcGF0Y2hlZFJlbW92ZUF0dHJpYnV0ZTtcbiAgICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXIuY2FsbCh0aGlzLCAncHJvcGVydHljaGFuZ2UnLCBvblByb3BlcnR5Q2hhbmdlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYWRkRXZlbnRMaXN0ZW5lci5jYWxsKHRoaXMsIHR5cGUsIGhhbmRsZXIsIGNhcHR1cmUpO1xuICAgICAgICB9O1xuICAgICAgICBkZWZpbmVQcm9wZXJ0eShIVE1MRWxlbWVudFByb3RvdHlwZSwgQUREX0VWRU5UX0xJU1RFTkVSLCBkZXNjcmlwdG9yKTtcbiAgICAgIH0oKSk7XG4gICAgfSBlbHNlIGlmICghTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgZG9jdW1lbnRFbGVtZW50W0FERF9FVkVOVF9MSVNURU5FUl0oRE9NX0FUVFJfTU9ESUZJRUQsIERPTUF0dHJNb2RpZmllZCk7XG4gICAgICBkb2N1bWVudEVsZW1lbnQuc2V0QXR0cmlidXRlKEVYUEFORE9fVUlELCAxKTtcbiAgICAgIGRvY3VtZW50RWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoRVhQQU5ET19VSUQpO1xuICAgICAgaWYgKGRvZXNOb3RTdXBwb3J0RE9NQXR0ck1vZGlmaWVkKSB7XG4gICAgICAgIG9uU3VidHJlZU1vZGlmaWVkID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXJcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLFxuICAgICAgICAgICAgb2xkQXR0cmlidXRlcyxcbiAgICAgICAgICAgIG5ld0F0dHJpYnV0ZXMsXG4gICAgICAgICAgICBrZXlcbiAgICAgICAgICA7XG4gICAgICAgICAgaWYgKG5vZGUgPT09IGUudGFyZ2V0KSB7XG4gICAgICAgICAgICBvbGRBdHRyaWJ1dGVzID0gbm9kZVtFWFBBTkRPX1VJRF07XG4gICAgICAgICAgICBub2RlW0VYUEFORE9fVUlEXSA9IChuZXdBdHRyaWJ1dGVzID0gZ2V0QXR0cmlidXRlc01pcnJvcihub2RlKSk7XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBuZXdBdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICAgIGlmICghKGtleSBpbiBvbGRBdHRyaWJ1dGVzKSkge1xuICAgICAgICAgICAgICAgIC8vIGF0dHJpYnV0ZSB3YXMgYWRkZWRcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbERPTUF0dHJNb2RpZmllZChcbiAgICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgb2xkQXR0cmlidXRlc1trZXldLFxuICAgICAgICAgICAgICAgICAgbmV3QXR0cmlidXRlc1trZXldLFxuICAgICAgICAgICAgICAgICAgQURESVRJT05cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKG5ld0F0dHJpYnV0ZXNba2V5XSAhPT0gb2xkQXR0cmlidXRlc1trZXldKSB7XG4gICAgICAgICAgICAgICAgLy8gYXR0cmlidXRlIHdhcyBjaGFuZ2VkXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxET01BdHRyTW9kaWZpZWQoXG4gICAgICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgICAgIG9sZEF0dHJpYnV0ZXNba2V5XSxcbiAgICAgICAgICAgICAgICAgIG5ld0F0dHJpYnV0ZXNba2V5XSxcbiAgICAgICAgICAgICAgICAgIE1PRElGSUNBVElPTlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNoZWNraW5nIGlmIGl0IGhhcyBiZWVuIHJlbW92ZWRcbiAgICAgICAgICAgIGZvciAoa2V5IGluIG9sZEF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIG5ld0F0dHJpYnV0ZXMpKSB7XG4gICAgICAgICAgICAgICAgLy8gYXR0cmlidXRlIHJlbW92ZWRcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbERPTUF0dHJNb2RpZmllZChcbiAgICAgICAgICAgICAgICAgIDIsXG4gICAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgb2xkQXR0cmlidXRlc1trZXldLFxuICAgICAgICAgICAgICAgICAgbmV3QXR0cmlidXRlc1trZXldLFxuICAgICAgICAgICAgICAgICAgUkVNT1ZBTFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNhbGxET01BdHRyTW9kaWZpZWQgPSBmdW5jdGlvbiAoXG4gICAgICAgICAgYXR0ckNoYW5nZSxcbiAgICAgICAgICBjdXJyZW50VGFyZ2V0LFxuICAgICAgICAgIGF0dHJOYW1lLFxuICAgICAgICAgIHByZXZWYWx1ZSxcbiAgICAgICAgICBuZXdWYWx1ZSxcbiAgICAgICAgICBhY3Rpb25cbiAgICAgICAgKSB7XG4gICAgICAgICAgdmFyIGUgPSB7XG4gICAgICAgICAgICBhdHRyQ2hhbmdlOiBhdHRyQ2hhbmdlLFxuICAgICAgICAgICAgY3VycmVudFRhcmdldDogY3VycmVudFRhcmdldCxcbiAgICAgICAgICAgIGF0dHJOYW1lOiBhdHRyTmFtZSxcbiAgICAgICAgICAgIHByZXZWYWx1ZTogcHJldlZhbHVlLFxuICAgICAgICAgICAgbmV3VmFsdWU6IG5ld1ZhbHVlXG4gICAgICAgICAgfTtcbiAgICAgICAgICBlW2FjdGlvbl0gPSBhdHRyQ2hhbmdlO1xuICAgICAgICAgIG9uRE9NQXR0ck1vZGlmaWVkKGUpO1xuICAgICAgICB9O1xuICAgICAgICBnZXRBdHRyaWJ1dGVzTWlycm9yID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICBmb3IgKHZhclxuICAgICAgICAgICAgYXR0ciwgbmFtZSxcbiAgICAgICAgICAgIHJlc3VsdCA9IHt9LFxuICAgICAgICAgICAgYXR0cmlidXRlcyA9IG5vZGUuYXR0cmlidXRlcyxcbiAgICAgICAgICAgIGkgPSAwLCBsZW5ndGggPSBhdHRyaWJ1dGVzLmxlbmd0aDtcbiAgICAgICAgICAgIGkgPCBsZW5ndGg7IGkrK1xuICAgICAgICAgICkge1xuICAgICAgICAgICAgYXR0ciA9IGF0dHJpYnV0ZXNbaV07XG4gICAgICAgICAgICBuYW1lID0gYXR0ci5uYW1lO1xuICAgICAgICAgICAgaWYgKG5hbWUgIT09ICdzZXRBdHRyaWJ1dGUnKSB7XG4gICAgICAgICAgICAgIHJlc3VsdFtuYW1lXSA9IGF0dHIudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICBcbiAgICAvLyBzZXQgYXMgZW51bWVyYWJsZSwgd3JpdGFibGUgYW5kIGNvbmZpZ3VyYWJsZVxuICAgIGRvY3VtZW50W1JFR0lTVEVSX0VMRU1FTlRdID0gZnVuY3Rpb24gcmVnaXN0ZXJFbGVtZW50KHR5cGUsIG9wdGlvbnMpIHtcbiAgICAgIHVwcGVyVHlwZSA9IHR5cGUudG9VcHBlckNhc2UoKTtcbiAgICAgIGlmICghc2V0TGlzdGVuZXIpIHtcbiAgICAgICAgLy8gb25seSBmaXJzdCB0aW1lIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCBpcyB1c2VkXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc2V0IHRoaXMgbGlzdGVuZXJcbiAgICAgICAgLy8gc2V0dGluZyBpdCBieSBkZWZhdWx0IG1pZ2h0IHNsb3cgZG93biBmb3Igbm8gcmVhc29uXG4gICAgICAgIHNldExpc3RlbmVyID0gdHJ1ZTtcbiAgICAgICAgaWYgKE11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICAgICAgICBvYnNlcnZlciA9IChmdW5jdGlvbihhdHRhY2hlZCwgZGV0YWNoZWQpe1xuICAgICAgICAgICAgZnVuY3Rpb24gY2hlY2tFbUFsbChsaXN0LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdC5sZW5ndGg7IGkgPCBsZW5ndGg7IGNhbGxiYWNrKGxpc3RbaSsrXSkpe31cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAocmVjb3Jkcykge1xuICAgICAgICAgICAgICBmb3IgKHZhclxuICAgICAgICAgICAgICAgIGN1cnJlbnQsIG5vZGUsIG5ld1ZhbHVlLFxuICAgICAgICAgICAgICAgIGkgPSAwLCBsZW5ndGggPSByZWNvcmRzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSByZWNvcmRzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50LnR5cGUgPT09ICdjaGlsZExpc3QnKSB7XG4gICAgICAgICAgICAgICAgICBjaGVja0VtQWxsKGN1cnJlbnQuYWRkZWROb2RlcywgYXR0YWNoZWQpO1xuICAgICAgICAgICAgICAgICAgY2hlY2tFbUFsbChjdXJyZW50LnJlbW92ZWROb2RlcywgZGV0YWNoZWQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBub2RlID0gY3VycmVudC50YXJnZXQ7XG4gICAgICAgICAgICAgICAgICBpZiAobm90RnJvbUlubmVySFRNTEhlbHBlciAmJlxuICAgICAgICAgICAgICAgICAgICAgIG5vZGVbQVRUUklCVVRFX0NIQU5HRURfQ0FMTEJBQ0tdICYmXG4gICAgICAgICAgICAgICAgICAgICAgY3VycmVudC5hdHRyaWJ1dGVOYW1lICE9PSAnc3R5bGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gZ2V0QXR0cmlidXRlLmNhbGwobm9kZSwgY3VycmVudC5hdHRyaWJ1dGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSBjdXJyZW50Lm9sZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgbm9kZVtBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDS10oXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50LmF0dHJpYnV0ZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Lm9sZFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KGV4ZWN1dGVBY3Rpb24oQVRUQUNIRUQpLCBleGVjdXRlQWN0aW9uKERFVEFDSEVEKSkpO1xuICAgICAgICAgIG9ic2VydmUgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShcbiAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIG9ic2VydmUoZG9jdW1lbnQpO1xuICAgICAgICAgIGlmIChhdHRhY2hTaGFkb3cpIHtcbiAgICAgICAgICAgIEhUTUxFbGVtZW50UHJvdG90eXBlLmF0dGFjaFNoYWRvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG9ic2VydmUoYXR0YWNoU2hhZG93LmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXNhcFF1ZXVlID0gW107XG4gICAgICAgICAgZG9jdW1lbnRbQUREX0VWRU5UX0xJU1RFTkVSXSgnRE9NTm9kZUluc2VydGVkJywgb25ET01Ob2RlKEFUVEFDSEVEKSk7XG4gICAgICAgICAgZG9jdW1lbnRbQUREX0VWRU5UX0xJU1RFTkVSXSgnRE9NTm9kZVJlbW92ZWQnLCBvbkRPTU5vZGUoREVUQUNIRUQpKTtcbiAgICAgICAgfVxuICBcbiAgICAgICAgZG9jdW1lbnRbQUREX0VWRU5UX0xJU1RFTkVSXShET01fQ09OVEVOVF9MT0FERUQsIG9uUmVhZHlTdGF0ZUNoYW5nZSk7XG4gICAgICAgIGRvY3VtZW50W0FERF9FVkVOVF9MSVNURU5FUl0oJ3JlYWR5c3RhdGVjaGFuZ2UnLCBvblJlYWR5U3RhdGVDaGFuZ2UpO1xuICBcbiAgICAgICAgSFRNTEVsZW1lbnRQcm90b3R5cGUuY2xvbmVOb2RlID0gZnVuY3Rpb24gKGRlZXApIHtcbiAgICAgICAgICB2YXJcbiAgICAgICAgICAgIG5vZGUgPSBjbG9uZU5vZGUuY2FsbCh0aGlzLCAhIWRlZXApLFxuICAgICAgICAgICAgaSA9IGdldFR5cGVJbmRleChub2RlKVxuICAgICAgICAgIDtcbiAgICAgICAgICBpZiAoLTEgPCBpKSBwYXRjaChub2RlLCBwcm90b3NbaV0pO1xuICAgICAgICAgIGlmIChkZWVwKSBsb29wQW5kU2V0dXAobm9kZS5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSk7XG4gICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH07XG4gICAgICB9XG4gIFxuICAgICAgaWYgKC0yIDwgKFxuICAgICAgICBpbmRleE9mLmNhbGwodHlwZXMsIFBSRUZJWF9JUyArIHVwcGVyVHlwZSkgK1xuICAgICAgICBpbmRleE9mLmNhbGwodHlwZXMsIFBSRUZJWF9UQUcgKyB1cHBlclR5cGUpXG4gICAgICApKSB7XG4gICAgICAgIHRocm93VHlwZUVycm9yKHR5cGUpO1xuICAgICAgfVxuICBcbiAgICAgIGlmICghdmFsaWROYW1lLnRlc3QodXBwZXJUeXBlKSB8fCAtMSA8IGluZGV4T2YuY2FsbChpbnZhbGlkTmFtZXMsIHVwcGVyVHlwZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgdHlwZSAnICsgdHlwZSArICcgaXMgaW52YWxpZCcpO1xuICAgICAgfVxuICBcbiAgICAgIHZhclxuICAgICAgICBjb25zdHJ1Y3RvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gZXh0ZW5kaW5nID9cbiAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUsIHVwcGVyVHlwZSkgOlxuICAgICAgICAgICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChub2RlTmFtZSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9wdCA9IG9wdGlvbnMgfHwgT1AsXG4gICAgICAgIGV4dGVuZGluZyA9IGhPUC5jYWxsKG9wdCwgRVhURU5EUyksXG4gICAgICAgIG5vZGVOYW1lID0gZXh0ZW5kaW5nID8gb3B0aW9uc1tFWFRFTkRTXS50b1VwcGVyQ2FzZSgpIDogdXBwZXJUeXBlLFxuICAgICAgICB1cHBlclR5cGUsXG4gICAgICAgIGlcbiAgICAgIDtcbiAgXG4gICAgICBpZiAoZXh0ZW5kaW5nICYmIC0xIDwgKFxuICAgICAgICBpbmRleE9mLmNhbGwodHlwZXMsIFBSRUZJWF9UQUcgKyBub2RlTmFtZSlcbiAgICAgICkpIHtcbiAgICAgICAgdGhyb3dUeXBlRXJyb3Iobm9kZU5hbWUpO1xuICAgICAgfVxuICBcbiAgICAgIGkgPSB0eXBlcy5wdXNoKChleHRlbmRpbmcgPyBQUkVGSVhfSVMgOiBQUkVGSVhfVEFHKSArIHVwcGVyVHlwZSkgLSAxO1xuICBcbiAgICAgIHF1ZXJ5ID0gcXVlcnkuY29uY2F0KFxuICAgICAgICBxdWVyeS5sZW5ndGggPyAnLCcgOiAnJyxcbiAgICAgICAgZXh0ZW5kaW5nID8gbm9kZU5hbWUgKyAnW2lzPVwiJyArIHR5cGUudG9Mb3dlckNhc2UoKSArICdcIl0nIDogbm9kZU5hbWVcbiAgICAgICk7XG4gIFxuICAgICAgY29uc3RydWN0b3IucHJvdG90eXBlID0gKFxuICAgICAgICBwcm90b3NbaV0gPSBoT1AuY2FsbChvcHQsICdwcm90b3R5cGUnKSA/XG4gICAgICAgICAgb3B0LnByb3RvdHlwZSA6XG4gICAgICAgICAgY3JlYXRlKEhUTUxFbGVtZW50UHJvdG90eXBlKVxuICAgICAgKTtcbiAgXG4gICAgICBsb29wQW5kVmVyaWZ5KFxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSxcbiAgICAgICAgQVRUQUNIRURcbiAgICAgICk7XG4gIFxuICAgICAgcmV0dXJuIGNvbnN0cnVjdG9yO1xuICAgIH07XG4gIFxuICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgPSAocGF0Y2hlZENyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbiAobG9jYWxOYW1lLCB0eXBlRXh0ZW5zaW9uKSB7XG4gICAgICB2YXJcbiAgICAgICAgaXMgPSBnZXRJcyh0eXBlRXh0ZW5zaW9uKSxcbiAgICAgICAgbm9kZSA9IGlzID9cbiAgICAgICAgICBjcmVhdGVFbGVtZW50LmNhbGwoZG9jdW1lbnQsIGxvY2FsTmFtZSwgc2Vjb25kQXJndW1lbnQoaXMpKSA6XG4gICAgICAgICAgY3JlYXRlRWxlbWVudC5jYWxsKGRvY3VtZW50LCBsb2NhbE5hbWUpLFxuICAgICAgICBuYW1lID0gJycgKyBsb2NhbE5hbWUsXG4gICAgICAgIGkgPSBpbmRleE9mLmNhbGwoXG4gICAgICAgICAgdHlwZXMsXG4gICAgICAgICAgKGlzID8gUFJFRklYX0lTIDogUFJFRklYX1RBRykgK1xuICAgICAgICAgIChpcyB8fCBuYW1lKS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICksXG4gICAgICAgIHNldHVwID0gLTEgPCBpXG4gICAgICA7XG4gICAgICBpZiAoaXMpIHtcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoJ2lzJywgaXMgPSBpcy50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgaWYgKHNldHVwKSB7XG4gICAgICAgICAgc2V0dXAgPSBpc0luUVNBKG5hbWUudG9VcHBlckNhc2UoKSwgaXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBub3RGcm9tSW5uZXJIVE1MSGVscGVyID0gIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQuaW5uZXJIVE1MSGVscGVyO1xuICAgICAgaWYgKHNldHVwKSBwYXRjaChub2RlLCBwcm90b3NbaV0pO1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfSk7XG4gIFxuICB9XG4gIFxuICBmdW5jdGlvbiBBU0FQKCkge1xuICAgIHZhciBxdWV1ZSA9IGFzYXBRdWV1ZS5zcGxpY2UoMCwgYXNhcFF1ZXVlLmxlbmd0aCk7XG4gICAgYXNhcFRpbWVyID0gMDtcbiAgICB3aGlsZSAocXVldWUubGVuZ3RoKSB7XG4gICAgICBxdWV1ZS5zaGlmdCgpLmNhbGwoXG4gICAgICAgIG51bGwsIHF1ZXVlLnNoaWZ0KClcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBsb29wQW5kVmVyaWZ5KGxpc3QsIGFjdGlvbikge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2ZXJpZnlBbmRTZXR1cEFuZEFjdGlvbihsaXN0W2ldLCBhY3Rpb24pO1xuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gbG9vcEFuZFNldHVwKGxpc3QpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdC5sZW5ndGgsIG5vZGU7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgbm9kZSA9IGxpc3RbaV07XG4gICAgICBwYXRjaChub2RlLCBwcm90b3NbZ2V0VHlwZUluZGV4KG5vZGUpXSk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBleGVjdXRlQWN0aW9uKGFjdGlvbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgaWYgKGlzVmFsaWROb2RlKG5vZGUpKSB7XG4gICAgICAgIHZlcmlmeUFuZFNldHVwQW5kQWN0aW9uKG5vZGUsIGFjdGlvbik7XG4gICAgICAgIGxvb3BBbmRWZXJpZnkoXG4gICAgICAgICAgbm9kZS5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSxcbiAgICAgICAgICBhY3Rpb25cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRUeXBlSW5kZXgodGFyZ2V0KSB7XG4gICAgdmFyXG4gICAgICBpcyA9IGdldEF0dHJpYnV0ZS5jYWxsKHRhcmdldCwgJ2lzJyksXG4gICAgICBub2RlTmFtZSA9IHRhcmdldC5ub2RlTmFtZS50b1VwcGVyQ2FzZSgpLFxuICAgICAgaSA9IGluZGV4T2YuY2FsbChcbiAgICAgICAgdHlwZXMsXG4gICAgICAgIGlzID9cbiAgICAgICAgICAgIFBSRUZJWF9JUyArIGlzLnRvVXBwZXJDYXNlKCkgOlxuICAgICAgICAgICAgUFJFRklYX1RBRyArIG5vZGVOYW1lXG4gICAgICApXG4gICAgO1xuICAgIHJldHVybiBpcyAmJiAtMSA8IGkgJiYgIWlzSW5RU0Eobm9kZU5hbWUsIGlzKSA/IC0xIDogaTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gaXNJblFTQShuYW1lLCB0eXBlKSB7XG4gICAgcmV0dXJuIC0xIDwgcXVlcnkuaW5kZXhPZihuYW1lICsgJ1tpcz1cIicgKyB0eXBlICsgJ1wiXScpO1xuICB9XG4gIFxuICBmdW5jdGlvbiBvbkRPTUF0dHJNb2RpZmllZChlKSB7XG4gICAgdmFyXG4gICAgICBub2RlID0gZS5jdXJyZW50VGFyZ2V0LFxuICAgICAgYXR0ckNoYW5nZSA9IGUuYXR0ckNoYW5nZSxcbiAgICAgIGF0dHJOYW1lID0gZS5hdHRyTmFtZSxcbiAgICAgIHRhcmdldCA9IGUudGFyZ2V0LFxuICAgICAgYWRkaXRpb24gPSBlW0FERElUSU9OXSB8fCAyLFxuICAgICAgcmVtb3ZhbCA9IGVbUkVNT1ZBTF0gfHwgM1xuICAgIDtcbiAgICBpZiAobm90RnJvbUlubmVySFRNTEhlbHBlciAmJlxuICAgICAgICAoIXRhcmdldCB8fCB0YXJnZXQgPT09IG5vZGUpICYmXG4gICAgICAgIG5vZGVbQVRUUklCVVRFX0NIQU5HRURfQ0FMTEJBQ0tdICYmXG4gICAgICAgIGF0dHJOYW1lICE9PSAnc3R5bGUnICYmIChcbiAgICAgICAgICBlLnByZXZWYWx1ZSAhPT0gZS5uZXdWYWx1ZSB8fFxuICAgICAgICAgIC8vIElFOSwgSUUxMCwgYW5kIE9wZXJhIDEyIGdvdGNoYVxuICAgICAgICAgIGUubmV3VmFsdWUgPT09ICcnICYmIChcbiAgICAgICAgICAgIGF0dHJDaGFuZ2UgPT09IGFkZGl0aW9uIHx8XG4gICAgICAgICAgICBhdHRyQ2hhbmdlID09PSByZW1vdmFsXG4gICAgICAgICAgKVxuICAgICkpIHtcbiAgICAgIG5vZGVbQVRUUklCVVRFX0NIQU5HRURfQ0FMTEJBQ0tdKFxuICAgICAgICBhdHRyTmFtZSxcbiAgICAgICAgYXR0ckNoYW5nZSA9PT0gYWRkaXRpb24gPyBudWxsIDogZS5wcmV2VmFsdWUsXG4gICAgICAgIGF0dHJDaGFuZ2UgPT09IHJlbW92YWwgPyBudWxsIDogZS5uZXdWYWx1ZVxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIG9uRE9NTm9kZShhY3Rpb24pIHtcbiAgICB2YXIgZXhlY3V0b3IgPSBleGVjdXRlQWN0aW9uKGFjdGlvbik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlKSB7XG4gICAgICBhc2FwUXVldWUucHVzaChleGVjdXRvciwgZS50YXJnZXQpO1xuICAgICAgaWYgKGFzYXBUaW1lcikgY2xlYXJUaW1lb3V0KGFzYXBUaW1lcik7XG4gICAgICBhc2FwVGltZXIgPSBzZXRUaW1lb3V0KEFTQVAsIDEpO1xuICAgIH07XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIG9uUmVhZHlTdGF0ZUNoYW5nZShlKSB7XG4gICAgaWYgKGRyb3BEb21Db250ZW50TG9hZGVkKSB7XG4gICAgICBkcm9wRG9tQ29udGVudExvYWRlZCA9IGZhbHNlO1xuICAgICAgZS5jdXJyZW50VGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoRE9NX0NPTlRFTlRfTE9BREVELCBvblJlYWR5U3RhdGVDaGFuZ2UpO1xuICAgIH1cbiAgICBsb29wQW5kVmVyaWZ5KFxuICAgICAgKGUudGFyZ2V0IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSxcbiAgICAgIGUuZGV0YWlsID09PSBERVRBQ0hFRCA/IERFVEFDSEVEIDogQVRUQUNIRURcbiAgICApO1xuICAgIGlmIChJRTgpIHB1cmdlKCk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHBhdGNoZWRTZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpIHtcbiAgICAvLyBqc2hpbnQgdmFsaWR0aGlzOnRydWVcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2V0QXR0cmlidXRlLmNhbGwoc2VsZiwgbmFtZSwgdmFsdWUpO1xuICAgIG9uU3VidHJlZU1vZGlmaWVkLmNhbGwoc2VsZiwge3RhcmdldDogc2VsZn0pO1xuICB9XG4gIFxuICBmdW5jdGlvbiBzZXR1cE5vZGUobm9kZSwgcHJvdG8pIHtcbiAgICBzZXRQcm90b3R5cGUobm9kZSwgcHJvdG8pO1xuICAgIGlmIChvYnNlcnZlcikge1xuICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCBhdHRyaWJ1dGVzT2JzZXJ2ZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZG9lc05vdFN1cHBvcnRET01BdHRyTW9kaWZpZWQpIHtcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUgPSBwYXRjaGVkU2V0QXR0cmlidXRlO1xuICAgICAgICBub2RlW0VYUEFORE9fVUlEXSA9IGdldEF0dHJpYnV0ZXNNaXJyb3Iobm9kZSk7XG4gICAgICAgIG5vZGVbQUREX0VWRU5UX0xJU1RFTkVSXShET01fU1VCVFJFRV9NT0RJRklFRCwgb25TdWJ0cmVlTW9kaWZpZWQpO1xuICAgICAgfVxuICAgICAgbm9kZVtBRERfRVZFTlRfTElTVEVORVJdKERPTV9BVFRSX01PRElGSUVELCBvbkRPTUF0dHJNb2RpZmllZCk7XG4gICAgfVxuICAgIGlmIChub2RlW0NSRUFURURfQ0FMTEJBQ0tdICYmIG5vdEZyb21Jbm5lckhUTUxIZWxwZXIpIHtcbiAgICAgIG5vZGUuY3JlYXRlZCA9IHRydWU7XG4gICAgICBub2RlW0NSRUFURURfQ0FMTEJBQ0tdKCk7XG4gICAgICBub2RlLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHB1cmdlKCkge1xuICAgIGZvciAodmFyXG4gICAgICBub2RlLFxuICAgICAgaSA9IDAsXG4gICAgICBsZW5ndGggPSB0YXJnZXRzLmxlbmd0aDtcbiAgICAgIGkgPCBsZW5ndGg7IGkrK1xuICAgICkge1xuICAgICAgbm9kZSA9IHRhcmdldHNbaV07XG4gICAgICBpZiAoIWRvY3VtZW50RWxlbWVudC5jb250YWlucyhub2RlKSkge1xuICAgICAgICBsZW5ndGgtLTtcbiAgICAgICAgdGFyZ2V0cy5zcGxpY2UoaS0tLCAxKTtcbiAgICAgICAgdmVyaWZ5QW5kU2V0dXBBbmRBY3Rpb24obm9kZSwgREVUQUNIRUQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gdGhyb3dUeXBlRXJyb3IodHlwZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignQSAnICsgdHlwZSArICcgdHlwZSBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQnKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gdmVyaWZ5QW5kU2V0dXBBbmRBY3Rpb24obm9kZSwgYWN0aW9uKSB7XG4gICAgdmFyXG4gICAgICBmbixcbiAgICAgIGkgPSBnZXRUeXBlSW5kZXgobm9kZSlcbiAgICA7XG4gICAgaWYgKC0xIDwgaSkge1xuICAgICAgcGF0Y2hJZk5vdEFscmVhZHkobm9kZSwgcHJvdG9zW2ldKTtcbiAgICAgIGkgPSAwO1xuICAgICAgaWYgKGFjdGlvbiA9PT0gQVRUQUNIRUQgJiYgIW5vZGVbQVRUQUNIRURdKSB7XG4gICAgICAgIG5vZGVbREVUQUNIRURdID0gZmFsc2U7XG4gICAgICAgIG5vZGVbQVRUQUNIRURdID0gdHJ1ZTtcbiAgICAgICAgaSA9IDE7XG4gICAgICAgIGlmIChJRTggJiYgaW5kZXhPZi5jYWxsKHRhcmdldHMsIG5vZGUpIDwgMCkge1xuICAgICAgICAgIHRhcmdldHMucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IERFVEFDSEVEICYmICFub2RlW0RFVEFDSEVEXSkge1xuICAgICAgICBub2RlW0FUVEFDSEVEXSA9IGZhbHNlO1xuICAgICAgICBub2RlW0RFVEFDSEVEXSA9IHRydWU7XG4gICAgICAgIGkgPSAxO1xuICAgICAgfVxuICAgICAgaWYgKGkgJiYgKGZuID0gbm9kZVthY3Rpb24gKyBDQUxMQkFDS10pKSBmbi5jYWxsKG5vZGUpO1xuICAgIH1cbiAgfVxuICBcbiAgXG4gIFxuICAvLyBWMSBpbiBkYSBIb3VzZSFcbiAgZnVuY3Rpb24gQ3VzdG9tRWxlbWVudFJlZ2lzdHJ5KCkge31cbiAgXG4gIEN1c3RvbUVsZW1lbnRSZWdpc3RyeS5wcm90b3R5cGUgPSB7XG4gICAgY29uc3RydWN0b3I6IEN1c3RvbUVsZW1lbnRSZWdpc3RyeSxcbiAgICAvLyBhIHdvcmthcm91bmQgZm9yIHRoZSBzdHViYm9ybiBXZWJLaXRcbiAgICBkZWZpbmU6IHVzYWJsZUN1c3RvbUVsZW1lbnRzID9cbiAgICAgIGZ1bmN0aW9uIChuYW1lLCBDbGFzcywgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgIENFUkRlZmluZShuYW1lLCBDbGFzcywgb3B0aW9ucyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIE5BTUUgPSBuYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgY29uc3RydWN0b3JzW05BTUVdID0ge1xuICAgICAgICAgICAgY29uc3RydWN0b3I6IENsYXNzLFxuICAgICAgICAgICAgY3JlYXRlOiBbTkFNRV1cbiAgICAgICAgICB9O1xuICAgICAgICAgIG5vZGVOYW1lcy5zZXQoQ2xhc3MsIE5BTUUpO1xuICAgICAgICAgIGN1c3RvbUVsZW1lbnRzLmRlZmluZShuYW1lLCBDbGFzcyk7XG4gICAgICAgIH1cbiAgICAgIH0gOlxuICAgICAgQ0VSRGVmaW5lLFxuICAgIGdldDogdXNhYmxlQ3VzdG9tRWxlbWVudHMgP1xuICAgICAgZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGN1c3RvbUVsZW1lbnRzLmdldChuYW1lKSB8fCBnZXQobmFtZSk7XG4gICAgICB9IDpcbiAgICAgIGdldCxcbiAgICB3aGVuRGVmaW5lZDogdXNhYmxlQ3VzdG9tRWxlbWVudHMgP1xuICAgICAgZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmFjZShbXG4gICAgICAgICAgY3VzdG9tRWxlbWVudHMud2hlbkRlZmluZWQobmFtZSksXG4gICAgICAgICAgd2hlbkRlZmluZWQobmFtZSlcbiAgICAgICAgXSk7XG4gICAgICB9IDpcbiAgICAgIHdoZW5EZWZpbmVkXG4gIH07XG4gIFxuICBmdW5jdGlvbiBDRVJEZWZpbmUobmFtZSwgQ2xhc3MsIG9wdGlvbnMpIHtcbiAgICB2YXJcbiAgICAgIGlzID0gb3B0aW9ucyAmJiBvcHRpb25zW0VYVEVORFNdIHx8ICcnLFxuICAgICAgQ1Byb3RvID0gQ2xhc3MucHJvdG90eXBlLFxuICAgICAgcHJvdG8gPSBjcmVhdGUoQ1Byb3RvKSxcbiAgICAgIGF0dHJpYnV0ZXMgPSBDbGFzcy5vYnNlcnZlZEF0dHJpYnV0ZXMgfHwgZW1wdHksXG4gICAgICBkZWZpbml0aW9uID0ge3Byb3RvdHlwZTogcHJvdG99XG4gICAgO1xuICAgIC8vIFRPRE86IGlzIHRoaXMgbmVlZGVkIGF0IGFsbCBzaW5jZSBpdCdzIGluaGVyaXRlZD9cbiAgICAvLyBkZWZpbmVQcm9wZXJ0eShwcm90bywgJ2NvbnN0cnVjdG9yJywge3ZhbHVlOiBDbGFzc30pO1xuICAgIHNhZmVQcm9wZXJ0eShwcm90bywgQ1JFQVRFRF9DQUxMQkFDSywge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlmIChqdXN0Q3JlYXRlZCkganVzdENyZWF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICBlbHNlIGlmICghdGhpc1tEUkVDRVYxXSkge1xuICAgICAgICAgICAgdGhpc1tEUkVDRVYxXSA9IHRydWU7XG4gICAgICAgICAgICBuZXcgQ2xhc3ModGhpcyk7XG4gICAgICAgICAgICBpZiAoQ1Byb3RvW0NSRUFURURfQ0FMTEJBQ0tdKVxuICAgICAgICAgICAgICBDUHJvdG9bQ1JFQVRFRF9DQUxMQkFDS10uY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBpbmZvID0gY29uc3RydWN0b3JzW25vZGVOYW1lcy5nZXQoQ2xhc3MpXTtcbiAgICAgICAgICAgIGlmICghdXNhYmxlQ3VzdG9tRWxlbWVudHMgfHwgaW5mby5jcmVhdGUubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICBub3RpZnlBdHRyaWJ1dGVzKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBzYWZlUHJvcGVydHkocHJvdG8sIEFUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLLCB7XG4gICAgICB2YWx1ZTogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgaWYgKC0xIDwgaW5kZXhPZi5jYWxsKGF0dHJpYnV0ZXMsIG5hbWUpKVxuICAgICAgICAgIENQcm90b1tBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDS10uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoQ1Byb3RvW0NPTk5FQ1RFRF9DQUxMQkFDS10pIHtcbiAgICAgIHNhZmVQcm9wZXJ0eShwcm90bywgQVRUQUNIRURfQ0FMTEJBQ0ssIHtcbiAgICAgICAgdmFsdWU6IENQcm90b1tDT05ORUNURURfQ0FMTEJBQ0tdXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKENQcm90b1tESVNDT05ORUNURURfQ0FMTEJBQ0tdKSB7XG4gICAgICBzYWZlUHJvcGVydHkocHJvdG8sIERFVEFDSEVEX0NBTExCQUNLLCB7XG4gICAgICAgIHZhbHVlOiBDUHJvdG9bRElTQ09OTkVDVEVEX0NBTExCQUNLXVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChpcykgZGVmaW5pdGlvbltFWFRFTkRTXSA9IGlzO1xuICAgIG5hbWUgPSBuYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgY29uc3RydWN0b3JzW25hbWVdID0ge1xuICAgICAgY29uc3RydWN0b3I6IENsYXNzLFxuICAgICAgY3JlYXRlOiBpcyA/IFtpcywgc2Vjb25kQXJndW1lbnQobmFtZSldIDogW25hbWVdXG4gICAgfTtcbiAgICBub2RlTmFtZXMuc2V0KENsYXNzLCBuYW1lKTtcbiAgICBkb2N1bWVudFtSRUdJU1RFUl9FTEVNRU5UXShuYW1lLnRvTG93ZXJDYXNlKCksIGRlZmluaXRpb24pO1xuICAgIHdoZW5EZWZpbmVkKG5hbWUpO1xuICAgIHdhaXRpbmdMaXN0W25hbWVdLnIoKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gZ2V0KG5hbWUpIHtcbiAgICB2YXIgaW5mbyA9IGNvbnN0cnVjdG9yc1tuYW1lLnRvVXBwZXJDYXNlKCldO1xuICAgIHJldHVybiBpbmZvICYmIGluZm8uY29uc3RydWN0b3I7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGdldElzKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnID9cbiAgICAgICAgb3B0aW9ucyA6IChvcHRpb25zICYmIG9wdGlvbnMuaXMgfHwgJycpO1xuICB9XG4gIFxuICBmdW5jdGlvbiBub3RpZnlBdHRyaWJ1dGVzKHNlbGYpIHtcbiAgICB2YXJcbiAgICAgIGNhbGxiYWNrID0gc2VsZltBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDS10sXG4gICAgICBhdHRyaWJ1dGVzID0gY2FsbGJhY2sgPyBzZWxmLmF0dHJpYnV0ZXMgOiBlbXB0eSxcbiAgICAgIGkgPSBhdHRyaWJ1dGVzLmxlbmd0aCxcbiAgICAgIGF0dHJpYnV0ZVxuICAgIDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBhdHRyaWJ1dGUgPSAgYXR0cmlidXRlc1tpXTsgLy8gfHwgYXR0cmlidXRlcy5pdGVtKGkpO1xuICAgICAgY2FsbGJhY2suY2FsbChcbiAgICAgICAgc2VsZixcbiAgICAgICAgYXR0cmlidXRlLm5hbWUgfHwgYXR0cmlidXRlLm5vZGVOYW1lLFxuICAgICAgICBudWxsLFxuICAgICAgICBhdHRyaWJ1dGUudmFsdWUgfHwgYXR0cmlidXRlLm5vZGVWYWx1ZVxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHdoZW5EZWZpbmVkKG5hbWUpIHtcbiAgICBuYW1lID0gbmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgIGlmICghKG5hbWUgaW4gd2FpdGluZ0xpc3QpKSB7XG4gICAgICB3YWl0aW5nTGlzdFtuYW1lXSA9IHt9O1xuICAgICAgd2FpdGluZ0xpc3RbbmFtZV0ucCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgIHdhaXRpbmdMaXN0W25hbWVdLnIgPSByZXNvbHZlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB3YWl0aW5nTGlzdFtuYW1lXS5wO1xuICB9XG4gIFxuICBmdW5jdGlvbiBwb2x5ZmlsbFYxKCkge1xuICAgIGlmIChjdXN0b21FbGVtZW50cykgZGVsZXRlIHdpbmRvdy5jdXN0b21FbGVtZW50cztcbiAgICBkZWZpbmVQcm9wZXJ0eSh3aW5kb3csICdjdXN0b21FbGVtZW50cycsIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBuZXcgQ3VzdG9tRWxlbWVudFJlZ2lzdHJ5KClcbiAgICB9KTtcbiAgICBkZWZpbmVQcm9wZXJ0eSh3aW5kb3csICdDdXN0b21FbGVtZW50UmVnaXN0cnknLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogQ3VzdG9tRWxlbWVudFJlZ2lzdHJ5XG4gICAgfSk7XG4gICAgZm9yICh2YXJcbiAgICAgIHBhdGNoQ2xhc3MgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICB2YXIgQ2xhc3MgPSB3aW5kb3dbbmFtZV07XG4gICAgICAgIGlmIChDbGFzcykge1xuICAgICAgICAgIHdpbmRvd1tuYW1lXSA9IGZ1bmN0aW9uIEN1c3RvbUVsZW1lbnRzVjEoc2VsZikge1xuICAgICAgICAgICAgdmFyIGluZm8sIGlzTmF0aXZlO1xuICAgICAgICAgICAgaWYgKCFzZWxmKSBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGlmICghc2VsZltEUkVDRVYxXSkge1xuICAgICAgICAgICAgICBqdXN0Q3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgIGluZm8gPSBjb25zdHJ1Y3RvcnNbbm9kZU5hbWVzLmdldChzZWxmLmNvbnN0cnVjdG9yKV07XG4gICAgICAgICAgICAgIGlzTmF0aXZlID0gdXNhYmxlQ3VzdG9tRWxlbWVudHMgJiYgaW5mby5jcmVhdGUubGVuZ3RoID09PSAxO1xuICAgICAgICAgICAgICBzZWxmID0gaXNOYXRpdmUgP1xuICAgICAgICAgICAgICAgIFJlZmxlY3QuY29uc3RydWN0KENsYXNzLCBlbXB0eSwgaW5mby5jb25zdHJ1Y3RvcikgOlxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQuYXBwbHkoZG9jdW1lbnQsIGluZm8uY3JlYXRlKTtcbiAgICAgICAgICAgICAgc2VsZltEUkVDRVYxXSA9IHRydWU7XG4gICAgICAgICAgICAgIGp1c3RDcmVhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgIGlmICghaXNOYXRpdmUpIG5vdGlmeUF0dHJpYnV0ZXMoc2VsZik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgICB9O1xuICAgICAgICAgIHdpbmRvd1tuYW1lXS5wcm90b3R5cGUgPSBDbGFzcy5wcm90b3R5cGU7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIENsYXNzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IHdpbmRvd1tuYW1lXTtcbiAgICAgICAgICB9IGNhdGNoKFdlYktpdCkge1xuICAgICAgICAgICAgZml4R2V0Q2xhc3MgPSB0cnVlO1xuICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkoQ2xhc3MsIERSRUNFVjEsIHt2YWx1ZTogd2luZG93W25hbWVdfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgQ2xhc3NlcyA9IGh0bWxDbGFzcy5nZXQoL15IVE1MW0EtWl0qW2Etel0vKSxcbiAgICAgIGkgPSBDbGFzc2VzLmxlbmd0aDtcbiAgICAgIGktLTtcbiAgICAgIHBhdGNoQ2xhc3MoQ2xhc3Nlc1tpXSlcbiAgICApIHt9XG4gICAgKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbiAobmFtZSwgb3B0aW9ucykge1xuICAgICAgdmFyIGlzID0gZ2V0SXMob3B0aW9ucyk7XG4gICAgICByZXR1cm4gaXMgP1xuICAgICAgICBwYXRjaGVkQ3JlYXRlRWxlbWVudC5jYWxsKHRoaXMsIG5hbWUsIHNlY29uZEFyZ3VtZW50KGlzKSkgOlxuICAgICAgICBwYXRjaGVkQ3JlYXRlRWxlbWVudC5jYWxsKHRoaXMsIG5hbWUpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvLyBpZiBjdXN0b21FbGVtZW50cyBpcyBub3QgdGhlcmUgYXQgYWxsXG4gIGlmICghY3VzdG9tRWxlbWVudHMgfHwgcG9seWZpbGwgPT09ICdmb3JjZScpIHBvbHlmaWxsVjEoKTtcbiAgZWxzZSB7XG4gICAgLy8gaWYgYXZhaWxhYmxlIHRlc3QgZXh0ZW5kcyB3b3JrIGFzIGV4cGVjdGVkXG4gICAgdHJ5IHtcbiAgICAgIChmdW5jdGlvbiAoRFJFLCBvcHRpb25zLCBuYW1lKSB7XG4gICAgICAgIG9wdGlvbnNbRVhURU5EU10gPSAnYSc7XG4gICAgICAgIERSRS5wcm90b3R5cGUgPSBjcmVhdGUoSFRNTEFuY2hvckVsZW1lbnQucHJvdG90eXBlKTtcbiAgICAgICAgRFJFLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERSRTtcbiAgICAgICAgd2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShuYW1lLCBEUkUsIG9wdGlvbnMpO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgZ2V0QXR0cmlidXRlLmNhbGwoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScsIHtpczogbmFtZX0pLCAnaXMnKSAhPT0gbmFtZSB8fFxuICAgICAgICAgICh1c2FibGVDdXN0b21FbGVtZW50cyAmJiBnZXRBdHRyaWJ1dGUuY2FsbChuZXcgRFJFKCksICdpcycpICE9PSBuYW1lKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aHJvdyBvcHRpb25zO1xuICAgICAgICB9XG4gICAgICB9KFxuICAgICAgICBmdW5jdGlvbiBEUkUoKSB7XG4gICAgICAgICAgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KEhUTUxBbmNob3JFbGVtZW50LCBbXSwgRFJFKTtcbiAgICAgICAgfSxcbiAgICAgICAge30sXG4gICAgICAgICdkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50LWEnXG4gICAgICApKTtcbiAgICB9IGNhdGNoKG9fTykge1xuICAgICAgLy8gb3IgZm9yY2UgdGhlIHBvbHlmaWxsIGlmIG5vdFxuICAgICAgLy8gYW5kIGtlZXAgaW50ZXJuYWwgb3JpZ2luYWwgcmVmZXJlbmNlXG4gICAgICBwb2x5ZmlsbFYxKCk7XG4gICAgfVxuICB9XG4gIFxuICB0cnkge1xuICAgIGNyZWF0ZUVsZW1lbnQuY2FsbChkb2N1bWVudCwgJ2EnLCAnYScpO1xuICB9IGNhdGNoKEZpcmVGb3gpIHtcbiAgICBzZWNvbmRBcmd1bWVudCA9IGZ1bmN0aW9uIChpcykge1xuICAgICAgcmV0dXJuIHtpczogaXN9O1xuICAgIH07XG4gIH1cbiAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW5zdGFsbEN1c3RvbUVsZW1lbnRzO1xuaW5zdGFsbEN1c3RvbUVsZW1lbnRzKGdsb2JhbCk7XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUsIG5vZGU6dHJ1ZSovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBEZWxlZ2F0ZTtcblxuLyoqXG4gKiBET00gZXZlbnQgZGVsZWdhdG9yXG4gKlxuICogVGhlIGRlbGVnYXRvciB3aWxsIGxpc3RlblxuICogZm9yIGV2ZW50cyB0aGF0IGJ1YmJsZSB1cFxuICogdG8gdGhlIHJvb3Qgbm9kZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7Tm9kZXxzdHJpbmd9IFtyb290XSBUaGUgcm9vdCBub2RlIG9yIGEgc2VsZWN0b3Igc3RyaW5nIG1hdGNoaW5nIHRoZSByb290IG5vZGVcbiAqL1xuZnVuY3Rpb24gRGVsZWdhdGUocm9vdCkge1xuXG4gIC8qKlxuICAgKiBNYWludGFpbiBhIG1hcCBvZiBsaXN0ZW5lclxuICAgKiBsaXN0cywga2V5ZWQgYnkgZXZlbnQgbmFtZS5cbiAgICpcbiAgICogQHR5cGUgT2JqZWN0XG4gICAqL1xuICB0aGlzLmxpc3RlbmVyTWFwID0gW3t9LCB7fV07XG4gIGlmIChyb290KSB7XG4gICAgdGhpcy5yb290KHJvb3QpO1xuICB9XG5cbiAgLyoqIEB0eXBlIGZ1bmN0aW9uKCkgKi9cbiAgdGhpcy5oYW5kbGUgPSBEZWxlZ2F0ZS5wcm90b3R5cGUuaGFuZGxlLmJpbmQodGhpcyk7XG59XG5cbi8qKlxuICogU3RhcnQgbGlzdGVuaW5nIGZvciBldmVudHNcbiAqIG9uIHRoZSBwcm92aWRlZCBET00gZWxlbWVudFxuICpcbiAqIEBwYXJhbSAge05vZGV8c3RyaW5nfSBbcm9vdF0gVGhlIHJvb3Qgbm9kZSBvciBhIHNlbGVjdG9yIHN0cmluZyBtYXRjaGluZyB0aGUgcm9vdCBub2RlXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUucm9vdCA9IGZ1bmN0aW9uKHJvb3QpIHtcbiAgdmFyIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcDtcbiAgdmFyIGV2ZW50VHlwZTtcblxuICAvLyBSZW1vdmUgbWFzdGVyIGV2ZW50IGxpc3RlbmVyc1xuICBpZiAodGhpcy5yb290RWxlbWVudCkge1xuICAgIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzFdKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXBbMV0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzBdKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXBbMF0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIG5vIHJvb3Qgb3Igcm9vdCBpcyBub3RcbiAgLy8gYSBkb20gbm9kZSwgdGhlbiByZW1vdmUgaW50ZXJuYWxcbiAgLy8gcm9vdCByZWZlcmVuY2UgYW5kIGV4aXQgaGVyZVxuICBpZiAoIXJvb3QgfHwgIXJvb3QuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICBkZWxldGUgdGhpcy5yb290RWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHJvb3Qgbm9kZSBhdCB3aGljaFxuICAgKiBsaXN0ZW5lcnMgYXJlIGF0dGFjaGVkLlxuICAgKlxuICAgKiBAdHlwZSBOb2RlXG4gICAqL1xuICB0aGlzLnJvb3RFbGVtZW50ID0gcm9vdDtcblxuICAvLyBTZXQgdXAgbWFzdGVyIGV2ZW50IGxpc3RlbmVyc1xuICBmb3IgKGV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcFsxXSkge1xuICAgIGlmIChsaXN0ZW5lck1hcFsxXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdHJ1ZSk7XG4gICAgfVxuICB9XG4gIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzBdKSB7XG4gICAgaWYgKGxpc3RlbmVyTWFwWzBdLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmNhcHR1cmVGb3JUeXBlID0gZnVuY3Rpb24oZXZlbnRUeXBlKSB7XG4gIHJldHVybiBbJ2JsdXInLCAnZXJyb3InLCAnZm9jdXMnLCAnbG9hZCcsICdyZXNpemUnLCAnc2Nyb2xsJ10uaW5kZXhPZihldmVudFR5cGUpICE9PSAtMTtcbn07XG5cbi8qKlxuICogQXR0YWNoIGEgaGFuZGxlciB0byBvbmVcbiAqIGV2ZW50IGZvciBhbGwgZWxlbWVudHNcbiAqIHRoYXQgbWF0Y2ggdGhlIHNlbGVjdG9yLFxuICogbm93IG9yIGluIHRoZSBmdXR1cmVcbiAqXG4gKiBUaGUgaGFuZGxlciBmdW5jdGlvbiByZWNlaXZlc1xuICogdGhyZWUgYXJndW1lbnRzOiB0aGUgRE9NIGV2ZW50XG4gKiBvYmplY3QsIHRoZSBub2RlIHRoYXQgbWF0Y2hlZFxuICogdGhlIHNlbGVjdG9yIHdoaWxlIHRoZSBldmVudFxuICogd2FzIGJ1YmJsaW5nIGFuZCBhIHJlZmVyZW5jZVxuICogdG8gaXRzZWxmLiBXaXRoaW4gdGhlIGhhbmRsZXIsXG4gKiAndGhpcycgaXMgZXF1YWwgdG8gdGhlIHNlY29uZFxuICogYXJndW1lbnQuXG4gKlxuICogVGhlIG5vZGUgdGhhdCBhY3R1YWxseSByZWNlaXZlZFxuICogdGhlIGV2ZW50IGNhbiBiZSBhY2Nlc3NlZCB2aWFcbiAqICdldmVudC50YXJnZXQnLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgTGlzdGVuIGZvciB0aGVzZSBldmVudHNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc2VsZWN0b3IgT25seSBoYW5kbGUgZXZlbnRzIG9uIGVsZW1lbnRzIG1hdGNoaW5nIHRoaXMgc2VsZWN0b3IsIGlmIHVuZGVmaW5lZCBtYXRjaCByb290IGVsZW1lbnRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKX0gaGFuZGxlciBIYW5kbGVyIGZ1bmN0aW9uIC0gZXZlbnQgZGF0YSBwYXNzZWQgaGVyZSB3aWxsIGJlIGluIGV2ZW50LmRhdGFcbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXZlbnREYXRhXSBEYXRhIHRvIHBhc3MgaW4gZXZlbnQuZGF0YVxuICogQHJldHVybnMge0RlbGVnYXRlfSBUaGlzIG1ldGhvZCBpcyBjaGFpbmFibGVcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdXNlQ2FwdHVyZSkge1xuICB2YXIgcm9vdCwgbGlzdGVuZXJNYXAsIG1hdGNoZXIsIG1hdGNoZXJQYXJhbTtcblxuICBpZiAoIWV2ZW50VHlwZSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgZXZlbnQgdHlwZTogJyArIGV2ZW50VHlwZSk7XG4gIH1cblxuICAvLyBoYW5kbGVyIGNhbiBiZSBwYXNzZWQgYXNcbiAgLy8gdGhlIHNlY29uZCBvciB0aGlyZCBhcmd1bWVudFxuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlQ2FwdHVyZSA9IGhhbmRsZXI7XG4gICAgaGFuZGxlciA9IHNlbGVjdG9yO1xuICAgIHNlbGVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvIHNlbnNpYmxlIGRlZmF1bHRzXG4gIC8vIGlmIHVzZUNhcHR1cmUgbm90IHNldFxuICBpZiAodXNlQ2FwdHVyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdXNlQ2FwdHVyZSA9IHRoaXMuY2FwdHVyZUZvclR5cGUoZXZlbnRUeXBlKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgaGFuZGxlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0hhbmRsZXIgbXVzdCBiZSBhIHR5cGUgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuICBsaXN0ZW5lck1hcCA9IHRoaXMubGlzdGVuZXJNYXBbdXNlQ2FwdHVyZSA/IDEgOiAwXTtcblxuICAvLyBBZGQgbWFzdGVyIGhhbmRsZXIgZm9yIHR5cGUgaWYgbm90IGNyZWF0ZWQgeWV0XG4gIGlmICghbGlzdGVuZXJNYXBbZXZlbnRUeXBlXSkge1xuICAgIGlmIChyb290KSB7XG4gICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICAgIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV0gPSBbXTtcbiAgfVxuXG4gIGlmICghc2VsZWN0b3IpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBudWxsO1xuXG4gICAgLy8gQ09NUExFWCAtIG1hdGNoZXNSb290IG5lZWRzIHRvIGhhdmUgYWNjZXNzIHRvXG4gICAgLy8gdGhpcy5yb290RWxlbWVudCwgc28gYmluZCB0aGUgZnVuY3Rpb24gdG8gdGhpcy5cbiAgICBtYXRjaGVyID0gbWF0Y2hlc1Jvb3QuYmluZCh0aGlzKTtcblxuICAvLyBDb21waWxlIGEgbWF0Y2hlciBmb3IgdGhlIGdpdmVuIHNlbGVjdG9yXG4gIH0gZWxzZSBpZiAoL15bYS16XSskL2kudGVzdChzZWxlY3RvcikpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3RvcjtcbiAgICBtYXRjaGVyID0gbWF0Y2hlc1RhZztcbiAgfSBlbHNlIGlmICgvXiNbYS16MC05XFwtX10rJC9pLnRlc3Qoc2VsZWN0b3IpKSB7XG4gICAgbWF0Y2hlclBhcmFtID0gc2VsZWN0b3Iuc2xpY2UoMSk7XG4gICAgbWF0Y2hlciA9IG1hdGNoZXNJZDtcbiAgfSBlbHNlIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3RvcjtcbiAgICBtYXRjaGVyID0gbWF0Y2hlcztcbiAgfVxuXG4gIC8vIEFkZCB0byB0aGUgbGlzdCBvZiBsaXN0ZW5lcnNcbiAgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXS5wdXNoKHtcbiAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXG4gICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICBtYXRjaGVyOiBtYXRjaGVyLFxuICAgIG1hdGNoZXJQYXJhbTogbWF0Y2hlclBhcmFtXG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYW4gZXZlbnQgaGFuZGxlclxuICogZm9yIGVsZW1lbnRzIHRoYXQgbWF0Y2hcbiAqIHRoZSBzZWxlY3RvciwgZm9yZXZlclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZXZlbnRUeXBlXSBSZW1vdmUgaGFuZGxlcnMgZm9yIGV2ZW50cyBtYXRjaGluZyB0aGlzIHR5cGUsIGNvbnNpZGVyaW5nIHRoZSBvdGhlciBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ30gW3NlbGVjdG9yXSBJZiB0aGlzIHBhcmFtZXRlciBpcyBvbWl0dGVkLCBvbmx5IGhhbmRsZXJzIHdoaWNoIG1hdGNoIHRoZSBvdGhlciB0d28gd2lsbCBiZSByZW1vdmVkXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCl9IFtoYW5kbGVyXSBJZiB0aGlzIHBhcmFtZXRlciBpcyBvbWl0dGVkLCBvbmx5IGhhbmRsZXJzIHdoaWNoIG1hdGNoIHRoZSBwcmV2aW91cyB0d28gd2lsbCBiZSByZW1vdmVkXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24oZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdXNlQ2FwdHVyZSkge1xuICB2YXIgaSwgbGlzdGVuZXIsIGxpc3RlbmVyTWFwLCBsaXN0ZW5lckxpc3QsIHNpbmdsZUV2ZW50VHlwZTtcblxuICAvLyBIYW5kbGVyIGNhbiBiZSBwYXNzZWQgYXNcbiAgLy8gdGhlIHNlY29uZCBvciB0aGlyZCBhcmd1bWVudFxuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlQ2FwdHVyZSA9IGhhbmRsZXI7XG4gICAgaGFuZGxlciA9IHNlbGVjdG9yO1xuICAgIHNlbGVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIC8vIElmIHVzZUNhcHR1cmUgbm90IHNldCwgcmVtb3ZlXG4gIC8vIGFsbCBldmVudCBsaXN0ZW5lcnNcbiAgaWYgKHVzZUNhcHR1cmUgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXMub2ZmKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIHRydWUpO1xuICAgIHRoaXMub2ZmKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcFt1c2VDYXB0dXJlID8gMSA6IDBdO1xuICBpZiAoIWV2ZW50VHlwZSkge1xuICAgIGZvciAoc2luZ2xlRXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXAuaGFzT3duUHJvcGVydHkoc2luZ2xlRXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLm9mZihzaW5nbGVFdmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVyTGlzdCA9IGxpc3RlbmVyTWFwW2V2ZW50VHlwZV07XG4gIGlmICghbGlzdGVuZXJMaXN0IHx8ICFsaXN0ZW5lckxpc3QubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBSZW1vdmUgb25seSBwYXJhbWV0ZXIgbWF0Y2hlc1xuICAvLyBpZiBzcGVjaWZpZWRcbiAgZm9yIChpID0gbGlzdGVuZXJMaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgbGlzdGVuZXIgPSBsaXN0ZW5lckxpc3RbaV07XG5cbiAgICBpZiAoKCFzZWxlY3RvciB8fCBzZWxlY3RvciA9PT0gbGlzdGVuZXIuc2VsZWN0b3IpICYmICghaGFuZGxlciB8fCBoYW5kbGVyID09PSBsaXN0ZW5lci5oYW5kbGVyKSkge1xuICAgICAgbGlzdGVuZXJMaXN0LnNwbGljZShpLCAxKTtcbiAgICB9XG4gIH1cblxuICAvLyBBbGwgbGlzdGVuZXJzIHJlbW92ZWRcbiAgaWYgKCFsaXN0ZW5lckxpc3QubGVuZ3RoKSB7XG4gICAgZGVsZXRlIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV07XG5cbiAgICAvLyBSZW1vdmUgdGhlIG1haW4gaGFuZGxlclxuICAgIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogSGFuZGxlIGFuIGFyYml0cmFyeSBldmVudC5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuaGFuZGxlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgdmFyIGksIGwsIHR5cGUgPSBldmVudC50eXBlLCByb290LCBwaGFzZSwgbGlzdGVuZXIsIHJldHVybmVkLCBsaXN0ZW5lckxpc3QgPSBbXSwgdGFyZ2V0LCAvKiogQGNvbnN0ICovIEVWRU5USUdOT1JFID0gJ2Z0TGFic0RlbGVnYXRlSWdub3JlJztcblxuICBpZiAoZXZlbnRbRVZFTlRJR05PUkVdID09PSB0cnVlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuXG4gIC8vIEhhcmRjb2RlIHZhbHVlIG9mIE5vZGUuVEVYVF9OT0RFXG4gIC8vIGFzIG5vdCBkZWZpbmVkIGluIElFOFxuICBpZiAodGFyZ2V0Lm5vZGVUeXBlID09PSAzKSB7XG4gICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XG4gIH1cblxuICByb290ID0gdGhpcy5yb290RWxlbWVudDtcblxuICBwaGFzZSA9IGV2ZW50LmV2ZW50UGhhc2UgfHwgKCBldmVudC50YXJnZXQgIT09IGV2ZW50LmN1cnJlbnRUYXJnZXQgPyAzIDogMiApO1xuICBcbiAgc3dpdGNoIChwaGFzZSkge1xuICAgIGNhc2UgMTogLy9FdmVudC5DQVBUVVJJTkdfUEhBU0U6XG4gICAgICBsaXN0ZW5lckxpc3QgPSB0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMjogLy9FdmVudC5BVF9UQVJHRVQ6XG4gICAgICBpZiAodGhpcy5saXN0ZW5lck1hcFswXSAmJiB0aGlzLmxpc3RlbmVyTWFwWzBdW3R5cGVdKSBsaXN0ZW5lckxpc3QgPSBsaXN0ZW5lckxpc3QuY29uY2F0KHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV0pO1xuICAgICAgaWYgKHRoaXMubGlzdGVuZXJNYXBbMV0gJiYgdGhpcy5saXN0ZW5lck1hcFsxXVt0eXBlXSkgbGlzdGVuZXJMaXN0ID0gbGlzdGVuZXJMaXN0LmNvbmNhdCh0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdKTtcbiAgICBicmVhaztcbiAgICBjYXNlIDM6IC8vRXZlbnQuQlVCQkxJTkdfUEhBU0U6XG4gICAgICBsaXN0ZW5lckxpc3QgPSB0aGlzLmxpc3RlbmVyTWFwWzBdW3R5cGVdO1xuICAgIGJyZWFrO1xuICB9XG5cbiAgLy8gTmVlZCB0byBjb250aW51b3VzbHkgY2hlY2tcbiAgLy8gdGhhdCB0aGUgc3BlY2lmaWMgbGlzdCBpc1xuICAvLyBzdGlsbCBwb3B1bGF0ZWQgaW4gY2FzZSBvbmVcbiAgLy8gb2YgdGhlIGNhbGxiYWNrcyBhY3R1YWxseVxuICAvLyBjYXVzZXMgdGhlIGxpc3QgdG8gYmUgZGVzdHJveWVkLlxuICBsID0gbGlzdGVuZXJMaXN0Lmxlbmd0aDtcbiAgd2hpbGUgKHRhcmdldCAmJiBsKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgbGlzdGVuZXIgPSBsaXN0ZW5lckxpc3RbaV07XG5cbiAgICAgIC8vIEJhaWwgZnJvbSB0aGlzIGxvb3AgaWZcbiAgICAgIC8vIHRoZSBsZW5ndGggY2hhbmdlZCBhbmRcbiAgICAgIC8vIG5vIG1vcmUgbGlzdGVuZXJzIGFyZVxuICAgICAgLy8gZGVmaW5lZCBiZXR3ZWVuIGkgYW5kIGwuXG4gICAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBmb3IgbWF0Y2ggYW5kIGZpcmVcbiAgICAgIC8vIHRoZSBldmVudCBpZiB0aGVyZSdzIG9uZVxuICAgICAgLy9cbiAgICAgIC8vIFRPRE86TUNHOjIwMTIwMTE3OiBOZWVkIGEgd2F5XG4gICAgICAvLyB0byBjaGVjayBpZiBldmVudCNzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb25cbiAgICAgIC8vIHdhcyBjYWxsZWQuIElmIHNvLCBicmVhayBib3RoIGxvb3BzLlxuICAgICAgaWYgKGxpc3RlbmVyLm1hdGNoZXIuY2FsbCh0YXJnZXQsIGxpc3RlbmVyLm1hdGNoZXJQYXJhbSwgdGFyZ2V0KSkge1xuICAgICAgICByZXR1cm5lZCA9IHRoaXMuZmlyZShldmVudCwgdGFyZ2V0LCBsaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIC8vIFN0b3AgcHJvcGFnYXRpb24gdG8gc3Vic2VxdWVudFxuICAgICAgLy8gY2FsbGJhY2tzIGlmIHRoZSBjYWxsYmFjayByZXR1cm5lZFxuICAgICAgLy8gZmFsc2VcbiAgICAgIGlmIChyZXR1cm5lZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgZXZlbnRbRVZFTlRJR05PUkVdID0gdHJ1ZTtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE86TUNHOjIwMTIwMTE3OiBOZWVkIGEgd2F5IHRvXG4gICAgLy8gY2hlY2sgaWYgZXZlbnQjc3RvcFByb3BhZ2F0aW9uXG4gICAgLy8gd2FzIGNhbGxlZC4gSWYgc28sIGJyZWFrIGxvb3BpbmdcbiAgICAvLyB0aHJvdWdoIHRoZSBET00uIFN0b3AgaWYgdGhlXG4gICAgLy8gZGVsZWdhdGlvbiByb290IGhhcyBiZWVuIHJlYWNoZWRcbiAgICBpZiAodGFyZ2V0ID09PSByb290KSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBsID0gbGlzdGVuZXJMaXN0Lmxlbmd0aDtcbiAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50RWxlbWVudDtcbiAgfVxufTtcblxuLyoqXG4gKiBGaXJlIGEgbGlzdGVuZXIgb24gYSB0YXJnZXQuXG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7Tm9kZX0gdGFyZ2V0XG4gKiBAcGFyYW0ge09iamVjdH0gbGlzdGVuZXJcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuZmlyZSA9IGZ1bmN0aW9uKGV2ZW50LCB0YXJnZXQsIGxpc3RlbmVyKSB7XG4gIHJldHVybiBsaXN0ZW5lci5oYW5kbGVyLmNhbGwodGFyZ2V0LCBldmVudCwgdGFyZ2V0KTtcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50XG4gKiBtYXRjaGVzIGEgZ2VuZXJpYyBzZWxlY3Rvci5cbiAqXG4gKiBAdHlwZSBmdW5jdGlvbigpXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3IgQSBDU1Mgc2VsZWN0b3JcbiAqL1xudmFyIG1hdGNoZXMgPSAoZnVuY3Rpb24oZWwpIHtcbiAgaWYgKCFlbCkgcmV0dXJuO1xuICB2YXIgcCA9IGVsLnByb3RvdHlwZTtcbiAgcmV0dXJuIChwLm1hdGNoZXMgfHwgcC5tYXRjaGVzU2VsZWN0b3IgfHwgcC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgcC5tb3pNYXRjaGVzU2VsZWN0b3IgfHwgcC5tc01hdGNoZXNTZWxlY3RvciB8fCBwLm9NYXRjaGVzU2VsZWN0b3IpO1xufShFbGVtZW50KSk7XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50XG4gKiBtYXRjaGVzIGEgdGFnIHNlbGVjdG9yLlxuICpcbiAqIFRhZ3MgYXJlIE5PVCBjYXNlLXNlbnNpdGl2ZSxcbiAqIGV4Y2VwdCBpbiBYTUwgKGFuZCBYTUwtYmFzZWRcbiAqIGxhbmd1YWdlcyBzdWNoIGFzIFhIVE1MKS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnTmFtZSBUaGUgdGFnIG5hbWUgdG8gdGVzdCBhZ2FpbnN0XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gdGVzdCB3aXRoXG4gKiBAcmV0dXJucyBib29sZWFuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoZXNUYWcodGFnTmFtZSwgZWxlbWVudCkge1xuICByZXR1cm4gdGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgdGhlIHJvb3QuXG4gKlxuICogQHBhcmFtIHs/U3RyaW5nfSBzZWxlY3RvciBJbiB0aGlzIGNhc2UgdGhpcyBpcyBhbHdheXMgcGFzc2VkIHRocm91Z2ggYXMgbnVsbCBhbmQgbm90IHVzZWRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc1Jvb3Qoc2VsZWN0b3IsIGVsZW1lbnQpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUqL1xuICBpZiAodGhpcy5yb290RWxlbWVudCA9PT0gd2luZG93KSByZXR1cm4gZWxlbWVudCA9PT0gZG9jdW1lbnQ7XG4gIHJldHVybiB0aGlzLnJvb3RFbGVtZW50ID09PSBlbGVtZW50O1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIElEIG9mXG4gKiB0aGUgZWxlbWVudCBpbiAndGhpcydcbiAqIG1hdGNoZXMgdGhlIGdpdmVuIElELlxuICpcbiAqIElEcyBhcmUgY2FzZS1zZW5zaXRpdmUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlkIFRoZSBJRCB0byB0ZXN0IGFnYWluc3RcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc0lkKGlkLCBlbGVtZW50KSB7XG4gIHJldHVybiBpZCA9PT0gZWxlbWVudC5pZDtcbn1cblxuLyoqXG4gKiBTaG9ydCBoYW5kIGZvciBvZmYoKVxuICogYW5kIHJvb3QoKSwgaWUgYm90aFxuICogd2l0aCBubyBwYXJhbWV0ZXJzXG4gKlxuICogQHJldHVybiB2b2lkXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub2ZmKCk7XG4gIHRoaXMucm9vdCgpO1xufTtcbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSwgbm9kZTp0cnVlKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBwcmVzZXJ2ZSBDcmVhdGUgYW5kIG1hbmFnZSBhIERPTSBldmVudCBkZWxlZ2F0b3IuXG4gKlxuICogQHZlcnNpb24gMC4zLjBcbiAqIEBjb2RpbmdzdGFuZGFyZCBmdGxhYnMtanN2MlxuICogQGNvcHlyaWdodCBUaGUgRmluYW5jaWFsIFRpbWVzIExpbWl0ZWQgW0FsbCBSaWdodHMgUmVzZXJ2ZWRdXG4gKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoc2VlIExJQ0VOU0UudHh0KVxuICovXG52YXIgRGVsZWdhdGUgPSByZXF1aXJlKCcuL2RlbGVnYXRlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocm9vdCkge1xuICByZXR1cm4gbmV3IERlbGVnYXRlKHJvb3QpO1xufTtcblxubW9kdWxlLmV4cG9ydHMuRGVsZWdhdGUgPSBEZWxlZ2F0ZTtcbiIsInZhciBGcmVlemVyID0gcmVxdWlyZSgnLi9zcmMvZnJlZXplcicpO1xubW9kdWxlLmV4cG9ydHMgPSBGcmVlemVyOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBVdGlscyA9IHJlcXVpcmUoICcuL3V0aWxzJyApO1xyXG5cclxuXHJcblxyXG4vLyNidWlsZFxyXG5cclxuXHJcbnZhciBCRUZPUkVBTEwgPSAnYmVmb3JlQWxsJyxcclxuXHRBRlRFUkFMTCA9ICdhZnRlckFsbCdcclxuO1xyXG52YXIgc3BlY2lhbEV2ZW50cyA9IFtCRUZPUkVBTEwsIEFGVEVSQUxMXTtcclxuXHJcbi8vIFRoZSBwcm90b3R5cGUgbWV0aG9kcyBhcmUgc3RvcmVkIGluIGEgZGlmZmVyZW50IG9iamVjdFxyXG4vLyBhbmQgYXBwbGllZCBhcyBub24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGxhdGVyXHJcbnZhciBlbWl0dGVyUHJvdG8gPSB7XHJcblx0b246IGZ1bmN0aW9uKCBldmVudE5hbWUsIGxpc3RlbmVyLCBvbmNlICl7XHJcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzWyBldmVudE5hbWUgXSB8fCBbXTtcclxuXHJcblx0XHRsaXN0ZW5lcnMucHVzaCh7IGNhbGxiYWNrOiBsaXN0ZW5lciwgb25jZTogb25jZX0pO1xyXG5cdFx0dGhpcy5fZXZlbnRzWyBldmVudE5hbWUgXSA9ICBsaXN0ZW5lcnM7XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0b25jZTogZnVuY3Rpb24oIGV2ZW50TmFtZSwgbGlzdGVuZXIgKXtcclxuXHRcdHJldHVybiB0aGlzLm9uKCBldmVudE5hbWUsIGxpc3RlbmVyLCB0cnVlICk7XHJcblx0fSxcclxuXHJcblx0b2ZmOiBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApe1xyXG5cdFx0aWYoIHR5cGVvZiBldmVudE5hbWUgPT0gJ3VuZGVmaW5lZCcgKXtcclxuXHRcdFx0dGhpcy5fZXZlbnRzID0ge307XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmKCB0eXBlb2YgbGlzdGVuZXIgPT0gJ3VuZGVmaW5lZCcgKSB7XHJcblx0XHRcdHRoaXMuX2V2ZW50c1sgZXZlbnROYW1lIF0gPSBbXTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzWyBldmVudE5hbWUgXSB8fCBbXSxcclxuXHRcdFx0XHRpXHJcblx0XHRcdDtcclxuXHJcblx0XHRcdGZvciAoaSA9IGxpc3RlbmVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG5cdFx0XHRcdGlmKCBsaXN0ZW5lcnNbaV0uY2FsbGJhY2sgPT09IGxpc3RlbmVyIClcclxuXHRcdFx0XHRcdGxpc3RlbmVycy5zcGxpY2UoIGksIDEgKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHRyaWdnZXI6IGZ1bmN0aW9uKCBldmVudE5hbWUgKXtcclxuXHRcdHZhciBhcmdzID0gW10uc2xpY2UuY2FsbCggYXJndW1lbnRzLCAxICksXHJcblx0XHRcdGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1sgZXZlbnROYW1lIF0gfHwgW10sXHJcblx0XHRcdG9uY2VMaXN0ZW5lcnMgPSBbXSxcclxuXHRcdFx0c3BlY2lhbCA9IHNwZWNpYWxFdmVudHMuaW5kZXhPZiggZXZlbnROYW1lICkgIT0gLTEsXHJcblx0XHRcdGksIGxpc3RlbmVyLCByZXR1cm5WYWx1ZSwgbGFzdFZhbHVlXHJcblx0XHQ7XHJcblxyXG5cdFx0c3BlY2lhbCB8fCB0aGlzLnRyaWdnZXIuYXBwbHkoIHRoaXMsIFtCRUZPUkVBTEwsIGV2ZW50TmFtZV0uY29uY2F0KCBhcmdzICkgKTtcclxuXHJcblx0XHQvLyBDYWxsIGxpc3RlbmVyc1xyXG5cdFx0Zm9yIChpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRsaXN0ZW5lciA9IGxpc3RlbmVyc1tpXTtcclxuXHJcblx0XHRcdGlmKCBsaXN0ZW5lci5jYWxsYmFjayApXHJcblx0XHRcdFx0bGFzdFZhbHVlID0gbGlzdGVuZXIuY2FsbGJhY2suYXBwbHkoIHRoaXMsIGFyZ3MgKTtcclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Ly8gSWYgdGhlcmUgaXMgbm90IGEgY2FsbGJhY2ssIHJlbW92ZSFcclxuXHRcdFx0XHRsaXN0ZW5lci5vbmNlID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYoIGxpc3RlbmVyLm9uY2UgKVxyXG5cdFx0XHRcdG9uY2VMaXN0ZW5lcnMucHVzaCggaSApO1xyXG5cclxuXHRcdFx0aWYoIGxhc3RWYWx1ZSAhPT0gdW5kZWZpbmVkICl7XHJcblx0XHRcdFx0cmV0dXJuVmFsdWUgPSBsYXN0VmFsdWU7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHQvLyBSZW1vdmUgbGlzdGVuZXJzIG1hcmtlZCBhcyBvbmNlXHJcblx0XHRmb3IoIGkgPSBvbmNlTGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICl7XHJcblx0XHRcdGxpc3RlbmVycy5zcGxpY2UoIG9uY2VMaXN0ZW5lcnNbaV0sIDEgKTtcclxuXHRcdH1cclxuXHJcblx0XHRzcGVjaWFsIHx8IHRoaXMudHJpZ2dlci5hcHBseSggdGhpcywgW0FGVEVSQUxMLCBldmVudE5hbWVdLmNvbmNhdCggYXJncyApICk7XHJcblxyXG5cdFx0cmV0dXJuIHJldHVyblZhbHVlO1xyXG5cdH1cclxufTtcclxuXHJcbi8vIE1ldGhvZHMgYXJlIG5vdCBlbnVtZXJhYmxlIHNvLCB3aGVuIHRoZSBzdG9yZXMgYXJlXHJcbi8vIGV4dGVuZGVkIHdpdGggdGhlIGVtaXR0ZXIsIHRoZXkgY2FuIGJlIGl0ZXJhdGVkIGFzXHJcbi8vIGhhc2htYXBzXHJcbnZhciBFbWl0dGVyID0gVXRpbHMuY3JlYXRlTm9uRW51bWVyYWJsZSggZW1pdHRlclByb3RvICk7XHJcbi8vI2J1aWxkXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEVtaXR0ZXI7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBVdGlscyA9IHJlcXVpcmUoICcuL3V0aWxzLmpzJyApLFxyXG5cdEVtaXR0ZXIgPSByZXF1aXJlKCAnLi9lbWl0dGVyJyApLFxyXG5cdEZyb3plbiA9IHJlcXVpcmUoICcuL2Zyb3plbicgKVxyXG47XHJcblxyXG4vLyNidWlsZFxyXG52YXIgRnJlZXplciA9IGZ1bmN0aW9uKCBpbml0aWFsVmFsdWUsIG9wdGlvbnMgKSB7XHJcblx0dmFyIG1lID0gdGhpcyxcclxuXHRcdG9wcyA9IG9wdGlvbnMgfHwge30sXHJcblx0XHRzdG9yZSA9IHtcclxuXHRcdFx0bGl2ZTogb3BzLmxpdmUgfHwgZmFsc2UsXHJcblx0XHRcdGZyZWV6ZUluc3RhbmNlczogb3BzLmZyZWV6ZUluc3RhbmNlcyB8fCBmYWxzZVxyXG5cdFx0fVxyXG5cdDtcclxuXHJcblx0Ly8gSW1tdXRhYmxlIGRhdGFcclxuXHR2YXIgZnJvemVuO1xyXG5cdHZhciBwaXZvdFRyaWdnZXJzID0gW10sIHBpdm90VGlja2luZyA9IDA7XHJcblx0dmFyIHRyaWdnZXJOb3cgPSBmdW5jdGlvbiggbm9kZSApe1xyXG5cdFx0dmFyIF8gPSBub2RlLl9fLFxyXG5cdFx0XHRpXHJcblx0XHQ7XHJcblxyXG5cdFx0aWYoIF8ubGlzdGVuZXIgKXtcclxuXHRcdFx0dmFyIHByZXZTdGF0ZSA9IF8ubGlzdGVuZXIucHJldlN0YXRlIHx8IG5vZGU7XHJcblx0XHRcdF8ubGlzdGVuZXIucHJldlN0YXRlID0gMDtcclxuXHRcdFx0RnJvemVuLnRyaWdnZXIoIHByZXZTdGF0ZSwgJ3VwZGF0ZScsIG5vZGUsIHRydWUgKTtcclxuXHRcdH1cclxuXHJcblx0XHRmb3IgKGkgPSAwOyBpIDwgXy5wYXJlbnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdF8uc3RvcmUubm90aWZ5KCAnbm93JywgXy5wYXJlbnRzW2ldICk7XHJcblx0XHR9XHJcblx0fTtcclxuXHJcblx0dmFyIGFkZFRvUGl2b3RUcmlnZ2VycyA9IGZ1bmN0aW9uKCBub2RlICl7XHJcblx0XHRwaXZvdFRyaWdnZXJzLnB1c2goIG5vZGUgKTtcclxuXHRcdGlmKCAhcGl2b3RUaWNraW5nICl7XHJcblx0XHRcdHBpdm90VGlja2luZyA9IDE7XHJcblx0XHRcdFV0aWxzLm5leHRUaWNrKCBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdHBpdm90VHJpZ2dlcnMgPSBbXTtcclxuXHRcdFx0XHRwaXZvdFRpY2tpbmcgPSAwO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHRzdG9yZS5ub3RpZnkgPSBmdW5jdGlvbiBub3RpZnkoIGV2ZW50TmFtZSwgbm9kZSwgb3B0aW9ucyApe1xyXG5cdFx0aWYoIGV2ZW50TmFtZSA9PSAnbm93JyApe1xyXG5cdFx0XHRpZiggcGl2b3RUcmlnZ2Vycy5sZW5ndGggKXtcclxuXHRcdFx0XHR3aGlsZSggcGl2b3RUcmlnZ2Vycy5sZW5ndGggKXtcclxuXHRcdFx0XHRcdHRyaWdnZXJOb3coIHBpdm90VHJpZ2dlcnMuc2hpZnQoKSApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHR0cmlnZ2VyTm93KCBub2RlICk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBub2RlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciB1cGRhdGUgPSBGcm96ZW5bZXZlbnROYW1lXSggbm9kZSwgb3B0aW9ucyApO1xyXG5cclxuXHRcdGlmKCBldmVudE5hbWUgIT0gJ3Bpdm90JyApe1xyXG5cdFx0XHR2YXIgcGl2b3QgPSBVdGlscy5maW5kUGl2b3QoIHVwZGF0ZSApO1xyXG5cdFx0XHRpZiggcGl2b3QgKSB7XHJcblx0XHRcdFx0YWRkVG9QaXZvdFRyaWdnZXJzKCB1cGRhdGUgKTtcclxuXHQgIFx0XHRyZXR1cm4gcGl2b3Q7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdXBkYXRlO1xyXG5cdH07XHJcblxyXG5cdHN0b3JlLmZyZWV6ZUZuID0gb3BzLm11dGFibGUgPT09IHRydWUgP1xyXG5cdFx0ZnVuY3Rpb24oKXt9IDpcclxuXHRcdGZ1bmN0aW9uKCBvYmogKXsgT2JqZWN0LmZyZWV6ZSggb2JqICk7IH1cclxuXHQ7XHJcblxyXG5cdC8vIENyZWF0ZSB0aGUgZnJvemVuIG9iamVjdFxyXG5cdGZyb3plbiA9IEZyb3plbi5mcmVlemUoIGluaXRpYWxWYWx1ZSwgc3RvcmUgKTtcclxuXHRmcm96ZW4uX18udXBkYXRlUm9vdCA9IGZ1bmN0aW9uKCBwcmV2Tm9kZSwgdXBkYXRlZCApe1xyXG5cdFx0aWYoIHByZXZOb2RlID09PSBmcm96ZW4gKXtcclxuXHRcdFx0ZnJvemVuID0gdXBkYXRlZDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIExpc3RlbiB0byBpdHMgY2hhbmdlcyBpbW1lZGlhdGVseVxyXG5cdHZhciBsaXN0ZW5lciA9IGZyb3plbi5nZXRMaXN0ZW5lcigpLFxyXG5cdFx0aHViID0ge31cclxuXHQ7XHJcblxyXG5cdFV0aWxzLmVhY2goWydvbicsICdvZmYnLCAnb25jZScsICd0cmlnZ2VyJ10sIGZ1bmN0aW9uKCBtZXRob2QgKXtcclxuXHRcdHZhciBhdHRycyA9IHt9O1xyXG5cdFx0YXR0cnNbIG1ldGhvZCBdID0gbGlzdGVuZXJbbWV0aG9kXS5iaW5kKGxpc3RlbmVyKTtcclxuXHRcdFV0aWxzLmFkZE5FKCBtZSwgYXR0cnMgKTtcclxuXHRcdFV0aWxzLmFkZE5FKCBodWIsIGF0dHJzICk7XHJcblx0fSk7XHJcblxyXG5cdFV0aWxzLmFkZE5FKCB0aGlzLCB7XHJcblx0XHRnZXQ6IGZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmcm96ZW47XHJcblx0XHR9LFxyXG5cdFx0c2V0OiBmdW5jdGlvbiggbm9kZSApe1xyXG5cdFx0XHRmcm96ZW4ucmVzZXQoIG5vZGUgKTtcclxuXHRcdH0sXHJcblx0XHRnZXRFdmVudEh1YjogZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIGh1YjtcclxuXHRcdH1cclxuXHR9KTtcclxuXHJcblx0VXRpbHMuYWRkTkUoIHRoaXMsIHsgZ2V0RGF0YTogdGhpcy5nZXQsIHNldERhdGE6IHRoaXMuc2V0IH0gKTtcclxufTtcclxuXHJcbi8vI2J1aWxkXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZyZWV6ZXI7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBVdGlscyA9IHJlcXVpcmUoICcuL3V0aWxzJyApLFxyXG5cdG5vZGVDcmVhdG9yID0gcmVxdWlyZSggJy4vbm9kZUNyZWF0b3InKSxcclxuXHRFbWl0dGVyID0gcmVxdWlyZSgnLi9lbWl0dGVyJylcclxuO1xyXG5cclxuLy8jYnVpbGRcclxudmFyIEZyb3plbiA9IHtcclxuXHRmcmVlemU6IGZ1bmN0aW9uKCBub2RlLCBzdG9yZSApe1xyXG5cdFx0aWYoIG5vZGUgJiYgbm9kZS5fXyApe1xyXG5cdFx0XHRyZXR1cm4gbm9kZTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHRmcm96ZW4gPSBub2RlQ3JlYXRvci5jbG9uZShub2RlKVxyXG5cdFx0O1xyXG5cclxuXHRcdFV0aWxzLmFkZE5FKCBmcm96ZW4sIHsgX186IHtcclxuXHRcdFx0bGlzdGVuZXI6IGZhbHNlLFxyXG5cdFx0XHRwYXJlbnRzOiBbXSxcclxuXHRcdFx0c3RvcmU6IHN0b3JlXHJcblx0XHR9fSk7XHJcblxyXG5cdFx0Ly8gRnJlZXplIGNoaWxkcmVuXHJcblx0XHRVdGlscy5lYWNoKCBub2RlLCBmdW5jdGlvbiggY2hpbGQsIGtleSApe1xyXG5cdFx0XHRpZiggIVV0aWxzLmlzTGVhZiggY2hpbGQsIHN0b3JlLmZyZWV6ZUluc3RhbmNlcyApICl7XHJcblx0XHRcdFx0Y2hpbGQgPSBtZS5mcmVlemUoIGNoaWxkLCBzdG9yZSApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiggY2hpbGQgJiYgY2hpbGQuX18gKXtcclxuXHRcdFx0XHRtZS5hZGRQYXJlbnQoIGNoaWxkLCBmcm96ZW4gKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnJvemVuWyBrZXkgXSA9IGNoaWxkO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0c3RvcmUuZnJlZXplRm4oIGZyb3plbiApO1xyXG5cclxuXHRcdHJldHVybiBmcm96ZW47XHJcblx0fSxcclxuXHJcblx0bWVyZ2U6IGZ1bmN0aW9uKCBub2RlLCBhdHRycyApe1xyXG5cdFx0dmFyIF8gPSBub2RlLl9fLFxyXG5cdFx0XHR0cmFucyA9IF8udHJhbnMsXHJcblxyXG5cdFx0XHQvLyBDbG9uZSB0aGUgYXR0cnMgdG8gbm90IG1vZGlmeSB0aGUgYXJndW1lbnRcclxuXHRcdFx0YXR0cnMgPSBVdGlscy5leHRlbmQoIHt9LCBhdHRycylcclxuXHRcdDtcclxuXHJcblx0XHRpZiggdHJhbnMgKXtcclxuXHRcdFx0Zm9yKCB2YXIgYXR0ciBpbiBhdHRycyApXHJcblx0XHRcdFx0dHJhbnNbIGF0dHIgXSA9IGF0dHJzWyBhdHRyIF07XHJcblx0XHRcdHJldHVybiBub2RlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdGZyb3plbiA9IHRoaXMuY29weU1ldGEoIG5vZGUgKSxcclxuXHRcdFx0c3RvcmUgPSBfLnN0b3JlLFxyXG5cdFx0XHR2YWwsIGtleSwgaXNGcm96ZW5cclxuXHRcdDtcclxuXHJcblx0XHRVdGlscy5lYWNoKCBub2RlLCBmdW5jdGlvbiggY2hpbGQsIGtleSApe1xyXG5cdFx0XHRpc0Zyb3plbiA9IGNoaWxkICYmIGNoaWxkLl9fO1xyXG5cclxuXHRcdFx0aWYoIGlzRnJvemVuICl7XHJcblx0XHRcdFx0bWUucmVtb3ZlUGFyZW50KCBjaGlsZCwgbm9kZSApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YWwgPSBhdHRyc1sga2V5IF07XHJcblx0XHRcdGlmKCAhdmFsICl7XHJcblx0XHRcdFx0aWYoIGlzRnJvemVuIClcclxuXHRcdFx0XHRcdG1lLmFkZFBhcmVudCggY2hpbGQsIGZyb3plbiApO1xyXG5cdFx0XHRcdHJldHVybiBmcm96ZW5bIGtleSBdID0gY2hpbGQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmKCAhVXRpbHMuaXNMZWFmKCB2YWwsIHN0b3JlLmZyZWV6ZUluc3RhbmNlcyApIClcclxuXHRcdFx0XHR2YWwgPSBtZS5mcmVlemUoIHZhbCwgc3RvcmUgKTtcclxuXHJcblx0XHRcdGlmKCB2YWwgJiYgdmFsLl9fIClcclxuXHRcdFx0XHRtZS5hZGRQYXJlbnQoIHZhbCwgZnJvemVuICk7XHJcblxyXG5cdFx0XHRkZWxldGUgYXR0cnNbIGtleSBdO1xyXG5cclxuXHRcdFx0ZnJvemVuWyBrZXkgXSA9IHZhbDtcclxuXHRcdH0pO1xyXG5cclxuXHJcblx0XHRmb3IoIGtleSBpbiBhdHRycyApIHtcclxuXHRcdFx0dmFsID0gYXR0cnNbIGtleSBdO1xyXG5cclxuXHRcdFx0aWYoICFVdGlscy5pc0xlYWYoIHZhbCwgc3RvcmUuZnJlZXplSW5zdGFuY2VzICkgKVxyXG5cdFx0XHRcdHZhbCA9IG1lLmZyZWV6ZSggdmFsLCBzdG9yZSApO1xyXG5cclxuXHRcdFx0aWYoIHZhbCAmJiB2YWwuX18gKVxyXG5cdFx0XHRcdG1lLmFkZFBhcmVudCggdmFsLCBmcm96ZW4gKTtcclxuXHJcblx0XHRcdGZyb3plblsga2V5IF0gPSB2YWw7XHJcblx0XHR9XHJcblxyXG5cdFx0Xy5zdG9yZS5mcmVlemVGbiggZnJvemVuICk7XHJcblxyXG5cdFx0dGhpcy5yZWZyZXNoUGFyZW50cyggbm9kZSwgZnJvemVuICk7XHJcblxyXG5cdFx0cmV0dXJuIGZyb3plbjtcclxuXHR9LFxyXG5cclxuXHRyZXBsYWNlOiBmdW5jdGlvbiggbm9kZSwgcmVwbGFjZW1lbnQgKSB7XHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHRfID0gbm9kZS5fXyxcclxuXHRcdFx0ZnJvemVuID0gcmVwbGFjZW1lbnRcclxuXHRcdDtcclxuXHJcblx0XHRpZiggIVV0aWxzLmlzTGVhZiggcmVwbGFjZW1lbnQsIF8uc3RvcmUuZnJlZXplSW5zdGFuY2VzICkgKSB7XHJcblxyXG5cdFx0XHRmcm96ZW4gPSBtZS5mcmVlemUoIHJlcGxhY2VtZW50LCBfLnN0b3JlICk7XHJcblx0XHRcdGZyb3plbi5fXy5wYXJlbnRzID0gXy5wYXJlbnRzO1xyXG5cdFx0XHRmcm96ZW4uX18udXBkYXRlUm9vdCA9IF8udXBkYXRlUm9vdDtcclxuXHJcblx0XHRcdC8vIEFkZCB0aGUgY3VycmVudCBsaXN0ZW5lciBpZiBleGlzdHMsIHJlcGxhY2luZyBhXHJcblx0XHRcdC8vIHByZXZpb3VzIGxpc3RlbmVyIGluIHRoZSBmcm96ZW4gaWYgZXhpc3RlZFxyXG5cdFx0XHRpZiggXy5saXN0ZW5lciApXHJcblx0XHRcdFx0ZnJvemVuLl9fLmxpc3RlbmVyID0gXy5saXN0ZW5lcjtcclxuXHRcdH1cclxuXHRcdGlmKCBmcm96ZW4gKXtcclxuXHRcdFx0dGhpcy5maXhDaGlsZHJlbiggZnJvemVuLCBub2RlICk7XHJcblx0XHR9XHJcblx0XHR0aGlzLnJlZnJlc2hQYXJlbnRzKCBub2RlLCBmcm96ZW4gKTtcclxuXHJcblx0XHRyZXR1cm4gZnJvemVuO1xyXG5cdH0sXHJcblxyXG5cdHJlbW92ZTogZnVuY3Rpb24oIG5vZGUsIGF0dHJzICl7XHJcblx0XHR2YXIgdHJhbnMgPSBub2RlLl9fLnRyYW5zO1xyXG5cdFx0aWYoIHRyYW5zICl7XHJcblx0XHRcdGZvciggdmFyIGwgPSBhdHRycy5sZW5ndGggLSAxOyBsID49IDA7IGwtLSApXHJcblx0XHRcdFx0ZGVsZXRlIHRyYW5zWyBhdHRyc1tsXSBdO1xyXG5cdFx0XHRyZXR1cm4gbm9kZTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHRmcm96ZW4gPSB0aGlzLmNvcHlNZXRhKCBub2RlICksXHJcblx0XHRcdGlzRnJvemVuXHJcblx0XHQ7XHJcblxyXG5cdFx0VXRpbHMuZWFjaCggbm9kZSwgZnVuY3Rpb24oIGNoaWxkLCBrZXkgKXtcclxuXHRcdFx0aXNGcm96ZW4gPSBjaGlsZCAmJiBjaGlsZC5fXztcclxuXHJcblx0XHRcdGlmKCBpc0Zyb3plbiApe1xyXG5cdFx0XHRcdG1lLnJlbW92ZVBhcmVudCggY2hpbGQsIG5vZGUgKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYoIGF0dHJzLmluZGV4T2YoIGtleSApICE9IC0xICl7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiggaXNGcm96ZW4gKVxyXG5cdFx0XHRcdG1lLmFkZFBhcmVudCggY2hpbGQsIGZyb3plbiApO1xyXG5cclxuXHRcdFx0ZnJvemVuWyBrZXkgXSA9IGNoaWxkO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0bm9kZS5fXy5zdG9yZS5mcmVlemVGbiggZnJvemVuICk7XHJcblx0XHR0aGlzLnJlZnJlc2hQYXJlbnRzKCBub2RlLCBmcm96ZW4gKTtcclxuXHJcblx0XHRyZXR1cm4gZnJvemVuO1xyXG5cdH0sXHJcblxyXG5cdHNwbGljZTogZnVuY3Rpb24oIG5vZGUsIGFyZ3MgKXtcclxuXHRcdHZhciBfID0gbm9kZS5fXyxcclxuXHRcdFx0dHJhbnMgPSBfLnRyYW5zXHJcblx0XHQ7XHJcblxyXG5cdFx0aWYoIHRyYW5zICl7XHJcblx0XHRcdHRyYW5zLnNwbGljZS5hcHBseSggdHJhbnMsIGFyZ3MgKTtcclxuXHRcdFx0cmV0dXJuIG5vZGU7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIG1lID0gdGhpcyxcclxuXHRcdFx0ZnJvemVuID0gdGhpcy5jb3B5TWV0YSggbm9kZSApLFxyXG5cdFx0XHRpbmRleCA9IGFyZ3NbMF0sXHJcblx0XHRcdGRlbGV0ZUluZGV4ID0gaW5kZXggKyBhcmdzWzFdLFxyXG5cdFx0XHRjaGlsZFxyXG5cdFx0O1xyXG5cclxuXHRcdC8vIENsb25lIHRoZSBhcnJheVxyXG5cdFx0VXRpbHMuZWFjaCggbm9kZSwgZnVuY3Rpb24oIGNoaWxkLCBpICl7XHJcblxyXG5cdFx0XHRpZiggY2hpbGQgJiYgY2hpbGQuX18gKXtcclxuXHRcdFx0XHRtZS5yZW1vdmVQYXJlbnQoIGNoaWxkLCBub2RlICk7XHJcblxyXG5cdFx0XHRcdC8vIFNraXAgdGhlIG5vZGVzIHRvIGRlbGV0ZVxyXG5cdFx0XHRcdGlmKCBpIDwgaW5kZXggfHwgaT49IGRlbGV0ZUluZGV4IClcclxuXHRcdFx0XHRcdG1lLmFkZFBhcmVudCggY2hpbGQsIGZyb3plbiApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmcm96ZW5baV0gPSBjaGlsZDtcclxuXHRcdH0pO1xyXG5cclxuXHRcdC8vIFByZXBhcmUgdGhlIG5ldyBub2Rlc1xyXG5cdFx0aWYoIGFyZ3MubGVuZ3RoID4gMSApe1xyXG5cdFx0XHRmb3IgKHZhciBpID0gYXJncy5sZW5ndGggLSAxOyBpID49IDI7IGktLSkge1xyXG5cdFx0XHRcdGNoaWxkID0gYXJnc1tpXTtcclxuXHJcblx0XHRcdFx0aWYoICFVdGlscy5pc0xlYWYoIGNoaWxkLCBfLnN0b3JlLmZyZWV6ZUluc3RhbmNlcyApIClcclxuXHRcdFx0XHRcdGNoaWxkID0gdGhpcy5mcmVlemUoIGNoaWxkLCBfLnN0b3JlICk7XHJcblxyXG5cdFx0XHRcdGlmKCBjaGlsZCAmJiBjaGlsZC5fXyApXHJcblx0XHRcdFx0XHR0aGlzLmFkZFBhcmVudCggY2hpbGQsIGZyb3plbiApO1xyXG5cclxuXHRcdFx0XHRhcmdzW2ldID0gY2hpbGQ7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHQvLyBzcGxpY2VcclxuXHRcdEFycmF5LnByb3RvdHlwZS5zcGxpY2UuYXBwbHkoIGZyb3plbiwgYXJncyApO1xyXG5cclxuXHRcdF8uc3RvcmUuZnJlZXplRm4oIGZyb3plbiApO1xyXG5cdFx0dGhpcy5yZWZyZXNoUGFyZW50cyggbm9kZSwgZnJvemVuICk7XHJcblxyXG5cdFx0cmV0dXJuIGZyb3plbjtcclxuXHR9LFxyXG5cclxuXHR0cmFuc2FjdDogZnVuY3Rpb24oIG5vZGUgKSB7XHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHR0cmFuc2FjdGluZyA9IG5vZGUuX18udHJhbnMsXHJcblx0XHRcdHRyYW5zXHJcblx0XHQ7XHJcblxyXG5cdFx0aWYoIHRyYW5zYWN0aW5nIClcclxuXHRcdFx0cmV0dXJuIHRyYW5zYWN0aW5nO1xyXG5cclxuXHRcdHRyYW5zID0gbm9kZS5jb25zdHJ1Y3RvciA9PSBBcnJheSA/IFtdIDoge307XHJcblxyXG5cdFx0VXRpbHMuZWFjaCggbm9kZSwgZnVuY3Rpb24oIGNoaWxkLCBrZXkgKXtcclxuXHRcdFx0dHJhbnNbIGtleSBdID0gY2hpbGQ7XHJcblx0XHR9KTtcclxuXHJcblx0XHRub2RlLl9fLnRyYW5zID0gdHJhbnM7XHJcblxyXG5cdFx0Ly8gQ2FsbCBydW4gYXV0b21hdGljYWxseSBpbiBjYXNlXHJcblx0XHQvLyB0aGUgdXNlciBmb3Jnb3QgYWJvdXQgaXRcclxuXHRcdFV0aWxzLm5leHRUaWNrKCBmdW5jdGlvbigpe1xyXG5cdFx0XHRpZiggbm9kZS5fXy50cmFucyApXHJcblx0XHRcdFx0bWUucnVuKCBub2RlICk7XHJcblx0XHR9KTtcclxuXHJcblx0XHRyZXR1cm4gdHJhbnM7XHJcblx0fSxcclxuXHJcblx0cnVuOiBmdW5jdGlvbiggbm9kZSApIHtcclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdHRyYW5zID0gbm9kZS5fXy50cmFuc1xyXG5cdFx0O1xyXG5cclxuXHRcdGlmKCAhdHJhbnMgKVxyXG5cdFx0XHRyZXR1cm4gbm9kZTtcclxuXHJcblx0XHQvLyBSZW1vdmUgdGhlIG5vZGUgYXMgYSBwYXJlbnRcclxuXHRcdFV0aWxzLmVhY2goIHRyYW5zLCBmdW5jdGlvbiggY2hpbGQsIGtleSApe1xyXG5cdFx0XHRpZiggY2hpbGQgJiYgY2hpbGQuX18gKXtcclxuXHRcdFx0XHRtZS5yZW1vdmVQYXJlbnQoIGNoaWxkLCBub2RlICk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cclxuXHRcdGRlbGV0ZSBub2RlLl9fLnRyYW5zO1xyXG5cclxuXHRcdHZhciByZXN1bHQgPSB0aGlzLnJlcGxhY2UoIG5vZGUsIHRyYW5zICk7XHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH0sXHJcblxyXG5cdHBpdm90OiBmdW5jdGlvbiggbm9kZSApe1xyXG5cdFx0bm9kZS5fXy5waXZvdCA9IDE7XHJcblx0XHR0aGlzLnVucGl2b3QoIG5vZGUgKTtcclxuXHRcdHJldHVybiBub2RlO1xyXG5cdH0sXHJcblxyXG5cdHVucGl2b3Q6IGZ1bmN0aW9uKCBub2RlICl7XHJcblx0XHRVdGlscy5uZXh0VGljayggZnVuY3Rpb24oKXtcclxuXHRcdFx0bm9kZS5fXy5waXZvdCA9IDA7XHJcblx0XHR9KTtcclxuXHR9LFxyXG5cclxuXHRyZWZyZXNoOiBmdW5jdGlvbiggbm9kZSwgb2xkQ2hpbGQsIG5ld0NoaWxkICl7XHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHR0cmFucyA9IG5vZGUuX18udHJhbnMsXHJcblx0XHRcdGZvdW5kID0gMFxyXG5cdFx0O1xyXG5cclxuXHRcdGlmKCB0cmFucyApe1xyXG5cclxuXHRcdFx0VXRpbHMuZWFjaCggdHJhbnMsIGZ1bmN0aW9uKCBjaGlsZCwga2V5ICl7XHJcblx0XHRcdFx0aWYoIGZvdW5kICkgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHRpZiggY2hpbGQgPT09IG9sZENoaWxkICl7XHJcblxyXG5cdFx0XHRcdFx0dHJhbnNbIGtleSBdID0gbmV3Q2hpbGQ7XHJcblx0XHRcdFx0XHRmb3VuZCA9IDE7XHJcblxyXG5cdFx0XHRcdFx0aWYoIG5ld0NoaWxkICYmIG5ld0NoaWxkLl9fIClcclxuXHRcdFx0XHRcdFx0bWUuYWRkUGFyZW50KCBuZXdDaGlsZCwgbm9kZSApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRyZXR1cm4gbm9kZTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZnJvemVuID0gdGhpcy5jb3B5TWV0YSggbm9kZSApLFxyXG5cdFx0XHRyZXBsYWNlbWVudCwgX19cclxuXHRcdDtcclxuXHJcblx0XHRVdGlscy5lYWNoKCBub2RlLCBmdW5jdGlvbiggY2hpbGQsIGtleSApe1xyXG5cdFx0XHRpZiggY2hpbGQgPT09IG9sZENoaWxkICl7XHJcblx0XHRcdFx0Y2hpbGQgPSBuZXdDaGlsZDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYoIGNoaWxkICYmIChfXyA9IGNoaWxkLl9fKSApe1xyXG5cdFx0XHRcdG1lLnJlbW92ZVBhcmVudCggY2hpbGQsIG5vZGUgKTtcclxuXHRcdFx0XHRtZS5hZGRQYXJlbnQoIGNoaWxkLCBmcm96ZW4gKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnJvemVuWyBrZXkgXSA9IGNoaWxkO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0bm9kZS5fXy5zdG9yZS5mcmVlemVGbiggZnJvemVuICk7XHJcblxyXG5cdFx0dGhpcy5yZWZyZXNoUGFyZW50cyggbm9kZSwgZnJvemVuICk7XHJcblx0fSxcclxuXHJcblx0Zml4Q2hpbGRyZW46IGZ1bmN0aW9uKCBub2RlLCBvbGROb2RlICl7XHJcblx0XHR2YXIgbWUgPSB0aGlzO1xyXG5cdFx0VXRpbHMuZWFjaCggbm9kZSwgZnVuY3Rpb24oIGNoaWxkICl7XHJcblx0XHRcdGlmKCAhY2hpbGQgfHwgIWNoaWxkLl9fIClcclxuXHRcdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0XHQvLyBVcGRhdGUgcGFyZW50cyBpbiBhbGwgY2hpbGRyZW4gbm8gbWF0dGVyIHRoZSBjaGlsZFxyXG5cdFx0XHQvLyBpcyBsaW5rZWQgdG8gdGhlIG5vZGUgb3Igbm90LlxyXG5cdFx0XHRtZS5maXhDaGlsZHJlbiggY2hpbGQgKTtcclxuXHJcblx0XHRcdGlmKCBjaGlsZC5fXy5wYXJlbnRzLmxlbmd0aCA9PSAxIClcclxuXHRcdFx0XHRyZXR1cm4gY2hpbGQuX18ucGFyZW50cyA9IFsgbm9kZSBdO1xyXG5cclxuXHRcdFx0aWYoIG9sZE5vZGUgKVxyXG5cdFx0XHRcdG1lLnJlbW92ZVBhcmVudCggY2hpbGQsIG9sZE5vZGUgKTtcclxuXHJcblx0XHRcdG1lLmFkZFBhcmVudCggY2hpbGQsIG5vZGUgKTtcclxuXHRcdH0pO1xyXG5cdH0sXHJcblxyXG5cdGNvcHlNZXRhOiBmdW5jdGlvbiggbm9kZSApe1xyXG5cdFx0dmFyIG1lID0gdGhpcyxcclxuXHRcdFx0ZnJvemVuID0gbm9kZUNyZWF0b3IuY2xvbmUoIG5vZGUgKSxcclxuXHRcdFx0XyA9IG5vZGUuX19cclxuXHRcdDtcclxuXHJcblx0XHRVdGlscy5hZGRORSggZnJvemVuLCB7X186IHtcclxuXHRcdFx0c3RvcmU6IF8uc3RvcmUsXHJcblx0XHRcdHVwZGF0ZVJvb3Q6IF8udXBkYXRlUm9vdCxcclxuXHRcdFx0bGlzdGVuZXI6IF8ubGlzdGVuZXIsXHJcblx0XHRcdHBhcmVudHM6IF8ucGFyZW50cy5zbGljZSggMCApLFxyXG5cdFx0XHR0cmFuczogXy50cmFucyxcclxuXHRcdFx0cGl2b3Q6IF8ucGl2b3QsXHJcblx0XHR9fSk7XHJcblxyXG5cdFx0aWYoIF8ucGl2b3QgKVxyXG5cdFx0XHR0aGlzLnVucGl2b3QoIGZyb3plbiApO1xyXG5cclxuXHRcdHJldHVybiBmcm96ZW47XHJcblx0fSxcclxuXHJcblx0cmVmcmVzaFBhcmVudHM6IGZ1bmN0aW9uKCBvbGRDaGlsZCwgbmV3Q2hpbGQgKXtcclxuXHRcdHZhciBfID0gb2xkQ2hpbGQuX18sXHJcblx0XHRcdHBhcmVudHMgPSBfLnBhcmVudHMubGVuZ3RoLFxyXG5cdFx0XHRpXHJcblx0XHQ7XHJcblxyXG5cdFx0aWYoIG9sZENoaWxkLl9fLnVwZGF0ZVJvb3QgKXtcclxuXHRcdFx0b2xkQ2hpbGQuX18udXBkYXRlUm9vdCggb2xkQ2hpbGQsIG5ld0NoaWxkICk7XHJcblx0XHR9XHJcblx0XHRpZiggbmV3Q2hpbGQgKXtcclxuXHRcdFx0dGhpcy50cmlnZ2VyKCBvbGRDaGlsZCwgJ3VwZGF0ZScsIG5ld0NoaWxkLCBfLnN0b3JlLmxpdmUgKTtcclxuXHRcdH1cclxuXHRcdGlmKCBwYXJlbnRzICl7XHJcblx0XHRcdGZvciAoaSA9IHBhcmVudHMgLSAxOyBpID49IDA7IGktLSkge1xyXG5cdFx0XHRcdHRoaXMucmVmcmVzaCggXy5wYXJlbnRzW2ldLCBvbGRDaGlsZCwgbmV3Q2hpbGQgKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdHJlbW92ZVBhcmVudDogZnVuY3Rpb24oIG5vZGUsIHBhcmVudCApe1xyXG5cdFx0dmFyIHBhcmVudHMgPSBub2RlLl9fLnBhcmVudHMsXHJcblx0XHRcdGluZGV4ID0gcGFyZW50cy5pbmRleE9mKCBwYXJlbnQgKVxyXG5cdFx0O1xyXG5cclxuXHRcdGlmKCBpbmRleCAhPSAtMSApe1xyXG5cdFx0XHRwYXJlbnRzLnNwbGljZSggaW5kZXgsIDEgKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRhZGRQYXJlbnQ6IGZ1bmN0aW9uKCBub2RlLCBwYXJlbnQgKXtcclxuXHRcdHZhciBwYXJlbnRzID0gbm9kZS5fXy5wYXJlbnRzLFxyXG5cdFx0XHRpbmRleCA9IHBhcmVudHMuaW5kZXhPZiggcGFyZW50IClcclxuXHRcdDtcclxuXHJcblx0XHRpZiggaW5kZXggPT0gLTEgKXtcclxuXHRcdFx0cGFyZW50c1sgcGFyZW50cy5sZW5ndGggXSA9IHBhcmVudDtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHR0cmlnZ2VyOiBmdW5jdGlvbiggbm9kZSwgZXZlbnROYW1lLCBwYXJhbSwgbm93ICl7XHJcblx0XHR2YXIgbGlzdGVuZXIgPSBub2RlLl9fLmxpc3RlbmVyO1xyXG5cdFx0aWYoICFsaXN0ZW5lciApXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHR2YXIgdGlja2luZyA9IGxpc3RlbmVyLnRpY2tpbmc7XHJcblxyXG5cdFx0aWYoIG5vdyApe1xyXG5cdFx0XHRpZiggdGlja2luZyB8fCBwYXJhbSApe1xyXG5cdFx0XHRcdGxpc3RlbmVyLnRpY2tpbmcgPSAwO1xyXG5cdFx0XHRcdGxpc3RlbmVyLnRyaWdnZXIoIGV2ZW50TmFtZSwgdGlja2luZyB8fCBwYXJhbSwgbm9kZSApO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRsaXN0ZW5lci50aWNraW5nID0gcGFyYW07XHJcblx0XHRpZiggIWxpc3RlbmVyLnByZXZTdGF0ZSApe1xyXG5cdFx0XHRsaXN0ZW5lci5wcmV2U3RhdGUgPSBub2RlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmKCAhdGlja2luZyApe1xyXG5cdFx0XHRVdGlscy5uZXh0VGljayggZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRpZiggbGlzdGVuZXIudGlja2luZyApe1xyXG5cdFx0XHRcdFx0dmFyIHVwZGF0ZWQgPSBsaXN0ZW5lci50aWNraW5nLFxyXG5cdFx0XHRcdFx0XHRwcmV2U3RhdGUgPSBsaXN0ZW5lci5wcmV2U3RhdGVcclxuXHRcdFx0XHRcdDtcclxuXHJcblx0XHRcdFx0XHRsaXN0ZW5lci50aWNraW5nID0gMDtcclxuXHRcdFx0XHRcdGxpc3RlbmVyLnByZXZTdGF0ZSA9IDA7XHJcblxyXG5cdFx0XHRcdFx0bGlzdGVuZXIudHJpZ2dlciggZXZlbnROYW1lLCB1cGRhdGVkLCBub2RlICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRjcmVhdGVMaXN0ZW5lcjogZnVuY3Rpb24oIGZyb3plbiApe1xyXG5cdFx0dmFyIGwgPSBmcm96ZW4uX18ubGlzdGVuZXI7XHJcblxyXG5cdFx0aWYoICFsICkge1xyXG5cdFx0XHRsID0gT2JqZWN0LmNyZWF0ZShFbWl0dGVyLCB7XHJcblx0XHRcdFx0X2V2ZW50czoge1xyXG5cdFx0XHRcdFx0dmFsdWU6IHt9LFxyXG5cdFx0XHRcdFx0d3JpdGFibGU6IHRydWVcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0ZnJvemVuLl9fLmxpc3RlbmVyID0gbDtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbDtcclxuXHR9XHJcbn07XHJcblxyXG5ub2RlQ3JlYXRvci5pbml0KCBGcm96ZW4gKTtcclxuLy8jYnVpbGRcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRnJvemVuO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgVXRpbHMgPSByZXF1aXJlKCAnLi91dGlscy5qcycgKTtcclxuXHJcbi8vI2J1aWxkXHJcbnZhciBub2RlQ3JlYXRvciA9IHtcclxuXHRpbml0OiBmdW5jdGlvbiggRnJvemVuICl7XHJcblxyXG5cdFx0dmFyIGNvbW1vbk1ldGhvZHMgPSB7XHJcblx0XHRcdHNldDogZnVuY3Rpb24oIGF0dHIsIHZhbHVlICl7XHJcblx0XHRcdFx0dmFyIGF0dHJzID0gYXR0cixcclxuXHRcdFx0XHRcdHVwZGF0ZSA9IHRoaXMuX18udHJhbnNcclxuXHRcdFx0XHQ7XHJcblxyXG5cdFx0XHRcdGlmKCB0eXBlb2YgYXR0ciAhPSAnb2JqZWN0JyApe1xyXG5cdFx0XHRcdFx0YXR0cnMgPSB7fTtcclxuXHRcdFx0XHRcdGF0dHJzWyBhdHRyIF0gPSB2YWx1ZTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmKCAhdXBkYXRlICl7XHJcblx0XHRcdFx0XHRmb3IoIHZhciBrZXkgaW4gYXR0cnMgKXtcclxuXHRcdFx0XHRcdFx0dXBkYXRlID0gdXBkYXRlIHx8IHRoaXNbIGtleSBdICE9PSBhdHRyc1sga2V5IF07XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Ly8gTm8gY2hhbmdlcywganVzdCByZXR1cm4gdGhlIG5vZGVcclxuXHRcdFx0XHRcdGlmKCAhdXBkYXRlIClcclxuXHRcdFx0XHRcdFx0cmV0dXJuIFV0aWxzLmZpbmRQaXZvdCggdGhpcyApIHx8IHRoaXM7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fXy5zdG9yZS5ub3RpZnkoICdtZXJnZScsIHRoaXMsIGF0dHJzICk7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRyZXNldDogZnVuY3Rpb24oIGF0dHJzICkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3JlcGxhY2UnLCB0aGlzLCBhdHRycyApO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0Z2V0TGlzdGVuZXI6IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0cmV0dXJuIEZyb3plbi5jcmVhdGVMaXN0ZW5lciggdGhpcyApO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0dG9KUzogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHR2YXIganM7XHJcblx0XHRcdFx0aWYoIHRoaXMuY29uc3RydWN0b3IgPT0gQXJyYXkgKXtcclxuXHRcdFx0XHRcdGpzID0gbmV3IEFycmF5KCB0aGlzLmxlbmd0aCApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGpzID0ge307XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRVdGlscy5lYWNoKCB0aGlzLCBmdW5jdGlvbiggY2hpbGQsIGkgKXtcclxuXHRcdFx0XHRcdGlmKCBjaGlsZCAmJiBjaGlsZC5fXyApXHJcblx0XHRcdFx0XHRcdGpzWyBpIF0gPSBjaGlsZC50b0pTKCk7XHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdGpzWyBpIF0gPSBjaGlsZDtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0cmV0dXJuIGpzO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0dHJhbnNhY3Q6IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX18uc3RvcmUubm90aWZ5KCAndHJhbnNhY3QnLCB0aGlzICk7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRydW46IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX18uc3RvcmUubm90aWZ5KCAncnVuJywgdGhpcyApO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0bm93OiBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ25vdycsIHRoaXMgKTtcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHBpdm90OiBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3Bpdm90JywgdGhpcyApO1xyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdHZhciBhcnJheU1ldGhvZHMgPSBVdGlscy5leHRlbmQoe1xyXG5cdFx0XHRwdXNoOiBmdW5jdGlvbiggZWwgKXtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hcHBlbmQoIFtlbF0gKTtcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdGFwcGVuZDogZnVuY3Rpb24oIGVscyApe1xyXG5cdFx0XHRcdGlmKCBlbHMgJiYgZWxzLmxlbmd0aCApXHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5fXy5zdG9yZS5ub3RpZnkoICdzcGxpY2UnLCB0aGlzLCBbdGhpcy5sZW5ndGgsIDBdLmNvbmNhdCggZWxzICkgKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHBvcDogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRpZiggIXRoaXMubGVuZ3RoIClcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fXy5zdG9yZS5ub3RpZnkoICdzcGxpY2UnLCB0aGlzLCBbdGhpcy5sZW5ndGggLTEsIDFdICk7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHR1bnNoaWZ0OiBmdW5jdGlvbiggZWwgKXtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wcmVwZW5kKCBbZWxdICk7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRwcmVwZW5kOiBmdW5jdGlvbiggZWxzICl7XHJcblx0XHRcdFx0aWYoIGVscyAmJiBlbHMubGVuZ3RoIClcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3NwbGljZScsIHRoaXMsIFswLCAwXS5jb25jYXQoIGVscyApICk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRzaGlmdDogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRpZiggIXRoaXMubGVuZ3RoIClcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fXy5zdG9yZS5ub3RpZnkoICdzcGxpY2UnLCB0aGlzLCBbMCwgMV0gKTtcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHNwbGljZTogZnVuY3Rpb24oIGluZGV4LCB0b1JlbW92ZSwgdG9BZGQgKXtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fXy5zdG9yZS5ub3RpZnkoICdzcGxpY2UnLCB0aGlzLCBhcmd1bWVudHMgKTtcclxuXHRcdFx0fVxyXG5cdFx0fSwgY29tbW9uTWV0aG9kcyApO1xyXG5cclxuXHRcdHZhciBGcm96ZW5BcnJheSA9IE9iamVjdC5jcmVhdGUoIEFycmF5LnByb3RvdHlwZSwgVXRpbHMuY3JlYXRlTkUoIGFycmF5TWV0aG9kcyApICk7XHJcblxyXG5cdFx0dmFyIG9iamVjdE1ldGhvZHMgPSBVdGlscy5jcmVhdGVORSggVXRpbHMuZXh0ZW5kKHtcclxuXHRcdFx0cmVtb3ZlOiBmdW5jdGlvbigga2V5cyApe1xyXG5cdFx0XHRcdHZhciBmaWx0ZXJlZCA9IFtdLFxyXG5cdFx0XHRcdFx0ayA9IGtleXNcclxuXHRcdFx0XHQ7XHJcblxyXG5cdFx0XHRcdGlmKCBrZXlzLmNvbnN0cnVjdG9yICE9IEFycmF5IClcclxuXHRcdFx0XHRcdGsgPSBbIGtleXMgXTtcclxuXHJcblx0XHRcdFx0Zm9yKCB2YXIgaSA9IDAsIGwgPSBrLmxlbmd0aDsgaTxsOyBpKysgKXtcclxuXHRcdFx0XHRcdGlmKCB0aGlzLmhhc093blByb3BlcnR5KCBrW2ldICkgKVxyXG5cdFx0XHRcdFx0XHRmaWx0ZXJlZC5wdXNoKCBrW2ldICk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiggZmlsdGVyZWQubGVuZ3RoIClcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3JlbW92ZScsIHRoaXMsIGZpbHRlcmVkICk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdH1cclxuXHRcdH0sIGNvbW1vbk1ldGhvZHMpKTtcclxuXHJcblx0XHR2YXIgRnJvemVuT2JqZWN0ID0gT2JqZWN0LmNyZWF0ZSggT2JqZWN0LnByb3RvdHlwZSwgb2JqZWN0TWV0aG9kcyApO1xyXG5cclxuXHRcdHZhciBjcmVhdGVBcnJheSA9IChmdW5jdGlvbigpe1xyXG5cdFx0XHQvLyBmYXN0IHZlcnNpb25cclxuXHRcdFx0aWYoIFtdLl9fcHJvdG9fXyApXHJcblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCBsZW5ndGggKXtcclxuXHRcdFx0XHRcdHZhciBhcnIgPSBuZXcgQXJyYXkoIGxlbmd0aCApO1xyXG5cdFx0XHRcdFx0YXJyLl9fcHJvdG9fXyA9IEZyb3plbkFycmF5O1xyXG5cdFx0XHRcdFx0cmV0dXJuIGFycjtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBzbG93IHZlcnNpb24gZm9yIG9sZGVyIGJyb3dzZXJzXHJcblx0XHRcdHJldHVybiBmdW5jdGlvbiggbGVuZ3RoICl7XHJcblx0XHRcdFx0dmFyIGFyciA9IG5ldyBBcnJheSggbGVuZ3RoICk7XHJcblxyXG5cdFx0XHRcdGZvciggdmFyIG0gaW4gYXJyYXlNZXRob2RzICl7XHJcblx0XHRcdFx0XHRhcnJbIG0gXSA9IGFycmF5TWV0aG9kc1sgbSBdO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmV0dXJuIGFycjtcclxuXHRcdFx0fVxyXG5cdFx0fSkoKTtcclxuXHJcblx0XHR0aGlzLmNsb25lID0gZnVuY3Rpb24oIG5vZGUgKXtcclxuXHRcdFx0dmFyIGNvbnMgPSBub2RlLmNvbnN0cnVjdG9yO1xyXG5cdFx0XHRpZiggY29ucyA9PSBBcnJheSApe1xyXG5cdFx0XHRcdHJldHVybiBjcmVhdGVBcnJheSggbm9kZS5sZW5ndGggKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRpZiggY29ucyA9PT0gT2JqZWN0ICl7XHJcblx0XHRcdFx0XHRyZXR1cm4gT2JqZWN0LmNyZWF0ZSggRnJvemVuT2JqZWN0ICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIENsYXNzIGluc3RhbmNlc1xyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0cmV0dXJuIE9iamVjdC5jcmVhdGUoIGNvbnMucHJvdG90eXBlLCBvYmplY3RNZXRob2RzICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG59XHJcbi8vI2J1aWxkXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5vZGVDcmVhdG9yO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vLyNidWlsZFxyXG52YXIgZ2xvYmFsID0gKG5ldyBGdW5jdGlvbihcInJldHVybiB0aGlzXCIpKCkpO1xyXG5cclxudmFyIFV0aWxzID0ge1xyXG5cdGV4dGVuZDogZnVuY3Rpb24oIG9iLCBwcm9wcyApe1xyXG5cdFx0Zm9yKCB2YXIgcCBpbiBwcm9wcyApe1xyXG5cdFx0XHRvYltwXSA9IHByb3BzW3BdO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIG9iO1xyXG5cdH0sXHJcblxyXG5cdGNyZWF0ZU5vbkVudW1lcmFibGU6IGZ1bmN0aW9uKCBvYmosIHByb3RvICl7XHJcblx0XHR2YXIgbmUgPSB7fTtcclxuXHRcdGZvciggdmFyIGtleSBpbiBvYmogKVxyXG5cdFx0XHRuZVtrZXldID0ge3ZhbHVlOiBvYmpba2V5XSB9O1xyXG5cdFx0cmV0dXJuIE9iamVjdC5jcmVhdGUoIHByb3RvIHx8IHt9LCBuZSApO1xyXG5cdH0sXHJcblxyXG5cdGVycm9yOiBmdW5jdGlvbiggbWVzc2FnZSApe1xyXG5cdFx0dmFyIGVyciA9IG5ldyBFcnJvciggbWVzc2FnZSApO1xyXG5cdFx0aWYoIGNvbnNvbGUgKVxyXG5cdFx0XHRyZXR1cm4gY29uc29sZS5lcnJvciggZXJyICk7XHJcblx0XHRlbHNlXHJcblx0XHRcdHRocm93IGVycjtcclxuXHR9LFxyXG5cclxuXHRlYWNoOiBmdW5jdGlvbiggbywgY2xiayApe1xyXG5cdFx0dmFyIGksbCxrZXlzO1xyXG5cdFx0aWYoIG8gJiYgby5jb25zdHJ1Y3RvciA9PSBBcnJheSApe1xyXG5cdFx0XHRmb3IgKGkgPSAwLCBsID0gby5sZW5ndGg7IGkgPCBsOyBpKyspXHJcblx0XHRcdFx0Y2xiayggb1tpXSwgaSApO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGtleXMgPSBPYmplY3Qua2V5cyggbyApO1xyXG5cdFx0XHRmb3IoIGkgPSAwLCBsID0ga2V5cy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG5cdFx0XHRcdGNsYmsoIG9bIGtleXNbaV0gXSwga2V5c1tpXSApO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdGFkZE5FOiBmdW5jdGlvbiggbm9kZSwgYXR0cnMgKXtcclxuXHRcdGZvciggdmFyIGtleSBpbiBhdHRycyApe1xyXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoIG5vZGUsIGtleSwge1xyXG5cdFx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHR3cml0YWJsZTogdHJ1ZSxcclxuXHRcdFx0XHR2YWx1ZTogYXR0cnNbIGtleSBdXHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIENyZWF0ZXMgbm9uLWVudW1lcmFibGUgcHJvcGVydHkgZGVzY3JpcHRvcnMsIHRvIGJlIHVzZWQgYnkgT2JqZWN0LmNyZWF0ZS5cclxuXHQgKiBAcGFyYW0gIHtPYmplY3R9IGF0dHJzIFByb3BlcnRpZXMgdG8gY3JlYXRlIGRlc2NyaXB0b3JzXHJcblx0ICogQHJldHVybiB7T2JqZWN0fSAgICAgICBBIGhhc2ggd2l0aCB0aGUgZGVzY3JpcHRvcnMuXHJcblx0ICovXHJcblx0Y3JlYXRlTkU6IGZ1bmN0aW9uKCBhdHRycyApe1xyXG5cdFx0dmFyIG5lID0ge307XHJcblxyXG5cdFx0Zm9yKCB2YXIga2V5IGluIGF0dHJzICl7XHJcblx0XHRcdG5lWyBrZXkgXSA9IHtcclxuXHRcdFx0XHR3cml0YWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRjb25maWd1cmFibGU6IHRydWUsXHJcblx0XHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXHJcblx0XHRcdFx0dmFsdWU6IGF0dHJzWyBrZXkgXVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG5lO1xyXG5cdH0sXHJcblxyXG5cdC8vIG5leHRUaWNrIC0gYnkgc3RhZ2FzIC8gcHVibGljIGRvbWFpblxyXG5cdG5leHRUaWNrOiAoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHF1ZXVlID0gW10sXHJcblx0XHRkaXJ0eSA9IGZhbHNlLFxyXG5cdFx0Zm4sXHJcblx0XHRoYXNQb3N0TWVzc2FnZSA9ICEhZ2xvYmFsLnBvc3RNZXNzYWdlICYmICh0eXBlb2YgV2luZG93ICE9ICd1bmRlZmluZWQnKSAmJiAoZ2xvYmFsIGluc3RhbmNlb2YgV2luZG93KSxcclxuXHRcdG1lc3NhZ2VOYW1lID0gJ25leHR0aWNrJyxcclxuXHRcdHRyaWdnZXIgPSAoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRyZXR1cm4gaGFzUG9zdE1lc3NhZ2VcclxuXHRcdFx0XHQ/IGZ1bmN0aW9uIHRyaWdnZXIgKCkge1xyXG5cdFx0XHRcdGdsb2JhbC5wb3N0TWVzc2FnZShtZXNzYWdlTmFtZSwgJyonKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQ6IGZ1bmN0aW9uIHRyaWdnZXIgKCkge1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBwcm9jZXNzUXVldWUoKSB9LCAwKTtcclxuXHRcdFx0fTtcclxuXHRcdH0oKSksXHJcblx0XHRwcm9jZXNzUXVldWUgPSAoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRyZXR1cm4gaGFzUG9zdE1lc3NhZ2VcclxuXHRcdFx0XHQ/IGZ1bmN0aW9uIHByb2Nlc3NRdWV1ZSAoZXZlbnQpIHtcclxuXHRcdFx0XHRcdGlmIChldmVudC5zb3VyY2UgPT09IGdsb2JhbCAmJiBldmVudC5kYXRhID09PSBtZXNzYWdlTmFtZSkge1xyXG5cdFx0XHRcdFx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdFx0XHRcdFx0Zmx1c2hRdWV1ZSgpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQ6IGZsdXNoUXVldWU7XHJcbiAgICBcdH0pKClcclxuICAgIDtcclxuXHJcbiAgICBmdW5jdGlvbiBmbHVzaFF1ZXVlICgpIHtcclxuICAgICAgICB3aGlsZSAoZm4gPSBxdWV1ZS5zaGlmdCgpKSB7XHJcbiAgICAgICAgICAgIGZuKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRpcnR5ID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbmV4dFRpY2sgKGZuKSB7XHJcbiAgICAgICAgcXVldWUucHVzaChmbik7XHJcbiAgICAgICAgaWYgKGRpcnR5KSByZXR1cm47XHJcbiAgICAgICAgZGlydHkgPSB0cnVlO1xyXG4gICAgICAgIHRyaWdnZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaGFzUG9zdE1lc3NhZ2UpIGdsb2JhbC5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcHJvY2Vzc1F1ZXVlLCB0cnVlKTtcclxuXHJcbiAgICBuZXh0VGljay5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBnbG9iYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHByb2Nlc3NRdWV1ZSwgdHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5leHRUaWNrO1xyXG4gIH0pKCksXHJcblxyXG4gIGZpbmRQaXZvdDogZnVuY3Rpb24oIG5vZGUgKXtcclxuICBcdFx0aWYoICFub2RlIHx8ICFub2RlLl9fIClcclxuICBcdFx0XHRyZXR1cm47XHJcblxyXG4gIFx0XHRpZiggbm9kZS5fXy5waXZvdCApXHJcbiAgXHRcdFx0cmV0dXJuIG5vZGU7XHJcblxyXG4gIFx0XHR2YXIgZm91bmQgPSAwLFxyXG4gIFx0XHRcdHBhcmVudHMgPSBub2RlLl9fLnBhcmVudHMsXHJcbiAgXHRcdFx0aSA9IDAsXHJcbiAgXHRcdFx0cGFyZW50XHJcbiAgXHRcdDtcclxuXHJcbiAgXHRcdC8vIExvb2sgdXAgZm9yIHRoZSBwaXZvdCBpbiB0aGUgcGFyZW50c1xyXG4gIFx0XHR3aGlsZSggIWZvdW5kICYmIGkgPCBwYXJlbnRzLmxlbmd0aCApe1xyXG4gIFx0XHRcdHBhcmVudCA9IHBhcmVudHNbaV07XHJcbiAgXHRcdFx0aWYoIHBhcmVudC5fXy5waXZvdCApXHJcbiAgXHRcdFx0XHRmb3VuZCA9IHBhcmVudDtcclxuICBcdFx0XHRpKys7XHJcbiAgXHRcdH1cclxuXHJcbiAgXHRcdGlmKCBmb3VuZCApe1xyXG4gIFx0XHRcdHJldHVybiBmb3VuZDtcclxuICBcdFx0fVxyXG5cclxuICBcdFx0Ly8gSWYgbm90IGZvdW5kLCB0cnkgd2l0aCB0aGUgcGFyZW50J3MgcGFyZW50c1xyXG4gIFx0XHRpPTA7XHJcbiAgXHRcdHdoaWxlKCAhZm91bmQgJiYgaSA8IHBhcmVudHMubGVuZ3RoICl7XHJcblx0ICBcdFx0Zm91bmQgPSB0aGlzLmZpbmRQaXZvdCggcGFyZW50c1tpXSApO1xyXG5cdCAgXHRcdGkrKztcclxuXHQgIFx0fVxyXG5cclxuICBcdFx0cmV0dXJuIGZvdW5kO1xyXG4gIH0sXHJcblxyXG5cdGlzTGVhZjogZnVuY3Rpb24oIG5vZGUsIGZyZWV6ZUluc3RhbmNlcyApe1xyXG5cdFx0dmFyIGNvbnM7XHJcblx0XHRyZXR1cm4gIW5vZGUgfHwgIShjb25zID0gbm9kZS5jb25zdHJ1Y3RvcikgfHwgKGZyZWV6ZUluc3RhbmNlcyA/XHJcblx0XHRcdChjb25zID09PSBTdHJpbmcgfHwgY29ucyA9PT0gTnVtYmVyIHx8IGNvbnMgPT09IEJvb2xlYW4pIDpcclxuXHRcdFx0KGNvbnMgIT0gT2JqZWN0ICYmIGNvbnMgIT0gQXJyYXkpXHJcblx0XHQpO1xyXG5cdH1cclxufTtcclxuLy8jYnVpbGRcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxzO1xyXG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKVxuXG52YXIgSU5ERU5UX1NUQVJUID0gL1tcXHtcXFtdL1xudmFyIElOREVOVF9FTkQgPSAvW1xcfVxcXV0vXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBsaW5lcyA9IFtdXG4gIHZhciBpbmRlbnQgPSAwXG5cbiAgdmFyIHB1c2ggPSBmdW5jdGlvbihzdHIpIHtcbiAgICB2YXIgc3BhY2VzID0gJydcbiAgICB3aGlsZSAoc3BhY2VzLmxlbmd0aCA8IGluZGVudCoyKSBzcGFjZXMgKz0gJyAgJ1xuICAgIGxpbmVzLnB1c2goc3BhY2VzK3N0cilcbiAgfVxuXG4gIHZhciBsaW5lID0gZnVuY3Rpb24oZm10KSB7XG4gICAgaWYgKCFmbXQpIHJldHVybiBsaW5lXG5cbiAgICBpZiAoSU5ERU5UX0VORC50ZXN0KGZtdC50cmltKClbMF0pICYmIElOREVOVF9TVEFSVC50ZXN0KGZtdFtmbXQubGVuZ3RoLTFdKSkge1xuICAgICAgaW5kZW50LS1cbiAgICAgIHB1c2godXRpbC5mb3JtYXQuYXBwbHkodXRpbCwgYXJndW1lbnRzKSlcbiAgICAgIGluZGVudCsrXG4gICAgICByZXR1cm4gbGluZVxuICAgIH1cbiAgICBpZiAoSU5ERU5UX1NUQVJULnRlc3QoZm10W2ZtdC5sZW5ndGgtMV0pKSB7XG4gICAgICBwdXNoKHV0aWwuZm9ybWF0LmFwcGx5KHV0aWwsIGFyZ3VtZW50cykpXG4gICAgICBpbmRlbnQrK1xuICAgICAgcmV0dXJuIGxpbmVcbiAgICB9XG4gICAgaWYgKElOREVOVF9FTkQudGVzdChmbXQudHJpbSgpWzBdKSkge1xuICAgICAgaW5kZW50LS1cbiAgICAgIHB1c2godXRpbC5mb3JtYXQuYXBwbHkodXRpbCwgYXJndW1lbnRzKSlcbiAgICAgIHJldHVybiBsaW5lXG4gICAgfVxuXG4gICAgcHVzaCh1dGlsLmZvcm1hdC5hcHBseSh1dGlsLCBhcmd1bWVudHMpKVxuICAgIHJldHVybiBsaW5lXG4gIH1cblxuICBsaW5lLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcbicpXG4gIH1cblxuICBsaW5lLnRvRnVuY3Rpb24gPSBmdW5jdGlvbihzY29wZSkge1xuICAgIHZhciBzcmMgPSAncmV0dXJuICgnK2xpbmUudG9TdHJpbmcoKSsnKSdcblxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoc2NvcGUgfHwge30pLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBrZXlcbiAgICB9KVxuXG4gICAgdmFyIHZhbHMgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBzY29wZVtrZXldXG4gICAgfSlcblxuICAgIHJldHVybiBGdW5jdGlvbi5hcHBseShudWxsLCBrZXlzLmNvbmNhdChzcmMpKS5hcHBseShudWxsLCB2YWxzKVxuICB9XG5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIGxpbmUuYXBwbHkobnVsbCwgYXJndW1lbnRzKVxuXG4gIHJldHVybiBsaW5lXG59XG4iLCJ2YXIgaXNQcm9wZXJ0eSA9IHJlcXVpcmUoJ2lzLXByb3BlcnR5JylcblxudmFyIGdlbiA9IGZ1bmN0aW9uKG9iaiwgcHJvcCkge1xuICByZXR1cm4gaXNQcm9wZXJ0eShwcm9wKSA/IG9iaisnLicrcHJvcCA6IG9iaisnWycrSlNPTi5zdHJpbmdpZnkocHJvcCkrJ10nXG59XG5cbmdlbi52YWxpZCA9IGlzUHJvcGVydHlcbmdlbi5wcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wKSB7XG4gcmV0dXJuIGlzUHJvcGVydHkocHJvcCkgPyBwcm9wIDogSlNPTi5zdHJpbmdpZnkocHJvcClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZW5cbiIsIlxuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogQSBjYWNoZWQgcmVmZXJlbmNlIHRvIHRoZSBoYXNPd25Qcm9wZXJ0eSBmdW5jdGlvbi5cbiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBBIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIHRoYXQgd2lsbCBjcmVhdGUgYmxhbmsgb2JqZWN0cy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBCbGFuaygpIHt9XG5cbkJsYW5rLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbi8qKlxuICogVXNlZCB0byBwcmV2ZW50IHByb3BlcnR5IGNvbGxpc2lvbnMgYmV0d2VlbiBvdXIgXCJtYXBcIiBhbmQgaXRzIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7IU9iamVjdDxzdHJpbmcsICo+fSBtYXAgVGhlIG1hcCB0byBjaGVjay5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSBUaGUgcHJvcGVydHkgdG8gY2hlY2suXG4gKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIG1hcCBoYXMgcHJvcGVydHkuXG4gKi9cbnZhciBoYXMgPSBmdW5jdGlvbiAobWFwLCBwcm9wZXJ0eSkge1xuICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChtYXAsIHByb3BlcnR5KTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBtYXAgb2JqZWN0IHdpdGhvdXQgYSBwcm90b3R5cGUuXG4gKiBAcmV0dXJuIHshT2JqZWN0fVxuICovXG52YXIgY3JlYXRlTWFwID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IEJsYW5rKCk7XG59O1xuXG4vKipcbiAqIEtlZXBzIHRyYWNrIG9mIGluZm9ybWF0aW9uIG5lZWRlZCB0byBwZXJmb3JtIGRpZmZzIGZvciBhIGdpdmVuIERPTSBub2RlLlxuICogQHBhcmFtIHshc3RyaW5nfSBub2RlTmFtZVxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTm9kZURhdGEobm9kZU5hbWUsIGtleSkge1xuICAvKipcbiAgICogVGhlIGF0dHJpYnV0ZXMgYW5kIHRoZWlyIHZhbHVlcy5cbiAgICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgKj59XG4gICAqL1xuICB0aGlzLmF0dHJzID0gY3JlYXRlTWFwKCk7XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzLCB1c2VkIGZvciBxdWlja2x5IGRpZmZpbmcgdGhlXG4gICAqIGluY29tbWluZyBhdHRyaWJ1dGVzIHRvIHNlZSBpZiB0aGUgRE9NIG5vZGUncyBhdHRyaWJ1dGVzIG5lZWQgdG8gYmVcbiAgICogdXBkYXRlZC5cbiAgICogQGNvbnN0IHtBcnJheTwqPn1cbiAgICovXG4gIHRoaXMuYXR0cnNBcnIgPSBbXTtcblxuICAvKipcbiAgICogVGhlIGluY29taW5nIGF0dHJpYnV0ZXMgZm9yIHRoaXMgTm9kZSwgYmVmb3JlIHRoZXkgYXJlIHVwZGF0ZWQuXG4gICAqIEBjb25zdCB7IU9iamVjdDxzdHJpbmcsICo+fVxuICAgKi9cbiAgdGhpcy5uZXdBdHRycyA9IGNyZWF0ZU1hcCgpO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgc3RhdGljcyBoYXZlIGJlZW4gYXBwbGllZCBmb3IgdGhlIG5vZGUgeWV0LlxuICAgKiB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMuc3RhdGljc0FwcGxpZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgbm9kZSwgdXNlZCB0byBwcmVzZXJ2ZSBET00gbm9kZXMgd2hlbiB0aGV5XG4gICAqIG1vdmUgd2l0aGluIHRoZWlyIHBhcmVudC5cbiAgICogQGNvbnN0XG4gICAqL1xuICB0aGlzLmtleSA9IGtleTtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgY2hpbGRyZW4gd2l0aGluIHRoaXMgbm9kZSBieSB0aGVpciBrZXkuXG4gICAqIHshT2JqZWN0PHN0cmluZywgIUVsZW1lbnQ+fVxuICAgKi9cbiAgdGhpcy5rZXlNYXAgPSBjcmVhdGVNYXAoKTtcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIGtleU1hcCBpcyBjdXJyZW50bHkgdmFsaWQuXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgdGhpcy5rZXlNYXBWYWxpZCA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3IgdGhlIGFzc29jaWF0ZWQgbm9kZSBpcywgb3IgY29udGFpbnMsIGEgZm9jdXNlZCBFbGVtZW50LlxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMuZm9jdXNlZCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBUaGUgbm9kZSBuYW1lIGZvciB0aGlzIG5vZGUuXG4gICAqIEBjb25zdCB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy5ub2RlTmFtZSA9IG5vZGVOYW1lO1xuXG4gIC8qKlxuICAgKiBAdHlwZSB7P3N0cmluZ31cbiAgICovXG4gIHRoaXMudGV4dCA9IG51bGw7XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgYSBOb2RlRGF0YSBvYmplY3QgZm9yIGEgTm9kZS5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgVGhlIG5vZGUgdG8gaW5pdGlhbGl6ZSBkYXRhIGZvci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZSBuYW1lIG9mIG5vZGUuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB0aGF0IGlkZW50aWZpZXMgdGhlIG5vZGUuXG4gKiBAcmV0dXJuIHshTm9kZURhdGF9IFRoZSBuZXdseSBpbml0aWFsaXplZCBkYXRhIG9iamVjdFxuICovXG52YXIgaW5pdERhdGEgPSBmdW5jdGlvbiAobm9kZSwgbm9kZU5hbWUsIGtleSkge1xuICB2YXIgZGF0YSA9IG5ldyBOb2RlRGF0YShub2RlTmFtZSwga2V5KTtcbiAgbm9kZVsnX19pbmNyZW1lbnRhbERPTURhdGEnXSA9IGRhdGE7XG4gIHJldHVybiBkYXRhO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIE5vZGVEYXRhIG9iamVjdCBmb3IgYSBOb2RlLCBjcmVhdGluZyBpdCBpZiBuZWNlc3NhcnkuXG4gKlxuICogQHBhcmFtIHs/Tm9kZX0gbm9kZSBUaGUgTm9kZSB0byByZXRyaWV2ZSB0aGUgZGF0YSBmb3IuXG4gKiBAcmV0dXJuIHshTm9kZURhdGF9IFRoZSBOb2RlRGF0YSBmb3IgdGhpcyBOb2RlLlxuICovXG52YXIgZ2V0RGF0YSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIGltcG9ydE5vZGUobm9kZSk7XG4gIHJldHVybiBub2RlWydfX2luY3JlbWVudGFsRE9NRGF0YSddO1xufTtcblxuLyoqXG4gKiBJbXBvcnRzIG5vZGUgYW5kIGl0cyBzdWJ0cmVlLCBpbml0aWFsaXppbmcgY2FjaGVzLlxuICpcbiAqIEBwYXJhbSB7P05vZGV9IG5vZGUgVGhlIE5vZGUgdG8gaW1wb3J0LlxuICovXG52YXIgaW1wb3J0Tm9kZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIGlmIChub2RlWydfX2luY3JlbWVudGFsRE9NRGF0YSddKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGlzRWxlbWVudCA9IG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50O1xuICB2YXIgbm9kZU5hbWUgPSBpc0VsZW1lbnQgPyBub2RlLmxvY2FsTmFtZSA6IG5vZGUubm9kZU5hbWU7XG4gIHZhciBrZXkgPSBpc0VsZW1lbnQgPyBub2RlLmdldEF0dHJpYnV0ZSgna2V5JykgOiBudWxsO1xuICB2YXIgZGF0YSA9IGluaXREYXRhKG5vZGUsIG5vZGVOYW1lLCBrZXkpO1xuXG4gIGlmIChrZXkpIHtcbiAgICBnZXREYXRhKG5vZGUucGFyZW50Tm9kZSkua2V5TWFwW2tleV0gPSBub2RlO1xuICB9XG5cbiAgaWYgKGlzRWxlbWVudCkge1xuICAgIHZhciBhdHRyaWJ1dGVzID0gbm9kZS5hdHRyaWJ1dGVzO1xuICAgIHZhciBhdHRycyA9IGRhdGEuYXR0cnM7XG4gICAgdmFyIG5ld0F0dHJzID0gZGF0YS5uZXdBdHRycztcbiAgICB2YXIgYXR0cnNBcnIgPSBkYXRhLmF0dHJzQXJyO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdHRyaWJ1dGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICB2YXIgYXR0ciA9IGF0dHJpYnV0ZXNbaV07XG4gICAgICB2YXIgbmFtZSA9IGF0dHIubmFtZTtcbiAgICAgIHZhciB2YWx1ZSA9IGF0dHIudmFsdWU7XG5cbiAgICAgIGF0dHJzW25hbWVdID0gdmFsdWU7XG4gICAgICBuZXdBdHRyc1tuYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgIGF0dHJzQXJyLnB1c2gobmFtZSk7XG4gICAgICBhdHRyc0Fyci5wdXNoKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBmb3IgKHZhciBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICBpbXBvcnROb2RlKGNoaWxkKTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBuYW1lc3BhY2UgdG8gY3JlYXRlIGFuIGVsZW1lbnQgKG9mIGEgZ2l2ZW4gdGFnKSBpbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyB0byBnZXQgdGhlIG5hbWVzcGFjZSBmb3IuXG4gKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnRcbiAqIEByZXR1cm4gez9zdHJpbmd9IFRoZSBuYW1lc3BhY2UgdG8gY3JlYXRlIHRoZSB0YWcgaW4uXG4gKi9cbnZhciBnZXROYW1lc3BhY2VGb3JUYWcgPSBmdW5jdGlvbiAodGFnLCBwYXJlbnQpIHtcbiAgaWYgKHRhZyA9PT0gJ3N2ZycpIHtcbiAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbiAgfVxuXG4gIGlmIChnZXREYXRhKHBhcmVudCkubm9kZU5hbWUgPT09ICdmb3JlaWduT2JqZWN0Jykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHBhcmVudC5uYW1lc3BhY2VVUkk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudC5cbiAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyBUaGUgZG9jdW1lbnQgd2l0aCB3aGljaCB0byBjcmVhdGUgdGhlIEVsZW1lbnQuXG4gKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyBmb3IgdGhlIEVsZW1lbnQuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgQSBrZXkgdG8gaWRlbnRpZnkgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH1cbiAqL1xudmFyIGNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbiAoZG9jLCBwYXJlbnQsIHRhZywga2V5KSB7XG4gIHZhciBuYW1lc3BhY2UgPSBnZXROYW1lc3BhY2VGb3JUYWcodGFnLCBwYXJlbnQpO1xuICB2YXIgZWwgPSB1bmRlZmluZWQ7XG5cbiAgaWYgKG5hbWVzcGFjZSkge1xuICAgIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIHRhZyk7XG4gIH0gZWxzZSB7XG4gICAgZWwgPSBkb2MuY3JlYXRlRWxlbWVudCh0YWcpO1xuICB9XG5cbiAgaW5pdERhdGEoZWwsIHRhZywga2V5KTtcblxuICByZXR1cm4gZWw7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUZXh0IE5vZGUuXG4gKiBAcGFyYW0ge0RvY3VtZW50fSBkb2MgVGhlIGRvY3VtZW50IHdpdGggd2hpY2ggdG8gY3JlYXRlIHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IVRleHR9XG4gKi9cbnZhciBjcmVhdGVUZXh0ID0gZnVuY3Rpb24gKGRvYykge1xuICB2YXIgbm9kZSA9IGRvYy5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gIGluaXREYXRhKG5vZGUsICcjdGV4dCcsIG51bGwpO1xuICByZXR1cm4gbm9kZTtcbn07XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqIEBjb25zdCAqL1xudmFyIG5vdGlmaWNhdGlvbnMgPSB7XG4gIC8qKlxuICAgKiBDYWxsZWQgYWZ0ZXIgcGF0Y2ggaGFzIGNvbXBsZWF0ZWQgd2l0aCBhbnkgTm9kZXMgdGhhdCBoYXZlIGJlZW4gY3JlYXRlZFxuICAgKiBhbmQgYWRkZWQgdG8gdGhlIERPTS5cbiAgICogQHR5cGUgez9mdW5jdGlvbihBcnJheTwhTm9kZT4pfVxuICAgKi9cbiAgbm9kZXNDcmVhdGVkOiBudWxsLFxuXG4gIC8qKlxuICAgKiBDYWxsZWQgYWZ0ZXIgcGF0Y2ggaGFzIGNvbXBsZWF0ZWQgd2l0aCBhbnkgTm9kZXMgdGhhdCBoYXZlIGJlZW4gcmVtb3ZlZFxuICAgKiBmcm9tIHRoZSBET00uXG4gICAqIE5vdGUgaXQncyBhbiBhcHBsaWNhdGlvbnMgcmVzcG9uc2liaWxpdHkgdG8gaGFuZGxlIGFueSBjaGlsZE5vZGVzLlxuICAgKiBAdHlwZSB7P2Z1bmN0aW9uKEFycmF5PCFOb2RlPil9XG4gICAqL1xuICBub2Rlc0RlbGV0ZWQ6IG51bGxcbn07XG5cbi8qKlxuICogS2VlcHMgdHJhY2sgb2YgdGhlIHN0YXRlIG9mIGEgcGF0Y2guXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQ29udGV4dCgpIHtcbiAgLyoqXG4gICAqIEB0eXBlIHsoQXJyYXk8IU5vZGU+fHVuZGVmaW5lZCl9XG4gICAqL1xuICB0aGlzLmNyZWF0ZWQgPSBub3RpZmljYXRpb25zLm5vZGVzQ3JlYXRlZCAmJiBbXTtcblxuICAvKipcbiAgICogQHR5cGUgeyhBcnJheTwhTm9kZT58dW5kZWZpbmVkKX1cbiAgICovXG4gIHRoaXMuZGVsZXRlZCA9IG5vdGlmaWNhdGlvbnMubm9kZXNEZWxldGVkICYmIFtdO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAqL1xuQ29udGV4dC5wcm90b3R5cGUubWFya0NyZWF0ZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICBpZiAodGhpcy5jcmVhdGVkKSB7XG4gICAgdGhpcy5jcmVhdGVkLnB1c2gobm9kZSk7XG4gIH1cbn07XG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICovXG5Db250ZXh0LnByb3RvdHlwZS5tYXJrRGVsZXRlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIGlmICh0aGlzLmRlbGV0ZWQpIHtcbiAgICB0aGlzLmRlbGV0ZWQucHVzaChub2RlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBOb3RpZmllcyBhYm91dCBub2RlcyB0aGF0IHdlcmUgY3JlYXRlZCBkdXJpbmcgdGhlIHBhdGNoIG9wZWFyYXRpb24uXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLm5vdGlmeUNoYW5nZXMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmNyZWF0ZWQgJiYgdGhpcy5jcmVhdGVkLmxlbmd0aCA+IDApIHtcbiAgICBub3RpZmljYXRpb25zLm5vZGVzQ3JlYXRlZCh0aGlzLmNyZWF0ZWQpO1xuICB9XG5cbiAgaWYgKHRoaXMuZGVsZXRlZCAmJiB0aGlzLmRlbGV0ZWQubGVuZ3RoID4gMCkge1xuICAgIG5vdGlmaWNhdGlvbnMubm9kZXNEZWxldGVkKHRoaXMuZGVsZXRlZCk7XG4gIH1cbn07XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gICogS2VlcHMgdHJhY2sgd2hldGhlciBvciBub3Qgd2UgYXJlIGluIGFuIGF0dHJpYnV0ZXMgZGVjbGFyYXRpb24gKGFmdGVyXG4gICogZWxlbWVudE9wZW5TdGFydCwgYnV0IGJlZm9yZSBlbGVtZW50T3BlbkVuZCkuXG4gICogQHR5cGUge2Jvb2xlYW59XG4gICovXG52YXIgaW5BdHRyaWJ1dGVzID0gZmFsc2U7XG5cbi8qKlxuICAqIEtlZXBzIHRyYWNrIHdoZXRoZXIgb3Igbm90IHdlIGFyZSBpbiBhbiBlbGVtZW50IHRoYXQgc2hvdWxkIG5vdCBoYXZlIGl0c1xuICAqIGNoaWxkcmVuIGNsZWFyZWQuXG4gICogQHR5cGUge2Jvb2xlYW59XG4gICovXG52YXIgaW5Ta2lwID0gZmFsc2U7XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IHRoZXJlIGlzIGEgY3VycmVudCBwYXRjaCBjb250ZXh0LlxuICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZVxuICogQHBhcmFtIHsqfSBjb250ZXh0XG4gKi9cbnZhciBhc3NlcnRJblBhdGNoID0gZnVuY3Rpb24gKGZ1bmN0aW9uTmFtZSwgY29udGV4dCkge1xuICBpZiAoIWNvbnRleHQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYWxsICcgKyBmdW5jdGlvbk5hbWUgKyAnKCkgdW5sZXNzIGluIHBhdGNoLicpO1xuICB9XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCBhIHBhdGNoIGNsb3NlcyBldmVyeSBub2RlIHRoYXQgaXQgb3BlbmVkLlxuICogQHBhcmFtIHs/Tm9kZX0gb3BlbkVsZW1lbnRcbiAqIEBwYXJhbSB7IU5vZGV8IURvY3VtZW50RnJhZ21lbnR9IHJvb3RcbiAqL1xudmFyIGFzc2VydE5vVW5jbG9zZWRUYWdzID0gZnVuY3Rpb24gKG9wZW5FbGVtZW50LCByb290KSB7XG4gIGlmIChvcGVuRWxlbWVudCA9PT0gcm9vdCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBjdXJyZW50RWxlbWVudCA9IG9wZW5FbGVtZW50O1xuICB2YXIgb3BlblRhZ3MgPSBbXTtcbiAgd2hpbGUgKGN1cnJlbnRFbGVtZW50ICYmIGN1cnJlbnRFbGVtZW50ICE9PSByb290KSB7XG4gICAgb3BlblRhZ3MucHVzaChjdXJyZW50RWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKTtcbiAgICBjdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50LnBhcmVudE5vZGU7XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoJ09uZSBvciBtb3JlIHRhZ3Mgd2VyZSBub3QgY2xvc2VkOlxcbicgKyBvcGVuVGFncy5qb2luKCdcXG4nKSk7XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY2FsbGVyIGlzIG5vdCB3aGVyZSBhdHRyaWJ1dGVzIGFyZSBleHBlY3RlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmdW5jdGlvbk5hbWVcbiAqL1xudmFyIGFzc2VydE5vdEluQXR0cmlidXRlcyA9IGZ1bmN0aW9uIChmdW5jdGlvbk5hbWUpIHtcbiAgaWYgKGluQXR0cmlidXRlcykge1xuICAgIHRocm93IG5ldyBFcnJvcihmdW5jdGlvbk5hbWUgKyAnKCkgY2FuIG5vdCBiZSBjYWxsZWQgYmV0d2VlbiAnICsgJ2VsZW1lbnRPcGVuU3RhcnQoKSBhbmQgZWxlbWVudE9wZW5FbmQoKS4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgdGhlIGNhbGxlciBpcyBub3QgaW5zaWRlIGFuIGVsZW1lbnQgdGhhdCBoYXMgZGVjbGFyZWQgc2tpcC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmdW5jdGlvbk5hbWVcbiAqL1xudmFyIGFzc2VydE5vdEluU2tpcCA9IGZ1bmN0aW9uIChmdW5jdGlvbk5hbWUpIHtcbiAgaWYgKGluU2tpcCkge1xuICAgIHRocm93IG5ldyBFcnJvcihmdW5jdGlvbk5hbWUgKyAnKCkgbWF5IG5vdCBiZSBjYWxsZWQgaW5zaWRlIGFuIGVsZW1lbnQgJyArICd0aGF0IGhhcyBjYWxsZWQgc2tpcCgpLicpO1xuICB9XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY2FsbGVyIGlzIHdoZXJlIGF0dHJpYnV0ZXMgYXJlIGV4cGVjdGVkLlxuICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZVxuICovXG52YXIgYXNzZXJ0SW5BdHRyaWJ1dGVzID0gZnVuY3Rpb24gKGZ1bmN0aW9uTmFtZSkge1xuICBpZiAoIWluQXR0cmlidXRlcykge1xuICAgIHRocm93IG5ldyBFcnJvcihmdW5jdGlvbk5hbWUgKyAnKCkgY2FuIG9ubHkgYmUgY2FsbGVkIGFmdGVyIGNhbGxpbmcgJyArICdlbGVtZW50T3BlblN0YXJ0KCkuJyk7XG4gIH1cbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGUgcGF0Y2ggY2xvc2VzIHZpcnR1YWwgYXR0cmlidXRlcyBjYWxsXG4gKi9cbnZhciBhc3NlcnRWaXJ0dWFsQXR0cmlidXRlc0Nsb3NlZCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKGluQXR0cmlidXRlcykge1xuICAgIHRocm93IG5ldyBFcnJvcignZWxlbWVudE9wZW5FbmQoKSBtdXN0IGJlIGNhbGxlZCBhZnRlciBjYWxsaW5nICcgKyAnZWxlbWVudE9wZW5TdGFydCgpLicpO1xuICB9XG59O1xuXG4vKipcbiAgKiBNYWtlcyBzdXJlIHRoYXQgdGFncyBhcmUgY29ycmVjdGx5IG5lc3RlZC5cbiAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZU5hbWVcbiAgKiBAcGFyYW0ge3N0cmluZ30gdGFnXG4gICovXG52YXIgYXNzZXJ0Q2xvc2VNYXRjaGVzT3BlblRhZyA9IGZ1bmN0aW9uIChub2RlTmFtZSwgdGFnKSB7XG4gIGlmIChub2RlTmFtZSAhPT0gdGFnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZWNlaXZlZCBhIGNhbGwgdG8gY2xvc2UgXCInICsgdGFnICsgJ1wiIGJ1dCBcIicgKyBub2RlTmFtZSArICdcIiB3YXMgb3Blbi4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgbm8gY2hpbGRyZW4gZWxlbWVudHMgaGF2ZSBiZWVuIGRlY2xhcmVkIHlldCBpbiB0aGUgY3VycmVudFxuICogZWxlbWVudC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmdW5jdGlvbk5hbWVcbiAqIEBwYXJhbSB7P05vZGV9IHByZXZpb3VzTm9kZVxuICovXG52YXIgYXNzZXJ0Tm9DaGlsZHJlbkRlY2xhcmVkWWV0ID0gZnVuY3Rpb24gKGZ1bmN0aW9uTmFtZSwgcHJldmlvdXNOb2RlKSB7XG4gIGlmIChwcmV2aW91c05vZGUgIT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZnVuY3Rpb25OYW1lICsgJygpIG11c3QgY29tZSBiZWZvcmUgYW55IGNoaWxkICcgKyAnZGVjbGFyYXRpb25zIGluc2lkZSB0aGUgY3VycmVudCBlbGVtZW50LicpO1xuICB9XG59O1xuXG4vKipcbiAqIENoZWNrcyB0aGF0IGEgY2FsbCB0byBwYXRjaE91dGVyIGFjdHVhbGx5IHBhdGNoZWQgdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gez9Ob2RlfSBzdGFydE5vZGUgVGhlIHZhbHVlIGZvciB0aGUgY3VycmVudE5vZGUgd2hlbiB0aGUgcGF0Y2hcbiAqICAgICBzdGFydGVkLlxuICogQHBhcmFtIHs/Tm9kZX0gY3VycmVudE5vZGUgVGhlIGN1cnJlbnROb2RlIHdoZW4gdGhlIHBhdGNoIGZpbmlzaGVkLlxuICogQHBhcmFtIHs/Tm9kZX0gZXhwZWN0ZWROZXh0Tm9kZSBUaGUgTm9kZSB0aGF0IGlzIGV4cGVjdGVkIHRvIGZvbGxvdyB0aGVcbiAqICAgIGN1cnJlbnROb2RlIGFmdGVyIHRoZSBwYXRjaDtcbiAqIEBwYXJhbSB7P05vZGV9IGV4cGVjdGVkUHJldk5vZGUgVGhlIE5vZGUgdGhhdCBpcyBleHBlY3RlZCB0byBwcmVjZWVkIHRoZVxuICogICAgY3VycmVudE5vZGUgYWZ0ZXIgdGhlIHBhdGNoLlxuICovXG52YXIgYXNzZXJ0UGF0Y2hFbGVtZW50Tm9FeHRyYXMgPSBmdW5jdGlvbiAoc3RhcnROb2RlLCBjdXJyZW50Tm9kZSwgZXhwZWN0ZWROZXh0Tm9kZSwgZXhwZWN0ZWRQcmV2Tm9kZSkge1xuICB2YXIgd2FzVXBkYXRlZCA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nID09PSBleHBlY3RlZE5leHROb2RlICYmIGN1cnJlbnROb2RlLnByZXZpb3VzU2libGluZyA9PT0gZXhwZWN0ZWRQcmV2Tm9kZTtcbiAgdmFyIHdhc0NoYW5nZWQgPSBjdXJyZW50Tm9kZS5uZXh0U2libGluZyA9PT0gc3RhcnROb2RlLm5leHRTaWJsaW5nICYmIGN1cnJlbnROb2RlLnByZXZpb3VzU2libGluZyA9PT0gZXhwZWN0ZWRQcmV2Tm9kZTtcbiAgdmFyIHdhc1JlbW92ZWQgPSBjdXJyZW50Tm9kZSA9PT0gc3RhcnROb2RlO1xuXG4gIGlmICghd2FzVXBkYXRlZCAmJiAhd2FzQ2hhbmdlZCAmJiAhd2FzUmVtb3ZlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhlcmUgbXVzdCBiZSBleGFjdGx5IG9uZSB0b3AgbGV2ZWwgY2FsbCBjb3JyZXNwb25kaW5nICcgKyAndG8gdGhlIHBhdGNoZWQgZWxlbWVudC4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBzdGF0ZSBvZiBiZWluZyBpbiBhbiBhdHRyaWJ1dGUgZGVjbGFyYXRpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHZhbHVlXG4gKiBAcmV0dXJuIHtib29sZWFufSB0aGUgcHJldmlvdXMgdmFsdWUuXG4gKi9cbnZhciBzZXRJbkF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIHByZXZpb3VzID0gaW5BdHRyaWJ1dGVzO1xuICBpbkF0dHJpYnV0ZXMgPSB2YWx1ZTtcbiAgcmV0dXJuIHByZXZpb3VzO1xufTtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBzdGF0ZSBvZiBiZWluZyBpbiBhIHNraXAgZWxlbWVudC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRoZSBwcmV2aW91cyB2YWx1ZS5cbiAqL1xudmFyIHNldEluU2tpcCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgcHJldmlvdXMgPSBpblNraXA7XG4gIGluU2tpcCA9IHZhbHVlO1xuICByZXR1cm4gcHJldmlvdXM7XG59O1xuXG4vKipcbiAqIENvcHlyaWdodCAyMDE2IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgbm9kZSB0aGUgcm9vdCBvZiBhIGRvY3VtZW50LCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbnZhciBpc0RvY3VtZW50Um9vdCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIC8vIEZvciBTaGFkb3dSb290cywgY2hlY2sgaWYgdGhleSBhcmUgYSBEb2N1bWVudEZyYWdtZW50IGluc3RlYWQgb2YgaWYgdGhleVxuICAvLyBhcmUgYSBTaGFkb3dSb290IHNvIHRoYXQgdGhpcyBjYW4gd29yayBpbiAndXNlIHN0cmljdCcgaWYgU2hhZG93Um9vdHMgYXJlXG4gIC8vIG5vdCBzdXBwb3J0ZWQuXG4gIHJldHVybiBub2RlIGluc3RhbmNlb2YgRG9jdW1lbnQgfHwgbm9kZSBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnQ7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGUgVGhlIG5vZGUgdG8gc3RhcnQgYXQsIGluY2x1c2l2ZS5cbiAqIEBwYXJhbSB7P05vZGV9IHJvb3QgVGhlIHJvb3QgYW5jZXN0b3IgdG8gZ2V0IHVudGlsLCBleGNsdXNpdmUuXG4gKiBAcmV0dXJuIHshQXJyYXk8IU5vZGU+fSBUaGUgYW5jZXN0cnkgb2YgRE9NIG5vZGVzLlxuICovXG52YXIgZ2V0QW5jZXN0cnkgPSBmdW5jdGlvbiAobm9kZSwgcm9vdCkge1xuICB2YXIgYW5jZXN0cnkgPSBbXTtcbiAgdmFyIGN1ciA9IG5vZGU7XG5cbiAgd2hpbGUgKGN1ciAhPT0gcm9vdCkge1xuICAgIGFuY2VzdHJ5LnB1c2goY3VyKTtcbiAgICBjdXIgPSBjdXIucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHJldHVybiBhbmNlc3RyeTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICogQHJldHVybiB7IU5vZGV9IFRoZSByb290IG5vZGUgb2YgdGhlIERPTSB0cmVlIHRoYXQgY29udGFpbnMgbm9kZS5cbiAqL1xudmFyIGdldFJvb3QgPSBmdW5jdGlvbiAobm9kZSkge1xuICB2YXIgY3VyID0gbm9kZTtcbiAgdmFyIHByZXYgPSBjdXI7XG5cbiAgd2hpbGUgKGN1cikge1xuICAgIHByZXYgPSBjdXI7XG4gICAgY3VyID0gY3VyLnBhcmVudE5vZGU7XG4gIH1cblxuICByZXR1cm4gcHJldjtcbn07XG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZSBUaGUgbm9kZSB0byBnZXQgdGhlIGFjdGl2ZUVsZW1lbnQgZm9yLlxuICogQHJldHVybiB7P0VsZW1lbnR9IFRoZSBhY3RpdmVFbGVtZW50IGluIHRoZSBEb2N1bWVudCBvciBTaGFkb3dSb290XG4gKiAgICAgY29ycmVzcG9uZGluZyB0byBub2RlLCBpZiBwcmVzZW50LlxuICovXG52YXIgZ2V0QWN0aXZlRWxlbWVudCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIHZhciByb290ID0gZ2V0Um9vdChub2RlKTtcbiAgcmV0dXJuIGlzRG9jdW1lbnRSb290KHJvb3QpID8gcm9vdC5hY3RpdmVFbGVtZW50IDogbnVsbDtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgcGF0aCBvZiBub2RlcyB0aGF0IGNvbnRhaW4gdGhlIGZvY3VzZWQgbm9kZSBpbiB0aGUgc2FtZSBkb2N1bWVudCBhc1xuICogYSByZWZlcmVuY2Ugbm9kZSwgdXAgdW50aWwgdGhlIHJvb3QuXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlIFRoZSByZWZlcmVuY2Ugbm9kZSB0byBnZXQgdGhlIGFjdGl2ZUVsZW1lbnQgZm9yLlxuICogQHBhcmFtIHs/Tm9kZX0gcm9vdCBUaGUgcm9vdCB0byBnZXQgdGhlIGZvY3VzZWQgcGF0aCB1bnRpbC5cbiAqIEByZXR1cm4geyFBcnJheTxOb2RlPn1cbiAqL1xudmFyIGdldEZvY3VzZWRQYXRoID0gZnVuY3Rpb24gKG5vZGUsIHJvb3QpIHtcbiAgdmFyIGFjdGl2ZUVsZW1lbnQgPSBnZXRBY3RpdmVFbGVtZW50KG5vZGUpO1xuXG4gIGlmICghYWN0aXZlRWxlbWVudCB8fCAhbm9kZS5jb250YWlucyhhY3RpdmVFbGVtZW50KSkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIHJldHVybiBnZXRBbmNlc3RyeShhY3RpdmVFbGVtZW50LCByb290KTtcbn07XG5cbi8qKlxuICogTGlrZSBpbnNlcnRCZWZvcmUsIGJ1dCBpbnN0ZWFkIGluc3RlYWQgb2YgbW92aW5nIHRoZSBkZXNpcmVkIG5vZGUsIGluc3RlYWRcbiAqIG1vdmVzIGFsbCB0aGUgb3RoZXIgbm9kZXMgYWZ0ZXIuXG4gKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnROb2RlXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gKiBAcGFyYW0gez9Ob2RlfSByZWZlcmVuY2VOb2RlXG4gKi9cbnZhciBtb3ZlQmVmb3JlID0gZnVuY3Rpb24gKHBhcmVudE5vZGUsIG5vZGUsIHJlZmVyZW5jZU5vZGUpIHtcbiAgdmFyIGluc2VydFJlZmVyZW5jZU5vZGUgPSBub2RlLm5leHRTaWJsaW5nO1xuICB2YXIgY3VyID0gcmVmZXJlbmNlTm9kZTtcblxuICB3aGlsZSAoY3VyICE9PSBub2RlKSB7XG4gICAgdmFyIG5leHQgPSBjdXIubmV4dFNpYmxpbmc7XG4gICAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY3VyLCBpbnNlcnRSZWZlcmVuY2VOb2RlKTtcbiAgICBjdXIgPSBuZXh0O1xuICB9XG59O1xuXG4vKiogQHR5cGUgez9Db250ZXh0fSAqL1xudmFyIGNvbnRleHQgPSBudWxsO1xuXG4vKiogQHR5cGUgez9Ob2RlfSAqL1xudmFyIGN1cnJlbnROb2RlID0gbnVsbDtcblxuLyoqIEB0eXBlIHs/Tm9kZX0gKi9cbnZhciBjdXJyZW50UGFyZW50ID0gbnVsbDtcblxuLyoqIEB0eXBlIHs/RG9jdW1lbnR9ICovXG52YXIgZG9jID0gbnVsbDtcblxuLyoqXG4gKiBAcGFyYW0geyFBcnJheTxOb2RlPn0gZm9jdXNQYXRoIFRoZSBub2RlcyB0byBtYXJrLlxuICogQHBhcmFtIHtib29sZWFufSBmb2N1c2VkIFdoZXRoZXIgb3Igbm90IHRoZXkgYXJlIGZvY3VzZWQuXG4gKi9cbnZhciBtYXJrRm9jdXNlZCA9IGZ1bmN0aW9uIChmb2N1c1BhdGgsIGZvY3VzZWQpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBmb2N1c1BhdGgubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBnZXREYXRhKGZvY3VzUGF0aFtpXSkuZm9jdXNlZCA9IGZvY3VzZWQ7XG4gIH1cbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHBhdGNoZXIgZnVuY3Rpb24gdGhhdCBzZXRzIHVwIGFuZCByZXN0b3JlcyBhIHBhdGNoIGNvbnRleHQsXG4gKiBydW5uaW5nIHRoZSBydW4gZnVuY3Rpb24gd2l0aCB0aGUgcHJvdmlkZWQgZGF0YS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKCFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50KSwhZnVuY3Rpb24oVCksVD0pOiA/Tm9kZX0gcnVuXG4gKiBAcmV0dXJuIHtmdW5jdGlvbigoIUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnQpLCFmdW5jdGlvbihUKSxUPSk6ID9Ob2RlfVxuICogQHRlbXBsYXRlIFRcbiAqL1xudmFyIHBhdGNoRmFjdG9yeSA9IGZ1bmN0aW9uIChydW4pIHtcbiAgLyoqXG4gICAqIFRPRE8obW96KTogVGhlc2UgYW5ub3RhdGlvbnMgd29uJ3QgYmUgbmVjZXNzYXJ5IG9uY2Ugd2Ugc3dpdGNoIHRvIENsb3N1cmVcbiAgICogQ29tcGlsZXIncyBuZXcgdHlwZSBpbmZlcmVuY2UuIFJlbW92ZSB0aGVzZSBvbmNlIHRoZSBzd2l0Y2ggaXMgZG9uZS5cbiAgICpcbiAgICogQHBhcmFtIHsoIUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnQpfSBub2RlXG4gICAqIEBwYXJhbSB7IWZ1bmN0aW9uKFQpfSBmblxuICAgKiBAcGFyYW0ge1Q9fSBkYXRhXG4gICAqIEByZXR1cm4gez9Ob2RlfSBub2RlXG4gICAqIEB0ZW1wbGF0ZSBUXG4gICAqL1xuICB2YXIgZiA9IGZ1bmN0aW9uIChub2RlLCBmbiwgZGF0YSkge1xuICAgIHZhciBwcmV2Q29udGV4dCA9IGNvbnRleHQ7XG4gICAgdmFyIHByZXZEb2MgPSBkb2M7XG4gICAgdmFyIHByZXZDdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlO1xuICAgIHZhciBwcmV2Q3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnQ7XG4gICAgdmFyIHByZXZpb3VzSW5BdHRyaWJ1dGVzID0gZmFsc2U7XG4gICAgdmFyIHByZXZpb3VzSW5Ta2lwID0gZmFsc2U7XG5cbiAgICBjb250ZXh0ID0gbmV3IENvbnRleHQoKTtcbiAgICBkb2MgPSBub2RlLm93bmVyRG9jdW1lbnQ7XG4gICAgY3VycmVudFBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcblxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBwcmV2aW91c0luQXR0cmlidXRlcyA9IHNldEluQXR0cmlidXRlcyhmYWxzZSk7XG4gICAgICBwcmV2aW91c0luU2tpcCA9IHNldEluU2tpcChmYWxzZSk7XG4gICAgfVxuXG4gICAgdmFyIGZvY3VzUGF0aCA9IGdldEZvY3VzZWRQYXRoKG5vZGUsIGN1cnJlbnRQYXJlbnQpO1xuICAgIG1hcmtGb2N1c2VkKGZvY3VzUGF0aCwgdHJ1ZSk7XG4gICAgdmFyIHJldFZhbCA9IHJ1bihub2RlLCBmbiwgZGF0YSk7XG4gICAgbWFya0ZvY3VzZWQoZm9jdXNQYXRoLCBmYWxzZSk7XG5cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgYXNzZXJ0VmlydHVhbEF0dHJpYnV0ZXNDbG9zZWQoKTtcbiAgICAgIHNldEluQXR0cmlidXRlcyhwcmV2aW91c0luQXR0cmlidXRlcyk7XG4gICAgICBzZXRJblNraXAocHJldmlvdXNJblNraXApO1xuICAgIH1cblxuICAgIGNvbnRleHQubm90aWZ5Q2hhbmdlcygpO1xuXG4gICAgY29udGV4dCA9IHByZXZDb250ZXh0O1xuICAgIGRvYyA9IHByZXZEb2M7XG4gICAgY3VycmVudE5vZGUgPSBwcmV2Q3VycmVudE5vZGU7XG4gICAgY3VycmVudFBhcmVudCA9IHByZXZDdXJyZW50UGFyZW50O1xuXG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfTtcbiAgcmV0dXJuIGY7XG59O1xuXG4vKipcbiAqIFBhdGNoZXMgdGhlIGRvY3VtZW50IHN0YXJ0aW5nIGF0IG5vZGUgd2l0aCB0aGUgcHJvdmlkZWQgZnVuY3Rpb24uIFRoaXNcbiAqIGZ1bmN0aW9uIG1heSBiZSBjYWxsZWQgZHVyaW5nIGFuIGV4aXN0aW5nIHBhdGNoIG9wZXJhdGlvbi5cbiAqIEBwYXJhbSB7IUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnR9IG5vZGUgVGhlIEVsZW1lbnQgb3IgRG9jdW1lbnRcbiAqICAgICB0byBwYXRjaC5cbiAqIEBwYXJhbSB7IWZ1bmN0aW9uKFQpfSBmbiBBIGZ1bmN0aW9uIGNvbnRhaW5pbmcgZWxlbWVudE9wZW4vZWxlbWVudENsb3NlL2V0Yy5cbiAqICAgICBjYWxscyB0aGF0IGRlc2NyaWJlIHRoZSBET00uXG4gKiBAcGFyYW0ge1Q9fSBkYXRhIEFuIGFyZ3VtZW50IHBhc3NlZCB0byBmbiB0byByZXByZXNlbnQgRE9NIHN0YXRlLlxuICogQHJldHVybiB7IU5vZGV9IFRoZSBwYXRjaGVkIG5vZGUuXG4gKiBAdGVtcGxhdGUgVFxuICovXG52YXIgcGF0Y2hJbm5lciA9IHBhdGNoRmFjdG9yeShmdW5jdGlvbiAobm9kZSwgZm4sIGRhdGEpIHtcbiAgY3VycmVudE5vZGUgPSBub2RlO1xuXG4gIGVudGVyTm9kZSgpO1xuICBmbihkYXRhKTtcbiAgZXhpdE5vZGUoKTtcblxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vVW5jbG9zZWRUYWdzKGN1cnJlbnROb2RlLCBub2RlKTtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufSk7XG5cbi8qKlxuICogUGF0Y2hlcyBhbiBFbGVtZW50IHdpdGggdGhlIHRoZSBwcm92aWRlZCBmdW5jdGlvbi4gRXhhY3RseSBvbmUgdG9wIGxldmVsXG4gKiBlbGVtZW50IGNhbGwgc2hvdWxkIGJlIG1hZGUgY29ycmVzcG9uZGluZyB0byBgbm9kZWAuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBub2RlIFRoZSBFbGVtZW50IHdoZXJlIHRoZSBwYXRjaCBzaG91bGQgc3RhcnQuXG4gKiBAcGFyYW0geyFmdW5jdGlvbihUKX0gZm4gQSBmdW5jdGlvbiBjb250YWluaW5nIGVsZW1lbnRPcGVuL2VsZW1lbnRDbG9zZS9ldGMuXG4gKiAgICAgY2FsbHMgdGhhdCBkZXNjcmliZSB0aGUgRE9NLiBUaGlzIHNob3VsZCBoYXZlIGF0IG1vc3Qgb25lIHRvcCBsZXZlbFxuICogICAgIGVsZW1lbnQgY2FsbC5cbiAqIEBwYXJhbSB7VD19IGRhdGEgQW4gYXJndW1lbnQgcGFzc2VkIHRvIGZuIHRvIHJlcHJlc2VudCBET00gc3RhdGUuXG4gKiBAcmV0dXJuIHs/Tm9kZX0gVGhlIG5vZGUgaWYgaXQgd2FzIHVwZGF0ZWQsIGl0cyByZXBsYWNlZG1lbnQgb3IgbnVsbCBpZiBpdFxuICogICAgIHdhcyByZW1vdmVkLlxuICogQHRlbXBsYXRlIFRcbiAqL1xudmFyIHBhdGNoT3V0ZXIgPSBwYXRjaEZhY3RvcnkoZnVuY3Rpb24gKG5vZGUsIGZuLCBkYXRhKSB7XG4gIHZhciBzdGFydE5vZGUgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL3sgbmV4dFNpYmxpbmc6IG5vZGUgfTtcbiAgdmFyIGV4cGVjdGVkTmV4dE5vZGUgPSBudWxsO1xuICB2YXIgZXhwZWN0ZWRQcmV2Tm9kZSA9IG51bGw7XG5cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBleHBlY3RlZE5leHROb2RlID0gbm9kZS5uZXh0U2libGluZztcbiAgICBleHBlY3RlZFByZXZOb2RlID0gbm9kZS5wcmV2aW91c1NpYmxpbmc7XG4gIH1cblxuICBjdXJyZW50Tm9kZSA9IHN0YXJ0Tm9kZTtcbiAgZm4oZGF0YSk7XG5cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRQYXRjaEVsZW1lbnROb0V4dHJhcyhzdGFydE5vZGUsIGN1cnJlbnROb2RlLCBleHBlY3RlZE5leHROb2RlLCBleHBlY3RlZFByZXZOb2RlKTtcbiAgfVxuXG4gIGlmIChub2RlICE9PSBjdXJyZW50Tm9kZSAmJiBub2RlLnBhcmVudE5vZGUpIHtcbiAgICByZW1vdmVDaGlsZChjdXJyZW50UGFyZW50LCBub2RlLCBnZXREYXRhKGN1cnJlbnRQYXJlbnQpLmtleU1hcCk7XG4gIH1cblxuICByZXR1cm4gc3RhcnROb2RlID09PSBjdXJyZW50Tm9kZSA/IG51bGwgOiBjdXJyZW50Tm9kZTtcbn0pO1xuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIG9yIG5vdCB0aGUgY3VycmVudCBub2RlIG1hdGNoZXMgdGhlIHNwZWNpZmllZCBub2RlTmFtZSBhbmRcbiAqIGtleS5cbiAqXG4gKiBAcGFyYW0geyFOb2RlfSBtYXRjaE5vZGUgQSBub2RlIHRvIG1hdGNoIHRoZSBkYXRhIHRvLlxuICogQHBhcmFtIHs/c3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZU5hbWUgZm9yIHRoaXMgbm9kZS5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBBbiBvcHRpb25hbCBrZXkgdGhhdCBpZGVudGlmaWVzIGEgbm9kZS5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIG5vZGUgbWF0Y2hlcywgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG52YXIgbWF0Y2hlcyA9IGZ1bmN0aW9uIChtYXRjaE5vZGUsIG5vZGVOYW1lLCBrZXkpIHtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKG1hdGNoTm9kZSk7XG5cbiAgLy8gS2V5IGNoZWNrIGlzIGRvbmUgdXNpbmcgZG91YmxlIGVxdWFscyBhcyB3ZSB3YW50IHRvIHRyZWF0IGEgbnVsbCBrZXkgdGhlXG4gIC8vIHNhbWUgYXMgdW5kZWZpbmVkLiBUaGlzIHNob3VsZCBiZSBva2F5IGFzIHRoZSBvbmx5IHZhbHVlcyBhbGxvd2VkIGFyZVxuICAvLyBzdHJpbmdzLCBudWxsIGFuZCB1bmRlZmluZWQgc28gdGhlID09IHNlbWFudGljcyBhcmUgbm90IHRvbyB3ZWlyZC5cbiAgcmV0dXJuIG5vZGVOYW1lID09PSBkYXRhLm5vZGVOYW1lICYmIGtleSA9PSBkYXRhLmtleTtcbn07XG5cbi8qKlxuICogQWxpZ25zIHRoZSB2aXJ0dWFsIEVsZW1lbnQgZGVmaW5pdGlvbiB3aXRoIHRoZSBhY3R1YWwgRE9NLCBtb3ZpbmcgdGhlXG4gKiBjb3JyZXNwb25kaW5nIERPTSBub2RlIHRvIHRoZSBjb3JyZWN0IGxvY2F0aW9uIG9yIGNyZWF0aW5nIGl0IGlmIG5lY2Vzc2FyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZSBGb3IgYW4gRWxlbWVudCwgdGhpcyBzaG91bGQgYmUgYSB2YWxpZCB0YWcgc3RyaW5nLlxuICogICAgIEZvciBhIFRleHQsIHRoaXMgc2hvdWxkIGJlICN0ZXh0LlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuXG4gKi9cbnZhciBhbGlnbldpdGhET00gPSBmdW5jdGlvbiAobm9kZU5hbWUsIGtleSkge1xuICBpZiAoY3VycmVudE5vZGUgJiYgbWF0Y2hlcyhjdXJyZW50Tm9kZSwgbm9kZU5hbWUsIGtleSkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgcGFyZW50RGF0YSA9IGdldERhdGEoY3VycmVudFBhcmVudCk7XG4gIHZhciBjdXJyZW50Tm9kZURhdGEgPSBjdXJyZW50Tm9kZSAmJiBnZXREYXRhKGN1cnJlbnROb2RlKTtcbiAgdmFyIGtleU1hcCA9IHBhcmVudERhdGEua2V5TWFwO1xuICB2YXIgbm9kZSA9IHVuZGVmaW5lZDtcblxuICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIG5vZGUgaGFzIG1vdmVkIHdpdGhpbiB0aGUgcGFyZW50LlxuICBpZiAoa2V5KSB7XG4gICAgdmFyIGtleU5vZGUgPSBrZXlNYXBba2V5XTtcbiAgICBpZiAoa2V5Tm9kZSkge1xuICAgICAgaWYgKG1hdGNoZXMoa2V5Tm9kZSwgbm9kZU5hbWUsIGtleSkpIHtcbiAgICAgICAgbm9kZSA9IGtleU5vZGU7XG4gICAgICB9IGVsc2UgaWYgKGtleU5vZGUgPT09IGN1cnJlbnROb2RlKSB7XG4gICAgICAgIGNvbnRleHQubWFya0RlbGV0ZWQoa2V5Tm9kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZW1vdmVDaGlsZChjdXJyZW50UGFyZW50LCBrZXlOb2RlLCBrZXlNYXApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIENyZWF0ZSB0aGUgbm9kZSBpZiBpdCBkb2Vzbid0IGV4aXN0LlxuICBpZiAoIW5vZGUpIHtcbiAgICBpZiAobm9kZU5hbWUgPT09ICcjdGV4dCcpIHtcbiAgICAgIG5vZGUgPSBjcmVhdGVUZXh0KGRvYyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUgPSBjcmVhdGVFbGVtZW50KGRvYywgY3VycmVudFBhcmVudCwgbm9kZU5hbWUsIGtleSk7XG4gICAgfVxuXG4gICAgaWYgKGtleSkge1xuICAgICAga2V5TWFwW2tleV0gPSBub2RlO1xuICAgIH1cblxuICAgIGNvbnRleHQubWFya0NyZWF0ZWQobm9kZSk7XG4gIH1cblxuICAvLyBSZS1vcmRlciB0aGUgbm9kZSBpbnRvIHRoZSByaWdodCBwb3NpdGlvbiwgcHJlc2VydmluZyBmb2N1cyBpZiBlaXRoZXJcbiAgLy8gbm9kZSBvciBjdXJyZW50Tm9kZSBhcmUgZm9jdXNlZCBieSBtYWtpbmcgc3VyZSB0aGF0IHRoZXkgYXJlIG5vdCBkZXRhY2hlZFxuICAvLyBmcm9tIHRoZSBET00uXG4gIGlmIChnZXREYXRhKG5vZGUpLmZvY3VzZWQpIHtcbiAgICAvLyBNb3ZlIGV2ZXJ5dGhpbmcgZWxzZSBiZWZvcmUgdGhlIG5vZGUuXG4gICAgbW92ZUJlZm9yZShjdXJyZW50UGFyZW50LCBub2RlLCBjdXJyZW50Tm9kZSk7XG4gIH0gZWxzZSBpZiAoY3VycmVudE5vZGVEYXRhICYmIGN1cnJlbnROb2RlRGF0YS5rZXkgJiYgIWN1cnJlbnROb2RlRGF0YS5mb2N1c2VkKSB7XG4gICAgLy8gUmVtb3ZlIHRoZSBjdXJyZW50Tm9kZSwgd2hpY2ggY2FuIGFsd2F5cyBiZSBhZGRlZCBiYWNrIHNpbmNlIHdlIGhvbGQgYVxuICAgIC8vIHJlZmVyZW5jZSB0aHJvdWdoIHRoZSBrZXlNYXAuIFRoaXMgcHJldmVudHMgYSBsYXJnZSBudW1iZXIgb2YgbW92ZXMgd2hlblxuICAgIC8vIGEga2V5ZWQgaXRlbSBpcyByZW1vdmVkIG9yIG1vdmVkIGJhY2t3YXJkcyBpbiB0aGUgRE9NLlxuICAgIGN1cnJlbnRQYXJlbnQucmVwbGFjZUNoaWxkKG5vZGUsIGN1cnJlbnROb2RlKTtcbiAgICBwYXJlbnREYXRhLmtleU1hcFZhbGlkID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgY3VycmVudFBhcmVudC5pbnNlcnRCZWZvcmUobm9kZSwgY3VycmVudE5vZGUpO1xuICB9XG5cbiAgY3VycmVudE5vZGUgPSBub2RlO1xufTtcblxuLyoqXG4gKiBAcGFyYW0gez9Ob2RlfSBub2RlXG4gKiBAcGFyYW0gez9Ob2RlfSBjaGlsZFxuICogQHBhcmFtIHs/T2JqZWN0PHN0cmluZywgIUVsZW1lbnQ+fSBrZXlNYXBcbiAqL1xudmFyIHJlbW92ZUNoaWxkID0gZnVuY3Rpb24gKG5vZGUsIGNoaWxkLCBrZXlNYXApIHtcbiAgbm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG4gIGNvbnRleHQubWFya0RlbGV0ZWQoIC8qKiBAdHlwZSB7IU5vZGV9Ki9jaGlsZCk7XG5cbiAgdmFyIGtleSA9IGdldERhdGEoY2hpbGQpLmtleTtcbiAgaWYgKGtleSkge1xuICAgIGRlbGV0ZSBrZXlNYXBba2V5XTtcbiAgfVxufTtcblxuLyoqXG4gKiBDbGVhcnMgb3V0IGFueSB1bnZpc2l0ZWQgTm9kZXMsIGFzIHRoZSBjb3JyZXNwb25kaW5nIHZpcnR1YWwgZWxlbWVudFxuICogZnVuY3Rpb25zIHdlcmUgbmV2ZXIgY2FsbGVkIGZvciB0aGVtLlxuICovXG52YXIgY2xlYXJVbnZpc2l0ZWRET00gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBub2RlID0gY3VycmVudFBhcmVudDtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuICB2YXIga2V5TWFwID0gZGF0YS5rZXlNYXA7XG4gIHZhciBrZXlNYXBWYWxpZCA9IGRhdGEua2V5TWFwVmFsaWQ7XG4gIHZhciBjaGlsZCA9IG5vZGUubGFzdENoaWxkO1xuICB2YXIga2V5ID0gdW5kZWZpbmVkO1xuXG4gIGlmIChjaGlsZCA9PT0gY3VycmVudE5vZGUgJiYga2V5TWFwVmFsaWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB3aGlsZSAoY2hpbGQgIT09IGN1cnJlbnROb2RlKSB7XG4gICAgcmVtb3ZlQ2hpbGQobm9kZSwgY2hpbGQsIGtleU1hcCk7XG4gICAgY2hpbGQgPSBub2RlLmxhc3RDaGlsZDtcbiAgfVxuXG4gIC8vIENsZWFuIHRoZSBrZXlNYXAsIHJlbW92aW5nIGFueSB1bnVzdWVkIGtleXMuXG4gIGlmICgha2V5TWFwVmFsaWQpIHtcbiAgICBmb3IgKGtleSBpbiBrZXlNYXApIHtcbiAgICAgIGNoaWxkID0ga2V5TWFwW2tleV07XG4gICAgICBpZiAoY2hpbGQucGFyZW50Tm9kZSAhPT0gbm9kZSkge1xuICAgICAgICBjb250ZXh0Lm1hcmtEZWxldGVkKGNoaWxkKTtcbiAgICAgICAgZGVsZXRlIGtleU1hcFtrZXldO1xuICAgICAgfVxuICAgIH1cblxuICAgIGRhdGEua2V5TWFwVmFsaWQgPSB0cnVlO1xuICB9XG59O1xuXG4vKipcbiAqIENoYW5nZXMgdG8gdGhlIGZpcnN0IGNoaWxkIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbnZhciBlbnRlck5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50Tm9kZTtcbiAgY3VycmVudE5vZGUgPSBudWxsO1xufTtcblxuLyoqXG4gKiBAcmV0dXJuIHs/Tm9kZX0gVGhlIG5leHQgTm9kZSB0byBiZSBwYXRjaGVkLlxuICovXG52YXIgZ2V0TmV4dE5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChjdXJyZW50Tm9kZSkge1xuICAgIHJldHVybiBjdXJyZW50Tm9kZS5uZXh0U2libGluZztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY3VycmVudFBhcmVudC5maXJzdENoaWxkO1xuICB9XG59O1xuXG4vKipcbiAqIENoYW5nZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgY3VycmVudCBub2RlLlxuICovXG52YXIgbmV4dE5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gIGN1cnJlbnROb2RlID0gZ2V0TmV4dE5vZGUoKTtcbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0byB0aGUgcGFyZW50IG9mIHRoZSBjdXJyZW50IG5vZGUsIHJlbW92aW5nIGFueSB1bnZpc2l0ZWQgY2hpbGRyZW4uXG4gKi9cbnZhciBleGl0Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgY2xlYXJVbnZpc2l0ZWRET00oKTtcblxuICBjdXJyZW50Tm9kZSA9IGN1cnJlbnRQYXJlbnQ7XG4gIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50UGFyZW50LnBhcmVudE5vZGU7XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY3VycmVudCBub2RlIGlzIGFuIEVsZW1lbnQgd2l0aCBhIG1hdGNoaW5nIHRhZ05hbWUgYW5kXG4gKiBrZXkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGNvcmVFbGVtZW50T3BlbiA9IGZ1bmN0aW9uICh0YWcsIGtleSkge1xuICBuZXh0Tm9kZSgpO1xuICBhbGlnbldpdGhET00odGFnLCBrZXkpO1xuICBlbnRlck5vZGUoKTtcbiAgcmV0dXJuICgvKiogQHR5cGUgeyFFbGVtZW50fSAqL2N1cnJlbnRQYXJlbnRcbiAgKTtcbn07XG5cbi8qKlxuICogQ2xvc2VzIHRoZSBjdXJyZW50bHkgb3BlbiBFbGVtZW50LCByZW1vdmluZyBhbnkgdW52aXNpdGVkIGNoaWxkcmVuIGlmXG4gKiBuZWNlc3NhcnkuXG4gKlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBjb3JlRWxlbWVudENsb3NlID0gZnVuY3Rpb24gKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIHNldEluU2tpcChmYWxzZSk7XG4gIH1cblxuICBleGl0Tm9kZSgpO1xuICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovY3VycmVudE5vZGVcbiAgKTtcbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGUgY3VycmVudCBub2RlIGlzIGEgVGV4dCBub2RlIGFuZCBjcmVhdGVzIGEgVGV4dCBub2RlIGlmIGl0IGlzXG4gKiBub3QuXG4gKlxuICogQHJldHVybiB7IVRleHR9IFRoZSBjb3JyZXNwb25kaW5nIFRleHQgTm9kZS5cbiAqL1xudmFyIGNvcmVUZXh0ID0gZnVuY3Rpb24gKCkge1xuICBuZXh0Tm9kZSgpO1xuICBhbGlnbldpdGhET00oJyN0ZXh0JywgbnVsbCk7XG4gIHJldHVybiAoLyoqIEB0eXBlIHshVGV4dH0gKi9jdXJyZW50Tm9kZVxuICApO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBjdXJyZW50IEVsZW1lbnQgYmVpbmcgcGF0Y2hlZC5cbiAqIEByZXR1cm4geyFFbGVtZW50fVxuICovXG52YXIgY3VycmVudEVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0SW5QYXRjaCgnY3VycmVudEVsZW1lbnQnLCBjb250ZXh0KTtcbiAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoJ2N1cnJlbnRFbGVtZW50Jyk7XG4gIH1cbiAgcmV0dXJuICgvKiogQHR5cGUgeyFFbGVtZW50fSAqL2N1cnJlbnRQYXJlbnRcbiAgKTtcbn07XG5cbi8qKlxuICogQHJldHVybiB7Tm9kZX0gVGhlIE5vZGUgdGhhdCB3aWxsIGJlIGV2YWx1YXRlZCBmb3IgdGhlIG5leHQgaW5zdHJ1Y3Rpb24uXG4gKi9cbnZhciBjdXJyZW50UG9pbnRlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRJblBhdGNoKCdjdXJyZW50UG9pbnRlcicsIGNvbnRleHQpO1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygnY3VycmVudFBvaW50ZXInKTtcbiAgfVxuICByZXR1cm4gZ2V0TmV4dE5vZGUoKTtcbn07XG5cbi8qKlxuICogU2tpcHMgdGhlIGNoaWxkcmVuIGluIGEgc3VidHJlZSwgYWxsb3dpbmcgYW4gRWxlbWVudCB0byBiZSBjbG9zZWQgd2l0aG91dFxuICogY2xlYXJpbmcgb3V0IHRoZSBjaGlsZHJlbi5cbiAqL1xudmFyIHNraXAgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm9DaGlsZHJlbkRlY2xhcmVkWWV0KCdza2lwJywgY3VycmVudE5vZGUpO1xuICAgIHNldEluU2tpcCh0cnVlKTtcbiAgfVxuICBjdXJyZW50Tm9kZSA9IGN1cnJlbnRQYXJlbnQubGFzdENoaWxkO1xufTtcblxuLyoqXG4gKiBTa2lwcyB0aGUgbmV4dCBOb2RlIHRvIGJlIHBhdGNoZWQsIG1vdmluZyB0aGUgcG9pbnRlciBmb3J3YXJkIHRvIHRoZSBuZXh0XG4gKiBzaWJsaW5nIG9mIHRoZSBjdXJyZW50IHBvaW50ZXIuXG4gKi9cbnZhciBza2lwTm9kZSA9IG5leHROb2RlO1xuXG4vKipcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKiBAY29uc3QgKi9cbnZhciBzeW1ib2xzID0ge1xuICBkZWZhdWx0OiAnX19kZWZhdWx0J1xufTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7c3RyaW5nfHVuZGVmaW5lZH0gVGhlIG5hbWVzcGFjZSB0byB1c2UgZm9yIHRoZSBhdHRyaWJ1dGUuXG4gKi9cbnZhciBnZXROYW1lc3BhY2UgPSBmdW5jdGlvbiAobmFtZSkge1xuICBpZiAobmFtZS5sYXN0SW5kZXhPZigneG1sOicsIDApID09PSAwKSB7XG4gICAgcmV0dXJuICdodHRwOi8vd3d3LnczLm9yZy9YTUwvMTk5OC9uYW1lc3BhY2UnO1xuICB9XG5cbiAgaWYgKG5hbWUubGFzdEluZGV4T2YoJ3hsaW5rOicsIDApID09PSAwKSB7XG4gICAgcmV0dXJuICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJztcbiAgfVxufTtcblxuLyoqXG4gKiBBcHBsaWVzIGFuIGF0dHJpYnV0ZSBvciBwcm9wZXJ0eSB0byBhIGdpdmVuIEVsZW1lbnQuIElmIHRoZSB2YWx1ZSBpcyBudWxsXG4gKiBvciB1bmRlZmluZWQsIGl0IGlzIHJlbW92ZWQgZnJvbSB0aGUgRWxlbWVudC4gT3RoZXJ3aXNlLCB0aGUgdmFsdWUgaXMgc2V0XG4gKiBhcyBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gKiBAcGFyYW0gez8oYm9vbGVhbnxudW1iZXJ8c3RyaW5nKT19IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS5cbiAqL1xudmFyIGFwcGx5QXR0ciA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICBlbC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGF0dHJOUyA9IGdldE5hbWVzcGFjZShuYW1lKTtcbiAgICBpZiAoYXR0ck5TKSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGVOUyhhdHRyTlMsIG5hbWUsIHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWwuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQXBwbGllcyBhIHByb3BlcnR5IHRvIGEgZ2l2ZW4gRWxlbWVudC5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgcHJvcGVydHkncyBuYW1lLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgcHJvcGVydHkncyB2YWx1ZS5cbiAqL1xudmFyIGFwcGx5UHJvcCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgZWxbbmFtZV0gPSB2YWx1ZTtcbn07XG5cbi8qKlxuICogQXBwbGllcyBhIHZhbHVlIHRvIGEgc3R5bGUgZGVjbGFyYXRpb24uIFN1cHBvcnRzIENTUyBjdXN0b20gcHJvcGVydGllcyBieVxuICogc2V0dGluZyBwcm9wZXJ0aWVzIGNvbnRhaW5pbmcgYSBkYXNoIHVzaW5nIENTU1N0eWxlRGVjbGFyYXRpb24uc2V0UHJvcGVydHkuXG4gKiBAcGFyYW0ge0NTU1N0eWxlRGVjbGFyYXRpb259IHN0eWxlXG4gKiBAcGFyYW0geyFzdHJpbmd9IHByb3BcbiAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAqL1xudmFyIHNldFN0eWxlVmFsdWUgPSBmdW5jdGlvbiAoc3R5bGUsIHByb3AsIHZhbHVlKSB7XG4gIGlmIChwcm9wLmluZGV4T2YoJy0nKSA+PSAwKSB7XG4gICAgc3R5bGUuc2V0UHJvcGVydHkocHJvcCwgLyoqIEB0eXBlIHtzdHJpbmd9ICovdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIHN0eWxlW3Byb3BdID0gdmFsdWU7XG4gIH1cbn07XG5cbi8qKlxuICogQXBwbGllcyBhIHN0eWxlIHRvIGFuIEVsZW1lbnQuIE5vIHZlbmRvciBwcmVmaXggZXhwYW5zaW9uIGlzIGRvbmUgZm9yXG4gKiBwcm9wZXJ0eSBuYW1lcy92YWx1ZXMuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gKiBAcGFyYW0geyp9IHN0eWxlIFRoZSBzdHlsZSB0byBzZXQuIEVpdGhlciBhIHN0cmluZyBvZiBjc3Mgb3IgYW4gb2JqZWN0XG4gKiAgICAgY29udGFpbmluZyBwcm9wZXJ0eS12YWx1ZSBwYWlycy5cbiAqL1xudmFyIGFwcGx5U3R5bGUgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHN0eWxlKSB7XG4gIGlmICh0eXBlb2Ygc3R5bGUgPT09ICdzdHJpbmcnKSB7XG4gICAgZWwuc3R5bGUuY3NzVGV4dCA9IHN0eWxlO1xuICB9IGVsc2Uge1xuICAgIGVsLnN0eWxlLmNzc1RleHQgPSAnJztcbiAgICB2YXIgZWxTdHlsZSA9IGVsLnN0eWxlO1xuICAgIHZhciBvYmogPSAvKiogQHR5cGUgeyFPYmplY3Q8c3RyaW5nLHN0cmluZz59ICovc3R5bGU7XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgaWYgKGhhcyhvYmosIHByb3ApKSB7XG4gICAgICAgIHNldFN0eWxlVmFsdWUoZWxTdHlsZSwgcHJvcCwgb2JqW3Byb3BdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogVXBkYXRlcyBhIHNpbmdsZSBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLiBJZiB0aGUgdmFsdWUgaXMgYW4gb2JqZWN0IG9yXG4gKiAgICAgZnVuY3Rpb24gaXQgaXMgc2V0IG9uIHRoZSBFbGVtZW50LCBvdGhlcndpc2UsIGl0IGlzIHNldCBhcyBhbiBIVE1MXG4gKiAgICAgYXR0cmlidXRlLlxuICovXG52YXIgYXBwbHlBdHRyaWJ1dGVUeXBlZCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG5cbiAgaWYgKHR5cGUgPT09ICdvYmplY3QnIHx8IHR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICBhcHBseVByb3AoZWwsIG5hbWUsIHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBhcHBseUF0dHIoZWwsIG5hbWUsIC8qKiBAdHlwZSB7Pyhib29sZWFufG51bWJlcnxzdHJpbmcpfSAqL3ZhbHVlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDYWxscyB0aGUgYXBwcm9wcmlhdGUgYXR0cmlidXRlIG11dGF0b3IgZm9yIHRoaXMgYXR0cmlidXRlLlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuXG4gKi9cbnZhciB1cGRhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShlbCk7XG4gIHZhciBhdHRycyA9IGRhdGEuYXR0cnM7XG5cbiAgaWYgKGF0dHJzW25hbWVdID09PSB2YWx1ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBtdXRhdG9yID0gYXR0cmlidXRlc1tuYW1lXSB8fCBhdHRyaWJ1dGVzW3N5bWJvbHMuZGVmYXVsdF07XG4gIG11dGF0b3IoZWwsIG5hbWUsIHZhbHVlKTtcblxuICBhdHRyc1tuYW1lXSA9IHZhbHVlO1xufTtcblxuLyoqXG4gKiBBIHB1YmxpY2x5IG11dGFibGUgb2JqZWN0IHRvIHByb3ZpZGUgY3VzdG9tIG11dGF0b3JzIGZvciBhdHRyaWJ1dGVzLlxuICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgZnVuY3Rpb24oIUVsZW1lbnQsIHN0cmluZywgKik+fVxuICovXG52YXIgYXR0cmlidXRlcyA9IGNyZWF0ZU1hcCgpO1xuXG4vLyBTcGVjaWFsIGdlbmVyaWMgbXV0YXRvciB0aGF0J3MgY2FsbGVkIGZvciBhbnkgYXR0cmlidXRlIHRoYXQgZG9lcyBub3Rcbi8vIGhhdmUgYSBzcGVjaWZpYyBtdXRhdG9yLlxuYXR0cmlidXRlc1tzeW1ib2xzLmRlZmF1bHRdID0gYXBwbHlBdHRyaWJ1dGVUeXBlZDtcblxuYXR0cmlidXRlc1snc3R5bGUnXSA9IGFwcGx5U3R5bGU7XG5cbi8qKlxuICogVGhlIG9mZnNldCBpbiB0aGUgdmlydHVhbCBlbGVtZW50IGRlY2xhcmF0aW9uIHdoZXJlIHRoZSBhdHRyaWJ1dGVzIGFyZVxuICogc3BlY2lmaWVkLlxuICogQGNvbnN0XG4gKi9cbnZhciBBVFRSSUJVVEVTX09GRlNFVCA9IDM7XG5cbi8qKlxuICogQnVpbGRzIGFuIGFycmF5IG9mIGFyZ3VtZW50cyBmb3IgdXNlIHdpdGggZWxlbWVudE9wZW5TdGFydCwgYXR0ciBhbmRcbiAqIGVsZW1lbnRPcGVuRW5kLlxuICogQGNvbnN0IHtBcnJheTwqPn1cbiAqL1xudmFyIGFyZ3NCdWlsZGVyID0gW107XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKiBAcGFyYW0gey4uLip9IHZhcl9hcmdzLCBBdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGUgZHluYW1pYyBhdHRyaWJ1dGVzXG4gKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBlbGVtZW50T3BlbiA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcywgdmFyX2FyZ3MpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoJ2VsZW1lbnRPcGVuJyk7XG4gICAgYXNzZXJ0Tm90SW5Ta2lwKCdlbGVtZW50T3BlbicpO1xuICB9XG5cbiAgdmFyIG5vZGUgPSBjb3JlRWxlbWVudE9wZW4odGFnLCBrZXkpO1xuICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG5cbiAgaWYgKCFkYXRhLnN0YXRpY3NBcHBsaWVkKSB7XG4gICAgaWYgKHN0YXRpY3MpIHtcbiAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBzdGF0aWNzLmxlbmd0aDsgX2kgKz0gMikge1xuICAgICAgICB2YXIgbmFtZSA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqL3N0YXRpY3NbX2ldO1xuICAgICAgICB2YXIgdmFsdWUgPSBzdGF0aWNzW19pICsgMV07XG4gICAgICAgIHVwZGF0ZUF0dHJpYnV0ZShub2RlLCBuYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIERvd24gdGhlIHJvYWQsIHdlIG1heSB3YW50IHRvIGtlZXAgdHJhY2sgb2YgdGhlIHN0YXRpY3MgYXJyYXkgdG8gdXNlIGl0XG4gICAgLy8gYXMgYW4gYWRkaXRpb25hbCBzaWduYWwgYWJvdXQgd2hldGhlciBhIG5vZGUgbWF0Y2hlcyBvciBub3QuIEZvciBub3csXG4gICAgLy8ganVzdCB1c2UgYSBtYXJrZXIgc28gdGhhdCB3ZSBkbyBub3QgcmVhcHBseSBzdGF0aWNzLlxuICAgIGRhdGEuc3RhdGljc0FwcGxpZWQgPSB0cnVlO1xuICB9XG5cbiAgLypcbiAgICogQ2hlY2tzIHRvIHNlZSBpZiBvbmUgb3IgbW9yZSBhdHRyaWJ1dGVzIGhhdmUgY2hhbmdlZCBmb3IgYSBnaXZlbiBFbGVtZW50LlxuICAgKiBXaGVuIG5vIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkLCB0aGlzIGlzIG11Y2ggZmFzdGVyIHRoYW4gY2hlY2tpbmcgZWFjaFxuICAgKiBpbmRpdmlkdWFsIGFyZ3VtZW50LiBXaGVuIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkLCB0aGUgb3ZlcmhlYWQgb2YgdGhpcyBpc1xuICAgKiBtaW5pbWFsLlxuICAgKi9cbiAgdmFyIGF0dHJzQXJyID0gZGF0YS5hdHRyc0FycjtcbiAgdmFyIG5ld0F0dHJzID0gZGF0YS5uZXdBdHRycztcbiAgdmFyIGlzTmV3ID0gIWF0dHJzQXJyLmxlbmd0aDtcbiAgdmFyIGkgPSBBVFRSSUJVVEVTX09GRlNFVDtcbiAgdmFyIGogPSAwO1xuXG4gIGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAyLCBqICs9IDIpIHtcbiAgICB2YXIgX2F0dHIgPSBhcmd1bWVudHNbaV07XG4gICAgaWYgKGlzTmV3KSB7XG4gICAgICBhdHRyc0FycltqXSA9IF9hdHRyO1xuICAgICAgbmV3QXR0cnNbX2F0dHJdID0gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSBpZiAoYXR0cnNBcnJbal0gIT09IF9hdHRyKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgdmFsdWUgPSBhcmd1bWVudHNbaSArIDFdO1xuICAgIGlmIChpc05ldyB8fCBhdHRyc0FycltqICsgMV0gIT09IHZhbHVlKSB7XG4gICAgICBhdHRyc0FycltqICsgMV0gPSB2YWx1ZTtcbiAgICAgIHVwZGF0ZUF0dHJpYnV0ZShub2RlLCBfYXR0ciwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChpIDwgYXJndW1lbnRzLmxlbmd0aCB8fCBqIDwgYXR0cnNBcnIubGVuZ3RoKSB7XG4gICAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDEsIGogKz0gMSkge1xuICAgICAgYXR0cnNBcnJbal0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgaWYgKGogPCBhdHRyc0Fyci5sZW5ndGgpIHtcbiAgICAgIGF0dHJzQXJyLmxlbmd0aCA9IGo7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBBY3R1YWxseSBwZXJmb3JtIHRoZSBhdHRyaWJ1dGUgdXBkYXRlLlxuICAgICAqL1xuICAgIGZvciAoaSA9IDA7IGkgPCBhdHRyc0Fyci5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgdmFyIG5hbWUgPSAvKiogQHR5cGUge3N0cmluZ30gKi9hdHRyc0FycltpXTtcbiAgICAgIHZhciB2YWx1ZSA9IGF0dHJzQXJyW2kgKyAxXTtcbiAgICAgIG5ld0F0dHJzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgX2F0dHIyIGluIG5ld0F0dHJzKSB7XG4gICAgICB1cGRhdGVBdHRyaWJ1dGUobm9kZSwgX2F0dHIyLCBuZXdBdHRyc1tfYXR0cjJdKTtcbiAgICAgIG5ld0F0dHJzW19hdHRyMl0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudC4gVGhpc1xuICogY29ycmVzcG9uZHMgdG8gYW4gb3BlbmluZyB0YWcgYW5kIGEgZWxlbWVudENsb3NlIHRhZyBpcyByZXF1aXJlZC4gVGhpcyBpc1xuICogbGlrZSBlbGVtZW50T3BlbiwgYnV0IHRoZSBhdHRyaWJ1dGVzIGFyZSBkZWZpbmVkIHVzaW5nIHRoZSBhdHRyIGZ1bmN0aW9uXG4gKiByYXRoZXIgdGhhbiBiZWluZyBwYXNzZWQgYXMgYXJndW1lbnRzLiBNdXN0IGJlIGZvbGxsb3dlZCBieSAwIG9yIG1vcmUgY2FsbHNcbiAqIHRvIGF0dHIsIHRoZW4gYSBjYWxsIHRvIGVsZW1lbnRPcGVuRW5kLlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKi9cbnZhciBlbGVtZW50T3BlblN0YXJ0ID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCdlbGVtZW50T3BlblN0YXJ0Jyk7XG4gICAgc2V0SW5BdHRyaWJ1dGVzKHRydWUpO1xuICB9XG5cbiAgYXJnc0J1aWxkZXJbMF0gPSB0YWc7XG4gIGFyZ3NCdWlsZGVyWzFdID0ga2V5O1xuICBhcmdzQnVpbGRlclsyXSA9IHN0YXRpY3M7XG59O1xuXG4vKioqXG4gKiBEZWZpbmVzIGEgdmlydHVhbCBhdHRyaWJ1dGUgYXQgdGhpcyBwb2ludCBvZiB0aGUgRE9NLiBUaGlzIGlzIG9ubHkgdmFsaWRcbiAqIHdoZW4gY2FsbGVkIGJldHdlZW4gZWxlbWVudE9wZW5TdGFydCBhbmQgZWxlbWVudE9wZW5FbmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAqL1xudmFyIGF0dHIgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRJbkF0dHJpYnV0ZXMoJ2F0dHInKTtcbiAgfVxuXG4gIGFyZ3NCdWlsZGVyLnB1c2gobmFtZSk7XG4gIGFyZ3NCdWlsZGVyLnB1c2godmFsdWUpO1xufTtcblxuLyoqXG4gKiBDbG9zZXMgYW4gb3BlbiB0YWcgc3RhcnRlZCB3aXRoIGVsZW1lbnRPcGVuU3RhcnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGVsZW1lbnRPcGVuRW5kID0gZnVuY3Rpb24gKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydEluQXR0cmlidXRlcygnZWxlbWVudE9wZW5FbmQnKTtcbiAgICBzZXRJbkF0dHJpYnV0ZXMoZmFsc2UpO1xuICB9XG5cbiAgdmFyIG5vZGUgPSBlbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmdzQnVpbGRlcik7XG4gIGFyZ3NCdWlsZGVyLmxlbmd0aCA9IDA7XG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBDbG9zZXMgYW4gb3BlbiB2aXJ0dWFsIEVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgZWxlbWVudENsb3NlID0gZnVuY3Rpb24gKHRhZykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygnZWxlbWVudENsb3NlJyk7XG4gIH1cblxuICB2YXIgbm9kZSA9IGNvcmVFbGVtZW50Q2xvc2UoKTtcblxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydENsb3NlTWF0Y2hlc09wZW5UYWcoZ2V0RGF0YShub2RlKS5ub2RlTmFtZSwgdGFnKTtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBEZWNsYXJlcyBhIHZpcnR1YWwgRWxlbWVudCBhdCB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgZG9jdW1lbnQgdGhhdCBoYXNcbiAqIG5vIGNoaWxkcmVuLlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKiBAcGFyYW0gey4uLip9IHZhcl9hcmdzIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAqICAgICBmb3IgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGVsZW1lbnRWb2lkID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCB2YXJfYXJncykge1xuICBlbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICByZXR1cm4gZWxlbWVudENsb3NlKHRhZyk7XG59O1xuXG4vKipcbiAqIERlY2xhcmVzIGEgdmlydHVhbCBUZXh0IGF0IHRoaXMgcG9pbnQgaW4gdGhlIGRvY3VtZW50LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcnxib29sZWFufSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIFRleHQuXG4gKiBAcGFyYW0gey4uLihmdW5jdGlvbigoc3RyaW5nfG51bWJlcnxib29sZWFuKSk6c3RyaW5nKX0gdmFyX2FyZ3NcbiAqICAgICBGdW5jdGlvbnMgdG8gZm9ybWF0IHRoZSB2YWx1ZSB3aGljaCBhcmUgY2FsbGVkIG9ubHkgd2hlbiB0aGUgdmFsdWUgaGFzXG4gKiAgICAgY2hhbmdlZC5cbiAqIEByZXR1cm4geyFUZXh0fSBUaGUgY29ycmVzcG9uZGluZyB0ZXh0IG5vZGUuXG4gKi9cbnZhciB0ZXh0ID0gZnVuY3Rpb24gKHZhbHVlLCB2YXJfYXJncykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygndGV4dCcpO1xuICAgIGFzc2VydE5vdEluU2tpcCgndGV4dCcpO1xuICB9XG5cbiAgdmFyIG5vZGUgPSBjb3JlVGV4dCgpO1xuICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG5cbiAgaWYgKGRhdGEudGV4dCAhPT0gdmFsdWUpIHtcbiAgICBkYXRhLnRleHQgPSAvKiogQHR5cGUge3N0cmluZ30gKi92YWx1ZTtcblxuICAgIHZhciBmb3JtYXR0ZWQgPSB2YWx1ZTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgLypcbiAgICAgICAqIENhbGwgdGhlIGZvcm1hdHRlciBmdW5jdGlvbiBkaXJlY3RseSB0byBwcmV2ZW50IGxlYWtpbmcgYXJndW1lbnRzLlxuICAgICAgICogaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZS9pbmNyZW1lbnRhbC1kb20vcHVsbC8yMDQjaXNzdWVjb21tZW50LTE3ODIyMzU3NFxuICAgICAgICovXG4gICAgICB2YXIgZm4gPSBhcmd1bWVudHNbaV07XG4gICAgICBmb3JtYXR0ZWQgPSBmbihmb3JtYXR0ZWQpO1xuICAgIH1cblxuICAgIG5vZGUuZGF0YSA9IGZvcm1hdHRlZDtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufTtcblxuZXhwb3J0cy5wYXRjaCA9IHBhdGNoSW5uZXI7XG5leHBvcnRzLnBhdGNoSW5uZXIgPSBwYXRjaElubmVyO1xuZXhwb3J0cy5wYXRjaE91dGVyID0gcGF0Y2hPdXRlcjtcbmV4cG9ydHMuY3VycmVudEVsZW1lbnQgPSBjdXJyZW50RWxlbWVudDtcbmV4cG9ydHMuY3VycmVudFBvaW50ZXIgPSBjdXJyZW50UG9pbnRlcjtcbmV4cG9ydHMuc2tpcCA9IHNraXA7XG5leHBvcnRzLnNraXBOb2RlID0gc2tpcE5vZGU7XG5leHBvcnRzLmVsZW1lbnRWb2lkID0gZWxlbWVudFZvaWQ7XG5leHBvcnRzLmVsZW1lbnRPcGVuU3RhcnQgPSBlbGVtZW50T3BlblN0YXJ0O1xuZXhwb3J0cy5lbGVtZW50T3BlbkVuZCA9IGVsZW1lbnRPcGVuRW5kO1xuZXhwb3J0cy5lbGVtZW50T3BlbiA9IGVsZW1lbnRPcGVuO1xuZXhwb3J0cy5lbGVtZW50Q2xvc2UgPSBlbGVtZW50Q2xvc2U7XG5leHBvcnRzLnRleHQgPSB0ZXh0O1xuZXhwb3J0cy5hdHRyID0gYXR0cjtcbmV4cG9ydHMuc3ltYm9scyA9IHN5bWJvbHM7XG5leHBvcnRzLmF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzO1xuZXhwb3J0cy5hcHBseUF0dHIgPSBhcHBseUF0dHI7XG5leHBvcnRzLmFwcGx5UHJvcCA9IGFwcGx5UHJvcDtcbmV4cG9ydHMubm90aWZpY2F0aW9ucyA9IG5vdGlmaWNhdGlvbnM7XG5leHBvcnRzLmltcG9ydE5vZGUgPSBpbXBvcnROb2RlO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmNyZW1lbnRhbC1kb20tY2pzLmpzLm1hcCIsImV4cG9ydHNbJ2RhdGUtdGltZSddID0gL15cXGR7NH0tKD86MFswLTldezF9fDFbMC0yXXsxfSktWzAtOV17Mn1bdFQgXVxcZHsyfTpcXGR7Mn06XFxkezJ9KFxcLlxcZCspPyhbelpdfFsrLV1cXGR7Mn06XFxkezJ9KSQvXG5leHBvcnRzWydkYXRlJ10gPSAvXlxcZHs0fS0oPzowWzAtOV17MX18MVswLTJdezF9KS1bMC05XXsyfSQvXG5leHBvcnRzWyd0aW1lJ10gPSAvXlxcZHsyfTpcXGR7Mn06XFxkezJ9JC9cbmV4cG9ydHNbJ2VtYWlsJ10gPSAvXlxcUytAXFxTKyQvXG5leHBvcnRzWydpcC1hZGRyZXNzJ10gPSBleHBvcnRzWydpcHY0J10gPSAvXig/Oig/OjI1WzAtNV18MlswLTRdWzAtOV18WzAxXT9bMC05XVswLTldPylcXC4pezN9KD86MjVbMC01XXwyWzAtNF1bMC05XXxbMDFdP1swLTldWzAtOV0/KSQvXG5leHBvcnRzWydpcHY2J10gPSAvXlxccyooKChbMC05QS1GYS1mXXsxLDR9Oil7N30oWzAtOUEtRmEtZl17MSw0fXw6KSl8KChbMC05QS1GYS1mXXsxLDR9Oil7Nn0oOlswLTlBLUZhLWZdezEsNH18KCgyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkoXFwuKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKSl7M30pfDopKXwoKFswLTlBLUZhLWZdezEsNH06KXs1fSgoKDpbMC05QS1GYS1mXXsxLDR9KXsxLDJ9KXw6KCgyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkoXFwuKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKSl7M30pfDopKXwoKFswLTlBLUZhLWZdezEsNH06KXs0fSgoKDpbMC05QS1GYS1mXXsxLDR9KXsxLDN9KXwoKDpbMC05QS1GYS1mXXsxLDR9KT86KCgyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkoXFwuKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKSl7M30pKXw6KSl8KChbMC05QS1GYS1mXXsxLDR9Oil7M30oKCg6WzAtOUEtRmEtZl17MSw0fSl7MSw0fSl8KCg6WzAtOUEtRmEtZl17MSw0fSl7MCwyfTooKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKShcXC4oMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKXszfSkpfDopKXwoKFswLTlBLUZhLWZdezEsNH06KXsyfSgoKDpbMC05QS1GYS1mXXsxLDR9KXsxLDV9KXwoKDpbMC05QS1GYS1mXXsxLDR9KXswLDN9OigoMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKFxcLigyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkpezN9KSl8OikpfCgoWzAtOUEtRmEtZl17MSw0fTopezF9KCgoOlswLTlBLUZhLWZdezEsNH0pezEsNn0pfCgoOlswLTlBLUZhLWZdezEsNH0pezAsNH06KCgyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkoXFwuKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKSl7M30pKXw6KSl8KDooKCg6WzAtOUEtRmEtZl17MSw0fSl7MSw3fSl8KCg6WzAtOUEtRmEtZl17MSw0fSl7MCw1fTooKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKShcXC4oMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKXszfSkpfDopKSkoJS4rKT9cXHMqJC9cbmV4cG9ydHNbJ3VyaSddID0gL15bYS16QS1aXVthLXpBLVowLTkrLS5dKjpbXlxcc10qJC9cbmV4cG9ydHNbJ2NvbG9yJ10gPSAvKCM/KFswLTlBLUZhLWZdezMsNn0pXFxiKXwoYXF1YSl8KGJsYWNrKXwoYmx1ZSl8KGZ1Y2hzaWEpfChncmF5KXwoZ3JlZW4pfChsaW1lKXwobWFyb29uKXwobmF2eSl8KG9saXZlKXwob3JhbmdlKXwocHVycGxlKXwocmVkKXwoc2lsdmVyKXwodGVhbCl8KHdoaXRlKXwoeWVsbG93KXwocmdiXFwoXFxzKlxcYihbMC05XXxbMS05XVswLTldfDFbMC05XVswLTldfDJbMC00XVswLTldfDI1WzAtNV0pXFxiXFxzKixcXHMqXFxiKFswLTldfFsxLTldWzAtOV18MVswLTldWzAtOV18MlswLTRdWzAtOV18MjVbMC01XSlcXGJcXHMqLFxccypcXGIoWzAtOV18WzEtOV1bMC05XXwxWzAtOV1bMC05XXwyWzAtNF1bMC05XXwyNVswLTVdKVxcYlxccypcXCkpfChyZ2JcXChcXHMqKFxcZD9cXGQlfDEwMCUpK1xccyosXFxzKihcXGQ/XFxkJXwxMDAlKStcXHMqLFxccyooXFxkP1xcZCV8MTAwJSkrXFxzKlxcKSkvXG5leHBvcnRzWydob3N0bmFtZSddID0gL14oW2EtekEtWjAtOV18W2EtekEtWjAtOV1bYS16QS1aMC05XFwtXXswLDYxfVthLXpBLVowLTldKShcXC4oW2EtekEtWjAtOV18W2EtekEtWjAtOV1bYS16QS1aMC05XFwtXXswLDYxfVthLXpBLVowLTldKSkqJC9cbmV4cG9ydHNbJ2FscGhhJ10gPSAvXlthLXpBLVpdKyQvXG5leHBvcnRzWydhbHBoYW51bWVyaWMnXSA9IC9eW2EtekEtWjAtOV0rJC9cbmV4cG9ydHNbJ3N0eWxlJ10gPSAvXFxzKiguKz8pOlxccyooW147XSspOz8vZ1xuZXhwb3J0c1sncGhvbmUnXSA9IC9eXFwrKD86WzAtOV0gPyl7NiwxNH1bMC05XSQvXG5leHBvcnRzWyd1dGMtbWlsbGlzZWMnXSA9IC9eWzAtOV17MSwxNX1cXC4/WzAtOV17MCwxNX0kL1xuIiwidmFyIGdlbm9iaiA9IHJlcXVpcmUoJ2dlbmVyYXRlLW9iamVjdC1wcm9wZXJ0eScpXG52YXIgZ2VuZnVuID0gcmVxdWlyZSgnZ2VuZXJhdGUtZnVuY3Rpb24nKVxudmFyIGpzb25wb2ludGVyID0gcmVxdWlyZSgnanNvbnBvaW50ZXInKVxudmFyIHh0ZW5kID0gcmVxdWlyZSgneHRlbmQnKVxudmFyIGZvcm1hdHMgPSByZXF1aXJlKCcuL2Zvcm1hdHMnKVxuXG52YXIgZ2V0ID0gZnVuY3Rpb24ob2JqLCBhZGRpdGlvbmFsU2NoZW1hcywgcHRyKSB7XG5cbiAgdmFyIHZpc2l0ID0gZnVuY3Rpb24oc3ViKSB7XG4gICAgaWYgKHN1YiAmJiBzdWIuaWQgPT09IHB0cikgcmV0dXJuIHN1YlxuICAgIGlmICh0eXBlb2Ygc3ViICE9PSAnb2JqZWN0JyB8fCAhc3ViKSByZXR1cm4gbnVsbFxuICAgIHJldHVybiBPYmplY3Qua2V5cyhzdWIpLnJlZHVjZShmdW5jdGlvbihyZXMsIGspIHtcbiAgICAgIHJldHVybiByZXMgfHwgdmlzaXQoc3ViW2tdKVxuICAgIH0sIG51bGwpXG4gIH1cblxuICB2YXIgcmVzID0gdmlzaXQob2JqKVxuICBpZiAocmVzKSByZXR1cm4gcmVzXG5cbiAgcHRyID0gcHRyLnJlcGxhY2UoL14jLywgJycpXG4gIHB0ciA9IHB0ci5yZXBsYWNlKC9cXC8kLywgJycpXG5cbiAgdHJ5IHtcbiAgICByZXR1cm4ganNvbnBvaW50ZXIuZ2V0KG9iaiwgZGVjb2RlVVJJKHB0cikpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHZhciBlbmQgPSBwdHIuaW5kZXhPZignIycpXG4gICAgdmFyIG90aGVyXG4gICAgLy8gZXh0ZXJuYWwgcmVmZXJlbmNlXG4gICAgaWYgKGVuZCAhPT0gMCkge1xuICAgICAgLy8gZnJhZ21lbnQgZG9lc24ndCBleGlzdC5cbiAgICAgIGlmIChlbmQgPT09IC0xKSB7XG4gICAgICAgIG90aGVyID0gYWRkaXRpb25hbFNjaGVtYXNbcHRyXVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGV4dCA9IHB0ci5zbGljZSgwLCBlbmQpXG4gICAgICAgIG90aGVyID0gYWRkaXRpb25hbFNjaGVtYXNbZXh0XVxuICAgICAgICB2YXIgZnJhZ21lbnQgPSBwdHIuc2xpY2UoZW5kKS5yZXBsYWNlKC9eIy8sICcnKVxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBqc29ucG9pbnRlci5nZXQob3RoZXIsIGZyYWdtZW50KVxuICAgICAgICB9IGNhdGNoIChlcnIpIHt9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG90aGVyID0gYWRkaXRpb25hbFNjaGVtYXNbcHRyXVxuICAgIH1cbiAgICByZXR1cm4gb3RoZXIgfHwgbnVsbFxuICB9XG59XG5cbnZhciBmb3JtYXROYW1lID0gZnVuY3Rpb24oZmllbGQpIHtcbiAgZmllbGQgPSBKU09OLnN0cmluZ2lmeShmaWVsZClcbiAgdmFyIHBhdHRlcm4gPSAvXFxbKFteXFxbXFxdXCJdKylcXF0vXG4gIHdoaWxlIChwYXR0ZXJuLnRlc3QoZmllbGQpKSBmaWVsZCA9IGZpZWxkLnJlcGxhY2UocGF0dGVybiwgJy5cIiskMStcIicpXG4gIHJldHVybiBmaWVsZFxufVxuXG52YXIgdHlwZXMgPSB7fVxuXG50eXBlcy5hbnkgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICd0cnVlJ1xufVxuXG50eXBlcy5udWxsID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gbmFtZSsnID09PSBudWxsJ1xufVxuXG50eXBlcy5ib29sZWFuID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gJ3R5cGVvZiAnK25hbWUrJyA9PT0gXCJib29sZWFuXCInXG59XG5cbnR5cGVzLmFycmF5ID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gJ0FycmF5LmlzQXJyYXkoJytuYW1lKycpJ1xufVxuXG50eXBlcy5vYmplY3QgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiAndHlwZW9mICcrbmFtZSsnID09PSBcIm9iamVjdFwiICYmICcrbmFtZSsnICYmICFBcnJheS5pc0FycmF5KCcrbmFtZSsnKSdcbn1cblxudHlwZXMubnVtYmVyID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gJ3R5cGVvZiAnK25hbWUrJyA9PT0gXCJudW1iZXJcIidcbn1cblxudHlwZXMuaW50ZWdlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuICd0eXBlb2YgJytuYW1lKycgPT09IFwibnVtYmVyXCIgJiYgKE1hdGguZmxvb3IoJytuYW1lKycpID09PSAnK25hbWUrJyB8fCAnK25hbWUrJyA+IDkwMDcxOTkyNTQ3NDA5OTIgfHwgJytuYW1lKycgPCAtOTAwNzE5OTI1NDc0MDk5MiknXG59XG5cbnR5cGVzLnN0cmluZyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuICd0eXBlb2YgJytuYW1lKycgPT09IFwic3RyaW5nXCInXG59XG5cbnZhciB1bmlxdWUgPSBmdW5jdGlvbihhcnJheSkge1xuICB2YXIgbGlzdCA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICBsaXN0LnB1c2godHlwZW9mIGFycmF5W2ldID09PSAnb2JqZWN0JyA/IEpTT04uc3RyaW5naWZ5KGFycmF5W2ldKSA6IGFycmF5W2ldKVxuICB9XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIGlmIChsaXN0LmluZGV4T2YobGlzdFtpXSkgIT09IGkpIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiB0cnVlXG59XG5cbnZhciBpc011bHRpcGxlT2YgPSBmdW5jdGlvbihuYW1lLCBtdWx0aXBsZU9mKSB7XG4gIHZhciByZXM7XG4gIHZhciBmYWN0b3IgPSAoKG11bHRpcGxlT2YgfCAwKSAhPT0gbXVsdGlwbGVPZikgPyBNYXRoLnBvdygxMCwgbXVsdGlwbGVPZi50b1N0cmluZygpLnNwbGl0KCcuJykucG9wKCkubGVuZ3RoKSA6IDFcbiAgaWYgKGZhY3RvciA+IDEpIHtcbiAgICB2YXIgZmFjdG9yTmFtZSA9ICgobmFtZSB8IDApICE9PSBuYW1lKSA/IE1hdGgucG93KDEwLCBuYW1lLnRvU3RyaW5nKCkuc3BsaXQoJy4nKS5wb3AoKS5sZW5ndGgpIDogMVxuICAgIGlmIChmYWN0b3JOYW1lID4gZmFjdG9yKSByZXMgPSB0cnVlXG4gICAgZWxzZSByZXMgPSBNYXRoLnJvdW5kKGZhY3RvciAqIG5hbWUpICUgKGZhY3RvciAqIG11bHRpcGxlT2YpXG4gIH1cbiAgZWxzZSByZXMgPSBuYW1lICUgbXVsdGlwbGVPZjtcbiAgcmV0dXJuICFyZXM7XG59XG5cbnZhciB0b1R5cGUgPSBmdW5jdGlvbihub2RlKSB7XG4gIHJldHVybiBub2RlLnR5cGVcbn1cblxudmFyIGNvbXBpbGUgPSBmdW5jdGlvbihzY2hlbWEsIGNhY2hlLCByb290LCByZXBvcnRlciwgb3B0cykge1xuICB2YXIgZm10cyA9IG9wdHMgPyB4dGVuZChmb3JtYXRzLCBvcHRzLmZvcm1hdHMpIDogZm9ybWF0c1xuICB2YXIgc2NvcGUgPSB7dW5pcXVlOnVuaXF1ZSwgZm9ybWF0czpmbXRzLCBpc011bHRpcGxlT2Y6aXNNdWx0aXBsZU9mfVxuICB2YXIgdmVyYm9zZSA9IG9wdHMgPyAhIW9wdHMudmVyYm9zZSA6IGZhbHNlO1xuICB2YXIgZ3JlZWR5ID0gb3B0cyAmJiBvcHRzLmdyZWVkeSAhPT0gdW5kZWZpbmVkID9cbiAgICBvcHRzLmdyZWVkeSA6IGZhbHNlO1xuXG4gIHZhciBzeW1zID0ge31cbiAgdmFyIGdlbnN5bSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gbmFtZSsoc3ltc1tuYW1lXSA9IChzeW1zW25hbWVdIHx8IDApKzEpXG4gIH1cblxuICB2YXIgcmV2ZXJzZVBhdHRlcm5zID0ge31cbiAgdmFyIHBhdHRlcm5zID0gZnVuY3Rpb24ocCkge1xuICAgIGlmIChyZXZlcnNlUGF0dGVybnNbcF0pIHJldHVybiByZXZlcnNlUGF0dGVybnNbcF1cbiAgICB2YXIgbiA9IGdlbnN5bSgncGF0dGVybicpXG4gICAgc2NvcGVbbl0gPSBuZXcgUmVnRXhwKHApXG4gICAgcmV2ZXJzZVBhdHRlcm5zW3BdID0gblxuICAgIHJldHVybiBuXG4gIH1cblxuICB2YXIgdmFycyA9IFsnaScsJ2onLCdrJywnbCcsJ20nLCduJywnbycsJ3AnLCdxJywncicsJ3MnLCd0JywndScsJ3YnLCd4JywneScsJ3onXVxuICB2YXIgZ2VubG9vcCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2ID0gdmFycy5zaGlmdCgpXG4gICAgdmFycy5wdXNoKHYrdlswXSlcbiAgICByZXR1cm4gdlxuICB9XG5cbiAgdmFyIHZpc2l0ID0gZnVuY3Rpb24obmFtZSwgbm9kZSwgcmVwb3J0ZXIsIGZpbHRlcikge1xuICAgIHZhciBwcm9wZXJ0aWVzID0gbm9kZS5wcm9wZXJ0aWVzXG4gICAgdmFyIHR5cGUgPSBub2RlLnR5cGVcbiAgICB2YXIgdHVwbGUgPSBmYWxzZVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkobm9kZS5pdGVtcykpIHsgLy8gdHVwbGUgdHlwZVxuICAgICAgcHJvcGVydGllcyA9IHt9XG4gICAgICBub2RlLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSwgaSkge1xuICAgICAgICBwcm9wZXJ0aWVzW2ldID0gaXRlbVxuICAgICAgfSlcbiAgICAgIHR5cGUgPSAnYXJyYXknXG4gICAgICB0dXBsZSA9IHRydWVcbiAgICB9XG5cbiAgICB2YXIgaW5kZW50ID0gMFxuICAgIHZhciBlcnJvciA9IGZ1bmN0aW9uKG1zZywgcHJvcCwgdmFsdWUpIHtcbiAgICAgIHZhbGlkYXRlKCdlcnJvcnMrKycpXG4gICAgICBpZiAocmVwb3J0ZXIgPT09IHRydWUpIHtcbiAgICAgICAgdmFsaWRhdGUoJ2lmICh2YWxpZGF0ZS5lcnJvcnMgPT09IG51bGwpIHZhbGlkYXRlLmVycm9ycyA9IFtdJylcbiAgICAgICAgaWYgKHZlcmJvc2UpIHtcbiAgICAgICAgICB2YWxpZGF0ZSgndmFsaWRhdGUuZXJyb3JzLnB1c2goe2ZpZWxkOiVzLG1lc3NhZ2U6JXMsdmFsdWU6JXMsdHlwZTolc30pJywgZm9ybWF0TmFtZShwcm9wIHx8IG5hbWUpLCBKU09OLnN0cmluZ2lmeShtc2cpLCB2YWx1ZSB8fCBuYW1lLCBKU09OLnN0cmluZ2lmeSh0eXBlKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWxpZGF0ZSgndmFsaWRhdGUuZXJyb3JzLnB1c2goe2ZpZWxkOiVzLG1lc3NhZ2U6JXN9KScsIGZvcm1hdE5hbWUocHJvcCB8fCBuYW1lKSwgSlNPTi5zdHJpbmdpZnkobXNnKSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChub2RlLnJlcXVpcmVkID09PSB0cnVlKSB7XG4gICAgICBpbmRlbnQrK1xuICAgICAgdmFsaWRhdGUoJ2lmICglcyA9PT0gdW5kZWZpbmVkKSB7JywgbmFtZSlcbiAgICAgIGVycm9yKCdpcyByZXF1aXJlZCcpXG4gICAgICB2YWxpZGF0ZSgnfSBlbHNlIHsnKVxuICAgIH0gZWxzZSB7XG4gICAgICBpbmRlbnQrK1xuICAgICAgdmFsaWRhdGUoJ2lmICglcyAhPT0gdW5kZWZpbmVkKSB7JywgbmFtZSlcbiAgICB9XG5cbiAgICB2YXIgdmFsaWQgPSBbXS5jb25jYXQodHlwZSlcbiAgICAgIC5tYXAoZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gdHlwZXNbdCB8fCAnYW55J10obmFtZSlcbiAgICAgIH0pXG4gICAgICAuam9pbignIHx8ICcpIHx8ICd0cnVlJ1xuXG4gICAgaWYgKHZhbGlkICE9PSAndHJ1ZScpIHtcbiAgICAgIGluZGVudCsrXG4gICAgICB2YWxpZGF0ZSgnaWYgKCEoJXMpKSB7JywgdmFsaWQpXG4gICAgICBlcnJvcignaXMgdGhlIHdyb25nIHR5cGUnKVxuICAgICAgdmFsaWRhdGUoJ30gZWxzZSB7JylcbiAgICB9XG5cbiAgICBpZiAodHVwbGUpIHtcbiAgICAgIGlmIChub2RlLmFkZGl0aW9uYWxJdGVtcyA9PT0gZmFsc2UpIHtcbiAgICAgICAgdmFsaWRhdGUoJ2lmICglcy5sZW5ndGggPiAlZCkgeycsIG5hbWUsIG5vZGUuaXRlbXMubGVuZ3RoKVxuICAgICAgICBlcnJvcignaGFzIGFkZGl0aW9uYWwgaXRlbXMnKVxuICAgICAgICB2YWxpZGF0ZSgnfScpXG4gICAgICB9IGVsc2UgaWYgKG5vZGUuYWRkaXRpb25hbEl0ZW1zKSB7XG4gICAgICAgIHZhciBpID0gZ2VubG9vcCgpXG4gICAgICAgIHZhbGlkYXRlKCdmb3IgKHZhciAlcyA9ICVkOyAlcyA8ICVzLmxlbmd0aDsgJXMrKykgeycsIGksIG5vZGUuaXRlbXMubGVuZ3RoLCBpLCBuYW1lLCBpKVxuICAgICAgICB2aXNpdChuYW1lKydbJytpKyddJywgbm9kZS5hZGRpdGlvbmFsSXRlbXMsIHJlcG9ydGVyLCBmaWx0ZXIpXG4gICAgICAgIHZhbGlkYXRlKCd9JylcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobm9kZS5mb3JtYXQgJiYgZm10c1tub2RlLmZvcm1hdF0pIHtcbiAgICAgIGlmICh0eXBlICE9PSAnc3RyaW5nJyAmJiBmb3JtYXRzW25vZGUuZm9ybWF0XSkgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLnN0cmluZyhuYW1lKSlcbiAgICAgIHZhciBuID0gZ2Vuc3ltKCdmb3JtYXQnKVxuICAgICAgc2NvcGVbbl0gPSBmbXRzW25vZGUuZm9ybWF0XVxuXG4gICAgICBpZiAodHlwZW9mIHNjb3BlW25dID09PSAnZnVuY3Rpb24nKSB2YWxpZGF0ZSgnaWYgKCElcyglcykpIHsnLCBuLCBuYW1lKVxuICAgICAgZWxzZSB2YWxpZGF0ZSgnaWYgKCElcy50ZXN0KCVzKSkgeycsIG4sIG5hbWUpXG4gICAgICBlcnJvcignbXVzdCBiZSAnK25vZGUuZm9ybWF0KycgZm9ybWF0JylcbiAgICAgIHZhbGlkYXRlKCd9JylcbiAgICAgIGlmICh0eXBlICE9PSAnc3RyaW5nJyAmJiBmb3JtYXRzW25vZGUuZm9ybWF0XSkgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KG5vZGUucmVxdWlyZWQpKSB7XG4gICAgICB2YXIgaXNVbmRlZmluZWQgPSBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgcmV0dXJuIGdlbm9iaihuYW1lLCByZXEpICsgJyA9PT0gdW5kZWZpbmVkJ1xuICAgICAgfVxuXG4gICAgICB2YXIgY2hlY2tSZXF1aXJlZCA9IGZ1bmN0aW9uIChyZXEpIHtcbiAgICAgICAgdmFyIHByb3AgPSBnZW5vYmoobmFtZSwgcmVxKTtcbiAgICAgICAgdmFsaWRhdGUoJ2lmICglcyA9PT0gdW5kZWZpbmVkKSB7JywgcHJvcClcbiAgICAgICAgZXJyb3IoJ2lzIHJlcXVpcmVkJywgcHJvcClcbiAgICAgICAgdmFsaWRhdGUoJ21pc3NpbmcrKycpXG4gICAgICAgIHZhbGlkYXRlKCd9JylcbiAgICAgIH1cbiAgICAgIHZhbGlkYXRlKCdpZiAoKCVzKSkgeycsIHR5cGUgIT09ICdvYmplY3QnID8gdHlwZXMub2JqZWN0KG5hbWUpIDogJ3RydWUnKVxuICAgICAgdmFsaWRhdGUoJ3ZhciBtaXNzaW5nID0gMCcpXG4gICAgICBub2RlLnJlcXVpcmVkLm1hcChjaGVja1JlcXVpcmVkKVxuICAgICAgdmFsaWRhdGUoJ30nKTtcbiAgICAgIGlmICghZ3JlZWR5KSB7XG4gICAgICAgIHZhbGlkYXRlKCdpZiAobWlzc2luZyA9PT0gMCkgeycpXG4gICAgICAgIGluZGVudCsrXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG5vZGUudW5pcXVlSXRlbXMpIHtcbiAgICAgIGlmICh0eXBlICE9PSAnYXJyYXknKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMuYXJyYXkobmFtZSkpXG4gICAgICB2YWxpZGF0ZSgnaWYgKCEodW5pcXVlKCVzKSkpIHsnLCBuYW1lKVxuICAgICAgZXJyb3IoJ211c3QgYmUgdW5pcXVlJylcbiAgICAgIHZhbGlkYXRlKCd9JylcbiAgICAgIGlmICh0eXBlICE9PSAnYXJyYXknKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUuZW51bSkge1xuICAgICAgdmFyIGNvbXBsZXggPSBub2RlLmVudW0uc29tZShmdW5jdGlvbihlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgZSA9PT0gJ29iamVjdCdcbiAgICAgIH0pXG5cbiAgICAgIHZhciBjb21wYXJlID0gY29tcGxleCA/XG4gICAgICAgIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICByZXR1cm4gJ0pTT04uc3RyaW5naWZ5KCcrbmFtZSsnKScrJyAhPT0gSlNPTi5zdHJpbmdpZnkoJytKU09OLnN0cmluZ2lmeShlKSsnKSdcbiAgICAgICAgfSA6XG4gICAgICAgIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICByZXR1cm4gbmFtZSsnICE9PSAnK0pTT04uc3RyaW5naWZ5KGUpXG4gICAgICAgIH1cblxuICAgICAgdmFsaWRhdGUoJ2lmICglcykgeycsIG5vZGUuZW51bS5tYXAoY29tcGFyZSkuam9pbignICYmICcpIHx8ICdmYWxzZScpXG4gICAgICBlcnJvcignbXVzdCBiZSBhbiBlbnVtIHZhbHVlJylcbiAgICAgIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5kZXBlbmRlbmNpZXMpIHtcbiAgICAgIGlmICh0eXBlICE9PSAnb2JqZWN0JykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLm9iamVjdChuYW1lKSlcblxuICAgICAgT2JqZWN0LmtleXMobm9kZS5kZXBlbmRlbmNpZXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHZhciBkZXBzID0gbm9kZS5kZXBlbmRlbmNpZXNba2V5XVxuICAgICAgICBpZiAodHlwZW9mIGRlcHMgPT09ICdzdHJpbmcnKSBkZXBzID0gW2RlcHNdXG5cbiAgICAgICAgdmFyIGV4aXN0cyA9IGZ1bmN0aW9uKGspIHtcbiAgICAgICAgICByZXR1cm4gZ2Vub2JqKG5hbWUsIGspICsgJyAhPT0gdW5kZWZpbmVkJ1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGVwcykpIHtcbiAgICAgICAgICB2YWxpZGF0ZSgnaWYgKCVzICE9PSB1bmRlZmluZWQgJiYgISglcykpIHsnLCBnZW5vYmoobmFtZSwga2V5KSwgZGVwcy5tYXAoZXhpc3RzKS5qb2luKCcgJiYgJykgfHwgJ3RydWUnKVxuICAgICAgICAgIGVycm9yKCdkZXBlbmRlbmNpZXMgbm90IHNldCcpXG4gICAgICAgICAgdmFsaWRhdGUoJ30nKVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZGVwcyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB2YWxpZGF0ZSgnaWYgKCVzICE9PSB1bmRlZmluZWQpIHsnLCBnZW5vYmoobmFtZSwga2V5KSlcbiAgICAgICAgICB2aXNpdChuYW1lLCBkZXBzLCByZXBvcnRlciwgZmlsdGVyKVxuICAgICAgICAgIHZhbGlkYXRlKCd9JylcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgaWYgKHR5cGUgIT09ICdvYmplY3QnKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUuYWRkaXRpb25hbFByb3BlcnRpZXMgfHwgbm9kZS5hZGRpdGlvbmFsUHJvcGVydGllcyA9PT0gZmFsc2UpIHtcbiAgICAgIGlmICh0eXBlICE9PSAnb2JqZWN0JykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLm9iamVjdChuYW1lKSlcblxuICAgICAgdmFyIGkgPSBnZW5sb29wKClcbiAgICAgIHZhciBrZXlzID0gZ2Vuc3ltKCdrZXlzJylcblxuICAgICAgdmFyIHRvQ29tcGFyZSA9IGZ1bmN0aW9uKHApIHtcbiAgICAgICAgcmV0dXJuIGtleXMrJ1snK2krJ10gIT09ICcrSlNPTi5zdHJpbmdpZnkocClcbiAgICAgIH1cblxuICAgICAgdmFyIHRvVGVzdCA9IGZ1bmN0aW9uKHApIHtcbiAgICAgICAgcmV0dXJuICchJytwYXR0ZXJucyhwKSsnLnRlc3QoJytrZXlzKydbJytpKyddKSdcbiAgICAgIH1cblxuICAgICAgdmFyIGFkZGl0aW9uYWxQcm9wID0gT2JqZWN0LmtleXMocHJvcGVydGllcyB8fCB7fSkubWFwKHRvQ29tcGFyZSlcbiAgICAgICAgLmNvbmNhdChPYmplY3Qua2V5cyhub2RlLnBhdHRlcm5Qcm9wZXJ0aWVzIHx8IHt9KS5tYXAodG9UZXN0KSlcbiAgICAgICAgLmpvaW4oJyAmJiAnKSB8fCAndHJ1ZSdcblxuICAgICAgdmFsaWRhdGUoJ3ZhciAlcyA9IE9iamVjdC5rZXlzKCVzKScsIGtleXMsIG5hbWUpXG4gICAgICAgICgnZm9yICh2YXIgJXMgPSAwOyAlcyA8ICVzLmxlbmd0aDsgJXMrKykgeycsIGksIGksIGtleXMsIGkpXG4gICAgICAgICAgKCdpZiAoJXMpIHsnLCBhZGRpdGlvbmFsUHJvcClcblxuICAgICAgaWYgKG5vZGUuYWRkaXRpb25hbFByb3BlcnRpZXMgPT09IGZhbHNlKSB7XG4gICAgICAgIGlmIChmaWx0ZXIpIHZhbGlkYXRlKCdkZWxldGUgJXMnLCBuYW1lKydbJytrZXlzKydbJytpKyddXScpXG4gICAgICAgIGVycm9yKCdoYXMgYWRkaXRpb25hbCBwcm9wZXJ0aWVzJywgbnVsbCwgSlNPTi5zdHJpbmdpZnkobmFtZSsnLicpICsgJyArICcgKyBrZXlzICsgJ1snK2krJ10nKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlzaXQobmFtZSsnWycra2V5cysnWycraSsnXV0nLCBub2RlLmFkZGl0aW9uYWxQcm9wZXJ0aWVzLCByZXBvcnRlciwgZmlsdGVyKVxuICAgICAgfVxuXG4gICAgICB2YWxpZGF0ZVxuICAgICAgICAgICgnfScpXG4gICAgICAgICgnfScpXG5cbiAgICAgIGlmICh0eXBlICE9PSAnb2JqZWN0JykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLiRyZWYpIHtcbiAgICAgIHZhciBzdWIgPSBnZXQocm9vdCwgb3B0cyAmJiBvcHRzLnNjaGVtYXMgfHwge30sIG5vZGUuJHJlZilcbiAgICAgIGlmIChzdWIpIHtcbiAgICAgICAgdmFyIGZuID0gY2FjaGVbbm9kZS4kcmVmXVxuICAgICAgICBpZiAoIWZuKSB7XG4gICAgICAgICAgY2FjaGVbbm9kZS4kcmVmXSA9IGZ1bmN0aW9uIHByb3h5KGRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBmbihkYXRhKVxuICAgICAgICAgIH1cbiAgICAgICAgICBmbiA9IGNvbXBpbGUoc3ViLCBjYWNoZSwgcm9vdCwgZmFsc2UsIG9wdHMpXG4gICAgICAgIH1cbiAgICAgICAgdmFyIG4gPSBnZW5zeW0oJ3JlZicpXG4gICAgICAgIHNjb3BlW25dID0gZm5cbiAgICAgICAgdmFsaWRhdGUoJ2lmICghKCVzKCVzKSkpIHsnLCBuLCBuYW1lKVxuICAgICAgICBlcnJvcigncmVmZXJlbmNlZCBzY2hlbWEgZG9lcyBub3QgbWF0Y2gnKVxuICAgICAgICB2YWxpZGF0ZSgnfScpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG5vZGUubm90KSB7XG4gICAgICB2YXIgcHJldiA9IGdlbnN5bSgncHJldicpXG4gICAgICB2YWxpZGF0ZSgndmFyICVzID0gZXJyb3JzJywgcHJldilcbiAgICAgIHZpc2l0KG5hbWUsIG5vZGUubm90LCBmYWxzZSwgZmlsdGVyKVxuICAgICAgdmFsaWRhdGUoJ2lmICglcyA9PT0gZXJyb3JzKSB7JywgcHJldilcbiAgICAgIGVycm9yKCduZWdhdGl2ZSBzY2hlbWEgbWF0Y2hlcycpXG4gICAgICB2YWxpZGF0ZSgnfSBlbHNlIHsnKVxuICAgICAgICAoJ2Vycm9ycyA9ICVzJywgcHJldilcbiAgICAgICgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUuaXRlbXMgJiYgIXR1cGxlKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ2FycmF5JykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLmFycmF5KG5hbWUpKVxuXG4gICAgICB2YXIgaSA9IGdlbmxvb3AoKVxuICAgICAgdmFsaWRhdGUoJ2ZvciAodmFyICVzID0gMDsgJXMgPCAlcy5sZW5ndGg7ICVzKyspIHsnLCBpLCBpLCBuYW1lLCBpKVxuICAgICAgdmlzaXQobmFtZSsnWycraSsnXScsIG5vZGUuaXRlbXMsIHJlcG9ydGVyLCBmaWx0ZXIpXG4gICAgICB2YWxpZGF0ZSgnfScpXG5cbiAgICAgIGlmICh0eXBlICE9PSAnYXJyYXknKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUucGF0dGVyblByb3BlcnRpZXMpIHtcbiAgICAgIGlmICh0eXBlICE9PSAnb2JqZWN0JykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLm9iamVjdChuYW1lKSlcbiAgICAgIHZhciBrZXlzID0gZ2Vuc3ltKCdrZXlzJylcbiAgICAgIHZhciBpID0gZ2VubG9vcCgpXG4gICAgICB2YWxpZGF0ZVxuICAgICAgICAoJ3ZhciAlcyA9IE9iamVjdC5rZXlzKCVzKScsIGtleXMsIG5hbWUpXG4gICAgICAgICgnZm9yICh2YXIgJXMgPSAwOyAlcyA8ICVzLmxlbmd0aDsgJXMrKykgeycsIGksIGksIGtleXMsIGkpXG5cbiAgICAgIE9iamVjdC5rZXlzKG5vZGUucGF0dGVyblByb3BlcnRpZXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHZhciBwID0gcGF0dGVybnMoa2V5KVxuICAgICAgICB2YWxpZGF0ZSgnaWYgKCVzLnRlc3QoJXMpKSB7JywgcCwga2V5cysnWycraSsnXScpXG4gICAgICAgIHZpc2l0KG5hbWUrJ1snK2tleXMrJ1snK2krJ11dJywgbm9kZS5wYXR0ZXJuUHJvcGVydGllc1trZXldLCByZXBvcnRlciwgZmlsdGVyKVxuICAgICAgICB2YWxpZGF0ZSgnfScpXG4gICAgICB9KVxuXG4gICAgICB2YWxpZGF0ZSgnfScpXG4gICAgICBpZiAodHlwZSAhPT0gJ29iamVjdCcpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5wYXR0ZXJuKSB7XG4gICAgICB2YXIgcCA9IHBhdHRlcm5zKG5vZGUucGF0dGVybilcbiAgICAgIGlmICh0eXBlICE9PSAnc3RyaW5nJykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLnN0cmluZyhuYW1lKSlcbiAgICAgIHZhbGlkYXRlKCdpZiAoISglcy50ZXN0KCVzKSkpIHsnLCBwLCBuYW1lKVxuICAgICAgZXJyb3IoJ3BhdHRlcm4gbWlzbWF0Y2gnKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuICAgICAgaWYgKHR5cGUgIT09ICdzdHJpbmcnKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUuYWxsT2YpIHtcbiAgICAgIG5vZGUuYWxsT2YuZm9yRWFjaChmdW5jdGlvbihzY2gpIHtcbiAgICAgICAgdmlzaXQobmFtZSwgc2NoLCByZXBvcnRlciwgZmlsdGVyKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAobm9kZS5hbnlPZiAmJiBub2RlLmFueU9mLmxlbmd0aCkge1xuICAgICAgdmFyIHByZXYgPSBnZW5zeW0oJ3ByZXYnKVxuXG4gICAgICBub2RlLmFueU9mLmZvckVhY2goZnVuY3Rpb24oc2NoLCBpKSB7XG4gICAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgdmFsaWRhdGUoJ3ZhciAlcyA9IGVycm9ycycsIHByZXYpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsaWRhdGUoJ2lmIChlcnJvcnMgIT09ICVzKSB7JywgcHJldilcbiAgICAgICAgICAgICgnZXJyb3JzID0gJXMnLCBwcmV2KVxuICAgICAgICB9XG4gICAgICAgIHZpc2l0KG5hbWUsIHNjaCwgZmFsc2UsIGZhbHNlKVxuICAgICAgfSlcbiAgICAgIG5vZGUuYW55T2YuZm9yRWFjaChmdW5jdGlvbihzY2gsIGkpIHtcbiAgICAgICAgaWYgKGkpIHZhbGlkYXRlKCd9JylcbiAgICAgIH0pXG4gICAgICB2YWxpZGF0ZSgnaWYgKCVzICE9PSBlcnJvcnMpIHsnLCBwcmV2KVxuICAgICAgZXJyb3IoJ25vIHNjaGVtYXMgbWF0Y2gnKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLm9uZU9mICYmIG5vZGUub25lT2YubGVuZ3RoKSB7XG4gICAgICB2YXIgcHJldiA9IGdlbnN5bSgncHJldicpXG4gICAgICB2YXIgcGFzc2VzID0gZ2Vuc3ltKCdwYXNzZXMnKVxuXG4gICAgICB2YWxpZGF0ZVxuICAgICAgICAoJ3ZhciAlcyA9IGVycm9ycycsIHByZXYpXG4gICAgICAgICgndmFyICVzID0gMCcsIHBhc3NlcylcblxuICAgICAgbm9kZS5vbmVPZi5mb3JFYWNoKGZ1bmN0aW9uKHNjaCwgaSkge1xuICAgICAgICB2aXNpdChuYW1lLCBzY2gsIGZhbHNlLCBmYWxzZSlcbiAgICAgICAgdmFsaWRhdGUoJ2lmICglcyA9PT0gZXJyb3JzKSB7JywgcHJldilcbiAgICAgICAgICAoJyVzKysnLCBwYXNzZXMpXG4gICAgICAgICgnfSBlbHNlIHsnKVxuICAgICAgICAgICgnZXJyb3JzID0gJXMnLCBwcmV2KVxuICAgICAgICAoJ30nKVxuICAgICAgfSlcblxuICAgICAgdmFsaWRhdGUoJ2lmICglcyAhPT0gMSkgeycsIHBhc3NlcylcbiAgICAgIGVycm9yKCdubyAob3IgbW9yZSB0aGFuIG9uZSkgc2NoZW1hcyBtYXRjaCcpXG4gICAgICB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUubXVsdGlwbGVPZiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ251bWJlcicgJiYgdHlwZSAhPT0gJ2ludGVnZXInKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMubnVtYmVyKG5hbWUpKVxuXG4gICAgICB2YWxpZGF0ZSgnaWYgKCFpc011bHRpcGxlT2YoJXMsICVkKSkgeycsIG5hbWUsIG5vZGUubXVsdGlwbGVPZilcblxuICAgICAgZXJyb3IoJ2hhcyBhIHJlbWFpbmRlcicpXG4gICAgICB2YWxpZGF0ZSgnfScpXG5cbiAgICAgIGlmICh0eXBlICE9PSAnbnVtYmVyJyAmJiB0eXBlICE9PSAnaW50ZWdlcicpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5tYXhQcm9wZXJ0aWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eXBlICE9PSAnb2JqZWN0JykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLm9iamVjdChuYW1lKSlcblxuICAgICAgdmFsaWRhdGUoJ2lmIChPYmplY3Qua2V5cyglcykubGVuZ3RoID4gJWQpIHsnLCBuYW1lLCBub2RlLm1heFByb3BlcnRpZXMpXG4gICAgICBlcnJvcignaGFzIG1vcmUgcHJvcGVydGllcyB0aGFuIGFsbG93ZWQnKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuXG4gICAgICBpZiAodHlwZSAhPT0gJ29iamVjdCcpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5taW5Qcm9wZXJ0aWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eXBlICE9PSAnb2JqZWN0JykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLm9iamVjdChuYW1lKSlcblxuICAgICAgdmFsaWRhdGUoJ2lmIChPYmplY3Qua2V5cyglcykubGVuZ3RoIDwgJWQpIHsnLCBuYW1lLCBub2RlLm1pblByb3BlcnRpZXMpXG4gICAgICBlcnJvcignaGFzIGxlc3MgcHJvcGVydGllcyB0aGFuIGFsbG93ZWQnKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuXG4gICAgICBpZiAodHlwZSAhPT0gJ29iamVjdCcpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5tYXhJdGVtcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ2FycmF5JykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLmFycmF5KG5hbWUpKVxuXG4gICAgICB2YWxpZGF0ZSgnaWYgKCVzLmxlbmd0aCA+ICVkKSB7JywgbmFtZSwgbm9kZS5tYXhJdGVtcylcbiAgICAgIGVycm9yKCdoYXMgbW9yZSBpdGVtcyB0aGFuIGFsbG93ZWQnKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuXG4gICAgICBpZiAodHlwZSAhPT0gJ2FycmF5JykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLm1pbkl0ZW1zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eXBlICE9PSAnYXJyYXknKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMuYXJyYXkobmFtZSkpXG5cbiAgICAgIHZhbGlkYXRlKCdpZiAoJXMubGVuZ3RoIDwgJWQpIHsnLCBuYW1lLCBub2RlLm1pbkl0ZW1zKVxuICAgICAgZXJyb3IoJ2hhcyBsZXNzIGl0ZW1zIHRoYW4gYWxsb3dlZCcpXG4gICAgICB2YWxpZGF0ZSgnfScpXG5cbiAgICAgIGlmICh0eXBlICE9PSAnYXJyYXknKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUubWF4TGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eXBlICE9PSAnc3RyaW5nJykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLnN0cmluZyhuYW1lKSlcblxuICAgICAgdmFsaWRhdGUoJ2lmICglcy5sZW5ndGggPiAlZCkgeycsIG5hbWUsIG5vZGUubWF4TGVuZ3RoKVxuICAgICAgZXJyb3IoJ2hhcyBsb25nZXIgbGVuZ3RoIHRoYW4gYWxsb3dlZCcpXG4gICAgICB2YWxpZGF0ZSgnfScpXG5cbiAgICAgIGlmICh0eXBlICE9PSAnc3RyaW5nJykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLm1pbkxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ3N0cmluZycpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5zdHJpbmcobmFtZSkpXG5cbiAgICAgIHZhbGlkYXRlKCdpZiAoJXMubGVuZ3RoIDwgJWQpIHsnLCBuYW1lLCBub2RlLm1pbkxlbmd0aClcbiAgICAgIGVycm9yKCdoYXMgbGVzcyBsZW5ndGggdGhhbiBhbGxvd2VkJylcbiAgICAgIHZhbGlkYXRlKCd9JylcblxuICAgICAgaWYgKHR5cGUgIT09ICdzdHJpbmcnKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUubWluaW11bSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ251bWJlcicgJiYgdHlwZSAhPT0gJ2ludGVnZXInKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMubnVtYmVyKG5hbWUpKVxuXG4gICAgICB2YWxpZGF0ZSgnaWYgKCVzICVzICVkKSB7JywgbmFtZSwgbm9kZS5leGNsdXNpdmVNaW5pbXVtID8gJzw9JyA6ICc8Jywgbm9kZS5taW5pbXVtKVxuICAgICAgZXJyb3IoJ2lzIGxlc3MgdGhhbiBtaW5pbXVtJylcbiAgICAgIHZhbGlkYXRlKCd9JylcblxuICAgICAgaWYgKHR5cGUgIT09ICdudW1iZXInICYmIHR5cGUgIT09ICdpbnRlZ2VyJykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLm1heGltdW0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGUgIT09ICdudW1iZXInICYmIHR5cGUgIT09ICdpbnRlZ2VyJykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLm51bWJlcihuYW1lKSlcblxuICAgICAgdmFsaWRhdGUoJ2lmICglcyAlcyAlZCkgeycsIG5hbWUsIG5vZGUuZXhjbHVzaXZlTWF4aW11bSA/ICc+PScgOiAnPicsIG5vZGUubWF4aW11bSlcbiAgICAgIGVycm9yKCdpcyBtb3JlIHRoYW4gbWF4aW11bScpXG4gICAgICB2YWxpZGF0ZSgnfScpXG5cbiAgICAgIGlmICh0eXBlICE9PSAnbnVtYmVyJyAmJiB0eXBlICE9PSAnaW50ZWdlcicpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgT2JqZWN0LmtleXMocHJvcGVydGllcykuZm9yRWFjaChmdW5jdGlvbihwKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHR5cGUpICYmIHR5cGUuaW5kZXhPZignbnVsbCcpICE9PSAtMSkgdmFsaWRhdGUoJ2lmICglcyAhPT0gbnVsbCkgeycsIG5hbWUpXG5cbiAgICAgICAgdmlzaXQoZ2Vub2JqKG5hbWUsIHApLCBwcm9wZXJ0aWVzW3BdLCByZXBvcnRlciwgZmlsdGVyKVxuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHR5cGUpICYmIHR5cGUuaW5kZXhPZignbnVsbCcpICE9PSAtMSkgdmFsaWRhdGUoJ30nKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICB3aGlsZSAoaW5kZW50LS0pIHZhbGlkYXRlKCd9JylcbiAgfVxuXG4gIHZhciB2YWxpZGF0ZSA9IGdlbmZ1blxuICAgICgnZnVuY3Rpb24gdmFsaWRhdGUoZGF0YSkgeycpXG4gICAgICAvLyBTaW5jZSB1bmRlZmluZWQgaXMgbm90IGEgdmFsaWQgSlNPTiB2YWx1ZSwgd2UgY29lcmNlIHRvIG51bGwgYW5kIG90aGVyIGNoZWNrcyB3aWxsIGNhdGNoIHRoaXNcbiAgICAgICgnaWYgKGRhdGEgPT09IHVuZGVmaW5lZCkgZGF0YSA9IG51bGwnKVxuICAgICAgKCd2YWxpZGF0ZS5lcnJvcnMgPSBudWxsJylcbiAgICAgICgndmFyIGVycm9ycyA9IDAnKVxuXG4gIHZpc2l0KCdkYXRhJywgc2NoZW1hLCByZXBvcnRlciwgb3B0cyAmJiBvcHRzLmZpbHRlcilcblxuICB2YWxpZGF0ZVxuICAgICAgKCdyZXR1cm4gZXJyb3JzID09PSAwJylcbiAgICAoJ30nKVxuXG4gIHZhbGlkYXRlID0gdmFsaWRhdGUudG9GdW5jdGlvbihzY29wZSlcbiAgdmFsaWRhdGUuZXJyb3JzID0gbnVsbFxuXG4gIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmFsaWRhdGUsICdlcnJvcicsIHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdmFsaWRhdGUuZXJyb3JzKSByZXR1cm4gJydcbiAgICAgICAgcmV0dXJuIHZhbGlkYXRlLmVycm9ycy5tYXAoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIGVyci5maWVsZCArICcgJyArIGVyci5tZXNzYWdlO1xuICAgICAgICB9KS5qb2luKCdcXG4nKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICB2YWxpZGF0ZS50b0pTT04gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2NoZW1hXG4gIH1cblxuICByZXR1cm4gdmFsaWRhdGVcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzY2hlbWEsIG9wdHMpIHtcbiAgaWYgKHR5cGVvZiBzY2hlbWEgPT09ICdzdHJpbmcnKSBzY2hlbWEgPSBKU09OLnBhcnNlKHNjaGVtYSlcbiAgcmV0dXJuIGNvbXBpbGUoc2NoZW1hLCB7fSwgc2NoZW1hLCB0cnVlLCBvcHRzKVxufVxuXG5tb2R1bGUuZXhwb3J0cy5maWx0ZXIgPSBmdW5jdGlvbihzY2hlbWEsIG9wdHMpIHtcbiAgdmFyIHZhbGlkYXRlID0gbW9kdWxlLmV4cG9ydHMoc2NoZW1hLCB4dGVuZChvcHRzLCB7ZmlsdGVyOiB0cnVlfSkpXG4gIHJldHVybiBmdW5jdGlvbihzY2gpIHtcbiAgICB2YWxpZGF0ZShzY2gpXG4gICAgcmV0dXJuIHNjaFxuICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuZnVuY3Rpb24gaXNQcm9wZXJ0eShzdHIpIHtcbiAgcmV0dXJuIC9eWyRBLVpcXF9hLXpcXHhhYVxceGI1XFx4YmFcXHhjMC1cXHhkNlxceGQ4LVxceGY2XFx4ZjgtXFx1MDJjMVxcdTAyYzYtXFx1MDJkMVxcdTAyZTAtXFx1MDJlNFxcdTAyZWNcXHUwMmVlXFx1MDM3MC1cXHUwMzc0XFx1MDM3NlxcdTAzNzdcXHUwMzdhLVxcdTAzN2RcXHUwMzg2XFx1MDM4OC1cXHUwMzhhXFx1MDM4Y1xcdTAzOGUtXFx1MDNhMVxcdTAzYTMtXFx1MDNmNVxcdTAzZjctXFx1MDQ4MVxcdTA0OGEtXFx1MDUyN1xcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYxLVxcdTA1ODdcXHUwNWQwLVxcdTA1ZWFcXHUwNWYwLVxcdTA1ZjJcXHUwNjIwLVxcdTA2NGFcXHUwNjZlXFx1MDY2ZlxcdTA2NzEtXFx1MDZkM1xcdTA2ZDVcXHUwNmU1XFx1MDZlNlxcdTA2ZWVcXHUwNmVmXFx1MDZmYS1cXHUwNmZjXFx1MDZmZlxcdTA3MTBcXHUwNzEyLVxcdTA3MmZcXHUwNzRkLVxcdTA3YTVcXHUwN2IxXFx1MDdjYS1cXHUwN2VhXFx1MDdmNFxcdTA3ZjVcXHUwN2ZhXFx1MDgwMC1cXHUwODE1XFx1MDgxYVxcdTA4MjRcXHUwODI4XFx1MDg0MC1cXHUwODU4XFx1MDhhMFxcdTA4YTItXFx1MDhhY1xcdTA5MDQtXFx1MDkzOVxcdTA5M2RcXHUwOTUwXFx1MDk1OC1cXHUwOTYxXFx1MDk3MS1cXHUwOTc3XFx1MDk3OS1cXHUwOTdmXFx1MDk4NS1cXHUwOThjXFx1MDk4ZlxcdTA5OTBcXHUwOTkzLVxcdTA5YThcXHUwOWFhLVxcdTA5YjBcXHUwOWIyXFx1MDliNi1cXHUwOWI5XFx1MDliZFxcdTA5Y2VcXHUwOWRjXFx1MDlkZFxcdTA5ZGYtXFx1MDllMVxcdTA5ZjBcXHUwOWYxXFx1MGEwNS1cXHUwYTBhXFx1MGEwZlxcdTBhMTBcXHUwYTEzLVxcdTBhMjhcXHUwYTJhLVxcdTBhMzBcXHUwYTMyXFx1MGEzM1xcdTBhMzVcXHUwYTM2XFx1MGEzOFxcdTBhMzlcXHUwYTU5LVxcdTBhNWNcXHUwYTVlXFx1MGE3Mi1cXHUwYTc0XFx1MGE4NS1cXHUwYThkXFx1MGE4Zi1cXHUwYTkxXFx1MGE5My1cXHUwYWE4XFx1MGFhYS1cXHUwYWIwXFx1MGFiMlxcdTBhYjNcXHUwYWI1LVxcdTBhYjlcXHUwYWJkXFx1MGFkMFxcdTBhZTBcXHUwYWUxXFx1MGIwNS1cXHUwYjBjXFx1MGIwZlxcdTBiMTBcXHUwYjEzLVxcdTBiMjhcXHUwYjJhLVxcdTBiMzBcXHUwYjMyXFx1MGIzM1xcdTBiMzUtXFx1MGIzOVxcdTBiM2RcXHUwYjVjXFx1MGI1ZFxcdTBiNWYtXFx1MGI2MVxcdTBiNzFcXHUwYjgzXFx1MGI4NS1cXHUwYjhhXFx1MGI4ZS1cXHUwYjkwXFx1MGI5Mi1cXHUwYjk1XFx1MGI5OVxcdTBiOWFcXHUwYjljXFx1MGI5ZVxcdTBiOWZcXHUwYmEzXFx1MGJhNFxcdTBiYTgtXFx1MGJhYVxcdTBiYWUtXFx1MGJiOVxcdTBiZDBcXHUwYzA1LVxcdTBjMGNcXHUwYzBlLVxcdTBjMTBcXHUwYzEyLVxcdTBjMjhcXHUwYzJhLVxcdTBjMzNcXHUwYzM1LVxcdTBjMzlcXHUwYzNkXFx1MGM1OFxcdTBjNTlcXHUwYzYwXFx1MGM2MVxcdTBjODUtXFx1MGM4Y1xcdTBjOGUtXFx1MGM5MFxcdTBjOTItXFx1MGNhOFxcdTBjYWEtXFx1MGNiM1xcdTBjYjUtXFx1MGNiOVxcdTBjYmRcXHUwY2RlXFx1MGNlMFxcdTBjZTFcXHUwY2YxXFx1MGNmMlxcdTBkMDUtXFx1MGQwY1xcdTBkMGUtXFx1MGQxMFxcdTBkMTItXFx1MGQzYVxcdTBkM2RcXHUwZDRlXFx1MGQ2MFxcdTBkNjFcXHUwZDdhLVxcdTBkN2ZcXHUwZDg1LVxcdTBkOTZcXHUwZDlhLVxcdTBkYjFcXHUwZGIzLVxcdTBkYmJcXHUwZGJkXFx1MGRjMC1cXHUwZGM2XFx1MGUwMS1cXHUwZTMwXFx1MGUzMlxcdTBlMzNcXHUwZTQwLVxcdTBlNDZcXHUwZTgxXFx1MGU4MlxcdTBlODRcXHUwZTg3XFx1MGU4OFxcdTBlOGFcXHUwZThkXFx1MGU5NC1cXHUwZTk3XFx1MGU5OS1cXHUwZTlmXFx1MGVhMS1cXHUwZWEzXFx1MGVhNVxcdTBlYTdcXHUwZWFhXFx1MGVhYlxcdTBlYWQtXFx1MGViMFxcdTBlYjJcXHUwZWIzXFx1MGViZFxcdTBlYzAtXFx1MGVjNFxcdTBlYzZcXHUwZWRjLVxcdTBlZGZcXHUwZjAwXFx1MGY0MC1cXHUwZjQ3XFx1MGY0OS1cXHUwZjZjXFx1MGY4OC1cXHUwZjhjXFx1MTAwMC1cXHUxMDJhXFx1MTAzZlxcdTEwNTAtXFx1MTA1NVxcdTEwNWEtXFx1MTA1ZFxcdTEwNjFcXHUxMDY1XFx1MTA2NlxcdTEwNmUtXFx1MTA3MFxcdTEwNzUtXFx1MTA4MVxcdTEwOGVcXHUxMGEwLVxcdTEwYzVcXHUxMGM3XFx1MTBjZFxcdTEwZDAtXFx1MTBmYVxcdTEwZmMtXFx1MTI0OFxcdTEyNGEtXFx1MTI0ZFxcdTEyNTAtXFx1MTI1NlxcdTEyNThcXHUxMjVhLVxcdTEyNWRcXHUxMjYwLVxcdTEyODhcXHUxMjhhLVxcdTEyOGRcXHUxMjkwLVxcdTEyYjBcXHUxMmIyLVxcdTEyYjVcXHUxMmI4LVxcdTEyYmVcXHUxMmMwXFx1MTJjMi1cXHUxMmM1XFx1MTJjOC1cXHUxMmQ2XFx1MTJkOC1cXHUxMzEwXFx1MTMxMi1cXHUxMzE1XFx1MTMxOC1cXHUxMzVhXFx1MTM4MC1cXHUxMzhmXFx1MTNhMC1cXHUxM2Y0XFx1MTQwMS1cXHUxNjZjXFx1MTY2Zi1cXHUxNjdmXFx1MTY4MS1cXHUxNjlhXFx1MTZhMC1cXHUxNmVhXFx1MTZlZS1cXHUxNmYwXFx1MTcwMC1cXHUxNzBjXFx1MTcwZS1cXHUxNzExXFx1MTcyMC1cXHUxNzMxXFx1MTc0MC1cXHUxNzUxXFx1MTc2MC1cXHUxNzZjXFx1MTc2ZS1cXHUxNzcwXFx1MTc4MC1cXHUxN2IzXFx1MTdkN1xcdTE3ZGNcXHUxODIwLVxcdTE4NzdcXHUxODgwLVxcdTE4YThcXHUxOGFhXFx1MThiMC1cXHUxOGY1XFx1MTkwMC1cXHUxOTFjXFx1MTk1MC1cXHUxOTZkXFx1MTk3MC1cXHUxOTc0XFx1MTk4MC1cXHUxOWFiXFx1MTljMS1cXHUxOWM3XFx1MWEwMC1cXHUxYTE2XFx1MWEyMC1cXHUxYTU0XFx1MWFhN1xcdTFiMDUtXFx1MWIzM1xcdTFiNDUtXFx1MWI0YlxcdTFiODMtXFx1MWJhMFxcdTFiYWVcXHUxYmFmXFx1MWJiYS1cXHUxYmU1XFx1MWMwMC1cXHUxYzIzXFx1MWM0ZC1cXHUxYzRmXFx1MWM1YS1cXHUxYzdkXFx1MWNlOS1cXHUxY2VjXFx1MWNlZS1cXHUxY2YxXFx1MWNmNVxcdTFjZjZcXHUxZDAwLVxcdTFkYmZcXHUxZTAwLVxcdTFmMTVcXHUxZjE4LVxcdTFmMWRcXHUxZjIwLVxcdTFmNDVcXHUxZjQ4LVxcdTFmNGRcXHUxZjUwLVxcdTFmNTdcXHUxZjU5XFx1MWY1YlxcdTFmNWRcXHUxZjVmLVxcdTFmN2RcXHUxZjgwLVxcdTFmYjRcXHUxZmI2LVxcdTFmYmNcXHUxZmJlXFx1MWZjMi1cXHUxZmM0XFx1MWZjNi1cXHUxZmNjXFx1MWZkMC1cXHUxZmQzXFx1MWZkNi1cXHUxZmRiXFx1MWZlMC1cXHUxZmVjXFx1MWZmMi1cXHUxZmY0XFx1MWZmNi1cXHUxZmZjXFx1MjA3MVxcdTIwN2ZcXHUyMDkwLVxcdTIwOWNcXHUyMTAyXFx1MjEwN1xcdTIxMGEtXFx1MjExM1xcdTIxMTVcXHUyMTE5LVxcdTIxMWRcXHUyMTI0XFx1MjEyNlxcdTIxMjhcXHUyMTJhLVxcdTIxMmRcXHUyMTJmLVxcdTIxMzlcXHUyMTNjLVxcdTIxM2ZcXHUyMTQ1LVxcdTIxNDlcXHUyMTRlXFx1MjE2MC1cXHUyMTg4XFx1MmMwMC1cXHUyYzJlXFx1MmMzMC1cXHUyYzVlXFx1MmM2MC1cXHUyY2U0XFx1MmNlYi1cXHUyY2VlXFx1MmNmMlxcdTJjZjNcXHUyZDAwLVxcdTJkMjVcXHUyZDI3XFx1MmQyZFxcdTJkMzAtXFx1MmQ2N1xcdTJkNmZcXHUyZDgwLVxcdTJkOTZcXHUyZGEwLVxcdTJkYTZcXHUyZGE4LVxcdTJkYWVcXHUyZGIwLVxcdTJkYjZcXHUyZGI4LVxcdTJkYmVcXHUyZGMwLVxcdTJkYzZcXHUyZGM4LVxcdTJkY2VcXHUyZGQwLVxcdTJkZDZcXHUyZGQ4LVxcdTJkZGVcXHUyZTJmXFx1MzAwNS1cXHUzMDA3XFx1MzAyMS1cXHUzMDI5XFx1MzAzMS1cXHUzMDM1XFx1MzAzOC1cXHUzMDNjXFx1MzA0MS1cXHUzMDk2XFx1MzA5ZC1cXHUzMDlmXFx1MzBhMS1cXHUzMGZhXFx1MzBmYy1cXHUzMGZmXFx1MzEwNS1cXHUzMTJkXFx1MzEzMS1cXHUzMThlXFx1MzFhMC1cXHUzMWJhXFx1MzFmMC1cXHUzMWZmXFx1MzQwMC1cXHU0ZGI1XFx1NGUwMC1cXHU5ZmNjXFx1YTAwMC1cXHVhNDhjXFx1YTRkMC1cXHVhNGZkXFx1YTUwMC1cXHVhNjBjXFx1YTYxMC1cXHVhNjFmXFx1YTYyYVxcdWE2MmJcXHVhNjQwLVxcdWE2NmVcXHVhNjdmLVxcdWE2OTdcXHVhNmEwLVxcdWE2ZWZcXHVhNzE3LVxcdWE3MWZcXHVhNzIyLVxcdWE3ODhcXHVhNzhiLVxcdWE3OGVcXHVhNzkwLVxcdWE3OTNcXHVhN2EwLVxcdWE3YWFcXHVhN2Y4LVxcdWE4MDFcXHVhODAzLVxcdWE4MDVcXHVhODA3LVxcdWE4MGFcXHVhODBjLVxcdWE4MjJcXHVhODQwLVxcdWE4NzNcXHVhODgyLVxcdWE4YjNcXHVhOGYyLVxcdWE4ZjdcXHVhOGZiXFx1YTkwYS1cXHVhOTI1XFx1YTkzMC1cXHVhOTQ2XFx1YTk2MC1cXHVhOTdjXFx1YTk4NC1cXHVhOWIyXFx1YTljZlxcdWFhMDAtXFx1YWEyOFxcdWFhNDAtXFx1YWE0MlxcdWFhNDQtXFx1YWE0YlxcdWFhNjAtXFx1YWE3NlxcdWFhN2FcXHVhYTgwLVxcdWFhYWZcXHVhYWIxXFx1YWFiNVxcdWFhYjZcXHVhYWI5LVxcdWFhYmRcXHVhYWMwXFx1YWFjMlxcdWFhZGItXFx1YWFkZFxcdWFhZTAtXFx1YWFlYVxcdWFhZjItXFx1YWFmNFxcdWFiMDEtXFx1YWIwNlxcdWFiMDktXFx1YWIwZVxcdWFiMTEtXFx1YWIxNlxcdWFiMjAtXFx1YWIyNlxcdWFiMjgtXFx1YWIyZVxcdWFiYzAtXFx1YWJlMlxcdWFjMDAtXFx1ZDdhM1xcdWQ3YjAtXFx1ZDdjNlxcdWQ3Y2ItXFx1ZDdmYlxcdWY5MDAtXFx1ZmE2ZFxcdWZhNzAtXFx1ZmFkOVxcdWZiMDAtXFx1ZmIwNlxcdWZiMTMtXFx1ZmIxN1xcdWZiMWRcXHVmYjFmLVxcdWZiMjhcXHVmYjJhLVxcdWZiMzZcXHVmYjM4LVxcdWZiM2NcXHVmYjNlXFx1ZmI0MFxcdWZiNDFcXHVmYjQzXFx1ZmI0NFxcdWZiNDYtXFx1ZmJiMVxcdWZiZDMtXFx1ZmQzZFxcdWZkNTAtXFx1ZmQ4ZlxcdWZkOTItXFx1ZmRjN1xcdWZkZjAtXFx1ZmRmYlxcdWZlNzAtXFx1ZmU3NFxcdWZlNzYtXFx1ZmVmY1xcdWZmMjEtXFx1ZmYzYVxcdWZmNDEtXFx1ZmY1YVxcdWZmNjYtXFx1ZmZiZVxcdWZmYzItXFx1ZmZjN1xcdWZmY2EtXFx1ZmZjZlxcdWZmZDItXFx1ZmZkN1xcdWZmZGEtXFx1ZmZkY11bJEEtWlxcX2EtelxceGFhXFx4YjVcXHhiYVxceGMwLVxceGQ2XFx4ZDgtXFx4ZjZcXHhmOC1cXHUwMmMxXFx1MDJjNi1cXHUwMmQxXFx1MDJlMC1cXHUwMmU0XFx1MDJlY1xcdTAyZWVcXHUwMzcwLVxcdTAzNzRcXHUwMzc2XFx1MDM3N1xcdTAzN2EtXFx1MDM3ZFxcdTAzODZcXHUwMzg4LVxcdTAzOGFcXHUwMzhjXFx1MDM4ZS1cXHUwM2ExXFx1MDNhMy1cXHUwM2Y1XFx1MDNmNy1cXHUwNDgxXFx1MDQ4YS1cXHUwNTI3XFx1MDUzMS1cXHUwNTU2XFx1MDU1OVxcdTA1NjEtXFx1MDU4N1xcdTA1ZDAtXFx1MDVlYVxcdTA1ZjAtXFx1MDVmMlxcdTA2MjAtXFx1MDY0YVxcdTA2NmVcXHUwNjZmXFx1MDY3MS1cXHUwNmQzXFx1MDZkNVxcdTA2ZTVcXHUwNmU2XFx1MDZlZVxcdTA2ZWZcXHUwNmZhLVxcdTA2ZmNcXHUwNmZmXFx1MDcxMFxcdTA3MTItXFx1MDcyZlxcdTA3NGQtXFx1MDdhNVxcdTA3YjFcXHUwN2NhLVxcdTA3ZWFcXHUwN2Y0XFx1MDdmNVxcdTA3ZmFcXHUwODAwLVxcdTA4MTVcXHUwODFhXFx1MDgyNFxcdTA4MjhcXHUwODQwLVxcdTA4NThcXHUwOGEwXFx1MDhhMi1cXHUwOGFjXFx1MDkwNC1cXHUwOTM5XFx1MDkzZFxcdTA5NTBcXHUwOTU4LVxcdTA5NjFcXHUwOTcxLVxcdTA5NzdcXHUwOTc5LVxcdTA5N2ZcXHUwOTg1LVxcdTA5OGNcXHUwOThmXFx1MDk5MFxcdTA5OTMtXFx1MDlhOFxcdTA5YWEtXFx1MDliMFxcdTA5YjJcXHUwOWI2LVxcdTA5YjlcXHUwOWJkXFx1MDljZVxcdTA5ZGNcXHUwOWRkXFx1MDlkZi1cXHUwOWUxXFx1MDlmMFxcdTA5ZjFcXHUwYTA1LVxcdTBhMGFcXHUwYTBmXFx1MGExMFxcdTBhMTMtXFx1MGEyOFxcdTBhMmEtXFx1MGEzMFxcdTBhMzJcXHUwYTMzXFx1MGEzNVxcdTBhMzZcXHUwYTM4XFx1MGEzOVxcdTBhNTktXFx1MGE1Y1xcdTBhNWVcXHUwYTcyLVxcdTBhNzRcXHUwYTg1LVxcdTBhOGRcXHUwYThmLVxcdTBhOTFcXHUwYTkzLVxcdTBhYThcXHUwYWFhLVxcdTBhYjBcXHUwYWIyXFx1MGFiM1xcdTBhYjUtXFx1MGFiOVxcdTBhYmRcXHUwYWQwXFx1MGFlMFxcdTBhZTFcXHUwYjA1LVxcdTBiMGNcXHUwYjBmXFx1MGIxMFxcdTBiMTMtXFx1MGIyOFxcdTBiMmEtXFx1MGIzMFxcdTBiMzJcXHUwYjMzXFx1MGIzNS1cXHUwYjM5XFx1MGIzZFxcdTBiNWNcXHUwYjVkXFx1MGI1Zi1cXHUwYjYxXFx1MGI3MVxcdTBiODNcXHUwYjg1LVxcdTBiOGFcXHUwYjhlLVxcdTBiOTBcXHUwYjkyLVxcdTBiOTVcXHUwYjk5XFx1MGI5YVxcdTBiOWNcXHUwYjllXFx1MGI5ZlxcdTBiYTNcXHUwYmE0XFx1MGJhOC1cXHUwYmFhXFx1MGJhZS1cXHUwYmI5XFx1MGJkMFxcdTBjMDUtXFx1MGMwY1xcdTBjMGUtXFx1MGMxMFxcdTBjMTItXFx1MGMyOFxcdTBjMmEtXFx1MGMzM1xcdTBjMzUtXFx1MGMzOVxcdTBjM2RcXHUwYzU4XFx1MGM1OVxcdTBjNjBcXHUwYzYxXFx1MGM4NS1cXHUwYzhjXFx1MGM4ZS1cXHUwYzkwXFx1MGM5Mi1cXHUwY2E4XFx1MGNhYS1cXHUwY2IzXFx1MGNiNS1cXHUwY2I5XFx1MGNiZFxcdTBjZGVcXHUwY2UwXFx1MGNlMVxcdTBjZjFcXHUwY2YyXFx1MGQwNS1cXHUwZDBjXFx1MGQwZS1cXHUwZDEwXFx1MGQxMi1cXHUwZDNhXFx1MGQzZFxcdTBkNGVcXHUwZDYwXFx1MGQ2MVxcdTBkN2EtXFx1MGQ3ZlxcdTBkODUtXFx1MGQ5NlxcdTBkOWEtXFx1MGRiMVxcdTBkYjMtXFx1MGRiYlxcdTBkYmRcXHUwZGMwLVxcdTBkYzZcXHUwZTAxLVxcdTBlMzBcXHUwZTMyXFx1MGUzM1xcdTBlNDAtXFx1MGU0NlxcdTBlODFcXHUwZTgyXFx1MGU4NFxcdTBlODdcXHUwZTg4XFx1MGU4YVxcdTBlOGRcXHUwZTk0LVxcdTBlOTdcXHUwZTk5LVxcdTBlOWZcXHUwZWExLVxcdTBlYTNcXHUwZWE1XFx1MGVhN1xcdTBlYWFcXHUwZWFiXFx1MGVhZC1cXHUwZWIwXFx1MGViMlxcdTBlYjNcXHUwZWJkXFx1MGVjMC1cXHUwZWM0XFx1MGVjNlxcdTBlZGMtXFx1MGVkZlxcdTBmMDBcXHUwZjQwLVxcdTBmNDdcXHUwZjQ5LVxcdTBmNmNcXHUwZjg4LVxcdTBmOGNcXHUxMDAwLVxcdTEwMmFcXHUxMDNmXFx1MTA1MC1cXHUxMDU1XFx1MTA1YS1cXHUxMDVkXFx1MTA2MVxcdTEwNjVcXHUxMDY2XFx1MTA2ZS1cXHUxMDcwXFx1MTA3NS1cXHUxMDgxXFx1MTA4ZVxcdTEwYTAtXFx1MTBjNVxcdTEwYzdcXHUxMGNkXFx1MTBkMC1cXHUxMGZhXFx1MTBmYy1cXHUxMjQ4XFx1MTI0YS1cXHUxMjRkXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNWEtXFx1MTI1ZFxcdTEyNjAtXFx1MTI4OFxcdTEyOGEtXFx1MTI4ZFxcdTEyOTAtXFx1MTJiMFxcdTEyYjItXFx1MTJiNVxcdTEyYjgtXFx1MTJiZVxcdTEyYzBcXHUxMmMyLVxcdTEyYzVcXHUxMmM4LVxcdTEyZDZcXHUxMmQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNWFcXHUxMzgwLVxcdTEzOGZcXHUxM2EwLVxcdTEzZjRcXHUxNDAxLVxcdTE2NmNcXHUxNjZmLVxcdTE2N2ZcXHUxNjgxLVxcdTE2OWFcXHUxNmEwLVxcdTE2ZWFcXHUxNmVlLVxcdTE2ZjBcXHUxNzAwLVxcdTE3MGNcXHUxNzBlLVxcdTE3MTFcXHUxNzIwLVxcdTE3MzFcXHUxNzQwLVxcdTE3NTFcXHUxNzYwLVxcdTE3NmNcXHUxNzZlLVxcdTE3NzBcXHUxNzgwLVxcdTE3YjNcXHUxN2Q3XFx1MTdkY1xcdTE4MjAtXFx1MTg3N1xcdTE4ODAtXFx1MThhOFxcdTE4YWFcXHUxOGIwLVxcdTE4ZjVcXHUxOTAwLVxcdTE5MWNcXHUxOTUwLVxcdTE5NmRcXHUxOTcwLVxcdTE5NzRcXHUxOTgwLVxcdTE5YWJcXHUxOWMxLVxcdTE5YzdcXHUxYTAwLVxcdTFhMTZcXHUxYTIwLVxcdTFhNTRcXHUxYWE3XFx1MWIwNS1cXHUxYjMzXFx1MWI0NS1cXHUxYjRiXFx1MWI4My1cXHUxYmEwXFx1MWJhZVxcdTFiYWZcXHUxYmJhLVxcdTFiZTVcXHUxYzAwLVxcdTFjMjNcXHUxYzRkLVxcdTFjNGZcXHUxYzVhLVxcdTFjN2RcXHUxY2U5LVxcdTFjZWNcXHUxY2VlLVxcdTFjZjFcXHUxY2Y1XFx1MWNmNlxcdTFkMDAtXFx1MWRiZlxcdTFlMDAtXFx1MWYxNVxcdTFmMTgtXFx1MWYxZFxcdTFmMjAtXFx1MWY0NVxcdTFmNDgtXFx1MWY0ZFxcdTFmNTAtXFx1MWY1N1xcdTFmNTlcXHUxZjViXFx1MWY1ZFxcdTFmNWYtXFx1MWY3ZFxcdTFmODAtXFx1MWZiNFxcdTFmYjYtXFx1MWZiY1xcdTFmYmVcXHUxZmMyLVxcdTFmYzRcXHUxZmM2LVxcdTFmY2NcXHUxZmQwLVxcdTFmZDNcXHUxZmQ2LVxcdTFmZGJcXHUxZmUwLVxcdTFmZWNcXHUxZmYyLVxcdTFmZjRcXHUxZmY2LVxcdTFmZmNcXHUyMDcxXFx1MjA3ZlxcdTIwOTAtXFx1MjA5Y1xcdTIxMDJcXHUyMTA3XFx1MjEwYS1cXHUyMTEzXFx1MjExNVxcdTIxMTktXFx1MjExZFxcdTIxMjRcXHUyMTI2XFx1MjEyOFxcdTIxMmEtXFx1MjEyZFxcdTIxMmYtXFx1MjEzOVxcdTIxM2MtXFx1MjEzZlxcdTIxNDUtXFx1MjE0OVxcdTIxNGVcXHUyMTYwLVxcdTIxODhcXHUyYzAwLVxcdTJjMmVcXHUyYzMwLVxcdTJjNWVcXHUyYzYwLVxcdTJjZTRcXHUyY2ViLVxcdTJjZWVcXHUyY2YyXFx1MmNmM1xcdTJkMDAtXFx1MmQyNVxcdTJkMjdcXHUyZDJkXFx1MmQzMC1cXHUyZDY3XFx1MmQ2ZlxcdTJkODAtXFx1MmQ5NlxcdTJkYTAtXFx1MmRhNlxcdTJkYTgtXFx1MmRhZVxcdTJkYjAtXFx1MmRiNlxcdTJkYjgtXFx1MmRiZVxcdTJkYzAtXFx1MmRjNlxcdTJkYzgtXFx1MmRjZVxcdTJkZDAtXFx1MmRkNlxcdTJkZDgtXFx1MmRkZVxcdTJlMmZcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMjlcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM2NcXHUzMDQxLVxcdTMwOTZcXHUzMDlkLVxcdTMwOWZcXHUzMGExLVxcdTMwZmFcXHUzMGZjLVxcdTMwZmZcXHUzMTA1LVxcdTMxMmRcXHUzMTMxLVxcdTMxOGVcXHUzMWEwLVxcdTMxYmFcXHUzMWYwLVxcdTMxZmZcXHUzNDAwLVxcdTRkYjVcXHU0ZTAwLVxcdTlmY2NcXHVhMDAwLVxcdWE0OGNcXHVhNGQwLVxcdWE0ZmRcXHVhNTAwLVxcdWE2MGNcXHVhNjEwLVxcdWE2MWZcXHVhNjJhXFx1YTYyYlxcdWE2NDAtXFx1YTY2ZVxcdWE2N2YtXFx1YTY5N1xcdWE2YTAtXFx1YTZlZlxcdWE3MTctXFx1YTcxZlxcdWE3MjItXFx1YTc4OFxcdWE3OGItXFx1YTc4ZVxcdWE3OTAtXFx1YTc5M1xcdWE3YTAtXFx1YTdhYVxcdWE3ZjgtXFx1YTgwMVxcdWE4MDMtXFx1YTgwNVxcdWE4MDctXFx1YTgwYVxcdWE4MGMtXFx1YTgyMlxcdWE4NDAtXFx1YTg3M1xcdWE4ODItXFx1YThiM1xcdWE4ZjItXFx1YThmN1xcdWE4ZmJcXHVhOTBhLVxcdWE5MjVcXHVhOTMwLVxcdWE5NDZcXHVhOTYwLVxcdWE5N2NcXHVhOTg0LVxcdWE5YjJcXHVhOWNmXFx1YWEwMC1cXHVhYTI4XFx1YWE0MC1cXHVhYTQyXFx1YWE0NC1cXHVhYTRiXFx1YWE2MC1cXHVhYTc2XFx1YWE3YVxcdWFhODAtXFx1YWFhZlxcdWFhYjFcXHVhYWI1XFx1YWFiNlxcdWFhYjktXFx1YWFiZFxcdWFhYzBcXHVhYWMyXFx1YWFkYi1cXHVhYWRkXFx1YWFlMC1cXHVhYWVhXFx1YWFmMi1cXHVhYWY0XFx1YWIwMS1cXHVhYjA2XFx1YWIwOS1cXHVhYjBlXFx1YWIxMS1cXHVhYjE2XFx1YWIyMC1cXHVhYjI2XFx1YWIyOC1cXHVhYjJlXFx1YWJjMC1cXHVhYmUyXFx1YWMwMC1cXHVkN2EzXFx1ZDdiMC1cXHVkN2M2XFx1ZDdjYi1cXHVkN2ZiXFx1ZjkwMC1cXHVmYTZkXFx1ZmE3MC1cXHVmYWQ5XFx1ZmIwMC1cXHVmYjA2XFx1ZmIxMy1cXHVmYjE3XFx1ZmIxZFxcdWZiMWYtXFx1ZmIyOFxcdWZiMmEtXFx1ZmIzNlxcdWZiMzgtXFx1ZmIzY1xcdWZiM2VcXHVmYjQwXFx1ZmI0MVxcdWZiNDNcXHVmYjQ0XFx1ZmI0Ni1cXHVmYmIxXFx1ZmJkMy1cXHVmZDNkXFx1ZmQ1MC1cXHVmZDhmXFx1ZmQ5Mi1cXHVmZGM3XFx1ZmRmMC1cXHVmZGZiXFx1ZmU3MC1cXHVmZTc0XFx1ZmU3Ni1cXHVmZWZjXFx1ZmYyMS1cXHVmZjNhXFx1ZmY0MS1cXHVmZjVhXFx1ZmY2Ni1cXHVmZmJlXFx1ZmZjMi1cXHVmZmM3XFx1ZmZjYS1cXHVmZmNmXFx1ZmZkMi1cXHVmZmQ3XFx1ZmZkYS1cXHVmZmRjMC05XFx1MDMwMC1cXHUwMzZmXFx1MDQ4My1cXHUwNDg3XFx1MDU5MS1cXHUwNWJkXFx1MDViZlxcdTA1YzFcXHUwNWMyXFx1MDVjNFxcdTA1YzVcXHUwNWM3XFx1MDYxMC1cXHUwNjFhXFx1MDY0Yi1cXHUwNjY5XFx1MDY3MFxcdTA2ZDYtXFx1MDZkY1xcdTA2ZGYtXFx1MDZlNFxcdTA2ZTdcXHUwNmU4XFx1MDZlYS1cXHUwNmVkXFx1MDZmMC1cXHUwNmY5XFx1MDcxMVxcdTA3MzAtXFx1MDc0YVxcdTA3YTYtXFx1MDdiMFxcdTA3YzAtXFx1MDdjOVxcdTA3ZWItXFx1MDdmM1xcdTA4MTYtXFx1MDgxOVxcdTA4MWItXFx1MDgyM1xcdTA4MjUtXFx1MDgyN1xcdTA4MjktXFx1MDgyZFxcdTA4NTktXFx1MDg1YlxcdTA4ZTQtXFx1MDhmZVxcdTA5MDAtXFx1MDkwM1xcdTA5M2EtXFx1MDkzY1xcdTA5M2UtXFx1MDk0ZlxcdTA5NTEtXFx1MDk1N1xcdTA5NjJcXHUwOTYzXFx1MDk2Ni1cXHUwOTZmXFx1MDk4MS1cXHUwOTgzXFx1MDliY1xcdTA5YmUtXFx1MDljNFxcdTA5YzdcXHUwOWM4XFx1MDljYi1cXHUwOWNkXFx1MDlkN1xcdTA5ZTJcXHUwOWUzXFx1MDllNi1cXHUwOWVmXFx1MGEwMS1cXHUwYTAzXFx1MGEzY1xcdTBhM2UtXFx1MGE0MlxcdTBhNDdcXHUwYTQ4XFx1MGE0Yi1cXHUwYTRkXFx1MGE1MVxcdTBhNjYtXFx1MGE3MVxcdTBhNzVcXHUwYTgxLVxcdTBhODNcXHUwYWJjXFx1MGFiZS1cXHUwYWM1XFx1MGFjNy1cXHUwYWM5XFx1MGFjYi1cXHUwYWNkXFx1MGFlMlxcdTBhZTNcXHUwYWU2LVxcdTBhZWZcXHUwYjAxLVxcdTBiMDNcXHUwYjNjXFx1MGIzZS1cXHUwYjQ0XFx1MGI0N1xcdTBiNDhcXHUwYjRiLVxcdTBiNGRcXHUwYjU2XFx1MGI1N1xcdTBiNjJcXHUwYjYzXFx1MGI2Ni1cXHUwYjZmXFx1MGI4MlxcdTBiYmUtXFx1MGJjMlxcdTBiYzYtXFx1MGJjOFxcdTBiY2EtXFx1MGJjZFxcdTBiZDdcXHUwYmU2LVxcdTBiZWZcXHUwYzAxLVxcdTBjMDNcXHUwYzNlLVxcdTBjNDRcXHUwYzQ2LVxcdTBjNDhcXHUwYzRhLVxcdTBjNGRcXHUwYzU1XFx1MGM1NlxcdTBjNjJcXHUwYzYzXFx1MGM2Ni1cXHUwYzZmXFx1MGM4MlxcdTBjODNcXHUwY2JjXFx1MGNiZS1cXHUwY2M0XFx1MGNjNi1cXHUwY2M4XFx1MGNjYS1cXHUwY2NkXFx1MGNkNVxcdTBjZDZcXHUwY2UyXFx1MGNlM1xcdTBjZTYtXFx1MGNlZlxcdTBkMDJcXHUwZDAzXFx1MGQzZS1cXHUwZDQ0XFx1MGQ0Ni1cXHUwZDQ4XFx1MGQ0YS1cXHUwZDRkXFx1MGQ1N1xcdTBkNjJcXHUwZDYzXFx1MGQ2Ni1cXHUwZDZmXFx1MGQ4MlxcdTBkODNcXHUwZGNhXFx1MGRjZi1cXHUwZGQ0XFx1MGRkNlxcdTBkZDgtXFx1MGRkZlxcdTBkZjJcXHUwZGYzXFx1MGUzMVxcdTBlMzQtXFx1MGUzYVxcdTBlNDctXFx1MGU0ZVxcdTBlNTAtXFx1MGU1OVxcdTBlYjFcXHUwZWI0LVxcdTBlYjlcXHUwZWJiXFx1MGViY1xcdTBlYzgtXFx1MGVjZFxcdTBlZDAtXFx1MGVkOVxcdTBmMThcXHUwZjE5XFx1MGYyMC1cXHUwZjI5XFx1MGYzNVxcdTBmMzdcXHUwZjM5XFx1MGYzZVxcdTBmM2ZcXHUwZjcxLVxcdTBmODRcXHUwZjg2XFx1MGY4N1xcdTBmOGQtXFx1MGY5N1xcdTBmOTktXFx1MGZiY1xcdTBmYzZcXHUxMDJiLVxcdTEwM2VcXHUxMDQwLVxcdTEwNDlcXHUxMDU2LVxcdTEwNTlcXHUxMDVlLVxcdTEwNjBcXHUxMDYyLVxcdTEwNjRcXHUxMDY3LVxcdTEwNmRcXHUxMDcxLVxcdTEwNzRcXHUxMDgyLVxcdTEwOGRcXHUxMDhmLVxcdTEwOWRcXHUxMzVkLVxcdTEzNWZcXHUxNzEyLVxcdTE3MTRcXHUxNzMyLVxcdTE3MzRcXHUxNzUyXFx1MTc1M1xcdTE3NzJcXHUxNzczXFx1MTdiNC1cXHUxN2QzXFx1MTdkZFxcdTE3ZTAtXFx1MTdlOVxcdTE4MGItXFx1MTgwZFxcdTE4MTAtXFx1MTgxOVxcdTE4YTlcXHUxOTIwLVxcdTE5MmJcXHUxOTMwLVxcdTE5M2JcXHUxOTQ2LVxcdTE5NGZcXHUxOWIwLVxcdTE5YzBcXHUxOWM4XFx1MTljOVxcdTE5ZDAtXFx1MTlkOVxcdTFhMTctXFx1MWExYlxcdTFhNTUtXFx1MWE1ZVxcdTFhNjAtXFx1MWE3Y1xcdTFhN2YtXFx1MWE4OVxcdTFhOTAtXFx1MWE5OVxcdTFiMDAtXFx1MWIwNFxcdTFiMzQtXFx1MWI0NFxcdTFiNTAtXFx1MWI1OVxcdTFiNmItXFx1MWI3M1xcdTFiODAtXFx1MWI4MlxcdTFiYTEtXFx1MWJhZFxcdTFiYjAtXFx1MWJiOVxcdTFiZTYtXFx1MWJmM1xcdTFjMjQtXFx1MWMzN1xcdTFjNDAtXFx1MWM0OVxcdTFjNTAtXFx1MWM1OVxcdTFjZDAtXFx1MWNkMlxcdTFjZDQtXFx1MWNlOFxcdTFjZWRcXHUxY2YyLVxcdTFjZjRcXHUxZGMwLVxcdTFkZTZcXHUxZGZjLVxcdTFkZmZcXHUyMDBjXFx1MjAwZFxcdTIwM2ZcXHUyMDQwXFx1MjA1NFxcdTIwZDAtXFx1MjBkY1xcdTIwZTFcXHUyMGU1LVxcdTIwZjBcXHUyY2VmLVxcdTJjZjFcXHUyZDdmXFx1MmRlMC1cXHUyZGZmXFx1MzAyYS1cXHUzMDJmXFx1MzA5OVxcdTMwOWFcXHVhNjIwLVxcdWE2MjlcXHVhNjZmXFx1YTY3NC1cXHVhNjdkXFx1YTY5ZlxcdWE2ZjBcXHVhNmYxXFx1YTgwMlxcdWE4MDZcXHVhODBiXFx1YTgyMy1cXHVhODI3XFx1YTg4MFxcdWE4ODFcXHVhOGI0LVxcdWE4YzRcXHVhOGQwLVxcdWE4ZDlcXHVhOGUwLVxcdWE4ZjFcXHVhOTAwLVxcdWE5MDlcXHVhOTI2LVxcdWE5MmRcXHVhOTQ3LVxcdWE5NTNcXHVhOTgwLVxcdWE5ODNcXHVhOWIzLVxcdWE5YzBcXHVhOWQwLVxcdWE5ZDlcXHVhYTI5LVxcdWFhMzZcXHVhYTQzXFx1YWE0Y1xcdWFhNGRcXHVhYTUwLVxcdWFhNTlcXHVhYTdiXFx1YWFiMFxcdWFhYjItXFx1YWFiNFxcdWFhYjdcXHVhYWI4XFx1YWFiZVxcdWFhYmZcXHVhYWMxXFx1YWFlYi1cXHVhYWVmXFx1YWFmNVxcdWFhZjZcXHVhYmUzLVxcdWFiZWFcXHVhYmVjXFx1YWJlZFxcdWFiZjAtXFx1YWJmOVxcdWZiMWVcXHVmZTAwLVxcdWZlMGZcXHVmZTIwLVxcdWZlMjZcXHVmZTMzXFx1ZmUzNFxcdWZlNGQtXFx1ZmU0ZlxcdWZmMTAtXFx1ZmYxOVxcdWZmM2ZdKiQvLnRlc3Qoc3RyKVxufVxubW9kdWxlLmV4cG9ydHMgPSBpc1Byb3BlcnR5IiwidmFyIGhhc0V4Y2FwZSA9IC9+L1xudmFyIGVzY2FwZU1hdGNoZXIgPSAvflswMV0vZ1xuZnVuY3Rpb24gZXNjYXBlUmVwbGFjZXIgKG0pIHtcbiAgc3dpdGNoIChtKSB7XG4gICAgY2FzZSAnfjEnOiByZXR1cm4gJy8nXG4gICAgY2FzZSAnfjAnOiByZXR1cm4gJ34nXG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHRpbGRlIGVzY2FwZTogJyArIG0pXG59XG5cbmZ1bmN0aW9uIHVudGlsZGUgKHN0cikge1xuICBpZiAoIWhhc0V4Y2FwZS50ZXN0KHN0cikpIHJldHVybiBzdHJcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKGVzY2FwZU1hdGNoZXIsIGVzY2FwZVJlcGxhY2VyKVxufVxuXG5mdW5jdGlvbiBzZXR0ZXIgKG9iaiwgcG9pbnRlciwgdmFsdWUpIHtcbiAgdmFyIHBhcnRcbiAgdmFyIGhhc05leHRQYXJ0XG5cbiAgZm9yICh2YXIgcCA9IDEsIGxlbiA9IHBvaW50ZXIubGVuZ3RoOyBwIDwgbGVuOykge1xuICAgIHBhcnQgPSB1bnRpbGRlKHBvaW50ZXJbcCsrXSlcbiAgICBoYXNOZXh0UGFydCA9IGxlbiA+IHBcblxuICAgIGlmICh0eXBlb2Ygb2JqW3BhcnRdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gc3VwcG9ydCBzZXR0aW5nIG9mIC8tXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopICYmIHBhcnQgPT09ICctJykge1xuICAgICAgICBwYXJ0ID0gb2JqLmxlbmd0aFxuICAgICAgfVxuXG4gICAgICAvLyBzdXBwb3J0IG5lc3RlZCBvYmplY3RzL2FycmF5IHdoZW4gc2V0dGluZyB2YWx1ZXNcbiAgICAgIGlmIChoYXNOZXh0UGFydCkge1xuICAgICAgICBpZiAoKHBvaW50ZXJbcF0gIT09ICcnICYmIHBvaW50ZXJbcF0gPCBJbmZpbml0eSkgfHwgcG9pbnRlcltwXSA9PT0gJy0nKSBvYmpbcGFydF0gPSBbXVxuICAgICAgICBlbHNlIG9ialtwYXJ0XSA9IHt9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFoYXNOZXh0UGFydCkgYnJlYWtcbiAgICBvYmogPSBvYmpbcGFydF1cbiAgfVxuXG4gIHZhciBvbGRWYWx1ZSA9IG9ialtwYXJ0XVxuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgZGVsZXRlIG9ialtwYXJ0XVxuICBlbHNlIG9ialtwYXJ0XSA9IHZhbHVlXG4gIHJldHVybiBvbGRWYWx1ZVxufVxuXG5mdW5jdGlvbiBjb21waWxlUG9pbnRlciAocG9pbnRlcikge1xuICBpZiAodHlwZW9mIHBvaW50ZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgcG9pbnRlciA9IHBvaW50ZXIuc3BsaXQoJy8nKVxuICAgIGlmIChwb2ludGVyWzBdID09PSAnJykgcmV0dXJuIHBvaW50ZXJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgSlNPTiBwb2ludGVyLicpXG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShwb2ludGVyKSkge1xuICAgIHJldHVybiBwb2ludGVyXG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgSlNPTiBwb2ludGVyLicpXG59XG5cbmZ1bmN0aW9uIGdldCAob2JqLCBwb2ludGVyKSB7XG4gIGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JykgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGlucHV0IG9iamVjdC4nKVxuICBwb2ludGVyID0gY29tcGlsZVBvaW50ZXIocG9pbnRlcilcbiAgdmFyIGxlbiA9IHBvaW50ZXIubGVuZ3RoXG4gIGlmIChsZW4gPT09IDEpIHJldHVybiBvYmpcblxuICBmb3IgKHZhciBwID0gMTsgcCA8IGxlbjspIHtcbiAgICBvYmogPSBvYmpbdW50aWxkZShwb2ludGVyW3ArK10pXVxuICAgIGlmIChsZW4gPT09IHApIHJldHVybiBvYmpcbiAgICBpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpIHJldHVybiB1bmRlZmluZWRcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXQgKG9iaiwgcG9pbnRlciwgdmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaW5wdXQgb2JqZWN0LicpXG4gIHBvaW50ZXIgPSBjb21waWxlUG9pbnRlcihwb2ludGVyKVxuICBpZiAocG9pbnRlci5sZW5ndGggPT09IDApIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBKU09OIHBvaW50ZXIgZm9yIHNldC4nKVxuICByZXR1cm4gc2V0dGVyKG9iaiwgcG9pbnRlciwgdmFsdWUpXG59XG5cbmZ1bmN0aW9uIGNvbXBpbGUgKHBvaW50ZXIpIHtcbiAgdmFyIGNvbXBpbGVkID0gY29tcGlsZVBvaW50ZXIocG9pbnRlcilcbiAgcmV0dXJuIHtcbiAgICBnZXQ6IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgIHJldHVybiBnZXQob2JqZWN0LCBjb21waWxlZClcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gKG9iamVjdCwgdmFsdWUpIHtcbiAgICAgIHJldHVybiBzZXQob2JqZWN0LCBjb21waWxlZCwgdmFsdWUpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydHMuZ2V0ID0gZ2V0XG5leHBvcnRzLnNldCA9IHNldFxuZXhwb3J0cy5jb21waWxlID0gY29tcGlsZVxuIiwibW9kdWxlLmV4cG9ydHMgPSBleHRlbmRcblxudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuZnVuY3Rpb24gZXh0ZW5kKCkge1xuICAgIHZhciB0YXJnZXQgPSB7fVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXVxuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkge1xuICAgICAgICAgICAgICAgIHRhcmdldFtrZXldID0gc291cmNlW2tleV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0YXJnZXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnZnJlZXplci1qcycpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJ2lzLW15LWpzb24tdmFsaWQnKVxuIl19
