const createBaseHeaders = (
  pageUrl?: string
): globalThis.RequestInit["headers"] => {
  const baseHeaders: RequestInit["headers"] = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Accept:
      "application/json, text/javascript,text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  if (pageUrl) {
    const urlObj = new URL(pageUrl);
    baseHeaders.Referer = pageUrl;
    baseHeaders.Origin = urlObj.origin;
    baseHeaders.Host = urlObj.host;
  }

  return baseHeaders;
};

export type BrowserFetchInput = string | globalThis.URL | globalThis.Request;
export interface BrowserFetchOptions extends globalThis.RequestInit {
  pageUrl?: string;
}

export const browserFetch = async (
  input: BrowserFetchInput,
  { pageUrl, headers, ...otherOptions }: BrowserFetchOptions = {}
) =>
  globalThis.fetch(input, {
    headers: {
      ...createBaseHeaders(pageUrl),
      ...headers,
    },
    ...otherOptions,
  });
