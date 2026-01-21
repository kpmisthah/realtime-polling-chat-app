import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ApiError } from '../utils/ApiError';

/**
 * Middleware to validate request body against a DTO class
 * @param dtoClass - The DTO class to validate against
 * @returns Express middleware function
 */
export const validateDto = (dtoClass: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Transform plain object to class instance
            const dtoInstance = plainToInstance(dtoClass, req.body);

            // Validate the instance
            const errors: ValidationError[] = await validate(dtoInstance, {
                whitelist: true, // Strip properties that don't have decorators
                forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
                skipMissingProperties: false,
            });

            if (errors.length > 0) {
                // Format validation errors
                const formattedErrors = errors.map((error: ValidationError) => ({
                    field: error.property,
                    constraints: error.constraints,
                    value: error.value,
                }));

                // Create a readable error message
                const errorMessages = errors
                    .map((error: ValidationError) =>
                        Object.values(error.constraints || {}).join(', ')
                    )
                    .join('; ');

                throw new ApiError(400, `Validation failed: ${errorMessages}`, formattedErrors);
            }

            req.body = dtoInstance;
            next();
        } catch (error) {
            if (error instanceof ApiError) {
                next(error);
            } else {
                next(new ApiError(400, 'Validation error'));
            }
        }
    };
};
