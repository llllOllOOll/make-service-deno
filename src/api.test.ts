import { assertEquals } from "https://deno.land/std@0.193.0/testing/asserts.ts";
import {
  assertSpyCall,
  spy,
  stub,
} from "https://deno.land/std@0.193.0/testing/mock.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.193.0/testing/bdd.ts";
import { expect } from "https://deno.land/x/expect/mod.ts";
import { z } from "https://deno.land/x/zod/mod.ts";

import { HTTP_METHODS } from "./constants.ts";
import * as subject from "./api.ts";
//import * as z from "zod";
import { HTTPMethod } from "./types.ts";
import { kebabToCamel } from "./transforms.ts";
import "./test.d.ts";

let reqMock = spy();
function successfulFetch(response: string | Record<string, unknown>) {
  // deno-lint-ignore require-await
  return async (input: URL | RequestInfo, init?: RequestInit | undefined) => {
    reqMock({
      url: input,
      headers: init?.headers,
      method: init?.method,
      body: init?.body,
    });
    return new Response(
      typeof response === "string" ? response : JSON.stringify(response),
    );
  };
}

beforeEach(() => {
  reqMock = spy();
});

describe("enhancedFetch", () => {
  describe("json", () => {
    it("should be untyped by default", async () => {
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: "bar" }),
      );

      const result = await subject
        .enhancedFetch("https://example.com/api/users")
        .then((r) => r.json());
      type _R = Expect<Equal<typeof result, unknown>>;

      try {
        assertEquals(result, { foo: "bar" });
      } finally {
        fetchStub.restore();
      }
    });

    it("should accept a type", async () => {
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: "bar" }),
      );
      const result = await subject
        .enhancedFetch("https://example.com/api/users")
        .then((r) => r.json<{ foo: string }>());
      type _R = Expect<Equal<typeof result, { foo: string }>>;

      try {
        assertEquals(result, { foo: "bar" });
      } finally {
        fetchStub.restore();
      }
    });

    it("should accept a parser", async () => {
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: "bar" }),
      );
      const result = await subject
        .enhancedFetch("https://example.com/api/users")
        .then((r) => r.json(z.object({ foo: z.string() })));
      type _R = Expect<Equal<typeof result, { foo: string }>>;

      try {
        assertEquals(result, { foo: "bar" });
      } finally {
        fetchStub.restore();
      }
    });

    it("should accept a schema that transforms the response", async () => {
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: { "deep-nested": { "kind-of-value": true } } }),
      );
      const result = await subject
        .enhancedFetch("https://example.com/api/users")
        .then((r) =>
          r.json(
            z
              .object({
                foo: z.object({
                  "deep-nested": z.object({ "kind-of-value": z.boolean() }),
                }),
              })
              .transform(kebabToCamel),
          )
        );
      type _R = Expect<
        Equal<typeof result, { foo: { deepNested: { kindOfValue: boolean } } }>
      >;

      try {
        assertEquals(result, { foo: { deepNested: { kindOfValue: true } } });
      } finally {
        fetchStub.restore();
      }
    });

    it("should replace params in the URL", async () => {
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: "bar" }),
      );
      try {
        await subject.enhancedFetch(
          "https://example.com/api/users/:user/page/:page",
          {
            params: {
              user: "1",
              page: "2",
              // @ts-expect-error
              foo: "bar",
            },
          },
        );
      } finally {
        fetchStub.restore();
      }

      assertSpyCall(reqMock, 0, {
        args: [
          {
            url: "https://example.com/api/users/1/page/2",
            body: undefined,
            method: undefined,
            headers: new Headers({
              "content-type": "application/json",
            }),
          },
        ],
      });
    });
    // --- end of test
    it("should accept a requestInit and a query", async () => {
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: "bar" }),
      );
      try {
        await subject.enhancedFetch(
          "https://example.com/api/users",
          {
            headers: {
              Authorization: "Bearer 123",
            },
            query: { admin: "true" },
          },
        );
      } finally {
        fetchStub.restore();
      }

      assertSpyCall(reqMock, 0, {
        args: [
          {
            url: "https://example.com/api/users?admin=true",
            body: undefined,
            method: undefined,
            headers: new Headers({
              "content-type": "application/json",
              authorization: "Bearer 123",
            }),
          },
        ],
      });
      //-- end of test
    });
    // --- end of test
    it("should accept a stringified body", async () => {
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: "bar" }),
      );
      try {
        await subject.enhancedFetch(
          "https://example.com/api/users",
          {
            body: JSON.stringify({
              id: 1,
              name: { first: "John", last: "Doe" },
            }),
            method: "POST",
          },
        );
      } finally {
        fetchStub.restore();
      }

      assertSpyCall(reqMock, 0, {
        args: [
          {
            url: "https://example.com/api/users",
            body: `{"id":1,"name":{"first":"John","last":"Doe"}}`,
            method: "POST",
            headers: new Headers({
              "content-type": "application/json",
            }),
          },
        ],
      });
    });
    // --- end of test

    it("should stringify the body", async () => {
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: "bar" }),
      );
      try {
        await subject.enhancedFetch(
          "https://example.com/api/users",
          {
            body: { id: 1, name: { first: "John", last: "Doe" } },
            method: "POST",
          },
        );
      } finally {
        fetchStub.restore();
      }

      assertSpyCall(reqMock, 0, {
        args: [
          {
            url: "https://example.com/api/users",
            body: `{"id":1,"name":{"first":"John","last":"Doe"}}`,
            method: "POST",
            headers: new Headers({
              "content-type": "application/json",
            }),
          },
        ],
      });
    });
    // --- end of test

    it("should accept a trace function for debugging purposes", async () => {
      const trace = spy();
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: "bar" }),
      );
      try {
        await subject.enhancedFetch(
          "https://example.com/api/users",
          {
            body: { id: 1, name: { first: "John", last: "Doe" } },
            query: { admin: "true" },
            trace,
            method: "POST",
          },
        );
      } finally {
        fetchStub.restore();
      }

      assertSpyCall(trace, 0, {
        args: [
          "https://example.com/api/users?admin=true",
          {
            body: '{"id":1,"name":{"first":"John","last":"Doe"}}',
            method: "POST",
            headers: new Headers({
              "content-type": "application/json",
            }),
          },
        ],
      });
    });
  });
  //--- makeFetcher ---
  describe("makeFetcher", () => {
    it("should return a applied enhancedFetch", async () => {
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: "bar" }),
      );
      try {
        const service = subject.makeFetcher("https://example.com/api");
        const result = await service("/users", { method: "post" }).then((r) =>
          r.json(z.object({ foo: z.string() }))
        );
        type _R = Expect<Equal<typeof result, { foo: string }>>;
      } finally {
        fetchStub.restore();
      }
      assertSpyCall(reqMock, 0, {
        args: [
          {
            url: "https://example.com/api/users",
            body: undefined,
            method: "post",
            headers: new Headers({
              "content-type": "application/json",
            }),
          },
        ],
      });
    });
    //--- end of test
    it.skip("should add headers to the request", async () => {
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: "bar" }),
      );
      try {
        const fetcher = subject.makeFetcher("https://example.com/api", {
          Authorization: "Bearer 123",
        });
        await fetcher("/users");
      } finally {
        fetchStub.restore();
      }

      assertSpyCall(reqMock, 0, {
        args: [
          {
            url: "https://example.com/api/users",
            body: undefined,
            method: undefined,
            headers: new Headers({
              authorization: "Bearer 123",
              "Content-Type": "application/json",
            }),
          },
        ],
      });
    });
    //--- end of test
    it("should accept a typed params object", async () => {
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: "bar" }),
      );
      try {
        const fetcher = subject.makeFetcher("https://example.com/api");
        await fetcher("/users/:id", {
          params: {
            id: "1",
            // @ts-expect-error
            foo: "bar",
          },
        });
      } finally {
        fetchStub.restore();
      }
      assertSpyCall(reqMock, 0, {
        args: [
          {
            url: "https://example.com/api/users/1",
            body: undefined,
            method: undefined,
            headers: new Headers({
              "content-type": "application/json",
            }),
          },
        ],
      });
    });
    //--- end of test
    it.skip("should accept a function for dynamic headers", async () => {
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: "bar" }),
      );
      try {
        const fetcher = subject.makeFetcher("https://example.com/api", () => ({
          Authorization: "Bearer 123",
        }));
        await fetcher("/users");
      } finally {
        fetchStub.restore();
      }
      assertSpyCall(reqMock, 0, {
        args: [
          {
            url: "https://example.com/api/users",
            body: undefined,
            method: undefined,
            headers: new Headers(
              {
                authorization: "Bearer 123",
                "content-type": "application/json",
              },
            ),
          },
        ],
      });
    });
    //--- end of test
    it.skip("should accept an async function for dynamic headers", async () => {
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: "bar" }),
      );
      try {
        const fetcher = subject.makeFetcher(
          "https://example.com/api",
          // deno-lint-ignore require-await
          async () => ({
            Authorization: "Bearer 123",
          }),
        );
        await fetcher("/users");
      } finally {
        fetchStub.restore();
      }
      assertSpyCall(reqMock, 0, {
        args: [
          {
            url: "https://example.com/api/users",
            body: undefined,
            method: undefined,
            headers: new Headers({
              authorization: "Bearer 123",
              "content-type": "application/json",
            }),
          },
        ],
      });
    });
    it("should accept a query, trace, and JSON-like body", async () => {
      const trace = spy();
      const fetchStub = stub(
        globalThis,
        "fetch",
        successfulFetch({ foo: "bar" }),
      );
      try {
        const fetcher = subject.makeFetcher("https://example.com/api");
        await fetcher("/users", {
          method: "POST",
          body: { id: 1, name: { first: "John", last: "Doe" } },
          query: { admin: "true" },
          trace,
        });
      } finally {
        fetchStub.restore();
      }
      assertSpyCall(trace, 0, {
        args: [
          "https://example.com/api/users?admin=true",
          {
            body: `{"id":1,"name":{"first":"John","last":"Doe"}}`,
            method: "POST",
            headers: new Headers({
              "content-type": "application/json",
            }),
          },
        ],
      });
    });
    //--- end of test
  });
});
