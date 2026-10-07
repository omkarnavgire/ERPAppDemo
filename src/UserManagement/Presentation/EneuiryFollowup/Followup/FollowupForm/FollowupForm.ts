import {CommonModule} from '@angular/common';
import {Component,inject,OnInit} from '@angular/core';
import {FormBuilder,FormGroup,ReactiveFormsModule,Validators} from '@angular/forms';
import {ActivatedRoute,Router} from '@angular/router';
import {EnquiryFollowupApplication} from '../../../../Application/EneuiryFollowup/EnquiryFollowupApplication';
import {EnquiryFollowup} from '../../../../Domain/Entities/Eneuiryfollowup';
import {EnquiryApplication} from '../../../../Application/Enquiry/EnquiryApplication';
import {UserSessionService} from '../../../../Core/Services/UserSessionService';

@Component({
    selector:'app-followup-form',
    standalone:true,
    imports:[CommonModule,ReactiveFormsModule],
    templateUrl:'./FollowupForm.html',
    styleUrls:['./FollowupForm.css']
})
export class FollowupForm implements OnInit{

    private fb=inject(FormBuilder);
    private route=inject(ActivatedRoute);
    private router=inject(Router);
    private application=inject(EnquiryFollowupApplication);
    private enquiryApplication=inject(EnquiryApplication);
    private userSessionService=inject(UserSessionService);

    followupForm!:FormGroup;

    enquiryId:number|null=null;
    followupId:number|null=null;

    enquiry:any=null;
    followups:EnquiryFollowup[]=[];

    employeeName='';

    loading=false;
    followupsLoading=false;
    submitting=false;

    isEditMode=false;

    errormessage='';
    successmessage='';

    newFollowupExpanded=false;
    previousFollowupsExpanded=false;

    followupStatuses:string[]=[
        'Hot',
        'Warm',
        'Cold'
    ];

    ngOnInit():void{

        this.employeeName=
            this.userSessionService.employeeName||
            this.userSessionService.username||
            '';

        console.log(
            'Logged in Employee Name:',
            this.employeeName
        );

        this.createForm();

        const enquiryIdParam=
            this.route.snapshot.paramMap.get('enquiryId');

        const followupIdParam=
            this.route.snapshot.queryParamMap.get('followupId');

        if(enquiryIdParam){

            const parsedEnquiryId=
                Number(enquiryIdParam);

            if(parsedEnquiryId>0){

                this.enquiryId=
                    parsedEnquiryId;

                console.log(
                    'Followup opened for Enquiry ID:',
                    this.enquiryId
                );

                this.loadEnquiry(
                    parsedEnquiryId
                );

                this.loadFollowups(
                    parsedEnquiryId
                );
            }
        }

        if(followupIdParam){

            const parsedFollowupId=
                Number(followupIdParam);

            if(parsedFollowupId>0){

                this.followupId=
                    parsedFollowupId;

                this.isEditMode=true;

                this.loadFollowup(
                    parsedFollowupId
                );
            }
        }
    }

    toggleNewFollowup():void{

        this.newFollowupExpanded=
            !this.newFollowupExpanded;
    }

    togglePreviousFollowups():void{

        this.previousFollowupsExpanded=
            !this.previousFollowupsExpanded;
    }

    createForm():void{

        const today=
            this.formatDateForInput(
                new Date()
            );

        this.followupForm=
            this.fb.group({

                candidateName:[
                    '',
                    [Validators.required]
                ],

                followUpBy:[
                    {
                        value:this.employeeName,
                        disabled:true
                    },
                    [Validators.required]
                ],

                followUpDate:[
                    today,
                    [Validators.required]
                ],

                description:[
                    '',
                    [Validators.required]
                ],

                status:[
                    'Hot',
                    [Validators.required]
                ],

                nextFollowupDate:[
                    today,
                    [Validators.required]
                ]
            });
    }

    loadEnquiry(id:number):void{

        this.loading=true;
        this.errormessage='';

        console.log(
            'Load Enquiry for Followup:',
            id
        );

        this.enquiryApplication
            .getById(id)
            .subscribe({

                next:(response:any)=>{

                    console.log(
                        'Enquiry loaded for Followup:',
                        response
                    );

                    this.enquiry=
                        response;

                    this.followupForm.patchValue({
                        candidateName:
                            response?.candidateName||''
                    });

                    this.loading=false;
                },

                error:(error)=>{

                    console.error(
                        'Enquiry loading error:',
                        error
                    );

                    this.errormessage=
                        error?.error?.message||
                        'Enquiry load failed.';

                    this.loading=false;
                }
            });
    }

    loadFollowups(id?:number):void{

        const currentEnquiryId=
            id??this.enquiryId;

        if(
            !currentEnquiryId||
            currentEnquiryId<=0
        ){

            this.followups=[];

            return;
        }

        this.followupsLoading=true;

        console.log(
            'Loading Followups for Enquiry ID:',
            currentEnquiryId
        );

        this.application
            .getByEnquiryId(
                currentEnquiryId
            )
            .subscribe({

                next:(response:EnquiryFollowup[])=>{

                    console.log(
                        'Previous Followups loaded:',
                        response
                    );

                    this.followups=
                        response||[];

                    this.followupsLoading=false;
                },

                error:(error)=>{

                    console.error(
                        'Previous Followups loading error:',
                        error
                    );

                    this.followups=[];

                    this.followupsLoading=false;
                }
            });
    }

