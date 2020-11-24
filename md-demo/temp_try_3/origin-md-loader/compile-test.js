/* eslint-disable*/
const {compileTemplate,compileScript} = require('@vue/compiler-sfc')
const result = compileScript({
  source: `
      data(){
        return {
          asdasf:'125235'
        }
      }
    }
  `,
  filename: 'inline-component', // TODO：这里有待调整
});
// const result2 = compileTemplate({
//   source: `
//   <a-button>{{asdasf}}</a-button>
//   <script>
//     export default{
//       data(){
//         return {
//           asdasf:'125235'
//         }
//       }
//     }
//   </script>`,
//   filename: 'inline-component', // TODO：这里有待调整
//   compilerOptions:{mode:'function'}
// });

console.log('result', result);