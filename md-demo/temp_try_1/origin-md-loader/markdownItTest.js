let markdown = require("markdown-it");
const fs = require('fs');
fs.readFile('./testMarkdownIt.md','utf-8', (err, data) => {
  if (err) throw err;
let content = markdown().render(data);
console.log(content)
})