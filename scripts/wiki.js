const wikiPagesCache = {};
let currentProject = '';
let pagesList = [];
let displayNames = [];
let closeMobileMenu = () => {};

document.addEventListener('DOMContentLoaded', initWiki);

function initMobileMenu() {
    const container = document.querySelector('.wiki-container');
    if (!container) return;

    const burger = document.createElement('button');
    burger.className = 'burger-btn';
    burger.innerHTML = '☰ Список страниц';
    container.insertBefore(burger, container.firstChild);

    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';

    container.appendChild(overlay);

    const sidebar = document.querySelector('.sidebar');

    function toggle() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    }

    closeMobileMenu = () => {
        if (sidebar && sidebar.classList.contains('active')) toggle();
    };

    burger.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);
}

async function initWiki() {
	initMobileMenu();
    const params = new URLSearchParams(window.location.search);
    const project = params.get('project');
    if (!project) {
        showError('Project not specified. Use the ?project=RepositoryName parameter');
        return;
    }
    currentProject = project;
    document.getElementById('repo-name').textContent = project;
    await loadWikiPages();
}

async function loadWikiPages() {
    showLoader(true);
    try {
        const indexUrl = `/wiki/${currentProject}/index.json`;
        const response = await fetch(indexUrl);
        if (!response.ok) throw new Error(`index.json not found for the project ${currentProject}`);
        const rawPagesList = await response.json();
        if (!Array.isArray(rawPagesList) || rawPagesList.length === 0)
            throw new Error('The page list is empty or invalid');
        pagesList = [...rawPagesList];
        displayNames = rawPagesList.map(name => name.replace(/-/g, ' '));
        renderPagesList(displayNames);
        const homeIndex = displayNames.findIndex(name => name === 'Home');
        const defaultPageIndex = homeIndex !== -1 ? homeIndex : 0;
        await loadPage(displayNames[defaultPageIndex]);
    } catch (err) {
        console.error(err);
        showError('Error loading wiki: ' + err.message);
    } finally { showLoader(false); }
}

function renderPagesList(pages) {
    const container = document.getElementById('pages-list');
    if (!container) return;
    container.innerHTML = '';
    pages.forEach(page => {
        const div = document.createElement('div');
        div.className = 'wiki-page-item';
        div.textContent = page;
        div.addEventListener('click', async () => {
            await loadPage(page);
			closeMobileMenu();
        });
        container.appendChild(div);
    });
}

function transliterate(text) {
    const map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
        'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '',
        'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };
    return text.split('').map(ch => map[ch] || ch).join('');
}

function normalizePageName(pageName) {
    return pageName.trim().replace(/ /g, '-');
}

function getPossibleFileNames(displayName) {
    const normalized = normalizePageName(displayName);
    const translit = transliterate(normalized);
    const lowerNormalized = normalized.toLowerCase();
    const lowerTranslit = translit.toLowerCase();
    const candidates = [normalized, translit, lowerNormalized, lowerTranslit];
    const unique = [...new Set(candidates.filter(s => s.length > 0))];
    return unique.flatMap(name => [name, encodeURIComponent(name)]);
}

async function loadPage(pageName) {
    const contentDiv = document.getElementById('wiki-content');
    if (!contentDiv) return;
    showLoaderInContent(true);
    try {
        let content = wikiPagesCache[pageName];
        if (!content) {
            const possibleNames = getPossibleFileNames(pageName);
            const urls = possibleNames.map(name => `/wiki/${currentProject}/${name}.md`);
            let response = null;
            let lastError = null;
            for (const url of urls) {
                try {
                    response = await fetch(url);
                    if (response.ok) break;
                    if (response.status === 404) {
                        lastError = new Error(`HTTP 404 – file not found (${url})`);
                        continue;
                    }
                    throw new Error(`HTTP ${response.status}`);
                }
                catch (err) { lastError = err; }
            }
            if (!response || !response.ok) throw lastError || new Error('Failed to load page');
            content = await response.text();
            wikiPagesCache[pageName] = content;
        }
        await displayMarkdown(content, pageName);
        updateActivePage(pageName);
    } catch (err) {
		console.error(err);
		const safeMessage = escapeHtml(err.message);
		contentDiv.innerHTML = `<div class="error-message">Page loading error: ${safeMessage}</div>`;
    } finally { showLoaderInContent(false); }
}

