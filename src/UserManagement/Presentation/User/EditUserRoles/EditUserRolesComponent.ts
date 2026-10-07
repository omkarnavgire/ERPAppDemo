import { Component,OnInit,inject,ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute,Router } from "@angular/router";
import { forkJoin } from "rxjs";
import { GetAllRoles } from "../../../Application/User/GetAllRoles";
import { UpdateUserRoles } from "../../../Application/User/UpdateUserRoles";
import { Role } from "../../../Domain/Entities/Role";

@Component({
    selector:"app-edit-user-roles",
    standalone:true,
    imports:[CommonModule],
    templateUrl:"./EditUserRoles.html",
    styleUrl:"./EditUserRoles.css"
})
export class EditUserRolesComponent implements OnInit {
    private route=inject(ActivatedRoute);
    private router=inject(Router);
    private getAllRoles=inject(GetAllRoles);
    private updateUserRoles=inject(UpdateUserRoles);
    private cdr=inject(ChangeDetectorRef);

    userId="";
    userName="";

    allRoles:Role[]=[];
    currentRoles:Role[]=[];
    selectedRoleIds:string[]=[];

    loading=true;
    saving=false;

    errorMessage="";
    successMessage="";

    ngOnInit():void {
        this.userId=
            this.route.snapshot.paramMap.get("userId")||"";

        this.userName=
            history.state?.userName||"";

        console.log(
            "Edit role user ID:",
            this.userId
        );

        if(!this.userId) {
            this.errorMessage="User ID not found.";
            this.loading=false;
            return;
        }

        this.loadRoles();
    }

    private loadRoles():void {
        this.loading=true;
        this.errorMessage="";
        this.successMessage="";

        forkJoin({
            allRoles:this.getAllRoles.execute(),
            currentRoles:
                this.updateUserRoles.getUserRoles(
                    this.userId
                )
        }).subscribe({
            next:({allRoles,currentRoles}:any)=>{
                console.log(
                    "All roles API response:",
                    allRoles
                );

                console.log(
                    "Current user roles response:",
                    currentRoles
                );

                this.allRoles=
                    Array.isArray(allRoles)
                        ?allRoles
                        :allRoles?.data??[];

                const currentRoleData:any[]=
                    Array.isArray(currentRoles)
                        ?currentRoles
                        :currentRoles?.data??[];

                console.log(
                    "Current user roles data:",
                    currentRoleData
                );

                this.currentRoles=
                    this.normalizeCurrentRoles(
                        currentRoleData
                    );

                this.selectedRoleIds=
                    this.currentRoles.map(
                        role=>String(role.roleId)
                    );

                console.log(
                    "Normalized current roles:",
                    this.currentRoles
                );

                console.log(
                    "Selected role IDs:",
                    this.selectedRoleIds
                );

                this.loading=false;
                this.cdr.detectChanges();
            },

            error:error=>{
                console.error(
                    "Role loading error:",
                    error
                );

                this.errorMessage=
                    error?.error?.message||
                    error?.message||
                    "Roles load nahi hue.";

                this.loading=false;
                this.cdr.detectChanges();
            }
        });
    }

    private normalizeCurrentRoles(
        roles:any
    ):Role[] {
        const roleList:any[]=
            Array.isArray(roles)
                ?roles
                :roles?.data??[];

        return roleList
            .map((role:any)=>{
                if(typeof role==="string") {
                    const matchedRole=
                        this.allRoles.find(
                            allRole=>
                                String(allRole.roleName)
                                    .trim()
                                    .toLowerCase()===
                                role.trim().toLowerCase()
                        );

                    return matchedRole||null;
                }

                if(role?.roleId!==undefined&&
                   role?.roleId!==null) {

                    const matchedRole=
                        this.allRoles.find(
                            allRole=>
                                String(allRole.roleId)===
                                String(role.roleId)
                        );

                    return matchedRole||{
                        roleId:String(role.roleId),
                        roleName:String(
                            role.roleName||""
                        )
                    };
                }

                if(role?.roleName) {
                    const matchedRole=
                        this.allRoles.find(
                            allRole=>
                                String(allRole.roleName)
                                    .trim()
                                    .toLowerCase()===
                                String(role.roleName)
                                    .trim()
                                    .toLowerCase()
                        );

                    return matchedRole||null;
                }

                return null;
            })
            .filter(
                (role:any):role is Role=>
                    role!==null
            );
    }

