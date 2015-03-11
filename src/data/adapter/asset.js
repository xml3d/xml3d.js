var DOMTransformFetcher = require("../transform-fetcher.js");
var DataAdapter = require("./data.js");
var DataNode = require("../../xflow/interface/graph.js").DataNode;
var getComputeDataflowUrl = require("../../xflow/interface/graph.js").getComputeDataflowUrl;
var Asset = require("../../asset/asset.js").Asset;
var SubData = require("../../asset/asset.js").SubData;

var NodeAdapter = XML3D.base.NodeAdapter;
var createClass = XML3D.createClass;
var dispatchCustomEvent = XML3D.util.dispatchCustomEvent;
var AdapterHandle = XML3D.base.AdapterHandle;


var AssetAdapter = function (factory, node) {
    NodeAdapter.call(this, factory, node);

    // Node handles for src and proto
    this.asset = null;
    if (node.localName.toLowerCase() !== "model") {
        this.transformFetcher = new DOMTransformFetcher(this, "transform", "transform");
    }
};

createClass(AssetAdapter, NodeAdapter);

AssetAdapter.prototype.init = function () {
    this.asset = new Asset(this.node);
    this.asset.addChangeListener(this);
    this.asset.setName(this.node.getAttribute("name"));
    updateAdapterHandle(this, "src", this.node.getAttribute("src"));
    updatePickFilter(this);
    updateChildren(this);
    setShaderUrl(this, this.asset);
    this.transformFetcher && this.transformFetcher.update();
};

AssetAdapter.prototype.onAssetLoadChange = function (asset, newLevel, oldLevel) {
    if (newLevel == Infinity) {
        dispatchCustomEvent(this.node, 'load', false, true, null);
    } else if (newLevel > oldLevel) {
        dispatchCustomEvent(this.node, 'progress', false, true, null);
    }
};

AssetAdapter.prototype.getAssetComplete = function () {
    return this.asset.getProgressLevel() == Infinity;
};
AssetAdapter.prototype.getAssetProgressLevel = function () {
    return this.asset.getProgressLevel();
};

AssetAdapter.prototype.getAsset = function () {
    return this.asset;
};

function updateChildren(adapter) {
    adapter.asset.clearChildren();
    adapter.asset.clearSubAssets();
    for (var child = adapter.node.firstElementChild; child !== null; child = child.nextElementSibling) {
        var subadapter = adapter.factory.getAdapter(child);
        if (subadapter && subadapter.getAsset) {
            adapter.asset.appendSubAsset(subadapter.getAsset());
        }
        if (subadapter && subadapter.assetEntry) {
            adapter.asset.appendChild(subadapter.assetEntry);
        }
    }
}

function updateAdapterHandle(adapter, key, url) {
    var adapterHandle = adapter.getAdapterHandle(url), status = (adapterHandle && adapterHandle.status);

    if (status === AdapterHandle.STATUS.NOT_FOUND) {
        XML3D.debug.logError("Could not find element of url '" + adapterHandle.url + "' for " + key, adapter.node);
    }
    adapter.connectAdapterHandle(key, adapterHandle);
    adapter.connectedAdapterChanged(key, adapterHandle ? adapterHandle.getAdapter() : null, status);
}

function updateAssetLoadState(dataAdapter) {
    var loading = false, handle;

    handle = dataAdapter.getConnectedAdapterHandle("src");
    if (handle && handle.status === AdapterHandle.STATUS.LOADING) {
        loading = true;
    }
    dataAdapter.asset.setLoading(loading);
}

function updatePickFilter(adapter) {
    if (!adapter.node.hasAttribute("pick"))
        adapter.asset.setPickFilter(null); else {
        var value = adapter.node.getAttribute("pick");
        adapter.asset.setPickFilter(value);
    }
}

AssetAdapter.prototype.connectedAdapterChanged = function (attributeName, adapter) {
    if (attributeName == "src")
        this.asset.setSrcAsset(adapter && adapter.getAsset() || null);
    updateAssetLoadState(this);
};

AssetAdapter.prototype.onTransformChange = function (attrName, matrix) {
    this.asset.setTransform(matrix);
};


AssetAdapter.prototype.notifyChanged = function (evt) {
    if (evt.type == XML3D.events.ADAPTER_HANDLE_CHANGED) {
        this.connectedAdapterChanged(evt.key, evt.adapter);
        if (evt.handleStatus == AdapterHandle.STATUS.NOT_FOUND) {
            XML3D.debug.logError("Could not find <asset> element of url '" + evt.url + "' for " + evt.key);
        }
    } else if (evt.type == XML3D.events.NODE_INSERTED) {
        updateChildren(this);

    } else if (evt.type == XML3D.events.NODE_REMOVED) {
        updateChildren(this);

    } else if (evt.type == XML3D.events.VALUE_MODIFIED) {
        var attr = evt.mutation.attributeName;
        switch (attr) {
            case "name":
                this.asset.setName(this.node.getAttribute("name"));
                break;
            case "shader":
                setShaderUrl(this, this.asset);
                break;
            case "style":
            case "transform":
                this.transformFetcher && this.transformFetcher.update();
                break;
            case "src":
                updateAdapterHandle(this, "src", this.node.getAttribute("src"));
                break;
            case "pick":
                updatePickFilter(this);
                break;
        }

    } else if (evt.type == XML3D.events.THIS_REMOVED) {
        this.clearAdapterHandles();
    }
};

