var JSShaderComposer = require("./js/jsshadercomposer");
var URNShaderComposer = require("./urn/urnshadercomposer");
var DefaultComposer = require("./abstractshadercomposer").DefaultComposer;

var ComposerConstructors = {
    "text/shade-javascript": JSShaderComposer
};

/**
 * @param {GLContext} context
 * @constructor
 */
var ShaderComposerFactory = function (context) {
    this.context = context;
    /** @type {Object.<number, IShaderComposer>} */
    this.composers = {};
    this.defaultComposer = new DefaultComposer(context);
    this.lightValuesDirty = true;
};


XML3D.extend(ShaderComposerFactory.prototype, {
    /**
     *
     * @param {ShaderInfo} shaderInfo
     * @returns {IShaderComposer}
     */
    createComposerForShaderInfo: function (shaderInfo) {
        if (!shaderInfo) {
            return this.defaultComposer;
        }
        var result = this.composers[shaderInfo.id];
        if (!result) {
            /** @type XML3D.URI */
            var scriptURI = shaderInfo.getScriptUri();
            if (scriptURI.scheme == "urn") {
                result = new URNShaderComposer(this.context, shaderInfo);
            } else {
                // TODO: This should be done via resourceManager, but script node is not yet
                // configure
                if (!shaderInfo.getScriptType())
                    return this.defaultComposer;
                try {
                    var Constructor = ComposerConstructors[shaderInfo.getScriptType()];
                    result = new Constructor(this.context, shaderInfo);
                } catch (e) {
                    XML3D.debug.logError("No shader could be created for " + scriptURI + ":", e.message);
                    return this.defaultComposer;
                }
            }
            if (result) {
                this.composers[shaderInfo.id] = result;
                this.context.getStatistics().materials++;
            }
            return result || this.defaultComposer;
        }
        return result;
    },

    getTemplateById: function (id) {
        return this.composers[id];
    },

    update: function (scene) {
        for (var i in this.composers) {
            this.composers[i].update(scene, {updateLightValues: this.lightValuesDirty});
        }
        this.lightValuesDirty = false;
    },

    setLightStructureDirty: function () {
        this.setShaderRecompile();
    },

    setShaderRecompile: function () {
        for (var i in this.composers) {
            this.composers[i].setShaderRecompile();
        }
    },

    updateSystemUniforms: function (names, scene) {
        for (var i in this.composers) {
            this.composers[i].updateSystemUniforms(names, scene);
        }
    },

    setLightValueChanged: function () {
        for (var i in this.composers) {
            this.composers[i].updateLightValues = true;
        }
    }

});

module.exports = ShaderComposerFactory;


