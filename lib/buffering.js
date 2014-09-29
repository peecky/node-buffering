var util = require('util');
var events = require('events');

function Buffering(options) {
    if (this.constructor.super_) this.constructor.super_.call(this);

    options = options || {};
    this._timeThreshold = (typeof options.timeThreshold === 'undefined') ? -1 : options.timeThreshold;
    this._sizeThreshold = (typeof options.sizeThreshold === 'undefined') ? -1 : options.sizeThreshold;
    this._data = [];
    this._flushTimer = null;
    this._paused = false;
    this._resumeTimer = null;
    this._flushingBySize = false;
}

util.inherits(Buffering, events.EventEmitter);

Buffering.prototype.enqueue = function(data) {
    if (!(data instanceof Array)) data = [data];
    this._data.push.apply(this._data, data);
    this._checkAndFlush();
};

Buffering.prototype.undequeue = function(data) {
    if (!(data instanceof Array)) data = [data];
    this._data.unshift.apply(this._data, data);
    this._checkAndFlush();
};

Buffering.prototype.flush = function() {
    var data;
    if (!this._paused) {
        var size = (this._sizeThreshold > 0) ? this._sizeThreshold : this._data.length;
        data = this._data.splice(0, size);
        this.emit('flush', data);
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
    return this._data.length;
};

Buffering.prototype._checkAndFlush = function() {
    if (this._flushingBySize) return;
    if (this._paused) return;
    if (this._sizeThreshold > 0 && this._data.length >= this._sizeThreshold) {
        this._flushingBySize = true;
        process.nextTick(this.flush.bind(this));
    }
    else if (this._timeThreshold >= 0 && !this._flushTimer && this._data.length > 0) {
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
