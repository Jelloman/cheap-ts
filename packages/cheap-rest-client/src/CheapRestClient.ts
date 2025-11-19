/**
 * REST API client for CHEAP model
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import type { AspectDefJson, AspectJson } from "@cheap-ts/json";

/**
 * Configuration for CheapRestClient
 */
export interface CheapRestClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Response from catalog creation
 */
export interface CreateCatalogResponse {
  id: string;
  species: string;
  created: string;
}

/**
 * Response from catalog list
 */
export interface CatalogListResponse {
  catalogs: Array<{ id: string; species: string }>;
  total: number;
}

/**
 * Response from aspect upsert
 */
export interface UpsertAspectsResponse {
  aspectDefName: string;
  results: Array<{ entityId: string; created: boolean }>;
  total: number;
}

/**
 * Response from aspect query
 */
export interface AspectQueryResponse {
  aspectDefName: string;
  aspects: AspectJson[];
  total: number;
}

/**
 * Response from AspectDef list
 */
export interface AspectDefListResponse {
  aspectDefs: AspectDefJson[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

/**
 * Response from hierarchy query
 */
export interface HierarchyResponse {
  type: string;
  name: string;
  entities?: string[];
  entries?: Record<string, string>;
  page?: number;
  size?: number;
  total?: number;
}

/**
 * Response from entity ID operations
 */
export interface EntityIdsOperationResponse {
  added?: number;
  removed?: number;
  total: number;
}

/**
 * Response from directory operations
 */
export interface DirectoryOperationResponse {
  added?: number;
  removed?: number;
  total: number;
}

/**
 * Directory entry for hierarchy mutations
 */
export interface DirectoryEntry {
  name: string;
  entityId: string;
}

/**
 * REST API client exception
 */
export class CheapRestClientException extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: any,
  ) {
    super(message);
    this.name = "CheapRestClientException";
  }
}

/**
 * Type-safe REST API client for CHEAP model
 */
export class CheapRestClient {
  private readonly axios: AxiosInstance;

