import { server } from "./mocks/server";
import { beforeAll, afterEach, afterAll } from "vitest";

// Start the server before all tests
beforeAll(() => server.listen());

// Reset any request handlers between tests (good practice in case a test overrides them)
afterEach(() => server.resetHandlers());

// Close the server after all tests are finished
afterAll(() => server.close());
