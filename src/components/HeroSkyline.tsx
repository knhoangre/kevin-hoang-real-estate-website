import type { CSSProperties } from "react";

/**
 * The homepage hero's drawing: Greater Boston at nightfall. Boston across the
 * Charles in the middle — the Pru, 200 Clarendon, Custom House, the Zakim —
 * and the kind of houses Kevin sells on either side: a triple-decker, a
 * Victorian, a meetinghouse, a Cape, Back Bay rowhouses, a colonial with its
 * sign out, a gambrel. It draws itself in champagne line, then the windows
 * come on, the lamps flicker up, the stars come out and the river picks up
 * the lights; after that the city keeps moving — traffic on the bridge, a
 * sail on the river — and a shooting star hands off to the CTA's glint.
 *
 * Pure SVG + CSS (the `.sk-*` classes in index.css), so it animates from the
 * prerendered HTML without waiting for React, and reduced motion gets the
 * finished, lit drawing. Decorative only — aria-hidden.
 *
 * Every stroke that draws carries pathLength={1}, which lets one dash length
 * in the CSS draw any path whatever its real length. The "random" windows,
 * stars and reflections come from a fixed seed, so the server and the client
 * produce the same markup and hydration matches.
 *
 * The viewBox is wide (2400) and the SVG is sliced from the bottom-centre, so
 * a phone sees the river and the skyline and a desktop gets the houses too.
 */

const NEAR = "#e3cfa3"; // the houses: champagne lifted for line work
const FAR = "#c5a572"; // the city: champagne itself, dimmed by its group
const LIT = "#f3e2b8";
const INK = "#0d0d0f"; // ink-deep, so a silhouette is the hero's own dark

const GROUND = 340;
const BANK = 300;

/** Delay (and optionally duration) for the `.sk-*` animations. */
const at = (d: number, t?: number) =>
  ({ "--d": `${d}s`, ...(t ? { "--t": `${t}s` } : {}) }) as CSSProperties;

