
// Plugin definition.
$.fn.superviews = function(options) {

  // Extend our default options with those provided.
  // Note that the first argument to extend is an empty
  // object – this is to keep from overriding our "defaults" object.
  var opts = $.extend({}, $.fn.superviews.defaults, options);

  // Our plugin implementation code goes here.
  var $el = $(this);
  var keys = Object.keys(opts.attributes);

  keys.forEach(function(key) {
    var attrName = opts.genAttrName(key);
    var selector = '[' + attrName + ']';
    var $found = $(selector, $el);

    $found.each(function(index, item) {
      var $this = $(this);

      if ($(this).closest(document.documentElement).length === 0) {
        // selection has been removed
        return;
      }

      if (key === 'for') {
        // only take upper most 'for' elements.
        // i.e. '[for]' is ok, '[for] [for]' is not
        if ($this.parentsUntil($el, selector).length > 0) {
          return;
        }
      }

      var expr = $this.attr(attrName);
      var ctx = $this.ctx();

      var statement = '(function() {\n  with (' + ctx + ') {\n return ' + expr + '\n}})();';
      var value = eval(statement);

      opts.attributes[key].call(item, value);

    });
  });

  function contextify(name) {
    $('[' + name + ']').each(function() {
      var $this = $(this);
      var ctx = $this.ctx();
      var fn = new Function('e', 'with (' + ctx + ') {\n' + $this.attr(name) + '\nconsole.log("' + name + '");\n}');
      this[name] = fn;
    });
  }

  // Contextify dom 'on' events
  opts.events.forEach(contextify);
  
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
        template = $this.html();
        $this.data(templateKey, template);
      }

      var withAttr = $.fn.superviews.defaults.genAttrName('with');

      $this.html('');
      for (var i = 0; i < value.length; i++) {
        $this.append($(template).attr(withAttr, '[' + i + ']'));
      }

      // make a copy of the current items
      $this.data(dataKey, value.slice());

      $this.superviews();
    },
    value: function(value) {
      this.value = value;
    },
    text: function(value) {
      this.innerText = value;
    },
    hide: function(value) {
      this.style.display = value ? 'none' : '';
    },
    title: function(value) {
      this.title = value;
    },
    max: function(value) {
      this.max = value;
    },
    'class': function(value) {
      var keys = Object.keys(value),
        key, val;

      for (var i = 0; i < keys.length; i++) {
        key = keys[i];
        val = value[key];
        $(this)[val ? 'addClass' : 'removeClass'](key);
      }
    }
  },
  events: ['onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout',
    'ondragstart', 'ondrag', 'ondragenter', 'ondragleave', 'ondragover', 'ondrop', 'ondragend', 'onkeydown',
    'onkeypress', 'onkeyup', 'onload', 'onunload', 'onabort', 'onerror', 'onresize', 'onscroll', 'select', 'onchange',
    'onsubmit', 'onreset', 'onfocus', 'onblur'
  ]
};

$.fn.ctx = function() {
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