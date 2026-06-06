from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Avg, Sum, Max, Count
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Lesson, TestResult
from .serializers import LessonSerializer, TestResultSerializer, TestResultCreateSerializer
from .permissions import IsAdminOrReadOnly


class LessonViewSet(viewsets.ModelViewSet):
    """
    Lessons CRUD.
    GET  — public.
    POST / PUT / PATCH / DELETE — admin only.

    Filter by language: /api/lessons/?language=en
    """
    serializer_class   = LessonSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends    = [filters.OrderingFilter]
    ordering_fields    = ['order', 'language']
    ordering           = ['language', 'order']

    def get_queryset(self):
        qs   = Lesson.objects.all()
        lang = self.request.query_params.get('language')
        if lang in (Lesson.LANG_EN, Lesson.LANG_RU):
            qs = qs.filter(language=lang)
        return qs


class TestResultViewSet(viewsets.ModelViewSet):
    """
    Test results — immutable after creation.
    Authenticated users: create and read own results.
    Admin: read all results.
    """
    permission_classes  = [permissions.IsAuthenticated]
    http_method_names   = ['get', 'post', 'head', 'options']
    filter_backends     = [filters.OrderingFilter]
    ordering            = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return TestResult.objects.all().select_related('user')
        return TestResult.objects.filter(user=user)

    def get_serializer_class(self):
        return TestResultCreateSerializer if self.action == 'create' else TestResultSerializer

    def perform_create(self, serializer):
        user    = self.request.user
        data    = serializer.validated_data
        lang    = data['language']
        wc      = data['word_count']
        new_wpm = data['wpm']

        # Personal record check
        existing_best = TestResult.objects.filter(
            user=user, language=lang, word_count=wc
        ).aggregate(best=Max('wpm'))['best']

        is_record = (existing_best is None) or (new_wpm > existing_best)
        result    = serializer.save(user=user, is_record=is_record)

        # Send real-time notification only when a previous best is beaten
        if is_record and existing_best is not None:
            _send_record_notification(user, result, existing_best)


def _send_record_notification(user, result, previous_best):
    """Push a WPM record notification to the user's WebSocket channel group."""
    channel_layer = get_channel_layer()
    try:
        async_to_sync(channel_layer.group_send)(
            f'user_{user.id}_notifications',
            {
                'type': 'new_record',
                'data': {
                    'wpm':           round(result.wpm, 1),
                    'language':      result.language,
                    'word_count':    result.word_count,
                    'previous_best': round(previous_best, 1),
                },
            },
        )
    except Exception:
        pass   # Channel layer unavailable (tests, no daphne)


# Stats endpoints

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """
    GET /api/stats/
    Returns aggregated typing statistics for the authenticated user.

    Response shape:
    {
        total_tests, total_time, avg_wpm, avg_cpm, avg_accuracy,
        languages: {
            en: { words_10: {avg_wpm, avg_accuracy, attempts} | null, ... },
            ru: { ... }
        }
    }
    """
    user    = request.user
    results = TestResult.objects.filter(user=user)

    overall = results.aggregate(
        total_tests  = Count('id'),
        total_time   = Sum('duration'),
        avg_wpm      = Avg('wpm'),
        avg_cpm      = Avg('cpm'),
        avg_accuracy = Avg('accuracy'),
    )

    def _r(v):
        return round(v, 1) if v is not None else 0

    languages = {}
    for lang in [TestResult.LANG_EN, TestResult.LANG_RU]:
        lang_qs   = results.filter(language=lang)
        lang_data = {}
        for count in [10, 25, 50, 100]:
            agg = lang_qs.filter(word_count=count).aggregate(
                avg_wpm = Avg('wpm'),
                avg_acc = Avg('accuracy'),
                n       = Count('id'),
            )
            lang_data[f'words_{count}'] = {
                'avg_wpm':      _r(agg['avg_wpm']),
                'avg_accuracy': _r(agg['avg_acc']),
                'attempts':     agg['n'],
            } if agg['n'] else None
        languages[lang] = lang_data

    return Response({
        'total_tests':  overall['total_tests']  or 0,
        'total_time':   _r(overall['total_time']),
        'avg_wpm':      _r(overall['avg_wpm']),
        'avg_cpm':      _r(overall['avg_cpm']),
        'avg_accuracy': _r(overall['avg_accuracy']),
        'languages':    languages,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_all_user_stats(request):
    """
    GET /api/admin/stats/
    Admin overview of all users' statistics.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    qs = (
        User.objects
        .annotate(
            total_tests  = Count('test_results'),
            avg_wpm      = Avg('test_results__wpm'),
            avg_accuracy = Avg('test_results__accuracy'),
            total_time   = Sum('test_results__duration'),
        )
        .filter(total_tests__gt=0)
        .order_by('-total_tests')
    )

    return Response([
        {
            'id':           u.id,
            'username':     u.username,
            'email':        u.email,
            'total_tests':  u.total_tests,
            'avg_wpm':      round(u.avg_wpm      or 0, 1),
            'avg_accuracy': round(u.avg_accuracy  or 0, 1),
            'total_time':   round(u.total_time    or 0, 1),
        }
        for u in qs
    ])