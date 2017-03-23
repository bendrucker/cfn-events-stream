#!/usr/bin/env node

'use strict'

var meow = require('meow')
var ndjson = require('ndjson')
var StackEvents = require('./')

var cli = meow(`
  Usage
    $ cfn-stack-events --stack-name <stack>

  Options
    --stack-name (required)
    --region (default: us-east-1)
`)

var defaults = {
  region: 'us-east-1'
}

StackEvents(Object.assign(defaults, cli.flags))
  .pipe(ndjson.serialize())
  .pipe(process.stdout)
