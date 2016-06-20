(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
// var currentElement = IncrementalDOM.currentElement
var slice = Array.prototype.slice

module.exports = function (el, view, data) {
  var args = slice.call(arguments)
  // if (currentElement()) {
  //   view.apply(this, args.slice(2))
  // } else {
  if (args.length <= 3) {
    patch(el, view, data)
  } else {
    patch(el, function () {
      view.apply(this, args.slice(2))
    })
  }
  // }
}

},{"incremental-dom":5}],2:[function(require,module,exports){
var xtag = require('x-tag')
var patch = require('../../client/patch')
var view = require('./view.html')
var sub = require('./sub.html')

xtag.register('x-sub', {
  lifecycle: {
    created: function () {
      this.data = {}
      // this.patch()
    },
    attributeChanged: function (attrName, oldValue, newValue) {
      // window.alert('I fire when an ATTRIBUTE is CHANGED on an <x-clock>')
    }
  },
  accessors: {
    name: {
      attribute: {},
      get: function () {
        return this.data.name
      },
      set: function (value) {
        this.data.name = value
        this.patch()
      }
    }
  },
  methods: {
    patch: function () {
      patch(this, sub.bind(this), this.data)
    },
    onChange: function (e) {
      this.data.name = e.target.value
      this.patch()
      // if (this.xtag.interval) this.stop()
      // else this.start()
    }
  },
  events: {
    change: function () {
      this.patch()
      // if (this.xtag.interval) this.stop()
      // else this.start()
    }
  }
})

xtag.register('x-view', {
  lifecycle: {
    created: function () {
      this.data = {
        list: [{
          name: 'My name 1'
        }, {
          name: 'My name 2'
        }, {
          name: 'My name 3'
        }]
      }
      // this.patch()
    },
    attributeChanged: function (attrName, oldValue, newValue) {
      // window.alert('I fire when an ATTRIBUTE is CHANGED on an <x-clock>')
    }
  },
  accessors: {
    name: {
      attribute: {},
      get: function () {
        return this.data.name
      },
      set: function (value) {
        this.data.name = value
        this.patch()
      }
    }
  },
  methods: {
    patch: function () {
      patch(this, view, this.data)
    }
  },
  events: {
    click: function () {
      // if (this.xtag.interval) this.stop()
      // else this.start()
    }
  }
})


},{"../../client/patch":1,"./sub.html":3,"./view.html":4,"x-tag":6}],3:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementClose = IncrementalDOM.elementClose
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var text = IncrementalDOM.text

var hoisted1 = ["type", "text"]
var __target

module.exports = function description (data) {
elementOpen("input", "ae26df4f-15b9-4e5c-b8ce-b890596800cc", hoisted1, "value", data.name, "onkeyup", this.onChange.bind(this))
elementClose("input")
elementOpen("span")
  text("" + (data.name) + "")
elementClose("span")
}

},{"incremental-dom":5}],4:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementClose = IncrementalDOM.elementClose
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var text = IncrementalDOM.text

var hoisted1 = ["type", "text"]
var hoisted2 = ["name", "wed"]
var hoisted3 = ["href", "#"]
var __target

module.exports = function description (data) {
elementOpen("form")
  elementOpen("input", "f7635c1e-2e00-4cfc-a957-e05b25455732", hoisted1, "value", data.name)
  elementClose("input")
  elementOpen("span")
    text("" + (data.name) + "")
  elementClose("span")
  elementOpen("x-sub", "edd5f4d4-55cb-4071-a384-e2d902e6ec71", hoisted2)
    if (true) {
      skip()
    } else {
    }
  elementClose("x-sub")
  elementOpen("a", "ea119331-7b6b-4de5-9507-36c222a7ad99", hoisted3)
    text("Google")
  elementClose("a")
  __target = data.list
  if (__target) {
    ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
      var item = $value
      var $key = "54078af6-9a26-4ad9-ae45-a9ff08e3b234_" + $item
      elementOpen("x-sub", $key, null, "name", item.name)
        if (true) {
          skip()
        } else {
        }
      elementClose("x-sub")
    }, this)
  }
