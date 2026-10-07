import {InjectionToken} from '@angular/core';
import { LeadRepository } from '../Leadrepository';

export const LEAD_REPOSITORY=new InjectionToken<LeadRepository>(
    'LEAD_REPOSITORY'
);