module("Xflow Bugs", {
	setup : function() {
		stop();
		var that = this;
		loadDocument("scenes/xflow_caching.html", function () {
			// forceTestFail set by scene document
			that.failed = document.getElementById("xml3dframe").contentWindow.forceTestFail;
			start();
		});
	}
});

test("Check cannot read property channeling of undefined", function() {
	ok(!this.failed);
});

