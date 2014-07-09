XML3D.webgl.MAX_MESH_INDEX_COUNT = 65535;

//Adapter for <mesh>
(function (webgl) {


    var c_IDENTITY = XML3D.math.mat4.create();

    /**
     * @constructor
     */
    var MeshRenderAdapter = function (factory, node) {
        webgl.TransformableAdapter.call(this, factory, node, true);

        this.initializeEventAttributes();
        this.createRenderNode();
    };

    XML3D.createClass(MeshRenderAdapter, webgl.TransformableAdapter, {

        createRenderNode: function () {
            var dataAdapter = XML3D.base.resourceManager.getAdapter(this.node, XML3D.data);

            var parent = this.getParentRenderAdapter();
            var parentNode = parent.getRenderNode && parent.getRenderNode();

            this.renderNode = this.getScene().createRenderObject({
                parent: parentNode,
                node: this.node,
                object: {
                    data: dataAdapter.getXflowNode(),
                    type: this.getMeshType()
                },
                name: this.node.id,
                shaderHandle: this.getShaderHandle(),
                visible: !this.node.visible ? false : undefined
            });
            this.updateLocalMatrix();
        },

        getMeshType: function() {
            return this.node.hasAttribute("type") ? this.node.getAttribute("type") : "triangles";
        },

        /**
         * @param {XML3D.events.Notification} evt
         */
        notifyChanged: function (evt) {
            XML3D.webgl.TransformableAdapter.prototype.notifyChanged.call(this, evt);
            switch(evt.type) {
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

                case "src":
                    // Handled by data component
                    break;

                case "type":
                    this.renderNode.setType(evt.newValue);
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
        },

        setWorldSpaceBoundingBox: function(bboxNew) {
            if (bboxNew instanceof XML3DBox) {
                var bb = XML3D.math.bbox.fromXML3DBox(bboxNew);
                this.renderNode.setBoundingBoxDirty();
                this.renderNode.setWorldSpaceBoundingBox(bb);
                this.renderNode.boundingBoxDirty = false;
                this.getScene().requestRedraw("A world space bounding box was changed");
            } else {
                console.error("Input to setWorldSpaceBoundingBox must be an XML3DBox object!");
            }
        }
    });

    // Export to XML3D.webgl namespace
    webgl.MeshRenderAdapter = MeshRenderAdapter;

}(XML3D.webgl));
