XML3D.webgl.MAX_MESH_INDEX_COUNT = 65535;

//Adapter for <mesh>
(function (webgl) {

    /**
     * @constructor
     */
    var MultiMeshRenderAdapter = function (factory, node) {
        webgl.TransformableAdapter.call(this, factory, node, true);
        this.dataList = null;
        this.renderObjects = [];
        this.initializeEventAttributes();
        this.createRenderNode();
    };

    var c_IDENTITY = XML3D.math.mat4.create();

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
            this.updateLocalMatrix();
            this.createSubRenderObjects();
        },
        clearSubRenderObjects: function(){
            var i = this.renderObjects.length;
            while(i--){
                this.renderObjects[i].remove();
                //this.disconnectAdapterHandle("shader_" + i);
            }
            this.renderObjects.length = 0;

        },
        createSubRenderObjects: function(){
            this.clearSubRenderObjects();
            if(!this.dataList.isSubtreeLoading()){
                try{
                    this.dataList.checkValidity();
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
                            shaderHandle: this.getSubShaderHandle(meshSets[i].shader, i),
                            name: this.node.id,
                            visible: !this.node.visible ? false : undefined
                        });
                        renderNode.setLocalMatrix(meshSets[i].transform || c_IDENTITY);
                        this.renderObjects.push(renderNode);
                    }
                }
                catch(e){
                    XML3D.debug.logError("DataList Error: " + e.message, e.node || this.node);
                    this.clearSubRenderObjects();
                }
            }
        },
        getSubShaderHandle: function(shaderHref, index)
        {
            if(shaderHref) {
                var adapterHandle = this.getAdapterHandle(shaderHref);
                if(adapterHandle && adapterHandle.status == XML3D.base.AdapterHandle.STATUS.NOT_FOUND){
                    XML3D.debug.logError("Could not find <shader> of url '" + adapterHandle.url + "' ", this.node);
                }
                //this.connectAdapterHandle("shader_" + index, adapterHandle);
                return adapterHandle;
            }
            return null;
        },

        /**
         * @param evt
         */
        notifyChanged: function (evt) {
            XML3D.webgl.TransformableAdapter.prototype.notifyChanged.call(this, evt);
            switch(evt.type) {
                case  XML3D.events.NODE_INSERTED:
                    return;
                case XML3D.events.THIS_REMOVED:
                    this.dispose();
                    return;
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
