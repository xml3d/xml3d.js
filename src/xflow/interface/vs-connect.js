(function(){


Xflow.shaderConstant = {}
Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.OBJECT_ID] = "objectID";
Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.SCREEN_TRANSFORM] = "screenTransform";
Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.SCREEN_TRANSFORM_NORMAL] = "screenTransformNormal";
Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.VIEW_TRANSFORM] = "viewTransform";
Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.VIEW_TRANSFORM_NORMAL] = "viewTransformNormal";
Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.WORLD_TRANSFORM] = "worldTransform";
Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.WORLD_TRANSFORM_NORMAL] = "worldTransformNormal";

Xflow.setShaderConstant = function(type, name){
    Xflow.shaderConstant[type] = name;
}

Xflow.VSConfig = function(){
    this._blockedNames = [];
    this._attributes = [];
};
    
    
Xflow.VSConfig.prototype.addAttribute = function(type, inputName, outputName, optional, transform){
    this._attributes.push({
        type: type,
        inputName: inputName,
        outputName: outputName,
        optional: optional || false,
        transform: transform || Xflow.VS_ATTRIB_TRANSFORM.NONE
    });
}

Xflow.VSConfig.prototype.getAttributeCount = function(){
    return this._attributes.length;
}


Xflow.VSConfig.prototype.getAttribute = function(i){
    return this._attributes[i];
}

Xflow.VSConfig.prototype.isAttributeTransformed = function(i){
    return !!this._attributes[i].transform;
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
        result.push(this._attributes[i].outputName);
    return result;
}
Xflow.VSConfig.prototype.getKey = function(){
    var key = this._blockedNames.join(";");

    for(var i=0; i< this._attributes.length; ++i){
        key += ";" + this._attributes.type + "," + this._attributes.inputName + "," + this._attributes.outputName
            + "," + this._attributes.optional;
    }
    return key;
}

var c_vs_operator_cache = {};

Xflow.VSConfig.prototype.getOperator = function(){
    var key = this.getKey();
    if(c_vs_operator_cache[key])
        return c_vs_operator_cache[key];

    var outputs = [], params = [], glslCode = "\t// VS Connector\n";

    var inputAdded = {}, outputInputMap = [], fragments = {};

    for(var i = 0; i < this._attributes.length; ++i){
        var attr = this._attributes[i];
        var type = Xflow.getTypeName(attr.type);
        outputs.push( { type: type, name: attr.outputName} );
        if(inputAdded[attr.inputName] === undefined){
            var idx = params.length;
            outputInputMap[i] = idx;
            params.push({ type: type, source: attr.inputName, optional: attr.optional} );
            inputAdded[attr.inputName] = idx;
        }
        else{
            outputInputMap[i] = inputAdded[attr.inputName];
        }
        var line = "\t#O{" + attr.outputName + "} = ";

        if(attr.transform && attr.type != Xflow.DATA_TYPE.FLOAT3)
            throw new Error("Xflow VS Shader only supports transformation of float3 values at this point");
        switch(attr.transform){
            case Xflow.VS_ATTRIB_TRANSFORM.VIEW_NORMAL:
                line += "normalize( #G{" + Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.VIEW_TRANSFORM_NORMAL] + "} "
                    + "* #I{" + attr.inputName + "} )"; break;
            case Xflow.VS_ATTRIB_TRANSFORM.VIEW_POINT:
                line += "( #G{" + Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.VIEW_TRANSFORM] + "} "
                    + "* vec4( #I{" + attr.inputName + "} , 1.0)).xyz;"; break;
            case Xflow.VS_ATTRIB_TRANSFORM.WORLD_NORMAL:
                line += "normalize( #G{" + Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.WORLD_TRANSFORM_NORMAL] + "} "
                    + "* #I{" + attr.inputName + "} );"; break;
            case Xflow.VS_ATTRIB_TRANSFORM.WORLD_POINT:
                line += "( #G{" + Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.WORLD_TRANSFORM] + "} "
                    + "* vec4( #I{" + attr.inputName + "} , 1.0)).xyz;"; break;
            default:
                line += "#I{" + attr.inputName + "};";
        }
        fragments[attr.outputName] = line;
    }

    if(!inputAdded["position"]){

    }

    glslCode += "\tgl_Position = #G{" + Xflow.shaderConstant[Xflow.SHADER_CONSTANT_KEY.SCREEN_TRANSFORM]
             + "} * vec4(#I{position}, 1.0);\n";

    var operator = Xflow.initAnonymousOperator({
        outputs: outputs,
        params:  params,
        evaluate_glsl: glslCode,
        glsl_fragments: fragments,
        blockedNames: this._blockedNames,
        vsConfig: this,
        outputInputMap: outputInputMap
    });

    c_vs_operator_cache[key] = operator;

    return operator;
}

Xflow.VSConfig.prototype.setInputMapping = function(orderMapping){
    var inputAdded = {};
    for(var i = 0; i < this._attributes.length; ++i){
        var name = this._attributes[i].inputName;
        if(!inputAdded[name]){
            orderMapping.setName(i, name);
            inputAdded[name] = true;
        }

    }
}
Xflow.VSConfig.prototype.setOutputMapping = function(orderMapping){
    for(var i = 0; i < this._attributes.length; ++i){
        orderMapping.setName(i, this._attributes[i].outputName);
    }
}



}());