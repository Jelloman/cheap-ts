# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript port of the Cheap Java project, implementing the CHEAP model (Catalog, Hierarchy, Entity, Aspect, Property) - a git-like system for structured data. The project is currently in **scaffolding phase** with stub implementations that throw "Not implemented" errors.

## Build System

This is an **npm workspace** with multiple packages. TypeScript is configured with **project references** for incremental multi-module builds.

### Building Packages

```bash
# From workspace root (builds all packages)
yarn run build

# Build individual packages (recommended during development)
cd packages/cheap-core && yarn install && yarn run build
cd packages/cheap-json && yarn install && yarn run build

# Clean build artifacts
yarn run clean
```

### Running Tests

```bash
# From workspace root
yarn run test

# Individual package
cd packages/cheap-core && yarn run test
```

### Linting and Formatting

```bash
yarn run lint
npm run format
```

## Architecture

### The CHEAP Model Hierarchy

The architecture follows a strict layered dependency model:

```
Property (lowest level)
    ↓
Aspect (groups of properties)
    ↓
Entity (collections of aspects with IDs)
    ↓
Hierarchy (organizational structures for entities)
    ↓
Catalog (storage container for entities and hierarchies)
```

### Core Concepts

- **Property**: Individual data values with typed definitions (`PropertyDef` + value)
- **Aspect**: Named groups of properties (`AspectDef` + property map)
- **Entity**: Core data objects with both global IDs (UUIDs) and local IDs (catalog-specific)
- **Hierarchy**: Five organizational structures:
  - `EntityListHierarchy` - Ordered list
  - `EntitySetHierarchy` - Unordered set
  - `EntityDirectoryHierarchy` - Key-value map
  - `EntityTreeHierarchy` - Parent-child tree
  - `AspectMapHierarchy` - Map of aspects
- **Catalog**: Storage abstraction with three species: MEMORY, FILE, DATABASE

### Package Structure

```
packages/
├── cheap-core/          # Core model (interfaces + implementations)
│   ├── src/
│   │   ├── types.ts           # Enums: PropertyType, HierarchyType, etc.
│   │   ├── interfaces/        # TypeScript interfaces (contract definitions)
│   │   └── impl/              # Implementation classes
│   └── package.json
├── cheap-json/          # JSON serialization layer
├── cheap-db-sqlite/     # SQLite persistence (requires Visual Studio on Windows)
├── cheap-db-postgres/   # PostgreSQL persistence
└── cheap-db-mariadb/    # MariaDB persistence
```

**Dependency flow**: `cheap-core` is foundational. All other packages depend on it via `file:../cheap-core` references.

### Code Organization Pattern

Each package follows this structure:
- `src/index.ts` - Barrel export for public API
- `src/interfaces/` - Interface definitions (contracts)
- `src/impl/` - Implementation classes
- `dist/` - Compiled JavaScript + TypeScript declarations (generated)

## TypeScript Configuration

- **Module system**: ESM (ES modules) - use `.js` extensions in imports
- **Target**: ES2022
- **Strict mode**: Enabled with all strict checks
- **Decorators**: Enabled (`experimentalDecorators`, `emitDecoratorMetadata`) for future reflection-based implementations
- **Project references**: Each package references its dependencies via `tsconfig.json`

## Development Guidelines

### When Porting Java Code

Refer to `INITIAL_PLAN.md` for the comprehensive porting plan. Key mappings:

**Type conversions:**
- Java UUID → `crypto.randomUUID()` or `uuid` package
- Java ZonedDateTime → `Date` or date library
- Java BigInteger/BigDecimal → `big.js` or `bignumber.js`
- Guava collections → Native JS Map/Set + readonly
- Lombok → Native TypeScript class properties
- Jackson → Native JSON or custom serializers

**Pattern conversions:**
- JDBC (synchronous) → async/await with database drivers
- Java reflection → TypeScript decorators + `reflect-metadata`
- `@NotNull/@Nullable` → TypeScript's `T | null` unions

### Immutability Strategy

The CHEAP model emphasizes immutability:
- Use `readonly` on properties and collections
- All interfaces expose `Readonly` types (e.g., `ReadonlyMap`, `readonly T[]`)
- Implementation classes should use defensive copying

### Import Conventions

Always use `.js` extensions for local imports (TypeScript ESM requirement):
```typescript
import { Entity } from './Entity.js';  // ✓ Correct
import { Entity } from './Entity';     // ✗ Wrong
```

## Database Packages

Database packages depend on native modules that require C++ build tools:
- **better-sqlite3** (SQLite) - Requires Visual Studio on Windows
- **pg** (PostgreSQL) - Pure JavaScript, no build tools needed
- **mariadb** - Pure JavaScript, no build tools needed

If you encounter node-gyp errors when installing, the core and JSON packages can be built independently.

## Testing Strategy

When implementing tests:
- Use **Vitest** (configured in each package)
- Port existing JUnit tests from the Java codebase
- Use fixed UUIDs for deterministic test behavior
- Prefer immutable collections in test data

## Current Status

**Implemented:**
- Project scaffolding and build system
- Core type definitions (enums)
- Interface definitions for all CHEAP model components
- Stub implementation classes (throw "Not implemented")

**Next phases** (see `INITIAL_PLAN.md`):
1. Port core implementations from Java
2. Implement JSON serialization/deserialization
3. Port database persistence layers
4. Port unit tests
5. Documentation and optimization
