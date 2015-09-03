/**
 * Default Options
 */
var defaultOptions = {
  prefix: 'ui',
  dupeAttrName: 'dupe',
  withAttrName: 'with',
  forAttrName: 'for',
  ifAttrName: 'if',
  attrsAttrName: 'attrs',
  textAttrName: 'text',
  htmlAttrName: 'html',
  valueAttrName: 'value',
  bindAttrName: 'bind'
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
 * Evaluate
 * @method evaluate
 * @param Object ctx
 * @param string statement
 * @return
 */
function evaluate(ctx, statement) {
  return (new Function('ctx', 'with (ctx) {\n return ' + statement + '\n}'))(ctx);
}

/**
 * Simple mixin
 * @method mixin
 * @param Object target
 * @param Object source
 * @return target
 */
function mixin(target, source) {
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
 * Find the Scope of an element
 * @method findScope
 * @param Element el
 * @param [Scopes] scopes
 * @return Scope
 */
function findScope(el, scopes) {

  var scopeElements = scopes.map(function(item) {
    return item.el;
  });

  var idx, check = el;
  while (check) {
    if (check.__ctx) {
      return {
        el: check,
        ctx: check.__ctx
      };
    }

    idx = scopeElements.lastIndexOf(check);
    if (idx !== -1) {
      return scopes[idx];
    }
    check = check.parentNode;
  }

  throw new Error('Unable to resolve scope');
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
  var dupeAttrName = getAttrName(prefix, opts.dupeAttrName);
  var withAttrName = getAttrName(prefix, opts.withAttrName);
  var forAttrName = getAttrName(prefix, opts.forAttrName);
  var ifAttrName = getAttrName(prefix, opts.ifAttrName);
  var attrsAttrName = getAttrName(prefix, opts.attrsAttrName);
  var textAttrName = getAttrName(prefix, opts.textAttrName);
  var htmlAttrName = getAttrName(prefix, opts.valueAttrName);
  var valueAttrName = getAttrName(prefix, opts.valueAttrName);
  var bindAttrName = getAttrName(prefix, opts.bindAttrName);
  var clickAttrName = getAttrName(prefix, 'click');
  
  var selectors = [withAttrName, forAttrName, textAttrName, ifAttrName,
    attrsAttrName, htmlAttrName, valueAttrName, bindAttrName, clickAttrName
  ];

  // de-duplicate
  Array.prototype.forEach.call(rootEl.querySelectorAll('[' + dupeAttrName + ']'), function(node) {
    node.parentNode.removeChild(node);
  });

  var selector = '[' + selectors.join('],[') + ']';

  scopes = [new Scope(rootEl, rootCtx)];

  function registerIgnoreNode(el) {
    // Push a new Scope object with a special
    // identifier to indicate to child nodes
    // that they need not be processed
    scopes.push(new Scope(el, '__IGNORE__'));
  }
  /**
   * Process an individual element
   * @method processNode
   * @param Element el
   * @return
   */
  function processNode(el) {

    var ctx, attrs, withAttr, forAttr, ifAttr, attrsAttr, textAttr, htmlAttr, valueAttr, bindAttr, clickAttr, forItems;

    attrs = el.attributes;
    ctx = findScope(el, scopes).ctx;//el.__ctx || 

    // This element could be a child
    // of a node we have already
    // discounted. If so, do no work.
    if (ctx === '__IGNORE__') {
      return;
    }


    withAttr = attrs[withAttrName];
    if (withAttr) {
      ctx = evaluate(ctx, withAttr.value);
      scopes.push(new Scope(el, ctx));
    }

    ifAttr = attrs[ifAttrName];
    if (ifAttr) {
      var ifTest = !!evaluate(ctx, ifAttr.value);

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
      forItems = evaluate(ctx, forAttr.value);

      if (forItems.length) {

        var firstItem = forItems[0];
        scopes.push(new Scope(el, firstItem));
        ctx = firstItem;

        if (forItems.length > 1) {

          var ctnr = document.createElement('div');
          var clone;
          for (var j = 1; j < forItems.length; j++) {
            clone = el.cloneNode(true);
            clone.removeAttribute(forAttrName);
            clone.setAttribute(dupeAttrName, '');
            clone.__ctx = forItems[j];
            ctnr.appendChild(clone);
          }
          process(ctnr);

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
      el.innerText = evaluate(ctx, textAttr.value);
    }

    htmlAttr = attrs[htmlAttrName];
    if (htmlAttr) {
      el.innerHTML = evaluate(ctx, htmlAttr.value);
    }

    valueAttr = attrs[valueAttrName];
    if (valueAttr) {
      el.value = evaluate(ctx, valueAttr.value);
    }

    bindAttr = attrs[bindAttrName];
    if (bindAttr) {
      el.value = evaluate(ctx, bindAttr.value);

      if (el.__bind) {
        el.removeEventListener('change', el.__bind);
      }
      
      el.__bind = function() {
        (new Function('ctx', 'value', 'with (ctx) {\n ' + bindAttr.value + ' = value;\n}'))(ctx, this.value);
      };
      el.addEventListener('change', el.__bind, false);
    }

    attrsAttr = attrs[attrsAttrName];
    if (attrsAttr) {
      var attrsObj = evaluate(ctx, attrsAttr.value);
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
      
      if (el.__click && el.__click.ctx !== ctx) {
        el.removeEventListener('click', el.__click.fn);
        delete el.__click;
      }
      
      if (!el.__click) {
        var fn = function(e) {
          return (new Function('e', 'ctx', 'with (ctx) {\n' + clickAttr.value + '\n}')).call(this, e, ctx);
        };
        
        el.__click = {
          fn: fn,
          ctx: ctx
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