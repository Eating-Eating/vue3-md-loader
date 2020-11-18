/* eslint-disable */
//@ts-nocheck
let loaderUtils = require("loader-utils");
let hljs = require("highlight.js");
let cheerio = require("cheerio");
let markdown = require("markdown-it");
let Token = require("markdown-it/lib/token");
const container = require('./container');

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
let renderVueTemplate = function(html, wrapper) {
  let $ = cheerio.load(html, {
    decodeEntities: false,
    lowerCaseAttributeNames: false,
    lowerCaseTags: false,
    xmlMode: true,
  });

  let output = {
    style: $.html("style"),
    // get only the first script child. Causes issues if multiple script files in page.
    script: $.html($("script").first()),
  };
  let result;

  $("style").remove();
  $("script").remove();
  let HTML = $.html().replace(/<hr>/g, '<hr />').replace(/<\/hr>/, '<hr />');
  if (wrapper) {
    result = `<template><${wrapper}>` + HTML + `</${wrapper}></template>\n`;
  } else {
    result = `<template>` + HTML + `</template>\n`;
  }
  result += output.style + "\n" + output.script;

  return result;
};

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
          return `<template v-slot:yesComeOn>
                    ${token.content}
                  </template>
                  <template v-slot:highlight>
                    <pre v-pre>
                      <code class="language-html">${parser.utils.escapeHtml(token.content)}</code>
                    </pre>
                  </template>`;
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
  let result = renderVueTemplate(content, opts.wrapper);
  // console.log('tag', result);
  if (opts.raw) {
    return result;
  } else {
    return "module.exports = " + JSON.stringify(result);
  }
};
