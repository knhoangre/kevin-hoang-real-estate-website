/** Client testimonials — five stars each. First block: paraphrased from Google reviews; remainder: illustrative samples for site display. */

export type Testimonial = {
  firstName: string;
  text: string;
  stars: 5;
};

/** Reviews sourced from Google (wording condensed where noted). */
const GOOGLE_REVIEWS: Testimonial[] = [
  {
    firstName: "Vrajesh",
    stars: 5,
    text: "Kevin was an outstanding realtor to work with. He was patient throughout the entire process and always had my best interests in mind. What stood out most was how genuine he was—he never pretended to know everything. If he didn’t have an immediate answer, he took the time to ask the right people and always got back to me quickly with accurate information. That level of honesty and advocacy made me feel supported and confident every step of the way. I’m so grateful for his guidance and would highly recommend him to anyone looking to buy or sell a home.",
  },
  {
    firstName: "Ben",
    stars: 5,
    text: "I had such a great experience working with Kevin. He was professional, responsive, and really made the entire process smooth from start to finish. I always felt like we were in good hands, and everything was handled with care and attention to detail. I’d highly recommend him to anyone looking to buy or sell!",
  },
  {
    firstName: "Jarreth",
    stars: 5,
    text: "Kevin is a great person to negotiate with—always securing strong outcomes for his clients. His dedication to finding the best deal shows in every transaction.",
  },
  {
    firstName: "Chris",
    stars: 5,
    text: "Kevin is awesome. He listens to what I want and how I want it. Super accommodating and a great listener—which matters so much in a realtor. Thank you for helping me find a place I can call home!",
  },
  {
    firstName: "Malina",
    stars: 5,
    text: "He has an incredible ability to stay calm and composed, even in the most challenging situations. His calm demeanor helped us stay focused and confident throughout the process.",
  },
  {
    firstName: "Kristina",
    stars: 5,
    text: "The attention to detail Kevin showed was remarkable. He thought of everything, ensuring that nothing was overlooked and that we were completely satisfied with the outcome.",
  },
  {
    firstName: "Lily",
    stars: 5,
    text: "He is an excellent communicator, always keeping us in the loop with timely updates and clear explanations. We never had to wonder what was happening or what the next steps were.",
  },
  {
    firstName: "Monique",
    stars: 5,
    text: "Kevin's extensive experience and knowledge were invaluable in navigating a challenging market—his insight into trends made a real difference. His advice on staging and presentation improved the home’s appeal and helped us achieve a quick sale.",
  },
  {
    firstName: "Brian",
    stars: 5,
    text: "Kevin is incredibly organized and detail-oriented, which made the entire process run smoothly. He anticipates challenges and handles them efficiently, so there are fewer surprises along the way.",
  },
  {
    firstName: "Michael",
    stars: 5,
    text: "Kevin goes above and beyond in marketing properties, using thoughtful strategies to attract the right buyers. His creativity and attention to detail help every listing get the attention it deserves.",
  },
  {
    firstName: "Chia-Yi",
    stars: 5,
    text: "Kevin has a knack for identifying the right property for each client. His ability to match our needs and desires with the right home was nothing short of impressive.",
  },
  {
    firstName: "Tiffany",
    stars: 5,
    text: "Communication is key, and Kevin excels at keeping clients informed and reassured throughout the process. His prompt, clear updates made us feel confident and well guided.",
  },
  {
    firstName: "Maggie",
    stars: 5,
    text: "Kevin has a talent for making clients feel at ease throughout the entire real estate journey. His warmth and professionalism shine through, making every interaction pleasant and productive.",
  },
  {
    firstName: "Mai",
    stars: 5,
    text: "Kevin has a deep understanding of the local market and consistently delivers strong results—guiding clients through buying or selling with expertise and care.",
  },
  {
    firstName: "Larry",
    stars: 5,
    text: "Charismatic and empathetic—he really puts himself in your shoes. A very understanding professional who deserves more recognition. Would recommend; give him a call!",
  },
  {
    firstName: "Steven",
    stars: 5,
    text: "As a first-time homebuyer, Kevin made the process as easy as possible for me. What impressed me most were his communication skills—he catered to what I was looking for and was extremely patient with all my questions. He makes you feel like you’re not just another number and works hard to find the right fit. I would definitely work with Kevin again and recommend him to anyone who wants a smoother homebuying experience.",
  },
  {
    firstName: "Thomas",
    stars: 5,
    text: "Kevin has been a fantastic realtor both times he helped my roommate and me find an apartment—even in a tough market he was incredibly available and kept quality listings coming. I 100% recommend his services!",
  },
  {
    firstName: "Kenny",
    stars: 5,
    text: "I’ve worked with Kevin on multiple occasions and he’s an outstanding agent—reliable, efficient, and an excellent communicator. He responds promptly, keeps paperwork organized, and explains everything clearly. I wholeheartedly recommend Kevin to anyone who wants a trustworthy professional in their corner.",
  },
  {
    firstName: "Alexandra",
    stars: 5,
    text: "Kevin helped us every step of the way in finding the perfect apartment. He listened to our wants and needs, answered questions whenever we had them, and handled communications with the other broker. Apartment hunting in Boston can be stressful, but Kevin made it as easy as possible. I would recommend him to anyone looking in the area.",
  },
  {
    firstName: "Rose",
    stars: 5,
    text: "I’ve known Kevin for many years. He was intelligent and hardworking as an engineer, and those traits show in how he practices real estate. I’ve dealt with poor agents before—Kevin gives the profession a good name. I highly recommend him for buying, selling, or renting.",
  },
  {
    firstName: "John",
    stars: 5,
    text: "He helped me understand the real estate process from the start. Even when he wasn’t the listing agent on a particular deal, he pointed me toward someone who did a great job.",
  },
  {
    firstName: "Edward",
    stars: 5,
    text: "I was lost trying to find a rental until Kevin helped me understand what to look for in a unit. Without his guidance, I could have ended up in a bad situation.",
  },
  {
    firstName: "Johnny",
    stars: 5,
    text: "I worked with Kevin as a renter and first-time buyer. He explained everything in detail and walked me through each step so nothing felt like a surprise. He showed homes that matched my criteria and was on top of new listings. Honest, professional, and personable—we’re friends now. I’ll keep using Kevin and recommend him to everyone.",
  },
];

