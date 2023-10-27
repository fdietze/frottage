import sharp from "sharp";
import { upscaleESRGANx2 } from "./stability-ai";

const Real_ESRGAN_x2_maxUpscaleOutputPixelCount = 4194304;
const Real_ESRGAN_x2_scaleFactor = 2;

export async function upscale(originalImage: string, targetImage: string) {
  await prepare_image_for_upscaling(
    originalImage,
    targetImage,
    Real_ESRGAN_x2_scaleFactor,
    Real_ESRGAN_x2_maxUpscaleOutputPixelCount,
  );
  await upscaleESRGANx2(targetImage, targetImage);
}

export async function prepare_image_for_upscaling(
  originalImage: string,
  targetImage: string,
  scaleFactor: number,
  maxPixelCount: number,
) {
  const originalImageSize = await getImageSize(originalImage);
  const requiredUpscaleSize = calculateRequiredUpscaleSize(
    originalImageSize,
    scaleFactor,
    maxPixelCount,
  );
  console.log(
    "upscaling",
    originalImage,
    `(${originalImageSize.width}x${originalImageSize.height})`,
    "to",
    targetImage,
    `(${requiredUpscaleSize.width * scaleFactor}x${requiredUpscaleSize.height * scaleFactor
    })`,
  );
  // scale image, but don't enlare
  await sharp(originalImage).resize({
    ...requiredUpscaleSize,
    withoutEnlargement: true,
  }).toFile(targetImage);
}

async function getImageSize(
  image: string,
): Promise<{ width: number; height: number }> {
  const { width, height } = await sharp(image).metadata();
  return { width: width!, height: height! };
}

function calculateRequiredUpscaleSize(
  original: { width: number; height: number },
  factor: number,
  maxPixelCount: number,
): { width: number; height: number } {
  // calculate aspect ratio
  const aspectRatio = original.width / original.height;

  // calculate dimensions of upscaled image
  const upscaledHeight = Math.floor(Math.sqrt(maxPixelCount / aspectRatio));
  const upscaledWidth = aspectRatio * upscaledHeight;

  // calculate dimensions of original image
  const newOriginalWidth = Math.floor(upscaledWidth / factor);
  const newOriginalHeight = Math.floor(upscaledHeight / factor);
  return { width: newOriginalWidth, height: newOriginalHeight };
}
