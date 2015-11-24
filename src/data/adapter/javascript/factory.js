var registerFormat = require("../../../resource/resourcefetcher.js").registerFormat;
var FormatHandler = require("../../../base/formathandler.js").FormatHandler;
var AdapterFactory = require("../../../base/adapter.js").AdapterFactory;

var JavaScriptFormatHandler = function () {
    FormatHandler.call(this);
};
XML3D.createClass(JavaScriptFormatHandler, FormatHandler);

JavaScriptFormatHandler.prototype.isFormatSupported = function (response) {
    return response.headers.get("Content-Type") === "application/javascript" || response.url.match(/\.js/);
};


JavaScriptFormatHandler.prototype.getFormatData = function (response, callback) {
    response.text().then(callback);
};

var javaScriptFormatHandler = new JavaScriptFormatHandler();
registerFormat(javaScriptFormatHandler);


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
    AdapterFactory.call(this, "data");
};
XML3D.createClass(ScriptFactory, AdapterFactory);


ScriptFactory.prototype.aspect = "data";

ScriptFactory.prototype.createAdapter = function (xflowNode) {
    return new ScriptDataAdapter(xflowNode);
};

javaScriptFormatHandler.registerFactoryClass(ScriptFactory);
