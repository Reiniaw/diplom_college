# 🚀 БЫСТРЫЙ СТАРТ

Следуйте этим 3 шагам, чтобы запустить проект на новом компьютере!

---

## Шаг 1️⃣ — Загрузи проект

```bash
# Вариант A: Git (рекомендуется)
git clone https://github.com/your-username/diplom.git
cd diplom/backend

# Вариант B: Скопируй папку вручную
cd path/to/copied/diplom/backend
```

---

## Шаг 2️⃣ — Запусти setup скрипт

### Windows:
```bash
setup.bat
```

### macOS/Linux:
```bash
bash setup.sh
```

Скрипт выполнит всё автоматически  ✨

---

## Шаг 3️⃣ — Запусти оба сервера

### Терминал 1: Backend
```bash
python manage.py runserver
```
➡️ Откроется на http://localhost:8000

### Терминал 2: Frontend
```bash
cd frontend
npm start
```
➡️ Откроется на http://localhost:3000

---

## 🎯 Если хочешь больше деталей

📖 Читай **[README.md](README.md)** — полная документация  
📦 Читай **[PORTABLE.md](PORTABLE.md)** — гайд по переносимости  

---

## ❓ Ошибок при установке?

- Python не найден? → Переинсталлируй [Python 3.11+](https://www.python.org/)
- Node.js не найден? → Переинсталлируй [Node.js 18+](https://nodejs.org/)
- Другая ошибка? → Смотри раздел "Проблемы и решения" в PORTABLE.md

---

**Готово!** 🎉 Проект работает!
