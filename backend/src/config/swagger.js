const swaggerJsdoc = require('swagger-jsdoc');

const trimTrailingSlash = (url) => (url ? String(url).replace(/\/$/, '') : null);

/**
 * OpenAPI `servers[].url` must be absolute (https://host) or a path like `/`.
 * A bare hostname (e.g. from env without scheme) is resolved relative to /api-docs/ and breaks requests.
 */
const ensureAbsoluteServerUrl = (url) => {
  if (url == null || url === '') return null;
  const u = String(url).trim();
  if (u === '/') return '/';
  const noTrail = trimTrailingSlash(u) || u;
  if (/^https?:\/\//i.test(noTrail)) return noTrail;
  if (noTrail.startsWith('/')) return noTrail;
  return `https://${noTrail}`;
};

// Never use localhost in `servers` — hosted Swagger must call the deployed API (Railway).
// Priority: explicit base URL → Railway-provided vars → same-origin (relative `/`).
const swaggerServerUrlRaw =
  trimTrailingSlash(process.env.SWAGGER_SERVER_URL) ||
  trimTrailingSlash(process.env.PUBLIC_API_URL) ||
  trimTrailingSlash(process.env.RAILWAY_STATIC_URL) ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${trimTrailingSlash(process.env.RAILWAY_PUBLIC_DOMAIN)}`
    : null);

const swaggerServerUrl = swaggerServerUrlRaw ? ensureAbsoluteServerUrl(swaggerServerUrlRaw) : null;

const swaggerServers = swaggerServerUrl
  ? [{ url: swaggerServerUrl, description: 'Railway API' }]
  : [{ url: '/', description: 'Same host as Swagger UI (set SWAGGER_SERVER_URL for a fixed Railway base)' }];

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'University Housing API',
      version: '1.0.0',
      description: 'Complete API Documentation for Cairo University Housing System',
    },
    servers: swaggerServers,
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
          summary: 'Submit application with PDF document',
          tags: ['Applications'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'multipart/form-data': { // Change this from application/json
                schema: {
                  type: 'object',
                  properties: {
                    // All your existing fields
                    studentType: { type: 'string', enum: ['new', 'existing'] },
                    fullName: { type: 'string' },
                    college: { type: 'string' },
                    academicYear: { type: 'string' },
                    // The magic part for the PDF upload:
                    document: { 
                      type: 'string', 
                      format: 'binary', 
                      description: 'The PDF file to upload' 
                    }
                  }
                }
              }
            }
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
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['name', 'gender', 'floors'],  
          properties: {
            name: {
              type: 'string',
              description: 'Building name (must be unique)',
              example: 'Block A'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female'],
              description: 'Target students gender',
              example: 'male'
            },
            floors: {
              type: 'integer',
              minimum: 1,
              description: 'Total number of floors',
              example: 4
            },
            description: {
              type: 'string',
              description: 'Brief description about the building',
              example: 'Main residence for engineering students'
            },
            supervisorName: {
              type: 'string',
              example: 'Ahmed Mohamed'
            },
            supervisorPhone: {
              type: 'string',
              example: '01234567890'
            }
          }
        }
      }
    }
  },
  responses: {
    201: { 
      description: 'Created successfully' 
    },
    400: { 
      description: 'Validation Error (e.g., duplicate name or missing fields)' 
    }
  }
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
      '/api/students/me/generate-qr': {
        post: {
          summary: 'Generate QR code for currently logged-in student',
          tags: ['Students'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'QR code generated' }, 404: { description: 'Student not found' } }
        }
      },
      '/api/students/validate-qr': {
        post: {
          summary: 'Validate a student QR code',
          tags: ['Students'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['qrCode'],
                  properties: {
                    qrCode: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Validation result' }, 400: { description: 'Bad Request' }, 404: { description: 'Invalid QR code' } }
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

      // --- AUTH ---
      '/api/auth/login': {
        post: {
          summary: 'Login user',
          tags: ['Auth'],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firebaseUID: { type: 'string' }
                  },
                  required: ['firebaseUID']
                }
              }
            }
          },
          responses: { 200: { description: 'Login successful' }, 404: { description: 'User not found' }, 500: { description: 'Server error' } }
        }
      },
      '/api/auth/register': {
        post: {
          summary: 'Register user',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    universityID: { type: 'string' },
                    phoneNumber: { type: 'string' },
                    faculty: { type: 'string' }
                  },
                  required: ['universityID', 'phoneNumber', 'faculty']
                }
              }
            }
          },
          responses: { 201: { description: 'Account created' }, 400: { description: 'Already registered' }, 500: { description: 'Server error' } }
        }
      },
      '/api/auth/profile': {
        get: {
          summary: 'Get current user profile',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Profile returned' }, 401: { description: 'Unauthorized' }, 500: { description: 'Server error' } }
        }
      },
      '/api/auth/password': {
        patch: {
          summary: 'Change password',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    newPassword: { type: 'string' }
                  },
                  required: ['newPassword']
                }
              }
            }
          },
          responses: { 200: { description: 'Password updated' }, 400: { description: 'Bad request' }, 500: { description: 'Server error' } }
        }
      },
      '/api/auth/forgot-password': {
        post: {
          summary: 'Request forgot password',
          tags: ['Auth'],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' }
                  },
                  required: ['email']
                }
              }
            }
          },
          responses: { 200: { description: 'Reset link sent' }, 400: { description: 'Bad request' }, 500: { description: 'Server error' } }
        }
      },

      // --- USERS ---
      '/api/users/{id}': {
        delete: {
          summary: 'Delete user (admin)',
          tags: ['User'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted successfully' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' }, 500: { description: 'Server error' } }
        }
      },

      // --- V2 REQUESTS ---
      '/api/v2/requests/submit': {
        post: {
          summary: 'Submit a service request (Student only)',
          tags: ['V2 Requests'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          },
          responses: { 201: { description: 'Request submitted' }, 400: { description: 'Bad request' }, 401: { description: 'Unauthorized' } }
        }
      },
      '/api/v2/requests': {
        get: {
          summary: 'Get all requests for admin',
          tags: ['V2 Requests'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' } }
        }
      },
      '/api/v2/requests/{requestId}': {
        get: {
          summary: 'Get request details',
          tags: ['V2 Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'requestId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' }, 404: { description: 'Request not found' } }
        }
      },
      '/api/v2/requests/{requestId}/assign': {
        patch: {
          summary: 'Assign request to current admin',
          tags: ['V2 Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'requestId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Request assigned' }, 403: { description: 'Forbidden' }, 404: { description: 'Request not found' } }
        }
      },
      '/api/v2/requests/{requestId}/message': {
        patch: {
          summary: 'Add message to a request',
          tags: ['V2 Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'requestId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' }
                  },
                  required: ['message']
                }
              }
            }
          },
          responses: { 200: { description: 'Message added' }, 400: { description: 'Bad request' }, 404: { description: 'Request not found' } }
        }
      },
      '/api/v2/requests/{requestId}/respond': {
        patch: {
          summary: 'Respond to request (Admin only)',
          tags: ['V2 Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'requestId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          },
          responses: { 200: { description: 'Response submitted' }, 403: { description: 'Forbidden' }, 404: { description: 'Request not found' } }
        }
      },

      // --- V2 QR / ATTENDANCE / MEALS ---
      '/api/v2/qr-codes/generate': {
        post: {
          summary: 'Generate student QR codes',
          tags: ['V2 QR'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'QR codes generated' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' } }
        }
      },
      '/api/v2/qr-codes': {
        get: {
          summary: 'Get current student QR codes',
          tags: ['V2 QR'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' } }
        }
      },
      '/api/v2/attendance/scan': {
        post: {
          summary: 'Scan attendance QR (Floor Supervisor only)',
          tags: ['V2 Attendance'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          },
          responses: { 200: { description: 'Attendance recorded' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' } }
        }
      },
      '/api/v2/meals/scan': {
        post: {
          summary: 'Scan meal QR (Meal Admin only)',
          tags: ['V2 Meals'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          },
          responses: { 200: { description: 'Meal recorded' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' } }
        }
      },

      // --- V2 LEAVE ---
      '/api/v2/leave/request': {
        post: {
          summary: 'Submit leave request',
          tags: ['V2 Leave'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          },
          responses: { 201: { description: 'Leave requested' }, 400: { description: 'Bad request' } }
        }
      },
      '/api/v2/leave/{requestId}/approve': {
        patch: {
          summary: 'Approve leave request (Supervisor only)',
          tags: ['V2 Leave'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'requestId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Leave approved' }, 403: { description: 'Forbidden' }, 404: { description: 'Request not found' } }
        }
      },
      '/api/v2/leave/{studentId}/end': {
        patch: {
          summary: 'End student leave (Supervisor only)',
          tags: ['V2 Leave'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'studentId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Leave ended' }, 403: { description: 'Forbidden' }, 404: { description: 'Student not found' } }
        }
      },
      '/api/v2/attendance/{studentId}/report': {
        get: {
          summary: 'Get attendance report by student',
          tags: ['V2 Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'studentId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' }, 404: { description: 'Student not found' } }
        }
      }
    }
  },
  apis: []
};

module.exports = swaggerJsdoc(options);