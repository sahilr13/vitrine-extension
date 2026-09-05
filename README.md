<div align="center">
  
# 🪟 Vitrine
**A glassmorphic, hyper-productive new tab dashboard for developers.**

[![Chrome Extensions](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](#)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?style=for-the-badge&logo=googlechrome&logoColor=white)](#)
[![Local First](https://img.shields.io/badge/Storage-Local_First-8A2BE2?style=for-the-badge&logo=databricks&logoColor=white)](#)

*Vitrine transforms your default new tab into a calming, highly customizable bento grid. Drag and drop your bookmarks, monitor hardware usage, read live developer news, and route searches via keyboard—all locally, instantly, and without an account.*

<br/>

> **📷 Replace this block with a GIF or Screenshot of Vitrine in action!**
> *(e.g., `![Vitrine Demo](demo.gif)`)*

<br/>
</div>

---

<details open>
<summary><b>📖 Table of Contents</b></summary>

- [✨ Features](#-features)
- [⌨️ Keyboard Shortcuts](#️-keyboard-shortcuts)
- [📦 Installation (Developer Mode)](#-installation-developer-mode)
- [🛠️ Under the Hood](#️-under-the-hood)
- [👤 Author](#-author)

</details>

---

## ✨ Features

### 🍱 The Glass Bento Grid
Fully drag-and-drop enabled grid layout. Resize boards on the fly and customize the glassmorphism parameters (blur, opacity, accent colors, and background ink) in real-time.

### 🔍 Context-Aware Developer Search
The search bar isn't just for Google. Use shortcuts to instantly switch your search engine and hook directly into live APIs for real-time autocomplete suggestions.
*   **Google:** Native autocomplete.
*   **GitHub:** Live repository search and direct routing.
*   **StackOverflow:** Live question fetching via StackExchange API.
*   **MDN Web Docs:** Instant documentation links.

### 🎭 Multi-State "Bouncy" Widgets
Double-click any widget's header to toggle it between an **Expanded View** and a **Minimal View** using seamless CSS spring animations.
*   **News Feed:** Live scrolling feeds from `Dev.to`, `Hacker News`, and `r/webdev`.
*   **System Monitor:** Live CPU and Memory (RAM) tracking.
*   **Tasks / Notes:** Swap between a free-form scratchpad and an interactive checklist.
*   **Focus Timer:** A full Pomodoro interface that collapses into a tiny tracking pill.
*   **Calendar:** A full interactive grid that minimizes into a bold "Today" view.

### 🧘 Deep Focus Mode
Hide the noise. A single click blurs out the entire bento grid and search bar, replacing them with a massive, distraction-free clock overlay for deep coding sessions.

### 🖼️ Curated Aesthetics
Built-in local wallpaper library featuring high-resolution anime aesthetics, Studio Ghibli vibes, deep space cosmic art, and clean CSS gradients. 

---

## ⌨️ Keyboard Shortcuts

Navigate the dashboard without reaching for your mouse.

| Action | Shortcut |
| :--- | :--- |
| **Search Google** | <kbd>Alt</kbd> + <kbd>1</kbd> |
| **Search GitHub** | <kbd>Alt</kbd> + <kbd>2</kbd> |
| **Search StackOverflow** | <kbd>Alt</kbd> + <kbd>3</kbd> |
| **Search MDN Docs** | <kbd>Alt</kbd> + <kbd>4</kbd> |
| **Navigate Suggestions**| <kbd>↑</kbd> / <kbd>↓</kbd> |
| **Quick Save Current Tab**| *Configure in Chrome Extension Settings* |

---

## 📦 Installation (Developer Mode)

Because this extension uses Chrome's experimental system APIs, it is best loaded as an unpacked extension.

1. Clone this repository to your local machine:
   ```bash
   git clone [https://github.com/sahilr13/vitrine-extension.git](https://github.com/sahilr13/vitrine-extension.git)