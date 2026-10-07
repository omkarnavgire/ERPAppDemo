import {CommonModule} from '@angular/common';
import {ChangeDetectorRef,Component,OnInit,inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import * as XLSX from 'xlsx';
import {EnquiryApplication} from '../../../Application/Enquiry/EnquiryApplication';

export interface Enquiry {
    enquiryId:number;
    enquiryDate:string;
    candidateName:string;
    gender:string;
    localAddress:string;
    emailAddress:string;
    mobileNumber:string;
    birthDate:string;
    qualificationId:number;
    qualification:string;
    leadSources:string;
    enquiryFors:string;
    interestedTopics:string;
    status:string;
    branchId:number;
    branchName?:string;
    deletedAt?:string|null;
}

@Component({
    selector:'app-enquiry-list',
    standalone:true,
    imports:[CommonModule,FormsModule],
    templateUrl:'./EnquiryFollowupList.html',
    styleUrls:['./EnquiryFollowupList.css']
})
export class Enquirylist implements OnInit {
    private router=inject(Router);
    private enquiryApplication=inject(EnquiryApplication);
    private cdr=inject(ChangeDetectorRef);

    enquiries:Enquiry[]=[];
    filteredEnquiries:Enquiry[]=[];

    searchText='';
    fromDate='';
    toDate='';
    selectedBranch='';

    branches:string[]=[];
    openFilterColumn:string|null=null;

    columnFilters:Record<string,string[]>={};

    dateFilterFrom='';
    dateFilterTo='';

    filterColumns=[
        {key:'candidateName',label:'Candidate Name'},
        {key:'qualification',label:'Qualification'},
        {key:'enquiryFors',label:'Enquiry For'},
        {key:'leadSources',label:'Lead Source'},
        {key:'interestedTopics',label:'Interested Topics'}
    ];

    ngOnInit():void {
        this.loadEnquiries();
    }

    loadEnquiries():void {
        console.log('Enquiry List: Loading enquiries');

        this.enquiryApplication.getAll().subscribe({
            next:(response:any)=>{
                console.log('Enquiry List API response:',response);

                const data:Enquiry[]=Array.isArray(response)
                    ?response
                    :response?.data||response?.result||response?.items||[];

                this.enquiries=data;

                this.branches=[...new Set(
                    this.enquiries
                        .map(x=>x.branchName)
                        .filter((x):x is string=>!!x)
                )].sort();

                this.initializeColumnFilters();
                this.applyFilters();

                console.log('Enquiry count:',this.enquiries.length);
                console.log('Filtered enquiry count:',this.filteredEnquiries.length);

                this.cdr.detectChanges();
            },
            error:(error)=>{
                console.error('Enquiry List API error:',error);
                this.enquiries=[];
                this.filteredEnquiries=[];
                this.cdr.detectChanges();
            }
        });
    }

    initializeColumnFilters():void {
        this.filterColumns.forEach(column=>{
            if(!this.columnFilters[column.key]){
                this.columnFilters[column.key]=[];
            }
        });
    }

    toggleFilter(column:string):void {
        this.openFilterColumn=this.openFilterColumn===column?null:column;

        console.log('Open filter column:',this.openFilterColumn);

        this.cdr.detectChanges();
    }

    applyFilters():void {
        let data=[...this.enquiries];

        const search=this.searchText.trim().toLowerCase();

        if(search){
            data=data.filter(enquiry=>
                JSON.stringify(enquiry).toLowerCase().includes(search)
            );
        }

        if(this.fromDate){
            data=data.filter(enquiry=>
                this.getDateOnly(enquiry.enquiryDate)>=this.fromDate
            );
        }

        if(this.toDate){
            data=data.filter(enquiry=>
                this.getDateOnly(enquiry.enquiryDate)<=this.toDate
            );
        }

        if(this.selectedBranch){
            data=data.filter(enquiry=>
                enquiry.branchName===this.selectedBranch
            );
        }

        if(this.dateFilterFrom){
            data=data.filter(enquiry=>
                this.getDateOnly(enquiry.enquiryDate)>=this.dateFilterFrom
            );
        }

        if(this.dateFilterTo){
            data=data.filter(enquiry=>
                this.getDateOnly(enquiry.enquiryDate)<=this.dateFilterTo
            );
        }

        Object.keys(this.columnFilters).forEach(column=>{
            const selected=this.columnFilters[column];

            if(selected.length){
                data=data.filter(enquiry=>{
                    const value=this.getColumnValue(enquiry,column);
                    return selected.includes(value);
                });
            }
        });

        this.filteredEnquiries=[...data];

        console.log('Filtered enquiries:',this.filteredEnquiries);

        this.cdr.detectChanges();
    }

    getColumnValue(enquiry:Enquiry,column:string):string {
        const value=(enquiry as any)[column];

        if(value===null||value===undefined){
            return '';
        }

        return String(value);
    }

    getFilterValues(column:string):string[] {
        return [...new Set(
            this.enquiries
                .map(enquiry=>this.getColumnValue(enquiry,column))
                .filter(value=>value!=='')
        )].sort();
    }

    isFilterSelected(column:string,value:string):boolean {
        return this.columnFilters[column]?.includes(value)||false;
    }

    toggleColumnFilter(column:string,value:string):void {
        const selected=this.columnFilters[column]||[];

        if(selected.includes(value)){
            this.columnFilters[column]=selected.filter(x=>x!==value);
        }else{
            this.columnFilters[column]=[...selected,value];
        }

        console.log('Column filter:',column,value);

        this.applyFilters();
    }

    clearColumnFilter(column:string):void {
        this.columnFilters[column]=[];

        this.applyFilters();
    }

    applyDateColumnFilter():void {
        console.log('Date column filter:',{
            from:this.dateFilterFrom,
            to:this.dateFilterTo
        });

        this.applyFilters();
    }

    clearDateColumnFilter():void {
        this.dateFilterFrom='';
        this.dateFilterTo='';

        this.applyFilters();
    }

    clearFilters():void {
        this.searchText='';
        this.fromDate='';
        this.toDate='';
        this.selectedBranch='';
        this.dateFilterFrom='';
        this.dateFilterTo='';
        this.openFilterColumn=null;

        Object.keys(this.columnFilters).forEach(column=>{
            this.columnFilters[column]=[];
        });

        this.applyFilters();
    }

    newEnquiry():void {
        console.log('Open New Enquiry');

        this.router.navigate(['/main/enquiry/add']);
    }

    openFollowup(enquiry:Enquiry):void {
        console.log('Open Followup:',enquiry.enquiryId);

        this.router.navigate([
            '/main/enquiry/followup',
            enquiry.enquiryId
        ]);
    }

    exportExcel():void {
        const exportData=this.filteredEnquiries.map(enquiry=>({
            'Enquiry ID':enquiry.enquiryId,
            'Enquiry Date':enquiry.enquiryDate,
            'Candidate Name':enquiry.candidateName,
            'Gender':enquiry.gender,
            'Local Address':enquiry.localAddress,
            'Email Address':enquiry.emailAddress,
            'Mobile Number':enquiry.mobileNumber,
            'Birth Date':enquiry.birthDate,
            'Qualification':enquiry.qualification,
            'Lead Sources':enquiry.leadSources,
            'Enquiry For':enquiry.enquiryFors,
            'Interested Topics':enquiry.interestedTopics,
            'Status':enquiry.status,
            'Branch ID':enquiry.branchId,
            'Branch Name':enquiry.branchName||'',
            'Deleted At':enquiry.deletedAt||''
        }));

        if(!exportData.length){
            alert('No data available for export.');
            return;
        }

        const worksheet=XLSX.utils.json_to_sheet(exportData);
        const workbook=XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            'Enquiries'
        );

        XLSX.writeFile(
            workbook,
            `Enquiries_${this.getTodayDate()}.xlsx`
        );

        console.log('Enquiry Excel exported:',exportData.length);
    }

    private getDateOnly(value:string):string {
        if(!value){
            return '';
        }

        return String(value).substring(0,10);
    }

    private getTodayDate():string {
        return new Date().toISOString().substring(0,10);
    }
}