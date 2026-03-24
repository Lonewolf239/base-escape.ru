[![Website](https://img.shields.io/badge/website-base--escape.ru-2D2D2D?style=for-the-badge&logo=google-chrome&logoColor=FFFFFF)](https://base-escape.ru)
[![GitHub](https://img.shields.io/badge/GitHub-Lonewolf239-2D2D2D?style=for-the-badge&logo=github&logoColor=FFFFFF)](https://github.com/Lonewolf239)
[![License](https://img.shields.io/badge/License-MIT-2D2D2D?style=for-the-badge&logo=open-source-initiative&logoColor=FFFFFF)](./LICENSE)

# Lonewolf239 — Personal Website

Personal developer portfolio with multilingual support (RU/EN/DE), embedded GitHub code viewer, and project wiki system.

**Live:** [base-escape.ru](https://base-escape.ru)

---

## Features

| | Feature | Details |
|---|---------|---------|
| 🌍 | **Multilingual** | Automatic language detection (browser/URL) + manual switcher. Supports RU, EN, DE. |
| 📦 | **Dynamic projects** | Project cards loaded from `projects.json`. No rebuild needed to add/update projects. |
| 🔍 | **GitHub code viewer** | Browse repository files via GitHub API. Syntax highlighting, image preview, binary detection. |
| 📖 | **Project Wiki** | Markdown-based documentation with internal `[[Wiki Links]]` and syntax highlighting. |
| 🎨 | **Retro aesthetic** | Custom synthwave theme: animated grid, sun pulse, glitch effects, custom scrollbar. |
| 🛡️ | **Security rules** | Apache `.htaccess` blocks access to `.json`, `.env`, `.log`, hidden files, and directory listing. |
| 🧩 | **Zero dependencies** | Vanilla JS + CSS. No frameworks, no build step. |
| 📱 | **Responsive** | Mobile-friendly layout with adaptive grid and touch controls. |

---

## Project Structure

```
/
├── index.html          # Root redirect (language detection)
├── projects.json       # Projects database (blocked from direct access)
├── .htaccess           # Apache security rules
├── ru/                 # Russian version
├── en/                 # English version
├── de/                 # German version
├── styles/             # CSS modules
├── scripts/            # JS modules
├── images/             # Icons and assets
└── wiki/               # Wiki markdown files (per project)
```

---

## Quick Start

### Local development

1. Clone the repository:
```bash
git clone https://github.com/Lonewolf239/lonewolf239.github.io
cd lonewolf239.github.io
```

2. Serve locally (requires Apache with `.htaccess` support for accurate testing):
```bash
# Using PHP's built-in server (no .htaccess)
php -S localhost:8000

# Or use Apache with Docker
docker run -p 8080:80 -v "$PWD":/var/www/html php:apache
```

3. Open `http://localhost:8000`

### Adding a new project

Edit `projects.json`:

```json
{
    "title": {
        "ru": "Название",
        "en": "Title",
        "de": "Titel"
    },
    "description": {
        "ru": "Описание на русском",
        "en": "Description in English",
        "de": "Beschreibung auf Deutsch"
    },
    "language": "C#",
    "lastRelease": "2026-03-24",
    "tags": ["Tag1", "Tag2"],
    "links": {
        "github": "https://github.com/...",
        "code": {
            "url": {
                "ru": "/ru/viewer?project=RepoName",
                "en": "/en/viewer?project=RepoName",
                "de": "/de/viewer?project=RepoName"
            },
            "newTab": false
        }
    }
}
```

### Adding wiki pages

1. Create `/wiki/ProjectName/`
2. Add `index.json` with page list: `["Home", "Setup", "API"]`
3. Add `.md` files (e.g., `Home.md`, `Setup.md`)
4. Use `[[Wiki Links]]` for internal navigation

---

## API & Integration

### GitHub API (no token required)

- Fetches file tree and content from public repositories
- Rate-limited to 60 req/hour (unauthenticated)
- Supports images, binary detection, and syntax highlighting

### Language detection

Priority:
1. URL path (`/en/...`)
2. Browser `navigator.language`
3. Fallback to English

---

## Deployment

The site is static — deploy to any static hosting:

- **GitHub Pages**
- **Netlify / Vercel**
- **Any Apache/Nginx server**

⚠️ **Note:** `.htaccess` only works on Apache. For Nginx, manually configure:
```nginx
location = /projects.json { return 403; }
location ~ /\. { return 403; }
location ~ /(downloads|scripts|styles)/ { autoindex off; }
```

---

## License

MIT © [Lonewolf239](https://github.com/Lonewolf239)