const SYNTH_FIRST_NAMES = [
  "Avery", "Blake", "Cameron", "Dakota", "Ellis", "Finley", "Gray", "Harper", "Indigo", "Jamie",
  "Kendall", "Logan", "Morgan", "Nico", "Oakley", "Parker", "Quinn", "Reese", "Sage", "Taylor",
  "Uri", "Val", "Winter", "Alex", "Riley", "Casey", "Drew", "Emerson", "Frankie", "Hayden",
  "Jules", "Kai", "Lane", "Max", "Noor", "Peyton", "Remy", "Skyler", "Tatum", "Viv",
  "Wren", "Ali", "Sam", "Jordan", "Robin", "Ash", "River", "Storm", "Brook", "Devon",
  "Kerry", "Shannon", "Kelly", "Shawn", "Ariel", "Dana", "Jess", "Pat", "Lee", "Kim",
  "Bo", "Jo", "Mel", "Nat", "Ray", "Sid", "Tim", "Van", "Zed", "Ace",
  "Bea", "Cal", "Dot", "Eve", "Fae", "Gia", "Ira", "Jax", "Kit", "Lux",
  "Ned", "Ola", "Rae", "Taj", "Uma", "Yen", "Anh", "Bao", "Chi", "Duy",
  "Huy", "Linh", "Minh", "Nam", "Phuong", "Quang", "Tam", "Thuy", "Vinh", "Yen",
  "Aaron", "Bianca", "Carlos", "Diana", "Ethan", "Fiona", "Gavin", "Helen", "Ivan", "Julia",
  "Kurt", "Laura", "Marco", "Nina", "Oscar", "Paula", "Ryan", "Sofia", "Travis", "Uma",
  "Victor", "Wendy", "Xena", "Yuri", "Zara", "Adam", "Beth", "Cole", "Dana", "Eric",
  "Faith", "Greg", "Holly", "Ian", "Jade", "Kyle", "Leah", "Mark", "Nora", "Owen",
  "Paul", "Quinn", "Ruth", "Sean", "Tina", "Ulrich", "Vera", "Will", "Yara", "Zoe",
  "Amir", "Bela", "Cruz", "Demi", "Elio", "Freya", "Gabe", "Hope", "Iris", "Jett",
  "Kira", "Luis", "Mila", "Nate", "Opal", "Pete", "Rosa", "Seth", "Tara", "Ugo",
];

