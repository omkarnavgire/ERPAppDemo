
import { Injectable, inject } from "@angular/core";
import { IBatchTopicRepository } from "../Domain/Repositories/IBatchTopicRepository";
import { BatchTopic } from "../Domain/Entities/BatchTopic";


@Injectable({
    providedIn: "root"
})
export class GetBatchTopics {
    private repository = inject(IBatchTopicRepository);

    execute(): Promise<BatchTopic[]> {
        return this.repository.getAllTopics();
    }
}
