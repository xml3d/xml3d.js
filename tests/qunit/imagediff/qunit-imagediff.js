QUnit.extend( QUnit, {
    imageEqual: function(actual, expected, message) {
        var passes = actual === expected || imagediff.equal(actual, expected);
        QUnit.push(passes, actual, expected, message);
    },
    imageClose: function(actual, expected, maxDifference, message) {
        var passes = actual === expected || imagediff.equal(actual, expected);
        QUnit.push(passes, actual, expected, message);
    }
});
