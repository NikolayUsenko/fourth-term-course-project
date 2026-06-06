from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Lesson(models.Model):
    """A keyboard training lesson focused on a specific key combination."""

    LANG_EN = 'en'
    LANG_RU = 'ru'
    LANGUAGE_CHOICES = [
        (LANG_EN, 'English'),
        (LANG_RU, 'Russian'),
    ]

    language = models.CharField(
        max_length=2,
        choices=LANGUAGE_CHOICES,
        verbose_name='Language',
        db_index=True,
    )
    title = models.CharField(max_length=200, verbose_name='Title')
    key_combination = models.CharField(
        max_length=50,
        verbose_name='Key Combination',
        help_text='e.g. "asdf" for English or "фыва" for Russian',
    )
    content = models.TextField(
        verbose_name='Content',
        help_text=(
            'Sequence of words separated by single spaces. '
            'No punctuation. English: a-z only. Russian: а-я/ё only.'
        ),
    )
    order = models.PositiveIntegerField(default=0, db_index=True, verbose_name='Order')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['language', 'order']
        verbose_name = 'Lesson'
        verbose_name_plural = 'Lessons'

    def __str__(self):
        return f'[{self.get_language_display()}] {self.title} ({self.key_combination})'


class TestResult(models.Model):
    """Result of a words-based typing test for an authenticated user."""

    LANG_EN = 'en'
    LANG_RU = 'ru'
    LANGUAGE_CHOICES = [
        (LANG_EN, 'English'),
        (LANG_RU, 'Russian'),
    ]
    WORD_COUNT_CHOICES = [(10, '10'), (25, '25'), (50, '50'), (100, '100')]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='test_results',
        verbose_name='User',
    )
    language = models.CharField(
        max_length=2,
        choices=LANGUAGE_CHOICES,
        verbose_name='Language',
        db_index=True,
    )
    word_count = models.PositiveSmallIntegerField(
        choices=WORD_COUNT_CHOICES,
        verbose_name='Word Count',
        db_index=True,
    )
    wpm = models.FloatField(
        verbose_name='WPM',
        validators=[MinValueValidator(0)],
    )
    cpm = models.FloatField(
        verbose_name='CPM',
        validators=[MinValueValidator(0)],
    )
    accuracy = models.FloatField(
        verbose_name='Accuracy (%)',
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    typos = models.PositiveIntegerField(default=0, verbose_name='Typos')
    duration = models.FloatField(
        verbose_name='Duration (s)',
        validators=[MinValueValidator(0)],
    )
    is_record = models.BooleanField(default=False, verbose_name='Personal Record')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Test Result'
        verbose_name_plural = 'Test Results'
        indexes = [
            models.Index(fields=['user', 'language', 'word_count']),
        ]

    def __str__(self):
        return (
            f'{self.user.username} — '
            f'{self.get_language_display()} {self.word_count}w '
            f'{self.wpm:.0f} WPM'
        )