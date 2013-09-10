(function (webgl) {

    /** @type ResourceManager */
    var resourceManager = XML3D.base.resourceManager;

    var ComposerConstructors = {
        "text/shade-javascript": webgl.JSShaderComposer
    }

    /**
     * @param {XML3D.webgl.GLContext} context
     * @constructor
     */
    var ShaderComposerFactory = function (context) {
        this.context = context;
        /** @type {Object.<number, IShaderComposer>} */
        this.composers = {};
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
            if (!shaderInfo) {
                return this.defaultComposer;
            }
            var result = this.composers[shaderInfo.id];
            if (!result) {
                /** @type XML3D.URI */
                var scriptURI = shaderInfo.script;
                if(scriptURI.scheme == "urn") {
                    result = new webgl.URNShaderComposer(this.context, shaderInfo);
                } else {
                    // TODO: This should be done via resourceManager, but script node is not yet
                    // configured
                    if (scriptURI.isLocal()) {
                        var node = XML3D.URIResolver.resolveLocal(scriptURI);
                        if (!node) {
                            XML3D.debug.logError("Could not resolve script for shader: " + scriptURI.toString());
                            return this.defaultComposer;
                        }

                        try {
                            var Constructor = ComposerConstructors[node.type];
                            result = new Constructor(this.context, shaderInfo, node);
                        } catch(e) {
                            XML3D.debug.logError("No shader found for : " + node.type);
                            return this.defaultComposer;
                        }
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
        getDefaultComposer: function () {
            return this.defaultComposer;
        },
        getTemplateById: function (id) {
            return this.composers[id];
        },
        update: function (scene) {
            for (var i in this.composers) {
                this.composers[i].update(scene, { updateLightValues: this.lightValuesDirty });
            }
            this.lightValuesDirty = false;
        },
        setLightStructureDirty: function() {
            XML3D.debug.logWarning("Light structure changes not yet supported.");
            for (var i in this.composers) {
                this.composers[i].setShaderRecompile();
            }
        },
        setLightValueChanged: function() {
            for (var i in this.composers) {
                this.composers[i].updateLightValues = true;
            }
        }

    });

    webgl.ShaderComposerFactory = ShaderComposerFactory;


}(XML3D.webgl));
