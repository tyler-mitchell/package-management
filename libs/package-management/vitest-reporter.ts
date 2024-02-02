import type { Reporter, Vitest, File } from "vitest";
import { ReportersMap } from "vitest/reporters";

export default class DebugReporter extends ReportersMap.basic {
  isTTY = false;
  // @ts-ignore
  reportSummary(files: File[], errors: unknown[]) {
    // return super.reportSummary(files, errors);
  }
}
