const { z } = require('zod');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
  };
};

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const ticketSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  category: z.enum(['billing', 'tech', 'shipping', 'other']).optional()
});

const articleSchema = z.object({
  title: z.string().min(5).max(200),
  body: z.string().min(20).max(5000),
  tags: z.array(z.string()).max(10),
  status: z.enum(['draft', 'published'])
});

const replySchema = z.object({
  content: z.string().min(1).max(2000),
  isAgent: z.boolean().optional(),
  status: z.enum(['open', 'triaged', 'waiting_human', 'resolved', 'closed']).optional()
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  ticketSchema,
  articleSchema,
  replySchema
};