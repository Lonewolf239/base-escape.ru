# 🗺️ Roadmap · NeoIni

Long-term development plan. NeoIni evolves from a single-file INI reader to a universal, provider-oriented configuration framework while preserving the **black box philosophy** and the internal model `Dictionary<string, Dictionary<string, string>>`.

---

<details>
<summary><b>📦 1.7.x — Foundation</b> (✅ all released)</summary>

| Version | Status | Description |
|---------|--------|-------------|
| 1.7 | ✅ | Object mapping API (`Get<T>`, `Set<T>`) via source generator. |
| 1.7.1 | ✅ | Hot reload via file watching (polling with checksum comparison). |
| 1.7.2 | ✅ | Human-friendly INI mode (preserves comments, no checksum). |
| 1.7.3 | ✅ | Pluggable provider abstraction (`INeoIniProvider`). |

</details>

<details>
<summary><b>🔧 1.8 — Compatibility & Hardening</b> (✅ released)</summary>

| Version | Status | Description |
|---------|--------|-------------|
| 1.8 | ✅ | Support for quoted values: `key = "value ; not a comment"`. Extends compatibility with real-world INI files (MySQL, PHP, Git config). |

</details>

<details>
<summary><b>⚡ 1.9 — Async Internals</b> (✅ released)</summary>

| Version | Status | Description |
|---------|--------|-------------|
| 1.9 | ✅ | Asynchronous concurrency: replaced `ReaderWriterLockSlim` with an async-compatible primitive. |

</details>

<details>
<summary><b>🚀 2.0 — Major Redesign</b> (✅ released)</summary>

| Version | Status | Description |
|---------|--------|-------------|
| 2.0 | ✅ | Renamed `NeoIniReader` → `NeoIniDocument`. Introduced `IEncryptionProvider` interface for pluggable encryption algorithms (see [[Migration Guide]]). |

</details>

<details>
<summary><b>⚙️ 3.0 — Constructor Rework & EncryptionType</b> (✅ released)</summary>

| Version | Status | Description |
|---------|--------|-------------|
| 3.0 | ✅ | Reworked constructors and `EncryptionType` enum (see [[Migration Guide]]). |

</details>

<details open>
<summary><b>🔮 3.x — Future Directions</b> (planned / under consideration)</summary>

| Version | Status | Description |
|---------|--------|-------------|
| 3.1 | ✅ | **Improvement of IEncryptionProvider**: Transferring encryption logic from `NeoIniFileProvider` (see [[Migration Guide]]). |
| 3.2 | ✅ | **.NET Standard 2.0 support**: enable usage on .NET Framework 4.6.2+ and other legacy platforms by backporting async/await and other modern features. |
| 3.3 | ✅ | **Batch operations**: methods like `SetValuesAsync` to update multiple keys in a single atomic operation, reducing auto‑save overhead. |
| 3.4 | 🔵 Under consideration | **Streaming provider support**: allow large configurations to be read/written incrementally without loading the entire dataset into memory. |
| 3.5 | 🔵 Under consideration | **Memory-mapped I/O**: optionally use memory-mapped files for very large INI files to improve performance and reduce memory footprint. |

</details>

---

### Related Pages

- [[Philosophy]] — design principles
- [[Migration Guide]] — how to upgrade to 3.0
- [[Changelog]] — full version history