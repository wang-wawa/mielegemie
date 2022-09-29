<template>
  <div id="gamePage" class="game-page">
    <h2 v-if="totalBlockNum" style="text-align: center;">{{ clearBlockNum }} / {{ totalBlockNum }} </h2>
    <div class="level-blocks">
      <div v-for="(block, idx) in levelBlocks" :key="idx">
        <div
          v-if="block.status === 0"
          :class="{
            'block': true,
            'level-block': true,
            'disabled': block.lowerThanBlocks.length > 0,
          }"
          :data-id="block.id"
          :style="{
            zIndex: 100 + block.level,
            left: block.x * widthUnit + 'px',
            top: block.y * heightUnit + 'px',
          }"
          @click="doClickBlock(block)"
        >
          <img class="block-img" :src="require(`../assets/${block.type}.jpg`)" />
        </div>
      </div>
    </div>
    <div v-if="slotArea.length > 0" class="selected-block">
      <div v-for="(slotBlock, index) in slotArea" :key="'slot'+index" class="block">
        <img v-if="slotBlock" class="block-img" :src="require(`../assets/${slotBlock.type}.jpg`)" />
      </div>
    </div>
    <div class="skill-board">
      <Button :disabled="opHistory.length < 1" @click="doRevert">撤回</Button>
      <Button @click="doShuffle">洗牌</Button>
    </div>
  </div>
