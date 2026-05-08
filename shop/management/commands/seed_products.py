"""
Команда для заполнения базы данных товарами.

Использование:
1. Положи этот файл в папку: shop/management/commands/seed_products.py
   (папки management и commands создай сам, если их нет)
2. В папках management/ и commands/ создай пустые файлы __init__.py
3. Запусти: python manage.py seed_products
"""

from django.core.management.base import BaseCommand
from shop.models import Category, Product, TechField


class Command(BaseCommand):
    help = 'Заполняет базу данных тестовыми товарами'

    def handle(self, *args, **kwargs):
        self.stdout.write('Создаём технические поля...')

        # --- ТЕХНИЧЕСКИЕ ПОЛЯ ---
        tf_mp, _      = TechField.objects.get_or_create(key='megapixels',      defaults={'label': 'Мегапиксели'})
        tf_sensor, _  = TechField.objects.get_or_create(key='sensor_type',     defaults={'label': 'Тип матрицы'})
        tf_video, _   = TechField.objects.get_or_create(key='video_res',       defaults={'label': 'Разрешение видео'})
        tf_weight, _  = TechField.objects.get_or_create(key='weight',          defaults={'label': 'Вес (г)'})
        tf_zoom, _    = TechField.objects.get_or_create(key='optical_zoom',    defaults={'label': 'Оптический зум'})
        tf_battery, _ = TechField.objects.get_or_create(key='battery_life',    defaults={'label': 'Время работы (ч)'})
        tf_conn, _    = TechField.objects.get_or_create(key='connection',      defaults={'label': 'Подключение'})
        tf_stab, _    = TechField.objects.get_or_create(key='stabilization',   defaults={'label': 'Стабилизация'})
        tf_screen, _  = TechField.objects.get_or_create(key='screen_size',     defaults={'label': 'Экран (дюйм)'})
        tf_mount, _   = TechField.objects.get_or_create(key='mount',           defaults={'label': 'Байонет'})
        tf_focal, _   = TechField.objects.get_or_create(key='focal_length',    defaults={'label': 'Фокусное расстояние'})
        tf_aperture, _= TechField.objects.get_or_create(key='aperture',        defaults={'label': 'Диафрагма'})
        tf_power, _   = TechField.objects.get_or_create(key='power',           defaults={'label': 'Мощность (Вт)'})
        tf_angle, _   = TechField.objects.get_or_create(key='angle',           defaults={'label': 'Угол обзора'})
        tf_storage, _ = TechField.objects.get_or_create(key='storage',         defaults={'label': 'Носитель'})

        # --- КАТЕГОРИИ ---
        self.stdout.write('Создаём категории...')

        cat_dslr, _ = Category.objects.get_or_create(name='Зеркальные камеры')
        cat_dslr.tech_fields.set([tf_mp, tf_sensor, tf_video, tf_weight, tf_mount, tf_stab, tf_screen, tf_storage])

        cat_mirrorless, _ = Category.objects.get_or_create(name='Беззеркальные камеры')
        cat_mirrorless.tech_fields.set([tf_mp, tf_sensor, tf_video, tf_weight, tf_mount, tf_stab, tf_screen, tf_conn])

        cat_compact, _ = Category.objects.get_or_create(name='Компактные камеры')
        cat_compact.tech_fields.set([tf_mp, tf_zoom, tf_video, tf_weight, tf_battery, tf_screen, tf_stab])

        cat_action, _ = Category.objects.get_or_create(name='Экшн-камеры')
        cat_action.tech_fields.set([tf_mp, tf_video, tf_weight, tf_battery, tf_conn, tf_stab, tf_angle])

        cat_lens, _ = Category.objects.get_or_create(name='Объективы')
        cat_lens.tech_fields.set([tf_mount, tf_focal, tf_aperture, tf_weight, tf_stab])

        cat_video, _ = Category.objects.get_or_create(name='Видеокамеры')
        cat_video.tech_fields.set([tf_mp, tf_video, tf_zoom, tf_weight, tf_battery, tf_stab, tf_conn, tf_screen])

        cat_tripod, _ = Category.objects.get_or_create(name='Штативы и стабилизаторы')
        cat_tripod.tech_fields.set([tf_weight, tf_conn, tf_battery])

        cat_light, _ = Category.objects.get_or_create(name='Осветительное оборудование')
        cat_light.tech_fields.set([tf_power, tf_conn, tf_weight])

        # --- ТОВАРЫ ---
        self.stdout.write('Создаём товары...')

        products_data = [

            # === ЗЕРКАЛЬНЫЕ КАМЕРЫ ===
            {
                'category': cat_dslr, 'name': 'Canon EOS 850D', 'price': 320000,
                'stock': 5, 'description': 'Отличная зеркальная камера для начинающих и продвинутых фотографов. Имеет поворотный экран и поддержку 4K видео.',
                'megapixels': '24.1', 'sensor_type': 'APS-C CMOS', 'video_resolution': '4K UHD',
                'weight': '515', 'mount': 'Canon EF-S', 'stabilization': 'Оптическая (IS)',
                'screen_size': '3.0', 'storage': 'SD/SDHC/SDXC',
            },
            {
                'category': cat_dslr, 'name': 'Nikon D7500', 'price': 410000,
                'stock': 4, 'description': 'Полупрофессиональная зеркалка с отличным автофокусом и высокой скоростью серийной съёмки 8 к/с.',
                'megapixels': '20.9', 'sensor_type': 'APS-C CMOS', 'video_resolution': '4K UHD',
                'weight': '640', 'mount': 'Nikon F', 'stabilization': 'Нет (в объективе)',
                'screen_size': '3.2', 'storage': 'SD/SDHC/SDXC',
            },
            {
                'category': cat_dslr, 'name': 'Canon EOS 90D', 'price': 560000,
                'stock': 3, 'description': 'Профессиональная зеркальная камера с 45-точечной системой автофокусировки и защитой от пыли и влаги.',
                'megapixels': '32.5', 'sensor_type': 'APS-C CMOS', 'video_resolution': '4K UHD',
                'weight': '701', 'mount': 'Canon EF-S', 'stabilization': 'Оптическая (IS)',
                'screen_size': '3.0', 'storage': 'SD/SDHC/SDXC',
            },
            {
                'category': cat_dslr, 'name': 'Nikon D780', 'price': 890000,
                'stock': 2, 'description': 'Флагманская зеркалка Nikon с полнокадровым сенсором и гибридной системой автофокуса.',
                'megapixels': '24.5', 'sensor_type': 'Full-Frame CMOS', 'video_resolution': '4K UHD',
                'weight': '755', 'mount': 'Nikon F', 'stabilization': 'Нет (в объективе)',
                'screen_size': '3.2', 'storage': 'SD/SDHC/SDXC',
            },
            {
                'category': cat_dslr, 'name': 'Pentax K-3 Mark III', 'price': 750000,
                'stock': 3, 'description': 'Профессиональная APS-C зеркалка с встроенной стабилизацией и защитой от погодных условий.',
                'megapixels': '25.7', 'sensor_type': 'APS-C CMOS', 'video_resolution': 'Full HD',
                'weight': '820', 'mount': 'Pentax K', 'stabilization': 'Сенсорная (5 осей)',
                'screen_size': '3.2', 'storage': 'SD/SDHC/SDXC',
            },

            # === БЕЗЗЕРКАЛЬНЫЕ КАМЕРЫ ===
            {
                'category': cat_mirrorless, 'name': 'Sony Alpha A7 IV', 'price': 1450000,
                'stock': 3, 'description': 'Профессиональная беззеркальная камера с полнокадровым BSI-CMOS сенсором нового поколения.',
                'megapixels': '33', 'sensor_type': 'Full-Frame BSI-CMOS', 'video_resolution': '4K 60fps',
                'weight': '658', 'mount': 'Sony E', 'stabilization': 'Сенсорная 5-осевая',
                'screen_size': '3.0', 'connection': 'Wi-Fi, Bluetooth',
            },
            {
                'category': cat_mirrorless, 'name': 'Fujifilm X-T5', 'price': 1100000,
                'stock': 4, 'description': 'Беззеркалка с рекордным 40 МП APS-C сенсором и классическим дизайном в стиле плёночных камер.',
                'megapixels': '40.2', 'sensor_type': 'APS-C X-Trans CMOS 5', 'video_resolution': '6.2K',
                'weight': '557', 'mount': 'Fujifilm X', 'stabilization': 'Сенсорная 7-осевая',
                'screen_size': '3.0', 'connection': 'Wi-Fi, Bluetooth',
            },
            {
                'category': cat_mirrorless, 'name': 'Canon EOS R6 Mark II', 'price': 1350000,
                'stock': 3, 'description': 'Высокоскоростная беззеркалка для спортивной и репортажной съёмки с 40 к/с серийной съёмкой.',
                'megapixels': '24.2', 'sensor_type': 'Full-Frame CMOS', 'video_resolution': '4K 60fps',
                'weight': '588', 'mount': 'Canon RF', 'stabilization': 'Сенсорная 8-осевая',
                'screen_size': '3.0', 'connection': 'Wi-Fi, Bluetooth',
            },
            {
                'category': cat_mirrorless, 'name': 'Nikon Z6 III', 'price': 1600000,
                'stock': 2, 'description': 'Флагманская беззеркалка Nikon с частично стекированным сенсором и записью видео 6K RAW.',
                'megapixels': '24.5', 'sensor_type': 'Full-Frame Stacked CMOS', 'video_resolution': '6K RAW',
                'weight': '760', 'mount': 'Nikon Z', 'stabilization': 'Сенсорная 8-осевая',
                'screen_size': '3.2', 'connection': 'Wi-Fi, Bluetooth',
            },
            {
                'category': cat_mirrorless, 'name': 'Sony ZV-E10 II', 'price': 480000,
                'stock': 8, 'description': 'Компактная беззеркалка для влогинга с отличным автофокусом и поворотным экраном.',
                'megapixels': '26', 'sensor_type': 'APS-C CMOS', 'video_resolution': '4K 30fps',
                'weight': '291', 'mount': 'Sony E', 'stabilization': 'Электронная',
                'screen_size': '3.0', 'connection': 'Wi-Fi, Bluetooth',
            },

            # === КОМПАКТНЫЕ КАМЕРЫ ===
            {
                'category': cat_compact, 'name': 'Sony RX100 VII', 'price': 680000,
                'stock': 6, 'description': 'Флагманский компакт с 1-дюймовым сенсором, выдвижным видоискателем и скоростью 20 к/с.',
                'megapixels': '20.1', 'optical_zoom': '8x', 'video_resolution': '4K HDR',
                'weight': '302', 'battery_life': '260', 'screen_size': '3.0', 'stabilization': 'Оптическая',
            },
            {
                'category': cat_compact, 'name': 'Canon PowerShot G7 X III', 'price': 460000,
                'stock': 7, 'description': 'Популярный компакт для влогеров с вертикальной видеосъёмкой и прямой трансляцией.',
                'megapixels': '20.1', 'optical_zoom': '4.2x', 'video_resolution': '4K',
                'weight': '304', 'battery_life': '235', 'screen_size': '3.0', 'stabilization': 'Оптическая',
            },
            {
                'category': cat_compact, 'name': 'Ricoh GR IIIx', 'price': 580000,
                'stock': 4, 'description': 'Культовый уличный компакт с APS-C сенсором и эквивалентным фокусом 40 мм.',
                'megapixels': '24.2', 'optical_zoom': '1x', 'video_resolution': 'Full HD',
                'weight': '262', 'battery_life': '200', 'screen_size': '3.0', 'stabilization': 'Сенсорная',
            },

            # === ЭКШН-КАМЕРЫ ===
            {
                'category': cat_action, 'name': 'GoPro HERO13 Black', 'price': 250000,
                'stock': 12, 'description': 'Лучшая экшн-камера для экстремальных видов спорта. Водонепроницаемость до 10 м без бокса.',
                'megapixels': '27', 'video_resolution': '5.3K 60fps',
                'weight': '154', 'battery_life': '3.5', 'connection': 'Wi-Fi, Bluetooth',
                'stabilization': 'HyperSmooth 6.0', 'angle': '156°',
            },
            {
                'category': cat_action, 'name': 'DJI Osmo Action 4', 'price': 220000,
                'stock': 10, 'description': 'Конкурент GoPro с более длительным временем работы и отличной цветопередачей в D-Log.',
                'megapixels': '10', 'video_resolution': '4K 120fps',
                'weight': '145', 'battery_life': '4', 'connection': 'Wi-Fi, Bluetooth',
                'stabilization': 'RockSteady 3.0', 'angle': '155°',
            },
            {
                'category': cat_action, 'name': 'Insta360 X4', 'price': 300000,
                'stock': 8, 'description': '360-градусная экшн-камера со стабилизацией и режимом невидимой селфи-палки.',
                'megapixels': '72', 'video_resolution': '8K 360°',
                'weight': '203', 'battery_life': '2.5', 'connection': 'Wi-Fi, Bluetooth',
                'stabilization': 'FlowState', 'angle': '360°',
            },
            {
                'category': cat_action, 'name': 'GoPro HERO12 Black', 'price': 185000,
                'stock': 15, 'description': 'Предыдущее поколение GoPro по сниженной цене. Отличный выбор по соотношению цена/качество.',
                'megapixels': '27', 'video_resolution': '5.3K 60fps',
                'weight': '149', 'battery_life': '3', 'connection': 'Wi-Fi, Bluetooth',
                'stabilization': 'HyperSmooth 5.0', 'angle': '156°',
            },

            # === ОБЪЕКТИВЫ ===
            {
                'category': cat_lens, 'name': 'Canon RF 50mm f/1.8 STM', 'price': 195000,
                'stock': 10, 'description': 'Лёгкий и доступный портретный объектив для камер Canon RF. Отличная резкость и боке.',
                'mount': 'Canon RF', 'focal_length': '50 мм', 'aperture': 'f/1.8',
                'weight': '160', 'stabilization': 'Нет',
            },
            {
                'category': cat_lens, 'name': 'Sony FE 85mm f/1.8', 'price': 480000,
                'stock': 6, 'description': 'Популярный портретный объектив для полного кадра с плавным боке и быстрым автофокусом.',
                'mount': 'Sony E', 'focal_length': '85 мм', 'aperture': 'f/1.8',
                'weight': '371', 'stabilization': 'Нет',
            },
            {
                'category': cat_lens, 'name': 'Tamron 17-28mm f/2.8 Di III RXD', 'price': 550000,
                'stock': 5, 'description': 'Компактный широкоугольный зум для Sony E-mount. Постоянная светосила f/2.8.',
                'mount': 'Sony E', 'focal_length': '17-28 мм', 'aperture': 'f/2.8',
                'weight': '420', 'stabilization': 'Нет',
            },
            {
                'category': cat_lens, 'name': 'Nikon NIKKOR Z 24-70mm f/2.8 S', 'price': 1450000,
                'stock': 3, 'description': 'Профессиональный универсальный зум для системы Nikon Z. Резкость по всему полю кадра.',
                'mount': 'Nikon Z', 'focal_length': '24-70 мм', 'aperture': 'f/2.8',
                'weight': '805', 'stabilization': 'Нет',
            },
            {
                'category': cat_lens, 'name': 'Sigma 18-50mm f/2.8 DC DN', 'price': 390000,
                'stock': 7, 'description': 'Компактный стандартный зум для APS-C беззеркалок. Доступная цена при высоком качестве.',
                'mount': 'Sony E / Fuji X', 'focal_length': '18-50 мм', 'aperture': 'f/2.8',
                'weight': '290', 'stabilization': 'Нет',
            },

            # === ВИДЕОКАМЕРЫ ===
            {
                'category': cat_video, 'name': 'Sony FDR-AX700', 'price': 870000,
                'stock': 3, 'description': 'Профессиональная видеокамера с 1-дюймовым сенсором и записью 4K HDR.',
                'megapixels': '14.2', 'video_resolution': '4K HDR',
                'optical_zoom': '12x', 'weight': '1030',
                'battery_life': '3', 'stabilization': 'Оптическая 5-осевая',
                'connection': 'Wi-Fi, USB-C', 'screen_size': '3.5',
            },
            {
                'category': cat_video, 'name': 'Canon LEGRIA HF G70', 'price': 520000,
                'stock': 4, 'description': 'Компактная профессиональная видеокамера для репортажной и документальной съёмки.',
                'megapixels': '8.29', 'video_resolution': '4K UHD',
                'optical_zoom': '20x', 'weight': '665',
                'battery_life': '4.5', 'stabilization': 'Оптическая IS',
                'connection': 'Wi-Fi', 'screen_size': '3.0',
            },
            {
                'category': cat_video, 'name': 'Blackmagic Pocket Cinema Camera 6K G2', 'price': 1450000,
                'stock': 2, 'description': 'Кинокамера для профессиональных кинематографистов с RAW записью и большим динамическим диапазоном.',
                'megapixels': '21', 'video_resolution': '6K RAW',
                'optical_zoom': '1x', 'weight': '1000',
                'battery_life': '1.5', 'stabilization': 'Нет',
                'connection': 'USB-C, Bluetooth', 'screen_size': '5.0',
            },

            # === ШТАТИВЫ И СТАБИЛИЗАТОРЫ ===
            {
                'category': cat_tripod, 'name': 'Joby GorillaPod 3K Pro', 'price': 48000,
                'stock': 20, 'description': 'Гибкий мини-штатив для крепления на любых поверхностях. Выдерживает нагрузку до 3 кг.',
                'weight': '540', 'connection': 'Нет', 'battery_life': '—',
            },
            {
                'category': cat_tripod, 'name': 'Manfrotto MT055CXPRO3', 'price': 320000,
                'stock': 5, 'description': 'Профессиональный карбоновый штатив с горизонтальной колонной и центральной шаровой головкой.',
                'weight': '1500', 'connection': 'Нет', 'battery_life': '—',
            },
            {
                'category': cat_tripod, 'name': 'DJI RS 3 Pro', 'price': 480000,
                'stock': 6, 'description': 'Профессиональный 3-осевой стабилизатор для камер весом до 4.5 кг с автоматической настройкой.',
                'weight': '1230', 'connection': 'Bluetooth, USB-C', 'battery_life': '12',
            },
            {
                'category': cat_tripod, 'name': 'Zhiyun Crane M3 Pro', 'price': 280000,
                'stock': 8, 'description': 'Компактный стабилизатор для беззеркалок и экшн-камер со встроенным заполняющим светом.',
                'weight': '695', 'connection': 'Bluetooth, USB-C', 'battery_life': '8',
            },

            # === ОСВЕТИТЕЛЬНОЕ ОБОРУДОВАНИЕ ===
            {
                'category': cat_light, 'name': 'Godox AD200Pro', 'price': 185000,
                'stock': 10, 'description': 'Портативная вспышка с головками Fresnel и bare bulb. Мощность 200 Вт, время зарядки 1.5 сек.',
                'power': '200', 'connection': 'X-системa (2.4 ГГц)', 'weight': '1400',
            },
            {
                'category': cat_light, 'name': 'Profoto B10 Plus', 'price': 920000,
                'stock': 3, 'description': 'Компактная студийная вспышка со встроенным аккумулятором и управлением через приложение.',
                'power': '500', 'connection': 'Bluetooth, Air', 'weight': '1900',
            },
            {
                'category': cat_light, 'name': 'Godox SL-60W LED', 'price': 65000,
                'stock': 15, 'description': 'Постоянный светодиодный свет для видеосъёмки и трансляций. Мощность 60 Вт, с пультом управления.',
                'power': '60', 'connection': '2.4 ГГц радио', 'weight': '2300',
            },
            {
                'category': cat_light, 'name': 'Aputure MC Pro', 'price': 145000,
                'stock': 12, 'description': 'Карманный RGBWW LED прибор для творческой подсветки. Управляется через приложение Sidus Link.',
                'power': '8', 'connection': 'Bluetooth, Wi-Fi', 'weight': '191',
            },
        ]

        # Поля которые есть напрямую в модели Product
        DIRECT_FIELDS = {'megapixels', 'sensor_type', 'video_resolution', 'weight',
                         'power', 'frequency', 'battery_life', 'connection'}

        created_count = 0
        for data in products_data:
            category = data.pop('category')
            name = data['name']

            if Product.objects.filter(name=name).exists():
                self.stdout.write(f'  Пропускаем (уже существует): {name}')
                continue

            # Собираем поля для модели и tech_values отдельно
            product_fields = {
                'category': category,
                'name': data.get('name', ''),
                'price': data.get('price', 0),
                'stock': data.get('stock', 0),
                'description': data.get('description', ''),
            }

            # Прямые поля модели
            for field in DIRECT_FIELDS:
                if field in data:
                    product_fields[field] = data[field]

            product = Product.objects.create(**product_fields)

            # Добавляем tech_values через TechField
            tech_field_keys = {tf.key: tf for tf in TechField.objects.all()}
            for key, value in data.items():
                if key in ('name', 'price', 'stock', 'description') or key in DIRECT_FIELDS:
                    continue
                if key in tech_field_keys and value:
                    from shop.models import ProductTechValue
                    ProductTechValue.objects.get_or_create(
                        product=product,
                        tech_field=tech_field_keys[key],
                        defaults={'value': str(value)}
                    )

            created_count += 1
            self.stdout.write(f'  ✓ {name}')

        self.stdout.write(self.style.SUCCESS(
            f'\nГотово! Создано товаров: {created_count} в {Category.objects.count()} категориях.'
        ))
