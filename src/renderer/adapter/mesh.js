XML3D.webgl.MAX_MESH_INDEX_COUNT = 65535;

//Adapter for <mesh>
(function (webgl) {

    /**
     * @constructor
     */
    var MeshRenderAdapter = function (factory, node) {
        webgl.TransformableAdapter.call(this, factory, node);

        this.initializeEventAttributes();
        this.createRenderNode();
    };

    XML3D.createClass(MeshRenderAdapter, webgl.TransformableAdapter, {

        createRenderNode: function () {
            var dataAdapter = XML3D.base.resourceManager.getAdapter(this.node, XML3D.data);

            var parent = this.getParentRenderAdapter();
            var parentNode = parent.getRenderNode && parent.getRenderNode();

            this.renderNode = this.getScene().createRenderMesh({
                parent: parentNode,
                node: this.node,
                object: {
                    data: dataAdapter.getXflowNode(),
                    type: this.getMeshType()
                },
                name: this.node.id,
                visible: !this.node.visible ? false : undefined
            });
        var bbox = XML3D.math.bbox.create();
        this.renderNode.setObjectSpaceBoundingBox(bbox);

        },

        getMeshType: function() {
            return this.node.hasAttribute("type") ? this.node.getAttribute("type") : "triangles";
        },

        /**
         * @param {XML3D.events.Notification} evt
         */
        notifyChanged: function (evt) {
            switch(evt.type) {
                case XML3D.events.ADAPTER_HANDLE_CHANGED:
                    if (evt.key == "shader") {
                        this.updateShader(evt.adapter);
                        if (evt.handleStatus == XML3D.base.AdapterHandle.STATUS.NOT_FOUND) {
                            XML3D.debug.logWarning("Missing shader with id '" + evt.url + "', falling back to default shader.");
                        }
                    }
                    return;
                case  XML3D.events.NODE_INSERTED:
                    return;
                case XML3D.events.THIS_REMOVED:
                    this.dispose();
                    return;
                case XML3D.events.NODE_REMOVED:
                    // this.createPerObjectData();
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

                case "type":
                    this.renderNode.setType(evt.newValue);
                    break;

                default:
                    XML3D.debug.logWarning("Unhandled mutation event in mesh adapter for parameter '" + target + "'", evt);
                    break;
            }

        },
        dispose: function () {
            this.getRenderNode().remove();
            this.clearAdapterHandles();
        }
    });



    // Interface methods

    XML3D.extend(MeshRenderAdapter.prototype, {
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
    webgl.MeshRenderAdapter = MeshRenderAdapter;

}(XML3D.webgl));
