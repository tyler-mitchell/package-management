import type { ResolvedPromise, __ } from "@/types";
import type { InstallPackageOptions } from "@antfu/install-pkg";

export interface ImportModuleData<T = any> {
  /**
   * The name of the package to import. This should match the name used in the import statement.
   */
  name: string;

  /**
   * A callback which returns a module import statement
   */
  import: ImportCallback<T>;
}

export interface ImportPackageData<T = any> extends ImportModuleData<T> {
  /**
   * When enabled, the package will be installed if it is not found
   * @default true
   */
  install?: boolean;

  // import: ImportStatementCallback<T>;

  /**
   * When enabled, the package will be installed as a dev dependency
   */
  dev?: boolean;

  /**
   * Additional installation options
   */
  installOptions?: Omit<InstallPackageOptions, "dev">;
}

export type ImportOption<T = any> =
  | Module
  | ImportCallback<T>
  | ImportModuleData<T>
  | ImportPackageData<T>;

export type Module<T = any> = Promise<T>;

export type ImportCallback<T = any> = () => Module<T>;

export type ImportMap = Record<string, ImportOption>;

export type ImportList = ImportOption[];

export type ImportModuleFn = <T = any>(name: string) => ImportModuleData<T>;

export type ImportOptionData<T extends ImportOption> = ResolvedPromise<
  ExtractImportOptionModule<T>
>;

export type ResolvedImportMap<$Imports extends ImportMap> = {
  [P in keyof $Imports]: ImportOptionData<$Imports[P]>;
};

export type ResolvedImportMapPromise<T extends ImportMap> = Promise<
  ResolvedImportMap<T>
>;

export type ResolvedImportList<$Imports extends ImportList> = {
  [P in keyof $Imports]: ImportOptionData<$Imports[P]>;
};

export type ResolvedImportListPromise<T extends ImportList> = Promise<
  ResolvedImportList<T>
>;

export type ResolvedImportOption<TOption extends ImportOption> = __<
  {
    name?: string;
    import: () => ExtractImportOptionModule<TOption>;
  } & Partial<ImportPackageData>
>;

export type ExtractImportOptionModule<TOption> = Extract<
  TOption extends { import: () => infer I }
    ? I
    : TOption extends () => infer I
      ? I
      : TOption extends Module
        ? TOption
        : never,
  Module
>;
