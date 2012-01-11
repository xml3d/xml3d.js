
org.xml3d.tests.existance = function(table) {
    if (!table)
        return;
    var types = org.xml3d.tests.datatypes;
    for (i in types) {
        var row = table.insertRow(table.rows.length);
        var nameCell = row.insertCell(0);
        var availableCell = row.insertCell(1);
        var nativeCell = row.insertCell(2);

        var textNode = document.createTextNode(types[i]);
        nameCell.appendChild(textNode);

        var t = null;
        var available = true;
        try {
            var t = eval("new " + types[i] + "()");
            available = typeof t == "object";
        } catch (e) {
            available = false;
        }
        textNode = document.createTextNode(available ? "yes" : "no");
        availableCell.style.backgroundColor = available ? "green" : "red";
        availableCell.appendChild(textNode);

        if (available) {
            textNode = document.createTextNode(t._js === undefined ? "native"
                    : "JS");
            nativeCell.style.backgroundColor = t._js === undefined ? "green"
                    : "red";

        } else
            textNode = document.createTextNode("-");
        nativeCell.appendChild(textNode);
    }
};

org.xml3d.tests.isDatatypeAvailable = function(dt) {
    var t = null;
    var available = true;
    try {
        var t = eval("new " + dt + "()");
        available = typeof t == "object";
    } catch (e) {
        available = false;
    }
    return available;
};

org.xml3d.tests.createTestTable = function(div, header) {
    var table = document.createElement('table');
    table.className = "testtable";
    div.appendChild(table);

    var firstRow = table.insertRow(0);
    for(var i=0; i<3;i++)
    {
        var th = document.createElement('th');
        th.appendChild(document.createTextNode(header[i]));
        firstRow.appendChild(th);
    }
    return table;
};

org.xml3d.tests.testDatatype = function (dt, div) {
    if (!org.xml3d.tests.isDatatypeAvailable(dt))
    {
        div.appendChild(document.createTextNode("Not available"));
        return;
    }
    var t = eval("new " + dt + "()");
    var ts = org.xml3d.tests[dt];
    if (ts === undefined)
    {
        div.appendChild(document.createTextNode("No tests defined"));
        return;
    }

    var header = ["Name", "Status", "JS / native"];
    var table = org.xml3d.tests.createTestTable(div, header);
    for(var i = 0; i < ts.functs.length; i++)
    {
        var row = table.insertRow(table.rows.length);
        var nameCell = row.insertCell(0);
        var availableCell = row.insertCell(1);
        var nativeCell = row.insertCell(2);

        var textNode = document.createTextNode(ts.functs[i]);
        nameCell.appendChild(textNode);

        var status = t[ts.functs[i]] === undefined ? "undefined" :
                     typeof t[ts.functs[i]] != 'function' ? "not a function" :
                         "available";

        textNode = document.createTextNode(status);
        availableCell.style.backgroundColor = status == "available" ? "green" : "red";
        availableCell.appendChild(textNode);

        if (status != "available" )
        {
            nativeCell.appendChild(document.createTextNode('-'));
        }

    }

};


var table = document.getElementById('t1');
org.xml3d.tests.existance(table);
var testDiv = document.getElementById('tests');
for (i in org.xml3d.tests.datatypes) {
    var h2 = document.createElement('h2');
    var div = document.createElement('div');
    var textNode = document.createTextNode(org.xml3d.tests.datatypes[i]);
    h2.appendChild(textNode);
    div.id = "id-" + org.xml3d.tests.datatypes[i];
    testDiv.appendChild(h2);
    testDiv.appendChild(div);
    org.xml3d.tests.testDatatype(org.xml3d.tests.datatypes[i], div);
};

for (i in org.xml3d.tests.datatypes) {
    var pos = document.getElementById('id-' + org.xml3d.tests.datatypes[i]);
    if (org.xml3d.tests[org.xml3d.tests.datatypes[i]] !== undefined)
    {
        var testSuite = org.xml3d.tests[org.xml3d.tests.datatypes[i]];
        for (var i = 0; i < testSuite.length; i++)
        {
            var header = document.createElement('h3');
            var textNode = document.createTextNode("Test " + i);
            var testDiv = document.createElement('div');

            header.appendChild(textNode);
            pos.appendChild(header);
            pos.appendChild(testDiv);
            testSuite[i](testDiv);
        }
    }
}



