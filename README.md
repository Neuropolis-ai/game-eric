# 🔥 Эрик зовёт на шашлык 🔥

**2D платформер в стиле Марио с интеграцией Telegram Web App**

![GitHub repo](https://img.shields.io/badge/GitHub-game--eric-blue?logo=github)
![Python](https://img.shields.io/badge/Python-3.8+-green?logo=python)
![Telegram](https://img.shields.io/badge/Telegram-WebApp-blue?logo=telegram)

## 🎮 Описание игры

Эрик очень хочет собрать друзей на шашлыки, но каждый из них занят своими делами. Помоги Эрику пройти 4 уровня и переубедить всех друзей присоединиться к шашлычной вечеринке!

### 🎯 Сюжет:
- 🚬 **Влад** курит плюшки и бросается дымом 💨
- 🍺 **Макс** пьёт пиво и кидает бутылки 🍻  
- 💻 **Марк** работает и швыряет документы 📋
- 🪖 **Ден** служит в армии и метает знаки отличия 🎖️

## 🚀 Демо и деплой

### 🌐 GitHub Pages (HTTPS)
Для работы с Telegram Web App игру нужно разместить на HTTPS:

1. **Включите GitHub Pages:**
   - Идите в Settings → Pages
   - Source: Deploy from a branch
   - Branch: main → / (root)

2. **Игра будет доступна по адресу:**
   ```
   https://neuropolis-ai.github.io/game-eric/
   ```

3. **Обновите URL в боте:**
   В файле `telegram_bot.py` измените:
   ```python
   GAME_URL = "https://neuropolis-ai.github.io/game-eric/"
   ```

### ⚡ Быстрый запуск локально

```bash
# Автоматический запуск
python3 start_bot.py

# Или ручной запуск
python3 -m http.server 8000  # Игровой сервер
python3 telegram_bot.py      # Telegram бот
```

## 🎮 Возможности

- **4 уникальных уровня** с боссами
- **Мобильная адаптация** с touch-управлением
- **Telegram интеграция** с хэптик-откликом
- **База данных** для статистики игроков
- **Система лидеров** и достижений
- **Готов к деплою** на любой HTTPS сервер

## 🔧 Технологии

- **Frontend:** HTML5 Canvas, CSS3, JavaScript ES6+
- **Backend:** Python 3.8+, aiogram 3.4+, SQLite
- **Integration:** Telegram Web Apps API
- **Deploy:** GitHub Pages, Vercel, Netlify

## 📱 Управление

### На компьютере:
- `A/←` - Влево | `D/→` - Вправо | `W/↑/Пробел` - Прыжок | `X/Z` - Атака

### На мобильном:
- ⬅️ Влево | ➡️ Вправо | ⬆️ Прыжок | 🍖 Атака

## 📊 Команды бота

- `/start` - Начать игру
- `/play` - Открыть игру  
- `/stats` - Моя статистика
- `/leaderboard` - Таблица лидеров
- `/help` - Помощь

## 🛠 Установка и настройка

См. подробные инструкции:
- [QUICK_START.md](./QUICK_START.md) - Быстрый запуск
- [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md) - Настройка Telegram бота

## 📄 Структура проекта

```
game-eric/
├── index.html              # Основная страница игры
├── style.css               # Стили и мобильная адаптация  
├── game.js                 # Игровая логика
├── telegram-web-app.js     # Telegram Web App интеграция
├── telegram_bot.py         # Telegram бот (Python)
├── requirements.txt        # Python зависимости
├── start_bot.py           # Автозапуск системы
├── .gitignore             # Git исключения
├── QUICK_START.md         # Быстрый старт
└── TELEGRAM_SETUP.md      # Настройка Telegram
```

## 🌟 Особенности

- **Кроссплатформенность:** Работает на десктопе и мобильных
- **Offline режим:** Игра работает без интернета после загрузки
- **Прогрессивная сложность:** Каждый уровень сложнее предыдущего
- **Тематическое оформление:** Уникальный дизайн для каждого босса
- **Социальные функции:** Шаринг результатов в Telegram

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Коммитьте изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Создайте Pull Request

## 📝 Лицензия

Проект доступен под лицензией MIT. См. файл [LICENSE](LICENSE) для подробностей.

## 🔥 Автор

Создано с ❤️ для друзей Эрика, которые любят шашлыки!

---

**🎮 Играй прямо сейчас:** [Открыть игру](https://neuropolis-ai.github.io/game-eric/) 