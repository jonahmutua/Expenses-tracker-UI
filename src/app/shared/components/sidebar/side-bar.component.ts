// sidebar.component.ts
import { Component } from '@angular/core';
import { MatSidenavContent, MatSidenavContainer, MatSidenav } from "@angular/material/sidenav";
import { RouterOutlet } from "@angular/router";
import { MatNavList, MatListItem } from "@angular/material/list";
import { NavbarComponent } from "../navbar/navbar.component";

@Component({
  selector: 'app-sidebar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css'],
  standalone: true,
  imports: [MatSidenavContent, RouterOutlet, MatSidenavContainer, MatSidenav, MatNavList, MatListItem, NavbarComponent]
})
export class SidebarComponent {}
