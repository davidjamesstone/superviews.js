// Plugin definition.
$.fn.superviews = function(data, options) {

  // Extend our default options with those provided.
  // Note that the first argument to extend is an empty
  // object – this is to keep from overriding our "defaults" object.
  var opts = $.fn.superviews.defaults//$.extend({}, $.fn.superviews.defaults, options);

  // local data keys
  var dataKey = $.fn.superviews.defaults.prefix + '-for-data';
  var templateKey = $.fn.superviews.defaults.prefix + '-for-template';

  // Plugin implementation code
  var $el = this;
  var keys = Object.keys(opts.attributes);

  var selectors = keys.map(function(item) {
    return opts.genAttrName(item);
  });

  function nodeListToArray(nodeList) {
    var nodeArray = [];
    for (var i = 0; i < nodeList.length; i++) {
      nodeArray.push(nodeList[i]);
    }
    return nodeArray;
  }
  
  function makeTpl(str) {
    // Find the first whitespace char
    var idx = str.indexOf(' ');
    var pre = str.substr(0, idx);
    var post = str.substring(idx);
    
    return function(withAttr, i) {
      var attrStr = ' ' + withAttr + '=[' + i + ']';
      return pre + attrStr + post;
    };
    
  }
  
  function evaluate(ctx, statement) {
    return (new Function('with (' + ctx + ') {\n return ' + statement + '\n}' ))();
  }
  
  var selector = '[' + selectors.join('],[') + ']';
  var $selection = this.get(0).querySelectorAll(selector);
  var selection = nodeListToArray($selection);

  function processNode(node, ctx) {

    var attr, attrVal;
    var $node = $(node);
    
    /**
     * for
     */
    attr = node.attributes[selectors[0]]//node.attributes.getNamedItem(selectors[0]);
    if (attr) {

      var ctx = $node.ctx();
      var value = evaluate(ctx, attr.value);

      // remove node children from the main selection
      // could do some optimizations around index > current index
      selection = selection.filter(function(item) {
        return !$.contains(node, item);
      });

      // Get the repeater template fn
      // or create if it's not available
      // var template = $node.data(templateKey);
      // if (!template) {
      //   template = makeTpl(node.innerHTML.trim());
      //   $node.data(templateKey, template);
      // }
      var template = node.__tpl;
      if (!template) {
        template = makeTpl(node.innerHTML.trim());
        node.__tpl = template;
      }
      
      // Resolve the 'with' attribute name
      var withAttr = $.fn.superviews.defaults.genAttrName('with');

      // Remove any current items and iterate 
      // over the new items, appending as we go
      var html = '';
      for (var i = 0; i < value.length; i++) {
        html += template(withAttr, i);
      }
      // var html = [];
      // for (var i = 0; i < value.length; i++) {
      //   html.push(template(withAttr, i));
      // }
      node.innerHTML = html//.join('');
      //$node.html(html.join(''));
      
      // Rescan the new children for any attributes
      // and push them onto the stack to be processed
      var nodeSelection = node.querySelectorAll(selector);
      Array.prototype.push.apply(selection, nodeListToArray(nodeSelection));
      
      // return immediately? Should for loops do this?
      return;

    } // end attr for


    /**
     * text
     */
    attr = node.attributes[selectors[3]]//node.attributes.getNamedItem(selectors[3]);
    if (attr) {

      var ctx = $node.ctx();
      var value = evaluate(ctx, attr.value);
      node.innerText = value;

    } // end attr text

    /**
     * click
     */
    attr = node.attributes[selectors[2]]//node.attributes.getNamedItem(selectors[2]);
    if (attr) {
      var ctx = $node.ctx();
      node.onclick = new Function('e', 'with (' + ctx + ') {\n ' + attr.value + ';\n}' );
    } // end attr click

    /**
     * attr
     */
    attr = node.attributes[selectors[4]]//node.attributes.getNamedItem(selectors[4]);
    if (attr) {
      var ctx = $node.ctx();
      var value = evaluate(ctx, attr.value);
      for (var prop in value) {
        node.setAttribute(prop, value[prop]);
      }
      //$node.attr(value);
    } // end attr attr

  }

  while (selection.length) {

    processNode(selection.shift());

  } // end while

};

