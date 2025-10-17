/**
 * Hierarchy implementation classes
 */

import {
  EntityListHierarchy,
  EntitySetHierarchy,
  EntityDirectoryHierarchy,
  EntityTreeHierarchy,
  EntityTreeNode,
  AspectMapHierarchy,
} from "../interfaces/Hierarchy.js";
import { Entity } from "../interfaces/Entity.js";
import { Aspect, AspectDef } from "../interfaces/Aspect.js";
import { Catalog } from "../interfaces/Catalog.js";
import { HierarchyType } from "../types.js";

/**
 * Basic implementation of an EntityListHierarchy using an Array.
 * This hierarchy type represents an ordered list of entities that may contain
 * duplicates, corresponding to the ENTITY_LIST (EL) hierarchy type in Cheap.
 */
export class EntityListHierarchyImpl extends Array<Entity> implements EntityListHierarchy {
  /** The catalog containing this hierarchy. */
  private readonly _catalog: Catalog;

  /** The name of this hierarchy in the catalog. */
  private readonly _name: string;

  /** The version number of this hierarchy. */
  private readonly _version: number;

  /**
   * Creates a new EntityListHierarchyImpl with the specified hierarchy definition.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   */
  constructor(catalog: Catalog, name: string);
  /**
   * Creates a new EntityListHierarchyImpl with the specified hierarchy definition and
   * initial capacity.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   * @param initialCapacity initial capacity of list
   */
  constructor(catalog: Catalog, name: string, initialCapacity: number);
  /**
   * Creates a new EntityListHierarchyImpl with the specified hierarchy definition and version.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   * @param version the version number of this hierarchy
   */
  constructor(catalog: Catalog, name: string, version: number);
  /**
   * Creates a new EntityListHierarchyImpl with the specified hierarchy definition,
   * initial capacity, and version.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   * @param initialCapacity initial capacity of list
   * @param version the version number of this hierarchy
   */
  constructor(catalog: Catalog, name: string, initialCapacity: number, version: number);
  constructor(catalog: Catalog, name: string, capacityOrVersion?: number, version?: number) {
    if (version !== undefined) {
      // 4-arg constructor: catalog, name, initialCapacity, version
      super(capacityOrVersion!);
      this._catalog = catalog;
      this._name = name;
      this._version = version;
    } else if (capacityOrVersion !== undefined && (capacityOrVersion > 1000 || capacityOrVersion === 0)) {
      // 3-arg constructor with capacity: catalog, name, initialCapacity
      super(capacityOrVersion!);
      this._catalog = catalog;
      this._name = name;
      this._version = 0;
    } else if (capacityOrVersion !== undefined) {
      // 3-arg constructor with version: catalog, name, version
      super();
      this._catalog = catalog;
      this._name = name;
      this._version = capacityOrVersion;
    } else {
      // 2-arg constructor: catalog, name
      super();
      this._catalog = catalog;
      this._name = name;
      this._version = 0;
    }
    catalog.addHierarchy(this);
  }

  /**
   * Returns the Catalog that owns this hierarchy.
   */
  catalog(): Catalog {
    return this._catalog;
  }

  /**
   * Returns the name of this hierarchy in the catalog.
   */
  name(): string {
    return this._name;
  }

  /**
   * Returns the type of this hierarchy.
   */
  type(): HierarchyType {
    return HierarchyType.ENTITY_LIST;
  }

  /**
   * Returns the version number of this hierarchy.
   */
  version(): number {
    return this._version;
  }
}

/**
 * Basic implementation of an EntitySetHierarchy using a Set.
 * This hierarchy type represents a non-ordered collection of unique entities
 * corresponding to the ENTITY_SET (ES) hierarchy type in Cheap.
 */
export class EntitySetHierarchyImpl extends Set<Entity> implements EntitySetHierarchy {
  /** The catalog containing this hierarchy. */
  private readonly _catalog: Catalog;

  /** The name of this hierarchy in the catalog. */
  private readonly _name: string;

  /** The version number of this hierarchy. */
  private readonly _version: number;

