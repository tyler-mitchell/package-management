import type { ResolvedPromise } from ".";
import type { InstallPackageOptions } from "@antfu/install-pkg";

export interface ImportPackageOption<T = any> {
  /**
   * The name of the package to import. This should match the name used in the import statement.
   */
  name: string;

  /**
   * When enabled, the package will be installed if it is not found
   * @default true
   */
  install?: boolean;

  /**
   * The import statement for the package.
   */
  import: () => ImportStatement<T>;

  /**
   * When enabled, the package will be installed as a dev dependency
   */
  isDevDependency?: boolean;

  /**
   * Additional installation options
   */
  installOptions?: Omit<InstallPackageOptions, "dev">;
}

export type ImportMap = Record<string, ImportOption>;

export type ImportList = ImportOption[];

export type ImportOption<T = any> =
  | ImportStatement<T>
  | (() => ImportStatement<T>)
  | ImportPackageOption<T>;

export type ImportStatement<T = any> = Promise<T>;

export type ResolvedImportOption<T extends ImportOption> = ResolvedPromise<
  ExtractImportStatement<T>
>;

export type ResolvedImportMap<$Imports extends ImportMap> = {
  [P in keyof $Imports]: ResolvedImportOption<$Imports[P]>;
};

export type ResolvedImportMapPromise<T extends ImportMap> = Promise<
  ResolvedImportMap<T>
>;

export type ResolvedImportList<$Imports extends ImportList> = {
  [P in keyof $Imports]: ResolvedImportOption<$Imports[P]>;
};

export type ResolvedImportListPromise<T extends ImportList> = Promise<
  ResolvedImportList<T>
>;

type ExtractImportStatement<T extends ImportOption> =
  ExtractImport<T> extends () => infer I ? I : T;

type ExtractImport<T extends ImportOption> = T extends { import: infer I }
  ? I
  : T;
