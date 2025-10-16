/**
 * Utilities for handling bin sensor data transformations.
 * Keep parsing, filtering and sorting logic in one place to follow SRP and
 * make the component code easier to read and test.
 */

/**
 * Parse a fill value into a numeric percentage.
 * Accepts numbers or strings such as "90", "90%", "90 %" and returns
 * the numeric value or NaN when not parseable.
 * @param {string|number|null|undefined} val
 * @returns {number}
 */
export function parseFill(val) {
  if (val === undefined || val === null) return NaN;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const m = val.match(/-?\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : NaN;
  }
  return NaN;
}

/**
 * Create a stable, human-readable key for a bin's location.
 * Prefers location.description, then name/address, then the raw location value,
 * and finally falls back to the bin code.
 * @param {Object} bin
 * @returns {string}
 */
export function getLocationKey(bin) {
  if (!bin) return "";
  const loc = bin.location;
  if (loc && typeof loc === "object") {
    return (
      loc.description ||
      loc.name ||
      loc.address ||
      JSON.stringify(loc)
    ).toString();
  }
  return (loc ?? bin.code ?? "").toString();
}

/**
 * Transform a raw bins array to include a numeric `fillNumeric` field,
 * filter by a minimum threshold and sort so bins from the same location
 * appear consecutively. This keeps the UI code simple — it can assume
 * the array is ready to render.
 * @param {Array<Object>} bins
 * @param {number} threshold
 * @returns {Array<Object>} transformed and sorted bins
 */
export function transformAndSortBins(bins = [], threshold = 85) {
  const mapped = (bins || [])
    .map((b) => {
      const raw = b.fillLevelPercent ?? b.fill ?? b.fillLevel ?? null;
      const fillNumeric = parseFill(raw);
      return { ...b, fillNumeric };
    })
    .filter((b) => {
      // Only include bins that meet the fill threshold and whose status is 'needs-collection' or 'overflow'
      const status = (b.status ?? "").toString().toLowerCase();
      return (
        !Number.isNaN(b.fillNumeric) &&
        b.fillNumeric >= threshold &&
        (status === "needs-collection" || status === "overflow")
      );
    });

  mapped.sort((a, c) => {
    const ka = getLocationKey(a);
    const kc = getLocationKey(c);
    const locCmp = ka.localeCompare(kc);
    if (locCmp !== 0) return locCmp;
    const codeA = (a.code ?? "").toString();
    const codeC = (c.code ?? "").toString();
    const codeCmp = codeA.localeCompare(codeC);
    if (codeCmp !== 0) return codeCmp;
    const idA = (a._id ?? a.id ?? "").toString();
    const idC = (c._id ?? c.id ?? "").toString();
    return idA.localeCompare(idC);
  });

  return mapped;
}

export default { parseFill, getLocationKey, transformAndSortBins };
