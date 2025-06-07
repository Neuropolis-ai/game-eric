#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Телеграм-бот для игры "Эрик зовёт на шашлык"
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    InlineKeyboardButton, 
    InlineKeyboardMarkup, 
    WebAppInfo,
    MenuButtonWebApp,
    Message,
    CallbackQuery
)
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
from aiohttp import web, ClientSession
import sqlite3
import hashlib
import hmac

# Настройки
BOT_TOKEN = "7635542013:AAF3pKAC1Icnaf46_qIRlNlF6I48Rojlmf8"  # Ваш токен от @BotFather
WEBHOOK_HOST = "https://your-domain.com"  # Ваш домен (для продакшена)
WEBHOOK_PATH = "/webhook"
WEBHOOK_URL = f"{WEBHOOK_HOST}{WEBHOOK_PATH}"
GAME_URL = "https://neuropolis-ai.github.io/game-eric/"  # GitHub Pages URL (HTTPS для Telegram Web App)
WEBAPP_PORT = 8443

# Флаг для локального тестирования
LOCAL_MODE = True  # Установите False для продакшена с webhook

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# База данных
def init_db():
    """Инициализация базы данных"""
    conn = sqlite3.connect('shashlik_game.db')
    cursor = conn.cursor()
    
    # Таблица пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица игровых результатов
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS game_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            level INTEGER,
            score INTEGER,
            victory BOOLEAN,
            play_time INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    # Таблица лидеров
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leaderboard (
            user_id INTEGER PRIMARY KEY,
            best_score INTEGER,
            victories INTEGER,
            total_games INTEGER,
            last_victory TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    conn.commit()
    conn.close()

class GameBot:
    def __init__(self, token: str):
        self.bot = Bot(token=token)
        self.dp = Dispatcher()
        self.setup_handlers()
        
    def setup_handlers(self):
        """Настройка обработчиков команд"""
        
        @self.dp.message(CommandStart())
        async def start_handler(message: Message):
            await self.handle_start(message)
            
        @self.dp.message(Command("play"))
        async def play_handler(message: Message):
            await self.handle_play(message)
            
        @self.dp.message(Command("stats"))
        async def stats_handler(message: Message):
            await self.handle_stats(message)
            
        @self.dp.message(Command("leaderboard"))
        async def leaderboard_handler(message: Message):
            await self.handle_leaderboard(message)
            
        @self.dp.message(Command("help"))
        async def help_handler(message: Message):
            await self.handle_help(message)
            
        @self.dp.callback_query()
        async def callback_handler(callback: CallbackQuery):
            await self.handle_callback(callback)
    
    async def handle_start(self, message: Message):
        """Обработчик команды /start"""
        user = message.from_user
        self.register_user(user)
        
        # Создание клавиатуры с веб-приложением
        keyboard = InlineKeyboardBuilder()
        keyboard.add(InlineKeyboardButton(
            text="🔥 Играть в \"Эрик зовёт на шашлык\" 🔥",
            web_app=WebAppInfo(url=GAME_URL)
        ))
        keyboard.add(InlineKeyboardButton(
            text="📊 Моя статистика",
            callback_data="stats"
        ))
        keyboard.add(InlineKeyboardButton(
            text="🏆 Таблица лидеров",
            callback_data="leaderboard"
        ))
        keyboard.adjust(1)
        
        welcome_text = f"""
🔥 Добро пожаловать в игру "Эрик зовёт на шашлык"! 🔥

Привет, {user.first_name}! 

🎮 **Сюжет игры:**
Эрик очень хочет собрать друзей на шашлыки, но каждый из них занят:
🚬 Влад курит плюшки
🍺 Макс пьёт пиво  
💻 Марк работает
🪖 Ден служит в армии

**Твоя задача:** Пройти 4 уровня и переубедить всех друзей!

🎯 **Управление:**
⬅️➡️ - Движение
⬆️ - Прыжок
🍖 - Атака шашлыком

Нажми кнопку ниже, чтобы начать играть! 👇
"""
        
        await message.answer(
            welcome_text,
            reply_markup=keyboard.as_markup()
        )
        
        # Установка кнопки меню
        await self.bot.set_chat_menu_button(
            chat_id=message.chat.id,
            menu_button=MenuButtonWebApp(
                text="🔥 Играть",
                web_app=WebAppInfo(url=GAME_URL)
            )
        )
    
    async def handle_play(self, message: Message):
        """Обработчик команды /play"""
        keyboard = InlineKeyboardBuilder()
        keyboard.add(InlineKeyboardButton(
            text="🎮 Открыть игру",
            web_app=WebAppInfo(url=GAME_URL)
        ))
        
        await message.answer(
            "🔥 Готов собирать друзей на шашлыки? Нажми кнопку! 🔥",
            reply_markup=keyboard.as_markup()
        )
    
    async def handle_stats(self, message: Message):
        """Обработчик команды /stats"""
        user_id = message.from_user.id
        stats = self.get_user_stats(user_id)
        
        if not stats['total_games']:
            await message.answer(
                "📊 У тебя пока нет игровой статистики.\n"
                "Сыграй первую игру, чтобы увидеть результаты! 🎮"
            )
            return
        
        stats_text = f"""
📊 **Твоя статистика:**

🎮 Всего игр: {stats['total_games']}
🏆 Побед: {stats['victories']}
💯 Лучший счёт: {stats['best_score']}
📈 Процент побед: {stats['win_rate']:.1f}%

🚬 Влада уговорил: {stats['vlad_defeats']} раз
🍺 Макса уговорил: {stats['max_defeats']} раз  
💻 Марка уговорил: {stats['mark_defeats']} раз
🪖 Дена уговорил: {stats['den_defeats']} раз

🔥 Последняя победа: {stats['last_victory']}
"""
        
        await message.answer(stats_text)
    
    async def handle_leaderboard(self, message: Message):
        """Обработчик команды /leaderboard"""
        leaderboard = self.get_leaderboard()
        
        if not leaderboard:
            await message.answer(
                "🏆 Таблица лидеров пока пуста.\n"
                "Стань первым! 🚀"
            )
            return
        
        leaderboard_text = "🏆 **Таблица лидеров:**\n\n"
        
        medals = ["🥇", "🥈", "🥉"]
        for i, player in enumerate(leaderboard[:10]):
            medal = medals[i] if i < 3 else f"{i+1}."
            name = player['first_name'] or player['username'] or "Аноним"
            leaderboard_text += f"{medal} {name} - {player['best_score']} очков\n"
        
        keyboard = InlineKeyboardBuilder()
        keyboard.add(InlineKeyboardButton(
            text="🎮 Играть и побить рекорд!",
            web_app=WebAppInfo(url=GAME_URL)
        ))
        
        await message.answer(
            leaderboard_text,
            reply_markup=keyboard.as_markup()
        )
    
    async def handle_help(self, message: Message):
        """Обработчик команды /help"""
        help_text = """
🎮 **Помощь по игре "Эрик зовёт на шашлык"**

**Команды бота:**
/start - Начать игру
/play - Открыть игру
/stats - Моя статистика
/leaderboard - Таблица лидеров
/help - Эта справка

**Как играть:**
1. Нажми кнопку "Играть" или используй команду /play
2. Управляй Эриком с помощью кнопок на экране
3. Переходи по платформам и избегай снарядов боссов
4. Подойди к боссу и нажми кнопку атаки (🍖)
5. Пройди все 4 уровня, чтобы собрать всех друзей

**Персонажи:**
🚬 Влад - Курит плюшки (бросает дым 💨)
🍺 Макс - Пьёт пиво (бросает бутылки 🍻)
💻 Марк - Работает (бросает документы 📋)
🪖 Ден - Служит в армии (бросает знаки отличия 🎖️)

**Цель:** Уговорить всех друзей пойти на шашлыки! 🔥

Удачи! 🍖
"""
        
        await message.answer(help_text)
    
    async def handle_callback(self, callback: CallbackQuery):
        """Обработчик callback запросов"""
        if callback.data == "stats":
            await self.handle_stats(callback.message)
        elif callback.data == "leaderboard":
            await self.handle_leaderboard(callback.message)
        
        await callback.answer()
    
    def register_user(self, user: types.User):
        """Регистрация пользователя в базе данных"""
        conn = sqlite3.connect('shashlik_game.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO users 
            (user_id, username, first_name, last_name, last_active)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            user.id,
            user.username,
            user.first_name,
            user.last_name,
            datetime.now()
        ))
        
        conn.commit()
        conn.close()
    
    def save_game_result(self, user_id: int, level: int, score: int, victory: bool):
        """Сохранение результата игры"""
        conn = sqlite3.connect('shashlik_game.db')
        cursor = conn.cursor()
        
        # Сохранение результата
        cursor.execute('''
            INSERT INTO game_results (user_id, level, score, victory, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, level, score, victory, datetime.now()))
        
        # Обновление таблицы лидеров
        cursor.execute('''
            INSERT OR REPLACE INTO leaderboard 
            (user_id, best_score, victories, total_games, last_victory)
            VALUES (
                ?,
                COALESCE(MAX(?, (SELECT best_score FROM leaderboard WHERE user_id = ?)), ?),
                COALESCE((SELECT victories FROM leaderboard WHERE user_id = ?) + ?, ?),
                COALESCE((SELECT total_games FROM leaderboard WHERE user_id = ?) + 1, 1),
                CASE WHEN ? THEN ? ELSE COALESCE((SELECT last_victory FROM leaderboard WHERE user_id = ?), NULL) END
            )
        ''', (
            user_id, score, user_id, score,
            user_id, 1 if victory else 0, 1 if victory else 0,
            user_id,
            victory, datetime.now() if victory else None, user_id
        ))
        
        conn.commit()
        conn.close()
    
    def get_user_stats(self, user_id: int) -> Dict:
        """Получение статистики пользователя"""
        conn = sqlite3.connect('shashlik_game.db')
        cursor = conn.cursor()
        
        # Основная статистика
        cursor.execute('''
            SELECT 
                COALESCE(best_score, 0) as best_score,
                COALESCE(victories, 0) as victories,
                COALESCE(total_games, 0) as total_games,
                last_victory
            FROM leaderboard WHERE user_id = ?
        ''', (user_id,))
        
        result = cursor.fetchone()
        
        if not result or result[2] == 0:
            conn.close()
            return {
                'best_score': 0, 'victories': 0, 'total_games': 0,
                'win_rate': 0, 'vlad_defeats': 0, 'max_defeats': 0,
                'mark_defeats': 0, 'den_defeats': 0, 'last_victory': 'Никогда'
            }
        
        best_score, victories, total_games, last_victory = result
        win_rate = (victories / total_games * 100) if total_games > 0 else 0
        
        # Статистика по уровням
        level_stats = {}
        for level in range(1, 5):
            cursor.execute('''
                SELECT COUNT(*) FROM game_results 
                WHERE user_id = ? AND level >= ? AND victory = 1
            ''', (user_id, level))
            level_stats[level] = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            'best_score': best_score,
            'victories': victories,
            'total_games': total_games,
            'win_rate': win_rate,
            'vlad_defeats': level_stats[1],
            'max_defeats': level_stats[2], 
            'mark_defeats': level_stats[3],
            'den_defeats': level_stats[4],
            'last_victory': last_victory or 'Никогда'
        }
    
    def get_leaderboard(self) -> List[Dict]:
        """Получение таблицы лидеров"""
        conn = sqlite3.connect('shashlik_game.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT l.best_score, u.first_name, u.username, l.victories
            FROM leaderboard l
            JOIN users u ON l.user_id = u.user_id
            ORDER BY l.best_score DESC, l.victories DESC
            LIMIT 10
        ''')
        
        results = cursor.fetchall()
        conn.close()
        
        return [
            {
                'best_score': row[0],
                'first_name': row[1],
                'username': row[2],
                'victories': row[3]
            }
            for row in results
        ]

