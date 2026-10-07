import {Component,OnInit,inject} from "@angular/core";
import {CommonModule} from "@angular/common";
import {ReactiveFormsModule,FormsModule,FormBuilder,Validators} from "@angular/forms";
import {finalize} from "rxjs";
import {RegisterEmployee} from "../../Application/Auth/RegisterEmployee";
import {GetAllUsers} from "../../Application/User/GetAllUsers";
import {GetAllRoles} from "../../Application/User/GetAllRoles";
import {UpdateUserRoles} from "../../Application/User/UpdateUserRoles";
import {BranchApi} from "../../Infrastructure/Api/BranchApi";
import {User} from "../../Domain/Entities/User";
import {Role} from "../../Domain/Entities/Role";
import {RegisterEmployeeRequest} from "../../Domain/Entities/Employee";

@Component({
    selector:"app-employee",
    standalone:true,
    imports:[CommonModule,ReactiveFormsModule,FormsModule],
    templateUrl:"./Employee.html",
    styleUrl:"./Employee.css"
})
export class EmployeeComponent implements OnInit{
    private fb=inject(FormBuilder);
    private registerEmployeeUsecase=inject(RegisterEmployee);
    private getAllUsersUsecase=inject(GetAllUsers);
    private getAllRolesUsecase=inject(GetAllRoles);
    private updateUserRolesUsecase=inject(UpdateUserRoles);
    private branchApi=inject(BranchApi);

    errormessage="";
    successmessage="";
    listerror="";
    submitting=false;
    loading=false;
    branchesLoading=false;
    rolesLoading=false;

    users:User[]=[];
    filteredUsers:User[]=[];
    paginatedUsers:User[]=[];
    roles:Role[]=[];
    branchOptions:{id:number,name:string}[]=[];

    searchText="";
    selectedBranchId="";
    selectedRoleId="";

    currentPage=1;
    pageSize=10;
    totalPages=1;
    pageNumbers:number[]=[];
    startRecord=0;
    endRecord=0;

    employeeForm=this.fb.nonNullable.group({
        employeeName:["",[Validators.required,Validators.minLength(2)]],
        emailAddress:["",[Validators.required,Validators.email]],
        mobileNumber:["",[Validators.required,Validators.pattern(/^[0-9]{10}$/)]],
        branchId:[0,[Validators.required,Validators.min(1)]],
        roleId:[""]
    });

    ngOnInit():void{
        this.loadUsers();
        this.loadBranches();
        this.loadRoles();
    }

    loadUsers():void{
        this.loading=true;
        this.listerror="";
        this.getAllUsersUsecase.execute().pipe(
            finalize(()=>this.loading=false)
        ).subscribe({
            next:(response:any)=>{
                console.log("Employee list API response:",response);
                const data=this.toArray(response);
                this.users=[...data].reverse();
                this.currentPage=1;
                this.applyFilters();
                console.log("Employee list loaded:",this.users.length);
            },
            error:(error)=>{
                console.error("Employee list error:",error);
                this.users=[];
                this.filteredUsers=[];
                this.paginatedUsers=[];
                this.updatePagination();
                this.listerror="Unable to load employee records. Please try again.";
            }
        });
    }

    loadBranches():void{
        this.branchesLoading=true;
        this.branchApi.getAllBranches().pipe(
            finalize(()=>this.branchesLoading=false)
        ).subscribe({
            next:(response:any)=>{
                console.log("Branch API response:",response);
                const data=this.toArray(response);
                this.branchOptions=data.map((branch:any)=>({
                    id:Number(branch?.branchId??branch?.id??branch?.branch_id??0),
                    name:String(branch?.branchName??branch?.name??branch?.branch_name??"")
                })).filter(branch=>branch.id>0&&branch.name.trim()!=="");
                this.branchOptions=this.branchOptions.filter((branch,index,self)=>index===self.findIndex(item=>item.id===branch.id));
                this.branchOptions.sort((a,b)=>a.name.localeCompare(b.name));
                console.log("Branch options:",this.branchOptions);
            },
            error:(error)=>{
                console.error("Branch loading error:",error);
                this.branchOptions=[];
                this.errormessage="Unable to load branch information. Please try again.";
            }
        });
    }

