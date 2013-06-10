(function() {

//----------------------------------------------------------------------------------------------------------------------
// XML3D.base.DataList
//----------------------------------------------------------------------------------------------------------------------

XML3D.base.DataList = function(){
    this.srcDataList = null;
    this.children = [];
    this.dataListResult = null;
    this.listener = [];
};

XML3D.base.DataList.prototype.pushChild = function(index, child){
    this.children.push(child);
    child.dataListParent = this;
    invalidateDataList(this);
}

XML3D.base.DataList.prototype.setSrcDataList = function(dataList){
    if(this.srcDataList)
        this.srcDataList.removeChangeListener(this);

    this.srcDataList = dataList;

    if(this.srcDataList)
        this.srcDataList.addChangeListener(this);

    invalidateDataList(this);
}

XML3D.base.DataList.prototype.clearChildren = function(){
    var i = this.children.length;
    while(i--) this.children[i].dataListParent = null
    this.children = [];
    invalidateDataList(this);
}

XML3D.base.DataList.prototype.addChangeListener = function(listener){
    Xflow.utils.setAdd(this.listener, listener);
}
XML3D.base.DataList.prototype.removeChangeListener = function(listener){
    Xflow.utils.setRemove(this.listener, listener);
}

XML3D.base.DataList.prototype.onDataListChange = function(){
    invalidateDataList(this);
}


XML3D.base.DataList.prototype.getDataListTable = function(){
    if(!this.dataListResult)
        this.dataListResult = new XML3D.base.DataListResult(this);

    return this.dataListResult;
}


function invalidateDataList(dataList){
    if(dataList.dataListResult){
        dataList.dataListResult = null;
        for(var i = 0; i < dataList.listener.length; ++i){
            dataList.listener[i].onDataListChange(this);
        }
    }
}

function createDataListResult(dataList){
    if(dataList.children.length == 0 && dataList.srcDataList){
        dataList.dataListResult = dataList.srcDa
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
    this.meshtype = null;
    this.dataListParent = null;
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

XML3D.base.SubData.prototype.setMeshType = function(meshType){
    this.meshType = meshType;
    invalidateParent(this);
}

function invalidateParent(subData){
    if(!subData.dataListParent){
        invalidateDataList(subData.dataListParent);
    }
}

//----------------------------------------------------------------------------------------------------------------------
// XML3D.base.DataListResult
//----------------------------------------------------------------------------------------------------------------------

XML3D.base.DataListResult = function(dataList){
    this.entries = {};
    constructdataListTable(this, dataList.srcDataList, dataList.children);
}


XML3D.base.DataListResult.prototype.getMeshDataSets = function(){
    var result = [];
    for(var name in this.entries){
        var entry = this.entries[name];
        if(entry.meshType){
            updateAccumulatedNode(this, entry);
            result.push({
                xflowNode: entry.accumulatedXflowNode,
                type: entry.meshType,
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


function constructdataListTable(table, srcData, children){
    copySrcTable(table, srcData.getDataListTable());
    for(var i = 0; i < children.length; ++i){
        var child = children[i];
        var name = child.name;
        if(!this.entries[name])
            this.entries[name] = new DataListTableEntry();
        var entry = this.entries[name];
        entry.pushPostEntry(child);

        child.meshType = entry.meshType || child.meshType;
        if(child.shader) entry.shader = child.shader;
        if(child.transform) entry.transform = child.transform;
    }
}

function copySrcTable(table, srcTable){
    for(var name in srcTable.entries){
        var srcEntry = srcTable.entries[name];
        table.entries[name] = new DataListTableEntry(srcEntry);
    }
}


function DataListTableEntry (srcEntry){
    this.isMeshData = srcEntry && srcEntry.isMeshData || false;

    this.postAdd = srcEntry && srcEntry.postAdd.slice(0) || [];
    this.postQueue = srcEntry && srcEntry.postQueue.slice(0) || [];
    this.shader = srcEntry && srcEntry.shader || null;
    this.transform = srcEntry && srcEntry.transform || null;

    this.accumulatedXflowNode = null;

}

DataListTableEntry.prototype.pushPostEntry = function(subData){
    this.postQueue.push({
        proto: subData.postProto,
        compute: subData.postCompute,
        filter: subData.postFilter,
        xflowNode: subData.xflowNode
    });
    Xflow.utils.setAdd(this.postAdd, subData.postAdd);
}




}());