(function(){

//----------------------------------------------------------------------------------------------------------------------
// Xflow.OperatorList
//----------------------------------------------------------------------------------------------------------------------


    Xflow.VSProgram = function(operatorList){
        this.list = operatorList;

        this._glslCode = null;
        this._shaderInputNames = [];
        this._shaderOutputNames = [];
        this._inputIndices = [];
        constructVS(this);
    }


    function constructVS(program){
        var operatorList = program.list, entries = operatorList.entries;

        var usedNames = [],
            directInputNames = {},
            transferNames = {};

        for(var i = 0; i < entries.length; ++i){
            if(entries[i].blockedNames){
                Xflow.nameset.add(usedNames, entries[i].blockedNames);
            }
        }

        var code = "#version 140 \n\n";

        // Start with Globals
        for(var type in Xflow.shaderConstant){
            var name = Xflow.shaderConstant[type];
            code += "uniform " + (type == Xflow.SHADER_CONSTANT_KEY.OBJECT_ID ? 'float' : 'mat4')  +
                    " " + name + ";\n";
            Xflow.nameset.add(usedNames, name);
        }
        code += "\n";

        // First: collect output names
        for( var i = 0; i < entries.length; ++i){
            var entry = entries[i], operator = entry.operator;
            for(var j = 0; j < operator.outputs.length; ++j){
                if(entry.isFinalOutput(j)){
                    var name = operator.outputs[j].name;
                    code += "out " + getGLSLType(operator.outputs[j].type) + " " + name + ";\n";
                    Xflow.nameset.add(usedNames, name);
                    Xflow.nameset.add(program._shaderOutputNames, name);
                    transferNames[entry.getTransferOutputId(j)] = name;
                }
            }
        }
        code += "\n";

        // Second: collect input names
        for(var i = 0; i < entries.length; ++i){
            var entry = entries[i], operator = entry.operator;
            for(var j = 0; j < operator.mapping.length; ++j){
                if(!entry.isTransferInput(j) && !directInputNames[entry.getDirectInputIndex(j)]){
                    var mapEntry = operator.mapping[j];
                    var name = getFreeName(mapEntry.name, usedNames), inputIndex = entry.getDirectInputIndex(j),
                        uniform = !operatorList.isInputIterate(inputIndex);
                    program._inputIndices[name] = { index: inputIndex, uniform: uniform };
                    Xflow.nameset.add(program._shaderInputNames, name);
                    directInputNames[inputIndex] = name;

                    code += (uniform ? "uniform " : "in ") + getGLSLType(mapEntry.internalType) + " " + name;

                    if(mapEntry.array)
                        code += "[" + operatorList.getInputSize(inputIndex) + "]"

                    code += ";\n";
                }
            }
        }

        // Start main
        code += "\n" + "void main(void){\n";

        // Create Code
        for(var i = 0; i < entries.length; ++i){
            var entry = entries[i], operator = entry.operator;
            // Declare transfer output names
            for(var j = 0; j < operator.outputs.length; ++j){
                if(!entry.isFinalOutput(j)){
                    var name = getFreeName(operator.outputs[j].name, usedNames);
                    transferNames[entry.getTransferOutputId(j)] = name;
                    code += "\t" + getGLSLType(operator.outputs[j].type) + " " + name + ";\n";
                }
            }
            // Take Code Fragment
            var codeFragment = operator.evaluate_glsl, index;
            while((index = codeFragment.indexOf("#I{")) != -1){
                var end = codeFragment.indexOf("}",index);
                var mappingIndex = getMappingIndex(operator, codeFragment.substring(index+3,end));
                var replaceName = entry.isTransferInput(mappingIndex) ?
                    transferNames[entry.getTransferInputId(mappingIndex)] :
                    directInputNames[entry.getDirectInputIndex(mappingIndex)];
                codeFragment = codeFragment.substring(0, index) + replaceName + codeFragment.substring(end+1);
            }
            while((index = codeFragment.indexOf("#O{")) != -1){
                var end = codeFragment.indexOf("}",index);
                var outputIndex = getOutputIndex(operator, codeFragment.substring(index+3,end));
                var replaceName = transferNames[entry.getTransferOutputId(outputIndex)];
                codeFragment = codeFragment.substring(0, index) + replaceName + codeFragment.substring(end+1);
            }
            var localNames = [];
            while((index = codeFragment.indexOf("#L{")) != -1){
                var end = codeFragment.indexOf("}",index);
                var key = codeFragment.substring(index+3,end);
                if(!localNames[key]){
                    localNames[key] = getFreeName(key, usedNames);
                }
                var replaceName = localNames[key];
                codeFragment = codeFragment.substring(0, index) + replaceName + codeFragment.substring(end+1);
            }
            while((index = codeFragment.indexOf("#G{")) != -1){
                var end = codeFragment.indexOf("}",index);
                var replaceName = codeFragment.substring(index+3,end);
                codeFragment = codeFragment.substring(0, index) + replaceName + codeFragment.substring(end+1);
            }
            code += codeFragment + "\n";
        }
        code += "}\n";

        program._glslCode = code;
    }

    function getFreeName(name, usedNames){
        var result = name, i = 1;
        while(usedNames.indexOf(result) != -1){
            result = name + "_" + (++i);
        }
        Xflow.nameset.add(usedNames, result);
        return result;
    }

    function getMappingIndex(operator, name){
        for(var i = 0; i < operator.mapping.length; ++i){
            if(operator.mapping[i].name == name)
                return i;
        }
        throw new Error("Invalid input name '" + name  + "' inside of code fragment" );
    }

    function getOutputIndex(operator, name){
        for(var i = 0; i < operator.outputs.length; ++i){
            if(operator.outputs[i].name == name)
                return i;
        }
    }

    function getGLSLType(xflowType){
        switch(xflowType){
            case Xflow.DATA_TYPE.BOOL : return 'bool';
            case Xflow.DATA_TYPE.BYTE : return 'uint';
            case Xflow.DATA_TYPE.FLOAT : return 'float';
            case Xflow.DATA_TYPE.FLOAT2 : return 'vec2';
            case Xflow.DATA_TYPE.FLOAT3 : return 'vec3';
            case Xflow.DATA_TYPE.FLOAT4 : return 'vec4';
            case Xflow.DATA_TYPE.FLOAT4X4 : return 'mat4';
            case Xflow.DATA_TYPE.INT : return 'int';
            case Xflow.DATA_TYPE.INT4 : return 'ivec4';
        }
        throw new Error("Type not supported for GLSL " + Xflow.getTypeName(xflowType) );
    }


}());