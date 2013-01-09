
/**
 *  class FirminCSSMatrix
 *
 *  The [[FirminCSSMatrix]] class is a concrete implementation of the
 *  `CSSMatrix` interface defined in the [CSS 2D Transforms][2d] and
 *  [CSS 3D Transforms][3d] Module specifications.
 *
 *  [2d]: http://www.w3.org/TR/css3-2d-transforms/
 *  [3d]: http://www.w3.org/TR/css3-3d-transforms/
 *
 *  The implementation was largely copied from the `WebKitCSSMatrix` class, and
 *  the supparting maths libraries in the [WebKit][webkit] project. This is one
 *  reason why much of the code looks more like C++ than JavaScript.
 *
 *  [webkit]: http://webkit.org/
 *
 *  Its API is a superset of that provided by `WebKitCSSMatrix`, largely
 *  because various pieces of supporting code have been added as instance
 *  methods rather than pollute the global namespace. Examples of these include
 *  [[FirminCSSMatrix#isAffine]], [[FirminCSSMatrix#isIdentityOrTranslation]]
 *  and [[FirminCSSMatrix#adjoint]].
 **/

/**
 *  new FirminCSSMatrix(domstr)
 *  - domstr (String): a string representation of a 2D or 3D transform matrix
 *    in the form given by the CSS transform property, i.e. just like the
 *    output from [[FirminCSSMatrix#toString]].
 *
 *  @constructor
 **/
var FirminCSSMatrix = function(domstr) {
    this.m11 = this.m22 = this.m33 = this.m44 = 1;

    this.m12 = this.m13 = this.m14 =
    this.m21 =            this.m23 = this.m24 =
    this.m31 = this.m32 =            this.m34 =
    this.m41 = this.m42 = this.m43            = 0;

    if (typeof domstr == "string") {
        this.setMatrixValue(domstr);
    }
};

/**
 *  FirminCSSMatrix.displayName = "FirminCSSMatrix"
 **/
FirminCSSMatrix.displayName = "FirminCSSMatrix";

/**
 *  FirminCSSMatrix.degreesToRadians(angle) -> Number
 *  - angle (Number): an angle in degrees.
 *
 *  Converts angles in degrees, which are used by the external API, to angles
 *  in radians used in internal calculations.
 **/
FirminCSSMatrix.degreesToRadians = function(angle) {
    return angle * Math.PI / 180;
};

/**
 *  FirminCSSMatrix.determinant2x2(a, b, c, d) -> Number
 *  - a (Number): top-left value of the matrix.
 *  - b (Number): top-right value of the matrix.
 *  - c (Number): bottom-left value of the matrix.
 *  - d (Number): bottom-right value of the matrix.
 *
 *  Calculates the determinant of a 2x2 matrix.
 **/
FirminCSSMatrix.determinant2x2 = function(a, b, c, d) {
    return a * d - b * c;
};

/**
 *  FirminCSSMatrix.determinant3x3(matrix) -> Number
 *  - a1 (Number): matrix value in position [1, 1].
 *  - a2 (Number): matrix value in position [1, 2].
 *  - a3 (Number): matrix value in position [1, 3].
 *  - b1 (Number): matrix value in position [2, 1].
 *  - b2 (Number): matrix value in position [2, 2].
 *  - b3 (Number): matrix value in position [2, 3].
 *  - c1 (Number): matrix value in position [3, 1].
 *  - c2 (Number): matrix value in position [3, 2].
 *  - c3 (Number): matrix value in position [3, 3].
 *
 *  Calculates the determinant of a 3x3 matrix.
 **/
FirminCSSMatrix.determinant3x3 = function(a1, a2, a3, b1, b2, b3, c1, c2, c3) {
    var determinant2x2 = FirminCSSMatrix.determinant2x2;
    return a1 * determinant2x2(b2, b3, c2, c3) -
    b1 * determinant2x2(a2, a3, c2, c3) +
    c1 * determinant2x2(a2, a3, b2, b3);
};

