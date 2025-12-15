import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from "@angular/router";
import { SidebarComponent } from "../shared/components/app-sidebar/app-sidebar.component";

@Component({
    selector: 'em-home',
    templateUrl: 'home.component.html',
    standalone: true,
    imports: [ RouterModule, SidebarComponent, RouterOutlet]
})
export class HomeComponent {

}