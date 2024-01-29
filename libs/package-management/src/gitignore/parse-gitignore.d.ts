/* eslint-disable node/prefer-global/buffer */
/// <reference types="node" />

declare module 'parse-gitignore' {
  export interface GitignoreParseOptions {
    path?: string
    dedupe?: boolean
    unique?: boolean
    formatSection?: (section: GitignoreSection) => string
    ignore?: string[]
    unignore?: string[]
  }

  export interface ParsedGitignoreObject {
    sections: GitignoreSection[]
    patterns: string[]
    path?: string
    input: Buffer
    format: (options?: GitignoreParseOptions) => string
    dedupe: (options?: GitignoreParseOptions) => ParsedGitignoreObject
    globs: (options?: GitignoreParseOptions) => GitignoreGlobResult[]
  }

  interface GitignoreSection {
    name: string
    comment: string
    patterns: string[]
  }

  interface GitignoreGlobResult {
    type: 'ignore' | 'unignore'
    path: string | null
    patterns: string[]
    index: number
  }

  interface GitignoreParseFunction {
    (input: string, options?: GitignoreParseOptions): ParsedGitignoreObject
    file(filepath: string, options?: GitignoreParseOptions): ParsedGitignoreObject
    parse(input: string, options?: GitignoreParseOptions): ParsedGitignoreObject
    dedupe(input: string, options?: GitignoreParseOptions): ParsedGitignoreObject
    format(input: string, options?: GitignoreParseOptions): string
    globs(input: string, options?: GitignoreParseOptions): GitignoreGlobResult[]
    formatSection(section?: GitignoreSection): string
    patterns(input: string): string[]
  }

  const parse: GitignoreParseFunction

  export default parse
}
