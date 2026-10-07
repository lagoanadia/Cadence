// One-time data fix for the palette redesign (rainbow -> amber -> green):
// existing areas/categories store a literal hex, picked under an older
// palette generation. New rows pick up the current palette automatically
// (see src/lib/palette.ts), but old rows keep their old hex forever unless
// remapped here, by position in the palette array.
//
// Runs automatically during `vercel-build` when FIX_PALETTE_COLORS=true is
// set (same pattern as SEED_DEMO) — never with a hardcoded connection
// string, so it only ever touches whichever database DATABASE_URL points
// to. Turn the env var back off after one successful deploy: it's a one-time
// fix, not something that should run on every build.
import "dotenv/config";
import { db } from "../src/lib/db";

const OLD_RAINBOW = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const OLD_AMBER = ["#c17800", "#f2b705", "#d98f1f", "#eda100", "#a8651a", "#8f5d00", "#6b4a00", "#4a2e00"];
const CURRENT_GREEN = ["#3dae63", "#4cc274", "#35a05c", "#248a3d", "#1f7a38", "#1a6b30", "#155c29", "#0f4a20"];

const REMAP = new Map<string, string>();
for (let i = 0; i < CURRENT_GREEN.length; i++) {
  REMAP.set(OLD_RAINBOW[i].toLowerCase(), CURRENT_GREEN[i]);
  REMAP.set(OLD_AMBER[i].toLowerCase(), CURRENT_GREEN[i]);
}

async function remap(label: string, rows: { id: string; name: string; color: string }[], update: (id: string, color: string) => Promise<unknown>) {
  for (const row of rows) {
    const next = REMAP.get(row.color.toLowerCase());
    if (!next || next.toLowerCase() === row.color.toLowerCase()) continue;
    console.log(`${label} "${row.name}": ${row.color} -> ${next}`);
    await update(row.id, next);
  }
}

async function main() {
  const areas = await db.area.findMany({ select: { id: true, name: true, color: true } });
  await remap("area", areas, (id, color) => db.area.update({ where: { id }, data: { color } }));

  const categories = await db.expenseCategory.findMany({ select: { id: true, name: true, color: true } });
  await remap("category", categories, (id, color) => db.expenseCategory.update({ where: { id }, data: { color } }));

  console.log("Palette color remap done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
