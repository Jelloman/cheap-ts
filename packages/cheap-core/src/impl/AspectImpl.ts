/**
 * Aspect implementation classes
 */

import { Aspect, AspectDef, Entity, Property } from "../interfaces/index.js";
import { PropertyImpl } from "./PropertyImpl.js";

/**
 * Abstract base class for Aspect implementations providing common functionality.
 * This class manages the basic relationships between an aspect, its entity
 * and aspect definition.
 */
export abstract class AspectBaseImpl implements Aspect {
  protected _entity: Entity | null;
  protected readonly _def: AspectDef;

  /**
   * Creates a new AspectBaseImpl with the specified entity and aspect definition.
   */
  protected constructor(entity: Entity | null, def: AspectDef) {
    if (!def) {
      throw new Error("Aspect may not have a null AspectDef.");
    }
    this._entity = entity;
    this._def = def;
  }

  entity(): Entity {
    if (!this._entity) {
      throw new Error("Aspect does not have an entity assigned.");
    }
    return this._entity;
  }

  /**
   * Set the entity that owns this aspect. If the entity is already set
   * and this is not flagged as transferable, an Error will be thrown.
   */
  setEntity(entity: Entity): void {
    if (!entity) {
      throw new Error("Aspects may not be assigned a null entity.");
    }
    if (this._entity && this._entity !== entity && !this.isTransferable()) {
      throw new Error("An Aspect flagged as non-transferable may not be reassigned to a different entity.");
    }
    this._entity = entity;
  }

  def(): AspectDef {
    return this._def;
  }

  isTransferable(): boolean {
    return false;
  }

  // Abstract methods that subclasses must implement
  abstract unsafeReadObj(propName: string): unknown;
  abstract unsafeWrite(propName: string, value: unknown): void;
  abstract unsafeAdd(prop: Property): void;
  abstract unsafeRemove(propName: string): void;

  // Default implementations using safe methods

  contains(propName: string): boolean {
    return this.unsafeReadObj(propName) != null;
  }

  uncheckedRead<T>(propName: string): T {
    return this.readObj(propName) as T;
  }

  unsafeRead<T>(propName: string): T {
    return this.unsafeReadObj(propName) as T;
  }

  readObj(propName: string): unknown {
    const def = this.def();
    if (!def.isReadable()) {
      throw new Error(`Aspect '${def.name()}' is not readable.`);
    }
    const propDef = def.propertyDef(propName);
    if (!propDef) {
      throw new Error(`Aspect '${def.name()}' does not contain prop named '${propName}'.`);
    }
    if (!propDef.isReadable()) {
      throw new Error(`Property '${propName}' in Aspect '${def.name()}' is not readable.`);
    }
    return this.unsafeReadObj(propName);
  }

  readAs<T>(propName: string): T {
    const def = this.def();
    const propDef = def.propertyDef(propName);
    if (!propDef) {
      throw new Error(`Aspect '${def.name()}' does not contain prop named '${propName}'.`);
    }
    const objVal = this.unsafeReadObj(propName);
    return objVal as T;
  }

  get(propName: string): Property {
    const def = this.def();
    const name = def.name();
    if (!def.isReadable()) {
      throw new Error(`Aspect '${name}' is not readable.`);
    }
    const propDef = def.propertyDef(propName);
    if (!propDef) {
      throw new Error(`Aspect '${name}' does not contain prop named '${propName}'.`);
    }
    if (!propDef.isReadable()) {
      throw new Error(`Property '${propName}' in Aspect '${name}' is not readable.`);
    }
    return new PropertyImpl(propDef, this.unsafeReadObj(propName));
  }

  put(prop: Property): void {
    const def = this.def();
    const name = def.name();
    const propName = prop.def().name();
    const propDef = def.propertyDef(propName);

    if (!propDef) {
      if (!def.canAddProperties()) {
        throw new Error(`Aspect '${name}' does not support adding properties.`);
      }
      this.unsafeAdd(prop);
    } else {
      if (!def.isWritable()) {
        throw new Error(`Aspect '${name}' is not writable.`);
      }
      if (!propDef.isWritable()) {
        throw new Error(`Property '${propName}' in Aspect '${name}' is not writable.`);
      }
      this.unsafeWrite(propName, prop.unsafeRead());
    }
  }

  remove(prop: Property): void {
    const def = this.def();
    const name = def.name();
    if (!def.canRemoveProperties()) {
      throw new Error(`Aspect '${name}' does not support property removal.`);
    }
    const propDef = prop.def();
    const propName = propDef.name();
    const currProp = this.get(propName);
    if (!currProp) {
      throw new Error(`Aspect '${name}' does not contain a property named '${propName}'.`);
    }
    const currDef = currProp.def();
    if (currDef !== propDef && !currDef.fullyEquals(propDef)) {
      throw new Error(
        `PropertyDef '${propName}' is not equal to existing PropertyDef '${currDef.name()}' in Aspect '${name}'.`,
      );
    }
    if (!currDef.isRemovable()) {
      throw new Error(`Property '${propName}' in Aspect '${name}' is not removable.`);
    }
    this.unsafeRemove(propName);
  }

