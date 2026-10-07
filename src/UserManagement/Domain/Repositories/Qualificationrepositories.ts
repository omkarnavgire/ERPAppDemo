import {Observable} from 'rxjs';
import {Qualification} from '../Entities/Qualification';

export interface Qualificationrepositories {
    getAll():Observable<Qualification[]>;
}