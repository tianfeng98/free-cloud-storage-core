import {
  type ResourceFileDto as FCSFile,
  type ResourceFolderDto as FCSFolder,
  type ResourceDto as FCSItem,
  type FileBrowserResponse as FCSResponse,
} from "@/filebrowser/types";

export interface JSONLinkFile {
  url: string;
  pw?: string;
  provider: string;
}

export type { FCSFile, FCSFolder, FCSItem, FCSResponse };
