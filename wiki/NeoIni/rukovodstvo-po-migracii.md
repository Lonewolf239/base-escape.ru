# 🔄 Руководство по миграции · NeoIni

<details>
<summary><b>Руководство по миграции: с версии 1.x</b></summary>

Версия 2.0 содержит несколько критических изменений. Выполните следующие шаги для обновления вашего кода.

## 1. Переименование основного класса
`NeoIniReader` → `NeoIniDocument`  
Просто замените все упоминания в вашем коде.

<details>
<summary><b>🟢 Обновления конструкторов в версии 3.0</b></summary>

## 2. Обновление конструкторов с логическим параметром шифрования
Параметр `bool autoEncryption` был заменён на перечисление `EncryptionType`.

<details>
<summary><b>📋 Таблица соответствия вызовов</b></summary>

| Старый вызов | Новый вызов |
|----------|----------|
| `new NeoIniReader(path, false, options)` | `new NeoIniDocument(path, EncryptionType.None, options)` |
| `new NeoIniReader(path, true, options)` | `new NeoIniDocument(path, EncryptionType.Auto, options)` |
| `new NeoIniReader(path, autoEncryption: true)` | `new NeoIniDocument(path, EncryptionType.Auto)` |
| `new NeoIniReader(path, autoEncryption: false)` | `new NeoIniDocument(path, EncryptionType.None)` |

</details>

</details>

## 3. Обновление класса параметров
`NeoIniReaderOptions` → `NeoIniOptions`  
Обновите директивы `using` и вызовы конструкторов.

## 4. Переименование методов перезагрузки
`ReloadFromFile()` → `Reload()`  
`ReloadFromFileAsync()` → `ReloadAsync()`

<details>
<summary><b>🟢 Необязательные шаги</b></summary>

