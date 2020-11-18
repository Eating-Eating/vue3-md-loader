const test = require('./core');
const fs = require('fs');
fs.readFile('./sajkdb.zh-CN.md','utf-8', (err, data) => {
  if (err) throw err;
  test(data);
});