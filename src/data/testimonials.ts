/**
 * Client testimonials — real Google reviews only.
 *
 * This file used to export 400 entries: these genuine reviews plus 377
 * generated ones, produced by recombining name/town/service/trait word lists
 * ("synthetic review copy", per the original comment) and published as named
 * five-star client testimonials.
 *
 * They were removed on 2026-08-26. Three reasons, any one sufficient:
 *   - Publishing invented consumer reviews is what the FTC's Rule on Consumer
 *     Reviews and Testimonials (16 CFR Part 465) penalises, per review.
 *   - They produced no SEO benefit even in principle. Review/AggregateRating
 *     markup is deliberately not emitted (see src/lib/schema.ts), and Google
 *     disregards self-serving review markup on a business's own site anyway.
 *   - 377 near-duplicate keyword-tuned paragraphs on one page is a
 *     scaled-content signal working against the rest of the site.
 *
 * ONLY add entries here that a real client actually wrote. If the corpus needs
 * to look larger, the answer is to ask clients for Google reviews and link the
 * Business Profile — not to generate more rows.
 */

export type Testimonial = {
  firstName: string;
  text: string;
  stars: 5;
};

/** Verbatim or lightly condensed from the Google Business Profile reviews. */
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

/** The published testimonials. Real reviews only. */
export const ALL_TESTIMONIALS: Testimonial[] = GOOGLE_REVIEWS;
