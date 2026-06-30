import type { Metadata } from "next";

const siteName = "AI Article Summarizer";
const defaultTitle = "AI Article Summarizer";
const defaultDescription =
  "粘贴文章 URL，快速生成一句话、短摘要和详细摘要，适合研究、阅读和知识管理工作流。";
const defaultOgImage = "/opengraph-image";

/**
 * Builds consistent route metadata with canonical URLs and social previews.
 */
export function createPageMetadata({
  title = defaultTitle,
  description = defaultDescription,
  path = "/",
  image = defaultOgImage,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
} = {}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${title} 社交分享图`,
        },
      ],
      locale: "zh_CN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export { defaultDescription, defaultOgImage, defaultTitle, siteName };
