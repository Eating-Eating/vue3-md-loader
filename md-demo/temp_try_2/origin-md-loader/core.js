/* eslint-disable */
//@ts-nocheck
let loaderUtils = require("loader-utils");
let hljs = require("highlight.js");
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

/**
 * html => vue file template
 * @param  {[type]} html [description]
 * @return {[type]}      [description]
 */
// let renderVueTemplate = function(html, wrapper) {
//   let $ = cheerio.load(html, {
//     decodeEntities: false,
//     lowerCaseAttributeNames: false,
//     lowerCaseTags: false,
//     xmlMode: true,
//   });

//   let output = {
//     style: $.html("style"),
//     // get only the first script child. Causes issues if multiple script files in page.
//     script: $.html($("script").first()),
//   };
//   let result;

//   $("style").remove();
//   $("script").remove();
//   let HTML = $.html().replace(/<hr>/g, '<hr />').replace(/<\/hr>/, '<hr />');
//   if (wrapper) {
//     result = `<template><${wrapper}>` + HTML + `</${wrapper}></template>\n`;
//   } else {
//     result = `<template>` + HTML + `</template>\n`;
//   }
//   result += output.style + "\n" + output.script;

//   return result;
// };

module.exports = function(source) {
  this.cacheable && this.cacheable();
  let parser, preprocess;
  let opts = loaderUtils.getOptions(this);
  // 调试时使用固定opt
  opts = {raw:true,preventExtract: false}
  
  let preventExtract = false;
  if (opts.preventExtract) {
    delete opts.preventExtract;
    preventExtract = true;
  }
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

    //add ruler:extract script and style tags from html token content
    // !preventExtract &&
    //   parser.core.ruler.push("extract_script_or_style", function replace(
    //     state,
    //   ) {
    //     let tag_reg = new RegExp("<(script|style)(?:[^<]|<)+</\\1>", "g");
    //     let newTokens = [];
    //     state.tokens
    //       .filter(token => token.type == "fence" && token.info == "html")
    //       .forEach(token => {
    //         let tokens = (token.content.match(tag_reg) || []).map(content => {
    //           let t = new Token("html_block", "", 0);
    //           t.content = content;
    //           return t;
    //         });
    //         if (tokens.length > 0) {
    //           newTokens.push.apply(newTokens, tokens);
    //         }
    //       });
    //     state.tokens.push.apply(state.tokens, newTokens);
    //   });

    if (plugins) {
      plugins.forEach(function(plugin) {
        if (Array.isArray(plugin)) {
          parser.use.apply(parser, plugin);
        } else {
          parser.use(plugin);
        }
      });
    }
  }
  // 含有:::demo则用<demo-block></demo-block>标签包裹
  parser.use(container)
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
  // 注释该方法，simplezhang-2020-11-18
  /**
   * override default parser rules by adding v-pre attribute on 'code' and 'pre' tags
   * @param {Array<string>} rules rules to override
   */
  // function overrideParserRules(rules) {
  //   if (parser && parser.renderer && parser.renderer.rules) {
  //     let parserRules = parser.renderer.rules;
  //     rules.forEach(function(rule) {
  //       if (parserRules && parserRules[rule]) {
  //         let defaultRule = parserRules[rule];
  //         parserRules[rule] = function() {
  //           return addVuePreviewAttr(defaultRule.apply(this, arguments));
  //         };
  //       }
  //     });
  //   }
  // }

  // overrideParserRules(["code_inline", "code_block", "fence"]);

  if (preprocess) {
    source = preprocess.call(this, parser, source);
  }
  let content = parser.render(source);
  // console.log('content', JSON.stringify(content));
  // let result = renderVueTemplate(content, opts.wrapper);
  // console.log('tag', result);

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
    output.push(`<template slot="source"><${demoComponentName} /></template>`);
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
//   // return `
  //   <template>
  //     <section class="content element-doc">
  //       ${output.join('')}
  //     </section>
  //   </template>
  //   ${pageScript}
  // `;
  return `
  <template>
  <section class="content element-doc">
    <demo-block>
      <template v-slot:description><div><p>你可以使用<code>disabled</code>属性来定义按钮是否可用，它接受一个<code>Boolean</code>值。</p>
</div></template>
      <template v-slot:source><yk-design-demo0 /></template>
      <template v-slot:highlight><pre v-pre><code class="html">  &lt;a-button disabled&gt;默认按钮&lt;/a-button&gt;
</code></pre></template></demo-block><p><a-button>2222</a-button></p>

  </section>
</template>
<script>

import { createTextVNode as _createTextVNode, resolveComponent as _resolveComponent, withCtx as _withCtx, createVNode as _createVNode, openBlock as _openBlock, createBlock as _createBlock } from "vue"
    export default {
      name: 'component-doc',
      components: {
        "yk-design-demo0": (function() {

const _hoisted_1 = /*#__PURE__*/_createTextVNode("默认按钮")

function render(_ctx, _cache) {
const _component_a_button = _resolveComponent("a-button")

return (_openBlock(), _createBlock("div", null, [
  _createVNode(_component_a_button, { disabled: "" }, {
    default: _withCtx(() => [
      _hoisted_1
    ]),
    _: 1
  })
]))
}
  return {
    render
  }
})(),
      }
    }
  </script>
  `
  if (opts.raw) {
    return result;
  } else {
    return "module.exports = " + JSON.stringify(result);
  }
};
