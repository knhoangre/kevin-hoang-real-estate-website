/**
 * Verifiable, slow-changing facts for each town guide.
 *
 * Kept separate from the prose in NeighborhoodDetail.tsx on purpose. These are
 * checkable claims — station names, school names, route numbers — and they are
 * the "local specifics" that make a town guide worth reading rather than
 * interchangeable with every other agent's. Prose belongs with prose; facts
 * belong somewhere they can be audited and corrected in one place.
 *
 * Sourced from each town's Wikipedia article, 2026-08-26, cross-checked against
 * the MBTA line names. Anything that moves with the market — prices,
 * appreciation, days on market, school rankings — is deliberately absent.
 *
 * When a school opens, closes or a station changes, fix it HERE.
 */

export interface TownFacts {
  /** Rail/subway service. Empty array = no station in the town. */
  transit: string[];
  /** Route numbers, as locals say them. */
  highways: string[];
  schools: {
    elementary?: string[];
    middle?: string[];
    high: string[];
    /** Regional or shared arrangements worth knowing about. */
    note?: string;
  };
  /** Parks, water, conservation land. */
  outdoors: string[];
  /** Anything a buyer should specifically check in this town. */
  buyerNote?: string;
}

export const TOWN_FACTS: Record<string, TownFacts> = {
  "needham-ma": {
    transit: [
      "MBTA Needham Line commuter rail, with four stations in town: Needham Heights, Needham Center, Needham Junction and Hersey",
    ],
    highways: ["I-95/Route 128 (three exits in town)", "Route 135"],
    schools: {
      elementary: ["Broadmeadow", "John Eliot", "Newman", "Sunita L. Williams", "William Mitchell"],
      middle: ["High Rock School (grade 6)", "William F. Pollard Middle School (grades 7–8)"],
      high: ["Needham High School"],
      note: "Grade 6 is its own building at High Rock before students move to Pollard.",
    },
    outdoors: ["Cutler Park along the Charles River", "Charles River frontage on the southern and northeastern boundaries"],
    buyerNote:
      "Four commuter rail stations in one town is unusual, and walking distance to one is a durable difference between otherwise similar houses. Elevation varies more than people expect — from around 85 feet at Rosemary Meadows to about 300 feet at Bird's Hill.",
  },
  "newton-ma": {
    transit: [
      "Green Line D branch and B branch",
      "MBTA Framingham/Worcester Line commuter rail through the northern villages",
    ],
    highways: ["I-90 (Mass Pike)", "I-95/Route 128", "Route 9", "Route 16", "Route 30"],
    schools: {
      middle: ["Bigelow", "Brown", "F. A. Day", "Oak Hill"],
      high: ["Newton North High School", "Newton South High School"],
      note: "Two high schools, and which one an address feeds into is a common question — confirm it for the specific street.",
    },
    outdoors: ["Crystal Lake", "Chestnut Hill Reservoir", "Hemlock Gorge Reservation", "Norumbega Park", "Bullough's Pond", "Charles River along the north and west borders"],
    buyerNote:
      "Newton is thirteen villages — Auburndale, Chestnut Hill, Newton Centre, Newton Corner, Newton Highlands, Newton Lower Falls, Newton Upper Falls, Newtonville, Nonantum, Oak Hill, Thompsonville, Waban and West Newton — and they differ enough that a city-wide generalisation is rarely useful.",
  },
  "wellesley-ma": {
    transit: [
      "MBTA Framingham/Worcester Line commuter rail, with three stations in town: Wellesley Farms, Wellesley Hills and Wellesley Square",
    ],
    highways: ["I-95/Route 128", "Route 9", "Route 16", "Route 135"],
    schools: {
      elementary: ["Bates", "Fiske", "Hardy", "Hunnewell", "Schofield", "Sprague"],
      middle: ["Wellesley Middle School"],
      high: ["Wellesley High School"],
    },
    outdoors: ["Wellesley College campus grounds", "Charles River along the northern edge"],
    buyerNote:
      "Three colleges sit in town — Wellesley College, Babson College and Massachusetts Bay Community College — which shapes both the rental market and traffic patterns. The nine neighborhoods (Wellesley Farms, The Fells, Wellesley Hills, Wellesley Square, Poets' Corner, Babson Park, Peirce Estates, College Heights and Wellesley Lower Falls) are genuinely distinct.",
  },
  "weston-ma": {
    transit: ["MBTA Fitchburg Line commuter rail at Kendal Green, plus the Silver Hill and Hastings stops"],
    highways: ["I-90 (Mass Pike) through the southern portion", "I-95/Route 128 along the eastern edge", "US Route 20", "Route 30", "Route 117"],
    schools: {
      elementary: ["Country School", "Woodland School", "Field School (grades 4–5)"],
      middle: ["Weston Middle School"],
      high: ["Weston High School"],
    },
    outdoors: [
      "More than 2,000 acres preserved as parks, fields, wetlands and forest",
      "Roughly 90 miles of trails for hiking, riding and cross-country skiing",
      "Weston Ski Track at the Leo J. Martin Golf Course",
    ],
    buyerNote:
      "Weston's conservation land is the defining feature of the town and a large part of why lots are as generous as they are. Trail access from a property is worth checking directly.",
  },
  "dover-ma": {
    transit: ["No commuter rail station in town; the nearest stops are in neighbouring towns"],
    highways: ["Route 109", "Route 16", "I-95/Route 128 nearby"],
    schools: {
      elementary: ["Chickering School (K–5)"],
      middle: ["Dover-Sherborn Middle School (grades 6–8)"],
      high: ["Dover-Sherborn Regional High School"],
      note: "Dover shares its middle and high school with Sherborn as a regional district; the elementary school is Dover's own.",
    },
    outdoors: ["Noanet Woodlands", "Caryl Park", "Charles River along the northern boundary"],
    buyerNote:
      "Almost all residential zoning requires lots of one acre or larger, which is the single fact that explains Dover's density, its prices and its inventory. Septic and well systems are the norm rather than the exception — budget the inspection accordingly.",
  },
  "lexington-ma": {
    transit: [
      "No rail station in town: MBTA bus routes connect to the Red Line at Alewife",
      "Lexpress, the town's own weekday bus service, running from Depot Square",
      "The Minuteman Bikeway, a paved rail trail to Alewife",
    ],
    highways: ["Route 2", "I-95/Route 128"],
    schools: {
      elementary: ["Bowman", "Bridge", "Estabrook", "Fiske", "Harrington", "Maria Hastings"],
      middle: ["Jonas Clarke", "William Diamond"],
      high: ["Lexington High School", "Minuteman Regional High School"],
    },
    outdoors: ["Minute Man National Historical Park", "Willards Woods", "the Great Meadow in East Lexington"],
    buyerNote:
      "No commuter rail is the trade-off here, and the Minuteman Bikeway genuinely substitutes for it for some commuters. Lexington's neighborhoods are unusually well-defined — Meriam Hill, Belfry Hill, Munroe Hill, Countryside, Four Corners and East Lexington among them.",
  },
  "concord-ma": {
    transit: ["MBTA Fitchburg Line commuter rail at Concord and West Concord stations"],
    highways: ["Route 2", "Route 2A", "Route 62", "Route 126", "Route 117"],
    schools: {
      elementary: ["Alcott", "Thoreau", "Willard"],
      middle: ["Concord Middle School"],
      high: ["Concord-Carlisle Regional High School"],
      note: "The high school is regional, shared with Carlisle. Concord also has an unusual concentration of private schools: Concord Academy, Middlesex School, Fenn School and Nashoba Brooks.",
    },
    outdoors: [
      "Walden Pond",
      "Minute Man National Historical Park and the Old North Bridge",
      "Great Meadows National Wildlife Refuge",
      "Estabrook Woods",
      "The Sudbury, Assabet and Concord Rivers",
    ],
    buyerNote:
      "Concord's historic districts carry real constraints on exterior changes. If a property is in one, understand what approval is needed before planning any work.",
  },
  "cambridge-ma": {
    transit: [
      "Red Line at Harvard, Central, Kendall/MIT and Porter stations",
      "Green Line at Lechmere",
      "Commuter rail at Porter Square",
    ],
    highways: ["Memorial Drive", "Massachusetts Avenue", "Route 2", "I-90 via the Allston interchange"],
    schools: {
      high: ["Cambridge Rindge and Latin School"],
      note: "Cambridge runs a single public high school for the whole city.",
    },
    outdoors: ["Fresh Pond Reservation", "Cambridge Common", "the Charles River Esplanade paths"],
    buyerNote:
      "Cambridge is a city of squares — Harvard, Central, Kendall, Porter, Inman and Lechmere — and its thirteen official neighborhoods behave like separate markets. Kendall Square's biotech and technology cluster is the demand engine for much of the eastern half.",
  },
  "somerville-ma": {
    transit: [
      "Red Line at Davis Square",
      "Green Line Extension, which added five stations in the city in 2022",
      "Orange Line at Assembly",
    ],
    highways: ["I-93", "McGrath Highway", "Alewife Brook Parkway", "Mystic Valley Parkway"],
    schools: {
      high: ["Somerville High School"],
    },
    outdoors: ["The Somerville Community Path rail trail", "Alewife Linear Park", "the Mystic River along the northern edge"],
    buyerNote:
      "The Green Line Extension changed which parts of Somerville are transit-adjacent, and the effect is still working through the market. Squares to know: Davis, Union, Ball, Magoun, Teele, Powder House, Porter and Assembly. The city's 'seven hills' are why so many streets are steep.",
  },
  "waltham-ma": {
    transit: ["MBTA Fitchburg Line commuter rail at Waltham (Central Square) and Brandeis/Roberts"],
    highways: ["I-95/Route 128 through the western part", "I-90 (Mass Pike) just south", "Route 20", "Route 117"],
    schools: {
      high: ["Waltham High School"],
    },
    outdoors: ["Charles River paths through the city", "Prospect Hill Park", "the Western Greenway"],
    buyerNote:
      "Bentley and Brandeis both sit in Waltham, which supports a substantial rental market — relevant if you are looking at a multi-family. Moody Street is the city's restaurant district, and proximity to it is a real amenity. Waltham's mill history means some converted industrial buildings with unusual layouts.",
  },
  "medford-ma": {
    transit: [
      "Green Line Extension at Medford/Tufts and Ball Square, opened 2022",
      "Orange Line at Wellington",
      "MBTA Lowell Line commuter rail at West Medford",
    ],
    highways: ["I-93", "Route 16", "Route 28", "Route 38", "Route 60"],
    schools: {
      high: ["Medford High School"],
    },
    outdoors: ["Middlesex Fells Reservation", "the Mystic River through the middle of the city", "the Mystic Lakes"],
    buyerNote:
      "The Green Line Extension is the biggest change to Medford's market in decades and its effect varies sharply by neighborhood — West Medford, the Heights, Wellington, Glenwood, South Medford and Medford Hillside are all quite different. Tufts sits on the Medford/Somerville line.",
  },
  "malden-ma": {
    transit: ["Orange Line at Malden Center and Oak Grove", "Commuter rail at Malden Center"],
    highways: ["US Route 1", "Route 28", "Route 60", "Route 99", "I-93 nearby"],
    schools: {
      high: ["Malden High School"],
    },
    outdoors: ["Middlesex Fells Reservation", "Pine Banks Park, run jointly with Melrose", "the Northern Strand Trail"],
    buyerNote:
      "Two Orange Line stations put downtown Boston within a short ride, which is Malden's central advantage. Neighborhoods to know: Faulkner, West End, Edgeworth, Linden, Ferryway, Forestdale, Maplewood, Bellrock and Belmont Hill.",
  },
  "quincy-ma": {
    transit: [
      "Red Line at North Quincy, Wollaston, Quincy Center and Quincy Adams",
      "Commuter rail at Quincy Center",
    ],
    highways: ["I-93/Southeast Expressway", "Route 3", "Route 3A", "Route 28", "Route 53"],
    schools: {
      high: ["North Quincy High School", "Quincy High School"],
      note: "Two public high schools; confirm which one an address feeds into.",
    },
    outdoors: ["Wollaston Beach, the largest beach on Boston Harbor", "Blue Hills Reservation, covering roughly a quarter of the city", "Squantum Point Park", "Faxon Park"],
    buyerNote:
      "Four Red Line stops is more than most cities outside Boston have. Quincy's neighborhoods vary a great deal — Marina Bay, Squantum, Wollaston, Merrymount, Houghs Neck, Adams Shore, Germantown, Montclair and West Quincy included. Coastal properties warrant a flood-zone check.",
  },
  "braintree-ma": {
    transit: [
      "Red Line terminus at Braintree station",
      "Commuter rail at Braintree (Kingston and Fall River/New Bedford lines) and Weymouth Landing/East Braintree (Greenbush Line)",
    ],
    highways: ["I-93", "Route 3", "US Route 1", "Route 37", "Route 53"],
    schools: {
      high: ["Braintree High School"],
    },
    outdoors: ["Blue Hills Reservation", "Pond Meadow Park", "Sunset Lake", "the Monatiquot River"],
    buyerNote:
      "Being a Red Line terminus means a seat on the train in the morning, which commuters further up the line do not get — a real and often-overlooked advantage.",
  },
  "brookline-ma": {
    transit: [
      "Green Line C branch along Beacon Street",
      "Green Line D branch at Brookline Village, Brookline Hills, Beaconsfield, Reservoir and Chestnut Hill",
      "MBTA bus routes 51, 60, 65, 66 and 86",
    ],
    highways: ["Route 9 (Boylston Street), which unofficially divides north from south Brookline"],
    schools: {
      high: ["Brookline High School"],
      note: "Eight elementary schools feed a single comprehensive high school. Brookline runs its own district rather than sharing Boston's — for many buyers that is the whole reason they are looking here.",
    },
    outdoors: ["Olmsted Park and the Emerald Necklace", "Larz Anderson Park", "The Country Club"],
    buyerNote:
      "Brookline is an exclave of Norfolk County surrounded by Boston on nearly every side. Condominium documents matter more here than almost anywhere else, because so much of the stock is conversions of older buildings with small associations and thin reserves.",
  },
  "belmont-ma": {
    transit: [
      "MBTA Fitchburg Line commuter rail at Belmont Center and Waverley",
      "MBTA bus and trackless trolley service toward Harvard Square",
    ],
    highways: ["Route 2 along the northern boundary", "Route 60 (Pleasant Street)", "I-95/Route 128 nearby"],
    schools: {
      elementary: ["Mary Lee Burbank", "Daniel Butler", "Winn Brook", "Roger Wellington", "Winthrop L. Chenery Upper Elementary"],
      middle: ["Belmont Middle School"],
      high: ["Belmont High School"],
    },
    outdoors: ["Rock Meadow", "Habitat Education Center", "Clay Pit Pond", "publicly accessible parts of the McLean Hospital tract"],
    buyerNote:
      "No subway station is the main trade-off against neighbouring Arlington or Cambridge. Belmont has an unusually high share of two-family homes, many owner-occupied — and a lot of its condominiums are two-unit associations created from them, which have their own governance quirks.",
  },
  "winchester-ma": {
    transit: [
      "MBTA Lowell Line commuter rail at Winchester Center and Wedgemere, both Zone 1, to North Station",
    ],
    highways: ["I-93", "Route 3", "Route 38"],
    schools: {
      elementary: ["Ambrose", "Lincoln", "Lynch", "Muraco", "Vinson-Owen"],
      middle: ["McCall Middle School"],
      high: ["Winchester High School"],
    },
    outdoors: ["Middlesex Fells Reservation with the North, Middle and South Reservoirs", "the Mystic Lakes", "Wedge Pond and Winter Pond", "the Aberjona River"],
    buyerNote:
      "The commuter rail station sits inside a genuinely walkable town centre, which few Boston-area suburbs manage. The Aberjona runs through the middle of town and parts of Winchester fall within mapped flood zones — check the designation for a specific address early, because it affects insurance and sometimes financing.",
  },
};
