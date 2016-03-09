'use strict'

var htmlparser = require('htmlparser2')
var indentString = require('indent-string')

var buffer = []
var hoist = []
var indent = 0
var hoisted = 0
var endBraces = {}
var literal = false
var meta = null

function flush () {
  buffer.length = 0
  hoist.length = 0
  indent = 0
  hoisted = 0
  endBraces = {}
  literal = false
  meta = null
}

function strify (str) {
  return '"' + (str || '') + '"'
}

function write (line) {
  var str = indentString(line, ' ', indent * 2)
  buffer.push(str)
  return line
}

function writeln (command, tag, key, spvp, pvp) {
  var str = command
  str += '(' + strify(tag)

  if (command === 'elementOpen' || command === 'elementPlaceholder') {
    str += key ? ', ' + key : ', null'

    if (spvp && spvp.length) {
      var statics = '[' + spvp.map(function (item, index) {
        return strify(item)
      }).join(', ') + ']'

      ++hoisted
      hoist.push(('var hoisted' + hoisted) + ' = ' + statics)
      str += ', hoisted' + hoisted
    } else {
      str += ', null'
    }

    str += pvp && pvp.length ? ', ' + pvp.map(function (item, index) {
      return index % 2 ? item : strify(item)
    }).join(', ') : ', null'
  }

  str += ')'

  str = str.replace(', null, null, null)', ')')
  str = str.replace(', null, null)', ')')
  str = str.replace(', null)', ')')

  return write(str)
}

function interpolate (text) {
  text = text.replace(/\{/g, '" + (')
  text = text.replace(/\}/g, ') + "')
  text = text.replace(/\n/g, ' \\\n')
  return strify(text)
}

function getAttrs (name, attribs) {
  var specials = {}
  var statics = []
  var properties = []
  var token = '{'
  var attrib

  for (var key in attribs) {
    attrib = attribs[key]

    if (key === 'each' || key === 'if') {
      specials[key] = attrib
    } else if (attrib.charAt(0) === token) {
      if (key === 'style') {
        properties.push(key)
        properties.push(attrib)
      } else {
        if (key.substr(0, 2) === 'on') {
          properties.push(key)
          properties.push(attrib.replace(token, 'function ($event) {\n  $event.preventDefault();\n  var $element = this;\n'))
        } else {
          properties.push(key)
          properties.push(attrib.substring(1, attrib.length - 1))
        }
      }
    } else if (attrib.indexOf(token) > 0) {
      properties.push(key)
      properties.push(interpolate(attrib))
    } else {
      statics.push(key)
      statics.push(attrib)
    }
  }
  return {
    specials: specials,
    statics: statics,
    properties: properties
  }
}

var handler = {
  onopentag: function (name, attribs) {
    if (!indent && (name === 'template') && 'args' in attribs) {
      meta = {
        name: attribs['name'],
        argstr: attribs['args']
      }
      indent++
      return
    }
    if (name === 'script' && !Object.keys(attribs).length) {
      literal = true
      return
    }
    if (name === 'if') {
      write('if (' + (attribs['condition'] || 'true') + ') {')
      ++indent
      return
    }

    var key
    if (attribs['key']) {
      key = strify(attribs['key'])
      delete attribs['key']
    }

    var placeholder = (name === 'placeholder')
    if (attribs['tag']) {
      name = attribs['tag']
      delete attribs['tag']
    }

    var attrs = getAttrs(name, attribs)
    var specials = attrs.specials

    if (specials.if) {
      endBraces[name + '_' + indent] = '}'
      write('if (' + specials.if + ') {')
      ++indent
    }

    if (specials.each) {
      var eachProp = specials.each
      var idxComma = eachProp.indexOf(',')
      var idxIn = eachProp.indexOf(' in')

      if (~idxComma) {
        key = eachProp.substring(idxComma + 2, idxIn)
        eachProp = eachProp.substring(0, idxComma) + eachProp.substr(idxIn)
      } else {
        key = '$index'
      }

      var eachAttr = eachProp
      var eachParts = eachAttr.split(' in ')
      endBraces[name + '_' + indent] = '}, ' + eachParts[1] + ')'
      write(';(Array.isArray(' + eachParts[1] + ') ? ' + eachParts[1] + ' : Object.keys(' + eachParts[1] + ')' + ').forEach(function(' + eachParts[0] + ', $index) {')
      ++indent
    }

    writeln(placeholder ? 'elementPlaceholder' : 'elementOpen', name, key, attrs.statics, attrs.properties)

    if (!placeholder) {
      ++indent
    }
  },
  ontext: function (text) {
    if (!text || !text.trim()) {
      return
    }

    if (literal) {
      write(text.trim())
    } else {
      write('text(' + interpolate(text) + ')')
    }
  },
  onclosetag: function (name) {
    if ((indent === 1 && meta && name === 'template') || name === 'placeholder') {
      return
    }
    if (name === 'script' && literal) {
      literal = false
      return
    }

    if (name === 'if') {
      --indent
      write('}')
      return
    }

    --indent
    writeln('elementClose', name)

    var endBraceKey = name + '_' + (indent - 1)

    if (endBraces[endBraceKey]) {
      var end = endBraces[endBraceKey]
      delete endBraces[endBraceKey]
      --indent
      write(end)
    }
  }
}

module.exports = function (tmplstr, name, argstr) {
  flush()

  var parser = new htmlparser.Parser(handler, {
    decodeEntities: false
  })

  parser.write(tmplstr)
  parser.end()

  var result = buffer.join('\n')

  name = (meta && meta.name) || (name || 'description')
  argstr = (meta && meta.argstr) || (argstr || 'data')

  var args = argstr.split(' ').filter(function (item) {
    return item.trim()
  }).join(', ')

  result = hoist.join('\n') + '\n\n' + 'return function ' + name + ' (' + args + ') {\n' + result + '\n}'
  result = ';(function () {' + '\n' + result + '\n' + '})()'

  flush()

  return result
}
