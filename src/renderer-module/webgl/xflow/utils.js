var GLTexture = require("../base/texture.js");

function convertToJSArray(value) {
    var jsArray = [value.length];
    for (var i = 0; i < value.length; i++) {
        jsArray[i] = value[i];
    }
    return jsArray;
}

module.exports = {
    getGLUniformValueFromXflowDataEntry: function (xflowDataEntry, context) {
        var value;
        if (!xflowDataEntry)
            return null;
        if (xflowDataEntry.type == Xflow.DATA_TYPE.TEXTURE) {
            var webglData = context.getXflowEntryWebGlData(xflowDataEntry);
            var texture = webglData.texture || new GLTexture(context);
            if (webglData.changed)
                texture.updateFromTextureEntry(xflowDataEntry);

            webglData.texture = texture;
            webglData.changed = 0;
            value = [texture];
        } else if (xflowDataEntry.type == Xflow.DATA_TYPE.BOOL) {
            //TODO Can we get Xflow to return boolean arrays as normal JS arrays? WebGL doesn't accept Uint8Arrays here...
            //TODO Alternatively we could set boolean uniforms using uniform1fv together with Float32Arrays, which apparently works too
            value = convertToJSArray(xflowDataEntry.getValue());
        } else {
            value = xflowDataEntry.getValue();
        }

        return value;
    }
};
