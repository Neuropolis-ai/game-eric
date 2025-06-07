// Глобальные переменные размеров игры
let GAME_WIDTH = 800;
let GAME_HEIGHT = 600;

// Игра "Эрик зовёт на шашлык"
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Игровые переменные
        this.gameState = 'welcome'; // welcome, playing, gameOver, victory
        this.currentLevel = 1;
        this.maxLevel = 4;
        this.score = 0;
        this.health = 3;
        this.lastUIUpdate = { health: 3, score: 0, level: 1 }; // Для оптимизации UI
        
        // Игровые объекты
        this.player = new Player(100, 300);
        this.boss = null;
        this.platforms = [];
        this.projectiles = [];
        this.particles = [];
        this.collectibles = [];
        
        // Управление
        this.keys = {};
        this.mobileControls = {
            left: false,
            right: false,
            jump: false,
            attack: false
        };
        
        // Босс-описания
        this.bossData = {
            1: { name: 'Влад', emoji: '🚬', quote: 'Ладно, ладно! Только после этой плюшки дожую! 😤', weapon: '💨' },
            2: { name: 'Макс', emoji: '🍺', quote: 'Ну окей, но с пивом заеду! Без пива не шашлык! 🍻', weapon: '🍻' },
            3: { name: 'Марк', emoji: '💻', quote: 'Блин, ну ладно... Отвлекусь от этих багов! 🐛→🔥', weapon: '📋' },
            4: { name: 'Ден', emoji: '🪖', quote: 'Если командир отпустит — сразу лечу! Служу России! 🫡', weapon: '🎖️' }
        };
        
        // Telegram Web App интеграция
        this.telegramApp = null;
        this.initTelegramIntegration();
        
        this.init();
    }
    
    setupCanvas() {
        const resizeCanvas = () => {
            const gameArea = document.querySelector('.game-area');
            const rect = gameArea.getBoundingClientRect();
            
            // Устанавливаем размер канваса равным размеру игровой области
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            
            // Обновляем размеры игры
            GAME_WIDTH = this.canvas.width;
            GAME_HEIGHT = this.canvas.height;
            
            // Пересчитываем размеры платформ
            this.updatePlatformSizes();
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeCanvas, 100); // Задержка для корректного обновления
        });
    }
    
    init() {
        this.setupEventListeners();
        this.gameLoop();
    }
    
    initTelegramIntegration() {
        // Инициализация Telegram Web App API
        if (window.TelegramWebApp) {
            this.telegramApp = new TelegramWebApp();
            console.log('Telegram Web App интеграция активирована');
        } else if (window.Telegram?.WebApp) {
            this.telegramApp = window.Telegram.WebApp;
            this.telegramApp.ready();
            this.telegramApp.expand();
            console.log('Telegram Web App API найдено');
        } else {
            console.log('Telegram Web App API не найдено - локальный режим');
        }
    }
    
    sendGameResult(victory = false) {
        // Отправка результатов в Telegram бот
        if (this.telegramApp && this.telegramApp.sendGameResult) {
            this.telegramApp.sendGameResult(this.currentLevel, this.score, victory);
        } else if (this.telegramApp && this.telegramApp.sendData) {
            const resultData = {
                action: 'game_result',
                level: this.currentLevel,
                score: this.score,
                victory: victory,
                timestamp: Date.now()
            };
            this.telegramApp.sendData(JSON.stringify(resultData));
        }
        
        // Вибрация
        if (this.telegramApp && this.telegramApp.hapticFeedback) {
            this.telegramApp.hapticFeedback(victory ? 'success' : 'error');
        }
    }
    
    sendLevelComplete() {
        // Отправка данных о прохождении уровня
        if (this.telegramApp && this.telegramApp.sendData) {
            const levelData = {
                action: 'level_complete',
                level: this.currentLevel,
                score: this.score,
                victory: true,
                timestamp: Date.now()
            };
            this.telegramApp.sendData(JSON.stringify(levelData));
        }
        
        // Вибрация успеха
        if (this.telegramApp && this.telegramApp.hapticFeedback) {
            this.telegramApp.hapticFeedback('success');
        }
    }
    
    setupEventListeners() {
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Мобильные контролы
        const setupMobileControl = (id, action) => {
            const btn = document.getElementById(id);
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileControls[action] = true;
                btn.classList.add('pressed');
                
                // Тактильная обратная связь для iOS
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileControls[action] = false;
                btn.classList.remove('pressed');
            });
            
            btn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.mobileControls[action] = false;
                btn.classList.remove('pressed');
            });
            
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.mobileControls[action] = true;
                btn.classList.add('pressed');
            });
            
            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.mobileControls[action] = false;
                btn.classList.remove('pressed');
            });
            
            btn.addEventListener('mouseleave', (e) => {
                e.preventDefault();
                this.mobileControls[action] = false;
                btn.classList.remove('pressed');
            });
            
            // Предотвращаем выделение текста
            btn.addEventListener('selectstart', (e) => e.preventDefault());
            btn.addEventListener('dragstart', (e) => e.preventDefault());
        };
        
        setupMobileControl('leftBtn', 'left');
        setupMobileControl('rightBtn', 'right');
        setupMobileControl('jumpBtn', 'jump');
        setupMobileControl('attackBtn', 'attack');
        
        // Кнопки экранов
        document.getElementById('startGameBtn').addEventListener('click', () => {
            console.log("Start Game button clicked!");
            this.startGame();
        });
        document.getElementById('restartBtn').addEventListener('click', () => {
            console.log("Restart button clicked!");
            this.restartGame();
        });
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            console.log("Play Again button clicked!");
            this.restartGame();
        });
    }
    
    startGame() {
        console.log("StartGame method called, current gameState:", this.gameState);
        if (this.gameState === 'playing') {
            console.log("Game already playing, returning");
            return;
        }
        console.log("Starting game...");
        this.gameState = 'playing';
        console.log("Set gameState to:", this.gameState);
        
        const welcomeScreen = document.getElementById('welcomeScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const victoryScreen = document.getElementById('victoryScreen');
        
        console.log("Hiding screens...");
        welcomeScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        victoryScreen.classList.add('hidden');
        
        // Показываем мобильные кнопки управления
        this.showMobileControls();
        
        console.log("Welcome screen classes:", welcomeScreen.classList.toString());
        console.log("Calling setupLevel...");
        this.setupLevel();
        console.log("Game started successfully!");
    }
    
    restartGame() {
        this.gameState = 'playing';
        this.currentLevel = 1;
        this.score = 0;
        this.health = 3;
        this.player = new Player(100, 300);
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('victoryScreen').classList.add('hidden');
        
        // Показываем мобильные кнопки управления
        this.showMobileControls();
        
        this.setupLevel();
        this.updateUI();
    }
    
    showMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        mobileControls.classList.add('game-active');
    }
    
    hideMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        mobileControls.classList.remove('game-active');
    }
    
    setupLevel() {
        this.platforms = [];
        this.projectiles = [];
        this.particles = [];
        this.collectibles = [];
        
        // Создание платформ
        this.createPlatforms();
        
        // Создание босса - позиционирование ниже центра для лучшего попадания в игрока
        const bossInfo = this.bossData[this.currentLevel];
        this.boss = new Boss(this.canvas.width - 120, this.canvas.height * 0.65 - 25, bossInfo);
        
        // Сброс позиции игрока
        this.player.x = 50;
        this.player.y = this.canvas.height - 150;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        
        // Создание коллектиблов
        this.createCollectibles();
    }
    
    createPlatforms() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Основная платформа
        this.platforms.push(new Platform(0, h - 50, w, 50));
        
        // Платформы для прыжков
        this.platforms.push(new Platform(200, h - 150, 150, 20));
        this.platforms.push(new Platform(400, h - 250, 150, 20));
        this.platforms.push(new Platform(w - 200, h - 200, 150, 20));
        
        // Дополнительные платформы в зависимости от уровня
        switch(this.currentLevel) {
            case 2:
                this.platforms.push(new Platform(100, h - 350, 100, 20));
                break;
            case 3:
                this.platforms.push(new Platform(150, h - 180, 100, 20));
                this.platforms.push(new Platform(350, h - 320, 100, 20));
                break;
            case 4:
                this.platforms.push(new Platform(50, h - 280, 80, 20));
                this.platforms.push(new Platform(300, h - 180, 80, 20));
                break;
        }
    }
    
    createCollectibles() {
        // Создаем коллектиблы (угольки и лаваш)
        for(let i = 0; i < 3; i++) {
            const x = 150 + i * 200;
            const y = this.canvas.height - 100;
            this.collectibles.push(new Collectible(x, y, Math.random() > 0.5 ? '🔥' : '🥙'));
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameState !== 'playing' && this.gameState !== 'levelTransition') return;
        
        // Во время перехода между уровнями блокируем ввод
        if (this.gameState === 'playing') {
            this.handleInput();
        }
        
        this.player.update(this.platforms);
        
        if (this.boss) {
            this.boss.update(this.player);
            
            // Создание снарядов боссом - ОПТИМИЗИРОВАНО: реже создаем снаряды
            if (Math.random() < 0.01 && this.projectiles.length < 3 && this.gameState === 'playing') {
                this.projectiles.push(new Projectile(
                    this.boss.x, 
                    this.boss.y + 20, 
                    this.bossData[this.currentLevel].weapon
                ));
            }
        }
        
        // Обновление снарядов
        this.projectiles.forEach((projectile, index) => {
            projectile.update();
            if (projectile.x < 0 || projectile.x > this.canvas.width) {
                this.projectiles.splice(index, 1);
            }
            
            // Столкновение с игроком
            if (this.checkCollision(this.player, projectile)) {
                this.takeDamage();
                this.projectiles.splice(index, 1);
            }
        });
        
        // Обновление коллектиблов
        this.collectibles.forEach((collectible, index) => {
            if (this.checkCollision(this.player, collectible)) {
                this.score += 10;
                this.collectibles.splice(index, 1);
                this.createParticle(collectible.x, collectible.y, '✨');
            }
        });
        
        // Обновление частиц
        this.particles.forEach((particle, index) => {
            particle.update();
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
        
        // Проверка падения игрока
        if (this.player.y > this.canvas.height) {
            this.takeDamage();
        }
        
        this.updateUI();
    }
    
    handleInput() {
        const leftPressed = this.keys['ArrowLeft'] || this.keys['a'] || this.mobileControls.left;
        const rightPressed = this.keys['ArrowRight'] || this.keys['d'] || this.mobileControls.right;
        const jumpPressed = this.keys['ArrowUp'] || this.keys['w'] || this.keys[' '] || this.mobileControls.jump;
        const attackPressed = this.keys['x'] || this.keys['z'] || this.mobileControls.attack;
        
        if (leftPressed) {
            this.player.moveLeft();
        }
        if (rightPressed) {
            this.player.moveRight();
        }
        if (jumpPressed) {
            this.player.jump();
        }
        if (attackPressed && !this.player.attacking) {
            this.player.attack();
            this.checkBossAttack();
        }
    }
    
    checkBossAttack() {
        if (!this.boss || this.boss.health <= 0) return; // Защита от повторных атак
        
        const distance = Math.abs(this.player.x - this.boss.x);
        if (distance < 80) {
            this.boss.takeDamage();
            this.createParticle(this.boss.x, this.boss.y, '🍖');
            this.score += 50;
            
            if (this.boss.health <= 0) {
                // Временно блокируем игрока для предотвращения повторных атак
                this.gameState = 'levelTransition';
                
                // Отправляем результат прохождения уровня
                this.sendLevelComplete();
                
                // Показываем смешное сообщение босса
                this.showBossMessage();
                
                // Задержка перед переходом на следующий уровень
                setTimeout(() => {
                    this.nextLevel();
                }, 4000);
            }
        }
    }
    
    showBossMessage() {
        const bossInfo = this.bossData[this.currentLevel];
        
        // Создаем временное сообщение
        const messageDiv = document.createElement('div');
        messageDiv.style.position = 'absolute';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.background = 'rgba(0, 0, 0, 0.9)';
        messageDiv.style.color = 'white';
        messageDiv.style.padding = '20px';
        messageDiv.style.borderRadius = '15px';
        messageDiv.style.fontSize = '18px';
        messageDiv.style.textAlign = 'center';
        messageDiv.style.zIndex = '1500';
        messageDiv.style.border = '3px solid #FFD700';
        messageDiv.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
        
        messageDiv.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 10px;">${bossInfo.emoji}</div>
            <div style="font-weight: bold; margin-bottom: 10px;">${bossInfo.name}:</div>
            <div style="font-style: italic; color: #FFD700;">"${bossInfo.quote}"</div>
            <div style="margin-top: 15px; font-size: 24px;">🍖 Уговорён! Идём на шашлыки! 🔥</div>
        `;
        
        document.querySelector('.game-area').appendChild(messageDiv);
        
        // Убираем сообщение через 4 секунды
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 4000);
    }
    
    takeDamage() {
        this.health--;
        this.createParticle(this.player.x, this.player.y, '💥');
        
        if (this.health <= 0) {
            this.gameState = 'gameOver';
            // Скрываем мобильные кнопки управления
            this.hideMobileControls();
            // Отправляем результат поражения
            this.sendGameResult(false);
            document.getElementById('gameOverScreen').classList.remove('hidden');
        } else {
            // Респавн игрока - ИСПРАВЛЕНО: правильная позиция
            this.player.x = 50;
            this.player.y = this.canvas.height - 150;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
        }
    }
    
    nextLevel() {
        console.log(`Переход с уровня ${this.currentLevel} на следующий`);
        this.currentLevel++;
        this.createParticle(this.boss.x, this.boss.y, '🎉');
        
        if (this.currentLevel > this.maxLevel) {
            console.log("Игра завершена - победа!");
            this.gameState = 'victory';
            // Скрываем мобильные кнопки управления
            this.hideMobileControls();
            // Отправляем результат полной победы
            this.sendGameResult(true);
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('victoryScreen').classList.remove('hidden');
        } else {
            console.log(`Настройка уровня ${this.currentLevel}`);
            // Очищаем босса чтобы избежать проблем
            this.boss = null;
            this.projectiles = [];
            
            // Настраиваем новый уровень
            this.setupLevel();
            
            // Возвращаем состояние игры в playing
            this.gameState = 'playing';
            
            // Показываем уведомление о новом уровне
            this.showLevelMessage();
        }
    }
    
    showLevelMessage() {
        const bossInfo = this.bossData[this.currentLevel];
        
        // Создаем сообщение о новом уровне
        const levelDiv = document.createElement('div');
        levelDiv.style.position = 'absolute';
        levelDiv.style.top = '30%';
        levelDiv.style.left = '50%';
        levelDiv.style.transform = 'translate(-50%, -50%)';
        levelDiv.style.background = 'rgba(255, 87, 34, 0.95)';
        levelDiv.style.color = 'white';
        levelDiv.style.padding = '15px 25px';
        levelDiv.style.borderRadius = '10px';
        levelDiv.style.fontSize = '20px';
        levelDiv.style.textAlign = 'center';
        levelDiv.style.zIndex = '1500';
        levelDiv.style.fontWeight = 'bold';
        levelDiv.style.border = '2px solid white';
        
        levelDiv.innerHTML = `
            <div>🎮 УРОВЕНЬ ${this.currentLevel} 🎮</div>
            <div style="margin-top: 10px;">Следующий друг: ${bossInfo.emoji} ${bossInfo.name}</div>
        `;
        
        document.querySelector('.game-area').appendChild(levelDiv);
        
        // Убираем сообщение через 1.5 секунды
        setTimeout(() => {
            if (levelDiv.parentNode) {
                levelDiv.parentNode.removeChild(levelDiv);
            }
        }, 1500);
    }
    
    createParticle(x, y, emoji) {
        // ОПТИМИЗАЦИЯ: ограничиваем количество частиц
        if (this.particles.length < 10) {
            this.particles.push(new Particle(x, y, emoji));
        }
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    updateUI() {
        if (this.health !== this.lastUIUpdate.health ||
            this.score !== this.lastUIUpdate.score ||
            this.currentLevel !== this.lastUIUpdate.level) {
            document.getElementById('lives').textContent = this.health;
            document.getElementById('score').textContent = this.score;
            document.getElementById('level').textContent = this.currentLevel;
            this.lastUIUpdate = { health: this.health, score: this.score, level: this.currentLevel };
        }
    }
    
    render() {
        // Очистка канваса
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Фон уровня
        this.renderBackground();
        
        if (this.gameState === 'playing') {
            // Платформы
            this.platforms.forEach(platform => platform.render(this.ctx));
            
            // Коллектиблы
            this.collectibles.forEach(collectible => collectible.render(this.ctx));
            
            // Игрок
            this.player.render(this.ctx);
            
            // Босс
            if (this.boss) {
                this.boss.render(this.ctx);
            }
            
            // Снаряды - оптимизированный рендеринг
            this.projectiles.forEach(projectile => {
                if (projectile.x > -50 && projectile.x < this.canvas.width + 50) {
                    projectile.render(this.ctx);
                }
            });
            
            // Частицы - оптимизированный рендеринг
            this.particles.forEach(particle => {
                if (particle.life > 0) {
                    particle.render(this.ctx);
                }
            });
            
            // Информация о боссе
            if (this.boss && this.boss.health > 0) {
                this.renderBossInfo();
            }
        }
    }
    
    renderBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Облака
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '30px Arial';
        this.ctx.fillText('☁️', 100, 50);
        this.ctx.fillText('☁️', 300, 80);
        this.ctx.fillText('☁️', 500, 40);
    }
    
    renderBossInfo() {
        const bossInfo = this.bossData[this.currentLevel];
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 250, 60);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Босс: ${bossInfo.emoji} ${bossInfo.name}`, 20, 30);
        this.ctx.fillText(`Здоровье: ${'❤️'.repeat(this.boss.health)}`, 20, 50);
    }
    
    updatePlatformSizes() {
        if (this.currentLevel && this.bossData[this.currentLevel]) {
            this.platforms.forEach(platform => {
                platform.width = Math.min(platform.width, GAME_WIDTH * 0.3);
            });
        }
    }
}

