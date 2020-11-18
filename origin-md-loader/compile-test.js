/* eslint-disable*/
const {compileTemplate} = require('@vue/compiler-sfc')
const result = compileTemplate({
  source: `<div><a-button disabled>默认按钮</a-button></div>`,
  filename: 'inline-component', // TODO：这里有待调整
});

console.log('result', result.code);