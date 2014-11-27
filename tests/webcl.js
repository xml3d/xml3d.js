module("WebCL API", {
    setup: function () {
        this.webcl = XML3D.webcl;
        this.testCLCode = ["__kernel void clThresholdImage1(__global const uchar4* src, __global uchar4* dst, uint width, uint height)",
            "{",
            "int x = get_global_id(0);",
            "int y = get_global_id(1);",
            "if (x >= width || y >= height) return;",
            "int i = y * width + x;",
            "int color = src[i].x;",
            "if (color < 50)",
            "{",
            "color=0;",
            "}else{",
            "color=255;",
            "}",
            "dst[i] = (uchar4)(color, color, color, 255);",
            "}",
            "__kernel void clThresholdImage2(__global const uchar4* src, __global uchar4* dst, uint width, uint height)",
            "{",
            "int x = get_global_id(0);",
            "int y = get_global_id(1);",
            "if (x >= width || y >= height) return;",
            "int i = y * width + x;",
            "int color = src[i].x;",
            "if (color > 50)",
            "{",
            "color=0;",
            "}else{",
            "color=255;",
            "}",
            "dst[i] = (uchar4)(color, color, color, 255);",
            "}"
        ].join("\n");

        this.webcl.init();

        // Test function for WebCL program building
        this.compiles = function () {
        }

    },

    teardown: function () {

    }
});

test("Init", function () {
    if (!this.webcl.hasWebCLNamespace()) {
        expect(0);
        return;
    }

    expect(6);

    var OpenCLDriversOK = this.webcl.hasOpenCLDrivers();
    ok(OpenCLDriversOK, "OpenCL drivers working");

    var platforms = this.webcl.getPlatforms();

    ok(platforms.length !== 0, "WebCL device platforms accessible");

    devices = this.webcl.getDevicesByType("GPU");
    ok(devices.length !== 0, 'Finding devices by type: "GPU" (Should fail if your device does not have any GPUs)');

    devices = this.webcl.getDevicesByType("CPU");
    ok(devices.length !== 0, 'Finding devices by type: "CPU" (Should fail if your device does not have any CPUs)');

    devices = this.webcl.getDevicesByType("ALL");
    ok(devices.length !== 0, 'Finding devices by type: "ALL"');

    var devices = this.webcl.getDevicesByType("CPU");
    var ctx = this.webcl.createContext(devices);
    ok(ctx, "Creating WebCL context");

});


test("Programs and Kernels", function () {
    if (!this.webcl.isAvailable()) {
        expect(0);
        return;
    }

    expect(8);

    var self = this;

    var program = this.webcl.createProgram(this.testCLCode);
    ok(program, "Create a WebCL program (kernels: 'clThresholdImage1', 'clThresholdImage2')");

    program = this.webcl.buildProgram(program);
    ok(program, "Build the WebCL program");

    var kernel = this.webcl.createKernel(program, "clThresholdImage1");
    ok(kernel, "Create kernel from the program (kernel: 'clThresholdImage1')");

    kernel = this.webcl.createKernel(program, "clThresholdImage2");
    ok(kernel, "Create kernel from the program (kernel: 'clThresholdImage2')");

    throws(function () {
            self.webcl.createKernel(program, "dontHaveIt");
        },
        function (e) {
            return e.name === "INVALID_KERNEL_NAME";
        },
        "Create kernel with a name not defined in the program code (kernel: 'dontHaveIt')"
    );


    kernel = this.webcl.kernels.register("clThresholdImage1", this.testCLCode);
    ok(kernel, "Create and register a kernel from program code (kernel: 'clThresholdImage1')");

    kernel = this.webcl.kernels.getKernel("clThresholdImage1");
    ok(kernel, "Get registered kernel");

    kernel = this.webcl.kernels.unRegister("clThresholdImage1");
    ok(kernel, "Unregister a kernel and release the resources");

});

