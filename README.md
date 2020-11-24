# 写个loader通过markdown生成组件库demo（支持vue3）
事情是这样的，那天在沸点问了个问题

![image-20201124165932161](C:\Users\simple\AppData\Roaming\Typora\typora-user-images\image-20201124165932161.png)

我承认，这个问题问得并不好，实际上我是想要一个md-down解析成vue的工具，似乎没人领悟我的意思，看了一眼element的实现，发现element的loader已经不支持vue3了，只能自己弄一个了。

先看一下效果：







要实现这种效果，可以看到，markdown中的html模块，一份被解析成了源码的形式，一份被解析成了组件形式。



