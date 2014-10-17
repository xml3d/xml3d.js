module("URI handling", {

});

test("isAbsolute", 4, function() {

    equal(new XML3D.URI("http://www.google.de/").isAbsolute(), true);
    equal(new XML3D.URI("../index.html").isAbsolute(), false);
    equal(new XML3D.URI("blob:550e8400-e29b-41d4-a716-446655440000#aboutABBA").isAbsolute(), true);
    equal(new XML3D.URI("mediastream:c7180ca8-6363-4571-bc95-681a8cbe6d1b").isAbsolute(), true);
});


test("hasSameOrigin", 8, function() {
    var uri = new XML3D.URI("http://www.example.com/dir/page.html")
    equal(uri.hasSameOrigin(uri), true, "Has same origin as itself");
    equal(uri.hasSameOrigin("http://www.example.com/dir/page2.html"), true);
    equal(uri.hasSameOrigin("http://www.example.com/dir2/other.html"), true);
    equal(uri.hasSameOrigin("http://www.example.com:81/dir2/other.html"), false, "Port differs");
    equal(uri.hasSameOrigin("https://www.example.com/dir/page.html"), false, "Scheme differs");
    equal(uri.hasSameOrigin("http://en.example.com/dir/other.html"), false, "Host differs");
    equal(uri.hasSameOrigin("http://example.com/dir/other.html"), false, "Host differs");
    equal(uri.hasSameOrigin(document.location.href), false, "Everything differs");

});
