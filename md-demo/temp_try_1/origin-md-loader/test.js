const test = require('./core');
const fs = require('fs');
fs.readFile('./testMarkdownIt.md','utf-8', (err, data) => {
  if (err) throw err;
  test(data);
});