// Класс игрока (Эрик)
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.velocityX = 0;
        this.velocityY = 0;
        this.grounded = false;
        this.attacking = false;
        this.attackCooldown = 0;
    }
    
    moveLeft() {
        this.velocityX = Math.max(this.velocityX - 0.5, -5);
    }
    
    moveRight() {
        this.velocityX = Math.min(this.velocityX + 0.5, 5);
    }
    
    jump() {
        if (this.grounded) {
            this.velocityY = -12;
            this.grounded = false;
        }
    }
    
    attack() {
        this.attacking = true;
        this.attackCooldown = 20;
    }
    
    update(platforms) {
        // Гравитация
        this.velocityY += 0.5;
        
        // Трение
        this.velocityX *= 0.8;
        
        // Движение
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Столкновения с платформами
        this.grounded = false;
        platforms.forEach(platform => {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                
                if (this.velocityY > 0) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.grounded = true;
                }
            }
        });
        
        // Границы экрана
        this.x = Math.max(0, Math.min(this.x, GAME_WIDTH - this.width));
        
        // Атака
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        } else {
            this.attacking = false;
        }
    }
    
    render(ctx) {
        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x + 5, this.y + this.height, this.width - 5, 5);
        
        // Эрик
        ctx.fillStyle = this.attacking ? '#ff6b6b' : '#4ecdc4';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Лицо
        ctx.font = '30px Arial';
        ctx.fillText('😊', this.x + 5, this.y + 25);
        
        // Атака
        if (this.attacking) {
            ctx.font = '20px Arial';
            ctx.fillText('🍖', this.x + this.width, this.y + 10);
        }
    }
}

