// Adapter for <shader>
(function() {
	
	var XML3DShaderRenderAdapter = function(factory, node) {
		xml3d.webgl.RenderAdapter.call(this, factory, node);
		this.renderer = this.factory.renderer;
		
		this.dataAdapter = this.renderer.dataFactory.getAdapter(this.node);
		if(this.dataAdapter)
			this.dataAdapter.registerObserver(this);
		else
			xml3d.debug.logError("Data adapter for a shader element could not be created!");
		
	};
	
	xml3d.createClass(XML3DShaderRenderAdapter, xml3d.webgl.RenderAdapter);

	XML3DShaderRenderAdapter.prototype.notifyChanged = function(evt) {
		if (evt.type == 0) {
			this.factory.renderer.sceneTreeAddition(evt);
		} else if (evt.type == 2) {
			this.factory.renderer.sceneTreeRemoval(evt);
		}
		
		var target = evt.internalType || evt.attrName || evt.wrapped.attrName;
		
		if (target == "script") {
			this.renderer.recompileShader(this);
		}
		
		//TODO: Handle addition/removal of textures
		
		/*
		if (evt.attribute == "script") {
			if (this.program) {
				this.destroy();
			
				//All uniforms need to be dirtied to make sure they're set in the new shader program
				var dataTable = this.dataAdapter.createDataTable();		
				for (var uniform in dataTable) {
					var u = dataTable[uniform];
					if (u.clean)
						u.clean = false;
				}	
			}
			this.renderer.requestRedraw();
		} else if (evt.newValue && evt.newValue.nodeName == "texture") {		
			var adapter = this.factory.getAdapter(evt.newValue);
			var name = evt.newValue.name;
				
			this.textures[name] = { adapter : adapter, info : { texUnit : 0 } };
			this.destroy();		
		}
		*/
		
	};
	
	XML3DShaderRenderAdapter.prototype.notifyDataChanged = function(evt) {
		this.renderer.shaderDataChanged(this, evt);
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
		/*if (new xml3d.URI(this.program.scriptURL).scheme != "urn") {
			xml3d.debug.logWarning("XFlow scripts cannot be used in conjunction with custom shaders yet, sorry!");
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
	
	// Export to xml3d.webgl namespace
	xml3d.webgl.XML3DShaderRenderAdapter = XML3DShaderRenderAdapter;

}());
