import type { MetadataRoute } from "next";
import { getHomeSnapshot } from "@/lib/repository";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const tombstones = (await getHomeSnapshot()).latestTombstones.map((tombstone) => ({
    url: absoluteUrl(`/tombstone/${tombstone.shareSlug}`),
    lastModified: new Date(tombstone.createdAt),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/feed"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/create"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...tombstones,
  ];
}
