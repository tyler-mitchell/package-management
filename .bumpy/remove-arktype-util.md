---
package-management: patch
---

Removed the @arktype/util dependency, whose $ark global registry corrupts a consumer's own arktype types in the same process.
