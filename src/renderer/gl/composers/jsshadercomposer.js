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

        this.updateRequests(shaderInfo);
    };

    XML3D.createClass(JSShaderComposer, webgl.AbstractShaderComposer, {
        updateRequests: function(shaderInfo) {
            this.extractedParams = Shade.extractParameters(this.sourceTemplate);
            var that = this;
            // The composer is interested in changes of all possible shader parameters (extracted)
            // the instances (closures) will only set those, that occur in the instance
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
        getShaderAttributes: function() {
            return { color: null, normal: null, texcoord: null };
        },
        createShaderClosure: function () {
            return new webgl.JSShaderClosure(this.context, this.sourceTemplate);
        }

    });


    webgl.JSShaderComposer = JSShaderComposer;

}(XML3D.webgl));
