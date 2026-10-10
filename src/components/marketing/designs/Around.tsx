import {
  MAP_FRAME,
  PLACE_GROUPS,
  mapTiles,
  shownPlaces,
  sourcesOf,
  type PlaceGroup,
  type ShownPlace,
} from '@/lib/around';
import type { MarketingDoc } from '@/lib/marketing';

/**
 * The booklet's third page: "Around the home".
 *
 * One more landscape sheet, printed on its own, folded and tucked inside the
 * booklet — a map with the house at its centre on the left, and what is near it
 * on the right. Which places, how far and where the pins go are all decided in
 * around.ts; this is the drawing.
 *
 * ONE LAYOUT, FOUR SKINS. The structure is the same in every design and only
 * the faces and colours change (`ar-classic`, `ar-noir`…), so the page matches
 * whichever booklet it is tucked into without being built four times.
 *
 * THE MAP IS A GRID OF PLAIN <img> TILES, not a mapping library and not a
 * canvas. OpenStreetMap's tiles, like MLS PIN's photographs, may be shown and
 * not read — and a page that only shows them prints them at full size. Each
 * tile is drawn whole and the frame clips the grid; see Pic.tsx for why that
 * matters to the size of the PDF. The pins are ordinary elements laid over it,
 * so they stay sharp at any print size.
 *
 * "© OpenStreetMap contributors" on the map is a condition of using the tiles,
 * not a courtesy, and is part of the map rather than of the editor.
 */

const TILES = 'https://tile.openstreetmap.org';

const Pin = ({ n }: { n: number | null }) =>
  n === null ? <i className="ar-dot" /> : <b className="ar-n num">{n}</b>;

const List = ({ group, rows }: { group: PlaceGroup; rows: ShownPlace[] }) => {
  if (rows.length === 0) return null;
  const label = PLACE_GROUPS.find((g) => g.id === group)?.label ?? '';
  return (
    <section className={`ar-list ar-${group}`}>
      <h3>{label}</h3>
      <ul>
        {rows.map((place) => (
          <li key={place.id}>
            <Pin n={place.n} />
            <span className="ar-name">
              {place.name}
              {place.note.trim() && <em>{place.note}</em>}
            </span>
            <span className="ar-far num">{place.distance}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

const AroundPage = ({ doc, skin }: { doc: MarketingDoc; skin: string }) => {
  const around = doc.around;
  if (!around.on) return null;

  const shown = shownPlaces(around);
  const everything = PLACE_GROUPS.flatMap((g) => shown[g.id]);
  const home = around.home;
  const sources = sourcesOf(shown, home !== null);
  const anySchools = shown.schools.length > 0;

  return (
    <div className={`page booklet around ar-${skin}`}>
      <div className="ar-field" />
      <div className="panel left">
        <div className="ar-head">
          {doc.cityLine.trim() && <p className="ar-eyebrow num">{doc.street || doc.cityLine}</p>}
          {around.title.trim() && <h2 className="ar-title">{around.title}</h2>}
        </div>

        {home ? (
          <div className="ar-map" style={{ width: MAP_FRAME.w, height: MAP_FRAME.h }}>
            {mapTiles(home, around.zoom).map((tile) => (
              <img
                key={`${tile.z}/${tile.x}/${tile.y}`}
                src={`${TILES}/${tile.z}/${tile.x}/${tile.y}.png`}
                alt=""
                draggable={false}
                style={{ left: tile.left, top: tile.top, width: tile.size, height: tile.size }}
              />
            ))}
            {everything
              .filter((place) => place.n !== null)
              .map((place) => (
                <b key={place.id} className="ar-pin num" style={{ left: place.left, top: place.top }}>
                  {place.n}
                </b>
              ))}
            <span className="ar-home" style={{ left: MAP_FRAME.w / 2, top: MAP_FRAME.h / 2 }}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3.2 2.8 11h2.6v9.2h5v-6h3.2v6h5V11h2.6z" />
              </svg>
            </span>
            <span className="ar-credit">© OpenStreetMap contributors</span>
          </div>
        ) : (
          <div className="ui ar-nomap" style={{ width: MAP_FRAME.w, height: MAP_FRAME.h }}>
            Press “Find what’s nearby” to draw the map
          </div>
        )}

        <div className="ar-pair">
          <List group="transit" rows={shown.transit} />
          <List group="highways" rows={shown.highways} />
        </div>

        {/* Under the map, where there is room for it. Beside the long lists on
            the right it ran into their last row. */}
        <p className="ar-small">
          Distances are straight-line from the home.
          {anySchools &&
            ' Schools shown are nearby, not assigned: the school district decides which school an address attends.'}
          {sources.length > 0 && ` Sources: ${sources.join(', ')}`}
          {sources.length > 0 && around.checked && `, ${around.checked}`}
          {sources.length > 0 && '.'}
        </p>
      </div>

      <div className="panel right">
        <div className="ar-lists">
          <List group="schools" rows={shown.schools} />
          <List group="parks" rows={shown.parks} />
          <List group="dining" rows={shown.dining} />
          <List group="groceries" rows={shown.groceries} />
        </div>
      </div>
    </div>
  );
};

export default AroundPage;
