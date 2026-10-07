import {HttpClient} from '@angular/common/http';
import {inject,Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Qualification} from '../../Domain/Entities/Qualification';

@Injectable({
    providedIn:'root'
})
export class QualificationApi{
    private http=inject(HttpClient);

    getAll():Observable<Qualification[]>{
        return this.http.get<Qualification[]>('/lead-api/Qualification');
    }
}