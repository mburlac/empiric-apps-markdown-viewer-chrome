# 🎨 Markdown Viewer — Showcase

> A heavy test file: emoji icons, complex Mermaid diagrams, tables, math, code, TOC, everything at once.

---

## 🧭 Overview

| Area | Status | Priority |
|------|:------:|---------:|
| 🚀 Rendering | ✅ Done | High |
| 🎨 Themes | ✅ Done | High |
| 📊 Diagrams | 🟡 Testing | Medium |
| 🔢 Math | 🟡 Testing | Medium |
| 🔒 Security | ✅ Done | Critical |
| 🐛 Edge cases | 🔴 Ongoing | Low |

---

## 🔀 Architecture — Flowchart

```mermaid
flowchart TD
  U([👤 User]) -->|opens .md| CHR[🌐 Chrome Tab]
  CHR --> DET{.md<br/>detected?}
  DET -- no --> PLAIN[Show plain text]
  DET -- yes --> EARLY[⚡ early.js<br/>hides pre]
  EARLY --> MAIN[📦 content.js<br/>document_end]
  MAIN --> RAW{raw<br/>available?}
  RAW -- yes, inline --> PARSE[📝 marked.parse]
  RAW -- empty --> SW[🛠️ Service Worker<br/>fetch URL]
  SW --> PARSE
  PARSE --> SAN[🛡️ DOMPurify<br/>sanitize]
  SAN --> STYLE[🎨 Apply theme + layout]
  STYLE --> HL[🌈 highlight.js]
  HL --> TOC{showTOC?}
  TOC -- yes --> BTOC[📑 Build sidebar]
  TOC -- no --> MERM
  BTOC --> MERM{enableMermaid?}
  MERM -- yes --> RMERM[📊 Mermaid render]
  MERM -- no --> KTX
  RMERM --> KTX{enableKatex?}
  KTX -- yes --> RKTX[🔢 KaTeX render]
  KTX -- no --> DONE
  RKTX --> DONE([✨ Rendered page])

  classDef decision fill:#fff4e5,stroke:#f59e0b,color:#7c2d12;
  classDef action fill:#e0f2fe,stroke:#0369a1,color:#0c4a6e;
  classDef done fill:#dcfce7,stroke:#16a34a,color:#14532d;
  class DET,RAW,TOC,MERM,KTX decision;
  class EARLY,MAIN,SW,PARSE,SAN,STYLE,HL,BTOC,RMERM,RKTX action;
  class DONE,PLAIN done;
```

---

## 🔁 Sequence — Boot flow

```mermaid
sequenceDiagram
  autonumber
  actor User as 👤 User
  participant Chrome as 🌐 Chrome
  participant Early as ⚡ early.js
  participant Main as 📦 content.js
  participant SW as 🛠️ ServiceWorker
  participant Store as 💾 chrome.storage

  User->>Chrome: open file.md
  Chrome->>Early: document_start
  Early->>Early: set data-md-detected
  Chrome->>Main: document_end
  par Parallel fetch
    Main->>Main: read <pre> innerText
  and
    Main->>Store: getSettings()
    Store-->>Main: { theme, showTOC, ... }
  end

  alt body empty
    Main->>SW: FETCH_TEXT { url }
    SW->>SW: fetch(url)
    SW-->>Main: { ok: true, text }
  end

  Main->>Main: marked.parse + sanitize
  Main->>Chrome: replace body innerHTML
  Main->>SW: DETECTED
  SW->>Chrome: setBadgeText("MD")
  Chrome-->>User: ✨ rendered page
```

---

## 🏛️ Class diagram — Settings model

```mermaid
classDiagram
  class Settings {
    <<interface>>
    +theme: ThemeName
    +maxWidth: Width
    +fontSize: Size
    +showTOC: boolean
    +enableMermaid: boolean
    +enableKatex: boolean
    +validate() boolean
  }

  class ThemeName {
    <<enum>>
    auto
    github-light
    github-dark
    sepia
    dracula
  }

  class Renderer {
    -rawText: string
    -settings: Settings
    +renderArticle() void
    +renderRaw() void
    +toggleView() void
  }

  class LazyLoader {
    <<abstract>>
    #loaded: boolean
    +load()* Promise
  }

  class MermaidLoader {
    +themeFor(t) string
    +render(root) Promise
  }

  class KatexLoader {
    +delimiters: Delimiter[]
    +render(root) Promise
  }

  Settings --> ThemeName
  Renderer --> Settings
  LazyLoader <|-- MermaidLoader
  LazyLoader <|-- KatexLoader
  Renderer ..> MermaidLoader : uses
  Renderer ..> KatexLoader : uses
```

