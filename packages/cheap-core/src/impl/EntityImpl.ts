/**
 * Entity implementation classes
 */

import { Entity, LocalEntity } from '../interfaces/Entity.js';
import { Aspect, AspectDef } from '../interfaces/Aspect.js';
import { Catalog } from '../interfaces/Catalog.js';
import { randomUUID } from 'crypto';

/**
 * Basic implementation of an Entity reference with the bare minimum functionality
 * (storing and providing a global ID).
 */
export class EntityImpl implements Entity {
  /** The globally unique identifier for this entity. */
  private readonly _globalId: string;

  /**
   * Creates a new EntityImpl with a randomly generated UUID.
   */
  constructor();
  /**
   * Creates a new EntityImpl with the specified global ID.
   *
   * @param globalId the UUID to use as the global identifier for this entity
   */
  constructor(globalId: string);
  constructor(globalId?: string) {
    if (globalId === undefined) {
      this._globalId = randomUUID();
    } else {
      if (!globalId) {
        throw new Error('EntityImpl may not have a null or empty UUID.');
      }
      this._globalId = globalId;
    }
  }

  /**
   * Returns the globally unique identifier for this entity.
   *
   * @returns the UUID identifying this entity globally
   */
  globalId(): string {
    return this._globalId;
  }

  /**
   * Retrieves an Aspect attached to this entity in the specified Catalog
   * using its AspectDef.
   *
   * @param def the aspect definition to look up, must not be null
   * @param cat the catalog to look in, must not be null
   * @returns the aspect instance matching the definition, or null if not found
   */
  getAspect(def: AspectDef, cat: Catalog): Aspect | null {
    const aspects = cat.aspects(def);
    if (aspects !== null) {
      return aspects.get(this) ?? null;
    }
    return null;
  }

  /**
   * Attach the given aspect to this entity. This will not invoke any Catalog
   * operations, and could result in an inconsistent state.
   *
   * This method must invoke the setEntity method on the Aspect.
   *
   * @param aspect the aspect to attach
   */
  attach(aspect: Aspect): void {
    aspect.setEntity(this);
  }

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
  attachAndSave(aspect: Aspect, catalog: Catalog): void {
    this.attach(aspect);
    const aspectMap = catalog.aspects(aspect.def());
    if (aspectMap === null) {
      throw new Error(
        `Aspects of type '${aspect.def().name()}' cannot be stored in the given catalog.`
      );
    }
    aspectMap.add(aspect);
  }

  /**
   * Compare to another entity. This implementation is final and only compares global IDs.
   *
   * @param o the object with which to compare.
   * @returns true if o is an Entity and has the same globalId
   */
  equals(o: unknown): boolean {
    if (typeof o !== 'object' || o === null) {
      return false;
    }
    if (!('globalId' in o) || typeof (o as Entity).globalId !== 'function') {
      return false;
    }
    return this._globalId === (o as Entity).globalId();
  }

