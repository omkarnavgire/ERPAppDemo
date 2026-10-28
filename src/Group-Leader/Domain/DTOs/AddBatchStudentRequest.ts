/** Payload for assigning one registration to a batch. Confirm field names against the BatchStudent API schema. */
export interface AddBatchStudentRequest {
  batch_id: number;
  registration_id: number;
}
