let _secretBuffer = '';
const _secretTrigger = 'admin';

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    _secretBuffer += e.key.toLowerCase();
    if (_secretBuffer.length > _secretTrigger.length)
        _secretBuffer = _secretBuffer.slice(-_secretTrigger.length);

    if (_secretBuffer === _secretTrigger) {
        _secretBuffer = '';
        e.preventDefault();
        showAdminLogin();
    }
});

function showAdminLogin() {
    if (document.getElementById('admin-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'admin-modal';
    modal.style.cssText = `
        position: fixed; inset: 0; 
        background: rgba(9, 9, 11, 0.8); 
        backdrop-filter: blur(12px);
        display: flex; justify-content: center; align-items: center; 
        z-index: 9999;
        animation: fadeIn 0.3s ease-out;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
        background: rgba(20, 20, 30, 0.65);
        border: 1px solid rgba(255, 0, 170, 0.5);
        padding: 40px; 
        border-radius: 28px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 0, 170, 0.2);
        text-align: center; 
        width: 340px;
        backdrop-filter: blur(16px);
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
    `;

    const decorLine = document.createElement('div');
    decorLine.style.cssText = `
        position: absolute; top: 0; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg, transparent, #ff00aa, #ff66cc, transparent);
    `;

    box.innerHTML = `
        <h2 style="color: #fff; margin: 0 0 24px 0; font-size: 1.8rem; text-transform: uppercase; letter-spacing: 0.05em; text-shadow: 0 0 10px rgba(255,0,170,0.5);">Access</h2>
        <div style="position: relative; margin-bottom: 20px; width: 100%;">
            <input type="password" id="admin-pass" placeholder="Password..." style="
                width: 100%; padding: 12px 45px 12px 20px;
                background: rgba(10, 10, 15, 0.5);
                border: 1px solid rgba(255, 0, 170, 0.3); 
                color: #fff; border-radius: 40px; box-sizing: border-box; 
                outline: none; font-family: inherit; transition: all 0.3s;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
            " onfocus="this.style.borderColor='#ff00aa'; this.style.boxShadow='0 0 15px rgba(255,0,170,0.4)'" onblur="this.style.borderColor='rgba(255,0,170,0.3)'; this.style.boxShadow='none'">
            <button id="toggle-password" type="button" style="
                position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
                background: none; border: none; color: rgba(255, 0, 170, 0.7);
                cursor: pointer; font-size: 1.1rem; outline: none; padding: 0;
                display: flex; align-items: center; justify-content: center;
                transition: color 0.2s;
            " onmouseover="this.style.color='#ff00aa'" onmouseout="this.style.color='rgba(255, 0, 170, 0.7)'">👁️</button>
        </div>
        <button id="admin-submit" style="
            width: 100%; padding: 12px; background: rgba(255, 0, 170, 0.1); 
            border: 1px solid #ff00aa; color: #fff; cursor: pointer; 
            border-radius: 40px; transition: all 0.2s; font-weight: bold;
            letter-spacing: 1px;
        " onmouseover="this.style.background='rgba(255,0,170,0.3)'; this.style.boxShadow='0 0 15px rgba(255,0,170,0.5)'" onmouseout="this.style.background='rgba(255,0,170,0.1)'; this.style.boxShadow='none'">LOGIN</button>
    `;

    box.appendChild(decorLine);
    modal.appendChild(box);
    document.body.appendChild(modal);

    const input = document.getElementById('admin-pass');
    const submit = document.getElementById('admin-submit');
    const toggleBtn = document.getElementById('toggle-password');

    input.value = '';
    input.focus();

    toggleBtn.addEventListener('click', () => {
        if (input.type === 'password') {
            input.type = 'text';
            toggleBtn.textContent = '🔒';
        } else {
            input.type = 'password';
            toggleBtn.textContent = '👁️';
        }
    });

    modal.addEventListener('click', (e) => { if(e.target === modal) modal.remove(); });

    const escHandler = (e) => { 
        if (e.key === 'Escape') {
            modal.remove(); 
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    const attemptLogin = async () => {
        submit.textContent = 'CHECKING...';
        try {
            const res = await fetch('/admin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', password: input.value })
            });
            const data = await res.json();

            if (data.status === 'ok')
                window.location.href = '/admin.php';
            else {
                input.style.borderColor = '#ff1744';
                input.style.boxShadow = '0 0 15px rgba(255,23,68,0.5)';
                submit.textContent = 'ACCESS DENIED';
                submit.style.borderColor = '#ff1744';
                setTimeout(() => {
                    submit.textContent = 'LOGIN'; 
                    submit.style.borderColor = '#ff00aa';
                    input.style.borderColor = 'rgba(255,0,170,0.3)'; 
                    input.style.boxShadow = 'none';
                }, 1000);
            }
        } catch (e) { submit.textContent = 'NETWORK ERROR'; }
    };

    submit.addEventListener('click', attemptLogin);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') attemptLogin(); });
}

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

function switchToNextLanguage() {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const currentHash = window.location.hash;
    const languages = ['ru', 'en', 'de'];

    let currentLang = 'ru';
    if (currentPath.startsWith('/en')) currentLang = 'en';
    else if (currentPath.startsWith('/de')) currentLang = 'de';

    const currentIndex = languages.indexOf(currentLang);
    const nextLang = languages[(currentIndex + 1) % languages.length];

    const newPath = currentPath.replace(/^\/(ru|en|de)/, `/${nextLang}`);

    if (newPath === currentPath) return;

	localStorage.setItem('currentLang', nextLang);
    window.location.href = newPath + currentSearch + currentHash;
}

function getCurrentLanguageForButton() {
    const path = window.location.pathname;
    if (path.startsWith('/en')) return 'en';
    if (path.startsWith('/de')) return 'de';
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
    let scrollTopBtn = document.querySelector('.scroll-top-btn');

    if (!scrollTopBtn) {
        scrollTopBtn = document.createElement('button');
        scrollTopBtn.className = 'scroll-top-btn';
        scrollTopBtn.innerHTML = '<span class="arrow-up">↑</span>';
        document.body.appendChild(scrollTopBtn);
    }

    const contentWrapper = document.getElementById('content-wrapper');
    const scrollContainers = [window, document.documentElement, document.body, contentWrapper];

    const checkScroll = () => {
        const currentScroll = Math.max(
            window.scrollY || 0,
            document.documentElement.scrollTop || 0,
            document.body.scrollTop || 0,
            contentWrapper?.scrollTop || 0
        );

        if (currentScroll > 300) scrollTopBtn.classList.add('visible');
        else scrollTopBtn.classList.remove('visible');
    };

    scrollContainers.forEach(container => {
        if (container)
            container.addEventListener('scroll', checkScroll, { passive: true });
    });

    scrollTopBtn.addEventListener('click', () => {
        const targets = scrollContainers.map(el => {
            if (!el) return null;
            const current = el === window ? window.scrollY : el.scrollTop;
            return current > 0 ? { el, start: current } : null;
        }).filter(Boolean);

        if (targets.length === 0) return;

        const duration = 500;
        const startTime = performance.now();

        const animateScroll = (currentTime) => {
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);

            const ease = progress < 0.5 ?
				4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            targets.forEach(target => {
                const nextScroll = target.start * (1 - ease);
                if (target.el === window) window.scrollTo(0, nextScroll);
                else target.el.scrollTop = nextScroll;
            });

            if (progress < 1) requestAnimationFrame(animateScroll);
        };

        requestAnimationFrame(animateScroll);
    });
}

