import {Injectable,inject} from '@angular/core';
import {Observable} from 'rxjs';
import {EnquiryFollowupRepositories} from '../../Domain/Repositories/Enquiryfollowuprepositories';
import {EnquiryFollowupApi} from '../Api/EnquiryFollowupApi';
import {EnquiryFollowup} from '../../Domain/Entities/Eneuiryfollowup';

@Injectable({
    providedIn:'root'
})
export class EnquiryFollowupRepositoriesImpl implements EnquiryFollowupRepositories {
    private api=inject(EnquiryFollowupApi);

    getFollowups():Observable<EnquiryFollowup[]> {
        console.log('Enquiry Followup Repository: Get all');
        return this.api.getFollowups();
    }

    getFollowupsByEnquiryId(enquiryId:number):Observable<EnquiryFollowup[]> {
        console.log('Enquiry Followup Repository: Get by Enquiry ID:',enquiryId);
        return this.api.getFollowupsByEnquiryId(enquiryId);
    }

    getFollowupById(id:number):Observable<EnquiryFollowup> {
        console.log('Enquiry Followup Repository: Get by ID:',id);
        return this.api.getFollowupById(id);
    }

    createFollowup(followup:EnquiryFollowup):Observable<EnquiryFollowup> {
        console.log('Enquiry Followup Repository: Create:',followup);
        return this.api.createFollowup(followup);
    }

    updateFollowup(id:number,followup:EnquiryFollowup):Observable<EnquiryFollowup> {
        console.log('Enquiry Followup Repository: Update:',id,followup);
        return this.api.updateFollowup(id,followup);
    }

    deleteFollowup(id:number):Observable<void> {
        console.log('Enquiry Followup Repository: Delete:',id);
        return this.api.deleteFollowup(id);
    }

    restoreFollowup(id:number):Observable<void> {
        console.log('Enquiry Followup Repository: Restore:',id);
        return this.api.restoreFollowup(id);
    }
}