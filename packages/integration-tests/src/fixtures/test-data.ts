/**
 * Test data fixtures for integration tests
 */
import { randomUUID } from "crypto";

/**
 * Generate a fixed UUID for deterministic tests
 * Uses a simple hash of the input string
 */
export function fixedUUID(seed: string): string {
  // Simple deterministic UUID generation for tests
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }

  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(0, 3)}-a${hex.slice(0, 3)}-${hex.slice(0, 12)}`;
}

/**
 * Sample AspectDef for Person
 */
export function createPersonAspectDef() {
  return {
    name: "Person",
    propertyDefs: [
      { name: "firstName", typeCode: "STRING" },
      { name: "lastName", typeCode: "STRING" },
      { name: "age", typeCode: "INT" },
      { name: "email", typeCode: "STRING" },
    ],
  };
}

/**
 * Sample AspectDef for Address
 */
export function createAddressAspectDef() {
  return {
    name: "Address",
    propertyDefs: [
      { name: "street", typeCode: "STRING" },
      { name: "city", typeCode: "STRING" },
      { name: "state", typeCode: "STRING" },
      { name: "zipCode", typeCode: "STRING" },
    ],
  };
}

/**
 * Sample AspectDef for Product
 */
export function createProductAspectDef() {
  return {
    name: "Product",
    propertyDefs: [
      { name: "name", typeCode: "STRING" },
      { name: "description", typeCode: "STRING" },
      { name: "price", typeCode: "DOUBLE" },
      { name: "inStock", typeCode: "BOOLEAN" },
    ],
  };
}

/**
 * Create sample Person aspect data
 */
export function createPersonAspect(firstName: string, lastName: string, age: number, email: string) {
  return {
    aspectDefName: "Person",
    properties: {
      firstName,
      lastName,
      age,
      email,
    },
  };
}

/**
 * Create sample Address aspect data
 */
export function createAddressAspect(street: string, city: string, state: string, zipCode: string) {
  return {
    aspectDefName: "Address",
    properties: {
      street,
      city,
      state,
      zipCode,
    },
  };
}

/**
 * Create sample Product aspect data
 */
export function createProductAspect(name: string, description: string, price: number, inStock: boolean) {
  return {
    aspectDefName: "Product",
    properties: {
      name,
      description,
      price,
      inStock,
    },
  };
}

/**
 * Create a catalog definition with hierarchies
 */
export function createCatalogDef(hierarchyDefs: Array<{ name: string; type: string }> = []) {
  return {
    species: "SINK",
    hierarchyDefs,
  };
}

/**
 * Generate multiple person aspects for bulk testing
 */
export function generatePersonAspects(count: number) {
  const aspects = [];
  for (let i = 0; i < count; i++) {
    aspects.push(
      createPersonAspect(`First${i}`, `Last${i}`, 20 + (i % 50), `person${i}@example.com`)
    );
  }
  return aspects;
}

/**
 * Generate multiple product aspects for bulk testing
 */
export function generateProductAspects(count: number) {
  const aspects = [];
  for (let i = 0; i < count; i++) {
    aspects.push(
      createProductAspect(
        `Product ${i}`,
        `Description for product ${i}`,
        (i + 1) * 10.99,
        i % 2 === 0
      )
    );
  }
  return aspects;
}
