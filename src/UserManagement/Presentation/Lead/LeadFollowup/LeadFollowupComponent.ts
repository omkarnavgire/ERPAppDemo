import {Component,OnInit,ChangeDetectorRef,inject} from '@angular/core';
import {ActivatedRoute,Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {LeadFollowupApplication} from '../../../Application/LeadFollowup/LeadFollowupApplication';
import {LeadFollowup} from '../../../Domain/Entities/LeadFollowup';
import {LeadApplication} from '../../../Application/Lead/LeadApplication';
import {Lead} from '../../../Domain/Entities/Lead';
import {UserSessionService} from '../../../Core/Services/UserSessionService';

@Component({
    selector:'app-lead-followup',
    standalone:true,
    imports:[CommonModule,FormsModule],
    templateUrl:'./LeadFollowup.html',
    styleUrl:'./LeadFollowup.css'
})
export class LeadFollowupComponent implements OnInit{
    private route=inject(ActivatedRoute);
    private router=inject(Router);
    private followupApplication=inject(LeadFollowupApplication);
    private leadApplication=inject(LeadApplication);
    private userSession=inject(UserSessionService);
    private cdr=inject(ChangeDetectorRef);

    leadId:number=0;
    lead:Lead|null=null;
    followups:LeadFollowup[]=[];
    loading=false;
    leadLoading=false;
    saving=false;

    newFollowupExpanded=false;
    previousFollowupsExpanded=false;

    followupDateValue='';
    followupByValue='';

    followupForm:LeadFollowup={
        leadFollowupId:0,
        leadId:0,
        candidateName:'',
        followUpDate:new Date(),
        followUpBy:'',
        description:'',
        status:'',
        nextFollowupDate:new Date()
    };

    ngOnInit():void{
        this.leadId=Number(this.route.snapshot.paramMap.get('leadId'));
        console.log('Lead Followup page opened for Lead ID:',this.leadId);
        this.setFollowupDate();
        this.setFollowupBy();
        this.initializeFollowupForm();
        this.loadLead();
        this.loadFollowups();
    }

    toggleNewFollowup():void{
        this.newFollowupExpanded=!this.newFollowupExpanded;
    }

    togglePreviousFollowups():void{
        this.previousFollowupsExpanded=!this.previousFollowupsExpanded;
    }

    setFollowupDate():void{
        const date=new Date();
        const year=date.getFullYear();
        const month=String(date.getMonth()+1).padStart(2,'0');
        const day=String(date.getDate()).padStart(2,'0');
        const hours=String(date.getHours()).padStart(2,'0');
        const minutes=String(date.getMinutes()).padStart(2,'0');
        this.followupDateValue=`${year}-${month}-${day}T${hours}:${minutes}`;
        console.log('Current Followup Date:',this.followupDateValue);
    }

    setFollowupBy():void{
        this.followupByValue=this.userSession.employeeName||this.userSession.username||'';
        console.log('Logged-in Followup By:',this.followupByValue);
    }

    initializeFollowupForm():void{
        this.followupForm={
            leadFollowupId:0,
            leadId:this.leadId,
            candidateName:'',
            followUpDate:this.createLocalDateTime(this.followupDateValue),
            followUpBy:this.followupByValue,
            description:'',
            status:'',
            nextFollowupDate:new Date()
        };
    }

    createLocalDateTime(value:string):Date{
        const [datePart,timePart]=value.split('T');
        const [year,month,day]=datePart.split('-').map(Number);
        const [hours,minutes]=timePart.split(':').map(Number);
        return new Date(year,month-1,day,hours,minutes);
    }

    loadLead():void{
        this.leadLoading=true;
        this.leadApplication.getById(this.leadId).subscribe({
            next:(response)=>{
                console.log('Lead details API response:',response);
                this.lead=response;
                this.followupForm.candidateName=response.candidateName||'';
                this.leadLoading=false;
                this.cdr.detectChanges();
            },
            error:(error)=>{
                console.log('Lead details API error:',error);
                this.leadLoading=false;
                this.cdr.detectChanges();
            }
        });
    }

    loadFollowups():void{
        this.loading=true;
        this.followupApplication.getByLeadId(this.leadId).subscribe({
            next:(response)=>{
                console.log('Lead Followup API response:',response);
                this.followups=(response||[]).sort((a,b)=>a.leadFollowupId-b.leadFollowupId);
                this.loading=false;
                this.cdr.detectChanges();
            },
            error:(error)=>{
                console.log('Lead Followup API error:',error);
                this.followups=[];
                this.loading=false;
                this.cdr.detectChanges();
            }
        });
    }

    saveFollowup():void{
        if(!this.followupForm.status){
            console.log('Followup validation failed: Status is required');
            return;
        }

        if(!this.followupForm.description.trim()){
            console.log('Followup validation failed: Description is required');
            return;
        }

        this.followupForm.leadId=this.leadId;
        this.followupForm.candidateName=this.lead?.candidateName||'';
        this.followupForm.followUpBy=this.followupByValue;
        this.followupForm.followUpDate=this.createLocalDateTime(this.followupDateValue);

        console.log('Creating Lead Followup:',this.followupForm);

        this.saving=true;

        this.followupApplication.create(this.followupForm).subscribe({
            next:(response)=>{
                console.log('Lead Followup Create API response:',response);
                this.saving=false;
                this.loadFollowups();
                this.router.navigate(['/main/lead']);
                this.cdr.detectChanges();
            },
            error:(error)=>{
                console.error('Lead Followup Create API error:',error);
                this.saving=false;
                this.cdr.detectChanges();
            }
        });
    }

    backToLeads():void{
        console.log('Returning to Lead list');
        this.router.navigate(['/main/lead']);
    }
}