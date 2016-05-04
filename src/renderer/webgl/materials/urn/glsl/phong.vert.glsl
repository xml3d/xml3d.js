attribute vec3 position;
attribute vec3 normal;
attribute vec3 color;
attribute vec2 texcoord;

uniform mat4 modelMatrix;
uniform mat4 modelViewProjectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat3 modelViewMatrixN;
uniform vec3 eyePosition;

varying vec3 fragNormal;
varying vec3 fragVertexPosition;
varying vec3 fragEyeVector;
varying vec2 fragTexCoord;
varying vec3 fragVertexColor;

#if (HAS_POINTLIGHT_SHADOWMAPS || HAS_DIRECTIONALLIGHT_SHADOWMAPS || HAS_SPOTLIGHT_SHADOWMAPS)
varying vec3 fragWorldPosition; //needed by any of the light types
#endif

void main(void) {
    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);
    fragNormal = normalize(modelViewMatrixN * normal);
    fragVertexPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    fragEyeVector = normalize(fragVertexPosition);
    fragTexCoord = texcoord;
    fragVertexColor = color;
#if (HAS_POINTLIGHT_SHADOWMAPS || HAS_DIRECTIONALLIGHT_SHADOWMAPS || HAS_SPOTLIGHT_SHADOWMAPS)
    fragWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
#endif
}
