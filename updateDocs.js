const fs = require('fs');
const path = require('path');

const config = require(path.join(__dirname, 'typedoc.json'));
const targetPath = path.join(__dirname, 'API.md');
const apiFilePath = path.join(config.out, 'README.md');

const apiDocs = fs.readFileSync(apiFilePath, 'utf8');
const target = fs.readFileSync(targetPath, 'utf8');
const regex = /<!-- API_DOCS_START -->([\s\S]*)<!-- API_DOCS_END -->/;
if (!regex.test(target)) {
  throw new Error('Could not find API documentation tags in API.md');
}
const updatedReadme = target.replace(
  regex,
  `<!-- API_DOCS_START -->\n\n${apiDocs}\n\n<!-- API_DOCS_END -->`
);
fs.writeFileSync(targetPath, updatedReadme);
