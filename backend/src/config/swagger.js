const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'University Housing API',
      version: '1.0.0',
      description: 'Complete API Documentation for Cairo University Housing System',
    },
    servers: [{ url: 'http://localhost:5000' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        Application: {
          type: 'object',
          required: ['studentType', 'fullName', 'college', 'academicYear'],
          properties: {
            studentType: { type: 'string', enum: ['new', 'existing'] },
            fullName: { type: 'string' },
            college: { type: 'string' },
            academicYear: { type: 'string' },
          }
        }
      }
    },
    paths: {
      // --- APPLICATIONS ---
      '/api/applications': {
        get: {
          summary: 'Get all applications (Admin only)',
          tags: ['Applications'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        },
        post: {
          summary: 'Submit application',
          tags: ['Applications'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Application' } } }
          },
          responses: { 201: { description: 'Created' } }
        }
      },
      '/api/applications/my': {
        get: {
          summary: 'Get my applications',
          tags: ['Applications'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/applications/{id}': {
        get: {
          summary: 'Get specific application',
          tags: ['Applications'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } }
        },
        patch: {
          summary: 'Update application',
          tags: ['Applications'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated' } }
        },
        delete: {
          summary: 'Delete application',
          tags: ['Applications'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } }
        }
      },
      '/api/applications/{id}/approve': {
        patch: {
          summary: 'Approve application',
          tags: ['Applications'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Approved' } }
        }
      },
      '/api/applications/{id}/reject': {
        patch: {
          summary: 'Reject application',
          tags: ['Applications'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Rejected' } }
        }
      },

      // --- BUILDINGS ---
      '/api/buildings': {
        get: {
          summary: 'Get all buildings',
          tags: ['Buildings'],
          responses: { 200: { description: 'Success' } }
        },
        post: {
          summary: 'Create building (Admin only)',
          tags: ['Buildings'],
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Created' } }
        }
      },
      '/api/buildings/{id}': {
        get: {
          summary: 'Get building by ID',
          tags: ['Buildings'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } }
        },
        put: {
          summary: 'Update building details',
          tags: ['Buildings'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated' } }
        }
      },

      // --- ROOMS ---
      '/api/rooms': {
        get: {
          summary: 'Get all rooms',
          tags: ['Rooms'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        },
        post: {
          summary: 'Add a room (Admin only)',
          tags: ['Rooms'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { buildingId: {type: 'string'}, floorNumber: {type: 'number'}, roomNumber: {type: 'string'}, capacity: {type: 'number'} } } } }
          },
          responses: { 201: { description: 'Room created' } }
        }
      },
      '/api/rooms/available': {
        get: {
          summary: 'Get all available rooms',
          tags: ['Rooms'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/rooms/building/{buildingId}': {
        get: {
          summary: 'Get all rooms in a specific building',
          tags: ['Rooms'],
          parameters: [{ name: 'buildingId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/rooms/{id}': { // GROUPED: GET (ID) and PUT
        get: {
          summary: 'Get a specific room',
          tags: ['Rooms'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } }
        },
        put: {
          summary: 'Update a room (Admin only)',
          tags: ['Rooms'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { capacity: { type: 'number' } } } } }
          },
          responses: { 200: { description: 'Room updated' } }
        }
      },
      '/api/rooms/{id}/status': { // PATCH 1
        patch: {
          summary: 'Change room status',
          tags: ['Rooms'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' } } } } }
          },
          responses: { 200: { description: 'Status updated' } }
        }
      },
      '/api/rooms/{id}/assign': { // PATCH 2
        patch: {
          summary: 'Assign a student to a room (Admin only)',
          tags: ['Rooms'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { studentId: { type: 'string' }, bedNumber: { type: 'number' } } } } }
          },
          responses: { 200: { description: 'Student assigned' } }
        }
      },
      '/api/rooms/{id}/remove-student': { // PATCH 3
        patch: {
          summary: 'Remove a student from a room (Admin only)',
          tags: ['Rooms'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { studentId: { type: 'string' } } } } }
          },
          responses: { 200: { description: 'Student removed' } }
        }
      },

      // --- STUDENTS ---
      '/api/students': {
        get: {
          summary: 'Get all students (Admin only)',
          tags: ['Students'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/students/me': {
        get: {
          summary: 'Get my student profile',
          tags: ['Students'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        },
        patch: {
          summary: 'Update my profile',
          tags: ['Students'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Profile updated' } }
        }
      },
      '/api/students/me/qr': {
        get: {
          summary: 'Get my Digital ID QR Code',
          tags: ['Students'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Returns Base64 QR Image' } }
        }
      },
      '/api/students/{id}': {
        get: {
          summary: 'Get student by ID (Admin only)',
          tags: ['Students'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } }
        }
      },

      // --- HOUSING REQUESTS ---
      '/api/housing-requests': {
        post: {
          summary: 'Submit a housing request',
          tags: ['Housing Requests'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { type: { type: 'string', enum: ['transfer', 'vacate'] }, fromRoomId: { type: 'string' }, toRoomId: { type: 'string' }, reason: { type: 'string' } } } } }
          },
          responses: { 201: { description: 'Success' } }
        },
        get: {
          summary: 'Get all housing requests (Admin only)',
          tags: ['Housing Requests'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/housing-requests/{id}': {
        get: {
          summary: 'Get a specific housing request details',
          tags: ['Housing Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/housing-requests/{id}/approve': {
        patch: {
          summary: 'Approve a housing request (Admin only)',
          tags: ['Housing Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Request approved' } }
        }
      },
      '/api/housing-requests/{id}/reject': {
        patch: {
          summary: 'Reject a housing request (Admin only)',
          tags: ['Housing Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } }
          },
          responses: { 200: { description: 'Request rejected' } }
        }
      },

      
    }
  },
  apis: [] 
};

module.exports = swaggerJsdoc(options);