const translations = {
    ru: {
        "title_403": "Lonewolf239 | Доступ запрещён",
        "err_403_title": "Доступ запрещён",
        "err_403_desc": "У вас нет прав для просмотра этой страницы.<br>Если вы считаете, что это ошибка, свяжитесь с администратором.",

        "title_404": "Lonewolf239 | Страница не найдена",
        "err_404_title": "Страница не найдена",
        "err_404_desc": "Запрашиваемая страница не существует или была перемещена.<br>Проверьте правильность адреса или вернитесь на главную.",

        "title_503": "Lonewolf239 | Сервис недоступен",
        "err_503_title": "Сервис временно недоступен",
        "err_503_desc": "Ведутся технические работы. Попробуйте зайти позже.<br>Приносим извинения за временные неудобства.",

        "title_index": "Lonewolf239 | Проекты и разработки",

        "title_releases": "Lonewolf239 | Релизы",
        "loading": "Загрузка...",
        "loading_github": "Загрузка данных с GitHub...",
        "select_release": "Выберите релиз из списка слева",

        "title_viewer": "Lonewolf239 | Просмотр кода",
        "license_label": "Лицензия",
        "readme_label": "README",
        "loading_content": "Загрузка содержимого...",
        "file_not_selected": "Файл не выбран",

        "title_wiki": "Lonewolf239 | Вики",
        "loading_pages": "Загрузка списка страниц...",
        "select_page": "Выберите страницу"
    },
    en: {
        "title_403": "Lonewolf239 | Access Denied",
        "err_403_title": "Access Denied",
        "err_403_desc": "You do not have permission to view this page.<br>If you believe this is an error, please contact the administrator.",

        "title_404": "Lonewolf239 | Page Not Found",
        "err_404_title": "Page Not Found",
        "err_404_desc": "The requested page does not exist or has been moved.<br>Check the URL or return to the homepage.",

        "title_503": "Lonewolf239 | Service Unavailable",
        "err_503_title": "Service Temporarily Unavailable",
        "err_503_desc": "Maintenance is currently underway. Please try again later.<br>We apologize for the temporary inconvenience.",

        "title_index": "Lonewolf239 | Projects & Development",

        "title_releases": "Lonewolf239 | Releases",
        "loading": "Loading...",
        "loading_github": "Loading data from GitHub...",
        "select_release": "Select a release from the list on the left",

        "title_viewer": "Lonewolf239 | Code Viewer",
        "license_label": "License",
        "readme_label": "README",
        "loading_content": "Loading content...",
        "file_not_selected": "No file selected",

        "title_wiki": "Lonewolf239 | Wiki",
        "loading_pages": "Loading pages list...",
        "select_page": "Select a page"
    },
    de: {
        "title_403": "Lonewolf239 | Zugriff verweigert",
        "err_403_title": "Zugriff verweigert",
        "err_403_desc": "Sie haben keine Berechtigung, diese Seite anzuzeigen.<br>Wenn Sie glauben, dass dies ein Fehler ist, wenden Sie sich bitte an den Administrator.",

        "title_404": "Lonewolf239 | Seite nicht gefunden",
        "err_404_title": "Seite nicht gefunden",
        "err_404_desc": "Die angeforderte Seite existiert nicht oder wurde verschoben.<br>Überprüfen Sie die URL oder kehren Sie zur Startseite zurück.",

        "title_503": "Lonewolf239 | Dienst nicht verfügbar",
        "err_503_title": "Dienst vorübergehend nicht verfügbar",
        "err_503_desc": "Es werden Wartungsarbeiten durchgeführt. Bitte versuchen Sie es später erneut.<br>Wir entschuldigen uns für die vorübergehenden Unannehmlichkeiten.",

        "title_index": "Lonewolf239 | Projekte & Entwicklung",

        "title_releases": "Lonewolf239 | Veröffentlichungen",
        "loading": "Wird geladen...",
        "loading_github": "Daten werden von GitHub geladen...",
        "select_release": "Wählen Sie links eine Veröffentlichung aus",

        "title_viewer": "Lonewolf239 | Code-Viewer",
        "license_label": "Lizenz",
        "readme_label": "README",
        "loading_content": "Inhalt wird geladen...",
        "file_not_selected": "Keine Datei ausgewählt",

        "title_wiki": "Lonewolf239 | Wiki",
        "loading_pages": "Seitenliste wird geladen...",
        "select_page": "Wählen Sie eine Seite aus"
    }
};

const currentPath = window.location.pathname;

let currentLang = 'ru';
if (currentPath.startsWith('/en')) currentLang = 'en';
else if (currentPath.startsWith('/de')) currentLang = 'de';

document.documentElement.lang = currentLang;

document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang] && translations[currentLang][key]) {
            if (el.tagName === 'TITLE') el.textContent = translations[currentLang][key];
            else el.innerHTML = translations[currentLang][key];
        }
    });
});
