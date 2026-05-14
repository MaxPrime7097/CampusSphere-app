"""
Configuration des features disponibles par type de sphère.
Utilisé par l'endpoint GET /api/spheres/<id>/features/
et potentiellement par le frontend en fallback.
"""

SPHERE_FEATURES = {
    'cours': {
        'has_resources':     True,
        'has_announcements': True,
        'has_chat':          True,
        'has_sphera':        True,
        'has_kanban':        False,
        'has_tasks':         False,
        'has_events':        False,
        'has_feed':          False,
    },
    'projet': {
        'has_resources':     True,
        'has_announcements': False,
        'has_chat':          True,
        'has_sphera':        False,
        'has_kanban':        True,
        'has_tasks':         True,
        'has_events':        False,
        'has_feed':          False,
    },
    'club': {
        'has_resources':     False,
        'has_announcements': True,
        'has_chat':          True,
        'has_sphera':        False,
        'has_kanban':        False,
        'has_tasks':         False,
        'has_events':        True,
        'has_feed':          False,
    },
    'revision': {
        'has_resources':     True,
        'has_announcements': False,
        'has_chat':          True,
        'has_sphera':        True,
        'has_kanban':        False,
        'has_tasks':         False,
        'has_events':        False,
        'has_feed':          False,
    },
    'communaute': {
        'has_resources':     True,
        'has_announcements': False,
        'has_chat':          True,
        'has_sphera':        False,
        'has_kanban':        False,
        'has_tasks':         False,
        'has_events':        False,
        'has_feed':          True,
    },
}


def get_sphere_features(sphere_type: str) -> dict:
    """Retourne la configuration des features pour un type de sphère donné.
    Fallback sur 'communaute' si le type est inconnu."""
    return SPHERE_FEATURES.get(sphere_type, SPHERE_FEATURES['communaute'])
