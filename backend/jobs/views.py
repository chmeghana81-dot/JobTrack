
import csv
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.models import User
from django.http import HttpResponse
from rest_framework import generics, status, views, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import JobApplication, SavedJob, UserProfile
from .serializers import (
    ChangePasswordSerializer,
    JobApplicationSerializer,
    RegisterSerializer,
    SavedJobSerializer,
    UserProfileSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Issue JWT tokens upon successful registration for a frictionless onboarding flow
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        return Response(
            {
                "message": "Account created successfully.",
                "user": user_data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class ProfileView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        user_data = UserSerializer(request.user).data
        return Response(user_data)

    def patch(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        # Update User model fields (first_name, last_name, email)
        if "first_name" in request.data:
            user.first_name = request.data.get("first_name", "").strip()
        if "last_name" in request.data:
            user.last_name = request.data.get("last_name", "").strip()
        if "email" in request.data:
            new_email = request.data.get("email", "").strip().lower()
            if new_email and new_email != user.email:
                if User.objects.filter(email__iexact=new_email).exclude(id=user.id).exists():
                    return Response(
                        {"email": ["This email is already in use."]},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                user.email = new_email
        user.save()

        # Update Profile fields
        profile_serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if profile_serializer.is_valid(raise_exception=True):
            profile_serializer.save()

        user = User.objects.get(id=user.id)
        user_data = UserSerializer(user).data
        return Response(user_data)



class ChangePasswordView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"old_password": ["Current password is incorrect."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save()
        update_session_auth_hash(request, user)

        # Issue fresh JWT tokens after password reset
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Password updated successfully.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="export-csv")
    def export_csv(self, request):
        queryset = self.get_queryset()
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="job_applications.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "ID",
            "Company",
            "Role",
            "Location",
            "Salary",
            "Status",
            "Applied Date",
            "Job URL",
            "Interview Date",
            "Interview Round",
            "Interview Link",
            "Notes",
            "Created At",
        ])

        for app in queryset:
            writer.writerow([
                app.id,
                app.company,
                app.role,
                app.location,
                app.salary,
                app.status,
                app.applied_date,
                app.job_url,
                app.interview_date.isoformat() if app.interview_date else "",
                app.interview_round,
                app.interview_link,
                app.notes,
                app.created_at.isoformat() if app.created_at else "",
            ])

        return response


class SavedJobViewSet(viewsets.ModelViewSet):
    serializer_class = SavedJobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedJob.objects.filter(user=self.request.user).order_by("-saved_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

