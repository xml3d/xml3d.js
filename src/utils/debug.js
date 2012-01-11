org.xml3d.debug = {
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
        if (org.xml3d.debug.isSetup) {
            return;
        }
        try {
            if (window.console) {
                org.xml3d.debug.isConsoleAvailable = true;
            }
        } catch (err) {
            org.xml3d.debug.isConsoleAvailable = false;
        }
        org.xml3d.debug.isSetup = true;
    },
    activate : function() {
        org.xml3d.debug.isActive = true;
    },
    doLog : function(msg, logType) {
        if (!org.xml3d.debug.isActive) {
            return;
        }
        if (org.xml3d.debug.numLinesLogged === org.xml3d.debug.maxLinesToLog) {
            msg = "Maximum number of log lines (="
                    + org.xml3d.debug.maxLinesToLog
                    + ") reached. Deactivating logging...";
        }
        if (org.xml3d.debug.numLinesLogged > org.xml3d.debug.maxLinesToLog) {
            return;
        }
        
        if (org.xml3d.debug.isConsoleAvailable) {
            switch (logType) {
            case org.xml3d.debug.INFO:
                window.console.info(msg);
                break;
            case org.xml3d.debug.WARNING:
                window.console.warn(msg);
                break;
            case org.xml3d.debug.ERROR:
                window.console.error(msg);
                break;
            case org.xml3d.debug.EXCEPTION:
                window.console.debug(msg);
                break;
            default:
                break;
            }
        }
        org.xml3d.debug.numLinesLogged++;
    },
    logInfo : function(msg) {
        org.xml3d.debug.doLog(msg, org.xml3d.debug.INFO);
    },
    logWarning : function(msg) {
        org.xml3d.debug.doLog(msg, org.xml3d.debug.WARNING);
    },
    logError : function(msg) {
        org.xml3d.debug.doLog(msg, org.xml3d.debug.ERROR);
    },
    logException : function(msg) {
        org.xml3d.debug.doLog(msg, org.xml3d.debug.EXCEPTION);
    },
    assert : function(c, msg) {
        if (!c) {
            org.xml3d.debug.doLog("Assertion failed in "
                    + org.xml3d.debug.assert.caller.name + ': ' + msg,
                    org.xml3d.debug.WARNING);
        }
    }
};
org.xml3d.debug.setup();