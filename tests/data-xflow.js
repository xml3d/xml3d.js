
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
            that.win = document.getElementById("xml3dframe").contentWindow;
            start();
        };

        loadDocument("scenes/data-xflow.html", this.cb);
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
            return resManager.getAdapter(node, resType);
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
           console.log(child);
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


    getXflowData: function(node){
        var adapter = this.getDataAdapter(node);
        return adapter && adapter.getXflowNode && adapter.getXflowNode().data;
    },

    //Test functions

    VSCheck: function(testNode){
        var dataNodeId = testNode.getAttribute("data").substring(1);
        var dataElement = this.doc.getElementById(dataNodeId);
        var title = testNode.getAttribute("title");

        var vsConfig = new this.win.Xflow.VSConfig();

        var connect = testNode.getElementsByTagName("VSConfig")[0].firstElementChild;
        while (connect) {
            if (connect.nodeName == "VSConnection")
                this.VSConnection(connect, vsConfig);
            connect = connect.nextElementSibling;
        };

        var dataAdapter = dataElement._configured.adapters;
        dataAdapter = dataAdapter[Object.keys(dataAdapter)[0]];
        var xflowNode = dataAdapter.getXflowNode();
        var request = new this.win.Xflow.VertexShaderRequest(xflowNode, vsConfig);
        var result = request.getResult();
        var code = result.getGLSLCode();
        var inputIdx = code.indexOf("// INPUT"), codeIdx = code.indexOf("// CODE"),
            outputIdx = code.indexOf("// OUTPUT"), globalsIdx = code.indexOf("// GLOBALS");

        ok(inputIdx != -1 && codeIdx != -1 && outputIdx != -1 && globalsIdx != -1,
            title + "=> Shader has expected structure");

        var action = testNode.firstElementChild;
        while (action) {
            if (this[action.nodeName])
                this[action.nodeName](result, action, title);

            action = action.nextElementSibling;
        }
    },

    VSConnection: function(node, vsConfig){
        var typeString = node.getAttribute("type"), transformString = node.getAttribute("transform");
        var type = Xflow.DATA_TYPE[typeString];
        if(!type)
            throw new Error("Unknown VS connection Type: " + typeString);
        var transform = Xflow.VS_ATTRIB_TRANSFORM[transformString] || Xflow.VS_ATTRIB_TRANSFORM.NONE;

        vsConfig.addAttribute( type, node.getAttribute("in"), node.getAttribute("out"),
            node.getAttribute("optional") == "true", transform );
    },

    VSInputBufferCount: function(result, action, title){
        var count = action.getAttribute("count")*1;
        equal(result.shaderInputNames.length, count, title + "=> Vertex Shader has " +
            count + " input buffers.");
    },
    VSOutAttribCount: function(result, action, title){
        var count = action.getAttribute("count")*1;
        var code = result.getGLSLCode();
        var outputIdx = code.indexOf("// OUTPUT"), inputIdx = code.indexOf("// INPUT");
        var fragment = code.substring(outputIdx, inputIdx);

        var matches = fragment.match(/varying /g), actualCount = matches && matches.length || 0;
        equal(actualCount, count, title + "=> Vertex Shader has " +
            count + " 'varying' parameters.");
    },
    VSInAttribCount: function(result, action, title){
        var count = action.getAttribute("count")*1;
        var code = result.getGLSLCode();
        var inputIdx = code.indexOf("// INPUT"), codeIdx = code.indexOf("// CODE");
        var fragment = code.substring(inputIdx, codeIdx);

        var matches = fragment.match(/attribute /g), actualCount = matches && matches.length || 0;
        equal(actualCount, count, title + "=> Vertex Shader has " +
            count + " 'attribute' parameters.");
    },
    VSUniformAttribCount: function(result, action, title){
        var count = action.getAttribute("count")*1;
        var code = result.getGLSLCode();
        var inputIdx = code.indexOf("// INPUT"), codeIdx = code.indexOf("// CODE");
        var fragment = code.substring(inputIdx, codeIdx);

        var matches = fragment.match(/uniform /g), actualCount = matches && matches.length || 0;
        equal(actualCount, count, title + "=> Vertex Shader has " +
            count + " 'uniform' parameters.");
    },
    VSOutputIsVarying: function(result, action, title){
        var name = action.getAttribute("name");
        equal(!result.isShaderOutputUniform(name) && !result.isShaderOutputNull(name),
                true, title + "=> Output '" + name + "' is varying.");
    },
    VSOutputIsNull: function(result, action, title){
        var name = action.getAttribute("name");
        equal(result.isShaderOutputNull(name),
                true, title + "=> Output '" + name + "' is null.");
    },
    VSOutputIsUniform: function(result, action, title){
        var name = action.getAttribute("name");
        equal(result.isShaderOutputUniform(name),
                true, title + "=> Output '" + name + "' is unform.");
        if(action.hasAttribute("input")){
            var shouldMatchName = action.getAttribute("input").substring(1);
            var shouldMatch = this.doc.getElementById(shouldMatchName);
            var shouldMatchData = this.getXflowData(shouldMatch);
            equal(result.getUniformOutputData(name), shouldMatchData,
                title + "=> Uniform output '" + name + "' forwards correct input data.");
        }

    },

    VSHasInputBuffer : function (result, action, title) {
        var shouldMatchName = action.getAttribute("input").substring(1);
        var shouldMatch = this.doc.getElementById(shouldMatchName);
        var shouldMatchData = this.getXflowData(shouldMatch);

        var shouldBeUniform = (action.getAttribute("uniform") == "true");

        var names = result.shaderInputNames, entryName = null;
        for(var i =0; i < names.length; ++i){
            var name = names[i];
            if(result.getShaderInputData(name) == shouldMatchData){
                entryName = name;
                break;
            }
        }
        ok(entryName, title + " => InputBuffer '" + shouldMatchName + "' is used");

        if(shouldBeUniform)
            equal(result.isShaderInputUniform(entryName), true, title + " => InputBuffer '" + shouldMatchName + "' is uniform");
        else
            equal(result.isShaderInputUniform(entryName), false, title + " => InputBuffer '" + shouldMatchName + "' is not uniform");
    },

    VSCodeMatchesRegexp: function(result, action, title){
        var regexp = new RegExp(action.getAttribute("regexp"));
        var code = result.getGLSLCode();
        ok(!!code.match(regexp), title + " => GLSL Code matches regexp: " + regexp);
    },

    Check : function(testNode) {
        var dataNodeId = testNode.getAttribute("data").substring(1);
        var dataElement = this.doc.getElementById(dataNodeId);
        var title =  testNode.getAttribute("title") || "No Title";
        if (!dataElement)
            console.log("Couldn't find element "+dataNodeId);

        var action = testNode.firstElementChild;
        while (action) {
            if (this[action.nodeName])
                this[action.nodeName](dataElement, action, title);

            action = action.nextElementSibling;
        }
    },


    MatchInput : function (have, action, title) {
        var shouldMatchName = action.getAttribute("input").substring(1);
        var shouldMatch = this.doc.getElementById(shouldMatchName);

        var shouldMatchData = this.getXflowData(shouldMatch);

        var property = action.getAttribute("name");

        var dataAdapter = have._configured.adapters;
        dataAdapter = dataAdapter[Object.keys(dataAdapter)[0]];
        var adapterOutputs = dataAdapter.getComputeRequest().getResult();

        var actualData = adapterOutputs.getOutputData(property);
        if (!actualData) {
            ok(false,  title + "=> " + shouldMatchName+" in "+have.id+" matches reference data");
            return;
        }

        equal(actualData, shouldMatchData, title + "=> " + shouldMatchName+" in "+have.id+" matches reference data");
    },

    MatchTexture: function (have, action, title) {
        var shouldMatchName = action.getAttribute("reference").substring(1);
        var shouldMatchElement = this.doc.getElementById(shouldMatchName);
        var shouldMatchData = this.getXflowData(shouldMatchElement).getValue().data;
        var property = action.getAttribute("name");

        var dataAdapter = have._configured.adapters;
        dataAdapter = dataAdapter[Object.keys(dataAdapter)[0]];

        var adapterOutputs = dataAdapter.getComputeRequest().getResult();
        var dataOutput = adapterOutputs.getOutputData(property);
        var actualData;

        if (!dataOutput) {
            ok(false, title + "=> " + shouldMatchName + " in " + have.id + " matches reference data");
            return;
        }

        actualData = dataOutput.getValue().data;

        dataAdapter.xflowDataNode._getChannelNode().clear();

        QUnit.closeArray(actualData, shouldMatchData, EPSILON, title + " => " + property + " in " + have.id + " matches expected data");

    },

    MatchNull : function (have, action, title) {
        var dataAdapter = have._configured.adapters;
        dataAdapter = dataAdapter[Object.keys(dataAdapter)[0]];
        var adapterOutputs = dataAdapter.getComputeRequest().getResult();

        var property = action.getAttribute("name");

        ok(!adapterOutputs.getOutputData(property), title + " => " + "Parameter "+property+" does not exist");
    },

    MatchData : function(have, action, title) {
        var dataAdapter = have._configured.adapters;
        dataAdapter = dataAdapter[Object.keys(dataAdapter)[0]];
        var adapterOutputs = dataAdapter.getComputeRequest().getResult();

        var property = action.getAttribute("name");

        var actualData = adapterOutputs.getOutputData(property);
        if (!actualData) {
            ok(false, title + " => " + property+" in "+have.id+" matches expected data");
            return;
        }
        var shouldMatch = this.formatData(action.textContent, action.getAttribute("type"));

        QUnit.closeArray(actualData.getValue(), shouldMatch, EPSILON,  title + " => " + property+" in "+have.id+" matches expected data");

    },

    Modification : function(testNode) {
        var action = testNode.firstElementChild;
        while (action) {
            if (this[action.nodeName])
                this[action.nodeName](action);

            action = action.nextElementSibling;
        }
        ok(true, testNode.getAttribute("title"));
    },

    RemoveNode : function(action) {
        var target = action.getAttribute("node").substring(1);
        target = this.doc.getElementById(target);
        var parent = target.parentNode;
        target.parentNode.removeChild(target);
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
    },

    ChangeAttribute : function(action) {
        var attrName = action.getAttribute("attrName");
        var newValue = action.getAttribute("newValue");
        var remove = action.getAttribute("remove");
        var targetNodeName = action.getAttribute("node").substring(1);
        var targetNode = this.doc.getElementById(targetNodeName);
        if(!remove){
            targetNode.setAttribute(attrName, newValue);
        }
        else{
            targetNode.removeAttribute(attrName);
        }

    },

    ChangeData : function(action) {
        var inputId = action.getAttribute("input").substring(1);
        var input = this.doc.getElementById(inputId);

        var newText = action.textContent;
        input.firstChild.nodeValue = newText;
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


test("Very basic test", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_verybasic.xml", handler);
    this.executeTests(response);
 });

