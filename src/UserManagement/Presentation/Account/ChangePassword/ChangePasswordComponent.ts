import { Component, inject } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { ChangePassword } from "../../../Application/Account/Changepassword";

@Component({
    selector:"app-change-password",
    standalone:true,
    imports:[ReactiveFormsModule,CommonModule],
    templateUrl:"./ChangePassword.html",
    styleUrl:"./ChangePassword.css"
})
export class ChangePasswordClass {
    private fb=inject(FormBuilder);
    private router=inject(Router);
    private changePasswordUsecase=inject(ChangePassword);

    errormessage="";
    successmessage="";
    submitting=false;

    showCurrentPassword=false;
    showNewPassword=false;
    showConfirmPassword=false;

    changeForm=this.fb.nonNullable.group({
        currentPassword:["",Validators.required],
        newPassword:[
            "",
            [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
            ]
        ],
        confirmPassword:["",Validators.required]
    });

    get currentPassword(){
        return this.changeForm.controls.currentPassword;
    }

    get newPassword(){
        return this.changeForm.controls.newPassword;
    }

    get confirmPassword(){
        return this.changeForm.controls.confirmPassword;
    }

    get passwordLengthValid():boolean{
        return this.newPassword.value.length>=8;
    }

    get passwordCapitalValid():boolean{
        return /[A-Z]/.test(this.newPassword.value);
    }

    get passwordSmallValid():boolean{
        return /[a-z]/.test(this.newPassword.value);
    }

    get passwordNumberValid():boolean{
        return /\d/.test(this.newPassword.value);
    }

    get passwordSymbolValid():boolean{
        return /[^A-Za-z0-9]/.test(this.newPassword.value);
    }

    get passwordStrong():boolean{
        return this.passwordLengthValid &&
            this.passwordCapitalValid &&
            this.passwordSmallValid &&
            this.passwordNumberValid &&
            this.passwordSymbolValid;
    }

    get passwordMatch():boolean{
        return this.newPassword.value===this.confirmPassword.value;
    }

    submit():void {
        this.errormessage="";
        this.successmessage="";

        if(this.changeForm.invalid){
            this.changeForm.markAllAsTouched();
            return;
        }

        if(!this.passwordStrong){
            this.errormessage="Password does not meet the required security rules.";
            return;
        }

        if(!this.passwordMatch){
            this.errormessage="New Password and Confirm Password do not match.";
            return;
        }

        if(this.currentPassword.value===this.newPassword.value){
            this.errormessage="New Password must be different from Current Password.";
            return;
        }

        const request={
            currentPassword:this.currentPassword.value,
            newPassword:this.newPassword.value
        };

        console.log("Change password request:",{
            currentPassword:"********",
            newPassword:"********"
        });

        this.submitting=true;

        this.changePasswordUsecase.execute(request).subscribe({
            next:(response)=>{
                console.log("Password changed successfully:",response);
                this.submitting=false;
                this.successmessage="Password changed successfully.";

                this.changeForm.reset();

                setTimeout(()=>{
                    this.router.navigate(["/main/profile"]);
                },1000);
            },
            error:(error)=>{
                console.error("Change password error:",error);
                this.submitting=false;
                this.errormessage=
                    error?.error?.message ||
                    "Password change failed. Please check your current password and try again.";
            }
        });
    }
}