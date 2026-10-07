import {InjectionToken} from '@angular/core';
import {LeadFollowupRepository} from '../LeadFollowuprepositories';

export const LEAD_FOLLOWUP_REPOSITORY=new InjectionToken<LeadFollowupRepository>(
    'LEAD_FOLLOWUP_REPOSITORY'
);