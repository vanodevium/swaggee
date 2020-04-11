/**
 * @api {delete} /users/:id Delete user by ID
 * @apiName DeleteUser
 * @apiGroup User
 *
 * @apiUse Headers
 *
 * @apiParam {Integer} id User ID
 * @apiParam {Boolean} [force=false] Force deletion
 *
 * @apiError {String} errorMessage Error message
 * @apiError {Integer} id User ID
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "errorMessage": "User not found",
 *       "id": 1
 *     }
 */
