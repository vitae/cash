import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://flowarts.pro";
  const now = new Date().toISOString();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/shortcut`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/guides/how-to-be-a-pro`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/guides/traveling-for-gigs`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/guides/contact-50-brands`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/guides/build-your-brand`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/guides/top-100-artists`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
