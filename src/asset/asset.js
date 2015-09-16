var Set = require("../xflow/utils/utils.js").set;
var DataNode = require("../xflow/interface/graph.js").DataNode;
var Base = require("../xflow/base.js");

function AssetError(message, node){
    this.message = message;
    this.node = node;
}

var Asset = function(refNode){
    this.name = null;
    this.srcAsset = null;
    this.children = [];
    this.subAssets = [];
    this.pickFilter = null;
    this.parents = [];
    this.listener = [];
    this.loading = false;
    this.refNode = refNode || null;
    this.shader = null;
    this.transform = null;

    this.assetResult = null;
    this.loadLevel = 0;
    this.progressLevel = Infinity;
};

Asset.prototype.checkValidity = function(){
    if(this.isSubtreeLoading())
        return;
    checkRecursive(this);
};
function checkRecursive(asset){
    if(asset.srcAsset){
        checkRecursive(asset.srcAsset);
    }
    var localNames = [];
    for(var i = 0; i < asset.children.length; ++i){
        var child = asset.children[i], name = child.name;
        if(name && localNames.indexOf(name) != -1){
            throw new AssetError("Two subdata elements with the same name: '" + name + "'", child.refNode);
        }
        if(name) localNames.push(name);
    }
    for(var i = 0; i < asset.subAssets.length; ++i){
        checkRecursive(asset.subAssets[i]);
    }
}


Asset.prototype.setLoading = function(loading){
    if(loading != this.loading){
        this.loading = loading;
        updateLoadingState(this);
        invalidateAsset(this);

    }
};

Asset.prototype.isSubtreeLoading = function(){
    return this.progressLevel == 0;
};
Asset.prototype.getProgressLevel = function(){
    return this.progressLevel;
};

Asset.prototype.setName = function(name){
    this.name = name;
    invalidateAsset(this);
};

Asset.prototype.setShader = function(shader){
    this.shader = shader;
    invalidateAsset(this);
};

Asset.prototype.setTransform = function(transform){
    this.transform = transform;
    if (this.refNode.localName.toLowerCase() !== "model") {
        invalidateAsset(this);
    }
};

Asset.prototype.appendChild = function(child){
    this.children.push(child);
    child.assetParent = this;
    updateLoadingState(this);
    invalidateAsset(this);

};

Asset.prototype.setPickFilter = function(pickFilterString){
    if(typeof pickFilterString == "string"){
        this.pickFilter = new AssetPickFilter();
        this.pickFilter.parse(pickFilterString);
    }
    else
        this.pickFilter = null;
    invalidateAsset(this);
};

Asset.prototype.appendSubAsset = function(subAsset){
    subAsset._addParent(this);
    this.subAssets.push(subAsset);
    updateLoadingState(this);
    invalidateAsset(this);

};

Asset.prototype.setSrcAsset = function(asset){
    if(this.srcAsset)
        this.srcAsset._removeParent(this);

    this.srcAsset = asset;

    if(this.srcAsset)
        this.srcAsset._addParent(this);
    updateLoadingState(this);
    invalidateAsset(this);

};

Asset.prototype.clearChildren = function(){
    var i = this.children.length;
    while(i--) this.children[i].assetParent = null;
    this.children = [];
    updateLoadingState(this);
    invalidateAsset(this);

};
Asset.prototype.clearSubAssets = function(){
    var i = this.subAssets.length;
    while(i--) {
        this.subAssets[i]._removeParent(this);
    }
    this.subAssets.length = 0;
    updateLoadingState(this);
    invalidateAsset(this);

};

Asset.prototype._addParent = function(asset){
    this.parents.push(asset);
};
Asset.prototype._removeParent = function(asset){
    var idx = this.parents.indexOf(asset);
    if(idx != -1)
        this.parents.splice(idx, 1);
};

Asset.prototype._callLoadListeners = function(newLevel, oldLevel){
    var listeners = this.listener;
    for(var i = 0; i < listeners.length; ++i){
        listeners[i].onAssetLoadChange && listeners[i].onAssetLoadChange(this, newLevel, oldLevel);
    }
};


Asset.prototype.addChangeListener = function(listener){
    Set.add(this.listener, listener);
};
Asset.prototype.removeChangeListener = function(listener){
    Set.remove(this.listener, listener);
    if (!this.listener.length) {
        this.dispose();
    }
};

Asset.prototype.dispose = function() {
    this.assetResult.dispose();
    this.clearSubAssets();
    this.clearChildren();
};

Asset.prototype.getResult = function(){
    if(!this.assetResult){
        this.assetResult = new AssetResult();
        this.assetResult.construct(this);
    }
    return this.assetResult;
};

