//TODO: This file is work in progress! Helpful API methods concerning WebCL will be added when needed. Please provide feedback!

/**
 * @file WebCL API. Provides useful methods for initialising and utilising the WebCL platform.
 * @version 0.2
 * @author Toni Dahl
 */

(function (namespace, undefined) {

    "use strict";

    var platforms,
        devices = [],
        ctx = null,

        WebCLNamespaceAvailable = false,
        OpenCLDriversAvailable = false;

    /**
     *     @constant {string} DEFAULT_DEVICE
     *     @default "CPU"
     */
    var DEFAULT_DEVICE = "CPU";


    /**
     * Creates instance of WebCLError
     *
     * @name WebCLError
     * @param {string} [msg="WebCL error."] The desired error message
     * @constructor
     */

    function WebCLError(msg) {
        if (msg && typeof msg !== "string") {
            throw new TypeError();
        }

        this.name = "WebCLError";
        this.message = msg || "WebCL error.";
        this.stack = (new Error()).stack;
    }

    WebCLError.prototype = Object.create(Error.prototype);
    WebCLError.prototype.constructor = WebCLError;


    /**
     * Checks if WebCL namespace is available. The namespace can be provided by a WebCL plugin or native implementation.
     *
     * @returns {boolean}
     */

    function hasWebCLNamespace() {
        WebCLNamespaceAvailable = window.WebCL && WebCL.getPlatforms;

        return WebCLNamespaceAvailable;

    }

    /**
     * Tests a basic WebCL method to see if the OpenCL drivers are working on users device.
     *
     * @returns {boolean}
     */

    function hasOpenCLDrivers() {
        OpenCLDriversAvailable = true;

        try {
            WebCL.getPlatforms();
        } catch (e) {
            OpenCLDriversAvailable = false;
        }

        return OpenCLDriversAvailable;

    }

    /**
     * Combines WebCL namespace and driver test.
     *
     * @function XML3D.webcl~isAvailable
     * @returns {boolean}
     */

    function isAvailable() {
        return hasWebCLNamespace() && hasOpenCLDrivers();
    }


    /**
     * Initialises the WebCL API using a predefined device type or a default device type.
     *
     * @function XML3D.webcl~init
     * @param {string} [type="CPU"] Device type
     */

    function init(type) {
        // Checking if WebCL is available in the users system
        if (!hasWebCLNamespace()) {
            XML3D.debug.logWarning("WebCL: Unfortunately your system does not support WebCL. " +
                "WebCL namespace is not available.");
            return;
        }

        if (!hasOpenCLDrivers()) {
            XML3D.debug.logWarning("WebCL: Unfortunately your system does not support WebCL. " +
                "OpenCL drivers are not working properly.");
            return;
        }

        platforms = WebCL.getPlatforms();
        devices = getDevicesByType(type || DEFAULT_DEVICE);

        // Creating default context
        createContext({devices: devices});

    }

    /**
     * Returns all available WebCL device platforms.
     *
     * @function XML3D.webcl~getPlatforms
     * @returns {Array}
     */

    function getPlatforms() {
        return platforms;
    }

    /**
     * Returns all devices of a chosen type from a selected platform.
     *
     * @param {string} [type="CPU"] Device type
     * @param {IWebCLPlatform} platform
     * @returns {Array}
     */

    function getPlatformDevicesByType(type, platform) {
        var deviceArr = [];

        if(!platform){
            throw new WebCLError("getPlatformDevicesByType: platform is not defined.");
        }

        type = type || DEFAULT_DEVICE;

        try {
            if (type === "CPU") {
                deviceArr = platform.getDevices(WebCL.DEVICE_TYPE_CPU);
            } else if (type === "GPU") {
                deviceArr = platform.getDevices(WebCL.DEVICE_TYPE_GPU);
            } else if (type === "ALL") {
                deviceArr = platform.getDevices(WebCL.DEVICE_TYPE_ALL);
            }

        } catch (e) {
            return deviceArr;
        }

        return deviceArr;
    }

    /**
     * Gets all devices of a selected type from all available platforms.
     *
     * @function XML3D.webcl~getDevicesByType
     * @param {string} type Device type
     * @returns {Array}
     */

    function getDevicesByType(type) {
        var deviceArr = [], i;

        for (i = platforms.length; i--;) {
            getPlatformDevicesByType(type, platforms[i]).forEach(function (v) {
                deviceArr.push(v);
            });
        }

        return deviceArr;
    }

    /**
     * Gets the platform on where the device is.
     *
     * @function XML3D.webcl~getDevicePlatform
     * @param {IWebCLDevice} device
     * @returns {IWebCLPlatform}
     */

    function getDevicePlatform(device) {
        var platform;

        if(!device){
            throw new WebCLError("Device is not defined");
        }

        try {
            platform = device.getInfo(WebCL.DEVICE_PLATFORM);
        } catch (e) {
            XML3D.debug.logError("WebCL: Could not get platform of the device.", e.message);
            throw new WebCLError("Could not get the platform of the device.");
        }

        return platform;
    }

    /**
     * Creates a WebCL context
     *
     * @function XML3D.webcl~createContext
     * @param {object} [properties]
     * @returns {IWebCLContext}
     */

    function createContext(properties) {
        var defaultProps = {
            devices: getDevicesByType(DEFAULT_DEVICE)
        };

        properties = properties || defaultProps;

        try {
            ctx = WebCL.createContext(properties);
        } catch (e) {
            XML3D.debug.logError("WebCL: Failed to create a WebCL context.", e.message);
            throw new WebCLError("Failed to create a WebCL context.");
        }

        return ctx;
    }

    /**
     * Gets the WebCL context.
     *
     * @function XML3D.webcl~getContext
     * @returns {IWebCLContext}
     */

    function getContext() {
        return ctx;
    }


    /**
     * Creates a WebCL program from a string of WebCL code.
     *
     * @function XML3D.webcl~createProgram
     * @param {string} codeStr
     * @returns {IWebCLProgram}
     */

    function createProgram(codeStr) {
        var program;

        if(!codeStr){
            throw new WebCLError("createProgram: codeStr was not defined.");
        }

        try {
            program = ctx.createProgram(codeStr);
        } catch (e) {
            XML3D.debug.logError("WebCL: Failed to create WebCL program: ", e.message);
            throw new WebCLError("Failed to create WebCL program.");
        }

        return program;
    }

    /**
     * Builds a WebCL program.
     *
     * @function XML3D.webcl~buildProgram
     * @param {IWebCLProgram} program
     * @param {Array} deviceArr
     * @returns {IWebCLProgram}
     */

    function buildProgram(program, deviceArr) {
        deviceArr = deviceArr || devices;

        if(!program){
            throw new WebCLError("buildProgram: program was not defined.");
        }

        try {
            program.build(deviceArr, "");
        } catch (e) {
            XML3D.debug.logError("WebCL: Failed to build a WebCL program: " +
                program.getBuildInfo(deviceArr[0], WebCL.CL_PROGRAM_BUILD_STATUS) +
                ":  " + program.getBuildInfo(deviceArr[0], WebCL.CL_PROGRAM_BUILD_LOG));
            throw new WebCLError("Failed to build WebCL program.");
        }

        return program;
    }

    /**
     * Creates a WebCL Kernel using a defined program.
     *
     * @function XML3D.webcl~createKernel
     * @param {IWebCLProgram} program
     * @param {string} name
     * @returns {IWebCLKernel}
     */

    function createKernel(program, name) {
        var kernel;

        if(!program){
            throw new WebCLError("createKernel: program was not defined.");
        }

        if(!name){
            throw new WebCLError("createKernel: name was not defined.");
        }

        try {
            kernel = program.createKernel(name);
        } catch (e) {
            XML3D.debug.logError("WebCL: Failed to create a WebCL kernel:", e.message);
            throw new WebCLError("Failed to create a WebCL kernel.");
        }

        return kernel;
    }

    /**
     * Creates a WebCL Command Queue for queueing kernels for execution.
     *
     * @function XML3D.webcl~createCommandQueue
     * @param {IWebCLDevice} device
     * @returns {IWebCLCommandQueue}
     */

    function createCommandQueue(device) {
        var cmdQueue;

        try {
            cmdQueue = ctx.createCommandQueue(device || devices[0]);
        } catch (e) {
            throw new WebCLError("Could not create CommandQueue.");
        }

        return cmdQueue;
    }

    /**
     * Creates an input/output buffer to be used with a WebCL kernel
     *
     * @function XML3D.webcl~createBuffer
     * @param {int} size
     * @param {string} type
     * @returns {IWebCLMemoryObject}
     */

    function createBuffer(size, type) {
        if(!size){
            throw new WebCLError("createBuffer: Size was not defined.");
        }

        if(!type){
            throw new WebCLError("createBuffer: Type was not defined.");
        }

        if (type === "r") {
            return ctx.createBuffer(WebCL.CL_MEM_READ_ONLY, size);
        } else if (type === "w") {
            return ctx.createBuffer(WebCL.CL_MEM_WRITE_ONLY, size);
        } else if (type === "rw") {
            return ctx.createBuffer(WebCL.CL_MEM_READ_WRITE, size);
        } else {
            throw new WebCLError("createBuffer: Unknown buffer type.");
        }

    }

    /**
     * Creates an instance of KernelManager.
     *
     * @name KernelManager
     * @constructor
     */

    var KernelManager = function () {
        var kernels = {};

        return {

            /**
             * Creates and builds a WebCL program from a code string and creates a WebCL kernel from the program.
             *
             * @function KernelManager~register
             * @param {string} name
             * @param {string} codeStr
             */

            register: function (name, codeStr) {
                if (kernels.hasOwnProperty(name)) {
                    XML3D.debug.logWarning("WebCL: Kernel with a same name is already defined.");
                    return;
                }

                if (typeof name !== "string" || typeof codeStr !== "string") {
                    XML3D.debug.logError("WebCL: Kernel name and code must be a string!");
                    throw new WebCLError("Kernel name and code must be a string.");
                }

                var program, kernel;

                program = createProgram(codeStr);
                buildProgram(program);

                if (program) {
                    kernel = createKernel(program, name);
                }

                if (kernel && !kernels.hasOwnProperty(name)) {
                    kernels[name] = kernel;
                }

            },

            /**
             * Deallocates and unregisters a kernel.
             *
             * @function KernelManager~unRegister
             * @param {string} name
             */

            unRegister: function (name) {
                if (kernels.hasOwnProperty(name)) {
                    kernels[name].releaseCLResources();
                    delete kernels[name];
                }
            },

            /**
             * Gets a kernel of a specified name.
             *
             * @function KernelManager~getKernel
             * @param {string} name
             * @returns {IWebCLKernel | boolean}
             */

            getKernel: function (name) {
                if (typeof name !== "string") {
                    return false;
                }

                if (kernels.hasOwnProperty(name)) {
                    return kernels[name];
                }

                return false;
            },

            /**
             * Sets arguments of a specified kernel.
             * The first argument of this function is a registered kernel name, other arguments are the kernel arguments respectively.
             *
             * @function KernelManager~setArgs
             * @param {IWebCLKernel} kernel WebCL kernel
             * @param {...*} args Kernel arguments in the same order as defined in the kernel code
             * @returns {boolean}
             */

            setArgs: function () {
                var args = Array.prototype.slice.call(arguments),
                    kernel, kernelArgs, i;

                if (args.length < 2) {
                    throw new WebCLError("setArgs: No kernel arguments were defined.");
                }

                kernel = args[0];
                kernelArgs = args.slice(1);
                i = kernelArgs.length;

                if (!kernel) {
                    throw new WebCLError("setArgs: WebCL kernel was not defined.");
                }

                XML3D.debug.logDebug("Args for kernel:", kernel.getInfo(WebCL.KERNEL_FUNCTION_NAME));

                while (i--) {
                    XML3D.debug.logDebug("Arg:", i, kernelArgs[i]);
                    kernel.setArg(i, kernelArgs[i]);
                }

                return true;

            }
        };
    };


    /**
     * API
     *
     * @namespace webcl
     * @memberOf XML3D
     */

    namespace['webcl'] = {
        init: init,
        createContext: createContext,
        createProgram: createProgram,
        buildProgram: buildProgram,
        createKernel: createKernel,
        createCommandQueue: createCommandQueue,
        createBuffer: createBuffer,

        getContext: getContext,
        getPlatforms: getPlatforms,
        getDevicesByType: getDevicesByType,
        getDevicePlatform: getDevicePlatform,

        /** @name XML3D.webcl~kernels */
        kernels: new KernelManager(),

        isAvailable: isAvailable
    };


}(XML3D = XML3D || {}));