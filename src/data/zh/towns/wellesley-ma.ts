import type { ZhTownGuideData } from '@/pages/zh/ZhTownGuide';

const guide: ZhTownGuideData = {
  slug: 'wellesley-ma',
  title: '韦尔斯利（Wellesley, MA）买房指南：街区、学区和通勤火车',
  description:
    '韦尔斯利（Wellesley, MA）中文指南：Wellesley Square 等街区的特点，三个通勤火车站，公立学校，新建房市场，以及在这里买房要知道的事。',
  keywords: '韦尔斯利 Wellesley 买房, Wellesley MA 学区, 韦尔斯利 房价, Wellesley Hills, Wellesley 通勤火车',
  subtitle:
    '韦尔斯利（Wellesley）位于波士顿以西，与牛顿、韦斯顿和尼德姆相邻，有三个通勤火车站和一个适合步行的镇中心，以公立学校和优美的住宅区闻名。',
  image: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=1200&h=600',
  buyerNote:
    '镇上有三所大学：Wellesley College、Babson College 和 Massachusetts Bay Community College，这影响着出租市场和交通。九个街区（Wellesley Farms、The Fells、Wellesley Hills、Wellesley Square、Poets\' Corner、Babson Park、Peirce Estates、College Heights 和 Wellesley Lower Falls）确实各不相同。',
  sections: [
    {
      type: 'intro',
      text: '韦尔斯利（Wellesley）是大波士顿地区长期受欢迎的城镇之一，以公立学校、优美的街区、热闹的镇中心和优雅的住宅风格著称。',
      highlight: '它位于波士顿以西，与牛顿、韦斯顿和尼德姆相邻，同时拥有舒适的住宅环境、步行便利和通勤便利。',
    },
    {
      type: 'section',
      title: '人们为什么搬到韦尔斯利？',
      text: '韦尔斯利的特别之处在于，既有社区的魅力，也有高品质的住宅。',
    },
    {
      type: 'subsection',
      title: '🎓 受到重视的公立学校',
      text: '韦尔斯利的公立学校系统很有名，持续带动住房需求和市场稳定。学校声誉是这里房市竞争激烈的重要原因之一。',
    },
    {
      type: 'subsection',
      title: '🌳 经典的新英格兰风景',
      text: '韦尔斯利有绿树成荫的街道、风景优美的池塘和经典建筑。居民可以享受：',
      bullets: ['优雅的独栋住宅和翻新的殖民式住宅', '整洁的街区和很强的社区认同', '优美的开放空间和休闲设施'],
      note: '这里给人的感觉是成熟、精致、不过时。',
    },
    {
      type: 'subsection',
      title: '🚆 适合步行的镇中心和通勤',
      text: '韦尔斯利的镇中心在西郊很受欢迎。',
      bullets: [
        'MBTA 通勤火车站（Wellesley Square、Wellesley Hills、Wellesley Farms）',
        '热闹的市中心，有精品店、餐厅、咖啡馆和社区空间',
        '可直接上 Route 9、I-95 和 Mass Pike',
      ],
      note: '这样的条件对通勤到波士顿、剑桥和 128 号公路一带的专业人士特别有吸引力。',
    },
    {
      type: 'section',
      title: '韦尔斯利的街区各有什么特点？',
      text: '韦尔斯利由几个不同的住宅区组成，各有不同的特点和便利。',
      neighborhoods: [
        { name: 'Wellesley Square', description: '镇的中心。非常适合步行，通勤方便，有餐饮、购物和社区活动。' },
        { name: 'Wellesley Hills', description: '住宅氛围受欢迎，靠近 Route 9，有经典住宅也有较新的房子。' },
        { name: 'Wellesley Farms', description: '以庄园式房产、优美的环境和靠近保护区闻名。' },
        { name: 'Cliff Estates 和 Dana Hall 一带', description: '很受追捧的街区，以优雅的住宅、较大的地块和靠近学校及镇上设施著称。' },
      ],
    },
    {
      type: 'section',
      title: '韦尔斯利的房市是什么样的？',
      text: '韦尔斯利房市的特点是需求高、供应少，而且不断有人投资翻新。',
      highlight: '您会看到：',
      bullets: ['高端独栋住宅', '定制新建房', '翻新的历史住宅', '高档联排住宅和部分 condo'],
      note: '这里的新建房也不少，买家可以买到现代住宅，同时保留传统的风貌。',
    },
    {
      type: 'section',
      title: '韦尔斯利值得买吗？',
      reasons: [
        { icon: '📈', title: '长期基础', text: '学校、城镇声誉和靠近波士顿的位置支撑着这里的房产价值。' },
        { icon: '🏗', title: '高端重建和新建房', text: '拆除重建和高端新建房仍然常见，反映了买家想在成熟城镇拥有现代住宅的需求。' },
        { icon: '🏡', title: '生活和社区', text: '结合了步行便利、社区活动、绿地和舒适的居住环境。' },
        { icon: '🌎', title: '搬迁需求', text: '持续吸引搬迁到这里的专业人士和高管。' },
      ],
    },
    {
      type: 'section',
      title: '在韦尔斯利买房之前要知道什么？',
      text: '韦尔斯利是一个很讲策略的市场，价格、土地价值和街区差异都很重要。',
      highlight: '做好这些准备会很有帮助：',
      bullets: ['了解具体街区的价格', '分析新建房和翻新房', '做好出价定位', '了解分区和重建的趋势', '把握时机，留意未公开挂牌的机会'],
      note: '弄清价值是在房子本身还是在未来的可能性上，往往很关键。',
    },
  ],
};

export default guide;