/**
 *  FirminCSSMatrix.determinant4x4(matrix) -> Number
 *  - matrix (FirminCSSMatrix): the matrix to calculate the determinant of.
 *
 *  Calculates the determinant of a 4x4 matrix.
 **/
FirminCSSMatrix.determinant4x4 = function(m) {
    var determinant3x3 = FirminCSSMatrix.determinant3x3,

        // Assign to individual variable names to aid selecting correct elements
    a1 = m.m11, b1 = m.m21, c1 = m.m31, d1 = m.m41,
    a2 = m.m12, b2 = m.m22, c2 = m.m32, d2 = m.m42,
    a3 = m.m13, b3 = m.m23, c3 = m.m33, d3 = m.m43,
    a4 = m.m14, b4 = m.m24, c4 = m.m34, d4 = m.m44;

    return a1 * determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4) -
    b1 * determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4) +
    c1 * determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4) -
    d1 * determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
};

/**
 * FirminCSSMatrix.toMatrixString(transformValue) -> String
 * - transformValue (String): `el.style.WebkitTransform`-style string (like `rotate(18rad) translate3d(50px, 100px, 10px)`)
 *
 * Tranforms a `el.style.WebkitTransform`-style string
 * (like `rotate(18rad) translate3d(50px, 100px, 10px)`)
 * into a `getComputedStyle(el)`-style matrix string
 * (like `matrix3d(0.6603167082440828, -0.7509872467716737, 0, 0, 0.7509872467716737, 0.6603167082440828, 0, 0, 0, 0, 1, 0, 108.11456008937151, 28.482308485824596, 10, 1)`)
 **/
FirminCSSMatrix.toMatrixString = function (transformValue) {
    var rgx = {
        functionSignature: /(\w+)\([^\)]+\)/ig,
        nameAndArguments: /(\w+)\(([^\)]+)\)/i,
        units: /([-\+]?[0-9]+[\.0-9]*)(deg|rad|grad|px|%)*/
    };
    var transformStatements = transformValue.match(/(\w+)\([^\)]+\)/ig);
    var onlyMatrices = transformStatements && transformStatements.every(function (t) { return (/^matrix/).test(t) });
    if (!transformStatements || onlyMatrices) return transformValue;

    var values = function (o) { return o.value };
    var cssFunctionToJsFunction = {
        matrix: function (m, o) {
            var m2 = new FirminCSSMatrix(o.unparsed);

            return m.multiply(m2)
        },
        matrix3d: function (m, o) {
            var m2 = new FirminCSSMatrix(o.unparsed);

            return m.multiply(m2)
        },

        perspective: function (m, o) {
            var m2 = new FirminCSSMatrix();
            m2.m34 -= 1 / o.value[0].value;

            return m.multiply(m2);
        },

        rotate: function (m, o) {
            return m.rotate.apply(m, o.value.map(values))
        },
        rotate3d: function (m, o) {
            return m.rotateAxisAngle.apply(m, o.value.map(values))
        },
        rotateX: function (m, o) {
            return m.rotate.apply(m, [o.value[0].value, 0, 0]);
        },
        rotateY: function (m, o) {
            return m.rotate.apply(m, [0, o.value[0].value, 0]);
        },
        rotateZ: function (m, o) {
            return m.rotate.apply(m, [0, 0, o.value[0].value]);
        },

        scale: function (m, o) {
            return m.scale.apply(m, o.value.map(values));
        },
        scale3d: function (m, o) {
            return m.scale.apply(m, o.value.map(values));
        },
        scaleX: function (m, o) {
            return m.scale.apply(m, o.value.map(values));
        },
        scaleY: function (m, o) {
            return m.scale.apply(m, [0, o.value[0].value, 0]);
        },
        scaleZ: function (m, o) {
            return m.scale.apply(m, [0, 0, o.value[0].value]);
        },

        skew: function (m, o) {
            var mX = new FirminCSSMatrix('skewX(' + o.value[0].unparsed + ')');
            var mY = new FirminCSSMatrix('skewY(' + o.value[1].unparsed + ')');
            var sM = 'matrix(1.00000, '+ mY.b +', '+ mX.c +', 1.000000, 0.000000, 0.000000)';
            var m2 = new FirminCSSMatrix(sM);

            return m.multiply(m2);
        },
        skewX: function (m, o) {
            return m.skewX.apply(m, [o.value[0].value]);
        },
        skewY: function (m, o) {
            return m.skewY.apply(m, [o.value[0].value]);
        },

        translate: function (m, o) {
            return m.translate.apply(m, o.value.map(values));
        },
        translate3d: function (m, o) {
            return m.translate.apply(m, o.value.map(values));
        },
        translateX: function (m, o) {
            return m.translate.apply(m, [o.value[0].value, 0, 0]);
        },
        translateY: function (m, o) {
            return m.translate.apply(m, [0, o.value[0].value, 0]);
        },
        translateZ: function (m, o) {
            return m.translate.apply(m, [0, 0, o.value[0].value]);
        }
    };
    var parseTransformStatement = function (str) {
        var pair = str.match(rgx.nameAndArguments).slice(1);

        return {
            key: pair[0],
            value: pair[1].split(/, ?/).map(function (value) {
                var parts = value.match(/([-\+]?[0-9]+[\.0-9]*)(deg|rad|grad|px|%)*/) || [];

                return {
                    value: parseFloat(parts[1]),
                    units: parts[2],
                    unparsed: value
                };
            }),
            unparsed: str
        };
    };

    var transformOperations = transformStatements.map(parseTransformStatement);
    var startingMatrix = new FirminCSSMatrix();
    var transformedMatrix = transformOperations.reduce(function (matrix, operation) {
        // convert to degrees b/c all CSSMatrix methods expect degrees
        operation.value = operation.value.map(function (operation) {
            if (operation.units == 'rad') {
                operation.value = operation.value * (180 / Math.PI);
                operation.units = 'deg';
            }
            else if (operation.units == 'grad') {
                operation.value = operation.value / (400 / 360); // 400 gradians in 360 degrees
                operation.units = 'deg'
            }

            return operation;
        });

        var jsFunction = cssFunctionToJsFunction[operation.key];
        var result = jsFunction(matrix, operation);

        return result || matrix;
    }, startingMatrix);

    return transformedMatrix.toString();
};

