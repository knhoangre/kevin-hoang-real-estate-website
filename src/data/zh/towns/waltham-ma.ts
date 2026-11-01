import type { ZhTownGuideData } from '@/pages/zh/ZhTownGuide';

const guide: ZhTownGuideData = {
  slug: 'waltham-ma',
  title: '沃尔瑟姆（Waltham, MA）买房指南：Moody Street 和通勤',
  description:
    '沃尔瑟姆（Waltham, MA）中文指南：128 号公路和 Mass Pike 的交汇位置，Moody Street 市中心，Brandeis 和 Bentley 带来的出租市场，以及各街区的特点。',
  keywords: '沃尔瑟姆 Waltham 买房, Waltham condo, Moody Street, Brandeis 附近 住房, Waltham 多户 投资',
  subtitle:
    '沃尔瑟姆（Waltham）别称“钟表之城”，与牛顿、列克星敦、贝尔蒙特和 Watertown 相邻，位于主要通勤走廊上。相比周边市场价格较容易接受，房屋类型也很多样。',
  image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&h=600',
  buyerNote:
    'Bentley 和 Brandeis 都在沃尔瑟姆，支撑着不小的出租市场，如果您看多户住宅，这一点值得注意。Moody Street 是这里的餐饮区，靠近它是真正的便利。沃尔瑟姆的工厂历史也留下了一些格局特别的工业改建楼。',
  sections: [
    {
      type: 'intro',
      text: '沃尔瑟姆（Waltham）是波士顿西部都会区很有活力、位置很好的城市之一。它别称“钟表之城”（The Watch City），把历史风貌和现代发展结合在一起，有城市的活力、绿地和就业机会，价格也比周边市场容易接受一些。',
      highlight: '它与牛顿、列克星敦、贝尔蒙特和 Watertown 相邻，位于主要通勤走廊上，很受买家关注。',
    },
    {
      type: 'section',
      title: '人们为什么搬到沃尔瑟姆？',
      text: '沃尔瑟姆吸引的是想要便利、多样生活和长期潜力的买家。',
    },
    {
      type: 'subsection',
      title: '🚗 位置和通勤',
      text: '沃尔瑟姆位于交通的交汇处。',
      bullets: ['可直接上 Route 128 / I-95 和 Mass Pike', '连接 Route 20 和 Route 60', 'MBTA 通勤火车到 North Station', '开车很快可到剑桥、波士顿、牛顿和 128 号公路科技走廊'],
      note: '这样的交通是这里买家和出租需求的主要来源。',
    },
    {
      type: 'subsection',
      title: '🏙 热闹的市中心和 Moody Street',
      text: '沃尔瑟姆市中心已成为波士顿以外很活跃的生活区之一。',
      bullets: ['Moody Street 的餐厅、咖啡馆和夜生活', '本地商店、健身房和娱乐场所', '河边步道和社区活动', '不断增加的住宅和综合开发'],
      note: '这个适合步行的核心，持续改变着沃尔瑟姆对居民和投资者的吸引力。',
    },
    {
      type: 'subsection',
      title: '🌳 绿地和户外',
      text: '以靠近城区的城市来说，这里的户外设施很不错。',
      bullets: ['查尔斯河步道', 'Prospect Hill Park 和 Gore Place', '附近的 Beaver Brook 保护区', '自行车道、游乐场和保护用地'],
      note: '城市活力和户外生活的平衡，是这里重要的生活吸引力。',
    },
    {
      type: 'section',
      title: '沃尔瑟姆的街区各有什么特点？',
      text: '沃尔瑟姆有几个不同的住宅区，吸引不同的买家。',
      neighborhoods: [
        { name: 'South Side', description: '最靠近牛顿和 Watertown。通勤方便，有经典住宅，靠近 Moody Street。' },
        { name: 'North Waltham', description: '上 128 号公路方便，有较新的开发项目，靠近列克星敦和企业走廊。' },
        { name: 'Cedarwood 和 Piety Corner', description: '成熟的街区，住宅氛围浓，长期业主多。' },
        { name: 'Warrendale', description: '交通方便，受看重性价比和便利的买家欢迎。' },
        { name: '市中心 / Moody Street 一带', description: '偏城市化，condo 较多，吸引专业人士和投资者。' },
      ],
    },
    {
      type: 'section',
      title: '沃尔瑟姆的房市是什么样的？',
      text: '沃尔瑟姆的房屋类型在西郊算是非常多样的。',
      highlight: '您会看到：',
      bullets: ['独栋住宅', 'condo 和联排住宅', '三层楼（triple-decker）和多户住宅', '靠近交通的较新综合开发'],
      note: '位置、靠近雇主、市中心的更新和区域住房供应有限，一直在支撑这里的房价。',
    },
    {
      type: 'section',
      title: '沃尔瑟姆值得买吗？',
      reasons: [
        { icon: '📈', title: '发展潜力', text: '受益于来自剑桥、牛顿和贝尔蒙特的外溢需求，同时价格范围更宽。' },
        { icon: '🏘', title: '出租市场强', text: '科技、医疗、教育和企业就业中心带来持续的出租需求。' },
        { icon: '🚧', title: '持续开发', text: '市中心投资、住宅项目和商业发展持续提升长期价值。' },
        { icon: '🌎', title: '均衡的买家结构', text: '吸引自住业主、专业人士和投资者，市场流动性好。' },
      ],
    },
    {
      type: 'section',
      title: '在沃尔瑟姆买房之前要知道什么？',
      text: '沃尔瑟姆是由小市场组成的城市，街区选择、通勤条件和房屋类型都会明显影响价值。',
      highlight: '做好这些准备会很有帮助：',
      bullets: ['了解具体街区的价格', '了解多户住宅和 condo 的情况', '了解开发趋势', '有竞争力的出价策略', '分析租金和长期价值'],
      note: '分清哪些地方正在趋稳、哪些还在加速，是关键。',
    },
  ],
};

export default guide;
