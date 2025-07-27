import {
  type FCSFile,
  type FCSItem,
  type FCSResponse,
  type JSONLinkFile,
} from "@/types";
import { resolve } from "path-browserify";
import { FileBrowser, type FileBrowserOptions } from "../filebrowser";
import {
  CTFileProvider,
  LanzouProvider,
  type Provider,
  type ProviderInput,
} from "../provider";

export interface CloudStorageOptions {
  fileBrowser: FileBrowserOptions | FileBrowser;
  /**
   * 远程文件扩展名
   */
  remoteFileExtension?: string;
}

export class CloudStorage {
  private fileBrowser: FileBrowser;
  private remoteFileExtension: string = ".jsonlink";
  private providerMap = new Map<string, Provider>([
    ["lanzou", new LanzouProvider()],
    ["ctfile", new CTFileProvider()],
  ]);

  constructor({ fileBrowser, remoteFileExtension }: CloudStorageOptions) {
    if (fileBrowser instanceof FileBrowser) {
      this.fileBrowser = fileBrowser;
    } else {
      this.fileBrowser = new FileBrowser(fileBrowser);
    }
    if (remoteFileExtension) {
      this.remoteFileExtension = remoteFileExtension;
    }
  }

  registerProvider(name: string, provider: Provider) {
    this.providerMap.set(name, provider);
  }

  async getResources(
    source: string,
    ...pathList: string[]
  ): Promise<FCSResponse> {
    const { localPathList } = this.parsePathList(...pathList);
    const resourceInfo = await this.parseResourceInfo(source, ...localPathList);
    if (resourceInfo.type === "error") {
      return {
        status: resourceInfo.status,
        msg: resourceInfo.msg,
      };
    }
    if (resourceInfo.type === "local") {
      return {
        status: 200,
        data: resourceInfo.resources,
      };
    }
    const provider = this.providerMap.get(resourceInfo.providerInput.provider);
    if (!provider) {
      return {
        status: 404,
        msg: `Provider ${resourceInfo.providerInput.provider} is not found`,
      };
    }
    const data = await provider.getResources(
      resourceInfo.providerInput,
      resourceInfo.resources
    );
    return {
      status: 200,
      data,
    };
  }

  async getBlob(
    source: string,
    ...pathList: string[]
  ): Promise<globalThis.Response> {
    const { localPathList } = this.parsePathList(...pathList);
    const pathStr = resolve("/", ...localPathList);
    const resourceInfo = await this.parseResourceInfo(source, ...localPathList);
    if (!resourceInfo) {
      const text = `Resource ${pathStr} not found`;
      return new Response(text, {
        status: 404,
        statusText: text,
      });
    }
    if (resourceInfo.type === "error") {
      return new Response(resourceInfo.msg, {
        status: resourceInfo.status,
        statusText: resourceInfo.msg,
      });
    }
    if (resourceInfo.type === "local") {
      return this.fileBrowser.getBlob(source, pathStr);
    }
    const provider = this.providerMap.get(resourceInfo.providerInput.provider);
    if (!provider) {
      const text = `Provider ${resourceInfo.providerInput.provider} not found`;
      return new Response(text, {
        status: 404,
        statusText: text,
      });
    }
    return provider.getBlob(resourceInfo.providerInput, resourceInfo.resources);
  }

  private async parseResourceInfo(
    source: string,
    ...pathList: string[]
  ): Promise<
    | { type: "local"; resources: FCSItem }
    | { type: "remote"; resources: FCSFile; providerInput: ProviderInput }
    | { type: "error"; status: number; msg?: string }
  > {
    let pathStr = resolve("/", ...pathList);
    let result: FCSResponse | null = null;
    if (!pathStr.endsWith(this.remoteFileExtension)) {
      result = await this.fileBrowser.getResources(source, pathStr);
      if (result.status === 200) {
        if (result.data) {
          return {
            type: "local",
            resources: result.data,
          };
        }
        return {
          type: "error",
          status: 404,
          msg: "File not found",
        };
      }
      if (result.status !== 404) {
        return {
          type: "error",
          status: result.status,
          msg: result.msg,
        };
      }
      pathStr = `${pathStr}${this.remoteFileExtension}`;
    }
    result = await this.fileBrowser.getResources(source, pathStr, true);
    if (result.status === 200) {
      if (!result.data) {
        return {
          type: "error",
          status: 404,
          msg: "File not found",
        };
      }
      if (result.data.itemType === "folder") {
        return {
          type: "local",
          resources: result.data,
        };
      }
      if (!result.data.content) {
        return {
          type: "error",
          status: 404,
          msg: "JsonLinkFile is empty",
        };
      }
      let jsonLinkFile: JSONLinkFile | null = null;
      try {
        jsonLinkFile = JSON.parse(result.data.content);
        if (jsonLinkFile) {
          const { url, pw: pwd, ...otherParams } = jsonLinkFile;
          const { searchParams } = new URL(url);
          const pw =
            pwd ||
            ["passowrd", "pwd", "pw", "p"]
              .map((p) => searchParams.get(p))
              .filter(Boolean)
              .at(0) ||
            "";
          return {
            type: "remote",
            resources: result.data,
            providerInput: {
              url,
              pw,
              ...otherParams,
            },
          };
        }
        return {
          type: "error",
          status: 404,
          msg: "JsonLinkFile is empty",
        };
      } catch (e) {
        return {
          type: "error",
          status: 500,
          msg: `JsonLinkFile is not a valid JSON: ${e}`,
        };
      }
    }
    return {
      type: "error",
      status: result.status,
      msg: result.msg,
    };
  }

  private parsePathList(...pathList: string[]) {
    const pathAtomList = pathList.flatMap((p) => p.split("/")).filter(Boolean);
    const remoteFileIndex = pathAtomList.findIndex((p) =>
      p.endsWith(this.remoteFileExtension)
    );
    if (remoteFileIndex > -1) {
      return {
        localPathList: pathAtomList.slice(0, remoteFileIndex + 1),
        remotePathList: pathAtomList.slice(remoteFileIndex + 2),
      };
    }
    return {
      localPathList: pathAtomList,
      remotePathList: [],
    };
  }
}
