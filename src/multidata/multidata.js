(function() {

//----------------------------------------------------------------------------------------------------------------------
// XML3D.base.MultiData
//----------------------------------------------------------------------------------------------------------------------

XML3D.base.MultiData = function(){
    this.srcMultiData = null;
    this.children = [];
    this.multiDataTable = null;
    this.listener = [];
};

XML3D.base.MultiData.prototype.pushChild = function(index, child){
    this.children.push(child);
    child.multiDataParent = this;
    invalidateMultiData(this);
}

XML3D.base.MultiData.prototype.setSrcMultiData = function(multiData){
    if(this.srcMultiData)
        this.srcMultiData.removeChangeListener(this);

    this.srcMultiData = multiData;

    if(this.srcMultiData)
        this.srcMultiData.addChangeListener(this);

    invalidateMultiData(this);
}

XML3D.base.MultiData.prototype.clearChildren = function(){
    var i = this.children.length;
    while(i--) this.children[i].multiDataParent = null
    this.children = [];
    invalidateMultiData(this);
}

XML3D.base.MultiData.prototype.addChangeListener = function(listener){
    Xflow.utils.setAdd(this.listener, listener);
}
XML3D.base.MultiData.prototype.removeChangeListener = function(listener){
    Xflow.utils.setRemove(this.listener, listener);
}

XML3D.base.MultiData.prototype.onMultiDataChange = function(){
    invalidateMultiData(this);
}


XML3D.base.MultiData.prototype.getMultiDataTable = function(){
    if(!this.multiDataTable)
        this.multiDataTable = new XML3D.base.MultiDataTable(this);

    return this.multiDataTable;
}


function invalidateMultiData(multiData){
    if(multiData.multiDataTable){
        multiData.multiDataTable = null;
        for(var i = 0; i < multiData.listener.length; ++i){
            multiData.listener[i].onMultiDataChange(this);
        }
    }
}

//----------------------------------------------------------------------------------------------------------------------
// XML3D.base.SubData
//----------------------------------------------------------------------------------------------------------------------



XML3D.base.SubData = function(xflowNode){
    this.xflowNode = xflowNode;
    this.name = null;
    this.postProto = null;
    this.postCompute = null;
    this.postFilter = null;
    this.postAdd = [];
    this.shader = null;
    this.transform = null;
    this.isMeshData = false;

    this.multiDataParent = null;
};

XML3D.base.SubData.prototype.setName = function(name){
    this.name = name;
    invalidateParent(this);
}

XML3D.base.SubData.prototype.setPostProto = function(postProto){
    this.postProto = postProto;
    invalidateParent(this);
}

XML3D.base.SubData.prototype.setPostCompute = function(postCompute){
    this.postCompute = postCompute;
    invalidateParent(this);
}

XML3D.base.SubData.prototype.setPostFilter = function(postFilter){
    this.postFilter = postFilter;
    invalidateParent(this);
}

XML3D.base.SubData.prototype.setPostAdd = function(postAdd){
    this.postAdd = postAdd;
    invalidateParent(this);
}

XML3D.base.SubData.prototype.setShader = function(shader){
    this.shader = shader;
    invalidateParent(this);
}

XML3D.base.SubData.prototype.setTransform = function(transform){
    this.transform = transform;
    invalidateParent(this);
}

XML3D.base.SubData.prototype.setMeshData = function(meshData){
    this.isMeshData = meshData;
    invalidateParent(this);
}

function invalidateParent(subData){
    if(!subData.multiDataParent){
        invalidateMultiData(subData.multiDataParent);
    }
}

//----------------------------------------------------------------------------------------------------------------------
// XML3D.base.MultiDataTable
//----------------------------------------------------------------------------------------------------------------------

XML3D.base.MultiDataTable = function(multiData){
    this.entries = {};
    constructMultiDataTable(this, multiData.srcMultiData, multiData.children);
}


XML3D.base.MultiDataTable.prototype.getMeshDataSets = function(){
    var result = [];
    for(var name in this.entries){
        var entry = this.entries[name];
        if(entry.isMeshData){
            updateAccumulatedNode(this, entry);
            result.push({
                xflowNode: entry.accumulatedXflowNode,
                shader: entry.shader
            });
        }
    }
    return result;
}

function updateAccumulatedNode(table, entry){
    if(entry.accumulatedXflowNode)
        return;
    var dataNode = XML3D.data.xflowGraph.createDataNode(false);
    for(var i = 0; i < entry.postAdd.length; ++i){
        var addEntry = table.entries[entry.postAdd[i]];
        updateAccumulatedNode(table, addEntry);
        dataNode.appendChild(addEntry.accumulatedXflowNode);
    }
    for(var i = 0; i < entry.postQueue.length; ++i){
        if(entry.postQueue[i].xflowNode)
            dataNode.appendChild(entry.postQueue[i].xflowNode);
    }
    var node = dataNode, parentNode = null;
    for(var i = 0; i < entry.postQueue.length; ++i){
        var postEntry = entry.postQueue[i];
        if(!node) node = XML3D.data.xflowGraph.createDataNode(false);
        node.setCompute(postEntry.compute);
        node.setFilter(postEntry.filter);
        node.protoNode = postEntry.proto;
        if(parentNode) parentNode.appendChild(node);
        parentNode = node;
        node = null;
    }
    entry.accumulatedXflowNode = parentNode;
}


function constructMultiDataTable(table, srcData, children){
    copySrcTable(table, srcData.getMultiDataTable());
    for(var i = 0; i < children.length; ++i){
        var child = children[i];
        var name = child.name;
        if(!this.entries[name])
            this.entries[name] = new MultiDataTableEntry();
        var entry = this.entries[name];
        entry.pushPostEntry(child);

        child.isMeshData = entry.isMeshData || child.isMeshData;
        if(child.shader) entry.shader = child.shader;
        if(child.transform) entry.transform = child.transform;
    }
}

function copySrcTable(table, srcTable){
    for(var name in srcTable.entries){
        var srcEntry = srcTable.entries[name];
        table.entries[name] = new MultiDataTableEntry(srcEntry);
    }
}


function MultiDataTableEntry (srcEntry){
    this.isMeshData = srcEntry && srcEntry.isMeshData || false;

    this.postAdd = srcEntry && srcEntry.postAdd.slice(0) || [];
    this.postQueue = srcEntry && srcEntry.postQueue.slice(0) || [];
    this.shader = srcEntry && srcEntry.shader || null;
    this.transform = srcEntry && srcEntry.transform || null;

    this.accumulatedXflowNode = null;

}

MultiDataTableEntry.prototype.pushPostEntry = function(subData){
    this.postQueue.push({
        proto: subData.postProto,
        compute: subData.postCompute,
        filter: subData.postFilter,
        xflowNode: subData.xflowNode
    });
    Xflow.utils.setAdd(this.postAdd, subData.postAdd);
}




}());