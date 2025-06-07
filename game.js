// Игра "Эрик зовёт на шашлык"
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Игровые переменные
        this.gameState = 'start'; // start, playing, gameOver, victory
        this.currentLevel = 1;
        this.maxLevel = 4;
        this.score = 0;
        this.health = 3;
        
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
            1: { name: 'Влад', emoji: '🚬', quote: 'Ладно, только после плюшки!', weapon: '💨' },
            2: { name: 'Макс', emoji: '🍺', quote: 'Окей, но с пивом заеду', weapon: '🍻' },
            3: { name: 'Марк', emoji: '💻', quote: 'Ну ладно, отвлекусь от работы', weapon: '📋' },
            4: { name: 'Ден', emoji: '🪖', quote: 'Если командир отпустит — приду!', weapon: '🎖️' }
        };
        
        this.init();
    }
    
    setupCanvas() {
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            const rect = container.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height - 140; // Вычитаем высоту заголовка и контролов
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    init() {
        this.setupEventListeners();
        this.setupLevel();
        this.gameLoop();
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
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileControls[action] = false;
            });
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.mobileControls[action] = true;
            });
            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.mobileControls[action] = false;
            });
        };
        
        setupMobileControl('leftBtn', 'left');
        setupMobileControl('rightBtn', 'right');
        setupMobileControl('jumpBtn', 'jump');
        setupMobileControl('attackBtn', 'attack');
        
        // Кнопки экранов
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('startScreen').classList.add('hidden');
        this.setupLevel();
    }
    
    restartGame() {
        this.gameState = 'playing';
        this.currentLevel = 1;
        this.score = 0;
        this.health = 3;
        this.player = new Player(100, 300);
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('victoryScreen').classList.add('hidden');
        this.setupLevel();
        this.updateUI();
    }
    
    setupLevel() {
        this.platforms = [];
        this.projectiles = [];
        this.particles = [];
        this.collectibles = [];
        
        // Создание платформ
        this.createPlatforms();
        
        // Создание босса
        const bossInfo = this.bossData[this.currentLevel];
        this.boss = new Boss(this.canvas.width - 150, 200, bossInfo);
        
        // Сброс позиции игрока
        this.player.x = 100;
        this.player.y = 300;
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
        if (this.gameState !== 'playing') return;
        
        this.handleInput();
        this.player.update(this.platforms);
        
        if (this.boss) {
            this.boss.update(this.player);
            
            // Создание снарядов боссом
            if (Math.random() < 0.02) {
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
        if (!this.boss) return;
        
        const distance = Math.abs(this.player.x - this.boss.x);
        if (distance < 80) {
            this.boss.takeDamage();
            this.createParticle(this.boss.x, this.boss.y, '🍖');
            this.score += 50;
            
            if (this.boss.health <= 0) {
                this.nextLevel();
            }
        }
    }
    
    takeDamage() {
        this.health--;
        this.createParticle(this.player.x, this.player.y, '💥');
        
        if (this.health <= 0) {
            this.gameState = 'gameOver';
            document.getElementById('gameOverScreen').classList.remove('hidden');
        } else {
            // Респавн игрока
            this.player.x = 100;
            this.player.y = 300;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
        }
    }
    
    nextLevel() {
        this.currentLevel++;
        this.createParticle(this.boss.x, this.boss.y, '🎉');
        
        if (this.currentLevel > this.maxLevel) {
            this.gameState = 'victory';
            document.getElementById('victoryScreen').classList.remove('hidden');
        } else {
            setTimeout(() => {
                this.setupLevel();
            }, 1000);
        }
    }
    
    createParticle(x, y, emoji) {
        this.particles.push(new Particle(x, y, emoji));
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    updateUI() {
        document.getElementById('health').textContent = this.health;
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.currentLevel;
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
            
            // Снаряды
            this.projectiles.forEach(projectile => projectile.render(this.ctx));
            
            // Частицы
            this.particles.forEach(particle => particle.render(this.ctx));
            
            // Информация о боссе
            if (this.boss) {
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
        this.x = Math.max(0, Math.min(this.x, window.innerWidth - this.width));
        
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
        this.x = Math.max(0, Math.min(this.x, window.innerWidth - this.width));
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