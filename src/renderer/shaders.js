
var g_shaders = {};

g_shaders["urn:xml3d:shader:matte"] = g_shaders["urn:xml3d:shader:flat"] = {
	vertex :
			 "attribute vec3 position;"
			+ "uniform mat4 modelViewProjectionMatrix;"
			+ "void main(void) {"
			+"    vec3 pos = position;\n\n //~"
			
			+ "    \ngl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);"
			+ "}",
	fragment :
			"#ifdef GL_ES\n"
			+"precision highp float;\n"
			+"#endif\n\n"
		    + "uniform vec3 diffuseColor;"
			+ "void main(void) {\n"
			+ "    gl_FragColor = vec4(diffuseColor.x, diffuseColor.y, diffuseColor.z, 1.0);"
			+ "}"
};
g_shaders["urn:xml3d:shader:mattevcolor"] = g_shaders["urn:xml3d:shader:flatvcolor"] = {
		vertex :
				 "attribute vec3 position;"
				+ "attribute vec3 color;"
				+ "varying vec3 fragVertexColor;"
				+ "uniform mat4 modelViewProjectionMatrix;"
				+ "void main(void) {"
				+"    vec3 pos = position;\n\n //~"

				+ "    \nfragVertexColor = color;"
				+ "    gl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);"
				+ "}",
		fragment :
				"#ifdef GL_ES\n"
				+"precision highp float;\n"
				+"#endif\n\n"
			    + "uniform vec3 diffuseColor;"
				+ "varying vec3 fragVertexColor;"
				+ "void main(void) {"
				+ "    gl_FragColor = vec4(fragVertexColor, 1.0);"
				+ "}"
	};

g_shaders["urn:xml3d:shader:diffuse"] = {
		vertex :

		"attribute vec3 position;\n"
		+"attribute vec3 normal;\n"

		+"varying vec3 fragNormal;\n"
		+"varying vec3 fragVertexPosition;\n"
		+"varying vec3 fragEyeVector;\n"

		+"uniform mat4 modelViewProjectionMatrix;\n"
		+"uniform mat4 modelViewMatrix;\n"
		+"uniform mat3 normalMatrix;\n"
		+"uniform vec3 eyePosition;\n"

		+"void main(void) {\n"
		+"    vec3 pos = position;\n"
		+"    vec3 norm = normal;\n\n //~"
		
		+"	  \ngl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);\n"
		+"	  fragNormal = normalize(normalMatrix * norm);\n"
		+"	  fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;\n"
		+"	  fragEyeVector = normalize(fragVertexPosition);\n"
		+"}\n",

	fragment:
	// NOTE: Any changes to this area must be carried over to the substring calculations in
	// XML3D.webgl.Renderer.prototype.getStandardShaderProgram
			"#ifdef GL_ES\n"
			+"precision highp float;\n"
			+"#endif\n\n"
			+"// const int MAX_POINTLIGHTS = 0; \n"
	// ------------------------------------------------------------------------------------
			+"uniform vec3 diffuseColor;\n"
			+"uniform vec3 emissiveColor;\n"

			+"varying vec3 fragNormal;\n"
			+"varying vec3 fragVertexPosition;\n"
			+"varying vec3 fragEyeVector;\n"

			+"uniform vec3 pointLightAttenuation[MAX_POINTLIGHTS+1];\n"
			+"uniform vec3 pointLightPosition[MAX_POINTLIGHTS+1];\n"
			+"uniform vec3 pointLightIntensity[MAX_POINTLIGHTS+1];\n"
			+"uniform vec3 pointLightVisibility[MAX_POINTLIGHTS+1];\n"

			+"void main(void) {\n"
			+"  vec3 color = emissiveColor;\n"
			+"	if (MAX_POINTLIGHTS < 1) {\n"
			+"      vec3 normal = fragNormal;\n"
			+"      vec3 eye = fragEyeVector;\n"
			+"      float diffuse = max(0.0, dot(normal, -eye)) ;\n"
			+"      diffuse += max(0.0, dot(normal, eye));\n"
			+"      color = color + diffuse*diffuseColor;\n"
			+"	} else {\n"
			+"		for (int i=0; i<MAX_POINTLIGHTS; i++) {\n"
			+"			vec3 L = pointLightPosition[i] - fragVertexPosition;\n"
		 	+"      	vec3 N = fragNormal;\n"
			+"			float dist = length(L);\n"
		 	+"      	L = normalize(L);\n"
			+"			float atten = 1.0 / (pointLightAttenuation[i].x + pointLightAttenuation[i].y * dist + pointLightAttenuation[i].z * dist * dist);\n"
			+"			vec3 Idiff = pointLightIntensity[i] * max(dot(N,L),0.0) * diffuseColor ;\n"
			+"			color = color + (atten*Idiff) * pointLightVisibility[i];\n"
			+"		}\n"
			+"  }\n"
			+"	gl_FragColor = vec4(color, 1.0);\n"
			+"}"
};


