declare module 'vcard-parser' {
  export interface VCard {
    [key: string]: string | string[] | undefined
  }

  export interface ParseResult {
    [key: string]: VCard
  }

  function parse(vcardString: string): ParseResult
  export default { parse }
}