test("Nested nodes test", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_nesting.xml", handler);
    this.executeTests(response);
 });

test("Renaming nodes 1", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_renaming.xml", handler);
    this.executeTests(response);
 });

test("Renaming nodes 2", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_renaming2.xml", handler);
    this.executeTests(response);
 });

test("Renaming nodes 3", function() {
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

test("Operator - Platform fallback - JS", function() {
        var xflowGraph = XML3D.data.xflowGraph;

    if (xflowGraph.platform !== Xflow.PLATFORM.JAVASCRIPT) {
        console.log("Operator - Platform fallback - JS tests were not executed because Xflow platform is not JavaScript.");
        return true;
    }

    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_platform_fallback_js.xml", handler);
    this.executeTests(response);
});

test("Operator - Platform fallback - WebCL", function () {
    var xflowGraph = XML3D.data.xflowGraph;

    if (xflowGraph.platform !== Xflow.PLATFORM.CL) {
        console.log("Operator - Platform fallback - WebCL tests were not executed because WebCL platform is not available.");
        return true;
    }

    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_platform_fallback_cl.xml", handler);
    this.executeTests(response);
});

test("Operator - Platform attribute - JS", function () {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_platform_js.xml", handler);
    this.executeTests(response);
});

test("Operator - Platform attribute - WebCL", function () {
    var xflowGraph = XML3D.data.xflowGraph;

    if (xflowGraph.platform !== Xflow.PLATFORM.CL) {
        console.log("Operator - Platform - WebCL tests were not executed because WebCL platform is not available.");
        return true;
    }

    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_platform_cl.xml", handler);
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
    var response = this.loadTestXML("./xflow-xml/dataflow/test_dataflow_basic.xml", handler);
    this.executeTests(response);
});

test("Prototypes - Nested", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/dataflow/test_dataflow_nested.xml", handler);
    this.executeTests(response);
});

test("Prototypes - Nested #2", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/dataflow/test_dataflow_nested2.xml", handler);
    this.executeTests(response);
});

