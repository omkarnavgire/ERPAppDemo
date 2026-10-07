import {Injectable,inject} from '@angular/core';
import {Observable} from 'rxjs';
import {Qualification} from '../../Domain/Entities/Qualification';
import {Qualificationrepositories} from '../../Domain/Repositories/Qualificationrepositories';
import {QUALIFICATION_REPOSITORY} from '../../Domain/Repositories/Token/qualificationrepositorytoken';

@Injectable({
    providedIn:'root'
})
export class QualificationApplication{
    private repository=inject<Qualificationrepositories>(QUALIFICATION_REPOSITORY);

    getAll():Observable<Qualification[]>{
        return this.repository.getAll();
    }
}