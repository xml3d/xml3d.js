/*  RectangularCuboid class
 provides arrays of indices and positions for rectangular cuboid mesh
 is used by VolumeRenderAdapter for creation of representative mesh
 */


/**
 * @constructor
 */
var RectangularCuboid = function (position, size) {
    this.width = size[0];
    this.height = size[1];
    this.depth = size[2];

    this.posX = position[0];
    this.posY = position[1];
    this.posZ = position[2];

    var x0 = position[0];
    var y0 = position[1];
    var z0 = position[2];
    var x1 = position[0] + size[0];
    var y1 = position[1] + size[1];
    var z1 = position[2] + size[2];

    this.positions = new Float32Array([x0, y0, z1,    // Front face
            x1, y0, z1, x1, y1, z1, x0, y1, z1,

            x0, y0, z0,	   // Back face
            x0, y1, z0, x1, y1, z0, x1, y0, z0,

            x0, y1, z0,    // Top face
            x0, y1, z1, x1, y1, z1, x1, y1, z0,

            x0, y0, z0,	   // Bottom face
            x1, y0, z0, x1, y0, z1, x0, y0, z1,

            x1, y0, z0,    // Right face
            x1, y1, z0, x1, y1, z1, x1, y0, z1,

            x0, y0, z0,    // Left face
            x0, y0, z1, x0, y1, z1, x0, y1, z0]);

    this.positionsCount = this.positions.length / 3;
};

RectangularCuboid.prototype.updatePositions = function (position, size) {
    if (!( (size[0] != this.width) || (size[1] != this.height) || (size[2] != this.depth) || (position[0] != this.posX) || (position[1] != this.posY) || (position[2] != this.posZ) ))
        return false;

    if ((size[0] != this.width) || (this.posX != position[0])) {
        this.width = size[0];
        this.posX = position[0];
        var posRight = position[0] + size[0];

        this.positions[3] = this.positions[6] = this.positions[18] = this.positions[21] = this.positions[30] = this.positions[33] = this.positions[39] = this.positions[42] = this.positions[48] = this.positions[51] = this.positions[54] = this.positions[57] = posRight;

        this.positions[0] = this.positions[9] = this.positions[12] = this.positions[15] = this.positions[24] = this.positions[27] = this.positions[36] = this.positions[45] = this.positions[60] = this.positions[63] = this.positions[66] = this.positions[69] = position[0];
    }

    if ((size[1] != this.height) || (this.posY != position[1])) {
        this.height = size[1];
        this.posY = position[1];
        var posTop = position[1] + size[1];

        this.positions[7] = this.positions[10] = this.positions[16] = this.positions[19] = this.positions[25] = this.positions[28] = this.positions[31] = this.positions[34] = this.positions[52] = this.positions[55] = this.positions[67] = this.positions[70] = posTop;

        this.positions[1] = this.positions[4] = this.positions[13] = this.positions[22] = this.positions[37] = this.positions[40] = this.positions[43] = this.positions[46] = this.positions[49] = this.positions[58] = this.positions[61] = this.positions[64] = position[1];
    }

    if ((size[2] != this.depth) || (this.posZ != position[2])) {
        this.depth = size[2];
        this.posZ = position[2];
        var posDepth = position[2] + size[2];

        this.positions[2] = this.positions[5] = this.positions[8] = this.positions[11] = this.positions[29] = this.positions[32] = this.positions[44] = this.positions[47] = this.positions[56] = this.positions[59] = this.positions[65] = this.positions[68] = posDepth;

        this.positions[14] = this.positions[17] = this.positions[20] = this.positions[23] = this.positions[26] = this.positions[35] = this.positions[38] = this.positions[41] = this.positions[50] = this.positions[53] = this.positions[62] = this.positions[71] = position[2];
    }

    return true;
};

RectangularCuboid.Indices = new Int32Array([0, 1, 2, 0, 2, 3,    // front
    4, 5, 6, 4, 6, 7,    // back
    8, 9, 10, 8, 10, 11,   // top
    12, 13, 14, 12, 14, 15,   // bottom
    16, 17, 18, 16, 18, 19,   // right
    20, 21, 22, 20, 22, 23    // left
]);


module.exports = RectangularCuboid;
	
