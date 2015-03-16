module("Adapter Handles", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            that.window = document.getElementById("xml3dframe").contentWindow;
            start();
        };
        loadDocument("scenes/adapter-handles.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

var Events = XML3DTestLib.Events;
var AdapterHandle = XML3DTestLib.AdapterHandle;

test("Get Local Adapters", function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        canvasId = getCanvasId(xTest);
    var XML3D = this.window.XML3D;

    var handle = XML3D.resource.getAdapterHandle(this.doc.URL, "#transform1", "data", 0);

    ok(handle.hasAdapter(), "Handle of #transform1 has 'data' adapter ");
    ok(handle.status == AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
    equal(handle.getAdapter().node.nodeName, "transform", "Adapter adapts transform");

    handle = XML3D.resource.getAdapterHandle(this.doc.URL, "#data1", "data");
    ok(handle.hasAdapter(), "Handle of #data1 has 'data' adapter");
    ok(handle.status == AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
    equal(handle.getAdapter().node.nodeName, "data", "Adapter adapts data");

    handle = XML3D.resource.getAdapterHandle(this.doc.URL, "#shader1", "data");
    ok(handle.hasAdapter(), "Handle of #shader1 has 'data' adapter");
    ok(handle.status == AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
    equal(handle.getAdapter().node.nodeName, "shader", "Adapter adapts shader");

    handle = XML3D.resource.getAdapterHandle(this.doc.URL, "#shader1", 'webgl', canvasId);
    ok(handle.hasAdapter(), "Handle of #shader1 has 'webgl' adapter");
    ok(handle.status == AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
    equal(handle.getAdapter().factory.aspect, "webgl", "Adapter has right aspect");

    handle = XML3D.resource.getAdapterHandle(this.doc.URL, "#group1", "webgl", canvasId);
    ok(handle.hasAdapter(), "Handle of #group1 has 'webgl' adapter");
    ok(handle.status == AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
    // TODO: No access to adapters
    //ok(handle.getAdapter() instanceof XML3D.webgl.GroupRenderAdapter,"Adapter is instanceof XML3D.webgl.GroupRenderAdapter");

    handle = XML3D.resource.getAdapterHandle(this.doc.URL, "#mesh1", "data");
    ok(handle.hasAdapter(), "Handle of #mesh1 has 'data' adapter");
    ok(handle.status == AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
    equal(handle.getAdapter().node.nodeName, "mesh", "Adapter adapts mesh");

    handle = XML3D.resource.getAdapterHandle(this.doc.URL, "#mesh1", 'webgl', canvasId);
    ok(handle.hasAdapter(), "Handle of #mesh1 has 'webgl' adapter");
    ok(handle.status == AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
    // TODO: No access to adapters
    //ok(handle.getAdapter() instanceof XML3D.webgl.MeshRenderAdapter, "Adapter is instanceof XML3D.webgl.MeshRenderAdapter");
    equal(handle.getAdapter().factory.aspect, 'webgl', "Adapter has right aspect");

});

test("Get External Adapters", 17, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        canvasId = getCanvasId(xTest);
    var XML3D = this.window.XML3D;

    var handle = XML3D.resource.getAdapterHandle(this.doc.URL, "xml/meshes.xml#simpleMesh", "data");
    ok(!handle.hasAdapter(), "Handle of 'xml/meshes.xml#simpleMesh' has no 'data' adapter yet");
    ok(handle.status == AdapterHandle.STATUS.LOADING, "Handle status is 'LOADING'" );

    var self = this;
    handle.addListener(function(e){
        ok(handle == e.adapterHandle, "Event has correct AdapterHandle");
        ok(handle.hasAdapter(), "Handle has 'data' adapter now");
        ok(handle.status == AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
        // TODO: ok(handle.getAdapter() instanceof 'data'.DataAdapter, "Adapter is instanceof 'data'.DataAdapter");

        handle = XML3D.resource.getAdapterHandle(self.doc.URL, "xml/meshes.xml#simpleMesh2", "data");
        ok(handle.hasAdapter(), "Handle of 'xml/meshes.xml#simpleMesh2' has 'data' adapter, immediately");
        ok(handle.status == AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
        // TODO: ok(handle.getAdapter() instanceof 'data'.DataAdapter, "Adapter is instanceof 'data'.DataAdapter");

        handle = XML3D.resource.getAdapterHandle(self.doc.URL, "xml/meshes.xml#indirect", "data");
        ok(handle.hasAdapter(), "Handle of 'xml/meshes.xml#indirect' has 'data' adapter, immediately");
        ok(handle.status == AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
        // TODO: ok(handle.getAdapter() instanceof 'data'.DataAdapter, "Adapter is instanceof 'data'.DataAdapter");

        var handle2 = XML3D.resource.getAdapterHandle(self.doc.URL, "xml/shaders.xml#flatgreen2",
            'webgl', canvasId);
        ok(!handle2.hasAdapter(), "Handle of 'xml/shaders.xml#flatgreen2' has no 'webgl' adapter yet");
        ok(handle2.status == AdapterHandle.STATUS.LOADING, "Handle status is 'LOADING'" );

        handle2.addListener(function(e){

            ok(handle2 == e.adapterHandle, "Event has correct AdapterHandle");
            ok(handle2.hasAdapter(), "Handle has 'webgl' adapter now");
            ok(handle2.status == AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
            equal(handle2.getAdapter().factory.aspect, 'webgl', "Adapter has right aspect");
            // TODO: No access to RenderAdapter
            //ok(handle2.getAdapter() instanceof XML3D.webgl.ShaderRenderAdapter, "Adapter is instanceof XML3D.webgl.ShaderRenderAdapter");

            start();
        });

    });

    stop();
});

test("Get Missing Handles", function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        hTest = getHandler(xTest);
    var XML3D = this.window.XML3D;

    var handle = XML3D.resource.getAdapterHandle(this.doc.URL, "#mesh2", "data");
    ok(!handle.hasAdapter(), "Handle of '#mesh2' has no 'data' adapter");
    ok(handle.status == AdapterHandle.STATUS.NOT_FOUND, "Handle status is 'NOT_FOUND'" );

    handle = XML3D.resource.getAdapterHandle(this.doc.URL, "xml/doesNotExists.xml#nope", "data");
    ok(!handle.hasAdapter(), "Handle of 'xml/doesNotExists.xml#nope' (non existent document) has no adapter");
    ok(handle.status == AdapterHandle.STATUS.LOADING, "Handle status is 'LOADING'" );

    var node = this.doc.getElementById("mesh1");

    var self = this;
    handle.addListener(function(e){
        ok(handle == e.adapterHandle, "Event has correct AdapterHandle");
        ok(e.type = Events.ADAPTER_HANDLE_CHANGED, "Event type is 'ADAPTER_HANDLE_CHANGED'");
        ok(e.handleStatus = AdapterHandle.STATUS.NOT_FOUND, "Event handleStatus is 'NOT_FOUND'");
        ok(!handle.hasAdapter(), "Handle still doesn't have any adapter");

        var handle2 = XML3D.resource.getAdapterHandle(self.doc.URL, "xml/meshes.xml#nope", "data");
        ok(!handle2.hasAdapter(), "Handle of 'xml/meshes.xml#nope' (non existent id) has no adapter");
        ok(handle2.status == AdapterHandle.STATUS.LOADING, "Handle status is 'LOADING'" );

        handle2.addListener(function(e){
            ok(handle2 == e.adapterHandle, "Event has correct AdapterHandle");
            ok(e.type = Events.ADAPTER_HANDLE_CHANGED, "Event type is 'ADAPTER_HANDLE_CHANGED'");
            ok(e.handleStatus = AdapterHandle.STATUS.NOT_FOUND, "Event type is 'NOT_FOUND'");
            ok(!handle2.hasAdapter(), "Handle still doesn't have any adapter");

            handle2 = XML3D.resource.getAdapterHandle(self.doc.URL, "xml/meshes.xml#nope2", "data");
            ok(!handle2.hasAdapter(), "Handle of 'xml/meshes.xml#nope2' (non existent id) has no adapter");
            ok(handle2.status == AdapterHandle.STATUS.NOT_FOUND, "Handle status is 'NOT_FOUND' (not 'LOADING')" );

            var handle3 = XML3D.resource.getAdapterHandle(self.doc.URL, "#mesh2", "data");
            ok(handle3.status == AdapterHandle.STATUS.NOT_FOUND, "Handle of '#mesh2' has still status is 'NOT_FOUND'" );
            handle3.addListener(function(e){
                ok(handle3 == e.adapterHandle, "Event has correct AdapterHandle");
                ok(e.type = Events.ADAPTER_HANDLE_CHANGED, "Event type is 'ADAPTER_HANDLE_CHANGED'");
                ok(handle3.hasAdapter(), "Handle of '#mesh2' has adapter now!");

            });

            ok(true, "Change id from '#mesh1' to '#mesh2'");
            node.id = "mesh2";

            start();
        });
    });

    stop();
});

test("Notify Adapters", 8, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        canvasId = getCanvasId(xTest);
    var XML3D = this.window.XML3D;

    var node = this.doc.getElementById("mesh1");
    var dataHandle1 = XML3D.resource.getAdapterHandle(this.doc.URL, "#mesh1", "data");
    var dataHandle2 = XML3D.resource.getAdapterHandle(this.doc.URL, "#mesh1", "data");
    var webglHandle = XML3D.resource.getAdapterHandle(this.doc.URL, "#mesh1", "webgl", canvasId);
    dataHandle1.addListener(function(e){
        ok(true, "First Data Adapter got notified");
        ok(e.type == Events.ADAPTER_HANDLE_CHANGED, "Event has correct type");
    });
    dataHandle2.addListener(function(e){
        ok(true, "Second Data Adapter got notified");
        ok(e.type == Events.ADAPTER_HANDLE_CHANGED, "Event has correct type");
    });
    webglHandle.addListener(function(e){
        ok(true, "WebGL Adapter got notified");
        ok(e.type == Events.ADAPTER_HANDLE_CHANGED, "Event has correct type");
    });
    XML3D.resource.notifyNodeAdapterChange(node, 'webgl', canvasId, Events.ADAPTER_HANDLE_CHANGED);
    XML3D.resource.notifyNodeAdapterChange(node, "data", 0, Events.ADAPTER_HANDLE_CHANGED);
});

