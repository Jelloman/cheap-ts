/**
 * AspectDef implementation classes
 */

import { AspectDef, MutableAspectDef, PropertyDef, Aspect } from '../interfaces';
import { CheapHasher } from '../util/CheapHasher.js';

/**
 * Abstract base class for AspectDef implementations providing common functionality.
 * This class manages the basic structure of an aspect definition including its
 * name and property definitions.
 */
export abstract class AspectDefBase implements AspectDef {
  protected readonly _name: string;
  protected readonly _globalId: string;
  protected readonly _propertyDefs: Map<string, PropertyDef>;
  private _cachedHash: bigint = 0n;

  /**
   * Creates a new AspectDefBase with the specified name and property definitions.
   */
  protected constructor(
    name: string,
    globalId: string,
    propertyDefs: Map<string, PropertyDef>
  ) {
    if (!name) {
      throw new Error('AspectDefs must have a non-null name.');
    }
    if (!propertyDefs) {
      throw new Error('Provided property defs cannot be null.');
    }
    this._name = name;
    this._globalId = globalId;
    this._propertyDefs = propertyDefs;
  }

  name(): string {
    return this._name;
  }

  globalId(): string {
    return this._globalId;
  }

  // Entity interface methods - AspectDef entities don't use these
  getAspect(_def: AspectDef, _cat: never): Aspect | null {
    // AspectDef entities don't have aspects attached in the normal way
    return null;
  }

  attach(_aspect: Aspect): void {
    // AspectDef entities don't support aspect attachment
    throw new Error('AspectDef entities do not support aspect attachment');
  }

  attachAndSave(_aspect: Aspect, _catalog: never): void {
    // AspectDef entities don't support aspect attachment
    throw new Error('AspectDef entities do not support aspect attachment and saving');
  }

  propertyDefs(): ReadonlyArray<PropertyDef> {
    return Array.from(this._propertyDefs.values());
  }

  size(): number {
    return this._propertyDefs.size;
  }

  propertyDef(propName: string): PropertyDef | null {
    return this._propertyDefs.get(propName) ?? null;
  }

  isReadable(): boolean {
    return true;
  }

  isWritable(): boolean {
    return true;
  }

  canAddProperties(): boolean {
    return false;
  }

  canRemoveProperties(): boolean {
    return false;
  }

