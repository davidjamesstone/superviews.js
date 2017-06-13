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

},{"../delegator":2,"jpi-models":13}],2:[function(require,module,exports){
module.exports = require('dom-delegate')

},{"dom-delegate":10}],3:[function(require,module,exports){
module.exports = require('document-register-element')

},{"document-register-element":8}],4:[function(require,module,exports){
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
        elementOpen("input", "40dfa52d-3f2a-48e9-a89c-a0a90ad1ed1e", hoisted1, "value", state.age, "min", ctrl.minAge, "max", ctrl.maxAge)
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
    elementOpen("div", "4120727f-c1b4-4a92-9697-34b31a9b8d1d", hoisted2)
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

},{"incremental-dom":11}],5:[function(require,module,exports){
require('../../../dre')

const superviews = require('../../../client')
const patch = require('../../../incremental-dom').patch
const prop = require('supermodels.js/lib/prop')()
const view = require('./index.html')
const Symbols = {
  CONTROLLER: Symbol('controller')
}
const ageSchema = {
  type: 'integer',
  min: 0,
  max: 130
}

const options = {
  schema: 'schema',
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

// Let's register 4 simple validators. Registering validators
// makes them part of the fluent interface when using `prop`.
prop.prototype.attribute = function (value) {
  this.__attribute = !!value
  return this
}


prop.register('required', function () {
  return function (val, name) {
    if (!val) {
      return name + ' is required'
    }
  }
})

prop.register('min', function (min) {
  return function (val, name) {
    if (val < min) {
      return name + ' is less than ' + min
    }
  }
})

prop.register('max', function (max) {
  return function (val, name) {
    if (val > max) {
      return name + ' is greater than ' + max
    }
  }
})

var props = {
  str: prop(String).attribute(true),
  num: prop(Number).attribute(true).min(2).max(10).required()
}

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

    this.str = prop(String).required()
    this.num = prop(Number).required()

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

  get str1 () {
    return
  }

  set str1 (value) {

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

},{"../../../client":1,"../../../dre":3,"../../../incremental-dom":6,"./index.html":4,"supermodels.js/lib/prop":14}],6:[function(require,module,exports){
const IncrementalDOM = require('incremental-dom')

IncrementalDOM.attributes.checked = function (el, name, value) {
  el.checked = !!value
}

IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value === null || typeof (value) === 'undefined' ? '' : value
}

module.exports = IncrementalDOM

},{"incremental-dom":11}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{"./delegate":9}],11:[function(require,module,exports){
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

},{"_process":7}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{"./array":12}],14:[function(require,module,exports){
'use strict'

function factory () {
  function Prop (type) {
    if (!(this instanceof Prop)) {
      return new Prop(type)
    }

    this.__type = type
    this.__validators = []
  }
  Prop.prototype.type = function (type) {
    this.__type = type
    return this
  }
  Prop.prototype.enumerable = function (enumerable) {
    this.__enumerable = enumerable
    return this
  }
  Prop.prototype.configurable = function (configurable) {
    this.__configurable = configurable
    return this
  }
  Prop.prototype.writable = function (writable) {
    this.__writable = writable
    return this
  }
  Prop.prototype.keys = function (keys) {
    if (this.__type !== Array) {
      this.__type = Object
    }
    for (var key in keys) {
      this[key] = keys[key]
    }
    return this
  }
  Prop.prototype.validate = function (fn) {
    this.__validators.push(fn)
    return this
  }
  Prop.prototype.get = function (fn) {
    this.__get = fn
    return this
  }
  Prop.prototype.set = function (fn) {
    this.__set = fn
    return this
  }
  Prop.prototype.value = function (value) {
    this.__value = value
    return this
  }
  Prop.prototype.name = function (name) {
    this.__displayName = name
    return this
  }
  Prop.register = function (name, fn) {
    var wrapper = function () {
      this.__validators.push(fn.apply(this, arguments))
      return this
    }
    Object.defineProperty(Prop.prototype, name, {
      value: wrapper
    })
  }
  return Prop
}

module.exports = factory

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvaW5kZXguanMiLCJkZWxlZ2F0b3IuanMiLCJkcmUuanMiLCJleGFtcGxlcy9jbGllbnQveC1nbHVlL2luZGV4Lmh0bWwiLCJleGFtcGxlcy9jbGllbnQveC1nbHVlL2luZGV4LmpzIiwiaW5jcmVtZW50YWwtZG9tLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50L2J1aWxkL2RvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQubm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9kb20tZGVsZWdhdGUvbGliL2RlbGVnYXRlLmpzIiwibm9kZV9tb2R1bGVzL2RvbS1kZWxlZ2F0ZS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaW5jcmVtZW50YWwtZG9tL2Rpc3QvaW5jcmVtZW50YWwtZG9tLWNqcy5qcyIsIm5vZGVfbW9kdWxlcy9qcGktbW9kZWxzL2FycmF5LmpzIiwibm9kZV9tb2R1bGVzL2pwaS1tb2RlbHMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL3Byb3AuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlSQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ242Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxNENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIGNvbnN0IFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmUnKVxuY29uc3QgZGVsZWdhdG9yID0gcmVxdWlyZSgnLi4vZGVsZWdhdG9yJylcbmNvbnN0IE1vZGVsID0gcmVxdWlyZSgnanBpLW1vZGVscycpXG4vLyBjb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKCcuLi92YWxpZGF0b3InKVxuXG4vLyBjb25zdCB2YWxpZGF0b3JPcHRpb25zID0ge1xuLy8gICBncmVlZHk6IHRydWUsXG4vLyAgIGZvcm1hdHM6IHtcbi8vICAgICB1dWlkOiAvXig/OnVybjp1dWlkOik/WzAtOWEtZl17OH0tKD86WzAtOWEtZl17NH0tKXszfVswLTlhLWZdezEyfSQvaSxcbi8vICAgICBvYmplY3RpZDogL15bYS1mXFxkXXsyNH0kL2lcbi8vICAgfVxuLy8gfVxuXG5mdW5jdGlvbiBjb252ZXJ0VmFsdWUgKHZhbHVlLCB0eXBlKSB7XG4gIGlmICh0eXBlb2YgKHZhbHVlKSAhPT0gJ3N0cmluZycgfHwgdHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWVcbiAgfVxuXG4gIGlmICh0eXBlID09PSAnaW50ZWdlcicgfHwgdHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAvLyBmYXN0ZXN0IChhbmQgbW9yZSByZWxpYWJsZSkgd2F5IHRvIGNvbnZlcnQgc3RyaW5ncyB0byBudW1iZXJzXG4gICAgdmFyIGNvbnZlcnRlZFZhbCA9IDEgKiB2YWx1ZVxuICAgIC8vIG1ha2Ugc3VyZSB0aGF0IGlmIG91ciBzY2hlbWEgY2FsbHMgZm9yIGFuIGludGVnZXIsIHRoYXQgdGhlcmUgaXMgbm8gZGVjaW1hbFxuICAgIGlmIChjb252ZXJ0ZWRWYWwgfHwgY29udmVydGVkVmFsID09PSAwICYmICh0eXBlID09PSAnbnVtYmVyJyB8fCAodmFsdWUuaW5kZXhPZignLicpID09PSAtMSkpKSB7XG4gICAgICByZXR1cm4gY29udmVydGVkVmFsXG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdib29sZWFuJykge1xuICAgIGlmICh2YWx1ZSA9PT0gJ3RydWUnKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSBpZiAodmFsdWUgPT09ICdmYWxzZScpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB2YWx1ZVxufVxuXG5mdW5jdGlvbiBpc1NpbXBsZSAoaXRlbSkge1xuICByZXR1cm4gaXRlbS50eXBlID09PSAnbnVtYmVyJyB8fCBpdGVtLnR5cGUgPT09ICdzdHJpbmcnIHx8IGl0ZW0udHlwZSA9PT0gJ2Jvb2xlYW4nXG59XG5cbmNvbnN0IHN1cGVydmlld3MgPSAob3B0aW9ucywgQmFzZSA9IHdpbmRvdy5IVE1MRWxlbWVudCkgPT4gY2xhc3MgU3VwZXJ2aWV3cyBleHRlbmRzIEJhc2Uge1xuICBjb25zdHJ1Y3RvciAoXykge1xuICAgIF8gPSBzdXBlcihfKVxuXG4gICAgY29uc3QgY2FjaGUgPSB7XG4gICAgICBvcHRpb25zOiBvcHRpb25zXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVmZXJyZWQgcmVuZGVyZXJcbiAgICAgKi9cbiAgICBsZXQgcmVuZGVyVGltZW91dElkID0gMFxuICAgIGNvbnN0IHJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghcmVuZGVyVGltZW91dElkKSB7XG4gICAgICAgIHJlbmRlclRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHJlbmRlclRpbWVvdXRJZCA9IDBcbiAgICAgICAgICBfLnJlbmRlckNhbGxiYWNrKClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjYWNoZS5yZW5kZXIgPSByZW5kZXJcblxuICAgIC8qKlxuICAgICAqIElucHV0IHByb3BzL2F0dHJzICYgdmFsaWRhdGlvblxuICAgICAqL1xuICAgIGNvbnN0IHNjaGVtYSA9IG9wdGlvbnMuc2NoZW1hXG4gICAgaWYgKHNjaGVtYSAmJiBzY2hlbWEucHJvcGVydGllcykge1xuICAgICAgY29uc3QgbW9kZWwgPSBNb2RlbChzY2hlbWEpXG5cbiAgICAgIG1vZGVsLm9uKCd1cGRhdGUnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhlLmV2ZW50LCBlLnBhdGgpXG4gICAgICB9KVxuXG4gICAgICAvLyBjb25zdCBvcHRzID0gb3B0aW9ucy52YWxpZGF0b3JPcHRpb25zIHx8IHZhbGlkYXRvck9wdGlvbnNcbiAgICAgIC8vIGNvbnN0IHZhbGlkYXRlID0gdmFsaWRhdG9yKHNjaGVtYSwgb3B0cylcbiAgICAgIGNvbnN0IHByb3BzID0gc2NoZW1hLnByb3BlcnRpZXNcbiAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9wcylcblxuICAgICAgLy8gRm9yIGV2ZXJ5IGtleSBpbiB0aGUgcm9vdCBzY2hlbWFzIHByb3BlcnRpZXNcbiAgICAgIC8vIHNldCB1cCBhbiBhdHRyaWJ1dGUgb3IgcHJvcGVydHkgb24gdGhlIGVsZW1lbnRcbiAgICAgIGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSBwcm9wc1trZXldXG4gICAgICAgIGNvbnN0IGlzQXR0ciA9IGlzU2ltcGxlKGl0ZW0pXG4gICAgICAgIGxldCBkZmx0XG5cbiAgICAgICAgaWYgKCdkZWZhdWx0JyBpbiBpdGVtKSB7XG4gICAgICAgICAgZGZsdCA9IGl0ZW0uZGVmYXVsdFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzQXR0cikge1xuICAgICAgICAgIC8vIFN0b3JlIHByaW1pdGl2ZSB0eXBlcyBhcyBhdHRyaWJ1dGVzIGFuZCBjYXN0IG9uIGBnZXRgXG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KF8sIGtleSwge1xuICAgICAgICAgICAgZ2V0ICgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFzQXR0cmlidXRlKGtleSlcbiAgICAgICAgICAgICAgICA/IGNvbnZlcnRWYWx1ZSh0aGlzLmdldEF0dHJpYnV0ZShrZXkpLCBpdGVtLnR5cGUpXG4gICAgICAgICAgICAgICAgOiBkZmx0XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0ICh2YWx1ZSkge1xuICAgICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gU3RvcmUgb2JqZWN0cy9hcnJheXMgdHlwZXMgYXMgYXR0cmlidXRlcyBhbmQgY2FzdCBvbiBgZ2V0YFxuICAgICAgICAgIGxldCB2YWxcblxuICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShfLCBrZXksIHtcbiAgICAgICAgICAgIGdldCAoKSB7XG4gICAgICAgICAgICAgIHJldHVybiB2YWwgPT09IHVuZGVmaW5lZCA/IGRmbHQgOiB2YWxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQgKHZhbHVlKSB7XG4gICAgICAgICAgICAgIGNvbnN0IG9sZHZhbCA9IHZhbFxuICAgICAgICAgICAgICBjb25zdCBuZXd2YWwgPSB2YWx1ZVxuXG4gICAgICAgICAgICAgIGlmIChuZXd2YWwgIT09IG9sZHZhbCkge1xuICAgICAgICAgICAgICAgIHZhbCA9IG5ld3ZhbFxuICAgICAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGtleSwgKCtuZXcgRGF0ZSgpKS50b1N0cmluZygzNikpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAvLyBjYWNoZS52YWxpZGF0ZSA9IHZhbGlkYXRlXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgRGVsZWdhdGlvblxuICAgICAqL1xuICAgIGNvbnN0IGRlbCA9IGRlbGVnYXRvcih0aGlzKVxuICAgIF8ub24gPSBkZWwub24uYmluZChkZWwpXG4gICAgICAgIC8vIC5maWx0ZXIoa2V5ID0+IGlzU2ltcGxlKHByb3BlcnRpZXNba2V5XSkpXG4gICAgXy5vZmYgPSBkZWwub2ZmLmJpbmQoZGVsKVxuICAgIGNhY2hlLmRlbGVnYXRlID0gZGVsXG5cbiAgICBjYWNoZS5ldmVudHMgPSBvcHRpb25zLmV2ZW50c1xuXG4gICAgXy5fX3N1cGVydmlld3MgPSBjYWNoZVxuXG4gICAgXy5pbml0KClcblxuICAgIHJldHVybiBfXG4gIH1cblxuICBpbml0ICgpIHsgLyogb3ZlcnJpZGUgYXMgeW91IGxpa2UgKi8gfVxuXG4gIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzICgpIHtcbiAgICBjb25zdCBwcm9wZXJ0aWVzID0gb3B0aW9ucy5zY2hlbWEgJiYgb3B0aW9ucy5zY2hlbWEucHJvcGVydGllc1xuXG4gICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgIHJldHVybiBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKVxuICAgICAgICAvLyAuZmlsdGVyKGtleSA9PiBpc1NpbXBsZShwcm9wZXJ0aWVzW2tleV0pKVxuICAgICAgICAubWFwKGtleSA9PiBrZXkudG9Mb3dlckNhc2UoKSlcbiAgICB9XG4gIH1cblxuICByZW5kZXJDYWxsYmFjayAoKSB7XG4gICAgY29uc29sZS5sb2coJ05vdCBpbXBsZW1lbnRlZCEnKVxuICB9XG5cbiAgLy8gcHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2sgKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAvLyAgIC8vIFJlbmRlciBvbiBhbnkgY2hhbmdlIHRvIG9ic2VydmVkIHByb3BlcnRpZXNcbiAgLy8gICAvLyBUaGlzIGNhbiBiZSBvdmVycmlkZW4gaW4gYSBzdWJjbGFzcy5cbiAgLy8gICAvLyBUbyBjYWxsIHRoaXMgZnJvbSB0aGUgc3ViY2xhc3MgdXNlXG4gIC8vICAgLy8gc3VwZXIucHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKVxuICAvLyAgIHRoaXMucmVuZGVyKClcbiAgLy8gfVxuXG4gIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayAobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgLy8gUmVuZGVyIG9uIGFueSBjaGFuZ2UgdG8gb2JzZXJ2ZWQgYXR0cmlidXRlc1xuICAgIC8vIFRoaXMgY2FuIGJlIG92ZXJyaWRlbiBpbiBhIHN1YmNsYXNzLlxuICAgIC8vIFRvIGNhbGwgdGhpcyBmcm9tIHRoZSBzdWJjbGFzcyB1c2VcbiAgICAvLyBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKVxuICAgIHRoaXMucmVuZGVyKClcbiAgfVxuXG4gIHJlbmRlciAoaW1tZWRpYXRsZXkpIHtcbiAgICBpZiAoaW1tZWRpYXRsZXkpIHtcbiAgICAgIHRoaXMucmVuZGVyQ2FsbGJhY2soKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fc3VwZXJ2aWV3cy5yZW5kZXIoKVxuICAgIH1cbiAgfVxuXG4gIGVtaXQgKG5hbWUsIGN1c3RvbUV2ZW50SW5pdCkge1xuICAgIC8vIE9ubHkgZW1pdCByZWdpc3RlcmVkIGV2ZW50c1xuICAgIGNvbnN0IGV2ZW50cyA9IHRoaXMuX19zdXBlcnZpZXdzLmV2ZW50c1xuXG4gICAgaWYgKCFldmVudHMgfHwgIShuYW1lIGluIGV2ZW50cykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIENyZWF0ZSBjdXN0b20gZXZlbnRcbiAgICBjb25zdCBldmVudCA9IG5ldyB3aW5kb3cuQ3VzdG9tRXZlbnQobmFtZSwgY3VzdG9tRXZlbnRJbml0KVxuXG4gICAgLy8gQ2FsbCB0aGUgRE9NIExldmVsIDEgaGFuZGxlciBpZiBpdCBleGlzdHNcbiAgICBjb25zdCBldmVudE5hbWUgPSAnb24nICsgbmFtZVxuICAgIGlmICh0aGlzW2V2ZW50TmFtZV0pIHtcbiAgICAgIHRoaXNbZXZlbnROYW1lXShldmVudClcbiAgICB9XG5cbiAgICAvLyBEaXNwYXRjaCB0aGUgZXZlbnRcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoZXZlbnQpXG4gIH1cblxuICAvLyB2YWxpZGF0ZSAoKSB7XG4gIC8vICAgLy8gR2V0IHRoZSBzY2hlbWEgYW5kIHZhbGlkYXRlIGZ1bmN0aW9uXG4gIC8vICAgY29uc3Qgc2NoZW1hID0gb3B0aW9ucyAmJiBvcHRpb25zLnNjaGVtYVxuICAvLyAgIGNvbnN0IHZhbGlkYXRlID0gdGhpcy5fX3N1cGVydmlld3MudmFsaWRhdGVcbiAgLy8gICBpZiAoc2NoZW1hICYmIHZhbGlkYXRlKSB7XG4gIC8vICAgICBjb25zdCBwcm9wcyA9IHNjaGVtYS5wcm9wZXJ0aWVzXG4gIC8vICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocHJvcHMpXG5cbiAgLy8gICAgIC8vIEJ1aWxkIHRoZSBpbnB1dCBkYXRhXG4gIC8vICAgICBjb25zdCBkYXRhID0ge31cbiAgLy8gICAgIGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gIC8vICAgICAgIGRhdGFba2V5XSA9IHRoaXNba2V5XVxuICAvLyAgICAgfSlcblxuICAvLyAgICAgLy8gQ2FsbCB0aGUgdmFsaWRhdG9yXG4gIC8vICAgICBjb25zdCByZXN1bHQgPSB7XG4gIC8vICAgICAgIG9rOiB2YWxpZGF0ZShkYXRhKVxuICAvLyAgICAgfVxuXG4gIC8vICAgICAvLyBHZXQgdGhlIGVycm9ycyBpZiBpbiBhbiBpbnZhbGlkIHN0YXRlXG4gIC8vICAgICBpZiAoIXJlc3VsdC5vaykge1xuICAvLyAgICAgICByZXN1bHQuZXJyb3JzID0gdmFsaWRhdGUuZXJyb3JzXG4gIC8vICAgICB9XG5cbiAgLy8gICAgIHJldHVybiByZXN1bHRcbiAgLy8gICB9XG4gIC8vIH1cblxuICBnZXQgcHJvcHMgKCkge1xuICAgIC8vIEdldCB0aGUgc2NoZW1hIGFuZCB2YWxpZGF0ZSBmdW5jdGlvblxuICAgIGNvbnN0IHNjaGVtYSA9IG9wdGlvbnMgJiYgb3B0aW9ucy5zY2hlbWFcbiAgICBpZiAoc2NoZW1hKSB7XG4gICAgICBjb25zdCBwcm9wcyA9IHNjaGVtYS5wcm9wZXJ0aWVzXG4gICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocHJvcHMpXG5cbiAgICAgIC8vIEJ1aWxkIHRoZSBpbnB1dCBkYXRhXG4gICAgICBjb25zdCBkYXRhID0ge31cbiAgICAgIGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIGRhdGFba2V5XSA9IHRoaXNba2V5XVxuICAgICAgfSlcblxuICAgICAgcmV0dXJuIGRhdGFcbiAgICB9XG4gIH1cbiAgc3RhdGljIGdldCBzY2hlbWEgKCkge1xuICAgIHJldHVybiBvcHRpb25zLnNjaGVtYVxuICB9XG5cbiAgc3RhdGljIGdldCBldmVudHMgKCkge1xuICAgIHJldHVybiBvcHRpb25zLmV2ZW50c1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3VwZXJ2aWV3c1xuXG4vLyBUT0RPOlxuLy8gU0tJUFxuLy8gRXh0ZW5kIG90aGVyIEhUTUwgZWxlbWVudHMgLSBcImlzXCIvLyBUT0RPOlxuLy8gU0tJUFxuLy8gRVhURU5EIEhUTUxcbi8vIE5vIG1vcmUgY2hlY2tlZD17aXNDaGVja2VkID8gJ2NoZWNrZWQnOiBudWxsfSA9PiBjaGVja2VkPXtpc0NoZWNrZWR9IGZvciBib29sZWFuIGF0dHJpYnV0ZXNcbi8vIFNjb3BlL3RoaXMvZGF0YS9tb2RlbCAoc3ByZWFkPykgYmV0d2VlbiB0aGUgdmlldyBhbmQgY3VzdG9tZWxlbWVudC5cbi8vIEFsc28gZXZlbnQgaGFuZGxlcnMgbmVlZCBzaG91bGQgbm90IGhhdmUgdG8gYmUgcmVkZWZpbmVkIGVhY2ggcGF0Y2hcbi8vICAgLSBJbiBmYWN0LCBkb20gbGV2ZWwgMSBldmVudHMgd2lsbCAqYWx3YXlzKiBiZSByZWRlZmluZWQgd2l0aCBzdXBlcnZpZXdzIGhhbmRsZXIgd3JhcHBlci4gRml4IHRoaXMuXG4vLyBzdGF0ZSBmcm9tIHByb3BzLiBuZWVkIHRvIGtub3cgd2hlbiBhIHByb3BlcnR5IGNoYW5nZXMgKHRvIHBvc3NpYmx5IHVwZGF0ZSBzdGF0ZSkuIG9yIG1hcmsgcHJvcGVydGllcyBlLmcuXG4vLyBvcHRzID0ge1xuLy8gICBzY2hlbWE6IHtcbi8vICAgICBwcm9wZXJ0aWVzOiB7XG4vLyAgICAgICB0b2RvOiB7XG4vLyAgICAgICAgIHRleHQ6IHsgdHlwZTogJ3N0cmluZycgfSxcbi8vICAgICAgICAgaXNDb21wbGV0ZWQ6IHsgdHlwZTogJ2Jvb2xlYW4nIH1cbi8vICAgICAgIH1cbi8vICAgICB9LFxuLy8gICAgIHJlcXVpcmVkOiBbJ2lkJywgJ3RleHQnXVxuLy8gICB9LFxuICAgICAgLy8gbm93IG1hcmsgY2VydGFpbiBwcm9wZXJ0aWVzIGFzIHN0b3JlcyB0aGF0IHdoZW4gc2V0LCB3aWxsIGJlIGZyb3plblxuICAgICAgLy8gTWF5YmUgZnJlZXplIGV2ZXJ5dGhpbmc/XG4vLyAgIHN0b3JlczogWyd0b2RvJywgLi4uXVxuLy8gfVxuLy8gQWx0ZXJuYXRpdmVseSwgaGF2ZSBhIG9uUHJvcGVydHlDaGFuZ2VkIGNhbGxiYWNrLlxuLy8gTmVlZCBhIHN0cmF0ZWd5IGZvciBpbnRlcm5hbCBzdGF0ZSBvciBwcm9wc1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCdkb20tZGVsZWdhdGUnKVxuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCdkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50JylcbiIsInZhciBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpXG52YXIgcGF0Y2ggPSBJbmNyZW1lbnRhbERPTS5wYXRjaFxudmFyIGVsZW1lbnRPcGVuID0gSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5cbnZhciBlbGVtZW50Q2xvc2UgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Q2xvc2VcbnZhciBza2lwID0gSW5jcmVtZW50YWxET00uc2tpcFxudmFyIGN1cnJlbnRFbGVtZW50ID0gSW5jcmVtZW50YWxET00uY3VycmVudEVsZW1lbnRcbnZhciB0ZXh0ID0gSW5jcmVtZW50YWxET00udGV4dFxuXG52YXIgaG9pc3RlZDEgPSBbXCJ0eXBlXCIsIFwicmFuZ2VcIiwgXCJuYW1lXCIsIFwiYWdlXCJdXG52YXIgaG9pc3RlZDIgPSBbXCJzdHlsZVwiLCBcImJhY2tncm91bmQ6IHJlZDsgcGFkZGluZzogMTBweDtcIl1cbnZhciBfX3RhcmdldFxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlc2NyaXB0aW9uIChlbCwgc3RhdGUsIGN0cmwpIHtcbmVsZW1lbnRPcGVuKFwiZGl2XCIpXG4gIGNvbnN0IHJlc3VsdCA9IGN0cmwudmFsaWRhdGUoKVxuICBpZiAocmVzdWx0Lm9rKSB7XG4gICAgZWxlbWVudE9wZW4oXCJiXCIpXG4gICAgICB0ZXh0KFwiaGlcIilcbiAgICBlbGVtZW50Q2xvc2UoXCJiXCIpXG4gICAgdGV4dChcIiBcIiArICh0aGlzLmF0dHIxKSArIFwiIFxcXG4gICAgICAgIFwiKVxuICAgIGVsZW1lbnRPcGVuKFwiYnV0dG9uXCIsIG51bGwsIG51bGwsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgIGN0cmwucmVtb3ZlQWxsSGFuZGxlcnMoKX0pXG4gICAgICB0ZXh0KFwiUmVtb3ZlIEhhbmRsZXJzXCIpXG4gICAgZWxlbWVudENsb3NlKFwiYnV0dG9uXCIpXG4gICAgZWxlbWVudE9wZW4oXCJkbFwiKVxuICAgICAgZWxlbWVudE9wZW4oXCJkdFwiKVxuICAgICAgICB0ZXh0KFwiU3RhdGVcIilcbiAgICAgIGVsZW1lbnRDbG9zZShcImR0XCIpXG4gICAgICBlbGVtZW50T3BlbihcImRkXCIpXG4gICAgICAgIGVsZW1lbnRPcGVuKFwiaW5wdXRcIiwgXCI0MGRmYTUyZC0zZjJhLTQ4ZTktYTg5Yy1hMGE5MGFkMWVkMWVcIiwgaG9pc3RlZDEsIFwidmFsdWVcIiwgc3RhdGUuYWdlLCBcIm1pblwiLCBjdHJsLm1pbkFnZSwgXCJtYXhcIiwgY3RybC5tYXhBZ2UpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcImlucHV0XCIpXG4gICAgICBlbGVtZW50Q2xvc2UoXCJkZFwiKVxuICAgICAgZWxlbWVudE9wZW4oXCJkZFwiKVxuICAgICAgICB0ZXh0KFwiXCIgKyAoSlNPTi5zdHJpbmdpZnkoc3RhdGUudG9KUygpLCBudWxsLCAyKSkgKyBcIlwiKVxuICAgICAgZWxlbWVudENsb3NlKFwiZGRcIilcbiAgICBlbGVtZW50Q2xvc2UoXCJkbFwiKVxuICAgIHRleHQoXCIgXFxcbiAgICAgICAgQ2hhbmdlIHRoZSBzdGF0ZSBpbiB0aGUgYnJvd3Nlci4uLiBcXFxuICAgICAgICBcIilcbiAgICBlbGVtZW50T3BlbihcImRpdlwiKVxuICAgICAgdGV4dChcInZhciBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3gtd2lkZ2V0Jyk7XCIpXG4gICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgZWxlbWVudE9wZW4oXCJkaXZcIilcbiAgICAgIHRleHQoXCJlbC5zdGF0ZS5zZXQoJ2EnICwgNDIpXCIpXG4gICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgZWxlbWVudE9wZW4oXCJkaXZcIilcbiAgICAgIHRleHQoXCJlbC5zdGF0ZS5zZXQoJ2InICwgJ2ZvbycpXCIpXG4gICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgZWxlbWVudE9wZW4oXCJkaXZcIilcbiAgICAgIHRleHQoXCJlbC5zdGF0ZS5zZXQoJ2MnICwgWydiYXInLCAnYmF6J10pXCIpXG4gICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gIH0gZWxzZSB7XG4gICAgZWxlbWVudE9wZW4oXCJkaXZcIiwgXCI0MTIwNzI3Zi1jMWI0LTRhOTItOTY5Ny0zNGIzMWE5YjhkMWRcIiwgaG9pc3RlZDIpXG4gICAgICBlbGVtZW50T3BlbihcInByZVwiKVxuICAgICAgICB0ZXh0KFwiXCIgKyAoSlNPTi5zdHJpbmdpZnkocmVzdWx0LmVycm9ycywgbnVsbCwgMikpICsgXCJcIilcbiAgICAgIGVsZW1lbnRDbG9zZShcInByZVwiKVxuICAgIGVsZW1lbnRDbG9zZShcImRpdlwiKVxuICAgIHRleHQoXCIgXFxcbiAgICAgICAgRml4IHRoZSBlcnJvcnMgaW4gdGhlIGNvbnNvbGUgZmlyc3QuIEUuZy4gXFxcbiAgICAgICAgXCIpXG4gICAgZWxlbWVudE9wZW4oXCJkaXZcIilcbiAgICAgIHRleHQoXCJ2YXIgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCd4LXdpZGdldCcpXCIpXG4gICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgZWxlbWVudE9wZW4oXCJkaXZcIilcbiAgICAgIHRleHQoXCJlbC5pbnQgPSAnMidcIilcbiAgICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbiAgICBlbGVtZW50T3BlbihcImRpdlwiKVxuICAgICAgdGV4dChcImVsLnByb3AxID0gW11cIilcbiAgICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbiAgfVxuZWxlbWVudENsb3NlKFwiZGl2XCIpXG59XG4iLCJyZXF1aXJlKCcuLi8uLi8uLi9kcmUnKVxuXG5jb25zdCBzdXBlcnZpZXdzID0gcmVxdWlyZSgnLi4vLi4vLi4vY2xpZW50JylcbmNvbnN0IHBhdGNoID0gcmVxdWlyZSgnLi4vLi4vLi4vaW5jcmVtZW50YWwtZG9tJykucGF0Y2hcbmNvbnN0IHByb3AgPSByZXF1aXJlKCdzdXBlcm1vZGVscy5qcy9saWIvcHJvcCcpKClcbmNvbnN0IHZpZXcgPSByZXF1aXJlKCcuL2luZGV4Lmh0bWwnKVxuY29uc3QgU3ltYm9scyA9IHtcbiAgQ09OVFJPTExFUjogU3ltYm9sKCdjb250cm9sbGVyJylcbn1cbmNvbnN0IGFnZVNjaGVtYSA9IHtcbiAgdHlwZTogJ2ludGVnZXInLFxuICBtaW46IDAsXG4gIG1heDogMTMwXG59XG5cbmNvbnN0IG9wdGlvbnMgPSB7XG4gIHNjaGVtYTogJ3NjaGVtYScsXG4gIGV2ZW50czoge1xuICAgIGNoYW5nZWFnZTogYWdlU2NoZW1hLFxuICAgIG1lc3NhZ2U6IHtcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgbmFtZTogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICB0aW1lc3RhbXA6IHsgdHlwZTogJ2RhdGUnIH1cbiAgICAgIH0sXG4gICAgICByZXF1aXJlZDogWyduYW1lJywgJ3RpbWVzdGFtcCddXG4gICAgfVxuICB9XG59XG5cbi8vIExldCdzIHJlZ2lzdGVyIDQgc2ltcGxlIHZhbGlkYXRvcnMuIFJlZ2lzdGVyaW5nIHZhbGlkYXRvcnNcbi8vIG1ha2VzIHRoZW0gcGFydCBvZiB0aGUgZmx1ZW50IGludGVyZmFjZSB3aGVuIHVzaW5nIGBwcm9wYC5cbnByb3AucHJvdG90eXBlLmF0dHJpYnV0ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB0aGlzLl9fYXR0cmlidXRlID0gISF2YWx1ZVxuICByZXR1cm4gdGhpc1xufVxuXG5cbnByb3AucmVnaXN0ZXIoJ3JlcXVpcmVkJywgZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbCwgbmFtZSkge1xuICAgIGlmICghdmFsKSB7XG4gICAgICByZXR1cm4gbmFtZSArICcgaXMgcmVxdWlyZWQnXG4gICAgfVxuICB9XG59KVxuXG5wcm9wLnJlZ2lzdGVyKCdtaW4nLCBmdW5jdGlvbiAobWluKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsLCBuYW1lKSB7XG4gICAgaWYgKHZhbCA8IG1pbikge1xuICAgICAgcmV0dXJuIG5hbWUgKyAnIGlzIGxlc3MgdGhhbiAnICsgbWluXG4gICAgfVxuICB9XG59KVxuXG5wcm9wLnJlZ2lzdGVyKCdtYXgnLCBmdW5jdGlvbiAobWF4KSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsLCBuYW1lKSB7XG4gICAgaWYgKHZhbCA+IG1heCkge1xuICAgICAgcmV0dXJuIG5hbWUgKyAnIGlzIGdyZWF0ZXIgdGhhbiAnICsgbWF4XG4gICAgfVxuICB9XG59KVxuXG52YXIgcHJvcHMgPSB7XG4gIHN0cjogcHJvcChTdHJpbmcpLmF0dHJpYnV0ZSh0cnVlKSxcbiAgbnVtOiBwcm9wKE51bWJlcikuYXR0cmlidXRlKHRydWUpLm1pbigyKS5tYXgoMTApLnJlcXVpcmVkKClcbn1cblxuLy8gU29tZXRpbWVzIGEgc2ltcGxlIGBjb250cm9sbGVyYCBjbGFzcyBjYW4gYmUgYSB1c2VmdWwgd2F5XG4vLyBvZiBrZWVwaW5nIGludGVybmFsIGNvZGUgc2VwYXJhdGUgZnJvbSB0aGUgY29tcG9uZW50IGNsYXNzXG5jbGFzcyBDb250cm9sbGVyIHtcbiAgY29uc3RydWN0b3IgKGVsKSB7XG4gICAgdGhpcy5lbCA9IGVsXG4gICAgdGhpcy5taW5BZ2UgPSBhZ2VTY2hlbWEubWluXG4gICAgdGhpcy5tYXhBZ2UgPSBhZ2VTY2hlbWEubWF4XG4gIH1cblxuICBvbkNsaWNrIChlKSB7XG4gICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgIGNvbnNvbGUubG9nKCdCb25qb3VyJylcbiAgfVxuXG4gIHJlbW92ZUFsbEhhbmRsZXJzIChlKSB7XG4gICAgdGhpcy5lbC5vZmYoKVxuICB9XG5cbiAgdmFsaWRhdGUgKCkge1xuICAgIC8vIEdldCB0aGUgc2NoZW1hIGFuZCB2YWxpZGF0ZSBmdW5jdGlvblxuICAgIGNvbnN0IGRhdGEgPSB0aGlzLmVsLnByb3BzXG5cbiAgICAvLyBDYWxsIHRoZSB2YWxpZGF0b3JcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICBvazogdmFsaWRhdGUoZGF0YSlcbiAgICB9XG5cbiAgICAvLyBHZXQgdGhlIGVycm9ycyBpZiBpbiBhbiBpbnZhbGlkIHN0YXRlXG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIHJlc3VsdC5lcnJvcnMgPSB2YWxpZGF0ZS5lcnJvcnNcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbn1cblxuY2xhc3MgV2lkZ2V0IGV4dGVuZHMgc3VwZXJ2aWV3cyhvcHRpb25zKSB7XG4gIGluaXQgKCkge1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlcih0aGlzKVxuXG4gICAgdGhpcy5zdHIgPSBwcm9wKFN0cmluZykucmVxdWlyZWQoKVxuICAgIHRoaXMubnVtID0gcHJvcChOdW1iZXIpLnJlcXVpcmVkKClcblxuICAgIHRoaXNcbiAgICAgIC5vbignY2xpY2snLCBjb250cm9sbGVyLm9uQ2xpY2spXG4gICAgICAub24oJ2NsaWNrJywgJ2InLCAoZSkgPT4geyBjb25zb2xlLmxvZygnaGV5JykgfSlcbiAgICAgIC5vbignY2hhbmdlJywgJ2lucHV0W25hbWU9YWdlXScsIChlKSA9PiB7XG4gICAgICAgIGNvbnN0IGFnZSA9ICtlLnRhcmdldC52YWx1ZVxuICAgICAgICAvLyB0aGlzLnN0YXRlLnNldCgnYWdlJywgYWdlKVxuICAgICAgICB0aGlzLmVtaXQoJ2NoYW5nZWFnZScsIHtcbiAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgIGFnZTogYWdlXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcblxuICAgIC8vIGNvbnN0IHN0b3JlID0gbmV3IFN0b3JlKHtcbiAgICAvLyAgIGFnZTogNDJcbiAgICAvLyB9KVxuXG4gICAgLy8gc3RvcmUub24oJ3VwZGF0ZScsIChjdXJyZW50U3RhdGUsIHByZXZTdGF0ZSkgPT4ge1xuICAgIC8vICAgdGhpcy5yZW5kZXIoKVxuICAgIC8vIH0pXG5cbiAgICAvLyAvLyBmb3IgdGhlIHB1cnBvc2VzIG9mIHRoaXMgZXhhbXBsZVxuICAgIC8vIC8vIGBzdGF0ZWAgaXMgZXhwb3NlZCBoZXJlIHRvIGFsbG93XG4gICAgLy8gLy8gaXQgdG8gYmUgbW9kaWZpZWQgaW4gdGhlIGJyb3dzZXJzIGNvbnNvbGVcbiAgICAvLyAvLyAtIHlvdSBnZW5lcmFsbHkgd29udCB3YW50IHRvIGRvIHRoaXMgdGhvdWdoXG4gICAgLy8gT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdzdGF0ZScsIHtcbiAgICAvLyAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgIC8vICAgICByZXR1cm4gc3RvcmUuZ2V0KClcbiAgICAvLyAgIH1cbiAgICAvLyB9KVxuXG4gICAgdGhpc1tTeW1ib2xzLkNPTlRST0xMRVJdID0gY29udHJvbGxlclxuICB9XG5cbiAgZ2V0IHN0cjEgKCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgc2V0IHN0cjEgKHZhbHVlKSB7XG5cbiAgfVxuXG4gIGNvbm5lY3RlZENhbGxiYWNrICgpIHtcbiAgICB0aGlzLnJlbmRlcih0cnVlKVxuICB9XG5cbiAgcmVuZGVyQ2FsbGJhY2sgKCkge1xuICAgIHBhdGNoKHRoaXMsICgpID0+IHtcbiAgICAgIHZpZXcuY2FsbCh0aGlzLCB0aGlzLCB0aGlzLnN0YXRlLCB0aGlzW1N5bWJvbHMuQ09OVFJPTExFUl0pXG4gICAgfSlcbiAgfVxufVxuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCd4LXdpZGdldCcsIFdpZGdldClcblxubW9kdWxlLmV4cG9ydCA9IFdpZGdldFxuIiwiY29uc3QgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20nKVxuXG5JbmNyZW1lbnRhbERPTS5hdHRyaWJ1dGVzLmNoZWNrZWQgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIGVsLmNoZWNrZWQgPSAhIXZhbHVlXG59XG5cbkluY3JlbWVudGFsRE9NLmF0dHJpYnV0ZXMudmFsdWUgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIGVsLnZhbHVlID0gdmFsdWUgPT09IG51bGwgfHwgdHlwZW9mICh2YWx1ZSkgPT09ICd1bmRlZmluZWQnID8gJycgOiB2YWx1ZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEluY3JlbWVudGFsRE9NXG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLyohXG5cbkNvcHlyaWdodCAoQykgMjAxNC0yMDE2IGJ5IEFuZHJlYSBHaWFtbWFyY2hpIC0gQFdlYlJlZmxlY3Rpb25cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLlxuXG4qL1xuLy8gZ2xvYmFsIHdpbmRvdyBPYmplY3Rcbi8vIG9wdGlvbmFsIHBvbHlmaWxsIGluZm9cbi8vICAgICdhdXRvJyB1c2VkIGJ5IGRlZmF1bHQsIGV2ZXJ5dGhpbmcgaXMgZmVhdHVyZSBkZXRlY3RlZFxuLy8gICAgJ2ZvcmNlJyB1c2UgdGhlIHBvbHlmaWxsIGV2ZW4gaWYgbm90IGZ1bGx5IG5lZWRlZFxuZnVuY3Rpb24gaW5zdGFsbEN1c3RvbUVsZW1lbnRzKHdpbmRvdywgcG9seWZpbGwpIHsndXNlIHN0cmljdCc7XG5cbiAgLy8gRE8gTk9UIFVTRSBUSElTIEZJTEUgRElSRUNUTFksIElUIFdPTidUIFdPUktcbiAgLy8gVEhJUyBJUyBBIFBST0pFQ1QgQkFTRUQgT04gQSBCVUlMRCBTWVNURU1cbiAgLy8gVEhJUyBGSUxFIElTIEpVU1QgV1JBUFBFRCBVUCBSRVNVTFRJTkcgSU5cbiAgLy8gYnVpbGQvZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudC5ub2RlLmpzXG5cbiAgdmFyXG4gICAgZG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQsXG4gICAgT2JqZWN0ID0gd2luZG93Lk9iamVjdFxuICA7XG5cbiAgdmFyIGh0bWxDbGFzcyA9IChmdW5jdGlvbiAoaW5mbykge1xuICAgIC8vIChDKSBBbmRyZWEgR2lhbW1hcmNoaSAtIEBXZWJSZWZsZWN0aW9uIC0gTUlUIFN0eWxlXG4gICAgdmFyXG4gICAgICBjYXRjaENsYXNzID0gL15bQS1aXStbYS16XS8sXG4gICAgICBmaWx0ZXJCeSA9IGZ1bmN0aW9uIChyZSkge1xuICAgICAgICB2YXIgYXJyID0gW10sIHRhZztcbiAgICAgICAgZm9yICh0YWcgaW4gcmVnaXN0ZXIpIHtcbiAgICAgICAgICBpZiAocmUudGVzdCh0YWcpKSBhcnIucHVzaCh0YWcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgICB9LFxuICAgICAgYWRkID0gZnVuY3Rpb24gKENsYXNzLCB0YWcpIHtcbiAgICAgICAgdGFnID0gdGFnLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmICghKHRhZyBpbiByZWdpc3RlcikpIHtcbiAgICAgICAgICByZWdpc3RlcltDbGFzc10gPSAocmVnaXN0ZXJbQ2xhc3NdIHx8IFtdKS5jb25jYXQodGFnKTtcbiAgICAgICAgICByZWdpc3Rlclt0YWddID0gKHJlZ2lzdGVyW3RhZy50b1VwcGVyQ2FzZSgpXSA9IENsYXNzKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHJlZ2lzdGVyID0gKE9iamVjdC5jcmVhdGUgfHwgT2JqZWN0KShudWxsKSxcbiAgICAgIGh0bWxDbGFzcyA9IHt9LFxuICAgICAgaSwgc2VjdGlvbiwgdGFncywgQ2xhc3NcbiAgICA7XG4gICAgZm9yIChzZWN0aW9uIGluIGluZm8pIHtcbiAgICAgIGZvciAoQ2xhc3MgaW4gaW5mb1tzZWN0aW9uXSkge1xuICAgICAgICB0YWdzID0gaW5mb1tzZWN0aW9uXVtDbGFzc107XG4gICAgICAgIHJlZ2lzdGVyW0NsYXNzXSA9IHRhZ3M7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgcmVnaXN0ZXJbdGFnc1tpXS50b0xvd2VyQ2FzZSgpXSA9XG4gICAgICAgICAgcmVnaXN0ZXJbdGFnc1tpXS50b1VwcGVyQ2FzZSgpXSA9IENsYXNzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGh0bWxDbGFzcy5nZXQgPSBmdW5jdGlvbiBnZXQodGFnT3JDbGFzcykge1xuICAgICAgcmV0dXJuIHR5cGVvZiB0YWdPckNsYXNzID09PSAnc3RyaW5nJyA/XG4gICAgICAgIChyZWdpc3Rlclt0YWdPckNsYXNzXSB8fCAoY2F0Y2hDbGFzcy50ZXN0KHRhZ09yQ2xhc3MpID8gW10gOiAnJykpIDpcbiAgICAgICAgZmlsdGVyQnkodGFnT3JDbGFzcyk7XG4gICAgfTtcbiAgICBodG1sQ2xhc3Muc2V0ID0gZnVuY3Rpb24gc2V0KHRhZywgQ2xhc3MpIHtcbiAgICAgIHJldHVybiAoY2F0Y2hDbGFzcy50ZXN0KHRhZykgP1xuICAgICAgICBhZGQodGFnLCBDbGFzcykgOlxuICAgICAgICBhZGQoQ2xhc3MsIHRhZylcbiAgICAgICksIGh0bWxDbGFzcztcbiAgICB9O1xuICAgIHJldHVybiBodG1sQ2xhc3M7XG4gIH0oe1xuICAgIFwiY29sbGVjdGlvbnNcIjoge1xuICAgICAgXCJIVE1MQWxsQ29sbGVjdGlvblwiOiBbXG4gICAgICAgIFwiYWxsXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxDb2xsZWN0aW9uXCI6IFtcbiAgICAgICAgXCJmb3Jtc1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRm9ybUNvbnRyb2xzQ29sbGVjdGlvblwiOiBbXG4gICAgICAgIFwiZWxlbWVudHNcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE9wdGlvbnNDb2xsZWN0aW9uXCI6IFtcbiAgICAgICAgXCJvcHRpb25zXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIFwiZWxlbWVudHNcIjoge1xuICAgICAgXCJFbGVtZW50XCI6IFtcbiAgICAgICAgXCJlbGVtZW50XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxBbmNob3JFbGVtZW50XCI6IFtcbiAgICAgICAgXCJhXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxBcHBsZXRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJhcHBsZXRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEFyZWFFbGVtZW50XCI6IFtcbiAgICAgICAgXCJhcmVhXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxBdHRhY2htZW50RWxlbWVudFwiOiBbXG4gICAgICAgIFwiYXR0YWNobWVudFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQXVkaW9FbGVtZW50XCI6IFtcbiAgICAgICAgXCJhdWRpb1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQlJFbGVtZW50XCI6IFtcbiAgICAgICAgXCJiclwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQmFzZUVsZW1lbnRcIjogW1xuICAgICAgICBcImJhc2VcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEJvZHlFbGVtZW50XCI6IFtcbiAgICAgICAgXCJib2R5XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxCdXR0b25FbGVtZW50XCI6IFtcbiAgICAgICAgXCJidXR0b25cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTENhbnZhc0VsZW1lbnRcIjogW1xuICAgICAgICBcImNhbnZhc1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQ29udGVudEVsZW1lbnRcIjogW1xuICAgICAgICBcImNvbnRlbnRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTERMaXN0RWxlbWVudFwiOiBbXG4gICAgICAgIFwiZGxcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTERhdGFFbGVtZW50XCI6IFtcbiAgICAgICAgXCJkYXRhXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxEYXRhTGlzdEVsZW1lbnRcIjogW1xuICAgICAgICBcImRhdGFsaXN0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxEZXRhaWxzRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZGV0YWlsc1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRGlhbG9nRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZGlhbG9nXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxEaXJlY3RvcnlFbGVtZW50XCI6IFtcbiAgICAgICAgXCJkaXJcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTERpdkVsZW1lbnRcIjogW1xuICAgICAgICBcImRpdlwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRG9jdW1lbnRcIjogW1xuICAgICAgICBcImRvY3VtZW50XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxFbGVtZW50XCI6IFtcbiAgICAgICAgXCJlbGVtZW50XCIsXG4gICAgICAgIFwiYWJiclwiLFxuICAgICAgICBcImFkZHJlc3NcIixcbiAgICAgICAgXCJhcnRpY2xlXCIsXG4gICAgICAgIFwiYXNpZGVcIixcbiAgICAgICAgXCJiXCIsXG4gICAgICAgIFwiYmRpXCIsXG4gICAgICAgIFwiYmRvXCIsXG4gICAgICAgIFwiY2l0ZVwiLFxuICAgICAgICBcImNvZGVcIixcbiAgICAgICAgXCJjb21tYW5kXCIsXG4gICAgICAgIFwiZGRcIixcbiAgICAgICAgXCJkZm5cIixcbiAgICAgICAgXCJkdFwiLFxuICAgICAgICBcImVtXCIsXG4gICAgICAgIFwiZmlnY2FwdGlvblwiLFxuICAgICAgICBcImZpZ3VyZVwiLFxuICAgICAgICBcImZvb3RlclwiLFxuICAgICAgICBcImhlYWRlclwiLFxuICAgICAgICBcImlcIixcbiAgICAgICAgXCJrYmRcIixcbiAgICAgICAgXCJtYXJrXCIsXG4gICAgICAgIFwibmF2XCIsXG4gICAgICAgIFwibm9zY3JpcHRcIixcbiAgICAgICAgXCJycFwiLFxuICAgICAgICBcInJ0XCIsXG4gICAgICAgIFwicnVieVwiLFxuICAgICAgICBcInNcIixcbiAgICAgICAgXCJzYW1wXCIsXG4gICAgICAgIFwic2VjdGlvblwiLFxuICAgICAgICBcInNtYWxsXCIsXG4gICAgICAgIFwic3Ryb25nXCIsXG4gICAgICAgIFwic3ViXCIsXG4gICAgICAgIFwic3VtbWFyeVwiLFxuICAgICAgICBcInN1cFwiLFxuICAgICAgICBcInVcIixcbiAgICAgICAgXCJ2YXJcIixcbiAgICAgICAgXCJ3YnJcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEVtYmVkRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZW1iZWRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEZpZWxkU2V0RWxlbWVudFwiOiBbXG4gICAgICAgIFwiZmllbGRzZXRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEZvbnRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJmb250XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxGb3JtRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZm9ybVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRnJhbWVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJmcmFtZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRnJhbWVTZXRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJmcmFtZXNldFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MSFJFbGVtZW50XCI6IFtcbiAgICAgICAgXCJoclwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MSGVhZEVsZW1lbnRcIjogW1xuICAgICAgICBcImhlYWRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEhlYWRpbmdFbGVtZW50XCI6IFtcbiAgICAgICAgXCJoMVwiLFxuICAgICAgICBcImgyXCIsXG4gICAgICAgIFwiaDNcIixcbiAgICAgICAgXCJoNFwiLFxuICAgICAgICBcImg1XCIsXG4gICAgICAgIFwiaDZcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEh0bWxFbGVtZW50XCI6IFtcbiAgICAgICAgXCJodG1sXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxJRnJhbWVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJpZnJhbWVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEltYWdlRWxlbWVudFwiOiBbXG4gICAgICAgIFwiaW1nXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxJbnB1dEVsZW1lbnRcIjogW1xuICAgICAgICBcImlucHV0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxLZXlnZW5FbGVtZW50XCI6IFtcbiAgICAgICAgXCJrZXlnZW5cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTExJRWxlbWVudFwiOiBbXG4gICAgICAgIFwibGlcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTExhYmVsRWxlbWVudFwiOiBbXG4gICAgICAgIFwibGFiZWxcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTExlZ2VuZEVsZW1lbnRcIjogW1xuICAgICAgICBcImxlZ2VuZFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTGlua0VsZW1lbnRcIjogW1xuICAgICAgICBcImxpbmtcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE1hcEVsZW1lbnRcIjogW1xuICAgICAgICBcIm1hcFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTWFycXVlZUVsZW1lbnRcIjogW1xuICAgICAgICBcIm1hcnF1ZWVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE1lZGlhRWxlbWVudFwiOiBbXG4gICAgICAgIFwibWVkaWFcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE1lbnVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJtZW51XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxNZW51SXRlbUVsZW1lbnRcIjogW1xuICAgICAgICBcIm1lbnVpdGVtXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxNZXRhRWxlbWVudFwiOiBbXG4gICAgICAgIFwibWV0YVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTWV0ZXJFbGVtZW50XCI6IFtcbiAgICAgICAgXCJtZXRlclwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTW9kRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZGVsXCIsXG4gICAgICAgIFwiaW5zXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxPTGlzdEVsZW1lbnRcIjogW1xuICAgICAgICBcIm9sXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxPYmplY3RFbGVtZW50XCI6IFtcbiAgICAgICAgXCJvYmplY3RcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE9wdEdyb3VwRWxlbWVudFwiOiBbXG4gICAgICAgIFwib3B0Z3JvdXBcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE9wdGlvbkVsZW1lbnRcIjogW1xuICAgICAgICBcIm9wdGlvblwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MT3V0cHV0RWxlbWVudFwiOiBbXG4gICAgICAgIFwib3V0cHV0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxQYXJhZ3JhcGhFbGVtZW50XCI6IFtcbiAgICAgICAgXCJwXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxQYXJhbUVsZW1lbnRcIjogW1xuICAgICAgICBcInBhcmFtXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxQaWN0dXJlRWxlbWVudFwiOiBbXG4gICAgICAgIFwicGljdHVyZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MUHJlRWxlbWVudFwiOiBbXG4gICAgICAgIFwicHJlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxQcm9ncmVzc0VsZW1lbnRcIjogW1xuICAgICAgICBcInByb2dyZXNzXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxRdW90ZUVsZW1lbnRcIjogW1xuICAgICAgICBcImJsb2NrcXVvdGVcIixcbiAgICAgICAgXCJxXCIsXG4gICAgICAgIFwicXVvdGVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFNjcmlwdEVsZW1lbnRcIjogW1xuICAgICAgICBcInNjcmlwdFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MU2VsZWN0RWxlbWVudFwiOiBbXG4gICAgICAgIFwic2VsZWN0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxTaGFkb3dFbGVtZW50XCI6IFtcbiAgICAgICAgXCJzaGFkb3dcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFNsb3RFbGVtZW50XCI6IFtcbiAgICAgICAgXCJzbG90XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxTb3VyY2VFbGVtZW50XCI6IFtcbiAgICAgICAgXCJzb3VyY2VcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFNwYW5FbGVtZW50XCI6IFtcbiAgICAgICAgXCJzcGFuXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxTdHlsZUVsZW1lbnRcIjogW1xuICAgICAgICBcInN0eWxlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUYWJsZUNhcHRpb25FbGVtZW50XCI6IFtcbiAgICAgICAgXCJjYXB0aW9uXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUYWJsZUNlbGxFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0ZFwiLFxuICAgICAgICBcInRoXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUYWJsZUNvbEVsZW1lbnRcIjogW1xuICAgICAgICBcImNvbFwiLFxuICAgICAgICBcImNvbGdyb3VwXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUYWJsZUVsZW1lbnRcIjogW1xuICAgICAgICBcInRhYmxlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUYWJsZVJvd0VsZW1lbnRcIjogW1xuICAgICAgICBcInRyXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUYWJsZVNlY3Rpb25FbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0aGVhZFwiLFxuICAgICAgICBcInRib2R5XCIsXG4gICAgICAgIFwidGZvb3RcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFRlbXBsYXRlRWxlbWVudFwiOiBbXG4gICAgICAgIFwidGVtcGxhdGVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFRleHRBcmVhRWxlbWVudFwiOiBbXG4gICAgICAgIFwidGV4dGFyZWFcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFRpbWVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0aW1lXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUaXRsZUVsZW1lbnRcIjogW1xuICAgICAgICBcInRpdGxlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUcmFja0VsZW1lbnRcIjogW1xuICAgICAgICBcInRyYWNrXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxVTGlzdEVsZW1lbnRcIjogW1xuICAgICAgICBcInVsXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxVbmtub3duRWxlbWVudFwiOiBbXG4gICAgICAgIFwidW5rbm93blwiLFxuICAgICAgICBcInZoZ3JvdXB2XCIsXG4gICAgICAgIFwidmtleWdlblwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVmlkZW9FbGVtZW50XCI6IFtcbiAgICAgICAgXCJ2aWRlb1wiXG4gICAgICBdXG4gICAgfSxcbiAgICBcIm5vZGVzXCI6IHtcbiAgICAgIFwiQXR0clwiOiBbXG4gICAgICAgIFwibm9kZVwiXG4gICAgICBdLFxuICAgICAgXCJBdWRpb1wiOiBbXG4gICAgICAgIFwiYXVkaW9cIlxuICAgICAgXSxcbiAgICAgIFwiQ0RBVEFTZWN0aW9uXCI6IFtcbiAgICAgICAgXCJub2RlXCJcbiAgICAgIF0sXG4gICAgICBcIkNoYXJhY3RlckRhdGFcIjogW1xuICAgICAgICBcIm5vZGVcIlxuICAgICAgXSxcbiAgICAgIFwiQ29tbWVudFwiOiBbXG4gICAgICAgIFwiI2NvbW1lbnRcIlxuICAgICAgXSxcbiAgICAgIFwiRG9jdW1lbnRcIjogW1xuICAgICAgICBcIiNkb2N1bWVudFwiXG4gICAgICBdLFxuICAgICAgXCJEb2N1bWVudEZyYWdtZW50XCI6IFtcbiAgICAgICAgXCIjZG9jdW1lbnQtZnJhZ21lbnRcIlxuICAgICAgXSxcbiAgICAgIFwiRG9jdW1lbnRUeXBlXCI6IFtcbiAgICAgICAgXCJub2RlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxEb2N1bWVudFwiOiBbXG4gICAgICAgIFwiI2RvY3VtZW50XCJcbiAgICAgIF0sXG4gICAgICBcIkltYWdlXCI6IFtcbiAgICAgICAgXCJpbWdcIlxuICAgICAgXSxcbiAgICAgIFwiT3B0aW9uXCI6IFtcbiAgICAgICAgXCJvcHRpb25cIlxuICAgICAgXSxcbiAgICAgIFwiUHJvY2Vzc2luZ0luc3RydWN0aW9uXCI6IFtcbiAgICAgICAgXCJub2RlXCJcbiAgICAgIF0sXG4gICAgICBcIlNoYWRvd1Jvb3RcIjogW1xuICAgICAgICBcIiNzaGFkb3ctcm9vdFwiXG4gICAgICBdLFxuICAgICAgXCJUZXh0XCI6IFtcbiAgICAgICAgXCIjdGV4dFwiXG4gICAgICBdLFxuICAgICAgXCJYTUxEb2N1bWVudFwiOiBbXG4gICAgICAgIFwieG1sXCJcbiAgICAgIF1cbiAgICB9XG4gIH0pKTtcbiAgXG4gIFxuICAgIFxuICAvLyBwYXNzZWQgYXQgcnVudGltZSwgY29uZmlndXJhYmxlXG4gIC8vIHZpYSBub2RlanMgbW9kdWxlXG4gIGlmICghcG9seWZpbGwpIHBvbHlmaWxsID0gJ2F1dG8nO1xuICBcbiAgdmFyXG4gICAgLy8gVjAgcG9seWZpbGwgZW50cnlcbiAgICBSRUdJU1RFUl9FTEVNRU5UID0gJ3JlZ2lzdGVyRWxlbWVudCcsXG4gIFxuICAgIC8vIElFIDwgMTEgb25seSArIG9sZCBXZWJLaXQgZm9yIGF0dHJpYnV0ZXMgKyBmZWF0dXJlIGRldGVjdGlvblxuICAgIEVYUEFORE9fVUlEID0gJ19fJyArIFJFR0lTVEVSX0VMRU1FTlQgKyAod2luZG93Lk1hdGgucmFuZG9tKCkgKiAxMGU0ID4+IDApLFxuICBcbiAgICAvLyBzaG9ydGN1dHMgYW5kIGNvc3RhbnRzXG4gICAgQUREX0VWRU5UX0xJU1RFTkVSID0gJ2FkZEV2ZW50TGlzdGVuZXInLFxuICAgIEFUVEFDSEVEID0gJ2F0dGFjaGVkJyxcbiAgICBDQUxMQkFDSyA9ICdDYWxsYmFjaycsXG4gICAgREVUQUNIRUQgPSAnZGV0YWNoZWQnLFxuICAgIEVYVEVORFMgPSAnZXh0ZW5kcycsXG4gIFxuICAgIEFUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLID0gJ2F0dHJpYnV0ZUNoYW5nZWQnICsgQ0FMTEJBQ0ssXG4gICAgQVRUQUNIRURfQ0FMTEJBQ0sgPSBBVFRBQ0hFRCArIENBTExCQUNLLFxuICAgIENPTk5FQ1RFRF9DQUxMQkFDSyA9ICdjb25uZWN0ZWQnICsgQ0FMTEJBQ0ssXG4gICAgRElTQ09OTkVDVEVEX0NBTExCQUNLID0gJ2Rpc2Nvbm5lY3RlZCcgKyBDQUxMQkFDSyxcbiAgICBDUkVBVEVEX0NBTExCQUNLID0gJ2NyZWF0ZWQnICsgQ0FMTEJBQ0ssXG4gICAgREVUQUNIRURfQ0FMTEJBQ0sgPSBERVRBQ0hFRCArIENBTExCQUNLLFxuICBcbiAgICBBRERJVElPTiA9ICdBRERJVElPTicsXG4gICAgTU9ESUZJQ0FUSU9OID0gJ01PRElGSUNBVElPTicsXG4gICAgUkVNT1ZBTCA9ICdSRU1PVkFMJyxcbiAgXG4gICAgRE9NX0FUVFJfTU9ESUZJRUQgPSAnRE9NQXR0ck1vZGlmaWVkJyxcbiAgICBET01fQ09OVEVOVF9MT0FERUQgPSAnRE9NQ29udGVudExvYWRlZCcsXG4gICAgRE9NX1NVQlRSRUVfTU9ESUZJRUQgPSAnRE9NU3VidHJlZU1vZGlmaWVkJyxcbiAgXG4gICAgUFJFRklYX1RBRyA9ICc8JyxcbiAgICBQUkVGSVhfSVMgPSAnPScsXG4gIFxuICAgIC8vIHZhbGlkIGFuZCBpbnZhbGlkIG5vZGUgbmFtZXNcbiAgICB2YWxpZE5hbWUgPSAvXltBLVpdW0EtWjAtOV0qKD86LVtBLVowLTldKykrJC8sXG4gICAgaW52YWxpZE5hbWVzID0gW1xuICAgICAgJ0FOTk9UQVRJT04tWE1MJyxcbiAgICAgICdDT0xPUi1QUk9GSUxFJyxcbiAgICAgICdGT05ULUZBQ0UnLFxuICAgICAgJ0ZPTlQtRkFDRS1TUkMnLFxuICAgICAgJ0ZPTlQtRkFDRS1VUkknLFxuICAgICAgJ0ZPTlQtRkFDRS1GT1JNQVQnLFxuICAgICAgJ0ZPTlQtRkFDRS1OQU1FJyxcbiAgICAgICdNSVNTSU5HLUdMWVBIJ1xuICAgIF0sXG4gIFxuICAgIC8vIHJlZ2lzdGVyZWQgdHlwZXMgYW5kIHRoZWlyIHByb3RvdHlwZXNcbiAgICB0eXBlcyA9IFtdLFxuICAgIHByb3RvcyA9IFtdLFxuICBcbiAgICAvLyB0byBxdWVyeSBzdWJub2Rlc1xuICAgIHF1ZXJ5ID0gJycsXG4gIFxuICAgIC8vIGh0bWwgc2hvcnRjdXQgdXNlZCB0byBmZWF0dXJlIGRldGVjdFxuICAgIGRvY3VtZW50RWxlbWVudCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgXG4gICAgLy8gRVM1IGlubGluZSBoZWxwZXJzIHx8IGJhc2ljIHBhdGNoZXNcbiAgICBpbmRleE9mID0gdHlwZXMuaW5kZXhPZiB8fCBmdW5jdGlvbiAodikge1xuICAgICAgZm9yKHZhciBpID0gdGhpcy5sZW5ndGg7IGktLSAmJiB0aGlzW2ldICE9PSB2Oyl7fVxuICAgICAgcmV0dXJuIGk7XG4gICAgfSxcbiAgXG4gICAgLy8gb3RoZXIgaGVscGVycyAvIHNob3J0Y3V0c1xuICAgIE9QID0gT2JqZWN0LnByb3RvdHlwZSxcbiAgICBoT1AgPSBPUC5oYXNPd25Qcm9wZXJ0eSxcbiAgICBpUE8gPSBPUC5pc1Byb3RvdHlwZU9mLFxuICBcbiAgICBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSxcbiAgICBlbXB0eSA9IFtdLFxuICAgIGdPUEQgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLFxuICAgIGdPUE4gPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyxcbiAgICBnUE8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YsXG4gICAgc1BPID0gT2JqZWN0LnNldFByb3RvdHlwZU9mLFxuICBcbiAgICAvLyBqc2hpbnQgcHJvdG86IHRydWVcbiAgICBoYXNQcm90byA9ICEhT2JqZWN0Ll9fcHJvdG9fXyxcbiAgXG4gICAgLy8gVjEgaGVscGVyc1xuICAgIGZpeEdldENsYXNzID0gZmFsc2UsXG4gICAgRFJFQ0VWMSA9ICdfX2RyZUNFdjEnLFxuICAgIGN1c3RvbUVsZW1lbnRzID0gd2luZG93LmN1c3RvbUVsZW1lbnRzLFxuICAgIHVzYWJsZUN1c3RvbUVsZW1lbnRzID0gcG9seWZpbGwgIT09ICdmb3JjZScgJiYgISEoXG4gICAgICBjdXN0b21FbGVtZW50cyAmJlxuICAgICAgY3VzdG9tRWxlbWVudHMuZGVmaW5lICYmXG4gICAgICBjdXN0b21FbGVtZW50cy5nZXQgJiZcbiAgICAgIGN1c3RvbUVsZW1lbnRzLndoZW5EZWZpbmVkXG4gICAgKSxcbiAgICBEaWN0ID0gT2JqZWN0LmNyZWF0ZSB8fCBPYmplY3QsXG4gICAgTWFwID0gd2luZG93Lk1hcCB8fCBmdW5jdGlvbiBNYXAoKSB7XG4gICAgICB2YXIgSyA9IFtdLCBWID0gW10sIGk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgcmV0dXJuIFZbaW5kZXhPZi5jYWxsKEssIGspXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoaywgdikge1xuICAgICAgICAgIGkgPSBpbmRleE9mLmNhbGwoSywgayk7XG4gICAgICAgICAgaWYgKGkgPCAwKSBWW0sucHVzaChrKSAtIDFdID0gdjtcbiAgICAgICAgICBlbHNlIFZbaV0gPSB2O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG4gICAgUHJvbWlzZSA9IHdpbmRvdy5Qcm9taXNlIHx8IGZ1bmN0aW9uIChmbikge1xuICAgICAgdmFyXG4gICAgICAgIG5vdGlmeSA9IFtdLFxuICAgICAgICBkb25lID0gZmFsc2UsXG4gICAgICAgIHAgPSB7XG4gICAgICAgICAgJ2NhdGNoJzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAndGhlbic6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgbm90aWZ5LnB1c2goY2IpO1xuICAgICAgICAgICAgaWYgKGRvbmUpIHNldFRpbWVvdXQocmVzb2x2ZSwgMSk7XG4gICAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIDtcbiAgICAgIGZ1bmN0aW9uIHJlc29sdmUodmFsdWUpIHtcbiAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgIHdoaWxlIChub3RpZnkubGVuZ3RoKSBub3RpZnkuc2hpZnQoKSh2YWx1ZSk7XG4gICAgICB9XG4gICAgICBmbihyZXNvbHZlKTtcbiAgICAgIHJldHVybiBwO1xuICAgIH0sXG4gICAganVzdENyZWF0ZWQgPSBmYWxzZSxcbiAgICBjb25zdHJ1Y3RvcnMgPSBEaWN0KG51bGwpLFxuICAgIHdhaXRpbmdMaXN0ID0gRGljdChudWxsKSxcbiAgICBub2RlTmFtZXMgPSBuZXcgTWFwKCksXG4gICAgc2Vjb25kQXJndW1lbnQgPSBmdW5jdGlvbiAoaXMpIHtcbiAgICAgIHJldHVybiBpcy50b0xvd2VyQ2FzZSgpO1xuICAgIH0sXG4gIFxuICAgIC8vIHVzZWQgdG8gY3JlYXRlIHVuaXF1ZSBpbnN0YW5jZXNcbiAgICBjcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uIEJyaWRnZShwcm90bykge1xuICAgICAgLy8gc2lsbHkgYnJva2VuIHBvbHlmaWxsIHByb2JhYmx5IGV2ZXIgdXNlZCBidXQgc2hvcnQgZW5vdWdoIHRvIHdvcmtcbiAgICAgIHJldHVybiBwcm90byA/ICgoQnJpZGdlLnByb3RvdHlwZSA9IHByb3RvKSwgbmV3IEJyaWRnZSgpKSA6IHRoaXM7XG4gICAgfSxcbiAgXG4gICAgLy8gd2lsbCBzZXQgdGhlIHByb3RvdHlwZSBpZiBwb3NzaWJsZVxuICAgIC8vIG9yIGNvcHkgb3ZlciBhbGwgcHJvcGVydGllc1xuICAgIHNldFByb3RvdHlwZSA9IHNQTyB8fCAoXG4gICAgICBoYXNQcm90byA/XG4gICAgICAgIGZ1bmN0aW9uIChvLCBwKSB7XG4gICAgICAgICAgby5fX3Byb3RvX18gPSBwO1xuICAgICAgICAgIHJldHVybiBvO1xuICAgICAgICB9IDogKFxuICAgICAgKGdPUE4gJiYgZ09QRCkgP1xuICAgICAgICAoZnVuY3Rpb24oKXtcbiAgICAgICAgICBmdW5jdGlvbiBzZXRQcm9wZXJ0aWVzKG8sIHApIHtcbiAgICAgICAgICAgIGZvciAodmFyXG4gICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgbmFtZXMgPSBnT1BOKHApLFxuICAgICAgICAgICAgICBpID0gMCwgbGVuZ3RoID0gbmFtZXMubGVuZ3RoO1xuICAgICAgICAgICAgICBpIDwgbGVuZ3RoOyBpKytcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBrZXkgPSBuYW1lc1tpXTtcbiAgICAgICAgICAgICAgaWYgKCFoT1AuY2FsbChvLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkobywga2V5LCBnT1BEKHAsIGtleSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAobywgcCkge1xuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICBzZXRQcm9wZXJ0aWVzKG8sIHApO1xuICAgICAgICAgICAgfSB3aGlsZSAoKHAgPSBnUE8ocCkpICYmICFpUE8uY2FsbChwLCBvKSk7XG4gICAgICAgICAgICByZXR1cm4gbztcbiAgICAgICAgICB9O1xuICAgICAgICB9KCkpIDpcbiAgICAgICAgZnVuY3Rpb24gKG8sIHApIHtcbiAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gcCkge1xuICAgICAgICAgICAgb1trZXldID0gcFtrZXldO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbztcbiAgICAgICAgfVxuICAgICkpLFxuICBcbiAgICAvLyBET00gc2hvcnRjdXRzIGFuZCBoZWxwZXJzLCBpZiBhbnlcbiAgXG4gICAgTXV0YXRpb25PYnNlcnZlciA9IHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5XZWJLaXRNdXRhdGlvbk9ic2VydmVyLFxuICBcbiAgICBIVE1MRWxlbWVudFByb3RvdHlwZSA9IChcbiAgICAgIHdpbmRvdy5IVE1MRWxlbWVudCB8fFxuICAgICAgd2luZG93LkVsZW1lbnQgfHxcbiAgICAgIHdpbmRvdy5Ob2RlXG4gICAgKS5wcm90b3R5cGUsXG4gIFxuICAgIElFOCA9ICFpUE8uY2FsbChIVE1MRWxlbWVudFByb3RvdHlwZSwgZG9jdW1lbnRFbGVtZW50KSxcbiAgXG4gICAgc2FmZVByb3BlcnR5ID0gSUU4ID8gZnVuY3Rpb24gKG8sIGssIGQpIHtcbiAgICAgIG9ba10gPSBkLnZhbHVlO1xuICAgICAgcmV0dXJuIG87XG4gICAgfSA6IGRlZmluZVByb3BlcnR5LFxuICBcbiAgICBpc1ZhbGlkTm9kZSA9IElFOCA/XG4gICAgICBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMTtcbiAgICAgIH0gOlxuICAgICAgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGlQTy5jYWxsKEhUTUxFbGVtZW50UHJvdG90eXBlLCBub2RlKTtcbiAgICAgIH0sXG4gIFxuICAgIHRhcmdldHMgPSBJRTggJiYgW10sXG4gIFxuICAgIGF0dGFjaFNoYWRvdyA9IEhUTUxFbGVtZW50UHJvdG90eXBlLmF0dGFjaFNoYWRvdyxcbiAgICBjbG9uZU5vZGUgPSBIVE1MRWxlbWVudFByb3RvdHlwZS5jbG9uZU5vZGUsXG4gICAgZGlzcGF0Y2hFdmVudCA9IEhUTUxFbGVtZW50UHJvdG90eXBlLmRpc3BhdGNoRXZlbnQsXG4gICAgZ2V0QXR0cmlidXRlID0gSFRNTEVsZW1lbnRQcm90b3R5cGUuZ2V0QXR0cmlidXRlLFxuICAgIGhhc0F0dHJpYnV0ZSA9IEhUTUxFbGVtZW50UHJvdG90eXBlLmhhc0F0dHJpYnV0ZSxcbiAgICByZW1vdmVBdHRyaWJ1dGUgPSBIVE1MRWxlbWVudFByb3RvdHlwZS5yZW1vdmVBdHRyaWJ1dGUsXG4gICAgc2V0QXR0cmlidXRlID0gSFRNTEVsZW1lbnRQcm90b3R5cGUuc2V0QXR0cmlidXRlLFxuICBcbiAgICAvLyByZXBsYWNlZCBsYXRlciBvblxuICAgIGNyZWF0ZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50LFxuICAgIHBhdGNoZWRDcmVhdGVFbGVtZW50ID0gY3JlYXRlRWxlbWVudCxcbiAgXG4gICAgLy8gc2hhcmVkIG9ic2VydmVyIGZvciBhbGwgYXR0cmlidXRlc1xuICAgIGF0dHJpYnV0ZXNPYnNlcnZlciA9IE11dGF0aW9uT2JzZXJ2ZXIgJiYge1xuICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgIGNoYXJhY3RlckRhdGE6IHRydWUsXG4gICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogdHJ1ZVxuICAgIH0sXG4gIFxuICAgIC8vIHVzZWZ1bCB0byBkZXRlY3Qgb25seSBpZiB0aGVyZSdzIG5vIE11dGF0aW9uT2JzZXJ2ZXJcbiAgICBET01BdHRyTW9kaWZpZWQgPSBNdXRhdGlvbk9ic2VydmVyIHx8IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGRvZXNOb3RTdXBwb3J0RE9NQXR0ck1vZGlmaWVkID0gZmFsc2U7XG4gICAgICBkb2N1bWVudEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgRE9NX0FUVFJfTU9ESUZJRUQsXG4gICAgICAgIERPTUF0dHJNb2RpZmllZFxuICAgICAgKTtcbiAgICB9LFxuICBcbiAgICAvLyB3aWxsIGJvdGggYmUgdXNlZCB0byBtYWtlIERPTU5vZGVJbnNlcnRlZCBhc3luY2hyb25vdXNcbiAgICBhc2FwUXVldWUsXG4gICAgYXNhcFRpbWVyID0gMCxcbiAgXG4gICAgLy8gaW50ZXJuYWwgZmxhZ3NcbiAgICBWMCA9IFJFR0lTVEVSX0VMRU1FTlQgaW4gZG9jdW1lbnQsXG4gICAgc2V0TGlzdGVuZXIgPSB0cnVlLFxuICAgIGp1c3RTZXR1cCA9IGZhbHNlLFxuICAgIGRvZXNOb3RTdXBwb3J0RE9NQXR0ck1vZGlmaWVkID0gdHJ1ZSxcbiAgICBkcm9wRG9tQ29udGVudExvYWRlZCA9IHRydWUsXG4gIFxuICAgIC8vIG5lZWRlZCBmb3IgdGhlIGlubmVySFRNTCBoZWxwZXJcbiAgICBub3RGcm9tSW5uZXJIVE1MSGVscGVyID0gdHJ1ZSxcbiAgXG4gICAgLy8gb3B0aW9uYWxseSBkZWZpbmVkIGxhdGVyIG9uXG4gICAgb25TdWJ0cmVlTW9kaWZpZWQsXG4gICAgY2FsbERPTUF0dHJNb2RpZmllZCxcbiAgICBnZXRBdHRyaWJ1dGVzTWlycm9yLFxuICAgIG9ic2VydmVyLFxuICAgIG9ic2VydmUsXG4gIFxuICAgIC8vIGJhc2VkIG9uIHNldHRpbmcgcHJvdG90eXBlIGNhcGFiaWxpdHlcbiAgICAvLyB3aWxsIGNoZWNrIHByb3RvIG9yIHRoZSBleHBhbmRvIGF0dHJpYnV0ZVxuICAgIC8vIGluIG9yZGVyIHRvIHNldHVwIHRoZSBub2RlIG9uY2VcbiAgICBwYXRjaElmTm90QWxyZWFkeSxcbiAgICBwYXRjaFxuICA7XG4gIFxuICAvLyBvbmx5IGlmIG5lZWRlZFxuICBpZiAoIVYwKSB7XG4gIFxuICAgIGlmIChzUE8gfHwgaGFzUHJvdG8pIHtcbiAgICAgICAgcGF0Y2hJZk5vdEFscmVhZHkgPSBmdW5jdGlvbiAobm9kZSwgcHJvdG8pIHtcbiAgICAgICAgICBpZiAoIWlQTy5jYWxsKHByb3RvLCBub2RlKSkge1xuICAgICAgICAgICAgc2V0dXBOb2RlKG5vZGUsIHByb3RvKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHBhdGNoID0gc2V0dXBOb2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhdGNoSWZOb3RBbHJlYWR5ID0gZnVuY3Rpb24gKG5vZGUsIHByb3RvKSB7XG4gICAgICAgICAgaWYgKCFub2RlW0VYUEFORE9fVUlEXSkge1xuICAgICAgICAgICAgbm9kZVtFWFBBTkRPX1VJRF0gPSBPYmplY3QodHJ1ZSk7XG4gICAgICAgICAgICBzZXR1cE5vZGUobm9kZSwgcHJvdG8pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcGF0Y2ggPSBwYXRjaElmTm90QWxyZWFkeTtcbiAgICB9XG4gIFxuICAgIGlmIChJRTgpIHtcbiAgICAgIGRvZXNOb3RTdXBwb3J0RE9NQXR0ck1vZGlmaWVkID0gZmFsc2U7XG4gICAgICAoZnVuY3Rpb24gKCl7XG4gICAgICAgIHZhclxuICAgICAgICAgIGRlc2NyaXB0b3IgPSBnT1BEKEhUTUxFbGVtZW50UHJvdG90eXBlLCBBRERfRVZFTlRfTElTVEVORVIpLFxuICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXIgPSBkZXNjcmlwdG9yLnZhbHVlLFxuICAgICAgICAgIHBhdGNoZWRSZW1vdmVBdHRyaWJ1dGUgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgdmFyIGUgPSBuZXcgQ3VzdG9tRXZlbnQoRE9NX0FUVFJfTU9ESUZJRUQsIHtidWJibGVzOiB0cnVlfSk7XG4gICAgICAgICAgICBlLmF0dHJOYW1lID0gbmFtZTtcbiAgICAgICAgICAgIGUucHJldlZhbHVlID0gZ2V0QXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSk7XG4gICAgICAgICAgICBlLm5ld1ZhbHVlID0gbnVsbDtcbiAgICAgICAgICAgIGVbUkVNT1ZBTF0gPSBlLmF0dHJDaGFuZ2UgPSAyO1xuICAgICAgICAgICAgcmVtb3ZlQXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSk7XG4gICAgICAgICAgICBkaXNwYXRjaEV2ZW50LmNhbGwodGhpcywgZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBwYXRjaGVkU2V0QXR0cmlidXRlID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgaGFkID0gaGFzQXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSksXG4gICAgICAgICAgICAgIG9sZCA9IGhhZCAmJiBnZXRBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuYW1lKSxcbiAgICAgICAgICAgICAgZSA9IG5ldyBDdXN0b21FdmVudChET01fQVRUUl9NT0RJRklFRCwge2J1YmJsZXM6IHRydWV9KVxuICAgICAgICAgICAgO1xuICAgICAgICAgICAgc2V0QXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSwgdmFsdWUpO1xuICAgICAgICAgICAgZS5hdHRyTmFtZSA9IG5hbWU7XG4gICAgICAgICAgICBlLnByZXZWYWx1ZSA9IGhhZCA/IG9sZCA6IG51bGw7XG4gICAgICAgICAgICBlLm5ld1ZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICBpZiAoaGFkKSB7XG4gICAgICAgICAgICAgIGVbTU9ESUZJQ0FUSU9OXSA9IGUuYXR0ckNoYW5nZSA9IDE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBlW0FERElUSU9OXSA9IGUuYXR0ckNoYW5nZSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXNwYXRjaEV2ZW50LmNhbGwodGhpcywgZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvblByb3BlcnR5Q2hhbmdlID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIC8vIGpzaGludCBlcW51bGw6dHJ1ZVxuICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgIG5vZGUgPSBlLmN1cnJlbnRUYXJnZXQsXG4gICAgICAgICAgICAgIHN1cGVyU2VjcmV0ID0gbm9kZVtFWFBBTkRPX1VJRF0sXG4gICAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IGUucHJvcGVydHlOYW1lLFxuICAgICAgICAgICAgICBldmVudFxuICAgICAgICAgICAgO1xuICAgICAgICAgICAgaWYgKHN1cGVyU2VjcmV0Lmhhc093blByb3BlcnR5KHByb3BlcnR5TmFtZSkpIHtcbiAgICAgICAgICAgICAgc3VwZXJTZWNyZXQgPSBzdXBlclNlY3JldFtwcm9wZXJ0eU5hbWVdO1xuICAgICAgICAgICAgICBldmVudCA9IG5ldyBDdXN0b21FdmVudChET01fQVRUUl9NT0RJRklFRCwge2J1YmJsZXM6IHRydWV9KTtcbiAgICAgICAgICAgICAgZXZlbnQuYXR0ck5hbWUgPSBzdXBlclNlY3JldC5uYW1lO1xuICAgICAgICAgICAgICBldmVudC5wcmV2VmFsdWUgPSBzdXBlclNlY3JldC52YWx1ZSB8fCBudWxsO1xuICAgICAgICAgICAgICBldmVudC5uZXdWYWx1ZSA9IChzdXBlclNlY3JldC52YWx1ZSA9IG5vZGVbcHJvcGVydHlOYW1lXSB8fCBudWxsKTtcbiAgICAgICAgICAgICAgaWYgKGV2ZW50LnByZXZWYWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRbQURESVRJT05dID0gZXZlbnQuYXR0ckNoYW5nZSA9IDA7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXZlbnRbTU9ESUZJQ0FUSU9OXSA9IGV2ZW50LmF0dHJDaGFuZ2UgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGRpc3BhdGNoRXZlbnQuY2FsbChub2RlLCBldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICA7XG4gICAgICAgIGRlc2NyaXB0b3IudmFsdWUgPSBmdW5jdGlvbiAodHlwZSwgaGFuZGxlciwgY2FwdHVyZSkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGUgPT09IERPTV9BVFRSX01PRElGSUVEICYmXG4gICAgICAgICAgICB0aGlzW0FUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLXSAmJlxuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUgIT09IHBhdGNoZWRTZXRBdHRyaWJ1dGVcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXNbRVhQQU5ET19VSURdID0ge1xuICAgICAgICAgICAgICBjbGFzc05hbWU6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnY2xhc3MnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB0aGlzLmNsYXNzTmFtZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUgPSBwYXRjaGVkU2V0QXR0cmlidXRlO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUgPSBwYXRjaGVkUmVtb3ZlQXR0cmlidXRlO1xuICAgICAgICAgICAgYWRkRXZlbnRMaXN0ZW5lci5jYWxsKHRoaXMsICdwcm9wZXJ0eWNoYW5nZScsIG9uUHJvcGVydHlDaGFuZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhZGRFdmVudExpc3RlbmVyLmNhbGwodGhpcywgdHlwZSwgaGFuZGxlciwgY2FwdHVyZSk7XG4gICAgICAgIH07XG4gICAgICAgIGRlZmluZVByb3BlcnR5KEhUTUxFbGVtZW50UHJvdG90eXBlLCBBRERfRVZFTlRfTElTVEVORVIsIGRlc2NyaXB0b3IpO1xuICAgICAgfSgpKTtcbiAgICB9IGVsc2UgaWYgKCFNdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICBkb2N1bWVudEVsZW1lbnRbQUREX0VWRU5UX0xJU1RFTkVSXShET01fQVRUUl9NT0RJRklFRCwgRE9NQXR0ck1vZGlmaWVkKTtcbiAgICAgIGRvY3VtZW50RWxlbWVudC5zZXRBdHRyaWJ1dGUoRVhQQU5ET19VSUQsIDEpO1xuICAgICAgZG9jdW1lbnRFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShFWFBBTkRPX1VJRCk7XG4gICAgICBpZiAoZG9lc05vdFN1cHBvcnRET01BdHRyTW9kaWZpZWQpIHtcbiAgICAgICAgb25TdWJ0cmVlTW9kaWZpZWQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHZhclxuICAgICAgICAgICAgbm9kZSA9IHRoaXMsXG4gICAgICAgICAgICBvbGRBdHRyaWJ1dGVzLFxuICAgICAgICAgICAgbmV3QXR0cmlidXRlcyxcbiAgICAgICAgICAgIGtleVxuICAgICAgICAgIDtcbiAgICAgICAgICBpZiAobm9kZSA9PT0gZS50YXJnZXQpIHtcbiAgICAgICAgICAgIG9sZEF0dHJpYnV0ZXMgPSBub2RlW0VYUEFORE9fVUlEXTtcbiAgICAgICAgICAgIG5vZGVbRVhQQU5ET19VSURdID0gKG5ld0F0dHJpYnV0ZXMgPSBnZXRBdHRyaWJ1dGVzTWlycm9yKG5vZGUpKTtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIG5ld0F0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIG9sZEF0dHJpYnV0ZXMpKSB7XG4gICAgICAgICAgICAgICAgLy8gYXR0cmlidXRlIHdhcyBhZGRlZFxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsRE9NQXR0ck1vZGlmaWVkKFxuICAgICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgICAgICBvbGRBdHRyaWJ1dGVzW2tleV0sXG4gICAgICAgICAgICAgICAgICBuZXdBdHRyaWJ1dGVzW2tleV0sXG4gICAgICAgICAgICAgICAgICBBRERJVElPTlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAobmV3QXR0cmlidXRlc1trZXldICE9PSBvbGRBdHRyaWJ1dGVzW2tleV0pIHtcbiAgICAgICAgICAgICAgICAvLyBhdHRyaWJ1dGUgd2FzIGNoYW5nZWRcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbERPTUF0dHJNb2RpZmllZChcbiAgICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgb2xkQXR0cmlidXRlc1trZXldLFxuICAgICAgICAgICAgICAgICAgbmV3QXR0cmlidXRlc1trZXldLFxuICAgICAgICAgICAgICAgICAgTU9ESUZJQ0FUSU9OXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY2hlY2tpbmcgaWYgaXQgaGFzIGJlZW4gcmVtb3ZlZFxuICAgICAgICAgICAgZm9yIChrZXkgaW4gb2xkQXR0cmlidXRlcykge1xuICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gbmV3QXR0cmlidXRlcykpIHtcbiAgICAgICAgICAgICAgICAvLyBhdHRyaWJ1dGUgcmVtb3ZlZFxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsRE9NQXR0ck1vZGlmaWVkKFxuICAgICAgICAgICAgICAgICAgMixcbiAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgICAgICBvbGRBdHRyaWJ1dGVzW2tleV0sXG4gICAgICAgICAgICAgICAgICBuZXdBdHRyaWJ1dGVzW2tleV0sXG4gICAgICAgICAgICAgICAgICBSRU1PVkFMXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY2FsbERPTUF0dHJNb2RpZmllZCA9IGZ1bmN0aW9uIChcbiAgICAgICAgICBhdHRyQ2hhbmdlLFxuICAgICAgICAgIGN1cnJlbnRUYXJnZXQsXG4gICAgICAgICAgYXR0ck5hbWUsXG4gICAgICAgICAgcHJldlZhbHVlLFxuICAgICAgICAgIG5ld1ZhbHVlLFxuICAgICAgICAgIGFjdGlvblxuICAgICAgICApIHtcbiAgICAgICAgICB2YXIgZSA9IHtcbiAgICAgICAgICAgIGF0dHJDaGFuZ2U6IGF0dHJDaGFuZ2UsXG4gICAgICAgICAgICBjdXJyZW50VGFyZ2V0OiBjdXJyZW50VGFyZ2V0LFxuICAgICAgICAgICAgYXR0ck5hbWU6IGF0dHJOYW1lLFxuICAgICAgICAgICAgcHJldlZhbHVlOiBwcmV2VmFsdWUsXG4gICAgICAgICAgICBuZXdWYWx1ZTogbmV3VmFsdWVcbiAgICAgICAgICB9O1xuICAgICAgICAgIGVbYWN0aW9uXSA9IGF0dHJDaGFuZ2U7XG4gICAgICAgICAgb25ET01BdHRyTW9kaWZpZWQoZSk7XG4gICAgICAgIH07XG4gICAgICAgIGdldEF0dHJpYnV0ZXNNaXJyb3IgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgIGZvciAodmFyXG4gICAgICAgICAgICBhdHRyLCBuYW1lLFxuICAgICAgICAgICAgcmVzdWx0ID0ge30sXG4gICAgICAgICAgICBhdHRyaWJ1dGVzID0gbm9kZS5hdHRyaWJ1dGVzLFxuICAgICAgICAgICAgaSA9IDAsIGxlbmd0aCA9IGF0dHJpYnV0ZXMubGVuZ3RoO1xuICAgICAgICAgICAgaSA8IGxlbmd0aDsgaSsrXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBhdHRyID0gYXR0cmlidXRlc1tpXTtcbiAgICAgICAgICAgIG5hbWUgPSBhdHRyLm5hbWU7XG4gICAgICAgICAgICBpZiAobmFtZSAhPT0gJ3NldEF0dHJpYnV0ZScpIHtcbiAgICAgICAgICAgICAgcmVzdWx0W25hbWVdID0gYXR0ci52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG4gIFxuICAgIC8vIHNldCBhcyBlbnVtZXJhYmxlLCB3cml0YWJsZSBhbmQgY29uZmlndXJhYmxlXG4gICAgZG9jdW1lbnRbUkVHSVNURVJfRUxFTUVOVF0gPSBmdW5jdGlvbiByZWdpc3RlckVsZW1lbnQodHlwZSwgb3B0aW9ucykge1xuICAgICAgdXBwZXJUeXBlID0gdHlwZS50b1VwcGVyQ2FzZSgpO1xuICAgICAgaWYgKHNldExpc3RlbmVyKSB7XG4gICAgICAgIC8vIG9ubHkgZmlyc3QgdGltZSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQgaXMgdXNlZFxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHNldCB0aGlzIGxpc3RlbmVyXG4gICAgICAgIC8vIHNldHRpbmcgaXQgYnkgZGVmYXVsdCBtaWdodCBzbG93IGRvd24gZm9yIG5vIHJlYXNvblxuICAgICAgICBzZXRMaXN0ZW5lciA9IGZhbHNlO1xuICAgICAgICBpZiAoTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgICAgIG9ic2VydmVyID0gKGZ1bmN0aW9uKGF0dGFjaGVkLCBkZXRhY2hlZCl7XG4gICAgICAgICAgICBmdW5jdGlvbiBjaGVja0VtQWxsKGxpc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgY2FsbGJhY2sobGlzdFtpKytdKSl7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIChyZWNvcmRzKSB7XG4gICAgICAgICAgICAgIGZvciAodmFyXG4gICAgICAgICAgICAgICAgY3VycmVudCwgbm9kZSwgbmV3VmFsdWUsXG4gICAgICAgICAgICAgICAgaSA9IDAsIGxlbmd0aCA9IHJlY29yZHMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKytcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudCA9IHJlY29yZHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQudHlwZSA9PT0gJ2NoaWxkTGlzdCcpIHtcbiAgICAgICAgICAgICAgICAgIGNoZWNrRW1BbGwoY3VycmVudC5hZGRlZE5vZGVzLCBhdHRhY2hlZCk7XG4gICAgICAgICAgICAgICAgICBjaGVja0VtQWxsKGN1cnJlbnQucmVtb3ZlZE5vZGVzLCBkZXRhY2hlZCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIG5vZGUgPSBjdXJyZW50LnRhcmdldDtcbiAgICAgICAgICAgICAgICAgIGlmIChub3RGcm9tSW5uZXJIVE1MSGVscGVyICYmXG4gICAgICAgICAgICAgICAgICAgICAgbm9kZVtBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDS10gJiZcbiAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50LmF0dHJpYnV0ZU5hbWUgIT09ICdzdHlsZScpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWUgPSBnZXRBdHRyaWJ1dGUuY2FsbChub2RlLCBjdXJyZW50LmF0dHJpYnV0ZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IGN1cnJlbnQub2xkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBub2RlW0FUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLXShcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnQuYXR0cmlidXRlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnQub2xkVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0oZXhlY3V0ZUFjdGlvbihBVFRBQ0hFRCksIGV4ZWN1dGVBY3Rpb24oREVUQUNIRUQpKSk7XG4gICAgICAgICAgb2JzZXJ2ZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICBvYnNlcnZlci5vYnNlcnZlKFxuICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgICAgIHN1YnRyZWU6IHRydWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgIH07XG4gICAgICAgICAgb2JzZXJ2ZShkb2N1bWVudCk7XG4gICAgICAgICAgaWYgKGF0dGFjaFNoYWRvdykge1xuICAgICAgICAgICAgSFRNTEVsZW1lbnRQcm90b3R5cGUuYXR0YWNoU2hhZG93ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXR1cm4gb2JzZXJ2ZShhdHRhY2hTaGFkb3cuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhc2FwUXVldWUgPSBbXTtcbiAgICAgICAgICBkb2N1bWVudFtBRERfRVZFTlRfTElTVEVORVJdKCdET01Ob2RlSW5zZXJ0ZWQnLCBvbkRPTU5vZGUoQVRUQUNIRUQpKTtcbiAgICAgICAgICBkb2N1bWVudFtBRERfRVZFTlRfTElTVEVORVJdKCdET01Ob2RlUmVtb3ZlZCcsIG9uRE9NTm9kZShERVRBQ0hFRCkpO1xuICAgICAgICB9XG4gIFxuICAgICAgICBkb2N1bWVudFtBRERfRVZFTlRfTElTVEVORVJdKERPTV9DT05URU5UX0xPQURFRCwgb25SZWFkeVN0YXRlQ2hhbmdlKTtcbiAgICAgICAgZG9jdW1lbnRbQUREX0VWRU5UX0xJU1RFTkVSXSgncmVhZHlzdGF0ZWNoYW5nZScsIG9uUmVhZHlTdGF0ZUNoYW5nZSk7XG4gIFxuICAgICAgICBIVE1MRWxlbWVudFByb3RvdHlwZS5jbG9uZU5vZGUgPSBmdW5jdGlvbiAoZGVlcCkge1xuICAgICAgICAgIHZhclxuICAgICAgICAgICAgbm9kZSA9IGNsb25lTm9kZS5jYWxsKHRoaXMsICEhZGVlcCksXG4gICAgICAgICAgICBpID0gZ2V0VHlwZUluZGV4KG5vZGUpXG4gICAgICAgICAgO1xuICAgICAgICAgIGlmICgtMSA8IGkpIHBhdGNoKG5vZGUsIHByb3Rvc1tpXSk7XG4gICAgICAgICAgaWYgKGRlZXAgJiYgcXVlcnkubGVuZ3RoKSBsb29wQW5kU2V0dXAobm9kZS5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSk7XG4gICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH07XG4gICAgICB9XG4gIFxuICAgICAgaWYgKGp1c3RTZXR1cCkgcmV0dXJuIChqdXN0U2V0dXAgPSBmYWxzZSk7XG4gIFxuICAgICAgaWYgKC0yIDwgKFxuICAgICAgICBpbmRleE9mLmNhbGwodHlwZXMsIFBSRUZJWF9JUyArIHVwcGVyVHlwZSkgK1xuICAgICAgICBpbmRleE9mLmNhbGwodHlwZXMsIFBSRUZJWF9UQUcgKyB1cHBlclR5cGUpXG4gICAgICApKSB7XG4gICAgICAgIHRocm93VHlwZUVycm9yKHR5cGUpO1xuICAgICAgfVxuICBcbiAgICAgIGlmICghdmFsaWROYW1lLnRlc3QodXBwZXJUeXBlKSB8fCAtMSA8IGluZGV4T2YuY2FsbChpbnZhbGlkTmFtZXMsIHVwcGVyVHlwZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgdHlwZSAnICsgdHlwZSArICcgaXMgaW52YWxpZCcpO1xuICAgICAgfVxuICBcbiAgICAgIHZhclxuICAgICAgICBjb25zdHJ1Y3RvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gZXh0ZW5kaW5nID9cbiAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUsIHVwcGVyVHlwZSkgOlxuICAgICAgICAgICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChub2RlTmFtZSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9wdCA9IG9wdGlvbnMgfHwgT1AsXG4gICAgICAgIGV4dGVuZGluZyA9IGhPUC5jYWxsKG9wdCwgRVhURU5EUyksXG4gICAgICAgIG5vZGVOYW1lID0gZXh0ZW5kaW5nID8gb3B0aW9uc1tFWFRFTkRTXS50b1VwcGVyQ2FzZSgpIDogdXBwZXJUeXBlLFxuICAgICAgICB1cHBlclR5cGUsXG4gICAgICAgIGlcbiAgICAgIDtcbiAgXG4gICAgICBpZiAoZXh0ZW5kaW5nICYmIC0xIDwgKFxuICAgICAgICBpbmRleE9mLmNhbGwodHlwZXMsIFBSRUZJWF9UQUcgKyBub2RlTmFtZSlcbiAgICAgICkpIHtcbiAgICAgICAgdGhyb3dUeXBlRXJyb3Iobm9kZU5hbWUpO1xuICAgICAgfVxuICBcbiAgICAgIGkgPSB0eXBlcy5wdXNoKChleHRlbmRpbmcgPyBQUkVGSVhfSVMgOiBQUkVGSVhfVEFHKSArIHVwcGVyVHlwZSkgLSAxO1xuICBcbiAgICAgIHF1ZXJ5ID0gcXVlcnkuY29uY2F0KFxuICAgICAgICBxdWVyeS5sZW5ndGggPyAnLCcgOiAnJyxcbiAgICAgICAgZXh0ZW5kaW5nID8gbm9kZU5hbWUgKyAnW2lzPVwiJyArIHR5cGUudG9Mb3dlckNhc2UoKSArICdcIl0nIDogbm9kZU5hbWVcbiAgICAgICk7XG4gIFxuICAgICAgY29uc3RydWN0b3IucHJvdG90eXBlID0gKFxuICAgICAgICBwcm90b3NbaV0gPSBoT1AuY2FsbChvcHQsICdwcm90b3R5cGUnKSA/XG4gICAgICAgICAgb3B0LnByb3RvdHlwZSA6XG4gICAgICAgICAgY3JlYXRlKEhUTUxFbGVtZW50UHJvdG90eXBlKVxuICAgICAgKTtcbiAgXG4gICAgICBpZiAocXVlcnkubGVuZ3RoKSBsb29wQW5kVmVyaWZ5KFxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSxcbiAgICAgICAgQVRUQUNIRURcbiAgICAgICk7XG4gIFxuICAgICAgcmV0dXJuIGNvbnN0cnVjdG9yO1xuICAgIH07XG4gIFxuICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgPSAocGF0Y2hlZENyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbiAobG9jYWxOYW1lLCB0eXBlRXh0ZW5zaW9uKSB7XG4gICAgICB2YXJcbiAgICAgICAgaXMgPSBnZXRJcyh0eXBlRXh0ZW5zaW9uKSxcbiAgICAgICAgbm9kZSA9IGlzID9cbiAgICAgICAgICBjcmVhdGVFbGVtZW50LmNhbGwoZG9jdW1lbnQsIGxvY2FsTmFtZSwgc2Vjb25kQXJndW1lbnQoaXMpKSA6XG4gICAgICAgICAgY3JlYXRlRWxlbWVudC5jYWxsKGRvY3VtZW50LCBsb2NhbE5hbWUpLFxuICAgICAgICBuYW1lID0gJycgKyBsb2NhbE5hbWUsXG4gICAgICAgIGkgPSBpbmRleE9mLmNhbGwoXG4gICAgICAgICAgdHlwZXMsXG4gICAgICAgICAgKGlzID8gUFJFRklYX0lTIDogUFJFRklYX1RBRykgK1xuICAgICAgICAgIChpcyB8fCBuYW1lKS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICksXG4gICAgICAgIHNldHVwID0gLTEgPCBpXG4gICAgICA7XG4gICAgICBpZiAoaXMpIHtcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoJ2lzJywgaXMgPSBpcy50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgaWYgKHNldHVwKSB7XG4gICAgICAgICAgc2V0dXAgPSBpc0luUVNBKG5hbWUudG9VcHBlckNhc2UoKSwgaXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBub3RGcm9tSW5uZXJIVE1MSGVscGVyID0gIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQuaW5uZXJIVE1MSGVscGVyO1xuICAgICAgaWYgKHNldHVwKSBwYXRjaChub2RlLCBwcm90b3NbaV0pO1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfSk7XG4gIFxuICB9XG4gIFxuICBmdW5jdGlvbiBBU0FQKCkge1xuICAgIHZhciBxdWV1ZSA9IGFzYXBRdWV1ZS5zcGxpY2UoMCwgYXNhcFF1ZXVlLmxlbmd0aCk7XG4gICAgYXNhcFRpbWVyID0gMDtcbiAgICB3aGlsZSAocXVldWUubGVuZ3RoKSB7XG4gICAgICBxdWV1ZS5zaGlmdCgpLmNhbGwoXG4gICAgICAgIG51bGwsIHF1ZXVlLnNoaWZ0KClcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBsb29wQW5kVmVyaWZ5KGxpc3QsIGFjdGlvbikge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2ZXJpZnlBbmRTZXR1cEFuZEFjdGlvbihsaXN0W2ldLCBhY3Rpb24pO1xuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gbG9vcEFuZFNldHVwKGxpc3QpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdC5sZW5ndGgsIG5vZGU7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgbm9kZSA9IGxpc3RbaV07XG4gICAgICBwYXRjaChub2RlLCBwcm90b3NbZ2V0VHlwZUluZGV4KG5vZGUpXSk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBleGVjdXRlQWN0aW9uKGFjdGlvbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgaWYgKGlzVmFsaWROb2RlKG5vZGUpKSB7XG4gICAgICAgIHZlcmlmeUFuZFNldHVwQW5kQWN0aW9uKG5vZGUsIGFjdGlvbik7XG4gICAgICAgIGlmIChxdWVyeS5sZW5ndGgpIGxvb3BBbmRWZXJpZnkoXG4gICAgICAgICAgbm9kZS5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSxcbiAgICAgICAgICBhY3Rpb25cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRUeXBlSW5kZXgodGFyZ2V0KSB7XG4gICAgdmFyXG4gICAgICBpcyA9IGdldEF0dHJpYnV0ZS5jYWxsKHRhcmdldCwgJ2lzJyksXG4gICAgICBub2RlTmFtZSA9IHRhcmdldC5ub2RlTmFtZS50b1VwcGVyQ2FzZSgpLFxuICAgICAgaSA9IGluZGV4T2YuY2FsbChcbiAgICAgICAgdHlwZXMsXG4gICAgICAgIGlzID9cbiAgICAgICAgICAgIFBSRUZJWF9JUyArIGlzLnRvVXBwZXJDYXNlKCkgOlxuICAgICAgICAgICAgUFJFRklYX1RBRyArIG5vZGVOYW1lXG4gICAgICApXG4gICAgO1xuICAgIHJldHVybiBpcyAmJiAtMSA8IGkgJiYgIWlzSW5RU0Eobm9kZU5hbWUsIGlzKSA/IC0xIDogaTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gaXNJblFTQShuYW1lLCB0eXBlKSB7XG4gICAgcmV0dXJuIC0xIDwgcXVlcnkuaW5kZXhPZihuYW1lICsgJ1tpcz1cIicgKyB0eXBlICsgJ1wiXScpO1xuICB9XG4gIFxuICBmdW5jdGlvbiBvbkRPTUF0dHJNb2RpZmllZChlKSB7XG4gICAgdmFyXG4gICAgICBub2RlID0gZS5jdXJyZW50VGFyZ2V0LFxuICAgICAgYXR0ckNoYW5nZSA9IGUuYXR0ckNoYW5nZSxcbiAgICAgIGF0dHJOYW1lID0gZS5hdHRyTmFtZSxcbiAgICAgIHRhcmdldCA9IGUudGFyZ2V0LFxuICAgICAgYWRkaXRpb24gPSBlW0FERElUSU9OXSB8fCAyLFxuICAgICAgcmVtb3ZhbCA9IGVbUkVNT1ZBTF0gfHwgM1xuICAgIDtcbiAgICBpZiAobm90RnJvbUlubmVySFRNTEhlbHBlciAmJlxuICAgICAgICAoIXRhcmdldCB8fCB0YXJnZXQgPT09IG5vZGUpICYmXG4gICAgICAgIG5vZGVbQVRUUklCVVRFX0NIQU5HRURfQ0FMTEJBQ0tdICYmXG4gICAgICAgIGF0dHJOYW1lICE9PSAnc3R5bGUnICYmIChcbiAgICAgICAgICBlLnByZXZWYWx1ZSAhPT0gZS5uZXdWYWx1ZSB8fFxuICAgICAgICAgIC8vIElFOSwgSUUxMCwgYW5kIE9wZXJhIDEyIGdvdGNoYVxuICAgICAgICAgIGUubmV3VmFsdWUgPT09ICcnICYmIChcbiAgICAgICAgICAgIGF0dHJDaGFuZ2UgPT09IGFkZGl0aW9uIHx8XG4gICAgICAgICAgICBhdHRyQ2hhbmdlID09PSByZW1vdmFsXG4gICAgICAgICAgKVxuICAgICkpIHtcbiAgICAgIG5vZGVbQVRUUklCVVRFX0NIQU5HRURfQ0FMTEJBQ0tdKFxuICAgICAgICBhdHRyTmFtZSxcbiAgICAgICAgYXR0ckNoYW5nZSA9PT0gYWRkaXRpb24gPyBudWxsIDogZS5wcmV2VmFsdWUsXG4gICAgICAgIGF0dHJDaGFuZ2UgPT09IHJlbW92YWwgPyBudWxsIDogZS5uZXdWYWx1ZVxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIG9uRE9NTm9kZShhY3Rpb24pIHtcbiAgICB2YXIgZXhlY3V0b3IgPSBleGVjdXRlQWN0aW9uKGFjdGlvbik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlKSB7XG4gICAgICBhc2FwUXVldWUucHVzaChleGVjdXRvciwgZS50YXJnZXQpO1xuICAgICAgaWYgKGFzYXBUaW1lcikgY2xlYXJUaW1lb3V0KGFzYXBUaW1lcik7XG4gICAgICBhc2FwVGltZXIgPSBzZXRUaW1lb3V0KEFTQVAsIDEpO1xuICAgIH07XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIG9uUmVhZHlTdGF0ZUNoYW5nZShlKSB7XG4gICAgaWYgKGRyb3BEb21Db250ZW50TG9hZGVkKSB7XG4gICAgICBkcm9wRG9tQ29udGVudExvYWRlZCA9IGZhbHNlO1xuICAgICAgZS5jdXJyZW50VGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoRE9NX0NPTlRFTlRfTE9BREVELCBvblJlYWR5U3RhdGVDaGFuZ2UpO1xuICAgIH1cbiAgICBpZiAocXVlcnkubGVuZ3RoKSBsb29wQW5kVmVyaWZ5KFxuICAgICAgKGUudGFyZ2V0IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSxcbiAgICAgIGUuZGV0YWlsID09PSBERVRBQ0hFRCA/IERFVEFDSEVEIDogQVRUQUNIRURcbiAgICApO1xuICAgIGlmIChJRTgpIHB1cmdlKCk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHBhdGNoZWRTZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpIHtcbiAgICAvLyBqc2hpbnQgdmFsaWR0aGlzOnRydWVcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2V0QXR0cmlidXRlLmNhbGwoc2VsZiwgbmFtZSwgdmFsdWUpO1xuICAgIG9uU3VidHJlZU1vZGlmaWVkLmNhbGwoc2VsZiwge3RhcmdldDogc2VsZn0pO1xuICB9XG4gIFxuICBmdW5jdGlvbiBzZXR1cE5vZGUobm9kZSwgcHJvdG8pIHtcbiAgICBzZXRQcm90b3R5cGUobm9kZSwgcHJvdG8pO1xuICAgIGlmIChvYnNlcnZlcikge1xuICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCBhdHRyaWJ1dGVzT2JzZXJ2ZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZG9lc05vdFN1cHBvcnRET01BdHRyTW9kaWZpZWQpIHtcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUgPSBwYXRjaGVkU2V0QXR0cmlidXRlO1xuICAgICAgICBub2RlW0VYUEFORE9fVUlEXSA9IGdldEF0dHJpYnV0ZXNNaXJyb3Iobm9kZSk7XG4gICAgICAgIG5vZGVbQUREX0VWRU5UX0xJU1RFTkVSXShET01fU1VCVFJFRV9NT0RJRklFRCwgb25TdWJ0cmVlTW9kaWZpZWQpO1xuICAgICAgfVxuICAgICAgbm9kZVtBRERfRVZFTlRfTElTVEVORVJdKERPTV9BVFRSX01PRElGSUVELCBvbkRPTUF0dHJNb2RpZmllZCk7XG4gICAgfVxuICAgIGlmIChub2RlW0NSRUFURURfQ0FMTEJBQ0tdICYmIG5vdEZyb21Jbm5lckhUTUxIZWxwZXIpIHtcbiAgICAgIG5vZGUuY3JlYXRlZCA9IHRydWU7XG4gICAgICBub2RlW0NSRUFURURfQ0FMTEJBQ0tdKCk7XG4gICAgICBub2RlLmNyZWF0ZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHB1cmdlKCkge1xuICAgIGZvciAodmFyXG4gICAgICBub2RlLFxuICAgICAgaSA9IDAsXG4gICAgICBsZW5ndGggPSB0YXJnZXRzLmxlbmd0aDtcbiAgICAgIGkgPCBsZW5ndGg7IGkrK1xuICAgICkge1xuICAgICAgbm9kZSA9IHRhcmdldHNbaV07XG4gICAgICBpZiAoIWRvY3VtZW50RWxlbWVudC5jb250YWlucyhub2RlKSkge1xuICAgICAgICBsZW5ndGgtLTtcbiAgICAgICAgdGFyZ2V0cy5zcGxpY2UoaS0tLCAxKTtcbiAgICAgICAgdmVyaWZ5QW5kU2V0dXBBbmRBY3Rpb24obm9kZSwgREVUQUNIRUQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gdGhyb3dUeXBlRXJyb3IodHlwZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignQSAnICsgdHlwZSArICcgdHlwZSBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQnKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gdmVyaWZ5QW5kU2V0dXBBbmRBY3Rpb24obm9kZSwgYWN0aW9uKSB7XG4gICAgdmFyXG4gICAgICBmbixcbiAgICAgIGkgPSBnZXRUeXBlSW5kZXgobm9kZSlcbiAgICA7XG4gICAgaWYgKC0xIDwgaSkge1xuICAgICAgcGF0Y2hJZk5vdEFscmVhZHkobm9kZSwgcHJvdG9zW2ldKTtcbiAgICAgIGkgPSAwO1xuICAgICAgaWYgKGFjdGlvbiA9PT0gQVRUQUNIRUQgJiYgIW5vZGVbQVRUQUNIRURdKSB7XG4gICAgICAgIG5vZGVbREVUQUNIRURdID0gZmFsc2U7XG4gICAgICAgIG5vZGVbQVRUQUNIRURdID0gdHJ1ZTtcbiAgICAgICAgaSA9IDE7XG4gICAgICAgIGlmIChJRTggJiYgaW5kZXhPZi5jYWxsKHRhcmdldHMsIG5vZGUpIDwgMCkge1xuICAgICAgICAgIHRhcmdldHMucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IERFVEFDSEVEICYmICFub2RlW0RFVEFDSEVEXSkge1xuICAgICAgICBub2RlW0FUVEFDSEVEXSA9IGZhbHNlO1xuICAgICAgICBub2RlW0RFVEFDSEVEXSA9IHRydWU7XG4gICAgICAgIGkgPSAxO1xuICAgICAgfVxuICAgICAgaWYgKGkgJiYgKGZuID0gbm9kZVthY3Rpb24gKyBDQUxMQkFDS10pKSBmbi5jYWxsKG5vZGUpO1xuICAgIH1cbiAgfVxuICBcbiAgXG4gIFxuICAvLyBWMSBpbiBkYSBIb3VzZSFcbiAgZnVuY3Rpb24gQ3VzdG9tRWxlbWVudFJlZ2lzdHJ5KCkge31cbiAgXG4gIEN1c3RvbUVsZW1lbnRSZWdpc3RyeS5wcm90b3R5cGUgPSB7XG4gICAgY29uc3RydWN0b3I6IEN1c3RvbUVsZW1lbnRSZWdpc3RyeSxcbiAgICAvLyBhIHdvcmthcm91bmQgZm9yIHRoZSBzdHViYm9ybiBXZWJLaXRcbiAgICBkZWZpbmU6IHVzYWJsZUN1c3RvbUVsZW1lbnRzID9cbiAgICAgIGZ1bmN0aW9uIChuYW1lLCBDbGFzcywgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgIENFUkRlZmluZShuYW1lLCBDbGFzcywgb3B0aW9ucyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIE5BTUUgPSBuYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgY29uc3RydWN0b3JzW05BTUVdID0ge1xuICAgICAgICAgICAgY29uc3RydWN0b3I6IENsYXNzLFxuICAgICAgICAgICAgY3JlYXRlOiBbTkFNRV1cbiAgICAgICAgICB9O1xuICAgICAgICAgIG5vZGVOYW1lcy5zZXQoQ2xhc3MsIE5BTUUpO1xuICAgICAgICAgIGN1c3RvbUVsZW1lbnRzLmRlZmluZShuYW1lLCBDbGFzcyk7XG4gICAgICAgIH1cbiAgICAgIH0gOlxuICAgICAgQ0VSRGVmaW5lLFxuICAgIGdldDogdXNhYmxlQ3VzdG9tRWxlbWVudHMgP1xuICAgICAgZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGN1c3RvbUVsZW1lbnRzLmdldChuYW1lKSB8fCBnZXQobmFtZSk7XG4gICAgICB9IDpcbiAgICAgIGdldCxcbiAgICB3aGVuRGVmaW5lZDogdXNhYmxlQ3VzdG9tRWxlbWVudHMgP1xuICAgICAgZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmFjZShbXG4gICAgICAgICAgY3VzdG9tRWxlbWVudHMud2hlbkRlZmluZWQobmFtZSksXG4gICAgICAgICAgd2hlbkRlZmluZWQobmFtZSlcbiAgICAgICAgXSk7XG4gICAgICB9IDpcbiAgICAgIHdoZW5EZWZpbmVkXG4gIH07XG4gIFxuICBmdW5jdGlvbiBDRVJEZWZpbmUobmFtZSwgQ2xhc3MsIG9wdGlvbnMpIHtcbiAgICB2YXJcbiAgICAgIGlzID0gb3B0aW9ucyAmJiBvcHRpb25zW0VYVEVORFNdIHx8ICcnLFxuICAgICAgQ1Byb3RvID0gQ2xhc3MucHJvdG90eXBlLFxuICAgICAgcHJvdG8gPSBjcmVhdGUoQ1Byb3RvKSxcbiAgICAgIGF0dHJpYnV0ZXMgPSBDbGFzcy5vYnNlcnZlZEF0dHJpYnV0ZXMgfHwgZW1wdHksXG4gICAgICBkZWZpbml0aW9uID0ge3Byb3RvdHlwZTogcHJvdG99XG4gICAgO1xuICAgIC8vIFRPRE86IGlzIHRoaXMgbmVlZGVkIGF0IGFsbCBzaW5jZSBpdCdzIGluaGVyaXRlZD9cbiAgICAvLyBkZWZpbmVQcm9wZXJ0eShwcm90bywgJ2NvbnN0cnVjdG9yJywge3ZhbHVlOiBDbGFzc30pO1xuICAgIHNhZmVQcm9wZXJ0eShwcm90bywgQ1JFQVRFRF9DQUxMQkFDSywge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlmIChqdXN0Q3JlYXRlZCkganVzdENyZWF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICBlbHNlIGlmICghdGhpc1tEUkVDRVYxXSkge1xuICAgICAgICAgICAgdGhpc1tEUkVDRVYxXSA9IHRydWU7XG4gICAgICAgICAgICBuZXcgQ2xhc3ModGhpcyk7XG4gICAgICAgICAgICBpZiAoQ1Byb3RvW0NSRUFURURfQ0FMTEJBQ0tdKVxuICAgICAgICAgICAgICBDUHJvdG9bQ1JFQVRFRF9DQUxMQkFDS10uY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBpbmZvID0gY29uc3RydWN0b3JzW25vZGVOYW1lcy5nZXQoQ2xhc3MpXTtcbiAgICAgICAgICAgIGlmICghdXNhYmxlQ3VzdG9tRWxlbWVudHMgfHwgaW5mby5jcmVhdGUubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICBub3RpZnlBdHRyaWJ1dGVzKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBzYWZlUHJvcGVydHkocHJvdG8sIEFUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLLCB7XG4gICAgICB2YWx1ZTogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgaWYgKC0xIDwgaW5kZXhPZi5jYWxsKGF0dHJpYnV0ZXMsIG5hbWUpKVxuICAgICAgICAgIENQcm90b1tBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDS10uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoQ1Byb3RvW0NPTk5FQ1RFRF9DQUxMQkFDS10pIHtcbiAgICAgIHNhZmVQcm9wZXJ0eShwcm90bywgQVRUQUNIRURfQ0FMTEJBQ0ssIHtcbiAgICAgICAgdmFsdWU6IENQcm90b1tDT05ORUNURURfQ0FMTEJBQ0tdXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKENQcm90b1tESVNDT05ORUNURURfQ0FMTEJBQ0tdKSB7XG4gICAgICBzYWZlUHJvcGVydHkocHJvdG8sIERFVEFDSEVEX0NBTExCQUNLLCB7XG4gICAgICAgIHZhbHVlOiBDUHJvdG9bRElTQ09OTkVDVEVEX0NBTExCQUNLXVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChpcykgZGVmaW5pdGlvbltFWFRFTkRTXSA9IGlzO1xuICAgIG5hbWUgPSBuYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgY29uc3RydWN0b3JzW25hbWVdID0ge1xuICAgICAgY29uc3RydWN0b3I6IENsYXNzLFxuICAgICAgY3JlYXRlOiBpcyA/IFtpcywgc2Vjb25kQXJndW1lbnQobmFtZSldIDogW25hbWVdXG4gICAgfTtcbiAgICBub2RlTmFtZXMuc2V0KENsYXNzLCBuYW1lKTtcbiAgICBkb2N1bWVudFtSRUdJU1RFUl9FTEVNRU5UXShuYW1lLnRvTG93ZXJDYXNlKCksIGRlZmluaXRpb24pO1xuICAgIHdoZW5EZWZpbmVkKG5hbWUpO1xuICAgIHdhaXRpbmdMaXN0W25hbWVdLnIoKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gZ2V0KG5hbWUpIHtcbiAgICB2YXIgaW5mbyA9IGNvbnN0cnVjdG9yc1tuYW1lLnRvVXBwZXJDYXNlKCldO1xuICAgIHJldHVybiBpbmZvICYmIGluZm8uY29uc3RydWN0b3I7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGdldElzKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnID9cbiAgICAgICAgb3B0aW9ucyA6IChvcHRpb25zICYmIG9wdGlvbnMuaXMgfHwgJycpO1xuICB9XG4gIFxuICBmdW5jdGlvbiBub3RpZnlBdHRyaWJ1dGVzKHNlbGYpIHtcbiAgICB2YXJcbiAgICAgIGNhbGxiYWNrID0gc2VsZltBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDS10sXG4gICAgICBhdHRyaWJ1dGVzID0gY2FsbGJhY2sgPyBzZWxmLmF0dHJpYnV0ZXMgOiBlbXB0eSxcbiAgICAgIGkgPSBhdHRyaWJ1dGVzLmxlbmd0aCxcbiAgICAgIGF0dHJpYnV0ZVxuICAgIDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBhdHRyaWJ1dGUgPSAgYXR0cmlidXRlc1tpXTsgLy8gfHwgYXR0cmlidXRlcy5pdGVtKGkpO1xuICAgICAgY2FsbGJhY2suY2FsbChcbiAgICAgICAgc2VsZixcbiAgICAgICAgYXR0cmlidXRlLm5hbWUgfHwgYXR0cmlidXRlLm5vZGVOYW1lLFxuICAgICAgICBudWxsLFxuICAgICAgICBhdHRyaWJ1dGUudmFsdWUgfHwgYXR0cmlidXRlLm5vZGVWYWx1ZVxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHdoZW5EZWZpbmVkKG5hbWUpIHtcbiAgICBuYW1lID0gbmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgIGlmICghKG5hbWUgaW4gd2FpdGluZ0xpc3QpKSB7XG4gICAgICB3YWl0aW5nTGlzdFtuYW1lXSA9IHt9O1xuICAgICAgd2FpdGluZ0xpc3RbbmFtZV0ucCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgIHdhaXRpbmdMaXN0W25hbWVdLnIgPSByZXNvbHZlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB3YWl0aW5nTGlzdFtuYW1lXS5wO1xuICB9XG4gIFxuICBmdW5jdGlvbiBwb2x5ZmlsbFYxKCkge1xuICAgIGlmIChjdXN0b21FbGVtZW50cykgZGVsZXRlIHdpbmRvdy5jdXN0b21FbGVtZW50cztcbiAgICBkZWZpbmVQcm9wZXJ0eSh3aW5kb3csICdjdXN0b21FbGVtZW50cycsIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBuZXcgQ3VzdG9tRWxlbWVudFJlZ2lzdHJ5KClcbiAgICB9KTtcbiAgICBkZWZpbmVQcm9wZXJ0eSh3aW5kb3csICdDdXN0b21FbGVtZW50UmVnaXN0cnknLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogQ3VzdG9tRWxlbWVudFJlZ2lzdHJ5XG4gICAgfSk7XG4gICAgZm9yICh2YXJcbiAgICAgIHBhdGNoQ2xhc3MgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICB2YXIgQ2xhc3MgPSB3aW5kb3dbbmFtZV07XG4gICAgICAgIGlmIChDbGFzcykge1xuICAgICAgICAgIHdpbmRvd1tuYW1lXSA9IGZ1bmN0aW9uIEN1c3RvbUVsZW1lbnRzVjEoc2VsZikge1xuICAgICAgICAgICAgdmFyIGluZm8sIGlzTmF0aXZlO1xuICAgICAgICAgICAgaWYgKCFzZWxmKSBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGlmICghc2VsZltEUkVDRVYxXSkge1xuICAgICAgICAgICAgICBqdXN0Q3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgIGluZm8gPSBjb25zdHJ1Y3RvcnNbbm9kZU5hbWVzLmdldChzZWxmLmNvbnN0cnVjdG9yKV07XG4gICAgICAgICAgICAgIGlzTmF0aXZlID0gdXNhYmxlQ3VzdG9tRWxlbWVudHMgJiYgaW5mby5jcmVhdGUubGVuZ3RoID09PSAxO1xuICAgICAgICAgICAgICBzZWxmID0gaXNOYXRpdmUgP1xuICAgICAgICAgICAgICAgIFJlZmxlY3QuY29uc3RydWN0KENsYXNzLCBlbXB0eSwgaW5mby5jb25zdHJ1Y3RvcikgOlxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQuYXBwbHkoZG9jdW1lbnQsIGluZm8uY3JlYXRlKTtcbiAgICAgICAgICAgICAgc2VsZltEUkVDRVYxXSA9IHRydWU7XG4gICAgICAgICAgICAgIGp1c3RDcmVhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgIGlmICghaXNOYXRpdmUpIG5vdGlmeUF0dHJpYnV0ZXMoc2VsZik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgICB9O1xuICAgICAgICAgIHdpbmRvd1tuYW1lXS5wcm90b3R5cGUgPSBDbGFzcy5wcm90b3R5cGU7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIENsYXNzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IHdpbmRvd1tuYW1lXTtcbiAgICAgICAgICB9IGNhdGNoKFdlYktpdCkge1xuICAgICAgICAgICAgZml4R2V0Q2xhc3MgPSB0cnVlO1xuICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkoQ2xhc3MsIERSRUNFVjEsIHt2YWx1ZTogd2luZG93W25hbWVdfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgQ2xhc3NlcyA9IGh0bWxDbGFzcy5nZXQoL15IVE1MW0EtWl0qW2Etel0vKSxcbiAgICAgIGkgPSBDbGFzc2VzLmxlbmd0aDtcbiAgICAgIGktLTtcbiAgICAgIHBhdGNoQ2xhc3MoQ2xhc3Nlc1tpXSlcbiAgICApIHt9XG4gICAgKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbiAobmFtZSwgb3B0aW9ucykge1xuICAgICAgdmFyIGlzID0gZ2V0SXMob3B0aW9ucyk7XG4gICAgICByZXR1cm4gaXMgP1xuICAgICAgICBwYXRjaGVkQ3JlYXRlRWxlbWVudC5jYWxsKHRoaXMsIG5hbWUsIHNlY29uZEFyZ3VtZW50KGlzKSkgOlxuICAgICAgICBwYXRjaGVkQ3JlYXRlRWxlbWVudC5jYWxsKHRoaXMsIG5hbWUpO1xuICAgIH0pO1xuICAgIGlmICghVjApIHtcbiAgICAgIGp1c3RTZXR1cCA9IHRydWU7XG4gICAgICBkb2N1bWVudFtSRUdJU1RFUl9FTEVNRU5UXSgnJyk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBpZiBjdXN0b21FbGVtZW50cyBpcyBub3QgdGhlcmUgYXQgYWxsXG4gIGlmICghY3VzdG9tRWxlbWVudHMgfHwgcG9seWZpbGwgPT09ICdmb3JjZScpIHBvbHlmaWxsVjEoKTtcbiAgZWxzZSB7XG4gICAgLy8gaWYgYXZhaWxhYmxlIHRlc3QgZXh0ZW5kcyB3b3JrIGFzIGV4cGVjdGVkXG4gICAgdHJ5IHtcbiAgICAgIChmdW5jdGlvbiAoRFJFLCBvcHRpb25zLCBuYW1lKSB7XG4gICAgICAgIG9wdGlvbnNbRVhURU5EU10gPSAnYSc7XG4gICAgICAgIERSRS5wcm90b3R5cGUgPSBjcmVhdGUoSFRNTEFuY2hvckVsZW1lbnQucHJvdG90eXBlKTtcbiAgICAgICAgRFJFLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERSRTtcbiAgICAgICAgd2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShuYW1lLCBEUkUsIG9wdGlvbnMpO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgZ2V0QXR0cmlidXRlLmNhbGwoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScsIHtpczogbmFtZX0pLCAnaXMnKSAhPT0gbmFtZSB8fFxuICAgICAgICAgICh1c2FibGVDdXN0b21FbGVtZW50cyAmJiBnZXRBdHRyaWJ1dGUuY2FsbChuZXcgRFJFKCksICdpcycpICE9PSBuYW1lKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aHJvdyBvcHRpb25zO1xuICAgICAgICB9XG4gICAgICB9KFxuICAgICAgICBmdW5jdGlvbiBEUkUoKSB7XG4gICAgICAgICAgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KEhUTUxBbmNob3JFbGVtZW50LCBbXSwgRFJFKTtcbiAgICAgICAgfSxcbiAgICAgICAge30sXG4gICAgICAgICdkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50LWEnXG4gICAgICApKTtcbiAgICB9IGNhdGNoKG9fTykge1xuICAgICAgLy8gb3IgZm9yY2UgdGhlIHBvbHlmaWxsIGlmIG5vdFxuICAgICAgLy8gYW5kIGtlZXAgaW50ZXJuYWwgb3JpZ2luYWwgcmVmZXJlbmNlXG4gICAgICBwb2x5ZmlsbFYxKCk7XG4gICAgfVxuICB9XG4gIFxuICB0cnkge1xuICAgIGNyZWF0ZUVsZW1lbnQuY2FsbChkb2N1bWVudCwgJ2EnLCAnYScpO1xuICB9IGNhdGNoKEZpcmVGb3gpIHtcbiAgICBzZWNvbmRBcmd1bWVudCA9IGZ1bmN0aW9uIChpcykge1xuICAgICAgcmV0dXJuIHtpczogaXMudG9Mb3dlckNhc2UoKX07XG4gICAgfTtcbiAgfVxuICBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpbnN0YWxsQ3VzdG9tRWxlbWVudHM7XG5pbnN0YWxsQ3VzdG9tRWxlbWVudHMoZ2xvYmFsKTtcbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSwgbm9kZTp0cnVlKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlbGVnYXRlO1xuXG4vKipcbiAqIERPTSBldmVudCBkZWxlZ2F0b3JcbiAqXG4gKiBUaGUgZGVsZWdhdG9yIHdpbGwgbGlzdGVuXG4gKiBmb3IgZXZlbnRzIHRoYXQgYnViYmxlIHVwXG4gKiB0byB0aGUgcm9vdCBub2RlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtOb2RlfHN0cmluZ30gW3Jvb3RdIFRoZSByb290IG5vZGUgb3IgYSBzZWxlY3RvciBzdHJpbmcgbWF0Y2hpbmcgdGhlIHJvb3Qgbm9kZVxuICovXG5mdW5jdGlvbiBEZWxlZ2F0ZShyb290KSB7XG5cbiAgLyoqXG4gICAqIE1haW50YWluIGEgbWFwIG9mIGxpc3RlbmVyXG4gICAqIGxpc3RzLCBrZXllZCBieSBldmVudCBuYW1lLlxuICAgKlxuICAgKiBAdHlwZSBPYmplY3RcbiAgICovXG4gIHRoaXMubGlzdGVuZXJNYXAgPSBbe30sIHt9XTtcbiAgaWYgKHJvb3QpIHtcbiAgICB0aGlzLnJvb3Qocm9vdCk7XG4gIH1cblxuICAvKiogQHR5cGUgZnVuY3Rpb24oKSAqL1xuICB0aGlzLmhhbmRsZSA9IERlbGVnYXRlLnByb3RvdHlwZS5oYW5kbGUuYmluZCh0aGlzKTtcbn1cblxuLyoqXG4gKiBTdGFydCBsaXN0ZW5pbmcgZm9yIGV2ZW50c1xuICogb24gdGhlIHByb3ZpZGVkIERPTSBlbGVtZW50XG4gKlxuICogQHBhcmFtICB7Tm9kZXxzdHJpbmd9IFtyb290XSBUaGUgcm9vdCBub2RlIG9yIGEgc2VsZWN0b3Igc3RyaW5nIG1hdGNoaW5nIHRoZSByb290IG5vZGVcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5yb290ID0gZnVuY3Rpb24ocm9vdCkge1xuICB2YXIgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwO1xuICB2YXIgZXZlbnRUeXBlO1xuXG4gIC8vIFJlbW92ZSBtYXN0ZXIgZXZlbnQgbGlzdGVuZXJzXG4gIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMV0pIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcFsxXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMF0pIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcFswXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgbm8gcm9vdCBvciByb290IGlzIG5vdFxuICAvLyBhIGRvbSBub2RlLCB0aGVuIHJlbW92ZSBpbnRlcm5hbFxuICAvLyByb290IHJlZmVyZW5jZSBhbmQgZXhpdCBoZXJlXG4gIGlmICghcm9vdCB8fCAhcm9vdC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgaWYgKHRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnJvb3RFbGVtZW50O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcm9vdCBub2RlIGF0IHdoaWNoXG4gICAqIGxpc3RlbmVycyBhcmUgYXR0YWNoZWQuXG4gICAqXG4gICAqIEB0eXBlIE5vZGVcbiAgICovXG4gIHRoaXMucm9vdEVsZW1lbnQgPSByb290O1xuXG4gIC8vIFNldCB1cCBtYXN0ZXIgZXZlbnQgbGlzdGVuZXJzXG4gIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzFdKSB7XG4gICAgaWYgKGxpc3RlbmVyTWFwWzFdLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB0cnVlKTtcbiAgICB9XG4gIH1cbiAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMF0pIHtcbiAgICBpZiAobGlzdGVuZXJNYXBbMF0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgdGhpcy5yb290RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZVxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuY2FwdHVyZUZvclR5cGUgPSBmdW5jdGlvbihldmVudFR5cGUpIHtcbiAgcmV0dXJuIFsnYmx1cicsICdlcnJvcicsICdmb2N1cycsICdsb2FkJywgJ3Jlc2l6ZScsICdzY3JvbGwnXS5pbmRleE9mKGV2ZW50VHlwZSkgIT09IC0xO1xufTtcblxuLyoqXG4gKiBBdHRhY2ggYSBoYW5kbGVyIHRvIG9uZVxuICogZXZlbnQgZm9yIGFsbCBlbGVtZW50c1xuICogdGhhdCBtYXRjaCB0aGUgc2VsZWN0b3IsXG4gKiBub3cgb3IgaW4gdGhlIGZ1dHVyZVxuICpcbiAqIFRoZSBoYW5kbGVyIGZ1bmN0aW9uIHJlY2VpdmVzXG4gKiB0aHJlZSBhcmd1bWVudHM6IHRoZSBET00gZXZlbnRcbiAqIG9iamVjdCwgdGhlIG5vZGUgdGhhdCBtYXRjaGVkXG4gKiB0aGUgc2VsZWN0b3Igd2hpbGUgdGhlIGV2ZW50XG4gKiB3YXMgYnViYmxpbmcgYW5kIGEgcmVmZXJlbmNlXG4gKiB0byBpdHNlbGYuIFdpdGhpbiB0aGUgaGFuZGxlcixcbiAqICd0aGlzJyBpcyBlcXVhbCB0byB0aGUgc2Vjb25kXG4gKiBhcmd1bWVudC5cbiAqXG4gKiBUaGUgbm9kZSB0aGF0IGFjdHVhbGx5IHJlY2VpdmVkXG4gKiB0aGUgZXZlbnQgY2FuIGJlIGFjY2Vzc2VkIHZpYVxuICogJ2V2ZW50LnRhcmdldCcuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSBMaXN0ZW4gZm9yIHRoZXNlIGV2ZW50c1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzZWxlY3RvciBPbmx5IGhhbmRsZSBldmVudHMgb24gZWxlbWVudHMgbWF0Y2hpbmcgdGhpcyBzZWxlY3RvciwgaWYgdW5kZWZpbmVkIG1hdGNoIHJvb3QgZWxlbWVudFxuICogQHBhcmFtIHtmdW5jdGlvbigpfSBoYW5kbGVyIEhhbmRsZXIgZnVuY3Rpb24gLSBldmVudCBkYXRhIHBhc3NlZCBoZXJlIHdpbGwgYmUgaW4gZXZlbnQuZGF0YVxuICogQHBhcmFtIHtPYmplY3R9IFtldmVudERhdGFdIERhdGEgdG8gcGFzcyBpbiBldmVudC5kYXRhXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCB1c2VDYXB0dXJlKSB7XG4gIHZhciByb290LCBsaXN0ZW5lck1hcCwgbWF0Y2hlciwgbWF0Y2hlclBhcmFtO1xuXG4gIGlmICghZXZlbnRUeXBlKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBldmVudCB0eXBlOiAnICsgZXZlbnRUeXBlKTtcbiAgfVxuXG4gIC8vIGhhbmRsZXIgY2FuIGJlIHBhc3NlZCBhc1xuICAvLyB0aGUgc2Vjb25kIG9yIHRoaXJkIGFyZ3VtZW50XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICB1c2VDYXB0dXJlID0gaGFuZGxlcjtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG5cbiAgLy8gRmFsbGJhY2sgdG8gc2Vuc2libGUgZGVmYXVsdHNcbiAgLy8gaWYgdXNlQ2FwdHVyZSBub3Qgc2V0XG4gIGlmICh1c2VDYXB0dXJlID09PSB1bmRlZmluZWQpIHtcbiAgICB1c2VDYXB0dXJlID0gdGhpcy5jYXB0dXJlRm9yVHlwZShldmVudFR5cGUpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSGFuZGxlciBtdXN0IGJlIGEgdHlwZSBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgcm9vdCA9IHRoaXMucm9vdEVsZW1lbnQ7XG4gIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcFt1c2VDYXB0dXJlID8gMSA6IDBdO1xuXG4gIC8vIEFkZCBtYXN0ZXIgaGFuZGxlciBmb3IgdHlwZSBpZiBub3QgY3JlYXRlZCB5ZXRcbiAgaWYgKCFsaXN0ZW5lck1hcFtldmVudFR5cGVdKSB7XG4gICAgaWYgKHJvb3QpIHtcbiAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gICAgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXSA9IFtdO1xuICB9XG5cbiAgaWYgKCFzZWxlY3Rvcikge1xuICAgIG1hdGNoZXJQYXJhbSA9IG51bGw7XG5cbiAgICAvLyBDT01QTEVYIC0gbWF0Y2hlc1Jvb3QgbmVlZHMgdG8gaGF2ZSBhY2Nlc3MgdG9cbiAgICAvLyB0aGlzLnJvb3RFbGVtZW50LCBzbyBiaW5kIHRoZSBmdW5jdGlvbiB0byB0aGlzLlxuICAgIG1hdGNoZXIgPSBtYXRjaGVzUm9vdC5iaW5kKHRoaXMpO1xuXG4gIC8vIENvbXBpbGUgYSBtYXRjaGVyIGZvciB0aGUgZ2l2ZW4gc2VsZWN0b3JcbiAgfSBlbHNlIGlmICgvXlthLXpdKyQvaS50ZXN0KHNlbGVjdG9yKSkge1xuICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yO1xuICAgIG1hdGNoZXIgPSBtYXRjaGVzVGFnO1xuICB9IGVsc2UgaWYgKC9eI1thLXowLTlcXC1fXSskL2kudGVzdChzZWxlY3RvcikpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3Rvci5zbGljZSgxKTtcbiAgICBtYXRjaGVyID0gbWF0Y2hlc0lkO1xuICB9IGVsc2Uge1xuICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yO1xuICAgIG1hdGNoZXIgPSBtYXRjaGVzO1xuICB9XG5cbiAgLy8gQWRkIHRvIHRoZSBsaXN0IG9mIGxpc3RlbmVyc1xuICBsaXN0ZW5lck1hcFtldmVudFR5cGVdLnB1c2goe1xuICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgIG1hdGNoZXI6IG1hdGNoZXIsXG4gICAgbWF0Y2hlclBhcmFtOiBtYXRjaGVyUGFyYW1cbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbiBldmVudCBoYW5kbGVyXG4gKiBmb3IgZWxlbWVudHMgdGhhdCBtYXRjaFxuICogdGhlIHNlbGVjdG9yLCBmb3JldmVyXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IFtldmVudFR5cGVdIFJlbW92ZSBoYW5kbGVycyBmb3IgZXZlbnRzIG1hdGNoaW5nIHRoaXMgdHlwZSwgY29uc2lkZXJpbmcgdGhlIG90aGVyIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbc2VsZWN0b3JdIElmIHRoaXMgcGFyYW1ldGVyIGlzIG9taXR0ZWQsIG9ubHkgaGFuZGxlcnMgd2hpY2ggbWF0Y2ggdGhlIG90aGVyIHR3byB3aWxsIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKX0gW2hhbmRsZXJdIElmIHRoaXMgcGFyYW1ldGVyIGlzIG9taXR0ZWQsIG9ubHkgaGFuZGxlcnMgd2hpY2ggbWF0Y2ggdGhlIHByZXZpb3VzIHR3byB3aWxsIGJlIHJlbW92ZWRcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCB1c2VDYXB0dXJlKSB7XG4gIHZhciBpLCBsaXN0ZW5lciwgbGlzdGVuZXJNYXAsIGxpc3RlbmVyTGlzdCwgc2luZ2xlRXZlbnRUeXBlO1xuXG4gIC8vIEhhbmRsZXIgY2FuIGJlIHBhc3NlZCBhc1xuICAvLyB0aGUgc2Vjb25kIG9yIHRoaXJkIGFyZ3VtZW50XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICB1c2VDYXB0dXJlID0gaGFuZGxlcjtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG5cbiAgLy8gSWYgdXNlQ2FwdHVyZSBub3Qgc2V0LCByZW1vdmVcbiAgLy8gYWxsIGV2ZW50IGxpc3RlbmVyc1xuICBpZiAodXNlQ2FwdHVyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5vZmYoZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdHJ1ZSk7XG4gICAgdGhpcy5vZmYoZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgZmFsc2UpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwW3VzZUNhcHR1cmUgPyAxIDogMF07XG4gIGlmICghZXZlbnRUeXBlKSB7XG4gICAgZm9yIChzaW5nbGVFdmVudFR5cGUgaW4gbGlzdGVuZXJNYXApIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcC5oYXNPd25Qcm9wZXJ0eShzaW5nbGVFdmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMub2ZmKHNpbmdsZUV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJMaXN0ID0gbGlzdGVuZXJNYXBbZXZlbnRUeXBlXTtcbiAgaWYgKCFsaXN0ZW5lckxpc3QgfHwgIWxpc3RlbmVyTGlzdC5sZW5ndGgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFJlbW92ZSBvbmx5IHBhcmFtZXRlciBtYXRjaGVzXG4gIC8vIGlmIHNwZWNpZmllZFxuICBmb3IgKGkgPSBsaXN0ZW5lckxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBsaXN0ZW5lciA9IGxpc3RlbmVyTGlzdFtpXTtcblxuICAgIGlmICgoIXNlbGVjdG9yIHx8IHNlbGVjdG9yID09PSBsaXN0ZW5lci5zZWxlY3RvcikgJiYgKCFoYW5kbGVyIHx8IGhhbmRsZXIgPT09IGxpc3RlbmVyLmhhbmRsZXIpKSB7XG4gICAgICBsaXN0ZW5lckxpc3Quc3BsaWNlKGksIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFsbCBsaXN0ZW5lcnMgcmVtb3ZlZFxuICBpZiAoIWxpc3RlbmVyTGlzdC5sZW5ndGgpIHtcbiAgICBkZWxldGUgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXTtcblxuICAgIC8vIFJlbW92ZSB0aGUgbWFpbiBoYW5kbGVyXG4gICAgaWYgKHRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqXG4gKiBIYW5kbGUgYW4gYXJiaXRyYXJ5IGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5oYW5kbGUgPSBmdW5jdGlvbihldmVudCkge1xuICB2YXIgaSwgbCwgdHlwZSA9IGV2ZW50LnR5cGUsIHJvb3QsIHBoYXNlLCBsaXN0ZW5lciwgcmV0dXJuZWQsIGxpc3RlbmVyTGlzdCA9IFtdLCB0YXJnZXQsIC8qKiBAY29uc3QgKi8gRVZFTlRJR05PUkUgPSAnZnRMYWJzRGVsZWdhdGVJZ25vcmUnO1xuXG4gIGlmIChldmVudFtFVkVOVElHTk9SRV0gPT09IHRydWUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG5cbiAgLy8gSGFyZGNvZGUgdmFsdWUgb2YgTm9kZS5URVhUX05PREVcbiAgLy8gYXMgbm90IGRlZmluZWQgaW4gSUU4XG4gIGlmICh0YXJnZXQubm9kZVR5cGUgPT09IDMpIHtcbiAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuXG4gIHBoYXNlID0gZXZlbnQuZXZlbnRQaGFzZSB8fCAoIGV2ZW50LnRhcmdldCAhPT0gZXZlbnQuY3VycmVudFRhcmdldCA/IDMgOiAyICk7XG4gIFxuICBzd2l0Y2ggKHBoYXNlKSB7XG4gICAgY2FzZSAxOiAvL0V2ZW50LkNBUFRVUklOR19QSEFTRTpcbiAgICAgIGxpc3RlbmVyTGlzdCA9IHRoaXMubGlzdGVuZXJNYXBbMV1bdHlwZV07XG4gICAgYnJlYWs7XG4gICAgY2FzZSAyOiAvL0V2ZW50LkFUX1RBUkdFVDpcbiAgICAgIGlmICh0aGlzLmxpc3RlbmVyTWFwWzBdICYmIHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV0pIGxpc3RlbmVyTGlzdCA9IGxpc3RlbmVyTGlzdC5jb25jYXQodGhpcy5saXN0ZW5lck1hcFswXVt0eXBlXSk7XG4gICAgICBpZiAodGhpcy5saXN0ZW5lck1hcFsxXSAmJiB0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdKSBsaXN0ZW5lckxpc3QgPSBsaXN0ZW5lckxpc3QuY29uY2F0KHRoaXMubGlzdGVuZXJNYXBbMV1bdHlwZV0pO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMzogLy9FdmVudC5CVUJCTElOR19QSEFTRTpcbiAgICAgIGxpc3RlbmVyTGlzdCA9IHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV07XG4gICAgYnJlYWs7XG4gIH1cblxuICAvLyBOZWVkIHRvIGNvbnRpbnVvdXNseSBjaGVja1xuICAvLyB0aGF0IHRoZSBzcGVjaWZpYyBsaXN0IGlzXG4gIC8vIHN0aWxsIHBvcHVsYXRlZCBpbiBjYXNlIG9uZVxuICAvLyBvZiB0aGUgY2FsbGJhY2tzIGFjdHVhbGx5XG4gIC8vIGNhdXNlcyB0aGUgbGlzdCB0byBiZSBkZXN0cm95ZWQuXG4gIGwgPSBsaXN0ZW5lckxpc3QubGVuZ3RoO1xuICB3aGlsZSAodGFyZ2V0ICYmIGwpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICBsaXN0ZW5lciA9IGxpc3RlbmVyTGlzdFtpXTtcblxuICAgICAgLy8gQmFpbCBmcm9tIHRoaXMgbG9vcCBpZlxuICAgICAgLy8gdGhlIGxlbmd0aCBjaGFuZ2VkIGFuZFxuICAgICAgLy8gbm8gbW9yZSBsaXN0ZW5lcnMgYXJlXG4gICAgICAvLyBkZWZpbmVkIGJldHdlZW4gaSBhbmQgbC5cbiAgICAgIGlmICghbGlzdGVuZXIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGZvciBtYXRjaCBhbmQgZmlyZVxuICAgICAgLy8gdGhlIGV2ZW50IGlmIHRoZXJlJ3Mgb25lXG4gICAgICAvL1xuICAgICAgLy8gVE9ETzpNQ0c6MjAxMjAxMTc6IE5lZWQgYSB3YXlcbiAgICAgIC8vIHRvIGNoZWNrIGlmIGV2ZW50I3N0b3BJbW1lZGlhdGVQcm9wYWdhdGlvblxuICAgICAgLy8gd2FzIGNhbGxlZC4gSWYgc28sIGJyZWFrIGJvdGggbG9vcHMuXG4gICAgICBpZiAobGlzdGVuZXIubWF0Y2hlci5jYWxsKHRhcmdldCwgbGlzdGVuZXIubWF0Y2hlclBhcmFtLCB0YXJnZXQpKSB7XG4gICAgICAgIHJldHVybmVkID0gdGhpcy5maXJlKGV2ZW50LCB0YXJnZXQsIGxpc3RlbmVyKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RvcCBwcm9wYWdhdGlvbiB0byBzdWJzZXF1ZW50XG4gICAgICAvLyBjYWxsYmFja3MgaWYgdGhlIGNhbGxiYWNrIHJldHVybmVkXG4gICAgICAvLyBmYWxzZVxuICAgICAgaWYgKHJldHVybmVkID09PSBmYWxzZSkge1xuICAgICAgICBldmVudFtFVkVOVElHTk9SRV0gPSB0cnVlO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETzpNQ0c6MjAxMjAxMTc6IE5lZWQgYSB3YXkgdG9cbiAgICAvLyBjaGVjayBpZiBldmVudCNzdG9wUHJvcGFnYXRpb25cbiAgICAvLyB3YXMgY2FsbGVkLiBJZiBzbywgYnJlYWsgbG9vcGluZ1xuICAgIC8vIHRocm91Z2ggdGhlIERPTS4gU3RvcCBpZiB0aGVcbiAgICAvLyBkZWxlZ2F0aW9uIHJvb3QgaGFzIGJlZW4gcmVhY2hlZFxuICAgIGlmICh0YXJnZXQgPT09IHJvb3QpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGwgPSBsaXN0ZW5lckxpc3QubGVuZ3RoO1xuICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnRFbGVtZW50O1xuICB9XG59O1xuXG4vKipcbiAqIEZpcmUgYSBsaXN0ZW5lciBvbiBhIHRhcmdldC5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBsaXN0ZW5lclxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24oZXZlbnQsIHRhcmdldCwgbGlzdGVuZXIpIHtcbiAgcmV0dXJuIGxpc3RlbmVyLmhhbmRsZXIuY2FsbCh0YXJnZXQsIGV2ZW50LCB0YXJnZXQpO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgYSBnZW5lcmljIHNlbGVjdG9yLlxuICpcbiAqIEB0eXBlIGZ1bmN0aW9uKClcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWxlY3RvciBBIENTUyBzZWxlY3RvclxuICovXG52YXIgbWF0Y2hlcyA9IChmdW5jdGlvbihlbCkge1xuICBpZiAoIWVsKSByZXR1cm47XG4gIHZhciBwID0gZWwucHJvdG90eXBlO1xuICByZXR1cm4gKHAubWF0Y2hlcyB8fCBwLm1hdGNoZXNTZWxlY3RvciB8fCBwLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBwLm1vek1hdGNoZXNTZWxlY3RvciB8fCBwLm1zTWF0Y2hlc1NlbGVjdG9yIHx8IHAub01hdGNoZXNTZWxlY3Rvcik7XG59KEVsZW1lbnQpKTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgYSB0YWcgc2VsZWN0b3IuXG4gKlxuICogVGFncyBhcmUgTk9UIGNhc2Utc2Vuc2l0aXZlLFxuICogZXhjZXB0IGluIFhNTCAoYW5kIFhNTC1iYXNlZFxuICogbGFuZ3VhZ2VzIHN1Y2ggYXMgWEhUTUwpLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWdOYW1lIFRoZSB0YWcgbmFtZSB0byB0ZXN0IGFnYWluc3RcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc1RhZyh0YWdOYW1lLCBlbGVtZW50KSB7XG4gIHJldHVybiB0YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gZWxlbWVudFxuICogbWF0Y2hlcyB0aGUgcm9vdC5cbiAqXG4gKiBAcGFyYW0gez9TdHJpbmd9IHNlbGVjdG9yIEluIHRoaXMgY2FzZSB0aGlzIGlzIGFsd2F5cyBwYXNzZWQgdGhyb3VnaCBhcyBudWxsIGFuZCBub3QgdXNlZFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3Qgd2l0aFxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5mdW5jdGlvbiBtYXRjaGVzUm9vdChzZWxlY3RvciwgZWxlbWVudCkge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSovXG4gIGlmICh0aGlzLnJvb3RFbGVtZW50ID09PSB3aW5kb3cpIHJldHVybiBlbGVtZW50ID09PSBkb2N1bWVudDtcbiAgcmV0dXJuIHRoaXMucm9vdEVsZW1lbnQgPT09IGVsZW1lbnQ7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgSUQgb2ZcbiAqIHRoZSBlbGVtZW50IGluICd0aGlzJ1xuICogbWF0Y2hlcyB0aGUgZ2l2ZW4gSUQuXG4gKlxuICogSURzIGFyZSBjYXNlLXNlbnNpdGl2ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgVGhlIElEIHRvIHRlc3QgYWdhaW5zdFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3Qgd2l0aFxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5mdW5jdGlvbiBtYXRjaGVzSWQoaWQsIGVsZW1lbnQpIHtcbiAgcmV0dXJuIGlkID09PSBlbGVtZW50LmlkO1xufVxuXG4vKipcbiAqIFNob3J0IGhhbmQgZm9yIG9mZigpXG4gKiBhbmQgcm9vdCgpLCBpZSBib3RoXG4gKiB3aXRoIG5vIHBhcmFtZXRlcnNcbiAqXG4gKiBAcmV0dXJuIHZvaWRcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vZmYoKTtcbiAgdGhpcy5yb290KCk7XG59O1xuIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlLCBub2RlOnRydWUqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQHByZXNlcnZlIENyZWF0ZSBhbmQgbWFuYWdlIGEgRE9NIGV2ZW50IGRlbGVnYXRvci5cbiAqXG4gKiBAdmVyc2lvbiAwLjMuMFxuICogQGNvZGluZ3N0YW5kYXJkIGZ0bGFicy1qc3YyXG4gKiBAY29weXJpZ2h0IFRoZSBGaW5hbmNpYWwgVGltZXMgTGltaXRlZCBbQWxsIFJpZ2h0cyBSZXNlcnZlZF1cbiAqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChzZWUgTElDRU5TRS50eHQpXG4gKi9cbnZhciBEZWxlZ2F0ZSA9IHJlcXVpcmUoJy4vZGVsZWdhdGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihyb290KSB7XG4gIHJldHVybiBuZXcgRGVsZWdhdGUocm9vdCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5EZWxlZ2F0ZSA9IERlbGVnYXRlO1xuIiwiXG4vKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBBIGNhY2hlZCByZWZlcmVuY2UgdG8gdGhlIGhhc093blByb3BlcnR5IGZ1bmN0aW9uLlxuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIEEgY29uc3RydWN0b3IgZnVuY3Rpb24gdGhhdCB3aWxsIGNyZWF0ZSBibGFuayBvYmplY3RzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEJsYW5rKCkge31cblxuQmxhbmsucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuLyoqXG4gKiBVc2VkIHRvIHByZXZlbnQgcHJvcGVydHkgY29sbGlzaW9ucyBiZXR3ZWVuIG91ciBcIm1hcFwiIGFuZCBpdHMgcHJvdG90eXBlLlxuICogQHBhcmFtIHshT2JqZWN0PHN0cmluZywgKj59IG1hcCBUaGUgbWFwIHRvIGNoZWNrLlxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBwcm9wZXJ0eSB0byBjaGVjay5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgbWFwIGhhcyBwcm9wZXJ0eS5cbiAqL1xudmFyIGhhcyA9IGZ1bmN0aW9uIChtYXAsIHByb3BlcnR5KSB7XG4gIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG1hcCwgcHJvcGVydHkpO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIG1hcCBvYmplY3Qgd2l0aG91dCBhIHByb3RvdHlwZS5cbiAqIEByZXR1cm4geyFPYmplY3R9XG4gKi9cbnZhciBjcmVhdGVNYXAgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBuZXcgQmxhbmsoKTtcbn07XG5cbi8qKlxuICogS2VlcHMgdHJhY2sgb2YgaW5mb3JtYXRpb24gbmVlZGVkIHRvIHBlcmZvcm0gZGlmZnMgZm9yIGEgZ2l2ZW4gRE9NIG5vZGUuXG4gKiBAcGFyYW0geyFzdHJpbmd9IG5vZGVOYW1lXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBOb2RlRGF0YShub2RlTmFtZSwga2V5KSB7XG4gIC8qKlxuICAgKiBUaGUgYXR0cmlidXRlcyBhbmQgdGhlaXIgdmFsdWVzLlxuICAgKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCAqPn1cbiAgICovXG4gIHRoaXMuYXR0cnMgPSBjcmVhdGVNYXAoKTtcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMsIHVzZWQgZm9yIHF1aWNrbHkgZGlmZmluZyB0aGVcbiAgICogaW5jb21taW5nIGF0dHJpYnV0ZXMgdG8gc2VlIGlmIHRoZSBET00gbm9kZSdzIGF0dHJpYnV0ZXMgbmVlZCB0byBiZVxuICAgKiB1cGRhdGVkLlxuICAgKiBAY29uc3Qge0FycmF5PCo+fVxuICAgKi9cbiAgdGhpcy5hdHRyc0FyciA9IFtdO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5jb21pbmcgYXR0cmlidXRlcyBmb3IgdGhpcyBOb2RlLCBiZWZvcmUgdGhleSBhcmUgdXBkYXRlZC5cbiAgICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgKj59XG4gICAqL1xuICB0aGlzLm5ld0F0dHJzID0gY3JlYXRlTWFwKCk7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBzdGF0aWNzIGhhdmUgYmVlbiBhcHBsaWVkIGZvciB0aGUgbm9kZSB5ZXQuXG4gICAqIHtib29sZWFufVxuICAgKi9cbiAgdGhpcy5zdGF0aWNzQXBwbGllZCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBub2RlLCB1c2VkIHRvIHByZXNlcnZlIERPTSBub2RlcyB3aGVuIHRoZXlcbiAgICogbW92ZSB3aXRoaW4gdGhlaXIgcGFyZW50LlxuICAgKiBAY29uc3RcbiAgICovXG4gIHRoaXMua2V5ID0ga2V5O1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiBjaGlsZHJlbiB3aXRoaW4gdGhpcyBub2RlIGJ5IHRoZWlyIGtleS5cbiAgICogeyFPYmplY3Q8c3RyaW5nLCAhRWxlbWVudD59XG4gICAqL1xuICB0aGlzLmtleU1hcCA9IGNyZWF0ZU1hcCgpO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUga2V5TWFwIGlzIGN1cnJlbnRseSB2YWxpZC5cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmtleU1hcFZhbGlkID0gdHJ1ZTtcblxuICAvKipcbiAgICogV2hldGhlciBvciB0aGUgYXNzb2NpYXRlZCBub2RlIGlzLCBvciBjb250YWlucywgYSBmb2N1c2VkIEVsZW1lbnQuXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgdGhpcy5mb2N1c2VkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFRoZSBub2RlIG5hbWUgZm9yIHRoaXMgbm9kZS5cbiAgICogQGNvbnN0IHtzdHJpbmd9XG4gICAqL1xuICB0aGlzLm5vZGVOYW1lID0gbm9kZU5hbWU7XG5cbiAgLyoqXG4gICAqIEB0eXBlIHs/c3RyaW5nfVxuICAgKi9cbiAgdGhpcy50ZXh0ID0gbnVsbDtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyBhIE5vZGVEYXRhIG9iamVjdCBmb3IgYSBOb2RlLlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgbm9kZSB0byBpbml0aWFsaXplIGRhdGEgZm9yLlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVOYW1lIFRoZSBub2RlIG5hbWUgb2Ygbm9kZS5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHRoYXQgaWRlbnRpZmllcyB0aGUgbm9kZS5cbiAqIEByZXR1cm4geyFOb2RlRGF0YX0gVGhlIG5ld2x5IGluaXRpYWxpemVkIGRhdGEgb2JqZWN0XG4gKi9cbnZhciBpbml0RGF0YSA9IGZ1bmN0aW9uIChub2RlLCBub2RlTmFtZSwga2V5KSB7XG4gIHZhciBkYXRhID0gbmV3IE5vZGVEYXRhKG5vZGVOYW1lLCBrZXkpO1xuICBub2RlWydfX2luY3JlbWVudGFsRE9NRGF0YSddID0gZGF0YTtcbiAgcmV0dXJuIGRhdGE7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgTm9kZURhdGEgb2JqZWN0IGZvciBhIE5vZGUsIGNyZWF0aW5nIGl0IGlmIG5lY2Vzc2FyeS5cbiAqXG4gKiBAcGFyYW0gez9Ob2RlfSBub2RlIFRoZSBOb2RlIHRvIHJldHJpZXZlIHRoZSBkYXRhIGZvci5cbiAqIEByZXR1cm4geyFOb2RlRGF0YX0gVGhlIE5vZGVEYXRhIGZvciB0aGlzIE5vZGUuXG4gKi9cbnZhciBnZXREYXRhID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgaW1wb3J0Tm9kZShub2RlKTtcbiAgcmV0dXJuIG5vZGVbJ19faW5jcmVtZW50YWxET01EYXRhJ107XG59O1xuXG4vKipcbiAqIEltcG9ydHMgbm9kZSBhbmQgaXRzIHN1YnRyZWUsIGluaXRpYWxpemluZyBjYWNoZXMuXG4gKlxuICogQHBhcmFtIHs/Tm9kZX0gbm9kZSBUaGUgTm9kZSB0byBpbXBvcnQuXG4gKi9cbnZhciBpbXBvcnROb2RlID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgaWYgKG5vZGVbJ19faW5jcmVtZW50YWxET01EYXRhJ10pIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgaXNFbGVtZW50ID0gbm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQ7XG4gIHZhciBub2RlTmFtZSA9IGlzRWxlbWVudCA/IG5vZGUubG9jYWxOYW1lIDogbm9kZS5ub2RlTmFtZTtcbiAgdmFyIGtleSA9IGlzRWxlbWVudCA/IG5vZGUuZ2V0QXR0cmlidXRlKCdrZXknKSA6IG51bGw7XG4gIHZhciBkYXRhID0gaW5pdERhdGEobm9kZSwgbm9kZU5hbWUsIGtleSk7XG5cbiAgaWYgKGtleSkge1xuICAgIGdldERhdGEobm9kZS5wYXJlbnROb2RlKS5rZXlNYXBba2V5XSA9IG5vZGU7XG4gIH1cblxuICBpZiAoaXNFbGVtZW50KSB7XG4gICAgdmFyIGF0dHJpYnV0ZXMgPSBub2RlLmF0dHJpYnV0ZXM7XG4gICAgdmFyIGF0dHJzID0gZGF0YS5hdHRycztcbiAgICB2YXIgbmV3QXR0cnMgPSBkYXRhLm5ld0F0dHJzO1xuICAgIHZhciBhdHRyc0FyciA9IGRhdGEuYXR0cnNBcnI7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJpYnV0ZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIHZhciBhdHRyID0gYXR0cmlidXRlc1tpXTtcbiAgICAgIHZhciBuYW1lID0gYXR0ci5uYW1lO1xuICAgICAgdmFyIHZhbHVlID0gYXR0ci52YWx1ZTtcblxuICAgICAgYXR0cnNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgIG5ld0F0dHJzW25hbWVdID0gdW5kZWZpbmVkO1xuICAgICAgYXR0cnNBcnIucHVzaChuYW1lKTtcbiAgICAgIGF0dHJzQXJyLnB1c2godmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAodmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgIGltcG9ydE5vZGUoY2hpbGQpO1xuICB9XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIG5hbWVzcGFjZSB0byBjcmVhdGUgYW4gZWxlbWVudCAob2YgYSBnaXZlbiB0YWcpIGluLlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIHRvIGdldCB0aGUgbmFtZXNwYWNlIGZvci5cbiAqIEBwYXJhbSB7P05vZGV9IHBhcmVudFxuICogQHJldHVybiB7P3N0cmluZ30gVGhlIG5hbWVzcGFjZSB0byBjcmVhdGUgdGhlIHRhZyBpbi5cbiAqL1xudmFyIGdldE5hbWVzcGFjZUZvclRhZyA9IGZ1bmN0aW9uICh0YWcsIHBhcmVudCkge1xuICBpZiAodGFnID09PSAnc3ZnJykge1xuICAgIHJldHVybiAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuICB9XG5cbiAgaWYgKGdldERhdGEocGFyZW50KS5ub2RlTmFtZSA9PT0gJ2ZvcmVpZ25PYmplY3QnKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gcGFyZW50Lm5hbWVzcGFjZVVSSTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50LlxuICogQHBhcmFtIHtEb2N1bWVudH0gZG9jIFRoZSBkb2N1bWVudCB3aXRoIHdoaWNoIHRvIGNyZWF0ZSB0aGUgRWxlbWVudC5cbiAqIEBwYXJhbSB7P05vZGV9IHBhcmVudFxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIGZvciB0aGUgRWxlbWVudC5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBBIGtleSB0byBpZGVudGlmeSB0aGUgRWxlbWVudC5cbiAqIEByZXR1cm4geyFFbGVtZW50fVxuICovXG52YXIgY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uIChkb2MsIHBhcmVudCwgdGFnLCBrZXkpIHtcbiAgdmFyIG5hbWVzcGFjZSA9IGdldE5hbWVzcGFjZUZvclRhZyh0YWcsIHBhcmVudCk7XG4gIHZhciBlbCA9IHVuZGVmaW5lZDtcblxuICBpZiAobmFtZXNwYWNlKSB7XG4gICAgZWwgPSBkb2MuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgdGFnKTtcbiAgfSBlbHNlIHtcbiAgICBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KHRhZyk7XG4gIH1cblxuICBpbml0RGF0YShlbCwgdGFnLCBrZXkpO1xuXG4gIHJldHVybiBlbDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRleHQgTm9kZS5cbiAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyBUaGUgZG9jdW1lbnQgd2l0aCB3aGljaCB0byBjcmVhdGUgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshVGV4dH1cbiAqL1xudmFyIGNyZWF0ZVRleHQgPSBmdW5jdGlvbiAoZG9jKSB7XG4gIHZhciBub2RlID0gZG9jLmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgaW5pdERhdGEobm9kZSwgJyN0ZXh0JywgbnVsbCk7XG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKiogQGNvbnN0ICovXG52YXIgbm90aWZpY2F0aW9ucyA9IHtcbiAgLyoqXG4gICAqIENhbGxlZCBhZnRlciBwYXRjaCBoYXMgY29tcGxlYXRlZCB3aXRoIGFueSBOb2RlcyB0aGF0IGhhdmUgYmVlbiBjcmVhdGVkXG4gICAqIGFuZCBhZGRlZCB0byB0aGUgRE9NLlxuICAgKiBAdHlwZSB7P2Z1bmN0aW9uKEFycmF5PCFOb2RlPil9XG4gICAqL1xuICBub2Rlc0NyZWF0ZWQ6IG51bGwsXG5cbiAgLyoqXG4gICAqIENhbGxlZCBhZnRlciBwYXRjaCBoYXMgY29tcGxlYXRlZCB3aXRoIGFueSBOb2RlcyB0aGF0IGhhdmUgYmVlbiByZW1vdmVkXG4gICAqIGZyb20gdGhlIERPTS5cbiAgICogTm90ZSBpdCdzIGFuIGFwcGxpY2F0aW9ucyByZXNwb25zaWJpbGl0eSB0byBoYW5kbGUgYW55IGNoaWxkTm9kZXMuXG4gICAqIEB0eXBlIHs/ZnVuY3Rpb24oQXJyYXk8IU5vZGU+KX1cbiAgICovXG4gIG5vZGVzRGVsZXRlZDogbnVsbFxufTtcblxuLyoqXG4gKiBLZWVwcyB0cmFjayBvZiB0aGUgc3RhdGUgb2YgYSBwYXRjaC5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBDb250ZXh0KCkge1xuICAvKipcbiAgICogQHR5cGUgeyhBcnJheTwhTm9kZT58dW5kZWZpbmVkKX1cbiAgICovXG4gIHRoaXMuY3JlYXRlZCA9IG5vdGlmaWNhdGlvbnMubm9kZXNDcmVhdGVkICYmIFtdO1xuXG4gIC8qKlxuICAgKiBAdHlwZSB7KEFycmF5PCFOb2RlPnx1bmRlZmluZWQpfVxuICAgKi9cbiAgdGhpcy5kZWxldGVkID0gbm90aWZpY2F0aW9ucy5ub2Rlc0RlbGV0ZWQgJiYgW107XG59XG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICovXG5Db250ZXh0LnByb3RvdHlwZS5tYXJrQ3JlYXRlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIGlmICh0aGlzLmNyZWF0ZWQpIHtcbiAgICB0aGlzLmNyZWF0ZWQucHVzaChub2RlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLm1hcmtEZWxldGVkID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgaWYgKHRoaXMuZGVsZXRlZCkge1xuICAgIHRoaXMuZGVsZXRlZC5wdXNoKG5vZGUpO1xuICB9XG59O1xuXG4vKipcbiAqIE5vdGlmaWVzIGFib3V0IG5vZGVzIHRoYXQgd2VyZSBjcmVhdGVkIGR1cmluZyB0aGUgcGF0Y2ggb3BlYXJhdGlvbi5cbiAqL1xuQ29udGV4dC5wcm90b3R5cGUubm90aWZ5Q2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuY3JlYXRlZCAmJiB0aGlzLmNyZWF0ZWQubGVuZ3RoID4gMCkge1xuICAgIG5vdGlmaWNhdGlvbnMubm9kZXNDcmVhdGVkKHRoaXMuY3JlYXRlZCk7XG4gIH1cblxuICBpZiAodGhpcy5kZWxldGVkICYmIHRoaXMuZGVsZXRlZC5sZW5ndGggPiAwKSB7XG4gICAgbm90aWZpY2F0aW9ucy5ub2Rlc0RlbGV0ZWQodGhpcy5kZWxldGVkKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAgKiBLZWVwcyB0cmFjayB3aGV0aGVyIG9yIG5vdCB3ZSBhcmUgaW4gYW4gYXR0cmlidXRlcyBkZWNsYXJhdGlvbiAoYWZ0ZXJcbiAgKiBlbGVtZW50T3BlblN0YXJ0LCBidXQgYmVmb3JlIGVsZW1lbnRPcGVuRW5kKS5cbiAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgKi9cbnZhciBpbkF0dHJpYnV0ZXMgPSBmYWxzZTtcblxuLyoqXG4gICogS2VlcHMgdHJhY2sgd2hldGhlciBvciBub3Qgd2UgYXJlIGluIGFuIGVsZW1lbnQgdGhhdCBzaG91bGQgbm90IGhhdmUgaXRzXG4gICogY2hpbGRyZW4gY2xlYXJlZC5cbiAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgKi9cbnZhciBpblNraXAgPSBmYWxzZTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgdGhlcmUgaXMgYSBjdXJyZW50IHBhdGNoIGNvbnRleHQuXG4gKiBAcGFyYW0ge3N0cmluZ30gZnVuY3Rpb25OYW1lXG4gKiBAcGFyYW0geyp9IGNvbnRleHRcbiAqL1xudmFyIGFzc2VydEluUGF0Y2ggPSBmdW5jdGlvbiAoZnVuY3Rpb25OYW1lLCBjb250ZXh0KSB7XG4gIGlmICghY29udGV4dCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNhbGwgJyArIGZ1bmN0aW9uTmFtZSArICcoKSB1bmxlc3MgaW4gcGF0Y2guJyk7XG4gIH1cbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IGEgcGF0Y2ggY2xvc2VzIGV2ZXJ5IG5vZGUgdGhhdCBpdCBvcGVuZWQuXG4gKiBAcGFyYW0gez9Ob2RlfSBvcGVuRWxlbWVudFxuICogQHBhcmFtIHshTm9kZXwhRG9jdW1lbnRGcmFnbWVudH0gcm9vdFxuICovXG52YXIgYXNzZXJ0Tm9VbmNsb3NlZFRhZ3MgPSBmdW5jdGlvbiAob3BlbkVsZW1lbnQsIHJvb3QpIHtcbiAgaWYgKG9wZW5FbGVtZW50ID09PSByb290KSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGN1cnJlbnRFbGVtZW50ID0gb3BlbkVsZW1lbnQ7XG4gIHZhciBvcGVuVGFncyA9IFtdO1xuICB3aGlsZSAoY3VycmVudEVsZW1lbnQgJiYgY3VycmVudEVsZW1lbnQgIT09IHJvb3QpIHtcbiAgICBvcGVuVGFncy5wdXNoKGN1cnJlbnRFbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpO1xuICAgIGN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcignT25lIG9yIG1vcmUgdGFncyB3ZXJlIG5vdCBjbG9zZWQ6XFxuJyArIG9wZW5UYWdzLmpvaW4oJ1xcbicpKTtcbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IHRoZSBjYWxsZXIgaXMgbm90IHdoZXJlIGF0dHJpYnV0ZXMgYXJlIGV4cGVjdGVkLlxuICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZVxuICovXG52YXIgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzID0gZnVuY3Rpb24gKGZ1bmN0aW9uTmFtZSkge1xuICBpZiAoaW5BdHRyaWJ1dGVzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGZ1bmN0aW9uTmFtZSArICcoKSBjYW4gbm90IGJlIGNhbGxlZCBiZXR3ZWVuICcgKyAnZWxlbWVudE9wZW5TdGFydCgpIGFuZCBlbGVtZW50T3BlbkVuZCgpLicpO1xuICB9XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY2FsbGVyIGlzIG5vdCBpbnNpZGUgYW4gZWxlbWVudCB0aGF0IGhhcyBkZWNsYXJlZCBza2lwLlxuICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZVxuICovXG52YXIgYXNzZXJ0Tm90SW5Ta2lwID0gZnVuY3Rpb24gKGZ1bmN0aW9uTmFtZSkge1xuICBpZiAoaW5Ta2lwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGZ1bmN0aW9uTmFtZSArICcoKSBtYXkgbm90IGJlIGNhbGxlZCBpbnNpZGUgYW4gZWxlbWVudCAnICsgJ3RoYXQgaGFzIGNhbGxlZCBza2lwKCkuJyk7XG4gIH1cbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IHRoZSBjYWxsZXIgaXMgd2hlcmUgYXR0cmlidXRlcyBhcmUgZXhwZWN0ZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gZnVuY3Rpb25OYW1lXG4gKi9cbnZhciBhc3NlcnRJbkF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAoZnVuY3Rpb25OYW1lKSB7XG4gIGlmICghaW5BdHRyaWJ1dGVzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGZ1bmN0aW9uTmFtZSArICcoKSBjYW4gb25seSBiZSBjYWxsZWQgYWZ0ZXIgY2FsbGluZyAnICsgJ2VsZW1lbnRPcGVuU3RhcnQoKS4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoZSBwYXRjaCBjbG9zZXMgdmlydHVhbCBhdHRyaWJ1dGVzIGNhbGxcbiAqL1xudmFyIGFzc2VydFZpcnR1YWxBdHRyaWJ1dGVzQ2xvc2VkID0gZnVuY3Rpb24gKCkge1xuICBpZiAoaW5BdHRyaWJ1dGVzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdlbGVtZW50T3BlbkVuZCgpIG11c3QgYmUgY2FsbGVkIGFmdGVyIGNhbGxpbmcgJyArICdlbGVtZW50T3BlblN0YXJ0KCkuJyk7XG4gIH1cbn07XG5cbi8qKlxuICAqIE1ha2VzIHN1cmUgdGhhdCB0YWdzIGFyZSBjb3JyZWN0bHkgbmVzdGVkLlxuICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZVxuICAqIEBwYXJhbSB7c3RyaW5nfSB0YWdcbiAgKi9cbnZhciBhc3NlcnRDbG9zZU1hdGNoZXNPcGVuVGFnID0gZnVuY3Rpb24gKG5vZGVOYW1lLCB0YWcpIHtcbiAgaWYgKG5vZGVOYW1lICE9PSB0YWcpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlY2VpdmVkIGEgY2FsbCB0byBjbG9zZSBcIicgKyB0YWcgKyAnXCIgYnV0IFwiJyArIG5vZGVOYW1lICsgJ1wiIHdhcyBvcGVuLicpO1xuICB9XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCBubyBjaGlsZHJlbiBlbGVtZW50cyBoYXZlIGJlZW4gZGVjbGFyZWQgeWV0IGluIHRoZSBjdXJyZW50XG4gKiBlbGVtZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZVxuICogQHBhcmFtIHs/Tm9kZX0gcHJldmlvdXNOb2RlXG4gKi9cbnZhciBhc3NlcnROb0NoaWxkcmVuRGVjbGFyZWRZZXQgPSBmdW5jdGlvbiAoZnVuY3Rpb25OYW1lLCBwcmV2aW91c05vZGUpIHtcbiAgaWYgKHByZXZpb3VzTm9kZSAhPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihmdW5jdGlvbk5hbWUgKyAnKCkgbXVzdCBjb21lIGJlZm9yZSBhbnkgY2hpbGQgJyArICdkZWNsYXJhdGlvbnMgaW5zaWRlIHRoZSBjdXJyZW50IGVsZW1lbnQuJyk7XG4gIH1cbn07XG5cbi8qKlxuICogQ2hlY2tzIHRoYXQgYSBjYWxsIHRvIHBhdGNoT3V0ZXIgYWN0dWFsbHkgcGF0Y2hlZCB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSB7P05vZGV9IHN0YXJ0Tm9kZSBUaGUgdmFsdWUgZm9yIHRoZSBjdXJyZW50Tm9kZSB3aGVuIHRoZSBwYXRjaFxuICogICAgIHN0YXJ0ZWQuXG4gKiBAcGFyYW0gez9Ob2RlfSBjdXJyZW50Tm9kZSBUaGUgY3VycmVudE5vZGUgd2hlbiB0aGUgcGF0Y2ggZmluaXNoZWQuXG4gKiBAcGFyYW0gez9Ob2RlfSBleHBlY3RlZE5leHROb2RlIFRoZSBOb2RlIHRoYXQgaXMgZXhwZWN0ZWQgdG8gZm9sbG93IHRoZVxuICogICAgY3VycmVudE5vZGUgYWZ0ZXIgdGhlIHBhdGNoO1xuICogQHBhcmFtIHs/Tm9kZX0gZXhwZWN0ZWRQcmV2Tm9kZSBUaGUgTm9kZSB0aGF0IGlzIGV4cGVjdGVkIHRvIHByZWNlZWQgdGhlXG4gKiAgICBjdXJyZW50Tm9kZSBhZnRlciB0aGUgcGF0Y2guXG4gKi9cbnZhciBhc3NlcnRQYXRjaEVsZW1lbnROb0V4dHJhcyA9IGZ1bmN0aW9uIChzdGFydE5vZGUsIGN1cnJlbnROb2RlLCBleHBlY3RlZE5leHROb2RlLCBleHBlY3RlZFByZXZOb2RlKSB7XG4gIHZhciB3YXNVcGRhdGVkID0gY3VycmVudE5vZGUubmV4dFNpYmxpbmcgPT09IGV4cGVjdGVkTmV4dE5vZGUgJiYgY3VycmVudE5vZGUucHJldmlvdXNTaWJsaW5nID09PSBleHBlY3RlZFByZXZOb2RlO1xuICB2YXIgd2FzQ2hhbmdlZCA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nID09PSBzdGFydE5vZGUubmV4dFNpYmxpbmcgJiYgY3VycmVudE5vZGUucHJldmlvdXNTaWJsaW5nID09PSBleHBlY3RlZFByZXZOb2RlO1xuICB2YXIgd2FzUmVtb3ZlZCA9IGN1cnJlbnROb2RlID09PSBzdGFydE5vZGU7XG5cbiAgaWYgKCF3YXNVcGRhdGVkICYmICF3YXNDaGFuZ2VkICYmICF3YXNSZW1vdmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUaGVyZSBtdXN0IGJlIGV4YWN0bHkgb25lIHRvcCBsZXZlbCBjYWxsIGNvcnJlc3BvbmRpbmcgJyArICd0byB0aGUgcGF0Y2hlZCBlbGVtZW50LicpO1xuICB9XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHN0YXRlIG9mIGJlaW5nIGluIGFuIGF0dHJpYnV0ZSBkZWNsYXJhdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRoZSBwcmV2aW91cyB2YWx1ZS5cbiAqL1xudmFyIHNldEluQXR0cmlidXRlcyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgcHJldmlvdXMgPSBpbkF0dHJpYnV0ZXM7XG4gIGluQXR0cmlidXRlcyA9IHZhbHVlO1xuICByZXR1cm4gcHJldmlvdXM7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHN0YXRlIG9mIGJlaW5nIGluIGEgc2tpcCBlbGVtZW50LlxuICogQHBhcmFtIHtib29sZWFufSB2YWx1ZVxuICogQHJldHVybiB7Ym9vbGVhbn0gdGhlIHByZXZpb3VzIHZhbHVlLlxuICovXG52YXIgc2V0SW5Ta2lwID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHZhciBwcmV2aW91cyA9IGluU2tpcDtcbiAgaW5Ta2lwID0gdmFsdWU7XG4gIHJldHVybiBwcmV2aW91cztcbn07XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTYgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBub2RlIHRoZSByb290IG9mIGEgZG9jdW1lbnQsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xudmFyIGlzRG9jdW1lbnRSb290ID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgLy8gRm9yIFNoYWRvd1Jvb3RzLCBjaGVjayBpZiB0aGV5IGFyZSBhIERvY3VtZW50RnJhZ21lbnQgaW5zdGVhZCBvZiBpZiB0aGV5XG4gIC8vIGFyZSBhIFNoYWRvd1Jvb3Qgc28gdGhhdCB0aGlzIGNhbiB3b3JrIGluICd1c2Ugc3RyaWN0JyBpZiBTaGFkb3dSb290cyBhcmVcbiAgLy8gbm90IHN1cHBvcnRlZC5cbiAgcmV0dXJuIG5vZGUgaW5zdGFuY2VvZiBEb2N1bWVudCB8fCBub2RlIGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudDtcbn07XG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZSBUaGUgbm9kZSB0byBzdGFydCBhdCwgaW5jbHVzaXZlLlxuICogQHBhcmFtIHs/Tm9kZX0gcm9vdCBUaGUgcm9vdCBhbmNlc3RvciB0byBnZXQgdW50aWwsIGV4Y2x1c2l2ZS5cbiAqIEByZXR1cm4geyFBcnJheTwhTm9kZT59IFRoZSBhbmNlc3RyeSBvZiBET00gbm9kZXMuXG4gKi9cbnZhciBnZXRBbmNlc3RyeSA9IGZ1bmN0aW9uIChub2RlLCByb290KSB7XG4gIHZhciBhbmNlc3RyeSA9IFtdO1xuICB2YXIgY3VyID0gbm9kZTtcblxuICB3aGlsZSAoY3VyICE9PSByb290KSB7XG4gICAgYW5jZXN0cnkucHVzaChjdXIpO1xuICAgIGN1ciA9IGN1ci5wYXJlbnROb2RlO1xuICB9XG5cbiAgcmV0dXJuIGFuY2VzdHJ5O1xufTtcblxuLyoqXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gKiBAcmV0dXJuIHshTm9kZX0gVGhlIHJvb3Qgbm9kZSBvZiB0aGUgRE9NIHRyZWUgdGhhdCBjb250YWlucyBub2RlLlxuICovXG52YXIgZ2V0Um9vdCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIHZhciBjdXIgPSBub2RlO1xuICB2YXIgcHJldiA9IGN1cjtcblxuICB3aGlsZSAoY3VyKSB7XG4gICAgcHJldiA9IGN1cjtcbiAgICBjdXIgPSBjdXIucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHJldHVybiBwcmV2O1xufTtcblxuLyoqXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlIFRoZSBub2RlIHRvIGdldCB0aGUgYWN0aXZlRWxlbWVudCBmb3IuXG4gKiBAcmV0dXJuIHs/RWxlbWVudH0gVGhlIGFjdGl2ZUVsZW1lbnQgaW4gdGhlIERvY3VtZW50IG9yIFNoYWRvd1Jvb3RcbiAqICAgICBjb3JyZXNwb25kaW5nIHRvIG5vZGUsIGlmIHByZXNlbnQuXG4gKi9cbnZhciBnZXRBY3RpdmVFbGVtZW50ID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgdmFyIHJvb3QgPSBnZXRSb290KG5vZGUpO1xuICByZXR1cm4gaXNEb2N1bWVudFJvb3Qocm9vdCkgPyByb290LmFjdGl2ZUVsZW1lbnQgOiBudWxsO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBwYXRoIG9mIG5vZGVzIHRoYXQgY29udGFpbiB0aGUgZm9jdXNlZCBub2RlIGluIHRoZSBzYW1lIGRvY3VtZW50IGFzXG4gKiBhIHJlZmVyZW5jZSBub2RlLCB1cCB1bnRpbCB0aGUgcm9vdC5cbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGUgVGhlIHJlZmVyZW5jZSBub2RlIHRvIGdldCB0aGUgYWN0aXZlRWxlbWVudCBmb3IuXG4gKiBAcGFyYW0gez9Ob2RlfSByb290IFRoZSByb290IHRvIGdldCB0aGUgZm9jdXNlZCBwYXRoIHVudGlsLlxuICogQHJldHVybiB7IUFycmF5PE5vZGU+fVxuICovXG52YXIgZ2V0Rm9jdXNlZFBhdGggPSBmdW5jdGlvbiAobm9kZSwgcm9vdCkge1xuICB2YXIgYWN0aXZlRWxlbWVudCA9IGdldEFjdGl2ZUVsZW1lbnQobm9kZSk7XG5cbiAgaWYgKCFhY3RpdmVFbGVtZW50IHx8ICFub2RlLmNvbnRhaW5zKGFjdGl2ZUVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgcmV0dXJuIGdldEFuY2VzdHJ5KGFjdGl2ZUVsZW1lbnQsIHJvb3QpO1xufTtcblxuLyoqXG4gKiBMaWtlIGluc2VydEJlZm9yZSwgYnV0IGluc3RlYWQgaW5zdGVhZCBvZiBtb3ZpbmcgdGhlIGRlc2lyZWQgbm9kZSwgaW5zdGVhZFxuICogbW92ZXMgYWxsIHRoZSBvdGhlciBub2RlcyBhZnRlci5cbiAqIEBwYXJhbSB7P05vZGV9IHBhcmVudE5vZGVcbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAqIEBwYXJhbSB7P05vZGV9IHJlZmVyZW5jZU5vZGVcbiAqL1xudmFyIG1vdmVCZWZvcmUgPSBmdW5jdGlvbiAocGFyZW50Tm9kZSwgbm9kZSwgcmVmZXJlbmNlTm9kZSkge1xuICB2YXIgaW5zZXJ0UmVmZXJlbmNlTm9kZSA9IG5vZGUubmV4dFNpYmxpbmc7XG4gIHZhciBjdXIgPSByZWZlcmVuY2VOb2RlO1xuXG4gIHdoaWxlIChjdXIgIT09IG5vZGUpIHtcbiAgICB2YXIgbmV4dCA9IGN1ci5uZXh0U2libGluZztcbiAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZShjdXIsIGluc2VydFJlZmVyZW5jZU5vZGUpO1xuICAgIGN1ciA9IG5leHQ7XG4gIH1cbn07XG5cbi8qKiBAdHlwZSB7P0NvbnRleHR9ICovXG52YXIgY29udGV4dCA9IG51bGw7XG5cbi8qKiBAdHlwZSB7P05vZGV9ICovXG52YXIgY3VycmVudE5vZGUgPSBudWxsO1xuXG4vKiogQHR5cGUgez9Ob2RlfSAqL1xudmFyIGN1cnJlbnRQYXJlbnQgPSBudWxsO1xuXG4vKiogQHR5cGUgez9Eb2N1bWVudH0gKi9cbnZhciBkb2MgPSBudWxsO1xuXG4vKipcbiAqIEBwYXJhbSB7IUFycmF5PE5vZGU+fSBmb2N1c1BhdGggVGhlIG5vZGVzIHRvIG1hcmsuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGZvY3VzZWQgV2hldGhlciBvciBub3QgdGhleSBhcmUgZm9jdXNlZC5cbiAqL1xudmFyIG1hcmtGb2N1c2VkID0gZnVuY3Rpb24gKGZvY3VzUGF0aCwgZm9jdXNlZCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGZvY3VzUGF0aC5sZW5ndGg7IGkgKz0gMSkge1xuICAgIGdldERhdGEoZm9jdXNQYXRoW2ldKS5mb2N1c2VkID0gZm9jdXNlZDtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcGF0Y2hlciBmdW5jdGlvbiB0aGF0IHNldHMgdXAgYW5kIHJlc3RvcmVzIGEgcGF0Y2ggY29udGV4dCxcbiAqIHJ1bm5pbmcgdGhlIHJ1biBmdW5jdGlvbiB3aXRoIHRoZSBwcm92aWRlZCBkYXRhLlxuICogQHBhcmFtIHtmdW5jdGlvbigoIUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnQpLCFmdW5jdGlvbihUKSxUPSk6ID9Ob2RlfSBydW5cbiAqIEByZXR1cm4ge2Z1bmN0aW9uKCghRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudCksIWZ1bmN0aW9uKFQpLFQ9KTogP05vZGV9XG4gKiBAdGVtcGxhdGUgVFxuICovXG52YXIgcGF0Y2hGYWN0b3J5ID0gZnVuY3Rpb24gKHJ1bikge1xuICAvKipcbiAgICogVE9ETyhtb3opOiBUaGVzZSBhbm5vdGF0aW9ucyB3b24ndCBiZSBuZWNlc3Nhcnkgb25jZSB3ZSBzd2l0Y2ggdG8gQ2xvc3VyZVxuICAgKiBDb21waWxlcidzIG5ldyB0eXBlIGluZmVyZW5jZS4gUmVtb3ZlIHRoZXNlIG9uY2UgdGhlIHN3aXRjaCBpcyBkb25lLlxuICAgKlxuICAgKiBAcGFyYW0geyghRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudCl9IG5vZGVcbiAgICogQHBhcmFtIHshZnVuY3Rpb24oVCl9IGZuXG4gICAqIEBwYXJhbSB7VD19IGRhdGFcbiAgICogQHJldHVybiB7P05vZGV9IG5vZGVcbiAgICogQHRlbXBsYXRlIFRcbiAgICovXG4gIHZhciBmID0gZnVuY3Rpb24gKG5vZGUsIGZuLCBkYXRhKSB7XG4gICAgdmFyIHByZXZDb250ZXh0ID0gY29udGV4dDtcbiAgICB2YXIgcHJldkRvYyA9IGRvYztcbiAgICB2YXIgcHJldkN1cnJlbnROb2RlID0gY3VycmVudE5vZGU7XG4gICAgdmFyIHByZXZDdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudDtcbiAgICB2YXIgcHJldmlvdXNJbkF0dHJpYnV0ZXMgPSBmYWxzZTtcbiAgICB2YXIgcHJldmlvdXNJblNraXAgPSBmYWxzZTtcblxuICAgIGNvbnRleHQgPSBuZXcgQ29udGV4dCgpO1xuICAgIGRvYyA9IG5vZGUub3duZXJEb2N1bWVudDtcbiAgICBjdXJyZW50UGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIHByZXZpb3VzSW5BdHRyaWJ1dGVzID0gc2V0SW5BdHRyaWJ1dGVzKGZhbHNlKTtcbiAgICAgIHByZXZpb3VzSW5Ta2lwID0gc2V0SW5Ta2lwKGZhbHNlKTtcbiAgICB9XG5cbiAgICB2YXIgZm9jdXNQYXRoID0gZ2V0Rm9jdXNlZFBhdGgobm9kZSwgY3VycmVudFBhcmVudCk7XG4gICAgbWFya0ZvY3VzZWQoZm9jdXNQYXRoLCB0cnVlKTtcbiAgICB2YXIgcmV0VmFsID0gcnVuKG5vZGUsIGZuLCBkYXRhKTtcbiAgICBtYXJrRm9jdXNlZChmb2N1c1BhdGgsIGZhbHNlKTtcblxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBhc3NlcnRWaXJ0dWFsQXR0cmlidXRlc0Nsb3NlZCgpO1xuICAgICAgc2V0SW5BdHRyaWJ1dGVzKHByZXZpb3VzSW5BdHRyaWJ1dGVzKTtcbiAgICAgIHNldEluU2tpcChwcmV2aW91c0luU2tpcCk7XG4gICAgfVxuXG4gICAgY29udGV4dC5ub3RpZnlDaGFuZ2VzKCk7XG5cbiAgICBjb250ZXh0ID0gcHJldkNvbnRleHQ7XG4gICAgZG9jID0gcHJldkRvYztcbiAgICBjdXJyZW50Tm9kZSA9IHByZXZDdXJyZW50Tm9kZTtcbiAgICBjdXJyZW50UGFyZW50ID0gcHJldkN1cnJlbnRQYXJlbnQ7XG5cbiAgICByZXR1cm4gcmV0VmFsO1xuICB9O1xuICByZXR1cm4gZjtcbn07XG5cbi8qKlxuICogUGF0Y2hlcyB0aGUgZG9jdW1lbnQgc3RhcnRpbmcgYXQgbm9kZSB3aXRoIHRoZSBwcm92aWRlZCBmdW5jdGlvbi4gVGhpc1xuICogZnVuY3Rpb24gbWF5IGJlIGNhbGxlZCBkdXJpbmcgYW4gZXhpc3RpbmcgcGF0Y2ggb3BlcmF0aW9uLlxuICogQHBhcmFtIHshRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudH0gbm9kZSBUaGUgRWxlbWVudCBvciBEb2N1bWVudFxuICogICAgIHRvIHBhdGNoLlxuICogQHBhcmFtIHshZnVuY3Rpb24oVCl9IGZuIEEgZnVuY3Rpb24gY29udGFpbmluZyBlbGVtZW50T3Blbi9lbGVtZW50Q2xvc2UvZXRjLlxuICogICAgIGNhbGxzIHRoYXQgZGVzY3JpYmUgdGhlIERPTS5cbiAqIEBwYXJhbSB7VD19IGRhdGEgQW4gYXJndW1lbnQgcGFzc2VkIHRvIGZuIHRvIHJlcHJlc2VudCBET00gc3RhdGUuXG4gKiBAcmV0dXJuIHshTm9kZX0gVGhlIHBhdGNoZWQgbm9kZS5cbiAqIEB0ZW1wbGF0ZSBUXG4gKi9cbnZhciBwYXRjaElubmVyID0gcGF0Y2hGYWN0b3J5KGZ1bmN0aW9uIChub2RlLCBmbiwgZGF0YSkge1xuICBjdXJyZW50Tm9kZSA9IG5vZGU7XG5cbiAgZW50ZXJOb2RlKCk7XG4gIGZuKGRhdGEpO1xuICBleGl0Tm9kZSgpO1xuXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm9VbmNsb3NlZFRhZ3MoY3VycmVudE5vZGUsIG5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59KTtcblxuLyoqXG4gKiBQYXRjaGVzIGFuIEVsZW1lbnQgd2l0aCB0aGUgdGhlIHByb3ZpZGVkIGZ1bmN0aW9uLiBFeGFjdGx5IG9uZSB0b3AgbGV2ZWxcbiAqIGVsZW1lbnQgY2FsbCBzaG91bGQgYmUgbWFkZSBjb3JyZXNwb25kaW5nIHRvIGBub2RlYC5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IG5vZGUgVGhlIEVsZW1lbnQgd2hlcmUgdGhlIHBhdGNoIHNob3VsZCBzdGFydC5cbiAqIEBwYXJhbSB7IWZ1bmN0aW9uKFQpfSBmbiBBIGZ1bmN0aW9uIGNvbnRhaW5pbmcgZWxlbWVudE9wZW4vZWxlbWVudENsb3NlL2V0Yy5cbiAqICAgICBjYWxscyB0aGF0IGRlc2NyaWJlIHRoZSBET00uIFRoaXMgc2hvdWxkIGhhdmUgYXQgbW9zdCBvbmUgdG9wIGxldmVsXG4gKiAgICAgZWxlbWVudCBjYWxsLlxuICogQHBhcmFtIHtUPX0gZGF0YSBBbiBhcmd1bWVudCBwYXNzZWQgdG8gZm4gdG8gcmVwcmVzZW50IERPTSBzdGF0ZS5cbiAqIEByZXR1cm4gez9Ob2RlfSBUaGUgbm9kZSBpZiBpdCB3YXMgdXBkYXRlZCwgaXRzIHJlcGxhY2VkbWVudCBvciBudWxsIGlmIGl0XG4gKiAgICAgd2FzIHJlbW92ZWQuXG4gKiBAdGVtcGxhdGUgVFxuICovXG52YXIgcGF0Y2hPdXRlciA9IHBhdGNoRmFjdG9yeShmdW5jdGlvbiAobm9kZSwgZm4sIGRhdGEpIHtcbiAgdmFyIHN0YXJ0Tm9kZSA9IC8qKiBAdHlwZSB7IUVsZW1lbnR9ICoveyBuZXh0U2libGluZzogbm9kZSB9O1xuICB2YXIgZXhwZWN0ZWROZXh0Tm9kZSA9IG51bGw7XG4gIHZhciBleHBlY3RlZFByZXZOb2RlID0gbnVsbDtcblxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGV4cGVjdGVkTmV4dE5vZGUgPSBub2RlLm5leHRTaWJsaW5nO1xuICAgIGV4cGVjdGVkUHJldk5vZGUgPSBub2RlLnByZXZpb3VzU2libGluZztcbiAgfVxuXG4gIGN1cnJlbnROb2RlID0gc3RhcnROb2RlO1xuICBmbihkYXRhKTtcblxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydFBhdGNoRWxlbWVudE5vRXh0cmFzKHN0YXJ0Tm9kZSwgY3VycmVudE5vZGUsIGV4cGVjdGVkTmV4dE5vZGUsIGV4cGVjdGVkUHJldk5vZGUpO1xuICB9XG5cbiAgaWYgKG5vZGUgIT09IGN1cnJlbnROb2RlICYmIG5vZGUucGFyZW50Tm9kZSkge1xuICAgIHJlbW92ZUNoaWxkKGN1cnJlbnRQYXJlbnQsIG5vZGUsIGdldERhdGEoY3VycmVudFBhcmVudCkua2V5TWFwKTtcbiAgfVxuXG4gIHJldHVybiBzdGFydE5vZGUgPT09IGN1cnJlbnROb2RlID8gbnVsbCA6IGN1cnJlbnROb2RlO1xufSk7XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgb3Igbm90IHRoZSBjdXJyZW50IG5vZGUgbWF0Y2hlcyB0aGUgc3BlY2lmaWVkIG5vZGVOYW1lIGFuZFxuICoga2V5LlxuICpcbiAqIEBwYXJhbSB7IU5vZGV9IG1hdGNoTm9kZSBBIG5vZGUgdG8gbWF0Y2ggdGhlIGRhdGEgdG8uXG4gKiBAcGFyYW0gez9zdHJpbmd9IG5vZGVOYW1lIFRoZSBub2RlTmFtZSBmb3IgdGhpcyBub2RlLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IEFuIG9wdGlvbmFsIGtleSB0aGF0IGlkZW50aWZpZXMgYSBub2RlLlxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgbm9kZSBtYXRjaGVzLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbnZhciBtYXRjaGVzID0gZnVuY3Rpb24gKG1hdGNoTm9kZSwgbm9kZU5hbWUsIGtleSkge1xuICB2YXIgZGF0YSA9IGdldERhdGEobWF0Y2hOb2RlKTtcblxuICAvLyBLZXkgY2hlY2sgaXMgZG9uZSB1c2luZyBkb3VibGUgZXF1YWxzIGFzIHdlIHdhbnQgdG8gdHJlYXQgYSBudWxsIGtleSB0aGVcbiAgLy8gc2FtZSBhcyB1bmRlZmluZWQuIFRoaXMgc2hvdWxkIGJlIG9rYXkgYXMgdGhlIG9ubHkgdmFsdWVzIGFsbG93ZWQgYXJlXG4gIC8vIHN0cmluZ3MsIG51bGwgYW5kIHVuZGVmaW5lZCBzbyB0aGUgPT0gc2VtYW50aWNzIGFyZSBub3QgdG9vIHdlaXJkLlxuICByZXR1cm4gbm9kZU5hbWUgPT09IGRhdGEubm9kZU5hbWUgJiYga2V5ID09IGRhdGEua2V5O1xufTtcblxuLyoqXG4gKiBBbGlnbnMgdGhlIHZpcnR1YWwgRWxlbWVudCBkZWZpbml0aW9uIHdpdGggdGhlIGFjdHVhbCBET00sIG1vdmluZyB0aGVcbiAqIGNvcnJlc3BvbmRpbmcgRE9NIG5vZGUgdG8gdGhlIGNvcnJlY3QgbG9jYXRpb24gb3IgY3JlYXRpbmcgaXQgaWYgbmVjZXNzYXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVOYW1lIEZvciBhbiBFbGVtZW50LCB0aGlzIHNob3VsZCBiZSBhIHZhbGlkIHRhZyBzdHJpbmcuXG4gKiAgICAgRm9yIGEgVGV4dCwgdGhpcyBzaG91bGQgYmUgI3RleHQuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC5cbiAqL1xudmFyIGFsaWduV2l0aERPTSA9IGZ1bmN0aW9uIChub2RlTmFtZSwga2V5KSB7XG4gIGlmIChjdXJyZW50Tm9kZSAmJiBtYXRjaGVzKGN1cnJlbnROb2RlLCBub2RlTmFtZSwga2V5KSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBwYXJlbnREYXRhID0gZ2V0RGF0YShjdXJyZW50UGFyZW50KTtcbiAgdmFyIGN1cnJlbnROb2RlRGF0YSA9IGN1cnJlbnROb2RlICYmIGdldERhdGEoY3VycmVudE5vZGUpO1xuICB2YXIga2V5TWFwID0gcGFyZW50RGF0YS5rZXlNYXA7XG4gIHZhciBub2RlID0gdW5kZWZpbmVkO1xuXG4gIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgbm9kZSBoYXMgbW92ZWQgd2l0aGluIHRoZSBwYXJlbnQuXG4gIGlmIChrZXkpIHtcbiAgICB2YXIga2V5Tm9kZSA9IGtleU1hcFtrZXldO1xuICAgIGlmIChrZXlOb2RlKSB7XG4gICAgICBpZiAobWF0Y2hlcyhrZXlOb2RlLCBub2RlTmFtZSwga2V5KSkge1xuICAgICAgICBub2RlID0ga2V5Tm9kZTtcbiAgICAgIH0gZWxzZSBpZiAoa2V5Tm9kZSA9PT0gY3VycmVudE5vZGUpIHtcbiAgICAgICAgY29udGV4dC5tYXJrRGVsZXRlZChrZXlOb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlbW92ZUNoaWxkKGN1cnJlbnRQYXJlbnQsIGtleU5vZGUsIGtleU1hcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQ3JlYXRlIHRoZSBub2RlIGlmIGl0IGRvZXNuJ3QgZXhpc3QuXG4gIGlmICghbm9kZSkge1xuICAgIGlmIChub2RlTmFtZSA9PT0gJyN0ZXh0Jykge1xuICAgICAgbm9kZSA9IGNyZWF0ZVRleHQoZG9jKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZSA9IGNyZWF0ZUVsZW1lbnQoZG9jLCBjdXJyZW50UGFyZW50LCBub2RlTmFtZSwga2V5KTtcbiAgICB9XG5cbiAgICBpZiAoa2V5KSB7XG4gICAgICBrZXlNYXBba2V5XSA9IG5vZGU7XG4gICAgfVxuXG4gICAgY29udGV4dC5tYXJrQ3JlYXRlZChub2RlKTtcbiAgfVxuXG4gIC8vIFJlLW9yZGVyIHRoZSBub2RlIGludG8gdGhlIHJpZ2h0IHBvc2l0aW9uLCBwcmVzZXJ2aW5nIGZvY3VzIGlmIGVpdGhlclxuICAvLyBub2RlIG9yIGN1cnJlbnROb2RlIGFyZSBmb2N1c2VkIGJ5IG1ha2luZyBzdXJlIHRoYXQgdGhleSBhcmUgbm90IGRldGFjaGVkXG4gIC8vIGZyb20gdGhlIERPTS5cbiAgaWYgKGdldERhdGEobm9kZSkuZm9jdXNlZCkge1xuICAgIC8vIE1vdmUgZXZlcnl0aGluZyBlbHNlIGJlZm9yZSB0aGUgbm9kZS5cbiAgICBtb3ZlQmVmb3JlKGN1cnJlbnRQYXJlbnQsIG5vZGUsIGN1cnJlbnROb2RlKTtcbiAgfSBlbHNlIGlmIChjdXJyZW50Tm9kZURhdGEgJiYgY3VycmVudE5vZGVEYXRhLmtleSAmJiAhY3VycmVudE5vZGVEYXRhLmZvY3VzZWQpIHtcbiAgICAvLyBSZW1vdmUgdGhlIGN1cnJlbnROb2RlLCB3aGljaCBjYW4gYWx3YXlzIGJlIGFkZGVkIGJhY2sgc2luY2Ugd2UgaG9sZCBhXG4gICAgLy8gcmVmZXJlbmNlIHRocm91Z2ggdGhlIGtleU1hcC4gVGhpcyBwcmV2ZW50cyBhIGxhcmdlIG51bWJlciBvZiBtb3ZlcyB3aGVuXG4gICAgLy8gYSBrZXllZCBpdGVtIGlzIHJlbW92ZWQgb3IgbW92ZWQgYmFja3dhcmRzIGluIHRoZSBET00uXG4gICAgY3VycmVudFBhcmVudC5yZXBsYWNlQ2hpbGQobm9kZSwgY3VycmVudE5vZGUpO1xuICAgIHBhcmVudERhdGEua2V5TWFwVmFsaWQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBjdXJyZW50UGFyZW50Lmluc2VydEJlZm9yZShub2RlLCBjdXJyZW50Tm9kZSk7XG4gIH1cblxuICBjdXJyZW50Tm9kZSA9IG5vZGU7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7P05vZGV9IG5vZGVcbiAqIEBwYXJhbSB7P05vZGV9IGNoaWxkXG4gKiBAcGFyYW0gez9PYmplY3Q8c3RyaW5nLCAhRWxlbWVudD59IGtleU1hcFxuICovXG52YXIgcmVtb3ZlQ2hpbGQgPSBmdW5jdGlvbiAobm9kZSwgY2hpbGQsIGtleU1hcCkge1xuICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgY29udGV4dC5tYXJrRGVsZXRlZCggLyoqIEB0eXBlIHshTm9kZX0qL2NoaWxkKTtcblxuICB2YXIga2V5ID0gZ2V0RGF0YShjaGlsZCkua2V5O1xuICBpZiAoa2V5KSB7XG4gICAgZGVsZXRlIGtleU1hcFtrZXldO1xuICB9XG59O1xuXG4vKipcbiAqIENsZWFycyBvdXQgYW55IHVudmlzaXRlZCBOb2RlcywgYXMgdGhlIGNvcnJlc3BvbmRpbmcgdmlydHVhbCBlbGVtZW50XG4gKiBmdW5jdGlvbnMgd2VyZSBuZXZlciBjYWxsZWQgZm9yIHRoZW0uXG4gKi9cbnZhciBjbGVhclVudmlzaXRlZERPTSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5vZGUgPSBjdXJyZW50UGFyZW50O1xuICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG4gIHZhciBrZXlNYXAgPSBkYXRhLmtleU1hcDtcbiAgdmFyIGtleU1hcFZhbGlkID0gZGF0YS5rZXlNYXBWYWxpZDtcbiAgdmFyIGNoaWxkID0gbm9kZS5sYXN0Q2hpbGQ7XG4gIHZhciBrZXkgPSB1bmRlZmluZWQ7XG5cbiAgaWYgKGNoaWxkID09PSBjdXJyZW50Tm9kZSAmJiBrZXlNYXBWYWxpZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHdoaWxlIChjaGlsZCAhPT0gY3VycmVudE5vZGUpIHtcbiAgICByZW1vdmVDaGlsZChub2RlLCBjaGlsZCwga2V5TWFwKTtcbiAgICBjaGlsZCA9IG5vZGUubGFzdENoaWxkO1xuICB9XG5cbiAgLy8gQ2xlYW4gdGhlIGtleU1hcCwgcmVtb3ZpbmcgYW55IHVudXN1ZWQga2V5cy5cbiAgaWYgKCFrZXlNYXBWYWxpZCkge1xuICAgIGZvciAoa2V5IGluIGtleU1hcCkge1xuICAgICAgY2hpbGQgPSBrZXlNYXBba2V5XTtcbiAgICAgIGlmIChjaGlsZC5wYXJlbnROb2RlICE9PSBub2RlKSB7XG4gICAgICAgIGNvbnRleHQubWFya0RlbGV0ZWQoY2hpbGQpO1xuICAgICAgICBkZWxldGUga2V5TWFwW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGF0YS5rZXlNYXBWYWxpZCA9IHRydWU7XG4gIH1cbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0byB0aGUgZmlyc3QgY2hpbGQgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAqL1xudmFyIGVudGVyTm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgY3VycmVudFBhcmVudCA9IGN1cnJlbnROb2RlO1xuICBjdXJyZW50Tm9kZSA9IG51bGw7XG59O1xuXG4vKipcbiAqIEByZXR1cm4gez9Ob2RlfSBUaGUgbmV4dCBOb2RlIHRvIGJlIHBhdGNoZWQuXG4gKi9cbnZhciBnZXROZXh0Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKGN1cnJlbnROb2RlKSB7XG4gICAgcmV0dXJuIGN1cnJlbnROb2RlLm5leHRTaWJsaW5nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjdXJyZW50UGFyZW50LmZpcnN0Q2hpbGQ7XG4gIH1cbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbnZhciBuZXh0Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgY3VycmVudE5vZGUgPSBnZXROZXh0Tm9kZSgpO1xufTtcblxuLyoqXG4gKiBDaGFuZ2VzIHRvIHRoZSBwYXJlbnQgb2YgdGhlIGN1cnJlbnQgbm9kZSwgcmVtb3ZpbmcgYW55IHVudmlzaXRlZCBjaGlsZHJlbi5cbiAqL1xudmFyIGV4aXROb2RlID0gZnVuY3Rpb24gKCkge1xuICBjbGVhclVudmlzaXRlZERPTSgpO1xuXG4gIGN1cnJlbnROb2RlID0gY3VycmVudFBhcmVudDtcbiAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnQucGFyZW50Tm9kZTtcbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IHRoZSBjdXJyZW50IG5vZGUgaXMgYW4gRWxlbWVudCB3aXRoIGEgbWF0Y2hpbmcgdGFnTmFtZSBhbmRcbiAqIGtleS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgY29yZUVsZW1lbnRPcGVuID0gZnVuY3Rpb24gKHRhZywga2V5KSB7XG4gIG5leHROb2RlKCk7XG4gIGFsaWduV2l0aERPTSh0YWcsIGtleSk7XG4gIGVudGVyTm9kZSgpO1xuICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovY3VycmVudFBhcmVudFxuICApO1xufTtcblxuLyoqXG4gKiBDbG9zZXMgdGhlIGN1cnJlbnRseSBvcGVuIEVsZW1lbnQsIHJlbW92aW5nIGFueSB1bnZpc2l0ZWQgY2hpbGRyZW4gaWZcbiAqIG5lY2Vzc2FyeS5cbiAqXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGNvcmVFbGVtZW50Q2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgc2V0SW5Ta2lwKGZhbHNlKTtcbiAgfVxuXG4gIGV4aXROb2RlKCk7XG4gIHJldHVybiAoLyoqIEB0eXBlIHshRWxlbWVudH0gKi9jdXJyZW50Tm9kZVxuICApO1xufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoZSBjdXJyZW50IG5vZGUgaXMgYSBUZXh0IG5vZGUgYW5kIGNyZWF0ZXMgYSBUZXh0IG5vZGUgaWYgaXQgaXNcbiAqIG5vdC5cbiAqXG4gKiBAcmV0dXJuIHshVGV4dH0gVGhlIGNvcnJlc3BvbmRpbmcgVGV4dCBOb2RlLlxuICovXG52YXIgY29yZVRleHQgPSBmdW5jdGlvbiAoKSB7XG4gIG5leHROb2RlKCk7XG4gIGFsaWduV2l0aERPTSgnI3RleHQnLCBudWxsKTtcbiAgcmV0dXJuICgvKiogQHR5cGUgeyFUZXh0fSAqL2N1cnJlbnROb2RlXG4gICk7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIGN1cnJlbnQgRWxlbWVudCBiZWluZyBwYXRjaGVkLlxuICogQHJldHVybiB7IUVsZW1lbnR9XG4gKi9cbnZhciBjdXJyZW50RWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRJblBhdGNoKCdjdXJyZW50RWxlbWVudCcsIGNvbnRleHQpO1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygnY3VycmVudEVsZW1lbnQnKTtcbiAgfVxuICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovY3VycmVudFBhcmVudFxuICApO1xufTtcblxuLyoqXG4gKiBAcmV0dXJuIHtOb2RlfSBUaGUgTm9kZSB0aGF0IHdpbGwgYmUgZXZhbHVhdGVkIGZvciB0aGUgbmV4dCBpbnN0cnVjdGlvbi5cbiAqL1xudmFyIGN1cnJlbnRQb2ludGVyID0gZnVuY3Rpb24gKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydEluUGF0Y2goJ2N1cnJlbnRQb2ludGVyJywgY29udGV4dCk7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCdjdXJyZW50UG9pbnRlcicpO1xuICB9XG4gIHJldHVybiBnZXROZXh0Tm9kZSgpO1xufTtcblxuLyoqXG4gKiBTa2lwcyB0aGUgY2hpbGRyZW4gaW4gYSBzdWJ0cmVlLCBhbGxvd2luZyBhbiBFbGVtZW50IHRvIGJlIGNsb3NlZCB3aXRob3V0XG4gKiBjbGVhcmluZyBvdXQgdGhlIGNoaWxkcmVuLlxuICovXG52YXIgc2tpcCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnROb0NoaWxkcmVuRGVjbGFyZWRZZXQoJ3NraXAnLCBjdXJyZW50Tm9kZSk7XG4gICAgc2V0SW5Ta2lwKHRydWUpO1xuICB9XG4gIGN1cnJlbnROb2RlID0gY3VycmVudFBhcmVudC5sYXN0Q2hpbGQ7XG59O1xuXG4vKipcbiAqIFNraXBzIHRoZSBuZXh0IE5vZGUgdG8gYmUgcGF0Y2hlZCwgbW92aW5nIHRoZSBwb2ludGVyIGZvcndhcmQgdG8gdGhlIG5leHRcbiAqIHNpYmxpbmcgb2YgdGhlIGN1cnJlbnQgcG9pbnRlci5cbiAqL1xudmFyIHNraXBOb2RlID0gbmV4dE5vZGU7XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqIEBjb25zdCAqL1xudmFyIHN5bWJvbHMgPSB7XG4gIGRlZmF1bHQ6ICdfX2RlZmF1bHQnXG59O1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtzdHJpbmd8dW5kZWZpbmVkfSBUaGUgbmFtZXNwYWNlIHRvIHVzZSBmb3IgdGhlIGF0dHJpYnV0ZS5cbiAqL1xudmFyIGdldE5hbWVzcGFjZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIGlmIChuYW1lLmxhc3RJbmRleE9mKCd4bWw6JywgMCkgPT09IDApIHtcbiAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnL1hNTC8xOTk4L25hbWVzcGFjZSc7XG4gIH1cblxuICBpZiAobmFtZS5sYXN0SW5kZXhPZigneGxpbms6JywgMCkgPT09IDApIHtcbiAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnO1xuICB9XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgYW4gYXR0cmlidXRlIG9yIHByb3BlcnR5IHRvIGEgZ2l2ZW4gRWxlbWVudC4gSWYgdGhlIHZhbHVlIGlzIG51bGxcbiAqIG9yIHVuZGVmaW5lZCwgaXQgaXMgcmVtb3ZlZCBmcm9tIHRoZSBFbGVtZW50LiBPdGhlcndpc2UsIHRoZSB2YWx1ZSBpcyBzZXRcbiAqIGFzIGFuIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Pyhib29sZWFufG51bWJlcnxzdHJpbmcpPX0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLlxuICovXG52YXIgYXBwbHlBdHRyID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgYXR0ck5TID0gZ2V0TmFtZXNwYWNlKG5hbWUpO1xuICAgIGlmIChhdHRyTlMpIHtcbiAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKGF0dHJOUywgbmFtZSwgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBBcHBsaWVzIGEgcHJvcGVydHkgdG8gYSBnaXZlbiBFbGVtZW50LlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBwcm9wZXJ0eSdzIG5hbWUuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBwcm9wZXJ0eSdzIHZhbHVlLlxuICovXG52YXIgYXBwbHlQcm9wID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICBlbFtuYW1lXSA9IHZhbHVlO1xufTtcblxuLyoqXG4gKiBBcHBsaWVzIGEgdmFsdWUgdG8gYSBzdHlsZSBkZWNsYXJhdGlvbi4gU3VwcG9ydHMgQ1NTIGN1c3RvbSBwcm9wZXJ0aWVzIGJ5XG4gKiBzZXR0aW5nIHByb3BlcnRpZXMgY29udGFpbmluZyBhIGRhc2ggdXNpbmcgQ1NTU3R5bGVEZWNsYXJhdGlvbi5zZXRQcm9wZXJ0eS5cbiAqIEBwYXJhbSB7Q1NTU3R5bGVEZWNsYXJhdGlvbn0gc3R5bGVcbiAqIEBwYXJhbSB7IXN0cmluZ30gcHJvcFxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICovXG52YXIgc2V0U3R5bGVWYWx1ZSA9IGZ1bmN0aW9uIChzdHlsZSwgcHJvcCwgdmFsdWUpIHtcbiAgaWYgKHByb3AuaW5kZXhPZignLScpID49IDApIHtcbiAgICBzdHlsZS5zZXRQcm9wZXJ0eShwcm9wLCAvKiogQHR5cGUge3N0cmluZ30gKi92YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgc3R5bGVbcHJvcF0gPSB2YWx1ZTtcbiAgfVxufTtcblxuLyoqXG4gKiBBcHBsaWVzIGEgc3R5bGUgdG8gYW4gRWxlbWVudC4gTm8gdmVuZG9yIHByZWZpeCBleHBhbnNpb24gaXMgZG9uZSBmb3JcbiAqIHByb3BlcnR5IG5hbWVzL3ZhbHVlcy5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Kn0gc3R5bGUgVGhlIHN0eWxlIHRvIHNldC4gRWl0aGVyIGEgc3RyaW5nIG9mIGNzcyBvciBhbiBvYmplY3RcbiAqICAgICBjb250YWluaW5nIHByb3BlcnR5LXZhbHVlIHBhaXJzLlxuICovXG52YXIgYXBwbHlTdHlsZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgc3R5bGUpIHtcbiAgaWYgKHR5cGVvZiBzdHlsZSA9PT0gJ3N0cmluZycpIHtcbiAgICBlbC5zdHlsZS5jc3NUZXh0ID0gc3R5bGU7XG4gIH0gZWxzZSB7XG4gICAgZWwuc3R5bGUuY3NzVGV4dCA9ICcnO1xuICAgIHZhciBlbFN0eWxlID0gZWwuc3R5bGU7XG4gICAgdmFyIG9iaiA9IC8qKiBAdHlwZSB7IU9iamVjdDxzdHJpbmcsc3RyaW5nPn0gKi9zdHlsZTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICBpZiAoaGFzKG9iaiwgcHJvcCkpIHtcbiAgICAgICAgc2V0U3R5bGVWYWx1ZShlbFN0eWxlLCBwcm9wLCBvYmpbcHJvcF0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBVcGRhdGVzIGEgc2luZ2xlIGF0dHJpYnV0ZSBvbiBhbiBFbGVtZW50LlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuIElmIHRoZSB2YWx1ZSBpcyBhbiBvYmplY3Qgb3JcbiAqICAgICBmdW5jdGlvbiBpdCBpcyBzZXQgb24gdGhlIEVsZW1lbnQsIG90aGVyd2lzZSwgaXQgaXMgc2V0IGFzIGFuIEhUTUxcbiAqICAgICBhdHRyaWJ1dGUuXG4gKi9cbnZhciBhcHBseUF0dHJpYnV0ZVR5cGVkID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcblxuICBpZiAodHlwZSA9PT0gJ29iamVjdCcgfHwgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGFwcGx5UHJvcChlbCwgbmFtZSwgdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIGFwcGx5QXR0cihlbCwgbmFtZSwgLyoqIEB0eXBlIHs/KGJvb2xlYW58bnVtYmVyfHN0cmluZyl9ICovdmFsdWUpO1xuICB9XG59O1xuXG4vKipcbiAqIENhbGxzIHRoZSBhcHByb3ByaWF0ZSBhdHRyaWJ1dGUgbXV0YXRvciBmb3IgdGhpcyBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS5cbiAqL1xudmFyIHVwZGF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKGVsKTtcbiAgdmFyIGF0dHJzID0gZGF0YS5hdHRycztcblxuICBpZiAoYXR0cnNbbmFtZV0gPT09IHZhbHVlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIG11dGF0b3IgPSBhdHRyaWJ1dGVzW25hbWVdIHx8IGF0dHJpYnV0ZXNbc3ltYm9scy5kZWZhdWx0XTtcbiAgbXV0YXRvcihlbCwgbmFtZSwgdmFsdWUpO1xuXG4gIGF0dHJzW25hbWVdID0gdmFsdWU7XG59O1xuXG4vKipcbiAqIEEgcHVibGljbHkgbXV0YWJsZSBvYmplY3QgdG8gcHJvdmlkZSBjdXN0b20gbXV0YXRvcnMgZm9yIGF0dHJpYnV0ZXMuXG4gKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCBmdW5jdGlvbighRWxlbWVudCwgc3RyaW5nLCAqKT59XG4gKi9cbnZhciBhdHRyaWJ1dGVzID0gY3JlYXRlTWFwKCk7XG5cbi8vIFNwZWNpYWwgZ2VuZXJpYyBtdXRhdG9yIHRoYXQncyBjYWxsZWQgZm9yIGFueSBhdHRyaWJ1dGUgdGhhdCBkb2VzIG5vdFxuLy8gaGF2ZSBhIHNwZWNpZmljIG11dGF0b3IuXG5hdHRyaWJ1dGVzW3N5bWJvbHMuZGVmYXVsdF0gPSBhcHBseUF0dHJpYnV0ZVR5cGVkO1xuXG5hdHRyaWJ1dGVzWydzdHlsZSddID0gYXBwbHlTdHlsZTtcblxuLyoqXG4gKiBUaGUgb2Zmc2V0IGluIHRoZSB2aXJ0dWFsIGVsZW1lbnQgZGVjbGFyYXRpb24gd2hlcmUgdGhlIGF0dHJpYnV0ZXMgYXJlXG4gKiBzcGVjaWZpZWQuXG4gKiBAY29uc3RcbiAqL1xudmFyIEFUVFJJQlVURVNfT0ZGU0VUID0gMztcblxuLyoqXG4gKiBCdWlsZHMgYW4gYXJyYXkgb2YgYXJndW1lbnRzIGZvciB1c2Ugd2l0aCBlbGVtZW50T3BlblN0YXJ0LCBhdHRyIGFuZFxuICogZWxlbWVudE9wZW5FbmQuXG4gKiBAY29uc3Qge0FycmF5PCo+fVxuICovXG52YXIgYXJnc0J1aWxkZXIgPSBbXTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAqIEBwYXJhbSB7Li4uKn0gdmFyX2FyZ3MsIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAqICAgICBmb3IgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGVsZW1lbnRPcGVuID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCB2YXJfYXJncykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygnZWxlbWVudE9wZW4nKTtcbiAgICBhc3NlcnROb3RJblNraXAoJ2VsZW1lbnRPcGVuJyk7XG4gIH1cblxuICB2YXIgbm9kZSA9IGNvcmVFbGVtZW50T3Blbih0YWcsIGtleSk7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcblxuICBpZiAoIWRhdGEuc3RhdGljc0FwcGxpZWQpIHtcbiAgICBpZiAoc3RhdGljcykge1xuICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IHN0YXRpY3MubGVuZ3RoOyBfaSArPSAyKSB7XG4gICAgICAgIHZhciBuYW1lID0gLyoqIEB0eXBlIHtzdHJpbmd9ICovc3RhdGljc1tfaV07XG4gICAgICAgIHZhciB2YWx1ZSA9IHN0YXRpY3NbX2kgKyAxXTtcbiAgICAgICAgdXBkYXRlQXR0cmlidXRlKG5vZGUsIG5hbWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gRG93biB0aGUgcm9hZCwgd2UgbWF5IHdhbnQgdG8ga2VlcCB0cmFjayBvZiB0aGUgc3RhdGljcyBhcnJheSB0byB1c2UgaXRcbiAgICAvLyBhcyBhbiBhZGRpdGlvbmFsIHNpZ25hbCBhYm91dCB3aGV0aGVyIGEgbm9kZSBtYXRjaGVzIG9yIG5vdC4gRm9yIG5vdyxcbiAgICAvLyBqdXN0IHVzZSBhIG1hcmtlciBzbyB0aGF0IHdlIGRvIG5vdCByZWFwcGx5IHN0YXRpY3MuXG4gICAgZGF0YS5zdGF0aWNzQXBwbGllZCA9IHRydWU7XG4gIH1cblxuICAvKlxuICAgKiBDaGVja3MgdG8gc2VlIGlmIG9uZSBvciBtb3JlIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkIGZvciBhIGdpdmVuIEVsZW1lbnQuXG4gICAqIFdoZW4gbm8gYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQsIHRoaXMgaXMgbXVjaCBmYXN0ZXIgdGhhbiBjaGVja2luZyBlYWNoXG4gICAqIGluZGl2aWR1YWwgYXJndW1lbnQuIFdoZW4gYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQsIHRoZSBvdmVyaGVhZCBvZiB0aGlzIGlzXG4gICAqIG1pbmltYWwuXG4gICAqL1xuICB2YXIgYXR0cnNBcnIgPSBkYXRhLmF0dHJzQXJyO1xuICB2YXIgbmV3QXR0cnMgPSBkYXRhLm5ld0F0dHJzO1xuICB2YXIgaXNOZXcgPSAhYXR0cnNBcnIubGVuZ3RoO1xuICB2YXIgaSA9IEFUVFJJQlVURVNfT0ZGU0VUO1xuICB2YXIgaiA9IDA7XG5cbiAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDIsIGogKz0gMikge1xuICAgIHZhciBfYXR0ciA9IGFyZ3VtZW50c1tpXTtcbiAgICBpZiAoaXNOZXcpIHtcbiAgICAgIGF0dHJzQXJyW2pdID0gX2F0dHI7XG4gICAgICBuZXdBdHRyc1tfYXR0cl0gPSB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIGlmIChhdHRyc0FycltqXSAhPT0gX2F0dHIpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciB2YWx1ZSA9IGFyZ3VtZW50c1tpICsgMV07XG4gICAgaWYgKGlzTmV3IHx8IGF0dHJzQXJyW2ogKyAxXSAhPT0gdmFsdWUpIHtcbiAgICAgIGF0dHJzQXJyW2ogKyAxXSA9IHZhbHVlO1xuICAgICAgdXBkYXRlQXR0cmlidXRlKG5vZGUsIF9hdHRyLCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGkgPCBhcmd1bWVudHMubGVuZ3RoIHx8IGogPCBhdHRyc0Fyci5sZW5ndGgpIHtcbiAgICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSwgaiArPSAxKSB7XG4gICAgICBhdHRyc0FycltqXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBpZiAoaiA8IGF0dHJzQXJyLmxlbmd0aCkge1xuICAgICAgYXR0cnNBcnIubGVuZ3RoID0gajtcbiAgICB9XG5cbiAgICAvKlxuICAgICAqIEFjdHVhbGx5IHBlcmZvcm0gdGhlIGF0dHJpYnV0ZSB1cGRhdGUuXG4gICAgICovXG4gICAgZm9yIChpID0gMDsgaSA8IGF0dHJzQXJyLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICB2YXIgbmFtZSA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqL2F0dHJzQXJyW2ldO1xuICAgICAgdmFyIHZhbHVlID0gYXR0cnNBcnJbaSArIDFdO1xuICAgICAgbmV3QXR0cnNbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBfYXR0cjIgaW4gbmV3QXR0cnMpIHtcbiAgICAgIHVwZGF0ZUF0dHJpYnV0ZShub2RlLCBfYXR0cjIsIG5ld0F0dHJzW19hdHRyMl0pO1xuICAgICAgbmV3QXR0cnNbX2F0dHIyXSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn07XG5cbi8qKlxuICogRGVjbGFyZXMgYSB2aXJ0dWFsIEVsZW1lbnQgYXQgdGhlIGN1cnJlbnQgbG9jYXRpb24gaW4gdGhlIGRvY3VtZW50LiBUaGlzXG4gKiBjb3JyZXNwb25kcyB0byBhbiBvcGVuaW5nIHRhZyBhbmQgYSBlbGVtZW50Q2xvc2UgdGFnIGlzIHJlcXVpcmVkLiBUaGlzIGlzXG4gKiBsaWtlIGVsZW1lbnRPcGVuLCBidXQgdGhlIGF0dHJpYnV0ZXMgYXJlIGRlZmluZWQgdXNpbmcgdGhlIGF0dHIgZnVuY3Rpb25cbiAqIHJhdGhlciB0aGFuIGJlaW5nIHBhc3NlZCBhcyBhcmd1bWVudHMuIE11c3QgYmUgZm9sbGxvd2VkIGJ5IDAgb3IgbW9yZSBjYWxsc1xuICogdG8gYXR0ciwgdGhlbiBhIGNhbGwgdG8gZWxlbWVudE9wZW5FbmQuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAqL1xudmFyIGVsZW1lbnRPcGVuU3RhcnQgPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoJ2VsZW1lbnRPcGVuU3RhcnQnKTtcbiAgICBzZXRJbkF0dHJpYnV0ZXModHJ1ZSk7XG4gIH1cblxuICBhcmdzQnVpbGRlclswXSA9IHRhZztcbiAgYXJnc0J1aWxkZXJbMV0gPSBrZXk7XG4gIGFyZ3NCdWlsZGVyWzJdID0gc3RhdGljcztcbn07XG5cbi8qKipcbiAqIERlZmluZXMgYSB2aXJ0dWFsIGF0dHJpYnV0ZSBhdCB0aGlzIHBvaW50IG9mIHRoZSBET00uIFRoaXMgaXMgb25seSB2YWxpZFxuICogd2hlbiBjYWxsZWQgYmV0d2VlbiBlbGVtZW50T3BlblN0YXJ0IGFuZCBlbGVtZW50T3BlbkVuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICovXG52YXIgYXR0ciA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydEluQXR0cmlidXRlcygnYXR0cicpO1xuICB9XG5cbiAgYXJnc0J1aWxkZXIucHVzaChuYW1lKTtcbiAgYXJnc0J1aWxkZXIucHVzaCh2YWx1ZSk7XG59O1xuXG4vKipcbiAqIENsb3NlcyBhbiBvcGVuIHRhZyBzdGFydGVkIHdpdGggZWxlbWVudE9wZW5TdGFydC5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgZWxlbWVudE9wZW5FbmQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0SW5BdHRyaWJ1dGVzKCdlbGVtZW50T3BlbkVuZCcpO1xuICAgIHNldEluQXR0cmlidXRlcyhmYWxzZSk7XG4gIH1cblxuICB2YXIgbm9kZSA9IGVsZW1lbnRPcGVuLmFwcGx5KG51bGwsIGFyZ3NCdWlsZGVyKTtcbiAgYXJnc0J1aWxkZXIubGVuZ3RoID0gMDtcbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIENsb3NlcyBhbiBvcGVuIHZpcnR1YWwgRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBlbGVtZW50Q2xvc2UgPSBmdW5jdGlvbiAodGFnKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCdlbGVtZW50Q2xvc2UnKTtcbiAgfVxuXG4gIHZhciBub2RlID0gY29yZUVsZW1lbnRDbG9zZSgpO1xuXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Q2xvc2VNYXRjaGVzT3BlblRhZyhnZXREYXRhKG5vZGUpLm5vZGVOYW1lLCB0YWcpO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudCB0aGF0IGhhc1xuICogbm8gY2hpbGRyZW4uXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAqIEBwYXJhbSB7Li4uKn0gdmFyX2FyZ3MgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICogICAgIGZvciB0aGUgRWxlbWVudC5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgZWxlbWVudFZvaWQgPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MsIHZhcl9hcmdzKSB7XG4gIGVsZW1lbnRPcGVuLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gIHJldHVybiBlbGVtZW50Q2xvc2UodGFnKTtcbn07XG5cbi8qKlxuICogRGVjbGFyZXMgYSB2aXJ0dWFsIFRleHQgYXQgdGhpcyBwb2ludCBpbiB0aGUgZG9jdW1lbnQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfGJvb2xlYW59IHZhbHVlIFRoZSB2YWx1ZSBvZiB0aGUgVGV4dC5cbiAqIEBwYXJhbSB7Li4uKGZ1bmN0aW9uKChzdHJpbmd8bnVtYmVyfGJvb2xlYW4pKTpzdHJpbmcpfSB2YXJfYXJnc1xuICogICAgIEZ1bmN0aW9ucyB0byBmb3JtYXQgdGhlIHZhbHVlIHdoaWNoIGFyZSBjYWxsZWQgb25seSB3aGVuIHRoZSB2YWx1ZSBoYXNcbiAqICAgICBjaGFuZ2VkLlxuICogQHJldHVybiB7IVRleHR9IFRoZSBjb3JyZXNwb25kaW5nIHRleHQgbm9kZS5cbiAqL1xudmFyIHRleHQgPSBmdW5jdGlvbiAodmFsdWUsIHZhcl9hcmdzKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCd0ZXh0Jyk7XG4gICAgYXNzZXJ0Tm90SW5Ta2lwKCd0ZXh0Jyk7XG4gIH1cblxuICB2YXIgbm9kZSA9IGNvcmVUZXh0KCk7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcblxuICBpZiAoZGF0YS50ZXh0ICE9PSB2YWx1ZSkge1xuICAgIGRhdGEudGV4dCA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqL3ZhbHVlO1xuXG4gICAgdmFyIGZvcm1hdHRlZCA9IHZhbHVlO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAvKlxuICAgICAgICogQ2FsbCB0aGUgZm9ybWF0dGVyIGZ1bmN0aW9uIGRpcmVjdGx5IHRvIHByZXZlbnQgbGVha2luZyBhcmd1bWVudHMuXG4gICAgICAgKiBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2luY3JlbWVudGFsLWRvbS9wdWxsLzIwNCNpc3N1ZWNvbW1lbnQtMTc4MjIzNTc0XG4gICAgICAgKi9cbiAgICAgIHZhciBmbiA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGZvcm1hdHRlZCA9IGZuKGZvcm1hdHRlZCk7XG4gICAgfVxuXG4gICAgbm9kZS5kYXRhID0gZm9ybWF0dGVkO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59O1xuXG5leHBvcnRzLnBhdGNoID0gcGF0Y2hJbm5lcjtcbmV4cG9ydHMucGF0Y2hJbm5lciA9IHBhdGNoSW5uZXI7XG5leHBvcnRzLnBhdGNoT3V0ZXIgPSBwYXRjaE91dGVyO1xuZXhwb3J0cy5jdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50O1xuZXhwb3J0cy5jdXJyZW50UG9pbnRlciA9IGN1cnJlbnRQb2ludGVyO1xuZXhwb3J0cy5za2lwID0gc2tpcDtcbmV4cG9ydHMuc2tpcE5vZGUgPSBza2lwTm9kZTtcbmV4cG9ydHMuZWxlbWVudFZvaWQgPSBlbGVtZW50Vm9pZDtcbmV4cG9ydHMuZWxlbWVudE9wZW5TdGFydCA9IGVsZW1lbnRPcGVuU3RhcnQ7XG5leHBvcnRzLmVsZW1lbnRPcGVuRW5kID0gZWxlbWVudE9wZW5FbmQ7XG5leHBvcnRzLmVsZW1lbnRPcGVuID0gZWxlbWVudE9wZW47XG5leHBvcnRzLmVsZW1lbnRDbG9zZSA9IGVsZW1lbnRDbG9zZTtcbmV4cG9ydHMudGV4dCA9IHRleHQ7XG5leHBvcnRzLmF0dHIgPSBhdHRyO1xuZXhwb3J0cy5zeW1ib2xzID0gc3ltYm9scztcbmV4cG9ydHMuYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7XG5leHBvcnRzLmFwcGx5QXR0ciA9IGFwcGx5QXR0cjtcbmV4cG9ydHMuYXBwbHlQcm9wID0gYXBwbHlQcm9wO1xuZXhwb3J0cy5ub3RpZmljYXRpb25zID0gbm90aWZpY2F0aW9ucztcbmV4cG9ydHMuaW1wb3J0Tm9kZSA9IGltcG9ydE5vZGU7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluY3JlbWVudGFsLWRvbS1janMuanMubWFwIiwiJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZuKSB7XG4gIGNvbnN0IGFyciA9IFtdXG5cbiAgLyoqXG4gICAqIFByb3hpZWQgYXJyYXkgbXV0YXRvcnMgbWV0aG9kc1xuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuICBjb25zdCBwb3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gQXJyYXkucHJvdG90eXBlLnBvcC5hcHBseShhcnIpXG5cbiAgICBmbigncG9wJywgYXJyLCB7XG4gICAgICB2YWx1ZTogcmVzdWx0XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBjb25zdCBwdXNoID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGFyciwgYXJndW1lbnRzKVxuXG4gICAgZm4oJ3B1c2gnLCBhcnIsIHtcbiAgICAgIHZhbHVlOiByZXN1bHRcbiAgICB9KVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIGNvbnN0IHNoaWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IEFycmF5LnByb3RvdHlwZS5zaGlmdC5hcHBseShhcnIpXG5cbiAgICBmbignc2hpZnQnLCBhcnIsIHtcbiAgICAgIHZhbHVlOiByZXN1bHRcbiAgICB9KVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIGNvbnN0IHNvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gQXJyYXkucHJvdG90eXBlLnNvcnQuYXBwbHkoYXJyLCBhcmd1bWVudHMpXG5cbiAgICBmbignc29ydCcsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdFxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgY29uc3QgdW5zaGlmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUudW5zaGlmdC5hcHBseShhcnIsIGFyZ3VtZW50cylcblxuICAgIGZuKCd1bnNoaWZ0JywgYXJyLCB7XG4gICAgICB2YWx1ZTogcmVzdWx0XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBjb25zdCByZXZlcnNlID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IEFycmF5LnByb3RvdHlwZS5yZXZlcnNlLmFwcGx5KGFycilcblxuICAgIGZuKCdyZXZlcnNlJywgYXJyLCB7XG4gICAgICB2YWx1ZTogcmVzdWx0XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBjb25zdCBzcGxpY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmFwcGx5KGFyciwgYXJndW1lbnRzKVxuXG4gICAgZm4oJ3NwbGljZScsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdCxcbiAgICAgIHJlbW92ZWQ6IHJlc3VsdCxcbiAgICAgIGFkZGVkOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpXG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm94eSBhbGwgQXJyYXkucHJvdG90eXBlIG11dGF0b3IgbWV0aG9kcyBvbiB0aGlzIGFycmF5IGluc3RhbmNlXG4gICAqL1xuICBhcnIucG9wID0gYXJyLnBvcCAmJiBwb3BcbiAgYXJyLnB1c2ggPSBhcnIucHVzaCAmJiBwdXNoXG4gIGFyci5zaGlmdCA9IGFyci5zaGlmdCAmJiBzaGlmdFxuICBhcnIudW5zaGlmdCA9IGFyci51bnNoaWZ0ICYmIHVuc2hpZnRcbiAgYXJyLnNvcnQgPSBhcnIuc29ydCAmJiBzb3J0XG4gIGFyci5yZXZlcnNlID0gYXJyLnJldmVyc2UgJiYgcmV2ZXJzZVxuICBhcnIuc3BsaWNlID0gYXJyLnNwbGljZSAmJiBzcGxpY2VcblxuICAvKipcbiAgICogU3BlY2lhbCB1cGRhdGUgZnVuY3Rpb24gc2luY2Ugd2UgY2FuJ3QgZGV0ZWN0XG4gICAqIGFzc2lnbm1lbnQgYnkgaW5kZXggZS5nLiBhcnJbMF0gPSAnc29tZXRoaW5nJ1xuICAgKi9cbiAgYXJyLnNldCA9IGZ1bmN0aW9uIChpbmRleCwgdmFsdWUpIHtcbiAgICBjb25zdCBvbGRWYWx1ZSA9IGFycltpbmRleF1cbiAgICBjb25zdCBuZXdWYWx1ZSA9IGFycltpbmRleF0gPSB2YWx1ZVxuXG4gICAgZm4oJ3VwZGF0ZScsIGFyciwge1xuICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgdmFsdWU6IG5ld1ZhbHVlLFxuICAgICAgb2xkVmFsdWU6IG9sZFZhbHVlXG4gICAgfSlcblxuICAgIHJldHVybiBuZXdWYWx1ZVxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGFycmF5ID0gcmVxdWlyZSgnLi9hcnJheScpXG5cbmZ1bmN0aW9uIG1vZGVsIChzY2hlbWEpIHtcbiAgY29uc3QgcGF0aHMgPSBbXVxuICAvLyBjb25zdCByb290ID0gZWUoe30pXG4gIGNvbnN0IGNhbGxiYWNrcyA9IHt9XG5cbiAgY29uc3Qgcm9vdCA9IE9iamVjdC5jcmVhdGUoe30sIHtcbiAgICBvbjoge1xuICAgICAgdmFsdWU6IGZ1bmN0aW9uIChldmVudCwgc2VsZWN0b3IsIGZuKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBmbiA9IHNlbGVjdG9yXG4gICAgICAgICAgc2VsZWN0b3IgPSB1bmRlZmluZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY2FsbGJhY2tzW2V2ZW50XSkge1xuICAgICAgICAgIGNhbGxiYWNrc1tldmVudF0gPSBuZXcgTWFwKClcbiAgICAgICAgfVxuXG4gICAgICAgIGNhbGxiYWNrc1tldmVudF0uc2V0KHNlbGVjdG9yLCBmbilcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgZnVuY3Rpb24gZW1pdCAoZXZlbnQsIHNlbGVjdG9yLCBkZXRhaWxzKSB7XG4gICAgaWYgKGNhbGxiYWNrc1tldmVudF0pIHtcbiAgICAgIGNvbnN0IG1hcCA9IGNhbGxiYWNrc1tldmVudF1cblxuICAgICAgbWFwLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgaWYgKCgha2V5ICYmICFzZWxlY3RvcikgfHwgKGtleSA9PT0gc2VsZWN0b3IpKSB7XG4gICAgICAgICAgdmFsdWUuY2FsbChyb290LCBkZXRhaWxzKVxuICAgICAgICB9IGVsc2UgaWYgKGtleSBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBrZXkudGVzdChzZWxlY3RvcikpIHtcbiAgICAgICAgICB2YWx1ZS5jYWxsKHJvb3QsIGRldGFpbHMpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYXBwbHkgKHNjaGVtYSwgY3R4LCBwYXRoKSB7XG4gICAgaWYgKHNjaGVtYS5wcm9wZXJ0aWVzKSB7XG4gICAgICBwYXRocy5wdXNoKHBhdGgpXG4gICAgICBwYXRoID0gcGF0aHMuc2xpY2UoMSkuam9pbignLicpXG5cbiAgICAgIGNvbnN0IHByb3BzID0gc2NoZW1hLnByb3BlcnRpZXNcblxuICAgICAgZm9yIChsZXQga2V5IGluIHByb3BzKSB7XG4gICAgICAgIGNvbnN0IHByb3AgPSBwcm9wc1trZXldXG5cbiAgICAgICAgaWYgKHByb3AucHJvcGVydGllcykge1xuICAgICAgICAgIGNvbnN0IGNoaWxkID0ge31cbiAgICAgICAgICBhcHBseShwcm9wLCBjaGlsZCwga2V5KVxuICAgICAgICAgIGN0eFtrZXldID0gY2hpbGRcbiAgICAgICAgICBwYXRocy5wb3AoKVxuICAgICAgICB9IGVsc2UgaWYgKHByb3AuaXRlbXMpIHtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IGFycmF5KGZ1bmN0aW9uIChldmVudCwgYXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBwYXRoID8gcGF0aCArICcuJyArIGtleSA6IGtleVxuICAgICAgICAgICAgZW1pdChldmVudCwgbmFtZSwge1xuICAgICAgICAgICAgICBldmVudDogZXZlbnQsXG4gICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICBwYXRoOiBuYW1lLFxuICAgICAgICAgICAgICBjb250ZXh0OiBhcnIsXG4gICAgICAgICAgICAgIHJlc3VsdDogcmVzdWx0XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBlbWl0KCd1cGRhdGUnLCBudWxsLCB7XG4gICAgICAgICAgICAgIGV2ZW50OiBldmVudCxcbiAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgIHBhdGg6IG5hbWUsXG4gICAgICAgICAgICAgIGNvbnRleHQ6IGFycixcbiAgICAgICAgICAgICAgcmVzdWx0OiByZXN1bHRcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcbiAgICAgICAgICBjaGlsZC5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zdCBpdGVtID0ge31cbiAgICAgICAgICAgIGFwcGx5KHByb3AuaXRlbXMsIGl0ZW0sIHBhdGggPyBwYXRoICsgJy4nICsga2V5IDoga2V5KVxuICAgICAgICAgICAgcGF0aHMucG9wKClcbiAgICAgICAgICAgIHJldHVybiBpdGVtXG4gICAgICAgICAgfVxuICAgICAgICAgIGN0eFtrZXldID0gY2hpbGRcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZXQgdmFsID0gcHJvcC5kZWZhdWx0XG5cbiAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3R4LCBrZXksIHtcbiAgICAgICAgICAgIGdldCAoKSB7XG4gICAgICAgICAgICAgIHJldHVybiB2YWxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQgKHZhbHVlKSB7XG4gICAgICAgICAgICAgIGNvbnN0IG9sZFZhbHVlID0gdmFsXG5cbiAgICAgICAgICAgICAgdmFsID0gdmFsdWVcblxuICAgICAgICAgICAgICBjb25zdCBuYW1lID0gcGF0aCA/IHBhdGggKyAnLicgKyBrZXkgOiBrZXlcbiAgICAgICAgICAgICAgZW1pdCgnY2hhbmdlJywgbmFtZSwge1xuICAgICAgICAgICAgICAgIGV2ZW50OiAnY2hhbmdlJyxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICBwYXRoOiBuYW1lLFxuICAgICAgICAgICAgICAgIGNvbnRleHQ6IGN0eCxcbiAgICAgICAgICAgICAgICBvbGRWYWx1ZTogb2xkVmFsdWUsXG4gICAgICAgICAgICAgICAgbmV3VmFsdWU6IHZhbHVlXG4gICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgZW1pdCgndXBkYXRlJywgbnVsbCwge1xuICAgICAgICAgICAgICAgIGV2ZW50OiAndXBkYXRlJyxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICBwYXRoOiBuYW1lLFxuICAgICAgICAgICAgICAgIGNvbnRleHQ6IGN0eCxcbiAgICAgICAgICAgICAgICBvbGRWYWx1ZTogb2xkVmFsdWUsXG4gICAgICAgICAgICAgICAgbmV3VmFsdWU6IHZhbHVlXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhcHBseShzY2hlbWEsIHJvb3QsICcnKVxuXG4gIE9iamVjdC5mcmVlemUocm9vdClcblxuICByZXR1cm4gcm9vdFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1vZGVsXG4iLCIndXNlIHN0cmljdCdcblxuZnVuY3Rpb24gZmFjdG9yeSAoKSB7XG4gIGZ1bmN0aW9uIFByb3AgKHR5cGUpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUHJvcCkpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvcCh0eXBlKVxuICAgIH1cblxuICAgIHRoaXMuX190eXBlID0gdHlwZVxuICAgIHRoaXMuX192YWxpZGF0b3JzID0gW11cbiAgfVxuICBQcm9wLnByb3RvdHlwZS50eXBlID0gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICB0aGlzLl9fdHlwZSA9IHR5cGVcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLmVudW1lcmFibGUgPSBmdW5jdGlvbiAoZW51bWVyYWJsZSkge1xuICAgIHRoaXMuX19lbnVtZXJhYmxlID0gZW51bWVyYWJsZVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUuY29uZmlndXJhYmxlID0gZnVuY3Rpb24gKGNvbmZpZ3VyYWJsZSkge1xuICAgIHRoaXMuX19jb25maWd1cmFibGUgPSBjb25maWd1cmFibGVcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLndyaXRhYmxlID0gZnVuY3Rpb24gKHdyaXRhYmxlKSB7XG4gICAgdGhpcy5fX3dyaXRhYmxlID0gd3JpdGFibGVcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbiAoa2V5cykge1xuICAgIGlmICh0aGlzLl9fdHlwZSAhPT0gQXJyYXkpIHtcbiAgICAgIHRoaXMuX190eXBlID0gT2JqZWN0XG4gICAgfVxuICAgIGZvciAodmFyIGtleSBpbiBrZXlzKSB7XG4gICAgICB0aGlzW2tleV0gPSBrZXlzW2tleV1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uIChmbikge1xuICAgIHRoaXMuX192YWxpZGF0b3JzLnB1c2goZm4pXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICB0aGlzLl9fZ2V0ID0gZm5cbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChmbikge1xuICAgIHRoaXMuX19zZXQgPSBmblxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLl9fdmFsdWUgPSB2YWx1ZVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUubmFtZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhpcy5fX2Rpc3BsYXlOYW1lID0gbmFtZVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5yZWdpc3RlciA9IGZ1bmN0aW9uIChuYW1lLCBmbikge1xuICAgIHZhciB3cmFwcGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5fX3ZhbGlkYXRvcnMucHVzaChmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpKVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFByb3AucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgICB2YWx1ZTogd3JhcHBlclxuICAgIH0pXG4gIH1cbiAgcmV0dXJuIFByb3Bcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5XG4iXX0=
