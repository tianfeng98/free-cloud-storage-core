import { browserFetch, extractParamValuesFromApi } from "@/utils";
import { load as loadHtml, type CheerioAPI } from "cheerio";
import {
  LanzouAPI,
  type FolderResultDto,
  type LanzouFile,
  type LanzouResponseDto,
  type ParseFunctionProps,
} from "./type";
import { fetchHtml, getApiScriptCode, getLanzouFileResult } from "./utils";

export const parseFolderFileInfo = ($: CheerioAPI) => {
  const fileName = $("title").text().replace("- 蓝奏云", "").trim() || "";
  const tableRow = $("table td")
    .html()
    ?.split("<br>")
    .map((d) =>
      d
        .replace(/<[^>]*>/g, "")
        .replace(/\n/g, "")
        .trim()
    )
    .filter(Boolean)
    .map((d) => d.split("：").map((d) => d.trim()));
  const fileSize = tableRow?.at(0)?.at(1) || "";
  const uploadTime = tableRow?.at(1)?.at(1) || "";
  return {
    fileName,
    fileSize,
    uploadTime,
  };
};

const getFolderFileInfo = async (url: string): Promise<LanzouFile> => {
  const html = await fetchHtml(url);
  const $ = loadHtml(html);
  const folderFileUrl = $("iframe").attr("src");
  const urlObj = new URL(url);
  const fileUrl = `${urlObj.origin}${folderFileUrl}`;
  const fileHtml = await fetchHtml(fileUrl);
  const scriptCode = getApiScriptCode(fileHtml, LanzouAPI.FILE);
  const { downloadUrl } = await getLanzouFileResult(fileUrl, scriptCode, {
    staticParamKeys: [
      "action",
      "websignkey",
      "signs",
      "sign",
      "websign",
      "kd",
      "ves",
    ],
  });
  const fileInfo = parseFolderFileInfo($);
  return {
    ...fileInfo,
    url: downloadUrl,
  };
};

export const getFolderResponse = async ({
  pw,
  scriptCode,
  url,
  $,
}: ParseFunctionProps): Promise<LanzouResponseDto | null> => {
  const api = LanzouAPI.FOLDER;
  const uploadTime =
    $(".rets")
      .text()
      .trim()
      .replace(/[\u4e00-\u9fa5]/g, "") || "";
  const paramKeys = ["sign", "lx", "fid", "uid", "pg", "rep", "t", "k", "up"];
  const { apiUrl, params } = extractParamValuesFromApi(
    scriptCode,
    api,
    paramKeys
  );
  const urlObj = new URL(new URL(url).origin);
  urlObj.pathname = api;
  const fileId = new URL(urlObj.origin + apiUrl).searchParams.get("file");
  if (fileId) {
    urlObj.searchParams.set("file", fileId);
  }

  // POST 请求
  const postResponse = await browserFetch(urlObj.toString(), {
    method: "POST",
    body: new URLSearchParams({ ...params, pwd: pw }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  try {
    const res = (await postResponse.json()) as FolderResultDto;

    const urls = res.text.map(({ id }) => {
      const u = new URL(url);
      return `${u.origin}/${id}`;
    });

    const folderRes = await Promise.allSettled(urls.map(getFolderFileInfo));
    const files = folderRes
      .filter((d) => d.status === "fulfilled")
      .map((d) => (d as PromiseFulfilledResult<LanzouFile>).value);
    return {
      type: "folder",
      uploadTime,
      files,
    };
  } catch (error) {
    return null;
  }
};
