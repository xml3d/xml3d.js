(function(){

//----------------------------------------------------------------------------------------------------------------------
// Xflow.registerOperator && Xflow.getOperator
//----------------------------------------------------------------------------------------------------------------------

var operators = {};

    /**
     * Registers Xflow operator.
     * The operators are stored in collections using their platform as a key. If no platform is defined, the operator
     * will be registered as a JavaScript-based operator.
     *
     * @param name
     * @param data
     */

Xflow.registerOperator = function(name, data){
    var opCollection, platform;

    initOperator(data);
    if(!operators[name]) {
        operators[name] = {};
    }

    platform = data['platform'] || Xflow.PLATFORM.JAVASCRIPT;

    opCollection = operators[name];

    if (!name) {
        XML3D.logWarning("Xflow.registerOperator: Operator name undefined.");
        return;
    }

    if (!data) {
        XML3D.logWarning("Xflow.registerOperator: Operator data undefined.");
        return;
    }

    data.name = name;
    if(!opCollection[platform])
        opCollection[platform] = [];

    opCollection[platform].push(data);
};

Xflow.initAnonymousOperator = function(name, data){
    initOperator(data);
    data.name = name;
    return data;
}

Xflow.getOperators = function(name, platform){
    platform = platform || Xflow.PLATFORM.JAVASCRIPT;

    if (name && !operators[name]) {
        return null;
    }

    if(!operators[name][platform] || operators[name][platform].length == 0) {
        return null;
    }

    return operators[name][platform];
};

function initOperator(operator){
    var indexMap = {};
    // Init types of outputs and params
    for(var i= 0; i < operator.outputs.length; ++i){
        operator.outputs[i].type = Xflow.DATA_TYPE_MAP[operator.outputs[i].type];
    }
    for(var i= 0; i < operator.params.length; ++i){
        operator.params[i].type = Xflow.DATA_TYPE_MAP[operator.params[i].type];
        indexMap[operator.params[i].source] = i;
    }
    if(!operator.mapping)
        operator.mapping = operator.params;

    // Init interTypes of mapping
    for(var i = 0; i < operator.mapping.length; ++i){
        var mapping = operator.mapping[i];
        var paramIdx = indexMap[mapping.source];
        mapping.paramIdx = paramIdx;
        var type = operator.params[paramIdx].type;
        if(mapping.sequence)
            mapping.keyParamIdx = indexMap[mapping.keySource];
        if(mapping.sequence == Xflow.SEQUENCE.LINEAR_WEIGHT)
            type = Xflow.DATA_TYPE.FLOAT;
        mapping.internalType = type;
        mapping.name = mapping.name || mapping.source;
    }

    //Check/init platform
    operator.platform = operator.platform || Xflow.PLATFORM.JAVASCRIPT;
}

})();
