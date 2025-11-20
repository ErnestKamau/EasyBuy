# Generated migration for adding delivery_type and payment_method to Order model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0003_add_payment_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='delivery_type',
            field=models.CharField(
                choices=[('pickup', 'Pickup'), ('delivery', 'Delivery')],
                default='pickup',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='payment_method',
            field=models.CharField(
                choices=[('cash', 'Cash'), ('mpesa', 'M-Pesa'), ('debt', 'Debt')],
                default='cash',
                max_length=20
            ),
        ),
    ]

