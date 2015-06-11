
function lameParse(text, constructor) {
    var exp = /([+\-0-9eE\.]+)/g;
    var m = text.match(exp);
    return m ? new constructor(m) : new constructor();
}

var XflowConstants = XML3DTestLib.XflowConstants;
var DataNode = XML3DTestLib.DataNode;
var VSConfig = XML3DTestLib.VSConfig;
var VertexShaderRequest = XML3DTestLib.VertexShaderRequest;

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
        var resType = "data";
        this.getDataAdapter = function(node){
            win.XML3D.flushDOMChanges();
            return win.XML3D.resource.getAdapter(node, resType);
        };

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

        var vsConfig = new VSConfig();

        var connect = testNode.getElementsByTagName("VSConfig")[0].firstElementChild;
        while (connect) {
            if (connect.nodeName == "VSConnection")
                this.VSConnection(connect, vsConfig);
            connect = connect.nextElementSibling;
        };

        vsConfig.addInputParameter(XflowConstants.DATA_TYPE.FLOAT4X4, "screenTransform", true);
        vsConfig.addCodeFragment("gl_Position = screenTransform * vec4(#I{position}, 1.0);");

        var dataAdapter = dataElement._configured.adapters;
        dataAdapter = dataAdapter[Object.keys(dataAdapter)[0]];
        var xflowNode = dataAdapter.getXflowNode();
        var request = new VertexShaderRequest(xflowNode, vsConfig);
        var result = request.getVertexShader();
        var code = result.getGLSLCode();
        var inputIdx = code.indexOf("// INPUT"), codeIdx = code.indexOf("// CODE"),
            outputIdx = code.indexOf("// OUTPUT");

        ok(inputIdx != -1 && codeIdx != -1 && outputIdx != -1,
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
        var type = XflowConstants.DATA_TYPE[typeString];
        if(!type)
            throw new Error("Unknown VS connection Type: " + typeString);
        var transform = XflowConstants.VS_ATTRIB_TRANSFORM[transformString] || XflowConstants.VS_ATTRIB_TRANSFORM.NONE;
        var name = node.getAttribute("in"), outName = node.getAttribute("out");
        vsConfig.addAttribute( type, node.getAttribute("in"), node.getAttribute("optional") == "true");
        var code = null;
        switch(transform){
            case XflowConstants.VS_ATTRIB_TRANSFORM.VIEW_NORMAL:
                vsConfig.addInputParameter(XflowConstants.DATA_TYPE.FLOAT3X3, "viewTransformNormal", true);
                code = outName + " = normalize( viewTransformNormal * #I{" + name + "} );"; break;
            case XflowConstants.VS_ATTRIB_TRANSFORM.VIEW_POINT:
                vsConfig.addInputParameter(XflowConstants.DATA_TYPE.FLOAT4X4, "viewTransform", true);
                code = outName + " = ( viewTransform * vec4( #I{" + name + "} , 1.0)).xyz;"; break;
            case XflowConstants.VS_ATTRIB_TRANSFORM.WORLD_NORMAL:
                vsConfig.addInputParameter(XflowConstants.DATA_TYPE.FLOAT3X3, "worldTransformNormal", true);
                code = outName + " = normalize( worldTransformNormal * vec4( #I{" + name + "} );"; break;
            case XflowConstants.VS_ATTRIB_TRANSFORM.WORLD_POINT:
                vsConfig.addInputParameter(XflowConstants.DATA_TYPE.FLOAT4X4, "worldTransform", true);
                code = outName + " = ( worldTransform * vec4( #I{" + name + "} , 1.0)).xyz;"; break;
        }
        vsConfig.channelAttribute(name, outName, code);
    },

    VSInputBufferCount: function(result, action, title){
        var count = action.getAttribute("count")*1;
        equal(result.inputNames.length, count, title + "=> Vertex Shader has " +
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
        equal(!result.isOutputFragmentUniform(name) && !result.isOutputNull(name),
                true, title + "=> Output '" + name + "' is varying.");
    },
    VSOutputIsNull: function(result, action, title){
        var name = action.getAttribute("name");
        equal(result.isOutputNull(name),
                true, title + "=> Output '" + name + "' is null.");
    },
    VSOutputIsUniform: function(result, action, title){
        var name = action.getAttribute("name");
        equal(result.isOutputFragmentUniform(name),
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

        var names = result.inputNames, entryName = null;
        for(var i =0; i < names.length; ++i){
            var name = names[i];
            if(result.getInputData(name) == shouldMatchData){
                entryName = name;
                break;
            }
        }
        ok(entryName, title + " => InputBuffer '" + shouldMatchName + "' is used");

        if(shouldBeUniform)
            equal(result.isInputUniform(entryName), true, title + " => InputBuffer '" + shouldMatchName + "' is uniform");
        else
            equal(result.isInputUniform(entryName), false, title + " => InputBuffer '" + shouldMatchName + "' is not uniform");
    },

    VSCodeMatchesRegexp: function(result, action, title){
        var regexp = new RegExp(action.getAttribute("regexp"));
        var code = result.getGLSLCode();
        ok(!!code.match(regexp), title + " => GLSL Code matches regexp: " + regexp);
    },

    Check : function(testNode) {
        this.win.XML3D.flushDOMChanges();
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
        stop();

        var shouldMatchName = action.getAttribute("reference").substring(1);
        var shouldMatchElement = this.doc.getElementById(shouldMatchName);
        var shouldMatchData = this.getXflowData(shouldMatchElement);
        var property = action.getAttribute("name");

        var dataAdapter = have._configured.adapters;
        dataAdapter = dataAdapter[Object.keys(dataAdapter)[0]];

        function executeTest() {
            var shouldMatchTexture = shouldMatchData.getValue().data;
            var adapterOutputs = dataAdapter.getComputeRequest().getResult();
            var dataOutput = adapterOutputs.getOutputData(property);
            var actualData;

            if (!dataOutput) {
                ok(false, title + "=> " + shouldMatchName + " in " + have.id + " matches reference data");
                start();
                return;
            }

            actualData = dataOutput.getValue().data;
            dataAdapter.xflowDataNode._getOrCreateChannelNode().clear();

            QUnit.closeArray(actualData, shouldMatchTexture, EPSILON, title + " => " + property + " in " + have.id + " matches expected data");
            start();
        }

        if (shouldMatchData.isLoading()) {
            var loadCheck = function (handle, notfication) {
                if (notfication === XflowConstants.DATA_ENTRY_STATE.LOAD_END || !shouldMatchData.isLoading()) {
                    shouldMatchData.removeListener(loadCheck);
                    executeTest();
                }
            }
            shouldMatchData.addListener(loadCheck);
        } else {
            executeTest();
        }
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
        input.textContent = newText;
    }


});