g_shaders["urn:xml3d:shader:textureddiffuse"] = {
		vertex :

		"attribute vec2 texcoord;\n"
		+"attribute vec3 position;\n"
		+"attribute vec3 normal;\n"

		+"varying vec3 fragNormal;\n"
		+"varying vec3 fragVertexPosition;\n"
		+"varying vec3 fragEyeVector;\n"
		+"varying vec2 fragTexCoord;\n"

		+"uniform mat4 modelViewProjectionMatrix;\n"
		+"uniform mat4 modelViewMatrix;\n"
		+"uniform mat3 normalMatrix;\n"
		+"uniform vec3 eyePosition;\n"

		+"void main(void) {\n"
		+"    vec2 tex = texcoord;\n"
		+"    vec3 pos = position;\n"
		+"    vec3 norm = normal;\n\n //~"
		
		+"	  \ngl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);\n"
		+"	  fragNormal = normalize(normalMatrix * norm);\n"
		+"	  fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;\n"
		+"	  fragEyeVector = normalize(fragVertexPosition);\n"
		+"    fragTexCoord = tex;\n"
		+"}\n",

	fragment:
	// NOTE: Any changes to this area must be carried over to the substring calculations in
	// XML3D.webgl.Renderer.prototype.getStandardShaderProgram
			"#ifdef GL_ES\n"
			+"precision highp float;\n"
			+"#endif\n\n"
			+"// const int MAX_POINTLIGHTS = 0; \n"
	// ------------------------------------------------------------------------------------
			+"uniform vec3 diffuseColor;\n"
			+"uniform sampler2D diffuseTexture;"
			+"uniform vec3 emissiveColor;\n"

			+"varying vec3 fragNormal;\n"
			+"varying vec3 fragVertexPosition;\n"
			+"varying vec3 fragEyeVector;\n"
			+"varying vec2 fragTexCoord;\n"

			+"uniform vec3 pointLightAttenuation[MAX_POINTLIGHTS+1];\n"
			+"uniform vec3 pointLightPosition[MAX_POINTLIGHTS+1];\n"
			+"uniform vec3 pointLightIntensity[MAX_POINTLIGHTS+1];\n"
			+"uniform vec3 pointLightVisibility[MAX_POINTLIGHTS+1];\n"

			+"void main(void) {\n"
			+"  vec3 color = emissiveColor;\n"
			+"	if (MAX_POINTLIGHTS < 1) {\n"
			+"      vec3 normal = fragNormal;\n"
			+"      vec3 eye = fragEyeVector;\n"
			+"      float diffuse = max(0.0, dot(normal, -eye)) ;\n"
			+"      diffuse += max(0.0, dot(normal, eye));\n"
			+"      color = color + diffuse*texture2D(diffuseTexture, fragTexCoord).xyz;\n"
			+"	} else {\n"
			+"      vec4 texDiffuse = texture2D(diffuseTexture, fragTexCoord);\n"
			+"		for (int i=0; i<MAX_POINTLIGHTS; i++) {\n"
			+"			vec3 L = lPosition.xyz - fragVertexPosition;\n"
		 	+"      	vec3 N = fragNormal;\n"
			+"			float dist = length(L);\n"
		 	+"      	L = normalize(L);\n"
			+"			float atten = 1.0 / (pointLightAttenuation[i].x + pointLightAttenuation[i].y * dist + pointLightAttenuation[i].z * dist * dist);\n"
			+"			vec3 Idiff = pointLightIntensity[i] * max(dot(N,L),0.0) * texDiffuse.xyz;\n"
			+"			color = color + (atten*Idiff) * pointLightVisibility[i];\n"
			+"		}\n"
			+"  }\n"
			+"	gl_FragColor = vec4(color, 1.0);\n"
			+"}"
};


