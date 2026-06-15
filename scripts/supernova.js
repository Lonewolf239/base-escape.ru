document.addEventListener("DOMContentLoaded", () => {
	if (localStorage.getItem('supernova_secret') === 'true') {
        initUltimateSecret();
        return;
    }

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

    const HOLD_DURATION = 4500;
    const THRESHOLD = 0.50;

    let centerX = 0;
    let centerY = 0;

    let canvas = null;
    let ctx = null;
    const implosionParticles = [];

    const glitchTargets = [
        document.querySelector('nav'),
        document.getElementById('projects-sidebar'),
        document.querySelector('.projects-grid'),
		document.getElementById('lonewolf239'),
        document.querySelector('footer')
    ].filter(Boolean);

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
        if (state === 'holding')
            state = 'recovering';
    };

    window.addEventListener('mouseup', releaseSun);

    function interactionLoop(time) {
        let dt = time - lastTime;
        if (dt > 100) dt = 100;
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
			progress -= (dt / (HOLD_DURATION * 0.5));
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

        const GAS_GROUPS = 6;
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

        const CHUNK_COUNT = 82;
        for (let i = 0; i < CHUNK_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 25;

            const numVertices = 5 + Math.floor(Math.random() * 4);
            const vertices = [];
            for (let v = 0; v < numVertices; v++)
                vertices.push(0.5 + Math.random() * 0.7);

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
        const EXPLOSION_CRASH_TIME = 5000;

		const PHASE_1_END = 2000;
		const PHASE_2_END = 3500;
		const PHASE_3_END = 5000;

        function renderExplosionFrame(timestamp) {
            let dt = timestamp - lastFrameTime;
            if (dt > 100) dt = 100;
            lastFrameTime = timestamp;
            explosionTime += dt;

			let lagIntensity = 0;
		    let glitchAmount = 0;
		    let stallChance = 0;
		    let hangMax = 0;

			if (explosionTime < PHASE_1_END) {
		        const t = explosionTime / PHASE_1_END;
		        lagIntensity = 0.015 + 0.03 * t;
		        glitchAmount = 2 + 3 * t;
		        stallChance = 0.03;
		        hangMax = 4;
		    } else if (explosionTime < PHASE_2_END) {
		        const t = (explosionTime - PHASE_1_END) / (PHASE_2_END - PHASE_1_END);
		        lagIntensity = 0.05 + 0.12 * t;
		        glitchAmount = 5 + 10 * t;
		        stallChance = 0.08 + 0.04 * t;
		        hangMax = 10 + 10 * t;
		    } else if (explosionTime < PHASE_3_END) {
		        const t = (explosionTime - PHASE_2_END) / (PHASE_3_END - PHASE_2_END);
		        const exp = (Math.exp(t * 4.0) - 1) / (Math.exp(4.0) - 1);
		        lagIntensity = 0.17 + exp * 0.83;
		        glitchAmount = 15 + exp * 50;
		        stallChance = 0.12 + exp * 0.70;
		        hangMax = 20 + exp * 220;
		    } else {
			    lagIntensity = 1;
		        glitchAmount = 70;
		        stallChance = 1;
		        hangMax = 320;
		    }

            glitchTargets.forEach(el => {
		        const rx = (Math.random() - 0.5) * glitchAmount;
		        const ry = (Math.random() - 0.5) * glitchAmount;
		        const skew = (Math.random() - 0.5) * (glitchAmount / 1.4);
		        const scale = 1 + (Math.random() - 0.5) * (glitchAmount / 90);

		        el.style.transform = `translate(${rx}px, ${ry}px) skew(${skew}deg) scale(${scale})`;
		        el.style.filter = `hue-rotate(${lagIntensity * 180}deg) saturate(${1 + lagIntensity * 4})`;
		    });

			if (Math.random() < stallChance) {
		        document.body.classList.add('freeze-all');
		        const stallEnd = performance.now() + (Math.random() * hangMax);
		        while (performance.now() < stallEnd) {}
		    } else document.body.classList.remove('freeze-all');


            if (explosionTime > 900 && !document.body.classList.contains('glitch-stage-1'))
				document.body.classList.add('glitch-stage-1');
		    if (explosionTime > 2200 && !document.body.classList.contains('glitch-stage-2'))
		        document.body.classList.add('glitch-stage-2');
		    if (explosionTime > 3600 && !document.body.classList.contains('glitch-stage-3'))
		        document.body.classList.add('glitch-stage-3');

            if (explosionTime >= EXPLOSION_CRASH_TIME) {
		        if (!document.getElementById('doomsday-freeze')) {
		            const freezeStyle = document.createElement('style');
		            freezeStyle.id = 'doomsday-freeze';
		            freezeStyle.innerHTML = `
		                *, *::before, *::after {
		                    animation-play-state: paused !important;
		                    transition: none !important;
		                }
		            `;
		            document.head.appendChild(freezeStyle);
		        }
		
		        setTimeout(() => {
		            glitchTargets.forEach(el => {
		                el.style.transform = '';
		                el.style.filter = '';
		            });
		            document.body.classList.remove('freeze-all');
		
		            cancelAnimationFrame(rafId);
		            if (canvas) canvas.remove();
		            if (sun) sun.remove();
		            triggerTerminalCrash();
		        }, 650);
		        return;
		    }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

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
		localStorage.removeItem('supernova_42_count');
        document.body.className = '';
		document.body.style.cssText = 'background: #000; background-color: #000; margin: 0; padding: 0; overflow: hidden; width: 100vw; height: 100vh; cursor: none;';
        document.body.innerHTML = '';

        const crtContainer = document.createElement('div');
        crtContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #030305; z-index: 999998; transform-origin: center center; overflow: hidden;';

        const terminalWrapper = document.createElement('div');
        terminalWrapper.className = 'terminal-screen-overlay';

        const terminal = document.createElement('div');
        terminal.className = 'supernova-terminal';

        terminalWrapper.appendChild(terminal);
        crtContainer.appendChild(terminalWrapper);
        document.body.appendChild(crtContainer);

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
                const text = crashLogs[lineIndex];

                if (text.startsWith('guest'))
                    line.className += ' prompt-line';
                else if (text.includes('[   ERROR    ]') || text.includes('FATAL')) {
                    line.style.color = '#ff00aa';
                    line.style.textShadow = '0 0 10px rgba(255, 0, 170, 0.85)';
                } else if (text.includes('---') || text.includes('reset code')) {
                    line.style.color = '#00ffff';
                    line.style.textShadow = '0 0 10px rgba(0, 255, 255, 0.85)';
                }

                terminal.appendChild(line);

                const isSystemLog = text.startsWith('[') || text.startsWith('FATAL') || text.startsWith('guest') || text.trim() === '';

                if (isSystemLog) {
                    line.textContent = text;
                    lineIndex++;
                    setTimeout(typeCrashLine, 15 + Math.random() * 35);
                } else {
                    let charIndex = 0;
                    function typeChar() {
                        if (charIndex < text.length) {
                            line.textContent += text[charIndex];
                            charIndex++;
                            const charDelay = Math.random() < 0.1 ? 80 : (10 + Math.random() * 20);
                            setTimeout(typeChar, charDelay);
                        } else {
                            lineIndex++;
                            setTimeout(typeCrashLine, 300);
                        }
                    }
                    typeChar();
                }
            } else initializeInteractiveInput();
        }
        setTimeout(typeCrashLine, 200);

        function initializeInteractiveInput() {
            const inputContainer = document.createElement('div');
            inputContainer.className = 'terminal-line prompt-line active-input-line';
            inputContainer.innerHTML = 'guest@universe:~# <span class="user-typed-text"></span><span class="terminal-cursor">█</span>';
            terminal.appendChild(inputContainer);

            const cursor = inputContainer.querySelector('.terminal-cursor');
            cursor.style.animation = 'none';
            setInterval(() => {
                cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
            }, 800);

            const textSpan = inputContainer.querySelector('.user-typed-text');
            let inputBuffer = "";

            const keyHandler = (e) => {
                if (e.key === 'Enter') {
					const trimmedCmd = inputBuffer.trim().toLowerCase();
					if (trimmedCmd === '42') {
                        let currentCount = parseInt(localStorage.getItem('supernova_42_count') || '0', 10);
                        currentCount++;
                        localStorage.setItem('supernova_42_count', currentCount);

                        const logLine = document.createElement('div');
                        logLine.className = 'terminal-line';
                        logLine.style.color = '#ffff00';

                        if (currentCount >= 42) {
                            logLine.textContent = `42`;
                            localStorage.setItem('supernova_secret', 'true');
							window.removeEventListener('keydown', keyHandler);
	                        executeCrtScreenOff();
                        } else if (currentCount % 5 === 0) logLine.textContent = `bash: ${currentCount}`;

                        terminal.insertBefore(logLine, inputContainer);
                        inputBuffer = "";
                        textSpan.textContent = "";
                    } else if (trimmedCmd === 'reboot') {
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
            crtContainer.animate([
                { transform: 'scale(1)', filter: 'brightness(1) contrast(1)', backgroundColor: '#030305', opacity: 1 },
                { transform: 'scale(1, 0.005)', filter: 'brightness(4)', backgroundColor: '#ffffff', opacity: 1, offset: 0.4 },
                { transform: 'scale(0.005, 0.005)', filter: 'brightness(10)', backgroundColor: '#ffffff', opacity: 1, offset: 0.85 },
                { transform: 'scale(0, 0)', opacity: 0 }
            ], { 
                duration: 650, 
                easing: 'cubic-bezier(0.15, 0.85, 0.3, 1)', 
                fill: 'forwards' 
            });

            setTimeout(() => {
                terminal.innerHTML = '';
                setTimeout(executeCrtScreenOn, 1500);
            }, 650);
        }

        function executeCrtScreenOn() {
            crtContainer.animate([
                { transform: 'scale(0.005, 0.005)', filter: 'brightness(10)', backgroundColor: '#ffffff', opacity: 1 },
                { transform: 'scale(1, 0.005)', filter: 'brightness(3)', backgroundColor: '#030305', offset: 0.45 },
                { transform: 'scale(1)', filter: 'brightness(1)', opacity: 1 }
            ], { 
                duration: 450, 
                easing: 'cubic-bezier(0.08, 0.9, 0.2, 1)', 
                fill: 'forwards' 
            });

            const bootLogs = [
                "[    0.000042] Linux version 6.13.4-architecture-lonewolf (gcc version 13.2.0)",
                "[    0.002420] CPU0: Intel(R) Core(TM) Quantum Processor Physical Context initialized",
                "[    0.021042] BIOS-provided physical RAM map: 0x0000000000000 - 0x0000FFFFFFFFF (Aura Dynamic)",
                "[    0.104251] ACPI: Core Revision 00102239",
                "[    0.249842] ACPI: 1 ACPI AML tables successfully acquired and loaded",
                "[    0.542049] usbcore: registered new interface driver hub",
                "[    0.690142] Serial: 8250/16550 driver, 4 ports, IRQ sharing enabled",
                "[    0.884202] Dynamic Cipher Mapping: AES-256-GCM hardware acceleration integrity checks... OK",
                "[    1.024291] EXT4-fs (sda1): mounted filesystem with ordered data mode. Opts: (null)",
                "[    1.230142] VFS: Mounted root (ext4 filesystem) readonly on device 8:1.",
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
                    const currentLog = bootLogs[bootIndex];

                    if (currentLog.includes('[ OK ]') || currentLog.includes('successful')) {
                        line.style.color = '#00ff66';
                        line.style.textShadow = '0 0 8px rgba(0, 255, 102, 0.7)';
                    } else if (currentLog.startsWith('[')) line.style.color = '#a1a1aa';

                    line.textContent = currentLog;
                    terminal.appendChild(line);
                    terminalWrapper.scrollTop = terminalWrapper.scrollHeight;

                    bootIndex++;
                    let delay = 2 + Math.random() * 10;

                    if (currentLog.includes('EXT4-fs') || currentLog.includes('timeline threads'))
                        delay = 700 + Math.random() * 600;
                    else if (currentLog.includes('[ OK ]')) delay = 150 + Math.random() * 150;
                    else if (Math.random() < 0.08) delay = 80 + Math.random() * 100;

                    setTimeout(streamBootLogs, delay);
                } else {
                    setTimeout(() => {
                        window.location.reload();
                    }, 800);
                }
            }

            setTimeout(streamBootLogs, 250);
        }
    }

	function initUltimateSecret() {
		const triggerApocalypse = (e) => {
			if (e && typeof e.preventDefault === 'function')
				e.preventDefault();

	        window.removeEventListener('click', triggerApocalypse, { capture: true });
		    window.removeEventListener('touchstart', triggerApocalypse, { capture: true });

			localStorage.removeItem('supernova_secret');
	        localStorage.removeItem('supernova_42_count');

		    document.body.className = '';
			document.body.innerHTML = '';
	        document.body.style.cssText = `
		        margin: 0;
			    padding: 0;
				background-color: #000;
	            width: 100vw;
		        height: 100vh;
			    overflow: hidden;
				display: flex;
	            justify-content: center;
		        align-items: center;
			    position: fixed;
				inset: 0;
	            cursor: none;
			    context-menu: none;
			    user-select: none;
		    `;

	        const imgEmpty = document.createElement('img');
		    imgEmpty.src = '/images/no_lonewolf239.jpg';
			imgEmpty.className = 'scene-image-base';
	        document.body.appendChild(imgEmpty);

	        const imgSubject = document.createElement('img');
		    imgSubject.src = '/images/lonewolf239.jpg';
			imgSubject.className = 'scene-image-subject';
	        document.body.appendChild(imgSubject);


			const style = document.createElement('style');
	        style.innerHTML = `
		        @keyframes cinematicScroll {
			        0% { transform: translate3d(0, 100vh, 0); }
				    100% { transform: translate3d(0, calc(-100% - 100px), 0); }
	            }
		        @keyframes musicPopUp {
			        0% { transform: translateY(120%); opacity: 0; }
				    10% { transform: translateY(0); opacity: 1; }
					90% { transform: translateY(0); opacity: 1; }
	                100% { transform: translateY(120%); opacity: 0; }
		        }
                .scene-image-base, .scene-image-subject {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    position: absolute;
                    top: 0;
                    left: 0;
                }
                .scene-image-base { z-index: 1; }
                .scene-image-subject {
                    z-index: 2;
                    animation: subjectDissolve 15s ease-in-out forwards;
                    animation-delay: 193s;
                }
                @keyframes subjectDissolve {
                    0% { opacity: 1; filter: blur(0px); transform: scale(1); }
                    100% { opacity: 0; filter: blur(12px); transform: scale(1.04); visibility: hidden; }
                }
			    @keyframes finalMessageShow {
				    0% { opacity: 0; filter: blur(10px); transform: scale(0.95); visibility: visible; }
					100% { opacity: 1; filter: blur(0px); transform: scale(1); visibility: visible; }
	            }
		        .credits-overlay {
			        position: absolute;
				    inset: 0;
					z-index: 3;
	                background: linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, transparent 70%),
		                        radial-gradient(circle at center, rgba(0,0,0,0) 20%, rgba(0,0,0,0.6) 100%);
			        display: flex;
				    justify-content: flex-start;
					overflow: hidden;
	                pointer-events: none;
		            padding-left: 8%;
			    }
				.credits-scroll-box {
					width: 100%;
	                max-width: 550px;
		            display: flex;
			        flex-direction: column;
				    align-items: flex-start;
	                text-align: left;
		            font-family: 'Fira Code', monospace;
			        color: #ffffff;
				    flex-shrink: 0;
					height: max-content;
	                will-change: transform;
		            animation: cinematicScroll 208s linear forwards;
			    }
	            .credits-main-title {
		            font-size: 2.8rem;
			        letter-spacing: 12px;
				    text-transform: uppercase;
					margin-bottom: 12rem;
	                margin-top: 25vh;
		            color: #ff6a00; 
			        text-shadow: 3px 3px 0px #000, -1px -1px 0px #000, 0 0 25px rgba(255,106,0,0.7);
	            }
		        .credit-group {
			        margin-bottom: 5.5rem;
				    display: flex;
					flex-direction: column;
	                align-items: flex-start;
		            width: 100%;
			    }
				.credit-position {
					font-size: 0.8rem;
	                text-transform: uppercase;
		            letter-spacing: 4px;
			        color: #cbd5e1; 
				    font-weight: 600;
					margin-bottom: 0.5rem;
	                text-shadow: 2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000, 0 2px 4px #000;
		        }
			    .credit-name-holder {
				    font-size: 1.5rem;
					font-weight: bold;
	                letter-spacing: 1px;
		            color: #ffffff;
			        text-shadow: 2px 2px 0px #000, -1px -1px 0px #000, 2px -1px 0px #000, -1px 2px 0px #000, 0 0 10px rgba(255,255,255,0.3);
				}
	            .music-panel {
		            position: absolute;
			        bottom: 30px;
					right: 30px;
					z-index: 10;
	                background: rgba(20, 20, 20, 0.85);
		            border: 1px solid rgba(255, 106, 0, 0.4);
			        border-radius: 8px;
				    padding: 12px 18px;
					display: flex;
	                align-items: center;
		            box-shadow: 0 4px 15px rgba(0,0,0,0.6), 0 0 10px rgba(255,106,0,0.2);
			        font-family: 'Fira Code', monospace;
				    color: #fff;
					pointer-events: auto;
	                transform: translateY(120%);
		            opacity: 0;
			        animation: musicPopUp 10s ease-in-out forwards;
				    animation-delay: 2s;
	            }
		        .music-icon {
			        font-size: 1.8rem;
				    color: #ff6a00;
					margin-right: 15px;
	                text-shadow: 0 0 10px rgba(255,106,0,0.5);
		        }
			    .music-info {
				    display: flex;
					flex-direction: column;
	            }
		        .music-title {
			        font-size: 0.95rem;
				    font-weight: bold;
					letter-spacing: 1px;
	            }
		        .music-artist {
			        font-size: 0.75rem;
				    color: #94a3b8;
					text-transform: uppercase;
		            letter-spacing: 2px;
	                margin-top: 2px;
			    }
	            .final-dark-overlay {
		            position: absolute;
			        inset: 0;
				    background: radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%);
					z-index: 20; 
	                opacity: 0;
		            visibility: hidden;
			        display: flex;
				    justify-content: center;
					align-items: center;
	                animation: finalMessageShow 15s ease-in-out forwards;
		            animation-delay: 193s; 
	            }
	            .centered-footer {
		            text-align: center;
			        font-family: 'Fira Code', monospace;
				}
                .final-title {
                    font-size: 3rem;
                    font-weight: 700;
                    color: #ffffff;
                    letter-spacing: 6px;
                    margin-bottom: 1.2rem;
                    text-transform: uppercase;
                    text-shadow: 0 0 20px rgba(255, 255, 255, 0.4), 2px 2px 4px rgba(0, 0, 0, 0.8);
                }
                .final-subtitle {
                    font-size: 1.4rem;
                    color: #ff6a00;
                    letter-spacing: 4px;
                    text-transform: uppercase;
                    text-shadow: 0 0 15px rgba(255, 106, 0, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.8);
                    animation: pulseGlow 2.5s infinite ease-in-out;
                }
                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.7; text-shadow: 0 0 10px rgba(255, 106, 0, 0.4), 2px 2px 4px rgba(0, 0, 0, 0.8); }
                    50% { opacity: 1; text-shadow: 0 0 25px rgba(255, 106, 0, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8); }
                }
	        `;
		    document.head.appendChild(style);

			const creditsOverlay = document.createElement('div');
	        creditsOverlay.className = 'credits-overlay';

		    const scrollBox = document.createElement('div');
			scrollBox.className = 'credits-scroll-box';
	        scrollBox.innerHTML = `<h1 class="credits-main-title">LONEWOLF239</h1>`;

		    const rolesList = [
			    { p: "Режиссер-постановщик", n: "Lonewolf239" },
				{ p: "Автор оригинального сценария", n: "Lonewolf239" },
	            { p: "Генеральный продюсер", n: "Lonewolf239" },
		        { p: "Исполнительный продюсер", n: "Lonewolf239" },
			    { p: "Линейный продюсер проекта", n: "Lonewolf239" },
				{ p: "Шоураннер", n: "Lonewolf239" },
	            { p: "В главной роли", n: "Lonewolf239" },
		        { p: "В роли Одинокого Волка", n: "Lonewolf239" },
			    { p: "Главный архитектор систем (Chief Architect)", n: "Lonewolf239" },
				{ p: "Руководитель разработки (Team Lead)", n: "Lonewolf239" },
	            { p: "Senior Frontend Developer", n: "Lonewolf239" },
		        { p: "Middle Frontend Developer", n: "Lonewolf239" },
			    { p: "Junior Frontend Developer", n: "Lonewolf239" },
				{ p: "Frontend Intern (Стажер-кодер)", n: "Lonewolf239" },
	            { p: "Тот самый чувак, исправивший баги за стажером", n: "Lonewolf239" },
		        { p: "Главный UI/UX дизайнер интерфейса", n: "Lonewolf239" },
			    { p: "Исследователь пользовательского опыта (UX Researcher)", n: "Lonewolf239" },
				{ p: "Инженер квантовых частиц Canvas", n: "Lonewolf239" },
	            { p: "Разработчик физики взрыва Сверхновой", n: "Lonewolf239" },
		        { p: "Магистр деформации DOM-дерева", n: "Lonewolf239" },
			    { p: "Специалист по анимациям CSS3 и Keyframes", n: "Lonewolf239" },
				{ p: "Инженер эффектов симуляции CRT-монитора", n: "Lonewolf239" },
	            { p: "Ведущий системный администратор terminal", n: "Lonewolf239" },
		        { p: "Администратор баз данных LocalStorage", n: "Lonewolf239" },
			    { p: "DevOps Engineer & Infrastructure Lead", n: "Lonewolf239" },
				{ p: "Специалист по падениям CI/CD пайплайнов", n: "Lonewolf239" },
	            { p: "Директор Департамента обеспечения качества (QA Director)", n: "Lonewolf239" },
		        { p: "Ведущий инженер по автоматизации тестирования", n: "Lonewolf239" },
			    { p: "Специалист по ручному тестированию (Manual QA)", n: "Lonewolf239" },
				{ p: "Тестировщик под высокими нагрузками (Stress Tester)", n: "Lonewolf239" },
	            { p: "Звукорежиссер перезаписи и монтажа звука", n: "Lonewolf239" },
		        { p: "Музыкальный супервайзер (Music Supervisor)", n: "Lonewolf239" },
			    { p: "Инженер по аудио-компрессии кодека .m4a", n: "Lonewolf239" },
				{ p: "Скаут локаций (Location Scout)", n: "Lonewolf239" },
	            { p: "Постановщик трюков (Stunt Coordinator)", n: "Lonewolf239" },
		        { p: "Исполнитель опасных трюков (Каскадер)", n: "Lonewolf239" },
			    { p: "Ассистент каскадера", n: "Lonewolf239" },
				{ p: "Постановщик трюка «Медитация на разделительной полосе»", n: "Lonewolf239" },
	            { p: "Художник по костюмам", n: "Lonewolf239" },
		        { p: "Менеджер по реквизиту (Property Master)", n: "Lonewolf239" },
			    { p: "Директор по освещению кадра (Солнечный закат)", n: "Lonewolf239" },
				{ p: "Колорист финального изображения (Color Grader)", n: "Lonewolf239" },
	            { p: "Директор по MARKETING и связям с общественностью", n: "Lonewolf239" },
		        { p: "Копирайтер терминальных логов и аварийных отчетов", n: "Lonewolf239" },
			    { p: "Главный специалист по решению Git-конфликтов", n: "Lonewolf239" },
				{ p: "Сортировщик и чистильщик мертвого кода", n: "Lonewolf239" },
	            { p: "Менеджер по доставке кофе и энергетиков (Catering)", n: "Lonewolf239" },
		        { p: "Шеф-повар полевой кухни для одного разработчика", n: "Lonewolf239" },
			    { p: "Главный Scrum-мастер и фасилитатор", n: "Lonewolf239" },
				{ p: "Agile-консультант проекта", n: "Lonewolf239" },
	            { p: "Владелец продукта (Product Owner)", n: "Lonewolf239" },
		        { p: "Психологическая поддержка команды разработки", n: "Lonewolf239" },
			    { p: "Тот, кто загорелся идеей и набросал базу за пару дней", n: "Lonewolf239" },
				{ p: "Тот, кто забил болт на код на несколько месяцев", n: "Lonewolf239" },
	            { p: "Тот, кто собрал всё в монолит за сутки перед деплоем", n: "Lonewolf239" },
		        { p: "Chief Executive Officer (CEO)", n: "Lonewolf239" },
			    { p: "Chief Technology Officer (CTO)", n: "Lonewolf239" },
				{ p: "Chief Cleaning Officer (Уборщик console.log)", n: "Lonewolf239" },
	            { p: "Философский консультант по числу 42", n: "Дуглас Адамс" },
		        { p: "Особая благодарность за саундтрек молодости", n: "Честер Беннингтон (Linkin Park)" },
			    { p: "Вдохновитель масштаба взрывов и общего пафоса", n: "Майкл Бэй" },
				{ p: "Технический спонсор проекта", n: "Кофеин, Бессонница и Чистый Энтузиазм" }
	        ];

		    rolesList.forEach(item => {
			    const block = document.createElement('div');
				block.className = 'credit-group';
	            block.innerHTML = `
		            <div class="credit-position">${item.p}</div>
			        <div class="credit-name-holder">${item.n}</div>
				`;
	            scrollBox.appendChild(block);
		    });

			creditsOverlay.appendChild(scrollBox);
	        document.body.appendChild(creditsOverlay);

		    const musicPanel = document.createElement('div');
			musicPanel.className = 'music-panel';
	        musicPanel.innerHTML = `
		        <div class="music-icon">♪</div>
			    <div class="music-info">
				    <div class="music-title">What I've Done</div>
					<div class="music-artist">Linkin Park</div>
	            </div>
		    `;
			document.body.appendChild(musicPanel);

	        const finalDarkness = document.createElement('div');
		    finalDarkness.className = 'final-dark-overlay';
			finalDarkness.innerHTML = `
				<div class="centered-footer">
					<div class="final-title">LONEWOLF239 © 2026</div>
	                <div class="final-subtitle">Нажмите F5</div>
				</div>
	        `;
		    document.body.appendChild(finalDarkness);

			const audio = new Audio();
	        audio.src = '/images/What_I_ve_Done_Linkin_Park.m4a';
			audio.volume = 0.8;

	        audio.play().catch(err => console.error("Ошибка воспроизведения:", err));

			const creditsDuration = 208000;
            const waitTime = 42 * 60 * 60 * 1000;
            let timer42 = null;
            let isFailed = false;

			const checkVisibility = () => {
                if (document.hidden || document.visibilityState === 'hidden' || !document.hasFocus()) {
                    isFailed = true;
                    if (timer42) clearTimeout(timer42);
                    document.removeEventListener('visibilitychange', checkVisibility);
                    window.removeEventListener('blur', checkVisibility);
                }
            };

			document.addEventListener('visibilitychange', checkVisibility);
            window.addEventListener('blur', checkVisibility);

			setTimeout(() => {
                if (isFailed) return;
                timer42 = setTimeout(() => {
                    if (!isFailed) {
                        sessionStorage.setItem('ultimate_42_unlocked', 'true');
                        window.location.href = '/42/42/42/42/42/42/42/42/42/42/42/index.html';
                    }
                }, waitTime);
            }, creditsDuration);
		};

	    window.addEventListener('click', triggerApocalypse, { once: true, capture: true });
		window.addEventListener('touchstart', triggerApocalypse, { once: true, capture: true });
	}
});
