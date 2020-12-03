<template>
  <div>
    <div>
      <div>
        <div :style="{color:'red'}">说明部分：</div>
        <slot name="description" />
      </div>
      <div>
        <div :style="{color:'red'}">组件效果：</div>
        <slot name="source" />
      </div>
      <div>
        <div :style="{color:'red'}">源代码：</div>
        <slot name="highlight" />
      </div>
    </div>
  </div>
</template>