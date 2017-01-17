(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var slice = Array.prototype.slice

module.exports = function (el, fn, data) {
  var args = slice.call(arguments)
  if (args.length <= 3) {
    patch(el, fn, data)
  } else {
    patch(el, function () {
      fn.apply(window, args.slice(2))
    })
  }
}

},{"incremental-dom":10}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
var Freezer = require('./src/freezer');
module.exports = Freezer;
},{"./src/freezer":6}],5:[function(require,module,exports){
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

},{"./utils":9}],6:[function(require,module,exports){
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

},{"./emitter":5,"./frozen":7,"./utils.js":9}],7:[function(require,module,exports){
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

},{"./emitter":5,"./nodeCreator":8,"./utils":9}],8:[function(require,module,exports){
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

},{"./utils.js":9}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{"_process":2}],11:[function(require,module,exports){
require('document-register-element')
require('./todos')

},{"./todos":16,"document-register-element":3}],12:[function(require,module,exports){
const Freezer = require('freezer-js')
const IncrementalDOM = require('incremental-dom')
const patch = require('../../client/patch')

// TODO: SKIP and EXTEND HTML

IncrementalDOM.attributes.checked = function (el, name, value) {
  el.checked = !!value
}

IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value === null || typeof (value) === 'undefined' ? '' : value
}

const Symbols = {
  VIEW: Symbol('view'),
  STATE: Symbol('state')
}

const superviews = (Base, view) => class extends Base {
  constructor (initialState = {}) {
    super()
    this[Symbols.VIEW] = view

    let state = new Freezer(initialState)
    this[Symbols.STATE] = state

    state.on('update', function (currentState, prevState) {
      this.render()
    }.bind(this))
  }

  // s = () => {
  //   return ''
  // }

  get state () {
    return this[Symbols.STATE].get()
  }

  render () {
    let view = this[Symbols.VIEW]

    patch(this, function () {
      view.call(this, this.state, this)
    }.bind(this))
  }
}

module.exports = superviews

},{"../../client/patch":1,"freezer-js":4,"incremental-dom":10}],13:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementClose = IncrementalDOM.elementClose
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var text = IncrementalDOM.text

var hoisted1 = ["type", "text"]
var hoisted2 = ["type", "checkbox"]
var __target

module.exports = function description (state, el) {
elementOpen("input", "e1e84a2b-0658-4229-9f23-89a0de70ea6d", hoisted1, "value", state.todo.text, "onchange", function ($event) {
  var $element = this;
state.todo.set('text', this.value)})
elementClose("input")
elementOpen("input", "17bd0d1d-335a-418f-9c53-631b20071edb", hoisted2, "checked", state.todo.isCompleted, "onchange", function ($event) {
  var $element = this;
state.todo.set('isCompleted', this.checked)})
elementClose("input")
elementOpen("span")
  text("" + (state.todo.text) + "")
elementClose("span")
}

},{"incremental-dom":10}],14:[function(require,module,exports){
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

},{"./superviews":12,"./todo.html":13}],15:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementClose = IncrementalDOM.elementClose
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var text = IncrementalDOM.text

var hoisted1 = ["as", "x-todo"]
var hoisted2 = ["type", "text"]
var __target

module.exports = function description (state, el) {
let todos = state.todos
if (Array.isArray(todos) && todos.length) {
  let completed = this.completed
  elementOpen("section")
    elementOpen("ul")
      __target = todos
      if (__target) {
        ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
          var todo = $value
          var $key = "8327efaa-486a-4880-b8c4-6fc42fbb476b_" + todo.id
          elementOpen("li", $key, hoisted1, "todo", todo)
            if (true) {
              skip()
            } else {
            }
          elementClose("li")
        }, this)
      }
    elementClose("ul")
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
          text("" + (Date.now()) + "")
        elementClose("dd")
      elementClose("dl")
      elementOpen("button", null, null, "onclick", function ($event) {
        var $element = this;
      todos[0].set('isCompleted', !todos[0].isCompleted)})
        text("XX")
      elementClose("button")
      elementOpen("button", null, null, "onclick", function ($event) {
        var $element = this;
      todos[0].set('text', 'egg')})
        text("YY")
      elementClose("button")
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
  elementOpen("input", "796dcf36-e0fc-4d00-bacf-00ddb0ef4312", hoisted2, "value", state.newTodoText, "onkeyup", function ($event) {
    var $element = this;
  state.set('newTodoText', this.value.trim())})
  elementClose("input")
  elementOpen("button", null, null, "disabled", state.newTodoText ? undefined : 'disabled')
    text("Add Todo")
  elementClose("button")
