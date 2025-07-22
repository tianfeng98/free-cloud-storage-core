export type CTAPIResponse<T> = T & {
  code: number;
};

export interface CTFileDto {
  follow_link: string;
  forceApp: boolean;
  xtredirect: string;
  openInBrowser: string;
  popad: number;
  is_userself: number;
  link_protected: number;
  file_name: string;
  file_size: string;
  file_time: string;
  file_views: number;
  username: string;
  email: string;
  page_title: string;
  reg_url: string;
  login_url: string;
  home_url: string;
  web_url: string;
  file_dir: string;
  userid: number;
  file_id: number;
  free_speed: string;
  software_speed: string;
  vip_speed: string;
  my_uid: number;
  is_guest: boolean;
  my_username: string;
  is_mb: number;
  doubleclick_url: string;
  file_chk: string;
  groups_price: Record<string, number>;
}

export interface CTFileDownloadDto {
  xhr: boolean;
  downurl: string;
  pop: number;
  file_size: number;
  confirm_url: string;
  file_name: string;
}

export interface CTFolderDto {
  follow_link: string;
  xtredirect: string;
  openInBrowser: string;
  forceApp: boolean;
  code: number;
  userid: number;
  folder_id: number;
  file_chk: string;
  folder_name: string;
  folder_time: string;
  username: string;
  is_mb: number;
  email: string;
  my_uid: number;
  my_username: string;
  is_vip: null;
  url: string;
  doubleclick_url: string;
  page_title: string;
  dir_has_annocement: number;
  reg_url: string;
  login_url: string;
  home_url: string;
  web_url: string;
}

export interface CTAPIDto {
  sEcho: number;
  iTotalRecords: number;
  iTotalDisplayRecords: number;
  aaData: [string, string, string, string][];
}
