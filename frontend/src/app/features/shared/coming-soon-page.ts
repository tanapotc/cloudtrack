import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-coming-soon-page',
  imports: [MatIconModule],
  templateUrl: './coming-soon-page.html',
  styleUrl: './coming-soon-page.scss',
})
export class ComingSoonPage {
  private readonly route = inject(ActivatedRoute);
  readonly title = this.route.snapshot.data['title'] as string;
  readonly description = this.route.snapshot.data['description'] as string;
}