</template>
<script>
import { gameConfig } from '../libs/const'
import _ from 'lodash'
export default {
  data(){
    return {
      gameStatus: -1,
      levelBlocks: [],
      slotArea: [], // 选中区域
      gridBorad: [],
      opHistory: [], // 存储历史记录
      totalBlockNum: 0,
      currSlotNum: 0, // 当前槽占用数量
      clearBlockNum: 0, // 已消除块数
      widthUnit: 14, // 每个格子的宽高
      heightUnit: 14, // 每个格子的宽高
      // 总共划分 24 x 24 的格子，每个块占 3 x 3 的格子，生成的起始 x 和 y 坐标范围均为 0 ~ 21
      boxWidthNum: 24,
      boxHeightNum:24,
    }
  },
  mounted(){
    this.initGame()
  },
  methods:{
    initGame(){
      this.gameStatus = -1 
      this.levelBlocks = []
      this.slotArea = []// 选中区域
      this.gridBorad = []
      this.currSlotNum = 0 // 当前槽占用数量
      this.clearBlockNum = 0
      this.totalBlockNum = 0
      this.initGrid(this.boxWidthNum,this.boxHeightNum)
      this.gameStatus = 0
      const { levelBlocks, slotArea } = this.initCard()
      this.levelBlocks = levelBlocks
      this.slotArea = slotArea
    },
    // 初始化格子
    initGrid(width,height){
      this.gridBorad = new Array(width)
      for(let i = 0; i < width; i++){
        this.gridBorad[i] = new Array(height)
        for(let j = 0; j < height; j++){
          this.gridBorad[i][j] = {
            blocks:[]
          }
        }
      }
    },
    initCard(){
      let levelBlocksDom = document.getElementsByClassName('level-blocks')
      levelBlocksDom[0].style.width = this.widthUnit * this.boxWidthNum + 'px'
      levelBlocksDom[0].style.height = this.heightUnit * this.boxHeightNum + 'px'
      // 不同分类 * 需要合成的块数 = 块数单位 总数必须是这个数的倍数
      let blockNumUnit = gameConfig.composeNum * gameConfig.typeNum
      let minBlockNum = gameConfig.levelNum * gameConfig.levelBlockNum
      this.totalBlockNum =  minBlockNum
      // 总块数不是块数单位的倍数
      if(this.totalBlockNum % blockNumUnit !== 0){
        this.totalBlockNum = (Math.floor(minBlockNum / blockNumUnit) + 1) * blockNumUnit
      }
      let types = []
      // 需要用到的动物数组
      let needAnimals = gameConfig.animals.slice(0, gameConfig.typeNum)
      // 依次把块塞到数组里
      for (let i = 0; i < this.totalBlockNum; i++) {
        types.push(needAnimals[i % gameConfig.typeNum])
      }
      // 打乱数组
      let randomAnimalBlocks = _.shuffle(types)
      let allBlocks = []
      // 初始化
      for (let i = 0; i < this.totalBlockNum; i++) {
        let newBlock = {
          id: i,
          status: 0,
          level: 0,
          type: randomAnimalBlocks[i],
          higherThanBlocks: [],
          lowerThanBlocks: [],
        }
        allBlocks.push(newBlock)
      }
      // 剩余块数
      let leftBlockNum = this.totalBlockNum
      // 下一个要插入的块
      let pos = 0
      // 计算块之间的层级关系
      let levelBlocks = []
      let minX = 0
      let maxX = 22
      let minY = 0
      let maxY = 22
      for (let i = 0; i < gameConfig.levelNum; i++) {
        let nextBlockNum = Math.min(gameConfig.levelBlockNum,leftBlockNum)
        // 最后一批，分配所有 leftBlockNum
        if (i === gameConfig.levelNum - 1) {
          nextBlockNum = leftBlockNum
        }
        // 边界收缩
        if (gameConfig.borderStep > 0) {
          const dir = i % 4
          if (i > 0) {
            if (dir === 0) {
              minX += gameConfig.borderStep
            } else if (dir === 1) {
              maxY -= gameConfig.borderStep
            } else if (dir === 2) {
              minY += gameConfig.borderStep
            } else {
              maxX -= gameConfig.borderStep
            }
          }
        }
        const nextGenBlocks = allBlocks.slice(pos, pos + nextBlockNum)
        levelBlocks.push(...nextGenBlocks)
        pos = pos + nextBlockNum
        // 生成块的坐标
        this.genLevelBlockPos(nextGenBlocks, minX, minY, maxX, maxY)
        leftBlockNum -= nextBlockNum
        if (leftBlockNum <= 0) {
          break
        }
      }
      // 4. 初始化空插槽
      const slotArea = new Array(gameConfig.slotNum).fill(null)
      return {
        levelBlocks,
        slotArea
      }
    },
    genLevelBlockPos(blocks = [], minX, minY, maxX, maxY){
      // 记录这批块的坐标，用于保证同批次元素不能完全重叠
      let currentPosSet = new Set()
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        // 随机生成坐标
        let newPosX
        let newPosY
        let key
        /* eslint-disable */
        while (true) {
          newPosX = Math.floor(Math.random() * maxX + minX)
          newPosY = Math.floor(Math.random() * maxY + minY)
          key = newPosX + ',' + newPosY
          // 同批次元素不能完全重叠
          if (!currentPosSet.has(key)) {
            break
          }
        }
        this.gridBorad[newPosX][newPosY].blocks.push(block) 
        block.x = newPosX
        block.y = newPosY
        currentPosSet.add(key)
        // 填充层级关系
        this.genLevelRelation(block)
      }
    },
    genLevelRelation(block){
      // 确定周边格子范围
      const minX = Math.max(block.x - 2, 0)
      const minY = Math.max(block.y - 2, 0)
      const maxX = Math.min(block.x + 3, this.boxWidthNum - 2)
      const maxY = Math.min(block.y + 3, this.boxWidthNum - 2)
      let maxLevel = 0
      for (let i = minX; i < maxX; i++) {
        for (let j = minY; j < maxY; j++) {
          const relationBlocks = this.gridBorad[i][j].blocks
          if (relationBlocks.length > 0) {
            // 取当前位置最高层的块
            const maxLevelRelationBlock = relationBlocks[relationBlocks.length - 1]
            // 排除自己
            if (maxLevelRelationBlock.id === block.id) {
              continue
            }
            maxLevel = Math.max(maxLevel, maxLevelRelationBlock.level)
            block.higherThanBlocks.push(maxLevelRelationBlock)
            maxLevelRelationBlock.lowerThanBlocks.push(block)
          }
        }
      }
      // 比最高层的块再高一层（初始为 1）
      block.level = maxLevel + 1
    },
    /**
      *  点击块事件
      * @param block
    */
    doClickBlock(block){
      // 已经输了 / 已经被点击 / 有上层块，不能再点击
      if (this.currSlotNum >= gameConfig.slotNum ||block.status !== 0 ||block.lowerThanBlocks.length > 0)return
      // 修改元素状态为已点击
      block.status = 1
      // 历史记录追加
      this.opHistory.push(block)
      // 移除当前元素
      // 移除覆盖关系
      block.higherThanBlocks.forEach((higherThanBlock) => {
        _.remove(higherThanBlock.lowerThanBlocks, (lowerThanBlock) => {
          return lowerThanBlock.id === block.id
        })
      })
      let tempSlotNum = this.currSlotNum
      // 新元素加入插槽
      this.$set(this.slotArea,tempSlotNum, block)
      let map = {}
      // 去除空槽
      const tempSlotAreaVal = this.slotArea.filter((slotBlock) => !!slotBlock)
      tempSlotAreaVal.forEach((slotBlock) => {
        const type = slotBlock.type
        if (!map[type]) {
          map[type] = 1
        } else {
          map[type]++
        }
      })
      // 得到新数组
      const newSlotAreaVal = new Array(gameConfig.slotNum).fill(null)
      tempSlotNum = 0
      tempSlotAreaVal.forEach((slotBlock) => {
        // 成功消除（不添加到新数组中）
        if (map[slotBlock.type] >= gameConfig.composeNum) {
          // 块状态改为已消除
          slotBlock.status = 2
          // 已消除块数 +1
          this.clearBlockNum++
          // 清除操作记录，防止撤回
          this.opHistory = []
          return
        }
        newSlotAreaVal[tempSlotNum++] = slotBlock
      })
      this.slotArea = newSlotAreaVal
      this.currSlotNum = tempSlotNum
      // 游戏结束
      if (tempSlotNum >= gameConfig.slotNum) {
        this.gameStatus = 2
        this.$Modal.confirm({
          title: '提示',
          content: '<p>很遗憾，你输了！',
          okText: '再玩一次',
          cancelText: '返回',
          onOk: () => {
            this.initGame()
          },
          onCancel:()=>{
            this.$router.push('/')
          }
        })
      }
      if (this.clearBlockNum >= this.totalBlockNum) {
        this.gameStatus = 3
        this.$Message.success('恭喜你！赢了！')
      }
    },
    /**
     * 洗牌
     *
     * @desc 随机重洗所有未被点击的块
   */
    doShuffle(){
      const originBlocks = this.levelBlocks.filter((block) => block.status === 0)
      const newBlockTypes = _.shuffle(originBlocks.map((block) => block.type))
      let pos = 0
      originBlocks.forEach((block) => {
        block.type = newBlockTypes[pos++]
      })
      this.levelBlocks = [...this.levelBlocks]
    },
    /**
     * 撤回
     */
    doRevert() {
      if (this.opHistory.length < 1) {
        return
      }
      this.opHistory[this.opHistory.length - 1].status = 0
      this.opHistory.pop()
      this.currSlotNum--
      this.slotArea[this.currSlotNum] = null
    }
  }
  
}
</script>
<style scoped>
  .game-page {
    display: flex;
    justify-content: center;
    flex-direction: column;
  }
  .selected-block {
    margin: 20px auto;
  }
  .skill-board {
    text-align: center;
  }
  .level-blocks {
    position: relative;
    margin: 20px auto;
  }
  .level-block {
    position: absolute;
    box-shadow: 0 2px 1px 0 gray;
    margin: 20px auto;
  }
  .block {
    box-sizing: border-box;
    font-size: 28px;
    width: 42px;
    height: 42px;
    line-height: 42px;
    border: 1px solid #555;
    text-align: center;
    vertical-align: top;
    display: inline-block;
    background: #f2ede5;
    box-shadow: 0px 1px 1px 1px rgb(154, 154, 154);
    
  }
  .block:hover {
    cursor: pointer;
  }
  .block .block-img {
    width: 100%;
    height: 100%;
  }
  .block.disabled {
    background: grey;
    color: grey;
    cursor: not-allowed;
  }
  .block.disabled::after {
    content: ' ';
    width: 42px;
    height: 42px;
    background: gray;
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0.7;
  }
</style>
