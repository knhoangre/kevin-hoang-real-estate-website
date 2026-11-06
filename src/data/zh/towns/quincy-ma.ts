import type { ZhTownGuideData } from '@/pages/zh/ZhTownGuide';

const guide: ZhTownGuideData = {
  slug: 'quincy-ma',
  title: '昆西（Quincy, MA）买房指南：红线和海岸',
  description:
    '昆西（Quincy, MA）中文指南：四个红线车站，Wollaston Beach 和 Marina Bay，Quincy Center 的更新，各街区的特点和洪水区，以及在这里买房要知道的事。',
  keywords: '昆西 Quincy 买房, Quincy MA 房价, Wollaston, North Quincy, Marina Bay, 红线 买房',
  subtitle:
    '昆西（Quincy）位于波士顿以南，从城市街区一直延伸到海边，有四个红线车站。不同街区差别很大，价格取决于街区、离车站的远近和是否靠海，靠海的房子要查洪水区。',
  image: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1200&h=600',
  schoolsNote: '有两所公立高中，请确认具体地址属于哪一所。',
  buyerNote:
    '四个红线车站比波士顿以外大多数城市都多。昆西的街区差别很大，包括 Marina Bay、Squantum、Wollaston、Merrymount、Houghs Neck、Adams Shore、Germantown、Montclair 和 West Quincy。靠海的房子要查洪水区。',
  sections: [
    {
      type: 'intro',
      text: '昆西（Quincy）是南岸（South Shore）很有活力、很多样的房市之一，位于波士顿以南，从城市街区一直延伸到海边社区，同时有进城便利、公共交通、历史风貌和海岸生活。',
      highlight: '四个红线车站、主要高速公路和持续的重建，让它成为靠近波士顿买房时很受关注的地方。',
    },
    {
      type: 'section',
      title: '为什么选择昆西？',
      text: '昆西吸引的是看重地段、希望选择多一些的买家。',
    },
    {
      type: 'subsection',
      title: '🚇 公共交通和通勤',
      text: '昆西是波士顿以外公共交通连接最好的地方之一。',
      bullets: ['红线车站：North Quincy、Wollaston、Quincy Center、Quincy Adams', 'Quincy Center 有 MBTA 通勤火车', '很快可上 I-93、Route 3 和 Route 128', '方便通勤到波士顿市中心、Seaport 和剑桥'],
      note: '公共交通是这里长期房产需求最大的来源之一。',
    },
    {
      type: 'subsection',
      title: '🌊 海岸生活和绿地',
      text: '昆西把城市生活和海边、户外休闲结合在一起。',
      bullets: ['Wollaston Beach 和 Quincy Shore Drive', '靠近 Blue Hills 保护区', 'Marina Bay 的木栈道、餐饮和滨水生活', '众多城市公园、步道和历史遗址'],
      note: '海岸加通勤的组合，让昆西在波士顿周边的城市中很独特。',
    },
    {
      type: 'subsection',
      title: '🏙 重建和城市发展',
      text: '昆西近年来经历了大规模更新。',
      bullets: ['新的高端 condo 和公寓项目', 'Quincy Center 市中心的改善', '靠近交通的住房项目', '餐饮、零售和滨水区的扩展'],
      note: '这些变化正在改变买家对昆西的看法，也提升了长期前景。',
    },
    {
      type: 'section',
      title: '昆西的街区各有什么特点？',
      text: '昆西由几个不同的地区组成，价格和生活方式各不相同。',
      neighborhoods: [
        { name: 'Quincy Center', description: '城市的中心。有红线和通勤火车、市政厅、餐饮和大型重建。' },
        { name: 'Wollaston', description: '靠近红线和海滩，很受欢迎，condo 和独栋需求都很强。' },
        { name: 'North Quincy', description: '靠近交通和波士顿，受通勤者和投资者欢迎。' },
        { name: 'Marina Bay', description: '滨水生活，现代 condo，有码头和餐饮。' },
        { name: 'Houghs Neck 和 Squantum', description: '靠海的住宅区，有海景和社区感，房屋很有特色。' },
      ],
    },
    {
      type: 'section',
      title: '昆西的房市是什么样的？',
      text: '昆西的房屋类型在大波士顿算是非常多样的。',
      highlight: '这里常见的房屋类型：',
      bullets: ['condo 和新开发项目', '独栋住宅', '多户投资房', '高端滨水住宅'],
      note: '价格范围很宽，对首次购房者、换大房子的业主和投资者都有吸引力。',
    },
    {
      type: 'section',
      title: '昆西值得买吗？',
      reasons: [
        { icon: '📈', title: '增值和可负担', text: '受益于波士顿的外溢需求，价格也比很多靠近市区的地方更容易接受。' },
        { icon: '🏘', title: '出租需求强', text: '通勤者、医疗专业人士、学生和市政工作人员，带来持续的出租市场。' },
        { icon: '🚧', title: '持续开发', text: '靠近交通的项目和滨水投资持续增强这里的前景。' },
        { icon: '🌎', title: '多样的生活方式', text: '很少有城市既有市中心的便利，又有真正的海边社区。' },
      ],
    },
    {
      type: 'section',
      title: '在昆西买房之前要知道什么？',
      text: '昆西由小市场组成，价格因街区、离车站的远近和是否靠海而有很大不同。',
      highlight: '买房前建议先做好这些功课：',
      bullets: ['了解各街区的价格', '了解 condo 和独栋的差别', '评估靠近交通和靠海的溢价', '有竞争力的出价策略', '了解开发趋势'],
      note: '关键是看清哪些区域的房价已经趋稳，哪些还在上涨。',
    },
  ],
};

export default guide;
