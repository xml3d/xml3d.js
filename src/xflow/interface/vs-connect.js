(function(){


Xflow.shaderConstant = {}

Xflow.setShaderConstant = function(type, name){
    Xflow.shaderConstant[type] = name;
}


Xflow.VSConfig = function(){
    this._blockedNames = [];
    this._attributes = [];
};
    
    
Xflow.VSConfig.prototype.addAttribute = function(type, inputName, outputName, optional){
    this._attributes.push({
        type: type,
        inputName: inputName,
        outputName: outputName,
        optional: optional
    });
}

Xflow.VSConfig.prototype.getAttributeCount = function(){
    return this._attributes.length;
}


Xflow.VSConfig.prototype.getAttribute = function(i){
    return this._attributes[i];
}

Xflow.VSConfig.prototype.addBlockedName = function(name){
    this._blockedNames.push(name);
}

Xflow.VSConfig.prototype.getBlockedNames = function(){
    return this._blockedNames;
}

Xflow.VSConfig.prototype.getFilter = function(){
    var result = [];
    for(var i = 0; i < this._attributes.length; ++i)
        result[this._attributes[i].inputName];
    return result;
}
Xflow.VSConfig.prototype.getKey = function(){
    var key = this._blockedNames.join(";");

    for(var i=0; i< this._attributes.length; ++i){
        key += ";" + this._attributes.type + "," + this._attributes.inputName + "," + this._attributes.outputName
            + "," + this._attributes.optional;
    }
}

var c_vs_operator_cache = {};

function getXflowTypeFromGLSLType(glslType){
    switch(glslType){
        case Xflow.VS_ATTRIB_TYPE.FLOAT3_VIEW_NORMAL:
        case Xflow.VS_ATTRIB_TYPE.FLOAT3_VIEW_POINT:
        case Xflow.VS_ATTRIB_TYPE.FLOAT3_WORLD_NORMAL:
        case Xflow.VS_ATTRIB_TYPE.FLOAT3_WORLD_POINT: return Xflow.DATA_TYPE.FLOAT3;
        default: return glslType;
    }
}

Xflow.VSConfig.prototype.getOperator = function(){
    var key = this.getKey();
    if(c_vs_operator_cache[key])
        return c_vs_operator_cache[key];

    var outputs = [], params = [], glslCode = "\t// VS Connector\n";

    var inputAdded = {};

    for(var i = 0; i < this._attributes.length; ++i){
        var attr = this._attributes[i];
        var type = Xflow.getTypeName(getXflowTypeFromGLSLType(attr.type));
        outputs.push( { type: type, name: attr.outputName} );
        if(!inputAdded[attr.inputName]){
            params.push({ type: type, source: attr.inputName, optional: attr.optional} );
            inputAdded[attr.inputName] = true;
        }
        var line = "\t#O{" + attr.outputName + "} = ";
        switch(attr.type){
            case Xflow.VS_ATTRIB_TYPE.FLOAT3_VIEW_NORMAL:
                line += "( #G{" + Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.VIEW_TRANSFORM_NORMAL] + "} "
                    + "* vec4( #I{" + attr.inputName + "} , 0.0)).xyz;"; break;
            case Xflow.VS_ATTRIB_TYPE.FLOAT3_VIEW_POINT:
                line += "( #G{" + Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.VIEW_TRANSFORM] + "} "
                    + "* vec4( #I{" + attr.inputName + "} , 1.0)).xyz;"; break;
            case Xflow.VS_ATTRIB_TYPE.FLOAT3_WORLD_NORMAL:
                line += "( #G{" + Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.WORLD_TRANSFORM_NORMAL] + "} "
                    + "* vec4( #I{" + attr.inputName + "} , 0.0)).xyz;"; break;
            case Xflow.VS_ATTRIB_TYPE.FLOAT3_WORLD_POINT:
                line += "( #G{" + Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.WORLD_TRANSFORM] + "} "
                    + "* vec4( #I{" + attr.inputName + "} , 1.0)).xyz;"; break;
            default:
                line += "#I{" + attr.inputName + "};";
        }
        glslCode += line + "\n";
    }

    glslCode += "\tgl_Position = #G{" + Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.SCREEN_TRANSFORM]
             + "} * vec4(#I{position), 1.0);\n";

    var operator = Xflow.initAnonymousOperator({
        outputs: [  {type: 'float3', name: 'result'}],
        params:  [  {type: 'float3', source: 'value1'},
            {type: 'float3', source: 'value2'}],
        evaluate_glsl: glslCode,
        blockedNames: this._blockedNames
    });

    c_vs_operator_cache[key] = operator;

    return operator;
}

Xflow.VSConfig.prototype.setInputMapping = function(orderMapping){
    for(var i = 0; i < this._attributes.length; ++i){
        orderMapping.setName(i, this._attributes[i].inputName);
    }
}
Xflow.VSConfig.prototype.setOutputMapping = function(orderMapping){
    for(var i = 0; i < this._attributes.length; ++i){
        orderMapping.setName(i, this._attributes[i].outputName);
    }
}



}());