import {Component,ChangeDetectorRef,inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {Lead} from '../../Domain/Entities/Lead';
import {LeadApplication} from '../../Application/Lead/LeadApplication';
import {LeadSource} from '../../Domain/Entities/LeadSource';
import {LeadSourceApplication} from '../../Application/LeadSource/LeadSourceApplication';
import {PermissionService,PERMISSIONS} from '../../Core/Services/PermissionService';
import {UserSessionService} from '../../Core/Services/UserSessionService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
    selector:'app-lead',
    standalone:true,
    imports:[CommonModule,FormsModule],
    templateUrl:'./Lead.html',
    styleUrl:'./Lead.css'
})
export class LeadComponent{
    private leadApplication=inject(LeadApplication);
    private leadSourceApplication=inject(LeadSourceApplication);
    private cdr=inject(ChangeDetectorRef);
    private router=inject(Router);
    private permissionService=inject(PermissionService);
    private userSession=inject(UserSessionService);

    leads:Lead[]=[];
    filteredLeads:Lead[]=[];
    leadSources:LeadSource[]=[];

    searchText='';
    statusFilter='';
    trainingTypeFilter='';
    dateFrom='';
    dateTo='';
    leadDateValue='';
    openFilterColumn='';
    showAddForm=false;
    showExportMenu=false;
    loading=false;
    leadSourcesLoading=false;
    canCreate=true;
    canFollowup=true;
    canExport=true;

    leadForm:Lead={
        leadId:0,
        candidateName:'',
        emailAddress:'',
        mobileNumber:'',
        trainingType:'Online',
        description:'',
        status:'New',
        leadDate:new Date(),
        sourceId:0,
        sourceName:''
    };

    ngOnInit():void{
        this.canCreate=this.permissionService.hasPermission(PERMISSIONS.LEAD_CREATE);
        this.canFollowup=this.userSession.isSuperUser()||!this.userSession.isAdmin()||this.permissionService.isAdminFunctionEnabled(PERMISSIONS.LEAD_FOLLOWUP);
        this.canExport=this.permissionService.hasPermission(PERMISSIONS.LEAD_EXPORT);
        this.setCurrentDate();
        this.loadLeads();
        this.loadLeadSources();
    }

    setCurrentDate():void{
        const date=new Date();
        this.leadDateValue=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    }

    loadLeads():void{
        this.loading=true;
        console.log('Lead Component: Loading all leads');

        this.leadApplication.getAll().subscribe({
            next:(response)=>{
                console.log('Lead API response:',response);
                this.leads=response||[];
                this.applyFilters();
                this.loading=false;
                this.cdr.detectChanges();
            },
            error:(error)=>{
                console.error('Lead API error:',error);
                this.leads=[];
                this.filteredLeads=[];
                this.loading=false;
                this.cdr.detectChanges();
            }
        });
    }

    loadLeadSources():void{
        this.leadSourcesLoading=true;
        console.log('LeadSource Component: Loading lead sources');

        this.leadSourceApplication.getAll().subscribe({
            next:(response)=>{
                console.log('LeadSource API response:',response);

                this.leadSources=(response||[])
                    .filter(source=>source.flag===1&&source.deletedAt===null)
                    .sort((a,b)=>a.sourceName.localeCompare(b.sourceName));

                console.log('Lead sources loaded:',this.leadSources);

                this.leadSourcesLoading=false;
                this.cdr.detectChanges();
            },
            error:(error)=>{
                console.error('LeadSource API error:',error);
                this.leadSources=[];
                this.leadSourcesLoading=false;
                this.cdr.detectChanges();
            }
        });
    }

    onLeadSourceChange():void{
        const source=this.leadSources.find(
            item=>Number(item.sourceId)===Number(this.leadForm.sourceId)
        );

        this.leadForm.sourceName=source?.sourceName||'';

        console.log('Selected Lead Source:',this.leadForm.sourceId,this.leadForm.sourceName);
    }

    applyFilters():void{
        const search=this.searchText.trim().toLowerCase();

        this.filteredLeads=this.leads.filter(lead=>{
            const matchesSearch=!search||
                (lead.candidateName||'').toLowerCase().includes(search)||
                (lead.emailAddress||'').toLowerCase().includes(search)||
                (lead.mobileNumber||'').toLowerCase().includes(search);

            const matchesStatus=!this.statusFilter||lead.status===this.statusFilter;
            const matchesTraining=!this.trainingTypeFilter||lead.trainingType===this.trainingTypeFilter;

            const leadDate=new Date(lead.leadDate);
            leadDate.setHours(0,0,0,0);

            const fromDate=this.dateFrom?new Date(this.dateFrom):null;
            const toDate=this.dateTo?new Date(this.dateTo):null;

            if(fromDate)fromDate.setHours(0,0,0,0);
            if(toDate)toDate.setHours(23,59,59,999);

            const matchesFrom=!fromDate||leadDate>=fromDate;
            const matchesTo=!toDate||leadDate<=toDate;

            return matchesSearch&&matchesStatus&&matchesTraining&&matchesFrom&&matchesTo;
        });
    }

