xml3d.debug = {
    INFO : "INFO",
    WARNING : "WARNING",
    ERROR : "ERROR",
    EXCEPTION : "EXCEPTION",
    isActive : false,
    isConsoleAvailable : false,
    isSetup : false,
    numLinesLogged : 0,
    maxLinesToLog : 400,
    logContainer : null,
    setup : function() {
        if (xml3d.debug.isSetup) {
            return;
        }
        try {
            if (window.console) {
                xml3d.debug.isConsoleAvailable = true;
            }
        } catch (err) {
            xml3d.debug.isConsoleAvailable = false;
        }
        xml3d.debug.isSetup = true;
    },
    activate : function() {
        xml3d.debug.isActive = true;
    },
    doLog : function(msg, logType) {
        if (!xml3d.debug.isActive) {
            return;
        }
        if (xml3d.debug.numLinesLogged === xml3d.debug.maxLinesToLog) {
            msg = "Maximum number of log lines (="
                    + xml3d.debug.maxLinesToLog
                    + ") reached. Deactivating logging...";
        }
        if (xml3d.debug.numLinesLogged > xml3d.debug.maxLinesToLog) {
            return;
        }
        
        if (xml3d.debug.isConsoleAvailable) {
            switch (logType) {
            case xml3d.debug.INFO:
                window.console.info(msg);
                break;
            case xml3d.debug.WARNING:
                window.console.warn(msg);
                break;
            case xml3d.debug.ERROR:
                window.console.error(msg);
                break;
            case xml3d.debug.EXCEPTION:
                window.console.debug(msg);
                break;
            default:
                break;
            }
        }
        xml3d.debug.numLinesLogged++;
    },
    logInfo : function(msg) {
        xml3d.debug.doLog(msg, xml3d.debug.INFO);
    },
    logWarning : function(msg) {
        xml3d.debug.doLog(msg, xml3d.debug.WARNING);
    },
    logError : function(msg) {
        xml3d.debug.doLog(msg, xml3d.debug.ERROR);
    },
    logException : function(msg) {
        xml3d.debug.doLog(msg, xml3d.debug.EXCEPTION);
    },
    assert : function(c, msg) {
        if (!c) {
            xml3d.debug.doLog("Assertion failed in "
                    + xml3d.debug.assert.caller.name + ': ' + msg,
                    xml3d.debug.WARNING);
        }
    }
};
xml3d.debug.setup();