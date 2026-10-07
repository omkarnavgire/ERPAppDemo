export interface Lead{
    leadId:number;
    candidateName:string;
    emailAddress:string;
    mobileNumber:string;
    trainingType:string;
    description:string;
    status:string;
    leadDate:Date;
    sourceId:number;
    sourceName:string;
    createdAt?:Date;
    updatedAt?:Date;
    deletedAt?:Date|null;
    restoredAt?:Date|null;
}