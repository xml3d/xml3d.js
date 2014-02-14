(function() {


XML3D.data.DataListAdapter = function(factory, node) {
    XML3D.base.NodeAdapter.call(this, factory, node);

    // Node handles for src and proto
    this.dataList = null;
};
XML3D.createClass(XML3D.data.DataListAdapter, XML3D.base.NodeAdapter);

XML3D.data.DataListAdapter.prototype.init = function() {
    //var xflow = this.resolveScript();
    //if (xflow)
    //    this.scriptInstance = new XML3D.data.ScriptInstance(this, xflow);

    this.dataList = new XML3D.base.DataList();
    updateAdapterHandle(this, "src", this.node.getAttribute("src"));
    updateChildren(this);
};

XML3D.data.DataListAdapter.prototype.getDataList = function(){
    return this.dataList;
}

function updateChildren(adapter){
    adapter.dataList.clearChildren();
    for ( var child = adapter.node.firstElementChild; child !== null; child = child.nextElementSibling) {
        var subadapter = adapter.factory.getAdapter(child);
        if(subadapter && subadapter.dataListEntry){
            adapter.dataList.appendChild(subadapter.dataListEntry);
        }
    }
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

function updateDataListLoadState(dataAdapter){
    var loading = false, handle;

    handle = dataAdapter.getConnectedAdapterHandle("src");
    if (handle && handle.status === XML3D.base.AdapterHandle.STATUS.LOADING) {
        loading = true;
    }
    dataAdapter.dataList.setLoading(loading);
}

XML3D.data.DataListAdapter.prototype.connectedAdapterChanged = function(attributeName, adapter){
    if(attributeName == "src")
        this.dataList.setSrcDataList(adapter && adapter.dataList || null);
    updateDataListLoadState(this);
}


XML3D.data.DataListAdapter.prototype.notifyChanged = function(evt) {
    if(evt.type == XML3D.events.ADAPTER_HANDLE_CHANGED){
        this.connectedAdapterChanged(evt.key, evt.adapter);
        if(evt.handleStatus == XML3D.base.AdapterHandle.STATUS.NOT_FOUND){
            XML3D.debug.logError("Could not find <multidata> element of url '" + evt.url + "' for " + evt.key);
        }
        return;
    }
    else if (evt.type == XML3D.events.NODE_INSERTED) {
        updateChildren(this);
        return;
    }
    else if (evt.type == XML3D.events.NODE_REMOVED) {
        updateChildren(this);
        return;
    } else if (evt.type == XML3D.events.VALUE_MODIFIED) {
        var attr = evt.wrapped.attrName;
        if(attr == "src" )
            updateAdapterHandle(this, "src", this.node.getAttribute("src"));
        return;
    } else if (evt.type == XML3D.events.THIS_REMOVED) {
        this.clearAdapterHandles();
    }
};

XML3D.data.SubDataAdapter = function(factory, node) {
    XML3D.data.DataAdapter.call(this, factory, node);

    // Node handles for src and proto
    this.dataListEntry = null;
};
XML3D.createClass(XML3D.data.SubDataAdapter, XML3D.data.DataAdapter);

XML3D.data.SubDataAdapter.prototype.init = function() {
    //var xflow = this.resolveScript();
    //if (xflow)
    //    this.scriptInstance = new XML3D.data.ScriptInstance(this, xflow);
    XML3D.data.DataAdapter.prototype.init.call(this);
    this.dataListEntry = new XML3D.base.SubData(this.getXflowNode());
    this.dataListEntry.setName(this.node.getAttribute("name"));
    updatePostCompute(this);
    this.dataListEntry.setPostFilter(this.node.getAttribute("postfilter"));
    updateIncludes(this.dataListEntry, this.node.getAttribute("includes"));
    setShaderUrl(this);
    this.dataListEntry.setMeshType(this.node.getAttribute("meshtype"))
};

XML3D.data.SubDataAdapter.prototype.connectedAdapterChanged = function(attributeName, adapter){
    if(attributeName == "postDataflow"){
        this.dataListEntry.setPostDataflow(adapter && adapter.getXflowNode() || null);
        updateSubDataLoadState(this);
    }
    else{
        XML3D.data.DataAdapter.prototype.connectedAdapterChanged.call(this, attributeName, adapter);
    }
}

XML3D.data.SubDataAdapter.prototype.notifyChanged = function(evt) {
    XML3D.data.DataAdapter.prototype.notifyChanged.call(evt, this);
    if (evt.type == XML3D.events.VALUE_MODIFIED) {
        var attr = evt.wrapped.attrName;
        switch(attr){
            case "name": this.dataListEntry.setName(this.node.getAttribute("name")); break;
            case "postcompute": updatePostCompute(this); break;
            case "postfilter": this.dataListEntry.setPostFilter(this.node.getAttribute("postfilter")); break;
            case "includes": updateIncludes(this.node.getAttribute("includes")); break;
            case "shader": setShaderUrl(this); break;
            case "meshtype": this.dataListEntry.setMeshType(this.node.getAttribute("meshtype"))
        }
        return;
    }
};

function updateIncludes(dataListEntry, includeString){
    if(!includeString)
        dataListEntry.setIncludes([]);
    else
        dataListEntry.setIncludes(includeString.split(" "));
}

function updatePostCompute(adapter){
    var computeString = adapter.node.getAttribute("postcompute");
    var dataflowUrl = Xflow.getComputeDataflowUrl(computeString);
    if (dataflowUrl) {
        updateAdapterHandle(adapter, "postDataflow", dataflowUrl);
    }
    else {
        adapter.disconnectAdapterHandle("postDataflow");
        updateSubDataLoadState(adapter);
    }
    adapter.dataListEntry.setPostCompute(computeString);
}

function updateSubDataLoadState(dataAdapter) {
    var loading = false, handle;

    handle = dataAdapter.getConnectedAdapterHandle("postDataflow");
    if (handle && handle.status === XML3D.base.AdapterHandle.STATUS.LOADING) {
        loading = true;
    }
    dataAdapter.dataListEntry.setLoading(loading);
}


function setShaderUrl(adapter){
    var node = adapter.node;
    if(node.hasAttribute("shader")){
        var shaderId = XML3D.base.resourceManager.getAbsoluteURI(node.ownerDocument.documentURI,
             node.getAttribute("shader"));
        adapter.dataListEntry.setShader(shaderId.toString());
    }
    else{
        adapter.dataListEntry.setShader(null);
    }
}


}());
