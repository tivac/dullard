"use strict";

var tests   = require("./lib/tests.js"),
    Dullard = require("../src/dullard.js");

describe("Dullard", function() {
    describe("API", function() {
        describe(".clone()", function() {
            it("should return a new instance", () => {
                var d = new Dullard(),
                    c;

                d.addConfig({
                    one : 1,
                    steps : {
                        one() {},
                        default : [
                            () => {}
                        ]
                    }
                });

                c = d.clone();

                d.one = 2;

                expect(c).toMatchSnapshot();
                expect(d).toMatchSnapshot();
            });
        });

        describe(".child", function() {
            it("should run in a clone of the main instance", () => {
                var d = new Dullard(),
                    c;
                
                d.addConfig({
                    steps : {
                        one() { }
                    }
                });

                return d.child("one")
                    .then((c) => {
                        d.one = 2;

                        expect(c).toMatchSnapshot();
                        expect(d).toMatchSnapshot();
                    });
            });

            it("should return expected errors", () => {
                var d = new Dullard(),
                    c;
                
                d.addConfig({
                    steps : {
                        one() { }
                    }
                });

                return d.child(
                    "two"
                )
                .catch((err) => {
                    expect(err).toMatchSnapshot();
                });
            });
        });
    });
});
