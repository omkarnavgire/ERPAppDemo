import { API_ENDPOINTS } from "../../../Core/config/api-endpoints";
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({ providedIn: 'root' })
export class EmployeeApi {
  private http = inject(HttpClient);
  getAllForDropdown() { return this.http.get(`${API_ENDPOINTS.batchManagement}/Employee/get-all-for-dropdown`); }
}
