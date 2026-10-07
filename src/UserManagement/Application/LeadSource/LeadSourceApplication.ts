import {Injectable,inject} from '@angular/core';
import {Observable} from 'rxjs';
import {LeadSource} from '../../Domain/Entities/LeadSource';
import {LeadSourcerepositories} from '../../Domain/Repositories/LeadSourcerepositories';
import {LEAD_SOURCE_REPOSITORY} from '../../Domain/Repositories/Token/leadsourcerepositorytoken';

@Injectable({
    providedIn:'root'
})
export class LeadSourceApplication{
    private repository=inject<LeadSourcerepositories>(LEAD_SOURCE_REPOSITORY);

    getAll():Observable<LeadSource[]>{
        return this.repository.getAll();
    }
}