# Веб-сервер для обработки данных от игры
async def webhook_handler(request):
    """Обработчик webhook от Telegram"""
    bot = request.app["bot"]
    data = await request.json()
    
    # Обработка обновлений от Telegram
    await bot.dp.feed_webhook_update(bot, types.Update(**data))
    
    return web.Response()

async def game_data_handler(request):
    """Обработчик данных от игры"""
    bot_instance = request.app["bot_instance"]
    
    try:
        # Проверка данных Telegram Web App
        data = await request.json()
        init_data = data.get('init_data', '')
        
        if not verify_telegram_data(init_data):
            return web.json_response({'error': 'Invalid data'}, status=400)
        
        # Обработка игровых данных
        game_data = data.get('game_data', {})
        action = game_data.get('action')
        
        if action == 'game_result':
            user_id = game_data['user_id']
            level = game_data['level']
            score = game_data['score']
            victory = game_data['victory']
            
            bot_instance.save_game_result(user_id, level, score, victory)
            
            # Отправка поздравления при победе
            if victory:
                await send_victory_message(bot_instance.bot, user_id, score)
        
        elif action == 'share_result':
            text = game_data.get('text', '')
            user_id = game_data['user_id']
            
            # Создание сообщения для шаринга
            keyboard = InlineKeyboardBuilder()
            keyboard.add(InlineKeyboardButton(
                text="🎮 Играть тоже!",
                web_app=WebAppInfo(url=GAME_URL)
            ))
            
            await bot_instance.bot.send_message(
                user_id,
                f"{text}\n\nПопробуй и ты! 👇",
                reply_markup=keyboard.as_markup()
            )
        
        return web.json_response({'status': 'ok'})
        
    except Exception as e:
        logger.error(f"Error processing game data: {e}")
        return web.json_response({'error': 'Internal error'}, status=500)

