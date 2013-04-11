
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
        case "float4" :
        case "float4x4" :
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
        var win = document.getElementById("xml3dframe").contentWindow;
        var resManager = win.XML3D.base.resourceManager;
        var resType = win.XML3D.data;
        this.getDataAdapter = function(node){
            return resManager.getAdapter(node, res.Type);
        }

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
           this.getDataAdapter(child);
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
            this.getDataAdapter(child);
            addedNodes += child.id+" ";
            child = temp;
        }
        addedNodes = addedNodes.trim();
        ok(true, "Added node(s) '"+addedNodes+"' to '"+parent.id+"'");
    },

    ChangeAttribute : function(action) {
        var attrName = action.getAttribute("attrName");
        var newValue = action.getAttribute("newValue");
        var remove = action.getAttribute("remove");
        var targetNodeName = action.getAttribute("node").substring(1);
        var targetNode = this.doc.getElementById(targetNodeName);
        if(!remove){
            targetNode.setAttribute(attrName, newValue);
            ok(true, "Changed attr '"+attrName+"' to '"+newValue+"'");
        }
        else{
            targetNode.removeAttribute(attrName);
            ok(true, "Removed attr '"+attrName+"'");
        }

    },

    ChangeData : function(action) {
        var inputId = action.getAttribute("input").substring(1);
        var input = this.doc.getElementById(inputId);

        var newText = action.textContent;
        input.firstChild.nodeValue = newText;

        ok(true, "Changed data of '"+inputId+"' to '"+newText+"'");
    }


});


test("Test filter parsing", function() {
    var graph = new Xflow.Graph();
    var dataNode = graph.createDataNode();
    var mapping;

    dataNode.setFilter("keep(position, normal, tangent)");
    strictEqual(dataNode.filterType, Xflow.DATA_FILTER_TYPE.KEEP, "Filter Type is 'keep'");
    mapping = dataNode.filterMapping;
    strictEqual(mapping.getName(0), "position", "First mapping name is 'position'");
    strictEqual(mapping.getName(1), "normal", "Second mapping name is 'normal'");
    strictEqual(mapping.getName(2), "tangent", "Third mapping name is 'tangent'");

    dataNode.setFilter("remove ( A , B )   ");
    strictEqual(dataNode.filterType, Xflow.DATA_FILTER_TYPE.REMOVE, "Filter Type is 'remove'");
    mapping = dataNode.filterMapping;
    strictEqual(mapping.getName(0), "A", "First mapping name is 'A'");
    strictEqual(mapping.getName(1), "B", "Second mapping name is 'B'");

    dataNode.setFilter("rename ({newA : oldA , newB:oldB, newC: oldB})  ");
    strictEqual(dataNode.filterType, Xflow.DATA_FILTER_TYPE.RENAME , "Filter Type is 'rename'");
    mapping = dataNode.filterMapping;
    strictEqual(mapping.getDestName(0), "newA", "First destination name is 'newA'");
    strictEqual(mapping.getDestName(1), "newB", "Second destination name is 'newB'");
    strictEqual(mapping.getDestName(2), "newC", "Third destination name is 'newC'");
    strictEqual(mapping.getSrcName(0), "oldA", "First source name is 'oldA'");
    strictEqual(mapping.getSrcName(1), "oldB", "Second source name is 'oldB'");
    strictEqual(mapping.getSrcName(2), "oldB", "Third source name is 'oldB'");

    dataNode.setFilter("keep( {DEST : A, DEST :B , DEST: C , C2: A } ) ");
    strictEqual(dataNode.filterType, Xflow.DATA_FILTER_TYPE.KEEP , "Filter Type is 'keep'");
    mapping = dataNode.filterMapping;
    strictEqual(mapping.getDestName(0), "DEST", "First destination name is 'DEST'");
    strictEqual(mapping.getDestName(1), "C2", "Second destination name is 'C2'");
    strictEqual(mapping.getSrcName(0), "C", "First source name is 'C'");
    strictEqual(mapping.getSrcName(1), "A", "Second source name is 'A'");
});