    loadFollowup(id:number):void{

        this.loading=true;
        this.errormessage='';

        console.log(
            'Load Enquiry Followup ID:',
            id
        );

        this.application
            .getById(id)
            .subscribe({

                next:(response:EnquiryFollowup)=>{

                    console.log(
                        'Enquiry Followup loaded:',
                        response
                    );

                    if(
                        (!this.enquiryId||
                        this.enquiryId<=0)&&
                        response.enquiryId>0
                    ){

                        this.enquiryId=
                            response.enquiryId;

                        this.loadEnquiry(
                            response.enquiryId
                        );

                        this.loadFollowups(
                            response.enquiryId
                        );
                    }

                    this.followupForm.patchValue({

                        candidateName:
                            response.candidateName||'',

                        followUpBy:
                            response.followUpBy||'',

                        followUpDate:
                            this.formatDateForInput(
                                response.followUpDate
                            ),

                        description:
                            response.description||'',

                        status:
                            response.status||'Hot',

                        nextFollowupDate:
                            this.formatDateForInput(
                                response.nextFollowupDate
                            )
                    });

                    this.loading=false;
                },

                error:(error)=>{

                    console.error(
                        'Enquiry Followup loading error:',
                        error
                    );

                    this.errormessage=
                        error?.error?.message||
                        'Followup load failed.';

                    this.loading=false;
                }
            });
    }

    submit():void{

        this.errormessage='';
        this.successmessage='';

        if(
            !this.enquiryId||
            this.enquiryId<=0
        ){

            this.errormessage=
                'Valid Enquiry ID is required for Followup.';

            return;
        }

        if(this.followupForm.invalid){

            this.followupForm.markAllAsTouched();

            return;
        }

        const currentEnquiryId=
            this.enquiryId;

        const value=
            this.followupForm.getRawValue();

        const followup:EnquiryFollowup={

            candidateName:
                String(
                    value.candidateName||''
                ).trim(),

            followupId:
                this.followupId??0,

            enquiryId:
                currentEnquiryId,

            sourceId:
                Number(
                    this.enquiry?.sourceId||0
                ),

            sourceName:
                String(
                    this.enquiry?.sourceName||
                    this.enquiry?.leadSources||
                    ''
                ),

            followUpDate:
                value.followUpDate,

            followUpBy:
                this.isEditMode
                    ?String(
                        value.followUpBy||''
                    ).trim()
                    :this.employeeName,

            description:
                String(
                    value.description||''
                ).trim(),

            status:
                String(
                    value.status||'Hot'
                ),

            nextFollowupDate:
                value.nextFollowupDate||
                value.followUpDate
        };

        console.log(
            this.isEditMode
                ?'Update Enquiry Followup:'
                :'Create Enquiry Followup:',
            followup
        );

        this.submitting=true;

        if(
            this.isEditMode&&
            this.followupId
        ){

            this.application
                .update(
                    this.followupId,
                    followup
                )
                .subscribe({

                    next:(response)=>{

                        console.log(
                            'Enquiry Followup update successful:',
                            response
                        );

                        this.successmessage=
                            'Followup updated successfully.';

                        this.submitting=false;

                        this.router.navigate([
                            '/main/enquiry/followup',
                            currentEnquiryId
                        ]);
                    },

                    error:(error)=>{

                        console.error(
                            'Enquiry Followup update error:',
                            error
                        );

                        this.errormessage=
                            error?.error?.message||
                            'Followup update failed.';

                        this.submitting=false;
                    }
                });

            return;
        }

        this.application
            .create(followup)
            .subscribe({

                next:(response)=>{

                    console.log(
                        'Enquiry Followup create successful:',
                        response
                    );

                    this.successmessage=
                        'Followup created successfully.';

                    this.submitting=false;

                    const today=
                        this.formatDateForInput(
                            new Date()
                        );

                    this.followupForm.patchValue({

                        followUpBy:
                            this.employeeName,

                        followUpDate:
                            today,

                        description:
                            '',

                        status:
                            'Hot',

                        nextFollowupDate:
                            today
                    });

                    this.loadFollowups(
                        currentEnquiryId
                    );
                },

                error:(error)=>{

                    console.error(
                        'Enquiry Followup create error:',
                        error
                    );

                    this.errormessage=
                        error?.error?.message||
                        'Followup creation failed.';

                    this.submitting=false;
                }
            });
    }

    editFollowup(
        followup:EnquiryFollowup
    ):void{

        console.log(
            'Edit Followup:',
            followup.followupId
        );

        if(
            !this.enquiryId||
            this.enquiryId<=0
        ){

            return;
        }

        this.router.navigate(
            [
                '/main/enquiry/followup',
                this.enquiryId
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
            .delete(
                followup.followupId
            )
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
            .restore(
                followup.followupId
            )
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

    cancel():void{

        this.router.navigate([
            '/main/enquiry'
        ]);
    }

    private formatDateForInput(
        value:any
    ):string{

        if(!value){

            return '';
        }

        const date=
            new Date(value);

        if(
            isNaN(
                date.getTime()
            )
        ){

            return '';
        }

        const year=
            date.getFullYear();

        const month=
            String(
                date.getMonth()+1
            ).padStart(2,'0');

        const day=
            String(
                date.getDate()
            ).padStart(2,'0');

        return `${year}-${month}-${day}`;
    }
}