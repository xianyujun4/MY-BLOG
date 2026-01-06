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
        
        // 鼠标拖动相关变量
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.dragSpeed = 0.005;
        
        // 线条相关变量
        this.lineCount = window.innerWidth < 768 ? 1000 : 2000; // 增加线条数量，提高可见性
        this.maxLineDistance = 60; // 增加最大线条长度，使更多线条可见
        this.lineOpacity = 0.5; // 增加线条透明度
        this.lineWidth = 0.8; // 增加线条宽度
        this.lineColor = '#000000ff'; // 连接线使用黑色
        
        // 粒子出现相关变量
        this.isEmitting = true; // 是否正在出现粒子
        this.emissionProgress = 0; // 出现进度，0-1
        this.emissionSpeed = 0.0025; // 出现速度，加速5倍
        
        // 连接线条动画变量
        this.isConnecting = false; // 是否正在连接线条
        this.connectionProgress = 0; // 连接进度，0-1
        this.connectionSpeed = 0.01; // 连接速度
        this.connections = []; // 存储连接信息
        this.connectedPairs = new Set(); // 已连接的粒子对，避免重复连接
        
        this.init();
        this.animate();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.setupMouseEvents();
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
        
        // 生成所有粒子
        for (let i = 0; i < this.particleCount; i++) {
            // 随机生成球面上的点（目标位置）
            const phi = Math.acos(Math.random() * 2 - 1);
            const theta = Math.random() * Math.PI * 2;
            
            const x = this.radius * Math.sin(phi) * Math.cos(theta);
            const y = this.radius * Math.sin(phi) * Math.sin(theta);
            const z = this.radius * Math.cos(phi);
            
            this.particles.push({
                // 当前位置，直接在目标位置
                x: x,
                y: y,
                z: z,
                // 目标位置
                targetX: x,
                targetY: y,
                targetZ: z,
                // 原始位置（目标位置）
                originalX: x,
                originalY: y,
                originalZ: z,
                size: Math.random() * 1.0 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                // 粒子可见性，初始不可见，用于逐步出现效果
                isVisible: false,
                // 粒子就绪状态，初始未就绪
                isReady: false,
                // 粒子出现进度，0-1
                appearProgress: 0,
                // 出现速度
                speed: Math.random() * 0.02 + 0.01
            });
        }
        
        // 按纬度从下而上排序粒子，从南极到北极
        // 南极的z坐标最小，北极的z坐标最大，所以按z坐标从小到大排序
        this.particles.sort((a, b) => a.targetZ - b.targetZ);
    }
    
    rotateParticles() {
        // 只有在不拖动时才自动旋转
        if (!this.isDragging) {
            this.rotationY += this.rotationSpeed;
        }
        
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
    
    // 设置鼠标事件监听
    setupMouseEvents() {
        // 鼠标按下事件
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        // 鼠标移动事件
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                // 根据鼠标移动距离调整旋转角度
                this.rotationY += deltaX * this.dragSpeed;
                this.rotationX += deltaY * this.dragSpeed;
                
                // 更新上次鼠标位置
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });
        
        // 鼠标释放事件
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        // 鼠标离开画布事件
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
        
        // 触摸事件支持（移动端）
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.isDragging = true;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isDragging && e.touches.length > 0) {
                const deltaX = e.touches[0].clientX - this.lastMouseX;
                const deltaY = e.touches[0].clientY - this.lastMouseY;
                
                this.rotationY += deltaX * this.dragSpeed;
                this.rotationX += deltaY * this.dragSpeed;
                
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            }
        });
        
        this.canvas.addEventListener('touchend', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('touchcancel', () => {
            this.isDragging = false;
        });
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
        
        // 1. 绘制连接线条动画（从两点同时出发，在中间交汇）
        if (this.isConnecting) {
            this.ctx.strokeStyle = this.lineColor;
            this.ctx.lineWidth = this.lineWidth;
            
            for (let connection of this.connections) {
                const p1 = connection.p1;
                const p2 = connection.p2;
                
                if (p1.isVisible && p2.isVisible && p1.screenSize > 0 && p2.screenSize > 0) {
                    // 计算连接线条的透明度
                    const avgOpacity = (p1.screenOpacity + p2.screenOpacity) / 2 * this.alpha * this.lineOpacity;
                    this.ctx.globalAlpha = avgOpacity;
                    
                    // 计算两点之间的中间点
                    const midX = (p1.screenX + p2.screenX) / 2;
                    const midY = (p1.screenY + p2.screenY) / 2;
                    
                    // 计算从p1到mid的进度
                    const progress1 = Math.min(this.connectionProgress * 2, 1);
                    // 计算从p2到mid的进度
                    const progress2 = Math.min((this.connectionProgress - 0.5) * 2, 1);
                    
                    // 绘制从p1出发的线条
                    const endX1 = p1.screenX + (midX - p1.screenX) * progress1;
                    const endY1 = p1.screenY + (midY - p1.screenY) * progress1;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.screenX, p1.screenY);
                    this.ctx.lineTo(endX1, endY1);
                    this.ctx.stroke();
                    
                    // 绘制从p2出发的线条，当进度超过0.5时开始
                    if (this.connectionProgress > 0.5) {
                        const endX2 = p2.screenX + (midX - p2.screenX) * progress2;
                        const endY2 = p2.screenY + (midY - p2.screenY) * progress2;
                        
                        this.ctx.beginPath();
                        this.ctx.moveTo(p2.screenX, p2.screenY);
                        this.ctx.lineTo(endX2, endY2);
                        this.ctx.stroke();
                    }
                }
            }
        }
        
        // 2. 绘制已连接的固定线条
        if (!this.isConnecting && this.connectionProgress >= 1) {
            this.ctx.strokeStyle = this.lineColor;
            this.ctx.lineWidth = this.lineWidth;
            
            for (let connection of this.connections) {
                const p1 = connection.p1;
                const p2 = connection.p2;
                
                if (p1.isVisible && p2.isVisible && p1.screenSize > 0 && p2.screenSize > 0) {
                    // 计算连接线条的透明度
                    const avgOpacity = (p1.screenOpacity + p2.screenOpacity) / 2 * this.alpha * this.lineOpacity;
                    this.ctx.globalAlpha = avgOpacity;
                    
                    // 绘制完整的连接线
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.screenX, p1.screenY);
                    this.ctx.lineTo(p2.screenX, p2.screenY);
                    this.ctx.stroke();
                }
            }
        }
        
        // 3. 绘制粒子（在所有线条之上）
        this.ctx.fillStyle = '#000000ff';
        
        for (let particle of this.particles) {
            // 只绘制可见的粒子
            if (particle.isVisible && particle.screenSize > 0) {
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
                
                // 地球完全消失，触发回调函数
                if (this.onEarthDisappeared) {
                    this.onEarthDisappeared();
                    // 清空回调，避免重复触发
                    this.onEarthDisappeared = null;
                }
            }
        }
        
        // 粒子逐步出现动画
        if (this.isEmitting) {
            // 更新发射进度
            this.emissionProgress += this.emissionSpeed;
            
            // 确保发射进度不超过1
            if (this.emissionProgress > 1) {
                this.emissionProgress = 1;
            }
            
            // 处理所有粒子，让每个粒子根据发射进度逐步出现
            for (let i = 0; i < this.particles.length; i++) {
                const particle = this.particles[i];
                
                // 计算该粒子的触发阈值，基于其索引，实现从下到上的出现顺序
                const particleThreshold = i / this.particles.length;
                
                // 如果当前发射进度超过该粒子的触发阈值，该粒子开始出现
                if (this.emissionProgress >= particleThreshold) {
                    // 根据发射进度计算该粒子的出现进度
                    // 当emissionProgress == particleThreshold时，出现进度为0
                    // 当emissionProgress == 1时，出现进度为1
                    const progress = Math.min(1, (this.emissionProgress - particleThreshold) / (1 - particleThreshold));
                    
                    // 直接设置粒子的出现进度，确保与发射进度同步
                    particle.appearProgress = progress;
                    
                    // 当出现进度达到1时，标记粒子为就绪状态
                    if (progress >= 1) {
                        particle.isReady = true;
                        particle.isVisible = true;
                    } else {
                        // 根据出现进度决定粒子可见性，当进度超过0.5时显示
                        if (progress > 0.5) {
                            particle.isVisible = true;
                        } else {
                            particle.isVisible = false;
                        }
                    }
                } else {
                    // 未达到触发阈值，粒子不可见
                    particle.isVisible = false;
                    particle.appearProgress = 0;
                }
            }
            
            // 如果发射进度达到1，结束发射动画
            if (this.emissionProgress >= 1) {
                this.isEmitting = false;
                // 确保所有粒子都可见和就绪
                this.particles.forEach(particle => {
                    particle.isVisible = true;
                    particle.isReady = true;
                    particle.appearProgress = 1;
                });
                // 开始连接线条动画
                this.isConnecting = true;
                // 生成连接对
                this.generateConnections();
            }
        }
        
        // 连接线条动画
        if (this.isConnecting) {
            // 更新连接进度
            this.connectionProgress += this.connectionSpeed;
            
            // 如果连接进度超过1，结束连接并触发文字动画
            if (this.connectionProgress >= 1) {
                this.connectionProgress = 1;
                this.isConnecting = false;
                
                // 连接线条动画完成，触发文字动画
                setTimeout(() => {
                    startTextAnimation();
                }, 500); // 延迟500ms，让连接线条稳定显示后再开始文字动画
            }
        }
        
        this.rotateParticles();
        this.projectParticles();
        this.drawParticles();
        
        requestAnimationFrame(() => this.animate());
    }
    
    // 生成粒子连接对
    generateConnections() {
        this.connections = [];
        this.connectedPairs.clear();
        
        // 为每个可见粒子找到最近的可见邻居并生成连接
        for (let i = 0; i < this.particles.length; i += Math.floor(this.particles.length / this.lineCount)) {
            const p1 = this.particles[i];
            
            // 只处理可见的粒子
            if (p1.isVisible && p1.screenSize > 0) {
                let closestDistance = Infinity;
                let closestParticle = null;
                let closestIndex = -1;
                
                // 查找最近的可见粒子
                for (let j = 0; j < this.particles.length; j++) {
                    if (i !== j) {
                        const p2 = this.particles[j];
                        
                        // 只处理可见的粒子
                        if (p2.isVisible && p2.screenSize > 0) {
                            const dx = p1.x - p2.x;
                            const dy = p1.y - p2.y;
                            const dz = p1.z - p2.z;
                            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                            
                            // 生成唯一的连接ID，避免重复
                            const pairId1 = `${i}-${j}`;
                            const pairId2 = `${j}-${i}`;
                            
                            if (distance < closestDistance && distance < this.maxLineDistance && 
                                !this.connectedPairs.has(pairId1) && !this.connectedPairs.has(pairId2)) {
                                closestDistance = distance;
                                closestParticle = p2;
                                closestIndex = j;
                            }
                        }
                    }
                }
                
                // 如果找到了最近的粒子，添加连接
                if (closestParticle) {
                    const pairId = `${i}-${closestIndex}`;
                    this.connectedPairs.add(pairId);
                    
                    this.connections.push({
                        p1: p1,
                        p2: closestParticle,
                        distance: closestDistance,
                        startX: p1.screenX,
                        startY: p1.screenY,
                        endX: closestParticle.screenX,
                        endY: closestParticle.screenY
                    });
                }
            }
        }
    }
    
    // 缓动函数：先加速后减速
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    // 开始地球放大和进入内部效果
    startScaling(callback) {
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
        
        // 保存回调函数，在地球完全消失时触发
        this.onEarthDisappeared = callback;
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
    
    // 文字动画将在扫描和连接线条动画完成后通过回调触发
});

