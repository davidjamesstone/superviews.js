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

function snakeToCamel (s) {
  return s.replace(/(\-\w)/g, function (m) {
    return m[1].toUpperCase()
  })
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
      return item.substr(0, 6) === '__EVAL' ? item.substr(6) : strify(item)
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
  var specialPropertyMap = {}
  var staticPropertyValuePairs = []
  var propertyValuePairs = []
  var attrib

  for (var key in attribs) {
    attrib = attribs[key]

    if (key === 'each' || key === 'if') {
      specialPropertyMap[key] = attrib
    } else if (attrib.charAt(0) === '{') {
      if (attrib.charAt(1) === '=') {
        if (key.substr(0, 2) === 'on') {
          // event handler
          staticPropertyValuePairs.push(key)
          staticPropertyValuePairs.push('__EVAL' + attrib.replace('{=', 'function (e) {'))
        } else {
          if (key === 'style') {
            staticPropertyValuePairs.push(key)
            staticPropertyValuePairs.push('__EVAL' + attrib.replace('{=', '{'))
          } else {
            staticPropertyValuePairs.push(key)
            staticPropertyValuePairs.push('__EVAL' + attrib.substring(2, attrib.length - 1))
          }
        }
      } else {
        if (key === 'style') {
          propertyValuePairs.push(key)
          propertyValuePairs.push(attrib.replace('{=', '{'))
        } else {
          if (key.substr(0, 2) === 'on') {
            propertyValuePairs.push(key)
            propertyValuePairs.push(attrib.replace('{', 'function (e) {'))
          } else {
            propertyValuePairs.push(key)
            propertyValuePairs.push(attrib.substring(1, attrib.length - 1))
          }
        }
      }
    } else {
      staticPropertyValuePairs.push(key)
      staticPropertyValuePairs.push(attrib)
    }
  }
  return {
    specialPropertyMap: specialPropertyMap,
    staticPropertyValuePairs: staticPropertyValuePairs,
    propertyValuePairs: propertyValuePairs
  }
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
    if (name === 'script' && !attribs['src']) {
      literal = true
      return
    }
    if (name === 'if') {
      write('if (' + (attribs['condition'] || 'true') + ') {')
      ++indent
      return
    }

    var attrs = getAttrs(attribs)
    var specialProps = attrs.specialPropertyMap

    if (specialProps['if']) {
      endBraces[name + '_' + indent] = '}'
      write('if (' + specialProps['if'] + ') {')
      ++indent
    }
    if (specialProps['each']) {
      var eachProp = specialProps['each']
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

    writeln('elementOpen', name, key, attrs.staticPropertyValuePairs, attrs.propertyValuePairs)

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
      // text = text.replace(/^" \+ /, '')
      // text = text.replace(/ \+ "$/, '')

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
