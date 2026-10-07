import {Injectable,inject} from '@angular/core';
import {Observable} from 'rxjs';
import {LEAD_FOLLOWUP_REPOSITORY} from '../../Domain/Repositories/Token/leadfollowuprepositoriestoken';
import {LeadFollowup} from '../../Domain/Entities/LeadFollowup';

@Injectable({
    providedIn:'root'
})
export class LeadFollowupApplication{
    private repository=inject(LEAD_FOLLOWUP_REPOSITORY);

    getAll():Observable<LeadFollowup[]>{
        console.log('Lead Followup getAll use case executed');
        return this.repository.getFollowups();
    }

    getByLeadId(leadId:number):Observable<LeadFollowup[]>{
        console.log('Lead Followup getByLeadId:',leadId);
        return this.repository.getFollowupsByLeadId(leadId);
    }

    getById(id:number):Observable<LeadFollowup>{
        console.log('Lead Followup getById:',id);
        return this.repository.getFollowupById(id);
    }

    create(followup:LeadFollowup):Observable<LeadFollowup>{
        console.log('Create Lead Followup:',followup);
        return this.repository.createFollowup(followup);
    }

    update(id:number,followup:LeadFollowup):Observable<LeadFollowup>{
        console.log('Update Lead Followup:',id,followup);
        return this.repository.updateFollowup(id,followup);
    }

    delete(id:number):Observable<void>{
        console.log('Delete Lead Followup:',id);
        return this.repository.deleteFollowup(id);
    }

    restore(id:number):Observable<void>{
        console.log('Restore Lead Followup:',id);
        return this.repository.restoreFollowup(id);
    }
}