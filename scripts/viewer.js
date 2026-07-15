const GITHUB_OWNER = "Lonewolf239";
const folderCache = {};
let currentRepo = "";
let repoName = "";
let closeMobileMenu = () => {};

document.addEventListener("DOMContentLoaded", initViewer);

function initMobileMenu() {
    const container = document.querySelector(".page-container");
    if (!container) return;

    const burger = document.createElement("button");
    burger.className = "burger-btn";
    burger.innerHTML = "☰ Project structure";
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

async function initViewer() {
    initMobileMenu();
    const params = new URLSearchParams(window.location.search);
    const project = params.get("project");
    if (!project) {
        showError(
            "Project not specified. Use the ?project=RepositoryName parameter",
        );
        return;
    }
    currentRepo = project;
    repoName = project;
    document.getElementById("repo-name").textContent = project;
    await loadRoot();
}

async function loadRoot() {
    showLoader(true);
    try {
        const rootItems = await fetchFolderContents("");
        renderTree(rootItems, document.getElementById("file-tree"), "");
        await checkLicense(rootItems);
        await checkReadme(rootItems);
    } catch (err) {
        showError("Error loading repository: " + err.message);
    } finally {
        showLoader(false);
    }
}

async function fetchFolderContents(path) {
    if (folderCache[path]) return folderCache[path];
    const githubPath = `https://api.github.com/repos/${GITHUB_OWNER}/${currentRepo}/contents/${path}`;
    const url = `/github-proxy.php?path=${encodeURIComponent(githubPath)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
    const data = await response.json();
    folderCache[path] = data;
    return data;
}

function renderTree(items, container, parentPath) {
    container.innerHTML = "";
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty-folder">Folder is empty</div>';
        return;
    }

    const sorted = [...items].sort((a, b) => {
        if (a.type === "dir" && b.type !== "dir") return -1;
        if (a.type !== "dir" && b.type === "dir") return 1;
        return a.name.localeCompare(b.name);
    });

    for (const item of sorted) {
        const node = document.createElement("div");
        node.className = `tree-node ${item.type === "dir" ? "dir" : "file"}`;
        node.dataset.path = item.path;
        node.dataset.type = item.type;
        node.dataset.name = item.name;

        const icon = document.createElement("span");
        icon.className = "tree-icon";

        if (item.type === "file") {
            const ext = item.name.split(".").pop().toLowerCase();
            const imageExts = [
                "png",
                "jpg",
                "jpeg",
                "gif",
                "bmp",
                "ico",
                "svg",
                "webp",
            ];
            if (imageExts.includes(ext)) icon.textContent = "🖼️";
            else icon.textContent = "📄";
        } else icon.textContent = "📁";

        const nameSpan = document.createElement("span");
        nameSpan.className = "tree-name";
        nameSpan.textContent = item.name;

        const toggleBtn = document.createElement("span");
        if (item.type === "dir") {
            toggleBtn.className = "tree-toggle";
            toggleBtn.textContent = "▶";
        }

        node.appendChild(toggleBtn);
        node.appendChild(icon);
        node.appendChild(nameSpan);

        if (item.type === "dir") {
            const childrenContainer = document.createElement("div");
            childrenContainer.className = "tree-children";
            childrenContainer.style.display = "none";

            node.addEventListener("click", async (e) => {
                e.stopPropagation();
                const isOpen = childrenContainer.style.display !== "none";
                if (!isOpen) {
                    let childItems = folderCache[item.path];
                    if (!childItems) {
                        try {
                            childItems = await fetchFolderContents(item.path);
                        } catch (err) {
                            console.error(err);
                            childrenContainer.innerHTML =
                                '<div class="error-message">Loading error</div>';
                            childrenContainer.style.display = "block";
                            node.classList.add("open");
                            toggleBtn.textContent = "▼";
                            return;
                        }
                    }
                    renderTree(childItems, childrenContainer, item.path);
                    childrenContainer.style.display = "block";
                    node.classList.add("open");
                    toggleBtn.textContent = "▼";
                } else {
                    childrenContainer.style.display = "none";
                    node.classList.remove("open");
                    toggleBtn.textContent = "▶";
                }
            });
            node.appendChild(childrenContainer);
        } else {
            node.addEventListener("click", (e) => {
                e.stopPropagation();
                loadAndShowFile(item.path, item.name);
                document
                    .querySelectorAll(".tree-node.file")
                    .forEach((n) => n.classList.remove("active"));
                node.classList.add("active");
                closeMobileMenu();
            });
        }

        container.appendChild(node);
    }
}

function isImageFile(fileName) {
    const imageExtensions = [
        "png",
        "jpg",
        "jpeg",
        "gif",
        "bmp",
        "ico",
        "svg",
        "webp",
        "tiff",
        "tif",
    ];
    const ext = fileName.split(".").pop().toLowerCase();
    return imageExtensions.includes(ext);
}

function isAudioFile(fileName) {
    const audioExtensions = ["mp3", "wav", "ogg", "flac", "m4a"];
    const ext = fileName.split(".").pop().toLowerCase();
    return audioExtensions.includes(ext);
}

async function loadAndShowFile(filePath, fileName) {
    const existingAudio = document.getElementById("hidden-audio-player");
    if (existingAudio) {
        existingAudio.pause();
        existingAudio.removeAttribute("src");
        existingAudio.load();
    }

    if (isImageFile(fileName)) {
        await displayImage(filePath, fileName);
        return;
    }

    if (isAudioFile(fileName)) {
        await displayAudio(filePath, fileName);
        return;
    }

    const binaryExtensions = [
        "ttf",
        "woff",
        "woff2",
        "eot",
        "otf",
        "pdf",
        "zip",
        "tar",
        "gz",
        "exe",
        "dll",
        "so",
        "pyc",
        "class",
        "bin",
        "iso",
        "jar",
        "7z",
        "rar",
    ];
    const ext = fileName.includes(".")
        ? fileName.split(".").pop().toLowerCase()
        : "";
    if (binaryExtensions.includes(ext)) {
        displayBinaryMessage(fileName);
        return;
    }

    try {
        let githubPath = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${currentRepo}/main/${filePath}`;
        let url = `/github-proxy.php?path=${encodeURIComponent(githubPath)}`;
        let response = await fetch(url);
        if (!response.ok) {
            githubPath = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${currentRepo}/master/${filePath}`;
            url = `/github-proxy.php?path=${encodeURIComponent(githubPath)}`;
            response = await fetch(url);
            if (!response.ok) throw new Error("Failed to download file");
        }

        const buffer = await response.arrayBuffer();
        const textDecoder = new TextDecoder("utf-8", { fatal: true });
        let content;

        try {
            content = textDecoder.decode(buffer);
        } catch (e) {
            displayBinaryMessage(fileName);
            return;
        }

        displayCode(content, fileName);
    } catch (err) {
        displayErrorMessage(fileName, err.message);
    }
}

async function displayImage(filePath, fileName) {
    const codeElement = document.getElementById("code-content");
    const currentFileSpan = document.getElementById("current-file");

    currentFileSpan.textContent = fileName;

    const audioContainer = document.querySelector(".audio-container");
    if (audioContainer) {
        audioContainer.style.display = "none";
        audioContainer.innerHTML = "";
    }

    let imageContainer = document.querySelector(".image-container");
    if (!imageContainer) {
        imageContainer = document.createElement("div");
        imageContainer.className = "image-container";
        const codeHeader = document.querySelector(".code-header");
        codeHeader.insertAdjacentElement("afterend", imageContainer);
    }

    const preElement = document.querySelector(".code-viewer pre");
    if (preElement) preElement.style.display = "none";
    imageContainer.style.display = "flex";

    const safeFileName = escapeHtml(fileName);

    const checkFile = async (branch) => {
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${currentRepo}/${branch}/${filePath}`;
        const proxyUrl = `/github-proxy.php?path=${encodeURIComponent(rawUrl)}`;
        const res = await fetch(proxyUrl, { method: "HEAD" });
        if (res.ok) return proxyUrl;
        throw new Error(`HTTP ${res.status}`);
    };

    let imageProxyUrl;
    try {
        imageProxyUrl = await checkFile("main");
    } catch (e) {
        try {
            imageProxyUrl = await checkFile("master");
        } catch (e2) {
            imageContainer.innerHTML = `
                <div class="image-error">
                    <span>🖼️</span>
                    <p>Failed to load image</p>
                    <small>${safeFileName}</small>
                    <small>${escapeHtml(e2.message)}</small>
                </div>
            `;
            return;
        }
    }

    imageContainer.innerHTML = `
        <div class="image-wrapper">
            <img src="${escapeHtml(imageProxyUrl)}" alt="${safeFileName}" class="displayed-image">
            <div class="image-info">
                <span class="image-name">${safeFileName}</span>
            </div>
        </div>
    `;

    const imgEl = imageContainer.querySelector(".displayed-image");
    imgEl.onerror = function () {
        imageContainer.innerHTML = `
            <div class="image-error">
                <span>🖼️</span>
                <p>Failed to load image</p>
                <small>${safeFileName}</small>
            </div>
        `;
    };

    codeElement.style.display = "none";
}

async function displayAudio(filePath, fileName) {
    const codeElement = document.getElementById("code-content");
    const currentFileSpan = document.getElementById("current-file");
    currentFileSpan.textContent = fileName;

    const imageContainer = document.querySelector(".image-container");
    if (imageContainer) imageContainer.style.display = "none";
    const preElement = document.querySelector(".code-viewer pre");
    if (preElement) preElement.style.display = "none";
    codeElement.style.display = "none";

    let audioContainer = document.querySelector(".audio-container");
    if (!audioContainer) {
        audioContainer = document.createElement("div");
        audioContainer.className = "audio-container";
        const codeHeader = document.querySelector(".code-header");
        codeHeader.insertAdjacentElement("afterend", audioContainer);
    }
    audioContainer.style.display = "flex";

    const safeFileName = escapeHtml(fileName);
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${currentRepo}/main/${filePath}`;
    const audioProxyUrl = `/github-proxy.php?path=${encodeURIComponent(rawUrl)}`;

    const fallbackCover =
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23101018'/><circle cx='50' cy='50' r='48' fill='none' stroke='%232a2a35' stroke-width='1'/><circle cx='50' cy='50' r='35' fill='none' stroke='%232a2a35' stroke-width='1'/><circle cx='50' cy='50' r='20' fill='%23ff00aa'/><circle cx='50' cy='50' r='5' fill='%23101018'/></svg>";

    const svgPlay = `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M8 5v14l11-7z"/></svg>`;
    const svgPause = `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
    const svgVolumeOn = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    const svgVolumeMute = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

    audioContainer.innerHTML = `
        <div class="audio-wrapper-horizontal">
            <div class="audio-cover-container">
                <img id="audio-cover" src="${fallbackCover}" alt="${safeFileName}">
                <div class="audio-cover-hole"></div>
            </div>

            <div class="audio-body">
                <div class="audio-info">
                    <div class="audio-name">${safeFileName}</div>
                    <div class="audio-status" id="audio-status">Audio Tracker Ready</div>
                </div>

                <div class="audio-progress-container" id="audio-progress-container">
                    <div class="audio-progress-bar" id="audio-progress-bar">
                        <div class="audio-progress-glow"></div>
                    </div>
                </div>

                <div class="audio-controls-row">
                    <button id="audio-play-btn" class="audio-btn-modern">${svgPlay}</button>

                    <div class="audio-time-container">
                        <span class="audio-time" id="audio-current-time">0:00</span>
                        <span class="audio-time-sep">/</span>
                        <span class="audio-time" id="audio-duration">0:00</span>
                    </div>

                    <div class="volume-container">
                        <button id="audio-mute-btn" class="volume-icon-btn">${svgVolumeOn}</button>
                        <input type="range" id="audio-volume" class="volume-slider" min="0" max="1" step="0.01" value="1">
                    </div>
                </div>
                <audio id="hidden-audio-player" src="${audioProxyUrl}" preload="metadata"></audio>
            </div>
        </div>
    `;

    const audio = document.getElementById("hidden-audio-player");
    const playBtn = document.getElementById("audio-play-btn");
    const progressContainer = document.getElementById(
        "audio-progress-container",
    );
    const progressBar = document.getElementById("audio-progress-bar");
    const currentTimeEl = document.getElementById("audio-current-time");
    const durationEl = document.getElementById("audio-duration");
    const coverImg = document.getElementById("audio-cover");
    const statusEl = document.getElementById("audio-status");

    const volumeSlider = document.getElementById("audio-volume");
    const muteBtn = document.getElementById("audio-mute-btn");
    let lastVolume = 1;

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const updateVolumeSliderBackground = (value) => {
        const percentage = value * 100;
        volumeSlider.style.background = `linear-gradient(to right, #00ffaa 0%, #00ffaa ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
    };

    audio.addEventListener("loadedmetadata", () => {
        durationEl.textContent = formatTime(audio.duration);
    });

    let isDragging = false;

    audio.addEventListener("timeupdate", () => {
        if (!isDragging) {
            currentTimeEl.textContent = formatTime(audio.currentTime);
            const percent = audio.duration
                ? (audio.currentTime / audio.duration) * 100
                : 0;
            progressBar.style.width = `${percent}%`;
        }
    });

    audio.addEventListener("ended", () => {
        playBtn.innerHTML = svgPlay;
        progressBar.style.width = "0%";
        audio.currentTime = 0;
        coverImg.classList.remove("spinning");
        statusEl.textContent = "Audio Tracker Ready";
        statusEl.style.color = "var(--text-muted)";
    });

    playBtn.addEventListener("click", () => {
        if (audio.paused) {
            audio.play();
            playBtn.innerHTML = svgPause;
            coverImg.classList.add("spinning");
            statusEl.textContent = "▶ Playing...";
            statusEl.style.color = "#00ffaa";
        } else {
            audio.pause();
            playBtn.innerHTML = svgPlay;
            coverImg.classList.remove("spinning");
            statusEl.textContent = "⏸ Paused";
            statusEl.style.color = "#ff00aa";
        }
    });

    let dragPos = 0;

    const calculatePosFromEvent = (e) => {
        const rect = progressContainer.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let pos = (clientX - rect.left) / rect.width;
        return Math.max(0, Math.min(1, pos));
    };

    const updateVisualProgress = (pos) => {
        if (audio.duration) {
            progressBar.style.width = `${pos * 100}%`;
            currentTimeEl.textContent = formatTime(pos * audio.duration);
        }
    };

    progressContainer.addEventListener("mousedown", (e) => {
        isDragging = true;
        dragPos = calculatePosFromEvent(e);
        updateVisualProgress(dragPos);
    });
    progressContainer.addEventListener(
        "touchstart",
        (e) => {
            isDragging = true;
            dragPos = calculatePosFromEvent(e);
            updateVisualProgress(dragPos);
        },
        { passive: true },
    );

    window.addEventListener("mousemove", (e) => {
        if (isDragging) {
            e.preventDefault();
            dragPos = calculatePosFromEvent(e);
            updateVisualProgress(dragPos);
        }
    });
    window.addEventListener(
        "touchmove",
        (e) => {
            if (isDragging) {
                dragPos = calculatePosFromEvent(e);
                updateVisualProgress(dragPos);
            }
        },
        { passive: true },
    );

    const endDrag = () => {
        if (isDragging) {
            isDragging = false;
            if (audio.duration) audio.currentTime = dragPos * audio.duration;
        }
    };

    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchend", endDrag);

    updateVolumeSliderBackground(1);
    volumeSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        audio.volume = val;
        updateVolumeSliderBackground(val);

        if (val === 0) {
            muteBtn.innerHTML = svgVolumeMute;
            muteBtn.style.color = "#ff6666";
        } else {
            muteBtn.innerHTML = svgVolumeOn;
            muteBtn.style.color = "#00ffaa";
            lastVolume = val;
        }
    });

    muteBtn.addEventListener("click", () => {
        if (audio.volume > 0) {
            audio.volume = 0;
            volumeSlider.value = 0;
            updateVolumeSliderBackground(0);
            muteBtn.innerHTML = svgVolumeMute;
            muteBtn.style.color = "#ff6666";
        } else {
            audio.volume = lastVolume > 0 ? lastVolume : 1;
            volumeSlider.value = audio.volume;
            updateVolumeSliderBackground(audio.volume);
            muteBtn.innerHTML = svgVolumeOn;
            muteBtn.style.color = "#00ffaa";
        }
    });

    const extractCover = (url) => {
        window.jsmediatags.read(url, {
            onSuccess: function (tag) {
                const picture = tag.tags.picture;
                if (picture) {
                    let base64String = "";
                    for (let i = 0; i < picture.data.length; i++) {
                        base64String += String.fromCharCode(picture.data[i]);
                    }
                    document.getElementById("audio-cover").src =
                        "data:" +
                        picture.format +
                        ";base64," +
                        window.btoa(base64String);
                }
            },
            onError: function () {
                console.log("No ID3 cover found, using fallback.");
            },
        });
    };

    if (!window.jsmediatags) {
        const script = document.createElement("script");
        script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js";
        script.onload = () => extractCover(audioProxyUrl);
        document.head.appendChild(script);
    } else extractCover(audioProxyUrl);
}

