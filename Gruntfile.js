"use strict";

exports = module.exports = function (grunt) {

    var path = require("path");
    var devVersionString = 'DEVELOPMENT SNAPSHOT (<%= grunt.template.today("dd.mm.yyyy HH:MM:ss Z") %>)';

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        version: {
            number: "", // not defined for development snapshots
            dev: devVersionString
        },
         dirs: {
                modules: "build/output/modules"
         },

        // Path configurations
        libDir: "src/",
        testDir: "tests/",
        docDir: "doc/",
        buildDir: "build/output",

        moduleFiles: [
                    "LICENSE",
                    "<%= buildDir %>/xml3d.js"
                ],

        releaseName: "<%= buildDir %>/xml3d<%= version.number %>.js",

        clean: {
            output: ["<%= buildDir %>"],
            debug: ["<%= pkg.name %>"],
            doc: ["<%= docDir %>"]
        },

        concat: {
            options: {
                process: function(src, filepath) {
                    switch (filepath) {
                        case "build/output/xml3d.js": return src.replace('%VERSION%', grunt.config.get("version.dev") );
                        case "LICENSE": return "/**\n" + src + "\n@version: " + grunt.config.get("version.dev") +"\n**/";
                        default: return src;
                    }
                }
            },
            dist: {
                src: '<%= moduleFiles %>',
                dest: '<%= releaseName %>',
                nonull: true
            }

        },

        "copy": {
            "spec": {
                src: "spec/index.html",
                dest: "build/output/index.html",
                nonull: true,
                options: {
                    process: function (content, srcpath) {
                        return content.replace('publishDate:  ""', 'publishDate:  "' +  grunt.template.today("yyyy-mm-dd")  + '"');
                    }
                }
            }
        },

        "browserify": {
            "testlib": {
                src: "./tests/build/index.js",
                dest: "./tests/xml3d-testlib.js",
                options: {
                    browserifyOptions: {
                        debug: true,
                        standalone: "XML3DTestLib"
                    }
                }
            },
            "dev": {
                src: "./src/xml3d.js",
                dest: "./build/output/xml3d.js",
                options: {
                    browserifyOptions: {
                        debug: true,
                        transform: [
                            [   "browserify-replace", {
                                replace: [
                                    { from: "%VERSION%", to: devVersionString }
                                ]
                                }
                            ]
                        ]
                    }
                }
            },
            release: {
                src: "./src/xml3d.js",
                dest: "./build/output/xml3d.js",
                options: {
                    browserifyOptions: {
                        debug: false
                    }
                }
            }
    }   ,
        "closure-compiler": {
            frontend: {
                closurePath: './build/closure',
                js: '<%= releaseName %>',
                jsOutputFile: "<%= buildDir %>/xml3d<%= version.number %>-min.js",
                maxBuffer: 500,
                options: {
                    //compilation_level: 'ADVANCED_OPTIMIZATIONS', language_in: 'ECMASCRIPT5_STRICT'
                }
            }
        }, connect: {
            server: {
                options: {
                    port: 9001,
                    open: "http://localhost:9001/tests/all.html"
                }
            }
        },
        uglify: {
            "<%= releaseName %>": "<%= releaseName %>"
        },

        watch: {
            files: ['src/**'], tasks: ['default']
        }


    });

    var moduleBuilds = [];

    grunt.file.expand({filter: "isFile"}, "./src/**/build.json").forEach(function (configFile) {
        grunt.log.writeln("Reading file: " + configFile);
        var modulePath = path.dirname(configFile);
        var moduleConfig = grunt.file.readJSON(configFile);
        var destFile = grunt.config.get("dirs.modules") + "/xml3d-" + moduleConfig.module + "-module.js";
        var taskName = moduleConfig.task || "concat";

        var srcFiles = taskName == "concat" ? moduleConfig.files.map(function(name) { return modulePath + "/" + name; }) : modulePath + "/index.js";


        var config = {}, options = {}, task = config[taskName] = {};

        if (taskName == "browserify") {
            options["browserifyOptions"] = {
                debug: true, standalone: "XML3D"
            }
        }

        task[moduleConfig.module] = {
            src: srcFiles,
            dest: destFile,
            nonull: true
        };

        grunt.config.merge(config);
        moduleBuilds.push({
            task: taskName + ":" + moduleConfig.module,
            dest: destFile
        });
    });

    var shouldPublish = grunt.option('publish');
    if (shouldPublish) {
        grunt.config.merge({
            version: {
                number: "-<%= pkg.version %>",
                dev: "<%= pkg.version %>"
            }
        })
    }

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks('grunt-closure-compiler');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');

    var builds = moduleBuilds.map(function(f) { return f.task });
    builds.push("concat:dist");

    grunt.registerTask("testlib", "browserify:testlib");
    grunt.registerTask("xml3ddev", "browserify:dev");
    grunt.registerTask("xml3drelease", "browserify:release");
    grunt.registerTask("merge", builds);
    grunt.registerTask("dev", "xml3ddev");
    grunt.registerTask("release", ["xml3drelease", "merge"]);
    grunt.registerTask("min", ["release", "closure-compiler"]);
    grunt.registerTask("default", ["dev", "testlib"]);
    grunt.registerTask("continuous", ["min", "dev", "testlib"]);
    grunt.registerTask("testserver", ["connect:server:keepalive"]);

    grunt.registerTask("spec", "copy:spec");

    grunt.registerTask('prepublish', 'Run all my build tasks.', function(n) {
        if (!grunt.option('publish')) { // Be sure to specify the target
            grunt.warn('Set publish flag to continue.');
        }
        grunt.task.run("clean:output", "release", "closure-compiler");
    });
};