  /**
   * Creates a new EntitySetHierarchyImpl with the specified hierarchy definition.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   */
  constructor(catalog: Catalog, name: string);
  /**
   * Creates a new EntitySetHierarchyImpl with the specified hierarchy definition and version.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   * @param version the version number of this hierarchy
   */
  constructor(catalog: Catalog, name: string, version: number);
  /**
   * Creates a new EntitySetHierarchyImpl with the specified hierarchy definition and
   * initial entities.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   * @param initialEntities initial entities to add
   */
  constructor(catalog: Catalog, name: string, initialEntities: Iterable<Entity>);
  /**
   * Creates a new EntitySetHierarchyImpl with the specified hierarchy definition,
   * initial entities, and version.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   * @param initialEntities initial entities to add
   * @param version the version number of this hierarchy
   */
  constructor(catalog: Catalog, name: string, initialEntities: Iterable<Entity>, version: number);
  constructor(catalog: Catalog, name: string, versionOrEntities?: number | Iterable<Entity>, version?: number) {
    if (versionOrEntities !== undefined && typeof versionOrEntities === "object") {
      // Iterable of entities provided
      super(versionOrEntities);
      this._catalog = catalog;
      this._name = name;
      this._version = version ?? 0;
    } else {
      // No entities or just version
      super();
      this._catalog = catalog;
      this._name = name;
      this._version = (versionOrEntities as number) ?? 0;
    }
    catalog.addHierarchy(this);
  }

  /**
   * Returns the Catalog that owns this hierarchy.
   */
  catalog(): Catalog {
    return this._catalog;
  }

  /**
   * Returns the name of this hierarchy in the catalog.
   */
  name(): string {
    return this._name;
  }

  /**
   * Returns the type of this hierarchy.
   */
  type(): HierarchyType {
    return HierarchyType.ENTITY_SET;
  }

  /**
   * Returns the version number of this hierarchy.
   */
  version(): number {
    return this._version;
  }
}

/**
 * Basic implementation of an EntityDirectoryHierarchy using a Map.
 * This hierarchy type represents a string-to-entity mapping, corresponding
 * to the ENTITY_DIR (ED) hierarchy type in Cheap.
 */
export class EntityDirectoryHierarchyImpl extends Map<string, Entity> implements EntityDirectoryHierarchy {
  /** The catalog containing this hierarchy. */
  private readonly _catalog: Catalog;

  /** The name of this hierarchy in the catalog. */
  private readonly _name: string;

  /** The version number of this hierarchy. */
  private readonly _version: number;

  /**
   * Creates a new EntityDirectoryHierarchyImpl with the specified hierarchy definition.
   *
   * @param catalog the owning catalog
   * @param name the name of this hierarchy in the catalog
   */
  constructor(catalog: Catalog, name: string);
  /**
   * Creates a new EntityDirectoryHierarchyImpl with the specified hierarchy definition and version.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   * @param version the version number of this hierarchy
   */
  constructor(catalog: Catalog, name: string, version: number);
  /**
   * Creates a new EntityDirectoryHierarchyImpl with the specified hierarchy definition and
   * initial entries.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   * @param initialEntries initial string-entity mappings
   */
  constructor(catalog: Catalog, name: string, initialEntries: Iterable<readonly [string, Entity]>);
  /**
   * Creates a new EntityDirectoryHierarchyImpl with the specified hierarchy definition,
   * initial entries, and version.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   * @param initialEntries initial string-entity mappings
   * @param version the version number of this hierarchy
   */
  constructor(catalog: Catalog, name: string, initialEntries: Iterable<readonly [string, Entity]>, version: number);
  constructor(
    catalog: Catalog,
    name: string,
    versionOrEntries?: number | Iterable<readonly [string, Entity]>,
    version?: number,
  ) {
    if (versionOrEntries !== undefined && typeof versionOrEntries === "object") {
      // Iterable of entries provided
      super(versionOrEntries);
      this._catalog = catalog;
      this._name = name;
      this._version = version ?? 0;
    } else {
      // No entries or just version
      super();
      this._catalog = catalog;
      this._name = name;
      this._version = (versionOrEntries as number) ?? 0;
    }
    catalog.addHierarchy(this);
  }