test("Buffers", function () {
    if (!this.webcl.isAvailable()) {
        expect(0);
        return;
    }

    expect(7);

    var self = this,
        buffSize = 1024;

    var readBuff = this.webcl.createBuffer(buffSize, "r");
    ok(readBuff, "Create read buffer");

    var writeBuff = this.webcl.createBuffer(buffSize, "w");
    ok(writeBuff, "Create write buffer");

    var readWriteBuff = this.webcl.createBuffer(buffSize, "rw");
    ok(readWriteBuff, "Create read-write buffer");

    var unknownBuffType = this.webcl.createBuffer(buffSize, "x");
    equal(unknownBuffType, false, "Invalid buffer type: 'x'");

    var invalidBufferSize = this.webcl.createBuffer("as", "r");
    equal(invalidBufferSize, false, "Invalid buffer size: 'as'");

    invalidBufferSize = this.webcl.createBuffer(-10, "r");
    equal(invalidBufferSize, false, "Invalid buffer size: -10");

    throws(function () {
            self.webcl.createBuffer(500000000000000000000000000 * 500000000000000000000000000, "r");
        },
        function (e) {
            return e.name === "INVALID_VALUE";
        },
        "Invalid buffer size: Too large buffer size"
    );


});

test("Processing", function () {
    if (!this.webcl.isAvailable()) {
        expect(0);
        return;
    }

    expect(8);

    var self = this,
        testData = new Uint8Array([20, 20, 20, 255, 80, 80, 80, 255, 45, 45, 45, 255]),
        buffSize = testData.length;

    var commandQueue = this.webcl.createCommandQueue();
    ok(commandQueue, "Create command queue");

    throws(function () {
            self.webcl.createCommandQueue({nope: true});
        },
        function (e) {
            return e.name === "INVALID_DEVICE";
        },
        "Create command queue for non-existing device"
    );

    this.webcl.kernels.register("clThresholdImage1", this.testCLCode);
    this.webcl.kernels.register("clThresholdImage2", this.testCLCode);

    var kernel1 = this.webcl.kernels.getKernel("clThresholdImage1"),
        kernel2 = this.webcl.kernels.getKernel("clThresholdImage1"),
        buffIn = this.webcl.createBuffer(buffSize, "r"),
        buffOut = this.webcl.createBuffer(buffSize, "w");

    var assert = this.webcl.kernels.setArgs(kernel1, buffIn, buffOut, new Uint32Array([3]), new Uint32Array([1]));
    ok(assert, "Set kernel arguments: Valid input");

    assert = this.webcl.kernels.setArgs(kernel1, buffIn, buffOut, new Uint32Array([3]));
    equal(assert, false, "Set kernel arguments: Less arguments than required by a kernel");

    assert = this.webcl.kernels.setArgs(undefined, buffIn, buffOut, new Uint32Array([3]), new Uint32Array([1]));
    equal(assert, false, "Set kernel arguments: Undefined kernel");

    throws(function () {
            self.webcl.kernels.setArgs(kernel2, buffIn, buffOut, new Uint32Array(), new Uint32Array([1]));
        },
        function (e) {
            return e.name === "INVALID_ARG_SIZE";
        },
        "Set kernel arguments: Invalid kernel argument size"
    );

    throws(function () {
            self.webcl.kernels.setArgs(kernel2, undefined, buffOut, new Uint32Array([3]), new Uint32Array([1]));
        },
        // Nokia's WebCL plugin returns this error message only.
        {
        	  "message": "'value' must be a Buffer, Image, Sampler or ArrayBufferView; was undefined [typeof undefined]",
        	  "name": "TypeError"
        	},
        "Set kernel arguments: Argument is undefined"
    );


    // Processing (CommandQueue is not yet fully wrapped in the API)

    var result = new Uint8Array(testData.length),
        expectedResult = new Uint8Array([0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255]);

    commandQueue.enqueueWriteBuffer(buffIn, false, 0, buffSize, testData, []);

    // Init ND-range
    var localWS = [16, 4],
        globalWS = [Math.ceil(3 / localWS[0]) * localWS[0],
            Math.ceil(1 / localWS[1]) * localWS[1]];

    // Execute (enqueue) kernel
    commandQueue.enqueueNDRangeKernel(kernel1, globalWS.length, null, globalWS, localWS);

    // Read the result buffer from OpenCL device
    commandQueue.enqueueReadBuffer(buffOut, false, 0, buffSize, result, []);

    commandQueue.finish();

    deepEqual(expectedResult, result, "Processing buffer data with a kernel (kernel: clThresholdImage1");

    commandQueue.release();
    buffIn.release();
    buffOut.release();

    this.webcl.kernels.unRegister("clThresholdImage1");
    this.webcl.kernels.unRegister("clThresholdImage2");

});
