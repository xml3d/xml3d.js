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

    platform = data['platform'];

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

    if (platform && !opCollection.hasOwnProperty(platform)) {
        opCollection[platform] = data;
    } else if (!platform) {
        opCollection[Xflow.PLATFORM.JAVASCRIPT] = data;
    }

};

Xflow.initAnonymousOperator = function(data){
    initOperator(data);
    data.name = "Anonymous Operator";
    return data;
}

Xflow.getOperator = function(name, platform){
    platform = platform || Xflow.PLATFORM.JAVASCRIPT;

    if (name && !operators[name]) {
        return null;
    }

    if(!operators[name][platform]) {
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
    operator.platform = operator.platform || Xflow.PLATFORM.JAVASCRIPT;
}

})();
