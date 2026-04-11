export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export class ClaudeApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ClaudeApiError";
  }
}

export class ClaudeParseError extends Error {
  constructor(
    message: string,
    public readonly rawResponse: string,
  ) {
    super(message);
    this.name = "ClaudeParseError";
  }
}

export class ParseUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseUrlError";
  }
}
