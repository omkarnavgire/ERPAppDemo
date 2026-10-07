import {ApplicationConfig,provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';
import { ENQUIRY_FOLLOWUP_REPOSITORY } from '../UserManagement/Domain/Repositories/Token/enquiryfollowuprepositoriestoken';
import { EnquiryFollowupRepositoriesImpl } from '../UserManagement/Infrastructure/Repositories/EnquiryFollowuprepositoriesimpl';


export const appConfig:ApplicationConfig={
    providers:[
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        {
            provide:ENQUIRY_FOLLOWUP_REPOSITORY,
            useClass:EnquiryFollowupRepositoriesImpl
        }
    ]
};