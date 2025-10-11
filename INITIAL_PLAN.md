# High-Level TypeScript Port Plan: Cheap → CheapJS

## Project Overview
The Cheap Java project is a data caching system with ~137 Java files organized into 3 modules (cheap-core, cheap-db, cheap-json). It implements the CHEAP model (Catalog, Hierarchy, Entity, Aspect, Property) - a git-like system for structured data.

---

## Phase 1: Project Setup & Infrastructure

### 1.1 Build System Setup
- **Create multi-module npm workspace** in `/cheapjs` directory
- **Structure:**
  ```
  cheapjs/
  ├── package.json (workspace root)
  ├── tsconfig.base.json (shared TypeScript config)
  ├── packages/
  │   ├── cheap-core/
  │   ├── cheap-db/
  │   └── cheap-json/
  ```
- **Build tooling:** Use TypeScript compiler with project references for multi-module builds
- **Testing:** Jest or Vitest for unit testing
- **Linting:** ESLint + Prettier for code quality

### 1.2 Dependency Mapping

**Java → TypeScript equivalents:**
- **Guava** → Native JS/TS collections + utility libraries (lodash-es)
- **Lombok** → Native TypeScript features (getters/setters not needed)
- **JetBrains Annotations** → TypeScript's built-in null-safety
- **JUnit Jupiter** → Jest/Vitest
- **Commons Math3** → Math.js or native JavaScript
- **Jackson** → Native JSON support or Zod for validation
- **SQLite/PostgreSQL JDBC** → better-sqlite3, node-postgres (pg)
- **Flyway** → node-pg-migrate or db-migrate

---

## Phase 2: Core Module Port (cheap-core)

### 2.1 Type System & Enums
**Priority:** Port fundamental enums first
- `PropertyType` → TypeScript enum with type guards
- `HierarchyType` → TypeScript enum
- `CatalogSpecies` → TypeScript enum
- `LocalEntityType` → TypeScript enum

### 2.2 Model Interfaces
**Port Java interfaces to TypeScript interfaces:**
- Core interfaces: `Entity`, `Aspect`, `Property`, `PropertyDef`, `AspectDef`
- Catalog interfaces: `Catalog`, `CatalogDef`
- Hierarchy interfaces: `Hierarchy`, `EntityListHierarchy`, `EntitySetHierarchy`, `EntityDirectoryHierarchy`, `EntityTreeHierarchy`, `AspectMapHierarchy`
- Builder interfaces: `AspectBuilder`, `MutableAspectDef`

**Considerations:**
- Java's UUID → Use `crypto.randomUUID()` (Node 19+) or `uuid` package
- Java's ZonedDateTime → Use `Date` or `date-fns`/`dayjs`
- Java's URI → Use native `URL` or string validation
- Java's BigInteger/BigDecimal → Use `big.js` or `bignumber.js`

### 2.3 Basic Implementations
**Port ~30 basic implementation classes:**
- Entity implementations: `EntityImpl`, `EntityLazyIdImpl`, `LocalEntityOneCatalogImpl`, etc.
- Aspect implementations: `AspectBaseImpl`, `AspectPropertyMapImpl`, `AspectObjectMapImpl`
- Hierarchy implementations: All 5 hierarchy types
- Builders: `AspectBuilderBase`, `PropertyDefBuilder`
- Catalog: `CatalogImpl`, `CatalogDefImpl`

**Key decisions:**
- Use TypeScript classes (not just interfaces) for implementations
- Consider using branded types for IDs (global vs local)
- Implement immutability using `readonly` and defensive copying

### 2.4 Reflection-Based Implementations
**Port reflection utilities:**
- Java reflection → TypeScript decorators + metadata reflection
- `RecordAspect`, `RecordAspectDef` → TypeScript class with decorators
- `ImmutablePojoAspect`, `MutablePojoAspect` → TypeScript classes

**Alternative approach:**
- Consider using TypeScript's mapped types and conditional types
- May simplify compared to Java reflection approach

### 2.5 Utility Classes
- `CheapFactory` → Factory functions or builder patterns
- `CheapFileUtil` → Node.js `fs/promises` API
- `CheapHasher` → Node.js `crypto` module
- Reflection utilities → TypeScript decorators/metadata

