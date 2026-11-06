import type { ZhTownGuideData } from '@/pages/zh/ZhTownGuide';

const guide: ZhTownGuideData = {
  slug: 'braintree-ma',
  title: '布伦特里（Braintree, MA）买房指南：红线终点站',
  description:
    '布伦特里（Braintree, MA）中文指南：红线终点站和主要高速公路，South Shore Plaza，各街区的特点，以及在南岸这个通勤方便的城镇买房要知道的事。',
  keywords: '布伦特里 Braintree 买房, Braintree MA 房价, 红线 终点站, East Braintree, South Shore 买房',
  subtitle:
    '布伦特里（Braintree）位于波士顿以南，与昆西、Weymouth 和 Milton 相邻，是红线的终点站，也是 I-93、Route 3 和 Route 128 的交汇处。住在终点站，早上上车通常有座位，这个实际好处常被忽略。',
  image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&h=600',
  buyerNote:
    '作为红线的终点站，早上上车通常有座位，沿线其他车站的通勤者未必有这个条件。这个好处很实在，却常被忽略。',
  sections: [
    {
      type: 'intro',
      text: '布伦特里（Braintree）是南岸（South Shore）位置很好、交通很方便的社区之一，位于波士顿以南，与昆西、Weymouth 和 Milton 相邻，结合了通勤便利、居住空间、购物配套和长期的住房需求。',
      highlight: '直达波士顿的轨道交通、主要高速公路和成熟的城镇设施，让它在南岸一直很受欢迎。',
    },
    {
      type: 'section',
      title: '为什么选择布伦特里？',
      text: '布伦特里吸引的是看重地段和便利的买家。',
    },
    {
      type: 'subsection',
      title: '🚇 轨道交通和高速公路',
      text: '布伦特里是波士顿以南交通最方便的城镇之一。',
      bullets: ['MBTA 红线终点站（Braintree 站）', '有通勤火车', '直接连接 I-93、Route 3 和 Route 128', '很快可到波士顿市中心、South Boston 和 Logan 机场'],
      note: '这对波士顿通勤者和在大波士顿各地工作的专业人士特别有吸引力。',
    },
    {
      type: 'subsection',
      title: '🛍 购物、餐饮和日常便利',
      text: '布伦特里有南岸一些最知名的零售和生活场所。',
      bullets: ['South Shore Plaza（新英格兰最大的购物中心之一）', '全国连锁和本地餐饮', '杂货、健身、医疗和娱乐中心', '完善的城镇服务和设施'],
      note: '居民既有郊区的舒适，又有城市般的便利。',
    },
    {
      type: 'subsection',
      title: '🌳 公园、街区和社区生活',
      text: '布伦特里有成熟的住宅区、公园和休闲设施。',
      bullets: ['Pond Meadow Park', 'Sunset Lake', 'Thayer Academy 一带', '本地运动场、步道和社区中心'],
      note: '空间和便利的平衡，持续吸引着长期业主。',
    },
    {
      type: 'section',
      title: '布伦特里的街区各有什么特点？',
      text: '布伦特里有几个不同的住宅区，吸引不同的买家。',
      neighborhoods: [
        { name: 'East Braintree', description: '靠近红线和高速公路，通勤方便，很受欢迎。' },
        { name: 'South Braintree / Thayer Academy 一带', description: '住宅区成熟，房子较大。' },
        { name: 'Braintree Highlands', description: '镇上最成熟的地区之一，有经典住宅和安静的街道。' },
        { name: 'Weymouth Landing 边界一带', description: '靠近交通，受看重便利和性价比的买家欢迎。' },
      ],
    },
    {
      type: 'section',
      title: '布伦特里的房市是什么样的？',
      text: '布伦特里的房屋类型很多样。',
      highlight: '这里常见的房屋类型：',
      bullets: ['独栋住宅', 'condo 和联排住宅', '错层、殖民风格和 Cape 风格住宅', '部分多户住宅机会'],
      note: '位置、公共交通和持续的买家需求，一直在支撑这里的房价。',
    },
    {
      type: 'section',
      title: '布伦特里值得买吗？',
      reasons: [
        { icon: '📈', title: '长期需求', text: '高速公路、红线和城镇设施的组合，支撑着持续的住房需求。' },
        { icon: '🏘', title: '相对波士顿更实惠', text: '相比波士顿、Milton 和昆西的滨水区，买家可以得到更多空间和更好的性价比。' },
        { icon: '🚧', title: '持续的基础设施投资', text: '城镇改善、交通连接和重建项目支撑着未来的价值。' },
        { icon: '🌎', title: '南岸的门户', text: '布伦特里位于南岸的入口，长期的区域发展对它有利。' },
      ],
    },
    {
      type: 'section',
      title: '在布伦特里买房之前要知道什么？',
      text: '布伦特里的价格由位置决定，离公共交通、高速公路和学校的远近影响很大。',
      highlight: '买房前建议先做好这些功课：',
      bullets: ['了解具体街区的价格', '了解靠近交通的溢价', '有竞争力的出价策略', '把握市场时机', '比较需要翻新和可直接入住的房子'],
    },
  ],
};

export default guide;