// 当扫描和连接线条动画完成后，调用此函数触发文字动画
function startTextAnimation() {
    initTextAnimation();
}

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
                // 将showProgressAnimation作为回调函数传递给startScaling
                // 这样地球完全消失后才会触发进度条动画
                earthInstance.startScaling(() => {
                    // 地球完全消失，开始进度线条动画
                    showProgressAnimation((diamond) => {
                        // 进度线条动画结束后，显示新文字
                        showNewText(diamond);
                    });
                });
                
                // 移除线条元素
                if (lineElement && lineElement.parentNode) {
                    lineElement.remove();
                }
            }, textDisappearTime + 500); // 文字完全消失后延迟500ms
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
    // 先设置样式，再添加到容器
    percentageElement.style.position = 'absolute';
    percentageElement.style.top = '50%';
    percentageElement.style.left = '50%';
    percentageElement.style.transform = 'translate(-50%, -150%)';
    percentageElement.style.zIndex = '5';
    percentageElement.style.fontSize = '2rem';
    percentageElement.style.fontWeight = '700';
    percentageElement.style.color = '#333333';
    percentageElement.style.fontFamily = 'Courier New, monospace';
    percentageElement.style.opacity = '0';
    percentageElement.style.transition = 'opacity 0.3s ease';
    percentageElement.style.pointerEvents = 'none';
    document.body.appendChild(percentageElement);
    
    // 创建空心正菱形
    const diamond = document.createElement('div');
    diamond.className = 'diamond';
    document.body.appendChild(diamond);
    
    // 显示百分比文字和菱形
    setTimeout(() => {
        percentageElement.style.opacity = '1';
        diamond.classList.add('visible');
    }, 100); // 延迟100ms显示，确保元素已添加到DOM
    
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
        
        // 更新百分比文字内容
        percentageElement.textContent = Math.round(currentProgress) + '%';
        
        // 更新线条宽度，移除过渡效果，让进度条实时更新
        const lineWidth = (currentProgress / 2) + '%';
        leftLine.style.transition = 'none'; // 移除过渡效果
        rightLine.style.transition = 'none'; // 移除过渡效果
        leftLine.style.width = lineWidth;
        rightLine.style.width = lineWidth;
        
        // 检查动画是否完成（进度条完全闭合）
        if (currentProgress >= totalProgress) {
            // 进度条完全闭合，立即移除进度条线和数字
            // 隐藏百分比数字
            percentageElement.style.opacity = '0';
            
            // 立即移除进度条容器（包含左右线条）
            if (progressContainer.parentNode) {
                progressContainer.parentNode.removeChild(progressContainer);
            }
            
            // 1. 触发主菱形放大动画
            diamond.classList.add('expand');
            
            // 3. 菱形放大动画完成后（1秒后），移除部分元素，保留主菱形
            setTimeout(() => {
                // 移除百分比文字元素
                if (percentageElement.parentNode) {
                    percentageElement.parentNode.removeChild(percentageElement);
                }
                
                // 调用回调函数，显示第二段文字
                callback(diamond);
            }, 1000); // 等待菱形放大动画完成
        } else {
            // 继续动画
            requestAnimationFrame(updateAnimation);
        }
    }
    
    // 移除了createRippleEffects函数，不再需要创建涟漪效果
    
    // 开始动画
    requestAnimationFrame(updateAnimation);
}

