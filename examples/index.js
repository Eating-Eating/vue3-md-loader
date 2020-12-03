// import '@babel/polyfill';
import { createApp, version } from 'vue';
import App from './App.vue';
import demoBlock from './components/demo-block.vue';
import eatingButton from './eating-design/button.vue';

// eslint-disable-next-line no-console
console.log('Vue version: ', version);
const app = createApp(App);
app
  .component('demo-block', demoBlock)
  .component('eating-button', eatingButton)
  .mount('#app');
