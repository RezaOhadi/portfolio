import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import ts from "typescript";
const source = await readFile(new URL("../src/lib/media-urls.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { parseYouTubeId, spotifyEmbedUrl } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
test("YouTube accepts watch, short, shorts, live and embedded URLs", () => {
  const id = "abcdefghijk";
  for (const url of ["https://www.youtube.com/watch?feature=share&v="+id, "https://youtu.be/"+id+"?t=2", "https://m.youtube.com/shorts/"+id, "https://youtube.com/live/"+id, "https://www.youtube-nocookie.com/embed/"+id]) assert.equal(parseYouTubeId(url),id);
});
test("YouTube rejects spoofed providers, unsafe protocols and invalid identifiers", () => {
  for (const url of [null, "", "javascript:alert(1)", "https://evil.com/youtube.com/watch?v=abcdefghijk", "https://youtube.com.evil.com/watch?v=abcdefghijk", "https://www.youtube.com/watch?v=short", "ftp://youtube.com/watch?v=abcdefghijk"]) assert.equal(parseYouTubeId(url),null);
});
test("Spotify normalizes supported public and embed URLs", () => {
  const id="1234567890123456789012";
  for(const kind of ["artist","album","track","playlist","show","episode"]) {
    assert.equal(spotifyEmbedUrl("https://open.spotify.com/"+kind+"/"+id+"?si=tracking"),"https://open.spotify.com/embed/"+kind+"/"+id+"?theme=0");
    assert.equal(spotifyEmbedUrl("https://open.spotify.com/intl-fr/embed/"+kind+"/"+id),"https://open.spotify.com/embed/"+kind+"/"+id+"?theme=0");
  }
});
test("Spotify rejects unsafe or incomplete sources", () => {
  for(const url of ["https://open.spotify.com.evil.com/track/1234567890123456789012","https://evil.com/track/1234567890123456789012","http://open.spotify.com/track/1234567890123456789012","https://open.spotify.com/search/Reza",null,"","javascript:alert(1)"]) assert.equal(spotifyEmbedUrl(url),null);
});
test("Gallery drop-in discovery preserves captions and encodes filenames", async () => {
  const fixture=await mkdtemp(path.join(os.tmpdir(),"portfolio-gallery-test-"));
  try {
    const gallery=path.join(fixture,"public/assets/images/gallery");
    await mkdir(gallery,{recursive:true}); await mkdir(path.join(fixture,"src/config"),{recursive:true});
    await writeFile(path.join(gallery,"02 Piano #1.webp"),"fixture");
    await writeFile(path.join(gallery,"01-stage.jpg"),"fixture");
    await writeFile(path.join(gallery,"ignore.txt"),"fixture");
    await writeFile(path.join(gallery,"captions.json"),JSON.stringify({"01-stage.jpg":{caption:"Stage portrait",location:"Recital hall"}}));
    execFileSync(process.execPath,[path.resolve("scripts/gen-gallery.mjs")],{cwd:fixture,stdio:"pipe"});
    const images=JSON.parse(await readFile(path.join(fixture,"src/config/gallery.generated.json"),"utf8"));
    assert.equal(images.length,2); assert.equal(images[0].caption,"Stage portrait");
    assert.equal(images[1].imageUrl,"/assets/images/gallery/02%20Piano%20%231.webp");
    assert.ok(images.every((image)=>image.width>0 && image.height>0));
  } finally {
    const resolved=path.resolve(fixture);
    assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith("portfolio-gallery-test-"));
    await rm(resolved,{recursive:true,force:true});
  }
});
function luminance(hex) {
  const rgb=hex.match(/\w\w/g).map((part)=>parseInt(part,16)/255).map((value)=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
test("Portfolio body, secondary text and accent tokens meet AA text contrast", () => {
  for(const background of ["0a0a0c","131416","1b1c1e"]) for(const foreground of ["f2eee6","b7b5b1","d5ae88"]) assert.ok((luminance(foreground)+.05)/(luminance(background)+.05)>=4.5,foreground+" on "+background);
});
