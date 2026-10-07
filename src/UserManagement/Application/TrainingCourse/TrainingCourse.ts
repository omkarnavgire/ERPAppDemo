import {Injectable,inject} from "@angular/core";
import {Observable} from "rxjs";
import {TrainingCourse as TrainingCourseEntity} from "../../Domain/Entities/TrainingCourse";
import {TRAINING_COURSE_REPOSITORY} from "../../Domain/Repositories/Token/trainingcourserepositorytoken";

@Injectable({
    providedIn:"root"
})
export class TrainingCourse{
    private repository=inject(TRAINING_COURSE_REPOSITORY);

    getAll():Observable<TrainingCourseEntity[]>{
        console.log("Training Course Application: Get all");
        return this.repository.getTrainingCourses();
    }

    getById(id:number):Observable<TrainingCourseEntity>{
        console.log("Training Course Application: Get by ID:",id);
        return this.repository.getTrainingCourseById(id);
    }

    create(course:TrainingCourseEntity):Observable<TrainingCourseEntity>{
        console.log("Training Course Application: Create:",course);
        return this.repository.createTrainingCourse(course);
    }

    update(id:number,course:TrainingCourseEntity):Observable<TrainingCourseEntity>{
        console.log("Training Course Application: Update:",id,course);
        return this.repository.updateTrainingCourse(id,course);
    }

    delete(id:number):Observable<void>{
        console.log("Training Course Application: Delete:",id);
        return this.repository.deleteTrainingCourse(id);
    }

    restore(id:number):Observable<void>{
        console.log("Training Course Application: Restore:",id);
        return this.repository.restoreTrainingCourse(id);
    }
}