elementClose("form")
}

},{"incremental-dom":5}],5:[function(require,module,exports){

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
 * A cached reference to the create function.
 */
var create = Object.create;

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
  return create(null);
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
   * The key used to identify this node, used to preserve DOM nodes when they
   * move within their parent.
   * @const
   */
  this.key = key;

  /**
   * Keeps track of children within this node by their key.
   * {?Object<string, !Element>}
   */
  this.keyMap = null;

  /**
   * Whether or not the keyMap is currently valid.
   * {boolean}
   */
  this.keyMapValid = true;

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
 * @param {Node} node The node to retrieve the data for.
 * @return {!NodeData} The NodeData for this Node.
 */
var getData = function (node) {
  var data = node['__incrementalDOMData'];

  if (!data) {
    var nodeName = node.nodeName.toLowerCase();
    var key = null;

    if (node instanceof Element) {
      key = node.getAttribute('key');
    }

    data = initData(node, nodeName, key);
  }

  return data;
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
var symbols = {
  default: '__default',

  placeholder: '__placeholder'
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
        elStyle[prop] = obj[prop];
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

attributes[symbols.placeholder] = function () {};

attributes['style'] = applyStyle;

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
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element.
 * @return {!Element}
 */
var createElement = function (doc, parent, tag, key, statics) {
  var namespace = getNamespaceForTag(tag, parent);
  var el = undefined;

  if (namespace) {
    el = doc.createElementNS(namespace, tag);
  } else {
    el = doc.createElement(tag);
  }

  initData(el, tag, key);

  if (statics) {
    for (var i = 0; i < statics.length; i += 2) {
      updateAttribute(el, /** @type {!string}*/statics[i], statics[i + 1]);
    }
  }

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
 * Creates a mapping that can be used to look up children using a key.
 * @param {?Node} el
 * @return {!Object<string, !Element>} A mapping of keys to the children of the
 *     Element.
 */
var createKeyMap = function (el) {
  var map = createMap();
  var child = el.firstElementChild;

  while (child) {
    var key = getData(child).key;

    if (key) {
      map[key] = child;
    }

    child = child.nextElementSibling;
  }

  return map;
};

/**
 * Retrieves the mapping of key to child node for a given Element, creating it
 * if necessary.
 * @param {?Node} el
 * @return {!Object<string, !Node>} A mapping of keys to child Elements
 */
var getKeyMap = function (el) {
  var data = getData(el);

  if (!data.keyMap) {
    data.keyMap = createKeyMap(el);
  }

  return data.keyMap;
};

/**
 * Retrieves a child from the parent with the given key.
 * @param {?Node} parent
 * @param {?string=} key
 * @return {?Node} The child corresponding to the key.
 */
var getChild = function (parent, key) {
  return key ? getKeyMap(parent)[key] : null;
};

/**
 * Registers an element as being a child. The parent will keep track of the
 * child using the key. The child can be retrieved using the same key using
 * getKeyMap. The provided key should be unique within the parent Element.
 * @param {?Node} parent The parent of child.
 * @param {string} key A key to identify the child with.
 * @param {!Node} child The child to register.
 */
var registerChild = function (parent, key, child) {
  getKeyMap(parent)[key] = child;
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
* Makes sure that keyed Element matches the tag name provided.
* @param {!string} nodeName The nodeName of the node that is being matched.
* @param {string=} tag The tag name of the Element.
* @param {?string=} key The key of the Element.
*/
var assertKeyedTagMatches = function (nodeName, tag, key) {
  if (nodeName !== tag) {
    throw new Error('Was expecting node with key "' + key + '" to be a ' + tag + ', not a ' + nodeName + '.');
  }
};

/** @type {?Context} */
var context = null;

/** @type {?Node} */
var currentNode = null;

/** @type {?Node} */
var currentParent = null;

/** @type {?Element|?DocumentFragment} */
var root = null;

/** @type {?Document} */
var doc = null;

/**
 * Returns a patcher function that sets up and restores a patch context,
 * running the run function with the provided data.
 * @param {function((!Element|!DocumentFragment),!function(T),T=)} run
 * @return {function((!Element|!DocumentFragment),!function(T),T=)}
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
   * @template T
   */
  var f = function (node, fn, data) {
    var prevContext = context;
    var prevRoot = root;
    var prevDoc = doc;
    var prevCurrentNode = currentNode;
    var prevCurrentParent = currentParent;
    var previousInAttributes = false;
    var previousInSkip = false;

    context = new Context();
    root = node;
    doc = node.ownerDocument;
    currentParent = node.parentNode;

    if ('production' !== 'production') {}

    run(node, fn, data);

    if ('production' !== 'production') {}

    context.notifyChanges();

    context = prevContext;
    root = prevRoot;
    doc = prevDoc;
    currentNode = prevCurrentNode;
    currentParent = prevCurrentParent;
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
 * @template T
 */
var patchInner = patchFactory(function (node, fn, data) {
  currentNode = node;

  enterNode();
  fn(data);
  exitNode();

  if ('production' !== 'production') {}
});

/**
 * Patches an Element with the the provided function. Exactly one top level
 * element call should be made corresponding to `node`.
 * @param {!Element} node The Element where the patch should start.
 * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
 *     calls that describe the DOM. This should have at most one top level
 *     element call.
 * @param {T=} data An argument passed to fn to represent DOM state.
 * @template T
 */
var patchOuter = patchFactory(function (node, fn, data) {
  currentNode = /** @type {!Element} */{ nextSibling: node };

  fn(data);

  if ('production' !== 'production') {}
});

/**
 * Checks whether or not the current node matches the specified nodeName and
 * key.
 *
 * @param {?string} nodeName The nodeName for this node.
 * @param {?string=} key An optional key that identifies a node.
 * @return {boolean} True if the node matches, false otherwise.
 */
var matches = function (nodeName, key) {
  var data = getData(currentNode);

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
 * @param {?Array<*>=} statics For an Element, this should be an array of
 *     name-value pairs.
 */
var alignWithDOM = function (nodeName, key, statics) {
  if (currentNode && matches(nodeName, key)) {
    return;
  }

  var node = undefined;

  // Check to see if the node has moved within the parent.
  if (key) {
    node = getChild(currentParent, key);
    if (node && 'production' !== 'production') {
      assertKeyedTagMatches(getData(node).nodeName, nodeName, key);
    }
  }

  // Create the node if it doesn't exist.
  if (!node) {
    if (nodeName === '#text') {
      node = createText(doc);
    } else {
      node = createElement(doc, currentParent, nodeName, key, statics);
    }

    if (key) {
      registerChild(currentParent, key, node);
    }

    context.markCreated(node);
  }

  // If the node has a key, remove it from the DOM to prevent a large number
  // of re-orders in the case that it moved far or was completely removed.
  // Since we hold on to a reference through the keyMap, we can always add it
  // back.
  if (currentNode && getData(currentNode).key) {
    currentParent.replaceChild(node, currentNode);
    getData(currentParent).keyMapValid = false;
  } else {
    currentParent.insertBefore(node, currentNode);
  }

  currentNode = node;
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

  if (data.attrs[symbols.placeholder] && node !== root) {
    if ('production' !== 'production') {}
    return;
  }

  while (child !== currentNode) {
    node.removeChild(child);
    context.markDeleted( /** @type {!Node}*/child);

    key = getData(child).key;
    if (key) {
      delete keyMap[key];
    }
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
 * Changes to the next sibling of the current node.
 */
var nextNode = function () {
  if (currentNode) {
    currentNode = currentNode.nextSibling;
  } else {
    currentNode = currentParent.firstChild;
  }
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
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @return {!Element} The corresponding Element.
 */
var coreElementOpen = function (tag, key, statics) {
  nextNode();
  alignWithDOM(tag, key, statics);
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
  if ('production' !== 'production') {}

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
  alignWithDOM('#text', null, null);
  return (/** @type {!Text} */currentNode
  );
};

/**
 * Gets the current Element being patched.
 * @return {!Element}
 */
var currentElement = function () {
  if ('production' !== 'production') {}
  return (/** @type {!Element} */currentParent
  );
};

/**
 * Skips the children in a subtree, allowing an Element to be closed without
 * clearing out the children.
 */
var skip = function () {
  if ('production' !== 'production') {}
  currentNode = currentParent.lastChild;
};

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
 * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
var elementOpen = function (tag, key, statics, const_args) {
  if ('production' !== 'production') {}

  var node = coreElementOpen(tag, key, statics);
  var data = getData(node);

  /*
   * Checks to see if one or more attributes have changed for a given Element.
   * When no attributes have changed, this is much faster than checking each
   * individual argument. When attributes have changed, the overhead of this is
   * minimal.
   */
  var attrsArr = data.attrsArr;
  var newAttrs = data.newAttrs;
  var attrsChanged = false;
  var i = ATTRIBUTES_OFFSET;
  var j = 0;

  for (; i < arguments.length; i += 1, j += 1) {
    if (attrsArr[j] !== arguments[i]) {
      attrsChanged = true;
      break;
    }
  }

  for (; i < arguments.length; i += 1, j += 1) {
    attrsArr[j] = arguments[i];
  }

  if (j < attrsArr.length) {
    attrsChanged = true;
    attrsArr.length = j;
  }

  /*
   * Actually perform the attribute update.
   */
  if (attrsChanged) {
    for (i = ATTRIBUTES_OFFSET; i < arguments.length; i += 2) {
      newAttrs[arguments[i]] = arguments[i + 1];
    }

    for (var _attr in newAttrs) {
      updateAttribute(node, _attr, newAttrs[_attr]);
      newAttrs[_attr] = undefined;
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
  if ('production' !== 'production') {}

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
  if ('production' !== 'production') {}

  argsBuilder.push(name, value);
};

/**
 * Closes an open tag started with elementOpenStart.
 * @return {!Element} The corresponding Element.
 */
var elementOpenEnd = function () {
  if ('production' !== 'production') {}

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
  if ('production' !== 'production') {}

  var node = coreElementClose();

  if ('production' !== 'production') {}

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
 * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
var elementVoid = function (tag, key, statics, const_args) {
  elementOpen.apply(null, arguments);
  return elementClose(tag);
};

/**
 * Declares a virtual Element at the current location in the document that is a
 * placeholder element. Children of this Element can be manually managed and
 * will not be cleared by the library.
 *
 * A key must be specified to make sure that this node is correctly preserved
 * across all conditionals.
 *
 * @param {string} tag The element's tag.
 * @param {string} key The key used to identify this element.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
var elementPlaceholder = function (tag, key, statics, const_args) {
  if ('production' !== 'production') {}

  elementOpen.apply(null, arguments);
  skip();
  return elementClose(tag);
};

/**
 * Declares a virtual Text at this point in the document.
 *
 * @param {string|number|boolean} value The value of the Text.
 * @param {...(function((string|number|boolean)):string)} const_args
 *     Functions to format the value which are called only when the value has
 *     changed.
 * @return {!Text} The corresponding text node.
 */
var text = function (value, const_args) {
  if ('production' !== 'production') {}

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
exports.skip = skip;
exports.elementVoid = elementVoid;
exports.elementOpenStart = elementOpenStart;
exports.elementOpenEnd = elementOpenEnd;
exports.elementOpen = elementOpen;
exports.elementClose = elementClose;
exports.elementPlaceholder = elementPlaceholder;
exports.text = text;
exports.attr = attr;
exports.symbols = symbols;
exports.attributes = attributes;
exports.applyAttr = applyAttr;
exports.applyProp = applyProp;
exports.notifications = notifications;


},{}],6:[function(require,module,exports){
(function () {

/*** Variables ***/

  var win = window,
    doc = document,
    attrProto = {
      setAttribute: Element.prototype.setAttribute,
      removeAttribute: Element.prototype.removeAttribute
    },
    hasShadow = Element.prototype.createShadowRoot,
    container = doc.createElement('div'),
    noop = function(){},
    trueop = function(){ return true; },
    regexReplaceCommas = /,/g,
    regexCamelToDash = /([a-z])([A-Z])/g,
    regexPseudoParens = /\(|\)/g,
    regexPseudoCapture = /:(\w+)\u276A(.+?(?=\u276B))|:(\w+)/g,
    regexDigits = /(\d+)/g,
    keypseudo = {
      action: function (pseudo, event) {
        return pseudo.value.match(regexDigits).indexOf(String(event.keyCode)) > -1 == (pseudo.name == 'keypass') || null;
      }
    },
    /*
      - The prefix object generated here is added to the xtag object as xtag.prefix later in the code
      - Prefix provides a variety of prefix variations for the browser in which your code is running
      - The 4 variations of prefix are as follows:
        * prefix.dom: the correct prefix case and form when used on DOM elements/style properties
        * prefix.lowercase: a lowercase version of the prefix for use in various user-code situations
        * prefix.css: the lowercase, dashed version of the prefix
        * prefix.js: addresses prefixed APIs present in global and non-Element contexts
    */
    prefix = (function () {
      var keys = Object.keys(window).join();
      var pre = ((keys.match(/,(ms)/) || keys.match(/,(moz)/) || keys.match(/,(O)/)) || [null, 'webkit'])[1].toLowerCase();
      return {
        dom: pre == 'ms' ? 'MS' : pre,
        lowercase: pre,
        css: '-' + pre + '-',
        js: pre == 'ms' ? pre : pre.charAt(0).toUpperCase() + pre.substring(1)
      };
    })(),
    matchSelector = Element.prototype.matches || Element.prototype.matchesSelector || Element.prototype[prefix.lowercase + 'MatchesSelector'];

/*** Functions ***/

// Utilities

  /*
    This is an enhanced typeof check for all types of objects. Where typeof would normaly return
    'object' for many common DOM objects (like NodeLists and HTMLCollections).
    - For example: typeOf(document.children) will correctly return 'htmlcollection'
  */
  var typeCache = {},
      typeString = typeCache.toString,
      typeRegexp = /\s([a-zA-Z]+)/;
  function typeOf(obj) {
    var type = typeString.call(obj);
    return typeCache[type] || (typeCache[type] = type.match(typeRegexp)[1].toLowerCase());
  }

  function clone(item, type){
    var fn = clone[type || typeOf(item)];
    return fn ? fn(item) : item;
  }
    clone.object = function(src){
      var obj = {};
      for (var key in src) obj[key] = clone(src[key]);
      return obj;
    };
    clone.array = function(src){
      var i = src.length, array = new Array(i);
      while (i--) array[i] = clone(src[i]);
      return array;
    };

  /*
    The toArray() method allows for conversion of any object to a true array. For types that
    cannot be converted to an array, the method returns a 1 item array containing the passed-in object.
  */
  var unsliceable = { 'undefined': 1, 'null': 1, 'number': 1, 'boolean': 1, 'string': 1, 'function': 1 };
  function toArray(obj){
    return unsliceable[typeOf(obj)] ? [obj] : Array.prototype.slice.call(obj, 0);
  }

// DOM

  var str = '';
  function query(element, selector){
    return (selector || str).length ? toArray(element.querySelectorAll(selector)) : [];
  }

// Pseudos

  function parsePseudo(fn){fn();}

// Mixins

  function mergeOne(source, key, current){
    var type = typeOf(current);
    if (type == 'object' && typeOf(source[key]) == 'object') xtag.merge(source[key], current);
    else source[key] = clone(current, type);
    return source;
  }

  function mergeMixin(tag, original, mixin, name) {
    var key, keys = {};
    for (var z in original) keys[z.split(':')[0]] = z;
    for (z in mixin) {
      key = keys[z.split(':')[0]];
      if (typeof original[key] == 'function') {
        if (!key.match(':mixins')) {
          original[key + ':mixins'] = original[key];
          delete original[key];
          key = key + ':mixins';
        }
        original[key].__mixin__ = xtag.applyPseudos(z + (z.match(':mixins') ? '' : ':mixins'), mixin[z], tag.pseudos, original[key].__mixin__);
      }
      else {
        original[z] = mixin[z];
        delete original[key];
      }
    }
  }

  var uniqueMixinCount = 0;
  function addMixin(tag, original, mixin){
    for (var z in mixin){
      original[z + ':__mixin__(' + (uniqueMixinCount++) + ')'] = xtag.applyPseudos(z, mixin[z], tag.pseudos);
    }
  }

  function resolveMixins(mixins, output){
    var index = mixins.length;
    while (index--){
      output.unshift(mixins[index]);
      if (xtag.mixins[mixins[index]].mixins) resolveMixins(xtag.mixins[mixins[index]].mixins, output);
    }
    return output;
  }

  function applyMixins(tag) {
    resolveMixins(tag.mixins, []).forEach(function(name){
      var mixin = xtag.mixins[name];
      for (var type in mixin) {
        var item = mixin[type],
            original = tag[type];
        if (!original) tag[type] = item;
        else {
          switch (type){
            case 'mixins': break;
            case 'events': addMixin(tag, original, item); break;
            case 'accessors':
            case 'prototype':
              for (var z in item) {
                if (!original[z]) original[z] = item[z];
                else mergeMixin(tag, original[z], item[z], name);
              }
              break;
            default: mergeMixin(tag, original, item, name);
          }
        }
      }
    });
    return tag;
  }

// Events

  function delegateAction(pseudo, event) {
    var match,
        target = event.target,
        root = event.currentTarget;
    while (!match && target && target != root) {
      if (target.tagName && matchSelector.call(target, pseudo.value)) match = target;
      target = target.parentNode;
    }
    if (!match && root.tagName && matchSelector.call(root, pseudo.value)) match = root;
    return match ? pseudo.listener = pseudo.listener.bind(match) : null;
  }

  function touchFilter(event){
    return event.button === 0;
  }

  function writeProperty(key, event, base, desc){
    if (desc) event[key] = base[key];
    else Object.defineProperty(event, key, {
      writable: true,
      enumerable: true,
      value: base[key]
    });
  }

  var skipProps = {};
  for (var z in doc.createEvent('CustomEvent')) skipProps[z] = 1;
  function inheritEvent(event, base){
    var desc = Object.getOwnPropertyDescriptor(event, 'target');
    for (var z in base) {
      if (!skipProps[z]) writeProperty(z, event, base, desc);
    }
    event.baseEvent = base;
  }

// Accessors

  function modAttr(element, attr, name, value, method){
    attrProto[method].call(element, name, attr && attr.boolean ? '' : value);
  }

  function syncAttr(element, attr, name, value, method){
    if (attr && (attr.property || attr.selector)) {
      var nodes = attr.property ? [element.xtag[attr.property]] : attr.selector ? xtag.query(element, attr.selector) : [],
          index = nodes.length;
      while (index--) nodes[index][method](name, value);
    }
  }

  function attachProperties(tag, prop, z, accessor, attr, name){
    var key = z.split(':'), type = key[0];
    if (type == 'get') {
      key[0] = prop;
      tag.prototype[prop].get = xtag.applyPseudos(key.join(':'), accessor[z], tag.pseudos, accessor[z]);
    }
    else if (type == 'set') {
      key[0] = prop;
      var setter = tag.prototype[prop].set = xtag.applyPseudos(key.join(':'), attr ? function(value){
        var old, method = 'setAttribute';
        if (attr.boolean){
          value = !!value;
          old = this.hasAttribute(name);
          if (!value) method = 'removeAttribute';
        }
        else {
          value = attr.validate ? attr.validate.call(this, value) : value;
          old = this.getAttribute(name);
        }
        modAttr(this, attr, name, value, method);
        accessor[z].call(this, value, old);
        syncAttr(this, attr, name, value, method);
      } : accessor[z] ? function(value){
        accessor[z].call(this, value);
      } : null, tag.pseudos, accessor[z]);

      if (attr) attr.setter = accessor[z];
    }
    else tag.prototype[prop][z] = accessor[z];
  }

  function parseAccessor(tag, prop){
    tag.prototype[prop] = {};
    var accessor = tag.accessors[prop],
        attr = accessor.attribute,
        name;

    if (attr) {
      name = attr.name = (attr ? (attr.name || prop.replace(regexCamelToDash, '$1-$2')) : prop).toLowerCase();
      attr.key = prop;
      tag.attributes[name] = attr;
    }

    for (var z in accessor) attachProperties(tag, prop, z, accessor, attr, name);

    if (attr) {
      if (!tag.prototype[prop].get) {
        var method = (attr.boolean ? 'has' : 'get') + 'Attribute';
        tag.prototype[prop].get = function(){
          return this[method](name);
        };
      }
      if (!tag.prototype[prop].set) tag.prototype[prop].set = function(value){
        value = attr.boolean ? !!value : attr.validate ? attr.validate.call(this, value) : value;
        var method = attr.boolean ? (value ? 'setAttribute' : 'removeAttribute') : 'setAttribute';
        modAttr(this, attr, name, value, method);
        syncAttr(this, attr, name, value, method);
      };
    }
  }

  var unwrapComment = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;
  function parseMultiline(fn){
    return typeof fn == 'function' ? unwrapComment.exec(fn.toString())[1] : fn;
  }

/*** X-Tag Object Definition ***/

  var xtag = {
    tags: {},
    defaultOptions: {
      pseudos: [],
      mixins: [],
      events: {},
      methods: {},
      accessors: {},
      lifecycle: {},
      attributes: {},
      'prototype': {
        xtag: {
          get: function(){
            return this.__xtag__ ? this.__xtag__ : (this.__xtag__ = { data: {} });
          }
        }
      }
    },
    register: function (name, options) {
      var _name;
      if (typeof name == 'string') _name = name.toLowerCase();
      else throw 'First argument must be a Custom Element string name';
      xtag.tags[_name] = options || {};

      var basePrototype = options.prototype;
      delete options.prototype;
      var tag = xtag.tags[_name].compiled = applyMixins(xtag.merge({}, xtag.defaultOptions, options));
      var proto = tag.prototype;
      var lifecycle = tag.lifecycle;

      for (var z in tag.events) tag.events[z] = xtag.parseEvent(z, tag.events[z]);
      for (z in lifecycle) lifecycle[z.split(':')[0]] = xtag.applyPseudos(z, lifecycle[z], tag.pseudos, lifecycle[z]);
      for (z in tag.methods) proto[z.split(':')[0]] = { value: xtag.applyPseudos(z, tag.methods[z], tag.pseudos, tag.methods[z]), enumerable: true };
      for (z in tag.accessors) parseAccessor(tag, z);

      if (tag.shadow) tag.shadow = tag.shadow.nodeName ? tag.shadow : xtag.createFragment(tag.shadow);
      if (tag.content) tag.content = tag.content.nodeName ? tag.content.innerHTML : parseMultiline(tag.content);
      var created = lifecycle.created;
      var finalized = lifecycle.finalized;
      proto.createdCallback = {
        enumerable: true,
        value: function(){
          var element = this;
          if (tag.shadow && hasShadow) this.createShadowRoot().appendChild(tag.shadow.cloneNode(true));
          if (tag.content) this.appendChild(document.createElement('div')).outerHTML = tag.content;
          var output = created ? created.apply(this, arguments) : null;
          xtag.addEvents(this, tag.events);
          for (var name in tag.attributes) {
            var attr = tag.attributes[name],
                hasAttr = this.hasAttribute(name),
                hasDefault = attr.def !== undefined;
            if (hasAttr || attr.boolean || hasDefault) {
              this[attr.key] = attr.boolean ? hasAttr : !hasAttr && hasDefault ? attr.def : this.getAttribute(name);
            }
          }
          tag.pseudos.forEach(function(obj){
            obj.onAdd.call(element, obj);
          });
          this.xtagComponentReady = true;
          if (finalized) finalized.apply(this, arguments);
          return output;
        }
      };

      var inserted = lifecycle.inserted;
      var removed = lifecycle.removed;
      if (inserted || removed) {
        proto.attachedCallback = { value: function(){
          if (removed) this.xtag.__parentNode__ = this.parentNode;
          if (inserted) return inserted.apply(this, arguments);
        }, enumerable: true };
      }
      if (removed) {
        proto.detachedCallback = { value: function(){
          var args = toArray(arguments);
          args.unshift(this.xtag.__parentNode__);
          var output = removed.apply(this, args);
          delete this.xtag.__parentNode__;
          return output;
        }, enumerable: true };
      }
      if (lifecycle.attributeChanged) proto.attributeChangedCallback = { value: lifecycle.attributeChanged, enumerable: true };

      proto.setAttribute = {
        writable: true,
        enumerable: true,
        value: function (name, value){
          var old;
          var _name = name.toLowerCase();
          var attr = tag.attributes[_name];
          if (attr) {
            old = this.getAttribute(_name);
            value = attr.boolean ? '' : attr.validate ? attr.validate.call(this, value) : value;
          }
          modAttr(this, attr, _name, value, 'setAttribute');
          if (attr) {
            if (attr.setter) attr.setter.call(this, attr.boolean ? true : value, old);
            syncAttr(this, attr, _name, value, 'setAttribute');
          }
        }
      };

      proto.removeAttribute = {
        writable: true,
        enumerable: true,
        value: function (name){
          var _name = name.toLowerCase();
          var attr = tag.attributes[_name];
          var old = this.hasAttribute(_name);
          modAttr(this, attr, _name, '', 'removeAttribute');
          if (attr) {
            if (attr.setter) attr.setter.call(this, attr.boolean ? false : undefined, old);
            syncAttr(this, attr, _name, '', 'removeAttribute');
          }
        }
      };

      var definition = {};
      var instance = basePrototype instanceof win.HTMLElement;
      var extended = tag['extends'] && (definition['extends'] = tag['extends']);

      if (basePrototype) Object.getOwnPropertyNames(basePrototype).forEach(function(z){
        var prop = proto[z];
        var desc = instance ? Object.getOwnPropertyDescriptor(basePrototype, z) : basePrototype[z];
        if (prop) {
          for (var y in desc) {
            if (typeof desc[y] == 'function' && prop[y]) prop[y] = xtag.wrap(desc[y], prop[y]);
            else prop[y] = desc[y];
          }
        }
        proto[z] = prop || desc;
      });

      definition['prototype'] = Object.create(
        extended ? Object.create(doc.createElement(extended).constructor).prototype : win.HTMLElement.prototype,
        proto
      );

      return doc.registerElement(_name, definition);
    },

    /* Exposed Variables */

    mixins: {},
    prefix: prefix,
    captureEvents: { focus: 1, blur: 1, scroll: 1, DOMMouseScroll: 1 },
    customEvents: {
      animationstart: {
        attach: [prefix.dom + 'AnimationStart']
      },
      animationend: {
        attach: [prefix.dom + 'AnimationEnd']
      },
      transitionend: {
        attach: [prefix.dom + 'TransitionEnd']
      },
      move: {
        attach: ['pointermove']
      },
      enter: {
        attach: ['pointerenter']
      },
      leave: {
        attach: ['pointerleave']
      },
      scrollwheel: {
        attach: ['DOMMouseScroll', 'mousewheel'],
        condition: function(event){
          event.delta = event.wheelDelta ? event.wheelDelta / 40 : Math.round(event.detail / 3.5 * -1);
          return true;
        }
      },
      tap: {
        attach: ['pointerdown', 'pointerup'],
        condition: function(event, custom){
          if (event.type == 'pointerdown') {
            custom.startX = event.clientX;
            custom.startY = event.clientY;
          }
          else if (event.button === 0 &&
                   Math.abs(custom.startX - event.clientX) < 10 &&
                   Math.abs(custom.startY - event.clientY) < 10) return true;
        }
      },
      tapstart: {
        attach: ['pointerdown'],
        condition: touchFilter
      },
      tapend: {
        attach: ['pointerup'],
        condition: touchFilter
      },
      tapmove: {
        attach: ['pointerdown'],
        condition: function(event, custom){
          if (event.type == 'pointerdown') {
            var listener = custom.listener.bind(this);
            if (!custom.tapmoveListeners) custom.tapmoveListeners = xtag.addEvents(document, {
              pointermove: listener,
              pointerup: listener,
              pointercancel: listener
            });
          }
          else if (event.type == 'pointerup' || event.type == 'pointercancel') {
            xtag.removeEvents(document, custom.tapmoveListeners);
            custom.tapmoveListeners = null;
          }
          return true;
        }
      },
      taphold: {
        attach: ['pointerdown', 'pointerup'],
        condition: function(event, custom){
          if (event.type == 'pointerdown') {
            (custom.pointers = custom.pointers || {})[event.pointerId] = setTimeout(
              xtag.fireEvent.bind(null, this, 'taphold'),
              custom.duration || 1000
            );
          }
          else if (event.type == 'pointerup') {
            if (custom.pointers) {
              clearTimeout(custom.pointers[event.pointerId]);
              delete custom.pointers[event.pointerId];
            }
          }
          else return true;
        }
      }
    },
    pseudos: {
      __mixin__: {},
      mixins: {
        onCompiled: function(fn, pseudo){
          var mixin = pseudo.source && pseudo.source.__mixin__ || pseudo.source;
          if (mixin) switch (pseudo.value) {
            case null: case '': case 'before': return function(){
              mixin.apply(this, arguments);
              return fn.apply(this, arguments);
            };
            case 'after': return function(){
              var returns = fn.apply(this, arguments);
              mixin.apply(this, arguments);
              return returns;
            };
            case 'none': return fn;
          }
          else return fn;
        }
      },
      keypass: keypseudo,
      keyfail: keypseudo,
      delegate: {
        action: delegateAction
      },
      preventable: {
        action: function (pseudo, event) {
          return !event.defaultPrevented;
        }
      },
      duration: {
        onAdd: function(pseudo){
          pseudo.source.duration = Number(pseudo.value);
        }
      },
      capture: {
        onCompiled: function(fn, pseudo){
          if (pseudo.source) pseudo.source.capture = true;
        }
      }
    },

    /* UTILITIES */

    clone: clone,
    typeOf: typeOf,
    toArray: toArray,

    wrap: function (original, fn) {
      return function(){
        var output = original.apply(this, arguments);
        fn.apply(this, arguments);
        return output;
      };
    },
    /*
      Recursively merges one object with another. The first argument is the destination object,
      all other objects passed in as arguments are merged from right to left, conflicts are overwritten
    */
    merge: function(source, k, v){
      if (typeOf(k) == 'string') return mergeOne(source, k, v);
      for (var i = 1, l = arguments.length; i < l; i++){
        var object = arguments[i];
        for (var key in object) mergeOne(source, key, object[key]);
      }
      return source;
    },

    /*
      ----- This should be simplified! -----
      Generates a random ID string
    */
    uid: function(){
      return Math.random().toString(36).substr(2,10);
    },

    /* DOM */

    query: query,

    skipTransition: function(element, fn, bind){
      var prop = prefix.js + 'TransitionProperty';
      element.style[prop] = element.style.transitionProperty = 'none';
      var callback = fn ? fn.call(bind || element) : null;
      return xtag.skipFrame(function(){
        element.style[prop] = element.style.transitionProperty = '';
        if (callback) callback.call(bind || element);
      });
    },

    requestFrame: (function(){
      var raf = win.requestAnimationFrame ||
                win[prefix.lowercase + 'RequestAnimationFrame'] ||
                function(fn){ return win.setTimeout(fn, 20); };
      return function(fn){ return raf(fn); };
    })(),

    cancelFrame: (function(){
      var cancel = win.cancelAnimationFrame ||
                   win[prefix.lowercase + 'CancelAnimationFrame'] ||
                   win.clearTimeout;
      return function(id){ return cancel(id); };
    })(),

    skipFrame: function(fn){
      var id = xtag.requestFrame(function(){ id = xtag.requestFrame(fn); });
      return id;
    },

    matchSelector: function (element, selector) {
      return matchSelector.call(element, selector);
    },

    set: function (element, method, value) {
      element[method] = value;
      if (window.CustomElements) CustomElements.upgradeAll(element);
    },

    innerHTML: function(el, html){
      xtag.set(el, 'innerHTML', html);
    },

    hasClass: function (element, klass) {
      return element.className.split(' ').indexOf(klass.trim())>-1;
    },

    addClass: function (element, klass) {
      var list = element.className.trim().split(' ');
      klass.trim().split(' ').forEach(function (name) {
        if (!~list.indexOf(name)) list.push(name);
      });
      element.className = list.join(' ').trim();
      return element;
    },

    removeClass: function (element, klass) {
      var classes = klass.trim().split(' ');
      element.className = element.className.trim().split(' ').filter(function (name) {
        return name && !~classes.indexOf(name);
      }).join(' ');
      return element;
    },

    toggleClass: function (element, klass) {
      return xtag[xtag.hasClass(element, klass) ? 'removeClass' : 'addClass'].call(null, element, klass);
    },

    /*
      Runs a query on only the children of an element
    */
    queryChildren: function (element, selector) {
      var id = element.id,
          attr = '#' + (element.id = id || 'x_' + xtag.uid()) + ' > ',
          parent = element.parentNode || !container.appendChild(element);
      selector = attr + (selector + '').replace(regexReplaceCommas, ',' + attr);
      var result = element.parentNode.querySelectorAll(selector);
      if (!id) element.removeAttribute('id');
      if (!parent) container.removeChild(element);
      return toArray(result);
    },

    /*
      Creates a document fragment with the content passed in - content can be
      a string of HTML, an element, or an array/collection of elements
    */
    createFragment: function(content) {
      var template = document.createElement('template');
      if (content) {
        if (content.nodeName) toArray(arguments).forEach(function(e){
          template.content.appendChild(e);
        });
        else template.innerHTML = parseMultiline(content);
      }
      return document.importNode(template.content, true);
    },

    /*
      Removes an element from the DOM for more performant node manipulation. The element
      is placed back into the DOM at the place it was taken from.
    */
    manipulate: function(element, fn){
      var next = element.nextSibling,
          parent = element.parentNode,
          returned = fn.call(element) || element;
      if (next) parent.insertBefore(returned, next);
      else parent.appendChild(returned);
    },

    /* PSEUDOS */

    applyPseudos: function(key, fn, target, source) {
      var listener = fn,
          pseudos = {};
      if (key.match(':')) {
        var matches = [],
            valueFlag = 0;
        key.replace(regexPseudoParens, function(match){
          if (match == '(') return ++valueFlag == 1 ? '\u276A' : '(';
          return !--valueFlag ? '\u276B' : ')';
        }).replace(regexPseudoCapture, function(z, name, value, solo){
          matches.push([name || solo, value]);
        });
        var i = matches.length;
        while (i--) parsePseudo(function(){
          var name = matches[i][0],
              value = matches[i][1];
          if (!xtag.pseudos[name]) throw "pseudo not found: " + name + " " + value;
          value = (value === '' || typeof value == 'undefined') ? null : value;
          var pseudo = pseudos[i] = Object.create(xtag.pseudos[name]);
          pseudo.key = key;
          pseudo.name = name;
          pseudo.value = value;
          pseudo['arguments'] = (value || '').split(',');
          pseudo.action = pseudo.action || trueop;
          pseudo.source = source;
          pseudo.onAdd = pseudo.onAdd || noop;
          pseudo.onRemove = pseudo.onRemove || noop;
          var original = pseudo.listener = listener;
          listener = function(){
            var output = pseudo.action.apply(this, [pseudo].concat(toArray(arguments)));
            if (output === null || output === false) return output;
            output = pseudo.listener.apply(this, arguments);
            pseudo.listener = original;
            return output;
          };
          if (!target) pseudo.onAdd.call(fn, pseudo);
          else target.push(pseudo);
        });
      }
      for (var z in pseudos) {
        if (pseudos[z].onCompiled) listener = pseudos[z].onCompiled(listener, pseudos[z]) || listener;
      }
      return listener;
    },

    removePseudos: function(target, pseudos){
      pseudos.forEach(function(obj){
        obj.onRemove.call(target, obj);
      });
    },

  /*** Events ***/

    parseEvent: function(type, fn) {
      var pseudos = type.split(':'),
          key = pseudos.shift(),
          custom = xtag.customEvents[key],
          event = xtag.merge({
            type: key,
            stack: noop,
            condition: trueop,
            capture: xtag.captureEvents[key],
            attach: [],
            _attach: [],
            pseudos: '',
            _pseudos: [],
            onAdd: noop,
            onRemove: noop
          }, custom || {});
      event.attach = toArray(event.base || event.attach);
      event.chain = key + (event.pseudos.length ? ':' + event.pseudos : '') + (pseudos.length ? ':' + pseudos.join(':') : '');
      var stack = xtag.applyPseudos(event.chain, fn, event._pseudos, event);
      event.stack = function(e){
        e.currentTarget = e.currentTarget || this;
        var detail = e.detail || {};
        if (!detail.__stack__) return stack.apply(this, arguments);
        else if (detail.__stack__ == stack) {
          e.stopPropagation();
          e.cancelBubble = true;
          return stack.apply(this, arguments);
        }
      };
      event.listener = function(e){
        var args = toArray(arguments),
            output = event.condition.apply(this, args.concat([event]));
        if (!output) return output;
        // The second condition in this IF is to address the following Blink regression: https://code.google.com/p/chromium/issues/detail?id=367537
        // Remove this when affected browser builds with this regression fall below 5% marketshare
        if (e.type != key && (e.baseEvent && e.type != e.baseEvent.type)) {
          xtag.fireEvent(e.target, key, {
            baseEvent: e,
            detail: output !== true && (output.__stack__ = stack) ? output : { __stack__: stack }
          });
        }
        else return event.stack.apply(this, args);
      };
      event.attach.forEach(function(name) {
        event._attach.push(xtag.parseEvent(name, event.listener));
      });
      return event;
    },

    addEvent: function (element, type, fn, capture) {
      var event = typeof fn == 'function' ? xtag.parseEvent(type, fn) : fn;
      event._pseudos.forEach(function(obj){
        obj.onAdd.call(element, obj);
      });
      event._attach.forEach(function(obj) {
        xtag.addEvent(element, obj.type, obj);
      });
      event.onAdd.call(element, event, event.listener);
      element.addEventListener(event.type, event.stack, capture || event.capture);
      return event;
    },

    addEvents: function (element, obj) {
      var events = {};
      for (var z in obj) {
        events[z] = xtag.addEvent(element, z, obj[z]);
      }
      return events;
    },

    removeEvent: function (element, type, event) {
      event = event || type;
      event.onRemove.call(element, event, event.listener);
      xtag.removePseudos(element, event._pseudos);
      event._attach.forEach(function(obj) {
        xtag.removeEvent(element, obj);
      });
      element.removeEventListener(event.type, event.stack);
    },

    removeEvents: function(element, obj){
      for (var z in obj) xtag.removeEvent(element, obj[z]);
    },

    fireEvent: function(element, type, options){
      var event = doc.createEvent('CustomEvent');
      options = options || {};
      event.initCustomEvent(type,
        options.bubbles !== false,
        options.cancelable !== false,
        options.detail
      );
      if (options.baseEvent) inheritEvent(event, options.baseEvent);
      element.dispatchEvent(event);
    }

  };

  if (typeof define === 'function' && define.amd) define(xtag);
  else if (typeof module !== 'undefined' && module.exports) module.exports = xtag;
  else win.xtag = xtag;

  doc.addEventListener('WebComponentsReady', function(){
    xtag.fireEvent(doc.body, 'DOMComponentsLoaded');
  });

})();

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvcGF0Y2guanMiLCJleGFtcGxlcy94LXRhZy9pbmRleC5qcyIsImV4YW1wbGVzL3gtdGFnL3N1Yi5odG1sIiwiZXhhbXBsZXMveC10YWcvdmlldy5odG1sIiwibm9kZV9tb2R1bGVzL2luY3JlbWVudGFsLWRvbS9kaXN0L2luY3JlbWVudGFsLWRvbS1janMuanMiLCJub2RlX21vZHVsZXMveC10YWcvc3JjL2NvcmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNpQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpXG52YXIgcGF0Y2ggPSBJbmNyZW1lbnRhbERPTS5wYXRjaFxuLy8gdmFyIGN1cnJlbnRFbGVtZW50ID0gSW5jcmVtZW50YWxET00uY3VycmVudEVsZW1lbnRcbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbCwgdmlldywgZGF0YSkge1xuICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICAvLyBpZiAoY3VycmVudEVsZW1lbnQoKSkge1xuICAvLyAgIHZpZXcuYXBwbHkodGhpcywgYXJncy5zbGljZSgyKSlcbiAgLy8gfSBlbHNlIHtcbiAgaWYgKGFyZ3MubGVuZ3RoIDw9IDMpIHtcbiAgICBwYXRjaChlbCwgdmlldywgZGF0YSlcbiAgfSBlbHNlIHtcbiAgICBwYXRjaChlbCwgZnVuY3Rpb24gKCkge1xuICAgICAgdmlldy5hcHBseSh0aGlzLCBhcmdzLnNsaWNlKDIpKVxuICAgIH0pXG4gIH1cbiAgLy8gfVxufVxuIiwidmFyIHh0YWcgPSByZXF1aXJlKCd4LXRhZycpXG52YXIgcGF0Y2ggPSByZXF1aXJlKCcuLi8uLi9jbGllbnQvcGF0Y2gnKVxudmFyIHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcuaHRtbCcpXG52YXIgc3ViID0gcmVxdWlyZSgnLi9zdWIuaHRtbCcpXG5cbnh0YWcucmVnaXN0ZXIoJ3gtc3ViJywge1xuICBsaWZlY3ljbGU6IHtcbiAgICBjcmVhdGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmRhdGEgPSB7fVxuICAgICAgLy8gdGhpcy5wYXRjaCgpXG4gICAgfSxcbiAgICBhdHRyaWJ1dGVDaGFuZ2VkOiBmdW5jdGlvbiAoYXR0ck5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgLy8gd2luZG93LmFsZXJ0KCdJIGZpcmUgd2hlbiBhbiBBVFRSSUJVVEUgaXMgQ0hBTkdFRCBvbiBhbiA8eC1jbG9jaz4nKVxuICAgIH1cbiAgfSxcbiAgYWNjZXNzb3JzOiB7XG4gICAgbmFtZToge1xuICAgICAgYXR0cmlidXRlOiB7fSxcbiAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhLm5hbWVcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLmRhdGEubmFtZSA9IHZhbHVlXG4gICAgICAgIHRoaXMucGF0Y2goKVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgbWV0aG9kczoge1xuICAgIHBhdGNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICBwYXRjaCh0aGlzLCBzdWIuYmluZCh0aGlzKSwgdGhpcy5kYXRhKVxuICAgIH0sXG4gICAgb25DaGFuZ2U6IGZ1bmN0aW9uIChlKSB7XG4gICAgICB0aGlzLmRhdGEubmFtZSA9IGUudGFyZ2V0LnZhbHVlXG4gICAgICB0aGlzLnBhdGNoKClcbiAgICAgIC8vIGlmICh0aGlzLnh0YWcuaW50ZXJ2YWwpIHRoaXMuc3RvcCgpXG4gICAgICAvLyBlbHNlIHRoaXMuc3RhcnQoKVxuICAgIH1cbiAgfSxcbiAgZXZlbnRzOiB7XG4gICAgY2hhbmdlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnBhdGNoKClcbiAgICAgIC8vIGlmICh0aGlzLnh0YWcuaW50ZXJ2YWwpIHRoaXMuc3RvcCgpXG4gICAgICAvLyBlbHNlIHRoaXMuc3RhcnQoKVxuICAgIH1cbiAgfVxufSlcblxueHRhZy5yZWdpc3RlcigneC12aWV3Jywge1xuICBsaWZlY3ljbGU6IHtcbiAgICBjcmVhdGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmRhdGEgPSB7XG4gICAgICAgIGxpc3Q6IFt7XG4gICAgICAgICAgbmFtZTogJ015IG5hbWUgMSdcbiAgICAgICAgfSwge1xuICAgICAgICAgIG5hbWU6ICdNeSBuYW1lIDInXG4gICAgICAgIH0sIHtcbiAgICAgICAgICBuYW1lOiAnTXkgbmFtZSAzJ1xuICAgICAgICB9XVxuICAgICAgfVxuICAgICAgLy8gdGhpcy5wYXRjaCgpXG4gICAgfSxcbiAgICBhdHRyaWJ1dGVDaGFuZ2VkOiBmdW5jdGlvbiAoYXR0ck5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgLy8gd2luZG93LmFsZXJ0KCdJIGZpcmUgd2hlbiBhbiBBVFRSSUJVVEUgaXMgQ0hBTkdFRCBvbiBhbiA8eC1jbG9jaz4nKVxuICAgIH1cbiAgfSxcbiAgYWNjZXNzb3JzOiB7XG4gICAgbmFtZToge1xuICAgICAgYXR0cmlidXRlOiB7fSxcbiAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhLm5hbWVcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLmRhdGEubmFtZSA9IHZhbHVlXG4gICAgICAgIHRoaXMucGF0Y2goKVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgbWV0aG9kczoge1xuICAgIHBhdGNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICBwYXRjaCh0aGlzLCB2aWV3LCB0aGlzLmRhdGEpXG4gICAgfVxuICB9LFxuICBldmVudHM6IHtcbiAgICBjbGljazogZnVuY3Rpb24gKCkge1xuICAgICAgLy8gaWYgKHRoaXMueHRhZy5pbnRlcnZhbCkgdGhpcy5zdG9wKClcbiAgICAgIC8vIGVsc2UgdGhpcy5zdGFydCgpXG4gICAgfVxuICB9XG59KVxuXG4iLCJ2YXIgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20nKVxudmFyIHBhdGNoID0gSW5jcmVtZW50YWxET00ucGF0Y2hcbnZhciBlbGVtZW50T3BlbiA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRPcGVuXG52YXIgZWxlbWVudENsb3NlID0gSW5jcmVtZW50YWxET00uZWxlbWVudENsb3NlXG52YXIgc2tpcCA9IEluY3JlbWVudGFsRE9NLnNraXBcbnZhciBjdXJyZW50RWxlbWVudCA9IEluY3JlbWVudGFsRE9NLmN1cnJlbnRFbGVtZW50XG52YXIgdGV4dCA9IEluY3JlbWVudGFsRE9NLnRleHRcblxudmFyIGhvaXN0ZWQxID0gW1widHlwZVwiLCBcInRleHRcIl1cbnZhciBfX3RhcmdldFxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlc2NyaXB0aW9uIChkYXRhKSB7XG5lbGVtZW50T3BlbihcImlucHV0XCIsIFwiYWUyNmRmNGYtMTViOS00ZTVjLWI4Y2UtYjg5MDU5NjgwMGNjXCIsIGhvaXN0ZWQxLCBcInZhbHVlXCIsIGRhdGEubmFtZSwgXCJvbmtleXVwXCIsIHRoaXMub25DaGFuZ2UuYmluZCh0aGlzKSlcbmVsZW1lbnRDbG9zZShcImlucHV0XCIpXG5lbGVtZW50T3BlbihcInNwYW5cIilcbiAgdGV4dChcIlwiICsgKGRhdGEubmFtZSkgKyBcIlwiKVxuZWxlbWVudENsb3NlKFwic3BhblwiKVxufVxuIiwidmFyIEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJylcbnZhciBwYXRjaCA9IEluY3JlbWVudGFsRE9NLnBhdGNoXG52YXIgZWxlbWVudE9wZW4gPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50T3BlblxudmFyIGVsZW1lbnRDbG9zZSA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRDbG9zZVxudmFyIHNraXAgPSBJbmNyZW1lbnRhbERPTS5za2lwXG52YXIgY3VycmVudEVsZW1lbnQgPSBJbmNyZW1lbnRhbERPTS5jdXJyZW50RWxlbWVudFxudmFyIHRleHQgPSBJbmNyZW1lbnRhbERPTS50ZXh0XG5cbnZhciBob2lzdGVkMSA9IFtcInR5cGVcIiwgXCJ0ZXh0XCJdXG52YXIgaG9pc3RlZDIgPSBbXCJuYW1lXCIsIFwid2VkXCJdXG52YXIgaG9pc3RlZDMgPSBbXCJocmVmXCIsIFwiI1wiXVxudmFyIF9fdGFyZ2V0XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVzY3JpcHRpb24gKGRhdGEpIHtcbmVsZW1lbnRPcGVuKFwiZm9ybVwiKVxuICBlbGVtZW50T3BlbihcImlucHV0XCIsIFwiZjc2MzVjMWUtMmUwMC00Y2ZjLWE5NTctZTA1YjI1NDU1NzMyXCIsIGhvaXN0ZWQxLCBcInZhbHVlXCIsIGRhdGEubmFtZSlcbiAgZWxlbWVudENsb3NlKFwiaW5wdXRcIilcbiAgZWxlbWVudE9wZW4oXCJzcGFuXCIpXG4gICAgdGV4dChcIlwiICsgKGRhdGEubmFtZSkgKyBcIlwiKVxuICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gIGVsZW1lbnRPcGVuKFwieC1zdWJcIiwgXCJlZGQ1ZjRkNC01NWNiLTQwNzEtYTM4NC1lMmQ5MDJlNmVjNzFcIiwgaG9pc3RlZDIpXG4gICAgaWYgKHRydWUpIHtcbiAgICAgIHNraXAoKVxuICAgIH0gZWxzZSB7XG4gICAgfVxuICBlbGVtZW50Q2xvc2UoXCJ4LXN1YlwiKVxuICBlbGVtZW50T3BlbihcImFcIiwgXCJlYTExOTMzMS03YjZiLTRkZTUtOTUwNy0zNmMyMjJhN2FkOTlcIiwgaG9pc3RlZDMpXG4gICAgdGV4dChcIkdvb2dsZVwiKVxuICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gIF9fdGFyZ2V0ID0gZGF0YS5saXN0XG4gIGlmIChfX3RhcmdldCkge1xuICAgIDsoX190YXJnZXQuZm9yRWFjaCA/IF9fdGFyZ2V0IDogT2JqZWN0LmtleXMoX190YXJnZXQpKS5mb3JFYWNoKGZ1bmN0aW9uKCR2YWx1ZSwgJGl0ZW0sICR0YXJnZXQpIHtcbiAgICAgIHZhciBpdGVtID0gJHZhbHVlXG4gICAgICB2YXIgJGtleSA9IFwiNTQwNzhhZjYtOWEyNi00YWQ5LWFlNDUtYTlmZjA4ZTNiMjM0X1wiICsgJGl0ZW1cbiAgICAgIGVsZW1lbnRPcGVuKFwieC1zdWJcIiwgJGtleSwgbnVsbCwgXCJuYW1lXCIsIGl0ZW0ubmFtZSlcbiAgICAgICAgaWYgKHRydWUpIHtcbiAgICAgICAgICBza2lwKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgfVxuICAgICAgZWxlbWVudENsb3NlKFwieC1zdWJcIilcbiAgICB9LCB0aGlzKVxuICB9XG5lbGVtZW50Q2xvc2UoXCJmb3JtXCIpXG59XG4iLCJcbi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEEgY2FjaGVkIHJlZmVyZW5jZSB0byB0aGUgaGFzT3duUHJvcGVydHkgZnVuY3Rpb24uXG4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQSBjYWNoZWQgcmVmZXJlbmNlIHRvIHRoZSBjcmVhdGUgZnVuY3Rpb24uXG4gKi9cbnZhciBjcmVhdGUgPSBPYmplY3QuY3JlYXRlO1xuXG4vKipcbiAqIFVzZWQgdG8gcHJldmVudCBwcm9wZXJ0eSBjb2xsaXNpb25zIGJldHdlZW4gb3VyIFwibWFwXCIgYW5kIGl0cyBwcm90b3R5cGUuXG4gKiBAcGFyYW0geyFPYmplY3Q8c3RyaW5nLCAqPn0gbWFwIFRoZSBtYXAgdG8gY2hlY2suXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgVGhlIHByb3BlcnR5IHRvIGNoZWNrLlxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBtYXAgaGFzIHByb3BlcnR5LlxuICovXG52YXIgaGFzID0gZnVuY3Rpb24gKG1hcCwgcHJvcGVydHkpIHtcbiAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwobWFwLCBwcm9wZXJ0eSk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gbWFwIG9iamVjdCB3aXRob3V0IGEgcHJvdG90eXBlLlxuICogQHJldHVybiB7IU9iamVjdH1cbiAqL1xudmFyIGNyZWF0ZU1hcCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGNyZWF0ZShudWxsKTtcbn07XG5cbi8qKlxuICogS2VlcHMgdHJhY2sgb2YgaW5mb3JtYXRpb24gbmVlZGVkIHRvIHBlcmZvcm0gZGlmZnMgZm9yIGEgZ2l2ZW4gRE9NIG5vZGUuXG4gKiBAcGFyYW0geyFzdHJpbmd9IG5vZGVOYW1lXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBOb2RlRGF0YShub2RlTmFtZSwga2V5KSB7XG4gIC8qKlxuICAgKiBUaGUgYXR0cmlidXRlcyBhbmQgdGhlaXIgdmFsdWVzLlxuICAgKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCAqPn1cbiAgICovXG4gIHRoaXMuYXR0cnMgPSBjcmVhdGVNYXAoKTtcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMsIHVzZWQgZm9yIHF1aWNrbHkgZGlmZmluZyB0aGVcbiAgICogaW5jb21taW5nIGF0dHJpYnV0ZXMgdG8gc2VlIGlmIHRoZSBET00gbm9kZSdzIGF0dHJpYnV0ZXMgbmVlZCB0byBiZVxuICAgKiB1cGRhdGVkLlxuICAgKiBAY29uc3Qge0FycmF5PCo+fVxuICAgKi9cbiAgdGhpcy5hdHRyc0FyciA9IFtdO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5jb21pbmcgYXR0cmlidXRlcyBmb3IgdGhpcyBOb2RlLCBiZWZvcmUgdGhleSBhcmUgdXBkYXRlZC5cbiAgICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgKj59XG4gICAqL1xuICB0aGlzLm5ld0F0dHJzID0gY3JlYXRlTWFwKCk7XG5cbiAgLyoqXG4gICAqIFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIG5vZGUsIHVzZWQgdG8gcHJlc2VydmUgRE9NIG5vZGVzIHdoZW4gdGhleVxuICAgKiBtb3ZlIHdpdGhpbiB0aGVpciBwYXJlbnQuXG4gICAqIEBjb25zdFxuICAgKi9cbiAgdGhpcy5rZXkgPSBrZXk7XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIGNoaWxkcmVuIHdpdGhpbiB0aGlzIG5vZGUgYnkgdGhlaXIga2V5LlxuICAgKiB7P09iamVjdDxzdHJpbmcsICFFbGVtZW50Pn1cbiAgICovXG4gIHRoaXMua2V5TWFwID0gbnVsbDtcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIGtleU1hcCBpcyBjdXJyZW50bHkgdmFsaWQuXG4gICAqIHtib29sZWFufVxuICAgKi9cbiAgdGhpcy5rZXlNYXBWYWxpZCA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFRoZSBub2RlIG5hbWUgZm9yIHRoaXMgbm9kZS5cbiAgICogQGNvbnN0IHtzdHJpbmd9XG4gICAqL1xuICB0aGlzLm5vZGVOYW1lID0gbm9kZU5hbWU7XG5cbiAgLyoqXG4gICAqIEB0eXBlIHs/c3RyaW5nfVxuICAgKi9cbiAgdGhpcy50ZXh0ID0gbnVsbDtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyBhIE5vZGVEYXRhIG9iamVjdCBmb3IgYSBOb2RlLlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgbm9kZSB0byBpbml0aWFsaXplIGRhdGEgZm9yLlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVOYW1lIFRoZSBub2RlIG5hbWUgb2Ygbm9kZS5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHRoYXQgaWRlbnRpZmllcyB0aGUgbm9kZS5cbiAqIEByZXR1cm4geyFOb2RlRGF0YX0gVGhlIG5ld2x5IGluaXRpYWxpemVkIGRhdGEgb2JqZWN0XG4gKi9cbnZhciBpbml0RGF0YSA9IGZ1bmN0aW9uIChub2RlLCBub2RlTmFtZSwga2V5KSB7XG4gIHZhciBkYXRhID0gbmV3IE5vZGVEYXRhKG5vZGVOYW1lLCBrZXkpO1xuICBub2RlWydfX2luY3JlbWVudGFsRE9NRGF0YSddID0gZGF0YTtcbiAgcmV0dXJuIGRhdGE7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgTm9kZURhdGEgb2JqZWN0IGZvciBhIE5vZGUsIGNyZWF0aW5nIGl0IGlmIG5lY2Vzc2FyeS5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgVGhlIG5vZGUgdG8gcmV0cmlldmUgdGhlIGRhdGEgZm9yLlxuICogQHJldHVybiB7IU5vZGVEYXRhfSBUaGUgTm9kZURhdGEgZm9yIHRoaXMgTm9kZS5cbiAqL1xudmFyIGdldERhdGEgPSBmdW5jdGlvbiAobm9kZSkge1xuICB2YXIgZGF0YSA9IG5vZGVbJ19faW5jcmVtZW50YWxET01EYXRhJ107XG5cbiAgaWYgKCFkYXRhKSB7XG4gICAgdmFyIG5vZGVOYW1lID0gbm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhciBrZXkgPSBudWxsO1xuXG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICBrZXkgPSBub2RlLmdldEF0dHJpYnV0ZSgna2V5Jyk7XG4gICAgfVxuXG4gICAgZGF0YSA9IGluaXREYXRhKG5vZGUsIG5vZGVOYW1lLCBrZXkpO1xuICB9XG5cbiAgcmV0dXJuIGRhdGE7XG59O1xuXG4vKipcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKiBAY29uc3QgKi9cbnZhciBzeW1ib2xzID0ge1xuICBkZWZhdWx0OiAnX19kZWZhdWx0JyxcblxuICBwbGFjZWhvbGRlcjogJ19fcGxhY2Vob2xkZXInXG59O1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtzdHJpbmd8dW5kZWZpbmVkfSBUaGUgbmFtZXNwYWNlIHRvIHVzZSBmb3IgdGhlIGF0dHJpYnV0ZS5cbiAqL1xudmFyIGdldE5hbWVzcGFjZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIGlmIChuYW1lLmxhc3RJbmRleE9mKCd4bWw6JywgMCkgPT09IDApIHtcbiAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnL1hNTC8xOTk4L25hbWVzcGFjZSc7XG4gIH1cblxuICBpZiAobmFtZS5sYXN0SW5kZXhPZigneGxpbms6JywgMCkgPT09IDApIHtcbiAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnO1xuICB9XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgYW4gYXR0cmlidXRlIG9yIHByb3BlcnR5IHRvIGEgZ2l2ZW4gRWxlbWVudC4gSWYgdGhlIHZhbHVlIGlzIG51bGxcbiAqIG9yIHVuZGVmaW5lZCwgaXQgaXMgcmVtb3ZlZCBmcm9tIHRoZSBFbGVtZW50LiBPdGhlcndpc2UsIHRoZSB2YWx1ZSBpcyBzZXRcbiAqIGFzIGFuIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Pyhib29sZWFufG51bWJlcnxzdHJpbmcpPX0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLlxuICovXG52YXIgYXBwbHlBdHRyID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgYXR0ck5TID0gZ2V0TmFtZXNwYWNlKG5hbWUpO1xuICAgIGlmIChhdHRyTlMpIHtcbiAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKGF0dHJOUywgbmFtZSwgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBBcHBsaWVzIGEgcHJvcGVydHkgdG8gYSBnaXZlbiBFbGVtZW50LlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBwcm9wZXJ0eSdzIG5hbWUuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBwcm9wZXJ0eSdzIHZhbHVlLlxuICovXG52YXIgYXBwbHlQcm9wID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICBlbFtuYW1lXSA9IHZhbHVlO1xufTtcblxuLyoqXG4gKiBBcHBsaWVzIGEgc3R5bGUgdG8gYW4gRWxlbWVudC4gTm8gdmVuZG9yIHByZWZpeCBleHBhbnNpb24gaXMgZG9uZSBmb3JcbiAqIHByb3BlcnR5IG5hbWVzL3ZhbHVlcy5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Kn0gc3R5bGUgVGhlIHN0eWxlIHRvIHNldC4gRWl0aGVyIGEgc3RyaW5nIG9mIGNzcyBvciBhbiBvYmplY3RcbiAqICAgICBjb250YWluaW5nIHByb3BlcnR5LXZhbHVlIHBhaXJzLlxuICovXG52YXIgYXBwbHlTdHlsZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgc3R5bGUpIHtcbiAgaWYgKHR5cGVvZiBzdHlsZSA9PT0gJ3N0cmluZycpIHtcbiAgICBlbC5zdHlsZS5jc3NUZXh0ID0gc3R5bGU7XG4gIH0gZWxzZSB7XG4gICAgZWwuc3R5bGUuY3NzVGV4dCA9ICcnO1xuICAgIHZhciBlbFN0eWxlID0gZWwuc3R5bGU7XG4gICAgdmFyIG9iaiA9IC8qKiBAdHlwZSB7IU9iamVjdDxzdHJpbmcsc3RyaW5nPn0gKi9zdHlsZTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICBpZiAoaGFzKG9iaiwgcHJvcCkpIHtcbiAgICAgICAgZWxTdHlsZVtwcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogVXBkYXRlcyBhIHNpbmdsZSBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLiBJZiB0aGUgdmFsdWUgaXMgYW4gb2JqZWN0IG9yXG4gKiAgICAgZnVuY3Rpb24gaXQgaXMgc2V0IG9uIHRoZSBFbGVtZW50LCBvdGhlcndpc2UsIGl0IGlzIHNldCBhcyBhbiBIVE1MXG4gKiAgICAgYXR0cmlidXRlLlxuICovXG52YXIgYXBwbHlBdHRyaWJ1dGVUeXBlZCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG5cbiAgaWYgKHR5cGUgPT09ICdvYmplY3QnIHx8IHR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICBhcHBseVByb3AoZWwsIG5hbWUsIHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBhcHBseUF0dHIoZWwsIG5hbWUsIC8qKiBAdHlwZSB7Pyhib29sZWFufG51bWJlcnxzdHJpbmcpfSAqL3ZhbHVlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDYWxscyB0aGUgYXBwcm9wcmlhdGUgYXR0cmlidXRlIG11dGF0b3IgZm9yIHRoaXMgYXR0cmlidXRlLlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuXG4gKi9cbnZhciB1cGRhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShlbCk7XG4gIHZhciBhdHRycyA9IGRhdGEuYXR0cnM7XG5cbiAgaWYgKGF0dHJzW25hbWVdID09PSB2YWx1ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBtdXRhdG9yID0gYXR0cmlidXRlc1tuYW1lXSB8fCBhdHRyaWJ1dGVzW3N5bWJvbHMuZGVmYXVsdF07XG4gIG11dGF0b3IoZWwsIG5hbWUsIHZhbHVlKTtcblxuICBhdHRyc1tuYW1lXSA9IHZhbHVlO1xufTtcblxuLyoqXG4gKiBBIHB1YmxpY2x5IG11dGFibGUgb2JqZWN0IHRvIHByb3ZpZGUgY3VzdG9tIG11dGF0b3JzIGZvciBhdHRyaWJ1dGVzLlxuICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgZnVuY3Rpb24oIUVsZW1lbnQsIHN0cmluZywgKik+fVxuICovXG52YXIgYXR0cmlidXRlcyA9IGNyZWF0ZU1hcCgpO1xuXG4vLyBTcGVjaWFsIGdlbmVyaWMgbXV0YXRvciB0aGF0J3MgY2FsbGVkIGZvciBhbnkgYXR0cmlidXRlIHRoYXQgZG9lcyBub3Rcbi8vIGhhdmUgYSBzcGVjaWZpYyBtdXRhdG9yLlxuYXR0cmlidXRlc1tzeW1ib2xzLmRlZmF1bHRdID0gYXBwbHlBdHRyaWJ1dGVUeXBlZDtcblxuYXR0cmlidXRlc1tzeW1ib2xzLnBsYWNlaG9sZGVyXSA9IGZ1bmN0aW9uICgpIHt9O1xuXG5hdHRyaWJ1dGVzWydzdHlsZSddID0gYXBwbHlTdHlsZTtcblxuLyoqXG4gKiBHZXRzIHRoZSBuYW1lc3BhY2UgdG8gY3JlYXRlIGFuIGVsZW1lbnQgKG9mIGEgZ2l2ZW4gdGFnKSBpbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyB0byBnZXQgdGhlIG5hbWVzcGFjZSBmb3IuXG4gKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnRcbiAqIEByZXR1cm4gez9zdHJpbmd9IFRoZSBuYW1lc3BhY2UgdG8gY3JlYXRlIHRoZSB0YWcgaW4uXG4gKi9cbnZhciBnZXROYW1lc3BhY2VGb3JUYWcgPSBmdW5jdGlvbiAodGFnLCBwYXJlbnQpIHtcbiAgaWYgKHRhZyA9PT0gJ3N2ZycpIHtcbiAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbiAgfVxuXG4gIGlmIChnZXREYXRhKHBhcmVudCkubm9kZU5hbWUgPT09ICdmb3JlaWduT2JqZWN0Jykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHBhcmVudC5uYW1lc3BhY2VVUkk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudC5cbiAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyBUaGUgZG9jdW1lbnQgd2l0aCB3aGljaCB0byBjcmVhdGUgdGhlIEVsZW1lbnQuXG4gKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyBmb3IgdGhlIEVsZW1lbnQuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgQSBrZXkgdG8gaWRlbnRpZnkgdGhlIEVsZW1lbnQuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IUVsZW1lbnR9XG4gKi9cbnZhciBjcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24gKGRvYywgcGFyZW50LCB0YWcsIGtleSwgc3RhdGljcykge1xuICB2YXIgbmFtZXNwYWNlID0gZ2V0TmFtZXNwYWNlRm9yVGFnKHRhZywgcGFyZW50KTtcbiAgdmFyIGVsID0gdW5kZWZpbmVkO1xuXG4gIGlmIChuYW1lc3BhY2UpIHtcbiAgICBlbCA9IGRvYy5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCB0YWcpO1xuICB9IGVsc2Uge1xuICAgIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgfVxuXG4gIGluaXREYXRhKGVsLCB0YWcsIGtleSk7XG5cbiAgaWYgKHN0YXRpY3MpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YXRpY3MubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIHVwZGF0ZUF0dHJpYnV0ZShlbCwgLyoqIEB0eXBlIHshc3RyaW5nfSovc3RhdGljc1tpXSwgc3RhdGljc1tpICsgMV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBlbDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRleHQgTm9kZS5cbiAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyBUaGUgZG9jdW1lbnQgd2l0aCB3aGljaCB0byBjcmVhdGUgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshVGV4dH1cbiAqL1xudmFyIGNyZWF0ZVRleHQgPSBmdW5jdGlvbiAoZG9jKSB7XG4gIHZhciBub2RlID0gZG9jLmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgaW5pdERhdGEobm9kZSwgJyN0ZXh0JywgbnVsbCk7XG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbWFwcGluZyB0aGF0IGNhbiBiZSB1c2VkIHRvIGxvb2sgdXAgY2hpbGRyZW4gdXNpbmcgYSBrZXkuXG4gKiBAcGFyYW0gez9Ob2RlfSBlbFxuICogQHJldHVybiB7IU9iamVjdDxzdHJpbmcsICFFbGVtZW50Pn0gQSBtYXBwaW5nIG9mIGtleXMgdG8gdGhlIGNoaWxkcmVuIG9mIHRoZVxuICogICAgIEVsZW1lbnQuXG4gKi9cbnZhciBjcmVhdGVLZXlNYXAgPSBmdW5jdGlvbiAoZWwpIHtcbiAgdmFyIG1hcCA9IGNyZWF0ZU1hcCgpO1xuICB2YXIgY2hpbGQgPSBlbC5maXJzdEVsZW1lbnRDaGlsZDtcblxuICB3aGlsZSAoY2hpbGQpIHtcbiAgICB2YXIga2V5ID0gZ2V0RGF0YShjaGlsZCkua2V5O1xuXG4gICAgaWYgKGtleSkge1xuICAgICAgbWFwW2tleV0gPSBjaGlsZDtcbiAgICB9XG5cbiAgICBjaGlsZCA9IGNoaWxkLm5leHRFbGVtZW50U2libGluZztcbiAgfVxuXG4gIHJldHVybiBtYXA7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgbWFwcGluZyBvZiBrZXkgdG8gY2hpbGQgbm9kZSBmb3IgYSBnaXZlbiBFbGVtZW50LCBjcmVhdGluZyBpdFxuICogaWYgbmVjZXNzYXJ5LlxuICogQHBhcmFtIHs/Tm9kZX0gZWxcbiAqIEByZXR1cm4geyFPYmplY3Q8c3RyaW5nLCAhTm9kZT59IEEgbWFwcGluZyBvZiBrZXlzIHRvIGNoaWxkIEVsZW1lbnRzXG4gKi9cbnZhciBnZXRLZXlNYXAgPSBmdW5jdGlvbiAoZWwpIHtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKGVsKTtcblxuICBpZiAoIWRhdGEua2V5TWFwKSB7XG4gICAgZGF0YS5rZXlNYXAgPSBjcmVhdGVLZXlNYXAoZWwpO1xuICB9XG5cbiAgcmV0dXJuIGRhdGEua2V5TWFwO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSBjaGlsZCBmcm9tIHRoZSBwYXJlbnQgd2l0aCB0aGUgZ2l2ZW4ga2V5LlxuICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50XG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXlcbiAqIEByZXR1cm4gez9Ob2RlfSBUaGUgY2hpbGQgY29ycmVzcG9uZGluZyB0byB0aGUga2V5LlxuICovXG52YXIgZ2V0Q2hpbGQgPSBmdW5jdGlvbiAocGFyZW50LCBrZXkpIHtcbiAgcmV0dXJuIGtleSA/IGdldEtleU1hcChwYXJlbnQpW2tleV0gOiBudWxsO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gZWxlbWVudCBhcyBiZWluZyBhIGNoaWxkLiBUaGUgcGFyZW50IHdpbGwga2VlcCB0cmFjayBvZiB0aGVcbiAqIGNoaWxkIHVzaW5nIHRoZSBrZXkuIFRoZSBjaGlsZCBjYW4gYmUgcmV0cmlldmVkIHVzaW5nIHRoZSBzYW1lIGtleSB1c2luZ1xuICogZ2V0S2V5TWFwLiBUaGUgcHJvdmlkZWQga2V5IHNob3VsZCBiZSB1bmlxdWUgd2l0aGluIHRoZSBwYXJlbnQgRWxlbWVudC5cbiAqIEBwYXJhbSB7P05vZGV9IHBhcmVudCBUaGUgcGFyZW50IG9mIGNoaWxkLlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIGtleSB0byBpZGVudGlmeSB0aGUgY2hpbGQgd2l0aC5cbiAqIEBwYXJhbSB7IU5vZGV9IGNoaWxkIFRoZSBjaGlsZCB0byByZWdpc3Rlci5cbiAqL1xudmFyIHJlZ2lzdGVyQ2hpbGQgPSBmdW5jdGlvbiAocGFyZW50LCBrZXksIGNoaWxkKSB7XG4gIGdldEtleU1hcChwYXJlbnQpW2tleV0gPSBjaGlsZDtcbn07XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqIEBjb25zdCAqL1xudmFyIG5vdGlmaWNhdGlvbnMgPSB7XG4gIC8qKlxuICAgKiBDYWxsZWQgYWZ0ZXIgcGF0Y2ggaGFzIGNvbXBsZWF0ZWQgd2l0aCBhbnkgTm9kZXMgdGhhdCBoYXZlIGJlZW4gY3JlYXRlZFxuICAgKiBhbmQgYWRkZWQgdG8gdGhlIERPTS5cbiAgICogQHR5cGUgez9mdW5jdGlvbihBcnJheTwhTm9kZT4pfVxuICAgKi9cbiAgbm9kZXNDcmVhdGVkOiBudWxsLFxuXG4gIC8qKlxuICAgKiBDYWxsZWQgYWZ0ZXIgcGF0Y2ggaGFzIGNvbXBsZWF0ZWQgd2l0aCBhbnkgTm9kZXMgdGhhdCBoYXZlIGJlZW4gcmVtb3ZlZFxuICAgKiBmcm9tIHRoZSBET00uXG4gICAqIE5vdGUgaXQncyBhbiBhcHBsaWNhdGlvbnMgcmVzcG9uc2liaWxpdHkgdG8gaGFuZGxlIGFueSBjaGlsZE5vZGVzLlxuICAgKiBAdHlwZSB7P2Z1bmN0aW9uKEFycmF5PCFOb2RlPil9XG4gICAqL1xuICBub2Rlc0RlbGV0ZWQ6IG51bGxcbn07XG5cbi8qKlxuICogS2VlcHMgdHJhY2sgb2YgdGhlIHN0YXRlIG9mIGEgcGF0Y2guXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQ29udGV4dCgpIHtcbiAgLyoqXG4gICAqIEB0eXBlIHsoQXJyYXk8IU5vZGU+fHVuZGVmaW5lZCl9XG4gICAqL1xuICB0aGlzLmNyZWF0ZWQgPSBub3RpZmljYXRpb25zLm5vZGVzQ3JlYXRlZCAmJiBbXTtcblxuICAvKipcbiAgICogQHR5cGUgeyhBcnJheTwhTm9kZT58dW5kZWZpbmVkKX1cbiAgICovXG4gIHRoaXMuZGVsZXRlZCA9IG5vdGlmaWNhdGlvbnMubm9kZXNEZWxldGVkICYmIFtdO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAqL1xuQ29udGV4dC5wcm90b3R5cGUubWFya0NyZWF0ZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICBpZiAodGhpcy5jcmVhdGVkKSB7XG4gICAgdGhpcy5jcmVhdGVkLnB1c2gobm9kZSk7XG4gIH1cbn07XG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICovXG5Db250ZXh0LnByb3RvdHlwZS5tYXJrRGVsZXRlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIGlmICh0aGlzLmRlbGV0ZWQpIHtcbiAgICB0aGlzLmRlbGV0ZWQucHVzaChub2RlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBOb3RpZmllcyBhYm91dCBub2RlcyB0aGF0IHdlcmUgY3JlYXRlZCBkdXJpbmcgdGhlIHBhdGNoIG9wZWFyYXRpb24uXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLm5vdGlmeUNoYW5nZXMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmNyZWF0ZWQgJiYgdGhpcy5jcmVhdGVkLmxlbmd0aCA+IDApIHtcbiAgICBub3RpZmljYXRpb25zLm5vZGVzQ3JlYXRlZCh0aGlzLmNyZWF0ZWQpO1xuICB9XG5cbiAgaWYgKHRoaXMuZGVsZXRlZCAmJiB0aGlzLmRlbGV0ZWQubGVuZ3RoID4gMCkge1xuICAgIG5vdGlmaWNhdGlvbnMubm9kZXNEZWxldGVkKHRoaXMuZGVsZXRlZCk7XG4gIH1cbn07XG5cbi8qKlxuKiBNYWtlcyBzdXJlIHRoYXQga2V5ZWQgRWxlbWVudCBtYXRjaGVzIHRoZSB0YWcgbmFtZSBwcm92aWRlZC5cbiogQHBhcmFtIHshc3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZU5hbWUgb2YgdGhlIG5vZGUgdGhhdCBpcyBiZWluZyBtYXRjaGVkLlxuKiBAcGFyYW0ge3N0cmluZz19IHRhZyBUaGUgdGFnIG5hbWUgb2YgdGhlIEVsZW1lbnQuXG4qIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IG9mIHRoZSBFbGVtZW50LlxuKi9cbnZhciBhc3NlcnRLZXllZFRhZ01hdGNoZXMgPSBmdW5jdGlvbiAobm9kZU5hbWUsIHRhZywga2V5KSB7XG4gIGlmIChub2RlTmFtZSAhPT0gdGFnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdXYXMgZXhwZWN0aW5nIG5vZGUgd2l0aCBrZXkgXCInICsga2V5ICsgJ1wiIHRvIGJlIGEgJyArIHRhZyArICcsIG5vdCBhICcgKyBub2RlTmFtZSArICcuJyk7XG4gIH1cbn07XG5cbi8qKiBAdHlwZSB7P0NvbnRleHR9ICovXG52YXIgY29udGV4dCA9IG51bGw7XG5cbi8qKiBAdHlwZSB7P05vZGV9ICovXG52YXIgY3VycmVudE5vZGUgPSBudWxsO1xuXG4vKiogQHR5cGUgez9Ob2RlfSAqL1xudmFyIGN1cnJlbnRQYXJlbnQgPSBudWxsO1xuXG4vKiogQHR5cGUgez9FbGVtZW50fD9Eb2N1bWVudEZyYWdtZW50fSAqL1xudmFyIHJvb3QgPSBudWxsO1xuXG4vKiogQHR5cGUgez9Eb2N1bWVudH0gKi9cbnZhciBkb2MgPSBudWxsO1xuXG4vKipcbiAqIFJldHVybnMgYSBwYXRjaGVyIGZ1bmN0aW9uIHRoYXQgc2V0cyB1cCBhbmQgcmVzdG9yZXMgYSBwYXRjaCBjb250ZXh0LFxuICogcnVubmluZyB0aGUgcnVuIGZ1bmN0aW9uIHdpdGggdGhlIHByb3ZpZGVkIGRhdGEuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCghRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudCksIWZ1bmN0aW9uKFQpLFQ9KX0gcnVuXG4gKiBAcmV0dXJuIHtmdW5jdGlvbigoIUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnQpLCFmdW5jdGlvbihUKSxUPSl9XG4gKiBAdGVtcGxhdGUgVFxuICovXG52YXIgcGF0Y2hGYWN0b3J5ID0gZnVuY3Rpb24gKHJ1bikge1xuICAvKipcbiAgICogVE9ETyhtb3opOiBUaGVzZSBhbm5vdGF0aW9ucyB3b24ndCBiZSBuZWNlc3Nhcnkgb25jZSB3ZSBzd2l0Y2ggdG8gQ2xvc3VyZVxuICAgKiBDb21waWxlcidzIG5ldyB0eXBlIGluZmVyZW5jZS4gUmVtb3ZlIHRoZXNlIG9uY2UgdGhlIHN3aXRjaCBpcyBkb25lLlxuICAgKlxuICAgKiBAcGFyYW0geyghRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudCl9IG5vZGVcbiAgICogQHBhcmFtIHshZnVuY3Rpb24oVCl9IGZuXG4gICAqIEBwYXJhbSB7VD19IGRhdGFcbiAgICogQHRlbXBsYXRlIFRcbiAgICovXG4gIHZhciBmID0gZnVuY3Rpb24gKG5vZGUsIGZuLCBkYXRhKSB7XG4gICAgdmFyIHByZXZDb250ZXh0ID0gY29udGV4dDtcbiAgICB2YXIgcHJldlJvb3QgPSByb290O1xuICAgIHZhciBwcmV2RG9jID0gZG9jO1xuICAgIHZhciBwcmV2Q3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZTtcbiAgICB2YXIgcHJldkN1cnJlbnRQYXJlbnQgPSBjdXJyZW50UGFyZW50O1xuICAgIHZhciBwcmV2aW91c0luQXR0cmlidXRlcyA9IGZhbHNlO1xuICAgIHZhciBwcmV2aW91c0luU2tpcCA9IGZhbHNlO1xuXG4gICAgY29udGV4dCA9IG5ldyBDb250ZXh0KCk7XG4gICAgcm9vdCA9IG5vZGU7XG4gICAgZG9jID0gbm9kZS5vd25lckRvY3VtZW50O1xuICAgIGN1cnJlbnRQYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XG5cbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgICBydW4obm9kZSwgZm4sIGRhdGEpO1xuXG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgY29udGV4dC5ub3RpZnlDaGFuZ2VzKCk7XG5cbiAgICBjb250ZXh0ID0gcHJldkNvbnRleHQ7XG4gICAgcm9vdCA9IHByZXZSb290O1xuICAgIGRvYyA9IHByZXZEb2M7XG4gICAgY3VycmVudE5vZGUgPSBwcmV2Q3VycmVudE5vZGU7XG4gICAgY3VycmVudFBhcmVudCA9IHByZXZDdXJyZW50UGFyZW50O1xuICB9O1xuICByZXR1cm4gZjtcbn07XG5cbi8qKlxuICogUGF0Y2hlcyB0aGUgZG9jdW1lbnQgc3RhcnRpbmcgYXQgbm9kZSB3aXRoIHRoZSBwcm92aWRlZCBmdW5jdGlvbi4gVGhpc1xuICogZnVuY3Rpb24gbWF5IGJlIGNhbGxlZCBkdXJpbmcgYW4gZXhpc3RpbmcgcGF0Y2ggb3BlcmF0aW9uLlxuICogQHBhcmFtIHshRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudH0gbm9kZSBUaGUgRWxlbWVudCBvciBEb2N1bWVudFxuICogICAgIHRvIHBhdGNoLlxuICogQHBhcmFtIHshZnVuY3Rpb24oVCl9IGZuIEEgZnVuY3Rpb24gY29udGFpbmluZyBlbGVtZW50T3Blbi9lbGVtZW50Q2xvc2UvZXRjLlxuICogICAgIGNhbGxzIHRoYXQgZGVzY3JpYmUgdGhlIERPTS5cbiAqIEBwYXJhbSB7VD19IGRhdGEgQW4gYXJndW1lbnQgcGFzc2VkIHRvIGZuIHRvIHJlcHJlc2VudCBET00gc3RhdGUuXG4gKiBAdGVtcGxhdGUgVFxuICovXG52YXIgcGF0Y2hJbm5lciA9IHBhdGNoRmFjdG9yeShmdW5jdGlvbiAobm9kZSwgZm4sIGRhdGEpIHtcbiAgY3VycmVudE5vZGUgPSBub2RlO1xuXG4gIGVudGVyTm9kZSgpO1xuICBmbihkYXRhKTtcbiAgZXhpdE5vZGUoKTtcblxuICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG59KTtcblxuLyoqXG4gKiBQYXRjaGVzIGFuIEVsZW1lbnQgd2l0aCB0aGUgdGhlIHByb3ZpZGVkIGZ1bmN0aW9uLiBFeGFjdGx5IG9uZSB0b3AgbGV2ZWxcbiAqIGVsZW1lbnQgY2FsbCBzaG91bGQgYmUgbWFkZSBjb3JyZXNwb25kaW5nIHRvIGBub2RlYC5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IG5vZGUgVGhlIEVsZW1lbnQgd2hlcmUgdGhlIHBhdGNoIHNob3VsZCBzdGFydC5cbiAqIEBwYXJhbSB7IWZ1bmN0aW9uKFQpfSBmbiBBIGZ1bmN0aW9uIGNvbnRhaW5pbmcgZWxlbWVudE9wZW4vZWxlbWVudENsb3NlL2V0Yy5cbiAqICAgICBjYWxscyB0aGF0IGRlc2NyaWJlIHRoZSBET00uIFRoaXMgc2hvdWxkIGhhdmUgYXQgbW9zdCBvbmUgdG9wIGxldmVsXG4gKiAgICAgZWxlbWVudCBjYWxsLlxuICogQHBhcmFtIHtUPX0gZGF0YSBBbiBhcmd1bWVudCBwYXNzZWQgdG8gZm4gdG8gcmVwcmVzZW50IERPTSBzdGF0ZS5cbiAqIEB0ZW1wbGF0ZSBUXG4gKi9cbnZhciBwYXRjaE91dGVyID0gcGF0Y2hGYWN0b3J5KGZ1bmN0aW9uIChub2RlLCBmbiwgZGF0YSkge1xuICBjdXJyZW50Tm9kZSA9IC8qKiBAdHlwZSB7IUVsZW1lbnR9ICoveyBuZXh0U2libGluZzogbm9kZSB9O1xuXG4gIGZuKGRhdGEpO1xuXG4gIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cbn0pO1xuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIG9yIG5vdCB0aGUgY3VycmVudCBub2RlIG1hdGNoZXMgdGhlIHNwZWNpZmllZCBub2RlTmFtZSBhbmRcbiAqIGtleS5cbiAqXG4gKiBAcGFyYW0gez9zdHJpbmd9IG5vZGVOYW1lIFRoZSBub2RlTmFtZSBmb3IgdGhpcyBub2RlLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IEFuIG9wdGlvbmFsIGtleSB0aGF0IGlkZW50aWZpZXMgYSBub2RlLlxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgbm9kZSBtYXRjaGVzLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbnZhciBtYXRjaGVzID0gZnVuY3Rpb24gKG5vZGVOYW1lLCBrZXkpIHtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKGN1cnJlbnROb2RlKTtcblxuICAvLyBLZXkgY2hlY2sgaXMgZG9uZSB1c2luZyBkb3VibGUgZXF1YWxzIGFzIHdlIHdhbnQgdG8gdHJlYXQgYSBudWxsIGtleSB0aGVcbiAgLy8gc2FtZSBhcyB1bmRlZmluZWQuIFRoaXMgc2hvdWxkIGJlIG9rYXkgYXMgdGhlIG9ubHkgdmFsdWVzIGFsbG93ZWQgYXJlXG4gIC8vIHN0cmluZ3MsIG51bGwgYW5kIHVuZGVmaW5lZCBzbyB0aGUgPT0gc2VtYW50aWNzIGFyZSBub3QgdG9vIHdlaXJkLlxuICByZXR1cm4gbm9kZU5hbWUgPT09IGRhdGEubm9kZU5hbWUgJiYga2V5ID09IGRhdGEua2V5O1xufTtcblxuLyoqXG4gKiBBbGlnbnMgdGhlIHZpcnR1YWwgRWxlbWVudCBkZWZpbml0aW9uIHdpdGggdGhlIGFjdHVhbCBET00sIG1vdmluZyB0aGVcbiAqIGNvcnJlc3BvbmRpbmcgRE9NIG5vZGUgdG8gdGhlIGNvcnJlY3QgbG9jYXRpb24gb3IgY3JlYXRpbmcgaXQgaWYgbmVjZXNzYXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVOYW1lIEZvciBhbiBFbGVtZW50LCB0aGlzIHNob3VsZCBiZSBhIHZhbGlkIHRhZyBzdHJpbmcuXG4gKiAgICAgRm9yIGEgVGV4dCwgdGhpcyBzaG91bGQgYmUgI3RleHQuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBGb3IgYW4gRWxlbWVudCwgdGhpcyBzaG91bGQgYmUgYW4gYXJyYXkgb2ZcbiAqICAgICBuYW1lLXZhbHVlIHBhaXJzLlxuICovXG52YXIgYWxpZ25XaXRoRE9NID0gZnVuY3Rpb24gKG5vZGVOYW1lLCBrZXksIHN0YXRpY3MpIHtcbiAgaWYgKGN1cnJlbnROb2RlICYmIG1hdGNoZXMobm9kZU5hbWUsIGtleSkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgbm9kZSA9IHVuZGVmaW5lZDtcblxuICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIG5vZGUgaGFzIG1vdmVkIHdpdGhpbiB0aGUgcGFyZW50LlxuICBpZiAoa2V5KSB7XG4gICAgbm9kZSA9IGdldENoaWxkKGN1cnJlbnRQYXJlbnQsIGtleSk7XG4gICAgaWYgKG5vZGUgJiYgJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGFzc2VydEtleWVkVGFnTWF0Y2hlcyhnZXREYXRhKG5vZGUpLm5vZGVOYW1lLCBub2RlTmFtZSwga2V5KTtcbiAgICB9XG4gIH1cblxuICAvLyBDcmVhdGUgdGhlIG5vZGUgaWYgaXQgZG9lc24ndCBleGlzdC5cbiAgaWYgKCFub2RlKSB7XG4gICAgaWYgKG5vZGVOYW1lID09PSAnI3RleHQnKSB7XG4gICAgICBub2RlID0gY3JlYXRlVGV4dChkb2MpO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlID0gY3JlYXRlRWxlbWVudChkb2MsIGN1cnJlbnRQYXJlbnQsIG5vZGVOYW1lLCBrZXksIHN0YXRpY3MpO1xuICAgIH1cblxuICAgIGlmIChrZXkpIHtcbiAgICAgIHJlZ2lzdGVyQ2hpbGQoY3VycmVudFBhcmVudCwga2V5LCBub2RlKTtcbiAgICB9XG5cbiAgICBjb250ZXh0Lm1hcmtDcmVhdGVkKG5vZGUpO1xuICB9XG5cbiAgLy8gSWYgdGhlIG5vZGUgaGFzIGEga2V5LCByZW1vdmUgaXQgZnJvbSB0aGUgRE9NIHRvIHByZXZlbnQgYSBsYXJnZSBudW1iZXJcbiAgLy8gb2YgcmUtb3JkZXJzIGluIHRoZSBjYXNlIHRoYXQgaXQgbW92ZWQgZmFyIG9yIHdhcyBjb21wbGV0ZWx5IHJlbW92ZWQuXG4gIC8vIFNpbmNlIHdlIGhvbGQgb24gdG8gYSByZWZlcmVuY2UgdGhyb3VnaCB0aGUga2V5TWFwLCB3ZSBjYW4gYWx3YXlzIGFkZCBpdFxuICAvLyBiYWNrLlxuICBpZiAoY3VycmVudE5vZGUgJiYgZ2V0RGF0YShjdXJyZW50Tm9kZSkua2V5KSB7XG4gICAgY3VycmVudFBhcmVudC5yZXBsYWNlQ2hpbGQobm9kZSwgY3VycmVudE5vZGUpO1xuICAgIGdldERhdGEoY3VycmVudFBhcmVudCkua2V5TWFwVmFsaWQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBjdXJyZW50UGFyZW50Lmluc2VydEJlZm9yZShub2RlLCBjdXJyZW50Tm9kZSk7XG4gIH1cblxuICBjdXJyZW50Tm9kZSA9IG5vZGU7XG59O1xuXG4vKipcbiAqIENsZWFycyBvdXQgYW55IHVudmlzaXRlZCBOb2RlcywgYXMgdGhlIGNvcnJlc3BvbmRpbmcgdmlydHVhbCBlbGVtZW50XG4gKiBmdW5jdGlvbnMgd2VyZSBuZXZlciBjYWxsZWQgZm9yIHRoZW0uXG4gKi9cbnZhciBjbGVhclVudmlzaXRlZERPTSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5vZGUgPSBjdXJyZW50UGFyZW50O1xuICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG4gIHZhciBrZXlNYXAgPSBkYXRhLmtleU1hcDtcbiAgdmFyIGtleU1hcFZhbGlkID0gZGF0YS5rZXlNYXBWYWxpZDtcbiAgdmFyIGNoaWxkID0gbm9kZS5sYXN0Q2hpbGQ7XG4gIHZhciBrZXkgPSB1bmRlZmluZWQ7XG5cbiAgaWYgKGNoaWxkID09PSBjdXJyZW50Tm9kZSAmJiBrZXlNYXBWYWxpZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChkYXRhLmF0dHJzW3N5bWJvbHMucGxhY2Vob2xkZXJdICYmIG5vZGUgIT09IHJvb3QpIHtcbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgd2hpbGUgKGNoaWxkICE9PSBjdXJyZW50Tm9kZSkge1xuICAgIG5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICAgIGNvbnRleHQubWFya0RlbGV0ZWQoIC8qKiBAdHlwZSB7IU5vZGV9Ki9jaGlsZCk7XG5cbiAgICBrZXkgPSBnZXREYXRhKGNoaWxkKS5rZXk7XG4gICAgaWYgKGtleSkge1xuICAgICAgZGVsZXRlIGtleU1hcFtrZXldO1xuICAgIH1cbiAgICBjaGlsZCA9IG5vZGUubGFzdENoaWxkO1xuICB9XG5cbiAgLy8gQ2xlYW4gdGhlIGtleU1hcCwgcmVtb3ZpbmcgYW55IHVudXN1ZWQga2V5cy5cbiAgaWYgKCFrZXlNYXBWYWxpZCkge1xuICAgIGZvciAoa2V5IGluIGtleU1hcCkge1xuICAgICAgY2hpbGQgPSBrZXlNYXBba2V5XTtcbiAgICAgIGlmIChjaGlsZC5wYXJlbnROb2RlICE9PSBub2RlKSB7XG4gICAgICAgIGNvbnRleHQubWFya0RlbGV0ZWQoY2hpbGQpO1xuICAgICAgICBkZWxldGUga2V5TWFwW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGF0YS5rZXlNYXBWYWxpZCA9IHRydWU7XG4gIH1cbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0byB0aGUgZmlyc3QgY2hpbGQgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAqL1xudmFyIGVudGVyTm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgY3VycmVudFBhcmVudCA9IGN1cnJlbnROb2RlO1xuICBjdXJyZW50Tm9kZSA9IG51bGw7XG59O1xuXG4vKipcbiAqIENoYW5nZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgY3VycmVudCBub2RlLlxuICovXG52YXIgbmV4dE5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChjdXJyZW50Tm9kZSkge1xuICAgIGN1cnJlbnROb2RlID0gY3VycmVudE5vZGUubmV4dFNpYmxpbmc7XG4gIH0gZWxzZSB7XG4gICAgY3VycmVudE5vZGUgPSBjdXJyZW50UGFyZW50LmZpcnN0Q2hpbGQ7XG4gIH1cbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0byB0aGUgcGFyZW50IG9mIHRoZSBjdXJyZW50IG5vZGUsIHJlbW92aW5nIGFueSB1bnZpc2l0ZWQgY2hpbGRyZW4uXG4gKi9cbnZhciBleGl0Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgY2xlYXJVbnZpc2l0ZWRET00oKTtcblxuICBjdXJyZW50Tm9kZSA9IGN1cnJlbnRQYXJlbnQ7XG4gIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50UGFyZW50LnBhcmVudE5vZGU7XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY3VycmVudCBub2RlIGlzIGFuIEVsZW1lbnQgd2l0aCBhIG1hdGNoaW5nIHRhZ05hbWUgYW5kXG4gKiBrZXkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGNvcmVFbGVtZW50T3BlbiA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcykge1xuICBuZXh0Tm9kZSgpO1xuICBhbGlnbldpdGhET00odGFnLCBrZXksIHN0YXRpY3MpO1xuICBlbnRlck5vZGUoKTtcbiAgcmV0dXJuICgvKiogQHR5cGUgeyFFbGVtZW50fSAqL2N1cnJlbnRQYXJlbnRcbiAgKTtcbn07XG5cbi8qKlxuICogQ2xvc2VzIHRoZSBjdXJyZW50bHkgb3BlbiBFbGVtZW50LCByZW1vdmluZyBhbnkgdW52aXNpdGVkIGNoaWxkcmVuIGlmXG4gKiBuZWNlc3NhcnkuXG4gKlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBjb3JlRWxlbWVudENsb3NlID0gZnVuY3Rpb24gKCkge1xuICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgZXhpdE5vZGUoKTtcbiAgcmV0dXJuICgvKiogQHR5cGUgeyFFbGVtZW50fSAqL2N1cnJlbnROb2RlXG4gICk7XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhlIGN1cnJlbnQgbm9kZSBpcyBhIFRleHQgbm9kZSBhbmQgY3JlYXRlcyBhIFRleHQgbm9kZSBpZiBpdCBpc1xuICogbm90LlxuICpcbiAqIEByZXR1cm4geyFUZXh0fSBUaGUgY29ycmVzcG9uZGluZyBUZXh0IE5vZGUuXG4gKi9cbnZhciBjb3JlVGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgbmV4dE5vZGUoKTtcbiAgYWxpZ25XaXRoRE9NKCcjdGV4dCcsIG51bGwsIG51bGwpO1xuICByZXR1cm4gKC8qKiBAdHlwZSB7IVRleHR9ICovY3VycmVudE5vZGVcbiAgKTtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgY3VycmVudCBFbGVtZW50IGJlaW5nIHBhdGNoZWQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH1cbiAqL1xudmFyIGN1cnJlbnRFbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG4gIHJldHVybiAoLyoqIEB0eXBlIHshRWxlbWVudH0gKi9jdXJyZW50UGFyZW50XG4gICk7XG59O1xuXG4vKipcbiAqIFNraXBzIHRoZSBjaGlsZHJlbiBpbiBhIHN1YnRyZWUsIGFsbG93aW5nIGFuIEVsZW1lbnQgdG8gYmUgY2xvc2VkIHdpdGhvdXRcbiAqIGNsZWFyaW5nIG91dCB0aGUgY2hpbGRyZW4uXG4gKi9cbnZhciBza2lwID0gZnVuY3Rpb24gKCkge1xuICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG4gIGN1cnJlbnROb2RlID0gY3VycmVudFBhcmVudC5sYXN0Q2hpbGQ7XG59O1xuXG4vKipcbiAqIFRoZSBvZmZzZXQgaW4gdGhlIHZpcnR1YWwgZWxlbWVudCBkZWNsYXJhdGlvbiB3aGVyZSB0aGUgYXR0cmlidXRlcyBhcmVcbiAqIHNwZWNpZmllZC5cbiAqIEBjb25zdFxuICovXG52YXIgQVRUUklCVVRFU19PRkZTRVQgPSAzO1xuXG4vKipcbiAqIEJ1aWxkcyBhbiBhcnJheSBvZiBhcmd1bWVudHMgZm9yIHVzZSB3aXRoIGVsZW1lbnRPcGVuU3RhcnQsIGF0dHIgYW5kXG4gKiBlbGVtZW50T3BlbkVuZC5cbiAqIEBjb25zdCB7QXJyYXk8Kj59XG4gKi9cbnZhciBhcmdzQnVpbGRlciA9IFtdO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICogQHBhcmFtIHsuLi4qfSBjb25zdF9hcmdzIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAqICAgICBmb3IgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGVsZW1lbnRPcGVuID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCBjb25zdF9hcmdzKSB7XG4gIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICB2YXIgbm9kZSA9IGNvcmVFbGVtZW50T3Blbih0YWcsIGtleSwgc3RhdGljcyk7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcblxuICAvKlxuICAgKiBDaGVja3MgdG8gc2VlIGlmIG9uZSBvciBtb3JlIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkIGZvciBhIGdpdmVuIEVsZW1lbnQuXG4gICAqIFdoZW4gbm8gYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQsIHRoaXMgaXMgbXVjaCBmYXN0ZXIgdGhhbiBjaGVja2luZyBlYWNoXG4gICAqIGluZGl2aWR1YWwgYXJndW1lbnQuIFdoZW4gYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQsIHRoZSBvdmVyaGVhZCBvZiB0aGlzIGlzXG4gICAqIG1pbmltYWwuXG4gICAqL1xuICB2YXIgYXR0cnNBcnIgPSBkYXRhLmF0dHJzQXJyO1xuICB2YXIgbmV3QXR0cnMgPSBkYXRhLm5ld0F0dHJzO1xuICB2YXIgYXR0cnNDaGFuZ2VkID0gZmFsc2U7XG4gIHZhciBpID0gQVRUUklCVVRFU19PRkZTRVQ7XG4gIHZhciBqID0gMDtcblxuICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSwgaiArPSAxKSB7XG4gICAgaWYgKGF0dHJzQXJyW2pdICE9PSBhcmd1bWVudHNbaV0pIHtcbiAgICAgIGF0dHJzQ2hhbmdlZCA9IHRydWU7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSwgaiArPSAxKSB7XG4gICAgYXR0cnNBcnJbal0gPSBhcmd1bWVudHNbaV07XG4gIH1cblxuICBpZiAoaiA8IGF0dHJzQXJyLmxlbmd0aCkge1xuICAgIGF0dHJzQ2hhbmdlZCA9IHRydWU7XG4gICAgYXR0cnNBcnIubGVuZ3RoID0gajtcbiAgfVxuXG4gIC8qXG4gICAqIEFjdHVhbGx5IHBlcmZvcm0gdGhlIGF0dHJpYnV0ZSB1cGRhdGUuXG4gICAqL1xuICBpZiAoYXR0cnNDaGFuZ2VkKSB7XG4gICAgZm9yIChpID0gQVRUUklCVVRFU19PRkZTRVQ7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIG5ld0F0dHJzW2FyZ3VtZW50c1tpXV0gPSBhcmd1bWVudHNbaSArIDFdO1xuICAgIH1cblxuICAgIGZvciAodmFyIF9hdHRyIGluIG5ld0F0dHJzKSB7XG4gICAgICB1cGRhdGVBdHRyaWJ1dGUobm9kZSwgX2F0dHIsIG5ld0F0dHJzW19hdHRyXSk7XG4gICAgICBuZXdBdHRyc1tfYXR0cl0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudC4gVGhpc1xuICogY29ycmVzcG9uZHMgdG8gYW4gb3BlbmluZyB0YWcgYW5kIGEgZWxlbWVudENsb3NlIHRhZyBpcyByZXF1aXJlZC4gVGhpcyBpc1xuICogbGlrZSBlbGVtZW50T3BlbiwgYnV0IHRoZSBhdHRyaWJ1dGVzIGFyZSBkZWZpbmVkIHVzaW5nIHRoZSBhdHRyIGZ1bmN0aW9uXG4gKiByYXRoZXIgdGhhbiBiZWluZyBwYXNzZWQgYXMgYXJndW1lbnRzLiBNdXN0IGJlIGZvbGxsb3dlZCBieSAwIG9yIG1vcmUgY2FsbHNcbiAqIHRvIGF0dHIsIHRoZW4gYSBjYWxsIHRvIGVsZW1lbnRPcGVuRW5kLlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKi9cbnZhciBlbGVtZW50T3BlblN0YXJ0ID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzKSB7XG4gIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICBhcmdzQnVpbGRlclswXSA9IHRhZztcbiAgYXJnc0J1aWxkZXJbMV0gPSBrZXk7XG4gIGFyZ3NCdWlsZGVyWzJdID0gc3RhdGljcztcbn07XG5cbi8qKipcbiAqIERlZmluZXMgYSB2aXJ0dWFsIGF0dHJpYnV0ZSBhdCB0aGlzIHBvaW50IG9mIHRoZSBET00uIFRoaXMgaXMgb25seSB2YWxpZFxuICogd2hlbiBjYWxsZWQgYmV0d2VlbiBlbGVtZW50T3BlblN0YXJ0IGFuZCBlbGVtZW50T3BlbkVuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICovXG52YXIgYXR0ciA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgYXJnc0J1aWxkZXIucHVzaChuYW1lLCB2YWx1ZSk7XG59O1xuXG4vKipcbiAqIENsb3NlcyBhbiBvcGVuIHRhZyBzdGFydGVkIHdpdGggZWxlbWVudE9wZW5TdGFydC5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgZWxlbWVudE9wZW5FbmQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICB2YXIgbm9kZSA9IGVsZW1lbnRPcGVuLmFwcGx5KG51bGwsIGFyZ3NCdWlsZGVyKTtcbiAgYXJnc0J1aWxkZXIubGVuZ3RoID0gMDtcbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIENsb3NlcyBhbiBvcGVuIHZpcnR1YWwgRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBlbGVtZW50Q2xvc2UgPSBmdW5jdGlvbiAodGFnKSB7XG4gIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICB2YXIgbm9kZSA9IGNvcmVFbGVtZW50Q2xvc2UoKTtcblxuICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudCB0aGF0IGhhc1xuICogbm8gY2hpbGRyZW4uXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAqIEBwYXJhbSB7Li4uKn0gY29uc3RfYXJncyBBdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGUgZHluYW1pYyBhdHRyaWJ1dGVzXG4gKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBlbGVtZW50Vm9pZCA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcywgY29uc3RfYXJncykge1xuICBlbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICByZXR1cm4gZWxlbWVudENsb3NlKHRhZyk7XG59O1xuXG4vKipcbiAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudCB0aGF0IGlzIGFcbiAqIHBsYWNlaG9sZGVyIGVsZW1lbnQuIENoaWxkcmVuIG9mIHRoaXMgRWxlbWVudCBjYW4gYmUgbWFudWFsbHkgbWFuYWdlZCBhbmRcbiAqIHdpbGwgbm90IGJlIGNsZWFyZWQgYnkgdGhlIGxpYnJhcnkuXG4gKlxuICogQSBrZXkgbXVzdCBiZSBzcGVjaWZpZWQgdG8gbWFrZSBzdXJlIHRoYXQgdGhpcyBub2RlIGlzIGNvcnJlY3RseSBwcmVzZXJ2ZWRcbiAqIGFjcm9zcyBhbGwgY29uZGl0aW9uYWxzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKiBAcGFyYW0gey4uLip9IGNvbnN0X2FyZ3MgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICogICAgIGZvciB0aGUgRWxlbWVudC5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgZWxlbWVudFBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCBjb25zdF9hcmdzKSB7XG4gIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICBlbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICBza2lwKCk7XG4gIHJldHVybiBlbGVtZW50Q2xvc2UodGFnKTtcbn07XG5cbi8qKlxuICogRGVjbGFyZXMgYSB2aXJ0dWFsIFRleHQgYXQgdGhpcyBwb2ludCBpbiB0aGUgZG9jdW1lbnQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfGJvb2xlYW59IHZhbHVlIFRoZSB2YWx1ZSBvZiB0aGUgVGV4dC5cbiAqIEBwYXJhbSB7Li4uKGZ1bmN0aW9uKChzdHJpbmd8bnVtYmVyfGJvb2xlYW4pKTpzdHJpbmcpfSBjb25zdF9hcmdzXG4gKiAgICAgRnVuY3Rpb25zIHRvIGZvcm1hdCB0aGUgdmFsdWUgd2hpY2ggYXJlIGNhbGxlZCBvbmx5IHdoZW4gdGhlIHZhbHVlIGhhc1xuICogICAgIGNoYW5nZWQuXG4gKiBAcmV0dXJuIHshVGV4dH0gVGhlIGNvcnJlc3BvbmRpbmcgdGV4dCBub2RlLlxuICovXG52YXIgdGV4dCA9IGZ1bmN0aW9uICh2YWx1ZSwgY29uc3RfYXJncykge1xuICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgdmFyIG5vZGUgPSBjb3JlVGV4dCgpO1xuICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG5cbiAgaWYgKGRhdGEudGV4dCAhPT0gdmFsdWUpIHtcbiAgICBkYXRhLnRleHQgPSAvKiogQHR5cGUge3N0cmluZ30gKi92YWx1ZTtcblxuICAgIHZhciBmb3JtYXR0ZWQgPSB2YWx1ZTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgLypcbiAgICAgICAqIENhbGwgdGhlIGZvcm1hdHRlciBmdW5jdGlvbiBkaXJlY3RseSB0byBwcmV2ZW50IGxlYWtpbmcgYXJndW1lbnRzLlxuICAgICAgICogaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZS9pbmNyZW1lbnRhbC1kb20vcHVsbC8yMDQjaXNzdWVjb21tZW50LTE3ODIyMzU3NFxuICAgICAgICovXG4gICAgICB2YXIgZm4gPSBhcmd1bWVudHNbaV07XG4gICAgICBmb3JtYXR0ZWQgPSBmbihmb3JtYXR0ZWQpO1xuICAgIH1cblxuICAgIG5vZGUuZGF0YSA9IGZvcm1hdHRlZDtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufTtcblxuZXhwb3J0cy5wYXRjaCA9IHBhdGNoSW5uZXI7XG5leHBvcnRzLnBhdGNoSW5uZXIgPSBwYXRjaElubmVyO1xuZXhwb3J0cy5wYXRjaE91dGVyID0gcGF0Y2hPdXRlcjtcbmV4cG9ydHMuY3VycmVudEVsZW1lbnQgPSBjdXJyZW50RWxlbWVudDtcbmV4cG9ydHMuc2tpcCA9IHNraXA7XG5leHBvcnRzLmVsZW1lbnRWb2lkID0gZWxlbWVudFZvaWQ7XG5leHBvcnRzLmVsZW1lbnRPcGVuU3RhcnQgPSBlbGVtZW50T3BlblN0YXJ0O1xuZXhwb3J0cy5lbGVtZW50T3BlbkVuZCA9IGVsZW1lbnRPcGVuRW5kO1xuZXhwb3J0cy5lbGVtZW50T3BlbiA9IGVsZW1lbnRPcGVuO1xuZXhwb3J0cy5lbGVtZW50Q2xvc2UgPSBlbGVtZW50Q2xvc2U7XG5leHBvcnRzLmVsZW1lbnRQbGFjZWhvbGRlciA9IGVsZW1lbnRQbGFjZWhvbGRlcjtcbmV4cG9ydHMudGV4dCA9IHRleHQ7XG5leHBvcnRzLmF0dHIgPSBhdHRyO1xuZXhwb3J0cy5zeW1ib2xzID0gc3ltYm9scztcbmV4cG9ydHMuYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7XG5leHBvcnRzLmFwcGx5QXR0ciA9IGFwcGx5QXR0cjtcbmV4cG9ydHMuYXBwbHlQcm9wID0gYXBwbHlQcm9wO1xuZXhwb3J0cy5ub3RpZmljYXRpb25zID0gbm90aWZpY2F0aW9ucztcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5jcmVtZW50YWwtZG9tLWNqcy5qcy5tYXAiLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuLyoqKiBWYXJpYWJsZXMgKioqL1xyXG5cclxuICB2YXIgd2luID0gd2luZG93LFxyXG4gICAgZG9jID0gZG9jdW1lbnQsXHJcbiAgICBhdHRyUHJvdG8gPSB7XHJcbiAgICAgIHNldEF0dHJpYnV0ZTogRWxlbWVudC5wcm90b3R5cGUuc2V0QXR0cmlidXRlLFxyXG4gICAgICByZW1vdmVBdHRyaWJ1dGU6IEVsZW1lbnQucHJvdG90eXBlLnJlbW92ZUF0dHJpYnV0ZVxyXG4gICAgfSxcclxuICAgIGhhc1NoYWRvdyA9IEVsZW1lbnQucHJvdG90eXBlLmNyZWF0ZVNoYWRvd1Jvb3QsXHJcbiAgICBjb250YWluZXIgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2JyksXHJcbiAgICBub29wID0gZnVuY3Rpb24oKXt9LFxyXG4gICAgdHJ1ZW9wID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRydWU7IH0sXHJcbiAgICByZWdleFJlcGxhY2VDb21tYXMgPSAvLC9nLFxyXG4gICAgcmVnZXhDYW1lbFRvRGFzaCA9IC8oW2Etel0pKFtBLVpdKS9nLFxyXG4gICAgcmVnZXhQc2V1ZG9QYXJlbnMgPSAvXFwofFxcKS9nLFxyXG4gICAgcmVnZXhQc2V1ZG9DYXB0dXJlID0gLzooXFx3KylcXHUyNzZBKC4rPyg/PVxcdTI3NkIpKXw6KFxcdyspL2csXHJcbiAgICByZWdleERpZ2l0cyA9IC8oXFxkKykvZyxcclxuICAgIGtleXBzZXVkbyA9IHtcclxuICAgICAgYWN0aW9uOiBmdW5jdGlvbiAocHNldWRvLCBldmVudCkge1xyXG4gICAgICAgIHJldHVybiBwc2V1ZG8udmFsdWUubWF0Y2gocmVnZXhEaWdpdHMpLmluZGV4T2YoU3RyaW5nKGV2ZW50LmtleUNvZGUpKSA+IC0xID09IChwc2V1ZG8ubmFtZSA9PSAna2V5cGFzcycpIHx8IG51bGw7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvKlxyXG4gICAgICAtIFRoZSBwcmVmaXggb2JqZWN0IGdlbmVyYXRlZCBoZXJlIGlzIGFkZGVkIHRvIHRoZSB4dGFnIG9iamVjdCBhcyB4dGFnLnByZWZpeCBsYXRlciBpbiB0aGUgY29kZVxyXG4gICAgICAtIFByZWZpeCBwcm92aWRlcyBhIHZhcmlldHkgb2YgcHJlZml4IHZhcmlhdGlvbnMgZm9yIHRoZSBicm93c2VyIGluIHdoaWNoIHlvdXIgY29kZSBpcyBydW5uaW5nXHJcbiAgICAgIC0gVGhlIDQgdmFyaWF0aW9ucyBvZiBwcmVmaXggYXJlIGFzIGZvbGxvd3M6XHJcbiAgICAgICAgKiBwcmVmaXguZG9tOiB0aGUgY29ycmVjdCBwcmVmaXggY2FzZSBhbmQgZm9ybSB3aGVuIHVzZWQgb24gRE9NIGVsZW1lbnRzL3N0eWxlIHByb3BlcnRpZXNcclxuICAgICAgICAqIHByZWZpeC5sb3dlcmNhc2U6IGEgbG93ZXJjYXNlIHZlcnNpb24gb2YgdGhlIHByZWZpeCBmb3IgdXNlIGluIHZhcmlvdXMgdXNlci1jb2RlIHNpdHVhdGlvbnNcclxuICAgICAgICAqIHByZWZpeC5jc3M6IHRoZSBsb3dlcmNhc2UsIGRhc2hlZCB2ZXJzaW9uIG9mIHRoZSBwcmVmaXhcclxuICAgICAgICAqIHByZWZpeC5qczogYWRkcmVzc2VzIHByZWZpeGVkIEFQSXMgcHJlc2VudCBpbiBnbG9iYWwgYW5kIG5vbi1FbGVtZW50IGNvbnRleHRzXHJcbiAgICAqL1xyXG4gICAgcHJlZml4ID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh3aW5kb3cpLmpvaW4oKTtcclxuICAgICAgdmFyIHByZSA9ICgoa2V5cy5tYXRjaCgvLChtcykvKSB8fCBrZXlzLm1hdGNoKC8sKG1veikvKSB8fCBrZXlzLm1hdGNoKC8sKE8pLykpIHx8IFtudWxsLCAnd2Via2l0J10pWzFdLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZG9tOiBwcmUgPT0gJ21zJyA/ICdNUycgOiBwcmUsXHJcbiAgICAgICAgbG93ZXJjYXNlOiBwcmUsXHJcbiAgICAgICAgY3NzOiAnLScgKyBwcmUgKyAnLScsXHJcbiAgICAgICAganM6IHByZSA9PSAnbXMnID8gcHJlIDogcHJlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcHJlLnN1YnN0cmluZygxKVxyXG4gICAgICB9O1xyXG4gICAgfSkoKSxcclxuICAgIG1hdGNoU2VsZWN0b3IgPSBFbGVtZW50LnByb3RvdHlwZS5tYXRjaGVzIHx8IEVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXNTZWxlY3RvciB8fCBFbGVtZW50LnByb3RvdHlwZVtwcmVmaXgubG93ZXJjYXNlICsgJ01hdGNoZXNTZWxlY3RvciddO1xyXG5cclxuLyoqKiBGdW5jdGlvbnMgKioqL1xyXG5cclxuLy8gVXRpbGl0aWVzXHJcblxyXG4gIC8qXHJcbiAgICBUaGlzIGlzIGFuIGVuaGFuY2VkIHR5cGVvZiBjaGVjayBmb3IgYWxsIHR5cGVzIG9mIG9iamVjdHMuIFdoZXJlIHR5cGVvZiB3b3VsZCBub3JtYWx5IHJldHVyblxyXG4gICAgJ29iamVjdCcgZm9yIG1hbnkgY29tbW9uIERPTSBvYmplY3RzIChsaWtlIE5vZGVMaXN0cyBhbmQgSFRNTENvbGxlY3Rpb25zKS5cclxuICAgIC0gRm9yIGV4YW1wbGU6IHR5cGVPZihkb2N1bWVudC5jaGlsZHJlbikgd2lsbCBjb3JyZWN0bHkgcmV0dXJuICdodG1sY29sbGVjdGlvbidcclxuICAqL1xyXG4gIHZhciB0eXBlQ2FjaGUgPSB7fSxcclxuICAgICAgdHlwZVN0cmluZyA9IHR5cGVDYWNoZS50b1N0cmluZyxcclxuICAgICAgdHlwZVJlZ2V4cCA9IC9cXHMoW2EtekEtWl0rKS87XHJcbiAgZnVuY3Rpb24gdHlwZU9mKG9iaikge1xyXG4gICAgdmFyIHR5cGUgPSB0eXBlU3RyaW5nLmNhbGwob2JqKTtcclxuICAgIHJldHVybiB0eXBlQ2FjaGVbdHlwZV0gfHwgKHR5cGVDYWNoZVt0eXBlXSA9IHR5cGUubWF0Y2godHlwZVJlZ2V4cClbMV0udG9Mb3dlckNhc2UoKSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBjbG9uZShpdGVtLCB0eXBlKXtcclxuICAgIHZhciBmbiA9IGNsb25lW3R5cGUgfHwgdHlwZU9mKGl0ZW0pXTtcclxuICAgIHJldHVybiBmbiA/IGZuKGl0ZW0pIDogaXRlbTtcclxuICB9XHJcbiAgICBjbG9uZS5vYmplY3QgPSBmdW5jdGlvbihzcmMpe1xyXG4gICAgICB2YXIgb2JqID0ge307XHJcbiAgICAgIGZvciAodmFyIGtleSBpbiBzcmMpIG9ialtrZXldID0gY2xvbmUoc3JjW2tleV0pO1xyXG4gICAgICByZXR1cm4gb2JqO1xyXG4gICAgfTtcclxuICAgIGNsb25lLmFycmF5ID0gZnVuY3Rpb24oc3JjKXtcclxuICAgICAgdmFyIGkgPSBzcmMubGVuZ3RoLCBhcnJheSA9IG5ldyBBcnJheShpKTtcclxuICAgICAgd2hpbGUgKGktLSkgYXJyYXlbaV0gPSBjbG9uZShzcmNbaV0pO1xyXG4gICAgICByZXR1cm4gYXJyYXk7XHJcbiAgICB9O1xyXG5cclxuICAvKlxyXG4gICAgVGhlIHRvQXJyYXkoKSBtZXRob2QgYWxsb3dzIGZvciBjb252ZXJzaW9uIG9mIGFueSBvYmplY3QgdG8gYSB0cnVlIGFycmF5LiBGb3IgdHlwZXMgdGhhdFxyXG4gICAgY2Fubm90IGJlIGNvbnZlcnRlZCB0byBhbiBhcnJheSwgdGhlIG1ldGhvZCByZXR1cm5zIGEgMSBpdGVtIGFycmF5IGNvbnRhaW5pbmcgdGhlIHBhc3NlZC1pbiBvYmplY3QuXHJcbiAgKi9cclxuICB2YXIgdW5zbGljZWFibGUgPSB7ICd1bmRlZmluZWQnOiAxLCAnbnVsbCc6IDEsICdudW1iZXInOiAxLCAnYm9vbGVhbic6IDEsICdzdHJpbmcnOiAxLCAnZnVuY3Rpb24nOiAxIH07XHJcbiAgZnVuY3Rpb24gdG9BcnJheShvYmope1xyXG4gICAgcmV0dXJuIHVuc2xpY2VhYmxlW3R5cGVPZihvYmopXSA/IFtvYmpdIDogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwob2JqLCAwKTtcclxuICB9XHJcblxyXG4vLyBET01cclxuXHJcbiAgdmFyIHN0ciA9ICcnO1xyXG4gIGZ1bmN0aW9uIHF1ZXJ5KGVsZW1lbnQsIHNlbGVjdG9yKXtcclxuICAgIHJldHVybiAoc2VsZWN0b3IgfHwgc3RyKS5sZW5ndGggPyB0b0FycmF5KGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpIDogW107XHJcbiAgfVxyXG5cclxuLy8gUHNldWRvc1xyXG5cclxuICBmdW5jdGlvbiBwYXJzZVBzZXVkbyhmbil7Zm4oKTt9XHJcblxyXG4vLyBNaXhpbnNcclxuXHJcbiAgZnVuY3Rpb24gbWVyZ2VPbmUoc291cmNlLCBrZXksIGN1cnJlbnQpe1xyXG4gICAgdmFyIHR5cGUgPSB0eXBlT2YoY3VycmVudCk7XHJcbiAgICBpZiAodHlwZSA9PSAnb2JqZWN0JyAmJiB0eXBlT2Yoc291cmNlW2tleV0pID09ICdvYmplY3QnKSB4dGFnLm1lcmdlKHNvdXJjZVtrZXldLCBjdXJyZW50KTtcclxuICAgIGVsc2Ugc291cmNlW2tleV0gPSBjbG9uZShjdXJyZW50LCB0eXBlKTtcclxuICAgIHJldHVybiBzb3VyY2U7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBtZXJnZU1peGluKHRhZywgb3JpZ2luYWwsIG1peGluLCBuYW1lKSB7XHJcbiAgICB2YXIga2V5LCBrZXlzID0ge307XHJcbiAgICBmb3IgKHZhciB6IGluIG9yaWdpbmFsKSBrZXlzW3ouc3BsaXQoJzonKVswXV0gPSB6O1xyXG4gICAgZm9yICh6IGluIG1peGluKSB7XHJcbiAgICAgIGtleSA9IGtleXNbei5zcGxpdCgnOicpWzBdXTtcclxuICAgICAgaWYgKHR5cGVvZiBvcmlnaW5hbFtrZXldID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBpZiAoIWtleS5tYXRjaCgnOm1peGlucycpKSB7XHJcbiAgICAgICAgICBvcmlnaW5hbFtrZXkgKyAnOm1peGlucyddID0gb3JpZ2luYWxba2V5XTtcclxuICAgICAgICAgIGRlbGV0ZSBvcmlnaW5hbFtrZXldO1xyXG4gICAgICAgICAga2V5ID0ga2V5ICsgJzptaXhpbnMnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBvcmlnaW5hbFtrZXldLl9fbWl4aW5fXyA9IHh0YWcuYXBwbHlQc2V1ZG9zKHogKyAoei5tYXRjaCgnOm1peGlucycpID8gJycgOiAnOm1peGlucycpLCBtaXhpblt6XSwgdGFnLnBzZXVkb3MsIG9yaWdpbmFsW2tleV0uX19taXhpbl9fKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBvcmlnaW5hbFt6XSA9IG1peGluW3pdO1xyXG4gICAgICAgIGRlbGV0ZSBvcmlnaW5hbFtrZXldO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB2YXIgdW5pcXVlTWl4aW5Db3VudCA9IDA7XHJcbiAgZnVuY3Rpb24gYWRkTWl4aW4odGFnLCBvcmlnaW5hbCwgbWl4aW4pe1xyXG4gICAgZm9yICh2YXIgeiBpbiBtaXhpbil7XHJcbiAgICAgIG9yaWdpbmFsW3ogKyAnOl9fbWl4aW5fXygnICsgKHVuaXF1ZU1peGluQ291bnQrKykgKyAnKSddID0geHRhZy5hcHBseVBzZXVkb3MoeiwgbWl4aW5bel0sIHRhZy5wc2V1ZG9zKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHJlc29sdmVNaXhpbnMobWl4aW5zLCBvdXRwdXQpe1xyXG4gICAgdmFyIGluZGV4ID0gbWl4aW5zLmxlbmd0aDtcclxuICAgIHdoaWxlIChpbmRleC0tKXtcclxuICAgICAgb3V0cHV0LnVuc2hpZnQobWl4aW5zW2luZGV4XSk7XHJcbiAgICAgIGlmICh4dGFnLm1peGluc1ttaXhpbnNbaW5kZXhdXS5taXhpbnMpIHJlc29sdmVNaXhpbnMoeHRhZy5taXhpbnNbbWl4aW5zW2luZGV4XV0ubWl4aW5zLCBvdXRwdXQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG91dHB1dDtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGFwcGx5TWl4aW5zKHRhZykge1xyXG4gICAgcmVzb2x2ZU1peGlucyh0YWcubWl4aW5zLCBbXSkuZm9yRWFjaChmdW5jdGlvbihuYW1lKXtcclxuICAgICAgdmFyIG1peGluID0geHRhZy5taXhpbnNbbmFtZV07XHJcbiAgICAgIGZvciAodmFyIHR5cGUgaW4gbWl4aW4pIHtcclxuICAgICAgICB2YXIgaXRlbSA9IG1peGluW3R5cGVdLFxyXG4gICAgICAgICAgICBvcmlnaW5hbCA9IHRhZ1t0eXBlXTtcclxuICAgICAgICBpZiAoIW9yaWdpbmFsKSB0YWdbdHlwZV0gPSBpdGVtO1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgc3dpdGNoICh0eXBlKXtcclxuICAgICAgICAgICAgY2FzZSAnbWl4aW5zJzogYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2V2ZW50cyc6IGFkZE1peGluKHRhZywgb3JpZ2luYWwsIGl0ZW0pOyBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnYWNjZXNzb3JzJzpcclxuICAgICAgICAgICAgY2FzZSAncHJvdG90eXBlJzpcclxuICAgICAgICAgICAgICBmb3IgKHZhciB6IGluIGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGlmICghb3JpZ2luYWxbel0pIG9yaWdpbmFsW3pdID0gaXRlbVt6XTtcclxuICAgICAgICAgICAgICAgIGVsc2UgbWVyZ2VNaXhpbih0YWcsIG9yaWdpbmFsW3pdLCBpdGVtW3pdLCBuYW1lKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IG1lcmdlTWl4aW4odGFnLCBvcmlnaW5hbCwgaXRlbSwgbmFtZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiB0YWc7XHJcbiAgfVxyXG5cclxuLy8gRXZlbnRzXHJcblxyXG4gIGZ1bmN0aW9uIGRlbGVnYXRlQWN0aW9uKHBzZXVkbywgZXZlbnQpIHtcclxuICAgIHZhciBtYXRjaCxcclxuICAgICAgICB0YXJnZXQgPSBldmVudC50YXJnZXQsXHJcbiAgICAgICAgcm9vdCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XHJcbiAgICB3aGlsZSAoIW1hdGNoICYmIHRhcmdldCAmJiB0YXJnZXQgIT0gcm9vdCkge1xyXG4gICAgICBpZiAodGFyZ2V0LnRhZ05hbWUgJiYgbWF0Y2hTZWxlY3Rvci5jYWxsKHRhcmdldCwgcHNldWRvLnZhbHVlKSkgbWF0Y2ggPSB0YXJnZXQ7XHJcbiAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgfVxyXG4gICAgaWYgKCFtYXRjaCAmJiByb290LnRhZ05hbWUgJiYgbWF0Y2hTZWxlY3Rvci5jYWxsKHJvb3QsIHBzZXVkby52YWx1ZSkpIG1hdGNoID0gcm9vdDtcclxuICAgIHJldHVybiBtYXRjaCA/IHBzZXVkby5saXN0ZW5lciA9IHBzZXVkby5saXN0ZW5lci5iaW5kKG1hdGNoKSA6IG51bGw7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB0b3VjaEZpbHRlcihldmVudCl7XHJcbiAgICByZXR1cm4gZXZlbnQuYnV0dG9uID09PSAwO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gd3JpdGVQcm9wZXJ0eShrZXksIGV2ZW50LCBiYXNlLCBkZXNjKXtcclxuICAgIGlmIChkZXNjKSBldmVudFtrZXldID0gYmFzZVtrZXldO1xyXG4gICAgZWxzZSBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXZlbnQsIGtleSwge1xyXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcclxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgdmFsdWU6IGJhc2Vba2V5XVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICB2YXIgc2tpcFByb3BzID0ge307XHJcbiAgZm9yICh2YXIgeiBpbiBkb2MuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50JykpIHNraXBQcm9wc1t6XSA9IDE7XHJcbiAgZnVuY3Rpb24gaW5oZXJpdEV2ZW50KGV2ZW50LCBiYXNlKXtcclxuICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihldmVudCwgJ3RhcmdldCcpO1xyXG4gICAgZm9yICh2YXIgeiBpbiBiYXNlKSB7XHJcbiAgICAgIGlmICghc2tpcFByb3BzW3pdKSB3cml0ZVByb3BlcnR5KHosIGV2ZW50LCBiYXNlLCBkZXNjKTtcclxuICAgIH1cclxuICAgIGV2ZW50LmJhc2VFdmVudCA9IGJhc2U7XHJcbiAgfVxyXG5cclxuLy8gQWNjZXNzb3JzXHJcblxyXG4gIGZ1bmN0aW9uIG1vZEF0dHIoZWxlbWVudCwgYXR0ciwgbmFtZSwgdmFsdWUsIG1ldGhvZCl7XHJcbiAgICBhdHRyUHJvdG9bbWV0aG9kXS5jYWxsKGVsZW1lbnQsIG5hbWUsIGF0dHIgJiYgYXR0ci5ib29sZWFuID8gJycgOiB2YWx1ZSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBzeW5jQXR0cihlbGVtZW50LCBhdHRyLCBuYW1lLCB2YWx1ZSwgbWV0aG9kKXtcclxuICAgIGlmIChhdHRyICYmIChhdHRyLnByb3BlcnR5IHx8IGF0dHIuc2VsZWN0b3IpKSB7XHJcbiAgICAgIHZhciBub2RlcyA9IGF0dHIucHJvcGVydHkgPyBbZWxlbWVudC54dGFnW2F0dHIucHJvcGVydHldXSA6IGF0dHIuc2VsZWN0b3IgPyB4dGFnLnF1ZXJ5KGVsZW1lbnQsIGF0dHIuc2VsZWN0b3IpIDogW10sXHJcbiAgICAgICAgICBpbmRleCA9IG5vZGVzLmxlbmd0aDtcclxuICAgICAgd2hpbGUgKGluZGV4LS0pIG5vZGVzW2luZGV4XVttZXRob2RdKG5hbWUsIHZhbHVlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGF0dGFjaFByb3BlcnRpZXModGFnLCBwcm9wLCB6LCBhY2Nlc3NvciwgYXR0ciwgbmFtZSl7XHJcbiAgICB2YXIga2V5ID0gei5zcGxpdCgnOicpLCB0eXBlID0ga2V5WzBdO1xyXG4gICAgaWYgKHR5cGUgPT0gJ2dldCcpIHtcclxuICAgICAga2V5WzBdID0gcHJvcDtcclxuICAgICAgdGFnLnByb3RvdHlwZVtwcm9wXS5nZXQgPSB4dGFnLmFwcGx5UHNldWRvcyhrZXkuam9pbignOicpLCBhY2Nlc3Nvclt6XSwgdGFnLnBzZXVkb3MsIGFjY2Vzc29yW3pdKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGUgPT0gJ3NldCcpIHtcclxuICAgICAga2V5WzBdID0gcHJvcDtcclxuICAgICAgdmFyIHNldHRlciA9IHRhZy5wcm90b3R5cGVbcHJvcF0uc2V0ID0geHRhZy5hcHBseVBzZXVkb3Moa2V5LmpvaW4oJzonKSwgYXR0ciA/IGZ1bmN0aW9uKHZhbHVlKXtcclxuICAgICAgICB2YXIgb2xkLCBtZXRob2QgPSAnc2V0QXR0cmlidXRlJztcclxuICAgICAgICBpZiAoYXR0ci5ib29sZWFuKXtcclxuICAgICAgICAgIHZhbHVlID0gISF2YWx1ZTtcclxuICAgICAgICAgIG9sZCA9IHRoaXMuaGFzQXR0cmlidXRlKG5hbWUpO1xyXG4gICAgICAgICAgaWYgKCF2YWx1ZSkgbWV0aG9kID0gJ3JlbW92ZUF0dHJpYnV0ZSc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgdmFsdWUgPSBhdHRyLnZhbGlkYXRlID8gYXR0ci52YWxpZGF0ZS5jYWxsKHRoaXMsIHZhbHVlKSA6IHZhbHVlO1xyXG4gICAgICAgICAgb2xkID0gdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1vZEF0dHIodGhpcywgYXR0ciwgbmFtZSwgdmFsdWUsIG1ldGhvZCk7XHJcbiAgICAgICAgYWNjZXNzb3Jbel0uY2FsbCh0aGlzLCB2YWx1ZSwgb2xkKTtcclxuICAgICAgICBzeW5jQXR0cih0aGlzLCBhdHRyLCBuYW1lLCB2YWx1ZSwgbWV0aG9kKTtcclxuICAgICAgfSA6IGFjY2Vzc29yW3pdID8gZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICAgIGFjY2Vzc29yW3pdLmNhbGwodGhpcywgdmFsdWUpO1xyXG4gICAgICB9IDogbnVsbCwgdGFnLnBzZXVkb3MsIGFjY2Vzc29yW3pdKTtcclxuXHJcbiAgICAgIGlmIChhdHRyKSBhdHRyLnNldHRlciA9IGFjY2Vzc29yW3pdO1xyXG4gICAgfVxyXG4gICAgZWxzZSB0YWcucHJvdG90eXBlW3Byb3BdW3pdID0gYWNjZXNzb3Jbel07XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBwYXJzZUFjY2Vzc29yKHRhZywgcHJvcCl7XHJcbiAgICB0YWcucHJvdG90eXBlW3Byb3BdID0ge307XHJcbiAgICB2YXIgYWNjZXNzb3IgPSB0YWcuYWNjZXNzb3JzW3Byb3BdLFxyXG4gICAgICAgIGF0dHIgPSBhY2Nlc3Nvci5hdHRyaWJ1dGUsXHJcbiAgICAgICAgbmFtZTtcclxuXHJcbiAgICBpZiAoYXR0cikge1xyXG4gICAgICBuYW1lID0gYXR0ci5uYW1lID0gKGF0dHIgPyAoYXR0ci5uYW1lIHx8IHByb3AucmVwbGFjZShyZWdleENhbWVsVG9EYXNoLCAnJDEtJDInKSkgOiBwcm9wKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICBhdHRyLmtleSA9IHByb3A7XHJcbiAgICAgIHRhZy5hdHRyaWJ1dGVzW25hbWVdID0gYXR0cjtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciB6IGluIGFjY2Vzc29yKSBhdHRhY2hQcm9wZXJ0aWVzKHRhZywgcHJvcCwgeiwgYWNjZXNzb3IsIGF0dHIsIG5hbWUpO1xyXG5cclxuICAgIGlmIChhdHRyKSB7XHJcbiAgICAgIGlmICghdGFnLnByb3RvdHlwZVtwcm9wXS5nZXQpIHtcclxuICAgICAgICB2YXIgbWV0aG9kID0gKGF0dHIuYm9vbGVhbiA/ICdoYXMnIDogJ2dldCcpICsgJ0F0dHJpYnV0ZSc7XHJcbiAgICAgICAgdGFnLnByb3RvdHlwZVtwcm9wXS5nZXQgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXNbbWV0aG9kXShuYW1lKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghdGFnLnByb3RvdHlwZVtwcm9wXS5zZXQpIHRhZy5wcm90b3R5cGVbcHJvcF0uc2V0ID0gZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICAgIHZhbHVlID0gYXR0ci5ib29sZWFuID8gISF2YWx1ZSA6IGF0dHIudmFsaWRhdGUgPyBhdHRyLnZhbGlkYXRlLmNhbGwodGhpcywgdmFsdWUpIDogdmFsdWU7XHJcbiAgICAgICAgdmFyIG1ldGhvZCA9IGF0dHIuYm9vbGVhbiA/ICh2YWx1ZSA/ICdzZXRBdHRyaWJ1dGUnIDogJ3JlbW92ZUF0dHJpYnV0ZScpIDogJ3NldEF0dHJpYnV0ZSc7XHJcbiAgICAgICAgbW9kQXR0cih0aGlzLCBhdHRyLCBuYW1lLCB2YWx1ZSwgbWV0aG9kKTtcclxuICAgICAgICBzeW5jQXR0cih0aGlzLCBhdHRyLCBuYW1lLCB2YWx1ZSwgbWV0aG9kKTtcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHZhciB1bndyYXBDb21tZW50ID0gL1xcL1xcKiE/KD86XFxAcHJlc2VydmUpP1sgXFx0XSooPzpcXHJcXG58XFxuKShbXFxzXFxTXSo/KSg/OlxcclxcbnxcXG4pXFxzKlxcKlxcLy87XHJcbiAgZnVuY3Rpb24gcGFyc2VNdWx0aWxpbmUoZm4pe1xyXG4gICAgcmV0dXJuIHR5cGVvZiBmbiA9PSAnZnVuY3Rpb24nID8gdW53cmFwQ29tbWVudC5leGVjKGZuLnRvU3RyaW5nKCkpWzFdIDogZm47XHJcbiAgfVxyXG5cclxuLyoqKiBYLVRhZyBPYmplY3QgRGVmaW5pdGlvbiAqKiovXHJcblxyXG4gIHZhciB4dGFnID0ge1xyXG4gICAgdGFnczoge30sXHJcbiAgICBkZWZhdWx0T3B0aW9uczoge1xyXG4gICAgICBwc2V1ZG9zOiBbXSxcclxuICAgICAgbWl4aW5zOiBbXSxcclxuICAgICAgZXZlbnRzOiB7fSxcclxuICAgICAgbWV0aG9kczoge30sXHJcbiAgICAgIGFjY2Vzc29yczoge30sXHJcbiAgICAgIGxpZmVjeWNsZToge30sXHJcbiAgICAgIGF0dHJpYnV0ZXM6IHt9LFxyXG4gICAgICAncHJvdG90eXBlJzoge1xyXG4gICAgICAgIHh0YWc6IHtcclxuICAgICAgICAgIGdldDogZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX194dGFnX18gPyB0aGlzLl9feHRhZ19fIDogKHRoaXMuX194dGFnX18gPSB7IGRhdGE6IHt9IH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHJlZ2lzdGVyOiBmdW5jdGlvbiAobmFtZSwgb3B0aW9ucykge1xyXG4gICAgICB2YXIgX25hbWU7XHJcbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PSAnc3RyaW5nJykgX25hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgIGVsc2UgdGhyb3cgJ0ZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBDdXN0b20gRWxlbWVudCBzdHJpbmcgbmFtZSc7XHJcbiAgICAgIHh0YWcudGFnc1tfbmFtZV0gPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgICAgdmFyIGJhc2VQcm90b3R5cGUgPSBvcHRpb25zLnByb3RvdHlwZTtcclxuICAgICAgZGVsZXRlIG9wdGlvbnMucHJvdG90eXBlO1xyXG4gICAgICB2YXIgdGFnID0geHRhZy50YWdzW19uYW1lXS5jb21waWxlZCA9IGFwcGx5TWl4aW5zKHh0YWcubWVyZ2Uoe30sIHh0YWcuZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpKTtcclxuICAgICAgdmFyIHByb3RvID0gdGFnLnByb3RvdHlwZTtcclxuICAgICAgdmFyIGxpZmVjeWNsZSA9IHRhZy5saWZlY3ljbGU7XHJcblxyXG4gICAgICBmb3IgKHZhciB6IGluIHRhZy5ldmVudHMpIHRhZy5ldmVudHNbel0gPSB4dGFnLnBhcnNlRXZlbnQoeiwgdGFnLmV2ZW50c1t6XSk7XHJcbiAgICAgIGZvciAoeiBpbiBsaWZlY3ljbGUpIGxpZmVjeWNsZVt6LnNwbGl0KCc6JylbMF1dID0geHRhZy5hcHBseVBzZXVkb3MoeiwgbGlmZWN5Y2xlW3pdLCB0YWcucHNldWRvcywgbGlmZWN5Y2xlW3pdKTtcclxuICAgICAgZm9yICh6IGluIHRhZy5tZXRob2RzKSBwcm90b1t6LnNwbGl0KCc6JylbMF1dID0geyB2YWx1ZTogeHRhZy5hcHBseVBzZXVkb3MoeiwgdGFnLm1ldGhvZHNbel0sIHRhZy5wc2V1ZG9zLCB0YWcubWV0aG9kc1t6XSksIGVudW1lcmFibGU6IHRydWUgfTtcclxuICAgICAgZm9yICh6IGluIHRhZy5hY2Nlc3NvcnMpIHBhcnNlQWNjZXNzb3IodGFnLCB6KTtcclxuXHJcbiAgICAgIGlmICh0YWcuc2hhZG93KSB0YWcuc2hhZG93ID0gdGFnLnNoYWRvdy5ub2RlTmFtZSA/IHRhZy5zaGFkb3cgOiB4dGFnLmNyZWF0ZUZyYWdtZW50KHRhZy5zaGFkb3cpO1xyXG4gICAgICBpZiAodGFnLmNvbnRlbnQpIHRhZy5jb250ZW50ID0gdGFnLmNvbnRlbnQubm9kZU5hbWUgPyB0YWcuY29udGVudC5pbm5lckhUTUwgOiBwYXJzZU11bHRpbGluZSh0YWcuY29udGVudCk7XHJcbiAgICAgIHZhciBjcmVhdGVkID0gbGlmZWN5Y2xlLmNyZWF0ZWQ7XHJcbiAgICAgIHZhciBmaW5hbGl6ZWQgPSBsaWZlY3ljbGUuZmluYWxpemVkO1xyXG4gICAgICBwcm90by5jcmVhdGVkQ2FsbGJhY2sgPSB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24oKXtcclxuICAgICAgICAgIHZhciBlbGVtZW50ID0gdGhpcztcclxuICAgICAgICAgIGlmICh0YWcuc2hhZG93ICYmIGhhc1NoYWRvdykgdGhpcy5jcmVhdGVTaGFkb3dSb290KCkuYXBwZW5kQ2hpbGQodGFnLnNoYWRvdy5jbG9uZU5vZGUodHJ1ZSkpO1xyXG4gICAgICAgICAgaWYgKHRhZy5jb250ZW50KSB0aGlzLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKS5vdXRlckhUTUwgPSB0YWcuY29udGVudDtcclxuICAgICAgICAgIHZhciBvdXRwdXQgPSBjcmVhdGVkID8gY3JlYXRlZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDogbnVsbDtcclxuICAgICAgICAgIHh0YWcuYWRkRXZlbnRzKHRoaXMsIHRhZy5ldmVudHMpO1xyXG4gICAgICAgICAgZm9yICh2YXIgbmFtZSBpbiB0YWcuYXR0cmlidXRlcykge1xyXG4gICAgICAgICAgICB2YXIgYXR0ciA9IHRhZy5hdHRyaWJ1dGVzW25hbWVdLFxyXG4gICAgICAgICAgICAgICAgaGFzQXR0ciA9IHRoaXMuaGFzQXR0cmlidXRlKG5hbWUpLFxyXG4gICAgICAgICAgICAgICAgaGFzRGVmYXVsdCA9IGF0dHIuZGVmICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIGlmIChoYXNBdHRyIHx8IGF0dHIuYm9vbGVhbiB8fCBoYXNEZWZhdWx0KSB7XHJcbiAgICAgICAgICAgICAgdGhpc1thdHRyLmtleV0gPSBhdHRyLmJvb2xlYW4gPyBoYXNBdHRyIDogIWhhc0F0dHIgJiYgaGFzRGVmYXVsdCA/IGF0dHIuZGVmIDogdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHRhZy5wc2V1ZG9zLmZvckVhY2goZnVuY3Rpb24ob2JqKXtcclxuICAgICAgICAgICAgb2JqLm9uQWRkLmNhbGwoZWxlbWVudCwgb2JqKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgdGhpcy54dGFnQ29tcG9uZW50UmVhZHkgPSB0cnVlO1xyXG4gICAgICAgICAgaWYgKGZpbmFsaXplZCkgZmluYWxpemVkLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICByZXR1cm4gb3V0cHV0O1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHZhciBpbnNlcnRlZCA9IGxpZmVjeWNsZS5pbnNlcnRlZDtcclxuICAgICAgdmFyIHJlbW92ZWQgPSBsaWZlY3ljbGUucmVtb3ZlZDtcclxuICAgICAgaWYgKGluc2VydGVkIHx8IHJlbW92ZWQpIHtcclxuICAgICAgICBwcm90by5hdHRhY2hlZENhbGxiYWNrID0geyB2YWx1ZTogZnVuY3Rpb24oKXtcclxuICAgICAgICAgIGlmIChyZW1vdmVkKSB0aGlzLnh0YWcuX19wYXJlbnROb2RlX18gPSB0aGlzLnBhcmVudE5vZGU7XHJcbiAgICAgICAgICBpZiAoaW5zZXJ0ZWQpIHJldHVybiBpbnNlcnRlZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgIH0sIGVudW1lcmFibGU6IHRydWUgfTtcclxuICAgICAgfVxyXG4gICAgICBpZiAocmVtb3ZlZCkge1xyXG4gICAgICAgIHByb3RvLmRldGFjaGVkQ2FsbGJhY2sgPSB7IHZhbHVlOiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgdmFyIGFyZ3MgPSB0b0FycmF5KGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICBhcmdzLnVuc2hpZnQodGhpcy54dGFnLl9fcGFyZW50Tm9kZV9fKTtcclxuICAgICAgICAgIHZhciBvdXRwdXQgPSByZW1vdmVkLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgICAgZGVsZXRlIHRoaXMueHRhZy5fX3BhcmVudE5vZGVfXztcclxuICAgICAgICAgIHJldHVybiBvdXRwdXQ7XHJcbiAgICAgICAgfSwgZW51bWVyYWJsZTogdHJ1ZSB9O1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChsaWZlY3ljbGUuYXR0cmlidXRlQ2hhbmdlZCkgcHJvdG8uYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrID0geyB2YWx1ZTogbGlmZWN5Y2xlLmF0dHJpYnV0ZUNoYW5nZWQsIGVudW1lcmFibGU6IHRydWUgfTtcclxuXHJcbiAgICAgIHByb3RvLnNldEF0dHJpYnV0ZSA9IHtcclxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiAobmFtZSwgdmFsdWUpe1xyXG4gICAgICAgICAgdmFyIG9sZDtcclxuICAgICAgICAgIHZhciBfbmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgIHZhciBhdHRyID0gdGFnLmF0dHJpYnV0ZXNbX25hbWVdO1xyXG4gICAgICAgICAgaWYgKGF0dHIpIHtcclxuICAgICAgICAgICAgb2xkID0gdGhpcy5nZXRBdHRyaWJ1dGUoX25hbWUpO1xyXG4gICAgICAgICAgICB2YWx1ZSA9IGF0dHIuYm9vbGVhbiA/ICcnIDogYXR0ci52YWxpZGF0ZSA/IGF0dHIudmFsaWRhdGUuY2FsbCh0aGlzLCB2YWx1ZSkgOiB2YWx1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIG1vZEF0dHIodGhpcywgYXR0ciwgX25hbWUsIHZhbHVlLCAnc2V0QXR0cmlidXRlJyk7XHJcbiAgICAgICAgICBpZiAoYXR0cikge1xyXG4gICAgICAgICAgICBpZiAoYXR0ci5zZXR0ZXIpIGF0dHIuc2V0dGVyLmNhbGwodGhpcywgYXR0ci5ib29sZWFuID8gdHJ1ZSA6IHZhbHVlLCBvbGQpO1xyXG4gICAgICAgICAgICBzeW5jQXR0cih0aGlzLCBhdHRyLCBfbmFtZSwgdmFsdWUsICdzZXRBdHRyaWJ1dGUnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBwcm90by5yZW1vdmVBdHRyaWJ1dGUgPSB7XHJcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gKG5hbWUpe1xyXG4gICAgICAgICAgdmFyIF9uYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgdmFyIGF0dHIgPSB0YWcuYXR0cmlidXRlc1tfbmFtZV07XHJcbiAgICAgICAgICB2YXIgb2xkID0gdGhpcy5oYXNBdHRyaWJ1dGUoX25hbWUpO1xyXG4gICAgICAgICAgbW9kQXR0cih0aGlzLCBhdHRyLCBfbmFtZSwgJycsICdyZW1vdmVBdHRyaWJ1dGUnKTtcclxuICAgICAgICAgIGlmIChhdHRyKSB7XHJcbiAgICAgICAgICAgIGlmIChhdHRyLnNldHRlcikgYXR0ci5zZXR0ZXIuY2FsbCh0aGlzLCBhdHRyLmJvb2xlYW4gPyBmYWxzZSA6IHVuZGVmaW5lZCwgb2xkKTtcclxuICAgICAgICAgICAgc3luY0F0dHIodGhpcywgYXR0ciwgX25hbWUsICcnLCAncmVtb3ZlQXR0cmlidXRlJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgdmFyIGRlZmluaXRpb24gPSB7fTtcclxuICAgICAgdmFyIGluc3RhbmNlID0gYmFzZVByb3RvdHlwZSBpbnN0YW5jZW9mIHdpbi5IVE1MRWxlbWVudDtcclxuICAgICAgdmFyIGV4dGVuZGVkID0gdGFnWydleHRlbmRzJ10gJiYgKGRlZmluaXRpb25bJ2V4dGVuZHMnXSA9IHRhZ1snZXh0ZW5kcyddKTtcclxuXHJcbiAgICAgIGlmIChiYXNlUHJvdG90eXBlKSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhiYXNlUHJvdG90eXBlKS5mb3JFYWNoKGZ1bmN0aW9uKHope1xyXG4gICAgICAgIHZhciBwcm9wID0gcHJvdG9bel07XHJcbiAgICAgICAgdmFyIGRlc2MgPSBpbnN0YW5jZSA/IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoYmFzZVByb3RvdHlwZSwgeikgOiBiYXNlUHJvdG90eXBlW3pdO1xyXG4gICAgICAgIGlmIChwcm9wKSB7XHJcbiAgICAgICAgICBmb3IgKHZhciB5IGluIGRlc2MpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkZXNjW3ldID09ICdmdW5jdGlvbicgJiYgcHJvcFt5XSkgcHJvcFt5XSA9IHh0YWcud3JhcChkZXNjW3ldLCBwcm9wW3ldKTtcclxuICAgICAgICAgICAgZWxzZSBwcm9wW3ldID0gZGVzY1t5XTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcHJvdG9bel0gPSBwcm9wIHx8IGRlc2M7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgZGVmaW5pdGlvblsncHJvdG90eXBlJ10gPSBPYmplY3QuY3JlYXRlKFxyXG4gICAgICAgIGV4dGVuZGVkID8gT2JqZWN0LmNyZWF0ZShkb2MuY3JlYXRlRWxlbWVudChleHRlbmRlZCkuY29uc3RydWN0b3IpLnByb3RvdHlwZSA6IHdpbi5IVE1MRWxlbWVudC5wcm90b3R5cGUsXHJcbiAgICAgICAgcHJvdG9cclxuICAgICAgKTtcclxuXHJcbiAgICAgIHJldHVybiBkb2MucmVnaXN0ZXJFbGVtZW50KF9uYW1lLCBkZWZpbml0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyogRXhwb3NlZCBWYXJpYWJsZXMgKi9cclxuXHJcbiAgICBtaXhpbnM6IHt9LFxyXG4gICAgcHJlZml4OiBwcmVmaXgsXHJcbiAgICBjYXB0dXJlRXZlbnRzOiB7IGZvY3VzOiAxLCBibHVyOiAxLCBzY3JvbGw6IDEsIERPTU1vdXNlU2Nyb2xsOiAxIH0sXHJcbiAgICBjdXN0b21FdmVudHM6IHtcclxuICAgICAgYW5pbWF0aW9uc3RhcnQ6IHtcclxuICAgICAgICBhdHRhY2g6IFtwcmVmaXguZG9tICsgJ0FuaW1hdGlvblN0YXJ0J11cclxuICAgICAgfSxcclxuICAgICAgYW5pbWF0aW9uZW5kOiB7XHJcbiAgICAgICAgYXR0YWNoOiBbcHJlZml4LmRvbSArICdBbmltYXRpb25FbmQnXVxyXG4gICAgICB9LFxyXG4gICAgICB0cmFuc2l0aW9uZW5kOiB7XHJcbiAgICAgICAgYXR0YWNoOiBbcHJlZml4LmRvbSArICdUcmFuc2l0aW9uRW5kJ11cclxuICAgICAgfSxcclxuICAgICAgbW92ZToge1xyXG4gICAgICAgIGF0dGFjaDogWydwb2ludGVybW92ZSddXHJcbiAgICAgIH0sXHJcbiAgICAgIGVudGVyOiB7XHJcbiAgICAgICAgYXR0YWNoOiBbJ3BvaW50ZXJlbnRlciddXHJcbiAgICAgIH0sXHJcbiAgICAgIGxlYXZlOiB7XHJcbiAgICAgICAgYXR0YWNoOiBbJ3BvaW50ZXJsZWF2ZSddXHJcbiAgICAgIH0sXHJcbiAgICAgIHNjcm9sbHdoZWVsOiB7XHJcbiAgICAgICAgYXR0YWNoOiBbJ0RPTU1vdXNlU2Nyb2xsJywgJ21vdXNld2hlZWwnXSxcclxuICAgICAgICBjb25kaXRpb246IGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgIGV2ZW50LmRlbHRhID0gZXZlbnQud2hlZWxEZWx0YSA/IGV2ZW50LndoZWVsRGVsdGEgLyA0MCA6IE1hdGgucm91bmQoZXZlbnQuZGV0YWlsIC8gMy41ICogLTEpO1xyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICB0YXA6IHtcclxuICAgICAgICBhdHRhY2g6IFsncG9pbnRlcmRvd24nLCAncG9pbnRlcnVwJ10sXHJcbiAgICAgICAgY29uZGl0aW9uOiBmdW5jdGlvbihldmVudCwgY3VzdG9tKXtcclxuICAgICAgICAgIGlmIChldmVudC50eXBlID09ICdwb2ludGVyZG93bicpIHtcclxuICAgICAgICAgICAgY3VzdG9tLnN0YXJ0WCA9IGV2ZW50LmNsaWVudFg7XHJcbiAgICAgICAgICAgIGN1c3RvbS5zdGFydFkgPSBldmVudC5jbGllbnRZO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSBpZiAoZXZlbnQuYnV0dG9uID09PSAwICYmXHJcbiAgICAgICAgICAgICAgICAgICBNYXRoLmFicyhjdXN0b20uc3RhcnRYIC0gZXZlbnQuY2xpZW50WCkgPCAxMCAmJlxyXG4gICAgICAgICAgICAgICAgICAgTWF0aC5hYnMoY3VzdG9tLnN0YXJ0WSAtIGV2ZW50LmNsaWVudFkpIDwgMTApIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgdGFwc3RhcnQ6IHtcclxuICAgICAgICBhdHRhY2g6IFsncG9pbnRlcmRvd24nXSxcclxuICAgICAgICBjb25kaXRpb246IHRvdWNoRmlsdGVyXHJcbiAgICAgIH0sXHJcbiAgICAgIHRhcGVuZDoge1xyXG4gICAgICAgIGF0dGFjaDogWydwb2ludGVydXAnXSxcclxuICAgICAgICBjb25kaXRpb246IHRvdWNoRmlsdGVyXHJcbiAgICAgIH0sXHJcbiAgICAgIHRhcG1vdmU6IHtcclxuICAgICAgICBhdHRhY2g6IFsncG9pbnRlcmRvd24nXSxcclxuICAgICAgICBjb25kaXRpb246IGZ1bmN0aW9uKGV2ZW50LCBjdXN0b20pe1xyXG4gICAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT0gJ3BvaW50ZXJkb3duJykge1xyXG4gICAgICAgICAgICB2YXIgbGlzdGVuZXIgPSBjdXN0b20ubGlzdGVuZXIuYmluZCh0aGlzKTtcclxuICAgICAgICAgICAgaWYgKCFjdXN0b20udGFwbW92ZUxpc3RlbmVycykgY3VzdG9tLnRhcG1vdmVMaXN0ZW5lcnMgPSB4dGFnLmFkZEV2ZW50cyhkb2N1bWVudCwge1xyXG4gICAgICAgICAgICAgIHBvaW50ZXJtb3ZlOiBsaXN0ZW5lcixcclxuICAgICAgICAgICAgICBwb2ludGVydXA6IGxpc3RlbmVyLFxyXG4gICAgICAgICAgICAgIHBvaW50ZXJjYW5jZWw6IGxpc3RlbmVyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSBpZiAoZXZlbnQudHlwZSA9PSAncG9pbnRlcnVwJyB8fCBldmVudC50eXBlID09ICdwb2ludGVyY2FuY2VsJykge1xyXG4gICAgICAgICAgICB4dGFnLnJlbW92ZUV2ZW50cyhkb2N1bWVudCwgY3VzdG9tLnRhcG1vdmVMaXN0ZW5lcnMpO1xyXG4gICAgICAgICAgICBjdXN0b20udGFwbW92ZUxpc3RlbmVycyA9IG51bGw7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIHRhcGhvbGQ6IHtcclxuICAgICAgICBhdHRhY2g6IFsncG9pbnRlcmRvd24nLCAncG9pbnRlcnVwJ10sXHJcbiAgICAgICAgY29uZGl0aW9uOiBmdW5jdGlvbihldmVudCwgY3VzdG9tKXtcclxuICAgICAgICAgIGlmIChldmVudC50eXBlID09ICdwb2ludGVyZG93bicpIHtcclxuICAgICAgICAgICAgKGN1c3RvbS5wb2ludGVycyA9IGN1c3RvbS5wb2ludGVycyB8fCB7fSlbZXZlbnQucG9pbnRlcklkXSA9IHNldFRpbWVvdXQoXHJcbiAgICAgICAgICAgICAgeHRhZy5maXJlRXZlbnQuYmluZChudWxsLCB0aGlzLCAndGFwaG9sZCcpLFxyXG4gICAgICAgICAgICAgIGN1c3RvbS5kdXJhdGlvbiB8fCAxMDAwXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmIChldmVudC50eXBlID09ICdwb2ludGVydXAnKSB7XHJcbiAgICAgICAgICAgIGlmIChjdXN0b20ucG9pbnRlcnMpIHtcclxuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoY3VzdG9tLnBvaW50ZXJzW2V2ZW50LnBvaW50ZXJJZF0pO1xyXG4gICAgICAgICAgICAgIGRlbGV0ZSBjdXN0b20ucG9pbnRlcnNbZXZlbnQucG9pbnRlcklkXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBwc2V1ZG9zOiB7XHJcbiAgICAgIF9fbWl4aW5fXzoge30sXHJcbiAgICAgIG1peGluczoge1xyXG4gICAgICAgIG9uQ29tcGlsZWQ6IGZ1bmN0aW9uKGZuLCBwc2V1ZG8pe1xyXG4gICAgICAgICAgdmFyIG1peGluID0gcHNldWRvLnNvdXJjZSAmJiBwc2V1ZG8uc291cmNlLl9fbWl4aW5fXyB8fCBwc2V1ZG8uc291cmNlO1xyXG4gICAgICAgICAgaWYgKG1peGluKSBzd2l0Y2ggKHBzZXVkby52YWx1ZSkge1xyXG4gICAgICAgICAgICBjYXNlIG51bGw6IGNhc2UgJyc6IGNhc2UgJ2JlZm9yZSc6IHJldHVybiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgIG1peGluLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGNhc2UgJ2FmdGVyJzogcmV0dXJuIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgdmFyIHJldHVybnMgPSBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICAgIG1peGluLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHJldHVybnM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGNhc2UgJ25vbmUnOiByZXR1cm4gZm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHJldHVybiBmbjtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIGtleXBhc3M6IGtleXBzZXVkbyxcclxuICAgICAga2V5ZmFpbDoga2V5cHNldWRvLFxyXG4gICAgICBkZWxlZ2F0ZToge1xyXG4gICAgICAgIGFjdGlvbjogZGVsZWdhdGVBY3Rpb25cclxuICAgICAgfSxcclxuICAgICAgcHJldmVudGFibGU6IHtcclxuICAgICAgICBhY3Rpb246IGZ1bmN0aW9uIChwc2V1ZG8sIGV2ZW50KSB7XHJcbiAgICAgICAgICByZXR1cm4gIWV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBkdXJhdGlvbjoge1xyXG4gICAgICAgIG9uQWRkOiBmdW5jdGlvbihwc2V1ZG8pe1xyXG4gICAgICAgICAgcHNldWRvLnNvdXJjZS5kdXJhdGlvbiA9IE51bWJlcihwc2V1ZG8udmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgY2FwdHVyZToge1xyXG4gICAgICAgIG9uQ29tcGlsZWQ6IGZ1bmN0aW9uKGZuLCBwc2V1ZG8pe1xyXG4gICAgICAgICAgaWYgKHBzZXVkby5zb3VyY2UpIHBzZXVkby5zb3VyY2UuY2FwdHVyZSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qIFVUSUxJVElFUyAqL1xyXG5cclxuICAgIGNsb25lOiBjbG9uZSxcclxuICAgIHR5cGVPZjogdHlwZU9mLFxyXG4gICAgdG9BcnJheTogdG9BcnJheSxcclxuXHJcbiAgICB3cmFwOiBmdW5jdGlvbiAob3JpZ2luYWwsIGZuKSB7XHJcbiAgICAgIHJldHVybiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBvdXRwdXQgPSBvcmlnaW5hbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcclxuICAgICAgfTtcclxuICAgIH0sXHJcbiAgICAvKlxyXG4gICAgICBSZWN1cnNpdmVseSBtZXJnZXMgb25lIG9iamVjdCB3aXRoIGFub3RoZXIuIFRoZSBmaXJzdCBhcmd1bWVudCBpcyB0aGUgZGVzdGluYXRpb24gb2JqZWN0LFxyXG4gICAgICBhbGwgb3RoZXIgb2JqZWN0cyBwYXNzZWQgaW4gYXMgYXJndW1lbnRzIGFyZSBtZXJnZWQgZnJvbSByaWdodCB0byBsZWZ0LCBjb25mbGljdHMgYXJlIG92ZXJ3cml0dGVuXHJcbiAgICAqL1xyXG4gICAgbWVyZ2U6IGZ1bmN0aW9uKHNvdXJjZSwgaywgdil7XHJcbiAgICAgIGlmICh0eXBlT2YoaykgPT0gJ3N0cmluZycpIHJldHVybiBtZXJnZU9uZShzb3VyY2UsIGssIHYpO1xyXG4gICAgICBmb3IgKHZhciBpID0gMSwgbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspe1xyXG4gICAgICAgIHZhciBvYmplY3QgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkgbWVyZ2VPbmUoc291cmNlLCBrZXksIG9iamVjdFtrZXldKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gc291cmNlO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKlxyXG4gICAgICAtLS0tLSBUaGlzIHNob3VsZCBiZSBzaW1wbGlmaWVkISAtLS0tLVxyXG4gICAgICBHZW5lcmF0ZXMgYSByYW5kb20gSUQgc3RyaW5nXHJcbiAgICAqL1xyXG4gICAgdWlkOiBmdW5jdGlvbigpe1xyXG4gICAgICByZXR1cm4gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsMTApO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiBET00gKi9cclxuXHJcbiAgICBxdWVyeTogcXVlcnksXHJcblxyXG4gICAgc2tpcFRyYW5zaXRpb246IGZ1bmN0aW9uKGVsZW1lbnQsIGZuLCBiaW5kKXtcclxuICAgICAgdmFyIHByb3AgPSBwcmVmaXguanMgKyAnVHJhbnNpdGlvblByb3BlcnR5JztcclxuICAgICAgZWxlbWVudC5zdHlsZVtwcm9wXSA9IGVsZW1lbnQuc3R5bGUudHJhbnNpdGlvblByb3BlcnR5ID0gJ25vbmUnO1xyXG4gICAgICB2YXIgY2FsbGJhY2sgPSBmbiA/IGZuLmNhbGwoYmluZCB8fCBlbGVtZW50KSA6IG51bGw7XHJcbiAgICAgIHJldHVybiB4dGFnLnNraXBGcmFtZShmdW5jdGlvbigpe1xyXG4gICAgICAgIGVsZW1lbnQuc3R5bGVbcHJvcF0gPSBlbGVtZW50LnN0eWxlLnRyYW5zaXRpb25Qcm9wZXJ0eSA9ICcnO1xyXG4gICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2suY2FsbChiaW5kIHx8IGVsZW1lbnQpO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVxdWVzdEZyYW1lOiAoZnVuY3Rpb24oKXtcclxuICAgICAgdmFyIHJhZiA9IHdpbi5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuICAgICAgICAgICAgICAgIHdpbltwcmVmaXgubG93ZXJjYXNlICsgJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddIHx8XHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihmbil7IHJldHVybiB3aW4uc2V0VGltZW91dChmbiwgMjApOyB9O1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24oZm4peyByZXR1cm4gcmFmKGZuKTsgfTtcclxuICAgIH0pKCksXHJcblxyXG4gICAgY2FuY2VsRnJhbWU6IChmdW5jdGlvbigpe1xyXG4gICAgICB2YXIgY2FuY2VsID0gd2luLmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XHJcbiAgICAgICAgICAgICAgICAgICB3aW5bcHJlZml4Lmxvd2VyY2FzZSArICdDYW5jZWxBbmltYXRpb25GcmFtZSddIHx8XHJcbiAgICAgICAgICAgICAgICAgICB3aW4uY2xlYXJUaW1lb3V0O1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24oaWQpeyByZXR1cm4gY2FuY2VsKGlkKTsgfTtcclxuICAgIH0pKCksXHJcblxyXG4gICAgc2tpcEZyYW1lOiBmdW5jdGlvbihmbil7XHJcbiAgICAgIHZhciBpZCA9IHh0YWcucmVxdWVzdEZyYW1lKGZ1bmN0aW9uKCl7IGlkID0geHRhZy5yZXF1ZXN0RnJhbWUoZm4pOyB9KTtcclxuICAgICAgcmV0dXJuIGlkO1xyXG4gICAgfSxcclxuXHJcbiAgICBtYXRjaFNlbGVjdG9yOiBmdW5jdGlvbiAoZWxlbWVudCwgc2VsZWN0b3IpIHtcclxuICAgICAgcmV0dXJuIG1hdGNoU2VsZWN0b3IuY2FsbChlbGVtZW50LCBzZWxlY3Rvcik7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldDogZnVuY3Rpb24gKGVsZW1lbnQsIG1ldGhvZCwgdmFsdWUpIHtcclxuICAgICAgZWxlbWVudFttZXRob2RdID0gdmFsdWU7XHJcbiAgICAgIGlmICh3aW5kb3cuQ3VzdG9tRWxlbWVudHMpIEN1c3RvbUVsZW1lbnRzLnVwZ3JhZGVBbGwoZWxlbWVudCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlubmVySFRNTDogZnVuY3Rpb24oZWwsIGh0bWwpe1xyXG4gICAgICB4dGFnLnNldChlbCwgJ2lubmVySFRNTCcsIGh0bWwpO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYXNDbGFzczogZnVuY3Rpb24gKGVsZW1lbnQsIGtsYXNzKSB7XHJcbiAgICAgIHJldHVybiBlbGVtZW50LmNsYXNzTmFtZS5zcGxpdCgnICcpLmluZGV4T2Yoa2xhc3MudHJpbSgpKT4tMTtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBrbGFzcykge1xyXG4gICAgICB2YXIgbGlzdCA9IGVsZW1lbnQuY2xhc3NOYW1lLnRyaW0oKS5zcGxpdCgnICcpO1xyXG4gICAgICBrbGFzcy50cmltKCkuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgaWYgKCF+bGlzdC5pbmRleE9mKG5hbWUpKSBsaXN0LnB1c2gobmFtZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGxpc3Quam9pbignICcpLnRyaW0oKTtcclxuICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbiAoZWxlbWVudCwga2xhc3MpIHtcclxuICAgICAgdmFyIGNsYXNzZXMgPSBrbGFzcy50cmltKCkuc3BsaXQoJyAnKTtcclxuICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBlbGVtZW50LmNsYXNzTmFtZS50cmltKCkuc3BsaXQoJyAnKS5maWx0ZXIoZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gbmFtZSAmJiAhfmNsYXNzZXMuaW5kZXhPZihuYW1lKTtcclxuICAgICAgfSkuam9pbignICcpO1xyXG4gICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgIH0sXHJcblxyXG4gICAgdG9nZ2xlQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBrbGFzcykge1xyXG4gICAgICByZXR1cm4geHRhZ1t4dGFnLmhhc0NsYXNzKGVsZW1lbnQsIGtsYXNzKSA/ICdyZW1vdmVDbGFzcycgOiAnYWRkQ2xhc3MnXS5jYWxsKG51bGwsIGVsZW1lbnQsIGtsYXNzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLypcclxuICAgICAgUnVucyBhIHF1ZXJ5IG9uIG9ubHkgdGhlIGNoaWxkcmVuIG9mIGFuIGVsZW1lbnRcclxuICAgICovXHJcbiAgICBxdWVyeUNoaWxkcmVuOiBmdW5jdGlvbiAoZWxlbWVudCwgc2VsZWN0b3IpIHtcclxuICAgICAgdmFyIGlkID0gZWxlbWVudC5pZCxcclxuICAgICAgICAgIGF0dHIgPSAnIycgKyAoZWxlbWVudC5pZCA9IGlkIHx8ICd4XycgKyB4dGFnLnVpZCgpKSArICcgPiAnLFxyXG4gICAgICAgICAgcGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlIHx8ICFjb250YWluZXIuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XHJcbiAgICAgIHNlbGVjdG9yID0gYXR0ciArIChzZWxlY3RvciArICcnKS5yZXBsYWNlKHJlZ2V4UmVwbGFjZUNvbW1hcywgJywnICsgYXR0cik7XHJcbiAgICAgIHZhciByZXN1bHQgPSBlbGVtZW50LnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XHJcbiAgICAgIGlmICghaWQpIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpZCcpO1xyXG4gICAgICBpZiAoIXBhcmVudCkgY29udGFpbmVyLnJlbW92ZUNoaWxkKGVsZW1lbnQpO1xyXG4gICAgICByZXR1cm4gdG9BcnJheShyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKlxyXG4gICAgICBDcmVhdGVzIGEgZG9jdW1lbnQgZnJhZ21lbnQgd2l0aCB0aGUgY29udGVudCBwYXNzZWQgaW4gLSBjb250ZW50IGNhbiBiZVxyXG4gICAgICBhIHN0cmluZyBvZiBIVE1MLCBhbiBlbGVtZW50LCBvciBhbiBhcnJheS9jb2xsZWN0aW9uIG9mIGVsZW1lbnRzXHJcbiAgICAqL1xyXG4gICAgY3JlYXRlRnJhZ21lbnQ6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcclxuICAgICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcclxuICAgICAgaWYgKGNvbnRlbnQpIHtcclxuICAgICAgICBpZiAoY29udGVudC5ub2RlTmFtZSkgdG9BcnJheShhcmd1bWVudHMpLmZvckVhY2goZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICB0ZW1wbGF0ZS5jb250ZW50LmFwcGVuZENoaWxkKGUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGVsc2UgdGVtcGxhdGUuaW5uZXJIVE1MID0gcGFyc2VNdWx0aWxpbmUoY29udGVudCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qXHJcbiAgICAgIFJlbW92ZXMgYW4gZWxlbWVudCBmcm9tIHRoZSBET00gZm9yIG1vcmUgcGVyZm9ybWFudCBub2RlIG1hbmlwdWxhdGlvbi4gVGhlIGVsZW1lbnRcclxuICAgICAgaXMgcGxhY2VkIGJhY2sgaW50byB0aGUgRE9NIGF0IHRoZSBwbGFjZSBpdCB3YXMgdGFrZW4gZnJvbS5cclxuICAgICovXHJcbiAgICBtYW5pcHVsYXRlOiBmdW5jdGlvbihlbGVtZW50LCBmbil7XHJcbiAgICAgIHZhciBuZXh0ID0gZWxlbWVudC5uZXh0U2libGluZyxcclxuICAgICAgICAgIHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSxcclxuICAgICAgICAgIHJldHVybmVkID0gZm4uY2FsbChlbGVtZW50KSB8fCBlbGVtZW50O1xyXG4gICAgICBpZiAobmV4dCkgcGFyZW50Lmluc2VydEJlZm9yZShyZXR1cm5lZCwgbmV4dCk7XHJcbiAgICAgIGVsc2UgcGFyZW50LmFwcGVuZENoaWxkKHJldHVybmVkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyogUFNFVURPUyAqL1xyXG5cclxuICAgIGFwcGx5UHNldWRvczogZnVuY3Rpb24oa2V5LCBmbiwgdGFyZ2V0LCBzb3VyY2UpIHtcclxuICAgICAgdmFyIGxpc3RlbmVyID0gZm4sXHJcbiAgICAgICAgICBwc2V1ZG9zID0ge307XHJcbiAgICAgIGlmIChrZXkubWF0Y2goJzonKSkge1xyXG4gICAgICAgIHZhciBtYXRjaGVzID0gW10sXHJcbiAgICAgICAgICAgIHZhbHVlRmxhZyA9IDA7XHJcbiAgICAgICAga2V5LnJlcGxhY2UocmVnZXhQc2V1ZG9QYXJlbnMsIGZ1bmN0aW9uKG1hdGNoKXtcclxuICAgICAgICAgIGlmIChtYXRjaCA9PSAnKCcpIHJldHVybiArK3ZhbHVlRmxhZyA9PSAxID8gJ1xcdTI3NkEnIDogJygnO1xyXG4gICAgICAgICAgcmV0dXJuICEtLXZhbHVlRmxhZyA/ICdcXHUyNzZCJyA6ICcpJztcclxuICAgICAgICB9KS5yZXBsYWNlKHJlZ2V4UHNldWRvQ2FwdHVyZSwgZnVuY3Rpb24oeiwgbmFtZSwgdmFsdWUsIHNvbG8pe1xyXG4gICAgICAgICAgbWF0Y2hlcy5wdXNoKFtuYW1lIHx8IHNvbG8sIHZhbHVlXSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdmFyIGkgPSBtYXRjaGVzLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoaS0tKSBwYXJzZVBzZXVkbyhmdW5jdGlvbigpe1xyXG4gICAgICAgICAgdmFyIG5hbWUgPSBtYXRjaGVzW2ldWzBdLFxyXG4gICAgICAgICAgICAgIHZhbHVlID0gbWF0Y2hlc1tpXVsxXTtcclxuICAgICAgICAgIGlmICgheHRhZy5wc2V1ZG9zW25hbWVdKSB0aHJvdyBcInBzZXVkbyBub3QgZm91bmQ6IFwiICsgbmFtZSArIFwiIFwiICsgdmFsdWU7XHJcbiAgICAgICAgICB2YWx1ZSA9ICh2YWx1ZSA9PT0gJycgfHwgdHlwZW9mIHZhbHVlID09ICd1bmRlZmluZWQnKSA/IG51bGwgOiB2YWx1ZTtcclxuICAgICAgICAgIHZhciBwc2V1ZG8gPSBwc2V1ZG9zW2ldID0gT2JqZWN0LmNyZWF0ZSh4dGFnLnBzZXVkb3NbbmFtZV0pO1xyXG4gICAgICAgICAgcHNldWRvLmtleSA9IGtleTtcclxuICAgICAgICAgIHBzZXVkby5uYW1lID0gbmFtZTtcclxuICAgICAgICAgIHBzZXVkby52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgcHNldWRvWydhcmd1bWVudHMnXSA9ICh2YWx1ZSB8fCAnJykuc3BsaXQoJywnKTtcclxuICAgICAgICAgIHBzZXVkby5hY3Rpb24gPSBwc2V1ZG8uYWN0aW9uIHx8IHRydWVvcDtcclxuICAgICAgICAgIHBzZXVkby5zb3VyY2UgPSBzb3VyY2U7XHJcbiAgICAgICAgICBwc2V1ZG8ub25BZGQgPSBwc2V1ZG8ub25BZGQgfHwgbm9vcDtcclxuICAgICAgICAgIHBzZXVkby5vblJlbW92ZSA9IHBzZXVkby5vblJlbW92ZSB8fCBub29wO1xyXG4gICAgICAgICAgdmFyIG9yaWdpbmFsID0gcHNldWRvLmxpc3RlbmVyID0gbGlzdGVuZXI7XHJcbiAgICAgICAgICBsaXN0ZW5lciA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSBwc2V1ZG8uYWN0aW9uLmFwcGx5KHRoaXMsIFtwc2V1ZG9dLmNvbmNhdCh0b0FycmF5KGFyZ3VtZW50cykpKTtcclxuICAgICAgICAgICAgaWYgKG91dHB1dCA9PT0gbnVsbCB8fCBvdXRwdXQgPT09IGZhbHNlKSByZXR1cm4gb3V0cHV0O1xyXG4gICAgICAgICAgICBvdXRwdXQgPSBwc2V1ZG8ubGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgcHNldWRvLmxpc3RlbmVyID0gb3JpZ2luYWw7XHJcbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgaWYgKCF0YXJnZXQpIHBzZXVkby5vbkFkZC5jYWxsKGZuLCBwc2V1ZG8pO1xyXG4gICAgICAgICAgZWxzZSB0YXJnZXQucHVzaChwc2V1ZG8pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGZvciAodmFyIHogaW4gcHNldWRvcykge1xyXG4gICAgICAgIGlmIChwc2V1ZG9zW3pdLm9uQ29tcGlsZWQpIGxpc3RlbmVyID0gcHNldWRvc1t6XS5vbkNvbXBpbGVkKGxpc3RlbmVyLCBwc2V1ZG9zW3pdKSB8fCBsaXN0ZW5lcjtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gbGlzdGVuZXI7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZVBzZXVkb3M6IGZ1bmN0aW9uKHRhcmdldCwgcHNldWRvcyl7XHJcbiAgICAgIHBzZXVkb3MuZm9yRWFjaChmdW5jdGlvbihvYmope1xyXG4gICAgICAgIG9iai5vblJlbW92ZS5jYWxsKHRhcmdldCwgb2JqKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAvKioqIEV2ZW50cyAqKiovXHJcblxyXG4gICAgcGFyc2VFdmVudDogZnVuY3Rpb24odHlwZSwgZm4pIHtcclxuICAgICAgdmFyIHBzZXVkb3MgPSB0eXBlLnNwbGl0KCc6JyksXHJcbiAgICAgICAgICBrZXkgPSBwc2V1ZG9zLnNoaWZ0KCksXHJcbiAgICAgICAgICBjdXN0b20gPSB4dGFnLmN1c3RvbUV2ZW50c1trZXldLFxyXG4gICAgICAgICAgZXZlbnQgPSB4dGFnLm1lcmdlKHtcclxuICAgICAgICAgICAgdHlwZToga2V5LFxyXG4gICAgICAgICAgICBzdGFjazogbm9vcCxcclxuICAgICAgICAgICAgY29uZGl0aW9uOiB0cnVlb3AsXHJcbiAgICAgICAgICAgIGNhcHR1cmU6IHh0YWcuY2FwdHVyZUV2ZW50c1trZXldLFxyXG4gICAgICAgICAgICBhdHRhY2g6IFtdLFxyXG4gICAgICAgICAgICBfYXR0YWNoOiBbXSxcclxuICAgICAgICAgICAgcHNldWRvczogJycsXHJcbiAgICAgICAgICAgIF9wc2V1ZG9zOiBbXSxcclxuICAgICAgICAgICAgb25BZGQ6IG5vb3AsXHJcbiAgICAgICAgICAgIG9uUmVtb3ZlOiBub29wXHJcbiAgICAgICAgICB9LCBjdXN0b20gfHwge30pO1xyXG4gICAgICBldmVudC5hdHRhY2ggPSB0b0FycmF5KGV2ZW50LmJhc2UgfHwgZXZlbnQuYXR0YWNoKTtcclxuICAgICAgZXZlbnQuY2hhaW4gPSBrZXkgKyAoZXZlbnQucHNldWRvcy5sZW5ndGggPyAnOicgKyBldmVudC5wc2V1ZG9zIDogJycpICsgKHBzZXVkb3MubGVuZ3RoID8gJzonICsgcHNldWRvcy5qb2luKCc6JykgOiAnJyk7XHJcbiAgICAgIHZhciBzdGFjayA9IHh0YWcuYXBwbHlQc2V1ZG9zKGV2ZW50LmNoYWluLCBmbiwgZXZlbnQuX3BzZXVkb3MsIGV2ZW50KTtcclxuICAgICAgZXZlbnQuc3RhY2sgPSBmdW5jdGlvbihlKXtcclxuICAgICAgICBlLmN1cnJlbnRUYXJnZXQgPSBlLmN1cnJlbnRUYXJnZXQgfHwgdGhpcztcclxuICAgICAgICB2YXIgZGV0YWlsID0gZS5kZXRhaWwgfHwge307XHJcbiAgICAgICAgaWYgKCFkZXRhaWwuX19zdGFja19fKSByZXR1cm4gc3RhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICBlbHNlIGlmIChkZXRhaWwuX19zdGFja19fID09IHN0YWNrKSB7XHJcbiAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgZS5jYW5jZWxCdWJibGUgPSB0cnVlO1xyXG4gICAgICAgICAgcmV0dXJuIHN0YWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgICBldmVudC5saXN0ZW5lciA9IGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMpLFxyXG4gICAgICAgICAgICBvdXRwdXQgPSBldmVudC5jb25kaXRpb24uYXBwbHkodGhpcywgYXJncy5jb25jYXQoW2V2ZW50XSkpO1xyXG4gICAgICAgIGlmICghb3V0cHV0KSByZXR1cm4gb3V0cHV0O1xyXG4gICAgICAgIC8vIFRoZSBzZWNvbmQgY29uZGl0aW9uIGluIHRoaXMgSUYgaXMgdG8gYWRkcmVzcyB0aGUgZm9sbG93aW5nIEJsaW5rIHJlZ3Jlc3Npb246IGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0zNjc1MzdcclxuICAgICAgICAvLyBSZW1vdmUgdGhpcyB3aGVuIGFmZmVjdGVkIGJyb3dzZXIgYnVpbGRzIHdpdGggdGhpcyByZWdyZXNzaW9uIGZhbGwgYmVsb3cgNSUgbWFya2V0c2hhcmVcclxuICAgICAgICBpZiAoZS50eXBlICE9IGtleSAmJiAoZS5iYXNlRXZlbnQgJiYgZS50eXBlICE9IGUuYmFzZUV2ZW50LnR5cGUpKSB7XHJcbiAgICAgICAgICB4dGFnLmZpcmVFdmVudChlLnRhcmdldCwga2V5LCB7XHJcbiAgICAgICAgICAgIGJhc2VFdmVudDogZSxcclxuICAgICAgICAgICAgZGV0YWlsOiBvdXRwdXQgIT09IHRydWUgJiYgKG91dHB1dC5fX3N0YWNrX18gPSBzdGFjaykgPyBvdXRwdXQgOiB7IF9fc3RhY2tfXzogc3RhY2sgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGV2ZW50LnN0YWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICB9O1xyXG4gICAgICBldmVudC5hdHRhY2guZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgICAgZXZlbnQuX2F0dGFjaC5wdXNoKHh0YWcucGFyc2VFdmVudChuYW1lLCBldmVudC5saXN0ZW5lcikpO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIGV2ZW50O1xyXG4gICAgfSxcclxuXHJcbiAgICBhZGRFdmVudDogZnVuY3Rpb24gKGVsZW1lbnQsIHR5cGUsIGZuLCBjYXB0dXJlKSB7XHJcbiAgICAgIHZhciBldmVudCA9IHR5cGVvZiBmbiA9PSAnZnVuY3Rpb24nID8geHRhZy5wYXJzZUV2ZW50KHR5cGUsIGZuKSA6IGZuO1xyXG4gICAgICBldmVudC5fcHNldWRvcy5mb3JFYWNoKGZ1bmN0aW9uKG9iail7XHJcbiAgICAgICAgb2JqLm9uQWRkLmNhbGwoZWxlbWVudCwgb2JqKTtcclxuICAgICAgfSk7XHJcbiAgICAgIGV2ZW50Ll9hdHRhY2guZm9yRWFjaChmdW5jdGlvbihvYmopIHtcclxuICAgICAgICB4dGFnLmFkZEV2ZW50KGVsZW1lbnQsIG9iai50eXBlLCBvYmopO1xyXG4gICAgICB9KTtcclxuICAgICAgZXZlbnQub25BZGQuY2FsbChlbGVtZW50LCBldmVudCwgZXZlbnQubGlzdGVuZXIpO1xyXG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQudHlwZSwgZXZlbnQuc3RhY2ssIGNhcHR1cmUgfHwgZXZlbnQuY2FwdHVyZSk7XHJcbiAgICAgIHJldHVybiBldmVudDtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkRXZlbnRzOiBmdW5jdGlvbiAoZWxlbWVudCwgb2JqKSB7XHJcbiAgICAgIHZhciBldmVudHMgPSB7fTtcclxuICAgICAgZm9yICh2YXIgeiBpbiBvYmopIHtcclxuICAgICAgICBldmVudHNbel0gPSB4dGFnLmFkZEV2ZW50KGVsZW1lbnQsIHosIG9ialt6XSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGV2ZW50cztcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlRXZlbnQ6IGZ1bmN0aW9uIChlbGVtZW50LCB0eXBlLCBldmVudCkge1xyXG4gICAgICBldmVudCA9IGV2ZW50IHx8IHR5cGU7XHJcbiAgICAgIGV2ZW50Lm9uUmVtb3ZlLmNhbGwoZWxlbWVudCwgZXZlbnQsIGV2ZW50Lmxpc3RlbmVyKTtcclxuICAgICAgeHRhZy5yZW1vdmVQc2V1ZG9zKGVsZW1lbnQsIGV2ZW50Ll9wc2V1ZG9zKTtcclxuICAgICAgZXZlbnQuX2F0dGFjaC5mb3JFYWNoKGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIHh0YWcucmVtb3ZlRXZlbnQoZWxlbWVudCwgb2JqKTtcclxuICAgICAgfSk7XHJcbiAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudC50eXBlLCBldmVudC5zdGFjayk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUV2ZW50czogZnVuY3Rpb24oZWxlbWVudCwgb2JqKXtcclxuICAgICAgZm9yICh2YXIgeiBpbiBvYmopIHh0YWcucmVtb3ZlRXZlbnQoZWxlbWVudCwgb2JqW3pdKTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlyZUV2ZW50OiBmdW5jdGlvbihlbGVtZW50LCB0eXBlLCBvcHRpb25zKXtcclxuICAgICAgdmFyIGV2ZW50ID0gZG9jLmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xyXG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgZXZlbnQuaW5pdEN1c3RvbUV2ZW50KHR5cGUsXHJcbiAgICAgICAgb3B0aW9ucy5idWJibGVzICE9PSBmYWxzZSxcclxuICAgICAgICBvcHRpb25zLmNhbmNlbGFibGUgIT09IGZhbHNlLFxyXG4gICAgICAgIG9wdGlvbnMuZGV0YWlsXHJcbiAgICAgICk7XHJcbiAgICAgIGlmIChvcHRpb25zLmJhc2VFdmVudCkgaW5oZXJpdEV2ZW50KGV2ZW50LCBvcHRpb25zLmJhc2VFdmVudCk7XHJcbiAgICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIGRlZmluZSh4dGFnKTtcclxuICBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSB4dGFnO1xyXG4gIGVsc2Ugd2luLnh0YWcgPSB4dGFnO1xyXG5cclxuICBkb2MuYWRkRXZlbnRMaXN0ZW5lcignV2ViQ29tcG9uZW50c1JlYWR5JywgZnVuY3Rpb24oKXtcclxuICAgIHh0YWcuZmlyZUV2ZW50KGRvYy5ib2R5LCAnRE9NQ29tcG9uZW50c0xvYWRlZCcpO1xyXG4gIH0pO1xyXG5cclxufSkoKTtcclxuIl19
