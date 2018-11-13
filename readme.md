# cfn-events-stream [![Build Status](https://travis-ci.org/bendrucker/cfn-events-stream.svg?branch=master)](https://travis-ci.org/bendrucker/cfn-events-stream) [![Greenkeeper badge](https://badges.greenkeeper.io/bendrucker/cfn-events-stream.svg)](https://greenkeeper.io/)

> Readable stream of CloudFormation stack events


## Install

```
$ npm install --save cfn-events-stream
```


## Usage

### API

```js
var CfnEventsStream = require('cfn-events-stream')

CfnEventsStream({
  stackName: 'my-stack',
  region: 'us-east-1'
})
.pipe(ndjson.serialize())
.pipe(process.stdout)

#=> {"EventId": "abc"...}
```

The API returns a `Readable` stream in object mode that emits each new event received after the initial check. The JSON ResourceProperties field will be parsed into a proper object. When the stack enters a `*_COMPLETE` state the stream will end.

### CLI

```sh
cfn-stack-events \
  --stack-name my-stack \
  --region us-east-1
```

The CLI emits [ndjson](http://ndjson.org/) where each line is a new stack event until stack enters a complete state.


## License

MIT © [Ben Drucker](http://bendrucker.me)
