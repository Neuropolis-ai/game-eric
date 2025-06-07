// Telegram Web App Integration
class TelegramWebApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.init();
    }
    
    init() {
        if (!this.tg) {
            console.log('Telegram Web App API не доступно');
            return;
        }
        
        // Инициализация Telegram Web App
        this.tg.ready();
        
        // Расширение на весь экран
        this.tg.expand();
        
        // Отключение возможности закрыть приложение свайпом
        this.tg.disableClosingConfirmation();
        
        // Настройка темы
        this.setupTheme();
        
        // Настройка кнопок
        this.setupButtons();
        
        // Отправка данных о запуске игры
        this.sendGameStart();
        
        // Обработчики событий
        this.setupEventHandlers();
    }
    
    setupTheme() {
        if (!this.tg) return;
        
        // Установка цвета заголовка
        this.tg.setHeaderColor('#ff6b6b');
        
        // Установка цвета фона
        this.tg.setBackgroundColor('#87CEEB');
        
        // Адаптация к теме Telegram
        const themeParams = this.tg.themeParams;
        if (themeParams) {
            document.documentElement.style.setProperty('--tg-bg-color', themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-text-color', themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-button-color', themeParams.button_color || '#007acc');
        }
    }
    
    setupButtons() {
        if (!this.tg) return;
        
        // Главная кнопка (показывается при победе)
        this.tg.MainButton.text = 'Поделиться результатом';
        this.tg.MainButton.color = '#ff6b6b';
        this.tg.MainButton.textColor = '#ffffff';
        this.tg.MainButton.hide();
        
        // Обработчик главной кнопки
        this.tg.MainButton.onClick(() => {
            this.shareScore();
        });
    }
    
    setupEventHandlers() {
        if (!this.tg) return;
        
        // Обработчик закрытия приложения
        this.tg.onEvent('viewportChanged', () => {
            // Приложение изменило размер
            window.dispatchEvent(new Event('resize'));
        });
        
        // Обработчик получения данных
        this.tg.onEvent('settingsButtonClicked', () => {
            this.showSettings();
        });
    }
    
    // Отправка данных о начале игры
    sendGameStart() {
        if (!this.tg) return;
        
        const startData = {
            action: 'game_start',
            timestamp: Date.now(),
            user_id: this.tg.initDataUnsafe?.user?.id,
            username: this.tg.initDataUnsafe?.user?.username
        };
        
        // Отправка данных в родительский бот
        this.tg.sendData(JSON.stringify(startData));
    }
    
    // Отправка результатов игры
    sendGameResult(level, score, isVictory) {
        if (!this.tg) return;
        
        const resultData = {
            action: 'game_result',
            level: level,
            score: score,
            victory: isVictory,
            timestamp: Date.now(),
            user_id: this.tg.initDataUnsafe?.user?.id,
            username: this.tg.initDataUnsafe?.user?.username
        };
        
        this.tg.sendData(JSON.stringify(resultData));
        
        // Показать главную кнопку при победе
        if (isVictory) {
            this.tg.MainButton.show();
        }
    }
    
    // Поделиться результатом
    shareScore() {
        if (!this.tg) return;
        
        const shareText = `🔥 Я помог Эрику собрать всех друзей на шашлыки! 🍖\n` +
                         `Прошёл все 4 уровня в игре "Эрик зовёт на шашлык"!\n` +
                         `🚬 Влада, 🍺 Макса, 💻 Марка и 🪖 Дена - всех уговорил!\n\n` +
                         `Попробуй и ты собрать компанию на шашлычок! 🎮`;
        
        // Отправка сообщения в чат
        this.tg.sendData(JSON.stringify({
            action: 'share_result',
            text: shareText
        }));
    }
    
    // Показать настройки (кнопка настроек в заголовке)
    showSettings() {
        const settingsText = `🎮 Игра "Эрик зовёт на шашлык"\n\n` +
                           `📱 Управление на телефоне:\n` +
                           `⬅️➡️ - Движение влево/вправо\n` +
                           `⬆️ - Прыжок\n` +
                           `🍖 - Атака шашлыком\n\n` +
                           `🎯 Цель: Пройти 4 уровня и собрать всех друзей на шашлыки!\n\n` +
                           `🚬 Влад - Курит плюшки\n` +
                           `🍺 Макс - Пьёт пиво\n` +
                           `💻 Марк - Работает\n` +
                           `🪖 Ден - Служит в армии`;
        
        this.tg.showAlert(settingsText);
    }
    
    // Вибрация при событиях
    hapticFeedback(type = 'impact') {
        if (!this.tg?.HapticFeedback) return;
        
        switch(type) {
            case 'light':
                this.tg.HapticFeedback.impactOccurred('light');
                break;
            case 'medium':
                this.tg.HapticFeedback.impactOccurred('medium');
                break;
            case 'heavy':
                this.tg.HapticFeedback.impactOccurred('heavy');
                break;
            case 'success':
                this.tg.HapticFeedback.notificationOccurred('success');
                break;
            case 'error':
                this.tg.HapticFeedback.notificationOccurred('error');
                break;
            case 'warning':
                this.tg.HapticFeedback.notificationOccurred('warning');
                break;
            default:
                this.tg.HapticFeedback.impactOccurred('medium');
        }
    }
    
    // Проверка доступности API
    isAvailable() {
        return !!this.tg;
    }
    
    // Получение информации о пользователе
    getUserInfo() {
        if (!this.tg?.initDataUnsafe?.user) return null;
        
        return {
            id: this.tg.initDataUnsafe.user.id,
            username: this.tg.initDataUnsafe.user.username,
            first_name: this.tg.initDataUnsafe.user.first_name,
            last_name: this.tg.initDataUnsafe.user.last_name,
            language_code: this.tg.initDataUnsafe.user.language_code
        };
    }
    
    // Закрытие приложения
    close() {
        if (!this.tg) return;
        this.tg.close();
    }
}

// Глобальный объект для работы с Telegram
window.telegramApp = new TelegramWebApp();

// Интеграция с игрой
if (window.telegramApp.isAvailable()) {
    // Добавляем обработчики игровых событий
    document.addEventListener('DOMContentLoaded', () => {
        // Переопределяем методы игры для интеграции с Telegram
        const originalGameClass = window.Game;
        if (originalGameClass) {
            const originalTakeDamage = originalGameClass.prototype.takeDamage;
            const originalNextLevel = originalGameClass.prototype.nextLevel;
            const originalStartGame = originalGameClass.prototype.startGame;
            
            // Вибрация при получении урона
            originalGameClass.prototype.takeDamage = function() {
                window.telegramApp.hapticFeedback('error');
                return originalTakeDamage.call(this);
            };
            
            // Вибрация и отправка данных при переходе на следующий уровень
            originalGameClass.prototype.nextLevel = function() {
                window.telegramApp.hapticFeedback('success');
                
                if (this.currentLevel >= this.maxLevel) {
                    // Победа - отправляем результат
                    window.telegramApp.sendGameResult(this.currentLevel, this.score, true);
                }
                
                return originalNextLevel.call(this);
            };
            
            // Уведомление о начале игры
            originalGameClass.prototype.startGame = function() {
                window.telegramApp.hapticFeedback('light');
                return originalStartGame.call(this);
            };
        }
    });
}

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramWebApp;
} 