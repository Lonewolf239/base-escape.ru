function getLocalizedValue(value, lang) {
	if (typeof value === 'object' && value !== null)
		return value[lang] || value.en || Object.values(value)[0] || '';
	return value || '';
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

function createSubprojectCard(subproject, lang, buttonLabels) {
    const subCard = document.createElement('div');
    subCard.className = 'subproject-card';

    const title = getLocalizedValue(subproject.title, lang) || 'Untitled';
    const h4 = document.createElement('h4');
    h4.textContent = title;
    subCard.appendChild(h4);

    const description = getLocalizedValue(subproject.description, lang) || '';
    if (description) {
        const p = document.createElement('p');
        p.textContent = description;
        subCard.appendChild(p);
    }

    if (subproject.tags && subproject.tags.length) {
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'subproject-tags';
        subproject.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'subproject-tag';
            span.textContent = tag;
            tagsDiv.appendChild(span);
        });
        subCard.appendChild(tagsDiv);
    }

    if (subproject.language) {
        const topBar = document.createElement('div');
        topBar.className = 'project-top-bar';
        topBar.style.marginBottom = '8px';

        const languages = Array.isArray(subproject.language) ? subproject.language : [subproject.language];
        languages.forEach(langCode => {
            if (['C#', 'C++', 'Python', 'JavaScript', 'HTML', 'CSS'].includes(langCode)) {
                const langBadge = document.createElement('div');
                const langClass = langCode.toLowerCase().replace('#', 'sharp').replace('++', 'pp');
                langBadge.className = `project-language-badge language-${langClass}`;
                langBadge.style.fontSize = '0.65rem';
                langBadge.style.padding = '2px 10px';
                langBadge.textContent = langCode;
                topBar.appendChild(langBadge);
            }
        });

        if (topBar.children.length) subCard.insertBefore(topBar, subCard.firstChild);
    }

    if (subproject.links && Object.keys(subproject.links).length) {
        const linksDiv = document.createElement('div');
        linksDiv.className = 'subproject-links';

        Object.entries(subproject.links).forEach(([key, url]) => {
            if (!url) return;
            let resolvedUrl = null;
            let openInNewTab = true;

            if (typeof url === 'object' && url !== null) {
                resolvedUrl = getLocalizedValue(url.url, lang) || getLocalizedValue(url, lang);
                openInNewTab = url.newTab !== false;
            } else resolvedUrl = getLocalizedValue(url, lang);

            if (!resolvedUrl) return;

            const a = document.createElement('a');
            if (isSafeUrl(resolvedUrl)) {
                a.href = resolvedUrl;
                if (openInNewTab) {
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                }
                const label = (buttonLabels[lang] && buttonLabels[lang][key]) || key;
                a.textContent = label;
                linksDiv.appendChild(a);
            }
        });

        if (linksDiv.children.length) subCard.appendChild(linksDiv);
    }

    return subCard;
}

function createSubprojectsSection(subprojects, lang, buttonLabels) {
    const container = document.createElement('div');
    container.className = 'project-subprojects';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'subprojects-toggle';

    const toggleText = document.createElement('span');
    const subprojectsCount = subprojects.length;
    const subprojectsText = {
        ru: `${subprojectsCount} подпроект${subprojectsCount === 1 ? '' : subprojectsCount < 5 ? 'а' : 'ов'}`,
        en: `${subprojectsCount} subproject${subprojectsCount === 1 ? '' : 's'}`,
        de: `${subprojectsCount} Unterprojekt${subprojectsCount === 1 ? '' : 'e'}`
    };
    toggleText.textContent = subprojectsText[lang] || subprojectsText.en;

    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'subprojects-toggle-icon';
    toggleIcon.textContent = '▼';
    toggleIcon.style.fontSize = '0.7rem';

    toggleBtn.appendChild(toggleText);
    toggleBtn.appendChild(toggleIcon);

    const subprojectsList = document.createElement('div');
    subprojectsList.className = 'subprojects-list';

    subprojects.forEach(subproject => {
        const subCard = createSubprojectCard(subproject, lang, buttonLabels);
        subprojectsList.appendChild(subCard);
    });

    container.appendChild(toggleBtn);
    container.appendChild(subprojectsList);

    let isOpen = false;
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isOpen = !isOpen;

        if (isOpen) {
            subprojectsList.classList.add('open');
            toggleBtn.classList.add('open');
        } else {
            subprojectsList.classList.remove('open');
            toggleBtn.classList.remove('open');
        }
    });

    return container;
}

