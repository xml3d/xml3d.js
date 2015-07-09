var EventEmitter = require('events').EventEmitter;

var DrawableClosure = function (context, type) {
    EventEmitter.call(this);
    this.context = context;
    this._type = type;
    this._valid = false;
    // Do not limit the number of listeners
    this.setMaxListeners(0);
};

DrawableClosure.TYPES = {
    MESH: "mesh", VOLUME: "volume"
};

DrawableClosure.READY_STATE = {
    COMPLETE: "complete", INCOMPLETE: "incomplete"
};

XML3D.createClass(DrawableClosure, EventEmitter, {
    getType: function () {
        return this._type;
    }, isValid: function () {
        return this._valid;
    }, setShaderComposer: function (shaderComposer) {
        // implemented by subclass
    }, update: function (scene) {
        // implemented by subclass
    }
});

module.exports = DrawableClosure;

