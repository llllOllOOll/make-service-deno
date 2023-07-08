import { assertEquals } from "https://deno.land/std@0.193.0/testing/asserts.ts";
import {
  assertSpyCall,
  assertSpyCalls,
  stub,
} from "https://deno.land/std@0.193.0/testing/mock.ts";

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

async function fetchData(url: string): Promise<Post> {
  return (await fetch(url)).json();
}

const successfulFetch = (response: string | Record<string, unknown>) => {
  return Promise.resolve(
    new Response(
      typeof response === "string" ? `{"foo":"bar"}` : JSON.stringify(response)
    )
  );
};

const post: Post = {
  userId: 1,
  id: 1,
  title: "Post 1",
  body: "Post 1 body",
};

Deno.test("fetchData function", async () => {
  const fetchStub = stub(globalThis, "fetch", () => successfulFetch(post));

  const url = "https://jsonplaceholder.typicode.com/posts/1";
  const returned = Promise.resolve(new Response(JSON.stringify(post)));

  try {
    assertEquals(await fetchData(url), post);
    assertEquals(await fetchData(url), post);
  } finally {
    fetchStub.restore();
  }

  assertSpyCall(fetchStub, 0, {
    args: [url],
    returned,
  });

  assertSpyCall(fetchStub, 1, {
    args: [url],
    returned,
  });

  assertSpyCalls(fetchStub, 2);
});
