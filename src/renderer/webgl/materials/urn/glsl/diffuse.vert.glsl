attribute vec3 position;
attribute vec3 normal;
attribute vec3 color;
attribute vec2 texcoord;

uniform mat4 modelViewProjectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat3 modelViewMatrixN;
uniform vec3 eyePosition;

varying vec3 fragNormal;
varying vec3 fragVertexPosition;
varying vec3 fragEyeVector;
varying vec2 fragTexCoord;
varying vec3 fragVertexColor;

void main(void) {
    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);
    fragNormal = normalize(modelViewMatrixN * normal);
    fragVertexPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    fragEyeVector = normalize(fragVertexPosition);
    fragTexCoord = texcoord;
    fragVertexColor = color;
}
