import {Component,OnInit,ChangeDetectorRef,inject} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {Router} from "@angular/router";
import {GetAllUsers} from "../../Application/User/GetAllUsers";
import {User} from "../../Domain/Entities/User";

@Component({
    selector:"app-user",
    standalone:true,
    imports:[CommonModule,FormsModule],
    templateUrl:"./User.html",
    styleUrl:"./User.css"
})
export class UserComponent implements OnInit{
    private getAllUsersUsecase=inject(GetAllUsers);
    private cdr=inject(ChangeDetectorRef);
    private router=inject(Router);

    users:User[]=[];
    searchText="";
    selectedBranch="";
    selectedRole="";
    selectedStatus="all";

    currentPage=1;
    pageSize=10;

    loading=false;
    errorMessage="";

    ngOnInit():void{
        this.loadUsers();
    }

    loadUsers():void{
        this.loading=true;
        this.errorMessage="";

        console.log("Loading users for User page...");

        this.getAllUsersUsecase.execute().subscribe({
            next:(response:any)=>{
                console.log("User API response:",response);

                this.users=this.toUserArray(response);
                this.currentPage=1;
                this.loading=false;

                console.log("User page records:",this.users.length);
                console.log("Loading state:",this.loading);

                this.cdr.detectChanges();
            },
            error:(error)=>{
                console.error("User page API error:",error);

                this.users=[];
                this.errorMessage=
                    error?.error?.message||
                    "Unable to load user records. Please try again.";
                this.loading=false;

                console.log("Loading state after error:",this.loading);

                this.cdr.detectChanges();
            }
        });
    }

    private toUserArray(response:any):User[]{
        if(Array.isArray(response)){
            return response;
        }

        if(Array.isArray(response?.data)){
            return response.data;
        }

        if(Array.isArray(response?.data?.data)){
            return response.data.data;
        }

        if(Array.isArray(response?.result)){
            return response.result;
        }

        if(Array.isArray(response?.items)){
            return response.items;
        }

        return [];
    }

    get branchOptions():string[]{
        return[
            ...new Set(
                this.users
                    .map(user=>user.branchName?.trim())
                    .filter(Boolean) as string[]
            )
        ].sort();
    }

    get roleOptions():string[]{
        const roles=this.users.flatMap(user=>
            Array.isArray(user.roles)?user.roles:[]
        );

        const fallback=this.users.map(user=>
            user.roleName||user.role||""
        );

        return[
            ...new Set(
                [...roles,...fallback]
                    .map(role=>role.trim())
                    .filter(Boolean)
            )
        ].sort();
    }

    get filteredUsers():User[]{
        const search=this.searchText.trim().toLowerCase();

        return this.users.filter(user=>{
            const roles=
                Array.isArray(user.roles)&&user.roles.length>0
                    ?user.roles
                    :[user.roleName||user.role||""];

            const matchesSearch=
                !search||
                (user.employeeName||"").toLowerCase().includes(search)||
                (user.employeeCode||"").toLowerCase().includes(search)||
                (user.emailAddress||"").toLowerCase().includes(search)||
                (user.mobileNumber||"").toLowerCase().includes(search)||
                (user.branchName||"").toLowerCase().includes(search)||
                roles.some(role=>
                    role?.toLowerCase().includes(search)
                );

            const matchesBranch=
                !this.selectedBranch||
                user.branchName===this.selectedBranch;

            const matchesRole=
                !this.selectedRole||
                roles.some(role=>
                    role?.trim().toLowerCase()===
                    this.selectedRole.trim().toLowerCase()
                );

            const active=(user as User&{
                isActive?:boolean
            }).isActive;

            const matchesStatus=
                this.selectedStatus==="all"||
                (
                    this.selectedStatus==="active"&&
                    active===true
                )||
                (
                    this.selectedStatus==="inactive"&&
                    active===false
                );

            return matchesSearch&&
                matchesBranch&&
                matchesRole&&
                matchesStatus;
        });
    }

    get paginatedUsers():User[]{
        const start=(this.currentPage-1)*this.pageSize;

        return this.filteredUsers.slice(
            start,
            start+this.pageSize
        );
    }

    get totalPages():number{
        return Math.max(
            1,
            Math.ceil(
                this.filteredUsers.length/
                this.pageSize
            )
        );
    }

    get pageNumbers():number[]{
        return Array.from(
            {length:this.totalPages},
            (_,index)=>index+1
        );
    }

    get startRecord():number{
        if(this.filteredUsers.length===0){
            return 0;
        }

        return(
            (this.currentPage-1)*
            this.pageSize
        )+1;
    }

    get endRecord():number{
        return Math.min(
            this.currentPage*this.pageSize,
            this.filteredUsers.length
        );
    }

    onSearch(event:Event):void{
        this.searchText=
            (event.target as HTMLInputElement).value;

        this.currentPage=1;

        console.log("Search:",this.searchText);

        this.cdr.detectChanges();
    }

    onFilterChange():void{
        this.currentPage=1;

        console.log("Filters changed:",{
            branch:this.selectedBranch,
            role:this.selectedRole,
            status:this.selectedStatus
        });

        this.cdr.detectChanges();
    }

    clearFilters():void{
        this.searchText="";
        this.selectedBranch="";
        this.selectedRole="";
        this.selectedStatus="all";
        this.currentPage=1;

        console.log("Filters cleared");

        this.cdr.detectChanges();
    }

    goToPage(page:number):void{
        if(
            page<1||
            page>this.totalPages
        ){
            return;
        }

        this.currentPage=page;

        console.log("Current page:",this.currentPage);
    }

    previousPage():void{
        this.goToPage(this.currentPage-1);
    }

    nextPage():void{
        this.goToPage(this.currentPage+1);
    }

    getUserName(user:User):string{
        return user.employeeName||"-";
    }

    getUserId(user:User):string{
        return user.employeeCode||"-";
    }

    getRoleText(user:User):string{
        if(
            Array.isArray(user.roles)&&
            user.roles.length>0
        ){
            return user.roles.join(", ");
        }

        return user.roleName||
            user.role||
            "-";
    }

    getStatus(user:User):boolean{
        return(
            user as User&{
                isActive?:boolean
            }
        ).isActive===true;
    }

    editUser(user:User):void{
        console.log("EDIT CLICKED:",user);
        console.log("USER ID:",user.id);

        if(
            user.id===undefined||
            user.id===null||
            user.id===""
        ){
            console.error(
                "User ID not found:",
                user
            );
            return;
        }

        const url=
            `/main/edit-user-roles/${user.id}`;

        console.log("NAVIGATING TO:",url);

        this.router.navigate(
            [
                "/main/edit-user-roles",
                user.id
            ],
            {
                state:{
                    userName:user.employeeName
                }
            }
        ).then(success=>{
            console.log(
                "Navigation result:",
                success
            );
        }).catch(error=>{
            console.error(
                "Navigation error:",
                error
            );
        });
    }
}