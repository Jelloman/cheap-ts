/**
 * HierarchyDef implementation
 */

import { HierarchyDef } from "../interfaces/Hierarchy.js";
import { HierarchyType } from "../types.js";
import { CheapHasher } from "../util/CheapHasher.js";

/**
 * Record-based implementation of HierarchyDef that defines the structure and
 * properties of a hierarchy in the Cheap system.
 */
export class HierarchyDefImpl implements HierarchyDef {
  private readonly _name: string;
  private readonly _type: HierarchyType;
  private _cachedHash: bigint | null = null;

  /**
   * Creates a new HierarchyDefImpl.
   *
   * @param name the name of the hierarchy
   * @param type the type of hierarchy
   */
  constructor(name: string, type: HierarchyType) {
    if (!name) {
      throw new Error("HierarchyDef name cannot be null or empty");
    }
    if (!type) {
      throw new Error("HierarchyDef type cannot be null");
    }
    this._name = name;
    this._type = type;
  }

  /**
   * Returns the unique name identifier for this hierarchy definition.
   */
  name(): string {
    return this._name;
  }

  /**
   * Returns the type of hierarchy this definition describes.
   */
  type(): HierarchyType {
    return this._type;
  }

  /**
   * Generate a Cheap-specific FNV-1a hash of this HierarchyDef.
   * This hash should be consistent across all Cheap implementations.
   *
   * This implementation caches the result for improved performance.
   */
  hash(): bigint {
    if (this._cachedHash === null) {
      const hasher = new CheapHasher();
      hasher.update(this._name);
      hasher.update(this._type);
      this._cachedHash = hasher.getHash();
    }
    return this._cachedHash;
  }

  /**
   * Checks equality based on name and type.
   */
  equals(other: unknown): boolean {
    if (this === other) {
      return true;
    }
    if (typeof other !== "object" || other === null) {
      return false;
    }
    if (!("name" in other && "type" in other)) {
      return false;
    }
    const otherDef = other as HierarchyDef;
    return this._name === otherDef.name() && this._type === otherDef.type();
  }

  /**
   * Returns a string representation of this HierarchyDef.
   */
  toString(): string {
    return `HierarchyDef{name=${this._name}, type=${this._type}}`;
  }
}
