import { build, emptyDir } from "https://deno.land/x/dnt@0.37.0/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  scriptModule: false,
  shims: {
    deno: true,
    timers: true,
    blob: true,

    custom: [
      {
        package: {
          name: "node-fetch",
          version: "^3.3.1",
        },

        globalNames: [
          { name: "fetch", exportName: "default" },
          {
            name: "RequestInfo",
            typeOnly: true,
          },
          {
            name: "RequestInit",
            typeOnly: true,
          },
          {
            name: "BodyInit",
            typeOnly: true,
          },
          {
            name: "Response",
          },
          { name: "FormData" },
          { name: "Headers" },
          { name: "HeadersInit", typeOnly: true },
        ],
      },
      {
        package: {
          name: "stream/web",
        },
        globalNames: ["ReadableStream", "TransformStream"],
      },
    ],
  },
  package: {
    name: "greet-deno",
    version: Deno.args[0],
    description: "A simple Deno package",
    license: "MIT",
  },
});

Deno.copyFileSync("./README.md", "./npm/README.md");
