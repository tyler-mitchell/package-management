import { definePathAliases as definePathVariables } from "./definePathAliases";
import { predefinedPathAliases } from "./predefinedPathAliases";

/**
 *  ### Path Aliases: 
 * 
 * 
```jsx
 Notation: <user_home>/Projects/<workspace_folder>/apps/<package_folder>/src/ 
```

 * - **`<workspace_folder>`**:
 *    > Starting from `cwd`, searches up the directory hierarchy for the workspace root, falling back to the git root if no workspace is detected.
 *
 * - **`<workspace_folder?>`**:
 *    > Starting from `cwd`, searches up the directory hierarchy for the workspace root, unlike `<workspace_folder>` it will not fallback to the git root if no workspace is detected.
 *    > - *Note that the `?` seen in `<workspace_folder?>` indicates that it has no fallback.*
 * 
 * - **`<workspace_folder>/node_modules`**:
 *    > Subpath for node modules in the workspace folder.
 *    > - Example: `<workspace_folder>/node_modules`
 *
 * - **`<package_folder>`**:
 *    > Starting from `cwd`, searches up the directory hierarchy for package.json.
 *    > - Example: `<workspace_folder>/apps/package-folder`
 *
 * - **`<package_folder>/node_modules`**:
 *    > Subpath for node modules in the package folder.
 *
 * - **`<package_folder>/node_modules/.bin`**:
 *    > Subpath for executable scripts in the package folder.
 *
 * - **`<user_home>`**:
 *    > Path to the current user's home directory.
 *    > - Example: `/Users/username`
 *
 * - **`<user_tmpdir>`**:
 *    > Path to the OS tmpdir folder.
 *    > - Example: `/var/folders/vb/62qmb9fj2qsxcwhr8tb16krrw0000gn/T`
 *
 * - **`<cwd>`**:
 *    > Path to the current working directory.
 *
 * - **`<current_file>`**:
 *    > Path to the current file.
 *    > - Example: `/Users/username/Projects/monorepo/package-folder/src/utils/getPath.ts`
 *
 * - **`<current-folder>`**:
 *    > Path to the current folder.
 *    > - Example: `/Users/username/Projects/monorepo/package-folder/src/utils`
 */
export const getPath = definePathVariables(predefinedPathAliases).getFilePath;

getPath(["<workspace_folder>/node_modules/.bin"]);
