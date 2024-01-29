import { describe, it, expect } from "vitest";
import { importer } from "@/module";

describe("importer", () => {
  it("successfully imports a package", async () => {
    const [package1] = await importer([() => import("@antfu/install-pkg")]);

    expect(package1).toHaveProperty("installPackage");
  });
});
