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
    this._orderMapping = true;
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
    this._nameMapping = true;
    this._names = [];
    this._mappedNames = {};
};
XML3D.createClass(NameMapping, Xflow.Mapping);
Xflow.NameMapping = NameMapping;

Object.defineProperty(NameMapping.prototype, "length", {
    set: function(v){ throw "length is read-only";
    },
    get: function(){ return this._name.length; }
});

NameMapping.prototype.getDestName = function(idx){
    return this._names[idx];
};

NameMapping.prototype.getSrcName = function(destName){
    return this._mappedNames[destName];
};

NameMapping.prototype.clear = function(){
    this._names = [];
    this._mappedNames = {};
    mappingNotifyOwner(this);
};

NameMapping.prototype.setNamePair = function(destName, srcName){
    this._names.push(destName);
    this._mappedNames[destName] = srcName;
    mappingNotifyOwner(this);
};

NameMapping.prototype.removeNamePair = function(destName){
    Array.erase(this._names, destName)
    delete this._mappedNames[destName];
    mappingNotifyOwner(this);
};

NameMapping.prototype.isEmpty = function(){
    return this._names.length == 0;
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
        mapping._names.push(dest);
        mapping._mappedNames[dest] = src;
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
}
NameMapping.prototype.applyFilterOnMap = function(destMap, sourceMap, filterType){
    var tmp = {};
    if(filterType == Xflow.DataNode.FILTER_TYPE.REMOVE){
        for(var i in sourceMap)
            tmp[i] = sourceMap[i];
        for(var i in this._mappedNames){
            delete tmp[this._mappedNames[i]];
        }
    }
    else{
        for(var destName in this._mappedNames){
            tmp[destName] = sourceMap[this._mappedNames[destName]]
        }
        if(filterType == Xflow.DataNode.FILTER_TYPE.KEEP){
            for(var i in sourceMap)
                tmp[i] = tmp[i] || sourceMap[i];
        }
    }
    for(var i in tmp)
        destMap[i] = tmp[i];
}

})();