/**
 * Core type definitions and enums for the CHEAP model
 */

/**
 * Defines the supported data types for properties in the Cheap model.
 * Each property type specifies storage characteristics, validation rules,
 * and the corresponding TypeScript type used for value representation.
 *
 * Property types range from basic primitives to complex streaming types,
 * providing comprehensive data storage capabilities while maintaining
 * type safety and efficient serialization.
 */
export class PropertyType {
  // Initialize LOOKUP before static instances to avoid undefined errors
  private static readonly LOOKUP = new Map<string, PropertyType>();

  /**
   * 64-bit signed integer values. Uses JavaScript number for representation
   * to ensure full range support and consistency across platforms.
   */
  static readonly Integer = new PropertyType('INT', 'Integer', Number);

  /**
   * 64-bit floating-point values (double precision). Provides standard
   * IEEE 754 double-precision floating-point arithmetic.
   */
  static readonly Float = new PropertyType('FLT', 'Float', Number);

  /**
   * Boolean values supporting true, false, or null states. The null state
   * allows for three-valued logic in data storage and queries.
   */
  static readonly Boolean = new PropertyType('BLN', 'Boolean', Boolean);

  /**
   * String values with length limited to 8192 characters, processed atomically.
   * Suitable for short text fields, identifiers, and labels where size
   * limits ensure efficient storage and retrieval.
   */
  static readonly String = new PropertyType('STR', 'String', String);

  /**
   * Text values with unlimited length, processed atomically. Suitable for
   * large text content, documents, and descriptions where size flexibility
   * is more important than storage efficiency.
   */
  static readonly Text = new PropertyType('TXT', 'Text', String);

  /**
   * Arbitrary precision integer values with unlimited size. Stored as
   * strings or BigInt to avoid platform-specific size limitations and ensure
   * exact precision for mathematical operations.
   */
  static readonly BigInteger = new PropertyType('BGI', 'BigInteger', BigInt);

  /**
   * Arbitrary precision floating-point values with unlimited size. Stored
   * as strings to avoid platform-specific size limitations and ensure
   * exact precision for mathematical operations.
   */
  static readonly BigDecimal = new PropertyType('BGF', 'BigDecimal', String);

  /**
   * Date and time values stored as ISO-8601 formatted strings. This ensures
   * timezone information is preserved and provides human-readable storage
   * with standardized parsing support.
   */
  static readonly DateTime = new PropertyType('DAT', 'DateTime', Date);

  /**
   * Uniform Resource Identifier values following RFC 3986 specification.
   * Stored as strings with application-level conversion to/from URL objects
   * to maintain flexibility in handling various URI schemes.
   */
  static readonly URI = new PropertyType('URI', 'URI', URL);

  /**
   * Universally Unique Identifier values following RFC 4122 specification.
   * Stored as strings with application-level conversion to/from UUID objects
   * to ensure consistent representation across different systems.
   */
  static readonly UUID = new PropertyType('UID', 'UUID', String);

  /**
   * Character Large Object (CLOB) for streaming text data. Represented by
   * a String.
   */
  static readonly CLOB = new PropertyType('CLB', 'CLOB', String);

  /**
   * Binary Large Object (BLOB) for streaming binary data. Represented by
   * a Uint8Array.
   */
  static readonly BLOB = new PropertyType('BLB', 'BLOB', Uint8Array);

  private constructor(
    private readonly _typeCode: string,
    private readonly _name: string,
    private readonly _jsType: (new (...args: any[]) => any) | ((...args: any[]) => any)
  ) {
    PropertyType.LOOKUP.set(_typeCode.toUpperCase(), this);
  }

  /**
   * Returns the short string code that identifies this property type.
   * These codes are used for serialization, storage, and compact representation.
   *
   * @returns the three-character type code for this property type, never null
   */
  typeCode(): string {
    return this._typeCode;
  }

  /**
   * Returns the JavaScript constructor/type used to represent values of this property type.
   * This type is used for type checking and serialization operations.
   *
   * @returns the JavaScript type that represents this property type's values, never null
   */
  getJsType(): (new (...args: any[]) => any) | ((...args: any[]) => any) {
    return this._jsType;
  }

  /**
   * Returns the name of this property type.
   *
   * @returns the name of this property type, never null
   */
  name(): string {
    return this._name;
  }

  /**
   * Convert a type code string to a PropertyType.
   *
   * @param typeCode a 3-letter string code
   * @returns the corresponding PropertyType, or undefined if not found
   */
  static fromTypeCode(typeCode: string): PropertyType | undefined {
    return PropertyType.LOOKUP.get(typeCode.toUpperCase());
  }

  toString(): string {
    return this._typeCode;
  }
}

