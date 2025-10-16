/**
 * Catalog implementation
 */

import { Catalog, CatalogDef } from '../interfaces/Catalog.js';
import { Hierarchy, HierarchyDef, AspectMapHierarchy } from '../interfaces/Hierarchy.js';
import { AspectDef } from '../interfaces/Aspect.js';
import { CatalogSpecies } from '../types.js';
import { LocalEntityOneCatalogImpl } from './EntityImpl.js';
import { AspectMapHierarchyImpl } from './HierarchyImpl.js';
import { CheapHasher } from '../util/CheapHasher.js';
import { randomUUID } from 'crypto';

/**
 * Basic implementation of a CatalogDef that defines the structure and properties
 * of a catalog in the Cheap data caching system.
 *
 * This implementation automatically includes the default catalog hierarchies (catalog root and aspectage).
 */
export class CatalogDefImpl implements CatalogDef {
  /** Map of hierarchy names to their definitions. */
  private readonly _hierarchyDefs = new Map<string, HierarchyDef>();

  /** Map of aspect names to their definitions. */
  private readonly _aspectDefs = new Map<string, AspectDef>();

  /** Cached hash value. */
  private _hash: bigint | null = null;

  /**
   * Creates a new CatalogDefImpl with no HierarchyDefs or AspectDefs.
   */
  constructor();

  /**
   * Creates a new CatalogDefImpl as a copy of another CatalogDef.
   *
   * @param other a CatalogDef
   */
  constructor(other: CatalogDef);

  /**
   * Creates a new CatalogDefImpl with copies of the provided hierarchy defs and/or aspect defs.
   * If the default hierarchies are not included, they will also be added.
   *
   * @param hierarchyDefs the hierarchyDefs to copy
   * @param aspectDefs the aspectDefs to copy
   */
  constructor(hierarchyDefs: Iterable<HierarchyDef>, aspectDefs: Iterable<AspectDef>);

  constructor(
    hierarchyDefsOrOther?: Iterable<HierarchyDef> | CatalogDef,
    aspectDefs?: Iterable<AspectDef>
  ) {
    if (hierarchyDefsOrOther) {
      if ('hierarchyDefs' in hierarchyDefsOrOther) {
        // Copy constructor
        const other = hierarchyDefsOrOther as CatalogDef;
        for (const hDef of other.hierarchyDefs()) {
          this._hierarchyDefs.set(hDef.name(), hDef);
        }
        for (const aDef of other.aspectDefs()) {
          this._aspectDefs.set(aDef.name(), aDef);
        }
      } else {
        // Constructor with iterables
        for (const hDef of hierarchyDefsOrOther) {
          this._hierarchyDefs.set(hDef.name(), hDef);
        }
        if (aspectDefs) {
          for (const aDef of aspectDefs) {
            this._aspectDefs.set(aDef.name(), aDef);
          }
        }
      }
    }
  }

  aspectDefs(): Iterable<AspectDef> {
    return this._aspectDefs.values();
  }

  hierarchyDefs(): Iterable<HierarchyDef> {
    return this._hierarchyDefs.values();
  }

  hierarchyDef(name: string): HierarchyDef | null {
    return this._hierarchyDefs.get(name) ?? null;
  }

  aspectDef(name: string): AspectDef | null {
    return this._aspectDefs.get(name) ?? null;
  }

  hash(): bigint {
    if (this._hash !== null) {
      return this._hash;
    }

    const hasher = new CheapHasher();
    for (const aDef of this.aspectDefs()) {
      hasher.updateBigInt(aDef.hash());
    }
    for (const hDef of this.hierarchyDefs()) {
      hasher.updateBigInt(hDef.hash());
    }
    this._hash = hasher.getHash();
    return this._hash;
  }
}

/**
 * Full implementation of a Catalog in the Cheap architecture. A catalog represents
 * either an external data source or a mirror/clone/fork of another catalog. A catalog
 * contains hierarchies of entities and their aspects.
 */
export class CatalogImpl extends LocalEntityOneCatalogImpl implements Catalog {
  /** The immutable species of this Catalog. */
  private readonly _species: CatalogSpecies;

  /** The mutable uri of this Catalog. */
  private _uri: URL | null = null;

  /** The upstream catalog this catalog mirrors, or null for root catalogs. */
  private readonly _upstream: string | null;

  /** The version number of this catalog. */
  private readonly _version: number;

  /** Directory of hierarchies contained in this catalog. */
  private readonly _hierarchies = new Map<string, Hierarchy>();

  /** Directory of aspect definitions available in this catalog. */
  private readonly _aspectage = new Map<string, AspectDef>();

  /**
   * Creates a new non-strict SINK catalog with a wrapper CatalogDef that
   * fully delegates to this catalog.
   */
  constructor();

  /**
   * Creates a new non-strict SINK catalog with a wrapper CatalogDef that
   * fully delegates to this catalog.
   */
  constructor(globalId: string);

  /**
   * Creates a new non-strict catalog with the specified species and upstream,
   * and a wrapper CatalogDef that fully delegates to this catalog.
   *
   * @throws Error if a SOURCE/SINK catalog has an upstream; or for other species, if it lacks one
   */
  constructor(species: CatalogSpecies, upstream: string | null);

