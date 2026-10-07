export interface LeadSource {
    sourceId:number;
    sourceName:string;
    flag:number;
    createdAt?:string;
    updatedAt?:string|null;
    deletedAt?:string|null;
    restoredAt?:string|null;
}