// Класс босса
class Boss {
    constructor(x, y, info) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.info = info;
        this.health = 3;
        this.moveDirection = 1;
        this.moveTimer = 0;
    }
    
    update(player) {
        // Простое движение босса
        this.moveTimer++;
        if (this.moveTimer > 120) {
            this.moveDirection *= -1;
            this.moveTimer = 0;
        }
        
        this.x += this.moveDirection * 1;
        this.x = Math.max(0, Math.min(this.x, GAME_WIDTH - this.width));
    }
    
    takeDamage() {
        this.health--;
    }
    
    render(ctx) {
        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x + 5, this.y + this.height, this.width - 5, 5);
        
        // Босс
        ctx.fillStyle = this.health <= 1 ? '#ff6b6b' : '#9b59b6';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Лицо босса
        ctx.font = '40px Arial';
        ctx.fillText(this.info.emoji, this.x + 5, this.y + 35);
        
        // Имя
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.fillText(this.info.name, this.x, this.y - 5);
    }
}

// Класс снаряда
class Projectile {
    constructor(x, y, emoji) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.velocityX = -3;
        this.emoji = emoji;
    }
    
    update() {
        this.x += this.velocityX;
    }
    
    render(ctx) {
        ctx.font = '20px Arial';
        ctx.fillText(this.emoji, this.x, this.y);
    }
}

// Класс платформы
class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    render(ctx) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Трава сверху
        ctx.fillStyle = '#228B22';
        ctx.fillRect(this.x, this.y - 5, this.width, 5);
    }
}

// Класс коллектибла
class Collectible {
    constructor(x, y, emoji) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.emoji = emoji;
        this.bounce = 0;
    }
    
    render(ctx) {
        this.bounce += 0.1;
        const offsetY = Math.sin(this.bounce) * 5;
        
        ctx.font = '20px Arial';
        ctx.fillText(this.emoji, this.x, this.y + offsetY);
    }
}

// Класс частицы
class Particle {
    constructor(x, y, emoji) {
        this.x = x;
        this.y = y;
        this.velocityX = (Math.random() - 0.5) * 4;
        this.velocityY = (Math.random() - 0.5) * 4;
        this.emoji = emoji;
        this.life = 60;
        this.maxLife = 60;
    }
    
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.life--;
    }
    
    render(ctx) {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.font = '16px Arial';
        ctx.fillText(this.emoji, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

// Запуск игры
window.addEventListener('load', () => {
    new Game();
}); 