(function (webgl) {

    /**
     * @param {string} path
     * @returns {*}
     */
    var getShaderDescriptor = function (path) {
        var shaderName = path.substring(path.lastIndexOf(':') + 1);
        return XML3D.shaders.getScript(shaderName);
    };

    var ShaderDescriptor = function() {
        this.uniforms = {};
        this.samplers = {};
        this.attributes = {};
        this.name = "";
        this.fragment = "";
        this.vertex =  "";
    };
    ShaderDescriptor.prototype.addDirectives = function() {};
    ShaderDescriptor.prototype.hasTransparency = function() { return false; };

    webgl.ShaderDescriptor = ShaderDescriptor;

    /**
     * @implements {IShaderComposer}
     * @extends AbstractShaderComposer
     * @constructor
     */
    var URNShaderComposer = function (context, shaderInfo) {
        webgl.AbstractShaderComposer.call(this, context, shaderInfo);
        this.descriptor = null;
        this.setShaderInfo(shaderInfo);
    };

    XML3D.createClass(URNShaderComposer, webgl.AbstractShaderComposer, {
        /**
         *
         * @param {XML3D.webgl.ShaderInfo} shaderInfo
         */
        setShaderInfo: function (shaderInfo) {
            var shaderScriptURI = shaderInfo.getScript();
            this.setShaderScript(shaderScriptURI);

            var that = this;
            if (this.descriptor) {
                this.updateRequest(shaderInfo.getData());
                //TODO Build this into the XML3D.webgl.getScript function? It's needed everywhere anyway...
                this.descriptor.fragment = XML3D.webgl.addFragmentShaderHeader(this.descriptor.fragment);
            }
        },

        setShaderScript: function (uri) {

            if (!uri) {
                XML3D.debug.logError("Shader has no script attached: ", this.adapter.node);
                return;
            }
            if (uri.scheme != "urn") {
                XML3D.debug.logError("Shader script reference should start with an URN: ", this.adapter.node);
                return;
            }
            var descriptor = getShaderDescriptor(uri.path);
            if (!descriptor) {
                XML3D.debug.logError("No Shader registered for urn:", uri);
                return;
            }

            this.descriptor = new ShaderDescriptor();
            XML3D.extend(this.descriptor, descriptor);
        },

        getRequestFields: function () {
            return Object.keys(this.descriptor.uniforms).concat(Object.keys(this.descriptor.samplers));
        },

        /**
         * Get the attributes required by the shader
         * @returns {Object<string, *>}
         */
        getShaderAttributes: function () {
            return this.descriptor.attributes;
        },

        createShaderClosure: function() {
            return new webgl.ShaderClosure(this.context, this.descriptor);
        },

        createObjectDataRequest: function(objectDataNode, callback){
            var requestNames = ["position"];
            requestNames.push.apply(requestNames, Object.keys(this.descriptor.attributes));
            requestNames.push.apply(requestNames, Object.keys(this.descriptor.uniforms));
            requestNames.push.apply(requestNames, Object.keys(this.descriptor.samplers));
            return new Xflow.ComputeRequest(objectDataNode, requestNames, callback);
        },

        distributeObjectShaderData: function(objectRequest, attributeCallback, uniformCallback){
            var result = objectRequest.getResult();

            var dataMap = result.getOutputMap();
            for(var name in dataMap){

                if(name == "position" || this.descriptor.attributes[name] !== undefined)
                    attributeCallback(name, dataMap[name]);
                else if(this.descriptor.uniforms[name] !== undefined || this.descriptor.samplers[name] !== undefined){
                    uniformCallback(name, dataMap[name]);
                }
            }
        }

    });

    webgl.URNShaderComposer = URNShaderComposer;

}(XML3D.webgl));
