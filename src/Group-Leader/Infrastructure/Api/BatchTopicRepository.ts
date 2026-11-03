
import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

import { API_ENDPOINTS } from "../../../Core/config/api-endpoints";
import { BatchTopic } from "../../Domain/Entities/BatchTopic";
import { IBatchTopicRepository } from "../../Domain/Repositories/IBatchTopicRepository";

interface BatchTopicApiResponse {
    statusCode: number;
    message: string;
    data: BatchTopic[];
}

@Injectable({
    providedIn: "root"
})
export class BatchTopicRepository extends IBatchTopicRepository {
    private http = inject(HttpClient);

    private readonly url = `${API_ENDPOINTS.batchManagement}/Batch`;

    override async getAllTopics(): Promise<BatchTopic[]> {
        const response = await firstValueFrom(
            this.http.get<BatchTopicApiResponse>(`${this.url}/topics`)
        );

        if (response.statusCode !== 200 || !Array.isArray(response.data)) {
            return [];
        }

        return response.data.filter(
            topic =>
                Number.isFinite(topic.topicId) &&
                typeof topic.topicName === "string"
        );
    }
}
