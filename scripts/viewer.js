const GITHUB_OWNER = 'Lonewolf239';
const folderCache = {};
let currentRepo = '';
let repoName = '';

document.addEventListener('DOMContentLoaded', initViewer);

async function initViewer() {
    const params = new URLSearchParams(window.location.search);
    const project = params.get('project');
    if (!project) {
        showError('Project not specified. Use the ?project=RepositoryName parameter');
        return;
    }
    currentRepo = project;
    repoName = project;
    document.getElementById('repo-name').textContent = project;
    await loadRoot();
}

async function loadRoot() {
    showLoader(true);
    try {
        const rootItems = await fetchFolderContents('');
        renderTree(rootItems, document.getElementById('file-tree'), '');
        await checkLicense(rootItems);
    }
    catch (err) { showError('Ошибка загрузки репозитория: ' + err.message); }
    finally { showLoader(false); }
}

async function fetchFolderContents(path) {
    if (folderCache[path]) return folderCache[path];
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${currentRepo}/contents/${path}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Ошибка HTTP ${response.status}`);
    const data = await response.json();
    folderCache[path] = data;
    return data;
}

function renderTree(items, container, parentPath) {
    container.innerHTML = '';
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty-folder">Папка пуста</div>';
        return;
    }

    const sorted = [...items].sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
    });

    for (const item of sorted) {
        const node = document.createElement('div');
        node.className = `tree-node ${item.type === 'dir' ? 'dir' : 'file'}`;
        node.dataset.path = item.path;
        node.dataset.type = item.type;
        node.dataset.name = item.name;

        const icon = document.createElement('span');
        icon.className = 'tree-icon';

        if (item.type === 'file') {
            const ext = item.name.split('.').pop().toLowerCase();
            const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'svg', 'webp'];
            if (imageExts.includes(ext)) icon.textContent = '🖼️';
            else icon.textContent = '📄';
        } else icon.textContent = '📁';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'tree-name';
        nameSpan.textContent = item.name;

        const toggleBtn = document.createElement('span');
        if (item.type === 'dir') {
            toggleBtn.className = 'tree-toggle';
            toggleBtn.textContent = '▶';
        }

        node.appendChild(toggleBtn);
        node.appendChild(icon);
        node.appendChild(nameSpan);

        if (item.type === 'dir') {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children';
            childrenContainer.style.display = 'none';

            node.addEventListener('click', async (e) => {
                e.stopPropagation();
                const isOpen = childrenContainer.style.display !== 'none';
                if (!isOpen) {
                    let childItems = folderCache[item.path];
                    if (!childItems) {
                        try { childItems = await fetchFolderContents(item.path); }
                        catch (err) {
                            console.error(err);
                            childrenContainer.innerHTML = '<div class="error-message">Ошибка загрузки</div>';
                            childrenContainer.style.display = 'block';
                            node.classList.add('open');
                            toggleBtn.textContent = '▼';
                            return;
                        }
                    }
                    renderTree(childItems, childrenContainer, item.path);
                    childrenContainer.style.display = 'block';
                    node.classList.add('open');
                    toggleBtn.textContent = '▼';
                } else {
                    childrenContainer.style.display = 'none';
                    node.classList.remove('open');
                    toggleBtn.textContent = '▶';
                }
            });
            node.appendChild(childrenContainer);
        } else {
            node.addEventListener('click', (e) => {
                e.stopPropagation();
                loadAndShowFile(item.path, item.name);
                document.querySelectorAll('.tree-node.file').forEach(n => n.classList.remove('active'));
                node.classList.add('active');
            });
        }

        container.appendChild(node);
    }
}

function isImageFile(fileName) {
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'svg', 'webp', 'tiff', 'tif'];
    const ext = fileName.split('.').pop().toLowerCase();
    return imageExtensions.includes(ext);
}

async function loadAndShowFile(filePath, fileName) {
    if (isImageFile(fileName)) {
        await displayImage(filePath, fileName);
        return;
    }

    const binaryExtensions = ['ttf', 'woff', 'woff2', 'eot', 'otf', 'pdf', 'zip', 'tar', 'gz', 'exe', 'dll', 'so', 'pyc', 'class'];
    const ext = fileName.split('.').pop().toLowerCase();
    if (binaryExtensions.includes(ext)) {
        displayBinaryMessage(fileName);
        return;
    }

    try {
        let url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${currentRepo}/main/${filePath}`;
        let response = await fetch(url);
        if (!response.ok) {
            url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${currentRepo}/master/${filePath}`;
            response = await fetch(url);
            if (!response.ok) throw new Error('Не удалось загрузить файл');
        }
        const content = await response.text();
        displayCode(content, fileName);
    } catch (err) { displayErrorMessage(fileName, err.message); }
}

async function displayImage(filePath, fileName) {
    const codeElement = document.getElementById('code-content');
    const currentFileSpan = document.getElementById('current-file');
    const codeViewer = document.querySelector('.code-viewer');

    currentFileSpan.textContent = fileName;

    let imageContainer = document.querySelector('.image-container');
    if (!imageContainer) {
        imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';
        const codeHeader = document.querySelector('.code-header');
        codeHeader.insertAdjacentElement('afterend', imageContainer);
    }

    const preElement = document.querySelector('.code-viewer pre');
    if (preElement) preElement.style.display = 'none';

    imageContainer.style.display = 'flex';

    let imageUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${currentRepo}/main/${filePath}`;
    let response = await fetch(imageUrl);
    if (!response.ok) {
        imageUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${currentRepo}/master/${filePath}`;
        response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Failed to upload file');
    }

    imageContainer.innerHTML = `
        <div class="image-wrapper">
            <img src="${imageUrl}" alt="${fileName}" class="displayed-image" onerror="this.onerror=null; this.parentElement.parentElement.innerHTML='<div class=\'image-error\'><span>🖼️</span><p>Не удалось загрузить изображение</p><small>${fileName}</small></div>'">
            <div class="image-info">
                <span class="image-name">${fileName}</span>
                <span class="image-size" id="image-size">Loading...</span>
            </div>
        </div>
    `;

    fetch(imageUrl, { method: 'HEAD' })
        .then(response => {
            const size = response.headers.get('content-length');
            if (size) {
                const sizeSpan = document.getElementById('image-size');
                if (sizeSpan) {
                    sizeSpan.textContent = formatFileSize(parseInt(size));
                }
            } else {
                const sizeSpan = document.getElementById('image-size');
                if (sizeSpan) sizeSpan.textContent = 'Размер неизвестен';
            }
        })
        .catch(() => {
            const sizeSpan = document.getElementById('image-size');
            if (sizeSpan) sizeSpan.textContent = 'Размер неизвестен';
        });

    codeElement.style.display = 'none';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function displayCode(content, fileName) {
    const codeElement = document.getElementById('code-content');
    const currentFileSpan = document.getElementById('current-file');
    const imageContainer = document.querySelector('.image-container');
    const preElement = document.querySelector('.code-viewer pre');

    currentFileSpan.textContent = fileName;

    if (imageContainer) {
        imageContainer.style.display = 'none';
        imageContainer.innerHTML = '';
    }

    if (preElement) preElement.style.display = 'block';

    codeElement.style.display = 'block';

    const ext = fileName.split('.').pop().toLowerCase();
    const langMap = {
        'js': 'javascript', 'ts': 'typescript', 'html': 'html', 'css': 'css',
        'py': 'python', 'java': 'java', 'c': 'c', 'cpp': 'cpp', 'cs': 'csharp',
        'json': 'json', 'md': 'markdown', 'sh': 'bash', 'yml': 'yaml', 'yaml': 'yaml',
        'xml': 'xml', 'php': 'php', 'rb': 'ruby', 'go': 'go', 'rs': 'rust'
    };
    const lang = langMap[ext] || 'plaintext';

    codeElement.className = '';
    codeElement.classList.add(`language-${lang}`);

    try {
        const highlighted = hljs.highlight(content, { language: lang, ignoreIllegals: true });
        codeElement.innerHTML = highlighted.value;
    } catch (e) {
        codeElement.textContent = content;
        codeElement.classList.add('language-plaintext');
        hljs.highlightElement(codeElement);
    }
}

function displayBinaryMessage(fileName) {
    const codeElement = document.getElementById('code-content');
    const currentFileSpan = document.getElementById('current-file');
    const imageContainer = document.querySelector('.image-container');
    const preElement = document.querySelector('.code-viewer pre');

    currentFileSpan.textContent = fileName;

    if (imageContainer) {
        imageContainer.style.display = 'none';
        imageContainer.innerHTML = '';
    }

    if (preElement) preElement.style.display = 'block';

    codeElement.style.display = 'block';
    codeElement.textContent = '[Бинарный файл — предварительный просмотр недоступен]';
    codeElement.className = 'language-plaintext';
    hljs.highlightElement(codeElement);
}

function displayErrorMessage(fileName, errorMsg) {
    const codeElement = document.getElementById('code-content');
    const currentFileSpan = document.getElementById('current-file');
    const imageContainer = document.querySelector('.image-container');
    const preElement = document.querySelector('.code-viewer pre');

    currentFileSpan.textContent = fileName;

    if (imageContainer) {
        imageContainer.style.display = 'none';
        imageContainer.innerHTML = '';
    }

    if (preElement) preElement.style.display = 'block';

    codeElement.style.display = 'block';
    codeElement.textContent = `Ошибка при загрузке файла: ${errorMsg}`;
    codeElement.className = 'language-plaintext';
    hljs.highlightElement(codeElement);
}

function showLoader(show) {
    const container = document.getElementById('file-tree');
    if (show) container.innerHTML = '<div class="loader">Загрузка...</div>';
}

function showError(message) {
    const container = document.getElementById('file-tree');
    container.innerHTML = `<div class="error-message">${escapeHtml(message)}</div>`;
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

async function checkLicense(items) {
    const licenseInfo = document.getElementById('license-info');
    if (!licenseInfo) return;

    const licenseFile = items.find(item => 
        item.type === 'file' && 
        item.name.toLowerCase().includes('license')
    );

    if (licenseFile) {
        const licenseNameSpan = document.getElementById('license-name');
        if (licenseNameSpan) licenseNameSpan.textContent = licenseFile.name;
        licenseInfo.style.display = 'flex';
        licenseInfo.onclick = () => loadAndShowFile(licenseFile.path, licenseFile.name);
    } else licenseInfo.style.display = 'none';
}
