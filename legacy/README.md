# legacy/

Superseded implementations, kept for reference during and after the backend migration.

## `django-backend/`

The original Django 5.2 + DRF backend, which served production until the Node/Express
rewrite. Moved here unchanged — no files were edited on the way in, so `git log --follow`
still reaches the full history of every file.

**It is no longer built or deployed.** [render.yaml](../render.yaml) builds `./backend`,
which is now the Node application. That path was chosen deliberately so the Render
service, its URL, its health check and every environment variable stayed exactly as
they were.

### Why it is retained rather than deleted

- **It is the behavioural reference.** [API_CONTRACT.md](../documentation/API_CONTRACT.md)
  was derived from it, and any question of "what did the old endpoint actually do?"
  is answered here rather than from memory.
- **Rollback stays real.** The Prisma schema uses bare plural table names
  (`users`, `spheres`, `posts`) while Django uses `<app>_<model>`
  (`users_user`, `spheres_sphere`, `posts_post`). There are no collisions, so both
  schemas coexist in one database and the Django tables survive the cutover intact.
  Rolling back is a Render "Manual Deploy" of an earlier commit, not a restore.
- **The defect list is anchored to it.** Every `[CHANGE]` in the contract and every
  `@defect` annotation in the Node handlers points at a specific behaviour here.

### Running it

Nothing in the deployment references it, but it still runs locally:

```bash
cd legacy/django-backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

That is worth doing at least once: the contract suite can be pointed at it with
`API_BASE_URL=http://127.0.0.1:8000`, where the assertions marked `[CHANGE]` fail. Those
failures are the specification — see
[backend/tests/contract/README.md](../backend/tests/contract/README.md).

### Deletion

Once the Node backend has run in production long enough to trust, this directory can
go. It carries no build, no dependencies and no deployment surface, so there is no
cost to leaving it until then.
