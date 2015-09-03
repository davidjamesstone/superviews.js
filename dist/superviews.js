!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.superviews=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/**
 * Default Options
 */
var defaultOptions = {
  prefix: 'ui'
};

/**
 * Convert a NodeList into an Array
 * @method nodeListToArray
 * @param NodeList nodeList
 * @return nodeArray
 */
function nodeListToArray(nodeList) {
  var nodeArray = [];
  for (var i = 0; i < nodeList.length; i++) {
    nodeArray.push(nodeList[i]);
  }
  return nodeArray;
}

/**
 * Scope Constructor
 * @method Scope
 * @param Element el
 * @param Object ctx
 * @return Scope instance
 */
function Scope(el, ctx) {
  this.el = el;
  this.ctx = ctx;
}

/**
 * getEvaluateFnObj
 */
function getEvaluateFnObj(scopes, argOffset) {
  var scopesLength = scopes.length;
  var currentScope = scopes[scopesLength - 1];
  var pre = '', post = '', idx;

  for (var i = 0; i < scopesLength; i++) {
    idx = i + (argOffset || 0);
    pre += 'with (arguments[' + idx + '].ctx) {\n';
    post += '\n}';
  }

  return {
    pre: pre,
    post: post,
    currentScope: currentScope
  };
  
}

/**
 * Evaluate
 * @method evaluate
 * @param Object scopes
 * @param string statement
 * @return
 */
function evaluate(scopes, statement) {
  var obj = getEvaluateFnObj(scopes);
  return (new Function(obj.pre + ' return ' + statement + ';' + obj.post)).apply(obj.currentScope.ctx, scopes);
}

/**
 * Simple mixin
 * @method mixin
 * @param Object target
 * @param Object source
 * @return target
 */
function scopes(target, source) {
  for (var key in source) {
    target[key] = source[key];
  }
  return target;
}

/**
 * Get the attribute name with any prefix
 * @method getAttrName
 * @param string prefix
 * @param string name
 * @return attributeName
 */
function getAttrName(prefix, name) {
  return prefix ? (prefix + '-' + name) : name;
}


/**
 * Find the Scopes of an element
 * @method findScopes
 * @param Element el
 * @param [Scope] scopes
 * @return [Scope]
 */
function findScopes(el, scopes) {

  var scopeChain = [], scopeElements;

  var idx, check = el;

  while (check) {

    if (check.__scopes) {
      
      // return a shallow copy
      return check.__scopes.slice(0);

    } else {

      var scope;
      for (var i = 0; i < scopes.length; i++) {
        scope = scopes[i];
        if (scope.el === check) {
          scopeChain.unshift(scope);
          if (scope.ctx === '__IGNORE__') {
            return scopeChain;
          }
        }
      }
      





      // scopeElements = scopeElements || (scopeElements = scopes.map(function(item) {
      //   return item.el;
      // }));
      
      // idx = scopeElements.lastIndexOf(check);
      
      // var matches = scopeElements.filter(function() {
      //   return item === check;
      // });
      
      // if (idx !== -1) {
      //   var match = scopes[idx];
      //   scopeChain.unshift(match);
      //   if (match.ctx === '__IGNORE__') {
      //     return scopeChain;
      //   }
      // }

    }

    check = check.parentNode;

  }

  if (!scopeChain.length) {
    throw new Error('Unable to resolve scopes');
  }

  return scopeChain;
}

/**
 * Insert into DOM after the specified element
 * @method insertAfter
 * @param Element newNode
 * @param Element referenceNode
 */
function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

/**
 * Superviews
 * @method superviews
 * @param Element rootEl
 * @param Object rootCtx
 * @param Object options
 * @return
 */
