# 📖 Glossary · NeoIni

| Term | Definition |
|------|------------|
| **NeoIniDocument** | Main class that provides the API for working with INI configuration. It is thread-safe, supports hot reload, encryption, and integrity checks. |
| **NeoIniOptions** | Options class passed to the constructor. Controls auto‑add, auto‑save interval, checksum usage, shielding, and more. |
| **INeoIniProvider** | Interface for pluggable storage backends (file, database, remote). The provider handles raw I/O; the document handles parsing, encryption, and logic. |
| **NeoIniFileProvider** | Default implementation of `INeoIniProvider` that works with the file system. Supports backups, checksums, and encryption. |
| **IEncryptionProvider** | Interface for custom encryption algorithms. Replace the built‑in AES with your own implementation. |
| **IHotReloadMonitor** | Interface for monitoring data source changes. The default monitor polls the provider’s checksum. |
| **EncryptionType** | Enumeration defining encryption mode: `None`, `Auto` (machine‑bound key), `Custom` (password or custom provider). |
| **HumanMode** | Mode that preserves comments, blank lines, and formatting. Disables checksums and encryption because they conflict with manual editing. |
| **Shielding** | Wrapping values in double quotes when writing (e.g., `key = "value ; not comment"`). Allows using `;` and `=` inside values. |
| **Checksum** | Hash of the content stored at the end of the file. Detects unintended modifications and triggers recovery from backup. |
| **Hot Reload** | Automatic reload of the configuration when the source changes. Activated by `StartHotReload()`. |
| **AutoSave** | Automatic save after every modifying operation (`SetValue`, `AddSection`, etc.). Controlled by `UseAutoSave` and `AutoSaveInterval`. |
| **AutoAdd** | Automatic creation of missing sections/keys when reading with `GetValue<T>` (if enabled). Use `TryGetValue<T>` for side‑effect‑free reading. |
| **Clamped Methods** | Methods like `GetValueClamped<T>` and `SetValueClamped<T>` that keep the value within a specified range. Out‑of‑range values are clamped to the nearest bound. |
| **AsyncReaderWriterLock** | Internal lock that provides thread safety: multiple readers allowed, writers exclusive. Supports async operations. |
| **Source Generator** | Compile‑time code generator (package `NeoIni.Generators`) that creates strongly‑typed `Get<T>()` and `Set<T>()` methods for models annotated with `[NeoIniKey]`. |
| **NeoIniKeyAttribute** | Attribute (package `NeoIni.Annotations`) that maps a property to a specific section, key, and default value. |
| **NeoIniData** | Public class representing the internal data structure (`Dictionary<string, Dictionary<string, string>>`). Used when implementing custom providers. |
| **Black Box Philosophy** | Design principle where users interact only with the public API of `NeoIniDocument` and never touch internal structures. Simplifies application code and isolates storage details. |
| **PBKDF2** | Key derivation function used with a salt to generate encryption keys from passwords. |
| **Salt** | Random 16‑byte value generated per file to ensure unique keys even with identical passwords. |
| **CancellationToken** | Supported in all `Async` methods to cancel long‑running operations (load, save, hot reload). |
| **Provider** | General term for any implementation of `INeoIniProvider`. Enables NeoIni to work with files, databases, or any other storage. |
| **UseAutoBackup** | File‑provider option that creates a `.backup` copy before each write. On read errors, data is automatically restored from the backup. |