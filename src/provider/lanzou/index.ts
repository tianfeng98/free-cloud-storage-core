/**
 * 蓝奏云
 * https://pc.woozooo.com/
 */

import type { FCSFile, FCSItem } from "@/types";
import { load as loadHtml } from "cheerio";
import { join } from "path-browserify";
import { type Provider, type ProviderInput } from "../types";
import { getFileResponse } from "./file";
import { getFolderResponse } from "./folder";
import { LanzouAPI, type LanzouFile, type ParseFunctionProps } from "./type";
import { fetchHtml, getApiScriptCode } from "./utils";

const fileSizeUnitMap: Record<string, number> = {
  B: 1,
  K: 1024,
  KB: 1024,
  M: 1024 * 1024,
  MB: 1024 * 1024,
  G: 1024 * 1024 * 1024,
  GB: 1024 * 1024 * 1024,
};

const convertLanzouFile2FCSFile = (
  file: LanzouFile,
  { path, source }: Pick<FCSFile, "path" | "source">
): FCSFile => {
  const { fileName, fileSize, uploadTime, url } = file;
  const [sizeStr, unit] = fileSize.split(" ").filter(Boolean);
  const size = +sizeStr * fileSizeUnitMap[unit.toUpperCase()];
  return {
    path,
    name: fileName,
    size,
    modified: uploadTime,
    type: "blob",
    content: url,
    itemType: "file",
    hidden: false,
    source,
  };
};

const parseLanzouInfo = async ({ url, pw }: ProviderInput) => {
  const html = await fetchHtml(url);
  const $ = loadHtml(html);
  const props: Omit<ParseFunctionProps, "scriptCode"> = {
    url,
    pw,
    $,
  };
  const fileScriptCode = getApiScriptCode(html, LanzouAPI.FILE);
  if (fileScriptCode) {
    return getFileResponse({
      ...props,
      scriptCode: fileScriptCode,
    });
  }
  const folderScriptCode = getApiScriptCode(html, LanzouAPI.FOLDER);
  if (folderScriptCode) {
    return await getFolderResponse({
      ...props,
      scriptCode: folderScriptCode,
    });
  }
  return null;
};

export class LanzouProvider implements Provider {
  async getResources(
    input: ProviderInput,
    fcsFile: FCSFile
  ): Promise<FCSItem | null> {
    const lanzouInfo = await parseLanzouInfo(input);
    if (!lanzouInfo) {
      return null;
    }
    if (lanzouInfo.type === "file") {
      return convertLanzouFile2FCSFile(lanzouInfo.file, {
        source: fcsFile.source,
        path: fcsFile.path,
      });
    }
    if (lanzouInfo.type === "folder") {
      const items = lanzouInfo.files.map((file) =>
        convertLanzouFile2FCSFile(file, {
          source: fcsFile.source,
          path: join(fcsFile.path, file.fileName),
        })
      );
      return {
        path: fcsFile.path,
        name: fcsFile.name,
        size: -1,
        modified: lanzouInfo.uploadTime,
        type: "directory",
        itemType: "folder",
        hidden: false,
        source: fcsFile.source,
        files: items.filter((item) => item.itemType === "file"),
        folders: [],
      };
    }
    return null;
  }

  async getBlob(
    input: ProviderInput,
    fcsFile: FCSFile
  ): Promise<globalThis.Response> {
    if (fcsFile.content) {
      return Response.redirect(fcsFile.content, 302);
    }
    const lanzouInfo = await parseLanzouInfo(input);
    if (lanzouInfo && lanzouInfo.type === "file" && lanzouInfo.file.url) {
      return Response.redirect(lanzouInfo.file.url, 302);
    }
    return new Response("Not Found", {
      status: 404,
      statusText: "Not Found",
    });
  }
}
