var htmlparser = require('htmlparser2')
var indentString = require('indent-string')

var buffer = []
var indent = 0
var endBraces = {}

function flush () {
  buffer.length = 0
  indent = 0
  endBraces = {}
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
    str += key ? ', ' + strify(key) + ' + index' : ', null'
    // str += spvp && spvp.length ? ', ' + JSON.stringify(spvp) : ', null'

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
        if (key === 'style') {
          staticPropertyValuePairs.push(key)
          staticPropertyValuePairs.push('__EVAL' + attrib.replace('{=', '{'))
        } else {
          staticPropertyValuePairs.push(key)
          staticPropertyValuePairs.push('__EVAL' + attrib.substring(2, attrib.length - 1))
        }
      } else {
        if (key === 'style') {
          propertyValuePairs.push(key)
          propertyValuePairs.push(attrib.replace('{=', '{'))
        } else {
          propertyValuePairs.push(key)
          propertyValuePairs.push(attrib.substring(1, attrib.length - 1))
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
    var attrs = getAttrs(attribs)
    var specialProps = attrs.specialPropertyMap
    var key

    if (specialProps['if']) {
      endBraces[name + '_' + indent] = '}'
      write('if (' + specialProps['if'] + ') {')
      ++indent
    }
    if (specialProps['each']) {
      key = specialProps['each']
      var eachAttr = specialProps['each']
      var eachParts = eachAttr.split(' in ')
      endBraces[name + '_' + indent] = '}, ' + eachParts[1] + ')'
      write(';(Array.isArray(' + eachParts[1] + ') ? ' + eachParts[1] + ' : Object.keys(' + eachParts[1] + ')' + ').forEach(function(' + eachParts[0] + ', index) {')
      ++indent
    }

    writeln('elementOpen', name, key, attrs.staticPropertyValuePairs, attrs.propertyValuePairs)

    ++indent
  },
  ontext: function (text) {
    if (!text || !text.trim()) {
      return
    }
    // write('text(' + (isText ? text : strify(text)) + ')')
    text = text.replace(/\{/g, '" + ')
    text = text.replace(/\}/g, ' + "')
    text = text.replace(/\n/g, ' \\\n')
    // text = text.replace(/^" \+ /, '')
    // text = text.replace(/ \+ "$/, '')

    write('text(' + strify(text) + ')')
  },
  onclosetag: function (name) {
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

module.exports = function (tmplstr) {
  flush()

  var parser = new htmlparser.Parser(handler, {
    decodeEntities: true
  })

  parser.write(tmplstr)
  parser.end()

  var result = buffer.join('\n')

  flush()

  return result
}
