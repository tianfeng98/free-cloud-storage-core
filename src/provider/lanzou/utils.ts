import { browserFetch, extractParamValuesFromApi } from "@/utils";
import { load as loadHtml, type CheerioAPI } from "cheerio";
import { LanzouAPI, type FileResultDto } from "./type";

export const fetchHtml = (
  input: string | URL | globalThis.Request,
  init?: RequestInit
) => fetch(input, init).then((res) => res.text());

export const getApiScriptCode = (html: string | CheerioAPI, api: string) => {
  const $ = typeof html === "string" ? loadHtml(html) : html;
  let apiScript = "";
  $("script").each((index, element) => {
    const scriptContent = $(element).html();
    if (
      scriptContent &&
      scriptContent.length > 100 &&
      scriptContent.includes(api)
    ) {
      apiScript = scriptContent;
    }
  });
  return apiScript;
};

export const getLanzouFileResult = async (
  url: string,
  scriptCode: string,
  {
    staticParamKeys,
    extraParams,
  }: {
    staticParamKeys?: string[];
    extraParams?: Record<string, any>;
  } = {}
) => {
  const api = LanzouAPI.FILE;
  let params: Record<string, any> = { ...extraParams };

  const { params: staticParams, apiUrl } = extractParamValuesFromApi(
    scriptCode,
    api,
    staticParamKeys
  );
  params = {
    ...params,
    ...staticParams,
  };

  const { origin } = new URL(url);
  const urlObj = new URL(origin);

  urlObj.pathname = api;
  const fileId = new URL(origin + apiUrl).searchParams.get("file");
  if (fileId) {
    urlObj.searchParams.set("file", fileId);
  }

  // POST 请求
  const postResponse = await browserFetch(urlObj.toString(), {
    method: "POST",
    body: new URLSearchParams(params),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const resData = (await postResponse.json()) as FileResultDto;

  if (resData.zt !== 1) {
    throw new Error(resData.inf);
  }

  return {
    lanzouFileDto: resData,
    downloadUrl: `${resData.dom}/file/${resData.url}`,
  };
};
