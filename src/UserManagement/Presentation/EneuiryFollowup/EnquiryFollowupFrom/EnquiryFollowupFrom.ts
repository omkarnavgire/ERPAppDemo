import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BranchApi } from '../../../Infrastructure/Api/BranchApi';
import { TrainingCourse } from '../../../Application/TrainingCourse/TrainingCourse';
import { EnquiryApplication } from '../../../Application/Enquiry/EnquiryApplication';
import { QualificationApplication } from '../../../Application/Qualification/QualificationApplication';
import { LeadSourceApplication } from '../../../Application/LeadSource/LeadSourceApplication';

@Component({
    selector: 'app-enquiry-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './EnquiryFollowupFrom.html',
    styleUrls: ['./EnquiryFollowupFrom.css']
})
export class Enquiryform implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private branchApi = inject(BranchApi);
    private trainingCourse = inject(TrainingCourse);
    private enquiryApplication = inject(EnquiryApplication);
    private qualificationApplication = inject(QualificationApplication);
    private leadSourceApplication = inject(LeadSourceApplication);

    qualificationsLoading = false;
    leadSourcesLoading = false;

    qualifications: string[] = [];
    leadSourceOptions: string[] = [];

    enquiryForm!: FormGroup;
    isEditMode = false;
    enquiryId: number | null = null;
    branches: any[] = [];
    courses: any[] = [];
    branchesLoading = false;
    coursesLoading = false;
    errormessage = '';
    successmessage = '';

    enquiryForOptions: string[] = ['Job Placement', 'College Project', 'Upgrade Skill', 'Other', 'Real Time Project', 'AI', 'Certification'];


    ngOnInit(): void {
        this.createForm();
        this.loadBranches();
        this.loadCourses();
        this.loadQualifications();
        this.loadLeadSources();

        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.isEditMode = true;
            this.enquiryId = Number(id);
            this.loadEnquiry(this.enquiryId);
        }
    }

    createForm(): void {
        this.enquiryForm = this.fb.group({
            enquiryDate: [this.formatDateForInput(new Date()), Validators.required],
            branchId: ['', Validators.required],
            candidateName: ['', [Validators.required, Validators.minLength(2)]],
            gender: ['', Validators.required],
            localAddress: [''],
            emailAddress: ['', [Validators.required, Validators.email]],
            mobileNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
            birthDate: [''],
            qualification: ['', Validators.required],
            enquiryFor: [[]],
            leadSource: [[]],
            interestedTopics: [[]]
        });
    }

    loadBranches(): void {
        this.branchesLoading = true;

        this.branchApi.getAllBranches().subscribe({
            next: (response: any) => {
                console.log('Branch dropdown API response:', response);

                const data = Array.isArray(response) ? response : response?.data || response?.result || response?.items || [];

                this.branches = data
                    .map((branch: any) => ({
                        id: Number(branch?.branchId ?? branch?.id ?? branch?.branch_id ?? 0),
                        name: String(branch?.branchName ?? branch?.name ?? branch?.branch_name ?? '')
                    }))
                    .filter((branch: any) => branch.id > 0 && branch.name.trim() !== '')
                    .filter((branch: any, index: number, array: any[]) => index === array.findIndex(item => item.id === branch.id))
                    .sort((a: any, b: any) => a.name.localeCompare(b.name));

                console.log('Branch options loaded:', this.branches);
                this.branchesLoading = false;
            },
            error: (error: any) => {
                console.error('Branch loading error:', error);
                this.branches = [];
                this.branchesLoading = false;
                this.errormessage = error?.error?.message || 'Branches load nahi hui.';
            }
        });
    }

    loadQualifications():void{
    this.qualificationsLoading=true;

    this.qualificationApplication.getAll().subscribe({
        next:(response:any)=>{
            const data=Array.isArray(response)?response:response?.data||response?.result||response?.items||[];

            this.qualifications=data
                .map((item:any)=>String(item?.qualification??'').trim())
                .filter((item:string)=>item!=='')
                .filter((item:string,index:number,array:string[])=>array.indexOf(item)===index);

            this.qualificationsLoading=false;
        },
        error:(error:any)=>{
            console.error('Qualification API error:',error);
            this.qualifications=[];
            this.qualificationsLoading=false;
        }
    });
}

