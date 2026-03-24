function createButton({ onClick, imgSrc, imgAlt, imgWidth = 24, imgHeight = 24, id, text }) {
    const button = document.createElement('button');
    if (id) button.id = id;
    button.addEventListener('click', onClick);
    if (imgSrc) {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = imgAlt;
        img.width = imgWidth;
        img.height = imgHeight;
        button.appendChild(img);
    }
    if (text) button.appendChild(document.createTextNode(text));
    return button;
}

function loadProjects() {
	const projectsGrid = document.querySelector('.projects-grid');
	if (!projectsGrid) return;

	const htmlLang = document.documentElement.lang || 'en';
	let currentLang = 'ru';
	if (htmlLang.startsWith('en')) currentLang = 'en';
	else if (htmlLang.startsWith('de')) currentLang = 'de';
	else currentLang = 'ru';

	const buttonLabels = {
		ru: {
			github: 'GitHub',
			nuget: 'NuGet',
			wiki: 'Вики',
			code: 'Код',
			download: 'Скачать'
		},
		en: {
			github: 'GitHub',
			nuget: 'NuGet',
			wiki: 'Wiki',
			code: 'Code',
			download: 'Download'
		},
		de: {
			github: 'GitHub',
			nuget: 'NuGet',
			wiki: 'Wiki',
			code: 'Code',
			download: 'Herunterladen'
		}
	};

    const languageNames = {
    	ru: { 'C#': 'C#', 'C++': 'C++', 'Python': 'Python', 'JavaScript': 'JavaScript' },
    	en: { 'C#': 'C#', 'C++': 'C++', 'Python': 'Python', 'JavaScript': 'JavaScript' },
    	de: { 'C#': 'C#', 'C++': 'C++', 'Python': 'Python', 'JavaScript': 'JavaScript' }
    };

	function getLocalizedValue(value, lang) {
		if (typeof value === 'object' && value !== null)
			return value[lang] || value.en || Object.values(value)[0] || '';
		return value || '';
	}

	function formatDate(dateString, lang) {
		if (!dateString) return null;
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return null;
			
			const options = { year: 'numeric', month: 'short', day: 'numeric' };
			return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'de' ? 'de-DE' : 'en-US', options);
		} catch { return null; }
	}

	fetch('/projects.json')
		.then(response => {
			if (!response.ok) throw new Error(`HTTP error ${response.status}`);
			return response.json();
		})
		.then(projects => {
			projectsGrid.innerHTML = '';

			projects.forEach(project => {
				const title = getLocalizedValue(project.title, currentLang) || 'Untitled';
				const description = getLocalizedValue(project.description, currentLang) || '';
				const tags = Array.isArray(project.tags) ? project.tags : [];
				const links = project.links || {};
				const language = project.language || null;
				const lastRelease = project.lastRelease || null;
				
				const card = document.createElement('div');
				card.className = 'project-card';

				const topBar = document.createElement('div');
				topBar.className = 'project-top-bar';

				if (language && ['C#', 'C++', 'Python', 'JavaScript'].includes(language)) {
					const langBadge = document.createElement('div');
					langBadge.className = `project-language-badge language-${language.toLowerCase().replace('#', 'sharp').replace('+', 'p')}`;
					langBadge.textContent = language;
					topBar.appendChild(langBadge);
				}

				if (lastRelease) {
					const formattedDate = formatDate(lastRelease, currentLang);
					if (formattedDate) {
						const releaseDate = document.createElement('div');
						releaseDate.className = 'project-release-date';
						releaseDate.textContent = formattedDate;
						topBar.appendChild(releaseDate);
					}
				}

				if (topBar.children.length > 0) card.appendChild(topBar);

				const h3 = document.createElement('h3');
				h3.textContent = title;
				card.appendChild(h3);

				const p = document.createElement('p');
				p.textContent = description;
				card.appendChild(p);

				if (tags.length) {
					const tagsDiv = document.createElement('div');
					tagsDiv.className = 'project-tags';
					tags.forEach(tag => {
						const span = document.createElement('span');
						span.className = 'tag';
						span.textContent = tag;
						tagsDiv.appendChild(span);
					});

					card.appendChild(tagsDiv);
				}

				const linkEntries = Object.entries(links);
				if (linkEntries.length) {
					const linksDiv = document.createElement('div');
					linksDiv.className = 'project-links';
					
					linkEntries.forEach(([key, url]) => {
						if (!url) return;
						
						let resolvedUrl = null;
						let openInNewTab = true;
						
						if (typeof url === 'object' && url !== null) {
							resolvedUrl = getLocalizedValue(url.url, currentLang) || getLocalizedValue(url, currentLang);
							openInNewTab = url.newTab !== false;
						} else resolvedUrl = getLocalizedValue(url, currentLang);
						
						if (!resolvedUrl) return;
						
						const a = document.createElement('a');
						a.href = resolvedUrl;
						
						if (openInNewTab) {
							a.target = '_blank';
							a.rel = 'noopener noreferrer';
						}
						
						const label = (buttonLabels[currentLang] && buttonLabels[currentLang][key]) || key;
						a.textContent = label;
						linksDiv.appendChild(a);
					});

					if (linksDiv.children.length) card.appendChild(linksDiv);
				}

				projectsGrid.appendChild(card);
			});
		})
		.catch(error => { console.error('Error loading projects:', error); });
}

