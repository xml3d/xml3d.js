(function() {

//----------------------------------------------------------------------------------------------------------------------
// XML3D.base.DataList
//----------------------------------------------------------------------------------------------------------------------

function DataListError(message, node){
    this.message = message;
    this.node = node;
}

XML3D.base.DataList = function(refNode){
    this.srcDataList = null;
    this.children = [];
    this.dataListResult = null;
    this.listener = [];
    this.loading = false;
    this.refNode = refNode || null;
};

XML3D.base.DataList.prototype.checkValidity = function(){
    if(this.isSubtreeLoading())
        return;
    checkRecursive(this);
}
function checkRecursive(datalist){
    var parentNames;
    if(datalist.srcDataList){
        parentNames = checkRecursive(datalist.srcDataList);
    }
    var localNames = [];
    for(var i = 0; i < datalist.children.length; ++i){
        var child = datalist.children[i], name = child.name;
        if(!name){
            throw new DataListError("Child subdata without a name.", child.refNode);
        }
        if(localNames.indexOf(name) != -1){
            throw new DataListError("Two subdata elements with the same name: '" + name + "'", child.refNode);
        }
        localNames.push(name);
    }
    var totalNames = localNames.slice();
    if(parentNames){
        Xflow.utils.setAdd(totalNames, parentNames);
    }
    for(var i = 0; i < datalist.children.length; ++i){
        checkIncludes(datalist.children[i], totalNames);
    }

    return totalNames;
}
function checkIncludes(subData, totalNames){
    if(!subData.includes)
        return;
    for(var i = 0; i < subData.includes.length; ++i){
        var inclName = subData.includes[i];
        if(totalNames.indexOf(inclName) == -1){
            throw new DataListError("Subdata '" + subData.name +
                 "' includes non existing subdata of name '" + inclName + "'", subData.refNode);
        }
    }
}



XML3D.base.DataList.prototype.setLoading = function(loading){
    if(loading != this.loading){
        this.loading = loading;
        invalidateDataList(this);
    }
}

XML3D.base.DataList.prototype.isSubtreeLoading = function(){
    if(this.srcDataList && this.srcDataList.isSubtreeLoading())
        return true;
    var i = this.children.length;
    while(i--){
        if(this.children[i].loading) return true;
    }
    return false;
}

XML3D.base.DataList.prototype.appendChild = function(child){
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

XML3D.base.DataList.prototype.getResult = function(){
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

//----------------------------------------------------------------------------------------------------------------------
// XML3D.base.SubData
//----------------------------------------------------------------------------------------------------------------------

XML3D.base.SubData = function(xflowNodeOut, xflowNodeIn, refNode){
    this.xflowNodeOut = xflowNodeOut;
    this.xflowNodeIn = xflowNodeIn;
    this.refNode = refNode || null;
    this.name = null;
    this.postDataflow = null;
    this.postCompute = null;
    this.postFilter = null;
    this.includes = [];
    this.shader = null;
    this.transform = null;
    this.meshType = null;
    this.dataListParent = null;
    this.loading = false;
};

XML3D.base.SubData.prototype.setLoading = function(loading){
    if(loading != this.loading){
        this.loading = loading;
        invalidateParent(this);
    }
}

XML3D.base.SubData.prototype.setName = function(name){
    this.name = name;
    invalidateParent(this);
}

XML3D.base.SubData.prototype.setPostDataflow = function(postDataflow){
    this.postDataflow = postDataflow;
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

XML3D.base.SubData.prototype.setIncludes = function(includes){
    this.includes = includes;
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
    if(subData.dataListParent){
        invalidateDataList(subData.dataListParent);
    }
}

//----------------------------------------------------------------------------------------------------------------------
// XML3D.base.DataListResult
//----------------------------------------------------------------------------------------------------------------------

XML3D.base.DataListResult = function(dataList){
    this.entries = {};
    constructDataListTable(this, dataList.srcDataList, dataList.children);
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
    if(!entry.outOfSync){
        return;
    }
    if(entry.accumulatedXflowNode){
        entry.accumulatedXflowNode.clearChildren();
        entry.accumulatedXflowNode.setCompute("");
        entry.accumulatedXflowNode.setFilter("");
        entry.accumulatedXflowNode.dataflowNode = null;
        entry.accumulatedXflowNode.setLoading(false);
    }
    else{
        entry.accumulatedXflowNode = XML3D.data.xflowGraph.createDataNode(false);
    }

    var dataNode = entry.postQueue.length == 1 ? entry.accumulatedXflowNode : XML3D.data.xflowGraph.createDataNode(false);
    for(var i = 0; i < entry.includes.length; ++i){
        var addEntry = table.entries[entry.includes[i]];
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
        if(!node) node = (i == entry.postQueue.length - 1 ? entry.accumulatedXflowNode : XML3D.data.xflowGraph.createDataNode(false));
        node.setCompute(postEntry.compute);
        node.setFilter(postEntry.filter);
        node.dataflowNode = postEntry.dataflow;
        node.setLoading(postEntry.dataflowLoading);
        if(parentNode) node.appendChild(parentNode);
        parentNode = node;
        node = null;
    }
    entry.outOfSync = false;
}


function constructDataListTable(table, srcData, children){
    if(srcData) copySrcTable(table, srcData.getResult());
    for(var i = 0; i < children.length; ++i){
        var child = children[i];
        var name = child.name;
        if(!table.entries[name])
            table.entries[name] = new DataListTableEntry();
        var entry = table.entries[name];
        entry.pushPostEntry(child);

        entry.meshType = child.meshType || entry.meshType;
        if(child.shader) entry.shader = child.shader;
        if(child.transform) entry.transform = child.transform;  // TODO: Better accumulate?
    }
}

function copySrcTable(table, srcTable){
    for(var name in srcTable.entries){
        var srcEntry = srcTable.entries[name];
        table.entries[name] = new DataListTableEntry(srcEntry);
    }
}


function DataListTableEntry (srcEntry){
    this.meshType = srcEntry && srcEntry.meshType || null;

    this.includes = srcEntry && srcEntry.includes.slice(0) || [];
    this.postQueue = srcEntry && srcEntry.postQueue.slice(0) || [];
    this.shader = srcEntry && srcEntry.shader || null;
    this.transform = srcEntry && srcEntry.transform || null;

    this.accumulatedXflowNode = null;
    this.outOfSync = true;

}

DataListTableEntry.prototype.pushPostEntry = function(subData){
    this.postQueue.push({
        dataflow: subData.postDataflow,
        dataflowLoading: subData.loading,
        compute: subData.postCompute,
        filter: subData.postFilter,
        xflowNode: subData.xflowNodeIn
    });
    this.accumulatedXflowNode = subData.xflowNodeOut;
    Xflow.utils.setAdd(this.includes, subData.includes);
}




}());