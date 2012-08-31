
function lameParse(text, constructor) {
    var exp = /([+\-0-9eE\.]+)/g;
    var m = text.match(exp);
    return m ? new constructor(m) : new constructor();
}

module("Xflow tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/data-xflow.xhtml", this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    },

    formatData : function(text, type) {
        var data = null;
        switch (type) {
        case "float"  :
        case "float2" :
        case "float3" :
            data = lameParse(text, Float32Array);
            break;
        case "int"  :
        case "int2" :
        case "int3" :
            data = lameParse(text, Int32Array);
            break;
        default:
            console.log("Couldn't find data type for "+type);
        }

        return data;
    },

    loadTestXML : function(url, handler) {
        this.factory = handler.renderer.dataFactory;
        var defsElem = this.doc.getElementById("defsElem");
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET",url,false);
        xmlhttp.send();
        var input = xmlhttp.responseXML.getElementsByTagName("Input")[0];
        var child = input.firstElementChild;
        var temp;
        while (child) {
           temp = child.nextElementSibling;
           defsElem.appendChild(child);
           this.factory.getAdapter(child);
           child = temp;
        }
        return xmlhttp.responseXML;
    },
    haveElement : null,
    response : null,
    factory : null,

    executeTests : function(response) {
        this.response = response;
        var testBlock = response.getElementsByTagName("TestProcess")[0];
        var currentTest = testBlock.firstElementChild;
        while (currentTest) {
            var testName = currentTest.nodeName;
            if (this[testName])
                this[testName](currentTest);

            currentTest = currentTest.nextElementSibling;
        }
    },

    //Test functions

    Check : function(testNode) {
        var dataNodeId = testNode.getAttribute("data").substring(1);
        var dataElement = this.doc.getElementById(dataNodeId);
        if (!dataElement)
            console.log("Couldn't find element "+dataNodeId);

        var action = testNode.firstElementChild;
        while (action) {
            if (this[action.nodeName])
                this[action.nodeName](dataElement, action);

            action = action.nextElementSibling;
        }
    },
    MatchInput : function (have, action) {
        var shouldMatchName = action.getAttribute("input").substring(1);
        var shouldMatch = this.doc.getElementById(shouldMatchName);
        shouldMatch = this.formatData(shouldMatch.textContent, shouldMatch.nodeName);

        var property = action.getAttribute("name");

        var dataAdapter = have._configured.adapters;
        dataAdapter = dataAdapter[Object.keys(dataAdapter)[0]];
        var adapterOutputs = dataAdapter.getComputeRequest().getResult();

        var actualData = adapterOutputs.getOutputData(property);
        if (!actualData) {
            ok(false, "Property "+property+" does not exist");
            return;
        }

        QUnit.closeArray(actualData.getValue(), shouldMatch, EPSILON, shouldMatchName+" in "+have.id+" matches reference data");
    },

    MatchNull : function (have, action) {
        var dataAdapter = have._configured.adapters;
        dataAdapter = dataAdapter[Object.keys(dataAdapter)[0]];
        var adapterOutputs = dataAdapter.getComputeRequest().getResult();

        var property = action.getAttribute("name");

        ok(!adapterOutputs.getOutputData(property), "Parameter "+property+" does not exist");
    },

    MatchData : function(have, action) {
        var dataAdapter = have._configured.adapters;
        dataAdapter = dataAdapter[Object.keys(dataAdapter)[0]];
        var adapterOutputs = dataAdapter.getComputeRequest().getResult();

        var property = action.getAttribute("name");

        var actualData = adapterOutputs.getOutputData(property);
        if (!actualData) {
            ok(false, "Property "+property+" does not exist");
            return;
        }
        var shouldMatch = this.formatData(action.textContent, action.getAttribute("type"));

        QUnit.closeArray(actualData.getValue(), shouldMatch, EPSILON, property+" in "+have.id+" matches expected data");

    },

    Modification : function(testNode) {
        var action = testNode.firstElementChild;
        while (action) {
            if (this[action.nodeName])
                this[action.nodeName](action);

            action = action.nextElementSibling;
        }
    },

    RemoveNode : function(action) {
        var target = action.getAttribute("node").substring(1);
        target = this.doc.getElementById(target);
        var parent = target.parentNode;
        target.parentNode.removeChild(target);
        ok(true, "Removed node '"+target.id+"' from '"+parent.id+"'");
    },

    AddNodes : function(action) {
        var parent = action.getAttribute("parentData").substring(1);
        parent = this.doc.getElementById(parent);
        var child = action.firstElementChild;
        var addedNodes = "";
        var temp;
        while (child) {
            temp = child.nextElementSibling;
            parent.appendChild(child);
            this.factory.getAdapter(child);
            addedNodes += child.id+" ";
            child = temp;
        }
        addedNodes = addedNodes.trim();
        ok(true, "Added node(s) '"+addedNodes+"' to '"+parent.id+"'");
    },

    ChangeAttribute : function(action) {
        var attrName = action.getAttribute("attrName");
        var newValue = action.getAttribute("newValue");
        var targetNodeName = action.getAttribute("node").substring(1);
        var targetNode = this.doc.getElementById(targetNodeName);
        targetNode.setAttribute(attrName, newValue);
        ok(true, "Changed attr '"+attrName+"' to '"+newValue+"'");
    }


});

test("Very basic test", 4, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/test_verybasic.xml", handler);
    this.executeTests(response);
 });

test("Nested nodes test", 13, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/test_nesting.xml", handler);
    this.executeTests(response);
 });

test("Renaming nodes 1", 13, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/test_renaming.xml", handler);
    this.executeTests(response);
 });

test("Renaming nodes 2", 14, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/test_renaming2.xml", handler);
    this.executeTests(response);
 });

test("Renaming nodes 3", 6, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/test_renaming3.xml", handler);
    this.executeTests(response);
 });

/*
test("Templates 1", 19, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/test_template1.xml", handler);
    this.executeTests(response);
 });

test("Templates 2", 16, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/test_template2.xml", handler);
    this.executeTests(response);
 });

test("Templates 3", 14, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/test_template3.xml", handler);
    this.executeTests(response);
 });

test("Templates 4", 5, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/test_template4.xml", handler);
    this.executeTests(response);
 });
*/

test("Add/Remove script", 16, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/test_add_remove_script.xml", handler);
    this.executeTests(response);
 });
