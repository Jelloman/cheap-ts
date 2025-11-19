# Integration Tests

End-to-end integration tests for the CHEAP TypeScript project. These tests validate the complete system by interacting with the REST API through the REST client.

## Architecture

- **Tests interact ONLY with `cheap-rest-client`** - Never direct database access
- **`cheap-rest` server runs as a separate process** - Started/stopped by test infrastructure
- **Tests run in local Node.js process** - All verification through REST API responses

## Test Organization

```
src/
├── setup/               # Test infrastructure (server lifecycle)
├── fixtures/            # Test data fixtures
└── tests/
    ├── catalog/         # Catalog operation tests
    ├── aspect/          # Aspect and AspectDef operation tests
    ├── hierarchy/       # Hierarchy operation tests
    ├── cross-db/        # Cross-database consistency and workflows
    └── performance/     # Performance baseline tests
```

## Running Tests

### Prerequisites

1. Build the `cheap-rest` server:
   ```bash
   cd ../cheap-rest
   npm install
   npm run build
   ```

2. Install integration test dependencies:
   ```bash
   npm install
   ```

### Run with SQLite (in-memory)

```bash
npm run test:sqlite
```

SQLite is the default and requires no additional setup.

### Run with PostgreSQL

1. Start PostgreSQL server (or use Docker):
   ```bash
   docker run -d --name postgres-test \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=cheap_test \
     -p 5432:5432 \
     postgres:latest
   ```

2. Set environment variables and run tests:
   ```bash
   export POSTGRES_HOST=localhost
   export POSTGRES_PORT=5432
   export POSTGRES_DB=cheap_test
   export POSTGRES_USER=postgres
   export POSTGRES_PASSWORD=postgres
   npm run test:postgres
   ```

### Run with MariaDB

1. Start MariaDB server (or use Docker):
   ```bash
   docker run -d --name mariadb-test \
     -e MYSQL_ROOT_PASSWORD=password \
     -e MYSQL_DATABASE=cheap_test \
     -p 3306:3306 \
     mariadb:latest
   ```

2. Set environment variables and run tests:
   ```bash
   export MARIADB_HOST=localhost
   export MARIADB_PORT=3306
   export MARIADB_DB=cheap_test
   export MARIADB_USER=root
   export MARIADB_PASSWORD=password
   npm run test:mariadb
   ```

### Run Against All Databases

```bash
npm run test:all-dbs
```

This runs the test suite three times, once for each database backend.

## Test Categories

### Catalog Operations
- Create, retrieve, list, delete catalogs
- Catalog definitions with hierarchies
- Upstream catalog references
- Pagination

### AspectDef Operations
- Create aspect definitions
- Retrieve by ID and by name
- List with pagination
- Property defaults and validation

### Aspect Operations
- Upsert aspects (create and update)
- Query aspects with filters
- Pagination
- Bulk operations

### Hierarchy Operations
- **Entity List:** Add/remove entity IDs, pagination
- **Entity Set:** Add/remove entity IDs, duplicate handling
- **Entity Directory:** Add/remove entries by name or entity ID
- **Entity Tree:** Add/remove nodes by path
- **Aspect Map:** Query aspects in map structure

### Complex Workflows
- Multi-aspect entities
- Complete person management workflow
- Catalog upstream/downstream relationships
- Combined hierarchy operations

### Performance Baselines
- Bulk aspect upsert (1000+ entities)
- Large dataset queries
- Paginated query performance
- Hierarchy operations with 100+ entities
- Directory operations with 100+ entries
- Concurrent operations (50+ parallel requests)

## Test Output

Performance tests output timing information to the console:

```
Bulk Aspect Upsert Performance:
  Total: 1000 aspects in 45230ms
  Average: 45.23ms per aspect
  Throughput: 22.11 aspects/sec
```

## Configuration

Test server configuration is in `src/setup/jest.setup.ts`:
- **Port:** 3456 (to avoid conflicts with development server)
- **Timeout:** 30 seconds (for long-running integration tests)
- **Database:** Configured via `CHEAP_DB_TYPE` environment variable

## Troubleshooting

### Server fails to start

Check that:
1. The `cheap-rest` package is built (`npm run build` in `packages/cheap-rest`)
2. Port 3456 is not in use
3. Database is running and accessible (for PostgreSQL/MariaDB)

### Tests hang or timeout

- Increase `testTimeout` in `jest.config.js`
- Check server logs for errors
- Verify database connectivity

### Database connection errors

- Verify database is running
- Check environment variables are set correctly
- Ensure database user has appropriate permissions

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run integration tests
  run: |
    npm run test:sqlite
  env:
    NODE_ENV: test
```

For database-backed tests in CI, use Docker Compose or service containers to provide PostgreSQL/MariaDB instances.
