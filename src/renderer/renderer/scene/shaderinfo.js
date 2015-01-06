var uniqueObjectId = require("../../webgl/base/utils.js").getUniqueCounter();


/**
 * @param {Scene} scene
 * @param {Object} opt
 * @constructor
 */
var ShaderInfo = function (scene, opt) {
    opt = opt || {};
    this.id = uniqueObjectId();
    this.scene = scene;
    this.data = opt.data;
    /** @type XML3D.URI */
    this.scriptUri = null;
    this.scriptType = null;
    this.scriptCode = null;
    this.scene.shaderInfos.push(this);
    this.changeListener = [];
};

XML3D.extend(ShaderInfo.prototype, {
    /**
     * @param {XML3D.URI} script
     */
    setScript: function (scriptUri, scriptType, scriptCode) {
        this.scriptUri = scriptUri;
        this.scriptType = scriptType;
        this.scriptCode = scriptCode;
        this.scriptChangedEvent();
    }, /**
     * @returns {XML3D.URI}
     */
    getScriptUri: function () {
        return this.scriptUri;
    }, getScriptType: function () {
        return this.scriptType;
    }, getScriptCode: function () {
        return this.scriptCode;
    }, getData: function () {
        return this.data;
    }, addChangeListener: function (listener) {
        this.changeListener.push(listener);
    },

    scriptChangedEvent: function () {
        for (var i = 0; i < this.changeListener.length; ++i) {
            this.changeListener[i](this);
        }
    }
});

module.exports = ShaderInfo;

