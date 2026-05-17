document.addEventListener("DOMContentLoaded", () => {
    const sun = document.querySelector('.retro-sun');

    if (!sun) {
        console.error("Критическая ошибка: Элемент солнца не найден!");
        return;
    }

    const isPC = !('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth > 768;
    if (!isPC) return;

    let state = 'idle'; 
    let progress = 0; 
    let lastTime = 0;
    let rafId = null;

    const HOLD_DURATION = 2000;
    const THRESHOLD = 0.25;

    let centerX = 0;
    let centerY = 0;

    let canvas = null;
    let ctx = null;
    const implosionParticles = [];

    sun.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || state === 'exploded' || state === 'irreversible') return;

        state = 'holding';
        sun.style.animation = 'none'; 
        lastTime = performance.now();

        const rect = sun.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;

        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.style.position = 'fixed';
            canvas.style.inset = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '2'; 
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            document.body.appendChild(canvas);
            ctx = canvas.getContext('2d', { alpha: true });
        }

        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(interactionLoop);
    });

    const releaseSun = () => {
        if (state === 'holding') {
            state = 'recovering';
        }
    };

    window.addEventListener('mouseup', releaseSun);
    sun.addEventListener('mouseleave', releaseSun);

    function interactionLoop(time) {
        const dt = time - lastTime;
        lastTime = time;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (state === 'holding' || state === 'irreversible') {
            progress += dt / HOLD_DURATION;

            if (progress >= THRESHOLD && state === 'holding') {
                state = 'irreversible';
                document.body.classList.add('shake-active');
            }

            updateAndDrawImplosion(dt);

            if (progress >= 1) {
                progress = 1;
                state = 'exploded';
                triggerCinematicExplosion();
                return;
            }
        } else if (state === 'recovering') {
            progress -= (dt / HOLD_DURATION) * 2;
            implosionParticles.length = 0; 

            if (progress <= 0) {
                progress = 0;
                state = 'idle';
                sun.style.animation = '';
                sun.style.transform = '';
                sun.style.filter = '';
                if (canvas) {
                    canvas.remove();
                    canvas = null;
                    ctx = null;
                }
                return;
            }
        }

        if (state !== 'idle' && state !== 'exploded') {
            renderHoldEffect(progress);
            rafId = requestAnimationFrame(interactionLoop);
        }
    }

    function updateAndDrawImplosion(dt) {
        if (Math.random() < 0.7) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 200 + Math.random() * 350;
            implosionParticles.push({
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                speed: 3 + Math.random() * 5,
                size: 1 + Math.random() * 2.5,
                color: Math.random() > 0.5 ? '#ff00aa' : '#00ffff'
            });
        }

        ctx.globalCompositeOperation = 'lighter';
        for (let i = implosionParticles.length - 1; i >= 0; i--) {
            const p = implosionParticles[i];
            const dx = centerX - p.x;
            const dy = centerY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 15) {
                implosionParticles.splice(i, 1);
                continue;
            }

            p.speed += 0.3; 
            p.x += (dx / dist) * p.speed;
            p.y += (dy / dist) * p.speed;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        }
    }

    function renderHoldEffect(p) {
        const scale = 1 - (p * 0.97); 
        let shakeX = 0, shakeY = 0;
        if (p > 0.4) {
            const intensity = (p - 0.4) * 60; 
            shakeX = (Math.random() - 0.5) * intensity;
            shakeY = (Math.random() - 0.5) * intensity;
        }

        sun.style.transform = `translate(calc(-50% + ${shakeX}px), ${shakeY}px) scale(${scale})`;
        const brightness = 1 + (p * 14); 
        const hueShift = p * -150; 
        sun.style.filter = `brightness(${brightness}) hue-rotate(${hueShift}deg) blur(${p * 3}px)`;
    }

    function triggerCinematicExplosion() {
        sun.style.transform = 'translate(-50%, -50%) scale(0)';
        sun.style.opacity = '0';

        createNebulaAftermath(centerX, centerY);

        document.body.classList.add('shake-active'); 
        document.body.classList.add('flash-active');
        setTimeout(() => document.body.classList.remove('flash-active'), 450);

        const FOV = 300; 
        const cosmicGas = [];
        const solidChunks = [];

        const GAS_GROUPS = 4;
        for (let g = 0; g < GAS_GROUPS; g++) {
            const count = 45 + g * 20;
            const baseSpeed = 7 + g * 6;
            const colorType = g % 3;

            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
                cosmicGas.push({
                    x: 0, y: 0, z: Math.random() * 40 - 20,
                    vx: Math.cos(angle) * baseSpeed * (1 + Math.random() * 0.4),
                    vy: Math.sin(angle) * baseSpeed * 0.35 * (1 + Math.random() * 0.4), 
                    vz: (Math.random() - 0.5) * 4,
                    size: 60 + Math.random() * 80, 
                    life: 1.0,
                    decay: 0.004 + Math.random() * 0.007,
                    color: colorType === 0 ? '255, 0, 170' : colorType === 1 ? '0, 255, 255' : '255, 120, 0'
                });
            }
        }

        const CHUNK_COUNT = 85;
        for (let i = 0; i < CHUNK_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 25;

            const numVertices = 5 + Math.floor(Math.random() * 4);
            const vertices = [];
            for (let v = 0; v < numVertices; v++) {
                vertices.push(0.5 + Math.random() * 0.7);
            }

            solidChunks.push({
                x: 0, y: 0, z: Math.random() * 160 - 80,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed * 0.38, 
                vz: (Math.random() - 0.5) * speed * 1.8, 
                size: 15 + Math.random() * 25,
                angle: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.2,
                vertices: vertices,
                baseColor: Math.random() > 0.4 ? '#141416' : '#221611', 
                veinColor: Math.random() > 0.5 ? '#ff00aa' : '#00ffff'
            });
        }

        let explosionTime = 0;
        let lastFrameTime = performance.now();

        function renderExplosionFrame(timestamp) {
            const dt = timestamp - lastFrameTime;
            lastFrameTime = timestamp;
            explosionTime += dt;

            if (explosionTime > 1200 && explosionTime < 2400) {
                if (Math.random() < 0.25) {
                    rafId = requestAnimationFrame(renderExplosionFrame);
                    return;
                }
            } else if (explosionTime >= 2400) {
                const freezeDuration = 25 + Math.random() * 35;
                const startFreeze = performance.now();
                while (performance.now() - startFreeze < freezeDuration) {}
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (explosionTime > 500 && !document.body.classList.contains('glitch-stage-1'))
                document.body.classList.add('glitch-stage-1');
            if (explosionTime > 1400 && !document.body.classList.contains('glitch-stage-2'))
                document.body.classList.add('glitch-stage-2');
            if (explosionTime > 2500 && !document.body.classList.contains('glitch-stage-3'))
                document.body.classList.add('glitch-stage-3');

            if (explosionTime >= 4200) {
                cancelAnimationFrame(rafId);
                canvas.remove();
                sun.remove();
                triggerTerminalCrash();
                return;
            }

            ctx.globalCompositeOperation = 'lighter';
            for (let i = cosmicGas.length - 1; i >= 0; i--) {
                const gas = cosmicGas[i];
                gas.x += gas.vx;
                gas.y += gas.vy;
                gas.z += gas.vz;
                gas.vx *= 0.98;
                gas.vy *= 0.98;
                gas.life -= gas.decay;

                if (gas.life <= 0) {
                    cosmicGas.splice(i, 1);
                    continue;
                }

                const scale = FOV / (FOV + gas.z);
                const projX = centerX + gas.x * scale;
                const projY = centerY + gas.y * scale;
                const projSize = gas.size * scale * (1 + (1 - gas.life) * 2);

                if (projSize <= 0) continue;

                const radGrd = ctx.createRadialGradient(projX, projY, 0, projX, projY, projSize);
                const alpha = gas.life * 0.22;
                radGrd.addColorStop(0, `rgba(${gas.color}, ${alpha})`);
                radGrd.addColorStop(0.5, `rgba(${gas.color}, ${alpha * 0.3})`);
                radGrd.addColorStop(1, `rgba(${gas.color}, 0)`);

                ctx.fillStyle = radGrd;
                ctx.beginPath();
                ctx.arc(projX, projY, projSize, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalCompositeOperation = 'source-over';
            for (let i = solidChunks.length - 1; i >= 0; i--) {
                const chunk = solidChunks[i];
                chunk.x += chunk.vx;
                chunk.y += chunk.vy;
                chunk.z += chunk.vz;
                chunk.angle += chunk.spin;

                const scale = FOV / (FOV + chunk.z);
                const projX = centerX + chunk.x * scale;
                const projY = centerY + chunk.y * scale;
                const projRadius = chunk.size * scale;

                const margin = projRadius + 100;
                if (projX < -margin || projX > canvas.width + margin || projY < -margin || projY > canvas.height + margin || chunk.z <= -FOV) {
                    solidChunks.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.translate(projX, projY);
                ctx.rotate(chunk.angle);

                ctx.beginPath();
                const vCount = chunk.vertices.length;
                for (let v = 0; v < vCount; v++) {
                    const currAngle = (v / vCount) * Math.PI * 2;
                    const r = projRadius * chunk.vertices[v];
                    const vx = Math.cos(currAngle) * r;
                    const vy = Math.sin(currAngle) * r;
                    if (v === 0) ctx.moveTo(vx, vy);
                    else ctx.lineTo(vx, vy);
                }
                ctx.closePath();

                ctx.fillStyle = chunk.baseColor;
                ctx.fill();

                ctx.strokeStyle = chunk.veinColor;
                ctx.lineWidth = Math.max(0.6, 1.8 * scale);
                ctx.stroke();

                ctx.restore();
            }

            rafId = requestAnimationFrame(renderExplosionFrame);
        }

        rafId = requestAnimationFrame(renderExplosionFrame);
    }

    function createNebulaAftermath(x, y) {
        const nebula = document.createElement('div');
        nebula.className = 'supernova-nebula';
        nebula.style.left = `${x}px`;
        nebula.style.top = `${y}px`;
        document.body.appendChild(nebula);
    }

    function triggerTerminalCrash() {
        document.body.className = ''; 
        document.body.style.backgroundColor = '#010103';
        document.body.innerHTML = ''; 

        const terminalWrapper = document.createElement('div');
        terminalWrapper.className = 'terminal-screen-overlay';

        const terminal = document.createElement('div');
        terminal.className = 'supernova-terminal';
        terminalWrapper.appendChild(terminal);
        document.body.appendChild(terminalWrapper);

        const crashLogs = [
            "guest@universe:~# ./runtime_status.sh",
            "[  CRITICAL  ] BROADCASTING CORE COLLAPSE DATA SYNC...",
            "[   KERNEL   ] Panic: SingularityEvent detected at core vector (0,0,0)",
            "[   KERNEL   ] StarMass threshold crossed: actual=4.92e30kg, required_stable > 1.2e30kg",
            "[  HARDWARE  ] Thermal sensor out of bounds: > 8.43e9 K (Hardware Melting)",
            "[   ERROR    ] Sector 0x00FF8C1 - 0x0F4A2B9: DOM_TREE_STRUCTURE_DESTROYED",
            "[   ERROR    ] Cascade failures detected in: CSS_Quantum_Selectors, Grid_Ballistix",
            " ",
            "--- EMERGENCY EXCEPTION REPORT ---",
            "FATAL STATUS CODE: 0x992FE_STELLAR_DEATH",
            "The localized space-time reality of Lonewolf239 has dissolved.",
            "All core layout systems are offline. Quantum state is volatile.",
            " ",
            "System requires kernel reset code to initialize timeline recovery.",
            "Please execute system reboot string."
        ];

        let lineIndex = 0;
        function typeCrashLine() {
            if (lineIndex < crashLogs.length) {
                const line = document.createElement('div');
                line.className = 'terminal-line';
                if (crashLogs[lineIndex].startsWith('guest'))
                    line.className += ' prompt-line';
                else if (crashLogs[lineIndex].includes('[   ERROR    ]') || crashLogs[lineIndex].includes('FATAL')) {
                    line.style.color = '#ff00aa';
                    line.style.textShadow = '0 0 10px rgba(255, 0, 170, 0.85)';
                } else if (crashLogs[lineIndex].includes('---') || crashLogs[lineIndex].includes('reset code')) {
                    line.style.color = '#00ffff';
                    line.style.textShadow = '0 0 10px rgba(0, 255, 255, 0.85)';
                }

                terminal.appendChild(line);
                let charIndex = 0;
                const text = crashLogs[lineIndex];

                function typeChar() {
                    if (charIndex < text.length) {
                        line.textContent += text[charIndex];
                        charIndex++;
                        setTimeout(typeChar, text.startsWith('[') ? 4 : 15);
                    } else {
                        lineIndex++;
                        setTimeout(typeCrashLine, 90);
                    }
                }
                typeChar();
            } else initializeInteractiveInput();
        }

        setTimeout(typeCrashLine, 400);

        function initializeInteractiveInput() {
            const inputContainer = document.createElement('div');
            inputContainer.className = 'terminal-line prompt-line active-input-line';
            inputContainer.innerHTML = 'guest@universe:~# <span class="user-typed-text"></span><span class="terminal-cursor">█</span>';
            terminal.appendChild(inputContainer);

            const textSpan = inputContainer.querySelector('.user-typed-text');
            let inputBuffer = "";

            const keyHandler = (e) => {
                if (e.key === 'Enter') {
                    if (inputBuffer.trim().toLowerCase() === 'reboot') {
                        window.removeEventListener('keydown', keyHandler);
                        executeCrtScreenOff();
                    } else {
                        const errLine = document.createElement('div');
                        errLine.className = 'terminal-line';
                        errLine.style.color = '#ff3366';
                        errLine.textContent = `bash: command not found: ${inputBuffer}`;
                        terminal.insertBefore(errLine, inputContainer);
                        inputBuffer = "";
                        textSpan.textContent = "";
                    }
                } else if (e.key === 'Backspace') {
                    inputBuffer = inputBuffer.slice(0, -1);
                    textSpan.textContent = inputBuffer;
                } else if (e.key.length === 1 && /^[a-zA-Z0-9 ]$/.test(e.key)) {
                    inputBuffer += e.key;
                    textSpan.textContent = inputBuffer;
                }
            };

            window.addEventListener('keydown', keyHandler);
        }

        function executeCrtScreenOff() {
            terminalWrapper.classList.add('crt-shutdown');
            setTimeout(() => {
                terminal.innerHTML = '';
                executeCrtScreenOn();
            }, 750);
        }

        function executeCrtScreenOn() {
            terminalWrapper.classList.remove('crt-shutdown');
            terminalWrapper.classList.add('crt-startup');

            const bootLogs = [
                "[    0.000000] Linux version 6.13.4-architecture-lonewolf (gcc version 13.2.0)",
                "[    0.002410] CPU0: Intel(R) Core(TM) Quantum Processor Physical Context initialized",
                "[    0.021004] BIOS-provided physical RAM map: 0x0000000000000 - 0x0000FFFFFFFFF (Aura Dynamic)",
                "[    0.104251] ACPI: Core Revision 20260517",
                "[    0.240984] ACPI: 1 ACPI AML tables successfully acquired and loaded",
                "[    0.512049] usbcore: registered new interface driver hub",
                "[    0.690114] Serial: 8250/16550 driver, 4 ports, IRQ sharing enabled",
                "[    0.884102] Dynamic Cipher Mapping: AES-256-GCM hardware acceleration integrity checks... OK",
                "[    1.024951] EXT4-fs (sda1): mounted filesystem with ordered data mode. Opts: (null)",
                "[    1.230114] VFS: Mounted root (ext4 filesystem) readonly on device 8:1.",
                "[    1.421049] init: Allocating system timeline threads...",
                " ",
                "[  CONNECT   ] Initializing Lonewolf239 Main Frame Architecture... [ OK ]",
                "[  RESTORE   ] Compiling destroyed DOM layout elements... [ OK ]",
                "[  RE-INDEX  ] Re-mapping CSS hyper-vectors and linear grids... [ OK ]",
                "[  STABLE    ] Calibrating stellar core mass and particle balancers... [ OK ]",
                " ",
                "[   READY    ] Dynamic universe deployment successful.",
                "[   REBOOT   ] Synchronizing local timelines. Redirecting user..."
            ];

            let bootIndex = 0;

            function streamBootLogs() {

                if (bootIndex < bootLogs.length) {
                    const line = document.createElement('div');
                    line.className = 'terminal-line';
                    if (bootLogs[bootIndex].includes('[ OK ]') || bootLogs[bootIndex].includes('successful')) {
                        line.style.color = '#00ff66';
                        line.style.textShadow = '0 0 8px rgba(0, 255, 102, 0.7)';
                    } else if (bootLogs[bootIndex].includes('['))
                        line.style.color = '#a1a1aa';

                    line.textContent = bootLogs[bootIndex];
                    terminal.appendChild(line);

                    terminalWrapper.scrollTop = terminalWrapper.scrollHeight;

                    bootIndex++;
                    setTimeout(streamBootLogs, 20 + Math.random() * 45);
                } else {
                    setTimeout(() => {
                        window.location.reload();
                    }, 800);
                }
            }

            setTimeout(streamBootLogs, 300);
        }
    }
});
