import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  copyFile,
} from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
const folder = path.join(root, "public/assets/images/gallery");
await mkdir(folder, { recursive: true });
let captions = {};
try {
  captions = JSON.parse(
    await readFile(path.join(folder, "captions.json"), "utf8"),
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const entries = (await readdir(folder, { withFileTypes: true }))
  .filter(
    (item) => item.isFile() && /\.(jpe?g|png|webp|avif)$/i.test(item.name),
  )
  .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
const images = entries.map((item, i) => {
  const info = captions[item.name] || {};
  return {
    id: "local-" + item.name,
    imageUrl: "/assets/images/gallery/" + encodeURIComponent(item.name),
    caption:
      info.caption || item.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
    location: info.location || null,
    eventDate: info.eventDate || null,
    sortOrder: i,
    width: info.width || 1200,
    height: info.height || 1500,
  };
});
await writeFile(
  path.join(root, "src/config/gallery.generated.json"),
  JSON.stringify(images, null, 2) + "\n",
);
for (let i = 1; i <= 8; i++) {
  try {
    await copyFile(
      path.join(root, "public/placeholders/gallery-" + i + ".svg"),
      path.join(folder, "placeholder-" + i + ".svg"),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
console.log("Gallery manifest: " + images.length + " local photographs.");
