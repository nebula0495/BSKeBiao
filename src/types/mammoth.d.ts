declare module 'mammoth' {
  interface MammothResult {
    value: string
    messages: { type: string; message: string }[]
  }

  interface MammothOptions {
    arrayBuffer: ArrayBuffer
  }

  function convertToHtml(options: MammothOptions): Promise<MammothResult>
  function extractRawText(options: MammothOptions): Promise<MammothResult>
  function convertToMarkdown(options: MammothOptions): Promise<MammothResult>

  export { convertToHtml, extractRawText, convertToMarkdown }
}
