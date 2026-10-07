import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ENQUIRY_FOLLOWUP_REPOSITORY } from '../../Domain/Repositories/Token/enquiryfollowuprepositoriestoken';
import { EnquiryFollowup } from '../../Domain/Entities/Eneuiryfollowup';

@Injectable({
    providedIn: 'root'
})
export class EnquiryFollowupApplication {
    private repository = inject(ENQUIRY_FOLLOWUP_REPOSITORY);

    getAll(): Observable<EnquiryFollowup[]> {
        console.log('Enquiry Followup getAll use case executed');
        return this.repository.getFollowups();
    }

    getById(id: number): Observable<EnquiryFollowup> {
        console.log('Enquiry Followup getById:', id);
        return this.repository.getFollowupById(id);
    }

    getByEnquiryId(enquiryId: number): Observable<EnquiryFollowup[]> {
        console.log('Enquiry Followup getByEnquiryId:', enquiryId);
        return this.repository.getFollowupsByEnquiryId(enquiryId);
    }

    create(followup: EnquiryFollowup): Observable<EnquiryFollowup> {
        console.log('Create Enquiry Followup:', followup);
        return this.repository.createFollowup(followup);
    }

    update(id: number, followup: EnquiryFollowup): Observable<EnquiryFollowup> {
        console.log('Update Enquiry Followup:', id, followup);
        return this.repository.updateFollowup(id, followup);
    }

    delete(id: number): Observable<void> {
        console.log('Delete Enquiry Followup:', id);
        return this.repository.deleteFollowup(id);
    }

    restore(id: number): Observable<void> {
        console.log('Restore Enquiry Followup:', id);
        return this.repository.restoreFollowup(id);
    }
}