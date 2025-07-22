import type { FCSFile, FCSFolder, FCSItem } from "@/types";
import { load as loadHtml } from "cheerio";
import { join } from "path-browserify";
import type { CTAPIDto, CTFolderDto } from "./types";
import { ctJsonApi } from "./utils";

export const getCTFolder = async (
  pw: string,
  d: string,
  fcsFile: FCSFile
): Promise<FCSFolder | null> => {
  const fileInfo = await ctJsonApi<{ file: CTFolderDto }>("getdir.php", {
    path: "d",
    d,
    passcode: pw,
  });
  if (fileInfo.code !== 200) {
    return null;
  }
  const {
    file: { url, folder_name, folder_time },
  } = fileInfo;
  const apiDto = await ctJsonApi<CTAPIDto>(url);
  if (!apiDto) {
    return null;
  }
  const items = apiDto.aaData.map<FCSItem>(
    ([_, titleHtml, fileSize, updateTime]) => {
      const $ = loadHtml(titleHtml);
      const name = $("a").first().text();
      const path = join(fcsFile.path, name);
      if (fileSize !== "- -") {
        return {
          itemType: "file",
          path,
          name,
          size: +fileSize,
          modified: updateTime,
          type: "blob",
          content: "",
          hidden: false,
          source: fcsFile.source,
        };
      }
      return {
        itemType: "folder",
        path,
        name,
        size: -1,
        extension: "",
        modified: updateTime,
        type: "directory",
        hidden: false,
        source: fcsFile.source,
        files: [],
        folders: [],
      };
    }
  );

  return {
    path: fcsFile.path,
    name: folder_name,
    size: -1,
    modified: folder_time,
    type: "directory",
    itemType: "folder",
    hidden: false,
    source: fcsFile.source,
    files: items.filter((item) => item.itemType === "file"),
    folders: items.filter((item) => item.itemType === "folder"),
  };
};
