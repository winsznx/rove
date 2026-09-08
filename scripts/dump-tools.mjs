import fs from 'node:fs';
import path from 'node:path';

const mcpDir = '/Users/mac/.gemini/antigravity/mcp/binance';
const files = fs.readdirSync(mcpDir).filter(f => f.endsWith('.json'));

const tools = [];

for (const file of files.sort()) {
  const content = fs.readFileSync(path.join(mcpDir, file), 'utf8');
  try {
    const json = JSON.parse(content);
    tools.push(json);
  } catch (e) {
    console.error(`Failed to parse ${file}`, e);
  }
}

const outputPath = path.resolve('evidence/mcp/tool-list.json');
fs.writeFileSync(outputPath, JSON.stringify({
  discoveredAt: new Date().toISOString(),
  server: 'binance',
  endpoint: 'https://agent.binance.com/mcp/agentic',
  totalTools: tools.length,
  tools
}, null, 2));

console.log(`Successfully dumped ${tools.length} tools to ${outputPath}`);
