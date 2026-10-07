import {Injectable,inject} from '@angular/core';
import {Observable} from 'rxjs';
import {LeadSource} from '../../Domain/Entities/LeadSource';
import {LeadSourcerepositories} from '../../Domain/Repositories/LeadSourcerepositories';
import {LeadSourceApi} from '../Api/LeadSourceApi';

@Injectable({
    providedIn:'root'
})
export class LeadSourcerepositoriesimpl implements LeadSourcerepositories{
    private api=inject(LeadSourceApi);

    getAll():Observable<LeadSource[]>{
        return this.api.getAll();
    }
}