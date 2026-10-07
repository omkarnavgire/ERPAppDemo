import {Injectable,inject} from '@angular/core';
import {Observable} from 'rxjs';
import {Qualification} from '../../Domain/Entities/Qualification';
import {Qualificationrepositories} from '../../Domain/Repositories/Qualificationrepositories';
import {QualificationApi} from '../Api/QualificationApi';

@Injectable({
    providedIn:'root'
})
export class Qualificationrepositoriesimpl implements Qualificationrepositories{
    private api=inject(QualificationApi);

    getAll():Observable<Qualification[]>{
        return this.api.getAll();
    }
}