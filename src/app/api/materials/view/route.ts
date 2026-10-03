import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { extractCloudinaryPublicId } from "@/lib/material-utils";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawUrl = searchParams.get("url");
  const fileName = searchParams.get("name") || "learning-material";
  const forceDownload = searchParams.get("download") === "true";

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing material URL parameter" }, { status: 400 });
  }

  try {
    // 1. If it's a Cloudinary URL, use authenticated signed download to bypass Cloudinary's default 401 on PDFs
    if (rawUrl.includes("res.cloudinary.com")) {
      const extracted = extractCloudinaryPublicId(rawUrl);

      if (extracted) {
        const { publicId, format } = extracted;
        const normalizedFormat = (format || "pdf").toLowerCase();

        // Generate signed download URL via Cloudinary SDK
        let signedDownloadUrl = cloudinary.utils.private_download_url(publicId, normalizedFormat, {
          resource_type: "image",
          type: "upload",
        });

        let fetchRes = await fetch(signedDownloadUrl);

        // Fallback: try raw resource type if image type returned 404
        if (!fetchRes.ok && fetchRes.status === 404) {
          signedDownloadUrl = cloudinary.utils.private_download_url(publicId, normalizedFormat, {
            resource_type: "raw",
            type: "upload",
          });
          fetchRes = await fetch(signedDownloadUrl);
        }

        if (fetchRes.ok) {
          const arrayBuffer = await fetchRes.arrayBuffer();
          const mimeType = MIME_MAP[normalizedFormat] || fetchRes.headers.get("content-type") || "application/octet-stream";

          // Format clean download / inline filename
          let safeName = fileName.replace(/[^a-zA-Z0-9_\-\. ]/g, "").trim() || "document";
          if (!safeName.toLowerCase().endsWith(`.${normalizedFormat}`)) {
            safeName += `.${normalizedFormat}`;
          }

          const disposition = forceDownload
            ? `attachment; filename="${safeName}"`
            : `inline; filename="${safeName}"`;

          return new Response(arrayBuffer, {
            status: 200,
            headers: {
              "Content-Type": mimeType,
              "Content-Disposition": disposition,
              "Content-Length": String(arrayBuffer.byteLength),
              "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
              "X-Content-Type-Options": "nosniff",
            },
          });
        }
      }
    }

    // 2. Non-Cloudinary or direct URL fallback
    // If it's an external URL, redirect directly
    return NextResponse.redirect(rawUrl);
  } catch (error: any) {
    console.error("Materials View API Error:", error);
    return NextResponse.json(
      { error: "Failed to load material. Please contact support or try downloading again." },
      { status: 500 }
    );
  }
}
