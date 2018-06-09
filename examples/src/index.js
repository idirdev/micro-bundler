import { add, subtract, multiply } from './math';
import { capitalize, reverseString, truncate } from './utils';

const result = add(10, 5);
console.log('10 + 5 =', result);

const diff = subtract(10, 3);
console.log('10 - 3 =', diff);

const product = multiply(4, 7);
console.log('4 * 7 =', product);

const greeting = capitalize('hello world');
console.log('Capitalized:', greeting);

const reversed = reverseString('bundler');
console.log('Reversed:', reversed);

const long = truncate('This is a very long string that should be truncated', 20);
console.log('Truncated:', long);
