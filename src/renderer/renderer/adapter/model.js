var TransformableAdapter = require("./transformable.js");
var AdapterHandle = XML3D.base.AdapterHandle;

var ModelRenderAdapter = function (factory, node) {
    TransformableAdapter.call(this, factory, node, false, true);
    this.asset = null;
    this.postTransformXflowRequests = [];
    this.postTransformRenderGroups = [];
    this.createRenderNode();
    this._bindedRequestCallback = this.onXflowRequestChange.bind(this);
    this.transformFetcher.update();
};

var c_IDENTITY = XML3D.math.mat4.create();

XML3D.createClass(ModelRenderAdapter, TransformableAdapter, {

    createRenderNode: function () {
        var dataAdapter = XML3D.base.resourceManager.getAdapter(this.node, "data");
        this.asset = dataAdapter.getAsset();

        this.asset.addChangeListener(this);

        var parent = this.getParentRenderAdapter();
        var parentNode = parent.getRenderNode && parent.getRenderNode();

        this.renderNode = this.getScene().createRenderGroup({
            parent: parentNode, visible: this.node.visible, name: this.node.id
        });
        this.renderNode.setLocalMatrix(c_IDENTITY);
        this.createModelRenderNodes();
    },

    clearModelRenderNodes: function () {
        this.clearAdapterHandles();
        this._subRenderNodes = [];
        var i = this.postTransformXflowRequests.length;
        while (i--) {
            this.postTransformXflowRequests[i].clear();
        }
        rec_removeRenderNodes(this.renderNode, true);
        this.postTransformXflowRequests.length = 0;
        this.postTransformRenderGroups.length = 0;
    },

    createModelRenderNodes: function () {
        this.clearModelRenderNodes();
        if (!this.asset.isSubtreeLoading()) {
            try {
                this.asset.checkValidity();
                var assetResult = this.asset.getResult();
                var dataTree = assetResult.getDataTree();
                rec_createRenderNodes(this, this.renderNode, dataTree);
            } catch (e) {
                XML3D.debug.logError("Asset Error: " + e.message, e.node || this.node);
                this.clearModelRenderNodes();
            }
        }
    },

    getMaterialConfiguration: function (shaderHref, index) {
        var result = null;
        if (shaderHref) {
            var adapterHandle = this.getAdapterHandle(shaderHref);
            this.connectAdapterHandle("shader_" + index, adapterHandle);

            switch (adapterHandle.status) {

                case XML3D.base.AdapterHandle.STATUS.NOT_FOUND:
                    XML3D.debug.logError("Could not find <shader> of url '" + adapterHandle.url + "' ", this.node);
                    break;
                case XML3D.base.AdapterHandle.STATUS.READY:
                    var adapter = adapterHandle.getAdapter();
                    if (adapter && adapter.getMaterialConfiguration) {
                        result = adapter.getMaterialConfiguration();
                    }
                    break;
                case XML3D.base.AdapterHandle.STATUS.LOADING:
                    break;
            }

        }
        return result;
    },

    /**
     * @param evt
     */
    notifyChanged: function (evt) {
        TransformableAdapter.prototype.notifyChanged.call(this, evt);
        switch (evt.type) {
            case  XML3D.events.NODE_INSERTED:
                return;
            case XML3D.events.THIS_REMOVED:
                this.dispose();
                return;
            case XML3D.events.ADAPTER_HANDLE_CHANGED:
                var splits = evt.key.split("_");
                if (splits[0] == "shader") {
                    var renderNodeId = +splits[1];
                    // We identify the corresponding rendernode by the handler key
                    // This is a workaround that should be removed if there are
                    // custom callbacks for
                    var renderNode = this._subRenderNodes[renderNodeId];
                    XML3D.debug.assert(renderNode);
                    if (evt.handleStatus == AdapterHandle.STATUS.NOT_FOUND) {
                        renderNode.setMaterial(null);
                    } else {
                        var adapter = evt.adapter;
                        if (adapter && adapter.getMaterialConfiguration) {
                            renderNode.setMaterial(adapter.getMaterialConfiguration());
                        }
                    }
                    this.factory.renderer.requestRedraw("Material model changed.");
                }
        }
    },

    onAssetChange: function () {
         if (!this.renderNode) {
            //This model hasn't even been initialized yet so we defer building the render nodes to that step
            //This can happen for ex. when changing the "src" attribute before the model is appended into the DOM
            return;
        }

        this.createModelRenderNodes();
    },

    onXflowRequestChange: function (request) {
        var index = this.postTransformXflowRequests.indexOf(request);
        if (index != -1) {
            this.updatePostTransform(this.postTransformRenderGroups[index], request);
        }
    }, updatePostTransform: function (renderNode, xflowRequest) {
        var dataResult = xflowRequest.getResult();
        var transformData = (dataResult.getOutputData("transform") && dataResult.getOutputData("transform").getValue());
        if (!transformData) {
            XML3D.debug.logWarning("Post Transform entry does not contain any 'transform' value.", this.node);
            renderNode.setLocalMatrix(c_IDENTITY);
            return;
        }
        renderNode.setLocalMatrix(transformData);
    }, dispose: function () {
        this.asset.removeChangeListener(this);
        this.clearModelRenderNodes();
        this.getRenderNode().remove();
        this.clearAdapterHandles();
    }
});

