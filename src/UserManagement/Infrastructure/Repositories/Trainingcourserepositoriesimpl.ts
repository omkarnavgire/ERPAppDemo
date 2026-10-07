import {Injectable,inject} from "@angular/core";
import {Observable} from "rxjs";
import {TrainingCourseRepository} from "../../Domain/Repositories/Traingingcourserepositories";
import {TrainingCourseApi} from "../Api/TrainingCourseApi";
import {TrainingCourse} from "../../Domain/Entities/TrainingCourse";

@Injectable({
    providedIn:"root"
})
export class TrainingCourseRepositoryImpl implements TrainingCourseRepository{
    private api=inject(TrainingCourseApi);

    getTrainingCourses():Observable<TrainingCourse[]>{
        console.log("Training Course Repository: Get all");
        return this.api.getTrainingCourses();
    }

    getTrainingCourseById(id:number):Observable<TrainingCourse>{
        console.log("Training Course Repository: Get by ID:",id);
        return this.api.getTrainingCourseById(id);
    }

    createTrainingCourse(trainingCourse:TrainingCourse):Observable<TrainingCourse>{
        console.log("Training Course Repository: Create:",trainingCourse);
        return this.api.createTrainingCourse(trainingCourse);
    }

    updateTrainingCourse(id:number,trainingCourse:TrainingCourse):Observable<TrainingCourse>{
        console.log("Training Course Repository: Update:",id,trainingCourse);
        return this.api.updateTrainingCourse(id,trainingCourse);
    }

    deleteTrainingCourse(id:number):Observable<void>{
        console.log("Training Course Repository: Delete:",id);
        return this.api.deleteTrainingCourse(id);
    }

    restoreTrainingCourse(id:number):Observable<void>{
        console.log("Training Course Repository: Restore:",id);
        return this.api.restoreTrainingCourse(id);
    }
}