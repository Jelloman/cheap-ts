# Test Implementation Plan for cheap-core

## Current Status (as of 2025-10-15)

### Test Framework
- **Framework**: Jest (v30.2.0)
- **Configuration**: `jest.config.js` with ESM support
- **Migration**: Switched from Vitest to Jest due to source map bugs in vite-node

### Test Results
- **Test Suites**: 12 passed
- **Total Tests**: 278 passed
- **Failures**: 0
- **Runtime**: ~715ms

### Implementation Progress
All core implementations for Property, Aspect, and CheapFactory are now complete and operational:
- ✅ **PropertyImpl** - Fully implemented with hash caching and validation
- ✅ **PropertyDefImpl** - Complete with all 9 boolean flags and type coercion
- ✅ **AspectBaseImpl** - Abstract base class for all aspect implementations
- ✅ **AspectObjectMapImpl** - Object-based property storage (memory efficient)
- ✅ **AspectPropertyMapImpl** - Property-based storage (type-safe)
- ✅ **AspectBuilderBase** - Abstract builder with fluent API
- ✅ **AspectObjectMapBuilder** - Concrete builder for ObjectMap aspects
- ✅ **AspectPropertyMapBuilder** - Concrete builder with strict validation
- ✅ **CheapFactory** - Factory with aspect creation, builder instantiation, and aspect definition methods

## Completed Test Suites

### 1. CheapHasher.test.ts (39 tests)
**Location**: `src/util/CheapHasher.test.ts`
**Coverage**: FNV-1a hash implementation for all supported types
- String, Number (Long/Double), Boolean, BigInt
- Date, URL, UUID, Uint8Array
- Instance methods, rolling hash, seed support
- Null handling, method chaining

### 2. PropertyImpl.test.ts
**Location**: `src/impl/PropertyImpl.test.ts`
**Coverage**: PropertyDef creation, validation, equals/hash
- Constructor with defaults and all parameters
- Builder pattern tests
- Default value handling
- Validation for null/type checking
- fullyEquals and hash consistency
- Name interning

### 3. PropertyValueAdapter.test.ts
**Location**: `src/util/PropertyValueAdapter.test.ts`
**Coverage**: Type coercion for all 13 PropertyTypes
- Integer, Float, Boolean, String, Text, CLOB
- BigInteger, BigDecimal
- DateTime, URI, UUID, BLOB
- Multivalued property coercion
- Nullable vs non-nullable handling
- Timezone support

### 4. AspectDefImpl.test.ts
**Location**: `src/impl/AspectDefImpl.test.ts`
**Coverage**: MutableAspectDefImpl functionality
- Constructor validation
- add/remove property operations
- Mutability flags (canAddProperties, canRemoveProperties)
- fullyEquals and hash methods
- Large property sets (1000 properties)
- Special character handling

### 5. AspectDefHash.test.ts (4 tests)
**Location**: `src/impl/AspectDefHash.test.ts`
**Coverage**: Hash consistency across implementations
- FullAspectDefImpl vs MutableAspectDefImpl
- FullAspectDefImpl vs ImmutableAspectDefImpl
- Different mutability flags produce different hashes
- Mutable vs Immutable hash differences

### 6. ImmutableAspectDefImpl.test.ts (24 tests)
**Location**: `src/impl/ImmutableAspectDefImpl.test.ts`
**Coverage**: Immutable aspect definition implementation
- Constructor with 2-param and 3-param overloads
- Immutability enforcement (add/remove throw errors)
- Property map defensive copying
- fullyEquals and hash methods
- Error message quality
- Large property sets

### 7. HashCaching.test.ts (7 tests)
**Location**: `src/impl/HashCaching.test.ts`
**Coverage**: Hash caching functionality for PropertyDef and AspectDef implementations
- PropertyDefImpl hash caching
- ImmutableAspectDefImpl hash caching
- MutableAspectDefImpl cache invalidation on add/remove
- FullAspectDefImpl cache invalidation on add/remove
- Hash value persistence across multiple calls
- Hash value changes after modifications

### 8. MultivaluedProperty.test.ts (23 tests)
**Location**: `src/impl/MultivaluedProperty.test.ts`
**Coverage**: Multivalued property functionality using CheapFactory
- Property creation with all PropertyTypes (String, Integer, Float, Boolean, etc.)
- Array validation for multivalued properties
- Type checking for array elements
- Null handling in arrays
- Property reading and type coercion
- PropertyDef validation with multivalued flag

