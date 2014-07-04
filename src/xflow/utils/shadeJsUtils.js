(function(){

    Xflow.shadejs = {};

    Xflow.shadejs.hasSupport = function(){
        return window.Shade !== undefined;
    }

    Xflow.shadejs.convertFromXflow = function(xflowType, source){
        var result = {}
        switch (xflowType) {
            case Xflow.DATA_TYPE.BOOL:
                result.type = Shade.TYPES.BOOLEAN;
                break;
            case Xflow.DATA_TYPE.INT:
                result.type = Shade.TYPES.INT;
                break;
            case Xflow.DATA_TYPE.FLOAT:
                result.type = Shade.TYPES.NUMBER;
                break;
            case Xflow.DATA_TYPE.FLOAT2:
                result.type = Shade.TYPES.OBJECT;
                result.kind = Shade.OBJECT_KINDS.FLOAT2;
                break;
            case Xflow.DATA_TYPE.FLOAT3:
                result.type = Shade.TYPES.OBJECT;
                result.kind = Shade.OBJECT_KINDS.FLOAT3;
                break;
            case Xflow.DATA_TYPE.FLOAT4:
                result.type = Shade.TYPES.OBJECT;
                result.kind = Shade.OBJECT_KINDS.FLOAT4;
                break;
            case Xflow.DATA_TYPE.FLOAT3X3:
                result.type = Shade.TYPES.OBJECT;
                result.kind = Shade.OBJECT_KINDS.MATRIX3;
                break;
            case Xflow.DATA_TYPE.FLOAT4X4:
                result.type = Shade.TYPES.OBJECT;
                result.kind = Shade.OBJECT_KINDS.MATRIX4;
                break;
            case Xflow.DATA_TYPE.TEXTURE:
                result.type = Shade.TYPES.OBJECT;
                result.kind = Shade.OBJECT_KINDS.TEXTURE;
                break;
            case Xflow.DATA_TYPE.UNKNOWN:
            default:
                throw new Error("Unknown Xflow DataType: " + xflowType);
        }
        result.source = source;
        return result;
    }


    Xflow.shadejs.convertOperatorListToSnippets = function(operatorList, startIndex, endIndex){
        var snippetList = new Shade.SnippetList();
        var entries = operatorList.entries;

        if(startIndex === undefined) startIndex = 0;
        if(endIndex === undefined) endIndex = entries.length;

        for(var i = startIndex; i < endIndex; ++i){
            var entry = entries[i], operator = entry.operator;

            var snippet = new Shade.SnippetEntry();
            snippet.setAst(Shade.getSnippetAst(operator.evaluate_shadejs));

            for(var j = 0; j < operator.outputs.length; ++j){
                var outputEntry = operator.outputs[j];
                var shadeJsType = Xflow.shadejs.convertFromXflow(outputEntry.type, null);
                if(entry.isFinalOutput(j)){
                    snippet.addFinalOutput(shadeJsType, outputEntry.name, entry.getOutputIndex(j));
                }
                else{
                    snippet.addLostOutput(shadeJsType, outputEntry.name);
                }
            }
            for(var j = 0; j < operator.mapping.length; ++j){
                var mappingEntry = operator.mapping[j];
                var shadeJsType = Xflow.shadejs.convertFromXflow(mappingEntry.internalType, null);
                if(entry.isTransferInput(j)){
                    snippet.addTransferInput(shadeJsType,
                        entry.getTransferInputOperatorIndex(j),
                        entry.getTransferInputOutputIndex(j));
                }
                else{
                    var directInputIndex = entry.getDirectInputIndex(j),
                        isIterate = operatorList.isInputIterate(directInputIndex),
                        arrayAccess = mappingEntry.array;
                    if(isIterate)
                        snippet.addVertexInput(shadeJsType, directInputIndex);
                    else if(arrayAccess)
                        snippet.addUniformArray(shadeJsType, directInputIndex, operatorList.getInputSize(directInputIndex));
                    else
                        snippet.addUniformInput(shadeJsType, directInputIndex);
                }
            }
            snippetList.addEntry(snippet);
        }
        return snippetList
    }

})();
