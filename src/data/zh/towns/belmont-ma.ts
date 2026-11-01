import type { ZhTownGuideData } from '@/pages/zh/ZhTownGuide';

const guide: ZhTownGuideData = {
  slug: 'belmont-ma',
  title: '住在贝尔蒙特（Belmont, MA）：三个广场、两户住宅和房地产指南',
  description:
    '贝尔蒙特（Belmont, MA）中文指南：Belmont Center、Cushing 和 Waverley 三个广场，通勤火车和没有地铁的取舍，两户住宅和小型 condo 协会，以及买房前要查什么。',
  keywords: '贝尔蒙特 Belmont MA 买房, Belmont 学区, Belmont Hill, 两户住宅 Belmont, 靠近 剑桥 买房',
  subtitle:
    '贝尔蒙特（Belmont）只有约四平方英里，夹在剑桥、阿灵顿、Watertown、沃尔瑟姆和列克星敦之间，几乎全是住宅。想靠近剑桥、看重学区，又不想要剑桥的密度和价格的买家，常常看这里。',
  image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=600',
  buyerNote:
    '没有地铁站是相对于阿灵顿或剑桥的主要取舍。贝尔蒙特的两户住宅比例特别高，很多是业主自住，很多 condo 也是由这些两户住宅改成的两单元协会，有自己特殊的管理问题。',
  sections: [
    {
      type: 'intro',
      text: '贝尔蒙特（Belmont）是一个约四平方英里的住宅城镇，夹在剑桥、阿灵顿、Watertown、沃尔瑟姆和列克星敦之间。它长期以来的别称“家园之镇”（Town of Homes）很准确：这里几乎全是住宅，只有小型商业广场，工业很少。',
      highlight: '想靠近剑桥、看重学区，但不想要剑桥的密度和价格的人，常常搬到这里。',
    },
    {
      type: 'section',
      title: '人们为什么搬到贝尔蒙特？',
      text: '贝尔蒙特的吸引力很一致：学校、位置和安静的住宅环境。',
    },
    {
      type: 'subsection',
      title: '🎓 学校是主要原因',
      text: '对大多数来这里看房的买家来说，学区就是他们考虑贝尔蒙特的原因。镇上近年来在设施上投入很大，包括新建一座大型初高中校园，取代老旧的校舍。无论市场其他方面怎么变，由学校带动的需求都很稳定。',
    },
    {
      type: 'subsection',
      title: '🚆 从贝尔蒙特通勤',
      text: '贝尔蒙特离城市近，又不算城区，出行有几种方式。',
      bullets: [
        'Fitchburg 线通勤火车，在 Belmont Center 和 Waverley 停靠',
        '直达 Harvard Square 方向的巴士',
        '开车往西走 Route 2，横穿全镇走 Route 60',
        '非高峰时间不到半小时可到剑桥和 Kendall Square',
      ],
      note: '贝尔蒙特没有自己的地铁站，这是相对于阿灵顿或剑桥的主要取舍。',
    },
    {
      type: 'subsection',
      title: '🌲 开放空间和山丘',
      text: 'Belmont Hill 占据了全镇北半部，这里有很多较大的住宅。Rock Meadow 保护区、Habitat Education Center 和 Western Greenway，让这个镇的受保护土地比它的面积看起来要多。',
      bullets: [
        'Belmont Hill：房子更大，地块更大，街道安静',
        'Rock Meadow 和 Western Greenway 步道网络',
        '原 McLean Hospital 的土地，其中一部分已重建为住宅',
      ],
    },
    {
      type: 'section',
      title: '贝尔蒙特的广场和街区各有什么特点？',
      text: '贝尔蒙特围绕三个小广场形成，而不是一个市中心。住在哪个广场附近，比镇界更影响日常生活。',
      neighborhoods: [
        { name: 'Belmont Center', description: '主要广场，有通勤火车站、图书馆和镇上大部分商店和餐厅。适合步行，是全镇最方便少开车的地方。' },
        { name: 'Cushing Square', description: '较小，靠近 Watertown，有较新的综合开发和老住宅。适合想要步行便利、门槛又比 Center 略低的买家。' },
        { name: 'Waverley Square', description: '三个广场中最朴素的，有自己的通勤火车站，去沃尔瑟姆很方便。住宅更密集，有不少两户住宅。' },
        { name: 'Belmont Hill', description: '大地块上的大型独栋住宅，安静，几乎全是住宅。这里默认要开车。' },
        { name: 'Winn Brook', description: '地势较平、关系紧密的街区，靠近剑桥，有一所受到好评的小学，房子有殖民式和 cape 风格。' },
      ],
    },
    {
      type: 'section',
      title: '贝尔蒙特的房市是什么样的？',
      text: '贝尔蒙特的房子大多建于二十世纪上半叶到中期。以这样的郊区来说，两户住宅的比例特别高。',
      highlight: '市场大致分为：',
      bullets: [
        '地势较平的街区中的殖民式、cape 和维多利亚式住宅',
        'Belmont Hill 上较大的独栋住宅',
        '两户住宅，很多是业主自住、另一户出租',
        'condo，常常由两户住宅改建',
        '数量有限的较新建筑，包括 McLean 的重建项目',
      ],
      note: '两户住宅值得了解：很多买家靠它把数字算得过来，这也是为什么这里很多 condo 是两单元协会，并带来相应的管理问题。',
    },
    {
      type: 'section',
      title: '贝尔蒙特值得买吗？',
      reasons: [
        { icon: '🎓', title: '持久的学校需求', text: '由学校带动的需求很持久，不太受大市场影响。' },
        { icon: '📍', title: '位置', text: '与剑桥、阿灵顿、Watertown、沃尔瑟姆和列克星敦相邻，可以同时到达几个主要就业区。' },
        { icon: '🏘', title: '供应有限', text: '四平方英里，几乎已经建满，新开发的土地很少，供应变化非常慢。' },
        { icon: '🏡', title: '两户住宅的灵活性', text: '自住的两户住宅可以帮买家抵消持有成本，也让卖家有更多潜在买家。' },
      ],
    },
    {
      type: 'section',
      title: '在贝尔蒙特买房之前要知道什么？',
      text: '地势较平的街区中，状况好的房子成交很快；Belmont Hill 买家较少，成交较慢。',
      highlight: '出价之前值得查的事：',
      bullets: [
        '这个地址实际属于哪所小学',
        '如果打算坐火车，走到 Belmont Center 或 Waverley 要多久',
        '两户住宅：第二户的状况，以及现有的租约',
        '小型 condo 协会：储备金，以及由谁管理',
        '主要系统的年龄，这里大多数房子都有一定年头',
      ],
      note: '在这么小的镇，到火车站多走十分钟，是真实而持久的差别。',
    },
  ],
};

export default guide;
