<?php
ob_start();
session_start();

$envPath = __DIR__ . '/.env';
$adminPassword = '';

if (file_exists($envPath)) {
    $envContent = file_get_contents($envPath);
    if (preg_match('/^ADMIN_PASSWORD=(.*)$/m', $envContent, $matches)) {
        $adminPassword = trim($matches[1], " \t\n\r\0\x0B\"'");
    }
}

$jsonPath = __DIR__ . '/projects.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['action']) && $input['action'] === 'login') {
        while (ob_get_level()) { ob_end_clean(); } 
        header('Content-Type: application/json');

        if ($input['password'] === $adminPassword && !empty($adminPassword)) {
            $_SESSION['is_admin'] = true;
            echo json_encode(['status' => 'ok']);
        } else {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'Неверный пароль']);
        }
        exit;
    }

    if (isset($input['action']) && $input['action'] === 'save') {
        while (ob_get_level()) { ob_end_clean(); } 
        header('Content-Type: application/json');

        if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'Нет доступа']);
            exit;
        }

        $newData = $input['data'] ?? '';
        if (json_decode($newData) === null) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Невалидный JSON']);
            exit;
        }

        file_put_contents($jsonPath, $newData);
        echo json_encode(['status' => 'success']);
        exit;
    }
}

$currentJson = file_exists($jsonPath) ? file_get_contents($jsonPath) : '{}';

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(404);
    die();
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lonewolf239 | CMS Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
	<script src="https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.2/Sortable.min.js"></script>
    <style>
        :root {
            --bg-main: #09090b;
            --bg-panel: #18181b;
            --bg-card: #27272a;
            --primary: #ff00aa;
            --cyan: #00ffff;
            --text-main: #f4f4f5;
            --text-muted: #a1a1aa;
            --border: #3f3f46;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --info: #3b82f6;
            --border-radius: 10px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { 
            font-family: 'Inter', sans-serif; 
            background: var(--bg-main); color: var(--text-main); 
            display: flex; flex-direction: column; height: 100vh; overflow: hidden;
        }

        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg-main); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #52525b; }

        header {
            display: flex; justify-content: space-between; align-items: center;
            background: var(--bg-panel); border-bottom: 1px solid var(--border);
            padding: 12px 24px; z-index: 100; flex-shrink: 0;
        }
        .logo { font-weight: 800; font-size: 1.2rem; color: var(--cyan); display: flex; align-items: center; gap: 8px; }
        .unsaved-dot { width: 8px; height: 8px; background: var(--warning); border-radius: 50%; display: none; box-shadow: 0 0 8px var(--warning); }
        .unsaved-dot.show { display: block; }

        .controls, .tabs { display: flex; gap: 8px; align-items: center; }

        .btn, .tab-btn {
            background: var(--bg-card); border: 1px solid var(--border); color: var(--text-main);
            padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s ease;
            display: flex; align-items: center; gap: 6px;
        }
        .btn:hover:not(:disabled), .tab-btn:hover:not(:disabled) { background: #3f3f46; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .tab-btn.active { background: rgba(0,255,255,0.1); border-color: var(--cyan); color: var(--cyan); }

        .btn-success { background: rgba(16, 185, 129, 0.1); border-color: var(--success); color: var(--success); }
        .btn-success:hover:not(:disabled) { background: var(--success); color: #fff; }
        .btn-success.dirty { background: var(--warning); border-color: var(--warning); color: #000; animation: pulse 2s infinite; }

        .btn-danger { background: rgba(239, 68, 68, 0.1); border-color: var(--danger); color: var(--danger); }
        .btn-danger:hover:not(:disabled) { background: var(--danger); color: #fff; }

        .btn-warning { background: rgba(245, 158, 11, 0.1); border-color: var(--warning); color: var(--warning); }
        .btn-warning:hover:not(:disabled) { background: var(--warning); color: #fff; }

        .btn-info { background: rgba(59, 130, 246, 0.1); border-color: var(--info); color: var(--info); }
        .btn-info:hover:not(:disabled) { background: var(--info); color: #fff; }

        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
            100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }

        .workspace { flex: 1; display: flex; position: relative; overflow: hidden; }

        #raw-editor-container { position: relative; width: 100%; height: 100%; display: none; background: #0c0c0e; }
        #raw-editor-container.active { display: block; }
        #raw-editor, #highlighted-layer { 
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
            padding: 60px 20px 20px 20px; font-family: monospace; font-size: 14px; white-space: pre; overflow: auto; border: none; line-height: 1.5; 
        }
        #raw-editor { color: transparent; background: transparent; caret-color: #fff; z-index: 2; resize: none; outline: none; }
        #highlighted-layer { z-index: 1; color: #a1a1aa; pointer-events: none; }
        .str { color: #a5d6ff; } .num { color: #79c0ff; } .bool { color: #ff7b72; } .key { color: #7ee787; font-weight: bold; }

        .raw-toolbar { position: absolute; top: 10px; right: 20px; z-index: 10; display: flex; gap: 8px; }

        #visual-editor { display: none; width: 100%; height: 100%; overflow-y: auto; padding: 30px; padding-bottom: 80px; max-width: 1200px; margin: 0 auto; scroll-behavior: smooth; }
        #visual-editor.active { display: flex; flex-direction: column; gap: 30px; }

        .section-header { 
            display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
            font-size: 1.1rem; font-weight: 700; color: var(--text-muted); 
            border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 16px; 
        }
        .header-controls { display: flex; gap: 8px; align-items: center; }

        .search-bar {
            background: var(--bg-main); border: 1px solid var(--border); color: #fff;
            padding: 6px 12px; border-radius: 6px; outline: none; font-size: 0.9rem; width: 300px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-bar:focus { border-color: var(--cyan); box-shadow: 0 0 5px rgba(0, 255, 255, 0.2); }

        .gui-card { background: var(--bg-panel); border: 1px solid var(--border); border-radius: var(--border-radius); margin-bottom: 12px; transition: border-color 0.2s, opacity 0.3s; }
        .gui-card.hidden { display: none !important; }
        .gui-card-header { display: flex; align-items: center; padding: 12px 16px; cursor: pointer; gap: 12px; user-select: none; border-radius: var(--border-radius); }
        .gui-card-header:hover { background: rgba(255,255,255,0.03); }
        .gui-card.open > .gui-card-header { border-bottom: 1px solid var(--border); border-bottom-left-radius: 0; border-bottom-right-radius: 0; }

        .drag-handle { cursor: grab; color: var(--text-muted); font-size: 1.2rem; padding: 0 5px; transition: color 0.2s; }
        .drag-handle:hover { color: var(--cyan); }
        .card-title { flex: 1; font-weight: 600; font-size: 1rem; display: flex; align-items: center; gap: 10px; }

        .status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .s-active { background: #00ffaa; box-shadow: 0 0 8px #00ffaa; }
        .s-paused { background: #ffea00; box-shadow: 0 0 8px #ffea00; }
        .s-archived { background: #ff1744; box-shadow: 0 0 8px #ff1744; }
        .s-completed { background: #2979ff; box-shadow: 0 0 8px #2979ff; }

        .gui-card-body { padding: 20px; display: none; flex-direction: column; gap: 20px; }
        .gui-card.open > .gui-card-body { display: flex; }

        .sortable-ghost { opacity: 0.3; background: rgba(0, 255, 255, 0.05); border: 1px dashed var(--cyan); }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
		.grid-3 .form-textarea { height: 100%; }

        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
        .form-input, .form-select, .form-textarea { width: 100%; background: var(--bg-main); border: 1px solid var(--border); color: #fff; padding: 8px 12px; border-radius: 6px; outline: none; font-size: 0.9rem; transition: border-color 0.2s; }
        .form-input:focus, .form-textarea:focus, .form-select:focus { border-color: var(--cyan); }
        .form-textarea { resize: vertical; min-height: 60px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }

        .avatar-preview { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border); background: var(--bg-main); }

        .chips-wrapper { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; background: var(--bg-main); padding: 8px; border-radius: 6px; border: 1px solid var(--border); }
        .chip { background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 2px 8px; border-radius: 12px; display: flex; align-items: center; gap: 6px; font-size: 0.8rem; }
        .chip button { background: none; border: none; color: var(--danger); cursor: pointer; font-weight: bold; }
        .chip-input { background: transparent; border: none; color: #fff; outline: none; font-size: 0.85rem; flex: 1; min-width: 100px; }

        .suggestions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .sug-btn { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-muted); font-size: 0.75rem; padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s; }

        .suggestions .sug-btn:hover, .link-presets .sug-btn:hover { background: rgba(0, 255, 255, 0.1); color: var(--cyan); border-color: var(--cyan); }
        .sug-btn.active { background: rgba(0, 255, 255, 0.15); color: var(--cyan); border-color: var(--cyan); font-weight: bold; }

        .btn-add-massive { width: 100%; padding: 12px; background: transparent; border: 1px dashed var(--border); color: var(--text-muted); border-radius: 6px; cursor: pointer; transition: 0.2s; font-weight: 600; }
        .btn-add-massive:hover { border-color: var(--cyan); color: var(--cyan); background: rgba(0,255,255,0.05); }

        .fab-up {
            position: fixed; bottom: 20px; left: 20px; width: 44px; height: 44px;
            background: var(--bg-card); border: 1px solid var(--border); border-radius: 50%;
            color: var(--cyan); font-size: 1.2rem; display: flex; align-items: center; justify-content: center;
            cursor: pointer; opacity: 0; pointer-events: none; transform: translateY(20px);
            transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 1000;
        }
        .fab-up.show { opacity: 1; pointer-events: auto; transform: translateY(0); }
        .fab-up:hover { background: rgba(0, 255, 255, 0.1); }

        #toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 24px; border-radius: 6px; font-weight: 600; color: #fff; opacity: 0; transform: translateY(20px); transition: 0.3s; z-index: 1000; pointer-events: none; }
        #toast.show { opacity: 1; transform: translateY(0); }
        .toast-success { background: var(--success); }
        .toast-error { background: var(--danger); }

        .kv-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    </style>
</head>
<body>

    <header>
        <div class="logo">Lonewolf239 CMS <span id="unsaved-dot" class="unsaved-dot" title="Есть несохраненные изменения"></span></div>
        <div class="tabs">
            <button class="tab-btn active" onclick="switchMode('visual')">Визуальный</button>
            <button class="tab-btn" onclick="switchMode('raw')">Raw JSON</button>
        </div>
        <div class="controls">
            <button class="btn btn-warning" id="btn-undo" onclick="undo()" disabled>↩ Отменить</button>
            <button class="btn btn-warning" id="btn-redo" onclick="redo()" disabled>↪ Повторить</button>
            <div style="width: 1px; height: 20px; background: var(--border); margin: 0 5px;"></div>
            <button class="btn" onclick="downloadJSON()">📥 Экспорт</button>
            <button class="btn btn-success" id="btn-save" onclick="saveToServer()">💾 Сохранить</button>
        </div>
    </header>

    <div class="workspace">
        <div id="visual-editor" class="active"></div>
        <div id="raw-editor-container">
            <div class="raw-toolbar">
                <button class="btn" onclick="formatRawJSON()">✨ Автоформат</button>
                <button class="btn" onclick="copyRawJSON()">📋 Скопировать</button>
            </div>
            <pre id="highlighted-layer"></pre>
            <textarea id="raw-editor" spellcheck="false"></textarea>
        </div>
    </div>

    <div id="fab-up" class="fab-up" onclick="scrollToTop()">↑</div>
    <div id="toast"></div>

    <script>
        let jsonData = <?php echo json_encode(json_decode($currentJson, true)); ?>;

        let historyStack = [];
        let historyIndex = -1;
        let isNavigatingHistory = false;
        let hasUnsavedChanges = false;

        const rawEditor = document.getElementById('raw-editor');
        const display = document.getElementById('highlighted-layer');
        const visualEditor = document.getElementById('visual-editor');
        let currentMode = 'visual';
        let sortableInstance = null;

        const COMMON_TAGS = ['Library', '.NET', 'Bot', 'Telegram', 'Game', 'Console', 'Desktop', 'Utility', 'Security', 'Web'];
        const COMMON_LANGS = ['C#', 'Python', 'C++', 'JavaScript', 'HTML', 'CSS'];
        const COMMON_LINKS = ['github', 'nuget', 'code', 'download', 'wiki'];

        window.addEventListener('beforeunload', (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        function markDirty(state = true) {
            hasUnsavedChanges = state;
            const dot = document.getElementById('unsaved-dot');
            const btnSave = document.getElementById('btn-save');

            if (state) {
                dot.classList.add('show');
                btnSave.classList.add('dirty');
                btnSave.innerHTML = '💾 Сохранить *';
            } else {
                dot.classList.remove('show');
                btnSave.classList.remove('dirty');
                btnSave.innerHTML = '💾 Сохранить';
            }
        }

        saveStateToHistory(true);
        rawEditor.value = JSON.stringify(jsonData, null, 4);
        renderVisualApp();

        visualEditor.addEventListener('scroll', () => {
            const fab = document.getElementById('fab-up');
            if (visualEditor.scrollTop > 300) fab.classList.add('show');
            else fab.classList.remove('show');
        });

        function scrollToTop() {
            visualEditor.scrollTo({ top: 0, behavior: 'smooth' });
        }

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveToServer(); }
            if (e.ctrlKey && e.key === 'z' && currentMode === 'visual') { e.preventDefault(); undo(); }
            if (e.ctrlKey && e.key === 'y' && currentMode === 'visual') { e.preventDefault(); redo(); }
        });

        function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

        function saveStateToHistory(isInitial = false) {
            if (isNavigatingHistory) return;
            if (historyIndex < historyStack.length - 1) {
                historyStack = historyStack.slice(0, historyIndex + 1);
            }
            historyStack.push(deepClone(jsonData));
            if (historyStack.length > 30) historyStack.shift(); 
            else historyIndex++;
            updateHistoryButtons();

            if (!isInitial) markDirty(true);
        }

        function updateHistoryButtons() {
            document.getElementById('btn-undo').disabled = historyIndex <= 0;
            document.getElementById('btn-redo').disabled = historyIndex >= historyStack.length - 1;
        }

        function undo() {
            if (historyIndex > 0) {
                isNavigatingHistory = true;
                historyIndex--;
                jsonData = deepClone(historyStack[historyIndex]);
                renderVisualApp();
                updateHistoryButtons();
                isNavigatingHistory = false;
                markDirty(true);
                showToast('Действие отменено', 'success');
            }
        }

        function redo() {
            if (historyIndex < historyStack.length - 1) {
                isNavigatingHistory = true;
                historyIndex++;
                jsonData = deepClone(historyStack[historyIndex]);
                renderVisualApp();
                updateHistoryButtons();
                isNavigatingHistory = false;
                markDirty(true);
                showToast('Действие повторено', 'success');
            }
        }

        function switchMode(mode) {
            if (currentMode === mode) return;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');

            if (mode === 'visual') {
                try {
                    jsonData = JSON.parse(rawEditor.value);
                    saveStateToHistory(); 
                    renderVisualApp();
                    document.getElementById('raw-editor-container').classList.remove('active');
                    visualEditor.classList.add('active');
                    currentMode = 'visual';
                    updateHistoryButtons();
                } catch(e) {
                    showToast('Ошибка синтаксиса JSON!', 'error');
                    document.querySelectorAll('.tab-btn')[1].classList.add('active');
                    event.target.classList.remove('active');
                }
            } else {
                rawEditor.value = JSON.stringify(jsonData, null, 4);
                validateAndHighlight();
                visualEditor.classList.remove('active');
                document.getElementById('raw-editor-container').classList.add('active');
                currentMode = 'raw';
                document.getElementById('btn-undo').disabled = true;
                document.getElementById('btn-redo').disabled = true;
            }
        }

        function showToast(msg, type = 'success') {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.className = `toast-${type} show`;
            setTimeout(() => toast.className = '', 3000);
        }

        rawEditor.addEventListener('input', () => { syncScroll(); validateAndHighlight(); markDirty(true); });
        rawEditor.addEventListener('scroll', syncScroll);

        function syncScroll() { display.scrollTop = rawEditor.scrollTop; display.scrollLeft = rawEditor.scrollLeft; }
        function validateAndHighlight() {
            const code = rawEditor.value;
            try { JSON.parse(code); display.innerHTML = syntaxHighlight(code); } 
            catch (e) { display.textContent = code; }
        }
        function syntaxHighlight(json) {
            return json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
                    let cls = 'num';
                    if (/^"/.test(match)) cls = /:$/.test(match) ? 'key' : 'str';
                    else if (/true|false/.test(match)) cls = 'bool';
                    return `<span class="${cls}">${match}</span>`;
                });
        }
        function formatRawJSON() {
			try {
		        const currentText = rawEditor.value;
		        const parsed = JSON.parse(currentText);
		        const formattedText = JSON.stringify(parsed, null, 4);

		        if (currentText !== formattedText) {
		            rawEditor.value = formattedText;
		            validateAndHighlight();
		            markDirty(true);
		            showToast('JSON отформатирован', 'success');
		        } else showToast('JSON уже идеально отформатирован', 'success');
		    } catch(e) { showToast('Невозможно отформатировать: ошибка JSON', 'error'); }
		}
        function copyRawJSON() {
            navigator.clipboard.writeText(rawEditor.value).then(() => {
                showToast('Скопировано в буфер', 'success');
            });
        }

        function updateData(path, value) {
            let current = jsonData;
            for (let i = 0; i < path.length - 1; i++) {
                if (current[path[i]] === undefined) current[path[i]] = {};
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            markDirty(true);
        }

        function deleteData(path) {
            let current = jsonData;
            for (let i = 0; i < path.length - 1; i++) current = current[path[i]];
            if (Array.isArray(current)) current.splice(path[path.length - 1], 1);
            else delete current[path[path.length - 1]];
            saveStateToHistory(); 
        }

        function renderVisualApp() {
            visualEditor.innerHTML = '';
            if (!jsonData.about) jsonData.about = {};
            if (!jsonData.subprojects_pool) jsonData.subprojects_pool = {};
            if (!jsonData.projects) jsonData.projects = [];

            const aboutSec = document.createElement('div');
            aboutSec.innerHTML = `<div class="section-header">Настройки профиля (About)</div>`;
            const aboutCard = buildCard("Профиль и Портфолио", true, null, true); 
            aboutCard.body.appendChild(buildAvatarInput('URL Аватара', jsonData.about.avatar || '', ['about', 'avatar']));
			let aboutTitle = typeof jsonData.about.title === 'string' ? jsonData.about.title : (jsonData.about.title?.ru || jsonData.about.title?.en || '');
			aboutCard.body.appendChild(buildTitleInput('Заголовок', aboutTitle, ['about', 'title']));
            aboutCard.body.appendChild(buildI18nField('Описание', jsonData.about.description || {}, ['about', 'description'], true));
            aboutCard.body.appendChild(buildTagsField('Стек технологий', jsonData.about.techStack || [], ['about', 'techStack'], COMMON_LANGS));
            aboutSec.appendChild(aboutCard.card);
            visualEditor.appendChild(aboutSec);

            const subSec = document.createElement('div');
            subSec.innerHTML = `<div class="section-header">Пул подпроектов (Библиотеки/Боты)</div>`;
            Object.keys(jsonData.subprojects_pool).forEach(id => {
                subSec.appendChild(buildProjectCard(jsonData.subprojects_pool[id], ['subprojects_pool', id], id));
            });
            const btnAddSub = document.createElement('button');
            btnAddSub.className = 'btn-add-massive'; btnAddSub.innerText = '+ Добавить подпроект';
            btnAddSub.onclick = () => {
                const id = prompt("ID подпроекта (англ, без пробелов):", "new_lib");
                if (id) {
                    const cleanId = id.trim().replace(/\s+/g, '_');
                    if (jsonData.subprojects_pool[cleanId]) {
                        showToast('Подпроект с таким ID уже существует!', 'error');
                        return;
                    }
                    jsonData.subprojects_pool[cleanId] = getEmptyProj(); 
                    saveStateToHistory();
                    renderVisualApp();
                }
            };
            subSec.appendChild(btnAddSub);
            visualEditor.appendChild(subSec);

            const projSec = document.createElement('div');

            const projHeader = document.createElement('div');
            projHeader.className = 'section-header';
            projHeader.innerHTML = `
                <div style="display:flex; align-items:center; gap: 12px;">
                    <span>Проекты</span> 
                    <input type="text" id="project-search" class="search-bar" placeholder="🔍 Поиск проекта...">
                </div>
                <div class="header-controls">
                    <button class="btn" onclick="document.querySelectorAll('.projects-container .gui-card').forEach(c => c.classList.add('open'))">Развернуть все</button>
                    <button class="btn" onclick="document.querySelectorAll('.projects-container .gui-card').forEach(c => c.classList.remove('open'))">Свернуть все</button>
                </div>
            `;
            projSec.appendChild(projHeader);

            const projContainer = document.createElement('div');
            projContainer.className = 'projects-container';

            let projCards = [];
            jsonData.projects.forEach((proj, idx) => {
                const card = buildProjectCard(proj, ['projects', idx], null, idx);
				let searchTitle = typeof proj.title === 'string' ? proj.title : (proj.title?.ru || proj.title?.en || "Untitled");
				card.dataset.title = searchTitle.toLowerCase();
                projCards.push(card);
                projContainer.appendChild(card);
            });
            projSec.appendChild(projContainer);

            setTimeout(() => {
                const searchInput = document.getElementById('project-search');
                if(searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        const term = e.target.value.toLowerCase();
                        projCards.forEach(card => {
                            if(card.dataset.title.includes(term)) card.classList.remove('hidden');
                            else card.classList.add('hidden');
                        });
                    });
                }
            }, 0);

            sortableInstance = new Sortable(projContainer, {
                animation: 150, handle: '.drag-handle', ghostClass: 'sortable-ghost',
                onEnd: function (evt) {
                    const moved = jsonData.projects.splice(evt.oldIndex, 1)[0];
                    jsonData.projects.splice(evt.newIndex, 0, moved);
                    saveStateToHistory(); 
                    renderVisualApp(); 
                }
            });

            const btnAddProj = document.createElement('button');
            btnAddProj.className = 'btn-add-massive'; btnAddProj.innerText = '+ Создать проект';
            btnAddProj.style.marginTop = '12px';
            btnAddProj.onclick = () => { 
                jsonData.projects.unshift(getEmptyProj()); 
                saveStateToHistory();
                renderVisualApp(); 
            };
            projSec.appendChild(btnAddProj);
            visualEditor.appendChild(projSec);
        }

        function getEmptyProj() {
			return {
		        title: { ru: "Новый проект", en: "Новый проект", de: "Новый проект" },
		        description: { ru: "", en: "", de: "" },
		        status: "active",
		        tags: [],
		        links: {}
		    };
		}

        function buildCard(titleText, isOpenable = true, status = null, defaultOpen = false) {
            const card = document.createElement('div'); card.className = 'gui-card';
            const header = document.createElement('div'); header.className = 'gui-card-header';

            const title = document.createElement('div'); title.className = 'card-title';
            if(status) title.innerHTML = `<span class="status-dot s-${status}"></span> ${titleText}`;
            else title.textContent = titleText;

            header.appendChild(title);
            const body = document.createElement('div'); body.className = 'gui-card-body';

            if (isOpenable) {
                if (defaultOpen) card.classList.add('open');
                header.onclick = (e) => { if (!['BUTTON', 'INPUT'].includes(e.target.tagName) && !e.target.classList.contains('drag-handle')) card.classList.toggle('open'); };
            } else { card.classList.add('open'); header.style.cursor = 'default'; }

            card.appendChild(header); card.appendChild(body);
            return { card, header, body, title };
        }

        function buildProjectCard(data, path, isSubId = null, arrIdx = null) {
			let tStr = typeof data.title === 'string' ? data.title : (data.title?.ru || data.title?.en || "Untitled");
            if (isSubId) tStr = `[${isSubId}] ${tStr}`;

            const { card, header, body, title } = buildCard(tStr, true, data.status || 'active');

            if (arrIdx !== null) {
                const h = document.createElement('div'); h.className = 'drag-handle'; h.innerHTML = '☰';
                header.insertBefore(h, header.firstChild);
			}

            const btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex'; btnGroup.style.gap = '6px';

            if (arrIdx !== null) {
                const btnClone = document.createElement('button'); btnClone.className = 'btn btn-info';
                btnClone.innerHTML = 'Дублировать'; btnClone.style.padding = '4px 8px';
                btnClone.onclick = (e) => {
                    e.stopPropagation();
                    const clonedData = deepClone(data);
					if (typeof clonedData.title === 'string') clonedData.title += ' (Копия)';
					else if (clonedData.title) {
						if (clonedData.title.ru) clonedData.title.ru += ' (Копия)';
						if (clonedData.title.en) clonedData.title.en += ' (Копия)';
					    if (clonedData.title.de) clonedData.title.de += ' (Копия)';
					}

                    jsonData.projects.splice(arrIdx + 1, 0, clonedData);
                    saveStateToHistory();
                    renderVisualApp();
                    showToast('Проект продублирован', 'success');
                };
                btnGroup.appendChild(btnClone);
            }

            const btnDel = document.createElement('button'); btnDel.className = 'btn btn-danger';
            btnDel.innerHTML = 'Удалить'; btnDel.style.padding = '4px 8px';
            btnDel.onclick = (e) => {
                e.stopPropagation(); if(confirm(`Удалить "${tStr}"?`)) { deleteData(path); renderVisualApp(); }
            };

            btnGroup.appendChild(btnDel);
            header.appendChild(btnGroup);

            const r1 = document.createElement('div'); r1.className = 'grid-2';
            r1.appendChild(buildSelect('Статус', ['active', 'paused', 'archived', 'completed'], data.status || 'active', [...path, 'status'], title, tStr));
            r1.appendChild(buildDateInput('Последний релиз', data.lastRelease || '', [...path, 'lastRelease']));
            body.appendChild(r1);

			let projTitle = typeof data.title === 'string' ? data.title : (data.title?.ru || data.title?.en || '');
			body.appendChild(buildTitleInput('Заголовок', projTitle, [...path, 'title']));

            body.appendChild(buildI18nField('Описание', data.description || {}, [...path, 'description'], true));

            let langs = typeof data.language === 'string' ? [data.language] : (data.language || []);
            body.appendChild(buildTagsField('Языки', langs, [...path, 'language'], COMMON_LANGS));
            body.appendChild(buildTagsField('Теги', data.tags || [], [...path, 'tags'], COMMON_TAGS));

            if (arrIdx !== null)
                body.appendChild(buildSubprojectSelector('Привязанные подпроекты', data.subprojects || [], [...path, 'subprojects']));

            body.appendChild(buildLinksEditor('Ссылки', data.links || {}, [...path, 'links']));
            return card;
        }

        function buildStringInput(label, val, path) {
            const w = document.createElement('div'); w.className = 'form-group';
            w.innerHTML = `<label class="form-label">${label}</label><input class="form-input" type="text" value="${val}">`;
            const inp = w.querySelector('input');
            inp.oninput = e => updateData(path, e.target.value);
            inp.onchange = e => saveStateToHistory(); 
            return w;
        }

		function buildTitleInput(label, val, path) {
		    const w = document.createElement('div'); w.className = 'form-group';
		    const safeVal = val ? String(val).replace(/"/g, '&quot;') : '';
		    w.innerHTML = `<label class="form-label">${label}</label><input class="form-input" type="text" value="${safeVal}">`;

		    const inp = w.querySelector('input');
		    inp.oninput = e => {
		        const v = e.target.value;
		        updateData(path, { ru: v, en: v, de: v });
		    };
		    inp.onchange = e => saveStateToHistory(); 
		    return w;
		}

        function buildAvatarInput(label, val, path) {
            const w = document.createElement('div'); w.className = 'form-group';
            const safeVal = val ? val.replace(/"/g, '&quot;') : '';
            w.innerHTML = `
                <label class="form-label">${label}</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <img src="${safeVal || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'></svg>'}"
                         class="avatar-preview"
                         onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'36\' height=\'36\'><rect width=\'36\' height=\'36\' fill=\'%233f3f46\'/></svg>'" alt="avatar">
                    <input class="form-input" type="text" value="${safeVal}" style="flex: 1;" placeholder="https://...">
                </div>`;
            const inp = w.querySelector('input');
            const img = w.querySelector('img');
            inp.oninput = e => {
                updateData(path, e.target.value);
                img.src = e.target.value || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'></svg>';
            };
            inp.onchange = e => saveStateToHistory();
            return w;
        }

        function buildDateInput(label, val, path) {
            const w = document.createElement('div'); w.className = 'form-group';
            const safeVal = (val && val.match(/^\d{4}-\d{2}-\d{2}$/)) ? val : '';
            w.innerHTML = `<label class="form-label">${label}</label><input class="form-input" type="date" value="${safeVal}">`;
            const inp = w.querySelector('input');
            inp.oninput = e => updateData(path, e.target.value);
            inp.onchange = e => saveStateToHistory(); 
            return w;
        }

        function buildSelect(label, opts, val, path, titleNode = null, baseTitle = "") {
            const w = document.createElement('div'); w.className = 'form-group';
            w.innerHTML = `<label class="form-label">${label}</label>`;
            const s = document.createElement('select'); s.className = 'form-select';
            opts.forEach(o => { s.innerHTML += `<option value="${o}" ${o===val?'selected':''}>${o}</option>`; });
            s.onchange = e => { 
                updateData(path, e.target.value); 
                saveStateToHistory();
                if(titleNode) titleNode.innerHTML = `<span class="status-dot s-${e.target.value}"></span> ${baseTitle}`;
            };
            w.appendChild(s); return w;
        }

        function buildI18nField(label, obj, path, isTa = false) {
		    const w = document.createElement('div'); w.className = 'form-group';
		    w.innerHTML = `<label class="form-label">${label}</label>`;
		    const g = document.createElement('div'); g.className = 'grid-3';

		    const fields = [];

		    ['ru', 'en', 'de'].forEach(l => {
		        const el = document.createElement(isTa ? 'textarea' : 'input');
		        el.className = isTa ? 'form-textarea' : 'form-input'; el.placeholder = l.toUpperCase();
		        el.value = obj[l] || ''; 
		        el.oninput = e => updateData([...path, l], e.target.value);
		        el.onchange = e => saveStateToHistory();
		        g.appendChild(el);
		        fields.push(el);
		    });

		    if (isTa) {
		        let isSyncing = false;
		        const observer = new ResizeObserver(entries => {
		            if (isSyncing) return;

		            for (let entry of entries) {
		                const target = entry.target;
		                const newHeight = target.style.height;

		                if (newHeight) {
		                    isSyncing = true;
		                    fields.forEach(f => {
		                        if (f !== target) f.style.height = newHeight;
		                    });

		                    requestAnimationFrame(() => { isSyncing = false; });
		                    break;
		                }
		            }
		        });

		        fields.forEach(f => observer.observe(f));
		    }

		    w.appendChild(g); return w;
		}

        function buildTagsField(label, arr, path, suggestionsList = []) {
            const w = document.createElement('div'); w.className = 'form-group';
            w.innerHTML = `<label class="form-label">${label}</label>`;

            const cw = document.createElement('div'); cw.className = 'chips-wrapper';
            const renderChips = () => {
                cw.innerHTML = '';
                arr.forEach((item, i) => {
                    cw.innerHTML += `<div class="chip">${item} <button type="button" onclick="this.parentElement.remove();">✕</button></div>`;
                    cw.lastChild.querySelector('button').onclick = () => { 
                        arr.splice(i, 1); updateData(path, arr); saveStateToHistory(); renderChips(); renderSug(); 
                    };
                });
                const inp = document.createElement('input'); inp.className = 'chip-input'; inp.placeholder = 'Добавить...';
                inp.onkeydown = e => { 
                    if(e.key === 'Enter' && inp.value.trim()){ 
                        e.preventDefault(); 
                        arr.push(inp.value.trim()); 
                        updateData(path, arr); 
                        saveStateToHistory();
                        renderChips(); renderSug(); 
                        setTimeout(()=>cw.querySelector('input').focus(), 10); 
                    }
                };
                cw.appendChild(inp);
            };

            const sugWrap = document.createElement('div'); sugWrap.className = 'suggestions';
            const renderSug = () => {
                sugWrap.innerHTML = '';
                suggestionsList.forEach(s => {
                    if(!arr.includes(s)) {
                        const b = document.createElement('button'); b.className = 'sug-btn'; b.textContent = '+ '+s;
                        b.onclick = () => { arr.push(s); updateData(path, arr); saveStateToHistory(); renderChips(); renderSug(); };
                        sugWrap.appendChild(b);
                    }
                });
            };

			renderChips();
			renderSug();
			w.appendChild(cw);
			w.appendChild(sugWrap);
			return w;
        }

        function buildSubprojectSelector(label, arr, path) {
            const w = document.createElement('div'); w.className = 'form-group';
            w.innerHTML = `<label class="form-label">${label}</label>`;
            const cw = document.createElement('div'); cw.className = 'suggestions';

            const render = () => {
                cw.innerHTML = '';
                const allPool = Object.keys(jsonData.subprojects_pool || {});
                if(allPool.length === 0) { cw.innerHTML = '<span style="color:var(--text-muted); font-size:0.8rem;">В пуле нет подпроектов</span>'; return; }

                allPool.forEach(id => {
                    const isActive = arr.includes(id);
                    const b = document.createElement('button'); 
                    b.className = `sug-btn ${isActive ? 'active' : ''}`;
                    b.textContent = id;
                    b.onclick = () => {
                        if(isActive) arr.splice(arr.indexOf(id), 1); else arr.push(id);
                        updateData(path, arr); 
                        saveStateToHistory();
                        render();
                    };
                    cw.appendChild(b);
                });
			};

			render();
			w.appendChild(cw);
			return w;
        }

        function buildLinksEditor(label, obj, path) {
            const w = document.createElement('div'); w.className = 'form-group';
			w.innerHTML = `<div class="form-label" style="display:flex; justify-content:space-between; align-items:center;">
			    ${label} <div class="link-presets" style="display:flex; gap:4px;"></div>
			</div>`;
            const cont = document.createElement('div');

            const render = () => {
                cont.innerHTML = '';
                const presetWrap = w.querySelector('.link-presets'); presetWrap.innerHTML = '';
                COMMON_LINKS.forEach(k => {
                    if (!obj[k]) {
                        const btn = document.createElement('button'); btn.className = 'sug-btn'; btn.innerText = '+ '+k;
                        btn.onclick = () => { obj[k] = ""; updateData(path, obj); saveStateToHistory(); render(); };
                        presetWrap.appendChild(btn);
                    }
                });
                const customBtn = document.createElement('button'); customBtn.className = 'sug-btn'; customBtn.innerText = '+ Другая';
                customBtn.onclick = () => { let c=1; while(obj[`link_${c}`]) c++; obj[`link_${c}`]=""; updateData(path, obj); saveStateToHistory(); render(); };
                presetWrap.appendChild(customBtn);

                Object.keys(obj).forEach(k => {
                    const row = document.createElement('div'); row.className = 'kv-row';
                    const iK = document.createElement('input'); iK.className = 'form-input'; iK.style.flex = '0.3'; iK.value = k;
                    const iV = document.createElement('input'); iV.className = 'form-input'; iV.style.flex = '1'; iV.placeholder = 'URL...';

                    let val = obj[k];
                    if (typeof val === 'string') iV.value = val;
                    else if (val && val.url) iV.value = typeof val.url === 'string' ? val.url : (val.url.en || '');

					iK.onchange = e => {
						const nk = e.target.value;
						if (nk && nk!==k) {
							obj[nk]=obj[k];
							delete obj[k];
							updateData(path,obj);
							saveStateToHistory();
							render();
						}
					};

                    iV.oninput = e => {
                        if (typeof obj[k] === 'string') obj[k] = e.target.value;
                        else { if(!obj[k].url) obj[k].url={ru:"",en:"",de:""}; obj[k].url.ru = obj[k].url.en = obj[k].url.de = e.target.value; }
                        updateData(path, obj);
                    };
                    iV.onchange = e => saveStateToHistory();

                    const bD = document.createElement('button'); bD.className = 'btn btn-danger'; bD.innerHTML = '✕';
                    bD.onclick = () => { delete obj[k]; updateData(path, obj); saveStateToHistory(); render(); };

                    row.appendChild(iK); row.appendChild(iV); row.appendChild(bD); cont.appendChild(row);
                });
            };
            render(); w.appendChild(cont); return w;
        }

        async function saveToServer() {
            let payload = currentMode === 'visual' ? JSON.stringify(jsonData, null, 4) : rawEditor.value;
            if(currentMode === 'visual') { rawEditor.value = payload; validateAndHighlight(); }

            try { JSON.parse(payload); } catch(e) { return showToast("Ошибка JSON!", 'error'); }

            try {
                const res = await fetch('admin.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', data: payload }) });
                const r = await res.json();
                if (r.status === 'success') {
                    showToast("Сохранено на сервере!", 'success');
                    markDirty(false);
                }
                else showToast("Ошибка: " + r.message, 'error');
            } catch(e) { showToast("Ошибка сети", 'error'); }
        }

        function downloadJSON() {
            const data = currentMode === 'visual' ? JSON.stringify(jsonData, null, 4) : rawEditor.value;
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([data], {type: "application/json"}));
            a.download = "projects.json"; a.click();
        }
    </script>
</body>
</html>