// 显示新文字
function showNewText(diamond) {
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
        
        // 菱形消失动画 - 继续扩大直到看不见
        if (diamond) {
            // 先移除expand类，再添加disappear类，确保消失动画能正确触发
            diamond.classList.remove('expand');
            diamond.classList.add('disappear');
        }
        
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
        
        // 1秒后移除菱形元素
        setTimeout(() => {
            // 确保diamond元素存在并且有父节点
            if (diamond && diamond.parentNode) {
                diamond.parentNode.removeChild(diamond);
            }
        }, 1000);
        
        // 立即清除所有涟漪效果，包括通过JavaScript动态创建的
        const ripples = document.querySelectorAll('.diamond-ripple, [style*="animationName: diamondRipple"]');
        ripples.forEach(ripple => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        });
        
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
                        
                        // 文字保持静态显示，不需要自动淡入动画
                    }, index * 30 + 100); // 每个框间隔30ms，整体延迟100ms
                });
                
                // 解析网易云音乐链接，提取songId
        const extractSongId = (link) => {
            const match = link.match(/id=(\d+)/);
            return match ? match[1] : null;
        };
        
        // 检测设备类型
        const getDeviceType = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent)) {
                return 'mobile';
            }
            return 'pc';
        };
        
        // 尝试唤起网易云音乐APP，失败则跳转网页
        window.openNetEaseMusic = (link) => {
            const songId = extractSongId(link);
            if (!songId) {
                // 如果无法解析songId，直接跳转原链接
                window.open(link, '_blank');
                return;
            }
            
            const deviceType = getDeviceType();
            const webUrl = `https://music.163.com/song?id=${songId}`;
            
            if (deviceType === 'mobile') {
                // 移动端尝试唤起APP
                const appUrl = `neteasecloudmusic://song/${songId}`;
                
                // 尝试唤起APP
                window.location.href = appUrl;
                
                // 检测是否成功唤起，失败则跳转到网页
                let isAppOpened = false;
                
                // 监听页面可见性变化
                const handleVisibilityChange = () => {
                    if (document.hidden) {
                        isAppOpened = true;
                    }
                };
                
                document.addEventListener('visibilitychange', handleVisibilityChange);
                
                // 500ms 后检查是否成功唤起
                setTimeout(() => {
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                    if (!isAppOpened) {
                        window.open(webUrl, '_blank');
                    }
                }, 500);
            } else {
                // PC 端直接跳转网页
                window.open(webUrl, '_blank');
            }
        };
        
        // 为所有框添加点击事件监听
        boxes.forEach((box, index) => {
            box.addEventListener('click', () => {
                // 获取框的当前位置和尺寸
                const rect = box.getBoundingClientRect();
                
                // 保存原框的样式，用于恢复
                const originalBorder = box.style.border;
                const originalBackground = box.style.background;
                const originalZIndex = box.style.zIndex;
                
                // 创建一个setTimeout数组，用于存储所有的setTimeout ID，便于在关闭时清除
                const timeouts = [];
                
                // 创建一个新的放大元素，而不是修改原元素
                const expandedBox = document.createElement('div');
                expandedBox.className = 'expanded-box';
                expandedBox._timeouts = timeouts; // 将timeouts数组附加到expandedBox上，便于在closeHandler中访问
                        
                        // 获取原框内的文字内容
                        const boxText = box.querySelector('.box-text');
                        if (boxText) {
                            // 隐藏原框内的文字
                            boxText.style.opacity = '0';
                            
                            // 如果是第一个或第二个框，显示模块化内容
                            if (index === 0 || index === 1) {
                                // 创建标题容器，包含左上角的线条和文字动画
                                const titleContainer = document.createElement('div');
                                titleContainer.style.position = 'absolute';
                                titleContainer.style.top = '50px';
                                titleContainer.style.left = '50px';
                                titleContainer.style.zIndex = '99999';
                                titleContainer.style.overflow = 'hidden';
                                
                                // 创建文字元素
                                const titleText = document.createElement('div');
                                titleText.className = 'new-text';
                                titleText.textContent = boxText.textContent;
                                titleText.style.fontFamily = 'Courier New, monospace';
                                titleText.style.fontSize = '2rem';
                                titleText.style.fontWeight = '700';
                                titleText.style.color = 'var(--text-color)';
                                titleText.style.textTransform = 'uppercase';
                                titleText.style.letterSpacing = '8px';
                                titleText.style.opacity = '0';
                                titleText.style.transform = 'translateX(-100%)';
                                titleText.style.transition = 'opacity 0.5s ease, transform 1s ease-out';
                                
                                // 创建线条元素
                                const line = document.createElement('div');
                                line.className = 'new-text-line first-line';
                                line.style.height = '2px';
                                line.style.backgroundColor = 'var(--text-color)';
                                line.style.width = '0';
                                line.style.marginBottom = '10px';
                                line.style.transformOrigin = 'left center';
                                line.style.transition = 'width 0.8s ease 1s'; // 延迟1秒开始，与文字飞入动画衔接
                                
                                // 组装标题元素
                                titleContainer.appendChild(line);
                                titleContainer.appendChild(titleText);
                                expandedBox.appendChild(titleContainer);
                                
                                // 触发标题和线条动画
                                timeouts.push(setTimeout(() => {
                                    // 设置动画时长为0.3秒
                                    titleText.style.transition = 'opacity 0.3s ease, transform 0.3s ease-out';
                                    line.style.transition = 'width 0.3s ease';
                                    
                                    // 同时触发文字飞入和线条生长动画
                                    titleText.style.opacity = '1';
                                    titleText.style.transform = 'translateX(0)';
                                    
                                    // 获取文字宽度并设置线条宽度
                                    timeouts.push(setTimeout(() => {
                                        const textWidth = titleText.offsetWidth;
                                        line.style.width = `${textWidth}px`;
                                    }, 300));
                                }, 600)); // 放大动画结束后开始（放大动画持续500ms）
                                
                                // 创建笔记容器
                                const notesContainer = document.createElement('div');
                                notesContainer.className = 'notes-container';
                                notesContainer.style.position = 'absolute';
                                notesContainer.style.top = '150px';
                                
                                // 根据盒子索引决定是否显示分类导航
                                let notesContainerLeft = '50px';
                                if (index === 1) {
                                    // 第二个盒子：分享，显示分类导航
                                    // 创建分类导航
                                    const categoryNav = document.createElement('div');
                                    categoryNav.className = 'category-nav';
                                    categoryNav.style.position = 'absolute';
                                    categoryNav.style.top = '150px';
                                    categoryNav.style.left = '50px';
                                    categoryNav.style.zIndex = '99999';
                                    categoryNav.style.marginBottom = '20px';
                                    categoryNav.style.display = 'flex';
                                    categoryNav.style.flexDirection = 'column';
                                    categoryNav.style.gap = '10px';
                                    
                                    // 创建分类链接
                                    const categories = ['全部', '音乐', '图片'];
                                    categories.forEach(category => {
                                        const categoryLink = document.createElement('a');
                                        categoryLink.href = '#';
                                        categoryLink.textContent = `> ${category}`;
                                        categoryLink.style.fontFamily = 'Courier New, monospace';
                                        categoryLink.style.fontSize = '0.9rem';
                                        categoryLink.style.color = 'var(--text-color)';
                                        categoryLink.style.textDecoration = 'none';
                                        categoryLink.style.transition = 'all 0.3s ease';
                                        categoryLink.style.cursor = 'pointer';
                                        categoryLink.style.opacity = '0';
                                        categoryLink.style.transform = 'translateX(-100%)';
                                        
                                        // 添加点击事件（暂时只是示例）
                                        categoryLink.addEventListener('click', (e) => {
                                            e.preventDefault();
                                            console.log(`点击了分类: ${category}`);
                                        });
                                        
                                        categoryNav.appendChild(categoryLink);
                                    });
                                    
                                    expandedBox.appendChild(categoryNav);
                                    
                                    // 设置笔记容器位置，为分类导航留出空间
                                    notesContainerLeft = '120px';
                                    
                                    // 添加分类导航的入场动画
                                    timeouts.push(setTimeout(() => {
                                        const categoryLinks = categoryNav.querySelectorAll('a');
                                        categoryLinks.forEach((link, linkIndex) => {
                                            timeouts.push(setTimeout(() => {
                                                link.style.transition = 'opacity 0.3s ease, transform 0.3s ease-out';
                                                link.style.opacity = '1';
                                                link.style.transform = 'translateX(0)';
                                            }, 300 + linkIndex * 100)); // 逐个显示，与标题动画衔接
                                        });
                                        
                                        // 为分类导航添加筛选功能
                                        categoryLinks.forEach(link => {
                                            link.addEventListener('click', (e) => {
                                                e.preventDefault();
                                                
                                                // 获取点击的分类
                                                const category = link.textContent.replace('> ', '').trim();
                                                
                                                // 获取所有分享卡片
                                                const shareCards = notesContainer.querySelectorAll('.note-card');
                                                
                                                // 筛选并显示/隐藏卡片
                                                shareCards.forEach(card => {
                                                    const cardType = card.querySelector('.share-type').textContent;
                                                    if (category === '全部' || cardType === category) {
                                                        // 显示符合条件的卡片
                                                        card.style.display = 'block';
                                                        // 重新触发动画
                                                        card.style.opacity = '0';
                                                        card.style.transform = 'translateY(20px)';
                                                        setTimeout(() => {
                                                            card.style.opacity = '1';
                                                            card.style.transform = 'translateY(0)';
                                                        }, 100);
                                                    } else {
                                                        // 隐藏不符合条件的卡片
                                                        card.style.display = 'none';
                                                    }
                                                });
                                            });
                                        });
                                    }, 600)); // 与标题动画同时开始
                                }
                                
                                // 设置笔记容器样式
                                notesContainer.style.left = notesContainerLeft;
                                notesContainer.style.right = '50px';
                                notesContainer.style.bottom = '50px';
                                notesContainer.style.zIndex = '99999';
                                notesContainer.style.overflow = 'auto';
                                
                                expandedBox.appendChild(notesContainer);
                                
                                // 保存原始的分享数据，用于分类筛选
                                let originalItems = [];
                                
                                // 根据盒子索引决定加载笔记还是分享内容
                                let contentPromise;
                                if (index === 0) {
                                    // 第一个盒子：加载笔记内容
                                    contentPromise = fetch('notes.json')
                                        .then(response => response.json());
                                } else {
                                    // 第二个盒子：分享
                                    // 从JSON文件读取分享内容
                                    contentPromise = fetch('share.json')
                                        .then(response => response.json());
                                }
                                 
                                contentPromise.then(items => {
                                    // 保存原始数据
                                    originalItems = [...items];
                                        // 按创建时间由近到远排序（最新的在前面）
                                        items.sort((a, b) => {
                                            // 转换'年-月-日-时:分'格式为ISO格式，便于Date对象解析
                                            const formatDate = (dateStr) => {
                                                // 处理格式：YYYY-MM-DD-HH:mm
                                                if (dateStr.includes('-') && dateStr.includes(':')) {
                                                    // 将YYYY-MM-DD-HH:mm转换为YYYY-MM-DDTHH:mm
                                                    return dateStr.replace(/-(\d{2}):(\d{2})$/, 'T$1:$2');
                                                } else if (dateStr.includes('-')) {
                                                    // 处理旧格式：YYYY-MM-DD
                                                    return dateStr;
                                                }
                                                return dateStr; // 保持其他格式不变
                                            };
                                            
                                            const dateA = new Date(formatDate(a.date));
                                            const dateB = new Date(formatDate(b.date));
                                            
                                            return dateB - dateA; // 最新的在前
                                        });
                                        
                                        // 渲染内容卡片
                                        items.forEach(item => {
                                            const noteCard = document.createElement('div');
                                            noteCard.className = 'note-card';
                                            noteCard.style.marginBottom = '30px';
                                            noteCard.style.padding = '20px';
                                            noteCard.style.border = '1px solid rgba(0, 0, 0, 0.1)';
                                            noteCard.style.borderRadius = '8px';
                                            noteCard.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                                            noteCard.style.backdropFilter = 'blur(1px)';
                                            noteCard.style.opacity = '0';
                                            noteCard.style.transform = 'translateY(20px)';
                                            noteCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                                            
                                            // 根据盒子索引决定渲染不同的卡片样式
                                            let cardContent;
                                            if (index === 0) {
                                                // 笔记卡片样式
                                                cardContent = `
                                                    <h3 class="note-title" style="font-family: 'Courier New', monospace; font-size: 1.2rem; font-weight: 700; color: var(--text-color); margin-bottom: 10px; line-height: 1.4;">${item.title}</h3>
                                                    <p class="note-content" style="font-family: 'Courier New', monospace; font-size: 0.9rem; color: #666; margin-bottom: 15px; line-height: 1.6;">${item.content}</p>
                                                    <div class="note-footer" style="display: flex; font-family: 'Courier New', monospace; font-size: 0.8rem; color: #999;">
                                                        <span class="note-date">${item.date}</span>
                                                    </div>
                                                `;
                                            } else {
                                                // 分享卡片样式
                                                cardContent = `
                                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                                        <h3 class="note-title" style="font-family: 'Courier New', monospace; font-size: 1.2rem; font-weight: 700; color: var(--text-color); line-height: 1.4;">${item.title}</h3>
                                                        <span class="share-type" style="font-family: 'Courier New', monospace; font-size: 0.8rem; color: var(--text-color); background-color: rgba(0, 0, 0, 0.05); padding: 4px 12px; border-radius: 12px; border: 1px solid rgba(0, 0, 0, 0.1);">${item.type}</span>
                                                    </div>
                                                    <p class="note-content" style="font-family: 'Courier New', monospace; font-size: 0.9rem; color: #666; margin-bottom: 15px; line-height: 1.6;">${item.description}</p>
                                                    <div class="note-footer" style="display: flex; font-family: 'Courier New', monospace; font-size: 0.8rem; color: #999;">
                                                        <span class="note-date">${item.date}</span>
                                                    </div>
                                                `;
                                            }
                                            
                                            noteCard.innerHTML = cardContent;
                                            
                                            notesContainer.appendChild(noteCard);
                                        });
                                        
                                        // 触发笔记卡片动画，逐个显示
                                        setTimeout(() => {
                                            const noteCards = notesContainer.querySelectorAll('.note-card');
                                            noteCards.forEach((card, cardIndex) => {
                                                timeouts.push(setTimeout(() => {
                                                    card.style.opacity = '1';
                                                    card.style.transform = 'translateY(0)';
                                                }, cardIndex * 200)); // 每个卡片间隔200ms出现
                                            });
                                            
                                            // 为每个卡片添加点击事件，展开详情页
                                            noteCards.forEach((card, cardIndex) => {
                                                card.addEventListener('click', () => {
                                                    const item = items[cardIndex];
                                                    
                                                    // 创建笔记详情容器
                                                    const noteDetailContainer = document.createElement('div');
                                                    noteDetailContainer.className = 'note-detail-container';
                                                    noteDetailContainer.style.position = 'fixed';
                                                    noteDetailContainer.style.top = '0';
                                                    noteDetailContainer.style.left = '0';
                                                    noteDetailContainer.style.width = '100%';
                                                    noteDetailContainer.style.height = '100%';
                                                    noteDetailContainer.style.backgroundColor = 'white';
                                                    noteDetailContainer.style.zIndex = '999999';
                                                    noteDetailContainer.style.overflow = 'auto';
                                                    noteDetailContainer.style.opacity = '0';
                                                    noteDetailContainer.style.transform = 'scale(0.95)';
                                                    noteDetailContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                                                    
                                                    // 设置详情页内容
                                                    let detailContent;
                                                    if (index === 0) {
                                                        // 笔记详情页
                                                        detailContent = `
                                                            <div style="max-width: 800px; margin: 80px auto; padding: 0 20px;">
                                                                <div style="margin-bottom: 40px;">
                                                                    <h1 style="font-family: 'Courier New', monospace; font-size: 2rem; font-weight: 700; color: var(--text-color); margin-bottom: 20px; line-height: 1.4;">${item.title}</h1>
                                                                    <div style="font-family: 'Courier New', monospace; font-size: 0.9rem; color: #999;">
                                                                        <span>${item.date}</span>
                                                                    </div>
                                                                </div>
                                                                <div style="border-top: 1px solid rgba(0, 0, 0, 0.1); padding-top: 30px;">
                                                                    <p style="font-family: 'Courier New', monospace; font-size: 1.1rem; color: #333; line-height: 1.8;">${item.content}</p>
                                                                </div>
                                                            </div>
                                                        `;
                                                    } else {
                                                        // 分享详情页
                                                        detailContent = `
                                                            <div style="max-width: 800px; margin: 80px auto; padding: 0 20px;">
                                                                <div style="margin-bottom: 20px;">
                                                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                                                        <h1 style="font-family: 'Courier New', monospace; font-size: 2rem; font-weight: 700; color: var(--text-color); line-height: 1.4;">${item.title}</h1>
                                                                        <span class="share-type" style="font-family: 'Courier New', monospace; font-size: 0.9rem; color: var(--text-color); background-color: rgba(0, 0, 0, 0.05); padding: 6px 16px; border-radius: 16px; border: 1px solid rgba(0, 0, 0, 0.1);">${item.type}</span>
                                                                    </div>
                                                                    <div style="display: flex; justify-content: space-between; font-family: 'Courier New', monospace; font-size: 0.9rem; color: #999;">
                                                                        <span>${item.date}</span>
                                                                        <a href="javascript:void(0);" onclick="openNetEaseMusic('${item.link}')" style="color: var(--text-color); text-decoration: none; padding: 0; transition: all 0.3s ease;">
                                                                            &gt;链接
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                                <div style="border-top: 1px solid rgba(0, 0, 0, 0.1); padding-top: 30px; margin-bottom: 40px;">
                                                                    <p style="font-family: 'Courier New', monospace; font-size: 1.1rem; color: #333; line-height: 1.8; margin-bottom: 30px;">${item.description}</p>
                                                                    <div style="display: flex; justify-content: center; margin-bottom: 30px;">
                                                                        <img src="${item.image}" alt="${item.title}" style="max-width: 100%; max-height: 500px; object-fit: contain; border-radius: 8px; border: 1px solid rgba(0, 0, 0, 0.1);">
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        `;
                                                    }
                                                    
                                                    noteDetailContainer.innerHTML = detailContent;
                                                    
                                                    document.body.appendChild(noteDetailContainer);
                                                    
                                                    // 触发动画
                                                    setTimeout(() => {
                                                        noteDetailContainer.style.opacity = '1';
                                                        noteDetailContainer.style.transform = 'scale(1)';
                                                    }, 10);
                                                    
                                                    // 点击空白处关闭
                                                    noteDetailContainer.addEventListener('click', (e) => {
                                                        if (e.target === noteDetailContainer) {
                                                            noteDetailContainer.style.opacity = '0';
                                                            noteDetailContainer.style.transform = 'scale(0.95)';
                                                            
                                                            setTimeout(() => {
                                                                document.body.removeChild(noteDetailContainer);
                                                            }, 500);
                                                        }
                                                    });
                                                    
                                                    // 添加点击任意位置关闭（除了内容区域）
                                                    const detailContentDiv = noteDetailContainer.querySelector('div');
                                                    detailContentDiv.addEventListener('click', (e) => {
                                                        e.stopPropagation(); // 阻止事件冒泡到容器
                                                    });
                                                    
                                                    // 保存全局ESC事件监听器引用，用于临时移除和恢复
                                                    let globalEscKeyHandler = null;
                                                    
                                                    // 获取并保存预览页的ESC事件监听器
                                                    let previewEscKeyHandler = null;
                                                    
                                                    // 查找并保存预览页的ESC事件监听器
                                                    // 我们需要暂时移除预览页的ESC事件监听器，避免冲突
                                                    // 这里我们使用一个技巧：先移除所有ESC事件监听器，然后只添加我们自己的
                                                    const originalAddEventListener = document.addEventListener;
                                                    let allEscHandlers = [];
                                                    
                                                    // 暂时替换addEventListener，捕获所有ESC事件监听器
                                                    document.addEventListener = function(type, listener, options) {
                                                        if (type === 'keydown') {
                                                            allEscHandlers.push({ listener, options });
                                                        }
                                                        return originalAddEventListener.call(this, type, listener, options);
                                                    };
                                                    
                                                    // 添加 ESC 键关闭功能
                                                    const escKeyHandler = (e) => {
                                                        if (e.key === 'Escape') {
                                                            // 完全阻止事件传播和默认行为
                                                            e.stopPropagation();
                                                            e.stopImmediatePropagation();
                                                            e.preventDefault();
                                                            
                                                            noteDetailContainer.style.opacity = '0';
                                                            noteDetailContainer.style.transform = 'scale(0.95)';
                                                            
                                                            setTimeout(() => {
                                                                // 移除详情页的ESC事件监听器
                                                                document.removeEventListener('keydown', escKeyHandler, true);
                                                                
                                                                // 重新添加所有原来的ESC事件监听器
                                                                allEscHandlers.forEach(({ listener, options }) => {
                                                                    originalAddEventListener.call(document, 'keydown', listener, options);
                                                                });
                                                                
                                                                // 移除详情页元素
                                                                document.body.removeChild(noteDetailContainer);
                                                            }, 500);
                                                        }
                                                    };
                                                    
                                                    // 恢复原始的addEventListener方法
                                                    document.addEventListener = originalAddEventListener;
                                                    
                                                    // 移除所有现有的ESC事件监听器
                                                    allEscHandlers.forEach(({ listener, options }) => {
                                                        document.removeEventListener('keydown', listener, options);
                                                    });
                                                    
                                                    // 添加详情页的ESC事件监听器
                                                    document.addEventListener('keydown', escKeyHandler, true);
                                                    
                                                    // 确保移除事件监听器
                                                    const removeDetailContainer = () => {
                                                        // 移除详情页的ESC事件监听器
                                                        document.removeEventListener('keydown', escKeyHandler, true);
                                                        
                                                        // 重新添加所有原来的ESC事件监听器
                                                        allEscHandlers.forEach(({ listener, options }) => {
                                                            originalAddEventListener.call(document, 'keydown', listener, options);
                                                        });
                                                        
                                                        // 移除详情页元素
                                                        document.body.removeChild(noteDetailContainer);
                                                    };
                                                    
                                                    // 添加自动清理机制
                                                    noteDetailContainer.addEventListener('transitionend', (e) => {
                                                        if (e.propertyName === 'opacity' && noteDetailContainer.style.opacity === '0') {
                                                            removeDetailContainer();
                                                        }
                                                    });
                                                });
                                            });
                                        }, 1000); // 延迟1秒，让标题和线条动画先完成
                                    })
                                    .catch(error => {
                                        console.error('读取笔记数据失败:', error);
                                        // 显示错误信息
                                        const errorCard = document.createElement('div');
                                        errorCard.className = 'note-card';
                                        errorCard.style.marginBottom = '30px';
                                        errorCard.style.padding = '20px';
                                        errorCard.style.border = '1px solid rgba(0, 0, 0, 0.1)';
                                        errorCard.style.borderRadius = '8px';
                                        errorCard.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                                        errorCard.style.backdropFilter = 'blur(1px)';
                                        errorCard.style.opacity = '0';
                                        errorCard.style.transform = 'translateY(20px)';
                                        errorCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                                        
                                        errorCard.innerHTML = `
                                            <h3 class="note-title" style="font-family: 'Courier New', monospace; font-size: 1.2rem; font-weight: 700; color: var(--text-color); margin-bottom: 10px; line-height: 1.4;">读取笔记失败</h3>
                                            <p class="note-content" style="font-family: 'Courier New', monospace; font-size: 0.9rem; color: #666; margin-bottom: 15px; line-height: 1.6;">无法加载笔记数据，请检查notes.json文件是否存在且格式正确。</p>
                                            <div class="note-footer" style="display: flex; font-family: 'Courier New', monospace; font-size: 0.8rem; color: #999;">
                                                <span class="note-date">${new Date().toISOString().split('T')[0]}</span>
                                            </div>
                                        `;
                                        
                                        notesContainer.appendChild(errorCard);
                                        
                                        // 触发错误信息动画
                                        setTimeout(() => {
                                            errorCard.style.opacity = '1';
                                            errorCard.style.transform = 'translateY(0)';
                                        }, 1000);
                                    });
                            } else {
                                // 第四个框（关于）：特殊样式
                                if (index === 3) {
                                    // 创建新的文字容器
                                    const textContainer = document.createElement('div');
                                    textContainer.className = 'new-text-container';
                                    textContainer.style.position = 'absolute';
                                    textContainer.style.top = '50px'; // 与顶部保持间距
                                    textContainer.style.left = '50px'; // 与左部保持间距
                                    textContainer.style.zIndex = '99999';
                                    textContainer.style.overflow = 'hidden';
                                    
                                    // 创建新文字元素
                                    const newText = document.createElement('div');
                                    newText.className = 'new-text';
                                    newText.textContent = boxText.textContent;
                                    newText.style.fontFamily = 'Courier New, monospace';
                                    newText.style.fontSize = '2rem';
                                    newText.style.fontWeight = '700';
                                    newText.style.color = 'var(--text-color)';
                                    newText.style.textTransform = 'uppercase';
                                    newText.style.letterSpacing = '8px';
                                    newText.style.opacity = '0';
                                    newText.style.transform = 'translateX(-100%)';
                                    newText.style.transition = 'opacity 0.5s ease, transform 1s ease-out';
                                    
                                    // 组装文字元素
                                    textContainer.appendChild(newText);
                                    expandedBox.appendChild(textContainer);
                                    
                                    // 触发文字飞入动画
                                    timeouts.push(setTimeout(() => {
                                        newText.style.transition = 'opacity 0.3s ease, transform 0.3s ease-out';
                                        newText.style.opacity = '1';
                                        newText.style.transform = 'translateX(0)';
                                    }, 600));
                                    
                                    // 创建关于内容容器
                                    const aboutContainer = document.createElement('div');
                                    aboutContainer.className = 'about-container';
                                    aboutContainer.style.position = 'absolute';
                                    aboutContainer.style.top = '120px';
                                    aboutContainer.style.left = '50px';
                                    aboutContainer.style.right = '50px';
                                    aboutContainer.style.bottom = '50px';
                                    aboutContainer.style.zIndex = '99998';
                                    aboutContainer.style.overflow = 'auto';
                                    aboutContainer.style.fontFamily = 'Courier New, monospace';
                                    aboutContainer.style.opacity = '0';
                                    aboutContainer.style.transform = 'translateY(20px)';
                                    aboutContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                                    
                                    // 关于内容HTML
                                    aboutContainer.innerHTML = `
                                        <!-- 一言部分 -->
                                        <section class="hitokoto-section" style="margin-bottom: 60px; text-align: center;">
                                            <div class="hitokoto" style="font-size: 1.2rem; font-style: italic; color: #666; line-height: 1.8;">想用AB键去改变未来</div>
                                        </section>
                                        
                                        <!-- 灰色分割线 -->
                                        <div style="border-top: 1px solid rgba(0, 0, 0, 0.1); margin: 0 auto 60px; max-width: 800px;"></div>
                                        
                                        <!-- 简介部分 -->
                                        <section class="intro-section" style="margin-bottom: 60px; text-align: center;">
                                            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 30px; color: var(--text-color);">简介</h3>
                                            <div class="avatar-content" style="display: flex; justify-content: center; align-items: center; gap: 60px; margin-bottom: 40px; flex-wrap: wrap;">
                                                <!-- 左侧头像 -->
                                                <div class="avatar-container" style="flex-shrink: 0;">
                                                    <img src="https://p3-pc-sign.douyinpic.com/aweme-avatar/tos-cn-i-c9aec8xkvj_e2d3d20ddd4c4e3db22eb5d5bcc75b14~tplv-8yspqt5zfm-300x300.webp?lk3s=93de098e&x-expires=1767679200&x-signature=%2FcfKt%2B%2FMudHbRPtQZe9SG9xefe0%3D&from=2480802190&s=profile&se=false&sc=avatar&l=202601041431441732686B9F282B93D889" 
                                                        alt="头像" 
                                                        style="width: 200px; height: 200px; border-radius: 8px; object-fit: cover; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);">
                                                </div>
                                                
                                                <!-- 右侧分点内容 -->
                                                <div class="points-container" style="max-width: 500px; text-align: left;">
                                                    <div style="margin-bottom: 20px; font-size: 1.1rem; color: #555;">• 06年,男,浙江人</div>
                                                    <div style="margin-bottom: 20px; font-size: 1.1rem; color: #555;">• 目前就读于杭州某大学计算机相关专业</div>
                                                    <div style="margin-bottom: 20px; font-size: 1.1rem; color: #555;">• 爱好涉猎广泛</div>
                                                    <div style="margin-bottom: 20px; font-size: 1.1rem; color: #555;">• 最大的梦想是转生异世界</div>
                                                    <div style="margin-bottom: 20px; font-size: 1.1rem; color: #555;">• 有AI不用就和放着工具不动有什么区别!</div>
                                                </div>
                                            </div>
                                        </section>
                                        
                                        <!-- 灰色分割线 -->
                                        <div style="border-top: 1px solid rgba(0, 0, 0, 0.1); margin: 0 auto 60px; max-width: 800px;"></div>
                                        
                                        <!-- 关于网站部分 -->
                                        <section class="website-section" style="margin-bottom: 60px; text-align: center;">
                                            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 30px; color: var(--text-color);">关于网站</h3>
                                            <div class="website-content" style="max-width: 800px; margin: 0 auto; text-align: left;">
                                                <div style="margin-bottom: 20px; font-size: 1.1rem; color: #555;">• 本网站代码100%由AI编写</div>
                                                <div style="margin-bottom: 20px; font-size: 1.1rem; color: #555;">• 网站为个人博客网站,已在Github开源</div>
                                            </div>
                                        </section>
                                        
                                        <!-- 灰色分割线 -->
                                        <div style="border-top: 1px solid rgba(0, 0, 0, 0.1); margin: 0 auto 60px; max-width: 800px;"></div>
                                        
                                        <!-- 联系部分 -->
                                        <section class="contact-section" style="text-align: center;">
                                            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 40px; color: var(--text-color);">联系</h3>
                                            <div class="contact-container" style="display: flex; justify-content: center; gap: 100px; flex-wrap: wrap;">
                                                <div class="contact-item" style="min-width: 250px; padding: 20px; border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 8px; background-color: rgba(255, 255, 255, 0.5); transition: all 0.3s ease; cursor: pointer;">
                                                    <a href="https://github.com/xianyujun4" style="display: flex; justify-content: center; align-items: center; gap: 10px; text-decoration: none; color: inherit;">
                                                        <!-- GitHub图标 -->
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                                        </svg>
                                                        <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-color);">Github</div>
                                                    </a>
                                                </div>
                                                <div class="contact-item" style="min-width: 250px; padding: 20px; border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 8px; background-color: rgba(255, 255, 255, 0.5); transition: all 0.3s ease; cursor: pointer;">
                                                    <a href="mailto:xianyujun4@qq.com" style="display: flex; justify-content: center; align-items: center; gap: 10px; text-decoration: none; color: inherit;">
                                                        <!-- 邮箱图标 -->
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z"/>
                                                        </svg>
                                                        <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-color);">邮箱</div>
                                                    </a>
                                                </div>
                                            </div>
                                        </section>
                                    `;
                                    
                                    // 添加到放大的框中
                                    expandedBox.appendChild(aboutContainer);
                                    
                                    // 触发关于内容动画
                                    timeouts.push(setTimeout(() => {
                                        aboutContainer.style.opacity = '1';
                                        aboutContainer.style.transform = 'translateY(0)';
                                    }, 900)); // 文字动画后延迟300ms
                                } else {
                                    // 其他框（TEST2、TEST3）：删除飞入的线条，只保留文字动画
                                    // 创建新的文字容器
                                    const textContainer = document.createElement('div');
                                    textContainer.className = 'new-text-container';
                                    textContainer.style.position = 'absolute';
                                    textContainer.style.top = '50px'; // 与顶部保持间距
                                    textContainer.style.left = '50px'; // 与左部保持间距
                                    textContainer.style.zIndex = '99999';
                                    textContainer.style.overflow = 'hidden';
                                    
                                    // 创建新文字元素
                                    const newText = document.createElement('div');
                                    newText.className = 'new-text';
                                    newText.textContent = boxText.textContent;
                                    newText.style.fontFamily = 'Courier New, monospace';
                                    newText.style.fontSize = '2rem';
                                    newText.style.fontWeight = '700';
                                    newText.style.color = 'var(--text-color)';
                                    newText.style.textTransform = 'uppercase';
                                    newText.style.letterSpacing = '8px';
                                    newText.style.opacity = '0';
                                    newText.style.transform = 'translateX(-100%)';
                                    newText.style.transition = 'opacity 0.5s ease, transform 1s ease-out';
                                    
                                    // 组装元素 - 只添加文字，不添加线条
                                    textContainer.appendChild(newText);
                                    expandedBox.appendChild(textContainer);
                                    
                                    // 触发文字飞入动画
                                    timeouts.push(setTimeout(() => {
                                        newText.style.transition = 'opacity 0.3s ease, transform 0.3s ease-out';
                                        newText.style.opacity = '1';
                                        newText.style.transform = 'translateX(0)';
                                    }, 600));
                                }
                            }
                        }
                        
                        // 设置初始样式，与原框位置一致，包括边框
                        expandedBox.style.position = 'fixed';
                        expandedBox.style.top = `${rect.top}px`;
                        expandedBox.style.left = `${rect.left}px`;
                        expandedBox.style.width = `${rect.width}px`;
                        expandedBox.style.height = `${rect.height}px`;
                        expandedBox.style.backgroundColor = 'white';
                        expandedBox.style.border = window.getComputedStyle(box).border; // 复制原框的边框样式
                        expandedBox.style.zIndex = '100'; // 低z-index，确保原框可见
                        expandedBox.style.opacity = '1';
                        expandedBox.style.transition = 'width 0.5s ease, height 0.5s ease, top 0.5s ease, left 0.5s ease, border 0s';
                        expandedBox.style.cursor = 'pointer';
                        expandedBox.style.transformOrigin = 'center center';
                        
                        // 确保原框在放大过程中可见，提高原框的z-index
                        box.style.zIndex = '9999';
                        box.style.position = 'relative';
                        
                        // 添加到body中
                        document.body.appendChild(expandedBox);
                        
                        // 强制浏览器重排，确保动画能正确触发
                        expandedBox.offsetHeight;
                        
                        // 开始放大动画
                        timeouts.push(setTimeout(() => {
                            expandedBox.style.top = '0';
                            expandedBox.style.left = '0';
                            expandedBox.style.width = '100vw';
                            expandedBox.style.height = '100vh';
                        }, 10));
                        
                        // 放大动画结束后（0.5秒），设置新元素的z-index覆盖原框
                        timeouts.push(setTimeout(() => {
                            expandedBox.style.zIndex = '9999'; // 放大后覆盖原框
                            box.style.border = 'none';
                            box.style.background = 'none';
                        }, 500));
                        
                        // 添加ESC键关闭功能
                        const escKeyHandler = (e) => {
                            // 检查是否有笔记详情页打开，如果有则不处理（让详情页自己处理）
                            const noteDetailContainer = document.querySelector('.note-detail-container');
                            if (noteDetailContainer) {
                                return; // 如果有详情页打开，不处理当前的ESC事件
                            }
                            
                            if (e.key === 'Escape') {
                                closeHandler();
                            }
                        };
                        
                        // 为当前页面添加ESC键监听
                        document.addEventListener('keydown', escKeyHandler);
                        
                        // 定义关闭处理函数
                        const closeHandler = (e) => {
                            // 检查是否有笔记详情页打开，如果有则不处理
                            const noteDetailContainer = document.querySelector('.note-detail-container');
                            if (noteDetailContainer) {
                                return;
                            }
                            
                            // 只有点击expandedBox本身（空白区域）或通过ESC键调用时才执行退出操作
                            // 如果是ESC键调用，e可能是键盘事件，此时e.target不是expandedBox
                            if (e && e.type === 'click' && e.target !== expandedBox) {
                                return;
                            }
                            
                            // 清除所有未执行的定时器，中断进入动画
                            if (expandedBox._timeouts) {
                                expandedBox._timeouts.forEach(timeoutId => clearTimeout(timeoutId));
                                expandedBox._timeouts = []; // 清空数组
                            }
                            
                            // 移除ESC键监听
                            document.removeEventListener('keydown', escKeyHandler);
                            
                            // 恢复原框的样式
                            box.style.border = originalBorder || '';
                            box.style.background = originalBackground || '';
                            box.style.zIndex = originalZIndex || '10'; // 恢复原z-index
                            
                            // 恢复原框内文字的可见性
                            const boxText = box.querySelector('.box-text');
                            if (boxText) {
                                boxText.style.opacity = '1';
                            }
                            
                            // 检查是否是第一个或第二个框（模块化内容）
                            const notesContainer = expandedBox.querySelector('.notes-container');
                            const titleContainer = expandedBox.querySelector('.notes-container') ? expandedBox.querySelector(':scope > div:first-child') : null;
                            const titleText = expandedBox.querySelector('.new-text');
                            const line = expandedBox.querySelector('.new-text-line');
                            const categoryNav = expandedBox.querySelector('.category-nav');
                            
                            if (notesContainer && titleContainer && titleText && line) {
                                // 1. 标题文字和分类导航文字同时向左飞出，线条消失
                                titleText.style.transition = 'opacity 0.3s ease, transform 0.3s ease-in';
                                titleText.style.opacity = '0';
                                titleText.style.transform = 'translateX(-100%)';
                                
                                // 处理分类导航文字
                                if (categoryNav) {
                                    const categoryLinks = categoryNav.querySelectorAll('a');
                                    categoryLinks.forEach(link => {
                                        link.style.transition = 'opacity 0.3s ease, transform 0.3s ease-in';
                                        link.style.opacity = '0';
                                        link.style.transform = 'translateX(-100%)';
                                    });
                                }
                                
                                line.style.transition = 'width 0.3s ease';
                                line.style.width = '0';
                                line.style.transformOrigin = 'right center';
                                
                                // 2. 文字动画完成后，模块化内容消失
                                setTimeout(() => {
                                    const noteCards = notesContainer.querySelectorAll('.note-card');
                                    noteCards.forEach((card, cardIndex) => {
                                        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease-in';
                                        card.style.opacity = '0';
                                        card.style.transform = 'translateY(20px)';
                                    });
                                    
                                    // 3. 笔记消失后，执行框缩小动画
                                    setTimeout(() => {
                                        // 开始缩小动画，与放大逻辑一致
                                        expandedBox.style.zIndex = '100'; // 确保缩小过程中原框可见
                                        
                                        // 强制浏览器重排，确保动画能正确触发
                                        expandedBox.offsetHeight;
                                        
                                        // 开始缩小动画
                                        setTimeout(() => {
                                            expandedBox.style.top = `${rect.top}px`;
                                            expandedBox.style.left = `${rect.left}px`;
                                            expandedBox.style.width = `${rect.width}px`;
                                            expandedBox.style.height = `${rect.height}px`;
                                            // 缩小过程中保持边框可见，不立即设置opacity
                                        }, 10);
                                        
                                        // 缩小动画结束后（0.5秒），设置透明度并移除元素
                                        setTimeout(() => {
                                            expandedBox.style.opacity = '0';
                                            
                                            // 延迟移除元素，确保透明度动画完成
                                            setTimeout(() => {
                                                if (expandedBox.parentNode) {
                                                    expandedBox.parentNode.removeChild(expandedBox);
                                                }
                                            }, 100);
                                        }, 500);
                                    }, 300); // 笔记消失动画时长0.3秒
                                }, 300); // 文字和线条动画时长0.3秒
                            } else {
                                // 其他框：文字先向左飞出，然后界面缩小
                                // 获取新文字元素
                                const newText = expandedBox.querySelector('.new-text');
                                
                                if (newText) {
                                    // 1. 文字向左飞出动画，时长0.3秒
                                    newText.style.transition = 'opacity 0.3s ease, transform 0.3s ease-in';
                                    newText.style.opacity = '0';
                                    newText.style.transform = 'translateX(-100%)';
                                    
                                    // 2. 文字动画完成后，执行内容淡出动画（如果是关于页）
                                    setTimeout(() => {
                                        // 检查是否是关于页
                                        const aboutContainer = expandedBox.querySelector('.about-container');
                                        if (aboutContainer) {
                                            aboutContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease-in';
                                            aboutContainer.style.opacity = '0';
                                            aboutContainer.style.transform = 'translateY(20px)';
                                        }
                                        
                                        // 3. 内容淡出完成后，执行框缩小动画
                                        setTimeout(() => {
                                            // 开始缩小动画，与放大逻辑一致
                                            expandedBox.style.zIndex = '100'; // 确保缩小过程中原框可见
                                            
                                            // 强制浏览器重排，确保动画能正确触发
                                            expandedBox.offsetHeight;
                                            
                                            // 开始缩小动画
                                            setTimeout(() => {
                                                expandedBox.style.top = `${rect.top}px`;
                                                expandedBox.style.left = `${rect.left}px`;
                                                expandedBox.style.width = `${rect.width}px`;
                                                expandedBox.style.height = `${rect.height}px`;
                                                // 缩小过程中保持边框可见，不立即设置opacity
                                            }, 10);
                                            
                                            // 缩小动画结束后（0.5秒），设置透明度并移除元素
                                            setTimeout(() => {
                                                expandedBox.style.opacity = '0';
                                                
                                                // 延迟移除元素，确保透明度动画完成
                                                setTimeout(() => {
                                                    if (expandedBox.parentNode) {
                                                        expandedBox.parentNode.removeChild(expandedBox);
                                                    }
                                                }, 100);
                                            }, 500);
                                        }, 300); // 内容淡出动画时长0.3秒
                                    }, 300); // 文字飞出动画时长0.3秒
                                } else {
                                    // 如果没有新文字元素，直接执行缩小动画
                                    // 开始缩小动画，与放大逻辑一致
                                    expandedBox.style.zIndex = '100'; // 确保缩小过程中原框可见
                                    
                                    // 强制浏览器重排，确保动画能正确触发
                                    expandedBox.offsetHeight;
                                    
                                    // 开始缩小动画
                                    setTimeout(() => {
                                        expandedBox.style.top = `${rect.top}px`;
                                        expandedBox.style.left = `${rect.left}px`;
                                        expandedBox.style.width = `${rect.width}px`;
                                        expandedBox.style.height = `${rect.height}px`;
                                        // 缩小过程中保持边框可见，不立即设置opacity
                                    }, 10);
                                    
                                    // 缩小动画结束后（0.5秒），设置透明度并移除元素
                                    setTimeout(() => {
                                        expandedBox.style.opacity = '0';
                                        
                                        // 延迟移除元素，确保透明度动画完成
                                        setTimeout(() => {
                                            if (expandedBox.parentNode) {
                                                expandedBox.parentNode.removeChild(expandedBox);
                                            }
                                        }, 100);
                                    }, 500);
                                }
                            }
                        };
                        
                        // 点击放大后的元素关闭
                        expandedBox.addEventListener('click', closeHandler);
                    });
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
