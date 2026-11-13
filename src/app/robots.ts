import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://talkotype.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/app",
          "/app/",
          "/account",
          "/account/",
          "/api/",
          "/reset-password",
          "/auth/",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
