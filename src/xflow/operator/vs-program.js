(function(){

//----------------------------------------------------------------------------------------------------------------------
// Xflow.OperatorList
//----------------------------------------------------------------------------------------------------------------------

    var c_SHADER_CONSTANT_TYPES = {}
    c_SHADER_CONSTANT_TYPES[Xflow.SHADER_CONSTANT_KEY.OBJECT_ID] = 'int';
    c_SHADER_CONSTANT_TYPES[Xflow.SHADER_CONSTANT_KEY.SCREEN_TRANSFORM] = 'mat4';
    c_SHADER_CONSTANT_TYPES[Xflow.SHADER_CONSTANT_KEY.SCREEN_TRANSFORM_NORMAL] = 'mat3';
    c_SHADER_CONSTANT_TYPES[Xflow.SHADER_CONSTANT_KEY.VIEW_TRANSFORM] = 'mat4';
    c_SHADER_CONSTANT_TYPES[Xflow.SHADER_CONSTANT_KEY.VIEW_TRANSFORM_NORMAL] = 'mat3';
    c_SHADER_CONSTANT_TYPES[Xflow.SHADER_CONSTANT_KEY.WORLD_TRANSFORM] = 'mat4';
    c_SHADER_CONSTANT_TYPES[Xflow.SHADER_CONSTANT_KEY.WORLD_TRANSFORM_NORMAL] = 'mat3';

    Xflow.VSProgram = function(operatorList){
        this.list = operatorList;

        this._glslCode = null;
        this._shaderInputNames = [];
        this._shaderOutputNames = [];
        this._inputInfo = {};
        this._outputInfo = {};
        constructVS(this);
    }

    Xflow.VSProgram.prototype.isInputUniform = function(name){
        return this._inputInfo[name].uniform;
    }
    Xflow.VSProgram.prototype.getInputData = function(name, programData){
        return programData.getDataEntry(this._inputInfo[name].index);
    }

    Xflow.VSProgram.prototype.getShaderOutputType = function(name){
        return this._outputInfo[name].type;
    }

    Xflow.VSProgram.prototype.isOutputUniform = function(name){
        return this._outputInfo[name].iteration == Xflow.ITERATION_TYPE.ONE;
    }

    Xflow.VSProgram.prototype.isOutputNull = function(name){
        return this._outputInfo[name].iteration == Xflow.ITERATION_TYPE.NULL;
    }

    Xflow.VSProgram.prototype.getUniformOutputData = function(name, programData){
        return programData.getDataEntry(this._outputInfo[name].index);
    }


    function constructVS(program){
        var operatorList = program.list, entries = operatorList.entries;

        var usedNames = [],
            directInputNames = {},
            transferNames = {};

        var baseEntry = entries[entries.length - 1], acceptedBaseShaderInput = [], baseOperator = baseEntry.operator;
        var vsConfig = baseOperator.vsConfig, outputInputMap = baseOperator.outputInputMap;

        if(!vsConfig)
            throw new Error("Could not find vsConfig! Attempt to create vertex shader programm without VS operator?");

        for(var i = 0; i < entries.length; ++i){
            if(entries[i].blockedNames){
                Xflow.nameset.add(usedNames, entries[i].blockedNames);
            }
        }

        var code = "";
        code += "// GLOBALS\n"
        // Start with Globals
        for(var type in Xflow.shaderConstant){
            var name = Xflow.shaderConstant[type];
            code += "uniform " + c_SHADER_CONSTANT_TYPES[type]  +
                    " " + name + ";\n";
            Xflow.nameset.add(usedNames, name);
        }
        code += "\n";
        code += "// OUTPUT\n"
        // First: collect output names

        for( var i = 0; i < vsConfig._attributes.length; ++i){
            var configAttr = vsConfig._attributes[i],
                inputIndex = outputInputMap[i],
                directInputIndex = baseEntry.getDirectInputIndex(inputIndex);
            var outputInfo = {type: configAttr.type, iteration: 0, index: 0},
                outputName = configAttr.outputName;
            if(vsConfig.isAttributeTransformed(i) ||
                baseEntry.isTransferInput(inputIndex) ||
                operatorList.isInputIterate(directInputIndex))
            {
                acceptedBaseShaderInput[inputIndex] = true;
                outputInfo.iteration = Xflow.ITERATION_TYPE.MANY;

                code += "varying " + getGLSLType(baseOperator.outputs[i].type) + " " + outputName + ";\n";
                Xflow.nameset.add(usedNames, outputName);
                transferNames[baseEntry.getTransferOutputId(i)] = outputName;
            }
            else if(operatorList.isInputUniform(directInputIndex)){
                outputInfo.iteration = Xflow.ITERATION_TYPE.ONE;
                outputInfo.index = directInputIndex;
            }
            else{
                outputInfo.iteration = Xflow.ITERATION_TYPE.NULL;
            }
            Xflow.nameset.add(program._shaderOutputNames, outputName);
            program._outputInfo[outputName] = outputInfo;
        }
        code += "\n";
        code += "// INPUT\n"
        // Second: collect input names
        for(var i = 0; i < entries.length; ++i){
            var entry = entries[i], operator = entry.operator;
            for(var j = 0; j < operator.mapping.length; ++j){
                if( (i < entries.length - 1 || acceptedBaseShaderInput[j]) &&
                        !entry.isTransferInput(j) && !directInputNames[entry.getDirectInputIndex(j)])
                {
                    var mapEntry = operator.mapping[j];
                    var name = getFreeName(mapEntry.name, usedNames), inputIndex = entry.getDirectInputIndex(j),
                        uniform = !operatorList.isInputIterate(inputIndex);
                    program._inputInfo[name] = { index: inputIndex, uniform: uniform };
                    Xflow.nameset.add(program._shaderInputNames, name);
                    directInputNames[inputIndex] = name;

                    code += (uniform ? "uniform " : "attribute ") + getGLSLType(mapEntry.internalType) + " " + name;

                    if(mapEntry.array)
                        code += "[" + operatorList.getInputSize(inputIndex) + "]"

                    code += ";\n";
                }
            }
        }

        // Start main
        code += "\n// CODE\n"
        code += "void main(void){\n";

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

            if(operator.glsl_fragments){
                for(var outputName in program._outputInfo){
                    if(program._outputInfo[outputName].iteration == Xflow.ITERATION_TYPE.MANY)
                        codeFragment += "\n" + operator.glsl_fragments[outputName];
                }
            }

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