#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для сброса состояния Telegram бота
"""

import asyncio
from aiogram import Bot

BOT_TOKEN = "7635542013:AAF3pKAC1Icnaf46_qIRlNlF6I48Rojlmf8"

async def reset_bot():
    """Сброс состояния бота"""
    bot = Bot(token=BOT_TOKEN)
    
    try:
        print("🔄 Удаляю webhook...")
        await bot.delete_webhook(drop_pending_updates=True)
        print("✅ Webhook удален")
        
        print("ℹ️ Получаю информацию о боте...")
        me = await bot.get_me()
        print(f"🤖 Бот: @{me.username} ({me.first_name})")
        
        print("✅ Бот готов к запуску!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(reset_bot()) 