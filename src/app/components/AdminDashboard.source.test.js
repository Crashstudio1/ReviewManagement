import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const sourceFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "AdminDashboard.tsx",
);

test("Admin dashboard sidebar has a close control and mobile closed state", async () => {
  const source = await readFile(sourceFile, "utf8");

  assert.match(source, /aria-label="Close sidebar"/);
  assert.match(source, /setSidebarOpen\(false\)/);
  assert.match(source, /-translate-x-full lg:translate-x-0/);
  assert.match(source, /onEditService/);
  assert.match(source, /Save Changes/);
  assert.match(source, /Cancel Edit/);
  assert.match(source, /api\.getRecentFeedback/);
  assert.match(source, /api\.getFeedbackSummary/);
  assert.doesNotMatch(source, /REVIEWS\.map/);
  assert.doesNotMatch(source, /RATING_DIST\.map/);
  assert.doesNotMatch(source, /LineChart data={MONTHLY}/);
});
