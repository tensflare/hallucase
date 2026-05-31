# Contributing to HalluCase

We welcome contributions from the legal technology community! This guide explains how to set up the project for development and submit changes.

## Development Setup

### Prerequisites

- Node.js >= 18
- npm >= 9

### Local Installation

```bash
git clone https://github.com/tensflare/hallucase.git
cd hallucase
npm install
```

### Development Workflow

```bash
# Run typechecking
npm run typecheck

# Run tests
npm test

# Watch mode for tests
npm run test:watch

# Run the CLI in development mode
npm run dev -- search

# Start the API server in development mode
npm run serve
```

### Building

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

## Project Structure

```
hallucase/
├── src/
│   ├── index.ts              # Library entry point
│   ├── schema.ts             # Core Zod schemas and TypeScript types
│   ├── cli.ts                # Commander-based CLI
│   ├── registry/
│   │   ├── index.ts          # RegistryStore interface
│   │   ├── memory.ts         # In-memory implementation (testing)
│   │   └── sqlite.ts         # SQLite-backed implementation
│   ├── api/
│   │   ├── router.ts         # Express router
│   │   └── server.ts         # Express server setup
│   ├── validate/
│   │   └── index.ts          # Validation utilities
│   └── import/
│       └── index.ts          # Import utilities
├── schemas/
│   └── hallucination-report.json  # JSON Schema
├── test/
│   ├── schema.test.ts        # Schema validation tests
│   └── registry.test.ts      # Registry store tests
└── docs/
    ├── api.md                # API reference
    ├── cli.md                # CLI reference
    └── schema.md             # Schema documentation
```

## Coding Standards

- **Language:** TypeScript with strict mode enabled
- **Modules:** ES modules (`import`/`export`)
- **Formatting:** Use Prettier with default settings
- **Naming:** camelCase for variables/functions, PascalCase for types/classes
- **No TODOs or stubs:** All code must be complete and functional

## Pull Request Process

1. **Fork** the repository and create a feature branch from `main`
2. **Make your changes** following the coding standards above
3. **Run the full test suite** — all tests must pass
4. **Run typechecking** — `npm run typecheck` must pass
5. **Submit a PR** with a clear description of what you changed and why

### PR Checklist

- [ ] Code compiles with `npm run typecheck`
- [ ] All tests pass with `npm test`
- [ ] New tests added for new functionality
- [ ] No breaking changes to the public API without discussion
- [ ] Documentation updated if needed

## Reporting Issues

- **Bug reports:** Use the bug report template in `.github/ISSUE_TEMPLATE/`
- **Feature requests:** Use the feature request template
- **Security concerns:** Email security@tensflare.com

## Hallucination Report Contributions

To contribute a new hallucination report (not code):

1. Ensure the incident is real and documented
2. Include reproduction steps if possible
3. Verify the details with supporting references
4. Submit via `hallucase submit` or the API

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
