// Adapter for <shader>
(function() {

	var XML3DShaderRenderAdapter = function(factory, node) {
		XML3D.webgl.RenderAdapter.call(this, factory, node);
		this.renderer = this.factory.renderer;

		this.dataAdapter = this.renderer.dataFactory.getAdapter(this.node);
		this.table = new XML3D.data.ProcessTable(this, [], this.dataChanged);
		this.computeRequest;
	};

	XML3D.createClass(XML3DShaderRenderAdapter, XML3D.webgl.RenderAdapter);
	var p = XML3DShaderRenderAdapter.prototype;

	p.notifyChanged = function(evt) {
		if (evt.type == 0) {
			this.factory.renderer.sceneTreeAddition(evt);
			return;
		} else if (evt.type == 2) {
			this.factory.renderer.sceneTreeRemoval(evt);
			return;
		} else if (evt.type == 5) {
			var target = evt.wrapped.target;
			if (target && target.nodeName == "texture") {
				// A texture was removed completely, so this shader has to be recompiled
				this.renderer.recompileShader(this);
			}
			return;
		}

		var target = evt.internalType || evt.attrName || evt.wrapped.attrName;

		switch (target) {
		case "script":
			this.renderer.recompileShader(this);
			break;

		case "src":
			//A texture was changed
			var texNode = evt.wrapped.target;

			texNode = texNode.parentNode;

			var texName = texNode.name;
			this.renderer.shaderDataChanged(this, target, evt.wrapped.newValue, texName);
			break;

		default:
			XML3D.debug.logWarning("Unhandled mutation event in shader adapter for parameter '"+target+"'");
			break;

		}

	};

	p.requestData = function(parameters) {
	    if (!this.computeRequest) {
    	    var that = this;
            this.computeRequest = this.dataAdapter.getComputeRequest(null,
                function(request, changeType) {
                    that.notifyDataChanged.call(that, request, changeType);
            });
	    }
	    return this.computeRequest.getResult();
	};

	p.notifyDataChanged = function(request, changeType) {
	   //TODO: adapt the change notification system to the new xflow

	    /*
		var dataTable = this.requestData([targetName]);
		var newValue = dataTable[targetName].value;
		if (newValue.length < 2)
			newValue = newValue[0];

		this.renderer.shaderDataChanged(this.node.id, targetName, newValue);
		*/
	};

	p.destroy = function() {
		Array.forEach(this.textures, function(t) {
			t.adapter.destroy();
		});
	};

	p.bindSamplers = function() {
		var mustRebuildShader = false;

		for (var name in this.textures) {
			var tex = this.textures[name];
			if (tex.adapter.node != null)
				tex.adapter.bind(tex.info.texUnit);
			else {
				mustRebuildShader = true;
				break;
			}
		}

		//A texture must have been removed since the last render pass, so to be safe we should rebuild the shader
		//to try to avoid missing sampler errors in GL
		if (mustRebuildShader) {
			delete this.textures[name];
			this.destroy();
			this.enable();
		}
	};

	// Export to XML3D.webgl namespace
	XML3D.webgl.XML3DShaderRenderAdapter = XML3DShaderRenderAdapter;

}());
