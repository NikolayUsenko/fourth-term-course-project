from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Lesson, TestResult

User = get_user_model()


class LessonValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin  = User.objects.create_superuser(
            username='admin', email='a@a.com', password='pass'
        )
        self.user   = User.objects.create_user(
            username='user', email='u@u.com', password='pass'
        )

    def _post(self, data):
        self.client.force_authenticate(user=self.admin)
        return self.client.post('/api/lessons/', data)

    # Public access
    def test_list_public(self):
        Lesson.objects.create(
            language='en', title='T', key_combination='asdf',
            content='asdf asdf', order=1,
        )
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get('/api/lessons/').status_code, status.HTTP_200_OK)

    def test_filter_by_language(self):
        Lesson.objects.create(language='en', title='EN', key_combination='asdf', content='asdf', order=1)
        Lesson.objects.create(language='ru', title='RU', key_combination='фыва', content='фыва', order=1)
        res = self.client.get('/api/lessons/?language=ru')
        for l in (res.data.get('results') or res.data):
            self.assertEqual(l['language'], 'ru')

    # English validation
    def test_en_lesson_valid(self):
        r = self._post({'language':'en','title':'T','key_combination':'asdf','content':'asdf asdf fads','order':1})
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data['key_combination'], 'asdf')

    def test_en_key_combination_digits_rejected(self):
        r = self._post({'language':'en','title':'T','key_combination':'asdf1','content':'asdf','order':1})
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_en_content_punctuation_rejected(self):
        r = self._post({'language':'en','title':'T','key_combination':'asdf','content':'asdf, asdf.','order':1})
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_en_content_uppercase_normalised(self):
        r = self._post({'language':'en','title':'T','key_combination':'ASDF','content':'ASDF ASDF','order':1})
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data['key_combination'], 'asdf')
        self.assertEqual(r.data['content'], 'asdf asdf')

    # Russian validation
    def test_ru_lesson_valid(self):
        r = self._post({'language':'ru','title':'Т','key_combination':'фыва','content':'фыва фыва авыф','order':1})
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_ru_key_combination_latin_rejected(self):
        r = self._post({'language':'ru','title':'Т','key_combination':'asdf','content':'фыва','order':1})
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_ru_content_latin_rejected(self):
        r = self._post({'language':'ru','title':'Т','key_combination':'фыва','content':'asdf фыва','order':1})
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    # Permission
    def test_regular_user_cannot_create(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.post('/api/lessons/', {'language':'en','title':'T','key_combination':'asdf','content':'asdf','order':1})
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


class TestResultTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user   = User.objects.create_user(
            username='typist', email='t@t.com', password='pass'
        )
        self.client.force_authenticate(user=self.user)

    def _post(self, **kw):
        d = {'language':'en','word_count':25,'wpm':60.0,'cpm':300.0,
             'accuracy':95.0,'typos':3,'duration':30.0}
        d.update(kw)
        return self.client.post('/api/results/', d)

    def test_create_ok(self):
        self.assertEqual(self._post().status_code, status.HTTP_201_CREATED)

    def test_unauthenticated_rejected(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self._post().status_code, status.HTTP_401_UNAUTHORIZED)

    def test_first_result_is_record(self):
        self._post(wpm=55.0)
        self.assertTrue(TestResult.objects.get(user=self.user).is_record)

    def test_better_wpm_is_record(self):
        self._post(wpm=50.0)
        self._post(wpm=70.0)
        self.assertTrue(TestResult.objects.filter(user=self.user, wpm=70.0).first().is_record)

    def test_lower_wpm_not_record(self):
        self._post(wpm=80.0)
        self._post(wpm=60.0)
        self.assertFalse(TestResult.objects.filter(user=self.user, wpm=60.0).first().is_record)

    def test_invalid_word_count_rejected(self):
        self.assertEqual(self._post(word_count=7).status_code, status.HTTP_400_BAD_REQUEST)

    def test_stats_endpoint(self):
        self._post(wpm=60.0)
        self._post(language='ru', word_count=50, wpm=45.0)
        r = self.client.get('/api/stats/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['total_tests'], 2)
        self.assertIsNotNone(r.data['languages']['en']['words_25'])
        self.assertIsNotNone(r.data['languages']['ru']['words_50'])
        self.assertIsNone(r.data['languages']['en']['words_10'])

    def test_stats_requires_auth(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get('/api/stats/').status_code, status.HTTP_401_UNAUTHORIZED)