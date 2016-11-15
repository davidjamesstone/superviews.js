/* global patch, IncrementalDOM */
var superviews = require('../..')
var ace = require('brace')
require('brace/mode/javascript')
// require('brace/mode/json')
require('brace/mode/html')
require('brace/theme/monokai')

var templateEl = document.getElementById('template')
var dataEl = document.getElementById('data')
var compiledEl = document.getElementById('compiled')
var runButton = document.getElementById('run')
var patchButton = document.getElementById('patch')
var resultEl = document.getElementById('result')

var templateEditor = ace.edit(templateEl)
templateEditor.getSession().setMode('ace/mode/html')
templateEditor.setTheme('ace/theme/monokai')

var dataEditor = ace.edit(dataEl)
dataEditor.getSession().setMode('ace/mode/javascript')
dataEditor.setTheme('ace/theme/monokai')
dataEditor.session.setUseWorker(false)

var compiledEditor = ace.edit(compiledEl)
compiledEditor.getSession().setMode('ace/mode/javascript')
compiledEditor.setTheme('ace/theme/monokai')
compiledEditor.setReadOnly(true)
compiledEditor.session.setUseWorker(false)

window.patch = IncrementalDOM.patch
window.elementOpen = IncrementalDOM.elementOpen
window.elementClose = IncrementalDOM.elementClose
window.text = IncrementalDOM.text
window.skip = IncrementalDOM.skip
window.currentElement = IncrementalDOM.currentElement

var data
var template = '<div class="{data.cssClass}">\n' +
'  \n' +
'  <h2>Attributes</h2>\n' +
'  <input type="text" disabled="{data.isDisabled}">\n' +
'  <a href="http://www.google.co.uk?q={data.query}" target="_blank">Search for {data.query}</a>\n' +
'  \n' +
'  <h2>Text interpolation</h2>\n' +
'  My name is {data.name} my age is {data.age}\n' +
'  I live at {data.address}\n' +
'  \n' +
'  <h2>Conditionals</h2>\n' +
'\n' +
'  <if condition="data.showMe">\n' +
'    I\'m in an `if` block.\n' +
'  </if>\n' +
'    \n' +
'  <if condition="data.foo === 1">\n' +
'    <span>1</span>\n' +
'  <elseif condition="data.foo === 2">\n' +
'    <span>2</span>\n' +
'  <else>\n' +
'    The value of `foo` is neither 1 or 2, it\'s {data.foo}!\n' +
'  </if>\n' +
'  \n' +
'  <h2>Iteration</h2>\n' +
'  <ul>\n' +
'    <li each="key in data.obj">\n' +
'      key: {key}, value: {data.obj[key]}\n' +
'      [generated key: {$key}]\n' +
'    </li>\n' +
'  </ul>\n' +
'  \n' +
'  <ul>\n' +
'    <li each="item in data.arr">\n' +
'      {item}<br>\n' +
'      {$item} {$value} {$target} \n' +
'      [generated key: {$key}]\n' +
'    </li>\n' +
'  </ul>\n' +
'  \n' +
'  <ul>\n' +
'    <!-- Use $item as the key when using maps -->\n' +
'    <li each="item, $item.id in data.map">\n' +
'      {item}\n' +
'      [generated key: {$key}]\n' +
'    </li>\n' +
'  </ul>\n' +
'  \n' +
'  <h2>Events</h2>\n' +
'  <button onclick="{data.handleClick()}">Say hi</button>\n' +
'    \n' +
'</div>\n'

templateEditor.setValue(template)

function run () {
  template = templateEditor.getValue()
  var output = superviews(template)
  compiledEditor.setValue(output)

  try {
    template = eval(output)
  } catch (e) {
    window.alert('Failed to compile - ' + e)
  }

  // patchData()
  patchButton.style.display = ''
}

function patchData () {
  try {
    data = new Function(dataEditor.getValue())()
    patch(resultEl, template, data)
  } catch (e) {
    window.alert('Failed to patch - ' + e)
  }
}

runButton.onclick = run
patchButton.onclick = patchData
