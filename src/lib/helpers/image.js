export function loadImageWithCORS(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // This enables CORS
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}
// Convert a base64 string to a Blob
export function base64ToBlob(base64Data, contentType = "image/jpeg") {
  if (!base64Data || typeof base64Data !== "string") {
    console.error("[SONG] Invalid base64 data:", base64Data);
    return null;
  }

  try {
    const base64Parts = base64Data.split(",");
    if (base64Parts.length !== 2) {
      console.error(
        "[SONG] Invalid base64 format:",
        base64Data.substring(0, 50) + "..."
      );
      return null;
    }

    const byteCharacters = atob(base64Parts[1]);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  } catch (error) {
    console.error("[SONG] Error converting base64 to blob:", error);
    return null;
  }
}


export function getAssetUrl(relativePath = "") {
  if (import.meta.env.DEV) {
    return relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  }

  // kalau production, pakai backend URL
  const base = import.meta.env.VITE_ADMIN_URL;
  return `${base}/${relativePath}`;
}
