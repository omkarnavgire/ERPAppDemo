import {InjectionToken} from '@angular/core';
import {EnquiryFollowupRepositories} from '../Enquiryfollowuprepositories';

export const ENQUIRY_FOLLOWUP_REPOSITORY=
    new InjectionToken<EnquiryFollowupRepositories>(
        'ENQUIRY_FOLLOWUP_REPOSITORY'
    );