---

## Phase 3: Database Module Port (cheap-db)

### 3.1 Database Abstraction Layer
**Port JDBC-based code to Node.js database drivers:**
- `JdbcCatalogBase` → Abstract base class using async/await
- Database-specific schemas: SQLite, PostgreSQL, MariaDB

### 3.2 Database Implementations
- **SQLite:** `SqliteCatalog`, `SqliteDao`, `SqliteCheapSchema`
  - Use `better-sqlite3` (synchronous) or `sqlite3` (async)
- **PostgreSQL:** `PostgresCatalog`, `PostgresDao`, `PostgresCheapSchema`
  - Use `pg` (node-postgres)
- **MariaDB:** `MariaDbCatalog`, `MariaDbDao`, `MariaDbCheapSchema`
  - Use `mysql2` or `mariadb` connector

### 3.3 Migration Strategy
- Port Flyway SQL migrations to node-pg-migrate or similar
- Ensure schema compatibility between Java and TypeScript versions
- Consider using TypeORM or Kysely for type-safe query building

---

## Phase 4: JSON Module Port (cheap-json)

### 4.1 Serialization/Deserialization
**Port Jackson serializers to TypeScript:**
- Native `JSON.stringify()`/`JSON.parse()` with custom replacer/reviver
- Or use libraries like `class-transformer` or `superjson`

**Files to port:**
- Serializers: `AspectSerializer`, `AspectDefSerializer`, `CatalogSerializer`, etc.
- Deserializers: `AspectDeserializer`, `CatalogDeserializer`, `HierarchyDeserializer`, etc.

### 4.2 Schema Validation
- Consider Zod or JSON Schema for runtime validation
- Type guards for deserialized data

---

## Phase 5: Testing Strategy

### 5.1 Unit Tests
- Port existing JUnit tests to Jest/Vitest
- Maintain test coverage parity with Java version
- Use immutable collections in tests (as per Java style guide)
- Use fixed UUIDs in tests for deterministic behavior

### 5.2 Integration Tests
- Test database persistence layer with real databases
- Use test containers or in-memory databases where possible
- Port Flyway/embedded database tests

---

## Phase 6: Documentation & Refinement

### 6.1 Documentation
- Port JavaDoc comments to TSDoc
- Create TypeScript-specific README files for each module
- Document API differences from Java version

### 6.2 Build & Distribution
- Set up npm publishing workflow
- Create TypeScript declaration files (.d.ts)
- Consider ESM vs CommonJS module format (prefer ESM)

### 6.3 Performance Optimization
- Profile hot paths (entity ID generation, property access)
- Optimize serialization/deserialization
- Consider caching strategies

---

## Key Technical Decisions

### Type System Mapping
| Java Pattern | TypeScript Approach |
|--------------|---------------------|
| Interface + Implementation | Interface + Class |
| Generics `<T extends Foo>` | Generics `<T extends Foo>` |
| `@NotNull` / `@Nullable` | Non-null by default / `T \| null` |
| Lombok getters/setters | Native class properties |
| Reflection | Decorators + `reflect-metadata` |
| Enums | `enum` or discriminated unions |

### Immutability Strategy
- Use `readonly` keyword extensively
- Consider `immutable.js` or `immer` for complex structures
- Frozen objects for true runtime immutability

### Async/Await Patterns
- Database operations must be async (unlike JDBC)
- Consider streaming APIs for BLOB/CLOB (Node.js streams)
- Promise-based API design

### Module System
- Use ES modules (ESM) for modern compatibility
- Project references for multi-module TypeScript builds
- Proper barrel exports from each module

---

## Estimated Complexity

**Lines of Code:** ~10,000-15,000 LOC (estimated from 137 Java files)

**Module Priority:**
1. **cheap-core** (highest) - Foundation for everything else
2. **cheap-json** - Needed for testing/debugging
3. **cheap-db** - Can follow after core is stable

**Risk Areas:**
- Reflection-based implementations (most complex)
- Database async patterns vs Java's synchronous JDBC
- BigInteger/BigDecimal precision handling
- UUID generation performance

---

This plan provides a structured approach to porting the Cheap Java project to TypeScript while maintaining architectural integrity and leveraging TypeScript's strengths.
