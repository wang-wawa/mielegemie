<template>
  <div style="display: flex; justify-content: center; align-items: center; flex-direction: column; height: 100%">
    <H1 style="margin: 20px;">咩了个咩</H1>
    <Button @click="onstart">开始</Button>
  </div>
</template>
<script>
export default {
  /* eslint-disable */
  name: 'home',
  methods:{
    onstart(){
      this.$router.push('/game-page')
    }
  }
}
</script>