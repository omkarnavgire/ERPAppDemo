import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({ providedIn: 'root' })
export class EmployeeApi {
  private http = inject(HttpClient);
  getAllForDropdown() { return this.http.get('https://batchmanagement.ciitstudent.com/api/Employee/get-all-for-dropdown'); }
}
