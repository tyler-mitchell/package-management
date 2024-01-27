import { describe, it, expect } from "vitest";
import { importer } from "../importer";

describe("test", () => {
  it("successfully imports a package", async () => {
    const [package1] = await importer([import("@antfu/install-pkg")]);

    expect(package1).toHaveProperty("installPackage");
  });
});
