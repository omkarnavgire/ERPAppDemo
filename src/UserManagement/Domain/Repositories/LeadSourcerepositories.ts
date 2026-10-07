import {Observable} from 'rxjs';
import {LeadSource} from '../Entities/LeadSource';

export interface LeadSourcerepositories {
    getAll():Observable<LeadSource[]>;
}