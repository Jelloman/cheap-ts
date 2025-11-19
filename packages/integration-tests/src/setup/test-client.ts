/**
 * Test client wrapper that adapts the CheapRestClient API
 * for integration test convenience
 */
import { CheapRestClient } from "@cheap-ts/rest-client";

/**
 * Extended client with test-friendly methods
 */
export class TestClient {
  constructor(private client: CheapRestClient) {}

  // Catalog operations
  async createCatalog(catalogDef: any) {
    const response = await this.client.createCatalog();
    return { catalogId: response.id };
  }

  async getCatalog(catalogId: string) {
    return this.client.getCatalog(catalogId);
  }

  async listCatalogs(params?: { limit?: number; offset?: number }) {
    const response = await this.client.listCatalogs();
    return response.catalogs;
  }

  async getCatalogDefinition(catalogId: string) {
    const catalog = await this.client.getCatalog(catalogId);
    return {
      species: catalog.species,
      hierarchyDefs: catalog.hierarchyDefs || [],
    };
  }

  async deleteCatalog(catalogId: string) {
    return this.client.deleteCatalog(catalogId);
  }

  // AspectDef operations
  async createAspectDef(catalogId: string, aspectDef: any) {
    const response = await this.client.addAspectDef(catalogId, aspectDef);
    return { aspectDefId: response.id };
  }

  async getAspectDef(catalogId: string, aspectDefId: string) {
    return this.client.getAspectDef(catalogId, aspectDefId);
  }

  async getAspectDefByName(catalogId: string, name: string) {
    return this.client.getAspectDefByName(catalogId, name);
  }

  async listAspectDefs(catalogId: string, params?: { limit?: number; offset?: number }) {
    const response = await this.client.listAspectDefs(
      catalogId,
      params?.offset || 0,
      params?.limit || 20
    );
    return response.aspectDefs;
  }

  // Aspect operations
  async upsertAspect(
    catalogId: string,
    aspectDefId: string,
    properties: any,
    entityId?: string
  ) {
    // Get AspectDef to find its name
    const aspectDef = await this.client.getAspectDef(catalogId, aspectDefId);

    const aspect: any = {
      aspectDefName: aspectDef.name,
      properties,
    };

    if (entityId) {
      aspect.entityId = entityId;
    }

    const response = await this.client.upsertAspects(catalogId, aspectDef.name, [aspect]);

    return {
      entityId: response.results[0].entityId,
      created: response.results[0].created,
    };
  }

  async queryAspects(catalogId: string, aspectDefId: string, options?: any) {
    // Get AspectDef to find its name
    const aspectDef = await this.client.getAspectDef(catalogId, aspectDefId);

    const response = await this.client.queryAspects(
      catalogId,
      aspectDef.name,
      options?.entityIds
    );

    return {
      aspects: response.aspects.map((a: any) => ({
        entityId: a.entityId,
        properties: a.properties,
      })),
    };
  }

  // Hierarchy operations
  async getHierarchy(catalogId: string, hierarchyName: string, options?: any) {
    const response = await this.client.getHierarchy(
      catalogId,
      hierarchyName,
      options?.offset || 0,
      options?.limit || 100
    );

    return {
      type: response.type,
      entityIds: response.entities || [],
      entries: response.entries || {},
      tree: response.type === "ENTITY_TREE" ? {} : undefined,
      aspects: response.type === "ASPECT_MAP" ? {} : undefined,
    };
  }

  async addEntityIdsToHierarchy(catalogId: string, hierarchyName: string, entityIds: string[]) {
    return this.client.addEntityIds(catalogId, hierarchyName, entityIds);
  }

  async removeEntityIdsFromHierarchy(
    catalogId: string,
    hierarchyName: string,
    entityIds: string[]
  ) {
    return this.client.removeEntityIds(catalogId, hierarchyName, entityIds);
  }

  async addDirectoryEntries(catalogId: string, hierarchyName: string, entries: any[]) {
    return this.client.addDirectoryEntries(catalogId, hierarchyName, entries);
  }

  async removeDirectoryEntriesByNames(catalogId: string, hierarchyName: string, names: string[]) {
    return this.client.removeDirectoryEntriesByNames(catalogId, hierarchyName, names);
  }

  async removeDirectoryEntriesByEntityIds(
    catalogId: string,
    hierarchyName: string,
    entityIds: string[]
  ) {
    return this.client.removeDirectoryEntriesByEntityIds(catalogId, hierarchyName, entityIds);
  }

  async addTreeNode(catalogId: string, hierarchyName: string, path: string, entityId: string) {
    // Tree operations not yet implemented in REST client
    // Placeholder for now
    throw new Error("Tree operations not yet implemented");
  }
}
