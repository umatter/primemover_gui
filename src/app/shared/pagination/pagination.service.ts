import { Injectable } from '@angular/core';
import { Meta } from '@shared/pagination/model';
import { PaginatePipeArgs } from 'ngx-pagination';
import { PaginationType } from '@shared/pagination/type';

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  constructor() {}

  getPipeArgs(meta: Meta, type: PaginationType): PaginatePipeArgs {
    return {
      id: type,
      itemsPerPage: meta?.per_page,
      currentPage: meta?.current_page,
      totalItems: meta?.total
    };
  }
}
