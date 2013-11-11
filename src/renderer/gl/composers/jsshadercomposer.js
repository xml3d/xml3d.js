(function (webgl) {

    /**
     *
     * @param {GLContext} context
     * @param shaderInfo
     * @param {HTMLScriptElement} node
     * @extends AbstractShaderComposer
     * @constructor
     */
    var JSShaderComposer = function(context, shaderInfo, node) {
        webgl.AbstractShaderComposer.call(this, context, shaderInfo);

        if (!window.Shade)
            throw new Error("Shade.js not found");

        this.context = context;

        this.shaderURL = null;
        /** @type string*/
        this.sourceTemplate = null;

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

        this.setShaderInfo(shaderInfo);
    };

    JSShaderComposer.convertEnvName = function(name){
        return ("_env_" + name).replace(/_+/g, "_");
    }

    JSShaderComposer.convertSysName = function(name){
        return name;
    }

    XML3D.createClass(JSShaderComposer, webgl.AbstractShaderComposer, {
        setShaderInfo: function(shaderInfo) {
            this.sourceTemplate = shaderInfo.getScriptCode();
            try{
                this.extractedParams = Shade.extractParameters(this.sourceTemplate,
                    {implementation: "xml3d-glsl-forward"}).shaderParameters;
                // FIXME: Shader.js should always request position (in case
            }
            catch(e){
                // We ignore errors here. They will reoccur when updating connected mesh closures
                this.extractedParams = [];
            }
            if(this.extractedParams.indexOf("position") == -1) this.extractedParams.push("position");

            // The composer is interested in changes of all possible shader parameters (extracted)
            // the instances (closures) will only set those, that occur in the instance
            if (this.extractedParams.length) {
                this.updateRequest(shaderInfo.getData());
            }
        },
        getRequestFields: function() {
            return this.extractedParams;
        },
        getShaderAttributes: function() {
            return { color: null, normal: null, texcoord: null };
        },
        createShaderClosure: function () {
            return new webgl.JSShaderClosure(this.context, this.sourceTemplate, this.extractedParams);
        },
        createObjectDataRequest: function(objectDataNode, callback){

            var vsConfig = new Xflow.VSConfig();
            var names = this.extractedParams.slice();
            //if(names.indexOf("position") == -1) names.push("position");

            for(var i = 0; i < names.length; ++i){
                var name = names[i];
                var xflowInfo = objectDataNode.getOutputChannelInfo(name);
                if(xflowInfo){
                    vsConfig.addAttribute(xflowInfo.type, name, true);
                }
            }
            var request = new Xflow.VertexShaderRequest(objectDataNode, vsConfig, callback);
            return request;
        },

        distributeObjectShaderData: function(objectRequest, attributeCallback, uniformCallback){
            var vertexShader = objectRequest.getVertexShader();
            var inputNames = vertexShader.inputNames;
            for(var i = 0; i < inputNames.length; ++i){
                var name = inputNames[i], entry = vertexShader.getInputData(name);
                if(vertexShader.isInputUniform(name))
                    uniformCallback(name, entry);
                else
                    attributeCallback(name, entry);
            }
            var outputNames = vertexShader.outputNames;
            for(var i = 0; i < outputNames.length; ++i){
                var name = outputNames[i];
                if(vertexShader.isOutputFragmentUniform(name)){
                    uniformCallback(vertexShader.getOutputSourceName(name), vertexShader.getUniformOutputData(name));
                }
            }
        }

    });


    webgl.JSShaderComposer = JSShaderComposer;

}(XML3D.webgl));
