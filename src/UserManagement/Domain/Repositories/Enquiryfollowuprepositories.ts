import { EnquiryFollowup } from "../Entities/Eneuiryfollowup";
import { Observable } from "rxjs";
export interface EnquiryFollowupRepositories{

  getFollowups(): Observable<EnquiryFollowup[]>;

  createFollowup(followup: EnquiryFollowup): Observable<EnquiryFollowup>;

  getFollowupById(id: number): Observable<EnquiryFollowup>;

  getFollowupsByEnquiryId(enquiryId:number):Observable<EnquiryFollowup[]>;

  updateFollowup(id: number,followup: EnquiryFollowup): Observable<EnquiryFollowup>;

  deleteFollowup(id: number): Observable<void>;

  restoreFollowup(id: number): Observable<void>;
}