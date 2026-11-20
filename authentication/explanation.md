# JWT Authentication System --- Access & Refresh Token Rotation

A learning project implementing a JWT-based authentication system with
**Express.js, MongoDB, Mongoose, bcrypt, and HTTP-only cookies**.

The project uses two JWTs with separate secrets and expiration periods:

-   **Access token:** short-lived credential for protected API requests.
-   **Refresh token:** longer-lived credential used to obtain a new
    access/refresh token pair.

> **Project status:** Learning implementation. Registration, login,
> access-token middleware, current-user route, and refresh-token
> rotation are present. Logout, robust session management,
> concurrency-safe rotation, comprehensive validation, and production
> hardening are not yet implemented.

------------------------------------------------------------------------

## Table of contents

1.  [Project goals](#project-goals)
2.  [Tech stack](#tech-stack)
3.  [Authentication concepts](#authentication-concepts)
4.  [Architecture](#architecture)
5.  [Token lifecycle](#token-lifecycle)
6.  [File-by-file explanation](#file-by-file-explanation)
7.  [API reference](#api-reference)

------------------------------------------------------------------------

## Project goals

The purpose of this project is to understand and implement the
fundamentals of backend authentication:

-   Register users and store passwords securely.
-   Authenticate users with email and password.
-   Issue separate access and refresh JWTs.
-   Protect routes with Express middleware.
-   Store refresh tokens as bcrypt hashes in MongoDB.
-   Use an HTTP-only cookie to transport the refresh token.
-   Rotate the refresh token when a valid refresh request is received.
-   Retrieve the currently authenticated user's profile.

This project is intended as a hands-on learning implementation, not a
claim of production-ready authentication.

## Tech stack

  Technology      Responsibility
  --------------- ------------------------------------
  Node.js         JavaScript runtime
  Express.js      HTTP server and routing
  MongoDB         Persistent user storage
  Mongoose        MongoDB object modeling
  jsonwebtoken    JWT signing and verification
  bcrypt          Password and refresh-token hashing
  cookie-parser   Parsing cookies into `req.cookies`
  dotenv          Loading environment variables

------------------------------------------------------------------------

## Authentication concepts

### 1. Access token

An access token is a short-lived JWT sent by the client when accessing
protected endpoints.

Current configuration:

-   Secret: `ACCESS_TOKEN`
-   Expiration: `15m`
-   Transport: `Authorization: Bearer <access-token>`

The authentication middleware verifies this token before allowing access
to protected routes.

### 2. Refresh token

A refresh token is a longer-lived JWT used to obtain a new token pair
without asking the user to enter their password again.

Current configuration:

-   Secret: `REFRESH_TOKEN`
-   Expiration: `7d`
-   Transport: HTTP-only cookie named `refresh_token`
-   Database storage: bcrypt hash in the user's `refreshtoken` field

The original refresh token is not stored in MongoDB.

### 3. Why use two tokens?

A short-lived access token limits the useful lifetime of a stolen access
token. The refresh token allows the user to continue their session
without repeatedly logging in.

The refresh token is more sensitive because it can be exchanged for new
access tokens. It is therefore kept in an HTTP-only cookie and checked
against server-side stored state.

### 4. JWT structure

A JWT has three Base64URL-encoded sections:

`header.payload.signature`

-   **Header:** identifies the token type and signing algorithm.
-   **Payload:** carries claims such as the user ID and email, plus
    issued-at and expiration claims.
-   **Signature:** allows the server to verify that the token was signed
    using the expected secret.

JWT payloads are encoded, not encrypted. Do not put passwords, secrets,
or sensitive personal information in them.

### 5. `jwt.sign()` vs `jwt.verify()` vs `jwt.decode()`

-   `jwt.sign()` creates a signed JWT.
-   `jwt.verify()` validates the signature and relevant claims,
    including expiration.
-   `jwt.decode()` reads the payload but does not validate the
    signature.

Never trust a decoded token from a client without verifying it.

### 6. Why bcrypt is used

Passwords and refresh tokens are stored as bcrypt hashes.

-   `bcrypt.hash(value, 12)` creates a salted password hash.
-   `bcrypt.compare(plainValue, storedHash)` checks whether an incoming
    value matches the stored hash.

Bcrypt is intentionally one-way. The original value is not decrypted
from the hash.

------------------------------------------------------------------------

## Architecture

``` text
                         CLIENT
                            |
              +-------------+-------------+
              |                           |
         Login request              Protected request
              |                           |
              v                           v
       POST /login                  GET /me
              |                           |
              v                           v
       logcontroller               authmiddleware
              |                           |
       Verify password              Verify access JWT
              |                           |
       Generate A1 + R1              Attach req.user
              |                           |
       Hash R1 in MongoDB             mecontroller
              |                           |
       Set R1 cookie                  Query MongoDB
              |                           |
       Return A1                      Return profile


                    ACCESS TOKEN EXPIRES
                            |
                            v
                    POST /refresh
                            |
                  Read refresh_token cookie
                            |
                  Verify refresh JWT
                            |
                   Find user in MongoDB
                            |
                  bcrypt.compare(R1, hash)
                            |
                  Generate A2 + R2
                            |
                    Hash R2 in MongoDB
                            |
                    Replace cookie with R2
                            |
                    Return A2 to client
```

------------------------------------------------------------------------

## Token lifecycle

### Login

1.  Client submits email and password.
2.  Server finds the user by email.
3.  bcrypt compares the submitted password with the stored password
    hash.
4.  If credentials are valid, the server generates an access token and
    refresh token.
5.  The refresh token is hashed and saved in MongoDB.
6.  The original refresh token is sent in an HTTP-only cookie.
7.  The access token is returned in the JSON response.

### Protected request

1.  Client sends the access token in the `Authorization` header.
2.  `authmiddleware` extracts the Bearer token.
3.  `verifyaccesstoken()` verifies it with the access-token secret.
4.  The verified payload is attached to `req.user`.
5.  `next()` passes control to the route controller.
6.  The controller can use `req.user.userid` to identify the requester.

### Refresh and rotation

1.  Browser sends the refresh-token cookie to `/refresh`.
2.  Controller reads `req.cookies.refresh_token`.
3.  `verifyrefreshtoken()` verifies the JWT using the refresh-token
    secret.
4.  Controller reads the user ID from the verified payload and finds the
    user.
5.  bcrypt compares the incoming refresh token with the stored hash.
6.  If the comparison succeeds, a new access token and refresh token are
    generated.
7.  The new refresh token is hashed and saved in MongoDB.
8.  The browser receives the new refresh token cookie.
9.  The new access token is returned in JSON.

The intended state transition is:

  Location                 Before rotation     After rotation
  ------------------------ ------------------- -------------------
  Browser access token     A1                  A2
  Browser refresh cookie   R1                  R2
  MongoDB                  bcrypt hash of R1   bcrypt hash of R2

After successful rotation, R1 no longer matches the stored hash.


------------------------------------------------------------------------

## File-by-file explanation

### `configuri.js`

Loads environment variables using `dotenv/config` and exposes a central
configuration object.

Current configuration keys:

-   `PORT`
-   `ACCESS_TOKEN`
-   `REFRESH_TOKEN`
-   `MONGO_URI`

The uploaded implementation reads lowercase environment names (`port`,
`access_token`, `refresh_token`, `mongo_uri`). The `.env` names must
match exactly unless the code is changed.

### `utils.js`

Contains three reusable JWT functions:

**`generatetoken(payload)`**

Signs two tokens using separate secrets:

-   Access token expires in 15 minutes.
-   Refresh token expires in 7 days.

Returns `{ accesstoken, refreshtoken }`.

**`verifyaccesstoken(token)`**

Verifies an access token using `ACCESS_TOKEN` and returns the verified
payload.

**`verifyrefreshtoken(token)`**

Verifies a refresh token using `REFRESH_TOKEN` and returns the verified
payload.

### `usermodel.js`

Defines the Mongoose user schema:

  Field            Purpose
  ---------------- -------------------------------------------
  `username`       User's name; minimum length of 3
  `email`          Required, unique, lowercase, trimmed
  `password`       Required password hash
  `refreshtoken`   Optional stored bcrypt refresh-token hash
  `createdAt`      Automatically added timestamp
  `updatedAt`      Automatically updated timestamp

The current design stores one refresh-token hash per user. It therefore
represents one active refresh-token session per user, rather than
independent sessions for multiple devices.

### `regController.js`

Registration flow:

1.  Reads `email`, `username`, and `password` from `req.body`.
2.  Checks whether the email already exists.
3.  Returns `409` if a matching user is found.
4.  Hashes the password with bcrypt.
5.  Creates the user document.
6.  Generates an access token.
7.  Returns a registration response.

**Implementation note:** The uploaded registration controller uses
`userId` in its JWT payload, while login, refresh, and middleware use
`userid`. Standardize the claim name. The registration controller also
returns an access token without creating a refresh-token session; a
simpler design is to register successfully and have the user log in
separately.

### `logcontroller.js`

Login flow:

1.  Reads email and login password from the request body.
2.  Finds the user by email.
3.  Compares the submitted password with the stored bcrypt hash.
4.  Generates an access token and refresh token.
5.  Sets the refresh token in the `refresh_token` cookie.
6.  Hashes the refresh token and saves the hash in MongoDB.
7.  Returns the access token in JSON.

**Implementation note:** Save the new refresh-token hash successfully
before setting the cookie and sending the response. The current cookie
options include `httpOnly` and `maxAge`; deployment-specific `secure`
and `sameSite` settings still need to be configured.

### `middleware.js`

Protects routes that require a valid access token.

Execution:

1.  Reads `req.headers.authorization`.
2.  Checks that the header exists.
3.  Checks for the Bearer prefix.
4.  Extracts the token.
5.  Calls `verifyaccesstoken()`.
6.  Attaches the verified payload to `req.user`.
7.  Calls `next()` to continue to the controller.

`req.user` is a custom property attached to the request object. It is
not automatically created by Express.

Because each HTTP request has its own request object, this does not
store one user's identity globally.


### `mecontroller.js`

Intended purpose:

-   Read the authenticated user's ID from `req.user.userid`.
-   Find the user in MongoDB.
-   Return the current user's profile.


### `refreshcontroller.js`

Implements refresh-token rotation:

1.  Reads `req.cookies.refresh_token`.
2.  Verifies the refresh JWT.
3.  Finds the user using the verified payload's `userid`.
4.  Checks that a refresh-token hash exists.
5.  Compares the incoming token against the stored hash with bcrypt.
6.  Generates a new access and refresh token pair.
7.  Hashes the new refresh token.
8.  Replaces the old hash in MongoDB and saves the user.
9.  Sets the new refresh token cookie.
10. Returns the new access token.

The refresh route does not use access-token middleware because it
authenticates the refresh request through the refresh cookie.

**Known limitation:** The uploaded controller rejects a refresh-token
hash mismatch but does not implement session-family reuse detection or
concurrency-safe atomic rotation.

### `auth.routes.js`

Mounts these authentication endpoints:

``` js
router.post("/reg", regusercontroller);
router.post("/login", logcontroller);
router.get("/me", authmiddleware, mecontroller);
router.post("/refresh", refreshcontroller);
```

### `app.js`

Creates the Express application and installs:

-   `express.json()` to parse JSON bodies.
-   `cookieParser()` to parse cookies.
-   The authentication router under `/api/auth`.

### `db.js`

Exports `dbconnection()`, which connects Mongoose to MongoDB using
`configuri.MONGO_URI`.

**Implementation note:** The current catch block logs a generic message
and swallows the error. The application startup should fail if the
initial database connection fails, rather than silently continuing
without the database.

------------------------------------------------------------------------

## API reference

The router is mounted at `/api/auth`.

  Method   Endpoint              Purpose                   Authentication
  -------- --------------------- ------------------------- ----------------
  POST     `/api/auth/reg`       Register a user           Public
  POST     `/api/auth/login`     Log in and issue tokens   Public
  GET      `/api/auth/me`        Retrieve current user     Access JWT
  POST     `/api/auth/refresh`   Rotate tokens             Refresh cookie

### 1. Register

`POST /api/auth/reg`

Example request:

``` json
{
  "username": "example-user",
  "email": "user@example.com",
  "password": "example-password"
}
```

The password is hashed before it is saved.

### 2. Login

`POST /api/auth/login`

Example request:

``` json
{
  "email": "user@example.com",
  "loginpass": "example-password"
}
```

Expected successful behavior:

-   Access token in JSON.
-   Refresh token in an HTTP-only cookie.
-   Bcrypt refresh-token hash saved in MongoDB.

### 3. Current user

`GET /api/auth/me`

Request header:

``` http
Authorization: Bearer <access-token>
```

The middleware verifies the access token before the controller executes.

Expected behavior after fixing the missing `await` and safe response
projection:

``` json
{
  "message": "User Found",
  "user": {
    "id": "USER_ID",
    "username": "example-user",
    "email": "user@example.com"
  }
}
```

The password and refresh-token hash must never be returned.

### 4. Refresh tokens

`POST /api/auth/refresh`

The browser sends the `refresh_token` cookie when cookie policy and
request credentials allow it.

Expected successful behavior:

-   Refresh JWT verified.
-   User found.
-   Incoming token matches stored bcrypt hash.
-   New token pair generated.
-   New refresh-token hash saved.
-   New refresh cookie set.
-   New access token returned in JSON.

------------------------------------------------------------------------

## Learning outcomes

By building this project, the main concepts practiced are:

-   Express routing and middleware execution.
-   Password hashing and bcrypt comparison.
-   JWT signing, verification, and expiration.
-   Access-token and refresh-token responsibilities.
-   HTTP-only cookie handling.
-   MongoDB persistence through Mongoose.
-   Passing authenticated identity through `req.user`.
-   Refresh-token rotation and server-side token state.
-   Authentication vs authorization.
-   Security trade-offs in session management.

**The central mental model:**

> Login establishes an authenticated session. The access token
> authenticates ordinary protected requests. The refresh token renews
> that session. MongoDB stores the hashed refresh-token state that the
> server uses to decide whether a refresh token is still accepted.