/**
 * Defines the different types of hierarchies supported in the Cheap data model.
 * Each hierarchy type serves a specific organizational purpose and has unique
 * characteristics for storing and accessing entities.
 *
 * The hierarchy types follow the Cheap model's flexible approach to data organization,
 * allowing entities to be structured in various ways depending on the use case.
 */
export enum HierarchyType {
  /**
   * An ordered list containing only entity IDs. This hierarchy type maintains
   * sequence and allows duplicate references to the same entity.
   */
  ENTITY_LIST = 'EL',

  /**
   * A possibly-ordered set containing only unique entity IDs. This hierarchy type
   * ensures no duplicate entity references and provides efficient membership testing.
   */
  ENTITY_SET = 'ES',

  /**
   * A string-to-entity ID mapping, providing named access to entities.
   * This hierarchy type enables dictionary-like lookups of entities by string keys.
   */
  ENTITY_DIR = 'ED',

  /**
   * A tree structure with named nodes where leaves contain entity IDs.
   * This hierarchy type supports hierarchical organization with path-based navigation.
   */
  ENTITY_TREE = 'ET',

  /**
   * A possibly-ordered map of entity IDs to aspects of a single type.
   * This hierarchy type provides efficient access to all entities having a specific aspect.
   */
  ASPECT_MAP = 'AM',
}

/**
 * Helper function to get HierarchyType from type code
 */
export function hierarchyTypeFromCode(typeCode: string): HierarchyType | undefined {
  const code = typeCode.toUpperCase();
  switch (code) {
    case 'EL':
      return HierarchyType.ENTITY_LIST;
    case 'ES':
      return HierarchyType.ENTITY_SET;
    case 'ED':
      return HierarchyType.ENTITY_DIR;
    case 'ET':
      return HierarchyType.ENTITY_TREE;
    case 'AM':
      return HierarchyType.ASPECT_MAP;
    default:
      return undefined;
  }
}

/**
 * Helper function to get type code from HierarchyType
 */
export function hierarchyTypeToCode(type: HierarchyType): string {
  return type;
}

/**
 * A Species is the fundamental type of a catalog in the Cheap data model.
 * The species determines the data source relationship and caching behavior
 * of the catalog within the overall system architecture.
 *
 * All catalogs in Cheap are caches or working copies, but they differ in
 * their relationship to upstream data sources and their write-through behavior.
 */
export enum CatalogSpecies {
  /**
   * A Source catalog represents a read-only cache of an external data source.
   */
  SOURCE = 'SOURCE',

  /**
   * A Sink catalog represents a read-write working copy of an external data source.
   */
  SINK = 'SINK',

  /**
   * A Mirror catalog provides a cached read-only view of another catalog.
   */
  MIRROR = 'MIRROR',

  /**
   * A Cache catalog provides a write-through view of another catalog.
   * (Writes may be buffered.)
   */
  CACHE = 'CACHE',

  /**
   * A Clone catalog is a working copy of another catalog. Reads and writes to and from
   * the upstream catalog are manually invoked.
   */
  CLONE = 'CLONE',

  /**
   * A Fork catalog is a transient copy of another catalog, severed from the original.
   * Forks should usually be converted into a Sink, i.e., a permanent copy, AKA "Save As".
   */
  FORK = 'FORK',
}

/**
 * Enumeration of the different types of LocalEntity implementations available
 * in the Cheap system. Each type corresponds to a specific implementation class
 * with different performance characteristics and catalog management strategies.
 *
 * This enum is used to configure factory methods to create the appropriate
 * type of LocalEntity based on application needs.
 */
export enum LocalEntityType {
  /**
   * Basic single-catalog entity implementation.
   * Corresponds to LocalEntityOneCatalogImpl.
   *
   * This is the simplest implementation for entities that belong to a single catalog.
   * It provides basic functionality without caching or multi-catalog support.
   */
  SINGLE_CATALOG = 'SINGLE_CATALOG',

  /**
   * Multi-catalog entity implementation.
   * Corresponds to LocalEntityMultiCatalogImpl.
   *
   * This implementation allows entities to belong to multiple catalogs simultaneously.
   * It maintains a set of catalogs and can search across all of them for aspects.
   */
  MULTI_CATALOG = 'MULTI_CATALOG',

  /**
   * Caching single-catalog entity implementation.
   * Corresponds to CachingEntityOneCatalogImpl.
   *
   * This implementation extends the single-catalog functionality with aspect caching
   * for improved performance when aspects are frequently accessed.
   */
  CACHING_SINGLE_CATALOG = 'CACHING_SINGLE_CATALOG',

  /**
   * Caching multi-catalog entity implementation.
   * Corresponds to CachingEntityMultiCatalogImpl.
   *
   * This implementation combines multi-catalog support with aspect caching,
   * providing the most feature-rich LocalEntity implementation.
   */
  CACHING_MULTI_CATALOG = 'CACHING_MULTI_CATALOG',
}
