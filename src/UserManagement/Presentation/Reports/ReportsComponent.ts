import {CommonModule} from '@angular/common';
import {ChangeDetectorRef,Component,inject,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {forkJoin} from 'rxjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {LeadApplication} from '../../Application/Lead/LeadApplication';
import {LeadFollowupApplication} from '../../Application/LeadFollowup/LeadFollowupApplication';
import {EnquiryApplication} from '../../Application/Enquiry/EnquiryApplication';
import {EnquiryFollowupApplication} from '../../Application/EneuiryFollowup/EnquiryFollowupApplication';
import {Lead} from '../../Domain/Entities/Lead';
import {LeadFollowup} from '../../Domain/Entities/LeadFollowup';
import {Enquiry} from '../../Domain/Entities/Enquiry';
import {EnquiryFollowup} from '../../Domain/Entities/Eneuiryfollowup';
import {User} from '../../Domain/Entities/User';
import {UserApi} from '../../Infrastructure/Api/UserAPi';

@Component({
    selector:'app-reports',
    standalone:true,
    imports:[CommonModule,FormsModule],
    templateUrl:'./Reports.html',
    styleUrl:'./Reports.css'
})
export class ReportsComponent implements OnInit{

    private leadApplication=inject(LeadApplication);
    private leadFollowupApplication=inject(LeadFollowupApplication);
    private enquiryApplication=inject(EnquiryApplication);
    private enquiryFollowupApplication=inject(EnquiryFollowupApplication);
    private userApi=inject(UserApi);
    private cdr=inject(ChangeDetectorRef);

    leads:Lead[]=[];
    leadFollowups:LeadFollowup[]=[];
    enquiries:Enquiry[]=[];
    enquiryFollowups:EnquiryFollowup[]=[];
    users:User[]=[];

    loading=true;
    errorMessage='';
    dateFrom='';
    dateTo='';
    branchFilter='All';
    courseFilter='All';
    counsellorFilter='All';

    private static reportCache:{
        leads:Lead[];
        leadFollowups:LeadFollowup[];
        enquiries:Enquiry[];
        enquiryFollowups:EnquiryFollowup[];
        users:User[];
    }|null=null;

    private static reportCacheLoaded=false;

    ngOnInit():void{
        this.setCurrentMonth();
        this.loadReports();
    }

    private setCurrentMonth():void{
        const today=new Date();
        const year=today.getFullYear();
        const month=String(today.getMonth()+1).padStart(2,'0');
        const day=String(today.getDate()).padStart(2,'0');

        this.dateFrom=`${year}-${month}-01`;
        this.dateTo=`${year}-${month}-${day}`;
    }

    setCurrentMonthFilter():void{
        this.setCurrentMonth();
        this.branchFilter='All';
        this.courseFilter='All';
        this.counsellorFilter='All';
    }

    loadReports(forceRefresh:boolean=false):void{

        if(!forceRefresh&&ReportsComponent.reportCacheLoaded&&ReportsComponent.reportCache){

            const cache=ReportsComponent.reportCache;

            this.leads=cache.leads;
            this.leadFollowups=cache.leadFollowups;
            this.enquiries=cache.enquiries;
            this.enquiryFollowups=cache.enquiryFollowups;
            this.users=cache.users;

            this.loading=false;
            this.cdr.detectChanges();

            return;
        }

        this.loading=true;
        this.errorMessage='';

        forkJoin({
            leads:this.leadApplication.getAll(),
            leadFollowups:this.leadFollowupApplication.getAll(),
            enquiries:this.enquiryApplication.getAll(),
            enquiryFollowups:this.enquiryFollowupApplication.getAll(),
            users:this.userApi.getAllUsers()
        }).subscribe({
            next:result=>{

                this.leads=result.leads||[];
                this.leadFollowups=result.leadFollowups||[];
                this.enquiries=result.enquiries||[];
                this.enquiryFollowups=result.enquiryFollowups||[];
                this.users=result.users||[];

                ReportsComponent.reportCache={
                    leads:this.leads,
                    leadFollowups:this.leadFollowups,
                    enquiries:this.enquiries,
                    enquiryFollowups:this.enquiryFollowups,
                    users:this.users
                };

                ReportsComponent.reportCacheLoaded=true;

                this.loading=false;
                this.cdr.detectChanges();
            },
            error:error=>{

                console.error('Reports API error:',error);

                this.errorMessage='Some report data could not be loaded. Please try again.';

                this.loading=false;
                this.cdr.detectChanges();
            }
        });
    }

    get branches():string[]{
        return [
            'All',
            ...new Set(
                this.enquiries
                    .map(x=>x.branchName||'')
                    .filter(Boolean)
            )
        ];
    }

    get courses():string[]{
        return [
            'All',
            ...new Set(
                this.enquiries
                    .map(x=>x.enquiryFors||'')
                    .filter(Boolean)
            )
        ];
    }

    get counsellors():string[]{

        const allowedNames=new Map<string,string>();

        for(const user of this.users){

            const roles:string[]=[
                ...(Array.isArray(user.roles)?user.roles:[]),
                user.roleName||'',
                user.role||''
            ]
            .filter(
                (role):role is string=>typeof role==='string'
            )
            .map(
                role=>role.trim().toLowerCase()
            );

            if(
                !roles.includes('counsellor')&&
                !roles.includes('super user')
            ){
                continue;
            }

            const employeeName=String(user.employeeName||'').trim();
            const userName=String(user.userName||'').trim();

            if(employeeName){
                allowedNames.set(
                    employeeName.toLowerCase(),
                    employeeName
                );
            }

            if(userName){
                allowedNames.set(
                    userName.toLowerCase(),
                    employeeName||userName
                );
            }
        }

        const result=new Set<string>();

        for(const followup of this.leadFollowups){

            const name=String(
                followup.followUpBy||''
            ).trim();

            const displayName=allowedNames.get(
                name.toLowerCase()
            );

            if(displayName){
                result.add(displayName);
            }
        }

        for(const followup of this.enquiryFollowups){

            const name=String(
                followup.followUpBy||''
            ).trim();

            const displayName=allowedNames.get(
                name.toLowerCase()
            );

            if(displayName){
                result.add(displayName);
            }
        }

        return [
            'All',
            ...Array.from(result).sort()
        ];
    }

    private inRange(value:any):boolean{

        if(!value){
            return true;
        }

        const d=new Date(value);

        if(isNaN(d.getTime())){
            return true;
        }

        d.setHours(0,0,0,0);

        if(this.dateFrom){

            const from=new Date(this.dateFrom);

            from.setHours(0,0,0,0);

            if(d<from){
                return false;
            }
        }

        if(this.dateTo){

            const to=new Date(this.dateTo);

            to.setHours(23,59,59,999);

            if(d>to){
                return false;
            }
        }

        return true;
    }

    get filteredLeads():Lead[]{
        return this.leads.filter(
            x=>this.inRange(x.leadDate)
        );
    }

    get filteredEnquiries():Enquiry[]{
        return this.enquiries.filter(
            x=>
                this.inRange(x.enquiryDate)&&
                (
                    this.branchFilter==='All'||
                    x.branchName===this.branchFilter
                )&&
                (
                    this.courseFilter==='All'||
                    x.enquiryFors===this.courseFilter
                )
        );
    }

    get filteredLeadFollowups():LeadFollowup[]{
        return this.leadFollowups.filter(
            x=>
                this.inRange(x.followUpDate)&&
                (
                    this.counsellorFilter==='All'||
                    this.isFollowupEmployeeMatch(
                        x.followUpBy,
                        this.counsellorFilter
                    )
                )
        );
    }

    get filteredEnquiryFollowups():EnquiryFollowup[]{
        return this.enquiryFollowups.filter(
            x=>
                this.inRange(x.followUpDate)&&
                (
                    this.counsellorFilter==='All'||
                    this.isFollowupEmployeeMatch(
                        x.followUpBy,
                        this.counsellorFilter
                    )
                )
        );
    }

    private isFollowupEmployeeMatch(
        followupName:string|undefined,
        selectedName:string
    ):boolean{

        if(
            !followupName||
            selectedName==='All'
        ){
            return true;
        }

        return followupName
            .trim()
            .toLowerCase()===
            selectedName
                .trim()
                .toLowerCase();
    }

    get latestLeadFollowups():LeadFollowup[]{

        const latest=new Map<number,LeadFollowup>();

        for(const followup of this.filteredLeadFollowups){

            const existing=latest.get(
                followup.leadId
            );

            if(!existing){

                latest.set(
                    followup.leadId,
                    followup
                );

                continue;
            }

            const currentDate=new Date(
                followup.followUpDate
            ).getTime();

            const existingDate=new Date(
                existing.followUpDate
            ).getTime();

            if(currentDate>existingDate){
                latest.set(
                    followup.leadId,
                    followup
                );
            }
        }

        return [
            ...latest.values()
        ].sort(
            (a,b)=>
                new Date(b.followUpDate).getTime()-
                new Date(a.followUpDate).getTime()
        );
    }

    get latestEnquiryFollowups():EnquiryFollowup[]{

        const latest=new Map<string,EnquiryFollowup>();

        for(const followup of this.filteredEnquiryFollowups){

            const key=(
                followup.candidateName||
                'Unknown'
            )
            .trim()
            .toLowerCase();

            const existing=latest.get(key);

            if(!existing){

                latest.set(
                    key,
                    followup
                );

                continue;
            }

            const currentDate=new Date(
                followup.followUpDate
            ).getTime();

            const existingDate=new Date(
                existing.followUpDate
            ).getTime();

            if(currentDate>existingDate){
                latest.set(
                    key,
                    followup
                );
            }
        }

        return [
            ...latest.values()
        ].sort(
            (a,b)=>
                new Date(b.followUpDate).getTime()-
                new Date(a.followUpDate).getTime()
        );
    }

    countStatus(
        items:{status?:string}[],
        statuses:string[]
    ):number{

        return items.filter(
            x=>
                statuses.includes(
                    (x.status||'')
                        .trim()
                        .toLowerCase()
                )
        ).length;
    }

    get leadConverted():number{
        return this.filteredLeads.filter(
            x=>/convert/i.test(x.status||'')
        ).length;
    }

    get leadLost():number{
        return this.filteredLeads.filter(
            x=>/lost|closed/i.test(x.status||'')
        ).length;
    }

    get leadConversionRate():number{

        return this.filteredLeads.length?
            Math.round(
                this.leadConverted*1000/
                this.filteredLeads.length
            )/10:
            0;
    }

    get enquiryConverted():number{
        return this.filteredEnquiries.filter(
            x=>/convert/i.test(x.status||'')
        ).length;
    }

    get enquiryLost():number{
        return this.filteredEnquiries.filter(
            x=>/lost|closed/i.test(x.status||'')
        ).length;
    }

    get enquiryConversionRate():number{

        return this.filteredEnquiries.length?
            Math.round(
                this.enquiryConverted*1000/
                this.filteredEnquiries.length
            )/10:
            0;
    }

    get leadFollowupCompleted():number{

        return this.countStatus(
            this.filteredLeadFollowups,
            [
                'completed',
                'complete',
                'done',
                'closed'
            ]
        );
    }

    get leadFollowupLost():number{

        return this.countStatus(
            this.filteredLeadFollowups,
            [
                'lost',
                'not interested'
            ]
        );
    }

    get leadFollowupPending():number{

        return Math.max(
            this.filteredLeadFollowups.length-
            this.leadFollowupCompleted-
            this.leadFollowupLost,
            0
        );
    }

    get leadFollowupOverdue():number{

        const now=new Date();

        return this.filteredLeadFollowups.filter(
            x=>{

                if(!x.nextFollowupDate){
                    return false;
                }

                const nextDate=new Date(
                    x.nextFollowupDate
                );

                return (
                    nextDate<now&&
                    !/completed|complete|done|closed|lost|not interested/i
                        .test(x.status||'')
                );
            }
        ).length;
    }

    get enquiryFollowupUpcoming():number{

        const now=new Date();

        return this.filteredEnquiryFollowups.filter(
            x=>
                new Date(x.followUpDate)>=now
        ).length;
    }

    get enquiryFollowupPast():number{

        const now=new Date();

        return this.filteredEnquiryFollowups.filter(
            x=>
                new Date(x.followUpDate)<now
        ).length;
    }

    get enquiryFollowupRecorded():number{
        return this.filteredEnquiryFollowups.length;
    }

    get leadFollowupChartRows(){

        return [
            {
                label:'Completed',
                value:this.leadFollowupCompleted
            },
            {
                label:'Pending',
                value:this.leadFollowupPending
            },
            {
                label:'Overdue',
                value:this.leadFollowupOverdue
            },
            {
                label:'Lost / Not Interested',
                value:this.leadFollowupLost
            }
        ];
    }

    maxLeadFollowupChartValue():number{

        return Math.max(
            ...this.leadFollowupChartRows.map(
                x=>x.value
            ),
            1
        );
    }

    leadFollowupPieStyle():string{

        const total=this.filteredLeadFollowups.length;

        if(!total){
            return 'conic-gradient(#e2e8f0 0 100%)';
        }

        const completed=
            this.leadFollowupCompleted/
            total*
            100;

        const pending=
            this.leadFollowupPending/
            total*
            100;

        const overdue=
            this.leadFollowupOverdue/
            total*
            100;

        const completedEnd=completed;
        const pendingEnd=completedEnd+pending;
        const overdueEnd=pendingEnd+overdue;

        return `conic-gradient(#2563eb 0 ${completedEnd}%,#f59e0b ${completedEnd}% ${pendingEnd}%,#ef4444 ${pendingEnd}% ${overdueEnd}%,#64748b ${overdueEnd}% 100%)`;
    }

    get leadSourceRows(){

        const m=new Map<
            string,
            {
                name:string;
                total:number;
                converted:number;
                lost:number;
            }
        >();

        for(const lead of this.filteredLeads){

            const name=
                lead.sourceName||
                'Unknown';

            const r=
                m.get(name)||
                {
                    name,
                    total:0,
                    converted:0,
                    lost:0
                };

            r.total++;

            if(/convert/i.test(lead.status||'')){
                r.converted++;
            }

            if(/lost|closed/i.test(lead.status||'')){
                r.lost++;
            }

            m.set(name,r);
        }

        return [
            ...m.values()
        ].sort(
            (a,b)=>b.total-a.total
        );
    }

    get counsellorRows(){

        const allowedEmployees=
            new Map<string,string>();

        for(const user of this.users){

            const roles:string[]=[
                ...(Array.isArray(user.roles)?
                    user.roles:
                    []
                ),
                user.roleName||'',
                user.role||''
            ]
            .filter(
                (role):role is string=>
                    typeof role==='string'
            )
            .map(
                role=>
                    role.trim().toLowerCase()
            );

            if(
                !roles.includes('counsellor')&&
                !roles.includes('super user')
            ){
                continue;
            }

            const employeeName=
                String(
                    user.employeeName||''
                ).trim();

            const userName=
                String(
                    user.userName||''
                ).trim();

            if(employeeName){
                allowedEmployees.set(
                    employeeName.toLowerCase(),
                    employeeName
                );
            }

            if(userName){
                allowedEmployees.set(
                    userName.toLowerCase(),
                    employeeName||
                    userName
                );
            }
        }

        const m=new Map<
            string,
            {
                name:string;
                total:number;
                completed:number;
                lost:number;
            }
        >();

        for(
            const followup of
            this.filteredLeadFollowups
        ){

            const followupName=
                String(
                    followup.followUpBy||''
                ).trim();

            const employeeName=
                allowedEmployees.get(
                    followupName.toLowerCase()
                );

            if(!employeeName){
                continue;
            }

            const r=
                m.get(employeeName)||
                {
                    name:employeeName,
                    total:0,
                    completed:0,
                    lost:0
                };

            r.total++;

            if(
                /completed|complete|done|closed/i
                    .test(followup.status||'')
            ){
                r.completed++;
            }

            if(
                /lost|not interested/i
                    .test(followup.status||'')
            ){
                r.lost++;
            }

            m.set(
                employeeName,
                r
            );
        }

        for(
            const followup of
            this.filteredEnquiryFollowups
        ){

            const followupName=
                String(
                    followup.followUpBy||''
                ).trim();

            const employeeName=
                allowedEmployees.get(
                    followupName.toLowerCase()
                );

            if(!employeeName){
                continue;
            }

            const r=
                m.get(employeeName)||
                {
                    name:employeeName,
                    total:0,
                    completed:0,
                    lost:0
                };

            r.total++;

            m.set(
                employeeName,
                r
            );
        }

        return [
            ...m.values()
        ].sort(
            (a,b)=>b.total-a.total
        );
    }

    maxSourceTotal():number{

        return Math.max(
            ...this.leadSourceRows.map(
                x=>x.total
            ),
            1
        );
    }

    private getReportDate():string{

        return `${
            this.dateFrom||'All'
        } to ${
            this.dateTo||'All'
        }`;
    }

    exportLeadFollowupExcel():void{

        const rows=
            this.latestLeadFollowups.map(
                (f,i)=>({

                    SR:i+1,

                    'Lead ID':f.leadId,

                    Candidate:f.candidateName,

                    Counsellor:f.followUpBy,

                    'Last Follow-up':
                        this.formatExportDate(
                            f.followUpDate
                        ),

                    Status:f.status||'',

                    'Last Follow-up Comment':
                        f.description||'',

                    'Next Follow-up':
                        this.formatExportDate(
                            f.nextFollowupDate
                        )
                })
            );

        const sheet=
            XLSX.utils.json_to_sheet(rows);

        const book=
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            book,
            sheet,
            'Lead Follow-up'
        );

        XLSX.writeFile(
            book,
            'Lead-Followup-Report.xlsx'
        );
    }

    exportEnquiryFollowupExcel():void{

        const rows=
            this.latestEnquiryFollowups.map(
                (f,i)=>({

                    SR:i+1,

                    Candidate:f.candidateName,

                    Counsellor:f.followUpBy,

                    'Last Follow-up':
                        this.formatExportDate(
                            f.followUpDate
                        ),

                    'Last Follow-up Comment':
                        f.description||''
                })
            );

        const sheet=
            XLSX.utils.json_to_sheet(rows);

        const book=
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            book,
            sheet,
            'Enquiry Follow-up'
        );

        XLSX.writeFile(
            book,
            'Enquiry-Followup-Report.xlsx'
        );
    }

    exportLeadFollowupPdf():void{

        const doc=
            new jsPDF('landscape');

        doc.setFontSize(16);

        doc.text(
            'Lead Follow-up Report',
            14,
            15
        );

        doc.setFontSize(9);

        doc.text(
            `Period: ${this.getReportDate()}`,
            14,
            22
        );

        const rows=
            this.latestLeadFollowups.map(
                (f,i)=>[
                    i+1,
                    f.leadId,
                    f.candidateName,
                    f.followUpBy,
                    this.formatExportDate(
                        f.followUpDate
                    ),
                    f.status||'',
                    f.description||'',
                    this.formatExportDate(
                        f.nextFollowupDate
                    )
                ]
            );

        autoTable(
            doc,
            {
                head:[
                    [
                        'SR',
                        'Lead ID',
                        'Candidate',
                        'Counsellor',
                        'Last Follow-up',
                        'Status',
                        'Last Comment',
                        'Next Follow-up'
                    ]
                ],
                body:rows,
                startY:28,
                styles:{
                    fontSize:7,
                    cellPadding:2
                },
                headStyles:{
                    fontSize:7
                }
            }
        );

        doc.save(
            'Lead-Followup-Report.pdf'
        );
    }

    exportEnquiryFollowupPdf():void{

        const doc=
            new jsPDF('landscape');

        doc.setFontSize(16);

        doc.text(
            'Enquiry Follow-up Report',
            14,
            15
        );

        doc.setFontSize(9);

        doc.text(
            `Period: ${this.getReportDate()}`,
            14,
            22
        );

        const rows=
            this.latestEnquiryFollowups.map(
                (f,i)=>[
                    i+1,
                    f.candidateName,
                    f.followUpBy,
                    this.formatExportDate(
                        f.followUpDate
                    ),
                    f.description||''
                ]
            );

        autoTable(
            doc,
            {
                head:[
                    [
                        'SR',
                        'Candidate',
                        'Counsellor',
                        'Last Follow-up',
                        'Last Comment'
                    ]
                ],
                body:rows,
                startY:28,
                styles:{
                    fontSize:7,
                    cellPadding:2
                },
                headStyles:{
                    fontSize:7
                }
            }
        );

        doc.save(
            'Enquiry-Followup-Report.pdf'
        );
    }

    private formatExportDate(
        value:any
    ):string{

        if(!value){
            return '';
        }

        const date=new Date(value);

        if(isNaN(date.getTime())){
            return '';
        }

        return date.toLocaleDateString(
            'en-GB',
            {
                day:'2-digit',
                month:'short',
                year:'numeric'
            }
        );
    }

    clearFilters():void{

        this.dateFrom='';
        this.dateTo='';
        this.branchFilter='All';
        this.courseFilter='All';
        this.counsellorFilter='All';
    }
}