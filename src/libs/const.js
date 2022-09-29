
// 动物数组
const animals = [
  'boluo',
  'changjinglu',
  'daxiang',
  'eyu',
  'houzi',
  'hudie',
  'huluobo',
  'laoshu',
  'pangxie',
  'shizi',
  'wugui',
  'xiongmao',
  'zixingche'
]

export const gameConfig = {
  // 槽容量
  slotNum: 7,
  // 需要多少个一样块的才能合成
  composeNum: 3,
  // 动物类别数
  typeNum: 13,
  // 每层块数（大致）
  levelBlockNum: 24,
  // 边界收缩步长
  borderStep: 1,
  // 总层数（最小为 2）
  levelNum: 10,
  // 动物数组
  animals,
}