  /**
   * Returns the Catalog that owns this hierarchy.
   */
  catalog(): Catalog {
    return this._catalog;
  }

  /**
   * Returns the name of this hierarchy in the catalog.
   */
  name(): string {
    return this._name;
  }

  /**
   * Returns the type of this hierarchy.
   */
  type(): HierarchyType {
    return HierarchyType.ENTITY_DIR;
  }

  /**
   * Returns the version number of this hierarchy.
   */
  version(): number {
    return this._version;
  }
}

/**
 * Implementation of a tree node that can have child nodes.
 * This node type extends Map to provide string-to-node mappings.
 */
export class EntityTreeNodeImpl extends Map<string, EntityTreeNode> implements EntityTreeNode {
  /** The entity value stored at this node. */
  private _value: Entity | null;

  /** The parent node, or null for root nodes. */
  private readonly _parent: EntityTreeNode | null;

  /**
   * Creates a new NodeImpl with the specified entity value and no parent.
   *
   * @param value the entity value to store at this node
   */
  constructor(value: Entity | null);
  /**
   * Creates a new NodeImpl with the specified entity value and parent.
   *
   * @param value the entity value to store at this node
   * @param parent the parent node, or null for root nodes
   */
  constructor(value: Entity | null, parent: EntityTreeNode | null);
  constructor(value: Entity | null, parent?: EntityTreeNode | null) {
    super();
    this._value = value;
    this._parent = parent ?? null;
  }

  /**
   * Returns whether this node is a leaf node.
   */
  isLeaf(): boolean {
    return this.size === 0;
  }

  /**
   * Returns the parent node of this node.
   */
  getParent(): EntityTreeNode | null {
    return this._parent;
  }

  /**
   * Returns the entity value stored at this node.
   */
  value(): Entity | null {
    return this._value;
  }

  /**
   * Sets the entity value stored at this node.
   */
  setValue(entity: Entity | null): void {
    this._value = entity;
  }
}

/**
 * Implementation of a leaf tree node that cannot have child nodes.
 */
export class EntityTreeLeafNodeImpl implements EntityTreeNode {
  /** The entity value stored at this leaf node. */
  private _value: Entity | null;

  /** The parent node, or null for root leaf nodes. */
  private readonly _parent: EntityTreeNode | null;

  /**
   * Creates a new LeafNodeImpl with the specified entity value and no parent.
   *
   * @param value the entity value to store at this leaf node
   */
  constructor(value: Entity | null);
  /**
   * Creates a new LeafNodeImpl with the specified entity value and parent.
   *
   * @param value the entity value to store at this leaf node
   * @param parent the parent node, or null for root leaf nodes
   */
  constructor(value: Entity | null, parent: EntityTreeNode | null);
  constructor(value: Entity | null, parent?: EntityTreeNode | null) {
    this._value = value;
    this._parent = parent ?? null;
  }

  /**
   * Returns whether this node is a leaf node.
   */
  isLeaf(): boolean {
    return true;
  }

  /**
   * Returns the parent node of this leaf node.
   */
  getParent(): EntityTreeNode | null {
    return this._parent;
  }

  /**
   * Returns the entity value stored at this leaf node.
   */
  value(): Entity | null {
    return this._value;
  }

  /**
   * Sets the entity value stored at this leaf node.
   */
  setValue(entity: Entity | null): void {
    this._value = entity;
  }

  // Map interface implementation for leaf nodes (empty)
  clear(): void {}
  delete(_key: string): boolean {
    return false;
  }
  forEach(
    _callbackfn: (value: EntityTreeNode, key: string, map: Map<string, EntityTreeNode>) => void,
    _thisArg?: unknown,
  ): void {}
  get(_key: string): EntityTreeNode | undefined {
    return undefined;
  }
  has(_key: string): boolean {
    return false;
  }
  set(_key: string, _value: EntityTreeNode): this {
    throw new Error("Cannot add children to a leaf node");
  }
  get size(): number {
    return 0;
  }
  entries(): MapIterator<[string, EntityTreeNode]> {
    return new Map<string, EntityTreeNode>().entries();
  }
  keys(): MapIterator<string> {
    return new Map<string, EntityTreeNode>().keys();
  }
  values(): MapIterator<EntityTreeNode> {
    return new Map<string, EntityTreeNode>().values();
  }
  [Symbol.iterator](): MapIterator<[string, EntityTreeNode]> {
    return new Map<string, EntityTreeNode>().entries();
  }
  [Symbol.toStringTag] = "EntityTreeLeafNode";
}

