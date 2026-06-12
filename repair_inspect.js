import fs from 'fs';
import path from 'path';

const filePath = './src/components/AuthScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const startLineIdx = lines.findIndex(l => l.includes("formType === 'reset' && <Key className=\"w-7 h-7\" />"));
console.log('Found line at index:', startLineIdx);
if (startLineIdx !== -1) {
  for (let i = startLineIdx; i < startLineIdx + 12; i++) {
    console.log(`${i}: [${lines[i]}]`);
  }
}
