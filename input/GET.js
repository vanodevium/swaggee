/**
 * @api {get} /users Get all users
 * @apiDescription User profiles
 * @apiName GetUsers
 * @apiGroup User
 *
 * @apiUse Headers
 *
 * @apiSuccess {$User[]} users User profiles
 */

/**
 * @api {get} /users/:id Get user by ID
 * @apiDescription User profile
 * @apiName GetUser
 * @apiGroup User
 *
 * @apiUse Headers
 *
 * @apiParam {Integer} id User ID
 *
 * @apiSuccess {Number} User:id ID of the User
 * @apiSuccess {String} User:firstname Firstname of the User
 * @apiSuccess {String} User:lastname Lastname of the User
 *
 * @apiError {String} errorMessage Error message
 * @apiError {Integer} id User ID
 *
 * @apiError {String} errorMessage Conflict situation
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 409 CONFLICT
 *     {
 *       "errorMessage": "Conflict situation"
 *     }
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "errorMessage": "User not found",
 *       "id": 1
 *     }
 */

/**
 * @apiDefine Headers
 * @apiHeader {String} authorization JWT token
 * @apiHeader {Number} [account-id] Account ID
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
 *       "account-id": 1
 *     }
 */