## 5. Использование новой абстракции шифрования
Если вы использовали встроенное шифрование, ничего не меняется. Для реализации пользовательского шифрования обратитесь к [Encryption Provider](https://github.com/Lonewolf239/NeoIni/blob/main/docs/ENCRYPTION-PROVIDER-RU.md).

## 6. Использование пользовательских мониторов горячей перезагрузки
Логика горячей перезагрузки теперь подключается через `IHotReloadMonitor`. Стандартный файловый монитор работает как прежде; вы можете передать свой монитор вторым параметром в `StartHotReload(interval, monitor)`.

</details>

## 7. Обновление ссылок на источник генератора
Генератор по-прежнему создаёт расширения для `NeoIniDocument`. Ваш код, использующий `Get<T>()` и `Set<T>()`, продолжит работать после выполнения шага 1.

</details>

<details>
<summary><b>Руководство по миграции: с версии 2.0</b></summary>

Версия 3.0 содержит несколько критических изменений. Выполните следующие шаги для обновления вашего кода.

## 1. Обновление конструкторов с логическим параметром шифрования
Параметр `bool autoEncryption` был заменён на перечисление `EncryptionType`.

<details>
<summary><b>📋 Таблица соответствия вызовов</b></summary>

| Старый вызов | Новый вызов |
|----------|----------|
| `new NeoIniDocument(path, false, options)` | `new NeoIniDocument(path, EncryptionType.None, options)` |
| `new NeoIniDocument(path, true, options)` | `new NeoIniDocument(path, EncryptionType.Auto, options)` |
| `new NeoIniDocument(path, autoEncryption: true)` | `new NeoIniDocument(path, EncryptionType.Auto)` |
| `new NeoIniDocument(path, autoEncryption: false)` | `new NeoIniDocument(path, EncryptionType.None)` |

</details>

<details>
<summary><b>🟢 Детальная таблица соответствия конструкторов</b></summary>

| Старый конструктор | Новый конструктор |
|-----------------|-----------------|
| `new NeoIniDocument(path, options, autoLoad)` | `new NeoIniDocument(path, EncryptionType.None, options, autoLoad)` |
| `new NeoIniDocument(path, autoEncryption, options, autoLoad)` | `new NeoIniDocument(path, autoEncryption ? EncryptionType.Auto : EncryptionType.None, options, autoLoad)` |
| `new NeoIniDocument(path, encryptionProvider, options, autoLoad)` | `new NeoIniDocument(path, encryptionProvider, options, autoLoad)` — без изменений |
| `new NeoIniDocument(path, encryptionPassword, options, autoLoad)` | `new NeoIniDocument(path, encryptionPassword, options, autoLoad)` — без изменений |
| `new NeoIniDocument(path, encryptionPassword, encryptionProvider, options, autoLoad)` | `new NeoIniDocument(path, encryptionPassword, encryptionProvider, options, autoLoad)` — без изменений |

</details>

</details>

<details>
<summary><b>Руководство по миграции: с версии 3.0 на 3.1</b></summary>

Версия 3.1 вносит **критическое изменение** в интерфейс `IEncryptionProvider`.

<details>
<summary><b>📌 Что изменилось</b></summary>

В версии 3.0 `IEncryptionProvider` содержал только методы для получения параметров шифрования:
- `EncryptionParameters GetEncryptionParameters(...)`
- `string GetEncryptionPassword(...)`

В версии 3.1 интерфейс дополнен **методами шифрования и дешифрования**:
- `void Encrypt(MemoryStream memoryStream, byte[] key, byte[] salt, byte[] plaintextBytes)`
- `Task EncryptAsync(MemoryStream memoryStream, byte[] key, byte[] salt, byte[] plaintextBytes, CancellationToken ct)`
- `byte[] Decrypt(byte[] key, byte[] iv, byte[] encryptedBytes)`
- `Task<byte[]> DecryptAsync(byte[] key, byte[] iv, byte[] encryptedBytes, CancellationToken ct)`

Теперь эти методы вызываются `NeoIniFileProvider` для выполнения фактического шифрования.

</details>

<details>
<summary><b>🎯 Зачем это изменение</b></summary>

- **Лучшее разделение ответственности**: файловый провайдер больше не содержит логику шифрования, она делегируется провайдеру.
- **Полный контроль для кастомных провайдеров**: можно заменить не только вывод ключа, но и весь алгоритм шифрования.
- **Готовность к будущему**: новый интерфейс поддерживает асинхронные операции и токены отмены.

</details>

<details>
<summary><b>🔧 Как мигрировать кастомные провайдеры шифрования</b></summary>

Если вы реализовали `IEncryptionProvider` в своём коде, необходимо добавить новые методы.

Реализуйте шифрование и дешифрование согласно вашему алгоритму. Встроенный AES-провайдер записывает данные в поток в следующем порядке:

1. **IV** (16 байт)
2. **Соль** (16 байт)
3. **Зашифрованные данные**

Ваша реализация должна соблюдать тот же порядок для совместимости со встроенным файловым провайдером (если вы планируете обмениваться файлами с ним). Если вы используете только свой провайдер, можете определить свой формат, но он должен быть согласован между `Encrypt` и `Decrypt`.

<details>
<summary><b>📝 Пример минимальной миграции</b></summary>

**До (3.0):**
```csharp
public class MyProvider : IEncryptionProvider
{
    public EncryptionParameters GetEncryptionParameters(...) { ... }
    public string GetEncryptionPassword(byte[]? salt) { ... }
}
```

**После (3.1):**
```csharp
public class MyProvider : IEncryptionProvider
{
    public EncryptionParameters GetEncryptionParameters(...) { ... }
    public string GetEncryptionPassword(byte[]? salt) { ... }

    public void Encrypt(MemoryStream ms, byte[] key, byte[] salt, byte[] plaintextBytes)
    {
        // зашифровать и записать в ms IV + соль + зашифрованные данные
    }

    public Task EncryptAsync(MemoryStream ms, byte[] key, byte[] salt, byte[] plaintextBytes, CancellationToken ct)
    {
        // асинхронная версия
    }

    public byte[] Decrypt(byte[] key, byte[] iv, byte[] encryptedBytes)
    {
        // расшифровать
    }

    public Task<byte[]> DecryptAsync(byte[] key, byte[] iv, byte[] encryptedBytes, CancellationToken ct)
    {
        // асинхронная версия
    }
}
```

Полный пример см. в [документации Encryption Provider](https://github.com/Lonewolf239/NeoIni/edit/main/docs/ENCRYPTION-PROVIDER-RU.md).

</details>

</details>

</details>

### Нужна помощь?
Обратитесь к [[ЧаВо]] или откройте вопрос на GitHub.
