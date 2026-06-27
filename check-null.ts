import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'src', 'App.tsx');
const buffer = fs.readFileSync(filePath);

console.log('First 10 bytes:', Array.from(buffer.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' '));

// Let's print out what text looks like:
console.log('First 100 chars:', buffer.toString('utf8').slice(0, 100));

// Let's check for non-utf8 characters or binary markers
let nonPrintableCount = 0;
for (let i = 0; i < buffer.length; i++) {
  const b = buffer[i];
  // check if printable ASCII, or standard UTF-8 (>= 128), or \n (10), \r (13), \t (9)
  if (b < 32 && b !== 10 && b !== 13 && b !== 9) {
    console.log(`Non-printable byte found: ${b} (0x${b.toString(16)}) at index ${i}`);
    nonPrintableCount++;
    if (nonPrintableCount > 10) break;
  }
}
