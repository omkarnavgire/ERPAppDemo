import {Injectable,inject} from '@angular/core';
import {Observable} from 'rxjs';
import { LeadRepository } from '../../Domain/Repositories/Leadrepository';
import {LeadApi} from '../Api/LeadApi';
import {Lead} from '../../Domain/Entities/Lead';


@Injectable({
    providedIn:'root'
})
export class LeadRepositoriesImpl implements LeadRepository{
    private api=inject(LeadApi);

    getLeads():Observable<Lead[]>{
        console.log('Lead Repository: Get all');
        return this.api.getLeads();
    }

    getLeadById(id:number):Observable<Lead>{
        console.log('Lead Repository: Get by ID:',id);
        return this.api.getLeadById(id);
    }

    getLeadsBySource(sourceId:number):Observable<Lead[]>{
        console.log('Lead Repository: Get by Source ID:',sourceId);
        return this.api.getLeadsBySource(sourceId);
    }

    createLead(lead:Lead):Observable<Lead>{
        console.log('Lead Repository: Create:',lead);
        return this.api.createLead(lead);
    }

    updateLead(id:number,lead:Lead):Observable<Lead>{
        console.log('Lead Repository: Update:',id,lead);
        return this.api.updateLead(id,lead);
    }

    deleteLead(id:number):Observable<void>{
        console.log('Lead Repository: Delete:',id);
        return this.api.deleteLead(id);
    }

    restoreLead(id:number):Observable<void>{
        console.log('Lead Repository: Restore:',id);
        return this.api.restoreLead(id);
    }
}