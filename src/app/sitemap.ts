import type { MetadataRoute } from "next";
import { allPosts } from "@/content/blog";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://talkotype.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/pricing",
    "/faq",
    "/blog",
    "/signup",
    "/login",
    "/terms",
    "/privacy",
  ].map((path) => ({
    url: `${site}${path}`,
    lastModified: new Date("2026-11-12"),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const posts = allPosts.map((post) => ({
    url: `${site}/blog/${post.slug}`,
    lastModified: new Date(post.updated || post.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...posts];
}
