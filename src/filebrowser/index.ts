import { browserFetch } from "@/utils";
import { join } from "path-browserify";
import { type FileBrowserResponse, type ResourceDto } from "./types";

type Auth = { username: string; password: string } | string;

export interface FileBrowserOptions {
  server: string;
  auth: Auth;
  /**
   * 文件根目录，默认 /
   */
  root?: string;
  getCacheJwt?: () => string | Promise<string>;
  setCacheJwt?: (jwt: string) => void | Promise<void>;
}

type APIPath = string | { pathname: string; query?: Record<string, string> };

export class FileBrowser {
  private server: string;
  private auth: Auth;
  private root = "/";
  private getCacheJwt?: () => string | Promise<string>;
  private setCacheJwt?: (jwt: string) => void | Promise<void>;
  constructor({
    server,
    auth,
    root,
    getCacheJwt,
    setCacheJwt,
  }: FileBrowserOptions) {
    this.server = server;
    this.auth = auth;
    if (root) {
      this.root = root;
    }
    if (getCacheJwt) {
      this.getCacheJwt = getCacheJwt;
    }
    if (setCacheJwt) {
      this.setCacheJwt = setCacheJwt;
    }
  }

  private async request(api: APIPath, options?: RequestInit) {
    const urlObj = new URL(this.server);
    if (typeof api === "string") {
      urlObj.pathname = api;
    } else {
      const { pathname, query } = api;
      urlObj.pathname = pathname;
      if (query) {
        urlObj.search = new URLSearchParams(query).toString();
      }
    }
    return browserFetch(urlObj.toString(), options);
  }

  private async requestWithAuth(
    api: APIPath,
    requestInit: RequestInit = {},
    isAfterAuth = false
  ): Promise<Response> {
    const jwt = await this.getJwt();
    if (!jwt) {
      return new Response("FileBrowser jwt is empty", {
        status: 401,
      });
    }
    const { headers, ...otherInit } = requestInit;
    const res = await this.request(api, {
      headers: {
        cookie: `auth=${jwt}`,
        ...headers,
      },
      ...otherInit,
    });

    const { status } = res;

    if (status >= 200 && status < 400) {
      return res;
    }

    switch (status) {
      case 401:
        if (isAfterAuth) {
          return new Response("FileBrowser Auth failed", {
            status,
          });
        }
        this.setCacheJwt?.("");
        return this.requestWithAuth(api, requestInit, true);
      case 404:
        return new Response("Not Found", { status: 404 });
      default:
        return new Response("Failed to get resources", { status });
    }
  }

  private async getJwt() {
    let jwt = await this.getCacheJwt?.();
    if (jwt) {
      return jwt;
    }
    if (typeof this.auth === "string") {
      jwt = this.auth;
      this.setCacheJwt?.(jwt);
      return jwt;
    }
    if (typeof this.auth === "object") {
      const res = await this.request(
        {
          pathname: "/api/auth/login",
          query: {
            username: this.auth.username,
          },
        },
        {
          method: "POST",
          // body: JSON.stringify(this.auth),
          headers: {
            "x-password": this.auth.password,
          },
        }
      );
      if (res.status !== 200) {
        throw new Error("Login failed");
      }
      jwt = await res.text();
      this.setCacheJwt?.(jwt);
    }
    return jwt;
  }

  getCurrentDir(path: string) {
    return join("/", this.root, path);
  }

  async getResources(
    source: string,
    path: string,
    withContent?: boolean
  ): Promise<FileBrowserResponse> {
    const query: Record<string, string> = {
      path: encodeURIComponent(this.getCurrentDir(path)),
      source,
    };
    if (withContent) {
      query.content = "true";
    }
    const res = await this.requestWithAuth({
      pathname: "/api/resources",
      query,
    });
    if (res.status !== 200) {
      return {
        status: res.status,
        msg: await res.text(),
      };
    }
    const result = (await res.json()) as Omit<ResourceDto, "itemType">;
    return {
      status: res.status,
      data: {
        ...result,
        itemType: result.type === "directory" ? "folder" : "file",
      } as ResourceDto,
    };
  }

  async getBlob(source: string, path: string) {
    return this.requestWithAuth({
      pathname: "/api/raw",
      query: {
        files: `${source}::${this.getCurrentDir(path)}`,
      },
    });
  }
}
