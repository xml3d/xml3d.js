QUnit.extend( QUnit, {

	/** Small helper function for not having to manually compare vectors
	 *  all the time.
	 */
	__passesVector : function(actual, expected, maxDifference) {

		return (Math.abs(actual.x - expected.x) <= maxDifference &&
				Math.abs(actual.y - expected.y) <= maxDifference &&
				Math.abs(actual.z - expected.z) <= maxDifference);
	},

	closeVector : function(actual, expected, maxDifference, message) {
		var passes = (actual === expected) ||
			QUnit.__passesVector(actual, expected, maxDifference);
		QUnit.push(passes, actual, expected, message);
	},
	
	closeRotation : function(actual, expected, maxDifference, message) {
		var passes = (actual === expected) || 
			QUnit.__passesVector(actual.axis, expected.axis, maxDifference) &&
			(Math.abs(actual.angle - expected.angle) <= maxDifference);
		QUnit.push(passes, actual, expected, message);
	},
	
	closeMatrix  : function(actual, expected, maxDifference, message) {
		var passes = 
			Math.abs(actual.m11 - expected.m11) <= maxDifference &&
			Math.abs(actual.m12 - expected.m12) <= maxDifference &&
			Math.abs(actual.m13 - expected.m13) <= maxDifference &&
			Math.abs(actual.m14 - expected.m14) <= maxDifference &&
			Math.abs(actual.m21 - expected.m21) <= maxDifference &&
			Math.abs(actual.m22 - expected.m22) <= maxDifference &&
			Math.abs(actual.m23 - expected.m23) <= maxDifference &&
			Math.abs(actual.m24 - expected.m24) <= maxDifference &&
			Math.abs(actual.m31 - expected.m31) <= maxDifference &&
			Math.abs(actual.m32 - expected.m32) <= maxDifference &&
			Math.abs(actual.m33 - expected.m33) <= maxDifference &&
			Math.abs(actual.m34 - expected.m34) <= maxDifference &&
			Math.abs(actual.m41 - expected.m41) <= maxDifference &&
			Math.abs(actual.m42 - expected.m42) <= maxDifference &&
			Math.abs(actual.m43 - expected.m43) <= maxDifference &&
			Math.abs(actual.m44 - expected.m44) <= maxDifference ;
		QUnit.push(passes, actual, expected, message);
	},

	closeRay : function(actual, expected, maxDifference, message) {
		var passes =
			QUnit.__passesVector(actual.origin, expected.origin, maxDifference) &&
			QUnit.__passesVector(actual.direction, expected.direction, maxDifference);
		QUnit.push(passes, actual, expected, message);
	},

	closeBox : function(actual, expected, maxDifference, message) {
		var passes =
			QUnit.__passesVector(actual.min, expected.min, maxDifference) &&
			QUnit.__passesVector(actual.max, expected.max, maxDifference);
		QUnit.push(passes, actual, expected, message);
	}
			
});
new (function() {

    var original = QUnit.jsDump.parsers.object;
    QUnit.jsDump.setParser("object", function(a,b) {
        if(a instanceof XML3DVec3 || a instanceof XML3DRotation )
            return a.toString();
        return original(a,b);
    });
})();