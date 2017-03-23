'use strict'

var test = require('tape')
var proxyquire = require('proxyquire')
var concat = require('concat-stream')

test('basic', function (t) {
  t.plan(9)

  var EventsStream = proxyquire('./', {
    'aws-sdk/clients/cloudformation': Cloudformation
  })

  EventsStream({
    stackName: 'foo',
    region: 'us-east-1'
  })
  .pipe(concat(function (data) {
    t.deepEqual(data, [
      {EventId: 1, ResourceProperties: {bar: 'baz'}}
    ], 'results')
  }))
  .on('error', t.end)

  function Cloudformation (options) {
    t.ok(this instanceof Cloudformation, 'called with new')
    t.equal(options.region, 'us-east-1')

    var i = 0

    return {
      describeStacks,
      describeStackEvents
    }

    function describeStacks (params, callback) {
      switch (i) {
        case 0:
          t.deepEqual(params, {
            StackName: 'foo'
          }, 'describe stack 0')

          return callback(null, {
            Stacks: [{
              StackName: 'foo',
              StackId: 'foo-id',
              StackStatus: 'CREATE_IN_PROGRESS'
            }]
          })
        case 1:
          t.deepEqual(params, {
            StackName: 'foo-id'
          }, 'describe stack 1')

          return callback(null, {
            Stacks: [{
              StackName: 'foo',
              StackId: 'foo-id',
              StackStatus: 'CREATE_IN_PROGRESS'
            }]
          })
        case 2:
          t.deepEqual(params, {
            StackName: 'foo-id'
          }, 'describe stack 2')

          return callback(null, {
            Stacks: [{
              StackName: 'foo',
              StackId: 'foo-id',
              StackStatus: 'CREATE_COMPLETE'
            }]
          })
        default:
          t.fail('too many calls')
      }
    }

    function describeStackEvents (params, callback) {
      switch (i++) {
        case 0:
          t.deepEqual(params, {
            StackName: 'foo-id'
          }, 'describe events 0')

          return callback(null, {
            StackEvents: [{
              EventId: 0,
              ResourceProperties: JSON.stringify({
                foo: 'bar'
              })
            }]
          })
        case 1:
          t.deepEqual(params, {
            StackName: 'foo-id'
          }, 'describe events 1')

          return callback(null, {
            StackEvents: [
              {
                EventId: 1,
                ResourceProperties: JSON.stringify({
                  bar: 'baz'
                })
              },
              {
                EventId: 0,
                ResourceProperties: JSON.stringify({
                  foo: 'bar'
                })
              }
            ]
          })
        case 2:
          t.deepEqual(params, {
            StackName: 'foo-id'
          }, 'describe events 2')

          return callback(null, {
            StackEvents: [
              {
                EventId: 1,
                ResourceProperties: JSON.stringify({
                  bar: 'baz'
                })
              },
              {
                EventId: 0,
                ResourceProperties: JSON.stringify({
                  foo: 'bar'
                })
              }
            ]
          })
        default:
          t.fail('too many calls')
      }
    }
  }
})
