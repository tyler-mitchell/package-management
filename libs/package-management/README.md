# package-management

Type-safe utilities for detecting and operating JavaScript package managers.
Supports npm, pnpm, Yarn, and Bun projects.

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
