# Generated migration to add payment_status to Order
from django.db import migrations, models


def set_default_payment_status(apps, schema_editor):
    Order = apps.get_model('orders', 'Order')
    for order in Order.objects.all():
        if not hasattr(order, 'payment_status') or order.payment_status is None:
            order.payment_status = 'PENDING'
            order.save()


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_orderitems_kilogram'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='payment_status',
            field=models.CharField(choices=[('PENDING', 'Pending'), ('PAID', 'Paid'), ('DEBT', 'On Debt'), ('FAILED', 'Failed')], default='PENDING', max_length=20),
        ),
        migrations.RunPython(set_default_payment_status)
    ]
