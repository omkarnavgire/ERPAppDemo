import {CommonModule} from '@angular/common';
import {Component,OnInit,inject} from '@angular/core';
import {FormBuilder,FormGroup,ReactiveFormsModule,Validators,FormsModule} from '@angular/forms';
import {TrainingCourse as TrainingCourseEntity} from '../../Domain/Entities/TrainingCourse';
import {TrainingCourse as TrainingCourseApplication} from '../../Application/TrainingCourse/TrainingCourse';

@Component({
    selector:'app-training-course',
    standalone:true,
    imports:[CommonModule,ReactiveFormsModule,FormsModule],
    templateUrl:'./TrainingCourse.html',
    styleUrls:['./TrainingCourse.css']
})
export class TrainingCourseComponent implements OnInit{
    private fb=inject(FormBuilder);
    private trainingCourseApplication=inject(TrainingCourseApplication);

    courseForm!:FormGroup;
    courses:TrainingCourseEntity[]=[];
    filteredCourses:TrainingCourseEntity[]=[];
    paginatedCourses:TrainingCourseEntity[]=[];

    searchText='';
    editingId:number|null=null;
    showCourseModal=false;

    currentPage=1;
    pageSize=10;
    totalPages=1;
    pageNumbers:number[]=[];

    loading=false;
    submitting=false;
    errorMessage='';
    successMessage='';

    ngOnInit():void{
        this.createForm();
        this.loadCourses();
    }

    createForm():void{
        this.courseForm=this.fb.group({
            courseId:[0],
            courseName:['',[Validators.required,Validators.minLength(2)]],
            feesAmount:[null,[Validators.required,Validators.min(0)]],
            feesChangeDate:[''],
            installmentPercentage:[null,[Validators.min(0),Validators.max(100)]]
        });
    }

    loadCourses():void{
        this.loading=true;
        this.errorMessage='';

        console.log('Training Course Component: Loading courses');

        this.trainingCourseApplication.getAll().subscribe({
            next:(response)=>{
                console.log('Training Course list response:',response);

                this.courses=Array.isArray(response)?response:[];
                this.currentPage=1;
                this.filterCourses();
                this.loading=false;
            },
            error:(error)=>{
                console.error('Training Course loading error:',error);
                this.courses=[];
                this.filteredCourses=[];
                this.paginatedCourses=[];
                this.updatePagination();
                this.loading=false;
                this.errorMessage=error?.error?.message||'Courses could not be loaded.';
            }
        });
    }

    filterCourses():void{
        const search=this.searchText.trim().toLowerCase();

        this.filteredCourses=this.courses.filter(course=>
            course.courseName?.toLowerCase().includes(search)
        );

        this.currentPage=1;
        this.updatePagination();

        console.log('Training Course Search:',search,'Results:',this.filteredCourses.length);
    }

    updatePagination():void{
        this.totalPages=Math.max(1,Math.ceil(this.filteredCourses.length/this.pageSize));

        if(this.currentPage>this.totalPages){
            this.currentPage=this.totalPages;
        }

        const start=(this.currentPage-1)*this.pageSize;
        const end=start+this.pageSize;

        this.paginatedCourses=this.filteredCourses.slice(start,end);

        this.pageNumbers=Array.from(
            {length:this.totalPages},
            (_,index)=>index+1
        );

        console.log('Training Course Pagination:',{
            currentPage:this.currentPage,
            totalPages:this.totalPages,
            records:this.paginatedCourses.length
        });
    }

    goToPage(page:number):void{
        if(page<1||page>this.totalPages||page===this.currentPage){
            return;
        }

        this.currentPage=page;
        this.updatePagination();
    }

    previousPage():void{
        if(this.currentPage>1){
            this.currentPage--;
            this.updatePagination();
        }
    }

    nextPage():void{
        if(this.currentPage<this.totalPages){
            this.currentPage++;
            this.updatePagination();
        }
    }

    get startRecord():number{
        if(this.filteredCourses.length===0){
            return 0;
        }

        return (this.currentPage-1)*this.pageSize+1;
    }

    get endRecord():number{
        return Math.min(
            this.currentPage*this.pageSize,
            this.filteredCourses.length
        );
    }

    openAddCourse():void{
        console.log('Open Add Training Course');

        this.resetForm();
        this.errorMessage='';
        this.successMessage='';
        this.showCourseModal=true;
    }

    closeCourseModal():void{
        if(this.submitting){
            return;
        }

        this.showCourseModal=false;
        this.resetForm();
        this.errorMessage='';
    }