/**
 *  FirminCSSMatrix#a -> Number
 *  The first 2D vector value.
 **/

/**
 *  FirminCSSMatrix#b -> Number
 *  The second 2D vector value.
 **/

/**
 *  FirminCSSMatrix#c -> Number
 *  The third 2D vector value.
 **/

/**
 *  FirminCSSMatrix#d -> Number
 *  The fourth 2D vector value.
 **/

/**
 *  FirminCSSMatrix#e -> Number
 *  The fifth 2D vector value.
 **/

/**
 *  FirminCSSMatrix#f -> Number
 *  The sixth 2D vector value.
 **/

/**
 *  FirminCSSMatrix#m11 -> Number
 *  The 3D matrix value in the first row and first column.
 **/

/**
 *  FirminCSSMatrix#m12 -> Number
 *  The 3D matrix value in the first row and second column.
 **/

/**
 *  FirminCSSMatrix#m13 -> Number
 *  The 3D matrix value in the first row and third column.
 **/

/**
 *  FirminCSSMatrix#m14 -> Number
 *  The 3D matrix value in the first row and fourth column.
 **/

/**
 *  FirminCSSMatrix#m21 -> Number
 *  The 3D matrix value in the second row and first column.
 **/

/**
 *  FirminCSSMatrix#m22 -> Number
 *  The 3D matrix value in the second row and second column.
 **/

/**
 *  FirminCSSMatrix#m23 -> Number
 *  The 3D matrix value in the second row and third column.
 **/

/**
 *  FirminCSSMatrix#m24 -> Number
 *  The 3D matrix value in the second row and fourth column.
 **/

/**
 *  FirminCSSMatrix#m31 -> Number
 *  The 3D matrix value in the third row and first column.
 **/

/**
 *  FirminCSSMatrix#m32 -> Number
 *  The 3D matrix value in the third row and second column.
 **/