function invalidateAsset(asset){
    if(asset.assetResult){
        asset.assetResult = null;
    }
    var listeners = asset.listener;
    for(var i = 0; i < listeners.length; ++i){
        listeners[i].onAssetChange && listeners[i].onAssetChange(this);
    }
    var i = asset.parents.length;
    while(i--){
        invalidateAsset(asset.parents[i]);
    }
}


function updateLoadingState(asset){
    var progressLevel = asset.loading ? asset.loadLevel : Infinity;
    if(progressLevel && asset.srcAsset){
        progressLevel = Math.min(progressLevel, Math.max(asset.srcAsset.loadLevel, asset.srcAsset.progressLevel));
    }
    var i = asset.subAssets.length;
    while(progressLevel && i--){
        progressLevel = Math.min(progressLevel, Math.max(asset.subAssets[i].loadLevel, asset.subAssets[i].progressLevel));
    }
    var i = asset.children.length;
    while(progressLevel && i--){
        progressLevel = Math.min(progressLevel, asset.children[i].progressLevel);
    }
    var oldLevel = asset.progressLevel;
    asset.progressLevel = progressLevel;

    if(oldLevel != asset.progressLevel){
        asset._callLoadListeners(asset.progressLevel, oldLevel);
        for(var i = 0; i < asset.parents.length; ++i)
            updateLoadingState(asset.parents[i]);
    }
}


//----------------------------------------------------------------------------------------------------------------------
// SubData
//----------------------------------------------------------------------------------------------------------------------

var SubData = function(xflowNodeOut, xflowNodeIn, refNode){
    this.xflowNodeOut = xflowNodeOut;
    this.xflowNodeIn = xflowNodeIn;
    this.refNode = refNode || null;
    this.name = null;
    this.matchFilter = null;
    this.classNames = [];
    this.postDataflow = null;
    this.postCompute = null;
    this.postFilter = null;
    this.includes = [];
    this.shader = null;
    this.transform = null;
    this.meshType = null;
    this.assetParent = null;
    this.loading = false;
    this.loadLevel = 0;
    this.progressLevel = Infinity;
    xflowNodeIn.addLoadListener(this.onXflowLoadEvent.bind(this));
    this._updateLoadingState();
};

SubData.prototype.setLoading = function(loading){
    if(loading != this.loading){
        this.loading = loading;
        this._updateLoadingState();
        invalidateParent(this);

    }
};

SubData.prototype._updateLoadingState = function(){
    var progressLevel = this.loading ? this.loadLevel : Infinity;
    progressLevel = Math.min(progressLevel, this.xflowNodeIn.getProgressLevel());
    var oldLevel = this.progressLevel;
    this.progressLevel = progressLevel;

    if(oldLevel != this.progressLevel){
        this.assetParent && updateLoadingState(this.assetParent);
        invalidateParent(this);
    }
};
SubData.prototype.onXflowLoadEvent = function(){
    this._updateLoadingState();
};

SubData.prototype.isSubtreeLoading = function(){
    return this.loading;
};

SubData.prototype.isMesh = function(){
    return !!this.meshType;
};

SubData.prototype.setName = function(name){
    this.name = name;
    invalidateParent(this);
};

SubData.prototype.setMatchFilter = function(matchString){
    if(typeof matchString == "string"){
        this.matchFilter = new AssetPickFilter();
        this.matchFilter.parse(matchString);
    }
    else
        this.matchFilter = null;
    invalidateParent(this);
};

SubData.prototype.setClassNames = function(classNames){
    this.classNames = classNames;
    invalidateParent(this);
};
SubData.prototype.setClassNamesString = function(classNamesString){
    if(!classNamesString)
        this.setClassNames([]);
    else{
        var array = classNamesString.split(/\s+/);
        var i = array.length;
        while(i--) array[i] = array[i].trim();
        this.setClassNames(array);
    }
};


SubData.prototype.setPostDataflow = function(postDataflow){
    this.postDataflow = postDataflow;
    invalidateParent(this);
};

SubData.prototype.setPostCompute = function(postCompute){
    this.postCompute = postCompute;
    invalidateParent(this);
};

SubData.prototype.setPostFilter = function(postFilter){
    this.postFilter = postFilter;
    invalidateParent(this);
};

SubData.prototype.setIncludes = function(includes){
    this.includes = includes;
    invalidateParent(this);
};

SubData.prototype.setShader = function(shader){
    this.shader = shader;
    invalidateParent(this);
};

SubData.prototype.setTransform = function(transform){
    this.transform = transform;
    invalidateParent(this);
};

