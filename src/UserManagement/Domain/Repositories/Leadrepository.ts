import {Lead} from '../Entities/Lead';
import {Observable} from 'rxjs';

export interface LeadRepository{
    getLeads():Observable<Lead[]>;
    getLeadById(id:number):Observable<Lead>;
    getLeadsBySource(sourceId:number):Observable<Lead[]>;
    createLead(lead:Lead):Observable<Lead>;
    updateLead(id:number,lead:Lead):Observable<Lead>;
    deleteLead(id:number):Observable<void>;
    restoreLead(id:number):Observable<void>;
}