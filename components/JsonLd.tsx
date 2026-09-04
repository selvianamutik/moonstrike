import { headers } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.moonstrike.pro";

type JsonLdProps = {
  type: "website" | "game-page" | "service-page";
  gameName?: string;
  gameSlug?: string;
  serviceTitle?: string;
  serviceDescription?: string;
  serviceImage?: string;
  categoryName?: string;
  breadcrumbs?: { name: string; href: string }[];
};

function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        url: BASE_URL,
        name: "Moon Strike",
        description:
          "Moon Strike helps gamers order boosting, coaching, and item services through a premium cosmic marketplace.",
        publisher: { "@id": `${BASE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${BASE_URL}/services?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "Moon Strike",
        url: BASE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${BASE_URL}/logo/logo.png`,
          width: 180,
          height: 60,
        },
        description:
          "Premium game boosting, coaching, and item services marketplace for competitive gamers.",
      },
    ],
  };
}

function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.name,
        item: item.href.startsWith("http") ? item.href : `${BASE_URL}${item.href}`,
      })),
    ],
  };
}

function serviceJsonLd({
  serviceTitle,
  serviceDescription,
  serviceImage,
  gameName,
  gameSlug,
  categoryName,
}: JsonLdProps) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: serviceTitle,
    description: serviceDescription,
    image: serviceImage,
    brand: {
      "@type": "Brand",
      name: "Moon Strike",
    },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Moon Strike",
      },
    },
    category: categoryName,
    additionalProperty: gameName
      ? [{ "@type": "PropertyValue", name: "Game", value: gameName }]
      : undefined,
  };
}

export function JsonLd(props: JsonLdProps) {
  const schemas: object[] = [];

  // Always include WebSite + Organization on the root
  if (props.type === "website") {
    schemas.push(websiteJsonLd());
  }

  // Breadcrumbs
  if (props.breadcrumbs && props.breadcrumbs.length > 0) {
    schemas.push(breadcrumbJsonLd(props.breadcrumbs));
  }

  // Service/Product schema
  if (props.type === "service-page" && props.serviceTitle) {
    schemas.push(serviceJsonLd(props));
  }

  if (schemas.length === 0) return null;

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
