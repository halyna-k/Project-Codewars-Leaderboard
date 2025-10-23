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
  if (!users.length) return;

  const highlight = users.length > 1;
  const maxScore = Math.max(...users.map(u => u.score));

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
      if (highlight && user.score === maxScore) row.classList.add("top-score");
      tableBody.appendChild(row);
    });
}

export async function fetchUsers(usernames) {
  const valid = [];
  const invalid = [];

  await Promise.all(
    usernames.map(async (name) => {
      try {
        const res = await fetch(`${API_BASE}/${name.trim()}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("User not found");
          throw new Error("API error");
        }

        const data = await res.json();

        valid.push({
          username: data.username,
          clan: data.clan,
          score: data.ranks?.overall?.score ?? 0,
          languages: data.ranks?.languages ?? {},
        });
      } catch (err) {
        invalid.push({ name, reason: err.message });
      }
    })
  );

  return { valid, invalid };
}

export function populateRankOptions(selectEl, users) {
  if (!selectEl.options.length) return;

  while (selectEl.options.length > 1) selectEl.remove(1);

  const firstOption = selectEl.options[0];
  firstOption.textContent = "Overall";
  firstOption.value = "overall";

  const languages = new Set();
  users.forEach(user => Object.keys(user.languages).forEach(lang => languages.add(lang)));

  [...languages].sort().forEach(lang => {
    const option = document.createElement("option");
    option.value = lang;
    option.textContent = lang[0].toUpperCase() + lang.slice(1);
    selectEl.appendChild(option);
  });
}

export function handleRankChange(selectEl, tableBody, users, errorDiv) {
  selectEl.addEventListener("change", () => {
    const rank = selectEl.value;
    if (!rank) return;

    const filteredUsers = users
      .map(user => {
        const score = rank === "overall" ? user.score : user.languages[rank]?.score;
        if (score === undefined) return null;
        return { ...user, score };
      })
      .filter(Boolean);

    if (!filteredUsers.length) {
      tableBody.innerHTML = "";
      showError(errorDiv, `No users have a ranking for "${rank}"`);
      return;
    }

    clearError(errorDiv);
    renderTable(tableBody, filteredUsers);
  });
}
