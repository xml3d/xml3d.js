attribute vec3 position;
attribute vec3 normal;
attribute vec3 tangent;
attribute vec2 texcoord;
attribute vec3 color;

varying vec3 fragWorldPosition;
varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec3 fragTangent;
varying vec3 fragBitangent;
varying vec3 fragColor;
varying vec2 fragTexcoord;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat3 modelViewMatrixN;
uniform mat4 projectionMatrix;

void main() {
    vec3 N;
    vec3 T;
    vec3 B;
    #if HAS_NORMAL
        fragNormal = modelViewMatrixN * normal;
    #endif
    #if HAS_TANGENT
        fragTangent = modelViewMatrixN * tangent;
        fragBitangent = modelViewMatrixN * normalize(cross(normal, tangent));
    #endif

    fragWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    fragPosition = (viewMatrix * vec4(fragWorldPosition, 1.0)).xyz;
    fragTexcoord = texcoord;
    fragColor = color;

    gl_Position = projectionMatrix * vec4(fragPosition, 1.0);
}