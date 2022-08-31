from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.migrations.serializer import BaseSerializer
from django.db.migrations.writer import MigrationWriter

from datetime import datetime


class User(AbstractUser):
    pass

class Listing(models.Model):
    title = models.CharField(max_length=64)
    time_created = models.DateTimeField(auto_now_add=True)
    description = models.TextField()
    starting_bid = models.DecimalField(max_digits=19, decimal_places=2)
    image_url = models.URLField(blank=True, default="https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80")
    category = models.CharField(blank=True, max_length=64)

    def __str__(self):
        return f"{self.title}"

class Bid(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bidders")
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="bids")
    bid = models.DecimalField(max_digits=19, decimal_places=2)
    time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.listing}: {self.user} bids ${self.bid} ({self.time})"

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="commentor")
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="comments")
    comment = models.TextField()
    time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        formatted_time = self.time.strftime("%Y-%m-%d %H:%M:%S")

        return f"{self.listing}: {self.user} \"{self.comment}\" ({formatted_time})"
