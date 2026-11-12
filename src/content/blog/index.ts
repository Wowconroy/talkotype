import { legacyPosts } from "@/content/blog/legacy-posts";
import { seoPosts } from "@/content/blog/posts/seo-posts";
import type { BlogPost } from "@/content/blog/types";

export const allPosts: BlogPost[] = [...seoPosts, ...legacyPosts].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);

export function getPostBySlug(slug: string) {
  return allPosts.find((post) => post.slug === slug);
}

export function getAllSlugs() {
  return allPosts.map((post) => post.slug);
}
