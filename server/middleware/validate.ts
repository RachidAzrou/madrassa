import { Request, Response, NextFunction } from "express";
import { z } from "zod";

type ValidateSchema = {
  body?: z.ZodType<any, any>;
  query?: z.ZodType<any, any>;
  params?: z.ZodType<any, any>;
};

export const validateRequest = (schema: ValidateSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validatiefout",
          errors: error.errors.map(err => ({
            path: err.path.join("."),
            message: err.message
          }))
        });
      }
      
      return res.status(500).json({
        message: "Server validatiefout",
        error: error instanceof Error ? error.message : "Onbekende fout"
      });
    }
  };
};