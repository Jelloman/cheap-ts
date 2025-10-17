/**
 * Hierarchy interfaces
 *
 * Base interface for all hierarchy types in the Cheap data model. A Hierarchy
 * represents the "H" in the Cheap acronym (Catalog, Hierarchy, Entity, Aspect, Property)
 * and provides organized access to entities within a catalog.
 */

import { Entity } from "./Entity.js";
import { Aspect, AspectDef } from "./Aspect.js";
import { Catalog } from "./Catalog.js";
import { HierarchyType } from "../types.js";

/**
 * Defines the metadata and characteristics of a hierarchy within the Cheap data model.
 * A hierarchy definition specifies the type, name, and mutability constraints of
 * a hierarchy instance.
 *
 * In the Cheap model, hierarchies provide the structural organization for entities
 * and aspects within a catalog. The HierarchyDef serves as the schema definition
 * that determines how a hierarchy behaves and what operations are permitted on it.
 */
export interface HierarchyDef {
  /**
   * Returns the unique name identifier for this hierarchy definition.
   *
   * @returns the hierarchy name, never null
   */
  name(): string;

  /**
   * Returns the type of hierarchy this definition describes.
   * The type determines the structure and behavior of hierarchy instances
   * created from this definition.
   *
   * @returns the hierarchy type, never null
   */
  type(): HierarchyType;

  /**
   * Generate a Cheap-specific FNV-1a hash of this HierarchyDef.
   * This hash should be consistent across all Cheap implementations.
   *
   * Implementations of this interface should probably cache the result of this
   * method for improved performance.
   *
   * @returns a 64-bit hash value
   */
  hash(): bigint;
}

/**
 * Base interface for all hierarchy types in the Cheap data model. A Hierarchy
 * represents the "H" in the Cheap acronym (Catalog, Hierarchy, Entity, Aspect, Property)
 * and provides organized access to entities within a catalog.
 *
 * Hierarchies define the structure and organization of entities, serving roles
 * analogous to tables or indexes in database terminology, or directory structures
 * in file systems. Each hierarchy has a specific type that determines its
 * organizational behavior and access patterns.
 *
 * All hierarchies are associated with a catalog and have a definition that
 * specifies their type, name, and organizational characteristics.
 */
export interface Hierarchy {
  /**
   * Returns the Catalog that contains this Hierarchy.
   *
   * @returns the catalog that owns this hierarchy, never null
   */
  catalog(): Catalog;

  /**
   * Returns the name identifier for this hierarchy definition, which is unique
   * within its catalog.
   *
   * @returns the hierarchy name, never null
   */
  name(): string;

  /**
   * Returns the type of hierarchy this definition describes.
   * The type determines the structure and behavior of hierarchy instances
   * created from this definition.
   *
   * @returns the hierarchy type, never null
   */
  type(): HierarchyType;

  /**
   * Returns the version number of this hierarchy.
   * Version numbers allow tracking changes and evolution of hierarchy contents over time.
   *
   * @returns the version number of this hierarchy, defaults to 0
   */
  version(): number;
}

/**
 * A hierarchy that maintains an ordered list of entity references, representing the
 * ENTITY_LIST (EL) hierarchy type in the Cheap model. This hierarchy type allows
 * duplicate entity references and preserves insertion order.
 *
 * This hierarchy combines the standard hierarchy interface with Array-like functionality,
 * providing indexed access to entities and supporting operations like sequential
 * traversal, positional insertion, and duplicate entries. It is analogous to a
 * database table with no primary key constraint or a file manifest that can contain
 * multiple references to the same file.
 *
 * Use cases for EntityListHierarchy include:
 * - Maintaining processing queues or work lists where entities may appear multiple times
 * - Recording event sequences or audit trails where the same entity may be logged repeatedly
 * - Preserving ordered collections where position matters (e.g., playlist, ranked lists)
 * - Modeling many-to-many relationships with ordering and multiplicity
 *
 * The list can contain null elements if the underlying implementation permits,
 * though this is generally discouraged to maintain referential integrity.
 */
export interface EntityListHierarchy extends Hierarchy, Array<Entity> {}

/**
 * A hierarchy that maintains a possibly-ordered set of unique entity references,
 * representing the ENTITY_SET (ES) hierarchy type in the Cheap model. This hierarchy
 * type ensures that each entity appears at most once in the collection.
 *
 * This hierarchy combines the standard hierarchy interface with Set functionality,
 * providing efficient membership testing and automatic duplicate elimination. The set
 * may be ordered (e.g., using a LinkedHashSet implementation) or unordered (e.g., using
 * a HashSet implementation), depending on the specific implementation chosen.
 *
 * Unlike EntityListHierarchy, this hierarchy enforces uniqueness of entity
 * references, making it analogous to a database table with a primary key constraint or
 * a collection of unique file references. This makes EntitySetHierarchy ideal for:
 * - Maintaining collections of unique entities without duplicates
 * - Implementing tag or category memberships where each entity belongs once
 * - Managing entity pools or registries requiring fast membership checks
 * - Representing one-to-many relationships where uniqueness is required
 * - Building indices or lookup structures for entities
 *
 * The uniqueness constraint is based on entity equality, which in the Cheap model
 * is determined solely by the entity's global ID. This means two Entity instances with
 * the same UUID are considered equal and only one will be retained in the set.
 */
export interface EntitySetHierarchy extends Hierarchy, Set<Entity> {}

