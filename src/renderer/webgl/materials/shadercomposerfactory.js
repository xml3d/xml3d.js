var JSShaderComposer = require("./js/jsshadercomposer.js");
var URNShaderComposer = require("./urn/urnshadercomposer.js");
var DefaultComposer = require("./abstractshadercomposer.js").DefaultComposer;

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
     * @param {MaterialConfiguration} materialConfiguration
     * @returns {IShaderComposer}
     */
    createComposerFromMaterialConfiguration: function (materialConfiguration) {
        if (!materialConfiguration) {
            return this.defaultComposer;
        }
        var result = this.composers[materialConfiguration.id];
        if (!result) {
            try {
                var modelType = materialConfiguration.model.type;
                switch (modelType) {
                    case "urn":
                        result = new URNShaderComposer(this.context, materialConfiguration);
                        break;
                    case "text/javascript":
                    case "application/javascript":
                    case "text/shade-javascript":
                        result = new JSShaderComposer(this.context, materialConfiguration);
                        break;
                    default:
                        XML3D.debug.logError("Can not create shader of type:", modelType, materialConfiguration.model)
                }

            } catch (e) {
                XML3D.debug.logError("No shader could be created for '" + materialConfiguration.name + "':", e.message);
                result = this.defaultComposer;
            }
            if (result) {
                this.composers[materialConfiguration.id] = result;
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