  /**
   * Creates a new catalog with the specified definition and upstream catalog.
   *
   * @param globalId the global ID for this catalog
   * @param species the species of this catalog
   * @param upstream the upstream catalog to mirror, or null for root catalogs
   * @param version the version number of this catalog
   * @throws Error if a SOURCE/SINK catalog has an upstream; or for other species, if it lacks one
   */
  constructor(globalId: string, species: CatalogSpecies, upstream: string | null, version: number);

  constructor(
    globalIdOrSpecies?: string | CatalogSpecies,
    upstreamOrSpecies?: string | null | CatalogSpecies,
    upstream?: string | null,
    version?: number
  ) {
    let globalId: string;
    let species: CatalogSpecies;
    let upstreamId: string | null;
    let versionNum: number;

    if (globalIdOrSpecies === undefined) {
      // No-arg constructor
      globalId = randomUUID();
      species = CatalogSpecies.SINK;
      upstreamId = null;
      versionNum = 0;
    } else if (typeof globalIdOrSpecies === 'string' && upstreamOrSpecies === undefined) {
      // Constructor with globalId only
      globalId = globalIdOrSpecies;
      species = CatalogSpecies.SINK;
      upstreamId = null;
      versionNum = 0;
    } else if (
      typeof globalIdOrSpecies === 'string' &&
      typeof upstreamOrSpecies === 'string' &&
      upstream !== undefined &&
      version !== undefined
    ) {
      // Full constructor
      globalId = globalIdOrSpecies;
      species = upstreamOrSpecies as CatalogSpecies;
      upstreamId = upstream;
      versionNum = version;
    } else if (
      typeof globalIdOrSpecies === 'string' &&
      typeof upstreamOrSpecies === 'object' &&
      upstream === undefined &&
      version === undefined
    ) {
      // Constructor with species and upstream
      globalId = randomUUID();
      species = globalIdOrSpecies as CatalogSpecies;
      upstreamId = upstreamOrSpecies as string | null;
      versionNum = 0;
    } else {
      throw new Error('Invalid constructor arguments');
    }

    // Validate upstream relationship
    if (species === CatalogSpecies.SOURCE || species === CatalogSpecies.SINK) {
      if (upstreamId !== null) {
        throw new Error('Source and Sink catalogs may not have an upstream catalog.');
      }
    } else {
      if (upstreamId === null) {
        throw new Error(`${species} catalogs must have an upstream catalog.`);
      }
    }

    // Create a placeholder catalog that will be replaced with 'this' after construction
    // We use 'as any' here because we know we'll set it to 'this' immediately after
    super(globalId, null as any);

    this._species = species;
    this._upstream = upstreamId;
    this._version = versionNum;

    // Set catalog reference to self - CatalogImpl is its own catalog
    this._catalog = this;
  }

  species(): CatalogSpecies {
    return this._species;
  }

  uri(): URL | null {
    return this._uri;
  }

  /**
   * Set the URI of this catalog. Usually a URL, but need not be.
   *
   * @param uri the URI of this catalog
   */
  setUri(uri: URL): void {
    this._uri = uri;
  }

  upstream(): string | null {
    return this._upstream;
  }

  hierarchies(): Iterable<Hierarchy> {
    return this._hierarchies.values();
  }

  aspectDefs(): Iterable<AspectDef> {
    return this._aspectage.values();
  }

  hierarchy(name: string): Hierarchy | null {
    return this._hierarchies.get(name) ?? null;
  }

  addHierarchy(hierarchy: Hierarchy): Hierarchy | null {
    if (hierarchy.catalog() !== this) {
      throw new Error(
        'Cannot add a Hierarchy to a Catalog unless the Catalog is already set as the Hierarchy\'s owner.'
      );
    }
    const hName = hierarchy.name();
    const existing = this.hierarchy(hName);
    if (existing instanceof AspectMapHierarchyImpl) {
      throw new Error(
        'A hierarchy may not be added to a Catalog with the same name as an existing AspectMapHierarchy.'
      );
    }
    if (hierarchy instanceof AspectMapHierarchyImpl) {
      const aspectDef = hierarchy.aspectDef();
      this._aspectage.set(aspectDef.name(), aspectDef);
    }
    const replaced = this._hierarchies.get(hName) ?? null;
    this._hierarchies.set(hName, hierarchy);
    return replaced;
  }

  containsAspects(name: string): boolean {
    const h = this._hierarchies.get(name);
    return h instanceof AspectMapHierarchyImpl;
  }

  aspects(aspectDefOrName: AspectDef | string): AspectMapHierarchy | null {
    const name = typeof aspectDefOrName === 'string' ? aspectDefOrName : aspectDefOrName.name();
    const h = this.hierarchy(name);
    return h instanceof AspectMapHierarchyImpl ? h : null;
  }

  version(): number {
    return this._version;
  }

  extend(aspectDef: AspectDef): AspectMapHierarchy {
    const aMap = this.aspects(aspectDef);
    if (aMap !== null) {
      if (!aspectDef.fullyEquals(aMap.aspectDef())) {
        throw new Error(
          'A catalog may not be extended with a new AspectDef that is not identical to an existing AspectDef with the same name.'
        );
      }
      return aMap;
    }
    return new AspectMapHierarchyImpl(this, aspectDef);
  }
}