/** mulberry32: a small seeded generator, the same sequence everywhere. */
const rand = (() => {
  let s = 0x4b48;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();
const r1 = (n: number) => Math.round(n * 10) / 10;

type Rect = [x: number, y: number, w: number, h: number];
const rects = (list: Rect[]) => list.map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h${-w}z`).join("");
/** A window's frame: its outline and a cross of muntins. */
const frames = (list: Rect[]) =>
  list
    .map(([x, y, w, h]) => `${rects([[x, y, w, h]])}M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}`)
    .join("");

/** A deciduous tree: a scalloped canopy over a trunk. */
const tree = (cx: number, cy: number, r: number) => {
  const n = 7;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = Math.PI * (0.75 + (2 * i) / n);
    return [r1(cx + r * Math.cos(a)), r1(cy + r * 0.92 * Math.sin(a))];
  });
  const lobe = r1(r * 0.5);
  const canopy = `M${pts[0][0]} ${pts[0][1]}${pts
    .slice(1)
    .concat([pts[0]])
    .map(([x, y]) => `A${lobe} ${lobe} 0 0 1 ${x} ${y}`)
    .join("")}Z`;
  return { canopy, trunk: `M${cx} ${GROUND}V${r1(cy + r * 0.6)}` };
};

/** A white pine: three tiers on a short trunk. */
const pine = (cx: number, h: number, w: number) => {
  const top = GROUND - h;
  const s = h / 3.4;
  // The right-hand edge, top to bottom, as [fraction of width, y].
  const edge: [number, number][] = [
    [0.32, top + s], [0.14, top + s],
    [0.42, top + 2 * s], [0.2, top + 2 * s],
    [0.5, top + 3 * s],
  ];
  const side = (sign: number, pts: [number, number][]) =>
    pts.map(([f, y]) => `L${r1(cx + sign * f * w)} ${r1(y)}`).join("");
  return {
    canopy: `M${cx} ${top}${side(1, edge)}${side(-1, [...edge].reverse())}Z`,
    trunk: `M${cx} ${GROUND}V${r1(top + 3 * s)}`,
  };
};

/** A Boston streetlamp: post, lantern and cap. Returns its glass and its light. */
const lamp = (x: number) => ({
  frame: `M${x} ${GROUND}V288M${x - 4} ${GROUND}h8M${x - 5} 288h10l2-12h-14zM${x - 8} 276h16l-8-8zM${x} 268v-4`,
  glass: `M${x - 4.4} 287l-1.6-10h12l-1.6 10z`,
  cx: x,
  cy: 281,
});

/* ---------------------------------------------------------------- the city */

type Tower = { d: string; at: number; box?: [x0: number, x1: number, top: number]; detail?: string };

/** Back Bay and downtown, centre outward so the drawing grows from the middle. */
const TOWERS: Tower[] = [
  { d: "M1170 300V52H1208V300Z", at: 0.3, box: [1172, 1206, 62], detail: "M1189 58V300" }, // 200 Clarendon
  { d: "M1066 300V86H1070V78H1108V86H1112V300Z", at: 0.42, box: [1069, 1109, 94], detail: "M1089 78V34" }, // the Pru and its mast
  { d: "M1232 300V92L1270 74V300Z", at: 0.5, box: [1234, 1268, 102] }, // Millennium Tower
  { d: "M1126 300V132Q1140 112 1154 132V300Z", at: 0.58, box: [1128, 1152, 142], detail: "M1140 118V100" }, // 111 Huntington
  { d: "M1010 300V104Q1029 86 1048 100V300Z", at: 0.66, box: [1012, 1046, 114] }, // One Dalton
  {
    d: "M1280 300V252H1290V150H1286L1303 120L1320 150H1316V252H1326V300Z",
    at: 0.74,
    box: [1292, 1314, 176],
    detail: "M1303 120V104M1298 162a5 5 0 1 0 10 0a5 5 0 1 0-10 0M1286 150H1320",
  }, // Custom House
  { d: "M1340 300V118H1380V300Z", at: 0.84, box: [1342, 1378, 128], detail: "M1352 118V110H1368V118" },
  { d: "M944 300V150H990V300Z", at: 0.92, box: [946, 988, 160], detail: "M967 150V128" },
  { d: "M1394 300V170H1424V300Z", at: 1.0, box: [1396, 1422, 178] },
  { d: "M896 300V196L904 182L912 196V300Z", at: 1.06 }, // the Bunker Hill obelisk
];

/** Lower buildings in front of the towers' feet, for depth. */
const BLOCKS: { d: string; box: [number, number, number] }[] = [
  { d: "M868 300V262H936V300Z", box: [870, 934, 268] },
  { d: "M924 300V236H946V224H978V236H1000V300Z", box: [926, 998, 242] },
  { d: "M990 300V254H1060V300Z", box: [992, 1058, 260] },
  { d: "M1050 300V228H1124V300Z", box: [1052, 1122, 234] },
  { d: "M1114 300V246H1172V300Z", box: [1116, 1170, 252] },
  { d: "M1160 300V262H1176V254H1210V262H1226V300Z", box: [1162, 1224, 268] },
  { d: "M1214 300V240H1282V300Z", box: [1216, 1280, 246] },
  { d: "M1270 300V266H1336V300Z", box: [1272, 1334, 272] },
  { d: "M1326 300V234H1392V300Z", box: [1328, 1390, 240] },
  { d: "M1384 300V256H1446V300Z", box: [1386, 1444, 262] },
];

/**
 * Lit windows, as short thick dashes. Each one is dealt to a wave, so the
 * city comes on in scattered handfuls rather than tower by tower; a few go to
 * the twinkle sets that switch off and on for as long as the page is open.
 */
const litWindows = (boxes: [number, number, number][], density: number, waves: number) => {
  const groups: string[] = Array(waves).fill("");
  const twinkle: string[] = ["", "", ""];
  for (const [x0, x1, top] of boxes) {
    for (let y = top; y < BANK - 4; y += 7) {
      for (let x = x0 + 2; x + 2.2 <= x1 - 1; x += 5) {
        const roll = rand();
        if (roll > density) continue;
        const seg = `M${r1(x)} ${y}h2.2`;
        if (roll < density * 0.08) twinkle[Math.floor(rand() * 3)] += seg;
        else groups[Math.floor(rand() * waves)] += seg;
      }
    }
  }
  return { groups, twinkle };
};

const TOWER_LIGHTS = litWindows(
  TOWERS.flatMap((t) => (t.box ? [t.box] : [])),
  0.3,
  8,
);
const BLOCK_LIGHTS = litWindows(
  BLOCKS.map((b) => b.box),
  0.22,
  4,
);

/** The lights again, broken up on the water and set to shimmer. */
const REFLECTIONS = (() => {
  const sets = ["", "", ""];
  for (const t of TOWERS) {
    if (!t.box) continue;
    const [x0, x1] = t.box;
    const cx = (x0 + x1) / 2;
    const w = x1 - x0;
    for (let i = 0; i < 5; i++) {
      const len = r1(w * (0.65 - i * 0.09) * (0.7 + rand() * 0.5));
      const x = r1(cx - len / 2 + (rand() - 0.5) * 6);
      sets[i % 3] += `M${x} ${r1(306 + i * 6.4)}h${len}`;
    }
  }
  for (const x of [960, 1440]) sets[1] += `M${x - 6} 316h12M${x - 4} 326h8`;
  return sets;
})();

/** Bridge: the Zakim's two towers, its deck, and four fans of cable. */
const ZAKIM_TOWERS = [1530, 1640];
const CABLES = ZAKIM_TOWERS.flatMap((tx, ti) =>
  [-1, 1].flatMap((side) => {
    const main = (ti === 0 && side === 1) || (ti === 1 && side === -1);
    return Array.from({ length: 7 }, (_, k) => ({
      d: `M${tx} ${198 + k * 7}L${tx + side * (main ? 52 - k * 5 : 86 - k * 10)} 290`,
      at: 1.3 + ti * 0.2 + k * 0.06,
    }));
  }),
);

/** The sky: stars kept clear of the towers and the moon. */
const STARS = (() => {
  const sets = ["", "", ""];
  let placed = 0;
  while (placed < 54) {
    const x = r1(rand() * 2400);
    const y = r1(8 + rand() * 150);
    const blocked =
      TOWERS.some((t) => t.box && x > t.box[0] - 8 && x < t.box[1] + 8 && y > t.box[2] - 30) ||
      Math.hypot(x - 1612, y - 62) < 34 ||
      (x > 1500 && x < 1680 && y > 170);
    if (blocked) continue;
    sets[placed % 3] += `M${x} ${y}h0.01`;
    placed++;
  }
  return sets;
})();

/* -------------------------------------------------------------- the houses */

type House = {
  /** Filled silhouettes, back to front. */
  body: string[];
  /** Line work drawn over the silhouette. */
  detail: string;
  windows: Rect[];
  /** Lit shapes that are not plain rectangles (arched, round, a doorway). */
  litExtra?: string;
  at: number;
  light: number;
};

const HOUSES: House[] = [
  {
    // A triple-decker, porches stacked on the left.
    body: ["M770 340V206H766V198H860V206H856V340Z"],
    detail:
      "M770 206H856M770 250H856M770 294H856M800 340V206M770 280H800M770 236H800" +
      "M776 280v14M782 280v14M788 280v14M794 280v14M776 236v14M782 236v14M788 236v14M794 236v14M778 340V306H792V340",
    windows: [
      [812, 214, 14, 24], [834, 214, 14, 24],
      [812, 258, 14, 24], [834, 258, 14, 24],
      [812, 304, 14, 24], [834, 304, 14, 24],
    ],
    at: 0.8,
    light: 3.0,
  },
  {
    // Back Bay rowhouses with mansard roofs and a stoop.
    body: [
      "M1716 340V214H1712L1720 192H1774L1782 214H1778V340Z",
      "M1778 340V206H1774L1782 186H1836L1844 206H1840V340Z",
    ],
    detail:
      "M1716 214H1778M1778 206H1840M1758 334V302H1772V334M1752 340V334H1778V340" +
      "M1820 334V300H1834V334M1814 340V334H1840V340",
    windows: [
      [1730, 198, 10, 10], [1758, 198, 10, 10], [1792, 192, 10, 10], [1820, 192, 10, 10],
      [1724, 222, 12, 22], [1741, 222, 12, 22], [1758, 222, 12, 22],
      [1724, 256, 12, 22], [1741, 256, 12, 22], [1758, 256, 12, 22],
      [1724, 296, 12, 24], [1741, 296, 12, 24],
      [1786, 216, 12, 24], [1803, 216, 12, 24], [1820, 216, 12, 24],
      [1786, 252, 12, 24], [1803, 252, 12, 24], [1820, 252, 12, 24],
      [1786, 294, 12, 26], [1803, 294, 12, 26],
    ],
    at: 0.9,
    light: 3.15,
  },
  {
    // A Queen Anne Victorian with its corner turret and porch.
    body: ["M582 340V262L604 234H650L664 206L692 262V340Z", "M546 340V250H540L563 180L586 250H580V340Z"],
    detail:
      "M636 262H692M600 300H692M610 300V340M650 300V340M688 300V340M600 324H692" +
      "M563 180V168M546 250H580M634 340V308H646V340",
    windows: [
      [598, 268, 12, 22], [618, 268, 12, 22], [656, 268, 16, 24],
      [618, 308, 12, 22], [664, 308, 14, 22],
      [556, 258, 14, 22], [556, 300, 14, 24],
    ],
    litExtra: "M658 238a6 6 0 1 0 12 0a6 6 0 1 0-12 0z",
    at: 1.3,
    light: 3.35,
  },
  {
    // The colonial, centre entrance, with its door lit for whoever is home.
    body: ["M2010 222V192H2026V222Z", "M1896 340V258H1888L1910 214H2030L2052 258H2044V340Z"],
    detail: "M1896 258H2044M1952 302L1971 288L1990 302ZM1956 302V340M1986 302V340M1963 340V306H1979V340",
    windows: [
      [1908, 266, 16, 24], [1936, 266, 16, 24], [1963, 266, 16, 24], [1990, 266, 16, 24], [2018, 266, 16, 24],
      [1908, 304, 16, 26], [1936, 304, 16, 26], [1990, 304, 16, 26], [2018, 304, 16, 26],
    ],
    litExtra: "M1963 340V306H1979V340Z",
    at: 1.35,
    light: 3.5,
  },
  {
    // A New England meetinghouse and its steeple.
    body: [
      "M380 340V272L436 236L492 272V340Z",
      "M418 340V214H421V184H419L436 96L453 184H451V214H454V340Z",
    ],
    detail:
      "M418 214H454M419 184H453M428 210V194Q436 186 444 194V210M436 96V84" +
      "M429 230a7 7 0 1 0 14 0a7 7 0 1 0-14 0M428 340V314Q436 306 444 314V340" +
      "M392 330V298Q398 290 404 298V330ZM468 330V298Q474 290 480 298V330Z",
    windows: [],
    litExtra: "M392 330V298Q398 290 404 298V330ZM468 330V298Q474 290 480 298V330Z",
    at: 1.6,
    light: 3.65,
  },
  {
    // A gambrel.
    body: ["M2196 340V286L2204 252L2250 228L2296 252L2304 286V340Z"],
    detail: "M2196 286H2304M2243 340V306H2257V340",
    windows: [[2210, 300, 14, 22], [2276, 300, 14, 22], [2222, 260, 14, 20], [2264, 260, 14, 20], [2245, 238, 10, 10]],
    at: 1.9,
    light: 3.8,
  },
  {
    // A Cape: dormers, a centre chimney.
    body: [
      "M216 258V236H230V258Z",
      "M160 340V298H154L176 252H270L292 298H286V340Z",
      "M190 288V268L202 256L214 268V288ZM232 288V268L244 256L256 268V288Z",
    ],
    detail: "M160 298H286M216 340V310H230V340",
    windows: [[172, 310, 14, 18], [192, 310, 14, 18], [240, 310, 14, 18], [260, 310, 14, 18], [196, 270, 12, 12], [238, 270, 12, 12]],
    at: 2.0,
    light: 3.95,
  },
];

/** Trees, as [canopy, trunk] with when they draw. */
const TREES = [
  { ...tree(730, 266, 24), at: 1.1 },
  { ...pine(322, 74, 32), at: 1.8 },
  { ...pine(350, 54, 24), at: 1.85 },
  { ...tree(92, 274, 26), at: 2.2 },
  { ...pine(130, 70, 28), at: 2.25 },
  { ...pine(26, 64, 28), at: 2.3 },
  { ...tree(2142, 268, 24), at: 1.95 },
  { ...tree(2340, 266, 28), at: 2.2 },
  { ...pine(2388, 80, 34), at: 2.3 },
];

const LAMPS = [lamp(960), lamp(1440), lamp(1868)];

const HeroSkyline = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 2400 360"
    preserveAspectRatio="xMidYMax slice"
    className={className}
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <radialGradient id="sk-dusk">
        <stop offset="0%" stopColor={FAR} stopOpacity="0.3" />
        <stop offset="100%" stopColor={FAR} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="sk-glow">
        <stop offset="0%" stopColor={LIT} stopOpacity="0.55" />
        <stop offset="100%" stopColor={LIT} stopOpacity="0" />
      </radialGradient>
      <linearGradient id="sk-meteor" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="120" y2="0">
        <stop offset="0%" stopColor={LIT} stopOpacity="0" />
        <stop offset="100%" stopColor={LIT} stopOpacity="1" />
      </linearGradient>
    </defs>

    {/* The glow of a city at dusk, behind everything. */}
    <ellipse cx="1200" cy="300" rx="820" ry="230" fill="url(#sk-dusk)" className="sk-on" style={at(2.2, 3)} />

    {/* Sky. */}
    {STARS.map((d, i) => (
      <path
        key={`star-${i}`}
        d={d}
        stroke={LIT}
        strokeWidth={i === 0 ? 2.6 : 1.8}
        className="sk-star"
        style={{ ...at(3.4 + i * 0.35), "--p": `${4 + i * 1.7}s` } as CSSProperties}
      />
    ))}
    <path
      d="M1609.8 46.2A16 16 0 1 0 1627.3 66.6A13.5 13.5 0 0 1 1609.8 46.2Z"
      fill={LIT}
      stroke={NEAR}
      strokeWidth={1.2}
      pathLength={1}
      className="sk-draw"
      style={at(3.0, 1.6)}
    />
    <g transform="translate(560 18) rotate(12)">
      <path d="M0 0H120" stroke="url(#sk-meteor)" strokeWidth={1.8} className="sk-meteor" style={at(4.8)} />
    </g>

    {/* The city, a step back and a shade dimmer. */}
    <g stroke={FAR} strokeWidth={1.2} opacity={0.85}>
      {TOWERS.map((t) => (
        <path key={t.d} d={t.d} fill={INK} pathLength={1} className="sk-draw" style={at(t.at, 1.9)} />
      ))}
      {TOWERS.filter((t) => t.detail).map((t) => (
        <path key={`d-${t.d}`} d={t.detail} pathLength={1} className="sk-draw" style={at(t.at + 0.6, 1.4)} />
      ))}
      {TOWER_LIGHTS.groups.map((d, i) => (
        <path key={`tl-${i}`} d={d} stroke={LIT} strokeWidth={2.6} strokeLinecap="butt" className="sk-on" style={at(2.6 + i * 0.2)} />
      ))}
      {TOWER_LIGHTS.twinkle.map((d, i) => (
        <path
          key={`tt-${i}`}
          d={d}
          stroke={LIT}
          strokeWidth={2.6}
          strokeLinecap="butt"
          className="sk-twinkle"
          style={{ ...at(2.8 + i * 0.3), "--p": `${9 + i * 4}s` } as CSSProperties}
        />
      ))}
      {/* The aviation light on the Pru's mast. */}
      <path d="M1089 34h0.01" stroke="#e8a27a" strokeWidth={4} className="sk-pulse" style={at(3.2)} />

      {BLOCKS.map((b, i) => (
        <path key={b.d} d={b.d} fill={INK} pathLength={1} className="sk-draw" style={at(0.9 + i * 0.06, 1.5)} />
      ))}
      {BLOCK_LIGHTS.groups.map((d, i) => (
        <path key={`bl-${i}`} d={d} stroke={LIT} strokeWidth={2.6} strokeLinecap="butt" className="sk-on" style={at(3.0 + i * 0.25)} />
      ))}
      {BLOCK_LIGHTS.twinkle.map((d, i) => (
        <path
          key={`bt-${i}`}
          d={d}
          stroke={LIT}
          strokeWidth={2.6}
          strokeLinecap="butt"
          className="sk-twinkle"
          style={{ ...at(3.2 + i * 0.3), "--p": `${11 + i * 3}s` } as CSSProperties}
        />
      ))}

      {/* The Zakim. */}
      {CABLES.map((c) => (
        <path key={c.d} d={c.d} strokeWidth={0.7} pathLength={1} className="sk-draw" style={at(c.at, 1.1)} />
      ))}
      <path d="M1440 290H1726V296H1440Z" fill={INK} pathLength={1} className="sk-draw" style={at(1.0, 1.6)} />
      {ZAKIM_TOWERS.map((x, i) => (
        <path
          key={x}
          d={`M${x - 4} 300L${x - 2} 196L${x} 186L${x + 2} 196L${x + 4} 300Z`}
          fill={INK}
          pathLength={1}
          className="sk-draw"
          style={at(1.0 + i * 0.15, 1.4)}
        />
      ))}
      {/* Traffic: dashes of near-zero length with round caps are dots, and
          moving the dash offset drives them along the deck. The second lane
          is drawn right to left, so the same animation runs it the other way. */}
      <path d="M1440 287.6H1726" stroke={LIT} strokeWidth={1.8} className="sk-traffic" style={{ ...at(4.4), "--p": "7s" } as CSSProperties} />
      <path d="M1726 287.6H1440" stroke="#e8a27a" strokeWidth={1.6} className="sk-traffic" style={{ ...at(4.9), "--p": "9s" } as CSSProperties} />
    </g>

    {/* The Charles: both banks, the city's lights on the water, a sail. */}
    <g stroke={NEAR} strokeWidth={1.3}>
      <path d="M1200 300H860" pathLength={1} className="sk-draw" style={at(0.2, 1.2)} />
      <path d="M1200 300H1716" pathLength={1} className="sk-draw" style={at(0.2, 1.2)} />
    </g>
    <g stroke={LIT} strokeWidth={1.4} opacity={0.55}>
      {REFLECTIONS.map((d, i) => (
        <path key={`rf-${i}`} d={d} className="sk-shimmer" style={{ ...at(4.0 + i * 0.2), "--p": `${3.2 + i * 0.9}s` } as CSSProperties} />
      ))}
    </g>
    <g className="sk-boat" style={at(4.6)}>
      <g transform="translate(880 330)" stroke={NEAR} strokeWidth={1.2}>
        <path d="M0 0h24l-4 5H4z" fill={INK} />
        <path d="M10 0V-24L23-2H10M10-20L2-2h8" />
      </g>
    </g>

    {/* The houses, nearest the river first. */}
    <g stroke={NEAR} strokeWidth={1.5}>
      {TREES.map((t) => (
        <g key={t.canopy}>
          <path d={t.trunk} pathLength={1} className="sk-draw" style={at(t.at, 1.2)} />
          <path d={t.canopy} fill={INK} pathLength={1} className="sk-draw" style={at(t.at + 0.15, 1.6)} />
        </g>
      ))}
      {HOUSES.map((h) => (
        <g key={h.body[0]}>
          {h.body.map((d, i) => (
            <path key={d} d={d} fill={INK} pathLength={1} className="sk-draw" style={at(h.at + i * 0.15, 2)} />
          ))}
          <path
            d={rects(h.windows) + (h.litExtra ?? "")}
            fill={LIT}
            stroke="none"
            className="sk-on"
            style={at(h.light)}
          />
          <path d={h.detail + frames(h.windows)} strokeWidth={1.1} pathLength={1} className="sk-draw" style={at(h.at + 0.4, 1.8)} />
        </g>
      ))}

      {/* The colonial's sign, hung out and swaying a little. */}
      <path d="M2070 340V262M2066 262H2108M2070 274L2082 262" pathLength={1} className="sk-draw" style={at(1.6, 1.2)} />
      <g className="sk-sway" style={{ ...at(4.2), transformOrigin: "2094px 262px" } as CSSProperties}>
        <path
          d="M2084 262V270M2104 262V270M2080 270H2108V290H2080ZM2088 286V280L2094 275L2100 280V286"
          strokeWidth={1.1}
          pathLength={1}
          className="sk-draw"
          style={at(1.9, 1.2)}
        />
      </g>

      {/* Streetlamps: they come on with a flicker. */}
      {LAMPS.map((l) => (
        <g key={l.cx}>
          <circle cx={l.cx} cy={l.cy} r="30" fill="url(#sk-glow)" stroke="none" className="sk-lamp" style={at(3.2)} />
          <path d={l.glass} fill={LIT} stroke="none" className="sk-lamp" style={at(3.2)} />
          <path d={l.frame} strokeWidth={1.2} pathLength={1} className="sk-draw" style={at(0.9, 1.4)} />
        </g>
      ))}

      {/* The ground, drawn first, from the middle outward. */}
      <path d={`M1200 ${GROUND}H0`} pathLength={1} className="sk-draw" style={at(0, 1.6)} />
      <path d={`M1200 ${GROUND}H2400`} pathLength={1} className="sk-draw" style={at(0, 1.6)} />
    </g>
  </svg>
);

export default HeroSkyline;
