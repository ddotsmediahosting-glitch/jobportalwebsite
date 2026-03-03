if (typeof document !== "undefined") {
  const jobForm = document.getElementById("jobForm");
  const jobList = document.getElementById("jobList");
  const searchInput = document.getElementById("searchInput");
  const jobCount = document.getElementById("jobCount");
  const emptyState = document.getElementById("emptyState");

  const jobs = [
    {
      title: "Backend Developer",
      company: "Northwind Tech",
      location: "Remote",
      url: "https://example.com/jobs/backend"
    },
    {
      title: "UI Designer",
      company: "Bluebird Labs",
      location: "San Francisco",
      url: "https://example.com/jobs/ui-designer"
    }
  ];

  function renderJobs(filterText = "") {
    const query = filterText.trim().toLowerCase();

    const filtered = jobs.filter((job) => {
      const combined = `${job.title} ${job.company} ${job.location}`.toLowerCase();
      return combined.includes(query);
    });

    jobList.innerHTML = "";

    filtered.forEach((job) => {
      const li = document.createElement("li");
      li.className = "job-item";
      li.innerHTML = `
        <h3>${job.title}</h3>
        <p class="meta">${job.company} | ${job.location}</p>
        <a href="${job.url}" target="_blank" rel="noopener noreferrer">Open Job Link</a>
      `;
      jobList.appendChild(li);
    });

    jobCount.textContent = `${filtered.length} job${filtered.length === 1 ? "" : "s"}`;
    emptyState.style.display = filtered.length === 0 ? "block" : "none";
  }

  jobForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const company = document.getElementById("company").value.trim();
    const location = document.getElementById("location").value.trim();
    const url = document.getElementById("url").value.trim();

    if (!title || !company || !location || !url) {
      return;
    }

    jobs.unshift({ title, company, location, url });
    jobForm.reset();
    renderJobs(searchInput.value);
  });

  searchInput.addEventListener("input", (event) => {
    renderJobs(event.target.value);
  });

  renderJobs();
}
