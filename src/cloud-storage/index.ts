import { type FCSFile, type FCSItem, type JSONLinkFile } from "@/types";
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
  ): Promise<FCSItem | null> {
    const { localPathList } = this.parsePathList(...pathList);
    const resourceInfo = await this.parseResourceInfo(source, ...localPathList);
    if (!resourceInfo) {
      return null;
    }
    if (resourceInfo.type === "local") {
      return resourceInfo.resources;
    }
    const provider = this.providerMap.get(resourceInfo.providerInput.provider);
    if (!provider) {
      return null;
    }
    return provider.getResources(
      resourceInfo.providerInput,
      resourceInfo.resources
    );
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
    | null
  > {
    let pathStr = resolve("/", ...pathList);
    let resources: FCSItem | null = null;
    if (!pathStr.endsWith(this.remoteFileExtension)) {
      resources = await this.fileBrowser.getResources(source, pathStr);
      if (resources) {
        return {
          type: "local",
          resources,
        };
      }
      pathStr = `${pathStr}${this.remoteFileExtension}`;
    }
    resources = await this.fileBrowser.getResources(source, pathStr, true);
    if (resources && resources.itemType !== "folder" && resources.content) {
      let jsonLinkFile: JSONLinkFile | null = null;
      try {
        jsonLinkFile = JSON.parse(resources.content);
        if (jsonLinkFile) {
          const { url, pw: pwd, ...otherParams } = jsonLinkFile;
          const { searchParams } = new URL(url);
          const pw =
            pwd ||
            ["p", "pw", "pwd", "passowrd"]
              .map((p) => searchParams.get(p))
              .filter(Boolean)
              .at(0) ||
            "";
          return {
            type: "remote",
            resources,
            providerInput: {
              url,
              pw,
              ...otherParams,
            },
          };
        }
      } catch (e) {
        console.error("Parse jsonLinkFile error", e);
      }
    }
    return null;
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
