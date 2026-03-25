function setupSunClicks() {
    const sun = document.querySelector('.retro-sun');
    if (!sun) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches || 
                     ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isMobile) return;

    sun.style.pointerEvents = 'auto';

    let exploded = false;
    let animationId = null;
    let currentProgress = 0;
    let isCompressing = false;
    let irreversible = false;

    const THRESHOLD = 0.35;
    const MAX_COMPRESSION = 0.95;
    const SPEED = 0.003;

    function updateSunAppearance(progress) {
        const scale = 1 - progress * 0.95;
        const r = 255 - Math.floor(progress * 200);
        const g = 102 + Math.floor(progress * 100);
        const b = 51 + Math.floor(progress * 150);
        const color = `radial-gradient(circle at 30% 30%, rgb(${r}, ${g}, ${b}), rgb(255, 170, 51))`;
        const shadowIntensity = 1 - progress * 0.8;
        const shadowColor = `rgba(100, 150, 255, ${shadowIntensity * 0.8})`;

		sun.style.animation = 'none';
        sun.style.background = color;
        sun.style.transform = `translateX(-50%) scale(${scale})`;
        sun.style.boxShadow = `0 0 ${60 + progress * 40}px ${15 + progress * 20}px ${shadowColor}`;
    }

    function stopAnimation() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        isCompressing = false;
    }

    function startCompress() {
        if (exploded || irreversible) return;
        stopAnimation();
        isCompressing = true;

        function step() {
            if (!isCompressing) return;
            if (exploded) return;

            currentProgress += SPEED;
            if (currentProgress >= THRESHOLD && !irreversible) {
                irreversible = true;
                isCompressing = false;
                completeCompression();
                return;
            }
            if (currentProgress > MAX_COMPRESSION) currentProgress = MAX_COMPRESSION;
            updateSunAppearance(currentProgress);
            animationId = requestAnimationFrame(step);
        }
        animationId = requestAnimationFrame(step);
    }

    function startRestore() {
        if (exploded || irreversible) return;
        if (currentProgress === 0) return;
        stopAnimation();
        isCompressing = false;

        function step() {
            if (exploded || irreversible) return;
            currentProgress -= SPEED;
            if (currentProgress <= 0) {
                currentProgress = 0;
                updateSunAppearance(currentProgress);
                stopAnimation();
                return;
            }
            updateSunAppearance(currentProgress);
            animationId = requestAnimationFrame(step);
        }
        animationId = requestAnimationFrame(step);
    }

    function completeCompression() {
        if (exploded) return;

        function step() {
            if (exploded) return;
            currentProgress += SPEED * 0.8;
            if (currentProgress >= MAX_COMPRESSION) {
                currentProgress = MAX_COMPRESSION;
                updateSunAppearance(currentProgress);
                explode();
                return;
            }
            updateSunAppearance(currentProgress);
            animationId = requestAnimationFrame(step);
        }
        animationId = requestAnimationFrame(step);
    }

    function onMouseDown(e) {
        e.preventDefault();
        if (exploded || irreversible) return;
        startCompress();
    }

    function onMouseUp() {
        if (exploded || irreversible) return;
        if (currentProgress < THRESHOLD) startRestore();
    }

    function onMouseLeave() {
        if (exploded || irreversible) return;
        if (currentProgress < THRESHOLD) startRestore();
    }

    sun.addEventListener('mousedown', onMouseDown);
    sun.addEventListener('mouseup', onMouseUp);
    sun.addEventListener('mouseleave', onMouseLeave);

    function explode() {
        if (exploded) return;
        exploded = true;
        stopAnimation();

        const oldCanvas = document.querySelector('.supernova-explosion-canvas');
        if (oldCanvas) oldCanvas.remove();
        const oldNebula = document.querySelector('.supernova-nebula');
        if (oldNebula) oldNebula.remove();

        const rect = sun.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const canvas = document.createElement('canvas');
        canvas.className = 'supernova-explosion-canvas';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        let startTime = null;
        const explosionDuration = 1600;

        const PARTICLE_COUNT = 300;
        const DEBRIS_COUNT = 50;
        const particles = [];
        const debris = [];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 200 + Math.random() * 600;
            const size = 2 + Math.random() * 6;
            const hue = 180 + Math.random() * 80;
            const sat = 70 + Math.random() * 30;
            const light = 50 + Math.random() * 40;
            particles.push({
                angle, speed, size, hue, sat, light,
                life: 0.5 + Math.random() * 0.6
            });
        }

        for (let i = 0; i < DEBRIS_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 150 + Math.random() * 500;
            const size = 4 + Math.random() * 12;
            const hue = 20 + Math.random() * 40;
            const sat = 80 + Math.random() * 20;
            const light = 60 + Math.random() * 30;
            debris.push({
                angle, speed, size, hue, sat, light,
                life: 0.7 + Math.random() * 0.5
            });
        }

        let flashIntensity = 0;
        let shockwaveRadius = 0;
        const maxShockwave = Math.max(window.innerWidth, window.innerHeight) * 1.2;

        function animateExplosion(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / explosionDuration, 1);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            flashIntensity = Math.sin(progress * Math.PI) * 1.3;
            const flashRadius = Math.min(canvas.width, canvas.height) * (0.4 + progress * 0.9);
            const flashGrd = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, flashRadius);
            flashGrd.addColorStop(0, `rgba(100, 180, 255, ${flashIntensity * 0.9})`);
            flashGrd.addColorStop(0.5, `rgba(50, 100, 220, ${flashIntensity * 0.6})`);
            flashGrd.addColorStop(1, 'rgba(20, 40, 80, 0)');
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = flashGrd;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over';

            shockwaveRadius = maxShockwave * progress;
            const waveOpacity = Math.sin(progress * Math.PI) * 0.9;
            ctx.beginPath();
            ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(80, 180, 255, ${waveOpacity})`;
            ctx.lineWidth = 10 * (1 - progress);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(centerX, centerY, shockwaveRadius * 0.6, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(200, 100, 255, ${waveOpacity * 0.7})`;
            ctx.lineWidth = 6 * (1 - progress);
            ctx.stroke();

            for (let p of particles) {
                const partProgress = progress / p.life;
                if (partProgress >= 1) continue;

                const distance = p.speed * progress * 0.001;
                const x = centerX + Math.cos(p.angle) * distance;
                const y = centerY + Math.sin(p.angle) * distance;
                const size = p.size * (1 - partProgress * 0.8);
                const alpha = (1 - partProgress) * 0.9;

                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${alpha})`;
                ctx.shadowBlur = size * 1.5;
                ctx.shadowColor = `rgba(80, 160, 255, ${alpha * 0.8})`;
                ctx.fill();
            }

            for (let d of debris) {
                const partProgress = progress / d.life;
                if (partProgress >= 1) continue;

                const distance = d.speed * progress * 0.001;
                const x = centerX + Math.cos(d.angle) * distance;
                const y = centerY + Math.sin(d.angle) * distance;
                const size = d.size * (1 - partProgress * 0.6);
                const alpha = (1 - partProgress) * 0.8;

                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${d.hue}, ${d.sat}%, ${d.light}%, ${alpha})`;
                ctx.shadowBlur = size * 1.2;
                ctx.shadowColor = `rgba(255, 100, 100, ${alpha * 0.7})`;
                ctx.fill();
            }

            const vignette = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvas.width * 0.7);
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(1, `rgba(0,0,0,${progress * 0.3})`);
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (progress < 1) {
                requestAnimationFrame(animateExplosion);
            } else {
                canvas.remove();
                sun.remove();
                createNebula(centerX, centerY);
            }
        }

        requestAnimationFrame(animateExplosion);
    }

    function createNebula(cx, cy) {
        const nebulaCanvas = document.createElement('canvas');
        nebulaCanvas.className = 'supernova-nebula';
        nebulaCanvas.width = window.innerWidth;
        nebulaCanvas.height = window.innerHeight;
        document.body.appendChild(nebulaCanvas);
        const nebulaCtx = nebulaCanvas.getContext('2d');

        const cloudCount = 200;
        const clouds = [];

        for (let i = 0; i < cloudCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 100 + Math.random() * 450;
            const size = 20 + Math.random() * 70;
            const hue = 180 + Math.random() * 80;
            const sat = 50 + Math.random() * 40;
            const light = 40 + Math.random() * 40;
            clouds.push({
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius,
                size,
                hue,
                sat,
                light,
                alpha: 0.2 + Math.random() * 0.5
            });
        }

        const dust = [];
        for (let i = 0; i < 1000; i++) {
            dust.push({
                x: Math.random() * nebulaCanvas.width,
                y: Math.random() * nebulaCanvas.height,
                size: 0.8 + Math.random() * 2,
                alpha: 0.3 + Math.random() * 0.5
            });
        }

        for (let d of dust) {
            nebulaCtx.beginPath();
            nebulaCtx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            nebulaCtx.fillStyle = `rgba(255, 255, 255, ${d.alpha * 0.7})`;
            nebulaCtx.fill();
        }

        for (let c of clouds) {
            const gradient = nebulaCtx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size);
            gradient.addColorStop(0, `hsla(${c.hue}, ${c.sat}%, ${c.light}%, ${c.alpha * 0.8})`);
            gradient.addColorStop(0.6, `hsla(${c.hue}, ${c.sat}%, ${c.light}%, ${c.alpha * 0.3})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            nebulaCtx.beginPath();
            nebulaCtx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            nebulaCtx.fillStyle = gradient;
            nebulaCtx.fill();
        }

        for (let i = 0; i < 60; i++) {
            const angle = i * Math.PI * 2 / 60;
            const radius = 280 + Math.random() * 80;
            const x1 = cx + Math.cos(angle) * radius;
            const y1 = cy + Math.sin(angle) * radius;
            const x2 = cx + Math.cos(angle + 0.4) * (radius - 50);
            const y2 = cy + Math.sin(angle + 0.4) * (radius - 50);
            nebulaCtx.beginPath();
            nebulaCtx.moveTo(x1, y1);
            nebulaCtx.lineTo(x2, y2);
            nebulaCtx.strokeStyle = `hsla(210, 70%, 65%, 0.2)`;
            nebulaCtx.lineWidth = 1.2;
            nebulaCtx.stroke();
        }

        const coreGlow = nebulaCtx.createRadialGradient(cx, cy, 0, cx, cy, 140);
        coreGlow.addColorStop(0, 'rgba(100, 150, 255, 0.4)');
        coreGlow.addColorStop(0.7, 'rgba(40, 80, 180, 0.1)');
        coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
        nebulaCtx.fillStyle = coreGlow;
        nebulaCtx.fillRect(0, 0, nebulaCanvas.width, nebulaCanvas.height);

        let opacity = 1;
        let direction = -0.003;
        function animateNebula() {
            if (!nebulaCanvas.parentNode) return;
            opacity += direction;
            if (opacity <= 0.8) direction = 0.003;
            if (opacity >= 1) direction = -0.003;
            nebulaCanvas.style.opacity = opacity;
            requestAnimationFrame(animateNebula);
        }
        animateNebula();
    }
}
