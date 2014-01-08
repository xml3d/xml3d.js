XML3D.data = XML3D.data || {};

(function() {
"use strict";

XML3D.data.xflowGraph = new Xflow.Graph();
Xflow.setShaderConstant(Xflow.SHADER_CONSTANT_KEY.OBJECT_ID, "objectID");
Xflow.setShaderConstant(Xflow.SHADER_CONSTANT_KEY.SCREEN_TRANSFORM, "modelViewProjectionMatrix");
Xflow.setShaderConstant(Xflow.SHADER_CONSTANT_KEY.SCREEN_TRANSFORM_NORMAL, "modelViewProjectionNormalMatrix");
Xflow.setShaderConstant(Xflow.SHADER_CONSTANT_KEY.VIEW_TRANSFORM, "modelViewMatrix");
Xflow.setShaderConstant(Xflow.SHADER_CONSTANT_KEY.VIEW_TRANSFORM_NORMAL, "normalMatrix");
Xflow.setShaderConstant(Xflow.SHADER_CONSTANT_KEY.WORLD_TRANSFORM, "modelMatrix");
Xflow.registerErrorCallback(function(message, xflowNode){
    message = "Xflow: " + message;
    var userData = xflowNode.userData;
    if (userData && userData.ownerDocument) {
        if (userData.ownerDocument === document) {
            XML3D.debug.logError(message, userData);
        }
        else if (userData.id) {
            var uri = new XML3D.URI("#" + userData.id);
            uri = uri.getAbsoluteURI(userData.ownerDocument.documentURI);
            XML3D.debug.logError(message, "External Node: " + uri);
        }
        else {
            XML3D.debug.logError(message, "External Document: " + userData.ownerDocument.documentURI);
        }
    }
    else if (typeof userData == "string") {
        XML3D.debug.logError(message, userData);
    }
    else {
        XML3D.debug.logError(message);
    }
});

//Xflow.setShaderConstant(Xflow.SHADER_CONSTANT_KEY.WORLD_TRANSFORM_NORMAL, "objectID");

/**
 * @interface
 */
var IDataAdapter = function() {
};
IDataAdapter.prototype.getOutputs = function() {
};


/**
 *
 * @extends XML3D.base.NodeAdapter
 * @implements IDataAdapter
 * @abtract
 *
 * @param factory
 * @param node
 */
XML3D.data.BaseDataAdapter = function (factory, node) {
    XML3D.base.NodeAdapter.call(this, factory, node);
    this.xflowDataNode = null;
};
XML3D.createClass(XML3D.data.BaseDataAdapter, XML3D.base.NodeAdapter);


XML3D.data.BaseDataAdapter.prototype.getXflowNode = function () {
        return this.xflowDataNode;
};

XML3D.data.BaseDataAdapter.prototype.getComputeRequest = function (filter, callback) {
        return new Xflow.ComputeRequest(this.xflowDataNode, filter, callback);
};

XML3D.data.BaseDataAdapter.prototype.getComputeResult = function (filter) {
    var result = this.xflowDataNode._getResult(Xflow.RESULT_TYPE.COMPUTE, filter);
    return result;
};

XML3D.data.BaseDataAdapter.prototype.getOutputNames = function () {
    return this.xflowDataNode.getOutputNames();
};

XML3D.data.BaseDataAdapter.prototype.getOutputChannelInfo = function (name) {
    return this.xflowDataNode.getOutputChannelInfo(name);
};


/**
 * Constructor of XML3D.data.DataAdapter The DataAdapter implements the
 * DataCollector concept and serves as basis of all DataAdapter classes. In
 * general, a DataAdapter is associated with an element node which uses
 * generic data and should be instantiated via
 * XML3D.data.XML3DDataAdapterFactory to ensure proper functionality.
 *
 * @extends XML3D.base.Adapter
 * @implements IDataAdapter
 * @constructor
 *
 * @param factory
 * @param node
 */
XML3D.data.DataAdapter = function (factory, node) {
    XML3D.data.BaseDataAdapter.call(this, factory, node);
    this.xflowDataNode = null;
};
XML3D.createClass(XML3D.data.DataAdapter, XML3D.data.BaseDataAdapter);

XML3D.data.DataAdapter.prototype.init = function () {
    //var xflow = this.resolveScript();
    //if (xflow)
    //    this.scriptInstance = new XML3D.data.ScriptInstance(this, xflow);

    var protoNode = (this.node.localName === "proto");

    this.xflowDataNode = XML3D.data.xflowGraph.createDataNode(protoNode);
    this.xflowDataNode.userData = this.node;

    // Setting platform and node type information for a data sequence
    this.xflowDataNode.setPlatform(this.node.getAttribute("platform"));

    updateAdapterHandle(this, "src", this.node.getAttribute("src"));
    this.xflowDataNode.setFilter(this.node.getAttribute("filter"));

    updateCompute(this);
    recursiveDataAdapterConstruction(this);
};

    /** Recursively passing platform information to children of a data node
     *  Requires that the children and the parents of data nodes are defined
     *
     * @param {Xflow.DataNode} parentNode
     */
function recursiveDataNodeAttrInit(parentNode) {
    var children = parentNode._children, NChildren, i;

    if (children && children.length > 0) {
        NChildren = children.length;

        for (i = NChildren; i--;) {
            if (children[i] instanceof Xflow.DataNode) {
                children[i].setPlatform(parentNode._platform);
                recursiveDataNodeAttrInit(children[i]);
            }
        }
    }
}

function recursiveDataAdapterConstruction(adapter) {
    for (var child = adapter.node.firstElementChild; child !== null; child = child.nextElementSibling) {
        var subadapter = adapter.factory.getAdapter(child);
        if (subadapter) {
            adapter.xflowDataNode.appendChild(subadapter.getXflowNode());

            // Passes _platform values to children nodes starting from the node
            // where these attributes are first defined
            if (adapter.xflowDataNode._platform !== null) {
                recursiveDataNodeAttrInit(adapter.xflowDataNode);
            }
        }
    }
}

/**
 * The notifyChanged() method is called by the XML3D data structure to
 * notify the DataAdapter about data changes (DOM mustation events) in its
 * associating node. When this method is called, all observers of the
 * DataAdapter are notified about data changes via their notifyDataChanged()
 * method.
 *
 * @param evt notification of type XML3D.Notification
 */
XML3D.data.DataAdapter.prototype.notifyChanged = function (evt) {
    if (evt.type === XML3D.events.ADAPTER_HANDLE_CHANGED) {
        this.connectedAdapterChanged(evt.key, evt.adapter, evt.handleStatus);
        if (evt.handleStatus === XML3D.base.AdapterHandle.STATUS.NOT_FOUND) {
            XML3D.debug.logError("Could not find <data> element of url '" + evt.url + "' for " + evt.key, this.node);
        }

    } else if (evt.type === XML3D.events.NODE_INSERTED) {
        var insertedNode = evt.wrapped.target;
        var adapter = this.factory.getAdapter(insertedNode);
        if (!adapter) {
            return;
        }

        var insertedXflowNode = adapter.getXflowNode();
        var sibling = insertedNode, followUpAdapter = null;

        do {
            sibling = sibling.nextSibling;
        } while (sibling && !(followUpAdapter = this.factory.getAdapter(sibling)));

        if (followUpAdapter) {
            this.xflowDataNode.insertBefore(insertedXflowNode, followUpAdapter.getXflowNode());
        } else {
            this.xflowDataNode.appendChild(insertedXflowNode);
        }

    } else if (evt.type === XML3D.events.NODE_REMOVED) {
        var adapter = this.factory.getAdapter(evt.wrapped.target);
        if (!adapter) {
            return;
        }

        var removedXflowNode = adapter.getXflowNode();
        this.xflowDataNode.removeChild(removedXflowNode);

    } else if (evt.type === XML3D.events.VALUE_MODIFIED) {
        var attr = evt.wrapped.attrName;

        if (attr === "filter") {
            this.xflowDataNode.setFilter(this.node.getAttribute(attr));
        }
        else if (attr === "compute") {
            updateCompute(this);
        }
        else if (attr === "src") {
            updateAdapterHandle(this, attr, this.node.getAttribute(attr));
        } else if (attr === "platform") {
            updatePlatform(this);
        }

    } else if (evt.type === XML3D.events.THIS_REMOVED) {
        this.clearAdapterHandles();
    }
};

XML3D.data.DataAdapter.prototype.connectedAdapterChanged = function (key, adapter, status) {
    if (key === "src") {
        this.xflowDataNode.sourceNode = adapter ? adapter.getXflowNode() : null;
    }
    if (key === "dataflow") {
        this.xflowDataNode.dataflowNode = adapter ? adapter.getXflowNode() : null;
    }
    updateLoadState(this);
};

/**
 * Returns String representation of this DataAdapter
 */
XML3D.data.DataAdapter.prototype.toString = function () {
    return "XML3D.data.DataAdapter";
};

function updateCompute(dataAdapter) {
    var xflowNode = dataAdapter.xflowDataNode;
    xflowNode.setCompute(dataAdapter.node.getAttribute("compute"));
    if (xflowNode.computeDataflowUrl) {
        updateAdapterHandle(dataAdapter, "dataflow", xflowNode.computeDataflowUrl);
    }
    else {
        dataAdapter.disconnectAdapterHandle("dataflow");
        updateLoadState(dataAdapter);
    }
}

function updatePlatform(dataAdapter) {
    var xflowNode = dataAdapter.xflowDataNode;

    xflowNode.setPlatform(dataAdapter.node.getAttribute("platform"));
    recursiveDataNodeAttrInit(xflowNode);
}

function updateLoadState(dataAdpater) {
    var loading = false, handle;

    handle = dataAdpater.getConnectedAdapterHandle("src");
    if (handle && handle.status === XML3D.base.AdapterHandle.STATUS.LOADING) {
        loading = true;
    }

    handle = dataAdpater.getConnectedAdapterHandle("dataflow");
    if (handle && handle.status === XML3D.base.AdapterHandle.STATUS.LOADING) {
        loading = true;
    }

    dataAdpater.xflowDataNode.setLoading(loading);
}

function updateAdapterHandle(adapter, key, url) {
    var adapterHandle = adapter.getAdapterHandle(url),
        status = (adapterHandle && adapterHandle.status);

    if (status === XML3D.base.AdapterHandle.STATUS.NOT_FOUND) {
        XML3D.debug.logError("Could not find element of url '" + adapterHandle.url + "' for " + key, adapter.node);
    }
    adapter.connectAdapterHandle(key, adapterHandle);
    adapter.connectedAdapterChanged(key, adapterHandle ? adapterHandle.getAdapter() : null, status);
}


/**
 * DataAdapter handling a <dataflow> element
 * @param factory
 * @param node
 * @constructor
 */
XML3D.data.DataflowDataAdapter = function (factory, node) {
    XML3D.data.BaseDataAdapter.call(this, factory, node);
    this.xflowDataNode = null;
};
XML3D.createClass(XML3D.data.DataflowDataAdapter, XML3D.data.BaseDataAdapter);

XML3D.data.DataflowDataAdapter.prototype.init = function() {
    this.xflowDataNode = XML3D.data.xflowGraph.createDataNode();
    this.dataflowRefs = [];
    updateDataflowXflowNode(this, this.node);
};

/**
 * @param evt notification of type XML3D.Notification
 */
XML3D.data.DataflowDataAdapter.prototype.notifyChanged = function (evt) {
    if (evt.type === XML3D.events.ADAPTER_HANDLE_CHANGED) {
        //TODO: Handle ADAPTER_HANDLE_CHANGED
    }

    switch (evt.type) {
        case XML3D.events.ADAPTER_HANDLE_CHANGED:
            this.connectedAdapterChanged(evt.key, evt.adapter, evt.handleStatus);
            if (evt.handleStatus === XML3D.base.AdapterHandle.STATUS.NOT_FOUND) {
                XML3D.debug.logError("Could not find dataflow of url '" + evt.url, this.node);
            }
            break;

        case XML3D.events.NODE_INSERTED:
        case XML3D.events.NODE_REMOVED:
            updateDataflowXflowNode(this);
            break;

        case XML3D.events.VALUE_MODIFIED:
            var attr = evt.wrapped.attrName;
            if (attr === "out") {
                updateDataflowOut(this);
            } else if (attr === "platform") {
                updateDataflowXflowNode(this, this.node);
            }
            break;
    }
};

XML3D.data.DataflowDataAdapter.prototype.updateXflowNode = function () {
    updateDataflowXflowNode(this, this.node);
};

XML3D.data.DataflowDataAdapter.prototype.connectedAdapterChanged = function (key, adapter, status) {
    var xflowNode = this.dataflowRefs[key];
    if (xflowNode) {
        xflowNode.dataflowNode = adapter ? adapter.getXflowNode() : null;
        xflowNode.setLoading(status === XML3D.base.AdapterHandle.STATUS.LOADING);
    }
};

function updateDataflowOut(adapter) {
    var out = adapter.node.getAttribute("out");
    if (out) {
        adapter.xflowDataNode.setFilter("keep(" + out + ")");
    } else {
        adapter.xflowDataNode.setFilter("");
    }
}

function updateDataflowXflowNode(adapter, node) {
    // Getting platform and node type information for a Dataflow node
    var platform = node.getAttribute("platform");

    adapter.xflowDataNode.clearChildren();
    adapter.xflowDataNode.setCompute("");
    adapter.clearAdapterHandles();
    adapter.dataflowRefs = [];
    updateDataflowOut(adapter);

    var child = node.lastElementChild, firstNode = true, prevNode = null, currentNode = adapter.xflowDataNode,
        subAdapter, xflowNode;

    do {
        subAdapter = adapter.factory.getAdapter(child);
        if (!subAdapter) {
            continue;
        }

        if (subAdapter.getXflowNode) {
            xflowNode = subAdapter.getXflowNode();

            if (prevNode) {
                currentNode.insertBefore(xflowNode, prevNode);
            } else {
                currentNode.appendChild(xflowNode);
            }
            prevNode = xflowNode;
        } else if (subAdapter.getComputeCode) {
            var statements = subAdapter.getComputeCode().split(";");
            var j = statements.length;

            while (j--) {
                var compute = statements[j].trim();
                if (!compute) {
                    continue;
                }

                if (firstNode) {
                    firstNode = false;
                } else {
                    xflowNode = XML3D.data.xflowGraph.createDataNode();
                    if (prevNode) {
                        currentNode.insertBefore(xflowNode, prevNode);
                    } else {
                        currentNode.appendChild(xflowNode);
                    }
                    currentNode = xflowNode;
                    prevNode = null;
                }
                currentNode.userData = child;

                currentNode.setPlatform(platform);

                currentNode.setCompute(statements[j].trim());

                if (currentNode.computeDataflowUrl) {
                    var idx = adapter.dataflowRefs.length;
                    adapter.dataflowRefs.push(currentNode);
                    updateAdapterHandle(adapter, idx, currentNode.computeDataflowUrl);
                }
            }
        }

    } while (child = child.previousElementSibling);
}

/**
 * DataAdapter handling a <compute> element
 * @param factory
 * @param node
 * @constructor
 */
XML3D.data.ComputeDataAdapter = function (factory, node) {
    XML3D.base.NodeAdapter.call(this, factory, node);
};
XML3D.createClass(XML3D.data.ComputeDataAdapter, XML3D.base.NodeAdapter);

XML3D.data.ComputeDataAdapter.prototype.getComputeCode = function () {
    return this.node.value;
};

/**
 * @param evt notification of type XML3D.Notification
 */
XML3D.data.ComputeDataAdapter.prototype.notifyChanged = function (evt) {
    switch (evt.type) {
        case XML3D.events.VALUE_MODIFIED:
        case XML3D.events.NODE_INSERTED:
        case XML3D.events.NODE_REMOVED:
            var parent = this.node.parentNode;
            if (parent) {
                var parentAdapter = this.factory.getAdapter(parent);
                parentAdapter && parentAdapter.updateXflowNode();
            }
    }
};


}());
