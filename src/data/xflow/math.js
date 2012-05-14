// Additional methods in glMatrix style

mat4.multiplyOffsetVec3 = function(mat, matOffset, vec, vecOffset, dest) {
    if(!dest) { dest = vec; }
    if(!vecOffset) { vecOffset = 0; }

    var x = vec[vecOffset+0], y = vec[vecOffset+1], z = vec[vecOffset+2];

    dest[0] = mat[matOffset+0]*x + mat[matOffset+4]*y + mat[matOffset+8]*z + mat[matOffset+12];
    dest[1] = mat[matOffset+1]*x + mat[matOffset+5]*y + mat[matOffset+9]*z + mat[matOffset+13];
    dest[2] = mat[matOffset+2]*x + mat[matOffset+6]*y + mat[matOffset+10]*z + mat[matOffset+14];

    return dest;
};



mat4.multiplyOffsetDirection = function(mat, matOffset, vec, vecOffset, dest) {
    if(!dest) { dest = vec; }
    if(!vecOffset) { vecOffset = 0; }

    var x = vec[vecOffset+0], y = vec[vecOffset+1], z = vec[vecOffset+2], w;

    dest[0] = mat[matOffset+0]*x + mat[matOffset+4]*y + mat[matOffset+8]*z;
    dest[1] = mat[matOffset+1]*x + mat[matOffset+5]*y + mat[matOffset+9]*z;
    dest[2] = mat[matOffset+2]*x + mat[matOffset+6]*y + mat[matOffset+10]*z;

    return dest;
};

mat4.makeTransformOffset = function(translation,rotation,scale,center,scaleOrientation,offset,dest) {
    var mo = offset*16;
    var vo = offset*3;
    var qo = offset*4;

    dest[mo+0] = 1;
    dest[mo+1] = 0;
    dest[mo+2] = 0;
    dest[mo+3] = 0;
    dest[mo+4] = 0;
    dest[mo+5] = 1;
    dest[mo+6] = 0;
    dest[mo+7] = 0;
    dest[mo+8] = 0;
    dest[mo+9] = 0;
    dest[mo+10] = 1;
    dest[mo+11] = 0;
    dest[mo+12] = translation[vo];
    dest[mo+13] = translation[vo+1];
    dest[mo+14] = translation[vo+2];
    dest[mo+15] = 1;

    if (rotation) {
        var rotM = quat4.toMat4([rotation[qo+1],rotation[qo+2],rotation[qo+3],-rotation[qo]]);
        mat4.multiplyOffset(dest, mo,  rotM, 0,  dest, mo);
    }
};

mat4.multiplyOffset = function(dest, destOffset, mat, offset1, mat2, offset2) {
    var a00 = mat2[offset2+0], a01 = mat2[offset2+1], a02 = mat2[offset2+2], a03 = mat2[offset2+3];
    var a10 = mat2[offset2+4], a11 = mat2[offset2+5], a12 = mat2[offset2+6], a13 = mat2[offset2+7];
    var a20 = mat2[offset2+8], a21 = mat2[offset2+9], a22 = mat2[offset2+10], a23 = mat2[offset2+11];
    var a30 = mat2[offset2+12], a31 = mat2[offset2+13], a32 = mat2[offset2+14], a33 = mat2[offset2+15];

    var b00 = mat[offset1+0], b01 = mat[offset1+1], b02 = mat[offset1+2], b03 = mat[offset1+3];
    var b10 = mat[offset1+4], b11 = mat[offset1+5], b12 = mat[offset1+6], b13 = mat[offset1+7];
    var b20 = mat[offset1+8], b21 = mat[offset1+9], b22 = mat[offset1+10], b23 = mat[offset1+11];
    var b30 = mat[offset1+12], b31 = mat[offset1+13], b32 = mat[offset1+14], b33 = mat[offset1+15];

    dest[destOffset+0] = b00*a00 + b01*a10 + b02*a20 + b03*a30;
    dest[destOffset+1] = b00*a01 + b01*a11 + b02*a21 + b03*a31;
    dest[destOffset+2] = b00*a02 + b01*a12 + b02*a22 + b03*a32;
    dest[destOffset+3] = b00*a03 + b01*a13 + b02*a23 + b03*a33;
    dest[destOffset+4] = b10*a00 + b11*a10 + b12*a20 + b13*a30;
    dest[destOffset+5] = b10*a01 + b11*a11 + b12*a21 + b13*a31;
    dest[destOffset+6] = b10*a02 + b11*a12 + b12*a22 + b13*a32;
    dest[destOffset+7] = b10*a03 + b11*a13 + b12*a23 + b13*a33;
    dest[destOffset+8] = b20*a00 + b21*a10 + b22*a20 + b23*a30;
    dest[destOffset+9] = b20*a01 + b21*a11 + b22*a21 + b23*a31;
    dest[destOffset+10] = b20*a02 + b21*a12 + b22*a22 + b23*a32;
    dest[destOffset+11] = b20*a03 + b21*a13 + b22*a23 + b23*a33;
    dest[destOffset+12] = b30*a00 + b31*a10 + b32*a20 + b33*a30;
    dest[destOffset+13] = b30*a01 + b31*a11 + b32*a21 + b33*a31;
    dest[destOffset+14] = b30*a02 + b31*a12 + b32*a22 + b33*a32;
    dest[destOffset+15] = b30*a03 + b31*a13 + b32*a23 + b33*a33;
};

quat4.slerpOffset = function(quat, quat2, offset, t, dest, shortest) {
    if(!dest) { dest = quat; }

    var ix = offset, iy = offset+1, iz = offset+2, iw = offset+3;

    var cosAngle =  quat[ix]*quat2[ix] + quat[iy]*quat2[iy] + quat[iz]*quat2[iz] + quat[iw]*quat2[iw];

    var c1, c2;

    // Linear interpolation for close orientations
    if ((1.0 - Math.abs(cosAngle)) < 0.01)
      {
        c1 = 1.0 - t;
        c2 = t;
      }
    else
      {
        // Spherical interpolation
        var angle    = Math.acos(Math.abs(cosAngle));
        var sinAngle = Math.sin(angle);
        c1 = Math.sin(angle * (1.0 - t)) / sinAngle;
        c2 = Math.sin(angle * t) / sinAngle;
      }

    // Use the shortest path
    if (shortest && (cosAngle < 0.0))
      c1 = -c1;

    dest[ix] = c1*quat[ix] + c2*quat2[ix];
    dest[iy] = c1*quat[iy] + c2*quat2[iy];
    dest[iz] = c1*quat[iz] + c2*quat2[iz];
    dest[iw] = c1*quat[iw] + c2*quat2[iw];
};
