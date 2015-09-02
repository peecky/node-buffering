var assert = require('assert');

var Buffering = require('../lib/buffering');

var buffering = new Buffering({});
var uniqueBuffering = new Buffering({ useUnique: true });

assert.ok(uniqueBuffering instanceof Buffering.UniqueBuffering);
assert.ok(!(buffering instanceof Buffering.UniqueBuffering));
