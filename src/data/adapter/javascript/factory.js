
var JavaScriptFormatHandler = function () {
    XML3D.resource.FormatHandler.call(this);
};
XML3D.createClass(JavaScriptFormatHandler, XML3D.resource.FormatHandler);

JavaScriptFormatHandler.prototype.isFormatSupported = function (response) {
    return response.headers.get("Content-Type") === "application/javascript";
};


JavaScriptFormatHandler.prototype.getFormatData = function (response) {
    return response.text();
};

JavaScriptFormatHandler.prototype.getAdapter = function(xflowNode, aspect, canvasId) {
    if (aspect === "data") {
        return new ScriptDataAdapter(xflowNode);
    }
    throw new Error("Unsupported aspect '"+aspect+"' encountered in JavaScript format handler.");
};

XML3D.resource.registerFormatHandler(new JavaScriptFormatHandler());


var ScriptDataAdapter = function (script) {
    this.script = script;
};

ScriptDataAdapter.prototype.getScriptType = function () {
    return "application/javascript";
};

ScriptDataAdapter.prototype.getScript= function () {
    return this.script;
};
