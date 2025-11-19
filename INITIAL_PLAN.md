# High-Level TypeScript Port Plan: Cheap → CheapJS

## Project Overview
The Cheap Java project is a data caching system implementing the CHEAP model (Catalog, Hierarchy, Entity, Aspect, Property) - a git-like mechanism for structured data and objects. The project is organized into **8 modules**:

**Core & Persistence (original 3 modules):**
- **cheap-core** - Core interfaces and implementations
- **cheap-json** - JSON serialization using Jackson
- **cheap-db** - Database persistence (SQLite, PostgreSQL, MariaDB)

**REST API & Client (3 new modules):**
- **cheap-rest** - Spring Boot REST API service
- **cheap-rest-client** - Java client library using Spring WebFlux
- **integration-tests** - Comprehensive integration test suite

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
  │   ├── cheap-json/
  │   ├── cheap-db-mariadb/
  │   ├── cheap-db-postgres/
  │   ├── cheap-db-sqlite/
  │   ├── cheap-rest/          # REST API service
  │   ├── cheap-rest-client/   # HTTP client library
  │   └── integration-tests/   # Integration test suite
  ```
- **Build tooling:** Use TypeScript compiler with project references for multi-module builds
- **Testing:** Jest or Vitest for unit testing
- **Linting:** ESLint + Prettier for code quality

### 1.2 Dependency Mapping

**Java → TypeScript equivalents:**

**Core libraries:**
- **Guava** → Native JS/TS collections + utility libraries (lodash-es)
- **Lombok** → Native TypeScript features (getters/setters not needed)
- **JetBrains Annotations** → TypeScript's built-in null-safety
- **JUnit Jupiter** → Jest/Vitest
- **Jackson** → Native JSON support or Zod for validation

**Database:**
- **SQLite/PostgreSQL JDBC** → better-sqlite3, node-postgres (pg)
- **MariaDB JDBC** → mysql2 or mariadb connector
- **Flyway** → node-pg-migrate or db-migrate

**REST API & HTTP:**
- **Spring Boot** → Express.js, Fastify, or NestJS (recommended for enterprise)
- **Spring Web** → Express/Fastify routing
- **Spring Boot Actuator** → express-actuator or custom health/metrics endpoints
- **Spring WebFlux WebClient** → axios, node-fetch, or ky
- **OpenAPI/Swagger** → @nestjs/swagger, swagger-jsdoc, or tsoa
- **Spring Data JPA** → TypeORM, Prisma, or Kysely for type-safe queries

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

## Phase 5: Unit Testing Strategy

**Note:** This phase covers unit tests for individual modules. See Phase 9 for end-to-end integration testing.

### 5.1 Core Module Unit Tests
- Port existing JUnit tests to Jest/Vitest
- Maintain test coverage parity with Java version
- Use immutable collections in tests (as per Java style guide)
- Use fixed UUIDs in tests for deterministic behavior
- Test all CHEAP model components in isolation

### 5.2 Database Module Unit Tests
- Test database persistence layer with real databases
- Use test containers or in-memory databases where possible
- Port Flyway/embedded database tests
- Test each database backend independently

### 5.3 JSON Module Unit Tests
- Test serialization/deserialization of all CHEAP types
- Verify JSON schema compatibility with Java version
- Test edge cases (null values, empty collections, etc.)

### 5.4 REST Module Unit Tests
- Test API endpoints with mocked database layer
- Validate request/response formats
- Test error handling and validation
- Mock HTTP requests for controller testing

### 5.5 REST Client Unit Tests
- Test HTTP client with mocked server responses
- Verify error handling and retry logic
- Test request transformation and response parsing

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

## Phase 7: REST API Module Port (cheap-rest)

### 7.1 REST API Framework Selection
**Choose appropriate Node.js framework:**
- **Option 1: NestJS** (recommended)
  - Built on Express, enterprise-ready with decorators
  - Native OpenAPI/Swagger support via @nestjs/swagger
  - Dependency injection similar to Spring
  - Built-in validation pipes (class-validator)
  - Excellent TypeScript support
- **Option 2: Express + tsoa**
  - Lightweight, generates OpenAPI spec from TypeScript decorators
  - More manual configuration than NestJS
- **Option 3: Fastify**
  - High performance, schema-based validation
  - Good TypeScript support

### 7.2 Core API Endpoints
**Port Spring Boot REST controllers to TypeScript:**

**Catalog Operations:**
- `POST /catalogs` - Create catalog with definition
- `GET /catalogs` - List catalogs with pagination
- `GET /catalogs/{uuid}` - Retrieve specific catalog
- `GET /catalogs/{uuid}/definition` - Get catalog definition

**AspectDef Operations:**
- `POST /catalogs/{catalogId}/aspect-defs` - Add aspect definition
- `GET /catalogs/{catalogId}/aspect-defs` - List aspect definitions
- `GET /catalogs/{catalogId}/aspect-defs/{uuid}` - Get by UUID
- `GET /catalogs/{catalogId}/aspect-defs/by-name/{name}` - Get by name

**Aspect Operations:**
- `POST /catalogs/{catalogId}/aspects` - Upsert aspect (auto-create entity)
- `GET /catalogs/{catalogId}/aspects` - Query aspects with filters

**Hierarchy Operations:**
- `GET /catalogs/{catalogId}/hierarchies/{type}/{name}` - Retrieve hierarchy contents
  - Support all 5 hierarchy types: EntityList, EntitySet, EntityDirectory, EntityTree, AspectMap
- Mutation operations for adding/removing entities, directory entries, tree nodes

### 7.3 Database Integration
**Multi-database support via configuration:**
- Use environment variables or config files for database selection
- Abstract database access through cheap-db modules
- Support PostgreSQL (production recommended), SQLite (dev/test), MariaDB

**Implementation approach:**
- Reuse existing cheap-db-* modules for persistence
- Wrap database operations with async/await
- Implement transaction management

### 7.4 API Documentation & Monitoring
**OpenAPI/Swagger integration:**
- Auto-generate OpenAPI 3.0 specification
- Interactive Swagger UI at `/swagger-ui` or `/api-docs`
- Export specification for client generation

**Health & Metrics (Actuator equivalent):**
- `/health` endpoint for service status
- `/metrics` endpoint for Prometheus-compatible metrics
- Database connection health checks
- Custom metrics for catalog operations

### 7.5 Error Handling & Validation
- Global error handler for consistent error responses
- Input validation using class-validator or Zod
- HTTP status codes: 400 (bad request), 404 (not found), 500 (server error)
- Detailed error messages with request tracing

---

## Phase 8: REST Client Module Port (cheap-rest-client)

### 8.1 HTTP Client Library
**Port Spring WebFlux WebClient to TypeScript:**

**Option 1: axios** (most popular)
- Simple API, good TypeScript support
- Interceptors for error handling
- Request/response transformation

**Option 2: ky** (modern fetch wrapper)
- Smaller bundle size
- Built on native fetch API
- Good TypeScript types

**Option 3: node-fetch** (minimal)
- Polyfill for browser fetch
- Lightweight

### 8.2 Client API Design
**Create type-safe client interface:**

```typescript
interface CheapRestClient {
  // Catalog operations
  createCatalog(request: CreateCatalogRequest): Promise<CreateCatalogResponse>
  listCatalogs(params?: PaginationParams): Promise<CatalogListResponse>
  getCatalog(uuid: string): Promise<Catalog>
  getCatalogDefinition(uuid: string): Promise<CatalogDef>

