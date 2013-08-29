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

            var entries = shaderResult.getOutputMap();

            for(var name in entries) {
                var entry = entries[name];
                if(entry) {
                    contextData["global.shade"][0].extra.info[name] = convertXflow2ShadeType(entry.type);
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
        }

    });

    /**
     *
     * @param {GLContext} context
     * @param shaderInfo
     * @param {HTMLScriptElement} node
     * @implements IShaderComposer
     * @constructor
     */
    var JSShaderComposer = function(context, shaderInfo, node) {
        if (!window.Shade)
            throw new Error("Shade.js not found");

        this.context = context;

        /** @type string*/
        this.sourceTemplate = node.innerText;

        /**
         * @private
         * @type {Array.<string>}
         */
        this.extractedParams = [];

        /**
         * @private
         * @type {Xflow.ComputeRequest|null}
         */
        this.request = null;

        this.updateRequests(shaderInfo);
    };

    XML3D.createClass(JSShaderComposer, XML3D.util.EventDispatcher, {
        updateRequests: function(shaderInfo) {
            this.extractedParams = Shade.extractParameters(this.sourceTemplate);
            var that = this;
            if (this.extractedParams.length) {
                this.request = new Xflow.ComputeRequest(shaderInfo.getData(), this.extractedParams, function (request, changeType) {
                    that.dataChanged = true;
                    that.context.requestRedraw("Shader data changed");
                });
                this.structureChanged = true;
            }

        },
        getRequestFields: function() {
            return this.extractedParams;
        },
        getShaderClosure: function(scene, objectData, opt)  {
            var shaderData = this.request ? this.request.getResult() : null;
            var shader = new JSShaderClosure(this.context, this.sourceTemplate);
            shader.createSources(scene, shaderData, objectData);
            /*for (var i=0; i < this.shaderClosures.length; i++) {
                if (this.shaderClosures[i].equals(shader))
                    return this.shaderClosures[i];
            } */
            this.initializeShaderClosure(shader, scene, objectData);
            return shader;
        },
        getShaderAttributes: function() {
            return { color: null, normal: null, texcoord: null };
        },
        update: function(scene, opt) {
            opt = opt || {};
            var that = this;
        },

        /**
         *
         * @param shaderClosure
         * @param scene
         * @param objectData
         * @private
         */
        initializeShaderClosure: function(shaderClosure, scene, objectData) {
            shaderClosure.compile();
            var result = this.request.getResult();
            this.updateClosureFromComputeResult(shaderClosure, result, {force : true});

        }

    });


    webgl.JSShaderComposer = JSShaderComposer;

}(XML3D.webgl));
