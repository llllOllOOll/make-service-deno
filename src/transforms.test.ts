import { assertEquals } from "https://deno.land/std@0.193.0/testing/asserts.ts";
import { stub, spy } from "https://deno.land/std@0.193.0/testing/mock.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.193.0/testing/bdd.ts";

import "./test.d.ts";
import type * as Subject from "./transforms.ts";
import * as subject from "./transforms.ts";

// deno-lint-ignore no-namespace
namespace TypeTransforms {
  type test1 = Expect<
    Equal<Subject.CamelToKebab<"camelToKebab">, "camel-to-kebab">
  >;
  type test2 = Expect<
    Equal<Subject.CamelToSnake<"camelToSnake">, "camel_to_snake">
  >;
  type test3 = Expect<
    Equal<Subject.KebabToCamel<"kebab-to-camel">, "kebabToCamel">
  >;
  type test4 = Expect<
    Equal<Subject.KebabToSnake<"kebab-to-snake">, "kebab_to_snake">
  >;
  type test5 = Expect<
    Equal<Subject.SnakeToCamel<"snake_to_camel">, "snakeToCamel">
  >;
  type test6 = Expect<
    Equal<Subject.SnakeToKebab<"snake_to_kebab">, "snake-to-kebab">
  >;
}

describe("deep transforms", () => {
  it("camelToKebab", () => {
    const result = subject.camelToKebab({
      some: { deepNested: { value: true } },
      otherValue: true,
    });

    assertEquals(result, {
      some: {
        "deep-nested": { value: true },
      },
      "other-value": true,
    });

    type test = Expect<
      Equal<
        typeof result,
        { some: { "deep-nested": { value: boolean } }; "other-value": boolean }
      >
    >;
  });
});
