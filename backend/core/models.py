from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Lesson(models.Model):
    """Keyboard training lesson for a specific layout."""

    LAYOUT_QWERTY = 'qwerty'
    LAYOUT_JCUKEN = 'jcuken'
    LAYOUT_CHOICES = [
        (LAYOUT_QWERTY, 'QWERTY'),
        (LAYOUT_JCUKEN, 'ЙЦУКЕН'),
    ]

    layout = models.CharField(
        max_length=10,
        choices=LAYOUT_CHOICES,
        verbose_name='Keyboard Layout',
        db_index=True,
    )
    title = models.CharField(max_length=200, verbose_name='Title')
    description = models.TextField(blank=True, verbose_name='Description')
    content = models.TextField(verbose_name='Content to Type')
    order = models.PositiveIntegerField(default=0, db_index=True, verbose_name='Order')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['layout', 'order']
        verbose_name = 'Lesson'
        verbose_name_plural = 'Lessons'

    def __str__(self):
        return f'[{self.get_layout_display()}] {self.title}'


class TestResult(models.Model):
    """Result of a typing speed test for an authenticated user."""

    LANG_EN = 'en'
    LANG_RU = 'ru'
    LANGUAGE_CHOICES = [
        (LANG_EN, 'English'),
        (LANG_RU, 'Russian'),
    ]

    TYPE_WORDS = 'words'
    TYPE_TIME = 'time'
    TEST_TYPE_CHOICES = [
        (TYPE_WORDS, 'Words'),
        (TYPE_TIME, 'Time'),
    ]

    WORD_COUNT_CHOICES = [(10, '10'), (25, '25'), (50, '50'), (100, '100')]
    TIME_LIMIT_CHOICES = [(15, '15s'), (30, '30s'), (60, '60s'), (120, '120s')]

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
    test_type = models.CharField(
        max_length=10,
        choices=TEST_TYPE_CHOICES,
        verbose_name='Test Type',
        db_index=True,
    )
    word_count = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        choices=WORD_COUNT_CHOICES,
        verbose_name='Word Count',
    )
    time_limit = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        choices=TIME_LIMIT_CHOICES,
        verbose_name='Time Limit (s)',
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
            models.Index(fields=['user', 'language', 'test_type']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return f'{self.user.username} — {self.language.upper()} {self.wpm:.0f} WPM'