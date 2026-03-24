# 🧠 Philosophy · NeoIni

NeoIni is designed as a **black box**: you interact only with the public API of `NeoIniDocument`, never with the internal data structures or file format details.

- **You call methods** – the library manages reading, writing, locking, encryption, and integrity checks.
- **The INI file is owned by NeoIni** – in standard mode, the file contains only data; human comments are intentionally stripped to guarantee consistency.
- **For manual editing**, we provide [Human Mode](https://github.com/Lonewolf239/NeoIni/blob/main/docs/HUMAN-MODE.md) – a special mode that preserves comments and formatting, but disables checksums and encryption.

This approach keeps your application code simple and decoupled from the underlying storage. Whether the configuration lives in a file, a database, or a remote service – your code stays the same.