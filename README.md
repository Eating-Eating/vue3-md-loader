# 写个loader通过markdown生成组件库demo（支持vue3）
事情是这样的，那天在沸点问了个问题

![image-20201124165932161](C:\Users\simple\AppData\Roaming\Typora\typora-user-images\image-20201124165932161.png)

没人理我，只能自己弄一个了。

先看一下效果：
<div style="display:flex">
	<img width="50%" height="100%" src="C:\Users\simple\AppData\Roaming\Typora\typora-user-images\image-20201203164650857.png"/>
    <img width="50%" height="100%" src="C:\Users\simple\AppData\Roaming\Typora\typora-user-images\image-20201203164657227.png"/>
</div>


完成后不但可以正常解析md，自定义的demo模块还被解析成了三个部分：

1. 说明部分
2. 组件效果
3. 组件源代码

显然，md中的html模块有一份是被解析成了vue模板，因为script标签是可以生效的，`eating-button`中的模板语法`{{asdasf}}`被替换了。

写一份代码，当两份用，还有这么好的事？没错，不用998，也不用198，只需点个赞，我带你飞。

## 设计思路

这种效果是怎么实现的呢，明确一下，组件库的demo网站建设，如果是vue组件库，那肯定得用vue搭建，所以我们的markdown文件，都需要作为vue组件来调用，才能达到最方便可用的效果。

![image-20201203171931492](C:\Users\simple\AppData\Roaming\Typora\typora-user-images\image-20201203171931492.png)

如图，我们的markdown文件可以直接作为vue组件进行局部注册，并且正常渲染。很显然，markdown的文件在我们的项目中都先被解析成了vue，再作为vue文件用vue-loader正常编译后在浏览器中显示。

> 前置知识：markdown实际上跟html差不多都是一种标记语言，所以两者之间的相互转换挺容易的，将md文件转化成html，比较常见的工具是markdown-it。例子：![image-20201203174339012](C:\Users\simple\AppData\Roaming\Typora\typora-user-images\image-20201203174339012.png)

但仅仅解析成html对于需求来说是远远不够的，还需要解析成vue。这个vue应该长什么样呢？要有一个我们自己定义的token，把其中的内容转译成**我们想要的样子**。剩余部分默认解析，全塞vue的模板里，即`<template>`标签里面。**我们想要的样子**显然是定义一个vue组件用作展示，其中有三个插槽，分别插入标题、组件展示、源码展示。那就很好办了，假设这个demo组件是`<demo-block>`

> token在词法分析中是标记的意思，md中的`### 标题`中的`###`就是一种token，遇到这个token，markdown-it会将其转译成`<h3>`标签。

用代码说明就是，我们希望markdown文件：

~~~markdown
### 标题

如图，我们的markdown文件可以直接作为vue组件进行局部注册，并且正常渲染。很显然，markdown的文件在我们的项目中都先被解析成了vue，再作为vue文件用vue-loader正常编译后在浏览器中显示。

> 前置知识：markdown实际上跟html差不多都是一种标记语言，所以两者之间的相互转换应该挺容易的，将md文件转化成html，比较常见的工具是markdown-it。

:::demo 你可以使用`disabled`属性来定义按钮是否可用，它接受一个`Boolean`值。

```html

  <eating-button>{{asdasf}}</eating-button>
  <script>
    export default{
      data(){
        return{
          asdasf:'125235'
        }
      }
    }
  </script>
  
```
:::
~~~

转译成这样：

```vue
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
```

