Folder: test/ - The Test Suite
========

Welcome to our extensive **test suite**.

## How to use the the test suite

From your local webserver, simply open the **tests** folder in your browser and select which tests to run.
For the master branch there is also an [online version of the tests suite](http://xml3d.github.com/xml3d.js/tests/).

Note that you can repeat failed tests by clicking the **Rerun** link in the header of the test. 

**Always remember to rebuild xml3d.js before running the tests!**

## How to add new tests

* You can extend one of the existing test modules (e.g. [data-api.js](data-api.js)) or create a new one. 
* When creating a new test module, start with calling the **module** method, providing a module name, setup and teardown code.
 * If you created a new js file for your module, include it in [all.html](all.html)
* Inside a test module, call the **test** method for each new test
 * The first argument is the name f the test
 * The second (optional) argument is a number of checks performed in this test. This is useful if the test may run through missing some checks (in case of concurrent code)
 * The last argument is a callback function performing the code of the test.
* Feel free to add new filters for your tests in [index.html](index.html)
