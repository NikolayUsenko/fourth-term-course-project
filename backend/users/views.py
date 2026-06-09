from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .serializers import UserSerializer, RegisterSerializer, ProfileUpdateSerializer

User = get_user_model()


@extend_schema(
    tags=['auth'],
    summary='Регистрация нового пользователя',
    responses={
        201: OpenApiResponse(description='Пользователь создан'),
        400: OpenApiResponse(description='Ошибка валидации'),
    },
)
class RegisterView(generics.CreateAPIView):
    queryset           = User.objects.all()
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]


@extend_schema(
    tags=['auth'],
    summary='Профиль текущего пользователя',
    description='GET — просмотр профиля. PUT/PATCH — обновление имени и email.',
    responses={
        200: OpenApiResponse(description='Данные профиля'),
        401: OpenApiResponse(description='Требуется аутентификация'),
    },
)
class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProfileUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user