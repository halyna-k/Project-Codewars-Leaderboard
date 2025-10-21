import test from "node:test";
import assert from "node:assert";
import nock from "nock";
import { API_BASE, fetchUsers } from "./helpers.mjs";

// Helper to mock a user response
function mockUser(username, response, status = 200) {
  nock(API_BASE).get(`/${username}`).reply(status, response);
}

// Helper to assert results
function assertResult(result, expectedValid, expectedInvalid) {
  assert.deepStrictEqual(result.valid, expectedValid);
  assert.deepStrictEqual(result.invalid, expectedInvalid);
  assert(nock.isDone(), "Not all mocked requests were made");
}

// Mix of valid + invalid users
test("mocks fetchUsers with valid and invalid users", async () => {
  const usernames = ["CodeYourFuture", "InvalidUser"];

  mockUser("CodeYourFuture", {
    username: "CodeYourFuture",
    clan: "TestClan",
    ranks: { overall: { score: 123 }, languages: { javascript: { score: 50 } } },
  });
  mockUser("InvalidUser", {}, 404);

  const result = await fetchUsers(usernames);

  assertResult(
    result,
    [
      {
        username: "CodeYourFuture",
        clan: "TestClan",
        score: 123,
        languages: { javascript: { score: 50 } },
      },
    ],
    [{ name: "InvalidUser", reason: "User not found" }]
  );
});

// Multiple valid users
test("handles multiple valid users", async () => {
  const usernames = ["SallyMcGrath", "40thieves"];

  mockUser("SallyMcGrath", { username: "SallyMcGrath", clan: "A", ranks: { overall: { score: 10 }, languages: {} } });
  mockUser("40thieves", { username: "40thieves", clan: "B", ranks: { overall: { score: 20 }, languages: {} } });

  const result = await fetchUsers(usernames);

  assertResult(
    result,
    [
      { username: "SallyMcGrath", clan: "A", score: 10, languages: {} },
      { username: "40thieves", clan: "B", score: 20, languages: {} },
    ],
    []
  );
});

// Multiple invalid users
test("handles multiple invalid users", async () => {
  const usernames = ["User1", "User2"];

  mockUser("User1", {}, 404);
  mockUser("User2", {}, 404);

  const result = await fetchUsers(usernames);

  assertResult(
    result,
    [],
    [
      { name: "User1", reason: "User not found" },
      { name: "User2", reason: "User not found" },
    ]
  );
});

// User with missing fields
test("handles users with missing fields", async () => {
  const usernames = ["User"];

  mockUser("User", { username: "User", clan: null, ranks: {} });

  const result = await fetchUsers(usernames);

  assertResult(
    result,
    [{ username: "User", clan: null, score: 0, languages: {} }],
    []
  );
});

// Empty username list
test("handles empty username list", async () => {
  const result = await fetchUsers([]);
  assertResult(result, [], []);
});

// API error (500)
test("handles API error (500)", async () => {
  const usernames = ["Error"];
  mockUser("Error", {}, 500);

  const result = await fetchUsers(usernames);

  assertResult(
    result,
    [],
    [{ name: "Error", reason: "API error" }]
  );
});
