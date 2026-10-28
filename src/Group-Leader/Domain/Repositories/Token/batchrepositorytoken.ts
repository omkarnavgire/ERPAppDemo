import { InjectionToken } from '@angular/core';
import { BatchRepository } from '../BatchRepository';

export const BATCH_REPOSITORY = new InjectionToken<BatchRepository>('BATCH_REPOSITORY');
