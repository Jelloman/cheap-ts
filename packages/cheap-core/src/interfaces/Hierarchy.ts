/**
 * Hierarchy interfaces
 */

import { Entity } from './Entity.js';
import { Aspect } from './Aspect.js';
import { HierarchyType } from '../types.js';

export interface Hierarchy {
  readonly type: HierarchyType;
  readonly name: string;
}

export interface EntityListHierarchy extends Hierarchy {
  readonly entities: readonly Entity[];
}

export interface EntitySetHierarchy extends Hierarchy {
  readonly entities: ReadonlySet<Entity>;
}

export interface EntityDirectoryHierarchy extends Hierarchy {
  readonly entries: ReadonlyMap<string, Entity>;
}

export interface EntityTreeHierarchy extends Hierarchy {
  readonly root: Entity | null;
  getChildren(entity: Entity): readonly Entity[];
  getParent(entity: Entity): Entity | null;
}

export interface AspectMapHierarchy extends Hierarchy {
  readonly aspects: ReadonlyMap<string, Aspect>;
}
