/**
 * Simple test script to verify CheapHasher implementation
 * Run with: node test-hasher.mjs
 */

import { CheapHasher } from './packages/cheap-core/dist/util/CheapHasher.js';

console.log('Testing CheapHasher...\n');

// Test basic string hashing
const str1 = "hello";
const str2 = "world";
const hash1 = CheapHasher.hashString(str1);
const hash2 = CheapHasher.hashString(str2);

console.log(`Hash of "${str1}": ${hash1}`);
console.log(`Hash of "${str2}": ${hash2}`);
console.log(`Hashes are different: ${hash1 !== hash2}\n`);

// Test number hashing
const num1 = 12345;
const num2 = 67890;
const numHash1 = CheapHasher.hashNumber(num1);
const numHash2 = CheapHasher.hashNumber(num2);

console.log(`Hash of ${num1}: ${numHash1}`);
console.log(`Hash of ${num2}: ${numHash2}`);
console.log(`Hashes are different: ${numHash1 !== numHash2}\n`);

// Test boolean hashing
const boolHash1 = CheapHasher.hashBoolean(true);
const boolHash2 = CheapHasher.hashBoolean(false);

console.log(`Hash of true: ${boolHash1}`);
console.log(`Hash of false: ${boolHash2}`);
console.log(`Hashes are different: ${boolHash1 !== boolHash2}\n`);

// Test rolling hash
const hasher = new CheapHasher();
hasher.updateString("hello");
const rollingHash1 = hasher.getHash();
console.log(`Rolling hash after "hello": ${rollingHash1}`);

hasher.updateNumber(42);
const rollingHash2 = hasher.getHash();
console.log(`Rolling hash after adding 42: ${rollingHash2}`);

hasher.updateBoolean(true);
const rollingHash3 = hasher.getHash();
console.log(`Rolling hash after adding true: ${rollingHash3}`);
console.log(`Each update changed the hash: ${rollingHash1 !== rollingHash2 && rollingHash2 !== rollingHash3}\n`);

// Test null handling
const nullHash = CheapHasher.hashNull();
const stringNullHash = CheapHasher.hashString(null);
console.log(`Hash of null: ${nullHash}`);
console.log(`Hash of null string: ${stringNullHash}`);
console.log(`Null hashes are equal: ${nullHash === stringNullHash}\n`);

// Test UUID hashing
const uuid = "123e4567-e89b-12d3-a456-426614174000";
const uuidHash = CheapHasher.hashUUID(uuid);
console.log(`Hash of UUID ${uuid}: ${uuidHash}\n`);

// Test byte array hashing
const bytes = new Uint8Array([1, 2, 3, 4, 5]);
const bytesHash = CheapHasher.hashBytes(bytes);
console.log(`Hash of byte array [1,2,3,4,5]: ${bytesHash}\n`);

// Test reset functionality
hasher.reset();
const resetHash = hasher.getHash();
const freshHasher = new CheapHasher();
const freshHash = freshHasher.getHash();
console.log(`Hash after reset: ${resetHash}`);
console.log(`Fresh hasher hash: ${freshHash}`);
console.log(`Reset works correctly: ${resetHash === freshHash}\n`);

// Test method chaining
const chainedHasher = new CheapHasher()
  .updateString("test")
  .updateNumber(123)
  .updateBoolean(false);
console.log(`Chained hasher hash: ${chainedHasher.getHash()}\n`);

console.log('All tests completed successfully!');
