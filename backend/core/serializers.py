import re
from rest_framework import serializers
from .models import Lesson, TestResult

# Validation patterns
_EN_KEYS_RE    = re.compile(r'^[a-z]+$')
_RU_KEYS_RE    = re.compile(r'^[а-яё]+$', re.IGNORECASE)
_EN_CONTENT_RE = re.compile(r'^[a-z]+( [a-z]+)*$')
_RU_CONTENT_RE = re.compile(r'^[а-яё]+( [а-яё]+)*$', re.IGNORECASE)


class LessonSerializer(serializers.ModelSerializer):
    language_display = serializers.CharField(source='get_language_display', read_only=True)

    class Meta:
        model  = Lesson
        fields = [
            'id', 'language', 'language_display', 'title',
            'key_combination', 'content', 'order',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, attrs):
        # On partial update fall back to instance values
        language        = attrs.get('language',        getattr(self.instance, 'language', ''))
        key_combination = attrs.get('key_combination', getattr(self.instance, 'key_combination', ''))
        content         = attrs.get('content',         getattr(self.instance, 'content', ''))

        # Normalise
        key_combination = key_combination.lower().strip()
        content         = re.sub(r' +', ' ', content.lower().strip())

        if language == Lesson.LANG_EN:
            if not _EN_KEYS_RE.match(key_combination):
                raise serializers.ValidationError(
                    {'key_combination': 'For English only a-z characters are allowed (no spaces, no punctuation).'}
                )
            if not _EN_CONTENT_RE.match(content):
                raise serializers.ValidationError(
                    {'content': 'For English, content must contain only a-z letters with single spaces between words.'}
                )
        elif language == Lesson.LANG_RU:
            if not _RU_KEYS_RE.match(key_combination):
                raise serializers.ValidationError(
                    {'key_combination': 'For Russian only а-я and ё characters are allowed.'}
                )
            if not _RU_CONTENT_RE.match(content):
                raise serializers.ValidationError(
                    {'content': 'For Russian, content must contain only а-я/ё letters with single spaces between words.'}
                )

        attrs['key_combination'] = key_combination
        attrs['content']         = content
        return attrs


class TestResultSerializer(serializers.ModelSerializer):
    """Read serialiser — includes username."""
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model  = TestResult
        fields = [
            'id', 'username', 'language', 'word_count',
            'wpm', 'cpm', 'accuracy', 'typos', 'duration',
            'is_record', 'created_at',
        ]
        read_only_fields = ['is_record', 'created_at', 'username']


class TestResultCreateSerializer(serializers.ModelSerializer):
    """Write serialiser — user and is_record are set server-side."""

    class Meta:
        model  = TestResult
        fields = ['language', 'word_count', 'wpm', 'cpm', 'accuracy', 'typos', 'duration']

    def validate_word_count(self, value):
        if value not in [10, 25, 50, 100]:
            raise serializers.ValidationError('word_count must be 10, 25, 50, or 100.')
        return value

    def validate_accuracy(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError('accuracy must be between 0 and 100.')
        return round(value, 2)