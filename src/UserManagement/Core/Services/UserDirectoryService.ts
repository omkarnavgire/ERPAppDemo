import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Employee } from "../../Domain/Entities/Employee";

const STORAGE_KEY = 'ciit_user_directory';

// Backend abhi list/get API nahi deta, isliye Super User + Employee list ko
// browser me (localStorage) maintain kar rahe hain taaki User aur Employee
// dono pages me ek hi data dikh sake. Jaise hi list-users API mil jaye,
// isko Domain/Repositories wale pattern (Api -> Repository -> Usecase) me
// shift kar dena.
@Injectable({
    providedIn: 'root'
})
export class UserDirectoryService {
    private directorySubject = new BehaviorSubject<Employee[]>(this.loadFromStorage());
    directory$ = this.directorySubject.asObservable();

    private loadFromStorage(): Employee[] {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    private saveToStorage(list: Employee[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        this.directorySubject.next(list);
    }

    getAll(): Employee[] {
        return this.directorySubject.value;
    }

    // Login hote hi Super User ko list me add/update karta hai
    setSuperUser(username: string): void {
        const list = this.getAll().filter(e => e.role !== 'Super User');

        list.unshift({
            employeeName: username,
            emailAddress: '-',
            mobileNumber: '-',
            branchId: 0,
            role: 'Super User'
        });

        this.saveToStorage(list);
    }

    // Super User jab naya employee register karta hai to list me add karta hai
    addEmployee(employee: Omit<Employee, 'role'>): void {
        const list = this.getAll();

        list.push({
            ...employee,
            role: 'Employee'
        });

        this.saveToStorage(list);
    }
}
