XML3D.webgl.MAX_MESH_INDEX_COUNT = 65535;

//Adapter for <mesh>
(function (webgl) {

    /**
     * @constructor
     */
    var MultiMeshRenderAdapter = function (factory, node) {
        webgl.TransformableAdapter.call(this, factory, node);
        this.dataList = null;
        this.renderObjects = [];
        this.initializeEventAttributes();
        this.createRenderNode();
    };

    XML3D.createClass(MultiMeshRenderAdapter, webgl.TransformableAdapter, {

        createRenderNode: function () {
            var dataAdapter = XML3D.base.resourceManager.getAdapter(this.node, XML3D.data);
            this.dataList = dataAdapter.getDataList();

            this.dataList.addChangeListener(this);

            var parent = this.getParentRenderAdapter();
            var parentNode = parent.getRenderNode && parent.getRenderNode();

            this.renderNode = this.getScene().createRenderGroup({
                parent: parentNode,
                shaderHandle: null,
                visible: this.node.visible,
                name: this.node.id
            });

            this.createSubRenderObjects();
        },
        clearSubRenderObjects: function(){
            var i = this.renderObjects.length;
            while(i--){
                this.renderObjects[i].remove();
                this.disconnectAdapterHandle("shader_" + i);
            }
            this.renderObjects.length = 0;

        },
        createSubRenderObjects: function(){
            this.clearSubRenderObjects();
            if(!this.dataList.isSubtreeLoading()){
                var dataListResult = this.dataList.getResult();
                var meshSets = dataListResult.getMeshDataSets();
                for(var i = 0; i < meshSets.length; ++i){
                    var renderNode = this.getScene().createRenderObject({
                        parent: this.renderNode,
                        node: this.node,
                        object: {
                            data: meshSets[i].xflowNode,
                            type: meshSets[i].type
                        },
                        shaderHandle: this.getShaderHandle(meshSets[i].shader, i),
                        name: this.node.id,
                        visible: !this.node.visible ? false : undefined
                    });
                    this.renderObjects.push(renderNode);
                }
            }
        },
        getShaderHandle: function(shaderHref, index)
        {
            if(shaderHref) {
                this.connectAdapterHandle("shader_" + index, this.getAdapterHandle(shaderHref));
                return this.getConnectedAdapterHandle("shader_" + index);
            }
            return null;
        },

        /**
         * @param evt
         */
        notifyChanged: function (evt) {
            switch(evt.type) {
                case XML3D.events.ADAPTER_HANDLE_CHANGED:
                    var shaderKey = "shader_";
                    if (evt.key.indexOf(shaderKey) == 0 ) {
                        var idx = evt.key.substr(shaderKey.length)*1;
                        if (evt.handleStatus == XML3D.base.AdapterHandle.STATUS.NOT_FOUND) {
                            XML3D.debug.logWarning("Missing shader with id '" + evt.url + "', falling back to default shader.");
                        }
                        this.renderObjects[idx].setLocalShaderHandle(evt.adapter);
                    }
                    return;
                case  XML3D.events.NODE_INSERTED:
                    return;
                case XML3D.events.THIS_REMOVED:
                    this.dispose();
                    return;
                case XML3D.events.VALUE_MODIFIED:
                    this.valueChanged(evt.wrapped);
            }
        },
        /**
         * @param {MutationEvent} evt
         */
        valueChanged: function(evt) {
            var target = evt.attrName;

            switch (target) {
                case "visible":
                    this.renderNode.setLocalVisible(evt.newValue === "true");
                    break;

                case "src":
                    // Handled by data component
                    break;

                default:
                    XML3D.debug.logWarning("Unhandled mutation event in mesh adapter for parameter '" + target + "'", evt);
                    break;
            }

        },
        onDataListChange: function(){
            this.createSubRenderObjects();
        },
        dispose: function () {
            this.dataList.removeChangeListener(this);
            this.clearSubRenderObjects();
            this.getRenderNode().remove();
            this.clearAdapterHandles();
        }
    });



    // Interface methods

    XML3D.extend(MultiMeshRenderAdapter.prototype, {
        /**
         * @return {window.XML3DBox}
         */
        getBoundingBox: function () {
            if (this.renderNode) {
            var bbox = new XML3D.math.bbox.create();
            this.renderNode.getObjectSpaceBoundingBox(bbox);
            return XML3D.math.bbox.asXML3DBox(bbox);
            }

            return new window.XML3DBox();
        },

        /**
         * @return {window.XML3DMatrix}
         */
        getWorldMatrix: function () {
            var m = new window.XML3DMatrix(),
                obj = this.renderNode;
            if (obj) {
                obj.getWorldMatrix(m._data);
            }
            return m;
        }
    });

    // Export to XML3D.webgl namespace
    webgl.MultiMeshRenderAdapter = MultiMeshRenderAdapter;

}(XML3D.webgl));
