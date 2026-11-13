import type { MetadataRoute } from "next";
import { allPosts } from "@/content/blog";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://talkotype.app";

export default function sitemap(): MetadataRoute.Sitemap {
  // Public marketing + content only. Auth, desk, account, and APIs stay out.
  const staticRoutes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
    lastModified: Date;
  }> = [
    { path: "", changeFrequency: "weekly", priority: 1, lastModified: new Date("2026-11-13") },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.9, lastModified: new Date("2026-11-13") },
    { path: "/faq", changeFrequency: "weekly", priority: 0.8, lastModified: new Date("2026-11-13") },
    { path: "/reviews", changeFrequency: "monthly", priority: 0.6, lastModified: new Date("2026-11-12") },
    { path: "/blog", changeFrequency: "daily", priority: 0.9, lastModified: new Date("2026-11-13") },
    { path: "/signup", changeFrequency: "monthly", priority: 0.7, lastModified: new Date("2026-11-13") },
    { path: "/login", changeFrequency: "monthly", priority: 0.5, lastModified: new Date("2026-11-13") },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3, lastModified: new Date("2026-11-12") },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3, lastModified: new Date("2026-11-12") },
  ];

  const staticEntries = staticRoutes.map((route) => ({
    url: `${site}${route.path}`,
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const posts = allPosts.map((post) => ({
    url: `${site}/blog/${post.slug}`,
    lastModified: new Date(post.updated || post.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...posts];
}
