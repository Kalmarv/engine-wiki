// The one confidence scale. Strongest first; the order is used for sorting and for the coverage bars.
export const levels = [
  {
    id: 'proven',
    label: 'Proven',
    short: 'P',
    meaning:
      'Holds on every case there is: read exactly with no bytes left over on every entry, matched field for field by an independent reader, or confirmed by running the engine\'s own code.',
  },
  {
    id: 'observed',
    label: 'Observed',
    short: 'O',
    meaning: 'Measured on real data and holds on what was checked, but not on every case.',
  },
  {
    id: 'sourced',
    label: 'Sourced',
    short: 'S',
    meaning: 'A third-party tool, document or community source says so; not checked by us.',
  },
  {
    id: 'inferred',
    label: 'Inferred',
    short: 'I',
    meaning: 'Reasoned from other facts, a name, a fit or a pattern; not measured.',
  },
  {
    id: 'unknown',
    label: 'Unknown',
    short: '?',
    meaning: 'Stored and accounted for, but what it means is not established.',
  },
];

export const levelIds = levels.map((l) => l.id);
export const levelById = Object.fromEntries(levels.map((l) => [l.id, l]));
export const isLevel = (id) => Object.hasOwn(levelById, id);

export function checkLevel(id, where) {
  if (!isLevel(id)) throw new Error(`${where}: '${id}' is not a confidence level (${levelIds.join(', ')})`);
  return id;
}
