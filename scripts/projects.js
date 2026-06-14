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

function formatDate(dateString, lang) {
	if (!dateString) return null;
	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return null;
		const options = { year: 'numeric', month: 'short', day: 'numeric' };
		return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'de' ? 'de-DE' : 'en-US', options);
	} catch { return null; }
}

async function fetchAndUpdateGitHubDate(githubUrl, cardElement, lang, isSubproject = false, updateDate = true) {
	if (!githubUrl || typeof githubUrl !== 'string') return;
	
	const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
	if (!match) return;

	const [, owner, repo] = match;

	const updateDateElement = (dateString) => {
		const formattedDate = formatDate(dateString, lang);
		if (!formattedDate) return;

		const topBarClass = isSubproject ? 'subproject-top-bar' : 'project-top-bar';
		const dateClass = isSubproject ? 'subproject-release-date' : 'project-release-date';

		let topBar = cardElement.querySelector(`.${topBarClass}`);
		if (!topBar) {
			topBar = document.createElement('div');
			topBar.className = topBarClass;
			cardElement.insertBefore(topBar, cardElement.firstChild);
		}

		let releaseDate = topBar.querySelector(`.${dateClass}`);
		if (!releaseDate) {
			releaseDate = document.createElement('div');
			releaseDate.className = dateClass;
			topBar.appendChild(releaseDate);
		}
		releaseDate.textContent = formattedDate;
	};

	const addChangelogButton = (isCommitFallback = false) => {
		const linksClass = isSubproject ? '.subproject-links' : '.project-links';
		let linksContainer = cardElement.querySelector(linksClass);

		if (!linksContainer) {
			linksContainer = document.createElement('div');
			linksContainer.className = isSubproject ? 'subproject-links' : 'project-links';
			cardElement.appendChild(linksContainer);
		}

		if (!linksContainer.querySelector('.btn-changelog')) {
			const btn = document.createElement('a');
			btn.className = 'btn-changelog';
			btn.href = `/${lang}/releases?project=${repo}`;
			
			if (isCommitFallback)
				btn.textContent = lang === 'ru' ? 'Коммиты' : lang === 'de' ? 'Commits' : 'Commits';
			else
				btn.textContent = lang === 'ru' ? 'Релизы' : lang === 'de' ? 'Releases' : 'Releases';
			
			linksContainer.appendChild(btn);
		}
	};

	try {
		const releaseApiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
		const response = await fetch(`/github-proxy.php?path=${encodeURIComponent(releaseApiUrl)}`);

		if (response.ok) {
			const release = await response.json();
			const releaseDate = release.published_at || release.created_at;
			if (releaseDate) {
				if (updateDate) updateDateElement(releaseDate);
				addChangelogButton(false);
				return;
			}
		}
	} catch (error) { console.warn(`Could not fetch release for ${owner}/${repo}:`, error); }

	try {
		const commitsApiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`;
		const response = await fetch(`/github-proxy.php?path=${encodeURIComponent(commitsApiUrl)}`);

		if (response.ok) {
			const commits = await response.json();
			if (commits.length > 0) {
				if (updateDate) updateDateElement(commits[0].commit.author.date);
				addChangelogButton(true);
			}
		}
	} catch (error) { console.warn(`Could not fetch commit date for ${owner}/${repo}:`, error); }
}

function createSubprojectCard(subproject, lang, buttonLabels) {
	const subCard = document.createElement('div');
	subCard.className = 'subproject-card';

	const topBar = document.createElement('div');
	topBar.className = 'subproject-top-bar';
	const topBarFrag = document.createDocumentFragment();

	if (subproject.language) {
		const languages = Array.isArray(subproject.language) ? subproject.language : [subproject.language];
		languages.forEach(langCode => {
			if (['C#', 'C++', 'Python', 'JavaScript', 'HTML', 'CSS'].includes(langCode)) {
				const langBadge = document.createElement('div');
				const langClass = langCode.toLowerCase().replace('#', 'sharp').replace('++', 'pp');
				langBadge.className = `project-language-badge language-${langClass}`;
				langBadge.style.fontSize = '0.65rem';
				langBadge.style.padding = '2px 10px';
				langBadge.textContent = langCode;
				topBarFrag.appendChild(langBadge);
			}
		});
	}

	if (subproject.lastRelease) {
		const formattedDate = formatDate(subproject.lastRelease, lang);
		if (formattedDate) {
			const releaseDate = document.createElement('div');
			releaseDate.className = 'subproject-release-date';
			releaseDate.textContent = formattedDate;
			topBarFrag.appendChild(releaseDate);
		}
	}

	if (topBarFrag.children.length) {
		topBar.appendChild(topBarFrag);
		subCard.appendChild(topBar);
	}

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
		const tagsFrag = document.createDocumentFragment();
		
		subproject.tags.forEach(tag => {
			const span = document.createElement('span');
			span.className = 'subproject-tag';
			span.textContent = tag;
			tagsFrag.appendChild(span);
		});
		
		tagsDiv.appendChild(tagsFrag);
		subCard.appendChild(tagsDiv);
	}

	if (subproject.links && Object.keys(subproject.links).length) {
		const linksDiv = document.createElement('div');
		linksDiv.className = 'subproject-links';
		const linksFrag = document.createDocumentFragment();

		Object.entries(subproject.links).forEach(([key, url]) => {
			if (!url) return;
			let resolvedUrl = null;
			let openInNewTab = true;

			if (typeof url === 'object' && url !== null) {
				resolvedUrl = getLocalizedValue(url.url, lang) || getLocalizedValue(url, lang);
				openInNewTab = url.newTab !== false;
			} else resolvedUrl = getLocalizedValue(url, lang);

			if (resolvedUrl && isSafeUrl(resolvedUrl)) {
				const a = document.createElement('a');
				a.href = resolvedUrl;
				if (openInNewTab) {
					a.target = '_blank';
					a.rel = 'noopener noreferrer';
				}
				a.textContent = (buttonLabels[lang] && buttonLabels[lang][key]) || key;
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
	const container = document.createElement('div');
	container.className = 'project-subprojects';

	const toggleBtn = document.createElement('button');
	toggleBtn.className = 'subprojects-toggle';
	toggleBtn.setAttribute('aria-expanded', 'false');

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

	const wrapper = document.createElement('div');
	wrapper.className = 'subprojects-wrapper';

	const subprojectsList = document.createElement('div');
	subprojectsList.className = 'subprojects-list';

	subprojects.forEach(subproject => {
		const subCard = createSubprojectCard(subproject, lang, buttonLabels);
		subprojectsList.appendChild(subCard);

		if (subproject.links?.github)
			fetchAndUpdateGitHubDate(subproject.links.github, subCard, lang, true, !subproject.lastRelease);
	});

	container.appendChild(toggleBtn);
	wrapper.appendChild(subprojectsList);
	container.appendChild(wrapper);

	let isOpen = false;
	toggleBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		isOpen = !isOpen;
		toggleBtn.setAttribute('aria-expanded', isOpen);

		if (isOpen) {
		    wrapper.classList.add('open');
		    toggleBtn.classList.add('open');
		} else {
		    wrapper.classList.remove('open');
		    toggleBtn.classList.remove('open');
		}
	});

	return container;
}

function createDescriptionToggle(project, lang, buttonLabels) {
	const fullDesc = getLocalizedValue(project.description, lang);
	if (!fullDesc) return null;

	const container = document.createElement('div');
	container.className = 'project-description-wrapper';

	const match = fullDesc.match(/[.!?]\s/);
	
	let shortText = fullDesc;
	let restText = '';
	
	if (match) {
		const splitIndex = match.index + 1;
		shortText = fullDesc.substring(0, splitIndex);
		restText = fullDesc.substring(splitIndex + 1).trim();
	}

	const shortElement = document.createElement('p');
	shortElement.className = 'project-description-short';
	shortElement.textContent = shortText;
	container.appendChild(shortElement);

	if (restText) {
		const restWrapper = document.createElement('div');
		restWrapper.className = 'project-description-rest';
		
		const restContent = document.createElement('div');
		restContent.className = 'project-description-rest-inner';
		
		const restElement = document.createElement('p');
		restElement.textContent = restText;
		
		restContent.appendChild(restElement);
		restWrapper.appendChild(restContent);
		container.appendChild(restWrapper);

		const toggleBtn = document.createElement('button');
		toggleBtn.className = 'description-toggle-btn';
		toggleBtn.setAttribute('aria-expanded', 'false');

		const btnText = document.createElement('span');
		const toggleLabels = {
			ru: { more: 'Подробнее', less: 'Свернуть' },
			en: { more: 'Read more', less: 'Show less' },
			de: { more: 'Mehr erfahren', less: 'Weniger anzeigen' }
		};
		const labels = toggleLabels[lang] || toggleLabels.en;
		btnText.textContent = labels.more;

		const btnIcon = document.createElement('span');
		btnIcon.className = 'description-toggle-icon';
		btnIcon.textContent = '▼';

		toggleBtn.appendChild(btnText);
		toggleBtn.appendChild(btnIcon);
		container.appendChild(toggleBtn);

		let isOpen = false;
		toggleBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			isOpen = !isOpen;
			toggleBtn.setAttribute('aria-expanded', isOpen);

			if (isOpen) {
				restWrapper.classList.add('open');
				toggleBtn.classList.add('open');
				btnText.textContent = labels.less;
			} else {
				restWrapper.classList.remove('open');
				toggleBtn.classList.remove('open');
				btnText.textContent = labels.more;
			}
		});
	}

	return container;
}

function renderAbout(aboutData) {
	const projectsGrid = document.querySelector('.projects-grid');
	if (!projectsGrid || document.querySelector('.about-section')) return;

	const htmlLang = document.documentElement.lang || 'en';
	const currentLang = htmlLang.startsWith('en') ? 'en' : (htmlLang.startsWith('de') ? 'de' : 'ru');

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

	if (aboutData.techStack?.length) {
		const techDiv = document.createElement('div');
		techDiv.className = 'about-tech';
		
		const techLabel = document.createElement('span');
		techLabel.className = 'about-tech-label';
		techLabel.textContent = currentLang === 'ru' ? 'Технологии:' : (currentLang === 'de' ? 'Technologien:' : 'Tech stack:');
		techDiv.appendChild(techLabel);

		const tagsDiv = document.createElement('div');
		tagsDiv.className = 'about-tags';
		const techFrag = document.createDocumentFragment();
		
		aboutData.techStack.forEach(tech => {
			const tag = document.createElement('span');
			tag.className = 'about-tag';
			tag.textContent = tech;
			techFrag.appendChild(tag);
		});
		
		tagsDiv.appendChild(techFrag);
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
		const linksFrag = document.createDocumentFragment();
		
		Object.entries(aboutData.contacts).forEach(([key, url]) => {
			if (!url) return;
			const a = document.createElement('a');
			a.href = url;
			a.target = '_blank';
			a.rel = 'noopener noreferrer';
			a.textContent = key.charAt(0).toUpperCase() + key.slice(1);
			linksFrag.appendChild(a);
		});
		
		linksDiv.appendChild(linksFrag);
		contactsDiv.appendChild(linksDiv);
		contentDiv.appendChild(contactsDiv);
	}

	aboutContainer.appendChild(contentDiv);
	projectsGrid.parentNode.insertBefore(aboutContainer, projectsGrid);
}

const lazyObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const card = entry.target;
            requestAnimationFrame(() => {
                card.classList.remove('lazy-hidden');
                card.classList.add('lazy-visible');
            });
            observer.unobserve(card);
        }
    });
}, {
    root: null,
    rootMargin: '0px 0px 50px 0px',
    threshold: 0.1
});

function renderSkeletons(container, count = 6) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
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

function loadProjects() {
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) return;

    renderSkeletons(projectsGrid);

    const htmlLang = document.documentElement.lang || 'en';
    const currentLang = htmlLang.startsWith('en') ? 'en' : (htmlLang.startsWith('de') ? 'de' : 'ru');

    const buttonLabels = {
        ru: { github: 'GitHub', nuget: 'NuGet', wiki: 'Вики', code: 'Код', download: 'Скачать' },
        en: { github: 'GitHub', nuget: 'NuGet', wiki: 'Wiki', code: 'Code', download: 'Download' },
        de: { github: 'GitHub', nuget: 'NuGet', wiki: 'Wiki', code: 'Code', download: 'Herunterladen' }
    };

    fetch('/projects.json')
        .then(response => response.json())
        .then(data => {
            projectsGrid.innerHTML = '';

            if (data.about) renderAbout(data.about);

            const projects = data.projects || [];
            const subprojectsPool = data.subprojects_pool || {};
            const projectsFrag = document.createDocumentFragment();

            projects.forEach(project => {
                const card = document.createElement('div');
                card.className = 'project-card lazy-hidden';

                const topBar = document.createElement('div');
                topBar.className = 'project-top-bar';
                const topBarFrag = document.createDocumentFragment();

                if (project.language) {
                    const languages = Array.isArray(project.language) ? project.language : [project.language];
                    languages.forEach(lang => {
                        if (['C#', 'C++', 'Python', 'JavaScript', 'HTML', 'CSS'].includes(lang)) {
                            const langBadge = document.createElement('div');
                            const langClass = lang.toLowerCase().replace('#', 'sharp').replace('++', 'pp');
                            langBadge.className = `project-language-badge language-${langClass}`;
                            langBadge.textContent = lang;
                            topBarFrag.appendChild(langBadge);
                        }
                    });
                }

                if (project.lastRelease) {
                    const formattedDate = formatDate(project.lastRelease, currentLang);
                    if (formattedDate) {
                        const releaseDate = document.createElement('div');
                        releaseDate.className = 'project-release-date';
                        releaseDate.textContent = formattedDate;
                        topBarFrag.appendChild(releaseDate);
                    }
                }

                if (topBarFrag.children.length) {
                    topBar.appendChild(topBarFrag);
                    card.appendChild(topBar);
                }

                const h3 = document.createElement('h3');
                h3.textContent = getLocalizedValue(project.title, currentLang) || 'Untitled';
                card.appendChild(h3);

                const descriptionToggle = createDescriptionToggle(project, currentLang, buttonLabels);
                if (descriptionToggle) card.appendChild(descriptionToggle);

                if (project.tags && project.tags.length) {
                    const tagsDiv = document.createElement('div');
                    tagsDiv.className = 'project-tags';
                    const tagsFrag = document.createDocumentFragment();

                    project.tags.forEach(tag => {
                        const span = document.createElement('span');
                        span.className = 'tag';
                        span.textContent = tag;
                        tagsFrag.appendChild(span);
                    });

                    tagsDiv.appendChild(tagsFrag);
                    card.appendChild(tagsDiv);
                }

                if (project.links && Object.keys(project.links).length) {
                    const linksDiv = document.createElement('div');
                    linksDiv.className = 'project-links';
                    const linksFrag = document.createDocumentFragment();

                    Object.entries(project.links).forEach(([key, url]) => {
                        if (!url) return;
                        let resolvedUrl = null;
                        let openInNewTab = true;

                        if (typeof url === 'object' && url !== null) {
                            resolvedUrl = getLocalizedValue(url.url, currentLang) || getLocalizedValue(url, currentLang);
                            openInNewTab = url.newTab !== false;
                        } else resolvedUrl = getLocalizedValue(url, currentLang);

                        if (resolvedUrl && isSafeUrl(resolvedUrl)) {
                            const a = document.createElement('a');
                            a.href = resolvedUrl;
                            if (openInNewTab) {
                                a.target = '_blank';
                                a.rel = 'noopener noreferrer';
                            }
                            a.textContent = (buttonLabels[currentLang] && buttonLabels[currentLang][key]) || key;
                            linksFrag.appendChild(a);
                        }
                    });

                    if (linksFrag.children.length) {
                        linksDiv.appendChild(linksFrag);
                        card.appendChild(linksDiv);
                    }
                }

                if (project.subprojects && project.subprojects.length > 0) {
                    const resolvedSubprojects = project.subprojects.map(id => subprojectsPool[id]).filter(Boolean);
                    card.appendChild(createSubprojectsSection(resolvedSubprojects, currentLang, buttonLabels));
                }

                projectsFrag.appendChild(card);

                lazyObserver.observe(card);

                if (project.links?.github && typeof project.links.github === 'string')
                    fetchAndUpdateGitHubDate(project.links.github, card, currentLang, false, !project.lastRelease);
            });

            projectsGrid.appendChild(projectsFrag);
        })
        .catch(error => {
            console.error('Error loading projects:', error);
            projectsGrid.innerHTML = '<p style="color: rgba(255, 255, 255, 0.5); text-align: center; grid-column: 1 / -1;">Failed to load projects.</p>';
        });
}

document.addEventListener('DOMContentLoaded', loadProjects);
