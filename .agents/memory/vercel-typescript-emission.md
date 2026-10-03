---
name: Vercel TypeScript emission
description: Type-package resolution behavior when Vercel builds this monorepo's serverless chat function.
---

Vercel's Node function compiler forces `noEmit: false` when transpiling TypeScript routes. If the extended project config sets `allowImportingTsExtensions: true`, TypeScript rejects that combination with TS5096 unless the compiler also enables `rewriteRelativeImportExtensions`. With inherited `noEmitOnError: true`, the function can fail with the less-informative `Emit skipped` message.

**Why:** The Vercel build continued to fail after the `typeRoots` change. Reproducing the legacy compiler configuration exposed TS5096 as the actual blocker; removing the unused option allowed the function JavaScript to emit.

**How to apply:** Avoid `allowImportingTsExtensions` in this app's config unless the function compiler is configured to rewrite those imports. Validate Vercel fixes with an emit simulation that forces `noEmit: false` and does not assume `rewriteRelativeImportExtensions` is enabled.