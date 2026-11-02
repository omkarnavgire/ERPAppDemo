import { API_ENDPOINTS } from "../../../Core/config/api-endpoints";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { Qualification } from "../../Domain/Entities/Qualification";

@Injectable({
  providedIn: "root"
})
export class QualificationApi {
  private http = inject(HttpClient);

  getAll(): Observable<Qualification[]> {
    return this.http
      .get<any>(`${API_ENDPOINTS.lead}/Qualification`)
      .pipe(
        map(response => {
          const data =
            response?.data ??
            response?.result ??
            response?.items ??
            response?.$values ??
            response;

          if (Array.isArray(data)) {
            return data as Qualification[];
          }

          if (Array.isArray(data?.$values)) {
            return data.$values as Qualification[];
          }

          console.error("Invalid Qualification API response:", response);
          return [];
        })
      );
  }
}