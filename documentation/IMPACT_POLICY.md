# Impact Policy (Source of Truth)

CampusSphere centralizes impact score rules in:

- `backend/users/impact_policy.py`

Use the named events below in backend/frontend/product discussions to avoid drift.

| Event constant | Event value | Business meaning | Points |
|---|---|---|---:|
| `POST_CREATED` | `post.created` | User creates a new post | `+10` |
| `COMMENT_CREATED` | `comment.created` | User creates a comment or reply | `+2` |
| `RESOURCE_UPLOADED` | `resource.uploaded` | User uploads a new resource | `+3` |
| `RESOURCE_DOWNLOADED` | `resource.downloaded` | User downloads another user's resource | `+1` |
| `TASK_COMPLETED` | `task.completed` | User completes a task and gets the task's configured `impact_points` | dynamic |

## Backend usage

- `posts/views.py`: applies `POST_CREATED` and `COMMENT_CREATED`.
- `resources/serializers.py`: applies `RESOURCE_UPLOADED`.
- `resources/views.py`: applies `RESOURCE_DOWNLOADED`.
- `tasks/views.py`: uses `TASK_COMPLETED` event naming and applies dynamic points through the same policy module helper.

## Notes

- Prefer `apply_impact_event(user, EVENT_NAME)` for fixed event values.
- Prefer `apply_impact_points(user, points)` when points are dynamic (task-specific).
