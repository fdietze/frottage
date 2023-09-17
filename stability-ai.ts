import "dotenv/config";

import fetch from "node-fetch";
import FormData from "form-data";
import * as fs from "fs";

const API_KEY = <string> process.env.STABILITY_AI_API_KEY;

export async function upscaleESRGANx2(
  originalImage: string,
  targetImage: string,
) {
  const formData = new FormData();
  formData.append("image", fs.readFileSync(originalImage));
  // formData.append("height", 0);

  const response = await fetch(
    "https://api.stability.ai/v1/generation/esrgan-v1-x2plus/image-to-image/upscale",
    {
      method: "POST",
      headers: {
        ...formData.getHeaders(),
        Accept: "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(`Non-200 response: ${await response.text()}`);
  }

  const responseJSON: any = await response.json();

  responseJSON.artifacts.forEach((image) => {
    fs.writeFileSync(
      targetImage,
      Buffer.from(image.base64, "base64"),
    );
  });
}
