import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      test("With unique valid data", async () => {
        const response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            username: "emailduplicado1",
            email: "duplicado@curso.dev",
            password: "senha123",
          }),
        });

        expect(response.status).toBe(201);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: responseBody.id,
          username: "emailduplicado1",
          email: "duplicado@curso.dev",
          password: responseBody.password,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        const userInDatabase = await user.findOneByUsername("emailduplicado1");
        const correctPasswordMatch = await password.compare(
          "senha123",
          userInDatabase.password,
        );
        const incorrectPasswordMatch = await password.compare(
          "Senha123",
          userInDatabase.password,
        );
        expect(correctPasswordMatch).toBe(true);
        expect(incorrectPasswordMatch).toBe(false);
      });
      test("With duplicated 'email'", async () => {
        const response2 = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            username: "emailduplicado2",
            email: "duplicado@curso.dev",
            password: "senha123",
          }),
        });

        expect(response2.status).toBe(400);
        const response2Body = await response2.json();
        expect(response2Body).toEqual({
          name: "ValidationError",
          message: "O Email informado já está sendo utilizado.",
          action: "Utilize outro email para realizar esta operação.",
          status_code: 400,
        });
      });
      test("With duplicated 'username'", async () => {
        const response3 = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            username: "emailduplicado1",
            email: "duplicado2@curso.dev",
            password: "senha123",
          }),
        });
      });
    });
  });
});
