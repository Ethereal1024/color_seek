document.addEventListener('DOMContentLoaded', function () {
    const targetColorE1 = document.getElementById('targetColor');
    const paletteE1 = document.getElementById('palette');
    const userColorE1 = document.getElementById('userColor');
    const confirmBtn = document.getElementById('confirmBtn');
    const resultE1 = document.getElementById('result');

    let targetColor = '';
    let userSelectedColor = '';

    function generateRandomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);

        return `rgb(${r}, ${g}, ${b})`;
    }

    function createPalette() {
        paletteE1.innerHTML = '';
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
                    userColorE1.style.backgroundColor = userSelectedColor;
                });

                paletteE1.appendChild(cell);
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
        targetColorE1.style.backgroundColor = targetColor;

        console.log('initGame targetColor:', targetColor);

        userColorE1.style.backgroundColor = "#ffffff";
        userSelectedColor = '';

        resultE1.innerHTML = '<p>请尝试匹配目标颜色</p>';
        createPalette();
    }

    confirmBtn.addEventListener('click', function () {
        if (!userSelectedColor) {
            resultE1.innerHTML = '<p style="color:red">请先选择一个颜色</p>';
            return;
        }

        const similarity = calculateSimilarity(targetColor, userSelectedColor);
        let message = `<p>相似度：${similarity}</p>`
        resultE1.innerHTML = message + '<button id="restartBtn">再试一次</button>';

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