  constructor(config: CheapRestClientConfig) {
    this.axios = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    });

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const data = error.response.data as any;
          throw new CheapRestClientException(
            data?.error || error.message,
            error.response.status,
            error.response.data,
          );
        }
        throw new CheapRestClientException(error.message);
      },
    );
  }

  // Catalog operations

  async createCatalog(): Promise<CreateCatalogResponse> {
    const response = await this.axios.post<CreateCatalogResponse>("/catalogs");
    return response.data;
  }

  async listCatalogs(): Promise<CatalogListResponse> {
    const response = await this.axios.get<CatalogListResponse>("/catalogs");
    return response.data;
  }

  async getCatalog(catalogId: string): Promise<any> {
    const response = await this.axios.get(`/catalogs/${catalogId}`);
    return response.data;
  }

  async deleteCatalog(catalogId: string): Promise<void> {
    await this.axios.delete(`/catalogs/${catalogId}`);
  }

  // AspectDef operations

  async addAspectDef(catalogId: string, aspectDef: AspectDefJson): Promise<{ id: string; name: string; created: string }> {
    const response = await this.axios.post(`/catalogs/${catalogId}/aspect-defs`, aspectDef);
    return response.data;
  }

  async listAspectDefs(catalogId: string, page = 0, size = 20): Promise<AspectDefListResponse> {
    const response = await this.axios.get<AspectDefListResponse>(
      `/catalogs/${catalogId}/aspect-defs`,
      { params: { page, size } },
    );
    return response.data;
  }

  async getAspectDef(catalogId: string, aspectDefId: string): Promise<AspectDefJson> {
    const response = await this.axios.get<AspectDefJson>(
      `/catalogs/${catalogId}/aspect-defs/${aspectDefId}`,
    );
    return response.data;
  }

  async getAspectDefByName(catalogId: string, name: string): Promise<AspectDefJson> {
    const response = await this.axios.get<AspectDefJson>(
      `/catalogs/${catalogId}/aspect-defs/by-name/${name}`,
    );
    return response.data;
  }

  // Aspect operations

  async upsertAspects(
    catalogId: string,
    aspectDefName: string,
    aspects: AspectJson[],
  ): Promise<UpsertAspectsResponse> {
    const response = await this.axios.post<UpsertAspectsResponse>(
      `/catalogs/${catalogId}/aspects`,
      { aspectDefName, aspects },
    );
    return response.data;
  }

  async queryAspects(
    catalogId: string,
    aspectDefName: string,
    entityIds?: string[],
  ): Promise<AspectQueryResponse> {
    const response = await this.axios.get<AspectQueryResponse>(
      `/catalogs/${catalogId}/aspects`,
      {
        params: {
          aspectDefName,
          entityIds,
        },
      },
    );
    return response.data;
  }

  // Hierarchy query operations

  async getHierarchy(
    catalogId: string,
    hierarchyName: string,
    page = 0,
    size = 20,
  ): Promise<HierarchyResponse> {
    const response = await this.axios.get<HierarchyResponse>(
      `/catalogs/${catalogId}/hierarchies/${hierarchyName}`,
      { params: { page, size } },
    );
    return response.data;
  }

  // Hierarchy mutation - Entity List/Set operations

  async addEntityIds(
    catalogId: string,
    hierarchyName: string,
    entityIds: string[],
  ): Promise<EntityIdsOperationResponse> {
    const response = await this.axios.post<EntityIdsOperationResponse>(
      `/catalogs/${catalogId}/hierarchies/${hierarchyName}/entity-ids`,
      { entityIds },
    );
    return response.data;
  }

  async removeEntityIds(
    catalogId: string,
    hierarchyName: string,
    entityIds: string[],
  ): Promise<EntityIdsOperationResponse> {
    const response = await this.axios.delete<EntityIdsOperationResponse>(
      `/catalogs/${catalogId}/hierarchies/${hierarchyName}/entity-ids`,
      { data: { entityIds } },
    );
    return response.data;
  }

  // Hierarchy mutation - Entity Directory operations

  async addDirectoryEntries(
    catalogId: string,
    hierarchyName: string,
    entries: DirectoryEntry[],
  ): Promise<DirectoryOperationResponse> {
    const response = await this.axios.post<DirectoryOperationResponse>(
      `/catalogs/${catalogId}/hierarchies/${hierarchyName}/directory-entries`,
      { entries },
    );
    return response.data;
  }

  async removeDirectoryEntriesByNames(
    catalogId: string,
    hierarchyName: string,
    names: string[],
  ): Promise<DirectoryOperationResponse> {
    const response = await this.axios.delete<DirectoryOperationResponse>(
      `/catalogs/${catalogId}/hierarchies/${hierarchyName}/directory-entries/by-names`,
      { data: { names } },
    );
    return response.data;
  }

  async removeDirectoryEntriesByEntityIds(
    catalogId: string,
    hierarchyName: string,
    entityIds: string[],
  ): Promise<DirectoryOperationResponse> {
    const response = await this.axios.delete<DirectoryOperationResponse>(
      `/catalogs/${catalogId}/hierarchies/${hierarchyName}/directory-entries/by-entity-ids`,
      { data: { entityIds } },
    );
    return response.data;
  }

  // Hierarchy mutation - Entity Tree operations (placeholders)

  async addTreeNodes(
    catalogId: string,
    hierarchyName: string,
    parentPath: string,
    nodes: any[],
  ): Promise<any> {
    const response = await this.axios.post(
      `/catalogs/${catalogId}/hierarchies/${hierarchyName}/tree-nodes`,
      { parentPath, nodes },
    );
    return response.data;
  }

  async removeTreeNodes(
    catalogId: string,
    hierarchyName: string,
    paths: string[],
  ): Promise<any> {
    const response = await this.axios.delete(
      `/catalogs/${catalogId}/hierarchies/${hierarchyName}/tree-nodes`,
      { data: { paths } },
    );
    return response.data;
  }
}
