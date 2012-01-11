//-------------------------------------------------------------------
// Displays XML3D Physics Plugin Statistics:
//    - Simulation Thread Usage
//    - Number of Updates Per (Physics) Frame
//-------------------------------------------------------------------

var org;
if (!org || !org.xml3d)
    throw new Error("xml3d.js has to be included first");

var xml3dPhysics;
if(!xml3dPhysics)
    throw new Error("xml3d_physics.js has to be included first");

var __xml3dPhysicsUsageText = document.createElement("div");
var __xml3dPhysicsNumUpdatesText = document.createElement("div");
document.body.appendChild(__xml3dPhysicsUsageText);
document.body.appendChild(__xml3dPhysicsNumUpdatesText);

function  __xml3dPhysicsUsageUpdateTimer(){

    function truncate(inValue, precision){
        if(precision == 0)
            return "" + Math.round(inValue);

        var precisionShift = Math.pow(10.0, precision);
        var outValue = Math.round(inValue*precisionShift) /
            precisionShift;
        var result = "" + outValue;

        // append zeros
        if(Math.floor(outValue) - outValue == 0.0){

            result += ".0"
            for(var i = 1; precision > i; ++i)
                result += '0';

        } else {

            for(var i = 2; precision >= i; ++i){

                if(result.charAt(result.length - i) == '.'){

                    for(var j = 0; precision - i + 1 > j; ++j)
                        result += '0';
                    break;
                }
            }
        }

        return result;
    }

    if(!xml3dPhysics.getSimulationIdleTime || !xml3dPhysics.getAvgNumberOfUpdates)
        return;

    var usage = xml3dPhysics.getSimulationIdleTime();
    __xml3dPhysicsUsageText.innerHTML = "Simulation idle time ratio: " +
        truncate(usage*100.0, 2) + "%";
    var avgNumUpdates = xml3dPhysics.getAvgNumberOfUpdates();
    __xml3dPhysicsNumUpdatesText.innerHTML = "#Avg transformation updates: " +
        truncate(avgNumUpdates, 2);

    window.setTimeout(__xml3dPhysicsUsageUpdateTimer, 150);
}
__xml3dPhysicsUsageUpdateTimer();

//-------------------------------------------------------------------