    loadRoles():void{
        this.rolesLoading=true;
        this.getAllRolesUsecase.execute().pipe(
            finalize(()=>this.rolesLoading=false)
        ).subscribe({
            next:(response:any)=>{
                console.log("Roles API response:",response);
                this.roles=this.normalizeRoles(response);
                console.log("Roles loaded:",this.roles);
            },
            error:(error)=>{
                console.error("Roles loading error:",error);
                this.roles=[];
                this.errormessage="Unable to load role information. Please try again.";
            }
        });
    }

    private normalizeRoles(response:any):Role[]{
        const data=this.toArray(response);
        return data.map((role:any)=>({
            roleId:String(role?.roleId??role?.id??""),
            roleName:String(role?.roleName??role?.name??"")
        })).filter((role:Role)=>role.roleId!==""&&role.roleName!=="");
    }

    private toArray(response:any):any[]{
        if(Array.isArray(response))return response;
        if(Array.isArray(response?.data?.data))return response.data.data;
        if(Array.isArray(response?.data))return response.data;
        if(Array.isArray(response?.result))return response.result;
        if(Array.isArray(response?.items))return response.items;
        return [];
    }

    submit():void{
        this.errormessage="";
        this.successmessage="";

        if(this.employeeForm.invalid){
            this.employeeForm.markAllAsTouched();
            this.errormessage="Please complete all required fields with valid information.";
            return;
        }

        const value=this.employeeForm.getRawValue();
        const request:RegisterEmployeeRequest={
            employeeName:value.employeeName.trim(),
            emailAddress:value.emailAddress.trim(),
            mobileNumber:value.mobileNumber.trim(),
            branchId:Number(value.branchId)
        };
        const selectedRoleId=value.roleId.trim();

        console.log("Register employee request:",request);
        console.log("Selected role ID:",selectedRoleId);

        this.submitting=true;

        this.registerEmployeeUsecase.execute(request).subscribe({
            next:(response:any)=>{
                console.log("Register employee response:",response);

                if(!selectedRoleId){
                    this.finishRegistration();
                    return;
                }

                const userId=this.extractUserId(response);

                if(userId){
                    this.assignRole(userId,selectedRoleId);
                    return;
                }

                this.findCreatedUserAndAssignRole(request.emailAddress,selectedRoleId);
            },
            error:(error)=>{
                console.error("Employee registration error:",error);
                this.submitting=false;
                this.errormessage="Unable to create the employee account. Please verify the information and try again.";
            }
        });
    }

    private extractUserId(response:any):string{
        const data=response?.data?.data||response?.data||response?.result||response;
        return String(data?.id||data?.userId||data?.employeeId||data?.user?.id||"");
    }

    private findCreatedUserAndAssignRole(emailAddress:string,roleId:string):void{
        this.getAllUsersUsecase.execute().subscribe({
            next:(response:any)=>{
                const users=this.toArray(response);
                const createdUser=users.find((user:User)=>user.emailAddress?.trim().toLowerCase()===emailAddress.trim().toLowerCase());
                const userId=createdUser?.id;

                console.log("Created employee:",createdUser);

                if(userId!==undefined&&userId!==null&&String(userId)!==""){
                    this.assignRole(String(userId),roleId);
                    return;
                }

                this.submitting=false;
                this.errormessage="The employee account was created, but the employee details could not be retrieved.";
                this.loadUsers();
            },
            error:(error)=>{
                console.error("Created employee lookup error:",error);
                this.submitting=false;
                this.errormessage="The employee account was created, but the selected role could not be assigned.";
                this.loadUsers();
            }
        });
    }

