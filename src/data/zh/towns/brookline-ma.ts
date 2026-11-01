import type { ZhTownGuideData } from '@/pages/zh/ZhTownGuide';

const guide: ZhTownGuideData = {
  slug: 'brookline-ma',
  title: '布鲁克莱恩（Brookline, MA）买房指南：绿线、condo 和学区',
  description:
    '布鲁克莱恩（Brookline, MA）中文指南：绿线和 Longwood 医疗区，Coolidge Corner 等街区的特点，这里的 condo 文件为什么特别重要，以及买房要注意什么。',
  keywords: '布鲁克莱恩 Brookline 买房, Brookline condo, Coolidge Corner, Longwood 医疗区 住房, Brookline 学区',
  subtitle:
    '布鲁克莱恩（Brookline）几乎被波士顿市完全包围，却是独立的城镇，有自己的镇政府和学区。您几分钟就能进城，这一点是波士顿任何街区都比不了的组合。',
  image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&h=600',
  schoolsNote:
    '八所小学对应一所综合高中。布鲁克莱恩有自己的学区，不与波士顿共用，对很多买家来说这正是他们来这里看房的原因。',
  buyerNote:
    '布鲁克莱恩是诺福克郡的飞地，几乎四面都被波士顿包围。这里的 condo 文件比几乎任何地方都重要，因为很多房子是老建筑改建的，业主协会规模小、储备金薄。',
  sections: [
    {
      type: 'intro',
      text: '布鲁克莱恩（Brookline）是一个几乎完全被波士顿市包围的独立城镇，这一点解释了它房市的大部分特点。您几分钟就能进城，同时有独立的镇政府和自己的学区，这是波士顿任何街区都提供不了的组合。',
      highlight: '对在波士顿 condo 和郊区之间犹豫的买家来说，布鲁克莱恩往往是答案：可以步行，有绿线，还有自己的学校。',
    },
    {
      type: 'section',
      title: '人们为什么搬到布鲁克莱恩？',
      text: '布鲁克莱恩吸引的是想靠近城市，又不想真正住在城里的买家。',
    },
    {
      type: 'subsection',
      title: '🚊 非常方便的轨道交通',
      text: '麻州很少有地方有这么好的轨道交通。',
      bullets: [
        '绿线 C 支线贯穿 Beacon Street',
        '绿线 D 支线经过 Brookline Village、Brookline Hills、Beaconsfield、Reservoir 和 Chestnut Hill',
        'E 支线和 Longwood 医疗区就在镇界外',
        '多条巴士线路，商业广场真正适合步行',
      ],
      note: '一个镇里有两条绿线支线，这就是为什么很多住户不需要第二辆车，也是为什么离车站的远近会明显反映在价格上。',
    },
    {
      type: 'subsection',
      title: '🏥 Longwood 的影响',
      text: 'Longwood 医疗和学术区有医院、医学院和研究机构，直接与布鲁克莱恩相邻。这带来了来自医生、住院医师、研究人员和研究生的持续需求，很多还有可预期的多年周期。这是当地房市最持久的需求来源。',
    },
    {
      type: 'subsection',
      title: '🌳 广场、公园和翡翠项链',
      text: '布鲁克莱恩围绕几个不同的商业广场形成，而不是一个市中心，广场之间有大片绿地。',
      bullets: [
        'Coolidge Corner：最热闹，以 Coolidge Corner Theatre 为中心',
        'Brookline Village：较老、较安静，靠近 Longwood',
        'Washington Square：较小，更有住宅感',
        'Larz Anderson Park，以及 Olmsted 设计的翡翠项链（Emerald Necklace）公园带',
      ],
    },
    {
      type: 'section',
      title: '布鲁克莱恩的街区各有什么特点？',
      text: '布鲁克莱恩不同地方的特点差别很大，所以对全镇一概而论往往没有用。',
      neighborhoods: [
        { name: 'Coolidge Corner', description: '密集、适合步行、以公共交通为主。主要是 condo 和公寓楼，很多是战前建筑。受专业人士、医务人员和想步行到各处的换小房子业主欢迎。' },
        { name: 'Brookline Village', description: '房子较老，离 Longwood 最近。有 condo、两户住宅和较小的独栋，乘 D 支线很方便。' },
        { name: 'Fisher Hill 和 Corey Hill', description: '这里是镇上较大的独栋住宅，位于山坡地块，建筑考究。更安静、更偏住宅，买家类型和广场一带完全不同。' },
        { name: 'Chestnut Hill', description: '与牛顿和波士顿共有。房子更大、空间更多，开车更方便，但没有处处能步行的便利。' },
        { name: 'South Brookline', description: '全镇最像郊区的部分：地块更大，更多开车，感觉更接近牛顿，而不是 Coolidge Corner。' },
      ],
    },
    {
      type: 'section',
      title: '布鲁克莱恩的房市是什么样的？',
      text: '以麻州的城镇来说，布鲁克莱恩的 condo 比例特别高，而且其中很大一部分是老建筑改建的，不是专门开发的。',
      highlight: '实际上这意味着：',
      bullets: [
        'condo 文件在这里比几乎任何地方都重要',
        '改建楼的小型业主协会储备金可能很薄',
        '停车位是真正的资产，常常单独有产权',
        '独栋房源有限，集中在山坡一带',
        '两户和三户住宅很常见，常常是业主自住',
      ],
      note: '在这个市场，查看业主协会的预算、储备金和特别摊派记录不是可选项，而是最主要的尽职调查。',
    },
    {
      type: 'section',
      title: '布鲁克莱恩值得买吗？',
      reasons: [
        { icon: '🚊', title: '支撑价值的交通', text: '两条绿线支线和巴士网络，让这里无论如何都吸引买家和租客。' },
        { icon: '🏥', title: '机构带来的需求', text: 'Longwood 的医院和学校每年都有新人，这支撑着转售和出租需求。' },
        { icon: '🎓', title: '自己的学区', text: '布鲁克莱恩有自己的学校，不与波士顿共用，这是很多人比较两者时的决定因素。' },
        { icon: '🚶', title: '真正可以步行', text: '杂货店、餐厅、电影院、药店和公共交通都在步行范围内，在离波士顿这么近的地方很少见。' },
      ],
    },
    {
      type: 'section',
      title: '在布鲁克莱恩买房之前要知道什么？',
      text: '布鲁克莱恩的竞争集中在靠近绿线、位置好的 condo，在这里有力的出价往往不只靠价格。',
      highlight: '这样做的买家通常更顺利：',
      bullets: [
        '在出价之前读 condo 文件，而不是之后',
        '弄清业主协会的费用实际包括什么',
        '书面确认停车位的情况',
        '知道自己买在广场的哪一边，这会改变日常生活',
        '拿到贷款预批，遇到合适的房子可以快速行动',
      ],
      note: '在这么密集的城镇，相隔一条街的两套房子可能是完全不同的交易。',
    },
  ],
};

export default guide;
