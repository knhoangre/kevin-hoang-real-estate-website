import type { ZhTownGuideData } from '@/pages/zh/ZhTownGuide';

const guide: ZhTownGuideData = {
  slug: 'cambridge-ma',
  title: '住在剑桥（Cambridge, MA）：广场、街区和房地产指南',
  description:
    '剑桥（Cambridge, MA）中文指南：哈佛、MIT 和 Kendall Square 对房市的影响，红线交通，各广场和街区的特点，以及在这个竞争激烈的市场买房要知道的事。',
  keywords: '剑桥 Cambridge 买房, 哈佛 附近 买房, MIT 附近 住房, Kendall Square condo, Cambridge MA 房价, 波士顿 多户 投资',
  subtitle:
    '剑桥（Cambridge）是哈佛大学和麻省理工学院所在地，步行便利，有红线地铁，紧邻波士顿。这里的房市竞争激烈，每个广场和街区都像一个独立的市场。',
  image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&h=600',
  schoolsNote: '剑桥全市只有一所公立高中。',
  buyerNote:
    '剑桥是一个由广场组成的城市：Harvard、Central、Kendall、Porter、Inman 和 Lechmere，13 个官方街区的表现就像独立的市场。Kendall Square 的生物技术和科技集群，是东半部大部分需求的来源。',
  sections: [
    {
      type: 'intro',
      text: '剑桥（Cambridge）是大波士顿地区最有代表性的城市之一，以哈佛大学和麻省理工学院闻名世界。历史风貌、前沿创新和热闹的城市生活，造就了新英格兰竞争很激烈的房市之一。',
      highlight: '无论您是首次购房者、生物技术或科技行业的专业人士，还是看重长期价值的买家，剑桥都值得认真考虑。',
    },
    {
      type: 'section',
      title: '人们为什么搬到剑桥？',
      text: '剑桥提供了很少有城市能同时具备的东西：步行便利、文化、绿地和经济实力。',
    },
    {
      type: 'subsection',
      title: '🎓 世界级的教育和创新',
      text: '哈佛和麻省理工不只影响城市文化，也带动本地经济、吸引人才，并持续创造住房需求。这让剑桥的房市历来很有韧性，竞争也很激烈。',
    },
    {
      type: 'subsection',
      title: '🚇 地段和交通',
      text: '住在剑桥，几分钟就能到波士顿市中心，同时又有社区感。',
      bullets: [
        '红线车站（Harvard、Central、Kendall、Alewife）',
        '很快可到波士顿市中心、Back Bay 和 Logan 机场',
        '可方便地上 Storrow Drive、Memorial Drive 和 Route 2',
      ],
      note: '对买家来说，这样的交通直接支撑着长期房产价值和出租需求。',
    },
    {
      type: 'subsection',
      title: '🌳 适合步行，很有特色',
      text: '剑桥由关系紧密的街区、绿树成荫的街道和活跃的社区空间组成。从咖啡馆和书店到河边步道和公共广场，这里吸引着想要城市生活、又不想失去邻里感的人。',
    },
    {
      type: 'section',
      title: '剑桥的街区各有什么特点？',
      text: '剑桥每个地方的感觉都不同，这也是它吸引各种买家的原因之一。',
      neighborhoods: [
        { name: 'Harvard Square', description: '有历史、有文化、有活力。以经典建筑、书店、街头生活和靠近哈佛园闻名。受专业人士、投资者和看重长期价值的买家欢迎。' },
        { name: 'Kendall Square', description: '创新的中心。有大型生物技术和科技公司、高端开发项目和很强的出租需求。适合想买较新建筑、condo 和有投资潜力的买家。' },
        { name: 'Central Square', description: '有艺术气息，多元，还在变化。结合了文化、夜生活和社区，也有大型重建和发展机会。' },
        { name: 'Porter Square 和 North Cambridge', description: '更偏住宅，交通很好。受想要稍大空间、较安静街道、相对剑桥中部更实惠的买家欢迎。' },
        { name: 'Cambridgeport 和 Riverside', description: '靠近查尔斯河和波士顿。以迷人的小街、翻新的联排住宅和靠近 MIT 及 Back Bay 著称。' },
      ],
    },
    {
      type: 'section',
      title: '剑桥的房市是什么样的？',
      text: '剑桥是麻州竞争很激烈的房市之一。',
      highlight: '这里的需求持续不断，原因是：',
      bullets: ['库存有限', '靠近大型雇主', '大学的影响', '买家和租客持续不断'],
      note: '您会看到历史独栋住宅、多户投资房、高端 condo 和新开发项目，以及翻新的联排和 loft。',
    },
    {
      type: 'section',
      title: '剑桥值得买吗？',
      reasons: [
        { icon: '📈', title: '长期基础', text: '全球性的学术和研究机构，是这里房市相对稳定的重要原因。' },
        { icon: '🏙', title: '出租需求高', text: '学生、教职员工、研究人员和专业人士带来很强的出租市场，适合考虑自住加出租、多户住宅或长期投资的买家。' },
        { icon: '🏗', title: '持续发展', text: '从 Kendall Square 的扩展到基础设施升级，剑桥还在变化。发展保持了需求，严格的分区规定则有助于维持长期价值。' },
        { icon: '🌎', title: '生活和稳定', text: '除了财务上的考虑，还有日常的生活品质：步行便利、餐饮、绿地、文化机构，以及靠近波士顿。' },
      ],
    },
    {
      type: 'section',
      title: '在剑桥买房之前要知道什么？',
      text: '因为竞争激烈，买家需要：',
      bullets: ['扎实的市场知识', '各街区的价格情况', '多人竞价时的策略', '了解分区规定、condo 文件和建筑历史'],
      note: '剑桥每个小区域的表现都不一样。了解这些小市场，往往决定您是多付了钱，还是买得明智。',
    },
  ],
};

export default guide;
