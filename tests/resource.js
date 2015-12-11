module("Resource interface", {});

test("Check interface", function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/scene-loading.html");

    var test = frameLoaded.then(function (doc) {
        var resource = doc.XML3D.resource;

        ok(resource.registerFormatHandler.call, "registerFormatHandler exists");
        ok(resource.fetch.call, "fetch exists");
        ok(resource.getDocument.call, "getDocument exists");
        ok(resource.onRequest.call, "onRequest exists");
        ok(resource.URI.call, "URI exists");
        ok(resource.URIResolver.call, "URIResolver exists");

        ok(
            resource.FormatHandler.prototype.isFormatSupported &&
            resource.FormatHandler.prototype.getAdapter &&
            resource.FormatHandler.prototype.getFormatData &&
            resource.FormatHandler.prototype.getFragmentData,
            "FormatHandler is exposed properly");
    });

    test.fin(QUnit.start).done();
});

test("Check onRequest hook", function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/scene-loading.html");

    var test = frameLoaded.then(function (doc) {
        var xml3d = doc.XML3D;
        var hookTestDone = false;
        var hook = function(uri, request) {
            if (hookTestDone)
                return;
            ok(true, "Request hook was called");
            ok(uri instanceof xml3d.resource.URI, "URI was provided");
            ok(request.headers !== undefined &&
                request.priority !== undefined &&
                request.abort !== undefined, "Request object contained the expected fields");
            hookTestDone = true;
        };
        xml3d.resource.onRequest(hook);

        var abortHook = function(uri, request) {
            if (uri.fragment == "abortThisRequest") {
                request.abort = true;
            }
        };
        xml3d.resource.onRequest(abortHook);

        xml3d.resource.fetch("json/offsets.json").then(function(response) {
            ok(response !== undefined, "Request was completed");
        });
        xml3d.resource.fetch("json/offsets.json#abortThisRequest").then(function(doc) {
            ok(false, "Request should have been aborted");
        }).catch(function(e) {
            ok(e.name == "RequestAbortedException", "Request was properly aborted");
        });
    });

    test.fin(QUnit.start).done();
});

var TestFormatHandler = function() {
    XML3D.resource.FormatHandler.call(this);
};
XML3D.createClass(TestFormatHandler, XML3D.resource.FormatHandler);

TestFormatHandler.prototype.isFormatSupported = function (response) {
    ok(response, "isFormatSupported was called with response argument");
    return true;
};


TestFormatHandler.prototype.getFormatData = function (response) {
    ok(response, "getFormatData called with response argument");
    return response.json();
};

TestFormatHandler.prototype.getAdapter = function(data, aspect, canvasId) {
    ok(!!data && !!aspect && canvasId === 0, "getAdapter was called with correct arguments");
    return {getXflowNode : function() {return new Xflow.DataNode(false)}};
};

test("Custom format handler", function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/scene-loading.html");

    var test = frameLoaded.then(function (doc) {
        doc.XML3D.resource.registerFormatHandler(new TestFormatHandler());
        var xml3d = doc.getElementById("myXml3d_1");

        var testmesh = doc.createElement("mesh");
        testmesh.setAttribute("src", "json/simpleMesh.testjson"); //bogus file ending to make sure our test format handler is the only one to handle this response
        xml3d.appendChild(testmesh);
        return xml3d;

    }).then(promiseSceneRendered).then(function(xml3d) {
        // The mesh that was added above will not be rendered, will throw an error about missing 'position' data because
        // the test format handler was designed to return just an empty DataNode
        ok(true, "Scene was rendered again");
    });

    test.fin(QUnit.start).done();
});



