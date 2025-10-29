from django.db.models import Q, F, Value, CharField, IntegerField
from django.db.models.functions import Concat, Lower
# from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank  # Commented out - PostgreSQL full-text search not available
from users.models import User
from spheres.models import Sphere
from posts.models import Post
from resources.models import Resource


class SearchService:
    """Service for advanced search functionality"""

    @staticmethod
    def search_users(query, filters=None, limit=20):
        """Search users with advanced filtering"""
        queryset = User.objects.all()

        # Text search (basic implementation without PostgreSQL full-text search)
        if query:
            queryset = queryset.filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(username__icontains=query) |
                Q(email__icontains=query) |
                Q(bio__icontains=query)
            )

        # Apply filters
        if filters:
            if 'university' in filters and filters['university']:
                queryset = queryset.filter(university=filters['university'])
            if 'faculty' in filters and filters['faculty']:
                queryset = queryset.filter(faculty=filters['faculty'])
            if 'study_year' in filters and filters['study_year']:
                queryset = queryset.filter(study_year=filters['study_year'])
            if 'town' in filters and filters['town']:
                queryset = queryset.filter(town=filters['town'])

        return queryset[:limit]

    @staticmethod
    def search_spheres(query, filters=None, user=None, limit=20):
        """Search spheres with advanced filtering"""
        queryset = Sphere.objects.all()

        # Text search (basic implementation without PostgreSQL full-text search)
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(objective__icontains=query) |
                Q(target_audience__icontains=query)
            )

        # Apply filters
        if filters:
            if 'category' in filters and filters['category']:
                queryset = queryset.filter(category=filters['category'])
            if 'type' in filters and filters['type']:
                queryset = queryset.filter(type=filters['type'])
            if 'is_private' in filters:
                queryset = queryset.filter(is_private=filters['is_private'])

        # Filter private spheres unless user is member
        if user:
            private_spheres = Sphere.objects.filter(
                is_private=True,
                members__user=user,
                members__status='active'
            )
            public_spheres = queryset.filter(is_private=False)
            queryset = (private_spheres | public_spheres).distinct()
        else:
            queryset = queryset.filter(is_private=False)

        return queryset[:limit]

    @staticmethod
    def search_posts(query, filters=None, user=None, limit=20):
        """Search posts with advanced filtering"""
        queryset = Post.objects.select_related('author', 'sphere')

        # Text search (basic implementation without PostgreSQL full-text search)
        if query:
            queryset = queryset.filter(
                Q(content__icontains=query) |
                Q(tags__icontains=query)
            )

        # Apply filters
        if filters:
            if 'sphere_id' in filters and filters['sphere_id']:
                queryset = queryset.filter(sphere_id=filters['sphere_id'])
            if 'author_id' in filters and filters['author_id']:
                queryset = queryset.filter(author_id=filters['author_id'])
            if 'category' in filters and filters['category']:
                queryset = queryset.filter(category=filters['category'])
            if 'subject' in filters and filters['subject']:
                queryset = queryset.filter(subject=filters['subject'])
            if 'type' in filters and filters['type']:
                queryset = queryset.filter(type=filters['type'])
            if 'visibility' in filters and filters['visibility']:
                queryset = queryset.filter(visibility=filters['visibility'])

        # Filter by visibility permissions
        if user:
            # Public posts
            public_posts = queryset.filter(visibility='public')
            # Sphere posts where user is member
            sphere_posts = queryset.filter(
                visibility='sphere',
                sphere__members__user=user,
                sphere__members__status='active'
            )
            # Friends posts (simplified - assuming connections are friends)
            friends_posts = queryset.filter(
                visibility='friends',
                author__connections_received__requester=user,
                author__connections_received__status='accepted'
            ) | queryset.filter(
                visibility='friends',
                author__connections_sent__recipient=user,
                author__connections_sent__status='accepted'
            )
            queryset = (public_posts | sphere_posts | friends_posts).distinct()
        else:
            queryset = queryset.filter(visibility='public')

        return queryset[:limit]

    @staticmethod
    def search_resources(query, filters=None, user=None, limit=20):
        """Search resources with advanced filtering"""
        queryset = Resource.objects.select_related('author')

        # Text search (basic implementation without PostgreSQL full-text search)
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(tags__icontains=query)
            )

        # Apply filters
        if filters:
            if 'subject' in filters and filters['subject']:
                queryset = queryset.filter(subject=filters['subject'])
            if 'type' in filters and filters['type']:
                queryset = queryset.filter(type=filters['type'])
            if 'audience' in filters and filters['audience']:
                queryset = queryset.filter(audience=filters['audience'])
            if 'visibility' in filters and filters['visibility']:
                queryset = queryset.filter(visibility=filters['visibility'])

        # Filter by visibility permissions
        if user:
            # Public resources
            public_resources = queryset.filter(visibility='public')
            # University resources (if user has university)
            university_resources = queryset.filter(
                visibility='university',
                author__university=user.university
            )
            # Friends resources
            friends_resources = queryset.filter(
                visibility='friends',
                author__connections_received__requester=user,
                author__connections_received__status='accepted'
            ) | queryset.filter(
                visibility='friends',
                author__connections_sent__recipient=user,
                author__connections_sent__status='accepted'
            )
            queryset = (public_resources | university_resources | friends_resources).distinct()
        else:
            queryset = queryset.filter(visibility='public')

        return queryset[:limit]

    @staticmethod
    def global_search(query, user=None, limit=10):
        """Perform global search across all entities"""
        results = {
            'users': SearchService.search_users(query, limit=limit),
            'spheres': SearchService.search_spheres(query, user=user, limit=limit),
            'posts': SearchService.search_posts(query, user=user, limit=limit),
            'resources': SearchService.search_resources(query, user=user, limit=limit),
        }

        return results

    @staticmethod
    def get_search_suggestions(query, user=None, limit=5):
        """Get search suggestions based on query"""
        suggestions = []

        # User suggestions
        users = SearchService.search_users(query, limit=limit)
        for user in users:
            suggestions.append({
                'type': 'user',
                'id': user.id,
                'text': f"{user.first_name} {user.last_name}",
                'subtitle': user.username,
                'url': f'/profile/{user.id}'
            })

        # Sphere suggestions
        spheres = SearchService.search_spheres(query, user=user, limit=limit)
        for sphere in spheres:
            suggestions.append({
                'type': 'sphere',
                'id': sphere.id,
                'text': sphere.name,
                'subtitle': f"{sphere.member_count} membres",
                'url': f'/spheres/{sphere.id}'
            })

        # Post suggestions
        posts = SearchService.search_posts(query, user=user, limit=limit)
        for post in posts:
            suggestions.append({
                'type': 'post',
                'id': post.id,
                'text': post.content[:100] + '...' if len(post.content) > 100 else post.content,
                'subtitle': f"Par {post.author.username}",
                'url': f'/posts/{post.id}'
            })

        # Resource suggestions
        resources = SearchService.search_resources(query, user=user, limit=limit)
        for resource in resources:
            suggestions.append({
                'type': 'resource',
                'id': resource.id,
                'text': resource.title,
                'subtitle': f"Par {resource.author.username}",
                'url': f'/resources/{resource.id}'
            })

        return suggestions[:limit]