function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function displayCode(content, fileName) {
    const codeElement = document.getElementById("code-content");
    const currentFileSpan = document.getElementById("current-file");
    const imageContainer = document.querySelector(".image-container");
    const audioContainer = document.querySelector(".audio-container");
    const preElement = document.querySelector(".code-viewer pre");

    currentFileSpan.textContent = fileName;

    if (imageContainer) {
        imageContainer.style.display = "none";
        imageContainer.innerHTML = "";
    }

    if (audioContainer) {
        audioContainer.style.display = "none";
        audioContainer.innerHTML = "";
    }

    if (preElement) preElement.style.display = "block";

    codeElement.style.display = "block";

    const ext = fileName.split(".").pop().toLowerCase();
    const langMap = {
        js: "javascript",
        ts: "typescript",
        html: "html",
        css: "css",
        py: "python",
        java: "java",
        c: "c",
        h: "cpp",
        cpp: "cpp",
        cs: "csharp",
        json: "json",
        md: "markdown",
        sh: "bash",
        yml: "yaml",
        yaml: "yaml",
        xml: "xml",
        php: "php",
        rb: "ruby",
        go: "go",
        rs: "rust",
    };
    const lang = langMap[ext] || "plaintext";

    codeElement.className = "";
    codeElement.classList.add(`language-${lang}`);

    try {
        const highlighted = hljs.highlight(content, {
            language: lang,
            ignoreIllegals: true,
        });
        codeElement.innerHTML = highlighted.value;
    } catch (e) {
        codeElement.textContent = content;
        codeElement.classList.add("language-plaintext");
        hljs.highlightElement(codeElement);
    }
}

