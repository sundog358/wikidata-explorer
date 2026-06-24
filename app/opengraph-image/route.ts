import { readFile } from "node:fs/promises";
import { join } from "node:path";

const imagePath = join(process.cwd(), "public", "images", "jean-francois-millet-gleaners-google-art-project-2.jpg");

export const runtime = "nodejs";

export async function GET() {
  const image = await readFile(imagePath);

  return new Response(image, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/jpeg",
    },
  });
}