    clearFilters():void{
        this.searchText='';
        this.statusFilter='';
        this.trainingTypeFilter='';
        this.dateFrom='';
        this.dateTo='';
        this.applyFilters();
    }

    toggleFilter(column:string):void{
        this.openFilterColumn=this.openFilterColumn===column?'':column;
    }

    applyDateFilter():void{
        this.applyFilters();
        this.openFilterColumn='';
    }

    clearDateFilter():void{
        this.dateFrom='';
        this.dateTo='';
        this.applyFilters();
    }

    openAddLead():void{
        if(!this.canCreate)return;
        this.setCurrentDate();

        this.leadForm={
            leadId:0,
            candidateName:'',
            emailAddress:'',
            mobileNumber:'',
            trainingType:'Online',
            description:'',
            status:'New',
            leadDate:this.createLocalDate(this.leadDateValue),
            sourceId:0,
            sourceName:''
        };

        this.showAddForm=true;
    }

    closeAddLead():void{
        this.showAddForm=false;
    }

    createLead():void{
        if(!this.canCreate)return;
        this.leadForm.status='New';
        this.leadForm.leadDate=this.createLocalDate(this.leadDateValue);
        this.onLeadSourceChange();

        console.log('Creating Lead:',this.leadForm);

        this.leadApplication.create(this.leadForm).subscribe({
            next:(response)=>{
                console.log('Create Lead API response:',response);
                this.showAddForm=false;
                this.loadLeads();
            },
            error:(error)=>{
                console.error('Create Lead API error:',error);
            }
        });
    }

    createLocalDate(value:string):Date{
        const [year,month,day]=value.split('-').map(Number);
        return new Date(year,month-1,day);
    }

    followup(lead:Lead):void{
        if(!this.canFollowup)return;
        console.log('Lead Followup clicked:',lead);
        this.router.navigate(['/main/lead/followup',lead.leadId]);
    }

    getStatusClass(status:string):string{
        return (status||'').toLowerCase().replace(/\s+/g,'-');
    }

    getLeadSourceName(sourceId:number):string{
        return this.leadSources.find(
            source=>Number(source.sourceId)===Number(sourceId)
        )?.sourceName||'';
    }

    toggleExportMenu():void{
        if(!this.canExport)return;
        this.showExportMenu=!this.showExportMenu;
    }

    exportExcel():void{
        if(!this.canExport)return;
        console.log('Exporting filtered leads to Excel:',this.filteredLeads);

        const data=this.filteredLeads.map((lead,index)=>({
            'Sr. No.':index+1,
            ID:lead.leadId,
            'Candidate Name':lead.candidateName,
            Email:lead.emailAddress,
            Mobile:lead.mobileNumber,
            'Training Type':lead.trainingType,
            Status:lead.status,
            'Lead Date':this.formatDate(lead.leadDate),
            'Lead Source':this.getLeadSourceName(lead.sourceId),
            Description:lead.description
        }));

        const worksheet=XLSX.utils.json_to_sheet(data);
        const workbook=XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook,worksheet,'Leads');
        XLSX.writeFile(workbook,`Leads_${this.getFileDate()}.xlsx`);

        this.showExportMenu=false;
    }

    exportPdf():void{
        if(!this.canExport)return;
        console.log('Exporting filtered leads to PDF:',this.filteredLeads);

        const doc=new jsPDF('l','mm','a4');

        doc.setFontSize(16);
        doc.text('Lead Report',14,15);

        doc.setFontSize(9);
        doc.text(`Total Leads: ${this.filteredLeads.length}`,14,22);

        const rows=this.filteredLeads.map((lead,index)=>[
            index+1,
            lead.leadId,
            lead.candidateName,
            lead.emailAddress,
            lead.mobileNumber,
            lead.trainingType,
            lead.status,
            this.formatDate(lead.leadDate),
            this.getLeadSourceName(lead.sourceId)
        ]);

        autoTable(doc,{
            startY:28,
            head:[[
                'Sr. No.',
                'ID',
                'Candidate Name',
                'Email',
                'Mobile',
                'Training Type',
                'Status',
                'Lead Date',
                'Lead Source'
            ]],
            body:rows,
            theme:'grid',
            styles:{
                fontSize:8,
                cellPadding:3
            },
            headStyles:{
                fontSize:8
            }
        });

        doc.save(`Leads_${this.getFileDate()}.pdf`);
        this.showExportMenu=false;
    }

    formatDate(date:Date|string):string{
        if(!date)return '';

        const value=new Date(date);

        if(isNaN(value.getTime()))return '';

        return `${String(value.getDate()).padStart(2,'0')}-${String(value.getMonth()+1).padStart(2,'0')}-${value.getFullYear()}`;
    }

    getFileDate():string{
        const date=new Date();

        return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    }
}