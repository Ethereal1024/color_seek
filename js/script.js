class Color {
    constructor(value) {
        this.tc = tinycolor(value);
        if (!this.tc.isValid()) {
            throw new Error("Invalid color value");
        }
    }

    getRGB() {
        const { r, g, b } = this.tc.toRgb();
        return [r, g, b];
    }

    getHSV() {
        const { h, s, v } = this.tc.toHsv();
        return [h, s * 100, v * 100];
    }

    getHex() {
        return this.tc.toHexString();
    }

    getCssRGB() {
        return this.tc.toRgbString();
    }

    similarityTo(otherColor) {
        const rgb1 = this.getRGB();
        const rgb2 = otherColor.getRGB();

        const diffR = rgb1[0] - rgb2[0];
        const diffG = rgb1[1] - rgb2[1];
        const diffB = rgb1[2] - rgb2[2];

        const distance = Math.sqrt(diffR * diffR + diffG * diffG + diffB * diffB);
        const maxDistance = Math.sqrt(255 * 255 * 3);
        let rawScore = 1 - distance / maxDistance; // 线性相似度 0-1

        // 进行非线性放大（幂 k）以拉开分数差距：更相似的保持高分，接近不相似的快速变低
        rawScore = Math.max(0, rawScore); // 防止负值
    const k = (typeof window !== 'undefined' && window.similarityK) ? window.similarityK : 1.5;
    const adjusted = Math.pow(rawScore, k);

        return Math.round(adjusted * 100 * 100) / 100; // 返回百分比并保留两位小数
    }

    static random() {
        return new Color({
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256)
        });
    }
}

class ColorPicker {
    constructor(spectrumEl, hueSliderEl, onColorChange) {
        this.spectrumEl = spectrumEl;
        this.hueSliderEl = hueSliderEl;
        this.onColorChange = onColorChange;
        this.currentColor = Color.random();
        this.currentHue = Math.round(this.currentColor.getHSV()[0]);
        this.marker = null;

        this.initSpectrum();
        this.initHueSlider();
        this.updateUI();
        // 确保光谱和色相槽在初始化后同步显示
        this.updateSpectrum();
    }

    initSpectrum() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
        gradient.setAttribute("id", "spectrumGradient");
        gradient.setAttribute("x1", "0%");
        gradient.setAttribute("y1", "0%");
        gradient.setAttribute("x2", "100%");
        gradient.setAttribute("y2", "0%");

        const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", "#fff");

