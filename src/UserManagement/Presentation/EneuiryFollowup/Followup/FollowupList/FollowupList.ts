import {CommonModule} from '@angular/common';
import {Component,OnInit,inject} from '@angular/core';
import {Router} from '@angular/router';
import {EnquiryFollowupApplication} from '../../../../Application/EneuiryFollowup/EnquiryFollowupApplication';
import {EnquiryFollowup} from '../../../../Domain/Entities/Eneuiryfollowup';
import {FormsModule} from '@angular/forms';

@Component({
    selector:'app-followup-list',
    standalone:true,
    imports:[CommonModule,FormsModule],
    templateUrl:'./FollowupList.html',
    styleUrls:['./FollowupList.css']
})
export class FollowupList implements OnInit{

    private application=inject(EnquiryFollowupApplication);
    private router=inject(Router);

    followups:EnquiryFollowup[]=[];
    filteredFollowups:EnquiryFollowup[]=[];
    loading=false;
    errormessage='';
    searchText='';

    ngOnInit():void{
        this.loadFollowups();
    }

    loadFollowups():void{
        this.loading=true;
        this.errormessage='';

        console.log('Loading all Enquiry Followups');

        this.application.getAll().subscribe({

            next:(response)=>{
                console.log(
                    'Enquiry Followups loaded:',
                    response
                );

                this.followups=response||[];
                this.filteredFollowups=[...this.followups];
                this.loading=false;
            },

            error:(error)=>{
                console.error(
                    'Enquiry Followups loading error:',
                    error
                );

                this.followups=[];
                this.filteredFollowups=[];

                this.errormessage=
                    error?.error?.message||
                    'Followups load failed.';

                this.loading=false;
            }
        });
    }

    search():void{

        const search=
            this.searchText.trim().toLowerCase();

        if(!search){

            this.filteredFollowups=[
                ...this.followups
            ];

            return;
        }

        this.filteredFollowups=
            this.followups.filter(
                followup=>
                    String(
                        followup.followupId
                    ).includes(search)||

                    followup.candidateName
                        ?.toLowerCase()
                        .includes(search)||

                    followup.followUpBy
                        ?.toLowerCase()
                        .includes(search)||

                    followup.description
                        ?.toLowerCase()
                        .includes(search)
            );

        console.log(
            'Followup search result:',
            this.filteredFollowups
        );
    }

    editFollowup(
        followup:EnquiryFollowup
    ):void{

        console.log(
            'Edit Followup:',
            followup.followupId
        );

        this.router.navigate(
            [
                '/main/enquiry/followup',
                followup.followupId
            ],
            {
                queryParams:{
                    followupId:
                        followup.followupId
                }
            }
        );
    }

    deleteFollowup(
        followup:EnquiryFollowup
    ):void{

        if(
            !confirm(
                `Delete followup for ${followup.candidateName}?`
            )
        ){
            return;
        }

        console.log(
            'Delete Followup:',
            followup.followupId
        );

        this.application
            .delete(followup.followupId)
            .subscribe({

                next:()=>{

                    console.log(
                        'Followup deleted successfully:',
                        followup.followupId
                    );

                    this.loadFollowups();
                },

                error:(error)=>{

                    console.error(
                        'Followup delete error:',
                        error
                    );

                    this.errormessage=
                        error?.error?.message||
                        'Followup delete failed.';
                }
            });
    }

    restoreFollowup(
        followup:EnquiryFollowup
    ):void{

        console.log(
            'Restore Followup:',
            followup.followupId
        );

        this.application
            .restore(followup.followupId)
            .subscribe({

                next:()=>{

                    console.log(
                        'Followup restored successfully:',
                        followup.followupId
                    );

                    this.loadFollowups();
                },

                error:(error)=>{

                    console.error(
                        'Followup restore error:',
                        error
                    );

                    this.errormessage=
                        error?.error?.message||
                        'Followup restore failed.';
                }
            });
    }

    addFollowup():void{

        console.log(
            'Open New Followup'
        );

        this.router.navigate([
            '/main/enquiry'
        ]);
    }

    backToEnquiry():void{

        this.router.navigate([
            '/main/enquiry'
        ]);
    }
}