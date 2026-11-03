
import { BatchTopic } from "../Entities/BatchTopic";

export abstract class IBatchTopicRepository {
    abstract getAllTopics(): Promise<BatchTopic[]>;
}
