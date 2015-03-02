var BaseDataAdapter = require("./base");

/**
 * DataAdapter handling a <dataflow> element
 * @param factory
 * @param node
 * @constructor
 */
var DataflowDataAdapter = function (factory, node) {
    BaseDataAdapter.call(this, factory, node);
    this.xflowDataNode = null;
};
XML3D.createClass(DataflowDataAdapter, BaseDataAdapter);

DataflowDataAdapter.prototype.init = function () {
    this.xflowDataNode = new Xflow.DataNode(null, false);
    this.dataflowRefs = [];
    updateDataflowXflowNode(this, this.node);
};

DataflowDataAdapter.prototype.updateAdapterHandle = function(key, url) {
    var oldAdapterHandle = this.getConnectedAdapterHandle(key);

    var adapterHandle = this.getAdapterHandle(url),
        status = (adapterHandle && adapterHandle.status);

    if(oldAdapterHandle == adapterHandle)
        return;
    if (status === XML3D.base.AdapterHandle.STATUS.NOT_FOUND) {
        XML3D.debug.logError("Could not find element of url '" + adapterHandle.url + "' for " + key, this.node);
    }
    this.connectAdapterHandle(key, adapterHandle);
    this.connectedAdapterChanged(key, adapterHandle ? adapterHandle.getAdapter() : null, status);
};


/**
 * @param evt notification of type XML3D.Notification
 */
DataflowDataAdapter.prototype.notifyChanged = function (evt) {
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
            var attr = evt.mutation.attributeName;
            if (attr === "out") {
                updateDataflowOut(this);
            } else if (attr === "platform") {
                updateDataflowXflowNode(this, this.node);
            }
            break;
    }
};

DataflowDataAdapter.prototype.updateXflowNode = function () {
    updateDataflowXflowNode(this, this.node);
};

DataflowDataAdapter.prototype.connectedAdapterChanged = function (key, adapter, status) {
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

    var child = node.lastElementChild, firstNode = true, prevNode = null, currentNode = adapter.xflowDataNode, subAdapter, xflowNode;

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
                    xflowNode = new Xflow.DataNode(null, false);
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
                    adapter.updateAdapterHandle(idx, currentNode.computeDataflowUrl);
                }
            }
        }

    } while (child = child.previousElementSibling);
}


module.exports = DataflowDataAdapter;
