const GITHUB_OWNER = "Lonewolf239";
let currentProject = "";
let listData = [];
let closeMobileMenu = () => {};

let currentPage = 1;
let currentMode = "releases";
const PER_PAGE = 30;

const i18n = {
    ru: {
        latest: "Последний",
        prerelease: "Пре-релиз",
        assets: "Файлы для скачивания",
        downloads: "скачиваний",
        empty: "Ни релизов, ни коммитов не найдено.",
        error: "Ошибка загрузки: ",
        menu: "☰ Список",
        prev: "◄ Назад",
        next: "Вперед ►",
        page: "Стр.",
        commit: "Коммит",
        commits_mode: "Релизов нет. Показаны коммиты:",
        show_changes: "Показать изменения",
        hide_changes: "Скрыть изменения",
        loading_diff: "Загрузка изменений...",
        view_commit: "Посмотреть коммит",
        back_to_release: "◄ Назад к релизу",
        no_changed_files: "Нет измененных файлов.",
        binary_file: "Бинарный файл или изменения недоступны для отображения.",
    },
    en: {
        latest: "Latest",
        prerelease: "Pre-release",
        assets: "Assets",
        downloads: "downloads",
        empty: "No releases or commits found.",
        error: "Error loading: ",
        menu: "☰ List",
        prev: "◄ Prev",
        next: "Next ►",
        page: "Page",
        commit: "Commit",
        commits_mode: "No releases. Showing commits:",
        show_changes: "Show changes",
        hide_changes: "Hide changes",
        loading_diff: "Loading diff...",
        view_commit: "View Commit",
        back_to_release: "◄ Back to Release",
        no_changed_files: "No changed files found.",
        binary_file: "Binary file or changes unavailable for display.",
    },
    de: {
        latest: "Neueste",
        prerelease: "Pre-Release",
        assets: "Dateien",
        downloads: "Downloads",
        empty: "Keine Releases oder Commits gefunden.",
        error: "Fehler beim Laden: ",
        menu: "☰ Liste",
        prev: "◄ Zurück",
        next: "Weiter ►",
        page: "Seite",
        commit: "Commit",
        commits_mode: "Keine Releases. Zeige Commits:",
        show_changes: "Änderungen anzeigen",
        hide_changes: "Änderungen verbergen",
        loading_diff: "Lade Änderungen...",
        view_commit: "Commit ansehen",
        back_to_release: "◄ Zurück zum Release",
        no_changed_files: "Keine geänderten Dateien gefunden.",
        binary_file: "Binärdatei oder Änderungen nicht anzeigbar.",
    },
};

document.addEventListener("DOMContentLoaded", initReleases);

function initMobileMenu(lang, text) {
    const container = document.querySelector(".page-container");
    if (!container) return;

    const burger = document.createElement("button");
    burger.className = "burger-btn";
    burger.innerHTML = text.menu;
    container.insertBefore(burger, container.firstChild);

    const overlay = document.createElement("div");
    overlay.className = "mobile-overlay";
    container.appendChild(overlay);

    const sidebar = document.querySelector(".sidebar");

    function toggle() {
        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
        document.body.style.overflow = sidebar.classList.contains("active")
            ? "hidden"
            : "";
    }

    closeMobileMenu = () => {
        if (sidebar && sidebar.classList.contains("active")) toggle();
    };

    burger.addEventListener("click", toggle);
    overlay.addEventListener("click", toggle);
}

async function initReleases() {
    const params = new URLSearchParams(window.location.search);
    currentProject = params.get("project");
    const repoNameEl = document.getElementById("repo-name");

    const htmlLang = document.documentElement.lang || "en";
    const lang = htmlLang.startsWith("en")
        ? "en"
        : htmlLang.startsWith("de")
          ? "de"
          : "ru";
    const text = i18n[lang];

    initMobileMenu(lang, text);

    if (!currentProject) {
        showError("Project not specified. Use ?project=...", text);
        return;
    }

    if (repoNameEl) repoNameEl.textContent = currentProject;

    await loadPage(1, lang, text);
}

