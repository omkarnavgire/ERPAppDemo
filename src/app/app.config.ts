
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';


import { IBatchTopicRepository } from '../Group-Leader/Domain/Repositories/IBatchTopicRepository';
import { BatchTopicRepository } from '../Group-Leader/Infrastructure/Api/BatchTopicRepository';
import { ENQUIRY_FOLLOWUP_REPOSITORY } from 'src/UserManagement/Domain/Repositories/Token/enquiryfollowuprepositoriestoken';
import { EnquiryFollowupRepositoriesImpl } from 'src/UserManagement/Infrastructure/Repositories/EnquiryFollowuprepositoriesimpl';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),

        {
            provide: ENQUIRY_FOLLOWUP_REPOSITORY,
            useClass: EnquiryFollowupRepositoriesImpl
        },
        {
            provide: IBatchTopicRepository,
            useClass: BatchTopicRepository
        }
    ]
};
