# Generated by Django 4.1 on 2022-09-04 05:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0009_alter_listing_curr_price'),
    ]

    operations = [
        migrations.AlterField(
            model_name='listing',
            name='curr_price',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=19, null=True),
        ),
    ]
