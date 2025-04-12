

const path = require.resolve('lucide-static/package.json');

const fs = require('fs');
const iconNodesPath = path.replace('package.json', 'icon-nodes.json');
const iconData = JSON.parse(fs.readFileSync(iconNodesPath, 'utf8'));
const icons = Object.keys(iconData);

console.log(icons.join('\n'));

// Write the icons to a file
fs.writeFileSync('icon-names.txt', `options: { values: [${icons.join(', ')}] }`, 'utf8');
console.log(`Successfully wrote ${icons.length} icon names to icon-names.txt`);