SubData.prototype.setMeshType = function(meshType){
    this.meshType = meshType;
    invalidateParent(this);
};

function invalidateParent(subData){
    if(subData.assetParent){
        invalidateAsset(subData.assetParent);
    }
}

//----------------------------------------------------------------------------------------------------------------------
// AssetResult
//----------------------------------------------------------------------------------------------------------------------

var AssetResult = function(){
    this.parentResult = null;
    this.name = null;
    this.namedEntries = {};
    this.allEntries = [];
    this.matchEntries = [];
    this.namedSubResults = {};
    this.allSubResults = [];

    this.shader = null;
    this.transform = null;
    this.pickFilter = null;
};

AssetResult.prototype.construct = function(asset){
    constructAssetTable(this, asset);
};

AssetResult.prototype.dispose = function() {
    for (var i = 0; i < this.allEntries.length; i++) {
        this.allEntries[i].dispose();
    }

    for (var i = 0; i < this.allSubResults.length; i++) {
        this.allSubResults[i].dispose();
    }
};

AssetResult.prototype.getDataTree = function(){
    return rec_getDataTree(this);
};


function constructAssetTable(table, asset){
    table.name = asset.name;

    var srcAsset = asset.srcAsset, srcResult = srcAsset && srcAsset.getResult();
    if(srcResult){
        copySrcTable(table, srcAsset.getResult(), asset.pickFilter);
    }
    else
        table.pickFilter = asset.pickFilter;

    if(asset.shader) table.shader = asset.shader;
    if(asset.transform) table.transform = combineTransform(table.transform, asset.transform);


    var subAssets = asset.subAssets;
    var i = subAssets.length;
    while(i--){
        var result = subAssets[i].getResult();
        mergeSubAssetResult(table, result);
    }
    var matchChildren = [];
    var children = asset.children;
    for(var i = 0; i < children.length; ++i){
        var child = children[i];
        var name = child.name;
        var entry;
        if(child.name && child.matchFilter){
            XML3D.debug.logWarning("Asset entry defines both name and match attribute. Match attribute will be ignored", child.refNode);
        }
        if(name){
            if(!table.namedEntries[name]){
                entry = new AssetTableEntry(child);
                applyMatchEntries(entry, table.matchEntries);
                table.namedEntries[name] = entry;
                table.allEntries.push(entry);
            }
            else
                entry = table.namedEntries[name];
        }
        else if(child.matchFilter){
            matchChildren.push(child);
            continue;
        }
        else{
            entry = new AssetTableEntry(child);
            applyMatchEntries(entry, table.matchEntries);
            table.allEntries.push(entry);
        }
        entry.pushPostEntry(child);
    }
    for(var i = 0; i < matchChildren.length; ++i){
        var child = matchChildren[i];
        var matchEntry = {filter: child.matchFilter, subdata: child};
        table.matchEntries.push(matchEntry);
        for(var j = 0; j < table.allEntries.length; ++j){
            applyMatchEntry(table.allEntries[j], matchEntry);
        }
    }
}

function applyMatchEntries(destEntry, matchEntries){
    for(var i = 0; i < matchEntries.length; ++i){
        applyMatchEntry(destEntry, matchEntries[i]);
    }
}

function applyMatchEntry(destEntry, matchEntry){
    var child = matchEntry.subdata;
    if(child.isMesh() == destEntry.isMesh() && matchEntry.filter.check(destEntry)){
        destEntry.pushPostEntry(child);
    }
}


function copySrcTable(table, srcTable, pickFilter){

    if(srcTable.matchEntries.length > 0){
        var i = table.allEntries.length;
        while(i--){
            var entry = table.allEntries[i];
            if(!entry.name || !srcTable.namedEntries[entry.name]){
                applyMatchEntries(entry, srcTable.matchEntries);
            }
        }
    }

    var i = srcTable.allEntries.length;
    while(i--){
        var srcEntry = srcTable.allEntries[i];
        var destEntry, newlyCreated = false;
        if(srcEntry.name && table.namedEntries[srcEntry.name]){
            destEntry = table.namedEntries[srcEntry.name];
        }
        else{
            destEntry = new AssetTableEntry();
            newlyCreated = true;
            table.allEntries.push(destEntry);
        }
        destEntry.pushTableEntry(srcEntry);
        if(newlyCreated)
            applyMatchEntries(destEntry, table.matchEntries);

        if(destEntry.name) table.namedEntries[destEntry.name] = destEntry;
    }

    table.matchEntries.push.apply(table.matchEntries, srcTable.matchEntries);


    var i = srcTable.allSubResults.length;
    while(i--){
        mergeSubAssetResult(table, srcTable.allSubResults[i]);
    }

    if(pickFilter && srcTable.pickFilter){
        table.pickFilter = new AssetPickFilter();
        table.pickFilter.intersection(pickFilter, srcTable.pickFilter);
    }
    else{
        table.pickFilter = pickFilter || srcTable.pickFilter;
    }
    if(srcTable.shader) table.shader = srcTable.shader;
    if(srcTable.transform) table.transform = combineTransform(table.transform, srcTable.transform);
}


