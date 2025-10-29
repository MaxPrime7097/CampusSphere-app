# CampusSphere Backend API

A comprehensive Django REST API for CampusSphere, a collaborative platform for university and college students.

## 🚀 Features

- **User Management**: Registration, authentication, profiles, connections
- **Spheres**: Collaborative study groups with task management
- **Posts & Comments**: Social feed with likes and comments
- **Resources**: File sharing and resource management
- **Real-time Messaging**: WebSocket-based chat system
- **Notifications**: Email and in-app notifications
- **Search & Filtering**: Advanced search across all content
- **Caching**: Redis-based performance optimization
- **Security**: Rate limiting, input validation, CORS

## 🛠️ Tech Stack

- **Framework**: Django 5.2 + Django REST Framework
- **Database**: PostgreSQL
- **Cache**: Redis
- **WebSockets**: Django Channels
- **Authentication**: JWT (Simple JWT)
- **File Storage**: Local + AWS S3 support
- **Email**: SMTP
- **Task Queue**: Celery + Redis

## 📋 Prerequisites

- Python 3.12+
- PostgreSQL 13+
- Redis 6+
- Node.js 18+ (for frontend)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd campus-sphere/backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Configuration

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/campus_sphere

# JWT
SECRET_KEY=your-super-secret-key-here
JWT_SECRET=your-jwt-secret-key

# Redis
REDIS_URL=redis://localhost:6379

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=your-bucket-name

# Security
DEBUG=False
ALLOWED_HOSTS=your-domain.com,api.your-domain.com
```

### 3. Database Setup

```bash
# Create database
createdb campus_sphere

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 4. Run Development Server

```bash
# Start Django server
python manage.py runserver

# Start Redis (in another terminal)
redis-server

# Start Celery worker (in another terminal)
celery -A campus_sphere worker -l info

# Start WebSocket server (in another terminal)
python manage.py runserver 0.0.0.0:8000
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/register/
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "university": "douala",
  "faculty": "informatique",
  "studyYear": "l3",
  "studentId": "2021001234"
}
```

#### POST /api/auth/login/
Authenticate user and return tokens.

#### GET /api/auth/me/
Get current user profile (requires authentication).

### User Management

#### GET /api/users/
List users with search and filtering.

#### GET /api/users/{id}/
Get user profile details.

#### PUT /api/users/{id}/
Update user profile.

#### POST /api/users/{id}/connections/
Send connection request.

### Spheres

#### GET /api/spheres/
List spheres with filtering.

#### POST /api/spheres/
Create new sphere.

#### GET /api/spheres/{id}/
Get sphere details.

#### POST /api/spheres/{id}/join/
Join sphere.

### Posts

#### GET /api/posts/
List posts with pagination.

#### POST /api/posts/
Create new post.

#### POST /api/posts/{id}/like/
Like/unlike post.

#### GET /api/posts/{id}/comments/
Get post comments.

### Resources

#### GET /api/resources/
List resources.

#### POST /api/resources/
Upload new resource.

#### POST /api/resources/{id}/download/
Download resource.

### Search

#### GET /api/search/?q=query&type=all
Global search across all entities.

#### GET /api/search/suggestions/?q=query
Get search suggestions.

## 🔒 Security Features

- JWT authentication with refresh tokens
- Rate limiting (100 requests/hour per user)
- Brute force protection (5 failed attempts = 1 hour lockout)
- Input sanitization and validation
- CORS configuration
- File upload validation
- SQL injection prevention
- XSS protection

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run specific test
python manage.py test tests.test_auth.AuthTests.test_user_registration

# Run with coverage
pip install coverage
coverage run manage.py test
coverage report
```

## 🚀 Deployment

### Production Settings

Update `settings.py` for production:

```python
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com', 'api.your-domain.com']

# Use HTTPS
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Database connection pooling
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'campus_sphere',
        'USER': 'db_user',
        'PASSWORD': 'db_password',
        'HOST': 'db-host',
        'PORT': '5432',
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'sslmode': 'require',
        }
    }
}
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["gunicorn", "campus_sphere.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring

### Health Checks

- GET `/api/health/` - Basic health check
- GET `/api/info/` - API information

### Logging

Logs are stored in `logs/campus_sphere.log` with rotation.

### Performance Monitoring

- Redis cache hit/miss ratios
- Database query optimization
- API response times
- WebSocket connection counts

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | `False` |
| `SECRET_KEY` | Django secret key | Required |
| `DATABASE_URL` | PostgreSQL connection URL | Required |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `EMAIL_HOST` | SMTP server | Required for emails |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | Optional |

### Cache Configuration

```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@campus-sphere.com or join our Discord community.

---

**CampusSphere** - Connecting students, empowering collaboration. 🚀