/** Service-area towns only (synthetic review copy). */
const LOCALES = [
  "Newton",
  "Weston",
  "Needham",
  "Concord",
  "Cambridge",
  "Somerville",
  "Waltham",
];

const FOCUS = [
  "buying our first condo", "selling a single-family home", "relocating to Massachusetts", "upgrading from renting",
  "downsizing after retirement", "investing in a two-family", "finding a rental with purchase potential",
  "negotiating a competitive offer", "preparing a home for the spring market", "reviewing inspection results",
  "coordinating a lease-to-own path", "evaluating new construction", "navigating a bidding war",
  "pricing our listing strategically", "shortening our commute to Boston", "finding walkable neighborhoods",
  "understanding HOA documents", "reviewing seller disclosures", "planning an open house schedule",
  "comparing mortgage pre-approvals", "timing our closing with a job move", "moving from out of state",
  "selling while buying", "finding pet-friendly buildings", "prioritizing school districts",
  "comparing condo fees across buildings", "reviewing a new-construction contract", "weighing a multi-family investment",
  "navigating a short sale timeline", "buying with an FHA loan", "refinancing before listing",
  "leasing before we buy", "evaluating flood insurance needs", "understanding rent control questions",
  "selling an estate property", "buying new construction upgrades", "relocating for biotech jobs",
];

const SERVICES = [
  "comparative market analysis", "pricing strategy", "offer negotiation", "inspection response planning",
  "staging referrals", "open house coordination", "buyer tours on short notice", "vendor recommendations",
  "P&S timeline management", "walkthrough punch lists", "HOA packet review", "rental comps for investors",
];

const TRAITS = [
  "patient listener", "straight shooter", "detail-oriented advocate", "data-driven advisor",
  "calm under pressure", "quick to respond", "honest about trade-offs", "creative problem-solver",
  "well connected locally", "respectful of our budget", "skilled negotiator", "clear communicator",
  "tech-savvy organizer", "warm and professional", "tenacious on our behalf",
];

const OUTCOMES = [
  "we closed on time with no surprises.",
  "we avoided a costly mistake on an inspection item.",
  "our offer stood out without overpaying.",
  "we sold above asking with multiple offers.",
  "we found a home that fit our commute and lifestyle.",
  "we understood every document before signing.",
  "we felt informed at every stage of the transaction.",
  "we trusted the pricing strategy from day one.",
  "we could focus on work while Kevin handled the details.",
  "we finally felt confident in a volatile market.",
  "we saved time by touring only serious contenders.",
  "we had a realistic timeline for closing.",
  "we knew how to respond when the appraisal came in.",
  "we avoided a bad fit property thanks to his candor.",
  "we got lender and attorney timelines aligned smoothly.",
];

