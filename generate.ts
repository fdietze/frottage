import "dotenv/config";
import fs from "fs";
import { midjourney_generate_prompts } from "./midjourney";
import { download } from "./download";
async function main() {
  // synchronously read all files in prompts folder into an Array
  const prompts: Array<{ filename: string; prompt: string }> = fs.readdirSync(
    "./prompts",
  ).map((filename) => ({
    filename,
    prompt: fs.readFileSync(`prompts/${filename}`, "utf8").trim(),
  }));
  console.log(prompts);

  // launch midjourney and generate images for each prompt
  const results: Array<{ filename: string; prompt: string; uri: string }> =
    await midjourney_generate_prompts(prompts);

  // download and save results
  // results.forEach(async (result) => {
  for (const result of results) {
    await download(
      result.uri,
      `wallpapers/wallpaper-${result.filename}-original.png`,
    );

    // const filenameLatest = `wallpaper-${result.filename}-latest`;
    // let filenameDetail = `wallpaper-${result.filename}-${new Date()
    //     .toISOString()
    //     .replace(/[-:]/g, "")
    //     .replace(/\..+/, "")
    //   }-${result.prompt}`;
    // // sanitize filename
    // filenameDetail = filenameDetail.replace(/[^a-z0-9]/gi, "_").replace(
    //   /_+/g,
    //   "_",
    // );
    // fs.copyFileSync(
    //   `wallpapers/${filenameDetail}.png`,
    //   `wallpapers/${filenameLatest}.png`,
    // );
  }
}

main()
  .then(() => {
    console.log("done");
    process.exit(0);
  })
  .catch((e) => {
    console.log(e);
  });