function switchToNextLanguage() {
    const currentPath = window.location.pathname;
    const languages = ['ru', 'en', 'de'];

    let currentLang = 'ru';
    if (currentPath.startsWith('/en/')) currentLang = 'en';
    else if (currentPath.startsWith('/de/')) currentLang = 'de';
    else currentLang = 'ru';

    const currentIndex = languages.indexOf(currentLang);
    const nextLang = languages[(currentIndex + 1) % languages.length];

    let newPath = '';

    if (currentLang === 'ru') {
        if (currentPath === '/' || currentPath === '/index.html')
            newPath = `/${nextLang}/index.html`;
        else {
            let cleanPath = currentPath.replace(/^\/ru\//, '/');
            if (cleanPath === '/') cleanPath = '/index.html';
            newPath = `/${nextLang}${cleanPath}`;
        }
    } else newPath = currentPath.replace(/^\/(en|de)/, `/${nextLang}`);

    if (newPath === currentPath) return;

    window.location.href = newPath;
}

function getCurrentLanguageForButton() {
    const path = window.location.pathname;
    if (path.startsWith('/en/')) return 'en';
    if (path.startsWith('/de/')) return 'de';
    return 'ru';
}

function getLanguageButtonConfig() {
    const lang = getCurrentLanguageForButton();
    const configs = {
        ru: { next: 'EN', flag: '/images/en-flag.svg', alt: 'Switch to English' },
        en: { next: 'DE', flag: '/images/de-flag.svg', alt: 'Switch to German' },
        de: { next: 'RU', flag: '/images/ru-flag.svg', alt: 'Switch to Russian' }
    };
    return configs[lang];
}

document.addEventListener('DOMContentLoaded', loadContent);

function loadContent() {
	const nav = document.querySelector('nav');
    if (nav) {
        const githubButton = createButton({
            onClick: () => window.open('https://github.com/Lonewolf239', '_blank', 'noopener,noreferrer'),
            imgSrc: '/images/github-icon.svg',
            imgAlt: 'GitHub'
        });

        const homeButton = createButton({
            onClick: () => { window.location.href = '/'; },
            imgSrc: '/images/home-icon.svg',
            imgAlt: 'Home'
        });

        const backButton = createButton({
            onClick: () => window.history.back(),
            imgSrc: '/images/back-icon.svg',
            imgAlt: 'Back'
        });

        nav.appendChild(githubButton);
        nav.appendChild(homeButton);
        nav.appendChild(backButton);

        const langConfig = getLanguageButtonConfig();
        const langButton = createButton({
            onClick: switchToNextLanguage,
            imgSrc: langConfig.flag,
            imgAlt: langConfig.alt,
            imgWidth: 20,
            imgHeight: 20
        });
        langButton.classList.add('lang-switch-btn');
        nav.appendChild(langButton);

        const donateButton = createButton({
            onClick: () => window.open('https://www.donationalerts.com/r/lonewolf239', '_blank', 'noopener,noreferrer'),
            imgSrc: '/images/donut.svg',
            imgAlt: 'Donate',
            imgWidth: 24,
            imgHeight: 24
        });
        donateButton.classList.add('donate-btn');
        nav.appendChild(donateButton);
    }

	const footer = document.querySelector('footer');
	if (footer) {
		footer.innerHTML = '';
		footer.appendChild(document.createTextNode('By. '));
		const devLink = document.createElement('a');
		devLink.href = 'https://github.com/Lonewolf239';
		devLink.target = '_blank';
		devLink.rel = 'noopener noreferrer';
		devLink.textContent = 'Lonewolf239';
		footer.appendChild(devLink);

		const separator = document.createTextNode(' • ');
		footer.appendChild(separator);

		const copyright = document.createElement('span');
		const currentYear = new Date().getFullYear();
		copyright.textContent = `© ${currentYear}`;
		footer.appendChild(copyright);

		async function addLastUpdate() {
			try {
				const githubPath = 'https://api.github.com/repos/Lonewolf239/base-escape.ru/commits?per_page=1';
				const url = `/github-proxy.php?path=${encodeURIComponent(githubPath)}`;
				const response = await fetch(url);
				if (!response.ok) throw new Error('GitHub API error');
				const commits = await response.json();
				if (!commits.length) throw new Error('No commits found');
			
				const commitDate = new Date(commits[0].commit.author.date);

				let currentLang = 'en';
				const htmlLang = document.documentElement.lang;
				if (htmlLang && ['ru', 'en', 'de'].includes(htmlLang.split('-')[0]))
					currentLang = htmlLang.split('-')[0];

				const formattedDate = new Intl.DateTimeFormat(currentLang, {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit'
				}).format(commitDate);

				const secondSeparator = document.createTextNode(' • ');
				footer.appendChild(secondSeparator);

				const lastUpdateSpan = document.createElement('span');
				let updateText = '';
				switch (currentLang) {
					case 'ru': updateText = 'Последнее обновление:'; break;
					case 'de': updateText = 'Letzte Aktualisierung:'; break;
					default: updateText = 'Last update:';
				}

				lastUpdateSpan.textContent = `${updateText} ${formattedDate}`;
				footer.appendChild(lastUpdateSpan);
			} catch (error) { console.warn('Could not fetch last commit date:', error); }
		}
		
	    addLastUpdate();
	}
	
	loadProjects();
}
