# ❓ FAQ · NeoIni

<details>
<summary><strong>General Questions</strong></summary>

<details>
<summary>❓ Is NeoIni thread-safe? <b>Yes</b> (click to expand)</summary>

All public methods of `NeoIniDocument` are protected by an internal `AsyncReaderWriterLock`.  
- Multiple readers can work simultaneously (e.g., `GetValue`, `SectionExists`).  
- Write operations are performed exclusively (e.g., `SetValue`, `AddSection`).  
- Async methods use the same lock with `await` support.  

This ensures safe use from multiple threads without additional synchronization in your code.

</details>

<details>
<summary>❓ Which .NET versions are supported? <b>.NET 6+ and .NET Standard 2.0</b> (click to expand)</summary>

NeoIni targets **.NET 6, 7, 8, 9, 10** and **.NET Standard 2.0**. This enables compatibility with .NET Framework 4.6.2+, .NET Core 2.x, and other platforms implementing .NET Standard 2.0.

</details>

<details>
<summary>❓ How do I transfer encrypted files between computers? <b>Use GetEncryptionPassword() or custom password</b> (click to expand)</summary>

- **Auto-encryption (machine-bound):** the key is generated based on the current user and machine. To transfer such a file, call `GetEncryptionPassword()` on the source computer **before** moving the file, then use the resulting password in the constructor on the target computer:  
```csharp
string pwd = doc.GetEncryptionPassword();   // on source machine
// on new machine
var doc2 = new NeoIniDocument("file.ini", pwd);
```
- **Custom password:** the password is not stored, so you must remember it. If you used a custom password, simply provide the same string.

> **Note:** `GetEncryptionPassword()` returns a descriptive message when using custom encryption – the actual password is never disclosed for security reasons.

</details>

<details>
<summary>❓ Does NeoIni preserve comments and formatting? <b>No, unless using Human Mode</b> (click to expand)</summary>

