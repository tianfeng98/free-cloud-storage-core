/**
 * 成通网盘
 * https://home.ctfile.com/
 */
import type { FCSFile, FCSItem } from "@/types";
import { basename, dirname } from "path-browserify";
import { type Provider, type ProviderInput } from "../types";
import { getCTFile, paresCTFile } from "./file";
import { getCTFolder } from "./folder";

export class CTFileProvider implements Provider {
  async getResources(
    { url, pw = "" }: ProviderInput,
    source: FCSFile
  ): Promise<FCSItem | null> {
    const { pathname } = new URL(url);
    const path = dirname(pathname);
    if (path === "/f") {
      const f = basename(pathname);
      return getCTFile(pw, f, source);
    }
    if (path === "/d") {
      const d = basename(pathname);
      return getCTFolder(pw, d, source);
    }
    return null;
  }

  async getBlob(
    { url, pw = "" }: ProviderInput,
    source: FCSFile
  ): Promise<globalThis.Response> {
    if (source.content) {
      return Response.redirect(source.content, 302);
    }
    const { pathname } = new URL(url);
    const path = dirname(pathname);
    if (path === "f") {
      const f = basename(pathname);
      const res = await paresCTFile(pw, f);
      if (res) {
        return Response.redirect(res.downloadUrl, 302);
      }
    }
    return new Response("Not Found", {
      status: 404,
      statusText: "Not Found",
    });
  }
}
