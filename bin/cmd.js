#!/usr/bin/env node

'use strict'

var minimist = require('minimist')

var argv = minimist(process.argv.slice(2))

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
  stdout.write(argv.name ?
    'function ' + argv.name + '(model) {\n' + s + '\n};\n' :
    'module.exports = function (model) {\n' + s + '\n};\n')
})

stdin.resume()
