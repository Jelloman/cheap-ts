/**
 * Complex workflow integration tests
 * Tests complete scenarios through the REST API
 */
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { getTestServer } from "../../setup/jest.setup.js";
import { createCatalogDef, createPersonAspectDef, createAddressAspectDef } from "../../fixtures/test-data.js";

describe("Complex Workflows", () => {
  let catalogId: string;

  beforeAll(async () => {
    const server = getTestServer();

    // Create catalog with multiple hierarchies
    const catalogDef = createCatalogDef([
      { name: "people", type: "ENTITY_LIST" },
      { name: "addresses", type: "ENTITY_DIR" },
      { name: "organizational", type: "ENTITY_TREE" },
    ]);

    const response = await server.client.createCatalog(catalogDef);
    catalogId = response.catalogId;
  });

  afterAll(async () => {
    const server = getTestServer();
    try {
      await server.client.deleteCatalog(catalogId);
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should execute complete person management workflow", async () => {
    const server = getTestServer();

    // Step 1: Create AspectDefs
    const personAspectDef = createPersonAspectDef();
    const addressAspectDef = createAddressAspectDef();

    const personDefResponse = await server.client.createAspectDef(catalogId, personAspectDef);
    const addressDefResponse = await server.client.createAspectDef(catalogId, addressAspectDef);

    const personDefId = personDefResponse.aspectDefId;
    const addressDefId = addressDefResponse.aspectDefId;

    // Step 2: Create person entities
    const johnPerson = await server.client.upsertAspect(catalogId, personDefId, {
      firstName: "John",
      lastName: "Doe",
      age: 30,
      email: "john.doe@example.com",
    });

    const janePerson = await server.client.upsertAspect(catalogId, personDefId, {
      firstName: "Jane",
      lastName: "Smith",
      age: 28,
      email: "jane.smith@example.com",
    });

    expect(johnPerson.entityId).toBeDefined();
    expect(janePerson.entityId).toBeDefined();

    // Step 3: Add addresses to the same entities
    await server.client.upsertAspect(
      catalogId,
      addressDefId,
      {
        street: "123 Main St",
        city: "Springfield",
        state: "IL",
        zipCode: "62701",
      },
      johnPerson.entityId
    );

    await server.client.upsertAspect(
      catalogId,
      addressDefId,
      {
        street: "456 Oak Ave",
        city: "Portland",
        state: "OR",
        zipCode: "97201",
      },
      janePerson.entityId
    );

    // Step 4: Add entities to people list hierarchy
    await server.client.addEntityIdsToHierarchy(catalogId, "people", [
      johnPerson.entityId,
      janePerson.entityId,
    ]);

    // Step 5: Add entries to address directory
    await server.client.addDirectoryEntries(catalogId, "addresses", [
      { name: "john_home", entityId: johnPerson.entityId },
      { name: "jane_home", entityId: janePerson.entityId },
    ]);

    // Step 6: Query and verify
    const peopleList = await server.client.getHierarchy(catalogId, "people");
    expect(peopleList.entityIds).toContain(johnPerson.entityId);
    expect(peopleList.entityIds).toContain(janePerson.entityId);

    const addressDir = await server.client.getHierarchy(catalogId, "addresses");
    expect(addressDir.entries["john_home"]).toBe(johnPerson.entityId);
    expect(addressDir.entries["jane_home"]).toBe(janePerson.entityId);

    // Step 7: Query aspects to get full data
    const personAspects = await server.client.queryAspects(catalogId, personDefId, {
      entityIds: [johnPerson.entityId, janePerson.entityId],
    });

    expect(personAspects.aspects.length).toBe(2);

    const addressAspects = await server.client.queryAspects(catalogId, addressDefId, {
      entityIds: [johnPerson.entityId, janePerson.entityId],
    });

    expect(addressAspects.aspects.length).toBe(2);

    // Step 8: Update a person's information
    const updatedJohn = await server.client.upsertAspect(
      catalogId,
      personDefId,
      {
        firstName: "John",
        lastName: "Doe",
        age: 31, // Updated age
        email: "john.doe@example.com",
      },
      johnPerson.entityId
    );

    expect(updatedJohn.created).toBe(false); // Should be an update, not create
    expect(updatedJohn.entityId).toBe(johnPerson.entityId);

    // Step 9: Remove a person from the list
    await server.client.removeEntityIdsFromHierarchy(catalogId, "people", [janePerson.entityId]);

    const updatedPeopleList = await server.client.getHierarchy(catalogId, "people");
    expect(updatedPeopleList.entityIds).toContain(johnPerson.entityId);
    expect(updatedPeopleList.entityIds).not.toContain(janePerson.entityId);
  });

  it("should handle multi-aspect entities correctly", async () => {
    const server = getTestServer();

    // Create two AspectDefs
    const def1 = {
      name: "Profile",
      propertyDefs: [{ name: "username", typeCode: "STRING" }],
    };

    const def2 = {
      name: "Settings",
      propertyDefs: [{ name: "theme", typeCode: "STRING" }],
    };

    const def1Response = await server.client.createAspectDef(catalogId, def1);
    const def2Response = await server.client.createAspectDef(catalogId, def2);

    // Create entity with first aspect
    const profileResponse = await server.client.upsertAspect(catalogId, def1Response.aspectDefId, {
      username: "testuser",
    });

    const entityId = profileResponse.entityId;

    // Add second aspect to same entity
    await server.client.upsertAspect(
      catalogId,
      def2Response.aspectDefId,
      { theme: "dark" },
      entityId
    );

    // Query both aspects
    const profileAspects = await server.client.queryAspects(catalogId, def1Response.aspectDefId, {
      entityIds: [entityId],
    });

    const settingsAspects = await server.client.queryAspects(catalogId, def2Response.aspectDefId, {
      entityIds: [entityId],
    });

    expect(profileAspects.aspects[0].entityId).toBe(entityId);
    expect(profileAspects.aspects[0].properties.username).toBe("testuser");

    expect(settingsAspects.aspects[0].entityId).toBe(entityId);
    expect(settingsAspects.aspects[0].properties.theme).toBe("dark");
  });

  it("should handle catalog with upstream reference workflow", async () => {
    const server = getTestServer();

    // Create upstream catalog
    const upstreamDef = createCatalogDef();
    const upstreamResponse = await server.client.createCatalog(upstreamDef);
    const upstreamId = upstreamResponse.catalogId;

    try {
      // Create AspectDef in upstream
      const aspectDef = {
        name: "SharedData",
        propertyDefs: [{ name: "value", typeCode: "STRING" }],
      };
      const aspectDefResponse = await server.client.createAspectDef(upstreamId, aspectDef);

      // Create entity in upstream
      const entityResponse = await server.client.upsertAspect(
        upstreamId,
        aspectDefResponse.aspectDefId,
        { value: "upstream data" }
      );

      // Create downstream catalog
      const downstreamDef = {
        ...createCatalogDef(),
        upstream: upstreamId,
      };
      const downstreamResponse = await server.client.createCatalog(downstreamDef);
      const downstreamId = downstreamResponse.catalogId;

      try {
        // Verify upstream reference
        const downstream = await server.client.getCatalog(downstreamId);
        expect(downstream.upstream).toBe(upstreamId);

        // Note: Actual upstream data inheritance would depend on implementation
        // This test just verifies the upstream reference is stored correctly
      } finally {
        await server.client.deleteCatalog(downstreamId);
      }
    } finally {
      await server.client.deleteCatalog(upstreamId);
    }
  });
});
