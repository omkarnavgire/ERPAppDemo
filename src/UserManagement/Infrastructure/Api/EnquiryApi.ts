import {HttpClient} from "@angular/common/http";
import {Injectable,inject} from "@angular/core";
import {Observable} from "rxjs";
import {Enquiry} from "../../Domain/Entities/Enquiry";
import {EnquiryRepository} from "../../Domain/Repositories/Enquiryrepositories";

@Injectable({
    providedIn:"root"
})
export class EnquiryApi implements EnquiryRepository {
    private http=inject(HttpClient);
    private readonly baseUrl="/lead-api/Enquiry";

    getEnquiries():Observable<Enquiry[]> {
        console.log("Enquiry API: Get all enquiries");
        return this.http.get<Enquiry[]>(`${this.baseUrl}/GetAll`);
    }

    getEnquiryById(id:number):Observable<Enquiry> {
        console.log("Enquiry API: Get enquiry by ID:",id);
        return this.http.get<Enquiry>(`${this.baseUrl}/GetById/${id}`);
    }

    createEnquiry(enquiry:Enquiry):Observable<Enquiry> {
        console.log("Enquiry API: Create enquiry:",enquiry);
        return this.http.post<Enquiry>(`${this.baseUrl}/Create`,enquiry);
    }

    updateEnquiry(id:number,enquiry:Enquiry):Observable<Enquiry> {
        console.log("Enquiry API: Update enquiry:",id,enquiry);
        return this.http.put<Enquiry>(`${this.baseUrl}/Update`,enquiry);
    }

    deleteEnquiry(id:number):Observable<void> {
        console.log("Enquiry API: Delete enquiry:",id);
        return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
    }

    restoreEnquiry(id:number):Observable<void> {
        console.log("Enquiry API: Restore enquiry:",id);
        return this.http.put<void>(`${this.baseUrl}/Restore/${id}`,{});
    }
}