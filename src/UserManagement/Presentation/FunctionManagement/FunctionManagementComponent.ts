import {CommonModule} from "@angular/common";
import {Component,inject} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {PERMISSIONS,Permission,PermissionService} from "../../Core/Services/PermissionService";

interface FunctionItem{module:string;name:string;description:string;permission:Permission;defaultAccess:string;web:boolean;mobile:boolean;custom?:boolean;}

@Component({selector:"app-function-management",standalone:true,imports:[CommonModule,FormsModule],templateUrl:"./FunctionManagement.html",styleUrl:"./FunctionManagement.css"})
export class FunctionManagementComponent{
    private permissionService=inject(PermissionService);
    searchText="";moduleFilter="All";statusFilter="All";showCreate=false;editing:FunctionItem|null=null;
    customName="";customId="";customModule="";customDescription="";
    private readonly builtIn:FunctionItem[]=[
        {module:"Dashboard",name:"View Dashboard",description:"Access the shared ERP dashboard",permission:PERMISSIONS.DASHBOARD_VIEW,defaultAccess:"Everyone",web:true,mobile:true},
        {module:"User",name:"View Users",description:"View users and access profiles",permission:PERMISSIONS.USER_VIEW,defaultAccess:"Everyone",web:true,mobile:true},
        {module:"User",name:"Create Users",description:"Create system users",permission:PERMISSIONS.USER_CREATE,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Employee",name:"View Employees",description:"View employee records",permission:PERMISSIONS.EMPLOYEE_VIEW,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Employee",name:"Create Employees",description:"Register employees",permission:PERMISSIONS.EMPLOYEE_CREATE,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Branch",name:"View Branches",description:"View institute branches",permission:PERMISSIONS.BRANCH_VIEW,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Branch",name:"Create Branches",description:"Create branches",permission:PERMISSIONS.BRANCH_CREATE,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Role",name:"View Roles",description:"View roles and access definitions",permission:PERMISSIONS.ROLE_VIEW,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Course",name:"View Courses",description:"View training courses",permission:PERMISSIONS.COURSE_VIEW,defaultAccess:"Applicable users",web:true,mobile:true},
        {module:"Course",name:"Create Courses",description:"Create training courses",permission:PERMISSIONS.COURSE_CREATE,defaultAccess:"Applicable users",web:true,mobile:true},
        {module:"Lead",name:"View Leads",description:"View lead records",permission:PERMISSIONS.LEAD_VIEW,defaultAccess:"Everyone",web:true,mobile:true},
        {module:"Lead",name:"Create Leads",description:"Create new leads",permission:PERMISSIONS.LEAD_CREATE,defaultAccess:"Everyone",web:true,mobile:true},
        {module:"Lead",name:"Lead Follow-up",description:"Open and manage existing lead follow-up flow",permission:PERMISSIONS.LEAD_FOLLOWUP,defaultAccess:"Everyone",web:true,mobile:true},
        {module:"Lead",name:"Update Leads",description:"Edit lead information",permission:PERMISSIONS.LEAD_UPDATE,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Lead",name:"Delete Leads",description:"Delete lead records",permission:PERMISSIONS.LEAD_DELETE,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Lead",name:"Restore Leads",description:"Restore deleted leads",permission:PERMISSIONS.LEAD_RESTORE,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Lead",name:"Export Leads",description:"Export lead data to reports",permission:PERMISSIONS.LEAD_EXPORT,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Enquiry",name:"View Enquiries",description:"View enquiry records",permission:PERMISSIONS.ENQUIRY_VIEW,defaultAccess:"Everyone",web:true,mobile:true},
        {module:"Enquiry",name:"Create Enquiries",description:"Create enquiries",permission:PERMISSIONS.ENQUIRY_CREATE,defaultAccess:"Everyone",web:true,mobile:true},
        {module:"Enquiry",name:"Enquiry Follow-up",description:"Open enquiry follow-up flow",permission:PERMISSIONS.ENQUIRY_FOLLOWUP,defaultAccess:"Everyone",web:true,mobile:true},
        {module:"Reports",name:"View Business Reports",description:"Access management and operational reports",permission:PERMISSIONS.REPORTS_VIEW,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Enquiry",name:"Update Enquiries",description:"Edit enquiry information",permission:PERMISSIONS.ENQUIRY_UPDATE,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Enquiry",name:"Delete Enquiries",description:"Delete enquiry records",permission:PERMISSIONS.ENQUIRY_DELETE,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Enquiry",name:"Export Enquiries",description:"Export enquiry data",permission:PERMISSIONS.ENQUIRY_EXPORT,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Lead Source",name:"Manage Lead Sources",description:"Maintain lead source master data",permission:PERMISSIONS.LEAD_SOURCE_VIEW,defaultAccess:"Admin / Super User",web:true,mobile:true},
        {module:"Qualification",name:"Manage Qualifications",description:"Maintain qualification master data",permission:PERMISSIONS.QUALIFICATION_VIEW,defaultAccess:"Admin / Super User",web:true,mobile:true}
    ];
    functions:FunctionItem[]=[...this.builtIn];
    get modules():string[]{return ["All",...new Set(this.functions.map(f=>f.module))];}
    get filtered():FunctionItem[]{const q=this.searchText.trim().toLowerCase();return this.functions.filter(f=>(this.moduleFilter==="All"||f.module===this.moduleFilter)&&(!q||`${f.name} ${f.permission} ${f.description}`.toLowerCase().includes(q))&&(this.statusFilter==="All"||(this.statusFilter==="Enabled"&&this.isEnabled(f))||(this.statusFilter==="Disabled"&&!this.isEnabled(f))));}
    get enabledCount():number{return this.functions.filter(f=>this.isEnabled(f)).length;}
    get disabledCount():number{return this.functions.length-this.enabledCount;}
    get moduleCount():number{return new Set(this.functions.map(f=>f.module)).size;}
    isEnabled(f:FunctionItem):boolean{return this.permissionService.isFunctionEnabled(f.permission);}
    toggle(f:FunctionItem):void{this.permissionService.setFunctionEnabled(f.permission,!this.isEnabled(f));}
    enableAll():void{this.permissionService.enableAll();}
    disableAll():void{this.permissionService.disableAll();}
    resetDefaults():void{this.permissionService.resetDefaults();}
    openCreate():void{this.customName="";this.customId="";this.customModule="";this.customDescription="";this.showCreate=true;}
    closeCreate():void{this.showCreate=false;this.editing=null;}
    edit(f:FunctionItem):void{this.editing=f;this.customName=f.name;this.customId=f.permission;this.customModule=f.module;this.customDescription=f.description;this.showCreate=true;}
    saveFunction():void{const id=this.customId.trim().toUpperCase().replace(/[^A-Z0-9_]/g,"_") as Permission;if(!this.customName.trim()||!id||!this.customModule.trim())return; if(this.editing){this.editing.name=this.customName.trim();this.editing.module=this.customModule.trim();this.editing.description=this.customDescription.trim();}else{this.functions.push({module:this.customModule.trim(),name:this.customName.trim(),description:this.customDescription.trim(),permission:id,defaultAccess:"Admin controlled",web:true,mobile:true,custom:true});this.permissionService.setFunctionEnabled(id,true);}this.closeCreate();}
    deleteCustom(f:FunctionItem):void{if(!f.custom)return;this.functions=this.functions.filter(x=>x!==f);}
}
