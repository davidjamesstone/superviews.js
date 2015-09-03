#!/usr/bin/env node

'use strict'

var minimist = require('minimist')

var argv = minimist(process.argv.slice(2), {
  default: {
    name: 'description'
  }
})

var stdin = process.stdin
var stdout = process.stdout

stdin.setEncoding('utf8')
var superviews = require('../')
var buffer = ''

stdin.on('data', function (text) {
  buffer += text
  // console.log(buffer)
})
stdin.on('end', function () {
  var s = superviews(buffer)
  stdout.write('function ' + argv.name + '(data) {\n' + s + '\n};\n')
})

stdin.resume()