g_shaders["urn:xml3d:shader:diffusevcolor"] = {
		vertex :

		"attribute vec3 position;\n"
		+"attribute vec3 normal;\n"
		+"attribute vec3 color;\n"

		+"varying vec3 fragNormal;\n"
		+"varying vec3 fragVertexPosition;\n"
		+"varying vec3 fragEyeVector;\n"
		+"varying vec3 fragVertexColor;\n"

		+"uniform mat4 modelViewProjectionMatrix;\n"
		+"uniform mat4 modelViewMatrix;\n"
		+"uniform mat3 normalMatrix;\n"
		+"uniform vec3 eyePosition;\n"

		+"void main(void) {\n"
		+"    vec3 pos = position;\n"
		+"    vec3 norm = normal;\n\n //~"
		
		+"	  \ngl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);\n"
		+"	  fragNormal = normalize(normalMatrix * norm);\n"
		+"	  fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;\n"
		+"	  fragEyeVector = normalize(fragVertexPosition);\n"
		+"	  fragVertexColor = color;\n"
		+"}\n",

	fragment:
	// NOTE: Any changes to this area must be carried over to the substring calculations in
	// XML3D.webgl.Renderer.prototype.getStandardShaderProgram
			"#ifdef GL_ES\n"
			+"precision highp float;\n"
			+"#endif\n\n"
			+"// const int MAX_POINTLIGHTS = 0; \n"
	// ------------------------------------------------------------------------------------
			+"uniform vec3 diffuseColor;\n"
			+"uniform vec3 emissiveColor;\n"

			+"varying vec3 fragNormal;\n"
			+"varying vec3 fragVertexPosition;\n"
			+"varying vec3 fragEyeVector;\n"
			+"varying vec3 fragVertexColor;\n"

			+"uniform vec3 pointLightAttenuation[MAX_POINTLIGHTS+1];\n"
			+"uniform vec3 pointLightPosition[MAX_POINTLIGHTS+1];\n"
			+"uniform vec3 pointLightIntensity[MAX_POINTLIGHTS+1];\n"
			+"uniform vec3 pointLightVisibility[MAX_POINTLIGHTS+1];\n"

			+"void main(void) {\n"
			+"  vec3 color = emissiveColor;\n"
			+"	if (MAX_POINTLIGHTS < 1) {\n"
			+"      vec3 normal = fragNormal;\n"
			+"      vec3 eye = fragEyeVector;\n"
			+"      float diffuse = max(0.0, dot(normal, -eye)) ;\n"
			+"      diffuse += max(0.0, dot(normal, eye));\n"
			+"      color = color + diffuse*fragVertexColor;\n"
			+"	} else {\n"
			+"		for (int i=0; i<MAX_POINTLIGHTS; i++) {\n"
			+"			vec3 L = pointLightPosition[i] - fragVertexPosition;\n"
		 	+"      	vec3 N = fragNormal;\n"
			+"			float dist = length(L);\n"
		 	+"      	L = normalize(L);\n"
			+"			float atten = 1.0 / (pointLightAttenuation[i].x + pointLightAttenuation[i].y * dist + pointLightAttenuation[i].z * dist * dist);\n"
			+"			vec3 Idiff = pointLightIntensity[i] * max(dot(N,L),0.0) * fragVertexColor ;\n"
			+"			color = color + (atten*Idiff) * pointLightVisibility[i];\n"
			+"		}\n"
			+"  }\n"
			+"	gl_FragColor = vec4(color, 1.0);\n"
			+"}"
};