function showError(msg, text) {
    const sidebarList = document.getElementById("releases-sidebar-list");
    const content = document.getElementById("release-content");
    if (sidebarList)
        sidebarList.innerHTML = `<div class="error-message" style="padding: 12px; text-align: center;">${msg}</div>`;
    if (content) content.innerHTML = "";
}

function showLoader(show) {
    const sidebarList = document.getElementById("releases-sidebar-list");
    if (show && sidebarList)
        sidebarList.innerHTML =
            '<div class="loader" style="padding: 12px; text-align: center;">Loading...</div>';
}

async function loadPage(page, lang, text) {
    showLoader(true);
    currentPage = page;

    try {
        if (currentMode === "releases") {
            const relPath = `https://api.github.com/repos/${GITHUB_OWNER}/${currentProject}/releases?per_page=${PER_PAGE}&page=${page}`;
            const relRes = await fetch(
                `/github-proxy.php?path=${encodeURIComponent(relPath)}`,
            );
            if (!relRes.ok) throw new Error(`HTTP ${relRes.status}`);
            listData = await relRes.json();

            if (page === 1 && (!listData || listData.length === 0))
                currentMode = "commits";
        }

        if (currentMode === "commits") {
            const comPath = `https://api.github.com/repos/${GITHUB_OWNER}/${currentProject}/commits?per_page=${PER_PAGE}&page=${page}`;
            const comRes = await fetch(
                `/github-proxy.php?path=${encodeURIComponent(comPath)}`,
            );
            if (!comRes.ok) throw new Error(`HTTP ${comRes.status}`);
            listData = await comRes.json();
        }

        const sidebarList = document.getElementById("releases-sidebar-list");

        if (!listData || listData.length === 0) {
            if (page === 1) {
                sidebarList.innerHTML = `<div class="empty-folder" style="padding: 12px; text-align: center;">${text.empty}</div>`;
                document.getElementById("release-content").innerHTML = "";
            } else {
                currentPage--;
                showLoader(false);
            }
            return;
        }

        renderSidebar(lang, text);

        if (listData.length > 0) {
            if (currentMode === "releases")
                renderReleaseContent(listData[0], lang, text);
            else renderCommitContent(listData[0], lang, text);
        }
    } catch (err) {
        console.error(err);
        showError(text.error + err.message, text);
    }
}

function renderSidebar(lang, text) {
    const sidebarList = document.getElementById("releases-sidebar-list");
    sidebarList.innerHTML = "";

    if (currentMode === "commits") {
        const notice = document.createElement("div");
        notice.style.padding = "8px 12px";
        notice.style.fontSize = "0.8rem";
        notice.style.color = "#ffb347";
        notice.style.borderBottom = "1px dashed rgba(255,179,71,0.3)";
        notice.style.marginBottom = "8px";
        notice.style.textAlign = "center";
        notice.textContent = text.commits_mode;
        sidebarList.appendChild(notice);
    }

    listData.forEach((itemData, index) => {
        const item = document.createElement("div");
        item.className = "release-sidebar-item";
        if (index === 0) item.classList.add("active");

        let name = "";
        if (currentMode === "releases")
            name = itemData.name || itemData.tag_name;
        else name = itemData.commit.message.split("\n")[0];
        item.textContent = name || "Untitled";

        item.addEventListener("click", () => {
            document
                .querySelectorAll(".release-sidebar-item")
                .forEach((el) => el.classList.remove("active"));
            item.classList.add("active");

            if (currentMode === "releases")
                renderReleaseContent(itemData, lang, text);
            else renderCommitContent(itemData, lang, text);

            closeMobileMenu();
        });

        sidebarList.appendChild(item);
    });

    renderPagination(lang, text);
}

