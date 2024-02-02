import { describe, it, expect } from "vitest";
import { importer } from "@/module";

import { execa } from "execa";
import { Input } from "@sourcegraph/scip-typescript/src/Input";
import * as scip from "@sourcegraph/scip-typescript/src/scip";
import { workspace } from "../workspace/workspace";
import getCurrentLine from "get-current-line";

const project = workspace.getProject("<package_folder>");
export function generateScipFile() {
  execa("");
}

// function readScipFile() {
//   Input.fromFile();
// }

describe.only("scip playground", () => {
  it("demo", async () => {
    // readScipFile();
  });
});

export function getCur() {
  return getCurrentLine({ method: "getCur" });
}
