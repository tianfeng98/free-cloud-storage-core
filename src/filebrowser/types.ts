interface ResourceBase {
  name: string;
  size: number;
  modified: string;
  hidden: boolean;
  path: string;
  source: string;
  type: string;
}

export interface ResourceFileDto extends ResourceBase {
  itemType: "file";
  content?: string;
}

export interface ResourceFolderDto extends ResourceBase {
  itemType: "folder";
  files: ItemBase[];
  folders: ItemBase[];
}

export type ResourceDto = ResourceFileDto | ResourceFolderDto;

interface ItemBase {
  name: string;
  size: number;
  modified: string;
  type: string;
  hidden: boolean;
}

export type FileBrowserResponse = {
  status: number;
  data?: ResourceDto | null;
  msg?: string;
};
