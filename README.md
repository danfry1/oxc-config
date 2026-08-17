# @danfry/oxc-config

Shared [oxlint](https://oxc.rs/docs/guide/usage/linter.html) and [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) configuration. **Every rule oxlint ships is on**, except the ones that would contradict another enabled rule, contradict the formatter, or contradict [the engineering standards](https://danfry.dev/standards.md). Projects opt out from there.

## Install

```sh
bun add -d @danfry/oxc-config oxlint oxfmt oxlint-tsgolint
```

## Use

`.oxlintrc.json`:

```json
{ "extends": ["./node_modules/@danfry/oxc-config/oxlintrc.json"] }
```

`.oxfmtrc.json`:

```json
{ "lineWidth": 120 }
```

Scripts:

```json
{
  "lint": "oxlint --type-aware",
  "lint:fix": "oxlint --type-aware --fix",
  "fmt": "oxfmt",
  "fmt:check": "oxfmt --check"
}
```

Type-aware rules (`--type-aware`) need `oxlint-tsgolint` installed. Run `fmt` before `lint`: the formatter owns whitespace and literal casing, the linter owns everything else.

### Presets

| preset                  | for                                                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `oxlintrc.json`         | the strict baseline — applications and anything else                                                                                                                 |
| `oxlintrc.library.json` | published packages: also allows `node:` imports, `*Sync` APIs, `null` (JSON data), `instanceof Number`/`String`/`Boolean`, and `new.target.name` in error subclasses |

```json
{ "extends": ["./node_modules/@danfry/oxc-config/oxlintrc.library.json"] }
```

### Opting out

Turn a rule off in your own config with a comment saying why. That is the intended workflow — the baseline is deliberately stricter than any single project will want:

```json
{
  "extends": ["./node_modules/@danfry/oxc-config/oxlintrc.json"],
  "rules": {
    "unicorn/no-array-sort": "off"
  }
}
```

## What's enabled

All categories at `error` — `correctness`, `suspicious`, `pedantic`, `perf`, `style`, **and `restriction`** — with `nursery` off. Plugins: `typescript`, `unicorn`, `import`, `promise`, `node`, `oxc`.

Enabling `restriction` is the unusual part. It is a grab-bag of opt-in prohibitions rather than a coherent ruleset, so it is where every exclusion below comes from.

## What's off, and why

### Contradicts another enabled rule

These pairs cannot both hold. Each is resolved in favour of the one that matches how the code is actually written.

| off                            | conflicts with                                             | resolution                                                                                                              |
| ------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `import/prefer-default-export` | `import/no-default-export`                                 | named exports win; a module's API is its named exports                                                                  |
| `eslint/sort-imports`          | `import/consistent-type-specifier-style` (`prefer-inline`) | inline `type` specifiers keep one import per module; `sort-imports` wants members reordered across the value/type split |
| `eslint/one-var`               | `eslint/init-declarations`, `prefer-const`                 | one declaration per binding                                                                                             |
| `typescript/consistent-return` | exhaustive `switch` over a discriminated union             | a trailing `return` would be unreachable and would hide the `never` check                                               |
| `eslint/default-case`          | exhaustiveness checking                                    | a `default` arm hides the compile error a new union member is supposed to cause                                         |

### Contradicts the formatter

oxfmt runs last and owns these, so linting them produces unfixable churn.

- `unicorn/number-literal-case` — oxfmt normalizes hex digits to lowercase; the rule wants uppercase.

### Contradicts the engineering standards

[danfry.dev/standards.md](https://danfry.dev/standards.md) requires these patterns, so rules forbidding them are wrong here.

- `eslint/no-undefined` — `x === undefined` is required under `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` (standards rules 16, 21).
- `eslint/no-ternary` — used throughout the standards' own examples.
- `typescript/prefer-readonly-parameter-types` — deep-readonly parameters break internal mutable state carried through a recursion.

### Style prohibitions that make code worse

Judgement calls, listed so they are arguable rather than invisible.

- `eslint/id-length` — forbids `i`, `k`, `v`; loop and accumulator names are clearer short.
- `eslint/no-magic-numbers` — a Unicode or hashing routine is mostly numeric literals; a comment beats a constant name.
- `eslint/sort-keys` — object key order is often meaningful (config precedence, `as const satisfies` tables).
- `eslint/func-style` — function declarations hoist, so helpers can follow their first use.
- `eslint/no-plusplus`, `eslint/no-continue`, `eslint/no-inline-comments`, `eslint/no-use-before-define`.
- `import/no-named-export`, `import/group-exports`, `import/exports-last`, `import/max-dependencies`, `import/no-relative-parent-imports`.

### Wrong for correctness-critical code

- `eslint/require-unicode-regexp`, `unicorn/prefer-code-point` — the `u` flag and `codePointAt` change semantics when a regex or scan deliberately operates on UTF-16 code units.
- `eslint/no-control-regex` — matching control characters is the point when escaping strings.
- `eslint/no-bitwise` — hashing.

### Targets an older language level

- `oxc/no-async-await`, `oxc/no-optional-chaining`, `oxc/no-rest-spread-properties` — these exist for ES5 output targets.

### Relaxed rather than off

- `eslint/max-lines` → 400, `eslint/max-statements` → 30.
- `typescript/consistent-type-definitions` → `"type"` (standards rule 19).
- `import/consistent-type-specifier-style` → `"prefer-inline"`.

## Overrides

Tests (`**/*.test.ts`, `**/test/**`, …) additionally allow long files, boxed primitives, `null`, deliberate precision loss, and untyped assertion values.

Config files, `bin/`, `bench/` and `scripts/` allow default exports, `node:` imports, `console`, and sync APIs.

## Verifying an upgrade

```sh
bun run check
```

Parses both presets **and** lints a fixture per override glob — `--print-config` alone does not validate rule names inside `overrides`, so a rule renamed or removed by an oxlint upgrade would otherwise only fail in a consumer.

## License

MIT