/**
 * Basic implementation of an EntityTreeHierarchy that represents a tree structure
 * with string-to-entity or string-to-node mappings, corresponding to the
 * ENTITY_TREE (ET) hierarchy type in Cheap.
 *
 * This implementation provides both regular nodes (which can have children) and
 * leaf nodes (which cannot have children) to build tree structures.
 */
export class EntityTreeHierarchyImpl implements EntityTreeHierarchy {
  /** The catalog containing this hierarchy. */
  private readonly _catalog: Catalog;

  /** The name of this hierarchy in the catalog. */
  private readonly _name: string;

  /** The version number of this hierarchy. */
  private readonly _version: number;

  /** The root node of this tree hierarchy. */
  private _root: EntityTreeNode;

  /**
   * Creates a new EntityTreeHierarchyImpl with the specified hierarchy definition and a root with a null entity.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   */
  constructor(catalog: Catalog, name: string);
  /**
   * Creates a new EntityTreeHierarchyImpl with the specified hierarchy definition and root entity.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   * @param rootEntity the entity to use as the root of the tree
   */
  constructor(catalog: Catalog, name: string, rootEntity: Entity | null);
  /**
   * Creates a new EntityTreeHierarchyImpl with the specified hierarchy definition and root node.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   * @param rootNode the node to use as the root of the tree
   */
  constructor(catalog: Catalog, name: string, rootNode: EntityTreeNode);
  /**
   * Creates a new EntityTreeHierarchyImpl with the specified hierarchy definition, root node, and version.
   *
   * @param catalog the catalog containing this hierarchy
   * @param name the name of this hierarchy in the catalog
   * @param rootNode the node to use as the root of the tree
   * @param version the version number of this hierarchy
   */
  constructor(catalog: Catalog, name: string, rootNode: EntityTreeNode, version: number);
  constructor(catalog: Catalog, name: string, rootEntityOrNode?: Entity | null | EntityTreeNode, version?: number) {
    this._catalog = catalog;
    this._name = name;
    this._version = version ?? 0;

    if (rootEntityOrNode === undefined) {
      this._root = new EntityTreeNodeImpl(null);
    } else if (rootEntityOrNode !== null && typeof rootEntityOrNode === "object" && "isLeaf" in rootEntityOrNode) {
      this._root = rootEntityOrNode;
    } else {
      this._root = new EntityTreeNodeImpl(rootEntityOrNode);
    }

    catalog.addHierarchy(this);
  }

  /**
   * Returns the Catalog that owns this hierarchy.
   */
  catalog(): Catalog {
    return this._catalog;
  }

  /**
   * Returns the name of this hierarchy in the catalog.
   */
  name(): string {
    return this._name;
  }

  /**
   * Returns the type of this hierarchy.
   */
  type(): HierarchyType {
    return HierarchyType.ENTITY_TREE;
  }

  /**
   * Returns the root node of this tree hierarchy.
   */
  root(): EntityTreeNode {
    return this._root;
  }

  /**
   * Returns the version number of this hierarchy.
   */
  version(): number {
    return this._version;
  }

  /**
   * Set a new root node.
   *
   * @param newRoot the new root
   */
  setRoot(newRoot: EntityTreeNode): void {
    this._root = newRoot;
  }
}

/**
 * Basic implementation of an AspectMapHierarchy that maps entities to aspects.
 * This hierarchy type stores a mapping from entity IDs to aspects of a single type.
 */
export class AspectMapHierarchyImpl extends Map<Entity, Aspect> implements AspectMapHierarchy {
  /** The catalog containing this hierarchy. */
  private readonly _catalog: Catalog;

