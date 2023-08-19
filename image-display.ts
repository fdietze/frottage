import terminalImage from "terminal-image";
import got from "got";

export async function displayRemoteImage(url: string): Promise<void> {
  console.log(url);
  const image = await got(url).buffer();
  console.log(await terminalImage.buffer(image));
}
