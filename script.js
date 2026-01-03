// 3D地球旋转效果实现
class ParticleEarth {
    constructor() {
        this.canvas = document.getElementById('earthCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        // 根据屏幕尺寸调整粒子数量
        this.particleCount = window.innerWidth < 768 ? 1000 : 2000;
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationSpeed = 0.002;
        // 根据屏幕尺寸调整地球半径
        this.radius = window.innerWidth < 768 ? 150 : 200;
        this.targetRadius = this.radius; // 目标半径，用于放大效果
        this.centerX = 0;
        this.centerY = 0;
        this.depth = window.innerWidth < 768 ? 300 : 400;
        this.targetDepth = window.innerWidth < 768 ? 150 : 200; // 目标深度，用于进入效果
        this.alpha = 0; // 地球透明度，用于渐显效果
        this.fadeSpeed = 0.001; // 渐显速度
        this.isScaling = false; // 是否正在放大
        this.scaleSpeed = 5; // 放大速度
        this.isFadingOut = false; // 是否正在消失
        this.fadeOutSpeed = 0.01; // 消失速度
        this.isVisible = true; // 地球是否可见，初始为true
        
        this.init();
        this.animate();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    init() {
        this.resizeCanvas();
        this.createParticles();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // 根据屏幕尺寸调整粒子数量和地球半径
        const newParticleCount = window.innerWidth < 768 ? 1000 : 2000;
        const newRadius = window.innerWidth < 768 ? 150 : 200;
        
        // 只有在数量或半径变化时才重新创建粒子
        if (this.particleCount !== newParticleCount || this.radius !== newRadius) {
            this.particleCount = newParticleCount;
            this.radius = newRadius;
            this.targetRadius = newRadius;
            this.depth = window.innerWidth < 768 ? 300 : 400;
            this.targetDepth = window.innerWidth < 768 ? 150 : 200;
            
            // 重新创建粒子
            this.createParticles();
        }
    }
    
    createParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            // 随机生成球面上的点
            const phi = Math.acos(Math.random() * 2 - 1);
            const theta = Math.random() * Math.PI * 2;
            
            const x = this.radius * Math.sin(phi) * Math.cos(theta);
            const y = this.radius * Math.sin(phi) * Math.sin(theta);
            const z = this.radius * Math.cos(phi);
            
            this.particles.push({
                x: x,
                y: y,
                z: z,
                originalX: x,
                originalY: y,
                originalZ: z,
                size: Math.random() * 1.0 + 0.5,
                opacity: Math.random() * 0.8 + 0.2
            });
        }
    }
    
    rotateParticles() {
        this.rotationY += this.rotationSpeed;
        
        for (let particle of this.particles) {
            // 保存原始坐标
            let x = particle.originalX;
            let y = particle.originalY;
            let z = particle.originalZ;
            
            // Y轴旋转
            let cosY = Math.cos(this.rotationY);
            let sinY = Math.sin(this.rotationY);
            let tempX = x * cosY - z * sinY;
            let tempZ = z * cosY + x * sinY;
            x = tempX;
            z = tempZ;
            
            // X轴旋转
            let cosX = Math.cos(this.rotationX);
            let sinX = Math.sin(this.rotationX);
            let tempY = y * cosX - z * sinX;
            let tempZ2 = z * cosX + y * sinX;
            y = tempY;
            z = tempZ2;
            
            // 更新粒子坐标
            particle.x = x;
            particle.y = y;
            particle.z = z;
        }
    }
    
    projectParticles() {
        for (let particle of this.particles) {
            // 3D到2D投影
            const scale = this.depth / (this.depth + particle.z);
            particle.screenX = this.centerX + particle.x * scale;
            particle.screenY = this.centerY + particle.y * scale;
            particle.screenSize = particle.size * scale;
            particle.screenOpacity = particle.opacity * (1 - (particle.z + this.radius) / (2 * this.radius) * 0.5);
        }
    }
    
