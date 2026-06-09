from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Avg, Sum, Max, Count
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

from .models import Lesson, TestResult
from .serializers import LessonSerializer, TestResultSerializer, TestResultCreateSerializer
from .permissions import IsAdminOrReadOnly


@extend_schema(tags=['lessons'])
class LessonViewSet(viewsets.ModelViewSet):
    """
    Уроки клавиатурного тренажёра.

    - **GET** — публичный доступ (все пользователи).
    - **POST / PUT / PATCH / DELETE** — только администраторы.

    Фильтр по языку: `?language=en` или `?language=ru`.
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


@extend_schema(tags=['results'])
class TestResultViewSet(viewsets.ModelViewSet):
    """
    Результаты тестов.

    - **POST** — сохранить новый результат (только слова, 10/25/50/100).
    - **GET** — история результатов текущего пользователя.

    Результаты неизменяемы: PUT/PATCH/DELETE недоступны.
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

        existing_best = TestResult.objects.filter(
            user=user, language=lang, word_count=wc
        ).aggregate(best=Max('wpm'))['best']

        is_record = (existing_best is None) or (new_wpm > existing_best)
        result    = serializer.save(user=user, is_record=is_record)

        if is_record and existing_best is not None:
            _send_record_notification(user, result, existing_best)


def _send_record_notification(user, result, previous_best):
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
        pass


@extend_schema(
    tags=['stats'],
    summary='Статистика текущего пользователя',
    description=(
        'Возвращает агрегированную статистику: '
        'общее количество тестов, суммарное время, средние WPM/CPM/точность, '
        'а также разбивку по языкам (en/ru) и количеству слов (10/25/50/100).'
    ),
    responses={
        200: OpenApiResponse(description='Агрегированная статистика пользователя'),
        401: OpenApiResponse(description='Требуется аутентификация'),
    },
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
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


@extend_schema(
    tags=['stats'],
    summary='Статистика всех пользователей (администратор)',
    description='Список пользователей с их суммарной статистикой. Только для администраторов.',
    responses={
        200: OpenApiResponse(description='Список с агрегированной статистикой по каждому пользователю'),
        403: OpenApiResponse(description='Доступ запрещён'),
    },
)
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_all_user_stats(request):
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