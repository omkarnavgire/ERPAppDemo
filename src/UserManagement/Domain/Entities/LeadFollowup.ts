export interface LeadFollowup{
    leadFollowupId:number;
    leadId:number;
    candidateName:string;
    followUpDate:Date;
    followUpBy:string;
    description:string;
    status:string;
    nextFollowupDate:Date;
    createdAt?:Date;
    updatedAt?:Date;
    deletedAt?:Date|null;
    restoredAt?:Date|null;
}