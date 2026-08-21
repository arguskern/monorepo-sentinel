# Monorepo Sentinel

[![CI & CD](https://github.com/arguskern/monorepo-sentinel/actions/workflows/ci.yml/badge.svg)](https://github.com/arguskern/monorepo-sentinel/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-green.svg)](https://nodejs.org/)

**High-performance Monorepo Dependency Graph, Circular Reference, and Version Mismatch Auditor.**

Interactive Web Playground & Live Visualizer: **[https://arguskern.github.io/monorepo-sentinel/](https://arguskern.github.io/monorepo-sentinel/)**

---

## Overview

In large monorepos (Turborepo, pnpm, Yarn, npm workspaces), complex dependency topologies quickly lead to architectural degradation:
- **Circular Dependencies**: Prevent clean build caching, cause compilation deadlocks, and bloat bundle sizes.
- **Dependency Version Drift**: Different packages consuming incompatible versions of libraries (e.g. `react`, `typescript`, `zod`), leading to multiple instances at runtime and typecheck bottlenecks.
- **ESM/CJS Resolution Failures**: Missing export maps and package entrypoints breaking downstream consumers.

**Monorepo Sentinel** provides automated static analysis, topological cycle detection, version alignment recommendations, and an interactive web visualization interface.

---

## Features

- 🔍 **Topological Cycle Detection**: Employs Depth-First Search (DFS) recursion stack cycle detection to identify all direct and indirect circular dependency chains.
- ⚖️ **Dependency Alignment Engine**: Detects third-party dependency version drift across all packages and outputs automated alignment configurations.
- 📦 **Multi-Monorepo Support**: Seamlessly scans npm workspaces, pnpm workspaces, Yarn workspaces, and Turborepo monorepos.
- 📊 **Interactive Web Dashboard**: Force-directed SVG visualizer with live cycle highlighting, version drift tables, and pre-loaded enterprise monorepo testbeds.
- 🚀 **Zero-Dependency Core**: Lightweight and blazingly fast execution.

---

## Quick Start

### Installation

```bash
npm install -g monorepo-sentinel
```

### CLI Usage

Audit a monorepo in the current directory:
```bash
monorepo-sentinel
```

Audit a specific directory:
```bash
monorepo-sentinel /path/to/monorepo
```

---

## CI / CD Integration (GitHub Actions)

Add `monorepo-sentinel` as a blocking gate in your CI pipeline:

```yaml
name: Monorepo Architecture Gate

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g monorepo-sentinel
      - run: monorepo-sentinel .
```

---

## Architecture & Code Quality

- **100% Test Coverage**: Verified with Node.js test runner across cyclic, acyclic, and multi-version dependency graphs.
- **TypeScript Strict Mode**: Fully typed with ES Module output.

## License

MIT © [Argus Kern](https://github.com/arguskern)