### 9. AspectPropertyMapBuilder.test.ts (18 tests)
**Location**: `src/impl/AspectPropertyMapBuilder.test.ts`
**Coverage**: AspectPropertyMapBuilder implementation
- Builder pattern fluent interface
- Entity and AspectDef configuration
- Property addition with name-value pairs and Property objects
- Type validation and nullability checks
- AspectDef extensibility validation
- Builder reset and reuse
- Build validation (entity and aspectDef required)

### 10. AspectPropertyMapImpl.test.ts (18 tests)
**Location**: `src/impl/AspectPropertyMapImpl.test.ts`
**Coverage**: AspectPropertyMapImpl functionality
- contains() method for property presence checking
- unsafeReadObj() for direct property value access
- get() method with readability validation
- put() method with writability and extensibility checks
- unsafeAdd() for adding properties without validation
- unsafeWrite() for updating property values
- unsafeRemove() for removing properties
- PropertyDef conflict detection

### 11. AspectObjectMapBuilder.test.ts (11 tests)
**Location**: `src/impl/AspectObjectMapBuilder.test.ts`
**Coverage**: AspectObjectMapBuilder implementation
- Builder pattern with entity and aspectDef
- Property addition via name-value pairs and Property objects
- Build validation requirements
- Builder reset and reuse functionality
- Fluent interface method chaining

### 12. AspectObjectMapImpl.test.ts (8 tests)
**Location**: `src/impl/AspectObjectMapImpl.test.ts`
**Coverage**: AspectObjectMapImpl functionality
- contains() method for property checking
- readObj() for validated property value access
- unsafeReadObj() for direct access
- put() method for adding properties
- unsafeWrite() for updating property values
- unsafeRemove() for removing properties
- AspectDef validation integration

## Implementation Fixes Applied

### 1. PropertyType Static Initialization
**File**: `src/types.ts:15-16`
**Issue**: LOOKUP map was declared after static instances, causing "Cannot read properties of undefined"
**Fix**: Moved `LOOKUP` declaration before static PropertyType instances

### 2. PropertyDefImpl.fullyEquals()
**File**: `src/impl/PropertyImpl.ts:58-72`
**Issue**: No null check before accessing other's properties
**Fix**: Added `if (other == null) return false;` guard

### 3. PropertyDefImpl.validatePropertyValue()
**File**: `src/impl/PropertyImpl.ts:157-182`
**Issue**: `instanceof` doesn't work for primitive types (Number, String, Boolean, BigInt)
**Fix**: Use `typeof` checks for primitives, `instanceof` for objects (Date, URL, Uint8Array)

### 4. MutableAspectDefImpl Constructor
**File**: `src/impl/AspectDefImpl.ts:180-183`
**Issue**: `??` operator treated `null` same as `undefined`, preventing error on explicit null
**Fix**: Changed to `propertyDefs !== undefined ? (propertyDefs as Map) : new Map()`

### 5. ImmutableAspectDefImpl Enhancements
### 6. PropertyDefImpl Hash Caching
**File**: `src/impl/PropertyImpl.ts:10,76-121`
**Addition**: Added hash caching to PropertyDefImpl
- Added `_cachedHash` field initialized to 0n
- Modified `hash()` method to check cache and return cached value if available
- Matches caching behavior already present in AspectDefBase
**File**: `src/impl/AspectDefImpl.ts:152-205`
**Additions**:
- Constructor overload support (2-param with auto UUID, 3-param with explicit UUID)
- `add()` method that throws error with aspect name
- `remove()` method that throws error with aspect name

## CheapFactory Implementation Summary

The CheapFactory class has been successfully expanded with comprehensive factory methods:

### Aspect Definition Methods
- `createMutableAspectDef(name)` - Creates mutable aspect definitions
- `createMutableAspectDef(name, propertyDefs)` - With property map
- `createMutableAspectDef(name, aspectDefId, propertyDefs)` - With explicit UUID
- `createImmutableAspectDef(name, propertyDefs)` - Creates immutable aspect definitions
- `createImmutableAspectDef(name, aspectDefId, propertyDefs)` - With explicit UUID
- `createAspectDef(...)` - Convenience alias for createMutableAspectDef

