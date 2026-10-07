export interface EnquiryFollowup{
    candidateName:string;
    followupId:number;
    enquiryId:number;
    sourceId:number;
    sourceName:string;
    followUpDate:Date|string;
    followUpBy:string;
    description:string;
    status:string;
    nextFollowupDate:Date|string;
    createdAt?:Date;
    updatedAt?:Date;
    deletedAt?:Date|null;
    restoredAt?:Date|null;
}