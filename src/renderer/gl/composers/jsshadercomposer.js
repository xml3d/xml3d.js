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
        webgl.AbstractShaderComposer.call(this, context);

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

        this.setShaderInfo(shaderInfo);
    };


    function getVSShaderAttribTransform(inputName){
        if(inputName == "position")
            return Xflow.VS_ATTRIB_TRANSFORM.VIEW_POINT;
        else if(inputNAme == "normal")
            return Xflow.VS_ATTRIB_TRANSFORM.VIEW_NORMAL;
        else
            return Xflow.VS_ATTRIB_TRANSFORM.NONE;

    }

    XML3D.createClass(JSShaderComposer, webgl.AbstractShaderComposer, {
        setShaderInfo: function(shaderInfo) {
            this.extractedParams = Shade.extractParameters(this.sourceTemplate);
            var that = this;
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
            return new webgl.JSShaderClosure(this.context, this.sourceTemplate);
        },

        getUniformName: function(name){
            return ("_env_" + name).replace(/_+/g, "_");
        },

        createObjectDataRequest: function(objectDataNode, callback){

            var vsConfig = new Xflow.VSConfig();
            for(var i = 0; i < this.extractedParams.length; ++i){
                var name = this.extractedParams[i];
                var xflowInfo = objectDataNode.getOutputChannelInfo();
                if(xflowInfo){
                    vsConfig.addAttribute(xflowInfo.type, name, this.getUniformName(name),
                        true, getVSShaderAttribTransform(name));
                }
            }
            var request = new Xflow.VertexShaderRequest(objectDataNode, vsConfig);
            return request;
        },

        distributeObjectShaderData: function(objectRequest, attributeCallback, uniformCallback){
            var result = objectRequest.getResult();
            var inputNames = result.shaderInputNames;
            for(var i = 0; i < inputNames.length; ++i){
                var name = inputNames[i], entry = result.getShaderInputData(name);
                if(result.isShaderInputUniform(name))
                    uniformCallback(name, entry);
                else
                    attributeCallback(name, entry);
            }
            var outputNames = result.shaderOutputNames;
            for(var i = 0; i < outputNames.length; ++i){
                var name = outputNames[i];
                if(result.isShaderOutputUniform(name)){
                    uniformCallback(this.getUniformName(name), result.getUniformOutputData(name));
                }
            }
        }

    });


    webgl.JSShaderComposer = JSShaderComposer;

}(XML3D.webgl));
