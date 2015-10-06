module("Script Value", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/script-value.html"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Set script value attached to document", function() {

    var posValue = this.doc.getElementById("posValue"),
        sizeValue = this.doc.getElementById("pointSize"),
        dataElement = this.doc.getElementById("pointData"),
        originalContent =  "0 -1 0   1 0 0";

    equal(posValue.textContent, originalContent, "Position has correct text content");
    var result = dataElement.getResult();
    QUnit.closeArray(result.getValue("position"), new Float32Array(originalContent.split(/\s+/)),
        EPSILON, "Position has correct Xflow result");

    var newPos = new Float32Array([0,0,0,   1, 1, 1]);
    posValue.setScriptValue(newPos);

    equal(posValue.textContent, "[value set by script]", "Position has correct text content after setScriptValue()");
    result = dataElement.getResult();
    QUnit.closeArray(result.getValue("position"), newPos,
        EPSILON, "Position has correct Xflow result after setScriptValue()");

    newPos[1] = 2;
    posValue.setScriptValue(newPos);

    equal(posValue.textContent, "[value set by script]", "Position has correct text content after setScriptValue() #2");
    result = dataElement.getResult();
    QUnit.closeArray(result.getValue("position"), newPos,
        EPSILON, "Position has correct Xflow result after setScriptValue() #2");

    var newSize = new Float32Array([1.0]);
    sizeValue.setScriptValue(newSize);

    equal(sizeValue.textContent, "[value set by script]", "PointSize has correct text content after setScriptValue()");
    result = dataElement.getResult();
    QUnit.closeArray(result.getValue("pointSize"), newSize,
        EPSILON, "PointSize has correct Xflow result after setScriptValue()");


    posValue.textContent = originalContent;

    equal(posValue.textContent, originalContent, "Position has correct text content after undoing changes");
    var result = dataElement.getResult();
    QUnit.closeArray(result.getValue("position"), new Float32Array(originalContent.split(/\s+/)),
        EPSILON, "Position has correct Xflow result after undoing changes");

});

test("Set script value detached from document", function() {

    var colorValue = this.doc.createElementNS(XML3D.xml3dNS, "float3"),
        dataElement = this.doc.getElementById("pointData");

    var colorArray = new Float32Array([1,0,0,  0,0,1]);

    colorValue.name = "color";
    colorValue.setScriptValue(colorArray);

    dataElement.appendChild(colorValue);

    equal(colorValue.textContent, "[value set by script]", "Color has correct text content");
    var result = dataElement.getResult();
    QUnit.closeArray(result.getValue("color"), colorArray,
        EPSILON, "Color has correct Xflow result");

    dataElement.removeChild(colorValue);

    equal(colorValue.textContent, "[value set by script]", "Color has correct text content after removal");
    var result = dataElement.getResult();
    equal(result.getValue("color"), null, EPSILON, "Color has correct Xflow result after removal");

    dataElement.appendChild(colorValue);

    equal(colorValue.textContent, "[value set by script]", "Color has correct text content after readding");
    var result = dataElement.getResult();
    QUnit.closeArray(result.getValue("color"), colorArray,
        EPSILON, "Color has correct Xflow result  after readding");

    dataElement.removeChild(colorValue);

    var colorTextValue = "1 1 0  0 1 1";
    colorValue.textContent = colorTextValue;

    dataElement.appendChild(colorValue);
    var result = dataElement.getResult();
    QUnit.closeArray(result.getValue("color"), new Float32Array(colorTextValue.split(/\s+/)),
        EPSILON, "Color has correct Xflow result  after readding #2");


});
