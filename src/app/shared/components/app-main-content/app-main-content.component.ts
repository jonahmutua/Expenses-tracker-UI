import { Component } from "@angular/core";
import { SidebarComponent } from "../app-sidebar/app-sidebar.component";
import { RouterModule } from "@angular/router";
import { MatCard } from "@angular/material/card";

@Component({
    selector: 'app-main-content',
    standalone: true,
    templateUrl: 'app-main-content.component.html',
    styleUrls: ['app-main-content.component.css'],
    imports: [SidebarComponent, RouterModule, MatCard]
})
export class MainContentComponent {

}