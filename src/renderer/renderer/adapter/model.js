var SceneElementAdapter = require("./scene-element.js");
var ComputeRequest = require("../../../xflow/interface/request.js").ComputeRequest;
var Events = require("../../../interface/notification.js");
var Resource = require("../../../base/resourcemanager.js").Resource;
var AdapterHandle = require("../../../base/adapterhandle.js");
var mat4 = require("gl-matrix").mat4;

var ModelRenderAdapter = function (factory, node) {
    SceneElementAdapter.call(this, factory, node, false, true);
    this.asset = null;
    this.postTransformXflowRequests = [];
    this.postTransformRenderGroups = [];
    this.createRenderNode();
    this._bindedRequestCallback = this.onXflowRequestChange.bind(this);
    this.transformFetcher.update();
};

var c_IDENTITY = mat4.create();

XML3D.createClass(ModelRenderAdapter, SceneElementAdapter, {

    createRenderNode: function () {
        var dataAdapter = Resource.getAdapter(this.node, "data");
        this.asset = dataAdapter.getAsset();

        this.asset.addChangeListener(this);

        var parent = this.getParentRenderAdapter();
        var parentNode = parent.getRenderNode && parent.getRenderNode();

        this.renderNode = this.getScene().createRenderGroup({
            parent: parentNode, name: this.node.id
        });
        this.renderNode.setLocalMatrix(c_IDENTITY);
        this.createModelRenderNodes();
        this.updateVisibility();

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

    getMaterialConfiguration: function (materialURI, index) {
        var result = null;
        if (materialURI) {
            var adapterHandle = this.getAdapterHandle(materialURI);
            this.connectAdapterHandle("material_" + index, adapterHandle);

            switch (adapterHandle.status) {

                case AdapterHandle.STATUS.NOT_FOUND:
                    XML3D.debug.logError("Could not find <material> of url '" + adapterHandle.url + "' ", this.node);
                    break;
                case AdapterHandle.STATUS.READY:
                    var adapter = adapterHandle.getAdapter();
                    if (adapter && adapter.getMaterialConfiguration) {
                        result = adapter.getMaterialConfiguration();
                    }
                    break;
                case AdapterHandle.STATUS.LOADING:
                    break;
            }

        }
        return result;
    },

    updateVisibility: function() {
        var none = this.style.getPropertyValue("display").trim() == "none";
        var hidden  = this.style.getPropertyValue("visibility").trim() == "hidden";
        var visible = !(none || hidden);
        var propagate = function(node) {
            if (node.setLocalVisible) {
                 node.setLocalVisible(visible)
            }
            if (node.children) {
                node.children.forEach(propagate);
            }
        };
        propagate(this.renderNode);
    },


    /**
     * @param evt
     */
    notifyChanged: function (evt) {
        SceneElementAdapter.prototype.notifyChanged.call(this, evt);
        switch (evt.type) {
            case Events.ADAPTER_HANDLE_CHANGED:
                var splits = evt.key.split("_");
                if (splits[0] == "material") {
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
    },

    updatePostTransform: function (renderNode, xflowRequest) {
        var dataResult = xflowRequest.getResult();
        var transformData = (dataResult.getOutputData("transform") && dataResult.getOutputData("transform").getValue());
        if (!transformData) {
            XML3D.debug.logWarning("Post Transform entry does not contain any 'transform' value.", this.node);
            renderNode.setLocalMatrix(c_IDENTITY);
            return;
        }
        renderNode.setLocalMatrix(transformData);
    },

    dispose: function () {
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
        var request = new ComputeRequest(dataTreeNode.postTransformXflowNode, ["transform"], adapter._bindedRequestCallback);
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
    groupNode.setMaterial(adapter.getMaterialConfiguration(dataTreeNode.material, adapter._subRenderNodes.length));
    adapter._subRenderNodes.push(groupNode);

    var meshSets = dataTreeNode.meshes, i;
    for (i = 0; i < meshSets.length; ++i) {
        var renderNode = adapter.getScene().createRenderObject({
            parent: groupNode,
            node: meshSets[i].refNode || adapter.node,
            configuration: {
                data: meshSets[i].xflowNode, type: meshSets[i].type
            },
            name: adapter.node.id,
            visible: meshSets[i].visible
        });
        renderNode.setLocalMatrix(meshSets[i].transform || c_IDENTITY);
        renderNode.setMaterial(adapter.getMaterialConfiguration(meshSets[i].material, adapter._subRenderNodes.length));
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
     * @return {XML3D.Box}
     */
    getLocalBoundingBox: function () {
        var bbox = new XML3D.Box();
        if (this.renderNode) {
            this.renderNode.getObjectSpaceBoundingBox(bbox);
        }
        return bbox;
    },

    /**
     * @return {XML3D.Box}
     */
    getWorldBoundingBox: function () {
        var bbox = new XML3D.Box();
        if (this.renderNode) {
            this.renderNode.getWorldSpaceBoundingBox(bbox);
        }
        return bbox;
    },

    /**
     * @return {mat4}
     */
    getWorldMatrix: function () {
        var m = new XML3D.Mat4(), obj = this.renderNode;
        if (obj) {
            obj.getWorldMatrix(m.data);
        }
        return m;
    }
});

// Export
module.exports = ModelRenderAdapter;