### Aspect Creation Methods
- `createObjectMapAspect(entity, def)` - Creates aspect with object-based storage
- `createPropertyMapAspect(entity, def)` - Creates aspect with Property-based storage

### AspectBuilder Methods
- `createAspectBuilder()` - Creates builder instance of configured type
- `getAspectBuilderClass()` - Returns configured builder class

### Property Methods
- `createPropertyDef(name, type)` - Simple property definition
- `createPropertyDef(name, type, defaultValue, ...)` - Full configuration
- `createReadOnlyPropertyDef(name, type, isNullable, isRemovable)` - Read-only properties
- `createProperty(def, value)` - Creates property with value coercion

### Entity Methods
- `createEntity()` / `createEntity(globalId)` - Basic entity creation
- `createAndRegisterEntity()` - Creates and registers entity
- `getOrRegisterNewEntity(globalId)` - Gets existing or creates new

### Configuration
- `setTimeZone(timeZone)` / `getTimeZone()` - Timezone configuration
- `registerAspectDef(aspectDef)` / `getAspectDef(name)` - AspectDef registry
- `registerEntity(entity)` / `getEntity(id)` - Entity registry

## Pending Test Suites

### High Priority (Now Unblocked - Factory Available!)

These tests can now be implemented as the CheapFactory is operational:

### Medium Priority (Factory-dependent tests)

#### 8. MultivaluedPropertyTest ✅
**Source**: `cheap/cheap-core/src/test/java/net/netbeing/cheap/impl/basic/MultivaluedPropertyTest.java`
**Target**: `src/impl/MultivaluedProperty.test.ts`
**Requirements**: CheapFactory ✅, Property ✅, Aspect ✅ implementations
**Complexity**: Medium
**Tests Implemented**: 23
**Status**: ✅ **COMPLETE** - All tests passing

#### 9. AspectPropertyMapBuilderTest ✅
**Source**: `cheap/cheap-core/src/test/java/net/netbeing/cheap/impl/basic/AspectPropertyMapBuilderTest.java`
**Target**: `src/impl/AspectPropertyMapBuilder.test.ts`
**Requirements**: AspectPropertyMapBuilder ✅ implementation
**Complexity**: Medium
**Tests Implemented**: 18
**Status**: ✅ **COMPLETE** - All tests passing

#### 10. AspectPropertyMapImplTest ✅
**Source**: `cheap/cheap-core/src/test/java/net/netbeing/cheap/impl/basic/AspectPropertyMapImplTest.java`
**Target**: `src/impl/AspectPropertyMapImpl.test.ts`
**Requirements**: AspectPropertyMapImpl ✅ implementation
**Complexity**: Medium
**Tests Implemented**: 18
**Status**: ✅ **COMPLETE** - All tests passing

#### 11. AspectObjectMapBuilderTest ✅
**Source**: `cheap/cheap-core/src/test/java/net/netbeing/cheap/impl/basic/AspectObjectMapBuilderTest.java`
**Target**: `src/impl/AspectObjectMapBuilder.test.ts`
**Requirements**: AspectObjectMapBuilder ✅ implementation
**Complexity**: Medium
**Tests Implemented**: 11
**Status**: ✅ **COMPLETE** - All tests passing

#### 12. AspectObjectMapImplTest ✅
**Source**: `cheap/cheap-core/src/test/java/net/netbeing/cheap/impl/basic/AspectObjectMapImplTest.java`
**Target**: `src/impl/AspectObjectMapImpl.test.ts`
**Requirements**: AspectObjectMapImpl ✅ implementation
**Complexity**: Medium
**Tests Implemented**: 8
**Status**: ✅ **COMPLETE** - All tests passing

### Lower Priority (Complex Dependencies)

#### 13-16. Hierarchy Implementation Tests
**Sources**:
- `EntityListHierarchyImplTest.java`
- `EntitySetHierarchyImplTest.java`
- `EntityDirectoryHierarchyImplTest.java`
- `EntityTreeHierarchyImplTest.java`

**Requirements**: Full Entity, Hierarchy implementations
**Complexity**: High
**Estimated Tests**: 80-100 total
**Blockers**:
- Entity implementation
- Hierarchy base classes
- Catalog integration

#### 17. AspectMapHierarchyImplTest
**Source**: `cheap/cheap-core/src/test/java/net/netbeing/cheap/impl/basic/AspectMapHierarchyImplTest.java`
**Requirements**: AspectMapHierarchy, Entity, Aspect
**Complexity**: High
**Estimated Tests**: 25-30