    drawParticles() {
        // 如果地球不可见，不绘制粒子，只清空画布
        if (!this.isVisible) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 按Z坐标排序，确保正确的深度关系
        this.particles.sort((a, b) => b.z - a.z);
        
        this.ctx.fillStyle = '#000000ff';
        
        for (let particle of this.particles) {
            if (particle.screenSize > 0) {
                // 应用整体透明度和粒子自身透明度
                this.ctx.globalAlpha = particle.screenOpacity * this.alpha;
                this.ctx.beginPath();
                this.ctx.arc(particle.screenX, particle.screenY, particle.screenSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    animate() {
        // 逐渐增加透明度，实现渐显效果
        if (!this.isFadingOut && this.alpha < 1) {
            this.alpha += this.fadeSpeed;
            if (this.alpha > 1) {
                this.alpha = 1;
            }
        }
        
        // 地球放大、进入内部、完全穿过地球的效果
        if (this.isScaling) {
            // 持续放大地球
            this.radius += this.enterSpeed;
            
            // 持续减小深度，模拟摄像机向前移动，完全穿过地球
            this.depth += this.depthDirection * this.enterSpeed * 2;
            
            // 到达足够深度后，结束缩放效果并隐藏地球
            if (this.depth <= -200) { // 足够深的负值，表示完全穿过地球
                this.isScaling = false;
                // 设置alpha为0，让地球完全隐藏
                this.alpha = 0;
                // 设置isVisible为false，停止渲染地球
                this.isVisible = false;
            }
        }
        
        this.rotateParticles();
        this.projectParticles();
        this.drawParticles();
        
        requestAnimationFrame(() => this.animate());
    }
    
    // 开始地球放大和进入内部效果
    startScaling() {
        this.isScaling = true;
        this.isEntering = true; // 正在进入地球内部
        this.isExiting = false; // 尚未推出地球
        this.scaleDirection = 1; // 放大方向
        this.depthDirection = -1; // 深度变化方向（负表示进入）
        this.enterSpeed = 5; // 进入速度
        this.exitSpeed = 3; // 退出速度
        this.enterDepth = 50; // 进入地球内部的最小深度
        this.exitDepth = 800; // 退出地球后的深度
        this.isVisible = true; // 地球是否可见
    }
    
    // 开始地球消失效果
    startFadingOut() {
        this.isFadingOut = true;
    }
}

// 全局变量
let earthInstance;
let currentText = '- ACCESS PERMISSION REQUIRED -';
let newTextLines = ['- PERMISSION CONFIRMED -', '- WELCOME -'];

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    // 初始化3D地球
    earthInstance = new ParticleEarth();
    
    // 初始化文字动画
    initTextAnimation();
});

// 文字逐个出现并向左推的动画
function initTextAnimation() {
    const textElement = document.getElementById('animated-text');
    
    // 清空现有内容
    textElement.innerHTML = '';
    textElement.style.display = 'flex';
    textElement.style.flexDirection = 'column';
    textElement.style.alignItems = 'center';
    
    // 创建文字容器
    const textContainer = document.createElement('div');
    textElement.appendChild(textContainer);
    
    // 将文字拆分成单个字符，并创建span标签
    for (let i = 0; i < currentText.length; i++) {
        const charSpan = document.createElement('span');
        charSpan.className = 'char';
        const char = currentText[i];
        
        // 特殊处理空格字符，确保它们能正常显示
        if (char === ' ') {
            charSpan.textContent = ' ';
            charSpan.style.width = '1em'; // 设置空格的宽度
            charSpan.style.display = 'inline-block';
        } else {
            charSpan.textContent = char;
        }
        
        textContainer.appendChild(charSpan);
    }
    
    // 创建线条元素并添加到textElement中，提前为线条预留空间
    // 这确保文字出现时就为线条预留了位置，避免后续布局变化导致文字跳动
    const lineElement = document.createElement('div');
    lineElement.className = 'first-line';
    textElement.appendChild(lineElement);
    
    // 逐个显示字符，每个字符延迟出现
    const chars = document.querySelectorAll('.char');
    chars.forEach((char, index) => {
        setTimeout(() => {
            char.classList.add('appear');
        }, 1000 + index * 50); // 1秒后开始，每个字符间隔50ms
    });
    
    // 所有字符出现后，设置线条宽度并添加闪烁效果
    // 计算最后一个字符出现的准确时间：1000ms + (字符数量-1) * 50ms
    // 因为第一个字符在1000ms出现，每个后续字符间隔50ms
    const lastCharAppearTime = 1000 + (chars.length - 1) * 50;
    
    setTimeout(() => {
        // 设置线条宽度与文字宽度一致
        const textWidth = textContainer.offsetWidth;
        lineElement.style.width = textWidth + 'px';
        
        // 添加鼠标事件监听
        textContainer.addEventListener('mouseenter', () => {
            lineElement.classList.add('grow');
        });
        
        textContainer.addEventListener('mouseleave', () => {
            lineElement.classList.remove('grow');
            lineElement.classList.add('disappear');
            
            // 动画结束后重置状态
            setTimeout(() => {
                lineElement.classList.remove('disappear');
            }, 500);
        });
        
        // 添加闪烁效果
        textContainer.classList.add('blink-text');
    }, lastCharAppearTime + 0); // 最后一个字符出现后立即执行，延迟0ms
    
    // 添加点击事件监听
    textElement.addEventListener('click', handleTextClick);
}

// 点击文字后的处理函数
function handleTextClick() {
    const textElement = document.getElementById('animated-text');
    const chars = document.querySelectorAll('.char');
    
    // 防止重复点击
    textElement.removeEventListener('click', handleTextClick);
    
    // 移除闪烁效果
    const textContainer = textElement.querySelector('div');
    if (textContainer) {
        textContainer.classList.remove('blink-text');
    }
    
    // 找到线条元素并播放消失动画
    const lineElement = textElement.querySelector('.first-line');
    if (lineElement) {
        // 播放线条消失动画
        lineElement.classList.remove('grow');
        lineElement.classList.add('disappear');
        
        // 等待线条消失动画完成（500ms）后再开始文字消失动画
        setTimeout(() => {
            // 文字逐个消失并整体右移
            chars.forEach((char, index) => {
                setTimeout(() => {
                    char.classList.add('disappear');
                }, index * 50); // 每个字符间隔50ms消失
            });
            
            // 文字消失后，开始地球放大和进入内部效果
            // 计算文字完全消失的准确时间：(字符数量-1) * 50ms
            const textDisappearTime = (chars.length - 1) * 50;
            
            setTimeout(() => {
                earthInstance.startScaling();
                // 移除线条元素
                if (lineElement && lineElement.parentNode) {
                    lineElement.remove();
                }
            }, textDisappearTime + 500); // 文字完全消失后延迟500ms
            
            // 地球完全穿过之后，先执行进度线条动画，然后再显示新文字
            setTimeout(() => {
                // 显示进度线条动画
                showProgressAnimation(() => {
                    // 进度线条动画结束后，显示新文字
                    showNewText();
                });
            }, chars.length * 80 + 3500); // 地球完全穿过之后执行进度线条动画
        }, 500); // 等待线条消失动画完成
    }
}

// 显示进度线条动画
function showProgressAnimation(callback) {
    // 创建进度线条容器
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    document.body.appendChild(progressContainer);
    
    // 创建左侧线条
    const leftLine = document.createElement('div');
    leftLine.className = 'progress-line left';
    progressContainer.appendChild(leftLine);
    
    // 创建右侧线条
    const rightLine = document.createElement('div');
    rightLine.className = 'progress-line right';
    progressContainer.appendChild(rightLine);
    
    // 创建百分比文字
    const percentageElement = document.createElement('div');
    percentageElement.className = 'percentage-text';
    percentageElement.textContent = '0%';
    document.body.appendChild(percentageElement);
    
    // 显示百分比文字
    percentageElement.classList.add('visible');
    
    // 动画参数
    const totalProgress = 100;
    let currentProgress = 0;
    const duration = 4000; // 总动画时间（毫秒）
    const startTime = Date.now();
    
    // 动画更新函数
    function updateAnimation() {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        
        // 计算当前进度
        if (elapsed >= duration) {
            currentProgress = totalProgress;
        } else {
            currentProgress = (elapsed / duration) * totalProgress;
        }
        
        // 更新百分比文字
        percentageElement.textContent = Math.round(currentProgress) + '%';
        
        // 更新线条宽度
        const lineWidth = (currentProgress / 2) + '%';
        leftLine.style.width = lineWidth;
        rightLine.style.width = lineWidth;
        
        // 检查动画是否完成
        if (currentProgress >= totalProgress) {
            // 移除进度线条和百分比文字
            setTimeout(() => {
                percentageElement.classList.remove('visible');
                setTimeout(() => {
                    document.body.removeChild(progressContainer);
                    document.body.removeChild(percentageElement);
                    // 调用回调函数，显示第二段文字
                    callback();
                }, 300);
            }, 300);
        } else {
            // 继续动画
            requestAnimationFrame(updateAnimation);
        }
    }
    
    // 开始动画
    requestAnimationFrame(updateAnimation);
}

// 显示新文字
function showNewText() {
    const textElement = document.getElementById('animated-text');
    
    // 清空现有内容
    textElement.innerHTML = '';
    textElement.style.display = 'flex';
    textElement.style.flexDirection = 'column';
    textElement.style.alignItems = 'center';
    
    let allChars = [];
    let totalDelay = 0;
    
    // 创建两行文字
    newTextLines.forEach((line, lineIndex) => {
        // 创建行容器
        const lineContainer = document.createElement('div');
        lineContainer.className = 'text-line';
        lineContainer.style.marginBottom = '10px';
        textElement.appendChild(lineContainer);
        
        // 将每行文字拆分成单个字符，并创建span标签
        for (let i = 0; i < line.length; i++) {
            const charSpan = document.createElement('span');
            charSpan.className = 'char';
            const char = line[i];
            
            // 特殊处理空格字符，确保它们能正常显示
            if (char === ' ') {
                charSpan.textContent = ' ';
                charSpan.style.width = '1em'; // 设置空格的宽度
                charSpan.style.display = 'inline-block';
            } else {
                charSpan.textContent = char;
            }
            
            lineContainer.appendChild(charSpan);
            allChars.push(charSpan);
        }
    });
    
    // 逐个显示所有字符，第一行完全显示后再显示第二行
    const firstLineChars = allChars.slice(0, newTextLines[0].length);
    const secondLineChars = allChars.slice(newTextLines[0].length);
    
    // 显示第一行
    firstLineChars.forEach((char, index) => {
        setTimeout(() => {
            char.classList.add('appear');
        }, index * 80); // 每个字符间隔80ms出现
    });
    
    // 计算第一行完全显示的准确时间：(字符数量-1) * 80ms
    const firstLineCompleteTime = (firstLineChars.length - 1) * 80;
    
    // 第一行显示完成后，显示第二行
    secondLineChars.forEach((char, index) => {
        setTimeout(() => {
            char.classList.add('appear');
        }, firstLineCompleteTime + 500 + index * 80); // 第一行显示完成后延迟500ms开始显示第二行
    });
    
    // 获取第二行文字容器（WELCOME所在的行）
    const secondLineContainer = textElement.querySelector('.text-line:last-child');
    
    // 创建线条元素
    const lineElement = document.createElement('div');
    lineElement.className = 'welcome-line';
    secondLineContainer.appendChild(lineElement);
    
    // 计算两行文字都显示完成的准确时间
    const totalAppearDelay = firstLineCompleteTime + 500 + (secondLineChars.length - 1) * 80;
    
    // 文字完全显示后，开始线条的循环生长动画并添加点击事件
    setTimeout(() => {
        // 开始线条的循环生长动画
        lineElement.classList.add('grow');
        
        // 添加点击事件
        textElement.addEventListener('click', handleNewTextClick);
    }, totalAppearDelay);
    
    // 新文字点击处理函数
    function handleNewTextClick() {
        // 移除点击事件，防止重复点击
        textElement.removeEventListener('click', handleNewTextClick);
        
        // 直接隐藏文字和线条，不再等待线条消失动画
        textElement.style.opacity = '0';
        textElement.style.pointerEvents = 'none';
        lineElement.style.opacity = '0';
        
        // 立即创建圆形元素，添加到body中，避免center-text容器的样式限制
        const circleElement = document.createElement('div');
        circleElement.id = 'transition-circle';
        
        // 设置圆形元素的初始样式
        circleElement.style.position = 'fixed'; // 使用fixed定位，不受父容器限制
        circleElement.style.left = '50%';
        circleElement.style.top = '50%';
        circleElement.style.transform = 'translate(-50%, -50%)';
        circleElement.style.width = '0';
        circleElement.style.height = '0';
        circleElement.style.backgroundColor = 'transparent';
        circleElement.style.border = '1px solid rgba(0, 0, 0, 0.2)';
        circleElement.style.borderRadius = '50%';
        circleElement.style.zIndex = '9999';
        circleElement.style.display = 'block';
        circleElement.style.overflow = 'visible';
        
        // 添加到body中，确保全屏可见
        document.body.appendChild(circleElement);
        
        // 强制浏览器重排，确保动画能正确触发
        circleElement.offsetHeight;
        
        // 执行文字旋转变形为圆形的动画：从0到400px，旋转720度
        circleElement.style.transition = 'all 1s ease';
        circleElement.style.width = '400px';
        circleElement.style.height = '400px';
        circleElement.style.transform = 'translate(-50%, -50%) rotate(720deg)';
        
        // 1秒后开始圆形移动到shape-1位置的动画
        setTimeout(() => {
            // 立即显示主页面，但隐藏shape-1
            const mainPage = document.getElementById('mainPage');
            mainPage.style.display = 'block';
            
            // 隐藏主页面中的shape-1，准备由圆形取代
            const shape1 = mainPage.querySelector('.shape-1');
            if (shape1) {
                shape1.style.opacity = '0';
                shape1.style.pointerEvents = 'none';
            }
            
            // 执行圆形缩小移动动画：缩小到200px，移动到shape-1位置，再旋转360度，不消失
            circleElement.style.transition = 'all 1.5s ease';
            circleElement.style.width = '200px';
            circleElement.style.height = '200px';
            // 设置与shape-1完全一致的位置：top: 30%; left: 25%;
            circleElement.style.left = '25%';
            circleElement.style.top = '30%';
            circleElement.style.transform = 'translate(0, 0) rotate(1080deg)';
            circleElement.style.opacity = '1'; // 保持不消失
            
            // 圆形移动的同时，加载主界面除shape-1以外的所有元素
            // 触发从中间向两边扩大的动画
            setTimeout(() => {
                // 为背景几何形状添加动画类（跳过shape-1）
                const geometryElements = mainPage.querySelectorAll('.geometry:not(.shape-1)');
                geometryElements.forEach((element, index) => {
                    // 为每个几何形状添加延迟，创建层次感
                    setTimeout(() => {
                        element.classList.add('fade-in-expand');
                    }, index * 50);
                });
                
                // 为内容添加动画类
                const mainContent = mainPage.querySelector('.main-content');
                setTimeout(() => {
                    mainContent.classList.add('fade-in-expand');
                    
                    // 为框添加动画类，在内容出现后延迟显示
                    const boxes = mainPage.querySelectorAll('.box');
                    boxes.forEach((box, index) => {
                        setTimeout(() => {
                            box.classList.add('fade-in-expand');
                        }, index * 30 + 100); // 每个框间隔30ms，整体延迟100ms
                    });
                }, geometryElements.length * 50);
            }, 100); // 小延迟确保页面已显示
            
            // 1.5秒后，动画完成，隐藏canvas和文字元素
            setTimeout(() => {
                // 隐藏canvas和文字元素
                const earthCanvas = document.getElementById('earthCanvas');
                const centerText = document.querySelector('.center-text');
                earthCanvas.style.display = 'none';
                centerText.style.display = 'none';
                
                // 调整圆形的z-index，确保它正确融入主页面
                circleElement.style.zIndex = '1'; // 与其他geometry元素一致
                
                // 可以选择将圆形移动到mainPage中，使其成为主页面的一部分
                const backgroundLayer = mainPage.querySelector('.background-layer');
                if (backgroundLayer) {
                    backgroundLayer.appendChild(circleElement);
                }
            }, 1500); // 圆形移动动画持续1.5秒
        }, 1000); // 文字旋转变形动画持续1秒
    }
}