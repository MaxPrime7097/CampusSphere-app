from rest_framework import serializers, status
from rest_framework.response import Response


ERROR_DEFINITIONS = {
    'invalid_participant': 'Participant invalide',
    'conversation_exists': 'Conversation déjà existante',
    'permission_denied': 'Permissions insuffisantes',
}


def business_error_payload(code, details=None):
    payload = {
        'success': False,
        'error': {
            'code': code,
            'message': ERROR_DEFINITIONS.get(code, code),
        },
    }
    if details:
        payload['error']['details'] = details
    return payload


def business_error_response(code, http_status=status.HTTP_400_BAD_REQUEST, details=None):
    return Response(business_error_payload(code, details), status=http_status)


def business_validation_error(code, details=None):
    raise serializers.ValidationError(business_error_payload(code, details))
