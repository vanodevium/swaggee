/**
 * @api {put} /users Create user
 * @apiDescription Endpoint for user creation
 * @apiName CreateUser
 * @apiGroup User
 *
 * @apiUse Headers
 *
 * @apiParam {String} firstname Firstname of the User
 * @apiParam {String} lastname Lastname of the User
 * @apiParam {String=one,two,three} enum-string=two Enum string field
 * @apiParam {Integer{1-10}} enum-numeric=5 Enum number field
 * @apiParam {Number|double} enum-float=0.9 Enum float field
 * @apiParam {FooBar} foo-bar FooBar field
 * @apiParam {String[]} [string-array] Array of strings
 * @apiParam {Object} objective Object field
 * @apiParam {Number} objective.number Number field
 * @apiParam {String} [objective.string] String field
 * @apiParam {Array} array Array field
 * @apiParam {String|date} date Date format field
 * @apiParam {String|date-time} datetime Datetime format field
 *
 * @apiParamExample {json} Create user example:
 *     {
 *       "firstname": "Hello",
 *       "lastname": "World"
 *     }
 *
 * @apiSuccess {Number} id ID of the User
 * @apiSuccess {String} firstname Firstname of the User
 * @apiSuccess {String} lastname Lastname of the User
 *
 * @apiSuccessExample {json} Success response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id": 1,
 *       "firstname": "Hello",
 *       "lastname": "World"
 *     }
 *
 * @apiSuccessExample {json} Success response:
 *     HTTP/1.1 204 NO CONTENT
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
