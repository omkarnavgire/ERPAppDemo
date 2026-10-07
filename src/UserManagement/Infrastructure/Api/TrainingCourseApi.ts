import {Injectable,inject} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable,ReplaySubject,catchError,of,tap} from "rxjs";
import {TrainingCourse} from "../../Domain/Entities/TrainingCourse";

@Injectable({
    providedIn:"root"
})
export class TrainingCourseApi{

    private http=inject(HttpClient);

    private readonly apiUrl="/lead-api/TrainingCourse";
    private readonly cacheKey="training-courses-cache";

    private coursesSubject=
        new ReplaySubject<TrainingCourse[]>(1);

    private requestStarted=false;

    getTrainingCourses():Observable<TrainingCourse[]>{

        if(!this.requestStarted){

            this.requestStarted=true;

            const cachedCourses=this.getLocalCache();

            if(cachedCourses){

                console.log(
                    "Training Course: Showing cached data:",
                    cachedCourses.length
                );

                this.coursesSubject.next(cachedCourses);
            }

            console.log(
                "Training Course API: GET all"
            );

            this.http
                .get<TrainingCourse[]>(this.apiUrl)
                .pipe(
                    tap((courses)=>{

                        console.log(
                            "Training Course API: Fresh data:",
                            courses.length
                        );

                        this.saveLocalCache(courses);

                        this.coursesSubject.next(courses);
                    }),
                    catchError((error)=>{

                        console.error(
                            "Training Course API error:",
                            error
                        );

                        return of(null);
                    })
                )
                .subscribe();
        }

        return this.coursesSubject.asObservable();
    }

    getTrainingCourseById(
        id:number
    ):Observable<TrainingCourse>{

        console.log(
            "Training Course API: GET by ID:",
            id
        );

        return this.http.get<TrainingCourse>(
            `${this.apiUrl}/${id}`
        );
    }

    createTrainingCourse(
        trainingCourse:TrainingCourse
    ):Observable<TrainingCourse>{

        console.log(
            "Training Course API: CREATE:",
            trainingCourse
        );

        return this.http
            .post<TrainingCourse>(
                `${this.apiUrl}/Create`,
                trainingCourse
            )
            .pipe(
                tap(()=>{
                    this.clearCoursesCache();
                })
            );
    }

    updateTrainingCourse(
        id:number,
        trainingCourse:TrainingCourse
    ):Observable<TrainingCourse>{

        console.log(
            "Training Course API: UPDATE:",
            id,
            trainingCourse
        );

        return this.http
            .put<TrainingCourse>(
                `${this.apiUrl}/Update/${id}`,
                trainingCourse
            )
            .pipe(
                tap(()=>{
                    this.clearCoursesCache();
                })
            );
    }

    deleteTrainingCourse(
        id:number
    ):Observable<void>{

        console.log(
            "Training Course API: DELETE:",
            id
        );

        return this.http
            .delete<void>(
                `${this.apiUrl}/Delete/${id}`
            )
            .pipe(
                tap(()=>{
                    this.clearCoursesCache();
                })
            );
    }

    restoreTrainingCourse(
        id:number
    ):Observable<void>{

        console.log(
            "Training Course API: RESTORE:",
            id
        );

        return this.http
            .put<void>(
                `${this.apiUrl}/restore/${id}`,
                {}
            )
            .pipe(
                tap(()=>{
                    this.clearCoursesCache();
                })
            );
    }

    clearCoursesCache():void{

        this.requestStarted=false;

        localStorage.removeItem(
            this.cacheKey
        );

        console.log(
            "Training Course cache cleared"
        );
    }

    private saveLocalCache(
        courses:TrainingCourse[]
    ):void{

        try{

            localStorage.setItem(
                this.cacheKey,
                JSON.stringify(courses)
            );

        }catch(error){

            console.warn(
                "Unable to save Training Course cache:",
                error
            );
        }
    }

    private getLocalCache():
        TrainingCourse[]|null{

        try{

            const cached=
                localStorage.getItem(
                    this.cacheKey
                );

            if(!cached){
                return null;
            }

            const courses=
                JSON.parse(cached);

            if(Array.isArray(courses)){
                return courses;
            }

            return null;

        }catch(error){

            console.warn(
                "Unable to read Training Course cache:",
                error
            );

            return null;
        }
    }
}