    private assignRole(userId:string,roleId:string):void{
        console.log("Assign role request:",{userId,roleId});

        this.updateUserRolesUsecase.execute({userId,roleId}).subscribe({
            next:(response)=>{
                console.log("Employee role assigned successfully:",response);
                this.finishRegistration();
            },
            error:(error)=>{
                console.error("Role assignment error:",error);
                this.submitting=false;
                this.errormessage="The employee account was created successfully, but the selected role could not be assigned.";
                this.loadUsers();
            }
        });
    }

    private finishRegistration():void{
        this.submitting=false;
        this.successmessage="Employee account created successfully.";

        this.employeeForm.reset({
            employeeName:"",
            emailAddress:"",
            mobileNumber:"",
            branchId:0,
            roleId:""
        });

        this.currentPage=1;
        this.loadUsers();
    }

    onSearch():void{
        this.currentPage=1;
        this.applyFilters();
    }

    clearFilters():void{
        this.searchText="";
        this.selectedBranchId="";
        this.selectedRoleId="";
        this.currentPage=1;
        this.applyFilters();
    }

    private applyFilters():void{
        const search=this.searchText.trim().toLowerCase();

        this.filteredUsers=this.users.filter((user:User)=>{
            const employeeCode=(user.employeeCode||"").toLowerCase();
            const name=this.displayName(user).toLowerCase();
            const email=(user.emailAddress||"").toLowerCase();
            const mobile=(user.mobileNumber||"").toLowerCase();
            const branchId=String(user.branchId??"");
            const roleText=this.displayRole(user).toLowerCase();

            const searchMatch=!search||
                employeeCode.includes(search)||
                name.includes(search)||
                email.includes(search)||
                mobile.includes(search);

            const branchMatch=!this.selectedBranchId||
                branchId===String(this.selectedBranchId);

            const roleName=this.getRoleName(this.selectedRoleId).toLowerCase();
            const roleMatch=!this.selectedRoleId||
                roleText.includes(roleName);

            return searchMatch&&branchMatch&&roleMatch;
        });

        this.updatePagination();
    }

    private getRoleName(roleId:string):string{
        if(!roleId)return "";

        const role=this.roles.find(
            item=>String(item.roleId)===String(roleId)
        );

        return role?.roleName||"";
    }

    private updatePagination():void{
        this.totalPages=Math.max(
            1,
            Math.ceil(this.filteredUsers.length/this.pageSize)
        );

        if(this.currentPage>this.totalPages){
            this.currentPage=this.totalPages;
        }

        const start=(this.currentPage-1)*this.pageSize;

        this.paginatedUsers=this.filteredUsers.slice(
            start,
            start+this.pageSize
        );

        this.pageNumbers=Array.from(
            {length:this.totalPages},
            (_,index)=>index+1
        );

        this.startRecord=this.filteredUsers.length===0?0:start+1;
        this.endRecord=Math.min(
            start+this.pageSize,
            this.filteredUsers.length
        );
    }

    goToPage(page:number):void{
        if(page<1||page>this.totalPages)return;

        this.currentPage=page;
        this.updatePagination();

        console.log("Employee current page:",page);
    }

    previousPage():void{
        this.goToPage(this.currentPage-1);
    }

    nextPage():void{
        this.goToPage(this.currentPage+1);
    }

    displayEmployeeCode(user:User):string{
        return user.employeeCode||"-";
    }

    displayName(user:User):string{
        return user.employeeName||"-";
    }

    displayRole(user:User):string{
        if(Array.isArray(user.roles)&&user.roles.length>0){
            return user.roles.join(", ");
        }

        return user.roleName||user.role||"-";
    }

    displayBranch(user:User):string{
        if(user.branchName)return user.branchName;

        if(user.branchId!==undefined&&user.branchId!==null){
            const branch=this.branchOptions.find(
                item=>String(item.id)===String(user.branchId)
            );

            return branch?.name||String(user.branchId);
        }

        return "-";
    }
}