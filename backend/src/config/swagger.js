const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'University Housing API',
      version: '1.0.0',
      description: 'Complete API Documentation for Cairo University Housing System',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Local API' }],
    tags: [
      { name: 'Auth', description: 'Firebase token verification' },
      { name: 'Applications', description: 'Housing applications' },
      { name: 'Buildings', description: 'Buildings' },
      { name: 'Rooms', description: 'Rooms and assignments' },
      { name: 'Students', description: 'Student profiles and QR' },
      { name: 'Housing Requests', description: 'Transfer and vacate requests' },
      { name: 'Meals', description: 'Menu, bookings, and meal scan' },
      { name: 'Attendance', description: 'Attendance recording and scan' },
      { name: 'Reports', description: 'Issue reports' },
      { name: 'Payments', description: 'Payments' },
      { name: 'Stats', description: 'Admin statistics' },
      { name: 'Announcements', description: 'Announcements' },
      { name: 'Notifications', description: 'Push-style notifications' },
      { name: 'User', description: 'User administration' }
    ],
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
          security: [{ bearerAuth: [] }],
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
          security: [{ bearerAuth: [] }],
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
          security: [{ bearerAuth: [] }],
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
          security: [{ bearerAuth: [] }],
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
          summary: 'Get student by ID (admin)',
          tags: ['Students'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } }
        },
        patch: {
          summary: 'Update student by ID (admin)',
          tags: ['Students'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', additionalProperties: true, description: 'Fields to update on the student record' }
              }
            }
          },
          responses: { 200: { description: 'Updated' } }
        }
      },

      // --- HOUSING REQUESTS ---
      '/api/housing-requests': {
        post: {
          summary: 'Submit a housing request (student)',
          tags: ['Housing Requests'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type'],
                  properties: {
                    type: { type: 'string', enum: ['transfer', 'vacate'] },
                    fromRoomId: { type: 'string' },
                    toRoomId: { type: 'string' },
                    reason: { type: 'string' },
                    startDate: { type: 'string', format: 'date-time', description: 'Required when type is vacate' },
                    endDate: { type: 'string', format: 'date-time', description: 'Required when type is vacate' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Success' } }
        },
        get: {
          summary: 'List housing requests (supervisor or admin)',
          tags: ['Housing Requests'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/housing-requests/{id}': {
        get: {
          summary: 'Get a specific housing request',
          tags: ['Housing Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/housing-requests/{id}/status': {
        patch: {
          summary: 'Update housing request status (supervisor or admin)',
          tags: ['Housing Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: { type: 'string', description: 'e.g. pending, approved, rejected' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Status updated' } }
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
                    firebaseToken: { type: 'string', description: 'Firebase ID token from client SDK' }
                  },
                  required: ['firebaseToken']
                }
              }
            }
          },
          responses: { 200: { description: 'Login successful' }, 404: { description: 'User not found' }, 500: { description: 'Server error' } }
        }
      },
      '/api/auth/register': {
        post: {
          summary: 'Register user (public — send Firebase ID token in body)',
          tags: ['Auth'],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firebaseToken: { type: 'string', description: 'Firebase ID token' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' }
                  },
                  required: ['firebaseToken', 'name', 'email', 'phone']
                }
              }
            }
          },
          responses: { 201: { description: 'Account created' }, 400: { description: 'Already registered' }, 500: { description: 'Server error' } }
        }
      },
      '/api/auth/register-admin': {
        post: {
          summary: 'Register a user with a specific role (admin only)',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firebaseToken: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    role: {
                      type: 'string',
                      enum: ['admin', 'student', 'restaurant_supervisor', 'floor_supervisor', 'computer_supervisor', 'user'],
                      description: 'Defaults to user if invalid'
                    }
                  },
                  required: ['firebaseToken', 'name', 'email', 'phone']
                }
              }
            }
          },
          responses: { 201: { description: 'User created' }, 400: { description: 'Already registered' }, 500: { description: 'Server error' } }
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
      '/api/auth/reset-password/{token}': {
        patch: {
          summary: 'Complete password reset (oobCode-style token from email link)',
          tags: ['Auth'],
          parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { newPassword: { type: 'string', minLength: 6 } },
                  required: ['newPassword']
                }
              }
            }
          },
          responses: { 200: { description: 'Password reset' }, 500: { description: 'Invalid or expired token' } }
        }
      },

      // --- MEALS ---
      '/api/meals/menu/today': {
        get: {
          summary: "Today's meal menu",
          tags: ['Meals'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of meals' } }
        }
      },
      '/api/meals/menu/week': {
        get: {
          summary: 'Weekly meal menu',
          tags: ['Meals'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of meals' } }
        }
      },
      '/api/meals': {
        post: {
          summary: 'Create meal (admin or restaurant_supervisor)',
          tags: ['Meals'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'mealType', 'price', 'date'],
                  properties: {
                    name: { type: 'string' },
                    mealType: { type: 'string' },
                    price: { type: 'number' },
                    date: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Created' }, 403: { description: 'Forbidden' } }
        }
      },
      '/api/meals/{id}': {
        put: {
          summary: 'Update meal (admin or restaurant_supervisor)',
          tags: ['Meals'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } }
          },
          responses: { 200: { description: 'Updated' }, 403: { description: 'Forbidden' } }
        },
        delete: {
          summary: 'Delete meal (admin or restaurant_supervisor)',
          tags: ['Meals'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' }, 403: { description: 'Forbidden' } }
        }
      },
      '/api/meals/book': {
        post: {
          summary: 'Book a meal (student)',
          tags: ['Meals'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['mealId', 'date'],
                  properties: {
                    mealId: { type: 'string' },
                    date: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Booked' }, 403: { description: 'Student only' }, 409: { description: 'Already booked' } }
        }
      },
      '/api/meals/book/{id}': {
        delete: {
          summary: 'Cancel a booking',
          tags: ['Meals'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Booking ID' }],
          responses: { 200: { description: 'Cancelled' }, 403: { description: 'Forbidden' } }
        }
      },
      '/api/meals/bookings/my': {
        get: {
          summary: 'My meal bookings (student)',
          tags: ['Meals'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Bookings' }, 403: { description: 'Student only' } }
        }
      },
      '/api/meals/scan': {
        post: {
          summary: 'Mark meal served via QR (admin or restaurant_supervisor)',
          tags: ['Meals'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['qrCode', 'mealId'],
                  properties: { qrCode: { type: 'string' }, mealId: { type: 'string' } }
                }
              }
            }
          },
          responses: { 200: { description: 'Meal served' }, 403: { description: 'Forbidden' } }
        }
      },

      // --- ATTENDANCE ---
      '/api/attendance': {
        post: {
          summary: 'Record attendance (supervisor roles)',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['studentId', 'buildingId', 'date', 'status'],
                  properties: {
                    studentId: { type: 'string' },
                    buildingId: { type: 'string' },
                    date: { type: 'string', format: 'date-time' },
                    status: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Recorded' }, 403: { description: 'Forbidden' }, 409: { description: 'Duplicate' } }
        }
      },
      '/api/attendance/scan': {
        post: {
          summary: 'Record attendance via QR scan',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['qrCode', 'buildingId'],
                  properties: { qrCode: { type: 'string' }, buildingId: { type: 'string' } }
                }
              }
            }
          },
          responses: { 200: { description: 'OK' }, 403: { description: 'Forbidden' } }
        }
      },
      '/api/attendance/student/{id}': {
        get: {
          summary: 'Attendance by student',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/attendance/building/{id}': {
        get: {
          summary: 'Attendance by building',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/attendance/{id}': {
        patch: {
          summary: 'Update an attendance record',
          tags: ['Attendance'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } }
          },
          responses: { 200: { description: 'Updated' } }
        }
      },

      // --- REPORTS ---
      '/api/reports': {
        post: {
          summary: 'Create report',
          tags: ['Reports'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    description: { type: 'string' },
                    severity: { type: 'string' },
                    imageUrl: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Created' } }
        },
        get: {
          summary: 'List reports',
          tags: ['Reports'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/reports/{id}': {
        get: {
          summary: 'Get report by ID',
          tags: ['Reports'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } }
        },
        delete: {
          summary: 'Delete report',
          tags: ['Reports'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } }
        }
      },
      '/api/reports/{id}/status': {
        patch: {
          summary: 'Update report status',
          tags: ['Reports'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', required: ['status'], properties: { status: { type: 'string' } } }
              }
            }
          },
          responses: { 200: { description: 'Updated' } }
        }
      },

      // --- PAYMENTS ---
      '/api/payments/my': {
        get: {
          summary: 'My payments (student)',
          tags: ['Payments'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/payments': {
        post: {
          summary: 'Create payment (student)',
          tags: ['Payments'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } }
          },
          responses: { 201: { description: 'Created' } }
        },
        get: {
          summary: 'All payments (admin)',
          tags: ['Payments'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/payments/{id}': {
        get: {
          summary: 'Get payment by ID (admin)',
          tags: ['Payments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } }
        },
        put: {
          summary: 'Update payment (admin)',
          tags: ['Payments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } }
          },
          responses: { 200: { description: 'Updated' } }
        },
        delete: {
          summary: 'Delete payment (admin)',
          tags: ['Payments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } }
        }
      },

      // --- STATS ---
      '/api/stats/students-by-college': {
        get: {
          summary: 'Students by college (admin)',
          tags: ['Stats'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/stats/students-by-grade': {
        get: {
          summary: 'Students by grade (admin)',
          tags: ['Stats'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/stats/rooms': {
        get: {
          summary: 'Room statistics (admin)',
          tags: ['Stats'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/stats/buildings-availability': {
        get: {
          summary: 'Building availability (admin)',
          tags: ['Stats'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/stats/meals': {
        get: {
          summary: 'Meal statistics (admin)',
          tags: ['Stats'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/stats/meals/preparation': {
        get: {
          summary: 'Meal preparation stats (admin)',
          tags: ['Stats'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/stats/payments': {
        get: {
          summary: 'Payment statistics (admin)',
          tags: ['Stats'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },

      // --- ANNOUNCEMENTS ---
      '/api/announcements': {
        post: {
          summary: 'Create announcement (admin)',
          tags: ['Announcements'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } }
          },
          responses: { 201: { description: 'Created' } }
        },
        get: {
          summary: 'List announcements',
          tags: ['Announcements'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Success' } }
        }
      },
      '/api/announcements/{id}': {
        get: {
          summary: 'Get announcement by ID',
          tags: ['Announcements'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } }
        },
        put: {
          summary: 'Update announcement (admin)',
          tags: ['Announcements'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } }
          },
          responses: { 200: { description: 'Updated' } }
        },
        delete: {
          summary: 'Delete announcement (admin)',
          tags: ['Announcements'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } }
        }
      },
      '/api/announcements/{id}/status': {
        patch: {
          summary: 'Update announcement status (admin)',
          tags: ['Announcements'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } }
          },
          responses: { 200: { description: 'Updated' } }
        }
      },

      // --- NOTIFICATIONS ---
      '/api/notifications': {
        post: {
          summary: 'Create notification (admin)',
          tags: ['Notifications'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    message: { type: 'string' },
                    targetUser: { type: 'string' },
                    targetRole: { type: 'string' },
                    type: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Created' } }
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