/**
 * A hierarchy that maps string keys to entity references, representing the
 * ENTITY_DIR (ED) hierarchy type in the Cheap model. This hierarchy type provides
 * dictionary-like lookups of entities by string identifiers.
 *
 * This hierarchy combines the standard hierarchy interface with Map functionality,
 * enabling efficient key-based access to entities through string identifiers. It is
 * analogous to a file directory (hence the name) where files are accessed by name,
 * or a database table with a string primary key.
 *
 * The mapping is one-to-one: each string key maps to at most one entity, though
 * multiple keys can map to the same entity if the implementation permits. The keys
 * are typically meaningful names, identifiers, or paths that provide semantic access
 * to entities.
 *
 * Common use cases for EntityDirectoryHierarchy include:
 * - Named entity registries where entities are accessed by symbolic names
 * - Path-based entity lookups (e.g., "/users/john", "config/settings")
 * - String-keyed indices for quick entity retrieval
 * - Implementing named slots or variables in configuration systems
 * - Mapping external identifiers (SKUs, usernames, etc.) to internal entities
 * - Building simple flat namespaces for entity organization
 *
 * For hierarchical path-based organization with parent-child relationships,
 * consider using EntityTreeHierarchy instead, which provides tree structure
 * and navigation capabilities beyond simple key-value mapping.
 */
export interface EntityDirectoryHierarchy extends Hierarchy, Map<string, Entity> {}

/**
 * Represents a tree-structured hierarchy of entities where nodes can have named children
 * and leaf nodes represent actual entities. This is the "ET" (Entity Tree) hierarchy type
 * in the Cheap model.
 *
 * Tree hierarchies are useful for representing file systems, organizational structures,
 * taxonomies, or any data that has a natural parent-child relationship with named paths
 * to leaf entities.
 *
 * The tree structure allows for efficient navigation and querying of hierarchical data,
 * with each node potentially containing an entity and supporting named child lookups.
 */
export interface EntityTreeHierarchy extends Hierarchy {
  /**
   * Represents a node in the entity tree hierarchy. Each node can contain an entity
   * and act as a container for named child nodes, implementing the Map interface for
   * efficient child lookup by name.
   *
   * Nodes can be either leaf nodes (containing entities with no children) or
   * internal nodes (which may contain entities and have child nodes). The tree
   * structure is navigable in both directions through parent-child relationships.
   */
  root(): EntityTreeNode;
}

/**
 * Represents a node in the entity tree hierarchy. Each node can contain an entity
 * and act as a container for named child nodes, implementing the Map interface for
 * efficient child lookup by name.
 *
 * Nodes can be either leaf nodes (containing entities with no children) or
 * internal nodes (which may contain entities and have child nodes). The tree
 * structure is navigable in both directions through parent-child relationships.
 */
export interface EntityTreeNode extends Map<string, EntityTreeNode> {
  /**
   * Determines whether this node is a leaf node (has no children) or an internal
   * node that can contain child nodes.
   *
   * Leaf nodes typically represent terminal entities in the hierarchy, while
   * internal nodes represent containers or directories that can hold other nodes.
   *
   * @returns true if this node cannot have children, false if it can contain child nodes
   */
  isLeaf(): boolean;

  /**
   * Returns the parent node of this node in the tree hierarchy, or null if this
   * is the root node.
   *
   * The parent relationship allows for upward navigation in the tree structure
   * and is used to maintain tree integrity during modifications.
   *
   * @returns the parent node, or null if this is the root node
   */
  getParent(): EntityTreeNode | null;

  /**
   * Returns the entity associated with this node. Not all nodes are required to
   * have an associated entity - some nodes may exist purely as containers for
   * organizing child nodes.
   *
   * When present, the entity provides access to the data and aspects stored
   * at this location in the tree hierarchy.
   *
   * @returns the entity associated with this node, or null if no entity is attached
   */
  value(): Entity | null;

  /**
   * Sets the entity associated with this node. Not all nodes are required to
   * have an associated entity - some nodes may exist purely as containers for
   * organizing child nodes.
   *
   * @param entity the entity associated with this node, or null if no entity is attached
   */
  setValue(entity: Entity | null): void;
}

/**
 * A hierarchy that maps entities to their aspects of a specific type.
 * This represents the ASPECT_MAP (AM) hierarchy type in the Cheap model,
 * providing a direct mapping from entities to their associated aspect instances.
 *
 * This hierarchy combines the standard hierarchy interface with Map functionality,
 * allowing efficient storage and retrieval of aspects by their associated entities.
 * All aspects in this hierarchy share the same AspectDef, ensuring type consistency.
 */
export interface AspectMapHierarchy extends Hierarchy, Map<Entity, Aspect> {
  /**
   * Returns the aspect definition that defines the structure and constraints
   * for all aspects stored in this hierarchy.
   *
   * @returns the aspect definition for this hierarchy, never null
   */
  aspectDef(): AspectDef;

  /**
   * Convenience method to add an aspect to this hierarchy.
   * This method extracts the entity from the aspect and uses it as the key
   * in the underlying map.
   *
   * @param a the aspect to add
   * @returns the previous aspect associated with the same entity, or null if none existed
   */
  add(a: Aspect): Aspect | null;

  /**
   * Convenience method to add an aspect to this hierarchy without validation.
   * This method extracts the entity from the aspect and uses it as the key
   * in the underlying map.
   *
   * @param a the aspect to add
   * @returns the previous aspect associated with the same entity, or null if none existed
   */
  unsafeAdd(a: Aspect): Aspect | null;
}