  /**
   * Generate this object's hash code. This implementation only uses global ID.
   *
   * @returns hashCode of the globalId
   */
  hashCode(): number {
    // Simple string hash function
    let hash = 0;
    for (let i = 0; i < this._globalId.length; i++) {
      const char = this._globalId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
}

/**
 * Entity implementation with a lazily-initialized global ID.
 */
export class EntityLazyIdImpl implements Entity {
  /** Lazily initialized global identifier. */
  private _globalId: string | null = null;

  /**
   * Creates a new EntityLazyIdImpl with a new local entity.
   * The global ID will be created on first access.
   */
  constructor() {}

  /**
   * Returns the globally unique identifier for this entity, creating it if necessary.
   * Uses lazy initialization for thread-safe generation.
   *
   * @returns the UUID identifying this entity globally
   */
  globalId(): string {
    if (this._globalId === null) {
      this._globalId = randomUUID();
    }
    return this._globalId;
  }

  /**
   * Retrieves an Aspect attached to this entity in the specified Catalog
   * using its AspectDef.
   *
   * @param def the aspect definition to look up, must not be null
   * @param cat the catalog to look in, must not be null
   * @returns the aspect instance matching the definition, or null if not found
   */
  getAspect(def: AspectDef, cat: Catalog): Aspect | null {
    const aspects = cat.aspects(def);
    if (aspects !== null) {
      return aspects.get(this) ?? null;
    }
    return null;
  }

  /**
   * Attach the given aspect to this entity. This will not invoke any Catalog
   * operations, and could result in an inconsistent state.
   *
   * This method must invoke the setEntity method on the Aspect.
   *
   * @param aspect the aspect to attach
   */
  attach(aspect: Aspect): void {
    aspect.setEntity(this);
  }

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
  attachAndSave(aspect: Aspect, catalog: Catalog): void {
    this.attach(aspect);
    const aspectMap = catalog.aspects(aspect.def());
    if (aspectMap === null) {
      throw new Error(
        `Aspects of type '${aspect.def().name()}' cannot be stored in the given catalog.`
      );
    }
    aspectMap.add(aspect);
  }

  /**
   * Compare to another entity. This implementation only compares global IDs.
   * This will force the generation of the global ID.
   *
   * @param o the object with which to compare.
   * @returns true if o is an Entity and has the same globalId
   */
  equals(o: unknown): boolean {
    if (typeof o !== 'object' || o === null) {
      return false;
    }
    if (!('globalId' in o) || typeof (o as Entity).globalId !== 'function') {
      return false;
    }
    return this.globalId() === (o as Entity).globalId();
  }

  /**
   * Generate this object's hash code. This implementation only uses global ID.
   * This will force the generation of the global ID.
   *
   * @returns hashCode of the globalId
   */
  hashCode(): number {
    const id = this.globalId();
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
}

/**
 * Implementation of a LocalEntity that only has Aspects in a single Catalog.
 */
export class LocalEntityOneCatalogImpl extends EntityImpl implements LocalEntity {
  protected _catalog: Catalog;

  /**
   * Creates a new LocalEntity for the specified catalog.
   *
   * @param catalog the catalog this entity has its Aspects in
   */
  constructor(catalog: Catalog);
  /**
   * Creates a new LocalEntity for the specified catalog.
   *
   * @param globalId the id of this catalog-as-entity
   * @param catalog the catalog this entity has its Aspects in
   */
  constructor(globalId: string, catalog: Catalog);
  constructor(catalogOrGlobalId: Catalog | string, catalog?: Catalog) {
    if (typeof catalogOrGlobalId === 'string') {
      super(catalogOrGlobalId);
      this._catalog = catalog!;
    } else {
      super();
      this._catalog = catalogOrGlobalId;
    }
  }

  /**
   * Retrieves a specific aspect attached to this entity by its definition.
   */
  getAspect(def: AspectDef): Aspect | null;
  getAspect(def: AspectDef, cat: Catalog): Aspect | null;
  getAspect(def: AspectDef, cat?: Catalog): Aspect | null {
    if (cat !== undefined) {
      return super.getAspect(def, cat);
    }
    return super.getAspect(def, this._catalog);
  }

  /**
   * Return the set of Catalogs that this entity has Aspects in, which is actually
   * this object since it also implements the Iterable<Catalog> interface.
   *
   * @returns an Iterable of Catalogs
   */
  catalogs(): Iterable<Catalog> {
    return [this._catalog];
  }

  /**
   * Adds an aspect to this entity.
   */
  add(aspect: Aspect): void {
    if (
      aspect.entity() !== null &&
      aspect.entity() !== this &&
      !aspect.isTransferable()
    ) {
      throw new Error(
        'An Aspect flagged as non-transferable may not be reassigned to a different entity.'
      );
    }

    const aspectMap = this._catalog.aspects(aspect.def());
    if (aspectMap !== null) {
      aspect.setEntity(this);
      aspectMap.add(aspect);
      return;
    }

    throw new Error(
      `No Catalog was found to store the ${aspect.def().name()} aspect in.`
    );
  }
}

/**
 * Implementation of a LocalEntity that has Aspects in multiple Catalogs.
 */
export class LocalEntityMultiCatalogImpl extends EntityImpl implements LocalEntity {
  private readonly _catalogs: Set<Catalog>;

  /**
   * Creates a new LocalEntityMultiCatalogImpl for the specified Catalog.
   *
   * @param catalog the catalog this entity has its Aspects in
   */
  constructor(catalog: Catalog);
  /**
   * Creates a new LocalEntityMultiCatalogImpl with the specified global ID and catalog.
   *
   * @param globalId the UUID for this entity
   * @param catalog the catalog this entity has its Aspects in
   */
  constructor(globalId: string, catalog: Catalog);
  constructor(catalogOrGlobalId: Catalog | string, catalog?: Catalog) {
    if (typeof catalogOrGlobalId === 'string') {
      super(catalogOrGlobalId);
      if (!catalog) {
        throw new Error('Catalog may not be null in LocalEntityMultiCatalogImpl.');
      }
      this._catalogs = new Set([catalog]);
    } else {
      super();
      this._catalogs = new Set([catalogOrGlobalId]);
    }
  }

  /**
   * Return the set of Catalogs that this entity has Aspects in.
   *
   * @returns an Iterable of Catalogs
   */
  catalogs(): Iterable<Catalog> {
    return this._catalogs;
  }

  /**
   * Retrieves a specific aspect attached to this entity by its definition.
   */
  getAspect(def: AspectDef): Aspect | null;
  getAspect(def: AspectDef, cat: Catalog): Aspect | null;
  getAspect(def: AspectDef, cat?: Catalog): Aspect | null {
    if (cat !== undefined) {
      return super.getAspect(def, cat);
    }
    for (const catalog of this._catalogs) {
      const a = super.getAspect(def, catalog);
      if (a !== null) {
        return a;
      }
    }
    return null;
  }

  /**
   * Adds an aspect to this entity.
   */
  add(aspect: Aspect): void {
    if (
      aspect.entity() !== null &&
      aspect.entity() !== this &&
      !aspect.isTransferable()
    ) {
      throw new Error(
        'An Aspect flagged as non-transferable may not be reassigned to a different entity.'
      );
    }

    for (const catalog of this._catalogs) {
      const aspectMap = catalog.aspects(aspect.def());
      if (aspectMap !== null) {
        aspect.setEntity(this);
        aspectMap.add(aspect);
        return;
      }
    }

    throw new Error(
      `No Catalog was found to store the ${aspect.def().name()} aspect in.`
    );
  }

  /**
   * Attach the given aspect to this entity, then add it to the specified catalog.
   */
  override attachAndSave(aspect: Aspect, catalog: Catalog): void {
    super.attachAndSave(aspect, catalog);
    this._catalogs.add(catalog);
  }
}

/**
 * Implementation of LocalEntity that only has Aspects in a single Catalog, and
 * caches Aspects within this instance for faster lookup.
 *
 * The getAspect method will return a valid response if it is passed a different
 * Catalog, but it will only cache the Aspect if it resides in the configured Catalog.
 */
export class CachingEntityOneCatalogImpl extends LocalEntityOneCatalogImpl {
  /** Lazily initialized map of aspect definitions to aspects. */
  protected _aspects: Map<AspectDef, Aspect> | null = null;

  /**
   * Creates a new CachingEntityOneCatalogImpl for the specified catalog.
   *
   * @param catalog the catalog this entity has its Aspects in
   */
  constructor(catalog: Catalog);
  /**
   * Creates a new CachingEntityOneCatalogImpl with the specified global ID and catalog.
   *
   * @param globalId the UUID for this entity
   * @param catalog the catalog this entity has its Aspects in
   */
  constructor(globalId: string, catalog: Catalog);
  constructor(catalogOrGlobalId: Catalog | string, catalog?: Catalog) {
    if (typeof catalogOrGlobalId === 'string') {
      super(catalogOrGlobalId, catalog!);
    } else {
      super(catalogOrGlobalId);
    }
  }

  private createAspectCache(): void {
    this._aspects = new Map<AspectDef, Aspect>();
  }

  private createAspectCacheIfNecessary(): void {
    if (this._aspects === null) {
      this.createAspectCache();
    }
  }

  /**
   * Retrieves an aspect by its definition.
   *
   * @param def the aspect definition to look up
   * @returns the aspect for the given definition, or null if not found
   */
  getAspectIfPresent(def: AspectDef): Aspect | null {
    if (this._aspects !== null) {
      return this._aspects.get(def) ?? null;
    }
    return null;
  }

  /**
   * Retrieves a specific aspect attached to this entity by its definition.
   * If the aspect is not already referenced by this LocalEntity, attempts
   * to load the aspect from the catalog.
   */
  override getAspect(def: AspectDef): Aspect | null;
  override getAspect(def: AspectDef, cat: Catalog): Aspect | null;
  override getAspect(def: AspectDef, cat?: Catalog): Aspect | null {
    const a = this.getAspectIfPresent(def);
    if (a !== null) {
      return a;
    }

    const loaded = cat !== undefined ? super.getAspect(def, cat) : super.getAspect(def);
    if (loaded === null) {
      return null;
    }

    this.createAspectCacheIfNecessary();
    this._aspects!.set(def, loaded);
    return loaded;
  }

  /**
   * Attach the given aspect to this entity.
   */
  override attach(aspect: Aspect): void {
    aspect.setEntity(this);
    this.createAspectCacheIfNecessary();
    this._aspects!.set(aspect.def(), aspect);
  }
}

/**
 * Implementation of LocalEntity that has Aspects in multiple Catalogs, and
 * caches Aspects within this instance for faster lookup.
 */
export class CachingEntityMultiCatalogImpl extends LocalEntityMultiCatalogImpl {
  /** Lazily initialized map of aspect definitions to aspects. */
  protected _aspects: Map<AspectDef, Aspect> | null = null;

  /**
   * Creates a new CachingEntityMultiCatalogImpl for the specified catalog.
   *
   * @param catalog the catalog this entity has its Aspects in
   */
  constructor(catalog: Catalog);
  /**
   * Creates a new CachingEntityMultiCatalogImpl with the specified global ID and catalog.
   *
   * @param globalId the UUID for this entity
   * @param catalog the catalog this entity has its Aspects in
   */
  constructor(globalId: string, catalog: Catalog);
  constructor(catalogOrGlobalId: Catalog | string, catalog?: Catalog) {
    if (typeof catalogOrGlobalId === 'string') {
      super(catalogOrGlobalId, catalog!);
    } else {
      super(catalogOrGlobalId);
    }
  }

  private createAspectCache(): void {
    this._aspects = new Map<AspectDef, Aspect>();
  }

  private createAspectCacheIfNecessary(): void {
    if (this._aspects === null) {
      this.createAspectCache();
    }
  }

  /**
   * Retrieves an aspect by its definition.
   *
   * @param def the aspect definition to look up
   * @returns the aspect for the given definition, or null if not found
   */
  getAspectIfPresent(def: AspectDef): Aspect | null {
    if (this._aspects !== null) {
      return this._aspects.get(def) ?? null;
    }
    return null;
  }

  /**
   * Retrieves a specific aspect attached to this entity by its definition.
   * If the aspect is not already referenced by this LocalEntity, attempts
   * to load the aspect from the catalogs.
   */
  override getAspect(def: AspectDef): Aspect | null;
  override getAspect(def: AspectDef, cat: Catalog): Aspect | null;
  override getAspect(def: AspectDef, cat?: Catalog): Aspect | null {
    const a = this.getAspectIfPresent(def);
    if (a !== null) {
      return a;
    }

    const loaded = cat !== undefined ? super.getAspect(def, cat) : super.getAspect(def);
    if (loaded === null) {
      return null;
    }

    this.createAspectCacheIfNecessary();
    this._aspects!.set(def, loaded);
    return loaded;
  }

  /**
   * Attach the given aspect to this entity.
   */
  override attach(aspect: Aspect): void {
    aspect.setEntity(this);
    this.createAspectCacheIfNecessary();
    this._aspects!.set(aspect.def(), aspect);
  }
}
