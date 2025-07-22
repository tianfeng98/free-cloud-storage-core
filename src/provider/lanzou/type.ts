import type { CheerioAPI } from "cheerio";

export enum LanzouAPI {
  FILE = "/ajaxm.php",
  FOLDER = "/filemoreajax.php",
}

export interface FileResultDto {
  /**
   * 0 失败 1 成功
   */
  zt: number;
  dom: string;
  url: string;
  inf: string;
}

export interface FolderResultDto {
  /**
   * 0 失败 1 成功
   */
  zt: number;
  info: string;
  text: {
    icon: string;
    t: number;
    id: string;
    name_all: string;
    size: string;
    time: string;
    duan: string;
    p_ico: number;
  }[];
}

export interface LanzouFile {
  url: string;
  fileName: string;
  fileSize: string;
  uploadTime: string;
}

export interface ParseFunctionProps {
  pw: string;
  url: string;
  scriptCode: string;
  $: CheerioAPI;
}

export type LanzouResponseDto =
  | {
      type: "file";
      uploadTime: string;
      file: LanzouFile;
    }
  | {
      type: "folder";
      uploadTime: string;
      files: LanzouFile[];
    };