---

## 🔄 State machine — View mode

```mermaid
stateDiagram-v2
  [*] --> Detecting
  Detecting --> Booting : data-md-detected
  Detecting --> [*] : no match
  Booting --> Rendered : parse success
  Booting --> Error : parse fail
  Rendered --> Raw : 🖱️ toolbar click
  Raw --> Rendered : 🖱️ toolbar click
  Rendered --> Rendered : setting change
  Error --> Rendered : retry
  Rendered --> [*] : tab closed
  Raw --> [*] : tab closed

  note right of Rendered
    Active: TOC, hljs,
    mermaid, katex
  end note
```

---

## 🗃️ ER diagram — Hypothetical schema

```mermaid
erDiagram
  USER ||--o{ DOCUMENT : owns
  USER {
    uuid id PK
    string email UK
    string name
    timestamp created_at
  }
  DOCUMENT ||--|{ REVISION : "has many"
  DOCUMENT {
    uuid id PK
    uuid owner_id FK
    string title
    string path
    timestamp updated_at
  }
  REVISION {
    uuid id PK
    uuid doc_id FK
    int version
    text content
    timestamp created_at
  }
  DOCUMENT }o--o{ TAG : "tagged with"
  TAG {
    uuid id PK
    string name UK
    string color
  }
```

---

## 📅 Gantt — Release schedule

```mermaid
gantt
  title Markdown Viewer roadmap
  dateFormat  YYYY-MM-DD
  axisFormat  %b %d

  section Phase 1
  Scaffold + manifest      :done, p1a, 2026-04-14, 1d
  Basic render             :done, p1b, after p1a, 1d

  section Phase 2
  Styling + themes         :done, p2a, 2026-04-15, 1d
  highlight.js             :done, p2b, after p2a, 1d

  section Phase 3
  Toggle + options         :done, p3a, 2026-04-16, 1d
  TOC sidebar              :done, p3b, after p3a, 1d

  section Phase 4
  Mermaid lazy             :active, p4a, 2026-04-16, 2d
  KaTeX lazy               :active, p4b, 2026-04-16, 2d
  Content-Type detection   :         p4c, after p4a, 3d

  section Release
  Store submission         :milestone, 2026-04-25, 0d
```

---

## 🥧 Pie chart — Bundle composition

```mermaid
pie showData
  title Vendor bundle breakdown (KB)
  "Mermaid" : 2778
  "highlight.js" : 122
  "KaTeX" : 275
  "DOMPurify" : 22
  "marked" : 35
  "KaTeX fonts (×20)" : 410
```

---

## 🗺️ User journey

```mermaid
journey
  title Reading a README for the first time
  section Discovery
    Click GitHub link: 5: User
    Browser loads .md : 3: Chrome
    Extension detects : 5: Extension
  section Reading
    See styled page   : 5: User
    Scan TOC sidebar  : 4: User
    Follow H2 links   : 5: User
  section Interaction
    Switch to dark    : 5: User, Extension
    Zoom into diagram : 4: User
    Toggle raw view   : 3: User
```

---

## 🌳 Git graph

```mermaid
gitGraph
  commit id: "init"
  commit id: "manifest + icons"
  branch phase-2
  checkout phase-2
  commit id: "themes"
  commit id: "highlight.js"
  checkout main
  merge phase-2
  branch phase-3
  checkout phase-3
  commit id: "toggle"
  commit id: "options"
  commit id: "TOC"
  checkout main
  merge phase-3
  branch phase-4
  checkout phase-4
  commit id: "mermaid"
  commit id: "katex"
  checkout main
  merge phase-4 tag: "v0.2.0"
```

---

## 🧠 Mindmap