function rec_removeRenderNodes(node, keepCurrentNode) {
    if (!node) {
        return;
    }
    if (!keepCurrentNode)
        node.remove();
    var children = node.getChildren();
    var i = children.length;
    while (i--) {
        rec_removeRenderNodes(children[i], false);
    }
}

function rec_createRenderNodes(adapter, parentNode, dataTreeNode) {

    if (dataTreeNode.postTransformXflowNode) {
        var request = new Xflow.ComputeRequest(dataTreeNode.postTransformXflowNode, ["transform"], adapter._bindedRequestCallback);
        parentNode = adapter.getScene().createRenderGroup({
            parent: parentNode, visible: true, name: undefined
        });
        adapter.postTransformXflowRequests.push(request);
        adapter.postTransformRenderGroups.push(parentNode);
        adapter.updatePostTransform(parentNode, request);
    }

    var groupNode = adapter.getScene().createRenderGroup({
        parent: parentNode,
        visible: true,
        name: adapter.node.id
    });
    groupNode.setLocalMatrix(dataTreeNode.transform || c_IDENTITY);
    groupNode.setMaterial(adapter.getMaterialConfiguration(dataTreeNode.shader, adapter._subRenderNodes.length));
    adapter._subRenderNodes.push(groupNode);

    var meshSets = dataTreeNode.meshes, i;
    for (i = 0; i < meshSets.length; ++i) {
        var renderNode = adapter.getScene().createRenderObject({
            parent: groupNode,
            node: meshSets[i].refNode || adapter.node,
            object: {
                data: meshSets[i].xflowNode, type: meshSets[i].type
            },
            name: adapter.node.id,
            visible: true
        });
        renderNode.setLocalMatrix(meshSets[i].transform || c_IDENTITY);
        renderNode.setMaterial(adapter.getMaterialConfiguration(meshSets[i].shader, adapter._subRenderNodes.length));
        adapter._subRenderNodes.push(renderNode);
    }
    var groups = dataTreeNode.groups;
    for (i = 0; i < groups.length; ++i) {
        rec_createRenderNodes(adapter, groupNode, groups[i]);
    }
}


// Interface methods

XML3D.extend(ModelRenderAdapter.prototype, {
    /**
     * @return {Window.XML3DBox}
     */
    getLocalBoundingBox: function () {
        if (this.renderNode) {
            var bbox = new XML3D.math.bbox.create();
            this.renderNode.getObjectSpaceBoundingBox(bbox);
            return XML3D.math.bbox.asXML3DBox(bbox);
        }

        return new window.XML3DBox();
    },

    /**
     * @return {Window.XML3DBox}
     */
    getWorldBoundingBox: function () {
        if (this.renderNode) {
            var bbox = new XML3D.math.bbox.create();
            this.renderNode.getWorldSpaceBoundingBox(bbox);
            return XML3D.math.bbox.asXML3DBox(bbox);
        }

        return new window.XML3DBox();
    },

    /**
     * @return {Window.XML3DMatrix}
     */
    getWorldMatrix: function () {
        var m = new window.XML3DMatrix(), obj = this.renderNode;
        if (obj) {
            obj.getWorldMatrix(m._data);
        }
        return m;
    }
});

// Export
module.exports = ModelRenderAdapter;

