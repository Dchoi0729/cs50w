# Generated by Django 4.1 on 2022-09-06 11:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0013_remove_user_bought_user_bought'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='sold',
            field=models.ManyToManyField(blank=True, related_name='seller', to='auctions.listing'),
        ),
    ]