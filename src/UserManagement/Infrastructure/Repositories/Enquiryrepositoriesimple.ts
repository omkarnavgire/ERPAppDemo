import {Injectable,inject} from "@angular/core";
import {Observable} from "rxjs";
import {Enquiry} from "../../Domain/Entities/Enquiry";
import {EnquiryRepository} from "../../Domain/Repositories/Enquiryrepositories";
import {EnquiryApi} from "../Api/EnquiryApi";

@Injectable({
    providedIn:"root"
})
export class EnquiryRepositoryImpl extends EnquiryRepository {
    private api=inject(EnquiryApi);

    override getEnquiries():Observable<Enquiry[]> {
        console.log("Enquiry Repository: Get all");
        return this.api.getEnquiries();
    }

    override getEnquiryById(id:number):Observable<Enquiry> {
        console.log("Enquiry Repository: Get by ID:",id);
        return this.api.getEnquiryById(id);
    }

    override createEnquiry(enquiry:Enquiry):Observable<Enquiry> {
        console.log("Enquiry Repository: Create:",enquiry);
        return this.api.createEnquiry(enquiry);
    }

    override updateEnquiry(id:number,enquiry:Enquiry):Observable<Enquiry> {
        console.log("Enquiry Repository: Update:",id,enquiry);
        return this.api.updateEnquiry(id,enquiry);
    }

    override deleteEnquiry(id:number):Observable<void> {
        console.log("Enquiry Repository: Delete:",id);
        return this.api.deleteEnquiry(id);
    }

    override restoreEnquiry(id:number):Observable<void> {
        console.log("Enquiry Repository: Restore:",id);
        return this.api.restoreEnquiry(id);
    }
}