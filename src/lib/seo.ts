import type { Metadata } from "next";

export const siteName = "World Cup Funeral Home";
export const defaultDescription =
  "A funeral home for eliminated World Cup teams, broken dreams, and emotionally damaged football fans.";

const defaultOgImage = "/opengraph-image";

export function siteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const withProtocol = configuredUrl.startsWith("http")
    ? configuredUrl
    : `https://${configuredUrl}`;

  return withProtocol.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${cleanPath}`;
}

export function pageTitle(title?: string) {
  return title ? `${title} | ${siteName}` : siteName;
}

export function pageMetadata({
  title,
  description = defaultDescription,
  path = "/",
  image = defaultOgImage,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const canonical = absoluteUrl(path);
  const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);
  const metadataTitle = title ?? siteName;
  const resolvedTitle = title ? pageTitle(title) : siteName;

  return {
    title: metadataTitle,
    description,
    alternates: {
      canonical,
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: resolvedTitle,
      description,
      url: canonical,
      siteName,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: [imageUrl],
    },
  };
}

export function tombstoneMetadata({
  shareSlug,
  teamName,
  causeOfDeath,
  epitaph,
  flagUrl,
}: {
  id: string;
  shareSlug: string;
  teamName: string;
  causeOfDeath: string;
  epitaph: string;
  flagUrl: string;
}): Metadata {
  const path = `/tombstone/${shareSlug}`;
  const description = `Pay respects to ${teamName} at ${siteName}. Cause of death: ${causeOfDeath}. Epitaph: ${epitaph}`;
  const title = `${teamName} Tombstone | ${causeOfDeath}`;
  const canonical = absoluteUrl(path);

  return {
    ...pageMetadata({
      title,
      description,
      path,
      image: flagUrl,
    }),
    title,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName,
      type: "article",
      images: [
        {
          url: flagUrl,
          width: 160,
          height: 120,
          alt: `${teamName} flag`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [flagUrl],
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl(),
    description: defaultDescription,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/feed")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function tombstoneJsonLd({
  shareSlug,
  teamName,
  causeOfDeath,
  epitaph,
  buriedBy,
  createdAt,
  flagUrl,
}: {
  shareSlug: string;
  teamName: string;
  causeOfDeath: string;
  epitaph: string;
  buriedBy: string;
  createdAt: string;
  flagUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${teamName} Tombstone`,
    description: `Cause of death: ${causeOfDeath}. Epitaph: ${epitaph}`,
    url: absoluteUrl(`/tombstone/${shareSlug}`),
    datePublished: createdAt,
    dateModified: createdAt,
    image: flagUrl,
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: siteUrl(),
    },
    author: {
      "@type": "Person",
      name: buriedBy,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
    about: {
      "@type": "SportsTeam",
      name: teamName,
    },
  };
}

export function serializeJsonLd(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
