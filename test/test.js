var widgetEl
var widg = function () {
  return widget.call(model, model)
}

function description (data) {
  elementOpen('div', null, null, 'title', data.cls)
  text(data.cls)
  elementOpen('input', null, ['type', 'text'], 'value', data.val, 'onchange', data.onChange, 'style', { color: data.foo, backgroundColor: data.bar })
  elementClose('input')
  if (data.showName) {
    elementOpen('p')
    elementOpen('span')
    text(data.name)
    elementClose('span')
    elementOpen('span', null, null, 'class', data.bar + ' other-css')
    text('description')
    elementClose('span')
    elementOpen('span')
    text('description1')
    elementClose('span')
    elementOpen('input', null, ['type', 'text'], 'disabled', data.isDisabled)
    elementClose('input')
    elementClose('p')
  }

  if (!widgetEl) {
    widgetEl = elementOpen('div', null, ['some-thing', 'data.cls'], null)
    elementClose('div')
  }
  patch(widgetEl, widg)

  elementOpen('ul')
  ;(Array.isArray(data.items) ? data.items : Object.keys(data.items)).forEach(function (item, index) {
    elementOpen('li', 'item in data.items' + index)
    elementOpen('span')
    text(index)
    elementClose('span')
    elementOpen('span')
    text(item.name)
    elementClose('span')
    elementOpen('input', null, null, 'value', item.name)
    elementClose('input')
    elementClose('li')
  }, data.items)
  elementClose('ul')
  elementOpen('ul')
  ;(Array.isArray(data.obj) ? data.obj : Object.keys(data.obj)).forEach(function (key, index) {
    elementOpen('li', 'key in data.obj' + index)
    elementOpen('span')
    text(key)
    elementClose('span')
    elementOpen('span')
    text(index)
    elementClose('span')
    elementOpen('span')
    text(data.obj[key])
    elementClose('span')
    elementClose('li')
  }, data.obj)
  elementClose('ul')
  elementOpen('ul')
  ;(Array.isArray(data.obj) ? data.obj : Object.keys(data.obj)).forEach(function (key, index) {
    elementOpen('li', 'key in data.obj' + index)
    elementOpen('span')
    text(key)
    elementClose('span')
    elementOpen('span')
    text(index)
    elementClose('span')
    elementOpen('span')
    text(this[key])
    elementClose('span')
    elementClose('li')
  }, data.obj)
  elementClose('ul')
  elementClose('div')
}
