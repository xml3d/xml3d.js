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
        this.updateScript();
    };

    XML3D.createClass(ShaderRenderAdapter, XML3D.webgl.RenderAdapter);
    XML3D.extend(ShaderRenderAdapter.prototype, {
        createShaderInfo: function () {
            return this.getScene().createShaderInfo({
                data: this.getDataAdapter().getXflowNode()
            });
        },
        updateScript: function(){
            var uri = this.getShaderScriptURI();
            if(uri.scheme != "urn"){
                var adapterHandle = this.getAdapterHandle(uri, XML3D.data, 0);
                this.connectAdapterHandle('script', adapterHandle);
            }
            else{
                this.disconnectAdapterHandle('script');
            }
            this.updateShaderInfoDetails();
        },
        updateShaderInfoDetails: function(){
            var scriptType = null, scriptCode = null;
            var adapter = this.getConnectedAdapter('script');
            if(adapter && adapter.getScriptType){
                scriptType = adapter.getScriptType();
                scriptCode = adapter.getScriptCode();
            }
            this.shaderInfo.setScript(this.getShaderScriptURI(), scriptType, scriptCode);
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
                case XML3D.events.VALUE_MODIFIED:
                    var target = evt.internalType || evt.attrName || evt.wrapped.attrName;
                    switch (target) {
                        case "script":
                            this.updateScript();
                            break;
                        default:
                            XML3D.debug.logWarning("Unhandled mutation event in shader adapter for parameter '" + target + "'");
                            break;

                    }
                break;
                case XML3D.events.ADAPTER_HANDLE_CHANGED:
                    if(evt.handleStatus == XML3D.base.AdapterHandle.STATUS.NOT_FOUND){
                        XML3D.debug.logError("Could not find script of url '" + evt.url + "'");
                    }
                    this.updateShaderInfoDetails();
                break;
            }


        }
    });

    // Export to XML3D.webgl namespace
    webgl.ShaderRenderAdapter = ShaderRenderAdapter;

}(XML3D.webgl));
