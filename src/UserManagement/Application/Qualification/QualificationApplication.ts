
import { Injectable, inject } from '@angular/core';
import {Observable,concat,of,EMPTY,throwError,catchError,tap,shareReplay} from 'rxjs';

import { Qualification } from '../../Domain/Entities/Qualification';
import { Qualificationrepositories } from '../../Domain/Repositories/Qualificationrepositories';
import { QUALIFICATION_REPOSITORY } from '../../Domain/Repositories/Token/qualificationrepositorytoken';

@Injectable({
  providedIn: 'root'
})
export class QualificationApplication {
  private repository =
    inject<Qualificationrepositories>(QUALIFICATION_REPOSITORY);

  private readonly cacheKey = 'enquiry-qualifications-cache';
  private qualifications$?: Observable<Qualification[]>;

  getAll(): Observable<Qualification[]> {
    if (!this.qualifications$) {
      let cached: Qualification[] | null = null;

      try {
        const stored = localStorage.getItem(this.cacheKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            cached = parsed;
          }
        }
      } catch (error) {
        console.warn('Unable to read Qualification cache:', error);
      }

      const freshData$ = this.repository.getAll().pipe(
        tap((data) => {
          try {
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
          } catch (error) {
            console.warn('Unable to save Qualification cache:', error);
          }
        }),
        catchError((error) => {
          console.error('Qualification API error:', error);
          return cached ? EMPTY : throwError(() => error);
        })
      );

      this.qualifications$ = (
        cached ? concat(of(cached), freshData$) : freshData$
      ).pipe(
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.qualifications$;
  }
}