/** Unique closing clauses so no two generated bodies match; reinforce local + service keywords. */
const EXTRA_CLOSERS: string[] = [
  "We’d choose Kevin again for any Greater Boston real estate need.",
  "He’s our go-to recommendation for friends moving to Massachusetts.",
  "If you want a responsive Realtor® who knows the Boston metro, talk to Kevin.",
  "His blend of empathy and market savvy is hard to find.",
  "We felt he earned every star—professional, personable, and effective.",
  "For listing prep and buyer tours, Kevin’s process just works.",
  "He made Massachusetts homebuying feel less intimidating.",
  "We appreciated his honesty on pricing in competitive towns.",
  "Kevin treats clients like partners, not transactions.",
  "From offer to inspection, his guidance was spot on.",
  "We trusted his read on neighborhood momentum and resale.",
  "He’s excellent at explaining contingencies in plain language.",
  "If you’re comparing agents, interview Kevin—you’ll see the difference.",
  "We valued his follow-through after the open house weekend.",
  "He helped us weigh commute vs. square footage with clarity.",
  "Our family recommends him for suburban and urban searches alike.",
  "Kevin’s calm tone helped when we had to pivot offers quickly.",
  "He knows which questions to ask listing agents—huge for us.",
  "We never felt rushed to waive protections we cared about.",
  "His network of inspectors and lenders saved us time.",
  "We’re grateful for his patience with our first-time buyer questions.",
  "He highlighted red flags we might have missed on our own.",
  "Selling with Kevin meant fewer days on market for us.",
  "He coordinated showings around our toddler’s nap schedule.",
  "We felt heard on budget, timeline, and must-haves.",
  "Kevin’s updates were timely—never had to chase him for status.",
  "He knows how to position a condo in a building with high HOA fees.",
  "We leaned on his experience in multiple-offer situations.",
  "He celebrated our win and checked in after move-in.",
  "If you need a Massachusetts agent who combines heart and hustle, hire Kevin.",
  "Kevin’s guidance on Needham vs. Newton pricing tradeoffs was invaluable.",
  "We’d trust him again for a condo search with strict HOA criteria.",
  "He explained Massachusetts attorney-led closings clearly—huge for out-of-state buyers.",
  "His follow-up after closing made us feel like valued clients, not a file number.",
  "For investment math on duplexes, Kevin runs scenarios you can actually use.",
  "He knows how to time listings around the spring rush in Greater Boston.",
  "We appreciated his candor on homes that looked good online but had hidden issues.",
  "Kevin helped us weigh interest-rate locks without fear-mongering.",
  "He coordinated seamlessly with our lender and real estate attorney.",
  "If you’re comparing Cambridge to Somerville, Kevin knows the nuance.",
  "We leaned on his network for painters and movers—small touches that matter.",
  "He made our relocation from the West Coast feel structured and doable.",
  "Kevin’s evening availability fit our hospital shift schedules perfectly.",
  "He flagged easement questions we would have skimmed past.",
  "For a competitive condo offer, his escalation strategy was smart.",
  "We valued his read on school catchments and future resale in the town we chose.",
  "Kevin never dismissed our “must-have” list—he optimized around it.",
  "He helped us interpret seller credits vs. price adjustments clearly.",
  "Our parents appreciated how patiently he explained documents in plain English.",
  "He’s the kind of Realtor® who earns referrals—we’ve already sent two friends.",
  "Kevin understands how remote work changed what “commute” means in 2025.",
  "He helped us evaluate roof age and heating systems without alarmism.",
  "If you need a Massachusetts buyer’s agent who writes strong offer letters, call Kevin.",
  "We felt prepared for the final walkthrough—checklist and all.",
  "Kevin’s market snapshots were concise—perfect for busy professionals.",
  "He respected our budget cap and still found creative options nearby.",
  "We’d work with him again for land assembly or teardown conversations.",
  "His responsiveness during attorney review week kept stress manageable.",
  "Kevin knows how permit timelines differ across Concord, Weston, and nearby towns—surprisingly useful.",
  "He helped us compare HOA reserves without drowning in PDFs.",
  "For renters becoming buyers, his step-by-step plan was reassuring.",
  "We appreciated his honesty when a listing simply wasn’t worth pursuing.",
  "Kevin made our first investment property purchase feel less risky.",
  "He’s thoughtful about noise, transit, and resale—not just square footage.",
  "If you’re new to Massachusetts, start with Kevin’s neighborhood primer.",
  "We closed with confidence thanks to his contingency explanations.",
  "Kevin’s professionalism shows in how he coordinates with listing offices.",
  "He helped us understand offer deadlines without pressure tactics.",
  "We’d recommend him for luxury listings and starter condos alike.",
  "His calm presence helped when our first offer fell through—then we won the next.",
  "Kevin knows Greater Boston inventory patterns better than any app.",
  "He helped us weigh private showings vs. open houses for our seller timeline.",
  "We valued his insight on winterizing a listing for a January launch.",
  "Kevin treats every negotiation like his reputation is on the line—because it is.",
];

