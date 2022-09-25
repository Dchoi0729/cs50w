import json
import math
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Post


def login_view(request):
    if request.method == "POST":
        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


def following_page(request):
    return render(request, "network/following.html")


def profile_page(request, name):    
    return render(request, "network/profile.html")


def index(request):
    return render(request, "network/index.html")


@csrf_exempt
def profile(request, name):
    # Query for requested user
    try:
        user = User.objects.get(username=name)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)

    # Check if current user follows requested user
    is_following = False
    if request.user.is_authenticated:
        if not user == request.user:
            if user in request.user.following.all():
                is_following = True

    # Return profile data for GET request
    if request.method == "GET":
        serialized_user = user.serialize()
        serialized_user.update({
            "self": request.user == user if request.user.is_authenticated else False, 
            "isFollowing": is_following,
            "followers": user.followers.all().count(),
            "postCount": user.posts.all().count()
        })
        return JsonResponse(serialized_user, safe=False)

    # Edit profile model based on POST request
    if request.method == "POST":
        if json.loads(request.body).get("action") == "toggle-follow":
            if is_following:
                request.user.following.remove(user)
            else:
                request.user.following.add(user)
            request.user.save()
            return JsonResponse({"message": "user follow toggled successfully."}, status=201)

        elif json.loads(request.body).get("action") == "edit-photo":
            url = json.loads(request.body).get("url")
            if url == "":
                return JsonResponse({"error": "empty url"}, status=201)
            request.user.profile_pic = url
            request.user.save()
            return JsonResponse({"message": "picture edited successfully."}, status=201)
        
        elif json.loads(request.body).get("action") == "edit-bio":
            bio = json.loads(request.body).get("bio")
            request.user.bio = bio
            request.user.save()
            return JsonResponse({"message": "bio edited successfully."}, status=201)


@csrf_exempt
@login_required
def compose(request):
    # Composing a new post must be via POST (POST to post ;) )
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Check if content is not empty
    content = json.loads(request.body).get("content")
    if content == "":
        return JsonResponse({"error": "Must provide content"}, status=400)

    # Create post based on POST request
    post = Post(
        user=request.user,
        content=content
    )
    post.save()

    return JsonResponse({"message": "post uploaded successfully."}, status=201)


def posts(request, path):
    path_arr = path.split("-")

    # Filter posts returned based on user's path
    if path_arr[0] == "index":
        posts = Post.objects.all()
    elif path_arr[0] == "profile":
        name = path_arr[1]
        try:
            user = User.objects.get(username=name)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found."}, status=404)
        posts = Post.objects.filter(
            user=user
        )
    elif path_arr[0] == "following":
        following = tuple(request.user.following.all())
        posts = Post.objects.filter(user__in = following)
    else:
        return JsonResponse({"error": "Invalid page."}, status=400)

    # Return posts in reverse chronologial order
    posts = posts.order_by("-date").all()

    # Paginate posts
    paginator = Paginator(posts, 10)
    page_obj =  paginator.get_page(request.GET.get('page'))

    # Serialize page_obj
    serialized_posts = [post.serialize() for post in page_obj]
    for post in serialized_posts:
        liked = request.user in Post.objects.get(id=post["id"]).likes.all()
        post.update({
            "liked": liked, 
            "self": request.user.username == post["user"]
            })
    
    # Add info for total number of pages for given path
    serialized_posts.append({'total_page' : paginator.num_pages})
    
    return JsonResponse(serialized_posts, safe=False)


@csrf_exempt
@login_required
def post(request, post_id):
    # Query for requested post
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)

    # Return data about post for GET request
    if request.method == "GET":
        liked = request.user in post.likes.all()
        serialized_post = post.serialize()
        serialized_post.update({"liked": liked, "self": request.user.username == post.user.username})
        return JsonResponse(serialized_post, safe=False)

    # Edit post based on POST request
    if request.method == "POST":
        if json.loads(request.body).get("action") == "toggle-like":
            liked = request.user in post.likes.all()
            if liked:
                post.likes.remove(request.user)
            else:
                post.likes.add(request.user)
            post.save()
            return JsonResponse({"message": "post like toggled successfully."}, status=201)

        elif json.loads(request.body).get("action") == "edit-content":
            content = json.loads(request.body).get("content")
            if content == "":
                return JsonResponse({"error": "post can not be blank."}, status=201)
            else:
                post.content = content
                post.save()
                return JsonResponse({"message": "post edited successfully."}, status=201)

        elif json.loads(request.body).get("action") == "delete":
            last_post = Post.objects.get(id=json.loads(request.body).get("lastPost"))
            path = json.loads(request.body).get("path")

            # Decide which post to show next, and the total post count remaining after deletion
            if path == "profile":
                next_post = Post.objects.filter(user=request.user, id__lt=last_post.id).order_by('pk').last()
                postCount = Post.objects.filter(user = request.user).count() - 1
            else:
                next_post = Post.objects.filter(id__lt=last_post.id).order_by('pk').last()
                postCount = Post.objects.all().count() - 1
            totalPage = math.ceil(postCount / 10)
            post.delete()

            # Status data with success message and remaining pages after delete
            data = [{
                "message": "post deleted successfully", 
                "totalPage": totalPage,
                "postCount":postCount
                }]

            # If next post does not exist, return status data here
            if next_post == None:
                return JsonResponse(data, safe=False)

            liked = request.user in next_post.likes.all()
            serialized_post = next_post.serialize()
            serialized_post.update({
                "liked": liked, 
                "self": request.user.username == next_post.user.username
                })
            data.append(serialized_post)

            return JsonResponse(data, safe=False)

        return JsonResponse({"message": "this shouldn't run..."}, status=201)