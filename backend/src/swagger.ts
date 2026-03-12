import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UAE Jobs Portal API',
      version: '1.0.0',
      description: 'Production-ready UAE Job Portal REST API',
      contact: { name: 'UAE Jobs', email: 'api@uaejobs.local' },
    },
    servers: [
      { url: `http://localhost:${config.port}/api/v1`, description: 'Local' },
      { url: 'https://api.uaejobs.ae/api/v1', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
        Job: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            slug: { type: 'string' },
            emirate: { type: 'string', enum: ['ABU_DHABI', 'DUBAI', 'SHARJAH', 'AJMAN', 'UMM_AL_QUWAIN', 'RAS_AL_KHAIMAH', 'FUJAIRAH'] },
            workMode: { type: 'string', enum: ['ONSITE', 'HYBRID', 'REMOTE'] },
            salaryMin: { type: 'integer', nullable: true },
            salaryMax: { type: 'integer', nullable: true },
            status: { type: 'string' },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            items: { type: 'array', items: {} },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.router.ts', './src/modules/**/*.router.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
