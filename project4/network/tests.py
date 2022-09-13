from django.test import TestCase, Client

from .models import User, Post

# Create your tests here.
class NetworkTestCase(TestCase):

    def setUp(self):

        # Create User
        user1 = User.objects.create_user(username="test1", email="test1@test.com", password="test")
        user2 = User.objects.create_user(username="test2", email="test2@test.com", password="test")
        user3 = User.objects.create_user(username="test3", email="test3@test.com", password="test")

        # Create Post
        post1 = Post.objects.create(user=user1, content="hello1")
        post2 = Post.objects.create(user=user1, content="hello2")
        post3 = Post.objects.create(user=user1, content="hello3")

        post1.likes.add(user1)
        post2.likes.add(user1)
        post3.likes.add(user1)

        user1.following.add(user2)
        user3.following.add(user2)
    
    def test_post_count(self):
        user = User.objects.get(username="test1")
        self.assertEquals(user.posts.all().count(), 3)

    def test_post_likes(self):
        user = User.objects.get(username="test1")
        self.assertEquals(user.liked_posts.all().count(), 3)
    
    def test_user_follow(self):
        user = User.objects.get(username="test2")
        self.assertEquals(user.followers.all().count(), 2)