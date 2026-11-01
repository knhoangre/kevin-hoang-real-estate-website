import type { ZhTownGuideData } from '@/pages/zh/ZhTownGuide';

const guide: ZhTownGuideData = {
  slug: 'winchester-ma',
  title: '住在温彻斯特（Winchester, MA）：镇中心、火车和房地产指南',
  description:
    '温彻斯特（Winchester, MA）中文指南：适合步行的镇中心和到 North Station 的通勤火车，Mystic Lakes 和 Middlesex Fells，洪水区要查什么，以及老房子的验房。',
  keywords: '温彻斯特 Winchester MA 买房, Winchester 学区, Winchester Center, Wedgemere, Winchester 洪水区',
  subtitle:
    '温彻斯特（Winchester）在波士顿以北约八英里，有真正适合步行的镇中心，火车站就在中心，约二十分钟到 North Station，还靠近大片保护区。部分地区在洪水区内，请及早查具体地址。',
  image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&h=600',
  buyerNote:
    '通勤火车站就在真正适合步行的镇中心，波士顿周边很少有郊区能做到。Aberjona 河穿过镇中心，部分地区在已划定的洪水区内。请及早查具体地址的洪水区类别，因为它会影响保险，有时也影响贷款。',
  sections: [
    {
      type: 'intro',
      text: '温彻斯特（Winchester）在波士顿以北约八英里，与梅德福、阿灵顿、Woburn、Stoneham 和列克星敦相邻。它有真正适合步行的市中心，通勤火车站就在中心，还可以直接进入麻州东部最大的保护区之一。',
      highlight: '它是波士顿以北对西郊经典问题的回答：真正的镇中心、受到重视的学校，以及约二十分钟到 North Station 的火车。',
    },
    {
      type: 'section',
      title: '人们为什么搬到温彻斯特？',
      text: '温彻斯特的吸引力在于，一个小镇里同时有市中心、水面和树林。',
    },
    {
      type: 'subsection',
      title: '🚉 可以真正走路去的镇中心',
      text: 'Winchester Center 是一个真正运转的市中心，而不是一排商铺：有商店、餐厅、图书馆和公共绿地，通勤火车站就在中间。',
      bullets: [
        'Lowell 线通勤火车，从 Winchester Center 到 North Station',
        '南边不远有第二个车站 Wedgemere',
        '开车去 I-93 和 Route 128 都很近',
        '有巴士通往梅德福和橙线',
      ],
      note: '能走路到中心和车站的房子，成交情况和镇上其他地方不同，而且一直如此。',
    },
    {
      type: 'subsection',
      title: '🌊 湖泊、池塘和 Fells',
      text: '以这样的规模，温彻斯特的水面和受保护土地比大多数城镇都多。',
      bullets: [
        '南边的 Mystic Lakes',
        '镇内的 Wedge Pond 和 Winter Pond',
        '东侧的 Middlesex Fells 保护区，有数千英亩的步道',
        '穿过镇中心的 Aberjona 河',
      ],
    },
    {
      type: 'subsection',
      title: '🎓 学校和社区',
      text: '温彻斯特有自己的学区，这是很多人搬来的主要原因之一。以它的规模，这里的公民和文化生活也特别活跃，包括 Griffin 摄影博物馆和长期举办的 Town Day 传统活动。',
    },
    {
      type: 'section',
      title: '温彻斯特的街区各有什么特点？',
      text: '温彻斯特的街区由地形决定：地势从中心向几个方向升高。',
      neighborhoods: [
        { name: 'Winchester Center', description: '适合步行的核心，围绕公共绿地和车站。有老房子和一些 condo，通勤时间全镇最短。' },
        { name: 'West Side', description: '向列克星敦和阿灵顿方向升高，大地块上有较大的房子，更安静、更隐蔽。这里默认要开车。' },
        { name: 'Wedgemere', description: '围绕第二个通勤火车站，在中心以南。方便，人流略少，受想坐火车又不想要市中心人流的通勤者欢迎。' },
        { name: 'Symmes Corner 和北部', description: '靠近 Woburn 和 Stoneham，有中世纪和较新的房子，上高速更快。' },
        { name: 'Mystic Lakes 一带', description: '南边沿水的地方，与梅德福和阿灵顿相邻。风景优美，有镇上很有特色的房产。' },
      ],
    },
    {
      type: 'section',
      title: '温彻斯特的房市是什么样的？',
      text: '温彻斯特的房子比很多邻近城镇更老、更大，有宽敞的维多利亚式和殖民式住宅，也有中世纪建筑和少量新建房。',
      highlight: '您会看到：',
      bullets: [
        '大型维多利亚式和木瓦风格住宅，尤其是在中心附近',
        'West Side 一带的经典殖民式住宅',
        '北部边缘的中世纪住宅',
        '有限的 condo 市场，多在中心和车站附近',
        '翻新的老房子，以及好地块上的拆除重建',
      ],
      note: '老房子值得仔细验房：外观相似的房子，系统、保温和过去的翻新质量可能差别很大。',
    },
    {
      type: 'subsection',
      title: '💧 一项值得知道的本地检查',
      text: 'Aberjona 河和镇上的低洼地区有记录在案的洪水历史，部分地区在已划定的洪水区内。这不是避开这个镇的理由，而是要及早查具体地址的洪水地图的理由，因为它会影响保险费，有时也影响贷款。',
      note: '对靠近河流或池塘的任何房子，请在交易深入之前先问清洪水区类别。',
    },
    {
      type: 'section',
      title: '温彻斯特值得买吗？',
      reasons: [
        { icon: '🚉', title: '火车加市中心', text: '通勤火车站位于适合步行的镇中心，波士顿周边真正有这种组合的郊区并不多。' },
        { icon: '🌲', title: '靠近 Fells', text: '可以直接进入数千英亩的受保护保护区，这是无法被新建或被竞争掉的生活优势。' },
        { icon: '🎓', title: '自己的学校', text: '独立且受到好评的学区，年复一年地支撑着需求。' },
        { icon: '🛣', title: '波士顿以北的位置', text: 'I-93 和 Route 128 可以到达从西郊不方便去的就业中心。' },
      ],
    },
    {
      type: 'section',
      title: '在温彻斯特买房之前要知道什么？',
      text: '离中心和车站的远近是这个市场最强的单一因素，既体现在竞争上，也体现在价格上。',
      highlight: '出价之前：',
      bullets: [
        '在您实际上班的时间，从房子走到车站',
        '查具体地址的洪水区类别',
        '按房龄安排合适的验房预算',
        '看过去的翻新是否有许可、做得怎样',
        '了解镇上哪些地方上高速比较远',
      ],
      note: '温彻斯特的老房子，相似的外表背后状况差别很大，验房才是真正的信息来源。',
    },
  ],
};

export default guide;
