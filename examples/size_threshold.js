
var Buffering = require('../');

var buffering = new Buffering({ sizeThreshold: 2 });
buffering.on('flush', function(data) { console.log(data); });

buffering.enqueue(['one']);
buffering.enqueue(['two', 'three']);
buffering.enqueue(['four']);
buffering.enqueue(['five']);
