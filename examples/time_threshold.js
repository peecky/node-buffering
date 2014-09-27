var Buffering = require('../');

var buffering = new Buffering({ timeThreshold: 1000 }); // 1 second
buffering.on('flush', function(data) {
    console.log(new Date());
    console.log(data);
});

setTimeout(function() { buffering.enqueue(['one']); }, 200);
setTimeout(function() { buffering.enqueue(['two', 'three']); }, 300);
setTimeout(function() { buffering.enqueue(['four']); }, 1700);
setTimeout(function() { buffering.enqueue(['five']); }, 1800);
