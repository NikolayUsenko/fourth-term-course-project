import re
from django import forms
from django.contrib import admin
from .models import Lesson, TestResult

_EN_KEYS_RE    = re.compile(r'^[a-z]+$')
_RU_KEYS_RE    = re.compile(r'^[а-яё]+$', re.IGNORECASE)
_EN_CONTENT_RE = re.compile(r'^[a-z]+( [a-z]+)*$')
_RU_CONTENT_RE = re.compile(r'^[а-яё]+( [а-яё]+)*$', re.IGNORECASE)


class LessonAdminForm(forms.ModelForm):
    """
    Custom form for Lesson admin with server-side validation of
    key_combination and content based on the selected language.
    """

    class Meta:
        model   = Lesson
        fields  = '__all__'
        widgets = {
            'content': forms.Textarea(attrs={'rows': 5, 'cols': 80}),
        }
        help_texts = {
            'key_combination': (
                'English: only a-z letters, no spaces (e.g. "asdf"). '
                'Russian: only а-я/ё letters, no spaces (e.g. "фыва").'
            ),
            'content': (
                'Words separated by single spaces. No punctuation marks. '
                'English: a-z only. Russian: а-я/ё only. '
                'Example: "asdf asdf fads sad dad add a fad".'
            ),
        }

    def clean(self):
        data     = super().clean()
        language = data.get('language', '')
        key_comb = re.sub(r' +', '', (data.get('key_combination') or '')).lower()
        content  = re.sub(r' +', ' ', (data.get('content') or '').lower().strip())

        if language == Lesson.LANG_EN:
            if key_comb and not _EN_KEYS_RE.match(key_comb):
                self.add_error(
                    'key_combination',
                    'For English: only a-z characters, no spaces or punctuation.',
                )
            if content and not _EN_CONTENT_RE.match(content):
                self.add_error(
                    'content',
                    'For English: only a-z letters with single spaces between words, no punctuation.',
                )

        elif language == Lesson.LANG_RU:
            if key_comb and not _RU_KEYS_RE.match(key_comb):
                self.add_error(
                    'key_combination',
                    'For Russian: only а-я and ё characters, no spaces or punctuation.',
                )
            if content and not _RU_CONTENT_RE.match(content):
                self.add_error(
                    'content',
                    'For Russian: only а-я/ё letters with single spaces between words, no punctuation.',
                )

        data['key_combination'] = key_comb
        data['content']         = content
        return data


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    form               = LessonAdminForm
    list_display       = ('id', 'language', 'title', 'key_combination', 'order', 'updated_at')
    list_display_links = ('id', 'title')
    list_filter        = ('language',)
    list_editable      = ('order',)
    search_fields      = ('title', 'key_combination', 'content')
    ordering           = ('language', 'order')
    fieldsets = [
        (None, {
            'fields': ('language', 'title', 'key_combination', 'content', 'order'),
        }),
        ('Timestamps', {
            'fields':  ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    ]
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TestResult)
class TestResultAdmin(admin.ModelAdmin):
    list_display       = (
        'id', 'user', 'language', 'word_count',
        'wpm', 'cpm', 'accuracy', 'typos', 'is_record', 'created_at',
    )
    list_display_links = ('id',)
    list_filter        = ('language', 'word_count', 'is_record')
    search_fields      = ('user__username',)
    readonly_fields    = ('is_record', 'created_at')
    ordering           = ('-created_at',)
    date_hierarchy     = 'created_at'