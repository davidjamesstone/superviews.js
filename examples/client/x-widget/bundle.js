(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// const Store = require('../store')
const delegator = require('../delegator')
const Model = require('jpi-models')
// const validator = require('../validator')

// const validatorOptions = {
//   greedy: true,
//   formats: {
//     uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
//     objectid: /^[a-f\d]{24}$/i
//   }
// }

function convertValue (value, type) {
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
  return item.type === 'number' || item.type === 'string' || item.type === 'boolean'
}

const superviews = (options, Base = window.HTMLElement) => class Superviews extends Base {
  constructor (_) {
    _ = super(_)

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
          _.renderCallback()
        })
      }
    }

    cache.render = render

    /**
     * Input props/attrs & validation
     */
    const schema = options.schema
    if (schema && schema.properties) {
      const model = Model(schema)

      model.on('update', function (e) {
        console.log(e.event, e.path)
      })

      // const opts = options.validatorOptions || validatorOptions
      // const validate = validator(schema, opts)
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
          Object.defineProperty(_, key, {
            get () {
              return this.hasAttribute(key)
                ? convertValue(this.getAttribute(key), item.type)
                : dflt
            },
            set (value) {
              this.setAttribute(key, value)
            }
          })
        } else {
          // Store objects/arrays types as attributes and cast on `get`
          let val

          Object.defineProperty(_, key, {
            get () {
              return val === undefined ? dflt : val
            },
            set (value) {
              const oldval = val
              const newval = value

              if (newval !== oldval) {
                val = newval
                this.setAttribute(key, (+new Date()).toString(36))
              }
            }
          })
        }
      })

      // cache.validate = validate
    }

    /**
     * Event Delegation
     */
    const del = delegator(this)
    _.on = del.on.bind(del)
        // .filter(key => isSimple(properties[key]))
    _.off = del.off.bind(del)
    cache.delegate = del

    cache.events = options.events

    _.__superviews = cache

    _.init()

    return _
  }

  init () { /* override as you like */ }

  static get observedAttributes () {
    const properties = options.schema && options.schema.properties

    if (properties) {
      return Object.keys(properties)
        // .filter(key => isSimple(properties[key]))
        .map(key => key.toLowerCase())
    }
  }

  renderCallback () {
    console.log('Not implemented!')
  }

  // propertyChangedCallback (name, oldValue, newValue) {
  //   // Render on any change to observed properties
  //   // This can be overriden in a subclass.
  //   // To call this from the subclass use
  //   // super.propertyChangedCallback(name, oldValue, newValue)
  //   this.render()
  // }

  attributeChangedCallback (name, oldValue, newValue) {
    // Render on any change to observed attributes
    // This can be overriden in a subclass.
    // To call this from the subclass use
    // super.attributeChangedCallback(name, oldValue, newValue)
    this.render()
  }

  render (immediatley) {
    if (immediatley) {
      this.renderCallback()
    } else {
      this.__superviews.render()
    }
  }

  emit (name, customEventInit) {
    // Only emit registered events
    const events = this.__superviews.events

    if (!events || !(name in events)) {
      return
    }

    // Create custom event
    const event = new window.CustomEvent(name, customEventInit)

    // Call the DOM Level 1 handler if it exists
    const eventName = 'on' + name
    if (this[eventName]) {
      this[eventName](event)
    }

    // Dispatch the event
    this.dispatchEvent(event)
  }

  // validate () {
  //   // Get the schema and validate function
  //   const schema = options && options.schema
  //   const validate = this.__superviews.validate
  //   if (schema && validate) {
  //     const props = schema.properties
  //     const keys = Object.keys(props)

  //     // Build the input data
  //     const data = {}
  //     keys.forEach((key) => {
  //       data[key] = this[key]
  //     })

  //     // Call the validator
  //     const result = {
  //       ok: validate(data)
  //     }

  //     // Get the errors if in an invalid state
  //     if (!result.ok) {
  //       result.errors = validate.errors
  //     }

  //     return result
  //   }
  // }

  get props () {
    // Get the schema and validate function
    const schema = options && options.schema
    if (schema) {
      const props = schema.properties
      const keys = Object.keys(props)

      // Build the input data
      const data = {}
      keys.forEach((key) => {
        data[key] = this[key]
      })

      return data
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

},{"../delegator":2,"jpi-models":30}],2:[function(require,module,exports){
module.exports = require('dom-delegate')

},{"dom-delegate":14}],3:[function(require,module,exports){
module.exports = require('document-register-element')

},{"document-register-element":12}],4:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementClose = IncrementalDOM.elementClose
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var text = IncrementalDOM.text

var hoisted1 = ["type", "range", "name", "age"]
var hoisted2 = ["style", "background: red; padding: 10px;"]
var __target

module.exports = function description (el, state, ctrl) {
elementOpen("div")
  const result = ctrl.validate()
  if (result.ok) {
    elementOpen("b")
      text("hi")
    elementClose("b")
    text(" " + (this.attr1) + " \
        ")
    elementOpen("button", null, null, "onclick", function ($event) {
      var $element = this;
    ctrl.removeAllHandlers()})
      text("Remove Handlers")
    elementClose("button")
    elementOpen("dl")
      elementOpen("dt")
        text("State")
      elementClose("dt")
      elementOpen("dd")
        elementOpen("input", "b90d0d90-c9e3-44df-b58c-f3201eea1b57", hoisted1, "value", state.age, "min", ctrl.minAge, "max", ctrl.maxAge)
        elementClose("input")
      elementClose("dd")
      elementOpen("dd")
        text("" + (JSON.stringify(state.toJS(), null, 2)) + "")
      elementClose("dd")
    elementClose("dl")
    text(" \
        Change the state in the browser... \
        ")
    elementOpen("div")
      text("var el = document.querySelector('x-widget');")
    elementClose("div")
    elementOpen("div")
      text("el.state.set('a' , 42)")
    elementClose("div")
    elementOpen("div")
      text("el.state.set('b' , 'foo')")
    elementClose("div")
    elementOpen("div")
      text("el.state.set('c' , ['bar', 'baz'])")
    elementClose("div")
  } else {
    elementOpen("div", "99dd1be4-aa5f-41ab-bf2e-6a15ce497bc2", hoisted2)
      elementOpen("pre")
        text("" + (JSON.stringify(result.errors, null, 2)) + "")
      elementClose("pre")
    elementClose("div")
    text(" \
        Fix the errors in the console first. E.g. \
        ")
    elementOpen("div")
      text("var el = document.querySelector('x-widget')")
    elementClose("div")
    elementOpen("div")
      text("el.int = '2'")
    elementClose("div")
    elementOpen("div")
      text("el.prop1 = []")
    elementClose("div")
  }
elementClose("div")
}

},{"incremental-dom":21}],5:[function(require,module,exports){
require('../../../dre')

const superviews = require('../../../client')
const patch = require('../../../incremental-dom').patch
const validator = require('../../../validator')
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

const validatorOptions = {
  greedy: true,
  formats: {
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
    objectid: /^[a-f\d]{24}$/i
  }
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

const validate = validator(schema, validatorOptions)

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

  validate () {
    // Get the schema and validate function
    const data = this.el.props

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

class Widget extends superviews(options) {
  init () {
    const controller = new Controller(this)

    this
      .on('click', controller.onClick)
      .on('click', 'b', (e) => { console.log('hey') })
      .on('change', 'input[name=age]', (e) => {
        const age = +e.target.value
        // this.state.set('age', age)
        this.emit('changeage', {
          detail: {
            age: age
          }
        })
      })

    // const store = new Store({
    //   age: 42
    // })

    // store.on('update', (currentState, prevState) => {
    //   this.render()
    // })

    // // for the purposes of this example
    // // `state` is exposed here to allow
    // // it to be modified in the browsers console
    // // - you generally wont want to do this though
    // Object.defineProperty(this, 'state', {
    //   get: function () {
    //     return store.get()
    //   }
    // })

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

},{"../../../client":1,"../../../dre":3,"../../../incremental-dom":7,"../../../store":31,"../../../validator":32,"./index.html":4,"./schema":6}],6:[function(require,module,exports){
module.exports={
  "type": "object",
  "properties": {
    "str": { "type": "string", "default": "something" },
    "num": { "type": "number", "default": 1 },
    "int": { "type": "number", "format": "integer" },
    "arr": { "type": "array" },
    "opt": { "type": "string" },
    "obj": {
      "type": "object",
      "properties": {
        "a": { "type": "number", "format": "integer" },
        "b": { "type": "string" }
      },
      "required": [ "a", "b" ]
    }
  },
  "required": [ "str", "num", "int", "arr", "obj" ]
}

},{}],7:[function(require,module,exports){
const IncrementalDOM = require('incremental-dom')

IncrementalDOM.attributes.checked = function (el, name, value) {
  el.checked = !!value
}

IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value === null || typeof (value) === 'undefined' ? '' : value
}

module.exports = IncrementalDOM

},{"incremental-dom":21}],8:[function(require,module,exports){
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
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],11:[function(require,module,exports){
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

},{"./support/isBuffer":10,"_process":8,"inherits":9}],12:[function(require,module,exports){
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
    secondArgument = function (is) {
      return is.toLowerCase();
    },
  
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
    V0 = REGISTER_ELEMENT in document,
    setListener = true,
    justSetup = false,
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
  if (!V0) {
  
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
      if (setListener) {
        // only first time document.registerElement is used
        // we need to set this listener
        // setting it by default might slow down for no reason
        setListener = false;
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
          if (deep && query.length) loopAndSetup(node.querySelectorAll(query));
          return node;
        };
      }
  
      if (justSetup) return (justSetup = false);
  
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
  
      if (query.length) loopAndVerify(
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
        if (query.length) loopAndVerify(
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
    if (query.length) loopAndVerify(
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
    if (!V0) {
      justSetup = true;
      document[REGISTER_ELEMENT]('');
    }
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
      return {is: is.toLowerCase()};
    };
  }
  
}

module.exports = installCustomElements;
installCustomElements(global);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"./delegate":13}],15:[function(require,module,exports){
var Freezer = require('./src/freezer');
module.exports = Freezer;
},{"./src/freezer":17}],16:[function(require,module,exports){
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

},{"./utils":20}],17:[function(require,module,exports){
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

},{"./emitter":16,"./frozen":18,"./utils.js":20}],18:[function(require,module,exports){
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

},{"./emitter":16,"./nodeCreator":19,"./utils":20}],19:[function(require,module,exports){
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

},{"./utils.js":20}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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

},{"_process":8}],22:[function(require,module,exports){
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

},{}],23:[function(require,module,exports){
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

},{"./formats":22,"generate-function":24,"generate-object-property":25,"jsonpointer":27,"xtend":28}],24:[function(require,module,exports){
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

},{"util":11}],25:[function(require,module,exports){
var isProperty = require('is-property')

var gen = function(obj, prop) {
  return isProperty(prop) ? obj+'.'+prop : obj+'['+JSON.stringify(prop)+']'
}

gen.valid = isProperty
gen.property = function (prop) {
 return isProperty(prop) ? prop : JSON.stringify(prop)
}

module.exports = gen

},{"is-property":26}],26:[function(require,module,exports){
"use strict"
function isProperty(str) {
  return /^[$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc0-9\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19d9\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1dc0-\u1de6\u1dfc-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f]*$/.test(str)
}
module.exports = isProperty
},{}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
'use strict'

module.exports = function (fn) {
  const arr = []

  /**
   * Proxied array mutators methods
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */
  const pop = function () {
    const result = Array.prototype.pop.apply(arr)

    fn('pop', arr, {
      value: result
    })

    return result
  }
  const push = function () {
    const result = Array.prototype.push.apply(arr, arguments)

    fn('push', arr, {
      value: result
    })

    return result
  }
  const shift = function () {
    const result = Array.prototype.shift.apply(arr)

    fn('shift', arr, {
      value: result
    })

    return result
  }
  const sort = function () {
    const result = Array.prototype.sort.apply(arr, arguments)

    fn('sort', arr, {
      value: result
    })

    return result
  }
  const unshift = function () {
    const result = Array.prototype.unshift.apply(arr, arguments)

    fn('unshift', arr, {
      value: result
    })

    return result
  }
  const reverse = function () {
    const result = Array.prototype.reverse.apply(arr)

    fn('reverse', arr, {
      value: result
    })

    return result
  }
  const splice = function () {
    if (!arguments.length) {
      return
    }

    const result = Array.prototype.splice.apply(arr, arguments)

    fn('splice', arr, {
      value: result,
      removed: result,
      added: Array.prototype.slice.call(arguments, 2)
    })

    return result
  }

  /**
   * Proxy all Array.prototype mutator methods on this array instance
   */
  arr.pop = arr.pop && pop
  arr.push = arr.push && push
  arr.shift = arr.shift && shift
  arr.unshift = arr.unshift && unshift
  arr.sort = arr.sort && sort
  arr.reverse = arr.reverse && reverse
  arr.splice = arr.splice && splice

  /**
   * Special update function since we can't detect
   * assignment by index e.g. arr[0] = 'something'
   */
  arr.set = function (index, value) {
    const oldValue = arr[index]
    const newValue = arr[index] = value

    fn('update', arr, {
      index: index,
      value: newValue,
      oldValue: oldValue
    })

    return newValue
  }

  return arr
}

},{}],30:[function(require,module,exports){
'use strict'

const array = require('./array')

function model (schema) {
  const paths = []
  // const root = ee({})
  const callbacks = {}

  const root = Object.create({}, {
    on: {
      value: function (event, selector, fn) {
        if (typeof selector === 'function') {
          fn = selector
          selector = undefined
        }

        if (!callbacks[event]) {
          callbacks[event] = new Map()
        }

        callbacks[event].set(selector, fn)
      }
    }
  })

  function emit (event, selector, details) {
    if (callbacks[event]) {
      const map = callbacks[event]

      map.forEach(function (value, key) {
        if ((!key && !selector) || (key === selector)) {
          value.call(root, details)
        } else if (key instanceof RegExp && key.test(selector)) {
          value.call(root, details)
        }
      })
    }
  }

  function apply (schema, ctx, path) {
    if (schema.properties) {
      paths.push(path)
      path = paths.slice(1).join('.')

      const props = schema.properties

      for (let key in props) {
        const prop = props[key]

        if (prop.properties) {
          const child = {}
          apply(prop, child, key)
          ctx[key] = child
          paths.pop()
        } else if (prop.items) {
          const child = array(function (event, arr, result) {
            const name = path ? path + '.' + key : key
            emit(event, name, {
              event: event,
              key: key,
              path: name,
              context: arr,
              result: result
            })

            emit('update', null, {
              event: event,
              key: key,
              path: name,
              context: arr,
              result: result
            })
          })
          child.create = function () {
            const item = {}
            apply(prop.items, item, path ? path + '.' + key : key)
            paths.pop()
            return item
          }
          ctx[key] = child
        } else {
          let val = prop.default

          Object.defineProperty(ctx, key, {
            get () {
              return val
            },
            set (value) {
              const oldValue = val

              val = value

              const name = path ? path + '.' + key : key
              emit('change', name, {
                event: 'change',
                key: key,
                path: name,
                context: ctx,
                oldValue: oldValue,
                newValue: value
              })

              emit('update', null, {
                event: 'update',
                key: key,
                path: name,
                context: ctx,
                oldValue: oldValue,
                newValue: value
              })
            },
            enumerable: true
          })
        }
      }
    }
  }

  apply(schema, root, '')

  Object.freeze(root)

  return root
}

module.exports = model

},{"./array":29}],31:[function(require,module,exports){
module.exports = require('freezer-js')

},{"freezer-js":15}],32:[function(require,module,exports){
module.exports = require('is-my-json-valid')

},{"is-my-json-valid":23}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvaW5kZXguanMiLCJkZWxlZ2F0b3IuanMiLCJkcmUuanMiLCJleGFtcGxlcy9jbGllbnQveC13aWRnZXQvaW5kZXguaHRtbCIsImV4YW1wbGVzL2NsaWVudC94LXdpZGdldC9pbmRleC5qcyIsImV4YW1wbGVzL2NsaWVudC94LXdpZGdldC9zY2hlbWEuanNvbiIsImluY3JlbWVudGFsLWRvbS5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9kb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50L2J1aWxkL2RvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQubm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9kb20tZGVsZWdhdGUvbGliL2RlbGVnYXRlLmpzIiwibm9kZV9tb2R1bGVzL2RvbS1kZWxlZ2F0ZS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZnJlZXplci1qcy9mcmVlemVyLmpzIiwibm9kZV9tb2R1bGVzL2ZyZWV6ZXItanMvc3JjL2VtaXR0ZXIuanMiLCJub2RlX21vZHVsZXMvZnJlZXplci1qcy9zcmMvZnJlZXplci5qcyIsIm5vZGVfbW9kdWxlcy9mcmVlemVyLWpzL3NyYy9mcm96ZW4uanMiLCJub2RlX21vZHVsZXMvZnJlZXplci1qcy9zcmMvbm9kZUNyZWF0b3IuanMiLCJub2RlX21vZHVsZXMvZnJlZXplci1qcy9zcmMvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvaW5jcmVtZW50YWwtZG9tL2Rpc3QvaW5jcmVtZW50YWwtZG9tLWNqcy5qcyIsIm5vZGVfbW9kdWxlcy9pcy1teS1qc29uLXZhbGlkL2Zvcm1hdHMuanMiLCJub2RlX21vZHVsZXMvaXMtbXktanNvbi12YWxpZC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pcy1teS1qc29uLXZhbGlkL25vZGVfbW9kdWxlcy9nZW5lcmF0ZS1mdW5jdGlvbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pcy1teS1qc29uLXZhbGlkL25vZGVfbW9kdWxlcy9nZW5lcmF0ZS1vYmplY3QtcHJvcGVydHkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaXMtbXktanNvbi12YWxpZC9ub2RlX21vZHVsZXMvZ2VuZXJhdGUtb2JqZWN0LXByb3BlcnR5L25vZGVfbW9kdWxlcy9pcy1wcm9wZXJ0eS9pcy1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9pcy1teS1qc29uLXZhbGlkL25vZGVfbW9kdWxlcy9qc29ucG9pbnRlci9qc29ucG9pbnRlci5qcyIsIm5vZGVfbW9kdWxlcy9pcy1teS1qc29uLXZhbGlkL25vZGVfbW9kdWxlcy94dGVuZC9pbW11dGFibGUuanMiLCJub2RlX21vZHVsZXMvanBpLW1vZGVscy9hcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9qcGktbW9kZWxzL2luZGV4LmpzIiwic3RvcmUuanMiLCJ2YWxpZGF0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlSQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzFrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNuNkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMTRDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGxCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9IQTtBQUNBOztBQ0RBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gY29uc3QgU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZScpXG5jb25zdCBkZWxlZ2F0b3IgPSByZXF1aXJlKCcuLi9kZWxlZ2F0b3InKVxuY29uc3QgTW9kZWwgPSByZXF1aXJlKCdqcGktbW9kZWxzJylcbi8vIGNvbnN0IHZhbGlkYXRvciA9IHJlcXVpcmUoJy4uL3ZhbGlkYXRvcicpXG5cbi8vIGNvbnN0IHZhbGlkYXRvck9wdGlvbnMgPSB7XG4vLyAgIGdyZWVkeTogdHJ1ZSxcbi8vICAgZm9ybWF0czoge1xuLy8gICAgIHV1aWQ6IC9eKD86dXJuOnV1aWQ6KT9bMC05YS1mXXs4fS0oPzpbMC05YS1mXXs0fS0pezN9WzAtOWEtZl17MTJ9JC9pLFxuLy8gICAgIG9iamVjdGlkOiAvXlthLWZcXGRdezI0fSQvaVxuLy8gICB9XG4vLyB9XG5cbmZ1bmN0aW9uIGNvbnZlcnRWYWx1ZSAodmFsdWUsIHR5cGUpIHtcbiAgaWYgKHR5cGVvZiAodmFsdWUpICE9PSAnc3RyaW5nJyB8fCB0eXBlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB2YWx1ZVxuICB9XG5cbiAgaWYgKHR5cGUgPT09ICdpbnRlZ2VyJyB8fCB0eXBlID09PSAnbnVtYmVyJykge1xuICAgIC8vIGZhc3Rlc3QgKGFuZCBtb3JlIHJlbGlhYmxlKSB3YXkgdG8gY29udmVydCBzdHJpbmdzIHRvIG51bWJlcnNcbiAgICB2YXIgY29udmVydGVkVmFsID0gMSAqIHZhbHVlXG4gICAgLy8gbWFrZSBzdXJlIHRoYXQgaWYgb3VyIHNjaGVtYSBjYWxscyBmb3IgYW4gaW50ZWdlciwgdGhhdCB0aGVyZSBpcyBubyBkZWNpbWFsXG4gICAgaWYgKGNvbnZlcnRlZFZhbCB8fCBjb252ZXJ0ZWRWYWwgPT09IDAgJiYgKHR5cGUgPT09ICdudW1iZXInIHx8ICh2YWx1ZS5pbmRleE9mKCcuJykgPT09IC0xKSkpIHtcbiAgICAgIHJldHVybiBjb252ZXJ0ZWRWYWxcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgaWYgKHZhbHVlID09PSAndHJ1ZScpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gJ2ZhbHNlJykge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHZhbHVlXG59XG5cbmZ1bmN0aW9uIGlzU2ltcGxlIChpdGVtKSB7XG4gIHJldHVybiBpdGVtLnR5cGUgPT09ICdudW1iZXInIHx8IGl0ZW0udHlwZSA9PT0gJ3N0cmluZycgfHwgaXRlbS50eXBlID09PSAnYm9vbGVhbidcbn1cblxuY29uc3Qgc3VwZXJ2aWV3cyA9IChvcHRpb25zLCBCYXNlID0gd2luZG93LkhUTUxFbGVtZW50KSA9PiBjbGFzcyBTdXBlcnZpZXdzIGV4dGVuZHMgQmFzZSB7XG4gIGNvbnN0cnVjdG9yIChfKSB7XG4gICAgXyA9IHN1cGVyKF8pXG5cbiAgICBjb25zdCBjYWNoZSA9IHtcbiAgICAgIG9wdGlvbnM6IG9wdGlvbnNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWZlcnJlZCByZW5kZXJlclxuICAgICAqL1xuICAgIGxldCByZW5kZXJUaW1lb3V0SWQgPSAwXG4gICAgY29uc3QgcmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCFyZW5kZXJUaW1lb3V0SWQpIHtcbiAgICAgICAgcmVuZGVyVGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgcmVuZGVyVGltZW91dElkID0gMFxuICAgICAgICAgIF8ucmVuZGVyQ2FsbGJhY2soKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIGNhY2hlLnJlbmRlciA9IHJlbmRlclxuXG4gICAgLyoqXG4gICAgICogSW5wdXQgcHJvcHMvYXR0cnMgJiB2YWxpZGF0aW9uXG4gICAgICovXG4gICAgY29uc3Qgc2NoZW1hID0gb3B0aW9ucy5zY2hlbWFcbiAgICBpZiAoc2NoZW1hICYmIHNjaGVtYS5wcm9wZXJ0aWVzKSB7XG4gICAgICBjb25zdCBtb2RlbCA9IE1vZGVsKHNjaGVtYSlcblxuICAgICAgbW9kZWwub24oJ3VwZGF0ZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGUuZXZlbnQsIGUucGF0aClcbiAgICAgIH0pXG5cbiAgICAgIC8vIGNvbnN0IG9wdHMgPSBvcHRpb25zLnZhbGlkYXRvck9wdGlvbnMgfHwgdmFsaWRhdG9yT3B0aW9uc1xuICAgICAgLy8gY29uc3QgdmFsaWRhdGUgPSB2YWxpZGF0b3Ioc2NoZW1hLCBvcHRzKVxuICAgICAgY29uc3QgcHJvcHMgPSBzY2hlbWEucHJvcGVydGllc1xuICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHByb3BzKVxuXG4gICAgICAvLyBGb3IgZXZlcnkga2V5IGluIHRoZSByb290IHNjaGVtYXMgcHJvcGVydGllc1xuICAgICAgLy8gc2V0IHVwIGFuIGF0dHJpYnV0ZSBvciBwcm9wZXJ0eSBvbiB0aGUgZWxlbWVudFxuICAgICAga2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHByb3BzW2tleV1cbiAgICAgICAgY29uc3QgaXNBdHRyID0gaXNTaW1wbGUoaXRlbSlcbiAgICAgICAgbGV0IGRmbHRcblxuICAgICAgICBpZiAoJ2RlZmF1bHQnIGluIGl0ZW0pIHtcbiAgICAgICAgICBkZmx0ID0gaXRlbS5kZWZhdWx0XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNBdHRyKSB7XG4gICAgICAgICAgLy8gU3RvcmUgcHJpbWl0aXZlIHR5cGVzIGFzIGF0dHJpYnV0ZXMgYW5kIGNhc3Qgb24gYGdldGBcbiAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoXywga2V5LCB7XG4gICAgICAgICAgICBnZXQgKCkge1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5oYXNBdHRyaWJ1dGUoa2V5KVxuICAgICAgICAgICAgICAgID8gY29udmVydFZhbHVlKHRoaXMuZ2V0QXR0cmlidXRlKGtleSksIGl0ZW0udHlwZSlcbiAgICAgICAgICAgICAgICA6IGRmbHRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQgKHZhbHVlKSB7XG4gICAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBTdG9yZSBvYmplY3RzL2FycmF5cyB0eXBlcyBhcyBhdHRyaWJ1dGVzIGFuZCBjYXN0IG9uIGBnZXRgXG4gICAgICAgICAgbGV0IHZhbFxuXG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KF8sIGtleSwge1xuICAgICAgICAgICAgZ2V0ICgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHZhbCA9PT0gdW5kZWZpbmVkID8gZGZsdCA6IHZhbFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCAodmFsdWUpIHtcbiAgICAgICAgICAgICAgY29uc3Qgb2xkdmFsID0gdmFsXG4gICAgICAgICAgICAgIGNvbnN0IG5ld3ZhbCA9IHZhbHVlXG5cbiAgICAgICAgICAgICAgaWYgKG5ld3ZhbCAhPT0gb2xkdmFsKSB7XG4gICAgICAgICAgICAgICAgdmFsID0gbmV3dmFsXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoa2V5LCAoK25ldyBEYXRlKCkpLnRvU3RyaW5nKDM2KSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIC8vIGNhY2hlLnZhbGlkYXRlID0gdmFsaWRhdGVcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBEZWxlZ2F0aW9uXG4gICAgICovXG4gICAgY29uc3QgZGVsID0gZGVsZWdhdG9yKHRoaXMpXG4gICAgXy5vbiA9IGRlbC5vbi5iaW5kKGRlbClcbiAgICAgICAgLy8gLmZpbHRlcihrZXkgPT4gaXNTaW1wbGUocHJvcGVydGllc1trZXldKSlcbiAgICBfLm9mZiA9IGRlbC5vZmYuYmluZChkZWwpXG4gICAgY2FjaGUuZGVsZWdhdGUgPSBkZWxcblxuICAgIGNhY2hlLmV2ZW50cyA9IG9wdGlvbnMuZXZlbnRzXG5cbiAgICBfLl9fc3VwZXJ2aWV3cyA9IGNhY2hlXG5cbiAgICBfLmluaXQoKVxuXG4gICAgcmV0dXJuIF9cbiAgfVxuXG4gIGluaXQgKCkgeyAvKiBvdmVycmlkZSBhcyB5b3UgbGlrZSAqLyB9XG5cbiAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMgKCkge1xuICAgIGNvbnN0IHByb3BlcnRpZXMgPSBvcHRpb25zLnNjaGVtYSAmJiBvcHRpb25zLnNjaGVtYS5wcm9wZXJ0aWVzXG5cbiAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpXG4gICAgICAgIC8vIC5maWx0ZXIoa2V5ID0+IGlzU2ltcGxlKHByb3BlcnRpZXNba2V5XSkpXG4gICAgICAgIC5tYXAoa2V5ID0+IGtleS50b0xvd2VyQ2FzZSgpKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlckNhbGxiYWNrICgpIHtcbiAgICBjb25zb2xlLmxvZygnTm90IGltcGxlbWVudGVkIScpXG4gIH1cblxuICAvLyBwcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayAobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gIC8vICAgLy8gUmVuZGVyIG9uIGFueSBjaGFuZ2UgdG8gb2JzZXJ2ZWQgcHJvcGVydGllc1xuICAvLyAgIC8vIFRoaXMgY2FuIGJlIG92ZXJyaWRlbiBpbiBhIHN1YmNsYXNzLlxuICAvLyAgIC8vIFRvIGNhbGwgdGhpcyBmcm9tIHRoZSBzdWJjbGFzcyB1c2VcbiAgLy8gICAvLyBzdXBlci5wcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpXG4gIC8vICAgdGhpcy5yZW5kZXIoKVxuICAvLyB9XG5cbiAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrIChuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAvLyBSZW5kZXIgb24gYW55IGNoYW5nZSB0byBvYnNlcnZlZCBhdHRyaWJ1dGVzXG4gICAgLy8gVGhpcyBjYW4gYmUgb3ZlcnJpZGVuIGluIGEgc3ViY2xhc3MuXG4gICAgLy8gVG8gY2FsbCB0aGlzIGZyb20gdGhlIHN1YmNsYXNzIHVzZVxuICAgIC8vIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpXG4gICAgdGhpcy5yZW5kZXIoKVxuICB9XG5cbiAgcmVuZGVyIChpbW1lZGlhdGxleSkge1xuICAgIGlmIChpbW1lZGlhdGxleSkge1xuICAgICAgdGhpcy5yZW5kZXJDYWxsYmFjaygpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX19zdXBlcnZpZXdzLnJlbmRlcigpXG4gICAgfVxuICB9XG5cbiAgZW1pdCAobmFtZSwgY3VzdG9tRXZlbnRJbml0KSB7XG4gICAgLy8gT25seSBlbWl0IHJlZ2lzdGVyZWQgZXZlbnRzXG4gICAgY29uc3QgZXZlbnRzID0gdGhpcy5fX3N1cGVydmlld3MuZXZlbnRzXG5cbiAgICBpZiAoIWV2ZW50cyB8fCAhKG5hbWUgaW4gZXZlbnRzKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGN1c3RvbSBldmVudFxuICAgIGNvbnN0IGV2ZW50ID0gbmV3IHdpbmRvdy5DdXN0b21FdmVudChuYW1lLCBjdXN0b21FdmVudEluaXQpXG5cbiAgICAvLyBDYWxsIHRoZSBET00gTGV2ZWwgMSBoYW5kbGVyIGlmIGl0IGV4aXN0c1xuICAgIGNvbnN0IGV2ZW50TmFtZSA9ICdvbicgKyBuYW1lXG4gICAgaWYgKHRoaXNbZXZlbnROYW1lXSkge1xuICAgICAgdGhpc1tldmVudE5hbWVdKGV2ZW50KVxuICAgIH1cblxuICAgIC8vIERpc3BhdGNoIHRoZSBldmVudFxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChldmVudClcbiAgfVxuXG4gIC8vIHZhbGlkYXRlICgpIHtcbiAgLy8gICAvLyBHZXQgdGhlIHNjaGVtYSBhbmQgdmFsaWRhdGUgZnVuY3Rpb25cbiAgLy8gICBjb25zdCBzY2hlbWEgPSBvcHRpb25zICYmIG9wdGlvbnMuc2NoZW1hXG4gIC8vICAgY29uc3QgdmFsaWRhdGUgPSB0aGlzLl9fc3VwZXJ2aWV3cy52YWxpZGF0ZVxuICAvLyAgIGlmIChzY2hlbWEgJiYgdmFsaWRhdGUpIHtcbiAgLy8gICAgIGNvbnN0IHByb3BzID0gc2NoZW1hLnByb3BlcnRpZXNcbiAgLy8gICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9wcylcblxuICAvLyAgICAgLy8gQnVpbGQgdGhlIGlucHV0IGRhdGFcbiAgLy8gICAgIGNvbnN0IGRhdGEgPSB7fVxuICAvLyAgICAga2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgLy8gICAgICAgZGF0YVtrZXldID0gdGhpc1trZXldXG4gIC8vICAgICB9KVxuXG4gIC8vICAgICAvLyBDYWxsIHRoZSB2YWxpZGF0b3JcbiAgLy8gICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgLy8gICAgICAgb2s6IHZhbGlkYXRlKGRhdGEpXG4gIC8vICAgICB9XG5cbiAgLy8gICAgIC8vIEdldCB0aGUgZXJyb3JzIGlmIGluIGFuIGludmFsaWQgc3RhdGVcbiAgLy8gICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gIC8vICAgICAgIHJlc3VsdC5lcnJvcnMgPSB2YWxpZGF0ZS5lcnJvcnNcbiAgLy8gICAgIH1cblxuICAvLyAgICAgcmV0dXJuIHJlc3VsdFxuICAvLyAgIH1cbiAgLy8gfVxuXG4gIGdldCBwcm9wcyAoKSB7XG4gICAgLy8gR2V0IHRoZSBzY2hlbWEgYW5kIHZhbGlkYXRlIGZ1bmN0aW9uXG4gICAgY29uc3Qgc2NoZW1hID0gb3B0aW9ucyAmJiBvcHRpb25zLnNjaGVtYVxuICAgIGlmIChzY2hlbWEpIHtcbiAgICAgIGNvbnN0IHByb3BzID0gc2NoZW1hLnByb3BlcnRpZXNcbiAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9wcylcblxuICAgICAgLy8gQnVpbGQgdGhlIGlucHV0IGRhdGFcbiAgICAgIGNvbnN0IGRhdGEgPSB7fVxuICAgICAga2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgZGF0YVtrZXldID0gdGhpc1trZXldXG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gZGF0YVxuICAgIH1cbiAgfVxuICBzdGF0aWMgZ2V0IHNjaGVtYSAoKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMuc2NoZW1hXG4gIH1cblxuICBzdGF0aWMgZ2V0IGV2ZW50cyAoKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMuZXZlbnRzXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdXBlcnZpZXdzXG5cbi8vIFRPRE86XG4vLyBTS0lQXG4vLyBFeHRlbmQgb3RoZXIgSFRNTCBlbGVtZW50cyAtIFwiaXNcIi8vIFRPRE86XG4vLyBTS0lQXG4vLyBFWFRFTkQgSFRNTFxuLy8gTm8gbW9yZSBjaGVja2VkPXtpc0NoZWNrZWQgPyAnY2hlY2tlZCc6IG51bGx9ID0+IGNoZWNrZWQ9e2lzQ2hlY2tlZH0gZm9yIGJvb2xlYW4gYXR0cmlidXRlc1xuLy8gU2NvcGUvdGhpcy9kYXRhL21vZGVsIChzcHJlYWQ/KSBiZXR3ZWVuIHRoZSB2aWV3IGFuZCBjdXN0b21lbGVtZW50LlxuLy8gQWxzbyBldmVudCBoYW5kbGVycyBuZWVkIHNob3VsZCBub3QgaGF2ZSB0byBiZSByZWRlZmluZWQgZWFjaCBwYXRjaFxuLy8gICAtIEluIGZhY3QsIGRvbSBsZXZlbCAxIGV2ZW50cyB3aWxsICphbHdheXMqIGJlIHJlZGVmaW5lZCB3aXRoIHN1cGVydmlld3MgaGFuZGxlciB3cmFwcGVyLiBGaXggdGhpcy5cbi8vIHN0YXRlIGZyb20gcHJvcHMuIG5lZWQgdG8ga25vdyB3aGVuIGEgcHJvcGVydHkgY2hhbmdlcyAodG8gcG9zc2libHkgdXBkYXRlIHN0YXRlKS4gb3IgbWFyayBwcm9wZXJ0aWVzIGUuZy5cbi8vIG9wdHMgPSB7XG4vLyAgIHNjaGVtYToge1xuLy8gICAgIHByb3BlcnRpZXM6IHtcbi8vICAgICAgIHRvZG86IHtcbi8vICAgICAgICAgdGV4dDogeyB0eXBlOiAnc3RyaW5nJyB9LFxuLy8gICAgICAgICBpc0NvbXBsZXRlZDogeyB0eXBlOiAnYm9vbGVhbicgfVxuLy8gICAgICAgfVxuLy8gICAgIH0sXG4vLyAgICAgcmVxdWlyZWQ6IFsnaWQnLCAndGV4dCddXG4vLyAgIH0sXG4gICAgICAvLyBub3cgbWFyayBjZXJ0YWluIHByb3BlcnRpZXMgYXMgc3RvcmVzIHRoYXQgd2hlbiBzZXQsIHdpbGwgYmUgZnJvemVuXG4gICAgICAvLyBNYXliZSBmcmVlemUgZXZlcnl0aGluZz9cbi8vICAgc3RvcmVzOiBbJ3RvZG8nLCAuLi5dXG4vLyB9XG4vLyBBbHRlcm5hdGl2ZWx5LCBoYXZlIGEgb25Qcm9wZXJ0eUNoYW5nZWQgY2FsbGJhY2suXG4vLyBOZWVkIGEgc3RyYXRlZ3kgZm9yIGludGVybmFsIHN0YXRlIG9yIHByb3BzXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJ2RvbS1kZWxlZ2F0ZScpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJ2RvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQnKVxuIiwidmFyIEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJylcbnZhciBwYXRjaCA9IEluY3JlbWVudGFsRE9NLnBhdGNoXG52YXIgZWxlbWVudE9wZW4gPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50T3BlblxudmFyIGVsZW1lbnRDbG9zZSA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRDbG9zZVxudmFyIHNraXAgPSBJbmNyZW1lbnRhbERPTS5za2lwXG52YXIgY3VycmVudEVsZW1lbnQgPSBJbmNyZW1lbnRhbERPTS5jdXJyZW50RWxlbWVudFxudmFyIHRleHQgPSBJbmNyZW1lbnRhbERPTS50ZXh0XG5cbnZhciBob2lzdGVkMSA9IFtcInR5cGVcIiwgXCJyYW5nZVwiLCBcIm5hbWVcIiwgXCJhZ2VcIl1cbnZhciBob2lzdGVkMiA9IFtcInN0eWxlXCIsIFwiYmFja2dyb3VuZDogcmVkOyBwYWRkaW5nOiAxMHB4O1wiXVxudmFyIF9fdGFyZ2V0XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVzY3JpcHRpb24gKGVsLCBzdGF0ZSwgY3RybCkge1xuZWxlbWVudE9wZW4oXCJkaXZcIilcbiAgY29uc3QgcmVzdWx0ID0gY3RybC52YWxpZGF0ZSgpXG4gIGlmIChyZXN1bHQub2spIHtcbiAgICBlbGVtZW50T3BlbihcImJcIilcbiAgICAgIHRleHQoXCJoaVwiKVxuICAgIGVsZW1lbnRDbG9zZShcImJcIilcbiAgICB0ZXh0KFwiIFwiICsgKHRoaXMuYXR0cjEpICsgXCIgXFxcbiAgICAgICAgXCIpXG4gICAgZWxlbWVudE9wZW4oXCJidXR0b25cIiwgbnVsbCwgbnVsbCwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgY3RybC5yZW1vdmVBbGxIYW5kbGVycygpfSlcbiAgICAgIHRleHQoXCJSZW1vdmUgSGFuZGxlcnNcIilcbiAgICBlbGVtZW50Q2xvc2UoXCJidXR0b25cIilcbiAgICBlbGVtZW50T3BlbihcImRsXCIpXG4gICAgICBlbGVtZW50T3BlbihcImR0XCIpXG4gICAgICAgIHRleHQoXCJTdGF0ZVwiKVxuICAgICAgZWxlbWVudENsb3NlKFwiZHRcIilcbiAgICAgIGVsZW1lbnRPcGVuKFwiZGRcIilcbiAgICAgICAgZWxlbWVudE9wZW4oXCJpbnB1dFwiLCBcImI5MGQwZDkwLWM5ZTMtNDRkZi1iNThjLWYzMjAxZWVhMWI1N1wiLCBob2lzdGVkMSwgXCJ2YWx1ZVwiLCBzdGF0ZS5hZ2UsIFwibWluXCIsIGN0cmwubWluQWdlLCBcIm1heFwiLCBjdHJsLm1heEFnZSlcbiAgICAgICAgZWxlbWVudENsb3NlKFwiaW5wdXRcIilcbiAgICAgIGVsZW1lbnRDbG9zZShcImRkXCIpXG4gICAgICBlbGVtZW50T3BlbihcImRkXCIpXG4gICAgICAgIHRleHQoXCJcIiArIChKU09OLnN0cmluZ2lmeShzdGF0ZS50b0pTKCksIG51bGwsIDIpKSArIFwiXCIpXG4gICAgICBlbGVtZW50Q2xvc2UoXCJkZFwiKVxuICAgIGVsZW1lbnRDbG9zZShcImRsXCIpXG4gICAgdGV4dChcIiBcXFxuICAgICAgICBDaGFuZ2UgdGhlIHN0YXRlIGluIHRoZSBicm93c2VyLi4uIFxcXG4gICAgICAgIFwiKVxuICAgIGVsZW1lbnRPcGVuKFwiZGl2XCIpXG4gICAgICB0ZXh0KFwidmFyIGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcigneC13aWRnZXQnKTtcIilcbiAgICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbiAgICBlbGVtZW50T3BlbihcImRpdlwiKVxuICAgICAgdGV4dChcImVsLnN0YXRlLnNldCgnYScgLCA0MilcIilcbiAgICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbiAgICBlbGVtZW50T3BlbihcImRpdlwiKVxuICAgICAgdGV4dChcImVsLnN0YXRlLnNldCgnYicgLCAnZm9vJylcIilcbiAgICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbiAgICBlbGVtZW50T3BlbihcImRpdlwiKVxuICAgICAgdGV4dChcImVsLnN0YXRlLnNldCgnYycgLCBbJ2JhcicsICdiYXonXSlcIilcbiAgICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbiAgfSBlbHNlIHtcbiAgICBlbGVtZW50T3BlbihcImRpdlwiLCBcIjk5ZGQxYmU0LWFhNWYtNDFhYi1iZjJlLTZhMTVjZTQ5N2JjMlwiLCBob2lzdGVkMilcbiAgICAgIGVsZW1lbnRPcGVuKFwicHJlXCIpXG4gICAgICAgIHRleHQoXCJcIiArIChKU09OLnN0cmluZ2lmeShyZXN1bHQuZXJyb3JzLCBudWxsLCAyKSkgKyBcIlwiKVxuICAgICAgZWxlbWVudENsb3NlKFwicHJlXCIpXG4gICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgdGV4dChcIiBcXFxuICAgICAgICBGaXggdGhlIGVycm9ycyBpbiB0aGUgY29uc29sZSBmaXJzdC4gRS5nLiBcXFxuICAgICAgICBcIilcbiAgICBlbGVtZW50T3BlbihcImRpdlwiKVxuICAgICAgdGV4dChcInZhciBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3gtd2lkZ2V0JylcIilcbiAgICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbiAgICBlbGVtZW50T3BlbihcImRpdlwiKVxuICAgICAgdGV4dChcImVsLmludCA9ICcyJ1wiKVxuICAgIGVsZW1lbnRDbG9zZShcImRpdlwiKVxuICAgIGVsZW1lbnRPcGVuKFwiZGl2XCIpXG4gICAgICB0ZXh0KFwiZWwucHJvcDEgPSBbXVwiKVxuICAgIGVsZW1lbnRDbG9zZShcImRpdlwiKVxuICB9XG5lbGVtZW50Q2xvc2UoXCJkaXZcIilcbn1cbiIsInJlcXVpcmUoJy4uLy4uLy4uL2RyZScpXG5cbmNvbnN0IHN1cGVydmlld3MgPSByZXF1aXJlKCcuLi8uLi8uLi9jbGllbnQnKVxuY29uc3QgcGF0Y2ggPSByZXF1aXJlKCcuLi8uLi8uLi9pbmNyZW1lbnRhbC1kb20nKS5wYXRjaFxuY29uc3QgdmFsaWRhdG9yID0gcmVxdWlyZSgnLi4vLi4vLi4vdmFsaWRhdG9yJylcbmNvbnN0IFN0b3JlID0gcmVxdWlyZSgnLi4vLi4vLi4vc3RvcmUnKVxuY29uc3QgdmlldyA9IHJlcXVpcmUoJy4vaW5kZXguaHRtbCcpXG5jb25zdCBzY2hlbWEgPSByZXF1aXJlKCcuL3NjaGVtYScpXG5jb25zdCBTeW1ib2xzID0ge1xuICBDT05UUk9MTEVSOiBTeW1ib2woJ2NvbnRyb2xsZXInKVxufVxuY29uc3QgYWdlU2NoZW1hID0ge1xuICB0eXBlOiAnaW50ZWdlcicsXG4gIG1pbjogMCxcbiAgbWF4OiAxMzBcbn1cblxuY29uc3QgdmFsaWRhdG9yT3B0aW9ucyA9IHtcbiAgZ3JlZWR5OiB0cnVlLFxuICBmb3JtYXRzOiB7XG4gICAgdXVpZDogL14oPzp1cm46dXVpZDopP1swLTlhLWZdezh9LSg/OlswLTlhLWZdezR9LSl7M31bMC05YS1mXXsxMn0kL2ksXG4gICAgb2JqZWN0aWQ6IC9eW2EtZlxcZF17MjR9JC9pXG4gIH1cbn1cblxuY29uc3Qgb3B0aW9ucyA9IHtcbiAgc2NoZW1hOiBzY2hlbWEsXG4gIGV2ZW50czoge1xuICAgIGNoYW5nZWFnZTogYWdlU2NoZW1hLFxuICAgIG1lc3NhZ2U6IHtcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgbmFtZTogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICB0aW1lc3RhbXA6IHsgdHlwZTogJ2RhdGUnIH1cbiAgICAgIH0sXG4gICAgICByZXF1aXJlZDogWyduYW1lJywgJ3RpbWVzdGFtcCddXG4gICAgfVxuICB9XG59XG5cbmNvbnN0IHZhbGlkYXRlID0gdmFsaWRhdG9yKHNjaGVtYSwgdmFsaWRhdG9yT3B0aW9ucylcblxuLy8gU29tZXRpbWVzIGEgc2ltcGxlIGBjb250cm9sbGVyYCBjbGFzcyBjYW4gYmUgYSB1c2VmdWwgd2F5XG4vLyBvZiBrZWVwaW5nIGludGVybmFsIGNvZGUgc2VwYXJhdGUgZnJvbSB0aGUgY29tcG9uZW50IGNsYXNzXG5jbGFzcyBDb250cm9sbGVyIHtcbiAgY29uc3RydWN0b3IgKGVsKSB7XG4gICAgdGhpcy5lbCA9IGVsXG4gICAgdGhpcy5taW5BZ2UgPSBhZ2VTY2hlbWEubWluXG4gICAgdGhpcy5tYXhBZ2UgPSBhZ2VTY2hlbWEubWF4XG4gIH1cblxuICBvbkNsaWNrIChlKSB7XG4gICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgIGNvbnNvbGUubG9nKCdCb25qb3VyJylcbiAgfVxuXG4gIHJlbW92ZUFsbEhhbmRsZXJzIChlKSB7XG4gICAgdGhpcy5lbC5vZmYoKVxuICB9XG5cbiAgdmFsaWRhdGUgKCkge1xuICAgIC8vIEdldCB0aGUgc2NoZW1hIGFuZCB2YWxpZGF0ZSBmdW5jdGlvblxuICAgIGNvbnN0IGRhdGEgPSB0aGlzLmVsLnByb3BzXG5cbiAgICAvLyBDYWxsIHRoZSB2YWxpZGF0b3JcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICBvazogdmFsaWRhdGUoZGF0YSlcbiAgICB9XG5cbiAgICAvLyBHZXQgdGhlIGVycm9ycyBpZiBpbiBhbiBpbnZhbGlkIHN0YXRlXG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIHJlc3VsdC5lcnJvcnMgPSB2YWxpZGF0ZS5lcnJvcnNcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbn1cblxuY2xhc3MgV2lkZ2V0IGV4dGVuZHMgc3VwZXJ2aWV3cyhvcHRpb25zKSB7XG4gIGluaXQgKCkge1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlcih0aGlzKVxuXG4gICAgdGhpc1xuICAgICAgLm9uKCdjbGljaycsIGNvbnRyb2xsZXIub25DbGljaylcbiAgICAgIC5vbignY2xpY2snLCAnYicsIChlKSA9PiB7IGNvbnNvbGUubG9nKCdoZXknKSB9KVxuICAgICAgLm9uKCdjaGFuZ2UnLCAnaW5wdXRbbmFtZT1hZ2VdJywgKGUpID0+IHtcbiAgICAgICAgY29uc3QgYWdlID0gK2UudGFyZ2V0LnZhbHVlXG4gICAgICAgIC8vIHRoaXMuc3RhdGUuc2V0KCdhZ2UnLCBhZ2UpXG4gICAgICAgIHRoaXMuZW1pdCgnY2hhbmdlYWdlJywge1xuICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgYWdlOiBhZ2VcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9KVxuXG4gICAgLy8gY29uc3Qgc3RvcmUgPSBuZXcgU3RvcmUoe1xuICAgIC8vICAgYWdlOiA0MlxuICAgIC8vIH0pXG5cbiAgICAvLyBzdG9yZS5vbigndXBkYXRlJywgKGN1cnJlbnRTdGF0ZSwgcHJldlN0YXRlKSA9PiB7XG4gICAgLy8gICB0aGlzLnJlbmRlcigpXG4gICAgLy8gfSlcblxuICAgIC8vIC8vIGZvciB0aGUgcHVycG9zZXMgb2YgdGhpcyBleGFtcGxlXG4gICAgLy8gLy8gYHN0YXRlYCBpcyBleHBvc2VkIGhlcmUgdG8gYWxsb3dcbiAgICAvLyAvLyBpdCB0byBiZSBtb2RpZmllZCBpbiB0aGUgYnJvd3NlcnMgY29uc29sZVxuICAgIC8vIC8vIC0geW91IGdlbmVyYWxseSB3b250IHdhbnQgdG8gZG8gdGhpcyB0aG91Z2hcbiAgICAvLyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ3N0YXRlJywge1xuICAgIC8vICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gICAgIHJldHVybiBzdG9yZS5nZXQoKVxuICAgIC8vICAgfVxuICAgIC8vIH0pXG5cbiAgICB0aGlzW1N5bWJvbHMuQ09OVFJPTExFUl0gPSBjb250cm9sbGVyXG4gIH1cblxuICBjb25uZWN0ZWRDYWxsYmFjayAoKSB7XG4gICAgdGhpcy5yZW5kZXIodHJ1ZSlcbiAgfVxuXG4gIHJlbmRlckNhbGxiYWNrICgpIHtcbiAgICBwYXRjaCh0aGlzLCAoKSA9PiB7XG4gICAgICB2aWV3LmNhbGwodGhpcywgdGhpcywgdGhpcy5zdGF0ZSwgdGhpc1tTeW1ib2xzLkNPTlRST0xMRVJdKVxuICAgIH0pXG4gIH1cbn1cblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZSgneC13aWRnZXQnLCBXaWRnZXQpXG5cbm1vZHVsZS5leHBvcnQgPSBXaWRnZXRcbiIsIm1vZHVsZS5leHBvcnRzPXtcbiAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gIFwicHJvcGVydGllc1wiOiB7XG4gICAgXCJzdHJcIjogeyBcInR5cGVcIjogXCJzdHJpbmdcIiwgXCJkZWZhdWx0XCI6IFwic29tZXRoaW5nXCIgfSxcbiAgICBcIm51bVwiOiB7IFwidHlwZVwiOiBcIm51bWJlclwiLCBcImRlZmF1bHRcIjogMSB9LFxuICAgIFwiaW50XCI6IHsgXCJ0eXBlXCI6IFwibnVtYmVyXCIsIFwiZm9ybWF0XCI6IFwiaW50ZWdlclwiIH0sXG4gICAgXCJhcnJcIjogeyBcInR5cGVcIjogXCJhcnJheVwiIH0sXG4gICAgXCJvcHRcIjogeyBcInR5cGVcIjogXCJzdHJpbmdcIiB9LFxuICAgIFwib2JqXCI6IHtcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgXCJhXCI6IHsgXCJ0eXBlXCI6IFwibnVtYmVyXCIsIFwiZm9ybWF0XCI6IFwiaW50ZWdlclwiIH0sXG4gICAgICAgIFwiYlwiOiB7IFwidHlwZVwiOiBcInN0cmluZ1wiIH1cbiAgICAgIH0sXG4gICAgICBcInJlcXVpcmVkXCI6IFsgXCJhXCIsIFwiYlwiIF1cbiAgICB9XG4gIH0sXG4gIFwicmVxdWlyZWRcIjogWyBcInN0clwiLCBcIm51bVwiLCBcImludFwiLCBcImFyclwiLCBcIm9ialwiIF1cbn1cbiIsImNvbnN0IEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJylcblxuSW5jcmVtZW50YWxET00uYXR0cmlidXRlcy5jaGVja2VkID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICBlbC5jaGVja2VkID0gISF2YWx1ZVxufVxuXG5JbmNyZW1lbnRhbERPTS5hdHRyaWJ1dGVzLnZhbHVlID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICBlbC52YWx1ZSA9IHZhbHVlID09PSBudWxsIHx8IHR5cGVvZiAodmFsdWUpID09PSAndW5kZWZpbmVkJyA/ICcnIDogdmFsdWVcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJbmNyZW1lbnRhbERPTVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsIi8qIVxuXG5Db3B5cmlnaHQgKEMpIDIwMTQtMjAxNiBieSBBbmRyZWEgR2lhbW1hcmNoaSAtIEBXZWJSZWZsZWN0aW9uXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS5cblxuKi9cbi8vIGdsb2JhbCB3aW5kb3cgT2JqZWN0XG4vLyBvcHRpb25hbCBwb2x5ZmlsbCBpbmZvXG4vLyAgICAnYXV0bycgdXNlZCBieSBkZWZhdWx0LCBldmVyeXRoaW5nIGlzIGZlYXR1cmUgZGV0ZWN0ZWRcbi8vICAgICdmb3JjZScgdXNlIHRoZSBwb2x5ZmlsbCBldmVuIGlmIG5vdCBmdWxseSBuZWVkZWRcbmZ1bmN0aW9uIGluc3RhbGxDdXN0b21FbGVtZW50cyh3aW5kb3csIHBvbHlmaWxsKSB7J3VzZSBzdHJpY3QnO1xuXG4gIC8vIERPIE5PVCBVU0UgVEhJUyBGSUxFIERJUkVDVExZLCBJVCBXT04nVCBXT1JLXG4gIC8vIFRISVMgSVMgQSBQUk9KRUNUIEJBU0VEIE9OIEEgQlVJTEQgU1lTVEVNXG4gIC8vIFRISVMgRklMRSBJUyBKVVNUIFdSQVBQRUQgVVAgUkVTVUxUSU5HIElOXG4gIC8vIGJ1aWxkL2RvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQubm9kZS5qc1xuXG4gIHZhclxuICAgIGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50LFxuICAgIE9iamVjdCA9IHdpbmRvdy5PYmplY3RcbiAgO1xuXG4gIHZhciBodG1sQ2xhc3MgPSAoZnVuY3Rpb24gKGluZm8pIHtcbiAgICAvLyAoQykgQW5kcmVhIEdpYW1tYXJjaGkgLSBAV2ViUmVmbGVjdGlvbiAtIE1JVCBTdHlsZVxuICAgIHZhclxuICAgICAgY2F0Y2hDbGFzcyA9IC9eW0EtWl0rW2Etel0vLFxuICAgICAgZmlsdGVyQnkgPSBmdW5jdGlvbiAocmUpIHtcbiAgICAgICAgdmFyIGFyciA9IFtdLCB0YWc7XG4gICAgICAgIGZvciAodGFnIGluIHJlZ2lzdGVyKSB7XG4gICAgICAgICAgaWYgKHJlLnRlc3QodGFnKSkgYXJyLnB1c2godGFnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXJyO1xuICAgICAgfSxcbiAgICAgIGFkZCA9IGZ1bmN0aW9uIChDbGFzcywgdGFnKSB7XG4gICAgICAgIHRhZyA9IHRhZy50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAoISh0YWcgaW4gcmVnaXN0ZXIpKSB7XG4gICAgICAgICAgcmVnaXN0ZXJbQ2xhc3NdID0gKHJlZ2lzdGVyW0NsYXNzXSB8fCBbXSkuY29uY2F0KHRhZyk7XG4gICAgICAgICAgcmVnaXN0ZXJbdGFnXSA9IChyZWdpc3Rlclt0YWcudG9VcHBlckNhc2UoKV0gPSBDbGFzcyk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICByZWdpc3RlciA9IChPYmplY3QuY3JlYXRlIHx8IE9iamVjdCkobnVsbCksXG4gICAgICBodG1sQ2xhc3MgPSB7fSxcbiAgICAgIGksIHNlY3Rpb24sIHRhZ3MsIENsYXNzXG4gICAgO1xuICAgIGZvciAoc2VjdGlvbiBpbiBpbmZvKSB7XG4gICAgICBmb3IgKENsYXNzIGluIGluZm9bc2VjdGlvbl0pIHtcbiAgICAgICAgdGFncyA9IGluZm9bc2VjdGlvbl1bQ2xhc3NdO1xuICAgICAgICByZWdpc3RlcltDbGFzc10gPSB0YWdzO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHJlZ2lzdGVyW3RhZ3NbaV0udG9Mb3dlckNhc2UoKV0gPVxuICAgICAgICAgIHJlZ2lzdGVyW3RhZ3NbaV0udG9VcHBlckNhc2UoKV0gPSBDbGFzcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBodG1sQ2xhc3MuZ2V0ID0gZnVuY3Rpb24gZ2V0KHRhZ09yQ2xhc3MpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgdGFnT3JDbGFzcyA9PT0gJ3N0cmluZycgP1xuICAgICAgICAocmVnaXN0ZXJbdGFnT3JDbGFzc10gfHwgKGNhdGNoQ2xhc3MudGVzdCh0YWdPckNsYXNzKSA/IFtdIDogJycpKSA6XG4gICAgICAgIGZpbHRlckJ5KHRhZ09yQ2xhc3MpO1xuICAgIH07XG4gICAgaHRtbENsYXNzLnNldCA9IGZ1bmN0aW9uIHNldCh0YWcsIENsYXNzKSB7XG4gICAgICByZXR1cm4gKGNhdGNoQ2xhc3MudGVzdCh0YWcpID9cbiAgICAgICAgYWRkKHRhZywgQ2xhc3MpIDpcbiAgICAgICAgYWRkKENsYXNzLCB0YWcpXG4gICAgICApLCBodG1sQ2xhc3M7XG4gICAgfTtcbiAgICByZXR1cm4gaHRtbENsYXNzO1xuICB9KHtcbiAgICBcImNvbGxlY3Rpb25zXCI6IHtcbiAgICAgIFwiSFRNTEFsbENvbGxlY3Rpb25cIjogW1xuICAgICAgICBcImFsbFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQ29sbGVjdGlvblwiOiBbXG4gICAgICAgIFwiZm9ybXNcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEZvcm1Db250cm9sc0NvbGxlY3Rpb25cIjogW1xuICAgICAgICBcImVsZW1lbnRzXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxPcHRpb25zQ29sbGVjdGlvblwiOiBbXG4gICAgICAgIFwib3B0aW9uc1wiXG4gICAgICBdXG4gICAgfSxcbiAgICBcImVsZW1lbnRzXCI6IHtcbiAgICAgIFwiRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZWxlbWVudFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQW5jaG9yRWxlbWVudFwiOiBbXG4gICAgICAgIFwiYVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQXBwbGV0RWxlbWVudFwiOiBbXG4gICAgICAgIFwiYXBwbGV0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxBcmVhRWxlbWVudFwiOiBbXG4gICAgICAgIFwiYXJlYVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQXR0YWNobWVudEVsZW1lbnRcIjogW1xuICAgICAgICBcImF0dGFjaG1lbnRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEF1ZGlvRWxlbWVudFwiOiBbXG4gICAgICAgIFwiYXVkaW9cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEJSRWxlbWVudFwiOiBbXG4gICAgICAgIFwiYnJcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEJhc2VFbGVtZW50XCI6IFtcbiAgICAgICAgXCJiYXNlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxCb2R5RWxlbWVudFwiOiBbXG4gICAgICAgIFwiYm9keVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQnV0dG9uRWxlbWVudFwiOiBbXG4gICAgICAgIFwiYnV0dG9uXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxDYW52YXNFbGVtZW50XCI6IFtcbiAgICAgICAgXCJjYW52YXNcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTENvbnRlbnRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJjb250ZW50XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxETGlzdEVsZW1lbnRcIjogW1xuICAgICAgICBcImRsXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxEYXRhRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZGF0YVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRGF0YUxpc3RFbGVtZW50XCI6IFtcbiAgICAgICAgXCJkYXRhbGlzdFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRGV0YWlsc0VsZW1lbnRcIjogW1xuICAgICAgICBcImRldGFpbHNcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTERpYWxvZ0VsZW1lbnRcIjogW1xuICAgICAgICBcImRpYWxvZ1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRGlyZWN0b3J5RWxlbWVudFwiOiBbXG4gICAgICAgIFwiZGlyXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxEaXZFbGVtZW50XCI6IFtcbiAgICAgICAgXCJkaXZcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTERvY3VtZW50XCI6IFtcbiAgICAgICAgXCJkb2N1bWVudFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZWxlbWVudFwiLFxuICAgICAgICBcImFiYnJcIixcbiAgICAgICAgXCJhZGRyZXNzXCIsXG4gICAgICAgIFwiYXJ0aWNsZVwiLFxuICAgICAgICBcImFzaWRlXCIsXG4gICAgICAgIFwiYlwiLFxuICAgICAgICBcImJkaVwiLFxuICAgICAgICBcImJkb1wiLFxuICAgICAgICBcImNpdGVcIixcbiAgICAgICAgXCJjb2RlXCIsXG4gICAgICAgIFwiY29tbWFuZFwiLFxuICAgICAgICBcImRkXCIsXG4gICAgICAgIFwiZGZuXCIsXG4gICAgICAgIFwiZHRcIixcbiAgICAgICAgXCJlbVwiLFxuICAgICAgICBcImZpZ2NhcHRpb25cIixcbiAgICAgICAgXCJmaWd1cmVcIixcbiAgICAgICAgXCJmb290ZXJcIixcbiAgICAgICAgXCJoZWFkZXJcIixcbiAgICAgICAgXCJpXCIsXG4gICAgICAgIFwia2JkXCIsXG4gICAgICAgIFwibWFya1wiLFxuICAgICAgICBcIm5hdlwiLFxuICAgICAgICBcIm5vc2NyaXB0XCIsXG4gICAgICAgIFwicnBcIixcbiAgICAgICAgXCJydFwiLFxuICAgICAgICBcInJ1YnlcIixcbiAgICAgICAgXCJzXCIsXG4gICAgICAgIFwic2FtcFwiLFxuICAgICAgICBcInNlY3Rpb25cIixcbiAgICAgICAgXCJzbWFsbFwiLFxuICAgICAgICBcInN0cm9uZ1wiLFxuICAgICAgICBcInN1YlwiLFxuICAgICAgICBcInN1bW1hcnlcIixcbiAgICAgICAgXCJzdXBcIixcbiAgICAgICAgXCJ1XCIsXG4gICAgICAgIFwidmFyXCIsXG4gICAgICAgIFwid2JyXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxFbWJlZEVsZW1lbnRcIjogW1xuICAgICAgICBcImVtYmVkXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxGaWVsZFNldEVsZW1lbnRcIjogW1xuICAgICAgICBcImZpZWxkc2V0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxGb250RWxlbWVudFwiOiBbXG4gICAgICAgIFwiZm9udFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRm9ybUVsZW1lbnRcIjogW1xuICAgICAgICBcImZvcm1cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEZyYW1lRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZnJhbWVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEZyYW1lU2V0RWxlbWVudFwiOiBbXG4gICAgICAgIFwiZnJhbWVzZXRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEhSRWxlbWVudFwiOiBbXG4gICAgICAgIFwiaHJcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEhlYWRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJoZWFkXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxIZWFkaW5nRWxlbWVudFwiOiBbXG4gICAgICAgIFwiaDFcIixcbiAgICAgICAgXCJoMlwiLFxuICAgICAgICBcImgzXCIsXG4gICAgICAgIFwiaDRcIixcbiAgICAgICAgXCJoNVwiLFxuICAgICAgICBcImg2XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxIdG1sRWxlbWVudFwiOiBbXG4gICAgICAgIFwiaHRtbFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MSUZyYW1lRWxlbWVudFwiOiBbXG4gICAgICAgIFwiaWZyYW1lXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxJbWFnZUVsZW1lbnRcIjogW1xuICAgICAgICBcImltZ1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MSW5wdXRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJpbnB1dFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MS2V5Z2VuRWxlbWVudFwiOiBbXG4gICAgICAgIFwia2V5Z2VuXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxMSUVsZW1lbnRcIjogW1xuICAgICAgICBcImxpXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxMYWJlbEVsZW1lbnRcIjogW1xuICAgICAgICBcImxhYmVsXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxMZWdlbmRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJsZWdlbmRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTExpbmtFbGVtZW50XCI6IFtcbiAgICAgICAgXCJsaW5rXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxNYXBFbGVtZW50XCI6IFtcbiAgICAgICAgXCJtYXBcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE1hcnF1ZWVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJtYXJxdWVlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxNZWRpYUVsZW1lbnRcIjogW1xuICAgICAgICBcIm1lZGlhXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxNZW51RWxlbWVudFwiOiBbXG4gICAgICAgIFwibWVudVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTWVudUl0ZW1FbGVtZW50XCI6IFtcbiAgICAgICAgXCJtZW51aXRlbVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTWV0YUVsZW1lbnRcIjogW1xuICAgICAgICBcIm1ldGFcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE1ldGVyRWxlbWVudFwiOiBbXG4gICAgICAgIFwibWV0ZXJcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE1vZEVsZW1lbnRcIjogW1xuICAgICAgICBcImRlbFwiLFxuICAgICAgICBcImluc1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MT0xpc3RFbGVtZW50XCI6IFtcbiAgICAgICAgXCJvbFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MT2JqZWN0RWxlbWVudFwiOiBbXG4gICAgICAgIFwib2JqZWN0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxPcHRHcm91cEVsZW1lbnRcIjogW1xuICAgICAgICBcIm9wdGdyb3VwXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxPcHRpb25FbGVtZW50XCI6IFtcbiAgICAgICAgXCJvcHRpb25cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE91dHB1dEVsZW1lbnRcIjogW1xuICAgICAgICBcIm91dHB1dFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MUGFyYWdyYXBoRWxlbWVudFwiOiBbXG4gICAgICAgIFwicFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MUGFyYW1FbGVtZW50XCI6IFtcbiAgICAgICAgXCJwYXJhbVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MUGljdHVyZUVsZW1lbnRcIjogW1xuICAgICAgICBcInBpY3R1cmVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFByZUVsZW1lbnRcIjogW1xuICAgICAgICBcInByZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MUHJvZ3Jlc3NFbGVtZW50XCI6IFtcbiAgICAgICAgXCJwcm9ncmVzc1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MUXVvdGVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJibG9ja3F1b3RlXCIsXG4gICAgICAgIFwicVwiLFxuICAgICAgICBcInF1b3RlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxTY3JpcHRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJzY3JpcHRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFNlbGVjdEVsZW1lbnRcIjogW1xuICAgICAgICBcInNlbGVjdFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MU2hhZG93RWxlbWVudFwiOiBbXG4gICAgICAgIFwic2hhZG93XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxTbG90RWxlbWVudFwiOiBbXG4gICAgICAgIFwic2xvdFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MU291cmNlRWxlbWVudFwiOiBbXG4gICAgICAgIFwic291cmNlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxTcGFuRWxlbWVudFwiOiBbXG4gICAgICAgIFwic3BhblwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MU3R5bGVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJzdHlsZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGFibGVDYXB0aW9uRWxlbWVudFwiOiBbXG4gICAgICAgIFwiY2FwdGlvblwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGFibGVDZWxsRWxlbWVudFwiOiBbXG4gICAgICAgIFwidGRcIixcbiAgICAgICAgXCJ0aFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGFibGVDb2xFbGVtZW50XCI6IFtcbiAgICAgICAgXCJjb2xcIixcbiAgICAgICAgXCJjb2xncm91cFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGFibGVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0YWJsZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGFibGVSb3dFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0clwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGFibGVTZWN0aW9uRWxlbWVudFwiOiBbXG4gICAgICAgIFwidGhlYWRcIixcbiAgICAgICAgXCJ0Ym9keVwiLFxuICAgICAgICBcInRmb290XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUZW1wbGF0ZUVsZW1lbnRcIjogW1xuICAgICAgICBcInRlbXBsYXRlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUZXh0QXJlYUVsZW1lbnRcIjogW1xuICAgICAgICBcInRleHRhcmVhXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUaW1lRWxlbWVudFwiOiBbXG4gICAgICAgIFwidGltZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGl0bGVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0aXRsZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVHJhY2tFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0cmFja1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVUxpc3RFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ1bFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVW5rbm93bkVsZW1lbnRcIjogW1xuICAgICAgICBcInVua25vd25cIixcbiAgICAgICAgXCJ2aGdyb3VwdlwiLFxuICAgICAgICBcInZrZXlnZW5cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFZpZGVvRWxlbWVudFwiOiBbXG4gICAgICAgIFwidmlkZW9cIlxuICAgICAgXVxuICAgIH0sXG4gICAgXCJub2Rlc1wiOiB7XG4gICAgICBcIkF0dHJcIjogW1xuICAgICAgICBcIm5vZGVcIlxuICAgICAgXSxcbiAgICAgIFwiQXVkaW9cIjogW1xuICAgICAgICBcImF1ZGlvXCJcbiAgICAgIF0sXG4gICAgICBcIkNEQVRBU2VjdGlvblwiOiBbXG4gICAgICAgIFwibm9kZVwiXG4gICAgICBdLFxuICAgICAgXCJDaGFyYWN0ZXJEYXRhXCI6IFtcbiAgICAgICAgXCJub2RlXCJcbiAgICAgIF0sXG4gICAgICBcIkNvbW1lbnRcIjogW1xuICAgICAgICBcIiNjb21tZW50XCJcbiAgICAgIF0sXG4gICAgICBcIkRvY3VtZW50XCI6IFtcbiAgICAgICAgXCIjZG9jdW1lbnRcIlxuICAgICAgXSxcbiAgICAgIFwiRG9jdW1lbnRGcmFnbWVudFwiOiBbXG4gICAgICAgIFwiI2RvY3VtZW50LWZyYWdtZW50XCJcbiAgICAgIF0sXG4gICAgICBcIkRvY3VtZW50VHlwZVwiOiBbXG4gICAgICAgIFwibm9kZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRG9jdW1lbnRcIjogW1xuICAgICAgICBcIiNkb2N1bWVudFwiXG4gICAgICBdLFxuICAgICAgXCJJbWFnZVwiOiBbXG4gICAgICAgIFwiaW1nXCJcbiAgICAgIF0sXG4gICAgICBcIk9wdGlvblwiOiBbXG4gICAgICAgIFwib3B0aW9uXCJcbiAgICAgIF0sXG4gICAgICBcIlByb2Nlc3NpbmdJbnN0cnVjdGlvblwiOiBbXG4gICAgICAgIFwibm9kZVwiXG4gICAgICBdLFxuICAgICAgXCJTaGFkb3dSb290XCI6IFtcbiAgICAgICAgXCIjc2hhZG93LXJvb3RcIlxuICAgICAgXSxcbiAgICAgIFwiVGV4dFwiOiBbXG4gICAgICAgIFwiI3RleHRcIlxuICAgICAgXSxcbiAgICAgIFwiWE1MRG9jdW1lbnRcIjogW1xuICAgICAgICBcInhtbFwiXG4gICAgICBdXG4gICAgfVxuICB9KSk7XG4gIFxuICBcbiAgICBcbiAgLy8gcGFzc2VkIGF0IHJ1bnRpbWUsIGNvbmZpZ3VyYWJsZVxuICAvLyB2aWEgbm9kZWpzIG1vZHVsZVxuICBpZiAoIXBvbHlmaWxsKSBwb2x5ZmlsbCA9ICdhdXRvJztcbiAgXG4gIHZhclxuICAgIC8vIFYwIHBvbHlmaWxsIGVudHJ5XG4gICAgUkVHSVNURVJfRUxFTUVOVCA9ICdyZWdpc3RlckVsZW1lbnQnLFxuICBcbiAgICAvLyBJRSA8IDExIG9ubHkgKyBvbGQgV2ViS2l0IGZvciBhdHRyaWJ1dGVzICsgZmVhdHVyZSBkZXRlY3Rpb25cbiAgICBFWFBBTkRPX1VJRCA9ICdfXycgKyBSRUdJU1RFUl9FTEVNRU5UICsgKHdpbmRvdy5NYXRoLnJhbmRvbSgpICogMTBlNCA+PiAwKSxcbiAgXG4gICAgLy8gc2hvcnRjdXRzIGFuZCBjb3N0YW50c1xuICAgIEFERF9FVkVOVF9MSVNURU5FUiA9ICdhZGRFdmVudExpc3RlbmVyJyxcbiAgICBBVFRBQ0hFRCA9ICdhdHRhY2hlZCcsXG4gICAgQ0FMTEJBQ0sgPSAnQ2FsbGJhY2snLFxuICAgIERFVEFDSEVEID0gJ2RldGFjaGVkJyxcbiAgICBFWFRFTkRTID0gJ2V4dGVuZHMnLFxuICBcbiAgICBBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDSyA9ICdhdHRyaWJ1dGVDaGFuZ2VkJyArIENBTExCQUNLLFxuICAgIEFUVEFDSEVEX0NBTExCQUNLID0gQVRUQUNIRUQgKyBDQUxMQkFDSyxcbiAgICBDT05ORUNURURfQ0FMTEJBQ0sgPSAnY29ubmVjdGVkJyArIENBTExCQUNLLFxuICAgIERJU0NPTk5FQ1RFRF9DQUxMQkFDSyA9ICdkaXNjb25uZWN0ZWQnICsgQ0FMTEJBQ0ssXG4gICAgQ1JFQVRFRF9DQUxMQkFDSyA9ICdjcmVhdGVkJyArIENBTExCQUNLLFxuICAgIERFVEFDSEVEX0NBTExCQUNLID0gREVUQUNIRUQgKyBDQUxMQkFDSyxcbiAgXG4gICAgQURESVRJT04gPSAnQURESVRJT04nLFxuICAgIE1PRElGSUNBVElPTiA9ICdNT0RJRklDQVRJT04nLFxuICAgIFJFTU9WQUwgPSAnUkVNT1ZBTCcsXG4gIFxuICAgIERPTV9BVFRSX01PRElGSUVEID0gJ0RPTUF0dHJNb2RpZmllZCcsXG4gICAgRE9NX0NPTlRFTlRfTE9BREVEID0gJ0RPTUNvbnRlbnRMb2FkZWQnLFxuICAgIERPTV9TVUJUUkVFX01PRElGSUVEID0gJ0RPTVN1YnRyZWVNb2RpZmllZCcsXG4gIFxuICAgIFBSRUZJWF9UQUcgPSAnPCcsXG4gICAgUFJFRklYX0lTID0gJz0nLFxuICBcbiAgICAvLyB2YWxpZCBhbmQgaW52YWxpZCBub2RlIG5hbWVzXG4gICAgdmFsaWROYW1lID0gL15bQS1aXVtBLVowLTldKig/Oi1bQS1aMC05XSspKyQvLFxuICAgIGludmFsaWROYW1lcyA9IFtcbiAgICAgICdBTk5PVEFUSU9OLVhNTCcsXG4gICAgICAnQ09MT1ItUFJPRklMRScsXG4gICAgICAnRk9OVC1GQUNFJyxcbiAgICAgICdGT05ULUZBQ0UtU1JDJyxcbiAgICAgICdGT05ULUZBQ0UtVVJJJyxcbiAgICAgICdGT05ULUZBQ0UtRk9STUFUJyxcbiAgICAgICdGT05ULUZBQ0UtTkFNRScsXG4gICAgICAnTUlTU0lORy1HTFlQSCdcbiAgICBdLFxuICBcbiAgICAvLyByZWdpc3RlcmVkIHR5cGVzIGFuZCB0aGVpciBwcm90b3R5cGVzXG4gICAgdHlwZXMgPSBbXSxcbiAgICBwcm90b3MgPSBbXSxcbiAgXG4gICAgLy8gdG8gcXVlcnkgc3Vibm9kZXNcbiAgICBxdWVyeSA9ICcnLFxuICBcbiAgICAvLyBodG1sIHNob3J0Y3V0IHVzZWQgdG8gZmVhdHVyZSBkZXRlY3RcbiAgICBkb2N1bWVudEVsZW1lbnQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXG4gIFxuICAgIC8vIEVTNSBpbmxpbmUgaGVscGVycyB8fCBiYXNpYyBwYXRjaGVzXG4gICAgaW5kZXhPZiA9IHR5cGVzLmluZGV4T2YgfHwgZnVuY3Rpb24gKHYpIHtcbiAgICAgIGZvcih2YXIgaSA9IHRoaXMubGVuZ3RoOyBpLS0gJiYgdGhpc1tpXSAhPT0gdjspe31cbiAgICAgIHJldHVybiBpO1xuICAgIH0sXG4gIFxuICAgIC8vIG90aGVyIGhlbHBlcnMgLyBzaG9ydGN1dHNcbiAgICBPUCA9IE9iamVjdC5wcm90b3R5cGUsXG4gICAgaE9QID0gT1AuaGFzT3duUHJvcGVydHksXG4gICAgaVBPID0gT1AuaXNQcm90b3R5cGVPZixcbiAgXG4gICAgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHksXG4gICAgZW1wdHkgPSBbXSxcbiAgICBnT1BEID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgICBnT1BOID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMsXG4gICAgZ1BPID0gT2JqZWN0LmdldFByb3RvdHlwZU9mLFxuICAgIHNQTyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZixcbiAgXG4gICAgLy8ganNoaW50IHByb3RvOiB0cnVlXG4gICAgaGFzUHJvdG8gPSAhIU9iamVjdC5fX3Byb3RvX18sXG4gIFxuICAgIC8vIFYxIGhlbHBlcnNcbiAgICBmaXhHZXRDbGFzcyA9IGZhbHNlLFxuICAgIERSRUNFVjEgPSAnX19kcmVDRXYxJyxcbiAgICBjdXN0b21FbGVtZW50cyA9IHdpbmRvdy5jdXN0b21FbGVtZW50cyxcbiAgICB1c2FibGVDdXN0b21FbGVtZW50cyA9IHBvbHlmaWxsICE9PSAnZm9yY2UnICYmICEhKFxuICAgICAgY3VzdG9tRWxlbWVudHMgJiZcbiAgICAgIGN1c3RvbUVsZW1lbnRzLmRlZmluZSAmJlxuICAgICAgY3VzdG9tRWxlbWVudHMuZ2V0ICYmXG4gICAgICBjdXN0b21FbGVtZW50cy53aGVuRGVmaW5lZFxuICAgICksXG4gICAgRGljdCA9IE9iamVjdC5jcmVhdGUgfHwgT2JqZWN0LFxuICAgIE1hcCA9IHdpbmRvdy5NYXAgfHwgZnVuY3Rpb24gTWFwKCkge1xuICAgICAgdmFyIEsgPSBbXSwgViA9IFtdLCBpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgIHJldHVybiBWW2luZGV4T2YuY2FsbChLLCBrKV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGssIHYpIHtcbiAgICAgICAgICBpID0gaW5kZXhPZi5jYWxsKEssIGspO1xuICAgICAgICAgIGlmIChpIDwgMCkgVltLLnB1c2goaykgLSAxXSA9IHY7XG4gICAgICAgICAgZWxzZSBWW2ldID0gdjtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuICAgIFByb21pc2UgPSB3aW5kb3cuUHJvbWlzZSB8fCBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIHZhclxuICAgICAgICBub3RpZnkgPSBbXSxcbiAgICAgICAgZG9uZSA9IGZhbHNlLFxuICAgICAgICBwID0ge1xuICAgICAgICAgICdjYXRjaCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgJ3RoZW4nOiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgIG5vdGlmeS5wdXNoKGNiKTtcbiAgICAgICAgICAgIGlmIChkb25lKSBzZXRUaW1lb3V0KHJlc29sdmUsIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICA7XG4gICAgICBmdW5jdGlvbiByZXNvbHZlKHZhbHVlKSB7XG4gICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICB3aGlsZSAobm90aWZ5Lmxlbmd0aCkgbm90aWZ5LnNoaWZ0KCkodmFsdWUpO1xuICAgICAgfVxuICAgICAgZm4ocmVzb2x2ZSk7XG4gICAgICByZXR1cm4gcDtcbiAgICB9LFxuICAgIGp1c3RDcmVhdGVkID0gZmFsc2UsXG4gICAgY29uc3RydWN0b3JzID0gRGljdChudWxsKSxcbiAgICB3YWl0aW5nTGlzdCA9IERpY3QobnVsbCksXG4gICAgbm9kZU5hbWVzID0gbmV3IE1hcCgpLFxuICAgIHNlY29uZEFyZ3VtZW50ID0gZnVuY3Rpb24gKGlzKSB7XG4gICAgICByZXR1cm4gaXMudG9Mb3dlckNhc2UoKTtcbiAgICB9LFxuICBcbiAgICAvLyB1c2VkIHRvIGNyZWF0ZSB1bmlxdWUgaW5zdGFuY2VzXG4gICAgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiBCcmlkZ2UocHJvdG8pIHtcbiAgICAgIC8vIHNpbGx5IGJyb2tlbiBwb2x5ZmlsbCBwcm9iYWJseSBldmVyIHVzZWQgYnV0IHNob3J0IGVub3VnaCB0byB3b3JrXG4gICAgICByZXR1cm4gcHJvdG8gPyAoKEJyaWRnZS5wcm90b3R5cGUgPSBwcm90byksIG5ldyBCcmlkZ2UoKSkgOiB0aGlzO1xuICAgIH0sXG4gIFxuICAgIC8vIHdpbGwgc2V0IHRoZSBwcm90b3R5cGUgaWYgcG9zc2libGVcbiAgICAvLyBvciBjb3B5IG92ZXIgYWxsIHByb3BlcnRpZXNcbiAgICBzZXRQcm90b3R5cGUgPSBzUE8gfHwgKFxuICAgICAgaGFzUHJvdG8gP1xuICAgICAgICBmdW5jdGlvbiAobywgcCkge1xuICAgICAgICAgIG8uX19wcm90b19fID0gcDtcbiAgICAgICAgICByZXR1cm4gbztcbiAgICAgICAgfSA6IChcbiAgICAgIChnT1BOICYmIGdPUEQpID9cbiAgICAgICAgKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgZnVuY3Rpb24gc2V0UHJvcGVydGllcyhvLCBwKSB7XG4gICAgICAgICAgICBmb3IgKHZhclxuICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgIG5hbWVzID0gZ09QTihwKSxcbiAgICAgICAgICAgICAgaSA9IDAsIGxlbmd0aCA9IG5hbWVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgaSA8IGxlbmd0aDsgaSsrXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAga2V5ID0gbmFtZXNbaV07XG4gICAgICAgICAgICAgIGlmICghaE9QLmNhbGwobywga2V5KSkge1xuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5KG8sIGtleSwgZ09QRChwLCBrZXkpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG8sIHApIHtcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgc2V0UHJvcGVydGllcyhvLCBwKTtcbiAgICAgICAgICAgIH0gd2hpbGUgKChwID0gZ1BPKHApKSAmJiAhaVBPLmNhbGwocCwgbykpO1xuICAgICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgICAgfTtcbiAgICAgICAgfSgpKSA6XG4gICAgICAgIGZ1bmN0aW9uIChvLCBwKSB7XG4gICAgICAgICAgZm9yICh2YXIga2V5IGluIHApIHtcbiAgICAgICAgICAgIG9ba2V5XSA9IHBba2V5XTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgIH1cbiAgICApKSxcbiAgXG4gICAgLy8gRE9NIHNob3J0Y3V0cyBhbmQgaGVscGVycywgaWYgYW55XG4gIFxuICAgIE11dGF0aW9uT2JzZXJ2ZXIgPSB3aW5kb3cuTXV0YXRpb25PYnNlcnZlciB8fFxuICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuV2ViS2l0TXV0YXRpb25PYnNlcnZlcixcbiAgXG4gICAgSFRNTEVsZW1lbnRQcm90b3R5cGUgPSAoXG4gICAgICB3aW5kb3cuSFRNTEVsZW1lbnQgfHxcbiAgICAgIHdpbmRvdy5FbGVtZW50IHx8XG4gICAgICB3aW5kb3cuTm9kZVxuICAgICkucHJvdG90eXBlLFxuICBcbiAgICBJRTggPSAhaVBPLmNhbGwoSFRNTEVsZW1lbnRQcm90b3R5cGUsIGRvY3VtZW50RWxlbWVudCksXG4gIFxuICAgIHNhZmVQcm9wZXJ0eSA9IElFOCA/IGZ1bmN0aW9uIChvLCBrLCBkKSB7XG4gICAgICBvW2tdID0gZC52YWx1ZTtcbiAgICAgIHJldHVybiBvO1xuICAgIH0gOiBkZWZpbmVQcm9wZXJ0eSxcbiAgXG4gICAgaXNWYWxpZE5vZGUgPSBJRTggP1xuICAgICAgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDE7XG4gICAgICB9IDpcbiAgICAgIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHJldHVybiBpUE8uY2FsbChIVE1MRWxlbWVudFByb3RvdHlwZSwgbm9kZSk7XG4gICAgICB9LFxuICBcbiAgICB0YXJnZXRzID0gSUU4ICYmIFtdLFxuICBcbiAgICBhdHRhY2hTaGFkb3cgPSBIVE1MRWxlbWVudFByb3RvdHlwZS5hdHRhY2hTaGFkb3csXG4gICAgY2xvbmVOb2RlID0gSFRNTEVsZW1lbnRQcm90b3R5cGUuY2xvbmVOb2RlLFxuICAgIGRpc3BhdGNoRXZlbnQgPSBIVE1MRWxlbWVudFByb3RvdHlwZS5kaXNwYXRjaEV2ZW50LFxuICAgIGdldEF0dHJpYnV0ZSA9IEhUTUxFbGVtZW50UHJvdG90eXBlLmdldEF0dHJpYnV0ZSxcbiAgICBoYXNBdHRyaWJ1dGUgPSBIVE1MRWxlbWVudFByb3RvdHlwZS5oYXNBdHRyaWJ1dGUsXG4gICAgcmVtb3ZlQXR0cmlidXRlID0gSFRNTEVsZW1lbnRQcm90b3R5cGUucmVtb3ZlQXR0cmlidXRlLFxuICAgIHNldEF0dHJpYnV0ZSA9IEhUTUxFbGVtZW50UHJvdG90eXBlLnNldEF0dHJpYnV0ZSxcbiAgXG4gICAgLy8gcmVwbGFjZWQgbGF0ZXIgb25cbiAgICBjcmVhdGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCxcbiAgICBwYXRjaGVkQ3JlYXRlRWxlbWVudCA9IGNyZWF0ZUVsZW1lbnQsXG4gIFxuICAgIC8vIHNoYXJlZCBvYnNlcnZlciBmb3IgYWxsIGF0dHJpYnV0ZXNcbiAgICBhdHRyaWJ1dGVzT2JzZXJ2ZXIgPSBNdXRhdGlvbk9ic2VydmVyICYmIHtcbiAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IHRydWVcbiAgICB9LFxuICBcbiAgICAvLyB1c2VmdWwgdG8gZGV0ZWN0IG9ubHkgaWYgdGhlcmUncyBubyBNdXRhdGlvbk9ic2VydmVyXG4gICAgRE9NQXR0ck1vZGlmaWVkID0gTXV0YXRpb25PYnNlcnZlciB8fCBmdW5jdGlvbihlKSB7XG4gICAgICBkb2VzTm90U3VwcG9ydERPTUF0dHJNb2RpZmllZCA9IGZhbHNlO1xuICAgICAgZG9jdW1lbnRFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgICAgIERPTV9BVFRSX01PRElGSUVELFxuICAgICAgICBET01BdHRyTW9kaWZpZWRcbiAgICAgICk7XG4gICAgfSxcbiAgXG4gICAgLy8gd2lsbCBib3RoIGJlIHVzZWQgdG8gbWFrZSBET01Ob2RlSW5zZXJ0ZWQgYXN5bmNocm9ub3VzXG4gICAgYXNhcFF1ZXVlLFxuICAgIGFzYXBUaW1lciA9IDAsXG4gIFxuICAgIC8vIGludGVybmFsIGZsYWdzXG4gICAgVjAgPSBSRUdJU1RFUl9FTEVNRU5UIGluIGRvY3VtZW50LFxuICAgIHNldExpc3RlbmVyID0gdHJ1ZSxcbiAgICBqdXN0U2V0dXAgPSBmYWxzZSxcbiAgICBkb2VzTm90U3VwcG9ydERPTUF0dHJNb2RpZmllZCA9IHRydWUsXG4gICAgZHJvcERvbUNvbnRlbnRMb2FkZWQgPSB0cnVlLFxuICBcbiAgICAvLyBuZWVkZWQgZm9yIHRoZSBpbm5lckhUTUwgaGVscGVyXG4gICAgbm90RnJvbUlubmVySFRNTEhlbHBlciA9IHRydWUsXG4gIFxuICAgIC8vIG9wdGlvbmFsbHkgZGVmaW5lZCBsYXRlciBvblxuICAgIG9uU3VidHJlZU1vZGlmaWVkLFxuICAgIGNhbGxET01BdHRyTW9kaWZpZWQsXG4gICAgZ2V0QXR0cmlidXRlc01pcnJvcixcbiAgICBvYnNlcnZlcixcbiAgICBvYnNlcnZlLFxuICBcbiAgICAvLyBiYXNlZCBvbiBzZXR0aW5nIHByb3RvdHlwZSBjYXBhYmlsaXR5XG4gICAgLy8gd2lsbCBjaGVjayBwcm90byBvciB0aGUgZXhwYW5kbyBhdHRyaWJ1dGVcbiAgICAvLyBpbiBvcmRlciB0byBzZXR1cCB0aGUgbm9kZSBvbmNlXG4gICAgcGF0Y2hJZk5vdEFscmVhZHksXG4gICAgcGF0Y2hcbiAgO1xuICBcbiAgLy8gb25seSBpZiBuZWVkZWRcbiAgaWYgKCFWMCkge1xuICBcbiAgICBpZiAoc1BPIHx8IGhhc1Byb3RvKSB7XG4gICAgICAgIHBhdGNoSWZOb3RBbHJlYWR5ID0gZnVuY3Rpb24gKG5vZGUsIHByb3RvKSB7XG4gICAgICAgICAgaWYgKCFpUE8uY2FsbChwcm90bywgbm9kZSkpIHtcbiAgICAgICAgICAgIHNldHVwTm9kZShub2RlLCBwcm90byk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBwYXRjaCA9IHNldHVwTm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXRjaElmTm90QWxyZWFkeSA9IGZ1bmN0aW9uIChub2RlLCBwcm90bykge1xuICAgICAgICAgIGlmICghbm9kZVtFWFBBTkRPX1VJRF0pIHtcbiAgICAgICAgICAgIG5vZGVbRVhQQU5ET19VSURdID0gT2JqZWN0KHRydWUpO1xuICAgICAgICAgICAgc2V0dXBOb2RlKG5vZGUsIHByb3RvKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHBhdGNoID0gcGF0Y2hJZk5vdEFscmVhZHk7XG4gICAgfVxuICBcbiAgICBpZiAoSUU4KSB7XG4gICAgICBkb2VzTm90U3VwcG9ydERPTUF0dHJNb2RpZmllZCA9IGZhbHNlO1xuICAgICAgKGZ1bmN0aW9uICgpe1xuICAgICAgICB2YXJcbiAgICAgICAgICBkZXNjcmlwdG9yID0gZ09QRChIVE1MRWxlbWVudFByb3RvdHlwZSwgQUREX0VWRU5UX0xJU1RFTkVSKSxcbiAgICAgICAgICBhZGRFdmVudExpc3RlbmVyID0gZGVzY3JpcHRvci52YWx1ZSxcbiAgICAgICAgICBwYXRjaGVkUmVtb3ZlQXR0cmlidXRlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHZhciBlID0gbmV3IEN1c3RvbUV2ZW50KERPTV9BVFRSX01PRElGSUVELCB7YnViYmxlczogdHJ1ZX0pO1xuICAgICAgICAgICAgZS5hdHRyTmFtZSA9IG5hbWU7XG4gICAgICAgICAgICBlLnByZXZWYWx1ZSA9IGdldEF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUpO1xuICAgICAgICAgICAgZS5uZXdWYWx1ZSA9IG51bGw7XG4gICAgICAgICAgICBlW1JFTU9WQUxdID0gZS5hdHRyQ2hhbmdlID0gMjtcbiAgICAgICAgICAgIHJlbW92ZUF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUpO1xuICAgICAgICAgICAgZGlzcGF0Y2hFdmVudC5jYWxsKHRoaXMsIGUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcGF0Y2hlZFNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgIGhhZCA9IGhhc0F0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUpLFxuICAgICAgICAgICAgICBvbGQgPSBoYWQgJiYgZ2V0QXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSksXG4gICAgICAgICAgICAgIGUgPSBuZXcgQ3VzdG9tRXZlbnQoRE9NX0FUVFJfTU9ESUZJRUQsIHtidWJibGVzOiB0cnVlfSlcbiAgICAgICAgICAgIDtcbiAgICAgICAgICAgIHNldEF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICAgIGUuYXR0ck5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgZS5wcmV2VmFsdWUgPSBoYWQgPyBvbGQgOiBudWxsO1xuICAgICAgICAgICAgZS5uZXdWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgaWYgKGhhZCkge1xuICAgICAgICAgICAgICBlW01PRElGSUNBVElPTl0gPSBlLmF0dHJDaGFuZ2UgPSAxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZVtBRERJVElPTl0gPSBlLmF0dHJDaGFuZ2UgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlzcGF0Y2hFdmVudC5jYWxsKHRoaXMsIGUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Qcm9wZXJ0eUNoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyBqc2hpbnQgZXFudWxsOnRydWVcbiAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICBub2RlID0gZS5jdXJyZW50VGFyZ2V0LFxuICAgICAgICAgICAgICBzdXBlclNlY3JldCA9IG5vZGVbRVhQQU5ET19VSURdLFxuICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBlLnByb3BlcnR5TmFtZSxcbiAgICAgICAgICAgICAgZXZlbnRcbiAgICAgICAgICAgIDtcbiAgICAgICAgICAgIGlmIChzdXBlclNlY3JldC5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eU5hbWUpKSB7XG4gICAgICAgICAgICAgIHN1cGVyU2VjcmV0ID0gc3VwZXJTZWNyZXRbcHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgICAgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoRE9NX0FUVFJfTU9ESUZJRUQsIHtidWJibGVzOiB0cnVlfSk7XG4gICAgICAgICAgICAgIGV2ZW50LmF0dHJOYW1lID0gc3VwZXJTZWNyZXQubmFtZTtcbiAgICAgICAgICAgICAgZXZlbnQucHJldlZhbHVlID0gc3VwZXJTZWNyZXQudmFsdWUgfHwgbnVsbDtcbiAgICAgICAgICAgICAgZXZlbnQubmV3VmFsdWUgPSAoc3VwZXJTZWNyZXQudmFsdWUgPSBub2RlW3Byb3BlcnR5TmFtZV0gfHwgbnVsbCk7XG4gICAgICAgICAgICAgIGlmIChldmVudC5wcmV2VmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGV2ZW50W0FERElUSU9OXSA9IGV2ZW50LmF0dHJDaGFuZ2UgPSAwO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV2ZW50W01PRElGSUNBVElPTl0gPSBldmVudC5hdHRyQ2hhbmdlID0gMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBkaXNwYXRjaEV2ZW50LmNhbGwobm9kZSwgZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgO1xuICAgICAgICBkZXNjcmlwdG9yLnZhbHVlID0gZnVuY3Rpb24gKHR5cGUsIGhhbmRsZXIsIGNhcHR1cmUpIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlID09PSBET01fQVRUUl9NT0RJRklFRCAmJlxuICAgICAgICAgICAgdGhpc1tBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDS10gJiZcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlICE9PSBwYXRjaGVkU2V0QXR0cmlidXRlXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzW0VYUEFORE9fVUlEXSA9IHtcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2NsYXNzJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5jbGFzc05hbWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlID0gcGF0Y2hlZFNldEF0dHJpYnV0ZTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlID0gcGF0Y2hlZFJlbW92ZUF0dHJpYnV0ZTtcbiAgICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXIuY2FsbCh0aGlzLCAncHJvcGVydHljaGFuZ2UnLCBvblByb3BlcnR5Q2hhbmdlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYWRkRXZlbnRMaXN0ZW5lci5jYWxsKHRoaXMsIHR5cGUsIGhhbmRsZXIsIGNhcHR1cmUpO1xuICAgICAgICB9O1xuICAgICAgICBkZWZpbmVQcm9wZXJ0eShIVE1MRWxlbWVudFByb3RvdHlwZSwgQUREX0VWRU5UX0xJU1RFTkVSLCBkZXNjcmlwdG9yKTtcbiAgICAgIH0oKSk7XG4gICAgfSBlbHNlIGlmICghTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgZG9jdW1lbnRFbGVtZW50W0FERF9FVkVOVF9MSVNURU5FUl0oRE9NX0FUVFJfTU9ESUZJRUQsIERPTUF0dHJNb2RpZmllZCk7XG4gICAgICBkb2N1bWVudEVsZW1lbnQuc2V0QXR0cmlidXRlKEVYUEFORE9fVUlELCAxKTtcbiAgICAgIGRvY3VtZW50RWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoRVhQQU5ET19VSUQpO1xuICAgICAgaWYgKGRvZXNOb3RTdXBwb3J0RE9NQXR0ck1vZGlmaWVkKSB7XG4gICAgICAgIG9uU3VidHJlZU1vZGlmaWVkID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXJcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLFxuICAgICAgICAgICAgb2xkQXR0cmlidXRlcyxcbiAgICAgICAgICAgIG5ld0F0dHJpYnV0ZXMsXG4gICAgICAgICAgICBrZXlcbiAgICAgICAgICA7XG4gICAgICAgICAgaWYgKG5vZGUgPT09IGUudGFyZ2V0KSB7XG4gICAgICAgICAgICBvbGRBdHRyaWJ1dGVzID0gbm9kZVtFWFBBTkRPX1VJRF07XG4gICAgICAgICAgICBub2RlW0VYUEFORE9fVUlEXSA9IChuZXdBdHRyaWJ1dGVzID0gZ2V0QXR0cmlidXRlc01pcnJvcihub2RlKSk7XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBuZXdBdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICAgIGlmICghKGtleSBpbiBvbGRBdHRyaWJ1dGVzKSkge1xuICAgICAgICAgICAgICAgIC8vIGF0dHJpYnV0ZSB3YXMgYWRkZWRcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbERPTUF0dHJNb2RpZmllZChcbiAgICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgb2xkQXR0cmlidXRlc1trZXldLFxuICAgICAgICAgICAgICAgICAgbmV3QXR0cmlidXRlc1trZXldLFxuICAgICAgICAgICAgICAgICAgQURESVRJT05cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKG5ld0F0dHJpYnV0ZXNba2V5XSAhPT0gb2xkQXR0cmlidXRlc1trZXldKSB7XG4gICAgICAgICAgICAgICAgLy8gYXR0cmlidXRlIHdhcyBjaGFuZ2VkXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxET01BdHRyTW9kaWZpZWQoXG4gICAgICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgICAgIG9sZEF0dHJpYnV0ZXNba2V5XSxcbiAgICAgICAgICAgICAgICAgIG5ld0F0dHJpYnV0ZXNba2V5XSxcbiAgICAgICAgICAgICAgICAgIE1PRElGSUNBVElPTlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNoZWNraW5nIGlmIGl0IGhhcyBiZWVuIHJlbW92ZWRcbiAgICAgICAgICAgIGZvciAoa2V5IGluIG9sZEF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIG5ld0F0dHJpYnV0ZXMpKSB7XG4gICAgICAgICAgICAgICAgLy8gYXR0cmlidXRlIHJlbW92ZWRcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbERPTUF0dHJNb2RpZmllZChcbiAgICAgICAgICAgICAgICAgIDIsXG4gICAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgb2xkQXR0cmlidXRlc1trZXldLFxuICAgICAgICAgICAgICAgICAgbmV3QXR0cmlidXRlc1trZXldLFxuICAgICAgICAgICAgICAgICAgUkVNT1ZBTFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNhbGxET01BdHRyTW9kaWZpZWQgPSBmdW5jdGlvbiAoXG4gICAgICAgICAgYXR0ckNoYW5nZSxcbiAgICAgICAgICBjdXJyZW50VGFyZ2V0LFxuICAgICAgICAgIGF0dHJOYW1lLFxuICAgICAgICAgIHByZXZWYWx1ZSxcbiAgICAgICAgICBuZXdWYWx1ZSxcbiAgICAgICAgICBhY3Rpb25cbiAgICAgICAgKSB7XG4gICAgICAgICAgdmFyIGUgPSB7XG4gICAgICAgICAgICBhdHRyQ2hhbmdlOiBhdHRyQ2hhbmdlLFxuICAgICAgICAgICAgY3VycmVudFRhcmdldDogY3VycmVudFRhcmdldCxcbiAgICAgICAgICAgIGF0dHJOYW1lOiBhdHRyTmFtZSxcbiAgICAgICAgICAgIHByZXZWYWx1ZTogcHJldlZhbHVlLFxuICAgICAgICAgICAgbmV3VmFsdWU6IG5ld1ZhbHVlXG4gICAgICAgICAgfTtcbiAgICAgICAgICBlW2FjdGlvbl0gPSBhdHRyQ2hhbmdlO1xuICAgICAgICAgIG9uRE9NQXR0ck1vZGlmaWVkKGUpO1xuICAgICAgICB9O1xuICAgICAgICBnZXRBdHRyaWJ1dGVzTWlycm9yID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICBmb3IgKHZhclxuICAgICAgICAgICAgYXR0ciwgbmFtZSxcbiAgICAgICAgICAgIHJlc3VsdCA9IHt9LFxuICAgICAgICAgICAgYXR0cmlidXRlcyA9IG5vZGUuYXR0cmlidXRlcyxcbiAgICAgICAgICAgIGkgPSAwLCBsZW5ndGggPSBhdHRyaWJ1dGVzLmxlbmd0aDtcbiAgICAgICAgICAgIGkgPCBsZW5ndGg7IGkrK1xuICAgICAgICAgICkge1xuICAgICAgICAgICAgYXR0ciA9IGF0dHJpYnV0ZXNbaV07XG4gICAgICAgICAgICBuYW1lID0gYXR0ci5uYW1lO1xuICAgICAgICAgICAgaWYgKG5hbWUgIT09ICdzZXRBdHRyaWJ1dGUnKSB7XG4gICAgICAgICAgICAgIHJlc3VsdFtuYW1lXSA9IGF0dHIudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICBcbiAgICAvLyBzZXQgYXMgZW51bWVyYWJsZSwgd3JpdGFibGUgYW5kIGNvbmZpZ3VyYWJsZVxuICAgIGRvY3VtZW50W1JFR0lTVEVSX0VMRU1FTlRdID0gZnVuY3Rpb24gcmVnaXN0ZXJFbGVtZW50KHR5cGUsIG9wdGlvbnMpIHtcbiAgICAgIHVwcGVyVHlwZSA9IHR5cGUudG9VcHBlckNhc2UoKTtcbiAgICAgIGlmIChzZXRMaXN0ZW5lcikge1xuICAgICAgICAvLyBvbmx5IGZpcnN0IHRpbWUgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50IGlzIHVzZWRcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzZXQgdGhpcyBsaXN0ZW5lclxuICAgICAgICAvLyBzZXR0aW5nIGl0IGJ5IGRlZmF1bHQgbWlnaHQgc2xvdyBkb3duIGZvciBubyByZWFzb25cbiAgICAgICAgc2V0TGlzdGVuZXIgPSBmYWxzZTtcbiAgICAgICAgaWYgKE11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICAgICAgICBvYnNlcnZlciA9IChmdW5jdGlvbihhdHRhY2hlZCwgZGV0YWNoZWQpe1xuICAgICAgICAgICAgZnVuY3Rpb24gY2hlY2tFbUFsbChsaXN0LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdC5sZW5ndGg7IGkgPCBsZW5ndGg7IGNhbGxiYWNrKGxpc3RbaSsrXSkpe31cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAocmVjb3Jkcykge1xuICAgICAgICAgICAgICBmb3IgKHZhclxuICAgICAgICAgICAgICAgIGN1cnJlbnQsIG5vZGUsIG5ld1ZhbHVlLFxuICAgICAgICAgICAgICAgIGkgPSAwLCBsZW5ndGggPSByZWNvcmRzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSByZWNvcmRzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50LnR5cGUgPT09ICdjaGlsZExpc3QnKSB7XG4gICAgICAgICAgICAgICAgICBjaGVja0VtQWxsKGN1cnJlbnQuYWRkZWROb2RlcywgYXR0YWNoZWQpO1xuICAgICAgICAgICAgICAgICAgY2hlY2tFbUFsbChjdXJyZW50LnJlbW92ZWROb2RlcywgZGV0YWNoZWQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBub2RlID0gY3VycmVudC50YXJnZXQ7XG4gICAgICAgICAgICAgICAgICBpZiAobm90RnJvbUlubmVySFRNTEhlbHBlciAmJlxuICAgICAgICAgICAgICAgICAgICAgIG5vZGVbQVRUUklCVVRFX0NIQU5HRURfQ0FMTEJBQ0tdICYmXG4gICAgICAgICAgICAgICAgICAgICAgY3VycmVudC5hdHRyaWJ1dGVOYW1lICE9PSAnc3R5bGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gZ2V0QXR0cmlidXRlLmNhbGwobm9kZSwgY3VycmVudC5hdHRyaWJ1dGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSBjdXJyZW50Lm9sZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgbm9kZVtBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDS10oXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50LmF0dHJpYnV0ZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Lm9sZFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KGV4ZWN1dGVBY3Rpb24oQVRUQUNIRUQpLCBleGVjdXRlQWN0aW9uKERFVEFDSEVEKSkpO1xuICAgICAgICAgIG9ic2VydmUgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShcbiAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIG9ic2VydmUoZG9jdW1lbnQpO1xuICAgICAgICAgIGlmIChhdHRhY2hTaGFkb3cpIHtcbiAgICAgICAgICAgIEhUTUxFbGVtZW50UHJvdG90eXBlLmF0dGFjaFNoYWRvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG9ic2VydmUoYXR0YWNoU2hhZG93LmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXNhcFF1ZXVlID0gW107XG4gICAgICAgICAgZG9jdW1lbnRbQUREX0VWRU5UX0xJU1RFTkVSXSgnRE9NTm9kZUluc2VydGVkJywgb25ET01Ob2RlKEFUVEFDSEVEKSk7XG4gICAgICAgICAgZG9jdW1lbnRbQUREX0VWRU5UX0xJU1RFTkVSXSgnRE9NTm9kZVJlbW92ZWQnLCBvbkRPTU5vZGUoREVUQUNIRUQpKTtcbiAgICAgICAgfVxuICBcbiAgICAgICAgZG9jdW1lbnRbQUREX0VWRU5UX0xJU1RFTkVSXShET01fQ09OVEVOVF9MT0FERUQsIG9uUmVhZHlTdGF0ZUNoYW5nZSk7XG4gICAgICAgIGRvY3VtZW50W0FERF9FVkVOVF9MSVNURU5FUl0oJ3JlYWR5c3RhdGVjaGFuZ2UnLCBvblJlYWR5U3RhdGVDaGFuZ2UpO1xuICBcbiAgICAgICAgSFRNTEVsZW1lbnRQcm90b3R5cGUuY2xvbmVOb2RlID0gZnVuY3Rpb24gKGRlZXApIHtcbiAgICAgICAgICB2YXJcbiAgICAgICAgICAgIG5vZGUgPSBjbG9uZU5vZGUuY2FsbCh0aGlzLCAhIWRlZXApLFxuICAgICAgICAgICAgaSA9IGdldFR5cGVJbmRleChub2RlKVxuICAgICAgICAgIDtcbiAgICAgICAgICBpZiAoLTEgPCBpKSBwYXRjaChub2RlLCBwcm90b3NbaV0pO1xuICAgICAgICAgIGlmIChkZWVwICYmIHF1ZXJ5Lmxlbmd0aCkgbG9vcEFuZFNldHVwKG5vZGUucXVlcnlTZWxlY3RvckFsbChxdWVyeSkpO1xuICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9O1xuICAgICAgfVxuICBcbiAgICAgIGlmIChqdXN0U2V0dXApIHJldHVybiAoanVzdFNldHVwID0gZmFsc2UpO1xuICBcbiAgICAgIGlmICgtMiA8IChcbiAgICAgICAgaW5kZXhPZi5jYWxsKHR5cGVzLCBQUkVGSVhfSVMgKyB1cHBlclR5cGUpICtcbiAgICAgICAgaW5kZXhPZi5jYWxsKHR5cGVzLCBQUkVGSVhfVEFHICsgdXBwZXJUeXBlKVxuICAgICAgKSkge1xuICAgICAgICB0aHJvd1R5cGVFcnJvcih0eXBlKTtcbiAgICAgIH1cbiAgXG4gICAgICBpZiAoIXZhbGlkTmFtZS50ZXN0KHVwcGVyVHlwZSkgfHwgLTEgPCBpbmRleE9mLmNhbGwoaW52YWxpZE5hbWVzLCB1cHBlclR5cGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHR5cGUgJyArIHR5cGUgKyAnIGlzIGludmFsaWQnKTtcbiAgICAgIH1cbiAgXG4gICAgICB2YXJcbiAgICAgICAgY29uc3RydWN0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIGV4dGVuZGluZyA/XG4gICAgICAgICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5vZGVOYW1lLCB1cHBlclR5cGUpIDpcbiAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUpO1xuICAgICAgICB9LFxuICAgICAgICBvcHQgPSBvcHRpb25zIHx8IE9QLFxuICAgICAgICBleHRlbmRpbmcgPSBoT1AuY2FsbChvcHQsIEVYVEVORFMpLFxuICAgICAgICBub2RlTmFtZSA9IGV4dGVuZGluZyA/IG9wdGlvbnNbRVhURU5EU10udG9VcHBlckNhc2UoKSA6IHVwcGVyVHlwZSxcbiAgICAgICAgdXBwZXJUeXBlLFxuICAgICAgICBpXG4gICAgICA7XG4gIFxuICAgICAgaWYgKGV4dGVuZGluZyAmJiAtMSA8IChcbiAgICAgICAgaW5kZXhPZi5jYWxsKHR5cGVzLCBQUkVGSVhfVEFHICsgbm9kZU5hbWUpXG4gICAgICApKSB7XG4gICAgICAgIHRocm93VHlwZUVycm9yKG5vZGVOYW1lKTtcbiAgICAgIH1cbiAgXG4gICAgICBpID0gdHlwZXMucHVzaCgoZXh0ZW5kaW5nID8gUFJFRklYX0lTIDogUFJFRklYX1RBRykgKyB1cHBlclR5cGUpIC0gMTtcbiAgXG4gICAgICBxdWVyeSA9IHF1ZXJ5LmNvbmNhdChcbiAgICAgICAgcXVlcnkubGVuZ3RoID8gJywnIDogJycsXG4gICAgICAgIGV4dGVuZGluZyA/IG5vZGVOYW1lICsgJ1tpcz1cIicgKyB0eXBlLnRvTG93ZXJDYXNlKCkgKyAnXCJdJyA6IG5vZGVOYW1lXG4gICAgICApO1xuICBcbiAgICAgIGNvbnN0cnVjdG9yLnByb3RvdHlwZSA9IChcbiAgICAgICAgcHJvdG9zW2ldID0gaE9QLmNhbGwob3B0LCAncHJvdG90eXBlJykgP1xuICAgICAgICAgIG9wdC5wcm90b3R5cGUgOlxuICAgICAgICAgIGNyZWF0ZShIVE1MRWxlbWVudFByb3RvdHlwZSlcbiAgICAgICk7XG4gIFxuICAgICAgaWYgKHF1ZXJ5Lmxlbmd0aCkgbG9vcEFuZFZlcmlmeShcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxdWVyeSksXG4gICAgICAgIEFUVEFDSEVEXG4gICAgICApO1xuICBcbiAgICAgIHJldHVybiBjb25zdHJ1Y3RvcjtcbiAgICB9O1xuICBcbiAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50ID0gKHBhdGNoZWRDcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24gKGxvY2FsTmFtZSwgdHlwZUV4dGVuc2lvbikge1xuICAgICAgdmFyXG4gICAgICAgIGlzID0gZ2V0SXModHlwZUV4dGVuc2lvbiksXG4gICAgICAgIG5vZGUgPSBpcyA/XG4gICAgICAgICAgY3JlYXRlRWxlbWVudC5jYWxsKGRvY3VtZW50LCBsb2NhbE5hbWUsIHNlY29uZEFyZ3VtZW50KGlzKSkgOlxuICAgICAgICAgIGNyZWF0ZUVsZW1lbnQuY2FsbChkb2N1bWVudCwgbG9jYWxOYW1lKSxcbiAgICAgICAgbmFtZSA9ICcnICsgbG9jYWxOYW1lLFxuICAgICAgICBpID0gaW5kZXhPZi5jYWxsKFxuICAgICAgICAgIHR5cGVzLFxuICAgICAgICAgIChpcyA/IFBSRUZJWF9JUyA6IFBSRUZJWF9UQUcpICtcbiAgICAgICAgICAoaXMgfHwgbmFtZSkudG9VcHBlckNhc2UoKVxuICAgICAgICApLFxuICAgICAgICBzZXR1cCA9IC0xIDwgaVxuICAgICAgO1xuICAgICAgaWYgKGlzKSB7XG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKCdpcycsIGlzID0gaXMudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIGlmIChzZXR1cCkge1xuICAgICAgICAgIHNldHVwID0gaXNJblFTQShuYW1lLnRvVXBwZXJDYXNlKCksIGlzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbm90RnJvbUlubmVySFRNTEhlbHBlciA9ICFkb2N1bWVudC5jcmVhdGVFbGVtZW50LmlubmVySFRNTEhlbHBlcjtcbiAgICAgIGlmIChzZXR1cCkgcGF0Y2gobm9kZSwgcHJvdG9zW2ldKTtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH0pO1xuICBcbiAgfVxuICBcbiAgZnVuY3Rpb24gQVNBUCgpIHtcbiAgICB2YXIgcXVldWUgPSBhc2FwUXVldWUuc3BsaWNlKDAsIGFzYXBRdWV1ZS5sZW5ndGgpO1xuICAgIGFzYXBUaW1lciA9IDA7XG4gICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgcXVldWUuc2hpZnQoKS5jYWxsKFxuICAgICAgICBudWxsLCBxdWV1ZS5zaGlmdCgpXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gbG9vcEFuZFZlcmlmeShsaXN0LCBhY3Rpb24pIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmVyaWZ5QW5kU2V0dXBBbmRBY3Rpb24obGlzdFtpXSwgYWN0aW9uKTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGxvb3BBbmRTZXR1cChsaXN0KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3QubGVuZ3RoLCBub2RlOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIG5vZGUgPSBsaXN0W2ldO1xuICAgICAgcGF0Y2gobm9kZSwgcHJvdG9zW2dldFR5cGVJbmRleChub2RlKV0pO1xuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gZXhlY3V0ZUFjdGlvbihhY3Rpb24pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgIGlmIChpc1ZhbGlkTm9kZShub2RlKSkge1xuICAgICAgICB2ZXJpZnlBbmRTZXR1cEFuZEFjdGlvbihub2RlLCBhY3Rpb24pO1xuICAgICAgICBpZiAocXVlcnkubGVuZ3RoKSBsb29wQW5kVmVyaWZ5KFxuICAgICAgICAgIG5vZGUucXVlcnlTZWxlY3RvckFsbChxdWVyeSksXG4gICAgICAgICAgYWN0aW9uXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gZ2V0VHlwZUluZGV4KHRhcmdldCkge1xuICAgIHZhclxuICAgICAgaXMgPSBnZXRBdHRyaWJ1dGUuY2FsbCh0YXJnZXQsICdpcycpLFxuICAgICAgbm9kZU5hbWUgPSB0YXJnZXQubm9kZU5hbWUudG9VcHBlckNhc2UoKSxcbiAgICAgIGkgPSBpbmRleE9mLmNhbGwoXG4gICAgICAgIHR5cGVzLFxuICAgICAgICBpcyA/XG4gICAgICAgICAgICBQUkVGSVhfSVMgKyBpcy50b1VwcGVyQ2FzZSgpIDpcbiAgICAgICAgICAgIFBSRUZJWF9UQUcgKyBub2RlTmFtZVxuICAgICAgKVxuICAgIDtcbiAgICByZXR1cm4gaXMgJiYgLTEgPCBpICYmICFpc0luUVNBKG5vZGVOYW1lLCBpcykgPyAtMSA6IGk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGlzSW5RU0EobmFtZSwgdHlwZSkge1xuICAgIHJldHVybiAtMSA8IHF1ZXJ5LmluZGV4T2YobmFtZSArICdbaXM9XCInICsgdHlwZSArICdcIl0nKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gb25ET01BdHRyTW9kaWZpZWQoZSkge1xuICAgIHZhclxuICAgICAgbm9kZSA9IGUuY3VycmVudFRhcmdldCxcbiAgICAgIGF0dHJDaGFuZ2UgPSBlLmF0dHJDaGFuZ2UsXG4gICAgICBhdHRyTmFtZSA9IGUuYXR0ck5hbWUsXG4gICAgICB0YXJnZXQgPSBlLnRhcmdldCxcbiAgICAgIGFkZGl0aW9uID0gZVtBRERJVElPTl0gfHwgMixcbiAgICAgIHJlbW92YWwgPSBlW1JFTU9WQUxdIHx8IDNcbiAgICA7XG4gICAgaWYgKG5vdEZyb21Jbm5lckhUTUxIZWxwZXIgJiZcbiAgICAgICAgKCF0YXJnZXQgfHwgdGFyZ2V0ID09PSBub2RlKSAmJlxuICAgICAgICBub2RlW0FUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLXSAmJlxuICAgICAgICBhdHRyTmFtZSAhPT0gJ3N0eWxlJyAmJiAoXG4gICAgICAgICAgZS5wcmV2VmFsdWUgIT09IGUubmV3VmFsdWUgfHxcbiAgICAgICAgICAvLyBJRTksIElFMTAsIGFuZCBPcGVyYSAxMiBnb3RjaGFcbiAgICAgICAgICBlLm5ld1ZhbHVlID09PSAnJyAmJiAoXG4gICAgICAgICAgICBhdHRyQ2hhbmdlID09PSBhZGRpdGlvbiB8fFxuICAgICAgICAgICAgYXR0ckNoYW5nZSA9PT0gcmVtb3ZhbFxuICAgICAgICAgIClcbiAgICApKSB7XG4gICAgICBub2RlW0FUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLXShcbiAgICAgICAgYXR0ck5hbWUsXG4gICAgICAgIGF0dHJDaGFuZ2UgPT09IGFkZGl0aW9uID8gbnVsbCA6IGUucHJldlZhbHVlLFxuICAgICAgICBhdHRyQ2hhbmdlID09PSByZW1vdmFsID8gbnVsbCA6IGUubmV3VmFsdWVcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBvbkRPTU5vZGUoYWN0aW9uKSB7XG4gICAgdmFyIGV4ZWN1dG9yID0gZXhlY3V0ZUFjdGlvbihhY3Rpb24pO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZSkge1xuICAgICAgYXNhcFF1ZXVlLnB1c2goZXhlY3V0b3IsIGUudGFyZ2V0KTtcbiAgICAgIGlmIChhc2FwVGltZXIpIGNsZWFyVGltZW91dChhc2FwVGltZXIpO1xuICAgICAgYXNhcFRpbWVyID0gc2V0VGltZW91dChBU0FQLCAxKTtcbiAgICB9O1xuICB9XG4gIFxuICBmdW5jdGlvbiBvblJlYWR5U3RhdGVDaGFuZ2UoZSkge1xuICAgIGlmIChkcm9wRG9tQ29udGVudExvYWRlZCkge1xuICAgICAgZHJvcERvbUNvbnRlbnRMb2FkZWQgPSBmYWxzZTtcbiAgICAgIGUuY3VycmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKERPTV9DT05URU5UX0xPQURFRCwgb25SZWFkeVN0YXRlQ2hhbmdlKTtcbiAgICB9XG4gICAgaWYgKHF1ZXJ5Lmxlbmd0aCkgbG9vcEFuZFZlcmlmeShcbiAgICAgIChlLnRhcmdldCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3RvckFsbChxdWVyeSksXG4gICAgICBlLmRldGFpbCA9PT0gREVUQUNIRUQgPyBERVRBQ0hFRCA6IEFUVEFDSEVEXG4gICAgKTtcbiAgICBpZiAoSUU4KSBwdXJnZSgpO1xuICB9XG4gIFxuICBmdW5jdGlvbiBwYXRjaGVkU2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKSB7XG4gICAgLy8ganNoaW50IHZhbGlkdGhpczp0cnVlXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHNldEF0dHJpYnV0ZS5jYWxsKHNlbGYsIG5hbWUsIHZhbHVlKTtcbiAgICBvblN1YnRyZWVNb2RpZmllZC5jYWxsKHNlbGYsIHt0YXJnZXQ6IHNlbGZ9KTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gc2V0dXBOb2RlKG5vZGUsIHByb3RvKSB7XG4gICAgc2V0UHJvdG90eXBlKG5vZGUsIHByb3RvKTtcbiAgICBpZiAob2JzZXJ2ZXIpIHtcbiAgICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwgYXR0cmlidXRlc09ic2VydmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGRvZXNOb3RTdXBwb3J0RE9NQXR0ck1vZGlmaWVkKSB7XG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlID0gcGF0Y2hlZFNldEF0dHJpYnV0ZTtcbiAgICAgICAgbm9kZVtFWFBBTkRPX1VJRF0gPSBnZXRBdHRyaWJ1dGVzTWlycm9yKG5vZGUpO1xuICAgICAgICBub2RlW0FERF9FVkVOVF9MSVNURU5FUl0oRE9NX1NVQlRSRUVfTU9ESUZJRUQsIG9uU3VidHJlZU1vZGlmaWVkKTtcbiAgICAgIH1cbiAgICAgIG5vZGVbQUREX0VWRU5UX0xJU1RFTkVSXShET01fQVRUUl9NT0RJRklFRCwgb25ET01BdHRyTW9kaWZpZWQpO1xuICAgIH1cbiAgICBpZiAobm9kZVtDUkVBVEVEX0NBTExCQUNLXSAmJiBub3RGcm9tSW5uZXJIVE1MSGVscGVyKSB7XG4gICAgICBub2RlLmNyZWF0ZWQgPSB0cnVlO1xuICAgICAgbm9kZVtDUkVBVEVEX0NBTExCQUNLXSgpO1xuICAgICAgbm9kZS5jcmVhdGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBwdXJnZSgpIHtcbiAgICBmb3IgKHZhclxuICAgICAgbm9kZSxcbiAgICAgIGkgPSAwLFxuICAgICAgbGVuZ3RoID0gdGFyZ2V0cy5sZW5ndGg7XG4gICAgICBpIDwgbGVuZ3RoOyBpKytcbiAgICApIHtcbiAgICAgIG5vZGUgPSB0YXJnZXRzW2ldO1xuICAgICAgaWYgKCFkb2N1bWVudEVsZW1lbnQuY29udGFpbnMobm9kZSkpIHtcbiAgICAgICAgbGVuZ3RoLS07XG4gICAgICAgIHRhcmdldHMuc3BsaWNlKGktLSwgMSk7XG4gICAgICAgIHZlcmlmeUFuZFNldHVwQW5kQWN0aW9uKG5vZGUsIERFVEFDSEVEKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHRocm93VHlwZUVycm9yKHR5cGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgJyArIHR5cGUgKyAnIHR5cGUgaXMgYWxyZWFkeSByZWdpc3RlcmVkJyk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHZlcmlmeUFuZFNldHVwQW5kQWN0aW9uKG5vZGUsIGFjdGlvbikge1xuICAgIHZhclxuICAgICAgZm4sXG4gICAgICBpID0gZ2V0VHlwZUluZGV4KG5vZGUpXG4gICAgO1xuICAgIGlmICgtMSA8IGkpIHtcbiAgICAgIHBhdGNoSWZOb3RBbHJlYWR5KG5vZGUsIHByb3Rvc1tpXSk7XG4gICAgICBpID0gMDtcbiAgICAgIGlmIChhY3Rpb24gPT09IEFUVEFDSEVEICYmICFub2RlW0FUVEFDSEVEXSkge1xuICAgICAgICBub2RlW0RFVEFDSEVEXSA9IGZhbHNlO1xuICAgICAgICBub2RlW0FUVEFDSEVEXSA9IHRydWU7XG4gICAgICAgIGkgPSAxO1xuICAgICAgICBpZiAoSUU4ICYmIGluZGV4T2YuY2FsbCh0YXJnZXRzLCBub2RlKSA8IDApIHtcbiAgICAgICAgICB0YXJnZXRzLnB1c2gobm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBERVRBQ0hFRCAmJiAhbm9kZVtERVRBQ0hFRF0pIHtcbiAgICAgICAgbm9kZVtBVFRBQ0hFRF0gPSBmYWxzZTtcbiAgICAgICAgbm9kZVtERVRBQ0hFRF0gPSB0cnVlO1xuICAgICAgICBpID0gMTtcbiAgICAgIH1cbiAgICAgIGlmIChpICYmIChmbiA9IG5vZGVbYWN0aW9uICsgQ0FMTEJBQ0tdKSkgZm4uY2FsbChub2RlKTtcbiAgICB9XG4gIH1cbiAgXG4gIFxuICBcbiAgLy8gVjEgaW4gZGEgSG91c2UhXG4gIGZ1bmN0aW9uIEN1c3RvbUVsZW1lbnRSZWdpc3RyeSgpIHt9XG4gIFxuICBDdXN0b21FbGVtZW50UmVnaXN0cnkucHJvdG90eXBlID0ge1xuICAgIGNvbnN0cnVjdG9yOiBDdXN0b21FbGVtZW50UmVnaXN0cnksXG4gICAgLy8gYSB3b3JrYXJvdW5kIGZvciB0aGUgc3R1YmJvcm4gV2ViS2l0XG4gICAgZGVmaW5lOiB1c2FibGVDdXN0b21FbGVtZW50cyA/XG4gICAgICBmdW5jdGlvbiAobmFtZSwgQ2xhc3MsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICBDRVJEZWZpbmUobmFtZSwgQ2xhc3MsIG9wdGlvbnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBOQU1FID0gbmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgIGNvbnN0cnVjdG9yc1tOQU1FXSA9IHtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yOiBDbGFzcyxcbiAgICAgICAgICAgIGNyZWF0ZTogW05BTUVdXG4gICAgICAgICAgfTtcbiAgICAgICAgICBub2RlTmFtZXMuc2V0KENsYXNzLCBOQU1FKTtcbiAgICAgICAgICBjdXN0b21FbGVtZW50cy5kZWZpbmUobmFtZSwgQ2xhc3MpO1xuICAgICAgICB9XG4gICAgICB9IDpcbiAgICAgIENFUkRlZmluZSxcbiAgICBnZXQ6IHVzYWJsZUN1c3RvbUVsZW1lbnRzID9cbiAgICAgIGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHJldHVybiBjdXN0b21FbGVtZW50cy5nZXQobmFtZSkgfHwgZ2V0KG5hbWUpO1xuICAgICAgfSA6XG4gICAgICBnZXQsXG4gICAgd2hlbkRlZmluZWQ6IHVzYWJsZUN1c3RvbUVsZW1lbnRzID9cbiAgICAgIGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgIGN1c3RvbUVsZW1lbnRzLndoZW5EZWZpbmVkKG5hbWUpLFxuICAgICAgICAgIHdoZW5EZWZpbmVkKG5hbWUpXG4gICAgICAgIF0pO1xuICAgICAgfSA6XG4gICAgICB3aGVuRGVmaW5lZFxuICB9O1xuICBcbiAgZnVuY3Rpb24gQ0VSRGVmaW5lKG5hbWUsIENsYXNzLCBvcHRpb25zKSB7XG4gICAgdmFyXG4gICAgICBpcyA9IG9wdGlvbnMgJiYgb3B0aW9uc1tFWFRFTkRTXSB8fCAnJyxcbiAgICAgIENQcm90byA9IENsYXNzLnByb3RvdHlwZSxcbiAgICAgIHByb3RvID0gY3JlYXRlKENQcm90byksXG4gICAgICBhdHRyaWJ1dGVzID0gQ2xhc3Mub2JzZXJ2ZWRBdHRyaWJ1dGVzIHx8IGVtcHR5LFxuICAgICAgZGVmaW5pdGlvbiA9IHtwcm90b3R5cGU6IHByb3RvfVxuICAgIDtcbiAgICAvLyBUT0RPOiBpcyB0aGlzIG5lZWRlZCBhdCBhbGwgc2luY2UgaXQncyBpbmhlcml0ZWQ/XG4gICAgLy8gZGVmaW5lUHJvcGVydHkocHJvdG8sICdjb25zdHJ1Y3RvcicsIHt2YWx1ZTogQ2xhc3N9KTtcbiAgICBzYWZlUHJvcGVydHkocHJvdG8sIENSRUFURURfQ0FMTEJBQ0ssIHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoanVzdENyZWF0ZWQpIGp1c3RDcmVhdGVkID0gZmFsc2U7XG4gICAgICAgICAgZWxzZSBpZiAoIXRoaXNbRFJFQ0VWMV0pIHtcbiAgICAgICAgICAgIHRoaXNbRFJFQ0VWMV0gPSB0cnVlO1xuICAgICAgICAgICAgbmV3IENsYXNzKHRoaXMpO1xuICAgICAgICAgICAgaWYgKENQcm90b1tDUkVBVEVEX0NBTExCQUNLXSlcbiAgICAgICAgICAgICAgQ1Byb3RvW0NSRUFURURfQ0FMTEJBQ0tdLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB2YXIgaW5mbyA9IGNvbnN0cnVjdG9yc1tub2RlTmFtZXMuZ2V0KENsYXNzKV07XG4gICAgICAgICAgICBpZiAoIXVzYWJsZUN1c3RvbUVsZW1lbnRzIHx8IGluZm8uY3JlYXRlLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgbm90aWZ5QXR0cmlidXRlcyh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgc2FmZVByb3BlcnR5KHByb3RvLCBBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDSywge1xuICAgICAgdmFsdWU6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGlmICgtMSA8IGluZGV4T2YuY2FsbChhdHRyaWJ1dGVzLCBuYW1lKSlcbiAgICAgICAgICBDUHJvdG9bQVRUUklCVVRFX0NIQU5HRURfQ0FMTEJBQ0tdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKENQcm90b1tDT05ORUNURURfQ0FMTEJBQ0tdKSB7XG4gICAgICBzYWZlUHJvcGVydHkocHJvdG8sIEFUVEFDSEVEX0NBTExCQUNLLCB7XG4gICAgICAgIHZhbHVlOiBDUHJvdG9bQ09OTkVDVEVEX0NBTExCQUNLXVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChDUHJvdG9bRElTQ09OTkVDVEVEX0NBTExCQUNLXSkge1xuICAgICAgc2FmZVByb3BlcnR5KHByb3RvLCBERVRBQ0hFRF9DQUxMQkFDSywge1xuICAgICAgICB2YWx1ZTogQ1Byb3RvW0RJU0NPTk5FQ1RFRF9DQUxMQkFDS11cbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoaXMpIGRlZmluaXRpb25bRVhURU5EU10gPSBpcztcbiAgICBuYW1lID0gbmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgIGNvbnN0cnVjdG9yc1tuYW1lXSA9IHtcbiAgICAgIGNvbnN0cnVjdG9yOiBDbGFzcyxcbiAgICAgIGNyZWF0ZTogaXMgPyBbaXMsIHNlY29uZEFyZ3VtZW50KG5hbWUpXSA6IFtuYW1lXVxuICAgIH07XG4gICAgbm9kZU5hbWVzLnNldChDbGFzcywgbmFtZSk7XG4gICAgZG9jdW1lbnRbUkVHSVNURVJfRUxFTUVOVF0obmFtZS50b0xvd2VyQ2FzZSgpLCBkZWZpbml0aW9uKTtcbiAgICB3aGVuRGVmaW5lZChuYW1lKTtcbiAgICB3YWl0aW5nTGlzdFtuYW1lXS5yKCk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGdldChuYW1lKSB7XG4gICAgdmFyIGluZm8gPSBjb25zdHJ1Y3RvcnNbbmFtZS50b1VwcGVyQ2FzZSgpXTtcbiAgICByZXR1cm4gaW5mbyAmJiBpbmZvLmNvbnN0cnVjdG9yO1xuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRJcyhvcHRpb25zKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJyA/XG4gICAgICAgIG9wdGlvbnMgOiAob3B0aW9ucyAmJiBvcHRpb25zLmlzIHx8ICcnKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gbm90aWZ5QXR0cmlidXRlcyhzZWxmKSB7XG4gICAgdmFyXG4gICAgICBjYWxsYmFjayA9IHNlbGZbQVRUUklCVVRFX0NIQU5HRURfQ0FMTEJBQ0tdLFxuICAgICAgYXR0cmlidXRlcyA9IGNhbGxiYWNrID8gc2VsZi5hdHRyaWJ1dGVzIDogZW1wdHksXG4gICAgICBpID0gYXR0cmlidXRlcy5sZW5ndGgsXG4gICAgICBhdHRyaWJ1dGVcbiAgICA7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgYXR0cmlidXRlID0gIGF0dHJpYnV0ZXNbaV07IC8vIHx8IGF0dHJpYnV0ZXMuaXRlbShpKTtcbiAgICAgIGNhbGxiYWNrLmNhbGwoXG4gICAgICAgIHNlbGYsXG4gICAgICAgIGF0dHJpYnV0ZS5uYW1lIHx8IGF0dHJpYnV0ZS5ub2RlTmFtZSxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgYXR0cmlidXRlLnZhbHVlIHx8IGF0dHJpYnV0ZS5ub2RlVmFsdWVcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiB3aGVuRGVmaW5lZChuYW1lKSB7XG4gICAgbmFtZSA9IG5hbWUudG9VcHBlckNhc2UoKTtcbiAgICBpZiAoIShuYW1lIGluIHdhaXRpbmdMaXN0KSkge1xuICAgICAgd2FpdGluZ0xpc3RbbmFtZV0gPSB7fTtcbiAgICAgIHdhaXRpbmdMaXN0W25hbWVdLnAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICB3YWl0aW5nTGlzdFtuYW1lXS5yID0gcmVzb2x2ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gd2FpdGluZ0xpc3RbbmFtZV0ucDtcbiAgfVxuICBcbiAgZnVuY3Rpb24gcG9seWZpbGxWMSgpIHtcbiAgICBpZiAoY3VzdG9tRWxlbWVudHMpIGRlbGV0ZSB3aW5kb3cuY3VzdG9tRWxlbWVudHM7XG4gICAgZGVmaW5lUHJvcGVydHkod2luZG93LCAnY3VzdG9tRWxlbWVudHMnLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogbmV3IEN1c3RvbUVsZW1lbnRSZWdpc3RyeSgpXG4gICAgfSk7XG4gICAgZGVmaW5lUHJvcGVydHkod2luZG93LCAnQ3VzdG9tRWxlbWVudFJlZ2lzdHJ5Jywge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IEN1c3RvbUVsZW1lbnRSZWdpc3RyeVxuICAgIH0pO1xuICAgIGZvciAodmFyXG4gICAgICBwYXRjaENsYXNzID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIENsYXNzID0gd2luZG93W25hbWVdO1xuICAgICAgICBpZiAoQ2xhc3MpIHtcbiAgICAgICAgICB3aW5kb3dbbmFtZV0gPSBmdW5jdGlvbiBDdXN0b21FbGVtZW50c1YxKHNlbGYpIHtcbiAgICAgICAgICAgIHZhciBpbmZvLCBpc05hdGl2ZTtcbiAgICAgICAgICAgIGlmICghc2VsZikgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBpZiAoIXNlbGZbRFJFQ0VWMV0pIHtcbiAgICAgICAgICAgICAganVzdENyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICBpbmZvID0gY29uc3RydWN0b3JzW25vZGVOYW1lcy5nZXQoc2VsZi5jb25zdHJ1Y3RvcildO1xuICAgICAgICAgICAgICBpc05hdGl2ZSA9IHVzYWJsZUN1c3RvbUVsZW1lbnRzICYmIGluZm8uY3JlYXRlLmxlbmd0aCA9PT0gMTtcbiAgICAgICAgICAgICAgc2VsZiA9IGlzTmF0aXZlID9cbiAgICAgICAgICAgICAgICBSZWZsZWN0LmNvbnN0cnVjdChDbGFzcywgZW1wdHksIGluZm8uY29uc3RydWN0b3IpIDpcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50LmFwcGx5KGRvY3VtZW50LCBpbmZvLmNyZWF0ZSk7XG4gICAgICAgICAgICAgIHNlbGZbRFJFQ0VWMV0gPSB0cnVlO1xuICAgICAgICAgICAgICBqdXN0Q3JlYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICBpZiAoIWlzTmF0aXZlKSBub3RpZnlBdHRyaWJ1dGVzKHNlbGYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgfTtcbiAgICAgICAgICB3aW5kb3dbbmFtZV0ucHJvdG90eXBlID0gQ2xhc3MucHJvdG90eXBlO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBDbGFzcy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSB3aW5kb3dbbmFtZV07XG4gICAgICAgICAgfSBjYXRjaChXZWJLaXQpIHtcbiAgICAgICAgICAgIGZpeEdldENsYXNzID0gdHJ1ZTtcbiAgICAgICAgICAgIGRlZmluZVByb3BlcnR5KENsYXNzLCBEUkVDRVYxLCB7dmFsdWU6IHdpbmRvd1tuYW1lXX0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIENsYXNzZXMgPSBodG1sQ2xhc3MuZ2V0KC9eSFRNTFtBLVpdKlthLXpdLyksXG4gICAgICBpID0gQ2xhc3Nlcy5sZW5ndGg7XG4gICAgICBpLS07XG4gICAgICBwYXRjaENsYXNzKENsYXNzZXNbaV0pXG4gICAgKSB7fVxuICAgIChkb2N1bWVudC5jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24gKG5hbWUsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBpcyA9IGdldElzKG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIGlzID9cbiAgICAgICAgcGF0Y2hlZENyZWF0ZUVsZW1lbnQuY2FsbCh0aGlzLCBuYW1lLCBzZWNvbmRBcmd1bWVudChpcykpIDpcbiAgICAgICAgcGF0Y2hlZENyZWF0ZUVsZW1lbnQuY2FsbCh0aGlzLCBuYW1lKTtcbiAgICB9KTtcbiAgICBpZiAoIVYwKSB7XG4gICAgICBqdXN0U2V0dXAgPSB0cnVlO1xuICAgICAgZG9jdW1lbnRbUkVHSVNURVJfRUxFTUVOVF0oJycpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gaWYgY3VzdG9tRWxlbWVudHMgaXMgbm90IHRoZXJlIGF0IGFsbFxuICBpZiAoIWN1c3RvbUVsZW1lbnRzIHx8IHBvbHlmaWxsID09PSAnZm9yY2UnKSBwb2x5ZmlsbFYxKCk7XG4gIGVsc2Uge1xuICAgIC8vIGlmIGF2YWlsYWJsZSB0ZXN0IGV4dGVuZHMgd29yayBhcyBleHBlY3RlZFxuICAgIHRyeSB7XG4gICAgICAoZnVuY3Rpb24gKERSRSwgb3B0aW9ucywgbmFtZSkge1xuICAgICAgICBvcHRpb25zW0VYVEVORFNdID0gJ2EnO1xuICAgICAgICBEUkUucHJvdG90eXBlID0gY3JlYXRlKEhUTUxBbmNob3JFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgICAgIERSRS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEUkU7XG4gICAgICAgIHdpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUobmFtZSwgRFJFLCBvcHRpb25zKTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGdldEF0dHJpYnV0ZS5jYWxsKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnLCB7aXM6IG5hbWV9KSwgJ2lzJykgIT09IG5hbWUgfHxcbiAgICAgICAgICAodXNhYmxlQ3VzdG9tRWxlbWVudHMgJiYgZ2V0QXR0cmlidXRlLmNhbGwobmV3IERSRSgpLCAnaXMnKSAhPT0gbmFtZSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhyb3cgb3B0aW9ucztcbiAgICAgICAgfVxuICAgICAgfShcbiAgICAgICAgZnVuY3Rpb24gRFJFKCkge1xuICAgICAgICAgIHJldHVybiBSZWZsZWN0LmNvbnN0cnVjdChIVE1MQW5jaG9yRWxlbWVudCwgW10sIERSRSk7XG4gICAgICAgIH0sXG4gICAgICAgIHt9LFxuICAgICAgICAnZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudC1hJ1xuICAgICAgKSk7XG4gICAgfSBjYXRjaChvX08pIHtcbiAgICAgIC8vIG9yIGZvcmNlIHRoZSBwb2x5ZmlsbCBpZiBub3RcbiAgICAgIC8vIGFuZCBrZWVwIGludGVybmFsIG9yaWdpbmFsIHJlZmVyZW5jZVxuICAgICAgcG9seWZpbGxWMSgpO1xuICAgIH1cbiAgfVxuICBcbiAgdHJ5IHtcbiAgICBjcmVhdGVFbGVtZW50LmNhbGwoZG9jdW1lbnQsICdhJywgJ2EnKTtcbiAgfSBjYXRjaChGaXJlRm94KSB7XG4gICAgc2Vjb25kQXJndW1lbnQgPSBmdW5jdGlvbiAoaXMpIHtcbiAgICAgIHJldHVybiB7aXM6IGlzLnRvTG93ZXJDYXNlKCl9O1xuICAgIH07XG4gIH1cbiAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW5zdGFsbEN1c3RvbUVsZW1lbnRzO1xuaW5zdGFsbEN1c3RvbUVsZW1lbnRzKGdsb2JhbCk7XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUsIG5vZGU6dHJ1ZSovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBEZWxlZ2F0ZTtcblxuLyoqXG4gKiBET00gZXZlbnQgZGVsZWdhdG9yXG4gKlxuICogVGhlIGRlbGVnYXRvciB3aWxsIGxpc3RlblxuICogZm9yIGV2ZW50cyB0aGF0IGJ1YmJsZSB1cFxuICogdG8gdGhlIHJvb3Qgbm9kZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7Tm9kZXxzdHJpbmd9IFtyb290XSBUaGUgcm9vdCBub2RlIG9yIGEgc2VsZWN0b3Igc3RyaW5nIG1hdGNoaW5nIHRoZSByb290IG5vZGVcbiAqL1xuZnVuY3Rpb24gRGVsZWdhdGUocm9vdCkge1xuXG4gIC8qKlxuICAgKiBNYWludGFpbiBhIG1hcCBvZiBsaXN0ZW5lclxuICAgKiBsaXN0cywga2V5ZWQgYnkgZXZlbnQgbmFtZS5cbiAgICpcbiAgICogQHR5cGUgT2JqZWN0XG4gICAqL1xuICB0aGlzLmxpc3RlbmVyTWFwID0gW3t9LCB7fV07XG4gIGlmIChyb290KSB7XG4gICAgdGhpcy5yb290KHJvb3QpO1xuICB9XG5cbiAgLyoqIEB0eXBlIGZ1bmN0aW9uKCkgKi9cbiAgdGhpcy5oYW5kbGUgPSBEZWxlZ2F0ZS5wcm90b3R5cGUuaGFuZGxlLmJpbmQodGhpcyk7XG59XG5cbi8qKlxuICogU3RhcnQgbGlzdGVuaW5nIGZvciBldmVudHNcbiAqIG9uIHRoZSBwcm92aWRlZCBET00gZWxlbWVudFxuICpcbiAqIEBwYXJhbSAge05vZGV8c3RyaW5nfSBbcm9vdF0gVGhlIHJvb3Qgbm9kZSBvciBhIHNlbGVjdG9yIHN0cmluZyBtYXRjaGluZyB0aGUgcm9vdCBub2RlXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUucm9vdCA9IGZ1bmN0aW9uKHJvb3QpIHtcbiAgdmFyIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcDtcbiAgdmFyIGV2ZW50VHlwZTtcblxuICAvLyBSZW1vdmUgbWFzdGVyIGV2ZW50IGxpc3RlbmVyc1xuICBpZiAodGhpcy5yb290RWxlbWVudCkge1xuICAgIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzFdKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXBbMV0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzBdKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXBbMF0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIG5vIHJvb3Qgb3Igcm9vdCBpcyBub3RcbiAgLy8gYSBkb20gbm9kZSwgdGhlbiByZW1vdmUgaW50ZXJuYWxcbiAgLy8gcm9vdCByZWZlcmVuY2UgYW5kIGV4aXQgaGVyZVxuICBpZiAoIXJvb3QgfHwgIXJvb3QuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICBkZWxldGUgdGhpcy5yb290RWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHJvb3Qgbm9kZSBhdCB3aGljaFxuICAgKiBsaXN0ZW5lcnMgYXJlIGF0dGFjaGVkLlxuICAgKlxuICAgKiBAdHlwZSBOb2RlXG4gICAqL1xuICB0aGlzLnJvb3RFbGVtZW50ID0gcm9vdDtcblxuICAvLyBTZXQgdXAgbWFzdGVyIGV2ZW50IGxpc3RlbmVyc1xuICBmb3IgKGV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcFsxXSkge1xuICAgIGlmIChsaXN0ZW5lck1hcFsxXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdHJ1ZSk7XG4gICAgfVxuICB9XG4gIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzBdKSB7XG4gICAgaWYgKGxpc3RlbmVyTWFwWzBdLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmNhcHR1cmVGb3JUeXBlID0gZnVuY3Rpb24oZXZlbnRUeXBlKSB7XG4gIHJldHVybiBbJ2JsdXInLCAnZXJyb3InLCAnZm9jdXMnLCAnbG9hZCcsICdyZXNpemUnLCAnc2Nyb2xsJ10uaW5kZXhPZihldmVudFR5cGUpICE9PSAtMTtcbn07XG5cbi8qKlxuICogQXR0YWNoIGEgaGFuZGxlciB0byBvbmVcbiAqIGV2ZW50IGZvciBhbGwgZWxlbWVudHNcbiAqIHRoYXQgbWF0Y2ggdGhlIHNlbGVjdG9yLFxuICogbm93IG9yIGluIHRoZSBmdXR1cmVcbiAqXG4gKiBUaGUgaGFuZGxlciBmdW5jdGlvbiByZWNlaXZlc1xuICogdGhyZWUgYXJndW1lbnRzOiB0aGUgRE9NIGV2ZW50XG4gKiBvYmplY3QsIHRoZSBub2RlIHRoYXQgbWF0Y2hlZFxuICogdGhlIHNlbGVjdG9yIHdoaWxlIHRoZSBldmVudFxuICogd2FzIGJ1YmJsaW5nIGFuZCBhIHJlZmVyZW5jZVxuICogdG8gaXRzZWxmLiBXaXRoaW4gdGhlIGhhbmRsZXIsXG4gKiAndGhpcycgaXMgZXF1YWwgdG8gdGhlIHNlY29uZFxuICogYXJndW1lbnQuXG4gKlxuICogVGhlIG5vZGUgdGhhdCBhY3R1YWxseSByZWNlaXZlZFxuICogdGhlIGV2ZW50IGNhbiBiZSBhY2Nlc3NlZCB2aWFcbiAqICdldmVudC50YXJnZXQnLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgTGlzdGVuIGZvciB0aGVzZSBldmVudHNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc2VsZWN0b3IgT25seSBoYW5kbGUgZXZlbnRzIG9uIGVsZW1lbnRzIG1hdGNoaW5nIHRoaXMgc2VsZWN0b3IsIGlmIHVuZGVmaW5lZCBtYXRjaCByb290IGVsZW1lbnRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKX0gaGFuZGxlciBIYW5kbGVyIGZ1bmN0aW9uIC0gZXZlbnQgZGF0YSBwYXNzZWQgaGVyZSB3aWxsIGJlIGluIGV2ZW50LmRhdGFcbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXZlbnREYXRhXSBEYXRhIHRvIHBhc3MgaW4gZXZlbnQuZGF0YVxuICogQHJldHVybnMge0RlbGVnYXRlfSBUaGlzIG1ldGhvZCBpcyBjaGFpbmFibGVcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdXNlQ2FwdHVyZSkge1xuICB2YXIgcm9vdCwgbGlzdGVuZXJNYXAsIG1hdGNoZXIsIG1hdGNoZXJQYXJhbTtcblxuICBpZiAoIWV2ZW50VHlwZSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgZXZlbnQgdHlwZTogJyArIGV2ZW50VHlwZSk7XG4gIH1cblxuICAvLyBoYW5kbGVyIGNhbiBiZSBwYXNzZWQgYXNcbiAgLy8gdGhlIHNlY29uZCBvciB0aGlyZCBhcmd1bWVudFxuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlQ2FwdHVyZSA9IGhhbmRsZXI7XG4gICAgaGFuZGxlciA9IHNlbGVjdG9yO1xuICAgIHNlbGVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvIHNlbnNpYmxlIGRlZmF1bHRzXG4gIC8vIGlmIHVzZUNhcHR1cmUgbm90IHNldFxuICBpZiAodXNlQ2FwdHVyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdXNlQ2FwdHVyZSA9IHRoaXMuY2FwdHVyZUZvclR5cGUoZXZlbnRUeXBlKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgaGFuZGxlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0hhbmRsZXIgbXVzdCBiZSBhIHR5cGUgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuICBsaXN0ZW5lck1hcCA9IHRoaXMubGlzdGVuZXJNYXBbdXNlQ2FwdHVyZSA/IDEgOiAwXTtcblxuICAvLyBBZGQgbWFzdGVyIGhhbmRsZXIgZm9yIHR5cGUgaWYgbm90IGNyZWF0ZWQgeWV0XG4gIGlmICghbGlzdGVuZXJNYXBbZXZlbnRUeXBlXSkge1xuICAgIGlmIChyb290KSB7XG4gICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICAgIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV0gPSBbXTtcbiAgfVxuXG4gIGlmICghc2VsZWN0b3IpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBudWxsO1xuXG4gICAgLy8gQ09NUExFWCAtIG1hdGNoZXNSb290IG5lZWRzIHRvIGhhdmUgYWNjZXNzIHRvXG4gICAgLy8gdGhpcy5yb290RWxlbWVudCwgc28gYmluZCB0aGUgZnVuY3Rpb24gdG8gdGhpcy5cbiAgICBtYXRjaGVyID0gbWF0Y2hlc1Jvb3QuYmluZCh0aGlzKTtcblxuICAvLyBDb21waWxlIGEgbWF0Y2hlciBmb3IgdGhlIGdpdmVuIHNlbGVjdG9yXG4gIH0gZWxzZSBpZiAoL15bYS16XSskL2kudGVzdChzZWxlY3RvcikpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3RvcjtcbiAgICBtYXRjaGVyID0gbWF0Y2hlc1RhZztcbiAgfSBlbHNlIGlmICgvXiNbYS16MC05XFwtX10rJC9pLnRlc3Qoc2VsZWN0b3IpKSB7XG4gICAgbWF0Y2hlclBhcmFtID0gc2VsZWN0b3Iuc2xpY2UoMSk7XG4gICAgbWF0Y2hlciA9IG1hdGNoZXNJZDtcbiAgfSBlbHNlIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3RvcjtcbiAgICBtYXRjaGVyID0gbWF0Y2hlcztcbiAgfVxuXG4gIC8vIEFkZCB0byB0aGUgbGlzdCBvZiBsaXN0ZW5lcnNcbiAgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXS5wdXNoKHtcbiAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXG4gICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICBtYXRjaGVyOiBtYXRjaGVyLFxuICAgIG1hdGNoZXJQYXJhbTogbWF0Y2hlclBhcmFtXG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYW4gZXZlbnQgaGFuZGxlclxuICogZm9yIGVsZW1lbnRzIHRoYXQgbWF0Y2hcbiAqIHRoZSBzZWxlY3RvciwgZm9yZXZlclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZXZlbnRUeXBlXSBSZW1vdmUgaGFuZGxlcnMgZm9yIGV2ZW50cyBtYXRjaGluZyB0aGlzIHR5cGUsIGNvbnNpZGVyaW5nIHRoZSBvdGhlciBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ30gW3NlbGVjdG9yXSBJZiB0aGlzIHBhcmFtZXRlciBpcyBvbWl0dGVkLCBvbmx5IGhhbmRsZXJzIHdoaWNoIG1hdGNoIHRoZSBvdGhlciB0d28gd2lsbCBiZSByZW1vdmVkXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCl9IFtoYW5kbGVyXSBJZiB0aGlzIHBhcmFtZXRlciBpcyBvbWl0dGVkLCBvbmx5IGhhbmRsZXJzIHdoaWNoIG1hdGNoIHRoZSBwcmV2aW91cyB0d28gd2lsbCBiZSByZW1vdmVkXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24oZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdXNlQ2FwdHVyZSkge1xuICB2YXIgaSwgbGlzdGVuZXIsIGxpc3RlbmVyTWFwLCBsaXN0ZW5lckxpc3QsIHNpbmdsZUV2ZW50VHlwZTtcblxuICAvLyBIYW5kbGVyIGNhbiBiZSBwYXNzZWQgYXNcbiAgLy8gdGhlIHNlY29uZCBvciB0aGlyZCBhcmd1bWVudFxuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlQ2FwdHVyZSA9IGhhbmRsZXI7XG4gICAgaGFuZGxlciA9IHNlbGVjdG9yO1xuICAgIHNlbGVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIC8vIElmIHVzZUNhcHR1cmUgbm90IHNldCwgcmVtb3ZlXG4gIC8vIGFsbCBldmVudCBsaXN0ZW5lcnNcbiAgaWYgKHVzZUNhcHR1cmUgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXMub2ZmKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIHRydWUpO1xuICAgIHRoaXMub2ZmKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcFt1c2VDYXB0dXJlID8gMSA6IDBdO1xuICBpZiAoIWV2ZW50VHlwZSkge1xuICAgIGZvciAoc2luZ2xlRXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXAuaGFzT3duUHJvcGVydHkoc2luZ2xlRXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLm9mZihzaW5nbGVFdmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVyTGlzdCA9IGxpc3RlbmVyTWFwW2V2ZW50VHlwZV07XG4gIGlmICghbGlzdGVuZXJMaXN0IHx8ICFsaXN0ZW5lckxpc3QubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBSZW1vdmUgb25seSBwYXJhbWV0ZXIgbWF0Y2hlc1xuICAvLyBpZiBzcGVjaWZpZWRcbiAgZm9yIChpID0gbGlzdGVuZXJMaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgbGlzdGVuZXIgPSBsaXN0ZW5lckxpc3RbaV07XG5cbiAgICBpZiAoKCFzZWxlY3RvciB8fCBzZWxlY3RvciA9PT0gbGlzdGVuZXIuc2VsZWN0b3IpICYmICghaGFuZGxlciB8fCBoYW5kbGVyID09PSBsaXN0ZW5lci5oYW5kbGVyKSkge1xuICAgICAgbGlzdGVuZXJMaXN0LnNwbGljZShpLCAxKTtcbiAgICB9XG4gIH1cblxuICAvLyBBbGwgbGlzdGVuZXJzIHJlbW92ZWRcbiAgaWYgKCFsaXN0ZW5lckxpc3QubGVuZ3RoKSB7XG4gICAgZGVsZXRlIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV07XG5cbiAgICAvLyBSZW1vdmUgdGhlIG1haW4gaGFuZGxlclxuICAgIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogSGFuZGxlIGFuIGFyYml0cmFyeSBldmVudC5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuaGFuZGxlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgdmFyIGksIGwsIHR5cGUgPSBldmVudC50eXBlLCByb290LCBwaGFzZSwgbGlzdGVuZXIsIHJldHVybmVkLCBsaXN0ZW5lckxpc3QgPSBbXSwgdGFyZ2V0LCAvKiogQGNvbnN0ICovIEVWRU5USUdOT1JFID0gJ2Z0TGFic0RlbGVnYXRlSWdub3JlJztcblxuICBpZiAoZXZlbnRbRVZFTlRJR05PUkVdID09PSB0cnVlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuXG4gIC8vIEhhcmRjb2RlIHZhbHVlIG9mIE5vZGUuVEVYVF9OT0RFXG4gIC8vIGFzIG5vdCBkZWZpbmVkIGluIElFOFxuICBpZiAodGFyZ2V0Lm5vZGVUeXBlID09PSAzKSB7XG4gICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XG4gIH1cblxuICByb290ID0gdGhpcy5yb290RWxlbWVudDtcblxuICBwaGFzZSA9IGV2ZW50LmV2ZW50UGhhc2UgfHwgKCBldmVudC50YXJnZXQgIT09IGV2ZW50LmN1cnJlbnRUYXJnZXQgPyAzIDogMiApO1xuICBcbiAgc3dpdGNoIChwaGFzZSkge1xuICAgIGNhc2UgMTogLy9FdmVudC5DQVBUVVJJTkdfUEhBU0U6XG4gICAgICBsaXN0ZW5lckxpc3QgPSB0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMjogLy9FdmVudC5BVF9UQVJHRVQ6XG4gICAgICBpZiAodGhpcy5saXN0ZW5lck1hcFswXSAmJiB0aGlzLmxpc3RlbmVyTWFwWzBdW3R5cGVdKSBsaXN0ZW5lckxpc3QgPSBsaXN0ZW5lckxpc3QuY29uY2F0KHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV0pO1xuICAgICAgaWYgKHRoaXMubGlzdGVuZXJNYXBbMV0gJiYgdGhpcy5saXN0ZW5lck1hcFsxXVt0eXBlXSkgbGlzdGVuZXJMaXN0ID0gbGlzdGVuZXJMaXN0LmNvbmNhdCh0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdKTtcbiAgICBicmVhaztcbiAgICBjYXNlIDM6IC8vRXZlbnQuQlVCQkxJTkdfUEhBU0U6XG4gICAgICBsaXN0ZW5lckxpc3QgPSB0aGlzLmxpc3RlbmVyTWFwWzBdW3R5cGVdO1xuICAgIGJyZWFrO1xuICB9XG5cbiAgLy8gTmVlZCB0byBjb250aW51b3VzbHkgY2hlY2tcbiAgLy8gdGhhdCB0aGUgc3BlY2lmaWMgbGlzdCBpc1xuICAvLyBzdGlsbCBwb3B1bGF0ZWQgaW4gY2FzZSBvbmVcbiAgLy8gb2YgdGhlIGNhbGxiYWNrcyBhY3R1YWxseVxuICAvLyBjYXVzZXMgdGhlIGxpc3QgdG8gYmUgZGVzdHJveWVkLlxuICBsID0gbGlzdGVuZXJMaXN0Lmxlbmd0aDtcbiAgd2hpbGUgKHRhcmdldCAmJiBsKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgbGlzdGVuZXIgPSBsaXN0ZW5lckxpc3RbaV07XG5cbiAgICAgIC8vIEJhaWwgZnJvbSB0aGlzIGxvb3AgaWZcbiAgICAgIC8vIHRoZSBsZW5ndGggY2hhbmdlZCBhbmRcbiAgICAgIC8vIG5vIG1vcmUgbGlzdGVuZXJzIGFyZVxuICAgICAgLy8gZGVmaW5lZCBiZXR3ZWVuIGkgYW5kIGwuXG4gICAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBmb3IgbWF0Y2ggYW5kIGZpcmVcbiAgICAgIC8vIHRoZSBldmVudCBpZiB0aGVyZSdzIG9uZVxuICAgICAgLy9cbiAgICAgIC8vIFRPRE86TUNHOjIwMTIwMTE3OiBOZWVkIGEgd2F5XG4gICAgICAvLyB0byBjaGVjayBpZiBldmVudCNzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb25cbiAgICAgIC8vIHdhcyBjYWxsZWQuIElmIHNvLCBicmVhayBib3RoIGxvb3BzLlxuICAgICAgaWYgKGxpc3RlbmVyLm1hdGNoZXIuY2FsbCh0YXJnZXQsIGxpc3RlbmVyLm1hdGNoZXJQYXJhbSwgdGFyZ2V0KSkge1xuICAgICAgICByZXR1cm5lZCA9IHRoaXMuZmlyZShldmVudCwgdGFyZ2V0LCBsaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIC8vIFN0b3AgcHJvcGFnYXRpb24gdG8gc3Vic2VxdWVudFxuICAgICAgLy8gY2FsbGJhY2tzIGlmIHRoZSBjYWxsYmFjayByZXR1cm5lZFxuICAgICAgLy8gZmFsc2VcbiAgICAgIGlmIChyZXR1cm5lZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgZXZlbnRbRVZFTlRJR05PUkVdID0gdHJ1ZTtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE86TUNHOjIwMTIwMTE3OiBOZWVkIGEgd2F5IHRvXG4gICAgLy8gY2hlY2sgaWYgZXZlbnQjc3RvcFByb3BhZ2F0aW9uXG4gICAgLy8gd2FzIGNhbGxlZC4gSWYgc28sIGJyZWFrIGxvb3BpbmdcbiAgICAvLyB0aHJvdWdoIHRoZSBET00uIFN0b3AgaWYgdGhlXG4gICAgLy8gZGVsZWdhdGlvbiByb290IGhhcyBiZWVuIHJlYWNoZWRcbiAgICBpZiAodGFyZ2V0ID09PSByb290KSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBsID0gbGlzdGVuZXJMaXN0Lmxlbmd0aDtcbiAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50RWxlbWVudDtcbiAgfVxufTtcblxuLyoqXG4gKiBGaXJlIGEgbGlzdGVuZXIgb24gYSB0YXJnZXQuXG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7Tm9kZX0gdGFyZ2V0XG4gKiBAcGFyYW0ge09iamVjdH0gbGlzdGVuZXJcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuZmlyZSA9IGZ1bmN0aW9uKGV2ZW50LCB0YXJnZXQsIGxpc3RlbmVyKSB7XG4gIHJldHVybiBsaXN0ZW5lci5oYW5kbGVyLmNhbGwodGFyZ2V0LCBldmVudCwgdGFyZ2V0KTtcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50XG4gKiBtYXRjaGVzIGEgZ2VuZXJpYyBzZWxlY3Rvci5cbiAqXG4gKiBAdHlwZSBmdW5jdGlvbigpXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3IgQSBDU1Mgc2VsZWN0b3JcbiAqL1xudmFyIG1hdGNoZXMgPSAoZnVuY3Rpb24oZWwpIHtcbiAgaWYgKCFlbCkgcmV0dXJuO1xuICB2YXIgcCA9IGVsLnByb3RvdHlwZTtcbiAgcmV0dXJuIChwLm1hdGNoZXMgfHwgcC5tYXRjaGVzU2VsZWN0b3IgfHwgcC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgcC5tb3pNYXRjaGVzU2VsZWN0b3IgfHwgcC5tc01hdGNoZXNTZWxlY3RvciB8fCBwLm9NYXRjaGVzU2VsZWN0b3IpO1xufShFbGVtZW50KSk7XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50XG4gKiBtYXRjaGVzIGEgdGFnIHNlbGVjdG9yLlxuICpcbiAqIFRhZ3MgYXJlIE5PVCBjYXNlLXNlbnNpdGl2ZSxcbiAqIGV4Y2VwdCBpbiBYTUwgKGFuZCBYTUwtYmFzZWRcbiAqIGxhbmd1YWdlcyBzdWNoIGFzIFhIVE1MKS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnTmFtZSBUaGUgdGFnIG5hbWUgdG8gdGVzdCBhZ2FpbnN0XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gdGVzdCB3aXRoXG4gKiBAcmV0dXJucyBib29sZWFuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoZXNUYWcodGFnTmFtZSwgZWxlbWVudCkge1xuICByZXR1cm4gdGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgdGhlIHJvb3QuXG4gKlxuICogQHBhcmFtIHs/U3RyaW5nfSBzZWxlY3RvciBJbiB0aGlzIGNhc2UgdGhpcyBpcyBhbHdheXMgcGFzc2VkIHRocm91Z2ggYXMgbnVsbCBhbmQgbm90IHVzZWRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc1Jvb3Qoc2VsZWN0b3IsIGVsZW1lbnQpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUqL1xuICBpZiAodGhpcy5yb290RWxlbWVudCA9PT0gd2luZG93KSByZXR1cm4gZWxlbWVudCA9PT0gZG9jdW1lbnQ7XG4gIHJldHVybiB0aGlzLnJvb3RFbGVtZW50ID09PSBlbGVtZW50O1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIElEIG9mXG4gKiB0aGUgZWxlbWVudCBpbiAndGhpcydcbiAqIG1hdGNoZXMgdGhlIGdpdmVuIElELlxuICpcbiAqIElEcyBhcmUgY2FzZS1zZW5zaXRpdmUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlkIFRoZSBJRCB0byB0ZXN0IGFnYWluc3RcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc0lkKGlkLCBlbGVtZW50KSB7XG4gIHJldHVybiBpZCA9PT0gZWxlbWVudC5pZDtcbn1cblxuLyoqXG4gKiBTaG9ydCBoYW5kIGZvciBvZmYoKVxuICogYW5kIHJvb3QoKSwgaWUgYm90aFxuICogd2l0aCBubyBwYXJhbWV0ZXJzXG4gKlxuICogQHJldHVybiB2b2lkXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub2ZmKCk7XG4gIHRoaXMucm9vdCgpO1xufTtcbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSwgbm9kZTp0cnVlKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBwcmVzZXJ2ZSBDcmVhdGUgYW5kIG1hbmFnZSBhIERPTSBldmVudCBkZWxlZ2F0b3IuXG4gKlxuICogQHZlcnNpb24gMC4zLjBcbiAqIEBjb2RpbmdzdGFuZGFyZCBmdGxhYnMtanN2MlxuICogQGNvcHlyaWdodCBUaGUgRmluYW5jaWFsIFRpbWVzIExpbWl0ZWQgW0FsbCBSaWdodHMgUmVzZXJ2ZWRdXG4gKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoc2VlIExJQ0VOU0UudHh0KVxuICovXG52YXIgRGVsZWdhdGUgPSByZXF1aXJlKCcuL2RlbGVnYXRlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocm9vdCkge1xuICByZXR1cm4gbmV3IERlbGVnYXRlKHJvb3QpO1xufTtcblxubW9kdWxlLmV4cG9ydHMuRGVsZWdhdGUgPSBEZWxlZ2F0ZTtcbiIsInZhciBGcmVlemVyID0gcmVxdWlyZSgnLi9zcmMvZnJlZXplcicpO1xubW9kdWxlLmV4cG9ydHMgPSBGcmVlemVyOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBVdGlscyA9IHJlcXVpcmUoICcuL3V0aWxzJyApO1xyXG5cclxuXHJcblxyXG4vLyNidWlsZFxyXG5cclxuXHJcbnZhciBCRUZPUkVBTEwgPSAnYmVmb3JlQWxsJyxcclxuXHRBRlRFUkFMTCA9ICdhZnRlckFsbCdcclxuO1xyXG52YXIgc3BlY2lhbEV2ZW50cyA9IFtCRUZPUkVBTEwsIEFGVEVSQUxMXTtcclxuXHJcbi8vIFRoZSBwcm90b3R5cGUgbWV0aG9kcyBhcmUgc3RvcmVkIGluIGEgZGlmZmVyZW50IG9iamVjdFxyXG4vLyBhbmQgYXBwbGllZCBhcyBub24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGxhdGVyXHJcbnZhciBlbWl0dGVyUHJvdG8gPSB7XHJcblx0b246IGZ1bmN0aW9uKCBldmVudE5hbWUsIGxpc3RlbmVyLCBvbmNlICl7XHJcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzWyBldmVudE5hbWUgXSB8fCBbXTtcclxuXHJcblx0XHRsaXN0ZW5lcnMucHVzaCh7IGNhbGxiYWNrOiBsaXN0ZW5lciwgb25jZTogb25jZX0pO1xyXG5cdFx0dGhpcy5fZXZlbnRzWyBldmVudE5hbWUgXSA9ICBsaXN0ZW5lcnM7XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0b25jZTogZnVuY3Rpb24oIGV2ZW50TmFtZSwgbGlzdGVuZXIgKXtcclxuXHRcdHJldHVybiB0aGlzLm9uKCBldmVudE5hbWUsIGxpc3RlbmVyLCB0cnVlICk7XHJcblx0fSxcclxuXHJcblx0b2ZmOiBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApe1xyXG5cdFx0aWYoIHR5cGVvZiBldmVudE5hbWUgPT0gJ3VuZGVmaW5lZCcgKXtcclxuXHRcdFx0dGhpcy5fZXZlbnRzID0ge307XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmKCB0eXBlb2YgbGlzdGVuZXIgPT0gJ3VuZGVmaW5lZCcgKSB7XHJcblx0XHRcdHRoaXMuX2V2ZW50c1sgZXZlbnROYW1lIF0gPSBbXTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzWyBldmVudE5hbWUgXSB8fCBbXSxcclxuXHRcdFx0XHRpXHJcblx0XHRcdDtcclxuXHJcblx0XHRcdGZvciAoaSA9IGxpc3RlbmVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG5cdFx0XHRcdGlmKCBsaXN0ZW5lcnNbaV0uY2FsbGJhY2sgPT09IGxpc3RlbmVyIClcclxuXHRcdFx0XHRcdGxpc3RlbmVycy5zcGxpY2UoIGksIDEgKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHRyaWdnZXI6IGZ1bmN0aW9uKCBldmVudE5hbWUgKXtcclxuXHRcdHZhciBhcmdzID0gW10uc2xpY2UuY2FsbCggYXJndW1lbnRzLCAxICksXHJcblx0XHRcdGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1sgZXZlbnROYW1lIF0gfHwgW10sXHJcblx0XHRcdG9uY2VMaXN0ZW5lcnMgPSBbXSxcclxuXHRcdFx0c3BlY2lhbCA9IHNwZWNpYWxFdmVudHMuaW5kZXhPZiggZXZlbnROYW1lICkgIT0gLTEsXHJcblx0XHRcdGksIGxpc3RlbmVyLCByZXR1cm5WYWx1ZSwgbGFzdFZhbHVlXHJcblx0XHQ7XHJcblxyXG5cdFx0c3BlY2lhbCB8fCB0aGlzLnRyaWdnZXIuYXBwbHkoIHRoaXMsIFtCRUZPUkVBTEwsIGV2ZW50TmFtZV0uY29uY2F0KCBhcmdzICkgKTtcclxuXHJcblx0XHQvLyBDYWxsIGxpc3RlbmVyc1xyXG5cdFx0Zm9yIChpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRsaXN0ZW5lciA9IGxpc3RlbmVyc1tpXTtcclxuXHJcblx0XHRcdGlmKCBsaXN0ZW5lci5jYWxsYmFjayApXHJcblx0XHRcdFx0bGFzdFZhbHVlID0gbGlzdGVuZXIuY2FsbGJhY2suYXBwbHkoIHRoaXMsIGFyZ3MgKTtcclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Ly8gSWYgdGhlcmUgaXMgbm90IGEgY2FsbGJhY2ssIHJlbW92ZSFcclxuXHRcdFx0XHRsaXN0ZW5lci5vbmNlID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYoIGxpc3RlbmVyLm9uY2UgKVxyXG5cdFx0XHRcdG9uY2VMaXN0ZW5lcnMucHVzaCggaSApO1xyXG5cclxuXHRcdFx0aWYoIGxhc3RWYWx1ZSAhPT0gdW5kZWZpbmVkICl7XHJcblx0XHRcdFx0cmV0dXJuVmFsdWUgPSBsYXN0VmFsdWU7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHQvLyBSZW1vdmUgbGlzdGVuZXJzIG1hcmtlZCBhcyBvbmNlXHJcblx0XHRmb3IoIGkgPSBvbmNlTGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICl7XHJcblx0XHRcdGxpc3RlbmVycy5zcGxpY2UoIG9uY2VMaXN0ZW5lcnNbaV0sIDEgKTtcclxuXHRcdH1cclxuXHJcblx0XHRzcGVjaWFsIHx8IHRoaXMudHJpZ2dlci5hcHBseSggdGhpcywgW0FGVEVSQUxMLCBldmVudE5hbWVdLmNvbmNhdCggYXJncyApICk7XHJcblxyXG5cdFx0cmV0dXJuIHJldHVyblZhbHVlO1xyXG5cdH1cclxufTtcclxuXHJcbi8vIE1ldGhvZHMgYXJlIG5vdCBlbnVtZXJhYmxlIHNvLCB3aGVuIHRoZSBzdG9yZXMgYXJlXHJcbi8vIGV4dGVuZGVkIHdpdGggdGhlIGVtaXR0ZXIsIHRoZXkgY2FuIGJlIGl0ZXJhdGVkIGFzXHJcbi8vIGhhc2htYXBzXHJcbnZhciBFbWl0dGVyID0gVXRpbHMuY3JlYXRlTm9uRW51bWVyYWJsZSggZW1pdHRlclByb3RvICk7XHJcbi8vI2J1aWxkXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEVtaXR0ZXI7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBVdGlscyA9IHJlcXVpcmUoICcuL3V0aWxzLmpzJyApLFxyXG5cdEVtaXR0ZXIgPSByZXF1aXJlKCAnLi9lbWl0dGVyJyApLFxyXG5cdEZyb3plbiA9IHJlcXVpcmUoICcuL2Zyb3plbicgKVxyXG47XHJcblxyXG4vLyNidWlsZFxyXG52YXIgRnJlZXplciA9IGZ1bmN0aW9uKCBpbml0aWFsVmFsdWUsIG9wdGlvbnMgKSB7XHJcblx0dmFyIG1lID0gdGhpcyxcclxuXHRcdG9wcyA9IG9wdGlvbnMgfHwge30sXHJcblx0XHRzdG9yZSA9IHtcclxuXHRcdFx0bGl2ZTogb3BzLmxpdmUgfHwgZmFsc2UsXHJcblx0XHRcdGZyZWV6ZUluc3RhbmNlczogb3BzLmZyZWV6ZUluc3RhbmNlcyB8fCBmYWxzZVxyXG5cdFx0fVxyXG5cdDtcclxuXHJcblx0Ly8gSW1tdXRhYmxlIGRhdGFcclxuXHR2YXIgZnJvemVuO1xyXG5cdHZhciBwaXZvdFRyaWdnZXJzID0gW10sIHBpdm90VGlja2luZyA9IDA7XHJcblx0dmFyIHRyaWdnZXJOb3cgPSBmdW5jdGlvbiggbm9kZSApe1xyXG5cdFx0dmFyIF8gPSBub2RlLl9fLFxyXG5cdFx0XHRpXHJcblx0XHQ7XHJcblxyXG5cdFx0aWYoIF8ubGlzdGVuZXIgKXtcclxuXHRcdFx0dmFyIHByZXZTdGF0ZSA9IF8ubGlzdGVuZXIucHJldlN0YXRlIHx8IG5vZGU7XHJcblx0XHRcdF8ubGlzdGVuZXIucHJldlN0YXRlID0gMDtcclxuXHRcdFx0RnJvemVuLnRyaWdnZXIoIHByZXZTdGF0ZSwgJ3VwZGF0ZScsIG5vZGUsIHRydWUgKTtcclxuXHRcdH1cclxuXHJcblx0XHRmb3IgKGkgPSAwOyBpIDwgXy5wYXJlbnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdF8uc3RvcmUubm90aWZ5KCAnbm93JywgXy5wYXJlbnRzW2ldICk7XHJcblx0XHR9XHJcblx0fTtcclxuXHJcblx0dmFyIGFkZFRvUGl2b3RUcmlnZ2VycyA9IGZ1bmN0aW9uKCBub2RlICl7XHJcblx0XHRwaXZvdFRyaWdnZXJzLnB1c2goIG5vZGUgKTtcclxuXHRcdGlmKCAhcGl2b3RUaWNraW5nICl7XHJcblx0XHRcdHBpdm90VGlja2luZyA9IDE7XHJcblx0XHRcdFV0aWxzLm5leHRUaWNrKCBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdHBpdm90VHJpZ2dlcnMgPSBbXTtcclxuXHRcdFx0XHRwaXZvdFRpY2tpbmcgPSAwO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHRzdG9yZS5ub3RpZnkgPSBmdW5jdGlvbiBub3RpZnkoIGV2ZW50TmFtZSwgbm9kZSwgb3B0aW9ucyApe1xyXG5cdFx0aWYoIGV2ZW50TmFtZSA9PSAnbm93JyApe1xyXG5cdFx0XHRpZiggcGl2b3RUcmlnZ2Vycy5sZW5ndGggKXtcclxuXHRcdFx0XHR3aGlsZSggcGl2b3RUcmlnZ2Vycy5sZW5ndGggKXtcclxuXHRcdFx0XHRcdHRyaWdnZXJOb3coIHBpdm90VHJpZ2dlcnMuc2hpZnQoKSApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHR0cmlnZ2VyTm93KCBub2RlICk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBub2RlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciB1cGRhdGUgPSBGcm96ZW5bZXZlbnROYW1lXSggbm9kZSwgb3B0aW9ucyApO1xyXG5cclxuXHRcdGlmKCBldmVudE5hbWUgIT0gJ3Bpdm90JyApe1xyXG5cdFx0XHR2YXIgcGl2b3QgPSBVdGlscy5maW5kUGl2b3QoIHVwZGF0ZSApO1xyXG5cdFx0XHRpZiggcGl2b3QgKSB7XHJcblx0XHRcdFx0YWRkVG9QaXZvdFRyaWdnZXJzKCB1cGRhdGUgKTtcclxuXHQgIFx0XHRyZXR1cm4gcGl2b3Q7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdXBkYXRlO1xyXG5cdH07XHJcblxyXG5cdHN0b3JlLmZyZWV6ZUZuID0gb3BzLm11dGFibGUgPT09IHRydWUgP1xyXG5cdFx0ZnVuY3Rpb24oKXt9IDpcclxuXHRcdGZ1bmN0aW9uKCBvYmogKXsgT2JqZWN0LmZyZWV6ZSggb2JqICk7IH1cclxuXHQ7XHJcblxyXG5cdC8vIENyZWF0ZSB0aGUgZnJvemVuIG9iamVjdFxyXG5cdGZyb3plbiA9IEZyb3plbi5mcmVlemUoIGluaXRpYWxWYWx1ZSwgc3RvcmUgKTtcclxuXHRmcm96ZW4uX18udXBkYXRlUm9vdCA9IGZ1bmN0aW9uKCBwcmV2Tm9kZSwgdXBkYXRlZCApe1xyXG5cdFx0aWYoIHByZXZOb2RlID09PSBmcm96ZW4gKXtcclxuXHRcdFx0ZnJvemVuID0gdXBkYXRlZDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIExpc3RlbiB0byBpdHMgY2hhbmdlcyBpbW1lZGlhdGVseVxyXG5cdHZhciBsaXN0ZW5lciA9IGZyb3plbi5nZXRMaXN0ZW5lcigpLFxyXG5cdFx0aHViID0ge31cclxuXHQ7XHJcblxyXG5cdFV0aWxzLmVhY2goWydvbicsICdvZmYnLCAnb25jZScsICd0cmlnZ2VyJ10sIGZ1bmN0aW9uKCBtZXRob2QgKXtcclxuXHRcdHZhciBhdHRycyA9IHt9O1xyXG5cdFx0YXR0cnNbIG1ldGhvZCBdID0gbGlzdGVuZXJbbWV0aG9kXS5iaW5kKGxpc3RlbmVyKTtcclxuXHRcdFV0aWxzLmFkZE5FKCBtZSwgYXR0cnMgKTtcclxuXHRcdFV0aWxzLmFkZE5FKCBodWIsIGF0dHJzICk7XHJcblx0fSk7XHJcblxyXG5cdFV0aWxzLmFkZE5FKCB0aGlzLCB7XHJcblx0XHRnZXQ6IGZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmcm96ZW47XHJcblx0XHR9LFxyXG5cdFx0c2V0OiBmdW5jdGlvbiggbm9kZSApe1xyXG5cdFx0XHRmcm96ZW4ucmVzZXQoIG5vZGUgKTtcclxuXHRcdH0sXHJcblx0XHRnZXRFdmVudEh1YjogZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIGh1YjtcclxuXHRcdH1cclxuXHR9KTtcclxuXHJcblx0VXRpbHMuYWRkTkUoIHRoaXMsIHsgZ2V0RGF0YTogdGhpcy5nZXQsIHNldERhdGE6IHRoaXMuc2V0IH0gKTtcclxufTtcclxuXHJcbi8vI2J1aWxkXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZyZWV6ZXI7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBVdGlscyA9IHJlcXVpcmUoICcuL3V0aWxzJyApLFxyXG5cdG5vZGVDcmVhdG9yID0gcmVxdWlyZSggJy4vbm9kZUNyZWF0b3InKSxcclxuXHRFbWl0dGVyID0gcmVxdWlyZSgnLi9lbWl0dGVyJylcclxuO1xyXG5cclxuLy8jYnVpbGRcclxudmFyIEZyb3plbiA9IHtcclxuXHRmcmVlemU6IGZ1bmN0aW9uKCBub2RlLCBzdG9yZSApe1xyXG5cdFx0aWYoIG5vZGUgJiYgbm9kZS5fXyApe1xyXG5cdFx0XHRyZXR1cm4gbm9kZTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHRmcm96ZW4gPSBub2RlQ3JlYXRvci5jbG9uZShub2RlKVxyXG5cdFx0O1xyXG5cclxuXHRcdFV0aWxzLmFkZE5FKCBmcm96ZW4sIHsgX186IHtcclxuXHRcdFx0bGlzdGVuZXI6IGZhbHNlLFxyXG5cdFx0XHRwYXJlbnRzOiBbXSxcclxuXHRcdFx0c3RvcmU6IHN0b3JlXHJcblx0XHR9fSk7XHJcblxyXG5cdFx0Ly8gRnJlZXplIGNoaWxkcmVuXHJcblx0XHRVdGlscy5lYWNoKCBub2RlLCBmdW5jdGlvbiggY2hpbGQsIGtleSApe1xyXG5cdFx0XHRpZiggIVV0aWxzLmlzTGVhZiggY2hpbGQsIHN0b3JlLmZyZWV6ZUluc3RhbmNlcyApICl7XHJcblx0XHRcdFx0Y2hpbGQgPSBtZS5mcmVlemUoIGNoaWxkLCBzdG9yZSApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiggY2hpbGQgJiYgY2hpbGQuX18gKXtcclxuXHRcdFx0XHRtZS5hZGRQYXJlbnQoIGNoaWxkLCBmcm96ZW4gKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnJvemVuWyBrZXkgXSA9IGNoaWxkO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0c3RvcmUuZnJlZXplRm4oIGZyb3plbiApO1xyXG5cclxuXHRcdHJldHVybiBmcm96ZW47XHJcblx0fSxcclxuXHJcblx0bWVyZ2U6IGZ1bmN0aW9uKCBub2RlLCBhdHRycyApe1xyXG5cdFx0dmFyIF8gPSBub2RlLl9fLFxyXG5cdFx0XHR0cmFucyA9IF8udHJhbnMsXHJcblxyXG5cdFx0XHQvLyBDbG9uZSB0aGUgYXR0cnMgdG8gbm90IG1vZGlmeSB0aGUgYXJndW1lbnRcclxuXHRcdFx0YXR0cnMgPSBVdGlscy5leHRlbmQoIHt9LCBhdHRycylcclxuXHRcdDtcclxuXHJcblx0XHRpZiggdHJhbnMgKXtcclxuXHRcdFx0Zm9yKCB2YXIgYXR0ciBpbiBhdHRycyApXHJcblx0XHRcdFx0dHJhbnNbIGF0dHIgXSA9IGF0dHJzWyBhdHRyIF07XHJcblx0XHRcdHJldHVybiBub2RlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdGZyb3plbiA9IHRoaXMuY29weU1ldGEoIG5vZGUgKSxcclxuXHRcdFx0c3RvcmUgPSBfLnN0b3JlLFxyXG5cdFx0XHR2YWwsIGtleSwgaXNGcm96ZW5cclxuXHRcdDtcclxuXHJcblx0XHRVdGlscy5lYWNoKCBub2RlLCBmdW5jdGlvbiggY2hpbGQsIGtleSApe1xyXG5cdFx0XHRpc0Zyb3plbiA9IGNoaWxkICYmIGNoaWxkLl9fO1xyXG5cclxuXHRcdFx0aWYoIGlzRnJvemVuICl7XHJcblx0XHRcdFx0bWUucmVtb3ZlUGFyZW50KCBjaGlsZCwgbm9kZSApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YWwgPSBhdHRyc1sga2V5IF07XHJcblx0XHRcdGlmKCAhdmFsICl7XHJcblx0XHRcdFx0aWYoIGlzRnJvemVuIClcclxuXHRcdFx0XHRcdG1lLmFkZFBhcmVudCggY2hpbGQsIGZyb3plbiApO1xyXG5cdFx0XHRcdHJldHVybiBmcm96ZW5bIGtleSBdID0gY2hpbGQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmKCAhVXRpbHMuaXNMZWFmKCB2YWwsIHN0b3JlLmZyZWV6ZUluc3RhbmNlcyApIClcclxuXHRcdFx0XHR2YWwgPSBtZS5mcmVlemUoIHZhbCwgc3RvcmUgKTtcclxuXHJcblx0XHRcdGlmKCB2YWwgJiYgdmFsLl9fIClcclxuXHRcdFx0XHRtZS5hZGRQYXJlbnQoIHZhbCwgZnJvemVuICk7XHJcblxyXG5cdFx0XHRkZWxldGUgYXR0cnNbIGtleSBdO1xyXG5cclxuXHRcdFx0ZnJvemVuWyBrZXkgXSA9IHZhbDtcclxuXHRcdH0pO1xyXG5cclxuXHJcblx0XHRmb3IoIGtleSBpbiBhdHRycyApIHtcclxuXHRcdFx0dmFsID0gYXR0cnNbIGtleSBdO1xyXG5cclxuXHRcdFx0aWYoICFVdGlscy5pc0xlYWYoIHZhbCwgc3RvcmUuZnJlZXplSW5zdGFuY2VzICkgKVxyXG5cdFx0XHRcdHZhbCA9IG1lLmZyZWV6ZSggdmFsLCBzdG9yZSApO1xyXG5cclxuXHRcdFx0aWYoIHZhbCAmJiB2YWwuX18gKVxyXG5cdFx0XHRcdG1lLmFkZFBhcmVudCggdmFsLCBmcm96ZW4gKTtcclxuXHJcblx0XHRcdGZyb3plblsga2V5IF0gPSB2YWw7XHJcblx0XHR9XHJcblxyXG5cdFx0Xy5zdG9yZS5mcmVlemVGbiggZnJvemVuICk7XHJcblxyXG5cdFx0dGhpcy5yZWZyZXNoUGFyZW50cyggbm9kZSwgZnJvemVuICk7XHJcblxyXG5cdFx0cmV0dXJuIGZyb3plbjtcclxuXHR9LFxyXG5cclxuXHRyZXBsYWNlOiBmdW5jdGlvbiggbm9kZSwgcmVwbGFjZW1lbnQgKSB7XHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHRfID0gbm9kZS5fXyxcclxuXHRcdFx0ZnJvemVuID0gcmVwbGFjZW1lbnRcclxuXHRcdDtcclxuXHJcblx0XHRpZiggIVV0aWxzLmlzTGVhZiggcmVwbGFjZW1lbnQsIF8uc3RvcmUuZnJlZXplSW5zdGFuY2VzICkgKSB7XHJcblxyXG5cdFx0XHRmcm96ZW4gPSBtZS5mcmVlemUoIHJlcGxhY2VtZW50LCBfLnN0b3JlICk7XHJcblx0XHRcdGZyb3plbi5fXy5wYXJlbnRzID0gXy5wYXJlbnRzO1xyXG5cdFx0XHRmcm96ZW4uX18udXBkYXRlUm9vdCA9IF8udXBkYXRlUm9vdDtcclxuXHJcblx0XHRcdC8vIEFkZCB0aGUgY3VycmVudCBsaXN0ZW5lciBpZiBleGlzdHMsIHJlcGxhY2luZyBhXHJcblx0XHRcdC8vIHByZXZpb3VzIGxpc3RlbmVyIGluIHRoZSBmcm96ZW4gaWYgZXhpc3RlZFxyXG5cdFx0XHRpZiggXy5saXN0ZW5lciApXHJcblx0XHRcdFx0ZnJvemVuLl9fLmxpc3RlbmVyID0gXy5saXN0ZW5lcjtcclxuXHRcdH1cclxuXHRcdGlmKCBmcm96ZW4gKXtcclxuXHRcdFx0dGhpcy5maXhDaGlsZHJlbiggZnJvemVuLCBub2RlICk7XHJcblx0XHR9XHJcblx0XHR0aGlzLnJlZnJlc2hQYXJlbnRzKCBub2RlLCBmcm96ZW4gKTtcclxuXHJcblx0XHRyZXR1cm4gZnJvemVuO1xyXG5cdH0sXHJcblxyXG5cdHJlbW92ZTogZnVuY3Rpb24oIG5vZGUsIGF0dHJzICl7XHJcblx0XHR2YXIgdHJhbnMgPSBub2RlLl9fLnRyYW5zO1xyXG5cdFx0aWYoIHRyYW5zICl7XHJcblx0XHRcdGZvciggdmFyIGwgPSBhdHRycy5sZW5ndGggLSAxOyBsID49IDA7IGwtLSApXHJcblx0XHRcdFx0ZGVsZXRlIHRyYW5zWyBhdHRyc1tsXSBdO1xyXG5cdFx0XHRyZXR1cm4gbm9kZTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHRmcm96ZW4gPSB0aGlzLmNvcHlNZXRhKCBub2RlICksXHJcblx0XHRcdGlzRnJvemVuXHJcblx0XHQ7XHJcblxyXG5cdFx0VXRpbHMuZWFjaCggbm9kZSwgZnVuY3Rpb24oIGNoaWxkLCBrZXkgKXtcclxuXHRcdFx0aXNGcm96ZW4gPSBjaGlsZCAmJiBjaGlsZC5fXztcclxuXHJcblx0XHRcdGlmKCBpc0Zyb3plbiApe1xyXG5cdFx0XHRcdG1lLnJlbW92ZVBhcmVudCggY2hpbGQsIG5vZGUgKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYoIGF0dHJzLmluZGV4T2YoIGtleSApICE9IC0xICl7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiggaXNGcm96ZW4gKVxyXG5cdFx0XHRcdG1lLmFkZFBhcmVudCggY2hpbGQsIGZyb3plbiApO1xyXG5cclxuXHRcdFx0ZnJvemVuWyBrZXkgXSA9IGNoaWxkO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0bm9kZS5fXy5zdG9yZS5mcmVlemVGbiggZnJvemVuICk7XHJcblx0XHR0aGlzLnJlZnJlc2hQYXJlbnRzKCBub2RlLCBmcm96ZW4gKTtcclxuXHJcblx0XHRyZXR1cm4gZnJvemVuO1xyXG5cdH0sXHJcblxyXG5cdHNwbGljZTogZnVuY3Rpb24oIG5vZGUsIGFyZ3MgKXtcclxuXHRcdHZhciBfID0gbm9kZS5fXyxcclxuXHRcdFx0dHJhbnMgPSBfLnRyYW5zXHJcblx0XHQ7XHJcblxyXG5cdFx0aWYoIHRyYW5zICl7XHJcblx0XHRcdHRyYW5zLnNwbGljZS5hcHBseSggdHJhbnMsIGFyZ3MgKTtcclxuXHRcdFx0cmV0dXJuIG5vZGU7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIG1lID0gdGhpcyxcclxuXHRcdFx0ZnJvemVuID0gdGhpcy5jb3B5TWV0YSggbm9kZSApLFxyXG5cdFx0XHRpbmRleCA9IGFyZ3NbMF0sXHJcblx0XHRcdGRlbGV0ZUluZGV4ID0gaW5kZXggKyBhcmdzWzFdLFxyXG5cdFx0XHRjaGlsZFxyXG5cdFx0O1xyXG5cclxuXHRcdC8vIENsb25lIHRoZSBhcnJheVxyXG5cdFx0VXRpbHMuZWFjaCggbm9kZSwgZnVuY3Rpb24oIGNoaWxkLCBpICl7XHJcblxyXG5cdFx0XHRpZiggY2hpbGQgJiYgY2hpbGQuX18gKXtcclxuXHRcdFx0XHRtZS5yZW1vdmVQYXJlbnQoIGNoaWxkLCBub2RlICk7XHJcblxyXG5cdFx0XHRcdC8vIFNraXAgdGhlIG5vZGVzIHRvIGRlbGV0ZVxyXG5cdFx0XHRcdGlmKCBpIDwgaW5kZXggfHwgaT49IGRlbGV0ZUluZGV4IClcclxuXHRcdFx0XHRcdG1lLmFkZFBhcmVudCggY2hpbGQsIGZyb3plbiApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmcm96ZW5baV0gPSBjaGlsZDtcclxuXHRcdH0pO1xyXG5cclxuXHRcdC8vIFByZXBhcmUgdGhlIG5ldyBub2Rlc1xyXG5cdFx0aWYoIGFyZ3MubGVuZ3RoID4gMSApe1xyXG5cdFx0XHRmb3IgKHZhciBpID0gYXJncy5sZW5ndGggLSAxOyBpID49IDI7IGktLSkge1xyXG5cdFx0XHRcdGNoaWxkID0gYXJnc1tpXTtcclxuXHJcblx0XHRcdFx0aWYoICFVdGlscy5pc0xlYWYoIGNoaWxkLCBfLnN0b3JlLmZyZWV6ZUluc3RhbmNlcyApIClcclxuXHRcdFx0XHRcdGNoaWxkID0gdGhpcy5mcmVlemUoIGNoaWxkLCBfLnN0b3JlICk7XHJcblxyXG5cdFx0XHRcdGlmKCBjaGlsZCAmJiBjaGlsZC5fXyApXHJcblx0XHRcdFx0XHR0aGlzLmFkZFBhcmVudCggY2hpbGQsIGZyb3plbiApO1xyXG5cclxuXHRcdFx0XHRhcmdzW2ldID0gY2hpbGQ7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHQvLyBzcGxpY2VcclxuXHRcdEFycmF5LnByb3RvdHlwZS5zcGxpY2UuYXBwbHkoIGZyb3plbiwgYXJncyApO1xyXG5cclxuXHRcdF8uc3RvcmUuZnJlZXplRm4oIGZyb3plbiApO1xyXG5cdFx0dGhpcy5yZWZyZXNoUGFyZW50cyggbm9kZSwgZnJvemVuICk7XHJcblxyXG5cdFx0cmV0dXJuIGZyb3plbjtcclxuXHR9LFxyXG5cclxuXHR0cmFuc2FjdDogZnVuY3Rpb24oIG5vZGUgKSB7XHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHR0cmFuc2FjdGluZyA9IG5vZGUuX18udHJhbnMsXHJcblx0XHRcdHRyYW5zXHJcblx0XHQ7XHJcblxyXG5cdFx0aWYoIHRyYW5zYWN0aW5nIClcclxuXHRcdFx0cmV0dXJuIHRyYW5zYWN0aW5nO1xyXG5cclxuXHRcdHRyYW5zID0gbm9kZS5jb25zdHJ1Y3RvciA9PSBBcnJheSA/IFtdIDoge307XHJcblxyXG5cdFx0VXRpbHMuZWFjaCggbm9kZSwgZnVuY3Rpb24oIGNoaWxkLCBrZXkgKXtcclxuXHRcdFx0dHJhbnNbIGtleSBdID0gY2hpbGQ7XHJcblx0XHR9KTtcclxuXHJcblx0XHRub2RlLl9fLnRyYW5zID0gdHJhbnM7XHJcblxyXG5cdFx0Ly8gQ2FsbCBydW4gYXV0b21hdGljYWxseSBpbiBjYXNlXHJcblx0XHQvLyB0aGUgdXNlciBmb3Jnb3QgYWJvdXQgaXRcclxuXHRcdFV0aWxzLm5leHRUaWNrKCBmdW5jdGlvbigpe1xyXG5cdFx0XHRpZiggbm9kZS5fXy50cmFucyApXHJcblx0XHRcdFx0bWUucnVuKCBub2RlICk7XHJcblx0XHR9KTtcclxuXHJcblx0XHRyZXR1cm4gdHJhbnM7XHJcblx0fSxcclxuXHJcblx0cnVuOiBmdW5jdGlvbiggbm9kZSApIHtcclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdHRyYW5zID0gbm9kZS5fXy50cmFuc1xyXG5cdFx0O1xyXG5cclxuXHRcdGlmKCAhdHJhbnMgKVxyXG5cdFx0XHRyZXR1cm4gbm9kZTtcclxuXHJcblx0XHQvLyBSZW1vdmUgdGhlIG5vZGUgYXMgYSBwYXJlbnRcclxuXHRcdFV0aWxzLmVhY2goIHRyYW5zLCBmdW5jdGlvbiggY2hpbGQsIGtleSApe1xyXG5cdFx0XHRpZiggY2hpbGQgJiYgY2hpbGQuX18gKXtcclxuXHRcdFx0XHRtZS5yZW1vdmVQYXJlbnQoIGNoaWxkLCBub2RlICk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cclxuXHRcdGRlbGV0ZSBub2RlLl9fLnRyYW5zO1xyXG5cclxuXHRcdHZhciByZXN1bHQgPSB0aGlzLnJlcGxhY2UoIG5vZGUsIHRyYW5zICk7XHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH0sXHJcblxyXG5cdHBpdm90OiBmdW5jdGlvbiggbm9kZSApe1xyXG5cdFx0bm9kZS5fXy5waXZvdCA9IDE7XHJcblx0XHR0aGlzLnVucGl2b3QoIG5vZGUgKTtcclxuXHRcdHJldHVybiBub2RlO1xyXG5cdH0sXHJcblxyXG5cdHVucGl2b3Q6IGZ1bmN0aW9uKCBub2RlICl7XHJcblx0XHRVdGlscy5uZXh0VGljayggZnVuY3Rpb24oKXtcclxuXHRcdFx0bm9kZS5fXy5waXZvdCA9IDA7XHJcblx0XHR9KTtcclxuXHR9LFxyXG5cclxuXHRyZWZyZXNoOiBmdW5jdGlvbiggbm9kZSwgb2xkQ2hpbGQsIG5ld0NoaWxkICl7XHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHR0cmFucyA9IG5vZGUuX18udHJhbnMsXHJcblx0XHRcdGZvdW5kID0gMFxyXG5cdFx0O1xyXG5cclxuXHRcdGlmKCB0cmFucyApe1xyXG5cclxuXHRcdFx0VXRpbHMuZWFjaCggdHJhbnMsIGZ1bmN0aW9uKCBjaGlsZCwga2V5ICl7XHJcblx0XHRcdFx0aWYoIGZvdW5kICkgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHRpZiggY2hpbGQgPT09IG9sZENoaWxkICl7XHJcblxyXG5cdFx0XHRcdFx0dHJhbnNbIGtleSBdID0gbmV3Q2hpbGQ7XHJcblx0XHRcdFx0XHRmb3VuZCA9IDE7XHJcblxyXG5cdFx0XHRcdFx0aWYoIG5ld0NoaWxkICYmIG5ld0NoaWxkLl9fIClcclxuXHRcdFx0XHRcdFx0bWUuYWRkUGFyZW50KCBuZXdDaGlsZCwgbm9kZSApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRyZXR1cm4gbm9kZTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZnJvemVuID0gdGhpcy5jb3B5TWV0YSggbm9kZSApLFxyXG5cdFx0XHRyZXBsYWNlbWVudCwgX19cclxuXHRcdDtcclxuXHJcblx0XHRVdGlscy5lYWNoKCBub2RlLCBmdW5jdGlvbiggY2hpbGQsIGtleSApe1xyXG5cdFx0XHRpZiggY2hpbGQgPT09IG9sZENoaWxkICl7XHJcblx0XHRcdFx0Y2hpbGQgPSBuZXdDaGlsZDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYoIGNoaWxkICYmIChfXyA9IGNoaWxkLl9fKSApe1xyXG5cdFx0XHRcdG1lLnJlbW92ZVBhcmVudCggY2hpbGQsIG5vZGUgKTtcclxuXHRcdFx0XHRtZS5hZGRQYXJlbnQoIGNoaWxkLCBmcm96ZW4gKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnJvemVuWyBrZXkgXSA9IGNoaWxkO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0bm9kZS5fXy5zdG9yZS5mcmVlemVGbiggZnJvemVuICk7XHJcblxyXG5cdFx0dGhpcy5yZWZyZXNoUGFyZW50cyggbm9kZSwgZnJvemVuICk7XHJcblx0fSxcclxuXHJcblx0Zml4Q2hpbGRyZW46IGZ1bmN0aW9uKCBub2RlLCBvbGROb2RlICl7XHJcblx0XHR2YXIgbWUgPSB0aGlzO1xyXG5cdFx0VXRpbHMuZWFjaCggbm9kZSwgZnVuY3Rpb24oIGNoaWxkICl7XHJcblx0XHRcdGlmKCAhY2hpbGQgfHwgIWNoaWxkLl9fIClcclxuXHRcdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0XHQvLyBVcGRhdGUgcGFyZW50cyBpbiBhbGwgY2hpbGRyZW4gbm8gbWF0dGVyIHRoZSBjaGlsZFxyXG5cdFx0XHQvLyBpcyBsaW5rZWQgdG8gdGhlIG5vZGUgb3Igbm90LlxyXG5cdFx0XHRtZS5maXhDaGlsZHJlbiggY2hpbGQgKTtcclxuXHJcblx0XHRcdGlmKCBjaGlsZC5fXy5wYXJlbnRzLmxlbmd0aCA9PSAxIClcclxuXHRcdFx0XHRyZXR1cm4gY2hpbGQuX18ucGFyZW50cyA9IFsgbm9kZSBdO1xyXG5cclxuXHRcdFx0aWYoIG9sZE5vZGUgKVxyXG5cdFx0XHRcdG1lLnJlbW92ZVBhcmVudCggY2hpbGQsIG9sZE5vZGUgKTtcclxuXHJcblx0XHRcdG1lLmFkZFBhcmVudCggY2hpbGQsIG5vZGUgKTtcclxuXHRcdH0pO1xyXG5cdH0sXHJcblxyXG5cdGNvcHlNZXRhOiBmdW5jdGlvbiggbm9kZSApe1xyXG5cdFx0dmFyIG1lID0gdGhpcyxcclxuXHRcdFx0ZnJvemVuID0gbm9kZUNyZWF0b3IuY2xvbmUoIG5vZGUgKSxcclxuXHRcdFx0XyA9IG5vZGUuX19cclxuXHRcdDtcclxuXHJcblx0XHRVdGlscy5hZGRORSggZnJvemVuLCB7X186IHtcclxuXHRcdFx0c3RvcmU6IF8uc3RvcmUsXHJcblx0XHRcdHVwZGF0ZVJvb3Q6IF8udXBkYXRlUm9vdCxcclxuXHRcdFx0bGlzdGVuZXI6IF8ubGlzdGVuZXIsXHJcblx0XHRcdHBhcmVudHM6IF8ucGFyZW50cy5zbGljZSggMCApLFxyXG5cdFx0XHR0cmFuczogXy50cmFucyxcclxuXHRcdFx0cGl2b3Q6IF8ucGl2b3QsXHJcblx0XHR9fSk7XHJcblxyXG5cdFx0aWYoIF8ucGl2b3QgKVxyXG5cdFx0XHR0aGlzLnVucGl2b3QoIGZyb3plbiApO1xyXG5cclxuXHRcdHJldHVybiBmcm96ZW47XHJcblx0fSxcclxuXHJcblx0cmVmcmVzaFBhcmVudHM6IGZ1bmN0aW9uKCBvbGRDaGlsZCwgbmV3Q2hpbGQgKXtcclxuXHRcdHZhciBfID0gb2xkQ2hpbGQuX18sXHJcblx0XHRcdHBhcmVudHMgPSBfLnBhcmVudHMubGVuZ3RoLFxyXG5cdFx0XHRpXHJcblx0XHQ7XHJcblxyXG5cdFx0aWYoIG9sZENoaWxkLl9fLnVwZGF0ZVJvb3QgKXtcclxuXHRcdFx0b2xkQ2hpbGQuX18udXBkYXRlUm9vdCggb2xkQ2hpbGQsIG5ld0NoaWxkICk7XHJcblx0XHR9XHJcblx0XHRpZiggbmV3Q2hpbGQgKXtcclxuXHRcdFx0dGhpcy50cmlnZ2VyKCBvbGRDaGlsZCwgJ3VwZGF0ZScsIG5ld0NoaWxkLCBfLnN0b3JlLmxpdmUgKTtcclxuXHRcdH1cclxuXHRcdGlmKCBwYXJlbnRzICl7XHJcblx0XHRcdGZvciAoaSA9IHBhcmVudHMgLSAxOyBpID49IDA7IGktLSkge1xyXG5cdFx0XHRcdHRoaXMucmVmcmVzaCggXy5wYXJlbnRzW2ldLCBvbGRDaGlsZCwgbmV3Q2hpbGQgKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdHJlbW92ZVBhcmVudDogZnVuY3Rpb24oIG5vZGUsIHBhcmVudCApe1xyXG5cdFx0dmFyIHBhcmVudHMgPSBub2RlLl9fLnBhcmVudHMsXHJcblx0XHRcdGluZGV4ID0gcGFyZW50cy5pbmRleE9mKCBwYXJlbnQgKVxyXG5cdFx0O1xyXG5cclxuXHRcdGlmKCBpbmRleCAhPSAtMSApe1xyXG5cdFx0XHRwYXJlbnRzLnNwbGljZSggaW5kZXgsIDEgKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRhZGRQYXJlbnQ6IGZ1bmN0aW9uKCBub2RlLCBwYXJlbnQgKXtcclxuXHRcdHZhciBwYXJlbnRzID0gbm9kZS5fXy5wYXJlbnRzLFxyXG5cdFx0XHRpbmRleCA9IHBhcmVudHMuaW5kZXhPZiggcGFyZW50IClcclxuXHRcdDtcclxuXHJcblx0XHRpZiggaW5kZXggPT0gLTEgKXtcclxuXHRcdFx0cGFyZW50c1sgcGFyZW50cy5sZW5ndGggXSA9IHBhcmVudDtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHR0cmlnZ2VyOiBmdW5jdGlvbiggbm9kZSwgZXZlbnROYW1lLCBwYXJhbSwgbm93ICl7XHJcblx0XHR2YXIgbGlzdGVuZXIgPSBub2RlLl9fLmxpc3RlbmVyO1xyXG5cdFx0aWYoICFsaXN0ZW5lciApXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHR2YXIgdGlja2luZyA9IGxpc3RlbmVyLnRpY2tpbmc7XHJcblxyXG5cdFx0aWYoIG5vdyApe1xyXG5cdFx0XHRpZiggdGlja2luZyB8fCBwYXJhbSApe1xyXG5cdFx0XHRcdGxpc3RlbmVyLnRpY2tpbmcgPSAwO1xyXG5cdFx0XHRcdGxpc3RlbmVyLnRyaWdnZXIoIGV2ZW50TmFtZSwgdGlja2luZyB8fCBwYXJhbSwgbm9kZSApO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRsaXN0ZW5lci50aWNraW5nID0gcGFyYW07XHJcblx0XHRpZiggIWxpc3RlbmVyLnByZXZTdGF0ZSApe1xyXG5cdFx0XHRsaXN0ZW5lci5wcmV2U3RhdGUgPSBub2RlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmKCAhdGlja2luZyApe1xyXG5cdFx0XHRVdGlscy5uZXh0VGljayggZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRpZiggbGlzdGVuZXIudGlja2luZyApe1xyXG5cdFx0XHRcdFx0dmFyIHVwZGF0ZWQgPSBsaXN0ZW5lci50aWNraW5nLFxyXG5cdFx0XHRcdFx0XHRwcmV2U3RhdGUgPSBsaXN0ZW5lci5wcmV2U3RhdGVcclxuXHRcdFx0XHRcdDtcclxuXHJcblx0XHRcdFx0XHRsaXN0ZW5lci50aWNraW5nID0gMDtcclxuXHRcdFx0XHRcdGxpc3RlbmVyLnByZXZTdGF0ZSA9IDA7XHJcblxyXG5cdFx0XHRcdFx0bGlzdGVuZXIudHJpZ2dlciggZXZlbnROYW1lLCB1cGRhdGVkLCBub2RlICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRjcmVhdGVMaXN0ZW5lcjogZnVuY3Rpb24oIGZyb3plbiApe1xyXG5cdFx0dmFyIGwgPSBmcm96ZW4uX18ubGlzdGVuZXI7XHJcblxyXG5cdFx0aWYoICFsICkge1xyXG5cdFx0XHRsID0gT2JqZWN0LmNyZWF0ZShFbWl0dGVyLCB7XHJcblx0XHRcdFx0X2V2ZW50czoge1xyXG5cdFx0XHRcdFx0dmFsdWU6IHt9LFxyXG5cdFx0XHRcdFx0d3JpdGFibGU6IHRydWVcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0ZnJvemVuLl9fLmxpc3RlbmVyID0gbDtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbDtcclxuXHR9XHJcbn07XHJcblxyXG5ub2RlQ3JlYXRvci5pbml0KCBGcm96ZW4gKTtcclxuLy8jYnVpbGRcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRnJvemVuO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgVXRpbHMgPSByZXF1aXJlKCAnLi91dGlscy5qcycgKTtcclxuXHJcbi8vI2J1aWxkXHJcbnZhciBub2RlQ3JlYXRvciA9IHtcclxuXHRpbml0OiBmdW5jdGlvbiggRnJvemVuICl7XHJcblxyXG5cdFx0dmFyIGNvbW1vbk1ldGhvZHMgPSB7XHJcblx0XHRcdHNldDogZnVuY3Rpb24oIGF0dHIsIHZhbHVlICl7XHJcblx0XHRcdFx0dmFyIGF0dHJzID0gYXR0cixcclxuXHRcdFx0XHRcdHVwZGF0ZSA9IHRoaXMuX18udHJhbnNcclxuXHRcdFx0XHQ7XHJcblxyXG5cdFx0XHRcdGlmKCB0eXBlb2YgYXR0ciAhPSAnb2JqZWN0JyApe1xyXG5cdFx0XHRcdFx0YXR0cnMgPSB7fTtcclxuXHRcdFx0XHRcdGF0dHJzWyBhdHRyIF0gPSB2YWx1ZTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmKCAhdXBkYXRlICl7XHJcblx0XHRcdFx0XHRmb3IoIHZhciBrZXkgaW4gYXR0cnMgKXtcclxuXHRcdFx0XHRcdFx0dXBkYXRlID0gdXBkYXRlIHx8IHRoaXNbIGtleSBdICE9PSBhdHRyc1sga2V5IF07XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Ly8gTm8gY2hhbmdlcywganVzdCByZXR1cm4gdGhlIG5vZGVcclxuXHRcdFx0XHRcdGlmKCAhdXBkYXRlIClcclxuXHRcdFx0XHRcdFx0cmV0dXJuIFV0aWxzLmZpbmRQaXZvdCggdGhpcyApIHx8IHRoaXM7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fXy5zdG9yZS5ub3RpZnkoICdtZXJnZScsIHRoaXMsIGF0dHJzICk7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRyZXNldDogZnVuY3Rpb24oIGF0dHJzICkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3JlcGxhY2UnLCB0aGlzLCBhdHRycyApO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0Z2V0TGlzdGVuZXI6IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0cmV0dXJuIEZyb3plbi5jcmVhdGVMaXN0ZW5lciggdGhpcyApO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0dG9KUzogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHR2YXIganM7XHJcblx0XHRcdFx0aWYoIHRoaXMuY29uc3RydWN0b3IgPT0gQXJyYXkgKXtcclxuXHRcdFx0XHRcdGpzID0gbmV3IEFycmF5KCB0aGlzLmxlbmd0aCApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGpzID0ge307XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRVdGlscy5lYWNoKCB0aGlzLCBmdW5jdGlvbiggY2hpbGQsIGkgKXtcclxuXHRcdFx0XHRcdGlmKCBjaGlsZCAmJiBjaGlsZC5fXyApXHJcblx0XHRcdFx0XHRcdGpzWyBpIF0gPSBjaGlsZC50b0pTKCk7XHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdGpzWyBpIF0gPSBjaGlsZDtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0cmV0dXJuIGpzO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0dHJhbnNhY3Q6IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX18uc3RvcmUubm90aWZ5KCAndHJhbnNhY3QnLCB0aGlzICk7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRydW46IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX18uc3RvcmUubm90aWZ5KCAncnVuJywgdGhpcyApO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0bm93OiBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ25vdycsIHRoaXMgKTtcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHBpdm90OiBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3Bpdm90JywgdGhpcyApO1xyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdHZhciBhcnJheU1ldGhvZHMgPSBVdGlscy5leHRlbmQoe1xyXG5cdFx0XHRwdXNoOiBmdW5jdGlvbiggZWwgKXtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hcHBlbmQoIFtlbF0gKTtcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdGFwcGVuZDogZnVuY3Rpb24oIGVscyApe1xyXG5cdFx0XHRcdGlmKCBlbHMgJiYgZWxzLmxlbmd0aCApXHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5fXy5zdG9yZS5ub3RpZnkoICdzcGxpY2UnLCB0aGlzLCBbdGhpcy5sZW5ndGgsIDBdLmNvbmNhdCggZWxzICkgKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHBvcDogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRpZiggIXRoaXMubGVuZ3RoIClcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fXy5zdG9yZS5ub3RpZnkoICdzcGxpY2UnLCB0aGlzLCBbdGhpcy5sZW5ndGggLTEsIDFdICk7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHR1bnNoaWZ0OiBmdW5jdGlvbiggZWwgKXtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wcmVwZW5kKCBbZWxdICk7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRwcmVwZW5kOiBmdW5jdGlvbiggZWxzICl7XHJcblx0XHRcdFx0aWYoIGVscyAmJiBlbHMubGVuZ3RoIClcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3NwbGljZScsIHRoaXMsIFswLCAwXS5jb25jYXQoIGVscyApICk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRzaGlmdDogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRpZiggIXRoaXMubGVuZ3RoIClcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fXy5zdG9yZS5ub3RpZnkoICdzcGxpY2UnLCB0aGlzLCBbMCwgMV0gKTtcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHNwbGljZTogZnVuY3Rpb24oIGluZGV4LCB0b1JlbW92ZSwgdG9BZGQgKXtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fXy5zdG9yZS5ub3RpZnkoICdzcGxpY2UnLCB0aGlzLCBhcmd1bWVudHMgKTtcclxuXHRcdFx0fVxyXG5cdFx0fSwgY29tbW9uTWV0aG9kcyApO1xyXG5cclxuXHRcdHZhciBGcm96ZW5BcnJheSA9IE9iamVjdC5jcmVhdGUoIEFycmF5LnByb3RvdHlwZSwgVXRpbHMuY3JlYXRlTkUoIGFycmF5TWV0aG9kcyApICk7XHJcblxyXG5cdFx0dmFyIG9iamVjdE1ldGhvZHMgPSBVdGlscy5jcmVhdGVORSggVXRpbHMuZXh0ZW5kKHtcclxuXHRcdFx0cmVtb3ZlOiBmdW5jdGlvbigga2V5cyApe1xyXG5cdFx0XHRcdHZhciBmaWx0ZXJlZCA9IFtdLFxyXG5cdFx0XHRcdFx0ayA9IGtleXNcclxuXHRcdFx0XHQ7XHJcblxyXG5cdFx0XHRcdGlmKCBrZXlzLmNvbnN0cnVjdG9yICE9IEFycmF5IClcclxuXHRcdFx0XHRcdGsgPSBbIGtleXMgXTtcclxuXHJcblx0XHRcdFx0Zm9yKCB2YXIgaSA9IDAsIGwgPSBrLmxlbmd0aDsgaTxsOyBpKysgKXtcclxuXHRcdFx0XHRcdGlmKCB0aGlzLmhhc093blByb3BlcnR5KCBrW2ldICkgKVxyXG5cdFx0XHRcdFx0XHRmaWx0ZXJlZC5wdXNoKCBrW2ldICk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiggZmlsdGVyZWQubGVuZ3RoIClcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3JlbW92ZScsIHRoaXMsIGZpbHRlcmVkICk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdH1cclxuXHRcdH0sIGNvbW1vbk1ldGhvZHMpKTtcclxuXHJcblx0XHR2YXIgRnJvemVuT2JqZWN0ID0gT2JqZWN0LmNyZWF0ZSggT2JqZWN0LnByb3RvdHlwZSwgb2JqZWN0TWV0aG9kcyApO1xyXG5cclxuXHRcdHZhciBjcmVhdGVBcnJheSA9IChmdW5jdGlvbigpe1xyXG5cdFx0XHQvLyBmYXN0IHZlcnNpb25cclxuXHRcdFx0aWYoIFtdLl9fcHJvdG9fXyApXHJcblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCBsZW5ndGggKXtcclxuXHRcdFx0XHRcdHZhciBhcnIgPSBuZXcgQXJyYXkoIGxlbmd0aCApO1xyXG5cdFx0XHRcdFx0YXJyLl9fcHJvdG9fXyA9IEZyb3plbkFycmF5O1xyXG5cdFx0XHRcdFx0cmV0dXJuIGFycjtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBzbG93IHZlcnNpb24gZm9yIG9sZGVyIGJyb3dzZXJzXHJcblx0XHRcdHJldHVybiBmdW5jdGlvbiggbGVuZ3RoICl7XHJcblx0XHRcdFx0dmFyIGFyciA9IG5ldyBBcnJheSggbGVuZ3RoICk7XHJcblxyXG5cdFx0XHRcdGZvciggdmFyIG0gaW4gYXJyYXlNZXRob2RzICl7XHJcblx0XHRcdFx0XHRhcnJbIG0gXSA9IGFycmF5TWV0aG9kc1sgbSBdO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmV0dXJuIGFycjtcclxuXHRcdFx0fVxyXG5cdFx0fSkoKTtcclxuXHJcblx0XHR0aGlzLmNsb25lID0gZnVuY3Rpb24oIG5vZGUgKXtcclxuXHRcdFx0dmFyIGNvbnMgPSBub2RlLmNvbnN0cnVjdG9yO1xyXG5cdFx0XHRpZiggY29ucyA9PSBBcnJheSApe1xyXG5cdFx0XHRcdHJldHVybiBjcmVhdGVBcnJheSggbm9kZS5sZW5ndGggKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRpZiggY29ucyA9PT0gT2JqZWN0ICl7XHJcblx0XHRcdFx0XHRyZXR1cm4gT2JqZWN0LmNyZWF0ZSggRnJvemVuT2JqZWN0ICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIENsYXNzIGluc3RhbmNlc1xyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0cmV0dXJuIE9iamVjdC5jcmVhdGUoIGNvbnMucHJvdG90eXBlLCBvYmplY3RNZXRob2RzICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG59XHJcbi8vI2J1aWxkXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5vZGVDcmVhdG9yO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vLyNidWlsZFxyXG52YXIgZ2xvYmFsID0gKG5ldyBGdW5jdGlvbihcInJldHVybiB0aGlzXCIpKCkpO1xyXG5cclxudmFyIFV0aWxzID0ge1xyXG5cdGV4dGVuZDogZnVuY3Rpb24oIG9iLCBwcm9wcyApe1xyXG5cdFx0Zm9yKCB2YXIgcCBpbiBwcm9wcyApe1xyXG5cdFx0XHRvYltwXSA9IHByb3BzW3BdO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIG9iO1xyXG5cdH0sXHJcblxyXG5cdGNyZWF0ZU5vbkVudW1lcmFibGU6IGZ1bmN0aW9uKCBvYmosIHByb3RvICl7XHJcblx0XHR2YXIgbmUgPSB7fTtcclxuXHRcdGZvciggdmFyIGtleSBpbiBvYmogKVxyXG5cdFx0XHRuZVtrZXldID0ge3ZhbHVlOiBvYmpba2V5XSB9O1xyXG5cdFx0cmV0dXJuIE9iamVjdC5jcmVhdGUoIHByb3RvIHx8IHt9LCBuZSApO1xyXG5cdH0sXHJcblxyXG5cdGVycm9yOiBmdW5jdGlvbiggbWVzc2FnZSApe1xyXG5cdFx0dmFyIGVyciA9IG5ldyBFcnJvciggbWVzc2FnZSApO1xyXG5cdFx0aWYoIGNvbnNvbGUgKVxyXG5cdFx0XHRyZXR1cm4gY29uc29sZS5lcnJvciggZXJyICk7XHJcblx0XHRlbHNlXHJcblx0XHRcdHRocm93IGVycjtcclxuXHR9LFxyXG5cclxuXHRlYWNoOiBmdW5jdGlvbiggbywgY2xiayApe1xyXG5cdFx0dmFyIGksbCxrZXlzO1xyXG5cdFx0aWYoIG8gJiYgby5jb25zdHJ1Y3RvciA9PSBBcnJheSApe1xyXG5cdFx0XHRmb3IgKGkgPSAwLCBsID0gby5sZW5ndGg7IGkgPCBsOyBpKyspXHJcblx0XHRcdFx0Y2xiayggb1tpXSwgaSApO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGtleXMgPSBPYmplY3Qua2V5cyggbyApO1xyXG5cdFx0XHRmb3IoIGkgPSAwLCBsID0ga2V5cy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG5cdFx0XHRcdGNsYmsoIG9bIGtleXNbaV0gXSwga2V5c1tpXSApO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdGFkZE5FOiBmdW5jdGlvbiggbm9kZSwgYXR0cnMgKXtcclxuXHRcdGZvciggdmFyIGtleSBpbiBhdHRycyApe1xyXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoIG5vZGUsIGtleSwge1xyXG5cdFx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHR3cml0YWJsZTogdHJ1ZSxcclxuXHRcdFx0XHR2YWx1ZTogYXR0cnNbIGtleSBdXHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIENyZWF0ZXMgbm9uLWVudW1lcmFibGUgcHJvcGVydHkgZGVzY3JpcHRvcnMsIHRvIGJlIHVzZWQgYnkgT2JqZWN0LmNyZWF0ZS5cclxuXHQgKiBAcGFyYW0gIHtPYmplY3R9IGF0dHJzIFByb3BlcnRpZXMgdG8gY3JlYXRlIGRlc2NyaXB0b3JzXHJcblx0ICogQHJldHVybiB7T2JqZWN0fSAgICAgICBBIGhhc2ggd2l0aCB0aGUgZGVzY3JpcHRvcnMuXHJcblx0ICovXHJcblx0Y3JlYXRlTkU6IGZ1bmN0aW9uKCBhdHRycyApe1xyXG5cdFx0dmFyIG5lID0ge307XHJcblxyXG5cdFx0Zm9yKCB2YXIga2V5IGluIGF0dHJzICl7XHJcblx0XHRcdG5lWyBrZXkgXSA9IHtcclxuXHRcdFx0XHR3cml0YWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRjb25maWd1cmFibGU6IHRydWUsXHJcblx0XHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXHJcblx0XHRcdFx0dmFsdWU6IGF0dHJzWyBrZXkgXVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG5lO1xyXG5cdH0sXHJcblxyXG5cdC8vIG5leHRUaWNrIC0gYnkgc3RhZ2FzIC8gcHVibGljIGRvbWFpblxyXG5cdG5leHRUaWNrOiAoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHF1ZXVlID0gW10sXHJcblx0XHRkaXJ0eSA9IGZhbHNlLFxyXG5cdFx0Zm4sXHJcblx0XHRoYXNQb3N0TWVzc2FnZSA9ICEhZ2xvYmFsLnBvc3RNZXNzYWdlICYmICh0eXBlb2YgV2luZG93ICE9ICd1bmRlZmluZWQnKSAmJiAoZ2xvYmFsIGluc3RhbmNlb2YgV2luZG93KSxcclxuXHRcdG1lc3NhZ2VOYW1lID0gJ25leHR0aWNrJyxcclxuXHRcdHRyaWdnZXIgPSAoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRyZXR1cm4gaGFzUG9zdE1lc3NhZ2VcclxuXHRcdFx0XHQ/IGZ1bmN0aW9uIHRyaWdnZXIgKCkge1xyXG5cdFx0XHRcdGdsb2JhbC5wb3N0TWVzc2FnZShtZXNzYWdlTmFtZSwgJyonKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQ6IGZ1bmN0aW9uIHRyaWdnZXIgKCkge1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBwcm9jZXNzUXVldWUoKSB9LCAwKTtcclxuXHRcdFx0fTtcclxuXHRcdH0oKSksXHJcblx0XHRwcm9jZXNzUXVldWUgPSAoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRyZXR1cm4gaGFzUG9zdE1lc3NhZ2VcclxuXHRcdFx0XHQ/IGZ1bmN0aW9uIHByb2Nlc3NRdWV1ZSAoZXZlbnQpIHtcclxuXHRcdFx0XHRcdGlmIChldmVudC5zb3VyY2UgPT09IGdsb2JhbCAmJiBldmVudC5kYXRhID09PSBtZXNzYWdlTmFtZSkge1xyXG5cdFx0XHRcdFx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdFx0XHRcdFx0Zmx1c2hRdWV1ZSgpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQ6IGZsdXNoUXVldWU7XHJcbiAgICBcdH0pKClcclxuICAgIDtcclxuXHJcbiAgICBmdW5jdGlvbiBmbHVzaFF1ZXVlICgpIHtcclxuICAgICAgICB3aGlsZSAoZm4gPSBxdWV1ZS5zaGlmdCgpKSB7XHJcbiAgICAgICAgICAgIGZuKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRpcnR5ID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbmV4dFRpY2sgKGZuKSB7XHJcbiAgICAgICAgcXVldWUucHVzaChmbik7XHJcbiAgICAgICAgaWYgKGRpcnR5KSByZXR1cm47XHJcbiAgICAgICAgZGlydHkgPSB0cnVlO1xyXG4gICAgICAgIHRyaWdnZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaGFzUG9zdE1lc3NhZ2UpIGdsb2JhbC5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcHJvY2Vzc1F1ZXVlLCB0cnVlKTtcclxuXHJcbiAgICBuZXh0VGljay5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBnbG9iYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHByb2Nlc3NRdWV1ZSwgdHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5leHRUaWNrO1xyXG4gIH0pKCksXHJcblxyXG4gIGZpbmRQaXZvdDogZnVuY3Rpb24oIG5vZGUgKXtcclxuICBcdFx0aWYoICFub2RlIHx8ICFub2RlLl9fIClcclxuICBcdFx0XHRyZXR1cm47XHJcblxyXG4gIFx0XHRpZiggbm9kZS5fXy5waXZvdCApXHJcbiAgXHRcdFx0cmV0dXJuIG5vZGU7XHJcblxyXG4gIFx0XHR2YXIgZm91bmQgPSAwLFxyXG4gIFx0XHRcdHBhcmVudHMgPSBub2RlLl9fLnBhcmVudHMsXHJcbiAgXHRcdFx0aSA9IDAsXHJcbiAgXHRcdFx0cGFyZW50XHJcbiAgXHRcdDtcclxuXHJcbiAgXHRcdC8vIExvb2sgdXAgZm9yIHRoZSBwaXZvdCBpbiB0aGUgcGFyZW50c1xyXG4gIFx0XHR3aGlsZSggIWZvdW5kICYmIGkgPCBwYXJlbnRzLmxlbmd0aCApe1xyXG4gIFx0XHRcdHBhcmVudCA9IHBhcmVudHNbaV07XHJcbiAgXHRcdFx0aWYoIHBhcmVudC5fXy5waXZvdCApXHJcbiAgXHRcdFx0XHRmb3VuZCA9IHBhcmVudDtcclxuICBcdFx0XHRpKys7XHJcbiAgXHRcdH1cclxuXHJcbiAgXHRcdGlmKCBmb3VuZCApe1xyXG4gIFx0XHRcdHJldHVybiBmb3VuZDtcclxuICBcdFx0fVxyXG5cclxuICBcdFx0Ly8gSWYgbm90IGZvdW5kLCB0cnkgd2l0aCB0aGUgcGFyZW50J3MgcGFyZW50c1xyXG4gIFx0XHRpPTA7XHJcbiAgXHRcdHdoaWxlKCAhZm91bmQgJiYgaSA8IHBhcmVudHMubGVuZ3RoICl7XHJcblx0ICBcdFx0Zm91bmQgPSB0aGlzLmZpbmRQaXZvdCggcGFyZW50c1tpXSApO1xyXG5cdCAgXHRcdGkrKztcclxuXHQgIFx0fVxyXG5cclxuICBcdFx0cmV0dXJuIGZvdW5kO1xyXG4gIH0sXHJcblxyXG5cdGlzTGVhZjogZnVuY3Rpb24oIG5vZGUsIGZyZWV6ZUluc3RhbmNlcyApe1xyXG5cdFx0dmFyIGNvbnM7XHJcblx0XHRyZXR1cm4gIW5vZGUgfHwgIShjb25zID0gbm9kZS5jb25zdHJ1Y3RvcikgfHwgKGZyZWV6ZUluc3RhbmNlcyA/XHJcblx0XHRcdChjb25zID09PSBTdHJpbmcgfHwgY29ucyA9PT0gTnVtYmVyIHx8IGNvbnMgPT09IEJvb2xlYW4pIDpcclxuXHRcdFx0KGNvbnMgIT0gT2JqZWN0ICYmIGNvbnMgIT0gQXJyYXkpXHJcblx0XHQpO1xyXG5cdH1cclxufTtcclxuLy8jYnVpbGRcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxzO1xyXG4iLCJcbi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEEgY2FjaGVkIHJlZmVyZW5jZSB0byB0aGUgaGFzT3duUHJvcGVydHkgZnVuY3Rpb24uXG4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQSBjb25zdHJ1Y3RvciBmdW5jdGlvbiB0aGF0IHdpbGwgY3JlYXRlIGJsYW5rIG9iamVjdHMuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQmxhbmsoKSB7fVxuXG5CbGFuay5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4vKipcbiAqIFVzZWQgdG8gcHJldmVudCBwcm9wZXJ0eSBjb2xsaXNpb25zIGJldHdlZW4gb3VyIFwibWFwXCIgYW5kIGl0cyBwcm90b3R5cGUuXG4gKiBAcGFyYW0geyFPYmplY3Q8c3RyaW5nLCAqPn0gbWFwIFRoZSBtYXAgdG8gY2hlY2suXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgVGhlIHByb3BlcnR5IHRvIGNoZWNrLlxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBtYXAgaGFzIHByb3BlcnR5LlxuICovXG52YXIgaGFzID0gZnVuY3Rpb24gKG1hcCwgcHJvcGVydHkpIHtcbiAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwobWFwLCBwcm9wZXJ0eSk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gbWFwIG9iamVjdCB3aXRob3V0IGEgcHJvdG90eXBlLlxuICogQHJldHVybiB7IU9iamVjdH1cbiAqL1xudmFyIGNyZWF0ZU1hcCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG5ldyBCbGFuaygpO1xufTtcblxuLyoqXG4gKiBLZWVwcyB0cmFjayBvZiBpbmZvcm1hdGlvbiBuZWVkZWQgdG8gcGVyZm9ybSBkaWZmcyBmb3IgYSBnaXZlbiBET00gbm9kZS5cbiAqIEBwYXJhbSB7IXN0cmluZ30gbm9kZU5hbWVcbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE5vZGVEYXRhKG5vZGVOYW1lLCBrZXkpIHtcbiAgLyoqXG4gICAqIFRoZSBhdHRyaWJ1dGVzIGFuZCB0aGVpciB2YWx1ZXMuXG4gICAqIEBjb25zdCB7IU9iamVjdDxzdHJpbmcsICo+fVxuICAgKi9cbiAgdGhpcy5hdHRycyA9IGNyZWF0ZU1hcCgpO1xuXG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycywgdXNlZCBmb3IgcXVpY2tseSBkaWZmaW5nIHRoZVxuICAgKiBpbmNvbW1pbmcgYXR0cmlidXRlcyB0byBzZWUgaWYgdGhlIERPTSBub2RlJ3MgYXR0cmlidXRlcyBuZWVkIHRvIGJlXG4gICAqIHVwZGF0ZWQuXG4gICAqIEBjb25zdCB7QXJyYXk8Kj59XG4gICAqL1xuICB0aGlzLmF0dHJzQXJyID0gW107XG5cbiAgLyoqXG4gICAqIFRoZSBpbmNvbWluZyBhdHRyaWJ1dGVzIGZvciB0aGlzIE5vZGUsIGJlZm9yZSB0aGV5IGFyZSB1cGRhdGVkLlxuICAgKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCAqPn1cbiAgICovXG4gIHRoaXMubmV3QXR0cnMgPSBjcmVhdGVNYXAoKTtcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIHN0YXRpY3MgaGF2ZSBiZWVuIGFwcGxpZWQgZm9yIHRoZSBub2RlIHlldC5cbiAgICoge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLnN0YXRpY3NBcHBsaWVkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIG5vZGUsIHVzZWQgdG8gcHJlc2VydmUgRE9NIG5vZGVzIHdoZW4gdGhleVxuICAgKiBtb3ZlIHdpdGhpbiB0aGVpciBwYXJlbnQuXG4gICAqIEBjb25zdFxuICAgKi9cbiAgdGhpcy5rZXkgPSBrZXk7XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIGNoaWxkcmVuIHdpdGhpbiB0aGlzIG5vZGUgYnkgdGhlaXIga2V5LlxuICAgKiB7IU9iamVjdDxzdHJpbmcsICFFbGVtZW50Pn1cbiAgICovXG4gIHRoaXMua2V5TWFwID0gY3JlYXRlTWFwKCk7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBrZXlNYXAgaXMgY3VycmVudGx5IHZhbGlkLlxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMua2V5TWFwVmFsaWQgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIHRoZSBhc3NvY2lhdGVkIG5vZGUgaXMsIG9yIGNvbnRhaW5zLCBhIGZvY3VzZWQgRWxlbWVudC5cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmZvY3VzZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogVGhlIG5vZGUgbmFtZSBmb3IgdGhpcyBub2RlLlxuICAgKiBAY29uc3Qge3N0cmluZ31cbiAgICovXG4gIHRoaXMubm9kZU5hbWUgPSBub2RlTmFtZTtcblxuICAvKipcbiAgICogQHR5cGUgez9zdHJpbmd9XG4gICAqL1xuICB0aGlzLnRleHQgPSBudWxsO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemVzIGEgTm9kZURhdGEgb2JqZWN0IGZvciBhIE5vZGUuXG4gKlxuICogQHBhcmFtIHtOb2RlfSBub2RlIFRoZSBub2RlIHRvIGluaXRpYWxpemUgZGF0YSBmb3IuXG4gKiBAcGFyYW0ge3N0cmluZ30gbm9kZU5hbWUgVGhlIG5vZGUgbmFtZSBvZiBub2RlLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdGhhdCBpZGVudGlmaWVzIHRoZSBub2RlLlxuICogQHJldHVybiB7IU5vZGVEYXRhfSBUaGUgbmV3bHkgaW5pdGlhbGl6ZWQgZGF0YSBvYmplY3RcbiAqL1xudmFyIGluaXREYXRhID0gZnVuY3Rpb24gKG5vZGUsIG5vZGVOYW1lLCBrZXkpIHtcbiAgdmFyIGRhdGEgPSBuZXcgTm9kZURhdGEobm9kZU5hbWUsIGtleSk7XG4gIG5vZGVbJ19faW5jcmVtZW50YWxET01EYXRhJ10gPSBkYXRhO1xuICByZXR1cm4gZGF0YTtcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBOb2RlRGF0YSBvYmplY3QgZm9yIGEgTm9kZSwgY3JlYXRpbmcgaXQgaWYgbmVjZXNzYXJ5LlxuICpcbiAqIEBwYXJhbSB7P05vZGV9IG5vZGUgVGhlIE5vZGUgdG8gcmV0cmlldmUgdGhlIGRhdGEgZm9yLlxuICogQHJldHVybiB7IU5vZGVEYXRhfSBUaGUgTm9kZURhdGEgZm9yIHRoaXMgTm9kZS5cbiAqL1xudmFyIGdldERhdGEgPSBmdW5jdGlvbiAobm9kZSkge1xuICBpbXBvcnROb2RlKG5vZGUpO1xuICByZXR1cm4gbm9kZVsnX19pbmNyZW1lbnRhbERPTURhdGEnXTtcbn07XG5cbi8qKlxuICogSW1wb3J0cyBub2RlIGFuZCBpdHMgc3VidHJlZSwgaW5pdGlhbGl6aW5nIGNhY2hlcy5cbiAqXG4gKiBAcGFyYW0gez9Ob2RlfSBub2RlIFRoZSBOb2RlIHRvIGltcG9ydC5cbiAqL1xudmFyIGltcG9ydE5vZGUgPSBmdW5jdGlvbiAobm9kZSkge1xuICBpZiAobm9kZVsnX19pbmNyZW1lbnRhbERPTURhdGEnXSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBpc0VsZW1lbnQgPSBub2RlIGluc3RhbmNlb2YgRWxlbWVudDtcbiAgdmFyIG5vZGVOYW1lID0gaXNFbGVtZW50ID8gbm9kZS5sb2NhbE5hbWUgOiBub2RlLm5vZGVOYW1lO1xuICB2YXIga2V5ID0gaXNFbGVtZW50ID8gbm9kZS5nZXRBdHRyaWJ1dGUoJ2tleScpIDogbnVsbDtcbiAgdmFyIGRhdGEgPSBpbml0RGF0YShub2RlLCBub2RlTmFtZSwga2V5KTtcblxuICBpZiAoa2V5KSB7XG4gICAgZ2V0RGF0YShub2RlLnBhcmVudE5vZGUpLmtleU1hcFtrZXldID0gbm9kZTtcbiAgfVxuXG4gIGlmIChpc0VsZW1lbnQpIHtcbiAgICB2YXIgYXR0cmlidXRlcyA9IG5vZGUuYXR0cmlidXRlcztcbiAgICB2YXIgYXR0cnMgPSBkYXRhLmF0dHJzO1xuICAgIHZhciBuZXdBdHRycyA9IGRhdGEubmV3QXR0cnM7XG4gICAgdmFyIGF0dHJzQXJyID0gZGF0YS5hdHRyc0FycjtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXR0cmlidXRlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgdmFyIGF0dHIgPSBhdHRyaWJ1dGVzW2ldO1xuICAgICAgdmFyIG5hbWUgPSBhdHRyLm5hbWU7XG4gICAgICB2YXIgdmFsdWUgPSBhdHRyLnZhbHVlO1xuXG4gICAgICBhdHRyc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgbmV3QXR0cnNbbmFtZV0gPSB1bmRlZmluZWQ7XG4gICAgICBhdHRyc0Fyci5wdXNoKG5hbWUpO1xuICAgICAgYXR0cnNBcnIucHVzaCh2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgZm9yICh2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgaW1wb3J0Tm9kZShjaGlsZCk7XG4gIH1cbn07XG5cbi8qKlxuICogR2V0cyB0aGUgbmFtZXNwYWNlIHRvIGNyZWF0ZSBhbiBlbGVtZW50IChvZiBhIGdpdmVuIHRhZykgaW4uXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgdG8gZ2V0IHRoZSBuYW1lc3BhY2UgZm9yLlxuICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50XG4gKiBAcmV0dXJuIHs/c3RyaW5nfSBUaGUgbmFtZXNwYWNlIHRvIGNyZWF0ZSB0aGUgdGFnIGluLlxuICovXG52YXIgZ2V0TmFtZXNwYWNlRm9yVGFnID0gZnVuY3Rpb24gKHRhZywgcGFyZW50KSB7XG4gIGlmICh0YWcgPT09ICdzdmcnKSB7XG4gICAgcmV0dXJuICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG4gIH1cblxuICBpZiAoZ2V0RGF0YShwYXJlbnQpLm5vZGVOYW1lID09PSAnZm9yZWlnbk9iamVjdCcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBwYXJlbnQubmFtZXNwYWNlVVJJO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIEVsZW1lbnQuXG4gKiBAcGFyYW0ge0RvY3VtZW50fSBkb2MgVGhlIGRvY3VtZW50IHdpdGggd2hpY2ggdG8gY3JlYXRlIHRoZSBFbGVtZW50LlxuICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50XG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgZm9yIHRoZSBFbGVtZW50LlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IEEga2V5IHRvIGlkZW50aWZ5IHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IUVsZW1lbnR9XG4gKi9cbnZhciBjcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24gKGRvYywgcGFyZW50LCB0YWcsIGtleSkge1xuICB2YXIgbmFtZXNwYWNlID0gZ2V0TmFtZXNwYWNlRm9yVGFnKHRhZywgcGFyZW50KTtcbiAgdmFyIGVsID0gdW5kZWZpbmVkO1xuXG4gIGlmIChuYW1lc3BhY2UpIHtcbiAgICBlbCA9IGRvYy5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCB0YWcpO1xuICB9IGVsc2Uge1xuICAgIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgfVxuXG4gIGluaXREYXRhKGVsLCB0YWcsIGtleSk7XG5cbiAgcmV0dXJuIGVsO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVGV4dCBOb2RlLlxuICogQHBhcmFtIHtEb2N1bWVudH0gZG9jIFRoZSBkb2N1bWVudCB3aXRoIHdoaWNoIHRvIGNyZWF0ZSB0aGUgRWxlbWVudC5cbiAqIEByZXR1cm4geyFUZXh0fVxuICovXG52YXIgY3JlYXRlVGV4dCA9IGZ1bmN0aW9uIChkb2MpIHtcbiAgdmFyIG5vZGUgPSBkb2MuY3JlYXRlVGV4dE5vZGUoJycpO1xuICBpbml0RGF0YShub2RlLCAnI3RleHQnLCBudWxsKTtcbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKiBAY29uc3QgKi9cbnZhciBub3RpZmljYXRpb25zID0ge1xuICAvKipcbiAgICogQ2FsbGVkIGFmdGVyIHBhdGNoIGhhcyBjb21wbGVhdGVkIHdpdGggYW55IE5vZGVzIHRoYXQgaGF2ZSBiZWVuIGNyZWF0ZWRcbiAgICogYW5kIGFkZGVkIHRvIHRoZSBET00uXG4gICAqIEB0eXBlIHs/ZnVuY3Rpb24oQXJyYXk8IU5vZGU+KX1cbiAgICovXG4gIG5vZGVzQ3JlYXRlZDogbnVsbCxcblxuICAvKipcbiAgICogQ2FsbGVkIGFmdGVyIHBhdGNoIGhhcyBjb21wbGVhdGVkIHdpdGggYW55IE5vZGVzIHRoYXQgaGF2ZSBiZWVuIHJlbW92ZWRcbiAgICogZnJvbSB0aGUgRE9NLlxuICAgKiBOb3RlIGl0J3MgYW4gYXBwbGljYXRpb25zIHJlc3BvbnNpYmlsaXR5IHRvIGhhbmRsZSBhbnkgY2hpbGROb2Rlcy5cbiAgICogQHR5cGUgez9mdW5jdGlvbihBcnJheTwhTm9kZT4pfVxuICAgKi9cbiAgbm9kZXNEZWxldGVkOiBudWxsXG59O1xuXG4vKipcbiAqIEtlZXBzIHRyYWNrIG9mIHRoZSBzdGF0ZSBvZiBhIHBhdGNoLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIENvbnRleHQoKSB7XG4gIC8qKlxuICAgKiBAdHlwZSB7KEFycmF5PCFOb2RlPnx1bmRlZmluZWQpfVxuICAgKi9cbiAgdGhpcy5jcmVhdGVkID0gbm90aWZpY2F0aW9ucy5ub2Rlc0NyZWF0ZWQgJiYgW107XG5cbiAgLyoqXG4gICAqIEB0eXBlIHsoQXJyYXk8IU5vZGU+fHVuZGVmaW5lZCl9XG4gICAqL1xuICB0aGlzLmRlbGV0ZWQgPSBub3RpZmljYXRpb25zLm5vZGVzRGVsZXRlZCAmJiBbXTtcbn1cblxuLyoqXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLm1hcmtDcmVhdGVkID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgaWYgKHRoaXMuY3JlYXRlZCkge1xuICAgIHRoaXMuY3JlYXRlZC5wdXNoKG5vZGUpO1xuICB9XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAqL1xuQ29udGV4dC5wcm90b3R5cGUubWFya0RlbGV0ZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICBpZiAodGhpcy5kZWxldGVkKSB7XG4gICAgdGhpcy5kZWxldGVkLnB1c2gobm9kZSk7XG4gIH1cbn07XG5cbi8qKlxuICogTm90aWZpZXMgYWJvdXQgbm9kZXMgdGhhdCB3ZXJlIGNyZWF0ZWQgZHVyaW5nIHRoZSBwYXRjaCBvcGVhcmF0aW9uLlxuICovXG5Db250ZXh0LnByb3RvdHlwZS5ub3RpZnlDaGFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5jcmVhdGVkICYmIHRoaXMuY3JlYXRlZC5sZW5ndGggPiAwKSB7XG4gICAgbm90aWZpY2F0aW9ucy5ub2Rlc0NyZWF0ZWQodGhpcy5jcmVhdGVkKTtcbiAgfVxuXG4gIGlmICh0aGlzLmRlbGV0ZWQgJiYgdGhpcy5kZWxldGVkLmxlbmd0aCA+IDApIHtcbiAgICBub3RpZmljYXRpb25zLm5vZGVzRGVsZXRlZCh0aGlzLmRlbGV0ZWQpO1xuICB9XG59O1xuXG4vKipcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICAqIEtlZXBzIHRyYWNrIHdoZXRoZXIgb3Igbm90IHdlIGFyZSBpbiBhbiBhdHRyaWJ1dGVzIGRlY2xhcmF0aW9uIChhZnRlclxuICAqIGVsZW1lbnRPcGVuU3RhcnQsIGJ1dCBiZWZvcmUgZWxlbWVudE9wZW5FbmQpLlxuICAqIEB0eXBlIHtib29sZWFufVxuICAqL1xudmFyIGluQXR0cmlidXRlcyA9IGZhbHNlO1xuXG4vKipcbiAgKiBLZWVwcyB0cmFjayB3aGV0aGVyIG9yIG5vdCB3ZSBhcmUgaW4gYW4gZWxlbWVudCB0aGF0IHNob3VsZCBub3QgaGF2ZSBpdHNcbiAgKiBjaGlsZHJlbiBjbGVhcmVkLlxuICAqIEB0eXBlIHtib29sZWFufVxuICAqL1xudmFyIGluU2tpcCA9IGZhbHNlO1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGVyZSBpcyBhIGN1cnJlbnQgcGF0Y2ggY29udGV4dC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmdW5jdGlvbk5hbWVcbiAqIEBwYXJhbSB7Kn0gY29udGV4dFxuICovXG52YXIgYXNzZXJ0SW5QYXRjaCA9IGZ1bmN0aW9uIChmdW5jdGlvbk5hbWUsIGNvbnRleHQpIHtcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY2FsbCAnICsgZnVuY3Rpb25OYW1lICsgJygpIHVubGVzcyBpbiBwYXRjaC4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgYSBwYXRjaCBjbG9zZXMgZXZlcnkgbm9kZSB0aGF0IGl0IG9wZW5lZC5cbiAqIEBwYXJhbSB7P05vZGV9IG9wZW5FbGVtZW50XG4gKiBAcGFyYW0geyFOb2RlfCFEb2N1bWVudEZyYWdtZW50fSByb290XG4gKi9cbnZhciBhc3NlcnROb1VuY2xvc2VkVGFncyA9IGZ1bmN0aW9uIChvcGVuRWxlbWVudCwgcm9vdCkge1xuICBpZiAob3BlbkVsZW1lbnQgPT09IHJvb3QpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgY3VycmVudEVsZW1lbnQgPSBvcGVuRWxlbWVudDtcbiAgdmFyIG9wZW5UYWdzID0gW107XG4gIHdoaWxlIChjdXJyZW50RWxlbWVudCAmJiBjdXJyZW50RWxlbWVudCAhPT0gcm9vdCkge1xuICAgIG9wZW5UYWdzLnB1c2goY3VycmVudEVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSk7XG4gICAgY3VycmVudEVsZW1lbnQgPSBjdXJyZW50RWxlbWVudC5wYXJlbnROb2RlO1xuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKCdPbmUgb3IgbW9yZSB0YWdzIHdlcmUgbm90IGNsb3NlZDpcXG4nICsgb3BlblRhZ3Muam9pbignXFxuJykpO1xufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgdGhlIGNhbGxlciBpcyBub3Qgd2hlcmUgYXR0cmlidXRlcyBhcmUgZXhwZWN0ZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gZnVuY3Rpb25OYW1lXG4gKi9cbnZhciBhc3NlcnROb3RJbkF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAoZnVuY3Rpb25OYW1lKSB7XG4gIGlmIChpbkF0dHJpYnV0ZXMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZnVuY3Rpb25OYW1lICsgJygpIGNhbiBub3QgYmUgY2FsbGVkIGJldHdlZW4gJyArICdlbGVtZW50T3BlblN0YXJ0KCkgYW5kIGVsZW1lbnRPcGVuRW5kKCkuJyk7XG4gIH1cbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IHRoZSBjYWxsZXIgaXMgbm90IGluc2lkZSBhbiBlbGVtZW50IHRoYXQgaGFzIGRlY2xhcmVkIHNraXAuXG4gKiBAcGFyYW0ge3N0cmluZ30gZnVuY3Rpb25OYW1lXG4gKi9cbnZhciBhc3NlcnROb3RJblNraXAgPSBmdW5jdGlvbiAoZnVuY3Rpb25OYW1lKSB7XG4gIGlmIChpblNraXApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZnVuY3Rpb25OYW1lICsgJygpIG1heSBub3QgYmUgY2FsbGVkIGluc2lkZSBhbiBlbGVtZW50ICcgKyAndGhhdCBoYXMgY2FsbGVkIHNraXAoKS4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgdGhlIGNhbGxlciBpcyB3aGVyZSBhdHRyaWJ1dGVzIGFyZSBleHBlY3RlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmdW5jdGlvbk5hbWVcbiAqL1xudmFyIGFzc2VydEluQXR0cmlidXRlcyA9IGZ1bmN0aW9uIChmdW5jdGlvbk5hbWUpIHtcbiAgaWYgKCFpbkF0dHJpYnV0ZXMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZnVuY3Rpb25OYW1lICsgJygpIGNhbiBvbmx5IGJlIGNhbGxlZCBhZnRlciBjYWxsaW5nICcgKyAnZWxlbWVudE9wZW5TdGFydCgpLicpO1xuICB9XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhlIHBhdGNoIGNsb3NlcyB2aXJ0dWFsIGF0dHJpYnV0ZXMgY2FsbFxuICovXG52YXIgYXNzZXJ0VmlydHVhbEF0dHJpYnV0ZXNDbG9zZWQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChpbkF0dHJpYnV0ZXMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2VsZW1lbnRPcGVuRW5kKCkgbXVzdCBiZSBjYWxsZWQgYWZ0ZXIgY2FsbGluZyAnICsgJ2VsZW1lbnRPcGVuU3RhcnQoKS4nKTtcbiAgfVxufTtcblxuLyoqXG4gICogTWFrZXMgc3VyZSB0aGF0IHRhZ3MgYXJlIGNvcnJlY3RseSBuZXN0ZWQuXG4gICogQHBhcmFtIHtzdHJpbmd9IG5vZGVOYW1lXG4gICogQHBhcmFtIHtzdHJpbmd9IHRhZ1xuICAqL1xudmFyIGFzc2VydENsb3NlTWF0Y2hlc09wZW5UYWcgPSBmdW5jdGlvbiAobm9kZU5hbWUsIHRhZykge1xuICBpZiAobm9kZU5hbWUgIT09IHRhZykge1xuICAgIHRocm93IG5ldyBFcnJvcignUmVjZWl2ZWQgYSBjYWxsIHRvIGNsb3NlIFwiJyArIHRhZyArICdcIiBidXQgXCInICsgbm9kZU5hbWUgKyAnXCIgd2FzIG9wZW4uJyk7XG4gIH1cbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IG5vIGNoaWxkcmVuIGVsZW1lbnRzIGhhdmUgYmVlbiBkZWNsYXJlZCB5ZXQgaW4gdGhlIGN1cnJlbnRcbiAqIGVsZW1lbnQuXG4gKiBAcGFyYW0ge3N0cmluZ30gZnVuY3Rpb25OYW1lXG4gKiBAcGFyYW0gez9Ob2RlfSBwcmV2aW91c05vZGVcbiAqL1xudmFyIGFzc2VydE5vQ2hpbGRyZW5EZWNsYXJlZFlldCA9IGZ1bmN0aW9uIChmdW5jdGlvbk5hbWUsIHByZXZpb3VzTm9kZSkge1xuICBpZiAocHJldmlvdXNOb2RlICE9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGZ1bmN0aW9uTmFtZSArICcoKSBtdXN0IGNvbWUgYmVmb3JlIGFueSBjaGlsZCAnICsgJ2RlY2xhcmF0aW9ucyBpbnNpZGUgdGhlIGN1cnJlbnQgZWxlbWVudC4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDaGVja3MgdGhhdCBhIGNhbGwgdG8gcGF0Y2hPdXRlciBhY3R1YWxseSBwYXRjaGVkIHRoZSBlbGVtZW50LlxuICogQHBhcmFtIHs/Tm9kZX0gc3RhcnROb2RlIFRoZSB2YWx1ZSBmb3IgdGhlIGN1cnJlbnROb2RlIHdoZW4gdGhlIHBhdGNoXG4gKiAgICAgc3RhcnRlZC5cbiAqIEBwYXJhbSB7P05vZGV9IGN1cnJlbnROb2RlIFRoZSBjdXJyZW50Tm9kZSB3aGVuIHRoZSBwYXRjaCBmaW5pc2hlZC5cbiAqIEBwYXJhbSB7P05vZGV9IGV4cGVjdGVkTmV4dE5vZGUgVGhlIE5vZGUgdGhhdCBpcyBleHBlY3RlZCB0byBmb2xsb3cgdGhlXG4gKiAgICBjdXJyZW50Tm9kZSBhZnRlciB0aGUgcGF0Y2g7XG4gKiBAcGFyYW0gez9Ob2RlfSBleHBlY3RlZFByZXZOb2RlIFRoZSBOb2RlIHRoYXQgaXMgZXhwZWN0ZWQgdG8gcHJlY2VlZCB0aGVcbiAqICAgIGN1cnJlbnROb2RlIGFmdGVyIHRoZSBwYXRjaC5cbiAqL1xudmFyIGFzc2VydFBhdGNoRWxlbWVudE5vRXh0cmFzID0gZnVuY3Rpb24gKHN0YXJ0Tm9kZSwgY3VycmVudE5vZGUsIGV4cGVjdGVkTmV4dE5vZGUsIGV4cGVjdGVkUHJldk5vZGUpIHtcbiAgdmFyIHdhc1VwZGF0ZWQgPSBjdXJyZW50Tm9kZS5uZXh0U2libGluZyA9PT0gZXhwZWN0ZWROZXh0Tm9kZSAmJiBjdXJyZW50Tm9kZS5wcmV2aW91c1NpYmxpbmcgPT09IGV4cGVjdGVkUHJldk5vZGU7XG4gIHZhciB3YXNDaGFuZ2VkID0gY3VycmVudE5vZGUubmV4dFNpYmxpbmcgPT09IHN0YXJ0Tm9kZS5uZXh0U2libGluZyAmJiBjdXJyZW50Tm9kZS5wcmV2aW91c1NpYmxpbmcgPT09IGV4cGVjdGVkUHJldk5vZGU7XG4gIHZhciB3YXNSZW1vdmVkID0gY3VycmVudE5vZGUgPT09IHN0YXJ0Tm9kZTtcblxuICBpZiAoIXdhc1VwZGF0ZWQgJiYgIXdhc0NoYW5nZWQgJiYgIXdhc1JlbW92ZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZXJlIG11c3QgYmUgZXhhY3RseSBvbmUgdG9wIGxldmVsIGNhbGwgY29ycmVzcG9uZGluZyAnICsgJ3RvIHRoZSBwYXRjaGVkIGVsZW1lbnQuJyk7XG4gIH1cbn07XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgc3RhdGUgb2YgYmVpbmcgaW4gYW4gYXR0cmlidXRlIGRlY2xhcmF0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSB2YWx1ZVxuICogQHJldHVybiB7Ym9vbGVhbn0gdGhlIHByZXZpb3VzIHZhbHVlLlxuICovXG52YXIgc2V0SW5BdHRyaWJ1dGVzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHZhciBwcmV2aW91cyA9IGluQXR0cmlidXRlcztcbiAgaW5BdHRyaWJ1dGVzID0gdmFsdWU7XG4gIHJldHVybiBwcmV2aW91cztcbn07XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgc3RhdGUgb2YgYmVpbmcgaW4gYSBza2lwIGVsZW1lbnQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHZhbHVlXG4gKiBAcmV0dXJuIHtib29sZWFufSB0aGUgcHJldmlvdXMgdmFsdWUuXG4gKi9cbnZhciBzZXRJblNraXAgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIHByZXZpb3VzID0gaW5Ta2lwO1xuICBpblNraXAgPSB2YWx1ZTtcbiAgcmV0dXJuIHByZXZpb3VzO1xufTtcblxuLyoqXG4gKiBDb3B5cmlnaHQgMjAxNiBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIG5vZGUgdGhlIHJvb3Qgb2YgYSBkb2N1bWVudCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG52YXIgaXNEb2N1bWVudFJvb3QgPSBmdW5jdGlvbiAobm9kZSkge1xuICAvLyBGb3IgU2hhZG93Um9vdHMsIGNoZWNrIGlmIHRoZXkgYXJlIGEgRG9jdW1lbnRGcmFnbWVudCBpbnN0ZWFkIG9mIGlmIHRoZXlcbiAgLy8gYXJlIGEgU2hhZG93Um9vdCBzbyB0aGF0IHRoaXMgY2FuIHdvcmsgaW4gJ3VzZSBzdHJpY3QnIGlmIFNoYWRvd1Jvb3RzIGFyZVxuICAvLyBub3Qgc3VwcG9ydGVkLlxuICByZXR1cm4gbm9kZSBpbnN0YW5jZW9mIERvY3VtZW50IHx8IG5vZGUgaW5zdGFuY2VvZiBEb2N1bWVudEZyYWdtZW50O1xufTtcblxuLyoqXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlIFRoZSBub2RlIHRvIHN0YXJ0IGF0LCBpbmNsdXNpdmUuXG4gKiBAcGFyYW0gez9Ob2RlfSByb290IFRoZSByb290IGFuY2VzdG9yIHRvIGdldCB1bnRpbCwgZXhjbHVzaXZlLlxuICogQHJldHVybiB7IUFycmF5PCFOb2RlPn0gVGhlIGFuY2VzdHJ5IG9mIERPTSBub2Rlcy5cbiAqL1xudmFyIGdldEFuY2VzdHJ5ID0gZnVuY3Rpb24gKG5vZGUsIHJvb3QpIHtcbiAgdmFyIGFuY2VzdHJ5ID0gW107XG4gIHZhciBjdXIgPSBub2RlO1xuXG4gIHdoaWxlIChjdXIgIT09IHJvb3QpIHtcbiAgICBhbmNlc3RyeS5wdXNoKGN1cik7XG4gICAgY3VyID0gY3VyLnBhcmVudE5vZGU7XG4gIH1cblxuICByZXR1cm4gYW5jZXN0cnk7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAqIEByZXR1cm4geyFOb2RlfSBUaGUgcm9vdCBub2RlIG9mIHRoZSBET00gdHJlZSB0aGF0IGNvbnRhaW5zIG5vZGUuXG4gKi9cbnZhciBnZXRSb290ID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgdmFyIGN1ciA9IG5vZGU7XG4gIHZhciBwcmV2ID0gY3VyO1xuXG4gIHdoaWxlIChjdXIpIHtcbiAgICBwcmV2ID0gY3VyO1xuICAgIGN1ciA9IGN1ci5wYXJlbnROb2RlO1xuICB9XG5cbiAgcmV0dXJuIHByZXY7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGUgVGhlIG5vZGUgdG8gZ2V0IHRoZSBhY3RpdmVFbGVtZW50IGZvci5cbiAqIEByZXR1cm4gez9FbGVtZW50fSBUaGUgYWN0aXZlRWxlbWVudCBpbiB0aGUgRG9jdW1lbnQgb3IgU2hhZG93Um9vdFxuICogICAgIGNvcnJlc3BvbmRpbmcgdG8gbm9kZSwgaWYgcHJlc2VudC5cbiAqL1xudmFyIGdldEFjdGl2ZUVsZW1lbnQgPSBmdW5jdGlvbiAobm9kZSkge1xuICB2YXIgcm9vdCA9IGdldFJvb3Qobm9kZSk7XG4gIHJldHVybiBpc0RvY3VtZW50Um9vdChyb290KSA/IHJvb3QuYWN0aXZlRWxlbWVudCA6IG51bGw7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIHBhdGggb2Ygbm9kZXMgdGhhdCBjb250YWluIHRoZSBmb2N1c2VkIG5vZGUgaW4gdGhlIHNhbWUgZG9jdW1lbnQgYXNcbiAqIGEgcmVmZXJlbmNlIG5vZGUsIHVwIHVudGlsIHRoZSByb290LlxuICogQHBhcmFtIHshTm9kZX0gbm9kZSBUaGUgcmVmZXJlbmNlIG5vZGUgdG8gZ2V0IHRoZSBhY3RpdmVFbGVtZW50IGZvci5cbiAqIEBwYXJhbSB7P05vZGV9IHJvb3QgVGhlIHJvb3QgdG8gZ2V0IHRoZSBmb2N1c2VkIHBhdGggdW50aWwuXG4gKiBAcmV0dXJuIHshQXJyYXk8Tm9kZT59XG4gKi9cbnZhciBnZXRGb2N1c2VkUGF0aCA9IGZ1bmN0aW9uIChub2RlLCByb290KSB7XG4gIHZhciBhY3RpdmVFbGVtZW50ID0gZ2V0QWN0aXZlRWxlbWVudChub2RlKTtcblxuICBpZiAoIWFjdGl2ZUVsZW1lbnQgfHwgIW5vZGUuY29udGFpbnMoYWN0aXZlRWxlbWVudCkpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICByZXR1cm4gZ2V0QW5jZXN0cnkoYWN0aXZlRWxlbWVudCwgcm9vdCk7XG59O1xuXG4vKipcbiAqIExpa2UgaW5zZXJ0QmVmb3JlLCBidXQgaW5zdGVhZCBpbnN0ZWFkIG9mIG1vdmluZyB0aGUgZGVzaXJlZCBub2RlLCBpbnN0ZWFkXG4gKiBtb3ZlcyBhbGwgdGhlIG90aGVyIG5vZGVzIGFmdGVyLlxuICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50Tm9kZVxuICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICogQHBhcmFtIHs/Tm9kZX0gcmVmZXJlbmNlTm9kZVxuICovXG52YXIgbW92ZUJlZm9yZSA9IGZ1bmN0aW9uIChwYXJlbnROb2RlLCBub2RlLCByZWZlcmVuY2VOb2RlKSB7XG4gIHZhciBpbnNlcnRSZWZlcmVuY2VOb2RlID0gbm9kZS5uZXh0U2libGluZztcbiAgdmFyIGN1ciA9IHJlZmVyZW5jZU5vZGU7XG5cbiAgd2hpbGUgKGN1ciAhPT0gbm9kZSkge1xuICAgIHZhciBuZXh0ID0gY3VyLm5leHRTaWJsaW5nO1xuICAgIHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGN1ciwgaW5zZXJ0UmVmZXJlbmNlTm9kZSk7XG4gICAgY3VyID0gbmV4dDtcbiAgfVxufTtcblxuLyoqIEB0eXBlIHs/Q29udGV4dH0gKi9cbnZhciBjb250ZXh0ID0gbnVsbDtcblxuLyoqIEB0eXBlIHs/Tm9kZX0gKi9cbnZhciBjdXJyZW50Tm9kZSA9IG51bGw7XG5cbi8qKiBAdHlwZSB7P05vZGV9ICovXG52YXIgY3VycmVudFBhcmVudCA9IG51bGw7XG5cbi8qKiBAdHlwZSB7P0RvY3VtZW50fSAqL1xudmFyIGRvYyA9IG51bGw7XG5cbi8qKlxuICogQHBhcmFtIHshQXJyYXk8Tm9kZT59IGZvY3VzUGF0aCBUaGUgbm9kZXMgdG8gbWFyay5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9jdXNlZCBXaGV0aGVyIG9yIG5vdCB0aGV5IGFyZSBmb2N1c2VkLlxuICovXG52YXIgbWFya0ZvY3VzZWQgPSBmdW5jdGlvbiAoZm9jdXNQYXRoLCBmb2N1c2VkKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZm9jdXNQYXRoLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgZ2V0RGF0YShmb2N1c1BhdGhbaV0pLmZvY3VzZWQgPSBmb2N1c2VkO1xuICB9XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBwYXRjaGVyIGZ1bmN0aW9uIHRoYXQgc2V0cyB1cCBhbmQgcmVzdG9yZXMgYSBwYXRjaCBjb250ZXh0LFxuICogcnVubmluZyB0aGUgcnVuIGZ1bmN0aW9uIHdpdGggdGhlIHByb3ZpZGVkIGRhdGEuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCghRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudCksIWZ1bmN0aW9uKFQpLFQ9KTogP05vZGV9IHJ1blxuICogQHJldHVybiB7ZnVuY3Rpb24oKCFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50KSwhZnVuY3Rpb24oVCksVD0pOiA/Tm9kZX1cbiAqIEB0ZW1wbGF0ZSBUXG4gKi9cbnZhciBwYXRjaEZhY3RvcnkgPSBmdW5jdGlvbiAocnVuKSB7XG4gIC8qKlxuICAgKiBUT0RPKG1veik6IFRoZXNlIGFubm90YXRpb25zIHdvbid0IGJlIG5lY2Vzc2FyeSBvbmNlIHdlIHN3aXRjaCB0byBDbG9zdXJlXG4gICAqIENvbXBpbGVyJ3MgbmV3IHR5cGUgaW5mZXJlbmNlLiBSZW1vdmUgdGhlc2Ugb25jZSB0aGUgc3dpdGNoIGlzIGRvbmUuXG4gICAqXG4gICAqIEBwYXJhbSB7KCFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50KX0gbm9kZVxuICAgKiBAcGFyYW0geyFmdW5jdGlvbihUKX0gZm5cbiAgICogQHBhcmFtIHtUPX0gZGF0YVxuICAgKiBAcmV0dXJuIHs/Tm9kZX0gbm9kZVxuICAgKiBAdGVtcGxhdGUgVFxuICAgKi9cbiAgdmFyIGYgPSBmdW5jdGlvbiAobm9kZSwgZm4sIGRhdGEpIHtcbiAgICB2YXIgcHJldkNvbnRleHQgPSBjb250ZXh0O1xuICAgIHZhciBwcmV2RG9jID0gZG9jO1xuICAgIHZhciBwcmV2Q3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZTtcbiAgICB2YXIgcHJldkN1cnJlbnRQYXJlbnQgPSBjdXJyZW50UGFyZW50O1xuICAgIHZhciBwcmV2aW91c0luQXR0cmlidXRlcyA9IGZhbHNlO1xuICAgIHZhciBwcmV2aW91c0luU2tpcCA9IGZhbHNlO1xuXG4gICAgY29udGV4dCA9IG5ldyBDb250ZXh0KCk7XG4gICAgZG9jID0gbm9kZS5vd25lckRvY3VtZW50O1xuICAgIGN1cnJlbnRQYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XG5cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgcHJldmlvdXNJbkF0dHJpYnV0ZXMgPSBzZXRJbkF0dHJpYnV0ZXMoZmFsc2UpO1xuICAgICAgcHJldmlvdXNJblNraXAgPSBzZXRJblNraXAoZmFsc2UpO1xuICAgIH1cblxuICAgIHZhciBmb2N1c1BhdGggPSBnZXRGb2N1c2VkUGF0aChub2RlLCBjdXJyZW50UGFyZW50KTtcbiAgICBtYXJrRm9jdXNlZChmb2N1c1BhdGgsIHRydWUpO1xuICAgIHZhciByZXRWYWwgPSBydW4obm9kZSwgZm4sIGRhdGEpO1xuICAgIG1hcmtGb2N1c2VkKGZvY3VzUGF0aCwgZmFsc2UpO1xuXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGFzc2VydFZpcnR1YWxBdHRyaWJ1dGVzQ2xvc2VkKCk7XG4gICAgICBzZXRJbkF0dHJpYnV0ZXMocHJldmlvdXNJbkF0dHJpYnV0ZXMpO1xuICAgICAgc2V0SW5Ta2lwKHByZXZpb3VzSW5Ta2lwKTtcbiAgICB9XG5cbiAgICBjb250ZXh0Lm5vdGlmeUNoYW5nZXMoKTtcblxuICAgIGNvbnRleHQgPSBwcmV2Q29udGV4dDtcbiAgICBkb2MgPSBwcmV2RG9jO1xuICAgIGN1cnJlbnROb2RlID0gcHJldkN1cnJlbnROb2RlO1xuICAgIGN1cnJlbnRQYXJlbnQgPSBwcmV2Q3VycmVudFBhcmVudDtcblxuICAgIHJldHVybiByZXRWYWw7XG4gIH07XG4gIHJldHVybiBmO1xufTtcblxuLyoqXG4gKiBQYXRjaGVzIHRoZSBkb2N1bWVudCBzdGFydGluZyBhdCBub2RlIHdpdGggdGhlIHByb3ZpZGVkIGZ1bmN0aW9uLiBUaGlzXG4gKiBmdW5jdGlvbiBtYXkgYmUgY2FsbGVkIGR1cmluZyBhbiBleGlzdGluZyBwYXRjaCBvcGVyYXRpb24uXG4gKiBAcGFyYW0geyFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50fSBub2RlIFRoZSBFbGVtZW50IG9yIERvY3VtZW50XG4gKiAgICAgdG8gcGF0Y2guXG4gKiBAcGFyYW0geyFmdW5jdGlvbihUKX0gZm4gQSBmdW5jdGlvbiBjb250YWluaW5nIGVsZW1lbnRPcGVuL2VsZW1lbnRDbG9zZS9ldGMuXG4gKiAgICAgY2FsbHMgdGhhdCBkZXNjcmliZSB0aGUgRE9NLlxuICogQHBhcmFtIHtUPX0gZGF0YSBBbiBhcmd1bWVudCBwYXNzZWQgdG8gZm4gdG8gcmVwcmVzZW50IERPTSBzdGF0ZS5cbiAqIEByZXR1cm4geyFOb2RlfSBUaGUgcGF0Y2hlZCBub2RlLlxuICogQHRlbXBsYXRlIFRcbiAqL1xudmFyIHBhdGNoSW5uZXIgPSBwYXRjaEZhY3RvcnkoZnVuY3Rpb24gKG5vZGUsIGZuLCBkYXRhKSB7XG4gIGN1cnJlbnROb2RlID0gbm9kZTtcblxuICBlbnRlck5vZGUoKTtcbiAgZm4oZGF0YSk7XG4gIGV4aXROb2RlKCk7XG5cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnROb1VuY2xvc2VkVGFncyhjdXJyZW50Tm9kZSwgbm9kZSk7XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn0pO1xuXG4vKipcbiAqIFBhdGNoZXMgYW4gRWxlbWVudCB3aXRoIHRoZSB0aGUgcHJvdmlkZWQgZnVuY3Rpb24uIEV4YWN0bHkgb25lIHRvcCBsZXZlbFxuICogZWxlbWVudCBjYWxsIHNob3VsZCBiZSBtYWRlIGNvcnJlc3BvbmRpbmcgdG8gYG5vZGVgLlxuICogQHBhcmFtIHshRWxlbWVudH0gbm9kZSBUaGUgRWxlbWVudCB3aGVyZSB0aGUgcGF0Y2ggc2hvdWxkIHN0YXJ0LlxuICogQHBhcmFtIHshZnVuY3Rpb24oVCl9IGZuIEEgZnVuY3Rpb24gY29udGFpbmluZyBlbGVtZW50T3Blbi9lbGVtZW50Q2xvc2UvZXRjLlxuICogICAgIGNhbGxzIHRoYXQgZGVzY3JpYmUgdGhlIERPTS4gVGhpcyBzaG91bGQgaGF2ZSBhdCBtb3N0IG9uZSB0b3AgbGV2ZWxcbiAqICAgICBlbGVtZW50IGNhbGwuXG4gKiBAcGFyYW0ge1Q9fSBkYXRhIEFuIGFyZ3VtZW50IHBhc3NlZCB0byBmbiB0byByZXByZXNlbnQgRE9NIHN0YXRlLlxuICogQHJldHVybiB7P05vZGV9IFRoZSBub2RlIGlmIGl0IHdhcyB1cGRhdGVkLCBpdHMgcmVwbGFjZWRtZW50IG9yIG51bGwgaWYgaXRcbiAqICAgICB3YXMgcmVtb3ZlZC5cbiAqIEB0ZW1wbGF0ZSBUXG4gKi9cbnZhciBwYXRjaE91dGVyID0gcGF0Y2hGYWN0b3J5KGZ1bmN0aW9uIChub2RlLCBmbiwgZGF0YSkge1xuICB2YXIgc3RhcnROb2RlID0gLyoqIEB0eXBlIHshRWxlbWVudH0gKi97IG5leHRTaWJsaW5nOiBub2RlIH07XG4gIHZhciBleHBlY3RlZE5leHROb2RlID0gbnVsbDtcbiAgdmFyIGV4cGVjdGVkUHJldk5vZGUgPSBudWxsO1xuXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgZXhwZWN0ZWROZXh0Tm9kZSA9IG5vZGUubmV4dFNpYmxpbmc7XG4gICAgZXhwZWN0ZWRQcmV2Tm9kZSA9IG5vZGUucHJldmlvdXNTaWJsaW5nO1xuICB9XG5cbiAgY3VycmVudE5vZGUgPSBzdGFydE5vZGU7XG4gIGZuKGRhdGEpO1xuXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0UGF0Y2hFbGVtZW50Tm9FeHRyYXMoc3RhcnROb2RlLCBjdXJyZW50Tm9kZSwgZXhwZWN0ZWROZXh0Tm9kZSwgZXhwZWN0ZWRQcmV2Tm9kZSk7XG4gIH1cblxuICBpZiAobm9kZSAhPT0gY3VycmVudE5vZGUgJiYgbm9kZS5wYXJlbnROb2RlKSB7XG4gICAgcmVtb3ZlQ2hpbGQoY3VycmVudFBhcmVudCwgbm9kZSwgZ2V0RGF0YShjdXJyZW50UGFyZW50KS5rZXlNYXApO1xuICB9XG5cbiAgcmV0dXJuIHN0YXJ0Tm9kZSA9PT0gY3VycmVudE5vZGUgPyBudWxsIDogY3VycmVudE5vZGU7XG59KTtcblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBvciBub3QgdGhlIGN1cnJlbnQgbm9kZSBtYXRjaGVzIHRoZSBzcGVjaWZpZWQgbm9kZU5hbWUgYW5kXG4gKiBrZXkuXG4gKlxuICogQHBhcmFtIHshTm9kZX0gbWF0Y2hOb2RlIEEgbm9kZSB0byBtYXRjaCB0aGUgZGF0YSB0by5cbiAqIEBwYXJhbSB7P3N0cmluZ30gbm9kZU5hbWUgVGhlIG5vZGVOYW1lIGZvciB0aGlzIG5vZGUuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgQW4gb3B0aW9uYWwga2V5IHRoYXQgaWRlbnRpZmllcyBhIG5vZGUuXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBub2RlIG1hdGNoZXMsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xudmFyIG1hdGNoZXMgPSBmdW5jdGlvbiAobWF0Y2hOb2RlLCBub2RlTmFtZSwga2V5KSB7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShtYXRjaE5vZGUpO1xuXG4gIC8vIEtleSBjaGVjayBpcyBkb25lIHVzaW5nIGRvdWJsZSBlcXVhbHMgYXMgd2Ugd2FudCB0byB0cmVhdCBhIG51bGwga2V5IHRoZVxuICAvLyBzYW1lIGFzIHVuZGVmaW5lZC4gVGhpcyBzaG91bGQgYmUgb2theSBhcyB0aGUgb25seSB2YWx1ZXMgYWxsb3dlZCBhcmVcbiAgLy8gc3RyaW5ncywgbnVsbCBhbmQgdW5kZWZpbmVkIHNvIHRoZSA9PSBzZW1hbnRpY3MgYXJlIG5vdCB0b28gd2VpcmQuXG4gIHJldHVybiBub2RlTmFtZSA9PT0gZGF0YS5ub2RlTmFtZSAmJiBrZXkgPT0gZGF0YS5rZXk7XG59O1xuXG4vKipcbiAqIEFsaWducyB0aGUgdmlydHVhbCBFbGVtZW50IGRlZmluaXRpb24gd2l0aCB0aGUgYWN0dWFsIERPTSwgbW92aW5nIHRoZVxuICogY29ycmVzcG9uZGluZyBET00gbm9kZSB0byB0aGUgY29ycmVjdCBsb2NhdGlvbiBvciBjcmVhdGluZyBpdCBpZiBuZWNlc3NhcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30gbm9kZU5hbWUgRm9yIGFuIEVsZW1lbnQsIHRoaXMgc2hvdWxkIGJlIGEgdmFsaWQgdGFnIHN0cmluZy5cbiAqICAgICBGb3IgYSBUZXh0LCB0aGlzIHNob3VsZCBiZSAjdGV4dC5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LlxuICovXG52YXIgYWxpZ25XaXRoRE9NID0gZnVuY3Rpb24gKG5vZGVOYW1lLCBrZXkpIHtcbiAgaWYgKGN1cnJlbnROb2RlICYmIG1hdGNoZXMoY3VycmVudE5vZGUsIG5vZGVOYW1lLCBrZXkpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHBhcmVudERhdGEgPSBnZXREYXRhKGN1cnJlbnRQYXJlbnQpO1xuICB2YXIgY3VycmVudE5vZGVEYXRhID0gY3VycmVudE5vZGUgJiYgZ2V0RGF0YShjdXJyZW50Tm9kZSk7XG4gIHZhciBrZXlNYXAgPSBwYXJlbnREYXRhLmtleU1hcDtcbiAgdmFyIG5vZGUgPSB1bmRlZmluZWQ7XG5cbiAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBub2RlIGhhcyBtb3ZlZCB3aXRoaW4gdGhlIHBhcmVudC5cbiAgaWYgKGtleSkge1xuICAgIHZhciBrZXlOb2RlID0ga2V5TWFwW2tleV07XG4gICAgaWYgKGtleU5vZGUpIHtcbiAgICAgIGlmIChtYXRjaGVzKGtleU5vZGUsIG5vZGVOYW1lLCBrZXkpKSB7XG4gICAgICAgIG5vZGUgPSBrZXlOb2RlO1xuICAgICAgfSBlbHNlIGlmIChrZXlOb2RlID09PSBjdXJyZW50Tm9kZSkge1xuICAgICAgICBjb250ZXh0Lm1hcmtEZWxldGVkKGtleU5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVtb3ZlQ2hpbGQoY3VycmVudFBhcmVudCwga2V5Tm9kZSwga2V5TWFwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBDcmVhdGUgdGhlIG5vZGUgaWYgaXQgZG9lc24ndCBleGlzdC5cbiAgaWYgKCFub2RlKSB7XG4gICAgaWYgKG5vZGVOYW1lID09PSAnI3RleHQnKSB7XG4gICAgICBub2RlID0gY3JlYXRlVGV4dChkb2MpO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlID0gY3JlYXRlRWxlbWVudChkb2MsIGN1cnJlbnRQYXJlbnQsIG5vZGVOYW1lLCBrZXkpO1xuICAgIH1cblxuICAgIGlmIChrZXkpIHtcbiAgICAgIGtleU1hcFtrZXldID0gbm9kZTtcbiAgICB9XG5cbiAgICBjb250ZXh0Lm1hcmtDcmVhdGVkKG5vZGUpO1xuICB9XG5cbiAgLy8gUmUtb3JkZXIgdGhlIG5vZGUgaW50byB0aGUgcmlnaHQgcG9zaXRpb24sIHByZXNlcnZpbmcgZm9jdXMgaWYgZWl0aGVyXG4gIC8vIG5vZGUgb3IgY3VycmVudE5vZGUgYXJlIGZvY3VzZWQgYnkgbWFraW5nIHN1cmUgdGhhdCB0aGV5IGFyZSBub3QgZGV0YWNoZWRcbiAgLy8gZnJvbSB0aGUgRE9NLlxuICBpZiAoZ2V0RGF0YShub2RlKS5mb2N1c2VkKSB7XG4gICAgLy8gTW92ZSBldmVyeXRoaW5nIGVsc2UgYmVmb3JlIHRoZSBub2RlLlxuICAgIG1vdmVCZWZvcmUoY3VycmVudFBhcmVudCwgbm9kZSwgY3VycmVudE5vZGUpO1xuICB9IGVsc2UgaWYgKGN1cnJlbnROb2RlRGF0YSAmJiBjdXJyZW50Tm9kZURhdGEua2V5ICYmICFjdXJyZW50Tm9kZURhdGEuZm9jdXNlZCkge1xuICAgIC8vIFJlbW92ZSB0aGUgY3VycmVudE5vZGUsIHdoaWNoIGNhbiBhbHdheXMgYmUgYWRkZWQgYmFjayBzaW5jZSB3ZSBob2xkIGFcbiAgICAvLyByZWZlcmVuY2UgdGhyb3VnaCB0aGUga2V5TWFwLiBUaGlzIHByZXZlbnRzIGEgbGFyZ2UgbnVtYmVyIG9mIG1vdmVzIHdoZW5cbiAgICAvLyBhIGtleWVkIGl0ZW0gaXMgcmVtb3ZlZCBvciBtb3ZlZCBiYWNrd2FyZHMgaW4gdGhlIERPTS5cbiAgICBjdXJyZW50UGFyZW50LnJlcGxhY2VDaGlsZChub2RlLCBjdXJyZW50Tm9kZSk7XG4gICAgcGFyZW50RGF0YS5rZXlNYXBWYWxpZCA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIGN1cnJlbnRQYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIGN1cnJlbnROb2RlKTtcbiAgfVxuXG4gIGN1cnJlbnROb2RlID0gbm9kZTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHs/Tm9kZX0gbm9kZVxuICogQHBhcmFtIHs/Tm9kZX0gY2hpbGRcbiAqIEBwYXJhbSB7P09iamVjdDxzdHJpbmcsICFFbGVtZW50Pn0ga2V5TWFwXG4gKi9cbnZhciByZW1vdmVDaGlsZCA9IGZ1bmN0aW9uIChub2RlLCBjaGlsZCwga2V5TWFwKSB7XG4gIG5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICBjb250ZXh0Lm1hcmtEZWxldGVkKCAvKiogQHR5cGUgeyFOb2RlfSovY2hpbGQpO1xuXG4gIHZhciBrZXkgPSBnZXREYXRhKGNoaWxkKS5rZXk7XG4gIGlmIChrZXkpIHtcbiAgICBkZWxldGUga2V5TWFwW2tleV07XG4gIH1cbn07XG5cbi8qKlxuICogQ2xlYXJzIG91dCBhbnkgdW52aXNpdGVkIE5vZGVzLCBhcyB0aGUgY29ycmVzcG9uZGluZyB2aXJ0dWFsIGVsZW1lbnRcbiAqIGZ1bmN0aW9ucyB3ZXJlIG5ldmVyIGNhbGxlZCBmb3IgdGhlbS5cbiAqL1xudmFyIGNsZWFyVW52aXNpdGVkRE9NID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbm9kZSA9IGN1cnJlbnRQYXJlbnQ7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcbiAgdmFyIGtleU1hcCA9IGRhdGEua2V5TWFwO1xuICB2YXIga2V5TWFwVmFsaWQgPSBkYXRhLmtleU1hcFZhbGlkO1xuICB2YXIgY2hpbGQgPSBub2RlLmxhc3RDaGlsZDtcbiAgdmFyIGtleSA9IHVuZGVmaW5lZDtcblxuICBpZiAoY2hpbGQgPT09IGN1cnJlbnROb2RlICYmIGtleU1hcFZhbGlkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgd2hpbGUgKGNoaWxkICE9PSBjdXJyZW50Tm9kZSkge1xuICAgIHJlbW92ZUNoaWxkKG5vZGUsIGNoaWxkLCBrZXlNYXApO1xuICAgIGNoaWxkID0gbm9kZS5sYXN0Q2hpbGQ7XG4gIH1cblxuICAvLyBDbGVhbiB0aGUga2V5TWFwLCByZW1vdmluZyBhbnkgdW51c3VlZCBrZXlzLlxuICBpZiAoIWtleU1hcFZhbGlkKSB7XG4gICAgZm9yIChrZXkgaW4ga2V5TWFwKSB7XG4gICAgICBjaGlsZCA9IGtleU1hcFtrZXldO1xuICAgICAgaWYgKGNoaWxkLnBhcmVudE5vZGUgIT09IG5vZGUpIHtcbiAgICAgICAgY29udGV4dC5tYXJrRGVsZXRlZChjaGlsZCk7XG4gICAgICAgIGRlbGV0ZSBrZXlNYXBba2V5XTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBkYXRhLmtleU1hcFZhbGlkID0gdHJ1ZTtcbiAgfVxufTtcblxuLyoqXG4gKiBDaGFuZ2VzIHRvIHRoZSBmaXJzdCBjaGlsZCBvZiB0aGUgY3VycmVudCBub2RlLlxuICovXG52YXIgZW50ZXJOb2RlID0gZnVuY3Rpb24gKCkge1xuICBjdXJyZW50UGFyZW50ID0gY3VycmVudE5vZGU7XG4gIGN1cnJlbnROb2RlID0gbnVsbDtcbn07XG5cbi8qKlxuICogQHJldHVybiB7P05vZGV9IFRoZSBuZXh0IE5vZGUgdG8gYmUgcGF0Y2hlZC5cbiAqL1xudmFyIGdldE5leHROb2RlID0gZnVuY3Rpb24gKCkge1xuICBpZiAoY3VycmVudE5vZGUpIHtcbiAgICByZXR1cm4gY3VycmVudE5vZGUubmV4dFNpYmxpbmc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGN1cnJlbnRQYXJlbnQuZmlyc3RDaGlsZDtcbiAgfVxufTtcblxuLyoqXG4gKiBDaGFuZ2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAqL1xudmFyIG5leHROb2RlID0gZnVuY3Rpb24gKCkge1xuICBjdXJyZW50Tm9kZSA9IGdldE5leHROb2RlKCk7XG59O1xuXG4vKipcbiAqIENoYW5nZXMgdG8gdGhlIHBhcmVudCBvZiB0aGUgY3VycmVudCBub2RlLCByZW1vdmluZyBhbnkgdW52aXNpdGVkIGNoaWxkcmVuLlxuICovXG52YXIgZXhpdE5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gIGNsZWFyVW52aXNpdGVkRE9NKCk7XG5cbiAgY3VycmVudE5vZGUgPSBjdXJyZW50UGFyZW50O1xuICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5wYXJlbnROb2RlO1xufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgdGhlIGN1cnJlbnQgbm9kZSBpcyBhbiBFbGVtZW50IHdpdGggYSBtYXRjaGluZyB0YWdOYW1lIGFuZFxuICoga2V5LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBjb3JlRWxlbWVudE9wZW4gPSBmdW5jdGlvbiAodGFnLCBrZXkpIHtcbiAgbmV4dE5vZGUoKTtcbiAgYWxpZ25XaXRoRE9NKHRhZywga2V5KTtcbiAgZW50ZXJOb2RlKCk7XG4gIHJldHVybiAoLyoqIEB0eXBlIHshRWxlbWVudH0gKi9jdXJyZW50UGFyZW50XG4gICk7XG59O1xuXG4vKipcbiAqIENsb3NlcyB0aGUgY3VycmVudGx5IG9wZW4gRWxlbWVudCwgcmVtb3ZpbmcgYW55IHVudmlzaXRlZCBjaGlsZHJlbiBpZlxuICogbmVjZXNzYXJ5LlxuICpcbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgY29yZUVsZW1lbnRDbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBzZXRJblNraXAoZmFsc2UpO1xuICB9XG5cbiAgZXhpdE5vZGUoKTtcbiAgcmV0dXJuICgvKiogQHR5cGUgeyFFbGVtZW50fSAqL2N1cnJlbnROb2RlXG4gICk7XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhlIGN1cnJlbnQgbm9kZSBpcyBhIFRleHQgbm9kZSBhbmQgY3JlYXRlcyBhIFRleHQgbm9kZSBpZiBpdCBpc1xuICogbm90LlxuICpcbiAqIEByZXR1cm4geyFUZXh0fSBUaGUgY29ycmVzcG9uZGluZyBUZXh0IE5vZGUuXG4gKi9cbnZhciBjb3JlVGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgbmV4dE5vZGUoKTtcbiAgYWxpZ25XaXRoRE9NKCcjdGV4dCcsIG51bGwpO1xuICByZXR1cm4gKC8qKiBAdHlwZSB7IVRleHR9ICovY3VycmVudE5vZGVcbiAgKTtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgY3VycmVudCBFbGVtZW50IGJlaW5nIHBhdGNoZWQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH1cbiAqL1xudmFyIGN1cnJlbnRFbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydEluUGF0Y2goJ2N1cnJlbnRFbGVtZW50JywgY29udGV4dCk7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCdjdXJyZW50RWxlbWVudCcpO1xuICB9XG4gIHJldHVybiAoLyoqIEB0eXBlIHshRWxlbWVudH0gKi9jdXJyZW50UGFyZW50XG4gICk7XG59O1xuXG4vKipcbiAqIEByZXR1cm4ge05vZGV9IFRoZSBOb2RlIHRoYXQgd2lsbCBiZSBldmFsdWF0ZWQgZm9yIHRoZSBuZXh0IGluc3RydWN0aW9uLlxuICovXG52YXIgY3VycmVudFBvaW50ZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0SW5QYXRjaCgnY3VycmVudFBvaW50ZXInLCBjb250ZXh0KTtcbiAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoJ2N1cnJlbnRQb2ludGVyJyk7XG4gIH1cbiAgcmV0dXJuIGdldE5leHROb2RlKCk7XG59O1xuXG4vKipcbiAqIFNraXBzIHRoZSBjaGlsZHJlbiBpbiBhIHN1YnRyZWUsIGFsbG93aW5nIGFuIEVsZW1lbnQgdG8gYmUgY2xvc2VkIHdpdGhvdXRcbiAqIGNsZWFyaW5nIG91dCB0aGUgY2hpbGRyZW4uXG4gKi9cbnZhciBza2lwID0gZnVuY3Rpb24gKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vQ2hpbGRyZW5EZWNsYXJlZFlldCgnc2tpcCcsIGN1cnJlbnROb2RlKTtcbiAgICBzZXRJblNraXAodHJ1ZSk7XG4gIH1cbiAgY3VycmVudE5vZGUgPSBjdXJyZW50UGFyZW50Lmxhc3RDaGlsZDtcbn07XG5cbi8qKlxuICogU2tpcHMgdGhlIG5leHQgTm9kZSB0byBiZSBwYXRjaGVkLCBtb3ZpbmcgdGhlIHBvaW50ZXIgZm9yd2FyZCB0byB0aGUgbmV4dFxuICogc2libGluZyBvZiB0aGUgY3VycmVudCBwb2ludGVyLlxuICovXG52YXIgc2tpcE5vZGUgPSBuZXh0Tm9kZTtcblxuLyoqXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKiogQGNvbnN0ICovXG52YXIgc3ltYm9scyA9IHtcbiAgZGVmYXVsdDogJ19fZGVmYXVsdCdcbn07XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge3N0cmluZ3x1bmRlZmluZWR9IFRoZSBuYW1lc3BhY2UgdG8gdXNlIGZvciB0aGUgYXR0cmlidXRlLlxuICovXG52YXIgZ2V0TmFtZXNwYWNlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgaWYgKG5hbWUubGFzdEluZGV4T2YoJ3htbDonLCAwKSA9PT0gMCkge1xuICAgIHJldHVybiAnaHR0cDovL3d3dy53My5vcmcvWE1MLzE5OTgvbmFtZXNwYWNlJztcbiAgfVxuXG4gIGlmIChuYW1lLmxhc3RJbmRleE9mKCd4bGluazonLCAwKSA9PT0gMCkge1xuICAgIHJldHVybiAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayc7XG4gIH1cbn07XG5cbi8qKlxuICogQXBwbGllcyBhbiBhdHRyaWJ1dGUgb3IgcHJvcGVydHkgdG8gYSBnaXZlbiBFbGVtZW50LiBJZiB0aGUgdmFsdWUgaXMgbnVsbFxuICogb3IgdW5kZWZpbmVkLCBpdCBpcyByZW1vdmVkIGZyb20gdGhlIEVsZW1lbnQuIE90aGVyd2lzZSwgdGhlIHZhbHVlIGlzIHNldFxuICogYXMgYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICogQHBhcmFtIHs/KGJvb2xlYW58bnVtYmVyfHN0cmluZyk9fSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuXG4gKi9cbnZhciBhcHBseUF0dHIgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgZWwucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICB9IGVsc2Uge1xuICAgIHZhciBhdHRyTlMgPSBnZXROYW1lc3BhY2UobmFtZSk7XG4gICAgaWYgKGF0dHJOUykge1xuICAgICAgZWwuc2V0QXR0cmlidXRlTlMoYXR0ck5TLCBuYW1lLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgYSBwcm9wZXJ0eSB0byBhIGdpdmVuIEVsZW1lbnQuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIHByb3BlcnR5J3MgbmFtZS5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHByb3BlcnR5J3MgdmFsdWUuXG4gKi9cbnZhciBhcHBseVByb3AgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIGVsW25hbWVdID0gdmFsdWU7XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgYSB2YWx1ZSB0byBhIHN0eWxlIGRlY2xhcmF0aW9uLiBTdXBwb3J0cyBDU1MgY3VzdG9tIHByb3BlcnRpZXMgYnlcbiAqIHNldHRpbmcgcHJvcGVydGllcyBjb250YWluaW5nIGEgZGFzaCB1c2luZyBDU1NTdHlsZURlY2xhcmF0aW9uLnNldFByb3BlcnR5LlxuICogQHBhcmFtIHtDU1NTdHlsZURlY2xhcmF0aW9ufSBzdHlsZVxuICogQHBhcmFtIHshc3RyaW5nfSBwcm9wXG4gKiBAcGFyYW0geyp9IHZhbHVlXG4gKi9cbnZhciBzZXRTdHlsZVZhbHVlID0gZnVuY3Rpb24gKHN0eWxlLCBwcm9wLCB2YWx1ZSkge1xuICBpZiAocHJvcC5pbmRleE9mKCctJykgPj0gMCkge1xuICAgIHN0eWxlLnNldFByb3BlcnR5KHByb3AsIC8qKiBAdHlwZSB7c3RyaW5nfSAqL3ZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBzdHlsZVtwcm9wXSA9IHZhbHVlO1xuICB9XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgYSBzdHlsZSB0byBhbiBFbGVtZW50LiBObyB2ZW5kb3IgcHJlZml4IGV4cGFuc2lvbiBpcyBkb25lIGZvclxuICogcHJvcGVydHkgbmFtZXMvdmFsdWVzLlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICogQHBhcmFtIHsqfSBzdHlsZSBUaGUgc3R5bGUgdG8gc2V0LiBFaXRoZXIgYSBzdHJpbmcgb2YgY3NzIG9yIGFuIG9iamVjdFxuICogICAgIGNvbnRhaW5pbmcgcHJvcGVydHktdmFsdWUgcGFpcnMuXG4gKi9cbnZhciBhcHBseVN0eWxlID0gZnVuY3Rpb24gKGVsLCBuYW1lLCBzdHlsZSkge1xuICBpZiAodHlwZW9mIHN0eWxlID09PSAnc3RyaW5nJykge1xuICAgIGVsLnN0eWxlLmNzc1RleHQgPSBzdHlsZTtcbiAgfSBlbHNlIHtcbiAgICBlbC5zdHlsZS5jc3NUZXh0ID0gJyc7XG4gICAgdmFyIGVsU3R5bGUgPSBlbC5zdHlsZTtcbiAgICB2YXIgb2JqID0gLyoqIEB0eXBlIHshT2JqZWN0PHN0cmluZyxzdHJpbmc+fSAqL3N0eWxlO1xuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcbiAgICAgIGlmIChoYXMob2JqLCBwcm9wKSkge1xuICAgICAgICBzZXRTdHlsZVZhbHVlKGVsU3R5bGUsIHByb3AsIG9ialtwcm9wXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgYSBzaW5nbGUgYXR0cmlidXRlIG9uIGFuIEVsZW1lbnQuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS4gSWYgdGhlIHZhbHVlIGlzIGFuIG9iamVjdCBvclxuICogICAgIGZ1bmN0aW9uIGl0IGlzIHNldCBvbiB0aGUgRWxlbWVudCwgb3RoZXJ3aXNlLCBpdCBpcyBzZXQgYXMgYW4gSFRNTFxuICogICAgIGF0dHJpYnV0ZS5cbiAqL1xudmFyIGFwcGx5QXR0cmlidXRlVHlwZWQgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuXG4gIGlmICh0eXBlID09PSAnb2JqZWN0JyB8fCB0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgYXBwbHlQcm9wKGVsLCBuYW1lLCB2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgYXBwbHlBdHRyKGVsLCBuYW1lLCAvKiogQHR5cGUgez8oYm9vbGVhbnxudW1iZXJ8c3RyaW5nKX0gKi92YWx1ZSk7XG4gIH1cbn07XG5cbi8qKlxuICogQ2FsbHMgdGhlIGFwcHJvcHJpYXRlIGF0dHJpYnV0ZSBtdXRhdG9yIGZvciB0aGlzIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLlxuICovXG52YXIgdXBkYXRlQXR0cmlidXRlID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICB2YXIgZGF0YSA9IGdldERhdGEoZWwpO1xuICB2YXIgYXR0cnMgPSBkYXRhLmF0dHJzO1xuXG4gIGlmIChhdHRyc1tuYW1lXSA9PT0gdmFsdWUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgbXV0YXRvciA9IGF0dHJpYnV0ZXNbbmFtZV0gfHwgYXR0cmlidXRlc1tzeW1ib2xzLmRlZmF1bHRdO1xuICBtdXRhdG9yKGVsLCBuYW1lLCB2YWx1ZSk7XG5cbiAgYXR0cnNbbmFtZV0gPSB2YWx1ZTtcbn07XG5cbi8qKlxuICogQSBwdWJsaWNseSBtdXRhYmxlIG9iamVjdCB0byBwcm92aWRlIGN1c3RvbSBtdXRhdG9ycyBmb3IgYXR0cmlidXRlcy5cbiAqIEBjb25zdCB7IU9iamVjdDxzdHJpbmcsIGZ1bmN0aW9uKCFFbGVtZW50LCBzdHJpbmcsICopPn1cbiAqL1xudmFyIGF0dHJpYnV0ZXMgPSBjcmVhdGVNYXAoKTtcblxuLy8gU3BlY2lhbCBnZW5lcmljIG11dGF0b3IgdGhhdCdzIGNhbGxlZCBmb3IgYW55IGF0dHJpYnV0ZSB0aGF0IGRvZXMgbm90XG4vLyBoYXZlIGEgc3BlY2lmaWMgbXV0YXRvci5cbmF0dHJpYnV0ZXNbc3ltYm9scy5kZWZhdWx0XSA9IGFwcGx5QXR0cmlidXRlVHlwZWQ7XG5cbmF0dHJpYnV0ZXNbJ3N0eWxlJ10gPSBhcHBseVN0eWxlO1xuXG4vKipcbiAqIFRoZSBvZmZzZXQgaW4gdGhlIHZpcnR1YWwgZWxlbWVudCBkZWNsYXJhdGlvbiB3aGVyZSB0aGUgYXR0cmlidXRlcyBhcmVcbiAqIHNwZWNpZmllZC5cbiAqIEBjb25zdFxuICovXG52YXIgQVRUUklCVVRFU19PRkZTRVQgPSAzO1xuXG4vKipcbiAqIEJ1aWxkcyBhbiBhcnJheSBvZiBhcmd1bWVudHMgZm9yIHVzZSB3aXRoIGVsZW1lbnRPcGVuU3RhcnQsIGF0dHIgYW5kXG4gKiBlbGVtZW50T3BlbkVuZC5cbiAqIEBjb25zdCB7QXJyYXk8Kj59XG4gKi9cbnZhciBhcmdzQnVpbGRlciA9IFtdO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICogQHBhcmFtIHsuLi4qfSB2YXJfYXJncywgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICogICAgIGZvciB0aGUgRWxlbWVudC5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgZWxlbWVudE9wZW4gPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MsIHZhcl9hcmdzKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCdlbGVtZW50T3BlbicpO1xuICAgIGFzc2VydE5vdEluU2tpcCgnZWxlbWVudE9wZW4nKTtcbiAgfVxuXG4gIHZhciBub2RlID0gY29yZUVsZW1lbnRPcGVuKHRhZywga2V5KTtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuXG4gIGlmICghZGF0YS5zdGF0aWNzQXBwbGllZCkge1xuICAgIGlmIChzdGF0aWNzKSB7XG4gICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgc3RhdGljcy5sZW5ndGg7IF9pICs9IDIpIHtcbiAgICAgICAgdmFyIG5hbWUgPSAvKiogQHR5cGUge3N0cmluZ30gKi9zdGF0aWNzW19pXTtcbiAgICAgICAgdmFyIHZhbHVlID0gc3RhdGljc1tfaSArIDFdO1xuICAgICAgICB1cGRhdGVBdHRyaWJ1dGUobm9kZSwgbmFtZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBEb3duIHRoZSByb2FkLCB3ZSBtYXkgd2FudCB0byBrZWVwIHRyYWNrIG9mIHRoZSBzdGF0aWNzIGFycmF5IHRvIHVzZSBpdFxuICAgIC8vIGFzIGFuIGFkZGl0aW9uYWwgc2lnbmFsIGFib3V0IHdoZXRoZXIgYSBub2RlIG1hdGNoZXMgb3Igbm90LiBGb3Igbm93LFxuICAgIC8vIGp1c3QgdXNlIGEgbWFya2VyIHNvIHRoYXQgd2UgZG8gbm90IHJlYXBwbHkgc3RhdGljcy5cbiAgICBkYXRhLnN0YXRpY3NBcHBsaWVkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qXG4gICAqIENoZWNrcyB0byBzZWUgaWYgb25lIG9yIG1vcmUgYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQgZm9yIGEgZ2l2ZW4gRWxlbWVudC5cbiAgICogV2hlbiBubyBhdHRyaWJ1dGVzIGhhdmUgY2hhbmdlZCwgdGhpcyBpcyBtdWNoIGZhc3RlciB0aGFuIGNoZWNraW5nIGVhY2hcbiAgICogaW5kaXZpZHVhbCBhcmd1bWVudC4gV2hlbiBhdHRyaWJ1dGVzIGhhdmUgY2hhbmdlZCwgdGhlIG92ZXJoZWFkIG9mIHRoaXMgaXNcbiAgICogbWluaW1hbC5cbiAgICovXG4gIHZhciBhdHRyc0FyciA9IGRhdGEuYXR0cnNBcnI7XG4gIHZhciBuZXdBdHRycyA9IGRhdGEubmV3QXR0cnM7XG4gIHZhciBpc05ldyA9ICFhdHRyc0Fyci5sZW5ndGg7XG4gIHZhciBpID0gQVRUUklCVVRFU19PRkZTRVQ7XG4gIHZhciBqID0gMDtcblxuICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMiwgaiArPSAyKSB7XG4gICAgdmFyIF9hdHRyID0gYXJndW1lbnRzW2ldO1xuICAgIGlmIChpc05ldykge1xuICAgICAgYXR0cnNBcnJbal0gPSBfYXR0cjtcbiAgICAgIG5ld0F0dHJzW19hdHRyXSA9IHVuZGVmaW5lZDtcbiAgICB9IGVsc2UgaWYgKGF0dHJzQXJyW2pdICE9PSBfYXR0cikge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIHZhbHVlID0gYXJndW1lbnRzW2kgKyAxXTtcbiAgICBpZiAoaXNOZXcgfHwgYXR0cnNBcnJbaiArIDFdICE9PSB2YWx1ZSkge1xuICAgICAgYXR0cnNBcnJbaiArIDFdID0gdmFsdWU7XG4gICAgICB1cGRhdGVBdHRyaWJ1dGUobm9kZSwgX2F0dHIsIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBpZiAoaSA8IGFyZ3VtZW50cy5sZW5ndGggfHwgaiA8IGF0dHJzQXJyLmxlbmd0aCkge1xuICAgIGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAxLCBqICs9IDEpIHtcbiAgICAgIGF0dHJzQXJyW2pdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGlmIChqIDwgYXR0cnNBcnIubGVuZ3RoKSB7XG4gICAgICBhdHRyc0Fyci5sZW5ndGggPSBqO1xuICAgIH1cblxuICAgIC8qXG4gICAgICogQWN0dWFsbHkgcGVyZm9ybSB0aGUgYXR0cmlidXRlIHVwZGF0ZS5cbiAgICAgKi9cbiAgICBmb3IgKGkgPSAwOyBpIDwgYXR0cnNBcnIubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIHZhciBuYW1lID0gLyoqIEB0eXBlIHtzdHJpbmd9ICovYXR0cnNBcnJbaV07XG4gICAgICB2YXIgdmFsdWUgPSBhdHRyc0FycltpICsgMV07XG4gICAgICBuZXdBdHRyc1tuYW1lXSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGZvciAodmFyIF9hdHRyMiBpbiBuZXdBdHRycykge1xuICAgICAgdXBkYXRlQXR0cmlidXRlKG5vZGUsIF9hdHRyMiwgbmV3QXR0cnNbX2F0dHIyXSk7XG4gICAgICBuZXdBdHRyc1tfYXR0cjJdID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBEZWNsYXJlcyBhIHZpcnR1YWwgRWxlbWVudCBhdCB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgZG9jdW1lbnQuIFRoaXNcbiAqIGNvcnJlc3BvbmRzIHRvIGFuIG9wZW5pbmcgdGFnIGFuZCBhIGVsZW1lbnRDbG9zZSB0YWcgaXMgcmVxdWlyZWQuIFRoaXMgaXNcbiAqIGxpa2UgZWxlbWVudE9wZW4sIGJ1dCB0aGUgYXR0cmlidXRlcyBhcmUgZGVmaW5lZCB1c2luZyB0aGUgYXR0ciBmdW5jdGlvblxuICogcmF0aGVyIHRoYW4gYmVpbmcgcGFzc2VkIGFzIGFyZ3VtZW50cy4gTXVzdCBiZSBmb2xsbG93ZWQgYnkgMCBvciBtb3JlIGNhbGxzXG4gKiB0byBhdHRyLCB0aGVuIGEgY2FsbCB0byBlbGVtZW50T3BlbkVuZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICovXG52YXIgZWxlbWVudE9wZW5TdGFydCA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygnZWxlbWVudE9wZW5TdGFydCcpO1xuICAgIHNldEluQXR0cmlidXRlcyh0cnVlKTtcbiAgfVxuXG4gIGFyZ3NCdWlsZGVyWzBdID0gdGFnO1xuICBhcmdzQnVpbGRlclsxXSA9IGtleTtcbiAgYXJnc0J1aWxkZXJbMl0gPSBzdGF0aWNzO1xufTtcblxuLyoqKlxuICogRGVmaW5lcyBhIHZpcnR1YWwgYXR0cmlidXRlIGF0IHRoaXMgcG9pbnQgb2YgdGhlIERPTS4gVGhpcyBpcyBvbmx5IHZhbGlkXG4gKiB3aGVuIGNhbGxlZCBiZXR3ZWVuIGVsZW1lbnRPcGVuU3RhcnQgYW5kIGVsZW1lbnRPcGVuRW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0geyp9IHZhbHVlXG4gKi9cbnZhciBhdHRyID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0SW5BdHRyaWJ1dGVzKCdhdHRyJyk7XG4gIH1cblxuICBhcmdzQnVpbGRlci5wdXNoKG5hbWUpO1xuICBhcmdzQnVpbGRlci5wdXNoKHZhbHVlKTtcbn07XG5cbi8qKlxuICogQ2xvc2VzIGFuIG9wZW4gdGFnIHN0YXJ0ZWQgd2l0aCBlbGVtZW50T3BlblN0YXJ0LlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBlbGVtZW50T3BlbkVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRJbkF0dHJpYnV0ZXMoJ2VsZW1lbnRPcGVuRW5kJyk7XG4gICAgc2V0SW5BdHRyaWJ1dGVzKGZhbHNlKTtcbiAgfVxuXG4gIHZhciBub2RlID0gZWxlbWVudE9wZW4uYXBwbHkobnVsbCwgYXJnc0J1aWxkZXIpO1xuICBhcmdzQnVpbGRlci5sZW5ndGggPSAwO1xuICByZXR1cm4gbm9kZTtcbn07XG5cbi8qKlxuICogQ2xvc2VzIGFuIG9wZW4gdmlydHVhbCBFbGVtZW50LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGVsZW1lbnRDbG9zZSA9IGZ1bmN0aW9uICh0YWcpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoJ2VsZW1lbnRDbG9zZScpO1xuICB9XG5cbiAgdmFyIG5vZGUgPSBjb3JlRWxlbWVudENsb3NlKCk7XG5cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRDbG9zZU1hdGNoZXNPcGVuVGFnKGdldERhdGEobm9kZSkubm9kZU5hbWUsIHRhZyk7XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn07XG5cbi8qKlxuICogRGVjbGFyZXMgYSB2aXJ0dWFsIEVsZW1lbnQgYXQgdGhlIGN1cnJlbnQgbG9jYXRpb24gaW4gdGhlIGRvY3VtZW50IHRoYXQgaGFzXG4gKiBubyBjaGlsZHJlbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICogQHBhcmFtIHsuLi4qfSB2YXJfYXJncyBBdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGUgZHluYW1pYyBhdHRyaWJ1dGVzXG4gKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBlbGVtZW50Vm9pZCA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcywgdmFyX2FyZ3MpIHtcbiAgZWxlbWVudE9wZW4uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgcmV0dXJuIGVsZW1lbnRDbG9zZSh0YWcpO1xufTtcblxuLyoqXG4gKiBEZWNsYXJlcyBhIHZpcnR1YWwgVGV4dCBhdCB0aGlzIHBvaW50IGluIHRoZSBkb2N1bWVudC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8Ym9vbGVhbn0gdmFsdWUgVGhlIHZhbHVlIG9mIHRoZSBUZXh0LlxuICogQHBhcmFtIHsuLi4oZnVuY3Rpb24oKHN0cmluZ3xudW1iZXJ8Ym9vbGVhbikpOnN0cmluZyl9IHZhcl9hcmdzXG4gKiAgICAgRnVuY3Rpb25zIHRvIGZvcm1hdCB0aGUgdmFsdWUgd2hpY2ggYXJlIGNhbGxlZCBvbmx5IHdoZW4gdGhlIHZhbHVlIGhhc1xuICogICAgIGNoYW5nZWQuXG4gKiBAcmV0dXJuIHshVGV4dH0gVGhlIGNvcnJlc3BvbmRpbmcgdGV4dCBub2RlLlxuICovXG52YXIgdGV4dCA9IGZ1bmN0aW9uICh2YWx1ZSwgdmFyX2FyZ3MpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoJ3RleHQnKTtcbiAgICBhc3NlcnROb3RJblNraXAoJ3RleHQnKTtcbiAgfVxuXG4gIHZhciBub2RlID0gY29yZVRleHQoKTtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuXG4gIGlmIChkYXRhLnRleHQgIT09IHZhbHVlKSB7XG4gICAgZGF0YS50ZXh0ID0gLyoqIEB0eXBlIHtzdHJpbmd9ICovdmFsdWU7XG5cbiAgICB2YXIgZm9ybWF0dGVkID0gdmFsdWU7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIC8qXG4gICAgICAgKiBDYWxsIHRoZSBmb3JtYXR0ZXIgZnVuY3Rpb24gZGlyZWN0bHkgdG8gcHJldmVudCBsZWFraW5nIGFyZ3VtZW50cy5cbiAgICAgICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvaW5jcmVtZW50YWwtZG9tL3B1bGwvMjA0I2lzc3VlY29tbWVudC0xNzgyMjM1NzRcbiAgICAgICAqL1xuICAgICAgdmFyIGZuID0gYXJndW1lbnRzW2ldO1xuICAgICAgZm9ybWF0dGVkID0gZm4oZm9ybWF0dGVkKTtcbiAgICB9XG5cbiAgICBub2RlLmRhdGEgPSBmb3JtYXR0ZWQ7XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn07XG5cbmV4cG9ydHMucGF0Y2ggPSBwYXRjaElubmVyO1xuZXhwb3J0cy5wYXRjaElubmVyID0gcGF0Y2hJbm5lcjtcbmV4cG9ydHMucGF0Y2hPdXRlciA9IHBhdGNoT3V0ZXI7XG5leHBvcnRzLmN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQ7XG5leHBvcnRzLmN1cnJlbnRQb2ludGVyID0gY3VycmVudFBvaW50ZXI7XG5leHBvcnRzLnNraXAgPSBza2lwO1xuZXhwb3J0cy5za2lwTm9kZSA9IHNraXBOb2RlO1xuZXhwb3J0cy5lbGVtZW50Vm9pZCA9IGVsZW1lbnRWb2lkO1xuZXhwb3J0cy5lbGVtZW50T3BlblN0YXJ0ID0gZWxlbWVudE9wZW5TdGFydDtcbmV4cG9ydHMuZWxlbWVudE9wZW5FbmQgPSBlbGVtZW50T3BlbkVuZDtcbmV4cG9ydHMuZWxlbWVudE9wZW4gPSBlbGVtZW50T3BlbjtcbmV4cG9ydHMuZWxlbWVudENsb3NlID0gZWxlbWVudENsb3NlO1xuZXhwb3J0cy50ZXh0ID0gdGV4dDtcbmV4cG9ydHMuYXR0ciA9IGF0dHI7XG5leHBvcnRzLnN5bWJvbHMgPSBzeW1ib2xzO1xuZXhwb3J0cy5hdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcbmV4cG9ydHMuYXBwbHlBdHRyID0gYXBwbHlBdHRyO1xuZXhwb3J0cy5hcHBseVByb3AgPSBhcHBseVByb3A7XG5leHBvcnRzLm5vdGlmaWNhdGlvbnMgPSBub3RpZmljYXRpb25zO1xuZXhwb3J0cy5pbXBvcnROb2RlID0gaW1wb3J0Tm9kZTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5jcmVtZW50YWwtZG9tLWNqcy5qcy5tYXAiLCJleHBvcnRzWydkYXRlLXRpbWUnXSA9IC9eXFxkezR9LSg/OjBbMC05XXsxfXwxWzAtMl17MX0pLVswLTldezJ9W3RUIF1cXGR7Mn06XFxkezJ9OlxcZHsyfShcXC5cXGQrKT8oW3paXXxbKy1dXFxkezJ9OlxcZHsyfSkkL1xuZXhwb3J0c1snZGF0ZSddID0gL15cXGR7NH0tKD86MFswLTldezF9fDFbMC0yXXsxfSktWzAtOV17Mn0kL1xuZXhwb3J0c1sndGltZSddID0gL15cXGR7Mn06XFxkezJ9OlxcZHsyfSQvXG5leHBvcnRzWydlbWFpbCddID0gL15cXFMrQFxcUyskL1xuZXhwb3J0c1snaXAtYWRkcmVzcyddID0gZXhwb3J0c1snaXB2NCddID0gL14oPzooPzoyNVswLTVdfDJbMC00XVswLTldfFswMV0/WzAtOV1bMC05XT8pXFwuKXszfSg/OjI1WzAtNV18MlswLTRdWzAtOV18WzAxXT9bMC05XVswLTldPykkL1xuZXhwb3J0c1snaXB2NiddID0gL15cXHMqKCgoWzAtOUEtRmEtZl17MSw0fTopezd9KFswLTlBLUZhLWZdezEsNH18OikpfCgoWzAtOUEtRmEtZl17MSw0fTopezZ9KDpbMC05QS1GYS1mXXsxLDR9fCgoMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKFxcLigyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkpezN9KXw6KSl8KChbMC05QS1GYS1mXXsxLDR9Oil7NX0oKCg6WzAtOUEtRmEtZl17MSw0fSl7MSwyfSl8OigoMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKFxcLigyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkpezN9KXw6KSl8KChbMC05QS1GYS1mXXsxLDR9Oil7NH0oKCg6WzAtOUEtRmEtZl17MSw0fSl7MSwzfSl8KCg6WzAtOUEtRmEtZl17MSw0fSk/OigoMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKFxcLigyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkpezN9KSl8OikpfCgoWzAtOUEtRmEtZl17MSw0fTopezN9KCgoOlswLTlBLUZhLWZdezEsNH0pezEsNH0pfCgoOlswLTlBLUZhLWZdezEsNH0pezAsMn06KCgyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkoXFwuKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKSl7M30pKXw6KSl8KChbMC05QS1GYS1mXXsxLDR9Oil7Mn0oKCg6WzAtOUEtRmEtZl17MSw0fSl7MSw1fSl8KCg6WzAtOUEtRmEtZl17MSw0fSl7MCwzfTooKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKShcXC4oMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKXszfSkpfDopKXwoKFswLTlBLUZhLWZdezEsNH06KXsxfSgoKDpbMC05QS1GYS1mXXsxLDR9KXsxLDZ9KXwoKDpbMC05QS1GYS1mXXsxLDR9KXswLDR9OigoMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKFxcLigyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkpezN9KSl8OikpfCg6KCgoOlswLTlBLUZhLWZdezEsNH0pezEsN30pfCgoOlswLTlBLUZhLWZdezEsNH0pezAsNX06KCgyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkoXFwuKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKSl7M30pKXw6KSkpKCUuKyk/XFxzKiQvXG5leHBvcnRzWyd1cmknXSA9IC9eW2EtekEtWl1bYS16QS1aMC05Ky0uXSo6W15cXHNdKiQvXG5leHBvcnRzWydjb2xvciddID0gLygjPyhbMC05QS1GYS1mXXszLDZ9KVxcYil8KGFxdWEpfChibGFjayl8KGJsdWUpfChmdWNoc2lhKXwoZ3JheSl8KGdyZWVuKXwobGltZSl8KG1hcm9vbil8KG5hdnkpfChvbGl2ZSl8KG9yYW5nZSl8KHB1cnBsZSl8KHJlZCl8KHNpbHZlcil8KHRlYWwpfCh3aGl0ZSl8KHllbGxvdyl8KHJnYlxcKFxccypcXGIoWzAtOV18WzEtOV1bMC05XXwxWzAtOV1bMC05XXwyWzAtNF1bMC05XXwyNVswLTVdKVxcYlxccyosXFxzKlxcYihbMC05XXxbMS05XVswLTldfDFbMC05XVswLTldfDJbMC00XVswLTldfDI1WzAtNV0pXFxiXFxzKixcXHMqXFxiKFswLTldfFsxLTldWzAtOV18MVswLTldWzAtOV18MlswLTRdWzAtOV18MjVbMC01XSlcXGJcXHMqXFwpKXwocmdiXFwoXFxzKihcXGQ/XFxkJXwxMDAlKStcXHMqLFxccyooXFxkP1xcZCV8MTAwJSkrXFxzKixcXHMqKFxcZD9cXGQlfDEwMCUpK1xccypcXCkpL1xuZXhwb3J0c1snaG9zdG5hbWUnXSA9IC9eKFthLXpBLVowLTldfFthLXpBLVowLTldW2EtekEtWjAtOVxcLV17MCw2MX1bYS16QS1aMC05XSkoXFwuKFthLXpBLVowLTldfFthLXpBLVowLTldW2EtekEtWjAtOVxcLV17MCw2MX1bYS16QS1aMC05XSkpKiQvXG5leHBvcnRzWydhbHBoYSddID0gL15bYS16QS1aXSskL1xuZXhwb3J0c1snYWxwaGFudW1lcmljJ10gPSAvXlthLXpBLVowLTldKyQvXG5leHBvcnRzWydzdHlsZSddID0gL1xccyooLis/KTpcXHMqKFteO10rKTs/L2dcbmV4cG9ydHNbJ3Bob25lJ10gPSAvXlxcKyg/OlswLTldID8pezYsMTR9WzAtOV0kL1xuZXhwb3J0c1sndXRjLW1pbGxpc2VjJ10gPSAvXlswLTldezEsMTV9XFwuP1swLTldezAsMTV9JC9cbiIsInZhciBnZW5vYmogPSByZXF1aXJlKCdnZW5lcmF0ZS1vYmplY3QtcHJvcGVydHknKVxudmFyIGdlbmZ1biA9IHJlcXVpcmUoJ2dlbmVyYXRlLWZ1bmN0aW9uJylcbnZhciBqc29ucG9pbnRlciA9IHJlcXVpcmUoJ2pzb25wb2ludGVyJylcbnZhciB4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kJylcbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJylcblxudmFyIGdldCA9IGZ1bmN0aW9uKG9iaiwgYWRkaXRpb25hbFNjaGVtYXMsIHB0cikge1xuXG4gIHZhciB2aXNpdCA9IGZ1bmN0aW9uKHN1Yikge1xuICAgIGlmIChzdWIgJiYgc3ViLmlkID09PSBwdHIpIHJldHVybiBzdWJcbiAgICBpZiAodHlwZW9mIHN1YiAhPT0gJ29iamVjdCcgfHwgIXN1YikgcmV0dXJuIG51bGxcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoc3ViKS5yZWR1Y2UoZnVuY3Rpb24ocmVzLCBrKSB7XG4gICAgICByZXR1cm4gcmVzIHx8IHZpc2l0KHN1YltrXSlcbiAgICB9LCBudWxsKVxuICB9XG5cbiAgdmFyIHJlcyA9IHZpc2l0KG9iailcbiAgaWYgKHJlcykgcmV0dXJuIHJlc1xuXG4gIHB0ciA9IHB0ci5yZXBsYWNlKC9eIy8sICcnKVxuICBwdHIgPSBwdHIucmVwbGFjZSgvXFwvJC8sICcnKVxuXG4gIHRyeSB7XG4gICAgcmV0dXJuIGpzb25wb2ludGVyLmdldChvYmosIGRlY29kZVVSSShwdHIpKVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICB2YXIgZW5kID0gcHRyLmluZGV4T2YoJyMnKVxuICAgIHZhciBvdGhlclxuICAgIC8vIGV4dGVybmFsIHJlZmVyZW5jZVxuICAgIGlmIChlbmQgIT09IDApIHtcbiAgICAgIC8vIGZyYWdtZW50IGRvZXNuJ3QgZXhpc3QuXG4gICAgICBpZiAoZW5kID09PSAtMSkge1xuICAgICAgICBvdGhlciA9IGFkZGl0aW9uYWxTY2hlbWFzW3B0cl1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBleHQgPSBwdHIuc2xpY2UoMCwgZW5kKVxuICAgICAgICBvdGhlciA9IGFkZGl0aW9uYWxTY2hlbWFzW2V4dF1cbiAgICAgICAgdmFyIGZyYWdtZW50ID0gcHRyLnNsaWNlKGVuZCkucmVwbGFjZSgvXiMvLCAnJylcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4ganNvbnBvaW50ZXIuZ2V0KG90aGVyLCBmcmFnbWVudClcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7fVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBvdGhlciA9IGFkZGl0aW9uYWxTY2hlbWFzW3B0cl1cbiAgICB9XG4gICAgcmV0dXJuIG90aGVyIHx8IG51bGxcbiAgfVxufVxuXG52YXIgZm9ybWF0TmFtZSA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gIGZpZWxkID0gSlNPTi5zdHJpbmdpZnkoZmllbGQpXG4gIHZhciBwYXR0ZXJuID0gL1xcWyhbXlxcW1xcXVwiXSspXFxdL1xuICB3aGlsZSAocGF0dGVybi50ZXN0KGZpZWxkKSkgZmllbGQgPSBmaWVsZC5yZXBsYWNlKHBhdHRlcm4sICcuXCIrJDErXCInKVxuICByZXR1cm4gZmllbGRcbn1cblxudmFyIHR5cGVzID0ge31cblxudHlwZXMuYW55ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAndHJ1ZSdcbn1cblxudHlwZXMubnVsbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuIG5hbWUrJyA9PT0gbnVsbCdcbn1cblxudHlwZXMuYm9vbGVhbiA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuICd0eXBlb2YgJytuYW1lKycgPT09IFwiYm9vbGVhblwiJ1xufVxuXG50eXBlcy5hcnJheSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuICdBcnJheS5pc0FycmF5KCcrbmFtZSsnKSdcbn1cblxudHlwZXMub2JqZWN0ID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gJ3R5cGVvZiAnK25hbWUrJyA9PT0gXCJvYmplY3RcIiAmJiAnK25hbWUrJyAmJiAhQXJyYXkuaXNBcnJheSgnK25hbWUrJyknXG59XG5cbnR5cGVzLm51bWJlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuICd0eXBlb2YgJytuYW1lKycgPT09IFwibnVtYmVyXCInXG59XG5cbnR5cGVzLmludGVnZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiAndHlwZW9mICcrbmFtZSsnID09PSBcIm51bWJlclwiICYmIChNYXRoLmZsb29yKCcrbmFtZSsnKSA9PT0gJytuYW1lKycgfHwgJytuYW1lKycgPiA5MDA3MTk5MjU0NzQwOTkyIHx8ICcrbmFtZSsnIDwgLTkwMDcxOTkyNTQ3NDA5OTIpJ1xufVxuXG50eXBlcy5zdHJpbmcgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiAndHlwZW9mICcrbmFtZSsnID09PSBcInN0cmluZ1wiJ1xufVxuXG52YXIgdW5pcXVlID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgdmFyIGxpc3QgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgbGlzdC5wdXNoKHR5cGVvZiBhcnJheVtpXSA9PT0gJ29iamVjdCcgPyBKU09OLnN0cmluZ2lmeShhcnJheVtpXSkgOiBhcnJheVtpXSlcbiAgfVxuICBmb3IgKHZhciBpID0gMTsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAobGlzdC5pbmRleE9mKGxpc3RbaV0pICE9PSBpKSByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG52YXIgaXNNdWx0aXBsZU9mID0gZnVuY3Rpb24obmFtZSwgbXVsdGlwbGVPZikge1xuICB2YXIgcmVzO1xuICB2YXIgZmFjdG9yID0gKChtdWx0aXBsZU9mIHwgMCkgIT09IG11bHRpcGxlT2YpID8gTWF0aC5wb3coMTAsIG11bHRpcGxlT2YudG9TdHJpbmcoKS5zcGxpdCgnLicpLnBvcCgpLmxlbmd0aCkgOiAxXG4gIGlmIChmYWN0b3IgPiAxKSB7XG4gICAgdmFyIGZhY3Rvck5hbWUgPSAoKG5hbWUgfCAwKSAhPT0gbmFtZSkgPyBNYXRoLnBvdygxMCwgbmFtZS50b1N0cmluZygpLnNwbGl0KCcuJykucG9wKCkubGVuZ3RoKSA6IDFcbiAgICBpZiAoZmFjdG9yTmFtZSA+IGZhY3RvcikgcmVzID0gdHJ1ZVxuICAgIGVsc2UgcmVzID0gTWF0aC5yb3VuZChmYWN0b3IgKiBuYW1lKSAlIChmYWN0b3IgKiBtdWx0aXBsZU9mKVxuICB9XG4gIGVsc2UgcmVzID0gbmFtZSAlIG11bHRpcGxlT2Y7XG4gIHJldHVybiAhcmVzO1xufVxuXG52YXIgdG9UeXBlID0gZnVuY3Rpb24obm9kZSkge1xuICByZXR1cm4gbm9kZS50eXBlXG59XG5cbnZhciBjb21waWxlID0gZnVuY3Rpb24oc2NoZW1hLCBjYWNoZSwgcm9vdCwgcmVwb3J0ZXIsIG9wdHMpIHtcbiAgdmFyIGZtdHMgPSBvcHRzID8geHRlbmQoZm9ybWF0cywgb3B0cy5mb3JtYXRzKSA6IGZvcm1hdHNcbiAgdmFyIHNjb3BlID0ge3VuaXF1ZTp1bmlxdWUsIGZvcm1hdHM6Zm10cywgaXNNdWx0aXBsZU9mOmlzTXVsdGlwbGVPZn1cbiAgdmFyIHZlcmJvc2UgPSBvcHRzID8gISFvcHRzLnZlcmJvc2UgOiBmYWxzZTtcbiAgdmFyIGdyZWVkeSA9IG9wdHMgJiYgb3B0cy5ncmVlZHkgIT09IHVuZGVmaW5lZCA/XG4gICAgb3B0cy5ncmVlZHkgOiBmYWxzZTtcblxuICB2YXIgc3ltcyA9IHt9XG4gIHZhciBnZW5zeW0gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIG5hbWUrKHN5bXNbbmFtZV0gPSAoc3ltc1tuYW1lXSB8fCAwKSsxKVxuICB9XG5cbiAgdmFyIHJldmVyc2VQYXR0ZXJucyA9IHt9XG4gIHZhciBwYXR0ZXJucyA9IGZ1bmN0aW9uKHApIHtcbiAgICBpZiAocmV2ZXJzZVBhdHRlcm5zW3BdKSByZXR1cm4gcmV2ZXJzZVBhdHRlcm5zW3BdXG4gICAgdmFyIG4gPSBnZW5zeW0oJ3BhdHRlcm4nKVxuICAgIHNjb3BlW25dID0gbmV3IFJlZ0V4cChwKVxuICAgIHJldmVyc2VQYXR0ZXJuc1twXSA9IG5cbiAgICByZXR1cm4gblxuICB9XG5cbiAgdmFyIHZhcnMgPSBbJ2knLCdqJywnaycsJ2wnLCdtJywnbicsJ28nLCdwJywncScsJ3InLCdzJywndCcsJ3UnLCd2JywneCcsJ3knLCd6J11cbiAgdmFyIGdlbmxvb3AgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdiA9IHZhcnMuc2hpZnQoKVxuICAgIHZhcnMucHVzaCh2K3ZbMF0pXG4gICAgcmV0dXJuIHZcbiAgfVxuXG4gIHZhciB2aXNpdCA9IGZ1bmN0aW9uKG5hbWUsIG5vZGUsIHJlcG9ydGVyLCBmaWx0ZXIpIHtcbiAgICB2YXIgcHJvcGVydGllcyA9IG5vZGUucHJvcGVydGllc1xuICAgIHZhciB0eXBlID0gbm9kZS50eXBlXG4gICAgdmFyIHR1cGxlID0gZmFsc2VcblxuICAgIGlmIChBcnJheS5pc0FycmF5KG5vZGUuaXRlbXMpKSB7IC8vIHR1cGxlIHR5cGVcbiAgICAgIHByb3BlcnRpZXMgPSB7fVxuICAgICAgbm9kZS5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0sIGkpIHtcbiAgICAgICAgcHJvcGVydGllc1tpXSA9IGl0ZW1cbiAgICAgIH0pXG4gICAgICB0eXBlID0gJ2FycmF5J1xuICAgICAgdHVwbGUgPSB0cnVlXG4gICAgfVxuXG4gICAgdmFyIGluZGVudCA9IDBcbiAgICB2YXIgZXJyb3IgPSBmdW5jdGlvbihtc2csIHByb3AsIHZhbHVlKSB7XG4gICAgICB2YWxpZGF0ZSgnZXJyb3JzKysnKVxuICAgICAgaWYgKHJlcG9ydGVyID09PSB0cnVlKSB7XG4gICAgICAgIHZhbGlkYXRlKCdpZiAodmFsaWRhdGUuZXJyb3JzID09PSBudWxsKSB2YWxpZGF0ZS5lcnJvcnMgPSBbXScpXG4gICAgICAgIGlmICh2ZXJib3NlKSB7XG4gICAgICAgICAgdmFsaWRhdGUoJ3ZhbGlkYXRlLmVycm9ycy5wdXNoKHtmaWVsZDolcyxtZXNzYWdlOiVzLHZhbHVlOiVzLHR5cGU6JXN9KScsIGZvcm1hdE5hbWUocHJvcCB8fCBuYW1lKSwgSlNPTi5zdHJpbmdpZnkobXNnKSwgdmFsdWUgfHwgbmFtZSwgSlNPTi5zdHJpbmdpZnkodHlwZSkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsaWRhdGUoJ3ZhbGlkYXRlLmVycm9ycy5wdXNoKHtmaWVsZDolcyxtZXNzYWdlOiVzfSknLCBmb3JtYXROYW1lKHByb3AgfHwgbmFtZSksIEpTT04uc3RyaW5naWZ5KG1zZykpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobm9kZS5yZXF1aXJlZCA9PT0gdHJ1ZSkge1xuICAgICAgaW5kZW50KytcbiAgICAgIHZhbGlkYXRlKCdpZiAoJXMgPT09IHVuZGVmaW5lZCkgeycsIG5hbWUpXG4gICAgICBlcnJvcignaXMgcmVxdWlyZWQnKVxuICAgICAgdmFsaWRhdGUoJ30gZWxzZSB7JylcbiAgICB9IGVsc2Uge1xuICAgICAgaW5kZW50KytcbiAgICAgIHZhbGlkYXRlKCdpZiAoJXMgIT09IHVuZGVmaW5lZCkgeycsIG5hbWUpXG4gICAgfVxuXG4gICAgdmFyIHZhbGlkID0gW10uY29uY2F0KHR5cGUpXG4gICAgICAubWFwKGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVzW3QgfHwgJ2FueSddKG5hbWUpXG4gICAgICB9KVxuICAgICAgLmpvaW4oJyB8fCAnKSB8fCAndHJ1ZSdcblxuICAgIGlmICh2YWxpZCAhPT0gJ3RydWUnKSB7XG4gICAgICBpbmRlbnQrK1xuICAgICAgdmFsaWRhdGUoJ2lmICghKCVzKSkgeycsIHZhbGlkKVxuICAgICAgZXJyb3IoJ2lzIHRoZSB3cm9uZyB0eXBlJylcbiAgICAgIHZhbGlkYXRlKCd9IGVsc2UgeycpXG4gICAgfVxuXG4gICAgaWYgKHR1cGxlKSB7XG4gICAgICBpZiAobm9kZS5hZGRpdGlvbmFsSXRlbXMgPT09IGZhbHNlKSB7XG4gICAgICAgIHZhbGlkYXRlKCdpZiAoJXMubGVuZ3RoID4gJWQpIHsnLCBuYW1lLCBub2RlLml0ZW1zLmxlbmd0aClcbiAgICAgICAgZXJyb3IoJ2hhcyBhZGRpdGlvbmFsIGl0ZW1zJylcbiAgICAgICAgdmFsaWRhdGUoJ30nKVxuICAgICAgfSBlbHNlIGlmIChub2RlLmFkZGl0aW9uYWxJdGVtcykge1xuICAgICAgICB2YXIgaSA9IGdlbmxvb3AoKVxuICAgICAgICB2YWxpZGF0ZSgnZm9yICh2YXIgJXMgPSAlZDsgJXMgPCAlcy5sZW5ndGg7ICVzKyspIHsnLCBpLCBub2RlLml0ZW1zLmxlbmd0aCwgaSwgbmFtZSwgaSlcbiAgICAgICAgdmlzaXQobmFtZSsnWycraSsnXScsIG5vZGUuYWRkaXRpb25hbEl0ZW1zLCByZXBvcnRlciwgZmlsdGVyKVxuICAgICAgICB2YWxpZGF0ZSgnfScpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG5vZGUuZm9ybWF0ICYmIGZtdHNbbm9kZS5mb3JtYXRdKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ3N0cmluZycgJiYgZm9ybWF0c1tub2RlLmZvcm1hdF0pIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5zdHJpbmcobmFtZSkpXG4gICAgICB2YXIgbiA9IGdlbnN5bSgnZm9ybWF0JylcbiAgICAgIHNjb3BlW25dID0gZm10c1tub2RlLmZvcm1hdF1cblxuICAgICAgaWYgKHR5cGVvZiBzY29wZVtuXSA9PT0gJ2Z1bmN0aW9uJykgdmFsaWRhdGUoJ2lmICghJXMoJXMpKSB7JywgbiwgbmFtZSlcbiAgICAgIGVsc2UgdmFsaWRhdGUoJ2lmICghJXMudGVzdCglcykpIHsnLCBuLCBuYW1lKVxuICAgICAgZXJyb3IoJ211c3QgYmUgJytub2RlLmZvcm1hdCsnIGZvcm1hdCcpXG4gICAgICB2YWxpZGF0ZSgnfScpXG4gICAgICBpZiAodHlwZSAhPT0gJ3N0cmluZycgJiYgZm9ybWF0c1tub2RlLmZvcm1hdF0pIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShub2RlLnJlcXVpcmVkKSkge1xuICAgICAgdmFyIGlzVW5kZWZpbmVkID0gZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHJldHVybiBnZW5vYmoobmFtZSwgcmVxKSArICcgPT09IHVuZGVmaW5lZCdcbiAgICAgIH1cblxuICAgICAgdmFyIGNoZWNrUmVxdWlyZWQgPSBmdW5jdGlvbiAocmVxKSB7XG4gICAgICAgIHZhciBwcm9wID0gZ2Vub2JqKG5hbWUsIHJlcSk7XG4gICAgICAgIHZhbGlkYXRlKCdpZiAoJXMgPT09IHVuZGVmaW5lZCkgeycsIHByb3ApXG4gICAgICAgIGVycm9yKCdpcyByZXF1aXJlZCcsIHByb3ApXG4gICAgICAgIHZhbGlkYXRlKCdtaXNzaW5nKysnKVxuICAgICAgICB2YWxpZGF0ZSgnfScpXG4gICAgICB9XG4gICAgICB2YWxpZGF0ZSgnaWYgKCglcykpIHsnLCB0eXBlICE9PSAnb2JqZWN0JyA/IHR5cGVzLm9iamVjdChuYW1lKSA6ICd0cnVlJylcbiAgICAgIHZhbGlkYXRlKCd2YXIgbWlzc2luZyA9IDAnKVxuICAgICAgbm9kZS5yZXF1aXJlZC5tYXAoY2hlY2tSZXF1aXJlZClcbiAgICAgIHZhbGlkYXRlKCd9Jyk7XG4gICAgICBpZiAoIWdyZWVkeSkge1xuICAgICAgICB2YWxpZGF0ZSgnaWYgKG1pc3NpbmcgPT09IDApIHsnKVxuICAgICAgICBpbmRlbnQrK1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChub2RlLnVuaXF1ZUl0ZW1zKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ2FycmF5JykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLmFycmF5KG5hbWUpKVxuICAgICAgdmFsaWRhdGUoJ2lmICghKHVuaXF1ZSglcykpKSB7JywgbmFtZSlcbiAgICAgIGVycm9yKCdtdXN0IGJlIHVuaXF1ZScpXG4gICAgICB2YWxpZGF0ZSgnfScpXG4gICAgICBpZiAodHlwZSAhPT0gJ2FycmF5JykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLmVudW0pIHtcbiAgICAgIHZhciBjb21wbGV4ID0gbm9kZS5lbnVtLnNvbWUoZnVuY3Rpb24oZSkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGUgPT09ICdvYmplY3QnXG4gICAgICB9KVxuXG4gICAgICB2YXIgY29tcGFyZSA9IGNvbXBsZXggP1xuICAgICAgICBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgcmV0dXJuICdKU09OLnN0cmluZ2lmeSgnK25hbWUrJyknKycgIT09IEpTT04uc3RyaW5naWZ5KCcrSlNPTi5zdHJpbmdpZnkoZSkrJyknXG4gICAgICAgIH0gOlxuICAgICAgICBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgcmV0dXJuIG5hbWUrJyAhPT0gJytKU09OLnN0cmluZ2lmeShlKVxuICAgICAgICB9XG5cbiAgICAgIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCBub2RlLmVudW0ubWFwKGNvbXBhcmUpLmpvaW4oJyAmJiAnKSB8fCAnZmFsc2UnKVxuICAgICAgZXJyb3IoJ211c3QgYmUgYW4gZW51bSB2YWx1ZScpXG4gICAgICB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUuZGVwZW5kZW5jaWVzKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ29iamVjdCcpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5vYmplY3QobmFtZSkpXG5cbiAgICAgIE9iamVjdC5rZXlzKG5vZGUuZGVwZW5kZW5jaWVzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB2YXIgZGVwcyA9IG5vZGUuZGVwZW5kZW5jaWVzW2tleV1cbiAgICAgICAgaWYgKHR5cGVvZiBkZXBzID09PSAnc3RyaW5nJykgZGVwcyA9IFtkZXBzXVxuXG4gICAgICAgIHZhciBleGlzdHMgPSBmdW5jdGlvbihrKSB7XG4gICAgICAgICAgcmV0dXJuIGdlbm9iaihuYW1lLCBrKSArICcgIT09IHVuZGVmaW5lZCdcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGRlcHMpKSB7XG4gICAgICAgICAgdmFsaWRhdGUoJ2lmICglcyAhPT0gdW5kZWZpbmVkICYmICEoJXMpKSB7JywgZ2Vub2JqKG5hbWUsIGtleSksIGRlcHMubWFwKGV4aXN0cykuam9pbignICYmICcpIHx8ICd0cnVlJylcbiAgICAgICAgICBlcnJvcignZGVwZW5kZW5jaWVzIG5vdCBzZXQnKVxuICAgICAgICAgIHZhbGlkYXRlKCd9JylcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGRlcHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdmFsaWRhdGUoJ2lmICglcyAhPT0gdW5kZWZpbmVkKSB7JywgZ2Vub2JqKG5hbWUsIGtleSkpXG4gICAgICAgICAgdmlzaXQobmFtZSwgZGVwcywgcmVwb3J0ZXIsIGZpbHRlcilcbiAgICAgICAgICB2YWxpZGF0ZSgnfScpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGlmICh0eXBlICE9PSAnb2JqZWN0JykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLmFkZGl0aW9uYWxQcm9wZXJ0aWVzIHx8IG5vZGUuYWRkaXRpb25hbFByb3BlcnRpZXMgPT09IGZhbHNlKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ29iamVjdCcpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5vYmplY3QobmFtZSkpXG5cbiAgICAgIHZhciBpID0gZ2VubG9vcCgpXG4gICAgICB2YXIga2V5cyA9IGdlbnN5bSgna2V5cycpXG5cbiAgICAgIHZhciB0b0NvbXBhcmUgPSBmdW5jdGlvbihwKSB7XG4gICAgICAgIHJldHVybiBrZXlzKydbJytpKyddICE9PSAnK0pTT04uc3RyaW5naWZ5KHApXG4gICAgICB9XG5cbiAgICAgIHZhciB0b1Rlc3QgPSBmdW5jdGlvbihwKSB7XG4gICAgICAgIHJldHVybiAnIScrcGF0dGVybnMocCkrJy50ZXN0KCcra2V5cysnWycraSsnXSknXG4gICAgICB9XG5cbiAgICAgIHZhciBhZGRpdGlvbmFsUHJvcCA9IE9iamVjdC5rZXlzKHByb3BlcnRpZXMgfHwge30pLm1hcCh0b0NvbXBhcmUpXG4gICAgICAgIC5jb25jYXQoT2JqZWN0LmtleXMobm9kZS5wYXR0ZXJuUHJvcGVydGllcyB8fCB7fSkubWFwKHRvVGVzdCkpXG4gICAgICAgIC5qb2luKCcgJiYgJykgfHwgJ3RydWUnXG5cbiAgICAgIHZhbGlkYXRlKCd2YXIgJXMgPSBPYmplY3Qua2V5cyglcyknLCBrZXlzLCBuYW1lKVxuICAgICAgICAoJ2ZvciAodmFyICVzID0gMDsgJXMgPCAlcy5sZW5ndGg7ICVzKyspIHsnLCBpLCBpLCBrZXlzLCBpKVxuICAgICAgICAgICgnaWYgKCVzKSB7JywgYWRkaXRpb25hbFByb3ApXG5cbiAgICAgIGlmIChub2RlLmFkZGl0aW9uYWxQcm9wZXJ0aWVzID09PSBmYWxzZSkge1xuICAgICAgICBpZiAoZmlsdGVyKSB2YWxpZGF0ZSgnZGVsZXRlICVzJywgbmFtZSsnWycra2V5cysnWycraSsnXV0nKVxuICAgICAgICBlcnJvcignaGFzIGFkZGl0aW9uYWwgcHJvcGVydGllcycsIG51bGwsIEpTT04uc3RyaW5naWZ5KG5hbWUrJy4nKSArICcgKyAnICsga2V5cyArICdbJytpKyddJylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpc2l0KG5hbWUrJ1snK2tleXMrJ1snK2krJ11dJywgbm9kZS5hZGRpdGlvbmFsUHJvcGVydGllcywgcmVwb3J0ZXIsIGZpbHRlcilcbiAgICAgIH1cblxuICAgICAgdmFsaWRhdGVcbiAgICAgICAgICAoJ30nKVxuICAgICAgICAoJ30nKVxuXG4gICAgICBpZiAodHlwZSAhPT0gJ29iamVjdCcpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS4kcmVmKSB7XG4gICAgICB2YXIgc3ViID0gZ2V0KHJvb3QsIG9wdHMgJiYgb3B0cy5zY2hlbWFzIHx8IHt9LCBub2RlLiRyZWYpXG4gICAgICBpZiAoc3ViKSB7XG4gICAgICAgIHZhciBmbiA9IGNhY2hlW25vZGUuJHJlZl1cbiAgICAgICAgaWYgKCFmbikge1xuICAgICAgICAgIGNhY2hlW25vZGUuJHJlZl0gPSBmdW5jdGlvbiBwcm94eShkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oZGF0YSlcbiAgICAgICAgICB9XG4gICAgICAgICAgZm4gPSBjb21waWxlKHN1YiwgY2FjaGUsIHJvb3QsIGZhbHNlLCBvcHRzKVxuICAgICAgICB9XG4gICAgICAgIHZhciBuID0gZ2Vuc3ltKCdyZWYnKVxuICAgICAgICBzY29wZVtuXSA9IGZuXG4gICAgICAgIHZhbGlkYXRlKCdpZiAoISglcyglcykpKSB7JywgbiwgbmFtZSlcbiAgICAgICAgZXJyb3IoJ3JlZmVyZW5jZWQgc2NoZW1hIGRvZXMgbm90IG1hdGNoJylcbiAgICAgICAgdmFsaWRhdGUoJ30nKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChub2RlLm5vdCkge1xuICAgICAgdmFyIHByZXYgPSBnZW5zeW0oJ3ByZXYnKVxuICAgICAgdmFsaWRhdGUoJ3ZhciAlcyA9IGVycm9ycycsIHByZXYpXG4gICAgICB2aXNpdChuYW1lLCBub2RlLm5vdCwgZmFsc2UsIGZpbHRlcilcbiAgICAgIHZhbGlkYXRlKCdpZiAoJXMgPT09IGVycm9ycykgeycsIHByZXYpXG4gICAgICBlcnJvcignbmVnYXRpdmUgc2NoZW1hIG1hdGNoZXMnKVxuICAgICAgdmFsaWRhdGUoJ30gZWxzZSB7JylcbiAgICAgICAgKCdlcnJvcnMgPSAlcycsIHByZXYpXG4gICAgICAoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLml0ZW1zICYmICF0dXBsZSkge1xuICAgICAgaWYgKHR5cGUgIT09ICdhcnJheScpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5hcnJheShuYW1lKSlcblxuICAgICAgdmFyIGkgPSBnZW5sb29wKClcbiAgICAgIHZhbGlkYXRlKCdmb3IgKHZhciAlcyA9IDA7ICVzIDwgJXMubGVuZ3RoOyAlcysrKSB7JywgaSwgaSwgbmFtZSwgaSlcbiAgICAgIHZpc2l0KG5hbWUrJ1snK2krJ10nLCBub2RlLml0ZW1zLCByZXBvcnRlciwgZmlsdGVyKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuXG4gICAgICBpZiAodHlwZSAhPT0gJ2FycmF5JykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLnBhdHRlcm5Qcm9wZXJ0aWVzKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ29iamVjdCcpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5vYmplY3QobmFtZSkpXG4gICAgICB2YXIga2V5cyA9IGdlbnN5bSgna2V5cycpXG4gICAgICB2YXIgaSA9IGdlbmxvb3AoKVxuICAgICAgdmFsaWRhdGVcbiAgICAgICAgKCd2YXIgJXMgPSBPYmplY3Qua2V5cyglcyknLCBrZXlzLCBuYW1lKVxuICAgICAgICAoJ2ZvciAodmFyICVzID0gMDsgJXMgPCAlcy5sZW5ndGg7ICVzKyspIHsnLCBpLCBpLCBrZXlzLCBpKVxuXG4gICAgICBPYmplY3Qua2V5cyhub2RlLnBhdHRlcm5Qcm9wZXJ0aWVzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB2YXIgcCA9IHBhdHRlcm5zKGtleSlcbiAgICAgICAgdmFsaWRhdGUoJ2lmICglcy50ZXN0KCVzKSkgeycsIHAsIGtleXMrJ1snK2krJ10nKVxuICAgICAgICB2aXNpdChuYW1lKydbJytrZXlzKydbJytpKyddXScsIG5vZGUucGF0dGVyblByb3BlcnRpZXNba2V5XSwgcmVwb3J0ZXIsIGZpbHRlcilcbiAgICAgICAgdmFsaWRhdGUoJ30nKVxuICAgICAgfSlcblxuICAgICAgdmFsaWRhdGUoJ30nKVxuICAgICAgaWYgKHR5cGUgIT09ICdvYmplY3QnKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUucGF0dGVybikge1xuICAgICAgdmFyIHAgPSBwYXR0ZXJucyhub2RlLnBhdHRlcm4pXG4gICAgICBpZiAodHlwZSAhPT0gJ3N0cmluZycpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5zdHJpbmcobmFtZSkpXG4gICAgICB2YWxpZGF0ZSgnaWYgKCEoJXMudGVzdCglcykpKSB7JywgcCwgbmFtZSlcbiAgICAgIGVycm9yKCdwYXR0ZXJuIG1pc21hdGNoJylcbiAgICAgIHZhbGlkYXRlKCd9JylcbiAgICAgIGlmICh0eXBlICE9PSAnc3RyaW5nJykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLmFsbE9mKSB7XG4gICAgICBub2RlLmFsbE9mLmZvckVhY2goZnVuY3Rpb24oc2NoKSB7XG4gICAgICAgIHZpc2l0KG5hbWUsIHNjaCwgcmVwb3J0ZXIsIGZpbHRlcilcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKG5vZGUuYW55T2YgJiYgbm9kZS5hbnlPZi5sZW5ndGgpIHtcbiAgICAgIHZhciBwcmV2ID0gZ2Vuc3ltKCdwcmV2JylcblxuICAgICAgbm9kZS5hbnlPZi5mb3JFYWNoKGZ1bmN0aW9uKHNjaCwgaSkge1xuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgIHZhbGlkYXRlKCd2YXIgJXMgPSBlcnJvcnMnLCBwcmV2KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbGlkYXRlKCdpZiAoZXJyb3JzICE9PSAlcykgeycsIHByZXYpXG4gICAgICAgICAgICAoJ2Vycm9ycyA9ICVzJywgcHJldilcbiAgICAgICAgfVxuICAgICAgICB2aXNpdChuYW1lLCBzY2gsIGZhbHNlLCBmYWxzZSlcbiAgICAgIH0pXG4gICAgICBub2RlLmFueU9mLmZvckVhY2goZnVuY3Rpb24oc2NoLCBpKSB7XG4gICAgICAgIGlmIChpKSB2YWxpZGF0ZSgnfScpXG4gICAgICB9KVxuICAgICAgdmFsaWRhdGUoJ2lmICglcyAhPT0gZXJyb3JzKSB7JywgcHJldilcbiAgICAgIGVycm9yKCdubyBzY2hlbWFzIG1hdGNoJylcbiAgICAgIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5vbmVPZiAmJiBub2RlLm9uZU9mLmxlbmd0aCkge1xuICAgICAgdmFyIHByZXYgPSBnZW5zeW0oJ3ByZXYnKVxuICAgICAgdmFyIHBhc3NlcyA9IGdlbnN5bSgncGFzc2VzJylcblxuICAgICAgdmFsaWRhdGVcbiAgICAgICAgKCd2YXIgJXMgPSBlcnJvcnMnLCBwcmV2KVxuICAgICAgICAoJ3ZhciAlcyA9IDAnLCBwYXNzZXMpXG5cbiAgICAgIG5vZGUub25lT2YuZm9yRWFjaChmdW5jdGlvbihzY2gsIGkpIHtcbiAgICAgICAgdmlzaXQobmFtZSwgc2NoLCBmYWxzZSwgZmFsc2UpXG4gICAgICAgIHZhbGlkYXRlKCdpZiAoJXMgPT09IGVycm9ycykgeycsIHByZXYpXG4gICAgICAgICAgKCclcysrJywgcGFzc2VzKVxuICAgICAgICAoJ30gZWxzZSB7JylcbiAgICAgICAgICAoJ2Vycm9ycyA9ICVzJywgcHJldilcbiAgICAgICAgKCd9JylcbiAgICAgIH0pXG5cbiAgICAgIHZhbGlkYXRlKCdpZiAoJXMgIT09IDEpIHsnLCBwYXNzZXMpXG4gICAgICBlcnJvcignbm8gKG9yIG1vcmUgdGhhbiBvbmUpIHNjaGVtYXMgbWF0Y2gnKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLm11bHRpcGxlT2YgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGUgIT09ICdudW1iZXInICYmIHR5cGUgIT09ICdpbnRlZ2VyJykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLm51bWJlcihuYW1lKSlcblxuICAgICAgdmFsaWRhdGUoJ2lmICghaXNNdWx0aXBsZU9mKCVzLCAlZCkpIHsnLCBuYW1lLCBub2RlLm11bHRpcGxlT2YpXG5cbiAgICAgIGVycm9yKCdoYXMgYSByZW1haW5kZXInKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuXG4gICAgICBpZiAodHlwZSAhPT0gJ251bWJlcicgJiYgdHlwZSAhPT0gJ2ludGVnZXInKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUubWF4UHJvcGVydGllcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ29iamVjdCcpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5vYmplY3QobmFtZSkpXG5cbiAgICAgIHZhbGlkYXRlKCdpZiAoT2JqZWN0LmtleXMoJXMpLmxlbmd0aCA+ICVkKSB7JywgbmFtZSwgbm9kZS5tYXhQcm9wZXJ0aWVzKVxuICAgICAgZXJyb3IoJ2hhcyBtb3JlIHByb3BlcnRpZXMgdGhhbiBhbGxvd2VkJylcbiAgICAgIHZhbGlkYXRlKCd9JylcblxuICAgICAgaWYgKHR5cGUgIT09ICdvYmplY3QnKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUubWluUHJvcGVydGllcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ29iamVjdCcpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5vYmplY3QobmFtZSkpXG5cbiAgICAgIHZhbGlkYXRlKCdpZiAoT2JqZWN0LmtleXMoJXMpLmxlbmd0aCA8ICVkKSB7JywgbmFtZSwgbm9kZS5taW5Qcm9wZXJ0aWVzKVxuICAgICAgZXJyb3IoJ2hhcyBsZXNzIHByb3BlcnRpZXMgdGhhbiBhbGxvd2VkJylcbiAgICAgIHZhbGlkYXRlKCd9JylcblxuICAgICAgaWYgKHR5cGUgIT09ICdvYmplY3QnKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUubWF4SXRlbXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGUgIT09ICdhcnJheScpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5hcnJheShuYW1lKSlcblxuICAgICAgdmFsaWRhdGUoJ2lmICglcy5sZW5ndGggPiAlZCkgeycsIG5hbWUsIG5vZGUubWF4SXRlbXMpXG4gICAgICBlcnJvcignaGFzIG1vcmUgaXRlbXMgdGhhbiBhbGxvd2VkJylcbiAgICAgIHZhbGlkYXRlKCd9JylcblxuICAgICAgaWYgKHR5cGUgIT09ICdhcnJheScpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5taW5JdGVtcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ2FycmF5JykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLmFycmF5KG5hbWUpKVxuXG4gICAgICB2YWxpZGF0ZSgnaWYgKCVzLmxlbmd0aCA8ICVkKSB7JywgbmFtZSwgbm9kZS5taW5JdGVtcylcbiAgICAgIGVycm9yKCdoYXMgbGVzcyBpdGVtcyB0aGFuIGFsbG93ZWQnKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuXG4gICAgICBpZiAodHlwZSAhPT0gJ2FycmF5JykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLm1heExlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ3N0cmluZycpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5zdHJpbmcobmFtZSkpXG5cbiAgICAgIHZhbGlkYXRlKCdpZiAoJXMubGVuZ3RoID4gJWQpIHsnLCBuYW1lLCBub2RlLm1heExlbmd0aClcbiAgICAgIGVycm9yKCdoYXMgbG9uZ2VyIGxlbmd0aCB0aGFuIGFsbG93ZWQnKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuXG4gICAgICBpZiAodHlwZSAhPT0gJ3N0cmluZycpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5taW5MZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGUgIT09ICdzdHJpbmcnKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMuc3RyaW5nKG5hbWUpKVxuXG4gICAgICB2YWxpZGF0ZSgnaWYgKCVzLmxlbmd0aCA8ICVkKSB7JywgbmFtZSwgbm9kZS5taW5MZW5ndGgpXG4gICAgICBlcnJvcignaGFzIGxlc3MgbGVuZ3RoIHRoYW4gYWxsb3dlZCcpXG4gICAgICB2YWxpZGF0ZSgnfScpXG5cbiAgICAgIGlmICh0eXBlICE9PSAnc3RyaW5nJykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLm1pbmltdW0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGUgIT09ICdudW1iZXInICYmIHR5cGUgIT09ICdpbnRlZ2VyJykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLm51bWJlcihuYW1lKSlcblxuICAgICAgdmFsaWRhdGUoJ2lmICglcyAlcyAlZCkgeycsIG5hbWUsIG5vZGUuZXhjbHVzaXZlTWluaW11bSA/ICc8PScgOiAnPCcsIG5vZGUubWluaW11bSlcbiAgICAgIGVycm9yKCdpcyBsZXNzIHRoYW4gbWluaW11bScpXG4gICAgICB2YWxpZGF0ZSgnfScpXG5cbiAgICAgIGlmICh0eXBlICE9PSAnbnVtYmVyJyAmJiB0eXBlICE9PSAnaW50ZWdlcicpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5tYXhpbXVtICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eXBlICE9PSAnbnVtYmVyJyAmJiB0eXBlICE9PSAnaW50ZWdlcicpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5udW1iZXIobmFtZSkpXG5cbiAgICAgIHZhbGlkYXRlKCdpZiAoJXMgJXMgJWQpIHsnLCBuYW1lLCBub2RlLmV4Y2x1c2l2ZU1heGltdW0gPyAnPj0nIDogJz4nLCBub2RlLm1heGltdW0pXG4gICAgICBlcnJvcignaXMgbW9yZSB0aGFuIG1heGltdW0nKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuXG4gICAgICBpZiAodHlwZSAhPT0gJ251bWJlcicgJiYgdHlwZSAhPT0gJ2ludGVnZXInKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goZnVuY3Rpb24ocCkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0eXBlKSAmJiB0eXBlLmluZGV4T2YoJ251bGwnKSAhPT0gLTEpIHZhbGlkYXRlKCdpZiAoJXMgIT09IG51bGwpIHsnLCBuYW1lKVxuXG4gICAgICAgIHZpc2l0KGdlbm9iaihuYW1lLCBwKSwgcHJvcGVydGllc1twXSwgcmVwb3J0ZXIsIGZpbHRlcilcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0eXBlKSAmJiB0eXBlLmluZGV4T2YoJ251bGwnKSAhPT0gLTEpIHZhbGlkYXRlKCd9JylcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgd2hpbGUgKGluZGVudC0tKSB2YWxpZGF0ZSgnfScpXG4gIH1cblxuICB2YXIgdmFsaWRhdGUgPSBnZW5mdW5cbiAgICAoJ2Z1bmN0aW9uIHZhbGlkYXRlKGRhdGEpIHsnKVxuICAgICAgLy8gU2luY2UgdW5kZWZpbmVkIGlzIG5vdCBhIHZhbGlkIEpTT04gdmFsdWUsIHdlIGNvZXJjZSB0byBudWxsIGFuZCBvdGhlciBjaGVja3Mgd2lsbCBjYXRjaCB0aGlzXG4gICAgICAoJ2lmIChkYXRhID09PSB1bmRlZmluZWQpIGRhdGEgPSBudWxsJylcbiAgICAgICgndmFsaWRhdGUuZXJyb3JzID0gbnVsbCcpXG4gICAgICAoJ3ZhciBlcnJvcnMgPSAwJylcblxuICB2aXNpdCgnZGF0YScsIHNjaGVtYSwgcmVwb3J0ZXIsIG9wdHMgJiYgb3B0cy5maWx0ZXIpXG5cbiAgdmFsaWRhdGVcbiAgICAgICgncmV0dXJuIGVycm9ycyA9PT0gMCcpXG4gICAgKCd9JylcblxuICB2YWxpZGF0ZSA9IHZhbGlkYXRlLnRvRnVuY3Rpb24oc2NvcGUpXG4gIHZhbGlkYXRlLmVycm9ycyA9IG51bGxcblxuICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZhbGlkYXRlLCAnZXJyb3InLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXZhbGlkYXRlLmVycm9ycykgcmV0dXJuICcnXG4gICAgICAgIHJldHVybiB2YWxpZGF0ZS5lcnJvcnMubWFwKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIHJldHVybiBlcnIuZmllbGQgKyAnICcgKyBlcnIubWVzc2FnZTtcbiAgICAgICAgfSkuam9pbignXFxuJylcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgdmFsaWRhdGUudG9KU09OID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNjaGVtYVxuICB9XG5cbiAgcmV0dXJuIHZhbGlkYXRlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2NoZW1hLCBvcHRzKSB7XG4gIGlmICh0eXBlb2Ygc2NoZW1hID09PSAnc3RyaW5nJykgc2NoZW1hID0gSlNPTi5wYXJzZShzY2hlbWEpXG4gIHJldHVybiBjb21waWxlKHNjaGVtYSwge30sIHNjaGVtYSwgdHJ1ZSwgb3B0cylcbn1cblxubW9kdWxlLmV4cG9ydHMuZmlsdGVyID0gZnVuY3Rpb24oc2NoZW1hLCBvcHRzKSB7XG4gIHZhciB2YWxpZGF0ZSA9IG1vZHVsZS5leHBvcnRzKHNjaGVtYSwgeHRlbmQob3B0cywge2ZpbHRlcjogdHJ1ZX0pKVxuICByZXR1cm4gZnVuY3Rpb24oc2NoKSB7XG4gICAgdmFsaWRhdGUoc2NoKVxuICAgIHJldHVybiBzY2hcbiAgfVxufVxuIiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJylcblxudmFyIElOREVOVF9TVEFSVCA9IC9bXFx7XFxbXS9cbnZhciBJTkRFTlRfRU5EID0gL1tcXH1cXF1dL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbGluZXMgPSBbXVxuICB2YXIgaW5kZW50ID0gMFxuXG4gIHZhciBwdXNoID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgdmFyIHNwYWNlcyA9ICcnXG4gICAgd2hpbGUgKHNwYWNlcy5sZW5ndGggPCBpbmRlbnQqMikgc3BhY2VzICs9ICcgICdcbiAgICBsaW5lcy5wdXNoKHNwYWNlcytzdHIpXG4gIH1cblxuICB2YXIgbGluZSA9IGZ1bmN0aW9uKGZtdCkge1xuICAgIGlmICghZm10KSByZXR1cm4gbGluZVxuXG4gICAgaWYgKElOREVOVF9FTkQudGVzdChmbXQudHJpbSgpWzBdKSAmJiBJTkRFTlRfU1RBUlQudGVzdChmbXRbZm10Lmxlbmd0aC0xXSkpIHtcbiAgICAgIGluZGVudC0tXG4gICAgICBwdXNoKHV0aWwuZm9ybWF0LmFwcGx5KHV0aWwsIGFyZ3VtZW50cykpXG4gICAgICBpbmRlbnQrK1xuICAgICAgcmV0dXJuIGxpbmVcbiAgICB9XG4gICAgaWYgKElOREVOVF9TVEFSVC50ZXN0KGZtdFtmbXQubGVuZ3RoLTFdKSkge1xuICAgICAgcHVzaCh1dGlsLmZvcm1hdC5hcHBseSh1dGlsLCBhcmd1bWVudHMpKVxuICAgICAgaW5kZW50KytcbiAgICAgIHJldHVybiBsaW5lXG4gICAgfVxuICAgIGlmIChJTkRFTlRfRU5ELnRlc3QoZm10LnRyaW0oKVswXSkpIHtcbiAgICAgIGluZGVudC0tXG4gICAgICBwdXNoKHV0aWwuZm9ybWF0LmFwcGx5KHV0aWwsIGFyZ3VtZW50cykpXG4gICAgICByZXR1cm4gbGluZVxuICAgIH1cblxuICAgIHB1c2godXRpbC5mb3JtYXQuYXBwbHkodXRpbCwgYXJndW1lbnRzKSlcbiAgICByZXR1cm4gbGluZVxuICB9XG5cbiAgbGluZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKVxuICB9XG5cbiAgbGluZS50b0Z1bmN0aW9uID0gZnVuY3Rpb24oc2NvcGUpIHtcbiAgICB2YXIgc3JjID0gJ3JldHVybiAoJytsaW5lLnRvU3RyaW5nKCkrJyknXG5cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHNjb3BlIHx8IHt9KS5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4ga2V5XG4gICAgfSlcblxuICAgIHZhciB2YWxzID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gc2NvcGVba2V5XVxuICAgIH0pXG5cbiAgICByZXR1cm4gRnVuY3Rpb24uYXBwbHkobnVsbCwga2V5cy5jb25jYXQoc3JjKSkuYXBwbHkobnVsbCwgdmFscylcbiAgfVxuXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoKSBsaW5lLmFwcGx5KG51bGwsIGFyZ3VtZW50cylcblxuICByZXR1cm4gbGluZVxufVxuIiwidmFyIGlzUHJvcGVydHkgPSByZXF1aXJlKCdpcy1wcm9wZXJ0eScpXG5cbnZhciBnZW4gPSBmdW5jdGlvbihvYmosIHByb3ApIHtcbiAgcmV0dXJuIGlzUHJvcGVydHkocHJvcCkgPyBvYmorJy4nK3Byb3AgOiBvYmorJ1snK0pTT04uc3RyaW5naWZ5KHByb3ApKyddJ1xufVxuXG5nZW4udmFsaWQgPSBpc1Byb3BlcnR5XG5nZW4ucHJvcGVydHkgPSBmdW5jdGlvbiAocHJvcCkge1xuIHJldHVybiBpc1Byb3BlcnR5KHByb3ApID8gcHJvcCA6IEpTT04uc3RyaW5naWZ5KHByb3ApXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2VuXG4iLCJcInVzZSBzdHJpY3RcIlxuZnVuY3Rpb24gaXNQcm9wZXJ0eShzdHIpIHtcbiAgcmV0dXJuIC9eWyRBLVpcXF9hLXpcXHhhYVxceGI1XFx4YmFcXHhjMC1cXHhkNlxceGQ4LVxceGY2XFx4ZjgtXFx1MDJjMVxcdTAyYzYtXFx1MDJkMVxcdTAyZTAtXFx1MDJlNFxcdTAyZWNcXHUwMmVlXFx1MDM3MC1cXHUwMzc0XFx1MDM3NlxcdTAzNzdcXHUwMzdhLVxcdTAzN2RcXHUwMzg2XFx1MDM4OC1cXHUwMzhhXFx1MDM4Y1xcdTAzOGUtXFx1MDNhMVxcdTAzYTMtXFx1MDNmNVxcdTAzZjctXFx1MDQ4MVxcdTA0OGEtXFx1MDUyN1xcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYxLVxcdTA1ODdcXHUwNWQwLVxcdTA1ZWFcXHUwNWYwLVxcdTA1ZjJcXHUwNjIwLVxcdTA2NGFcXHUwNjZlXFx1MDY2ZlxcdTA2NzEtXFx1MDZkM1xcdTA2ZDVcXHUwNmU1XFx1MDZlNlxcdTA2ZWVcXHUwNmVmXFx1MDZmYS1cXHUwNmZjXFx1MDZmZlxcdTA3MTBcXHUwNzEyLVxcdTA3MmZcXHUwNzRkLVxcdTA3YTVcXHUwN2IxXFx1MDdjYS1cXHUwN2VhXFx1MDdmNFxcdTA3ZjVcXHUwN2ZhXFx1MDgwMC1cXHUwODE1XFx1MDgxYVxcdTA4MjRcXHUwODI4XFx1MDg0MC1cXHUwODU4XFx1MDhhMFxcdTA4YTItXFx1MDhhY1xcdTA5MDQtXFx1MDkzOVxcdTA5M2RcXHUwOTUwXFx1MDk1OC1cXHUwOTYxXFx1MDk3MS1cXHUwOTc3XFx1MDk3OS1cXHUwOTdmXFx1MDk4NS1cXHUwOThjXFx1MDk4ZlxcdTA5OTBcXHUwOTkzLVxcdTA5YThcXHUwOWFhLVxcdTA5YjBcXHUwOWIyXFx1MDliNi1cXHUwOWI5XFx1MDliZFxcdTA5Y2VcXHUwOWRjXFx1MDlkZFxcdTA5ZGYtXFx1MDllMVxcdTA5ZjBcXHUwOWYxXFx1MGEwNS1cXHUwYTBhXFx1MGEwZlxcdTBhMTBcXHUwYTEzLVxcdTBhMjhcXHUwYTJhLVxcdTBhMzBcXHUwYTMyXFx1MGEzM1xcdTBhMzVcXHUwYTM2XFx1MGEzOFxcdTBhMzlcXHUwYTU5LVxcdTBhNWNcXHUwYTVlXFx1MGE3Mi1cXHUwYTc0XFx1MGE4NS1cXHUwYThkXFx1MGE4Zi1cXHUwYTkxXFx1MGE5My1cXHUwYWE4XFx1MGFhYS1cXHUwYWIwXFx1MGFiMlxcdTBhYjNcXHUwYWI1LVxcdTBhYjlcXHUwYWJkXFx1MGFkMFxcdTBhZTBcXHUwYWUxXFx1MGIwNS1cXHUwYjBjXFx1MGIwZlxcdTBiMTBcXHUwYjEzLVxcdTBiMjhcXHUwYjJhLVxcdTBiMzBcXHUwYjMyXFx1MGIzM1xcdTBiMzUtXFx1MGIzOVxcdTBiM2RcXHUwYjVjXFx1MGI1ZFxcdTBiNWYtXFx1MGI2MVxcdTBiNzFcXHUwYjgzXFx1MGI4NS1cXHUwYjhhXFx1MGI4ZS1cXHUwYjkwXFx1MGI5Mi1cXHUwYjk1XFx1MGI5OVxcdTBiOWFcXHUwYjljXFx1MGI5ZVxcdTBiOWZcXHUwYmEzXFx1MGJhNFxcdTBiYTgtXFx1MGJhYVxcdTBiYWUtXFx1MGJiOVxcdTBiZDBcXHUwYzA1LVxcdTBjMGNcXHUwYzBlLVxcdTBjMTBcXHUwYzEyLVxcdTBjMjhcXHUwYzJhLVxcdTBjMzNcXHUwYzM1LVxcdTBjMzlcXHUwYzNkXFx1MGM1OFxcdTBjNTlcXHUwYzYwXFx1MGM2MVxcdTBjODUtXFx1MGM4Y1xcdTBjOGUtXFx1MGM5MFxcdTBjOTItXFx1MGNhOFxcdTBjYWEtXFx1MGNiM1xcdTBjYjUtXFx1MGNiOVxcdTBjYmRcXHUwY2RlXFx1MGNlMFxcdTBjZTFcXHUwY2YxXFx1MGNmMlxcdTBkMDUtXFx1MGQwY1xcdTBkMGUtXFx1MGQxMFxcdTBkMTItXFx1MGQzYVxcdTBkM2RcXHUwZDRlXFx1MGQ2MFxcdTBkNjFcXHUwZDdhLVxcdTBkN2ZcXHUwZDg1LVxcdTBkOTZcXHUwZDlhLVxcdTBkYjFcXHUwZGIzLVxcdTBkYmJcXHUwZGJkXFx1MGRjMC1cXHUwZGM2XFx1MGUwMS1cXHUwZTMwXFx1MGUzMlxcdTBlMzNcXHUwZTQwLVxcdTBlNDZcXHUwZTgxXFx1MGU4MlxcdTBlODRcXHUwZTg3XFx1MGU4OFxcdTBlOGFcXHUwZThkXFx1MGU5NC1cXHUwZTk3XFx1MGU5OS1cXHUwZTlmXFx1MGVhMS1cXHUwZWEzXFx1MGVhNVxcdTBlYTdcXHUwZWFhXFx1MGVhYlxcdTBlYWQtXFx1MGViMFxcdTBlYjJcXHUwZWIzXFx1MGViZFxcdTBlYzAtXFx1MGVjNFxcdTBlYzZcXHUwZWRjLVxcdTBlZGZcXHUwZjAwXFx1MGY0MC1cXHUwZjQ3XFx1MGY0OS1cXHUwZjZjXFx1MGY4OC1cXHUwZjhjXFx1MTAwMC1cXHUxMDJhXFx1MTAzZlxcdTEwNTAtXFx1MTA1NVxcdTEwNWEtXFx1MTA1ZFxcdTEwNjFcXHUxMDY1XFx1MTA2NlxcdTEwNmUtXFx1MTA3MFxcdTEwNzUtXFx1MTA4MVxcdTEwOGVcXHUxMGEwLVxcdTEwYzVcXHUxMGM3XFx1MTBjZFxcdTEwZDAtXFx1MTBmYVxcdTEwZmMtXFx1MTI0OFxcdTEyNGEtXFx1MTI0ZFxcdTEyNTAtXFx1MTI1NlxcdTEyNThcXHUxMjVhLVxcdTEyNWRcXHUxMjYwLVxcdTEyODhcXHUxMjhhLVxcdTEyOGRcXHUxMjkwLVxcdTEyYjBcXHUxMmIyLVxcdTEyYjVcXHUxMmI4LVxcdTEyYmVcXHUxMmMwXFx1MTJjMi1cXHUxMmM1XFx1MTJjOC1cXHUxMmQ2XFx1MTJkOC1cXHUxMzEwXFx1MTMxMi1cXHUxMzE1XFx1MTMxOC1cXHUxMzVhXFx1MTM4MC1cXHUxMzhmXFx1MTNhMC1cXHUxM2Y0XFx1MTQwMS1cXHUxNjZjXFx1MTY2Zi1cXHUxNjdmXFx1MTY4MS1cXHUxNjlhXFx1MTZhMC1cXHUxNmVhXFx1MTZlZS1cXHUxNmYwXFx1MTcwMC1cXHUxNzBjXFx1MTcwZS1cXHUxNzExXFx1MTcyMC1cXHUxNzMxXFx1MTc0MC1cXHUxNzUxXFx1MTc2MC1cXHUxNzZjXFx1MTc2ZS1cXHUxNzcwXFx1MTc4MC1cXHUxN2IzXFx1MTdkN1xcdTE3ZGNcXHUxODIwLVxcdTE4NzdcXHUxODgwLVxcdTE4YThcXHUxOGFhXFx1MThiMC1cXHUxOGY1XFx1MTkwMC1cXHUxOTFjXFx1MTk1MC1cXHUxOTZkXFx1MTk3MC1cXHUxOTc0XFx1MTk4MC1cXHUxOWFiXFx1MTljMS1cXHUxOWM3XFx1MWEwMC1cXHUxYTE2XFx1MWEyMC1cXHUxYTU0XFx1MWFhN1xcdTFiMDUtXFx1MWIzM1xcdTFiNDUtXFx1MWI0YlxcdTFiODMtXFx1MWJhMFxcdTFiYWVcXHUxYmFmXFx1MWJiYS1cXHUxYmU1XFx1MWMwMC1cXHUxYzIzXFx1MWM0ZC1cXHUxYzRmXFx1MWM1YS1cXHUxYzdkXFx1MWNlOS1cXHUxY2VjXFx1MWNlZS1cXHUxY2YxXFx1MWNmNVxcdTFjZjZcXHUxZDAwLVxcdTFkYmZcXHUxZTAwLVxcdTFmMTVcXHUxZjE4LVxcdTFmMWRcXHUxZjIwLVxcdTFmNDVcXHUxZjQ4LVxcdTFmNGRcXHUxZjUwLVxcdTFmNTdcXHUxZjU5XFx1MWY1YlxcdTFmNWRcXHUxZjVmLVxcdTFmN2RcXHUxZjgwLVxcdTFmYjRcXHUxZmI2LVxcdTFmYmNcXHUxZmJlXFx1MWZjMi1cXHUxZmM0XFx1MWZjNi1cXHUxZmNjXFx1MWZkMC1cXHUxZmQzXFx1MWZkNi1cXHUxZmRiXFx1MWZlMC1cXHUxZmVjXFx1MWZmMi1cXHUxZmY0XFx1MWZmNi1cXHUxZmZjXFx1MjA3MVxcdTIwN2ZcXHUyMDkwLVxcdTIwOWNcXHUyMTAyXFx1MjEwN1xcdTIxMGEtXFx1MjExM1xcdTIxMTVcXHUyMTE5LVxcdTIxMWRcXHUyMTI0XFx1MjEyNlxcdTIxMjhcXHUyMTJhLVxcdTIxMmRcXHUyMTJmLVxcdTIxMzlcXHUyMTNjLVxcdTIxM2ZcXHUyMTQ1LVxcdTIxNDlcXHUyMTRlXFx1MjE2MC1cXHUyMTg4XFx1MmMwMC1cXHUyYzJlXFx1MmMzMC1cXHUyYzVlXFx1MmM2MC1cXHUyY2U0XFx1MmNlYi1cXHUyY2VlXFx1MmNmMlxcdTJjZjNcXHUyZDAwLVxcdTJkMjVcXHUyZDI3XFx1MmQyZFxcdTJkMzAtXFx1MmQ2N1xcdTJkNmZcXHUyZDgwLVxcdTJkOTZcXHUyZGEwLVxcdTJkYTZcXHUyZGE4LVxcdTJkYWVcXHUyZGIwLVxcdTJkYjZcXHUyZGI4LVxcdTJkYmVcXHUyZGMwLVxcdTJkYzZcXHUyZGM4LVxcdTJkY2VcXHUyZGQwLVxcdTJkZDZcXHUyZGQ4LVxcdTJkZGVcXHUyZTJmXFx1MzAwNS1cXHUzMDA3XFx1MzAyMS1cXHUzMDI5XFx1MzAzMS1cXHUzMDM1XFx1MzAzOC1cXHUzMDNjXFx1MzA0MS1cXHUzMDk2XFx1MzA5ZC1cXHUzMDlmXFx1MzBhMS1cXHUzMGZhXFx1MzBmYy1cXHUzMGZmXFx1MzEwNS1cXHUzMTJkXFx1MzEzMS1cXHUzMThlXFx1MzFhMC1cXHUzMWJhXFx1MzFmMC1cXHUzMWZmXFx1MzQwMC1cXHU0ZGI1XFx1NGUwMC1cXHU5ZmNjXFx1YTAwMC1cXHVhNDhjXFx1YTRkMC1cXHVhNGZkXFx1YTUwMC1cXHVhNjBjXFx1YTYxMC1cXHVhNjFmXFx1YTYyYVxcdWE2MmJcXHVhNjQwLVxcdWE2NmVcXHVhNjdmLVxcdWE2OTdcXHVhNmEwLVxcdWE2ZWZcXHVhNzE3LVxcdWE3MWZcXHVhNzIyLVxcdWE3ODhcXHVhNzhiLVxcdWE3OGVcXHVhNzkwLVxcdWE3OTNcXHVhN2EwLVxcdWE3YWFcXHVhN2Y4LVxcdWE4MDFcXHVhODAzLVxcdWE4MDVcXHVhODA3LVxcdWE4MGFcXHVhODBjLVxcdWE4MjJcXHVhODQwLVxcdWE4NzNcXHVhODgyLVxcdWE4YjNcXHVhOGYyLVxcdWE4ZjdcXHVhOGZiXFx1YTkwYS1cXHVhOTI1XFx1YTkzMC1cXHVhOTQ2XFx1YTk2MC1cXHVhOTdjXFx1YTk4NC1cXHVhOWIyXFx1YTljZlxcdWFhMDAtXFx1YWEyOFxcdWFhNDAtXFx1YWE0MlxcdWFhNDQtXFx1YWE0YlxcdWFhNjAtXFx1YWE3NlxcdWFhN2FcXHVhYTgwLVxcdWFhYWZcXHVhYWIxXFx1YWFiNVxcdWFhYjZcXHVhYWI5LVxcdWFhYmRcXHVhYWMwXFx1YWFjMlxcdWFhZGItXFx1YWFkZFxcdWFhZTAtXFx1YWFlYVxcdWFhZjItXFx1YWFmNFxcdWFiMDEtXFx1YWIwNlxcdWFiMDktXFx1YWIwZVxcdWFiMTEtXFx1YWIxNlxcdWFiMjAtXFx1YWIyNlxcdWFiMjgtXFx1YWIyZVxcdWFiYzAtXFx1YWJlMlxcdWFjMDAtXFx1ZDdhM1xcdWQ3YjAtXFx1ZDdjNlxcdWQ3Y2ItXFx1ZDdmYlxcdWY5MDAtXFx1ZmE2ZFxcdWZhNzAtXFx1ZmFkOVxcdWZiMDAtXFx1ZmIwNlxcdWZiMTMtXFx1ZmIxN1xcdWZiMWRcXHVmYjFmLVxcdWZiMjhcXHVmYjJhLVxcdWZiMzZcXHVmYjM4LVxcdWZiM2NcXHVmYjNlXFx1ZmI0MFxcdWZiNDFcXHVmYjQzXFx1ZmI0NFxcdWZiNDYtXFx1ZmJiMVxcdWZiZDMtXFx1ZmQzZFxcdWZkNTAtXFx1ZmQ4ZlxcdWZkOTItXFx1ZmRjN1xcdWZkZjAtXFx1ZmRmYlxcdWZlNzAtXFx1ZmU3NFxcdWZlNzYtXFx1ZmVmY1xcdWZmMjEtXFx1ZmYzYVxcdWZmNDEtXFx1ZmY1YVxcdWZmNjYtXFx1ZmZiZVxcdWZmYzItXFx1ZmZjN1xcdWZmY2EtXFx1ZmZjZlxcdWZmZDItXFx1ZmZkN1xcdWZmZGEtXFx1ZmZkY11bJEEtWlxcX2EtelxceGFhXFx4YjVcXHhiYVxceGMwLVxceGQ2XFx4ZDgtXFx4ZjZcXHhmOC1cXHUwMmMxXFx1MDJjNi1cXHUwMmQxXFx1MDJlMC1cXHUwMmU0XFx1MDJlY1xcdTAyZWVcXHUwMzcwLVxcdTAzNzRcXHUwMzc2XFx1MDM3N1xcdTAzN2EtXFx1MDM3ZFxcdTAzODZcXHUwMzg4LVxcdTAzOGFcXHUwMzhjXFx1MDM4ZS1cXHUwM2ExXFx1MDNhMy1cXHUwM2Y1XFx1MDNmNy1cXHUwNDgxXFx1MDQ4YS1cXHUwNTI3XFx1MDUzMS1cXHUwNTU2XFx1MDU1OVxcdTA1NjEtXFx1MDU4N1xcdTA1ZDAtXFx1MDVlYVxcdTA1ZjAtXFx1MDVmMlxcdTA2MjAtXFx1MDY0YVxcdTA2NmVcXHUwNjZmXFx1MDY3MS1cXHUwNmQzXFx1MDZkNVxcdTA2ZTVcXHUwNmU2XFx1MDZlZVxcdTA2ZWZcXHUwNmZhLVxcdTA2ZmNcXHUwNmZmXFx1MDcxMFxcdTA3MTItXFx1MDcyZlxcdTA3NGQtXFx1MDdhNVxcdTA3YjFcXHUwN2NhLVxcdTA3ZWFcXHUwN2Y0XFx1MDdmNVxcdTA3ZmFcXHUwODAwLVxcdTA4MTVcXHUwODFhXFx1MDgyNFxcdTA4MjhcXHUwODQwLVxcdTA4NThcXHUwOGEwXFx1MDhhMi1cXHUwOGFjXFx1MDkwNC1cXHUwOTM5XFx1MDkzZFxcdTA5NTBcXHUwOTU4LVxcdTA5NjFcXHUwOTcxLVxcdTA5NzdcXHUwOTc5LVxcdTA5N2ZcXHUwOTg1LVxcdTA5OGNcXHUwOThmXFx1MDk5MFxcdTA5OTMtXFx1MDlhOFxcdTA5YWEtXFx1MDliMFxcdTA5YjJcXHUwOWI2LVxcdTA5YjlcXHUwOWJkXFx1MDljZVxcdTA5ZGNcXHUwOWRkXFx1MDlkZi1cXHUwOWUxXFx1MDlmMFxcdTA5ZjFcXHUwYTA1LVxcdTBhMGFcXHUwYTBmXFx1MGExMFxcdTBhMTMtXFx1MGEyOFxcdTBhMmEtXFx1MGEzMFxcdTBhMzJcXHUwYTMzXFx1MGEzNVxcdTBhMzZcXHUwYTM4XFx1MGEzOVxcdTBhNTktXFx1MGE1Y1xcdTBhNWVcXHUwYTcyLVxcdTBhNzRcXHUwYTg1LVxcdTBhOGRcXHUwYThmLVxcdTBhOTFcXHUwYTkzLVxcdTBhYThcXHUwYWFhLVxcdTBhYjBcXHUwYWIyXFx1MGFiM1xcdTBhYjUtXFx1MGFiOVxcdTBhYmRcXHUwYWQwXFx1MGFlMFxcdTBhZTFcXHUwYjA1LVxcdTBiMGNcXHUwYjBmXFx1MGIxMFxcdTBiMTMtXFx1MGIyOFxcdTBiMmEtXFx1MGIzMFxcdTBiMzJcXHUwYjMzXFx1MGIzNS1cXHUwYjM5XFx1MGIzZFxcdTBiNWNcXHUwYjVkXFx1MGI1Zi1cXHUwYjYxXFx1MGI3MVxcdTBiODNcXHUwYjg1LVxcdTBiOGFcXHUwYjhlLVxcdTBiOTBcXHUwYjkyLVxcdTBiOTVcXHUwYjk5XFx1MGI5YVxcdTBiOWNcXHUwYjllXFx1MGI5ZlxcdTBiYTNcXHUwYmE0XFx1MGJhOC1cXHUwYmFhXFx1MGJhZS1cXHUwYmI5XFx1MGJkMFxcdTBjMDUtXFx1MGMwY1xcdTBjMGUtXFx1MGMxMFxcdTBjMTItXFx1MGMyOFxcdTBjMmEtXFx1MGMzM1xcdTBjMzUtXFx1MGMzOVxcdTBjM2RcXHUwYzU4XFx1MGM1OVxcdTBjNjBcXHUwYzYxXFx1MGM4NS1cXHUwYzhjXFx1MGM4ZS1cXHUwYzkwXFx1MGM5Mi1cXHUwY2E4XFx1MGNhYS1cXHUwY2IzXFx1MGNiNS1cXHUwY2I5XFx1MGNiZFxcdTBjZGVcXHUwY2UwXFx1MGNlMVxcdTBjZjFcXHUwY2YyXFx1MGQwNS1cXHUwZDBjXFx1MGQwZS1cXHUwZDEwXFx1MGQxMi1cXHUwZDNhXFx1MGQzZFxcdTBkNGVcXHUwZDYwXFx1MGQ2MVxcdTBkN2EtXFx1MGQ3ZlxcdTBkODUtXFx1MGQ5NlxcdTBkOWEtXFx1MGRiMVxcdTBkYjMtXFx1MGRiYlxcdTBkYmRcXHUwZGMwLVxcdTBkYzZcXHUwZTAxLVxcdTBlMzBcXHUwZTMyXFx1MGUzM1xcdTBlNDAtXFx1MGU0NlxcdTBlODFcXHUwZTgyXFx1MGU4NFxcdTBlODdcXHUwZTg4XFx1MGU4YVxcdTBlOGRcXHUwZTk0LVxcdTBlOTdcXHUwZTk5LVxcdTBlOWZcXHUwZWExLVxcdTBlYTNcXHUwZWE1XFx1MGVhN1xcdTBlYWFcXHUwZWFiXFx1MGVhZC1cXHUwZWIwXFx1MGViMlxcdTBlYjNcXHUwZWJkXFx1MGVjMC1cXHUwZWM0XFx1MGVjNlxcdTBlZGMtXFx1MGVkZlxcdTBmMDBcXHUwZjQwLVxcdTBmNDdcXHUwZjQ5LVxcdTBmNmNcXHUwZjg4LVxcdTBmOGNcXHUxMDAwLVxcdTEwMmFcXHUxMDNmXFx1MTA1MC1cXHUxMDU1XFx1MTA1YS1cXHUxMDVkXFx1MTA2MVxcdTEwNjVcXHUxMDY2XFx1MTA2ZS1cXHUxMDcwXFx1MTA3NS1cXHUxMDgxXFx1MTA4ZVxcdTEwYTAtXFx1MTBjNVxcdTEwYzdcXHUxMGNkXFx1MTBkMC1cXHUxMGZhXFx1MTBmYy1cXHUxMjQ4XFx1MTI0YS1cXHUxMjRkXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNWEtXFx1MTI1ZFxcdTEyNjAtXFx1MTI4OFxcdTEyOGEtXFx1MTI4ZFxcdTEyOTAtXFx1MTJiMFxcdTEyYjItXFx1MTJiNVxcdTEyYjgtXFx1MTJiZVxcdTEyYzBcXHUxMmMyLVxcdTEyYzVcXHUxMmM4LVxcdTEyZDZcXHUxMmQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNWFcXHUxMzgwLVxcdTEzOGZcXHUxM2EwLVxcdTEzZjRcXHUxNDAxLVxcdTE2NmNcXHUxNjZmLVxcdTE2N2ZcXHUxNjgxLVxcdTE2OWFcXHUxNmEwLVxcdTE2ZWFcXHUxNmVlLVxcdTE2ZjBcXHUxNzAwLVxcdTE3MGNcXHUxNzBlLVxcdTE3MTFcXHUxNzIwLVxcdTE3MzFcXHUxNzQwLVxcdTE3NTFcXHUxNzYwLVxcdTE3NmNcXHUxNzZlLVxcdTE3NzBcXHUxNzgwLVxcdTE3YjNcXHUxN2Q3XFx1MTdkY1xcdTE4MjAtXFx1MTg3N1xcdTE4ODAtXFx1MThhOFxcdTE4YWFcXHUxOGIwLVxcdTE4ZjVcXHUxOTAwLVxcdTE5MWNcXHUxOTUwLVxcdTE5NmRcXHUxOTcwLVxcdTE5NzRcXHUxOTgwLVxcdTE5YWJcXHUxOWMxLVxcdTE5YzdcXHUxYTAwLVxcdTFhMTZcXHUxYTIwLVxcdTFhNTRcXHUxYWE3XFx1MWIwNS1cXHUxYjMzXFx1MWI0NS1cXHUxYjRiXFx1MWI4My1cXHUxYmEwXFx1MWJhZVxcdTFiYWZcXHUxYmJhLVxcdTFiZTVcXHUxYzAwLVxcdTFjMjNcXHUxYzRkLVxcdTFjNGZcXHUxYzVhLVxcdTFjN2RcXHUxY2U5LVxcdTFjZWNcXHUxY2VlLVxcdTFjZjFcXHUxY2Y1XFx1MWNmNlxcdTFkMDAtXFx1MWRiZlxcdTFlMDAtXFx1MWYxNVxcdTFmMTgtXFx1MWYxZFxcdTFmMjAtXFx1MWY0NVxcdTFmNDgtXFx1MWY0ZFxcdTFmNTAtXFx1MWY1N1xcdTFmNTlcXHUxZjViXFx1MWY1ZFxcdTFmNWYtXFx1MWY3ZFxcdTFmODAtXFx1MWZiNFxcdTFmYjYtXFx1MWZiY1xcdTFmYmVcXHUxZmMyLVxcdTFmYzRcXHUxZmM2LVxcdTFmY2NcXHUxZmQwLVxcdTFmZDNcXHUxZmQ2LVxcdTFmZGJcXHUxZmUwLVxcdTFmZWNcXHUxZmYyLVxcdTFmZjRcXHUxZmY2LVxcdTFmZmNcXHUyMDcxXFx1MjA3ZlxcdTIwOTAtXFx1MjA5Y1xcdTIxMDJcXHUyMTA3XFx1MjEwYS1cXHUyMTEzXFx1MjExNVxcdTIxMTktXFx1MjExZFxcdTIxMjRcXHUyMTI2XFx1MjEyOFxcdTIxMmEtXFx1MjEyZFxcdTIxMmYtXFx1MjEzOVxcdTIxM2MtXFx1MjEzZlxcdTIxNDUtXFx1MjE0OVxcdTIxNGVcXHUyMTYwLVxcdTIxODhcXHUyYzAwLVxcdTJjMmVcXHUyYzMwLVxcdTJjNWVcXHUyYzYwLVxcdTJjZTRcXHUyY2ViLVxcdTJjZWVcXHUyY2YyXFx1MmNmM1xcdTJkMDAtXFx1MmQyNVxcdTJkMjdcXHUyZDJkXFx1MmQzMC1cXHUyZDY3XFx1MmQ2ZlxcdTJkODAtXFx1MmQ5NlxcdTJkYTAtXFx1MmRhNlxcdTJkYTgtXFx1MmRhZVxcdTJkYjAtXFx1MmRiNlxcdTJkYjgtXFx1MmRiZVxcdTJkYzAtXFx1MmRjNlxcdTJkYzgtXFx1MmRjZVxcdTJkZDAtXFx1MmRkNlxcdTJkZDgtXFx1MmRkZVxcdTJlMmZcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMjlcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM2NcXHUzMDQxLVxcdTMwOTZcXHUzMDlkLVxcdTMwOWZcXHUzMGExLVxcdTMwZmFcXHUzMGZjLVxcdTMwZmZcXHUzMTA1LVxcdTMxMmRcXHUzMTMxLVxcdTMxOGVcXHUzMWEwLVxcdTMxYmFcXHUzMWYwLVxcdTMxZmZcXHUzNDAwLVxcdTRkYjVcXHU0ZTAwLVxcdTlmY2NcXHVhMDAwLVxcdWE0OGNcXHVhNGQwLVxcdWE0ZmRcXHVhNTAwLVxcdWE2MGNcXHVhNjEwLVxcdWE2MWZcXHVhNjJhXFx1YTYyYlxcdWE2NDAtXFx1YTY2ZVxcdWE2N2YtXFx1YTY5N1xcdWE2YTAtXFx1YTZlZlxcdWE3MTctXFx1YTcxZlxcdWE3MjItXFx1YTc4OFxcdWE3OGItXFx1YTc4ZVxcdWE3OTAtXFx1YTc5M1xcdWE3YTAtXFx1YTdhYVxcdWE3ZjgtXFx1YTgwMVxcdWE4MDMtXFx1YTgwNVxcdWE4MDctXFx1YTgwYVxcdWE4MGMtXFx1YTgyMlxcdWE4NDAtXFx1YTg3M1xcdWE4ODItXFx1YThiM1xcdWE4ZjItXFx1YThmN1xcdWE4ZmJcXHVhOTBhLVxcdWE5MjVcXHVhOTMwLVxcdWE5NDZcXHVhOTYwLVxcdWE5N2NcXHVhOTg0LVxcdWE5YjJcXHVhOWNmXFx1YWEwMC1cXHVhYTI4XFx1YWE0MC1cXHVhYTQyXFx1YWE0NC1cXHVhYTRiXFx1YWE2MC1cXHVhYTc2XFx1YWE3YVxcdWFhODAtXFx1YWFhZlxcdWFhYjFcXHVhYWI1XFx1YWFiNlxcdWFhYjktXFx1YWFiZFxcdWFhYzBcXHVhYWMyXFx1YWFkYi1cXHVhYWRkXFx1YWFlMC1cXHVhYWVhXFx1YWFmMi1cXHVhYWY0XFx1YWIwMS1cXHVhYjA2XFx1YWIwOS1cXHVhYjBlXFx1YWIxMS1cXHVhYjE2XFx1YWIyMC1cXHVhYjI2XFx1YWIyOC1cXHVhYjJlXFx1YWJjMC1cXHVhYmUyXFx1YWMwMC1cXHVkN2EzXFx1ZDdiMC1cXHVkN2M2XFx1ZDdjYi1cXHVkN2ZiXFx1ZjkwMC1cXHVmYTZkXFx1ZmE3MC1cXHVmYWQ5XFx1ZmIwMC1cXHVmYjA2XFx1ZmIxMy1cXHVmYjE3XFx1ZmIxZFxcdWZiMWYtXFx1ZmIyOFxcdWZiMmEtXFx1ZmIzNlxcdWZiMzgtXFx1ZmIzY1xcdWZiM2VcXHVmYjQwXFx1ZmI0MVxcdWZiNDNcXHVmYjQ0XFx1ZmI0Ni1cXHVmYmIxXFx1ZmJkMy1cXHVmZDNkXFx1ZmQ1MC1cXHVmZDhmXFx1ZmQ5Mi1cXHVmZGM3XFx1ZmRmMC1cXHVmZGZiXFx1ZmU3MC1cXHVmZTc0XFx1ZmU3Ni1cXHVmZWZjXFx1ZmYyMS1cXHVmZjNhXFx1ZmY0MS1cXHVmZjVhXFx1ZmY2Ni1cXHVmZmJlXFx1ZmZjMi1cXHVmZmM3XFx1ZmZjYS1cXHVmZmNmXFx1ZmZkMi1cXHVmZmQ3XFx1ZmZkYS1cXHVmZmRjMC05XFx1MDMwMC1cXHUwMzZmXFx1MDQ4My1cXHUwNDg3XFx1MDU5MS1cXHUwNWJkXFx1MDViZlxcdTA1YzFcXHUwNWMyXFx1MDVjNFxcdTA1YzVcXHUwNWM3XFx1MDYxMC1cXHUwNjFhXFx1MDY0Yi1cXHUwNjY5XFx1MDY3MFxcdTA2ZDYtXFx1MDZkY1xcdTA2ZGYtXFx1MDZlNFxcdTA2ZTdcXHUwNmU4XFx1MDZlYS1cXHUwNmVkXFx1MDZmMC1cXHUwNmY5XFx1MDcxMVxcdTA3MzAtXFx1MDc0YVxcdTA3YTYtXFx1MDdiMFxcdTA3YzAtXFx1MDdjOVxcdTA3ZWItXFx1MDdmM1xcdTA4MTYtXFx1MDgxOVxcdTA4MWItXFx1MDgyM1xcdTA4MjUtXFx1MDgyN1xcdTA4MjktXFx1MDgyZFxcdTA4NTktXFx1MDg1YlxcdTA4ZTQtXFx1MDhmZVxcdTA5MDAtXFx1MDkwM1xcdTA5M2EtXFx1MDkzY1xcdTA5M2UtXFx1MDk0ZlxcdTA5NTEtXFx1MDk1N1xcdTA5NjJcXHUwOTYzXFx1MDk2Ni1cXHUwOTZmXFx1MDk4MS1cXHUwOTgzXFx1MDliY1xcdTA5YmUtXFx1MDljNFxcdTA5YzdcXHUwOWM4XFx1MDljYi1cXHUwOWNkXFx1MDlkN1xcdTA5ZTJcXHUwOWUzXFx1MDllNi1cXHUwOWVmXFx1MGEwMS1cXHUwYTAzXFx1MGEzY1xcdTBhM2UtXFx1MGE0MlxcdTBhNDdcXHUwYTQ4XFx1MGE0Yi1cXHUwYTRkXFx1MGE1MVxcdTBhNjYtXFx1MGE3MVxcdTBhNzVcXHUwYTgxLVxcdTBhODNcXHUwYWJjXFx1MGFiZS1cXHUwYWM1XFx1MGFjNy1cXHUwYWM5XFx1MGFjYi1cXHUwYWNkXFx1MGFlMlxcdTBhZTNcXHUwYWU2LVxcdTBhZWZcXHUwYjAxLVxcdTBiMDNcXHUwYjNjXFx1MGIzZS1cXHUwYjQ0XFx1MGI0N1xcdTBiNDhcXHUwYjRiLVxcdTBiNGRcXHUwYjU2XFx1MGI1N1xcdTBiNjJcXHUwYjYzXFx1MGI2Ni1cXHUwYjZmXFx1MGI4MlxcdTBiYmUtXFx1MGJjMlxcdTBiYzYtXFx1MGJjOFxcdTBiY2EtXFx1MGJjZFxcdTBiZDdcXHUwYmU2LVxcdTBiZWZcXHUwYzAxLVxcdTBjMDNcXHUwYzNlLVxcdTBjNDRcXHUwYzQ2LVxcdTBjNDhcXHUwYzRhLVxcdTBjNGRcXHUwYzU1XFx1MGM1NlxcdTBjNjJcXHUwYzYzXFx1MGM2Ni1cXHUwYzZmXFx1MGM4MlxcdTBjODNcXHUwY2JjXFx1MGNiZS1cXHUwY2M0XFx1MGNjNi1cXHUwY2M4XFx1MGNjYS1cXHUwY2NkXFx1MGNkNVxcdTBjZDZcXHUwY2UyXFx1MGNlM1xcdTBjZTYtXFx1MGNlZlxcdTBkMDJcXHUwZDAzXFx1MGQzZS1cXHUwZDQ0XFx1MGQ0Ni1cXHUwZDQ4XFx1MGQ0YS1cXHUwZDRkXFx1MGQ1N1xcdTBkNjJcXHUwZDYzXFx1MGQ2Ni1cXHUwZDZmXFx1MGQ4MlxcdTBkODNcXHUwZGNhXFx1MGRjZi1cXHUwZGQ0XFx1MGRkNlxcdTBkZDgtXFx1MGRkZlxcdTBkZjJcXHUwZGYzXFx1MGUzMVxcdTBlMzQtXFx1MGUzYVxcdTBlNDctXFx1MGU0ZVxcdTBlNTAtXFx1MGU1OVxcdTBlYjFcXHUwZWI0LVxcdTBlYjlcXHUwZWJiXFx1MGViY1xcdTBlYzgtXFx1MGVjZFxcdTBlZDAtXFx1MGVkOVxcdTBmMThcXHUwZjE5XFx1MGYyMC1cXHUwZjI5XFx1MGYzNVxcdTBmMzdcXHUwZjM5XFx1MGYzZVxcdTBmM2ZcXHUwZjcxLVxcdTBmODRcXHUwZjg2XFx1MGY4N1xcdTBmOGQtXFx1MGY5N1xcdTBmOTktXFx1MGZiY1xcdTBmYzZcXHUxMDJiLVxcdTEwM2VcXHUxMDQwLVxcdTEwNDlcXHUxMDU2LVxcdTEwNTlcXHUxMDVlLVxcdTEwNjBcXHUxMDYyLVxcdTEwNjRcXHUxMDY3LVxcdTEwNmRcXHUxMDcxLVxcdTEwNzRcXHUxMDgyLVxcdTEwOGRcXHUxMDhmLVxcdTEwOWRcXHUxMzVkLVxcdTEzNWZcXHUxNzEyLVxcdTE3MTRcXHUxNzMyLVxcdTE3MzRcXHUxNzUyXFx1MTc1M1xcdTE3NzJcXHUxNzczXFx1MTdiNC1cXHUxN2QzXFx1MTdkZFxcdTE3ZTAtXFx1MTdlOVxcdTE4MGItXFx1MTgwZFxcdTE4MTAtXFx1MTgxOVxcdTE4YTlcXHUxOTIwLVxcdTE5MmJcXHUxOTMwLVxcdTE5M2JcXHUxOTQ2LVxcdTE5NGZcXHUxOWIwLVxcdTE5YzBcXHUxOWM4XFx1MTljOVxcdTE5ZDAtXFx1MTlkOVxcdTFhMTctXFx1MWExYlxcdTFhNTUtXFx1MWE1ZVxcdTFhNjAtXFx1MWE3Y1xcdTFhN2YtXFx1MWE4OVxcdTFhOTAtXFx1MWE5OVxcdTFiMDAtXFx1MWIwNFxcdTFiMzQtXFx1MWI0NFxcdTFiNTAtXFx1MWI1OVxcdTFiNmItXFx1MWI3M1xcdTFiODAtXFx1MWI4MlxcdTFiYTEtXFx1MWJhZFxcdTFiYjAtXFx1MWJiOVxcdTFiZTYtXFx1MWJmM1xcdTFjMjQtXFx1MWMzN1xcdTFjNDAtXFx1MWM0OVxcdTFjNTAtXFx1MWM1OVxcdTFjZDAtXFx1MWNkMlxcdTFjZDQtXFx1MWNlOFxcdTFjZWRcXHUxY2YyLVxcdTFjZjRcXHUxZGMwLVxcdTFkZTZcXHUxZGZjLVxcdTFkZmZcXHUyMDBjXFx1MjAwZFxcdTIwM2ZcXHUyMDQwXFx1MjA1NFxcdTIwZDAtXFx1MjBkY1xcdTIwZTFcXHUyMGU1LVxcdTIwZjBcXHUyY2VmLVxcdTJjZjFcXHUyZDdmXFx1MmRlMC1cXHUyZGZmXFx1MzAyYS1cXHUzMDJmXFx1MzA5OVxcdTMwOWFcXHVhNjIwLVxcdWE2MjlcXHVhNjZmXFx1YTY3NC1cXHVhNjdkXFx1YTY5ZlxcdWE2ZjBcXHVhNmYxXFx1YTgwMlxcdWE4MDZcXHVhODBiXFx1YTgyMy1cXHVhODI3XFx1YTg4MFxcdWE4ODFcXHVhOGI0LVxcdWE4YzRcXHVhOGQwLVxcdWE4ZDlcXHVhOGUwLVxcdWE4ZjFcXHVhOTAwLVxcdWE5MDlcXHVhOTI2LVxcdWE5MmRcXHVhOTQ3LVxcdWE5NTNcXHVhOTgwLVxcdWE5ODNcXHVhOWIzLVxcdWE5YzBcXHVhOWQwLVxcdWE5ZDlcXHVhYTI5LVxcdWFhMzZcXHVhYTQzXFx1YWE0Y1xcdWFhNGRcXHVhYTUwLVxcdWFhNTlcXHVhYTdiXFx1YWFiMFxcdWFhYjItXFx1YWFiNFxcdWFhYjdcXHVhYWI4XFx1YWFiZVxcdWFhYmZcXHVhYWMxXFx1YWFlYi1cXHVhYWVmXFx1YWFmNVxcdWFhZjZcXHVhYmUzLVxcdWFiZWFcXHVhYmVjXFx1YWJlZFxcdWFiZjAtXFx1YWJmOVxcdWZiMWVcXHVmZTAwLVxcdWZlMGZcXHVmZTIwLVxcdWZlMjZcXHVmZTMzXFx1ZmUzNFxcdWZlNGQtXFx1ZmU0ZlxcdWZmMTAtXFx1ZmYxOVxcdWZmM2ZdKiQvLnRlc3Qoc3RyKVxufVxubW9kdWxlLmV4cG9ydHMgPSBpc1Byb3BlcnR5IiwidmFyIGhhc0V4Y2FwZSA9IC9+L1xudmFyIGVzY2FwZU1hdGNoZXIgPSAvflswMV0vZ1xuZnVuY3Rpb24gZXNjYXBlUmVwbGFjZXIgKG0pIHtcbiAgc3dpdGNoIChtKSB7XG4gICAgY2FzZSAnfjEnOiByZXR1cm4gJy8nXG4gICAgY2FzZSAnfjAnOiByZXR1cm4gJ34nXG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHRpbGRlIGVzY2FwZTogJyArIG0pXG59XG5cbmZ1bmN0aW9uIHVudGlsZGUgKHN0cikge1xuICBpZiAoIWhhc0V4Y2FwZS50ZXN0KHN0cikpIHJldHVybiBzdHJcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKGVzY2FwZU1hdGNoZXIsIGVzY2FwZVJlcGxhY2VyKVxufVxuXG5mdW5jdGlvbiBzZXR0ZXIgKG9iaiwgcG9pbnRlciwgdmFsdWUpIHtcbiAgdmFyIHBhcnRcbiAgdmFyIGhhc05leHRQYXJ0XG5cbiAgZm9yICh2YXIgcCA9IDEsIGxlbiA9IHBvaW50ZXIubGVuZ3RoOyBwIDwgbGVuOykge1xuICAgIHBhcnQgPSB1bnRpbGRlKHBvaW50ZXJbcCsrXSlcbiAgICBoYXNOZXh0UGFydCA9IGxlbiA+IHBcblxuICAgIGlmICh0eXBlb2Ygb2JqW3BhcnRdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gc3VwcG9ydCBzZXR0aW5nIG9mIC8tXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopICYmIHBhcnQgPT09ICctJykge1xuICAgICAgICBwYXJ0ID0gb2JqLmxlbmd0aFxuICAgICAgfVxuXG4gICAgICAvLyBzdXBwb3J0IG5lc3RlZCBvYmplY3RzL2FycmF5IHdoZW4gc2V0dGluZyB2YWx1ZXNcbiAgICAgIGlmIChoYXNOZXh0UGFydCkge1xuICAgICAgICBpZiAoKHBvaW50ZXJbcF0gIT09ICcnICYmIHBvaW50ZXJbcF0gPCBJbmZpbml0eSkgfHwgcG9pbnRlcltwXSA9PT0gJy0nKSBvYmpbcGFydF0gPSBbXVxuICAgICAgICBlbHNlIG9ialtwYXJ0XSA9IHt9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFoYXNOZXh0UGFydCkgYnJlYWtcbiAgICBvYmogPSBvYmpbcGFydF1cbiAgfVxuXG4gIHZhciBvbGRWYWx1ZSA9IG9ialtwYXJ0XVxuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgZGVsZXRlIG9ialtwYXJ0XVxuICBlbHNlIG9ialtwYXJ0XSA9IHZhbHVlXG4gIHJldHVybiBvbGRWYWx1ZVxufVxuXG5mdW5jdGlvbiBjb21waWxlUG9pbnRlciAocG9pbnRlcikge1xuICBpZiAodHlwZW9mIHBvaW50ZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgcG9pbnRlciA9IHBvaW50ZXIuc3BsaXQoJy8nKVxuICAgIGlmIChwb2ludGVyWzBdID09PSAnJykgcmV0dXJuIHBvaW50ZXJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgSlNPTiBwb2ludGVyLicpXG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShwb2ludGVyKSkge1xuICAgIHJldHVybiBwb2ludGVyXG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgSlNPTiBwb2ludGVyLicpXG59XG5cbmZ1bmN0aW9uIGdldCAob2JqLCBwb2ludGVyKSB7XG4gIGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JykgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGlucHV0IG9iamVjdC4nKVxuICBwb2ludGVyID0gY29tcGlsZVBvaW50ZXIocG9pbnRlcilcbiAgdmFyIGxlbiA9IHBvaW50ZXIubGVuZ3RoXG4gIGlmIChsZW4gPT09IDEpIHJldHVybiBvYmpcblxuICBmb3IgKHZhciBwID0gMTsgcCA8IGxlbjspIHtcbiAgICBvYmogPSBvYmpbdW50aWxkZShwb2ludGVyW3ArK10pXVxuICAgIGlmIChsZW4gPT09IHApIHJldHVybiBvYmpcbiAgICBpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpIHJldHVybiB1bmRlZmluZWRcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXQgKG9iaiwgcG9pbnRlciwgdmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaW5wdXQgb2JqZWN0LicpXG4gIHBvaW50ZXIgPSBjb21waWxlUG9pbnRlcihwb2ludGVyKVxuICBpZiAocG9pbnRlci5sZW5ndGggPT09IDApIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBKU09OIHBvaW50ZXIgZm9yIHNldC4nKVxuICByZXR1cm4gc2V0dGVyKG9iaiwgcG9pbnRlciwgdmFsdWUpXG59XG5cbmZ1bmN0aW9uIGNvbXBpbGUgKHBvaW50ZXIpIHtcbiAgdmFyIGNvbXBpbGVkID0gY29tcGlsZVBvaW50ZXIocG9pbnRlcilcbiAgcmV0dXJuIHtcbiAgICBnZXQ6IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgIHJldHVybiBnZXQob2JqZWN0LCBjb21waWxlZClcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gKG9iamVjdCwgdmFsdWUpIHtcbiAgICAgIHJldHVybiBzZXQob2JqZWN0LCBjb21waWxlZCwgdmFsdWUpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydHMuZ2V0ID0gZ2V0XG5leHBvcnRzLnNldCA9IHNldFxuZXhwb3J0cy5jb21waWxlID0gY29tcGlsZVxuIiwibW9kdWxlLmV4cG9ydHMgPSBleHRlbmRcblxudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuZnVuY3Rpb24gZXh0ZW5kKCkge1xuICAgIHZhciB0YXJnZXQgPSB7fVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXVxuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkge1xuICAgICAgICAgICAgICAgIHRhcmdldFtrZXldID0gc291cmNlW2tleV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0YXJnZXRcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChmbikge1xuICBjb25zdCBhcnIgPSBbXVxuXG4gIC8qKlxuICAgKiBQcm94aWVkIGFycmF5IG11dGF0b3JzIG1ldGhvZHNcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9ialxuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cbiAgY29uc3QgcG9wID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IEFycmF5LnByb3RvdHlwZS5wb3AuYXBwbHkoYXJyKVxuXG4gICAgZm4oJ3BvcCcsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdFxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgY29uc3QgcHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShhcnIsIGFyZ3VtZW50cylcblxuICAgIGZuKCdwdXNoJywgYXJyLCB7XG4gICAgICB2YWx1ZTogcmVzdWx0XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBjb25zdCBzaGlmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUuc2hpZnQuYXBwbHkoYXJyKVxuXG4gICAgZm4oJ3NoaWZ0JywgYXJyLCB7XG4gICAgICB2YWx1ZTogcmVzdWx0XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBjb25zdCBzb3J0ID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IEFycmF5LnByb3RvdHlwZS5zb3J0LmFwcGx5KGFyciwgYXJndW1lbnRzKVxuXG4gICAgZm4oJ3NvcnQnLCBhcnIsIHtcbiAgICAgIHZhbHVlOiByZXN1bHRcbiAgICB9KVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIGNvbnN0IHVuc2hpZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gQXJyYXkucHJvdG90eXBlLnVuc2hpZnQuYXBwbHkoYXJyLCBhcmd1bWVudHMpXG5cbiAgICBmbigndW5zaGlmdCcsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdFxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgY29uc3QgcmV2ZXJzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUucmV2ZXJzZS5hcHBseShhcnIpXG5cbiAgICBmbigncmV2ZXJzZScsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdFxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgY29uc3Qgc3BsaWNlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gQXJyYXkucHJvdG90eXBlLnNwbGljZS5hcHBseShhcnIsIGFyZ3VtZW50cylcblxuICAgIGZuKCdzcGxpY2UnLCBhcnIsIHtcbiAgICAgIHZhbHVlOiByZXN1bHQsXG4gICAgICByZW1vdmVkOiByZXN1bHQsXG4gICAgICBhZGRlZDogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogUHJveHkgYWxsIEFycmF5LnByb3RvdHlwZSBtdXRhdG9yIG1ldGhvZHMgb24gdGhpcyBhcnJheSBpbnN0YW5jZVxuICAgKi9cbiAgYXJyLnBvcCA9IGFyci5wb3AgJiYgcG9wXG4gIGFyci5wdXNoID0gYXJyLnB1c2ggJiYgcHVzaFxuICBhcnIuc2hpZnQgPSBhcnIuc2hpZnQgJiYgc2hpZnRcbiAgYXJyLnVuc2hpZnQgPSBhcnIudW5zaGlmdCAmJiB1bnNoaWZ0XG4gIGFyci5zb3J0ID0gYXJyLnNvcnQgJiYgc29ydFxuICBhcnIucmV2ZXJzZSA9IGFyci5yZXZlcnNlICYmIHJldmVyc2VcbiAgYXJyLnNwbGljZSA9IGFyci5zcGxpY2UgJiYgc3BsaWNlXG5cbiAgLyoqXG4gICAqIFNwZWNpYWwgdXBkYXRlIGZ1bmN0aW9uIHNpbmNlIHdlIGNhbid0IGRldGVjdFxuICAgKiBhc3NpZ25tZW50IGJ5IGluZGV4IGUuZy4gYXJyWzBdID0gJ3NvbWV0aGluZydcbiAgICovXG4gIGFyci5zZXQgPSBmdW5jdGlvbiAoaW5kZXgsIHZhbHVlKSB7XG4gICAgY29uc3Qgb2xkVmFsdWUgPSBhcnJbaW5kZXhdXG4gICAgY29uc3QgbmV3VmFsdWUgPSBhcnJbaW5kZXhdID0gdmFsdWVcblxuICAgIGZuKCd1cGRhdGUnLCBhcnIsIHtcbiAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgIHZhbHVlOiBuZXdWYWx1ZSxcbiAgICAgIG9sZFZhbHVlOiBvbGRWYWx1ZVxuICAgIH0pXG5cbiAgICByZXR1cm4gbmV3VmFsdWVcbiAgfVxuXG4gIHJldHVybiBhcnJcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBhcnJheSA9IHJlcXVpcmUoJy4vYXJyYXknKVxuXG5mdW5jdGlvbiBtb2RlbCAoc2NoZW1hKSB7XG4gIGNvbnN0IHBhdGhzID0gW11cbiAgLy8gY29uc3Qgcm9vdCA9IGVlKHt9KVxuICBjb25zdCBjYWxsYmFja3MgPSB7fVxuXG4gIGNvbnN0IHJvb3QgPSBPYmplY3QuY3JlYXRlKHt9LCB7XG4gICAgb246IHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiAoZXZlbnQsIHNlbGVjdG9yLCBmbikge1xuICAgICAgICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgZm4gPSBzZWxlY3RvclxuICAgICAgICAgIHNlbGVjdG9yID0gdW5kZWZpbmVkXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNhbGxiYWNrc1tldmVudF0pIHtcbiAgICAgICAgICBjYWxsYmFja3NbZXZlbnRdID0gbmV3IE1hcCgpXG4gICAgICAgIH1cblxuICAgICAgICBjYWxsYmFja3NbZXZlbnRdLnNldChzZWxlY3RvciwgZm4pXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIGZ1bmN0aW9uIGVtaXQgKGV2ZW50LCBzZWxlY3RvciwgZGV0YWlscykge1xuICAgIGlmIChjYWxsYmFja3NbZXZlbnRdKSB7XG4gICAgICBjb25zdCBtYXAgPSBjYWxsYmFja3NbZXZlbnRdXG5cbiAgICAgIG1hcC5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgIGlmICgoIWtleSAmJiAhc2VsZWN0b3IpIHx8IChrZXkgPT09IHNlbGVjdG9yKSkge1xuICAgICAgICAgIHZhbHVlLmNhbGwocm9vdCwgZGV0YWlscylcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgaW5zdGFuY2VvZiBSZWdFeHAgJiYga2V5LnRlc3Qoc2VsZWN0b3IpKSB7XG4gICAgICAgICAgdmFsdWUuY2FsbChyb290LCBkZXRhaWxzKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5IChzY2hlbWEsIGN0eCwgcGF0aCkge1xuICAgIGlmIChzY2hlbWEucHJvcGVydGllcykge1xuICAgICAgcGF0aHMucHVzaChwYXRoKVxuICAgICAgcGF0aCA9IHBhdGhzLnNsaWNlKDEpLmpvaW4oJy4nKVxuXG4gICAgICBjb25zdCBwcm9wcyA9IHNjaGVtYS5wcm9wZXJ0aWVzXG5cbiAgICAgIGZvciAobGV0IGtleSBpbiBwcm9wcykge1xuICAgICAgICBjb25zdCBwcm9wID0gcHJvcHNba2V5XVxuXG4gICAgICAgIGlmIChwcm9wLnByb3BlcnRpZXMpIHtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IHt9XG4gICAgICAgICAgYXBwbHkocHJvcCwgY2hpbGQsIGtleSlcbiAgICAgICAgICBjdHhba2V5XSA9IGNoaWxkXG4gICAgICAgICAgcGF0aHMucG9wKClcbiAgICAgICAgfSBlbHNlIGlmIChwcm9wLml0ZW1zKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGQgPSBhcnJheShmdW5jdGlvbiAoZXZlbnQsIGFyciwgcmVzdWx0KSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gcGF0aCA/IHBhdGggKyAnLicgKyBrZXkgOiBrZXlcbiAgICAgICAgICAgIGVtaXQoZXZlbnQsIG5hbWUsIHtcbiAgICAgICAgICAgICAgZXZlbnQ6IGV2ZW50LFxuICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgcGF0aDogbmFtZSxcbiAgICAgICAgICAgICAgY29udGV4dDogYXJyLFxuICAgICAgICAgICAgICByZXN1bHQ6IHJlc3VsdFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgZW1pdCgndXBkYXRlJywgbnVsbCwge1xuICAgICAgICAgICAgICBldmVudDogZXZlbnQsXG4gICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICBwYXRoOiBuYW1lLFxuICAgICAgICAgICAgICBjb250ZXh0OiBhcnIsXG4gICAgICAgICAgICAgIHJlc3VsdDogcmVzdWx0XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG4gICAgICAgICAgY2hpbGQuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IHt9XG4gICAgICAgICAgICBhcHBseShwcm9wLml0ZW1zLCBpdGVtLCBwYXRoID8gcGF0aCArICcuJyArIGtleSA6IGtleSlcbiAgICAgICAgICAgIHBhdGhzLnBvcCgpXG4gICAgICAgICAgICByZXR1cm4gaXRlbVxuICAgICAgICAgIH1cbiAgICAgICAgICBjdHhba2V5XSA9IGNoaWxkXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IHZhbCA9IHByb3AuZGVmYXVsdFxuXG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0eCwga2V5LCB7XG4gICAgICAgICAgICBnZXQgKCkge1xuICAgICAgICAgICAgICByZXR1cm4gdmFsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0ICh2YWx1ZSkge1xuICAgICAgICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IHZhbFxuXG4gICAgICAgICAgICAgIHZhbCA9IHZhbHVlXG5cbiAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IHBhdGggPyBwYXRoICsgJy4nICsga2V5IDoga2V5XG4gICAgICAgICAgICAgIGVtaXQoJ2NoYW5nZScsIG5hbWUsIHtcbiAgICAgICAgICAgICAgICBldmVudDogJ2NoYW5nZScsXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgcGF0aDogbmFtZSxcbiAgICAgICAgICAgICAgICBjb250ZXh0OiBjdHgsXG4gICAgICAgICAgICAgICAgb2xkVmFsdWU6IG9sZFZhbHVlLFxuICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiB2YWx1ZVxuICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgIGVtaXQoJ3VwZGF0ZScsIG51bGwsIHtcbiAgICAgICAgICAgICAgICBldmVudDogJ3VwZGF0ZScsXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgcGF0aDogbmFtZSxcbiAgICAgICAgICAgICAgICBjb250ZXh0OiBjdHgsXG4gICAgICAgICAgICAgICAgb2xkVmFsdWU6IG9sZFZhbHVlLFxuICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiB2YWx1ZVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXBwbHkoc2NoZW1hLCByb290LCAnJylcblxuICBPYmplY3QuZnJlZXplKHJvb3QpXG5cbiAgcmV0dXJuIHJvb3Rcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtb2RlbFxuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCdmcmVlemVyLWpzJylcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnaXMtbXktanNvbi12YWxpZCcpXG4iXX0=
