import type { ZhTownGuideData } from '@/pages/zh/ZhTownGuide';

const guide: ZhTownGuideData = {
  slug: 'somerville-ma',
  title: '萨默维尔（Somerville, MA）买房指南：绿线延伸和广场',
  description:
    '萨默维尔（Somerville, MA）中文指南：绿线延伸带来的变化，Davis、Union、Assembly 等广场的特点，三层楼和多户住宅，以及在这里买房要知道的事。',
  keywords: '萨默维尔 Somerville 买房, Somerville condo, 绿线延伸 房价, Davis Square, Union Square, 三层楼 投资',
  subtitle:
    '萨默维尔（Somerville）位于波士顿西北，紧邻剑桥，以步行便利和餐饮著称。绿线延伸改变了哪些地方靠近公共交通，这个影响还在市场上继续发酵。',
  image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&h=600',
  buyerNote:
    '绿线延伸改变了萨默维尔哪些地方靠近公共交通，这个影响还在市场上发酵。要知道的广场有：Davis、Union、Ball、Magoun、Teele、Powder House、Porter 和 Assembly。这座城市的“七座山”解释了为什么这么多街道都很陡。',
  sections: [
    {
      type: 'intro',
      text: '萨默维尔（Somerville）是大波士顿地区变化很快的城市之一，位于波士顿西北，与剑桥相邻，以步行便利、餐饮、社区文化和房市发展闻名。',
      highlight: '新的轨道交通、大型开发项目，以及靠近波士顿最大的就业中心，让它受到很多买家的关注。',
    },
    {
      type: 'section',
      title: '人们为什么搬到萨默维尔？',
      text: '萨默维尔难得地兼具城市活力和邻里感，有创意，重社区，也在不断变化。',
    },
    {
      type: 'subsection',
      title: '🚇 交通和通勤',
      text: '萨默维尔现在的交通比以往都方便。',
      bullets: [
        'MBTA 绿线延伸（Union Square、Gilman Square、Magoun Square、Ball Square、East Somerville、Tufts）',
        '经 Davis Square 乘红线',
        '很快可到剑桥、波士顿市中心、Assembly Row 和 Route 93',
      ],
      note: '对买家来说，轨道交通的扩展是影响房价和出租需求的重要因素。',
    },
    {
      type: 'subsection',
      title: '🌆 适合步行，充满生活气息',
      text: '萨默维尔有很多独立餐厅、咖啡馆、精酿酒吧、面包店、音乐场所和小店。几乎每个街区都围绕一个广场，形成真正的社区中心。',
      note: '您可以走路去吃饭、去健身房、坐地铁、去公园，这是持续推高需求的生活优势。',
    },
    {
      type: 'subsection',
      title: '🎨 文化、创意和社区',
      text: '从艺术节和农贸市场到现场音乐和餐车活动，萨默维尔以文化个性著称，吸引着看重邻里认同的专业人士、创意工作者和长期居民。',
    },
    {
      type: 'section',
      title: '萨默维尔的广场和街区各有什么特点？',
      text: '萨默维尔由各具特色的广场组成，每个都有自己吸引买家的地方。',
      neighborhoods: [
        { name: 'Davis Square', description: '热闹，适合步行，交通方便。以餐厅、夜生活和红线著称，买家需求很强，是竞争最激烈的地区之一。' },
        { name: 'Union Square', description: '大波士顿发展最快的地区之一。有大型重建、新的实验室和住宅项目，以及绿线车站。受看重未来发展和新建房的买家欢迎。' },
        { name: 'Assembly Square / Assembly Row', description: '现代，配套齐全，交通方便。有较新的高端 condo、购物、餐饮、滨水步道和橙线。' },
        { name: 'Ball Square、Magoun Square 和 Gilman Square', description: '偏住宅的街区，因绿线而更方便。相对 Davis 和剑桥价格更实惠，又受益于交通升级。' },
        { name: 'East Somerville 和 Winter Hill', description: '社区感强的地区，有多户住宅、condo 和长期的本地文化。越来越受首次购房者和投资者欢迎。' },
      ],
    },
    {
      type: 'section',
      title: '萨默维尔的房市是什么样的？',
      text: '萨默维尔的房市很多样，竞争也激烈。',
      highlight: '您会看到：',
      bullets: ['三层楼（triple-decker）和多户投资房', '翻新的 condo 和联排住宅', '靠近交通的较新开发项目', '数量有限的独栋住宅'],
      note: '靠近剑桥和波士顿、不断扩展的交通和有限的住房供应，一直在支撑这里的房价。',
    },
    {
      type: 'section',
      title: '萨默维尔值得买吗？',
      reasons: [
        { icon: '📈', title: '发展潜力', text: '基础设施投资、靠近雇主和持续的重建带动着长期发展。单是绿线延伸就重塑了这个市场。' },
        { icon: '🏘', title: '出租需求好', text: '塔夫茨大学、来自剑桥的外溢需求和波士顿通勤者，让 condo 和多户住宅都有持续的出租需求。' },
        { icon: '🚧', title: '大型开发和更新', text: 'Union Square、Assembly Row 和各街区的交通枢纽持续吸引新企业、新居民和长期投资。' },
        { icon: '🌱', title: '生活和社区', text: '有活力而不混乱，有社区而不孤立，发展而不失特色。' },
      ],
    },
    {
      type: 'section',
      title: '在萨默维尔买房之前要知道什么？',
      text: '萨默维尔没有统一的价格。每个广场表现都不同，位置上的小差别可能明显影响价值。',
      highlight: '做好这些准备会很有帮助：',
      bullets: ['了解小区域的价格', '了解多户住宅的分区规定和 condo 改建', '做好有竞争力的出价', '了解未来开发的影响'],
      note: '分清哪些地区正在趋稳、哪些还在加速，是关键。',
    },
  ],
};

export default guide;
