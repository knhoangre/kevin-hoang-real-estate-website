import type { ZhTownGuideData } from '@/pages/zh/ZhTownGuide';

const guide: ZhTownGuideData = {
  slug: 'dover-ma',
  title: '多佛（Dover, MA）买房指南：一英亩地块和化粪池',
  description:
    '多佛（Dover, MA）中文指南：几乎全镇要求一英亩以上地块，化粪池和水井很普遍，与 Sherborn 共用的区域学校，以及在这里买房要查什么。',
  keywords: '多佛 Dover MA 买房, Dover Sherborn 学区, 多佛 化粪池, 大波士顿 大地块, Dover MA 豪宅',
  subtitle:
    '多佛（Dover）与韦尔斯利、韦斯顿、Medfield 和 Natick 相邻，几乎所有住宅区都要求一英亩以上的地块。这一点解释了这里的密度、价格和房源，化粪池和水井在这里是常态。',
  image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&h=600',
  schoolsNote: '多佛与 Sherborn 共用区域初中和高中，小学是多佛自己的。',
  buyerNote:
    '几乎所有住宅分区都要求一英亩或更大的地块，这一点解释了多佛的密度、价格和房源。化粪池和水井是常态，不是例外，请相应地安排验房预算。',
  sections: [
    {
      type: 'intro',
      text: '多佛（Dover）是大波士顿地区很有乡村感的社区之一，以庄园式住宅、私密性和大片保护用地著称，生活的特点是空间、宁静和长期的居住品质。',
      highlight: '它与韦尔斯利、韦斯顿、Medfield 和 Natick 相邻，适合想贴近自然，又不想失去大波士顿便利的买家。',
    },
    {
      type: 'section',
      title: '为什么选择多佛？',
      text: '多佛吸引的是看重私密、土地和长期稳定的买家。',
    },
    {
      type: 'subsection',
      title: '🌳 空间和自然',
      text: '多佛是这一带密度最低的社区之一。居民可以享受：',
      bullets: ['大住宅地块和庄园式房产', '绵延的受保护开放空间和步道', '风景优美的道路、农场和保护区', '宁静、私密的住宅氛围'],
      note: '离波士顿这么近还有这样的空间和安静，越来越少见。',
    },
    {
      type: 'subsection',
      title: '🎓 区域学校',
      text: '多佛属于口碑很好的区域学区，学校既影响买家的选择，也支撑长期房产价值。',
    },
    {
      type: 'subsection',
      title: '🚗 位置',
      text: '多佛的位置适合在西郊和波士顿工作的专业人士。',
      bullets: ['很快可上 Route 16、Route 109 和 Route 128', '靠近韦尔斯利、Natick、尼德姆和牛顿', '邻近城镇有通勤火车', '可以到达波士顿市中心、剑桥和主要就业中心'],
      note: '私密加上便利，是外地搬来的买家和高管选择多佛的重要原因。',
    },
    {
      type: 'section',
      title: '住在多佛是什么感觉？',
      text: '多佛没有密集的镇中心，这正是它的特点。这里有：',
      bullets: ['庄园式住宅区', '历史住宅和农田', '现代高端开发', '可以养马的房产和定制住宅'],
      note: '房子常常坐落在被保护用地包围的大地块上，形成整体的乡村感。',
    },
    {
      type: 'section',
      title: '多佛的房市是什么样的？',
      text: '多佛房市的特点是库存少、房产高端、业主长期持有。',
      highlight: '这里常见的房屋类型：',
      bullets: ['高端独栋住宅', '定制住宅和庄园', '翻新的历史房产', '部分高端新建房'],
      note: '分区和土地使用限制了密度，有助于保留城镇特色和长期价值。',
    },
    {
      type: 'section',
      title: '多佛值得买吗？',
      reasons: [
        { icon: '📈', title: '长期稳定', text: '开发有限，加上区域学校和城镇定位，支撑着长期稳定。' },
        { icon: '🏗', title: '高端定制住宅', text: '持续吸引高端定制住宅，适合想在私密环境中拥有现代住宅的买家。' },
        { icon: '🏡', title: '生活和私密', text: '很少有城镇能有这样的空间、绿地和幽静，同时还在波士顿的通勤范围内。' },
        { icon: '🌎', title: '外地买家', text: '常被从外地搬来、想要低调庄园式生活的专业人士选择。' },
      ],
    },
    {
      type: 'section',
      title: '在多佛买房之前要知道什么？',
      text: '多佛是一个比较特殊的市场，土地、分区和建造质量往往比面积更重要。',
      highlight: '买房前建议先做好这些功课：',
      bullets: ['分析地块和土地价值', '了解新建和翻新', '了解化粪池、水井和保护方面的问题', '留意未公开挂牌和私下出售的机会', '了解长期市场情况'],
      note: '在多佛，很多机会从来不会进入公开市场。',
    },
  ],
};

export default guide;
