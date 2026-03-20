# Copilot Instructions for `HybridHuman`

## Build, test, and lint commands

- Install dependencies: `bun install`
- Run app entrypoint: `bun run index.ts`
- Lint/format check: `bunx --bun biome check .`
- Auto-fix lint/format issues: `bunx --bun biome check --write .`

Current test status in this repo:
- There is no test suite configured yet (no `package.json` scripts and no test files under `src/`).
- `bun test` currently reports no tests. Once tests are added, run all tests with `bun test` and a single test with `bun test <path-to-test-file>`.

## High-level architecture

This repository is an early-stage Bun + TypeScript backend skeleton for a health/wellness scheduling domain.

- `index.ts` is the runtime entrypoint (currently a placeholder log).
- Domain data modeling is centered in `src/models` with Mongoose schemas.
- Application layers are scaffolded as directories:
  - `src/controllers` (request handling; currently auth controller stub)
  - `src/validators` (input validation; currently auth validator stub)
  - `src/routes`, `src/middleware`, `src/utils` (present, currently minimal/empty)

Data model relationships (from schema refs):
- `User` is referenced by `Booking`, `Appointment`, and `Schedule`.
- `Slot` is referenced by `Booking`, `Appointment`, and `Service`.
- `Report` is attachable to `Booking` and `Appointment`.
- `Service` owns an array of `Slot` references.
- `Schedule` owns an array of `Todo` references.

Shared enums are defined in `src/models/Enums.ts` and reused across schemas (`Gender`, `BookingStatus`, `TodoStatus`).

## Key conventions in this codebase

- Runtime/tooling convention is Bun-first (`bun install`, `bun run`, `bun test`) even though dependencies are npm-style packages.
- TypeScript is configured for strict checking with bundler-oriented module resolution (`moduleResolution: "bundler"`, `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`).
- Mongoose models use default exports and are created inline in each file via `mongoose.model("<Name>", schema)`.
- Most schemas enable `{ timestamps: true }` and use string arrays with `default: []` for list-like properties.
- Enum-backed schema fields are declared as `type: String` with `enum: Object.values(...)`; keep enum/schema value shapes aligned when editing `Enums.ts`.