def verify_telegram_data(init_data: str) -> bool:
    """Проверка подлинности данных от Telegram Web App"""
    try:
        # Простейшая проверка - в реальном проекте нужна полная верификация
        return bool(init_data)
    except:
        return False

async def send_victory_message(bot: Bot, user_id: int, score: int):
    """Отправка сообщения о победе"""
    victory_text = f"""
🎉 **Поздравляем с победой!** 🎉

🔥 Ты помог Эрику собрать всех друзей на шашлыки!
💯 Твой счёт: {score} очков

Все друзья теперь готовы к шашлычной вечеринке:
🚬 Влад оставил плюшки
🍺 Макс отложил пиво
💻 Марк закрыл ноутбук  
🪖 Ден получил увольнительную

🍖 Шашлык удался! Все в сборе! 🔥
"""
    
    keyboard = InlineKeyboardBuilder()
    keyboard.add(InlineKeyboardButton(
        text="🎮 Играть ещё раз",
        web_app=WebAppInfo(url=GAME_URL)
    ))
    keyboard.add(InlineKeyboardButton(
        text="🏆 Таблица лидеров",
        callback_data="leaderboard"
    ))
    keyboard.adjust(1)
    
    try:
        await bot.send_message(
            user_id,
            victory_text,
            reply_markup=keyboard.as_markup()
        )
    except Exception as e:
        logger.error(f"Error sending victory message: {e}")

