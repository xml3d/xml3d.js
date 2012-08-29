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

/**
 * @constructor
 * @extends {Xflow.Mapping}
 */
var NameMapping = function(owner){
    Xflow.Mapping.call(this, owner);
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

})();