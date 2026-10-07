import { Injectable,inject } from "@angular/core";
import { Observable } from "rxjs";
import { Enquiry } from "../../Domain/Entities/Enquiry";
import { EnquiryRepository } from "../../Domain/Repositories/Enquiryrepositories";

@Injectable({
    providedIn:"root"
})
export class EnquiryApplication {
    private repository=inject(EnquiryRepository);

    getAll():Observable<Enquiry[]> {
        console.log("Enquiry getAll use case executed");
        return this.repository.getEnquiries();
    }

    getById(id:number):Observable<Enquiry> {
        console.log("Enquiry getById:",id);
        return this.repository.getEnquiryById(id);
    }

    create(enquiry:Enquiry):Observable<Enquiry> {
        console.log("Create enquiry request:",enquiry);
        return this.repository.createEnquiry(enquiry);
    }

    update(id:number,enquiry:Enquiry):Observable<Enquiry> {
        console.log("Update enquiry request:",id,enquiry);
        return this.repository.updateEnquiry(id,enquiry);
    }

    delete(id:number):Observable<void> {
        console.log("Delete enquiry:",id);
        return this.repository.deleteEnquiry(id);
    }

    restore(id:number):Observable<void> {
        console.log("Restore enquiry:",id);
        return this.repository.restoreEnquiry(id);
    }
}