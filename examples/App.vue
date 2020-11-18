<template>
  <div>
    <sajkdb />
  </div>
</template>
<script>
import { defineComponent } from 'vue';
import sajkdb from './sajkdb.zh-CN.md';
export default defineComponent({
  components: {
    sajkdb,
  },
  data() {
    return {
      visible: false,
      pStyle: {
        fontSize: '16px',
        color: 'rgba(0,0,0,0.85)',
        lineHeight: '24px',
        display: 'block',
        marginBottom: '16px',
      },
      pStyle2: {
        marginBottom: '24px',
      },
    };
  },
  methods: {
    showDrawer() {
      this.visible = true;
    },
    onClose() {
      this.visible = false;
    },
  },
});
</script>