test("Test filter parsing", function() {
    var dataNode = new DataNode(false);
    var mapping;

    dataNode.setFilter("keep(position, normal, tangent)");
    strictEqual(dataNode.filterType, XflowConstants.DATA_FILTER_TYPE.KEEP, "Filter Type is 'keep'");
    mapping = dataNode.filterMapping;
    strictEqual(mapping.getName(0), "position", "First mapping name is 'position'");
    strictEqual(mapping.getName(1), "normal", "Second mapping name is 'normal'");
    strictEqual(mapping.getName(2), "tangent", "Third mapping name is 'tangent'");

    dataNode.setFilter("remove ( A , B )   ");
    strictEqual(dataNode.filterType, XflowConstants.DATA_FILTER_TYPE.REMOVE, "Filter Type is 'remove'");
    mapping = dataNode.filterMapping;
    strictEqual(mapping.getName(0), "A", "First mapping name is 'A'");
    strictEqual(mapping.getName(1), "B", "Second mapping name is 'B'");

    dataNode.setFilter("rename ({newA : oldA , newB:oldB, newC: oldB})  ");
    strictEqual(dataNode.filterType, XflowConstants.DATA_FILTER_TYPE.RENAME , "Filter Type is 'rename'");
    mapping = dataNode.filterMapping;
    strictEqual(mapping.getDestName(0), "newA", "First destination name is 'newA'");
    strictEqual(mapping.getDestName(1), "newB", "Second destination name is 'newB'");
    strictEqual(mapping.getDestName(2), "newC", "Third destination name is 'newC'");
    strictEqual(mapping.getSrcName(0), "oldA", "First source name is 'oldA'");
    strictEqual(mapping.getSrcName(1), "oldB", "Second source name is 'oldB'");
    strictEqual(mapping.getSrcName(2), "oldB", "Third source name is 'oldB'");

    dataNode.setFilter("keep( {DEST : A, DEST :B , DEST: C , C2: A } ) ");
    strictEqual(dataNode.filterType, XflowConstants.DATA_FILTER_TYPE.KEEP , "Filter Type is 'keep'");
    mapping = dataNode.filterMapping;
    strictEqual(mapping.getDestName(0), "DEST", "First destination name is 'DEST'");
    strictEqual(mapping.getDestName(1), "C2", "Second destination name is 'C2'");
    strictEqual(mapping.getSrcName(0), "C", "First source name is 'C'");
    strictEqual(mapping.getSrcName(1), "A", "Second source name is 'A'");
});