function renderPagination(lang, text) {
    let sidebar = document.querySelector(".sidebar");
    let pagination = document.getElementById("sidebar-pagination");

    if (!pagination) {
        pagination = document.createElement("div");
        pagination.id = "sidebar-pagination";
        pagination.className = "sidebar-footer";
        sidebar.appendChild(pagination);
    }

    pagination.innerHTML = `
        <button id="page-prev" class="pagination-btn" ${currentPage === 1 ? "disabled" : ""}>${text.prev}</button>
        <span class="page-label">${text.page} ${currentPage}</span>
        <button id="page-next" class="pagination-btn" ${listData.length < PER_PAGE ? "disabled" : ""}>${text.next}</button>
    `;

    document.getElementById("page-prev").addEventListener("click", () => {
        if (currentPage > 1) loadPage(currentPage - 1, lang, text);
    });

    document.getElementById("page-next").addEventListener("click", () => {
        if (listData.length === PER_PAGE) loadPage(currentPage + 1, lang, text);
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function renderReleaseContent(release, lang, text) {
    const contentContainer = document.getElementById("release-content");
    if (!contentContainer) return;

    if (window.marked) marked.setOptions({ breaks: true, gfm: true });

    const date = new Date(release.published_at || release.created_at);
    const formattedDate = date.toLocaleDateString(
        lang === "ru" ? "ru-RU" : lang === "de" ? "de-DE" : "en-US",
        { year: "numeric", month: "long", day: "numeric" },
    );

    let badgeHtml = "";
    if (release.prerelease)
        badgeHtml = `<span class="badge badge-prerelease">${text.prerelease}</span>`;
    else if (currentPage === 1 && listData.indexOf(release) === 0)
        badgeHtml = `<span class="badge badge-latest">${text.latest}</span>`;

    let rawHtmlBody = release.body
        ? marked.parse(release.body)
        : "<i>No description</i>";
    let safeHtmlBody = window.DOMPurify
        ? DOMPurify.sanitize(rawHtmlBody)
        : rawHtmlBody;

    let assetsHtml = "";
    if (release.assets && release.assets.length > 0) {
        const assetsListHtml = release.assets
            .map((asset) => {
                const size = formatFileSize(asset.size);
                const safeAssetName = escapeHtml(asset.name);
                const ext = safeAssetName.split(".").pop().toLowerCase();
                let icon = "📦";
                if (["zip", "rar", "tar", "gz"].includes(ext)) icon = "🗜️";
                if (["exe", "msi", "apk"].includes(ext)) icon = "⚙️";
                if (["pdf", "txt", "md"].includes(ext)) icon = "📄";

                return `
                <a href="${escapeHtml(asset.browser_download_url)}" target="_blank" class="asset-item">
                    <div class="asset-info">
                        <span class="asset-icon">${icon}</span>
                        <span class="asset-name">${safeAssetName}</span>
                    </div>
                    <div class="asset-meta">
                        <span class="asset-stat">💾 ${size}</span>
                        <span class="asset-stat">⬇️ ${asset.download_count} ${text.downloads}</span>
                    </div>
                </a>
            `;
            })
            .join("");

        assetsHtml = `
            <div class="release-assets">
                <span class="assets-title">${text.assets}</span>
                ${assetsListHtml}
            </div>
        `;
    }

    const safeReleaseName = escapeHtml(release.name || release.tag_name);
    const safeTagName = escapeHtml(release.tag_name);
    const safeAuthorUrl = escapeHtml(release.author.html_url);
    const safeAuthorAvatar = escapeHtml(release.author.avatar_url);
    const safeAuthorLogin = escapeHtml(release.author.login);

    contentContainer.innerHTML = `
        <div class="release-top">
            <div>
                <h3 class="release-title">
                    ${safeReleaseName}
                    ${badgeHtml}
                </h3>
                <div class="release-meta" style="margin-top: 8px;">
                    <span class="release-tag">🏷️ ${safeTagName}</span>
                    <span>•</span>
                    <button id="view-release-commit-btn" class="pagination-btn" style="padding: 2px 8px; font-size: 0.8rem; border-radius: 6px;">${text.view_commit}</button>
                    <span>•</span>
                    <span>📅 ${formattedDate}</span>
                    <span>•</span>
                    <a href="${safeAuthorUrl}" target="_blank" class="release-author">
                        <img src="${safeAuthorAvatar}" alt="${safeAuthorLogin}">
                        ${safeAuthorLogin}
                    </a>
                </div>
            </div>
        </div>
        <div class="release-body markdown-body">
            ${safeHtmlBody}
        </div>
        ${assetsHtml}
    `;

    document.querySelectorAll("#release-content pre code").forEach((block) => {
        if (window.hljs) hljs.highlightElement(block);
    });

    const viewCommitBtn = document.getElementById("view-release-commit-btn");
    if (viewCommitBtn) {
        viewCommitBtn.addEventListener("click", () => {
            fetchAndRenderReleaseCommit(release, lang, text);
        });
    }
}

async function fetchAndRenderReleaseCommit(release, lang, text) {
    const contentContainer = document.getElementById("release-content");
    contentContainer.innerHTML = `<div class="loader" style="padding: 20px; text-align: center;">Loading commit...</div>`;

    try {
        const commitPath = `https://api.github.com/repos/${GITHUB_OWNER}/${currentProject}/commits/${release.tag_name}`;
        const res = await fetch(
            `/github-proxy.php?path=${encodeURIComponent(commitPath)}`,
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const commitData = await res.json();

        renderCommitContent(commitData, lang, text, () =>
            renderReleaseContent(release, lang, text),
        );
    } catch (err) {
        console.error(err);
        contentContainer.innerHTML = `<div class="error-message" style="text-align:center; padding: 20px;">${text.error} ${err.message}</div>`;

        const backBtn = document.createElement("button");
        backBtn.className = "pagination-btn";
        backBtn.style.marginTop = "16px";
        backBtn.textContent = text.back_to_release;
        backBtn.onclick = () => renderReleaseContent(release, lang, text);
        contentContainer.appendChild(backBtn);
    }
}

function renderCommitContent(commitItem, lang, text, onBack = null) {
    const contentContainer = document.getElementById("release-content");
    if (!contentContainer) return;

    const date = new Date(commitItem.commit.author.date);
    const formattedDate = date.toLocaleDateString(
        lang === "ru" ? "ru-RU" : lang === "de" ? "de-DE" : "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        },
    );

    let rawMsg = commitItem.commit.message || "No commit message";
    let safeHtmlBody = window.DOMPurify
        ? DOMPurify.sanitize(rawMsg.replace(/\n/g, "<br>"))
        : escapeHtml(rawMsg).replace(/\n/g, "<br>");

    const authorName = commitItem.author
        ? commitItem.author.login
        : commitItem.commit.author.name;
    const authorAvatar = commitItem.author
        ? commitItem.author.avatar_url
        : "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
    const authorUrl = commitItem.author ? commitItem.author.html_url : "#";

    let backButtonHtml = "";
    if (onBack)
        backButtonHtml = `<button id="commit-back-btn" class="pagination-btn" style="margin-bottom: 20px;">${text.back_to_release}</button>`;

    const safeSha = escapeHtml(commitItem.sha.substring(0, 7));
    const safeAuthorName = escapeHtml(authorName);
    const safeAuthorAvatar = escapeHtml(authorAvatar);
    const safeAuthorUrl = escapeHtml(authorUrl);
    const safeCommitUrl = escapeHtml(commitItem.html_url);

    contentContainer.innerHTML = `
        ${backButtonHtml}
        <div class="release-top">
            <div>
                <h3 class="release-title">
                    ${safeSha}
                    <span class="badge badge-prerelease">${text.commit}</span>
                </h3>
                <div class="release-meta" style="margin-top: 8px;">
                    <span>📅 ${formattedDate}</span>
                    <span>•</span>
                    <a href="${safeAuthorUrl}" target="_blank" class="release-author">
                        <img src="${safeAuthorAvatar}" alt="${safeAuthorName}">
                        ${safeAuthorName}
                    </a>
                    <span>•</span>
                    <a href="${safeCommitUrl}" target="_blank" style="color: #00ffaa; text-decoration: none;">GitHub ↗</a>
                </div>
            </div>
        </div>
        <div class="release-body markdown-body" style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 12px; border: 1px dashed rgba(255,0,170,0.3); font-family: 'Fira Code', monospace;">
            ${safeHtmlBody}
        </div>

        <div style="margin-top: 24px;">
            <button id="toggle-diff-btn" class="pagination-btn" style="width: 100%; padding: 12px; font-weight: bold; border-radius: 12px;">
                ${text.show_changes}
            </button>
            <div id="commit-diff-container" style="display: none; margin-top: 16px; flex-direction: column; gap: 16px;"></div>
        </div>
    `;

    if (onBack)
        document
            .getElementById("commit-back-btn")
            .addEventListener("click", onBack);

    const diffBtn = document.getElementById("toggle-diff-btn");
    const diffContainer = document.getElementById("commit-diff-container");

    diffBtn.addEventListener("click", async () => {
        if (diffContainer.style.display === "none") {
            diffContainer.style.display = "flex";
            diffBtn.textContent = text.hide_changes;

            if (!diffContainer.hasAttribute("data-loaded")) {
                diffContainer.innerHTML = `<div class="loader" style="text-align: center; padding: 20px;">${text.loading_diff}</div>`;
                await loadAndRenderDiff(
                    commitItem.sha,
                    diffContainer,
                    lang,
                    text,
                );
                diffContainer.setAttribute("data-loaded", "true");
            }
        } else {
            diffContainer.style.display = "none";
            diffBtn.textContent = text.show_changes;
        }
    });
}

async function loadAndRenderDiff(sha, container, lang, text) {
    try {
        const commitPath = `https://api.github.com/repos/${GITHUB_OWNER}/${currentProject}/commits/${sha}`;
        const res = await fetch(
            `/github-proxy.php?path=${encodeURIComponent(commitPath)}`,
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        container.innerHTML = "";

        if (!data.files || data.files.length === 0) {
            container.innerHTML = `<div class="empty-folder" style="text-align:center;">${text.no_changed_files}</div>`;
            return;
        }

        data.files.forEach((file) => {
            container.appendChild(createDiffElement(file, text));
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="error-message" style="text-align:center;">${text.error} ${err.message}</div>`;
    }
}

function createDiffElement(file, text) {
    const wrapper = document.createElement("div");
    wrapper.className = "diff-file-wrapper";

    const header = document.createElement("div");
    header.className = "diff-file-header";
    header.innerHTML = `
        <span class="diff-toggle" style="transform: rotate(-90deg);">▼</span>
        <span class="diff-filename">${file.filename}</span>
        <span class="diff-stats">
            <span style="color: #00ffaa;">+${file.additions}</span>
            <span style="color: #ff4444;">-${file.deletions}</span>
        </span>
    `;

    const content = document.createElement("div");
    content.className = "diff-file-content";
    content.style.display = "none";

    if (!file.patch)
        content.innerHTML = `<div class="diff-no-patch">${text.binary_file}</div>`;
    else content.appendChild(renderSplitDiff(file.patch));

    header.addEventListener("click", () => {
        const isCollapsed = content.style.display === "none";
        content.style.display = isCollapsed ? "block" : "none";
        header.querySelector(".diff-toggle").style.transform = isCollapsed
            ? "rotate(0deg)"
            : "rotate(-90deg)";
    });

    wrapper.appendChild(header);
    wrapper.appendChild(content);
    return wrapper;
}

function escapeHtml(unsafe) {
    return (unsafe || "")
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function highlightIntraLine(oldStr, newStr) {
    let start = 0;
    const minLen = Math.min(oldStr.length, newStr.length);

    while (start < minLen && oldStr[start] === newStr[start]) start++;

    let oldEnd = oldStr.length - 1;
    let newEnd = newStr.length - 1;
    while (
        oldEnd >= start &&
        newEnd >= start &&
        oldStr[oldEnd] === newStr[newEnd]
    ) {
        oldEnd--;
        newEnd--;
    }

    const prefix = escapeHtml(oldStr.substring(0, start));
    const suffix = escapeHtml(oldStr.substring(oldEnd + 1));

    const delMid = escapeHtml(oldStr.substring(start, oldEnd + 1));
    const addMid = escapeHtml(newStr.substring(start, newEnd + 1));

    const left =
        prefix +
        (delMid ? `<span class="diff-char-del">${delMid}</span>` : "") +
        suffix;
    const right =
        prefix +
        (addMid ? `<span class="diff-char-add">${addMid}</span>` : "") +
        suffix;

    return { left, right };
}

function renderSplitDiff(patch) {
    const lines = patch.split("\n");
    const table = document.createElement("table");
    table.className = "diff-table";

    let leftLn = 0,
        rightLn = 0;

    let deletions = [];
    let additions = [];

    function flushBuffers() {
        const maxLen = Math.max(deletions.length, additions.length);
        for (let i = 0; i < maxLen; i++) {
            const del = deletions[i];
            const add = additions[i];
            const tr = document.createElement("tr");

            let leftCode = "",
                rightCode = "";
            let leftNumHtml = "",
                rightNumHtml = "";
            let leftClass = "diff-empty-bg",
                rightClass = "diff-empty-bg";

            if (del) {
                leftNumHtml = del.ln;
                leftClass = "diff-del-bg";
                leftCode = del.text;
            }
            if (add) {
                rightNumHtml = add.ln;
                rightClass = "diff-add-bg";
                rightCode = add.text;
            }

            if (del && add && deletions.length === additions.length) {
                const diffed = highlightIntraLine(del.text, add.text);
                leftCode = diffed.left;
                rightCode = diffed.right;
            } else {
                leftCode = escapeHtml(leftCode);
                rightCode = escapeHtml(rightCode);
            }

            tr.innerHTML = `
                <td class="diff-num">${leftNumHtml}</td>
                <td class="diff-code ${leftClass}"><div class="diff-line">${leftCode}</div></td>
                <td class="diff-num">${rightNumHtml}</td>
                <td class="diff-code ${rightClass}"><div class="diff-line">${rightCode}</div></td>
            `;
            table.appendChild(tr);
        }
        deletions = [];
        additions = [];
    }

    lines.forEach((line) => {
        if (line.startsWith("\\")) {
            flushBuffers();
            const tr = document.createElement("tr");
            const safeLine = escapeHtml(line);
            tr.innerHTML = `
                <td class="diff-num"></td>
                <td class="diff-code diff-empty-bg" style="color: rgba(255,255,255,0.4); font-style: italic;"><div class="diff-line">${safeLine}</div></td>
                <td class="diff-num"></td>
                <td class="diff-code diff-empty-bg" style="color: rgba(255,255,255,0.4); font-style: italic;"><div class="diff-line">${safeLine}</div></td>
            `;
            table.appendChild(tr);
            return;
        }

        if (line.startsWith("@@")) {
            flushBuffers();
            const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
            if (match) {
                leftLn = parseInt(match[1]) - 1;
                rightLn = parseInt(match[2]) - 1;
            }
            const tr = document.createElement("tr");
            tr.className = "diff-chunk-header";
            tr.innerHTML = `<td colspan="4">${escapeHtml(line)}</td>`;
            table.appendChild(tr);
            return;
        }

        if (line.startsWith("-")) {
            leftLn++;
            deletions.push({ ln: leftLn, text: line.substring(1) });
        } else if (line.startsWith("+")) {
            rightLn++;
            additions.push({ ln: rightLn, text: line.substring(1) });
        } else {
            flushBuffers();
            let safeLine = line;
            if (safeLine.startsWith(" ")) safeLine = safeLine.substring(1);

            leftLn++;
            rightLn++;

            const tr = document.createElement("tr");
            safeLine = escapeHtml(safeLine);
            tr.innerHTML = `
                <td class="diff-num">${leftLn}</td>
                <td class="diff-code"><div class="diff-line">${safeLine}</div></td>
                <td class="diff-num">${rightLn}</td>
                <td class="diff-code"><div class="diff-line">${safeLine}</div></td>
            `;
            table.appendChild(tr);
        }
    });

    flushBuffers();

    return table;
}
