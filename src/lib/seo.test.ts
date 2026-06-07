import { describe, expect, it, vi } from "vitest";

describe("SEO helpers", () => {
  it("normalizes configured site URLs for canonical links", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.resetModules();

    const { absoluteUrl, siteUrl } = await import("./seo");

    expect(siteUrl()).toBe("https://example.com");
    expect(absoluteUrl("/tombstone/ts_123")).toBe("https://example.com/tombstone/ts_123");

    vi.unstubAllEnvs();
  });

  it("builds stable metadata for a public tombstone", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.resetModules();

    const { tombstoneMetadata } = await import("./seo");

    expect(
      tombstoneMetadata({
        id: "ts_123",
        shareSlug: "italy-funeral",
        teamName: "Italy",
        causeOfDeath: "Four stars, zero invitations",
        epitaph: "The anthem was ready. The invitation was not.",
        flagUrl: "https://flagcdn.com/w160/it.png",
      }),
    ).toMatchObject({
      title: "Italy Tombstone | Four stars, zero invitations",
      description:
        "Pay respects to Italy at World Cup Funeral Home. Cause of death: Four stars, zero invitations. Epitaph: The anthem was ready. The invitation was not.",
      alternates: {
        canonical: "https://example.com/tombstone/italy-funeral",
      },
      openGraph: {
        type: "article",
        url: "https://example.com/tombstone/italy-funeral",
      },
    });

    vi.unstubAllEnvs();
  });

  it("emits JSON-LD describing the website and tombstone page", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.resetModules();

    const { tombstoneJsonLd, websiteJsonLd } = await import("./seo");

    expect(websiteJsonLd()).toMatchObject({
      "@type": "WebSite",
      name: "World Cup Funeral Home",
      url: "https://example.com",
    });
    expect(
      tombstoneJsonLd({
        shareSlug: "italy-funeral",
        teamName: "Italy",
        causeOfDeath: "Penalty heartbreak",
        epitaph: "Four stars above the badge. No seat at the table.",
        buriedBy: "Anonymous Fan",
        createdAt: "2026-06-07T00:00:00.000Z",
        flagUrl: "https://flagcdn.com/w160/it.png",
      }),
    ).toMatchObject({
      "@type": "Article",
      headline: "Italy Tombstone",
      url: "https://example.com/tombstone/italy-funeral",
      author: {
        "@type": "Person",
        name: "Anonymous Fan",
      },
    });

    vi.unstubAllEnvs();
  });
});