elementClose("form")
}

},{"incremental-dom":10}],16:[function(require,module,exports){
const superviews = require('./superviews')
const view = require('./todos.html')

require('./todo')

class Todos extends superviews(window.HTMLElement, view) {
  // Called when the element is created or upgraded
  // constructor () {}

  // Called when the element is inserted into a document, including into a shadow tree
  connectedCallback () {}

  // Called when the element is removed from a document
  disconnectedCallback () {}

  // Called when an attribute is changed, appended, removed, or replaced on the element. Only called for observed attributes.
  attributeChangedCallback (attributeName, oldValue, newValue, namespace) {
    console.log(attributeName, oldValue, newValue, namespace)
  }

  // Called when the element is adopted into a new document
  adoptedCallback (oldDocument, newDocument) {}

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
    let text = this.state.newTodoText

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


},{"./superviews":12,"./todo":14,"./todos.html":15}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvcGF0Y2guanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2RvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQvYnVpbGQvZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudC5ub2RlLmpzIiwibm9kZV9tb2R1bGVzL2ZyZWV6ZXItanMvZnJlZXplci5qcyIsIm5vZGVfbW9kdWxlcy9mcmVlemVyLWpzL3NyYy9lbWl0dGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZyZWV6ZXItanMvc3JjL2ZyZWV6ZXIuanMiLCJub2RlX21vZHVsZXMvZnJlZXplci1qcy9zcmMvZnJvemVuLmpzIiwibm9kZV9tb2R1bGVzL2ZyZWV6ZXItanMvc3JjL25vZGVDcmVhdG9yLmpzIiwibm9kZV9tb2R1bGVzL2ZyZWV6ZXItanMvc3JjL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL2luY3JlbWVudGFsLWRvbS9kaXN0L2luY3JlbWVudGFsLWRvbS1janMuanMiLCJ0ZXN0L2N1c3RvbWVsZW1lbnRzL2luZGV4LmpzIiwidGVzdC9jdXN0b21lbGVtZW50cy9zdXBlcnZpZXdzLmpzIiwidGVzdC9jdXN0b21lbGVtZW50cy90b2RvLmh0bWwiLCJ0ZXN0L2N1c3RvbWVsZW1lbnRzL3RvZG8uanMiLCJ0ZXN0L2N1c3RvbWVsZW1lbnRzL3RvZG9zLmh0bWwiLCJ0ZXN0L2N1c3RvbWVsZW1lbnRzL3RvZG9zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDejVDQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMTRDQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJylcbnZhciBwYXRjaCA9IEluY3JlbWVudGFsRE9NLnBhdGNoXG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2VcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWwsIGZuLCBkYXRhKSB7XG4gIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gIGlmIChhcmdzLmxlbmd0aCA8PSAzKSB7XG4gICAgcGF0Y2goZWwsIGZuLCBkYXRhKVxuICB9IGVsc2Uge1xuICAgIHBhdGNoKGVsLCBmdW5jdGlvbiAoKSB7XG4gICAgICBmbi5hcHBseSh3aW5kb3csIGFyZ3Muc2xpY2UoMikpXG4gICAgfSlcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8qIVxuXG5Db3B5cmlnaHQgKEMpIDIwMTQtMjAxNiBieSBBbmRyZWEgR2lhbW1hcmNoaSAtIEBXZWJSZWZsZWN0aW9uXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS5cblxuKi9cbi8vIGdsb2JhbCB3aW5kb3cgT2JqZWN0XG4vLyBvcHRpb25hbCBwb2x5ZmlsbCBpbmZvXG4vLyAgICAnYXV0bycgdXNlZCBieSBkZWZhdWx0LCBldmVyeXRoaW5nIGlzIGZlYXR1cmUgZGV0ZWN0ZWRcbi8vICAgICdmb3JjZScgdXNlIHRoZSBwb2x5ZmlsbCBldmVuIGlmIG5vdCBmdWxseSBuZWVkZWRcbmZ1bmN0aW9uIGluc3RhbGxDdXN0b21FbGVtZW50cyh3aW5kb3csIHBvbHlmaWxsKSB7J3VzZSBzdHJpY3QnO1xuXG4gIC8vIERPIE5PVCBVU0UgVEhJUyBGSUxFIERJUkVDVExZLCBJVCBXT04nVCBXT1JLXG4gIC8vIFRISVMgSVMgQSBQUk9KRUNUIEJBU0VEIE9OIEEgQlVJTEQgU1lTVEVNXG4gIC8vIFRISVMgRklMRSBJUyBKVVNUIFdSQVBQRUQgVVAgUkVTVUxUSU5HIElOXG4gIC8vIGJ1aWxkL2RvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQubm9kZS5qc1xuXG4gIHZhclxuICAgIGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50LFxuICAgIE9iamVjdCA9IHdpbmRvdy5PYmplY3RcbiAgO1xuXG4gIHZhciBodG1sQ2xhc3MgPSAoZnVuY3Rpb24gKGluZm8pIHtcbiAgICAvLyAoQykgQW5kcmVhIEdpYW1tYXJjaGkgLSBAV2ViUmVmbGVjdGlvbiAtIE1JVCBTdHlsZVxuICAgIHZhclxuICAgICAgY2F0Y2hDbGFzcyA9IC9eW0EtWl0rW2Etel0vLFxuICAgICAgZmlsdGVyQnkgPSBmdW5jdGlvbiAocmUpIHtcbiAgICAgICAgdmFyIGFyciA9IFtdLCB0YWc7XG4gICAgICAgIGZvciAodGFnIGluIHJlZ2lzdGVyKSB7XG4gICAgICAgICAgaWYgKHJlLnRlc3QodGFnKSkgYXJyLnB1c2godGFnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXJyO1xuICAgICAgfSxcbiAgICAgIGFkZCA9IGZ1bmN0aW9uIChDbGFzcywgdGFnKSB7XG4gICAgICAgIHRhZyA9IHRhZy50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAoISh0YWcgaW4gcmVnaXN0ZXIpKSB7XG4gICAgICAgICAgcmVnaXN0ZXJbQ2xhc3NdID0gKHJlZ2lzdGVyW0NsYXNzXSB8fCBbXSkuY29uY2F0KHRhZyk7XG4gICAgICAgICAgcmVnaXN0ZXJbdGFnXSA9IChyZWdpc3Rlclt0YWcudG9VcHBlckNhc2UoKV0gPSBDbGFzcyk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICByZWdpc3RlciA9IChPYmplY3QuY3JlYXRlIHx8IE9iamVjdCkobnVsbCksXG4gICAgICBodG1sQ2xhc3MgPSB7fSxcbiAgICAgIGksIHNlY3Rpb24sIHRhZ3MsIENsYXNzXG4gICAgO1xuICAgIGZvciAoc2VjdGlvbiBpbiBpbmZvKSB7XG4gICAgICBmb3IgKENsYXNzIGluIGluZm9bc2VjdGlvbl0pIHtcbiAgICAgICAgdGFncyA9IGluZm9bc2VjdGlvbl1bQ2xhc3NdO1xuICAgICAgICByZWdpc3RlcltDbGFzc10gPSB0YWdzO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHJlZ2lzdGVyW3RhZ3NbaV0udG9Mb3dlckNhc2UoKV0gPVxuICAgICAgICAgIHJlZ2lzdGVyW3RhZ3NbaV0udG9VcHBlckNhc2UoKV0gPSBDbGFzcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBodG1sQ2xhc3MuZ2V0ID0gZnVuY3Rpb24gZ2V0KHRhZ09yQ2xhc3MpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgdGFnT3JDbGFzcyA9PT0gJ3N0cmluZycgP1xuICAgICAgICAocmVnaXN0ZXJbdGFnT3JDbGFzc10gfHwgKGNhdGNoQ2xhc3MudGVzdCh0YWdPckNsYXNzKSA/IFtdIDogJycpKSA6XG4gICAgICAgIGZpbHRlckJ5KHRhZ09yQ2xhc3MpO1xuICAgIH07XG4gICAgaHRtbENsYXNzLnNldCA9IGZ1bmN0aW9uIHNldCh0YWcsIENsYXNzKSB7XG4gICAgICByZXR1cm4gKGNhdGNoQ2xhc3MudGVzdCh0YWcpID9cbiAgICAgICAgYWRkKHRhZywgQ2xhc3MpIDpcbiAgICAgICAgYWRkKENsYXNzLCB0YWcpXG4gICAgICApLCBodG1sQ2xhc3M7XG4gICAgfTtcbiAgICByZXR1cm4gaHRtbENsYXNzO1xuICB9KHtcbiAgICBcImNvbGxlY3Rpb25zXCI6IHtcbiAgICAgIFwiSFRNTEFsbENvbGxlY3Rpb25cIjogW1xuICAgICAgICBcImFsbFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQ29sbGVjdGlvblwiOiBbXG4gICAgICAgIFwiZm9ybXNcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEZvcm1Db250cm9sc0NvbGxlY3Rpb25cIjogW1xuICAgICAgICBcImVsZW1lbnRzXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxPcHRpb25zQ29sbGVjdGlvblwiOiBbXG4gICAgICAgIFwib3B0aW9uc1wiXG4gICAgICBdXG4gICAgfSxcbiAgICBcImVsZW1lbnRzXCI6IHtcbiAgICAgIFwiRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZWxlbWVudFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQW5jaG9yRWxlbWVudFwiOiBbXG4gICAgICAgIFwiYVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQXBwbGV0RWxlbWVudFwiOiBbXG4gICAgICAgIFwiYXBwbGV0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxBcmVhRWxlbWVudFwiOiBbXG4gICAgICAgIFwiYXJlYVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQXR0YWNobWVudEVsZW1lbnRcIjogW1xuICAgICAgICBcImF0dGFjaG1lbnRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEF1ZGlvRWxlbWVudFwiOiBbXG4gICAgICAgIFwiYXVkaW9cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEJSRWxlbWVudFwiOiBbXG4gICAgICAgIFwiYnJcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEJhc2VFbGVtZW50XCI6IFtcbiAgICAgICAgXCJiYXNlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxCb2R5RWxlbWVudFwiOiBbXG4gICAgICAgIFwiYm9keVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MQnV0dG9uRWxlbWVudFwiOiBbXG4gICAgICAgIFwiYnV0dG9uXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxDYW52YXNFbGVtZW50XCI6IFtcbiAgICAgICAgXCJjYW52YXNcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTENvbnRlbnRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJjb250ZW50XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxETGlzdEVsZW1lbnRcIjogW1xuICAgICAgICBcImRsXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxEYXRhRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZGF0YVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRGF0YUxpc3RFbGVtZW50XCI6IFtcbiAgICAgICAgXCJkYXRhbGlzdFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRGV0YWlsc0VsZW1lbnRcIjogW1xuICAgICAgICBcImRldGFpbHNcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTERpYWxvZ0VsZW1lbnRcIjogW1xuICAgICAgICBcImRpYWxvZ1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRGlyZWN0b3J5RWxlbWVudFwiOiBbXG4gICAgICAgIFwiZGlyXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxEaXZFbGVtZW50XCI6IFtcbiAgICAgICAgXCJkaXZcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTERvY3VtZW50XCI6IFtcbiAgICAgICAgXCJkb2N1bWVudFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZWxlbWVudFwiLFxuICAgICAgICBcImFiYnJcIixcbiAgICAgICAgXCJhZGRyZXNzXCIsXG4gICAgICAgIFwiYXJ0aWNsZVwiLFxuICAgICAgICBcImFzaWRlXCIsXG4gICAgICAgIFwiYlwiLFxuICAgICAgICBcImJkaVwiLFxuICAgICAgICBcImJkb1wiLFxuICAgICAgICBcImNpdGVcIixcbiAgICAgICAgXCJjb2RlXCIsXG4gICAgICAgIFwiY29tbWFuZFwiLFxuICAgICAgICBcImRkXCIsXG4gICAgICAgIFwiZGZuXCIsXG4gICAgICAgIFwiZHRcIixcbiAgICAgICAgXCJlbVwiLFxuICAgICAgICBcImZpZ2NhcHRpb25cIixcbiAgICAgICAgXCJmaWd1cmVcIixcbiAgICAgICAgXCJmb290ZXJcIixcbiAgICAgICAgXCJoZWFkZXJcIixcbiAgICAgICAgXCJpXCIsXG4gICAgICAgIFwia2JkXCIsXG4gICAgICAgIFwibWFya1wiLFxuICAgICAgICBcIm5hdlwiLFxuICAgICAgICBcIm5vc2NyaXB0XCIsXG4gICAgICAgIFwicnBcIixcbiAgICAgICAgXCJydFwiLFxuICAgICAgICBcInJ1YnlcIixcbiAgICAgICAgXCJzXCIsXG4gICAgICAgIFwic2FtcFwiLFxuICAgICAgICBcInNlY3Rpb25cIixcbiAgICAgICAgXCJzbWFsbFwiLFxuICAgICAgICBcInN0cm9uZ1wiLFxuICAgICAgICBcInN1YlwiLFxuICAgICAgICBcInN1bW1hcnlcIixcbiAgICAgICAgXCJzdXBcIixcbiAgICAgICAgXCJ1XCIsXG4gICAgICAgIFwidmFyXCIsXG4gICAgICAgIFwid2JyXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxFbWJlZEVsZW1lbnRcIjogW1xuICAgICAgICBcImVtYmVkXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxGaWVsZFNldEVsZW1lbnRcIjogW1xuICAgICAgICBcImZpZWxkc2V0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxGb250RWxlbWVudFwiOiBbXG4gICAgICAgIFwiZm9udFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRm9ybUVsZW1lbnRcIjogW1xuICAgICAgICBcImZvcm1cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEZyYW1lRWxlbWVudFwiOiBbXG4gICAgICAgIFwiZnJhbWVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEZyYW1lU2V0RWxlbWVudFwiOiBbXG4gICAgICAgIFwiZnJhbWVzZXRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEhSRWxlbWVudFwiOiBbXG4gICAgICAgIFwiaHJcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTEhlYWRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJoZWFkXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxIZWFkaW5nRWxlbWVudFwiOiBbXG4gICAgICAgIFwiaDFcIixcbiAgICAgICAgXCJoMlwiLFxuICAgICAgICBcImgzXCIsXG4gICAgICAgIFwiaDRcIixcbiAgICAgICAgXCJoNVwiLFxuICAgICAgICBcImg2XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxIdG1sRWxlbWVudFwiOiBbXG4gICAgICAgIFwiaHRtbFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MSUZyYW1lRWxlbWVudFwiOiBbXG4gICAgICAgIFwiaWZyYW1lXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxJbWFnZUVsZW1lbnRcIjogW1xuICAgICAgICBcImltZ1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MSW5wdXRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJpbnB1dFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MS2V5Z2VuRWxlbWVudFwiOiBbXG4gICAgICAgIFwia2V5Z2VuXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxMSUVsZW1lbnRcIjogW1xuICAgICAgICBcImxpXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxMYWJlbEVsZW1lbnRcIjogW1xuICAgICAgICBcImxhYmVsXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxMZWdlbmRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJsZWdlbmRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTExpbmtFbGVtZW50XCI6IFtcbiAgICAgICAgXCJsaW5rXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxNYXBFbGVtZW50XCI6IFtcbiAgICAgICAgXCJtYXBcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE1hcnF1ZWVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJtYXJxdWVlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxNZWRpYUVsZW1lbnRcIjogW1xuICAgICAgICBcIm1lZGlhXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxNZW51RWxlbWVudFwiOiBbXG4gICAgICAgIFwibWVudVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTWVudUl0ZW1FbGVtZW50XCI6IFtcbiAgICAgICAgXCJtZW51aXRlbVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MTWV0YUVsZW1lbnRcIjogW1xuICAgICAgICBcIm1ldGFcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE1ldGVyRWxlbWVudFwiOiBbXG4gICAgICAgIFwibWV0ZXJcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE1vZEVsZW1lbnRcIjogW1xuICAgICAgICBcImRlbFwiLFxuICAgICAgICBcImluc1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MT0xpc3RFbGVtZW50XCI6IFtcbiAgICAgICAgXCJvbFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MT2JqZWN0RWxlbWVudFwiOiBbXG4gICAgICAgIFwib2JqZWN0XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxPcHRHcm91cEVsZW1lbnRcIjogW1xuICAgICAgICBcIm9wdGdyb3VwXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxPcHRpb25FbGVtZW50XCI6IFtcbiAgICAgICAgXCJvcHRpb25cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTE91dHB1dEVsZW1lbnRcIjogW1xuICAgICAgICBcIm91dHB1dFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MUGFyYWdyYXBoRWxlbWVudFwiOiBbXG4gICAgICAgIFwicFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MUGFyYW1FbGVtZW50XCI6IFtcbiAgICAgICAgXCJwYXJhbVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MUGljdHVyZUVsZW1lbnRcIjogW1xuICAgICAgICBcInBpY3R1cmVcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFByZUVsZW1lbnRcIjogW1xuICAgICAgICBcInByZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MUHJvZ3Jlc3NFbGVtZW50XCI6IFtcbiAgICAgICAgXCJwcm9ncmVzc1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MUXVvdGVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJibG9ja3F1b3RlXCIsXG4gICAgICAgIFwicVwiLFxuICAgICAgICBcInF1b3RlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxTY3JpcHRFbGVtZW50XCI6IFtcbiAgICAgICAgXCJzY3JpcHRcIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFNlbGVjdEVsZW1lbnRcIjogW1xuICAgICAgICBcInNlbGVjdFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MU2hhZG93RWxlbWVudFwiOiBbXG4gICAgICAgIFwic2hhZG93XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxTbG90RWxlbWVudFwiOiBbXG4gICAgICAgIFwic2xvdFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MU291cmNlRWxlbWVudFwiOiBbXG4gICAgICAgIFwic291cmNlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxTcGFuRWxlbWVudFwiOiBbXG4gICAgICAgIFwic3BhblwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MU3R5bGVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJzdHlsZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGFibGVDYXB0aW9uRWxlbWVudFwiOiBbXG4gICAgICAgIFwiY2FwdGlvblwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGFibGVDZWxsRWxlbWVudFwiOiBbXG4gICAgICAgIFwidGRcIixcbiAgICAgICAgXCJ0aFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGFibGVDb2xFbGVtZW50XCI6IFtcbiAgICAgICAgXCJjb2xcIixcbiAgICAgICAgXCJjb2xncm91cFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGFibGVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0YWJsZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGFibGVSb3dFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0clwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGFibGVTZWN0aW9uRWxlbWVudFwiOiBbXG4gICAgICAgIFwidGhlYWRcIixcbiAgICAgICAgXCJ0Ym9keVwiLFxuICAgICAgICBcInRmb290XCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUZW1wbGF0ZUVsZW1lbnRcIjogW1xuICAgICAgICBcInRlbXBsYXRlXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUZXh0QXJlYUVsZW1lbnRcIjogW1xuICAgICAgICBcInRleHRhcmVhXCJcbiAgICAgIF0sXG4gICAgICBcIkhUTUxUaW1lRWxlbWVudFwiOiBbXG4gICAgICAgIFwidGltZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVGl0bGVFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0aXRsZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVHJhY2tFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ0cmFja1wiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVUxpc3RFbGVtZW50XCI6IFtcbiAgICAgICAgXCJ1bFwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MVW5rbm93bkVsZW1lbnRcIjogW1xuICAgICAgICBcInVua25vd25cIixcbiAgICAgICAgXCJ2aGdyb3VwdlwiLFxuICAgICAgICBcInZrZXlnZW5cIlxuICAgICAgXSxcbiAgICAgIFwiSFRNTFZpZGVvRWxlbWVudFwiOiBbXG4gICAgICAgIFwidmlkZW9cIlxuICAgICAgXVxuICAgIH0sXG4gICAgXCJub2Rlc1wiOiB7XG4gICAgICBcIkF0dHJcIjogW1xuICAgICAgICBcIm5vZGVcIlxuICAgICAgXSxcbiAgICAgIFwiQXVkaW9cIjogW1xuICAgICAgICBcImF1ZGlvXCJcbiAgICAgIF0sXG4gICAgICBcIkNEQVRBU2VjdGlvblwiOiBbXG4gICAgICAgIFwibm9kZVwiXG4gICAgICBdLFxuICAgICAgXCJDaGFyYWN0ZXJEYXRhXCI6IFtcbiAgICAgICAgXCJub2RlXCJcbiAgICAgIF0sXG4gICAgICBcIkNvbW1lbnRcIjogW1xuICAgICAgICBcIiNjb21tZW50XCJcbiAgICAgIF0sXG4gICAgICBcIkRvY3VtZW50XCI6IFtcbiAgICAgICAgXCIjZG9jdW1lbnRcIlxuICAgICAgXSxcbiAgICAgIFwiRG9jdW1lbnRGcmFnbWVudFwiOiBbXG4gICAgICAgIFwiI2RvY3VtZW50LWZyYWdtZW50XCJcbiAgICAgIF0sXG4gICAgICBcIkRvY3VtZW50VHlwZVwiOiBbXG4gICAgICAgIFwibm9kZVwiXG4gICAgICBdLFxuICAgICAgXCJIVE1MRG9jdW1lbnRcIjogW1xuICAgICAgICBcIiNkb2N1bWVudFwiXG4gICAgICBdLFxuICAgICAgXCJJbWFnZVwiOiBbXG4gICAgICAgIFwiaW1nXCJcbiAgICAgIF0sXG4gICAgICBcIk9wdGlvblwiOiBbXG4gICAgICAgIFwib3B0aW9uXCJcbiAgICAgIF0sXG4gICAgICBcIlByb2Nlc3NpbmdJbnN0cnVjdGlvblwiOiBbXG4gICAgICAgIFwibm9kZVwiXG4gICAgICBdLFxuICAgICAgXCJTaGFkb3dSb290XCI6IFtcbiAgICAgICAgXCIjc2hhZG93LXJvb3RcIlxuICAgICAgXSxcbiAgICAgIFwiVGV4dFwiOiBbXG4gICAgICAgIFwiI3RleHRcIlxuICAgICAgXSxcbiAgICAgIFwiWE1MRG9jdW1lbnRcIjogW1xuICAgICAgICBcInhtbFwiXG4gICAgICBdXG4gICAgfVxuICB9KSk7XG4gIFxuICBcbiAgICBcbiAgLy8gcGFzc2VkIGF0IHJ1bnRpbWUsIGNvbmZpZ3VyYWJsZVxuICAvLyB2aWEgbm9kZWpzIG1vZHVsZVxuICBpZiAoIXBvbHlmaWxsKSBwb2x5ZmlsbCA9ICdhdXRvJztcbiAgXG4gIHZhclxuICAgIC8vIFYwIHBvbHlmaWxsIGVudHJ5XG4gICAgUkVHSVNURVJfRUxFTUVOVCA9ICdyZWdpc3RlckVsZW1lbnQnLFxuICBcbiAgICAvLyBJRSA8IDExIG9ubHkgKyBvbGQgV2ViS2l0IGZvciBhdHRyaWJ1dGVzICsgZmVhdHVyZSBkZXRlY3Rpb25cbiAgICBFWFBBTkRPX1VJRCA9ICdfXycgKyBSRUdJU1RFUl9FTEVNRU5UICsgKHdpbmRvdy5NYXRoLnJhbmRvbSgpICogMTBlNCA+PiAwKSxcbiAgXG4gICAgLy8gc2hvcnRjdXRzIGFuZCBjb3N0YW50c1xuICAgIEFERF9FVkVOVF9MSVNURU5FUiA9ICdhZGRFdmVudExpc3RlbmVyJyxcbiAgICBBVFRBQ0hFRCA9ICdhdHRhY2hlZCcsXG4gICAgQ0FMTEJBQ0sgPSAnQ2FsbGJhY2snLFxuICAgIERFVEFDSEVEID0gJ2RldGFjaGVkJyxcbiAgICBFWFRFTkRTID0gJ2V4dGVuZHMnLFxuICBcbiAgICBBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDSyA9ICdhdHRyaWJ1dGVDaGFuZ2VkJyArIENBTExCQUNLLFxuICAgIEFUVEFDSEVEX0NBTExCQUNLID0gQVRUQUNIRUQgKyBDQUxMQkFDSyxcbiAgICBDT05ORUNURURfQ0FMTEJBQ0sgPSAnY29ubmVjdGVkJyArIENBTExCQUNLLFxuICAgIERJU0NPTk5FQ1RFRF9DQUxMQkFDSyA9ICdkaXNjb25uZWN0ZWQnICsgQ0FMTEJBQ0ssXG4gICAgQ1JFQVRFRF9DQUxMQkFDSyA9ICdjcmVhdGVkJyArIENBTExCQUNLLFxuICAgIERFVEFDSEVEX0NBTExCQUNLID0gREVUQUNIRUQgKyBDQUxMQkFDSyxcbiAgXG4gICAgQURESVRJT04gPSAnQURESVRJT04nLFxuICAgIE1PRElGSUNBVElPTiA9ICdNT0RJRklDQVRJT04nLFxuICAgIFJFTU9WQUwgPSAnUkVNT1ZBTCcsXG4gIFxuICAgIERPTV9BVFRSX01PRElGSUVEID0gJ0RPTUF0dHJNb2RpZmllZCcsXG4gICAgRE9NX0NPTlRFTlRfTE9BREVEID0gJ0RPTUNvbnRlbnRMb2FkZWQnLFxuICAgIERPTV9TVUJUUkVFX01PRElGSUVEID0gJ0RPTVN1YnRyZWVNb2RpZmllZCcsXG4gIFxuICAgIFBSRUZJWF9UQUcgPSAnPCcsXG4gICAgUFJFRklYX0lTID0gJz0nLFxuICBcbiAgICAvLyB2YWxpZCBhbmQgaW52YWxpZCBub2RlIG5hbWVzXG4gICAgdmFsaWROYW1lID0gL15bQS1aXVtBLVowLTldKig/Oi1bQS1aMC05XSspKyQvLFxuICAgIGludmFsaWROYW1lcyA9IFtcbiAgICAgICdBTk5PVEFUSU9OLVhNTCcsXG4gICAgICAnQ09MT1ItUFJPRklMRScsXG4gICAgICAnRk9OVC1GQUNFJyxcbiAgICAgICdGT05ULUZBQ0UtU1JDJyxcbiAgICAgICdGT05ULUZBQ0UtVVJJJyxcbiAgICAgICdGT05ULUZBQ0UtRk9STUFUJyxcbiAgICAgICdGT05ULUZBQ0UtTkFNRScsXG4gICAgICAnTUlTU0lORy1HTFlQSCdcbiAgICBdLFxuICBcbiAgICAvLyByZWdpc3RlcmVkIHR5cGVzIGFuZCB0aGVpciBwcm90b3R5cGVzXG4gICAgdHlwZXMgPSBbXSxcbiAgICBwcm90b3MgPSBbXSxcbiAgXG4gICAgLy8gdG8gcXVlcnkgc3Vibm9kZXNcbiAgICBxdWVyeSA9ICcnLFxuICBcbiAgICAvLyBodG1sIHNob3J0Y3V0IHVzZWQgdG8gZmVhdHVyZSBkZXRlY3RcbiAgICBkb2N1bWVudEVsZW1lbnQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXG4gIFxuICAgIC8vIEVTNSBpbmxpbmUgaGVscGVycyB8fCBiYXNpYyBwYXRjaGVzXG4gICAgaW5kZXhPZiA9IHR5cGVzLmluZGV4T2YgfHwgZnVuY3Rpb24gKHYpIHtcbiAgICAgIGZvcih2YXIgaSA9IHRoaXMubGVuZ3RoOyBpLS0gJiYgdGhpc1tpXSAhPT0gdjspe31cbiAgICAgIHJldHVybiBpO1xuICAgIH0sXG4gIFxuICAgIC8vIG90aGVyIGhlbHBlcnMgLyBzaG9ydGN1dHNcbiAgICBPUCA9IE9iamVjdC5wcm90b3R5cGUsXG4gICAgaE9QID0gT1AuaGFzT3duUHJvcGVydHksXG4gICAgaVBPID0gT1AuaXNQcm90b3R5cGVPZixcbiAgXG4gICAgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHksXG4gICAgZW1wdHkgPSBbXSxcbiAgICBnT1BEID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgICBnT1BOID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMsXG4gICAgZ1BPID0gT2JqZWN0LmdldFByb3RvdHlwZU9mLFxuICAgIHNQTyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZixcbiAgXG4gICAgLy8ganNoaW50IHByb3RvOiB0cnVlXG4gICAgaGFzUHJvdG8gPSAhIU9iamVjdC5fX3Byb3RvX18sXG4gIFxuICAgIC8vIFYxIGhlbHBlcnNcbiAgICBmaXhHZXRDbGFzcyA9IGZhbHNlLFxuICAgIERSRUNFVjEgPSAnX19kcmVDRXYxJyxcbiAgICBjdXN0b21FbGVtZW50cyA9IHdpbmRvdy5jdXN0b21FbGVtZW50cyxcbiAgICB1c2FibGVDdXN0b21FbGVtZW50cyA9IHBvbHlmaWxsICE9PSAnZm9yY2UnICYmICEhKFxuICAgICAgY3VzdG9tRWxlbWVudHMgJiZcbiAgICAgIGN1c3RvbUVsZW1lbnRzLmRlZmluZSAmJlxuICAgICAgY3VzdG9tRWxlbWVudHMuZ2V0ICYmXG4gICAgICBjdXN0b21FbGVtZW50cy53aGVuRGVmaW5lZFxuICAgICksXG4gICAgRGljdCA9IE9iamVjdC5jcmVhdGUgfHwgT2JqZWN0LFxuICAgIE1hcCA9IHdpbmRvdy5NYXAgfHwgZnVuY3Rpb24gTWFwKCkge1xuICAgICAgdmFyIEsgPSBbXSwgViA9IFtdLCBpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoaykge1xuICAgICAgICAgIHJldHVybiBWW2luZGV4T2YuY2FsbChLLCBrKV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGssIHYpIHtcbiAgICAgICAgICBpID0gaW5kZXhPZi5jYWxsKEssIGspO1xuICAgICAgICAgIGlmIChpIDwgMCkgVltLLnB1c2goaykgLSAxXSA9IHY7XG4gICAgICAgICAgZWxzZSBWW2ldID0gdjtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuICAgIFByb21pc2UgPSB3aW5kb3cuUHJvbWlzZSB8fCBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIHZhclxuICAgICAgICBub3RpZnkgPSBbXSxcbiAgICAgICAgZG9uZSA9IGZhbHNlLFxuICAgICAgICBwID0ge1xuICAgICAgICAgICdjYXRjaCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgJ3RoZW4nOiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgIG5vdGlmeS5wdXNoKGNiKTtcbiAgICAgICAgICAgIGlmIChkb25lKSBzZXRUaW1lb3V0KHJlc29sdmUsIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICA7XG4gICAgICBmdW5jdGlvbiByZXNvbHZlKHZhbHVlKSB7XG4gICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICB3aGlsZSAobm90aWZ5Lmxlbmd0aCkgbm90aWZ5LnNoaWZ0KCkodmFsdWUpO1xuICAgICAgfVxuICAgICAgZm4ocmVzb2x2ZSk7XG4gICAgICByZXR1cm4gcDtcbiAgICB9LFxuICAgIGp1c3RDcmVhdGVkID0gZmFsc2UsXG4gICAgY29uc3RydWN0b3JzID0gRGljdChudWxsKSxcbiAgICB3YWl0aW5nTGlzdCA9IERpY3QobnVsbCksXG4gICAgbm9kZU5hbWVzID0gbmV3IE1hcCgpLFxuICAgIHNlY29uZEFyZ3VtZW50ID0gU3RyaW5nLFxuICBcbiAgICAvLyB1c2VkIHRvIGNyZWF0ZSB1bmlxdWUgaW5zdGFuY2VzXG4gICAgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiBCcmlkZ2UocHJvdG8pIHtcbiAgICAgIC8vIHNpbGx5IGJyb2tlbiBwb2x5ZmlsbCBwcm9iYWJseSBldmVyIHVzZWQgYnV0IHNob3J0IGVub3VnaCB0byB3b3JrXG4gICAgICByZXR1cm4gcHJvdG8gPyAoKEJyaWRnZS5wcm90b3R5cGUgPSBwcm90byksIG5ldyBCcmlkZ2UoKSkgOiB0aGlzO1xuICAgIH0sXG4gIFxuICAgIC8vIHdpbGwgc2V0IHRoZSBwcm90b3R5cGUgaWYgcG9zc2libGVcbiAgICAvLyBvciBjb3B5IG92ZXIgYWxsIHByb3BlcnRpZXNcbiAgICBzZXRQcm90b3R5cGUgPSBzUE8gfHwgKFxuICAgICAgaGFzUHJvdG8gP1xuICAgICAgICBmdW5jdGlvbiAobywgcCkge1xuICAgICAgICAgIG8uX19wcm90b19fID0gcDtcbiAgICAgICAgICByZXR1cm4gbztcbiAgICAgICAgfSA6IChcbiAgICAgIChnT1BOICYmIGdPUEQpID9cbiAgICAgICAgKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgZnVuY3Rpb24gc2V0UHJvcGVydGllcyhvLCBwKSB7XG4gICAgICAgICAgICBmb3IgKHZhclxuICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgIG5hbWVzID0gZ09QTihwKSxcbiAgICAgICAgICAgICAgaSA9IDAsIGxlbmd0aCA9IG5hbWVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgaSA8IGxlbmd0aDsgaSsrXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAga2V5ID0gbmFtZXNbaV07XG4gICAgICAgICAgICAgIGlmICghaE9QLmNhbGwobywga2V5KSkge1xuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5KG8sIGtleSwgZ09QRChwLCBrZXkpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG8sIHApIHtcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgc2V0UHJvcGVydGllcyhvLCBwKTtcbiAgICAgICAgICAgIH0gd2hpbGUgKChwID0gZ1BPKHApKSAmJiAhaVBPLmNhbGwocCwgbykpO1xuICAgICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgICAgfTtcbiAgICAgICAgfSgpKSA6XG4gICAgICAgIGZ1bmN0aW9uIChvLCBwKSB7XG4gICAgICAgICAgZm9yICh2YXIga2V5IGluIHApIHtcbiAgICAgICAgICAgIG9ba2V5XSA9IHBba2V5XTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgIH1cbiAgICApKSxcbiAgXG4gICAgLy8gRE9NIHNob3J0Y3V0cyBhbmQgaGVscGVycywgaWYgYW55XG4gIFxuICAgIE11dGF0aW9uT2JzZXJ2ZXIgPSB3aW5kb3cuTXV0YXRpb25PYnNlcnZlciB8fFxuICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuV2ViS2l0TXV0YXRpb25PYnNlcnZlcixcbiAgXG4gICAgSFRNTEVsZW1lbnRQcm90b3R5cGUgPSAoXG4gICAgICB3aW5kb3cuSFRNTEVsZW1lbnQgfHxcbiAgICAgIHdpbmRvdy5FbGVtZW50IHx8XG4gICAgICB3aW5kb3cuTm9kZVxuICAgICkucHJvdG90eXBlLFxuICBcbiAgICBJRTggPSAhaVBPLmNhbGwoSFRNTEVsZW1lbnRQcm90b3R5cGUsIGRvY3VtZW50RWxlbWVudCksXG4gIFxuICAgIHNhZmVQcm9wZXJ0eSA9IElFOCA/IGZ1bmN0aW9uIChvLCBrLCBkKSB7XG4gICAgICBvW2tdID0gZC52YWx1ZTtcbiAgICAgIHJldHVybiBvO1xuICAgIH0gOiBkZWZpbmVQcm9wZXJ0eSxcbiAgXG4gICAgaXNWYWxpZE5vZGUgPSBJRTggP1xuICAgICAgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDE7XG4gICAgICB9IDpcbiAgICAgIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHJldHVybiBpUE8uY2FsbChIVE1MRWxlbWVudFByb3RvdHlwZSwgbm9kZSk7XG4gICAgICB9LFxuICBcbiAgICB0YXJnZXRzID0gSUU4ICYmIFtdLFxuICBcbiAgICBhdHRhY2hTaGFkb3cgPSBIVE1MRWxlbWVudFByb3RvdHlwZS5hdHRhY2hTaGFkb3csXG4gICAgY2xvbmVOb2RlID0gSFRNTEVsZW1lbnRQcm90b3R5cGUuY2xvbmVOb2RlLFxuICAgIGRpc3BhdGNoRXZlbnQgPSBIVE1MRWxlbWVudFByb3RvdHlwZS5kaXNwYXRjaEV2ZW50LFxuICAgIGdldEF0dHJpYnV0ZSA9IEhUTUxFbGVtZW50UHJvdG90eXBlLmdldEF0dHJpYnV0ZSxcbiAgICBoYXNBdHRyaWJ1dGUgPSBIVE1MRWxlbWVudFByb3RvdHlwZS5oYXNBdHRyaWJ1dGUsXG4gICAgcmVtb3ZlQXR0cmlidXRlID0gSFRNTEVsZW1lbnRQcm90b3R5cGUucmVtb3ZlQXR0cmlidXRlLFxuICAgIHNldEF0dHJpYnV0ZSA9IEhUTUxFbGVtZW50UHJvdG90eXBlLnNldEF0dHJpYnV0ZSxcbiAgXG4gICAgLy8gcmVwbGFjZWQgbGF0ZXIgb25cbiAgICBjcmVhdGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCxcbiAgICBwYXRjaGVkQ3JlYXRlRWxlbWVudCA9IGNyZWF0ZUVsZW1lbnQsXG4gIFxuICAgIC8vIHNoYXJlZCBvYnNlcnZlciBmb3IgYWxsIGF0dHJpYnV0ZXNcbiAgICBhdHRyaWJ1dGVzT2JzZXJ2ZXIgPSBNdXRhdGlvbk9ic2VydmVyICYmIHtcbiAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IHRydWVcbiAgICB9LFxuICBcbiAgICAvLyB1c2VmdWwgdG8gZGV0ZWN0IG9ubHkgaWYgdGhlcmUncyBubyBNdXRhdGlvbk9ic2VydmVyXG4gICAgRE9NQXR0ck1vZGlmaWVkID0gTXV0YXRpb25PYnNlcnZlciB8fCBmdW5jdGlvbihlKSB7XG4gICAgICBkb2VzTm90U3VwcG9ydERPTUF0dHJNb2RpZmllZCA9IGZhbHNlO1xuICAgICAgZG9jdW1lbnRFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgICAgIERPTV9BVFRSX01PRElGSUVELFxuICAgICAgICBET01BdHRyTW9kaWZpZWRcbiAgICAgICk7XG4gICAgfSxcbiAgXG4gICAgLy8gd2lsbCBib3RoIGJlIHVzZWQgdG8gbWFrZSBET01Ob2RlSW5zZXJ0ZWQgYXN5bmNocm9ub3VzXG4gICAgYXNhcFF1ZXVlLFxuICAgIGFzYXBUaW1lciA9IDAsXG4gIFxuICAgIC8vIGludGVybmFsIGZsYWdzXG4gICAgc2V0TGlzdGVuZXIgPSBmYWxzZSxcbiAgICBkb2VzTm90U3VwcG9ydERPTUF0dHJNb2RpZmllZCA9IHRydWUsXG4gICAgZHJvcERvbUNvbnRlbnRMb2FkZWQgPSB0cnVlLFxuICBcbiAgICAvLyBuZWVkZWQgZm9yIHRoZSBpbm5lckhUTUwgaGVscGVyXG4gICAgbm90RnJvbUlubmVySFRNTEhlbHBlciA9IHRydWUsXG4gIFxuICAgIC8vIG9wdGlvbmFsbHkgZGVmaW5lZCBsYXRlciBvblxuICAgIG9uU3VidHJlZU1vZGlmaWVkLFxuICAgIGNhbGxET01BdHRyTW9kaWZpZWQsXG4gICAgZ2V0QXR0cmlidXRlc01pcnJvcixcbiAgICBvYnNlcnZlcixcbiAgICBvYnNlcnZlLFxuICBcbiAgICAvLyBiYXNlZCBvbiBzZXR0aW5nIHByb3RvdHlwZSBjYXBhYmlsaXR5XG4gICAgLy8gd2lsbCBjaGVjayBwcm90byBvciB0aGUgZXhwYW5kbyBhdHRyaWJ1dGVcbiAgICAvLyBpbiBvcmRlciB0byBzZXR1cCB0aGUgbm9kZSBvbmNlXG4gICAgcGF0Y2hJZk5vdEFscmVhZHksXG4gICAgcGF0Y2hcbiAgO1xuICBcbiAgLy8gb25seSBpZiBuZWVkZWRcbiAgaWYgKCEoUkVHSVNURVJfRUxFTUVOVCBpbiBkb2N1bWVudCkpIHtcbiAgXG4gICAgaWYgKHNQTyB8fCBoYXNQcm90bykge1xuICAgICAgICBwYXRjaElmTm90QWxyZWFkeSA9IGZ1bmN0aW9uIChub2RlLCBwcm90bykge1xuICAgICAgICAgIGlmICghaVBPLmNhbGwocHJvdG8sIG5vZGUpKSB7XG4gICAgICAgICAgICBzZXR1cE5vZGUobm9kZSwgcHJvdG8pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcGF0Y2ggPSBzZXR1cE5vZGU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcGF0Y2hJZk5vdEFscmVhZHkgPSBmdW5jdGlvbiAobm9kZSwgcHJvdG8pIHtcbiAgICAgICAgICBpZiAoIW5vZGVbRVhQQU5ET19VSURdKSB7XG4gICAgICAgICAgICBub2RlW0VYUEFORE9fVUlEXSA9IE9iamVjdCh0cnVlKTtcbiAgICAgICAgICAgIHNldHVwTm9kZShub2RlLCBwcm90byk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBwYXRjaCA9IHBhdGNoSWZOb3RBbHJlYWR5O1xuICAgIH1cbiAgXG4gICAgaWYgKElFOCkge1xuICAgICAgZG9lc05vdFN1cHBvcnRET01BdHRyTW9kaWZpZWQgPSBmYWxzZTtcbiAgICAgIChmdW5jdGlvbiAoKXtcbiAgICAgICAgdmFyXG4gICAgICAgICAgZGVzY3JpcHRvciA9IGdPUEQoSFRNTEVsZW1lbnRQcm90b3R5cGUsIEFERF9FVkVOVF9MSVNURU5FUiksXG4gICAgICAgICAgYWRkRXZlbnRMaXN0ZW5lciA9IGRlc2NyaXB0b3IudmFsdWUsXG4gICAgICAgICAgcGF0Y2hlZFJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICB2YXIgZSA9IG5ldyBDdXN0b21FdmVudChET01fQVRUUl9NT0RJRklFRCwge2J1YmJsZXM6IHRydWV9KTtcbiAgICAgICAgICAgIGUuYXR0ck5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgZS5wcmV2VmFsdWUgPSBnZXRBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuYW1lKTtcbiAgICAgICAgICAgIGUubmV3VmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgZVtSRU1PVkFMXSA9IGUuYXR0ckNoYW5nZSA9IDI7XG4gICAgICAgICAgICByZW1vdmVBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuYW1lKTtcbiAgICAgICAgICAgIGRpc3BhdGNoRXZlbnQuY2FsbCh0aGlzLCBlKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHBhdGNoZWRTZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICBoYWQgPSBoYXNBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuYW1lKSxcbiAgICAgICAgICAgICAgb2xkID0gaGFkICYmIGdldEF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUpLFxuICAgICAgICAgICAgICBlID0gbmV3IEN1c3RvbUV2ZW50KERPTV9BVFRSX01PRElGSUVELCB7YnViYmxlczogdHJ1ZX0pXG4gICAgICAgICAgICA7XG4gICAgICAgICAgICBzZXRBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgICBlLmF0dHJOYW1lID0gbmFtZTtcbiAgICAgICAgICAgIGUucHJldlZhbHVlID0gaGFkID8gb2xkIDogbnVsbDtcbiAgICAgICAgICAgIGUubmV3VmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIGlmIChoYWQpIHtcbiAgICAgICAgICAgICAgZVtNT0RJRklDQVRJT05dID0gZS5hdHRyQ2hhbmdlID0gMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGVbQURESVRJT05dID0gZS5hdHRyQ2hhbmdlID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpc3BhdGNoRXZlbnQuY2FsbCh0aGlzLCBlKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uUHJvcGVydHlDaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLy8ganNoaW50IGVxbnVsbDp0cnVlXG4gICAgICAgICAgICB2YXJcbiAgICAgICAgICAgICAgbm9kZSA9IGUuY3VycmVudFRhcmdldCxcbiAgICAgICAgICAgICAgc3VwZXJTZWNyZXQgPSBub2RlW0VYUEFORE9fVUlEXSxcbiAgICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gZS5wcm9wZXJ0eU5hbWUsXG4gICAgICAgICAgICAgIGV2ZW50XG4gICAgICAgICAgICA7XG4gICAgICAgICAgICBpZiAoc3VwZXJTZWNyZXQuaGFzT3duUHJvcGVydHkocHJvcGVydHlOYW1lKSkge1xuICAgICAgICAgICAgICBzdXBlclNlY3JldCA9IHN1cGVyU2VjcmV0W3Byb3BlcnR5TmFtZV07XG4gICAgICAgICAgICAgIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KERPTV9BVFRSX01PRElGSUVELCB7YnViYmxlczogdHJ1ZX0pO1xuICAgICAgICAgICAgICBldmVudC5hdHRyTmFtZSA9IHN1cGVyU2VjcmV0Lm5hbWU7XG4gICAgICAgICAgICAgIGV2ZW50LnByZXZWYWx1ZSA9IHN1cGVyU2VjcmV0LnZhbHVlIHx8IG51bGw7XG4gICAgICAgICAgICAgIGV2ZW50Lm5ld1ZhbHVlID0gKHN1cGVyU2VjcmV0LnZhbHVlID0gbm9kZVtwcm9wZXJ0eU5hbWVdIHx8IG51bGwpO1xuICAgICAgICAgICAgICBpZiAoZXZlbnQucHJldlZhbHVlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBldmVudFtBRERJVElPTl0gPSBldmVudC5hdHRyQ2hhbmdlID0gMDtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBldmVudFtNT0RJRklDQVRJT05dID0gZXZlbnQuYXR0ckNoYW5nZSA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZGlzcGF0Y2hFdmVudC5jYWxsKG5vZGUsIGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIDtcbiAgICAgICAgZGVzY3JpcHRvci52YWx1ZSA9IGZ1bmN0aW9uICh0eXBlLCBoYW5kbGVyLCBjYXB0dXJlKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZSA9PT0gRE9NX0FUVFJfTU9ESUZJRUQgJiZcbiAgICAgICAgICAgIHRoaXNbQVRUUklCVVRFX0NIQU5HRURfQ0FMTEJBQ0tdICYmXG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZSAhPT0gcGF0Y2hlZFNldEF0dHJpYnV0ZVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpc1tFWFBBTkRPX1VJRF0gPSB7XG4gICAgICAgICAgICAgIGNsYXNzTmFtZToge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdjbGFzcycsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHRoaXMuY2xhc3NOYW1lXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZSA9IHBhdGNoZWRTZXRBdHRyaWJ1dGU7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZSA9IHBhdGNoZWRSZW1vdmVBdHRyaWJ1dGU7XG4gICAgICAgICAgICBhZGRFdmVudExpc3RlbmVyLmNhbGwodGhpcywgJ3Byb3BlcnR5Y2hhbmdlJywgb25Qcm9wZXJ0eUNoYW5nZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXIuY2FsbCh0aGlzLCB0eXBlLCBoYW5kbGVyLCBjYXB0dXJlKTtcbiAgICAgICAgfTtcbiAgICAgICAgZGVmaW5lUHJvcGVydHkoSFRNTEVsZW1lbnRQcm90b3R5cGUsIEFERF9FVkVOVF9MSVNURU5FUiwgZGVzY3JpcHRvcik7XG4gICAgICB9KCkpO1xuICAgIH0gZWxzZSBpZiAoIU11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICAgIGRvY3VtZW50RWxlbWVudFtBRERfRVZFTlRfTElTVEVORVJdKERPTV9BVFRSX01PRElGSUVELCBET01BdHRyTW9kaWZpZWQpO1xuICAgICAgZG9jdW1lbnRFbGVtZW50LnNldEF0dHJpYnV0ZShFWFBBTkRPX1VJRCwgMSk7XG4gICAgICBkb2N1bWVudEVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKEVYUEFORE9fVUlEKTtcbiAgICAgIGlmIChkb2VzTm90U3VwcG9ydERPTUF0dHJNb2RpZmllZCkge1xuICAgICAgICBvblN1YnRyZWVNb2RpZmllZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgdmFyXG4gICAgICAgICAgICBub2RlID0gdGhpcyxcbiAgICAgICAgICAgIG9sZEF0dHJpYnV0ZXMsXG4gICAgICAgICAgICBuZXdBdHRyaWJ1dGVzLFxuICAgICAgICAgICAga2V5XG4gICAgICAgICAgO1xuICAgICAgICAgIGlmIChub2RlID09PSBlLnRhcmdldCkge1xuICAgICAgICAgICAgb2xkQXR0cmlidXRlcyA9IG5vZGVbRVhQQU5ET19VSURdO1xuICAgICAgICAgICAgbm9kZVtFWFBBTkRPX1VJRF0gPSAobmV3QXR0cmlidXRlcyA9IGdldEF0dHJpYnV0ZXNNaXJyb3Iobm9kZSkpO1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gbmV3QXR0cmlidXRlcykge1xuICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gb2xkQXR0cmlidXRlcykpIHtcbiAgICAgICAgICAgICAgICAvLyBhdHRyaWJ1dGUgd2FzIGFkZGVkXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxET01BdHRyTW9kaWZpZWQoXG4gICAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgICAgIG9sZEF0dHJpYnV0ZXNba2V5XSxcbiAgICAgICAgICAgICAgICAgIG5ld0F0dHJpYnV0ZXNba2V5XSxcbiAgICAgICAgICAgICAgICAgIEFERElUSU9OXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChuZXdBdHRyaWJ1dGVzW2tleV0gIT09IG9sZEF0dHJpYnV0ZXNba2V5XSkge1xuICAgICAgICAgICAgICAgIC8vIGF0dHJpYnV0ZSB3YXMgY2hhbmdlZFxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsRE9NQXR0ck1vZGlmaWVkKFxuICAgICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgICAgICBvbGRBdHRyaWJ1dGVzW2tleV0sXG4gICAgICAgICAgICAgICAgICBuZXdBdHRyaWJ1dGVzW2tleV0sXG4gICAgICAgICAgICAgICAgICBNT0RJRklDQVRJT05cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjaGVja2luZyBpZiBpdCBoYXMgYmVlbiByZW1vdmVkXG4gICAgICAgICAgICBmb3IgKGtleSBpbiBvbGRBdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICAgIGlmICghKGtleSBpbiBuZXdBdHRyaWJ1dGVzKSkge1xuICAgICAgICAgICAgICAgIC8vIGF0dHJpYnV0ZSByZW1vdmVkXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxET01BdHRyTW9kaWZpZWQoXG4gICAgICAgICAgICAgICAgICAyLFxuICAgICAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgICAgIG9sZEF0dHJpYnV0ZXNba2V5XSxcbiAgICAgICAgICAgICAgICAgIG5ld0F0dHJpYnV0ZXNba2V5XSxcbiAgICAgICAgICAgICAgICAgIFJFTU9WQUxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjYWxsRE9NQXR0ck1vZGlmaWVkID0gZnVuY3Rpb24gKFxuICAgICAgICAgIGF0dHJDaGFuZ2UsXG4gICAgICAgICAgY3VycmVudFRhcmdldCxcbiAgICAgICAgICBhdHRyTmFtZSxcbiAgICAgICAgICBwcmV2VmFsdWUsXG4gICAgICAgICAgbmV3VmFsdWUsXG4gICAgICAgICAgYWN0aW9uXG4gICAgICAgICkge1xuICAgICAgICAgIHZhciBlID0ge1xuICAgICAgICAgICAgYXR0ckNoYW5nZTogYXR0ckNoYW5nZSxcbiAgICAgICAgICAgIGN1cnJlbnRUYXJnZXQ6IGN1cnJlbnRUYXJnZXQsXG4gICAgICAgICAgICBhdHRyTmFtZTogYXR0ck5hbWUsXG4gICAgICAgICAgICBwcmV2VmFsdWU6IHByZXZWYWx1ZSxcbiAgICAgICAgICAgIG5ld1ZhbHVlOiBuZXdWYWx1ZVxuICAgICAgICAgIH07XG4gICAgICAgICAgZVthY3Rpb25dID0gYXR0ckNoYW5nZTtcbiAgICAgICAgICBvbkRPTUF0dHJNb2RpZmllZChlKTtcbiAgICAgICAgfTtcbiAgICAgICAgZ2V0QXR0cmlidXRlc01pcnJvciA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgZm9yICh2YXJcbiAgICAgICAgICAgIGF0dHIsIG5hbWUsXG4gICAgICAgICAgICByZXN1bHQgPSB7fSxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMgPSBub2RlLmF0dHJpYnV0ZXMsXG4gICAgICAgICAgICBpID0gMCwgbGVuZ3RoID0gYXR0cmlidXRlcy5sZW5ndGg7XG4gICAgICAgICAgICBpIDwgbGVuZ3RoOyBpKytcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGF0dHIgPSBhdHRyaWJ1dGVzW2ldO1xuICAgICAgICAgICAgbmFtZSA9IGF0dHIubmFtZTtcbiAgICAgICAgICAgIGlmIChuYW1lICE9PSAnc2V0QXR0cmlidXRlJykge1xuICAgICAgICAgICAgICByZXN1bHRbbmFtZV0gPSBhdHRyLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgXG4gICAgLy8gc2V0IGFzIGVudW1lcmFibGUsIHdyaXRhYmxlIGFuZCBjb25maWd1cmFibGVcbiAgICBkb2N1bWVudFtSRUdJU1RFUl9FTEVNRU5UXSA9IGZ1bmN0aW9uIHJlZ2lzdGVyRWxlbWVudCh0eXBlLCBvcHRpb25zKSB7XG4gICAgICB1cHBlclR5cGUgPSB0eXBlLnRvVXBwZXJDYXNlKCk7XG4gICAgICBpZiAoIXNldExpc3RlbmVyKSB7XG4gICAgICAgIC8vIG9ubHkgZmlyc3QgdGltZSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQgaXMgdXNlZFxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHNldCB0aGlzIGxpc3RlbmVyXG4gICAgICAgIC8vIHNldHRpbmcgaXQgYnkgZGVmYXVsdCBtaWdodCBzbG93IGRvd24gZm9yIG5vIHJlYXNvblxuICAgICAgICBzZXRMaXN0ZW5lciA9IHRydWU7XG4gICAgICAgIGlmIChNdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICAgICAgb2JzZXJ2ZXIgPSAoZnVuY3Rpb24oYXR0YWNoZWQsIGRldGFjaGVkKXtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNoZWNrRW1BbGwobGlzdCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuZ3RoOyBjYWxsYmFjayhsaXN0W2krK10pKXt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKHJlY29yZHMpIHtcbiAgICAgICAgICAgICAgZm9yICh2YXJcbiAgICAgICAgICAgICAgICBjdXJyZW50LCBub2RlLCBuZXdWYWx1ZSxcbiAgICAgICAgICAgICAgICBpID0gMCwgbGVuZ3RoID0gcmVjb3Jkcy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrK1xuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gcmVjb3Jkc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudC50eXBlID09PSAnY2hpbGRMaXN0Jykge1xuICAgICAgICAgICAgICAgICAgY2hlY2tFbUFsbChjdXJyZW50LmFkZGVkTm9kZXMsIGF0dGFjaGVkKTtcbiAgICAgICAgICAgICAgICAgIGNoZWNrRW1BbGwoY3VycmVudC5yZW1vdmVkTm9kZXMsIGRldGFjaGVkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbm9kZSA9IGN1cnJlbnQudGFyZ2V0O1xuICAgICAgICAgICAgICAgICAgaWYgKG5vdEZyb21Jbm5lckhUTUxIZWxwZXIgJiZcbiAgICAgICAgICAgICAgICAgICAgICBub2RlW0FUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLXSAmJlxuICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnQuYXR0cmlidXRlTmFtZSAhPT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IGdldEF0dHJpYnV0ZS5jYWxsKG5vZGUsIGN1cnJlbnQuYXR0cmlidXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gY3VycmVudC5vbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgIG5vZGVbQVRUUklCVVRFX0NIQU5HRURfQ0FMTEJBQ0tdKFxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudC5hdHRyaWJ1dGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudC5vbGRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfShleGVjdXRlQWN0aW9uKEFUVEFDSEVEKSwgZXhlY3V0ZUFjdGlvbihERVRBQ0hFRCkpKTtcbiAgICAgICAgICBvYnNlcnZlID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIG9ic2VydmVyLm9ic2VydmUoXG4gICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgc3VidHJlZTogdHJ1ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgfTtcbiAgICAgICAgICBvYnNlcnZlKGRvY3VtZW50KTtcbiAgICAgICAgICBpZiAoYXR0YWNoU2hhZG93KSB7XG4gICAgICAgICAgICBIVE1MRWxlbWVudFByb3RvdHlwZS5hdHRhY2hTaGFkb3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHJldHVybiBvYnNlcnZlKGF0dGFjaFNoYWRvdy5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFzYXBRdWV1ZSA9IFtdO1xuICAgICAgICAgIGRvY3VtZW50W0FERF9FVkVOVF9MSVNURU5FUl0oJ0RPTU5vZGVJbnNlcnRlZCcsIG9uRE9NTm9kZShBVFRBQ0hFRCkpO1xuICAgICAgICAgIGRvY3VtZW50W0FERF9FVkVOVF9MSVNURU5FUl0oJ0RPTU5vZGVSZW1vdmVkJywgb25ET01Ob2RlKERFVEFDSEVEKSk7XG4gICAgICAgIH1cbiAgXG4gICAgICAgIGRvY3VtZW50W0FERF9FVkVOVF9MSVNURU5FUl0oRE9NX0NPTlRFTlRfTE9BREVELCBvblJlYWR5U3RhdGVDaGFuZ2UpO1xuICAgICAgICBkb2N1bWVudFtBRERfRVZFTlRfTElTVEVORVJdKCdyZWFkeXN0YXRlY2hhbmdlJywgb25SZWFkeVN0YXRlQ2hhbmdlKTtcbiAgXG4gICAgICAgIEhUTUxFbGVtZW50UHJvdG90eXBlLmNsb25lTm9kZSA9IGZ1bmN0aW9uIChkZWVwKSB7XG4gICAgICAgICAgdmFyXG4gICAgICAgICAgICBub2RlID0gY2xvbmVOb2RlLmNhbGwodGhpcywgISFkZWVwKSxcbiAgICAgICAgICAgIGkgPSBnZXRUeXBlSW5kZXgobm9kZSlcbiAgICAgICAgICA7XG4gICAgICAgICAgaWYgKC0xIDwgaSkgcGF0Y2gobm9kZSwgcHJvdG9zW2ldKTtcbiAgICAgICAgICBpZiAoZGVlcCkgbG9vcEFuZFNldHVwKG5vZGUucXVlcnlTZWxlY3RvckFsbChxdWVyeSkpO1xuICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9O1xuICAgICAgfVxuICBcbiAgICAgIGlmICgtMiA8IChcbiAgICAgICAgaW5kZXhPZi5jYWxsKHR5cGVzLCBQUkVGSVhfSVMgKyB1cHBlclR5cGUpICtcbiAgICAgICAgaW5kZXhPZi5jYWxsKHR5cGVzLCBQUkVGSVhfVEFHICsgdXBwZXJUeXBlKVxuICAgICAgKSkge1xuICAgICAgICB0aHJvd1R5cGVFcnJvcih0eXBlKTtcbiAgICAgIH1cbiAgXG4gICAgICBpZiAoIXZhbGlkTmFtZS50ZXN0KHVwcGVyVHlwZSkgfHwgLTEgPCBpbmRleE9mLmNhbGwoaW52YWxpZE5hbWVzLCB1cHBlclR5cGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHR5cGUgJyArIHR5cGUgKyAnIGlzIGludmFsaWQnKTtcbiAgICAgIH1cbiAgXG4gICAgICB2YXJcbiAgICAgICAgY29uc3RydWN0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIGV4dGVuZGluZyA/XG4gICAgICAgICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5vZGVOYW1lLCB1cHBlclR5cGUpIDpcbiAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUpO1xuICAgICAgICB9LFxuICAgICAgICBvcHQgPSBvcHRpb25zIHx8IE9QLFxuICAgICAgICBleHRlbmRpbmcgPSBoT1AuY2FsbChvcHQsIEVYVEVORFMpLFxuICAgICAgICBub2RlTmFtZSA9IGV4dGVuZGluZyA/IG9wdGlvbnNbRVhURU5EU10udG9VcHBlckNhc2UoKSA6IHVwcGVyVHlwZSxcbiAgICAgICAgdXBwZXJUeXBlLFxuICAgICAgICBpXG4gICAgICA7XG4gIFxuICAgICAgaWYgKGV4dGVuZGluZyAmJiAtMSA8IChcbiAgICAgICAgaW5kZXhPZi5jYWxsKHR5cGVzLCBQUkVGSVhfVEFHICsgbm9kZU5hbWUpXG4gICAgICApKSB7XG4gICAgICAgIHRocm93VHlwZUVycm9yKG5vZGVOYW1lKTtcbiAgICAgIH1cbiAgXG4gICAgICBpID0gdHlwZXMucHVzaCgoZXh0ZW5kaW5nID8gUFJFRklYX0lTIDogUFJFRklYX1RBRykgKyB1cHBlclR5cGUpIC0gMTtcbiAgXG4gICAgICBxdWVyeSA9IHF1ZXJ5LmNvbmNhdChcbiAgICAgICAgcXVlcnkubGVuZ3RoID8gJywnIDogJycsXG4gICAgICAgIGV4dGVuZGluZyA/IG5vZGVOYW1lICsgJ1tpcz1cIicgKyB0eXBlLnRvTG93ZXJDYXNlKCkgKyAnXCJdJyA6IG5vZGVOYW1lXG4gICAgICApO1xuICBcbiAgICAgIGNvbnN0cnVjdG9yLnByb3RvdHlwZSA9IChcbiAgICAgICAgcHJvdG9zW2ldID0gaE9QLmNhbGwob3B0LCAncHJvdG90eXBlJykgP1xuICAgICAgICAgIG9wdC5wcm90b3R5cGUgOlxuICAgICAgICAgIGNyZWF0ZShIVE1MRWxlbWVudFByb3RvdHlwZSlcbiAgICAgICk7XG4gIFxuICAgICAgbG9vcEFuZFZlcmlmeShcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxdWVyeSksXG4gICAgICAgIEFUVEFDSEVEXG4gICAgICApO1xuICBcbiAgICAgIHJldHVybiBjb25zdHJ1Y3RvcjtcbiAgICB9O1xuICBcbiAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50ID0gKHBhdGNoZWRDcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24gKGxvY2FsTmFtZSwgdHlwZUV4dGVuc2lvbikge1xuICAgICAgdmFyXG4gICAgICAgIGlzID0gZ2V0SXModHlwZUV4dGVuc2lvbiksXG4gICAgICAgIG5vZGUgPSBpcyA/XG4gICAgICAgICAgY3JlYXRlRWxlbWVudC5jYWxsKGRvY3VtZW50LCBsb2NhbE5hbWUsIHNlY29uZEFyZ3VtZW50KGlzKSkgOlxuICAgICAgICAgIGNyZWF0ZUVsZW1lbnQuY2FsbChkb2N1bWVudCwgbG9jYWxOYW1lKSxcbiAgICAgICAgbmFtZSA9ICcnICsgbG9jYWxOYW1lLFxuICAgICAgICBpID0gaW5kZXhPZi5jYWxsKFxuICAgICAgICAgIHR5cGVzLFxuICAgICAgICAgIChpcyA/IFBSRUZJWF9JUyA6IFBSRUZJWF9UQUcpICtcbiAgICAgICAgICAoaXMgfHwgbmFtZSkudG9VcHBlckNhc2UoKVxuICAgICAgICApLFxuICAgICAgICBzZXR1cCA9IC0xIDwgaVxuICAgICAgO1xuICAgICAgaWYgKGlzKSB7XG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKCdpcycsIGlzID0gaXMudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIGlmIChzZXR1cCkge1xuICAgICAgICAgIHNldHVwID0gaXNJblFTQShuYW1lLnRvVXBwZXJDYXNlKCksIGlzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbm90RnJvbUlubmVySFRNTEhlbHBlciA9ICFkb2N1bWVudC5jcmVhdGVFbGVtZW50LmlubmVySFRNTEhlbHBlcjtcbiAgICAgIGlmIChzZXR1cCkgcGF0Y2gobm9kZSwgcHJvdG9zW2ldKTtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH0pO1xuICBcbiAgfVxuICBcbiAgZnVuY3Rpb24gQVNBUCgpIHtcbiAgICB2YXIgcXVldWUgPSBhc2FwUXVldWUuc3BsaWNlKDAsIGFzYXBRdWV1ZS5sZW5ndGgpO1xuICAgIGFzYXBUaW1lciA9IDA7XG4gICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgcXVldWUuc2hpZnQoKS5jYWxsKFxuICAgICAgICBudWxsLCBxdWV1ZS5zaGlmdCgpXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gbG9vcEFuZFZlcmlmeShsaXN0LCBhY3Rpb24pIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmVyaWZ5QW5kU2V0dXBBbmRBY3Rpb24obGlzdFtpXSwgYWN0aW9uKTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGxvb3BBbmRTZXR1cChsaXN0KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3QubGVuZ3RoLCBub2RlOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIG5vZGUgPSBsaXN0W2ldO1xuICAgICAgcGF0Y2gobm9kZSwgcHJvdG9zW2dldFR5cGVJbmRleChub2RlKV0pO1xuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gZXhlY3V0ZUFjdGlvbihhY3Rpb24pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgIGlmIChpc1ZhbGlkTm9kZShub2RlKSkge1xuICAgICAgICB2ZXJpZnlBbmRTZXR1cEFuZEFjdGlvbihub2RlLCBhY3Rpb24pO1xuICAgICAgICBsb29wQW5kVmVyaWZ5KFxuICAgICAgICAgIG5vZGUucXVlcnlTZWxlY3RvckFsbChxdWVyeSksXG4gICAgICAgICAgYWN0aW9uXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gZ2V0VHlwZUluZGV4KHRhcmdldCkge1xuICAgIHZhclxuICAgICAgaXMgPSBnZXRBdHRyaWJ1dGUuY2FsbCh0YXJnZXQsICdpcycpLFxuICAgICAgbm9kZU5hbWUgPSB0YXJnZXQubm9kZU5hbWUudG9VcHBlckNhc2UoKSxcbiAgICAgIGkgPSBpbmRleE9mLmNhbGwoXG4gICAgICAgIHR5cGVzLFxuICAgICAgICBpcyA/XG4gICAgICAgICAgICBQUkVGSVhfSVMgKyBpcy50b1VwcGVyQ2FzZSgpIDpcbiAgICAgICAgICAgIFBSRUZJWF9UQUcgKyBub2RlTmFtZVxuICAgICAgKVxuICAgIDtcbiAgICByZXR1cm4gaXMgJiYgLTEgPCBpICYmICFpc0luUVNBKG5vZGVOYW1lLCBpcykgPyAtMSA6IGk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGlzSW5RU0EobmFtZSwgdHlwZSkge1xuICAgIHJldHVybiAtMSA8IHF1ZXJ5LmluZGV4T2YobmFtZSArICdbaXM9XCInICsgdHlwZSArICdcIl0nKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gb25ET01BdHRyTW9kaWZpZWQoZSkge1xuICAgIHZhclxuICAgICAgbm9kZSA9IGUuY3VycmVudFRhcmdldCxcbiAgICAgIGF0dHJDaGFuZ2UgPSBlLmF0dHJDaGFuZ2UsXG4gICAgICBhdHRyTmFtZSA9IGUuYXR0ck5hbWUsXG4gICAgICB0YXJnZXQgPSBlLnRhcmdldCxcbiAgICAgIGFkZGl0aW9uID0gZVtBRERJVElPTl0gfHwgMixcbiAgICAgIHJlbW92YWwgPSBlW1JFTU9WQUxdIHx8IDNcbiAgICA7XG4gICAgaWYgKG5vdEZyb21Jbm5lckhUTUxIZWxwZXIgJiZcbiAgICAgICAgKCF0YXJnZXQgfHwgdGFyZ2V0ID09PSBub2RlKSAmJlxuICAgICAgICBub2RlW0FUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLXSAmJlxuICAgICAgICBhdHRyTmFtZSAhPT0gJ3N0eWxlJyAmJiAoXG4gICAgICAgICAgZS5wcmV2VmFsdWUgIT09IGUubmV3VmFsdWUgfHxcbiAgICAgICAgICAvLyBJRTksIElFMTAsIGFuZCBPcGVyYSAxMiBnb3RjaGFcbiAgICAgICAgICBlLm5ld1ZhbHVlID09PSAnJyAmJiAoXG4gICAgICAgICAgICBhdHRyQ2hhbmdlID09PSBhZGRpdGlvbiB8fFxuICAgICAgICAgICAgYXR0ckNoYW5nZSA9PT0gcmVtb3ZhbFxuICAgICAgICAgIClcbiAgICApKSB7XG4gICAgICBub2RlW0FUVFJJQlVURV9DSEFOR0VEX0NBTExCQUNLXShcbiAgICAgICAgYXR0ck5hbWUsXG4gICAgICAgIGF0dHJDaGFuZ2UgPT09IGFkZGl0aW9uID8gbnVsbCA6IGUucHJldlZhbHVlLFxuICAgICAgICBhdHRyQ2hhbmdlID09PSByZW1vdmFsID8gbnVsbCA6IGUubmV3VmFsdWVcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBvbkRPTU5vZGUoYWN0aW9uKSB7XG4gICAgdmFyIGV4ZWN1dG9yID0gZXhlY3V0ZUFjdGlvbihhY3Rpb24pO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZSkge1xuICAgICAgYXNhcFF1ZXVlLnB1c2goZXhlY3V0b3IsIGUudGFyZ2V0KTtcbiAgICAgIGlmIChhc2FwVGltZXIpIGNsZWFyVGltZW91dChhc2FwVGltZXIpO1xuICAgICAgYXNhcFRpbWVyID0gc2V0VGltZW91dChBU0FQLCAxKTtcbiAgICB9O1xuICB9XG4gIFxuICBmdW5jdGlvbiBvblJlYWR5U3RhdGVDaGFuZ2UoZSkge1xuICAgIGlmIChkcm9wRG9tQ29udGVudExvYWRlZCkge1xuICAgICAgZHJvcERvbUNvbnRlbnRMb2FkZWQgPSBmYWxzZTtcbiAgICAgIGUuY3VycmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKERPTV9DT05URU5UX0xPQURFRCwgb25SZWFkeVN0YXRlQ2hhbmdlKTtcbiAgICB9XG4gICAgbG9vcEFuZFZlcmlmeShcbiAgICAgIChlLnRhcmdldCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3RvckFsbChxdWVyeSksXG4gICAgICBlLmRldGFpbCA9PT0gREVUQUNIRUQgPyBERVRBQ0hFRCA6IEFUVEFDSEVEXG4gICAgKTtcbiAgICBpZiAoSUU4KSBwdXJnZSgpO1xuICB9XG4gIFxuICBmdW5jdGlvbiBwYXRjaGVkU2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKSB7XG4gICAgLy8ganNoaW50IHZhbGlkdGhpczp0cnVlXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHNldEF0dHJpYnV0ZS5jYWxsKHNlbGYsIG5hbWUsIHZhbHVlKTtcbiAgICBvblN1YnRyZWVNb2RpZmllZC5jYWxsKHNlbGYsIHt0YXJnZXQ6IHNlbGZ9KTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gc2V0dXBOb2RlKG5vZGUsIHByb3RvKSB7XG4gICAgc2V0UHJvdG90eXBlKG5vZGUsIHByb3RvKTtcbiAgICBpZiAob2JzZXJ2ZXIpIHtcbiAgICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwgYXR0cmlidXRlc09ic2VydmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGRvZXNOb3RTdXBwb3J0RE9NQXR0ck1vZGlmaWVkKSB7XG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlID0gcGF0Y2hlZFNldEF0dHJpYnV0ZTtcbiAgICAgICAgbm9kZVtFWFBBTkRPX1VJRF0gPSBnZXRBdHRyaWJ1dGVzTWlycm9yKG5vZGUpO1xuICAgICAgICBub2RlW0FERF9FVkVOVF9MSVNURU5FUl0oRE9NX1NVQlRSRUVfTU9ESUZJRUQsIG9uU3VidHJlZU1vZGlmaWVkKTtcbiAgICAgIH1cbiAgICAgIG5vZGVbQUREX0VWRU5UX0xJU1RFTkVSXShET01fQVRUUl9NT0RJRklFRCwgb25ET01BdHRyTW9kaWZpZWQpO1xuICAgIH1cbiAgICBpZiAobm9kZVtDUkVBVEVEX0NBTExCQUNLXSAmJiBub3RGcm9tSW5uZXJIVE1MSGVscGVyKSB7XG4gICAgICBub2RlLmNyZWF0ZWQgPSB0cnVlO1xuICAgICAgbm9kZVtDUkVBVEVEX0NBTExCQUNLXSgpO1xuICAgICAgbm9kZS5jcmVhdGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBwdXJnZSgpIHtcbiAgICBmb3IgKHZhclxuICAgICAgbm9kZSxcbiAgICAgIGkgPSAwLFxuICAgICAgbGVuZ3RoID0gdGFyZ2V0cy5sZW5ndGg7XG4gICAgICBpIDwgbGVuZ3RoOyBpKytcbiAgICApIHtcbiAgICAgIG5vZGUgPSB0YXJnZXRzW2ldO1xuICAgICAgaWYgKCFkb2N1bWVudEVsZW1lbnQuY29udGFpbnMobm9kZSkpIHtcbiAgICAgICAgbGVuZ3RoLS07XG4gICAgICAgIHRhcmdldHMuc3BsaWNlKGktLSwgMSk7XG4gICAgICAgIHZlcmlmeUFuZFNldHVwQW5kQWN0aW9uKG5vZGUsIERFVEFDSEVEKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHRocm93VHlwZUVycm9yKHR5cGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgJyArIHR5cGUgKyAnIHR5cGUgaXMgYWxyZWFkeSByZWdpc3RlcmVkJyk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHZlcmlmeUFuZFNldHVwQW5kQWN0aW9uKG5vZGUsIGFjdGlvbikge1xuICAgIHZhclxuICAgICAgZm4sXG4gICAgICBpID0gZ2V0VHlwZUluZGV4KG5vZGUpXG4gICAgO1xuICAgIGlmICgtMSA8IGkpIHtcbiAgICAgIHBhdGNoSWZOb3RBbHJlYWR5KG5vZGUsIHByb3Rvc1tpXSk7XG4gICAgICBpID0gMDtcbiAgICAgIGlmIChhY3Rpb24gPT09IEFUVEFDSEVEICYmICFub2RlW0FUVEFDSEVEXSkge1xuICAgICAgICBub2RlW0RFVEFDSEVEXSA9IGZhbHNlO1xuICAgICAgICBub2RlW0FUVEFDSEVEXSA9IHRydWU7XG4gICAgICAgIGkgPSAxO1xuICAgICAgICBpZiAoSUU4ICYmIGluZGV4T2YuY2FsbCh0YXJnZXRzLCBub2RlKSA8IDApIHtcbiAgICAgICAgICB0YXJnZXRzLnB1c2gobm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBERVRBQ0hFRCAmJiAhbm9kZVtERVRBQ0hFRF0pIHtcbiAgICAgICAgbm9kZVtBVFRBQ0hFRF0gPSBmYWxzZTtcbiAgICAgICAgbm9kZVtERVRBQ0hFRF0gPSB0cnVlO1xuICAgICAgICBpID0gMTtcbiAgICAgIH1cbiAgICAgIGlmIChpICYmIChmbiA9IG5vZGVbYWN0aW9uICsgQ0FMTEJBQ0tdKSkgZm4uY2FsbChub2RlKTtcbiAgICB9XG4gIH1cbiAgXG4gIFxuICBcbiAgLy8gVjEgaW4gZGEgSG91c2UhXG4gIGZ1bmN0aW9uIEN1c3RvbUVsZW1lbnRSZWdpc3RyeSgpIHt9XG4gIFxuICBDdXN0b21FbGVtZW50UmVnaXN0cnkucHJvdG90eXBlID0ge1xuICAgIGNvbnN0cnVjdG9yOiBDdXN0b21FbGVtZW50UmVnaXN0cnksXG4gICAgLy8gYSB3b3JrYXJvdW5kIGZvciB0aGUgc3R1YmJvcm4gV2ViS2l0XG4gICAgZGVmaW5lOiB1c2FibGVDdXN0b21FbGVtZW50cyA/XG4gICAgICBmdW5jdGlvbiAobmFtZSwgQ2xhc3MsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICBDRVJEZWZpbmUobmFtZSwgQ2xhc3MsIG9wdGlvbnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBOQU1FID0gbmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgIGNvbnN0cnVjdG9yc1tOQU1FXSA9IHtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yOiBDbGFzcyxcbiAgICAgICAgICAgIGNyZWF0ZTogW05BTUVdXG4gICAgICAgICAgfTtcbiAgICAgICAgICBub2RlTmFtZXMuc2V0KENsYXNzLCBOQU1FKTtcbiAgICAgICAgICBjdXN0b21FbGVtZW50cy5kZWZpbmUobmFtZSwgQ2xhc3MpO1xuICAgICAgICB9XG4gICAgICB9IDpcbiAgICAgIENFUkRlZmluZSxcbiAgICBnZXQ6IHVzYWJsZUN1c3RvbUVsZW1lbnRzID9cbiAgICAgIGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHJldHVybiBjdXN0b21FbGVtZW50cy5nZXQobmFtZSkgfHwgZ2V0KG5hbWUpO1xuICAgICAgfSA6XG4gICAgICBnZXQsXG4gICAgd2hlbkRlZmluZWQ6IHVzYWJsZUN1c3RvbUVsZW1lbnRzID9cbiAgICAgIGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgIGN1c3RvbUVsZW1lbnRzLndoZW5EZWZpbmVkKG5hbWUpLFxuICAgICAgICAgIHdoZW5EZWZpbmVkKG5hbWUpXG4gICAgICAgIF0pO1xuICAgICAgfSA6XG4gICAgICB3aGVuRGVmaW5lZFxuICB9O1xuICBcbiAgZnVuY3Rpb24gQ0VSRGVmaW5lKG5hbWUsIENsYXNzLCBvcHRpb25zKSB7XG4gICAgdmFyXG4gICAgICBpcyA9IG9wdGlvbnMgJiYgb3B0aW9uc1tFWFRFTkRTXSB8fCAnJyxcbiAgICAgIENQcm90byA9IENsYXNzLnByb3RvdHlwZSxcbiAgICAgIHByb3RvID0gY3JlYXRlKENQcm90byksXG4gICAgICBhdHRyaWJ1dGVzID0gQ2xhc3Mub2JzZXJ2ZWRBdHRyaWJ1dGVzIHx8IGVtcHR5LFxuICAgICAgZGVmaW5pdGlvbiA9IHtwcm90b3R5cGU6IHByb3RvfVxuICAgIDtcbiAgICAvLyBUT0RPOiBpcyB0aGlzIG5lZWRlZCBhdCBhbGwgc2luY2UgaXQncyBpbmhlcml0ZWQ/XG4gICAgLy8gZGVmaW5lUHJvcGVydHkocHJvdG8sICdjb25zdHJ1Y3RvcicsIHt2YWx1ZTogQ2xhc3N9KTtcbiAgICBzYWZlUHJvcGVydHkocHJvdG8sIENSRUFURURfQ0FMTEJBQ0ssIHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoanVzdENyZWF0ZWQpIGp1c3RDcmVhdGVkID0gZmFsc2U7XG4gICAgICAgICAgZWxzZSBpZiAoIXRoaXNbRFJFQ0VWMV0pIHtcbiAgICAgICAgICAgIHRoaXNbRFJFQ0VWMV0gPSB0cnVlO1xuICAgICAgICAgICAgbmV3IENsYXNzKHRoaXMpO1xuICAgICAgICAgICAgaWYgKENQcm90b1tDUkVBVEVEX0NBTExCQUNLXSlcbiAgICAgICAgICAgICAgQ1Byb3RvW0NSRUFURURfQ0FMTEJBQ0tdLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB2YXIgaW5mbyA9IGNvbnN0cnVjdG9yc1tub2RlTmFtZXMuZ2V0KENsYXNzKV07XG4gICAgICAgICAgICBpZiAoIXVzYWJsZUN1c3RvbUVsZW1lbnRzIHx8IGluZm8uY3JlYXRlLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgbm90aWZ5QXR0cmlidXRlcyh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgc2FmZVByb3BlcnR5KHByb3RvLCBBVFRSSUJVVEVfQ0hBTkdFRF9DQUxMQkFDSywge1xuICAgICAgdmFsdWU6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGlmICgtMSA8IGluZGV4T2YuY2FsbChhdHRyaWJ1dGVzLCBuYW1lKSlcbiAgICAgICAgICBDUHJvdG9bQVRUUklCVVRFX0NIQU5HRURfQ0FMTEJBQ0tdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKENQcm90b1tDT05ORUNURURfQ0FMTEJBQ0tdKSB7XG4gICAgICBzYWZlUHJvcGVydHkocHJvdG8sIEFUVEFDSEVEX0NBTExCQUNLLCB7XG4gICAgICAgIHZhbHVlOiBDUHJvdG9bQ09OTkVDVEVEX0NBTExCQUNLXVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChDUHJvdG9bRElTQ09OTkVDVEVEX0NBTExCQUNLXSkge1xuICAgICAgc2FmZVByb3BlcnR5KHByb3RvLCBERVRBQ0hFRF9DQUxMQkFDSywge1xuICAgICAgICB2YWx1ZTogQ1Byb3RvW0RJU0NPTk5FQ1RFRF9DQUxMQkFDS11cbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoaXMpIGRlZmluaXRpb25bRVhURU5EU10gPSBpcztcbiAgICBuYW1lID0gbmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgIGNvbnN0cnVjdG9yc1tuYW1lXSA9IHtcbiAgICAgIGNvbnN0cnVjdG9yOiBDbGFzcyxcbiAgICAgIGNyZWF0ZTogaXMgPyBbaXMsIHNlY29uZEFyZ3VtZW50KG5hbWUpXSA6IFtuYW1lXVxuICAgIH07XG4gICAgbm9kZU5hbWVzLnNldChDbGFzcywgbmFtZSk7XG4gICAgZG9jdW1lbnRbUkVHSVNURVJfRUxFTUVOVF0obmFtZS50b0xvd2VyQ2FzZSgpLCBkZWZpbml0aW9uKTtcbiAgICB3aGVuRGVmaW5lZChuYW1lKTtcbiAgICB3YWl0aW5nTGlzdFtuYW1lXS5yKCk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGdldChuYW1lKSB7XG4gICAgdmFyIGluZm8gPSBjb25zdHJ1Y3RvcnNbbmFtZS50b1VwcGVyQ2FzZSgpXTtcbiAgICByZXR1cm4gaW5mbyAmJiBpbmZvLmNvbnN0cnVjdG9yO1xuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRJcyhvcHRpb25zKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJyA/XG4gICAgICAgIG9wdGlvbnMgOiAob3B0aW9ucyAmJiBvcHRpb25zLmlzIHx8ICcnKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gbm90aWZ5QXR0cmlidXRlcyhzZWxmKSB7XG4gICAgdmFyXG4gICAgICBjYWxsYmFjayA9IHNlbGZbQVRUUklCVVRFX0NIQU5HRURfQ0FMTEJBQ0tdLFxuICAgICAgYXR0cmlidXRlcyA9IGNhbGxiYWNrID8gc2VsZi5hdHRyaWJ1dGVzIDogZW1wdHksXG4gICAgICBpID0gYXR0cmlidXRlcy5sZW5ndGgsXG4gICAgICBhdHRyaWJ1dGVcbiAgICA7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgYXR0cmlidXRlID0gIGF0dHJpYnV0ZXNbaV07IC8vIHx8IGF0dHJpYnV0ZXMuaXRlbShpKTtcbiAgICAgIGNhbGxiYWNrLmNhbGwoXG4gICAgICAgIHNlbGYsXG4gICAgICAgIGF0dHJpYnV0ZS5uYW1lIHx8IGF0dHJpYnV0ZS5ub2RlTmFtZSxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgYXR0cmlidXRlLnZhbHVlIHx8IGF0dHJpYnV0ZS5ub2RlVmFsdWVcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiB3aGVuRGVmaW5lZChuYW1lKSB7XG4gICAgbmFtZSA9IG5hbWUudG9VcHBlckNhc2UoKTtcbiAgICBpZiAoIShuYW1lIGluIHdhaXRpbmdMaXN0KSkge1xuICAgICAgd2FpdGluZ0xpc3RbbmFtZV0gPSB7fTtcbiAgICAgIHdhaXRpbmdMaXN0W25hbWVdLnAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICB3YWl0aW5nTGlzdFtuYW1lXS5yID0gcmVzb2x2ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gd2FpdGluZ0xpc3RbbmFtZV0ucDtcbiAgfVxuICBcbiAgZnVuY3Rpb24gcG9seWZpbGxWMSgpIHtcbiAgICBpZiAoY3VzdG9tRWxlbWVudHMpIGRlbGV0ZSB3aW5kb3cuY3VzdG9tRWxlbWVudHM7XG4gICAgZGVmaW5lUHJvcGVydHkod2luZG93LCAnY3VzdG9tRWxlbWVudHMnLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogbmV3IEN1c3RvbUVsZW1lbnRSZWdpc3RyeSgpXG4gICAgfSk7XG4gICAgZGVmaW5lUHJvcGVydHkod2luZG93LCAnQ3VzdG9tRWxlbWVudFJlZ2lzdHJ5Jywge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IEN1c3RvbUVsZW1lbnRSZWdpc3RyeVxuICAgIH0pO1xuICAgIGZvciAodmFyXG4gICAgICBwYXRjaENsYXNzID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIENsYXNzID0gd2luZG93W25hbWVdO1xuICAgICAgICBpZiAoQ2xhc3MpIHtcbiAgICAgICAgICB3aW5kb3dbbmFtZV0gPSBmdW5jdGlvbiBDdXN0b21FbGVtZW50c1YxKHNlbGYpIHtcbiAgICAgICAgICAgIHZhciBpbmZvLCBpc05hdGl2ZTtcbiAgICAgICAgICAgIGlmICghc2VsZikgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBpZiAoIXNlbGZbRFJFQ0VWMV0pIHtcbiAgICAgICAgICAgICAganVzdENyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICBpbmZvID0gY29uc3RydWN0b3JzW25vZGVOYW1lcy5nZXQoc2VsZi5jb25zdHJ1Y3RvcildO1xuICAgICAgICAgICAgICBpc05hdGl2ZSA9IHVzYWJsZUN1c3RvbUVsZW1lbnRzICYmIGluZm8uY3JlYXRlLmxlbmd0aCA9PT0gMTtcbiAgICAgICAgICAgICAgc2VsZiA9IGlzTmF0aXZlID9cbiAgICAgICAgICAgICAgICBSZWZsZWN0LmNvbnN0cnVjdChDbGFzcywgZW1wdHksIGluZm8uY29uc3RydWN0b3IpIDpcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50LmFwcGx5KGRvY3VtZW50LCBpbmZvLmNyZWF0ZSk7XG4gICAgICAgICAgICAgIHNlbGZbRFJFQ0VWMV0gPSB0cnVlO1xuICAgICAgICAgICAgICBqdXN0Q3JlYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICBpZiAoIWlzTmF0aXZlKSBub3RpZnlBdHRyaWJ1dGVzKHNlbGYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgfTtcbiAgICAgICAgICB3aW5kb3dbbmFtZV0ucHJvdG90eXBlID0gQ2xhc3MucHJvdG90eXBlO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBDbGFzcy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSB3aW5kb3dbbmFtZV07XG4gICAgICAgICAgfSBjYXRjaChXZWJLaXQpIHtcbiAgICAgICAgICAgIGZpeEdldENsYXNzID0gdHJ1ZTtcbiAgICAgICAgICAgIGRlZmluZVByb3BlcnR5KENsYXNzLCBEUkVDRVYxLCB7dmFsdWU6IHdpbmRvd1tuYW1lXX0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIENsYXNzZXMgPSBodG1sQ2xhc3MuZ2V0KC9eSFRNTFtBLVpdKlthLXpdLyksXG4gICAgICBpID0gQ2xhc3Nlcy5sZW5ndGg7XG4gICAgICBpLS07XG4gICAgICBwYXRjaENsYXNzKENsYXNzZXNbaV0pXG4gICAgKSB7fVxuICAgIChkb2N1bWVudC5jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24gKG5hbWUsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBpcyA9IGdldElzKG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIGlzID9cbiAgICAgICAgcGF0Y2hlZENyZWF0ZUVsZW1lbnQuY2FsbCh0aGlzLCBuYW1lLCBzZWNvbmRBcmd1bWVudChpcykpIDpcbiAgICAgICAgcGF0Y2hlZENyZWF0ZUVsZW1lbnQuY2FsbCh0aGlzLCBuYW1lKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLy8gaWYgY3VzdG9tRWxlbWVudHMgaXMgbm90IHRoZXJlIGF0IGFsbFxuICBpZiAoIWN1c3RvbUVsZW1lbnRzIHx8IHBvbHlmaWxsID09PSAnZm9yY2UnKSBwb2x5ZmlsbFYxKCk7XG4gIGVsc2Uge1xuICAgIC8vIGlmIGF2YWlsYWJsZSB0ZXN0IGV4dGVuZHMgd29yayBhcyBleHBlY3RlZFxuICAgIHRyeSB7XG4gICAgICAoZnVuY3Rpb24gKERSRSwgb3B0aW9ucywgbmFtZSkge1xuICAgICAgICBvcHRpb25zW0VYVEVORFNdID0gJ2EnO1xuICAgICAgICBEUkUucHJvdG90eXBlID0gY3JlYXRlKEhUTUxBbmNob3JFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgICAgIERSRS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEUkU7XG4gICAgICAgIHdpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUobmFtZSwgRFJFLCBvcHRpb25zKTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGdldEF0dHJpYnV0ZS5jYWxsKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnLCB7aXM6IG5hbWV9KSwgJ2lzJykgIT09IG5hbWUgfHxcbiAgICAgICAgICAodXNhYmxlQ3VzdG9tRWxlbWVudHMgJiYgZ2V0QXR0cmlidXRlLmNhbGwobmV3IERSRSgpLCAnaXMnKSAhPT0gbmFtZSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhyb3cgb3B0aW9ucztcbiAgICAgICAgfVxuICAgICAgfShcbiAgICAgICAgZnVuY3Rpb24gRFJFKCkge1xuICAgICAgICAgIHJldHVybiBSZWZsZWN0LmNvbnN0cnVjdChIVE1MQW5jaG9yRWxlbWVudCwgW10sIERSRSk7XG4gICAgICAgIH0sXG4gICAgICAgIHt9LFxuICAgICAgICAnZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudC1hJ1xuICAgICAgKSk7XG4gICAgfSBjYXRjaChvX08pIHtcbiAgICAgIC8vIG9yIGZvcmNlIHRoZSBwb2x5ZmlsbCBpZiBub3RcbiAgICAgIC8vIGFuZCBrZWVwIGludGVybmFsIG9yaWdpbmFsIHJlZmVyZW5jZVxuICAgICAgcG9seWZpbGxWMSgpO1xuICAgIH1cbiAgfVxuICBcbiAgdHJ5IHtcbiAgICBjcmVhdGVFbGVtZW50LmNhbGwoZG9jdW1lbnQsICdhJywgJ2EnKTtcbiAgfSBjYXRjaChGaXJlRm94KSB7XG4gICAgc2Vjb25kQXJndW1lbnQgPSBmdW5jdGlvbiAoaXMpIHtcbiAgICAgIHJldHVybiB7aXM6IGlzfTtcbiAgICB9O1xuICB9XG4gIFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGluc3RhbGxDdXN0b21FbGVtZW50cztcbmluc3RhbGxDdXN0b21FbGVtZW50cyhnbG9iYWwpO1xuIiwidmFyIEZyZWV6ZXIgPSByZXF1aXJlKCcuL3NyYy9mcmVlemVyJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEZyZWV6ZXI7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFV0aWxzID0gcmVxdWlyZSggJy4vdXRpbHMnICk7XHJcblxyXG5cclxuXHJcbi8vI2J1aWxkXHJcblxyXG5cclxudmFyIEJFRk9SRUFMTCA9ICdiZWZvcmVBbGwnLFxyXG5cdEFGVEVSQUxMID0gJ2FmdGVyQWxsJ1xyXG47XHJcbnZhciBzcGVjaWFsRXZlbnRzID0gW0JFRk9SRUFMTCwgQUZURVJBTExdO1xyXG5cclxuLy8gVGhlIHByb3RvdHlwZSBtZXRob2RzIGFyZSBzdG9yZWQgaW4gYSBkaWZmZXJlbnQgb2JqZWN0XHJcbi8vIGFuZCBhcHBsaWVkIGFzIG5vbiBlbnVtZXJhYmxlIHByb3BlcnRpZXMgbGF0ZXJcclxudmFyIGVtaXR0ZXJQcm90byA9IHtcclxuXHRvbjogZnVuY3Rpb24oIGV2ZW50TmFtZSwgbGlzdGVuZXIsIG9uY2UgKXtcclxuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbIGV2ZW50TmFtZSBdIHx8IFtdO1xyXG5cclxuXHRcdGxpc3RlbmVycy5wdXNoKHsgY2FsbGJhY2s6IGxpc3RlbmVyLCBvbmNlOiBvbmNlfSk7XHJcblx0XHR0aGlzLl9ldmVudHNbIGV2ZW50TmFtZSBdID0gIGxpc3RlbmVycztcclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRvbmNlOiBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApe1xyXG5cdFx0cmV0dXJuIHRoaXMub24oIGV2ZW50TmFtZSwgbGlzdGVuZXIsIHRydWUgKTtcclxuXHR9LFxyXG5cclxuXHRvZmY6IGZ1bmN0aW9uKCBldmVudE5hbWUsIGxpc3RlbmVyICl7XHJcblx0XHRpZiggdHlwZW9mIGV2ZW50TmFtZSA9PSAndW5kZWZpbmVkJyApe1xyXG5cdFx0XHR0aGlzLl9ldmVudHMgPSB7fTtcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYoIHR5cGVvZiBsaXN0ZW5lciA9PSAndW5kZWZpbmVkJyApIHtcclxuXHRcdFx0dGhpcy5fZXZlbnRzWyBldmVudE5hbWUgXSA9IFtdO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbIGV2ZW50TmFtZSBdIHx8IFtdLFxyXG5cdFx0XHRcdGlcclxuXHRcdFx0O1xyXG5cclxuXHRcdFx0Zm9yIChpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcblx0XHRcdFx0aWYoIGxpc3RlbmVyc1tpXS5jYWxsYmFjayA9PT0gbGlzdGVuZXIgKVxyXG5cdFx0XHRcdFx0bGlzdGVuZXJzLnNwbGljZSggaSwgMSApO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0dHJpZ2dlcjogZnVuY3Rpb24oIGV2ZW50TmFtZSApe1xyXG5cdFx0dmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKCBhcmd1bWVudHMsIDEgKSxcclxuXHRcdFx0bGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzWyBldmVudE5hbWUgXSB8fCBbXSxcclxuXHRcdFx0b25jZUxpc3RlbmVycyA9IFtdLFxyXG5cdFx0XHRzcGVjaWFsID0gc3BlY2lhbEV2ZW50cy5pbmRleE9mKCBldmVudE5hbWUgKSAhPSAtMSxcclxuXHRcdFx0aSwgbGlzdGVuZXIsIHJldHVyblZhbHVlLCBsYXN0VmFsdWVcclxuXHRcdDtcclxuXHJcblx0XHRzcGVjaWFsIHx8IHRoaXMudHJpZ2dlci5hcHBseSggdGhpcywgW0JFRk9SRUFMTCwgZXZlbnROYW1lXS5jb25jYXQoIGFyZ3MgKSApO1xyXG5cclxuXHRcdC8vIENhbGwgbGlzdGVuZXJzXHJcblx0XHRmb3IgKGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdGxpc3RlbmVyID0gbGlzdGVuZXJzW2ldO1xyXG5cclxuXHRcdFx0aWYoIGxpc3RlbmVyLmNhbGxiYWNrIClcclxuXHRcdFx0XHRsYXN0VmFsdWUgPSBsaXN0ZW5lci5jYWxsYmFjay5hcHBseSggdGhpcywgYXJncyApO1xyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHQvLyBJZiB0aGVyZSBpcyBub3QgYSBjYWxsYmFjaywgcmVtb3ZlIVxyXG5cdFx0XHRcdGxpc3RlbmVyLm9uY2UgPSB0cnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiggbGlzdGVuZXIub25jZSApXHJcblx0XHRcdFx0b25jZUxpc3RlbmVycy5wdXNoKCBpICk7XHJcblxyXG5cdFx0XHRpZiggbGFzdFZhbHVlICE9PSB1bmRlZmluZWQgKXtcclxuXHRcdFx0XHRyZXR1cm5WYWx1ZSA9IGxhc3RWYWx1ZTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIFJlbW92ZSBsaXN0ZW5lcnMgbWFya2VkIGFzIG9uY2VcclxuXHRcdGZvciggaSA9IG9uY2VMaXN0ZW5lcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKXtcclxuXHRcdFx0bGlzdGVuZXJzLnNwbGljZSggb25jZUxpc3RlbmVyc1tpXSwgMSApO1xyXG5cdFx0fVxyXG5cclxuXHRcdHNwZWNpYWwgfHwgdGhpcy50cmlnZ2VyLmFwcGx5KCB0aGlzLCBbQUZURVJBTEwsIGV2ZW50TmFtZV0uY29uY2F0KCBhcmdzICkgKTtcclxuXHJcblx0XHRyZXR1cm4gcmV0dXJuVmFsdWU7XHJcblx0fVxyXG59O1xyXG5cclxuLy8gTWV0aG9kcyBhcmUgbm90IGVudW1lcmFibGUgc28sIHdoZW4gdGhlIHN0b3JlcyBhcmVcclxuLy8gZXh0ZW5kZWQgd2l0aCB0aGUgZW1pdHRlciwgdGhleSBjYW4gYmUgaXRlcmF0ZWQgYXNcclxuLy8gaGFzaG1hcHNcclxudmFyIEVtaXR0ZXIgPSBVdGlscy5jcmVhdGVOb25FbnVtZXJhYmxlKCBlbWl0dGVyUHJvdG8gKTtcclxuLy8jYnVpbGRcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRW1pdHRlcjtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFV0aWxzID0gcmVxdWlyZSggJy4vdXRpbHMuanMnICksXHJcblx0RW1pdHRlciA9IHJlcXVpcmUoICcuL2VtaXR0ZXInICksXHJcblx0RnJvemVuID0gcmVxdWlyZSggJy4vZnJvemVuJyApXHJcbjtcclxuXHJcbi8vI2J1aWxkXHJcbnZhciBGcmVlemVyID0gZnVuY3Rpb24oIGluaXRpYWxWYWx1ZSwgb3B0aW9ucyApIHtcclxuXHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0b3BzID0gb3B0aW9ucyB8fCB7fSxcclxuXHRcdHN0b3JlID0ge1xyXG5cdFx0XHRsaXZlOiBvcHMubGl2ZSB8fCBmYWxzZSxcclxuXHRcdFx0ZnJlZXplSW5zdGFuY2VzOiBvcHMuZnJlZXplSW5zdGFuY2VzIHx8IGZhbHNlXHJcblx0XHR9XHJcblx0O1xyXG5cclxuXHQvLyBJbW11dGFibGUgZGF0YVxyXG5cdHZhciBmcm96ZW47XHJcblx0dmFyIHBpdm90VHJpZ2dlcnMgPSBbXSwgcGl2b3RUaWNraW5nID0gMDtcclxuXHR2YXIgdHJpZ2dlck5vdyA9IGZ1bmN0aW9uKCBub2RlICl7XHJcblx0XHR2YXIgXyA9IG5vZGUuX18sXHJcblx0XHRcdGlcclxuXHRcdDtcclxuXHJcblx0XHRpZiggXy5saXN0ZW5lciApe1xyXG5cdFx0XHR2YXIgcHJldlN0YXRlID0gXy5saXN0ZW5lci5wcmV2U3RhdGUgfHwgbm9kZTtcclxuXHRcdFx0Xy5saXN0ZW5lci5wcmV2U3RhdGUgPSAwO1xyXG5cdFx0XHRGcm96ZW4udHJpZ2dlciggcHJldlN0YXRlLCAndXBkYXRlJywgbm9kZSwgdHJ1ZSApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZvciAoaSA9IDA7IGkgPCBfLnBhcmVudHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0Xy5zdG9yZS5ub3RpZnkoICdub3cnLCBfLnBhcmVudHNbaV0gKTtcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHR2YXIgYWRkVG9QaXZvdFRyaWdnZXJzID0gZnVuY3Rpb24oIG5vZGUgKXtcclxuXHRcdHBpdm90VHJpZ2dlcnMucHVzaCggbm9kZSApO1xyXG5cdFx0aWYoICFwaXZvdFRpY2tpbmcgKXtcclxuXHRcdFx0cGl2b3RUaWNraW5nID0gMTtcclxuXHRcdFx0VXRpbHMubmV4dFRpY2soIGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0cGl2b3RUcmlnZ2VycyA9IFtdO1xyXG5cdFx0XHRcdHBpdm90VGlja2luZyA9IDA7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH07XHJcblxyXG5cdHN0b3JlLm5vdGlmeSA9IGZ1bmN0aW9uIG5vdGlmeSggZXZlbnROYW1lLCBub2RlLCBvcHRpb25zICl7XHJcblx0XHRpZiggZXZlbnROYW1lID09ICdub3cnICl7XHJcblx0XHRcdGlmKCBwaXZvdFRyaWdnZXJzLmxlbmd0aCApe1xyXG5cdFx0XHRcdHdoaWxlKCBwaXZvdFRyaWdnZXJzLmxlbmd0aCApe1xyXG5cdFx0XHRcdFx0dHJpZ2dlck5vdyggcGl2b3RUcmlnZ2Vycy5zaGlmdCgpICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdHRyaWdnZXJOb3coIG5vZGUgKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIG5vZGU7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIHVwZGF0ZSA9IEZyb3plbltldmVudE5hbWVdKCBub2RlLCBvcHRpb25zICk7XHJcblxyXG5cdFx0aWYoIGV2ZW50TmFtZSAhPSAncGl2b3QnICl7XHJcblx0XHRcdHZhciBwaXZvdCA9IFV0aWxzLmZpbmRQaXZvdCggdXBkYXRlICk7XHJcblx0XHRcdGlmKCBwaXZvdCApIHtcclxuXHRcdFx0XHRhZGRUb1Bpdm90VHJpZ2dlcnMoIHVwZGF0ZSApO1xyXG5cdCAgXHRcdHJldHVybiBwaXZvdDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB1cGRhdGU7XHJcblx0fTtcclxuXHJcblx0c3RvcmUuZnJlZXplRm4gPSBvcHMubXV0YWJsZSA9PT0gdHJ1ZSA/XHJcblx0XHRmdW5jdGlvbigpe30gOlxyXG5cdFx0ZnVuY3Rpb24oIG9iaiApeyBPYmplY3QuZnJlZXplKCBvYmogKTsgfVxyXG5cdDtcclxuXHJcblx0Ly8gQ3JlYXRlIHRoZSBmcm96ZW4gb2JqZWN0XHJcblx0ZnJvemVuID0gRnJvemVuLmZyZWV6ZSggaW5pdGlhbFZhbHVlLCBzdG9yZSApO1xyXG5cdGZyb3plbi5fXy51cGRhdGVSb290ID0gZnVuY3Rpb24oIHByZXZOb2RlLCB1cGRhdGVkICl7XHJcblx0XHRpZiggcHJldk5vZGUgPT09IGZyb3plbiApe1xyXG5cdFx0XHRmcm96ZW4gPSB1cGRhdGVkO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly8gTGlzdGVuIHRvIGl0cyBjaGFuZ2VzIGltbWVkaWF0ZWx5XHJcblx0dmFyIGxpc3RlbmVyID0gZnJvemVuLmdldExpc3RlbmVyKCksXHJcblx0XHRodWIgPSB7fVxyXG5cdDtcclxuXHJcblx0VXRpbHMuZWFjaChbJ29uJywgJ29mZicsICdvbmNlJywgJ3RyaWdnZXInXSwgZnVuY3Rpb24oIG1ldGhvZCApe1xyXG5cdFx0dmFyIGF0dHJzID0ge307XHJcblx0XHRhdHRyc1sgbWV0aG9kIF0gPSBsaXN0ZW5lclttZXRob2RdLmJpbmQobGlzdGVuZXIpO1xyXG5cdFx0VXRpbHMuYWRkTkUoIG1lLCBhdHRycyApO1xyXG5cdFx0VXRpbHMuYWRkTkUoIGh1YiwgYXR0cnMgKTtcclxuXHR9KTtcclxuXHJcblx0VXRpbHMuYWRkTkUoIHRoaXMsIHtcclxuXHRcdGdldDogZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIGZyb3plbjtcclxuXHRcdH0sXHJcblx0XHRzZXQ6IGZ1bmN0aW9uKCBub2RlICl7XHJcblx0XHRcdGZyb3plbi5yZXNldCggbm9kZSApO1xyXG5cdFx0fSxcclxuXHRcdGdldEV2ZW50SHViOiBmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gaHViO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHRVdGlscy5hZGRORSggdGhpcywgeyBnZXREYXRhOiB0aGlzLmdldCwgc2V0RGF0YTogdGhpcy5zZXQgfSApO1xyXG59O1xyXG5cclxuLy8jYnVpbGRcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRnJlZXplcjtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFV0aWxzID0gcmVxdWlyZSggJy4vdXRpbHMnICksXHJcblx0bm9kZUNyZWF0b3IgPSByZXF1aXJlKCAnLi9ub2RlQ3JlYXRvcicpLFxyXG5cdEVtaXR0ZXIgPSByZXF1aXJlKCcuL2VtaXR0ZXInKVxyXG47XHJcblxyXG4vLyNidWlsZFxyXG52YXIgRnJvemVuID0ge1xyXG5cdGZyZWV6ZTogZnVuY3Rpb24oIG5vZGUsIHN0b3JlICl7XHJcblx0XHRpZiggbm9kZSAmJiBub2RlLl9fICl7XHJcblx0XHRcdHJldHVybiBub2RlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdGZyb3plbiA9IG5vZGVDcmVhdG9yLmNsb25lKG5vZGUpXHJcblx0XHQ7XHJcblxyXG5cdFx0VXRpbHMuYWRkTkUoIGZyb3plbiwgeyBfXzoge1xyXG5cdFx0XHRsaXN0ZW5lcjogZmFsc2UsXHJcblx0XHRcdHBhcmVudHM6IFtdLFxyXG5cdFx0XHRzdG9yZTogc3RvcmVcclxuXHRcdH19KTtcclxuXHJcblx0XHQvLyBGcmVlemUgY2hpbGRyZW5cclxuXHRcdFV0aWxzLmVhY2goIG5vZGUsIGZ1bmN0aW9uKCBjaGlsZCwga2V5ICl7XHJcblx0XHRcdGlmKCAhVXRpbHMuaXNMZWFmKCBjaGlsZCwgc3RvcmUuZnJlZXplSW5zdGFuY2VzICkgKXtcclxuXHRcdFx0XHRjaGlsZCA9IG1lLmZyZWV6ZSggY2hpbGQsIHN0b3JlICk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmKCBjaGlsZCAmJiBjaGlsZC5fXyApe1xyXG5cdFx0XHRcdG1lLmFkZFBhcmVudCggY2hpbGQsIGZyb3plbiApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmcm96ZW5bIGtleSBdID0gY2hpbGQ7XHJcblx0XHR9KTtcclxuXHJcblx0XHRzdG9yZS5mcmVlemVGbiggZnJvemVuICk7XHJcblxyXG5cdFx0cmV0dXJuIGZyb3plbjtcclxuXHR9LFxyXG5cclxuXHRtZXJnZTogZnVuY3Rpb24oIG5vZGUsIGF0dHJzICl7XHJcblx0XHR2YXIgXyA9IG5vZGUuX18sXHJcblx0XHRcdHRyYW5zID0gXy50cmFucyxcclxuXHJcblx0XHRcdC8vIENsb25lIHRoZSBhdHRycyB0byBub3QgbW9kaWZ5IHRoZSBhcmd1bWVudFxyXG5cdFx0XHRhdHRycyA9IFV0aWxzLmV4dGVuZCgge30sIGF0dHJzKVxyXG5cdFx0O1xyXG5cclxuXHRcdGlmKCB0cmFucyApe1xyXG5cdFx0XHRmb3IoIHZhciBhdHRyIGluIGF0dHJzIClcclxuXHRcdFx0XHR0cmFuc1sgYXR0ciBdID0gYXR0cnNbIGF0dHIgXTtcclxuXHRcdFx0cmV0dXJuIG5vZGU7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIG1lID0gdGhpcyxcclxuXHRcdFx0ZnJvemVuID0gdGhpcy5jb3B5TWV0YSggbm9kZSApLFxyXG5cdFx0XHRzdG9yZSA9IF8uc3RvcmUsXHJcblx0XHRcdHZhbCwga2V5LCBpc0Zyb3plblxyXG5cdFx0O1xyXG5cclxuXHRcdFV0aWxzLmVhY2goIG5vZGUsIGZ1bmN0aW9uKCBjaGlsZCwga2V5ICl7XHJcblx0XHRcdGlzRnJvemVuID0gY2hpbGQgJiYgY2hpbGQuX187XHJcblxyXG5cdFx0XHRpZiggaXNGcm96ZW4gKXtcclxuXHRcdFx0XHRtZS5yZW1vdmVQYXJlbnQoIGNoaWxkLCBub2RlICk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhbCA9IGF0dHJzWyBrZXkgXTtcclxuXHRcdFx0aWYoICF2YWwgKXtcclxuXHRcdFx0XHRpZiggaXNGcm96ZW4gKVxyXG5cdFx0XHRcdFx0bWUuYWRkUGFyZW50KCBjaGlsZCwgZnJvemVuICk7XHJcblx0XHRcdFx0cmV0dXJuIGZyb3plblsga2V5IF0gPSBjaGlsZDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYoICFVdGlscy5pc0xlYWYoIHZhbCwgc3RvcmUuZnJlZXplSW5zdGFuY2VzICkgKVxyXG5cdFx0XHRcdHZhbCA9IG1lLmZyZWV6ZSggdmFsLCBzdG9yZSApO1xyXG5cclxuXHRcdFx0aWYoIHZhbCAmJiB2YWwuX18gKVxyXG5cdFx0XHRcdG1lLmFkZFBhcmVudCggdmFsLCBmcm96ZW4gKTtcclxuXHJcblx0XHRcdGRlbGV0ZSBhdHRyc1sga2V5IF07XHJcblxyXG5cdFx0XHRmcm96ZW5bIGtleSBdID0gdmFsO1xyXG5cdFx0fSk7XHJcblxyXG5cclxuXHRcdGZvcigga2V5IGluIGF0dHJzICkge1xyXG5cdFx0XHR2YWwgPSBhdHRyc1sga2V5IF07XHJcblxyXG5cdFx0XHRpZiggIVV0aWxzLmlzTGVhZiggdmFsLCBzdG9yZS5mcmVlemVJbnN0YW5jZXMgKSApXHJcblx0XHRcdFx0dmFsID0gbWUuZnJlZXplKCB2YWwsIHN0b3JlICk7XHJcblxyXG5cdFx0XHRpZiggdmFsICYmIHZhbC5fXyApXHJcblx0XHRcdFx0bWUuYWRkUGFyZW50KCB2YWwsIGZyb3plbiApO1xyXG5cclxuXHRcdFx0ZnJvemVuWyBrZXkgXSA9IHZhbDtcclxuXHRcdH1cclxuXHJcblx0XHRfLnN0b3JlLmZyZWV6ZUZuKCBmcm96ZW4gKTtcclxuXHJcblx0XHR0aGlzLnJlZnJlc2hQYXJlbnRzKCBub2RlLCBmcm96ZW4gKTtcclxuXHJcblx0XHRyZXR1cm4gZnJvemVuO1xyXG5cdH0sXHJcblxyXG5cdHJlcGxhY2U6IGZ1bmN0aW9uKCBub2RlLCByZXBsYWNlbWVudCApIHtcclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdF8gPSBub2RlLl9fLFxyXG5cdFx0XHRmcm96ZW4gPSByZXBsYWNlbWVudFxyXG5cdFx0O1xyXG5cclxuXHRcdGlmKCAhVXRpbHMuaXNMZWFmKCByZXBsYWNlbWVudCwgXy5zdG9yZS5mcmVlemVJbnN0YW5jZXMgKSApIHtcclxuXHJcblx0XHRcdGZyb3plbiA9IG1lLmZyZWV6ZSggcmVwbGFjZW1lbnQsIF8uc3RvcmUgKTtcclxuXHRcdFx0ZnJvemVuLl9fLnBhcmVudHMgPSBfLnBhcmVudHM7XHJcblx0XHRcdGZyb3plbi5fXy51cGRhdGVSb290ID0gXy51cGRhdGVSb290O1xyXG5cclxuXHRcdFx0Ly8gQWRkIHRoZSBjdXJyZW50IGxpc3RlbmVyIGlmIGV4aXN0cywgcmVwbGFjaW5nIGFcclxuXHRcdFx0Ly8gcHJldmlvdXMgbGlzdGVuZXIgaW4gdGhlIGZyb3plbiBpZiBleGlzdGVkXHJcblx0XHRcdGlmKCBfLmxpc3RlbmVyIClcclxuXHRcdFx0XHRmcm96ZW4uX18ubGlzdGVuZXIgPSBfLmxpc3RlbmVyO1xyXG5cdFx0fVxyXG5cdFx0aWYoIGZyb3plbiApe1xyXG5cdFx0XHR0aGlzLmZpeENoaWxkcmVuKCBmcm96ZW4sIG5vZGUgKTtcclxuXHRcdH1cclxuXHRcdHRoaXMucmVmcmVzaFBhcmVudHMoIG5vZGUsIGZyb3plbiApO1xyXG5cclxuXHRcdHJldHVybiBmcm96ZW47XHJcblx0fSxcclxuXHJcblx0cmVtb3ZlOiBmdW5jdGlvbiggbm9kZSwgYXR0cnMgKXtcclxuXHRcdHZhciB0cmFucyA9IG5vZGUuX18udHJhbnM7XHJcblx0XHRpZiggdHJhbnMgKXtcclxuXHRcdFx0Zm9yKCB2YXIgbCA9IGF0dHJzLmxlbmd0aCAtIDE7IGwgPj0gMDsgbC0tIClcclxuXHRcdFx0XHRkZWxldGUgdHJhbnNbIGF0dHJzW2xdIF07XHJcblx0XHRcdHJldHVybiBub2RlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdGZyb3plbiA9IHRoaXMuY29weU1ldGEoIG5vZGUgKSxcclxuXHRcdFx0aXNGcm96ZW5cclxuXHRcdDtcclxuXHJcblx0XHRVdGlscy5lYWNoKCBub2RlLCBmdW5jdGlvbiggY2hpbGQsIGtleSApe1xyXG5cdFx0XHRpc0Zyb3plbiA9IGNoaWxkICYmIGNoaWxkLl9fO1xyXG5cclxuXHRcdFx0aWYoIGlzRnJvemVuICl7XHJcblx0XHRcdFx0bWUucmVtb3ZlUGFyZW50KCBjaGlsZCwgbm9kZSApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiggYXR0cnMuaW5kZXhPZigga2V5ICkgIT0gLTEgKXtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmKCBpc0Zyb3plbiApXHJcblx0XHRcdFx0bWUuYWRkUGFyZW50KCBjaGlsZCwgZnJvemVuICk7XHJcblxyXG5cdFx0XHRmcm96ZW5bIGtleSBdID0gY2hpbGQ7XHJcblx0XHR9KTtcclxuXHJcblx0XHRub2RlLl9fLnN0b3JlLmZyZWV6ZUZuKCBmcm96ZW4gKTtcclxuXHRcdHRoaXMucmVmcmVzaFBhcmVudHMoIG5vZGUsIGZyb3plbiApO1xyXG5cclxuXHRcdHJldHVybiBmcm96ZW47XHJcblx0fSxcclxuXHJcblx0c3BsaWNlOiBmdW5jdGlvbiggbm9kZSwgYXJncyApe1xyXG5cdFx0dmFyIF8gPSBub2RlLl9fLFxyXG5cdFx0XHR0cmFucyA9IF8udHJhbnNcclxuXHRcdDtcclxuXHJcblx0XHRpZiggdHJhbnMgKXtcclxuXHRcdFx0dHJhbnMuc3BsaWNlLmFwcGx5KCB0cmFucywgYXJncyApO1xyXG5cdFx0XHRyZXR1cm4gbm9kZTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHRmcm96ZW4gPSB0aGlzLmNvcHlNZXRhKCBub2RlICksXHJcblx0XHRcdGluZGV4ID0gYXJnc1swXSxcclxuXHRcdFx0ZGVsZXRlSW5kZXggPSBpbmRleCArIGFyZ3NbMV0sXHJcblx0XHRcdGNoaWxkXHJcblx0XHQ7XHJcblxyXG5cdFx0Ly8gQ2xvbmUgdGhlIGFycmF5XHJcblx0XHRVdGlscy5lYWNoKCBub2RlLCBmdW5jdGlvbiggY2hpbGQsIGkgKXtcclxuXHJcblx0XHRcdGlmKCBjaGlsZCAmJiBjaGlsZC5fXyApe1xyXG5cdFx0XHRcdG1lLnJlbW92ZVBhcmVudCggY2hpbGQsIG5vZGUgKTtcclxuXHJcblx0XHRcdFx0Ly8gU2tpcCB0aGUgbm9kZXMgdG8gZGVsZXRlXHJcblx0XHRcdFx0aWYoIGkgPCBpbmRleCB8fCBpPj0gZGVsZXRlSW5kZXggKVxyXG5cdFx0XHRcdFx0bWUuYWRkUGFyZW50KCBjaGlsZCwgZnJvemVuICk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZyb3plbltpXSA9IGNoaWxkO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gUHJlcGFyZSB0aGUgbmV3IG5vZGVzXHJcblx0XHRpZiggYXJncy5sZW5ndGggPiAxICl7XHJcblx0XHRcdGZvciAodmFyIGkgPSBhcmdzLmxlbmd0aCAtIDE7IGkgPj0gMjsgaS0tKSB7XHJcblx0XHRcdFx0Y2hpbGQgPSBhcmdzW2ldO1xyXG5cclxuXHRcdFx0XHRpZiggIVV0aWxzLmlzTGVhZiggY2hpbGQsIF8uc3RvcmUuZnJlZXplSW5zdGFuY2VzICkgKVxyXG5cdFx0XHRcdFx0Y2hpbGQgPSB0aGlzLmZyZWV6ZSggY2hpbGQsIF8uc3RvcmUgKTtcclxuXHJcblx0XHRcdFx0aWYoIGNoaWxkICYmIGNoaWxkLl9fIClcclxuXHRcdFx0XHRcdHRoaXMuYWRkUGFyZW50KCBjaGlsZCwgZnJvemVuICk7XHJcblxyXG5cdFx0XHRcdGFyZ3NbaV0gPSBjaGlsZDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIHNwbGljZVxyXG5cdFx0QXJyYXkucHJvdG90eXBlLnNwbGljZS5hcHBseSggZnJvemVuLCBhcmdzICk7XHJcblxyXG5cdFx0Xy5zdG9yZS5mcmVlemVGbiggZnJvemVuICk7XHJcblx0XHR0aGlzLnJlZnJlc2hQYXJlbnRzKCBub2RlLCBmcm96ZW4gKTtcclxuXHJcblx0XHRyZXR1cm4gZnJvemVuO1xyXG5cdH0sXHJcblxyXG5cdHRyYW5zYWN0OiBmdW5jdGlvbiggbm9kZSApIHtcclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdHRyYW5zYWN0aW5nID0gbm9kZS5fXy50cmFucyxcclxuXHRcdFx0dHJhbnNcclxuXHRcdDtcclxuXHJcblx0XHRpZiggdHJhbnNhY3RpbmcgKVxyXG5cdFx0XHRyZXR1cm4gdHJhbnNhY3Rpbmc7XHJcblxyXG5cdFx0dHJhbnMgPSBub2RlLmNvbnN0cnVjdG9yID09IEFycmF5ID8gW10gOiB7fTtcclxuXHJcblx0XHRVdGlscy5lYWNoKCBub2RlLCBmdW5jdGlvbiggY2hpbGQsIGtleSApe1xyXG5cdFx0XHR0cmFuc1sga2V5IF0gPSBjaGlsZDtcclxuXHRcdH0pO1xyXG5cclxuXHRcdG5vZGUuX18udHJhbnMgPSB0cmFucztcclxuXHJcblx0XHQvLyBDYWxsIHJ1biBhdXRvbWF0aWNhbGx5IGluIGNhc2VcclxuXHRcdC8vIHRoZSB1c2VyIGZvcmdvdCBhYm91dCBpdFxyXG5cdFx0VXRpbHMubmV4dFRpY2soIGZ1bmN0aW9uKCl7XHJcblx0XHRcdGlmKCBub2RlLl9fLnRyYW5zIClcclxuXHRcdFx0XHRtZS5ydW4oIG5vZGUgKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiB0cmFucztcclxuXHR9LFxyXG5cclxuXHRydW46IGZ1bmN0aW9uKCBub2RlICkge1xyXG5cdFx0dmFyIG1lID0gdGhpcyxcclxuXHRcdFx0dHJhbnMgPSBub2RlLl9fLnRyYW5zXHJcblx0XHQ7XHJcblxyXG5cdFx0aWYoICF0cmFucyApXHJcblx0XHRcdHJldHVybiBub2RlO1xyXG5cclxuXHRcdC8vIFJlbW92ZSB0aGUgbm9kZSBhcyBhIHBhcmVudFxyXG5cdFx0VXRpbHMuZWFjaCggdHJhbnMsIGZ1bmN0aW9uKCBjaGlsZCwga2V5ICl7XHJcblx0XHRcdGlmKCBjaGlsZCAmJiBjaGlsZC5fXyApe1xyXG5cdFx0XHRcdG1lLnJlbW92ZVBhcmVudCggY2hpbGQsIG5vZGUgKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0ZGVsZXRlIG5vZGUuX18udHJhbnM7XHJcblxyXG5cdFx0dmFyIHJlc3VsdCA9IHRoaXMucmVwbGFjZSggbm9kZSwgdHJhbnMgKTtcclxuXHRcdHJldHVybiByZXN1bHQ7XHJcblx0fSxcclxuXHJcblx0cGl2b3Q6IGZ1bmN0aW9uKCBub2RlICl7XHJcblx0XHRub2RlLl9fLnBpdm90ID0gMTtcclxuXHRcdHRoaXMudW5waXZvdCggbm9kZSApO1xyXG5cdFx0cmV0dXJuIG5vZGU7XHJcblx0fSxcclxuXHJcblx0dW5waXZvdDogZnVuY3Rpb24oIG5vZGUgKXtcclxuXHRcdFV0aWxzLm5leHRUaWNrKCBmdW5jdGlvbigpe1xyXG5cdFx0XHRub2RlLl9fLnBpdm90ID0gMDtcclxuXHRcdH0pO1xyXG5cdH0sXHJcblxyXG5cdHJlZnJlc2g6IGZ1bmN0aW9uKCBub2RlLCBvbGRDaGlsZCwgbmV3Q2hpbGQgKXtcclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdHRyYW5zID0gbm9kZS5fXy50cmFucyxcclxuXHRcdFx0Zm91bmQgPSAwXHJcblx0XHQ7XHJcblxyXG5cdFx0aWYoIHRyYW5zICl7XHJcblxyXG5cdFx0XHRVdGlscy5lYWNoKCB0cmFucywgZnVuY3Rpb24oIGNoaWxkLCBrZXkgKXtcclxuXHRcdFx0XHRpZiggZm91bmQgKSByZXR1cm47XHJcblxyXG5cdFx0XHRcdGlmKCBjaGlsZCA9PT0gb2xkQ2hpbGQgKXtcclxuXHJcblx0XHRcdFx0XHR0cmFuc1sga2V5IF0gPSBuZXdDaGlsZDtcclxuXHRcdFx0XHRcdGZvdW5kID0gMTtcclxuXHJcblx0XHRcdFx0XHRpZiggbmV3Q2hpbGQgJiYgbmV3Q2hpbGQuX18gKVxyXG5cdFx0XHRcdFx0XHRtZS5hZGRQYXJlbnQoIG5ld0NoaWxkLCBub2RlICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdHJldHVybiBub2RlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBmcm96ZW4gPSB0aGlzLmNvcHlNZXRhKCBub2RlICksXHJcblx0XHRcdHJlcGxhY2VtZW50LCBfX1xyXG5cdFx0O1xyXG5cclxuXHRcdFV0aWxzLmVhY2goIG5vZGUsIGZ1bmN0aW9uKCBjaGlsZCwga2V5ICl7XHJcblx0XHRcdGlmKCBjaGlsZCA9PT0gb2xkQ2hpbGQgKXtcclxuXHRcdFx0XHRjaGlsZCA9IG5ld0NoaWxkO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiggY2hpbGQgJiYgKF9fID0gY2hpbGQuX18pICl7XHJcblx0XHRcdFx0bWUucmVtb3ZlUGFyZW50KCBjaGlsZCwgbm9kZSApO1xyXG5cdFx0XHRcdG1lLmFkZFBhcmVudCggY2hpbGQsIGZyb3plbiApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmcm96ZW5bIGtleSBdID0gY2hpbGQ7XHJcblx0XHR9KTtcclxuXHJcblx0XHRub2RlLl9fLnN0b3JlLmZyZWV6ZUZuKCBmcm96ZW4gKTtcclxuXHJcblx0XHR0aGlzLnJlZnJlc2hQYXJlbnRzKCBub2RlLCBmcm96ZW4gKTtcclxuXHR9LFxyXG5cclxuXHRmaXhDaGlsZHJlbjogZnVuY3Rpb24oIG5vZGUsIG9sZE5vZGUgKXtcclxuXHRcdHZhciBtZSA9IHRoaXM7XHJcblx0XHRVdGlscy5lYWNoKCBub2RlLCBmdW5jdGlvbiggY2hpbGQgKXtcclxuXHRcdFx0aWYoICFjaGlsZCB8fCAhY2hpbGQuX18gKVxyXG5cdFx0XHRcdHJldHVybjtcclxuXHJcblx0XHRcdC8vIFVwZGF0ZSBwYXJlbnRzIGluIGFsbCBjaGlsZHJlbiBubyBtYXR0ZXIgdGhlIGNoaWxkXHJcblx0XHRcdC8vIGlzIGxpbmtlZCB0byB0aGUgbm9kZSBvciBub3QuXHJcblx0XHRcdG1lLmZpeENoaWxkcmVuKCBjaGlsZCApO1xyXG5cclxuXHRcdFx0aWYoIGNoaWxkLl9fLnBhcmVudHMubGVuZ3RoID09IDEgKVxyXG5cdFx0XHRcdHJldHVybiBjaGlsZC5fXy5wYXJlbnRzID0gWyBub2RlIF07XHJcblxyXG5cdFx0XHRpZiggb2xkTm9kZSApXHJcblx0XHRcdFx0bWUucmVtb3ZlUGFyZW50KCBjaGlsZCwgb2xkTm9kZSApO1xyXG5cclxuXHRcdFx0bWUuYWRkUGFyZW50KCBjaGlsZCwgbm9kZSApO1xyXG5cdFx0fSk7XHJcblx0fSxcclxuXHJcblx0Y29weU1ldGE6IGZ1bmN0aW9uKCBub2RlICl7XHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHRmcm96ZW4gPSBub2RlQ3JlYXRvci5jbG9uZSggbm9kZSApLFxyXG5cdFx0XHRfID0gbm9kZS5fX1xyXG5cdFx0O1xyXG5cclxuXHRcdFV0aWxzLmFkZE5FKCBmcm96ZW4sIHtfXzoge1xyXG5cdFx0XHRzdG9yZTogXy5zdG9yZSxcclxuXHRcdFx0dXBkYXRlUm9vdDogXy51cGRhdGVSb290LFxyXG5cdFx0XHRsaXN0ZW5lcjogXy5saXN0ZW5lcixcclxuXHRcdFx0cGFyZW50czogXy5wYXJlbnRzLnNsaWNlKCAwICksXHJcblx0XHRcdHRyYW5zOiBfLnRyYW5zLFxyXG5cdFx0XHRwaXZvdDogXy5waXZvdCxcclxuXHRcdH19KTtcclxuXHJcblx0XHRpZiggXy5waXZvdCApXHJcblx0XHRcdHRoaXMudW5waXZvdCggZnJvemVuICk7XHJcblxyXG5cdFx0cmV0dXJuIGZyb3plbjtcclxuXHR9LFxyXG5cclxuXHRyZWZyZXNoUGFyZW50czogZnVuY3Rpb24oIG9sZENoaWxkLCBuZXdDaGlsZCApe1xyXG5cdFx0dmFyIF8gPSBvbGRDaGlsZC5fXyxcclxuXHRcdFx0cGFyZW50cyA9IF8ucGFyZW50cy5sZW5ndGgsXHJcblx0XHRcdGlcclxuXHRcdDtcclxuXHJcblx0XHRpZiggb2xkQ2hpbGQuX18udXBkYXRlUm9vdCApe1xyXG5cdFx0XHRvbGRDaGlsZC5fXy51cGRhdGVSb290KCBvbGRDaGlsZCwgbmV3Q2hpbGQgKTtcclxuXHRcdH1cclxuXHRcdGlmKCBuZXdDaGlsZCApe1xyXG5cdFx0XHR0aGlzLnRyaWdnZXIoIG9sZENoaWxkLCAndXBkYXRlJywgbmV3Q2hpbGQsIF8uc3RvcmUubGl2ZSApO1xyXG5cdFx0fVxyXG5cdFx0aWYoIHBhcmVudHMgKXtcclxuXHRcdFx0Zm9yIChpID0gcGFyZW50cyAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcblx0XHRcdFx0dGhpcy5yZWZyZXNoKCBfLnBhcmVudHNbaV0sIG9sZENoaWxkLCBuZXdDaGlsZCApO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0cmVtb3ZlUGFyZW50OiBmdW5jdGlvbiggbm9kZSwgcGFyZW50ICl7XHJcblx0XHR2YXIgcGFyZW50cyA9IG5vZGUuX18ucGFyZW50cyxcclxuXHRcdFx0aW5kZXggPSBwYXJlbnRzLmluZGV4T2YoIHBhcmVudCApXHJcblx0XHQ7XHJcblxyXG5cdFx0aWYoIGluZGV4ICE9IC0xICl7XHJcblx0XHRcdHBhcmVudHMuc3BsaWNlKCBpbmRleCwgMSApO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdGFkZFBhcmVudDogZnVuY3Rpb24oIG5vZGUsIHBhcmVudCApe1xyXG5cdFx0dmFyIHBhcmVudHMgPSBub2RlLl9fLnBhcmVudHMsXHJcblx0XHRcdGluZGV4ID0gcGFyZW50cy5pbmRleE9mKCBwYXJlbnQgKVxyXG5cdFx0O1xyXG5cclxuXHRcdGlmKCBpbmRleCA9PSAtMSApe1xyXG5cdFx0XHRwYXJlbnRzWyBwYXJlbnRzLmxlbmd0aCBdID0gcGFyZW50O1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdHRyaWdnZXI6IGZ1bmN0aW9uKCBub2RlLCBldmVudE5hbWUsIHBhcmFtLCBub3cgKXtcclxuXHRcdHZhciBsaXN0ZW5lciA9IG5vZGUuX18ubGlzdGVuZXI7XHJcblx0XHRpZiggIWxpc3RlbmVyIClcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdHZhciB0aWNraW5nID0gbGlzdGVuZXIudGlja2luZztcclxuXHJcblx0XHRpZiggbm93ICl7XHJcblx0XHRcdGlmKCB0aWNraW5nIHx8IHBhcmFtICl7XHJcblx0XHRcdFx0bGlzdGVuZXIudGlja2luZyA9IDA7XHJcblx0XHRcdFx0bGlzdGVuZXIudHJpZ2dlciggZXZlbnROYW1lLCB0aWNraW5nIHx8IHBhcmFtLCBub2RlICk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxpc3RlbmVyLnRpY2tpbmcgPSBwYXJhbTtcclxuXHRcdGlmKCAhbGlzdGVuZXIucHJldlN0YXRlICl7XHJcblx0XHRcdGxpc3RlbmVyLnByZXZTdGF0ZSA9IG5vZGU7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYoICF0aWNraW5nICl7XHJcblx0XHRcdFV0aWxzLm5leHRUaWNrKCBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGlmKCBsaXN0ZW5lci50aWNraW5nICl7XHJcblx0XHRcdFx0XHR2YXIgdXBkYXRlZCA9IGxpc3RlbmVyLnRpY2tpbmcsXHJcblx0XHRcdFx0XHRcdHByZXZTdGF0ZSA9IGxpc3RlbmVyLnByZXZTdGF0ZVxyXG5cdFx0XHRcdFx0O1xyXG5cclxuXHRcdFx0XHRcdGxpc3RlbmVyLnRpY2tpbmcgPSAwO1xyXG5cdFx0XHRcdFx0bGlzdGVuZXIucHJldlN0YXRlID0gMDtcclxuXHJcblx0XHRcdFx0XHRsaXN0ZW5lci50cmlnZ2VyKCBldmVudE5hbWUsIHVwZGF0ZWQsIG5vZGUgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdGNyZWF0ZUxpc3RlbmVyOiBmdW5jdGlvbiggZnJvemVuICl7XHJcblx0XHR2YXIgbCA9IGZyb3plbi5fXy5saXN0ZW5lcjtcclxuXHJcblx0XHRpZiggIWwgKSB7XHJcblx0XHRcdGwgPSBPYmplY3QuY3JlYXRlKEVtaXR0ZXIsIHtcclxuXHRcdFx0XHRfZXZlbnRzOiB7XHJcblx0XHRcdFx0XHR2YWx1ZToge30sXHJcblx0XHRcdFx0XHR3cml0YWJsZTogdHJ1ZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRmcm96ZW4uX18ubGlzdGVuZXIgPSBsO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBsO1xyXG5cdH1cclxufTtcclxuXHJcbm5vZGVDcmVhdG9yLmluaXQoIEZyb3plbiApO1xyXG4vLyNidWlsZFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGcm96ZW47XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBVdGlscyA9IHJlcXVpcmUoICcuL3V0aWxzLmpzJyApO1xyXG5cclxuLy8jYnVpbGRcclxudmFyIG5vZGVDcmVhdG9yID0ge1xyXG5cdGluaXQ6IGZ1bmN0aW9uKCBGcm96ZW4gKXtcclxuXHJcblx0XHR2YXIgY29tbW9uTWV0aG9kcyA9IHtcclxuXHRcdFx0c2V0OiBmdW5jdGlvbiggYXR0ciwgdmFsdWUgKXtcclxuXHRcdFx0XHR2YXIgYXR0cnMgPSBhdHRyLFxyXG5cdFx0XHRcdFx0dXBkYXRlID0gdGhpcy5fXy50cmFuc1xyXG5cdFx0XHRcdDtcclxuXHJcblx0XHRcdFx0aWYoIHR5cGVvZiBhdHRyICE9ICdvYmplY3QnICl7XHJcblx0XHRcdFx0XHRhdHRycyA9IHt9O1xyXG5cdFx0XHRcdFx0YXR0cnNbIGF0dHIgXSA9IHZhbHVlO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYoICF1cGRhdGUgKXtcclxuXHRcdFx0XHRcdGZvciggdmFyIGtleSBpbiBhdHRycyApe1xyXG5cdFx0XHRcdFx0XHR1cGRhdGUgPSB1cGRhdGUgfHwgdGhpc1sga2V5IF0gIT09IGF0dHJzWyBrZXkgXTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHQvLyBObyBjaGFuZ2VzLCBqdXN0IHJldHVybiB0aGUgbm9kZVxyXG5cdFx0XHRcdFx0aWYoICF1cGRhdGUgKVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gVXRpbHMuZmluZFBpdm90KCB0aGlzICkgfHwgdGhpcztcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ21lcmdlJywgdGhpcywgYXR0cnMgKTtcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHJlc2V0OiBmdW5jdGlvbiggYXR0cnMgKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX18uc3RvcmUubm90aWZ5KCAncmVwbGFjZScsIHRoaXMsIGF0dHJzICk7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRnZXRMaXN0ZW5lcjogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRyZXR1cm4gRnJvemVuLmNyZWF0ZUxpc3RlbmVyKCB0aGlzICk7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHR0b0pTOiBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdHZhciBqcztcclxuXHRcdFx0XHRpZiggdGhpcy5jb25zdHJ1Y3RvciA9PSBBcnJheSApe1xyXG5cdFx0XHRcdFx0anMgPSBuZXcgQXJyYXkoIHRoaXMubGVuZ3RoICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0anMgPSB7fTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFV0aWxzLmVhY2goIHRoaXMsIGZ1bmN0aW9uKCBjaGlsZCwgaSApe1xyXG5cdFx0XHRcdFx0aWYoIGNoaWxkICYmIGNoaWxkLl9fIClcclxuXHRcdFx0XHRcdFx0anNbIGkgXSA9IGNoaWxkLnRvSlMoKTtcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0anNbIGkgXSA9IGNoaWxkO1xyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4ganM7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHR0cmFuc2FjdDogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fXy5zdG9yZS5ub3RpZnkoICd0cmFuc2FjdCcsIHRoaXMgKTtcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHJ1bjogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fXy5zdG9yZS5ub3RpZnkoICdydW4nLCB0aGlzICk7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRub3c6IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX18uc3RvcmUubm90aWZ5KCAnbm93JywgdGhpcyApO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0cGl2b3Q6IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX18uc3RvcmUubm90aWZ5KCAncGl2b3QnLCB0aGlzICk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdFx0dmFyIGFycmF5TWV0aG9kcyA9IFV0aWxzLmV4dGVuZCh7XHJcblx0XHRcdHB1c2g6IGZ1bmN0aW9uKCBlbCApe1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFwcGVuZCggW2VsXSApO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0YXBwZW5kOiBmdW5jdGlvbiggZWxzICl7XHJcblx0XHRcdFx0aWYoIGVscyAmJiBlbHMubGVuZ3RoIClcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3NwbGljZScsIHRoaXMsIFt0aGlzLmxlbmd0aCwgMF0uY29uY2F0KCBlbHMgKSApO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0cG9wOiBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGlmKCAhdGhpcy5sZW5ndGggKVxyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblxyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3NwbGljZScsIHRoaXMsIFt0aGlzLmxlbmd0aCAtMSwgMV0gKTtcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHVuc2hpZnQ6IGZ1bmN0aW9uKCBlbCApe1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnByZXBlbmQoIFtlbF0gKTtcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHByZXBlbmQ6IGZ1bmN0aW9uKCBlbHMgKXtcclxuXHRcdFx0XHRpZiggZWxzICYmIGVscy5sZW5ndGggKVxyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuX18uc3RvcmUubm90aWZ5KCAnc3BsaWNlJywgdGhpcywgWzAsIDBdLmNvbmNhdCggZWxzICkgKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHNoaWZ0OiBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGlmKCAhdGhpcy5sZW5ndGggKVxyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblxyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3NwbGljZScsIHRoaXMsIFswLCAxXSApO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0c3BsaWNlOiBmdW5jdGlvbiggaW5kZXgsIHRvUmVtb3ZlLCB0b0FkZCApe1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9fLnN0b3JlLm5vdGlmeSggJ3NwbGljZScsIHRoaXMsIGFyZ3VtZW50cyApO1xyXG5cdFx0XHR9XHJcblx0XHR9LCBjb21tb25NZXRob2RzICk7XHJcblxyXG5cdFx0dmFyIEZyb3plbkFycmF5ID0gT2JqZWN0LmNyZWF0ZSggQXJyYXkucHJvdG90eXBlLCBVdGlscy5jcmVhdGVORSggYXJyYXlNZXRob2RzICkgKTtcclxuXHJcblx0XHR2YXIgb2JqZWN0TWV0aG9kcyA9IFV0aWxzLmNyZWF0ZU5FKCBVdGlscy5leHRlbmQoe1xyXG5cdFx0XHRyZW1vdmU6IGZ1bmN0aW9uKCBrZXlzICl7XHJcblx0XHRcdFx0dmFyIGZpbHRlcmVkID0gW10sXHJcblx0XHRcdFx0XHRrID0ga2V5c1xyXG5cdFx0XHRcdDtcclxuXHJcblx0XHRcdFx0aWYoIGtleXMuY29uc3RydWN0b3IgIT0gQXJyYXkgKVxyXG5cdFx0XHRcdFx0ayA9IFsga2V5cyBdO1xyXG5cclxuXHRcdFx0XHRmb3IoIHZhciBpID0gMCwgbCA9IGsubGVuZ3RoOyBpPGw7IGkrKyApe1xyXG5cdFx0XHRcdFx0aWYoIHRoaXMuaGFzT3duUHJvcGVydHkoIGtbaV0gKSApXHJcblx0XHRcdFx0XHRcdGZpbHRlcmVkLnB1c2goIGtbaV0gKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmKCBmaWx0ZXJlZC5sZW5ndGggKVxyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuX18uc3RvcmUubm90aWZ5KCAncmVtb3ZlJywgdGhpcywgZmlsdGVyZWQgKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdFx0fVxyXG5cdFx0fSwgY29tbW9uTWV0aG9kcykpO1xyXG5cclxuXHRcdHZhciBGcm96ZW5PYmplY3QgPSBPYmplY3QuY3JlYXRlKCBPYmplY3QucHJvdG90eXBlLCBvYmplY3RNZXRob2RzICk7XHJcblxyXG5cdFx0dmFyIGNyZWF0ZUFycmF5ID0gKGZ1bmN0aW9uKCl7XHJcblx0XHRcdC8vIGZhc3QgdmVyc2lvblxyXG5cdFx0XHRpZiggW10uX19wcm90b19fIClcclxuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oIGxlbmd0aCApe1xyXG5cdFx0XHRcdFx0dmFyIGFyciA9IG5ldyBBcnJheSggbGVuZ3RoICk7XHJcblx0XHRcdFx0XHRhcnIuX19wcm90b19fID0gRnJvemVuQXJyYXk7XHJcblx0XHRcdFx0XHRyZXR1cm4gYXJyO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdC8vIHNsb3cgdmVyc2lvbiBmb3Igb2xkZXIgYnJvd3NlcnNcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCBsZW5ndGggKXtcclxuXHRcdFx0XHR2YXIgYXJyID0gbmV3IEFycmF5KCBsZW5ndGggKTtcclxuXHJcblx0XHRcdFx0Zm9yKCB2YXIgbSBpbiBhcnJheU1ldGhvZHMgKXtcclxuXHRcdFx0XHRcdGFyclsgbSBdID0gYXJyYXlNZXRob2RzWyBtIF07XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXR1cm4gYXJyO1xyXG5cdFx0XHR9XHJcblx0XHR9KSgpO1xyXG5cclxuXHRcdHRoaXMuY2xvbmUgPSBmdW5jdGlvbiggbm9kZSApe1xyXG5cdFx0XHR2YXIgY29ucyA9IG5vZGUuY29uc3RydWN0b3I7XHJcblx0XHRcdGlmKCBjb25zID09IEFycmF5ICl7XHJcblx0XHRcdFx0cmV0dXJuIGNyZWF0ZUFycmF5KCBub2RlLmxlbmd0aCApO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGlmKCBjb25zID09PSBPYmplY3QgKXtcclxuXHRcdFx0XHRcdHJldHVybiBPYmplY3QuY3JlYXRlKCBGcm96ZW5PYmplY3QgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly8gQ2xhc3MgaW5zdGFuY2VzXHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gT2JqZWN0LmNyZWF0ZSggY29ucy5wcm90b3R5cGUsIG9iamVjdE1ldGhvZHMgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcbn1cclxuLy8jYnVpbGRcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbm9kZUNyZWF0b3I7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8vI2J1aWxkXHJcbnZhciBnbG9iYWwgPSAobmV3IEZ1bmN0aW9uKFwicmV0dXJuIHRoaXNcIikoKSk7XHJcblxyXG52YXIgVXRpbHMgPSB7XHJcblx0ZXh0ZW5kOiBmdW5jdGlvbiggb2IsIHByb3BzICl7XHJcblx0XHRmb3IoIHZhciBwIGluIHByb3BzICl7XHJcblx0XHRcdG9iW3BdID0gcHJvcHNbcF07XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gb2I7XHJcblx0fSxcclxuXHJcblx0Y3JlYXRlTm9uRW51bWVyYWJsZTogZnVuY3Rpb24oIG9iaiwgcHJvdG8gKXtcclxuXHRcdHZhciBuZSA9IHt9O1xyXG5cdFx0Zm9yKCB2YXIga2V5IGluIG9iaiApXHJcblx0XHRcdG5lW2tleV0gPSB7dmFsdWU6IG9ialtrZXldIH07XHJcblx0XHRyZXR1cm4gT2JqZWN0LmNyZWF0ZSggcHJvdG8gfHwge30sIG5lICk7XHJcblx0fSxcclxuXHJcblx0ZXJyb3I6IGZ1bmN0aW9uKCBtZXNzYWdlICl7XHJcblx0XHR2YXIgZXJyID0gbmV3IEVycm9yKCBtZXNzYWdlICk7XHJcblx0XHRpZiggY29uc29sZSApXHJcblx0XHRcdHJldHVybiBjb25zb2xlLmVycm9yKCBlcnIgKTtcclxuXHRcdGVsc2VcclxuXHRcdFx0dGhyb3cgZXJyO1xyXG5cdH0sXHJcblxyXG5cdGVhY2g6IGZ1bmN0aW9uKCBvLCBjbGJrICl7XHJcblx0XHR2YXIgaSxsLGtleXM7XHJcblx0XHRpZiggbyAmJiBvLmNvbnN0cnVjdG9yID09IEFycmF5ICl7XHJcblx0XHRcdGZvciAoaSA9IDAsIGwgPSBvLmxlbmd0aDsgaSA8IGw7IGkrKylcclxuXHRcdFx0XHRjbGJrKCBvW2ldLCBpICk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0a2V5cyA9IE9iamVjdC5rZXlzKCBvICk7XHJcblx0XHRcdGZvciggaSA9IDAsIGwgPSBrZXlzLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcblx0XHRcdFx0Y2xiayggb1sga2V5c1tpXSBdLCBrZXlzW2ldICk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0YWRkTkU6IGZ1bmN0aW9uKCBub2RlLCBhdHRycyApe1xyXG5cdFx0Zm9yKCB2YXIga2V5IGluIGF0dHJzICl7XHJcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggbm9kZSwga2V5LCB7XHJcblx0XHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXHJcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdHdyaXRhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdHZhbHVlOiBhdHRyc1sga2V5IF1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogQ3JlYXRlcyBub24tZW51bWVyYWJsZSBwcm9wZXJ0eSBkZXNjcmlwdG9ycywgdG8gYmUgdXNlZCBieSBPYmplY3QuY3JlYXRlLlxyXG5cdCAqIEBwYXJhbSAge09iamVjdH0gYXR0cnMgUHJvcGVydGllcyB0byBjcmVhdGUgZGVzY3JpcHRvcnNcclxuXHQgKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgIEEgaGFzaCB3aXRoIHRoZSBkZXNjcmlwdG9ycy5cclxuXHQgKi9cclxuXHRjcmVhdGVORTogZnVuY3Rpb24oIGF0dHJzICl7XHJcblx0XHR2YXIgbmUgPSB7fTtcclxuXHJcblx0XHRmb3IoIHZhciBrZXkgaW4gYXR0cnMgKXtcclxuXHRcdFx0bmVbIGtleSBdID0ge1xyXG5cdFx0XHRcdHdyaXRhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcclxuXHRcdFx0XHR2YWx1ZTogYXR0cnNbIGtleSBdXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbmU7XHJcblx0fSxcclxuXHJcblx0Ly8gbmV4dFRpY2sgLSBieSBzdGFnYXMgLyBwdWJsaWMgZG9tYWluXHJcblx0bmV4dFRpY2s6IChmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgcXVldWUgPSBbXSxcclxuXHRcdGRpcnR5ID0gZmFsc2UsXHJcblx0XHRmbixcclxuXHRcdGhhc1Bvc3RNZXNzYWdlID0gISFnbG9iYWwucG9zdE1lc3NhZ2UgJiYgKHR5cGVvZiBXaW5kb3cgIT0gJ3VuZGVmaW5lZCcpICYmIChnbG9iYWwgaW5zdGFuY2VvZiBXaW5kb3cpLFxyXG5cdFx0bWVzc2FnZU5hbWUgPSAnbmV4dHRpY2snLFxyXG5cdFx0dHJpZ2dlciA9IChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHJldHVybiBoYXNQb3N0TWVzc2FnZVxyXG5cdFx0XHRcdD8gZnVuY3Rpb24gdHJpZ2dlciAoKSB7XHJcblx0XHRcdFx0Z2xvYmFsLnBvc3RNZXNzYWdlKG1lc3NhZ2VOYW1lLCAnKicpO1xyXG5cdFx0XHR9XHJcblx0XHRcdDogZnVuY3Rpb24gdHJpZ2dlciAoKSB7XHJcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7IHByb2Nlc3NRdWV1ZSgpIH0sIDApO1xyXG5cdFx0XHR9O1xyXG5cdFx0fSgpKSxcclxuXHRcdHByb2Nlc3NRdWV1ZSA9IChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHJldHVybiBoYXNQb3N0TWVzc2FnZVxyXG5cdFx0XHRcdD8gZnVuY3Rpb24gcHJvY2Vzc1F1ZXVlIChldmVudCkge1xyXG5cdFx0XHRcdFx0aWYgKGV2ZW50LnNvdXJjZSA9PT0gZ2xvYmFsICYmIGV2ZW50LmRhdGEgPT09IG1lc3NhZ2VOYW1lKSB7XHJcblx0XHRcdFx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0XHRcdFx0XHRmbHVzaFF1ZXVlKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdDogZmx1c2hRdWV1ZTtcclxuICAgIFx0fSkoKVxyXG4gICAgO1xyXG5cclxuICAgIGZ1bmN0aW9uIGZsdXNoUXVldWUgKCkge1xyXG4gICAgICAgIHdoaWxlIChmbiA9IHF1ZXVlLnNoaWZ0KCkpIHtcclxuICAgICAgICAgICAgZm4oKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGlydHkgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBuZXh0VGljayAoZm4pIHtcclxuICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcclxuICAgICAgICBpZiAoZGlydHkpIHJldHVybjtcclxuICAgICAgICBkaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgdHJpZ2dlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChoYXNQb3N0TWVzc2FnZSkgZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBwcm9jZXNzUXVldWUsIHRydWUpO1xyXG5cclxuICAgIG5leHRUaWNrLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGdsb2JhbC5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcHJvY2Vzc1F1ZXVlLCB0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV4dFRpY2s7XHJcbiAgfSkoKSxcclxuXHJcbiAgZmluZFBpdm90OiBmdW5jdGlvbiggbm9kZSApe1xyXG4gIFx0XHRpZiggIW5vZGUgfHwgIW5vZGUuX18gKVxyXG4gIFx0XHRcdHJldHVybjtcclxuXHJcbiAgXHRcdGlmKCBub2RlLl9fLnBpdm90IClcclxuICBcdFx0XHRyZXR1cm4gbm9kZTtcclxuXHJcbiAgXHRcdHZhciBmb3VuZCA9IDAsXHJcbiAgXHRcdFx0cGFyZW50cyA9IG5vZGUuX18ucGFyZW50cyxcclxuICBcdFx0XHRpID0gMCxcclxuICBcdFx0XHRwYXJlbnRcclxuICBcdFx0O1xyXG5cclxuICBcdFx0Ly8gTG9vayB1cCBmb3IgdGhlIHBpdm90IGluIHRoZSBwYXJlbnRzXHJcbiAgXHRcdHdoaWxlKCAhZm91bmQgJiYgaSA8IHBhcmVudHMubGVuZ3RoICl7XHJcbiAgXHRcdFx0cGFyZW50ID0gcGFyZW50c1tpXTtcclxuICBcdFx0XHRpZiggcGFyZW50Ll9fLnBpdm90IClcclxuICBcdFx0XHRcdGZvdW5kID0gcGFyZW50O1xyXG4gIFx0XHRcdGkrKztcclxuICBcdFx0fVxyXG5cclxuICBcdFx0aWYoIGZvdW5kICl7XHJcbiAgXHRcdFx0cmV0dXJuIGZvdW5kO1xyXG4gIFx0XHR9XHJcblxyXG4gIFx0XHQvLyBJZiBub3QgZm91bmQsIHRyeSB3aXRoIHRoZSBwYXJlbnQncyBwYXJlbnRzXHJcbiAgXHRcdGk9MDtcclxuICBcdFx0d2hpbGUoICFmb3VuZCAmJiBpIDwgcGFyZW50cy5sZW5ndGggKXtcclxuXHQgIFx0XHRmb3VuZCA9IHRoaXMuZmluZFBpdm90KCBwYXJlbnRzW2ldICk7XHJcblx0ICBcdFx0aSsrO1xyXG5cdCAgXHR9XHJcblxyXG4gIFx0XHRyZXR1cm4gZm91bmQ7XHJcbiAgfSxcclxuXHJcblx0aXNMZWFmOiBmdW5jdGlvbiggbm9kZSwgZnJlZXplSW5zdGFuY2VzICl7XHJcblx0XHR2YXIgY29ucztcclxuXHRcdHJldHVybiAhbm9kZSB8fCAhKGNvbnMgPSBub2RlLmNvbnN0cnVjdG9yKSB8fCAoZnJlZXplSW5zdGFuY2VzID9cclxuXHRcdFx0KGNvbnMgPT09IFN0cmluZyB8fCBjb25zID09PSBOdW1iZXIgfHwgY29ucyA9PT0gQm9vbGVhbikgOlxyXG5cdFx0XHQoY29ucyAhPSBPYmplY3QgJiYgY29ucyAhPSBBcnJheSlcclxuXHRcdCk7XHJcblx0fVxyXG59O1xyXG4vLyNidWlsZFxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVXRpbHM7XHJcbiIsIlxuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogQSBjYWNoZWQgcmVmZXJlbmNlIHRvIHRoZSBoYXNPd25Qcm9wZXJ0eSBmdW5jdGlvbi5cbiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBBIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIHRoYXQgd2lsbCBjcmVhdGUgYmxhbmsgb2JqZWN0cy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBCbGFuaygpIHt9XG5cbkJsYW5rLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbi8qKlxuICogVXNlZCB0byBwcmV2ZW50IHByb3BlcnR5IGNvbGxpc2lvbnMgYmV0d2VlbiBvdXIgXCJtYXBcIiBhbmQgaXRzIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7IU9iamVjdDxzdHJpbmcsICo+fSBtYXAgVGhlIG1hcCB0byBjaGVjay5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSBUaGUgcHJvcGVydHkgdG8gY2hlY2suXG4gKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIG1hcCBoYXMgcHJvcGVydHkuXG4gKi9cbnZhciBoYXMgPSBmdW5jdGlvbiAobWFwLCBwcm9wZXJ0eSkge1xuICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChtYXAsIHByb3BlcnR5KTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBtYXAgb2JqZWN0IHdpdGhvdXQgYSBwcm90b3R5cGUuXG4gKiBAcmV0dXJuIHshT2JqZWN0fVxuICovXG52YXIgY3JlYXRlTWFwID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IEJsYW5rKCk7XG59O1xuXG4vKipcbiAqIEtlZXBzIHRyYWNrIG9mIGluZm9ybWF0aW9uIG5lZWRlZCB0byBwZXJmb3JtIGRpZmZzIGZvciBhIGdpdmVuIERPTSBub2RlLlxuICogQHBhcmFtIHshc3RyaW5nfSBub2RlTmFtZVxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTm9kZURhdGEobm9kZU5hbWUsIGtleSkge1xuICAvKipcbiAgICogVGhlIGF0dHJpYnV0ZXMgYW5kIHRoZWlyIHZhbHVlcy5cbiAgICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgKj59XG4gICAqL1xuICB0aGlzLmF0dHJzID0gY3JlYXRlTWFwKCk7XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzLCB1c2VkIGZvciBxdWlja2x5IGRpZmZpbmcgdGhlXG4gICAqIGluY29tbWluZyBhdHRyaWJ1dGVzIHRvIHNlZSBpZiB0aGUgRE9NIG5vZGUncyBhdHRyaWJ1dGVzIG5lZWQgdG8gYmVcbiAgICogdXBkYXRlZC5cbiAgICogQGNvbnN0IHtBcnJheTwqPn1cbiAgICovXG4gIHRoaXMuYXR0cnNBcnIgPSBbXTtcblxuICAvKipcbiAgICogVGhlIGluY29taW5nIGF0dHJpYnV0ZXMgZm9yIHRoaXMgTm9kZSwgYmVmb3JlIHRoZXkgYXJlIHVwZGF0ZWQuXG4gICAqIEBjb25zdCB7IU9iamVjdDxzdHJpbmcsICo+fVxuICAgKi9cbiAgdGhpcy5uZXdBdHRycyA9IGNyZWF0ZU1hcCgpO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgc3RhdGljcyBoYXZlIGJlZW4gYXBwbGllZCBmb3IgdGhlIG5vZGUgeWV0LlxuICAgKiB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMuc3RhdGljc0FwcGxpZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgbm9kZSwgdXNlZCB0byBwcmVzZXJ2ZSBET00gbm9kZXMgd2hlbiB0aGV5XG4gICAqIG1vdmUgd2l0aGluIHRoZWlyIHBhcmVudC5cbiAgICogQGNvbnN0XG4gICAqL1xuICB0aGlzLmtleSA9IGtleTtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgY2hpbGRyZW4gd2l0aGluIHRoaXMgbm9kZSBieSB0aGVpciBrZXkuXG4gICAqIHshT2JqZWN0PHN0cmluZywgIUVsZW1lbnQ+fVxuICAgKi9cbiAgdGhpcy5rZXlNYXAgPSBjcmVhdGVNYXAoKTtcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIGtleU1hcCBpcyBjdXJyZW50bHkgdmFsaWQuXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgdGhpcy5rZXlNYXBWYWxpZCA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3IgdGhlIGFzc29jaWF0ZWQgbm9kZSBpcywgb3IgY29udGFpbnMsIGEgZm9jdXNlZCBFbGVtZW50LlxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMuZm9jdXNlZCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBUaGUgbm9kZSBuYW1lIGZvciB0aGlzIG5vZGUuXG4gICAqIEBjb25zdCB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy5ub2RlTmFtZSA9IG5vZGVOYW1lO1xuXG4gIC8qKlxuICAgKiBAdHlwZSB7P3N0cmluZ31cbiAgICovXG4gIHRoaXMudGV4dCA9IG51bGw7XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgYSBOb2RlRGF0YSBvYmplY3QgZm9yIGEgTm9kZS5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgVGhlIG5vZGUgdG8gaW5pdGlhbGl6ZSBkYXRhIGZvci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZSBuYW1lIG9mIG5vZGUuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB0aGF0IGlkZW50aWZpZXMgdGhlIG5vZGUuXG4gKiBAcmV0dXJuIHshTm9kZURhdGF9IFRoZSBuZXdseSBpbml0aWFsaXplZCBkYXRhIG9iamVjdFxuICovXG52YXIgaW5pdERhdGEgPSBmdW5jdGlvbiAobm9kZSwgbm9kZU5hbWUsIGtleSkge1xuICB2YXIgZGF0YSA9IG5ldyBOb2RlRGF0YShub2RlTmFtZSwga2V5KTtcbiAgbm9kZVsnX19pbmNyZW1lbnRhbERPTURhdGEnXSA9IGRhdGE7XG4gIHJldHVybiBkYXRhO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIE5vZGVEYXRhIG9iamVjdCBmb3IgYSBOb2RlLCBjcmVhdGluZyBpdCBpZiBuZWNlc3NhcnkuXG4gKlxuICogQHBhcmFtIHs/Tm9kZX0gbm9kZSBUaGUgTm9kZSB0byByZXRyaWV2ZSB0aGUgZGF0YSBmb3IuXG4gKiBAcmV0dXJuIHshTm9kZURhdGF9IFRoZSBOb2RlRGF0YSBmb3IgdGhpcyBOb2RlLlxuICovXG52YXIgZ2V0RGF0YSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIGltcG9ydE5vZGUobm9kZSk7XG4gIHJldHVybiBub2RlWydfX2luY3JlbWVudGFsRE9NRGF0YSddO1xufTtcblxuLyoqXG4gKiBJbXBvcnRzIG5vZGUgYW5kIGl0cyBzdWJ0cmVlLCBpbml0aWFsaXppbmcgY2FjaGVzLlxuICpcbiAqIEBwYXJhbSB7P05vZGV9IG5vZGUgVGhlIE5vZGUgdG8gaW1wb3J0LlxuICovXG52YXIgaW1wb3J0Tm9kZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIGlmIChub2RlWydfX2luY3JlbWVudGFsRE9NRGF0YSddKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGlzRWxlbWVudCA9IG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50O1xuICB2YXIgbm9kZU5hbWUgPSBpc0VsZW1lbnQgPyBub2RlLmxvY2FsTmFtZSA6IG5vZGUubm9kZU5hbWU7XG4gIHZhciBrZXkgPSBpc0VsZW1lbnQgPyBub2RlLmdldEF0dHJpYnV0ZSgna2V5JykgOiBudWxsO1xuICB2YXIgZGF0YSA9IGluaXREYXRhKG5vZGUsIG5vZGVOYW1lLCBrZXkpO1xuXG4gIGlmIChrZXkpIHtcbiAgICBnZXREYXRhKG5vZGUucGFyZW50Tm9kZSkua2V5TWFwW2tleV0gPSBub2RlO1xuICB9XG5cbiAgaWYgKGlzRWxlbWVudCkge1xuICAgIHZhciBhdHRyaWJ1dGVzID0gbm9kZS5hdHRyaWJ1dGVzO1xuICAgIHZhciBhdHRycyA9IGRhdGEuYXR0cnM7XG4gICAgdmFyIG5ld0F0dHJzID0gZGF0YS5uZXdBdHRycztcbiAgICB2YXIgYXR0cnNBcnIgPSBkYXRhLmF0dHJzQXJyO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdHRyaWJ1dGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICB2YXIgYXR0ciA9IGF0dHJpYnV0ZXNbaV07XG4gICAgICB2YXIgbmFtZSA9IGF0dHIubmFtZTtcbiAgICAgIHZhciB2YWx1ZSA9IGF0dHIudmFsdWU7XG5cbiAgICAgIGF0dHJzW25hbWVdID0gdmFsdWU7XG4gICAgICBuZXdBdHRyc1tuYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgIGF0dHJzQXJyLnB1c2gobmFtZSk7XG4gICAgICBhdHRyc0Fyci5wdXNoKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBmb3IgKHZhciBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICBpbXBvcnROb2RlKGNoaWxkKTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBuYW1lc3BhY2UgdG8gY3JlYXRlIGFuIGVsZW1lbnQgKG9mIGEgZ2l2ZW4gdGFnKSBpbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyB0byBnZXQgdGhlIG5hbWVzcGFjZSBmb3IuXG4gKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnRcbiAqIEByZXR1cm4gez9zdHJpbmd9IFRoZSBuYW1lc3BhY2UgdG8gY3JlYXRlIHRoZSB0YWcgaW4uXG4gKi9cbnZhciBnZXROYW1lc3BhY2VGb3JUYWcgPSBmdW5jdGlvbiAodGFnLCBwYXJlbnQpIHtcbiAgaWYgKHRhZyA9PT0gJ3N2ZycpIHtcbiAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbiAgfVxuXG4gIGlmIChnZXREYXRhKHBhcmVudCkubm9kZU5hbWUgPT09ICdmb3JlaWduT2JqZWN0Jykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHBhcmVudC5uYW1lc3BhY2VVUkk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudC5cbiAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyBUaGUgZG9jdW1lbnQgd2l0aCB3aGljaCB0byBjcmVhdGUgdGhlIEVsZW1lbnQuXG4gKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyBmb3IgdGhlIEVsZW1lbnQuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgQSBrZXkgdG8gaWRlbnRpZnkgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH1cbiAqL1xudmFyIGNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbiAoZG9jLCBwYXJlbnQsIHRhZywga2V5KSB7XG4gIHZhciBuYW1lc3BhY2UgPSBnZXROYW1lc3BhY2VGb3JUYWcodGFnLCBwYXJlbnQpO1xuICB2YXIgZWwgPSB1bmRlZmluZWQ7XG5cbiAgaWYgKG5hbWVzcGFjZSkge1xuICAgIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIHRhZyk7XG4gIH0gZWxzZSB7XG4gICAgZWwgPSBkb2MuY3JlYXRlRWxlbWVudCh0YWcpO1xuICB9XG5cbiAgaW5pdERhdGEoZWwsIHRhZywga2V5KTtcblxuICByZXR1cm4gZWw7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUZXh0IE5vZGUuXG4gKiBAcGFyYW0ge0RvY3VtZW50fSBkb2MgVGhlIGRvY3VtZW50IHdpdGggd2hpY2ggdG8gY3JlYXRlIHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IVRleHR9XG4gKi9cbnZhciBjcmVhdGVUZXh0ID0gZnVuY3Rpb24gKGRvYykge1xuICB2YXIgbm9kZSA9IGRvYy5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gIGluaXREYXRhKG5vZGUsICcjdGV4dCcsIG51bGwpO1xuICByZXR1cm4gbm9kZTtcbn07XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqIEBjb25zdCAqL1xudmFyIG5vdGlmaWNhdGlvbnMgPSB7XG4gIC8qKlxuICAgKiBDYWxsZWQgYWZ0ZXIgcGF0Y2ggaGFzIGNvbXBsZWF0ZWQgd2l0aCBhbnkgTm9kZXMgdGhhdCBoYXZlIGJlZW4gY3JlYXRlZFxuICAgKiBhbmQgYWRkZWQgdG8gdGhlIERPTS5cbiAgICogQHR5cGUgez9mdW5jdGlvbihBcnJheTwhTm9kZT4pfVxuICAgKi9cbiAgbm9kZXNDcmVhdGVkOiBudWxsLFxuXG4gIC8qKlxuICAgKiBDYWxsZWQgYWZ0ZXIgcGF0Y2ggaGFzIGNvbXBsZWF0ZWQgd2l0aCBhbnkgTm9kZXMgdGhhdCBoYXZlIGJlZW4gcmVtb3ZlZFxuICAgKiBmcm9tIHRoZSBET00uXG4gICAqIE5vdGUgaXQncyBhbiBhcHBsaWNhdGlvbnMgcmVzcG9uc2liaWxpdHkgdG8gaGFuZGxlIGFueSBjaGlsZE5vZGVzLlxuICAgKiBAdHlwZSB7P2Z1bmN0aW9uKEFycmF5PCFOb2RlPil9XG4gICAqL1xuICBub2Rlc0RlbGV0ZWQ6IG51bGxcbn07XG5cbi8qKlxuICogS2VlcHMgdHJhY2sgb2YgdGhlIHN0YXRlIG9mIGEgcGF0Y2guXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQ29udGV4dCgpIHtcbiAgLyoqXG4gICAqIEB0eXBlIHsoQXJyYXk8IU5vZGU+fHVuZGVmaW5lZCl9XG4gICAqL1xuICB0aGlzLmNyZWF0ZWQgPSBub3RpZmljYXRpb25zLm5vZGVzQ3JlYXRlZCAmJiBbXTtcblxuICAvKipcbiAgICogQHR5cGUgeyhBcnJheTwhTm9kZT58dW5kZWZpbmVkKX1cbiAgICovXG4gIHRoaXMuZGVsZXRlZCA9IG5vdGlmaWNhdGlvbnMubm9kZXNEZWxldGVkICYmIFtdO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAqL1xuQ29udGV4dC5wcm90b3R5cGUubWFya0NyZWF0ZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICBpZiAodGhpcy5jcmVhdGVkKSB7XG4gICAgdGhpcy5jcmVhdGVkLnB1c2gobm9kZSk7XG4gIH1cbn07XG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICovXG5Db250ZXh0LnByb3RvdHlwZS5tYXJrRGVsZXRlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIGlmICh0aGlzLmRlbGV0ZWQpIHtcbiAgICB0aGlzLmRlbGV0ZWQucHVzaChub2RlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBOb3RpZmllcyBhYm91dCBub2RlcyB0aGF0IHdlcmUgY3JlYXRlZCBkdXJpbmcgdGhlIHBhdGNoIG9wZWFyYXRpb24uXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLm5vdGlmeUNoYW5nZXMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmNyZWF0ZWQgJiYgdGhpcy5jcmVhdGVkLmxlbmd0aCA+IDApIHtcbiAgICBub3RpZmljYXRpb25zLm5vZGVzQ3JlYXRlZCh0aGlzLmNyZWF0ZWQpO1xuICB9XG5cbiAgaWYgKHRoaXMuZGVsZXRlZCAmJiB0aGlzLmRlbGV0ZWQubGVuZ3RoID4gMCkge1xuICAgIG5vdGlmaWNhdGlvbnMubm9kZXNEZWxldGVkKHRoaXMuZGVsZXRlZCk7XG4gIH1cbn07XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gICogS2VlcHMgdHJhY2sgd2hldGhlciBvciBub3Qgd2UgYXJlIGluIGFuIGF0dHJpYnV0ZXMgZGVjbGFyYXRpb24gKGFmdGVyXG4gICogZWxlbWVudE9wZW5TdGFydCwgYnV0IGJlZm9yZSBlbGVtZW50T3BlbkVuZCkuXG4gICogQHR5cGUge2Jvb2xlYW59XG4gICovXG52YXIgaW5BdHRyaWJ1dGVzID0gZmFsc2U7XG5cbi8qKlxuICAqIEtlZXBzIHRyYWNrIHdoZXRoZXIgb3Igbm90IHdlIGFyZSBpbiBhbiBlbGVtZW50IHRoYXQgc2hvdWxkIG5vdCBoYXZlIGl0c1xuICAqIGNoaWxkcmVuIGNsZWFyZWQuXG4gICogQHR5cGUge2Jvb2xlYW59XG4gICovXG52YXIgaW5Ta2lwID0gZmFsc2U7XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IHRoZXJlIGlzIGEgY3VycmVudCBwYXRjaCBjb250ZXh0LlxuICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZVxuICogQHBhcmFtIHsqfSBjb250ZXh0XG4gKi9cbnZhciBhc3NlcnRJblBhdGNoID0gZnVuY3Rpb24gKGZ1bmN0aW9uTmFtZSwgY29udGV4dCkge1xuICBpZiAoIWNvbnRleHQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYWxsICcgKyBmdW5jdGlvbk5hbWUgKyAnKCkgdW5sZXNzIGluIHBhdGNoLicpO1xuICB9XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCBhIHBhdGNoIGNsb3NlcyBldmVyeSBub2RlIHRoYXQgaXQgb3BlbmVkLlxuICogQHBhcmFtIHs/Tm9kZX0gb3BlbkVsZW1lbnRcbiAqIEBwYXJhbSB7IU5vZGV8IURvY3VtZW50RnJhZ21lbnR9IHJvb3RcbiAqL1xudmFyIGFzc2VydE5vVW5jbG9zZWRUYWdzID0gZnVuY3Rpb24gKG9wZW5FbGVtZW50LCByb290KSB7XG4gIGlmIChvcGVuRWxlbWVudCA9PT0gcm9vdCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBjdXJyZW50RWxlbWVudCA9IG9wZW5FbGVtZW50O1xuICB2YXIgb3BlblRhZ3MgPSBbXTtcbiAgd2hpbGUgKGN1cnJlbnRFbGVtZW50ICYmIGN1cnJlbnRFbGVtZW50ICE9PSByb290KSB7XG4gICAgb3BlblRhZ3MucHVzaChjdXJyZW50RWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKTtcbiAgICBjdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50LnBhcmVudE5vZGU7XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoJ09uZSBvciBtb3JlIHRhZ3Mgd2VyZSBub3QgY2xvc2VkOlxcbicgKyBvcGVuVGFncy5qb2luKCdcXG4nKSk7XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY2FsbGVyIGlzIG5vdCB3aGVyZSBhdHRyaWJ1dGVzIGFyZSBleHBlY3RlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmdW5jdGlvbk5hbWVcbiAqL1xudmFyIGFzc2VydE5vdEluQXR0cmlidXRlcyA9IGZ1bmN0aW9uIChmdW5jdGlvbk5hbWUpIHtcbiAgaWYgKGluQXR0cmlidXRlcykge1xuICAgIHRocm93IG5ldyBFcnJvcihmdW5jdGlvbk5hbWUgKyAnKCkgY2FuIG5vdCBiZSBjYWxsZWQgYmV0d2VlbiAnICsgJ2VsZW1lbnRPcGVuU3RhcnQoKSBhbmQgZWxlbWVudE9wZW5FbmQoKS4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgdGhlIGNhbGxlciBpcyBub3QgaW5zaWRlIGFuIGVsZW1lbnQgdGhhdCBoYXMgZGVjbGFyZWQgc2tpcC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmdW5jdGlvbk5hbWVcbiAqL1xudmFyIGFzc2VydE5vdEluU2tpcCA9IGZ1bmN0aW9uIChmdW5jdGlvbk5hbWUpIHtcbiAgaWYgKGluU2tpcCkge1xuICAgIHRocm93IG5ldyBFcnJvcihmdW5jdGlvbk5hbWUgKyAnKCkgbWF5IG5vdCBiZSBjYWxsZWQgaW5zaWRlIGFuIGVsZW1lbnQgJyArICd0aGF0IGhhcyBjYWxsZWQgc2tpcCgpLicpO1xuICB9XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY2FsbGVyIGlzIHdoZXJlIGF0dHJpYnV0ZXMgYXJlIGV4cGVjdGVkLlxuICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZVxuICovXG52YXIgYXNzZXJ0SW5BdHRyaWJ1dGVzID0gZnVuY3Rpb24gKGZ1bmN0aW9uTmFtZSkge1xuICBpZiAoIWluQXR0cmlidXRlcykge1xuICAgIHRocm93IG5ldyBFcnJvcihmdW5jdGlvbk5hbWUgKyAnKCkgY2FuIG9ubHkgYmUgY2FsbGVkIGFmdGVyIGNhbGxpbmcgJyArICdlbGVtZW50T3BlblN0YXJ0KCkuJyk7XG4gIH1cbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGUgcGF0Y2ggY2xvc2VzIHZpcnR1YWwgYXR0cmlidXRlcyBjYWxsXG4gKi9cbnZhciBhc3NlcnRWaXJ0dWFsQXR0cmlidXRlc0Nsb3NlZCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKGluQXR0cmlidXRlcykge1xuICAgIHRocm93IG5ldyBFcnJvcignZWxlbWVudE9wZW5FbmQoKSBtdXN0IGJlIGNhbGxlZCBhZnRlciBjYWxsaW5nICcgKyAnZWxlbWVudE9wZW5TdGFydCgpLicpO1xuICB9XG59O1xuXG4vKipcbiAgKiBNYWtlcyBzdXJlIHRoYXQgdGFncyBhcmUgY29ycmVjdGx5IG5lc3RlZC5cbiAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZU5hbWVcbiAgKiBAcGFyYW0ge3N0cmluZ30gdGFnXG4gICovXG52YXIgYXNzZXJ0Q2xvc2VNYXRjaGVzT3BlblRhZyA9IGZ1bmN0aW9uIChub2RlTmFtZSwgdGFnKSB7XG4gIGlmIChub2RlTmFtZSAhPT0gdGFnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZWNlaXZlZCBhIGNhbGwgdG8gY2xvc2UgXCInICsgdGFnICsgJ1wiIGJ1dCBcIicgKyBub2RlTmFtZSArICdcIiB3YXMgb3Blbi4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgbm8gY2hpbGRyZW4gZWxlbWVudHMgaGF2ZSBiZWVuIGRlY2xhcmVkIHlldCBpbiB0aGUgY3VycmVudFxuICogZWxlbWVudC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmdW5jdGlvbk5hbWVcbiAqIEBwYXJhbSB7P05vZGV9IHByZXZpb3VzTm9kZVxuICovXG52YXIgYXNzZXJ0Tm9DaGlsZHJlbkRlY2xhcmVkWWV0ID0gZnVuY3Rpb24gKGZ1bmN0aW9uTmFtZSwgcHJldmlvdXNOb2RlKSB7XG4gIGlmIChwcmV2aW91c05vZGUgIT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZnVuY3Rpb25OYW1lICsgJygpIG11c3QgY29tZSBiZWZvcmUgYW55IGNoaWxkICcgKyAnZGVjbGFyYXRpb25zIGluc2lkZSB0aGUgY3VycmVudCBlbGVtZW50LicpO1xuICB9XG59O1xuXG4vKipcbiAqIENoZWNrcyB0aGF0IGEgY2FsbCB0byBwYXRjaE91dGVyIGFjdHVhbGx5IHBhdGNoZWQgdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gez9Ob2RlfSBzdGFydE5vZGUgVGhlIHZhbHVlIGZvciB0aGUgY3VycmVudE5vZGUgd2hlbiB0aGUgcGF0Y2hcbiAqICAgICBzdGFydGVkLlxuICogQHBhcmFtIHs/Tm9kZX0gY3VycmVudE5vZGUgVGhlIGN1cnJlbnROb2RlIHdoZW4gdGhlIHBhdGNoIGZpbmlzaGVkLlxuICogQHBhcmFtIHs/Tm9kZX0gZXhwZWN0ZWROZXh0Tm9kZSBUaGUgTm9kZSB0aGF0IGlzIGV4cGVjdGVkIHRvIGZvbGxvdyB0aGVcbiAqICAgIGN1cnJlbnROb2RlIGFmdGVyIHRoZSBwYXRjaDtcbiAqIEBwYXJhbSB7P05vZGV9IGV4cGVjdGVkUHJldk5vZGUgVGhlIE5vZGUgdGhhdCBpcyBleHBlY3RlZCB0byBwcmVjZWVkIHRoZVxuICogICAgY3VycmVudE5vZGUgYWZ0ZXIgdGhlIHBhdGNoLlxuICovXG52YXIgYXNzZXJ0UGF0Y2hFbGVtZW50Tm9FeHRyYXMgPSBmdW5jdGlvbiAoc3RhcnROb2RlLCBjdXJyZW50Tm9kZSwgZXhwZWN0ZWROZXh0Tm9kZSwgZXhwZWN0ZWRQcmV2Tm9kZSkge1xuICB2YXIgd2FzVXBkYXRlZCA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nID09PSBleHBlY3RlZE5leHROb2RlICYmIGN1cnJlbnROb2RlLnByZXZpb3VzU2libGluZyA9PT0gZXhwZWN0ZWRQcmV2Tm9kZTtcbiAgdmFyIHdhc0NoYW5nZWQgPSBjdXJyZW50Tm9kZS5uZXh0U2libGluZyA9PT0gc3RhcnROb2RlLm5leHRTaWJsaW5nICYmIGN1cnJlbnROb2RlLnByZXZpb3VzU2libGluZyA9PT0gZXhwZWN0ZWRQcmV2Tm9kZTtcbiAgdmFyIHdhc1JlbW92ZWQgPSBjdXJyZW50Tm9kZSA9PT0gc3RhcnROb2RlO1xuXG4gIGlmICghd2FzVXBkYXRlZCAmJiAhd2FzQ2hhbmdlZCAmJiAhd2FzUmVtb3ZlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhlcmUgbXVzdCBiZSBleGFjdGx5IG9uZSB0b3AgbGV2ZWwgY2FsbCBjb3JyZXNwb25kaW5nICcgKyAndG8gdGhlIHBhdGNoZWQgZWxlbWVudC4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBzdGF0ZSBvZiBiZWluZyBpbiBhbiBhdHRyaWJ1dGUgZGVjbGFyYXRpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHZhbHVlXG4gKiBAcmV0dXJuIHtib29sZWFufSB0aGUgcHJldmlvdXMgdmFsdWUuXG4gKi9cbnZhciBzZXRJbkF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIHByZXZpb3VzID0gaW5BdHRyaWJ1dGVzO1xuICBpbkF0dHJpYnV0ZXMgPSB2YWx1ZTtcbiAgcmV0dXJuIHByZXZpb3VzO1xufTtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBzdGF0ZSBvZiBiZWluZyBpbiBhIHNraXAgZWxlbWVudC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRoZSBwcmV2aW91cyB2YWx1ZS5cbiAqL1xudmFyIHNldEluU2tpcCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgcHJldmlvdXMgPSBpblNraXA7XG4gIGluU2tpcCA9IHZhbHVlO1xuICByZXR1cm4gcHJldmlvdXM7XG59O1xuXG4vKipcbiAqIENvcHlyaWdodCAyMDE2IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgbm9kZSB0aGUgcm9vdCBvZiBhIGRvY3VtZW50LCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbnZhciBpc0RvY3VtZW50Um9vdCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIC8vIEZvciBTaGFkb3dSb290cywgY2hlY2sgaWYgdGhleSBhcmUgYSBEb2N1bWVudEZyYWdtZW50IGluc3RlYWQgb2YgaWYgdGhleVxuICAvLyBhcmUgYSBTaGFkb3dSb290IHNvIHRoYXQgdGhpcyBjYW4gd29yayBpbiAndXNlIHN0cmljdCcgaWYgU2hhZG93Um9vdHMgYXJlXG4gIC8vIG5vdCBzdXBwb3J0ZWQuXG4gIHJldHVybiBub2RlIGluc3RhbmNlb2YgRG9jdW1lbnQgfHwgbm9kZSBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnQ7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGUgVGhlIG5vZGUgdG8gc3RhcnQgYXQsIGluY2x1c2l2ZS5cbiAqIEBwYXJhbSB7P05vZGV9IHJvb3QgVGhlIHJvb3QgYW5jZXN0b3IgdG8gZ2V0IHVudGlsLCBleGNsdXNpdmUuXG4gKiBAcmV0dXJuIHshQXJyYXk8IU5vZGU+fSBUaGUgYW5jZXN0cnkgb2YgRE9NIG5vZGVzLlxuICovXG52YXIgZ2V0QW5jZXN0cnkgPSBmdW5jdGlvbiAobm9kZSwgcm9vdCkge1xuICB2YXIgYW5jZXN0cnkgPSBbXTtcbiAgdmFyIGN1ciA9IG5vZGU7XG5cbiAgd2hpbGUgKGN1ciAhPT0gcm9vdCkge1xuICAgIGFuY2VzdHJ5LnB1c2goY3VyKTtcbiAgICBjdXIgPSBjdXIucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHJldHVybiBhbmNlc3RyeTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICogQHJldHVybiB7IU5vZGV9IFRoZSByb290IG5vZGUgb2YgdGhlIERPTSB0cmVlIHRoYXQgY29udGFpbnMgbm9kZS5cbiAqL1xudmFyIGdldFJvb3QgPSBmdW5jdGlvbiAobm9kZSkge1xuICB2YXIgY3VyID0gbm9kZTtcbiAgdmFyIHByZXYgPSBjdXI7XG5cbiAgd2hpbGUgKGN1cikge1xuICAgIHByZXYgPSBjdXI7XG4gICAgY3VyID0gY3VyLnBhcmVudE5vZGU7XG4gIH1cblxuICByZXR1cm4gcHJldjtcbn07XG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZSBUaGUgbm9kZSB0byBnZXQgdGhlIGFjdGl2ZUVsZW1lbnQgZm9yLlxuICogQHJldHVybiB7P0VsZW1lbnR9IFRoZSBhY3RpdmVFbGVtZW50IGluIHRoZSBEb2N1bWVudCBvciBTaGFkb3dSb290XG4gKiAgICAgY29ycmVzcG9uZGluZyB0byBub2RlLCBpZiBwcmVzZW50LlxuICovXG52YXIgZ2V0QWN0aXZlRWxlbWVudCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIHZhciByb290ID0gZ2V0Um9vdChub2RlKTtcbiAgcmV0dXJuIGlzRG9jdW1lbnRSb290KHJvb3QpID8gcm9vdC5hY3RpdmVFbGVtZW50IDogbnVsbDtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgcGF0aCBvZiBub2RlcyB0aGF0IGNvbnRhaW4gdGhlIGZvY3VzZWQgbm9kZSBpbiB0aGUgc2FtZSBkb2N1bWVudCBhc1xuICogYSByZWZlcmVuY2Ugbm9kZSwgdXAgdW50aWwgdGhlIHJvb3QuXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlIFRoZSByZWZlcmVuY2Ugbm9kZSB0byBnZXQgdGhlIGFjdGl2ZUVsZW1lbnQgZm9yLlxuICogQHBhcmFtIHs/Tm9kZX0gcm9vdCBUaGUgcm9vdCB0byBnZXQgdGhlIGZvY3VzZWQgcGF0aCB1bnRpbC5cbiAqIEByZXR1cm4geyFBcnJheTxOb2RlPn1cbiAqL1xudmFyIGdldEZvY3VzZWRQYXRoID0gZnVuY3Rpb24gKG5vZGUsIHJvb3QpIHtcbiAgdmFyIGFjdGl2ZUVsZW1lbnQgPSBnZXRBY3RpdmVFbGVtZW50KG5vZGUpO1xuXG4gIGlmICghYWN0aXZlRWxlbWVudCB8fCAhbm9kZS5jb250YWlucyhhY3RpdmVFbGVtZW50KSkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIHJldHVybiBnZXRBbmNlc3RyeShhY3RpdmVFbGVtZW50LCByb290KTtcbn07XG5cbi8qKlxuICogTGlrZSBpbnNlcnRCZWZvcmUsIGJ1dCBpbnN0ZWFkIGluc3RlYWQgb2YgbW92aW5nIHRoZSBkZXNpcmVkIG5vZGUsIGluc3RlYWRcbiAqIG1vdmVzIGFsbCB0aGUgb3RoZXIgbm9kZXMgYWZ0ZXIuXG4gKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnROb2RlXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gKiBAcGFyYW0gez9Ob2RlfSByZWZlcmVuY2VOb2RlXG4gKi9cbnZhciBtb3ZlQmVmb3JlID0gZnVuY3Rpb24gKHBhcmVudE5vZGUsIG5vZGUsIHJlZmVyZW5jZU5vZGUpIHtcbiAgdmFyIGluc2VydFJlZmVyZW5jZU5vZGUgPSBub2RlLm5leHRTaWJsaW5nO1xuICB2YXIgY3VyID0gcmVmZXJlbmNlTm9kZTtcblxuICB3aGlsZSAoY3VyICE9PSBub2RlKSB7XG4gICAgdmFyIG5leHQgPSBjdXIubmV4dFNpYmxpbmc7XG4gICAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY3VyLCBpbnNlcnRSZWZlcmVuY2VOb2RlKTtcbiAgICBjdXIgPSBuZXh0O1xuICB9XG59O1xuXG4vKiogQHR5cGUgez9Db250ZXh0fSAqL1xudmFyIGNvbnRleHQgPSBudWxsO1xuXG4vKiogQHR5cGUgez9Ob2RlfSAqL1xudmFyIGN1cnJlbnROb2RlID0gbnVsbDtcblxuLyoqIEB0eXBlIHs/Tm9kZX0gKi9cbnZhciBjdXJyZW50UGFyZW50ID0gbnVsbDtcblxuLyoqIEB0eXBlIHs/RG9jdW1lbnR9ICovXG52YXIgZG9jID0gbnVsbDtcblxuLyoqXG4gKiBAcGFyYW0geyFBcnJheTxOb2RlPn0gZm9jdXNQYXRoIFRoZSBub2RlcyB0byBtYXJrLlxuICogQHBhcmFtIHtib29sZWFufSBmb2N1c2VkIFdoZXRoZXIgb3Igbm90IHRoZXkgYXJlIGZvY3VzZWQuXG4gKi9cbnZhciBtYXJrRm9jdXNlZCA9IGZ1bmN0aW9uIChmb2N1c1BhdGgsIGZvY3VzZWQpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBmb2N1c1BhdGgubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBnZXREYXRhKGZvY3VzUGF0aFtpXSkuZm9jdXNlZCA9IGZvY3VzZWQ7XG4gIH1cbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHBhdGNoZXIgZnVuY3Rpb24gdGhhdCBzZXRzIHVwIGFuZCByZXN0b3JlcyBhIHBhdGNoIGNvbnRleHQsXG4gKiBydW5uaW5nIHRoZSBydW4gZnVuY3Rpb24gd2l0aCB0aGUgcHJvdmlkZWQgZGF0YS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKCFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50KSwhZnVuY3Rpb24oVCksVD0pOiA/Tm9kZX0gcnVuXG4gKiBAcmV0dXJuIHtmdW5jdGlvbigoIUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnQpLCFmdW5jdGlvbihUKSxUPSk6ID9Ob2RlfVxuICogQHRlbXBsYXRlIFRcbiAqL1xudmFyIHBhdGNoRmFjdG9yeSA9IGZ1bmN0aW9uIChydW4pIHtcbiAgLyoqXG4gICAqIFRPRE8obW96KTogVGhlc2UgYW5ub3RhdGlvbnMgd29uJ3QgYmUgbmVjZXNzYXJ5IG9uY2Ugd2Ugc3dpdGNoIHRvIENsb3N1cmVcbiAgICogQ29tcGlsZXIncyBuZXcgdHlwZSBpbmZlcmVuY2UuIFJlbW92ZSB0aGVzZSBvbmNlIHRoZSBzd2l0Y2ggaXMgZG9uZS5cbiAgICpcbiAgICogQHBhcmFtIHsoIUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnQpfSBub2RlXG4gICAqIEBwYXJhbSB7IWZ1bmN0aW9uKFQpfSBmblxuICAgKiBAcGFyYW0ge1Q9fSBkYXRhXG4gICAqIEByZXR1cm4gez9Ob2RlfSBub2RlXG4gICAqIEB0ZW1wbGF0ZSBUXG4gICAqL1xuICB2YXIgZiA9IGZ1bmN0aW9uIChub2RlLCBmbiwgZGF0YSkge1xuICAgIHZhciBwcmV2Q29udGV4dCA9IGNvbnRleHQ7XG4gICAgdmFyIHByZXZEb2MgPSBkb2M7XG4gICAgdmFyIHByZXZDdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlO1xuICAgIHZhciBwcmV2Q3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnQ7XG4gICAgdmFyIHByZXZpb3VzSW5BdHRyaWJ1dGVzID0gZmFsc2U7XG4gICAgdmFyIHByZXZpb3VzSW5Ta2lwID0gZmFsc2U7XG5cbiAgICBjb250ZXh0ID0gbmV3IENvbnRleHQoKTtcbiAgICBkb2MgPSBub2RlLm93bmVyRG9jdW1lbnQ7XG4gICAgY3VycmVudFBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcblxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBwcmV2aW91c0luQXR0cmlidXRlcyA9IHNldEluQXR0cmlidXRlcyhmYWxzZSk7XG4gICAgICBwcmV2aW91c0luU2tpcCA9IHNldEluU2tpcChmYWxzZSk7XG4gICAgfVxuXG4gICAgdmFyIGZvY3VzUGF0aCA9IGdldEZvY3VzZWRQYXRoKG5vZGUsIGN1cnJlbnRQYXJlbnQpO1xuICAgIG1hcmtGb2N1c2VkKGZvY3VzUGF0aCwgdHJ1ZSk7XG4gICAgdmFyIHJldFZhbCA9IHJ1bihub2RlLCBmbiwgZGF0YSk7XG4gICAgbWFya0ZvY3VzZWQoZm9jdXNQYXRoLCBmYWxzZSk7XG5cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgYXNzZXJ0VmlydHVhbEF0dHJpYnV0ZXNDbG9zZWQoKTtcbiAgICAgIHNldEluQXR0cmlidXRlcyhwcmV2aW91c0luQXR0cmlidXRlcyk7XG4gICAgICBzZXRJblNraXAocHJldmlvdXNJblNraXApO1xuICAgIH1cblxuICAgIGNvbnRleHQubm90aWZ5Q2hhbmdlcygpO1xuXG4gICAgY29udGV4dCA9IHByZXZDb250ZXh0O1xuICAgIGRvYyA9IHByZXZEb2M7XG4gICAgY3VycmVudE5vZGUgPSBwcmV2Q3VycmVudE5vZGU7XG4gICAgY3VycmVudFBhcmVudCA9IHByZXZDdXJyZW50UGFyZW50O1xuXG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfTtcbiAgcmV0dXJuIGY7XG59O1xuXG4vKipcbiAqIFBhdGNoZXMgdGhlIGRvY3VtZW50IHN0YXJ0aW5nIGF0IG5vZGUgd2l0aCB0aGUgcHJvdmlkZWQgZnVuY3Rpb24uIFRoaXNcbiAqIGZ1bmN0aW9uIG1heSBiZSBjYWxsZWQgZHVyaW5nIGFuIGV4aXN0aW5nIHBhdGNoIG9wZXJhdGlvbi5cbiAqIEBwYXJhbSB7IUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnR9IG5vZGUgVGhlIEVsZW1lbnQgb3IgRG9jdW1lbnRcbiAqICAgICB0byBwYXRjaC5cbiAqIEBwYXJhbSB7IWZ1bmN0aW9uKFQpfSBmbiBBIGZ1bmN0aW9uIGNvbnRhaW5pbmcgZWxlbWVudE9wZW4vZWxlbWVudENsb3NlL2V0Yy5cbiAqICAgICBjYWxscyB0aGF0IGRlc2NyaWJlIHRoZSBET00uXG4gKiBAcGFyYW0ge1Q9fSBkYXRhIEFuIGFyZ3VtZW50IHBhc3NlZCB0byBmbiB0byByZXByZXNlbnQgRE9NIHN0YXRlLlxuICogQHJldHVybiB7IU5vZGV9IFRoZSBwYXRjaGVkIG5vZGUuXG4gKiBAdGVtcGxhdGUgVFxuICovXG52YXIgcGF0Y2hJbm5lciA9IHBhdGNoRmFjdG9yeShmdW5jdGlvbiAobm9kZSwgZm4sIGRhdGEpIHtcbiAgY3VycmVudE5vZGUgPSBub2RlO1xuXG4gIGVudGVyTm9kZSgpO1xuICBmbihkYXRhKTtcbiAgZXhpdE5vZGUoKTtcblxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vVW5jbG9zZWRUYWdzKGN1cnJlbnROb2RlLCBub2RlKTtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufSk7XG5cbi8qKlxuICogUGF0Y2hlcyBhbiBFbGVtZW50IHdpdGggdGhlIHRoZSBwcm92aWRlZCBmdW5jdGlvbi4gRXhhY3RseSBvbmUgdG9wIGxldmVsXG4gKiBlbGVtZW50IGNhbGwgc2hvdWxkIGJlIG1hZGUgY29ycmVzcG9uZGluZyB0byBgbm9kZWAuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBub2RlIFRoZSBFbGVtZW50IHdoZXJlIHRoZSBwYXRjaCBzaG91bGQgc3RhcnQuXG4gKiBAcGFyYW0geyFmdW5jdGlvbihUKX0gZm4gQSBmdW5jdGlvbiBjb250YWluaW5nIGVsZW1lbnRPcGVuL2VsZW1lbnRDbG9zZS9ldGMuXG4gKiAgICAgY2FsbHMgdGhhdCBkZXNjcmliZSB0aGUgRE9NLiBUaGlzIHNob3VsZCBoYXZlIGF0IG1vc3Qgb25lIHRvcCBsZXZlbFxuICogICAgIGVsZW1lbnQgY2FsbC5cbiAqIEBwYXJhbSB7VD19IGRhdGEgQW4gYXJndW1lbnQgcGFzc2VkIHRvIGZuIHRvIHJlcHJlc2VudCBET00gc3RhdGUuXG4gKiBAcmV0dXJuIHs/Tm9kZX0gVGhlIG5vZGUgaWYgaXQgd2FzIHVwZGF0ZWQsIGl0cyByZXBsYWNlZG1lbnQgb3IgbnVsbCBpZiBpdFxuICogICAgIHdhcyByZW1vdmVkLlxuICogQHRlbXBsYXRlIFRcbiAqL1xudmFyIHBhdGNoT3V0ZXIgPSBwYXRjaEZhY3RvcnkoZnVuY3Rpb24gKG5vZGUsIGZuLCBkYXRhKSB7XG4gIHZhciBzdGFydE5vZGUgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL3sgbmV4dFNpYmxpbmc6IG5vZGUgfTtcbiAgdmFyIGV4cGVjdGVkTmV4dE5vZGUgPSBudWxsO1xuICB2YXIgZXhwZWN0ZWRQcmV2Tm9kZSA9IG51bGw7XG5cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBleHBlY3RlZE5leHROb2RlID0gbm9kZS5uZXh0U2libGluZztcbiAgICBleHBlY3RlZFByZXZOb2RlID0gbm9kZS5wcmV2aW91c1NpYmxpbmc7XG4gIH1cblxuICBjdXJyZW50Tm9kZSA9IHN0YXJ0Tm9kZTtcbiAgZm4oZGF0YSk7XG5cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRQYXRjaEVsZW1lbnROb0V4dHJhcyhzdGFydE5vZGUsIGN1cnJlbnROb2RlLCBleHBlY3RlZE5leHROb2RlLCBleHBlY3RlZFByZXZOb2RlKTtcbiAgfVxuXG4gIGlmIChub2RlICE9PSBjdXJyZW50Tm9kZSAmJiBub2RlLnBhcmVudE5vZGUpIHtcbiAgICByZW1vdmVDaGlsZChjdXJyZW50UGFyZW50LCBub2RlLCBnZXREYXRhKGN1cnJlbnRQYXJlbnQpLmtleU1hcCk7XG4gIH1cblxuICByZXR1cm4gc3RhcnROb2RlID09PSBjdXJyZW50Tm9kZSA/IG51bGwgOiBjdXJyZW50Tm9kZTtcbn0pO1xuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIG9yIG5vdCB0aGUgY3VycmVudCBub2RlIG1hdGNoZXMgdGhlIHNwZWNpZmllZCBub2RlTmFtZSBhbmRcbiAqIGtleS5cbiAqXG4gKiBAcGFyYW0geyFOb2RlfSBtYXRjaE5vZGUgQSBub2RlIHRvIG1hdGNoIHRoZSBkYXRhIHRvLlxuICogQHBhcmFtIHs/c3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZU5hbWUgZm9yIHRoaXMgbm9kZS5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBBbiBvcHRpb25hbCBrZXkgdGhhdCBpZGVudGlmaWVzIGEgbm9kZS5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIG5vZGUgbWF0Y2hlcywgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG52YXIgbWF0Y2hlcyA9IGZ1bmN0aW9uIChtYXRjaE5vZGUsIG5vZGVOYW1lLCBrZXkpIHtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKG1hdGNoTm9kZSk7XG5cbiAgLy8gS2V5IGNoZWNrIGlzIGRvbmUgdXNpbmcgZG91YmxlIGVxdWFscyBhcyB3ZSB3YW50IHRvIHRyZWF0IGEgbnVsbCBrZXkgdGhlXG4gIC8vIHNhbWUgYXMgdW5kZWZpbmVkLiBUaGlzIHNob3VsZCBiZSBva2F5IGFzIHRoZSBvbmx5IHZhbHVlcyBhbGxvd2VkIGFyZVxuICAvLyBzdHJpbmdzLCBudWxsIGFuZCB1bmRlZmluZWQgc28gdGhlID09IHNlbWFudGljcyBhcmUgbm90IHRvbyB3ZWlyZC5cbiAgcmV0dXJuIG5vZGVOYW1lID09PSBkYXRhLm5vZGVOYW1lICYmIGtleSA9PSBkYXRhLmtleTtcbn07XG5cbi8qKlxuICogQWxpZ25zIHRoZSB2aXJ0dWFsIEVsZW1lbnQgZGVmaW5pdGlvbiB3aXRoIHRoZSBhY3R1YWwgRE9NLCBtb3ZpbmcgdGhlXG4gKiBjb3JyZXNwb25kaW5nIERPTSBub2RlIHRvIHRoZSBjb3JyZWN0IGxvY2F0aW9uIG9yIGNyZWF0aW5nIGl0IGlmIG5lY2Vzc2FyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZSBGb3IgYW4gRWxlbWVudCwgdGhpcyBzaG91bGQgYmUgYSB2YWxpZCB0YWcgc3RyaW5nLlxuICogICAgIEZvciBhIFRleHQsIHRoaXMgc2hvdWxkIGJlICN0ZXh0LlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuXG4gKi9cbnZhciBhbGlnbldpdGhET00gPSBmdW5jdGlvbiAobm9kZU5hbWUsIGtleSkge1xuICBpZiAoY3VycmVudE5vZGUgJiYgbWF0Y2hlcyhjdXJyZW50Tm9kZSwgbm9kZU5hbWUsIGtleSkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgcGFyZW50RGF0YSA9IGdldERhdGEoY3VycmVudFBhcmVudCk7XG4gIHZhciBjdXJyZW50Tm9kZURhdGEgPSBjdXJyZW50Tm9kZSAmJiBnZXREYXRhKGN1cnJlbnROb2RlKTtcbiAgdmFyIGtleU1hcCA9IHBhcmVudERhdGEua2V5TWFwO1xuICB2YXIgbm9kZSA9IHVuZGVmaW5lZDtcblxuICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIG5vZGUgaGFzIG1vdmVkIHdpdGhpbiB0aGUgcGFyZW50LlxuICBpZiAoa2V5KSB7XG4gICAgdmFyIGtleU5vZGUgPSBrZXlNYXBba2V5XTtcbiAgICBpZiAoa2V5Tm9kZSkge1xuICAgICAgaWYgKG1hdGNoZXMoa2V5Tm9kZSwgbm9kZU5hbWUsIGtleSkpIHtcbiAgICAgICAgbm9kZSA9IGtleU5vZGU7XG4gICAgICB9IGVsc2UgaWYgKGtleU5vZGUgPT09IGN1cnJlbnROb2RlKSB7XG4gICAgICAgIGNvbnRleHQubWFya0RlbGV0ZWQoa2V5Tm9kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZW1vdmVDaGlsZChjdXJyZW50UGFyZW50LCBrZXlOb2RlLCBrZXlNYXApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIENyZWF0ZSB0aGUgbm9kZSBpZiBpdCBkb2Vzbid0IGV4aXN0LlxuICBpZiAoIW5vZGUpIHtcbiAgICBpZiAobm9kZU5hbWUgPT09ICcjdGV4dCcpIHtcbiAgICAgIG5vZGUgPSBjcmVhdGVUZXh0KGRvYyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUgPSBjcmVhdGVFbGVtZW50KGRvYywgY3VycmVudFBhcmVudCwgbm9kZU5hbWUsIGtleSk7XG4gICAgfVxuXG4gICAgaWYgKGtleSkge1xuICAgICAga2V5TWFwW2tleV0gPSBub2RlO1xuICAgIH1cblxuICAgIGNvbnRleHQubWFya0NyZWF0ZWQobm9kZSk7XG4gIH1cblxuICAvLyBSZS1vcmRlciB0aGUgbm9kZSBpbnRvIHRoZSByaWdodCBwb3NpdGlvbiwgcHJlc2VydmluZyBmb2N1cyBpZiBlaXRoZXJcbiAgLy8gbm9kZSBvciBjdXJyZW50Tm9kZSBhcmUgZm9jdXNlZCBieSBtYWtpbmcgc3VyZSB0aGF0IHRoZXkgYXJlIG5vdCBkZXRhY2hlZFxuICAvLyBmcm9tIHRoZSBET00uXG4gIGlmIChnZXREYXRhKG5vZGUpLmZvY3VzZWQpIHtcbiAgICAvLyBNb3ZlIGV2ZXJ5dGhpbmcgZWxzZSBiZWZvcmUgdGhlIG5vZGUuXG4gICAgbW92ZUJlZm9yZShjdXJyZW50UGFyZW50LCBub2RlLCBjdXJyZW50Tm9kZSk7XG4gIH0gZWxzZSBpZiAoY3VycmVudE5vZGVEYXRhICYmIGN1cnJlbnROb2RlRGF0YS5rZXkgJiYgIWN1cnJlbnROb2RlRGF0YS5mb2N1c2VkKSB7XG4gICAgLy8gUmVtb3ZlIHRoZSBjdXJyZW50Tm9kZSwgd2hpY2ggY2FuIGFsd2F5cyBiZSBhZGRlZCBiYWNrIHNpbmNlIHdlIGhvbGQgYVxuICAgIC8vIHJlZmVyZW5jZSB0aHJvdWdoIHRoZSBrZXlNYXAuIFRoaXMgcHJldmVudHMgYSBsYXJnZSBudW1iZXIgb2YgbW92ZXMgd2hlblxuICAgIC8vIGEga2V5ZWQgaXRlbSBpcyByZW1vdmVkIG9yIG1vdmVkIGJhY2t3YXJkcyBpbiB0aGUgRE9NLlxuICAgIGN1cnJlbnRQYXJlbnQucmVwbGFjZUNoaWxkKG5vZGUsIGN1cnJlbnROb2RlKTtcbiAgICBwYXJlbnREYXRhLmtleU1hcFZhbGlkID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgY3VycmVudFBhcmVudC5pbnNlcnRCZWZvcmUobm9kZSwgY3VycmVudE5vZGUpO1xuICB9XG5cbiAgY3VycmVudE5vZGUgPSBub2RlO1xufTtcblxuLyoqXG4gKiBAcGFyYW0gez9Ob2RlfSBub2RlXG4gKiBAcGFyYW0gez9Ob2RlfSBjaGlsZFxuICogQHBhcmFtIHs/T2JqZWN0PHN0cmluZywgIUVsZW1lbnQ+fSBrZXlNYXBcbiAqL1xudmFyIHJlbW92ZUNoaWxkID0gZnVuY3Rpb24gKG5vZGUsIGNoaWxkLCBrZXlNYXApIHtcbiAgbm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG4gIGNvbnRleHQubWFya0RlbGV0ZWQoIC8qKiBAdHlwZSB7IU5vZGV9Ki9jaGlsZCk7XG5cbiAgdmFyIGtleSA9IGdldERhdGEoY2hpbGQpLmtleTtcbiAgaWYgKGtleSkge1xuICAgIGRlbGV0ZSBrZXlNYXBba2V5XTtcbiAgfVxufTtcblxuLyoqXG4gKiBDbGVhcnMgb3V0IGFueSB1bnZpc2l0ZWQgTm9kZXMsIGFzIHRoZSBjb3JyZXNwb25kaW5nIHZpcnR1YWwgZWxlbWVudFxuICogZnVuY3Rpb25zIHdlcmUgbmV2ZXIgY2FsbGVkIGZvciB0aGVtLlxuICovXG52YXIgY2xlYXJVbnZpc2l0ZWRET00gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBub2RlID0gY3VycmVudFBhcmVudDtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuICB2YXIga2V5TWFwID0gZGF0YS5rZXlNYXA7XG4gIHZhciBrZXlNYXBWYWxpZCA9IGRhdGEua2V5TWFwVmFsaWQ7XG4gIHZhciBjaGlsZCA9IG5vZGUubGFzdENoaWxkO1xuICB2YXIga2V5ID0gdW5kZWZpbmVkO1xuXG4gIGlmIChjaGlsZCA9PT0gY3VycmVudE5vZGUgJiYga2V5TWFwVmFsaWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB3aGlsZSAoY2hpbGQgIT09IGN1cnJlbnROb2RlKSB7XG4gICAgcmVtb3ZlQ2hpbGQobm9kZSwgY2hpbGQsIGtleU1hcCk7XG4gICAgY2hpbGQgPSBub2RlLmxhc3RDaGlsZDtcbiAgfVxuXG4gIC8vIENsZWFuIHRoZSBrZXlNYXAsIHJlbW92aW5nIGFueSB1bnVzdWVkIGtleXMuXG4gIGlmICgha2V5TWFwVmFsaWQpIHtcbiAgICBmb3IgKGtleSBpbiBrZXlNYXApIHtcbiAgICAgIGNoaWxkID0ga2V5TWFwW2tleV07XG4gICAgICBpZiAoY2hpbGQucGFyZW50Tm9kZSAhPT0gbm9kZSkge1xuICAgICAgICBjb250ZXh0Lm1hcmtEZWxldGVkKGNoaWxkKTtcbiAgICAgICAgZGVsZXRlIGtleU1hcFtrZXldO1xuICAgICAgfVxuICAgIH1cblxuICAgIGRhdGEua2V5TWFwVmFsaWQgPSB0cnVlO1xuICB9XG59O1xuXG4vKipcbiAqIENoYW5nZXMgdG8gdGhlIGZpcnN0IGNoaWxkIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbnZhciBlbnRlck5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50Tm9kZTtcbiAgY3VycmVudE5vZGUgPSBudWxsO1xufTtcblxuLyoqXG4gKiBAcmV0dXJuIHs/Tm9kZX0gVGhlIG5leHQgTm9kZSB0byBiZSBwYXRjaGVkLlxuICovXG52YXIgZ2V0TmV4dE5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChjdXJyZW50Tm9kZSkge1xuICAgIHJldHVybiBjdXJyZW50Tm9kZS5uZXh0U2libGluZztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY3VycmVudFBhcmVudC5maXJzdENoaWxkO1xuICB9XG59O1xuXG4vKipcbiAqIENoYW5nZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgY3VycmVudCBub2RlLlxuICovXG52YXIgbmV4dE5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gIGN1cnJlbnROb2RlID0gZ2V0TmV4dE5vZGUoKTtcbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0byB0aGUgcGFyZW50IG9mIHRoZSBjdXJyZW50IG5vZGUsIHJlbW92aW5nIGFueSB1bnZpc2l0ZWQgY2hpbGRyZW4uXG4gKi9cbnZhciBleGl0Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgY2xlYXJVbnZpc2l0ZWRET00oKTtcblxuICBjdXJyZW50Tm9kZSA9IGN1cnJlbnRQYXJlbnQ7XG4gIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50UGFyZW50LnBhcmVudE5vZGU7XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY3VycmVudCBub2RlIGlzIGFuIEVsZW1lbnQgd2l0aCBhIG1hdGNoaW5nIHRhZ05hbWUgYW5kXG4gKiBrZXkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGNvcmVFbGVtZW50T3BlbiA9IGZ1bmN0aW9uICh0YWcsIGtleSkge1xuICBuZXh0Tm9kZSgpO1xuICBhbGlnbldpdGhET00odGFnLCBrZXkpO1xuICBlbnRlck5vZGUoKTtcbiAgcmV0dXJuICgvKiogQHR5cGUgeyFFbGVtZW50fSAqL2N1cnJlbnRQYXJlbnRcbiAgKTtcbn07XG5cbi8qKlxuICogQ2xvc2VzIHRoZSBjdXJyZW50bHkgb3BlbiBFbGVtZW50LCByZW1vdmluZyBhbnkgdW52aXNpdGVkIGNoaWxkcmVuIGlmXG4gKiBuZWNlc3NhcnkuXG4gKlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBjb3JlRWxlbWVudENsb3NlID0gZnVuY3Rpb24gKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIHNldEluU2tpcChmYWxzZSk7XG4gIH1cblxuICBleGl0Tm9kZSgpO1xuICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovY3VycmVudE5vZGVcbiAgKTtcbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGUgY3VycmVudCBub2RlIGlzIGEgVGV4dCBub2RlIGFuZCBjcmVhdGVzIGEgVGV4dCBub2RlIGlmIGl0IGlzXG4gKiBub3QuXG4gKlxuICogQHJldHVybiB7IVRleHR9IFRoZSBjb3JyZXNwb25kaW5nIFRleHQgTm9kZS5cbiAqL1xudmFyIGNvcmVUZXh0ID0gZnVuY3Rpb24gKCkge1xuICBuZXh0Tm9kZSgpO1xuICBhbGlnbldpdGhET00oJyN0ZXh0JywgbnVsbCk7XG4gIHJldHVybiAoLyoqIEB0eXBlIHshVGV4dH0gKi9jdXJyZW50Tm9kZVxuICApO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBjdXJyZW50IEVsZW1lbnQgYmVpbmcgcGF0Y2hlZC5cbiAqIEByZXR1cm4geyFFbGVtZW50fVxuICovXG52YXIgY3VycmVudEVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0SW5QYXRjaCgnY3VycmVudEVsZW1lbnQnLCBjb250ZXh0KTtcbiAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoJ2N1cnJlbnRFbGVtZW50Jyk7XG4gIH1cbiAgcmV0dXJuICgvKiogQHR5cGUgeyFFbGVtZW50fSAqL2N1cnJlbnRQYXJlbnRcbiAgKTtcbn07XG5cbi8qKlxuICogQHJldHVybiB7Tm9kZX0gVGhlIE5vZGUgdGhhdCB3aWxsIGJlIGV2YWx1YXRlZCBmb3IgdGhlIG5leHQgaW5zdHJ1Y3Rpb24uXG4gKi9cbnZhciBjdXJyZW50UG9pbnRlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRJblBhdGNoKCdjdXJyZW50UG9pbnRlcicsIGNvbnRleHQpO1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygnY3VycmVudFBvaW50ZXInKTtcbiAgfVxuICByZXR1cm4gZ2V0TmV4dE5vZGUoKTtcbn07XG5cbi8qKlxuICogU2tpcHMgdGhlIGNoaWxkcmVuIGluIGEgc3VidHJlZSwgYWxsb3dpbmcgYW4gRWxlbWVudCB0byBiZSBjbG9zZWQgd2l0aG91dFxuICogY2xlYXJpbmcgb3V0IHRoZSBjaGlsZHJlbi5cbiAqL1xudmFyIHNraXAgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm9DaGlsZHJlbkRlY2xhcmVkWWV0KCdza2lwJywgY3VycmVudE5vZGUpO1xuICAgIHNldEluU2tpcCh0cnVlKTtcbiAgfVxuICBjdXJyZW50Tm9kZSA9IGN1cnJlbnRQYXJlbnQubGFzdENoaWxkO1xufTtcblxuLyoqXG4gKiBTa2lwcyB0aGUgbmV4dCBOb2RlIHRvIGJlIHBhdGNoZWQsIG1vdmluZyB0aGUgcG9pbnRlciBmb3J3YXJkIHRvIHRoZSBuZXh0XG4gKiBzaWJsaW5nIG9mIHRoZSBjdXJyZW50IHBvaW50ZXIuXG4gKi9cbnZhciBza2lwTm9kZSA9IG5leHROb2RlO1xuXG4vKipcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKiBAY29uc3QgKi9cbnZhciBzeW1ib2xzID0ge1xuICBkZWZhdWx0OiAnX19kZWZhdWx0J1xufTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7c3RyaW5nfHVuZGVmaW5lZH0gVGhlIG5hbWVzcGFjZSB0byB1c2UgZm9yIHRoZSBhdHRyaWJ1dGUuXG4gKi9cbnZhciBnZXROYW1lc3BhY2UgPSBmdW5jdGlvbiAobmFtZSkge1xuICBpZiAobmFtZS5sYXN0SW5kZXhPZigneG1sOicsIDApID09PSAwKSB7XG4gICAgcmV0dXJuICdodHRwOi8vd3d3LnczLm9yZy9YTUwvMTk5OC9uYW1lc3BhY2UnO1xuICB9XG5cbiAgaWYgKG5hbWUubGFzdEluZGV4T2YoJ3hsaW5rOicsIDApID09PSAwKSB7XG4gICAgcmV0dXJuICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJztcbiAgfVxufTtcblxuLyoqXG4gKiBBcHBsaWVzIGFuIGF0dHJpYnV0ZSBvciBwcm9wZXJ0eSB0byBhIGdpdmVuIEVsZW1lbnQuIElmIHRoZSB2YWx1ZSBpcyBudWxsXG4gKiBvciB1bmRlZmluZWQsIGl0IGlzIHJlbW92ZWQgZnJvbSB0aGUgRWxlbWVudC4gT3RoZXJ3aXNlLCB0aGUgdmFsdWUgaXMgc2V0XG4gKiBhcyBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gKiBAcGFyYW0gez8oYm9vbGVhbnxudW1iZXJ8c3RyaW5nKT19IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS5cbiAqL1xudmFyIGFwcGx5QXR0ciA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICBlbC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGF0dHJOUyA9IGdldE5hbWVzcGFjZShuYW1lKTtcbiAgICBpZiAoYXR0ck5TKSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGVOUyhhdHRyTlMsIG5hbWUsIHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWwuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQXBwbGllcyBhIHByb3BlcnR5IHRvIGEgZ2l2ZW4gRWxlbWVudC5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgcHJvcGVydHkncyBuYW1lLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgcHJvcGVydHkncyB2YWx1ZS5cbiAqL1xudmFyIGFwcGx5UHJvcCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgZWxbbmFtZV0gPSB2YWx1ZTtcbn07XG5cbi8qKlxuICogQXBwbGllcyBhIHZhbHVlIHRvIGEgc3R5bGUgZGVjbGFyYXRpb24uIFN1cHBvcnRzIENTUyBjdXN0b20gcHJvcGVydGllcyBieVxuICogc2V0dGluZyBwcm9wZXJ0aWVzIGNvbnRhaW5pbmcgYSBkYXNoIHVzaW5nIENTU1N0eWxlRGVjbGFyYXRpb24uc2V0UHJvcGVydHkuXG4gKiBAcGFyYW0ge0NTU1N0eWxlRGVjbGFyYXRpb259IHN0eWxlXG4gKiBAcGFyYW0geyFzdHJpbmd9IHByb3BcbiAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAqL1xudmFyIHNldFN0eWxlVmFsdWUgPSBmdW5jdGlvbiAoc3R5bGUsIHByb3AsIHZhbHVlKSB7XG4gIGlmIChwcm9wLmluZGV4T2YoJy0nKSA+PSAwKSB7XG4gICAgc3R5bGUuc2V0UHJvcGVydHkocHJvcCwgLyoqIEB0eXBlIHtzdHJpbmd9ICovdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIHN0eWxlW3Byb3BdID0gdmFsdWU7XG4gIH1cbn07XG5cbi8qKlxuICogQXBwbGllcyBhIHN0eWxlIHRvIGFuIEVsZW1lbnQuIE5vIHZlbmRvciBwcmVmaXggZXhwYW5zaW9uIGlzIGRvbmUgZm9yXG4gKiBwcm9wZXJ0eSBuYW1lcy92YWx1ZXMuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gKiBAcGFyYW0geyp9IHN0eWxlIFRoZSBzdHlsZSB0byBzZXQuIEVpdGhlciBhIHN0cmluZyBvZiBjc3Mgb3IgYW4gb2JqZWN0XG4gKiAgICAgY29udGFpbmluZyBwcm9wZXJ0eS12YWx1ZSBwYWlycy5cbiAqL1xudmFyIGFwcGx5U3R5bGUgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHN0eWxlKSB7XG4gIGlmICh0eXBlb2Ygc3R5bGUgPT09ICdzdHJpbmcnKSB7XG4gICAgZWwuc3R5bGUuY3NzVGV4dCA9IHN0eWxlO1xuICB9IGVsc2Uge1xuICAgIGVsLnN0eWxlLmNzc1RleHQgPSAnJztcbiAgICB2YXIgZWxTdHlsZSA9IGVsLnN0eWxlO1xuICAgIHZhciBvYmogPSAvKiogQHR5cGUgeyFPYmplY3Q8c3RyaW5nLHN0cmluZz59ICovc3R5bGU7XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgaWYgKGhhcyhvYmosIHByb3ApKSB7XG4gICAgICAgIHNldFN0eWxlVmFsdWUoZWxTdHlsZSwgcHJvcCwgb2JqW3Byb3BdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogVXBkYXRlcyBhIHNpbmdsZSBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLiBJZiB0aGUgdmFsdWUgaXMgYW4gb2JqZWN0IG9yXG4gKiAgICAgZnVuY3Rpb24gaXQgaXMgc2V0IG9uIHRoZSBFbGVtZW50LCBvdGhlcndpc2UsIGl0IGlzIHNldCBhcyBhbiBIVE1MXG4gKiAgICAgYXR0cmlidXRlLlxuICovXG52YXIgYXBwbHlBdHRyaWJ1dGVUeXBlZCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG5cbiAgaWYgKHR5cGUgPT09ICdvYmplY3QnIHx8IHR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICBhcHBseVByb3AoZWwsIG5hbWUsIHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBhcHBseUF0dHIoZWwsIG5hbWUsIC8qKiBAdHlwZSB7Pyhib29sZWFufG51bWJlcnxzdHJpbmcpfSAqL3ZhbHVlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDYWxscyB0aGUgYXBwcm9wcmlhdGUgYXR0cmlidXRlIG11dGF0b3IgZm9yIHRoaXMgYXR0cmlidXRlLlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuXG4gKi9cbnZhciB1cGRhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShlbCk7XG4gIHZhciBhdHRycyA9IGRhdGEuYXR0cnM7XG5cbiAgaWYgKGF0dHJzW25hbWVdID09PSB2YWx1ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBtdXRhdG9yID0gYXR0cmlidXRlc1tuYW1lXSB8fCBhdHRyaWJ1dGVzW3N5bWJvbHMuZGVmYXVsdF07XG4gIG11dGF0b3IoZWwsIG5hbWUsIHZhbHVlKTtcblxuICBhdHRyc1tuYW1lXSA9IHZhbHVlO1xufTtcblxuLyoqXG4gKiBBIHB1YmxpY2x5IG11dGFibGUgb2JqZWN0IHRvIHByb3ZpZGUgY3VzdG9tIG11dGF0b3JzIGZvciBhdHRyaWJ1dGVzLlxuICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgZnVuY3Rpb24oIUVsZW1lbnQsIHN0cmluZywgKik+fVxuICovXG52YXIgYXR0cmlidXRlcyA9IGNyZWF0ZU1hcCgpO1xuXG4vLyBTcGVjaWFsIGdlbmVyaWMgbXV0YXRvciB0aGF0J3MgY2FsbGVkIGZvciBhbnkgYXR0cmlidXRlIHRoYXQgZG9lcyBub3Rcbi8vIGhhdmUgYSBzcGVjaWZpYyBtdXRhdG9yLlxuYXR0cmlidXRlc1tzeW1ib2xzLmRlZmF1bHRdID0gYXBwbHlBdHRyaWJ1dGVUeXBlZDtcblxuYXR0cmlidXRlc1snc3R5bGUnXSA9IGFwcGx5U3R5bGU7XG5cbi8qKlxuICogVGhlIG9mZnNldCBpbiB0aGUgdmlydHVhbCBlbGVtZW50IGRlY2xhcmF0aW9uIHdoZXJlIHRoZSBhdHRyaWJ1dGVzIGFyZVxuICogc3BlY2lmaWVkLlxuICogQGNvbnN0XG4gKi9cbnZhciBBVFRSSUJVVEVTX09GRlNFVCA9IDM7XG5cbi8qKlxuICogQnVpbGRzIGFuIGFycmF5IG9mIGFyZ3VtZW50cyBmb3IgdXNlIHdpdGggZWxlbWVudE9wZW5TdGFydCwgYXR0ciBhbmRcbiAqIGVsZW1lbnRPcGVuRW5kLlxuICogQGNvbnN0IHtBcnJheTwqPn1cbiAqL1xudmFyIGFyZ3NCdWlsZGVyID0gW107XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKiBAcGFyYW0gey4uLip9IHZhcl9hcmdzLCBBdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGUgZHluYW1pYyBhdHRyaWJ1dGVzXG4gKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBlbGVtZW50T3BlbiA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcywgdmFyX2FyZ3MpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoJ2VsZW1lbnRPcGVuJyk7XG4gICAgYXNzZXJ0Tm90SW5Ta2lwKCdlbGVtZW50T3BlbicpO1xuICB9XG5cbiAgdmFyIG5vZGUgPSBjb3JlRWxlbWVudE9wZW4odGFnLCBrZXkpO1xuICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG5cbiAgaWYgKCFkYXRhLnN0YXRpY3NBcHBsaWVkKSB7XG4gICAgaWYgKHN0YXRpY3MpIHtcbiAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBzdGF0aWNzLmxlbmd0aDsgX2kgKz0gMikge1xuICAgICAgICB2YXIgbmFtZSA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqL3N0YXRpY3NbX2ldO1xuICAgICAgICB2YXIgdmFsdWUgPSBzdGF0aWNzW19pICsgMV07XG4gICAgICAgIHVwZGF0ZUF0dHJpYnV0ZShub2RlLCBuYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIERvd24gdGhlIHJvYWQsIHdlIG1heSB3YW50IHRvIGtlZXAgdHJhY2sgb2YgdGhlIHN0YXRpY3MgYXJyYXkgdG8gdXNlIGl0XG4gICAgLy8gYXMgYW4gYWRkaXRpb25hbCBzaWduYWwgYWJvdXQgd2hldGhlciBhIG5vZGUgbWF0Y2hlcyBvciBub3QuIEZvciBub3csXG4gICAgLy8ganVzdCB1c2UgYSBtYXJrZXIgc28gdGhhdCB3ZSBkbyBub3QgcmVhcHBseSBzdGF0aWNzLlxuICAgIGRhdGEuc3RhdGljc0FwcGxpZWQgPSB0cnVlO1xuICB9XG5cbiAgLypcbiAgICogQ2hlY2tzIHRvIHNlZSBpZiBvbmUgb3IgbW9yZSBhdHRyaWJ1dGVzIGhhdmUgY2hhbmdlZCBmb3IgYSBnaXZlbiBFbGVtZW50LlxuICAgKiBXaGVuIG5vIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkLCB0aGlzIGlzIG11Y2ggZmFzdGVyIHRoYW4gY2hlY2tpbmcgZWFjaFxuICAgKiBpbmRpdmlkdWFsIGFyZ3VtZW50LiBXaGVuIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkLCB0aGUgb3ZlcmhlYWQgb2YgdGhpcyBpc1xuICAgKiBtaW5pbWFsLlxuICAgKi9cbiAgdmFyIGF0dHJzQXJyID0gZGF0YS5hdHRyc0FycjtcbiAgdmFyIG5ld0F0dHJzID0gZGF0YS5uZXdBdHRycztcbiAgdmFyIGlzTmV3ID0gIWF0dHJzQXJyLmxlbmd0aDtcbiAgdmFyIGkgPSBBVFRSSUJVVEVTX09GRlNFVDtcbiAgdmFyIGogPSAwO1xuXG4gIGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAyLCBqICs9IDIpIHtcbiAgICB2YXIgX2F0dHIgPSBhcmd1bWVudHNbaV07XG4gICAgaWYgKGlzTmV3KSB7XG4gICAgICBhdHRyc0FycltqXSA9IF9hdHRyO1xuICAgICAgbmV3QXR0cnNbX2F0dHJdID0gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSBpZiAoYXR0cnNBcnJbal0gIT09IF9hdHRyKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgdmFsdWUgPSBhcmd1bWVudHNbaSArIDFdO1xuICAgIGlmIChpc05ldyB8fCBhdHRyc0FycltqICsgMV0gIT09IHZhbHVlKSB7XG4gICAgICBhdHRyc0FycltqICsgMV0gPSB2YWx1ZTtcbiAgICAgIHVwZGF0ZUF0dHJpYnV0ZShub2RlLCBfYXR0ciwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChpIDwgYXJndW1lbnRzLmxlbmd0aCB8fCBqIDwgYXR0cnNBcnIubGVuZ3RoKSB7XG4gICAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDEsIGogKz0gMSkge1xuICAgICAgYXR0cnNBcnJbal0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgaWYgKGogPCBhdHRyc0Fyci5sZW5ndGgpIHtcbiAgICAgIGF0dHJzQXJyLmxlbmd0aCA9IGo7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBBY3R1YWxseSBwZXJmb3JtIHRoZSBhdHRyaWJ1dGUgdXBkYXRlLlxuICAgICAqL1xuICAgIGZvciAoaSA9IDA7IGkgPCBhdHRyc0Fyci5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgdmFyIG5hbWUgPSAvKiogQHR5cGUge3N0cmluZ30gKi9hdHRyc0FycltpXTtcbiAgICAgIHZhciB2YWx1ZSA9IGF0dHJzQXJyW2kgKyAxXTtcbiAgICAgIG5ld0F0dHJzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgX2F0dHIyIGluIG5ld0F0dHJzKSB7XG4gICAgICB1cGRhdGVBdHRyaWJ1dGUobm9kZSwgX2F0dHIyLCBuZXdBdHRyc1tfYXR0cjJdKTtcbiAgICAgIG5ld0F0dHJzW19hdHRyMl0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudC4gVGhpc1xuICogY29ycmVzcG9uZHMgdG8gYW4gb3BlbmluZyB0YWcgYW5kIGEgZWxlbWVudENsb3NlIHRhZyBpcyByZXF1aXJlZC4gVGhpcyBpc1xuICogbGlrZSBlbGVtZW50T3BlbiwgYnV0IHRoZSBhdHRyaWJ1dGVzIGFyZSBkZWZpbmVkIHVzaW5nIHRoZSBhdHRyIGZ1bmN0aW9uXG4gKiByYXRoZXIgdGhhbiBiZWluZyBwYXNzZWQgYXMgYXJndW1lbnRzLiBNdXN0IGJlIGZvbGxsb3dlZCBieSAwIG9yIG1vcmUgY2FsbHNcbiAqIHRvIGF0dHIsIHRoZW4gYSBjYWxsIHRvIGVsZW1lbnRPcGVuRW5kLlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKi9cbnZhciBlbGVtZW50T3BlblN0YXJ0ID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCdlbGVtZW50T3BlblN0YXJ0Jyk7XG4gICAgc2V0SW5BdHRyaWJ1dGVzKHRydWUpO1xuICB9XG5cbiAgYXJnc0J1aWxkZXJbMF0gPSB0YWc7XG4gIGFyZ3NCdWlsZGVyWzFdID0ga2V5O1xuICBhcmdzQnVpbGRlclsyXSA9IHN0YXRpY3M7XG59O1xuXG4vKioqXG4gKiBEZWZpbmVzIGEgdmlydHVhbCBhdHRyaWJ1dGUgYXQgdGhpcyBwb2ludCBvZiB0aGUgRE9NLiBUaGlzIGlzIG9ubHkgdmFsaWRcbiAqIHdoZW4gY2FsbGVkIGJldHdlZW4gZWxlbWVudE9wZW5TdGFydCBhbmQgZWxlbWVudE9wZW5FbmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAqL1xudmFyIGF0dHIgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRJbkF0dHJpYnV0ZXMoJ2F0dHInKTtcbiAgfVxuXG4gIGFyZ3NCdWlsZGVyLnB1c2gobmFtZSk7XG4gIGFyZ3NCdWlsZGVyLnB1c2godmFsdWUpO1xufTtcblxuLyoqXG4gKiBDbG9zZXMgYW4gb3BlbiB0YWcgc3RhcnRlZCB3aXRoIGVsZW1lbnRPcGVuU3RhcnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGVsZW1lbnRPcGVuRW5kID0gZnVuY3Rpb24gKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydEluQXR0cmlidXRlcygnZWxlbWVudE9wZW5FbmQnKTtcbiAgICBzZXRJbkF0dHJpYnV0ZXMoZmFsc2UpO1xuICB9XG5cbiAgdmFyIG5vZGUgPSBlbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmdzQnVpbGRlcik7XG4gIGFyZ3NCdWlsZGVyLmxlbmd0aCA9IDA7XG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBDbG9zZXMgYW4gb3BlbiB2aXJ0dWFsIEVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgZWxlbWVudENsb3NlID0gZnVuY3Rpb24gKHRhZykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygnZWxlbWVudENsb3NlJyk7XG4gIH1cblxuICB2YXIgbm9kZSA9IGNvcmVFbGVtZW50Q2xvc2UoKTtcblxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydENsb3NlTWF0Y2hlc09wZW5UYWcoZ2V0RGF0YShub2RlKS5ub2RlTmFtZSwgdGFnKTtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBEZWNsYXJlcyBhIHZpcnR1YWwgRWxlbWVudCBhdCB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgZG9jdW1lbnQgdGhhdCBoYXNcbiAqIG5vIGNoaWxkcmVuLlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKiBAcGFyYW0gey4uLip9IHZhcl9hcmdzIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAqICAgICBmb3IgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGVsZW1lbnRWb2lkID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCB2YXJfYXJncykge1xuICBlbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICByZXR1cm4gZWxlbWVudENsb3NlKHRhZyk7XG59O1xuXG4vKipcbiAqIERlY2xhcmVzIGEgdmlydHVhbCBUZXh0IGF0IHRoaXMgcG9pbnQgaW4gdGhlIGRvY3VtZW50LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcnxib29sZWFufSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIFRleHQuXG4gKiBAcGFyYW0gey4uLihmdW5jdGlvbigoc3RyaW5nfG51bWJlcnxib29sZWFuKSk6c3RyaW5nKX0gdmFyX2FyZ3NcbiAqICAgICBGdW5jdGlvbnMgdG8gZm9ybWF0IHRoZSB2YWx1ZSB3aGljaCBhcmUgY2FsbGVkIG9ubHkgd2hlbiB0aGUgdmFsdWUgaGFzXG4gKiAgICAgY2hhbmdlZC5cbiAqIEByZXR1cm4geyFUZXh0fSBUaGUgY29ycmVzcG9uZGluZyB0ZXh0IG5vZGUuXG4gKi9cbnZhciB0ZXh0ID0gZnVuY3Rpb24gKHZhbHVlLCB2YXJfYXJncykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygndGV4dCcpO1xuICAgIGFzc2VydE5vdEluU2tpcCgndGV4dCcpO1xuICB9XG5cbiAgdmFyIG5vZGUgPSBjb3JlVGV4dCgpO1xuICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG5cbiAgaWYgKGRhdGEudGV4dCAhPT0gdmFsdWUpIHtcbiAgICBkYXRhLnRleHQgPSAvKiogQHR5cGUge3N0cmluZ30gKi92YWx1ZTtcblxuICAgIHZhciBmb3JtYXR0ZWQgPSB2YWx1ZTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgLypcbiAgICAgICAqIENhbGwgdGhlIGZvcm1hdHRlciBmdW5jdGlvbiBkaXJlY3RseSB0byBwcmV2ZW50IGxlYWtpbmcgYXJndW1lbnRzLlxuICAgICAgICogaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZS9pbmNyZW1lbnRhbC1kb20vcHVsbC8yMDQjaXNzdWVjb21tZW50LTE3ODIyMzU3NFxuICAgICAgICovXG4gICAgICB2YXIgZm4gPSBhcmd1bWVudHNbaV07XG4gICAgICBmb3JtYXR0ZWQgPSBmbihmb3JtYXR0ZWQpO1xuICAgIH1cblxuICAgIG5vZGUuZGF0YSA9IGZvcm1hdHRlZDtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufTtcblxuZXhwb3J0cy5wYXRjaCA9IHBhdGNoSW5uZXI7XG5leHBvcnRzLnBhdGNoSW5uZXIgPSBwYXRjaElubmVyO1xuZXhwb3J0cy5wYXRjaE91dGVyID0gcGF0Y2hPdXRlcjtcbmV4cG9ydHMuY3VycmVudEVsZW1lbnQgPSBjdXJyZW50RWxlbWVudDtcbmV4cG9ydHMuY3VycmVudFBvaW50ZXIgPSBjdXJyZW50UG9pbnRlcjtcbmV4cG9ydHMuc2tpcCA9IHNraXA7XG5leHBvcnRzLnNraXBOb2RlID0gc2tpcE5vZGU7XG5leHBvcnRzLmVsZW1lbnRWb2lkID0gZWxlbWVudFZvaWQ7XG5leHBvcnRzLmVsZW1lbnRPcGVuU3RhcnQgPSBlbGVtZW50T3BlblN0YXJ0O1xuZXhwb3J0cy5lbGVtZW50T3BlbkVuZCA9IGVsZW1lbnRPcGVuRW5kO1xuZXhwb3J0cy5lbGVtZW50T3BlbiA9IGVsZW1lbnRPcGVuO1xuZXhwb3J0cy5lbGVtZW50Q2xvc2UgPSBlbGVtZW50Q2xvc2U7XG5leHBvcnRzLnRleHQgPSB0ZXh0O1xuZXhwb3J0cy5hdHRyID0gYXR0cjtcbmV4cG9ydHMuc3ltYm9scyA9IHN5bWJvbHM7XG5leHBvcnRzLmF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzO1xuZXhwb3J0cy5hcHBseUF0dHIgPSBhcHBseUF0dHI7XG5leHBvcnRzLmFwcGx5UHJvcCA9IGFwcGx5UHJvcDtcbmV4cG9ydHMubm90aWZpY2F0aW9ucyA9IG5vdGlmaWNhdGlvbnM7XG5leHBvcnRzLmltcG9ydE5vZGUgPSBpbXBvcnROb2RlO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmNyZW1lbnRhbC1kb20tY2pzLmpzLm1hcCIsInJlcXVpcmUoJ2RvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQnKVxucmVxdWlyZSgnLi90b2RvcycpXG4iLCJjb25zdCBGcmVlemVyID0gcmVxdWlyZSgnZnJlZXplci1qcycpXG5jb25zdCBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpXG5jb25zdCBwYXRjaCA9IHJlcXVpcmUoJy4uLy4uL2NsaWVudC9wYXRjaCcpXG5cbi8vIFRPRE86IFNLSVAgYW5kIEVYVEVORCBIVE1MXG5cbkluY3JlbWVudGFsRE9NLmF0dHJpYnV0ZXMuY2hlY2tlZCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgZWwuY2hlY2tlZCA9ICEhdmFsdWVcbn1cblxuSW5jcmVtZW50YWxET00uYXR0cmlidXRlcy52YWx1ZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgZWwudmFsdWUgPSB2YWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgKHZhbHVlKSA9PT0gJ3VuZGVmaW5lZCcgPyAnJyA6IHZhbHVlXG59XG5cbmNvbnN0IFN5bWJvbHMgPSB7XG4gIFZJRVc6IFN5bWJvbCgndmlldycpLFxuICBTVEFURTogU3ltYm9sKCdzdGF0ZScpXG59XG5cbmNvbnN0IHN1cGVydmlld3MgPSAoQmFzZSwgdmlldykgPT4gY2xhc3MgZXh0ZW5kcyBCYXNlIHtcbiAgY29uc3RydWN0b3IgKGluaXRpYWxTdGF0ZSA9IHt9KSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXNbU3ltYm9scy5WSUVXXSA9IHZpZXdcblxuICAgIGxldCBzdGF0ZSA9IG5ldyBGcmVlemVyKGluaXRpYWxTdGF0ZSlcbiAgICB0aGlzW1N5bWJvbHMuU1RBVEVdID0gc3RhdGVcblxuICAgIHN0YXRlLm9uKCd1cGRhdGUnLCBmdW5jdGlvbiAoY3VycmVudFN0YXRlLCBwcmV2U3RhdGUpIHtcbiAgICAgIHRoaXMucmVuZGVyKClcbiAgICB9LmJpbmQodGhpcykpXG4gIH1cblxuICAvLyBzID0gKCkgPT4ge1xuICAvLyAgIHJldHVybiAnJ1xuICAvLyB9XG5cbiAgZ2V0IHN0YXRlICgpIHtcbiAgICByZXR1cm4gdGhpc1tTeW1ib2xzLlNUQVRFXS5nZXQoKVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBsZXQgdmlldyA9IHRoaXNbU3ltYm9scy5WSUVXXVxuXG4gICAgcGF0Y2godGhpcywgZnVuY3Rpb24gKCkge1xuICAgICAgdmlldy5jYWxsKHRoaXMsIHRoaXMuc3RhdGUsIHRoaXMpXG4gICAgfS5iaW5kKHRoaXMpKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3VwZXJ2aWV3c1xuIiwidmFyIEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJylcbnZhciBwYXRjaCA9IEluY3JlbWVudGFsRE9NLnBhdGNoXG52YXIgZWxlbWVudE9wZW4gPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50T3BlblxudmFyIGVsZW1lbnRDbG9zZSA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRDbG9zZVxudmFyIHNraXAgPSBJbmNyZW1lbnRhbERPTS5za2lwXG52YXIgY3VycmVudEVsZW1lbnQgPSBJbmNyZW1lbnRhbERPTS5jdXJyZW50RWxlbWVudFxudmFyIHRleHQgPSBJbmNyZW1lbnRhbERPTS50ZXh0XG5cbnZhciBob2lzdGVkMSA9IFtcInR5cGVcIiwgXCJ0ZXh0XCJdXG52YXIgaG9pc3RlZDIgPSBbXCJ0eXBlXCIsIFwiY2hlY2tib3hcIl1cbnZhciBfX3RhcmdldFxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlc2NyaXB0aW9uIChzdGF0ZSwgZWwpIHtcbmVsZW1lbnRPcGVuKFwiaW5wdXRcIiwgXCJlMWU4NGEyYi0wNjU4LTQyMjktOWYyMy04OWEwZGU3MGVhNmRcIiwgaG9pc3RlZDEsIFwidmFsdWVcIiwgc3RhdGUudG9kby50ZXh0LCBcIm9uY2hhbmdlXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgdmFyICRlbGVtZW50ID0gdGhpcztcbnN0YXRlLnRvZG8uc2V0KCd0ZXh0JywgdGhpcy52YWx1ZSl9KVxuZWxlbWVudENsb3NlKFwiaW5wdXRcIilcbmVsZW1lbnRPcGVuKFwiaW5wdXRcIiwgXCIxN2JkMGQxZC0zMzVhLTQxOGYtOWM1My02MzFiMjAwNzFlZGJcIiwgaG9pc3RlZDIsIFwiY2hlY2tlZFwiLCBzdGF0ZS50b2RvLmlzQ29tcGxldGVkLCBcIm9uY2hhbmdlXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgdmFyICRlbGVtZW50ID0gdGhpcztcbnN0YXRlLnRvZG8uc2V0KCdpc0NvbXBsZXRlZCcsIHRoaXMuY2hlY2tlZCl9KVxuZWxlbWVudENsb3NlKFwiaW5wdXRcIilcbmVsZW1lbnRPcGVuKFwic3BhblwiKVxuICB0ZXh0KFwiXCIgKyAoc3RhdGUudG9kby50ZXh0KSArIFwiXCIpXG5lbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG59XG4iLCJjb25zdCB2aWV3ID0gcmVxdWlyZSgnLi90b2RvLmh0bWwnKVxuY29uc3Qgc3VwZXJ2aWV3cyA9IHJlcXVpcmUoJy4vc3VwZXJ2aWV3cycpXG5cbmNsYXNzIFRvZG8gZXh0ZW5kcyBzdXBlcnZpZXdzKHdpbmRvdy5IVE1MTElFbGVtZW50LCB2aWV3KSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpXG4gICAgY29uc29sZS5sb2coJ2N0b3InKVxuICB9XG4gIGdldCB0b2RvICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS50b2Rvc1xuICB9XG5cbiAgc2V0IHRvZG8gKHZhbHVlKSB7XG4gICAgdGhpcy5zdGF0ZS5zZXQoJ3RvZG8nLCB2YWx1ZSlcbiAgfVxufVxuXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCd4LXRvZG8nLCBUb2RvLCB7IGV4dGVuZHM6ICdsaScgfSlcbiIsInZhciBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpXG52YXIgcGF0Y2ggPSBJbmNyZW1lbnRhbERPTS5wYXRjaFxudmFyIGVsZW1lbnRPcGVuID0gSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5cbnZhciBlbGVtZW50Q2xvc2UgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Q2xvc2VcbnZhciBza2lwID0gSW5jcmVtZW50YWxET00uc2tpcFxudmFyIGN1cnJlbnRFbGVtZW50ID0gSW5jcmVtZW50YWxET00uY3VycmVudEVsZW1lbnRcbnZhciB0ZXh0ID0gSW5jcmVtZW50YWxET00udGV4dFxuXG52YXIgaG9pc3RlZDEgPSBbXCJhc1wiLCBcIngtdG9kb1wiXVxudmFyIGhvaXN0ZWQyID0gW1widHlwZVwiLCBcInRleHRcIl1cbnZhciBfX3RhcmdldFxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlc2NyaXB0aW9uIChzdGF0ZSwgZWwpIHtcbmxldCB0b2RvcyA9IHN0YXRlLnRvZG9zXG5pZiAoQXJyYXkuaXNBcnJheSh0b2RvcykgJiYgdG9kb3MubGVuZ3RoKSB7XG4gIGxldCBjb21wbGV0ZWQgPSB0aGlzLmNvbXBsZXRlZFxuICBlbGVtZW50T3BlbihcInNlY3Rpb25cIilcbiAgICBlbGVtZW50T3BlbihcInVsXCIpXG4gICAgICBfX3RhcmdldCA9IHRvZG9zXG4gICAgICBpZiAoX190YXJnZXQpIHtcbiAgICAgICAgOyhfX3RhcmdldC5mb3JFYWNoID8gX190YXJnZXQgOiBPYmplY3Qua2V5cyhfX3RhcmdldCkpLmZvckVhY2goZnVuY3Rpb24oJHZhbHVlLCAkaXRlbSwgJHRhcmdldCkge1xuICAgICAgICAgIHZhciB0b2RvID0gJHZhbHVlXG4gICAgICAgICAgdmFyICRrZXkgPSBcIjgzMjdlZmFhLTQ4NmEtNDg4MC1iOGM0LTZmYzQyZmJiNDc2Yl9cIiArIHRvZG8uaWRcbiAgICAgICAgICBlbGVtZW50T3BlbihcImxpXCIsICRrZXksIGhvaXN0ZWQxLCBcInRvZG9cIiwgdG9kbylcbiAgICAgICAgICAgIGlmICh0cnVlKSB7XG4gICAgICAgICAgICAgIHNraXAoKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJsaVwiKVxuICAgICAgICB9LCB0aGlzKVxuICAgICAgfVxuICAgIGVsZW1lbnRDbG9zZShcInVsXCIpXG4gICAgZWxlbWVudE9wZW4oXCJmb290ZXJcIilcbiAgICAgIGVsZW1lbnRPcGVuKFwiZGxcIilcbiAgICAgICAgZWxlbWVudE9wZW4oXCJkdFwiKVxuICAgICAgICAgIHRleHQoXCJUb3RhbFwiKVxuICAgICAgICBlbGVtZW50Q2xvc2UoXCJkdFwiKVxuICAgICAgICBlbGVtZW50T3BlbihcImRkXCIpXG4gICAgICAgICAgdGV4dChcIlwiICsgKHRvZG9zLmxlbmd0aCkgKyBcIlwiKVxuICAgICAgICBlbGVtZW50Q2xvc2UoXCJkZFwiKVxuICAgICAgICBlbGVtZW50T3BlbihcImR0XCIpXG4gICAgICAgICAgdGV4dChcIlRvdGFsIGNvbXBsZXRlZFwiKVxuICAgICAgICBlbGVtZW50Q2xvc2UoXCJkdFwiKVxuICAgICAgICBlbGVtZW50T3BlbihcImRkXCIpXG4gICAgICAgICAgdGV4dChcIlwiICsgKERhdGUubm93KCkpICsgXCJcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwiZGRcIilcbiAgICAgIGVsZW1lbnRDbG9zZShcImRsXCIpXG4gICAgICBlbGVtZW50T3BlbihcImJ1dHRvblwiLCBudWxsLCBudWxsLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgdG9kb3NbMF0uc2V0KCdpc0NvbXBsZXRlZCcsICF0b2Rvc1swXS5pc0NvbXBsZXRlZCl9KVxuICAgICAgICB0ZXh0KFwiWFhcIilcbiAgICAgIGVsZW1lbnRDbG9zZShcImJ1dHRvblwiKVxuICAgICAgZWxlbWVudE9wZW4oXCJidXR0b25cIiwgbnVsbCwgbnVsbCwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgIHRvZG9zWzBdLnNldCgndGV4dCcsICdlZ2cnKX0pXG4gICAgICAgIHRleHQoXCJZWVwiKVxuICAgICAgZWxlbWVudENsb3NlKFwiYnV0dG9uXCIpXG4gICAgICBlbGVtZW50T3BlbihcImJ1dHRvblwiLCBudWxsLCBudWxsLCBcImRpc2FibGVkXCIsIGNvbXBsZXRlZC5sZW5ndGggPyB1bmRlZmluZWQgOiAnZGlzYWJsZWQnLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgZWwuY2xlYXIoKX0pXG4gICAgICAgIHRleHQoXCJDbGVhciBjb21wbGV0ZWRcIilcbiAgICAgIGVsZW1lbnRDbG9zZShcImJ1dHRvblwiKVxuICAgIGVsZW1lbnRDbG9zZShcImZvb3RlclwiKVxuICBlbGVtZW50Q2xvc2UoXCJzZWN0aW9uXCIpXG59IGVsc2Uge1xuICB0ZXh0KFwiIFxcXG4gICAgTm8gVG9kb3MgRm91bmQgXFxcbiAgXCIpXG59XG5lbGVtZW50T3BlbihcImZvcm1cIiwgbnVsbCwgbnVsbCwgXCJvbnN1Ym1pdFwiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gIHZhciAkZWxlbWVudCA9IHRoaXM7XG5lbC5hZGRUb2RvKCRldmVudCl9KVxuICBlbGVtZW50T3BlbihcImlucHV0XCIsIFwiNzk2ZGNmMzYtZTBmYy00ZDAwLWJhY2YtMDBkZGIwZWY0MzEyXCIsIGhvaXN0ZWQyLCBcInZhbHVlXCIsIHN0YXRlLm5ld1RvZG9UZXh0LCBcIm9ua2V5dXBcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gIHN0YXRlLnNldCgnbmV3VG9kb1RleHQnLCB0aGlzLnZhbHVlLnRyaW0oKSl9KVxuICBlbGVtZW50Q2xvc2UoXCJpbnB1dFwiKVxuICBlbGVtZW50T3BlbihcImJ1dHRvblwiLCBudWxsLCBudWxsLCBcImRpc2FibGVkXCIsIHN0YXRlLm5ld1RvZG9UZXh0ID8gdW5kZWZpbmVkIDogJ2Rpc2FibGVkJylcbiAgICB0ZXh0KFwiQWRkIFRvZG9cIilcbiAgZWxlbWVudENsb3NlKFwiYnV0dG9uXCIpXG5lbGVtZW50Q2xvc2UoXCJmb3JtXCIpXG59XG4iLCJjb25zdCBzdXBlcnZpZXdzID0gcmVxdWlyZSgnLi9zdXBlcnZpZXdzJylcbmNvbnN0IHZpZXcgPSByZXF1aXJlKCcuL3RvZG9zLmh0bWwnKVxuXG5yZXF1aXJlKCcuL3RvZG8nKVxuXG5jbGFzcyBUb2RvcyBleHRlbmRzIHN1cGVydmlld3Mod2luZG93LkhUTUxFbGVtZW50LCB2aWV3KSB7XG4gIC8vIENhbGxlZCB3aGVuIHRoZSBlbGVtZW50IGlzIGNyZWF0ZWQgb3IgdXBncmFkZWRcbiAgLy8gY29uc3RydWN0b3IgKCkge31cblxuICAvLyBDYWxsZWQgd2hlbiB0aGUgZWxlbWVudCBpcyBpbnNlcnRlZCBpbnRvIGEgZG9jdW1lbnQsIGluY2x1ZGluZyBpbnRvIGEgc2hhZG93IHRyZWVcbiAgY29ubmVjdGVkQ2FsbGJhY2sgKCkge31cblxuICAvLyBDYWxsZWQgd2hlbiB0aGUgZWxlbWVudCBpcyByZW1vdmVkIGZyb20gYSBkb2N1bWVudFxuICBkaXNjb25uZWN0ZWRDYWxsYmFjayAoKSB7fVxuXG4gIC8vIENhbGxlZCB3aGVuIGFuIGF0dHJpYnV0ZSBpcyBjaGFuZ2VkLCBhcHBlbmRlZCwgcmVtb3ZlZCwgb3IgcmVwbGFjZWQgb24gdGhlIGVsZW1lbnQuIE9ubHkgY2FsbGVkIGZvciBvYnNlcnZlZCBhdHRyaWJ1dGVzLlxuICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sgKGF0dHJpYnV0ZU5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSwgbmFtZXNwYWNlKSB7XG4gICAgY29uc29sZS5sb2coYXR0cmlidXRlTmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlLCBuYW1lc3BhY2UpXG4gIH1cblxuICAvLyBDYWxsZWQgd2hlbiB0aGUgZWxlbWVudCBpcyBhZG9wdGVkIGludG8gYSBuZXcgZG9jdW1lbnRcbiAgYWRvcHRlZENhbGxiYWNrIChvbGREb2N1bWVudCwgbmV3RG9jdW1lbnQpIHt9XG5cbiAgLy8gTW9uaXRvciB0aGUgJ25hbWUnIGF0dHJpYnV0ZSBmb3IgY2hhbmdlcy5cbiAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMgKCkge1xuICAgIHJldHVybiBbJ25hbWUnXVxuICB9XG5cbiAgZ2V0IHRvZG9zICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS50b2Rvc1xuICB9XG5cbiAgc2V0IHRvZG9zICh2YWx1ZSkge1xuICAgIHRoaXMuc3RhdGUuc2V0KCd0b2RvcycsIHZhbHVlKVxuICB9XG5cbiAgZ2V0IGNvbXBsZXRlZCAoKSB7XG4gICAgcmV0dXJuIHRoaXMudG9kb3MuZmlsdGVyKHQgPT4gdC5pc0NvbXBsZXRlZClcbiAgfVxuXG4gIGFkZFRvZG8gKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBsZXQgdGV4dCA9IHRoaXMuc3RhdGUubmV3VG9kb1RleHRcblxuICAgIHRoaXMudG9kb3MucHVzaCh7XG4gICAgICBpZDogRGF0ZS5ub3coKSxcbiAgICAgIHRleHQ6IHRleHRcbiAgICB9KVxuICAgIHRoaXMuc3RhdGUuc2V0KCduZXdUb2RvVGV4dCcsICcnKVxuICB9XG5cbiAgY2xlYXIgKCkge1xuICAgIHRoaXMudG9kb3MgPSB0aGlzLnRvZG9zLmZpbHRlcihpdGVtID0+ICFpdGVtLmlzQ29tcGxldGVkKVxuICB9XG59XG5cbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ3gtdG9kb3MnLCBUb2RvcylcblxuIl19
