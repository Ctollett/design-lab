// Segmentation script for interior.jpg
// Run with: node scripts/segment.js

import { pipeline } from "@huggingface/transformers";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createCanvas } from "canvas";

const __dirname = dirname(fileURLToPath(import.meta.url));

const INPUT_PATH = join(__dirname, "../public/semantic-image-hover/images/interior.jpg");
const OUTPUT_JSON = join(__dirname, "../public/semantic-image-hover/segments/interior.json");
const OUTPUT_MAP = join(__dirname, "../public/semantic-image-hover/segments/interior-map.png");

async function runSegmentation() {
  console.log("Loading segmentation model...");

  const segmenter = await pipeline(
    "image-segmentation",
    "Xenova/detr-resnet-50-panoptic"
  );

  console.log("Running segmentation on interior.jpg...");

  const result = await segmenter(INPUT_PATH);

  console.log("Segmentation complete. Found segments:");

  // Extract segment metadata (without the heavy mask data)
  const segments = result.map((segment, index) => {
    console.log(`  - ${segment.label} (score: ${segment.score?.toFixed(3) || "N/A"})`);
    return {
      id: index,
      label: segment.label,
      score: segment.score
    };
  });

  // Get image dimensions from first mask
  const firstMask = result[0]?.mask;
  if (!firstMask) {
    throw new Error("No mask data found");
  }

  const width = firstMask.width;
  const height = firstMask.height;

  console.log(`\nImage dimensions: ${width}x${height}`);

  // Create label map - each pixel gets the ID of its segment
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(width, height);

  // Initialize all pixels to 255 (no segment)
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = 255;     // R
    imageData.data[i + 1] = 255; // G
    imageData.data[i + 2] = 255; // B
    imageData.data[i + 3] = 255; // A
  }

  // Paint each segment with its ID as the color value
  for (let segIndex = 0; segIndex < result.length; segIndex++) {
    const mask = result[segIndex].mask;
    const maskData = mask.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const maskIdx = y * width + x;
        const pixelIdx = (y * width + x) * 4;

        // If this pixel belongs to this segment (mask value > 0.5)
        if (maskData[maskIdx] > 0.5) {
          imageData.data[pixelIdx] = segIndex;     // R = segment ID
          imageData.data[pixelIdx + 1] = segIndex; // G = segment ID
          imageData.data[pixelIdx + 2] = segIndex; // B = segment ID
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Save label map as PNG
  const buffer = canvas.toBuffer("image/png");
  writeFileSync(OUTPUT_MAP, buffer);
  console.log(`Saved label map to ${OUTPUT_MAP}`);

  // Save segment metadata as JSON
  const output = {
    width,
    height,
    segments,
    mapImage: "interior-map.png"
  };

  writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));
  console.log(`Saved metadata to ${OUTPUT_JSON}`);
}

runSegmentation().catch(console.error);
