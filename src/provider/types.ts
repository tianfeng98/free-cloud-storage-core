import { type FCSFile, type FCSItem, type JSONLinkFile } from "@/types";

export interface ProviderInput extends JSONLinkFile {
  pw: string;
}

export interface Provider {
  getResources(
    jsonLinkFile: ProviderInput,
    source: FCSFile
  ): FCSItem | null | Promise<FCSItem | null>;
  getBlob(
    jsonLinkFile: ProviderInput,
    fcsFile: FCSFile
  ): globalThis.Response | Promise<globalThis.Response>;
}