var AssetDataAdapter = function (factory, node) {
    this.assetData = true;
    DataAdapter.call(this, factory, node);

    // Node handles for src and proto
    this.assetEntry = null;
    this.outputXflowNode = null;
};
createClass(AssetDataAdapter, DataAdapter);

AssetDataAdapter.prototype.init = function () {
    DataAdapter.prototype.init.call(this);
    this.outputXflowNode = new DataNode(false);
    this.assetEntry = new SubData(this.outputXflowNode, this.getXflowNode(), this.node);
    this.assetEntry.setName(this.node.getAttribute("name"));
    updateClassNames(this);
    updatePostCompute(this);
    this.assetEntry.setPostFilter(this.node.getAttribute("filter"));
    updateIncludes(this.assetEntry, this.node.getAttribute("includes"));
};

AssetDataAdapter.prototype.connectedAdapterChanged = function (attributeName, adapter) {
    if (attributeName == "postDataflow") {
        this.assetEntry.setPostDataflow(adapter && adapter.getXflowNode() || null);
        updateSubDataLoadState(this);
    } else {
        DataAdapter.prototype.connectedAdapterChanged.call(this, attributeName, adapter);
    }
};

AssetDataAdapter.prototype.notifyChanged = function (evt) {
    DataAdapter.prototype.notifyChanged.call(this, evt);
    if (evt.type == XML3D.events.VALUE_MODIFIED) {
        var attr = evt.mutation.attributeName;
        switch (attr) {
            case "name":
                this.assetEntry.setName(this.node.getAttribute("name"));
                break;
            case "compute":
                updatePostCompute(this);
                break;
            case "class":
                updateClassNames(this);
                break;
            case "filter":
                this.assetEntry.setPostFilter(this.node.getAttribute("filter"));
                break;
            case "includes":
                updateIncludes(this.node.getAttribute("includes"));
                break;
        }

    }
};

AssetDataAdapter.prototype.onTransformChange = function (attrName, matrix) {
    this.assetEntry.setTransform(matrix);
};

function updateIncludes(assetEntry, includeString) {
    if (!includeString)
        assetEntry.setIncludes([]); else
        assetEntry.setIncludes(includeString.trim().split(/\s*,\s*/));
}

function updateClassNames(adapter) {
    var classNames = adapter.node.getAttribute("class");
    adapter.assetEntry.setClassNamesString(classNames)
}

function updatePostCompute(adapter) {
    var computeString = adapter.node.getAttribute("compute");
    var dataflowUrl = getComputeDataflowUrl(computeString);
    if (dataflowUrl) {
        updateAdapterHandle(adapter, "postDataflow", dataflowUrl);
    } else {
        adapter.disconnectAdapterHandle("postDataflow");
        updateSubDataLoadState(adapter);
    }
    adapter.assetEntry.setPostCompute(computeString);
}

function updateSubDataLoadState(dataAdapter) {
    var loading = false, handle;

    handle = dataAdapter.getConnectedAdapterHandle("postDataflow");
    if (handle && handle.status === AdapterHandle.STATUS.LOADING) {
        loading = true;
    }
    dataAdapter.assetEntry.setLoading(loading);
}


function setShaderUrl(adapter, dest) {
    var node = adapter.node;
    var shaderUrl = node.getAttribute("shader");
    if (shaderUrl) {
        var shaderId = XML3D.base.resourceManager.getAbsoluteURI(node.ownerDocument._documentURL ||
            node.ownerDocument.URL, shaderUrl);
        dest.setShader(shaderId.toString());
    } else {
        dest.setShader(null);
    }
}

var AssetMeshAdapter = function (factory, node) {
    AssetDataAdapter.call(this, factory, node);
    this.transformFetcher = new DOMTransformFetcher(this, "transform", "transform");
};
createClass(AssetMeshAdapter, AssetDataAdapter);

AssetMeshAdapter.prototype.init = function () {
    AssetDataAdapter.prototype.init.call(this);
    setShaderUrl(this, this.assetEntry);
    this.assetEntry.setMeshType(this.node.getAttribute("type") || "triangles");
    this.assetEntry.setMatchFilter(this.node.getAttribute("match"));
    this.transformFetcher.update();
};
AssetMeshAdapter.prototype.notifyChanged = function (evt) {
    AssetDataAdapter.prototype.notifyChanged.call(this, evt);
    if (evt.type == XML3D.events.VALUE_MODIFIED) {
        var attr = evt.mutation.attributeName;
        switch (attr) {
            case "shader":
                setShaderUrl(this, this.assetEntry);
                break;
            case "match":
                this.assetEntry.setMatchFilter(this.node.getAttribute("match"));
                break;
            case "style":
            case "transform":
                this.transformFetcher.update();
                break;
            case "type":
                this.assetEntry.setMeshType(this.node.getAttribute("type") || "triangles")
        }

    }
};

module.exports = {
    AssetAdapter: AssetAdapter, AssetMeshAdapter: AssetMeshAdapter, AssetDataAdapter: AssetDataAdapter
};
