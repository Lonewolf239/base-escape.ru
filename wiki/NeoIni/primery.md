# 📘 Примеры · NeoIni

Небольшие консольные программы, демонстрирующие ключевые возможности NeoIni. Каждый пример самодостаточен и может быть скопирован в файл `Program.cs`.

<details>
  <summary><strong>1. Базовое чтение/запись</strong></summary>

```csharp
using NeoIni;

// Создаём или открываем INI-файл
using var doc = new NeoIniDocument("config.ini");

// Записываем значения
doc.SetValue("Database", "Host", "localhost");
doc.SetValue("Database", "Port", 5432);

// Читаем со значениями по умолчанию
string host = doc.GetValue("Database", "Host", "127.0.0.1");
int port = doc.GetValue("Database", "Port", 3306);

Console.WriteLine($"Host: {host}, Port: {port}");
```

</details>

<details>
  <summary><strong>2. Использование шифрования</strong></summary>

```csharp
using NeoIni;

// Авто-шифрование (ключ привязан к машине)
using var doc = new NeoIniDocument("secret.ini", EncryptionType.Auto);
doc.SetValue("User", "Name", "Alice");
Console.WriteLine(doc.GetValue("User", "Name", ""));

// Пользовательский пароль (переносимый)
using var doc2 = new NeoIniDocument("secret.ini", "myStrongPassword");
Console.WriteLine(doc2.GetValue("User", "Name", ""));
```

</details>

<details>
  <summary><strong>3. Горячая перезагрузка (hot reload)</strong></summary>

```csharp
using NeoIni;
using System.Threading;

var doc = new NeoIniDocument("config.ini");
doc.StartHotReload(2000); // проверка каждые 2 секунды

// Подписываемся на события перезагрузки
doc.Loaded += (_, _) => Console.WriteLine("Конфиг перезагружен!");
doc.Error += (_, e) => Console.WriteLine($"Ошибка: {e.Exception.Message}");

// Держим приложение запущенным
Thread.Sleep(Timeout.Infinite);
```

Теперь отредактируйте `config.ini` внешним редактором – изменения будут подхвачены автоматически.

</details>

<details>
  <summary><strong>4. Маппинг объектов через source generator</strong></summary>

Создайте модель и пометьте её атрибутами:

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

Затем используйте:

```csharp
using NeoIni;

var doc = new NeoIniDocument("config.ini");
AppConfig cfg = doc.Get<AppConfig>();
Console.WriteLine(cfg.AppName);

cfg.AppName = "New Name";
doc.Set(cfg);
doc.SaveFile();
```

Никакой рефлексии – source generator создаёт строго типизированный код на этапе компиляции.

</details>

<details>
  <summary><strong>5. Режим ручного редактирования (human mode)</strong></summary>

Сохраняйте комментарии и форматирование:

```csharp
using NeoIni;

var doc = NeoIniDocument.CreateHumanMode("config.ini");
doc.SetValue("Section", "Key", "Value");
// Файл сохранит исходные комментарии и структуру.
```

</details>

### Подробное описание API см. в [[Ссылки на документацию]].