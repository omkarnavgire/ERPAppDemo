import {Injectable,inject} from '@angular/core';
import {Observable} from 'rxjs';
import {LeadFollowupRepository} from '../../Domain/Repositories/LeadFollowuprepositories';
import {LeadFollowupApi} from '../Api/LeadFollowupApi';
import {LeadFollowup} from '../../Domain/Entities/LeadFollowup';

@Injectable({
    providedIn:'root'
})
export class LeadFollowupRepositoriesImpl implements LeadFollowupRepository{
    private api=inject(LeadFollowupApi);

    getFollowups():Observable<LeadFollowup[]>{
        console.log('Lead Followup Repository: Get all');
        return this.api.getFollowups();
    }

    getFollowupsByLeadId(leadId:number):Observable<LeadFollowup[]>{
        console.log('Lead Followup Repository: Get by Lead ID:',leadId);
        return this.api.getFollowupsByLeadId(leadId);
    }

    getFollowupById(id:number):Observable<LeadFollowup>{
        console.log('Lead Followup Repository: Get by ID:',id);
        return this.api.getFollowupById(id);
    }

    createFollowup(followup:LeadFollowup):Observable<LeadFollowup>{
        console.log('Lead Followup Repository: Create:',followup);
        return this.api.createFollowup(followup);
    }

    updateFollowup(id:number,followup:LeadFollowup):Observable<LeadFollowup>{
        console.log('Lead Followup Repository: Update:',id,followup);
        return this.api.updateFollowup(id,followup);
    }

    deleteFollowup(id:number):Observable<void>{
        console.log('Lead Followup Repository: Delete:',id);
        return this.api.deleteFollowup(id);
    }

    restoreFollowup(id:number):Observable<void>{
        console.log('Lead Followup Repository: Restore:',id);
        return this.api.restoreFollowup(id);
    }
}