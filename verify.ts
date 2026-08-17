/**
 * Guards the shared config against oxlint/oxfmt upgrades. `--print-config` only
 * validates top-level rules, so this also lints fixture files that match each
 * override glob — that is what forces every rule name in an override to resolve.
 * Run with `bun run check`.
 */
import { spawnSync } from "node:child_process";

const CONFIGS = ["oxlintrc.json", "oxlintrc.library.json"] as const;
const FIXTURES = [
  "fixtures/index.ts",
  "fixtures/test/sample.test.ts",
  "fixtures/scripts/sample.ts",
] as const;

let failed = false;

function run(label: string, command: string, args: readonly string[]): void {
  const result = spawnSync(command, [...args], { encoding: "utf8" });
  const ok = result.status === 0;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) {
    failed = true;
    console.error(result.stderr || result.stdout);
  }
}

for (const config of CONFIGS) {
  run(`${config} parses`, "./node_modules/.bin/oxlint", ["-c", config, "--print-config"]);
  run(`${config} resolves every rule`, "./node_modules/.bin/oxlint", ["-c", config, ...FIXTURES]);
}

run("oxfmtrc.json formats", "./node_modules/.bin/oxfmt", [
  "--config",
  "oxfmtrc.json",
  "--check",
  "verify.ts",
]);

process.exit(failed ? 1 : 0);
