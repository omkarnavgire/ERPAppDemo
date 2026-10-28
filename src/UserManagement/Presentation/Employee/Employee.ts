import { Component, OnInit, ChangeDetectorRef, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    Validators
} from "@angular/forms";
import { Router } from "@angular/router";
import { finalize } from "rxjs";

import { GetAllUsers } from "../../Application/User/GetAllUsers";
import { RegisterEmployee } from "../../Application/Auth/RegisterEmployee";
import { GetAllRoles } from "../../Application/User/GetAllRoles";
import { UpdateUserRoles } from "../../Application/User/UpdateUserRoles";
import { BranchApi } from "../../Infrastructure/Api/BranchApi";

import { User } from "../../Domain/Entities/User";
import { Role } from "../../Domain/Entities/Role";
import { RegisterEmployeeRequest } from "../../Domain/Entities/Employee";

@Component({
    selector: "app-user",
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: "./Employee.html",
    styleUrl: "./Employee.css"
})
export class EmployeeComponent implements OnInit {
    private getAllUsersUsecase = inject(GetAllUsers);
    private registerEmployeeUsecase = inject(RegisterEmployee);
    private getAllRolesUsecase = inject(GetAllRoles);
    private updateUserRolesUsecase = inject(UpdateUserRoles);
    private branchApi = inject(BranchApi);

    private cdr = inject(ChangeDetectorRef);
    private router = inject(Router);
    private fb = inject(FormBuilder);

    users: User[] = [];
    searchText = "";
    selectedBranch = "";
    selectedRole = "";
    selectedStatus = "all";

    currentPage = 1;
    pageSize = 10;

    loading = false;
    errorMessage = "";
    selectedProfile: User | null = null;

    // Employee registration modal state
    showEmployeeModal = false;
    errormessage = "";
    successmessage = "";
    submitting = false;
    branchesLoading = false;
    rolesLoading = false;

    roles: Role[] = [];
    employeeBranchOptions: { id: number; name: string }[] = [];