```mermaid
mindmap
  root((🧩 Markdown<br/>Viewer))
    🎨 Styling
      Themes
        Auto
        GitHub Light
        GitHub Dark
        Sepia
        Dracula
      Typography
        System UI
        Serif for sepia
        Ligatures
      Layout
        Width
        Font size
    ⚙️ Features
      TOC
      Syntax HL
      Mermaid
      KaTeX
    🔒 Security
      DOMPurify
      No remote scripts
      Isolated world
    📦 Distribution
      Unpacked dev
      Chrome Web Store
```

---

## 📊 Quadrant chart

```mermaid
quadrantChart
  title Feature effort vs user value
  x-axis Low Effort --> High Effort
  y-axis Low Value --> High Value
  quadrant-1 Do it
  quadrant-2 Plan it
  quadrant-3 Skip
  quadrant-4 Reconsider
  "Themes": [0.25, 0.85]
  "TOC": [0.30, 0.75]
  "Mermaid": [0.65, 0.80]
  "KaTeX": [0.55, 0.60]
  "Print CSS": [0.20, 0.30]
  "Content-Type detection": [0.75, 0.55]
  "PDF export": [0.85, 0.35]
  "SPA nav support": [0.70, 0.20]
```

---

## 🔢 Math — when KaTeX is enabled

The Fourier transform:

$$\hat f(\xi) = \int_{-\infty}^{\infty} f(x)\, e^{-2\pi i x \xi}\, dx$$

Maxwell's equations in matter:

$$
\begin{aligned}
\nabla \cdot \mathbf{D} &= \rho_f \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{H} &= \mathbf{J}_f + \frac{\partial \mathbf{D}}{\partial t}
\end{aligned}
$$

Schrödinger's equation: $i\hbar \frac{\partial}{\partial t} \Psi = \hat{H} \Psi$.

---

## 💻 Code — many languages

### TypeScript

```typescript
interface Settings {
  theme: 'auto' | 'github-light' | 'github-dark' | 'sepia' | 'dracula';
  showTOC: boolean;
}

async function loadSettings(): Promise<Settings> {
  const s = await chrome.storage.sync.get({ theme: 'auto', showTOC: false });
  return s as Settings;
}
```

### Rust

```rust
fn render(input: &str) -> Result<String, RenderError> {
    let parsed = parse_markdown(input)?;
    let sanitized = sanitize(&parsed);
    Ok(sanitized)
}
```

### Python

```python
import asyncio
from typing import Optional

async def fetch_raw(url: str) -> Optional[str]:
    async with aiohttp.ClientSession() as s:
        async with s.get(url) as r:
            return await r.text() if r.ok else None
```

### SQL

```sql
SELECT d.title, count(r.id) AS revisions, max(r.created_at) AS last_edit
FROM document d
LEFT JOIN revision r ON r.doc_id = d.id
WHERE d.owner_id = $1
GROUP BY d.id
ORDER BY last_edit DESC NULLS LAST
LIMIT 20;
```

### Shell

```bash
#!/usr/bin/env bash
set -euo pipefail

for size in 16 32 48 128; do
  magick -background none -density 384 icon.svg -resize "${size}x${size}" "icon-${size}.png"
done
```

---

## ✅ Task list

- [x] Phase 1 — scaffold
- [x] Phase 2 — themes + highlight.js
- [x] Phase 3 — toggle + options + TOC
- [x] Phase 4 — Mermaid + KaTeX
- [ ] Chrome Web Store submission
- [ ] Firefox port
- [ ] Mobile Chrome test

---

## ⌨️ Keyboard reference

| Action | Shortcut |
|--------|----------|
| Toggle view | click <kbd>🧩</kbd> toolbar icon |
| Open options | right-click icon → Options |
| Reload extension | <kbd>⌘</kbd>+<kbd>R</kbd> on `chrome://extensions` |
| Hard refresh tab | <kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> |

---

## 📝 Blockquote variants

> 💡 **Tip** — enable TOC from Options for long documents.

> ⚠️ **Warning** — Mermaid bundle is 2.7MB; only enable if you use it.

> 🔒 **Security** — all rendering happens locally; no network calls outside vendor assets.

---

## 🎯 Footer

That's it. If every section above renders cleanly, the extension is healthy 🎉.
