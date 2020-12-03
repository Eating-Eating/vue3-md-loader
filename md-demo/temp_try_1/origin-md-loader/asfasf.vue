<template>
  <section>
    <h3>标题</h3>
    <p>
      如图，我们的markdown文件可以直接作为vue组件进行局部注册，并且正常渲染。很显然，markdown的文件在我们的项目中都先被解析成了vue，再作为vue文件用vue-loader正常编译后在浏览器中显示。
    </p>
    <blockquote>
      <p>
        前置知识：markdown实际上跟html差不多都是一种标记语言，所以两者之间的相互转换应该挺容易的，将md文件转化成html，比较常
        见的工具是markdown-it。
      </p>
    </blockquote>
    <demo-block>
      <template v-slot:description><div>
          <p>
            你可以使用<code>disabled</code>属性来定义按钮是否可用，它接受一个<code>Boolean</code>值。
          </p>
        </div></template
      >
      <template v-slot:source>
        <eating-button>{{ asdasf }}</eating-button>
      </template>
      <template v-slot:highlight>
        <pre>
        <code class="language-html">
          &lt;eating-button&gt;{{asdasf}}&lt;/eating-button&gt;
          &lt;script&gt;
            export default{
              data(){
                return{
                  asdasf:'125235'
                }
              }
            }
          &lt;/script&gt;
        </code>
        </pre>
      </template>
    </demo-block>
  </section>
</template>

<script>
export default {
  data() {
    return {
      asdasf: "125235",
    };
  },
};
</script>