function superviews(rootEl, rootCtx, options) {

  rootEl = rootEl || document.body;
  rootCtx = rootCtx || window;

  var opts = Object.create(defaultOptions);

  if (options) {
    mixin(opts, options);
  }

  var prefix = opts.prefix;
  var dupeAttrName = getAttrName(prefix, 'dupe');
  var withAttrName = getAttrName(prefix, 'with');
  var forAttrName = getAttrName(prefix, 'for');
  var ifAttrName = getAttrName(prefix, 'if');
  var attrsAttrName = getAttrName(prefix, 'attrs');
  var textAttrName = getAttrName(prefix, 'text');
  var htmlAttrName = getAttrName(prefix, 'html');
  var valueAttrName = getAttrName(prefix, 'value');
  var bindAttrName = getAttrName(prefix, 'bind');
  var clickAttrName = getAttrName(prefix, 'click');

  var selectors = [withAttrName, forAttrName, textAttrName, ifAttrName,
    attrsAttrName, htmlAttrName, valueAttrName, bindAttrName, clickAttrName
  ];

  // de-duplicate
  Array.prototype.forEach.call(rootEl.querySelectorAll('[' + dupeAttrName + ']'), function(node) {
    node.parentNode.removeChild(node);
  });

  var selector = '[' + selectors.join('],[') + ']';

  var scopes = [new Scope(rootEl, rootCtx)];

  function registerIgnoreNode(el) {
    // Push a new Scope object with a special
    // identifier to indicate to child nodes
    // that they need not be processed. Used 
    // in `for` (if the are no items) and `if` 
    // (if it evaluates to falsey) to short-circuit 
    // processing any children.
    scopes.push(new Scope(el, '__IGNORE__'));
  }
    
    /**
     * Process an individual element
     * @method processNode
     * @param Element el
     * @return
     */
  function processNode(el) {

    var elScopes, attrs, withAttr, forAttr, ifAttr, attrsAttr, textAttr, 
      htmlAttr, valueAttr, bindAttr, clickAttr, forItems;

    attrs = el.attributes;
    elScopes = findScopes(el, scopes);

    // This element could be a child
    // of a node we have already
    // discounted. If so, do no work.
    for (var i = 0; i < elScopes.length; i++) {
      if (elScopes[i].ctx === '__IGNORE__') {
        return;
      }
    }

    withAttr = attrs[withAttrName];
    if (withAttr) {
      var newCtx = evaluate(elScopes, withAttr.value);
      scopes.push(new Scope(el, newCtx));
    }

    ifAttr = attrs[ifAttrName];
    if (ifAttr) {
      var ifTest = !!evaluate(elScopes, ifAttr.value);

      if (ifTest) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
        registerIgnoreNode(el);
        return;
      }
    }

    forAttr = attrs[forAttrName];
    if (forAttr) {
      forItems = evaluate(elScopes, forAttr.value);
      
      // Capture the initial state of the 
      // dom element and use it as the template
      var template = el.__template || (el.__template = el.cloneNode(true));
      
      if (forItems.length) {

        // Push the first (template) element
        // onto both the current scope stack
        // and the main scope stack. This will be
        // used after we continue processing 
        // the children.
        var firstItem = forItems[0];
        var newScope = new Scope(el, firstItem);
        elScopes.push(newScope);
        scopes.push(newScope);

        // For each additional item in the foreach,
        // we clone the template element and also 
        // clone the elScopes of this current element
        // given they're siblings. We replace the last 
        // scope to set it to the current foreach item
        // The cloned scopes are added to the element
        // to save us having to re-look them up when
        // we process() them.
        var lastScopeIdx = elScopes.length - 1;

        if (forItems.length > 1) {

          var ctnr = document.createElement('div');
          var clone, scopesClone;
          for (var j = 1; j < forItems.length; j++) {
            clone = template.cloneNode(true);
            clone.removeAttribute(forAttrName);
            clone.setAttribute(dupeAttrName, '');
            scopesClone = elScopes.slice(0);
            scopesClone[lastScopeIdx] = new Scope(clone, forItems[j]);
            clone.__scopes = scopesClone;
            ctnr.appendChild(clone);
          }
          process(ctnr);

          // Once all the foreach items have been
          // created and process, we insert them into
          // the DOM.
          var after, child;
          while (ctnr.children.length) {
            child = ctnr.children[0];
            insertAfter(child, after || el);
            after = child;
          }

        }

        el.style.display = '';

      } else {

        // Because the Array is empty we can hide it.
        el.style.display = 'none';

        registerIgnoreNode(el);

        // We can return now as no more processing
        // needs to be done against this node
        return;

      }
    }

    textAttr = attrs[textAttrName];
    if (textAttr) {
      el[('innerText' in el) ? 'innerText' : 'textContent'] = evaluate(elScopes, textAttr.value);
    }

    htmlAttr = attrs[htmlAttrName];
    if (htmlAttr) {
      el.innerHTML = evaluate(elScopes, htmlAttr.value);
    }

    valueAttr = attrs[valueAttrName];
    if (valueAttr) {
      el.value = evaluate(elScopes, valueAttr.value);
    }

    bindAttr = attrs[bindAttrName];
    if (bindAttr) {
      var bindProp = ~['checkbox', 'radio'].indexOf(el.type) ? 'checked' : 'value';
      var bindValue = evaluate(elScopes, bindAttr.value);
      if (typeof bindValue === 'undefined') {
        bindValue = '';
      }
      
      if (~['SELECT'].indexOf(el.tagName)) {
        // todo: consider binding last?
        // defer the binding until children have been processed
        setTimeout(function() {
          el[bindProp] = bindValue;
        });
      } else {
        el[bindProp] = bindValue;
      }

      if (el.__bind) {
        el.removeEventListener('change', el.__bind);
      }

      el.__bind = function() {
        var obj = getEvaluateFnObj(elScopes, 1);
        var args = [this[bindProp]].concat(elScopes);
        return (new Function('val', obj.pre + bindAttr.value + ' = val;' + obj.post)).apply(this, args);
      };
      el.addEventListener('change', el.__bind, false);
    }

    attrsAttr = attrs[attrsAttrName];
    if (attrsAttr) {
      var attrsObj = evaluate(elScopes, attrsAttr.value);
      for (var attrName in attrsObj) {
        var attrValue = attrsObj[attrName];
        if (attrValue === null || typeof attrValue === 'undefined') {
          el.removeAttribute(attrName);
        } else {
          el.setAttribute(attrName, attrValue);
        }
      }
    }

    clickAttr = attrs[clickAttrName];
    if (clickAttr) {

      if (el.__click && el.__click.scopes !== elScopes) {
        el.removeEventListener('click', el.__click.fn);
        delete el.__click;
      }

      if (!el.__click) {
        var fn = function(e) {
          var obj = getEvaluateFnObj(elScopes, 2);
          var args = [e, obj.currentScope.ctx].concat(elScopes);
          return (new Function('e', 'ctx', obj.pre + clickAttr.value + ';' + obj.post)).apply(this, args);
        };

        el.__click = {
          fn: fn,
          scopes: elScopes
        };
        el.addEventListener('click', fn, false);

      }
    }

  }

  /**
   * Processes an element
   * @method process
   * @param Element el
   * @return
   */
  function process(el) {

    var initialSelection = el.querySelectorAll(selector);
    var selection = nodeListToArray(initialSelection);

    // If element has no parent node,
    // assume it's a temporary foreach
    // we are dealing with and don't add
    // it to the list of nodes to process
    if (el.parentNode) {
      selection.unshift(el);
    }

    var node;
    for (var i = 0; i < selection.length; i++) {

      node = selection[i];
      processNode(node);

    }

  }

  process(rootEl);
}

module.exports = superviews;
},{}]},{},[1])
(1)
});