g_shaders["urn:xml3d:shader:phongvcolor"] = {
		vertex :

			"attribute vec3 position;\n"
			+"attribute vec3 normal;\n"
			+"attribute vec3 color;\n"

			+"varying vec3 fragNormal;\n"
			+"varying vec3 fragVertexPosition;\n"
			+"varying vec3 fragEyeVector;\n"
			+"varying vec3 fragVertexColor;\n"

			+"uniform mat4 modelViewProjectionMatrix;\n"
			+"uniform mat4 modelViewMatrix;\n"
			+"uniform mat3 normalMatrix;\n"
			+"uniform vec3 eyePosition;\n"

			+"void main(void) {\n"
			+"    vec3 pos = position;\n"
			+"    vec3 norm = normal;\n\n //~"
			
			+"	  \ngl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);\n"
			+"	  fragNormal = normalize(normalMatrix * norm);\n"
			+"	  fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;\n"
			+"	  fragEyeVector = normalize(fragVertexPosition);\n"
			+ "   fragVertexColor = color;\n"
			+"}\n",

		fragment:
		// NOTE: Any changes to this area must be carried over to the substring calculations in
		// XML3D.webgl.Renderer.prototype.getStandardShaderProgram
				"#ifdef GL_ES\n"
				+"precision highp float;\n"
				+"#endif\n\n"
				+"// const int MAX_POINTLIGHTS = 0; \n"
		// ------------------------------------------------------------------------------------
				+"uniform float ambientIntensity;\n"
				+"uniform vec3 diffuseColor;\n"
				+"uniform vec3 emissiveColor;\n"
				+"uniform float shininess;\n"
				+"uniform vec3 specularColor;\n"
				+"uniform float transparency;\n"
				+"uniform float lightOn;\n"

				+"varying vec3 fragNormal;\n"
				+"varying vec3 fragVertexPosition;\n"
				+"varying vec3 fragEyeVector;\n"
				+"varying vec3 fragVertexColor;\n"
				+"#if MAX_POINTLIGHTS > 0\n"
				+"uniform vec3 pointLightAttenuation[MAX_POINTLIGHTS+1];\n"
				+"uniform vec3 pointLightPosition[MAX_POINTLIGHTS+1];\n"
				+"uniform vec3 pointLightIntensity[MAX_POINTLIGHTS+1];\n"
				+"uniform vec3 pointLightVisibility[MAX_POINTLIGHTS+1];\n"
				+"#endif\n"
				
				+"void main(void) {\n"
				+"  if (transparency > 0.95) discard;\n"
				+"  vec3 color = emissiveColor;\n"
				+"#if MAX_POINTLIGHTS < 1\n"
				+"      vec3 light = -normalize(fragVertexPosition);\n"
				+"      vec3 normal = fragNormal;\n"
				+"      vec3 eye = fragEyeVector;\n"
				+"      vec3 lightEye = normalize(light-eye);\n"
				+"      float diffuse = max(0.0, dot(normal, -eye)) ;\n"
				+"      diffuse += max(0.0, dot(normal, eye));\n"
				+"      float specular = pow(max(0.0, dot(normal, lightEye)), shininess*128.0);\n"
				+"      specular += pow(max(0.0, dot(normal, -lightEye)), shininess*128.0);\n"
				+"      color += diffuse*fragVertexColor + specular*specularColor;\n"
				+"#else\n"
				+"		for (int i=0; i<MAX_POINTLIGHTS; i++) {\n"
				+"			vec3 L = pointLightPosition[i] - fragVertexPosition;\n"
			 	+"      	vec3 N = fragNormal;\n"
			 	+"			vec3 E = fragEyeVector;\n"
				+"			float dist = length(L);\n"
			 	+"      	L = normalize(L);\n"
				+"			vec3 R = normalize(reflect(L,N));\n"

				+"			float atten = 1.0 / (pointLightAttenuation[i].x + pointLightAttenuation[i].y * dist + pointLightAttenuation[i].z * dist * dist);\n"
				+"			vec3 Idiff = pointLightIntensity[i] * max(dot(N,L),0.0) * fragVertexColor ;\n"
				+"			vec3 Ispec = specularColor * pow(max(dot(R,E),0.0), shininess*128.0) * pointLightIntensity[i];\n"
				+"			color += (atten*(Idiff + Ispec))*pointLightVisibility[i];\n"
				+"      }\n"
				+"#endif\n"
				+"	gl_FragColor = vec4(color, max(0.0, 1.0 - transparency));\n"
				+"}"
	};

g_shaders["urn:xml3d:shader:picking"] = {
		vertex:

		"attribute vec3 position;\n"
		+ "uniform mat4 modelMatrix;\n"
		+ "uniform mat4 modelViewProjectionMatrix;\n"
		+ "uniform vec3 min;\n"
		+ "uniform vec3 max;\n"

		+ "varying vec3 worldCoord;\n"
		+ "void main(void) {\n"
		+ "    worldCoord = (modelMatrix * vec4(position, 1.0)).xyz;\n"
		+ "    vec3 diff = max - min;\n"
		+ "    worldCoord = worldCoord - min;\n"
		+ "    worldCoord = worldCoord / diff;"
		+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);\n"
		+ "}" ,

		fragment:


		"#ifdef GL_ES\n"
		+"precision highp float;\n"
		+"#endif\n\n"
		+"uniform float id;"
		+ "varying vec3 worldCoord;\n"

		+ "void main(void) {\n"
		+ "    gl_FragColor = vec4(worldCoord, id);\n"
		+ "}\n"
	};

g_shaders["urn:xml3d:shader:pickedNormals"] = {
		vertex:

		"attribute vec3 position;\n"
		+ "attribute vec3 normal;\n"
		+ "uniform mat4 modelViewMatrix;\n"
		+ "uniform mat4 modelViewProjectionMatrix;\n"
		+ "uniform mat3 normalMatrix;\n"

		+ "varying vec3 fragNormal;\n"
		
		+ "void main(void) {\n"
		+ "	   fragNormal = normalize(normalMatrix * normal);\n"
		+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);\n"
		+ "}" ,

		fragment:


		"#ifdef GL_ES\n"
		+"precision highp float;\n"
		+"#endif\n\n"
		
		+ "varying vec3 fragNormal;\n"

		+ "void main(void) {\n"
		+ "    gl_FragColor = vec4((fragNormal+1.0)/2.0, 1.0);\n"
		+ "}\n"
	};
