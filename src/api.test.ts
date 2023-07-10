import { assertEquals } from "https://deno.land/std@0.193.0/testing/asserts.ts";
import { stub, spy } from "https://deno.land/std@0.193.0/testing/mock.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.193.0/testing/bdd.ts";
import { fetchData } from "./get_data.ts";

const reqMock = spy();
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
      typeof response === "string" ? response : JSON.stringify(response)
    );
  };
}

beforeEach(() => {});

describe("enhacedFetch", () => {
  it("should be untyped by default", async () => {
    const fetchStub = stub(
      globalThis,
      "fetch",
      successfulFetch({ foo: "bar" })
    );

    const url = "https://jsonplaceholder.typicode.com/posts/1";

    try {
      assertEquals(await fetchData(url), { foo: "bar" });
    } finally {
      fetchStub.restore();
    }
  });

  //   assertSpyCall(reqMock, 0, {
  //     args: [url],
  //   });

  //   assertSpyCall(fetchStub, 0, {
  //     args: [url],
  //     returned,
  //   });

  //   assertSpyCall(fetchStub, 1, {
  //     args: [url],
  //     returned,
  //   });

  //   assertSpyCalls(fetchStub, 2);
});
