# CheapJS - TypeScript Port of Cheap

A TypeScript implementation of the CHEAP model (Catalog, Hierarchy, Entity, Aspect, Property) - a git-like system for structured data.

## Project Structure

This is a multi-package npm workspace containing:

```
cheap-ts/
├── package.json              # Workspace root
├── tsconfig.base.json        # Shared TypeScript config
├── packages/
│   ├── cheap-core/           # Core CHEAP model (✓ built)
│   ├── cheap-json/           # JSON serialization (✓ built)
│   ├── cheap-db-sqlite/      # SQLite implementation (scaffolded)
│   ├── cheap-db-postgres/    # PostgreSQL implementation (scaffolded)
│   └── cheap-db-mariadb/     # MariaDB implementation (scaffolded)
```

## Status

### ✅ Completed
- Project structure and build system setup
- TypeScript configuration with project references
- **@cheapjs/core** package with stub implementations:
  - Type definitions (PropertyType, HierarchyType, CatalogSpecies, LocalEntityType)
  - Core interfaces (Property, Aspect, Entity, Hierarchy, Catalog)
  - Basic implementation classes
- **@cheapjs/json** package scaffolded
- Database packages scaffolded (SQLite, PostgreSQL, MariaDB)

### 🚧 Not Yet Implemented
- Actual business logic in implementations (all throw "Not implemented")
- Database persistence layers
- Tests
- Documentation

## Building

### Build All Packages
```bash
# Build cheap-core
cd packages/cheap-core
npm install
npm run build

# Build cheap-json
cd packages/cheap-json
npm install
npm run build
```

### Database Packages
Database packages require native compilation tools (Visual Studio on Windows) for better-sqlite3.
These are currently scaffolded with stub code but not built.

## Architecture

Based on the CHEAP model:
- **Catalog**: Storage container for entities and hierarchies
- **Hierarchy**: Organizational structures (List, Set, Directory, Tree, AspectMap)
- **Entity**: Core data objects with global and local IDs
- **Aspect**: Named groups of properties
- **Property**: Individual data values with typed definitions

## Next Steps

See `INITIAL_PLAN.md` for the full porting plan. The scaffolding is complete - next phase is porting the actual Java implementation logic from the Cheap project.