function displayBinaryMessage(fileName) {
    const codeElement = document.getElementById("code-content");
    const currentFileSpan = document.getElementById("current-file");
    const imageContainer = document.querySelector(".image-container");
    const audioContainer = document.querySelector(".audio-container");
    const preElement = document.querySelector(".code-viewer pre");

    currentFileSpan.textContent = fileName;

    if (imageContainer) {
        imageContainer.style.display = "none";
        imageContainer.innerHTML = "";
    }

    if (audioContainer) {
        audioContainer.style.display = "none";
        audioContainer.innerHTML = "";
    }

    if (preElement) preElement.style.display = "block";

    codeElement.style.display = "block";
    codeElement.textContent = "[Binary file - preview unavailable]";
    codeElement.className = "language-plaintext";
    hljs.highlightElement(codeElement);
}

function displayErrorMessage(fileName, errorMsg) {
    const codeElement = document.getElementById("code-content");
    const currentFileSpan = document.getElementById("current-file");
    const imageContainer = document.querySelector(".image-container");
    const audioContainer = document.querySelector(".audio-container");
    const preElement = document.querySelector(".code-viewer pre");

    currentFileSpan.textContent = fileName;

    if (imageContainer) {
        imageContainer.style.display = "none";
        imageContainer.innerHTML = "";
    }

    if (audioContainer) {
        audioContainer.style.display = "none";
        audioContainer.innerHTML = "";
    }

    if (preElement) preElement.style.display = "block";

    codeElement.style.display = "block";
    codeElement.textContent = `Error loading file: ${errorMsg}`;
    codeElement.className = "language-plaintext";
    hljs.highlightElement(codeElement);
}

