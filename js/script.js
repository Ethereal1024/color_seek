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

        const distance = Math.sqrt(diffR * diffR, diffG * diffG, diffB * diffB);
        const maxDistance = Math.sqrt(255 * 255 * 3);
        const rawScore = 1 - distance / maxDistance;
        return Math.round(rawScore * rawScore * 10000) / 100;
    }

    static random() {
        return new Color({
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256)
        })
    }
}

class ColorPicker {
    constructor(spectrumEl, hueSliderEl, rgbInputEl, hexInputEl, onColorChange) {
        this.spectrumEl = spectrumEl;
        this.hueSliderEl = hueSliderEl;
        this.rgbInputEl = rgbInputEl;
        this.hexInputEl = hexInputEl;
        this.onColorChange = onColorChange;
        this.currentHue = 0;
        this.currentColor = Color.random();

        this.initSpectrum();
        this.initHueSlider();
        this.initInputs();
        this.updateUI();
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

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const targetColorEl = document.getElementById('targetColor');
    const paletteEl = document.getElementById('palette');
    const userColorEl = document.getElementById('userColor');
    const confirmBtn = document.getElementById('confirmBtn');
    const resultEl = document.getElementById('result');

    let targetColor = '';
    let userSelectedColor = '';

    function generateRandomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);

        return `rgb(${r}, ${g}, ${b})`;
    }

    function createPalette() {
        paletteEl.innerHTML = '';
        for (let r = 0; r < 16; r++) {
            for (let g = 0; g < 16; g++) {
                const b = 8;
                const color = `rgb(${r * 16}, ${g * 16}, ${b * 16})`;

                const cell = document.createElement('div')
                cell.className = 'palette-cell';
                cell.style.backgroundColor = color;
                cell.dataset.color = color;

                cell.addEventListener('click', function () {
                    userSelectedColor = this.dataset.color;
                    userColorEl.style.backgroundColor = userSelectedColor;
                });

                paletteEl.appendChild(cell);
            }
        }
    }

    function calculateSimilarity(color1, color2) {
        const rgb1 = color1.match(/\d+/g).map(Number);
        const rgb2 = color2.match(/\d+/g).map(Number);

        const diffR = rgb1[0] - rgb2[0];
        const diffG = rgb1[1] - rgb2[1];
        const diffB = rgb1[2] - rgb2[2];

        // 正确计算欧氏距离（各项相加后开方）
        const distance = Math.sqrt(diffR * diffR + diffG * diffG + diffB * diffB);
        const maxDistance = Math.sqrt(255 * 255 + 255 * 255 + 255 * 255);
        const similarity = 100 - (distance * 100 / maxDistance);

        return Math.round(similarity * 100) / 100;
    }

    function initGame() {
        targetColor = generateRandomColor();
        targetColorEl.style.backgroundColor = targetColor;

        console.log('initGame targetColor:', targetColor);

        userColorEl.style.backgroundColor = "#ffffff";
        userSelectedColor = '';

        resultEl.innerHTML = '<p>请尝试匹配目标颜色</p>';
        createPalette();
    }

    confirmBtn.addEventListener('click', function () {
        if (!userSelectedColor) {
            resultEl.innerHTML = '<p style="color:red">请先选择一个颜色</p>';
            return;
        }

        const similarity = calculateSimilarity(targetColor, userSelectedColor);
        let message = `<p>相似度：${similarity}</p>`
        resultEl.innerHTML = message + '<button id="restartBtn">再试一次</button>';

        // 给动态插入的重试按钮添加事件
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', function () {
                initGame();
            });
        }
    });

    initGame();
});