/**
 *  FirminCSSMatrix#m33 -> Number
 *  The 3D matrix value in the third row and third column.
 **/

/**
 *  FirminCSSMatrix#m34 -> Number
 *  The 3D matrix value in the third row and fourth column.
 **/

/**
 *  FirminCSSMatrix#m41 -> Number
 *  The 3D matrix value in the fourth row and first column.
 **/

/**
 *  FirminCSSMatrix#m42 -> Number
 *  The 3D matrix value in the fourth row and second column.
 **/

/**
 *  FirminCSSMatrix#m43 -> Number
 *  The 3D matrix value in the fourth row and third column.
 **/

/**
 *  FirminCSSMatrix#m44 -> Number
 *  The 3D matrix value in the fourth row and fourth column.
 **/

[["m11", "a"],
    ["m12", "b"],
    ["m21", "c"],
    ["m22", "d"],
    ["m41", "e"],
    ["m42", "f"]].forEach(function(pair) {
    var key3d = pair[0], key2d = pair[1];

    Object.defineProperty(FirminCSSMatrix.prototype, key2d, {
        set: function(val) {
            this[key3d] = val;
        },

        get: function() {
            return this[key3d];
        },
        enumerable : true,
        configurable : true
    });
});

/**
 *  FirminCSSMatrix#isAffine() -> Boolean
 *
 *  Determines whether the matrix is affine.
 **/
FirminCSSMatrix.prototype.isAffine = function() {
    return this.m13 === 0 && this.m14 === 0 &&
    this.m23 === 0 && this.m24 === 0 &&
    this.m31 === 0 && this.m32 === 0 &&
    this.m33 === 1 && this.m34 === 0 &&
    this.m43 === 0 && this.m44 === 1;
};

/**
 *  FirminCSSMatrix#multiply(otherMatrix) -> FirminCSSMatrix
 *  - otherMatrix (FirminCSSMatrix): the matrix to multiply this one by.
 *
 *  Multiplies the matrix by a given matrix and returns the result.
 **/
FirminCSSMatrix.prototype.multiply = function(otherMatrix) {
    if (!otherMatrix) return null;

    var a = otherMatrix,
    b = this,
    c = new FirminCSSMatrix();

    c.m11 = a.m11 * b.m11 + a.m12 * b.m21 + a.m13 * b.m31 + a.m14 * b.m41;
    c.m12 = a.m11 * b.m12 + a.m12 * b.m22 + a.m13 * b.m32 + a.m14 * b.m42;
    c.m13 = a.m11 * b.m13 + a.m12 * b.m23 + a.m13 * b.m33 + a.m14 * b.m43;
    c.m14 = a.m11 * b.m14 + a.m12 * b.m24 + a.m13 * b.m34 + a.m14 * b.m44;

    c.m21 = a.m21 * b.m11 + a.m22 * b.m21 + a.m23 * b.m31 + a.m24 * b.m41;
    c.m22 = a.m21 * b.m12 + a.m22 * b.m22 + a.m23 * b.m32 + a.m24 * b.m42;
    c.m23 = a.m21 * b.m13 + a.m22 * b.m23 + a.m23 * b.m33 + a.m24 * b.m43;
    c.m24 = a.m21 * b.m14 + a.m22 * b.m24 + a.m23 * b.m34 + a.m24 * b.m44;

    c.m31 = a.m31 * b.m11 + a.m32 * b.m21 + a.m33 * b.m31 + a.m34 * b.m41;
    c.m32 = a.m31 * b.m12 + a.m32 * b.m22 + a.m33 * b.m32 + a.m34 * b.m42;
    c.m33 = a.m31 * b.m13 + a.m32 * b.m23 + a.m33 * b.m33 + a.m34 * b.m43;
    c.m34 = a.m31 * b.m14 + a.m32 * b.m24 + a.m33 * b.m34 + a.m34 * b.m44;

    c.m41 = a.m41 * b.m11 + a.m42 * b.m21 + a.m43 * b.m31 + a.m44 * b.m41;
    c.m42 = a.m41 * b.m12 + a.m42 * b.m22 + a.m43 * b.m32 + a.m44 * b.m42;
    c.m43 = a.m41 * b.m13 + a.m42 * b.m23 + a.m43 * b.m33 + a.m44 * b.m43;
    c.m44 = a.m41 * b.m14 + a.m42 * b.m24 + a.m43 * b.m34 + a.m44 * b.m44;

    return c;
};

