import Vue from 'vue'
import App from './App.vue'
import router from './router/index'
import iView from 'view-design'
import 'view-design/dist/styles/iview.css'

Vue.config.productionTip = false
Vue.use(iView)
new Vue({
  el: '#app',
  router,
  // render: h => h(App),
  components: { App },
  template: '<App/>'
})