test("Test compute parsing", function() {
    var dataNode = new DataNode(false);
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
//
//test("Operator - Platform fallback - JS", function() {
//	var xflowGraph = XML3D.data.xflowGraph;
//
//	if (xflowGraph.platform !== Xflow.PLATFORM.JAVASCRIPT) {
//		console.log("Operator - Platform fallback - JS tests were not executed because Xflow platform is not JavaScript.");
//		return true;
//	}
//
//	var handler = getHandler(this.doc.getElementById("xml3dElem"));
//	var response = this.loadTestXML("./xflow-xml/basic/test_platform_fallback_js.xml", handler);
//	this.executeTests(response);
//});
//
//test("Operator - Platform fallback - WebCL", function () {
//	var xflowGraph = XML3D.data.xflowGraph;
//
//	if (xflowGraph.platform !== Xflow.PLATFORM.CL) {
//		console.log("Operator - Platform fallback - WebCL tests were not executed because WebCL platform is not available.");
//		return true;
//	}
//
//	var handler = getHandler(this.doc.getElementById("xml3dElem"));
//	var response = this.loadTestXML("./xflow-xml/basic/test_platform_fallback_cl.xml", handler);
//	this.executeTests(response);
//});

test("Operator - Platform attribute - JS", function () {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/basic/test_platform_js.xml", handler);
    this.executeTests(response);
});
//
//test("Operator - Platform attribute - WebCL", function () {
//	var xflowGraph = XML3D.data.xflowGraph;
//
//	if (xflowGraph.platform !== Xflow.PLATFORM.CL) {
//		console.log("Operator - Platform - WebCL tests were not executed because WebCL platform is not available.");
//		return true;
//	}
//
//	var handler = getHandler(this.doc.getElementById("xml3dElem"));
//	var response = this.loadTestXML("./xflow-xml/basic/test_platform_cl.xml", handler);
//	this.executeTests(response);
//});

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


/*
TODO: Feature not used currently, will be reintegrated with proper shade.js integration in VS generation
test("GLSL with 3x Morph", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/glsl_output/test_glsl_morphing.xml", handler);
    this.executeTests(response);
});
*/

test("GLSL with Uniforms", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/glsl_output/test_glsl_uniform.xml", handler);
    this.executeTests(response);
});

/*
TODO: Feature not used currently, will be reintegrated with proper shade.js integration in VS generation
test("GLSL with Processing on Uniforms", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/glsl_output/test_glsl_uniform_processing.xml", handler);
    this.executeTests(response);
});
*/

//test("WebCL Image Processing", function () {
//	var xflowGraph = XML3D.data.xflowGraph;
//	var handler = getHandler(this.doc.getElementById("xml3dElem"));
//	var response = this.loadTestXML("./xflow-xml/webcl_output/test_webcl_image_processing.xml", handler);
//
//	if (xflowGraph.platform !== Xflow.PLATFORM.CL) {
//		console.log("WebCL Image Processing tests could not be executed because WebCL platform is not available");
//		return true;
//	}
//	this.executeTests(response);
//});


test("Errors with empty arguments", function() {
    var handler = getHandler(this.doc.getElementById("xml3dElem"));
    var response = this.loadTestXML("./xflow-xml/error/test_empty_argument.xml", handler);
    this.executeTests(response);
});


module("Xflow External Operators", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.win = document.getElementById("xml3dframe").contentWindow;
            that.doc = document.getElementById("xml3dframe").contentDocument;
            // This overriding function is for the test "Dataflows - External Operators"
            that.win.XML3D.debug.logError = function() {
                if (arguments[0] && arguments[0].indexOf("No operator 'xflow.add3'") != -1) {
                    window.forceTestFail = true;
                }
                that.win.XML3D.debug.doLog(XML3D.debug.ERROR, arguments);
            };
            start();
        };
        loadDocument("scenes/data-xflow-external-operators.html"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Dataflows - External Operators", function() {
    var xml3dElem = this.doc.getElementById("xml3dElem");
    var mesh = this.doc.getElementById("mesh1");

    var loaded = function() {
        start();
        // The only way to reliably detect this fail state is through the error message thrown by XML3D
        ok(!window.forceTestFail, "External operators were loaded without errors");
        var positions = mesh.getResult()._entries.position;
        QUnit.closeArray(positions.value, [3,2,2,2,1,2], EPSILON, "Dataflow positions were correctly computed");
    };
    if (!xml3dElem.complete) {
        xml3dElem.addEventListener("load", loaded);
        stop();
    } else {
        stop();
        loaded();
    }
});