/**
 *  FirminCSSMatrix#isIdentityOrTranslation() -> Boolean
 *
 *  Returns whether the matrix is the identity matrix or a translation matrix.
 **/
FirminCSSMatrix.prototype.isIdentityOrTranslation = function() {
    var t = this;
    return t.m11 === 1 && t.m12 === 0 && t.m13 === 0 && t.m14 === 0 &&
    t.m21 === 0 && t.m22 === 1 && t.m23 === 0 && t.m24 === 0 &&
    t.m31 === 0 && t.m31 === 0 && t.m33 === 1 && t.m34 === 0 &&
        /* m41, m42 and m43 are the translation points */   t.m44 === 1;
};

/**
 *  FirminCSSMatrix#adjoint() -> FirminCSSMatrix
 *
 *  Returns the adjoint matrix.
 **/
FirminCSSMatrix.prototype.adjoint = function() {
    var result = new FirminCSSMatrix(), t = this,
    determinant3x3 = FirminCSSMatrix.determinant3x3,

    a1 = t.m11, b1 = t.m12, c1 = t.m13, d1 = t.m14,
    a2 = t.m21, b2 = t.m22, c2 = t.m23, d2 = t.m24,
    a3 = t.m31, b3 = t.m32, c3 = t.m33, d3 = t.m34,
    a4 = t.m41, b4 = t.m42, c4 = t.m43, d4 = t.m44;

    // Row column labeling reversed since we transpose rows & columns
    result.m11 =  determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4);
    result.m21 = -determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4);
    result.m31 =  determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4);
    result.m41 = -determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);

    result.m12 = -determinant3x3(b1, b3, b4, c1, c3, c4, d1, d3, d4);
    result.m22 =  determinant3x3(a1, a3, a4, c1, c3, c4, d1, d3, d4);
    result.m32 = -determinant3x3(a1, a3, a4, b1, b3, b4, d1, d3, d4);
    result.m42 =  determinant3x3(a1, a3, a4, b1, b3, b4, c1, c3, c4);

    result.m13 =  determinant3x3(b1, b2, b4, c1, c2, c4, d1, d2, d4);
    result.m23 = -determinant3x3(a1, a2, a4, c1, c2, c4, d1, d2, d4);
    result.m33 =  determinant3x3(a1, a2, a4, b1, b2, b4, d1, d2, d4);
    result.m43 = -determinant3x3(a1, a2, a4, b1, b2, b4, c1, c2, c4);

    result.m14 = -determinant3x3(b1, b2, b3, c1, c2, c3, d1, d2, d3);
    result.m24 =  determinant3x3(a1, a2, a3, c1, c2, c3, d1, d2, d3);
    result.m34 = -determinant3x3(a1, a2, a3, b1, b2, b3, d1, d2, d3);
    result.m44 =  determinant3x3(a1, a2, a3, b1, b2, b3, c1, c2, c3);

    return result;
};

/**
 *  FirminCSSMatrix#inverse() -> FirminCSSMatrix | null
 *
 *  If the matrix is invertible, returns its inverse, otherwise returns null.
 **/
FirminCSSMatrix.prototype.inverse = function() {
    var inv, det, result, i, j;

    if (this.isIdentityOrTranslation()) {
        inv = new FirminCSSMatrix();

        if (!(this.m41 === 0 && this.m42 === 0 && this.m43 === 0)) {
            inv.m41 = -this.m41;
            inv.m42 = -this.m42;
            inv.m43 = -this.m43;
        }

        return inv;
    }

    // Calculate the adjoint matrix
    result = this.adjoint();

    // Calculate the 4x4 determinant
    det = FirminCSSMatrix.determinant4x4(this);

    // If the determinant is zero, then the inverse matrix is not unique
    if (Math.abs(det) < 1e-8) return null;

    // Scale the adjoint matrix to get the inverse
    for (i = 1; i < 5; i++) {
        for (j = 1; j < 5; j++) {
            result[("m" + i) + j] /= det;
        }
    }

    return result;
};

