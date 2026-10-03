---
name: Vercel TypeScript emission
description: Type-package resolution behavior when Vercel builds this monorepo's serverless chat function.
---

Vercel's Node builder creates a temporary TypeScript config under `/tmp` and extends the artifact's `tsconfig.json`. Explicit `types` entries can then resolve relative to the temporary config rather than the artifact's `node_modules`. When those type packages are not found, inherited `noEmitOnError: true` can stop function output with the vague `Emit skipped` message.

**Why:** The Vercel build failed even after setting `noEmit: false`; reproducing Vercel's compiler config showed unresolved `node` and `vite/client` type packages were the actual emit blockers.

**How to apply:** For TypeScript serverless functions in this artifact, keep `typeRoots` pointed at the artifact's `node_modules/@types` and `node_modules`, and validate by reproducing the temporary-config emit as well as running the normal app typecheck/build.