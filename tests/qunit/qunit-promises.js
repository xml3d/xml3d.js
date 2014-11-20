(function (QUnit) {
  // jQuery promise objects have .then and .always methods
  // Q promise objects have .then and .finally methods
  function verifyPromise(promise) {
    if (!promise) {
      throw new Error('expected a promise object');
    }
    if (typeof promise.then !== 'function') {
      throw new Error('promise object does not have .then function');
    }
    if (typeof promise.always !== 'function' &&
      typeof promise['finally'] !== 'function') {
      throw new Error('promise object does not have .always or .finally');
    }
    return alwaysName(promise);
  }

  function alwaysName(promise) {
    if (typeof promise.always === 'function') {
      return 'always';
    } else if (typeof promise['finally'] === 'function') {
      return 'finally';
    } else {
      throw new Error('promise object does not have "always" method');
    }
  }

  QUnit.extend(QUnit.assert, {
    // resolved promises
    will: function (promise, message) {
      var always = verifyPromise(promise);

      QUnit.stop();
      promise.then(function () {
        QUnit.push(true, undefined, undefined, message);
      }, function () {
        QUnit.push(false, undefined, undefined, 'promise rejected (but should have been resolved)');
      })[always](QUnit.start).done();
    },

    willEqual: function (promise, expected, message) {
      var always = verifyPromise(promise);

      QUnit.stop();
      promise.then(function (actual) {
        QUnit.push(actual == expected, actual, expected, message);
      }, function (actual) {
        QUnit.push(false, actual, expected, 'promise rejected (but should have been resolved)');
      })[always](QUnit.start).done();
    },

    willDeepEqual: function (promise, expected, message) {
      var always = verifyPromise(promise);

      QUnit.stop();
      promise.then(function (actual) {
        if (typeof QUnit.equiv !== 'function') {
          throw new Error('Missing QUnit.equiv function');
        }
        QUnit.push(QUnit.equiv(actual, expected), actual, expected, message);
      }, function (actual) {
        QUnit.push(false, actual, expected, 'promise rejected (but should have been resolved)');
      })[always](QUnit.start).done();
    },

    // rejected promises
    wont: function (promise, message) {
      var always = verifyPromise(promise);

      QUnit.stop();
      promise.then(function () {
        QUnit.push(false, undefined, undefined, 'promise resolved (but should have been rejected)');
      }, function () {
        QUnit.push(true, undefined, undefined, message);
      })[always](QUnit.start).done();
    },

    wontEqual: function (promise, expected, message) {
      var always = verifyPromise(promise);

      QUnit.stop();
      promise.then(function (actual) {
        QUnit.push(false, actual, expected, 'promise resolved (but should have been rejected)');
      }, function (actual) {
        QUnit.push(actual == expected, actual, expected, message);
      })[always](QUnit.start).done();
    }
  });
}(QUnit));
