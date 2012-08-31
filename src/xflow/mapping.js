(function(){

/**
 * @constructor
 * @param {Xflow.DataNode} owner
 */
var Mapping = function(owner){
    this._owner = owner;
};
Xflow.Mapping = Mapping;

/**
 * @constructor
 * @extends {Xflow.Mapping}
 */
var OrderMapping = function(owner){
    Xflow.Mapping.call(this, owner);
    this._names = [];
};
XML3D.createClass(OrderMapping, Xflow.Mapping);
Xflow.OrderMapping = OrderMapping;


Object.defineProperty(OrderMapping.prototype, "length", {
    set: function(v){ throw "length is read-only";
    },
    get: function(){ return this._name.length; }
});

OrderMapping.prototype.getName = function(idx){
    return this._names[idx];
};

OrderMapping.prototype.clear = function(){
    this._names = [];
    mappingNotifyOwner(this);
};

OrderMapping.prototype.setName = function(index, name){
    this._names[index] = name;
    mappingNotifyOwner(this);
};

OrderMapping.prototype.removeName = function(index){
    this._names.splice(index);
    mappingNotifyOwner(this);
};

OrderMapping.prototype.isEmpty = function(){
    return this._names.length == 0;
}

/**
 * @constructor
 * @extends {Xflow.Mapping}
 */
var NameMapping = function(owner){
    Xflow.Mapping.call(this, owner);
    this._destNames = [];
    this._srcNames = [];

};
XML3D.createClass(NameMapping, Xflow.Mapping);
Xflow.NameMapping = NameMapping;

Object.defineProperty(NameMapping.prototype, "length", {
    set: function(v){ throw "length is read-only";
    },
    get: function(){ return this._srcNames.length; }
});

NameMapping.prototype.getDestName = function(idx){
    return this._destNames[idx];
};
NameMapping.prototype.getSrcName = function(idx){
    return this._srcNames[idx];
};

NameMapping.prototype.getSrcNameFromDestName = function(destName){
    var idx = this._destNames.indexOf(destName);
    return idx == -1 ? null : this._srcNames[idx];
};

NameMapping.prototype.clear = function(){
    this._srcNames = [];
    this._destNames = [];
    mappingNotifyOwner(this);
};

NameMapping.prototype.setNamePair = function(destName, srcName){
    var idx = this._destNames.indexOf(destName);
    if(idx != -1){
        this._destNames.splice(idx,1);
        this._srcNames.splice(idx,1);
    }
    this._destNames.push(destName);
    this._srcNames.push(srcName);
    mappingNotifyOwner(this);
};

NameMapping.prototype.removeNamePair = function(destName){
    var idx = this._destNames.indexOf(destName);
    if(idx != -1){
        this._destNames.splice(idx,1);
        this._srcNames.splice(idx,1);
    }
    mappingNotifyOwner(this);
};

NameMapping.prototype.isEmpty = function(){
    return this._destNames.length == 0;
}

var orderMappingParser = /^([^:,{}]+)(,[^:{},]+)*$/;
var nameMappingParser = /^\{(([^:,{}]+:[^:{},]+)(,[^:{},]+:[^:},]+)*)\}$/;

Mapping.parse = function(string, dataNode){
    string = string.trim()
    var results = string.trim().match(orderMappingParser);
    if(results)
        return OrderMapping.parse(string, dataNode);
    results = string.trim().match(nameMappingParser);
    if(results)
        return NameMapping.parse(results[1], dataNode);
    return null;
}

OrderMapping.parse = function(string, dataNode){
    var mapping = new Xflow.OrderMapping(dataNode)
    var token = string.split(",");
    for(var i = 0; i < token.length; i++){
        mapping._names.push(token[i].trim());
    }
    return mapping;
}

NameMapping.parse = function(string, dataNode)
{
    var mapping = new Xflow.NameMapping(dataNode)
    var token = string.split(",");
    for(var i = 0; i < token.length; i++){
        var pair = token[i].split(":");
        var dest = pair[0].trim(); var src = pair[1].trim();
        mapping.setNamePair(dest, src);
    }
    return mapping;
}

function mappingNotifyOwner(mapping){
    if(mapping._owner)
        mapping._owner.notify(XflowModification.STRUCTURE_CHANGED);
};

OrderMapping.prototype.filterNameset = function(nameset, filterType)
{
    if(filterType == Xflow.DataNode.FILTER_TYPE.RENAME)
        return nameset.splice();
    else {
        var keep = (filterType == Xflow.DataNode.FILTER_TYPE.KEEP);
        var result = [];
        for(var i in nameset){
            var idx = this._names.indexOf(nameset[i]);
            if( (keep && idx!= -1) || (!keep && idx == -1) )
                result.push(nameset[i]);
        }
        return result;
    }
}
NameMapping.prototype.filterNameset = function(nameset, filterType)
{

}

OrderMapping.prototype.applyFilterOnMap = function(destMap, sourceMap, filterType){
    for(var i in sourceMap){
        var idx = this._names.indexOf(i);
        if(filterType == Xflow.DataNode.FILTER_TYPE.RENAME ||
           ( filterType == Xflow.DataNode.FILTER_TYPE.KEEP && idx != -1) ||
            (filterType == Xflow.DataNode.FILTER_TYPE.REMOVE && idx == -1))
            destMap[i] = sourceMap[i];
    }
};
OrderMapping.prototype.getScriptInputName = function(index, destName){
    if(this._names[index])
        return this._names[index];
    else
        return destName;
};
OrderMapping.prototype.applyScriptOutputOnMap = function(destMap, sourceMap){
    var index = 0;
    for(var i in sourceMap){
        if(index < this._names.length){
            destMap[this._names[index]] = sourceMap[i];
            ++index;
        }
        else
            break;
    }
};

NameMapping.prototype.applyFilterOnMap = function(destMap, sourceMap, filterType)
{
    if(filterType == Xflow.DataNode.FILTER_TYPE.REMOVE){
        for(var i in sourceMap)
            if(this._srcNames.indexOf(i) == -1)
                destMap[i] = sourceMap[i];
    }
    else{
        if(filterType == Xflow.DataNode.FILTER_TYPE.RENAME){
            for(var i in sourceMap)
                if(this._srcNames.indexOf(i) == -1)
                    destMap[i] = sourceMap[i];
        }
        for(var i in this._destNames){
            destMap[this._destNames[i]] = sourceMap[this._srcNames[i]]
        }
    }
};

NameMapping.prototype.getScriptInputName= function(index, destName){
    var srcName = this.getSrcNameFromDestName(destName);
    return srcName ? srcName : destName;
}


NameMapping.prototype.applyScriptOutputOnMap= function(destMap, sourceMap){
    for(var i in this._destNames){
        var destName = this._destNames[i], srcName = this._srcNames[i];
        destMap[destName] = sourceMap[srcName];
    }
}

})();