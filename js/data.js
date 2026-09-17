// Loads the dashboard dataset from ./data using relative paths (GitHub Pages safe).
// Rebuilds the exact RAW object the original single-file dashboard embedded:
// { districts, blocks, mgmts, types, genders, locs, schools }

const DATA_DIR = 'data/';

async function getJSON(file) {
  const res = await fetch(DATA_DIR + file);
  if (!res.ok) throw new Error(`Could not load ${DATA_DIR + file} (HTTP ${res.status})`);
  return res.json();
}

export async function loadDashboardData() {
  const manifest = await getJSON('manifest.json');
  const [lookups, ...parts] = await Promise.all([
    getJSON(manifest.lookups),
    ...manifest.schoolParts.map(getJSON),   // fetched in parallel, concatenated in listed order
  ]);
  const schools = [].concat(...parts);
  if (schools.length !== manifest.totalSchools) {
    throw new Error(`Expected ${manifest.totalSchools} schools, loaded ${schools.length}`);
  }
  return Object.assign({}, lookups, { schools });
}
