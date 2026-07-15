let projectCardsCache = [];
let activeTagFilter = "all";
let closeMobileMenu = () => {};

const filterLabels = {
    ru: {
        search: "Поиск проектов...",
        allLangs: "Все языки",
        allTags: "Все теги",
        noResults: "По вашему запросу ничего не найдено.",
    },
    en: {
        search: "Search projects...",
        allLangs: "All languages",
        allTags: "All tags",
        noResults: "No projects found matching your criteria.",
    },
    de: {
        search: "Projekte suchen...",
        allLangs: "Alle Sprachen",
        allTags: "Alle Tags",
        noResults: "Keine Projekte gefunden, die Ihren Kriterien entsprechen.",
    },
};

const statusConfig = {
    active: {
        color: "#00ffaa",
        label: { ru: "Активен", en: "Active", de: "Aktiv" },
    },
    paused: {
        color: "#ffea00",
        label: { ru: "На паузе", en: "Paused", de: "Pausiert" },
    },
    archived: {
        color: "#ff1744",
        label: { ru: "Архив", en: "Archived", de: "Archiviert" },
    },
    completed: {
        color: "#2979ff",
        label: { ru: "Завершен", en: "Completed", de: "Abgeschlossen" },
    },
};

function getLocalizedValue(value, lang) {
    if (typeof value === "object" && value !== null)
        return value[lang] || value.en || Object.values(value)[0] || "";
    return value || "";
}

function isSafeUrl(url) {
    if (!url) return false;
    if (url.startsWith("/") || url.startsWith("?") || url.startsWith("#"))
        return true;
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

function getGithubBaseUrl(links, lang) {
    if (!links || !links.github) return null;
    let resolvedUrl = null;
    if (typeof links.github === "object" && links.github !== null) {
        resolvedUrl =
            getLocalizedValue(links.github.url, lang) ||
            getLocalizedValue(links.github, lang);
    } else {
        resolvedUrl = getLocalizedValue(links.github, lang);
    }
    if (resolvedUrl && isSafeUrl(resolvedUrl)) {
        return resolvedUrl.replace(/\/$/, "").replace(/\.git$/, "");
    }
    return null;
}

function formatDate(dateString, lang) {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        const options = { year: "numeric", month: "short", day: "numeric" };
        return date.toLocaleDateString(
            lang === "ru" ? "ru-RU" : lang === "de" ? "de-DE" : "en-US",
            options,
        );
    } catch {
        return null;
    }
}

function createStatusBadge(status, lang) {
    if (!status) return null;
    const st = statusConfig[status.toLowerCase()] || statusConfig.active;

    const badge = document.createElement("div");
    badge.className = "project-status-badge";

    const dot = document.createElement("span");
    dot.className = "status-dot";
    dot.style.backgroundColor = st.color;
    dot.style.boxShadow = `0 0 8px ${st.color}`;

    const text = document.createElement("span");
    text.textContent = st.label[lang] || st.label.en;

    badge.appendChild(dot);
    badge.appendChild(text);
    return badge;
}

function appendMetaBadge(
    topBar,
    text,
    icon,
    typeClass,
    isSubproject = false,
    url = null,
) {
    let badge = topBar.querySelector(`.${typeClass}`);

    if (badge && url && badge.tagName.toLowerCase() !== "a") {
        const newBadge = document.createElement("a");
        newBadge.className = badge.className;
        topBar.replaceChild(newBadge, badge);
        badge = newBadge;
    }

    if (!badge) {
        badge = document.createElement(url ? "a" : "div");
        const baseClass = isSubproject
            ? "subproject-release-date"
            : "project-release-date";
        badge.className = `${baseClass} project-meta-badge ${typeClass}`;
        topBar.appendChild(badge);
    }

    if (url && badge.tagName.toLowerCase() === "a") {
        badge.href = url;
        badge.target = "_blank";
        badge.rel = "noopener noreferrer";
        badge.style.textDecoration = "none";
        badge.style.color = "inherit";
    }

    badge.innerHTML = `${icon ? `<span class="meta-icon">${icon}</span> ` : ""}${text}`;
    return badge;
}

