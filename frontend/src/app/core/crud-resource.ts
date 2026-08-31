import { Observable } from 'rxjs';
import { PagedResult } from './models';

/**
 * Shared contract for a typed resource boundary. Each resource keeps its own business-shaped
 * commands instead of exposing a generic entity/table API to a page component.
 */
export interface CrudResource<TListItem, TDetails, TCreate, TUpdate, TQuery> {
  select(query: TQuery): Observable<PagedResult<TListItem>>;
  selectById(id: string): Observable<TDetails>;
  add(command: TCreate): Observable<TDetails>;
  edit(id: string, command: TUpdate): Observable<TDetails>;
  delete(id: string): Observable<void>;
}
