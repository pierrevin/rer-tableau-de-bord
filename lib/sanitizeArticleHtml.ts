import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "blockquote",
  "code",
  "pre",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "a",
  "img",
  "figure",
  "figcaption",
  "div",
  "span",
  "iframe",
  "hr",
];

const ALLOWED_IFRAME_HOSTNAMES = [
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "datawrapper.dwcdn.net",
];

export function sanitizeArticleHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "name", "target", "rel", "title"],
      img: [
        "src",
        "alt",
        "title",
        "width",
        "height",
        "loading",
        "decoding",
        "referrerpolicy",
        "class",
      ],
      iframe: [
        "src",
        "title",
        "frameborder",
        "allow",
        "allowfullscreen",
        "loading",
        "width",
        "height",
        "referrerpolicy",
      ],
      p: ["class"],
      figure: ["class"],
      div: ["class"],
      span: ["class"],
      blockquote: ["class"],
      pre: ["class"],
      code: ["class"],
      figcaption: ["class"],
    },
    allowedClasses: {
      p: ["chapo", "embed-url", "social-post"],
      figure: ["embed-block"],
      div: ["embed-responsive"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      iframe: ["https"],
    },
    allowedIframeHostnames: ALLOWED_IFRAME_HOSTNAMES,
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    transformTags: {
      a: (tagName, attribs) => {
        const out: Record<string, string> = {};
        if (attribs.href) out.href = attribs.href;
        if (attribs.title) out.title = attribs.title;
        if (attribs.name) out.name = attribs.name;
        out.rel = "noopener noreferrer nofollow";
        if (attribs.target === "_blank") {
          out.target = "_blank";
        }
        return { tagName, attribs: out };
      },
    },
  });
}
