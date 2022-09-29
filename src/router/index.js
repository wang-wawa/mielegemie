import Vue from 'vue'
import Router from 'vue-router'
Vue.use(Router)
export default new Router({
  routes: [
    {
      path:'/',
      redirect:'/home'
    },
    {
      path: '/home',
      name: 'home',
      component:  () => import('../pages/home.vue')
    },
    {
      path: '/game-page',
      name: 'game-page',
      component:  () => import('../pages/gamePage.vue')
    }
  ]
})
