import { useEffect } from 'react';
import {
    DEFAULT_DESCRIPTION,
    DEFAULT_IMAGE,
    DEFAULT_KEYWORDS,
    DEFAULT_TITLE,
    SITE_NAME,
    SITE_TWITTER,
    SITE_URL,
} from '../seo';

type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

type SeoProps = {
    title?: string;
    description?: string;
    path?: string;
    image?: string;
    type?: 'website' | 'article' | 'event';
    noIndex?: boolean;
    keywords?: string;
    jsonLd?: JsonLd;
};

function isAbsoluteUrl(value: string) {
    return /^https?:\/\//i.test(value);
}

function resolveUrl(value: string, base: string) {
    if (!value) return '';
    if (isAbsoluteUrl(value)) return value;
    if (!base) return value;
    const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const suffix = value.startsWith('/') ? value : `/${value}`;
    return `${trimmedBase}${suffix}`;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
    if (!content) return;
    const selector = `meta[${attr}="${key}"]`;
    let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
    if (!href) return;
    const selector = `link[rel="${rel}"]`;
    let tag = document.head.querySelector(selector) as HTMLLinkElement | null;
    if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', rel);
        document.head.appendChild(tag);
    }
    tag.setAttribute('href', href);
}

export default function Seo({
    title,
    description,
    path,
    image,
    type = 'website',
    noIndex,
    keywords,
    jsonLd,
}: SeoProps) {
    useEffect(() => {
        const baseUrl = SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
        const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
        const pageDescription = description || DEFAULT_DESCRIPTION;
        const pageImage = resolveUrl(image || DEFAULT_IMAGE, baseUrl);
        const canonicalUrl = path
            ? resolveUrl(path, baseUrl)
            : (typeof window !== 'undefined' ? window.location.href : baseUrl);

        document.title = pageTitle;

        upsertMeta('name', 'description', pageDescription);
        upsertMeta('name', 'keywords', keywords || DEFAULT_KEYWORDS);
        upsertMeta('name', 'robots', noIndex ? 'noindex,nofollow' : 'index,follow');

        upsertMeta('property', 'og:site_name', SITE_NAME);
        upsertMeta('property', 'og:title', pageTitle);
        upsertMeta('property', 'og:description', pageDescription);
        upsertMeta('property', 'og:type', type);
        if (canonicalUrl) upsertMeta('property', 'og:url', canonicalUrl);
        if (pageImage) upsertMeta('property', 'og:image', pageImage);

        upsertMeta('name', 'twitter:card', 'summary_large_image');
        upsertMeta('name', 'twitter:title', pageTitle);
        upsertMeta('name', 'twitter:description', pageDescription);
        if (SITE_TWITTER) upsertMeta('name', 'twitter:site', SITE_TWITTER);
        if (pageImage) upsertMeta('name', 'twitter:image', pageImage);

        if (canonicalUrl) upsertLink('canonical', canonicalUrl);

        const existing = document.head.querySelector('script[data-seo="ld-json"]') as HTMLScriptElement | null;
        if (jsonLd) {
            const script = existing ?? document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-seo', 'ld-json');
            script.textContent = JSON.stringify(jsonLd);
            if (!existing) document.head.appendChild(script);
        } else if (existing) {
            existing.remove();
        }
    }, [title, description, path, image, type, noIndex, keywords, jsonLd]);

    return null;
}
