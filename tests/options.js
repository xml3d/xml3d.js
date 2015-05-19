module("Options", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/view.html?xml3d-loglevel=exception", this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("get global value", 5, function() {
    notEqual(XML3D.options.getKeys().length, 0, "There should be some registered options");
    notStrictEqual(XML3D.options.getValue(XML3D.options.getKeys()[0]), null, "Get a valid key");
    throws(function() {
        XML3D.options.getValue("unknown value");
    }, "Error if querying option that has not been registered.");
});

test("registering", 5, function() {
    var optionCount = XML3D.options.getKeys().length;
    XML3D.options.register("option.regnew", "mydefaultValue");
    equal(XML3D.options.getKeys().length, optionCount + 1, "One option more");
    equal(XML3D.options.getValue("option.regnew"), "mydefaultValue");
    throws(function() {
        XML3D.options.register("option.regnew", "mydefaultValue");
    }, "Registering twice throws error");
});

test("set global value", 4, function() {
    XML3D.options.register("option.new", "mydefaultValue");
    equal(XML3D.options.getValue("option.new"), "mydefaultValue");
    XML3D.options.setValue("option.new", "newValue");
    equal(XML3D.options.getValue("option.new"), "newValue");
});

test("observer", 5, function() {
    var callback = function(opt, value) {
        ok(true, "Observer notified");
        equal(opt, "option.observer", "correct option");
        equal(value, "newvalue", "correct value");
        start();
    };

    XML3D.options.register("option.observer", "myValue");
    XML3D.options.addObserver(callback);
    stop();
    XML3D.options.setValue("option.observer", "newvalue");
    XML3D.options.removeObserver(callback);
    XML3D.options.setValue("option.observer", "newvalue2");
});


test("filtered observer", 5, function() {
    var callback = function(opt, value) {
        ok(true, "Observer notified");
        equal(opt, "option.option1", "correct option");
        equal(value, "newvalue1", "correct value");
        start();
    };

    XML3D.options.register("option.option1", "myValue1");
    XML3D.options.register("option.option2", "myValue2");
    XML3D.options.addObserver("option.option1", callback);
    stop();
    XML3D.options.setValue("option.option1", "newvalue1");
    XML3D.options.setValue("option.option2", "newvalue2");
    XML3D.options.removeObserver(callback);
    XML3D.options.setValue("option.option1", "newvalue1");
});

test("reset", 8, function() {
    var hasRun = false;
    var callback = function(opt, value) {

        ok(true, "Observer notified");
        equal(opt, "option.reset", "correct option");
        equal(value, hasRun? "myValue" : "newvalue", "correct value");
        start();
        hasRun = true;
    };

    XML3D.options.register("option.reset", "myValue");
    XML3D.options.addObserver(callback);
    stop();
    XML3D.options.setValue("option.reset", "newvalue");
    stop();
    XML3D.options.resetValue("option.reset");
    XML3D.options.removeObserver(callback);

});

test("as query string", 4, function() {
    var options = this.doc.defaultView.XML3D.options;
    notEqual(options.getKeys().indexOf("loglevel"), -1, "Loglevel set via query string");
    equal(options.getValue("loglevel"), "exception", "Correct value")
});