async def main():
    """Основная функция запуска бота"""
    # Инициализация базы данных
    init_db()
    
    # Создание бота
    bot_instance = GameBot(BOT_TOKEN)
    bot = bot_instance.bot
    
    if LOCAL_MODE:
        # Локальный режим с polling (для тестирования)
        logger.info("Запуск бота в локальном режиме (polling)")
        
        # Удаляем webhook для локального режима
        await bot.delete_webhook(drop_pending_updates=True)
        
        # Запуск polling
        try:
            await bot_instance.dp.start_polling(bot)
        except KeyboardInterrupt:
            logger.info("Бот остановлен")
        finally:
            await bot.session.close()
    else:
        # Продакшен режим с webhook
        logger.info("Запуск бота в продакшен режиме (webhook)")
        
        # Настройка webhook
        await bot.set_webhook(WEBHOOK_URL)
        
        # Создание веб-приложения
        app = web.Application()
        app["bot"] = bot
        app["bot_instance"] = bot_instance
        
        # Маршруты
        app.router.add_post(WEBHOOK_PATH, webhook_handler)
        app.router.add_post("/game_data", game_data_handler)
        
        # Статические файлы (если размещаете игру на том же сервере)
        # app.router.add_static('/', path='./game', name='game')
        
        # Запуск сервера
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', WEBAPP_PORT)
        await site.start()
        
        logger.info(f"Бот запущен на порту {WEBAPP_PORT}")
        logger.info(f"Webhook URL: {WEBHOOK_URL}")
        
        # Бесконечный цикл
        try:
            await asyncio.Future()  # run forever
        except KeyboardInterrupt:
            pass
        finally:
            await runner.cleanup()
            await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main()) 