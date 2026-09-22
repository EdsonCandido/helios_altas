import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { authRateLimiter } from "../middlewares/rate-limit.js";
import { adminController } from "../modules/admin/admin.controller.js";
import { authController } from "../modules/auth/auth.controller.js";
import { categoryController } from "../modules/categories/category.controller.js";
import { notificationController } from "../modules/notifications/notification.controller.js";
import { partnerController } from "../modules/partners/partner.controller.js";
import { serviceRequestController } from "../modules/service-requests/service-request.controller.js";
import { userController } from "../modules/users/user.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createRoutes(): Router {
  const router = Router();

  router.post("/auth/register", authRateLimiter, asyncHandler(authController.register.bind(authController)));
  router.post("/auth/login", authRateLimiter, asyncHandler(authController.login.bind(authController)));
  router.post("/auth/refresh", authRateLimiter, asyncHandler(authController.refresh.bind(authController)));
  router.post("/auth/logout", asyncHandler(authController.logout.bind(authController)));
  router.get("/auth/me", authenticate, asyncHandler(authController.me.bind(authController)));

  router.patch("/users/me", authenticate, asyncHandler(userController.updateMe.bind(userController)));
  router.patch(
    "/users/me/password",
    authenticate,
    asyncHandler(userController.changePassword.bind(userController)),
  );

  router.get(
    "/clients/me",
    authenticate,
    authorize("CLIENT"),
    asyncHandler(userController.getClientMe.bind(userController)),
  );
  router.patch(
    "/clients/me",
    authenticate,
    authorize("CLIENT"),
    asyncHandler(userController.updateClientMe.bind(userController)),
  );

  router.get(
    "/partners/me",
    authenticate,
    authorize("PARTNER"),
    asyncHandler(partnerController.me.bind(partnerController)),
  );
  router.put(
    "/partners/me",
    authenticate,
    authorize("PARTNER"),
    asyncHandler(partnerController.updateMe.bind(partnerController)),
  );
  router.patch(
    "/partners/me/availability",
    authenticate,
    authorize("PARTNER"),
    asyncHandler(partnerController.availability.bind(partnerController)),
  );
  router.put(
    "/partners/me/services",
    authenticate,
    authorize("PARTNER"),
    asyncHandler(partnerController.services.bind(partnerController)),
  );
  router.get("/partners/nearby", authenticate, asyncHandler(partnerController.nearby.bind(partnerController)));
  router.get("/partners/:id", authenticate, asyncHandler(partnerController.publicProfile.bind(partnerController)));

  router.get("/categories", asyncHandler(categoryController.list.bind(categoryController)));

  router.post(
    "/service-requests",
    authenticate,
    authorize("CLIENT"),
    asyncHandler(serviceRequestController.create.bind(serviceRequestController)),
  );
  router.get(
    "/service-requests",
    authenticate,
    asyncHandler(serviceRequestController.list.bind(serviceRequestController)),
  );
  router.get(
    "/service-requests/:id",
    authenticate,
    asyncHandler(serviceRequestController.get.bind(serviceRequestController)),
  );
  router.post(
    "/service-requests/:id/cancel",
    authenticate,
    authorize("CLIENT"),
    asyncHandler(serviceRequestController.cancel.bind(serviceRequestController)),
  );
  router.post(
    "/service-requests/:id/accept",
    authenticate,
    authorize("PARTNER"),
    asyncHandler(serviceRequestController.accept.bind(serviceRequestController)),
  );
  router.post(
    "/service-requests/:id/reject",
    authenticate,
    authorize("PARTNER"),
    asyncHandler(serviceRequestController.reject.bind(serviceRequestController)),
  );
  router.post(
    "/service-requests/:id/start",
    authenticate,
    authorize("PARTNER"),
    asyncHandler(serviceRequestController.start.bind(serviceRequestController)),
  );
  router.post(
    "/service-requests/:id/complete",
    authenticate,
    authorize("PARTNER"),
    asyncHandler(serviceRequestController.complete.bind(serviceRequestController)),
  );

  router.get(
    "/notifications",
    authenticate,
    asyncHandler(notificationController.list.bind(notificationController)),
  );
  router.post(
    "/notifications/:id/read",
    authenticate,
    asyncHandler(notificationController.read.bind(notificationController)),
  );
  router.post(
    "/notifications/read-all",
    authenticate,
    asyncHandler(notificationController.readAll.bind(notificationController)),
  );

  router.get("/admin/users", authenticate, authorize("ADMIN"), asyncHandler(adminController.users.bind(adminController)));
  router.post(
    "/admin/users/:id/reset-password",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(adminController.resetUserPassword.bind(adminController)),
  );
  router.patch(
    "/admin/users/:id",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(adminController.updateUser.bind(adminController)),
  );
  router.get(
    "/admin/categories",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(adminController.categories.bind(adminController)),
  );
  router.post(
    "/admin/categories",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(adminController.createCategory.bind(adminController)),
  );
  router.patch(
    "/admin/categories/:id",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(adminController.updateCategory.bind(adminController)),
  );
  router.get(
    "/admin/service-requests",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(adminController.requests.bind(adminController)),
  );
  router.get(
    "/admin/maps/partners",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(adminController.mapPartners.bind(adminController)),
  );
  router.get(
    "/admin/maps/service-requests/clusters",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(adminController.mapClusters.bind(adminController)),
  );
  router.get(
    "/admin/indicators",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(adminController.indicators.bind(adminController)),
  );

  return router;
}
