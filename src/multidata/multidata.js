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

function invalidateParent(subData){
    if(!subData.multiDataParent){
        invalidateMultiData(subData.multiDataParent);
    }
}

//----------------------------------------------------------------------------------------------------------------------
// XML3D.base.MeshData
//----------------------------------------------------------------------------------------------------------------------

XML3D.base.MeshData = function(){
    XML3D.base.SubData.call(this);
    this.shader = null;
    this.transform = null;
};
XML3D.createClass(XML3D.base.MeshData, XML3D.base.SubData);


XML3D.base.MeshData.prototype.isMeshData = true;

XML3D.base.MeshData.prototype.setShader = function(shader){
    this.shader = shader;
    invalidateParent(this);
}

XML3D.base.MeshData.prototype.setTransform = function(transform){
    this.transform = transform;
    invalidateParent(this);
}

//----------------------------------------------------------------------------------------------------------------------
// XML3D.base.MultiDataTable
//----------------------------------------------------------------------------------------------------------------------

XML3D.base.MultiDataTable = function(multiData){
    this.entries = {};
    constructMultiDataTable(this, multiData.srcMultiData, multiData.children);
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

        if(child.xflowNode) entry.xflowNode = child.xflowNode;

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
    this.xflowNode = srcEntry && srcEntry.xflowNode || null;

    this.postAdd = srcEntry && srcEntry.postAdd.slice(0) || [];
    this.postQueue = srcEntry && srcEntry.postQueue.slice(0) || [];
    this.shader = srcEntry && srcEntry.shader || null;
    this.transform = srcEntry && srcEntry.transform || null;

}

MultiDataTableEntry.prototype.pushPostEntry = function(subData){
    this.postQueue.push({
        proto: subData.postProto,
        compute: subData.postCompute,
        filter: subData.postFilter
    });
    Xflow.utils.setAdd(this.postAdd, subData.postAdd);
}




}());