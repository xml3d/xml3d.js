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

mat4.makeTransformOffset(translation,rotation,scale,center,scaleOrientation,offset,dest) {
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


    var rotM = quat4.toMat4([rotation[qo],rotation[qo+1],rotation[qo+2],rotation[qo+3]]);
    mat4.translateOffset(translation, offset, dest);
    dest[offset1+0] = b00*a00 + b01*a10 + b02*a20 + b03*a30;
    dest[offset1+1] = b00*a01 + b01*a11 + b02*a21 + b03*a31;
    dest[offset1+2] = b00*a02 + b01*a12 + b02*a22 + b03*a32;
    dest[offset1+3] = b00*a03 + b01*a13 + b02*a23 + b03*a33;
    dest[offset1+4] = b10*a00 + b11*a10 + b12*a20 + b13*a30;
    dest[offset1+5] = b10*a01 + b11*a11 + b12*a21 + b13*a31;
    dest[offset1+6] = b10*a02 + b11*a12 + b12*a22 + b13*a32;
    dest[offset1+7] = b10*a03 + b11*a13 + b12*a23 + b13*a33;
    dest[offset1+8] = b20*a00 + b21*a10 + b22*a20 + b23*a30;
    dest[offset1+9] = b20*a01 + b21*a11 + b22*a21 + b23*a31;
    dest[offset1+10] = b20*a02 + b21*a12 + b22*a22 + b23*a32;
    dest[offset1+11] = b20*a03 + b21*a13 + b22*a23 + b23*a33;
    dest[offset1+12] = b30*a00 + b31*a10 + b32*a20 + b33*a30;
    dest[offset1+13] = b30*a01 + b31*a11 + b32*a21 + b33*a31;
    dest[offset1+14] = b30*a02 + b31*a12 + b32*a22 + b33*a32;
    dest[offset1+15] = b30*a03 + b31*a13 + b32*a23 + b33*a33;
};

quat4.slerpOffset = function(quat, quat2, offset, slerp, dest) {
    if(!dest) { dest = quat; }

    var ix = offset, iy = offset+1, iz = offset+2, iw = offset+3;

    var cosHalfTheta =  quat[ix]*quat2[ix] + quat[iy]*quat2[iy] + quat[iz]*quat2[iz] + quat[iw]*quat2[iw];

    if (Math.abs(cosHalfTheta) >= 1.0){
        if(dest != quat) {
            dest[ix] = quat[ix];
            dest[iy] = quat[iy];
            dest[iz] = quat[iz];
            dest[iw] = quat[iw];
        }
        return dest;
    }

    var halfTheta = Math.acos(cosHalfTheta);
    var sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta*cosHalfTheta);

    if (Math.abs(sinHalfTheta) < 0.001){
        dest[ix] = (quat[ix]*0.5 + quat2[ix]*0.5);
        dest[iy] = (quat[iy]*0.5 + quat2[iy]*0.5);
        dest[iz] = (quat[iz]*0.5 + quat2[iz]*0.5);
        dest[iw] = (quat[iw]*0.5 + quat2[iw]*0.5);
        return dest;
    }

    var ratioA = Math.sin((1 - slerp)*halfTheta) / sinHalfTheta;
    var ratioB = Math.sin(slerp*halfTheta) / sinHalfTheta;

    dest[ix] = (quat[ix]*ratioA + quat2[ix]*ratioB);
    dest[iy] = (quat[iy]*ratioA + quat2[iy]*ratioB);
    dest[iz] = (quat[iz]*ratioA + quat2[iz]*ratioB);
    dest[iw] = (quat[iw]*ratioA + quat2[iw]*ratioB);

    return dest;
};
