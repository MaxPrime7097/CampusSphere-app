declare module "pdf-parse" {
  export interface PDFParseOptions {
    data?: Buffer | Uint8Array;
    url?: string;
    [key: string]: any;
  }

  export interface PDFTextResult {
    text: string;
    total?: number;
    pages?: Array<{ text: string; num: number }>;
    [key: string]: any;
  }

  export class PDFParse {
    constructor(options: PDFParseOptions);
    getText(options?: any): Promise<PDFTextResult>;
    destroy(): Promise<void>;
    [key: string]: any;
  }

  const pdf: any;
  export default pdf;
}
