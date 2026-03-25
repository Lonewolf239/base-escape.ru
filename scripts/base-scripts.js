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

let currentMobileMode = null;

function setupMobileMenu() {
	const nav = document.querySelector('nav');
	if (!nav) return;

	const isMobile = window.innerWidth <= 768;
	if (currentMobileMode === isMobile) return;
	currentMobileMode = isMobile;

	function restoreDesktop() {
		const allButtons = Array.from(nav.querySelectorAll('button')).filter(btn => !btn.classList.contains('menu-toggle-btn'));
		const toggleBtn = nav.querySelector('.menu-toggle-btn');
		const menuDiv = nav.querySelector('.nav-menu');
		if (toggleBtn) toggleBtn.remove();
		if (menuDiv) menuDiv.remove();
		nav.innerHTML = '';
		allButtons.forEach(btn => nav.appendChild(btn));
	}

	if (!isMobile) {
		restoreDesktop();
		return;
	}

	if (nav.querySelector('.menu-toggle-btn')) return;

	const buttons = Array.from(nav.children).filter(child => child.tagName === 'BUTTON');
	if (buttons.length === 0) return;

	const toggleBtn = document.createElement('button');
	toggleBtn.className = 'menu-toggle-btn';
	toggleBtn.textContent = '☰';
	toggleBtn.style.fontWeight = 'bold';
	toggleBtn.style.color = 'white';
	
	const menuDiv = document.createElement('div');
	menuDiv.className = 'nav-menu';
	buttons.forEach(btn => menuDiv.appendChild(btn));

	nav.innerHTML = '';
	nav.appendChild(toggleBtn);
	nav.appendChild(menuDiv);

	let isOpen = false;
	toggleBtn.addEventListener('click', () => {
		isOpen = !isOpen;
		if (isOpen) {
			menuDiv.classList.add('open');
			toggleBtn.textContent = '✕';
		} else {
			menuDiv.classList.remove('open');
			toggleBtn.textContent = '☰';
		}
	});

	document.addEventListener('click', function closeMenu(e) {
		if (isOpen && !nav.contains(e.target)) {
			menuDiv.classList.remove('open');
			toggleBtn.textContent = '☰';
			isOpen = false;
		}
	});
}

