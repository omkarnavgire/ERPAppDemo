import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-settings",
    standalone: true,
    templateUrl: "./Settings.html",
    styleUrl: "./Settings.css"
})
export class SettingsComponent implements OnInit {
    selectedTheme = "light";

    ngOnInit(): void {
        this.selectedTheme = localStorage.getItem("theme") || "light";
        this.applyTheme(this.selectedTheme);
        console.log("Current theme:", this.selectedTheme);
    }

    setTheme(theme: string): void {
        this.selectedTheme = theme;
        localStorage.setItem("theme", theme);
        this.applyTheme(theme);
        console.log("Theme changed to:", theme);
    }

    private applyTheme(theme: string): void {
        document.documentElement.setAttribute("data-theme", theme);
    }
}