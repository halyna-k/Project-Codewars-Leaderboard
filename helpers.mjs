export const API_BASE = "https://www.codewars.com/api/v1/users";

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
        <td scope="row">${index + 1}</td>
        <td>${user.username}</td>
        <td>${user.clan || "-"}</td>
        <td>${user.score.toLocaleString()}</td>
      `;
      row.setAttribute("tabindex", "0");
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

export function populateRankOptions(selectEl, users) {
  // Remove previous language options, keep the first option
  while (selectEl.options.length > 1) selectEl.remove(1);

  // Set first option as "Overall"
  const firstOption = selectEl.options[0];
  firstOption.textContent = "Overall";
  firstOption.value = "overall";

  // Collect unique language keys
  const languages = new Set();
  users.forEach(user => Object.keys(user.languages).forEach(lang => languages.add(lang)));

  // Convert to sorted array
  const sortedLanguages = [...languages].sort();

  // Add languages options dynamically
  sortedLanguages.forEach(lang => {
    const option = document.createElement("option");
    option.value = lang;
    option.textContent = lang[0].toUpperCase() + lang.slice(1);
    selectEl.appendChild(option);
  });
}

export function handleRankChange(selectEl, tableBody, users) {
  selectEl.addEventListener("change", () => {
    const rank = selectEl.value;

    const filteredUsers = users
      .map(user => {
        let score = rank === "overall" ? user.score : user.languages[rank]?.score;
        if (score === undefined) return null;
        return { ...user, score };
      })
      .filter(Boolean);

    renderTable(tableBody, filteredUsers);
  });
}
