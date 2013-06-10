(function() {


XML3D.data.MultiDataAdapter = function(factory, node) {
    XML3D.base.NodeAdapter.call(this, factory, node);

    // Node handles for src and proto
    this.multiData = null;
};
XML3D.createClass(XML3D.data.MultiDataAdapter, XML3D.base.NodeAdapter);

XML3D.data.MultiDataAdapter.prototype.init = function() {
    //var xflow = this.resolveScript();
    //if (xflow)
    //    this.scriptInstance = new XML3D.data.ScriptInstance(this, xflow);

    this.multiData = new XML3D.base.DataList();
    this.updateHandle("src");
    createMultiData(this);
};

function createMultiData(adapter){
    adapter.multiData.clearChildren();
    for ( var child = adapter.node.firstElementChild; child !== null; child = child.nextElementSibling) {
        var subadapter = adapter.factory.getAdapter(child);
        if(subadapter && subadapter.multiDataEntry){
            adapter.multiData.appendChild(subadapter.multiDataEntry);
        }
    }

}

XML3D.data.MultiDataAdapter.prototype.updateHandle = function(attributeName) {
    var adapterHandle = this.getAdapterHandle(this.node.getAttribute(attributeName));
    if(adapterHandle && adapterHandle.status == XML3D.base.AdapterHandle.STATUS.NOT_FOUND){
        XML3D.debug.logError("Could not find <multidata> element of url '" + adapterHandle.url + "' for " + attributeName);
    }

    this.connectAdapterHandle(attributeName, adapterHandle);
    this.connectedAdapterChanged(attributeName, adapterHandle ? adapterHandle.getAdapter() : null);
};

XML3D.data.MultiDataAdapter.prototype.connectedAdapterChanged = function(attributeName, adapter){
    if(attributeName == "src")
        this.multiData.setSrcMultiData(adapter && adapter.multiData || null);
}


XML3D.data.MultiDataAdapter.prototype.notifyChanged = function(evt) {
    if(evt.type == XML3D.events.ADAPTER_HANDLE_CHANGED){
        this.connectedAdapterChanged(evt.key, evt.adapter);
        if(evt.handleStatus == XML3D.base.AdapterHandle.STATUS.NOT_FOUND){
            XML3D.debug.logError("Could not find <multidata> element of url '" + evt.url + "' for " + evt.key);
        }
        return;
    }
    else if (evt.type == XML3D.events.NODE_INSERTED) {
        createMultiData(this);
        return;
    }
    else if (evt.type == XML3D.events.NODE_REMOVED) {
        createMultiData(this);
        return;
    } else if (evt.type == XML3D.events.VALUE_MODIFIED) {
        var attr = evt.wrapped.attrName;
        if(attr == "src" ){
            this.updateHandle(attr);
        }
        return;
    } else if (evt.type == XML3D.events.THIS_REMOVED) {
        this.clearAdapterHandles();
    }
};

XML3D.data.SubDataAdapter = function(factory, node) {
    XML3D.base.DataAdapter.call(this, factory, node);

    // Node handles for src and proto
    this.multiData = null;
};
XML3D.createClass(XML3D.data.SubDataAdapter, XML3D.base.DataAdapter);

XML3D.data.SubDataAdapter.prototype.init = function() {
    //var xflow = this.resolveScript();
    //if (xflow)
    //    this.scriptInstance = new XML3D.data.ScriptInstance(this, xflow);
    XML3D.base.DataAdapter.prototype.init.call(this);
    this.multiDataEntry = new XML3D.base.SubData(this.getXflowNode());
    this.multiDataEntry.setName(this.node.getAttribute("name"));
    this.multiDataEntry.setPostCompute(this.node.getAttribute("postcompute"));
    this.multiDataEntry.setPostFilter(this.node.getAttribute("postfilter"));
    this.multiDataEntry.setPostAdd(this.node.getAttribute("postadd").split(" "));
    this.updateHandle("postproto");
};

XML3D.data.SubDataAdapter.prototype.connectedAdapterChanged = function(attributeName, adapter){
    if(attributeName == "postproto")
        this.multiDataEntry.setPostProto(adapter && adapter.getXflowNode() || null);
    else{
        XML3D.data.DataAdapter.prototype.connectedAdapterChanged.call(this, attributeName, adapter);
    }
}

XML3D.data.SubDataAdapter.prototype.notifyChanged = function(evt) {
    XML3D.data.DataAdapter.prototype.notifyChanged.call(evt, this);
    if (evt.type == XML3D.events.VALUE_MODIFIED) {
        var attr = evt.wrapped.attrName;
        switch(attr){
            case "name": this.multiDataEntry.setName(this.node.getAttribute("name")); break;
            case "postcompute": this.multiDataEntry.setPostCompute(this.node.getAttribute("postcompute")); break;
            case "postfilter": this.multiDataEntry.setPostFilter(this.node.getAttribute("postfilter")); break;
            case "postadd": this.multiDataEntry.setPostFilter(this.node.getAttribute("postadd")); break;
        }
        return;
    }
};


XML3D.data.MeshDataAdapter = function(factory, node) {
    XML3D.data.SubDataAdapter.call(this, factory, node);
};
XML3D.createClass(XML3D.data.MeshDataAdapter, XML3D.data.SubDataAdapter);

XML3D.data.MeshDataAdapter.prototype.init = function() {
    //var xflow = this.resolveScript();
    //if (xflow)
    //    this.scriptInstance = new XML3D.data.ScriptInstance(this, xflow);
    XML3D.data.SubDataAdapter.prototype.init.call(this);
    this.multiDataEntry.setMeshData(true);
    setShaderUrl(this);
};

function setShaderUrl(adapter){
    var node =adapter.node;
    var uri = new XML3D.URI(node.getAttribute("shader"));
    var shaderId = uri.getAbsoluteURI(node.ownerDocument.documentURI).toString();
    adapter.multiDataEntry.setShader(shaderId);
}

XML3D.data.MeshDataAdapter.prototype.notifyChanged = function(evt) {
    XML3D.data.SubDataAdapter.prototype.notifyChanged.call(evt, this);
    if (evt.type == XML3D.events.VALUE_MODIFIED) {
        var attr = evt.wrapped.attrName;
        switch(attr){
            case "shader": setShaderUrl(this); break;
        }
        return;
    }
};


}());