function showLoader(show) {
    const container = document.getElementById("file-tree");
    if (show) container.innerHTML = '<div class="loader">Loading...</div>';
}

function showError(message) {
    const container = document.getElementById("file-tree");
    container.innerHTML = `<div class="error-message">${escapeHtml(message)}</div>`;
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function (m) {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        return m;
    });
}

async function checkLicense(items) {
    const licenseInfo = document.getElementById("license-info");
    if (!licenseInfo) return;

    const licenseFile = items.find(
        (item) =>
            item.type === "file" && item.name.toLowerCase().includes("license"),
    );

    if (licenseFile) {
        const licenseNameSpan = document.getElementById("license-name");
        if (licenseNameSpan) licenseNameSpan.textContent = licenseFile.name;
        licenseInfo.style.display = "flex";
        licenseInfo.onclick = () => {
            loadAndShowFile(licenseFile.path, licenseFile.name);
            closeMobileMenu();
        };
    } else licenseInfo.style.display = "none";
}

async function findReadmeRecursive(path = "") {
    try {
        const items = await fetchFolderContents(path);
        const readme = items.find(
            (item) =>
                item.type === "file" && item.name.toLowerCase() === "readme.md",
        );
        if (readme) return readme;

        if (path === "") {
            const docsFolder = items.find(
                (item) =>
                    item.type === "dir" && item.name.toLowerCase() === "docs",
            );
            if (docsFolder) {
                const foundInDocs = await findReadmeRecursive(docsFolder.path);
                if (foundInDocs) return foundInDocs;
            }
        }

        for (const item of items) {
            if (item.type === "dir") {
                if (path === "" && item.name.toLowerCase() === "docs") continue;
                const found = await findReadmeRecursive(item.path);
                if (found) return found;
            }
        }
        return null;
    } catch (err) {
        console.error(`Error scanning folder ${path}:`, err);
        return null;
    }
}

async function checkReadme(items) {
    const readmeInfo = document.getElementById("readme-info");
    if (!readmeInfo) return;

    const readmeFile = await findReadmeRecursive("");

    if (readmeFile) {
        const readmeNameSpan = document.getElementById("readme-name");
        if (readmeNameSpan) readmeNameSpan.textContent = readmeFile.name;
        readmeInfo.style.display = "flex";
        readmeInfo.onclick = () => {
            loadAndShowFile(readmeFile.path, readmeFile.name);
            closeMobileMenu();
        };
    } else readmeInfo.style.display = "none";
}
