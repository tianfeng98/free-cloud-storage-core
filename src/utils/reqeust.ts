const randIP = () => {
  const r = () => Math.round(Math.random() * (2550000 - 600000) + 600000) % 256;

  const ip2id = r(); // 获取 0-255 之间的值
  const ip3id = r(); // 获取 0-255 之间的值
  const ip4id = r(); // 获取 0-255 之间的值
  const arr_1 = [
    "218",
    "218",
    "66",
    "66",
    "218",
    "218",
    "60",
    "60",
    "202",
    "204",
    "66",
    "66",
    "66",
    "59",
    "61",
    "60",
    "222",
    "221",
    "66",
    "59",
    "60",
    "60",
    "66",
    "218",
    "218",
    "62",
    "63",
    "64",
    "66",
    "66",
    "122",
    "211",
  ];
  const randIndex = Math.floor(Math.random() * arr_1.length);
  const ip1id = arr_1[randIndex];
  return `${ip1id}.${ip2id}.${ip3id}.${ip4id}`;
};

const createBaseHeaders = (
  pageUrl?: string
): globalThis.RequestInit["headers"] => {
  const ip = randIP();
  const baseHeaders: RequestInit["headers"] = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Accept:
      "application/json, text/javascript,text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    Cookie: "codelen=1; pc_ad1=1",
    "X-Forwarded-For": ip,
    "CLIENT-IP": ip,
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
