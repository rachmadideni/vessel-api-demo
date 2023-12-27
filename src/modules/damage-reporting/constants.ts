export const MAX_PHOTO_SIZE = 1024 * 1024;
export const MAX_PHOTO_COUNT = 5;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
export const ALLOWED_EXT = 'jpg|png|jpeg|gif|bmp';

export const API_BODY_FILES_SCHEMA = {
  schema: {
    type: 'object',
    properties: {
      files: {
        // 👈 this property name (files) must matches with the 1st parameter of FilesInterceptor
        type: 'array',
        items: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  },
};
