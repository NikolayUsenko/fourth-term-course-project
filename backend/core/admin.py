from django.contrib import admin
from .models import Lesson, TestResult


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('id', 'layout', 'title', 'order', 'updated_at')
    list_display_links = ('id', 'title')
    list_filter = ('layout',)
    list_editable = ('order',)
    search_fields = ('title', 'description', 'content')
    ordering = ('layout', 'order')


@admin.register(TestResult)
class TestResultAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'user', 'language', 'test_type', 'word_count',
        'time_limit', 'wpm', 'cpm', 'accuracy', 'typos', 'is_record', 'created_at',
    )
    list_display_links = ('id',)
    list_filter = ('language', 'test_type', 'is_record')
    search_fields = ('user__username',)
    readonly_fields = ('is_record', 'created_at')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'