/**
 *  FirminCSSMatrix#rotate(rotX, rotY, rotZ) -> FirminCSSMatrix
 *  - rotX (Number): the rotation around the x axis.
 *  - rotY (Number): the rotation around the y axis. If undefined, the x
 *    component is used.
 *  - rotZ (Number): the rotation around the z axis. If undefined, the x
 *    component is used.
 *
 *  Returns the result of rotating the matrix by a given vector.
 *
 *  If only the first argument is provided, the matrix is only rotated about
 *  the z axis.
 **/
FirminCSSMatrix.prototype.rotate = function(rx, ry, rz) {
    var degreesToRadians = FirminCSSMatrix.degreesToRadians;

    if (typeof rx != "number" || isNaN(rx)) rx = 0;

    if ((typeof ry != "number" || isNaN(ry)) &&
    (typeof rz != "number" || isNaN(rz))) {
        rz = rx;
        rx = 0;
        ry = 0;
    }

    if (typeof ry != "number" || isNaN(ry)) ry = 0;
    if (typeof rz != "number" || isNaN(rz)) rz = 0;

    rx = degreesToRadians(rx);
    ry = degreesToRadians(ry);
    rz = degreesToRadians(rz);

    var tx = new FirminCSSMatrix(),
    ty = new FirminCSSMatrix(),
    tz = new FirminCSSMatrix(),
    sinA, cosA, sinA2;

    rz /= 2;
    sinA = Math.sin(rz);
    cosA = Math.cos(rz);
    sinA2 = sinA * sinA;

    // Matrices are identity outside the assigned values
    tz.m11 = tz.m22 = 1 - 2 * sinA2;
    tz.m12 = tz.m21 = 2 * sinA * cosA;
    tz.m21 *= -1;

    ry /= 2;
    sinA  = Math.sin(ry);
    cosA  = Math.cos(ry);
    sinA2 = sinA * sinA;

    ty.m11 = ty.m33 = 1 - 2 * sinA2;
    ty.m13 = ty.m31 = 2 * sinA * cosA;
    ty.m13 *= -1;

    rx /= 2;
    sinA = Math.sin(rx);
    cosA = Math.cos(rx);
    sinA2 = sinA * sinA;

    tx.m22 = tx.m33 = 1 - 2 * sinA2;
    tx.m23 = tx.m32 = 2 * sinA * cosA;
    tx.m32 *= -1;

    var isIdentity = (this.toString() === (new FirminCSSMatrix).toString());

    return (isIdentity)
    ? tz.multiply(ty).multiply(tx)
    : this.multiply(tx).multiply(ty).multiply(tz);
};

/**
 *  FirminCSSMatrix#rotateAxisAngle(rotX, rotY, rotZ, angle) -> FirminCSSMatrix
 *  - rotX (Number): the rotation around the x axis.
 *  - rotY (Number): the rotation around the y axis. If undefined, the x
 *    component is used.
 *  - rotZ (Number): the rotation around the z axis. If undefined, the x
 *    component is used.
 *  - angle (Number): the angle of rotation about the axis vector, in degrees.
 *
 *  Returns the result of rotating the matrix around a given vector by a given
 *  angle.
 *
 *  If the given vector is the origin vector then the matrix is rotated by the
 *  given angle around the z axis.
 **/
