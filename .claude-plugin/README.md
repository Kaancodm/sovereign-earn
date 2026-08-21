# Anthropic Agent Skills (Plugin-Bundle)

Dieser Ordner enthält **19 Anthropic-Skills** als **Claude-Code-Plugin** für die
Sovereign-Earn-Entwicklung. Quelle: https://github.com/anthropics/skills

## Was sind Skills?

Skills sind wiederverwendbare Instruktions-Bundles mit Beispielen und Helper-Scripts.
Claude Code lädt sie **on-demand**, wenn eine Coding-Aufgabe zum Skill passt.

## Installation im Editor (Claude Code)

Im Sovereign-Earn-Projekt einfach:

```
/plugin install anthropic-agent-skills@sovereign-skills
```

Oder vorher Marketplace hinzufügen:

```
/plugin marketplace add ./sovereign-earn/.claude-plugin
```

## Enthaltene Skills (19)

### 🎨 Design & Visual
| Skill | Wofür |
|---|---|
| `frontend-design` | Distinctive UI-Design (Typography, Layout, Farbpalette) |
| `theme-factory` | 10 vorgefertigte Themes + Custom-Theme-Generator |
| `brand-guidelines` | Anthropic Brand-Colors/Typography |
| `canvas-design` | PNG/PDF-Poster & Artwork |
| `algorithmic-art` | Generative Kunst mit p5.js |

### 📄 Dokument-Generierung (source-available, NICHT Apache 2.0)
| Skill | Wofür |
|---|---|
| `pdf` | PDFs lesen, erstellen, zusammenfügen, Formulare, OCR |
| `docx` | Word-Dokumente mit Tabellen, Headings, Tracked Changes |
| `pptx` | PowerPoint-Decks erstellen/editieren |
| `xlsx` | Excel-Sheets lesen, Formeln, Diagramme |

### 🛠️ Development & Testing
| Skill | Wofür |
|---|---|
| `webapp-testing` | Playwright-Toolkit für UI-Tests, Screenshots, Logs |
| `web-artifacts-builder` | Komplexe React/Tailwind/shadcn-Artefakte |
| `mcp-builder` | MCP-Server (Python FastMCP / Node MCP SDK) |
| `skill-creator` | Eigene Skills erstellen + testen |
| `claude-api` | Claude API SDK-Nutzung |

### 📢 Kommunikation
| Skill | Wofür |
|---|---|
| `doc-coauthoring` | Strukturierte Docs gemeinsam schreiben |
| `internal-comms` | Status-Reports, Leadership-Updates, 3P, Newsletters |
| `slack-gif-creator` | Optimierte Slack-GIFs erstellen |
| `discernment-nudge` | Subtile Qualitäts-Push-Back-Patterns |
| `academy-guide` | Anthropic-Academy Content-Standards |

## Lizenz-Hinweis

- **15 Skills:** Apache 2.0 (offen)
- **4 Dokument-Skills (docx/pdf/pptx/xlsx):** Source-available, **NICHT** Apache 2.0.
  → Siehe jeweilige `LICENSE.txt` im Skill-Ordner.

Die Lizenzen werden unverändert aus dem Original-Repo übernommen – siehe
`THIRD_PARTY_NOTICES.md` im Repo-Root (optional nach `./` verlinkt).

## Hinweise

- **Größe:** ~12 MB, 411 Dateien (hauptsächlich PDF-Validatoren und p5.js-Beispiele)
- **Self-contained:** Jeder Skill hat eigene Scripts – kein globaler Install nötig
- **On-demand:** Skills werden nur geladen, wenn das Coding-Topic passt
- **Co-existiert** mit Firebase Functions: `.claude/` ist nicht Teil von `npm run deploy`
