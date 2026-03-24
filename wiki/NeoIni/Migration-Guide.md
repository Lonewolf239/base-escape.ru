# 🔄 Migration Guide · NeoIni

<details>
<summary><b>Migration Guide: from version 1.x</b></summary>

Version 2.0 introduces several breaking changes. Follow these steps to update your code.

## 1. Rename the main class
`NeoIniReader` → `NeoIniDocument`  
Simply replace all references in your code.

<details>
<summary><b>🟢 Constructor updates in version 3.0</b></summary>

## 2. Update constructors with a boolean encryption parameter
The `bool autoEncryption` parameter has been replaced with the `EncryptionType` enum.

<details>
<summary><b>📋 Call mapping table</b></summary>

| Old call | New call |
|----------|----------|
| `new NeoIniReader(path, false, options)` | `new NeoIniDocument(path, EncryptionType.None, options)` |
| `new NeoIniReader(path, true, options)` | `new NeoIniDocument(path, EncryptionType.Auto, options)` |
| `new NeoIniReader(path, autoEncryption: true)` | `new NeoIniDocument(path, EncryptionType.Auto)` |
| `new NeoIniReader(path, autoEncryption: false)` | `new NeoIniDocument(path, EncryptionType.None)` |

</details>

</details>

## 3. Update the options class
`NeoIniReaderOptions` → `NeoIniOptions`  
Update `using` directives and constructor calls.

## 4. Rename reload methods
`ReloadFromFile()` → `Reload()`  
`ReloadFromFileAsync()` → `ReloadAsync()`

<details>
<summary><b>🟢 Optional steps</b></summary>

## 5. Use the new encryption abstraction
If you used the built‑in encryption, nothing changes. For custom encryption, refer to the [Encryption Provider](https://github.com/Lonewolf239/NeoIni/blob/main/docs/ENCRYPTION-PROVIDER.md).

## 6. Use custom hot‑reload monitors
Hot‑reload logic is now plugged in via `IHotReloadMonitor`. The default file monitor works as before; you can pass your own monitor as the second parameter in `StartHotReload(interval, monitor)`.

</details>

## 7. Update references to the source generator source
The generator still creates extensions for `NeoIniDocument`. Your code that uses `Get<T>()` and `Set<T>()` will continue to work after performing step 1.

</details>

<details>
<summary><b>Migration Guide: from version 2.0</b></summary>

Version 3.0 introduces several breaking changes. Follow these steps to update your code.

## 1. Update constructors with a boolean encryption parameter
The `bool autoEncryption` parameter has been replaced with the `EncryptionType` enum.

<details>
<summary><b>📋 Call mapping table</b></summary>

| Old call | New call |
|----------|----------|
| `new NeoIniDocument(path, false, options)` | `new NeoIniDocument(path, EncryptionType.None, options)` |
| `new NeoIniDocument(path, true, options)` | `new NeoIniDocument(path, EncryptionType.Auto, options)` |
| `new NeoIniDocument(path, autoEncryption: true)` | `new NeoIniDocument(path, EncryptionType.Auto)` |
| `new NeoIniDocument(path, autoEncryption: false)` | `new NeoIniDocument(path, EncryptionType.None)` |

</details>

<details>
<summary><b>🟢 Detailed constructor mapping table</b></summary>

| Old constructor | New constructor |
|-----------------|-----------------|
| `new NeoIniDocument(path, options, autoLoad)` | `new NeoIniDocument(path, EncryptionType.None, options, autoLoad)` |
| `new NeoIniDocument(path, autoEncryption, options, autoLoad)` | `new NeoIniDocument(path, autoEncryption ? EncryptionType.Auto : EncryptionType.None, options, autoLoad)` |
| `new NeoIniDocument(path, encryptionProvider, options, autoLoad)` | `new NeoIniDocument(path, encryptionProvider, options, autoLoad)` — unchanged |
| `new NeoIniDocument(path, encryptionPassword, options, autoLoad)` | `new NeoIniDocument(path, encryptionPassword, options, autoLoad)` — unchanged |
| `new NeoIniDocument(path, encryptionPassword, encryptionProvider, options, autoLoad)` | `new NeoIniDocument(path, encryptionPassword, encryptionProvider, options, autoLoad)` — unchanged |

</details>

</details>

<details>
<summary><b>Migration Guide: from version 3.0 to 3.1</b></summary>

Version 3.1 introduces a **breaking change** in the `IEncryptionProvider` interface.

<details>
<summary><b>📌 What changed</b></summary>

In version 3.0, `IEncryptionProvider` only defined methods for key derivation:
- `EncryptionParameters GetEncryptionParameters(...)`
- `string GetEncryptionPassword(...)`

In version 3.1, the interface has been extended with **encryption and decryption methods**:
- `void Encrypt(MemoryStream memoryStream, byte[] key, byte[] salt, byte[] plaintextBytes)`
- `Task EncryptAsync(MemoryStream memoryStream, byte[] key, byte[] salt, byte[] plaintextBytes, CancellationToken ct)`
- `byte[] Decrypt(byte[] key, byte[] iv, byte[] encryptedBytes)`
- `Task<byte[]> DecryptAsync(byte[] key, byte[] iv, byte[] encryptedBytes, CancellationToken ct)`

These methods are now called by `NeoIniFileProvider` to perform actual encryption/decryption.

</details>

<details>
<summary><b>🎯 Why this change</b></summary>

- **Better separation of concerns**: The file provider no longer contains encryption logic; it delegates to the provider.
- **Full control for custom providers**: You can now replace not only key derivation but the entire encryption algorithm.
- **Future‑proofing**: The new interface supports asynchronous operations and cancellation tokens.

</details>

<details>
<summary><b>🔧 How to migrate custom encryption providers</b></summary>

If you have implemented `IEncryptionProvider` in your code, you must add the new methods.

Implement encryption and decryption according to your algorithm. The built‑in AES provider writes the data in the following order to the stream:

1. **IV** (16 bytes)
2. **Salt** (16 bytes)
3. **Encrypted payload**

Your implementation must follow the same order for compatibility with the built‑in file provider (if you plan to exchange files with it). If you are only using your own provider, you may define your own format, but you must be consistent between `Encrypt` and `Decrypt`.

<details>
<summary><b>📝 Example of a minimal migration</b></summary>

**Before (3.0):**
```csharp
public class MyProvider : IEncryptionProvider
{
    public EncryptionParameters GetEncryptionParameters(...) { ... }
    public string GetEncryptionPassword(byte[]? salt) { ... }
}
```

**After (3.1):**
```csharp
public class MyProvider : IEncryptionProvider
{
    public EncryptionParameters GetEncryptionParameters(...) { ... }
    public string GetEncryptionPassword(byte[]? salt) { ... }

    public void Encrypt(MemoryStream ms, byte[] key, byte[] salt, byte[] plaintextBytes)
    {
        // encrypt and write IV + salt + encrypted data to ms
    }

    public Task EncryptAsync(MemoryStream ms, byte[] key, byte[] salt, byte[] plaintextBytes, CancellationToken ct)
    {
        // async version
    }

    public byte[] Decrypt(byte[] key, byte[] iv, byte[] encryptedBytes)
    {
        // decrypt
    }

    public Task<byte[]> DecryptAsync(byte[] key, byte[] iv, byte[] encryptedBytes, CancellationToken ct)
    {
        // async version
    }
}
```

For a complete example, see the [Encryption Provider documentation](https://github.com/Lonewolf239/NeoIni/blob/main/docs/ENCRYPTION-PROVIDER.md).

</details>

</details>

</details>

### Need help?
Refer to the [[FAQ]] or open an issue on GitHub.
