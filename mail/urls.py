from django.urls import path, re_path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes
    path("emails", views.compose, name="compose"),
    path("emails/<int:email_id>", views.email, name="email"),
    path("emails/<str:mailbox>", views.mailbox, name="mailbox"),

    path('inbox', views.index, name='index'),
    path('sent', views.index, name='index'),
    path('archived', views.index, name='index'),
    path('compose', views.index, name='index'),
    re_path(r'^message\d+$', views.index, name='index'),
]
