# Интернет-магазин фотоаппаратов

Полнофункциональное веб-приложение с Django backend и React frontend.

## 📋 Требования

- Python 3.11+
- Node.js 18+
- npm или yarn

## 🚀 Установка и запуск

### 1. Клонирование репозитория

```bash
git clone https://github.com/Reiniaw/diplom_college
cd diplom/backend
```

### 2. Настройка Backend (Django)

#### Создание виртуального окружения
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Установка зависимостей
```bash
pip install -r requirements.txt
```

#### Создание файла .env
```bash
# Скопируйте .env.example в .env
cp .env.example .env
# Отредактируйте .env с вашими настройками
```

#### Инициализация базы данных
```bash
python manage.py migrate
```

#### Создание суперпользователя (администратор)
```bash
python manage.py createsuperuser
```

#### Инициализация технических полей (если нужно)
```bash
python manage.py init_tech_fields
```

#### Запуск backend сервера
```bash
python manage.py runserver
```
Backend будет доступен по адресу: `http://localhost:8000`

---

### 3. Настройка Frontend (React)

#### Установка зависимостей
```bash
cd frontend
npm install
```

#### Запуск frontend сервера
```bash
npm start
```
Frontend будет доступен по адресу: `http://localhost:3000`

---

## 📁 Структура проекта

```
backend/
├── backend/              # Конфигурация Django
│   ├── settings.py      # Настройки проекта
│   ├── urls.py          # Маршруты
│   └── wsgi.py          # WSGI конфигурация
├── shop/                # Основное приложение
│   ├── models.py        # Модели БД
│   ├── views.py         # Views/API endpoints
│   ├── serializers.py   # DRF serializers
│   └── migrations/      # Миграции БД
├── frontend/            # React приложение
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── pages/       # Страницы
│   │   └── services/    # API клиент
│   └── public/          # Статические файлы
├── media/               # Загруженные файлы (продукты)
├── db.sqlite3           # SQLite база (создается автоматически)
├── manage.py            # Django управление
├── requirements.txt     # Python зависимости
├── .env                 # Переменные окружения (не коммитьте!)
└── .gitignore          # Исключения для git
```

---

## 🔧 Полезные команды

### Django
```bash
# Миграции БД
python manage.py makemigrations
python manage.py migrate

# Собрать статические файлы
python manage.py collectstatic

# Запуск тестов
python manage.py test

# Админ панель
http://localhost:8000/admin
```

### React
```bash
# Сборка для продакшена
npm run build

# Запуск тестов
npm test

# Эжект (осторожно, необратимо!)
npm run eject
```

---

## 🔐 Безопасность

### ⚠️ Важно перед первой установкой:

1. **Переменные окружения** - создайте `.env` из `.env.example`
2. **SECRET_KEY** - измените SECRET_KEY в `.env` на новый случайный ключ:
   ```python
   from django.core.management.utils import get_random_secret_key
   print(get_random_secret_key())
   ```
3. **DEBUG** - установите `DEBUG=False` для production
4. **ALLOWED_HOSTS** - добавьте ваш домен

### Производство (Production):
```env
DEBUG=False
SECRET_KEY=<генерируемый-ключ>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

---

## 🐛 Решение проблем

### Ошибка: "ModuleNotFoundError"
- Убедитесь, что виртуальное окружение активировано
- Переустановите зависимости: `pip install -r requirements.txt`

### Ошибка: "No such table"
- Запустите миграции: `python manage.py migrate`

### CORS ошибки
- Проверьте `CORS_ALLOWED_ORIGINS` в settings.py
- Убедитесь, что frontend и backend работают на правильных портах

### Frontend не подключается к Backend
- Проверьте URL в `frontend/src/services/api.js`
- Убедитесь, что backend запущен на `http://localhost:8000`

---

## 📝 Примечания

- Все важные файлы коммитятся в git, кроме `.env`, `db.sqlite3` и `node_modules`
- База данных пересоздается при миграциях
- Для продакшена используйте реальную БД (PostgreSQL вместо SQLite)

---

## 📞 Поддержка

Для вопросов обратитесь к документации:
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Django REST Framework](https://www.django-rest-framework.org/)
