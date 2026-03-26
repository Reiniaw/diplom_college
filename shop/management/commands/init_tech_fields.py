from django.core.management.base import BaseCommand
from shop.models import TechField

class Command(BaseCommand):
    help = 'Инициализация стандартных технических полей'

    def handle(self, *args, **options):
        DEFAULT_FIELDS = [
            {'key': 'megapixels', 'label': 'Мегапиксели'},
            {'key': 'sensor_type', 'label': 'Тип матрицы'},
            {'key': 'video_resolution', 'label': 'Разрешение видео'},
            {'key': 'weight', 'label': 'Вес'},
            {'key': 'power', 'label': 'Мощность (Вт)'},
            {'key': 'frequency', 'label': 'Частотный диапазон'},
            {'key': 'battery_life', 'label': 'Время работы (ч)'},
            {'key': 'connection', 'label': 'Подключение'},
        ]

        for field_data in DEFAULT_FIELDS:
            tech_field, created = TechField.objects.get_or_create(
                key=field_data['key'],
                defaults={'label': field_data['label']}
            )
            status = "создано" if created else "уже существует"
            self.stdout.write(self.style.SUCCESS(f'✓ {field_data["label"]} ({status})'))

        self.stdout.write(self.style.SUCCESS('Инициализация завершена!'))
