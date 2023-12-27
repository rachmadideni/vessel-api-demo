import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginateDto } from '../dto/paginated.dto';

interface IPaginationDecoreatorApi {
  model: Type<any>;
  description?: string;
}

export const ApiPagination = (options: IPaginationDecoreatorApi) => {
  return applyDecorators(
    ApiExtraModels(PaginateDto),
    ApiOkResponse({
      description: options.description || 'Successfully received model list',
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginateDto) },
          {
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(options.model) },
              },
              meta: {
                type: 'any',
                default: {
                  totalItems: 1,
                  itemCount: 1,
                  itemsPerPage: 1,
                  totalPages: 1,
                  currentPage: 1,
                },
              },
            },
          },
        ],
      },
    })
  );
};