FirminCSSMatrix.prototype.rotateAxisAngle = function(x, y, z, a) {
    if (typeof x != "number" || isNaN(x)) x = 0;
    if (typeof y != "number" || isNaN(y)) y = 0;
    if (typeof z != "number" || isNaN(z)) z = 0;
    if (typeof a != "number" || isNaN(a)) a = 0;
    if (x === 0 && y === 0 && z === 0) z = 1;

    var t   = new FirminCSSMatrix(),
    len = Math.sqrt(x * x + y * y + z * z),
    cosA, sinA, sinA2, csA, x2, y2, z2;

    a     = (FirminCSSMatrix.degreesToRadians(a) || 0) / 2;
    cosA  = Math.cos(a);
    sinA  = Math.sin(a);
    sinA2 = sinA * sinA;

    // Bad vector, use something sensible
    if (len === 0) {
        x = 0;
        y = 0;
        z = 1;
    } else if (len !== 1) {
        x /= len;
        y /= len;
        z /= len;
    }

    // Optimise cases where axis is along major axis
    if (x === 1 && y === 0 && z === 0) {
        t.m22 = t.m33 = 1 - 2 * sinA2;
        t.m23 = t.m32 = 2 * cosA * sinA;
        t.m32 *= -1;
    } else if (x === 0 && y === 1 && z === 0) {
        t.m11 = t.m33 = 1 - 2 * sinA2;
        t.m13 = t.m31 = 2 * cosA * sinA;
        t.m13 *= -1;
    } else if (x === 0 && y === 0 && z === 1) {
        t.m11 = t.m22 = 1 - 2 * sinA2;
        t.m12 = t.m21 = 2 * cosA * sinA;
        t.m21 *= -1;
    } else {
        csA = sinA * cosA;
        x2  = x * x;
        y2  = y * y;
        z2  = z * z;

        t.m11 = 1 - 2 * (y2 + z2) * sinA2;
        t.m12 = 2 * (x * y * sinA2 + z * csA);
        t.m13 = 2 * (x * z * sinA2 - y * csA);
        t.m21 = 2 * (y * x * sinA2 - z * csA);
        t.m22 = 1 - 2 * (z2 + x2) * sinA2;
        t.m23 = 2 * (y * z * sinA2 + x * csA);
        t.m31 = 2 * (z * x * sinA2 + y * csA);
        t.m32 = 2 * (z * y * sinA2 - x * csA);
        t.m33 = 1 - 2 * (x2 + y2) * sinA2;
    }

    return this.multiply(t);
};

/**
 *  FirminCSSMatrix#scale(scaleX, scaleY, scaleZ) -> FirminCSSMatrix
 *  - scaleX (Number): the scaling factor in the x axis.
 *  - scaleY (Number): the scaling factor in the y axis. If undefined, the x
 *    component is used.
 *  - scaleZ (Number): the scaling factor in the z axis. If undefined, 1 is
 *    used.
 *
 *  Returns the result of scaling the matrix by a given vector.
 **/
FirminCSSMatrix.prototype.scale = function(scaleX, scaleY, scaleZ) {
    var transform = new FirminCSSMatrix();

    if (typeof scaleX != "number" || isNaN(scaleX)) scaleX = 1;
    if (typeof scaleY != "number" || isNaN(scaleY)) scaleY = scaleX;
    if (typeof scaleZ != "number" || isNaN(scaleZ)) scaleZ = 1;

    transform.m11 = scaleX;
    transform.m22 = scaleY;
    transform.m33 = scaleZ;

    return this.multiply(transform);
};

/**
 *  FirminCSSMatrix#skewX(skewX) -> FirminCSSMatrix
 *  - skewX (Number): the scaling factor in the x axis.
 *
 *  Returns the result of skewing the matrix by a given vector.
 **/
FirminCSSMatrix.prototype.skewX = function(degrees) {
    var radians = FirminCSSMatrix.degreesToRadians(degrees);
    var transform = new FirminCSSMatrix();

    transform.c = Math.tan(radians);

    return this.multiply(transform);
};

/**
 *  FirminCSSMatrix#skewY(skewY) -> FirminCSSMatrix
 *  - skewY (Number): the scaling factor in the x axis.
 *
 *  Returns the result of skewing the matrix by a given vector.
 **/
