//TODO: Helpful API methods concerning WebCL will be added when needed. Please provide feedback!

/**
 * @file WebCL API. Provides useful methods for initialising and utilising the WebCL platform.
 * @version 0.2
 * @author Toni Dahl
 */

(function (namespace, undefined) {

    "use strict";

    var platforms = [],
        devices = [],
        ctx = null,

        WebCLNamespaceAvailable = false,
        OpenCLDriversAvailable = false;

    /**
     *     @constant {string} DEFAULT_DEVICE
     *     @default "CPU"
     */
    var DEFAULT_DEVICE = "CPU",

        /**
         *     @readonly
         *     @name CL_ERROR_CODES
         *     @enum {number}
         */
            CL_ERROR_CODES = {
            "SUCCESS": 0,
            "DEVICE_NOT_FOUND": -1,
            "DEVICE_NOT_AVAILABLE": -2,
            "COMPILER_NOT_AVAILABLE": -3,
            "MEM_OBJECT_ALLOCATION_FAILURE": -4,
            "OUT_OF_RESOURCES": -5,
            "OUT_OF_HOST_MEMORY": -6,
            "PROFILING_INFO_NOT_AVAILABLE": -7,
            "MEM_COPY_OVERLAP": -8,
            "IMAGE_FORMAT_MISMATCH": -9,
            "IMAGE_FORMAT_NOT_SUPPORTED": -10,
            "BUILD_PROGRAM_FAILURE": -11,
            "MAP_FAILURE": -12,
            "INVALID_VALUE": -30,
            "INVALID_DEVICE_TYPE": -31,
            "INVALID_PLATFORM": -32,
            "INVALID_DEVICE": -33,
            "INVALID_CONTEXT": -34,
            "INVALID_QUEUE_PROPERTIES": -35,
            "INVALID_COMMAND_QUEUE": -36,
            "INVALID_HOST_PTR": -37,
            "INVALID_MEM_OBJECT": -38,
            "INVALID_IMAGE_FORMAT_DESCRIPTOR": -39,
            "INVALID_IMAGE_SIZE": -40,
            "INVALID_SAMPLER": -41,
            "INVALID_BINARY": -42,
            "INVALID_BUILD_OPTIONS": -43,
            "INVALID_PROGRAM": -44,
            "INVALID_PROGRAM_EXECUTABLE": -45,
            "INVALID_KERNEL_NAME": -46,
            "INVALID_KERNEL_DEFINITION": -47,
            "INVALID_KERNEL": -48,
            "INVALID_ARG_INDEX": -49,
            "INVALID_ARG_VALUE": -50,
            "INVALID_ARG_SIZE": -51,
            "INVALID_KERNEL_ARGS": -52,
            "INVALID_WORK_DIMENSION": -53,
            "INVALID_WORK_GROUP_SIZE": -54,
            "INVALID_WORK_ITEM_SIZE": -55,
            "INVALID_GLOBAL_OFFSET": -56,
            "INVALID_EVENT_WAIT_LIST": -57,
            "INVALID_EVENT": -58,
            "INVALID_OPERATION": -59,
            "INVALID_GL_OBJECT": -60,
            "INVALID_BUFFER_SIZE": -61,
            "INVALID_MIP_LEVEL": -62,
            "INVALID_GLOBAL_WORK_SIZE": -63
        };
    Object.freeze(CL_ERROR_CODES);


    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    /**
     * Returns a CL error name corresponding to a CL error code
     *
     * @function XML3D.webcl~getCLErrorName
     * @param {number} errorCode
     * @returns {string}
     */

    function getCLErrorName(errorCode) {
        var prop;

        if (isNumber(errorCode)) {
            for (prop in CL_ERROR_CODES) {
                if (CL_ERROR_CODES[prop] === errorCode) {
                    return prop;
                }
            }
            XML3D.debug.logDebug("Got unknown OpenCL Error Code:", errorCode);
        }

        return "UNKNOWN_ERROR";
    }

    /**
     * Gets an error code from a CL error message (thrown by Nokia WebCL Plugin)
     *
     * @param e
     * @returns {Integer|Boolean}
     */

    function getErrorCodeFromCLError(e) {
        var code = null;

        if (e.name && typeof e.name === "string") {
            if (CL_ERROR_CODES[e.name]) {
                return CL_ERROR_CODES[e.name];
            }
        }
        if (e.message && typeof e.message === "string") {
            code = e.message.match(/-?\d+/g);

            if (code instanceof Array) {
                return parseInt(code[code.length - 1], 10);
            }
        }

        return false;
    }

    /**
     * Creates instance of WebCLError
     *
     * @constructor XML3D.webcl~WebCLError
     * @param {string} [name="WebCLError"] Error name
     * @param {string} [msg="Generic WebCL error."] The desired error message
     */

    function WebCLError(name, msg) {
        if (name && typeof name !== "string") {
            XML3D.debug.logDebug("WebCL API: WebCLError: Error name not type of String");
            name = "";
        }

        if (msg && typeof msg !== "string") {
            XML3D.debug.logDebug("WebCL API: WebCLError: Error message not type of String");
            msg = "";
        }

        this.name = name || "WebCLError";
        this.message = msg || "Generic WebCL error.";
        this.stack = (new Error()).stack;
    }

    WebCLError.prototype = Object.create(Error.prototype);
    WebCLError.prototype.constructor = WebCLError;


    /**
     * Checks if WebCL namespace is available. The namespace can be provided by a WebCL plugin or native implementation.
     *
     * @function XML3D.webcl~hasWebCLNamespace
     * @returns {Boolean}
     */

    function hasWebCLNamespace() {
        WebCLNamespaceAvailable = window.WebCL && WebCL.getPlatforms;

        return WebCLNamespaceAvailable;

    }

    /**
     * Tests a basic WebCL method to see if the OpenCL drivers are working on users device.
     *
     * @function XML3D.webcl~hasOpenCLDrivers
     * @returns {Boolean}
     */

    function hasOpenCLDrivers() {
        var platArr;
        OpenCLDriversAvailable = true;

        try {
            platArr = WebCL.getPlatforms();
        } catch (e) {
            OpenCLDriversAvailable = false;
        }

        if (!platArr || platArr.length === 0) {
            OpenCLDriversAvailable = false;
        }

        return OpenCLDriversAvailable;

    }

    /**
     * Combines WebCL namespace and driver test.
     *
     * @function XML3D.webcl~isAvailable
     * @returns {Boolean}
     */

    function isAvailable() {
        return hasWebCLNamespace() && hasOpenCLDrivers();
    }


    /**
     * Initialises the WebCL API with default values using a predefined device type or a default device type.
     *
     * @function XML3D.webcl~init
     * @param {string} [type="CPU"] Device type
     * @return {Boolean}
     */

    function init(type) {
        // Checking if WebCL is available in the users system
        if (!hasWebCLNamespace()) {
            XML3D.debug.logWarning("WebCL API: Unfortunately your system does not support WebCL. " +
                "WebCL namespace is not available.");
            return false;
        }

        if (!hasOpenCLDrivers()) {
            XML3D.debug.logWarning("WebCL API: Unfortunately your system does not support WebCL. " +
                "OpenCL drivers are not working properly.");
            return false;
        }

        getPlatforms();

        devices = getDevicesByType(type || DEFAULT_DEVICE);

        // Creating default context
        ctx = createContext({devices: devices});

        return true;
    }

    /**
     * Returns all available WebCL device platforms.
     *
     * @function XML3D.webcl~getPlatforms
     * @returns {Array}
     */

    function getPlatforms() {
        if(platforms.length === 0) {
            platforms = WebCL.getPlatforms();
        }

        return platforms;
    }

    /**
     * Returns all devices of a chosen type from a selected platform.
     *
     * @param {string} [type="CPU"] Device type
     * @param {IWebCLPlatform} platform
     * @returns {Array|Boolean}
     */

    function getPlatformDevicesByType(type, platform) {
        var deviceArr = [], errCode;

        if (!platform) {
            XML3D.debug.logError("WebCL API: getPlatformDevicesByType(): platform was not defined.");
            return false;
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
            errCode = getErrorCodeFromCLError(e);

            if (!errCode) {
                throw e;
            } else if (errCode !== CL_ERROR_CODES.DEVICE_NOT_FOUND) {
                throw new WebCLError(getCLErrorName(errCode), "Could not get devices.");
            }

            return false;
        }

        return deviceArr;
    }

    /**
     * Gets all devices of a selected type from all available platforms.
     *
     * @function XML3D.webcl~getDevicesByType
     * @param {string} type Device type
     * @returns {Array|Boolean}
     */

    function getDevicesByType(type) {
        var resultArr = [], deviceArr, platArr, i;

        getPlatforms();

        for (i = platforms.length; i--;) {
            deviceArr = getPlatformDevicesByType(type, platforms[i]);

            if (deviceArr) {
                deviceArr.forEach(function (v) {
                    resultArr.push(v);
                });
            }
        }
        return resultArr.length === 0 ? false : resultArr;
    }


    /**
     * Gets the platform on where the device is.
     *
     * @function XML3D.webcl~getDevicePlatform
     * @param {IWebCLDevice} device
     * @returns {IWebCLPlatform | Boolean}
     */

    function getDevicePlatform(device) {
        var platform;

        if (!device) {
            XML3D.debug.logError("WebCL API: getDevicePlatform(): device was not defined.");
            return false;
        }

        try {
            platform = device.getInfo(WebCL.DEVICE_PLATFORM);
        } catch (e) {
            var errCode = getErrorCodeFromCLError(e);

            if (!errCode) {
                throw e;
            }

            throw new WebCLError(getCLErrorName(errCode), "Could not get the platform of the device.");
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
        var props = {
            devices: getDevicesByType(DEFAULT_DEVICE)
            }, context;

        XML3D.extend(props, properties);

        try {
            context = WebCL.createContext(props);
        } catch (e) {
            var errCode = getErrorCodeFromCLError(e);

            if (!errCode) {
                throw e;
            }
            throw new WebCLError(getCLErrorName(errCode), "Failed to create a WebCL context.");
        }

        return context;
    }

    /**
     * Gets the default WebCL context.
     *
     * @function XML3D.webcl~getDefaultContext
     * @returns {IWebCLContext}
     */

    function getDefaultContext() {
        return ctx;
    }


    /**
     * Creates a WebCL program from a string of WebCL code.
     *
     * @function XML3D.webcl~createProgram
     * @param {string} codeStr
     * @param {IWebCLContext} clCtx
     * @returns {IWebCLProgram | Boolean}
     */

    function createProgram(codeStr, clCtx) {
        var program;

        clCtx = clCtx || ctx;

        if (!codeStr) {
            XML3D.debug.logError("WebCL API: createProgram(): codeStr was not defined.");
            return false;
        }

        if (!clCtx) {
            XML3D.debug.logError("WebCL API: createProgram(): clCtx was not defined.");
        }

        try {
            program = clCtx.createProgram(codeStr);
        } catch (e) {
            var errCode = getErrorCodeFromCLError(e);

            if (!errCode) {
                throw e;
            }

            throw new WebCLError(getCLErrorName(errCode), "Failed to create a WebCL program.");
        }

        return program;
    }

    /**
     * Builds a WebCL program.
     *
     * @function XML3D.webcl~buildProgram
     * @param {IWebCLProgram} program
     * @param {Array} deviceArr
     * @returns {IWebCLProgram|Boolean}
     */

    function buildProgram(program, deviceArr) {
        deviceArr = deviceArr || devices;

        if (!program) {
            XML3D.debug.logError("WebCL API: buildProgram(): program was not defined.");
            return false;
        }

        try {
            program.build(deviceArr, "");
        } catch (e) {
            var errCode = getErrorCodeFromCLError(e);

            if (!errCode) {
                throw e;
            }
            throw new WebCLError(getCLErrorName(errCode),
                program.getBuildInfo(deviceArr[0], WebCL.CL_PROGRAM_BUILD_LOG));
        }

        return program;
    }

    /**
     * Creates a WebCL Kernel using a defined program.
     *
     * @function XML3D.webcl~createKernel
     * @param {IWebCLProgram} program
     * @param {string} name
     * @returns {IWebCLKernel|Boolean}
     */

    function createKernel(program, name) {
        var kernel;

        if (!program) {
            XML3D.debug.logError("WebCL API: createKernel(): program was not defined.");
            return false;
        }

        if (!name) {
            XML3D.debug.logError("WebCL API: createKernel(): name was not defined.");
            return false;
        }

        try {
            kernel = program.createKernel(name);
        } catch (e) {
            var errCode = getErrorCodeFromCLError(e);

            if (!errCode) {
                throw e;
            }
            throw new WebCLError(getCLErrorName(errCode), "Failed to create a WebCL kernel.");
        }

        return kernel;
    }

    /**
     * Creates a WebCL Command Queue for queueing kernels for execution.
     *
     * @function XML3D.webcl~createCommandQueue
     * @param {IWebCLDevice} device
     * @param {IWebCLContext} clCtx
     * @returns {IWebCLCommandQueue|Boolean}
     */

    function createCommandQueue(device, clCtx) {
        var cmdQueue;

        clCtx = clCtx || ctx;

        if(!clCtx) {
            XML3D.debug.logError("WebCL API: createCommandQueue: clCtx was not defined");
            return false;
        }

        try {
            cmdQueue = clCtx.createCommandQueue(device || devices[0]);
        } catch (e) {
            var errCode = getErrorCodeFromCLError(e);

            if (!errCode) {
                throw e;
            }
            throw new WebCLError(getCLErrorName(getErrorCodeFromCLError(e)), "Could not create CommandQueue.");
        }

        return cmdQueue;
    }

    /**
     * Creates an input/output buffer to be used with a WebCL kernel
     *
     * @function XML3D.webcl~createBuffer
     * @param {int} size
     * @param {string} type
     * @param {IWebCLContext} clCtx
     * @returns {IWebCLMemoryObject|Boolean}
     */

    function createBuffer(size, type, clCtx) {
        clCtx = clCtx || ctx;

        if (!size) {
            XML3D.debug.logError("WebCL API: createBuffer(): Buffer size was not defined.");
            return false;
        }else if (!isNumber(size) || size < 0) {
            XML3D.debug.logError("WebCL API: createBuffer(): Buffer size must be a positive number.");
            return false;
        }

        if (!type) {
            XML3D.debug.logError("WebCL API: createBuffer(): Buffer type was not defined.");
            return false;
        }

        if(!clCtx) {
            XML3D.debug.logError("WebCL API: createBuffer(): clCtx was not defined.");
            return false;
        }

        try {
            if (type === "r") {
                return clCtx.createBuffer(WebCL.CL_MEM_READ_ONLY, size);
            } else if (type === "w") {
                return clCtx.createBuffer(WebCL.CL_MEM_WRITE_ONLY, size);
            } else if (type === "rw") {
                return clCtx.createBuffer(WebCL.CL_MEM_READ_WRITE, size);
            } else {
                XML3D.debug.logError("WebCL API: createBuffer(): Unknown buffer type:", type);
                return false;
            }
        } catch (e) {
            var errCode = getErrorCodeFromCLError(e);

            if (!errCode) {
                throw e;
            }
            throw new WebCLError(getCLErrorName(errCode), "Could not create a WebCL buffer.");
        }
    }

    /**
     * Creates an instance of KernelManager.
     *
     * @name KernelManager
     * @constructor
     */

    var KernelManager = function (clCtx) {
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
                    XML3D.debug.logWarning("WebCL API: kernels.register(): Kernel with a same name is already defined.");
                    return false;
                }

                if (typeof name !== "string") {
                    XML3D.debug.logError("WebCL API: kernels.register(): Kernel name was not defined or was not type of String.");
                    return false;
                }

                if (typeof codeStr !== "string") {
                    XML3D.debug.logError("WebCL API: kernels.register(): Kernel code was not defined or was not type of String.");
                    return false;
                }

                var program, kernel;

                program = createProgram(codeStr, clCtx);

                buildProgram(program);

                if (program) {
                    kernel = createKernel(program, name);
                }

                if (kernel) {
                    kernels[name] = kernel;

                    return true;
                }

                return false;

            },

            /**
             * Deallocates and unregisters a kernel.
             *
             * @function KernelManager~unRegister
             * @param {string} name
             */

            unRegister: function (name) {
                if (kernels.hasOwnProperty(name)) {
                    try {
                        kernels[name].release();
                    } catch (e) {
                        var errCode = getErrorCodeFromCLError(e);

                        if (!errCode) {
                            throw e;
                        }

                        throw new WebCLError(getCLErrorName(errCode), "Could not release kernel resources.");
                    }
                    delete kernels[name];

                    return true;
                }

                return false;
            },

            /**
             * Gets a kernel of a specified name.
             *
             * @function KernelManager~getKernel
             * @param {string} name
             * @returns {IWebCLKernel | Boolean}
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
                    kernel, inputArgs, nKernelArgs, i;

                if (args.length < 2) {
                    XML3D.debug.logWarning("WebCL API: setArgs(): No kernel arguments were defined.");
                    return false;
                }

                kernel = args[0];
                inputArgs = args.slice(1);

                if (!kernel) {
                    XML3D.debug.logWarning("WebCL API: setArgs(): WebCL kernel was not defined.");
                    return false;
                }

                nKernelArgs = kernel.getInfo(WebCL.CL_KERNEL_NUM_ARGS);

                if (inputArgs.length > nKernelArgs) {
                    XML3D.debug.logWarning("WebCL: setArgs: Input args amount > kernel program args amount! Ignoring extra arguments.");
                } else if (inputArgs.length < nKernelArgs) {
                    XML3D.debug.logError("WebCL: setArgs: Not enough arguments were given to WebCL kernel.");
                    return false;
                }

                XML3D.debug.logDebug("Args for kernel:", kernel.getInfo(WebCL.KERNEL_FUNCTION_NAME));

                i = nKernelArgs;

                try {
                    while (i--) {
                        XML3D.debug.logDebug("Arg:", i, inputArgs[i]);
                        kernel.setArg(i, inputArgs[i]);
                    }
                } catch (e) {
                    var errCode = getErrorCodeFromCLError(e);

                    if (!errCode) {
                        throw e;
                    }
                    throw new WebCLError(getCLErrorName(errCode), "Could not set kernel arguments.");
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
        "init": init,
        "createContext": createContext,
        "createProgram": createProgram,
        "buildProgram": buildProgram,
        "createKernel": createKernel,
        "createCommandQueue": createCommandQueue,
        "createBuffer": createBuffer,
        "getDefaultContext": getDefaultContext,
        "getPlatforms": getPlatforms,
        "getDevicesByType": getDevicesByType,
        "getDevicePlatform": getDevicePlatform,

        /** @name XML3D.webcl~kernels */
        "kernels": new KernelManager(),

        "hasWebCLNamespace": hasWebCLNamespace,
        "hasOpenCLDrivers": hasOpenCLDrivers,
        "isAvailable": isAvailable,
        "WebCLError": WebCLError,
        "getCLErrorName": getCLErrorName
    };


}(XML3D = XML3D || {}));
