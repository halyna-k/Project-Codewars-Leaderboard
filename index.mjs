import { fetchUsers, showError, clearError, renderTable, populateRankOptions, handleRankChange } from "./helpers.mjs";

const render = () => {
  const form = document.getElementById("user-form");
  const input = document.getElementById("users-input");
  const errorDiv = document.getElementById("error");
  const tableBody = document.querySelector("#leaderboard-table tbody");
  const rankSelect = document.querySelector("#rank-select");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError(errorDiv);

    const usernames = input.value.split(",").map(u => u.trim()).filter(Boolean);

    if (!usernames.length) {
      showError(errorDiv, "Please enter at least one username.");
      tableBody.textContent = "";
      rankSelect.disabled = true;
      return;
    }

    try {
      const { valid, invalid } = await fetchUsers(usernames);

      if (invalid.length) {
        const names = invalid.map(u => u.name).join(", ");
        const userWord = invalid.length === 1 ? "User" : "Users";
        showError(errorDiv, `${userWord} ${names} not found`);
      } else {
        clearError(errorDiv);
      }

      if (valid.length) {
        renderTable(tableBody, valid);
        populateRankOptions(rankSelect, valid);
        rankSelect.disabled = false;
        handleRankChange(rankSelect, tableBody, valid, errorDiv);
      }

      // input.value = "";
    } catch (err) {
      console.error(err);
      showError(errorDiv, "Network or API error. Check your connection or try again later.");
    }
  });
};

document.addEventListener("DOMContentLoaded", render);
