
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("following", views.following, name="following"),
    path("profile/<str:name>", views.profile_page, name="profile-page"),
    path("test", views.test, name="test"),
    
    # API Routes
    path("posts", views.compose, name="compose"),
    path("posts/<str:path>", views.posts, name="load_posts"),
    path("post/<int:post_id>", views.post, name="post"),
    path("profile-info/<str:name>", views.profile, name="profile")
]
'''
path("posts/<int:email_id>", views.email, name="email"),
path("emails/<str:mailbox>", views.mailbox, name="mailbox")
'''