# Pure Native Windows App (C# + .NET 8 + WPF)

100% pure native Windows desktop implementation of **Our Family Field Guide** targeting **.NET 8 (`net8.0-windows`)** using native **WPF** and `.NET System.Security.Cryptography` (`AesGcm`, `Rfc2898DeriveBytes.Pbkdf2`) with zero external dependencies in the app or core library.

## Highlights
- **Native Windows Desktop UI & Printing:** Native WPF shell (`MainWindow`), Windows open/save file dialogs, and native Windows `PrintDialog` for the 1-Page Summary & ER Grab Sheet.
- **Byte-for-Byte Interoperable Backups:** Reads and writes the exact same `AES-256-GCM` (`PBKDF2-SHA-256`, 250k rounds) `.json` and standalone `.html` backups—plus `GF(256)` 2-of-3 Shamir Recovery Cards (`FFG-1-...`)—as Web, macOS, iOS, Android, and Linux.
- **Single-File Portable `.exe`:** Can publish into one standalone `FamilyFieldGuide.exe` with no installer required.

## Build & Test on Windows

```powershell
cd native\windows
dotnet test FamilyGuide.Core.Tests\FamilyGuide.Core.Tests.csproj
dotnet run --project FamilyGuide.Windows\FamilyGuide.Windows.csproj
```

On GitHub, `.github/workflows/windows.yml` runs all xUnit tests and builds a single-file `FamilyFieldGuide.exe` artifact on `windows-latest`.