function mergeSubAssetResult(table, srcSubTable){
    var destSubTable;
    if(srcSubTable.name && table.namedSubResults[srcSubTable.name]){
        destSubTable = table.namedSubResults[srcSubTable.name];
    }
    else{
        destSubTable = new AssetResult();
        destSubTable.parentResult = table;
        destSubTable.name = srcSubTable.name;
        table.allSubResults.push(destSubTable);
        if(destSubTable.name) table.namedSubResults[destSubTable.name] = destSubTable;
    }
    copySrcTable(destSubTable, srcSubTable, destSubTable.pickFilter);
}

function rec_getDataTree(table){
    var node = {
        meshes: [],
        groups: [],
        transform: table.transform,
        shader: table.shader,
        postTransformXflowNode: null
    };

    for(var i = 0; i < table.allEntries.length; ++i){
        var entry = table.allEntries[i];
        if(entry.meshType && (!table.pickFilter || table.pickFilter.check(entry)) ){
            updateAccumulatedNode(table, entry);
            node.meshes.push({
                xflowNode: entry.accumulatedXflowNode,
                type: entry.meshType,
                shader: entry.shader,
                transform: entry.transform,
                refNode: entry.refNode
            });
        }
    }
    var postTransformEntry = table.namedEntries["_postTransform"];
    if(postTransformEntry){
        updateAccumulatedNode(table, postTransformEntry);
        node.postTransformXflowNode = postTransformEntry.accumulatedXflowNode;
    }
    for(var i = 0; i < table.allSubResults.length; ++i){
        var subNode = rec_getDataTree(table.allSubResults[i]);
        node.groups.push(subNode);
    }
    return node;
}

