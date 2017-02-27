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
      // initialState: initialState,
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
     * State
     */
    // const store = new Store(initialState)

    // store.on('update', function (currentState, prevState) {
    //   render()
    // })

    // cache.store = store
    // cache.initialFrozenState = store.get()

    /**
     * Input props/attrs & validation
     */
    const schema = options.schema
    if (schema) {
      const validate = validator(schema, validatorOptions)
      const props = schema.properties
      // const attrs = options.attributes
      const keys = Object.keys(props)

      keys.forEach((key) => {
        let item = props[key]
        let isAttr = isSimple(item)
        let dflt

        if ('default' in item) {
          dflt = item.default
        }

        if (isAttr) {
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

    // Hold a map of bound handers to the original handler
    // const handlers = new Map()

    // Initialise the delegator
    const del = delegator(this)
    this.on = del.on.bind(del)
    this.off = del.off.bind(del)
    cache.delegate = del

    // cache.handlers = handlers
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
    // Render on any change to observed property
    this.render()
  }

  attributeChangedCallback (name, oldValue, newValue) {
    // Render on any change to observed attributes
    this.render()
  }

  // get state () {
  //   return this.__superviews.store.get()
  // }

  render (immediatley) {
    if (immediatley) {
      this.renderCallback()
    } else {
      this.__superviews.render()
    }
  }

  // on (eventType, selector, handler, useCapture) {
  //   const del = this.__superviews.delegate
  //   const handlers = this.__superviews.handlers

  //   // handler can be passed as
  //   // the second or third argument
  //   let bound
  //   if (typeof selector === 'function') {
  //     bound = selector.bind(this)
  //     handlers.set(selector, bound)
  //     selector = bound
  //   } else {
  //     bound = handler.bind(this)
  //     handlers.set(handler, bound)
  //     handler = bound
  //   }

  //   del.on(eventType, selector, handler, useCapture)

  //   return this
  // }

  // off (eventType, selector, handler, useCapture) {
  //   const del = this.__superviews.delegate
  //   const handlers = this.__superviews.handlers

  //   if (arguments.length === 0) {
  //     // Remove all
  //     handlers.clear()
  //   } else {
  //     // handler can be passed as
  //     // the second or third argument
  //     let bound
  //     if (typeof selector === 'function') {
  //       bound = handlers.get(selector)
  //       handlers.delete(selector)
  //       selector = bound
  //     } else {
  //       bound = handlers.get(handler)
  //       handlers.delete(handler)
  //       handler = bound
  //     }
  //   }

  //   del.off(eventType, selector, handler, useCapture)

  //   return this
  // }

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

},{"../delegator":2,"../validator":30}],2:[function(require,module,exports){
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

var hoisted1 = ["style", "background: red; padding: 10px;"]
var __target

module.exports = function description (el, state) {
elementOpen("div")
  const result = this.validate()
  if (result.ok) {
    elementOpen("b")
      text("hi")
    elementClose("b")
    text(" " + (this.attr1) + " \
        ")
    elementOpen("button", null, null, "onclick", function ($event) {
      var $element = this;
    el.removeH1()})
      text("Remove Handlers")
    elementClose("button")
    elementOpen("dl")
      elementOpen("dt")
        text("State")
      elementClose("dt")
      elementOpen("dt")
        text("" + (JSON.stringify(state.toJS(), null, 2)) + "")
      elementClose("dt")
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
    elementClose("dl")
  } else {
    elementOpen("div", "0b02336a-4c1e-4a43-af39-2021c88dabb9", hoisted1)
      elementOpen("pre")
        text("" + (JSON.stringify(result.errors, null, 2)) + "")
      elementClose("pre")
    elementClose("div")
    text(" \
        Fix the errors in the console... \
        ")
    elementOpen("div")
      text("var el = document.querySelector('x-widget')")
    elementClose("div")
    elementOpen("div")
      text("el.int = '2'")
    elementClose("div")
  }
elementClose("div")
}

},{"incremental-dom":23}],5:[function(require,module,exports){
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

},{"../../../client":1,"../../../dre":3,"../../../incremental-dom":7,"../../../store":29,"./index.html":4,"./schema":6}],6:[function(require,module,exports){
module.exports={
  "type": "object",
  "properties": {
    "attr1": { "type": "string", "default": "something" },
    "numAttr": { "type": "number", "default": 1 },
    "int": { "type": "integer" },
    "prop1": { "type": "object" },
    "optional": { "type": "string" }
  },
  "required": [ "attr1", "numAttr", "int", "prop1" ]
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

},{"incremental-dom":23}],8:[function(require,module,exports){
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

},{"util":11}],22:[function(require,module,exports){
var isProperty = require('is-property')

var gen = function(obj, prop) {
  return isProperty(prop) ? obj+'.'+prop : obj+'['+JSON.stringify(prop)+']'
}

gen.valid = isProperty
gen.property = function (prop) {
 return isProperty(prop) ? prop : JSON.stringify(prop)
}

module.exports = gen

},{"is-property":26}],23:[function(require,module,exports){
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

},{"_process":8}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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

},{"./formats":24,"generate-function":21,"generate-object-property":22,"jsonpointer":27,"xtend":28}],26:[function(require,module,exports){
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
module.exports = require('freezer-js')

},{"freezer-js":15}],30:[function(require,module,exports){
module.exports = require('is-my-json-valid')

},{"is-my-json-valid":25}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvaW5kZXguanMiLCJkZWxlZ2F0b3IuanMiLCJkcmUuanMiLCJleGFtcGxlcy9jbGllbnQveC13aWRnZXQvaW5kZXguaHRtbCIsImV4YW1wbGVzL2NsaWVudC94LXdpZGdldC9pbmRleC5qcyIsImV4YW1wbGVzL2NsaWVudC94LXdpZGdldC9zY2hlbWEuanNvbiIsImluY3JlbWVudGFsLWRvbS5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9kb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50L2J1aWxkL2RvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQubm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9kb20tZGVsZWdhdGUvbGliL2RlbGVnYXRlLmpzIiwibm9kZV9tb2R1bGVzL2RvbS1kZWxlZ2F0ZS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZnJlZXplci1qcy9mcmVlemVyLmpzIiwibm9kZV9tb2R1bGVzL2ZyZWV6ZXItanMvc3JjL2VtaXR0ZXIuanMiLCJub2RlX21vZHVsZXMvZnJlZXplci1qcy9zcmMvZnJlZXplci5qcyIsIm5vZGVfbW9kdWxlcy9mcmVlemVyLWpzL3NyYy9mcm96ZW4uanMiLCJub2RlX21vZHVsZXMvZnJlZXplci1qcy9zcmMvbm9kZUNyZWF0b3IuanMiLCJub2RlX21vZHVsZXMvZnJlZXplci1qcy9zcmMvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvZ2VuZXJhdGUtZnVuY3Rpb24vaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2VuZXJhdGUtb2JqZWN0LXByb3BlcnR5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2luY3JlbWVudGFsLWRvbS9kaXN0L2luY3JlbWVudGFsLWRvbS1janMuanMiLCJub2RlX21vZHVsZXMvaXMtbXktanNvbi12YWxpZC9mb3JtYXRzLmpzIiwibm9kZV9tb2R1bGVzL2lzLW15LWpzb24tdmFsaWQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaXMtcHJvcGVydHkvaXMtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvanNvbnBvaW50ZXIvanNvbnBvaW50ZXIuanMiLCJub2RlX21vZHVsZXMveHRlbmQvaW1tdXRhYmxlLmpzIiwic3RvcmUuanMiLCJ2YWxpZGF0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFRBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMxa0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3o1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25kQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxNENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7O0FDREE7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBjb25zdCBTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3JlJylcbmNvbnN0IGRlbGVnYXRvciA9IHJlcXVpcmUoJy4uL2RlbGVnYXRvcicpXG5jb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKCcuLi92YWxpZGF0b3InKVxuXG5jb25zdCB2YWxpZGF0b3JPcHRpb25zID0ge1xuICBncmVlZHk6IHRydWUsXG4gIGZvcm1hdHM6IHtcbiAgICB1dWlkOiAvXig/OnVybjp1dWlkOik/WzAtOWEtZl17OH0tKD86WzAtOWEtZl17NH0tKXszfVswLTlhLWZdezEyfSQvaVxuICB9XG59XG5cbmNvbnN0IGNvbnZlcnRWYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSwgdHlwZSkge1xuICBpZiAodHlwZW9mICh2YWx1ZSkgIT09ICdzdHJpbmcnIHx8IHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHZhbHVlXG4gIH1cbiAgaWYgKHR5cGUgPT09ICdpbnRlZ2VyJyB8fCB0eXBlID09PSAnbnVtYmVyJykge1xuICAgIC8vIGZhc3Rlc3QgKGFuZCBtb3JlIHJlbGlhYmxlKSB3YXkgdG8gY29udmVydCBzdHJpbmdzIHRvIG51bWJlcnNcbiAgICB2YXIgY29udmVydGVkVmFsID0gMSAqIHZhbHVlXG4gICAgLy8gbWFrZSBzdXJlIHRoYXQgaWYgb3VyIHNjaGVtYSBjYWxscyBmb3IgYW4gaW50ZWdlciwgdGhhdCB0aGVyZSBpcyBubyBkZWNpbWFsXG4gICAgaWYgKGNvbnZlcnRlZFZhbCB8fCBjb252ZXJ0ZWRWYWwgPT09IDAgJiYgKHR5cGUgPT09ICdudW1iZXInIHx8ICh2YWx1ZS5pbmRleE9mKCcuJykgPT09IC0xKSkpIHtcbiAgICAgIHJldHVybiBjb252ZXJ0ZWRWYWxcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgaWYgKHZhbHVlID09PSAndHJ1ZScpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gJ2ZhbHNlJykge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZVxufVxuXG5mdW5jdGlvbiBpc1NpbXBsZSAoaXRlbSkge1xuICByZXR1cm4gaXRlbS50eXBlICE9PSAnb2JqZWN0JyAmJiBpdGVtLnR5cGUgIT09ICdhcnJheSdcbn1cblxuY29uc3Qgc3VwZXJ2aWV3cyA9IChvcHRpb25zLCBCYXNlID0gd2luZG93LkhUTUxFbGVtZW50KSA9PiBjbGFzcyBTdXBlcnZpZXdzIGV4dGVuZHMgQmFzZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpXG5cbiAgICBjb25zdCBjYWNoZSA9IHtcbiAgICAgIC8vIGluaXRpYWxTdGF0ZTogaW5pdGlhbFN0YXRlLFxuICAgICAgb3B0aW9uczogb3B0aW9uc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlZmVycmVkIHJlbmRlcmVyXG4gICAgICovXG4gICAgbGV0IHJlbmRlclRpbWVvdXRJZCA9IDBcbiAgICBjb25zdCByZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoIXJlbmRlclRpbWVvdXRJZCkge1xuICAgICAgICByZW5kZXJUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICByZW5kZXJUaW1lb3V0SWQgPSAwXG4gICAgICAgICAgdGhpcy5yZW5kZXJDYWxsYmFjaygpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpXG5cbiAgICBjYWNoZS5yZW5kZXIgPSByZW5kZXJcblxuICAgIC8qKlxuICAgICAqIFN0YXRlXG4gICAgICovXG4gICAgLy8gY29uc3Qgc3RvcmUgPSBuZXcgU3RvcmUoaW5pdGlhbFN0YXRlKVxuXG4gICAgLy8gc3RvcmUub24oJ3VwZGF0ZScsIGZ1bmN0aW9uIChjdXJyZW50U3RhdGUsIHByZXZTdGF0ZSkge1xuICAgIC8vICAgcmVuZGVyKClcbiAgICAvLyB9KVxuXG4gICAgLy8gY2FjaGUuc3RvcmUgPSBzdG9yZVxuICAgIC8vIGNhY2hlLmluaXRpYWxGcm96ZW5TdGF0ZSA9IHN0b3JlLmdldCgpXG5cbiAgICAvKipcbiAgICAgKiBJbnB1dCBwcm9wcy9hdHRycyAmIHZhbGlkYXRpb25cbiAgICAgKi9cbiAgICBjb25zdCBzY2hlbWEgPSBvcHRpb25zLnNjaGVtYVxuICAgIGlmIChzY2hlbWEpIHtcbiAgICAgIGNvbnN0IHZhbGlkYXRlID0gdmFsaWRhdG9yKHNjaGVtYSwgdmFsaWRhdG9yT3B0aW9ucylcbiAgICAgIGNvbnN0IHByb3BzID0gc2NoZW1hLnByb3BlcnRpZXNcbiAgICAgIC8vIGNvbnN0IGF0dHJzID0gb3B0aW9ucy5hdHRyaWJ1dGVzXG4gICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocHJvcHMpXG5cbiAgICAgIGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIGxldCBpdGVtID0gcHJvcHNba2V5XVxuICAgICAgICBsZXQgaXNBdHRyID0gaXNTaW1wbGUoaXRlbSlcbiAgICAgICAgbGV0IGRmbHRcblxuICAgICAgICBpZiAoJ2RlZmF1bHQnIGluIGl0ZW0pIHtcbiAgICAgICAgICBkZmx0ID0gaXRlbS5kZWZhdWx0XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNBdHRyKSB7XG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIGtleSwge1xuICAgICAgICAgICAgZ2V0ICgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFzQXR0cmlidXRlKGtleSlcbiAgICAgICAgICAgICAgICA/IGNvbnZlcnRWYWx1ZSh0aGlzLmdldEF0dHJpYnV0ZShrZXkpLCBpdGVtLnR5cGUpXG4gICAgICAgICAgICAgICAgOiBkZmx0XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0ICh2YWx1ZSkge1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCB2YWxcblxuICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBrZXksIHtcbiAgICAgICAgICAgIGdldCAoKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFsID09PSAndW5kZWZpbmVkJyA/IGRmbHQgOiB2YWxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQgKHZhbHVlKSB7XG4gICAgICAgICAgICAgIGNvbnN0IG9sZCA9IHZhbFxuICAgICAgICAgICAgICB2YWwgPSBjb252ZXJ0VmFsdWUodmFsdWUsIGl0ZW0udHlwZSlcbiAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayhrZXksIG9sZCwgdmFsKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGNhY2hlLnZhbGlkYXRlID0gdmFsaWRhdGVcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBEZWxlZ2F0aW9uXG4gICAgICovXG5cbiAgICAvLyBIb2xkIGEgbWFwIG9mIGJvdW5kIGhhbmRlcnMgdG8gdGhlIG9yaWdpbmFsIGhhbmRsZXJcbiAgICAvLyBjb25zdCBoYW5kbGVycyA9IG5ldyBNYXAoKVxuXG4gICAgLy8gSW5pdGlhbGlzZSB0aGUgZGVsZWdhdG9yXG4gICAgY29uc3QgZGVsID0gZGVsZWdhdG9yKHRoaXMpXG4gICAgdGhpcy5vbiA9IGRlbC5vbi5iaW5kKGRlbClcbiAgICB0aGlzLm9mZiA9IGRlbC5vZmYuYmluZChkZWwpXG4gICAgY2FjaGUuZGVsZWdhdGUgPSBkZWxcblxuICAgIC8vIGNhY2hlLmhhbmRsZXJzID0gaGFuZGxlcnNcbiAgICBjYWNoZS5ldmVudHMgPSBvcHRpb25zLmV2ZW50c1xuXG4gICAgdGhpcy5fX3N1cGVydmlld3MgPSBjYWNoZVxuICB9XG5cbiAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMgKCkge1xuICAgIGNvbnN0IHByb3BlcnRpZXMgPSBvcHRpb25zLnNjaGVtYSAmJiBvcHRpb25zLnNjaGVtYS5wcm9wZXJ0aWVzXG5cbiAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+IGlzU2ltcGxlKHByb3BlcnRpZXNba2V5XSkpXG4gICAgICAgIC5tYXAoa2V5ID0+IGtleS50b0xvd2VyQ2FzZSgpKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlckNhbGxiYWNrICgpIHtcbiAgICBjb25zb2xlLmxvZygnTm90IGltcGxlbWVudGVkIScpXG4gIH1cblxuICBwcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayAobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgLy8gUmVuZGVyIG9uIGFueSBjaGFuZ2UgdG8gb2JzZXJ2ZWQgcHJvcGVydHlcbiAgICB0aGlzLnJlbmRlcigpXG4gIH1cblxuICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sgKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgIC8vIFJlbmRlciBvbiBhbnkgY2hhbmdlIHRvIG9ic2VydmVkIGF0dHJpYnV0ZXNcbiAgICB0aGlzLnJlbmRlcigpXG4gIH1cblxuICAvLyBnZXQgc3RhdGUgKCkge1xuICAvLyAgIHJldHVybiB0aGlzLl9fc3VwZXJ2aWV3cy5zdG9yZS5nZXQoKVxuICAvLyB9XG5cbiAgcmVuZGVyIChpbW1lZGlhdGxleSkge1xuICAgIGlmIChpbW1lZGlhdGxleSkge1xuICAgICAgdGhpcy5yZW5kZXJDYWxsYmFjaygpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX19zdXBlcnZpZXdzLnJlbmRlcigpXG4gICAgfVxuICB9XG5cbiAgLy8gb24gKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIHVzZUNhcHR1cmUpIHtcbiAgLy8gICBjb25zdCBkZWwgPSB0aGlzLl9fc3VwZXJ2aWV3cy5kZWxlZ2F0ZVxuICAvLyAgIGNvbnN0IGhhbmRsZXJzID0gdGhpcy5fX3N1cGVydmlld3MuaGFuZGxlcnNcblxuICAvLyAgIC8vIGhhbmRsZXIgY2FuIGJlIHBhc3NlZCBhc1xuICAvLyAgIC8vIHRoZSBzZWNvbmQgb3IgdGhpcmQgYXJndW1lbnRcbiAgLy8gICBsZXQgYm91bmRcbiAgLy8gICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vICAgICBib3VuZCA9IHNlbGVjdG9yLmJpbmQodGhpcylcbiAgLy8gICAgIGhhbmRsZXJzLnNldChzZWxlY3RvciwgYm91bmQpXG4gIC8vICAgICBzZWxlY3RvciA9IGJvdW5kXG4gIC8vICAgfSBlbHNlIHtcbiAgLy8gICAgIGJvdW5kID0gaGFuZGxlci5iaW5kKHRoaXMpXG4gIC8vICAgICBoYW5kbGVycy5zZXQoaGFuZGxlciwgYm91bmQpXG4gIC8vICAgICBoYW5kbGVyID0gYm91bmRcbiAgLy8gICB9XG5cbiAgLy8gICBkZWwub24oZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdXNlQ2FwdHVyZSlcblxuICAvLyAgIHJldHVybiB0aGlzXG4gIC8vIH1cblxuICAvLyBvZmYgKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIHVzZUNhcHR1cmUpIHtcbiAgLy8gICBjb25zdCBkZWwgPSB0aGlzLl9fc3VwZXJ2aWV3cy5kZWxlZ2F0ZVxuICAvLyAgIGNvbnN0IGhhbmRsZXJzID0gdGhpcy5fX3N1cGVydmlld3MuaGFuZGxlcnNcblxuICAvLyAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gIC8vICAgICAvLyBSZW1vdmUgYWxsXG4gIC8vICAgICBoYW5kbGVycy5jbGVhcigpXG4gIC8vICAgfSBlbHNlIHtcbiAgLy8gICAgIC8vIGhhbmRsZXIgY2FuIGJlIHBhc3NlZCBhc1xuICAvLyAgICAgLy8gdGhlIHNlY29uZCBvciB0aGlyZCBhcmd1bWVudFxuICAvLyAgICAgbGV0IGJvdW5kXG4gIC8vICAgICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vICAgICAgIGJvdW5kID0gaGFuZGxlcnMuZ2V0KHNlbGVjdG9yKVxuICAvLyAgICAgICBoYW5kbGVycy5kZWxldGUoc2VsZWN0b3IpXG4gIC8vICAgICAgIHNlbGVjdG9yID0gYm91bmRcbiAgLy8gICAgIH0gZWxzZSB7XG4gIC8vICAgICAgIGJvdW5kID0gaGFuZGxlcnMuZ2V0KGhhbmRsZXIpXG4gIC8vICAgICAgIGhhbmRsZXJzLmRlbGV0ZShoYW5kbGVyKVxuICAvLyAgICAgICBoYW5kbGVyID0gYm91bmRcbiAgLy8gICAgIH1cbiAgLy8gICB9XG5cbiAgLy8gICBkZWwub2ZmKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIHVzZUNhcHR1cmUpXG5cbiAgLy8gICByZXR1cm4gdGhpc1xuICAvLyB9XG5cbiAgZW1pdCAobmFtZSwgZGV0YWlsKSB7XG4gICAgLy8gT25seSBlbWl0IHJlZ2lzdGVyZWQgZXZlbnRzXG4gICAgY29uc3QgZXZlbnRzID0gdGhpcy5fX3N1cGVydmlld3MuZXZlbnRzXG5cbiAgICBpZiAoIWV2ZW50cyB8fCAhKG5hbWUgaW4gZXZlbnRzKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGN1c3RvbSBldmVudFxuICAgIGNvbnN0IGV2ZW50ID0gbmV3IHdpbmRvdy5DdXN0b21FdmVudChuYW1lLCB7XG4gICAgICBkZXRhaWw6IGRldGFpbFxuICAgIH0pXG5cbiAgICAvLyBDYWxsIHRoZSBET00gTGV2ZWwgMSBoYW5kbGVyIGlmIG9uZSBleGlzdHNcbiAgICBpZiAodGhpc1snb24nICsgbmFtZV0pIHtcbiAgICAgIHRoaXNbJ29uJyArIG5hbWVdKGV2ZW50KVxuICAgIH1cblxuICAgIC8vIERpc3BhdGNoIHRoZSBldmVudFxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChldmVudClcbiAgfVxuXG4gIHZhbGlkYXRlICgpIHtcbiAgICAvLyBHZXQgdGhlIHNjaGVtYSBhbmQgdmFsaWRhdGUgZnVuY3Rpb25cbiAgICBjb25zdCBzY2hlbWEgPSBvcHRpb25zICYmIG9wdGlvbnMuc2NoZW1hXG4gICAgY29uc3QgdmFsaWRhdGUgPSB0aGlzLl9fc3VwZXJ2aWV3cy52YWxpZGF0ZVxuICAgIGlmIChzY2hlbWEgJiYgdmFsaWRhdGUpIHtcbiAgICAgIGNvbnN0IHByb3BzID0gc2NoZW1hLnByb3BlcnRpZXNcbiAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9wcylcblxuICAgICAgLy8gQnVpbGQgdGhlIGlucHV0IGRhdGFcbiAgICAgIGNvbnN0IGRhdGEgPSB7fVxuICAgICAga2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgZGF0YVtrZXldID0gdGhpc1trZXldXG4gICAgICB9KVxuXG4gICAgICAvLyBDYWxsIHRoZSB2YWxpZGF0b3JcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgICAgICAgb2s6IHZhbGlkYXRlKGRhdGEpXG4gICAgICB9XG5cbiAgICAgIC8vIEdldCB0aGUgZXJyb3JzIGlmIGluIGFuIGludmFsaWQgc3RhdGVcbiAgICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICAgIHJlc3VsdC5lcnJvcnMgPSB2YWxpZGF0ZS5lcnJvcnNcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBnZXQgc2NoZW1hICgpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5zY2hlbWFcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cGVydmlld3NcblxuLy8gVE9ETzpcbi8vIFNLSVBcbi8vIEV4dGVuZCBvdGhlciBIVE1MIGVsZW1lbnRzIC0gXCJpc1wiLy8gVE9ETzpcbi8vIFNLSVBcbi8vIEVYVEVORCBIVE1MXG4vLyBObyBtb3JlIGNoZWNrZWQ9e2lzQ2hlY2tlZCA/ICdjaGVja2VkJzogbnVsbH0gPT4gY2hlY2tlZD17aXNDaGVja2VkfSBmb3IgYm9vbGVhbiBhdHRyaWJ1dGVzXG4vLyBTY29wZS90aGlzL2RhdGEvbW9kZWwgKHNwcmVhZD8pIGJldHdlZW4gdGhlIHZpZXcgYW5kIGN1c3RvbWVsZW1lbnQuXG4vLyBBbHNvIGV2ZW50IGhhbmRsZXJzIG5lZWQgc2hvdWxkIG5vdCBoYXZlIHRvIGJlIHJlZGVmaW5lZCBlYWNoIHBhdGNoXG4vLyAgIC0gSW4gZmFjdCwgZG9tIGxldmVsIDEgZXZlbnRzIHdpbGwgKmFsd2F5cyogYmUgcmVkZWZpbmVkIHdpdGggc3VwZXJ2aWV3cyBoYW5kbGVyIHdyYXBwZXIuIEZpeCB0aGlzLlxuLy8gc3RhdGUgZnJvbSBwcm9wcy4gbmVlZCB0byBrbm93IHdoZW4gYSBwcm9wZXJ0eSBjaGFuZ2VzICh0byBwb3NzaWJseSB1cGRhdGUgc3RhdGUpLiBvciBtYXJrIHByb3BlcnRpZXMgZS5nLlxuLy8gb3B0cyA9IHtcbi8vICAgc2NoZW1hOiB7XG4vLyAgICAgcHJvcGVydGllczoge1xuLy8gICAgICAgdG9kbzoge1xuLy8gICAgICAgICB0ZXh0OiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4vLyAgICAgICAgIGlzQ29tcGxldGVkOiB7IHR5cGU6ICdib29sZWFuJyB9XG4vLyAgICAgICB9XG4vLyAgICAgfSxcbi8vICAgICByZXF1aXJlZDogWydpZCcsICd0ZXh0J11cbi8vICAgfSxcbiAgICAgIC8vIG5vdyBtYXJrIGNlcnRhaW4gcHJvcGVydGllcyBhcyBzdG9yZXMgdGhhdCB3aGVuIHNldCwgd2lsbCBiZSBmcm96ZW5cbiAgICAgIC8vIE1heWJlIGZyZWV6ZSBldmVyeXRoaW5nP1xuLy8gICBzdG9yZXM6IFsndG9kbycsIC4uLl1cbi8vIH1cbi8vIEFsdGVybmF0aXZlbHksIGhhdmUgYSBvblByb3BlcnR5Q2hhbmdlZCBjYWxsYmFjay5cbi8vIE5lZWQgYSBzdHJhdGVneSBmb3IgaW50ZXJuYWwgc3RhdGUgb3IgcHJvcHNcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnZG9tLWRlbGVnYXRlJylcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudCcpXG4iLCJ2YXIgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20nKVxudmFyIHBhdGNoID0gSW5jcmVtZW50YWxET00ucGF0Y2hcbnZhciBlbGVtZW50T3BlbiA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRPcGVuXG52YXIgZWxlbWVudENsb3NlID0gSW5jcmVtZW50YWxET00uZWxlbWVudENsb3NlXG52YXIgc2tpcCA9IEluY3JlbWVudGFsRE9NLnNraXBcbnZhciBjdXJyZW50RWxlbWVudCA9IEluY3JlbWVudGFsRE9NLmN1cnJlbnRFbGVtZW50XG52YXIgdGV4dCA9IEluY3JlbWVudGFsRE9NLnRleHRcblxudmFyIGhvaXN0ZWQxID0gW1wic3R5bGVcIiwgXCJiYWNrZ3JvdW5kOiByZWQ7IHBhZGRpbmc6IDEwcHg7XCJdXG52YXIgX190YXJnZXRcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZXNjcmlwdGlvbiAoZWwsIHN0YXRlKSB7XG5lbGVtZW50T3BlbihcImRpdlwiKVxuICBjb25zdCByZXN1bHQgPSB0aGlzLnZhbGlkYXRlKClcbiAgaWYgKHJlc3VsdC5vaykge1xuICAgIGVsZW1lbnRPcGVuKFwiYlwiKVxuICAgICAgdGV4dChcImhpXCIpXG4gICAgZWxlbWVudENsb3NlKFwiYlwiKVxuICAgIHRleHQoXCIgXCIgKyAodGhpcy5hdHRyMSkgKyBcIiBcXFxuICAgICAgICBcIilcbiAgICBlbGVtZW50T3BlbihcImJ1dHRvblwiLCBudWxsLCBudWxsLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICBlbC5yZW1vdmVIMSgpfSlcbiAgICAgIHRleHQoXCJSZW1vdmUgSGFuZGxlcnNcIilcbiAgICBlbGVtZW50Q2xvc2UoXCJidXR0b25cIilcbiAgICBlbGVtZW50T3BlbihcImRsXCIpXG4gICAgICBlbGVtZW50T3BlbihcImR0XCIpXG4gICAgICAgIHRleHQoXCJTdGF0ZVwiKVxuICAgICAgZWxlbWVudENsb3NlKFwiZHRcIilcbiAgICAgIGVsZW1lbnRPcGVuKFwiZHRcIilcbiAgICAgICAgdGV4dChcIlwiICsgKEpTT04uc3RyaW5naWZ5KHN0YXRlLnRvSlMoKSwgbnVsbCwgMikpICsgXCJcIilcbiAgICAgIGVsZW1lbnRDbG9zZShcImR0XCIpXG4gICAgICB0ZXh0KFwiIFxcXG4gICAgICAgICAgICBDaGFuZ2UgdGhlIHN0YXRlIGluIHRoZSBicm93c2VyLi4uIFxcXG4gICAgICAgICAgICBcIilcbiAgICAgIGVsZW1lbnRPcGVuKFwiZGl2XCIpXG4gICAgICAgIHRleHQoXCJ2YXIgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCd4LXdpZGdldCcpO1wiKVxuICAgICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgICBlbGVtZW50T3BlbihcImRpdlwiKVxuICAgICAgICB0ZXh0KFwiZWwuc3RhdGUuc2V0KCdhJyAsIDQyKVwiKVxuICAgICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgICBlbGVtZW50T3BlbihcImRpdlwiKVxuICAgICAgICB0ZXh0KFwiZWwuc3RhdGUuc2V0KCdiJyAsICdmb28nKVwiKVxuICAgICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgICBlbGVtZW50T3BlbihcImRpdlwiKVxuICAgICAgICB0ZXh0KFwiZWwuc3RhdGUuc2V0KCdjJyAsIFsnYmFyJywgJ2JheiddKVwiKVxuICAgICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgZWxlbWVudENsb3NlKFwiZGxcIilcbiAgfSBlbHNlIHtcbiAgICBlbGVtZW50T3BlbihcImRpdlwiLCBcIjBiMDIzMzZhLTRjMWUtNGE0My1hZjM5LTIwMjFjODhkYWJiOVwiLCBob2lzdGVkMSlcbiAgICAgIGVsZW1lbnRPcGVuKFwicHJlXCIpXG4gICAgICAgIHRleHQoXCJcIiArIChKU09OLnN0cmluZ2lmeShyZXN1bHQuZXJyb3JzLCBudWxsLCAyKSkgKyBcIlwiKVxuICAgICAgZWxlbWVudENsb3NlKFwicHJlXCIpXG4gICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgdGV4dChcIiBcXFxuICAgICAgICBGaXggdGhlIGVycm9ycyBpbiB0aGUgY29uc29sZS4uLiBcXFxuICAgICAgICBcIilcbiAgICBlbGVtZW50T3BlbihcImRpdlwiKVxuICAgICAgdGV4dChcInZhciBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3gtd2lkZ2V0JylcIilcbiAgICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbiAgICBlbGVtZW50T3BlbihcImRpdlwiKVxuICAgICAgdGV4dChcImVsLmludCA9ICcyJ1wiKVxuICAgIGVsZW1lbnRDbG9zZShcImRpdlwiKVxuICB9XG5lbGVtZW50Q2xvc2UoXCJkaXZcIilcbn1cbiIsInJlcXVpcmUoJy4uLy4uLy4uL2RyZScpXG5cbmNvbnN0IHN1cGVydmlld3MgPSByZXF1aXJlKCcuLi8uLi8uLi9jbGllbnQnKVxuY29uc3QgcGF0Y2ggPSByZXF1aXJlKCcuLi8uLi8uLi9pbmNyZW1lbnRhbC1kb20nKS5wYXRjaFxuY29uc3QgU3RvcmUgPSByZXF1aXJlKCcuLi8uLi8uLi9zdG9yZScpXG5jb25zdCB2aWV3ID0gcmVxdWlyZSgnLi9pbmRleC5odG1sJylcbmNvbnN0IHNjaGVtYSA9IHJlcXVpcmUoJy4vc2NoZW1hJylcblxuY29uc3Qgb3B0aW9ucyA9IHtcbiAgc2NoZW1hOiBzY2hlbWEsXG4gIGV2ZW50czoge1xuICAgIGNoYW5nZTogJ2NoYW5nZSdcbiAgfVxufVxuXG5jbGFzcyBDb250cm9sbGVyIHtcbiAgLy8gY29uc3RydWN0b3IgKCkge31cbiAgb25DbGljayAoZSkge1xuICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICB3aW5kb3cuYWxlcnQoJzEnKVxuICB9XG59XG5cbmNsYXNzIFdpZGdldCBleHRlbmRzIHN1cGVydmlld3Mob3B0aW9ucykge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoeyBhOiAxIH0pXG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBDb250cm9sbGVyKClcbiAgICB0aGlzXG4gICAgICAub24oJ2NsaWNrJywgY29udHJvbGxlci5vbkNsaWNrKVxuICAgICAgLm9uKCdjbGljaycsICdiJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2hleScpXG4gICAgICB9KVxuXG4gICAgY29uc3Qgc3RvcmUgPSBuZXcgU3RvcmUoe1xuICAgICAgbmV3VG9kb1RleHQ6ICcnXG4gICAgfSlcblxuICAgIHN0b3JlLm9uKCd1cGRhdGUnLCAoY3VycmVudFN0YXRlLCBwcmV2U3RhdGUpID0+IHtcbiAgICAgIHRoaXMucmVuZGVyKClcbiAgICB9KVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdzdGF0ZScsIHtcbiAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc3RvcmUuZ2V0KClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgdGhpcy5jb250cm9sbGVyID0gY29udHJvbGxlclxuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2sgKCkge1xuICAgIHRoaXMucmVuZGVyKHRydWUpXG4gIH1cblxuICByZW5kZXJDYWxsYmFjayAoKSB7XG4gICAgcGF0Y2godGhpcywgKCkgPT4ge1xuICAgICAgdmlldy5jYWxsKHRoaXMsIHRoaXMsIHRoaXMuc3RhdGUpXG4gICAgfSlcbiAgfVxuXG4gIHJlbW92ZUgxICgpIHtcbiAgICB0aGlzLm9mZigpXG4gIH1cbn1cblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZSgneC13aWRnZXQnLCBXaWRnZXQpXG5cbm1vZHVsZS5leHBvcnQgPSBXaWRnZXRcbiIsIm1vZHVsZS5leHBvcnRzPXtcbiAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gIFwicHJvcGVydGllc1wiOiB7XG4gICAgXCJhdHRyMVwiOiB7IFwidHlwZVwiOiBcInN0cmluZ1wiLCBcImRlZmF1bHRcIjogXCJzb21ldGhpbmdcIiB9LFxuICAgIFwibnVtQXR0clwiOiB7IFwidHlwZVwiOiBcIm51bWJlclwiLCBcImRlZmF1bHRcIjogMSB9LFxuICAgIFwiaW50XCI6IHsgXCJ0eXBlXCI6IFwiaW50ZWdlclwiIH0sXG4gICAgXCJwcm9wMVwiOiB7IFwidHlwZVwiOiBcIm9iamVjdFwiIH0sXG4gICAgXCJvcHRpb25hbFwiOiB7IFwidHlwZVwiOiBcInN0cmluZ1wiIH1cbiAgfSxcbiAgXCJyZXF1aXJlZFwiOiBbIFwiYXR0cjFcIiwgXCJudW1BdHRyXCIsIFwiaW50XCIsIFwicHJvcDFcIiBdXG59XG4iLCJjb25zdCBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpXG5cbkluY3JlbWVudGFsRE9NLmF0dHJpYnV0ZXMuY2hlY2tlZCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgZWwuY2hlY2tlZCA9ICEhdmFsdWVcbn1cblxuSW5jcmVtZW50YWxET00uYXR0cmlidXRlcy52YWx1ZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgZWwudmFsdWUgPSB2YWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgKHZhbHVlKSA9PT0gJ3VuZGVmaW5lZCcgPyAnJyA6IHZhbHVlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gSW5jcmVtZW50YWxET01cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCIvKiFcblxuQ29weXJpZ2h0IChDKSAyMDE0LTIwMTYgYnkgQW5kcmVhIEdpYW1tYXJjaGkgLSBAV2ViUmVmbGVjdGlvblxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuXG5cbiovXG4vLyBnbG9iYWwgd2luZG93IE9iamVjdFxuLy8gb3B0aW9uYWwgcG9seWZpbGwgaW5mb1xuLy8gICAgJ2F1dG8nIHVzZWQgYnkgZGVmYXVsdCwgZXZlcnl0aGluZyBpcyBmZWF0dXJlIGRldGVjdGVkXG4vLyAgICAnZm9yY2UnIHVzZSB0aGUgcG9seWZpbGwgZXZlbiBpZiBub3QgZnVsbHkgbmVlZGVkXG5mdW5jdGlvbiBpbnN0YWxsQ3VzdG9tRWxlbWVudHMod2luZG93LCBwb2x5ZmlsbCkgeyd1c2Ugc3RyaWN0JztcblxuICAvLyBETyBOT1QgVVNFIFRISVMgRklMRSBESVJFQ1RMWSwgSVQgV09OJ1QgV09SS1xuICAvLyBUSElTIElTIEEgUFJPSkVDVCBCQVNFRCBPTiBBIEJVSUxEIFNZU1RFTVxuICAvLyBUSElTIEZJTEUgSVMgSlVTVCBXUkFQUEVEIFVQIFJFU1VMVElORyBJTlxuICAvLyBidWlsZC9kb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50Lm5vZGUuanNcblxuICB2YXJcbiAgICBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudCxcbiAgICBPYmplY3QgPSB3aW5kb3cuT2JqZWN0XG4gIDtcblxuICB2YXIgaHRtbENsYXNzID0gKGZ1bmN0aW9uIChpbmZvKSB7XG4gICAgLy8gKEMpIEFuZHJlYSBHaWFtbWFyY2hpIC0gQFdlYlJlZmxlY3Rpb24gLSBNSVQgU3R5bGVcbiAgICB2YXJcbiAgICAgIGNhdGNoQ2xhc3MgPSAvXltBLVpdK1thLXpdLyxcbiAgICAgIGZpbHRlckJ5ID0gZnVuY3Rpb24gKHJlKSB7XG4gICAgICAgIHZhciBhcnIgPSBbXSwgdGFnO1xuICAgICAgICBmb3IgKHRhZyBpbiByZWdpc3Rlcikge1xuICAgICAgICAgIGlmIChyZS50ZXN0KHRhZykpIGFyci5wdXNoKHRhZyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICAgIH0sXG4gICAgICBhZGQgPSBmdW5jdGlvbiAoQ2xhc3MsIHRhZykge1xuICAgICAgICB0YWcgPSB0YWcudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKCEodGFnIGluIHJlZ2lzdGVyKSkge1xuICAgICAgICAgIHJlZ2lzdGVyW0NsYXNzXSA9IChyZWdpc3RlcltDbGFzc10gfHwgW10pLmNvbmNhdCh0YWcpO1xuICAgICAgICAgIHJlZ2lzdGVyW3RhZ10gPSAocmVnaXN0ZXJbdGFnLnRvVXBwZXJDYXNlKCldID0gQ2xhc3MpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgcmVnaXN0ZXIgPSAoT2JqZWN0LmNyZWF0ZSB8fCBPYmplY3QpKG51bGwpLFxuICAgICAgaHRtbENsYXNzID0ge30sXG4gICAgICBpLCBzZWN0aW9uLCB0YWdzLCBDbGFzc1xuICAgIDtcbiAgICBmb3IgKHNlY3Rpb24gaW4gaW5mbykge1xuICAgICAgZm9yIChDbGFzcyBpbiBpbmZvW3NlY3Rpb25dKSB7XG4gICAgICAgIHRhZ3MgPSBpbmZvW3NlY3Rpb25dW0NsYXNzXTtcbiAgICAgICAgcmVnaXN0ZXJbQ2xhc3NdID0gdGFncztcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICByZWdpc3Rlclt0YWdzW2ldLnRvTG93ZXJDYXNlKCldID1cbiAgICAgICAgICByZWdpc3Rlclt0YWdzW2ldLnRvVXBwZXJDYXNlKCldID0gQ2xhc3M7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaHRtbENsYXNzLmdldCA9IGZ1bmN0aW9uIGdldCh0YWdPckNsYXNzKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHRhZ09yQ2xhc3MgPT09ICdzdHJpbmcnID9cbiAgICAgICAgKHJlZ2lzdGVyW3RhZ09yQ2xhc3NdIHx8IChjYXRjaENsYXNzLnRlc3QodGFnT3JDbGFzcykgPyBbXSA6ICcnKSkgOlxuICAgICAgICBmaWx0ZXJCeSh0YWdPckNsYXNzKTtcbiAgICB9O1xuICAgIGh0bWxDbGFzcy5zZXQgPSBmdW5jdGlvbiBzZXQodGFnLCBDbGFzcykge1xuICAgICAgcmV0dXJuIChjYXRjaENsYXNzLnRlc3QodGFnKSA/XG4gICAgICAgIGFkZCh0YWcsIENsYXNzKSA6XG4gICAgICAgIGFkZChDbGFzcywgdGFnKVxuICAgICAgKSwgaHRtbENsYXNzO1xuICAgIH07XG4gICAgcmV0dXJuIGh0bWxDbGFzcztcbiAgfSh7XG4gICAgXCJjb2xsZWN0aW9uc1wiOiB7XG4gICAgICBcIkhUTUxBbGxDb2xsZWN0aW9uXCI6IFtcbiAgICAgICAgXCJhbGxcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTENvbGxlY3Rpb25cIjogW1xuICAgICAgICBcImZvcm1zXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxGb3JtQ29udHJvbHNDb2xsZWN0aW9uXCI6IFtcbiAgICAgICAgXCJlbGVtZW50c1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MT3B0aW9uc0NvbGxlY3Rpb25cIjogW1xuICAgICAgICBcIm9wdGlvbnNcIlxuICAgICAgXVxuICAgIH0sXG4gICAgXCJlbGVtZW50c1wiOiB7XG4gICAgICBcIkVsZW1lbnRcIjogW1xuICAgICAgICBcImVsZW1lbnRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEFuY2hvckVsZW1lbnRcIjogW1xuICAgICAgICBcImFcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEFwcGxldEVsZW1lbnRcIjogW1xuICAgICAgICBcImFwcGxldFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQXJlYUVsZW1lbnRcIjogW1xuICAgICAgICBcImFyZWFcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEF0dGFjaG1lbnRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJhdHRhY2htZW50XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxBdWRpb0VsZW1lbnRcIjogW1xuICAgICAgICBcImF1ZGlvXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxCUkVsZW1lbnRcIjogW1xuICAgICAgICBcImJyXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxCYXNlRWxlbWVudFwiOiBbXG4gICAgICAgIFwiYmFzZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQm9keUVsZW1lbnRcIjogW1xuICAgICAgICBcImJvZHlcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEJ1dHRvbkVsZW1lbnRcIjogW1xuICAgICAgICBcImJ1dHRvblwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQ2FudmFzRWxlbWVudFwiOiBbXG4gICAgICAgIFwiY2FudmFzXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxDb250ZW50RWxlbWVudFwiOiBbXG4gICAgICAgIFwiY29udGVudFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRExpc3RFbGVtZW50XCI6IFtcbiAgICAgICAgXCJkbFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRGF0YUVsZW1lbnRcIjogW1xuICAgICAgICBcImRhdGFcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTERhdGFMaXN0RWxlbWVudFwiOiBbXG4gICAgICAgIFwiZGF0YWxpc3RcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTERldGFpbHNFbGVtZW50XCI6IFtcbiAgICAgICAgXCJkZXRhaWxzXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxEaWFsb2dFbGVtZW50XCI6IFtcbiAgICAgICAgXCJkaWFsb2dcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTERpcmVjdG9yeUVsZW1lbnRcIjogW1xuICAgICAgICBcImRpclwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRGl2RWxlbWVudFwiOiBbXG4gICAgICAgIFwiZGl2XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxEb2N1bWVudFwiOiBbXG4gICAgICAgIFwiZG9jdW1lbnRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEVsZW1lbnRcIjogW1xuICAgICAgICBcImVsZW1lbnRcIixcbiAgICAgICAgXCJhYmJyXCIsXG4gICAgICAgIFwiYWRkcmVzc1wiLFxuICAgICAgICBcImFydGljbGVcIixcbiAgICAgICAgXCJhc2lkZVwiLFxuICAgICAgICBcImJcIixcbiAgICAgICAgXCJiZGlcIixcbiAgICAgICAgXCJiZG9cIixcbiAgICAgICAgXCJjaXRlXCIsXG4gICAgICAgIFwiY29kZVwiLFxuICAgICAgICBcImNvbW1hbmRcIixcbiAgICAgICAgXCJkZFwiLFxuICAgICAgICBcImRmblwiLFxuICAgICAgICBcImR0XCIsXG4gICAgICAgIFwiZW1cIixcbiAgICAgICAgXCJmaWdjYXB0aW9uXCIsXG4gICAgICAgIFwiZmlndXJlXCIsXG4gICAgICAgIFwiZm9vdGVyXCIsXG4gICAgICAgIFwiaGVhZGVyXCIsXG4gICAgICAgIFwiaVwiLFxuICAgICAgICBcImtiZFwiLFxuICAgICAgICBcIm1hcmtcIixcbiAgICAgICAgXCJuYXZcIixcbiAgICAgICAgXCJub3NjcmlwdFwiLFxuICAgICAgICBcInJwXCIsXG4gICAgICAgIFwicnRcIixcbiAgICAgICAgXCJydWJ5XCIsXG4gICAgICAgIFwic1wiLFxuICAgICAgICBcInNhbXBcIixcbiAgICAgICAgXCJzZWN0aW9uXCIsXG4gICAgICAgIFwic21hbGxcIixcbiAgICAgICAgXCJzdHJvbmdcIixcbiAgICAgICAgXCJzdWJcIixcbiAgICAgICAgXCJzdW1tYXJ5XCIsXG4gICAgICAgIFwic3VwXCIsXG4gICAgICAgIFwidVwiLFxuICAgICAgICBcInZhclwiLFxuICAgICAgICBcIndiclwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRW1iZWRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJlbWJlZFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRmllbGRTZXRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJmaWVsZHNldFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRm9udEVsZW1lbnRcIjogW1xuICAgICAgICBcImZvbnRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEZvcm1FbGVtZW50XCI6IFtcbiAgICAgICAgXCJmb3JtXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxGcmFtZUVsZW1lbnRcIjogW1xuICAgICAgICBcImZyYW1lXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxGcmFtZVNldEVsZW1lbnRcIjogW1xuICAgICAgICBcImZyYW1lc2V0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxIUkVsZW1lbnRcIjogW1xuICAgICAgICBcImhyXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxIZWFkRWxlbWVudFwiOiBbXG4gICAgICAgIFwiaGVhZFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MSGVhZGluZ0VsZW1lbnRcIjogW1xuICAgICAgICBcImgxXCIsXG4gICAgICAgIFwiaDJcIixcbiAgICAgICAgXCJoM1wiLFxuICAgICAgICBcImg0XCIsXG4gICAgICAgIFwiaDVcIixcbiAgICAgICAgXCJoNlwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MSHRtbEVsZW1lbnRcIjogW1xuICAgICAgICBcImh0bWxcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTElGcmFtZUVsZW1lbnRcIjogW1xuICAgICAgICBcImlmcmFtZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MSW1hZ2VFbGVtZW50XCI6IFtcbiAgICAgICAgXCJpbWdcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTElucHV0RWxlbWVudFwiOiBbXG4gICAgICAgIFwiaW5wdXRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEtleWdlbkVsZW1lbnRcIjogW1xuICAgICAgICBcImtleWdlblwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTElFbGVtZW50XCI6IFtcbiAgICAgICAgXCJsaVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTGFiZWxFbGVtZW50XCI6IFtcbiAgICAgICAgXCJsYWJlbFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTGVnZW5kRWxlbWVudFwiOiBbXG4gICAgICAgIFwibGVnZW5kXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxMaW5rRWxlbWVudFwiOiBbXG4gICAgICAgIFwibGlua1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTWFwRWxlbWVudFwiOiBbXG4gICAgICAgIFwibWFwXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxNYXJxdWVlRWxlbWVudFwiOiBbXG4gICAgICAgIFwibWFycXVlZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTWVkaWFFbGVtZW50XCI6IFtcbiAgICAgICAgXCJtZWRpYVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTWVudUVsZW1lbnRcIjogW1xuICAgICAgICBcIm1lbnVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE1lbnVJdGVtRWxlbWVudFwiOiBbXG4gICAgICAgIFwibWVudWl0ZW1cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE1ldGFFbGVtZW50XCI6IFtcbiAgICAgICAgXCJtZXRhXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxNZXRlckVsZW1lbnRcIjogW1xuICAgICAgICBcIm1ldGVyXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxNb2RFbGVtZW50XCI6IFtcbiAgICAgICAgXCJkZWxcIixcbiAgICAgICAgXCJpbnNcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE9MaXN0RWxlbWVudFwiOiBbXG4gICAgICAgIFwib2xcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE9iamVjdEVsZW1lbnRcIjogW1xuICAgICAgICBcIm9iamVjdFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MT3B0R3JvdXBFbGVtZW50XCI6IFtcbiAgICAgICAgXCJvcHRncm91cFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MT3B0aW9uRWxlbWVudFwiOiBbXG4gICAgICAgIFwib3B0aW9uXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxPdXRwdXRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJvdXRwdXRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFBhcmFncmFwaEVsZW1lbnRcIjogW1xuICAgICAgICBcInBcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFBhcmFtRWxlbWVudFwiOiBbXG4gICAgICAgIFwicGFyYW1cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFBpY3R1cmVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJwaWN0dXJlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxQcmVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJwcmVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFByb2dyZXNzRWxlbWVudFwiOiBbXG4gICAgICAgIFwicHJvZ3Jlc3NcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFF1b3RlRWxlbWVudFwiOiBbXG4gICAgICAgIFwiYmxvY2txdW90ZVwiLFxuICAgICAgICBcInFcIixcbiAgICAgICAgXCJxdW90ZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MU2NyaXB0RWxlbWVudFwiOiBbXG4gICAgICAgIFwic2NyaXB0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxTZWxlY3RFbGVtZW50XCI6IFtcbiAgICAgICAgXCJzZWxlY3RcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFNoYWRvd0VsZW1lbnRcIjogW1xuICAgICAgICBcInNoYWRvd1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MU2xvdEVsZW1lbnRcIjogW1xuICAgICAgICBcInNsb3RcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFNvdXJjZUVsZW1lbnRcIjogW1xuICAgICAgICBcInNvdXJjZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MU3BhbkVsZW1lbnRcIjogW1xuICAgICAgICBcInNwYW5cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFN0eWxlRWxlbWVudFwiOiBbXG4gICAgICAgIFwic3R5bGVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFRhYmxlQ2FwdGlvbkVsZW1lbnRcIjogW1xuICAgICAgICBcImNhcHRpb25cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFRhYmxlQ2VsbEVsZW1lbnRcIjogW1xuICAgICAgICBcInRkXCIsXG4gICAgICAgIFwidGhcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFRhYmxlQ29sRWxlbWVudFwiOiBbXG4gICAgICAgIFwiY29sXCIsXG4gICAgICAgIFwiY29sZ3JvdXBcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFRhYmxlRWxlbWVudFwiOiBbXG4gICAgICAgIFwidGFibGVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFRhYmxlUm93RWxlbWVudFwiOiBbXG4gICAgICAgIFwidHJcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnRcIjogW1xuICAgICAgICBcInRoZWFkXCIsXG4gICAgICAgIFwidGJvZHlcIixcbiAgICAgICAgXCJ0Zm9vdFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGVtcGxhdGVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0ZW1wbGF0ZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGV4dEFyZWFFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0ZXh0YXJlYVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGltZUVsZW1lbnRcIjogW1xuICAgICAgICBcInRpbWVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFRpdGxlRWxlbWVudFwiOiBbXG4gICAgICAgIFwidGl0bGVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFRyYWNrRWxlbWVudFwiOiBbXG4gICAgICAgIFwidHJhY2tcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFVMaXN0RWxlbWVudFwiOiBbXG4gICAgICAgIFwidWxcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFVua25vd25FbGVtZW50XCI6IFtcbiAgICAgICAgXCJ1bmtub3duXCIsXG4gICAgICAgIFwidmhncm91cHZcIixcbiAgICAgICAgXCJ2a2V5Z2VuXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxWaWRlb0VsZW1lbnRcIjogW1xuICAgICAgICBcInZpZGVvXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIFwibm9kZXNcIjoge1xuICAgICAgXCJBdHRyXCI6IFtcbiAgICAgICAgXCJub2RlXCJcbiAgICAgIF0sXG4gICAgICBcIkF1ZGlvXCI6IFtcbiAgICAgICAgXCJhdWRpb1wiXG4gICAgICBdLFxuICAgICAgXCJDREFUQVNlY3Rpb25cIjogW1xuICAgICAgICBcIm5vZGVcIlxuICAgICAgXSxcbiAgICAgIFwiQ2hhcmFjdGVyRGF0YVwiOiBbXG4gICAgICAgIFwibm9kZVwiXG4gICAgICBdLFxuICAgICAgXCJDb21tZW50XCI6IFtcbiAgICAgICAgXCIjY29tbWVudFwiXG4gICAgICBdLFxuICAgICAgXCJEb2N1bWVudFwiOiBbXG4gICAgICAgIFwiI2RvY3VtZW50XCJcbiAgICAgIF0sXG4gICAgICBcIkRvY3VtZW50RnJhZ21lbnRcIjogW1xuICAgICAgICBcIiNkb2N1bWVudC1mcmFnbWVudFwiXG4gICAgICBdLFxuICAgICAgXCJEb2N1bWVudFR5cGVcIjogW1xuICAgICAgICBcIm5vZGVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTERvY3VtZW50XCI6IFtcbiAgICAgICAgXCIjZG9jdW1lbnRcIlxuICAgICAgXSxcbiAgICAgIFwiSW1hZ2VcIjogW1xuICAgICAgICBcImltZ1wiXG4gICAgICBdLFxuICAgICAgXCJPcHRpb25cIjogW1xuICAgICAgICBcIm9wdGlvblwiXG4gICAgICBdLFxuICAgICAgXCJQcm9jZXNzaW5nSW5zdHJ1Y3Rpb25cIjogW1xuICAgICAgICBcIm5vZGVcIlxuICAgICAgXSxcbiAgICAgIFwiU2hhZG93Um9vdFwiOiBbXG4gICAgICAgIFwiI3NoYWRvdy1yb290XCJcbiAgICAgIF0sXG4gICAgICBcIlRleHRcIjogW1xuICAgICAgICBcIiN0ZXh0XCJcbiAgICAgIF0sXG4gICAgICBcIlhNTERvY3VtZW50XCI6IFtcbiAgICAgICAgXCJ4bWxcIlxuICAgICAgXVxuICAgIH1cbiAgfSkpO1xuICBcbiAgXG4gICAgXG4gIC8vIHBhc3NlZCBhdCBydW50aW1lLCBjb25maWd1cmFibGVcbiAgLy8gdmlhIG5vZGVqcyBtb2R1bGVcbiAgaWYgKCFwb2x5ZmlsbCkgcG9seWZpbGwgPSAnYXV0byc7XG4gIFxuICB2YXJcbiAgICAvLyBWMCBwb2x5ZmlsbCBlbnRyeVxuICAgIFJFR0lTVEVSX0VMRU1FTlQgPSAncmVnaXN0ZXJFbGVtZW50JyxcbiAgXG4gICAgLy8gSUUgPCAxMSBvbmx5ICsgb2xkIFdlYktpdCBmb3IgYXR0cmlidXRlcyArIGZlYXR1cmUgZGV0ZWN0aW9uXG4gICAgRVhQQU5ET19VSUQgPSAnX18nICsgUkVHSVNURVJfRUxFTUVOVCArICh3aW5kb3cuTWF0aC5yYW5kb20oKSAqIDEwZTQgPj4gMCksXG4gIFxuICAgIC8vIHNob3J0Y3V0cyBhbmQgY29zdGFudHNcbiAgICBBRERfRVZFTlRfTElTVEVORVIgPSAnYWRkRXZlbnRMaXN0ZW5lcicsXG4gICAgQVRUQUNIRUQgPSAnYXR0YWNoZWQnLFxuICAgIENBTExCQUNLID0gJ0NhbGxiYWNrJyxcbiAgICBERVRBQ0hFRCA9ICdkZXRhY2hlZCcsXG4gICAgRVhURU5EUyA9ICdleHRlbmRzJyxcbiAgXG4gICAgQVRUUklCVVRFX0NIQU5HRURfQ0FMTEJBQ0sgPSAnYXR0cmlidXRlQ2hhbmdlZCcgKyBDQUxMQkFDSyxcbiAgICBBVFRBQ0hFRF9DQUxMQkFDSyA9IEFUVEFDSEVEICsgQ0FMTEJBQ0ssXG4gICAgQ09OTkVDVEVEX0NBTExCQUNLID0gJ2Nvbm5lY3RlZCcgKyBDQUxMQkFDSyxcbiAgICBESVNDT05ORUNURURfQ0FMTEJBQ0sgPSAnZGlzY29ubmVjdGVkJyArIENBTExCQUNLLFxuICAgIENSRUFURURfQ0FMTEJBQ0sgPSAnY3JlYXRlZCcgKyBDQUxMQkFDSyxcbiAgICBERVRBQ0hFRF9DQUxMQkFDSyA9IERFVEFDSEVEICsgQ0FMTEJBQ0ssXG4gIFxuICAgIEFERElUSU9OID0gJ0FERElUSU9OJyxcbiAgICBNT0RJRklDQVRJT04gPSAnTU9ESUZJQ0FUSU9OJyxcbiAgICBSRU1PVkFMID0gJ1JFTU9WQUwnLFxuICBcbiAgICBET01fQVRUUl9NT0RJRklFRCA9ICdET01BdHRyTW9kaWZpZWQnLFxuICAgIERPTV9DT05URU5UX0xPQURFRCA9ICdET01Db250ZW50TG9hZGVkJyxcbiAgICBET01fU1VCVFJFRV9NT0RJRklFRCA9ICdET01TdWJ0cmVlTW9kaWZpZWQnLFxuICBcbiAgICBQUkVGSVhfVEFHID0gJzwnLFxuICAgIFBSRUZJWF9JUyA9ICc9JyxcbiAgXG4gICAgLy8gdmFsaWQgYW5kIGludmFsaWQgbm9kZSBuYW1lc1xuICAgIHZhbGlkTmFtZSA9IC9eW0EtWl1bQS1aMC05XSooPzotW0EtWjAtOV0rKSskLyxcbiAgICBpbnZhbGlkTmFtZXMgPSBbXG4gICAgICAnQU5OT1RBVElPTi1YTUwnLFxuICAgICAgJ0NPTE9SLVBST0ZJTEUnLFxuICAgICAgJ0ZPTlQtRkFDRScsXG4gICAgICAnRk9OVC1GQUNFLVNSQycsXG4gICAgICAnRk9OVC1GQUNFLVVSSScsXG4gICAgICAnRk9OVC1GQUNFLUZPUk1BVCcsXG4gICAgICAnRk9OVC1GQUNFLU5BTUUnLFxuICAgICAgJ01JU1NJTkctR0xZUEgnXG4gICAgXSxcbiAgXG4gICAgLy8gcmVnaXN0ZXJlZCB0eXBlcyBhbmQgdGhlaXIgcHJvdG90eXBlc1xuICAgIHR5cGVzID0gW10sXG4gICAgcHJvdG9zID0gW10sXG4gIFxuICAgIC8vIHRvIHF1ZXJ5IHN1Ym5vZGVzXG4gICAgcXVlcnkgPSAnJyxcbiAgXG4gICAgLy8gaHRtbCBzaG9ydGN1dCB1c2VkIHRvIGZlYXR1cmUgZGV0ZWN0XG4gICAgZG9jdW1lbnRFbGVtZW50ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuICBcbiAgICAvLyBFUzUgaW5saW5lIGhlbHBlcnMgfHwgYmFzaWMgcGF0Y2hlc1xuICAgIGluZGV4T2YgPSB0eXBlcy5pbmRleE9mIHx8IGZ1bmN0aW9uICh2KSB7XG4gICAgICBmb3IodmFyIGkgPSB0aGlzLmxlbmd0aDsgaS0tICYmIHRoaXNbaV0gIT09IHY7KXt9XG4gICAgICByZXR1cm4gaTtcbiAgICB9LFxuICBcbiAgICAvLyBvdGhlciBoZWxwZXJzIC8gc2hvcnRjdXRzXG4gICAgT1AgPSBPYmplY3QucHJvdG90eXBlLFxuICAgIGhPUCA9IE9QLmhhc093blByb3BlcnR5LFxuICAgIGlQTyA9IE9QLmlzUHJvdG90eXBlT2YsXG4gIFxuICAgIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5LFxuICAgIGVtcHR5ID0gW10sXG4gICAgZ09QRCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IsXG4gICAgZ09QTiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzLFxuICAgIGdQTyA9IE9iamVjdC5nZXRQcm90b3R5cGVPZixcbiAgICBzUE8gPSBPYmplY3Quc2V0UHJvdG90eXBlT2YsXG4gIFxuICAgIC8vIGpzaGludCBwcm90bzogdHJ1ZVxuICAgIGhhc1Byb3RvID0gISFPYmplY3QuX19wcm90b19fLFxuICBcbiAgICAvLyBWMSBoZWxwZXJzXG4gICAgZml4R2V0Q2xhc3MgPSBmYWxzZSxcbiAgICBEUkVDRVYxID0gJ19fZHJlQ0V2MScsXG4gICAgY3VzdG9tRWxlbWVudHMgPSB3aW5kb3cuY3VzdG9tRWxlbWVudHMsXG4gICAgdXNhYmxlQ3VzdG9tRWxlbWVudHMgPSBwb2x5ZmlsbCAhPT0gJ2ZvcmNlJyAmJiAhIShcbiAgICAgIGN1c3RvbUVsZW1lbnRzICYmXG4gICAgICBjdXN0b21FbGVtZW50cy5kZWZpbmUgJiZcbiAgICAgIGN1c3RvbUVsZW1lbnRzLmdldCAmJlxuICAgICAgY3VzdG9tRWxlbWVudHMud2hlbkRlZmluZWRcbiAgICApLFxuICAgIERpY3QgPSBPYmplY3QuY3JlYXRlIHx8IE9iamVjdCxcbiAgICBNYXAgPSB3aW5kb3cuTWFwIHx8IGZ1bmN0aW9uIE1hcCgpIHtcbiAgICAgIHZhciBLID0gW10sIFYgPSBbXSwgaTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICByZXR1cm4gVltpbmRleE9mLmNhbGwoSywgayldO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChrLCB2KSB7XG4gICAgICAgICAgaSA9IGluZGV4T2YuY2FsbChLLCBrKTtcbiAgICAgICAgICBpZiAoaSA8IDApIFZbSy5wdXNoKGspIC0gMV0gPSB2O1xuICAgICAgICAgIGVsc2UgVltpXSA9IHY7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcbiAgICBQcm9taXNlID0gd2luZG93LlByb21pc2UgfHwgZnVuY3Rpb24gKGZuKSB7XG4gICAgICB2YXJcbiAgICAgICAgbm90aWZ5ID0gW10sXG4gICAgICAgIGRvbmUgPSBmYWxzZSxcbiAgICAgICAgcCA9IHtcbiAgICAgICAgICAnY2F0Y2gnOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgICB9LFxuICAgICAgICAgICd0aGVuJzogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICBub3RpZnkucHVzaChjYik7XG4gICAgICAgICAgICBpZiAoZG9uZSkgc2V0VGltZW91dChyZXNvbHZlLCAxKTtcbiAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgO1xuICAgICAgZnVuY3Rpb24gcmVzb2x2ZSh2YWx1ZSkge1xuICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgd2hpbGUgKG5vdGlmeS5sZW5ndGgpIG5vdGlmeS5zaGlmdCgpKHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIGZuKHJlc29sdmUpO1xuICAgICAgcmV0dXJuIHA7XG4gICAgfSxcbiAgICBqdXN0Q3JlYXRlZCA9IGZhbHNlLFxuICAgIGNvbnN0cnVjdG9ycyA9IERpY3QobnVsbCksXG4gICAgd2FpdGluZ0xpc3QgPSBEaWN0KG51bGwpLFxuICAgIG5vZGVOYW1lcyA9IG5ldyBNYXAoKSxcbiAgICBzZWNvbmRBcmd1bWVudCA9IFN0cmluZyxcbiAgXG4gICAgLy8gdXNlZCB0byBjcmVhdGUgdW5pcXVlIGluc3RhbmNlc1xuICAgIGNyZWF0ZSA9IE9iamVjdC5jcmVhdGUgfHwgZnVuY3Rpb24gQnJpZGdlKHByb3RvKSB7XG4gICAgICAvLyBzaWxseSBicm9rZW4gcG9seWZpbGwgcHJvYmFibHkgZXZlciB1c2VkIGJ1dCBzaG9ydCBlbm91Z2ggdG8gd29ya1xuICAgICAgcmV0dXJuIHByb3RvID8gKChCcmlkZ2UucHJvdG90eXBlID0gcHJvdG8pLCBuZXcgQnJpZGdlKCkpIDogdGhpcztcbiAgICB9LFxuICBcbiAgICAvLyB3aWxsIHNldCB0aGUgcHJvdG90eXBlIGlmIHBvc3NpYmxlXG4gICAgLy8gb3IgY29weSBvdmVyIGFsbCBwcm9wZXJ0aWVzXG4gICAgc2V0UHJvdG90eXBlID0gc1BPIHx8IChcbiAgICAgIGhhc1Byb3RvID9cbiAgICAgICAgZnVuY3Rpb24gKG8sIHApIHtcbiAgICAgICAgICBvLl9fcHJvdG9fXyA9IHA7XG4gICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgIH0gOiAoXG4gICAgICAoZ09QTiAmJiBnT1BEKSA/XG4gICAgICAgIChmdW5jdGlvbigpe1xuICAgICAgICAgIGZ1bmN0aW9uIHNldFByb3BlcnRpZXMobywgcCkge1xuICAgICAgICAgICAgZm9yICh2YXJcbiAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICBuYW1lcyA9IGdPUE4ocCksXG4gICAgICAgICAgICAgIGkgPSAwLCBsZW5ndGggPSBuYW1lcy5sZW5ndGg7XG4gICAgICAgICAgICAgIGkgPCBsZW5ndGg7IGkrK1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGtleSA9IG5hbWVzW2ldO1xuICAgICAgICAgICAgICBpZiAoIWhPUC5jYWxsKG8sIGtleSkpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eShvLCBrZXksIGdPUEQocCwga2V5KSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvLCBwKSB7XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgIHNldFByb3BlcnRpZXMobywgcCk7XG4gICAgICAgICAgICB9IHdoaWxlICgocCA9IGdQTyhwKSkgJiYgIWlQTy5jYWxsKHAsIG8pKTtcbiAgICAgICAgICAgIHJldHVybiBvO1xuICAgICAgICAgIH07XG4gICAgICAgIH0oKSkgOlxuICAgICAgICBmdW5jdGlvbiAobywgcCkge1xuICAgICAgICAgIGZvciAodmFyIGtleSBpbiBwKSB7XG4gICAgICAgICAgICBvW2tleV0gPSBwW2tleV07XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBvO1xuICAgICAgICB9XG4gICAgKSksXG4gIFxuICAgIC8vIERPTSBzaG9ydGN1dHMgYW5kIGhlbHBlcnMsIGlmIGFueVxuICBcbiAgICBNdXRhdGlvbk9ic2VydmVyID0gd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LldlYktpdE11dGF0aW9uT2JzZXJ2ZXIsXG4gIFxuICAgIEhUTUxFbGVtZW50UHJvdG90eXBlID0gKFxuICAgICAgd2luZG93LkhUTUxFbGVtZW50IHx8XG4gICAgICB3aW5kb3cuRWxlbWVudCB8fFxuICAgICAgd2luZG93Lk5vZGVcbiAgICApLnByb3RvdHlwZSxcbiAgXG4gICAgSUU4ID0gIWlQTy5jYWxsKEhUTUxFbGVtZW50UHJvdG90eXBlLCBkb2N1bWVudEVsZW1lbnQpLFxuICBcbiAgICBzYWZlUHJvcGVydHkgPSBJRTggPyBmdW5jdGlvbiAobywgaywgZCkge1xuICAgICAgb1trXSA9IGQudmFsdWU7XG4gICAgICByZXR1cm4gbztcbiAgICB9IDogZGVmaW5lUHJvcGVydHksXG4gIFxuICAgIGlzVmFsaWROb2RlID0gSUU4ID9cbiAgICAgIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSAxO1xuICAgICAgfSA6XG4gICAgICBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICByZXR1cm4gaVBPLmNhbGwoSFRNTEVsZW1lbnRQcm90b3R5cGUsIG5vZGUpO1xuICAgICAgfSxcbiAgXG4gICAgdGFyZ2V0cyA9IElFOCAmJiBbXSxcbiAgXG4gICAgYXR0YWNoU2hhZG93ID0gSFRNTEVsZW1lbnRQcm90b3R5cGUuYXR0YWNoU2hhZG93LFxuICAgIGNsb25lTm9kZSA9IEhUTUxFbGVtZW50UHJvdG90eXBlLmNsb25lTm9kZSxcbiAgICBkaXNwYXRjaEV2ZW50ID0gSFRNTEVsZW1lbnRQcm90b3R5cGUuZGlzcGF0Y2hFdmVudCxcbiAgICBnZXRBdHRyaWJ1dGUgPSBIVE1MRWxlbWVudFByb3RvdHlwZS5nZXRBdHRyaWJ1dGUsXG4gICAgaGFzQXR0cmlidXRlID0gSFRNTEVsZW1lbnRQcm90b3R5cGUuaGFzQXR0cmlidXRlLFxuICAgIHJlbW92ZUF0dHJpYnV0ZSA9IEhUTUxFbGVtZW50UHJvdG90eXBlLnJlbW92ZUF0dHJpYnV0ZSxcbiAgICBzZXRBdHRyaWJ1dGUgPSBIVE1MRWxlbWVudFByb3RvdHlwZS5zZXRBdHRyaWJ1dGUsXG4gIFxuICAgIC8vIHJlcGxhY2VkIGxhdGVyIG9uXG4gICAgY3JlYXRlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQsXG4gICAgcGF0Y2hlZENyZWF0ZUVsZW1lbnQgPSBjcmVhdGVFbGVtZW50LFxuICBcbiAgICAvLyBzaGFyZWQgb2JzZXJ2ZXIgZm9yIGFsbCBhdHRyaWJ1dGVzXG4gICAgYXR0cmlidXRlc09ic2VydmVyID0gTXV0YXRpb25PYnNlcnZlciAmJiB7XG4gICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgY2hhcmFjdGVyRGF0YTogdHJ1ZSxcbiAgICAgIGF0dHJpYnV0ZU9sZFZhbHVlOiB0cnVlXG4gICAgfSxcbiAgXG4gICAgLy8gdXNlZnVsIHRvIGRldGVjdCBvbmx5IGlmIHRoZXJlJ3Mgbm8gTXV0YXRpb25PYnNlcnZlclxuICAgIERPTUF0dHJNb2RpZmllZCA9IE11dGF0aW9uT2JzZXJ2ZXIgfHwgZnVuY3Rpb24oZSkge1xuICAgICAgZG9lc05vdFN1cHBvcnRET01BdHRyTW9kaWZpZWQgPSBmYWxzZTtcbiAgICAgIGRvY3VtZW50RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFxuICAgICAgICBET01fQVRUUl9NT0RJRklFRCxcbiAgICAgICAgRE9NQXR0ck1vZGlmaWVkXG4gICAgICApO1xuICAgIH0sXG4gIFxuICAgIC8vIHdpbGwgYm90aCBiZSB1c2VkIHRvIG1ha2UgRE9NTm9kZUluc2VydGVkIGFzeW5jaHJvbm91c1xuICAgIGFzYXBRdWV1ZSxcbiAgICBhc2FwVGltZXIgPSAwLFxuICBcbiAgICAvLyBpbnRlcm5hbCBmbGFnc1xuICAgIHNldExpc3RlbmVyID0gZmFsc2UsXG4gICAgZG9lc05vdFN1cHBvcnRET01BdHRyTW9kaWZpZWQgPSB0cnVlLFxuICAgIGRyb3BEb21Db250ZW50TG9hZGVkID0gdHJ1ZSxcbiAgXG4gICAgLy8gbmVlZGVkIGZvciB0aGUgaW5uZXJIVE1MIGhlbHBlclxuICAgIG5vdEZyb21Jbm5lckhUTUxIZWxwZXIgPSB0cnVlLFxuICBcbiAgICAvLyBvcHRpb25hbGx5IGRlZmluZWQgbGF0ZXIgb25cbiAgICBvblN1YnRyZWVNb2RpZmllZCxcbiAgICBjYWxsRE9NQXR0ck1vZGlmaWVkLFxuICAgIGdldEF0dHJpYnV0ZXNNaXJyb3IsXG4gICAgb2JzZXJ2ZXIsXG4gICAgb2JzZXJ2ZSxcbiAgXG4gICAgLy8gYmFzZWQgb24gc2V0dGluZyBwcm90b3R5cGUgY2FwYWJpbGl0eVxuICAgIC8vIHdpbGwgY2hlY2sgcHJvdG8gb3IgdGhlIGV4cGFuZG8gYXR0cmlidXRlXG4gICAgLy8gaW4gb3JkZXIgdG8gc2V0dXAgdGhlIG5vZGUgb25jZVxuICAgIHBhdGNoSWZOb3RBbHJlYWR5LFxuICAgIHBhdGNoXG4gIDtcbiAgXG4gIC8vIG9ubHkgaWYgbmVlZGVkXG4gIGlmICghKFJFR0lTVEVSX0VMRU1FTlQgaW4gZG9jdW1lbnQpKSB7XG4gIFxuICAgIGlmIChzUE8gfHwgaGFzUHJvdG8pIHtcbiAgICAgICAgcGF0Y2hJZk5vdEFscmVhZHkgPSBmdW5jdGlvbiAobm9kZSwgcHJvdG8pIHtcbiAgICAgICAgICBpZiAoIWlQTy5jYWxsKHByb3RvLCBub2RlKSkge1xuICAgICAgICAgICAgc2V0dXBOb2RlKG5vZGUsIHByb3RvKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHBhdGNoID0gc2V0dXBOb2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhdGNoSWZOb3RBbHJlYWR5ID0gZnVuY3Rpb24gKG5vZGUsIHByb3RvKSB7XG4gICAgICAgICAgaWYgKCFub2RlW0VYUEFORE9fVUlEXSkge1xuICAgICAgICAgICAgbm9kZVtFWFBBTkRPX1VJRF0gPSBPYmplY3QodHJ1ZSk7XG4gICAgICAgICAgICBzZXR1cE5vZGUobm9kZSwgcHJvdG8pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcGF0Y2ggPSBwYXRjaElmTm90QWxyZWFkeTtcbiAgICB9XG4gIFxuICAgIGlmIChJRTgpIHtcbiAgICAgIGRvZXNOb3RTdXBwb3J0RE9NQXR0ck1vZGlmaWVkID0gZmFsc2U7XG4gICAgICAoZnVuY3Rpb24gKCl7XG4gICAgICAgIHZhclxuICAgICAgICAgIGRlc2NyaXB0b3IgPSBnT1BEKEhUTUxFbGVtZW50UHJvdG90eXBlLCBBRERfRVZFTlRfTElTVEVORVIpLFxuICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXIgPSBkZXNjcmlwdG9yLnZhbHVlLFxuICAgICAgICAgIHBhdGNoZWRSZW1vdmVBdHRyaWJ1dGUgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgdmFyIGUgPSBuZXcgQ3VzdG9tRXZlbnQoRE9NX0FUVFJfTU9ESUZJRUQsIHtidWJibGVzOiB0cnVlfSk7XG4gICAgICAgICAgICBlLmF0dHJOYW1lID0gbmFtZTtcbiAgICAgICAgICAgIGUucHJldlZhbHVlID0gZ2V0QXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSk7XG4gICAgICAgICAgICBlLm5ld1ZhbHVlID0gbnVsbDtcbiAgICAgICAgICAgIGVbUkVNT1ZBTF0gPSBlLmF0dHJDaGFuZ2UgPSAyO1xuICAgICAgICAgICAgcmVtb3ZlQXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSk7XG4gICAgICAgICAgICBkaXNwYXRjaEV2ZW50LmNhbGwodGhpcywgZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBwYXRjaGVkU2V0QXR0cmlidXRlID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgaGFkID0gaGFzQXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSksXG4gICAgICAgICAgICAgIG9sZCA9IGhhZCAmJiBnZXRBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuYW1lKSxcbiAgICAgICAgICAgICAgZSA9IG5ldyBDdXN0b21FdmVudChET01fQVRUUl9NT0RJRklFRCwge2J1YmJsZXM6IHRydWV9KVxuICAgICAgICAgICAgO1xuICAgICAgICAgICAgc2V0QXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSwgdmFsdWUpO1xuICAgICAgICAgICAgZS5hdHRyTmFtZSA9IG5hbWU7XG4gICAgICAgICAgICBlLnByZXZWYWx1ZSA9IGhhZCA/IG9sZCA6IG51bGw7XG4gICAgICAgICAgICBlLm5ld1ZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICBpZiAoaGFkKSB7XG4gICAgICAgICAgICAgIGVbTU9ESUZJQ0FUSU9OXSA9IGUuYXR0ckNoYW5nZSA9IDE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBlW0FERElUSU9OXSA9IGUuYXR0ckNoYW5nZSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXNwYXRjaEV2ZW50LmNhbGwodGhpcywgZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvblByb3BlcnR5Q2hhbmdlID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIC8vIGpzaGludCBlcW51bGw6dHJ1ZVxuICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgIG5vZGUgPSBlLmN1cnJlbnRUYXJnZXQsXG4gICAgICAgICAgICAgIHN1cGVyU2VjcmV0ID0gbm9kZVtFWFBBTkRPX1VJRF0sXG4gICAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IGUucHJvcGVydHlOYW1lLFxuICAgICAgICAgICAgICBldmVudFxuICAgICAgICAgICAgO1xuICAgICAgICAgICAgaWYgKHN1cGVyU2VjcmV0Lmhhc093blByb3BlcnR5KHByb3BlcnR5TmFtZSkpIHtcbiAgICAgICAgICAgICAgc3VwZXJTZWNyZXQgPSBzdXBlclNlY3JldFtwcm9wZXJ0eU5hbWVdO1xuICAgICAgICAgICAgICBldmVudCA9IG5ldyBDdXN0b21FdmVudChET01fQVRUUl9NT0RJRklFRCwge2J1YmJsZXM6IHRydWV9KTtcbiAgICAgICAgICAgICAgZXZlbnQuYXR0ck5hbWUgPSBzdXBlclNlY3JldC5uYW1lO1xuICAgICAgICAgICAgICBldmVudC5wcmV2VmFsdWUgPSBzdXBlclNlY3JldC52YWx1ZSB8fCBudWxsO1xuICAgICAgICAgICAgICBldmVudC5uZXdWYWx1ZSA9IChzdXBlclNlY3JldC52YWx1ZSA9IG5vZGVbcHJvcGVydHlOYW1lXSB8fCBudWxsKTtcbiAgICAgICAgICAgICAgaWYgKGV2ZW50LnByZXZWYWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRbQURESVRJT05dID0gZXZlbnQuYXR0ckNoYW5nZSA9IDA7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXZlbnRbTU9ESUZJQ0FUSU9OXSA9IGV2ZW50LmF0dHJDaGFuZ2UgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGRpc3BhdGNoRXZlbnQuY2FsbChub2RlLCBldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICA7XG4gICAgICAgIGRlc2NyaXB0b3IudmFsdWUgPSBmdW5jdGlvbiAodHlwZSwgaGFuZGxlciwgY2FwdHVyZSkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGUgPT09IERPTV9BVFRSX01PRElGSUVEICYmXG4gICAgICAgICAgICB0aGlzW0FUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLXSAmJlxuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUgIT09IHBhdGNoZWRTZXRBdHRyaWJ1dGVcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXNbRVhQQU5ET19VSURdID0ge1xuICAgICAgICAgICAgICBjbGFzc05hbWU6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnY2xhc3MnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB0aGlzLmNsYXNzTmFtZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUgPSBwYXRjaGVkU2V0QXR0cmlidXRlO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUgPSBwYXRjaGVkUmVtb3ZlQXR0cmlidXRlO1xuICAgICAgICAgICAgYWRkRXZlbnRMaXN0ZW5lci5jYWxsKHRoaXMsICdwcm9wZXJ0eWNoYW5nZScsIG9uUHJvcGVydHlDaGFuZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhZGRFdmVudExpc3RlbmVyLmNhbGwodGhpcywgdHlwZSwgaGFuZGxlciwgY2FwdHVyZSk7XG4gICAgICAgIH07XG4gICAgICAgIGRlZmluZVByb3BlcnR5KEhUTUxFbGVtZW50UHJvdG90eXBlLCBBRERfRVZFTlRfTElTVEVORVIsIGRlc2NyaXB0b3IpO1xuICAgICAgfSgpKTtcbiAgICB9IGVsc2UgaWYgKCFNdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICBkb2N1bWVudEVsZW1lbnRbQUREX0VWRU5UX0xJU1RFTkVSXShET01fQVRUUl9NT0RJRklFRCwgRE9NQXR0ck1vZGlmaWVkKTtcbiAgICAgIGRvY3VtZW50RWxlbWVudC5zZXRBdHRyaWJ1dGUoRVhQQU5ET19VSUQsIDEpO1xuICAgICAgZG9jdW1lbnRFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShFWFBBTkRPX1VJRCk7XG4gICAgICBpZiAoZG9lc05vdFN1cHBvcnRET01BdHRyTW9kaWZpZWQpIHtcbiAgICAgICAgb25TdWJ0cmVlTW9kaWZpZWQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHZhclxuICAgICAgICAgICAgbm9kZSA9IHRoaXMsXG4gICAgICAgICAgICBvbGRBdHRyaWJ1dGVzLFxuICAgICAgICAgICAgbmV3QXR0cmlidXRlcyxcbiAgICAgICAgICAgIGtleVxuICAgICAgICAgIDtcbiAgICAgICAgICBpZiAobm9kZSA9PT0gZS50YXJnZXQpIHtcbiAgICAgICAgICAgIG9sZEF0dHJpYnV0ZXMgPSBub2RlW0VYUEFORE9fVUlEXTtcbiAgICAgICAgICAgIG5vZGVbRVhQQU5ET19VSURdID0gKG5ld0F0dHJpYnV0ZXMgPSBnZXRBdHRyaWJ1dGVzTWlycm9yKG5vZGUpKTtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIG5ld0F0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIG9sZEF0dHJpYnV0ZXMpKSB7XG4gICAgICAgICAgICAgICAgLy8gYXR0cmlidXRlIHdhcyBhZGRlZFxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsRE9NQXR0ck1vZGlmaWVkKFxuICAgICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgICAgICBvbGRBdHRyaWJ1dGVzW2tleV0sXG4gICAgICAgICAgICAgICAgICBuZXdBdHRyaWJ1dGVzW2tleV0sXG4gICAgICAgICAgICAgICAgICBBRERJVElPTlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAobmV3QXR0cmlidXRlc1trZXldICE9PSBvbGRBdHRyaWJ1dGVzW2tleV0pIHtcbiAgICAgICAgICAgICAgICAvLyBhdHRyaWJ1dGUgd2FzIGNoYW5nZWRcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbERPTUF0dHJNb2RpZmllZChcbiAgICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgb2xkQXR0cmlidXRlc1trZXldLFxuICAgICAgICAgICAgICAgICAgbmV3QXR0cmlidXRlc1trZXldLFxuICAgICAgICAgICAgICAgICAgTU9ESUZJQ0FUSU9OXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY2hlY2tpbmcgaWYgaXQgaGFzIGJlZW4gcmVtb3ZlZFxuICAgICAgICAgICAgZm9yIChrZXkgaW4gb2xkQXR0cmlidXRlcykge1xuICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gbmV3QXR0cmlidXRlcykpIHtcbiAgICAgICAgICAgICAgICAvLyBhdHRyaWJ1dGUgcmVtb3ZlZFxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsRE9NQXR0ck1vZGlmaWVkKFxuICAgICAgICAgICAgICAgICAgMixcbiAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgICAgICBvbGRBdHRyaWJ1dGVzW2tleV0sXG4gICAgICAgICAgICAgICAgICBuZXdBdHRyaWJ1dGVzW2tleV0sXG4gICAgICAgICAgICAgICAgICBSRU1PVkFMXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY2FsbERPTUF0dHJNb2RpZmllZCA9IGZ1bmN0aW9uIChcbiAgICAgICAgICBhdHRyQ2hhbmdlLFxuICAgICAgICAgIGN1cnJlbnRUYXJnZXQsXG4gICAgICAgICAgYXR0ck5hbWUsXG4gICAgICAgICAgcHJldlZhbHVlLFxuICAgICAgICAgIG5ld1ZhbHVlLFxuICAgICAgICAgIGFjdGlvblxuICAgICAgICApIHtcbiAgICAgICAgICB2YXIgZSA9IHtcbiAgICAgICAgICAgIGF0dHJDaGFuZ2U6IGF0dHJDaGFuZ2UsXG4gICAgICAgICAgICBjdXJyZW50VGFyZ2V0OiBjdXJyZW50VGFyZ2V0LFxuICAgICAgICAgICAgYXR0ck5hbWU6IGF0dHJOYW1lLFxuICAgICAgICAgICAgcHJldlZhbHVlOiBwcmV2VmFsdWUsXG4gICAgICAgICAgICBuZXdWYWx1ZTogbmV3VmFsdWVcbiAgICAgICAgICB9O1xuICAgICAgICAgIGVbYWN0aW9uXSA9IGF0dHJDaGFuZ2U7XG4gICAgICAgICAgb25ET01BdHRyTW9kaWZpZWQoZSk7XG4gICAgICAgIH07XG4gICAgICAgIGdldEF0dHJpYnV0ZXNNaXJyb3IgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgIGZvciAodmFyXG4gICAgICAgICAgICBhdHRyLCBuYW1lLFxuICAgICAgICAgICAgcmVzdWx0ID0ge30sXG4gICAgICAgICAgICBhdHRyaWJ1dGVzID0gbm9kZS5hdHRyaWJ1dGVzLFxuICAgICAgICAgICAgaSA9IDAsIGxlbmd0aCA9IGF0dHJpYnV0ZXMubGVuZ3RoO1xuICAgICAgICAgICAgaSA8IGxlbmd0aDsgaSsrXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBhdHRyID0gYXR0cmlidXRlc1tpXTtcbiAgICAgICAgICAgIG5hbWUgPSBhdHRyLm5hbWU7XG4gICAgICAgICAgICBpZiAobmFtZSAhPT0gJ3NldEF0dHJpYnV0ZScpIHtcbiAgICAgICAgICAgICAgcmVzdWx0W25hbWVdID0gYXR0ci52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG4gIFxuICAgIC8vIHNldCBhcyBlbnVtZXJhYmxlLCB3cml0YWJsZSBhbmQgY29uZmlndXJhYmxlXG4gICAgZG9jdW1lbnRbUkVHSVNURVJfRUxFTUVOVF0gPSBmdW5jdGlvbiByZWdpc3RlckVsZW1lbnQodHlwZSwgb3B0aW9ucykge1xuICAgICAgdXBwZXJUeXBlID0gdHlwZS50b1VwcGVyQ2FzZSgpO1xuICAgICAgaWYgKCFzZXRMaXN0ZW5lcikge1xuICAgICAgICAvLyBvbmx5IGZpcnN0IHRpbWUgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50IGlzIHVzZWRcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzZXQgdGhpcyBsaXN0ZW5lclxuICAgICAgICAvLyBzZXR0aW5nIGl0IGJ5IGRlZmF1bHQgbWlnaHQgc2xvdyBkb3duIGZvciBubyByZWFzb25cbiAgICAgICAgc2V0TGlzdGVuZXIgPSB0cnVlO1xuICAgICAgICBpZiAoTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgICAgIG9ic2VydmVyID0gKGZ1bmN0aW9uKGF0dGFjaGVkLCBkZXRhY2hlZCl7XG4gICAgICAgICAgICBmdW5jdGlvbiBjaGVja0VtQWxsKGxpc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgY2FsbGJhY2sobGlzdFtpKytdKSl7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIChyZWNvcmRzKSB7XG4gICAgICAgICAgICAgIGZvciAodmFyXG4gICAgICAgICAgICAgICAgY3VycmVudCwgbm9kZSwgbmV3VmFsdWUsXG4gICAgICAgICAgICAgICAgaSA9IDAsIGxlbmd0aCA9IHJlY29yZHMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKytcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudCA9IHJlY29yZHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQudHlwZSA9PT0gJ2NoaWxkTGlzdCcpIHtcbiAgICAgICAgICAgICAgICAgIGNoZWNrRW1BbGwoY3VycmVudC5hZGRlZE5vZGVzLCBhdHRhY2hlZCk7XG4gICAgICAgICAgICAgICAgICBjaGVja0VtQWxsKGN1cnJlbnQucmVtb3ZlZE5vZGVzLCBkZXRhY2hlZCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIG5vZGUgPSBjdXJyZW50LnRhcmdldDtcbiAgICAgICAgICAgICAgICAgIGlmIChub3RGcm9tSW5uZXJIVE1MSGVscGVyICYmXG4gICAgICAgICAgICAgICAgICAgICAgbm9kZVtBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDS10gJiZcbiAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50LmF0dHJpYnV0ZU5hbWUgIT09ICdzdHlsZScpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWUgPSBnZXRBdHRyaWJ1dGUuY2FsbChub2RlLCBjdXJyZW50LmF0dHJpYnV0ZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IGN1cnJlbnQub2xkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBub2RlW0FUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLXShcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnQuYXR0cmlidXRlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnQub2xkVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0oZXhlY3V0ZUFjdGlvbihBVFRBQ0hFRCksIGV4ZWN1dGVBY3Rpb24oREVUQUNIRUQpKSk7XG4gICAgICAgICAgb2JzZXJ2ZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICBvYnNlcnZlci5vYnNlcnZlKFxuICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgICAgIHN1YnRyZWU6IHRydWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgIH07XG4gICAgICAgICAgb2JzZXJ2ZShkb2N1bWVudCk7XG4gICAgICAgICAgaWYgKGF0dGFjaFNoYWRvdykge1xuICAgICAgICAgICAgSFRNTEVsZW1lbnRQcm90b3R5cGUuYXR0YWNoU2hhZG93ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXR1cm4gb2JzZXJ2ZShhdHRhY2hTaGFkb3cuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhc2FwUXVldWUgPSBbXTtcbiAgICAgICAgICBkb2N1bWVudFtBRERfRVZFTlRfTElTVEVORVJdKCdET01Ob2RlSW5zZXJ0ZWQnLCBvbkRPTU5vZGUoQVRUQUNIRUQpKTtcbiAgICAgICAgICBkb2N1bWVudFtBRERfRVZFTlRfTElTVEVORVJdKCdET01Ob2RlUmVtb3ZlZCcsIG9uRE9NTm9kZShERVRBQ0hFRCkpO1xuICAgICAgICB9XG4gIFxuICAgICAgICBkb2N1bWVudFtBRERfRVZFTlRfTElTVEVORVJdKERPTV9DT05URU5UX0xPQURFRCwgb25SZWFkeVN0YXRlQ2hhbmdlKTtcbiAgICAgICAgZG9jdW1lbnRbQUREX0VWRU5UX0xJU1RFTkVSXSgncmVhZHlzdGF0ZWNoYW5nZScsIG9uUmVhZHlTdGF0ZUNoYW5nZSk7XG4gIFxuICAgICAgICBIVE1MRWxlbWVudFByb3RvdHlwZS5jbG9uZU5vZGUgPSBmdW5jdGlvbiAoZGVlcCkge1xuICAgICAgICAgIHZhclxuICAgICAgICAgICAgbm9kZSA9IGNsb25lTm9kZS5jYWxsKHRoaXMsICEhZGVlcCksXG4gICAgICAgICAgICBpID0gZ2V0VHlwZUluZGV4KG5vZGUpXG4gICAgICAgICAgO1xuICAgICAgICAgIGlmICgtMSA8IGkpIHBhdGNoKG5vZGUsIHByb3Rvc1tpXSk7XG4gICAgICAgICAgaWYgKGRlZXApIGxvb3BBbmRTZXR1cChub2RlLnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpKTtcbiAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgXG4gICAgICBpZiAoLTIgPCAoXG4gICAgICAgIGluZGV4T2YuY2FsbCh0eXBlcywgUFJFRklYX0lTICsgdXBwZXJUeXBlKSArXG4gICAgICAgIGluZGV4T2YuY2FsbCh0eXBlcywgUFJFRklYX1RBRyArIHVwcGVyVHlwZSlcbiAgICAgICkpIHtcbiAgICAgICAgdGhyb3dUeXBlRXJyb3IodHlwZSk7XG4gICAgICB9XG4gIFxuICAgICAgaWYgKCF2YWxpZE5hbWUudGVzdCh1cHBlclR5cGUpIHx8IC0xIDwgaW5kZXhPZi5jYWxsKGludmFsaWROYW1lcywgdXBwZXJUeXBlKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSB0eXBlICcgKyB0eXBlICsgJyBpcyBpbnZhbGlkJyk7XG4gICAgICB9XG4gIFxuICAgICAgdmFyXG4gICAgICAgIGNvbnN0cnVjdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBleHRlbmRpbmcgP1xuICAgICAgICAgICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChub2RlTmFtZSwgdXBwZXJUeXBlKSA6XG4gICAgICAgICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5vZGVOYW1lKTtcbiAgICAgICAgfSxcbiAgICAgICAgb3B0ID0gb3B0aW9ucyB8fCBPUCxcbiAgICAgICAgZXh0ZW5kaW5nID0gaE9QLmNhbGwob3B0LCBFWFRFTkRTKSxcbiAgICAgICAgbm9kZU5hbWUgPSBleHRlbmRpbmcgPyBvcHRpb25zW0VYVEVORFNdLnRvVXBwZXJDYXNlKCkgOiB1cHBlclR5cGUsXG4gICAgICAgIHVwcGVyVHlwZSxcbiAgICAgICAgaVxuICAgICAgO1xuICBcbiAgICAgIGlmIChleHRlbmRpbmcgJiYgLTEgPCAoXG4gICAgICAgIGluZGV4T2YuY2FsbCh0eXBlcywgUFJFRklYX1RBRyArIG5vZGVOYW1lKVxuICAgICAgKSkge1xuICAgICAgICB0aHJvd1R5cGVFcnJvcihub2RlTmFtZSk7XG4gICAgICB9XG4gIFxuICAgICAgaSA9IHR5cGVzLnB1c2goKGV4dGVuZGluZyA/IFBSRUZJWF9JUyA6IFBSRUZJWF9UQUcpICsgdXBwZXJUeXBlKSAtIDE7XG4gIFxuICAgICAgcXVlcnkgPSBxdWVyeS5jb25jYXQoXG4gICAgICAgIHF1ZXJ5Lmxlbmd0aCA/ICcsJyA6ICcnLFxuICAgICAgICBleHRlbmRpbmcgPyBub2RlTmFtZSArICdbaXM9XCInICsgdHlwZS50b0xvd2VyQ2FzZSgpICsgJ1wiXScgOiBub2RlTmFtZVxuICAgICAgKTtcbiAgXG4gICAgICBjb25zdHJ1Y3Rvci5wcm90b3R5cGUgPSAoXG4gICAgICAgIHByb3Rvc1tpXSA9IGhPUC5jYWxsKG9wdCwgJ3Byb3RvdHlwZScpID9cbiAgICAgICAgICBvcHQucHJvdG90eXBlIDpcbiAgICAgICAgICBjcmVhdGUoSFRNTEVsZW1lbnRQcm90b3R5cGUpXG4gICAgICApO1xuICBcbiAgICAgIGxvb3BBbmRWZXJpZnkoXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpLFxuICAgICAgICBBVFRBQ0hFRFxuICAgICAgKTtcbiAgXG4gICAgICByZXR1cm4gY29uc3RydWN0b3I7XG4gICAgfTtcbiAgXG4gICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCA9IChwYXRjaGVkQ3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uIChsb2NhbE5hbWUsIHR5cGVFeHRlbnNpb24pIHtcbiAgICAgIHZhclxuICAgICAgICBpcyA9IGdldElzKHR5cGVFeHRlbnNpb24pLFxuICAgICAgICBub2RlID0gaXMgP1xuICAgICAgICAgIGNyZWF0ZUVsZW1lbnQuY2FsbChkb2N1bWVudCwgbG9jYWxOYW1lLCBzZWNvbmRBcmd1bWVudChpcykpIDpcbiAgICAgICAgICBjcmVhdGVFbGVtZW50LmNhbGwoZG9jdW1lbnQsIGxvY2FsTmFtZSksXG4gICAgICAgIG5hbWUgPSAnJyArIGxvY2FsTmFtZSxcbiAgICAgICAgaSA9IGluZGV4T2YuY2FsbChcbiAgICAgICAgICB0eXBlcyxcbiAgICAgICAgICAoaXMgPyBQUkVGSVhfSVMgOiBQUkVGSVhfVEFHKSArXG4gICAgICAgICAgKGlzIHx8IG5hbWUpLnRvVXBwZXJDYXNlKClcbiAgICAgICAgKSxcbiAgICAgICAgc2V0dXAgPSAtMSA8IGlcbiAgICAgIDtcbiAgICAgIGlmIChpcykge1xuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZSgnaXMnLCBpcyA9IGlzLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICBpZiAoc2V0dXApIHtcbiAgICAgICAgICBzZXR1cCA9IGlzSW5RU0EobmFtZS50b1VwcGVyQ2FzZSgpLCBpcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG5vdEZyb21Jbm5lckhUTUxIZWxwZXIgPSAhZG9jdW1lbnQuY3JlYXRlRWxlbWVudC5pbm5lckhUTUxIZWxwZXI7XG4gICAgICBpZiAoc2V0dXApIHBhdGNoKG5vZGUsIHByb3Rvc1tpXSk7XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9KTtcbiAgXG4gIH1cbiAgXG4gIGZ1bmN0aW9uIEFTQVAoKSB7XG4gICAgdmFyIHF1ZXVlID0gYXNhcFF1ZXVlLnNwbGljZSgwLCBhc2FwUXVldWUubGVuZ3RoKTtcbiAgICBhc2FwVGltZXIgPSAwO1xuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgIHF1ZXVlLnNoaWZ0KCkuY2FsbChcbiAgICAgICAgbnVsbCwgcXVldWUuc2hpZnQoKVxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGxvb3BBbmRWZXJpZnkobGlzdCwgYWN0aW9uKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZlcmlmeUFuZFNldHVwQW5kQWN0aW9uKGxpc3RbaV0sIGFjdGlvbik7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBsb29wQW5kU2V0dXAobGlzdCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aCwgbm9kZTsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBub2RlID0gbGlzdFtpXTtcbiAgICAgIHBhdGNoKG5vZGUsIHByb3Rvc1tnZXRUeXBlSW5kZXgobm9kZSldKTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGV4ZWN1dGVBY3Rpb24oYWN0aW9uKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICBpZiAoaXNWYWxpZE5vZGUobm9kZSkpIHtcbiAgICAgICAgdmVyaWZ5QW5kU2V0dXBBbmRBY3Rpb24obm9kZSwgYWN0aW9uKTtcbiAgICAgICAgbG9vcEFuZFZlcmlmeShcbiAgICAgICAgICBub2RlLnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpLFxuICAgICAgICAgIGFjdGlvblxuICAgICAgICApO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGdldFR5cGVJbmRleCh0YXJnZXQpIHtcbiAgICB2YXJcbiAgICAgIGlzID0gZ2V0QXR0cmlidXRlLmNhbGwodGFyZ2V0LCAnaXMnKSxcbiAgICAgIG5vZGVOYW1lID0gdGFyZ2V0Lm5vZGVOYW1lLnRvVXBwZXJDYXNlKCksXG4gICAgICBpID0gaW5kZXhPZi5jYWxsKFxuICAgICAgICB0eXBlcyxcbiAgICAgICAgaXMgP1xuICAgICAgICAgICAgUFJFRklYX0lTICsgaXMudG9VcHBlckNhc2UoKSA6XG4gICAgICAgICAgICBQUkVGSVhfVEFHICsgbm9kZU5hbWVcbiAgICAgIClcbiAgICA7XG4gICAgcmV0dXJuIGlzICYmIC0xIDwgaSAmJiAhaXNJblFTQShub2RlTmFtZSwgaXMpID8gLTEgOiBpO1xuICB9XG4gIFxuICBmdW5jdGlvbiBpc0luUVNBKG5hbWUsIHR5cGUpIHtcbiAgICByZXR1cm4gLTEgPCBxdWVyeS5pbmRleE9mKG5hbWUgKyAnW2lzPVwiJyArIHR5cGUgKyAnXCJdJyk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIG9uRE9NQXR0ck1vZGlmaWVkKGUpIHtcbiAgICB2YXJcbiAgICAgIG5vZGUgPSBlLmN1cnJlbnRUYXJnZXQsXG4gICAgICBhdHRyQ2hhbmdlID0gZS5hdHRyQ2hhbmdlLFxuICAgICAgYXR0ck5hbWUgPSBlLmF0dHJOYW1lLFxuICAgICAgdGFyZ2V0ID0gZS50YXJnZXQsXG4gICAgICBhZGRpdGlvbiA9IGVbQURESVRJT05dIHx8IDIsXG4gICAgICByZW1vdmFsID0gZVtSRU1PVkFMXSB8fCAzXG4gICAgO1xuICAgIGlmIChub3RGcm9tSW5uZXJIVE1MSGVscGVyICYmXG4gICAgICAgICghdGFyZ2V0IHx8IHRhcmdldCA9PT0gbm9kZSkgJiZcbiAgICAgICAgbm9kZVtBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDS10gJiZcbiAgICAgICAgYXR0ck5hbWUgIT09ICdzdHlsZScgJiYgKFxuICAgICAgICAgIGUucHJldlZhbHVlICE9PSBlLm5ld1ZhbHVlIHx8XG4gICAgICAgICAgLy8gSUU5LCBJRTEwLCBhbmQgT3BlcmEgMTIgZ290Y2hhXG4gICAgICAgICAgZS5uZXdWYWx1ZSA9PT0gJycgJiYgKFxuICAgICAgICAgICAgYXR0ckNoYW5nZSA9PT0gYWRkaXRpb24gfHxcbiAgICAgICAgICAgIGF0dHJDaGFuZ2UgPT09IHJlbW92YWxcbiAgICAgICAgICApXG4gICAgKSkge1xuICAgICAgbm9kZVtBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDS10oXG4gICAgICAgIGF0dHJOYW1lLFxuICAgICAgICBhdHRyQ2hhbmdlID09PSBhZGRpdGlvbiA/IG51bGwgOiBlLnByZXZWYWx1ZSxcbiAgICAgICAgYXR0ckNoYW5nZSA9PT0gcmVtb3ZhbCA/IG51bGwgOiBlLm5ld1ZhbHVlXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gb25ET01Ob2RlKGFjdGlvbikge1xuICAgIHZhciBleGVjdXRvciA9IGV4ZWN1dGVBY3Rpb24oYWN0aW9uKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGUpIHtcbiAgICAgIGFzYXBRdWV1ZS5wdXNoKGV4ZWN1dG9yLCBlLnRhcmdldCk7XG4gICAgICBpZiAoYXNhcFRpbWVyKSBjbGVhclRpbWVvdXQoYXNhcFRpbWVyKTtcbiAgICAgIGFzYXBUaW1lciA9IHNldFRpbWVvdXQoQVNBUCwgMSk7XG4gICAgfTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gb25SZWFkeVN0YXRlQ2hhbmdlKGUpIHtcbiAgICBpZiAoZHJvcERvbUNvbnRlbnRMb2FkZWQpIHtcbiAgICAgIGRyb3BEb21Db250ZW50TG9hZGVkID0gZmFsc2U7XG4gICAgICBlLmN1cnJlbnRUYXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihET01fQ09OVEVOVF9MT0FERUQsIG9uUmVhZHlTdGF0ZUNoYW5nZSk7XG4gICAgfVxuICAgIGxvb3BBbmRWZXJpZnkoXG4gICAgICAoZS50YXJnZXQgfHwgZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpLFxuICAgICAgZS5kZXRhaWwgPT09IERFVEFDSEVEID8gREVUQUNIRUQgOiBBVFRBQ0hFRFxuICAgICk7XG4gICAgaWYgKElFOCkgcHVyZ2UoKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gcGF0Y2hlZFNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSkge1xuICAgIC8vIGpzaGludCB2YWxpZHRoaXM6dHJ1ZVxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBzZXRBdHRyaWJ1dGUuY2FsbChzZWxmLCBuYW1lLCB2YWx1ZSk7XG4gICAgb25TdWJ0cmVlTW9kaWZpZWQuY2FsbChzZWxmLCB7dGFyZ2V0OiBzZWxmfSk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHNldHVwTm9kZShub2RlLCBwcm90bykge1xuICAgIHNldFByb3RvdHlwZShub2RlLCBwcm90byk7XG4gICAgaWYgKG9ic2VydmVyKSB7XG4gICAgICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIGF0dHJpYnV0ZXNPYnNlcnZlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChkb2VzTm90U3VwcG9ydERPTUF0dHJNb2RpZmllZCkge1xuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZSA9IHBhdGNoZWRTZXRBdHRyaWJ1dGU7XG4gICAgICAgIG5vZGVbRVhQQU5ET19VSURdID0gZ2V0QXR0cmlidXRlc01pcnJvcihub2RlKTtcbiAgICAgICAgbm9kZVtBRERfRVZFTlRfTElTVEVORVJdKERPTV9TVUJUUkVFX01PRElGSUVELCBvblN1YnRyZWVNb2RpZmllZCk7XG4gICAgICB9XG4gICAgICBub2RlW0FERF9FVkVOVF9MSVNURU5FUl0oRE9NX0FUVFJfTU9ESUZJRUQsIG9uRE9NQXR0ck1vZGlmaWVkKTtcbiAgICB9XG4gICAgaWYgKG5vZGVbQ1JFQVRFRF9DQUxMQkFDS10gJiYgbm90RnJvbUlubmVySFRNTEhlbHBlcikge1xuICAgICAgbm9kZS5jcmVhdGVkID0gdHJ1ZTtcbiAgICAgIG5vZGVbQ1JFQVRFRF9DQUxMQkFDS10oKTtcbiAgICAgIG5vZGUuY3JlYXRlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gcHVyZ2UoKSB7XG4gICAgZm9yICh2YXJcbiAgICAgIG5vZGUsXG4gICAgICBpID0gMCxcbiAgICAgIGxlbmd0aCA9IHRhcmdldHMubGVuZ3RoO1xuICAgICAgaSA8IGxlbmd0aDsgaSsrXG4gICAgKSB7XG4gICAgICBub2RlID0gdGFyZ2V0c1tpXTtcbiAgICAgIGlmICghZG9jdW1lbnRFbGVtZW50LmNvbnRhaW5zKG5vZGUpKSB7XG4gICAgICAgIGxlbmd0aC0tO1xuICAgICAgICB0YXJnZXRzLnNwbGljZShpLS0sIDEpO1xuICAgICAgICB2ZXJpZnlBbmRTZXR1cEFuZEFjdGlvbihub2RlLCBERVRBQ0hFRCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiB0aHJvd1R5cGVFcnJvcih0eXBlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBICcgKyB0eXBlICsgJyB0eXBlIGlzIGFscmVhZHkgcmVnaXN0ZXJlZCcpO1xuICB9XG4gIFxuICBmdW5jdGlvbiB2ZXJpZnlBbmRTZXR1cEFuZEFjdGlvbihub2RlLCBhY3Rpb24pIHtcbiAgICB2YXJcbiAgICAgIGZuLFxuICAgICAgaSA9IGdldFR5cGVJbmRleChub2RlKVxuICAgIDtcbiAgICBpZiAoLTEgPCBpKSB7XG4gICAgICBwYXRjaElmTm90QWxyZWFkeShub2RlLCBwcm90b3NbaV0pO1xuICAgICAgaSA9IDA7XG4gICAgICBpZiAoYWN0aW9uID09PSBBVFRBQ0hFRCAmJiAhbm9kZVtBVFRBQ0hFRF0pIHtcbiAgICAgICAgbm9kZVtERVRBQ0hFRF0gPSBmYWxzZTtcbiAgICAgICAgbm9kZVtBVFRBQ0hFRF0gPSB0cnVlO1xuICAgICAgICBpID0gMTtcbiAgICAgICAgaWYgKElFOCAmJiBpbmRleE9mLmNhbGwodGFyZ2V0cywgbm9kZSkgPCAwKSB7XG4gICAgICAgICAgdGFyZ2V0cy5wdXNoKG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gREVUQUNIRUQgJiYgIW5vZGVbREVUQUNIRURdKSB7XG4gICAgICAgIG5vZGVbQVRUQUNIRURdID0gZmFsc2U7XG4gICAgICAgIG5vZGVbREVUQUNIRURdID0gdHJ1ZTtcbiAgICAgICAgaSA9IDE7XG4gICAgICB9XG4gICAgICBpZiAoaSAmJiAoZm4gPSBub2RlW2FjdGlvbiArIENBTExCQUNLXSkpIGZuLmNhbGwobm9kZSk7XG4gICAgfVxuICB9XG4gIFxuICBcbiAgXG4gIC8vIFYxIGluIGRhIEhvdXNlIVxuICBmdW5jdGlvbiBDdXN0b21FbGVtZW50UmVnaXN0cnkoKSB7fVxuICBcbiAgQ3VzdG9tRWxlbWVudFJlZ2lzdHJ5LnByb3RvdHlwZSA9IHtcbiAgICBjb25zdHJ1Y3RvcjogQ3VzdG9tRWxlbWVudFJlZ2lzdHJ5LFxuICAgIC8vIGEgd29ya2Fyb3VuZCBmb3IgdGhlIHN0dWJib3JuIFdlYktpdFxuICAgIGRlZmluZTogdXNhYmxlQ3VzdG9tRWxlbWVudHMgP1xuICAgICAgZnVuY3Rpb24gKG5hbWUsIENsYXNzLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgQ0VSRGVmaW5lKG5hbWUsIENsYXNzLCBvcHRpb25zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgTkFNRSA9IG5hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICBjb25zdHJ1Y3RvcnNbTkFNRV0gPSB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcjogQ2xhc3MsXG4gICAgICAgICAgICBjcmVhdGU6IFtOQU1FXVxuICAgICAgICAgIH07XG4gICAgICAgICAgbm9kZU5hbWVzLnNldChDbGFzcywgTkFNRSk7XG4gICAgICAgICAgY3VzdG9tRWxlbWVudHMuZGVmaW5lKG5hbWUsIENsYXNzKTtcbiAgICAgICAgfVxuICAgICAgfSA6XG4gICAgICBDRVJEZWZpbmUsXG4gICAgZ2V0OiB1c2FibGVDdXN0b21FbGVtZW50cyA/XG4gICAgICBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICByZXR1cm4gY3VzdG9tRWxlbWVudHMuZ2V0KG5hbWUpIHx8IGdldChuYW1lKTtcbiAgICAgIH0gOlxuICAgICAgZ2V0LFxuICAgIHdoZW5EZWZpbmVkOiB1c2FibGVDdXN0b21FbGVtZW50cyA/XG4gICAgICBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICBjdXN0b21FbGVtZW50cy53aGVuRGVmaW5lZChuYW1lKSxcbiAgICAgICAgICB3aGVuRGVmaW5lZChuYW1lKVxuICAgICAgICBdKTtcbiAgICAgIH0gOlxuICAgICAgd2hlbkRlZmluZWRcbiAgfTtcbiAgXG4gIGZ1bmN0aW9uIENFUkRlZmluZShuYW1lLCBDbGFzcywgb3B0aW9ucykge1xuICAgIHZhclxuICAgICAgaXMgPSBvcHRpb25zICYmIG9wdGlvbnNbRVhURU5EU10gfHwgJycsXG4gICAgICBDUHJvdG8gPSBDbGFzcy5wcm90b3R5cGUsXG4gICAgICBwcm90byA9IGNyZWF0ZShDUHJvdG8pLFxuICAgICAgYXR0cmlidXRlcyA9IENsYXNzLm9ic2VydmVkQXR0cmlidXRlcyB8fCBlbXB0eSxcbiAgICAgIGRlZmluaXRpb24gPSB7cHJvdG90eXBlOiBwcm90b31cbiAgICA7XG4gICAgLy8gVE9ETzogaXMgdGhpcyBuZWVkZWQgYXQgYWxsIHNpbmNlIGl0J3MgaW5oZXJpdGVkP1xuICAgIC8vIGRlZmluZVByb3BlcnR5KHByb3RvLCAnY29uc3RydWN0b3InLCB7dmFsdWU6IENsYXNzfSk7XG4gICAgc2FmZVByb3BlcnR5KHByb3RvLCBDUkVBVEVEX0NBTExCQUNLLCB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWYgKGp1c3RDcmVhdGVkKSBqdXN0Q3JlYXRlZCA9IGZhbHNlO1xuICAgICAgICAgIGVsc2UgaWYgKCF0aGlzW0RSRUNFVjFdKSB7XG4gICAgICAgICAgICB0aGlzW0RSRUNFVjFdID0gdHJ1ZTtcbiAgICAgICAgICAgIG5ldyBDbGFzcyh0aGlzKTtcbiAgICAgICAgICAgIGlmIChDUHJvdG9bQ1JFQVRFRF9DQUxMQkFDS10pXG4gICAgICAgICAgICAgIENQcm90b1tDUkVBVEVEX0NBTExCQUNLXS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGluZm8gPSBjb25zdHJ1Y3RvcnNbbm9kZU5hbWVzLmdldChDbGFzcyldO1xuICAgICAgICAgICAgaWYgKCF1c2FibGVDdXN0b21FbGVtZW50cyB8fCBpbmZvLmNyZWF0ZS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgIG5vdGlmeUF0dHJpYnV0ZXModGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHNhZmVQcm9wZXJ0eShwcm90bywgQVRUUklCVVRFX0NIQU5HRURfQ0FMTEJBQ0ssIHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICBpZiAoLTEgPCBpbmRleE9mLmNhbGwoYXR0cmlidXRlcywgbmFtZSkpXG4gICAgICAgICAgQ1Byb3RvW0FUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChDUHJvdG9bQ09OTkVDVEVEX0NBTExCQUNLXSkge1xuICAgICAgc2FmZVByb3BlcnR5KHByb3RvLCBBVFRBQ0hFRF9DQUxMQkFDSywge1xuICAgICAgICB2YWx1ZTogQ1Byb3RvW0NPTk5FQ1RFRF9DQUxMQkFDS11cbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoQ1Byb3RvW0RJU0NPTk5FQ1RFRF9DQUxMQkFDS10pIHtcbiAgICAgIHNhZmVQcm9wZXJ0eShwcm90bywgREVUQUNIRURfQ0FMTEJBQ0ssIHtcbiAgICAgICAgdmFsdWU6IENQcm90b1tESVNDT05ORUNURURfQ0FMTEJBQ0tdXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGlzKSBkZWZpbml0aW9uW0VYVEVORFNdID0gaXM7XG4gICAgbmFtZSA9IG5hbWUudG9VcHBlckNhc2UoKTtcbiAgICBjb25zdHJ1Y3RvcnNbbmFtZV0gPSB7XG4gICAgICBjb25zdHJ1Y3RvcjogQ2xhc3MsXG4gICAgICBjcmVhdGU6IGlzID8gW2lzLCBzZWNvbmRBcmd1bWVudChuYW1lKV0gOiBbbmFtZV1cbiAgICB9O1xuICAgIG5vZGVOYW1lcy5zZXQoQ2xhc3MsIG5hbWUpO1xuICAgIGRvY3VtZW50W1JFR0lTVEVSX0VMRU1FTlRdKG5hbWUudG9Mb3dlckNhc2UoKSwgZGVmaW5pdGlvbik7XG4gICAgd2hlbkRlZmluZWQobmFtZSk7XG4gICAgd2FpdGluZ0xpc3RbbmFtZV0ucigpO1xuICB9XG4gIFxuICBmdW5jdGlvbiBnZXQobmFtZSkge1xuICAgIHZhciBpbmZvID0gY29uc3RydWN0b3JzW25hbWUudG9VcHBlckNhc2UoKV07XG4gICAgcmV0dXJuIGluZm8gJiYgaW5mby5jb25zdHJ1Y3RvcjtcbiAgfVxuICBcbiAgZnVuY3Rpb24gZ2V0SXMob3B0aW9ucykge1xuICAgIHJldHVybiB0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycgP1xuICAgICAgICBvcHRpb25zIDogKG9wdGlvbnMgJiYgb3B0aW9ucy5pcyB8fCAnJyk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIG5vdGlmeUF0dHJpYnV0ZXMoc2VsZikge1xuICAgIHZhclxuICAgICAgY2FsbGJhY2sgPSBzZWxmW0FUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLXSxcbiAgICAgIGF0dHJpYnV0ZXMgPSBjYWxsYmFjayA/IHNlbGYuYXR0cmlidXRlcyA6IGVtcHR5LFxuICAgICAgaSA9IGF0dHJpYnV0ZXMubGVuZ3RoLFxuICAgICAgYXR0cmlidXRlXG4gICAgO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGF0dHJpYnV0ZSA9ICBhdHRyaWJ1dGVzW2ldOyAvLyB8fCBhdHRyaWJ1dGVzLml0ZW0oaSk7XG4gICAgICBjYWxsYmFjay5jYWxsKFxuICAgICAgICBzZWxmLFxuICAgICAgICBhdHRyaWJ1dGUubmFtZSB8fCBhdHRyaWJ1dGUubm9kZU5hbWUsXG4gICAgICAgIG51bGwsXG4gICAgICAgIGF0dHJpYnV0ZS52YWx1ZSB8fCBhdHRyaWJ1dGUubm9kZVZhbHVlXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gd2hlbkRlZmluZWQobmFtZSkge1xuICAgIG5hbWUgPSBuYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgaWYgKCEobmFtZSBpbiB3YWl0aW5nTGlzdCkpIHtcbiAgICAgIHdhaXRpbmdMaXN0W25hbWVdID0ge307XG4gICAgICB3YWl0aW5nTGlzdFtuYW1lXS5wID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgd2FpdGluZ0xpc3RbbmFtZV0uciA9IHJlc29sdmU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHdhaXRpbmdMaXN0W25hbWVdLnA7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHBvbHlmaWxsVjEoKSB7XG4gICAgaWYgKGN1c3RvbUVsZW1lbnRzKSBkZWxldGUgd2luZG93LmN1c3RvbUVsZW1lbnRzO1xuICAgIGRlZmluZVByb3BlcnR5KHdpbmRvdywgJ2N1c3RvbUVsZW1lbnRzJywge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IG5ldyBDdXN0b21FbGVtZW50UmVnaXN0cnkoKVxuICAgIH0pO1xuICAgIGRlZmluZVByb3BlcnR5KHdpbmRvdywgJ0N1c3RvbUVsZW1lbnRSZWdpc3RyeScsIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBDdXN0b21FbGVtZW50UmVnaXN0cnlcbiAgICB9KTtcbiAgICBmb3IgKHZhclxuICAgICAgcGF0Y2hDbGFzcyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHZhciBDbGFzcyA9IHdpbmRvd1tuYW1lXTtcbiAgICAgICAgaWYgKENsYXNzKSB7XG4gICAgICAgICAgd2luZG93W25hbWVdID0gZnVuY3Rpb24gQ3VzdG9tRWxlbWVudHNWMShzZWxmKSB7XG4gICAgICAgICAgICB2YXIgaW5mbywgaXNOYXRpdmU7XG4gICAgICAgICAgICBpZiAoIXNlbGYpIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgaWYgKCFzZWxmW0RSRUNFVjFdKSB7XG4gICAgICAgICAgICAgIGp1c3RDcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgaW5mbyA9IGNvbnN0cnVjdG9yc1tub2RlTmFtZXMuZ2V0KHNlbGYuY29uc3RydWN0b3IpXTtcbiAgICAgICAgICAgICAgaXNOYXRpdmUgPSB1c2FibGVDdXN0b21FbGVtZW50cyAmJiBpbmZvLmNyZWF0ZS5sZW5ndGggPT09IDE7XG4gICAgICAgICAgICAgIHNlbGYgPSBpc05hdGl2ZSA/XG4gICAgICAgICAgICAgICAgUmVmbGVjdC5jb25zdHJ1Y3QoQ2xhc3MsIGVtcHR5LCBpbmZvLmNvbnN0cnVjdG9yKSA6XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudC5hcHBseShkb2N1bWVudCwgaW5mby5jcmVhdGUpO1xuICAgICAgICAgICAgICBzZWxmW0RSRUNFVjFdID0gdHJ1ZTtcbiAgICAgICAgICAgICAganVzdENyZWF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgaWYgKCFpc05hdGl2ZSkgbm90aWZ5QXR0cmlidXRlcyhzZWxmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgIH07XG4gICAgICAgICAgd2luZG93W25hbWVdLnByb3RvdHlwZSA9IENsYXNzLnByb3RvdHlwZTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgQ2xhc3MucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gd2luZG93W25hbWVdO1xuICAgICAgICAgIH0gY2F0Y2goV2ViS2l0KSB7XG4gICAgICAgICAgICBmaXhHZXRDbGFzcyA9IHRydWU7XG4gICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eShDbGFzcywgRFJFQ0VWMSwge3ZhbHVlOiB3aW5kb3dbbmFtZV19KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBDbGFzc2VzID0gaHRtbENsYXNzLmdldCgvXkhUTUxbQS1aXSpbYS16XS8pLFxuICAgICAgaSA9IENsYXNzZXMubGVuZ3RoO1xuICAgICAgaS0tO1xuICAgICAgcGF0Y2hDbGFzcyhDbGFzc2VzW2ldKVxuICAgICkge31cbiAgICAoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uIChuYW1lLCBvcHRpb25zKSB7XG4gICAgICB2YXIgaXMgPSBnZXRJcyhvcHRpb25zKTtcbiAgICAgIHJldHVybiBpcyA/XG4gICAgICAgIHBhdGNoZWRDcmVhdGVFbGVtZW50LmNhbGwodGhpcywgbmFtZSwgc2Vjb25kQXJndW1lbnQoaXMpKSA6XG4gICAgICAgIHBhdGNoZWRDcmVhdGVFbGVtZW50LmNhbGwodGhpcywgbmFtZSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8vIGlmIGN1c3RvbUVsZW1lbnRzIGlzIG5vdCB0aGVyZSBhdCBhbGxcbiAgaWYgKCFjdXN0b21FbGVtZW50cyB8fCBwb2x5ZmlsbCA9PT0gJ2ZvcmNlJykgcG9seWZpbGxWMSgpO1xuICBlbHNlIHtcbiAgICAvLyBpZiBhdmFpbGFibGUgdGVzdCBleHRlbmRzIHdvcmsgYXMgZXhwZWN0ZWRcbiAgICB0cnkge1xuICAgICAgKGZ1bmN0aW9uIChEUkUsIG9wdGlvbnMsIG5hbWUpIHtcbiAgICAgICAgb3B0aW9uc1tFWFRFTkRTXSA9ICdhJztcbiAgICAgICAgRFJFLnByb3RvdHlwZSA9IGNyZWF0ZShIVE1MQW5jaG9yRWxlbWVudC5wcm90b3R5cGUpO1xuICAgICAgICBEUkUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRFJFO1xuICAgICAgICB3aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKG5hbWUsIERSRSwgb3B0aW9ucyk7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBnZXRBdHRyaWJ1dGUuY2FsbChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJywge2lzOiBuYW1lfSksICdpcycpICE9PSBuYW1lIHx8XG4gICAgICAgICAgKHVzYWJsZUN1c3RvbUVsZW1lbnRzICYmIGdldEF0dHJpYnV0ZS5jYWxsKG5ldyBEUkUoKSwgJ2lzJykgIT09IG5hbWUpXG4gICAgICAgICkge1xuICAgICAgICAgIHRocm93IG9wdGlvbnM7XG4gICAgICAgIH1cbiAgICAgIH0oXG4gICAgICAgIGZ1bmN0aW9uIERSRSgpIHtcbiAgICAgICAgICByZXR1cm4gUmVmbGVjdC5jb25zdHJ1Y3QoSFRNTEFuY2hvckVsZW1lbnQsIFtdLCBEUkUpO1xuICAgICAgICB9LFxuICAgICAgICB7fSxcbiAgICAgICAgJ2RvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQtYSdcbiAgICAgICkpO1xuICAgIH0gY2F0Y2gob19PKSB7XG4gICAgICAvLyBvciBmb3JjZSB0aGUgcG9seWZpbGwgaWYgbm90XG4gICAgICAvLyBhbmQga2VlcCBpbnRlcm5hbCBvcmlnaW5hbCByZWZlcmVuY2VcbiAgICAgIHBvbHlmaWxsVjEoKTtcbiAgICB9XG4gIH1cbiAgXG4gIHRyeSB7XG4gICAgY3JlYXRlRWxlbWVudC5jYWxsKGRvY3VtZW50LCAnYScsICdhJyk7XG4gIH0gY2F0Y2goRmlyZUZveCkge1xuICAgIHNlY29uZEFyZ3VtZW50ID0gZnVuY3Rpb24gKGlzKSB7XG4gICAgICByZXR1cm4ge2lzOiBpc307XG4gICAgfTtcbiAgfVxuICBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpbnN0YWxsQ3VzdG9tRWxlbWVudHM7XG5pbnN0YWxsQ3VzdG9tRWxlbWVudHMoZ2xvYmFsKTtcbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSwgbm9kZTp0cnVlKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlbGVnYXRlO1xuXG4vKipcbiAqIERPTSBldmVudCBkZWxlZ2F0b3JcbiAqXG4gKiBUaGUgZGVsZWdhdG9yIHdpbGwgbGlzdGVuXG4gKiBmb3IgZXZlbnRzIHRoYXQgYnViYmxlIHVwXG4gKiB0byB0aGUgcm9vdCBub2RlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtOb2RlfHN0cmluZ30gW3Jvb3RdIFRoZSByb290IG5vZGUgb3IgYSBzZWxlY3RvciBzdHJpbmcgbWF0Y2hpbmcgdGhlIHJvb3Qgbm9kZVxuICovXG5mdW5jdGlvbiBEZWxlZ2F0ZShyb290KSB7XG5cbiAgLyoqXG4gICAqIE1haW50YWluIGEgbWFwIG9mIGxpc3RlbmVyXG4gICAqIGxpc3RzLCBrZXllZCBieSBldmVudCBuYW1lLlxuICAgKlxuICAgKiBAdHlwZSBPYmplY3RcbiAgICovXG4gIHRoaXMubGlzdGVuZXJNYXAgPSBbe30sIHt9XTtcbiAgaWYgKHJvb3QpIHtcbiAgICB0aGlzLnJvb3Qocm9vdCk7XG4gIH1cblxuICAvKiogQHR5cGUgZnVuY3Rpb24oKSAqL1xuICB0aGlzLmhhbmRsZSA9IERlbGVnYXRlLnByb3RvdHlwZS5oYW5kbGUuYmluZCh0aGlzKTtcbn1cblxuLyoqXG4gKiBTdGFydCBsaXN0ZW5pbmcgZm9yIGV2ZW50c1xuICogb24gdGhlIHByb3ZpZGVkIERPTSBlbGVtZW50XG4gKlxuICogQHBhcmFtICB7Tm9kZXxzdHJpbmd9IFtyb290XSBUaGUgcm9vdCBub2RlIG9yIGEgc2VsZWN0b3Igc3RyaW5nIG1hdGNoaW5nIHRoZSByb290IG5vZGVcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5yb290ID0gZnVuY3Rpb24ocm9vdCkge1xuICB2YXIgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwO1xuICB2YXIgZXZlbnRUeXBlO1xuXG4gIC8vIFJlbW92ZSBtYXN0ZXIgZXZlbnQgbGlzdGVuZXJzXG4gIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMV0pIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcFsxXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMF0pIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcFswXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgbm8gcm9vdCBvciByb290IGlzIG5vdFxuICAvLyBhIGRvbSBub2RlLCB0aGVuIHJlbW92ZSBpbnRlcm5hbFxuICAvLyByb290IHJlZmVyZW5jZSBhbmQgZXhpdCBoZXJlXG4gIGlmICghcm9vdCB8fCAhcm9vdC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgaWYgKHRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnJvb3RFbGVtZW50O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcm9vdCBub2RlIGF0IHdoaWNoXG4gICAqIGxpc3RlbmVycyBhcmUgYXR0YWNoZWQuXG4gICAqXG4gICAqIEB0eXBlIE5vZGVcbiAgICovXG4gIHRoaXMucm9vdEVsZW1lbnQgPSByb290O1xuXG4gIC8vIFNldCB1cCBtYXN0ZXIgZXZlbnQgbGlzdGVuZXJzXG4gIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzFdKSB7XG4gICAgaWYgKGxpc3RlbmVyTWFwWzFdLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB0cnVlKTtcbiAgICB9XG4gIH1cbiAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMF0pIHtcbiAgICBpZiAobGlzdGVuZXJNYXBbMF0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgdGhpcy5yb290RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZVxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuY2FwdHVyZUZvclR5cGUgPSBmdW5jdGlvbihldmVudFR5cGUpIHtcbiAgcmV0dXJuIFsnYmx1cicsICdlcnJvcicsICdmb2N1cycsICdsb2FkJywgJ3Jlc2l6ZScsICdzY3JvbGwnXS5pbmRleE9mKGV2ZW50VHlwZSkgIT09IC0xO1xufTtcblxuLyoqXG4gKiBBdHRhY2ggYSBoYW5kbGVyIHRvIG9uZVxuICogZXZlbnQgZm9yIGFsbCBlbGVtZW50c1xuICogdGhhdCBtYXRjaCB0aGUgc2VsZWN0b3IsXG4gKiBub3cgb3IgaW4gdGhlIGZ1dHVyZVxuICpcbiAqIFRoZSBoYW5kbGVyIGZ1bmN0aW9uIHJlY2VpdmVzXG4gKiB0aHJlZSBhcmd1bWVudHM6IHRoZSBET00gZXZlbnRcbiAqIG9iamVjdCwgdGhlIG5vZGUgdGhhdCBtYXRjaGVkXG4gKiB0aGUgc2VsZWN0b3Igd2hpbGUgdGhlIGV2ZW50XG4gKiB3YXMgYnViYmxpbmcgYW5kIGEgcmVmZXJlbmNlXG4gKiB0byBpdHNlbGYuIFdpdGhpbiB0aGUgaGFuZGxlcixcbiAqICd0aGlzJyBpcyBlcXVhbCB0byB0aGUgc2Vjb25kXG4gKiBhcmd1bWVudC5cbiAqXG4gKiBUaGUgbm9kZSB0aGF0IGFjdHVhbGx5IHJlY2VpdmVkXG4gKiB0aGUgZXZlbnQgY2FuIGJlIGFjY2Vzc2VkIHZpYVxuICogJ2V2ZW50LnRhcmdldCcuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSBMaXN0ZW4gZm9yIHRoZXNlIGV2ZW50c1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzZWxlY3RvciBPbmx5IGhhbmRsZSBldmVudHMgb24gZWxlbWVudHMgbWF0Y2hpbmcgdGhpcyBzZWxlY3RvciwgaWYgdW5kZWZpbmVkIG1hdGNoIHJvb3QgZWxlbWVudFxuICogQHBhcmFtIHtmdW5jdGlvbigpfSBoYW5kbGVyIEhhbmRsZXIgZnVuY3Rpb24gLSBldmVudCBkYXRhIHBhc3NlZCBoZXJlIHdpbGwgYmUgaW4gZXZlbnQuZGF0YVxuICogQHBhcmFtIHtPYmplY3R9IFtldmVudERhdGFdIERhdGEgdG8gcGFzcyBpbiBldmVudC5kYXRhXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCB1c2VDYXB0dXJlKSB7XG4gIHZhciByb290LCBsaXN0ZW5lck1hcCwgbWF0Y2hlciwgbWF0Y2hlclBhcmFtO1xuXG4gIGlmICghZXZlbnRUeXBlKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBldmVudCB0eXBlOiAnICsgZXZlbnRUeXBlKTtcbiAgfVxuXG4gIC8vIGhhbmRsZXIgY2FuIGJlIHBhc3NlZCBhc1xuICAvLyB0aGUgc2Vjb25kIG9yIHRoaXJkIGFyZ3VtZW50XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICB1c2VDYXB0dXJlID0gaGFuZGxlcjtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG5cbiAgLy8gRmFsbGJhY2sgdG8gc2Vuc2libGUgZGVmYXVsdHNcbiAgLy8gaWYgdXNlQ2FwdHVyZSBub3Qgc2V0XG4gIGlmICh1c2VDYXB0dXJlID09PSB1bmRlZmluZWQpIHtcbiAgICB1c2VDYXB0dXJlID0gdGhpcy5jYXB0dXJlRm9yVHlwZShldmVudFR5cGUpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSGFuZGxlciBtdXN0IGJlIGEgdHlwZSBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgcm9vdCA9IHRoaXMucm9vdEVsZW1lbnQ7XG4gIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcFt1c2VDYXB0dXJlID8gMSA6IDBdO1xuXG4gIC8vIEFkZCBtYXN0ZXIgaGFuZGxlciBmb3IgdHlwZSBpZiBub3QgY3JlYXRlZCB5ZXRcbiAgaWYgKCFsaXN0ZW5lck1hcFtldmVudFR5cGVdKSB7XG4gICAgaWYgKHJvb3QpIHtcbiAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gICAgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXSA9IFtdO1xuICB9XG5cbiAgaWYgKCFzZWxlY3Rvcikge1xuICAgIG1hdGNoZXJQYXJhbSA9IG51bGw7XG5cbiAgICAvLyBDT01QTEVYIC0gbWF0Y2hlc1Jvb3QgbmVlZHMgdG8gaGF2ZSBhY2Nlc3MgdG9cbiAgICAvLyB0aGlzLnJvb3RFbGVtZW50LCBzbyBiaW5kIHRoZSBmdW5jdGlvbiB0byB0aGlzLlxuICAgIG1hdGNoZXIgPSBtYXRjaGVzUm9vdC5iaW5kKHRoaXMpO1xuXG4gIC8vIENvbXBpbGUgYSBtYXRjaGVyIGZvciB0aGUgZ2l2ZW4gc2VsZWN0b3JcbiAgfSBlbHNlIGlmICgvXlthLXpdKyQvaS50ZXN0KHNlbGVjdG9yKSkge1xuICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yO1xuICAgIG1hdGNoZXIgPSBtYXRjaGVzVGFnO1xuICB9IGVsc2UgaWYgKC9eI1thLXowLTlcXC1fXSskL2kudGVzdChzZWxlY3RvcikpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3Rvci5zbGljZSgxKTtcbiAgICBtYXRjaGVyID0gbWF0Y2hlc0lkO1xuICB9IGVsc2Uge1xuICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yO1xuICAgIG1hdGNoZXIgPSBtYXRjaGVzO1xuICB9XG5cbiAgLy8gQWRkIHRvIHRoZSBsaXN0IG9mIGxpc3RlbmVyc1xuICBsaXN0ZW5lck1hcFtldmVudFR5cGVdLnB1c2goe1xuICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgIG1hdGNoZXI6IG1hdGNoZXIsXG4gICAgbWF0Y2hlclBhcmFtOiBtYXRjaGVyUGFyYW1cbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbiBldmVudCBoYW5kbGVyXG4gKiBmb3IgZWxlbWVudHMgdGhhdCBtYXRjaFxuICogdGhlIHNlbGVjdG9yLCBmb3JldmVyXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IFtldmVudFR5cGVdIFJlbW92ZSBoYW5kbGVycyBmb3IgZXZlbnRzIG1hdGNoaW5nIHRoaXMgdHlwZSwgY29uc2lkZXJpbmcgdGhlIG90aGVyIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbc2VsZWN0b3JdIElmIHRoaXMgcGFyYW1ldGVyIGlzIG9taXR0ZWQsIG9ubHkgaGFuZGxlcnMgd2hpY2ggbWF0Y2ggdGhlIG90aGVyIHR3byB3aWxsIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKX0gW2hhbmRsZXJdIElmIHRoaXMgcGFyYW1ldGVyIGlzIG9taXR0ZWQsIG9ubHkgaGFuZGxlcnMgd2hpY2ggbWF0Y2ggdGhlIHByZXZpb3VzIHR3byB3aWxsIGJlIHJlbW92ZWRcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCB1c2VDYXB0dXJlKSB7XG4gIHZhciBpLCBsaXN0ZW5lciwgbGlzdGVuZXJNYXAsIGxpc3RlbmVyTGlzdCwgc2luZ2xlRXZlbnRUeXBlO1xuXG4gIC8vIEhhbmRsZXIgY2FuIGJlIHBhc3NlZCBhc1xuICAvLyB0aGUgc2Vjb25kIG9yIHRoaXJkIGFyZ3VtZW50XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICB1c2VDYXB0dXJlID0gaGFuZGxlcjtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG5cbiAgLy8gSWYgdXNlQ2FwdHVyZSBub3Qgc2V0LCByZW1vdmVcbiAgLy8gYWxsIGV2ZW50IGxpc3RlbmVyc1xuICBpZiAodXNlQ2FwdHVyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5vZmYoZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdHJ1ZSk7XG4gICAgdGhpcy5vZmYoZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgZmFsc2UpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwW3VzZUNhcHR1cmUgPyAxIDogMF07XG4gIGlmICghZXZlbnRUeXBlKSB7XG4gICAgZm9yIChzaW5nbGVFdmVudFR5cGUgaW4gbGlzdGVuZXJNYXApIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcC5oYXNPd25Qcm9wZXJ0eShzaW5nbGVFdmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMub2ZmKHNpbmdsZUV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJMaXN0ID0gbGlzdGVuZXJNYXBbZXZlbnRUeXBlXTtcbiAgaWYgKCFsaXN0ZW5lckxpc3QgfHwgIWxpc3RlbmVyTGlzdC5sZW5ndGgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFJlbW92ZSBvbmx5IHBhcmFtZXRlciBtYXRjaGVzXG4gIC8vIGlmIHNwZWNpZmllZFxuICBmb3IgKGkgPSBsaXN0ZW5lckxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBsaXN0ZW5lciA9IGxpc3RlbmVyTGlzdFtpXTtcblxuICAgIGlmICgoIXNlbGVjdG9yIHx8IHNlbGVjdG9yID09PSBsaXN0ZW5lci5zZWxlY3RvcikgJiYgKCFoYW5kbGVyIHx8IGhhbmRsZXIgPT09IGxpc3RlbmVyLmhhbmRsZXIpKSB7XG4gICAgICBsaXN0ZW5lckxpc3Quc3BsaWNlKGksIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFsbCBsaXN0ZW5lcnMgcmVtb3ZlZFxuICBpZiAoIWxpc3RlbmVyTGlzdC5sZW5ndGgpIHtcbiAgICBkZWxldGUgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXTtcblxuICAgIC8vIFJlbW92ZSB0aGUgbWFpbiBoYW5kbGVyXG4gICAgaWYgKHRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqXG4gKiBIYW5kbGUgYW4gYXJiaXRyYXJ5IGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5oYW5kbGUgPSBmdW5jdGlvbihldmVudCkge1xuICB2YXIgaSwgbCwgdHlwZSA9IGV2ZW50LnR5cGUsIHJvb3QsIHBoYXNlLCBsaXN0ZW5lciwgcmV0dXJuZWQsIGxpc3RlbmVyTGlzdCA9IFtdLCB0YXJnZXQsIC8qKiBAY29uc3QgKi8gRVZFTlRJR05PUkUgPSAnZnRMYWJzRGVsZWdhdGVJZ25vcmUnO1xuXG4gIGlmIChldmVudFtFVkVOVElHTk9SRV0gPT09IHRydWUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG5cbiAgLy8gSGFyZGNvZGUgdmFsdWUgb2YgTm9kZS5URVhUX05PREVcbiAgLy8gYXMgbm90IGRlZmluZWQgaW4gSUU4XG4gIGlmICh0YXJnZXQubm9kZVR5cGUgPT09IDMpIHtcbiAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuXG4gIHBoYXNlID0gZXZlbnQuZXZlbnRQaGFzZSB8fCAoIGV2ZW50LnRhcmdldCAhPT0gZXZlbnQuY3VycmVudFRhcmdldCA/IDMgOiAyICk7XG4gIFxuICBzd2l0Y2ggKHBoYXNlKSB7XG4gICAgY2FzZSAxOiAvL0V2ZW50LkNBUFRVUklOR19QSEFTRTpcbiAgICAgIGxpc3RlbmVyTGlzdCA9IHRoaXMubGlzdGVuZXJNYXBbMV1bdHlwZV07XG4gICAgYnJlYWs7XG4gICAgY2FzZSAyOiAvL0V2ZW50LkFUX1RBUkdFVDpcbiAgICAgIGlmICh0aGlzLmxpc3RlbmVyTWFwWzBdICYmIHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV0pIGxpc3RlbmVyTGlzdCA9IGxpc3RlbmVyTGlzdC5jb25jYXQodGhpcy5saXN0ZW5lck1hcFswXVt0eXBlXSk7XG4gICAgICBpZiAodGhpcy5saXN0ZW5lck1hcFsxXSAmJiB0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdKSBsaXN0ZW5lckxpc3QgPSBsaXN0ZW5lckxpc3QuY29uY2F0KHRoaXMubGlzdGVuZXJNYXBbMV1bdHlwZV0pO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMzogLy9FdmVudC5CVUJCTElOR19QSEFTRTpcbiAgICAgIGxpc3RlbmVyTGlzdCA9IHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV07XG4gICAgYnJlYWs7XG4gIH1cblxuICAvLyBOZWVkIHRvIGNvbnRpbnVvdXNseSBjaGVja1xuICAvLyB0aGF0IHRoZSBzcGVjaWZpYyBsaXN0IGlzXG4gIC8vIHN0aWxsIHBvcHVsYXRlZCBpbiBjYXNlIG9uZVxuICAvLyBvZiB0aGUgY2FsbGJhY2tzIGFjdHVhbGx5XG4gIC8vIGNhdXNlcyB0aGUgbGlzdCB0byBiZSBkZXN0cm95ZWQuXG4gIGwgPSBsaXN0ZW5lckxpc3QubGVuZ3RoO1xuICB3aGlsZSAodGFyZ2V0ICYmIGwpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICBsaXN0ZW5lciA9IGxpc3RlbmVyTGlzdFtpXTtcblxuICAgICAgLy8gQmFpbCBmcm9tIHRoaXMgbG9vcCBpZlxuICAgICAgLy8gdGhlIGxlbmd0aCBjaGFuZ2VkIGFuZFxuICAgICAgLy8gbm8gbW9yZSBsaXN0ZW5lcnMgYXJlXG4gICAgICAvLyBkZWZpbmVkIGJldHdlZW4gaSBhbmQgbC5cbiAgICAgIGlmICghbGlzdGVuZXIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGZvciBtYXRjaCBhbmQgZmlyZVxuICAgICAgLy8gdGhlIGV2ZW50IGlmIHRoZXJlJ3Mgb25lXG4gICAgICAvL1xuICAgICAgLy8gVE9ETzpNQ0c6MjAxMjAxMTc6IE5lZWQgYSB3YXlcbiAgICAgIC8vIHRvIGNoZWNrIGlmIGV2ZW50I3N0b3BJbW1lZGlhdGVQcm9wYWdhdGlvblxuICAgICAgLy8gd2FzIGNhbGxlZC4gSWYgc28sIGJyZWFrIGJvdGggbG9vcHMuXG4gICAgICBpZiAobGlzdGVuZXIubWF0Y2hlci5jYWxsKHRhcmdldCwgbGlzdGVuZXIubWF0Y2hlclBhcmFtLCB0YXJnZXQpKSB7XG4gICAgICAgIHJldHVybmVkID0gdGhpcy5maXJlKGV2ZW50LCB0YXJnZXQsIGxpc3RlbmVyKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RvcCBwcm9wYWdhdGlvbiB0byBzdWJzZXF1ZW50XG4gICAgICAvLyBjYWxsYmFja3MgaWYgdGhlIGNhbGxiYWNrIHJldHVybmVkXG4gICAgICAvLyBmYWxzZVxuICAgICAgaWYgKHJldHVybmVkID09PSBmYWxzZSkge1xuICAgICAgICBldmVudFtFVkVOVElHTk9SRV0gPSB0cnVlO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETzpNQ0c6MjAxMjAxMTc6IE5lZWQgYSB3YXkgdG9cbiAgICAvLyBjaGVjayBpZiBldmVudCNzdG9wUHJvcGFnYXRpb25cbiAgICAvLyB3YXMgY2FsbGVkLiBJZiBzbywgYnJlYWsgbG9vcGluZ1xuICAgIC8vIHRocm91Z2ggdGhlIERPTS4gU3RvcCBpZiB0aGVcbiAgICAvLyBkZWxlZ2F0aW9uIHJvb3QgaGFzIGJlZW4gcmVhY2hlZFxuICAgIGlmICh0YXJnZXQgPT09IHJvb3QpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGwgPSBsaXN0ZW5lckxpc3QubGVuZ3RoO1xuICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnRFbGVtZW50O1xuICB9XG59O1xuXG4vKipcbiAqIEZpcmUgYSBsaXN0ZW5lciBvbiBhIHRhcmdldC5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBsaXN0ZW5lclxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24oZXZlbnQsIHRhcmdldCwgbGlzdGVuZXIpIHtcbiAgcmV0dXJuIGxpc3RlbmVyLmhhbmRsZXIuY2FsbCh0YXJnZXQsIGV2ZW50LCB0YXJnZXQpO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgYSBnZW5lcmljIHNlbGVjdG9yLlxuICpcbiAqIEB0eXBlIGZ1bmN0aW9uKClcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWxlY3RvciBBIENTUyBzZWxlY3RvclxuICovXG52YXIgbWF0Y2hlcyA9IChmdW5jdGlvbihlbCkge1xuICBpZiAoIWVsKSByZXR1cm47XG4gIHZhciBwID0gZWwucHJvdG90eXBlO1xuICByZXR1cm4gKHAubWF0Y2hlcyB8fCBwLm1hdGNoZXNTZWxlY3RvciB8fCBwLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBwLm1vek1hdGNoZXNTZWxlY3RvciB8fCBwLm1zTWF0Y2hlc1NlbGVjdG9yIHx8IHAub01hdGNoZXNTZWxlY3Rvcik7XG59KEVsZW1lbnQpKTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgYSB0YWcgc2VsZWN0b3IuXG4gKlxuICogVGFncyBhcmUgTk9UIGNhc2Utc2Vuc2l0aXZlLFxuICogZXhjZXB0IGluIFhNTCAoYW5kIFhNTC1iYXNlZFxuICogbGFuZ3VhZ2VzIHN1Y2ggYXMgWEhUTUwpLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWdOYW1lIFRoZSB0YWcgbmFtZSB0byB0ZXN0IGFnYWluc3RcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc1RhZyh0YWdOYW1lLCBlbGVtZW50KSB7XG4gIHJldHVybiB0YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gZWxlbWVudFxuICogbWF0Y2hlcyB0aGUgcm9vdC5cbiAqXG4gKiBAcGFyYW0gez9TdHJpbmd9IHNlbGVjdG9yIEluIHRoaXMgY2FzZSB0aGlzIGlzIGFsd2F5cyBwYXNzZWQgdGhyb3VnaCBhcyBudWxsIGFuZCBub3QgdXNlZFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3Qgd2l0aFxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5mdW5jdGlvbiBtYXRjaGVzUm9vdChzZWxlY3RvciwgZWxlbWVudCkge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSovXG4gIGlmICh0aGlzLnJvb3RFbGVtZW50ID09PSB3aW5kb3cpIHJldHVybiBlbGVtZW50ID09PSBkb2N1bWVudDtcbiAgcmV0dXJuIHRoaXMucm9vdEVsZW1lbnQgPT09IGVsZW1lbnQ7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgSUQgb2ZcbiAqIHRoZSBlbGVtZW50IGluICd0aGlzJ1xuICogbWF0Y2hlcyB0aGUgZ2l2ZW4gSUQuXG4gKlxuICogSURzIGFyZSBjYXNlLXNlbnNpdGl2ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgVGhlIElEIHRvIHRlc3QgYWdhaW5zdFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3Qgd2l0aFxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5mdW5jdGlvbiBtYXRjaGVzSWQoaWQsIGVsZW1lbnQpIHtcbiAgcmV0dXJuIGlkID09PSBlbGVtZW50LmlkO1xufVxuXG4vKipcbiAqIFNob3J0IGhhbmQgZm9yIG9mZigpXG4gKiBhbmQgcm9vdCgpLCBpZSBib3RoXG4gKiB3aXRoIG5vIHBhcmFtZXRlcnNcbiAqXG4gKiBAcmV0dXJuIHZvaWRcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vZmYoKTtcbiAgdGhpcy5yb290KCk7XG59O1xuIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlLCBub2RlOnRydWUqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQHByZXNlcnZlIENyZWF0ZSBhbmQgbWFuYWdlIGEgRE9NIGV2ZW50IGRlbGVnYXRvci5cbiAqXG4gKiBAdmVyc2lvbiAwLjMuMFxuICogQGNvZGluZ3N0YW5kYXJkIGZ0bGFicy1qc3YyXG4gKiBAY29weXJpZ2h0IFRoZSBGaW5hbmNpYWwgVGltZXMgTGltaXRlZCBbQWxsIFJpZ2h0cyBSZXNlcnZlZF1cbiAqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChzZWUgTElDRU5TRS50eHQpXG4gKi9cbnZhciBEZWxlZ2F0ZSA9IHJlcXVpcmUoJy4vZGVsZWdhdGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihyb290KSB7XG4gIHJldHVybiBuZXcgRGVsZWdhdGUocm9vdCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5EZWxlZ2F0ZSA9IERlbGVnYXRlO1xuIiwidmFyIEZyZWV6ZXIgPSByZXF1aXJlKCcuL3NyYy9mcmVlemVyJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEZyZWV6ZXI7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFV0aWxzID0gcmVxdWlyZSggJy4vdXRpbHMnICk7XHJcblxyXG5cclxuXHJcbi8vI2J1aWxkXHJcblxyXG5cclxudmFyIEJFRk9SRUFMTCA9ICdiZWZvcmVBbGwnLFxyXG5cdEFGVEVSQUxMID0gJ2FmdGVyQWxsJ1xyXG47XHJcbnZhciBzcGVjaWFsRXZlbnRzID0gW0JFRk9SRUFMTCwgQUZURVJBTExdO1xyXG5cclxuLy8gVGhlIHByb3RvdHlwZSBtZXRob2RzIGFyZSBzdG9yZWQgaW4gYSBkaWZmZXJlbnQgb2JqZWN0XHJcbi8vIGFuZCBhcHBsaWVkIGFzIG5vbiBlbnVtZXJhYmxlIHByb3BlcnRpZXMgbGF0ZXJcclxudmFyIGVtaXR0ZXJQcm90byA9IHtcclxuXHRvbjogZnVuY3Rpb24oIGV2ZW50TmFtZSwgbGlzdGVuZXIsIG9uY2UgKXtcclxuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbIGV2ZW50TmFtZSBdIHx8IFtdO1xyXG5cclxuXHRcdGxpc3RlbmVycy5wdXNoKHsgY2FsbGJhY2s6IGxpc3RlbmVyLCBvbmNlOiBvbmNlfSk7XHJcblx0XHR0aGlzLl9ldmVudHNbIGV2ZW50TmFtZSBdID0gIGxpc3RlbmVycztcclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRvbmNlOiBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApe1xyXG5cdFx0cmV0dXJuIHRoaXMub24oIGV2ZW50TmFtZSwgbGlzdGVuZXIsIHRydWUgKTtcclxuXHR9LFxyXG5cclxuXHRvZmY6IGZ1bmN0aW9uKCBldmVudE5hbWUsIGxpc3RlbmVyICl7XHJcblx0XHRpZiggdHlwZW9mIGV2ZW50TmFtZSA9PSAndW5kZWZpbmVkJyApe1xyXG5cdFx0XHR0aGlzLl9ldmVudHMgPSB7fTtcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYoIHR5cGVvZiBsaXN0ZW5lciA9PSAndW5kZWZpbmVkJyApIHtcclxuXHRcdFx0dGhpcy5fZXZlbnRzWyBldmVudE5hbWUgXSA9IFtdO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbIGV2ZW50TmFtZSBdIHx8IFtdLFxyXG5cdFx0XHRcdGlcclxuXHRcdFx0O1xyXG5cclxuXHRcdFx0Zm9yIChpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcblx0XHRcdFx0aWYoIGxpc3RlbmVyc1tpXS5jYWxsYmFjayA9PT0gbGlzdGVuZXIgKVxyXG5cdFx0XHRcdFx0bGlzdGVuZXJzLnNwbGljZSggaSwgMSApO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0dHJpZ2dlcjogZnVuY3Rpb24oIGV2ZW50TmFtZSApe1xyXG5cdFx0dmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKCBhcmd1bWVudHMsIDEgKSxcclxuXHRcdFx0bGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzWyBldmVudE5hbWUgXSB8fCBbXSxcclxuXHRcdFx0b25jZUxpc3RlbmVycyA9IFtdLFxyXG5cdFx0XHRzcGVjaWFsID0gc3BlY2lhbEV2ZW50cy5pbmRleE9mKCBldmVudE5hbWUgKSAhPSAtMSxcclxuXHRcdFx0aSwgbGlzdGVuZXIsIHJldHVyblZhbHVlLCBsYXN0VmFsdWVcclxuXHRcdDtcclxuXHJcblx0XHRzcGVjaWFsIHx8IHRoaXMudHJpZ2dlci5hcHBseSggdGhpcywgW0JFRk9SRUFMTCwgZXZlbnROYW1lXS5jb25jYXQoIGFyZ3MgKSApO1xyXG5cclxuXHRcdC8vIENhbGwgbGlzdGVuZXJzXHJcblx0XHRmb3IgKGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdGxpc3RlbmVyID0gbGlzdGVuZXJzW2ldO1xyXG5cclxuXHRcdFx0aWYoIGxpc3RlbmVyLmNhbGxiYWNrIClcclxuXHRcdFx0XHRsYXN0VmFsdWUgPSBsaXN0ZW5lci5jYWxsYmFjay5hcHBseSggdGhpcywgYXJncyApO1xyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHQvLyBJZiB0aGVyZSBpcyBub3QgYSBjYWxsYmFjaywgcmVtb3ZlIVxyXG5cdFx0XHRcdGxpc3RlbmVyLm9uY2UgPSB0cnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiggbGlzdGVuZXIub25jZSApXHJcblx0XHRcdFx0b25jZUxpc3RlbmVycy5wdXNoKCBpICk7XHJcblxyXG5cdFx0XHRpZiggbGFzdFZhbHVlICE9PSB1bmRlZmluZWQgKXtcclxuXHRcdFx0XHRyZXR1cm5WYWx1ZSA9IGxhc3RWYWx1ZTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIFJlbW92ZSBsaXN0ZW5lcnMgbWFya2VkIGFzIG9uY2VcclxuXHRcdGZvciggaSA9IG9uY2VMaXN0ZW5lcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKXtcclxuXHRcdFx0bGlzdGVuZXJzLnNwbGljZSggb25jZUxpc3RlbmVyc1tpXSwgMSApO1xyXG5cdFx0fVxyXG5cclxuXHRcdHNwZWNpYWwgfHwgdGhpcy50cmlnZ2VyLmFwcGx5KCB0aGlzLCBbQUZURVJBTEwsIGV2ZW50TmFtZV0uY29uY2F0KCBhcmdzICkgKTtcclxuXHJcblx0XHRyZXR1cm4gcmV0dXJuVmFsdWU7XHJcblx0fVxyXG59O1xyXG5cclxuLy8gTWV0aG9kcyBhcmUgbm90IGVudW1lcmFibGUgc28sIHdoZW4gdGhlIHN0b3JlcyBhcmVcclxuLy8gZXh0ZW5kZWQgd2l0aCB0aGUgZW1pdHRlciwgdGhleSBjYW4gYmUgaXRlcmF0ZWQgYXNcclxuLy8gaGFzaG1hcHNcclxudmFyIEVtaXR0ZXIgPSBVdGlscy5jcmVhdGVOb25FbnVtZXJhYmxlKCBlbWl0dGVyUHJvdG8gKTtcclxuLy8jYnVpbGRcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRW1pdHRlcjtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFV0aWxzID0gcmVxdWlyZSggJy4vdXRpbHMuanMnICksXHJcblx0RW1pdHRlciA9IHJlcXVpcmUoICcuL2VtaXR0ZXInICksXHJcblx0RnJvemVuID0gcmVxdWlyZSggJy4vZnJvemVuJyApXHJcbjtcclxuXHJcbi8vI2J1aWxkXHJcbnZhciBGcmVlemVyID0gZnVuY3Rpb24oIGluaXRpYWxWYWx1ZSwgb3B0aW9ucyApIHtcclxuXHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0b3BzID0gb3B0aW9ucyB8fCB7fSxcclxuXHRcdHN0b3JlID0ge1xyXG5cdFx0XHRsaXZlOiBvcHMubGl2ZSB8fCBmYWxzZSxcclxuXHRcdFx0ZnJlZXplSW5zdGFuY2VzOiBvcHMuZnJlZXplSW5zdGFuY2VzIHx8IGZhbHNlXHJcblx0XHR9XHJcblx0O1xyXG5cclxuXHQvLyBJbW11dGFibGUgZGF0YVxyXG5cdHZhciBmcm96ZW47XHJcblx0dmFyIHBpdm90VHJpZ2dlcnMgPSBbXSwgcGl2b3RUaWNraW5nID0gMDtcclxuXHR2YXIgdHJpZ2dlck5vdyA9IGZ1bmN0aW9uKCBub2RlICl7XHJcblx0XHR2YXIgXyA9IG5vZGUuX18sXHJcblx0XHRcdGlcclxuXHRcdDtcclxuXHJcblx0XHRpZiggXy5saXN0ZW5lciApe1xyXG5cdFx0XHR2YXIgcHJldlN0YXRlID0gXy5saXN0ZW5lci5wcmV2U3RhdGUgfHwgbm9kZTtcclxuXHRcdFx0Xy5saXN0ZW5lci5wcmV2U3RhdGUgPSAwO1xyXG5cdFx0XHRGcm96ZW4udHJpZ2dlciggcHJldlN0YXRlLCAndXBkYXRlJywgbm9kZSwgdHJ1ZSApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZvciAoaSA9IDA7IGkgPCBfLnBhcmVudHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0Xy5zdG9yZS5ub3RpZnkoICdub3cnLCBfLnBhcmVudHNbaV0gKTtcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHR2YXIgYWRkVG9QaXZvdFRyaWdnZXJzID0gZnVuY3Rpb24oIG5vZGUgKXtcclxuXHRcdHBpdm90VHJpZ2dlcnMucHVzaCggbm9kZSApO1xyXG5cdFx0aWYoICFwaXZvdFRpY2tpbmcgKXtcclxuXHRcdFx0cGl2b3RUaWNraW5nID0gMTtcclxuXHRcdFx0VXRpbHMubmV4dFRpY2soIGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0cGl2b3RUcmlnZ2VycyA9IFtdO1xyXG5cdFx0XHRcdHBpdm90VGlja2luZyA9IDA7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH07XHJcblxyXG5cdHN0b3JlLm5vdGlmeSA9IGZ1bmN0aW9uIG5vdGlmeSggZXZlbnROYW1lLCBub2RlLCBvcHRpb25zICl7XHJcblx0XHRpZiggZXZlbnROYW1lID09ICdub3cnICl7XHJcblx0XHRcdGlmKCBwaXZvdFRyaWdnZXJzLmxlbmd0aCApe1xyXG5cdFx0XHRcdHdoaWxlKCBwaXZvdFRyaWdnZXJzLmxlbmd0aCApe1xyXG5cdFx0XHRcdFx0dHJpZ2dlck5vdyggcGl2b3RUcmlnZ2Vycy5zaGlmdCgpICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdHRyaWdnZXJOb3coIG5vZGUgKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIG5vZGU7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIHVwZGF0ZSA9IEZyb3plbltldmVudE5hbWVdKCBub2RlLCBvcHRpb25zICk7XHJcblxyXG5cdFx0aWYoIGV2ZW50TmFtZSAhPSAncGl2b3QnICl7XHJcblx0XHRcdHZhciBwaXZvdCA9IFV0aWxzLmZpbmRQaXZvdCggdXBkYXRlICk7XHJcblx0XHRcdGlmKCBwaXZvdCApIHtcclxuXHRcdFx0XHRhZGRUb1Bpdm90VHJpZ2dlcnMoIHVwZGF0ZSApO1xyXG5cdCAgXHRcdHJldHVybiBwaXZvdDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB1cGRhdGU7XHJcblx0fTtcclxuXHJcblx0c3RvcmUuZnJlZXplRm4gPSBvcHMubXV0YWJsZSA9PT0gdHJ1ZSA/XHJcblx0XHRmdW5jdGlvbigpe30gOlxyXG5cdFx0ZnVuY3Rpb24oIG9iaiApeyBPYmplY3QuZnJlZXplKCBvYmogKTsgfVxyXG5cdDtcclxuXHJcblx0Ly8gQ3JlYXRlIHRoZSBmcm96ZW4gb2JqZWN0XHJcblx0ZnJvemVuID0gRnJvemVuLmZyZWV6ZSggaW5pdGlhbFZhbHVlLCBzdG9yZSApO1xyXG5cdGZyb3plbi5fXy51cGRhdGVSb290ID0gZnVuY3Rpb24oIHByZXZOb2RlLCB1cGRhdGVkICl7XHJcblx0XHRpZiggcHJldk5vZGUgPT09IGZyb3plbiApe1xyXG5cdFx0XHRmcm96ZW4gPSB1cGRhdGVkO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly8gTGlzdGVuIHRvIGl0cyBjaGFuZ2VzIGltbWVkaWF0ZWx5XHJcblx0dmFyIGxpc3RlbmVyID0gZnJvemVuLmdldExpc3RlbmVyKCksXHJcblx0XHRodWIgPSB7fVxyXG5cdDtcclxuXHJcblx0VXRpbHMuZWFjaChbJ29uJywgJ29mZicsICdvbmNlJywgJ3RyaWdnZXInXSwgZnVuY3Rpb24oIG1ldGhvZCApe1xyXG5cdFx0dmFyIGF0dHJzID0ge307XHJcblx0XHRhdHRyc1sgbWV0aG9kIF0gPSBsaXN0ZW5lclttZXRob2RdLmJpbmQobGlzdGVuZXIpO1xyXG5cdFx0VXRpbHMuYWRkTkUoIG1lLCBhdHRycyApO1xyXG5cdFx0VXRpbHMuYWRkTkUoIGh1YiwgYXR0cnMgKTtcclxuXHR9KTtcclxuXHJcblx0VXRpbHMuYWRkTkUoIHRoaXMsIHtcclxuXHRcdGdldDogZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIGZyb3plbjtcclxuXHRcdH0sXHJcblx0XHRzZXQ6IGZ1bmN0aW9uKCBub2RlICl7XHJcblx0XHRcdGZyb3plbi5yZXNldCggbm9kZSApO1xyXG5cdFx0fSxcclxuXHRcdGdldEV2ZW50SHViOiBmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gaHViO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHRVdGlscy5hZGRORSggdGhpcywgeyBnZXREYXRhOiB0aGlzLmdldCwgc2V0RGF0YTogdGhpcy5zZXQgfSApO1xyXG59O1xyXG5cclxuLy8jYnVpbGRcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRnJlZXplcjtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFV0aWxzID0gcmVxdWlyZSggJy4vdXRpbHMnICksXHJcblx0bm9kZUNyZWF0b3IgPSByZXF1aXJlKCAnLi9ub2RlQ3JlYXRvcicpLFxyXG5cdEVtaXR0ZXIgPSByZXF1aXJlKCcuL2VtaXR0ZXInKVxyXG47XHJcblxyXG4vLyNidWlsZFxyXG52YXIgRnJvemVuID0ge1xyXG5cdGZyZWV6ZTogZnVuY3Rpb24oIG5vZGUsIHN0b3JlICl7XHJcblx0XHRpZiggbm9kZSAmJiBub2RlLl9fICl7XHJcblx0XHRcdHJldHVybiBub2RlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdGZyb3plbiA9IG5vZGVDcmVhdG9yLmNsb25lKG5vZGUpXHJcblx0XHQ7XHJcblxyXG5cdFx0VXRpbHMuYWRkTkUoIGZyb3plbiwgeyBfXzoge1xyXG5cdFx0XHRsaXN0ZW5lcjogZmFsc2UsXHJcblx0XHRcdHBhcmVudHM6IFtdLFxyXG5cdFx0XHRzdG9yZTogc3RvcmVcclxuXHRcdH19KTtcclxuXHJcblx0XHQvLyBGcmVlemUgY2hpbGRyZW5cclxuXHRcdFV0aWxzLmVhY2goIG5vZGUsIGZ1bmN0aW9uKCBjaGlsZCwga2V5ICl7XHJcblx0XHRcdGlmKCAhVXRpbHMuaXNMZWFmKCBjaGlsZCwgc3RvcmUuZnJlZXplSW5zdGFuY2VzICkgKXtcclxuXHRcdFx0XHRjaGlsZCA9IG1lLmZyZWV6ZSggY2hpbGQsIHN0b3JlICk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmKCBjaGlsZCAmJiBjaGlsZC5fXyApe1xyXG5cdFx0XHRcdG1lLmFkZFBhcmVudCggY2hpbGQsIGZyb3plbiApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmcm96ZW5bIGtleSBdID0gY2hpbGQ7XHJcblx0XHR9KTtcclxuXHJcblx0XHRzdG9yZS5mcmVlemVGbiggZnJvemVuICk7XHJcblxyXG5cdFx0cmV0dXJuIGZyb3plbjtcclxuXHR9LFxyXG5cclxuXHRtZXJnZTogZnVuY3Rpb24oIG5vZGUsIGF0dHJzICl7XHJcblx0XHR2YXIgXyA9IG5vZGUuX18sXHJcblx0XHRcdHRyYW5zID0gXy50cmFucyxcclxuXHJcblx0XHRcdC8vIENsb25lIHRoZSBhdHRycyB0byBub3QgbW9kaWZ5IHRoZSBhcmd1bWVudFxyXG5cdFx0XHRhdHRycyA9IFV0aWxzLmV4dGVuZCgge30sIGF0dHJzKVxyXG5cdFx0O1xyXG5cclxuXHRcdGlmKCB0cmFucyApe1xyXG5cdFx0XHRmb3IoIHZhciBhdHRyIGluIGF0dHJzIClcclxuXHRcdFx0XHR0cmFuc1sgYXR0ciBdID0gYXR0cnNbIGF0dHIgXTtcclxuXHRcdFx0cmV0dXJuIG5vZGU7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIG1lID0gdGhpcyxcclxuXHRcdFx0ZnJvemVuID0gdGhpcy5jb3B5TWV0YSggbm9kZSApLFxyXG5cdFx0XHRzdG9yZSA9IF8uc3RvcmUsXHJcblx0XHRcdHZhbCwga2V5LCBpc0Zyb3plblxyXG5cdFx0O1xyXG5cclxuXHRcdFV0aWxzLmVhY2goIG5vZGUsIGZ1bmN0aW9uKCBjaGlsZCwga2V5ICl7XHJcblx0XHRcdGlzRnJvemVuID0gY2hpbGQgJiYgY2hpbGQuX187XHJcblxyXG5cdFx0XHRpZiggaXNGcm96ZW4gKXtcclxuXHRcdFx0XHRtZS5yZW1vdmVQYXJlbnQoIGNoaWxkLCBub2RlICk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhbCA9IGF0dHJzWyBrZXkgXTtcclxuXHRcdFx0aWYoICF2YWwgKXtcclxuXHRcdFx0XHRpZiggaXNGcm96ZW4gKVxyXG5cdFx0XHRcdFx0bWUuYWRkUGFyZW50KCBjaGlsZCwgZnJvemVuICk7XHJcblx0XHRcdFx0cmV0dXJuIGZyb3plblsga2V5IF0gPSBjaGlsZDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYoICFVdGlscy5pc0xlYWYoIHZhbCwgc3RvcmUuZnJlZXplSW5zdGFuY2VzICkgKVxyXG5cdFx0XHRcdHZhbCA9IG1lLmZyZWV6ZSggdmFsLCBzdG9yZSApO1xyXG5cclxuXHRcdFx0aWYoIHZhbCAmJiB2YWwuX18gKVxyXG5cdFx0XHRcdG1lLmFkZFBhcmVudCggdmFsLCBmcm96ZW4gKTtcclxuXHJcblx0XHRcdGRlbGV0ZSBhdHRyc1sga2V5IF07XHJcblxyXG5cdFx0XHRmcm96ZW5bIGtleSBdID0gdmFsO1xyXG5cdFx0fSk7XHJcblxyXG5cclxuXHRcdGZvcigga2V5IGluIGF0dHJzICkge1xyXG5cdFx0XHR2YWwgPSBhdHRyc1sga2V5IF07XHJcblxyXG5cdFx0XHRpZiggIVV0aWxzLmlzTGVhZiggdmFsLCBzdG9yZS5mcmVlemVJbnN0YW5jZXMgKSApXHJcblx0XHRcdFx0dmFsID0gbWUuZnJlZXplKCB2YWwsIHN0b3JlICk7XHJcblxyXG5cdFx0XHRpZiggdmFsICYmIHZhbC5fXyApXHJcblx0XHRcdFx0bWUuYWRkUGFyZW50KCB2YWwsIGZyb3plbiApO1xyXG5cclxuXHRcdFx0ZnJvemVuWyBrZXkgXSA9IHZhbDtcclxuXHRcdH1cclxuXHJcblx0XHRfLnN0b3JlLmZyZWV6ZUZuKCBmcm96ZW4gKTtcclxuXHJcblx0XHR0aGlzLnJlZnJlc2hQYXJlbnRzKCBub2RlLCBmcm96ZW4gKTtcclxuXHJcblx0XHRyZXR1cm4gZnJvemVuO1xyXG5cdH0sXHJcblxyXG5cdHJlcGxhY2U6IGZ1bmN0aW9uKCBub2RlLCByZXBsYWNlbWVudCApIHtcclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdF8gPSBub2RlLl9fLFxyXG5cdFx0XHRmcm96ZW4gPSByZXBsYWNlbWVudFxyXG5cdFx0O1xyXG5cclxuXHRcdGlmKCAhVXRpbHMuaXNMZWFmKCByZXBsYWNlbWVudCwgXy5zdG9yZS5mcmVlemVJbnN0YW5jZXMgKSApIHtcclxuXHJcblx0XHRcdGZyb3plbiA9IG1lLmZyZWV6ZSggcmVwbGFjZW1lbnQsIF8uc3RvcmUgKTtcclxuXHRcdFx0ZnJvemVuLl9fLnBhcmVudHMgPSBfLnBhcmVudHM7XHJcblx0XHRcdGZyb3plbi5fXy51cGRhdGVSb290ID0gXy51cGRhdGVSb290O1xyXG5cclxuXHRcdFx0Ly8gQWRkIHRoZSBjdXJyZW50IGxpc3RlbmVyIGlmIGV4aXN0cywgcmVwbGFjaW5nIGFcclxuXHRcdFx0Ly8gcHJldmlvdXMgbGlzdGVuZXIgaW4gdGhlIGZyb3plbiBpZiBleGlzdGVkXHJcblx0XHRcdGlmKCBfLmxpc3RlbmVyIClcclxuXHRcdFx0XHRmcm96ZW4uX18ubGlzdGVuZXIgPSBfLmxpc3RlbmVyO1xyXG5cdFx0fVxyXG5cdFx0aWYoIGZyb3plbiApe1xyXG5cdFx0XHR0aGlzLmZpeENoaWxkcmVuKCBmcm96ZW4sIG5vZGUgKTtcclxuXHRcdH1cclxuXHRcdHRoaXMucmVmcmVzaFBhcmVudHMoIG5vZGUsIGZyb3plbiApO1xyXG5cclxuXHRcdHJldHVybiBmcm96ZW47XHJcblx0fSxcclxuXHJcblx0cmVtb3ZlOiBmdW5jdGlvbiggbm9kZSwgYXR0cnMgKXtcclxuXHRcdHZhciB0cmFucyA9IG5vZGUuX18udHJhbnM7XHJcblx0XHRpZiggdHJhbnMgKXtcclxuXHRcdFx0Zm9yKCB2YXIgbCA9IGF0dHJzLmxlbmd0aCAtIDE7IGwgPj0gMDsgbC0tIClcclxuXHRcdFx0XHRkZWxldGUgdHJhbnNbIGF0dHJzW2xdIF07XHJcblx0XHRcdHJldHVybiBub2RlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdGZyb3plbiA9IHRoaXMuY29weU1ldGEoIG5vZGUgKSxcclxuXHRcdFx0aXNGcm96ZW5cclxuXHRcdDtcclxuXHJcblx0XHRVdGlscy5lYWNoKCBub2RlLCBmdW5jdGlvbiggY2hpbGQsIGtleSApe1xyXG5cdFx0XHRpc0Zyb3plbiA9IGNoaWxkICYmIGNoaWxkLl9fO1xyXG5cclxuXHRcdFx0aWYoIGlzRnJvemVuICl7XHJcblx0XHRcdFx0bWUucmVtb3ZlUGFyZW50KCBjaGlsZCwgbm9kZSApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiggYXR0cnMuaW5kZXhPZigga2V5ICkgIT0gLTEgKXtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmKCBpc0Zyb3plbiApXHJcblx0XHRcdFx0bWUuYWRkUGFyZW50KCBjaGlsZCwgZnJvemVuICk7XHJcblxyXG5cdFx0XHRmcm96ZW5bIGtleSBdID0gY2hpbGQ7XHJcblx0XHR9KTtcclxuXHJcblx0XHRub2RlLl9fLnN0b3JlLmZyZWV6ZUZuKCBmcm96ZW4gKTtcclxuXHRcdHRoaXMucmVmcmVzaFBhcmVudHMoIG5vZGUsIGZyb3plbiApO1xyXG5cclxuXHRcdHJldHVybiBmcm96ZW47XHJcblx0fSxcclxuXHJcblx0c3BsaWNlOiBmdW5jdGlvbiggbm9kZSwgYXJncyApe1xyXG5cdFx0dmFyIF8gPSBub2RlLl9fLFxyXG5cdFx0XHR0cmFucyA9IF8udHJhbnNcclxuXHRcdDtcclxuXHJcblx0XHRpZiggdHJhbnMgKXtcclxuXHRcdFx0dHJhbnMuc3BsaWNlLmFwcGx5KCB0cmFucywgYXJncyApO1xyXG5cdFx0XHRyZXR1cm4gbm9kZTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHRmcm96ZW4gPSB0aGlzLmNvcHlNZXRhKCBub2RlICksXHJcblx0XHRcdGluZGV4ID0gYXJnc1swXSxcclxuXHRcdFx0ZGVsZXRlSW5kZXggPSBpbmRleCArIGFyZ3NbMV0sXHJcblx0XHRcdGNoaWxkXHJcblx0XHQ7XHJcblxyXG5cdFx0Ly8gQ2xvbmUgdGhlIGFycmF5XHJcblx0XHRVdGlscy5lYWNoKCBub2RlLCBmdW5jdGlvbiggY2hpbGQsIGkgKXtcclxuXHJcblx0XHRcdGlmKCBjaGlsZCAmJiBjaGlsZC5fXyApe1xyXG5cdFx0XHRcdG1lLnJlbW92ZVBhcmVudCggY2hpbGQsIG5vZGUgKTtcclxuXHJcblx0XHRcdFx0Ly8gU2tpcCB0aGUgbm9kZXMgdG8gZGVsZXRlXHJcblx0XHRcdFx0aWYoIGkgPCBpbmRleCB8fCBpPj0gZGVsZXRlSW5kZXggKVxyXG5cdFx0XHRcdFx0bWUuYWRkUGFyZW50KCBjaGlsZCwgZnJvemVuICk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZyb3plbltpXSA9IGNoaWxkO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gUHJlcGFyZSB0aGUgbmV3IG5vZGVzXHJcblx0XHRpZiggYXJncy5sZW5ndGggPiAxICl7XHJcblx0XHRcdGZvciAodmFyIGkgPSBhcmdzLmxlbmd0aCAtIDE7IGkgPj0gMjsgaS0tKSB7XHJcblx0XHRcdFx0Y2hpbGQgPSBhcmdzW2ldO1xyXG5cclxuXHRcdFx0XHRpZiggIVV0aWxzLmlzTGVhZiggY2hpbGQsIF8uc3RvcmUuZnJlZXplSW5zdGFuY2VzICkgKVxyXG5cdFx0XHRcdFx0Y2hpbGQgPSB0aGlzLmZyZWV6ZSggY2hpbGQsIF8uc3RvcmUgKTtcclxuXHJcblx0XHRcdFx0aWYoIGNoaWxkICYmIGNoaWxkLl9fIClcclxuXHRcdFx0XHRcdHRoaXMuYWRkUGFyZW50KCBjaGlsZCwgZnJvemVuICk7XHJcblxyXG5cdFx0XHRcdGFyZ3NbaV0gPSBjaGlsZDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIHNwbGljZVxyXG5cdFx0QXJyYXkucHJvdG90eXBlLnNwbGljZS5hcHBseSggZnJvemVuLCBhcmdzICk7XHJcblxyXG5cdFx0Xy5zdG9yZS5mcmVlemVGbiggZnJvemVuICk7XHJcblx0XHR0aGlzLnJlZnJlc2hQYXJlbnRzKCBub2RlLCBmcm96ZW4gKTtcclxuXHJcblx0XHRyZXR1cm4gZnJvemVuO1xyXG5cdH0sXHJcblxyXG5cdHRyYW5zYWN0OiBmdW5jdGlvbiggbm9kZSApIHtcclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdHRyYW5zYWN0aW5nID0gbm9kZS5fXy50cmFucyxcclxuXHRcdFx0dHJhbnNcclxuXHRcdDtcclxuXHJcblx0XHRpZiggdHJhbnNhY3RpbmcgKVxyXG5cdFx0XHRyZXR1cm4gdHJhbnNhY3Rpbmc7XHJcblxyXG5cdFx0dHJhbnMgPSBub2RlLmNvbnN0cnVjdG9yID09IEFycmF5ID8gW10gOiB7fTtcclxuXHJcblx0XHRVdGlscy5lYWNoKCBub2RlLCBmdW5jdGlvbiggY2hpbGQsIGtleSApe1xyXG5cdFx0XHR0cmFuc1sga2V5IF0gPSBjaGlsZDtcclxuXHRcdH0pO1xyXG5cclxuXHRcdG5vZGUuX18udHJhbnMgPSB0cmFucztcclxuXHJcblx0XHQvLyBDYWxsIHJ1biBhdXRvbWF0aWNhbGx5IGluIGNhc2VcclxuXHRcdC8vIHRoZSB1c2VyIGZvcmdvdCBhYm91dCBpdFxyXG5cdFx0VXRpbHMubmV4dFRpY2soIGZ1bmN0aW9uKCl7XHJcblx0XHRcdGlmKCBub2RlLl9fLnRyYW5zIClcclxuXHRcdFx0XHRtZS5ydW4oIG5vZGUgKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiB0cmFucztcclxuXHR9LFxyXG5cclxuXHRydW46IGZ1bmN0aW9uKCBub2RlICkge1xyXG5cdFx0dmFyIG1lID0gdGhpcyxcclxuXHRcdFx0dHJhbnMgPSBub2RlLl9fLnRyYW5zXHJcblx0XHQ7XHJcblxyXG5cdFx0aWYoICF0cmFucyApXHJcblx0XHRcdHJldHVybiBub2RlO1xyXG5cclxuXHRcdC8vIFJlbW92ZSB0aGUgbm9kZSBhcyBhIHBhcmVudFxyXG5cdFx0VXRpbHMuZWFjaCggdHJhbnMsIGZ1bmN0aW9uKCBjaGlsZCwga2V5ICl7XHJcblx0XHRcdGlmKCBjaGlsZCAmJiBjaGlsZC5fXyApe1xyXG5cdFx0XHRcdG1lLnJlbW92ZVBhcmVudCggY2hpbGQsIG5vZGUgKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0ZGVsZXRlIG5vZGUuX18udHJhbnM7XHJcblxyXG5cdFx0dmFyIHJlc3VsdCA9IHRoaXMucmVwbGFjZSggbm9kZSwgdHJhbnMgKTtcclxuXHRcdHJldHVybiByZXN1bHQ7XHJcblx0fSxcclxuXHJcblx0cGl2b3Q6IGZ1bmN0aW9uKCBub2RlICl7XHJcblx0XHRub2RlLl9fLnBpdm90ID0gMTtcclxuXHRcdHRoaXMudW5waXZvdCggbm9kZSApO1xyXG5cdFx0cmV0dXJuIG5vZGU7XHJcblx0fSxcclxuXHJcblx0dW5waXZvdDogZnVuY3Rpb24oIG5vZGUgKXtcclxuXHRcdFV0aWxzLm5leHRUaWNrKCBmdW5jdGlvbigpe1xyXG5cdFx0XHRub2RlLl9fLnBpdm90ID0gMDtcclxuXHRcdH0pO1xyXG5cdH0sXHJcblxyXG5cdHJlZnJlc2g6IGZ1bmN0aW9uKCBub2RlLCBvbGRDaGlsZCwgbmV3Q2hpbGQgKXtcclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdHRyYW5zID0gbm9kZS5fXy50cmFucyxcclxuXHRcdFx0Zm91bmQgPSAwXHJcblx0XHQ7XHJcblxyXG5cdFx0aWYoIHRyYW5zICl7XHJcblxyXG5cdFx0XHRVdGlscy5lYWNoKCB0cmFucywgZnVuY3Rpb24oIGNoaWxkLCBrZXkgKXtcclxuXHRcdFx0XHRpZiggZm91bmQgKSByZXR1cm47XHJcblxyXG5cdFx0XHRcdGlmKCBjaGlsZCA9PT0gb2xkQ2hpbGQgKXtcclxuXHJcblx0XHRcdFx0XHR0cmFuc1sga2V5IF0gPSBuZXdDaGlsZDtcclxuXHRcdFx0XHRcdGZvdW5kID0gMTtcclxuXHJcblx0XHRcdFx0XHRpZiggbmV3Q2hpbGQgJiYgbmV3Q2hpbGQuX18gKVxyXG5cdFx0XHRcdFx0XHRtZS5hZGRQYXJlbnQoIG5ld0NoaWxkLCBub2RlICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdHJldHVybiBub2RlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBmcm96ZW4gPSB0aGlzLmNvcHlNZXRhKCBub2RlICksXHJcblx0XHRcdHJlcGxhY2VtZW50LCBfX1xyXG5cdFx0O1xyXG5cclxuXHRcdFV0aWxzLmVhY2goIG5vZGUsIGZ1bmN0aW9uKCBjaGlsZCwga2V5ICl7XHJcblx0XHRcdGlmKCBjaGlsZCA9PT0gb2xkQ2hpbGQgKXtcclxuXHRcdFx0XHRjaGlsZCA9IG5ld0NoaWxkO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiggY2hpbGQgJiYgKF9fID0gY2hpbGQuX18pICl7XHJcblx0XHRcdFx0bWUucmVtb3ZlUGFyZW50KCBjaGlsZCwgbm9kZSApO1xyXG5cdFx0XHRcdG1lLmFkZFBhcmVudCggY2hpbGQsIGZyb3plbiApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmcm96ZW5bIGtleSBdID0gY2hpbGQ7XHJcblx0XHR9KTtcclxuXHJcblx0XHRub2RlLl9fLnN0b3JlLmZyZWV6ZUZuKCBmcm96ZW4gKTtcclxuXHJcblx0XHR0aGlzLnJlZnJlc2hQYXJlbnRzKCBub2RlLCBmcm96ZW4gKTtcclxuXHR9LFxyXG5cclxuXHRmaXhDaGlsZHJlbjogZnVuY3Rpb24oIG5vZGUsIG9sZE5vZGUgKXtcclxuXHRcdHZhciBtZSA9IHRoaXM7XHJcblx0XHRVdGlscy5lYWNoKCBub2RlLCBmdW5jdGlvbiggY2hpbGQgKXtcclxuXHRcdFx0aWYoICFjaGlsZCB8fCAhY2hpbGQuX18gKVxyXG5cdFx0XHRcdHJldHVybjtcclxuXHJcblx0XHRcdC8vIFVwZGF0ZSBwYXJlbnRzIGluIGFsbCBjaGlsZHJlbiBubyBtYXR0ZXIgdGhlIGNoaWxkXHJcblx0XHRcdC8vIGlzIGxpbmtlZCB0byB0aGUgbm9kZSBvciBub3QuXHJcblx0XHRcdG1lLmZpeENoaWxkcmVuKCBjaGlsZCApO1xyXG5cclxuXHRcdFx0aWYoIGNoaWxkLl9fLnBhcmVudHMubGVuZ3RoID09IDEgKVxyXG5cdFx0XHRcdHJldHVybiBjaGlsZC5fXy5wYXJlbnRzID0gWyBub2RlIF07XHJcblxyXG5cdFx0XHRpZiggb2xkTm9kZSApXHJcblx0XHRcdFx0bWUucmVtb3ZlUGFyZW50KCBjaGlsZCwgb2xkTm9kZSApO1xyXG5cclxuXHRcdFx0bWUuYWRkUGFyZW50KCBjaGlsZCwgbm9kZSApO1xyXG5cdFx0fSk7XHJcblx0fSxcclxuXHJcblx0Y29weU1ldGE6IGZ1bmN0aW9uKCBub2RlICl7XHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHRmcm96ZW4gPSBub2RlQ3JlYXRvci5jbG9uZSggbm9kZSApLFxyXG5cdFx0XHRfID0gbm9kZS5fX1xyXG5cdFx0O1xyXG5cclxuXHRcdFV0aWxzLmFkZE5FKCBmcm96ZW4sIHtfXzoge1xyXG5cdFx0XHRzdG9yZTogXy5zdG9yZSxcclxuXHRcdFx0dXBkYXRlUm9vdDogXy51cGRhdGVSb290LFxyXG5cdFx0XHRsaXN0ZW5lcjogXy5saXN0ZW5lcixcclxuXHRcdFx0cGFyZW50czogXy5wYXJlbnRzLnNsaWNlKCAwICksXHJcblx0XHRcdHRyYW5zOiBfLnRyYW5zLFxyXG5cdFx0XHRwaXZvdDogXy5waXZvdCxcclxuXHRcdH19KTtcclxuXHJcblx0XHRpZiggXy5waXZvdCApXHJcblx0XHRcdHRoaXMudW5waXZvdCggZnJvemVuICk7XHJcblxyXG5cdFx0cmV0dXJuIGZyb3plbjtcclxuXHR9LFxyXG5cclxuXHRyZWZyZXNoUGFyZW50czogZnVuY3Rpb24oIG9sZENoaWxkLCBuZXdDaGlsZCApe1xyXG5cdFx0dmFyIF8gPSBvbGRDaGlsZC5fXyxcclxuXHRcdFx0cGFyZW50cyA9IF8ucGFyZW50cy5sZW5ndGgsXHJcblx0XHRcdGlcclxuXHRcdDtcclxuXHJcblx0XHRpZiggb2xkQ2hpbGQuX18udXBkYXRlUm9vdCApe1xyXG5cdFx0XHRvbGRDaGlsZC5fXy51cGRhdGVSb290KCBvbGRDaGlsZCwgbmV3Q2hpbGQgKTtcclxuXHRcdH1cclxuXHRcdGlmKCBuZXdDaGlsZCApe1xyXG5cdFx0XHR0aGlzLnRyaWdnZXIoIG9sZENoaWxkLCAndXBkYXRlJywgbmV3Q2hpbGQsIF8uc3RvcmUubGl2ZSApO1xyXG5cdFx0fVxyXG5cdFx0aWYoIHBhcmVudHMgKXtcclxuXHRcdFx0Zm9yIChpID0gcGFyZW50cyAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcblx0XHRcdFx0dGhpcy5yZWZyZXNoKCBfLnBhcmVudHNbaV0sIG9sZENoaWxkLCBuZXdDaGlsZCApO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0cmVtb3ZlUGFyZW50OiBmdW5jdGlvbiggbm9kZSwgcGFyZW50ICl7XHJcblx0XHR2YXIgcGFyZW50cyA9IG5vZGUuX18ucGFyZW50cyxcclxuXHRcdFx0aW5kZXggPSBwYXJlbnRzLmluZGV4T2YoIHBhcmVudCApXHJcblx0XHQ7XHJcblxyXG5cdFx0aWYoIGluZGV4ICE9IC0xICl7XHJcblx0XHRcdHBhcmVudHMuc3BsaWNlKCBpbmRleCwgMSApO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdGFkZFBhcmVudDogZnVuY3Rpb24oIG5vZGUsIHBhcmVudCApe1xyXG5cdFx0dmFyIHBhcmVudHMgPSBub2RlLl9fLnBhcmVudHMsXHJcblx0XHRcdGluZGV4ID0gcGFyZW50cy5pbmRleE9mKCBwYXJlbnQgKVxyXG5cdFx0O1xyXG5cclxuXHRcdGlmKCBpbmRleCA9PSAtMSApe1xyXG5cdFx0XHRwYXJlbnRzWyBwYXJlbnRzLmxlbmd0aCBdID0gcGFyZW50O1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdHRyaWdnZXI6IGZ1bmN0aW9uKCBub2RlLCBldmVudE5hbWUsIHBhcmFtLCBub3cgKXtcclxuXHRcdHZhciBsaXN0ZW5lciA9IG5vZGUuX18ubGlzdGVuZXI7XHJcblx0XHRpZiggIWxpc3RlbmVyIClcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdHZhciB0aWNraW5nID0gbGlzdGVuZXIudGlja2luZztcclxuXHJcblx0XHRpZiggbm93ICl7XHJcblx0XHRcdGlmKCB0aWNraW5nIHx8IHBhcmFtICl7XHJcblx0XHRcdFx0bGlzdGVuZXIudGlja2luZyA9IDA7XHJcblx0XHRcdFx0bGlzdGVuZXIudHJpZ2dlciggZXZlbnROYW1lLCB0aWNraW5nIHx8IHBhcmFtLCBub2RlICk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxpc3RlbmVyLnRpY2tpbmcgPSBwYXJhbTtcclxuXHRcdGlmKCAhbGlzdGVuZXIucHJldlN0YXRlICl7XHJcblx0XHRcdGxpc3RlbmVyLnByZXZTdGF0ZSA9IG5vZGU7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYoICF0aWNraW5nICl7XHJcblx0XHRcdFV0aWxzLm5leHRUaWNrKCBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGlmKCBsaXN0ZW5lci50aWNraW5nICl7XHJcblx0XHRcdFx0XHR2YXIgdXBkYXRlZCA9IGxpc3RlbmVyLnRpY2tpbmcsXHJcblx0XHRcdFx0XHRcdHByZXZTdGF0ZSA9IGxpc3RlbmVyLnByZXZTdGF0ZVxyXG5cdFx0XHRcdFx0O1xyXG5cclxuXHRcdFx0XHRcdGxpc3RlbmVyLnRpY2tpbmcgPSAwO1xyXG5cdFx0XHRcdFx0bGlzdGVuZXIucHJldlN0YXRlID0gMDtcclxuXHJcblx0XHRcdFx0XHRsaXN0ZW5lci50cmlnZ2VyKCBldmVudE5hbWUsIHVwZGF0ZWQsIG5vZGUgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdGNyZWF0ZUxpc3RlbmVyOiBmdW5jdGlvbiggZnJvemVuICl7XHJcblx0XHR2YXIgbCA9IGZyb3plbi5fXy5saXN0ZW5lcjtcclxuXHJcblx0XHRpZiggIWwgKSB7XHJcblx0XHRcdGwgPSBPYmplY3QuY3JlYXRlKEVtaXR0ZXIsIHtcclxuXHRcdFx0XHRfZXZlbnRzOiB7XHJcblx0XHRcdFx0XHR2YWx1ZToge30sXHJcblx0XHRcdFx0XHR3cml0YWJsZTogdHJ1ZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRmcm96ZW4uX18ubGlzdGVuZXIgPSBsO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBsO1xyXG5cdH1cclxufTtcclxuXHJcbm5vZGVDcmVhdG9yLmluaXQoIEZyb3plbiApO1xyXG4vLyNidWlsZFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGcm96ZW47XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBVdGlscyA9IHJlcXVpcmUoICcuL3V0aWxzLmpzJyApO1xyXG5cclxuLy8jYnVpbGRcclxudmFyIG5vZGVDcmVhdG9yID0ge1xyXG5cdGluaXQ6IGZ1bmN0aW9uKCBGcm96ZW4gKXtcclxuXHJcblx0XHR2YXIgY29tbW9uTWV0aG9kcyA9IHtcclxuXHRcdFx0c2V0OiBmdW5jdGlvbiggYXR0ciwgdmFsdWUgKXtcclxuXHRcdFx0XHR2YXIgYXR0cnMgPSBhdHRyLFxyXG5cdFx0XHRcdFx0dXBkYXRlID0gdGhpcy5fXy50cmFuc1xyXG5cdFx0XHRcdDtcclxuXHJcblx0XHRcdFx0aWYoIHR5cGVvZiBhdHRyICE9ICdvYmplY3QnICl7XHJcblx0XHRcdFx0XHRhdHRycyA9IHt9O1xyXG5cdFx0XHRcdFx0YXR0cnNbIGF0dHIgXSA9IHZhbHVlO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYoICF1cGRhdGUgKXtcclxuXHRcdFx0XHRcdGZvciggdmFyIGtleSBpbiBhdHRycyApe1xyXG5cdFx0XHRcdFx0XHR1cGRhdGUgPSB1cGRhdGUgfHwgdGhpc1sga2V5IF0gIT09IGF0dHJzWyBrZXkgXTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHQvLyBObyBjaGFuZ2VzLCBqdXN0IHJldHVybiB0aGUgbm9kZVxyXG5cdFx0XHRcdFx0aWYoICF1cGRhdGUgKVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gVXRpbHMuZmluZFBpdm90KCB0aGlzICkgfHwgdGhpcztcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ21lcmdlJywgdGhpcywgYXR0cnMgKTtcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHJlc2V0OiBmdW5jdGlvbiggYXR0cnMgKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX18uc3RvcmUubm90aWZ5KCAncmVwbGFjZScsIHRoaXMsIGF0dHJzICk7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRnZXRMaXN0ZW5lcjogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRyZXR1cm4gRnJvemVuLmNyZWF0ZUxpc3RlbmVyKCB0aGlzICk7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHR0b0pTOiBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdHZhciBqcztcclxuXHRcdFx0XHRpZiggdGhpcy5jb25zdHJ1Y3RvciA9PSBBcnJheSApe1xyXG5cdFx0XHRcdFx0anMgPSBuZXcgQXJyYXkoIHRoaXMubGVuZ3RoICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0anMgPSB7fTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFV0aWxzLmVhY2goIHRoaXMsIGZ1bmN0aW9uKCBjaGlsZCwgaSApe1xyXG5cdFx0XHRcdFx0aWYoIGNoaWxkICYmIGNoaWxkLl9fIClcclxuXHRcdFx0XHRcdFx0anNbIGkgXSA9IGNoaWxkLnRvSlMoKTtcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0anNbIGkgXSA9IGNoaWxkO1xyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4ganM7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHR0cmFuc2FjdDogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fXy5zdG9yZS5ub3RpZnkoICd0cmFuc2FjdCcsIHRoaXMgKTtcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHJ1bjogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fXy5zdG9yZS5ub3RpZnkoICdydW4nLCB0aGlzICk7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRub3c6IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX18uc3RvcmUubm90aWZ5KCAnbm93JywgdGhpcyApO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0cGl2b3Q6IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX18uc3RvcmUubm90aWZ5KCAncGl2b3QnLCB0aGlzICk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdFx0dmFyIGFycmF5TWV0aG9kcyA9IFV0aWxzLmV4dGVuZCh7XHJcblx0XHRcdHB1c2g6IGZ1bmN0aW9uKCBlbCApe1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFwcGVuZCggW2VsXSApO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0YXBwZW5kOiBmdW5jdGlvbiggZWxzICl7XHJcblx0XHRcdFx0aWYoIGVscyAmJiBlbHMubGVuZ3RoIClcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3NwbGljZScsIHRoaXMsIFt0aGlzLmxlbmd0aCwgMF0uY29uY2F0KCBlbHMgKSApO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0cG9wOiBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGlmKCAhdGhpcy5sZW5ndGggKVxyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblxyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3NwbGljZScsIHRoaXMsIFt0aGlzLmxlbmd0aCAtMSwgMV0gKTtcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHVuc2hpZnQ6IGZ1bmN0aW9uKCBlbCApe1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnByZXBlbmQoIFtlbF0gKTtcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHByZXBlbmQ6IGZ1bmN0aW9uKCBlbHMgKXtcclxuXHRcdFx0XHRpZiggZWxzICYmIGVscy5sZW5ndGggKVxyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuX18uc3RvcmUubm90aWZ5KCAnc3BsaWNlJywgdGhpcywgWzAsIDBdLmNvbmNhdCggZWxzICkgKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHNoaWZ0OiBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGlmKCAhdGhpcy5sZW5ndGggKVxyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblxyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3NwbGljZScsIHRoaXMsIFswLCAxXSApO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0c3BsaWNlOiBmdW5jdGlvbiggaW5kZXgsIHRvUmVtb3ZlLCB0b0FkZCApe1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3NwbGljZScsIHRoaXMsIGFyZ3VtZW50cyApO1xyXG5cdFx0XHR9XHJcblx0XHR9LCBjb21tb25NZXRob2RzICk7XHJcblxyXG5cdFx0dmFyIEZyb3plbkFycmF5ID0gT2JqZWN0LmNyZWF0ZSggQXJyYXkucHJvdG90eXBlLCBVdGlscy5jcmVhdGVORSggYXJyYXlNZXRob2RzICkgKTtcclxuXHJcblx0XHR2YXIgb2JqZWN0TWV0aG9kcyA9IFV0aWxzLmNyZWF0ZU5FKCBVdGlscy5leHRlbmQoe1xyXG5cdFx0XHRyZW1vdmU6IGZ1bmN0aW9uKCBrZXlzICl7XHJcblx0XHRcdFx0dmFyIGZpbHRlcmVkID0gW10sXHJcblx0XHRcdFx0XHRrID0ga2V5c1xyXG5cdFx0XHRcdDtcclxuXHJcblx0XHRcdFx0aWYoIGtleXMuY29uc3RydWN0b3IgIT0gQXJyYXkgKVxyXG5cdFx0XHRcdFx0ayA9IFsga2V5cyBdO1xyXG5cclxuXHRcdFx0XHRmb3IoIHZhciBpID0gMCwgbCA9IGsubGVuZ3RoOyBpPGw7IGkrKyApe1xyXG5cdFx0XHRcdFx0aWYoIHRoaXMuaGFzT3duUHJvcGVydHkoIGtbaV0gKSApXHJcblx0XHRcdFx0XHRcdGZpbHRlcmVkLnB1c2goIGtbaV0gKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmKCBmaWx0ZXJlZC5sZW5ndGggKVxyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuX18uc3RvcmUubm90aWZ5KCAncmVtb3ZlJywgdGhpcywgZmlsdGVyZWQgKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdFx0fVxyXG5cdFx0fSwgY29tbW9uTWV0aG9kcykpO1xyXG5cclxuXHRcdHZhciBGcm96ZW5PYmplY3QgPSBPYmplY3QuY3JlYXRlKCBPYmplY3QucHJvdG90eXBlLCBvYmplY3RNZXRob2RzICk7XHJcblxyXG5cdFx0dmFyIGNyZWF0ZUFycmF5ID0gKGZ1bmN0aW9uKCl7XHJcblx0XHRcdC8vIGZhc3QgdmVyc2lvblxyXG5cdFx0XHRpZiggW10uX19wcm90b19fIClcclxuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oIGxlbmd0aCApe1xyXG5cdFx0XHRcdFx0dmFyIGFyciA9IG5ldyBBcnJheSggbGVuZ3RoICk7XHJcblx0XHRcdFx0XHRhcnIuX19wcm90b19fID0gRnJvemVuQXJyYXk7XHJcblx0XHRcdFx0XHRyZXR1cm4gYXJyO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdC8vIHNsb3cgdmVyc2lvbiBmb3Igb2xkZXIgYnJvd3NlcnNcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCBsZW5ndGggKXtcclxuXHRcdFx0XHR2YXIgYXJyID0gbmV3IEFycmF5KCBsZW5ndGggKTtcclxuXHJcblx0XHRcdFx0Zm9yKCB2YXIgbSBpbiBhcnJheU1ldGhvZHMgKXtcclxuXHRcdFx0XHRcdGFyclsgbSBdID0gYXJyYXlNZXRob2RzWyBtIF07XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXR1cm4gYXJyO1xyXG5cdFx0XHR9XHJcblx0XHR9KSgpO1xyXG5cclxuXHRcdHRoaXMuY2xvbmUgPSBmdW5jdGlvbiggbm9kZSApe1xyXG5cdFx0XHR2YXIgY29ucyA9IG5vZGUuY29uc3RydWN0b3I7XHJcblx0XHRcdGlmKCBjb25zID09IEFycmF5ICl7XHJcblx0XHRcdFx0cmV0dXJuIGNyZWF0ZUFycmF5KCBub2RlLmxlbmd0aCApO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGlmKCBjb25zID09PSBPYmplY3QgKXtcclxuXHRcdFx0XHRcdHJldHVybiBPYmplY3QuY3JlYXRlKCBGcm96ZW5PYmplY3QgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly8gQ2xhc3MgaW5zdGFuY2VzXHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gT2JqZWN0LmNyZWF0ZSggY29ucy5wcm90b3R5cGUsIG9iamVjdE1ldGhvZHMgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcbn1cclxuLy8jYnVpbGRcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbm9kZUNyZWF0b3I7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8vI2J1aWxkXHJcbnZhciBnbG9iYWwgPSAobmV3IEZ1bmN0aW9uKFwicmV0dXJuIHRoaXNcIikoKSk7XHJcblxyXG52YXIgVXRpbHMgPSB7XHJcblx0ZXh0ZW5kOiBmdW5jdGlvbiggb2IsIHByb3BzICl7XHJcblx0XHRmb3IoIHZhciBwIGluIHByb3BzICl7XHJcblx0XHRcdG9iW3BdID0gcHJvcHNbcF07XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gb2I7XHJcblx0fSxcclxuXHJcblx0Y3JlYXRlTm9uRW51bWVyYWJsZTogZnVuY3Rpb24oIG9iaiwgcHJvdG8gKXtcclxuXHRcdHZhciBuZSA9IHt9O1xyXG5cdFx0Zm9yKCB2YXIga2V5IGluIG9iaiApXHJcblx0XHRcdG5lW2tleV0gPSB7dmFsdWU6IG9ialtrZXldIH07XHJcblx0XHRyZXR1cm4gT2JqZWN0LmNyZWF0ZSggcHJvdG8gfHwge30sIG5lICk7XHJcblx0fSxcclxuXHJcblx0ZXJyb3I6IGZ1bmN0aW9uKCBtZXNzYWdlICl7XHJcblx0XHR2YXIgZXJyID0gbmV3IEVycm9yKCBtZXNzYWdlICk7XHJcblx0XHRpZiggY29uc29sZSApXHJcblx0XHRcdHJldHVybiBjb25zb2xlLmVycm9yKCBlcnIgKTtcclxuXHRcdGVsc2VcclxuXHRcdFx0dGhyb3cgZXJyO1xyXG5cdH0sXHJcblxyXG5cdGVhY2g6IGZ1bmN0aW9uKCBvLCBjbGJrICl7XHJcblx0XHR2YXIgaSxsLGtleXM7XHJcblx0XHRpZiggbyAmJiBvLmNvbnN0cnVjdG9yID09IEFycmF5ICl7XHJcblx0XHRcdGZvciAoaSA9IDAsIGwgPSBvLmxlbmd0aDsgaSA8IGw7IGkrKylcclxuXHRcdFx0XHRjbGJrKCBvW2ldLCBpICk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0a2V5cyA9IE9iamVjdC5rZXlzKCBvICk7XHJcblx0XHRcdGZvciggaSA9IDAsIGwgPSBrZXlzLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcblx0XHRcdFx0Y2xiayggb1sga2V5c1tpXSBdLCBrZXlzW2ldICk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0YWRkTkU6IGZ1bmN0aW9uKCBub2RlLCBhdHRycyApe1xyXG5cdFx0Zm9yKCB2YXIga2V5IGluIGF0dHJzICl7XHJcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggbm9kZSwga2V5LCB7XHJcblx0XHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXHJcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdHdyaXRhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdHZhbHVlOiBhdHRyc1sga2V5IF1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogQ3JlYXRlcyBub24tZW51bWVyYWJsZSBwcm9wZXJ0eSBkZXNjcmlwdG9ycywgdG8gYmUgdXNlZCBieSBPYmplY3QuY3JlYXRlLlxyXG5cdCAqIEBwYXJhbSAge09iamVjdH0gYXR0cnMgUHJvcGVydGllcyB0byBjcmVhdGUgZGVzY3JpcHRvcnNcclxuXHQgKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgIEEgaGFzaCB3aXRoIHRoZSBkZXNjcmlwdG9ycy5cclxuXHQgKi9cclxuXHRjcmVhdGVORTogZnVuY3Rpb24oIGF0dHJzICl7XHJcblx0XHR2YXIgbmUgPSB7fTtcclxuXHJcblx0XHRmb3IoIHZhciBrZXkgaW4gYXR0cnMgKXtcclxuXHRcdFx0bmVbIGtleSBdID0ge1xyXG5cdFx0XHRcdHdyaXRhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcclxuXHRcdFx0XHR2YWx1ZTogYXR0cnNbIGtleSBdXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbmU7XHJcblx0fSxcclxuXHJcblx0Ly8gbmV4dFRpY2sgLSBieSBzdGFnYXMgLyBwdWJsaWMgZG9tYWluXHJcblx0bmV4dFRpY2s6IChmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgcXVldWUgPSBbXSxcclxuXHRcdGRpcnR5ID0gZmFsc2UsXHJcblx0XHRmbixcclxuXHRcdGhhc1Bvc3RNZXNzYWdlID0gISFnbG9iYWwucG9zdE1lc3NhZ2UgJiYgKHR5cGVvZiBXaW5kb3cgIT0gJ3VuZGVmaW5lZCcpICYmIChnbG9iYWwgaW5zdGFuY2VvZiBXaW5kb3cpLFxyXG5cdFx0bWVzc2FnZU5hbWUgPSAnbmV4dHRpY2snLFxyXG5cdFx0dHJpZ2dlciA9IChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHJldHVybiBoYXNQb3N0TWVzc2FnZVxyXG5cdFx0XHRcdD8gZnVuY3Rpb24gdHJpZ2dlciAoKSB7XHJcblx0XHRcdFx0Z2xvYmFsLnBvc3RNZXNzYWdlKG1lc3NhZ2VOYW1lLCAnKicpO1xyXG5cdFx0XHR9XHJcblx0XHRcdDogZnVuY3Rpb24gdHJpZ2dlciAoKSB7XHJcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7IHByb2Nlc3NRdWV1ZSgpIH0sIDApO1xyXG5cdFx0XHR9O1xyXG5cdFx0fSgpKSxcclxuXHRcdHByb2Nlc3NRdWV1ZSA9IChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHJldHVybiBoYXNQb3N0TWVzc2FnZVxyXG5cdFx0XHRcdD8gZnVuY3Rpb24gcHJvY2Vzc1F1ZXVlIChldmVudCkge1xyXG5cdFx0XHRcdFx0aWYgKGV2ZW50LnNvdXJjZSA9PT0gZ2xvYmFsICYmIGV2ZW50LmRhdGEgPT09IG1lc3NhZ2VOYW1lKSB7XHJcblx0XHRcdFx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0XHRcdFx0XHRmbHVzaFF1ZXVlKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdDogZmx1c2hRdWV1ZTtcclxuICAgIFx0fSkoKVxyXG4gICAgO1xyXG5cclxuICAgIGZ1bmN0aW9uIGZsdXNoUXVldWUgKCkge1xyXG4gICAgICAgIHdoaWxlIChmbiA9IHF1ZXVlLnNoaWZ0KCkpIHtcclxuICAgICAgICAgICAgZm4oKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGlydHkgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBuZXh0VGljayAoZm4pIHtcclxuICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcclxuICAgICAgICBpZiAoZGlydHkpIHJldHVybjtcclxuICAgICAgICBkaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgdHJpZ2dlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChoYXNQb3N0TWVzc2FnZSkgZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBwcm9jZXNzUXVldWUsIHRydWUpO1xyXG5cclxuICAgIG5leHRUaWNrLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGdsb2JhbC5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcHJvY2Vzc1F1ZXVlLCB0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV4dFRpY2s7XHJcbiAgfSkoKSxcclxuXHJcbiAgZmluZFBpdm90OiBmdW5jdGlvbiggbm9kZSApe1xyXG4gIFx0XHRpZiggIW5vZGUgfHwgIW5vZGUuX18gKVxyXG4gIFx0XHRcdHJldHVybjtcclxuXHJcbiAgXHRcdGlmKCBub2RlLl9fLnBpdm90IClcclxuICBcdFx0XHRyZXR1cm4gbm9kZTtcclxuXHJcbiAgXHRcdHZhciBmb3VuZCA9IDAsXHJcbiAgXHRcdFx0cGFyZW50cyA9IG5vZGUuX18ucGFyZW50cyxcclxuICBcdFx0XHRpID0gMCxcclxuICBcdFx0XHRwYXJlbnRcclxuICBcdFx0O1xyXG5cclxuICBcdFx0Ly8gTG9vayB1cCBmb3IgdGhlIHBpdm90IGluIHRoZSBwYXJlbnRzXHJcbiAgXHRcdHdoaWxlKCAhZm91bmQgJiYgaSA8IHBhcmVudHMubGVuZ3RoICl7XHJcbiAgXHRcdFx0cGFyZW50ID0gcGFyZW50c1tpXTtcclxuICBcdFx0XHRpZiggcGFyZW50Ll9fLnBpdm90IClcclxuICBcdFx0XHRcdGZvdW5kID0gcGFyZW50O1xyXG4gIFx0XHRcdGkrKztcclxuICBcdFx0fVxyXG5cclxuICBcdFx0aWYoIGZvdW5kICl7XHJcbiAgXHRcdFx0cmV0dXJuIGZvdW5kO1xyXG4gIFx0XHR9XHJcblxyXG4gIFx0XHQvLyBJZiBub3QgZm91bmQsIHRyeSB3aXRoIHRoZSBwYXJlbnQncyBwYXJlbnRzXHJcbiAgXHRcdGk9MDtcclxuICBcdFx0d2hpbGUoICFmb3VuZCAmJiBpIDwgcGFyZW50cy5sZW5ndGggKXtcclxuXHQgIFx0XHRmb3VuZCA9IHRoaXMuZmluZFBpdm90KCBwYXJlbnRzW2ldICk7XHJcblx0ICBcdFx0aSsrO1xyXG5cdCAgXHR9XHJcblxyXG4gIFx0XHRyZXR1cm4gZm91bmQ7XHJcbiAgfSxcclxuXHJcblx0aXNMZWFmOiBmdW5jdGlvbiggbm9kZSwgZnJlZXplSW5zdGFuY2VzICl7XHJcblx0XHR2YXIgY29ucztcclxuXHRcdHJldHVybiAhbm9kZSB8fCAhKGNvbnMgPSBub2RlLmNvbnN0cnVjdG9yKSB8fCAoZnJlZXplSW5zdGFuY2VzID9cclxuXHRcdFx0KGNvbnMgPT09IFN0cmluZyB8fCBjb25zID09PSBOdW1iZXIgfHwgY29ucyA9PT0gQm9vbGVhbikgOlxyXG5cdFx0XHQoY29ucyAhPSBPYmplY3QgJiYgY29ucyAhPSBBcnJheSlcclxuXHRcdCk7XHJcblx0fVxyXG59O1xyXG4vLyNidWlsZFxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVXRpbHM7XHJcbiIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpXG5cbnZhciBJTkRFTlRfU1RBUlQgPSAvW1xce1xcW10vXG52YXIgSU5ERU5UX0VORCA9IC9bXFx9XFxdXS9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGxpbmVzID0gW11cbiAgdmFyIGluZGVudCA9IDBcblxuICB2YXIgcHVzaCA9IGZ1bmN0aW9uKHN0cikge1xuICAgIHZhciBzcGFjZXMgPSAnJ1xuICAgIHdoaWxlIChzcGFjZXMubGVuZ3RoIDwgaW5kZW50KjIpIHNwYWNlcyArPSAnICAnXG4gICAgbGluZXMucHVzaChzcGFjZXMrc3RyKVxuICB9XG5cbiAgdmFyIGxpbmUgPSBmdW5jdGlvbihmbXQpIHtcbiAgICBpZiAoIWZtdCkgcmV0dXJuIGxpbmVcblxuICAgIGlmIChJTkRFTlRfRU5ELnRlc3QoZm10LnRyaW0oKVswXSkgJiYgSU5ERU5UX1NUQVJULnRlc3QoZm10W2ZtdC5sZW5ndGgtMV0pKSB7XG4gICAgICBpbmRlbnQtLVxuICAgICAgcHVzaCh1dGlsLmZvcm1hdC5hcHBseSh1dGlsLCBhcmd1bWVudHMpKVxuICAgICAgaW5kZW50KytcbiAgICAgIHJldHVybiBsaW5lXG4gICAgfVxuICAgIGlmIChJTkRFTlRfU1RBUlQudGVzdChmbXRbZm10Lmxlbmd0aC0xXSkpIHtcbiAgICAgIHB1c2godXRpbC5mb3JtYXQuYXBwbHkodXRpbCwgYXJndW1lbnRzKSlcbiAgICAgIGluZGVudCsrXG4gICAgICByZXR1cm4gbGluZVxuICAgIH1cbiAgICBpZiAoSU5ERU5UX0VORC50ZXN0KGZtdC50cmltKClbMF0pKSB7XG4gICAgICBpbmRlbnQtLVxuICAgICAgcHVzaCh1dGlsLmZvcm1hdC5hcHBseSh1dGlsLCBhcmd1bWVudHMpKVxuICAgICAgcmV0dXJuIGxpbmVcbiAgICB9XG5cbiAgICBwdXNoKHV0aWwuZm9ybWF0LmFwcGx5KHV0aWwsIGFyZ3VtZW50cykpXG4gICAgcmV0dXJuIGxpbmVcbiAgfVxuXG4gIGxpbmUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbGluZXMuam9pbignXFxuJylcbiAgfVxuXG4gIGxpbmUudG9GdW5jdGlvbiA9IGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgdmFyIHNyYyA9ICdyZXR1cm4gKCcrbGluZS50b1N0cmluZygpKycpJ1xuXG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhzY29wZSB8fCB7fSkubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGtleVxuICAgIH0pXG5cbiAgICB2YXIgdmFscyA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIHNjb3BlW2tleV1cbiAgICB9KVxuXG4gICAgcmV0dXJuIEZ1bmN0aW9uLmFwcGx5KG51bGwsIGtleXMuY29uY2F0KHNyYykpLmFwcGx5KG51bGwsIHZhbHMpXG4gIH1cblxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgbGluZS5hcHBseShudWxsLCBhcmd1bWVudHMpXG5cbiAgcmV0dXJuIGxpbmVcbn1cbiIsInZhciBpc1Byb3BlcnR5ID0gcmVxdWlyZSgnaXMtcHJvcGVydHknKVxuXG52YXIgZ2VuID0gZnVuY3Rpb24ob2JqLCBwcm9wKSB7XG4gIHJldHVybiBpc1Byb3BlcnR5KHByb3ApID8gb2JqKycuJytwcm9wIDogb2JqKydbJytKU09OLnN0cmluZ2lmeShwcm9wKSsnXSdcbn1cblxuZ2VuLnZhbGlkID0gaXNQcm9wZXJ0eVxuZ2VuLnByb3BlcnR5ID0gZnVuY3Rpb24gKHByb3ApIHtcbiByZXR1cm4gaXNQcm9wZXJ0eShwcm9wKSA/IHByb3AgOiBKU09OLnN0cmluZ2lmeShwcm9wKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdlblxuIiwiXG4vKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBBIGNhY2hlZCByZWZlcmVuY2UgdG8gdGhlIGhhc093blByb3BlcnR5IGZ1bmN0aW9uLlxuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIEEgY29uc3RydWN0b3IgZnVuY3Rpb24gdGhhdCB3aWxsIGNyZWF0ZSBibGFuayBvYmplY3RzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEJsYW5rKCkge31cblxuQmxhbmsucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuLyoqXG4gKiBVc2VkIHRvIHByZXZlbnQgcHJvcGVydHkgY29sbGlzaW9ucyBiZXR3ZWVuIG91ciBcIm1hcFwiIGFuZCBpdHMgcHJvdG90eXBlLlxuICogQHBhcmFtIHshT2JqZWN0PHN0cmluZywgKj59IG1hcCBUaGUgbWFwIHRvIGNoZWNrLlxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBwcm9wZXJ0eSB0byBjaGVjay5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgbWFwIGhhcyBwcm9wZXJ0eS5cbiAqL1xudmFyIGhhcyA9IGZ1bmN0aW9uIChtYXAsIHByb3BlcnR5KSB7XG4gIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG1hcCwgcHJvcGVydHkpO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIG1hcCBvYmplY3Qgd2l0aG91dCBhIHByb3RvdHlwZS5cbiAqIEByZXR1cm4geyFPYmplY3R9XG4gKi9cbnZhciBjcmVhdGVNYXAgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBuZXcgQmxhbmsoKTtcbn07XG5cbi8qKlxuICogS2VlcHMgdHJhY2sgb2YgaW5mb3JtYXRpb24gbmVlZGVkIHRvIHBlcmZvcm0gZGlmZnMgZm9yIGEgZ2l2ZW4gRE9NIG5vZGUuXG4gKiBAcGFyYW0geyFzdHJpbmd9IG5vZGVOYW1lXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBOb2RlRGF0YShub2RlTmFtZSwga2V5KSB7XG4gIC8qKlxuICAgKiBUaGUgYXR0cmlidXRlcyBhbmQgdGhlaXIgdmFsdWVzLlxuICAgKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCAqPn1cbiAgICovXG4gIHRoaXMuYXR0cnMgPSBjcmVhdGVNYXAoKTtcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMsIHVzZWQgZm9yIHF1aWNrbHkgZGlmZmluZyB0aGVcbiAgICogaW5jb21taW5nIGF0dHJpYnV0ZXMgdG8gc2VlIGlmIHRoZSBET00gbm9kZSdzIGF0dHJpYnV0ZXMgbmVlZCB0byBiZVxuICAgKiB1cGRhdGVkLlxuICAgKiBAY29uc3Qge0FycmF5PCo+fVxuICAgKi9cbiAgdGhpcy5hdHRyc0FyciA9IFtdO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5jb21pbmcgYXR0cmlidXRlcyBmb3IgdGhpcyBOb2RlLCBiZWZvcmUgdGhleSBhcmUgdXBkYXRlZC5cbiAgICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgKj59XG4gICAqL1xuICB0aGlzLm5ld0F0dHJzID0gY3JlYXRlTWFwKCk7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBzdGF0aWNzIGhhdmUgYmVlbiBhcHBsaWVkIGZvciB0aGUgbm9kZSB5ZXQuXG4gICAqIHtib29sZWFufVxuICAgKi9cbiAgdGhpcy5zdGF0aWNzQXBwbGllZCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBub2RlLCB1c2VkIHRvIHByZXNlcnZlIERPTSBub2RlcyB3aGVuIHRoZXlcbiAgICogbW92ZSB3aXRoaW4gdGhlaXIgcGFyZW50LlxuICAgKiBAY29uc3RcbiAgICovXG4gIHRoaXMua2V5ID0ga2V5O1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiBjaGlsZHJlbiB3aXRoaW4gdGhpcyBub2RlIGJ5IHRoZWlyIGtleS5cbiAgICogeyFPYmplY3Q8c3RyaW5nLCAhRWxlbWVudD59XG4gICAqL1xuICB0aGlzLmtleU1hcCA9IGNyZWF0ZU1hcCgpO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUga2V5TWFwIGlzIGN1cnJlbnRseSB2YWxpZC5cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmtleU1hcFZhbGlkID0gdHJ1ZTtcblxuICAvKipcbiAgICogV2hldGhlciBvciB0aGUgYXNzb2NpYXRlZCBub2RlIGlzLCBvciBjb250YWlucywgYSBmb2N1c2VkIEVsZW1lbnQuXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgdGhpcy5mb2N1c2VkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFRoZSBub2RlIG5hbWUgZm9yIHRoaXMgbm9kZS5cbiAgICogQGNvbnN0IHtzdHJpbmd9XG4gICAqL1xuICB0aGlzLm5vZGVOYW1lID0gbm9kZU5hbWU7XG5cbiAgLyoqXG4gICAqIEB0eXBlIHs/c3RyaW5nfVxuICAgKi9cbiAgdGhpcy50ZXh0ID0gbnVsbDtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyBhIE5vZGVEYXRhIG9iamVjdCBmb3IgYSBOb2RlLlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgbm9kZSB0byBpbml0aWFsaXplIGRhdGEgZm9yLlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVOYW1lIFRoZSBub2RlIG5hbWUgb2Ygbm9kZS5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHRoYXQgaWRlbnRpZmllcyB0aGUgbm9kZS5cbiAqIEByZXR1cm4geyFOb2RlRGF0YX0gVGhlIG5ld2x5IGluaXRpYWxpemVkIGRhdGEgb2JqZWN0XG4gKi9cbnZhciBpbml0RGF0YSA9IGZ1bmN0aW9uIChub2RlLCBub2RlTmFtZSwga2V5KSB7XG4gIHZhciBkYXRhID0gbmV3IE5vZGVEYXRhKG5vZGVOYW1lLCBrZXkpO1xuICBub2RlWydfX2luY3JlbWVudGFsRE9NRGF0YSddID0gZGF0YTtcbiAgcmV0dXJuIGRhdGE7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgTm9kZURhdGEgb2JqZWN0IGZvciBhIE5vZGUsIGNyZWF0aW5nIGl0IGlmIG5lY2Vzc2FyeS5cbiAqXG4gKiBAcGFyYW0gez9Ob2RlfSBub2RlIFRoZSBOb2RlIHRvIHJldHJpZXZlIHRoZSBkYXRhIGZvci5cbiAqIEByZXR1cm4geyFOb2RlRGF0YX0gVGhlIE5vZGVEYXRhIGZvciB0aGlzIE5vZGUuXG4gKi9cbnZhciBnZXREYXRhID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgaW1wb3J0Tm9kZShub2RlKTtcbiAgcmV0dXJuIG5vZGVbJ19faW5jcmVtZW50YWxET01EYXRhJ107XG59O1xuXG4vKipcbiAqIEltcG9ydHMgbm9kZSBhbmQgaXRzIHN1YnRyZWUsIGluaXRpYWxpemluZyBjYWNoZXMuXG4gKlxuICogQHBhcmFtIHs/Tm9kZX0gbm9kZSBUaGUgTm9kZSB0byBpbXBvcnQuXG4gKi9cbnZhciBpbXBvcnROb2RlID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgaWYgKG5vZGVbJ19faW5jcmVtZW50YWxET01EYXRhJ10pIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgaXNFbGVtZW50ID0gbm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQ7XG4gIHZhciBub2RlTmFtZSA9IGlzRWxlbWVudCA/IG5vZGUubG9jYWxOYW1lIDogbm9kZS5ub2RlTmFtZTtcbiAgdmFyIGtleSA9IGlzRWxlbWVudCA/IG5vZGUuZ2V0QXR0cmlidXRlKCdrZXknKSA6IG51bGw7XG4gIHZhciBkYXRhID0gaW5pdERhdGEobm9kZSwgbm9kZU5hbWUsIGtleSk7XG5cbiAgaWYgKGtleSkge1xuICAgIGdldERhdGEobm9kZS5wYXJlbnROb2RlKS5rZXlNYXBba2V5XSA9IG5vZGU7XG4gIH1cblxuICBpZiAoaXNFbGVtZW50KSB7XG4gICAgdmFyIGF0dHJpYnV0ZXMgPSBub2RlLmF0dHJpYnV0ZXM7XG4gICAgdmFyIGF0dHJzID0gZGF0YS5hdHRycztcbiAgICB2YXIgbmV3QXR0cnMgPSBkYXRhLm5ld0F0dHJzO1xuICAgIHZhciBhdHRyc0FyciA9IGRhdGEuYXR0cnNBcnI7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJpYnV0ZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIHZhciBhdHRyID0gYXR0cmlidXRlc1tpXTtcbiAgICAgIHZhciBuYW1lID0gYXR0ci5uYW1lO1xuICAgICAgdmFyIHZhbHVlID0gYXR0ci52YWx1ZTtcblxuICAgICAgYXR0cnNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgIG5ld0F0dHJzW25hbWVdID0gdW5kZWZpbmVkO1xuICAgICAgYXR0cnNBcnIucHVzaChuYW1lKTtcbiAgICAgIGF0dHJzQXJyLnB1c2godmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAodmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgIGltcG9ydE5vZGUoY2hpbGQpO1xuICB9XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIG5hbWVzcGFjZSB0byBjcmVhdGUgYW4gZWxlbWVudCAob2YgYSBnaXZlbiB0YWcpIGluLlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIHRvIGdldCB0aGUgbmFtZXNwYWNlIGZvci5cbiAqIEBwYXJhbSB7P05vZGV9IHBhcmVudFxuICogQHJldHVybiB7P3N0cmluZ30gVGhlIG5hbWVzcGFjZSB0byBjcmVhdGUgdGhlIHRhZyBpbi5cbiAqL1xudmFyIGdldE5hbWVzcGFjZUZvclRhZyA9IGZ1bmN0aW9uICh0YWcsIHBhcmVudCkge1xuICBpZiAodGFnID09PSAnc3ZnJykge1xuICAgIHJldHVybiAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuICB9XG5cbiAgaWYgKGdldERhdGEocGFyZW50KS5ub2RlTmFtZSA9PT0gJ2ZvcmVpZ25PYmplY3QnKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gcGFyZW50Lm5hbWVzcGFjZVVSSTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50LlxuICogQHBhcmFtIHtEb2N1bWVudH0gZG9jIFRoZSBkb2N1bWVudCB3aXRoIHdoaWNoIHRvIGNyZWF0ZSB0aGUgRWxlbWVudC5cbiAqIEBwYXJhbSB7P05vZGV9IHBhcmVudFxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIGZvciB0aGUgRWxlbWVudC5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBBIGtleSB0byBpZGVudGlmeSB0aGUgRWxlbWVudC5cbiAqIEByZXR1cm4geyFFbGVtZW50fVxuICovXG52YXIgY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uIChkb2MsIHBhcmVudCwgdGFnLCBrZXkpIHtcbiAgdmFyIG5hbWVzcGFjZSA9IGdldE5hbWVzcGFjZUZvclRhZyh0YWcsIHBhcmVudCk7XG4gIHZhciBlbCA9IHVuZGVmaW5lZDtcblxuICBpZiAobmFtZXNwYWNlKSB7XG4gICAgZWwgPSBkb2MuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgdGFnKTtcbiAgfSBlbHNlIHtcbiAgICBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KHRhZyk7XG4gIH1cblxuICBpbml0RGF0YShlbCwgdGFnLCBrZXkpO1xuXG4gIHJldHVybiBlbDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRleHQgTm9kZS5cbiAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyBUaGUgZG9jdW1lbnQgd2l0aCB3aGljaCB0byBjcmVhdGUgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshVGV4dH1cbiAqL1xudmFyIGNyZWF0ZVRleHQgPSBmdW5jdGlvbiAoZG9jKSB7XG4gIHZhciBub2RlID0gZG9jLmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgaW5pdERhdGEobm9kZSwgJyN0ZXh0JywgbnVsbCk7XG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKiogQGNvbnN0ICovXG52YXIgbm90aWZpY2F0aW9ucyA9IHtcbiAgLyoqXG4gICAqIENhbGxlZCBhZnRlciBwYXRjaCBoYXMgY29tcGxlYXRlZCB3aXRoIGFueSBOb2RlcyB0aGF0IGhhdmUgYmVlbiBjcmVhdGVkXG4gICAqIGFuZCBhZGRlZCB0byB0aGUgRE9NLlxuICAgKiBAdHlwZSB7P2Z1bmN0aW9uKEFycmF5PCFOb2RlPil9XG4gICAqL1xuICBub2Rlc0NyZWF0ZWQ6IG51bGwsXG5cbiAgLyoqXG4gICAqIENhbGxlZCBhZnRlciBwYXRjaCBoYXMgY29tcGxlYXRlZCB3aXRoIGFueSBOb2RlcyB0aGF0IGhhdmUgYmVlbiByZW1vdmVkXG4gICAqIGZyb20gdGhlIERPTS5cbiAgICogTm90ZSBpdCdzIGFuIGFwcGxpY2F0aW9ucyByZXNwb25zaWJpbGl0eSB0byBoYW5kbGUgYW55IGNoaWxkTm9kZXMuXG4gICAqIEB0eXBlIHs/ZnVuY3Rpb24oQXJyYXk8IU5vZGU+KX1cbiAgICovXG4gIG5vZGVzRGVsZXRlZDogbnVsbFxufTtcblxuLyoqXG4gKiBLZWVwcyB0cmFjayBvZiB0aGUgc3RhdGUgb2YgYSBwYXRjaC5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBDb250ZXh0KCkge1xuICAvKipcbiAgICogQHR5cGUgeyhBcnJheTwhTm9kZT58dW5kZWZpbmVkKX1cbiAgICovXG4gIHRoaXMuY3JlYXRlZCA9IG5vdGlmaWNhdGlvbnMubm9kZXNDcmVhdGVkICYmIFtdO1xuXG4gIC8qKlxuICAgKiBAdHlwZSB7KEFycmF5PCFOb2RlPnx1bmRlZmluZWQpfVxuICAgKi9cbiAgdGhpcy5kZWxldGVkID0gbm90aWZpY2F0aW9ucy5ub2Rlc0RlbGV0ZWQgJiYgW107XG59XG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICovXG5Db250ZXh0LnByb3RvdHlwZS5tYXJrQ3JlYXRlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIGlmICh0aGlzLmNyZWF0ZWQpIHtcbiAgICB0aGlzLmNyZWF0ZWQucHVzaChub2RlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLm1hcmtEZWxldGVkID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgaWYgKHRoaXMuZGVsZXRlZCkge1xuICAgIHRoaXMuZGVsZXRlZC5wdXNoKG5vZGUpO1xuICB9XG59O1xuXG4vKipcbiAqIE5vdGlmaWVzIGFib3V0IG5vZGVzIHRoYXQgd2VyZSBjcmVhdGVkIGR1cmluZyB0aGUgcGF0Y2ggb3BlYXJhdGlvbi5cbiAqL1xuQ29udGV4dC5wcm90b3R5cGUubm90aWZ5Q2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuY3JlYXRlZCAmJiB0aGlzLmNyZWF0ZWQubGVuZ3RoID4gMCkge1xuICAgIG5vdGlmaWNhdGlvbnMubm9kZXNDcmVhdGVkKHRoaXMuY3JlYXRlZCk7XG4gIH1cblxuICBpZiAodGhpcy5kZWxldGVkICYmIHRoaXMuZGVsZXRlZC5sZW5ndGggPiAwKSB7XG4gICAgbm90aWZpY2F0aW9ucy5ub2Rlc0RlbGV0ZWQodGhpcy5kZWxldGVkKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAgKiBLZWVwcyB0cmFjayB3aGV0aGVyIG9yIG5vdCB3ZSBhcmUgaW4gYW4gYXR0cmlidXRlcyBkZWNsYXJhdGlvbiAoYWZ0ZXJcbiAgKiBlbGVtZW50T3BlblN0YXJ0LCBidXQgYmVmb3JlIGVsZW1lbnRPcGVuRW5kKS5cbiAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgKi9cbnZhciBpbkF0dHJpYnV0ZXMgPSBmYWxzZTtcblxuLyoqXG4gICogS2VlcHMgdHJhY2sgd2hldGhlciBvciBub3Qgd2UgYXJlIGluIGFuIGVsZW1lbnQgdGhhdCBzaG91bGQgbm90IGhhdmUgaXRzXG4gICogY2hpbGRyZW4gY2xlYXJlZC5cbiAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgKi9cbnZhciBpblNraXAgPSBmYWxzZTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgdGhlcmUgaXMgYSBjdXJyZW50IHBhdGNoIGNvbnRleHQuXG4gKiBAcGFyYW0ge3N0cmluZ30gZnVuY3Rpb25OYW1lXG4gKiBAcGFyYW0geyp9IGNvbnRleHRcbiAqL1xudmFyIGFzc2VydEluUGF0Y2ggPSBmdW5jdGlvbiAoZnVuY3Rpb25OYW1lLCBjb250ZXh0KSB7XG4gIGlmICghY29udGV4dCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNhbGwgJyArIGZ1bmN0aW9uTmFtZSArICcoKSB1bmxlc3MgaW4gcGF0Y2guJyk7XG4gIH1cbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IGEgcGF0Y2ggY2xvc2VzIGV2ZXJ5IG5vZGUgdGhhdCBpdCBvcGVuZWQuXG4gKiBAcGFyYW0gez9Ob2RlfSBvcGVuRWxlbWVudFxuICogQHBhcmFtIHshTm9kZXwhRG9jdW1lbnRGcmFnbWVudH0gcm9vdFxuICovXG52YXIgYXNzZXJ0Tm9VbmNsb3NlZFRhZ3MgPSBmdW5jdGlvbiAob3BlbkVsZW1lbnQsIHJvb3QpIHtcbiAgaWYgKG9wZW5FbGVtZW50ID09PSByb290KSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGN1cnJlbnRFbGVtZW50ID0gb3BlbkVsZW1lbnQ7XG4gIHZhciBvcGVuVGFncyA9IFtdO1xuICB3aGlsZSAoY3VycmVudEVsZW1lbnQgJiYgY3VycmVudEVsZW1lbnQgIT09IHJvb3QpIHtcbiAgICBvcGVuVGFncy5wdXNoKGN1cnJlbnRFbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpO1xuICAgIGN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcignT25lIG9yIG1vcmUgdGFncyB3ZXJlIG5vdCBjbG9zZWQ6XFxuJyArIG9wZW5UYWdzLmpvaW4oJ1xcbicpKTtcbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IHRoZSBjYWxsZXIgaXMgbm90IHdoZXJlIGF0dHJpYnV0ZXMgYXJlIGV4cGVjdGVkLlxuICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZVxuICovXG52YXIgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzID0gZnVuY3Rpb24gKGZ1bmN0aW9uTmFtZSkge1xuICBpZiAoaW5BdHRyaWJ1dGVzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGZ1bmN0aW9uTmFtZSArICcoKSBjYW4gbm90IGJlIGNhbGxlZCBiZXR3ZWVuICcgKyAnZWxlbWVudE9wZW5TdGFydCgpIGFuZCBlbGVtZW50T3BlbkVuZCgpLicpO1xuICB9XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY2FsbGVyIGlzIG5vdCBpbnNpZGUgYW4gZWxlbWVudCB0aGF0IGhhcyBkZWNsYXJlZCBza2lwLlxuICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZVxuICovXG52YXIgYXNzZXJ0Tm90SW5Ta2lwID0gZnVuY3Rpb24gKGZ1bmN0aW9uTmFtZSkge1xuICBpZiAoaW5Ta2lwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGZ1bmN0aW9uTmFtZSArICcoKSBtYXkgbm90IGJlIGNhbGxlZCBpbnNpZGUgYW4gZWxlbWVudCAnICsgJ3RoYXQgaGFzIGNhbGxlZCBza2lwKCkuJyk7XG4gIH1cbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IHRoZSBjYWxsZXIgaXMgd2hlcmUgYXR0cmlidXRlcyBhcmUgZXhwZWN0ZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gZnVuY3Rpb25OYW1lXG4gKi9cbnZhciBhc3NlcnRJbkF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAoZnVuY3Rpb25OYW1lKSB7XG4gIGlmICghaW5BdHRyaWJ1dGVzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGZ1bmN0aW9uTmFtZSArICcoKSBjYW4gb25seSBiZSBjYWxsZWQgYWZ0ZXIgY2FsbGluZyAnICsgJ2VsZW1lbnRPcGVuU3RhcnQoKS4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoZSBwYXRjaCBjbG9zZXMgdmlydHVhbCBhdHRyaWJ1dGVzIGNhbGxcbiAqL1xudmFyIGFzc2VydFZpcnR1YWxBdHRyaWJ1dGVzQ2xvc2VkID0gZnVuY3Rpb24gKCkge1xuICBpZiAoaW5BdHRyaWJ1dGVzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdlbGVtZW50T3BlbkVuZCgpIG11c3QgYmUgY2FsbGVkIGFmdGVyIGNhbGxpbmcgJyArICdlbGVtZW50T3BlblN0YXJ0KCkuJyk7XG4gIH1cbn07XG5cbi8qKlxuICAqIE1ha2VzIHN1cmUgdGhhdCB0YWdzIGFyZSBjb3JyZWN0bHkgbmVzdGVkLlxuICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZVxuICAqIEBwYXJhbSB7c3RyaW5nfSB0YWdcbiAgKi9cbnZhciBhc3NlcnRDbG9zZU1hdGNoZXNPcGVuVGFnID0gZnVuY3Rpb24gKG5vZGVOYW1lLCB0YWcpIHtcbiAgaWYgKG5vZGVOYW1lICE9PSB0YWcpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlY2VpdmVkIGEgY2FsbCB0byBjbG9zZSBcIicgKyB0YWcgKyAnXCIgYnV0IFwiJyArIG5vZGVOYW1lICsgJ1wiIHdhcyBvcGVuLicpO1xuICB9XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCBubyBjaGlsZHJlbiBlbGVtZW50cyBoYXZlIGJlZW4gZGVjbGFyZWQgeWV0IGluIHRoZSBjdXJyZW50XG4gKiBlbGVtZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZVxuICogQHBhcmFtIHs/Tm9kZX0gcHJldmlvdXNOb2RlXG4gKi9cbnZhciBhc3NlcnROb0NoaWxkcmVuRGVjbGFyZWRZZXQgPSBmdW5jdGlvbiAoZnVuY3Rpb25OYW1lLCBwcmV2aW91c05vZGUpIHtcbiAgaWYgKHByZXZpb3VzTm9kZSAhPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihmdW5jdGlvbk5hbWUgKyAnKCkgbXVzdCBjb21lIGJlZm9yZSBhbnkgY2hpbGQgJyArICdkZWNsYXJhdGlvbnMgaW5zaWRlIHRoZSBjdXJyZW50IGVsZW1lbnQuJyk7XG4gIH1cbn07XG5cbi8qKlxuICogQ2hlY2tzIHRoYXQgYSBjYWxsIHRvIHBhdGNoT3V0ZXIgYWN0dWFsbHkgcGF0Y2hlZCB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSB7P05vZGV9IHN0YXJ0Tm9kZSBUaGUgdmFsdWUgZm9yIHRoZSBjdXJyZW50Tm9kZSB3aGVuIHRoZSBwYXRjaFxuICogICAgIHN0YXJ0ZWQuXG4gKiBAcGFyYW0gez9Ob2RlfSBjdXJyZW50Tm9kZSBUaGUgY3VycmVudE5vZGUgd2hlbiB0aGUgcGF0Y2ggZmluaXNoZWQuXG4gKiBAcGFyYW0gez9Ob2RlfSBleHBlY3RlZE5leHROb2RlIFRoZSBOb2RlIHRoYXQgaXMgZXhwZWN0ZWQgdG8gZm9sbG93IHRoZVxuICogICAgY3VycmVudE5vZGUgYWZ0ZXIgdGhlIHBhdGNoO1xuICogQHBhcmFtIHs/Tm9kZX0gZXhwZWN0ZWRQcmV2Tm9kZSBUaGUgTm9kZSB0aGF0IGlzIGV4cGVjdGVkIHRvIHByZWNlZWQgdGhlXG4gKiAgICBjdXJyZW50Tm9kZSBhZnRlciB0aGUgcGF0Y2guXG4gKi9cbnZhciBhc3NlcnRQYXRjaEVsZW1lbnROb0V4dHJhcyA9IGZ1bmN0aW9uIChzdGFydE5vZGUsIGN1cnJlbnROb2RlLCBleHBlY3RlZE5leHROb2RlLCBleHBlY3RlZFByZXZOb2RlKSB7XG4gIHZhciB3YXNVcGRhdGVkID0gY3VycmVudE5vZGUubmV4dFNpYmxpbmcgPT09IGV4cGVjdGVkTmV4dE5vZGUgJiYgY3VycmVudE5vZGUucHJldmlvdXNTaWJsaW5nID09PSBleHBlY3RlZFByZXZOb2RlO1xuICB2YXIgd2FzQ2hhbmdlZCA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nID09PSBzdGFydE5vZGUubmV4dFNpYmxpbmcgJiYgY3VycmVudE5vZGUucHJldmlvdXNTaWJsaW5nID09PSBleHBlY3RlZFByZXZOb2RlO1xuICB2YXIgd2FzUmVtb3ZlZCA9IGN1cnJlbnROb2RlID09PSBzdGFydE5vZGU7XG5cbiAgaWYgKCF3YXNVcGRhdGVkICYmICF3YXNDaGFuZ2VkICYmICF3YXNSZW1vdmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUaGVyZSBtdXN0IGJlIGV4YWN0bHkgb25lIHRvcCBsZXZlbCBjYWxsIGNvcnJlc3BvbmRpbmcgJyArICd0byB0aGUgcGF0Y2hlZCBlbGVtZW50LicpO1xuICB9XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHN0YXRlIG9mIGJlaW5nIGluIGFuIGF0dHJpYnV0ZSBkZWNsYXJhdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRoZSBwcmV2aW91cyB2YWx1ZS5cbiAqL1xudmFyIHNldEluQXR0cmlidXRlcyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgcHJldmlvdXMgPSBpbkF0dHJpYnV0ZXM7XG4gIGluQXR0cmlidXRlcyA9IHZhbHVlO1xuICByZXR1cm4gcHJldmlvdXM7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHN0YXRlIG9mIGJlaW5nIGluIGEgc2tpcCBlbGVtZW50LlxuICogQHBhcmFtIHtib29sZWFufSB2YWx1ZVxuICogQHJldHVybiB7Ym9vbGVhbn0gdGhlIHByZXZpb3VzIHZhbHVlLlxuICovXG52YXIgc2V0SW5Ta2lwID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHZhciBwcmV2aW91cyA9IGluU2tpcDtcbiAgaW5Ta2lwID0gdmFsdWU7XG4gIHJldHVybiBwcmV2aW91cztcbn07XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTYgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBub2RlIHRoZSByb290IG9mIGEgZG9jdW1lbnQsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xudmFyIGlzRG9jdW1lbnRSb290ID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgLy8gRm9yIFNoYWRvd1Jvb3RzLCBjaGVjayBpZiB0aGV5IGFyZSBhIERvY3VtZW50RnJhZ21lbnQgaW5zdGVhZCBvZiBpZiB0aGV5XG4gIC8vIGFyZSBhIFNoYWRvd1Jvb3Qgc28gdGhhdCB0aGlzIGNhbiB3b3JrIGluICd1c2Ugc3RyaWN0JyBpZiBTaGFkb3dSb290cyBhcmVcbiAgLy8gbm90IHN1cHBvcnRlZC5cbiAgcmV0dXJuIG5vZGUgaW5zdGFuY2VvZiBEb2N1bWVudCB8fCBub2RlIGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudDtcbn07XG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZSBUaGUgbm9kZSB0byBzdGFydCBhdCwgaW5jbHVzaXZlLlxuICogQHBhcmFtIHs/Tm9kZX0gcm9vdCBUaGUgcm9vdCBhbmNlc3RvciB0byBnZXQgdW50aWwsIGV4Y2x1c2l2ZS5cbiAqIEByZXR1cm4geyFBcnJheTwhTm9kZT59IFRoZSBhbmNlc3RyeSBvZiBET00gbm9kZXMuXG4gKi9cbnZhciBnZXRBbmNlc3RyeSA9IGZ1bmN0aW9uIChub2RlLCByb290KSB7XG4gIHZhciBhbmNlc3RyeSA9IFtdO1xuICB2YXIgY3VyID0gbm9kZTtcblxuICB3aGlsZSAoY3VyICE9PSByb290KSB7XG4gICAgYW5jZXN0cnkucHVzaChjdXIpO1xuICAgIGN1ciA9IGN1ci5wYXJlbnROb2RlO1xuICB9XG5cbiAgcmV0dXJuIGFuY2VzdHJ5O1xufTtcblxuLyoqXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gKiBAcmV0dXJuIHshTm9kZX0gVGhlIHJvb3Qgbm9kZSBvZiB0aGUgRE9NIHRyZWUgdGhhdCBjb250YWlucyBub2RlLlxuICovXG52YXIgZ2V0Um9vdCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIHZhciBjdXIgPSBub2RlO1xuICB2YXIgcHJldiA9IGN1cjtcblxuICB3aGlsZSAoY3VyKSB7XG4gICAgcHJldiA9IGN1cjtcbiAgICBjdXIgPSBjdXIucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHJldHVybiBwcmV2O1xufTtcblxuLyoqXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlIFRoZSBub2RlIHRvIGdldCB0aGUgYWN0aXZlRWxlbWVudCBmb3IuXG4gKiBAcmV0dXJuIHs/RWxlbWVudH0gVGhlIGFjdGl2ZUVsZW1lbnQgaW4gdGhlIERvY3VtZW50IG9yIFNoYWRvd1Jvb3RcbiAqICAgICBjb3JyZXNwb25kaW5nIHRvIG5vZGUsIGlmIHByZXNlbnQuXG4gKi9cbnZhciBnZXRBY3RpdmVFbGVtZW50ID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgdmFyIHJvb3QgPSBnZXRSb290KG5vZGUpO1xuICByZXR1cm4gaXNEb2N1bWVudFJvb3Qocm9vdCkgPyByb290LmFjdGl2ZUVsZW1lbnQgOiBudWxsO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBwYXRoIG9mIG5vZGVzIHRoYXQgY29udGFpbiB0aGUgZm9jdXNlZCBub2RlIGluIHRoZSBzYW1lIGRvY3VtZW50IGFzXG4gKiBhIHJlZmVyZW5jZSBub2RlLCB1cCB1bnRpbCB0aGUgcm9vdC5cbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGUgVGhlIHJlZmVyZW5jZSBub2RlIHRvIGdldCB0aGUgYWN0aXZlRWxlbWVudCBmb3IuXG4gKiBAcGFyYW0gez9Ob2RlfSByb290IFRoZSByb290IHRvIGdldCB0aGUgZm9jdXNlZCBwYXRoIHVudGlsLlxuICogQHJldHVybiB7IUFycmF5PE5vZGU+fVxuICovXG52YXIgZ2V0Rm9jdXNlZFBhdGggPSBmdW5jdGlvbiAobm9kZSwgcm9vdCkge1xuICB2YXIgYWN0aXZlRWxlbWVudCA9IGdldEFjdGl2ZUVsZW1lbnQobm9kZSk7XG5cbiAgaWYgKCFhY3RpdmVFbGVtZW50IHx8ICFub2RlLmNvbnRhaW5zKGFjdGl2ZUVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgcmV0dXJuIGdldEFuY2VzdHJ5KGFjdGl2ZUVsZW1lbnQsIHJvb3QpO1xufTtcblxuLyoqXG4gKiBMaWtlIGluc2VydEJlZm9yZSwgYnV0IGluc3RlYWQgaW5zdGVhZCBvZiBtb3ZpbmcgdGhlIGRlc2lyZWQgbm9kZSwgaW5zdGVhZFxuICogbW92ZXMgYWxsIHRoZSBvdGhlciBub2RlcyBhZnRlci5cbiAqIEBwYXJhbSB7P05vZGV9IHBhcmVudE5vZGVcbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAqIEBwYXJhbSB7P05vZGV9IHJlZmVyZW5jZU5vZGVcbiAqL1xudmFyIG1vdmVCZWZvcmUgPSBmdW5jdGlvbiAocGFyZW50Tm9kZSwgbm9kZSwgcmVmZXJlbmNlTm9kZSkge1xuICB2YXIgaW5zZXJ0UmVmZXJlbmNlTm9kZSA9IG5vZGUubmV4dFNpYmxpbmc7XG4gIHZhciBjdXIgPSByZWZlcmVuY2VOb2RlO1xuXG4gIHdoaWxlIChjdXIgIT09IG5vZGUpIHtcbiAgICB2YXIgbmV4dCA9IGN1ci5uZXh0U2libGluZztcbiAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZShjdXIsIGluc2VydFJlZmVyZW5jZU5vZGUpO1xuICAgIGN1ciA9IG5leHQ7XG4gIH1cbn07XG5cbi8qKiBAdHlwZSB7P0NvbnRleHR9ICovXG52YXIgY29udGV4dCA9IG51bGw7XG5cbi8qKiBAdHlwZSB7P05vZGV9ICovXG52YXIgY3VycmVudE5vZGUgPSBudWxsO1xuXG4vKiogQHR5cGUgez9Ob2RlfSAqL1xudmFyIGN1cnJlbnRQYXJlbnQgPSBudWxsO1xuXG4vKiogQHR5cGUgez9Eb2N1bWVudH0gKi9cbnZhciBkb2MgPSBudWxsO1xuXG4vKipcbiAqIEBwYXJhbSB7IUFycmF5PE5vZGU+fSBmb2N1c1BhdGggVGhlIG5vZGVzIHRvIG1hcmsuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGZvY3VzZWQgV2hldGhlciBvciBub3QgdGhleSBhcmUgZm9jdXNlZC5cbiAqL1xudmFyIG1hcmtGb2N1c2VkID0gZnVuY3Rpb24gKGZvY3VzUGF0aCwgZm9jdXNlZCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGZvY3VzUGF0aC5sZW5ndGg7IGkgKz0gMSkge1xuICAgIGdldERhdGEoZm9jdXNQYXRoW2ldKS5mb2N1c2VkID0gZm9jdXNlZDtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcGF0Y2hlciBmdW5jdGlvbiB0aGF0IHNldHMgdXAgYW5kIHJlc3RvcmVzIGEgcGF0Y2ggY29udGV4dCxcbiAqIHJ1bm5pbmcgdGhlIHJ1biBmdW5jdGlvbiB3aXRoIHRoZSBwcm92aWRlZCBkYXRhLlxuICogQHBhcmFtIHtmdW5jdGlvbigoIUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnQpLCFmdW5jdGlvbihUKSxUPSk6ID9Ob2RlfSBydW5cbiAqIEByZXR1cm4ge2Z1bmN0aW9uKCghRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudCksIWZ1bmN0aW9uKFQpLFQ9KTogP05vZGV9XG4gKiBAdGVtcGxhdGUgVFxuICovXG52YXIgcGF0Y2hGYWN0b3J5ID0gZnVuY3Rpb24gKHJ1bikge1xuICAvKipcbiAgICogVE9ETyhtb3opOiBUaGVzZSBhbm5vdGF0aW9ucyB3b24ndCBiZSBuZWNlc3Nhcnkgb25jZSB3ZSBzd2l0Y2ggdG8gQ2xvc3VyZVxuICAgKiBDb21waWxlcidzIG5ldyB0eXBlIGluZmVyZW5jZS4gUmVtb3ZlIHRoZXNlIG9uY2UgdGhlIHN3aXRjaCBpcyBkb25lLlxuICAgKlxuICAgKiBAcGFyYW0geyghRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudCl9IG5vZGVcbiAgICogQHBhcmFtIHshZnVuY3Rpb24oVCl9IGZuXG4gICAqIEBwYXJhbSB7VD19IGRhdGFcbiAgICogQHJldHVybiB7P05vZGV9IG5vZGVcbiAgICogQHRlbXBsYXRlIFRcbiAgICovXG4gIHZhciBmID0gZnVuY3Rpb24gKG5vZGUsIGZuLCBkYXRhKSB7XG4gICAgdmFyIHByZXZDb250ZXh0ID0gY29udGV4dDtcbiAgICB2YXIgcHJldkRvYyA9IGRvYztcbiAgICB2YXIgcHJldkN1cnJlbnROb2RlID0gY3VycmVudE5vZGU7XG4gICAgdmFyIHByZXZDdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudDtcbiAgICB2YXIgcHJldmlvdXNJbkF0dHJpYnV0ZXMgPSBmYWxzZTtcbiAgICB2YXIgcHJldmlvdXNJblNraXAgPSBmYWxzZTtcblxuICAgIGNvbnRleHQgPSBuZXcgQ29udGV4dCgpO1xuICAgIGRvYyA9IG5vZGUub3duZXJEb2N1bWVudDtcbiAgICBjdXJyZW50UGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIHByZXZpb3VzSW5BdHRyaWJ1dGVzID0gc2V0SW5BdHRyaWJ1dGVzKGZhbHNlKTtcbiAgICAgIHByZXZpb3VzSW5Ta2lwID0gc2V0SW5Ta2lwKGZhbHNlKTtcbiAgICB9XG5cbiAgICB2YXIgZm9jdXNQYXRoID0gZ2V0Rm9jdXNlZFBhdGgobm9kZSwgY3VycmVudFBhcmVudCk7XG4gICAgbWFya0ZvY3VzZWQoZm9jdXNQYXRoLCB0cnVlKTtcbiAgICB2YXIgcmV0VmFsID0gcnVuKG5vZGUsIGZuLCBkYXRhKTtcbiAgICBtYXJrRm9jdXNlZChmb2N1c1BhdGgsIGZhbHNlKTtcblxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBhc3NlcnRWaXJ0dWFsQXR0cmlidXRlc0Nsb3NlZCgpO1xuICAgICAgc2V0SW5BdHRyaWJ1dGVzKHByZXZpb3VzSW5BdHRyaWJ1dGVzKTtcbiAgICAgIHNldEluU2tpcChwcmV2aW91c0luU2tpcCk7XG4gICAgfVxuXG4gICAgY29udGV4dC5ub3RpZnlDaGFuZ2VzKCk7XG5cbiAgICBjb250ZXh0ID0gcHJldkNvbnRleHQ7XG4gICAgZG9jID0gcHJldkRvYztcbiAgICBjdXJyZW50Tm9kZSA9IHByZXZDdXJyZW50Tm9kZTtcbiAgICBjdXJyZW50UGFyZW50ID0gcHJldkN1cnJlbnRQYXJlbnQ7XG5cbiAgICByZXR1cm4gcmV0VmFsO1xuICB9O1xuICByZXR1cm4gZjtcbn07XG5cbi8qKlxuICogUGF0Y2hlcyB0aGUgZG9jdW1lbnQgc3RhcnRpbmcgYXQgbm9kZSB3aXRoIHRoZSBwcm92aWRlZCBmdW5jdGlvbi4gVGhpc1xuICogZnVuY3Rpb24gbWF5IGJlIGNhbGxlZCBkdXJpbmcgYW4gZXhpc3RpbmcgcGF0Y2ggb3BlcmF0aW9uLlxuICogQHBhcmFtIHshRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudH0gbm9kZSBUaGUgRWxlbWVudCBvciBEb2N1bWVudFxuICogICAgIHRvIHBhdGNoLlxuICogQHBhcmFtIHshZnVuY3Rpb24oVCl9IGZuIEEgZnVuY3Rpb24gY29udGFpbmluZyBlbGVtZW50T3Blbi9lbGVtZW50Q2xvc2UvZXRjLlxuICogICAgIGNhbGxzIHRoYXQgZGVzY3JpYmUgdGhlIERPTS5cbiAqIEBwYXJhbSB7VD19IGRhdGEgQW4gYXJndW1lbnQgcGFzc2VkIHRvIGZuIHRvIHJlcHJlc2VudCBET00gc3RhdGUuXG4gKiBAcmV0dXJuIHshTm9kZX0gVGhlIHBhdGNoZWQgbm9kZS5cbiAqIEB0ZW1wbGF0ZSBUXG4gKi9cbnZhciBwYXRjaElubmVyID0gcGF0Y2hGYWN0b3J5KGZ1bmN0aW9uIChub2RlLCBmbiwgZGF0YSkge1xuICBjdXJyZW50Tm9kZSA9IG5vZGU7XG5cbiAgZW50ZXJOb2RlKCk7XG4gIGZuKGRhdGEpO1xuICBleGl0Tm9kZSgpO1xuXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm9VbmNsb3NlZFRhZ3MoY3VycmVudE5vZGUsIG5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59KTtcblxuLyoqXG4gKiBQYXRjaGVzIGFuIEVsZW1lbnQgd2l0aCB0aGUgdGhlIHByb3ZpZGVkIGZ1bmN0aW9uLiBFeGFjdGx5IG9uZSB0b3AgbGV2ZWxcbiAqIGVsZW1lbnQgY2FsbCBzaG91bGQgYmUgbWFkZSBjb3JyZXNwb25kaW5nIHRvIGBub2RlYC5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IG5vZGUgVGhlIEVsZW1lbnQgd2hlcmUgdGhlIHBhdGNoIHNob3VsZCBzdGFydC5cbiAqIEBwYXJhbSB7IWZ1bmN0aW9uKFQpfSBmbiBBIGZ1bmN0aW9uIGNvbnRhaW5pbmcgZWxlbWVudE9wZW4vZWxlbWVudENsb3NlL2V0Yy5cbiAqICAgICBjYWxscyB0aGF0IGRlc2NyaWJlIHRoZSBET00uIFRoaXMgc2hvdWxkIGhhdmUgYXQgbW9zdCBvbmUgdG9wIGxldmVsXG4gKiAgICAgZWxlbWVudCBjYWxsLlxuICogQHBhcmFtIHtUPX0gZGF0YSBBbiBhcmd1bWVudCBwYXNzZWQgdG8gZm4gdG8gcmVwcmVzZW50IERPTSBzdGF0ZS5cbiAqIEByZXR1cm4gez9Ob2RlfSBUaGUgbm9kZSBpZiBpdCB3YXMgdXBkYXRlZCwgaXRzIHJlcGxhY2VkbWVudCBvciBudWxsIGlmIGl0XG4gKiAgICAgd2FzIHJlbW92ZWQuXG4gKiBAdGVtcGxhdGUgVFxuICovXG52YXIgcGF0Y2hPdXRlciA9IHBhdGNoRmFjdG9yeShmdW5jdGlvbiAobm9kZSwgZm4sIGRhdGEpIHtcbiAgdmFyIHN0YXJ0Tm9kZSA9IC8qKiBAdHlwZSB7IUVsZW1lbnR9ICoveyBuZXh0U2libGluZzogbm9kZSB9O1xuICB2YXIgZXhwZWN0ZWROZXh0Tm9kZSA9IG51bGw7XG4gIHZhciBleHBlY3RlZFByZXZOb2RlID0gbnVsbDtcblxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGV4cGVjdGVkTmV4dE5vZGUgPSBub2RlLm5leHRTaWJsaW5nO1xuICAgIGV4cGVjdGVkUHJldk5vZGUgPSBub2RlLnByZXZpb3VzU2libGluZztcbiAgfVxuXG4gIGN1cnJlbnROb2RlID0gc3RhcnROb2RlO1xuICBmbihkYXRhKTtcblxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydFBhdGNoRWxlbWVudE5vRXh0cmFzKHN0YXJ0Tm9kZSwgY3VycmVudE5vZGUsIGV4cGVjdGVkTmV4dE5vZGUsIGV4cGVjdGVkUHJldk5vZGUpO1xuICB9XG5cbiAgaWYgKG5vZGUgIT09IGN1cnJlbnROb2RlICYmIG5vZGUucGFyZW50Tm9kZSkge1xuICAgIHJlbW92ZUNoaWxkKGN1cnJlbnRQYXJlbnQsIG5vZGUsIGdldERhdGEoY3VycmVudFBhcmVudCkua2V5TWFwKTtcbiAgfVxuXG4gIHJldHVybiBzdGFydE5vZGUgPT09IGN1cnJlbnROb2RlID8gbnVsbCA6IGN1cnJlbnROb2RlO1xufSk7XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgb3Igbm90IHRoZSBjdXJyZW50IG5vZGUgbWF0Y2hlcyB0aGUgc3BlY2lmaWVkIG5vZGVOYW1lIGFuZFxuICoga2V5LlxuICpcbiAqIEBwYXJhbSB7IU5vZGV9IG1hdGNoTm9kZSBBIG5vZGUgdG8gbWF0Y2ggdGhlIGRhdGEgdG8uXG4gKiBAcGFyYW0gez9zdHJpbmd9IG5vZGVOYW1lIFRoZSBub2RlTmFtZSBmb3IgdGhpcyBub2RlLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IEFuIG9wdGlvbmFsIGtleSB0aGF0IGlkZW50aWZpZXMgYSBub2RlLlxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgbm9kZSBtYXRjaGVzLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbnZhciBtYXRjaGVzID0gZnVuY3Rpb24gKG1hdGNoTm9kZSwgbm9kZU5hbWUsIGtleSkge1xuICB2YXIgZGF0YSA9IGdldERhdGEobWF0Y2hOb2RlKTtcblxuICAvLyBLZXkgY2hlY2sgaXMgZG9uZSB1c2luZyBkb3VibGUgZXF1YWxzIGFzIHdlIHdhbnQgdG8gdHJlYXQgYSBudWxsIGtleSB0aGVcbiAgLy8gc2FtZSBhcyB1bmRlZmluZWQuIFRoaXMgc2hvdWxkIGJlIG9rYXkgYXMgdGhlIG9ubHkgdmFsdWVzIGFsbG93ZWQgYXJlXG4gIC8vIHN0cmluZ3MsIG51bGwgYW5kIHVuZGVmaW5lZCBzbyB0aGUgPT0gc2VtYW50aWNzIGFyZSBub3QgdG9vIHdlaXJkLlxuICByZXR1cm4gbm9kZU5hbWUgPT09IGRhdGEubm9kZU5hbWUgJiYga2V5ID09IGRhdGEua2V5O1xufTtcblxuLyoqXG4gKiBBbGlnbnMgdGhlIHZpcnR1YWwgRWxlbWVudCBkZWZpbml0aW9uIHdpdGggdGhlIGFjdHVhbCBET00sIG1vdmluZyB0aGVcbiAqIGNvcnJlc3BvbmRpbmcgRE9NIG5vZGUgdG8gdGhlIGNvcnJlY3QgbG9jYXRpb24gb3IgY3JlYXRpbmcgaXQgaWYgbmVjZXNzYXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVOYW1lIEZvciBhbiBFbGVtZW50LCB0aGlzIHNob3VsZCBiZSBhIHZhbGlkIHRhZyBzdHJpbmcuXG4gKiAgICAgRm9yIGEgVGV4dCwgdGhpcyBzaG91bGQgYmUgI3RleHQuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC5cbiAqL1xudmFyIGFsaWduV2l0aERPTSA9IGZ1bmN0aW9uIChub2RlTmFtZSwga2V5KSB7XG4gIGlmIChjdXJyZW50Tm9kZSAmJiBtYXRjaGVzKGN1cnJlbnROb2RlLCBub2RlTmFtZSwga2V5KSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBwYXJlbnREYXRhID0gZ2V0RGF0YShjdXJyZW50UGFyZW50KTtcbiAgdmFyIGN1cnJlbnROb2RlRGF0YSA9IGN1cnJlbnROb2RlICYmIGdldERhdGEoY3VycmVudE5vZGUpO1xuICB2YXIga2V5TWFwID0gcGFyZW50RGF0YS5rZXlNYXA7XG4gIHZhciBub2RlID0gdW5kZWZpbmVkO1xuXG4gIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgbm9kZSBoYXMgbW92ZWQgd2l0aGluIHRoZSBwYXJlbnQuXG4gIGlmIChrZXkpIHtcbiAgICB2YXIga2V5Tm9kZSA9IGtleU1hcFtrZXldO1xuICAgIGlmIChrZXlOb2RlKSB7XG4gICAgICBpZiAobWF0Y2hlcyhrZXlOb2RlLCBub2RlTmFtZSwga2V5KSkge1xuICAgICAgICBub2RlID0ga2V5Tm9kZTtcbiAgICAgIH0gZWxzZSBpZiAoa2V5Tm9kZSA9PT0gY3VycmVudE5vZGUpIHtcbiAgICAgICAgY29udGV4dC5tYXJrRGVsZXRlZChrZXlOb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlbW92ZUNoaWxkKGN1cnJlbnRQYXJlbnQsIGtleU5vZGUsIGtleU1hcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQ3JlYXRlIHRoZSBub2RlIGlmIGl0IGRvZXNuJ3QgZXhpc3QuXG4gIGlmICghbm9kZSkge1xuICAgIGlmIChub2RlTmFtZSA9PT0gJyN0ZXh0Jykge1xuICAgICAgbm9kZSA9IGNyZWF0ZVRleHQoZG9jKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZSA9IGNyZWF0ZUVsZW1lbnQoZG9jLCBjdXJyZW50UGFyZW50LCBub2RlTmFtZSwga2V5KTtcbiAgICB9XG5cbiAgICBpZiAoa2V5KSB7XG4gICAgICBrZXlNYXBba2V5XSA9IG5vZGU7XG4gICAgfVxuXG4gICAgY29udGV4dC5tYXJrQ3JlYXRlZChub2RlKTtcbiAgfVxuXG4gIC8vIFJlLW9yZGVyIHRoZSBub2RlIGludG8gdGhlIHJpZ2h0IHBvc2l0aW9uLCBwcmVzZXJ2aW5nIGZvY3VzIGlmIGVpdGhlclxuICAvLyBub2RlIG9yIGN1cnJlbnROb2RlIGFyZSBmb2N1c2VkIGJ5IG1ha2luZyBzdXJlIHRoYXQgdGhleSBhcmUgbm90IGRldGFjaGVkXG4gIC8vIGZyb20gdGhlIERPTS5cbiAgaWYgKGdldERhdGEobm9kZSkuZm9jdXNlZCkge1xuICAgIC8vIE1vdmUgZXZlcnl0aGluZyBlbHNlIGJlZm9yZSB0aGUgbm9kZS5cbiAgICBtb3ZlQmVmb3JlKGN1cnJlbnRQYXJlbnQsIG5vZGUsIGN1cnJlbnROb2RlKTtcbiAgfSBlbHNlIGlmIChjdXJyZW50Tm9kZURhdGEgJiYgY3VycmVudE5vZGVEYXRhLmtleSAmJiAhY3VycmVudE5vZGVEYXRhLmZvY3VzZWQpIHtcbiAgICAvLyBSZW1vdmUgdGhlIGN1cnJlbnROb2RlLCB3aGljaCBjYW4gYWx3YXlzIGJlIGFkZGVkIGJhY2sgc2luY2Ugd2UgaG9sZCBhXG4gICAgLy8gcmVmZXJlbmNlIHRocm91Z2ggdGhlIGtleU1hcC4gVGhpcyBwcmV2ZW50cyBhIGxhcmdlIG51bWJlciBvZiBtb3ZlcyB3aGVuXG4gICAgLy8gYSBrZXllZCBpdGVtIGlzIHJlbW92ZWQgb3IgbW92ZWQgYmFja3dhcmRzIGluIHRoZSBET00uXG4gICAgY3VycmVudFBhcmVudC5yZXBsYWNlQ2hpbGQobm9kZSwgY3VycmVudE5vZGUpO1xuICAgIHBhcmVudERhdGEua2V5TWFwVmFsaWQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBjdXJyZW50UGFyZW50Lmluc2VydEJlZm9yZShub2RlLCBjdXJyZW50Tm9kZSk7XG4gIH1cblxuICBjdXJyZW50Tm9kZSA9IG5vZGU7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7P05vZGV9IG5vZGVcbiAqIEBwYXJhbSB7P05vZGV9IGNoaWxkXG4gKiBAcGFyYW0gez9PYmplY3Q8c3RyaW5nLCAhRWxlbWVudD59IGtleU1hcFxuICovXG52YXIgcmVtb3ZlQ2hpbGQgPSBmdW5jdGlvbiAobm9kZSwgY2hpbGQsIGtleU1hcCkge1xuICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgY29udGV4dC5tYXJrRGVsZXRlZCggLyoqIEB0eXBlIHshTm9kZX0qL2NoaWxkKTtcblxuICB2YXIga2V5ID0gZ2V0RGF0YShjaGlsZCkua2V5O1xuICBpZiAoa2V5KSB7XG4gICAgZGVsZXRlIGtleU1hcFtrZXldO1xuICB9XG59O1xuXG4vKipcbiAqIENsZWFycyBvdXQgYW55IHVudmlzaXRlZCBOb2RlcywgYXMgdGhlIGNvcnJlc3BvbmRpbmcgdmlydHVhbCBlbGVtZW50XG4gKiBmdW5jdGlvbnMgd2VyZSBuZXZlciBjYWxsZWQgZm9yIHRoZW0uXG4gKi9cbnZhciBjbGVhclVudmlzaXRlZERPTSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5vZGUgPSBjdXJyZW50UGFyZW50O1xuICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG4gIHZhciBrZXlNYXAgPSBkYXRhLmtleU1hcDtcbiAgdmFyIGtleU1hcFZhbGlkID0gZGF0YS5rZXlNYXBWYWxpZDtcbiAgdmFyIGNoaWxkID0gbm9kZS5sYXN0Q2hpbGQ7XG4gIHZhciBrZXkgPSB1bmRlZmluZWQ7XG5cbiAgaWYgKGNoaWxkID09PSBjdXJyZW50Tm9kZSAmJiBrZXlNYXBWYWxpZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHdoaWxlIChjaGlsZCAhPT0gY3VycmVudE5vZGUpIHtcbiAgICByZW1vdmVDaGlsZChub2RlLCBjaGlsZCwga2V5TWFwKTtcbiAgICBjaGlsZCA9IG5vZGUubGFzdENoaWxkO1xuICB9XG5cbiAgLy8gQ2xlYW4gdGhlIGtleU1hcCwgcmVtb3ZpbmcgYW55IHVudXN1ZWQga2V5cy5cbiAgaWYgKCFrZXlNYXBWYWxpZCkge1xuICAgIGZvciAoa2V5IGluIGtleU1hcCkge1xuICAgICAgY2hpbGQgPSBrZXlNYXBba2V5XTtcbiAgICAgIGlmIChjaGlsZC5wYXJlbnROb2RlICE9PSBub2RlKSB7XG4gICAgICAgIGNvbnRleHQubWFya0RlbGV0ZWQoY2hpbGQpO1xuICAgICAgICBkZWxldGUga2V5TWFwW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGF0YS5rZXlNYXBWYWxpZCA9IHRydWU7XG4gIH1cbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0byB0aGUgZmlyc3QgY2hpbGQgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAqL1xudmFyIGVudGVyTm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgY3VycmVudFBhcmVudCA9IGN1cnJlbnROb2RlO1xuICBjdXJyZW50Tm9kZSA9IG51bGw7XG59O1xuXG4vKipcbiAqIEByZXR1cm4gez9Ob2RlfSBUaGUgbmV4dCBOb2RlIHRvIGJlIHBhdGNoZWQuXG4gKi9cbnZhciBnZXROZXh0Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKGN1cnJlbnROb2RlKSB7XG4gICAgcmV0dXJuIGN1cnJlbnROb2RlLm5leHRTaWJsaW5nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjdXJyZW50UGFyZW50LmZpcnN0Q2hpbGQ7XG4gIH1cbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbnZhciBuZXh0Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgY3VycmVudE5vZGUgPSBnZXROZXh0Tm9kZSgpO1xufTtcblxuLyoqXG4gKiBDaGFuZ2VzIHRvIHRoZSBwYXJlbnQgb2YgdGhlIGN1cnJlbnQgbm9kZSwgcmVtb3ZpbmcgYW55IHVudmlzaXRlZCBjaGlsZHJlbi5cbiAqL1xudmFyIGV4aXROb2RlID0gZnVuY3Rpb24gKCkge1xuICBjbGVhclVudmlzaXRlZERPTSgpO1xuXG4gIGN1cnJlbnROb2RlID0gY3VycmVudFBhcmVudDtcbiAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnQucGFyZW50Tm9kZTtcbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IHRoZSBjdXJyZW50IG5vZGUgaXMgYW4gRWxlbWVudCB3aXRoIGEgbWF0Y2hpbmcgdGFnTmFtZSBhbmRcbiAqIGtleS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgY29yZUVsZW1lbnRPcGVuID0gZnVuY3Rpb24gKHRhZywga2V5KSB7XG4gIG5leHROb2RlKCk7XG4gIGFsaWduV2l0aERPTSh0YWcsIGtleSk7XG4gIGVudGVyTm9kZSgpO1xuICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovY3VycmVudFBhcmVudFxuICApO1xufTtcblxuLyoqXG4gKiBDbG9zZXMgdGhlIGN1cnJlbnRseSBvcGVuIEVsZW1lbnQsIHJlbW92aW5nIGFueSB1bnZpc2l0ZWQgY2hpbGRyZW4gaWZcbiAqIG5lY2Vzc2FyeS5cbiAqXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGNvcmVFbGVtZW50Q2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgc2V0SW5Ta2lwKGZhbHNlKTtcbiAgfVxuXG4gIGV4aXROb2RlKCk7XG4gIHJldHVybiAoLyoqIEB0eXBlIHshRWxlbWVudH0gKi9jdXJyZW50Tm9kZVxuICApO1xufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoZSBjdXJyZW50IG5vZGUgaXMgYSBUZXh0IG5vZGUgYW5kIGNyZWF0ZXMgYSBUZXh0IG5vZGUgaWYgaXQgaXNcbiAqIG5vdC5cbiAqXG4gKiBAcmV0dXJuIHshVGV4dH0gVGhlIGNvcnJlc3BvbmRpbmcgVGV4dCBOb2RlLlxuICovXG52YXIgY29yZVRleHQgPSBmdW5jdGlvbiAoKSB7XG4gIG5leHROb2RlKCk7XG4gIGFsaWduV2l0aERPTSgnI3RleHQnLCBudWxsKTtcbiAgcmV0dXJuICgvKiogQHR5cGUgeyFUZXh0fSAqL2N1cnJlbnROb2RlXG4gICk7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIGN1cnJlbnQgRWxlbWVudCBiZWluZyBwYXRjaGVkLlxuICogQHJldHVybiB7IUVsZW1lbnR9XG4gKi9cbnZhciBjdXJyZW50RWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRJblBhdGNoKCdjdXJyZW50RWxlbWVudCcsIGNvbnRleHQpO1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygnY3VycmVudEVsZW1lbnQnKTtcbiAgfVxuICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovY3VycmVudFBhcmVudFxuICApO1xufTtcblxuLyoqXG4gKiBAcmV0dXJuIHtOb2RlfSBUaGUgTm9kZSB0aGF0IHdpbGwgYmUgZXZhbHVhdGVkIGZvciB0aGUgbmV4dCBpbnN0cnVjdGlvbi5cbiAqL1xudmFyIGN1cnJlbnRQb2ludGVyID0gZnVuY3Rpb24gKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydEluUGF0Y2goJ2N1cnJlbnRQb2ludGVyJywgY29udGV4dCk7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCdjdXJyZW50UG9pbnRlcicpO1xuICB9XG4gIHJldHVybiBnZXROZXh0Tm9kZSgpO1xufTtcblxuLyoqXG4gKiBTa2lwcyB0aGUgY2hpbGRyZW4gaW4gYSBzdWJ0cmVlLCBhbGxvd2luZyBhbiBFbGVtZW50IHRvIGJlIGNsb3NlZCB3aXRob3V0XG4gKiBjbGVhcmluZyBvdXQgdGhlIGNoaWxkcmVuLlxuICovXG52YXIgc2tpcCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnROb0NoaWxkcmVuRGVjbGFyZWRZZXQoJ3NraXAnLCBjdXJyZW50Tm9kZSk7XG4gICAgc2V0SW5Ta2lwKHRydWUpO1xuICB9XG4gIGN1cnJlbnROb2RlID0gY3VycmVudFBhcmVudC5sYXN0Q2hpbGQ7XG59O1xuXG4vKipcbiAqIFNraXBzIHRoZSBuZXh0IE5vZGUgdG8gYmUgcGF0Y2hlZCwgbW92aW5nIHRoZSBwb2ludGVyIGZvcndhcmQgdG8gdGhlIG5leHRcbiAqIHNpYmxpbmcgb2YgdGhlIGN1cnJlbnQgcG9pbnRlci5cbiAqL1xudmFyIHNraXBOb2RlID0gbmV4dE5vZGU7XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqIEBjb25zdCAqL1xudmFyIHN5bWJvbHMgPSB7XG4gIGRlZmF1bHQ6ICdfX2RlZmF1bHQnXG59O1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtzdHJpbmd8dW5kZWZpbmVkfSBUaGUgbmFtZXNwYWNlIHRvIHVzZSBmb3IgdGhlIGF0dHJpYnV0ZS5cbiAqL1xudmFyIGdldE5hbWVzcGFjZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIGlmIChuYW1lLmxhc3RJbmRleE9mKCd4bWw6JywgMCkgPT09IDApIHtcbiAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnL1hNTC8xOTk4L25hbWVzcGFjZSc7XG4gIH1cblxuICBpZiAobmFtZS5sYXN0SW5kZXhPZigneGxpbms6JywgMCkgPT09IDApIHtcbiAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnO1xuICB9XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgYW4gYXR0cmlidXRlIG9yIHByb3BlcnR5IHRvIGEgZ2l2ZW4gRWxlbWVudC4gSWYgdGhlIHZhbHVlIGlzIG51bGxcbiAqIG9yIHVuZGVmaW5lZCwgaXQgaXMgcmVtb3ZlZCBmcm9tIHRoZSBFbGVtZW50LiBPdGhlcndpc2UsIHRoZSB2YWx1ZSBpcyBzZXRcbiAqIGFzIGFuIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Pyhib29sZWFufG51bWJlcnxzdHJpbmcpPX0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLlxuICovXG52YXIgYXBwbHlBdHRyID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgYXR0ck5TID0gZ2V0TmFtZXNwYWNlKG5hbWUpO1xuICAgIGlmIChhdHRyTlMpIHtcbiAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKGF0dHJOUywgbmFtZSwgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBBcHBsaWVzIGEgcHJvcGVydHkgdG8gYSBnaXZlbiBFbGVtZW50LlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBwcm9wZXJ0eSdzIG5hbWUuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBwcm9wZXJ0eSdzIHZhbHVlLlxuICovXG52YXIgYXBwbHlQcm9wID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICBlbFtuYW1lXSA9IHZhbHVlO1xufTtcblxuLyoqXG4gKiBBcHBsaWVzIGEgdmFsdWUgdG8gYSBzdHlsZSBkZWNsYXJhdGlvbi4gU3VwcG9ydHMgQ1NTIGN1c3RvbSBwcm9wZXJ0aWVzIGJ5XG4gKiBzZXR0aW5nIHByb3BlcnRpZXMgY29udGFpbmluZyBhIGRhc2ggdXNpbmcgQ1NTU3R5bGVEZWNsYXJhdGlvbi5zZXRQcm9wZXJ0eS5cbiAqIEBwYXJhbSB7Q1NTU3R5bGVEZWNsYXJhdGlvbn0gc3R5bGVcbiAqIEBwYXJhbSB7IXN0cmluZ30gcHJvcFxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICovXG52YXIgc2V0U3R5bGVWYWx1ZSA9IGZ1bmN0aW9uIChzdHlsZSwgcHJvcCwgdmFsdWUpIHtcbiAgaWYgKHByb3AuaW5kZXhPZignLScpID49IDApIHtcbiAgICBzdHlsZS5zZXRQcm9wZXJ0eShwcm9wLCAvKiogQHR5cGUge3N0cmluZ30gKi92YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgc3R5bGVbcHJvcF0gPSB2YWx1ZTtcbiAgfVxufTtcblxuLyoqXG4gKiBBcHBsaWVzIGEgc3R5bGUgdG8gYW4gRWxlbWVudC4gTm8gdmVuZG9yIHByZWZpeCBleHBhbnNpb24gaXMgZG9uZSBmb3JcbiAqIHByb3BlcnR5IG5hbWVzL3ZhbHVlcy5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Kn0gc3R5bGUgVGhlIHN0eWxlIHRvIHNldC4gRWl0aGVyIGEgc3RyaW5nIG9mIGNzcyBvciBhbiBvYmplY3RcbiAqICAgICBjb250YWluaW5nIHByb3BlcnR5LXZhbHVlIHBhaXJzLlxuICovXG52YXIgYXBwbHlTdHlsZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgc3R5bGUpIHtcbiAgaWYgKHR5cGVvZiBzdHlsZSA9PT0gJ3N0cmluZycpIHtcbiAgICBlbC5zdHlsZS5jc3NUZXh0ID0gc3R5bGU7XG4gIH0gZWxzZSB7XG4gICAgZWwuc3R5bGUuY3NzVGV4dCA9ICcnO1xuICAgIHZhciBlbFN0eWxlID0gZWwuc3R5bGU7XG4gICAgdmFyIG9iaiA9IC8qKiBAdHlwZSB7IU9iamVjdDxzdHJpbmcsc3RyaW5nPn0gKi9zdHlsZTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICBpZiAoaGFzKG9iaiwgcHJvcCkpIHtcbiAgICAgICAgc2V0U3R5bGVWYWx1ZShlbFN0eWxlLCBwcm9wLCBvYmpbcHJvcF0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBVcGRhdGVzIGEgc2luZ2xlIGF0dHJpYnV0ZSBvbiBhbiBFbGVtZW50LlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuIElmIHRoZSB2YWx1ZSBpcyBhbiBvYmplY3Qgb3JcbiAqICAgICBmdW5jdGlvbiBpdCBpcyBzZXQgb24gdGhlIEVsZW1lbnQsIG90aGVyd2lzZSwgaXQgaXMgc2V0IGFzIGFuIEhUTUxcbiAqICAgICBhdHRyaWJ1dGUuXG4gKi9cbnZhciBhcHBseUF0dHJpYnV0ZVR5cGVkID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcblxuICBpZiAodHlwZSA9PT0gJ29iamVjdCcgfHwgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGFwcGx5UHJvcChlbCwgbmFtZSwgdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIGFwcGx5QXR0cihlbCwgbmFtZSwgLyoqIEB0eXBlIHs/KGJvb2xlYW58bnVtYmVyfHN0cmluZyl9ICovdmFsdWUpO1xuICB9XG59O1xuXG4vKipcbiAqIENhbGxzIHRoZSBhcHByb3ByaWF0ZSBhdHRyaWJ1dGUgbXV0YXRvciBmb3IgdGhpcyBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS5cbiAqL1xudmFyIHVwZGF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKGVsKTtcbiAgdmFyIGF0dHJzID0gZGF0YS5hdHRycztcblxuICBpZiAoYXR0cnNbbmFtZV0gPT09IHZhbHVlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIG11dGF0b3IgPSBhdHRyaWJ1dGVzW25hbWVdIHx8IGF0dHJpYnV0ZXNbc3ltYm9scy5kZWZhdWx0XTtcbiAgbXV0YXRvcihlbCwgbmFtZSwgdmFsdWUpO1xuXG4gIGF0dHJzW25hbWVdID0gdmFsdWU7XG59O1xuXG4vKipcbiAqIEEgcHVibGljbHkgbXV0YWJsZSBvYmplY3QgdG8gcHJvdmlkZSBjdXN0b20gbXV0YXRvcnMgZm9yIGF0dHJpYnV0ZXMuXG4gKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCBmdW5jdGlvbighRWxlbWVudCwgc3RyaW5nLCAqKT59XG4gKi9cbnZhciBhdHRyaWJ1dGVzID0gY3JlYXRlTWFwKCk7XG5cbi8vIFNwZWNpYWwgZ2VuZXJpYyBtdXRhdG9yIHRoYXQncyBjYWxsZWQgZm9yIGFueSBhdHRyaWJ1dGUgdGhhdCBkb2VzIG5vdFxuLy8gaGF2ZSBhIHNwZWNpZmljIG11dGF0b3IuXG5hdHRyaWJ1dGVzW3N5bWJvbHMuZGVmYXVsdF0gPSBhcHBseUF0dHJpYnV0ZVR5cGVkO1xuXG5hdHRyaWJ1dGVzWydzdHlsZSddID0gYXBwbHlTdHlsZTtcblxuLyoqXG4gKiBUaGUgb2Zmc2V0IGluIHRoZSB2aXJ0dWFsIGVsZW1lbnQgZGVjbGFyYXRpb24gd2hlcmUgdGhlIGF0dHJpYnV0ZXMgYXJlXG4gKiBzcGVjaWZpZWQuXG4gKiBAY29uc3RcbiAqL1xudmFyIEFUVFJJQlVURVNfT0ZGU0VUID0gMztcblxuLyoqXG4gKiBCdWlsZHMgYW4gYXJyYXkgb2YgYXJndW1lbnRzIGZvciB1c2Ugd2l0aCBlbGVtZW50T3BlblN0YXJ0LCBhdHRyIGFuZFxuICogZWxlbWVudE9wZW5FbmQuXG4gKiBAY29uc3Qge0FycmF5PCo+fVxuICovXG52YXIgYXJnc0J1aWxkZXIgPSBbXTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAqIEBwYXJhbSB7Li4uKn0gdmFyX2FyZ3MsIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAqICAgICBmb3IgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGVsZW1lbnRPcGVuID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCB2YXJfYXJncykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygnZWxlbWVudE9wZW4nKTtcbiAgICBhc3NlcnROb3RJblNraXAoJ2VsZW1lbnRPcGVuJyk7XG4gIH1cblxuICB2YXIgbm9kZSA9IGNvcmVFbGVtZW50T3Blbih0YWcsIGtleSk7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcblxuICBpZiAoIWRhdGEuc3RhdGljc0FwcGxpZWQpIHtcbiAgICBpZiAoc3RhdGljcykge1xuICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IHN0YXRpY3MubGVuZ3RoOyBfaSArPSAyKSB7XG4gICAgICAgIHZhciBuYW1lID0gLyoqIEB0eXBlIHtzdHJpbmd9ICovc3RhdGljc1tfaV07XG4gICAgICAgIHZhciB2YWx1ZSA9IHN0YXRpY3NbX2kgKyAxXTtcbiAgICAgICAgdXBkYXRlQXR0cmlidXRlKG5vZGUsIG5hbWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gRG93biB0aGUgcm9hZCwgd2UgbWF5IHdhbnQgdG8ga2VlcCB0cmFjayBvZiB0aGUgc3RhdGljcyBhcnJheSB0byB1c2UgaXRcbiAgICAvLyBhcyBhbiBhZGRpdGlvbmFsIHNpZ25hbCBhYm91dCB3aGV0aGVyIGEgbm9kZSBtYXRjaGVzIG9yIG5vdC4gRm9yIG5vdyxcbiAgICAvLyBqdXN0IHVzZSBhIG1hcmtlciBzbyB0aGF0IHdlIGRvIG5vdCByZWFwcGx5IHN0YXRpY3MuXG4gICAgZGF0YS5zdGF0aWNzQXBwbGllZCA9IHRydWU7XG4gIH1cblxuICAvKlxuICAgKiBDaGVja3MgdG8gc2VlIGlmIG9uZSBvciBtb3JlIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkIGZvciBhIGdpdmVuIEVsZW1lbnQuXG4gICAqIFdoZW4gbm8gYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQsIHRoaXMgaXMgbXVjaCBmYXN0ZXIgdGhhbiBjaGVja2luZyBlYWNoXG4gICAqIGluZGl2aWR1YWwgYXJndW1lbnQuIFdoZW4gYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQsIHRoZSBvdmVyaGVhZCBvZiB0aGlzIGlzXG4gICAqIG1pbmltYWwuXG4gICAqL1xuICB2YXIgYXR0cnNBcnIgPSBkYXRhLmF0dHJzQXJyO1xuICB2YXIgbmV3QXR0cnMgPSBkYXRhLm5ld0F0dHJzO1xuICB2YXIgaXNOZXcgPSAhYXR0cnNBcnIubGVuZ3RoO1xuICB2YXIgaSA9IEFUVFJJQlVURVNfT0ZGU0VUO1xuICB2YXIgaiA9IDA7XG5cbiAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDIsIGogKz0gMikge1xuICAgIHZhciBfYXR0ciA9IGFyZ3VtZW50c1tpXTtcbiAgICBpZiAoaXNOZXcpIHtcbiAgICAgIGF0dHJzQXJyW2pdID0gX2F0dHI7XG4gICAgICBuZXdBdHRyc1tfYXR0cl0gPSB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIGlmIChhdHRyc0FycltqXSAhPT0gX2F0dHIpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciB2YWx1ZSA9IGFyZ3VtZW50c1tpICsgMV07XG4gICAgaWYgKGlzTmV3IHx8IGF0dHJzQXJyW2ogKyAxXSAhPT0gdmFsdWUpIHtcbiAgICAgIGF0dHJzQXJyW2ogKyAxXSA9IHZhbHVlO1xuICAgICAgdXBkYXRlQXR0cmlidXRlKG5vZGUsIF9hdHRyLCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGkgPCBhcmd1bWVudHMubGVuZ3RoIHx8IGogPCBhdHRyc0Fyci5sZW5ndGgpIHtcbiAgICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSwgaiArPSAxKSB7XG4gICAgICBhdHRyc0FycltqXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBpZiAoaiA8IGF0dHJzQXJyLmxlbmd0aCkge1xuICAgICAgYXR0cnNBcnIubGVuZ3RoID0gajtcbiAgICB9XG5cbiAgICAvKlxuICAgICAqIEFjdHVhbGx5IHBlcmZvcm0gdGhlIGF0dHJpYnV0ZSB1cGRhdGUuXG4gICAgICovXG4gICAgZm9yIChpID0gMDsgaSA8IGF0dHJzQXJyLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICB2YXIgbmFtZSA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqL2F0dHJzQXJyW2ldO1xuICAgICAgdmFyIHZhbHVlID0gYXR0cnNBcnJbaSArIDFdO1xuICAgICAgbmV3QXR0cnNbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBfYXR0cjIgaW4gbmV3QXR0cnMpIHtcbiAgICAgIHVwZGF0ZUF0dHJpYnV0ZShub2RlLCBfYXR0cjIsIG5ld0F0dHJzW19hdHRyMl0pO1xuICAgICAgbmV3QXR0cnNbX2F0dHIyXSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn07XG5cbi8qKlxuICogRGVjbGFyZXMgYSB2aXJ0dWFsIEVsZW1lbnQgYXQgdGhlIGN1cnJlbnQgbG9jYXRpb24gaW4gdGhlIGRvY3VtZW50LiBUaGlzXG4gKiBjb3JyZXNwb25kcyB0byBhbiBvcGVuaW5nIHRhZyBhbmQgYSBlbGVtZW50Q2xvc2UgdGFnIGlzIHJlcXVpcmVkLiBUaGlzIGlzXG4gKiBsaWtlIGVsZW1lbnRPcGVuLCBidXQgdGhlIGF0dHJpYnV0ZXMgYXJlIGRlZmluZWQgdXNpbmcgdGhlIGF0dHIgZnVuY3Rpb25cbiAqIHJhdGhlciB0aGFuIGJlaW5nIHBhc3NlZCBhcyBhcmd1bWVudHMuIE11c3QgYmUgZm9sbGxvd2VkIGJ5IDAgb3IgbW9yZSBjYWxsc1xuICogdG8gYXR0ciwgdGhlbiBhIGNhbGwgdG8gZWxlbWVudE9wZW5FbmQuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAqL1xudmFyIGVsZW1lbnRPcGVuU3RhcnQgPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoJ2VsZW1lbnRPcGVuU3RhcnQnKTtcbiAgICBzZXRJbkF0dHJpYnV0ZXModHJ1ZSk7XG4gIH1cblxuICBhcmdzQnVpbGRlclswXSA9IHRhZztcbiAgYXJnc0J1aWxkZXJbMV0gPSBrZXk7XG4gIGFyZ3NCdWlsZGVyWzJdID0gc3RhdGljcztcbn07XG5cbi8qKipcbiAqIERlZmluZXMgYSB2aXJ0dWFsIGF0dHJpYnV0ZSBhdCB0aGlzIHBvaW50IG9mIHRoZSBET00uIFRoaXMgaXMgb25seSB2YWxpZFxuICogd2hlbiBjYWxsZWQgYmV0d2VlbiBlbGVtZW50T3BlblN0YXJ0IGFuZCBlbGVtZW50T3BlbkVuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICovXG52YXIgYXR0ciA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydEluQXR0cmlidXRlcygnYXR0cicpO1xuICB9XG5cbiAgYXJnc0J1aWxkZXIucHVzaChuYW1lKTtcbiAgYXJnc0J1aWxkZXIucHVzaCh2YWx1ZSk7XG59O1xuXG4vKipcbiAqIENsb3NlcyBhbiBvcGVuIHRhZyBzdGFydGVkIHdpdGggZWxlbWVudE9wZW5TdGFydC5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgZWxlbWVudE9wZW5FbmQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0SW5BdHRyaWJ1dGVzKCdlbGVtZW50T3BlbkVuZCcpO1xuICAgIHNldEluQXR0cmlidXRlcyhmYWxzZSk7XG4gIH1cblxuICB2YXIgbm9kZSA9IGVsZW1lbnRPcGVuLmFwcGx5KG51bGwsIGFyZ3NCdWlsZGVyKTtcbiAgYXJnc0J1aWxkZXIubGVuZ3RoID0gMDtcbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIENsb3NlcyBhbiBvcGVuIHZpcnR1YWwgRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBlbGVtZW50Q2xvc2UgPSBmdW5jdGlvbiAodGFnKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCdlbGVtZW50Q2xvc2UnKTtcbiAgfVxuXG4gIHZhciBub2RlID0gY29yZUVsZW1lbnRDbG9zZSgpO1xuXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Q2xvc2VNYXRjaGVzT3BlblRhZyhnZXREYXRhKG5vZGUpLm5vZGVOYW1lLCB0YWcpO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudCB0aGF0IGhhc1xuICogbm8gY2hpbGRyZW4uXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAqIEBwYXJhbSB7Li4uKn0gdmFyX2FyZ3MgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICogICAgIGZvciB0aGUgRWxlbWVudC5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgZWxlbWVudFZvaWQgPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MsIHZhcl9hcmdzKSB7XG4gIGVsZW1lbnRPcGVuLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gIHJldHVybiBlbGVtZW50Q2xvc2UodGFnKTtcbn07XG5cbi8qKlxuICogRGVjbGFyZXMgYSB2aXJ0dWFsIFRleHQgYXQgdGhpcyBwb2ludCBpbiB0aGUgZG9jdW1lbnQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfGJvb2xlYW59IHZhbHVlIFRoZSB2YWx1ZSBvZiB0aGUgVGV4dC5cbiAqIEBwYXJhbSB7Li4uKGZ1bmN0aW9uKChzdHJpbmd8bnVtYmVyfGJvb2xlYW4pKTpzdHJpbmcpfSB2YXJfYXJnc1xuICogICAgIEZ1bmN0aW9ucyB0byBmb3JtYXQgdGhlIHZhbHVlIHdoaWNoIGFyZSBjYWxsZWQgb25seSB3aGVuIHRoZSB2YWx1ZSBoYXNcbiAqICAgICBjaGFuZ2VkLlxuICogQHJldHVybiB7IVRleHR9IFRoZSBjb3JyZXNwb25kaW5nIHRleHQgbm9kZS5cbiAqL1xudmFyIHRleHQgPSBmdW5jdGlvbiAodmFsdWUsIHZhcl9hcmdzKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCd0ZXh0Jyk7XG4gICAgYXNzZXJ0Tm90SW5Ta2lwKCd0ZXh0Jyk7XG4gIH1cblxuICB2YXIgbm9kZSA9IGNvcmVUZXh0KCk7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcblxuICBpZiAoZGF0YS50ZXh0ICE9PSB2YWx1ZSkge1xuICAgIGRhdGEudGV4dCA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqL3ZhbHVlO1xuXG4gICAgdmFyIGZvcm1hdHRlZCA9IHZhbHVlO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAvKlxuICAgICAgICogQ2FsbCB0aGUgZm9ybWF0dGVyIGZ1bmN0aW9uIGRpcmVjdGx5IHRvIHByZXZlbnQgbGVha2luZyBhcmd1bWVudHMuXG4gICAgICAgKiBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2luY3JlbWVudGFsLWRvbS9wdWxsLzIwNCNpc3N1ZWNvbW1lbnQtMTc4MjIzNTc0XG4gICAgICAgKi9cbiAgICAgIHZhciBmbiA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGZvcm1hdHRlZCA9IGZuKGZvcm1hdHRlZCk7XG4gICAgfVxuXG4gICAgbm9kZS5kYXRhID0gZm9ybWF0dGVkO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59O1xuXG5leHBvcnRzLnBhdGNoID0gcGF0Y2hJbm5lcjtcbmV4cG9ydHMucGF0Y2hJbm5lciA9IHBhdGNoSW5uZXI7XG5leHBvcnRzLnBhdGNoT3V0ZXIgPSBwYXRjaE91dGVyO1xuZXhwb3J0cy5jdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50O1xuZXhwb3J0cy5jdXJyZW50UG9pbnRlciA9IGN1cnJlbnRQb2ludGVyO1xuZXhwb3J0cy5za2lwID0gc2tpcDtcbmV4cG9ydHMuc2tpcE5vZGUgPSBza2lwTm9kZTtcbmV4cG9ydHMuZWxlbWVudFZvaWQgPSBlbGVtZW50Vm9pZDtcbmV4cG9ydHMuZWxlbWVudE9wZW5TdGFydCA9IGVsZW1lbnRPcGVuU3RhcnQ7XG5leHBvcnRzLmVsZW1lbnRPcGVuRW5kID0gZWxlbWVudE9wZW5FbmQ7XG5leHBvcnRzLmVsZW1lbnRPcGVuID0gZWxlbWVudE9wZW47XG5leHBvcnRzLmVsZW1lbnRDbG9zZSA9IGVsZW1lbnRDbG9zZTtcbmV4cG9ydHMudGV4dCA9IHRleHQ7XG5leHBvcnRzLmF0dHIgPSBhdHRyO1xuZXhwb3J0cy5zeW1ib2xzID0gc3ltYm9scztcbmV4cG9ydHMuYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7XG5leHBvcnRzLmFwcGx5QXR0ciA9IGFwcGx5QXR0cjtcbmV4cG9ydHMuYXBwbHlQcm9wID0gYXBwbHlQcm9wO1xuZXhwb3J0cy5ub3RpZmljYXRpb25zID0gbm90aWZpY2F0aW9ucztcbmV4cG9ydHMuaW1wb3J0Tm9kZSA9IGltcG9ydE5vZGU7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluY3JlbWVudGFsLWRvbS1janMuanMubWFwIiwiZXhwb3J0c1snZGF0ZS10aW1lJ10gPSAvXlxcZHs0fS0oPzowWzAtOV17MX18MVswLTJdezF9KS1bMC05XXsyfVt0VCBdXFxkezJ9OlxcZHsyfTpcXGR7Mn0oXFwuXFxkKyk/KFt6Wl18WystXVxcZHsyfTpcXGR7Mn0pJC9cbmV4cG9ydHNbJ2RhdGUnXSA9IC9eXFxkezR9LSg/OjBbMC05XXsxfXwxWzAtMl17MX0pLVswLTldezJ9JC9cbmV4cG9ydHNbJ3RpbWUnXSA9IC9eXFxkezJ9OlxcZHsyfTpcXGR7Mn0kL1xuZXhwb3J0c1snZW1haWwnXSA9IC9eXFxTK0BcXFMrJC9cbmV4cG9ydHNbJ2lwLWFkZHJlc3MnXSA9IGV4cG9ydHNbJ2lwdjQnXSA9IC9eKD86KD86MjVbMC01XXwyWzAtNF1bMC05XXxbMDFdP1swLTldWzAtOV0/KVxcLil7M30oPzoyNVswLTVdfDJbMC00XVswLTldfFswMV0/WzAtOV1bMC05XT8pJC9cbmV4cG9ydHNbJ2lwdjYnXSA9IC9eXFxzKigoKFswLTlBLUZhLWZdezEsNH06KXs3fShbMC05QS1GYS1mXXsxLDR9fDopKXwoKFswLTlBLUZhLWZdezEsNH06KXs2fSg6WzAtOUEtRmEtZl17MSw0fXwoKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKShcXC4oMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKXszfSl8OikpfCgoWzAtOUEtRmEtZl17MSw0fTopezV9KCgoOlswLTlBLUZhLWZdezEsNH0pezEsMn0pfDooKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKShcXC4oMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKXszfSl8OikpfCgoWzAtOUEtRmEtZl17MSw0fTopezR9KCgoOlswLTlBLUZhLWZdezEsNH0pezEsM30pfCgoOlswLTlBLUZhLWZdezEsNH0pPzooKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKShcXC4oMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKXszfSkpfDopKXwoKFswLTlBLUZhLWZdezEsNH06KXszfSgoKDpbMC05QS1GYS1mXXsxLDR9KXsxLDR9KXwoKDpbMC05QS1GYS1mXXsxLDR9KXswLDJ9OigoMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKFxcLigyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkpezN9KSl8OikpfCgoWzAtOUEtRmEtZl17MSw0fTopezJ9KCgoOlswLTlBLUZhLWZdezEsNH0pezEsNX0pfCgoOlswLTlBLUZhLWZdezEsNH0pezAsM306KCgyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkoXFwuKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKSl7M30pKXw6KSl8KChbMC05QS1GYS1mXXsxLDR9Oil7MX0oKCg6WzAtOUEtRmEtZl17MSw0fSl7MSw2fSl8KCg6WzAtOUEtRmEtZl17MSw0fSl7MCw0fTooKDI1WzAtNV18MlswLTRdXFxkfDFcXGRcXGR8WzEtOV0/XFxkKShcXC4oMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKXszfSkpfDopKXwoOigoKDpbMC05QS1GYS1mXXsxLDR9KXsxLDd9KXwoKDpbMC05QS1GYS1mXXsxLDR9KXswLDV9OigoMjVbMC01XXwyWzAtNF1cXGR8MVxcZFxcZHxbMS05XT9cXGQpKFxcLigyNVswLTVdfDJbMC00XVxcZHwxXFxkXFxkfFsxLTldP1xcZCkpezN9KSl8OikpKSglLispP1xccyokL1xuZXhwb3J0c1sndXJpJ10gPSAvXlthLXpBLVpdW2EtekEtWjAtOSstLl0qOlteXFxzXSokL1xuZXhwb3J0c1snY29sb3InXSA9IC8oIz8oWzAtOUEtRmEtZl17Myw2fSlcXGIpfChhcXVhKXwoYmxhY2spfChibHVlKXwoZnVjaHNpYSl8KGdyYXkpfChncmVlbil8KGxpbWUpfChtYXJvb24pfChuYXZ5KXwob2xpdmUpfChvcmFuZ2UpfChwdXJwbGUpfChyZWQpfChzaWx2ZXIpfCh0ZWFsKXwod2hpdGUpfCh5ZWxsb3cpfChyZ2JcXChcXHMqXFxiKFswLTldfFsxLTldWzAtOV18MVswLTldWzAtOV18MlswLTRdWzAtOV18MjVbMC01XSlcXGJcXHMqLFxccypcXGIoWzAtOV18WzEtOV1bMC05XXwxWzAtOV1bMC05XXwyWzAtNF1bMC05XXwyNVswLTVdKVxcYlxccyosXFxzKlxcYihbMC05XXxbMS05XVswLTldfDFbMC05XVswLTldfDJbMC00XVswLTldfDI1WzAtNV0pXFxiXFxzKlxcKSl8KHJnYlxcKFxccyooXFxkP1xcZCV8MTAwJSkrXFxzKixcXHMqKFxcZD9cXGQlfDEwMCUpK1xccyosXFxzKihcXGQ/XFxkJXwxMDAlKStcXHMqXFwpKS9cbmV4cG9ydHNbJ2hvc3RuYW1lJ10gPSAvXihbYS16QS1aMC05XXxbYS16QS1aMC05XVthLXpBLVowLTlcXC1dezAsNjF9W2EtekEtWjAtOV0pKFxcLihbYS16QS1aMC05XXxbYS16QS1aMC05XVthLXpBLVowLTlcXC1dezAsNjF9W2EtekEtWjAtOV0pKSokL1xuZXhwb3J0c1snYWxwaGEnXSA9IC9eW2EtekEtWl0rJC9cbmV4cG9ydHNbJ2FscGhhbnVtZXJpYyddID0gL15bYS16QS1aMC05XSskL1xuZXhwb3J0c1snc3R5bGUnXSA9IC9cXHMqKC4rPyk6XFxzKihbXjtdKyk7Py9nXG5leHBvcnRzWydwaG9uZSddID0gL15cXCsoPzpbMC05XSA/KXs2LDE0fVswLTldJC9cbmV4cG9ydHNbJ3V0Yy1taWxsaXNlYyddID0gL15bMC05XXsxLDE1fVxcLj9bMC05XXswLDE1fSQvXG4iLCJ2YXIgZ2Vub2JqID0gcmVxdWlyZSgnZ2VuZXJhdGUtb2JqZWN0LXByb3BlcnR5JylcbnZhciBnZW5mdW4gPSByZXF1aXJlKCdnZW5lcmF0ZS1mdW5jdGlvbicpXG52YXIganNvbnBvaW50ZXIgPSByZXF1aXJlKCdqc29ucG9pbnRlcicpXG52YXIgeHRlbmQgPSByZXF1aXJlKCd4dGVuZCcpXG52YXIgZm9ybWF0cyA9IHJlcXVpcmUoJy4vZm9ybWF0cycpXG5cbnZhciBnZXQgPSBmdW5jdGlvbihvYmosIGFkZGl0aW9uYWxTY2hlbWFzLCBwdHIpIHtcblxuICB2YXIgdmlzaXQgPSBmdW5jdGlvbihzdWIpIHtcbiAgICBpZiAoc3ViICYmIHN1Yi5pZCA9PT0gcHRyKSByZXR1cm4gc3ViXG4gICAgaWYgKHR5cGVvZiBzdWIgIT09ICdvYmplY3QnIHx8ICFzdWIpIHJldHVybiBudWxsXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHN1YikucmVkdWNlKGZ1bmN0aW9uKHJlcywgaykge1xuICAgICAgcmV0dXJuIHJlcyB8fCB2aXNpdChzdWJba10pXG4gICAgfSwgbnVsbClcbiAgfVxuXG4gIHZhciByZXMgPSB2aXNpdChvYmopXG4gIGlmIChyZXMpIHJldHVybiByZXNcblxuICBwdHIgPSBwdHIucmVwbGFjZSgvXiMvLCAnJylcbiAgcHRyID0gcHRyLnJlcGxhY2UoL1xcLyQvLCAnJylcblxuICB0cnkge1xuICAgIHJldHVybiBqc29ucG9pbnRlci5nZXQob2JqLCBkZWNvZGVVUkkocHRyKSlcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdmFyIGVuZCA9IHB0ci5pbmRleE9mKCcjJylcbiAgICB2YXIgb3RoZXJcbiAgICAvLyBleHRlcm5hbCByZWZlcmVuY2VcbiAgICBpZiAoZW5kICE9PSAwKSB7XG4gICAgICAvLyBmcmFnbWVudCBkb2Vzbid0IGV4aXN0LlxuICAgICAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgICAgb3RoZXIgPSBhZGRpdGlvbmFsU2NoZW1hc1twdHJdXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZXh0ID0gcHRyLnNsaWNlKDAsIGVuZClcbiAgICAgICAgb3RoZXIgPSBhZGRpdGlvbmFsU2NoZW1hc1tleHRdXG4gICAgICAgIHZhciBmcmFnbWVudCA9IHB0ci5zbGljZShlbmQpLnJlcGxhY2UoL14jLywgJycpXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIGpzb25wb2ludGVyLmdldChvdGhlciwgZnJhZ21lbnQpXG4gICAgICAgIH0gY2F0Y2ggKGVycikge31cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgb3RoZXIgPSBhZGRpdGlvbmFsU2NoZW1hc1twdHJdXG4gICAgfVxuICAgIHJldHVybiBvdGhlciB8fCBudWxsXG4gIH1cbn1cblxudmFyIGZvcm1hdE5hbWUgPSBmdW5jdGlvbihmaWVsZCkge1xuICBmaWVsZCA9IEpTT04uc3RyaW5naWZ5KGZpZWxkKVxuICB2YXIgcGF0dGVybiA9IC9cXFsoW15cXFtcXF1cIl0rKVxcXS9cbiAgd2hpbGUgKHBhdHRlcm4udGVzdChmaWVsZCkpIGZpZWxkID0gZmllbGQucmVwbGFjZShwYXR0ZXJuLCAnLlwiKyQxK1wiJylcbiAgcmV0dXJuIGZpZWxkXG59XG5cbnZhciB0eXBlcyA9IHt9XG5cbnR5cGVzLmFueSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gJ3RydWUnXG59XG5cbnR5cGVzLm51bGwgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiBuYW1lKycgPT09IG51bGwnXG59XG5cbnR5cGVzLmJvb2xlYW4gPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiAndHlwZW9mICcrbmFtZSsnID09PSBcImJvb2xlYW5cIidcbn1cblxudHlwZXMuYXJyYXkgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiAnQXJyYXkuaXNBcnJheSgnK25hbWUrJyknXG59XG5cbnR5cGVzLm9iamVjdCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuICd0eXBlb2YgJytuYW1lKycgPT09IFwib2JqZWN0XCIgJiYgJytuYW1lKycgJiYgIUFycmF5LmlzQXJyYXkoJytuYW1lKycpJ1xufVxuXG50eXBlcy5udW1iZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiAndHlwZW9mICcrbmFtZSsnID09PSBcIm51bWJlclwiJ1xufVxuXG50eXBlcy5pbnRlZ2VyID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gJ3R5cGVvZiAnK25hbWUrJyA9PT0gXCJudW1iZXJcIiAmJiAoTWF0aC5mbG9vcignK25hbWUrJykgPT09ICcrbmFtZSsnIHx8ICcrbmFtZSsnID4gOTAwNzE5OTI1NDc0MDk5MiB8fCAnK25hbWUrJyA8IC05MDA3MTk5MjU0NzQwOTkyKSdcbn1cblxudHlwZXMuc3RyaW5nID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gJ3R5cGVvZiAnK25hbWUrJyA9PT0gXCJzdHJpbmdcIidcbn1cblxudmFyIHVuaXF1ZSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gIHZhciBsaXN0ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgIGxpc3QucHVzaCh0eXBlb2YgYXJyYXlbaV0gPT09ICdvYmplY3QnID8gSlNPTi5zdHJpbmdpZnkoYXJyYXlbaV0pIDogYXJyYXlbaV0pXG4gIH1cbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGxpc3QuaW5kZXhPZihsaXN0W2ldKSAhPT0gaSkgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cblxudmFyIGlzTXVsdGlwbGVPZiA9IGZ1bmN0aW9uKG5hbWUsIG11bHRpcGxlT2YpIHtcbiAgdmFyIHJlcztcbiAgdmFyIGZhY3RvciA9ICgobXVsdGlwbGVPZiB8IDApICE9PSBtdWx0aXBsZU9mKSA/IE1hdGgucG93KDEwLCBtdWx0aXBsZU9mLnRvU3RyaW5nKCkuc3BsaXQoJy4nKS5wb3AoKS5sZW5ndGgpIDogMVxuICBpZiAoZmFjdG9yID4gMSkge1xuICAgIHZhciBmYWN0b3JOYW1lID0gKChuYW1lIHwgMCkgIT09IG5hbWUpID8gTWF0aC5wb3coMTAsIG5hbWUudG9TdHJpbmcoKS5zcGxpdCgnLicpLnBvcCgpLmxlbmd0aCkgOiAxXG4gICAgaWYgKGZhY3Rvck5hbWUgPiBmYWN0b3IpIHJlcyA9IHRydWVcbiAgICBlbHNlIHJlcyA9IE1hdGgucm91bmQoZmFjdG9yICogbmFtZSkgJSAoZmFjdG9yICogbXVsdGlwbGVPZilcbiAgfVxuICBlbHNlIHJlcyA9IG5hbWUgJSBtdWx0aXBsZU9mO1xuICByZXR1cm4gIXJlcztcbn1cblxudmFyIHRvVHlwZSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgcmV0dXJuIG5vZGUudHlwZVxufVxuXG52YXIgY29tcGlsZSA9IGZ1bmN0aW9uKHNjaGVtYSwgY2FjaGUsIHJvb3QsIHJlcG9ydGVyLCBvcHRzKSB7XG4gIHZhciBmbXRzID0gb3B0cyA/IHh0ZW5kKGZvcm1hdHMsIG9wdHMuZm9ybWF0cykgOiBmb3JtYXRzXG4gIHZhciBzY29wZSA9IHt1bmlxdWU6dW5pcXVlLCBmb3JtYXRzOmZtdHMsIGlzTXVsdGlwbGVPZjppc011bHRpcGxlT2Z9XG4gIHZhciB2ZXJib3NlID0gb3B0cyA/ICEhb3B0cy52ZXJib3NlIDogZmFsc2U7XG4gIHZhciBncmVlZHkgPSBvcHRzICYmIG9wdHMuZ3JlZWR5ICE9PSB1bmRlZmluZWQgP1xuICAgIG9wdHMuZ3JlZWR5IDogZmFsc2U7XG5cbiAgdmFyIHN5bXMgPSB7fVxuICB2YXIgZ2Vuc3ltID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiBuYW1lKyhzeW1zW25hbWVdID0gKHN5bXNbbmFtZV0gfHwgMCkrMSlcbiAgfVxuXG4gIHZhciByZXZlcnNlUGF0dGVybnMgPSB7fVxuICB2YXIgcGF0dGVybnMgPSBmdW5jdGlvbihwKSB7XG4gICAgaWYgKHJldmVyc2VQYXR0ZXJuc1twXSkgcmV0dXJuIHJldmVyc2VQYXR0ZXJuc1twXVxuICAgIHZhciBuID0gZ2Vuc3ltKCdwYXR0ZXJuJylcbiAgICBzY29wZVtuXSA9IG5ldyBSZWdFeHAocClcbiAgICByZXZlcnNlUGF0dGVybnNbcF0gPSBuXG4gICAgcmV0dXJuIG5cbiAgfVxuXG4gIHZhciB2YXJzID0gWydpJywnaicsJ2snLCdsJywnbScsJ24nLCdvJywncCcsJ3EnLCdyJywncycsJ3QnLCd1JywndicsJ3gnLCd5JywneiddXG4gIHZhciBnZW5sb29wID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHYgPSB2YXJzLnNoaWZ0KClcbiAgICB2YXJzLnB1c2godit2WzBdKVxuICAgIHJldHVybiB2XG4gIH1cblxuICB2YXIgdmlzaXQgPSBmdW5jdGlvbihuYW1lLCBub2RlLCByZXBvcnRlciwgZmlsdGVyKSB7XG4gICAgdmFyIHByb3BlcnRpZXMgPSBub2RlLnByb3BlcnRpZXNcbiAgICB2YXIgdHlwZSA9IG5vZGUudHlwZVxuICAgIHZhciB0dXBsZSA9IGZhbHNlXG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShub2RlLml0ZW1zKSkgeyAvLyB0dXBsZSB0eXBlXG4gICAgICBwcm9wZXJ0aWVzID0ge31cbiAgICAgIG5vZGUuaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtLCBpKSB7XG4gICAgICAgIHByb3BlcnRpZXNbaV0gPSBpdGVtXG4gICAgICB9KVxuICAgICAgdHlwZSA9ICdhcnJheSdcbiAgICAgIHR1cGxlID0gdHJ1ZVxuICAgIH1cblxuICAgIHZhciBpbmRlbnQgPSAwXG4gICAgdmFyIGVycm9yID0gZnVuY3Rpb24obXNnLCBwcm9wLCB2YWx1ZSkge1xuICAgICAgdmFsaWRhdGUoJ2Vycm9ycysrJylcbiAgICAgIGlmIChyZXBvcnRlciA9PT0gdHJ1ZSkge1xuICAgICAgICB2YWxpZGF0ZSgnaWYgKHZhbGlkYXRlLmVycm9ycyA9PT0gbnVsbCkgdmFsaWRhdGUuZXJyb3JzID0gW10nKVxuICAgICAgICBpZiAodmVyYm9zZSkge1xuICAgICAgICAgIHZhbGlkYXRlKCd2YWxpZGF0ZS5lcnJvcnMucHVzaCh7ZmllbGQ6JXMsbWVzc2FnZTolcyx2YWx1ZTolcyx0eXBlOiVzfSknLCBmb3JtYXROYW1lKHByb3AgfHwgbmFtZSksIEpTT04uc3RyaW5naWZ5KG1zZyksIHZhbHVlIHx8IG5hbWUsIEpTT04uc3RyaW5naWZ5KHR5cGUpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbGlkYXRlKCd2YWxpZGF0ZS5lcnJvcnMucHVzaCh7ZmllbGQ6JXMsbWVzc2FnZTolc30pJywgZm9ybWF0TmFtZShwcm9wIHx8IG5hbWUpLCBKU09OLnN0cmluZ2lmeShtc2cpKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG5vZGUucmVxdWlyZWQgPT09IHRydWUpIHtcbiAgICAgIGluZGVudCsrXG4gICAgICB2YWxpZGF0ZSgnaWYgKCVzID09PSB1bmRlZmluZWQpIHsnLCBuYW1lKVxuICAgICAgZXJyb3IoJ2lzIHJlcXVpcmVkJylcbiAgICAgIHZhbGlkYXRlKCd9IGVsc2UgeycpXG4gICAgfSBlbHNlIHtcbiAgICAgIGluZGVudCsrXG4gICAgICB2YWxpZGF0ZSgnaWYgKCVzICE9PSB1bmRlZmluZWQpIHsnLCBuYW1lKVxuICAgIH1cblxuICAgIHZhciB2YWxpZCA9IFtdLmNvbmNhdCh0eXBlKVxuICAgICAgLm1hcChmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiB0eXBlc1t0IHx8ICdhbnknXShuYW1lKVxuICAgICAgfSlcbiAgICAgIC5qb2luKCcgfHwgJykgfHwgJ3RydWUnXG5cbiAgICBpZiAodmFsaWQgIT09ICd0cnVlJykge1xuICAgICAgaW5kZW50KytcbiAgICAgIHZhbGlkYXRlKCdpZiAoISglcykpIHsnLCB2YWxpZClcbiAgICAgIGVycm9yKCdpcyB0aGUgd3JvbmcgdHlwZScpXG4gICAgICB2YWxpZGF0ZSgnfSBlbHNlIHsnKVxuICAgIH1cblxuICAgIGlmICh0dXBsZSkge1xuICAgICAgaWYgKG5vZGUuYWRkaXRpb25hbEl0ZW1zID09PSBmYWxzZSkge1xuICAgICAgICB2YWxpZGF0ZSgnaWYgKCVzLmxlbmd0aCA+ICVkKSB7JywgbmFtZSwgbm9kZS5pdGVtcy5sZW5ndGgpXG4gICAgICAgIGVycm9yKCdoYXMgYWRkaXRpb25hbCBpdGVtcycpXG4gICAgICAgIHZhbGlkYXRlKCd9JylcbiAgICAgIH0gZWxzZSBpZiAobm9kZS5hZGRpdGlvbmFsSXRlbXMpIHtcbiAgICAgICAgdmFyIGkgPSBnZW5sb29wKClcbiAgICAgICAgdmFsaWRhdGUoJ2ZvciAodmFyICVzID0gJWQ7ICVzIDwgJXMubGVuZ3RoOyAlcysrKSB7JywgaSwgbm9kZS5pdGVtcy5sZW5ndGgsIGksIG5hbWUsIGkpXG4gICAgICAgIHZpc2l0KG5hbWUrJ1snK2krJ10nLCBub2RlLmFkZGl0aW9uYWxJdGVtcywgcmVwb3J0ZXIsIGZpbHRlcilcbiAgICAgICAgdmFsaWRhdGUoJ30nKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChub2RlLmZvcm1hdCAmJiBmbXRzW25vZGUuZm9ybWF0XSkge1xuICAgICAgaWYgKHR5cGUgIT09ICdzdHJpbmcnICYmIGZvcm1hdHNbbm9kZS5mb3JtYXRdKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMuc3RyaW5nKG5hbWUpKVxuICAgICAgdmFyIG4gPSBnZW5zeW0oJ2Zvcm1hdCcpXG4gICAgICBzY29wZVtuXSA9IGZtdHNbbm9kZS5mb3JtYXRdXG5cbiAgICAgIGlmICh0eXBlb2Ygc2NvcGVbbl0gPT09ICdmdW5jdGlvbicpIHZhbGlkYXRlKCdpZiAoISVzKCVzKSkgeycsIG4sIG5hbWUpXG4gICAgICBlbHNlIHZhbGlkYXRlKCdpZiAoISVzLnRlc3QoJXMpKSB7JywgbiwgbmFtZSlcbiAgICAgIGVycm9yKCdtdXN0IGJlICcrbm9kZS5mb3JtYXQrJyBmb3JtYXQnKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuICAgICAgaWYgKHR5cGUgIT09ICdzdHJpbmcnICYmIGZvcm1hdHNbbm9kZS5mb3JtYXRdKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkobm9kZS5yZXF1aXJlZCkpIHtcbiAgICAgIHZhciBpc1VuZGVmaW5lZCA9IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICByZXR1cm4gZ2Vub2JqKG5hbWUsIHJlcSkgKyAnID09PSB1bmRlZmluZWQnXG4gICAgICB9XG5cbiAgICAgIHZhciBjaGVja1JlcXVpcmVkID0gZnVuY3Rpb24gKHJlcSkge1xuICAgICAgICB2YXIgcHJvcCA9IGdlbm9iaihuYW1lLCByZXEpO1xuICAgICAgICB2YWxpZGF0ZSgnaWYgKCVzID09PSB1bmRlZmluZWQpIHsnLCBwcm9wKVxuICAgICAgICBlcnJvcignaXMgcmVxdWlyZWQnLCBwcm9wKVxuICAgICAgICB2YWxpZGF0ZSgnbWlzc2luZysrJylcbiAgICAgICAgdmFsaWRhdGUoJ30nKVxuICAgICAgfVxuICAgICAgdmFsaWRhdGUoJ2lmICgoJXMpKSB7JywgdHlwZSAhPT0gJ29iamVjdCcgPyB0eXBlcy5vYmplY3QobmFtZSkgOiAndHJ1ZScpXG4gICAgICB2YWxpZGF0ZSgndmFyIG1pc3NpbmcgPSAwJylcbiAgICAgIG5vZGUucmVxdWlyZWQubWFwKGNoZWNrUmVxdWlyZWQpXG4gICAgICB2YWxpZGF0ZSgnfScpO1xuICAgICAgaWYgKCFncmVlZHkpIHtcbiAgICAgICAgdmFsaWRhdGUoJ2lmIChtaXNzaW5nID09PSAwKSB7JylcbiAgICAgICAgaW5kZW50KytcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobm9kZS51bmlxdWVJdGVtcykge1xuICAgICAgaWYgKHR5cGUgIT09ICdhcnJheScpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5hcnJheShuYW1lKSlcbiAgICAgIHZhbGlkYXRlKCdpZiAoISh1bmlxdWUoJXMpKSkgeycsIG5hbWUpXG4gICAgICBlcnJvcignbXVzdCBiZSB1bmlxdWUnKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuICAgICAgaWYgKHR5cGUgIT09ICdhcnJheScpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5lbnVtKSB7XG4gICAgICB2YXIgY29tcGxleCA9IG5vZGUuZW51bS5zb21lKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBlID09PSAnb2JqZWN0J1xuICAgICAgfSlcblxuICAgICAgdmFyIGNvbXBhcmUgPSBjb21wbGV4ID9cbiAgICAgICAgZnVuY3Rpb24oZSkge1xuICAgICAgICAgIHJldHVybiAnSlNPTi5zdHJpbmdpZnkoJytuYW1lKycpJysnICE9PSBKU09OLnN0cmluZ2lmeSgnK0pTT04uc3RyaW5naWZ5KGUpKycpJ1xuICAgICAgICB9IDpcbiAgICAgICAgZnVuY3Rpb24oZSkge1xuICAgICAgICAgIHJldHVybiBuYW1lKycgIT09ICcrSlNPTi5zdHJpbmdpZnkoZSlcbiAgICAgICAgfVxuXG4gICAgICB2YWxpZGF0ZSgnaWYgKCVzKSB7Jywgbm9kZS5lbnVtLm1hcChjb21wYXJlKS5qb2luKCcgJiYgJykgfHwgJ2ZhbHNlJylcbiAgICAgIGVycm9yKCdtdXN0IGJlIGFuIGVudW0gdmFsdWUnKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLmRlcGVuZGVuY2llcykge1xuICAgICAgaWYgKHR5cGUgIT09ICdvYmplY3QnKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMub2JqZWN0KG5hbWUpKVxuXG4gICAgICBPYmplY3Qua2V5cyhub2RlLmRlcGVuZGVuY2llcykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgdmFyIGRlcHMgPSBub2RlLmRlcGVuZGVuY2llc1trZXldXG4gICAgICAgIGlmICh0eXBlb2YgZGVwcyA9PT0gJ3N0cmluZycpIGRlcHMgPSBbZGVwc11cblxuICAgICAgICB2YXIgZXhpc3RzID0gZnVuY3Rpb24oaykge1xuICAgICAgICAgIHJldHVybiBnZW5vYmoobmFtZSwgaykgKyAnICE9PSB1bmRlZmluZWQnXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkZXBzKSkge1xuICAgICAgICAgIHZhbGlkYXRlKCdpZiAoJXMgIT09IHVuZGVmaW5lZCAmJiAhKCVzKSkgeycsIGdlbm9iaihuYW1lLCBrZXkpLCBkZXBzLm1hcChleGlzdHMpLmpvaW4oJyAmJiAnKSB8fCAndHJ1ZScpXG4gICAgICAgICAgZXJyb3IoJ2RlcGVuZGVuY2llcyBub3Qgc2V0JylcbiAgICAgICAgICB2YWxpZGF0ZSgnfScpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBkZXBzID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHZhbGlkYXRlKCdpZiAoJXMgIT09IHVuZGVmaW5lZCkgeycsIGdlbm9iaihuYW1lLCBrZXkpKVxuICAgICAgICAgIHZpc2l0KG5hbWUsIGRlcHMsIHJlcG9ydGVyLCBmaWx0ZXIpXG4gICAgICAgICAgdmFsaWRhdGUoJ30nKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBpZiAodHlwZSAhPT0gJ29iamVjdCcpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5hZGRpdGlvbmFsUHJvcGVydGllcyB8fCBub2RlLmFkZGl0aW9uYWxQcm9wZXJ0aWVzID09PSBmYWxzZSkge1xuICAgICAgaWYgKHR5cGUgIT09ICdvYmplY3QnKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMub2JqZWN0KG5hbWUpKVxuXG4gICAgICB2YXIgaSA9IGdlbmxvb3AoKVxuICAgICAgdmFyIGtleXMgPSBnZW5zeW0oJ2tleXMnKVxuXG4gICAgICB2YXIgdG9Db21wYXJlID0gZnVuY3Rpb24ocCkge1xuICAgICAgICByZXR1cm4ga2V5cysnWycraSsnXSAhPT0gJytKU09OLnN0cmluZ2lmeShwKVxuICAgICAgfVxuXG4gICAgICB2YXIgdG9UZXN0ID0gZnVuY3Rpb24ocCkge1xuICAgICAgICByZXR1cm4gJyEnK3BhdHRlcm5zKHApKycudGVzdCgnK2tleXMrJ1snK2krJ10pJ1xuICAgICAgfVxuXG4gICAgICB2YXIgYWRkaXRpb25hbFByb3AgPSBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzIHx8IHt9KS5tYXAodG9Db21wYXJlKVxuICAgICAgICAuY29uY2F0KE9iamVjdC5rZXlzKG5vZGUucGF0dGVyblByb3BlcnRpZXMgfHwge30pLm1hcCh0b1Rlc3QpKVxuICAgICAgICAuam9pbignICYmICcpIHx8ICd0cnVlJ1xuXG4gICAgICB2YWxpZGF0ZSgndmFyICVzID0gT2JqZWN0LmtleXMoJXMpJywga2V5cywgbmFtZSlcbiAgICAgICAgKCdmb3IgKHZhciAlcyA9IDA7ICVzIDwgJXMubGVuZ3RoOyAlcysrKSB7JywgaSwgaSwga2V5cywgaSlcbiAgICAgICAgICAoJ2lmICglcykgeycsIGFkZGl0aW9uYWxQcm9wKVxuXG4gICAgICBpZiAobm9kZS5hZGRpdGlvbmFsUHJvcGVydGllcyA9PT0gZmFsc2UpIHtcbiAgICAgICAgaWYgKGZpbHRlcikgdmFsaWRhdGUoJ2RlbGV0ZSAlcycsIG5hbWUrJ1snK2tleXMrJ1snK2krJ11dJylcbiAgICAgICAgZXJyb3IoJ2hhcyBhZGRpdGlvbmFsIHByb3BlcnRpZXMnLCBudWxsLCBKU09OLnN0cmluZ2lmeShuYW1lKycuJykgKyAnICsgJyArIGtleXMgKyAnWycraSsnXScpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aXNpdChuYW1lKydbJytrZXlzKydbJytpKyddXScsIG5vZGUuYWRkaXRpb25hbFByb3BlcnRpZXMsIHJlcG9ydGVyLCBmaWx0ZXIpXG4gICAgICB9XG5cbiAgICAgIHZhbGlkYXRlXG4gICAgICAgICAgKCd9JylcbiAgICAgICAgKCd9JylcblxuICAgICAgaWYgKHR5cGUgIT09ICdvYmplY3QnKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUuJHJlZikge1xuICAgICAgdmFyIHN1YiA9IGdldChyb290LCBvcHRzICYmIG9wdHMuc2NoZW1hcyB8fCB7fSwgbm9kZS4kcmVmKVxuICAgICAgaWYgKHN1Yikge1xuICAgICAgICB2YXIgZm4gPSBjYWNoZVtub2RlLiRyZWZdXG4gICAgICAgIGlmICghZm4pIHtcbiAgICAgICAgICBjYWNoZVtub2RlLiRyZWZdID0gZnVuY3Rpb24gcHJveHkoZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIGZuKGRhdGEpXG4gICAgICAgICAgfVxuICAgICAgICAgIGZuID0gY29tcGlsZShzdWIsIGNhY2hlLCByb290LCBmYWxzZSwgb3B0cylcbiAgICAgICAgfVxuICAgICAgICB2YXIgbiA9IGdlbnN5bSgncmVmJylcbiAgICAgICAgc2NvcGVbbl0gPSBmblxuICAgICAgICB2YWxpZGF0ZSgnaWYgKCEoJXMoJXMpKSkgeycsIG4sIG5hbWUpXG4gICAgICAgIGVycm9yKCdyZWZlcmVuY2VkIHNjaGVtYSBkb2VzIG5vdCBtYXRjaCcpXG4gICAgICAgIHZhbGlkYXRlKCd9JylcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobm9kZS5ub3QpIHtcbiAgICAgIHZhciBwcmV2ID0gZ2Vuc3ltKCdwcmV2JylcbiAgICAgIHZhbGlkYXRlKCd2YXIgJXMgPSBlcnJvcnMnLCBwcmV2KVxuICAgICAgdmlzaXQobmFtZSwgbm9kZS5ub3QsIGZhbHNlLCBmaWx0ZXIpXG4gICAgICB2YWxpZGF0ZSgnaWYgKCVzID09PSBlcnJvcnMpIHsnLCBwcmV2KVxuICAgICAgZXJyb3IoJ25lZ2F0aXZlIHNjaGVtYSBtYXRjaGVzJylcbiAgICAgIHZhbGlkYXRlKCd9IGVsc2UgeycpXG4gICAgICAgICgnZXJyb3JzID0gJXMnLCBwcmV2KVxuICAgICAgKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5pdGVtcyAmJiAhdHVwbGUpIHtcbiAgICAgIGlmICh0eXBlICE9PSAnYXJyYXknKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMuYXJyYXkobmFtZSkpXG5cbiAgICAgIHZhciBpID0gZ2VubG9vcCgpXG4gICAgICB2YWxpZGF0ZSgnZm9yICh2YXIgJXMgPSAwOyAlcyA8ICVzLmxlbmd0aDsgJXMrKykgeycsIGksIGksIG5hbWUsIGkpXG4gICAgICB2aXNpdChuYW1lKydbJytpKyddJywgbm9kZS5pdGVtcywgcmVwb3J0ZXIsIGZpbHRlcilcbiAgICAgIHZhbGlkYXRlKCd9JylcblxuICAgICAgaWYgKHR5cGUgIT09ICdhcnJheScpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5wYXR0ZXJuUHJvcGVydGllcykge1xuICAgICAgaWYgKHR5cGUgIT09ICdvYmplY3QnKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMub2JqZWN0KG5hbWUpKVxuICAgICAgdmFyIGtleXMgPSBnZW5zeW0oJ2tleXMnKVxuICAgICAgdmFyIGkgPSBnZW5sb29wKClcbiAgICAgIHZhbGlkYXRlXG4gICAgICAgICgndmFyICVzID0gT2JqZWN0LmtleXMoJXMpJywga2V5cywgbmFtZSlcbiAgICAgICAgKCdmb3IgKHZhciAlcyA9IDA7ICVzIDwgJXMubGVuZ3RoOyAlcysrKSB7JywgaSwgaSwga2V5cywgaSlcblxuICAgICAgT2JqZWN0LmtleXMobm9kZS5wYXR0ZXJuUHJvcGVydGllcykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgdmFyIHAgPSBwYXR0ZXJucyhrZXkpXG4gICAgICAgIHZhbGlkYXRlKCdpZiAoJXMudGVzdCglcykpIHsnLCBwLCBrZXlzKydbJytpKyddJylcbiAgICAgICAgdmlzaXQobmFtZSsnWycra2V5cysnWycraSsnXV0nLCBub2RlLnBhdHRlcm5Qcm9wZXJ0aWVzW2tleV0sIHJlcG9ydGVyLCBmaWx0ZXIpXG4gICAgICAgIHZhbGlkYXRlKCd9JylcbiAgICAgIH0pXG5cbiAgICAgIHZhbGlkYXRlKCd9JylcbiAgICAgIGlmICh0eXBlICE9PSAnb2JqZWN0JykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLnBhdHRlcm4pIHtcbiAgICAgIHZhciBwID0gcGF0dGVybnMobm9kZS5wYXR0ZXJuKVxuICAgICAgaWYgKHR5cGUgIT09ICdzdHJpbmcnKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMuc3RyaW5nKG5hbWUpKVxuICAgICAgdmFsaWRhdGUoJ2lmICghKCVzLnRlc3QoJXMpKSkgeycsIHAsIG5hbWUpXG4gICAgICBlcnJvcigncGF0dGVybiBtaXNtYXRjaCcpXG4gICAgICB2YWxpZGF0ZSgnfScpXG4gICAgICBpZiAodHlwZSAhPT0gJ3N0cmluZycpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5hbGxPZikge1xuICAgICAgbm9kZS5hbGxPZi5mb3JFYWNoKGZ1bmN0aW9uKHNjaCkge1xuICAgICAgICB2aXNpdChuYW1lLCBzY2gsIHJlcG9ydGVyLCBmaWx0ZXIpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChub2RlLmFueU9mICYmIG5vZGUuYW55T2YubGVuZ3RoKSB7XG4gICAgICB2YXIgcHJldiA9IGdlbnN5bSgncHJldicpXG5cbiAgICAgIG5vZGUuYW55T2YuZm9yRWFjaChmdW5jdGlvbihzY2gsIGkpIHtcbiAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICB2YWxpZGF0ZSgndmFyICVzID0gZXJyb3JzJywgcHJldilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWxpZGF0ZSgnaWYgKGVycm9ycyAhPT0gJXMpIHsnLCBwcmV2KVxuICAgICAgICAgICAgKCdlcnJvcnMgPSAlcycsIHByZXYpXG4gICAgICAgIH1cbiAgICAgICAgdmlzaXQobmFtZSwgc2NoLCBmYWxzZSwgZmFsc2UpXG4gICAgICB9KVxuICAgICAgbm9kZS5hbnlPZi5mb3JFYWNoKGZ1bmN0aW9uKHNjaCwgaSkge1xuICAgICAgICBpZiAoaSkgdmFsaWRhdGUoJ30nKVxuICAgICAgfSlcbiAgICAgIHZhbGlkYXRlKCdpZiAoJXMgIT09IGVycm9ycykgeycsIHByZXYpXG4gICAgICBlcnJvcignbm8gc2NoZW1hcyBtYXRjaCcpXG4gICAgICB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUub25lT2YgJiYgbm9kZS5vbmVPZi5sZW5ndGgpIHtcbiAgICAgIHZhciBwcmV2ID0gZ2Vuc3ltKCdwcmV2JylcbiAgICAgIHZhciBwYXNzZXMgPSBnZW5zeW0oJ3Bhc3NlcycpXG5cbiAgICAgIHZhbGlkYXRlXG4gICAgICAgICgndmFyICVzID0gZXJyb3JzJywgcHJldilcbiAgICAgICAgKCd2YXIgJXMgPSAwJywgcGFzc2VzKVxuXG4gICAgICBub2RlLm9uZU9mLmZvckVhY2goZnVuY3Rpb24oc2NoLCBpKSB7XG4gICAgICAgIHZpc2l0KG5hbWUsIHNjaCwgZmFsc2UsIGZhbHNlKVxuICAgICAgICB2YWxpZGF0ZSgnaWYgKCVzID09PSBlcnJvcnMpIHsnLCBwcmV2KVxuICAgICAgICAgICgnJXMrKycsIHBhc3NlcylcbiAgICAgICAgKCd9IGVsc2UgeycpXG4gICAgICAgICAgKCdlcnJvcnMgPSAlcycsIHByZXYpXG4gICAgICAgICgnfScpXG4gICAgICB9KVxuXG4gICAgICB2YWxpZGF0ZSgnaWYgKCVzICE9PSAxKSB7JywgcGFzc2VzKVxuICAgICAgZXJyb3IoJ25vIChvciBtb3JlIHRoYW4gb25lKSBzY2hlbWFzIG1hdGNoJylcbiAgICAgIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5tdWx0aXBsZU9mICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eXBlICE9PSAnbnVtYmVyJyAmJiB0eXBlICE9PSAnaW50ZWdlcicpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5udW1iZXIobmFtZSkpXG5cbiAgICAgIHZhbGlkYXRlKCdpZiAoIWlzTXVsdGlwbGVPZiglcywgJWQpKSB7JywgbmFtZSwgbm9kZS5tdWx0aXBsZU9mKVxuXG4gICAgICBlcnJvcignaGFzIGEgcmVtYWluZGVyJylcbiAgICAgIHZhbGlkYXRlKCd9JylcblxuICAgICAgaWYgKHR5cGUgIT09ICdudW1iZXInICYmIHR5cGUgIT09ICdpbnRlZ2VyJykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLm1heFByb3BlcnRpZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGUgIT09ICdvYmplY3QnKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMub2JqZWN0KG5hbWUpKVxuXG4gICAgICB2YWxpZGF0ZSgnaWYgKE9iamVjdC5rZXlzKCVzKS5sZW5ndGggPiAlZCkgeycsIG5hbWUsIG5vZGUubWF4UHJvcGVydGllcylcbiAgICAgIGVycm9yKCdoYXMgbW9yZSBwcm9wZXJ0aWVzIHRoYW4gYWxsb3dlZCcpXG4gICAgICB2YWxpZGF0ZSgnfScpXG5cbiAgICAgIGlmICh0eXBlICE9PSAnb2JqZWN0JykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLm1pblByb3BlcnRpZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGUgIT09ICdvYmplY3QnKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMub2JqZWN0KG5hbWUpKVxuXG4gICAgICB2YWxpZGF0ZSgnaWYgKE9iamVjdC5rZXlzKCVzKS5sZW5ndGggPCAlZCkgeycsIG5hbWUsIG5vZGUubWluUHJvcGVydGllcylcbiAgICAgIGVycm9yKCdoYXMgbGVzcyBwcm9wZXJ0aWVzIHRoYW4gYWxsb3dlZCcpXG4gICAgICB2YWxpZGF0ZSgnfScpXG5cbiAgICAgIGlmICh0eXBlICE9PSAnb2JqZWN0JykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChub2RlLm1heEl0ZW1zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eXBlICE9PSAnYXJyYXknKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMuYXJyYXkobmFtZSkpXG5cbiAgICAgIHZhbGlkYXRlKCdpZiAoJXMubGVuZ3RoID4gJWQpIHsnLCBuYW1lLCBub2RlLm1heEl0ZW1zKVxuICAgICAgZXJyb3IoJ2hhcyBtb3JlIGl0ZW1zIHRoYW4gYWxsb3dlZCcpXG4gICAgICB2YWxpZGF0ZSgnfScpXG5cbiAgICAgIGlmICh0eXBlICE9PSAnYXJyYXknKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUubWluSXRlbXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGUgIT09ICdhcnJheScpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5hcnJheShuYW1lKSlcblxuICAgICAgdmFsaWRhdGUoJ2lmICglcy5sZW5ndGggPCAlZCkgeycsIG5hbWUsIG5vZGUubWluSXRlbXMpXG4gICAgICBlcnJvcignaGFzIGxlc3MgaXRlbXMgdGhhbiBhbGxvd2VkJylcbiAgICAgIHZhbGlkYXRlKCd9JylcblxuICAgICAgaWYgKHR5cGUgIT09ICdhcnJheScpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5tYXhMZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGUgIT09ICdzdHJpbmcnKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMuc3RyaW5nKG5hbWUpKVxuXG4gICAgICB2YWxpZGF0ZSgnaWYgKCVzLmxlbmd0aCA+ICVkKSB7JywgbmFtZSwgbm9kZS5tYXhMZW5ndGgpXG4gICAgICBlcnJvcignaGFzIGxvbmdlciBsZW5ndGggdGhhbiBhbGxvd2VkJylcbiAgICAgIHZhbGlkYXRlKCd9JylcblxuICAgICAgaWYgKHR5cGUgIT09ICdzdHJpbmcnKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUubWluTGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eXBlICE9PSAnc3RyaW5nJykgdmFsaWRhdGUoJ2lmICglcykgeycsIHR5cGVzLnN0cmluZyhuYW1lKSlcblxuICAgICAgdmFsaWRhdGUoJ2lmICglcy5sZW5ndGggPCAlZCkgeycsIG5hbWUsIG5vZGUubWluTGVuZ3RoKVxuICAgICAgZXJyb3IoJ2hhcyBsZXNzIGxlbmd0aCB0aGFuIGFsbG93ZWQnKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuXG4gICAgICBpZiAodHlwZSAhPT0gJ3N0cmluZycpIHZhbGlkYXRlKCd9JylcbiAgICB9XG5cbiAgICBpZiAobm9kZS5taW5pbXVtICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eXBlICE9PSAnbnVtYmVyJyAmJiB0eXBlICE9PSAnaW50ZWdlcicpIHZhbGlkYXRlKCdpZiAoJXMpIHsnLCB0eXBlcy5udW1iZXIobmFtZSkpXG5cbiAgICAgIHZhbGlkYXRlKCdpZiAoJXMgJXMgJWQpIHsnLCBuYW1lLCBub2RlLmV4Y2x1c2l2ZU1pbmltdW0gPyAnPD0nIDogJzwnLCBub2RlLm1pbmltdW0pXG4gICAgICBlcnJvcignaXMgbGVzcyB0aGFuIG1pbmltdW0nKVxuICAgICAgdmFsaWRhdGUoJ30nKVxuXG4gICAgICBpZiAodHlwZSAhPT0gJ251bWJlcicgJiYgdHlwZSAhPT0gJ2ludGVnZXInKSB2YWxpZGF0ZSgnfScpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUubWF4aW11bSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZSAhPT0gJ251bWJlcicgJiYgdHlwZSAhPT0gJ2ludGVnZXInKSB2YWxpZGF0ZSgnaWYgKCVzKSB7JywgdHlwZXMubnVtYmVyKG5hbWUpKVxuXG4gICAgICB2YWxpZGF0ZSgnaWYgKCVzICVzICVkKSB7JywgbmFtZSwgbm9kZS5leGNsdXNpdmVNYXhpbXVtID8gJz49JyA6ICc+Jywgbm9kZS5tYXhpbXVtKVxuICAgICAgZXJyb3IoJ2lzIG1vcmUgdGhhbiBtYXhpbXVtJylcbiAgICAgIHZhbGlkYXRlKCd9JylcblxuICAgICAgaWYgKHR5cGUgIT09ICdudW1iZXInICYmIHR5cGUgIT09ICdpbnRlZ2VyJykgdmFsaWRhdGUoJ30nKVxuICAgIH1cblxuICAgIGlmIChwcm9wZXJ0aWVzKSB7XG4gICAgICBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKS5mb3JFYWNoKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodHlwZSkgJiYgdHlwZS5pbmRleE9mKCdudWxsJykgIT09IC0xKSB2YWxpZGF0ZSgnaWYgKCVzICE9PSBudWxsKSB7JywgbmFtZSlcblxuICAgICAgICB2aXNpdChnZW5vYmoobmFtZSwgcCksIHByb3BlcnRpZXNbcF0sIHJlcG9ydGVyLCBmaWx0ZXIpXG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodHlwZSkgJiYgdHlwZS5pbmRleE9mKCdudWxsJykgIT09IC0xKSB2YWxpZGF0ZSgnfScpXG4gICAgICB9KVxuICAgIH1cblxuICAgIHdoaWxlIChpbmRlbnQtLSkgdmFsaWRhdGUoJ30nKVxuICB9XG5cbiAgdmFyIHZhbGlkYXRlID0gZ2VuZnVuXG4gICAgKCdmdW5jdGlvbiB2YWxpZGF0ZShkYXRhKSB7JylcbiAgICAgIC8vIFNpbmNlIHVuZGVmaW5lZCBpcyBub3QgYSB2YWxpZCBKU09OIHZhbHVlLCB3ZSBjb2VyY2UgdG8gbnVsbCBhbmQgb3RoZXIgY2hlY2tzIHdpbGwgY2F0Y2ggdGhpc1xuICAgICAgKCdpZiAoZGF0YSA9PT0gdW5kZWZpbmVkKSBkYXRhID0gbnVsbCcpXG4gICAgICAoJ3ZhbGlkYXRlLmVycm9ycyA9IG51bGwnKVxuICAgICAgKCd2YXIgZXJyb3JzID0gMCcpXG5cbiAgdmlzaXQoJ2RhdGEnLCBzY2hlbWEsIHJlcG9ydGVyLCBvcHRzICYmIG9wdHMuZmlsdGVyKVxuXG4gIHZhbGlkYXRlXG4gICAgICAoJ3JldHVybiBlcnJvcnMgPT09IDAnKVxuICAgICgnfScpXG5cbiAgdmFsaWRhdGUgPSB2YWxpZGF0ZS50b0Z1bmN0aW9uKHNjb3BlKVxuICB2YWxpZGF0ZS5lcnJvcnMgPSBudWxsXG5cbiAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2YWxpZGF0ZSwgJ2Vycm9yJywge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF2YWxpZGF0ZS5lcnJvcnMpIHJldHVybiAnJ1xuICAgICAgICByZXR1cm4gdmFsaWRhdGUuZXJyb3JzLm1hcChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICByZXR1cm4gZXJyLmZpZWxkICsgJyAnICsgZXJyLm1lc3NhZ2U7XG4gICAgICAgIH0pLmpvaW4oJ1xcbicpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIHZhbGlkYXRlLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzY2hlbWFcbiAgfVxuXG4gIHJldHVybiB2YWxpZGF0ZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNjaGVtYSwgb3B0cykge1xuICBpZiAodHlwZW9mIHNjaGVtYSA9PT0gJ3N0cmluZycpIHNjaGVtYSA9IEpTT04ucGFyc2Uoc2NoZW1hKVxuICByZXR1cm4gY29tcGlsZShzY2hlbWEsIHt9LCBzY2hlbWEsIHRydWUsIG9wdHMpXG59XG5cbm1vZHVsZS5leHBvcnRzLmZpbHRlciA9IGZ1bmN0aW9uKHNjaGVtYSwgb3B0cykge1xuICB2YXIgdmFsaWRhdGUgPSBtb2R1bGUuZXhwb3J0cyhzY2hlbWEsIHh0ZW5kKG9wdHMsIHtmaWx0ZXI6IHRydWV9KSlcbiAgcmV0dXJuIGZ1bmN0aW9uKHNjaCkge1xuICAgIHZhbGlkYXRlKHNjaClcbiAgICByZXR1cm4gc2NoXG4gIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5mdW5jdGlvbiBpc1Byb3BlcnR5KHN0cikge1xuICByZXR1cm4gL15bJEEtWlxcX2EtelxceGFhXFx4YjVcXHhiYVxceGMwLVxceGQ2XFx4ZDgtXFx4ZjZcXHhmOC1cXHUwMmMxXFx1MDJjNi1cXHUwMmQxXFx1MDJlMC1cXHUwMmU0XFx1MDJlY1xcdTAyZWVcXHUwMzcwLVxcdTAzNzRcXHUwMzc2XFx1MDM3N1xcdTAzN2EtXFx1MDM3ZFxcdTAzODZcXHUwMzg4LVxcdTAzOGFcXHUwMzhjXFx1MDM4ZS1cXHUwM2ExXFx1MDNhMy1cXHUwM2Y1XFx1MDNmNy1cXHUwNDgxXFx1MDQ4YS1cXHUwNTI3XFx1MDUzMS1cXHUwNTU2XFx1MDU1OVxcdTA1NjEtXFx1MDU4N1xcdTA1ZDAtXFx1MDVlYVxcdTA1ZjAtXFx1MDVmMlxcdTA2MjAtXFx1MDY0YVxcdTA2NmVcXHUwNjZmXFx1MDY3MS1cXHUwNmQzXFx1MDZkNVxcdTA2ZTVcXHUwNmU2XFx1MDZlZVxcdTA2ZWZcXHUwNmZhLVxcdTA2ZmNcXHUwNmZmXFx1MDcxMFxcdTA3MTItXFx1MDcyZlxcdTA3NGQtXFx1MDdhNVxcdTA3YjFcXHUwN2NhLVxcdTA3ZWFcXHUwN2Y0XFx1MDdmNVxcdTA3ZmFcXHUwODAwLVxcdTA4MTVcXHUwODFhXFx1MDgyNFxcdTA4MjhcXHUwODQwLVxcdTA4NThcXHUwOGEwXFx1MDhhMi1cXHUwOGFjXFx1MDkwNC1cXHUwOTM5XFx1MDkzZFxcdTA5NTBcXHUwOTU4LVxcdTA5NjFcXHUwOTcxLVxcdTA5NzdcXHUwOTc5LVxcdTA5N2ZcXHUwOTg1LVxcdTA5OGNcXHUwOThmXFx1MDk5MFxcdTA5OTMtXFx1MDlhOFxcdTA5YWEtXFx1MDliMFxcdTA5YjJcXHUwOWI2LVxcdTA5YjlcXHUwOWJkXFx1MDljZVxcdTA5ZGNcXHUwOWRkXFx1MDlkZi1cXHUwOWUxXFx1MDlmMFxcdTA5ZjFcXHUwYTA1LVxcdTBhMGFcXHUwYTBmXFx1MGExMFxcdTBhMTMtXFx1MGEyOFxcdTBhMmEtXFx1MGEzMFxcdTBhMzJcXHUwYTMzXFx1MGEzNVxcdTBhMzZcXHUwYTM4XFx1MGEzOVxcdTBhNTktXFx1MGE1Y1xcdTBhNWVcXHUwYTcyLVxcdTBhNzRcXHUwYTg1LVxcdTBhOGRcXHUwYThmLVxcdTBhOTFcXHUwYTkzLVxcdTBhYThcXHUwYWFhLVxcdTBhYjBcXHUwYWIyXFx1MGFiM1xcdTBhYjUtXFx1MGFiOVxcdTBhYmRcXHUwYWQwXFx1MGFlMFxcdTBhZTFcXHUwYjA1LVxcdTBiMGNcXHUwYjBmXFx1MGIxMFxcdTBiMTMtXFx1MGIyOFxcdTBiMmEtXFx1MGIzMFxcdTBiMzJcXHUwYjMzXFx1MGIzNS1cXHUwYjM5XFx1MGIzZFxcdTBiNWNcXHUwYjVkXFx1MGI1Zi1cXHUwYjYxXFx1MGI3MVxcdTBiODNcXHUwYjg1LVxcdTBiOGFcXHUwYjhlLVxcdTBiOTBcXHUwYjkyLVxcdTBiOTVcXHUwYjk5XFx1MGI5YVxcdTBiOWNcXHUwYjllXFx1MGI5ZlxcdTBiYTNcXHUwYmE0XFx1MGJhOC1cXHUwYmFhXFx1MGJhZS1cXHUwYmI5XFx1MGJkMFxcdTBjMDUtXFx1MGMwY1xcdTBjMGUtXFx1MGMxMFxcdTBjMTItXFx1MGMyOFxcdTBjMmEtXFx1MGMzM1xcdTBjMzUtXFx1MGMzOVxcdTBjM2RcXHUwYzU4XFx1MGM1OVxcdTBjNjBcXHUwYzYxXFx1MGM4NS1cXHUwYzhjXFx1MGM4ZS1cXHUwYzkwXFx1MGM5Mi1cXHUwY2E4XFx1MGNhYS1cXHUwY2IzXFx1MGNiNS1cXHUwY2I5XFx1MGNiZFxcdTBjZGVcXHUwY2UwXFx1MGNlMVxcdTBjZjFcXHUwY2YyXFx1MGQwNS1cXHUwZDBjXFx1MGQwZS1cXHUwZDEwXFx1MGQxMi1cXHUwZDNhXFx1MGQzZFxcdTBkNGVcXHUwZDYwXFx1MGQ2MVxcdTBkN2EtXFx1MGQ3ZlxcdTBkODUtXFx1MGQ5NlxcdTBkOWEtXFx1MGRiMVxcdTBkYjMtXFx1MGRiYlxcdTBkYmRcXHUwZGMwLVxcdTBkYzZcXHUwZTAxLVxcdTBlMzBcXHUwZTMyXFx1MGUzM1xcdTBlNDAtXFx1MGU0NlxcdTBlODFcXHUwZTgyXFx1MGU4NFxcdTBlODdcXHUwZTg4XFx1MGU4YVxcdTBlOGRcXHUwZTk0LVxcdTBlOTdcXHUwZTk5LVxcdTBlOWZcXHUwZWExLVxcdTBlYTNcXHUwZWE1XFx1MGVhN1xcdTBlYWFcXHUwZWFiXFx1MGVhZC1cXHUwZWIwXFx1MGViMlxcdTBlYjNcXHUwZWJkXFx1MGVjMC1cXHUwZWM0XFx1MGVjNlxcdTBlZGMtXFx1MGVkZlxcdTBmMDBcXHUwZjQwLVxcdTBmNDdcXHUwZjQ5LVxcdTBmNmNcXHUwZjg4LVxcdTBmOGNcXHUxMDAwLVxcdTEwMmFcXHUxMDNmXFx1MTA1MC1cXHUxMDU1XFx1MTA1YS1cXHUxMDVkXFx1MTA2MVxcdTEwNjVcXHUxMDY2XFx1MTA2ZS1cXHUxMDcwXFx1MTA3NS1cXHUxMDgxXFx1MTA4ZVxcdTEwYTAtXFx1MTBjNVxcdTEwYzdcXHUxMGNkXFx1MTBkMC1cXHUxMGZhXFx1MTBmYy1cXHUxMjQ4XFx1MTI0YS1cXHUxMjRkXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNWEtXFx1MTI1ZFxcdTEyNjAtXFx1MTI4OFxcdTEyOGEtXFx1MTI4ZFxcdTEyOTAtXFx1MTJiMFxcdTEyYjItXFx1MTJiNVxcdTEyYjgtXFx1MTJiZVxcdTEyYzBcXHUxMmMyLVxcdTEyYzVcXHUxMmM4LVxcdTEyZDZcXHUxMmQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNWFcXHUxMzgwLVxcdTEzOGZcXHUxM2EwLVxcdTEzZjRcXHUxNDAxLVxcdTE2NmNcXHUxNjZmLVxcdTE2N2ZcXHUxNjgxLVxcdTE2OWFcXHUxNmEwLVxcdTE2ZWFcXHUxNmVlLVxcdTE2ZjBcXHUxNzAwLVxcdTE3MGNcXHUxNzBlLVxcdTE3MTFcXHUxNzIwLVxcdTE3MzFcXHUxNzQwLVxcdTE3NTFcXHUxNzYwLVxcdTE3NmNcXHUxNzZlLVxcdTE3NzBcXHUxNzgwLVxcdTE3YjNcXHUxN2Q3XFx1MTdkY1xcdTE4MjAtXFx1MTg3N1xcdTE4ODAtXFx1MThhOFxcdTE4YWFcXHUxOGIwLVxcdTE4ZjVcXHUxOTAwLVxcdTE5MWNcXHUxOTUwLVxcdTE5NmRcXHUxOTcwLVxcdTE5NzRcXHUxOTgwLVxcdTE5YWJcXHUxOWMxLVxcdTE5YzdcXHUxYTAwLVxcdTFhMTZcXHUxYTIwLVxcdTFhNTRcXHUxYWE3XFx1MWIwNS1cXHUxYjMzXFx1MWI0NS1cXHUxYjRiXFx1MWI4My1cXHUxYmEwXFx1MWJhZVxcdTFiYWZcXHUxYmJhLVxcdTFiZTVcXHUxYzAwLVxcdTFjMjNcXHUxYzRkLVxcdTFjNGZcXHUxYzVhLVxcdTFjN2RcXHUxY2U5LVxcdTFjZWNcXHUxY2VlLVxcdTFjZjFcXHUxY2Y1XFx1MWNmNlxcdTFkMDAtXFx1MWRiZlxcdTFlMDAtXFx1MWYxNVxcdTFmMTgtXFx1MWYxZFxcdTFmMjAtXFx1MWY0NVxcdTFmNDgtXFx1MWY0ZFxcdTFmNTAtXFx1MWY1N1xcdTFmNTlcXHUxZjViXFx1MWY1ZFxcdTFmNWYtXFx1MWY3ZFxcdTFmODAtXFx1MWZiNFxcdTFmYjYtXFx1MWZiY1xcdTFmYmVcXHUxZmMyLVxcdTFmYzRcXHUxZmM2LVxcdTFmY2NcXHUxZmQwLVxcdTFmZDNcXHUxZmQ2LVxcdTFmZGJcXHUxZmUwLVxcdTFmZWNcXHUxZmYyLVxcdTFmZjRcXHUxZmY2LVxcdTFmZmNcXHUyMDcxXFx1MjA3ZlxcdTIwOTAtXFx1MjA5Y1xcdTIxMDJcXHUyMTA3XFx1MjEwYS1cXHUyMTEzXFx1MjExNVxcdTIxMTktXFx1MjExZFxcdTIxMjRcXHUyMTI2XFx1MjEyOFxcdTIxMmEtXFx1MjEyZFxcdTIxMmYtXFx1MjEzOVxcdTIxM2MtXFx1MjEzZlxcdTIxNDUtXFx1MjE0OVxcdTIxNGVcXHUyMTYwLVxcdTIxODhcXHUyYzAwLVxcdTJjMmVcXHUyYzMwLVxcdTJjNWVcXHUyYzYwLVxcdTJjZTRcXHUyY2ViLVxcdTJjZWVcXHUyY2YyXFx1MmNmM1xcdTJkMDAtXFx1MmQyNVxcdTJkMjdcXHUyZDJkXFx1MmQzMC1cXHUyZDY3XFx1MmQ2ZlxcdTJkODAtXFx1MmQ5NlxcdTJkYTAtXFx1MmRhNlxcdTJkYTgtXFx1MmRhZVxcdTJkYjAtXFx1MmRiNlxcdTJkYjgtXFx1MmRiZVxcdTJkYzAtXFx1MmRjNlxcdTJkYzgtXFx1MmRjZVxcdTJkZDAtXFx1MmRkNlxcdTJkZDgtXFx1MmRkZVxcdTJlMmZcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMjlcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM2NcXHUzMDQxLVxcdTMwOTZcXHUzMDlkLVxcdTMwOWZcXHUzMGExLVxcdTMwZmFcXHUzMGZjLVxcdTMwZmZcXHUzMTA1LVxcdTMxMmRcXHUzMTMxLVxcdTMxOGVcXHUzMWEwLVxcdTMxYmFcXHUzMWYwLVxcdTMxZmZcXHUzNDAwLVxcdTRkYjVcXHU0ZTAwLVxcdTlmY2NcXHVhMDAwLVxcdWE0OGNcXHVhNGQwLVxcdWE0ZmRcXHVhNTAwLVxcdWE2MGNcXHVhNjEwLVxcdWE2MWZcXHVhNjJhXFx1YTYyYlxcdWE2NDAtXFx1YTY2ZVxcdWE2N2YtXFx1YTY5N1xcdWE2YTAtXFx1YTZlZlxcdWE3MTctXFx1YTcxZlxcdWE3MjItXFx1YTc4OFxcdWE3OGItXFx1YTc4ZVxcdWE3OTAtXFx1YTc5M1xcdWE3YTAtXFx1YTdhYVxcdWE3ZjgtXFx1YTgwMVxcdWE4MDMtXFx1YTgwNVxcdWE4MDctXFx1YTgwYVxcdWE4MGMtXFx1YTgyMlxcdWE4NDAtXFx1YTg3M1xcdWE4ODItXFx1YThiM1xcdWE4ZjItXFx1YThmN1xcdWE4ZmJcXHVhOTBhLVxcdWE5MjVcXHVhOTMwLVxcdWE5NDZcXHVhOTYwLVxcdWE5N2NcXHVhOTg0LVxcdWE5YjJcXHVhOWNmXFx1YWEwMC1cXHVhYTI4XFx1YWE0MC1cXHVhYTQyXFx1YWE0NC1cXHVhYTRiXFx1YWE2MC1cXHVhYTc2XFx1YWE3YVxcdWFhODAtXFx1YWFhZlxcdWFhYjFcXHVhYWI1XFx1YWFiNlxcdWFhYjktXFx1YWFiZFxcdWFhYzBcXHVhYWMyXFx1YWFkYi1cXHVhYWRkXFx1YWFlMC1cXHVhYWVhXFx1YWFmMi1cXHVhYWY0XFx1YWIwMS1cXHVhYjA2XFx1YWIwOS1cXHVhYjBlXFx1YWIxMS1cXHVhYjE2XFx1YWIyMC1cXHVhYjI2XFx1YWIyOC1cXHVhYjJlXFx1YWJjMC1cXHVhYmUyXFx1YWMwMC1cXHVkN2EzXFx1ZDdiMC1cXHVkN2M2XFx1ZDdjYi1cXHVkN2ZiXFx1ZjkwMC1cXHVmYTZkXFx1ZmE3MC1cXHVmYWQ5XFx1ZmIwMC1cXHVmYjA2XFx1ZmIxMy1cXHVmYjE3XFx1ZmIxZFxcdWZiMWYtXFx1ZmIyOFxcdWZiMmEtXFx1ZmIzNlxcdWZiMzgtXFx1ZmIzY1xcdWZiM2VcXHVmYjQwXFx1ZmI0MVxcdWZiNDNcXHVmYjQ0XFx1ZmI0Ni1cXHVmYmIxXFx1ZmJkMy1cXHVmZDNkXFx1ZmQ1MC1cXHVmZDhmXFx1ZmQ5Mi1cXHVmZGM3XFx1ZmRmMC1cXHVmZGZiXFx1ZmU3MC1cXHVmZTc0XFx1ZmU3Ni1cXHVmZWZjXFx1ZmYyMS1cXHVmZjNhXFx1ZmY0MS1cXHVmZjVhXFx1ZmY2Ni1cXHVmZmJlXFx1ZmZjMi1cXHVmZmM3XFx1ZmZjYS1cXHVmZmNmXFx1ZmZkMi1cXHVmZmQ3XFx1ZmZkYS1cXHVmZmRjXVskQS1aXFxfYS16XFx4YWFcXHhiNVxceGJhXFx4YzAtXFx4ZDZcXHhkOC1cXHhmNlxceGY4LVxcdTAyYzFcXHUwMmM2LVxcdTAyZDFcXHUwMmUwLVxcdTAyZTRcXHUwMmVjXFx1MDJlZVxcdTAzNzAtXFx1MDM3NFxcdTAzNzZcXHUwMzc3XFx1MDM3YS1cXHUwMzdkXFx1MDM4NlxcdTAzODgtXFx1MDM4YVxcdTAzOGNcXHUwMzhlLVxcdTAzYTFcXHUwM2EzLVxcdTAzZjVcXHUwM2Y3LVxcdTA0ODFcXHUwNDhhLVxcdTA1MjdcXHUwNTMxLVxcdTA1NTZcXHUwNTU5XFx1MDU2MS1cXHUwNTg3XFx1MDVkMC1cXHUwNWVhXFx1MDVmMC1cXHUwNWYyXFx1MDYyMC1cXHUwNjRhXFx1MDY2ZVxcdTA2NmZcXHUwNjcxLVxcdTA2ZDNcXHUwNmQ1XFx1MDZlNVxcdTA2ZTZcXHUwNmVlXFx1MDZlZlxcdTA2ZmEtXFx1MDZmY1xcdTA2ZmZcXHUwNzEwXFx1MDcxMi1cXHUwNzJmXFx1MDc0ZC1cXHUwN2E1XFx1MDdiMVxcdTA3Y2EtXFx1MDdlYVxcdTA3ZjRcXHUwN2Y1XFx1MDdmYVxcdTA4MDAtXFx1MDgxNVxcdTA4MWFcXHUwODI0XFx1MDgyOFxcdTA4NDAtXFx1MDg1OFxcdTA4YTBcXHUwOGEyLVxcdTA4YWNcXHUwOTA0LVxcdTA5MzlcXHUwOTNkXFx1MDk1MFxcdTA5NTgtXFx1MDk2MVxcdTA5NzEtXFx1MDk3N1xcdTA5NzktXFx1MDk3ZlxcdTA5ODUtXFx1MDk4Y1xcdTA5OGZcXHUwOTkwXFx1MDk5My1cXHUwOWE4XFx1MDlhYS1cXHUwOWIwXFx1MDliMlxcdTA5YjYtXFx1MDliOVxcdTA5YmRcXHUwOWNlXFx1MDlkY1xcdTA5ZGRcXHUwOWRmLVxcdTA5ZTFcXHUwOWYwXFx1MDlmMVxcdTBhMDUtXFx1MGEwYVxcdTBhMGZcXHUwYTEwXFx1MGExMy1cXHUwYTI4XFx1MGEyYS1cXHUwYTMwXFx1MGEzMlxcdTBhMzNcXHUwYTM1XFx1MGEzNlxcdTBhMzhcXHUwYTM5XFx1MGE1OS1cXHUwYTVjXFx1MGE1ZVxcdTBhNzItXFx1MGE3NFxcdTBhODUtXFx1MGE4ZFxcdTBhOGYtXFx1MGE5MVxcdTBhOTMtXFx1MGFhOFxcdTBhYWEtXFx1MGFiMFxcdTBhYjJcXHUwYWIzXFx1MGFiNS1cXHUwYWI5XFx1MGFiZFxcdTBhZDBcXHUwYWUwXFx1MGFlMVxcdTBiMDUtXFx1MGIwY1xcdTBiMGZcXHUwYjEwXFx1MGIxMy1cXHUwYjI4XFx1MGIyYS1cXHUwYjMwXFx1MGIzMlxcdTBiMzNcXHUwYjM1LVxcdTBiMzlcXHUwYjNkXFx1MGI1Y1xcdTBiNWRcXHUwYjVmLVxcdTBiNjFcXHUwYjcxXFx1MGI4M1xcdTBiODUtXFx1MGI4YVxcdTBiOGUtXFx1MGI5MFxcdTBiOTItXFx1MGI5NVxcdTBiOTlcXHUwYjlhXFx1MGI5Y1xcdTBiOWVcXHUwYjlmXFx1MGJhM1xcdTBiYTRcXHUwYmE4LVxcdTBiYWFcXHUwYmFlLVxcdTBiYjlcXHUwYmQwXFx1MGMwNS1cXHUwYzBjXFx1MGMwZS1cXHUwYzEwXFx1MGMxMi1cXHUwYzI4XFx1MGMyYS1cXHUwYzMzXFx1MGMzNS1cXHUwYzM5XFx1MGMzZFxcdTBjNThcXHUwYzU5XFx1MGM2MFxcdTBjNjFcXHUwYzg1LVxcdTBjOGNcXHUwYzhlLVxcdTBjOTBcXHUwYzkyLVxcdTBjYThcXHUwY2FhLVxcdTBjYjNcXHUwY2I1LVxcdTBjYjlcXHUwY2JkXFx1MGNkZVxcdTBjZTBcXHUwY2UxXFx1MGNmMVxcdTBjZjJcXHUwZDA1LVxcdTBkMGNcXHUwZDBlLVxcdTBkMTBcXHUwZDEyLVxcdTBkM2FcXHUwZDNkXFx1MGQ0ZVxcdTBkNjBcXHUwZDYxXFx1MGQ3YS1cXHUwZDdmXFx1MGQ4NS1cXHUwZDk2XFx1MGQ5YS1cXHUwZGIxXFx1MGRiMy1cXHUwZGJiXFx1MGRiZFxcdTBkYzAtXFx1MGRjNlxcdTBlMDEtXFx1MGUzMFxcdTBlMzJcXHUwZTMzXFx1MGU0MC1cXHUwZTQ2XFx1MGU4MVxcdTBlODJcXHUwZTg0XFx1MGU4N1xcdTBlODhcXHUwZThhXFx1MGU4ZFxcdTBlOTQtXFx1MGU5N1xcdTBlOTktXFx1MGU5ZlxcdTBlYTEtXFx1MGVhM1xcdTBlYTVcXHUwZWE3XFx1MGVhYVxcdTBlYWJcXHUwZWFkLVxcdTBlYjBcXHUwZWIyXFx1MGViM1xcdTBlYmRcXHUwZWMwLVxcdTBlYzRcXHUwZWM2XFx1MGVkYy1cXHUwZWRmXFx1MGYwMFxcdTBmNDAtXFx1MGY0N1xcdTBmNDktXFx1MGY2Y1xcdTBmODgtXFx1MGY4Y1xcdTEwMDAtXFx1MTAyYVxcdTEwM2ZcXHUxMDUwLVxcdTEwNTVcXHUxMDVhLVxcdTEwNWRcXHUxMDYxXFx1MTA2NVxcdTEwNjZcXHUxMDZlLVxcdTEwNzBcXHUxMDc1LVxcdTEwODFcXHUxMDhlXFx1MTBhMC1cXHUxMGM1XFx1MTBjN1xcdTEwY2RcXHUxMGQwLVxcdTEwZmFcXHUxMGZjLVxcdTEyNDhcXHUxMjRhLVxcdTEyNGRcXHUxMjUwLVxcdTEyNTZcXHUxMjU4XFx1MTI1YS1cXHUxMjVkXFx1MTI2MC1cXHUxMjg4XFx1MTI4YS1cXHUxMjhkXFx1MTI5MC1cXHUxMmIwXFx1MTJiMi1cXHUxMmI1XFx1MTJiOC1cXHUxMmJlXFx1MTJjMFxcdTEyYzItXFx1MTJjNVxcdTEyYzgtXFx1MTJkNlxcdTEyZDgtXFx1MTMxMFxcdTEzMTItXFx1MTMxNVxcdTEzMTgtXFx1MTM1YVxcdTEzODAtXFx1MTM4ZlxcdTEzYTAtXFx1MTNmNFxcdTE0MDEtXFx1MTY2Y1xcdTE2NmYtXFx1MTY3ZlxcdTE2ODEtXFx1MTY5YVxcdTE2YTAtXFx1MTZlYVxcdTE2ZWUtXFx1MTZmMFxcdTE3MDAtXFx1MTcwY1xcdTE3MGUtXFx1MTcxMVxcdTE3MjAtXFx1MTczMVxcdTE3NDAtXFx1MTc1MVxcdTE3NjAtXFx1MTc2Y1xcdTE3NmUtXFx1MTc3MFxcdTE3ODAtXFx1MTdiM1xcdTE3ZDdcXHUxN2RjXFx1MTgyMC1cXHUxODc3XFx1MTg4MC1cXHUxOGE4XFx1MThhYVxcdTE4YjAtXFx1MThmNVxcdTE5MDAtXFx1MTkxY1xcdTE5NTAtXFx1MTk2ZFxcdTE5NzAtXFx1MTk3NFxcdTE5ODAtXFx1MTlhYlxcdTE5YzEtXFx1MTljN1xcdTFhMDAtXFx1MWExNlxcdTFhMjAtXFx1MWE1NFxcdTFhYTdcXHUxYjA1LVxcdTFiMzNcXHUxYjQ1LVxcdTFiNGJcXHUxYjgzLVxcdTFiYTBcXHUxYmFlXFx1MWJhZlxcdTFiYmEtXFx1MWJlNVxcdTFjMDAtXFx1MWMyM1xcdTFjNGQtXFx1MWM0ZlxcdTFjNWEtXFx1MWM3ZFxcdTFjZTktXFx1MWNlY1xcdTFjZWUtXFx1MWNmMVxcdTFjZjVcXHUxY2Y2XFx1MWQwMC1cXHUxZGJmXFx1MWUwMC1cXHUxZjE1XFx1MWYxOC1cXHUxZjFkXFx1MWYyMC1cXHUxZjQ1XFx1MWY0OC1cXHUxZjRkXFx1MWY1MC1cXHUxZjU3XFx1MWY1OVxcdTFmNWJcXHUxZjVkXFx1MWY1Zi1cXHUxZjdkXFx1MWY4MC1cXHUxZmI0XFx1MWZiNi1cXHUxZmJjXFx1MWZiZVxcdTFmYzItXFx1MWZjNFxcdTFmYzYtXFx1MWZjY1xcdTFmZDAtXFx1MWZkM1xcdTFmZDYtXFx1MWZkYlxcdTFmZTAtXFx1MWZlY1xcdTFmZjItXFx1MWZmNFxcdTFmZjYtXFx1MWZmY1xcdTIwNzFcXHUyMDdmXFx1MjA5MC1cXHUyMDljXFx1MjEwMlxcdTIxMDdcXHUyMTBhLVxcdTIxMTNcXHUyMTE1XFx1MjExOS1cXHUyMTFkXFx1MjEyNFxcdTIxMjZcXHUyMTI4XFx1MjEyYS1cXHUyMTJkXFx1MjEyZi1cXHUyMTM5XFx1MjEzYy1cXHUyMTNmXFx1MjE0NS1cXHUyMTQ5XFx1MjE0ZVxcdTIxNjAtXFx1MjE4OFxcdTJjMDAtXFx1MmMyZVxcdTJjMzAtXFx1MmM1ZVxcdTJjNjAtXFx1MmNlNFxcdTJjZWItXFx1MmNlZVxcdTJjZjJcXHUyY2YzXFx1MmQwMC1cXHUyZDI1XFx1MmQyN1xcdTJkMmRcXHUyZDMwLVxcdTJkNjdcXHUyZDZmXFx1MmQ4MC1cXHUyZDk2XFx1MmRhMC1cXHUyZGE2XFx1MmRhOC1cXHUyZGFlXFx1MmRiMC1cXHUyZGI2XFx1MmRiOC1cXHUyZGJlXFx1MmRjMC1cXHUyZGM2XFx1MmRjOC1cXHUyZGNlXFx1MmRkMC1cXHUyZGQ2XFx1MmRkOC1cXHUyZGRlXFx1MmUyZlxcdTMwMDUtXFx1MzAwN1xcdTMwMjEtXFx1MzAyOVxcdTMwMzEtXFx1MzAzNVxcdTMwMzgtXFx1MzAzY1xcdTMwNDEtXFx1MzA5NlxcdTMwOWQtXFx1MzA5ZlxcdTMwYTEtXFx1MzBmYVxcdTMwZmMtXFx1MzBmZlxcdTMxMDUtXFx1MzEyZFxcdTMxMzEtXFx1MzE4ZVxcdTMxYTAtXFx1MzFiYVxcdTMxZjAtXFx1MzFmZlxcdTM0MDAtXFx1NGRiNVxcdTRlMDAtXFx1OWZjY1xcdWEwMDAtXFx1YTQ4Y1xcdWE0ZDAtXFx1YTRmZFxcdWE1MDAtXFx1YTYwY1xcdWE2MTAtXFx1YTYxZlxcdWE2MmFcXHVhNjJiXFx1YTY0MC1cXHVhNjZlXFx1YTY3Zi1cXHVhNjk3XFx1YTZhMC1cXHVhNmVmXFx1YTcxNy1cXHVhNzFmXFx1YTcyMi1cXHVhNzg4XFx1YTc4Yi1cXHVhNzhlXFx1YTc5MC1cXHVhNzkzXFx1YTdhMC1cXHVhN2FhXFx1YTdmOC1cXHVhODAxXFx1YTgwMy1cXHVhODA1XFx1YTgwNy1cXHVhODBhXFx1YTgwYy1cXHVhODIyXFx1YTg0MC1cXHVhODczXFx1YTg4Mi1cXHVhOGIzXFx1YThmMi1cXHVhOGY3XFx1YThmYlxcdWE5MGEtXFx1YTkyNVxcdWE5MzAtXFx1YTk0NlxcdWE5NjAtXFx1YTk3Y1xcdWE5ODQtXFx1YTliMlxcdWE5Y2ZcXHVhYTAwLVxcdWFhMjhcXHVhYTQwLVxcdWFhNDJcXHVhYTQ0LVxcdWFhNGJcXHVhYTYwLVxcdWFhNzZcXHVhYTdhXFx1YWE4MC1cXHVhYWFmXFx1YWFiMVxcdWFhYjVcXHVhYWI2XFx1YWFiOS1cXHVhYWJkXFx1YWFjMFxcdWFhYzJcXHVhYWRiLVxcdWFhZGRcXHVhYWUwLVxcdWFhZWFcXHVhYWYyLVxcdWFhZjRcXHVhYjAxLVxcdWFiMDZcXHVhYjA5LVxcdWFiMGVcXHVhYjExLVxcdWFiMTZcXHVhYjIwLVxcdWFiMjZcXHVhYjI4LVxcdWFiMmVcXHVhYmMwLVxcdWFiZTJcXHVhYzAwLVxcdWQ3YTNcXHVkN2IwLVxcdWQ3YzZcXHVkN2NiLVxcdWQ3ZmJcXHVmOTAwLVxcdWZhNmRcXHVmYTcwLVxcdWZhZDlcXHVmYjAwLVxcdWZiMDZcXHVmYjEzLVxcdWZiMTdcXHVmYjFkXFx1ZmIxZi1cXHVmYjI4XFx1ZmIyYS1cXHVmYjM2XFx1ZmIzOC1cXHVmYjNjXFx1ZmIzZVxcdWZiNDBcXHVmYjQxXFx1ZmI0M1xcdWZiNDRcXHVmYjQ2LVxcdWZiYjFcXHVmYmQzLVxcdWZkM2RcXHVmZDUwLVxcdWZkOGZcXHVmZDkyLVxcdWZkYzdcXHVmZGYwLVxcdWZkZmJcXHVmZTcwLVxcdWZlNzRcXHVmZTc2LVxcdWZlZmNcXHVmZjIxLVxcdWZmM2FcXHVmZjQxLVxcdWZmNWFcXHVmZjY2LVxcdWZmYmVcXHVmZmMyLVxcdWZmYzdcXHVmZmNhLVxcdWZmY2ZcXHVmZmQyLVxcdWZmZDdcXHVmZmRhLVxcdWZmZGMwLTlcXHUwMzAwLVxcdTAzNmZcXHUwNDgzLVxcdTA0ODdcXHUwNTkxLVxcdTA1YmRcXHUwNWJmXFx1MDVjMVxcdTA1YzJcXHUwNWM0XFx1MDVjNVxcdTA1YzdcXHUwNjEwLVxcdTA2MWFcXHUwNjRiLVxcdTA2NjlcXHUwNjcwXFx1MDZkNi1cXHUwNmRjXFx1MDZkZi1cXHUwNmU0XFx1MDZlN1xcdTA2ZThcXHUwNmVhLVxcdTA2ZWRcXHUwNmYwLVxcdTA2ZjlcXHUwNzExXFx1MDczMC1cXHUwNzRhXFx1MDdhNi1cXHUwN2IwXFx1MDdjMC1cXHUwN2M5XFx1MDdlYi1cXHUwN2YzXFx1MDgxNi1cXHUwODE5XFx1MDgxYi1cXHUwODIzXFx1MDgyNS1cXHUwODI3XFx1MDgyOS1cXHUwODJkXFx1MDg1OS1cXHUwODViXFx1MDhlNC1cXHUwOGZlXFx1MDkwMC1cXHUwOTAzXFx1MDkzYS1cXHUwOTNjXFx1MDkzZS1cXHUwOTRmXFx1MDk1MS1cXHUwOTU3XFx1MDk2MlxcdTA5NjNcXHUwOTY2LVxcdTA5NmZcXHUwOTgxLVxcdTA5ODNcXHUwOWJjXFx1MDliZS1cXHUwOWM0XFx1MDljN1xcdTA5YzhcXHUwOWNiLVxcdTA5Y2RcXHUwOWQ3XFx1MDllMlxcdTA5ZTNcXHUwOWU2LVxcdTA5ZWZcXHUwYTAxLVxcdTBhMDNcXHUwYTNjXFx1MGEzZS1cXHUwYTQyXFx1MGE0N1xcdTBhNDhcXHUwYTRiLVxcdTBhNGRcXHUwYTUxXFx1MGE2Ni1cXHUwYTcxXFx1MGE3NVxcdTBhODEtXFx1MGE4M1xcdTBhYmNcXHUwYWJlLVxcdTBhYzVcXHUwYWM3LVxcdTBhYzlcXHUwYWNiLVxcdTBhY2RcXHUwYWUyXFx1MGFlM1xcdTBhZTYtXFx1MGFlZlxcdTBiMDEtXFx1MGIwM1xcdTBiM2NcXHUwYjNlLVxcdTBiNDRcXHUwYjQ3XFx1MGI0OFxcdTBiNGItXFx1MGI0ZFxcdTBiNTZcXHUwYjU3XFx1MGI2MlxcdTBiNjNcXHUwYjY2LVxcdTBiNmZcXHUwYjgyXFx1MGJiZS1cXHUwYmMyXFx1MGJjNi1cXHUwYmM4XFx1MGJjYS1cXHUwYmNkXFx1MGJkN1xcdTBiZTYtXFx1MGJlZlxcdTBjMDEtXFx1MGMwM1xcdTBjM2UtXFx1MGM0NFxcdTBjNDYtXFx1MGM0OFxcdTBjNGEtXFx1MGM0ZFxcdTBjNTVcXHUwYzU2XFx1MGM2MlxcdTBjNjNcXHUwYzY2LVxcdTBjNmZcXHUwYzgyXFx1MGM4M1xcdTBjYmNcXHUwY2JlLVxcdTBjYzRcXHUwY2M2LVxcdTBjYzhcXHUwY2NhLVxcdTBjY2RcXHUwY2Q1XFx1MGNkNlxcdTBjZTJcXHUwY2UzXFx1MGNlNi1cXHUwY2VmXFx1MGQwMlxcdTBkMDNcXHUwZDNlLVxcdTBkNDRcXHUwZDQ2LVxcdTBkNDhcXHUwZDRhLVxcdTBkNGRcXHUwZDU3XFx1MGQ2MlxcdTBkNjNcXHUwZDY2LVxcdTBkNmZcXHUwZDgyXFx1MGQ4M1xcdTBkY2FcXHUwZGNmLVxcdTBkZDRcXHUwZGQ2XFx1MGRkOC1cXHUwZGRmXFx1MGRmMlxcdTBkZjNcXHUwZTMxXFx1MGUzNC1cXHUwZTNhXFx1MGU0Ny1cXHUwZTRlXFx1MGU1MC1cXHUwZTU5XFx1MGViMVxcdTBlYjQtXFx1MGViOVxcdTBlYmJcXHUwZWJjXFx1MGVjOC1cXHUwZWNkXFx1MGVkMC1cXHUwZWQ5XFx1MGYxOFxcdTBmMTlcXHUwZjIwLVxcdTBmMjlcXHUwZjM1XFx1MGYzN1xcdTBmMzlcXHUwZjNlXFx1MGYzZlxcdTBmNzEtXFx1MGY4NFxcdTBmODZcXHUwZjg3XFx1MGY4ZC1cXHUwZjk3XFx1MGY5OS1cXHUwZmJjXFx1MGZjNlxcdTEwMmItXFx1MTAzZVxcdTEwNDAtXFx1MTA0OVxcdTEwNTYtXFx1MTA1OVxcdTEwNWUtXFx1MTA2MFxcdTEwNjItXFx1MTA2NFxcdTEwNjctXFx1MTA2ZFxcdTEwNzEtXFx1MTA3NFxcdTEwODItXFx1MTA4ZFxcdTEwOGYtXFx1MTA5ZFxcdTEzNWQtXFx1MTM1ZlxcdTE3MTItXFx1MTcxNFxcdTE3MzItXFx1MTczNFxcdTE3NTJcXHUxNzUzXFx1MTc3MlxcdTE3NzNcXHUxN2I0LVxcdTE3ZDNcXHUxN2RkXFx1MTdlMC1cXHUxN2U5XFx1MTgwYi1cXHUxODBkXFx1MTgxMC1cXHUxODE5XFx1MThhOVxcdTE5MjAtXFx1MTkyYlxcdTE5MzAtXFx1MTkzYlxcdTE5NDYtXFx1MTk0ZlxcdTE5YjAtXFx1MTljMFxcdTE5YzhcXHUxOWM5XFx1MTlkMC1cXHUxOWQ5XFx1MWExNy1cXHUxYTFiXFx1MWE1NS1cXHUxYTVlXFx1MWE2MC1cXHUxYTdjXFx1MWE3Zi1cXHUxYTg5XFx1MWE5MC1cXHUxYTk5XFx1MWIwMC1cXHUxYjA0XFx1MWIzNC1cXHUxYjQ0XFx1MWI1MC1cXHUxYjU5XFx1MWI2Yi1cXHUxYjczXFx1MWI4MC1cXHUxYjgyXFx1MWJhMS1cXHUxYmFkXFx1MWJiMC1cXHUxYmI5XFx1MWJlNi1cXHUxYmYzXFx1MWMyNC1cXHUxYzM3XFx1MWM0MC1cXHUxYzQ5XFx1MWM1MC1cXHUxYzU5XFx1MWNkMC1cXHUxY2QyXFx1MWNkNC1cXHUxY2U4XFx1MWNlZFxcdTFjZjItXFx1MWNmNFxcdTFkYzAtXFx1MWRlNlxcdTFkZmMtXFx1MWRmZlxcdTIwMGNcXHUyMDBkXFx1MjAzZlxcdTIwNDBcXHUyMDU0XFx1MjBkMC1cXHUyMGRjXFx1MjBlMVxcdTIwZTUtXFx1MjBmMFxcdTJjZWYtXFx1MmNmMVxcdTJkN2ZcXHUyZGUwLVxcdTJkZmZcXHUzMDJhLVxcdTMwMmZcXHUzMDk5XFx1MzA5YVxcdWE2MjAtXFx1YTYyOVxcdWE2NmZcXHVhNjc0LVxcdWE2N2RcXHVhNjlmXFx1YTZmMFxcdWE2ZjFcXHVhODAyXFx1YTgwNlxcdWE4MGJcXHVhODIzLVxcdWE4MjdcXHVhODgwXFx1YTg4MVxcdWE4YjQtXFx1YThjNFxcdWE4ZDAtXFx1YThkOVxcdWE4ZTAtXFx1YThmMVxcdWE5MDAtXFx1YTkwOVxcdWE5MjYtXFx1YTkyZFxcdWE5NDctXFx1YTk1M1xcdWE5ODAtXFx1YTk4M1xcdWE5YjMtXFx1YTljMFxcdWE5ZDAtXFx1YTlkOVxcdWFhMjktXFx1YWEzNlxcdWFhNDNcXHVhYTRjXFx1YWE0ZFxcdWFhNTAtXFx1YWE1OVxcdWFhN2JcXHVhYWIwXFx1YWFiMi1cXHVhYWI0XFx1YWFiN1xcdWFhYjhcXHVhYWJlXFx1YWFiZlxcdWFhYzFcXHVhYWViLVxcdWFhZWZcXHVhYWY1XFx1YWFmNlxcdWFiZTMtXFx1YWJlYVxcdWFiZWNcXHVhYmVkXFx1YWJmMC1cXHVhYmY5XFx1ZmIxZVxcdWZlMDAtXFx1ZmUwZlxcdWZlMjAtXFx1ZmUyNlxcdWZlMzNcXHVmZTM0XFx1ZmU0ZC1cXHVmZTRmXFx1ZmYxMC1cXHVmZjE5XFx1ZmYzZl0qJC8udGVzdChzdHIpXG59XG5tb2R1bGUuZXhwb3J0cyA9IGlzUHJvcGVydHkiLCJ2YXIgaGFzRXhjYXBlID0gL34vXG52YXIgZXNjYXBlTWF0Y2hlciA9IC9+WzAxXS9nXG5mdW5jdGlvbiBlc2NhcGVSZXBsYWNlciAobSkge1xuICBzd2l0Y2ggKG0pIHtcbiAgICBjYXNlICd+MSc6IHJldHVybiAnLydcbiAgICBjYXNlICd+MCc6IHJldHVybiAnfidcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdGlsZGUgZXNjYXBlOiAnICsgbSlcbn1cblxuZnVuY3Rpb24gdW50aWxkZSAoc3RyKSB7XG4gIGlmICghaGFzRXhjYXBlLnRlc3Qoc3RyKSkgcmV0dXJuIHN0clxuICByZXR1cm4gc3RyLnJlcGxhY2UoZXNjYXBlTWF0Y2hlciwgZXNjYXBlUmVwbGFjZXIpXG59XG5cbmZ1bmN0aW9uIHNldHRlciAob2JqLCBwb2ludGVyLCB2YWx1ZSkge1xuICB2YXIgcGFydFxuICB2YXIgaGFzTmV4dFBhcnRcblxuICBmb3IgKHZhciBwID0gMSwgbGVuID0gcG9pbnRlci5sZW5ndGg7IHAgPCBsZW47KSB7XG4gICAgcGFydCA9IHVudGlsZGUocG9pbnRlcltwKytdKVxuICAgIGhhc05leHRQYXJ0ID0gbGVuID4gcFxuXG4gICAgaWYgKHR5cGVvZiBvYmpbcGFydF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBzdXBwb3J0IHNldHRpbmcgb2YgLy1cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KG9iaikgJiYgcGFydCA9PT0gJy0nKSB7XG4gICAgICAgIHBhcnQgPSBvYmoubGVuZ3RoXG4gICAgICB9XG5cbiAgICAgIC8vIHN1cHBvcnQgbmVzdGVkIG9iamVjdHMvYXJyYXkgd2hlbiBzZXR0aW5nIHZhbHVlc1xuICAgICAgaWYgKGhhc05leHRQYXJ0KSB7XG4gICAgICAgIGlmICgocG9pbnRlcltwXSAhPT0gJycgJiYgcG9pbnRlcltwXSA8IEluZmluaXR5KSB8fCBwb2ludGVyW3BdID09PSAnLScpIG9ialtwYXJ0XSA9IFtdXG4gICAgICAgIGVsc2Ugb2JqW3BhcnRdID0ge31cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWhhc05leHRQYXJ0KSBicmVha1xuICAgIG9iaiA9IG9ialtwYXJ0XVxuICB9XG5cbiAgdmFyIG9sZFZhbHVlID0gb2JqW3BhcnRdXG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSBkZWxldGUgb2JqW3BhcnRdXG4gIGVsc2Ugb2JqW3BhcnRdID0gdmFsdWVcbiAgcmV0dXJuIG9sZFZhbHVlXG59XG5cbmZ1bmN0aW9uIGNvbXBpbGVQb2ludGVyIChwb2ludGVyKSB7XG4gIGlmICh0eXBlb2YgcG9pbnRlciA9PT0gJ3N0cmluZycpIHtcbiAgICBwb2ludGVyID0gcG9pbnRlci5zcGxpdCgnLycpXG4gICAgaWYgKHBvaW50ZXJbMF0gPT09ICcnKSByZXR1cm4gcG9pbnRlclxuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBKU09OIHBvaW50ZXIuJylcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHBvaW50ZXIpKSB7XG4gICAgcmV0dXJuIHBvaW50ZXJcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBKU09OIHBvaW50ZXIuJylcbn1cblxuZnVuY3Rpb24gZ2V0IChvYmosIHBvaW50ZXIpIHtcbiAgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaW5wdXQgb2JqZWN0LicpXG4gIHBvaW50ZXIgPSBjb21waWxlUG9pbnRlcihwb2ludGVyKVxuICB2YXIgbGVuID0gcG9pbnRlci5sZW5ndGhcbiAgaWYgKGxlbiA9PT0gMSkgcmV0dXJuIG9ialxuXG4gIGZvciAodmFyIHAgPSAxOyBwIDwgbGVuOykge1xuICAgIG9iaiA9IG9ialt1bnRpbGRlKHBvaW50ZXJbcCsrXSldXG4gICAgaWYgKGxlbiA9PT0gcCkgcmV0dXJuIG9ialxuICAgIGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JykgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG59XG5cbmZ1bmN0aW9uIHNldCAob2JqLCBwb2ludGVyLCB2YWx1ZSkge1xuICBpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpbnB1dCBvYmplY3QuJylcbiAgcG9pbnRlciA9IGNvbXBpbGVQb2ludGVyKHBvaW50ZXIpXG4gIGlmIChwb2ludGVyLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIEpTT04gcG9pbnRlciBmb3Igc2V0LicpXG4gIHJldHVybiBzZXR0ZXIob2JqLCBwb2ludGVyLCB2YWx1ZSlcbn1cblxuZnVuY3Rpb24gY29tcGlsZSAocG9pbnRlcikge1xuICB2YXIgY29tcGlsZWQgPSBjb21waWxlUG9pbnRlcihwb2ludGVyKVxuICByZXR1cm4ge1xuICAgIGdldDogZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgcmV0dXJuIGdldChvYmplY3QsIGNvbXBpbGVkKVxuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiAob2JqZWN0LCB2YWx1ZSkge1xuICAgICAgcmV0dXJuIHNldChvYmplY3QsIGNvbXBpbGVkLCB2YWx1ZSlcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0cy5nZXQgPSBnZXRcbmV4cG9ydHMuc2V0ID0gc2V0XG5leHBvcnRzLmNvbXBpbGUgPSBjb21waWxlXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZFxuXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG5mdW5jdGlvbiBleHRlbmQoKSB7XG4gICAgdmFyIHRhcmdldCA9IHt9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldXG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCdmcmVlemVyLWpzJylcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnaXMtbXktanNvbi12YWxpZCcpXG4iXX0=
