module("URI handling", {

});

test("isAbsolute", 4, function() {

    equal(new XML3D.URI("http://www.google.de/").isAbsolute(), true);
    equal(new XML3D.URI("../index.html").isAbsolute(), false);
    equal(new XML3D.URI("blob:550e8400-e29b-41d4-a716-446655440000#aboutABBA").isAbsolute(), true);
    equal(new XML3D.URI("mediastream:c7180ca8-6363-4571-bc95-681a8cbe6d1b").isAbsolute(), true);
});