import Roadmap from '@/components/Roadmap';

/**
 * The buyer roadmap in Chinese, on the same Roadmap component as the English and
 * Vietnamese guides. Literal copy, never t(): i18n is pinned to 'en' during static
 * generation. `accent="blue"` matches the other two; see ViBuyerRoadmap.
 *
 * Written from the Massachusetts version on /vi/mua-nha rather than the English
 * strings, which still describe a generic national process ("paid from seller's
 * commission", "neighborhood safety"). No step may suggest waiving an inspection
 * to win: 760 CMR 74.00, in force since 2025-10-15.
 */
const ZhBuyerRoadmap = () => {
  const steps = [
    {
      title: '做好财务准备',
      description:
        '看房之前，先算清楚自己的财务状况。在这个市场，没有附上贷款预批信（pre-approval）的出价，卖家通常不会考虑。',
      details: [
        '查看信用分数：常规贷款一般要求 620 分以上，分数越高，利率越好。',
        '算出真实预算：每月贷款、房产税、保险，以及物业费（HOA，如有）。',
        '准备现金：首付（3–20%）、过户费用（2–5%）、验房费和搬家费。',
        '申请贷款预批（pre-approval）。它和预审（pre-qualification）不同，这里的卖家分得很清楚。',
      ],
    },
    {
      title: '找好专业团队',
      description: '麻州的房产交易实际上离不开律师，这是和很多州最大的不同。',
      details: [
        '选择买方经纪：代表您的利益，而不是卖家的利益。',
        '选择贷款机构或贷款经纪：比较利率、费用，以及 FHA、VA、MassHousing 等项目。',
        '选择房地产律师。在麻州这是实际上的必要环节，不是可有可无的选项。',
      ],
    },
    {
      title: '找房和看房',
      description: '这一带的房子大多建于 1940 年以前。房龄决定了您要检查的大部分内容。',
      details: [
        '在 MLS 上看房源，去参加 Open House（开放日），一般在周六和周日。',
        '按房产税、学区和通勤时间缩小范围，不要只看价格。',
        '关注同类房屋的实际成交价（comps），而不是挂牌价。',
      ],
    },
    {
      title: '提交购房要约',
      description:
        '在麻州，购房要约（Offer to Purchase）就是有约束力的合同。很多首次购房者在这一点上吃亏。',
      details: [
        '看可比成交来定价：出价高于市场，银行不会为差额放贷。',
        '确定条款：价格、定金、附加条件（验房、贷款、银行估价）和过户日期。',
        '您的律师应该在您签字之前看要约，而不是之后。',
        '双方来回议价，直到达成一致。',
      ],
    },
    {
      title: '验房',
      description:
        '自 2025 年 10 月 15 日起，麻州法规（760 CMR 74.00）禁止卖家和卖方经纪以放弃验房作为接受出价的条件。',
      details: [
        '支付定金：通常为购买价的 1–3%，由第三方保管。',
        '请验房师检查，需要时再做专项检查：氡气、白蚁、地下油罐、化粪池系统。',
        '一个合法的选择是在提交要约之前先验房。您要为可能买不到的房子付验房费，但能掌握完整的信息。',
        '根据验房结果协商修缮或减价。',
      ],
    },
    {
      title: '签买卖合同，完成贷款手续',
      description:
        '买卖合同（Purchase and Sale Agreement，简称 P&S）是第二份合同，比要约更详细。这时要约中的各项期限已经在计时。',
      details: [
        '向贷款机构提交文件：工资单、两年报税表、银行对账单。',
        '贷款机构安排银行估价（appraisal）。如果估价低于合同价，差额要您用现金补足。',
        '律师调查产权（title），并购买产权保险。',
        '购买房屋保险：贷款机构要求在过户前办好。',
      ],
    },
    {
      title: '过户日',
      description: '在麻州，交易在契约登记处（Registry of Deeds）完成登记，通常有双方律师参与。',
      details: [
        '过户前最后一次查看房屋（final walkthrough）。',
        '签署贷款文件和地契。',
        '通过银行电汇支付首付和过户费用，不接受个人支票。',
        '拿到钥匙。从地契登记那一刻起，房子就是您的了。',
      ],
    },
    {
      title: '入住之后',
      description: '第一个月做几件事，可以省下以后的钱和麻烦。',
      details: [
        '换锁，检查报警系统。',
        '把水、电、燃气和网络转到您名下。',
        '到市政厅申请自住房产税减免（residential exemption）：不是每个城镇都有，有的话金额不小。',
        '保存全部过户文件：报税和以后卖房时都要用。',
      ],
    },
  ];

  return (
    <Roadmap title="您的购房路线图" steps={steps} accent="blue" stepLabel="步骤" ofLabel="/" />
  );
};

export default ZhBuyerRoadmap;
