import { Component, computed, EventEmitter, inject, Output } from "@angular/core";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { AuthService } from "../../../auth/auth.service";
import { DatePipe } from "@angular/common";

@Component({
    selector: 'app-toolbar',
    standalone: true,
    templateUrl: 'app-toolbar.component.html',
    styleUrls: ['app-toolbar.component.css'],
    imports: [MatButtonModule, MatIconModule, MatToolbarModule, DatePipe]
})
export class ToolbarComponent {
    @Output() sideNavToggled = new EventEmitter<void>();

    private authService = inject(AuthService);

    isAuthenticated = computed<boolean>(()=>this.authService.isAuthenticated());
    userName = computed<string | null>(()=>this.authService.username());
    currentDate = new Date();

    onToggleSideNav(): void {
        this.sideNavToggled.emit();
    }
}