    submit():void{
        this.errorMessage='';
        this.successMessage='';

        if(this.courseForm.invalid){
            this.courseForm.markAllAsTouched();
            return;
        }

        const value=this.courseForm.getRawValue();

        const course:TrainingCourseEntity={
            courseId:Number(value.courseId)||0,
            courseName:String(value.courseName).trim(),
            feesAmount:value.feesAmount===null||value.feesAmount===''?null:Number(value.feesAmount),
            feesChangeDate:value.feesChangeDate?new Date(value.feesChangeDate).toISOString():null,
            installmentPercentage:value.installmentPercentage===null||value.installmentPercentage===''?null:Number(value.installmentPercentage)
        };

        this.submitting=true;

        console.log(
            this.editingId!==null?'Training Course Update Request:':'Training Course Create Request:',
            course
        );

        if(this.editingId!==null){
            this.trainingCourseApplication.update(this.editingId,course).subscribe({
                next:(response)=>{
                    console.log('Training Course update response:',response);

                    this.successMessage='Course updated successfully.';
                    this.showCourseModal=false;
                    this.resetForm();
                    this.loadCourses();
                    this.submitting=false;
                },
                error:(error)=>{
                    console.error('Training Course update error:',error);
                    this.errorMessage=error?.error?.message||'Course update failed.';
                    this.submitting=false;
                }
            });

            return;
        }

        this.trainingCourseApplication.create(course).subscribe({
            next:(response)=>{
                console.log('Training Course create response:',response);

                const createdId=Number(response?.courseId);

                if(!createdId){
                    console.error('Created course ID not received:',response);
                    this.errorMessage='Course created but generated ID was not received.';
                    this.submitting=false;
                    return;
                }

                console.log('Generated Training Course ID:',createdId);

                this.trainingCourseApplication.update(createdId,{
                    ...course,
                    courseId:createdId
                }).subscribe({
                    next:(updateResponse)=>{
                        console.log('Training Course update after create response:',updateResponse);

                        this.successMessage='Course created successfully.';
                        this.showCourseModal=false;
                        this.resetForm();
                        this.loadCourses();
                        this.submitting=false;
                    },
                    error:(updateError)=>{
                        console.error('Training Course update after create error:',updateError);
                        this.errorMessage='Course was created, but course details could not be saved.';
                        this.submitting=false;
                    }
                });
            },
            error:(error)=>{
                console.error('Training Course create error:',error);
                this.errorMessage=error?.error?.message||'Course creation failed.';
                this.submitting=false;
            }
        });
    }

    editCourse(course:TrainingCourseEntity):void{
        console.log('Edit Training Course:',course);

        this.editingId=course.courseId;

        this.courseForm.patchValue({
            courseId:course.courseId,
            courseName:course.courseName,
            feesAmount:course.feesAmount,
            feesChangeDate:this.formatDate(course.feesChangeDate),
            installmentPercentage:course.installmentPercentage
        });

        this.errorMessage='';
        this.successMessage='';
        this.showCourseModal=true;
    }

    deleteCourse(course:TrainingCourseEntity):void{
        if(!window.confirm(`Delete course "${course.courseName}"?`)){
            return;
        }

        console.log('Delete Training Course:',course.courseId);

        this.trainingCourseApplication.delete(course.courseId).subscribe({
            next:()=>{
                console.log('Training Course deleted successfully');

                this.successMessage='Course deleted successfully.';
                this.loadCourses();
            },
            error:(error)=>{
                console.error('Training Course delete error:',error);

                this.errorMessage=error?.error?.message||'Course deletion failed.';
            }
        });
    }

    restoreCourse(course:TrainingCourseEntity):void{
        if(!window.confirm(`Restore course "${course.courseName}"?`)){
            return;
        }

        console.log('Restore Training Course:',course.courseId);

        this.trainingCourseApplication.restore(course.courseId).subscribe({
            next:()=>{
                console.log('Training Course restored successfully');

                this.successMessage='Course restored successfully.';
                this.loadCourses();
            },
            error:(error)=>{
                console.error('Training Course restore error:',error);

                this.errorMessage=error?.error?.message||'Course restore failed.';
            }
        });
    }

    resetForm():void{
        this.editingId=null;

        this.courseForm.reset({
            courseId:0,
            courseName:'',
            feesAmount:null,
            feesChangeDate:'',
            installmentPercentage:null
        });
    }

    formatDate(value:string|null):string{
        if(!value){
            return '';
        }

        const date=new Date(value);

        if(isNaN(date.getTime())){
            return value;
        }

        return date.toISOString().substring(0,10);
    }

    displayDate(value:string|null):string{
        if(!value){
            return '—';
        }

        const date=new Date(value);

        if(isNaN(date.getTime())){
            return value;
        }

        return date.toLocaleDateString('en-GB');
    }

    isInvalid(controlName:string):boolean{
        const control=this.courseForm.get(controlName);

        return !!control&&control.invalid&&control.touched;
    }
}