export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required.") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You are not allowed to perform this action.") {
    super("FORBIDDEN", message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message, 400);
  }
}

export class InvalidStateError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, 409);
  }
}

export class PartnerNotFoundError extends NotFoundError {
  constructor() {
    super("PARTNER_NOT_FOUND", "Partner was not found.");
  }
}

export class ClientNotFoundError extends NotFoundError {
  constructor() {
    super("CLIENT_NOT_FOUND", "Client was not found.");
  }
}

export class CategoryNotFoundError extends NotFoundError {
  constructor() {
    super("CATEGORY_NOT_FOUND", "Category was not found.");
  }
}

export class ServiceRequestNotFoundError extends NotFoundError {
  constructor() {
    super("SERVICE_REQUEST_NOT_FOUND", "Service request was not found.");
  }
}

export class ServiceRequestAlreadyAcceptedError extends ConflictError {
  constructor() {
    super("SERVICE_REQUEST_ALREADY_ACCEPTED", "The service request has already been accepted.");
  }
}

export class InvalidServiceRequestStateError extends InvalidStateError {
  constructor() {
    super("INVALID_SERVICE_REQUEST_STATE", "This transition is not allowed for the current state.");
  }
}

export class UnauthorizedServiceRequestAccessError extends ForbiddenError {
  constructor() {
    super("You cannot access this service request.");
  }
}

export class UserAlreadyExistsError extends ConflictError {
  constructor() {
    super("USER_ALREADY_EXISTS", "A user with this email already exists.");
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super("Invalid email or password.");
  }
}

export class AccountNotActiveError extends ForbiddenError {
  constructor() {
    super("This account is not active.");
  }
}