test("Dataflows - External Operators with multiple uses", function() {
    var xml3dElem = this.doc.getElementById("xml3dElem");
    var mesh = this.doc.getElementById("mesh3");
    var loaded = function() {
        start();
        var positions2 = mesh.getResult()._entries.position;
        QUnit.closeArray(positions2.value, [5,3,3,2,0,2], EPSILON, "Multiple uses of the same external operator");
    };
    if (!xml3dElem.complete) {
        xml3dElem.addEventListener("load", loaded);
        stop();
    } else {
        stop();
        loaded();
    }
});

test("Data - External Operators", function() {
    var xml3dElem = this.doc.getElementById("xml3dElem");
    var mesh = this.doc.getElementById("mesh2");
    var loaded = function() {
        start();
        var positions = mesh.getResult()._entries.position;
        QUnit.closeArray(positions.value, [3,2,2,2,1,2], EPSILON, "Data positions were correctly computed");
    };
    if (!xml3dElem.complete) {
        xml3dElem.addEventListener("load", loaded);
        stop();
    } else {
        stop();
        loaded();
    }
});

test("Dataflow - Swap external input back and forth", function() {
    var xml3dElem = this.doc.getElementById("xml3dElem");
    var mesh = this.doc.getElementById("mesh4");
    var offsetInput = this.doc.getElementById("offsetInput");

    var testStep = 0;
    var framedrawn = function() {
        var positions;
        if (testStep === 0) {
            start();
            positions = mesh.getResult()._entries.position;
            QUnit.closeArray(positions.value, [-1.0,1.0,-10.0,1.0,1.0,-10.0,-1.0,3.0,-10.0,1.0,3.0,-10.0], EPSILON, "Offset positions were correctly computed");
            offsetInput.setAttribute("src", "json/offsets1.json");
            testStep++;
            stop();
        } else if(testStep === 1) {
            start();
            positions = mesh.getResult()._entries.position;
            if (!positions) {
                stop();
                return;
            }
            QUnit.closeArray(positions.value, [-1.0,-3.0,-10.0,1.0,-3.0,-10.0,-1.0,-1.0,-10.0,1.0,-1.0,-10.0], EPSILON, "Offset1 positions were correctly computed");
            offsetInput.setAttribute("src", "json/offsets.json");
            testStep++;
            stop();
        } else if(testStep === 2) {
            start();
            positions = mesh.getResult()._entries.position;
            QUnit.closeArray(positions.value, [-1.0,1.0,-10.0,1.0,1.0,-10.0,-1.0,3.0,-10.0,1.0,3.0,-10.0], EPSILON, "Offset positions were correctly computed");
            testStep++;
        }
    };
    var loaded = function() {
        xml3dElem.addEventListener("framedrawn", framedrawn);
        var handler = getHandler(xml3dElem);
        handler.draw();
    };
    stop();
    if (!xml3dElem.complete) {
        xml3dElem.addEventListener("load", loaded);
    } else {
        loaded();
    }

});
