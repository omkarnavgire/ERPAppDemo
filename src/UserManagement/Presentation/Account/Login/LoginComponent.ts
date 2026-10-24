
import { ChangeDetectorRef, Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
// import { Component, inject, ChangeDetectorRef } from "@angular/core";
import { Login } from "../../../Application/Auth/Login";
import { GetAllUsers } from "../../../Application/User/GetAllUsers";
import { AuthService } from "../../../Core/Services/AuthService";
import { UserSessionService } from "../../../Core/Services/UserSessionService";
import { User } from "../../../Domain/Entities/User";

@Component({
    selector: "app-login",
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: "./Login.html",
    styleUrl: "./Login.css"
})
export class LoginClass {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private loginUsecase = inject(Login);
    private getAllUsersUsecase = inject(GetAllUsers);
    private authService = inject(AuthService);
    private userSessionService = inject(UserSessionService);
    private cdr = inject(ChangeDetectorRef);

    readonly rememberedUsernameKey = "rememberedUsername";

    errormessage = "";
    isLoading = false;
    showPassword = false;

    rememberMe =
        localStorage.getItem(this.rememberedUsernameKey) !== null;

    loginForm = this.fb.nonNullable.group({
        username: [
            localStorage.getItem(this.rememberedUsernameKey) ?? "",
            Validators.required
        ],
        password: ["", Validators.required]
    });

    submit(): void {
        if (this.isLoading) {
            return;
        }

        this.errormessage = "";

        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        const request = this.loginForm.getRawValue();

        if (this.rememberMe) {
            localStorage.setItem(
                this.rememberedUsernameKey,
                request.username
            );
        } else {
            localStorage.removeItem(this.rememberedUsernameKey);
        }

        this.isLoading = true;

        this.loginUsecase.execute(request).subscribe({
            next: response => {
                try {
                    // Preserve existing token handling.
                    this.authService.saveLoginData(
                        response.token,
                        response.refreshToken
                    );

                    localStorage.setItem("username", request.username);

                    // Keep loading active until navigation starts.
                    this.loadUserAndNavigate(request.username);
                } catch (error) {
                    console.error("Login processing error:", error);
                    this.showLoginError(
                        "Login could not be completed. Please try again."
                    );
                }
            },

            // IMPORTANT: This handler handles LOGIN API errors.
            error: error => {
                console.error("Login API failed:", error);

                if (error?.status === 401) {
                    this.errormessage =
                        "Invalid username or password. Please check your credentials.";
                } else if (error?.status === 0) {
                    this.errormessage =
                        "Unable to connect to the server. Please try again.";
                } else {
                    this.errormessage =
                        error?.error?.message ||
                        error?.error?.title ||
                        "Login failed. Please try again.";
                }

                this.isLoading = false;

                // Immediately update the UI.
                this.cdr.detectChanges();
            }
        });
    }

    private showLoginError(message: string): void {
        this.errormessage = message;
        this.isLoading = false;
    }

    private loadUserAndNavigate(loginUsername: string): void {
        let navigated = false;

        const navigate = (): void => {
            if (navigated) {
                return;
            }

            navigated = true;

            this.router.navigate(["/main/dashboard"]).then(success => {
                if (!success) {
                    this.showLoginError(
                        "Login succeeded, but the dashboard could not be opened."
                    );
                } else {
                    this.isLoading = false;
                }
            }).catch(error => {
                console.error("Dashboard navigation error:", error);
                this.showLoginError(
                    "Login succeeded, but dashboard navigation failed."
                );
            });
        };

        this.getAllUsersUsecase.execute().subscribe({
            next: (response: any) => {
                const users: User[] = Array.isArray(response)
                    ? response
                    : response?.data ?? [];

                const username = loginUsername.trim().toLowerCase();

                const currentUser = users.find((user: User) =>
                    user.employeeCode?.trim().toLowerCase() === username ||
                    user.userName?.trim().toLowerCase() === username ||
                    user.emailAddress?.trim().toLowerCase() === username
                );

                if (currentUser) {
                    this.userSessionService.setUser(currentUser);
                }

                navigate();
            },

            // A user-details failure is NOT a login failure.
            // Preserve the original behaviour after successful authentication.
            error: error => {
                console.error("User information API error:", error);
                navigate();
            }
        });
    }
}
