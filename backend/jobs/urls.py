
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    ChangePasswordView,
    JobApplicationViewSet,
    ProfileView,
    RegisterView,
    SavedJobViewSet,
)

router = DefaultRouter()
router.register("jobs", JobApplicationViewSet, basename="job")
router.register("saved-jobs", SavedJobViewSet, basename="saved-job")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/profile/", ProfileView.as_view(), name="auth-profile"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
] + router.urls