#### 18. CheapFactoryTest
**Source**: `cheap/cheap-core/src/test/java/net/netbeing/cheap/util/CheapFactoryTest.java`
**Requirements**: Full CheapFactory implementation
**Complexity**: High
**Estimated Tests**: 40-50

#### 19. CatalogImplTest
**Source**: `cheap/cheap-core/src/test/java/net/netbeing/cheap/impl/basic/CatalogImplTest.java`
**Requirements**: Catalog, Entity, Aspect, Hierarchy implementations
**Complexity**: Very High
**Estimated Tests**: 50-60

#### 20. HierarchyDefImplTest
**Source**: `cheap/cheap-core/src/test/java/net/netbeing/cheap/impl/basic/HierarchyDefImplTest.java`
**Requirements**: HierarchyDef implementation
**Complexity**: Medium
**Estimated Tests**: 15-20

## Test Patterns Established

### Import Pattern
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { ImplementationClass } from './ImplementationFile.js';
import { PropertyType } from '../types.js';
```

### Type Mappings (Java → TypeScript)
- `Long` → `number`
- `Double` → `number`
- `BigInteger` → `bigint`
- `BigDecimal` → `string` (for precision)
- `ZonedDateTime` → `Date`
- `URI` → `URL`
- `UUID` → `string` (use `crypto.randomUUID()`)
- `List<T>` → `T[]` or `ReadonlyArray<T>`
- `Map<K,V>` → `Map<K,V>`
- `ImmutableList.of(...)` → `[...]` (array literal)
- `ImmutableMap.of(...)` → `new Map([...])`

### Assertion Mappings (JUnit → Jest)
- `assertEquals(expected, actual)` → `expect(actual).toBe(expected)`
- `assertTrue(condition)` → `expect(condition).toBe(true)`
- `assertFalse(condition)` → `expect(condition).toBe(false)`
- `assertNull(value)` → `expect(value).toBeNull()`
- `assertNotNull(value)` → `expect(value).not.toBeNull()`
- `assertSame(expected, actual)` → `expect(actual).toBe(expected)` (reference equality)
- `assertThrows(Exception.class, () -> ...)` → `expect(() => ...).toThrow()`
- `assertDoesNotThrow(() -> ...)` → `expect(() => ...).not.toThrow()`
- `assertInstanceOf(Type.class, value)` → `expect(value).toBeInstanceOf(Type)`

### Test Structure
```typescript
describe('ClassName', () => {
  let sharedVariable: Type;

  beforeEach(() => {
    // Setup code
  });

  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = createInput();

      // Act
      const result = methodUnderTest(input);

      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

## Next Steps

### Recently Completed
1. ✅ **MultivaluedPropertyTest** - 23 tests passing
2. ✅ **AspectPropertyMapBuilderTest** - 18 tests passing
3. ✅ **AspectPropertyMapImplTest** - 18 tests passing
4. ✅ **AspectObjectMapBuilderTest** - 11 tests passing
5. ✅ **AspectObjectMapImplTest** - 8 tests passing

### Short-term (After test implementations)
1. ✅ CheapFactory basics implemented - createPropertyDef ✅, createProperty ✅, createEntity ✅, createAspect* ✅
2. Review test coverage and identify gaps
3. Implement remaining Aspect safe read/write methods if needed
4. Add comprehensive integration tests for Factory → Builder → Aspect workflows

### Long-term (Requires major implementations)
1. Complete Entity implementation
2. Complete Hierarchy implementations (5 types)
3. Complete Catalog implementation
4. Port all hierarchy tests
5. Port factory and catalog tests

## Known Issues and Considerations

### Jest Configuration
- Using ESM preset: `ts-jest/presets/default-esm`
- Module name mapping required: `'^(\\.{1,2}/.*)\\.js$': '$1'`
- Transform with useESM: true
- Source maps disabled in esbuild to avoid compilation issues

### Test File Naming
- Pattern: `*.test.ts` or `*.spec.ts`
- Location: Co-located with implementation files in `src/`
- Included in coverage: All `src/**/*.ts` except test files and index.ts

### Coverage Goals
- **Current Coverage**: ~30% (core utilities and property/aspect definitions)
- **Target Coverage**: >80% for all implemented modules
- **Priority Coverage Areas**:
  1. Property and Aspect definitions (Done ✓)
  2. Type coercion and validation (Done ✓)
  3. Hash computation (Done ✓)
  4. Factory methods (Pending)
  5. Entity operations (Pending)
  6. Hierarchy operations (Pending)
  7. Catalog operations (Pending)

## Running Tests

### All Tests
```bash
cd packages/cheap-core
npm test
```

### Specific Test File
```bash
npm test -- PropertyImpl.test.ts
```

### Watch Mode
```bash
npm test -- --watch
```

### With Coverage
```bash
npm test -- --coverage
```

## Test File Location Map

| Java Test | TypeScript Test | Status |
|-----------|----------------|--------|
| CheapHasherTest.java | src/util/CheapHasher.test.ts | ✅ Complete |
| PropertyDefImplTest.java | src/impl/PropertyImpl.test.ts | ✅ Complete |
| PropertyValueAdapterTest.java | src/util/PropertyValueAdapter.test.ts | ✅ Complete |
| MutableAspectDefImplTest.java | src/impl/AspectDefImpl.test.ts | ✅ Complete |
| AspectDefHashTest.java | src/impl/AspectDefHash.test.ts | ✅ Complete |
| ImmutableAspectDefImplTest.java | src/impl/ImmutableAspectDefImpl.test.ts | ✅ Complete |
| HashCachingTest.java | src/impl/HashCaching.test.ts | ✅ Complete |
| MultivaluedPropertyTest.java | src/impl/MultivaluedProperty.test.ts | ✅ Complete (23 tests) |
| AspectPropertyMapBuilderTest.java | src/impl/AspectPropertyMapBuilder.test.ts | ✅ Complete (18 tests) |
| AspectPropertyMapImplTest.java | src/impl/AspectPropertyMapImpl.test.ts | ✅ Complete (18 tests) |
| AspectObjectMapBuilderTest.java | src/impl/AspectObjectMapBuilder.test.ts | ✅ Complete (11 tests) |
| AspectObjectMapImplTest.java | src/impl/AspectObjectMapImpl.test.ts | ✅ Complete (8 tests) |
| EntityListHierarchyImplTest.java | - | 🔒 Blocked (needs Entity/Hierarchy) |
| EntitySetHierarchyImplTest.java | - | 🔒 Blocked (needs Entity/Hierarchy) |
| EntityDirectoryHierarchyImplTest.java | - | 🔒 Blocked (needs Entity/Hierarchy) |
| EntityTreeHierarchyImplTest.java | - | 🔒 Blocked (needs Entity/Hierarchy) |
| AspectMapHierarchyImplTest.java | - | 🔒 Blocked (needs AspectMap) |
| CheapFactoryTest.java | - | 🔒 Blocked (needs Factory) |
| CatalogImplTest.java | - | 🔒 Blocked (needs Catalog) |
| HierarchyDefImplTest.java | - | 🔒 Blocked (needs HierarchyDef) |

## Success Metrics

### Current Achievement
- ✅ Test infrastructure fully functional (Jest with ESM)
- ✅ 278 tests passing with 0 failures
- ✅ Core property system fully tested (including multivalued properties)
- ✅ Core aspect definition system fully tested
- ✅ Type coercion system fully tested
- ✅ Hash computation system fully tested
- ✅ Aspect builders fully tested (both ObjectMap and PropertyMap variants)
- ✅ Aspect implementations fully tested (both ObjectMap and PropertyMap variants)
- ✅ CheapFactory integration with Property and Aspect systems validated

### Targets
- ✅ 250+ tests passing - **ACHIEVED** (278 tests)
- 🎯 400+ tests passing (requires Entity/Hierarchy implementations)
- 🎯 500+ tests passing (requires Catalog implementation)
- 🎯 >80% code coverage on all implemented modules
- ✅ <1 second test execution time for fast feedback - **ACHIEVED** (currently 715ms)

## Notes

- All test files use `.js` extensions in imports (TypeScript ESM requirement)
- Using `crypto.randomUUID()` for UUID generation (Node.js 14.17+ built-in)
- Maps preserve insertion order in JavaScript (different from Java HashMap)
- Arrays are reference types, use `toBe()` for same reference, `toEqual()` for deep equality
- BigInt literals use `n` suffix: `42n`, `0xABCDEFn`
- Date comparisons use `getTime()` for timestamp equality