async function fetchAndUpdateGitHubDate(
    githubUrl,
    cardElement,
    lang,
    isSubproject = false,
    updateDate = true,
) {
    if (!githubUrl || typeof githubUrl !== "string") return;

    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return;

    const [, owner, repo] = match;
    const topBarClass = isSubproject ? "subproject-top-bar" : "project-top-bar";

    let topBar = cardElement.querySelector(`.${topBarClass}`);
    if (!topBar) {
        topBar = document.createElement("div");
        topBar.className = topBarClass;
        cardElement.insertBefore(topBar, cardElement.firstChild);
    }

    const updateDateElement = (dateString) => {
        const formattedDate = formatDate(dateString, lang);
        if (!formattedDate) return;
        appendMetaBadge(
            topBar,
            formattedDate,
            "📅",
            "date-badge",
            isSubproject,
        );
    };

    const addChangelogButton = (isCommitFallback = false) => {
        const linksClass = isSubproject
            ? ".subproject-links"
            : ".project-links";
        let linksContainer = cardElement.querySelector(linksClass);

        if (!linksContainer) {
            linksContainer = document.createElement("div");
            linksContainer.className = isSubproject
                ? "subproject-links"
                : "project-links";
            cardElement.appendChild(linksContainer);
        }

        if (!linksContainer.querySelector(".btn-changelog")) {
            const btn = document.createElement("a");
            btn.className = "btn-changelog";
            btn.href = `/${lang}/releases?project=${repo}`;

            if (isCommitFallback)
                btn.textContent =
                    lang === "ru"
                        ? "Коммиты"
                        : lang === "de"
                          ? "Commits"
                          : "Commits";
            else
                btn.textContent =
                    lang === "ru"
                        ? "Релизы"
                        : lang === "de"
                          ? "Releases"
                          : "Releases";

            linksContainer.appendChild(btn);
        }
    };

    try {
        const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const repoRes = await fetch(
            `/github-proxy.php?path=${encodeURIComponent(repoApiUrl)}`,
        );
        if (repoRes.ok) {
            const repoData = await repoRes.json();
            const cleanRepo = repo.replace(/\.git$/, "");
            const ghBaseUrl =
                repoData.html_url || `https://github.com/${owner}/${cleanRepo}`;

            if (repoData.stargazers_count > 0) {
                appendMetaBadge(
                    topBar,
                    repoData.stargazers_count,
                    "⭐",
                    "github-stars-badge",
                    isSubproject,
                    `${ghBaseUrl}/stargazers`,
                );
            }
            if (
                repoData.license &&
                repoData.license.spdx_id &&
                repoData.license.spdx_id !== "NOASSERTION"
            ) {
                const licenseUrl = `${ghBaseUrl}/blob/${repoData.default_branch || "main"}/LICENSE`;
                appendMetaBadge(
                    topBar,
                    repoData.license.spdx_id,
                    "⚖️",
                    "license-badge",
                    isSubproject,
                    licenseUrl,
                );
            }
        }
    } catch (error) {
        console.warn(`Could not fetch repo info for ${owner}/${repo}:`, error);
    }

    try {
        const releaseApiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
        const response = await fetch(
            `/github-proxy.php?path=${encodeURIComponent(releaseApiUrl)}`,
        );

        if (response.ok) {
            const release = await response.json();

            if (release.tag_name) {
                const cleanRepo = repo.replace(/\.git$/, "");
                const tagUrl =
                    release.html_url ||
                    `https://github.com/${owner}/${cleanRepo}/releases/tag/${release.tag_name}`;
                appendMetaBadge(
                    topBar,
                    release.tag_name,
                    "🏷️",
                    "project-version-badge",
                    isSubproject,
                    tagUrl,
                );
            }

            const releaseDate = release.published_at || release.created_at;
            if (releaseDate) {
                if (updateDate) updateDateElement(releaseDate);
                addChangelogButton(false);
                return;
            }
        }
    } catch (error) {
        console.warn(`Could not fetch release for ${owner}/${repo}:`, error);
    }

    try {
        const commitsApiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`;
        const response = await fetch(
            `/github-proxy.php?path=${encodeURIComponent(commitsApiUrl)}`,
        );

        if (response.ok) {
            const commits = await response.json();
            if (commits.length > 0) {
                if (updateDate)
                    updateDateElement(commits[0].commit.author.date);
                addChangelogButton(true);
            }
        }
    } catch (error) {
        console.warn(
            `Could not fetch commit date for ${owner}/${repo}:`,
            error,
        );
    }
}

function createSubprojectCard(subproject, lang, buttonLabels) {
    const subCard = document.createElement("div");
    subCard.className = "subproject-card";

    const topBar = document.createElement("div");
    topBar.className = "subproject-top-bar";
    const topBarFrag = document.createDocumentFragment();

    if (subproject.language) {
        const languages = Array.isArray(subproject.language)
            ? subproject.language
            : [subproject.language];
        languages.forEach((langCode) => {
            if (
                ["C#", "C++", "Python", "PHP", "HTML/CSS/JS"].includes(langCode)
            ) {
                const langBadge = document.createElement("div");
                const langClass = langCode
                    .toLowerCase()
                    .replace("#", "sharp")
                    .replace("++", "pp")
                    .replace(/\//g, "-");
                langBadge.className = `project-language-badge language-${langClass}`;
                langBadge.style.fontSize = "0.65rem";
                langBadge.style.padding = "2px 10px";
                langBadge.textContent = langCode;
                topBarFrag.appendChild(langBadge);
            }
        });
    }

    if (topBarFrag.children.length) {
        topBar.appendChild(topBarFrag);
        subCard.appendChild(topBar);
    }

    const ghBaseUrl = getGithubBaseUrl(subproject.links, lang);
    if (subproject.stars)
        appendMetaBadge(
            topBar,
            subproject.stars,
            "⭐",
            "github-stars-badge",
            true,
            ghBaseUrl ? `${ghBaseUrl}/stargazers` : null,
        );
    if (subproject.license)
        appendMetaBadge(
            topBar,
            subproject.license,
            "⚖️",
            "license-badge",
            true,
            ghBaseUrl ? `${ghBaseUrl}/blob/main/LICENSE` : null,
        );
    if (subproject.version)
        appendMetaBadge(
            topBar,
            subproject.version,
            "🏷️",
            "project-version-badge",
            true,
            ghBaseUrl
                ? `${ghBaseUrl}/releases/tag/${subproject.version}`
                : null,
        );

    if (subproject.lastRelease) {
        const formattedDate = formatDate(subproject.lastRelease, lang);
        if (formattedDate)
            appendMetaBadge(topBar, formattedDate, "📅", "date-badge", true);
    }

    if (!topBar.parentElement && topBar.children.length)
        subCard.appendChild(topBar);

    const headerContainer = document.createElement("div");
    headerContainer.className = "project-header-container";

    const title = getLocalizedValue(subproject.title, lang) || "Untitled";
    const h4 = document.createElement("h4");
    h4.textContent = title;
    headerContainer.appendChild(h4);

    const statusBadge = createStatusBadge(subproject.status, lang);
    if (statusBadge) headerContainer.appendChild(statusBadge);

    subCard.appendChild(headerContainer);

    const description = getLocalizedValue(subproject.description, lang) || "";
    if (description) {
        const p = document.createElement("p");
        p.textContent = description;
        subCard.appendChild(p);
    }

    if (subproject.tags && subproject.tags.length) {
        const tagsDiv = document.createElement("div");
        tagsDiv.className = "subproject-tags";
        const tagsFrag = document.createDocumentFragment();

        subproject.tags.forEach((tag) => {
            const span = document.createElement("span");
            span.className = "subproject-tag";
            span.textContent = tag;
            tagsFrag.appendChild(span);
        });

        tagsDiv.appendChild(tagsFrag);
        subCard.appendChild(tagsDiv);
    }

    if (subproject.links && Object.keys(subproject.links).length) {
        const linksDiv = document.createElement("div");
        linksDiv.className = "subproject-links";
        const linksFrag = document.createDocumentFragment();

        Object.entries(subproject.links).forEach(([key, url]) => {
            if (!url) return;
            let resolvedUrl = null;
            let openInNewTab = true;

            if (typeof url === "object" && url !== null) {
                resolvedUrl =
                    getLocalizedValue(url.url, lang) ||
                    getLocalizedValue(url, lang);
                openInNewTab = url.newTab !== false;
            } else resolvedUrl = getLocalizedValue(url, lang);

            if (resolvedUrl && isSafeUrl(resolvedUrl)) {
                const a = document.createElement("a");
                a.href = resolvedUrl;
                if (openInNewTab) {
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                }
                a.textContent =
                    (buttonLabels[lang] && buttonLabels[lang][key]) || key;
                linksFrag.appendChild(a);
            }
        });

        if (linksFrag.children.length) {
            linksDiv.appendChild(linksFrag);
            subCard.appendChild(linksDiv);
        }
    }

    return subCard;
}

function createSubprojectsSection(subprojects, lang, buttonLabels) {
    const container = document.createElement("div");
    container.className = "project-subprojects";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "subprojects-toggle";
    toggleBtn.setAttribute("aria-expanded", "false");

    const toggleText = document.createElement("span");
    const subprojectsCount = subprojects.length;
    const subprojectsText = {
        ru: `${subprojectsCount} подпроект${subprojectsCount === 1 ? "" : subprojectsCount < 5 ? "а" : "ов"}`,
        en: `${subprojectsCount} subproject${subprojectsCount === 1 ? "" : "s"}`,
        de: `${subprojectsCount} Unterprojekt${subprojectsCount === 1 ? "" : "e"}`,
    };
    toggleText.textContent = subprojectsText[lang] || subprojectsText.en;

    const toggleIcon = document.createElement("span");
    toggleIcon.className = "subprojects-toggle-icon";
    toggleIcon.textContent = "▼";
    toggleIcon.style.fontSize = "0.7rem";

    toggleBtn.appendChild(toggleText);
    toggleBtn.appendChild(toggleIcon);

    const wrapper = document.createElement("div");
    wrapper.className = "subprojects-wrapper";

    const subprojectsList = document.createElement("div");
    subprojectsList.className = "subprojects-list";

    subprojects.forEach((subproject) => {
        const subCard = createSubprojectCard(subproject, lang, buttonLabels);
        subprojectsList.appendChild(subCard);

        if (subproject.links?.github)
            fetchAndUpdateGitHubDate(
                subproject.links.github,
                subCard,
                lang,
                true,
                !subproject.lastRelease,
            );
    });

    container.appendChild(toggleBtn);
    wrapper.appendChild(subprojectsList);
    container.appendChild(wrapper);

    let isOpen = false;
    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        isOpen = !isOpen;
        toggleBtn.setAttribute("aria-expanded", isOpen);

        if (isOpen) {
            wrapper.classList.add("open");
            toggleBtn.classList.add("open");
        } else {
            wrapper.classList.remove("open");
            toggleBtn.classList.remove("open");
        }
    });

    return container;
}

function createDescriptionToggle(project, lang, buttonLabels) {
    const fullDesc = getLocalizedValue(project.description, lang);
    if (!fullDesc) return null;

    const container = document.createElement("div");
    container.className = "project-description-wrapper";

    const match = fullDesc.match(/[.!?]\s/);

    let shortText = fullDesc;
    let restText = "";

    if (match) {
        const splitIndex = match.index + 1;
        shortText = fullDesc.substring(0, splitIndex);
        restText = fullDesc.substring(splitIndex + 1).trim();
    }

    const shortElement = document.createElement("p");
    shortElement.className = "project-description-short";
    shortElement.textContent = shortText;
    container.appendChild(shortElement);

    if (restText) {
        const restWrapper = document.createElement("div");
        restWrapper.className = "project-description-rest";

        const restContent = document.createElement("div");
        restContent.className = "project-description-rest-inner";

        const restElement = document.createElement("p");
        restElement.textContent = restText;

        restContent.appendChild(restElement);
        restWrapper.appendChild(restContent);
        container.appendChild(restWrapper);

        const toggleBtn = document.createElement("button");
        toggleBtn.className = "description-toggle-btn";
        toggleBtn.setAttribute("aria-expanded", "false");

        const btnText = document.createElement("span");
        const toggleLabels = {
            ru: { more: "Подробнее", less: "Свернуть" },
            en: { more: "Read more", less: "Show less" },
            de: { more: "Mehr erfahren", less: "Weniger anzeigen" },
        };
        const labels = toggleLabels[lang] || toggleLabels.en;
        btnText.textContent = labels.more;

        const btnIcon = document.createElement("span");
        btnIcon.className = "description-toggle-icon";
        btnIcon.textContent = "▼";

        toggleBtn.appendChild(btnText);
        toggleBtn.appendChild(btnIcon);
        container.appendChild(toggleBtn);

        let isOpen = false;
        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            isOpen = !isOpen;
            toggleBtn.setAttribute("aria-expanded", isOpen);

            if (isOpen) {
                restWrapper.classList.add("open");
                toggleBtn.classList.add("open");
                btnText.textContent = labels.less;
            } else {
                restWrapper.classList.remove("open");
                toggleBtn.classList.remove("open");
                btnText.textContent = labels.more;
            }
        });
    }

    return container;
}

const lazyObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const card = entry.target;
                requestAnimationFrame(() => {
                    card.classList.remove("lazy-hidden");
                    card.classList.add("lazy-visible");
                });
                observer.unobserve(card);
            }
        });
    },
    {
        root: null,
        rootMargin: "0px 0px 50px 0px",
        threshold: 0.1,
    },
);

function renderSkeletons(container, count = 6) {
    container.innerHTML = "";
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement("div");
        skeleton.className = "skeleton-card";
        skeleton.innerHTML = `
            <div class="skeleton-element skeleton-title"></div>
            <div class="skeleton-element skeleton-date"></div>
            <div class="skeleton-element skeleton-text" style="margin-top: 12px;"></div>
            <div class="skeleton-element skeleton-text short"></div>
            <div class="skeleton-tags">
                <div class="skeleton-element skeleton-tag"></div>
                <div class="skeleton-element skeleton-tag"></div>
                <div class="skeleton-element skeleton-tag"></div>
            </div>
        `;
        container.appendChild(skeleton);
    }
}

function initMobileMenu(currentLang) {
    const container = document.querySelector(".page-container");
    if (!container) return;

    if (document.querySelector(".burger-btn")) return;

    const burgerLabels = { ru: "☰ Меню", en: "☰ Menu", de: "☰ Menü" };

    const burger = document.createElement("button");
    burger.className = "burger-btn";
    burger.innerHTML = burgerLabels[currentLang] || burgerLabels.en;
    container.insertBefore(burger, container.firstChild);

    const overlay = document.createElement("div");
    overlay.className = "mobile-overlay";
    container.appendChild(overlay);

    const sidebar = document.querySelector("#projects-sidebar");

    function toggle() {
        if (sidebar) sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
        document.body.style.overflow =
            sidebar && sidebar.classList.contains("active") ? "hidden" : "";
    }

    closeMobileMenu = () => {
        if (sidebar && sidebar.classList.contains("active")) toggle();
    };

    burger.addEventListener("click", toggle);
    overlay.addEventListener("click", toggle);
}

function renderSidebarAndFilters(aboutData, projects, currentLang) {
    const sidebar = document.getElementById("projects-sidebar");
    if (!sidebar) return;

    sidebar.innerHTML = "";
    initMobileMenu(currentLang);

    if (aboutData) {
        const aboutSection = document.createElement("div");
        aboutSection.className = "sidebar-about";

        const avatarUrl = aboutData.avatar || "/images/icon.svg";
        const titleText = getLocalizedValue(aboutData.title, currentLang);
        const descText = getLocalizedValue(aboutData.description, currentLang);

        aboutSection.innerHTML = `
            <img src="${avatarUrl}" alt="Avatar" class="sidebar-avatar">
            <h2>${titleText}</h2>
            <p>${descText}</p>
        `;

        if (aboutData.contacts && Object.keys(aboutData.contacts).length) {
            const linksDiv = document.createElement("div");
            linksDiv.className = "about-links";
            linksDiv.style.justifyContent = "center";

            Object.entries(aboutData.contacts).forEach(([key, url]) => {
                if (!url) return;
                const a = document.createElement("a");
                a.href = url;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.textContent = key.charAt(0).toUpperCase() + key.slice(1);
                linksDiv.appendChild(a);
            });
            aboutSection.appendChild(linksDiv);
        }

        sidebar.appendChild(aboutSection);
    }

    const contentWrapper = document.createElement("div");
    contentWrapper.className = "sidebar-content";

    const labels = filterLabels[currentLang] || filterLabels.en;

    const searchGroup = document.createElement("div");
    searchGroup.className = "sidebar-filter-group";
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "filter-control filter-input";
    searchInput.placeholder = labels.search;
    searchInput.id = "projectSearch";
    searchGroup.appendChild(searchInput);
    contentWrapper.appendChild(searchGroup);

    searchInput.addEventListener("input", () => filterProjects(currentLang));

    const uniqueLangs = new Set();
    const uniqueTags = new Set();
    projects.forEach((p) => {
        if (p.language) {
            const langs = Array.isArray(p.language) ? p.language : [p.language];
            langs.forEach((l) => uniqueLangs.add(l));
        }
        if (p.tags) p.tags.forEach((t) => uniqueTags.add(t));
    });

    if (uniqueLangs.size > 0) {
        const langGroup = document.createElement("div");
        langGroup.className = "sidebar-filter-group";
        langGroup.innerHTML = `<h3>${currentLang === "ru" ? "Языки" : currentLang === "de" ? "Sprachen" : "Languages"}</h3>`;

        const langContainer = document.createElement("div");
        langContainer.className = "langs-scroll-container";

        const allLangsBtn = document.createElement("button");
        allLangsBtn.className = "filter-lang-btn active";
        allLangsBtn.textContent = labels.allLangs;
        allLangsBtn.dataset.lang = "all";
        langContainer.appendChild(allLangsBtn);

        Array.from(uniqueLangs)
            .sort()
            .forEach((lang) => {
                const btn = document.createElement("button");
                btn.className = "filter-lang-btn";
                btn.textContent = lang;
                btn.dataset.lang = lang;
                langContainer.appendChild(btn);
            });

        langContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("filter-lang-btn")) {
                document
                    .querySelectorAll(".filter-lang-btn")
                    .forEach((b) => b.classList.remove("active"));
                e.target.classList.add("active");
                filterProjects(currentLang);
                closeMobileMenu();
            }
        });

        langGroup.appendChild(langContainer);
        contentWrapper.appendChild(langGroup);
    }

    if (uniqueTags.size > 0) {
        const tagGroup = document.createElement("div");
        tagGroup.className = "sidebar-filter-group";
        tagGroup.innerHTML = `<h3>${currentLang === "ru" ? "Теги" : currentLang === "de" ? "Tags" : "Tags"}</h3>`;

        const tagsContainer = document.createElement("div");
        tagsContainer.className = "tags-scroll-container";

        const allTagsBtn = document.createElement("button");
        allTagsBtn.className = "filter-tag-btn active";
        allTagsBtn.textContent = labels.allTags;
        allTagsBtn.dataset.tag = "all";
        tagsContainer.appendChild(allTagsBtn);

        Array.from(uniqueTags)
            .sort()
            .forEach((tag) => {
                const btn = document.createElement("button");
                btn.className = "filter-tag-btn";
                btn.textContent = tag;
                btn.dataset.tag = tag;
                tagsContainer.appendChild(btn);
            });

        tagsContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("filter-tag-btn")) {
                document
                    .querySelectorAll(".filter-tag-btn")
                    .forEach((b) => b.classList.remove("active"));
                e.target.classList.add("active");
                activeTagFilter = e.target.dataset.tag;
                filterProjects(currentLang);
                closeMobileMenu();
            }
        });

        tagGroup.appendChild(tagsContainer);
        contentWrapper.appendChild(tagGroup);
    }

    sidebar.appendChild(contentWrapper);
}

function filterProjects(currentLang) {
    const searchEl = document.getElementById("projectSearch");
    const searchText = searchEl ? searchEl.value.toLowerCase() : "";

    const activeLangBtn = document.querySelector(".filter-lang-btn.active");
    const activeLang = activeLangBtn ? activeLangBtn.dataset.lang : "all";

    const selectedTag = activeTagFilter;

    let visibleCount = 0;

    projectCardsCache.forEach((item) => {
        const { data, element } = item;

        const title = (
            getLocalizedValue(data.title, currentLang) || ""
        ).toLowerCase();
        const desc = (
            getLocalizedValue(data.description, currentLang) || ""
        ).toLowerCase();
        const matchText =
            title.includes(searchText) || desc.includes(searchText);

        const pLangs = data.language
            ? Array.isArray(data.language)
                ? data.language
                : [data.language]
            : [];
        const matchLang = activeLang === "all" || pLangs.includes(activeLang);

        const matchTag =
            selectedTag === "all" ||
            (data.tags && data.tags.includes(selectedTag));

        const statusMatch = data.status
            ? data.status.toLowerCase().includes(searchText)
            : false;

        if ((matchText || statusMatch) && matchLang && matchTag) {
            element.style.display = "";
            visibleCount++;
        } else element.style.display = "none";
    });

    const projectsGrid = document.querySelector(".projects-grid");
    let noResultsMsg = document.querySelector(".no-results-msg");

    if (visibleCount === 0) {
        if (!noResultsMsg && projectsGrid) {
            noResultsMsg = document.createElement("div");
            noResultsMsg.className = "no-results-msg";
            noResultsMsg.textContent = (
                filterLabels[currentLang] || filterLabels.en
            ).noResults;
            projectsGrid.appendChild(noResultsMsg);
        }
    } else if (noResultsMsg) noResultsMsg.remove();
}

function loadProjects() {
    const projectsGrid = document.querySelector(".projects-grid");
    if (!projectsGrid) return;

    renderSkeletons(projectsGrid);

    const htmlLang = document.documentElement.lang || "en";
    const currentLang = htmlLang.startsWith("en")
        ? "en"
        : htmlLang.startsWith("de")
          ? "de"
          : "ru";

    const buttonLabels = {
        ru: {
            github: "GitHub",
            nuget: "NuGet",
            wiki: "Вики",
            code: "Код",
            download: "Скачать",
        },
        en: {
            github: "GitHub",
            nuget: "NuGet",
            wiki: "Wiki",
            code: "Code",
            download: "Download",
        },
        de: {
            github: "GitHub",
            nuget: "NuGet",
            wiki: "Wiki",
            code: "Code",
            download: "Herunterladen",
        },
    };

    fetch("/projects.json")
        .then((response) => response.json())
        .then((data) => {
            projectsGrid.innerHTML = "";
            projectCardsCache = [];

            const projects = data.projects || [];

            if (data.about || projects.length > 0)
                renderSidebarAndFilters(data.about, projects, currentLang);

            const subprojectsPool = data.subprojects_pool || {};
            const projectsFrag = document.createDocumentFragment();

            projects.forEach((project) => {
                const card = document.createElement("div");
                card.className = "project-card lazy-hidden";

                const topBar = document.createElement("div");
                topBar.className = "project-top-bar";
                const topBarFrag = document.createDocumentFragment();

                if (project.language) {
                    const languages = Array.isArray(project.language)
                        ? project.language
                        : [project.language];
                    languages.forEach((lang) => {
                        if (
                            [
                                "C#",
                                "C++",
                                "Python",
                                "PHP",
                                "HTML/CSS/JS",
                            ].includes(lang)
                        ) {
                            const langBadge = document.createElement("div");
                            const langClass = lang
                                .toLowerCase()
                                .replace("#", "sharp")
                                .replace("++", "pp")
                                .replace(/\//g, "-");
                            langBadge.className = `project-language-badge language-${langClass}`;
                            langBadge.textContent = lang;
                            topBarFrag.appendChild(langBadge);
                        }
                    });
                }

                if (topBarFrag.children.length) {
                    topBar.appendChild(topBarFrag);
                    card.appendChild(topBar);
                }

                const ghBaseUrl = getGithubBaseUrl(project.links, currentLang);
                if (project.stars)
                    appendMetaBadge(
                        topBar,
                        project.stars,
                        "⭐",
                        "github-stars-badge",
                        false,
                        ghBaseUrl ? `${ghBaseUrl}/stargazers` : null,
                    );
                if (project.license)
                    appendMetaBadge(
                        topBar,
                        project.license,
                        "⚖️",
                        "license-badge",
                        false,
                        ghBaseUrl ? `${ghBaseUrl}/blob/main/LICENSE` : null,
                    );
                if (project.version)
                    appendMetaBadge(
                        topBar,
                        project.version,
                        "🏷️",
                        "project-version-badge",
                        false,
                        ghBaseUrl
                            ? `${ghBaseUrl}/releases/tag/${project.version}`
                            : null,
                    );

                if (project.lastRelease) {
                    const formattedDate = formatDate(
                        project.lastRelease,
                        currentLang,
                    );
                    if (formattedDate)
                        appendMetaBadge(
                            topBar,
                            formattedDate,
                            "📅",
                            "date-badge",
                            false,
                        );
                }

                if (!topBar.parentElement && topBar.children.length)
                    card.appendChild(topBar);

                const headerContainer = document.createElement("div");
                headerContainer.className = "project-header-container";

                const h3 = document.createElement("h3");
                h3.textContent =
                    getLocalizedValue(project.title, currentLang) || "Untitled";
                headerContainer.appendChild(h3);

                const statusBadge = createStatusBadge(
                    project.status,
                    currentLang,
                );
                if (statusBadge) headerContainer.appendChild(statusBadge);

                card.appendChild(headerContainer);

                const descriptionToggle = createDescriptionToggle(
                    project,
                    currentLang,
                    buttonLabels,
                );
                if (descriptionToggle) card.appendChild(descriptionToggle);

                if (project.tags && project.tags.length) {
                    const tagsDiv = document.createElement("div");
                    tagsDiv.className = "project-tags";
                    const tagsFrag = document.createDocumentFragment();

                    project.tags.forEach((tag) => {
                        const span = document.createElement("span");
                        span.className = "tag";
                        span.textContent = tag;
                        tagsFrag.appendChild(span);
                    });

                    tagsDiv.appendChild(tagsFrag);
                    card.appendChild(tagsDiv);
                }

                if (project.links && Object.keys(project.links).length) {
                    const linksDiv = document.createElement("div");
                    linksDiv.className = "project-links";
                    const linksFrag = document.createDocumentFragment();

                    Object.entries(project.links).forEach(([key, url]) => {
                        if (!url) return;
                        let resolvedUrl = null;
                        let openInNewTab = true;

                        if (typeof url === "object" && url !== null) {
                            resolvedUrl =
                                getLocalizedValue(url.url, currentLang) ||
                                getLocalizedValue(url, currentLang);
                            openInNewTab = url.newTab !== false;
                        } else
                            resolvedUrl = getLocalizedValue(url, currentLang);

                        if (resolvedUrl && isSafeUrl(resolvedUrl)) {
                            const a = document.createElement("a");
                            a.href = resolvedUrl;
                            if (openInNewTab) {
                                a.target = "_blank";
                                a.rel = "noopener noreferrer";
                            }
                            a.textContent =
                                (buttonLabels[currentLang] &&
                                    buttonLabels[currentLang][key]) ||
                                key;
                            linksFrag.appendChild(a);
                        }
                    });

                    if (linksFrag.children.length) {
                        linksDiv.appendChild(linksFrag);
                        card.appendChild(linksDiv);
                    }
                }

                if (project.subprojects && project.subprojects.length > 0) {
                    const resolvedSubprojects = project.subprojects
                        .map((id) => subprojectsPool[id])
                        .filter(Boolean);
                    card.appendChild(
                        createSubprojectsSection(
                            resolvedSubprojects,
                            currentLang,
                            buttonLabels,
                        ),
                    );
                }

                projectsFrag.appendChild(card);

                projectCardsCache.push({ data: project, element: card });

                lazyObserver.observe(card);

                if (
                    project.links?.github &&
                    typeof project.links.github === "string"
                )
                    fetchAndUpdateGitHubDate(
                        project.links.github,
                        card,
                        currentLang,
                        false,
                        !project.lastRelease,
                    );
            });

            projectsGrid.appendChild(projectsFrag);
        })
        .catch((error) => {
            console.error("Error loading projects:", error);
            projectsGrid.innerHTML =
                '<p style="color: rgba(255, 255, 255, 0.5); text-align: center; grid-column: 1 / -1;">Failed to load projects.</p>';
        });
}

document.addEventListener("DOMContentLoaded", loadProjects);
