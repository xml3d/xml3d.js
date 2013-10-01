// Adapter for <shader>
(function (webgl) {

    /**
     * @param factory
     * @param {Element} node
     * @extends RenderAdapter
     * @constructor
     */
    var ShaderRenderAdapter = function (factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.dataAdapter = XML3D.base.resourceManager.getAdapter(this.node, XML3D.data);
        /** @type webgl.ShaderInfo **/
        this.shaderInfo = this.createShaderInfo();
        this.templateId = this.shaderInfo.id;
    };

    XML3D.createClass(ShaderRenderAdapter, XML3D.webgl.RenderAdapter);
    XML3D.extend(ShaderRenderAdapter.prototype, {
        createShaderInfo: function () {
            return this.getScene().createShaderInfo({
                script: this.getShaderScriptURI(),
                data: this.getDataAdapter().getXflowNode()
            });
        },
        getShaderInfo: function () {
            return this.shaderInfo;
        },
        getShaderScriptURI: function () {
            return new XML3D.URI(this.node.getAttribute("script"));
        },
        getDataAdapter: function () {
            return this.dataAdapter;
        },
        notifyChanged: function (evt) {
            switch (evt.type) {
                case XML3D.events.NODE_INSERTED:
                case XML3D.events.NODE_REMOVED:
                    return;    // Not handled here
                case XML3D.events.THIS_REMOVED:
                    this.dispose();
                    return;
            }

            var target = evt.internalType || evt.attrName || evt.wrapped.attrName;

            switch (target) {
                case "script":
                    this.getShaderInfo().setScript(this.getShaderScriptURI());
                    break;
                case "id":
                    this.notifyOppositeAdapters();
                    break;
                default:
                    XML3D.debug.logWarning("Unhandled mutation event in shader adapter for parameter '" + target + "'");
                    break;

            }
        },
        dispose: function () {

        }
    });

    // Export to XML3D.webgl namespace
    webgl.ShaderRenderAdapter = ShaderRenderAdapter;

}(XML3D.webgl));
