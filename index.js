'use strict'

var assert = require('assert')
var Cloudformation = require('aws-sdk/clients/cloudformation')
var Readable = require('stream').Readable
var inherits = require('util').inherits
var poll = require('pole')

module.exports = StackEventsStream

function StackEventsStream (options) {
  if (!(this instanceof StackEventsStream)) {
    return new StackEventsStream(options)
  }

  assert(options)
  assert(options.stackName, 'stackName is required')
  assert(options.region, 'region is required')

  Readable.call(this, {
    objectMode: true
  })

  this.cfn = new Cloudformation({
    region: options.region
  })

  this.options = options
  this.last = null

  this.start()
}

inherits(StackEventsStream, Readable)

StackEventsStream.prototype._read = function noop () {}

StackEventsStream.prototype.params = function params (data) {
  return Object.assign(data || {}, {
    StackName: this.options.stackId || this.options.stackName
  })
}

StackEventsStream.prototype.status = function status (callback) {
  this.cfn.describeStacks(this.params(), function (err, data) {
    if (err) return callback(err)

    var stacks = data.Stacks
    if (stacks.length !== 1) {
      return callback(new Error('Multiple stacks matched: ' + stacks.map(stack => stack.StackName).join(', ')))
    }

    callback(null, stacks[0])
  })
}

StackEventsStream.prototype.events = function events (callback) {
  this.cfn.describeStackEvents(this.params(), function (err, data) {
    if (err) return callback(err)
    callback(null, data.StackEvents)
  })
}

StackEventsStream.prototype.start = function start () {
  var onError = this.emit.bind(this, 'error')

  this.poll((err, events) => {
    if (err) return onError(err)
    this.onEvents(events)

    var loop = poll(this.poll.bind(this))

    loop.onData(this.onEvents.bind(this))
    loop.onError(onError)
    this.on('end', loop.cancel)
  })
}

StackEventsStream.prototype.poll = function poll (callback) {
  this.status((err, stack) => {
    if (err) return callback(err)

    this.options.stackId = stack.StackId

    this.events((err, events) => {
      if (err) return callback(err)
      callback(null, events)
      if (/_COMPLETE$/.test(stack.StackStatus)) this.push(null)
    })
  })
}

StackEventsStream.prototype.onEvents = function onEvents (events) {
  var newer = []

  if (this.last != null) {
    var i = 0
    while (events[i].EventId !== this.last) {
      newer.unshift(Object.assign({}, events[i], {
        ResourceProperties: JSON.parse(events[i].ResourceProperties)
      }))
      i++
    }
  }

  this.last = events[0].EventId
  newer.forEach((event) => this.push(event))
}
