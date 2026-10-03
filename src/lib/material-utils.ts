/**
 * Helper utilities for lesson materials and attachments.
 */

export function isCloudinaryPdfUrl(url: string): boolean {
  if (!url) return false;
  const isCloudinary = url.includes("res.cloudinary.com");
  const isPdf = url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("/pdf");
  return isCloudinary && isPdf;
}

export function getMaterialViewUrl(url: string, name?: string): string {
  if (!url) return "#";
  
  // If it's a Cloudinary PDF or document, route through our authenticated streaming viewer
  if (url.includes("res.cloudinary.com")) {
    const isDocOrPdf = /\.(pdf|doc|docx|ppt|pptx|zip)($|\?)/i.test(url);
    if (isDocOrPdf) {
      const params = new URLSearchParams();
      params.set("url", url);
      if (name) params.set("name", name);
      return `/api/materials/view?${params.toString()}`;
    }
  }

  return url;
}

export function extractCloudinaryPublicId(url: string): { publicId: string; format: string } | null {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname; // e.g. /dvfqfhdvw/image/upload/v1791037697/mindmastery_uploads/cb40qz2shxy99zbjigzp.pdf
    
    // Find upload/v\d+/ or upload/
    const uploadMatch = pathname.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (!uploadMatch || !uploadMatch[1]) return null;

    const fullPathWithExt = uploadMatch[1]; // mindmastery_uploads/cb40qz2shxy99zbjigzp.pdf
    const lastDotIndex = fullPathWithExt.lastIndexOf(".");
    
    if (lastDotIndex > -1) {
      return {
        publicId: fullPathWithExt.substring(0, lastDotIndex),
        format: fullPathWithExt.substring(lastDotIndex + 1),
      };
    }

    return {
      publicId: fullPathWithExt,
      format: "pdf",
    };
  } catch {
    return null;
  }
}
