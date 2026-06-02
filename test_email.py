#!/usr/bin/env python
"""
Скрипт для тестирования отправки email через Django
Запусти: python test_email.py
"""
import os
import django
from django.core.mail import send_mail
from django.conf import settings

# Инициализируем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

print("=" * 60)
print("🧪 ТЕСТИРОВАНИЕ EMAIL КОНФИГУРАЦИИ")
print("=" * 60)

# Показываем текущие настройки
print(f"\n📧 EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"📧 EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"📧 EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"📧 EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"📧 EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"📧 DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

# Проверяем заполнены ли обязательные поля
if not settings.EMAIL_HOST_USER:
    print("\n❌ ОШИБКА: EMAIL_HOST_USER не установлен в .env")
    print("   Добавь в .env: EMAIL_HOST_USER=твой@gmail.com")
    exit(1)

if not settings.EMAIL_HOST_PASSWORD:
    print("\n❌ ОШИБКА: EMAIL_HOST_PASSWORD не установлен в .env")
    print("   Добавь в .env: EMAIL_HOST_PASSWORD=твой_пароль_приложения")
    exit(1)

# Пытаемся отправить тестовое письмо
print("\n" + "=" * 60)
print("📤 Попытка отправить тестовое письмо...")
print("=" * 60)

try:
    result = send_mail(
        subject='🧪 Pro Lens - Тест Email',
        message='Это тестовое письмо. Если ты его видишь - email конфигурация работает! ✅',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.EMAIL_HOST_USER],  # Отправляем самому себе
        fail_silently=False,
        html_message='''
        <html>
            <body style="font-family: Arial; background: #f5f5f5; padding: 20px;">
                <div style="background: white; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #38bdf8;">🧪 Pro Lens - Email Test</h2>
                    <p>Это тестовое письмо.</p>
                    <p style="color: green; font-weight: bold;">Если ты его видишь - email конфигурация работает! ✅</p>
                </div>
            </body>
        </html>
        '''
    )
    
    if result == 1:
        print("\n✅ УСПЕХ! Письмо отправлено!")
        print(f"   Проверь входящие письма на: {settings.EMAIL_HOST_USER}")
        print("\n💡 Если письмо не пришло в 2 минуты:")
        print("   1. Проверь папку СПАМ")
        print("   2. Убедись что пароль приложения правильный")
        print("   3. Включи 2FA на Google аккаунте")
    else:
        print("\n❌ ОШИБКА: send_mail() вернул 0")
        
except Exception as e:
    print(f"\n❌ ОШИБКА ОТПРАВКИ:")
    print(f"   {type(e).__name__}: {str(e)}")
    print("\n💡 Возможные решения:")
    print("   1. Проверь EMAIL_HOST_USER и EMAIL_HOST_PASSWORD в .env")
    print("   2. Убедись что 2FA включена на Google аккаунте")
    print("   3. Используй пароль ПРИЛОЖЕНИЯ, не обычный пароль Gmail")
    print("   4. Проверь интернет соединение")

print("\n" + "=" * 60)
