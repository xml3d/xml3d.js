(function (webgl) {
    /**
     * @param {XML3D.webgl.GLContext} context
     * @constructor
     */
    var ShaderComposerFactory = function (context) {
        this.context = context;
        /** @type {Object.<number, IShaderComposer>} */
        this.composers = {};
        this.needsCompileCheck = true;
        this.defaultComposer = new webgl.DefaultComposer(context);
    };

    ShaderComposerFactory.EVENT_TYPE = {
        MATERIAL_STRUCTURE_CHANGED: "material_structure_changed"
    };

    XML3D.extend(ShaderComposerFactory.prototype, {
        /**
         *
         * @param {XML3D.webgl.ShaderInfo} shaderInfo
         * @returns {IShaderComposer}
         */
        createComposerForShaderInfo: function (shaderInfo) {
            console.log(shaderInfo);
            if (!shaderInfo) {
                return this.defaultComposer;
            }
            var result = this.composers[shaderInfo.id];
            if (!result) {
                result = new webgl.URNShaderComposer(this.context, shaderInfo);
                this.composers[shaderInfo.id] = result;
                this.context.getStatistics().materials++;
            }
            return result;
        },
        getDefaultComposer: function () {
            return this.defaultComposer;
        },
        getTemplateById: function (id) {
            return this.composers[id];
        },
        update: function (scene) {
            for (var i in this.composers) {
                this.composers[i].update(scene, { evaluateShader: this.needsCompileCheck, updateLightValues: this.lightValuesDirty });
            }
            this.needsCompileCheck = this.lightValuesDirty = false;
        },
        setLightStructureDirty: function() {
            XML3D.debug.logWarning("Light structure changes not yet supported.");
            this.needsCompileCheck = true;
        },
        setLightValueChanged: function() {
            this.lightValuesDirty = true;
        }

    });

    webgl.ShaderComposerFactory = ShaderComposerFactory;


}(XML3D.webgl));
