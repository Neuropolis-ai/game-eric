# 🤖 Настройка Telegram-бота для игры "Эрик зовёт на шашлык"

## 📋 Пошаговая инструкция

### 1. 🔑 Создание бота в Telegram

1. **Найдите @BotFather** в Telegram
2. **Отправьте команду** `/newbot`
3. **Введите имя бота** (например: "Эрик зовёт на шашлык")
4. **Введите username бота** (например: `erik_shashlik_bot`)
5. **Скопируйте токен бота** - это строка вида `1234567890:AABBCCDDEEFFaabbccddeeff`

### 2. 🌐 Размещение игры онлайн

#### Вариант A: GitHub Pages (бесплатно)
```bash
# 1. Создайте репозиторий на GitHub
# 2. Загрузите файлы игры
git add .
git commit -m "Add shashlik game"
git push origin main

# 3. В настройках репозитория включите GitHub Pages
# Settings → Pages → Source: Deploy from a branch → main
# URL игры: https://your-username.github.io/repository-name
```

#### Вариант B: Vercel (бесплатно)
```bash
# 1. Установите Vercel CLI
npm i -g vercel

# 2. Разверните проект
vercel

# 3. Следуйте инструкциям
# URL игры: https://your-project.vercel.app
```

#### Вариант C: Netlify (бесплатно)
1. Зайдите на [netlify.com](https://netlify.com)
2. Перетащите папку с игрой в область загрузки
3. Получите URL игры: `https://random-name.netlify.app`

### 3. 🖥️ Настройка и запуск бота

#### Установка зависимостей:
```bash
pip install -r requirements.txt
```

#### Настройка конфигурации:
Отредактируйте файл `telegram_bot.py`:

```python
# Замените эти настройки на свои:
BOT_TOKEN = "1234567890:AABBCCDDEEFFaabbccddeeff"  # Токен от @BotFather
WEBHOOK_HOST = "https://your-domain.com"  # Ваш домен сервера
GAME_URL = "https://your-game-domain.com"  # URL игры
```

#### Запуск бота локально (для тестирования):
```bash
python telegram_bot.py
```

### 4. 🚀 Развёртывание на сервере

#### Для VPS/сервера:
```bash
# 1. Установите зависимости
sudo apt update
sudo apt install python3 python3-pip nginx certbot

# 2. Настройте SSL сертификат
sudo certbot --nginx -d your-domain.com

# 3. Запустите бота как сервис
sudo systemctl enable shashlik-bot
sudo systemctl start shashlik-bot
```

#### Для Heroku:
```bash
# 1. Создайте Procfile
echo "web: python telegram_bot.py" > Procfile

# 2. Разверните на Heroku
git add .
git commit -m "Deploy bot"
git push heroku main
```

### 5. 🎮 Настройка игр в Telegram

#### Способ 1: Web App (рекомендуется)

1. **Установите кнопку меню с игрой:**
```
Отправьте @BotFather:
/setmenubutton
@your_bot_username
🔥 Играть
https://your-game-domain.com
```

2. **Настройте описание бота:**
```
/setdescription
@your_bot_username
🔥 Игра "Эрик зовёт на шашлык" - помоги Эрику собрать друзей на шашлыки! 🍖

Пройди 4 уровня и уговори:
🚬 Влада (курит плюшки)
🍺 Макса (пьёт пиво)
💻 Марка (работает)
🪖 Дена (служит в армии)
```

3. **Добавьте команды:**
```
/setcommands
@your_bot_username

start - Начать игру
play - Играть
stats - Моя статистика
leaderboard - Таблица лидеров
help - Помощь
```

#### Способ 2: Inline Games (опциональный)

1. **Создайте игру в @BotFather:**
```
/newgame
@your_bot_username
Эрик зовёт на шашлык
Помоги Эрику собрать друзей на шашлыки!
```

2. **Загрузите скриншот игры** (PNG, 640x360px)

3. **Добавьте короткое название:** `shashlik`

4. **Укажите URL игры:** `https://your-game-domain.com`

### 6. 🔧 Дополнительные настройки

#### Настройка webhook:
```python
# В коде бота уже настроено, но можете проверить:
await bot.set_webhook(
    url=f"{WEBHOOK_HOST}/webhook",
    allowed_updates=["message", "callback_query", "inline_query"]
)
```

#### Проверка статуса бота:
```bash
curl -X GET "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### 7. 📊 Мониторинг и аналитика

#### Проверка логов:
```bash
tail -f /var/log/shashlik-bot.log
```

#### Мониторинг базы данных:
```bash
sqlite3 shashlik_game.db

.tables
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM game_results;
```

#### Статистика использования:
```sql
-- Самые активные игроки
SELECT u.first_name, COUNT(*) as games
FROM users u 
JOIN game_results gr ON u.user_id = gr.user_id 
GROUP BY u.user_id 
ORDER BY games DESC 
LIMIT 10;

-- Процент побед
SELECT 
    AVG(CASE WHEN victory THEN 1.0 ELSE 0.0 END) * 100 as win_rate
FROM game_results;
```

### 8. 🛡️ Безопасность

#### Проверка данных Web App:
```python
def verify_telegram_data(init_data: str, bot_token: str) -> bool:
    """Полная проверка подлинности данных"""
    try:
        parsed_data = dict(x.split('=') for x in init_data.split('&'))
        hash_value = parsed_data.pop('hash', '')
        
        data_check_string = '\n'.join(f"{k}={v}" for k, v in sorted(parsed_data.items()))
        secret_key = hmac.new("WebAppData".encode(), bot_token.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        return hash_value == calculated_hash
    except:
        return False
```

### 9. ⚡ Оптимизация производительности

#### Кэширование:
```python
import redis

# Настройка Redis для кэширования
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Кэширование статистики
def get_cached_stats(user_id: int):
    cached = redis_client.get(f"stats:{user_id}")
    if cached:
        return json.loads(cached)
    
    stats = get_user_stats(user_id)
    redis_client.setex(f"stats:{user_id}", 300, json.dumps(stats))
    return stats
```

#### Лимиты и anti-spam:
```python
from collections import defaultdict
import time

# Простой rate limiter
user_requests = defaultdict(list)

def rate_limit(user_id: int, limit: int = 5, window: int = 60) -> bool:
    now = time.time()
    user_requests[user_id] = [t for t in user_requests[user_id] if now - t < window]
    
    if len(user_requests[user_id]) >= limit:
        return False
    
    user_requests[user_id].append(now)
    return True
```

### 10. 🎯 Продвижение игры

#### Получение статистики бота:
```
@BotFather → /mybots → @your_bot → Bot Settings → Statistics
```

#### SEO оптимизация:
- Добавьте мета-теги в `index.html`
- Создайте `robots.txt`
- Добавьте Open Graph теги для красивых превью

#### Реферальная система:
```python
# В команду /start добавьте обработку реферальных ссылок
@dp.message(CommandStart(deep_link=True))
async def start_with_referral(message: Message, command: CommandObject):
    referrer_id = command.args
    # Логика начисления бонусов за приглашение
```

---

## 🔗 Полезные ссылки

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Web Apps документация](https://core.telegram.org/bots/webapps)
- [aiogram документация](https://docs.aiogram.dev/)
- [GitHub Pages](https://pages.github.com/)
- [Vercel](https://vercel.com/)
- [Netlify](https://netlify.com/)

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи бота
2. Убедитесь, что webhook настроен правильно
3. Проверьте доступность игры по URL
4. Убедитесь, что SSL сертификат валиден

**Готово! Ваша игра теперь доступна в Telegram! 🎮🔥** 