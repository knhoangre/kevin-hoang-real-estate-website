import type { ZhTownGuideData } from '@/pages/zh/ZhTownGuide';

const guide: ZhTownGuideData = {
  slug: 'lexington-ma',
  title: '列克星敦（Lexington, MA）买房指南：街区、学区和通勤',
  description:
    '列克星敦（Lexington, MA）中文指南：各街区的特点，公立学校，Route 2 和 128 号公路的通勤，没有通勤火车的取舍，以及在这里买房要知道的事。',
  keywords: '列克星敦 Lexington 买房, Lexington MA 学区, 列克星敦 房价, East Lexington, Minuteman Bikeway',
  subtitle:
    '列克星敦（Lexington）位于波士顿西北，紧邻阿灵顿和伯灵顿，以公立学校、宽敞的住宅区和美国革命的历史闻名。这里的取舍是没有通勤火车，通勤靠 Route 2、128 号公路和附近的 Alewife 红线站。',
  image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=600',
  buyerNote:
    '这里的取舍是没有通勤火车，对一些通勤者来说，Minuteman Bikeway 自行车道确实可以替代。列克星敦的街区划分特别清楚，包括 Meriam Hill、Belfry Hill、Munroe Hill、Countryside、Four Corners 和 East Lexington 等。',
  sections: [
    {
      type: 'intro',
      text: '列克星敦（Lexington）是大波士顿地区历史意义最重大的城镇之一，世界闻名的美国革命发源地，在本地则以公立学校、优美的住宅区和生活品质著称。',
      highlight: '它位于波士顿西北，与阿灵顿和伯灵顿相邻，兼顾郊区的舒适、教育环境和通勤便利。',
    },
    {
      type: 'section',
      title: '为什么选择列克星敦？',
      text: '列克星敦吸引的是想要空间、稳定、社区氛围和长期价值的买家。',
    },
    {
      type: 'subsection',
      title: '🎓 口碑很好的公立学校',
      text: '列克星敦的公立学校口碑很好，既带动住房需求，也支撑房产价值。',
      note: '学校也让市场更有韧性，帮助这里的房子在不同的经济周期中保持吸引力。',
    },
    {
      type: 'subsection',
      title: '🌳 空间、私密和自然环境',
      text: '列克星敦以风景优美的街区、保护用地和宽敞的住宅地块闻名。居民可以享受：',
      bullets: ['绿树成荫的街道和经典的新英格兰建筑', '大片步行道和受保护的开放空间', '安静的住宅环境'],
      note: '对很多买家来说，这样的空间和私密，在靠近波士顿的地方越来越少见。',
    },
    {
      type: 'subsection',
      title: '🚗 地段和通勤',
      text: '对在大波士顿各地工作的人来说，列克星敦的位置很合适。',
      bullets: ['经 Route 2 直达剑桥和波士顿', '很快连接 Route 128 / I-95', '靠近伯灵顿的科技和企业走廊', '附近有 Alewife 红线站'],
      note: '这样的位置吸引了科技、医疗、生物技术、教育和金融行业的买家。',
    },
    {
      type: 'section',
      title: '列克星敦的街区各有什么特点？',
      text: '列克星敦由一个个住宅区组成，没有密集的商业中心，环境比较安静。',
      neighborhoods: [
        { name: 'Lexington Center', description: '有历史感，适合步行，很受欢迎。有本地商店、餐饮、公共空间和 Minuteman Bikeway。靠近中心的房子价格往往较高。' },
        { name: 'Meriam Hill', description: '列克星敦最成熟的街区之一，以经典的殖民风格住宅和较大的地块闻名，靠近学校和保护区。' },
        { name: 'Peacock Farm', description: '独特的世纪中期现代主义（mid-century modern）风格街区，以建筑价值和社区认同著称。' },
        { name: 'East Lexington', description: '因靠近剑桥、Alewife 和主要通勤路线而很受欢迎，常吸引看重通勤便利的专业人士。' },
        { name: 'Follen Hill 和 Cary Hill', description: '受欢迎的住宅区，有经典住宅、翻新房和新建房。' },
      ],
    },
    {
      type: 'section',
      title: '列克星敦的房市是什么样的？',
      text: '列克星敦房市的特点是需求旺、价格坚挺，而且不断有人投资翻新。',
      highlight: '这里常见的房屋类型：',
      bullets: ['高端独栋住宅', '定制新建房', '翻新的殖民风格和现代风格住宅', '部分联排住宅和高档 condo'],
      note: '这里的高端重建也在增加，老房子被现代住宅取代。土地有限加上持续的买家需求，支撑着长期价值。',
    },
    {
      type: 'section',
      title: '列克星敦值得买吗？',
      reasons: [
        { icon: '📈', title: '长期稳定', text: '学校、社区声誉和分区规定共同支撑着列克星敦的房产价值。' },
        { icon: '🏗', title: '高端和新建房机会', text: '这里吸引高端开发，买家可以买到现代住宅，同时保留城镇的特色。' },
        { icon: '🏡', title: '长期生活', text: '有学校、公园、休闲设施和社区活动，适合长期居住。' },
        { icon: '🌎', title: '外地买家', text: '很受搬迁到这里的专业人士和国际买家关注。' },
      ],
    },
    {
      type: 'section',
      title: '在列克星敦买房之前要知道什么？',
      text: '列克星敦竞争激烈，细节很重要。',
      highlight: '买房前建议先做好这些功课：',
      bullets: ['了解每个街区的估值', '比较新建房和翻新房', '了解学区范围和分区规定', '有力的出价策略和时机', '了解拆除重建和土地价值'],
      note: '在列克星敦，弄清土地的真实价值，往往和评估房子本身一样重要。',
    },
  ],
};

export default guide;