    isSelected(roleId:string):boolean {
        return this.selectedRoleIds.includes(
            String(roleId)
        );
    }

    toggleRole(
        role:Role,
        event:Event
    ):void {
        const checked=
            (event.target as HTMLInputElement).checked;

        const roleId=
            String(role.roleId);

        if(checked) {
            if(!this.selectedRoleIds.includes(roleId)) {
                this.selectedRoleIds=[
                    ...this.selectedRoleIds,
                    roleId
                ];
            }

            console.log(
                "Role checked:",
                role
            );
        } else {
            this.selectedRoleIds=
                this.selectedRoleIds.filter(
                    id=>id!==roleId
                );

            console.log(
                "Role unchecked:",
                role
            );
        }

        console.log(
            "Selected role IDs:",
            this.selectedRoleIds
        );

        this.cdr.detectChanges();
    }

    hasChanges():boolean {
        const original=
            this.currentRoles
                .map(
                    role=>String(role.roleId)
                )
                .sort();

        const selected=
            [...this.selectedRoleIds]
                .map(
                    id=>String(id)
                )
                .sort();

        return JSON.stringify(original)!==
            JSON.stringify(selected);
    }

    saveChanges():void {
        if(this.saving) {
            return;
        }

        const originalIds=
            new Set(
                this.currentRoles.map(
                    role=>String(role.roleId)
                )
            );

        const selectedIds=
            new Set(
                this.selectedRoleIds.map(
                    id=>String(id)
                )
            );

        const rolesToAdd=
            this.allRoles.filter(
                role=>{
                    const roleId=
                        String(role.roleId);

                    return selectedIds.has(roleId)&&
                        !originalIds.has(roleId);
                }
            );

        const rolesToRemove=
            this.currentRoles.filter(
                role=>{
                    const roleId=
                        String(role.roleId);

                    return originalIds.has(roleId)&&
                        !selectedIds.has(roleId);
                }
            );

        console.log(
            "Roles to add:",
            rolesToAdd
        );

        console.log(
            "Roles to remove:",
            rolesToRemove
        );

        const requests:any[]=[];

        for(const role of rolesToAdd) {
            requests.push(
                this.updateUserRoles.execute({
                    userId:this.userId,
                    roleId:String(role.roleId)
                })
            );
        }

        for(const role of rolesToRemove) {
            requests.push(
                this.updateUserRoles.remove(
                    this.userId,
                    String(role.roleId)
                )
            );
        }

        if(requests.length===0) {
            console.log(
                "No role changes detected"
            );

            this.successMessage=
                "No changes to save.";

            return;
        }

        this.saving=true;
        this.errorMessage="";
        this.successMessage="";

        forkJoin(requests).subscribe({
            next:responses=>{
                console.log(
                    "Role changes saved successfully:",
                    responses
                );

                this.saving=false;

                this.successMessage=
                    "Roles updated successfully.";

                this.currentRoles=
                    this.allRoles.filter(
                        role=>
                            this.selectedRoleIds.includes(
                                String(role.roleId)
                            )
                    );

                this.cdr.detectChanges();

                setTimeout(()=>{
                    this.router.navigate(
                        ["/main/user"]
                    );
                },1000);
            },

            error:error=>{
                console.error(
                    "Role update error:",
                    error
                );

                this.saving=false;

                this.errorMessage=
                    error?.error?.message||
                    error?.message||
                    "Role update failed.";

                this.cdr.detectChanges();
            }
        });
    }

    back():void {
        console.log(
            "Back to user list"
        );

        this.router.navigate(
            ["/main/user"]
        );
    }
}