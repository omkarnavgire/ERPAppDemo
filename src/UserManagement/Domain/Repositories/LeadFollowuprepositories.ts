import {Observable} from 'rxjs';
import {LeadFollowup} from '../Entities/LeadFollowup';

export interface LeadFollowupRepository{
    getFollowups():Observable<LeadFollowup[]>;
    getFollowupsByLeadId(leadId:number):Observable<LeadFollowup[]>;
    getFollowupById(id:number):Observable<LeadFollowup>;
    createFollowup(followup:LeadFollowup):Observable<LeadFollowup>;
    updateFollowup(id:number,followup:LeadFollowup):Observable<LeadFollowup>;
    deleteFollowup(id:number):Observable<void>;
    restoreFollowup(id:number):Observable<void>;
}