  // AspectDef operations
  addAspectDef(catalogId: string, aspectDef: AspectDef): Promise<void>
  listAspectDefs(catalogId: string): Promise<AspectDef[]>
  getAspectDef(catalogId: string, uuid: string): Promise<AspectDef>
  getAspectDefByName(catalogId: string, name: string): Promise<AspectDef>

  // Aspect operations
  upsertAspect(catalogId: string, aspect: Aspect): Promise<UpsertResponse>
  queryAspects(catalogId: string, query: AspectQuery): Promise<AspectQueryResponse>

  // Hierarchy operations
  getHierarchy<T>(catalogId: string, type: HierarchyType, name: string): Promise<Hierarchy<T>>
  addToHierarchy(catalogId: string, hierarchyName: string, mutation: HierarchyMutation): Promise<void>
}
```

### 8.3 Error Handling
**Port Java exception classes:**
- `CheapRestNotFoundException` (404 errors)
- `CheapRestBadRequestException` (400 errors)
- `CheapRestServerException` (5xx errors)
- `CheapRestClientException` (network errors)

**Implement HTTP interceptors:**
- Automatic retry logic for transient failures
- Request/response logging
- Error transformation from HTTP responses to typed exceptions

### 8.4 Response DTOs
**Port Java response classes:**
- `CreateCatalogResponse` - UUID of created catalog
- `AspectQueryResponse` - Paginated aspect results
- `TreeOperationResponse` - Hierarchy mutation results
- `UpsertResponse` - Entity creation/update status

### 8.5 Client Configuration
**Support flexible configuration:**
- Base URL configuration
- Timeout settings
- Authentication/authorization headers (if needed)
- Retry policies
- Custom serialization/deserialization

---

## Phase 9: Integration Testing Module Port (integration-tests)

### 9.1 Testing Framework Setup
**Port Gradle-based tests to Node.js:**
- Use **Vitest** or **Jest** for test runner
- Configure for integration testing (longer timeouts)
- Support for async/await test patterns

### 9.2 Test Architecture
**Maintain architectural separation:**
- Tests ONLY interact with cheap-rest-client (never direct database access)
- cheap-rest server runs as separate process/container
- Tests run in local Node.js process
- All verification through REST API responses

**Test organization:**
```
integration-tests/
├── src/
│   ├── setup/           # Test server startup/shutdown
│   ├── fixtures/        # Test data fixtures
│   ├── tests/
│   │   ├── catalog/     # Catalog operation tests
│   │   ├── aspect/      # Aspect operation tests
│   │   ├── hierarchy/   # Hierarchy operation tests
│   │   ├── cross-db/    # Cross-database consistency
│   │   └── performance/ # Performance baselines
```

### 9.3 Test Phases (matching Java integration test plan)

**Phase 1: Cross-Database Consistency**
- Parameterized tests running against PostgreSQL, SQLite, MariaDB
- Verify identical behavior across all database backends
- Test coverage:
  - Catalog structure operations
  - AspectDef CRUD operations
  - Aspect upserts and queries
  - Pagination and sorting
  - All 5 hierarchy types

**Phase 2: Complex Scenarios**
- **Full workflow tests:**
  - Create catalog → Define aspects → Build hierarchies → Bulk upsert → Query
  - Real-world usage simulation
- **Concurrency tests:**
  - Multiple concurrent operations using Promise.all()
  - Verify data consistency under concurrent load
  - Test with 10+ parallel operations

**Phase 3: Performance Baselines**
- Establish metrics for key operations:
  - Bulk upsert performance (1000+ entities)
  - Query performance with filters
  - Hierarchy retrieval performance
  - Pagination performance
- Compare across database backends
- Regression testing for performance

**Phase 4: Docker-Based Testing**
- Use **Testcontainers** (Node.js version) for database containers
- Separate cheap-rest server instances per database
- Test realistic deployment scenarios
- Automated container lifecycle management

### 9.4 Test Utilities
**Port Java test helpers:**
- Fixed UUID generators for deterministic tests
- Test data builders using builder pattern
- Database cleanup utilities
- Server lifecycle management helpers
- Custom assertions for CHEAP model objects

### 9.5 CI/CD Integration
- Run integration tests in GitHub Actions or similar
- Matrix testing across database backends
- Docker Compose for local integration testing
- Test result reporting and coverage

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

### REST API Specific Decisions
**Framework choice:**
- **Recommended: NestJS** for enterprise features, decorator-based API similar to Spring
- Alternative: Express + tsoa for lighter weight solution
- Decision should consider: team familiarity, scalability needs, OpenAPI requirements

**Authentication/Authorization:**
- Not implemented in initial Java version
- Design API to support future auth integration (headers, middleware)
- Consider JWT, OAuth2, or API keys for future implementation

**API Versioning:**
- Start with v1 routes (e.g., `/api/v1/catalogs`)
- Plan for future versioning strategy
- Consider header-based vs URL-based versioning

**Database Connection Management:**
- Connection pooling for production databases
- Graceful shutdown handling
- Health check integration for database status

**Deployment Considerations:**
- Docker containerization for cheap-rest service
- Environment-based configuration (12-factor app principles)
- Support for cloud deployment (AWS, Azure, GCP)
- Consider serverless vs traditional deployment

---

## Estimated Complexity

**Lines of Code:** ~15,000-20,000 LOC (estimated from 8 Java modules)

**Module Priority & Dependencies:**

**Tier 1 - Foundation (must complete first):**
1. **cheap-core** - Core interfaces and implementations, foundation for all modules
2. **cheap-json** - JSON serialization, needed for REST API and testing

**Tier 2 - Persistence (parallel development possible):**
3. **cheap-db-sqlite** - Simplest database, good for development/testing
4. **cheap-db-postgres** - Production-recommended database
5. **cheap-db-mariadb** - Alternative production database

**Tier 3 - API Layer (requires Tier 1 & 2):**
6. **cheap-rest** - REST API service (depends on core, json, and at least one db module)
7. **cheap-rest-client** - HTTP client library (depends on core and json)

**Tier 4 - Validation (requires all previous tiers):**
8. **integration-tests** - End-to-end testing (depends on all modules)

**Risk Areas:**

**High Risk:**
- **Reflection-based implementations** - Most complex aspect of cheap-core
- **Spring Boot → Node.js framework** - Architectural differences in dependency injection, lifecycle management
- **Async patterns** - Database operations async in Node.js vs synchronous JDBC in Java
- **WebFlux → HTTP client** - Reactive programming model differences

**Medium Risk:**
- **BigInteger/BigDecimal precision** - Requires careful library selection and testing
- **UUID generation performance** - May need optimization for bulk operations
- **Transaction management** - Different patterns between Spring and Node.js
- **Swagger/OpenAPI generation** - Different tooling in TypeScript ecosystem

**Low Risk:**
- **REST endpoint structure** - Direct port of HTTP routes
- **JSON serialization** - Well-supported in TypeScript
- **Error handling** - TypeScript has good exception support

**New Complexity Factors (from REST modules):**
- **Multi-database configuration** - Environment-based database selection
- **API versioning strategy** - May need versioned endpoints in future
- **Client-server integration** - Ensuring type safety across HTTP boundary
- **Docker containerization** - Deployment and testing infrastructure
- **Performance testing** - Baseline establishment and regression testing
- **Concurrency handling** - Thread safety → async/await safety patterns

**Estimated Timeline:**
- **Phase 1-2** (Core + JSON): 4-6 weeks
- **Phase 3-4** (Databases): 3-4 weeks
- **Phase 5** (Unit Tests): 2-3 weeks
- **Phase 6** (Documentation): 1-2 weeks
- **Phase 7** (REST API): 3-4 weeks
- **Phase 8** (REST Client): 2-3 weeks
- **Phase 9** (Integration Tests): 2-3 weeks

**Total estimated effort:** 17-25 weeks for full port

---

This plan provides a structured approach to porting the complete Cheap Java project (all 8 modules) to TypeScript while maintaining architectural integrity and leveraging TypeScript's strengths. The addition of the REST API, client library, and comprehensive integration testing significantly expands the scope but also provides a complete, production-ready system.