function isSafeUrl(url) {
    if (!url) return false;
    if (url.startsWith('/') || url.startsWith('?') || url.startsWith('#'))
        return true;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch { return false; }
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
        .then(response => response.json())
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
				
				if (language) {
					const languages = Array.isArray(language) ? language : [language];
					languages.forEach(lang => {
						if (['C#', 'C++', 'Python', 'JavaScript'].includes(lang)) {
							const langBadge = document.createElement('div');
							const langClass = lang.toLowerCase().replace('#', 'sharp').replace('++', 'pp');
							langBadge.className = `project-language-badge language-${langClass}`;
							langBadge.textContent = lang;
							topBar.appendChild(langBadge);
						}
					});
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

                card.appendChild(topBar);

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
                        if (isSafeUrl(resolvedUrl)) {
                            a.href = resolvedUrl;
                            if (openInNewTab) {
                                a.target = '_blank';
                                a.rel = 'noopener noreferrer';
                            }
                            const label = (buttonLabels[currentLang] && buttonLabels[currentLang][key]) || key;
                            a.textContent = label;
                            linksDiv.appendChild(a);
                        }
                    });
                    if (linksDiv.children.length) card.appendChild(linksDiv);
                }

                projectsGrid.appendChild(card);

                if (!project.lastRelease && project.links && project.links.github && typeof project.links.github === 'string')
                    updateProjectDateFromGitHub(project, card, currentLang);
            });
        })
        .catch(error => { console.error('Error loading projects:', error); });

    async function updateProjectDateFromGitHub(project, card, lang) {
        const githubUrl = project.links.github;
        const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) return;

        const owner = match[1];
        const repo = match[2];

        function updateDateElement(dateString) {
            const formattedDate = formatDate(dateString, lang);
            if (!formattedDate) return;

            let topBar = card.querySelector('.project-top-bar');
            if (!topBar) {
                topBar = document.createElement('div');
                topBar.className = 'project-top-bar';
                card.insertBefore(topBar, card.firstChild);
            }

            let releaseDate = topBar.querySelector('.project-release-date');
            if (!releaseDate) {
                releaseDate = document.createElement('div');
                releaseDate.className = 'project-release-date';
                topBar.appendChild(releaseDate);
            }
            releaseDate.textContent = formattedDate;
        }

        try {
            const releaseApiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
            const response = await fetch(`/github-proxy.php?path=${encodeURIComponent(releaseApiUrl)}`);

            if (response.ok) {
                const release = await response.json();
                const releaseDate = release.published_at || release.created_at;
                if (releaseDate) {
                    updateDateElement(releaseDate);
                    return;
                }
            }
        } catch (error) { console.warn(`Could not fetch release for ${owner}/${repo}:`, error); }

        try {
            const commitsApiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`;
            const response = await fetch(`/github-proxy.php?path=${encodeURIComponent(commitsApiUrl)}`);

            if (!response.ok) throw new Error('GitHub API error');
            const commits = await response.json();
            if (!commits.length) throw new Error('No commits');

            const commitDate = commits[0].commit.author.date;
            updateDateElement(commitDate);
        } catch (error) { console.warn(`Could not fetch commit date for ${owner}/${repo}:`, error); }
    }
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

function createScrollTopButton(useNativeSmooth = true) {
    if (document.querySelector('.scroll-top-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'scroll-top-btn';
    btn.setAttribute('aria-label', 'Scroll to top');
    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'arrow-up';
    arrowSpan.textContent = '↑';
    btn.appendChild(arrowSpan);
    document.body.appendChild(btn);

    let timeoutId = null;
    function checkScroll() {
        const scrollY = window.scrollY;
        const threshold = document.documentElement.scrollHeight * 0.25;
        if (scrollY > threshold) btn.classList.add('visible');
        else btn.classList.remove('visible');
    }

    window.addEventListener('scroll', () => {
        if (timeoutId) cancelAnimationFrame(timeoutId);
        timeoutId = requestAnimationFrame(checkScroll);
    });
    window.addEventListener('resize', () => {
        if (timeoutId) cancelAnimationFrame(timeoutId);
        timeoutId = requestAnimationFrame(checkScroll);
    });
    checkScroll();

    function smoothScrollToTop(duration = 500) {
        const startY = window.scrollY;
        const startTime = performance.now();

        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            window.scrollTo(0, startY * (1 - easeOut));

            if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }

    btn.addEventListener('click', () => { smoothScrollToTop(); });
}

function initBackground() {
	const backgroundContainer = document.getElementById('background');
	if (!backgroundContainer) return;

	backgroundContainer.innerHTML = `
		<div class="space-dust"></div>
	    <div class="stars-extra"></div>
	    <div class="shooting-stars-container"></div>
	    <div class="retro-sun"></div>
	    <div class="bg-grid"></div>
	`;

	startComets();
}

function createComet() {
	const container = document.querySelector('.shooting-stars-container');
	if (!container) return;

	const comet = document.createElement('div');
	comet.className = 'comet';

	const tail = document.createElement('div');
	tail.className = 'comet-tail';
	const glow = document.createElement('div');
	glow.className = 'comet-tail-glow';
	comet.appendChild(tail);
	comet.appendChild(glow);

	const startX = Math.random() * 90 + 5;
	const startY = Math.random() * 35 - 5;

	let deltaX = (Math.random() - 0.5) * 800;
	if (Math.abs(deltaX) < 50) deltaX = deltaX >= 0 ? 50 : -50;
	const deltaY = 400 + Math.random() * 300;

	const endX = deltaX;
	const endY = deltaY;

	const angleRad = Math.atan2(endY, endX);
	const angleDeg = angleRad * 180 / Math.PI;
	const tailAngle = angleDeg + 180;
	const duration = 2.2;
	const delay = Math.random() * 0.5;

	comet.style.left = `${startX}%`;
	comet.style.top = `${startY}%`;
	comet.style.transition = `transform ${duration}s linear, opacity ${duration * 0.3}s ease-out`;
	comet.style.opacity = '0';

	tail.style.transform = `translate(-0%, -50%) rotate(${tailAngle}deg)`;
	glow.style.transform = `translate(-0%, -50%) rotate(${tailAngle}deg)`;

	container.appendChild(comet);

	setTimeout(() => {
		requestAnimationFrame(() => {
			comet.style.transform = `translate(${endX}px, ${endY}px) scale(0.2)`;
			comet.style.opacity = '1';

			setTimeout(() => {
				if (comet.parentNode) comet.style.opacity = '0';
			}, (duration - 0.3) * 1000);
		});
	}, delay * 1000);

	setTimeout(() => {
		if (comet.parentNode) comet.parentNode.removeChild(comet);
	}, (duration + delay) * 1000);
}

function startComets() {
	for (let i = 0; i < 2; i++) setTimeout(() => createComet(), i * 1200);
	setInterval(() => {
		createComet();
	}, 4000);
}

document.addEventListener('DOMContentLoaded', loadContent);

function loadContent() {
	initBackground();

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

	setupMobileMenu();
	window.addEventListener('resize', () => setupMobileMenu());
	loadProjects();
	createScrollTopButton();
}
