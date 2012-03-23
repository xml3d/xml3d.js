// Adapter for <shader>
(function() {
	
	var XML3DShaderRenderAdapter = function(factory, node) {
		XML3D.webgl.RenderAdapter.call(this, factory, node);
		this.renderer = this.factory.renderer;
		
		this.dataAdapter = this.renderer.dataFactory.getAdapter(this.node);
		if(this.dataAdapter)
			this.dataAdapter.registerObserver(this);
		else
			XML3D.debug.logError("Data adapter for a shader element could not be created!");
		
	};
	
	XML3D.createClass(XML3DShaderRenderAdapter, XML3D.webgl.RenderAdapter);

	XML3DShaderRenderAdapter.prototype.notifyChanged = function(evt) {
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
			var texNode = evt.wrapped.relatedNode;
			
			//Firefox assigns the relatedNode differently in this case, so we have to check for this
			if (texNode.ownerElement)
				texNode = texNode.ownerElement;
			
			texNode = texNode.parentNode;
			
			var texName = texNode.name;
			this.renderer.shaderDataChanged(this.node.id, target, evt.wrapped.newValue, texName);
			break;

		default:
			XML3D.debug.logWarning("Unhandled mutation event in shader adapter for parameter '"+target+"'");
			break;
		
		}
		
	};
	
	XML3DShaderRenderAdapter.prototype.notifyDataChanged = function(evt) {
		if (!evt.wrapped)
			return; 
		
		var targetName = evt.wrapped.currentTarget.name || evt.wrapped.relatedNode.name;
		
		if (!targetName)
			return; //Likely a change to a texture, this is handled through notifyChanged
		
		var dataTable = this.getDataTable();
		var newValue = dataTable[targetName].data;
		if (newValue.length < 2)
			newValue = newValue[0];
		
		this.renderer.shaderDataChanged(this.node.id, targetName, newValue);
	};

	XML3DShaderRenderAdapter.prototype.getDataTable = function() {
		return this.dataAdapter.createDataTable();
	};
	
	XML3DShaderRenderAdapter.prototype.destroy = function() {
		Array.forEach(this.textures, function(t) {
			t.adapter.destroy();
		});
	};

	XML3DShaderRenderAdapter.prototype.bindSamplers = function() {	
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

	//Build an instance of the local shader with the given XFlow declarations and body
	XML3DShaderRenderAdapter.prototype.getXFlowShader = function(declarations, body) {
		/*if (new XML3D.URI(this.program.scriptURL).scheme != "urn") {
			XML3D.debug.logWarning("XFlow scripts cannot be used in conjunction with custom shaders yet, sorry!");
			return null;
		}*/
		
		if (this.xflowBuilt) {
			return this.program;
		}
		
		var vertex = this.program.vSource;
		var fragment = this.program.fSource;
		
		vertex = declarations + vertex;
		var cutPoint = vertex.indexOf('~');
		
		var bodyCut1 = vertex.substring(0, cutPoint+1);
		var bodyCut2 = vertex.substring(cutPoint+3);
		
		vertex = bodyCut1 +"\n"+ body + bodyCut2;
		
		var sources = {};
		sources.vs = vertex;
		sources.fs = fragment;
		this.xflowBuilt = true;
		
		return this.createShaderProgram(sources);
		
	};
	
	// Export to XML3D.webgl namespace
	XML3D.webgl.XML3DShaderRenderAdapter = XML3DShaderRenderAdapter;

}());
