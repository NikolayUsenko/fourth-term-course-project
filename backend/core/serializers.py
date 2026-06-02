from rest_framework import serializers
from .models import Lesson, TestResult


class LessonSerializer(serializers.ModelSerializer):
    layout_display = serializers.CharField(source='get_layout_display', read_only=True)

    class Meta:
        model = Lesson
        fields = [
            'id', 'layout', 'layout_display', 'title',
            'description', 'content', 'order', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class TestResultSerializer(serializers.ModelSerializer):
    """Read serializer for test results (includes username)."""
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = TestResult
        fields = [
            'id', 'username', 'language', 'test_type',
            'word_count', 'time_limit', 'wpm', 'cpm',
            'accuracy', 'typos', 'duration', 'is_record', 'created_at',
        ]
        read_only_fields = ['is_record', 'created_at', 'username']


class TestResultCreateSerializer(serializers.ModelSerializer):
    """Write serializer — user and is_record are set server-side."""

    class Meta:
        model = TestResult
        fields = [
            'language', 'test_type', 'word_count', 'time_limit',
            'wpm', 'cpm', 'accuracy', 'typos', 'duration',
        ]

    def validate(self, attrs):
        test_type = attrs.get('test_type')
        word_count = attrs.get('word_count')
        time_limit = attrs.get('time_limit')

        if test_type == TestResult.TYPE_WORDS:
            if word_count not in [10, 25, 50, 100]:
                raise serializers.ValidationError(
                    {'word_count': 'For words test, word_count must be 10, 25, 50, or 100.'}
                )
            attrs['time_limit'] = None
        elif test_type == TestResult.TYPE_TIME:
            if time_limit not in [15, 30, 60, 120]:
                raise serializers.ValidationError(
                    {'time_limit': 'For time test, time_limit must be 15, 30, 60, or 120.'}
                )
            attrs['word_count'] = None
        else:
            raise serializers.ValidationError({'test_type': 'Invalid test type.'})

        return attrs