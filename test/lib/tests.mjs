import { expect } from "vitest";

import dedent   from "dedent";
import calmcard from "calmcard";

const crlf     = /\r\r/g;
const trailing = /\s+\n/g;

function clean(str) {
    return dedent(str).replace(crlf, "\n").replace(trailing, "\n");
}

function wildcard(one, two) {    
    one = clean(one);
    two = clean(two);
    
    // wildcard comparison
    const result = calmcard(two, one);

    // If wildcard match failed show nice diff output
    // it won't respect wildcard chars, but not much to do about that
    if (!result) {
        expect(one).toBe(two);
    }
}

export function failure(result, text) {
    expect(result.code).toBe(1);

    wildcard(result.stderr, text);
}

export function success(result, text) {
    expect(result.code).toBe(0);

    wildcard(result.stderr, text);
}
