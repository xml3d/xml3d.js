module("WebGL States", {});

// The supported states are repeated here to ensure tests are written for any new states added to the RI
var SupportedStates = ["depthMask", "depthTest", "depthFunc", "blendEquationSeparate",
    "blendFuncSeparate", "blend", "cullFace", "cullFaceMode", "colorMask", "scissorTest", "scissor"];

test("Tested states match those provided by RenderInterface", function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-states.html");

    var test = frameLoaded.then(function (doc) {
        var xml3d = doc.querySelector("#xml3DElem");
        var ri = xml3d.getRenderInterface();

        ok(SupportedStates.length == ri.getConfigurableGLStates().length, "Number of tested states matches states provided by RI");

        var statesOk = true;
        for (var i=0; i < SupportedStates.length; i++) {
            var stateKey = SupportedStates[i];
            var state = ri.glStateMap[stateKey];
            if (!state || state.default === undefined || state.set === undefined) {
                statesOk = false;
            }
        }

        ok(statesOk, "States are properly defined in RenderInterface.glStateMap");

        return xml3d;
    });

    test.fin(QUnit.start).done();

});

function checkStateValue(state, key, value) {
    if (state[key] === undefined) {
        return false;
    }
    for (var i=0; i < value.length; i++) {
        if (state[key][i] !== value[i])
            return false;
    }
    return true;
}

test("Parse supported states with valid inputs", function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-states.html");

    var test = frameLoaded.then(function (doc) {
        var xml3d = doc.querySelector("#xml3DElem");
        var ri = xml3d.getRenderInterface();
        var gl = ri.context.gl;
        var doneTest = false;
        ri.setGLState = function(state) {
            if (!doneTest) {
                ok(checkStateValue(state, "depthMask", [false]), "depthMask parsed correctly");
                ok(checkStateValue(state, "depthTest", [false]), "depthTest parsed correctly");
                ok(checkStateValue(state, "depthFunc", [gl.NEVER]), "depthFunc parsed correctly");
                ok(checkStateValue(state, "blendEquationSeparate", [gl.FUNC_ADD, gl.FUNC_SUBTRACT]), "blendEquationSeparate parsed correctly");
                ok(checkStateValue(state, "blendFuncSeparate", [gl.DST_COLOR, gl.ONE_MINUS_DST_ALPHA]), "blendFuncSeparate parsed correctly");
                ok(checkStateValue(state, "blend", [true]), "blend parsed correctly");
                ok(checkStateValue(state, "cullFace", [false]), "cullFace parsed correctly");
                ok(checkStateValue(state, "cullFaceMode", [gl.FRONT]), "cullFaceMode parsed correctly");
                ok(checkStateValue(state, "colorMask", [true, true, true, false]), "colorMask parsed correctly");
                ok(checkStateValue(state, "scissorTest", [true]), "scissorTest parsed correctly");
                ok(checkStateValue(state, "scissor", [10, 10, 50, 50]), "scissor parsed correctly");
            }
            doneTest = true;
        };

        var mesh = doc.createElement("mesh");
        mesh.src = "#meshdata";
        mesh.setAttribute("material", "#allSupportedStatesValid");
        xml3d.appendChild(mesh);

        return xml3d;
    }).then(promiseSceneRendered);

    test.fin(QUnit.start).done();

});



