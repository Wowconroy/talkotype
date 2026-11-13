import { legacyPosts } from "@/content/blog/legacy-posts";
import { seoPosts } from "@/content/blog/posts/seo-posts";
import { seoPostsBatch2 } from "@/content/blog/posts/seo-posts-batch2";
import type { BlogPost } from "@/content/blog/types";

export const allPosts: BlogPost[] = [
  ...seoPostsBatch2,
  ...seoPosts,
  ...legacyPosts,
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export function getPostBySlug(slug: string) {
  return allPosts.find((post) => post.slug === slug);
}

export function getAllSlugs() {
  return allPosts.map((post) => post.slug);
}
