// Adapter for <light>
(function() {

    var XML3DLightRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        
        this.visible = true;
        this.position = null;
        this.transform = null;
        this.lightShader = null;

        this.isValid = true;
    };
    XML3D.createClass(XML3DLightRenderAdapter, XML3D.webgl.RenderAdapter);
    
    XML3DLightRenderAdapter.prototype.notifyChanged = function(evt) {
        var target = evt.internalType || evt.wrapped.attrName;
        
        switch(target) {
        case "visible":
            this.visible = (evt.wrapped.newValue == "true") && this.node.parentNode.visible;
            break;
        case "parentvisible":
            this.visible = evt.newValue && this.node.visible;
            break;
        case "intensity":
			// TODO: Inform light struct
            break;
        case "parenttransform":
            this.transform = evt.newValue;
            break;
        }
        
        this.factory.handler.redraw("Light attribute changed.");    
    };
    
	var XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION = vec3.create([0,0,-1]), tmpDirection = vec3.create();
    
	XML3DLightRenderAdapter.prototype.addLight = function(lights) {
	    var shader = this.getLightShader();
	    if(!shader)
	        return;
	    var script = shader.node.script;
	    var pos = script.indexOf("urn:xml3d:lightshader:");
	    if(pos === 0) {
	        var urnfrag = script.substring(22, script.length);
	        switch(urnfrag) {
	            case "point":
	                var point = lights.point;
	                var dlen = point.length*3;
                    point.adapter[point.length] = this;
                    // Set shader specific parameters
                    shader.fillPointLight(point, point.length,this.node.intensity);
                    // Set instance specific parameters
                    if (this.transform) {
                        var t = this.transform;
                        var pos = mat4.multiplyVec4(t, quat4.create([0,0,0,1]));
                        point.position[dlen] = pos[0]/pos[3];
                        point.position[dlen+1] = pos[1]/pos[3];
                        point.position[dlen+2] =  pos[2]/pos[3];
                    } else {
                        point.position[dlen] = 0;
                        point.position[dlen+1] = 0;
                        point.position[dlen+2] = 0;
                    }
                    point.visibility[dlen] = 1;
                    point.visibility[dlen+1] = 1;
                    point.visibility[dlen+2] = 1;
	                point.length++;
                    break;
	            case "directional":
	                var directional = lights.directional;
	                var dlen = directional.length*3;
	                directional.adapter[directional.length] = this;
	                shader.fillDirectionalLight(directional, directional.length,this.node.intensity);
                    if (this.transform) {
                        var t = this.transform;
                        mat4.multiplyVec3(t, XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION, tmpDirection);
                        directional.direction[dlen] = tmpDirection[0];
                        directional.direction[dlen+1] = tmpDirection[1];
                        directional.direction[dlen+2] =  tmpDirection[2];
                    } else {
                        directional.direction[dlen] = XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION[0];
                        directional.direction[dlen+1] = XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION[1];
                        directional.direction[dlen+2] = XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION[2];
                    }

	                directional.visibility[dlen] = 1;
	                directional.visibility[dlen+1] = 1;
	                directional.visibility[dlen+2] = 1;
	                directional.length++;
	                break;
                default:
                    XML3D.debug.logWarning("Unsupported lightshader type: " + script);
	        }
	    }
    };
    
    XML3DLightRenderAdapter.prototype.getLightShader = function() {
        if (!this.lightShader) {
            var shaderLink = this.node.shader;
            var shader = null;
            if (shaderLink != "")
                shader = XML3D.URIResolver.resolve(shaderLink);
            // if no shader attribute is specified, try to get a shader from the style attribute
            if(shader == null)
            {
                var styleValue = this.node.getAttribute('style');
                if(!styleValue)
                    return null;
                var pattern    = /shader\s*:\s*url\s*\(\s*(\S+)\s*\)/i;
                var result = pattern.exec(styleValue);
                if (result)
                    shader = this.node.xml3ddocument.resolve(result[1]);
            }
            this.lightShader = this.factory.getAdapter(shader);
        }
        return this.lightShader;
    };
    XML3DLightRenderAdapter.prototype.dispose = function() {
        this.isValid = false;
    };

    // Export to XML3D.webgl namespace
    XML3D.webgl.XML3DLightRenderAdapter = XML3DLightRenderAdapter;

}());