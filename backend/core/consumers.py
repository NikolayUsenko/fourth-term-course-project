import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications.
    Connection: ws://localhost:8000/ws/notifications/?token=<access_token>
    Messages sent to client:
        { "type": "new_record", "data": { ... } }
    """

    async def connect(self):
        token = self._extract_token()
        user = await self._authenticate(token)

        if user is None:
            await self.close(code=4001)
            return

        self.user = user
        self.group_name = f'user_{user.id}_notifications'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        # Clients do not send messages — read-only channel
        pass

    # ── Group message handlers ─────────────────────────────────────────────────

    async def new_record(self, event):
        """Forward a new-record event to the WebSocket client."""
        await self.send(text_data=json.dumps({
            'type': 'new_record',
            'data': event['data'],
        }))

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _extract_token(self):
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        params = parse_qs(query_string)
        tokens = params.get('token', [])
        return tokens[0] if tokens else None

    @database_sync_to_async
    def _authenticate(self, token):
        if not token:
            return None
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            from django.contrib.auth import get_user_model
            User = get_user_model()
            payload = AccessToken(token)
            user_id = payload['user_id']
            return User.objects.get(id=user_id, is_active=True)
        except Exception:
            return None