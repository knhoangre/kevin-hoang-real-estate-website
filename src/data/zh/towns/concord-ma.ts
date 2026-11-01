import type { ZhTownGuideData } from '@/pages/zh/ZhTownGuide';

const guide: ZhTownGuideData = {
  slug: 'concord-ma',
  title: '康科德（Concord, MA）买房指南：历史街区和学区',
  description:
    '康科德（Concord, MA）中文指南：Walden Pond 和保护用地，通勤火车到 North Station，与 Carlisle 共用的区域高中，历史街区的限制，以及在这里买房要知道的事。',
  keywords: '康科德 Concord MA 买房, Concord Carlisle 学区, West Concord, Walden Pond 附近 住房, 康科德 历史 住宅',
  subtitle:
    '康科德（Concord）在波士顿西北约 20 英里，与列克星敦、Lincoln 和 Acton 相邻，以美国革命的历史、Walden Pond 和大片保护用地闻名。如果房子在历史街区内，外观改动会受到实际的限制。',
  image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=600',
  schoolsNote:
    '高中是与 Carlisle 共用的区域高中。康科德还集中了不少私立学校：Concord Academy、Middlesex School、Fenn School 和 Nashoba Brooks。',
  buyerNote:
    '康科德的历史街区对外观改动有实际的限制。如果房子在历史街区内，请在计划任何工程之前，先弄清需要哪些批准。',
  sections: [
    {
      type: 'intro',
      text: '康科德（Concord）是大波士顿地区历史最悠久、风景最优美的城镇之一，因在美国革命中的角色闻名世界，在本地则以学校、保存完好的自然风光和新英格兰风格著称。',
      highlight: '它在波士顿西北约 20 英里，与列克星敦、Lincoln 和 Acton 相邻，兼具文化传统、自然的宁静和舒适的郊区生活。',
    },
    {
      type: 'section',
      title: '人们为什么搬到康科德？',
      text: '康科德吸引的是想要空间、文化、教育和长期居住品质的买家。',
    },
    {
      type: 'subsection',
      title: '🎓 受到重视的公立学校',
      text: '康科德的公立学校系统很有名，持续带动住房需求和长期稳定，也是这里房产价值的主要支撑之一。',
    },
    {
      type: 'subsection',
      title: '🌳 保存完好的自然和开放空间',
      text: '康科德非常重视保护。居民可以享受：',
      bullets: ['大片保护用地和步行道', 'Concord River 和 Assabet River', 'Walden Pond 和周围的保护区', '历史农田、草地和风景优美的道路'],
      note: '离波士顿这么近，这样的环境很少见。',
    },
    {
      type: 'subsection',
      title: '🚆 通勤便利，郊区的宁静',
      text: '康科德通勤方便，同时保持着宁静。',
      bullets: ['MBTA 通勤火车到 North Station', '经 Route 2 直达剑桥和波士顿', '靠近 128 号公路和高科技走廊'],
      note: '这样的组合吸引着在剑桥、波士顿和 MetroWest 地区工作的专业人士。',
    },
    {
      type: 'section',
      title: '康科德的住宅区各有什么特点？',
      text: '康科德有几个不同的住宅区，每个都有自己的生活方式。',
      neighborhoods: [
        { name: 'Concord Center', description: '有历史，适合步行，有文化氛围。有精品店、餐饮、博物馆和通勤火车。' },
        { name: 'West Concord', description: '热闹的村区中心，社区感强，有本地商家和很受欢迎的通勤火车站。' },
        { name: 'South Concord', description: '以较大的房产、靠近保护区和庄园式住宅著称。' },
        { name: 'Great Meadows 和 Walden 一带', description: '风景优美，有私密性和历史住宅，靠近保护用地。' },
      ],
    },
    {
      type: 'section',
      title: '康科德的房市是什么样的？',
      text: '康科德房市的特点是注重保护，需求稳定。',
      highlight: '您会看到：',
      bullets: ['高端独栋住宅', '历史住宅和修复的殖民式住宅', '庄园式房产和定制住宅', '部分高端新建房'],
      note: '开发有限、分区保护和历史保护，都有助于维持长期价值。',
    },
    {
      type: 'section',
      title: '康科德值得买吗？',
      reasons: [
        { icon: '📈', title: '长期稳定', text: '城镇声誉、学校和土地保护支撑着这里的房产价值。' },
        { icon: '🏗', title: '高端翻新和定制住宅', text: '高端翻新和定制住宅持续吸引讲究的买家。' },
        { icon: '🏡', title: '生活和文化', text: '很少有城镇同时拥有这样的自然风景、文学历史和社区。' },
        { icon: '🌎', title: '搬迁买家', text: '常被搬迁到这里的专业人士选择。' },
      ],
    },
    {
      type: 'section',
      title: '在康科德买房之前要知道什么？',
      text: '康科德是一个专门的市场，历史背景、土地使用和具体位置都会明显影响价值。',
      highlight: '做好这些准备会很有帮助：',
      bullets: ['了解各村区的价格', '了解历史住宅和翻新', '了解保护和分区规定', '留意未公开挂牌的机会', '分析长期增值'],
    },
  ],
};

export default guide;
