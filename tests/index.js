import assert from 'assert';
import {
  add,
} from '../build/debug.js';

// Test add function
assert.strictEqual(add(1, 2), 3, 'Addition of positive numbers should work');
assert.strictEqual(add(-1, 5), 4, 'Addition of positive and negative numbers should work');
assert.strictEqual(add(0, 0), 0, 'Addition of zeros should result in zero');
console.log('add ok');