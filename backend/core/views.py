from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Avg, Sum, Max, Count
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Lesson, TestResult
from .serializers import (
    LessonSerializer,
    TestResultSerializer,
    TestResultCreateSerializer,
)
from .permissions import IsAdminOrReadOnly


class LessonViewSet(viewsets.ModelViewSet):
    """
    Lessons CRUD.
    GET  — public (any user).
    POST/PUT/PATCH/DELETE — admin only.
    """
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['order', 'layout']
    ordering = ['layout', 'order']

    def get_queryset(self):
        queryset = Lesson.objects.all()
        layout = self.request.query_params.get('layout')
        if layout in (Lesson.LAYOUT_QWERTY, Lesson.LAYOUT_JCUKEN):
            queryset = queryset.filter(layout=layout)
        return queryset


class TestResultViewSet(viewsets.ModelViewSet):
    """
    Test results.
    Authenticated users: create and read own results.
    Admin: read all results.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'wpm', 'accuracy']
    ordering = ['-created_at']

    # Disable update/delete for results (they are immutable)
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return TestResult.objects.all().select_related('user')
        return TestResult.objects.filter(user=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return TestResultCreateSerializer
        return TestResultSerializer

    def perform_create(self, serializer):
        user = self.request.user
        data = serializer.validated_data

        lang = data['language']
        test_type = data['test_type']
        new_wpm = data['wpm']

        # Build filter for the specific test configuration
        config_filter = {
            'user': user,
            'language': lang,
            'test_type': test_type,
        }
        if test_type == TestResult.TYPE_WORDS:
            config_filter['word_count'] = data.get('word_count')
        else:
            config_filter['time_limit'] = data.get('time_limit')

        existing_best = TestResult.objects.filter(**config_filter).aggregate(
            best=Max('wpm')
        )['best']

        is_record = (existing_best is None) or (new_wpm > existing_best)
        result = serializer.save(user=user, is_record=is_record)

        # Send real-time WebSocket notification when a record is beaten
        if is_record and existing_best is not None:
            _send_record_notification(user, result, existing_best)


def _send_record_notification(user, result, previous_best):
    """Push a record notification to the user's WebSocket channel group."""
    channel_layer = get_channel_layer()
    try:
        async_to_sync(channel_layer.group_send)(
            f'user_{user.id}_notifications',
            {
                'type': 'new_record',
                'data': {
                    'wpm': round(result.wpm, 1),
                    'language': result.language,
                    'test_type': result.test_type,
                    'word_count': result.word_count,
                    'time_limit': result.time_limit,
                    'previous_best': round(previous_best, 1),
                },
            },
        )
    except Exception:
        # Channel layer may not be available in tests; fail silently
        pass


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """
    GET /api/stats/
    Returns aggregated typing statistics for the authenticated user.
    """
    user = request.user
    results = TestResult.objects.filter(user=user)

    # ── Overall aggregates ────────────────────────────────────────────────────
    overall = results.aggregate(
        total_tests=Count('id'),
        total_time=Sum('duration'),
        avg_wpm=Avg('wpm'),
        avg_cpm=Avg('cpm'),
        avg_accuracy=Avg('accuracy'),
    )

    def _round(val, digits=1):
        return round(val, digits) if val is not None else 0

    # ── Per-language breakdown ─────────────────────────────────────────────────
    languages = {}
    for lang in [TestResult.LANG_EN, TestResult.LANG_RU]:
        lang_qs = results.filter(language=lang)
        lang_data = {}

        # Words tests: 10 / 25 / 50 / 100
        for count in [10, 25, 50, 100]:
            qs = lang_qs.filter(test_type=TestResult.TYPE_WORDS, word_count=count)
            agg = qs.aggregate(best_wpm=Max('wpm'), best_acc=Max('accuracy'), n=Count('id'))
            lang_data[f'words_{count}'] = {
                'best_wpm': _round(agg['best_wpm']),
                'best_accuracy': _round(agg['best_acc']),
                'attempts': agg['n'],
            } if agg['n'] else None

        # Time tests: 15 / 30 / 60 / 120
        for t in [15, 30, 60, 120]:
            qs = lang_qs.filter(test_type=TestResult.TYPE_TIME, time_limit=t)
            agg = qs.aggregate(best_wpm=Max('wpm'), best_acc=Max('accuracy'), n=Count('id'))
            lang_data[f'time_{t}'] = {
                'best_wpm': _round(agg['best_wpm']),
                'best_accuracy': _round(agg['best_acc']),
                'attempts': agg['n'],
            } if agg['n'] else None

        languages[lang] = lang_data

    return Response({
        'total_tests': overall['total_tests'] or 0,
        'total_time': _round(overall['total_time']),
        'avg_wpm': _round(overall['avg_wpm']),
        'avg_cpm': _round(overall['avg_cpm']),
        'avg_accuracy': _round(overall['avg_accuracy']),
        'languages': languages,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_all_user_stats(request):
    """
    GET /api/admin/stats/
    Admin endpoint: overview of all users' statistics.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    users_data = (
        User.objects
        .annotate(
            total_tests=Count('test_results'),
            avg_wpm=Avg('test_results__wpm'),
            avg_accuracy=Avg('test_results__accuracy'),
            total_time=Sum('test_results__duration'),
        )
        .filter(total_tests__gt=0)
        .order_by('-total_tests')
    )

    return Response([
        {
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'total_tests': u.total_tests,
            'avg_wpm': round(u.avg_wpm or 0, 1),
            'avg_accuracy': round(u.avg_accuracy or 0, 1),
            'total_time': round(u.total_time or 0, 1),
        }
        for u in users_data
    ])