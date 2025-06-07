#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Простой скрипт запуска телеграм-бота
"""

import subprocess
import sys
import os

def check_dependencies():
    """Проверка и установка зависимостей"""
    try:
        import aiogram
        import aiohttp
        print("✅ Все зависимости установлены")
        return True
    except ImportError:
        print("❌ Некоторые зависимости не установлены")
        print("🔄 Устанавливаю зависимости...")
        
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print("✅ Зависимости успешно установлены")
            return True
        except subprocess.CalledProcessError:
            print("❌ Ошибка при установке зависимостей")
            print("Попробуйте выполнить вручную: pip install -r requirements.txt")
            return False

def start_game_server():
    """Запуск игрового сервера"""
    print("🎮 Запускаю игровой сервер на http://localhost:8000")
    try:
        # Запуск в фоновом режиме
        process = subprocess.Popen([
            sys.executable, "-m", "http.server", "8000"
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        print("✅ Игровой сервер запущен")
        return process
    except Exception as e:
        print(f"❌ Ошибка при запуске игрового сервера: {e}")
        return None

def start_bot():
    """Запуск телеграм-бота"""
    print("🤖 Запускаю телеграм-бота...")
    try:
        subprocess.run([sys.executable, "telegram_bot.py"])
    except KeyboardInterrupt:
        print("\n🛑 Бот остановлен пользователем")
    except Exception as e:
        print(f"❌ Ошибка при запуске бота: {e}")

def main():
    print("🔥 Запуск системы 'Эрик зовёт на шашлык' 🔥")
    print("=" * 50)
    
    # Проверка зависимостей
    if not check_dependencies():
        return
    
    # Запуск игрового сервера
    game_server = start_game_server()
    
    try:
        # Запуск бота
        start_bot()
    finally:
        # Остановка игрового сервера
        if game_server:
            print("🛑 Останавливаю игровой сервер...")
            game_server.terminate()
            game_server.wait()
            print("✅ Игровой сервер остановлен")

if __name__ == "__main__":
    main() 