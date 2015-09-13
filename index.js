'use strict'

var htmlparser = require('htmlparser2')
var indentString = require('indent-string')

var buffer = []
var indent = 0
var endBraces = {}
var literal = false
var meta = null

function flush () {
  buffer.length = 0
  indent = 0
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
  if (command === 'elementOpen') {
    str += key ? ', ' + key : ', null'

    str += spvp && spvp.length ? ', [' + spvp.map(function (item, index) {
      return strify(item)
    }).join(', ') + ']' : ', null'

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

function getAttrs (attribs) {
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

function snakeToCamel (s) {
  return s.replace(/(\-\w)/g, function (m) {
    return m[1].toUpperCase()
  })
}

var handler = {
  onopentag: function (name, attribs) {
    if (!indent && attribs['args']) {
      meta = {
        name: attribs['name'] || snakeToCamel(name),
        argstr: attribs['args'],
        tagName: name
      }
      indent++
      return
    }
    if (name === 'script' && !attribs.length) {
      literal = true
      return
    }
    if (name === 'if') {
      write('if (' + (attribs['condition'] || 'true') + ') {')
      ++indent
      return
    }

    var attrs = getAttrs(attribs)
    var specials = attrs.specials

    if (specials['if']) {
      endBraces[name + '_' + indent] = '}'
      write('if (' + specials['if'] + ') {')
      ++indent
    }
    if (specials['each']) {
      var eachProp = specials['each']
      var idxComma = eachProp.indexOf(',')
      var idxIn = eachProp.indexOf(' in')
      var key
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

    writeln('elementOpen', name, key, attrs.statics, attrs.properties)

    ++indent
  },
  ontext: function (text) {
    if (!text || !text.trim()) {
      return
    }

    if (literal) {
      write(text.trim())
    } else {
      text = text.replace(/\{/g, '" + (')
      text = text.replace(/\}/g, ') + "')
      text = text.replace(/\n/g, ' \\\n')
      write('text(' + strify(text) + ')')
    }
  },
  onclosetag: function (name) {
    if (indent === 1 && meta && meta.tagName === name) {
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
    decodeEntities: true
  })

  parser.write(tmplstr)
  parser.end()

  var result = buffer.join('\n')

  name = (meta && meta.name) || (name || 'description')
  argstr = (meta && meta.argstr) || (argstr || 'data')

  var args = argstr.split(' ').filter(function (item) {
    return item.trim()
  }).join(', ')

  result = 'function ' + name + ' (' + args + ') {\n' + result + '\n}'

  flush()

  return result
}