  /** The name of this hierarchy in the catalog. */
  private readonly _name: string;

  /** The aspect definition for the aspects stored in this hierarchy. */
  private readonly _aspectDef: AspectDef;

  /** The version number of this hierarchy. */
  private readonly _version: number;

  /**
   * Creates a new AspectMapHierarchyImpl to contain the given AspectDef.
   * A new HierarchyDef will be constructed.
   *
   * @param catalog the catalog containing this hierarchy
   * @param aspectDef the aspect definition for aspects in this hierarchy
   */
  constructor(catalog: Catalog, aspectDef: AspectDef);
  /**
   * Creates a new AspectMapHierarchyImpl to contain the given AspectDef with version.
   * A new HierarchyDef will be constructed.
   *
   * @param catalog the catalog containing this hierarchy
   * @param aspectDef the aspect definition for aspects in this hierarchy
   * @param version the version number of this hierarchy
   */
  constructor(catalog: Catalog, aspectDef: AspectDef, version: number);
  /**
   * Creates a new AspectMapHierarchyImpl with initial entries.
   *
   * @param catalog the catalog containing this hierarchy
   * @param aspectDef the aspect definition for aspects in this hierarchy
   * @param initialEntries initial entity-aspect mappings
   */
  constructor(catalog: Catalog, aspectDef: AspectDef, initialEntries: Iterable<readonly [Entity, Aspect]>);
  /**
   * Creates a new AspectMapHierarchyImpl with initial entries and version.
   *
   * @param catalog the catalog containing this hierarchy
   * @param aspectDef the aspect definition for aspects in this hierarchy
   * @param initialEntries initial entity-aspect mappings
   * @param version the version number of this hierarchy
   */
  constructor(
    catalog: Catalog,
    aspectDef: AspectDef,
    initialEntries: Iterable<readonly [Entity, Aspect]>,
    version: number,
  );
  constructor(
    catalog: Catalog,
    aspectDef: AspectDef,
    versionOrEntries?: number | Iterable<readonly [Entity, Aspect]>,
    version?: number,
  ) {
    if (versionOrEntries !== undefined && typeof versionOrEntries === "object") {
      // Iterable of entries provided
      super(versionOrEntries);
      this._catalog = catalog;
      this._aspectDef = aspectDef;
      this._name = aspectDef.name();
      this._version = version ?? 0;
    } else {
      // No entries or just version
      super();
      this._catalog = catalog;
      this._aspectDef = aspectDef;
      this._version = (versionOrEntries as number) ?? 0;
      this._name = aspectDef.name();
    }
    catalog.addHierarchy(this);
  }

  /**
   * Returns the aspect definition for aspects stored in this hierarchy.
   */
  aspectDef(): AspectDef {
    return this._aspectDef;
  }

  /**
   * Returns the Catalog that owns this hierarchy.
   */
  catalog(): Catalog {
    return this._catalog;
  }

  /**
   * Returns the name of this hierarchy in the catalog.
   */
  name(): string {
    return this._name;
  }

  /**
   * Returns the type of this hierarchy.
   */
  type(): HierarchyType {
    return HierarchyType.ASPECT_MAP;
  }

  /**
   * Returns the version number of this hierarchy.
   */
  version(): number {
    return this._version;
  }

  /**
   * Convenience method to add an aspect to this hierarchy.
   */
  add(a: Aspect): Aspect | null {
    if (a.def().globalId() !== this._aspectDef.globalId()) {
      throw new Error(`Cannot add Aspect of type '${a.def().name()}' to hierarchy '${this._name}'.`);
    }
    return this.unsafeAdd(a);
  }

  /**
   * Convenience method to add an aspect to this hierarchy without validation.
   */
  unsafeAdd(a: Aspect): Aspect | null {
    const entity = a.entity();
    if (entity === null) {
      throw new Error("Cannot add aspect with null entity to AspectMapHierarchy");
    }
    const previous = this.get(entity);
    this.set(entity, a);
    return previous ?? null;
  }
}
