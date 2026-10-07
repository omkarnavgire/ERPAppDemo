import {HttpClient} from '@angular/common/http';
import {inject,Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Lead} from '../../Domain/Entities/Lead';

@Injectable({
    providedIn:'root'
})
export class LeadApi{
    private http=inject(HttpClient);
    private readonly baseUrl='/lead-api/Lead';

    getLeads():Observable<Lead[]>{
        console.log('Lead API: Get all');
        return this.http.get<Lead[]>(this.baseUrl);
    }

    getLeadById(id:number):Observable<Lead>{
        console.log('Lead API: Get by ID:',id);
        return this.http.get<Lead>(`${this.baseUrl}/${id}`);
    }

    getLeadsBySource(sourceId:number):Observable<Lead[]>{
        console.log('Lead API: Get by Source ID:',sourceId);
        return this.http.get<Lead[]>(`${this.baseUrl}/source/${sourceId}`);
    }

    createLead(lead:Lead):Observable<Lead>{
        console.log('Lead API: Create:',lead);
        return this.http.post<Lead>(`${this.baseUrl}/Create`,lead);
    }

    updateLead(id:number,lead:Lead):Observable<Lead>{
        console.log('Lead API: Update:',id,lead);
        return this.http.put<Lead>(`${this.baseUrl}/Update/${id}`,lead);
    }

    deleteLead(id:number):Observable<void>{
        console.log('Lead API: Delete:',id);
        return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
    }

    restoreLead(id:number):Observable<void>{
        console.log('Lead API: Restore:',id);
        return this.http.put<void>(`${this.baseUrl}/restore/${id}`,{});
    }
}