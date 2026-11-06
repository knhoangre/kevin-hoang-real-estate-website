import Roadmap from '@/components/Roadmap';

/**
 * The seller roadmap in Chinese, on the same Roadmap component. See
 * ZhBuyerRoadmap for why it is literal copy and written from the Massachusetts
 * version. `accent="purple"` matches the other two seller guides.
 */
const ZhSellerRoadmap = () => {
  const steps = [
    {
      title: '准备和规划',
      description: '第一个决定不是价格，而是您最看重什么：最高的价格、最快的成交，还是最方便的搬出时间。',
      details: [
        '查看本地区过去 3–6 个月同类房屋的实际成交价。',
        '算出卖房成本：佣金、律师费、麻州地契税、修缮和搬家费用。',
        '确定时机。在麻州，市场通常在 3 月到 6 月最活跃。',
      ],
    },
    {
      title: '选择经纪人和律师',
      description: '和买方一样，麻州的卖家也需要律师，由律师准备地契并处理产权事宜。',
      details: [
        '选择卖方经纪：问清具体的营销计划，不要只看佣金。',
        '商定定价策略：略低于市场价来吸引竞争，是这一带常见的做法。',
        '一开始就聘请房地产律师，不要等到收到出价。',
      ],
    },
    {
      title: '准备房屋',
      description: '买家第一次看到您的房子，通常是在手机上看照片。照片拍得好不好，决定了有没有人来看房。',
      details: [
        '清理杂物、彻底打扫：空的房间看起来更大。',
        '修好明显的小问题：漏水的水龙头、坏的开关、剥落的墙漆。',
        '打理外观：修剪草坪、油漆大门、更换灯具。',
        '可以考虑挂牌前先验房（pre-listing inspection），避免买家验房时才发现意外。',
      ],
    },
    {
      title: '挂牌和营销',
      description: 'MLS PIN 是一切的起点，Zillow 和其他网站的数据都来自这里。',
      details: [
        '在 MLS 上发布专业照片和完整描述。',
        '举办 Open House（开放日）：第一个周末往往决定大部分结果。',
        '保持房屋整洁，看房时间尽量灵活。',
      ],
    },
    {
      title: '接收和协商出价',
      description: '最高价不一定是最好的出价。附带的条件才决定交易能否走到最后。',
      details: [
        '仔细看各项条件：贷款、银行估价、验房和过户日期。',
        '注意：自 2025 年 10 月 15 日起，麻州法规禁止卖家和卖方经纪要求买方放弃验房，也不得接受带有这种条件的出价。',
        '需要时提出还价：调整价格、期限或过户费用补贴。',
        '接受出价并签字。在麻州，购房要约（Offer to Purchase）已经是有约束力的合同。',
      ],
    },
    {
      title: '验房阶段',
      description: '从出价被接受起，买方通常有 7–10 天的验房时间。',
      details: [
        '买方请验房师检查，这段时间您最好离开房子。',
        '根据验房结果协商修缮或减价。',
        '买方的贷款机构安排银行估价。如果低于合同价，双方需要重新协商。',
        '签署买卖合同（Purchase and Sale Agreement，简称 P&S）：更详细的合同，通常在要约后大约两周。',
      ],
    },
    {
      title: '准备过户',
      description: '这个阶段的工作主要是文件和协调日期。',
      details: [
        '完成已同意的修缮，保留收据。',
        '按约定的过户日和交房日安排搬出。',
        '在过户日抄电表、燃气表和水表。',
        '您的律师准备地契，处理产权事宜。',
      ],
    },
    {
      title: '过户日',
      description: '交易在地契于契约登记处（Registry of Deeds）登记后才算完成，不是签完文件就算。',
      details: [
        '买方在过户前最后一次查看房屋。',
        '签署地契和相关文件。',
        '收到售房款：登记完成后通过电汇或银行支票支付。',
        '交出全部钥匙、车库遥控器和门锁密码。',
      ],
    },
    {
      title: '售出之后',
      description: '还有几件收尾的事，以及一项要提前了解的税务规定。',
      details: [
        '地契登记后取消房屋保险。',
        '向邮局、银行和各项服务更改地址。',
        '保存全部过户文件，用于报税。',
        '了解自住房出售的资本利得免税额：联邦规定单身 $250,000，夫妻联合报税 $500,000（IRS，2026 年）。您的具体情况请咨询报税师。',
      ],
    },
  ];

  return (
    <Roadmap title="您的售房路线图" steps={steps} accent="purple" stepLabel="步骤" ofLabel="/" />
  );
};

export default ZhSellerRoadmap;
