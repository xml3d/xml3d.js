(function (webgl) {

    /**
     * @param {Xflow.DATA_TYPE} xflowType
     */
    var convertXflow2ShadeType = function(xflowType) {
        var result = {}
        switch (xflowType) {
            case Xflow.DATA_TYPE.BOOL:
                result.type = Shade.TYPES.BOOLEAN;
                break;
            case Xflow.DATA_TYPE.INT:
                result.type = Shade.TYPES.INT;
                break;
            case Xflow.DATA_TYPE.FLOAT:
                result.type = Shade.TYPES.NUMBER;
                break;
            case Xflow.DATA_TYPE.FLOAT2:
                result.type = Shade.TYPES.OBJECT;
                result.kind = Shade.OBJECT_KINDS.FLOAT2;
                break;
            case Xflow.DATA_TYPE.FLOAT3:
                result.type = Shade.TYPES.OBJECT;
                result.kind = Shade.OBJECT_KINDS.FLOAT3;
                break;
            case Xflow.DATA_TYPE.FLOAT4:
                result.type = Shade.TYPES.OBJECT;
                result.kind = Shade.OBJECT_KINDS.FLOAT4;
                break;
            case Xflow.DATA_TYPE.TEXTURE:
                result.type = Shade.TYPES.OBJECT;
                result.kind = Shade.OBJECT_KINDS.TEXTURE;
                break;
            case Xflow.DATA_TYPE.UNKNOWN:
            default:
                throw new Error("Unknown Xflow DataType: " + xflowType);
        }
        result.source = Shade.SOURCES.UNIFORM;
        return result;
    }

    /**
     * @param context
     * @param sourceTemplate
     * @param dataCallback
     * @constructor
     */
    var JSShaderClosure = function(context, sourceTemplate, dataCallback) {
        webgl.AbstractShaderClosure.call(this, context);
        this.sourceTemplate = sourceTemplate;
        this.getShaderParameters = dataCallback || function(){ {} };
    };

    XML3D.createClass(JSShaderClosure, webgl.AbstractShaderClosure, {
        /**
         *
         * @param {Scene} scene
         * @param {Xflow.ComputeResult} shaderResult
         * @param objectData
         */
        createSources: function(scene, shaderResult, objectData) {

            var contextData = {"global.shade" :[{"extra": {"type": "object","kind": "any","global" : true,"info" : {}}}]};

            if (shaderResult) {
                var entries = shaderResult.getOutputMap();

                for (var name in entries) {
                    var entry = entries[name];
                    if (entry) {
                        contextData["global.shade"][0].extra.info[name] = convertXflow2ShadeType(entry.type);
                    }
                }
            }

            var aast = Shade.parseAndInferenceExpression(this.sourceTemplate, { inject: contextData, loc: true });
            this.source = {
                fragment: Shade.compileFragmentShader(aast),
                vertex:  [
                    "attribute vec3 position;",
                    "attribute vec3 color;",

                    "varying vec3 fragVertexColor;",

                    "uniform mat4 modelViewProjectionMatrix;",

                    "void main(void) {",
                    "   fragVertexColor = color;",
                    "   gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
                    "}"
                ].join("\n")
            }
            console.log(this.source.fragment);
        },
        undoUniformVariableOverride: function(override) {
            var previousValues = {};
            var shaderData = this.getShaderParameters();
            for (var name in override) {
                if (shaderData.hasOwnProperty(name)) {
                    var value = shaderData[name];
                    previousValues[name] = value.getValue ? value.getValue() : value;
                }
            }
            this.program.setUniformVariables(previousValues);
        },

        /**
         * @param {Xflow.ComputeResult} result
         * @param {Object?} options
         */
        updateUniformsFromComputeResult: function (result, options) {
            var dataMap = result.getOutputMap();
            var uniforms = this.program.uniforms;

            var opt = options || {};
            var force = opt.force || false;


            for (var name in dataMap) {

                var entry = dataMap[name];

                var uniformName = "_env_" + name;
                var uniform = uniforms[uniformName];
                if (!uniform)
                    continue;

                var webglData = this.context.getXflowEntryWebGlData(entry);
                if (force || webglData.changed) {
                    if (uniform.glType === this.context.gl.BOOL) {
                        //TODO Can we get Xflow to return boolean arrays as normal JS arrays? WebGL doesn't accept Uint8Arrays here...
                        //TODO Alternatively we could set boolean uniforms using uniform1fv together with Float32Arrays, which apparently works too
                        webgl.setUniform(this.context.gl, uniform, this.convertToJSArray(entry.getValue()));
                    } else {
                        webgl.setUniform(this.context.gl, uniform, entry.getValue());
                    }
                    webglData.changed = 0;
                }
            }
            // TODO: this.isTransparent = this.descriptor.hasTransparency(dataMap);
        },

        /* Default values are compiled into shade.js */
        setDefaultUniforms: function() {}

    });
    webgl.JSShaderClosure = JSShaderClosure;

}(XML3D.webgl));
