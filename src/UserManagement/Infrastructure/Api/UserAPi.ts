import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable,map,shareReplay,startWith,tap} from "rxjs";
import {User} from "../../Domain/Entities/User";

@Injectable({providedIn:"root"})
export class UserApi{
    private baseUrl="https://superuser.ciitstudent.com/api/User";
    private readonly cacheKey="erp-users-cache";
    private usersCache$:Observable<User[]>|null=null;

    constructor(private http:HttpClient){}

    getAllUsers():Observable<User[]>{
        if(!this.usersCache$){
            const cached=this.readCache();
            const request$=this.http.get<any>(
                `${this.baseUrl}/get-all-users`
            ).pipe(
                map(response=>response?.data??[]),
                tap(users=>this.saveCache(users))
            );

            this.usersCache$=cached
                ?request$.pipe(
                    startWith(cached),
                    shareReplay({bufferSize:1,refCount:false})
                )
                :request$.pipe(
                    shareReplay({bufferSize:1,refCount:false})
                );

            console.log(cached?.length?"User API cache used; refreshing in background":"Get all users API called");
        }
        return this.usersCache$;
    }

    clearUsersCache():void{
        this.usersCache$=null;
        localStorage.removeItem(this.cacheKey);
    }

    private readCache():User[]|null{
        try{
            const raw=localStorage.getItem(this.cacheKey);
            if(!raw)return null;
            const users=JSON.parse(raw);
            return Array.isArray(users)&&users.length?users:null;
        }catch{
            return null;
        }
    }

    private saveCache(users:User[]):void{
        try{
            localStorage.setItem(this.cacheKey,JSON.stringify(users));
        }catch(error){
            console.warn("Could not cache users:",error);
        }
    }
}