function initBackground() {
	const backgroundContainer = document.getElementById('background');
	if (!backgroundContainer) return;

	backgroundContainer.innerHTML = `
		<div class="space-dust"></div>
	    <div class="stars-extra"></div>
	    <div class="shooting-stars-container"></div>
	    <div class="horizon-glow"></div>
	    <div class="retro-sun"></div>
	    <div class="bg-grid"></div>
	`;

    const isPC = !('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth > 768;
	if(isPC) startComets();
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

	const containerRect = container.getBoundingClientRect();
	const containerWidth = containerRect.width - 50;
	const containerHeight = containerRect.height - 50;

	const startX = Math.random() * 90 + 5;
	const startY = Math.random() * 35 - 5;

	const startXPx = (startX / 100) * containerWidth;
	const startYPx = (startY / 100) * containerHeight;

	let maxDeltaX, maxDeltaY;
	
	if (startXPx < containerWidth / 2) maxDeltaX = containerWidth - startXPx;
	else maxDeltaX = -startXPx;

	if (startYPx < containerHeight / 2) maxDeltaY = containerHeight - startYPx;
	else maxDeltaY = -startYPx;

	let deltaX = (Math.random() - 0.5) * 800;
	let deltaY = 400 + Math.random() * 300;

	if (deltaX > 0) deltaX = Math.min(deltaX, maxDeltaX);
	else deltaX = Math.max(deltaX, maxDeltaX);

	if (deltaY > 0) deltaY = Math.min(deltaY, maxDeltaY);
	else deltaY = Math.max(deltaY, maxDeltaY);

	if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) {
		if (Math.abs(deltaX) < 30)
			deltaX = deltaX >= 0 ? Math.min(50, maxDeltaX) : Math.max(-50, maxDeltaX);
		if (Math.abs(deltaY) < 30)
			deltaY = deltaY >= 0 ? Math.min(100, maxDeltaY) : Math.max(-100, maxDeltaY);
	}

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
	createScrollTopButton();
}
