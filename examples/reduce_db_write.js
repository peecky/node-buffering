var Buffering = require('../');
var mysql;
try {
    mysql = require('mysql');
}
catch (e) {
    console.error('If you want to run this example, the mysql module should be installed');
    console.error('You can install by running `npm install mysql`.');
    throw e;
}

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'me',
    password: 'secret'
});

var buffering = new Buffering({ sizeThreshold: 100, timeThreshold: 5000 });
buffering.on('flush', function(data) {
    var query = mysql.format('INSERT INTO read_post (user_id, post_id) VALUES ?', [data]);
    console.log(query);
    connection.connect(function(err) {
        if (err) return console.error(err.stack || err);
        mysql.query(query, function(err, result) {
            connection.close();
            if (err) {
                if (err.code === 'DEADLOCK') {
                    // retry on 5 seconds later
                    buffering.pause(5000);
                    buffering.undequeue(data);
                }
                else console.error(err.stack || err);
            }
        });
    });
});

// on a user read a post
function onUserReadPost(user_id, post_id) {
    buffering.enqueue([[user_id, post_id]]);
}

// events of users read posts
setTimeout(function() { onUserReadPost('shana', 141); }, 1000);
setTimeout(function() { onUserReadPost('nagi', 138); }, 1500);
setTimeout(function() { onUserReadPost('louise', 153); }, 2000);
setTimeout(function() { onUserReadPost('taiga', 145); }, 2500);
