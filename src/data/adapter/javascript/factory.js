var JavaScriptFormatHandler = function () {
    XML3D.base.FormatHandler.call(this);
};
XML3D.createClass(JavaScriptFormatHandler, XML3D.base.FormatHandler);

JavaScriptFormatHandler.prototype.isFormatSupported = function (response, responseType, mimetype) {
    return mimetype === "application/javascript" || mimetype === "text/javascript";
};


JavaScriptFormatHandler.prototype.getFormatData = function (response, responseType, mimetype, callback) {
    callback(true, response);
};

var handler = new JavaScriptFormatHandler();
XML3D.base.registerFormat(handler);


var ScriptDataAdapter = function (script) {
    this.script = script;
};

ScriptDataAdapter.prototype.getScriptType = function () {
    return "application/javascript";
};

ScriptDataAdapter.prototype.getScript= function () {
    return this.script;
};


var ScriptFactory = function () {
    XML3D.base.AdapterFactory.call(this, "data");
};
XML3D.createClass(ScriptFactory, XML3D.base.AdapterFactory);


ScriptFactory.prototype.aspect = "data";

ScriptFactory.prototype.createAdapter = function (xflowNode) {
    return new ScriptDataAdapter(xflowNode);
};

handler.registerFactoryClass(ScriptFactory);
