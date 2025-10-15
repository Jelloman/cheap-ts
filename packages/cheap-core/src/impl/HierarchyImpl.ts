/**
 * Hierarchy implementation stubs
 */

import {
  Hierarchy,
  EntityListHierarchy,
  EntitySetHierarchy,
  EntityDirectoryHierarchy,
  EntityTreeHierarchy,
  AspectMapHierarchy,
  Entity,
  Aspect,
} from '../interfaces/index.js';
import { HierarchyType } from '../types.js';

export abstract class BaseHierarchy implements Hierarchy {
  constructor(
    public readonly type: HierarchyType,
    public readonly name: string
  ) {}
}

export class EntityListHierarchyImpl extends BaseHierarchy implements EntityListHierarchy {
  constructor(
    name: string,
    public readonly entities: readonly Entity[]
  ) {
    super(HierarchyType.LIST, name);
  }
}

export class EntitySetHierarchyImpl extends BaseHierarchy implements EntitySetHierarchy {
  constructor(
    name: string,
    public readonly entities: ReadonlySet<Entity>
  ) {
    super(HierarchyType.SET, name);
  }
}

export class EntityDirectoryHierarchyImpl extends BaseHierarchy implements EntityDirectoryHierarchy {
  constructor(
    name: string,
    public readonly entries: ReadonlyMap<string, Entity>
  ) {
    super(HierarchyType.DIRECTORY, name);
  }
}

export class EntityTreeHierarchyImpl extends BaseHierarchy implements EntityTreeHierarchy {
  constructor(
    name: string,
    public readonly root: Entity | null
  ) {
    super(HierarchyType.TREE, name);
  }

  getChildren(_entity: Entity): readonly Entity[] {
    throw new Error('Not implemented');
  }

  getParent(_entity: Entity): Entity | null {
    throw new Error('Not implemented');
  }
}

export class AspectMapHierarchyImpl extends BaseHierarchy implements AspectMapHierarchy {
  constructor(
    name: string,
    public readonly aspects: ReadonlyMap<string, Aspect>
  ) {
    super(HierarchyType.ASPECT_MAP, name);
  }
}
