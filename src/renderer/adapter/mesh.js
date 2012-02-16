//Adapter for <mesh>
(function() {

	var XML3DMeshRenderAdapter = function(factory, node) {
	    xml3d.webgl.RenderAdapter.call(this, factory, node);

	    this.processListeners();
	    this.dataAdapter = factory.renderer.dataFactory.getAdapter(this.node);
	    this.dataAdapter.registerObserver(this);

	    this.passChangeToObject = function(evt) {
	        xml3d.debug.logError("Mesh adapter has no callback to its mesh object!");
	    };
	};

	xml3d.createClass(XML3DMeshRenderAdapter, xml3d.webgl.RenderAdapter);

	var p = XML3DMeshRenderAdapter.prototype;

	p.processListeners  = function() {
	    var attributes = this.node.attributes;
	    for (var index in attributes) {
	        var att = attributes[index];
	        if (!att.name)
	            continue;

	        var type = att.name;
	        if (type.match(/onmouse/) || type == "onclick") {
	            var eventType = type.substring(2);
	            this.node.addEventListener(eventType,  new Function("evt", att.value), false);
	        }
	    }
	};

	p.registerCallback = function(callback) {
		if (callback instanceof Function)
			this.passChangeToObject = callback;
	};

	p.notifyChanged = function(evt) {
		if (evt.eventType == MutationEvent.REMOVAL)
			return this.factory.renderer.sceneTreeRemoval(evt);

	    this.passChangeToObject(evt);
	};

	p.notifyDataChanged = function(evt) {
	     //TODO: fix object form
	    this.passChangeToObject(evt);
	};

	// TODO: move to xflow manager
	p.applyXFlow = function(shader, parameters) {
		var dataTable = this.dataAdapter.createDataTable();

		if (dataTable["xflowShader"]) {
			var xflowShader = dataTable["xflowShader"];

			var declarations = xflowShader.declarations;
			var body = xflowShader.body;
			shader.program = shader.getXFlowShader(declarations, body);

			for (var p in xflowShader.uniforms) {
				var data = xflowShader.uniforms[p].data;
				if (data.length < 2)
					data = data[0];

				parameters[p] = data;
			}
		}

	};


	p.dispose = function(evt) {
		this.passChangeToObject(evt);
	};

    p.getBoundingBox = function() {
        var bbox = new XML3DBox();
        var dataTable = this.dataAdapter.createDataTable();
        if(dataTable && dataTable.position)
            bbox = xml3d.webgl.calculateBoundingBox(dataTable.position.data,dataTable.index.data);
        return bbox;
    };

    // Export to xml3d.webgl namespace
    xml3d.webgl.XML3DMeshRenderAdapter = XML3DMeshRenderAdapter;

}());