function renderAbout(aboutData) {
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) return;

    const htmlLang = document.documentElement.lang || 'en';
    let currentLang = 'ru';
    if (htmlLang.startsWith('en')) currentLang = 'en';
    else if (htmlLang.startsWith('de')) currentLang = 'de';
    else currentLang = 'ru';

    if (document.querySelector('.about-section')) return;

    const aboutContainer = document.createElement('div');
    aboutContainer.className = 'about-section';

    const avatar = document.createElement('img');
    avatar.src = aboutData.avatar || '/images/avatar.png';
    avatar.alt = 'Avatar';
    avatar.className = 'about-avatar';
    aboutContainer.appendChild(avatar);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'about-content';

    const title = document.createElement('h2');
    title.textContent = getLocalizedValue(aboutData.title, currentLang);
    title.className = 'about-title';
    contentDiv.appendChild(title);

    const description = document.createElement('p');
    description.textContent = getLocalizedValue(aboutData.description, currentLang);
    description.className = 'about-description';
    contentDiv.appendChild(description);

    if (aboutData.techStack && aboutData.techStack.length) {
        const techDiv = document.createElement('div');
        techDiv.className = 'about-tech';
        const techLabel = document.createElement('span');
        techLabel.className = 'about-tech-label';
        techLabel.textContent = currentLang === 'ru' ? 'Технологии:' : (currentLang === 'de' ? 'Technologien:' : 'Tech stack:');
        techDiv.appendChild(techLabel);

        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'about-tags';
        aboutData.techStack.forEach(tech => {
            const tag = document.createElement('span');
            tag.className = 'about-tag';
            tag.textContent = tech;
            tagsDiv.appendChild(tag);
        });
        techDiv.appendChild(tagsDiv);
        contentDiv.appendChild(techDiv);
    }

    if (aboutData.contacts && Object.keys(aboutData.contacts).length) {
        const contactsDiv = document.createElement('div');
        contactsDiv.className = 'about-contacts';
        const contactsLabel = document.createElement('span');
        contactsLabel.className = 'about-contacts-label';
        contactsLabel.textContent = currentLang === 'ru' ? 'Связаться:' : (currentLang === 'de' ? 'Kontakt:' : 'Contact:');
        contactsDiv.appendChild(contactsLabel);

        const linksDiv = document.createElement('div');
        linksDiv.className = 'about-links';
        Object.entries(aboutData.contacts).forEach(([key, url]) => {
            if (!url) return;
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)}`;
            linksDiv.appendChild(a);
        });
        contactsDiv.appendChild(linksDiv);
        contentDiv.appendChild(contactsDiv);
    }

    aboutContainer.appendChild(contentDiv);

    projectsGrid.parentNode.insertBefore(aboutContainer, projectsGrid);
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
		ru: { 'C#': 'C#', 'C++': 'C++', 'Python': 'Python', 'JavaScript': 'JavaScript', 'HTML': 'HTML', 'CSS': 'CSS' },
		en: { 'C#': 'C#', 'C++': 'C++', 'Python': 'Python', 'JavaScript': 'JavaScript', 'HTML': 'HTML', 'CSS': 'CSS' },
		de: { 'C#': 'C#', 'C++': 'C++', 'Python': 'Python', 'JavaScript': 'JavaScript', 'HTML': 'HTML', 'CSS': 'CSS' }
	};

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
        .then(data => {
            projectsGrid.innerHTML = '';

			if (data.about) renderAbout(data.about);

			const projects = data.projects || [];
            projects.forEach(project => {
                const title = getLocalizedValue(project.title, currentLang) || 'Untitled';
                const description = getLocalizedValue(project.description, currentLang) || '';
                const tags = Array.isArray(project.tags) ? project.tags : [];
                const links = project.links || {};
                const language = project.language || null;
                const lastRelease = project.lastRelease || null;
                const subprojects = project.subprojects || [];

                const card = document.createElement('div');
                card.className = 'project-card';

                const topBar = document.createElement('div');
                topBar.className = 'project-top-bar';
				
				if (language) {
					const languages = Array.isArray(language) ? language : [language];
					languages.forEach(lang => {
						if (['C#', 'C++', 'Python', 'JavaScript', 'HTML', 'CSS'].includes(lang)) {
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

                if (subprojects.length > 0) {
                    const subprojectsSection = createSubprojectsSection(subprojects, currentLang, buttonLabels);
                    card.appendChild(subprojectsSection);
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

document.addEventListener('DOMContentLoaded', loadProjects);
