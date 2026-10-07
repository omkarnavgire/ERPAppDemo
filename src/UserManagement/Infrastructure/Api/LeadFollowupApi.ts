import {HttpClient} from '@angular/common/http';
import {inject,Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {LeadFollowup} from '../../Domain/Entities/LeadFollowup';

@Injectable({
    providedIn:'root'
})
export class LeadFollowupApi{
    private http=inject(HttpClient);
    private readonly baseUrl='/lead-api/LeadFollowup';

    getFollowups():Observable<LeadFollowup[]>{
        console.log('Lead Followup API: Get all');
        return this.http.get<LeadFollowup[]>(this.baseUrl);
    }

    getFollowupsByLeadId(leadId:number):Observable<LeadFollowup[]>{
        console.log('Lead Followup API: Get by Lead ID:',leadId);
        return this.http.get<LeadFollowup[]>(`${this.baseUrl}/lead/${leadId}`);
    }

    getFollowupById(id:number):Observable<LeadFollowup>{
        console.log('Lead Followup API: Get by ID:',id);
        return this.http.get<LeadFollowup>(`${this.baseUrl}/GetById/${id}`);
    }

    createFollowup(followup:LeadFollowup):Observable<LeadFollowup>{
        console.log('Lead Followup API: Create:',followup);
        return this.http.post<LeadFollowup>(`${this.baseUrl}/Create`,followup);
    }

    updateFollowup(id:number,followup:LeadFollowup):Observable<LeadFollowup>{
        console.log('Lead Followup API: Update:',id,followup);
        return this.http.put<LeadFollowup>(`${this.baseUrl}/Update`,followup);
    }

    deleteFollowup(id:number):Observable<void>{
        console.log('Lead Followup API: Delete:',id);
        return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
    }

    restoreFollowup(id:number):Observable<void>{
        console.log('Lead Followup API: Restore:',id);
        return this.http.put<void>(`${this.baseUrl}/restore/${id}`,{});
    }
}