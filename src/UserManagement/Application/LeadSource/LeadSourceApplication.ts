
import { Injectable, inject } from '@angular/core';
import {Observable,concat,of,EMPTY,throwError,catchError,tap,shareReplay} from 'rxjs';

import { LeadSource } from '../../Domain/Entities/LeadSource';
import { LeadSourcerepositories } from '../../Domain/Repositories/LeadSourcerepositories';
import { LEAD_SOURCE_REPOSITORY } from '../../Domain/Repositories/Token/leadsourcerepositorytoken';

@Injectable({
  providedIn: 'root'
})
export class LeadSourceApplication {
  private repository =
    inject<LeadSourcerepositories>(LEAD_SOURCE_REPOSITORY);

  private readonly cacheKey = 'enquiry-lead-sources-cache';
  private leadSources$?: Observable<LeadSource[]>;

  getAll(): Observable<LeadSource[]> {
    if (!this.leadSources$) {
      let cached: LeadSource[] | null = null;

      try {
        const stored = localStorage.getItem(this.cacheKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            cached = parsed;
          }
        }
      } catch (error) {
        console.warn('Unable to read LeadSource cache:', error);
      }

      const freshData$ = this.repository.getAll().pipe(
        tap((data) => {
          try {
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
          } catch (error) {
            console.warn('Unable to save LeadSource cache:', error);
          }
        }),
        catchError((error) => {
          console.error('LeadSource API error:', error);
          return cached ? EMPTY : throwError(() => error);
        })
      );

      this.leadSources$ = (
        cached ? concat(of(cached), freshData$) : freshData$
      ).pipe(
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.leadSources$;
  }
}
