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
      }
    }
  },
  apis: []
};

module.exports = swaggerJsdoc(options);