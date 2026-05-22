from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings


class Command(BaseCommand):
    help = 'Тестирует отправку email через Gmail'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, default='nurzhanov3017@gmail.com', help='Email для отправки')

    def handle(self, *args, **options):
        recipient_email = options['email']
        
        self.stdout.write(f"📧 Тестирование email конфигурации...")
        self.stdout.write(f"FROM: {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write(f"TO: {recipient_email}")
        self.stdout.write(f"HOST: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        self.stdout.write(f"TLS: {settings.EMAIL_USE_TLS}")
        self.stdout.write("")
        
        try:
            result = send_mail(
                subject='🧪 Тест email Pro Lens',
                message='Это тестовое письмо. Если ты его получил, email конфигурация работает!',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient_email],
                html_message='<h1>✅ Тест успешен!</h1><p>Email отправка работает правильно.</p>',
                fail_silently=False,
            )
            self.stdout.write(self.style.SUCCESS(f'✓ Email успешно отправлен! (результат: {result})'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Ошибка отправки: {e}'))
            import traceback
            traceback.print_exc()