    employeeForm = this.fb.nonNullable.group({
        employeeName: ["", [Validators.required, Validators.minLength(2)]],
        emailAddress: ["", [Validators.required, Validators.email]],
        mobileNumber: ["", [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        branchId: [0, [Validators.required, Validators.min(1)]],
        roleId: [""]
    });

    ngOnInit(): void {
        this.loadUsers();
        this.loadBranches();
        this.loadRoles();
    }

    // Open registration form in a modal on the User page.
    addEmployee(): void {
        this.errormessage = "";
        this.successmessage = "";
        this.showEmployeeModal = true;
    }

    closeEmployeeModal(): void {
        if (this.submitting) {
            return;
        }

        this.showEmployeeModal = false;
        this.errormessage = "";
    }

    loadUsers(): void {
        this.loading = true;
        this.errorMessage = "";

        console.log("Loading users for User page...");

        this.getAllUsersUsecase.execute().subscribe({
            next: (response: any) => {
                console.log("User API response:", response);

                this.users = this.toUserArray(response);
                this.currentPage = 1;
                this.loading = false;

                console.log("User page records:", this.users.length);
                console.log("Loading state:", this.loading);

                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error("User page API error:", error);

                this.users = [];
                this.errorMessage =
                    error?.error?.message ||
                    "Unable to load user records. Please try again.";
                this.loading = false;

                console.log("Loading state after error:", this.loading);

                this.cdr.detectChanges();
            }
        });
    }

    private toUserArray(response: any): User[] {
        if (Array.isArray(response)) {
            return response;
        }

        if (Array.isArray(response?.data)) {
            return response.data;
        }

        if (Array.isArray(response?.data?.data)) {
            return response.data.data;
        }

        if (Array.isArray(response?.result)) {
            return response.result;
        }

        if (Array.isArray(response?.items)) {
            return response.items;
        }

        return [];
    }

    private toArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data?.data)) return response.data.data;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.result)) return response.result;
        if (Array.isArray(response?.items)) return response.items;
        return [];
    }

    loadBranches(): void {
        this.branchesLoading = true;

        this.branchApi.getAllBranches()
            .pipe(finalize(() => {
                this.branchesLoading = false;
                this.cdr.detectChanges();
            }))
            .subscribe({
                next: (response: any) => {
                    console.log("Branches API response:", response);

                    const data = this.toArray(response);
                    this.employeeBranchOptions = data.map((branch: any) => ({
                        id: Number(
                            branch?.branchId ??
                            branch?.id ??
                            branch?.branch_id ??
                            0
                        ),
                        name: String(
                            branch?.branchName ??
                            branch?.name ??
                            branch?.branch_name ??
                            ""
                        )
                    })).filter(branch =>
                        branch.id > 0 && branch.name.trim() !== ""
                    );

                    this.employeeBranchOptions = this.employeeBranchOptions.filter(
                        (branch, index, self) =>
                            index === self.findIndex(item => item.id === branch.id)
                    );

                    this.employeeBranchOptions.sort((a, b) =>
                        a.name.localeCompare(b.name)
                    );

                    console.log("Employee branch options:", this.employeeBranchOptions);
                },
                error: (error) => {
                    console.error("Branch loading error:", error);
                    this.employeeBranchOptions = [];
                    this.errormessage =
                        "Unable to load branch information. Please try again.";
                }
            });
    }

    loadRoles(): void {
        this.rolesLoading = true;

        this.getAllRolesUsecase.execute()
            .pipe(finalize(() => {
                this.rolesLoading = false;
                this.cdr.detectChanges();
            }))
            .subscribe({
                next: (response: any) => {
                    console.log("Roles API response:", response);
                    this.roles = this.normalizeRoles(response);
                    console.log("Roles loaded:", this.roles);
                },
                error: (error) => {
                    console.error("Roles loading error:", error);
                    this.roles = [];
                    this.errormessage =
                        "Unable to load role information. Please try again.";
                }
            });
    }

    private normalizeRoles(response: any): Role[] {
        const data = this.toArray(response);

        return data.map((role: any) => ({
            roleId: String(role?.roleId ?? role?.id ?? ""),
            roleName: String(role?.roleName ?? role?.name ?? "")
        })).filter((role: Role) =>
            role.roleId !== "" && role.roleName !== ""
        );
    }

    submitEmployee(): void {
        this.errormessage = "";
        this.successmessage = "";

        if (this.employeeForm.invalid) {
            this.employeeForm.markAllAsTouched();
            this.errormessage =
                "Please complete all required fields with valid information.";
            return;
        }

        const value = this.employeeForm.getRawValue();

        const request: RegisterEmployeeRequest = {
            employeeName: value.employeeName.trim(),
            emailAddress: value.emailAddress.trim(),
            mobileNumber: value.mobileNumber.trim(),
            branchId: Number(value.branchId)
        };

        const selectedRoleId = value.roleId.trim();

        console.log("Register employee request:", request);
        console.log("Selected role ID:", selectedRoleId);

        this.submitting = true;

        this.registerEmployeeUsecase.execute(request).subscribe({
            next: (response: any) => {
                console.log("Register employee response:", response);

                if (!selectedRoleId) {
                    this.finishRegistration();
                    return;
                }

                const userId = this.extractUserId(response);

                if (userId) {
                    this.assignRole(userId, selectedRoleId);
                    return;
                }

                this.findCreatedUserAndAssignRole(
                    request.emailAddress,
                    selectedRoleId
                );
            },
            error: (error) => {
                console.error("Employee registration error:", error);
                this.submitting = false;
                this.errormessage =
                    "Unable to create the employee account. Please verify the information and try again.";
            }
        });
    }

    private extractUserId(response: any): string {
        const data =
            response?.data?.data ||
            response?.data ||
            response?.result ||
            response;

        return String(
            data?.id ||
            data?.userId ||
            data?.employeeId ||
            data?.user?.id ||
            ""
        );
    }

    private findCreatedUserAndAssignRole(
        emailAddress: string,
        roleId: string
    ): void {
        this.getAllUsersUsecase.execute().subscribe({
            next: (response: any) => {
                const users: User[] = this.toArray(response);
                const createdUser = users.find(
                    (user: User) =>
                        user.emailAddress?.trim().toLowerCase() ===
                        emailAddress.trim().toLowerCase()
                );

                const userId = createdUser?.id;

                console.log("Created employee:", createdUser);

                if (
                    userId !== undefined &&
                    userId !== null &&
                    String(userId) !== ""
                ) {
                    this.assignRole(String(userId), roleId);
                    return;
                }

                this.submitting = false;
                this.errormessage =
                    "The employee account was created, but the employee details could not be retrieved.";
                this.loadUsers();
            },
            error: (error) => {
                console.error("Created employee lookup error:", error);
                this.submitting = false;
                this.errormessage =
                    "The employee account was created, but the selected role could not be assigned.";
                this.loadUsers();
            }
        });
    }

    private assignRole(userId: string, roleId: string): void {
        console.log("Assign role request:", { userId, roleId });

        this.updateUserRolesUsecase.execute({ userId, roleId }).subscribe({
            next: (response) => {
                console.log("Employee role assigned successfully:", response);
                this.finishRegistration();
            },
            error: (error) => {
                console.error("Role assignment error:", error);
                this.submitting = false;
                this.errormessage =
                    "The employee account was created successfully, but the selected role could not be assigned.";
                this.loadUsers();
            }
        });
    }

    private finishRegistration(): void {
        this.submitting = false;
        this.successmessage = "Employee account created successfully.";

        this.employeeForm.reset({
            employeeName: "",
            emailAddress: "",
            mobileNumber: "",
            branchId: 0,
            roleId: ""
        });

        this.showEmployeeModal = false;
        this.currentPage = 1;
        this.loadUsers();
    }

    get branchOptions(): string[] {
        return [
            ...new Set(
                this.users
                    .map(user => user.branchName?.trim())
                    .filter(Boolean) as string[]
            )
        ].sort();
    }

    get roleOptions(): string[] {
        const roles = this.users.flatMap(user =>
            Array.isArray(user.roles) ? user.roles : []
        );

        const fallback = this.users.map(user =>
            user.roleName || user.role || ""
        );

        return [
            ...new Set(
                [...roles, ...fallback]
                    .map(role => role.trim())
                    .filter(Boolean)
            )
        ].sort();
    }

    get filteredUsers(): User[] {
        const search = this.searchText.trim().toLowerCase();

        return this.users.filter(user => {
            const roles =
                Array.isArray(user.roles) && user.roles.length > 0
                    ? user.roles
                    : [user.roleName || user.role || ""];

            const matchesSearch =
                !search ||
                (user.employeeName || "").toLowerCase().includes(search) ||
                (user.employeeCode || "").toLowerCase().includes(search) ||
                (user.emailAddress || "").toLowerCase().includes(search) ||
                (user.mobileNumber || "").toLowerCase().includes(search) ||
                (user.branchName || "").toLowerCase().includes(search) ||
                roles.some(role => role?.toLowerCase().includes(search));

            const matchesBranch =
                !this.selectedBranch ||
                user.branchName === this.selectedBranch;

            const matchesRole =
                !this.selectedRole ||
                roles.some(role =>
                    role?.trim().toLowerCase() ===
                    this.selectedRole.trim().toLowerCase()
                );

            const active = (user as User & { isActive?: boolean }).isActive;

            const matchesStatus =
                this.selectedStatus === "all" ||
                (this.selectedStatus === "active" && active === true) ||
                (this.selectedStatus === "inactive" && active === false);

            return matchesSearch &&
                matchesBranch &&
                matchesRole &&
                matchesStatus;
        });
    }

    get paginatedUsers(): User[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredUsers.slice(start, start + this.pageSize);
    }

    get totalPages(): number {
        return Math.max(
            1,
            Math.ceil(this.filteredUsers.length / this.pageSize)
        );
    }

    get pageNumbers(): number[] {
        return Array.from(
            { length: this.totalPages },
            (_, index) => index + 1
        );
    }

    get startRecord(): number {
        if (this.filteredUsers.length === 0) {
            return 0;
        }

        return (this.currentPage - 1) * this.pageSize + 1;
    }

    get endRecord(): number {
        return Math.min(
            this.currentPage * this.pageSize,
            this.filteredUsers.length
        );
    }

    onSearch(event: Event): void {
        this.searchText = (event.target as HTMLInputElement).value;
        this.currentPage = 1;
        console.log("Search:", this.searchText);
        this.cdr.detectChanges();
    }

    onFilterChange(): void {
        this.currentPage = 1;

        console.log("Filters changed:", {
            branch: this.selectedBranch,
            role: this.selectedRole,
            status: this.selectedStatus
        });

        this.cdr.detectChanges();
    }

    clearFilters(): void {
        this.searchText = "";
        this.selectedBranch = "";
        this.selectedRole = "";
        this.selectedStatus = "all";
        this.currentPage = 1;

        console.log("Filters cleared");
        this.cdr.detectChanges();
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages) {
            return;
        }

        this.currentPage = page;
    }

    previousPage(): void {
        this.goToPage(this.currentPage - 1);
    }

    nextPage(): void {
        this.goToPage(this.currentPage + 1);
    }

    getUserName(user: User): string {
        return user.employeeName || "-";
    }

    getUserId(user: User): string {
        return user.employeeCode || "-";
    }

    getRoleText(user: User): string {
        if (Array.isArray(user.roles) && user.roles.length > 0) {
            return user.roles.join(", ");
        }

        return user.roleName || user.role || "-";
    }

    getStatus(user: User): boolean {
        return (user as User & { isActive?: boolean }).isActive === true;
    }

    viewProfile(user: User): void {
        this.selectedProfile = user;
    }

    closeProfile(): void {
        this.selectedProfile = null;
    }

    getProfileRoles(user: User): string {
        if (Array.isArray(user.roles) && user.roles.length) {
            return user.roles.join(", ");
        }

        return user.roleName || user.role || "Not assigned";
    }

    editUser(user: User): void {
        console.log("EDIT CLICKED:", user);
        console.log("USER ID:", user.id);

        if (
            user.id === undefined ||
            user.id === null ||
            user.id === ""
        ) {
            console.error("User ID not found:", user);
            return;
        }

        const url = `/main/edit-user-roles/${user.id}`;
        console.log("NAVIGATING TO:", url);

        this.router.navigate(
            ["/main/edit-user-roles", user.id],
            {
                state: {
                    userName: user.employeeName
                }
            }
        ).then(success => {
            console.log("Navigation result:", success);
        }).catch(error => {
            console.error("Navigation error:", error);
        });
    }
}
