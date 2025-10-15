/**
 * Entity interfaces
 *
 * Represents an entity in the Cheap data model. An Entity is only a conceptual object.
 * It does not have any specific properties except for a global ID; all other properties
 * are stored in Aspects, which in turn are stored in Catalogs. Entities are not "stored"
 * anywhere, since they have no data. The global ID serves as a key to locate Aspects.
 * Entities are analogous to primary keys in database terminology.
 */

import { Aspect, AspectDef } from './Aspect.js';
import { Catalog } from './Catalog.js';

/**
 * Represents an entity in the Cheap data model. An Entity is only a conceptual object.
 * It does not have any specific properties except for a global ID; all other properties
 * are stored in Aspects, which in turn are stored in Catalogs. Entities are not "stored"
 * anywhere, since they have no data. The global ID serves as a key to locate Aspects.
 * Entities are analogous to primary keys in database terminology.
 *
 * Each Entity has a globally unique identifier (UUID) and can have an arbitrary set
 * of Aspects attached to it - but no more than one of each Aspect type, as defined by an
 * AspectDef.
 *
 * Implementors of this interface must implement equals() and hashCode() using ONLY
 * the globalId.
 *
 * Entities are referenced by their Aspects, and also by some types of Hierarchies.
 */
export interface Entity {
  /**
   * Returns the globally unique identifier for this entity. This UUID is used to
   * reference the entity across different catalogs and hierarchies.
   *
   * The global ID is immutable once assigned. Some Entity implementations
   * will defer ID generation until requested.
   *
   * @returns the globally unique UUID for this entity, never null
   */
  globalId(): string;

  /**
   * Retrieves an Aspect attached to this entity in the specified Catalog
   * using its AspectDef.
   *
   * The default implementation requests the AspectMapHierarchy from the
   * given Catalog for the given AspectDef and simply returns the result of
   * its get method. If no aspect of the specified type is attached to this
   * entity in the catalog, this method returns null.
   *
   * @param def the aspect definition to look up, must not be null
   * @param cat the catalog to look in, must not be null
   * @returns the aspect instance matching the definition, or null if not found
   */
  getAspect(def: AspectDef, cat: Catalog): Aspect | null;

  /**
   * Attach the given aspect to this entity. This will not invoke any Catalog
   * operations, and could result in an inconsistent state.
   *
   * This method must invoke the setEntity method on the Aspect.
   *
   * @param aspect the aspect to attach
   */
  attach(aspect: Aspect): void;

  /**
   * Attach the given aspect to this entity, then add it to the specified catalog.
   * Note that the set of Aspect types stored in a catalog cannot be implicitly
   * extended; to add a new type of entity to a non-strict catalog, call its
   * extend method.
   *
   * This method must invoke the setEntity method on the Aspect.
   *
   * @param aspect the aspect to attach
   * @param catalog the catalog to save to
   */
  attachAndSave(aspect: Aspect, catalog: Catalog): void;
}

/**
 * LocalEntity keeps track of one or more Catalog(s) that contain its Aspects.
 * LocalEntity references are therefore sufficient to access Aspects, without
 * needing a Catalog reference.
 */
export interface LocalEntity extends Entity {
  /**
   * Return the set of Catalogs that this entity has Aspects in.
   *
   * @returns an Iterable of Catalogs (which commonly will only have one element)
   */
  catalogs(): Iterable<Catalog>;

  /**
   * Retrieves a specific aspect attached to this entity by its definition.
   *
   * If no aspect of the specified type is attached to this entity in any
   * of its catalogs, this method returns null.
   *
   * The default implementation calls the getAspect method with each of the
   * catalogs returned by the catalogs method, in order, and returns the first match.
   *
   * @param def the aspect definition to look up, must not be null
   * @returns the aspect instance matching the definition, or null if not found
   */
  getAspect(def: AspectDef): Aspect | null;

  /**
   * Adds an aspect to this entity. If the aspect already has an entity specified
   * and is flagged as non-transferable, an exception will be thrown.
   *
   * The default implementation iterates through the catalogs returned by
   * the catalogs method and inserts the Aspect into the first Catalog that
   * contains the matching AspectDef. If no catalog is found, an exception is thrown.
   *
   * @param aspect the aspect to attach to the entity
   */
  add(aspect: Aspect): void;
}