test("Test compute parsing", function() {
    var graph = new Xflow.Graph();
    var dataNode = graph.createDataNode();
    var mapping;

    dataNode.setCompute("position = xflow.morph(position, posAdd, weight)");
    strictEqual(dataNode.computeOperator, "xflow.morph", "Operator is 'xflow.morph'");
    mapping = dataNode.computeInputMapping;
    strictEqual(mapping.getName(0), "position", "First input mapping name is 'position'");
    strictEqual(mapping.getName(1), "posAdd", "Second input mapping name is 'posAdd'");
    strictEqual(mapping.getName(2), "weight", "Third input mapping name is 'weight'");
    mapping = dataNode.computeOutputMapping;
    strictEqual(mapping.getName(0), "position", "First output mapping name is 'position'");

    dataNode.setCompute(" {index: index, norm: normal, pos: position } = xflow.createSphere (segments)  ");
    strictEqual(dataNode.computeOperator, "xflow.createSphere", "Operator is 'xflow.createSphere'");
    mapping = dataNode.computeInputMapping;
    strictEqual(mapping.getName(0), "segments", "First input mapping name is 'segments'");
    mapping = dataNode.computeOutputMapping;
    strictEqual(mapping.getSrcName(0), "index", "First output mapping source name is 'index'");
    strictEqual(mapping.getDestName(0), "index", "First output mapping destination name is 'index'");
    strictEqual(mapping.getSrcName(1), "normal", "Second output mapping source name is 'normal'");
    strictEqual(mapping.getDestName(1), "norm", "Second output mapping destination name is 'norm'");
    strictEqual(mapping.getSrcName(2), "position", "Third output mapping source name is 'position'");
    strictEqual(mapping.getDestName(2), "pos", "Third output mapping destination name is 'pos'");


    dataNode.setCompute(" (index, norm, pos) = xflow.createPlane (segCount)  ");
    strictEqual(dataNode.computeOperator, "xflow.createPlane", "Operator is 'xflow.createPlane'");
    mapping = dataNode.computeInputMapping;
    strictEqual(mapping.getName(0), "segCount", "First input mapping name is 'segCount'");
    mapping = dataNode.computeOutputMapping;
    strictEqual(mapping.getName(0), "index", "First output mapping name is 'index'");
    strictEqual(mapping.getName(1), "norm", "Second output mapping name is 'norm'");
    strictEqual(mapping.getName(2), "pos", "Third output mapping name is 'pos'");

    dataNode.setCompute(" (transform) = xflow.createTransform ({rotation: rot, translation: trans})  ");
    strictEqual(dataNode.computeOperator, "xflow.createTransform", "Operator is 'xflow.createTransform'");
    mapping = dataNode.computeInputMapping;
    strictEqual(mapping.getSrcName(0), "rot", "First input mapping source name is 'rot'");
    strictEqual(mapping.getDestName(0), "rotation", "First input mapping destination name is 'rotation'");
    strictEqual(mapping.getSrcName(1), "trans", "Second input mapping source name is 'trans'");
    strictEqual(mapping.getDestName(1), "translation", "Second input mapping destination name is 'translation'");
    mapping = dataNode.computeOutputMapping;
    strictEqual(mapping.getName(0), "transform", "First output mapping name is 'transform'");
});


test("Very basic test", 4, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_verybasic.xml", handler);
    this.executeTests(response);
 });

test("Nested nodes test", 13, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_nesting.xml", handler);
    this.executeTests(response);
 });

test("Renaming nodes 1", 13, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_renaming.xml", handler);
    this.executeTests(response);
 });

test("Renaming nodes 2", 14, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_renaming2.xml", handler);
    this.executeTests(response);
 });

test("Renaming nodes 3", 6, function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_renaming3.xml", handler);
    this.executeTests(response);
 });


test("Operator - Add/Remove", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_add_remove_script.xml", handler);
    this.executeTests(response);
});

test("Operator - Later Input", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_operator_later_input.xml", handler);
    this.executeTests(response);
});

test("Operators - Simple", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/simple_script/test_script_simple.xml", handler);
    this.executeTests(response);
});

test("Operators - Nesting", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/simple_script/test_script_nesting.xml", handler);
    this.executeTests(response);
});

test("Operators - Transform operators", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/simple_script/test_script_transform.xml", handler);
    this.executeTests(response);
});
test("Operators - Skinning operators", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/simple_script/test_script_skinning.xml", handler);
    this.executeTests(response);
});

test("Operators - forwardKinematics operator", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/simple_script/test_script_forward_kinematics.xml", handler);
    this.executeTests(response);
});

/*
test("Operators - image processing operators", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/simple_script/test_script_image_processing.xml", handler);
    this.executeTests(response);
});
*/

test("Operators - Lerp on Sequences", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/simple_script/test_script_lerp_position_seq.xml", handler);
    this.executeTests(response);
});

test("Operators - Slerp on Sequences", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/simple_script/test_script_lerp_rotation_seq.xml", handler);
    this.executeTests(response);
});

test("Operators - Lerp and Slerp on Key Arrays", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/simple_script/test_script_lerp_slerp_keys.xml", handler);
    this.executeTests(response);
});



test("Prototypes - Basic", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/prototypes/test_proto1.xml", handler);
    this.executeTests(response);
});

test("Prototypes - Nested", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/prototypes/test_proto2.xml", handler);
    this.executeTests(response);
});

test("Prototypes - Nested #2", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/prototypes/test_proto5.xml", handler);
    this.executeTests(response);
});

test("Prototypes - Nested with Operators", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/prototypes/test_proto6.xml", handler);
    this.executeTests(response);
});

test("Prototypes - Name Mapping", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/prototypes/test_proto3.xml", handler);
    this.executeTests(response);
});

test("Prototypes - With Operators", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/prototypes/test_proto4.xml", handler);
    this.executeTests(response);
});