function updateAccumulatedNode(table, entry){
    if(!entry.outOfSync)
        return;

    if(entry.accumulatedXflowNode){
        entry.accumulatedXflowNode.clearChildren();
        entry.accumulatedXflowNode.setCompute("");
        entry.accumulatedXflowNode.setFilter("");
        entry.accumulatedXflowNode.dataflowNode = null;
        entry.accumulatedXflowNode.setLoading(false);
    }
    else{
        entry.accumulatedXflowNode = new AssetDataNode(false);
    }

    var dataNode = entry.postQueue.length == 1 ? entry.accumulatedXflowNode : new AssetDataNode(false);
    for(var i = 0; i < entry.postQueue.length; ++i){
        var includes = entry.postQueue[i].includes;
        for(var j = 0; j < includes.length; ++j){
            var addEntry = getIncludeEntry(table, includes[j]);
            dataNode.appendChild(addEntry.accumulatedXflowNode);
        }
        if(entry.postQueue[i].xflowNode)
            dataNode.appendChild(entry.postQueue[i].xflowNode);
    }
    var node = dataNode, parentNode = null;
    for(var i = 0; i < entry.postQueue.length; ++i){
        var postEntry = entry.postQueue[i];
        if(!node) node = (i == entry.postQueue.length - 1 ? entry.accumulatedXflowNode : new AssetDataNode(false));
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


var c_accum_entries = [],
    c_accum_names = [];

function getIncludeEntry(table, includeString){
    var segments = includeString.split(".");
    for(var i = 0; i < segments.length -1; ++i){
        var seg = segments[i];
        if(seg == "parent"){
            if(!table.parentResult)
                throw new Error("Includes entry '" + includeString + "' (token "+ i +") accesses non existent parent.");
            table = table.parentResult;
        }
        else{
            if(!table.namedSubResults[seg])
                throw new Error("Includes entry '" + includeString + "' (token "+ i +") accesses non existent sub result '" + seg + "'");
            table = table.namedSubResults[seg];
        }
    }
    var entryKey = segments[segments.length - 1];
    var entry = table.namedEntries[entryKey];
    if(!entry){
        throw new Error("Includes entry '" + includeString + "' accesses non existent asset entry '" + entryKey + "'" );
    }

    c_accum_names.push(includeString);
    if(c_accum_entries.indexOf(entry) != -1){
        var path = c_accum_names.join(" > ");
        throw new Error("Recursive include dependencies detected: " + path);
    }
    c_accum_entries.push(entry);

    updateAccumulatedNode(table, entry);
    c_accum_entries.pop();
    c_accum_names.pop();
    return entry;
}




function AssetTableEntry (subData){
    this.name = null;
    this.classNames = [];
    this.meshType = null;

    this.postQueue = [];
    this.shader = null;
    this.transform = null;

    this.accumulatedXflowNode = null;
    this.outOfSync = true;
    this.refNode = null;
    if(subData){
        this.name = subData.name;
        Set.add(this.classNames, subData.classNames);
    }
}

AssetTableEntry.prototype.isMesh = function(){
    return !!this.meshType;
};

/**
 * Clears child<->parent relationships for all Xflow nodes that were created for this Asset instance specifically (eg through overrides)
 */
AssetTableEntry.prototype.dispose = function() {
    clearAssetRelatedChildren(this.accumulatedXflowNode);
    this.accumulatedXflowNode.clearChildren();
};

/**
 * This function clears parent->child and dataFlowNode relationships for all xflow nodes
 * that were generated for the AssetTableEntry that it's called from initially. It won't clear
 * relationships for any normal DataNodes that are part of non-asset-related Xflow graphs (ie. dataflow graphs)
 * @param dataNode
 */
function clearAssetRelatedChildren(dataNode) {
    if (dataNode._children === undefined) {
        return; //Input leaf node, nothing to do here
    }
    for (var i = 0; i < dataNode._children.length; i++) {
        clearAssetRelatedChildren(dataNode._children[i]);
    }
    if (dataNode.isAssetDataNode) {
        dataNode.clearChildren();
        dataNode._channelNode.setStructureOutOfSync();
    }
}


AssetTableEntry.prototype.pushTableEntry = function(srcEntry){
    this.name = srcEntry.name;
    Set.add(this.classNames, srcEntry.classNames);
    if(srcEntry.meshType) this.meshType = srcEntry.meshType;

    if(srcEntry.transform) this.transform = combineTransform(this.transform, srcEntry.transform);
    if(srcEntry.shader) this.shader = srcEntry.shader;

    this.postQueue.push.apply(this.postQueue, srcEntry.postQueue);
};


AssetTableEntry.prototype.pushPostEntry = function(subData){
    this.name = subData.name;
    this.postQueue.push({
        dataflow: subData.postDataflow,
        dataflowLoading: subData.loading,
        compute: subData.postCompute,
        filter: subData.postFilter,
        includes: subData.includes,
        xflowNode: subData.xflowNodeIn
    });
    this.refNode = subData.refNode;
    this.accumulatedXflowNode = subData.xflowNodeOut;
    Set.add(this.classNames, subData.classNames);
    if(subData.meshType) this.meshType = subData.meshType;
    if(subData.shader) this.shader = subData.shader;
    if(subData.transform) this.transform = combineTransform(this.transform, subData.transform);
};


function combineTransform(oldTransform, newTransform){
    // TODO: Better multiply transformations here
    return newTransform;
}


function AssetPickFilter(){
    this.all = false;
    this.names = [];
    this.classNames = [];
}

AssetPickFilter.prototype.parse = function(string){
    var entries = string.split(",");
    var i = entries.length;
    while(i--){
        var entry = entries[i].trim();
        if(entry == "*"){
            this.all = true;
        }
        else if(entry.indexOf(".") == 0){
            var classNames = entry.split(".");
            var j = classNames.length;
            while(j--){
                if(!classNames[j].trim())
                    classNames.splice(j,1);
            }
            this.classNames.push(classNames);
        }
        else{
            Set.add(this.names, entry);
        }
    }
};

AssetPickFilter.prototype.intersection = function(setA, setB){
    Set.intersection(this.names, setA.names, setB.names);
    Set.intersection(this.classNames, setA.classNames, setB.classNames);
};

AssetPickFilter.prototype.check = function(entry){
    if(this.all)
        return true;
    if(entry.classNames.length > 0){
        var i = this.classNames.length;
        while(i--){
            if(Set.isSubset(this.classNames[i], entry.classNames))
                return true;
        }
    }
    return (entry.name && this.names.indexOf(entry.name) != -1);
};

/**
 * This is just a small wrapper to identify Xflow nodes that were created by an Asset, eg as part of overrides
 * that need to be cleaned up later if the corresponding model tag is destroyed
 * @param isDataFlow
 * @constructor
 */
var AssetDataNode = function(isDataFlow) {
    DataNode.call(this, isDataFlow);
    this.isAssetDataNode = true;
};

Base.createClass(AssetDataNode, DataNode);

module.exports = {
    Asset: Asset,
    SubData: SubData,
    AssetResult: AssetResult
};
