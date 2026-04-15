# 📦 Переносимость проекта: Полный гайд

После выполнения этих шагов проект можно открыть на любом компьютере!

---

## ✅ Что уже готово

- ✅ `requirements.txt` - все Python зависимости
- ✅ `.env.example` - шаблон переменных окружения  
- ✅ `.gitignore` - исключения для git
- ✅ `settings.py` - использует переменные окружения
- ✅ `setup.bat` / `setup.sh` - автоматическая установка
- ✅ `README.md` - документация

---

## 🚀 Способ 1: Использование Git (РЕКОМЕНДУЕТСЯ)

Самый надежный способ - использовать Git для отправки на другой компьютер.

### На исходном компьютере:

```bash
cd c:\Users\admin\Desktop\diplom\backend

# Инициализировать git (если еще нет)
git init

# Добавить все файлы
git add .

# Коммитнуть
git commit -m "Initial commit: full working project"

# Отправить на GitHub/GitLab
git remote add origin https://github.com/username/diplom.git
git push -u origin main
```

### На новом компьютере:

```bash
# Клонировать репозиторий
git clone https://github.com/username/diplom.git
cd diplom/backend

# Windows
setup.bat

# macOS/Linux
bash setup.sh
```

---

## 📁 Способ 2: Копирование вручную

Если не используете Git:

### Что скопировать целиком:
```
✅ backend/
✅ frontend/
✅ shop/
✅ media/
✅ manage.py
✅ requirements.txt
✅ .env.example
✅ .gitignore
✅ README.md
✅ setup.bat / setup.sh
```

### Что НЕ копировать:
```
❌ db.sqlite3        (пересоздается)
❌ venv/             (устанавливается заново)
❌ frontend/node_modules/ (устанавливается заново)
❌ __pycache__       (создается автоматически)
❌ .git/             (опционально)
```

### Размер проекта для передачи:
- С исходным кодом: ~50-100 MB
- Без node_modules и venv: ~5-10 MB

---

## 🔧 На новом компьютере

### Вариант А: Автоматическая установка (ПРОЩЕ)

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
bash setup.sh
```

Скрипт выполнит:
1. ✅ Создание виртуального окружения
2. ✅ Установка Python зависимостей
3. ✅ Создание .env файла
4. ✅ Миграция БД
5. ✅ Установка Node.js зависимостей

### Вариант Б: Ручная установка (ПОДРОБНЕЕ)

**1. Python Backend:**
```bash
# Создать виртуальное окружение
python -m venv venv

# Активировать (Windows)
venv\Scripts\activate

# Активировать (macOS/Linux)
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt

# Создать .env файл
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux

# Миграции БД
python manage.py migrate

# Создать админа
python manage.py createsuperuser

# Запустить сервер
python manage.py runserver
```

**2. React Frontend (в новом терминале):**
```bash
cd frontend

# Установить зависимости
npm install

# Запустить dev сервер
npm start
```

---

## 🔐 Первая запуск: Генерация SECRET_KEY

После клонирования/копирования нужно обновить SECRET_KEY:

```bash
python manage.py shell
```

В Python shell:
```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

Скопируйте результат в `.env`:
```env
SECRET_KEY=<paste-generated-key-here>
```

---

## 💾 Использование Make (Linux/macOS)

Для удобства используйте Makefile:

```bash
make help          # Показать все команды
make setup         # Полная установка
make run-backend   # Запустить backend
make run-frontend  # Запустить frontend
make migrate       # Миграции БД
make createsuperuser # Создать админа
```

---

## 🐳 Вариант 3: Использование Docker (ПРОДВИНУТО)

Для максимальной портативности используйте Docker:

**Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
ENV DEBUG=False
EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DEBUG=False
      - DATABASE_URL=sqlite:///db.sqlite3
    volumes:
      - ./media:/app/media

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
```

Запуск:
```bash
docker-compose up
```

---

## ✅ Чек-лист после установки

- [ ] Python: `python --version` (должно быть 3.11+)
- [ ] Pip пакеты: `pip list | grep Django`
- [ ] Node.js: `node --version` (должно быть 18+)
- [ ] npm: `npm --version`
- [ ] БД миграции: `python manage.py showmigrations`
- [ ] Админ-панель: http://localhost:8000/admin
- [ ] Frontend: http://localhost:3000
- [ ] API: http://localhost:8000/api

---

## 🚨 Проблемы и решения

### Python не найден
```bash
# Убедитесь, что Python добавлен в PATH:
python --version
# Если не работает, используйте полный путь или переинсталлируйте Python
```

### ModuleNotFoundError
```bash
# Убедитесь, что виртуальное окружение активировано
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Переустановите зависимости
pip install -r requirements.txt
```

### Ошибка БД "No such table"
```bash
# Запустите миграции
python manage.py migrate
```

### CORS ошибки
```bash
# Проверьте .env
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Или в settings.py проверьте ALLOWED_HOSTS
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend не подключается к Backend
```bash
# Убедитесь, что Backend запущен на http://localhost:8000
# Проверьте frontend/src/services/api.js
```

---

## 📞 Полезные команды

```bash
# Django
python manage.py migrate              # Миграции БД
python manage.py makemigrations       # Создать миграции
python manage.py createsuperuser      # Создать админа
python manage.py collectstatic        # Собрать статику
python manage.py runserver            # Запустить сервер
python manage.py shell                # Python shell

# Frontend
npm start                             # Dev сервер
npm run build                         # Production сборка
npm test                              # Запустить тесты

# Утилиты
pip freeze > requirements.txt         # Обновить зависимости
pip install -r requirements.txt       # Установить зависимости
```

---

## ✨ Готово!

Проект полностью портативен и готов к передаче на другой компьютер! 🎉

Любые вопросы - смотрите README.md или документацию Django/React.