loadLeadSources():void{
    this.leadSourcesLoading=true;

    this.leadSourceApplication.getAll().subscribe({
        next:(response:any)=>{
            const data=Array.isArray(response)?response:response?.data||response?.result||response?.items||[];

            this.leadSourceOptions=data
                .map((item:any)=>String(item?.sourceName??'').trim())
                .filter((item:string)=>item!=='')
                .filter((item:string,index:number,array:string[])=>array.indexOf(item)===index);

            this.leadSourcesLoading=false;
        },
        error:(error:any)=>{
            console.error('Lead Source API error:',error);
            this.leadSourceOptions=[];
            this.leadSourcesLoading=false;
        }
    });
}

    loadCourses(): void {
        this.coursesLoading = true;

        console.log('Loading courses from TrainingCourse Application');

        this.trainingCourse.getAll().subscribe({
            next: (response: any) => {
                console.log('Course dropdown API response:', response);

                const data = Array.isArray(response) ? response : response?.data || response?.result || response?.items || [];

                this.courses = data
                    .map((course: any) => ({
                        id: Number(course?.courseId ?? course?.id ?? 0),
                        name: String(course?.courseName ?? course?.name ?? '')
                    }))
                    .filter((course: any) => course.id > 0 && course.name.trim() !== '')
                    .filter((course: any, index: number, array: any[]) => index === array.findIndex(item => item.id === course.id))
                    .sort((a: any, b: any) => a.name.localeCompare(b.name));

                console.log('Course options loaded:', this.courses);
                this.coursesLoading = false;
            },
            error: (error: any) => {
                console.error('Course loading error:', error);
                this.courses = [];
                this.coursesLoading = false;
                this.errormessage = error?.error?.message || 'Courses load nahi hue.';
            }
        });
    }

    loadEnquiry(id: number): void {
        console.log('Load Enquiry ID:', id);

        this.enquiryApplication.getById(id).subscribe({
            next: (response: any) => {
                console.log('Enquiry loaded:', response);
                this.patchEnquiry(response);
            },
            error: (error: any) => {
                console.error('Enquiry loading error:', error);
                this.errormessage = error?.error?.message || 'Enquiry load failed.';
            }
        });
    }

    patchEnquiry(data: any): void {
        this.enquiryForm.patchValue({
            enquiryDate: this.formatDateForInput(data?.enquiryDate),
            branchId: data?.branchId ?? data?.branch?.branchId ?? '',
            candidateName: data?.candidateName ?? '',
            gender: data?.gender ?? '',
            localAddress: data?.localAddress ?? '',
            emailAddress: data?.emailAddress ?? '',
            mobileNumber: data?.mobileNumber ?? '',
            birthDate: this.formatDateForInput(data?.birthDate),
            qualification: data?.qualification ?? '',
            enquiryFor: this.toArray(data?.enquiryFors ?? data?.enquiryFor),
            leadSource: this.toArray(data?.leadSources ?? data?.leadSource),
            interestedTopics: this.toArray(data?.interestedTopics)
        });

        console.log('Enquiry form patched:', this.enquiryForm.value);
    }

    isSelected(controlName: string, item: string): boolean {
        const selected = this.enquiryForm.get(controlName)?.value || [];
        return selected.includes(item);
    }

    toggleSelection(controlName: string, item: string): void {
        const control = this.enquiryForm.get(controlName);

        if (!control) return;

        const current: string[] = [...(control.value || [])];

        if (current.includes(item)) {
            control.setValue(current.filter(x => x !== item));
        } else {
            control.setValue([...current, item]);
        }

        control.markAsTouched();
        console.log('Selection changed:', controlName, control.value);
    }

    submit(): void {
        this.errormessage = '';
        this.successmessage = '';

        console.log('Form validity:', this.enquiryForm.valid);
        console.log('Form value:', this.enquiryForm.value);

        if (this.enquiryForm.invalid) {
            this.enquiryForm.markAllAsTouched();
            console.log('Form is invalid:', this.enquiryForm.errors);
            return;
        }

        const formValue = this.enquiryForm.value;

        const enquiry: any = {
            enquiryDate: formValue.enquiryDate,
            branchId: Number(formValue.branchId),
            branchName: this.branches.find(branch => branch.id === Number(formValue.branchId))?.name || '',
            candidateName: formValue.candidateName,
            gender: formValue.gender,
            localAddress: formValue.localAddress,
            emailAddress: formValue.emailAddress,
            mobileNumber: formValue.mobileNumber,
            birthDate: formValue.birthDate,
            qualification: formValue.qualification,
            enquiryFors: (formValue.enquiryFor || []).join(','),
            leadSources: (formValue.leadSource || []).join(','),
            interestedTopics: (formValue.interestedTopics || []).join(','),
            status: 'New'
        };

        console.log(this.isEditMode ? 'Update Enquiry:' : 'Create Enquiry:', enquiry);

        if (this.isEditMode && this.enquiryId) {
            const updateRequest = { enquiryId: this.enquiryId, ...enquiry };

            this.enquiryApplication.update(this.enquiryId, updateRequest).subscribe({
                next: (response) => {
                    console.log('Enquiry update successful:', response);
                    alert('Enquiry updated successfully!');
                    this.router.navigate(['/main/enquiry']);
                },
                error: (error: any) => {
                    console.error('Enquiry update error:', error);
                    console.error('Backend error response:', error.error);
                    this.errormessage = error?.error?.message || 'Enquiry update failed.';
                }
            });

            return;
        }

        this.enquiryApplication.create(enquiry).subscribe({
            next: (response) => {
                console.log('Enquiry create successful:', response);
                alert('Enquiry created successfully!');
                this.router.navigate(['/main/enquiry']);
            },
            error: (error: any) => {
                console.error('Enquiry create error:', error);
                console.error('Backend error response:', error.error);
                this.errormessage = error?.error?.message || 'Enquiry creation failed.';
            }
        });
    }

    getInvalidControls(): string[] {
        return Object.keys(this.enquiryForm.controls).filter(key => this.enquiryForm.get(key)?.invalid);
    }

    private toArray(value: any): string[] {
        if (Array.isArray(value)) return value;

        if (typeof value === 'string' && value.trim()) {
            return value.split(',').map(x => x.trim()).filter(x => x);
        }

        return [];
    }

    private formatDateForInput(value: any): string {
        if (!value) return '';

        const date = new Date(value);

        if (isNaN(date.getTime())) return '';

        return date.toISOString().substring(0, 10);
    }
}