FirminCSSMatrix.prototype.skewY = function(degrees) {
    var radians = FirminCSSMatrix.degreesToRadians(degrees);
    var transform = new FirminCSSMatrix();

    transform.b = Math.tan(radians);

    return this.multiply(transform);
};

/**
 *  FirminCSSMatrix#translate(x, y, z) -> FirminCSSMatrix
 *  - x (Number): the x component of the vector.
 *  - y (Number): the y component of the vector.
 *  - z (Number): the z component of the vector. If undefined, 0 is used.
 *
 *  Returns the result of translating the matrix by a given vector.
 **/
FirminCSSMatrix.prototype.translate = function(x, y, z) {
    var t = new FirminCSSMatrix();

    if (typeof x != "number" || isNaN(x)) x = 0;
    if (typeof y != "number" || isNaN(y)) y = 0;
    if (typeof z != "number" || isNaN(z)) z = 0;

    t.m41 = x;
    t.m42 = y;
    t.m43 = z;

    return this.multiply(t);
};

/**
 *  FirminCSSMatrix#setMatrixValue(domstr) -> undefined
 *  - domstr (String): a string representation of a 2D or 3D transform matrix
 *    in the form given by the CSS transform property, i.e. just like the
 *    output from [[FirminCSSMatrix#toString]].
 *
 *  Sets the matrix values using a string representation, such as that produced
 *  by the [[FirminCSSMatrix#toString]] method.
 **/
FirminCSSMatrix.prototype.setMatrixValue = function(domstr) {
    domstr = FirminCSSMatrix.toMatrixString(domstr.trim());
    var mstr   = domstr.match(/^matrix(3d)?\(\s*(.+)\s*\)$/),
    is3d, chunks, len, points, i, chunk;

    if (!mstr) return;

    is3d   = !!mstr[1];
    chunks = mstr[2].split(/\s*,\s*/);
    len    = chunks.length;
    points = new Array(len);

    if ((is3d && len !== 16) || !(is3d || len === 6)) return;

    for (i = 0; i < len; i++) {
        chunk = chunks[i];
        if (chunk.match(/^-?\d+(\.\d+)?$/)) {
            points[i] = parseFloat(chunk);
        } else return;
    }

    for (i = 0; i < len; i++) {
        var point = is3d ?
        ("m" + (Math.floor(i / 4) + 1)) + (i % 4 + 1) :
        String.fromCharCode(i + 97); // ASCII char 97 == 'a'
        this[point] = points[i];
    }
};

/**
 *  FirminCSSMatrix#toString() -> String
 *
 *  Returns a string representation of the matrix.
 **/
FirminCSSMatrix.prototype.toString = function() {
    var self = this, points, prefix;

    if (this.isAffine()) {
        prefix = "matrix(";
        points = ["a", "b", "c", "d", "e", "f"];
    } else {
        prefix = "matrix3d(";
        points = ["m11", "m12", "m13", "m14",
            "m21", "m22", "m23", "m24",
            "m31", "m32", "m33", "m34",
            "m41", "m42", "m43", "m44"];
    }

    return prefix + points.map(function(p) {
        return self[p].toFixed(6);
    }).join(", ") + ")";
};

XML3D.css.CSSMatrix = FirminCSSMatrix;


XML3D.css.convertCssToMat4 = function(cssMatrix, m){
    var matrix = m || mat4.create();
    matrix[0] = cssMatrix.m11;
    matrix[1] = cssMatrix.m12;
    matrix[2] = cssMatrix.m13;
    matrix[3] = cssMatrix.m14;
    matrix[4] = cssMatrix.m21;
    matrix[5] = cssMatrix.m22;
    matrix[6] = cssMatrix.m23;
    matrix[7] = cssMatrix.m24;
    matrix[8] = cssMatrix.m31;
    matrix[9] = cssMatrix.m32;
    matrix[10] = cssMatrix.m33;
    matrix[11] = cssMatrix.m34;
    matrix[12] = cssMatrix.m41;
    matrix[13] = cssMatrix.m42;
    matrix[14] = cssMatrix.m43;
    matrix[15] = cssMatrix.m44;
    return matrix;
}
