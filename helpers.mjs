const API_BASE = "https://www.codewars.com/api/v1/users";

export const showError = (el, message) => {
  el.textContent = message;
  el.hidden = false;
};

export const clearError = (el) => {
  el.textContent = "";
  el.hidden = true;
};

export function renderTable(tableBody, users) {
  tableBody.innerHTML = "";

  users
    .sort((a, b) => b.score - a.score)
    .forEach((user, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${user.username}</td>
        <td>${user.clan || "-"}</td>
        <td>${user.score.toLocaleString()}</td>
      `;
      tableBody.appendChild(row);
    });
}

export async function fetchUsers(usernames) {
  const valid = [];
  const invalid = [];

  await Promise.all(
    usernames.map(async (name) => {

      try {
        const res = await fetch(`${API_BASE}/${name}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("User not found");
          throw new Error("API error");
        }

        const data = await res.json();

        valid.push({
          username: data.username,
          clan: data.clan,
          score: data.ranks?.overall?.score ?? 0,
          languages: data.ranks?.languages || {},
        });
      } catch (err) {
        invalid.push({ name: name, reason: err.message });
      }
    })
  );

  return { valid, invalid };
}
