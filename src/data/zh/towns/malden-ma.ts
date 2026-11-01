import type { ZhTownGuideData } from '@/pages/zh/ZhTownGuide';

const guide: ZhTownGuideData = {
  slug: 'malden-ma',
  title: '莫尔登（Malden, MA）买房指南：橙线和市中心',
  description:
    '莫尔登（Malden, MA）中文指南：两个橙线车站几分钟到波士顿市中心，Malden Center 的更新，各街区的特点，condo 和多户住宅，以及在这里买房要知道的事。',
  keywords: '莫尔登 Malden 买房, Malden Center, Oak Grove, 橙线 买房, Malden condo, 马尔登 房价',
  subtitle:
    '莫尔登（Malden）在波士顿以北，与梅德福、Melrose、Everett 和 Revere 相邻。两个橙线车站让波士顿市中心近在咫尺，这是它最大的优势，离车站和市中心的远近也明显影响价格。',
  image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&h=600',
  buyerNote:
    '两个橙线车站让波士顿市中心只有短短的车程，这是莫尔登最大的优势。要知道的街区有：Faulkner、West End、Edgeworth、Linden、Ferryway、Forestdale、Maplewood、Bellrock 和 Belmont Hill。',
  sections: [
    {
      type: 'intro',
      text: '莫尔登（Malden）是大波士顿地区交通很方便、变化很快的城市之一，位于波士顿以北，与梅德福、Melrose、Everett 和 Revere 相邻，有公共交通、发展中的市中心和社区生活。',
      highlight: '多个橙线车站、直达的高速公路和持续的重建，让它成为靠近波士顿买房时很受关注的地方。',
    },
    {
      type: 'section',
      title: '人们为什么搬到莫尔登？',
      text: '莫尔登吸引的是看重位置、公共交通和相对性价比的买家。',
    },
    {
      type: 'subsection',
      title: '🚇 公共交通和通勤',
      text: '莫尔登是波士顿以外公共交通很方便的城市之一。',
      bullets: ['橙线车站：Malden Center、Oak Grove、Wellington（在边界上）', 'Malden Center 是 MBTA 巴士枢纽', '很快可上 Route 1、Route 16、I-93 和 Route 99', '方便通勤到波士顿市中心、萨默维尔、剑桥和 Logan 机场'],
      note: '公共交通是这里住房需求最大的来源之一。',
    },
    {
      type: 'subsection',
      title: '🌆 更新后的市中心和餐饮',
      text: 'Malden Center 经历了大规模更新。',
      bullets: ['新的综合和住宅开发项目', '不断增加的餐厅和咖啡馆', '娱乐场所、健身中心和零售', '适合步行、靠近交通的市中心'],
      note: '市中心的发展持续改变着这个市场。',
    },
    {
      type: 'subsection',
      title: '🌳 绿地和社区生活',
      text: '莫尔登去户外很方便。',
      bullets: ['附近的 Middlesex Fells 保护区', 'Fellsmere Park 和城市绿地', '自行车道和社区公园'],
      note: '进城方便加上户外生活，是吸引买家的地方。',
    },
    {
      type: 'section',
      title: '莫尔登的街区各有什么特点？',
      text: '莫尔登有几个特点不同的住宅区。',
      neighborhoods: [
        { name: 'Malden Center', description: '城市化，适合步行，靠近交通，condo 和新开发项目多。' },
        { name: 'Forestdale / Oak Grove', description: '靠近橙线，街道较安静，独栋需求强。' },
        { name: 'Maplewood', description: '住宅区，有经典住宅和长期业主。' },
        { name: 'Bellrock 和 West End', description: '社区感强，多户住宅多，受首次购房者欢迎。' },
      ],
    },
    {
      type: 'section',
      title: '莫尔登的房市是什么样的？',
      text: '莫尔登的房屋类型在波士顿以北算是非常多样的。',
      highlight: '您会看到：',
      bullets: ['condo 和新开发项目', '独栋住宅', '三层楼（triple-decker）和多户住宅', '联排住宅和综合用途建筑'],
      note: '公共交通、重建，以及靠近波士顿和剑桥，一直在支撑这里的房价。',
    },
    {
      type: 'section',
      title: '莫尔登值得买吗？',
      reasons: [
        { icon: '📈', title: '发展潜力', text: '受益于持续的基础设施投资和市中心扩展。' },
        { icon: '🏘', title: '出租市场强', text: '橙线以及附近的大学和雇主，带来持续的出租需求。' },
        { icon: '🚧', title: '持续重建', text: '新住宅、零售和社区项目持续提升房产价值。' },
        { icon: '🌎', title: '均衡的买家结构', text: '吸引自住业主、投资者和搬迁买家，市场流动性好。' },
      ],
    },
    {
      type: 'section',
      title: '在莫尔登买房之前要知道什么？',
      text: '莫尔登的价格对位置很敏感，离公共交通和市中心的远近影响很大。',
      highlight: '做好这些准备会很有帮助：',
      bullets: ['了解具体街区的价格', '了解 condo 和多户住宅的情况', '有竞争力的出价策略', '了解开发趋势', '分析租金和转售'],
      note: '分清哪些地方正在趋稳、哪些还在加速，可能明显影响结果。',
    },
  ],
};

export default guide;
