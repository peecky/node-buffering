
var Buffering = require('../');
	
var buffering = new Buffering();
buffering.on('flush', function(data) { console.log(data); });

buffering.enqueue(['one']);
buffering.enqueue(['two', 'three']);
buffering.flush(); // [ 'one', 'two', 'three' ]
buffering.enqueue(['four']);
buffering.enqueue(['five']);
buffering.flush(); // [ 'four', 'five' ]
