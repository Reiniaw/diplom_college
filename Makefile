# Makefile for development tasks

.PHONY: help setup install migrate createsuperuser run-backend run-frontend run-all clean

help:
	@echo "Available commands:"
	@echo "  make setup          - Full project setup"
	@echo "  make install        - Install dependencies"
	@echo "  make migrate        - Run Django migrations"
	@echo "  make createsuperuser - Create Django admin user"
	@echo "  make run-backend    - Run Django server"
	@echo "  make run-frontend   - Run React server"
	@echo "  make run-all        - Run both servers (requires 2 terminals)"
	@echo "  make clean          - Clean up temporary files"

setup:
	python -m venv venv
	. venv/bin/activate && pip install -r requirements.txt
	cp .env.example .env
	python manage.py migrate
	cd frontend && npm install && cd ..

install:
	pip install -r requirements.txt
	cd frontend && npm install && cd ..

migrate:
	python manage.py migrate

createsuperuser:
	python manage.py createsuperuser

run-backend:
	python manage.py runserver

run-frontend:
	cd frontend && npm start

run-all:
	@echo "Starting Django backend..."
	@echo "In another terminal, run: cd frontend && npm start"
	python manage.py runserver

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf frontend/build
	rm -rf frontend/node_modules
	rm -rf venv