test("Prototypes - Nested with Operators", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/dataflow/test_dataflow_nested_operators.xml", handler);
    this.executeTests(response);
});

test("Prototypes - Name Mapping", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/dataflow/test_dataflow_mapping.xml", handler);
    this.executeTests(response);
});

test("Prototypes - With Operators", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/dataflow/test_dataflow_operators.xml", handler);
    this.executeTests(response);
});


test("Prototypes - Complex Operators", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/dataflow/test_dataflow_complex.xml", handler);
    this.executeTests(response);
});


test("GLSL basic", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/glsl_output/test_glsl_basic.xml", handler);
    this.executeTests(response);
});


test("GLSL with 3x Morph", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/glsl_output/test_glsl_morphing.xml", handler);
    this.executeTests(response);
});

test("GLSL with Uniforms", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/glsl_output/test_glsl_uniform.xml", handler);
    this.executeTests(response);
});

test("GLSL with Processing on Uniforms", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/glsl_output/test_glsl_uniform_processing.xml", handler);
    this.executeTests(response);
});

test("WebCL Image Processing", function () {
    var xflowGraph = XML3D.data.xflowGraph;
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/webcl_output/test_webcl_image_processing.xml", handler);

    if (xflowGraph.platform !== Xflow.PLATFORM.CL) {
        console.log("WebCL Image Processing tests could not be executed because WebCL platform is not available");
        return true;
    }
    this.executeTests(response);
});


test("Errors with empty arguments", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/error/test_empty_argument.xml", handler);
    this.executeTests(response);
});
