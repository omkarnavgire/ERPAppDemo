import { Observable } from "rxjs";
import { Enquiry } from "../Entities/Enquiry";

export abstract class EnquiryRepository {
    abstract getEnquiries():Observable<Enquiry[]>;
    abstract getEnquiryById(id:number):Observable<Enquiry>;
    abstract createEnquiry(enquiry:Enquiry):Observable<Enquiry>;
    abstract updateEnquiry(id:number,enquiry:Enquiry):Observable<Enquiry>;
    abstract deleteEnquiry(id:number):Observable<void>;
    abstract restoreEnquiry(id:number):Observable<void>;
}