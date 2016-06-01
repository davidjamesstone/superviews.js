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
})
stdin.on('end', function () {
  stdout.write(superviews(buffer, argv.name, argv.argstr, argv.mode))
})

stdin.resume()
