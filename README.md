<p align="center">
  <img src="assets/icons/1024x1024.png" alt="osu! Skin Editor Logo" width="128" height="128">
</p>

<h1 align="center">osu! Skin Editor</h1>

<p align="center">
  <strong>A desktop app to easily customize your osu! skins</strong>
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

- **Cursor Editor** – Customize cursor images
- **HitCircle Editor** – Edit hitcircles and overlays with live preview
- **HitSounds Editor** – Change hitsounds and manage presets
- **skin.ini Editor** – Direct editing of skin.ini configuration
- **osu!lazer Support** – Skin editing mode for osu!lazer

---

## 📖 Usage

### 🖱️ Cursor

Customize cursor images.

| Action | Description |
|:--|:--|
| Add Image | Click the D&D area or drag & drop an image |
| Save to App | Save current skin's cursor image to the app |
| Apply | Apply the selected cursor image to the skin |
| Delete | Remove image from the app |

### ⭕ HitCircle

Customize the appearance of hitcircles. Preview changes on screen in real-time.

| Action | Description |
|:--|:--|
| Add Image | Click the D&D area or drag & drop an image |
| Save to App | Save current skin's hitcircle images to the app |
| Apply All | Apply both hitcircle and hitcircleoverlay simultaneously |
| Apply (Individual) | Apply each element individually |
| Delete | Remove image from the app |

**default-x (Numbers)**
- Change the numbers (0-9) displayed on hitcircles

**Preset Features**
- Use Save as Preset to save current skin's default-0 through default-9 as a preset
- Create presets from scratch by adding images individually

### 🔊 HitSounds

Change hitsounds for your skin.

| Action | Description |
|:--|:--|
| Select Preset | Choose and preview registered hitsounds |
| Save to App | Save current skin's hitsounds to the app |
| Apply | Apply selected hitsounds to the skin |
| Delete | Remove hitsounds from the app |

**Preset Features**
- Use Save as Preset to save current skin's hitsounds as a preset
- Create presets from scratch by adding audio files individually

### 📝 skin.ini

Directly edit the skin.ini configuration file.

| Action | Description |
|:--|:--|
| Apply | Apply all changes to the skin |
| Reload | Discard changes and reload skin.ini |

### 🎮 osu!lazer Mode

Skin editing mode designed for osu!lazer.

**How to Use**
1. Open the skin layout editor in osu!lazer
2. Click **Edit Externally**
3. Copy the path of the temporarily generated skin folder
4. Click the explorer button in the app header
5. Paste the copied path into the folder field

---

## 📥 Installation

### Download

Get the latest version from the [**Releases**](https://github.com/kottEy/osu-tools/releases) page.

| Platform | Download |
|:--|:--|
| **Windows** | `osu-Skin-Editor-Setup-x.x.x.exe` |

### Windows

1. Download the `.exe` installer
2. Run the installer
3. Choose the install location (default recommended)
4. Launch the app

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [osu!](https://osu.ppy.sh/) – Rhythm game
- [Electron React Boilerplate](https://electron-react-boilerplate.js.org/) – Project base
- [Electron](https://www.electronjs.org/) – Cross-platform desktop framework