function updateActivePage(pageName) {
    const items = document.querySelectorAll('.wiki-page-item');
    items.forEach(item => {
        if (item.textContent === pageName) item.classList.add('active');
        else item.classList.remove('active');
    });
}

function processWikiLinks(markdown) {
    const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    return markdown.replace(wikiLinkRegex, (match, pageName, displayText) => {
        const trimmedPage = pageName.trim();
        const normalizedLink = normalizePageName(trimmedPage);
        const matchingNormalized = pagesList.find(p => {
            const pLower = p.toLowerCase();
            const normalizedLinkLower = normalizedLink.toLowerCase();
            const translitNormalized = transliterate(p);
            const translitNormalizedLower = translitNormalized.toLowerCase();
            const translitLink = transliterate(normalizedLink);
            const translitLinkLower = translitLink.toLowerCase();
            return p === normalizedLink ||
                   pLower === normalizedLinkLower ||
                   translitNormalized === translitLink ||
                   translitNormalizedLower === translitLinkLower;
        });
        const text = displayText ? displayText.trim() : trimmedPage;
        if (matchingNormalized) {
            const index = pagesList.findIndex(p => p === matchingNormalized);
            const displayPageName = index !== -1 ? displayNames[index] : trimmedPage;
            const safePage = escapeHtml(displayPageName);
            return `<a href="#" class="wiki-link" data-page="${safePage}">${escapeHtml(text)}</a>`;
        } else return `<span class="wiki-link-missing">${escapeHtml(text)}</span>`;
    });
}

async function displayMarkdown(markdown, pageName) {
	const contentDiv = document.getElementById('wiki-content');
    if (!contentDiv) return;
    const processedMarkdown = processWikiLinks(markdown);
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang))
                    return hljs.highlight(code, { language: lang }).value;
                return hljs.highlightAuto(code).value;
            }
        });
    }
    const html = marked.parse(processedMarkdown);
    contentDiv.innerHTML = html;
    processExternalLinks();
    if (typeof hljs !== 'undefined') {
        document.querySelectorAll('#wiki-content pre code').forEach(block => {
            hljs.highlightElement(block);
        });
    }
    attachWikiLinkHandlers();
    const currentFileSpan = document.getElementById('current-file');
    if (currentFileSpan) currentFileSpan.textContent = pageName;
}

function processExternalLinks() {
    const links = document.querySelectorAll('#wiki-content a');
    links.forEach(link => {
        if (!link.classList.contains('wiki-link') && !link.hasAttribute('data-processed')) {
            const href = link.getAttribute('href');
            if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
                link.setAttribute('data-processed', 'true');
            }
        }
    });
}

function attachWikiLinkHandlers() {
    const links = document.querySelectorAll('.wiki-link');
    links.forEach(link => {
        link.removeEventListener('click', wikiLinkClickHandler);
        link.addEventListener('click', wikiLinkClickHandler);
    });
}

async function wikiLinkClickHandler(e) {
    e.preventDefault();
    const pageName = this.getAttribute('data-page');
    if (pageName && displayNames.includes(pageName))
        await loadPage(pageName);
}

function showLoader(show) {
    const container = document.getElementById('pages-list');
    if (!container) return;
    if (show) container.innerHTML = '<div class="loader">Loading list of pages...</div>';
}

function showLoaderInContent(show) {
    const container = document.getElementById('wiki-content');
    if (!container) return;
    if (show) container.innerHTML = '<div class="loader">Page loading...</div>';
}

function showError(message) {
    const pagesContainer = document.getElementById('pages-list');
    const contentDiv = document.getElementById('wiki-content');
    if (pagesContainer) pagesContainer.innerHTML = `<div class="error-message">${escapeHtml(message)}</div>`;
    if (contentDiv) contentDiv.innerHTML = `<div class="error-message">${escapeHtml(message)}</div>`;
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}
