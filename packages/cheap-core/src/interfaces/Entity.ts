/**
 * Entity interfaces
 */

import { Aspect } from './Aspect.js';

export interface Entity {
  readonly id: string;
  readonly globalId: string;
  readonly aspects: ReadonlyMap<string, Aspect>;
}

export interface LocalEntity extends Entity {
  readonly catalogId: string;
}