        const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", `hsl(${this.currentHue}, 100%, 50%)`);

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);

    // 添加垂直覆盖渐变，从透明到黑，用于表示明度（value）
    const valueGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    valueGradient.setAttribute('id', 'valueGradient');
    valueGradient.setAttribute('x1', '0%');
    valueGradient.setAttribute('y1', '0%');
    valueGradient.setAttribute('x2', '0%');
    valueGradient.setAttribute('y2', '100%');

    const vstop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    vstop1.setAttribute('offset', '0%');
    vstop1.setAttribute('stop-color', '#000');
    vstop1.setAttribute('stop-opacity', '0');

    const vstop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    vstop2.setAttribute('offset', '100%');
    vstop2.setAttribute('stop-color', '#000');
    vstop2.setAttribute('stop-opacity', '1');

    valueGradient.appendChild(vstop1);
    valueGradient.appendChild(vstop2);
    defs.appendChild(valueGradient);

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("fill", "url(#spectrumGradient)");
    svg.appendChild(rect);

    // 覆盖一个垂直的黑色渐变层，制造明度从上到下变化
    const rectOverlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rectOverlay.setAttribute("width", "100%");
    rectOverlay.setAttribute("height", "100%");
    rectOverlay.setAttribute("fill", "url(#valueGradient)");
    svg.appendChild(rectOverlay);

    // 不让 svg 拦截指针事件，父容器处理拖拽
    svg.style.pointerEvents = 'none';

    // 保存对横向渐变 stop 的引用，后续更新时直接修改颜色
    this._horizontalStop = stop2;

        this.spectrumEl.appendChild(svg);

        const handlePointer = (clientX, clientY) => {
            const rect = this.spectrumEl.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            const saturation = Math.min(100, Math.max(0, Math.round((x / rect.width) * 100)));
            const value = Math.min(100, Math.max(0, 100 - Math.round((y / rect.height) * 100)));

            this.currentColor = new Color({
                h: this.currentHue,
                s: saturation / 100,
                v: value / 100
            });

            this.updateUI();
            this.onColorChange(this.currentColor);
        };

        let isDown = false;
        this.spectrumEl.addEventListener('pointerdown', (e) => { isDown = true; this.spectrumEl.setPointerCapture(e.pointerId); handlePointer(e.clientX, e.clientY); });
        this.spectrumEl.addEventListener('pointermove', (e) => { if (!isDown) return; handlePointer(e.clientX, e.clientY); });
        this.spectrumEl.addEventListener('pointerup', (e) => { isDown = false; this.spectrumEl.releasePointerCapture(e.pointerId); });
        this.spectrumEl.addEventListener('pointerleave', () => { isDown = false; });
    }

    initHueSlider() {
        // 添加可拖动的 hue handle
        const handleHuePointer = (clientY) => {
            const rect = this.hueSliderEl.getBoundingClientRect();
            const y = Math.min(rect.height, Math.max(0, clientY - rect.top));
            this.currentHue = Math.round((y / rect.height) * 360);
            this.updateSpectrum();
            if (this.onColorChange) {
                // 更新当前颜色的色相但保持 s/v
                const [h, s, v] = this.currentColor.getHSV();
                this.currentColor = new Color({ h: this.currentHue, s: s / 100, v: v / 100 });
                this.onColorChange(this.currentColor);
            }
        };

        let hueDown = false;
        this.hueSliderEl.addEventListener('pointerdown', (e) => { hueDown = true; this.hueSliderEl.setPointerCapture(e.pointerId); handleHuePointer(e.clientY); });
        this.hueSliderEl.addEventListener('pointermove', (e) => { if (!hueDown) return; handleHuePointer(e.clientY); });
        this.hueSliderEl.addEventListener('pointerup', (e) => { hueDown = false; this.hueSliderEl.releasePointerCapture(e.pointerId); });
        this.hueSliderEl.addEventListener('pointerleave', () => { hueDown = false; });

        // 创建并插入可见的 hue handle
        if (!this.hueSliderEl.querySelector('.hue-handle')) {
            const hueHandle = document.createElement('div');
            hueHandle.className = 'hue-handle';
            this.hueSliderEl.appendChild(hueHandle);
        }
    }


    addSelectionMarker() {
        if (this.marker) {
            this.marker.remove();
        }

        const [h, s, v] = this.currentColor.getHSV();
        const rect = this.spectrumEl.getBoundingClientRect();
        const marker = document.createElement('div');
        marker.className = 'color-marker';
        // 使用像素位置放置 marker，避免 % 在某些布局中出现偏差
        marker.style.left = `${(s / 100) * rect.width}px`;
        marker.style.top = `${((100 - v) / 100) * rect.height}px`;
        this.spectrumEl.appendChild(marker);
        this.marker = marker;
    }

    updateSpectrum() {
        if (this._horizontalStop) this._horizontalStop.setAttribute("stop-color", `hsl(${this.currentHue}, 100%, 50%)`);
        // 更新 hue handle 位置
        const handle = this.hueSliderEl.querySelector('.hue-handle');
        if (handle) {
            const rect = this.hueSliderEl.getBoundingClientRect();
            handle.style.top = `${(this.currentHue / 360) * rect.height}px`;
        }
        this.addSelectionMarker();
    }

    updateUI() {
        this.addSelectionMarker();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const targetColorEl = document.getElementById('targetColor');
    const userColorEl = document.getElementById('userColor');
    const confirmBtn = document.getElementById('confirmBtn');
    const resultEl = document.getElementById('result');

    let targetColor;
    let userSelectedColor = null;
    // 默认相似度幂 k
    let similarityK = 1.5;
    // 将值写到 window 上，供 Color.similarityTo 读取
    if (typeof window !== 'undefined') window.similarityK = similarityK;

    const colorPicker = new ColorPicker(
        document.getElementById('hsvSpectrum'),
        document.getElementById('hsvHueSlider'),
        (color) => {
            userSelectedColor = color;
            userColorEl.style.backgroundColor = color.getCssRGB();
            // 更新色块内文字颜色以保证可读性
            setBlockTextColor(userColorEl, color.getCssRGB());
        }
    );

    function initGame() {
        targetColor = Color.random();
        targetColorEl.style.backgroundColor = targetColor.getCssRGB();
        // 同步设置目标块内部文字颜色
        setBlockTextColor(targetColorEl, targetColor.getCssRGB());
        // 清除左侧色块上的相似度文字
        const targetValueEl = document.getElementById('targetValue');
        if (targetValueEl) {
            targetValueEl.innerHTML = '';
        }
        userColorEl.style.backgroundColor = '#ffffff';
        setBlockTextColor(userColorEl, '#ffffff');
        userSelectedColor = null;
        if (resultEl) resultEl.innerHTML = '<p>请尝试匹配目标颜色！</p>';
    }

    // 根据背景颜色亮度设置块内文字颜色（黑或白），提升可读性
    function setBlockTextColor(blockEl, bgColor) {
        try {
            const tc = tinycolor(bgColor);
            const useDarkText = tc.isLight();
            const label = blockEl.querySelector('.block-label');
            const value = blockEl.querySelector('.block-value');
            if (label) label.style.color = useDarkText ? '#111' : '#fff';
            if (value) value.style.color = useDarkText ? '#111' : '#fff';
            // 按钮颜色保持不变（按钮使用全局样式），不要随背景变化
        } catch (err) {
            // do nothing
        }
    }

    confirmBtn.addEventListener('click', function() {
        if (!userSelectedColor) {
            if (resultEl) resultEl.innerHTML = '<p style="color:red;">请先选择一个颜色！</p>';
            return;
        }

        const similarity = targetColor.similarityTo(userSelectedColor);
        let message = `<p>相似度：${similarity}%</p>`;
        
        if (similarity >= 90) {
            message = `<p>完美匹配！相似度: ${similarity}%</p>`;
        } else if (similarity >= 70) {
            message = `<p>很不错！相似度: ${similarity}%</p>`;
        } else if (similarity >= 50) {
            message = `<p>还可以，继续努力！相似度: ${similarity}%</p>`;
        } else {
            message = `<p>需要更多练习哦！相似度: ${similarity}%</p>`;
        }
        
        if (resultEl) {
            resultEl.innerHTML = message + '<button id="restartBtn">再试一次</button>';
            const tempRestart = document.getElementById('restartBtn');
            if (tempRestart) tempRestart.addEventListener('click', initGame);
        }
    });

    const gameArea = document.getElementById('gameArea');

    // 显示相似度结果并添加重新开始按钮
    function showSimilarityResult(similarity) {
        if (!gameArea) return;
        
        // 收拢左右列
        gameArea.classList.add('compressed');
        
        // 在左侧目标色块上显示相似度信息
        const targetValueEl = document.getElementById('targetValue');
        if (targetValueEl) {
            targetValueEl.innerHTML = `
                <div class="similarity-display">
                    <div class="similarity-label">相似度</div>
                    <div class="similarity-percentage">${similarity}%</div>
                </div>
            `;
        }
        
        // 在右下角添加重新开始按钮
        const restartBtn = document.createElement('button');
        restartBtn.id = 'restartBtn';
        restartBtn.textContent = '重新开始';
        restartBtn.className = 'restart-button';
        restartBtn.style.position = 'absolute';
        restartBtn.style.right = '12px';
        restartBtn.style.bottom = '12px';
        restartBtn.style.zIndex = '20';
        
        restartBtn.addEventListener('click', function() {
            // 移除重新开始按钮
            restartBtn.remove();
            // 复原布局
            gameArea.classList.remove('compressed');
            // 重新显示确定选择按钮
            confirmBtn.style.display = 'block';
            // 重置游戏
            initGame();
        });
        
        document.body.appendChild(restartBtn);
    }

    // 点击确认按钮显示相似度结果
    confirmBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (!userSelectedColor) {
            if (resultEl) resultEl.innerHTML = '<p style="color:red;">请先选择一个颜色！</p>';
            return;
        }
        const similarity = targetColor.similarityTo(userSelectedColor);
        showSimilarityResult(similarity);
        // 隐藏确定选择按钮
        confirmBtn.style.display = 'none';
    });


    initGame();

    // 设置面板逻辑
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const closeSettings = document.getElementById('closeSettings');
    const kRange = document.getElementById('kRange');
    const kValue = document.getElementById('kValue');

    if (settingsBtn && settingsPanel) {
        // 创建并插入 backdrop（一次）
        let backdrop = document.querySelector('.settings-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'settings-backdrop';
            document.body.appendChild(backdrop);
        }

        settingsBtn.addEventListener('click', () => {
            settingsPanel.classList.add('open');
            settingsPanel.setAttribute('aria-hidden', 'false');
            backdrop.style.display = 'block';
        });

        // 点击 backdrop 关闭
        backdrop.addEventListener('click', () => {
            settingsPanel.classList.remove('open');
            settingsPanel.setAttribute('aria-hidden', 'true');
            backdrop.style.display = 'none';
        });
    }

    if (closeSettings) {
        closeSettings.addEventListener('click', () => {
            settingsPanel.classList.remove('open');
            settingsPanel.setAttribute('aria-hidden', 'true');
            const backdrop = document.querySelector('.settings-backdrop');
            if (backdrop) backdrop.style.display = 'none';
        });
    }

    if (kRange && kValue) {
        kRange.value = similarityK;
        kValue.textContent = similarityK.toFixed(2);
        kRange.addEventListener('input', (e) => {
            similarityK = parseFloat(e.target.value);
            kValue.textContent = similarityK.toFixed(2);
            if (typeof window !== 'undefined') window.similarityK = similarityK;
        });
    }

    // 当在页面上点击非输入区域，自动 blur 当前激活元素，防止残留文本光标
    document.addEventListener('pointerdown', (e) => {
        const tag = e.target.tagName.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea' && document.activeElement && document.activeElement !== document.body) {
            try { document.activeElement.blur(); } catch (err) { /* ignore */ }
        }
    });
});
