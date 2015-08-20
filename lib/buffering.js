var util = require('util');
var events = require('events');
var hasOwn = Object.prototype.hasOwnProperty;
var objType = Object.prototype.toString; // ES 5+ will handle null and undefined

function Buffering(options) {
    events.EventEmitter.call(this);

    options = options || {};
    this._timeThreshold = (typeof options.timeThreshold === 'undefined') ? -1 : options.timeThreshold;
    this._sizeThreshold = (typeof options.sizeThreshold === 'undefined') ? -1 : options.sizeThreshold;
    this._useUnique = (typeof options.useUnique === 'boolean') ? options.useUnique : false;
    this._data = (this._useUnique) ? {} : [];
    this._objectLength = 0;
    this._flushQueue = [];
    this._flushQueueSize = 0;
    this._flushTimer = null;
    this._paused = false;
    this._resumeTimer = null;
    this._flushingBySize = false;
}

util.inherits(Buffering, events.EventEmitter);

Buffering.prototype._enqueueUniqueSingle = function(key, value) {
    if (!hasOwn.call(this._data, key)) ++this._objectLength;
    this._data[key] = value;
};

Buffering.prototype._enqueueUniqueMultiple = function(data) {
    for (var key in data) {
        if (hasOwn.call(data, key)) this._enqueueUniqueSingle(data[key], data[key]);
    }
};

Buffering.prototype._enqueueUniqueObject = function(data) {
    for (var key in data) {
        if (hasOwn.call(data, key)) this._enqueueUniqueSingle(key, data[key]);
    }
};

Buffering.prototype._getDataUnique = function(size) {
    var result = [];
    for (var key in this._data) {
        if (hasOwn.call(this._data, key)) {
            result.push(this._data[key]);
            delete this._data[key];
            --this._objectLength;
            if (--size <= 0) break;
        }
    }
    return result;
};

Buffering.prototype._enqueueUnique = function(data) {
    var data_type = objType.call(data);
    switch (data_type) {
        case '[object Object]':
            this._enqueueUniqueObject(data); // specified key object
            break;
        case '[object Array]':
            this._enqueueUniqueMultiple(data); // treat as multiple string
            break;
        default:
            this._enqueueUniqueSingle(data, data); // treat as single string
            break;
    }

    this._checkAndFlush();
};

Buffering.prototype._enqueue = function(data) {
    if (!(data instanceof Array)) data = [data];
    this._data.push.apply(this._data, data);
    this._checkAndFlush();
};

Buffering.prototype.enqueue = function(data) {
    return (this._useUnique) ? this._enqueueUnique(data) : this._enqueue(data);
};

Buffering.prototype.undequeue = function(data) {
    if (!(data instanceof Array)) data = [data];
    this._flushQueue.push(data);
    this._flushQueueSize += data.length;
    this._checkAndFlush();
};

Buffering.prototype.flush = function() {
    var data = [];
    var size, tmp;
    if (!this._paused) {
        var size = (this._sizeThreshold > 0) ? this._sizeThreshold : -1;

        while (this._flushQueue.length) {
            if (size > 0) {
                tmp = this._flushQueue.pop();
                this._flushQueueSize -= tmp.length;
                size -= tmp.length;
                if (size < 0) {
                    this._flushQueue.push(tmp.splice(size, Math.abs(size)));
                    this._flushQueueSize -= size; // add back
                    size = 0;
                }
                data.push.apply(data, tmp);
                if (size === 0) {
                    break;
                }
            } else {
                data.push.apply(data, this._flushQueue.pop());
            }
        }

        size = (size === -1) ? this.size() : size;

        if (size > 0) {
            tmp = (this._useUnique) ? this._getDataUnique(size) : this._data.splice(0, size);
            data.push.apply(data, tmp);
        }
        if (data.length > 0) this.emit('flush', data);
    }
    this._flushingBySize = false;
    this._clearTimer('_flushTimer');
    if (data && data.length > 0) this._checkAndFlush();
};

Buffering.prototype.pause = function(duration) {
    this._paused = true;
    this._clearTimer('_flushTimer');
    if (duration >= 0) this._resumeTimer = setTimeout(this.resume.bind(this), duration);
};

Buffering.prototype.resume = function() {
    this._paused = false;
    this._clearTimer('_resumeTimer');
    this._checkAndFlush();
};

Buffering.prototype.size = function() {
    return (this._useUnique) ? this._objectLength : this._data.length;
};

Buffering.prototype.size_total = function() {
    var s = (this._useUnique) ? this._objectLength : this._data.length;
    return this._flushQueueSize + s;
};

Buffering.prototype._checkAndFlush = function() {
    if (this._flushingBySize) return;
    if (this._paused) return;
    if (this._sizeThreshold > 0 && this.size_total() >= this._sizeThreshold) {
        this._flushingBySize = true;
        process.nextTick(this.flush.bind(this));
    } else if (this._timeThreshold >= 0 && !this._flushTimer && this.size_total() > 0) {
        this._flushTimer = setTimeout(this.flush.bind(this), this._timeThreshold);
    }
};

Buffering.prototype._clearTimer = function(name) {
    if (this[name]) {
        clearTimeout(this[name]);
        this[name] = null;
    }
};

module.exports = Buffering;
