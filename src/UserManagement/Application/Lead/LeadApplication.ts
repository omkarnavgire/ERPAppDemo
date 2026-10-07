import {Injectable,inject} from '@angular/core';
import {Observable} from 'rxjs';
import {LEAD_REPOSITORY} from '../../Domain/Repositories/Token/leadrepositoriestoken';
import {Lead} from '../../Domain/Entities/Lead';

@Injectable({
    providedIn:'root'
})
export class LeadApplication{
    private repository=inject(LEAD_REPOSITORY);

    getAll():Observable<Lead[]>{
        console.log('Lead getAll use case executed');
        return this.repository.getLeads();
    }

    getById(id:number):Observable<Lead>{
        console.log('Lead getById:',id);
        return this.repository.getLeadById(id);
    }

    getBySource(sourceId:number):Observable<Lead[]>{
        console.log('Lead getBySource:',sourceId);
        return this.repository.getLeadsBySource(sourceId);
    }

    create(lead:Lead):Observable<Lead>{
        console.log('Create Lead:',lead);
        return this.repository.createLead(lead);
    }

    update(id:number,lead:Lead):Observable<Lead>{
        console.log('Update Lead:',id,lead);
        return this.repository.updateLead(id,lead);
    }

    delete(id:number):Observable<void>{
        console.log('Delete Lead:',id);
        return this.repository.deleteLead(id);
    }

    restore(id:number):Observable<void>{
        console.log('Restore Lead:',id);
        return this.repository.restoreLead(id);
    }
}