class FilterService:
    """Service for advanced filtering options"""

    @staticmethod
    def get_universities():
        """Get list of unique universities"""
        return User.objects.exclude(university__isnull=True).exclude(university='').values_list(
            'university', flat=True
        ).distinct().order_by('university')

    @staticmethod
    def get_faculties():
        """Get list of unique faculties"""
        return User.objects.exclude(faculty__isnull=True).exclude(faculty='').values_list(
            'faculty', flat=True
        ).distinct().order_by('faculty')

    @staticmethod
    def get_study_years():
        """Get list of unique study years"""
        return User.objects.exclude(study_year__isnull=True).exclude(study_year='').values_list(
            'study_year', flat=True
        ).distinct().order_by('study_year')

    @staticmethod
    def get_towns():
        """Get list of unique towns"""
        return User.objects.exclude(town__isnull=True).exclude(town='').values_list(
            'town', flat=True
        ).distinct().order_by('town')

    @staticmethod
    def get_sphere_categories():
        """Get sphere categories with counts"""
        from django.db.models import Count
        return Sphere.objects.values('category').annotate(
            count=Count('id')
        ).order_by('-count')

    @staticmethod
    def get_sphere_types():
        """Get sphere types with counts"""
        from django.db.models import Count
        return Sphere.objects.values('type').annotate(
            count=Count('id')
        ).order_by('-count')

    @staticmethod
    def get_subjects():
        """Get unique subjects from posts and resources"""
        post_subjects = Post.objects.exclude(subject__isnull=True).exclude(subject='').values_list(
            'subject', flat=True
        )
        resource_subjects = Resource.objects.exclude(subject__isnull=True).exclude(subject='').values_list(
            'subject', flat=True
        )
        all_subjects = list(post_subjects) + list(resource_subjects)
        return sorted(set(all_subjects))

    @staticmethod
    def get_resource_types():
        """Get resource types with counts"""
        from django.db.models import Count
        return Resource.objects.values('type').annotate(
            count=Count('id')
        ).order_by('-count')