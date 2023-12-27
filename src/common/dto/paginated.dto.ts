interface PaginatedMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

class PaginateDto<TData> {
  items: TData[];
  meta: PaginatedMeta;
}

export { PaginatedMeta, PaginateDto };
