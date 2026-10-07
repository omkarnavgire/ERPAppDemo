import {Observable} from "rxjs";
import {TrainingCourse} from "../Entities/TrainingCourse";

export interface TrainingCourseRepository{
    getTrainingCourses():Observable<TrainingCourse[]>;
    getTrainingCourseById(id:number):Observable<TrainingCourse>;
    createTrainingCourse(trainingCourse:TrainingCourse):Observable<TrainingCourse>;
    updateTrainingCourse(id:number,trainingCourse:TrainingCourse):Observable<TrainingCourse>;
    deleteTrainingCourse(id:number):Observable<void>;
    restoreTrainingCourse(id:number):Observable<void>;
}