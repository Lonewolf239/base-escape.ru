const GITHUB_OWNER = 'Lonewolf239';
let currentProject = '';
let releasesData = [];
let closeMobileMenu = () => {};

const i18n = {
    ru: { latest: 'Последний', prerelease: 'Пре-релиз', assets: 'Файлы для скачивания', downloads: 'скачиваний', empty: 'Релизов для этого проекта пока нет.', error: 'Ошибка загрузки: ', menu: '☰ Список релизов' },
    en: { latest: 'Latest', prerelease: 'Pre-release', assets: 'Assets', downloads: 'downloads', empty: 'No releases found for this project.', error: 'Error loading: ', menu: '☰ Releases List' },
    de: { latest: 'Neueste', prerelease: 'Pre-Release', assets: 'Dateien', downloads: 'Downloads', empty: 'Keine Releases für dieses Projekt gefunden.', error: 'Fehler beim Laden: ', menu: '☰ Releases-Liste' }
};

document.addEventListener('DOMContentLoaded', initReleases);

function initMobileMenu(lang, text) {
    const container = document.querySelector('.releases-container');
    if (!container) return;

    const burger = document.createElement('button');
    burger.className = 'burger-btn';
    burger.innerHTML = text.menu;
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

async function initReleases() {
    const params = new URLSearchParams(window.location.search);
    currentProject = params.get('project');
    const repoNameEl = document.getElementById('repo-name');

    const htmlLang = document.documentElement.lang || 'en';
    const lang = htmlLang.startsWith('en') ? 'en' : (htmlLang.startsWith('de') ? 'de' : 'ru');
    const text = i18n[lang];

    initMobileMenu(lang, text);

    if (!currentProject) {
        showError('Project not specified. Use ?project=...', text);
        return;
    }

    if(repoNameEl) repoNameEl.textContent = currentProject;

    await loadReleases(lang, text);
}

function showError(msg, text) {
    const sidebarList = document.getElementById('releases-sidebar-list');
    const content = document.getElementById('release-content');
    if (sidebarList) sidebarList.innerHTML = `<div class="error-message" style="padding: 12px; text-align: center;">${msg}</div>`;
    if (content) content.innerHTML = '';
}

function showLoader(show) {
    const sidebarList = document.getElementById('releases-sidebar-list');
    if (show && sidebarList) sidebarList.innerHTML = '<div class="loader" style="padding: 12px; text-align: center;">Loading...</div>';
}

async function loadReleases(lang, text) {
    showLoader(true);
    try {
        const githubPath = `https://api.github.com/repos/${GITHUB_OWNER}/${currentProject}/releases?per_page=100`;
        const url = `/github-proxy.php?path=${encodeURIComponent(githubPath)}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        releasesData = await response.json();
        const sidebarList = document.getElementById('releases-sidebar-list');

        if (!releasesData || releasesData.length === 0) {
            sidebarList.innerHTML = `<div class="empty-folder" style="padding: 12px; text-align: center;">${text.empty}</div>`;
            return;
        }

        renderSidebar(lang, text);
        renderReleaseContent(releasesData[0], lang, text);

    } catch (err) {
        console.error(err);
        showError(text.error + err.message, text);
    }
}

function renderSidebar(lang, text) {
    const sidebarList = document.getElementById('releases-sidebar-list');
    sidebarList.innerHTML = '';

    releasesData.forEach((release, index) => {
        const item = document.createElement('div');
        item.className = 'release-sidebar-item';
        if (index === 0) item.classList.add('active');

        const name = release.name || release.tag_name;
        item.textContent = name;

        item.addEventListener('click', () => {
            document.querySelectorAll('.release-sidebar-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            renderReleaseContent(release, lang, text);
            closeMobileMenu();
        });

        sidebarList.appendChild(item);
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function renderReleaseContent(release, lang, text) {
    const contentContainer = document.getElementById('release-content');
    if (!contentContainer) return;

    if (window.marked)
        marked.setOptions({ breaks: true, gfm: true });

    const date = new Date(release.published_at || release.created_at);
    const formattedDate = date.toLocaleDateString(
        lang === 'ru' ? 'ru-RU' : lang === 'de' ? 'de-DE' : 'en-US', 
        { year: 'numeric', month: 'long', day: 'numeric' }
    );

    let badgeHtml = '';
    if (release.prerelease)
        badgeHtml = `<span class="badge badge-prerelease">${text.prerelease}</span>`;
    else if (releasesData.indexOf(release) === 0)
        badgeHtml = `<span class="badge badge-latest">${text.latest}</span>`;

    let rawHtmlBody = release.body ? marked.parse(release.body) : '<i>No description</i>';
    let safeHtmlBody = window.DOMPurify ? DOMPurify.sanitize(rawHtmlBody) : rawHtmlBody;

    let assetsHtml = '';
    if (release.assets && release.assets.length > 0) {
        const assetsListHtml = release.assets.map(asset => {
            const size = formatFileSize(asset.size);
            const ext = asset.name.split('.').pop().toLowerCase();
            let icon = '📦';
            if (['zip', 'rar', 'tar', 'gz'].includes(ext)) icon = '🗜️';
            if (['exe', 'msi', 'apk'].includes(ext)) icon = '⚙️';
            if (['pdf', 'txt', 'md'].includes(ext)) icon = '📄';

            return `
                <a href="${asset.browser_download_url}" target="_blank" class="asset-item">
                    <div class="asset-info">
                        <span class="asset-icon">${icon}</span>
                        <span class="asset-name">${asset.name}</span>
                    </div>
                    <div class="asset-meta">
                        <span class="asset-stat">💾 ${size}</span>
                        <span class="asset-stat">⬇️ ${asset.download_count} ${text.downloads}</span>
                    </div>
                </a>
            `;
        }).join('');

        assetsHtml = `
            <div class="release-assets">
                <span class="assets-title">${text.assets}</span>
                ${assetsListHtml}
            </div>
        `;
    }

    contentContainer.innerHTML = `
        <div class="release-top">
            <div>
                <h3 class="release-title">
                    ${release.name || release.tag_name}
                    ${badgeHtml}
                </h3>
                <div class="release-meta" style="margin-top: 8px;">
                    <span class="release-tag">🏷️ ${release.tag_name}</span>
                    <span>•</span>
                    <span>📅 ${formattedDate}</span>
                    <span>•</span>
                    <a href="${release.author.html_url}" target="_blank" class="release-author">
                        <img src="${release.author.avatar_url}" alt="${release.author.login}">
                        ${release.author.login}
                    </a>
                </div>
            </div>
        </div>
        <div class="release-body markdown-body">
            ${safeHtmlBody}
        </div>
        ${assetsHtml}
    `;

    document.querySelectorAll('#release-content pre code').forEach((block) => {
        if(window.hljs) hljs.highlightElement(block);
    });
}
