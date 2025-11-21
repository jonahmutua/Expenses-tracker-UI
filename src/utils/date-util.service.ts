import { Injectable } from "@angular/core";

@Injectable({
        providedIn: 'root'
})
export class DateUtilService {

    // Ensure local Date in format 'YYYY-MM-DD'
    formatLocalDate(date: Date) : string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2,'0');
        const d = String(date.getDate()).padStart(2,'0');
        return `${y}-${m}-${d}`;
    }

}