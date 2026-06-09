import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/emit.ts", "src/schemas/*.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: "es2020",
  outDir: "dist",
  // Emit the cross-language keyset (dist/signal-registry-keyset.json) after the
  // JS/d.ts bundles land — it imports the built dist/index.js. SPEC §5 / §7-A.
  onSuccess: "node scripts/emit-keyset.mjs",
});