// Plugin defaults – added as a property on our plugin function.
$.fn.superviews.defaults = {
  prefix: 'ui',
  genAttrName: function(name) {
    return $.fn.superviews.defaults.prefix + '-' + name;
  },
  attributes: {
    for: function(value) {
      var $this = $(this);
      var dataKey = $.fn.superviews.defaults.prefix + '-for-data';
      var templateKey = $.fn.superviews.defaults.prefix + '-for-template';

      // If the array hasn't changed 'shape', do no work
      var data = $this.data(dataKey);
      if (data) {
        if (data.length === value.length) {
          // todo: and they contain the same items etc...
          $this.superviews();
          return;
        }
      }

      var template = $this.data(templateKey);
      if (!template) {
        template = $this.html().trim();
        $this.data(templateKey, template);
      }

      var withAttr = $.fn.superviews.defaults.genAttrName('with');

      function spliceSlice(str, index, count, add) {
        return str.slice(0, index) + (add || '') + str.slice(index + count);
      }
      $this.html('');
      var html = ''; //[];
      for (var i = 0; i < value.length; i++) {
        //html += spliceSlice(template, 4, 0, ' ' + withAttr + '="[' + i + ']"');
        //html.push($(template).attr(withAttr, '[' + i + ']'));
        $this.append($(template).attr(withAttr, '[' + i + ']'));
      }

      // //$this.html('');
      // var html = '';//[];
      // for (var i = 0; i < value.length; i++) {
      //   html += spliceSlice(template, 4, 0, ' ' + withAttr + '="[' + i + ']"');
      //   //html.push($(template).attr(withAttr, '[' + i + ']'));
      // }
      // $this.html(html);

      // make a copy of the current items
      $this.data(dataKey, value.slice());

      $this.superviews();
    },
    'with': function() {

    },
    click: 1,
    text: function(value) {
      $(this).text(value);
    },
    attr: function(value) {
      $(this).attr(value);
    },
    // value: function(value) {
    //   $(this).val(value);
    // },
    // hide: function(value) {
    //   $(this)[value ? 'hide' : 'show']();
    // },
    // title: function(value) {
    //   this.title = value;
    // },
    // max: function(value) {
    //   $(this).attr('max', value);
    // },
    // 'class': function(value) {
    //   var keys = Object.keys(value),
    //     key, val;

    //   for (var i = 0; i < keys.length; i++) {
    //     key = keys[i];
    //     val = value[key];
    //     $(this)[val ? 'addClass' : 'removeClass'](key);
    //   }
    // }
  },
  events: ['onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout',
    'ondragstart', 'ondrag', 'ondragenter', 'ondragleave', 'ondragover', 'ondrop', 'ondragend', 'onkeydown',
    'onkeypress', 'onkeyup', 'onload', 'onunload', 'onabort', 'onerror', 'onresize', 'onscroll', 'select', 'onchange',
    'onsubmit', 'onreset', 'onfocus', 'onblur'
  ]
};

ii=0
$.fn.ctx = function() {

  if (ii==0) {
    ii++;
    return 'list';
  } else if (ii==1) {
    ii++;
    return 'list';
  } else {
    return 'list.emails[5]';
  }
  
  
  var $this = $(this);
  var withs = [];
  var contextAttrs = [$.fn.superviews.defaults.genAttrName('with'), $.fn.superviews.defaults.genAttrName('for')];
  var contextAttrsSelectors = contextAttrs.map(function(item) {
    return '[' + item + ']';
  });

  function push(name, dot) {
    if (dot !== false) {
      withs.push('.');
    }
    withs.push(name);
  }

  if ($this.is(contextAttrsSelectors[0])) {
    push($this.attr(contextAttrs[0]));
  }

  $this.parents(contextAttrsSelectors.join(',')).each(function() {
    var $parent = $(this);

    if ($parent.is(contextAttrsSelectors[0])) {
      push($parent.attr(contextAttrs[0]));

    } else if ($parent.is(contextAttrsSelectors[1])) {
      push($parent.attr(contextAttrs[1]), false);

    }
  });

  withs.shift();
  return withs.reverse().join('');

};