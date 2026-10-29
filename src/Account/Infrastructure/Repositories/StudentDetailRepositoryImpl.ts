import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { StudentDetailApi } from "../Api/StudentDetailApi";
import { StudentDetailsResponse } from "../../Domain/DTOs/StudentDetailsResponse";
import { IStudentDetailRepository } from "src/Account/Domain/Repositories/Token/studentdetailrepositrytoken";

@Injectable({
  providedIn: "root"
})
export class StudentDetailRepositoryImpl
  implements IStudentDetailRepository {

  private readonly api = inject(StudentDetailApi);

  getAllStudentDetails(): Observable<StudentDetailsResponse> {
    return this.api.getAllStudentDetails();
  }
}