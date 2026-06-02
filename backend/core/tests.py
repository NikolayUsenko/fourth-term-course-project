from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Lesson, TestResult

User = get_user_model()


class LessonAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin', email='admin@example.com', password='adminpass'
        )
        self.user = User.objects.create_user(
            username='user', email='user@example.com', password='userpass'
        )
        self.lesson = Lesson.objects.create(
            layout='qwerty', title='Home Row', content='asdf jkl;', order=1
        )

    def test_list_lessons_public(self):
        response = self.client.get('/api/lessons/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_lesson_admin_only(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            'layout': 'qwerty',
            'title': 'Top Row',
            'content': 'qwer tyui',
            'order': 2,
        }
        response = self.client.post('/api/lessons/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_lesson_regular_user_forbidden(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/lessons/', {
            'layout': 'qwerty', 'title': 'Test', 'content': 'abc', 'order': 3,
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter_lessons_by_layout(self):
        Lesson.objects.create(layout='jcuken', title='ЙЦУКЕН 1', content='фыва', order=1)
        response = self.client.get('/api/lessons/?layout=jcuken')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        for lesson in results:
            self.assertEqual(lesson['layout'], 'jcuken')


class TestResultAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='typist', email='typist@example.com', password='pass123'
        )
        self.client.force_authenticate(user=self.user)

    def _post_result(self, **kwargs):
        defaults = {
            'language': 'en',
            'test_type': 'words',
            'word_count': 25,
            'wpm': 60.0,
            'cpm': 300.0,
            'accuracy': 95.0,
            'typos': 3,
            'duration': 30.0,
        }
        defaults.update(kwargs)
        return self.client.post('/api/results/', defaults)

    def test_create_result_authenticated(self):
        response = self._post_result()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_result_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self._post_result()
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_first_result_is_record(self):
        response = self._post_result(wpm=55.0)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        result = TestResult.objects.get(user=self.user)
        self.assertTrue(result.is_record)

    def test_better_result_is_record(self):
        self._post_result(wpm=50.0)
        self._post_result(wpm=70.0)
        records = TestResult.objects.filter(user=self.user, is_record=True)
        # The 70 WPM result should also be a record
        self.assertTrue(records.filter(wpm=70.0).exists())

    def test_worse_result_not_record(self):
        self._post_result(wpm=80.0)
        self._post_result(wpm=60.0)
        not_record = TestResult.objects.filter(user=self.user, wpm=60.0).first()
        self.assertFalse(not_record.is_record)

    def test_invalid_word_count(self):
        response = self._post_result(word_count=7)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_time_limit(self):
        response = self._post_result(test_type='time', time_limit=99)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stats_endpoint(self):
        self._post_result(wpm=60.0)
        self._post_result(language='ru', word_count=50, wpm=45.0)
        response = self.client.get('/api/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_tests'], 2)
        self.assertIn('languages', response.data)
        self.assertIn('en', response.data['languages'])
        self.assertIn('ru', response.data['languages'])