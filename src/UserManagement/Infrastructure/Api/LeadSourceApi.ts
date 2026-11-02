import { API_ENDPOINTS } from "../../../Core/config/api-endpoints";
import {HttpClient} from '@angular/common/http';
import {inject,Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {LeadSource} from '../../Domain/Entities/LeadSource';

@Injectable({
    providedIn:'root'
})
export class LeadSourceApi{
    private http=inject(HttpClient);

    getAll():Observable<LeadSource[]>{
        return this.http.get<LeadSource[]>(`${API_ENDPOINTS.lead}/LeadSource`);
    }
}