In **standard mode**, NeoIni owns the file and removes all non-content (comments, blank lines, extra whitespace). This ensures data integrity and enables features like checksum validation.  
If you need to preserve comments and formatting, use **Human Mode** (see [Human Mode](https://github.com/Lonewolf239/NeoIni/blob/main/docs/HUMAN-MODE.md)). In this mode, comments are preserved, but checksums and encryption are disabled.

</details>

<details>
<summary>❓ Can I use NeoIni with a database instead of a file? <b>Yes, via INeoIniProvider</b> (click to expand)</summary>

**Yes.** Implement the `INeoIniProvider` interface and pass it to the constructor. The provider is responsible for reading and writing raw content – NeoIni handles parsing, locking, and encryption.  
A detailed guide is available in [Providers](https://github.com/Lonewolf239/NeoIni/blob/main/docs/PROVIDERS.md).

</details>

<details>
<summary>❓ What is the "black box" philosophy? <b>Interact only via public API, never touch internals</b> (click to expand)</summary>

NeoIni follows a strict "black box" philosophy: you interact only with the public `NeoIniDocument` API, never touching internal data structures or file format details.  
- You call methods, the library manages locking, encryption, integrity checking, and serialization.  
- In standard mode, the INI file contains only data – comments are intentionally removed to guarantee consistency.  

This approach simplifies your code and decouples it from storage details.

</details>

</details>

<details>
<summary><strong>Usage</strong></summary>

<details>
<summary>❓ Does `GetValue<T>` add missing keys? <b>Yes, if UseAutoAdd is true</b> (click to expand)</summary>

Only if `UseAutoAdd` is set to `true` (the default). When a key or section is missing, `GetValue<T>` will create them and write `defaultValue` to the file.  
For side-effect-free reading, use `TryGetValue<T>` – it never modifies the file.

</details>

<details>
<summary>❓ How do I read a value without side effects? <b>Use TryGetValue&lt;T&gt;</b> (click to expand)</summary>

Use `TryGetValue<T>`:
```csharp
if (doc.TryGetValue("Section", "Key", out int value))
    Console.WriteLine(value);
else
    Console.WriteLine("Key not found");
```
This method never writes to the file, regardless of `UseAutoAdd` or `UseAutoSave` settings.

</details>

<details>
<summary>❓ What is the difference between `GetValue` and `TryGetValue`? <b>GetValue may write, TryGetValue never writes</b> (click to expand)</summary>

- `GetValue<T>`: returns the default value if the key is missing. If `UseAutoAdd` is enabled, it **writes** that default value to the file.  
- `TryGetValue<T>`: returns `false` if the key is missing, and never modifies the file.

</details>

<details>
<summary>❓ How does auto-save work? <b>Controlled by UseAutoSave and AutoSaveInterval</b> (click to expand)</summary>

Auto-save is controlled by `UseAutoSave` and `AutoSaveInterval`:  
- `UseAutoSave = true` (default): every modifying operation (e.g., `SetValue`, `AddKey`) triggers a save.  
- `AutoSaveInterval = n` (n > 0): save occurs only after every `n` changes.  
- `AutoSaveInterval = 0`: save after every change.  

You can also manually call `SaveFile()` / `SaveFileAsync()`.

</details>

<details>
<summary>❓ What is shielding and when should I use it? <b>Protects values with quotes; enable explicitly</b> (click to expand)</summary>

Shielding (enabled via `UseShielding = true`) wraps values in double quotes when writing to the INI file. This allows values containing semicolons or equal signs to be read correctly without being interpreted as delimiters.  
- Enabled by default? **No** – it must be explicitly enabled in `NeoIniOptions`.  
- Shielding is **incompatible** with Human Mode (throws `ModeConflictException`).  
- When reading, shielded values are automatically unquoted.

Example:
```csharp
var doc = new NeoIniDocument("config.ini", new NeoIniOptions { UseShielding = true });
doc.SetValue("Section", "Key", "value ; not comment");
// In file: Key = "value ; not comment"
```

</details>

<details>
<summary>❓ How do I use the source generator for object mapping? <b>Annotate class with [NeoIniKey]</b> (click to expand)</summary>

Annotate a plain class with `[NeoIniKey]` attributes. The generator will automatically create `Get<T>()` and `Set<T>()` extension methods for `NeoIniDocument`.  
Requirements:  
- The model must be in the same project that references NeoIni.  
- The class must have a public parameterless constructor.  
- Properties must be public with a getter and setter.  
- Supported types: any type convertible via `Convert.ChangeType` (including enums, `DateTime`, `bool`, etc.).

Example:
```csharp
public class Settings
{
    [NeoIniKey("General", "Theme", "Light")]
    public string Theme { get; set; }

    [NeoIniKey("General", "Timeout", 30)]
    public int Timeout { get; set; }
}

// Usage
using var doc = new NeoIniDocument("app.ini");
Settings s = doc.Get<Settings>();
s.Theme = "Dark";
doc.Set(s);
doc.SaveFile();
```

</details>

<details>
<summary>❓ What is Human Mode and when should I use it? <b>Preserves formatting but disables checksums/encryption</b> (click to expand)</summary>

Human Mode allows a user to manually edit the INI file while preserving comments, blank lines, and formatting. It is enabled via static factory methods `CreateHumanMode`.  
**Important limitations:**  
- Checksums are disabled (`UseChecksum = false`).  
- Encryption is disabled.  
- No data integrity guarantees – file corruption may go undetected.  

Use this mode only for configuration files intended for human editing (e.g., user settings). For programmatically managed files, standard mode is preferred.

</details>

</details>

<details>
<summary><strong>Troubleshooting</strong></summary>

<details>
<summary>❓ I get a `MissingEncryptionKeyException` when opening an encrypted file. <b>Provide the correct password</b> (click to expand)</summary>

The file was encrypted with a password, but you did not provide it.  
- If you used auto-encryption (no password in constructor), the file is bound to the computer/user. Transfer it using the password obtained via `GetEncryptionPassword()`.  
- If you used a custom password, pass it to the constructor: `new NeoIniDocument(path, password)`.  
- If the file was created with a custom encryption provider, ensure the same provider and parameters are used.

</details>

<details>
<summary>❓ Hot reload is not working. <b>Check polling interval, file changes, and custom provider</b> (click to expand)</summary>

Check the following:  
- The polling interval must be **≥ 1000 ms**.  
- The monitor automatically pauses during save operations – this is normal.  
- Ensure the file is actually being changed (e.g., by another process) and changes are saved.  
- If using a custom `INeoIniProvider`, ensure `GetStateChecksum()` returns a value that changes when the source changes.  
- Verify that the `ChangeDetected` event is subscribed to (the document subscribes automatically when `StartHotReload` is called).

</details>

<details>
<summary>❓ The source generator is not working. <b>Model must be in same project, public, rebuild</b> (click to expand)</summary>

- The model must be in the same project that references the NeoIni NuGet package.  
- Ensure you are using the latest version of the package.  
- Rebuild the project – the generator runs at compile time and adds a `NeoIniDocumentExtensions.g.cs` file.  
- If the issue persists, check that your class and its properties are `public`.

</details>

<details>
<summary>❓ Why are my values not saved when the application exits? <b>Ensure SaveOnDispose is true or call SaveFile()</b> (click to expand)</summary>

By default, `SaveOnDispose = true` ensures that the latest changes are saved when the `NeoIniDocument` is disposed.  
If you disabled this option (`SaveOnDispose = false`), you must manually call `SaveFile()` before disposal, otherwise data may be lost.

</details>

<details>
<summary>❓ How do I delete the configuration file? <b>Use DeleteFile() or DeleteFileWithData()</b> (click to expand)</summary>

Use `DeleteFile()` to delete the file (and any temporary files). If you also want to clear in-memory data, call `DeleteFileWithData()`.

</details>

<details>
<summary>❓ What happens if a backup exists? <b>Backup used for recovery</b> (click to expand)</summary>

When `UseAutoBackup = true` (the default for the file provider), the original file is saved with a `.backup` extension before each save. If any error occurs during reading, NeoIni automatically attempts to restore data from the backup.  
You can manually delete the backup using the `DeleteBackup()` method.

</details>

<details>
<summary>❓ How do I handle errors globally? <b>Subscribe to Error event</b> (click to expand)</summary>

Subscribe to the `Error` event:
```csharp
doc.Error += (sender, e) => Console.WriteLine($"Error: {e.Exception.Message}");
```
This event is raised on parsing, I/O, cryptographic failures, etc. It is also forwarded from the underlying provider.

</details>

<details>
<summary>❓ Does `Reload()` overwrite unsaved changes? <b>Yes, discards changes</b> (click to expand)</summary>

Yes. `Reload()` discards all in-memory changes and reads the current content from the source. To avoid losing work, save changes before reloading.

</details>

<details>
<summary>❓ How do I disable checksum validation? <b>Set UseChecksum = false</b> (click to expand)</summary>

Set `UseChecksum = false` in the options when creating the document, or change the property after creation:
```csharp
var doc = new NeoIniDocument("file.ini", new NeoIniOptions { UseChecksum = false });
// or
doc.UseChecksum = false;
```
Disabling checksums makes the file available for manual editing (comments are still removed), but removes integrity protection.

</details>

</details>

<details>
<summary><strong>Advanced Questions</strong></summary>

<details>
<summary>❓ Can I implement my own encryption algorithm? <b>Yes, via IEncryptionProvider</b> (click to expand)</summary>

Yes. Implement the `IEncryptionProvider` interface and pass it to the constructor. The provider must supply a key and salt. See [Encryption Provider](https://github.com/Lonewolf239/NeoIni/blob/main/docs/ENCRYPTION-PROVIDER.md).

</details>

<details>
<summary>❓ How do I create a custom hot reload monitor? <b>Implement IHotReloadMonitor</b> (click to expand)</summary>

Implement the `IHotReloadMonitor` interface. The default `HotReloadMonitor` polls the provider's `GetStateChecksum()` at a specified interval. Your custom monitor could use file system watchers, database triggers, etc.

</details>

<details>
<summary>❓ What happens when `Dispose` is called? <b>Saves, stops hot reload, releases lock</b> (click to expand)</summary>

`Dispose` (and `DisposeAsync`) performs:  
1. Stops hot reload if active.  
2. Retrieves current content and saves it (if `SaveOnDispose` is enabled).  
3. Raises the `Saved` and `DataCleared` events.  
4. Releases the internal lock.  

After disposal, any method call throws an `ObjectDisposedException`.

</details>

<details>
<summary>❓ Are async methods fully supported? <b>Yes, with CancellationToken</b> (click to expand)</summary>

Yes. All long-running operations (save, load, hot reload, async read/write) have `Async` variants that support `CancellationToken`. The internal lock also provides async methods.

</details>

<details>
<summary>❓ How do I ensure values are within a specified range? <b>Use Clamped methods</b> (click to expand)</summary>

Use the `Clamped` methods: `GetValueClamped` and `SetValueClamped` (or `AddKeyClamped`). They automatically ensure the value stays within `min..max`. If the value is out of bounds, it is clamped to the nearest boundary.

</details>

<details>
<summary>❓ What are the restrictions on section and key names? <b>No empty names, forbidden chars ; = ", trimmed</b> (click to expand)</summary>

- Empty strings are allowed only if `AllowEmptyValues = true`.  
- Characters `;`, `=`, `"` are forbidden (except when shielding is enabled for values).  
- Leading and trailing whitespace is trimmed.  

The library imposes no length restrictions, but for readability, names should not be excessively long.

</details>

<details>
<summary>❓ How are `null` values handled? <b>Treated as empty string; may throw if empty values not allowed</b> (click to expand)</summary>

- `null` is treated as an empty string.  
- If `AllowEmptyValues` is `false`, passing `null` or an empty string to a key or value throws `EmptyValueNotAllowedException`.  

Use `string?` with `GetValue<string>` – if the key exists and contains text, the string is returned; otherwise, the default value is returned (which may be `null` if you specified it).

</details>

<details>
<summary>❓ Can I use NeoIni in a Blazor or ASP.NET Core application? <b>Yes, thread-safe</b> (click to expand)</summary>

Yes. The library is thread-safe and works in any .NET 6+ environment. For web applications, consider using `NeoIniOptions.ReadOnly` for shared configuration files or managing one instance per user.

</details>

</details>

<details>
<summary><strong>Still have questions?</strong></summary>

- Check out [[Examples]] with code snippets.  
- Review the [[Documentation Links]].  
- [Open an issue](https://github.com/Lonewolf239/NeoIni/issues) or contact on Telegram [@an1onime](https://t.me/an1onime).

</details>