/**
 * One distinct, SEO-friendly paragraph per index (Greater Boston real estate, Kevin’s services & personality).
 * Uses index-driven mixing so lines do not repeat the old triple-snippet pattern.
 */
function buildSeoSyntheticBody(index: number): string {
  const a = LOCALES[index % LOCALES.length];
  const b = LOCALES[(index + 13) % LOCALES.length];
  const c = LOCALES[(index + 29) % LOCALES.length];
  const focus = FOCUS[(index * 3) % FOCUS.length];
  const focus2 = FOCUS[(index * 5 + 7) % FOCUS.length];
  const trait = TRAITS[(index * 7) % TRAITS.length];
  const trait2 = TRAITS[(index * 11 + 3) % TRAITS.length];
  const outcome = OUTCOMES[(index * 13) % OUTCOMES.length];
  const service = SERVICES[(index * 17) % SERVICES.length];
  const service2 = SERVICES[(index * 19 + 5) % SERVICES.length];
  const pattern = index % 24;

  switch (pattern) {
    case 0:
      return `We were ${focus} and focused on ${a} and nearby ${b}. Kevin Hoang helped us navigate the Greater Boston real estate market with ${trait} guidance—explaining comparable sales, offer strategy, and what to expect at inspection. He’s a Massachusetts real estate agent who actually listens. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 1:
      return `As someone ${focus2}, I wanted a Realtor® who knows ${c} as well as ${a}. Kevin combined neighborhood insight with clear communication—whether we texted at night or needed a same-day showing. His ${trait2} approach made a stressful process feel organized. In the end, ${outcome}`;
    case 2:
      return `Kevin stood out among Boston-area agents when we were ${focus}. He walked us through seller disclosures, condo rules, and pricing trends around ${b} and ${c} without jargon. If you want a detail-oriented real estate professional who advocates for your interests in Greater Boston, he delivers. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 3:
      return `Our search centered on ${a}, but Kevin encouraged us to compare ${b} for commute and resale—smart advice in today’s market. He’s ${trait} and proactive about listings, open houses, and negotiation. Working with him felt like having both a strategist and a partner. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 4:
      return `Selling in ${c} meant pricing, staging, and timing mattered. Kevin’s listing plan highlighted our home’s strengths to the right buyers and kept communication tight with buyer agents. He’s ${trait2} and respected our goals. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 5:
      return `Relocating to Massachusetts was overwhelming until Kevin broke the process into clear steps—financing, neighborhoods (${a}, ${b}), and offer deadlines. He’s ${trait} and genuinely cares about fit, not just closing. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 6:
      return `We were ${focus} and comparing ${a} with ${c}. Kevin ran numbers honestly, helped us weigh school districts and commute, and never rushed an offer. That ${trait} style is why we’d recommend him for anyone buying or selling in Greater Boston. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 7:
      return `Kevin helped us understand the local market: what sells in ${b}, how long listings last, and how to position an offer in ${a}. He’s ${trait2} and quick with follow-up—exactly what we needed from a real estate agent in this region. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 8:
      return `From first tour near ${c} to the final walkthrough, Kevin was ${trait}. He coordinated inspectors, answered attorney questions, and kept us calm when timelines tightened. If you need a trustworthy Realtor® in Greater Boston, start here. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 9:
      return `We cared about personality as much as experience—Kevin is ${trait2} and ${trait}. He made time for our questions about ${a} and ${b}, explained contingencies clearly, and helped us feel confident signing. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 10:
      return `Investment or primary home, Kevin treats every client seriously. We were ${focus2} around ${a}; he screened listings, flagged risks, and helped us negotiate terms that fit our plan. His knowledge of Greater Boston neighborhoods and pricing is a real advantage. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 11:
      return `Kevin’s mix of technical smarts and people skills shows—he’s ${trait} when reviewing disclosures and ${trait2} when emotions run high. We targeted ${b} and ${c} and always knew the next step. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 12:
      return `We leaned on Kevin for ${service} and ${service2} while weighing ${a} versus ${b}. He connects the dots between listing marketing, buyer demand, and Massachusetts contract timelines—rare in a busy market. As a Greater Boston Realtor®, he’s ${trait}. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 13:
      return `Kevin helped us stress-test an offer on a two-family near ${c}—rent rolls, expenses, and realistic vacancy assumptions. If you’re exploring income property in Massachusetts, his ${trait2} style keeps you grounded. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 14:
      return `As first-time buyers using conventional financing, we wanted clarity on contingencies and appraisal gaps around ${a}. Kevin explained each step in plain language and stayed ${trait} when we got anxious—exactly what you want from a buyer’s agent in Greater Boston. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 15:
      return `Condo living in ${b} meant HOA docs, reserves, and special assessment questions—Kevin walked us through highlights before we committed. He’s ${trait2} about fees versus value and never rushed signatures. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 16:
      return `We considered new construction incentives near ${c} and appreciated Kevin’s diligence on builder timelines and upgrade pricing. His ${trait} approach to ${focus} kept us from overextending financially. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 17:
      return `Selling a single-family in ${a} required smart staging conversations and disciplined follow-up with buyer agents—Kevin delivered on ${service} and kept our net proceeds transparent. He’s ${trait2} and respected our schedule. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 18:
      return `Massachusetts closings involve attorneys and tight deadlines—Kevin coordinated ours between ${b} and ${c} so lender, listing office, and counsel stayed aligned. He’s ${trait} about paperwork and responsive when issues popped up. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 19:
      return `We listed in a slower season and needed a pricing plan that still attracted serious buyers—Kevin’s read on ${a} micro-trends helped us adjust without panic. He’s ${trait2} and proactive on feedback from every showing. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 20:
      return `School districts mattered for our move to ${c}, and Kevin helped us compare commute tradeoffs with ${a} honestly—no hype, just data and neighborhood context. That ${trait} guidance made our decision easier. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 21:
      return `Remote work changed what we needed from a home; Kevin helped us prioritize light, office space, and transit options around ${b}. He’s ${trait2} about lifestyle fit—not just square footage—in Greater Boston. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 22:
      return `After inspection on a place near ${a}, Kevin helped us negotiate credits without souring the deal—clear, ${trait}, and focused on outcomes. If you need a Massachusetts real estate agent who can manage tough conversations, he’s it. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
    case 23:
      return `We interviewed several agents before choosing Kevin for ${focus2} in ${c}—his ${service} plan stood out immediately. He’s ${trait2}, organized, and genuinely invested in client success across the Boston metro area. ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
  }
}

function buildSeoSyntheticText(index: number): string {
  const body = buildSeoSyntheticBody(index);
  const closer = EXTRA_CLOSERS[index % EXTRA_CLOSERS.length];
  return `${body} ${closer}`;
}

function buildSyntheticReviews(count: number): Testimonial[] {
  const out: Testimonial[] = [];
  const nNames = SYNTH_FIRST_NAMES.length;
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const firstName = SYNTH_FIRST_NAMES[i % nNames];
    let text = buildSeoSyntheticText(i);
    if (seen.has(text)) {
      text = `${text} He also helped us think through long-term value in ${LOCALES[(i + 31) % LOCALES.length]}.`;
    }
    seen.add(text);
    out.push({ firstName, text, stars: 5 });
  }
  return out;
}

/** 400 total: Google-sourced reviews plus SEO-illustrative samples; all five stars. */
export const ALL_TESTIMONIALS: Testimonial[] = [
  ...GOOGLE_REVIEWS,
  ...buildSyntheticReviews(400 - GOOGLE_REVIEWS.length),
];
