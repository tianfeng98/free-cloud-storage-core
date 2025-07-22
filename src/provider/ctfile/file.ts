import type { FCSFile } from "@/types";
import type { CTFileDownloadDto, CTFileDto } from "./types";
import { ctJsonApi } from "./utils";

export const paresCTFile = async (pw: string, f: string) => {
  const fileInfo = await ctJsonApi<{ file: CTFileDto }>("getfile.php", {
    path: "f",
    f,
    passcode: pw,
  });
  if (fileInfo.code !== 200) {
    return null;
  }
  const {
    file: { userid, file_chk, file_id },
  } = fileInfo;
  let downloadUrl = "";
  const fileUrlDto = await ctJsonApi<CTFileDownloadDto>("get_file_url.php", {
    uid: userid.toString(),
    fid: file_id.toString(),
    file_chk,
  });
  if (fileUrlDto) {
    downloadUrl = fileUrlDto.downurl;
  }
  return {
    downloadUrl,
    ...fileInfo.file,
  };
};

export const getCTFile = async (
  pw: string,
  f: string,
  source: FCSFile
): Promise<FCSFile | null> => {
  const res = await paresCTFile(pw, f);
  if (!res) {
    return null;
  }
  const { file_name, file_size, file_time, downloadUrl } = res;

  return {
    path: source.path,
    name: file_name,
    size: +file_size,
    modified: file_time,
    type: "blob",
    content: downloadUrl,
    itemType: "file",
    hidden: false,
    source: source.source,
  };
};
