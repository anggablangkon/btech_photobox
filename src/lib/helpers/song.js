export function getSongUrl(relativePath = "") {
  console.log(relativePath);

  // kalau production, pakai backend URL
  const base = import.meta.env.VITE_ADMIN_URL;
  return `${base}/${relativePath}`;
}