  fullyEquals(other: AspectDef): boolean {
    if (
      this.globalId() !== other.globalId() ||
      this.name() !== other.name() ||
      this.isReadable() !== other.isReadable() ||
      this.isWritable() !== other.isWritable() ||
      this.canAddProperties() !== other.canAddProperties() ||
      this.canRemoveProperties() !== other.canRemoveProperties()
    ) {
      return false;
    }

    for (const propDef of this.propertyDefs()) {
      const otherPropDef = other.propertyDef(propDef.name());
      if (!otherPropDef || !propDef.fullyEquals(otherPropDef)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate a Cheap-specific FNV-1a hash of this AspectDef.
   * This implementation caches the computed hash value for improved performance.
   */
  hash(): bigint {
    if (this._cachedHash === 0n) {
      const hasher = new CheapHasher();
      hasher.updateBoolean(this.isReadable());
      hasher.updateBoolean(this.isWritable());
      hasher.updateBoolean(this.canAddProperties());
      hasher.updateBoolean(this.canRemoveProperties());
      hasher.updateString(this.name());
      hasher.updateString(this.globalId());

      for (const pDef of this.propertyDefs()) {
        hasher.updateBigInt(pDef.hash());
      }

      this._cachedHash = hasher.getHash();
    }
    return this._cachedHash;
  }

  /**
   * Invalidates the cached hash value, forcing it to be recomputed on the next call to hash().
   * This should be called by mutable subclasses whenever the aspect definition is modified.
   */
  protected invalidateHashCache(): void {
    this._cachedHash = 0n;
  }
}

/**
 * Immutable implementation of an AspectDef that prevents modification after creation.
 * All attempts to add or remove properties will result in an Error.
 */
export class ImmutableAspectDefImpl extends AspectDefBase {
  constructor(
    name: string,
    globalIdOrPropertyDefs?: string | Map<string, PropertyDef>,
    propertyDefsOrUndefined?: Map<string, PropertyDef>
  ) {
    // Support both 2-parameter and 3-parameter constructors
    // 2-parameter: (name, propertyDefs) - generate UUID
    // 3-parameter: (name, globalId, propertyDefs)
    let actualGlobalId: string;
    let actualPropertyDefs: Map<string, PropertyDef>;

    if (typeof globalIdOrPropertyDefs === 'string') {
      // 3-parameter form
      actualGlobalId = globalIdOrPropertyDefs;
      actualPropertyDefs = propertyDefsOrUndefined!;
    } else {
      // 2-parameter form
      actualGlobalId = crypto.randomUUID();
      actualPropertyDefs = globalIdOrPropertyDefs!;
    }

    // Create an immutable copy of the property definitions map
    super(name, actualGlobalId, new Map(actualPropertyDefs));

    if (actualPropertyDefs.size === 0) {
      throw new Error('An AspectDef must contain at least one property.');
    }
  }

  canAddProperties(): boolean {
    return false;
  }

  canRemoveProperties(): boolean {
    return false;
  }

  /**
   * Attempting to add a property to an immutable AspectDef throws an error.
   */
  add(_prop: PropertyDef): PropertyDef | null {
    throw new Error(`Properties cannot be added to immutable AspectDef '${this._name}'.`);
  }

  /**
   * Attempting to remove a property from an immutable AspectDef throws an error.
   */
  remove(_prop: PropertyDef): PropertyDef | null {
    throw new Error(
      `Properties cannot be removed from immutable AspectDef '${this._name}'.`
    );
  }
}

/**
 * Mutable implementation of an AspectDef that allows modification after creation.
 * This implementation allows adding and removing property definitions dynamically.
 */
export class MutableAspectDefImpl extends AspectDefBase implements MutableAspectDef {
  constructor(name: string, globalId: string, propertyDefs?: Map<string, PropertyDef> | null) {
    // Only use default empty Map if undefined (not provided), not if explicitly null
    super(name, globalId, propertyDefs !== undefined ? (propertyDefs as Map<string, PropertyDef>) : new Map());
  }

  canAddProperties(): boolean {
    return true;
  }

  canRemoveProperties(): boolean {
    return true;
  }

  /**
   * Adds a property definition to this mutable aspect definition.
   * Invalidates the cached hash value since the aspect definition has changed.
   */
  add(prop: PropertyDef): PropertyDef | null {
    this.invalidateHashCache();
    const previous = this._propertyDefs.get(prop.name()) ?? null;
    this._propertyDefs.set(prop.name(), prop);
    return previous;
  }

  /**
   * Removes a property definition from this mutable aspect definition.
   * Invalidates the cached hash value since the aspect definition has changed.
   */
  remove(prop: PropertyDef): PropertyDef | null {
    this.invalidateHashCache();
    const removed = this._propertyDefs.get(prop.name()) ?? null;
    this._propertyDefs.delete(prop.name());
    return removed;
  }
}

/**
 * Full implementation of an AspectDef with explicit control over all four boolean flags.
 * This implementation allows specifying exactly which operations are allowed through
 * constructor parameters, providing fine-grained control over aspect definition behavior.
 */
export class FullAspectDefImpl extends AspectDefBase implements MutableAspectDef {
  private readonly _isReadable: boolean;
  private readonly _isWritable: boolean;
  private readonly _canAddProperties: boolean;
  private readonly _canRemoveProperties: boolean;

  constructor(
    name: string,
    globalId: string,
    propertyDefs: Map<string, PropertyDef>,
    isReadable: boolean,
    isWritable: boolean,
    canAddProperties: boolean,
    canRemoveProperties: boolean
  ) {
    super(name, globalId, propertyDefs);
    this._isReadable = isReadable;
    this._isWritable = isWritable;
    this._canAddProperties = canAddProperties;
    this._canRemoveProperties = canRemoveProperties;
  }

  isReadable(): boolean {
    return this._isReadable;
  }

  isWritable(): boolean {
    return this._isWritable;
  }

  canAddProperties(): boolean {
    return this._canAddProperties;
  }

  canRemoveProperties(): boolean {
    return this._canRemoveProperties;
  }

  /**
   * Adds a property definition to this aspect definition.
   * Invalidates the cached hash value since the aspect definition has changed.
   */
  add(prop: PropertyDef): PropertyDef | null {
    if (!this._canAddProperties) {
      throw new Error(
        `Cannot add properties to AspectDef '${this._name}' (canAddProperties=false).`
      );
    }
    this.invalidateHashCache();
    const previous = this._propertyDefs.get(prop.name()) ?? null;
    this._propertyDefs.set(prop.name(), prop);
    return previous;
  }

  /**
   * Removes a property definition from this aspect definition.
   * Invalidates the cached hash value since the aspect definition has changed.
   */
  remove(prop: PropertyDef): PropertyDef | null {
    if (!this._canRemoveProperties) {
      throw new Error(
        `Cannot remove properties from AspectDef '${this._name}' (canRemoveProperties=false).`
      );
    }
    this.invalidateHashCache();
    const removed = this._propertyDefs.get(prop.name()) ?? null;
    this._propertyDefs.delete(prop.name());
    return removed;
  }
}
