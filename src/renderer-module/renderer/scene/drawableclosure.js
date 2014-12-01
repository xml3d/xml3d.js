var DrawableClosure = function (context, type) {
    this.context = context;
    this._type = type;
    this._valid = false;
};

DrawableClosure.TYPES = {
    MESH: "mesh", VOLUME: "volume"
};

DrawableClosure.READY_STATE = {
    COMPLETE: "complete", INCOMPLETE: "incomplete"
};

XML3D.createClass(DrawableClosure, XML3D.util.EventDispatcher, {
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

