# Changelog




## 0.2.0
<sub>2026-09-01</sub>

- *(minor)* Added config parsing and editing for JSON, JSONC, JSON5, YAML, and TOML.
- *(minor)* Added synchronous file readers with an optional missing-file result.

## 0.1.0
<sub>2026-08-29</sub>

- *(minor)*
  Added Node 22.0–22.8 support by feature-detecting util.getCallSites; only the caller-location stack fallback degrades where it is absent.
- *(patch)* Exported createFile, isWritable, and definePackageManager from the package barrel.
- *(patch)*
  Removed the @arktype/util dependency, whose $ark global registry corrupts a consumer's own arktype types in the same process.

## 0.0.16
<sub>2026-08-23</sub>

- *(patch)* Documented support for npm, pnpm, Yarn, and Bun projects.

## 0.0.15

_2026-08-23_

- Added package installation and package-manager detection examples.

## 0.0.14

_2026-08-23_

- Added the package-management keyword for registry discovery.

## 0.0.13

_2026-08-23_

- Fixed the package description spelling.

## 0.0.12

_2026-08-23_

- Added the package-manager discovery keyword.

## 0.0.11

_2026-08-23_

- Shipped the built package files and completed release verification.

## 0.0.10
<sub>2026-08-23</sub>
