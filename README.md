<p align="center">
  <img src="assets/icons/256x256.png" alt="osu! Skin Editor Logo" width="128" height="128">
</p>

<h1 align="center">osu! Skin Editor</h1>

<p align="center">
  <strong>🎨 A desktop app to easily customize your osu! skins</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#development">Development</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/electron-35.0-47848F?style=flat-square&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/react-19.0-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/typescript-5.8-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
</p>

---

## ✨ Features

<table>
  <tr>
    <td align="center" width="25%">
      <img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Computer%20mouse/3D/computer_mouse_3d.png" width="64"><br>
      <strong>Cursor Editor</strong><br>
      <sub>Customize cursor and cursor trail</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Red%20circle/3D/red_circle_3d.png" width="64"><br>
      <strong>Hitcircle Editor</strong><br>
      <sub>Edit hitcircles and overlays</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Input%20numbers/3D/input_numbers_3d.png" width="64"><br>
      <strong>Number Presets</strong><br>
      <sub>Create and manage combo number presets</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Speaker%20high%20volume/3D/speaker_high_volume_3d.png" width="64"><br>
      <strong>Hitsound Editor</strong><br>
      <sub>Customize hitsounds</sub>
    </td>
  </tr>
</table>

### 🎯 Highlights

- **🖱️ Cursor customization** – Drag & drop to update cursor images
- **⭕ Hitcircle editing** – Edit hitcircles and overlays with real-time preview
- **🔢 Number presets** – Create and manage presets for digits 0–9
- **🔊 Hitsound setup** – Apply custom hitsounds
- **📁 Multi-skin support** – Automatically detects skins in your osu! folder
- **💾 Preset saving** – Save your favorite settings as presets
- **🎨 Real-time preview** – See changes immediately

---

## 📥 Installation

### Download

Get the latest version from the [**Releases**](https://github.com/kty78/osu-skin-editor/releases) page.

| Platform | Download |
|:--|:--|
| **Windows** | `osu-Skin-Editor-Setup-x.x.x.exe` |
| **macOS** | `osu-Skin-Editor-x.x.x.dmg` |
| **Linux** | `osu-Skin-Editor-x.x.x.AppImage` |

### Windows

1. Download the `.exe` installer
2. Run the installer
3. Choose the install location (default recommended)
4. Launch the app

### macOS

1. Download the `.dmg`
2. Open the DMG
3. Drag the app into the Applications folder
4. On first launch, allow the app in macOS Security settings if prompted

### Linux

1. Download the `.AppImage`
2. Make it executable: `chmod +x osu-Skin-Editor-*.AppImage`
3. Run the file

---

## 🚀 Usage

### First-time setup

1. **Launch the app**
2. **Select your osu! folder** – Set your osu! installation folder in Settings
3. **Choose a skin** – Pick the skin you want to edit from the dropdown

### Editing the cursor

1. Select **Cursor** from the sidebar
2. Browse presets in the carousel
3. Drag & drop a new image to upload
4. Click **Apply** to write changes to the skin

### Editing hitcircles

1. Select **Hitcircle** from the sidebar
2. Edit hitcircle / overlay / numbers independently
3. Check the preview area
4. Click **Apply** for each section

---

## 🛠️ Development

### Requirements

- Node.js 18.x+
- npm 9.x+

### Setup

```bash
# Clone the repo
git clone https://github.com/kty78/osu-skin-editor.git
cd osu-skin-editor

# Install dependencies
npm install

# Start in development mode
npm start
```

### Build

```bash
# Production build
npm run build

# Package for distribution
npm run package
```

### Project structure

```
src/
├── main/           # Electron main process
│   ├── services/   # Backend services
│   └── ipcHandlers/# IPC handlers
├── renderer/       # React frontend
│   ├── components/ # UI components
│   ├── pages/      # Pages
│   ├── hooks/      # Custom hooks
│   └── context/    # React context
└── shared/         # Shared types
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [osu!](https://osu.ppy.sh/) – Rhythm game
- [Electron React Boilerplate](https://electron-react-boilerplate.js.org/) – Project base
- [Electron](https://www.electronjs.org/) – Cross-platform desktop framework

---

<p align="center">
  Made with ❤️ for the osu! community
</p>
