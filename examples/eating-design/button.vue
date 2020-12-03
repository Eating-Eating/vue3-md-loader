<template>
  <div>
    <button :style="{color:'pink'}">
      <slot/>
    </button>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
export default defineComponent({
  name:'eating-button'
})
</script>

<style scoped>

</style>