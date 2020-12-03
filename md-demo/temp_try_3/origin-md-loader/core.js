/* eslint-disable */
//@ts-nocheck
let loaderUtils = require("loader-utils");
let hljs = require("highlight.js");
const anchorPlugin = require('markdown-it-anchor');
const slugify = require('transliteration').slugify;
let cheerio = require("cheerio");
let markdown = require("markdown-it");
let Token = require("markdown-it/lib/token");
const container = require('./container');
const {
  stripScript,
  stripTemplate,
  genInlineComponentText
} = require('./utils');
/**
 * `<pre></pre>` => `<pre v-pre></pre>`
 * `<code></code>` => `<code v-pre></code>`
 * @param  {string} str
 * @return {string}
 */
let addVuePreviewAttr = function(str) {
  return str.replace(/(<pre|<code)/g, "$1 v-pre");
};

/**
 * renderHighlight
 * @param  {string} str
 * @param  {string} lang
 */
let renderHighlight = function(str, lang) {
  if (!(lang && hljs.getLanguage(lang))) {
    return "";
  }

  return hljs.highlight(lang, str, true).value;
};


module.exports = function(source) {
  this.cacheable && this.cacheable();
  let parser, preprocess;
  let opts = loaderUtils.getOptions(this);
  opts = {raw:true,preventExtract: false}
  if (typeof opts.render === "function") {
    parser = opts;
  } else {
    opts = Object.assign(
      {
        preset: "default",
        html: true,
        highlight: renderHighlight,
        wrapper: "section",
      },
      opts,
    );

    let plugins = opts.use;
    preprocess = opts.preprocess;

    delete opts.use;
    delete opts.preprocess;

    parser = markdown(opts.preset, opts);
  }
  // 含有:::demo则用<demo-block></demo-block>标签包裹
  parser.use(anchorPlugin, 
      {
        level: 2,
        slugify: slugify,
        permalink: true,
        permalinkBefore: true
      }
    ).use(container)
  // 重写fence逻辑
    .use((md) => {
      const defaultRender = md.renderer.rules.fence;
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        // console.log('tag', tokens)
        const token = tokens[idx];
        // 判断该 fence 是否在 :::demo 内
        const prevToken = tokens[idx - 1];
        const isInDemoContainer = prevToken && prevToken.nesting === 1 && prevToken.info.trim().match(/^demo\s*(.*)$/);
        if (token.info === 'html' && isInDemoContainer) {
          return `<template v-slot:highlight><pre v-pre><code class="html">${md.utils.escapeHtml(token.content)}</code></pre></template>`;
        }
        return defaultRender(tokens, idx, options, env, self);
      };
    })
  if (preprocess) {
    source = preprocess.call(this, parser, source);
  }
  let content = parser.render(source);

  const startTag = '<!--yk-design-demo:';
  const startTagLen = startTag.length;
  const endTag = ':yk-design-demo-->';
  const endTagLen = endTag.length;

  let componenetsString = '';
  let id = 0; // demo 的 id
  let output = []; // 输出的内容
  let start = 0; // 字符串开始位置

  let commentStart = content.indexOf(startTag);
  let commentEnd = content.indexOf(endTag, commentStart + startTagLen);
  while (commentStart !== -1 && commentEnd !== -1) {
    output.push(content.slice(start, commentStart));

    const commentContent = content.slice(commentStart + startTagLen, commentEnd);
    const html = stripTemplate(commentContent);
    const script = stripScript(commentContent);
    let demoComponentContent = genInlineComponentText(html, script);
    const demoComponentName = `yk-design-demo${id}`;
    output.push(`<template v-slot:source><${demoComponentName} /></template>`);
    componenetsString += `${JSON.stringify(demoComponentName)}: ${demoComponentContent},`;

    // 重新计算下一次的位置
    id++;
    start = commentEnd + endTagLen;
    commentStart = content.indexOf(startTag, start);
    commentEnd = content.indexOf(endTag, commentStart + startTagLen);
  }

  // 仅允许在 demo 不存在时，才可以在 Markdown 中写 script 标签
  // todo: 优化这段逻辑
  let pageScript = '';
  if (componenetsString) {
    pageScript = `<script>
      export default {
        name: 'component-doc',
        components: {
          ${componenetsString}
        }
      }
    </script>`;
  } else if (content.indexOf('<script>') === 0) { // 硬编码，有待改善
    start = content.indexOf('</script>') + '</script>'.length;
    pageScript = content.slice(0, start);
  }

  output.push(content.slice(start));
//   console.log('output', `
//   <template>
//     <section class="content element-doc">
//       ${output.join('')}
//     </section>
//   </template>
//   ${pageScript}
// `)
   return `
    <template>
      <section class="content element-doc">
        ${output.join('')}
      </section>
    </template>
    ${pageScript}
  `;
};
