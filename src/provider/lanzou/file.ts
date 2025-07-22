import { browserFetch } from "@/utils";
import { load as loadHtml, type CheerioAPI } from "cheerio";
import type { LanzouResponseDto, ParseFunctionProps } from "./type";
import { getLanzouFileResult } from "./utils";

const getParamsFromNoPwdHtml = async (html: string, url: string) => {
  const $ = loadHtml(html);
  let signValue = "";
  const dft = { action: "downprocess", kd: 1 };
  //不需要密码的情况
  let key = $(".n_downlink").attr("src");

  const urlObj = new URL(url);

  const subPageResponse = await browserFetch(`${urlObj.origin}${key}`, {});
  const subhtml = await subPageResponse.text();
  const $2 = loadHtml(subhtml);

  $2("script").each((index, element) => {
    const scriptContent = $2(element).html();
    const signMatch = scriptContent?.match(/'sign':'(.*?)'/);
    if (signMatch) {
      signValue = signMatch[1];
    }
  });
  return { ...dft, signs: "?ctdf", sign: signValue };
};

const parseFileInfo = ($: CheerioAPI) => {
  const title = $("title").text() || "";
  const description = $('meta[name="description"]').attr("content") || "";
  const fileName = $(".n_box_3fn").text().trim() || "";
  const fileSize = $(".n_filesize").text().replace("大小：", "").trim() || "";
  const uploadTime =
    $(".n_file_info .n_file_infos").first().text().trim() || "";
  const uploader = $(".user-name").text().trim() || "";
  const file =
    $("a.n_login")
      .attr("href")
      ?.match(/f=(\d+)/)?.[1] || "";
  const src = $(".filename img").attr("src") || "";
  const userIconStyle = $(".user-ico-img").attr("style") || "";
  let avatarUrl = "";
  const regex = /url\(\s*(['"]?)(https?:\/\/[^\s'"]+)\1\s*\)/;
  const match = userIconStyle.match(regex);
  if (match && match[2]) {
    avatarUrl = match[2];
  }
  return {
    file,
    title,
    description,
    fileName,
    fileSize,
    uploadTime,
    uploader,
    src,
    avatarUrl,
  };
};

export const getFileResponse = async ({
  pw,
  scriptCode,
  url,
  $,
}: ParseFunctionProps): Promise<LanzouResponseDto | null> => {
  try {
    const { fileSize, uploadTime, fileName: _fileName } = parseFileInfo($);
    let downloadUrl = "";
    let fileName = _fileName;

    const res = await getLanzouFileResult(url, scriptCode, {
      staticParamKeys: ["action", "kd", "sign"],
      extraParams: { p: pw },
    });

    if (res) {
      downloadUrl = res.downloadUrl;
      fileName = res.lanzouFileDto.inf;
    }

    return {
      type: "file",
      uploadTime,
      file: {
        url: downloadUrl,
        fileSize,
        fileName,
        uploadTime,
      },
    };
  } catch (error) {
    return null;
  }
};
