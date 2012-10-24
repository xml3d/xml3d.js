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

test("Get Local Adapters", function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        hTest = getHandler(xTest);
    var XML3D = this.window.XML3D;

    var handle = XML3D.base.resourceManager.getAdapterHandle(this.doc, "#transform1", XML3D.webgl, hTest.id);

    ok(handle.hasAdapter(), "Handle of #transform1 has XML3D.webgl adapter ");
    ok(handle.status == XML3D.base.AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
    ok(handle.getAdapter() instanceof XML3D.webgl.TransformRenderAdapter,
        "Adapter is instanceof XML3D.webgl.TransformRenderAdapter");

    handle = XML3D.base.resourceManager.getAdapterHandle(this.doc, "#data1", XML3D.data);
    ok(handle.hasAdapter(), "Handle of #data1 has XML3D.data adapter");
    ok(handle.status == XML3D.base.AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
    ok(handle.getAdapter() instanceof XML3D.data.DataAdapter,
        "Adapter is instanceof XML3D.data.DataAdapter");

    handle = XML3D.base.resourceManager.getAdapterHandle(this.doc, "#shader1", XML3D.data);
    ok(handle.hasAdapter(), "Handle of #shader1 has XML3D.data adapter");
    ok(handle.status == XML3D.base.AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
    ok(handle.getAdapter() instanceof XML3D.data.DataAdapter,
        "Adapter is instanceof XML3D.data.DataAdapter");

    handle = XML3D.base.resourceManager.getAdapterHandle(this.doc, "#shader1", XML3D.webgl, hTest.id);
    ok(handle.hasAdapter(), "Handle of #shader1 has XML3D.webgl adapter");
    ok(handle.status == XML3D.base.AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
    ok(handle.getAdapter() instanceof XML3D.webgl.ShaderRenderAdapter,
        "Adapter is instanceof XML3D.webgl.ShaderRenderAdapter");

    handle = XML3D.base.resourceManager.getAdapterHandle(this.doc, "#group1", XML3D.webgl, hTest.id);
    ok(handle.hasAdapter(), "Handle of #group1 has XML3D.webgl adapter");
    ok(handle.status == XML3D.base.AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
    ok(handle.getAdapter() instanceof XML3D.webgl.GroupRenderAdapter,
        "Adapter is instanceof XML3D.webgl.GroupRenderAdapter");

    handle = XML3D.base.resourceManager.getAdapterHandle(this.doc, "#mesh1", XML3D.data);
    ok(handle.hasAdapter(), "Handle of #mesh1 has XML3D.data adapter");
    ok(handle.status == XML3D.base.AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
    ok(handle.getAdapter() instanceof XML3D.data.DataAdapter,
        "Adapter is instanceof XML3D.data.DataAdapter");

    handle = XML3D.base.resourceManager.getAdapterHandle(this.doc, "#mesh1", XML3D.webgl, hTest.id);
    ok(handle.hasAdapter(), "Handle of #mesh1 has XML3D.webgl adapter");
    ok(handle.status == XML3D.base.AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
    ok(handle.getAdapter() instanceof XML3D.webgl.MeshRenderAdapter,
        "Adapter is instanceof XML3D.webgl.MeshRenderAdapter");
});

test("Get External Adapters", function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        hTest = getHandler(xTest);
    var XML3D = this.window.XML3D;

    var handle = XML3D.base.resourceManager.getAdapterHandle(this.doc, "xml/meshes.xml#simpleMesh", XML3D.data);
    ok(!handle.hasAdapter(), "Handle of 'xml/meshes.xml#simpleMesh' has no XML3D.data adapter yet");
    ok(handle.status == XML3D.base.AdapterHandle.STATUS.LOADING, "Handle status is 'LOADING'" );

    var self = this;
    handle.addListener(function(e){
        ok(handle == e.adapterHandle, "Event has correct AdapterHandle");
        ok(handle.hasAdapter(), "Handle has XML3D.data adapter now");
        ok(handle.status == XML3D.base.AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
        ok(handle.getAdapter() instanceof XML3D.data.DataAdapter,
            "Adapter is instanceof XML3D.data.DataAdapter");

        handle = XML3D.base.resourceManager.getAdapterHandle(self.doc, "xml/meshes.xml#simpleMesh2", XML3D.data);
        ok(handle.hasAdapter(), "Handle of 'xml/meshes.xml#simpleMesh2' has XML3D.data adapter, immediately");
        ok(handle.status == XML3D.base.AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
        ok(handle.getAdapter() instanceof XML3D.data.DataAdapter,
            "Adapter is instanceof XML3D.data.DataAdapter");

        handle = XML3D.base.resourceManager.getAdapterHandle(self.doc, "xml/meshes.xml#indirect", XML3D.data);
        ok(handle.hasAdapter(), "Handle of 'xml/meshes.xml#indirect' has XML3D.data adapter, immediately");
        ok(handle.status == XML3D.base.AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
        ok(handle.getAdapter() instanceof XML3D.data.DataAdapter,
            "Adapter is instanceof XML3D.data.DataAdapter");

        var handle2 = XML3D.base.resourceManager.getAdapterHandle(self.doc, "xml/shaders.xml#flatgreen2",
            XML3D.webgl, hTest.id);
        ok(!handle2.hasAdapter(), "Handle of 'xml/shaders.xml#flatgreen2' has no XML3D.webgl adapter yet");
        ok(handle2.status == XML3D.base.AdapterHandle.STATUS.LOADING, "Handle status is 'LOADING'" );

        handle2.addListener(function(e){

            ok(handle2 == e.adapterHandle, "Event has correct AdapterHandle");
            ok(handle2.hasAdapter(), "Handle has XML3D.webgl adapter now");
            ok(handle2.status == XML3D.base.AdapterHandle.STATUS.READY, "Handle status is 'READY'" );
            ok(handle2.getAdapter() instanceof XML3D.webgl.ShaderRenderAdapter,
                "Adapter is instanceof XML3D.webgl.ShaderRenderAdapter");

            start();
        });

    });

    stop();
});

test("Get Missing Handles", function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        hTest = getHandler(xTest);
    var XML3D = this.window.XML3D;

    var handle = XML3D.base.resourceManager.getAdapterHandle(this.doc, "#mesh2", XML3D.data);
    ok(!handle.hasAdapter(), "Handle of '#mesh2' has no XML3D.data adapter");
    ok(handle.status == XML3D.base.AdapterHandle.STATUS.NOT_FOUND, "Handle status is 'NOT_FOUND'" );

    handle = XML3D.base.resourceManager.getAdapterHandle(this.doc, "xml/doesNotExists.xml#nope", XML3D.data);
    ok(!handle.hasAdapter(), "Handle of 'xml/doesNotExists.xml#nope' (non existent document) has no adapter");
    ok(handle.status == XML3D.base.AdapterHandle.STATUS.LOADING, "Handle status is 'LOADING'" );

    var node = this.doc.getElementById("mesh1");

    var self = this;
    handle.addListener(function(e){
        ok(handle == e.adapterHandle, "Event has correct AdapterHandle");
        ok(e.type = XML3D.events.ADAPTER_HANDLE_NOT_FOUND, "Event type is 'ADAPTER_HANDLE_NOT_FOUND'");
        ok(!handle.hasAdapter(), "Handle still doesn't have any adapter");

        var handle2 = XML3D.base.resourceManager.getAdapterHandle(self.doc, "xml/meshes.xml#nope", XML3D.data);
        ok(!handle2.hasAdapter(), "Handle of 'xml/meshes.xml#nope' (non existent id) has no adapter");
        ok(handle2.status == XML3D.base.AdapterHandle.STATUS.LOADING, "Handle status is 'LOADING'" );

        handle2.addListener(function(e){
            ok(handle2 == e.adapterHandle, "Event has correct AdapterHandle");
            ok(e.type = XML3D.events.ADAPTER_HANDLE_NOT_FOUND, "Event type is 'ADAPTER_HANDLE_NOT_FOUND'");
            ok(!handle2.hasAdapter(), "Handle still doesn't have any adapter");

            handle2 = XML3D.base.resourceManager.getAdapterHandle(self.doc, "xml/meshes.xml#nope2", XML3D.data);
            ok(!handle2.hasAdapter(), "Handle of 'xml/meshes.xml#nope2' (non existent id) has no adapter");
            ok(handle2.status == XML3D.base.AdapterHandle.STATUS.NOT_FOUND, "Handle status is 'NOT_FOUND' (not 'LOADING')" );

            var handle3 = XML3D.base.resourceManager.getAdapterHandle(self.doc, "#mesh2", XML3D.data);
            ok(handle3.status == XML3D.base.AdapterHandle.STATUS.NOT_FOUND, "Handle of '#mesh2' has still status is 'NOT_FOUND'" );
            handle3.addListener(function(e){
                ok(handle3 == e.adapterHandle, "Event has correct AdapterHandle");
                ok(e.type = XML3D.events.ADAPTER_HANDLE_CHANGED, "Event type is 'ADAPTER_HANDLE_CHANGED'");
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
        hTest = getHandler(xTest);
    var XML3D = this.window.XML3D;

    var node = this.doc.getElementById("mesh1");
    var dataHandle1 = XML3D.base.resourceManager.getAdapterHandle(this.doc, "#mesh1", XML3D.data);
    var dataHandle2 = XML3D.base.resourceManager.getAdapterHandle(this.doc, "#mesh1", XML3D.data);
    var webglHandle = XML3D.base.resourceManager.getAdapterHandle(this.doc, "#mesh1", XML3D.webgl, hTest.id);
    dataHandle1.addListener(function(e){
        ok(true, "First Data Adapter got notified");
        ok(e.type == XML3D.events.ADAPTER_HANDLE_CHANGED, "Event has correct type");
    });
    dataHandle2.addListener(function(e){
        ok(true, "Second Data Adapter got notified");
        ok(e.type == XML3D.events.ADAPTER_HANDLE_CHANGED, "Event has correct type");
    });
    webglHandle.addListener(function(e){
        ok(true, "WebGL Adapter got notified");
        ok(e.type == XML3D.events.ADAPTER_HANDLE_CHANGED, "Event has correct type");
    });
    XML3D.base.resourceManager.notifyNodeAdapterChange(node, XML3D.webgl, hTest.id, XML3D.events.ADAPTER_HANDLE_CHANGED);
    XML3D.base.resourceManager.notifyNodeAdapterChange(node, XML3D.data, 0, XML3D.events.ADAPTER_HANDLE_CHANGED);
});