  write(propName: string, value: unknown): void {
    const def = this.def();
    const name = def.name();
    if (!def.isWritable()) {
      throw new Error(`Aspect '${name}' is not writable.`);
    }
    const currProp = this.get(propName);
    if (!currProp) {
      throw new Error(`Aspect '${name}' does not contain prop named '${propName}'.`);
    }
    const currDef = currProp.def();
    if (!currDef.isWritable()) {
      throw new Error(`Property '${propName}' in Aspect '${name}' is not writable.`);
    }
    if (value == null && !currDef.isNullable()) {
      throw new Error(`Property '${propName}' in Aspect '${name}' is not nullable.`);
    }
    this.unsafeWrite(propName, value);
  }

  putAll(properties: Iterable<Property>): void {
    for (const prop of properties) {
      this.put(prop);
    }
  }

  unsafeWriteAll(properties: Iterable<Property>): void {
    for (const prop of properties) {
      const def = prop.def();
      this.unsafeWrite(def.name(), prop.unsafeRead());
    }
  }
}

/**
 * Implementation of an Aspect that stores properties as Property objects in a Map.
 * This implementation provides type-safe property access and validation while maintaining
 * insertion order.
 */
export class AspectPropertyMapImpl extends AspectBaseImpl {
  protected readonly props: Map<string, Property>;

  constructor(entity: Entity | null, def: AspectDef) {
    super(entity, def);
    this.props = new Map();
  }

  contains(propName: string): boolean {
    if (this.props.has(propName)) {
      return true;
    }
    const propDef = this._def.propertyDef(propName);
    return propDef != null && propDef.hasDefaultValue();
  }

  unsafeReadObj(propName: string): unknown {
    if (this.props.has(propName)) {
      return this.props.get(propName)!.unsafeRead();
    }
    const propDef = this._def.propertyDef(propName);
    return propDef && propDef.hasDefaultValue() ? propDef.defaultValue() : null;
  }

  get(propName: string): Property {
    const def = this.def();
    const name = def.name();
    if (!def.isReadable()) {
      throw new Error(`Aspect '${name}' is not readable.`);
    }
    const prop = this.props.get(propName);
    if (prop) {
      if (!prop.def().isReadable()) {
        throw new Error(`Property '${propName}' is not readable.`);
      }
      return prop;
    }
    const propDef = def.propertyDef(propName);
    if (!propDef || !propDef.hasDefaultValue()) {
      throw new Error(`Aspect '${name}' does not contain prop named '${propName}'.`);
    }
    return new PropertyImpl(propDef, propDef.defaultValue());
  }

  put(prop: Property): void {
    const def = this.def();
    const aspectName = def.name();
    if (!def.isWritable()) {
      throw new Error(`Aspect '${aspectName}' is not writable.`);
    }
    const propName = prop.def().name();
    const stdPropDef = def.propertyDef(propName);

    if (!stdPropDef) {
      if (!def.canAddProperties()) {
        throw new Error(`Aspect '${aspectName}' does not contain prop named '${propName}' and is not extensible.`);
      }
      if (!prop.def().isWritable()) {
        throw new Error(`Provided property '${propName}' is marked not writable.`);
      }
    } else {
      if (!stdPropDef.isWritable()) {
        throw new Error(`Property '${propName}' is not writable.`);
      }
      if (!stdPropDef.fullyEquals(prop.def())) {
        throw new Error(`Provided definition of '${propName}' conflicts with the existing definition.`);
      }
    }
    this.props.set(propName, prop);
  }

  unsafeAdd(prop: Property): void {
    this.props.set(prop.def().name(), prop);
  }

  unsafeWrite(propName: string, value: unknown): void {
    const def = this.def();
    const stdPropDef = def.propertyDef(propName);

    if (stdPropDef) {
      // ignore and replace any current prop
      this.props.set(propName, new PropertyImpl(stdPropDef, value));
    } else {
      const prop = this.props.get(propName);
      if (!prop) {
        throw new Error(`Aspect '${def.name()}' does not contain prop named '${propName}'`);
      }
      this.props.set(propName, new PropertyImpl(prop.def(), value));
    }
  }

  unsafeRemove(propName: string): void {
    this.props.delete(propName);
  }
}

/**
 * Basic implementation of an Aspect that stores property values directly in a Map.
 * This is more memory-efficient than AspectPropertyMapImpl but provides less type safety.
 */
export class AspectObjectMapImpl extends AspectBaseImpl {
  protected readonly props: Map<string, unknown>;

  constructor(entity: Entity | null, def: AspectDef) {
    super(entity, def);
    this.props = new Map();
  }

  contains(propName: string): boolean {
    if (this.props.has(propName)) {
      return true;
    }
    const propDef = this._def.propertyDef(propName);
    return propDef != null && propDef.hasDefaultValue();
  }

  unsafeReadObj(propName: string): unknown {
    if (this.props.has(propName)) {
      return this.props.get(propName);
    }
    const propDef = this._def.propertyDef(propName);
    return propDef && propDef.hasDefaultValue() ? propDef.defaultValue() : null;
  }

  unsafeAdd(prop: Property): void {
    this.props.set(prop.def().name(), prop.unsafeRead());
  }

  unsafeWrite(propName: string, value: unknown): void {
    const def = this.def();
    const stdPropDef = def.propertyDef(propName);
    if (!stdPropDef) {
      throw new Error(`Aspect '${def.name()}' does not contain prop named '${propName}'`);
    }
    this.props.set(propName, value);
  }

  unsafeRemove(propName: string): void {
    this.props.delete(propName);
  }
}
