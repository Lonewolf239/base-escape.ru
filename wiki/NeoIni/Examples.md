# 📘 Examples · NeoIni

Here are a few minimal console programs demonstrating key features of NeoIni. Each example is self‑contained and can be copied into a `Program.cs` file.

<details>
  <summary><strong>1. Basic read/write</strong></summary>

```csharp
using NeoIni;

// Create or open an INI file
using NeoIniDocument doc = new("config.ini");

// Write values
doc.SetValue("Database", "Host", "localhost");
doc.SetValue("Database", "Port", 5432);

// Read with defaults
string host = doc.GetValue("Database", "Host", "127.0.0.1");
int port = doc.GetValue("Database", "Port", 3306);

Console.WriteLine($"Host: {host}, Port: {port}");
```

</details>

<details>
  <summary><strong>2. Using encryption</strong></summary>

```csharp
using NeoIni;

// Auto‑encryption (machine‑bound key)
using NeoIniDocument doc = new("secret.ini", EncryptionType.Auto);
doc.SetValue("User", "Name", "Alice");
Console.WriteLine(doc.GetValue("User", "Name", ""));

// Custom password (portable)
using NeoIniDocument doc2 = new("secret.ini", "myStrongPassword");
Console.WriteLine(doc2.GetValue("User", "Name", ""));
```

</details>

<details>
  <summary><strong>3. Hot reload</strong></summary>

```csharp
using NeoIni;
using System.Threading;

NeoIniDocument doc = new("config.ini");
doc.StartHotReload(2000); // check every 2 seconds

// Subscribe to reload events
doc.Loaded += (_, _) => Console.WriteLine("Config reloaded!");
doc.Error += (_, e) => Console.WriteLine($"Error: {e.Exception.Message}");

// Keep the app alive
Thread.Sleep(Timeout.Infinite);
```

Now edit `config.ini` externally – changes will be picked up automatically.

</details>

<details>
  <summary><strong>4. Object mapping with source generator</strong></summary>

Create a model class and annotate it:

```csharp
using NeoIni.Annotations;

public class AppConfig
{
    [NeoIniKey("General", "AppName", "MyApp")]
    public string AppName { get; set; }

    [NeoIniKey("Database", "Port", 5432)]
    public int DbPort { get; set; }
}
```

Then use it:

```csharp
using NeoIni;

NeoIniDocument doc = new("config.ini");
AppConfig cfg = doc.Get<AppConfig>();
Console.WriteLine(cfg.AppName);

cfg.AppName = "New Name";
doc.Set(cfg);
doc.SaveFile();
```

No reflection – the source generator creates strongly‑typed code at compile time.

</details>

<details>
  <summary><strong>5. Human‑editable mode</strong></summary>

Preserve comments and formatting:

```csharp
using NeoIni;

var doc = NeoIniDocument.CreateHumanMode("config.ini");
doc.SetValue("Section", "Key", "Value");
// The file will keep its original comments and structure.
```

</details>

### For complete API details, see [[Documentation Links]].