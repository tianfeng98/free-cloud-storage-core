import { browserFetch } from "@/utils";
import type { CTAPIResponse } from "./types";

const ctOrigin = "https://webapi.ctfile.com";

export const ctJsonApi = async <T>(
  api: string,
  params?: Record<string, string>
): Promise<CTAPIResponse<T>> => {
  let urlObj: URL;
  if (api.startsWith("/")) {
    urlObj = new URL(ctOrigin + api);
  } else {
    urlObj = new URL(ctOrigin);
    urlObj.pathname = api;
  }
  if (params) {
    urlObj.search = new URLSearchParams(params).toString();
  }
  const res = await browserFetch(urlObj.toString());
  return res.json() as Promise<CTAPIResponse<T>>;
};
