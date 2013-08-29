(function (webgl) {

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
        createSources: function(scene, shaderData, objectData) {
            var aast = Shade.parseAndInferenceExpression(this.sourceTemplate, { inject: {}, loc: true });
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

        this.setShaderInfo(shaderInfo);
        this.extractedParams = Shade.extractParameters(this.sourceTemplate);
        console.log(this.extractedParams);
    };

    XML3D.createClass(JSShaderComposer, XML3D.util.EventDispatcher, {
        setShaderInfo: function(shaderInfo) {

        },
        getRequestFields: function() {
            return this.extractedParams;
        },
        getShaderClosure: function(scene, objectData, opt)  {
            var shaderData = null;//this.request.getResult();
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

        }

    });


    webgl.JSShaderComposer = JSShaderComposer;

}(XML3D.webgl));
