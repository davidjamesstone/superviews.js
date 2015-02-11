var _contexts = [];

function evaluate(ctx, statement) {
  return (new Function('ctx', 'with (ctx) {\n return ' + statement + '\n}'))(ctx);
}

function makeTpl(str) {
  // Find the first whitespace char
  var idx1 = str.indexOf(' ');
  var idx2 = str.indexOf('>');
  var idx = Math.min(idx1, idx2);
  var pre = str.substr(0, idx);
  var post = str.substring(idx);

  return function(withAttr, i) {
    var attrStr = ' ' + withAttr + '=' + i + ' ';
    return pre + attrStr + post;
  };
}

function superviews(el, ctx) {
  el = el || document.body;
  ctx = ctx || window;

  // Push the context onto the stack
  _contexts.push(ctx);

  // We are in the correct context now we can
  // start the inner program.
  // Start with the destructive attributes.
  var $el = $(el);
  
  // Am I a with? If so, let's change the
  // context if it's not been done already
  var withAttr = !$el.is('.contextified') && $el.attr('ui-with');
  if (withAttr) {
    $el.addClass('contextified');
    return superviews(el, evaluate(ctx, withAttr));
  }

  // Am I destructive? In that I destroy
  // my innnerHTML like a for loop or text might?
  // If so apply evaluations early to save processing
  var forAttr = $el.attr('ui-for');
  var isContextified = $el.is('.contextified');
  if (forAttr) {
    if (!isContextified) {
      $el.addClass('contextified');
    } else {
      var template = makeTpl(el.innerHTML.trim());
      var html = [];
      for (var i = 0; i < ctx.length; i++) {
        html.push(template('ui-with', i));
      }
      el.innerHTML = html.join('');
    }
  }


  // If we have got this far, we can safely query for attributes
  // 
  var $stack = $(el).findButNotInside('[ui-text]:not([ui-with],[ui-for])', '[ui-with],[ui-for]');

  // Apply the evaluations
  $stack.each(function() {
    this.innerText = evaluate(ctx, $(this).attr('ui-text'));
  });

  // Do child contexts
  $(el).findButNotInside('[ui-with]', '[ui-with],[ui-for]').each(function() {
    var childCtx = ctx[$(this).addClass('contextified').attr('ui-with')];
    return superviews(this, childCtx);
  });

  $(el).findButNotInside('[ui-for]', '[ui-with],[ui-for]').each(function() {
    var childCtx = ctx[$(this).addClass('contextified').attr('ui-for')];
    return superviews(this, childCtx);
  });
}

$.fn.findButNotInside = function(selector, selector1) {
  var origElement = $(this);
  return origElement.find(selector).filter(function() {
    var nearestMatch = $(this).parent().closest(selector1);
    return nearestMatch.length === 0 || origElement.find(nearestMatch).length === 0;
  });
};