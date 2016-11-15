'use strict'

var uuid = require('uuid')
var htmlparser = require('htmlparser2')
var indentString = require('indent-string')

var buffer = []
var hoist = []
var indent = 0
var hoisted = 0
var endBraces = {}
var literal = false
var meta = null

var specialTags = {
  each: 'each',
  if: 'if',
  elseif: 'elseif',
  else: 'else',
  skip: 'skip'
}

function flush () {
  buffer.length = 0
  hoist.length = 0
  indent = 0
  hoisted = 0
  endBraces = {}
  literal = false
  meta = null
}

function isInIterator () {
  return !!Object.keys(endBraces).find(function (item) {
    return item.match('_each_')
  })
}

function strify (str) {
  return '"' + (str || '') + '"'
}

function write (line) {
  var str = indentString(line, indent * 2)
  buffer.push(str)
  return line
}

function writeln (command, tag, key, spvp, pvp) {
  var str = command
  var isIterator = isInIterator()

  str += '(' + strify(tag)

  if (command === 'elementOpen') {
    if (key) {
      str += ', ' + key
    } else if (spvp && spvp.length) {
      str += ', ' + (isIterator
        ? strify(uuid.v4() + '_') + ' + $key'
        : strify(uuid.v4()))
    } else {
      str += ', null'
    }

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

    if (key in specialTags) {
      specials[key] = attrib
    } else if (attrib.charAt(0) === token) {
      if (key === 'style') {
        properties.push(key)
        properties.push(attrib)
      } else {
        if (key.substr(0, 2) === 'on') {
          properties.push(key)
          properties.push(attrib.replace(token, 'function ($event) {\n  var $element = this;\n'))
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
    if (name === 'script' && !attribs['type']) {
      literal = true
      return
    }
    if (name === 'if') {
      write('if (' + (attribs['condition'] || 'true') + ') {')
      ++indent
      return
    }
    if (name === 'elseif') {
      --indent
      write('} else if (' + (attribs['condition'] || 'true') + ') {')
      ++indent
      return
    }
    if (name === 'else') {
      --indent
      write('} else {')
      ++indent
      return
    }

    var key
    if (attribs['key']) {
      key = strify(attribs['key'])
      delete attribs['key']
    }

    var attrs = getAttrs(name, attribs)
    var specials = attrs.specials

    if (specials.if) {
      endBraces[name + '_if_' + indent] = '}'
      write('if (' + specials.if + ') {')
      ++indent
    }

    if (specials.each) {
      var eachProp = specials.each
      var idxComma = eachProp.indexOf(',')
      var idxIn = eachProp.indexOf(' in')

      if (~idxComma && idxComma < idxIn) {
        key = strify(uuid.v4() + '_') + ' + ' + eachProp.substring(idxComma + 2, idxIn)
        eachProp = eachProp.substring(0, idxComma) + eachProp.substr(idxIn)
      } else {
        key = strify(uuid.v4() + '_') + ' + $item'
      }

      var eachAttr = eachProp
      var eachParts = eachAttr.split(' in ')
      var target = eachParts[1]
      write('__target = ' + target)
      write('if (__target) {')
      ++indent
      endBraces[name + '_each_' + indent] = '}, this)'
      write(';(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {')
      ++indent
      write('var ' + eachParts[0] + ' = $value')
      write('var $key = ' + key)
      key = '$key'
    }

    writeln('elementOpen', name, key, attrs.statics, attrs.properties)
    ++indent

    if ('skip' in specials) {
      write('if (' + (specials.skip || 'true') + ') {\n  skip()\n} else {')
      endBraces[name + '_skip_' + indent] = '}'
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
    if ((indent === 1 && meta && name === 'template')) {
      return
    }

    if (name === specialTags.elseif || name === specialTags.else) {
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

    // Check end `skip` braces
    endBraceKey = name + '_skip_' + (indent - 1)
    if (endBraces[endBraceKey]) {
      end = endBraces[endBraceKey]
      delete endBraces[endBraceKey]
      --indent
      write(end)
    }

    --indent
    writeln('elementClose', name)

    // Check end `each` braces
    var endBraceKey, end

    endBraceKey = name + '_each_' + (indent - 1)
    if (endBraces[endBraceKey]) {
      end = endBraces[endBraceKey]
      delete endBraces[endBraceKey]
      --indent
      write(end)
      --indent
      write('}')
    }

    // Check end `if` braces
    endBraceKey = name + '_if_' + (indent - 1)
    if (endBraces[endBraceKey]) {
      end = endBraces[endBraceKey]
      delete endBraces[endBraceKey]
      --indent
      write(end)
    }
  }
}

module.exports = function (tmplstr, name, argstr, mode) {
  flush()

  var parser = new htmlparser.Parser(handler, {
    decodeEntities: false,
    lowerCaseAttributeNames: false,
    lowerCaseTags: false
  })

  parser.write(tmplstr)
  parser.end()

  var result = buffer.join('\n')

  name = (meta && meta.name) || (name || 'description')
  argstr = (meta && meta.argstr) || (argstr || 'data')

  var args = argstr.split(' ').filter(function (item) {
    return item.trim()
  }).join(', ')

  hoist.push(('var __target'))
  var hoisted = hoist.join('\n')
  var fn = 'function ' + name + ' (' + args + ') {\n' + result + '\n}'

  switch (mode) {
    case 'browser':
      result = hoisted + '\n\n' + 'return ' + fn
      result = 'window.' + name + ' = (function () {' + '\n' + result + '\n' + '})()' + '\n'
      break
    case 'es6':
      result = 'import {patch, elementOpen, elementClose, text, skip, currentElement} from "incremental-dom"\n\n'
      result += hoisted + '\n\n' + 'export ' + fn + '\n'
      break
    case 'cjs':
      result = 'var IncrementalDOM = require(\'incremental-dom\')\n' +
        'var patch = IncrementalDOM.patch\n' +
        'var elementOpen = IncrementalDOM.elementOpen\n' +
        'var elementClose = IncrementalDOM.elementClose\n' +
        'var skip = IncrementalDOM.skip\n' +
        'var currentElement = IncrementalDOM.currentElement\n' +
        'var text = IncrementalDOM.text\n\n'
      result += hoisted + '\n\n'
      result += 'module.exports = ' + fn + '\n'
      break
    case 'amd':
      result = 'define([\'exports\', \'incremental-dom\'], function (exports, IncrementalDOM) {\n' +
        'var patch = IncrementalDOM.patch\n' +
        'var elementOpen = IncrementalDOM.elementOpen\n' +
        'var elementClose = IncrementalDOM.elementClose\n' +
        'var skip = IncrementalDOM.skip\n' +
        'var currentElement = IncrementalDOM.currentElement\n' +
        'var text = IncrementalDOM.text\n\n'
      result += hoisted + '\n\n'
      result += 'exports.' + name + ' = ' + '(function () {' + '\n  return ' + fn + '\n' + '})()' + '\n'
      result += '})\n'
      break
    default:
      result = hoisted + '\n\n' + 'return ' + fn
      result = (mode ? 'var ' + mode + ' = ' : ';') + '(function () {' + '\n' + result + '\n' + '})()' + '\n'
  }

  flush()

  return result
}
