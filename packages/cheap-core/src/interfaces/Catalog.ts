/**
 * Catalog interfaces
 */

import { Entity } from "./Entity.js";
import { Hierarchy, AspectMapHierarchy, HierarchyDef } from "./Hierarchy.js";
import { AspectDef } from "./Aspect.js";
import { CatalogSpecies } from "../types.js";

/**
 * A CatalogDef defines the structure and properties of a catalog.
 * This is a purely informational class.
 */
export interface CatalogDef {
  /**
   * Returns a read-only collection of the aspect definitions that are typically found
   * in a catalog with this definition. Catalogs flagged as "strict" will only contain
   * these Aspects; otherwise they may contain additional types of Aspects.
   *
   * @returns collection of aspect definitions
   */
  aspectDefs(): Iterable<AspectDef>;

  /**
   * Returns a read-only collection of hierarchy definitions that are typically found
   * in a catalog with this definition. Catalogs flagged as "strict" will only contain
   * these Hierarchies; otherwise they may contain additional Hierarchies.
   *
   * @returns collection of hierarchy definitions
   */
  hierarchyDefs(): Iterable<HierarchyDef>;

  /**
   * Retrieves a hierarchy definition by name.
   *
   * @param name the name of the hierarchy definition to retrieve
   * @returns the hierarchy definition with the given name, or null if not found
   */
  hierarchyDef(name: string): HierarchyDef | null;

  /**
   * Retrieves an aspect definition by name.
   *
   * @param name the name of the aspect definition to retrieve
   * @returns the aspect definition with the given name, or null if not found
   */
  aspectDef(name: string): AspectDef | null;

  /**
   * Generate a Cheap-specific FNV-1a hash of this CatalogDef.
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
 * Represents a catalog in the Cheap data model, serving as the "C" in the Cheap acronym
 * (Catalog, Hierarchy, Entity, Aspect, Property). A Catalog is the top-level container
 * that organizes and provides access to hierarchies of entities and their aspects.
 *
 * Catalogs are analogous to databases in traditional database systems or volumes
 * in file systems. They serve as the primary caching layer and provide the organizational
 * structure for all data within their scope.
 *
 * All catalogs in Cheap are caches by design, with different types (SOURCE, SINK, etc.)
 * determining their relationship to upstream data sources. Catalogs maintain two
 * special hierarchies: one for managing other hierarchies and one for managing
 * aspect definitions.
 *
 * Catalogs extend Entity, meaning they have their own global identity and can
 * have aspects attached to them, allowing for metadata about the catalog itself.
 */
export interface Catalog extends Entity {
  /**
   * Returns the species of this catalog.
   *
   * @returns the catalog species
   */
  species(): CatalogSpecies;

  /**
   * The URI of this catalog. Usually a URL, but need not be.
   * Cheap is not concerned with network layers, only modeling.
   *
   * @returns the URI of this catalog, usually a URL; may be null
   */
  uri(): URL | null;

  /**
   * Returns the globalId of the upstream catalog that this catalog derives
   * its data from, or null if this is a source or sink catalog without an
   * upstream source.
   *
   * @returns the upstream catalog UUID, or null if this is a source or sink
   */
  upstream(): string | null;

  /**
   * Returns the collection of hierarchies contained within this catalog.
   *
   * @returns the hierarchy collection for this catalog, never null
   */
  hierarchies(): Iterable<Hierarchy>;

  /**
   * Returns the collection of all AspectDefs contained within this catalog.
   * This is always a superset of the AspectDef collection provided by the CatalogDef.
   *
   * @returns the AspectDef collection for this catalog, never null
   */
  aspectDefs(): Iterable<AspectDef>;

  /**
   * Retrieves a specific hierarchy by name from this catalog.
   *
   * @param name the name of the hierarchy to retrieve
   * @returns the hierarchy with the specified name, or null if not found
   */
  hierarchy(name: string): Hierarchy | null;

  /**
   * Adds a new hierarchy to this catalog. This will replace the existing hierarchy
   * of the same name, if one exists, unless the existing hierarchy is an AspectMapHierarchy.
   *
   * @param hierarchy the hierarchy to add
   * @returns the existing hierarchy that was replaced, or null
   */
  addHierarchy(hierarchy: Hierarchy): Hierarchy | null;

  /**
   * Returns true if there are one or more Aspects in this catalog with the
   * specified AspectDef name.
   *
   * @param name AspectDef name
   * @returns true if this catalog contains at least one such aspect
   */
  containsAspects(name: string): boolean;

  /**
   * Retrieves the aspect map hierarchy for a specific aspect definition.
   * This provides access to ALL aspects of the specified type in this catalog.
   *
   * @param aspectDef the aspect definition to find aspects for
   * @returns the aspect map hierarchy, or null if not found
   */
  aspects(aspectDef: AspectDef): AspectMapHierarchy | null;

  /**
   * Retrieves the aspect map hierarchy for a specific aspect definition by name.
   *
   * @param name the name of the aspect definition to find aspects for
   * @returns the aspect map hierarchy, or null if not found
   */
  aspects(name: string): AspectMapHierarchy | null;

  /**
   * Returns the version number of this catalog.
   * Version numbers allow tracking changes and evolution of catalog contents over time.
   *
   * @returns the version number of this catalog, defaults to 0
   */
  version(): number;

  /**
   * Extend the catalog with a new type of Aspects to store. If the AspectDef is
   * already included in this catalog, this is a no-op. If it's not part of the
   * CatalogDef and this catalog is flagged as strict, an exception will be
   * thrown. Otherwise, a new, empty AspectMapHierarchy is added to this catalog.
   *
   * @param aspectDef the type of aspect to add
   * @throws Error if we are strict and the AspectDef is not in our CatalogDef
   * @returns the new or existing AspectMapHierarchy
   */
  extend(aspectDef: AspectDef): AspectMapHierarchy;
}
