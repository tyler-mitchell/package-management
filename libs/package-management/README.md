# package-management

Type-safe utilities for detecting and operating JavaScript package managers.

## Install

```sh
pnpm add package-management
```

## Detect the current package manager

```ts
import { definePackageManagerClient } from "package-management";

const packageManager = await definePackageManagerClient({ cwd: process.cwd() }).findPackageManager();
console.log(packageManager.id);
```
