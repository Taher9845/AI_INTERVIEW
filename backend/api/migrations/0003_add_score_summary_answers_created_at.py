# Generated manually to align DB schema with current models
from django.db import migrations, models
import django.utils.timezone

class Migration(migrations.Migration):
    dependencies = [
        ("api", "0002_remove_candidate_created_at_alter_candidate_name_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="candidate",
            name="score",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="candidate",
            name="summary",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="candidate",
            name="answers",
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name="candidate",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, null=True, blank=True),
        ),
    ]
