if(XML3D && !XML3D._native)
{
    XML3D.shaders.register("drawDirectionalShadowMap", {

        vertex : [
            "attribute vec3 position;",
            "attribute vec3 normal;",
            "attribute vec3 color;",
            "attribute vec2 texcoord;",

            "varying vec3 fragNormal;",
            "varying vec3 fragVertexPosition;",
            "varying vec3 fragEyeVector;",
            "varying vec2 fragTexCoord;",
            "varying vec3 fragVertexColor;",
            "#if MAX_SPOTLIGHTS > 0 && HAS_SPOTLIGHT_SHADOWMAPS",
            "varying vec4 spotLightShadowMapCoord[ MAX_SPOTLIGHTS ];",
            "uniform mat4 spotLightMatrix[ MAX_SPOTLIGHTS ];",
            "#endif",
            "#if MAX_DIRECTIONALLIGHTS > 0 && HAS_DIRECTIONALLIGHT_SHADOWMAPS",
            "varying vec4 directionalLightShadowMapCoord[ MAX_DIRECTIONALLIGHTS ];",
            "uniform mat4 directionalLightMatrix[ MAX_DIRECTIONALLIGHTS ];",
            "#endif",

            "uniform mat4 modelMatrix;",
            "uniform mat4 modelViewProjectionMatrix;",
            "uniform mat4 modelViewMatrix;",
            "uniform mat3 modelViewMatrixN;",
            "uniform vec3 eyePosition;",

            "void main(void) {",
            "    vec3 pos = position;",
            "    vec3 norm = normal;",

            "    gl_Position = vec4(position,1.0);",
            "    fragTexCoord = texcoord;",
            "    fragVertexColor = color;",
            "#if MAX_SPOTLIGHTS > 0 && HAS_SPOTLIGHT_SHADOWMAPS",
            "    vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;",
            "    for(int i = 0; i < MAX_SPOTLIGHTS; i++) {",
            "      spotLightShadowMapCoord[i] = spotLightMatrix[i] * vec4(worldPosition, 1);",
            "    }",
            "#endif",
            "#if MAX_DIRECTIONALLIGHTS > 0 && HAS_DIRECTIONALLIGHT_SHADOWMAPS",
            "    vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;",
            "    for(int i = 0; i < MAX_DIRECTIONALLIGHTS; i++) {",
            "      directionalLightShadowMapCoord[i] = directionalLightMatrix[i] * vec4(worldPosition, 1);",
            "    }",
            "#endif",
            "}"
        ].join("\n"),

        fragment : [
            "uniform float ambientIntensity;",
            "uniform vec3 diffuseColor;",
            "uniform vec3 emissiveColor;",
            "uniform float shininess;",
            "uniform vec3 specularColor;",
            "uniform float transparency;",
            "uniform mat4 viewMatrix;",
            "uniform bool useVertexColor;",
            "uniform vec3 coords;",

            "#if HAS_EMISSIVETEXTURE",
            "uniform sampler2D emissiveTexture;",
            "#endif",
            "#if HAS_DIFFUSETEXTURE",
            "uniform sampler2D diffuseTexture;",
            "#endif",
            "#if HAS_SPECULARTEXTURE",
            "uniform sampler2D specularTexture;",
            "#endif",

            "varying vec3 fragNormal;",
            "varying vec3 fragVertexPosition;",
            "varying vec3 fragEyeVector;",
            "varying vec2 fragTexCoord;",
            "varying vec3 fragVertexColor;",

            "#if MAX_POINTLIGHTS > 0",
            "uniform vec3 pointLightAttenuation[MAX_POINTLIGHTS];",
            "uniform vec3 pointLightPosition[MAX_POINTLIGHTS];",
            "uniform vec3 pointLightIntensity[MAX_POINTLIGHTS];",
            "uniform bool pointLightOn[MAX_POINTLIGHTS];",
            "#endif",

            "#if MAX_DIRECTIONALLIGHTS > 0",
            "uniform vec3 directionalLightDirection[MAX_DIRECTIONALLIGHTS];",
            "uniform vec3 directionalLightIntensity[MAX_DIRECTIONALLIGHTS];",
            "uniform bool directionalLightOn[MAX_DIRECTIONALLIGHTS];",
            "uniform bool directionalLightCastShadow[MAX_DIRECTIONALLIGHTS];",
            "#if HAS_DIRECTIONALLIGHT_SHADOWMAPS",
            "uniform sampler2D directionalLightShadowMap[MAX_DIRECTIONALLIGHTS];",
            "uniform float directionalLightShadowBias[MAX_DIRECTIONALLIGHTS];",
            "varying vec4 directionalLightShadowMapCoord[MAX_DIRECTIONALLIGHTS];",

            "float unpackDepth( const in vec4 rgba_depth ) {",
            "  const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );",
            "  float depth = dot( rgba_depth, bit_shift );",
            "  return depth;",
            "} ",
            "#endif",
            "#endif",

            "#if MAX_SPOTLIGHTS > 0",
            "uniform vec3 spotLightAttenuation[MAX_SPOTLIGHTS];",
            "uniform vec3 spotLightPosition[MAX_SPOTLIGHTS];",
            "uniform vec3 spotLightIntensity[MAX_SPOTLIGHTS];",
            "uniform bool spotLightOn[MAX_SPOTLIGHTS];",
            "uniform vec3 spotLightDirection[MAX_SPOTLIGHTS];",
            "uniform float spotLightCosFalloffAngle[MAX_SPOTLIGHTS];",
            "uniform float spotLightCosSoftFalloffAngle[MAX_SPOTLIGHTS];",
            "uniform float spotLightSoftness[MAX_SPOTLIGHTS];",
            "uniform bool spotLightCastShadow[MAX_SPOTLIGHTS];",
            "#if HAS_SPOTLIGHT_SHADOWMAPS",
            "uniform sampler2D spotLightShadowMap[MAX_SPOTLIGHTS];",
            "uniform float spotLightShadowBias[MAX_SPOTLIGHTS];",
            "varying vec4 spotLightShadowMapCoord[MAX_SPOTLIGHTS];",

            "float unpackDepth( const in vec4 rgba_depth ) {",
            "  const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );",
            "  float depth = dot( rgba_depth, bit_shift );",
            "  return depth;",
            "} ",
            "#endif",
            "#endif",
            "uniform sampler2D ssaoMap;",
            "void main(void) {",
            "  float depth = unpackDepth(texture2D(directionalLightShadowMap[0], vec2(fragTexCoord.x, fragTexCoord.y)));",
            "  gl_FragColor = vec4(depth, depth, depth, 1.0);",
            "}"
        ].join("\n"),

        addDirectives: function(directives, lights, params) {
            var pointLights = lights.point ? lights.point.length : 0;
            var directionalLights = lights.directional ? lights.directional.length : 0;
            var spotLights = lights.spot ? lights.spot.length : 0;
            directives.push("MAX_POINTLIGHTS " + pointLights);
            directives.push("MAX_DIRECTIONALLIGHTS " + directionalLights);
            directives.push("MAX_SPOTLIGHTS " + spotLights);
            directives.push("HAS_SPOTLIGHT_SHADOWMAPS " + (lights.spot && !lights.spot.every(function(light) { return !light.castShadow; }) | 0));
            directives.push("HAS_DIRECTIONALLIGHT_SHADOWMAPS " + (lights.directional && !lights.directional.every(function(light) { return !light.castShadow; }) | 0));
            directives.push("HAS_DIFFUSETEXTURE " + ('diffuseTexture' in params ? "1" : "0"));
            directives.push("HAS_SPECULARTEXTURE " + ('specularTexture' in params ? "1" : "0"));
            directives.push("HAS_EMISSIVETEXTURE " + ('emissiveTexture' in params ? "1" : "0"));
            directives.push("HAS_SSAOMAP " + (XML3D.options.getValue("renderer-ssao") ? "1" : "0"));
        },
        hasTransparency: function(params) {
            return params.transparency && params.transparency.getValue()[0] > 0.001;
        },
        uniforms: {
            diffuseColor    : [1.0, 1.0, 1.0],
            emissiveColor   : [0.0, 0.0, 0.0],
            specularColor   : [0.0, 0.0, 0.0],
            transparency    : 0.0,
            shininess       : 0.2,
            ambientIntensity: 0.0,
            useVertexColor : false
        },

        samplers: {
            diffuseTexture : null,
            emissiveTexture : null,
            specularTexture : null,
            spotLightShadowMap : null,
            ssaoMap: null
        },

        attributes: {
            normal : {
                required: true
            },
            texcoord: null,
            color: null
        }
    });


    //add shader
    /*(function() {
     var gl = XML3D.webgl.getRenderer().renderinterface.gl;
     var c_worldToViewMatrix = XML3D.math.mat4.create();
     var c_viewToWorldMatrix = XML3D.math.mat4.create();
     var c_projectionMatrix = XML3D.math.mat4.create();
     var c_programSystemUniforms = ["viewMatrix", "viewInverseMatrix", "projectionMatrix", "cameraPosition", "coords", "ssaoMap", "width"];



     }());*/
}