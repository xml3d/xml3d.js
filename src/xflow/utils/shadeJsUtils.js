(function(){

    Xflow.convertXflowToShadeType = function(xflowType, source){
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

})();
