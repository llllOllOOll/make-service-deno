import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.193.0/testing/asserts.ts";
import { stub, spy } from "https://deno.land/std@0.193.0/testing/mock.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.193.0/testing/bdd.ts";

import * as subject from "./primitives.ts";
beforeEach(() => {});

describe("addQueryToURL", () => {
  it("should add the query object to a string input", () => {
    assertStrictEquals(
      subject.addQueryToURL("https://example.com/api", { id: "1" }),
      "https://example.com/api?id=1"
    );

    assertStrictEquals(
      subject.addQueryToURL("https://example.com/api", "page=2&foo=bar"),
      "https://example.com/api?page=2&foo=bar"
    );
  });

  it("should add the query object to a URL input", () => {
    assertEquals(
      subject.addQueryToURL(new URL("https://example.com/api"), {
        id: "1",
      }),

      new URL("https://example.com/api?id=1")
    );
    assertEquals(
      subject.addQueryToURL(new URL("https://example.com/api"), "page=2"),
      new URL("https://example.com/api?page=2")
    );
  });

  it("should append the query to a URL string that already has QS", () => {
    assertEquals(
      subject.addQueryToURL("https://example.com/api?id=1", { page: "2" }),
      "https://example.com/api?id=1&page=2"
    );
    assertEquals(
      subject.addQueryToURL("https://example.com/api?id=1", "page=2"),
      "https://example.com/api?id=1&page=2"
    );
    assertEquals(
      subject.addQueryToURL(
        "https://example.com/api?id=1",
        new URLSearchParams({ page: "2" })
      ),
      "https://example.com/api?id=1&page=2"
    );
  });

  it("should append the query to a URL instance that already has QS", () => {
    assertEquals(
      subject.addQueryToURL(new URL("https://example.com/api?id=1"), {
        page: "2",
      }),
      new URL("https://example.com/api?id=1&page=2")
    );
    assertEquals(
      subject.addQueryToURL(new URL("https://example.com/api?id=1"), "page=2"),
      new URL("https://example.com/api?id=1&page=2")
    );
    assertEquals(
      subject.addQueryToURL(
        new URL("https://example.com/api?id=1"),
        new URLSearchParams({ page: "2" })
      ),
      new URL("https://example.com/api?id=1&page=2")
    );
  });

  it("should return the input in case there's no query", () => {
    assertEquals(
      subject.addQueryToURL("https://example.com/api"),
      "https://example.com/api"
    );
    assertEquals(
      subject.addQueryToURL(new URL("https://example.com/api")),
      new URL("https://example.com/api")
    );
  });
});

describe("ensureStringBody", () => {
  it("should return the same if body was string", () => {
    assertStrictEquals(subject.ensureStringBody("foo"), "foo");
  });
  it("should return the same if body was not defined", () => {
    assertStrictEquals(subject.ensureStringBody(), undefined);
  });

  it("should stringify the body if it is a JSON-like value", () => {
    assertStrictEquals(subject.ensureStringBody({ page: 2 }), `{"page":2}`);
    assertStrictEquals(subject.ensureStringBody([1, 2]), `[1,2]`);
    assertStrictEquals(subject.ensureStringBody(3), `3`);
    assertStrictEquals(subject.ensureStringBody(true), `true`);
    assertStrictEquals(subject.ensureStringBody({}), `{}`);
  });

  it("should not stringify other valid kinds of BodyInit", () => {
    const ab = new ArrayBuffer(0);
    assertEquals(subject.ensureStringBody(ab), ab);
    const rs = new ReadableStream();
    assertEquals(subject.ensureStringBody(rs), rs);
    const fd = new FormData();
    assertEquals(subject.ensureStringBody(fd), fd);
    const usp = new URLSearchParams();
    assertEquals(subject.ensureStringBody(usp), usp);
    /**
     * Create a new Blob object with an empty string as its content.
     * This Blob instance can be used to represent binary or structured data.
     * In this case, an empty string is used as a placeholder content.
     *
     * Note: Using new Blob() without any arguments is not recommended as it will throw an error.
     * Please provide appropriate content using an array, ArrayBuffer, or a string as an argument.
     *
     * Usage: const blog = new Blob(['']);
     *
     * @constructor
     * @param {Array} [''] - An array containing a single element, an empty string, as the content of the Blob.
     * @returns {Blob} - A Blob object representing the empty string content.
     */
    const blob = new Blob([""]);
    assertEquals(subject.ensureStringBody(blob), blob);
  });
});

describe("makeGetApiURL", () => {
  it("should return a URL which is baseURL and path joined", () => {
    assertStrictEquals(
      subject.makeGetApiURL("https://example.com/api")("/users"),
      "https://example.com/api/users"
    );
  });

  it("should accept an object-like queryString and return it joined to the URL", () => {
    const getApiURL = subject.makeGetApiURL("https://example.com/api");
    assertStrictEquals(
      getApiURL("/users", { id: "1" }),
      "https://example.com/api/users?id=1"
    );
    assertStrictEquals(
      getApiURL("/users", { active: "true", page: "2" }),
      "https://example.com/api/users?active=true&page=2"
    );
  });

  it("should accept a URL as baseURL and remove extra slashes", () => {
    assertStrictEquals(
      subject.makeGetApiURL(new URL("https://example.com/api"))("/users"),
      "https://example.com/api/users"
    );
    assertStrictEquals(
      subject.makeGetApiURL(new URL("https://example.com/api/"))("/users"),
      "https://example.com/api/users"
    );
    assertStrictEquals(
      subject.makeGetApiURL(new URL("https://example.com/api/"))("///users"),
      "https://example.com/api/users"
    );
  });

  it("should add missing slashes", () => {
    assertStrictEquals(
      subject.makeGetApiURL(new URL("https://example.com/api"))("users"),
      "https://example.com/api/users"
    );
  });
});

describe("mergeHeaders", () => {
  it("should merge different kinds of Headers", () => {
    assertEquals(
      subject.mergeHeaders(new Headers({ a: "1" }), { b: "2" }, [["c", "3"]]),
      new Headers({ a: "1", b: "2", c: "3" })
    );
  });

  it("should merge different kinds of Headers and override values", () => {
    assertEquals(
      subject.mergeHeaders(new Headers({ a: "1" }), { a: "2" }, [["a", "3"]]),
      new Headers({ a: "3" })
    );
  });

  it("should merge different kinds of Headers and delete undefined values", () => {
    assertEquals(
      subject.mergeHeaders(new Headers({ a: "1" }), { a: undefined }),
      new Headers({})
    );
    assertEquals(
      subject.mergeHeaders(new Headers({ a: "1" }), { a: "undefined" }),
      new Headers({})
    );
    assertEquals(
      subject.mergeHeaders(new Headers({ a: "1" }), [["a", undefined]]),
      new Headers({})
    );
  });
});

describe("replaceURLParams", () => {
  it("should replace the wildcards in an URL string with the given parameters", () => {
    assertEquals(
      subject.replaceURLParams("/users/:id", { id: "1" }),
      "/users/1"
    );
    assertEquals(
      subject.replaceURLParams("http://example.com/users/:id/posts/:postId", {
        id: "1",
        postId: "3",
      }),
      "http://example.com/users/1/posts/3"
    );
  });

  it("should replace the wildcards in an instance of URL", () => {
    assertEquals(
      subject.replaceURLParams(new URL("/users/:id", "http://example.com"), {
        id: "1",
      }),
      new URL("http://example.com/users/1")
    );
  });
});
